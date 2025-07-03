/**
 * Contact Event Listeners for Customer Event Bus
 * ===============================================
 * 
 * Captures contact interactions and feeds them into the event bus
 * for AI decision making and customer lifecycle automation
 */

import { CustomerEventType, EventPriority, getCustomerEventBus } from '../event-bus';
import { logger } from '@/lib/logger';

export class ContactEventListener {
  
  /**
   * Emit contact created event
   */
  static async onContactCreated(contactData: {
    contactId: string;
    organizationId: string;
    userId?: string;
    email?: string;
    phone?: string;
    source?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_CREATED,
        {
          email: contactData.email,
          phone: contactData.phone,
          createdAt: new Date(),
          source: contactData.source || 'manual'
        },
        {
          contactId: contactData.contactId,
          organizationId: contactData.organizationId,
          userId: contactData.userId,
          priority: EventPriority.NORMAL,
          source: 'contact-service',
          sessionId: contactData.sessionId
        }
      );

      logger.info('Contact created event emitted', {
        contactId: contactData.contactId,
        organizationId: contactData.organizationId
      });

    } catch (error) {
      logger.error('Failed to emit contact created event', {
        contactId: contactData.contactId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Emit contact updated event
   */
  static async onContactUpdated(contactData: {
    contactId: string;
    organizationId: string;
    userId?: string;
    changedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    sessionId?: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_UPDATED,
        {
          changedFields: contactData.changedFields,
          previousValues: contactData.previousValues,
          newValues: contactData.newValues,
          updatedAt: new Date()
        },
        {
          contactId: contactData.contactId,
          organizationId: contactData.organizationId,
          userId: contactData.userId,
          priority: EventPriority.LOW,
          source: 'contact-service',
          sessionId: contactData.sessionId
        }
      );

      logger.debug('Contact updated event emitted', {
        contactId: contactData.contactId,
        changedFields: contactData.changedFields
      });

    } catch (error) {
      logger.error('Failed to emit contact updated event', {
        contactId: contactData.contactId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Emit email interaction events
   */
  static async onEmailOpened(emailData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    emailId: string;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_EMAIL_OPENED,
        {
          campaignId: emailData.campaignId,
          emailId: emailData.emailId,
          userAgent: emailData.userAgent,
          ipAddress: emailData.ipAddress,
          openedAt: emailData.timestamp
        },
        {
          contactId: emailData.contactId,
          organizationId: emailData.organizationId,
          priority: EventPriority.NORMAL,
          source: 'email-service'
        }
      );

      logger.info('Email opened event emitted', {
        contactId: emailData.contactId,
        campaignId: emailData.campaignId,
        emailId: emailData.emailId
      });

    } catch (error) {
      logger.error('Failed to emit email opened event', {
        contactId: emailData.contactId,
        emailId: emailData.emailId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  static async onEmailClicked(emailData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    emailId: string;
    linkUrl: string;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_EMAIL_CLICKED,
        {
          campaignId: emailData.campaignId,
          emailId: emailData.emailId,
          linkUrl: emailData.linkUrl,
          userAgent: emailData.userAgent,
          ipAddress: emailData.ipAddress,
          clickedAt: emailData.timestamp
        },
        {
          contactId: emailData.contactId,
          organizationId: emailData.organizationId,
          priority: EventPriority.HIGH, // Clicks are high engagement
          source: 'email-service'
        }
      );

      logger.info('Email clicked event emitted', {
        contactId: emailData.contactId,
        campaignId: emailData.campaignId,
        linkUrl: emailData.linkUrl
      });

    } catch (error) {
      logger.error('Failed to emit email clicked event', {
        contactId: emailData.contactId,
        emailId: emailData.emailId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Emit SMS interaction events
   */
  static async onSMSDelivered(smsData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    smsId: string;
    messageContent: string;
    timestamp: Date;
    deliveryStatus: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_SMS_DELIVERED,
        {
          campaignId: smsData.campaignId,
          smsId: smsData.smsId,
          messageContent: smsData.messageContent,
          deliveryStatus: smsData.deliveryStatus,
          deliveredAt: smsData.timestamp
        },
        {
          contactId: smsData.contactId,
          organizationId: smsData.organizationId,
          priority: EventPriority.NORMAL,
          source: 'sms-service'
        }
      );

      logger.info('SMS delivered event emitted', {
        contactId: smsData.contactId,
        campaignId: smsData.campaignId,
        smsId: smsData.smsId
      });

    } catch (error) {
      logger.error('Failed to emit SMS delivered event', {
        contactId: smsData.contactId,
        smsId: smsData.smsId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  static async onSMSReplied(smsData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    smsId: string;
    replyContent: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_SMS_REPLIED,
        {
          campaignId: smsData.campaignId,
          smsId: smsData.smsId,
          replyContent: smsData.replyContent,
          repliedAt: smsData.timestamp
        },
        {
          contactId: smsData.contactId,
          organizationId: smsData.organizationId,
          priority: EventPriority.HIGH, // Replies indicate high engagement
          source: 'sms-service'
        }
      );

      logger.info('SMS replied event emitted', {
        contactId: smsData.contactId,
        campaignId: smsData.campaignId,
        replyLength: smsData.replyContent.length
      });

    } catch (error) {
      logger.error('Failed to emit SMS replied event', {
        contactId: smsData.contactId,
        smsId: smsData.smsId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Emit WhatsApp interaction events
   */
  static async onWhatsAppDelivered(whatsappData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    messageId: string;
    messageContent: string;
    timestamp: Date;
    deliveryStatus: string;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_WHATSAPP_DELIVERED,
        {
          campaignId: whatsappData.campaignId,
          messageId: whatsappData.messageId,
          messageContent: whatsappData.messageContent,
          deliveryStatus: whatsappData.deliveryStatus,
          deliveredAt: whatsappData.timestamp
        },
        {
          contactId: whatsappData.contactId,
          organizationId: whatsappData.organizationId,
          priority: EventPriority.NORMAL,
          source: 'whatsapp-service'
        }
      );

      logger.info('WhatsApp delivered event emitted', {
        contactId: whatsappData.contactId,
        campaignId: whatsappData.campaignId,
        messageId: whatsappData.messageId
      });

    } catch (error) {
      logger.error('Failed to emit WhatsApp delivered event', {
        contactId: whatsappData.contactId,
        messageId: whatsappData.messageId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  static async onWhatsAppReplied(whatsappData: {
    contactId: string;
    organizationId: string;
    campaignId?: string;
    messageId: string;
    replyContent: string;
    replyType: 'text' | 'media' | 'location' | 'contact';
    timestamp: Date;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CONTACT_WHATSAPP_REPLIED,
        {
          campaignId: whatsappData.campaignId,
          messageId: whatsappData.messageId,
          replyContent: whatsappData.replyContent,
          replyType: whatsappData.replyType,
          repliedAt: whatsappData.timestamp
        },
        {
          contactId: whatsappData.contactId,
          organizationId: whatsappData.organizationId,
          priority: EventPriority.HIGH, // WhatsApp replies are high engagement
          source: 'whatsapp-service'
        }
      );

      logger.info('WhatsApp replied event emitted', {
        contactId: whatsappData.contactId,
        campaignId: whatsappData.campaignId,
        replyType: whatsappData.replyType
      });

    } catch (error) {
      logger.error('Failed to emit WhatsApp replied event', {
        contactId: whatsappData.contactId,
        messageId: whatsappData.messageId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Emit behavioral events that trigger AI decisions
   */
  static async onBirthdayDetected(contactData: {
    contactId: string;
    organizationId: string;
    birthday: Date;
    age?: number;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.BIRTHDAY_DETECTED,
        {
          birthday: contactData.birthday,
          age: contactData.age,
          detectedAt: new Date()
        },
        {
          contactId: contactData.contactId,
          organizationId: contactData.organizationId,
          priority: EventPriority.HIGH, // Birthday campaigns are important
          source: 'customer-intelligence'
        }
      );

      logger.info('Birthday detected event emitted', {
        contactId: contactData.contactId,
        age: contactData.age
      });

    } catch (error) {
      logger.error('Failed to emit birthday detected event', {
        contactId: contactData.contactId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  static async onChurnRiskDetected(contactData: {
    contactId: string;
    organizationId: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    riskFactors: string[];
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      const priority = contactData.riskLevel === 'critical' ? EventPriority.CRITICAL :
                      contactData.riskLevel === 'high' ? EventPriority.HIGH :
                      EventPriority.NORMAL;
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.CHURN_RISK_DETECTED,
        {
          riskLevel: contactData.riskLevel,
          riskScore: contactData.riskScore,
          riskFactors: contactData.riskFactors,
          detectedAt: new Date()
        },
        {
          contactId: contactData.contactId,
          organizationId: contactData.organizationId,
          priority,
          source: 'customer-intelligence'
        }
      );

      logger.warn('Churn risk detected event emitted', {
        contactId: contactData.contactId,
        riskLevel: contactData.riskLevel,
        riskScore: contactData.riskScore
      });

    } catch (error) {
      logger.error('Failed to emit churn risk detected event', {
        contactId: contactData.contactId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  static async onHighValueDetected(contactData: {
    contactId: string;
    organizationId: string;
    lifetimeValue: number;
    valueSegment: string;
    recentPurchases: number;
  }): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.HIGH_VALUE_DETECTED,
        {
          lifetimeValue: contactData.lifetimeValue,
          valueSegment: contactData.valueSegment,
          recentPurchases: contactData.recentPurchases,
          detectedAt: new Date()
        },
        {
          contactId: contactData.contactId,
          organizationId: contactData.organizationId,
          priority: EventPriority.HIGH, // High value customers are important
          source: 'customer-intelligence'
        }
      );

      logger.info('High value customer detected event emitted', {
        contactId: contactData.contactId,
        lifetimeValue: contactData.lifetimeValue,
        valueSegment: contactData.valueSegment
      });

    } catch (error) {
      logger.error('Failed to emit high value detected event', {
        contactId: contactData.contactId,
        error: error instanceof Error ? error.message : error
      });
    }
  }
}