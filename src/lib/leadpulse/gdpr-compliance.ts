/**
 * LeadPulse GDPR Compliance Manager
 * 
 * Handles GDPR compliance requirements for data processing
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { leadPulseSecurityManager } from './security-manager';

interface ConsentRequest {
  email: string;
  consentType: 'MARKETING' | 'ANALYTICS' | 'FUNCTIONAL' | 'NECESSARY' | 'THIRD_PARTY_SHARING';
  purpose: string;
  granted: boolean;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  evidenceUrl?: string;
}

interface DataSubjectRequest {
  type: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'PORTABILITY' | 'OBJECTION';
  email: string;
  requestDetails?: string;
  verificationMethod?: string;
}

interface DataProcessingActivity {
  type: 'COLLECTION' | 'PROCESSING' | 'SHARING' | 'DELETION';
  dataSubject: string;
  dataTypes: string[];
  purpose: string;
  legalBasis: string;
  processor?: string;
}

export class GDPRComplianceManager {
  
  /**
   * Record consent for data processing
   */
  async recordConsent(consentData: ConsentRequest) {
    try {
      // Check if consent already exists
      const existingConsent = await prisma.leadPulseConsent.findFirst({
        where: {
          email: consentData.email,
          consentType: consentData.consentType,
          purpose: consentData.purpose
        },
        orderBy: { createdAt: 'desc' }
      });

      // Create new consent record
      const consent = await prisma.leadPulseConsent.create({
        data: {
          email: consentData.email,
          consentType: consentData.consentType,
          purpose: consentData.purpose,
          granted: consentData.granted,
          grantedAt: consentData.granted ? new Date() : null,
          withdrawnAt: !consentData.granted && existingConsent?.granted ? new Date() : null,
          ipAddress: consentData.ipAddress,
          userAgent: consentData.userAgent,
          source: consentData.source,
          evidenceUrl: consentData.evidenceUrl
        }
      });

      // Log the consent activity
      await leadPulseSecurityManager.logDataProcessingActivity({
        type: consentData.granted ? 'COLLECTION' : 'RESTRICTION',
        dataSubject: consentData.email,
        dataTypes: ['consent'],
        purpose: consentData.purpose,
        legalBasis: 'consent'
      });

      logger.info('Consent recorded', {
        email: consentData.email,
        consentType: consentData.consentType,
        granted: consentData.granted,
        consentId: consent.id
      });

      return { success: true, consentId: consent.id };

    } catch (error) {
      logger.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Check if data processing is allowed based on consent
   */
  async checkProcessingConsent(
    email: string, 
    consentType: ConsentRequest['consentType'],
    purpose?: string
  ): Promise<{ allowed: boolean; consentDate?: Date; reason?: string }> {
    try {
      const whereClause: any = {
        email,
        consentType,
        granted: true,
        withdrawnAt: null
      };

      if (purpose) {
        whereClause.purpose = purpose;
      }

      const validConsent = await prisma.leadPulseConsent.findFirst({
        where: whereClause,
        orderBy: { grantedAt: 'desc' }
      });

      if (!validConsent) {
        return {
          allowed: false,
          reason: `No valid consent found for ${consentType} processing`
        };
      }

      // Check if consent is still valid (not older than 2 years for marketing)
      if (consentType === 'MARKETING' && validConsent.grantedAt) {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        if (validConsent.grantedAt < twoYearsAgo) {
          return {
            allowed: false,
            reason: 'Consent has expired (older than 2 years)'
          };
        }
      }

      return {
        allowed: true,
        consentDate: validConsent.grantedAt || undefined
      };

    } catch (error) {
      logger.error('Error checking consent:', error);
      return {
        allowed: false,
        reason: 'Error checking consent status'
      };
    }
  }

  /**
   * Handle data subject access request (Article 15)
   */
  async handleAccessRequest(email: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Log the access request
      await leadPulseSecurityManager.logDataProcessingActivity({
        type: 'ACCESS',
        dataSubject: email,
        dataTypes: ['personal_data'],
        purpose: 'Data subject access request',
        legalBasis: 'legal_obligation'
      });

      // Collect all personal data for this email
      const [
        contacts,
        visitors,
        formSubmissions,
        touchpoints,
        consents,
        auditLogs
      ] = await Promise.all([
        // Contact data
        prisma.contact.findMany({
          where: { email },
          include: {
            customFields: true,
            tags: true,
            segments: true
          }
        }),
        
        // Visitor data
        prisma.leadPulseVisitor.findMany({
          where: {
            OR: [
              { metadata: { path: ['email'], equals: email } },
              // Add other email matching logic as needed
            ]
          },
          include: {
            touchpoints: true,
            formSubmissions: true
          }
        }),

        // Form submissions
        prisma.leadPulseFormSubmission.findMany({
          where: {
            OR: [
              { contact: { email } },
              { data: { some: { fieldName: 'email', value: email } } }
            ]
          },
          include: {
            data: true,
            form: true
          }
        }),

        // Touchpoints
        prisma.leadPulseTouchpoint.findMany({
          where: {
            metadata: {
              path: ['email'],
              equals: email
            }
          }
        }),

        // Consent records
        prisma.leadPulseConsent.findMany({
          where: { email }
        }),

        // Audit logs
        prisma.leadPulseAuditLog.findMany({
          where: {
            OR: [
              { userEmail: email },
              { metadata: { path: ['email'], equals: email } }
            ]
          }
        })
      ]);

      // Mask sensitive data according to GDPR requirements
      const maskedData = {
        contacts: contacts.map(contact => this.maskSensitiveContactData(contact)),
        visitors: visitors.map(visitor => this.maskSensitiveVisitorData(visitor)),
        formSubmissions: formSubmissions.map(submission => this.maskSensitiveSubmissionData(submission)),
        touchpoints: touchpoints.map(touchpoint => this.maskSensitiveTouchpointData(touchpoint)),
        consents,
        auditLogs: auditLogs.map(log => this.maskSensitiveAuditData(log)),
        summary: {
          totalContacts: contacts.length,
          totalVisitors: visitors.length,
          totalFormSubmissions: formSubmissions.length,
          totalTouchpoints: touchpoints.length,
          totalConsents: consents.length,
          dataProcessingActivities: auditLogs.length
        }
      };

      return { success: true, data: maskedData };

    } catch (error) {
      logger.error('Error handling access request:', error);
      return {
        success: false,
        error: 'Failed to process access request'
      };
    }
  }

  /**
   * Handle data erasure request (Article 17 - Right to be forgotten)
   */
  async handleErasureRequest(
    email: string,
    reason = 'Data subject erasure request'
  ): Promise<{ success: boolean; deletedItems?: any; error?: string }> {
    try {
      // Log the erasure request
      await leadPulseSecurityManager.logDataProcessingActivity({
        type: 'DELETION',
        dataSubject: email,
        dataTypes: ['personal_data'],
        purpose: reason,
        legalBasis: 'legal_obligation'
      });

      const deletedItems = {
        contacts: 0,
        visitors: 0,
        formSubmissions: 0,
        touchpoints: 0,
        consents: 0
      };

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Delete or anonymize contact data
        const contactsToDelete = await tx.contact.findMany({
          where: { email },
          select: { id: true }
        });

        for (const contact of contactsToDelete) {
          // Delete related data first
          await tx.customField.deleteMany({
            where: { contactId: contact.id }
          });
          
          await tx.contactTag.deleteMany({
            where: { contactId: contact.id }
          });
          
          // Delete the contact
          await tx.contact.delete({
            where: { id: contact.id }
          });
          
          deletedItems.contacts++;
        }

        // Delete or anonymize visitor data
        const visitorsToDelete = await tx.leadPulseVisitor.findMany({
          where: {
            OR: [
              { metadata: { path: ['email'], equals: email } }
            ]
          },
          select: { id: true }
        });

        for (const visitor of visitorsToDelete) {
          // Delete related touchpoints
          await tx.leadPulseTouchpoint.deleteMany({
            where: { visitorId: visitor.id }
          });
          
          // Delete form submissions
          await tx.leadPulseFormSubmission.deleteMany({
            where: { visitorId: visitor.id }
          });
          
          // Delete the visitor
          await tx.leadPulseVisitor.delete({
            where: { id: visitor.id }
          });
          
          deletedItems.visitors++;
        }

        // Delete form submissions by email
        const submissionsToDelete = await tx.leadPulseFormSubmission.findMany({
          where: {
            OR: [
              { contact: { email } },
              { data: { some: { fieldName: 'email', value: email } } }
            ]
          },
          select: { id: true }
        });

        for (const submission of submissionsToDelete) {
          await tx.leadPulseSubmissionData.deleteMany({
            where: { submissionId: submission.id }
          });
          
          await tx.leadPulseFormSubmission.delete({
            where: { id: submission.id }
          });
          
          deletedItems.formSubmissions++;
        }

        // Delete standalone touchpoints
        const touchpointsDeleted = await tx.leadPulseTouchpoint.deleteMany({
          where: {
            metadata: {
              path: ['email'],
              equals: email
            }
          }
        });
        deletedItems.touchpoints = touchpointsDeleted.count;

        // Update consent records to show withdrawal
        const consentsUpdated = await tx.leadPulseConsent.updateMany({
          where: { email },
          data: {
            granted: false,
            withdrawnAt: new Date()
          }
        });
        deletedItems.consents = consentsUpdated.count;

        // Create data retention record
        await tx.leadPulseDataRetention.create({
          data: {
            resource: 'contact',
            resourceId: email,
            dataType: 'personal_data',
            retentionPeriod: 0, // Immediate deletion
            scheduledDeletion: new Date(),
            deleted: true,
            deletedAt: new Date()
          }
        });
      });

      logger.info('Data erasure completed', {
        email,
        deletedItems,
        reason
      });

      return { success: true, deletedItems };

    } catch (error) {
      logger.error('Error handling erasure request:', error);
      return {
        success: false,
        error: 'Failed to process erasure request'
      };
    }
  }

  /**
   * Handle data portability request (Article 20)
   */
  async handlePortabilityRequest(email: string): Promise<{
    success: boolean;
    data?: any;
    format?: string;
    error?: string;
  }> {
    try {
      // Log the portability request
      await leadPulseSecurityManager.logDataProcessingActivity({
        type: 'PORTABILITY',
        dataSubject: email,
        dataTypes: ['personal_data'],
        purpose: 'Data portability request',
        legalBasis: 'legal_obligation'
      });

      // Get structured, machine-readable data
      const accessResult = await this.handleAccessRequest(email);
      
      if (!accessResult.success || !accessResult.data) {
        return {
          success: false,
          error: 'Failed to retrieve data for portability'
        };
      }

      // Format data in a structured, commonly used format (JSON)
      const portableData = {
        dataSubject: email,
        exportDate: new Date().toISOString(),
        format: 'JSON',
        data: accessResult.data
      };

      return {
        success: true,
        data: portableData,
        format: 'application/json'
      };

    } catch (error) {
      logger.error('Error handling portability request:', error);
      return {
        success: false,
        error: 'Failed to process portability request'
      };
    }
  }

  /**
   * Automatic data retention management
   */
  async processDataRetention() {
    try {
      const now = new Date();
      
      // Find data scheduled for deletion
      const itemsToDelete = await prisma.leadPulseDataRetention.findMany({
        where: {
          scheduledDeletion: { lte: now },
          deleted: false
        }
      });

      let processedItems = 0;
      
      for (const item of itemsToDelete) {
        try {
          // Process deletion based on resource type
          switch (item.resource) {
            case 'contact':
              await this.handleErasureRequest(item.resourceId, 'Automatic data retention');
              break;
            
            case 'visitor':
              await prisma.leadPulseVisitor.delete({
                where: { id: item.resourceId }
              });
              break;
            
            case 'touchpoint':
              await prisma.leadPulseTouchpoint.delete({
                where: { id: item.resourceId }
              });
              break;
          }

          // Mark as deleted
          await prisma.leadPulseDataRetention.update({
            where: { id: item.id },
            data: {
              deleted: true,
              deletedAt: now
            }
          });

          processedItems++;

        } catch (error) {
          logger.error(`Error deleting ${item.resource} ${item.resourceId}:`, error);
        }
      }

      logger.info(`Data retention processing completed: ${processedItems} items processed`);
      return { processed: processedItems, total: itemsToDelete.length };

    } catch (error) {
      logger.error('Error in data retention processing:', error);
      throw error;
    }
  }

  /**
   * Get consent summary for a data subject
   */
  async getConsentSummary(email: string) {
    try {
      const consents = await prisma.leadPulseConsent.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });

      const summary = {
        email,
        totalConsents: consents.length,
        activeConsents: consents.filter(c => c.granted && !c.withdrawnAt).length,
        withdrawnConsents: consents.filter(c => c.withdrawnAt).length,
        consentsByType: {} as Record<string, any>
      };

      // Group by consent type
      for (const consent of consents) {
        if (!summary.consentsByType[consent.consentType]) {
          summary.consentsByType[consent.consentType] = {
            granted: 0,
            withdrawn: 0,
            latest: null
          };
        }

        if (consent.granted && !consent.withdrawnAt) {
          summary.consentsByType[consent.consentType].granted++;
        } else if (consent.withdrawnAt) {
          summary.consentsByType[consent.consentType].withdrawn++;
        }

        // Track latest consent
        if (!summary.consentsByType[consent.consentType].latest ||
            consent.createdAt > summary.consentsByType[consent.consentType].latest.createdAt) {
          summary.consentsByType[consent.consentType].latest = consent;
        }
      }

      return summary;

    } catch (error) {
      logger.error('Error getting consent summary:', error);
      throw error;
    }
  }

  // Helper methods for data masking
  private maskSensitiveContactData(contact: any) {
    return {
      ...contact,
      ipAddress: contact.ipAddress ? this.maskIpAddress(contact.ipAddress) : null,
      // Keep essential data for transparency but mask sensitive details
    };
  }

  private maskSensitiveVisitorData(visitor: any) {
    return {
      ...visitor,
      ipAddress: visitor.ipAddress ? this.maskIpAddress(visitor.ipAddress) : null,
      userAgent: visitor.userAgent ? this.maskUserAgent(visitor.userAgent) : null
    };
  }

  private maskSensitiveSubmissionData(submission: any) {
    return {
      ...submission,
      ipAddress: submission.ipAddress ? this.maskIpAddress(submission.ipAddress) : null,
      userAgent: submission.userAgent ? this.maskUserAgent(submission.userAgent) : null
    };
  }

  private maskSensitiveTouchpointData(touchpoint: any) {
    return {
      ...touchpoint,
      metadata: touchpoint.metadata ? this.maskMetadata(touchpoint.metadata) : null
    };
  }

  private maskSensitiveAuditData(auditLog: any) {
    return {
      ...auditLog,
      ipAddress: auditLog.ipAddress ? this.maskIpAddress(auditLog.ipAddress) : null,
      userAgent: auditLog.userAgent ? this.maskUserAgent(auditLog.userAgent) : null
    };
  }

  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.***.**` : '***masked***';
  }

  private maskUserAgent(userAgent: string): string {
    return userAgent.length > 50 ? userAgent.substring(0, 50) + '...[masked]' : userAgent;
  }

  private maskMetadata(metadata: any): any {
    // Mask sensitive fields in metadata
    const masked = { ...metadata };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***masked***';
      }
    }
    
    return masked;
  }
}

// Export singleton instance
export const gdprComplianceManager = new GDPRComplianceManager();