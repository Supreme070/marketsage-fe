/**
 * LeadPulse GDPR Compliance Manager
 *
 * Handles GDPR compliance requirements for data processing
 */

// NOTE: Prisma removed - using backend API (GDPRConsent, DataProcessingActivity, DataSubjectRequest, ComplianceAlert, LeadPulseAuditLog, Contact, AnonymousVisitor, Form, FormSubmission, Touchpoint exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

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
      const existingResponse = await fetch(
        `${BACKEND_URL}/api/v2/gdpr-consents?email=${encodeURIComponent(consentData.email)}&consentType=${consentData.consentType}&purpose=${encodeURIComponent(consentData.purpose)}&orderBy=createdAt:desc&limit=1`
      );
      if (!existingResponse.ok) {
        throw new Error(`Failed to check existing consent: ${existingResponse.status}`);
      }
      const existingData = await existingResponse.json();
      const existingConsent = existingData.data?.[0];

      // Create new consent record
      const createResponse = await fetch(`${BACKEND_URL}/api/v2/gdpr-consents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });
      if (!createResponse.ok) {
        throw new Error(`Failed to create consent: ${createResponse.status}`);
      }
      const consent = await createResponse.json();

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
        consentId: consent.data.id
      });

      return { success: true, consentId: consent.data.id };

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
      const params = new URLSearchParams({
        email,
        consentType,
        granted: 'true',
        withdrawnAt: 'null',
        orderBy: 'grantedAt:desc',
        limit: '1'
      });

      if (purpose) {
        params.append('purpose', purpose);
      }

      const response = await fetch(`${BACKEND_URL}/api/v2/gdpr-consents?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to check consent: ${response.status}`);
      }
      const data = await response.json();
      const validConsent = data.data?.[0];

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

        if (new Date(validConsent.grantedAt) < twoYearsAgo) {
          return {
            allowed: false,
            reason: 'Consent has expired (older than 2 years)'
          };
        }
      }

      return {
        allowed: true,
        consentDate: validConsent.grantedAt ? new Date(validConsent.grantedAt) : undefined
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
        contactsRes,
        visitorsRes,
        formSubmissionsRes,
        touchpointsRes,
        consentsRes,
        auditLogsRes
      ] = await Promise.all([
        // Contact data
        fetch(`${BACKEND_URL}/api/v2/contacts?email=${encodeURIComponent(email)}&include=customFields,tags,segments`),

        // Visitor data
        fetch(`${BACKEND_URL}/api/v2/leadpulse-visitors?metadata.email=${encodeURIComponent(email)}&include=touchpoints,formSubmissions`),

        // Form submissions
        fetch(`${BACKEND_URL}/api/v2/form-submissions?email=${encodeURIComponent(email)}&include=data,form`),

        // Touchpoints
        fetch(`${BACKEND_URL}/api/v2/leadpulse-touchpoints?metadata.email=${encodeURIComponent(email)}`),

        // Consent records
        fetch(`${BACKEND_URL}/api/v2/gdpr-consents?email=${encodeURIComponent(email)}`),

        // Audit logs
        fetch(`${BACKEND_URL}/api/v2/leadpulse-audit-logs?userEmail=${encodeURIComponent(email)}`)
      ]);

      if (!contactsRes.ok || !visitorsRes.ok || !formSubmissionsRes.ok || !touchpointsRes.ok || !consentsRes.ok || !auditLogsRes.ok) {
        throw new Error('Failed to fetch personal data');
      }

      const [
        contactsData,
        visitorsData,
        formSubmissionsData,
        touchpointsData,
        consentsData,
        auditLogsData
      ] = await Promise.all([
        contactsRes.json(),
        visitorsRes.json(),
        formSubmissionsRes.json(),
        touchpointsRes.json(),
        consentsRes.json(),
        auditLogsRes.json()
      ]);

      const contacts = contactsData.data || [];
      const visitors = visitorsData.data || [];
      const formSubmissions = formSubmissionsData.data || [];
      const touchpoints = touchpointsData.data || [];
      const consents = consentsData.data || [];
      const auditLogs = auditLogsData.data || [];

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

      // Call backend erasure endpoint (handles transaction)
      const response = await fetch(`${BACKEND_URL}/api/v2/data-subject-requests/erasure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process erasure request: ${response.status}`);
      }

      const result = await response.json();

      logger.info('Data erasure completed', {
        email,
        deletedItems: result.data.deletedItems,
        reason
      });

      return { success: true, deletedItems: result.data.deletedItems };

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
      // Call backend data retention endpoint
      const response = await fetch(`${BACKEND_URL}/api/v2/data-processing-activities/retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to process data retention: ${response.status}`);
      }

      const result = await response.json();

      logger.info(`Data retention processing completed: ${result.data.processed} items processed`);
      return { processed: result.data.processed, total: result.data.total };

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
      const response = await fetch(
        `${BACKEND_URL}/api/v2/gdpr-consents?email=${encodeURIComponent(email)}&orderBy=createdAt:desc`
      );
      if (!response.ok) {
        throw new Error(`Failed to get consent summary: ${response.status}`);
      }
      const data = await response.json();
      const consents = data.data || [];

      const summary = {
        email,
        totalConsents: consents.length,
        activeConsents: consents.filter((c: any) => c.granted && !c.withdrawnAt).length,
        withdrawnConsents: consents.filter((c: any) => c.withdrawnAt).length,
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
            new Date(consent.createdAt) > new Date(summary.consentsByType[consent.consentType].latest.createdAt)) {
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