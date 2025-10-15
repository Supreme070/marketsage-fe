/**
 * Data Ingestion Layer for All Touchpoints
 * =========================================
 * 
 * Centralized service for ingesting customer data from all touchpoints
 * and feeding it into the event bus for AI decision making
 * 
 * Touchpoints: Email, SMS, WhatsApp, Website, Forms, Campaigns, Workflows
 */

import { getCustomerEventBus, CustomerEventType, EventPriority } from '@/lib/events/event-bus';
import { ContactEventListener } from '@/lib/events/listeners/contact-event-listener';
// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';
import { logger } from '@/lib/logger';

export interface TouchpointData {
  contactId: string;
  organizationId: string;
  userId?: string;
  sessionId?: string;
  source: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface EmailTouchpointData extends TouchpointData {
  campaignId?: string;
  emailId: string;
  action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  actionData?: {
    linkUrl?: string;
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    location?: string;
  };
}

export interface SMSTouchpointData extends TouchpointData {
  campaignId?: string;
  smsId: string;
  action: 'sent' | 'delivered' | 'failed' | 'replied';
  actionData?: {
    message?: string;
    deliveryStatus?: string;
    replyContent?: string;
    carrierInfo?: string;
  };
}

export interface WhatsAppTouchpointData extends TouchpointData {
  campaignId?: string;
  messageId: string;
  action: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  actionData?: {
    message?: string;
    replyContent?: string;
    replyType?: 'text' | 'media' | 'location' | 'contact';
    messageType?: 'text' | 'template' | 'media';
  };
}

export interface WebsiteTouchpointData extends TouchpointData {
  action: 'visit' | 'page_view' | 'form_submission' | 'download' | 'signup' | 'purchase' | 'cart_abandonment';
  actionData?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
    formData?: Record<string, any>;
    productId?: string;
    purchaseAmount?: number;
    cartValue?: number;
  };
}

export interface CampaignTouchpointData extends TouchpointData {
  campaignId: string;
  campaignType: 'email' | 'sms' | 'whatsapp' | 'social' | 'display';
  action: 'sent' | 'opened' | 'clicked' | 'converted' | 'unsubscribed';
  actionData?: {
    conversionValue?: number;
    conversionType?: string;
    linkUrl?: string;
  };
}

export interface WorkflowTouchpointData extends TouchpointData {
  workflowId: string;
  nodeId?: string;
  action: 'triggered' | 'step_completed' | 'step_failed' | 'completed' | 'failed';
  actionData?: {
    stepType?: string;
    stepResult?: any;
    errorMessage?: string;
    nextStepId?: string;
  };
}

/**
 * Data Ingestion Service
 * 
 * Centralizes all customer touchpoint data ingestion and event publishing
 */
export class DataIngestionService {
  
  /**
   * Ingest email touchpoint data
   */
  static async ingestEmailTouchpoint(data: EmailTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting email touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        campaignId: data.campaignId,
        emailId: data.emailId
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('email', data);

      // Publish appropriate events based on action
      switch (data.action) {
        case 'opened':
          await ContactEventListener.onEmailOpened({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            emailId: data.emailId,
            timestamp: data.timestamp,
            userAgent: data.actionData?.userAgent,
            ipAddress: data.actionData?.ipAddress
          });
          break;

        case 'clicked':
          await ContactEventListener.onEmailClicked({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            emailId: data.emailId,
            linkUrl: data.actionData?.linkUrl || '',
            timestamp: data.timestamp,
            userAgent: data.actionData?.userAgent,
            ipAddress: data.actionData?.ipAddress
          });
          break;

        case 'sent':
        case 'delivered':
          // Publish generic campaign sent event
          await DataIngestionService.publishCampaignEvent(data, CustomerEventType.CAMPAIGN_SENT);
          break;

        case 'unsubscribed':
          await DataIngestionService.publishCampaignEvent(data, CustomerEventType.CAMPAIGN_UNSUBSCRIBED);
          break;
      }

      // Update contact engagement metrics
      await DataIngestionService.updateContactEngagement(data.contactId, 'email', data.action);

    } catch (error) {
      logger.error('Failed to ingest email touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Ingest SMS touchpoint data
   */
  static async ingestSMSTouchpoint(data: SMSTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting SMS touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        campaignId: data.campaignId,
        smsId: data.smsId
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('sms', data);

      // Publish appropriate events
      switch (data.action) {
        case 'delivered':
          await ContactEventListener.onSMSDelivered({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            smsId: data.smsId,
            messageContent: data.actionData?.message || '',
            timestamp: data.timestamp,
            deliveryStatus: data.actionData?.deliveryStatus || 'delivered'
          });
          break;

        case 'replied':
          await ContactEventListener.onSMSReplied({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            smsId: data.smsId,
            replyContent: data.actionData?.replyContent || '',
            timestamp: data.timestamp
          });
          break;

        case 'sent':
          await DataIngestionService.publishCampaignEvent(data, CustomerEventType.CAMPAIGN_SENT);
          break;
      }

      // Update contact engagement
      await DataIngestionService.updateContactEngagement(data.contactId, 'sms', data.action);

    } catch (error) {
      logger.error('Failed to ingest SMS touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Ingest WhatsApp touchpoint data
   */
  static async ingestWhatsAppTouchpoint(data: WhatsAppTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting WhatsApp touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        campaignId: data.campaignId,
        messageId: data.messageId
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('whatsapp', data);

      // Publish appropriate events
      switch (data.action) {
        case 'delivered':
          await ContactEventListener.onWhatsAppDelivered({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            messageId: data.messageId,
            messageContent: data.actionData?.message || '',
            timestamp: data.timestamp,
            deliveryStatus: 'delivered'
          });
          break;

        case 'replied':
          await ContactEventListener.onWhatsAppReplied({
            contactId: data.contactId,
            organizationId: data.organizationId,
            campaignId: data.campaignId,
            messageId: data.messageId,
            replyContent: data.actionData?.replyContent || '',
            replyType: data.actionData?.replyType || 'text',
            timestamp: data.timestamp
          });
          break;

        case 'sent':
          await DataIngestionService.publishCampaignEvent(data, CustomerEventType.CAMPAIGN_SENT);
          break;
      }

      // Update contact engagement
      await DataIngestionService.updateContactEngagement(data.contactId, 'whatsapp', data.action);

    } catch (error) {
      logger.error('Failed to ingest WhatsApp touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Ingest website touchpoint data
   */
  static async ingestWebsiteTouchpoint(data: WebsiteTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting website touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        pageUrl: data.actionData?.pageUrl
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('website', data);

      // Publish appropriate events
      const eventBus = getCustomerEventBus();

      switch (data.action) {
        case 'visit':
          await eventBus.publishCustomerEvent(
            CustomerEventType.WEBSITE_VISIT,
            {
              pageUrl: data.actionData?.pageUrl,
              referrer: data.actionData?.referrer,
              userAgent: data.actionData?.userAgent,
              ipAddress: data.actionData?.ipAddress,
              visitedAt: data.timestamp
            },
            {
              contactId: data.contactId,
              organizationId: data.organizationId,
              userId: data.userId,
              priority: EventPriority.NORMAL,
              source: 'website-tracking',
              sessionId: data.sessionId
            }
          );
          break;

        case 'page_view':
          await eventBus.publishCustomerEvent(
            CustomerEventType.PAGE_VIEW,
            {
              pageUrl: data.actionData?.pageUrl,
              referrer: data.actionData?.referrer,
              viewedAt: data.timestamp
            },
            {
              contactId: data.contactId,
              organizationId: data.organizationId,
              priority: EventPriority.LOW,
              source: 'website-tracking',
              sessionId: data.sessionId
            }
          );
          break;

        case 'form_submission':
          await eventBus.publishCustomerEvent(
            CustomerEventType.FORM_SUBMISSION,
            {
              formData: data.actionData?.formData,
              pageUrl: data.actionData?.pageUrl,
              submittedAt: data.timestamp
            },
            {
              contactId: data.contactId,
              organizationId: data.organizationId,
              priority: EventPriority.HIGH, // Form submissions are important
              source: 'website-forms',
              sessionId: data.sessionId
            }
          );
          break;

        case 'purchase':
          await eventBus.publishCustomerEvent(
            CustomerEventType.PURCHASE_COMPLETED,
            {
              purchaseAmount: data.actionData?.purchaseAmount,
              productId: data.actionData?.productId,
              purchasedAt: data.timestamp
            },
            {
              contactId: data.contactId,
              organizationId: data.organizationId,
              priority: EventPriority.HIGH, // Purchases are very important
              source: 'e-commerce',
              sessionId: data.sessionId
            }
          );
          break;

        case 'cart_abandonment':
          await eventBus.publishCustomerEvent(
            CustomerEventType.CART_ABANDONMENT,
            {
              cartValue: data.actionData?.cartValue,
              abandonedAt: data.timestamp
            },
            {
              contactId: data.contactId,
              organizationId: data.organizationId,
              priority: EventPriority.HIGH, // Cart abandonment needs immediate attention
              source: 'e-commerce',
              sessionId: data.sessionId
            }
          );
          break;
      }

      // Update contact website engagement
      await DataIngestionService.updateContactEngagement(data.contactId, 'website', data.action);

    } catch (error) {
      logger.error('Failed to ingest website touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Ingest campaign touchpoint data
   */
  static async ingestCampaignTouchpoint(data: CampaignTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting campaign touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        campaignId: data.campaignId,
        campaignType: data.campaignType
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('campaign', data);

      // Publish appropriate events
      const eventBus = getCustomerEventBus();
      let eventType: CustomerEventType;
      let priority = EventPriority.NORMAL;

      switch (data.action) {
        case 'sent':
          eventType = CustomerEventType.CAMPAIGN_SENT;
          break;
        case 'opened':
          eventType = CustomerEventType.CAMPAIGN_OPENED;
          priority = EventPriority.NORMAL;
          break;
        case 'clicked':
          eventType = CustomerEventType.CAMPAIGN_CLICKED;
          priority = EventPriority.HIGH; // Clicks show engagement
          break;
        case 'converted':
          eventType = CustomerEventType.CAMPAIGN_CONVERTED;
          priority = EventPriority.HIGH; // Conversions are very important
          break;
        case 'unsubscribed':
          eventType = CustomerEventType.CAMPAIGN_UNSUBSCRIBED;
          priority = EventPriority.HIGH; // Unsubscribes need attention
          break;
        default:
          throw new Error(`Unknown campaign action: ${data.action}`);
      }

      await eventBus.publishCustomerEvent(
        eventType,
        {
          campaignId: data.campaignId,
          campaignType: data.campaignType,
          conversionValue: data.actionData?.conversionValue,
          conversionType: data.actionData?.conversionType,
          linkUrl: data.actionData?.linkUrl,
          actionedAt: data.timestamp
        },
        {
          contactId: data.contactId,
          organizationId: data.organizationId,
          userId: data.userId,
          priority,
          source: `campaign-${data.campaignType}`,
          sessionId: data.sessionId
        }
      );

      // Update campaign engagement
      await DataIngestionService.updateContactEngagement(data.contactId, data.campaignType, data.action);

    } catch (error) {
      logger.error('Failed to ingest campaign touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        campaignId: data.campaignId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Ingest workflow touchpoint data
   */
  static async ingestWorkflowTouchpoint(data: WorkflowTouchpointData): Promise<void> {
    try {
      logger.info('Ingesting workflow touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        workflowId: data.workflowId,
        nodeId: data.nodeId
      });

      // Store touchpoint data
      await DataIngestionService.storeTouchpointData('workflow', data);

      // Publish appropriate events
      const eventBus = getCustomerEventBus();
      let eventType: CustomerEventType;
      let priority = EventPriority.NORMAL;

      switch (data.action) {
        case 'triggered':
          eventType = CustomerEventType.WORKFLOW_TRIGGERED;
          break;
        case 'completed':
          eventType = CustomerEventType.WORKFLOW_COMPLETED;
          priority = EventPriority.NORMAL;
          break;
        case 'failed':
          eventType = CustomerEventType.WORKFLOW_FAILED;
          priority = EventPriority.HIGH; // Failures need attention
          break;
        default:
          // For step completions/failures, we'll use a generic workflow event
          eventType = CustomerEventType.WORKFLOW_TRIGGERED;
          break;
      }

      await eventBus.publishCustomerEvent(
        eventType,
        {
          workflowId: data.workflowId,
          nodeId: data.nodeId,
          stepType: data.actionData?.stepType,
          stepResult: data.actionData?.stepResult,
          errorMessage: data.actionData?.errorMessage,
          nextStepId: data.actionData?.nextStepId,
          actionedAt: data.timestamp
        },
        {
          contactId: data.contactId,
          organizationId: data.organizationId,
          userId: data.userId,
          priority,
          source: 'workflow-engine',
          sessionId: data.sessionId
        }
      );

    } catch (error) {
      logger.error('Failed to ingest workflow touchpoint data', {
        contactId: data.contactId,
        action: data.action,
        workflowId: data.workflowId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Store touchpoint data in database
   */
  private static async storeTouchpointData(touchpointType: string, data: TouchpointData): Promise<void> {
    try {
      // Store in CustomerEvent table for persistent tracking
      const response = await fetch(`${BACKEND_URL}/api/customer-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: data.contactId,
          organizationId: data.organizationId,
          eventType: `${touchpointType}_${(data as any).action}`,
          eventData: {
            ...data.metadata,
            ...(data as any).actionData,
            source: data.source,
            timestamp: data.timestamp.toISOString()
          },
          eventSource: touchpointType,
          priority: 'normal',
          processedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      logger.warn('Failed to store touchpoint data in database', {
        touchpointType,
        contactId: data.contactId,
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - we don't want to fail event publishing if storage fails
    }
  }

  /**
   * Update contact engagement metrics
   */
  private static async updateContactEngagement(
    contactId: string,
    channel: string,
    action: string
  ): Promise<void> {
    try {
      // Update engagement counters in customer profile
      const response = await fetch(`${BACKEND_URL}/api/customer-profiles/update-engagement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          lastInteraction: new Date(),
          channelInteractions: {
            channel,
            increment: 1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      // For high-engagement actions, update engagement score
      const highEngagementActions = ['clicked', 'replied', 'converted', 'purchase', 'form_submission'];

      if (highEngagementActions.includes(action)) {
        const scoreResponse = await fetch(`${BACKEND_URL}/api/customer-profiles/update-engagement-score`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId,
            increment: 0.01 // Small incremental boost
          })
        });

        if (!scoreResponse.ok) {
          throw new Error(`Backend API error: ${scoreResponse.status} ${scoreResponse.statusText}`);
        }
      }

    } catch (error) {
      logger.warn('Failed to update contact engagement metrics', {
        contactId,
        channel,
        action,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Publish generic campaign event
   */
  private static async publishCampaignEvent(
    data: TouchpointData, 
    eventType: CustomerEventType
  ): Promise<void> {
    const eventBus = getCustomerEventBus();
    
    await eventBus.publishCustomerEvent(
      eventType,
      {
        campaignId: (data as any).campaignId,
        messageId: (data as any).emailId || (data as any).smsId || (data as any).messageId,
        actionedAt: data.timestamp
      },
      {
        contactId: data.contactId,
        organizationId: data.organizationId,
        userId: data.userId,
        priority: EventPriority.NORMAL,
        source: data.source,
        sessionId: data.sessionId
      }
    );
  }

  /**
   * Batch ingest multiple touchpoints
   */
  static async batchIngestTouchpoints(touchpoints: Array<{
    type: 'email' | 'sms' | 'whatsapp' | 'website' | 'campaign' | 'workflow';
    data: TouchpointData;
  }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string; }>;
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string; }>
    };

    for (let i = 0; i < touchpoints.length; i++) {
      const touchpoint = touchpoints[i];
      
      try {
        switch (touchpoint.type) {
          case 'email':
            await DataIngestionService.ingestEmailTouchpoint(touchpoint.data as EmailTouchpointData);
            break;
          case 'sms':
            await DataIngestionService.ingestSMSTouchpoint(touchpoint.data as SMSTouchpointData);
            break;
          case 'whatsapp':
            await DataIngestionService.ingestWhatsAppTouchpoint(touchpoint.data as WhatsAppTouchpointData);
            break;
          case 'website':
            await DataIngestionService.ingestWebsiteTouchpoint(touchpoint.data as WebsiteTouchpointData);
            break;
          case 'campaign':
            await DataIngestionService.ingestCampaignTouchpoint(touchpoint.data as CampaignTouchpointData);
            break;
          case 'workflow':
            await DataIngestionService.ingestWorkflowTouchpoint(touchpoint.data as WorkflowTouchpointData);
            break;
          default:
            throw new Error(`Unknown touchpoint type: ${touchpoint.type}`);
        }
        
        result.success++;
        
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Batch touchpoint ingestion completed', {
      total: touchpoints.length,
      success: result.success,
      failed: result.failed,
      errorCount: result.errors.length
    });

    return result;
  }
}