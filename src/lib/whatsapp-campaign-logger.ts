import { logger, LogLevel, type LogContext } from './logger';
import prisma from '@/lib/db/prisma';

// WhatsApp Campaign specific log types
export enum WhatsAppLogType {
  CAMPAIGN_CREATED = 'WA_CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'WA_CAMPAIGN_UPDATED',
  CAMPAIGN_DELETED = 'WA_CAMPAIGN_DELETED',
  CAMPAIGN_SENT = 'WA_CAMPAIGN_SENT',
  CAMPAIGN_SCHEDULED = 'WA_CAMPAIGN_SCHEDULED',
  CAMPAIGN_FAILED = 'WA_CAMPAIGN_FAILED',
  SEND_INITIATED = 'WA_SEND_INITIATED',
  SEND_BATCH_COMPLETED = 'WA_SEND_BATCH_COMPLETED',
  SEND_COMPLETED = 'WA_SEND_COMPLETED',
  MESSAGE_SENT = 'WA_MESSAGE_SENT',
  MESSAGE_FAILED = 'WA_MESSAGE_FAILED',
  MESSAGE_DELIVERED = 'WA_MESSAGE_DELIVERED',
  MESSAGE_READ = 'WA_MESSAGE_READ',
  TEMPLATE_VALIDATION_FAILED = 'WA_TEMPLATE_VALIDATION_FAILED',
  COMPLIANCE_CHECK_FAILED = 'WA_COMPLIANCE_CHECK_FAILED',
  COMPLIANCE_WARNING = 'WA_COMPLIANCE_WARNING',
  RATE_LIMIT_EXCEEDED = 'WA_RATE_LIMIT_EXCEEDED',
  WEBHOOK_RECEIVED = 'WA_WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WA_WEBHOOK_PROCESSED',
  WEBHOOK_VERIFICATION = 'WA_WEBHOOK_VERIFICATION',
  VALIDATION_ERROR = 'WA_VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'WA_AUTHORIZATION_ERROR',
  API_ERROR = 'WA_API_ERROR',
  DATABASE_ERROR = 'WA_DATABASE_ERROR',
  PHONE_VALIDATION_FAILED = 'WA_PHONE_VALIDATION_FAILED',
  PERSONALIZATION_ERROR = 'WA_PERSONALIZATION_ERROR',
  TEMPLATE_APPROVAL_CHECK = 'WA_TEMPLATE_APPROVAL_CHECK',
  TEMPLATE_SUBMITTED = 'WA_TEMPLATE_SUBMITTED',
  TEMPLATE_STATUS_CHANGED = 'WA_TEMPLATE_STATUS_CHANGED',
  MESSAGE_WINDOW_EXPIRED = 'WA_MESSAGE_WINDOW_EXPIRED',
}

// Extended context for WhatsApp operations
export interface WhatsAppLogContext extends LogContext {
  campaignId?: string;
  contactId?: string;
  userId?: string;
  messageId?: string;
  templateId?: string;
  phoneNumber?: string;
  recipientCount?: number;
  successCount?: number;
  failureCount?: number;
  batchNumber?: number;
  errorCode?: string;
  errorDetails?: any;
  complianceErrors?: string[];
  complianceWarnings?: string[];
  metadata?: Record<string, any>;
}

// WhatsApp Campaign Logger class
export class WhatsAppCampaignLogger {
  private readonly source = 'WHATSAPP_CAMPAIGN';

  // Log campaign lifecycle events
  async logCampaignCreated(campaignId: string, userId: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: WhatsAppLogType.CAMPAIGN_CREATED,
      source: this.source,
    };

    logger.info(`WhatsApp campaign created: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.CAMPAIGN_CREATED, 'WhatsApp campaign created', logContext);
  }

  async logCampaignUpdated(campaignId: string, userId: string, changes: any, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      changes,
      type: WhatsAppLogType.CAMPAIGN_UPDATED,
      source: this.source,
    };

    logger.info(`WhatsApp campaign updated: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.CAMPAIGN_UPDATED, 'WhatsApp campaign updated', logContext);
  }

  async logCampaignDeleted(campaignId: string, userId: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: WhatsAppLogType.CAMPAIGN_DELETED,
      source: this.source,
    };

    logger.info(`WhatsApp campaign deleted: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.CAMPAIGN_DELETED, 'WhatsApp campaign deleted', logContext);
  }

  async logCampaignFailed(campaignId: string, userId: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: WhatsAppLogType.CAMPAIGN_FAILED,
      source: this.source,
    };

    logger.error(`WhatsApp campaign failed: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.CAMPAIGN_FAILED, 'WhatsApp campaign failed', logContext);
  }

  // Log sending operations
  async logSendInitiated(campaignId: string, recipientCount: number, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      recipientCount,
      type: WhatsAppLogType.SEND_INITIATED,
      source: this.source,
    };

    logger.info(`WhatsApp campaign send initiated: ${campaignId} to ${recipientCount} recipients`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.SEND_INITIATED, 'WhatsApp campaign send initiated', logContext);
  }

  async logBatchCompleted(campaignId: string, batchNumber: number, successCount: number, failureCount: number, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      batchNumber,
      successCount,
      failureCount,
      type: WhatsAppLogType.SEND_BATCH_COMPLETED,
      source: this.source,
    };

    logger.info(`WhatsApp batch ${batchNumber} completed: ${successCount} sent, ${failureCount} failed`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.SEND_BATCH_COMPLETED, 'WhatsApp batch completed', logContext);
  }

  async logSendCompleted(campaignId: string, totalSuccess: number, totalFailure: number, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      successCount: totalSuccess,
      failureCount: totalFailure,
      type: WhatsAppLogType.SEND_COMPLETED,
      source: this.source,
    };

    logger.info(`WhatsApp campaign send completed: ${campaignId} - ${totalSuccess} sent, ${totalFailure} failed`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.SEND_COMPLETED, 'WhatsApp campaign send completed', logContext);
  }

  // Log individual message operations
  async logMessageSent(campaignId: string, contactId: string, messageId: string, phoneNumber: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      messageId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      type: WhatsAppLogType.MESSAGE_SENT,
      source: this.source,
    };

    logger.debug(`WhatsApp sent to ${this.maskPhoneNumber(phoneNumber)}`, logContext);
    // Only persist important message logs to avoid database bloat
    if (context?.metadata?.important) {
      await this.persistLog(LogLevel.DEBUG, WhatsAppLogType.MESSAGE_SENT, 'WhatsApp message sent', logContext);
    }
  }

  async logMessageFailed(campaignId: string, contactId: string, phoneNumber: string, error: any, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      error: error?.message || error,
      errorCode: error?.code,
      type: WhatsAppLogType.MESSAGE_FAILED,
      source: this.source,
    };

    logger.error(`WhatsApp failed to ${this.maskPhoneNumber(phoneNumber)}: ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.MESSAGE_FAILED, 'WhatsApp message failed', logContext);
  }

  // Log WhatsApp-specific events
  async logTemplateValidationFailed(templateId: string, reason: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      templateId,
      reason,
      type: WhatsAppLogType.TEMPLATE_VALIDATION_FAILED,
      source: this.source,
    };

    logger.error(`WhatsApp template validation failed: ${reason}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.TEMPLATE_VALIDATION_FAILED, 'Template validation failed', logContext);
  }

  async logComplianceCheckFailed(campaignId: string, errors: string[], warnings: string[], context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      complianceErrors: errors,
      complianceWarnings: warnings,
      type: WhatsAppLogType.COMPLIANCE_CHECK_FAILED,
      source: this.source,
    };

    logger.error(`WhatsApp compliance check failed for campaign ${campaignId}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.COMPLIANCE_CHECK_FAILED, 'Compliance check failed', logContext);
  }

  async logComplianceWarning(campaignId: string, warnings: string[], context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      complianceWarnings: warnings,
      type: WhatsAppLogType.COMPLIANCE_WARNING,
      source: this.source,
    };

    logger.warn(`WhatsApp compliance warnings for campaign ${campaignId}`, logContext);
    await this.persistLog(LogLevel.WARN, WhatsAppLogType.COMPLIANCE_WARNING, 'Compliance warnings', logContext);
  }

  async logMessageWindowExpired(campaignId: string, contactId: string, lastInteractionTime: Date, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      lastInteractionTime,
      type: WhatsAppLogType.MESSAGE_WINDOW_EXPIRED,
      source: this.source,
    };

    logger.warn(`WhatsApp 24-hour message window expired for contact ${contactId}`, logContext);
    await this.persistLog(LogLevel.WARN, WhatsAppLogType.MESSAGE_WINDOW_EXPIRED, '24-hour window expired', logContext);
  }

  // Log webhook events
  async logWebhookReceived(messageId: string, status: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      messageId,
      status,
      type: WhatsAppLogType.WEBHOOK_RECEIVED,
      source: this.source,
    };

    logger.info(`WhatsApp webhook received for message ${messageId}: ${status}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.WEBHOOK_RECEIVED, 'WhatsApp webhook received', logContext);
  }

  async logWebhookProcessed(messageId: string, updateCount: number, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      messageId,
      updateCount,
      type: WhatsAppLogType.WEBHOOK_PROCESSED,
      source: this.source,
    };

    logger.info(`WhatsApp webhook processed: ${updateCount} records updated`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.WEBHOOK_PROCESSED, 'WhatsApp webhook processed', logContext);
  }

  async logWebhookVerification(success: boolean, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      success,
      type: WhatsAppLogType.WEBHOOK_VERIFICATION,
      source: this.source,
    };

    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success ? 'WhatsApp webhook verified' : 'WhatsApp webhook verification failed';
    
    if (success) {
      logger.info(message, logContext);
    } else {
      logger.error(message, logContext);
    }
    
    await this.persistLog(level, WhatsAppLogType.WEBHOOK_VERIFICATION, message, logContext);
  }

  // Log error conditions
  async logValidationError(campaignId: string, error: string, details: any, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      error,
      errorDetails: details,
      type: WhatsAppLogType.VALIDATION_ERROR,
      source: this.source,
    };

    logger.error(`WhatsApp validation error: ${error}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.VALIDATION_ERROR, error, logContext);
  }

  async logAuthorizationError(userId: string, action: string, resource: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      userId,
      action,
      resource,
      type: WhatsAppLogType.AUTHORIZATION_ERROR,
      source: this.source,
    };

    logger.warn(`WhatsApp authorization error: User ${userId} denied ${action} on ${resource}`, logContext);
    await this.persistLog(LogLevel.WARN, WhatsAppLogType.AUTHORIZATION_ERROR, 'Authorization denied', logContext);
  }

  async logApiError(error: any, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      error: error?.message || error,
      errorCode: error?.code,
      errorDetails: error,
      type: WhatsAppLogType.API_ERROR,
      source: this.source,
    };

    logger.error(`WhatsApp API error: ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.API_ERROR, 'WhatsApp API error', logContext);
  }

  async logDatabaseError(operation: string, error: any, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      operation,
      error: error?.message || error,
      errorCode: error?.code,
      type: WhatsAppLogType.DATABASE_ERROR,
      source: this.source,
    };

    logger.error(`WhatsApp database error during ${operation}: ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.DATABASE_ERROR, 'Database operation failed', logContext);
  }

  async logPhoneValidationFailed(phoneNumber: string, reason: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      reason,
      type: WhatsAppLogType.PHONE_VALIDATION_FAILED,
      source: this.source,
    };

    logger.warn(`WhatsApp phone validation failed for ${this.maskPhoneNumber(phoneNumber)}: ${reason}`, logContext);
    await this.persistLog(LogLevel.WARN, WhatsAppLogType.PHONE_VALIDATION_FAILED, 'Phone validation failed', logContext);
  }

  async logPersonalizationError(campaignId: string, contactId: string, error: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      error,
      type: WhatsAppLogType.PERSONALIZATION_ERROR,
      source: this.source,
    };

    logger.error(`WhatsApp personalization error for contact ${contactId}: ${error}`, logContext);
    await this.persistLog(LogLevel.ERROR, WhatsAppLogType.PERSONALIZATION_ERROR, 'Personalization failed', logContext);
  }

  async logRateLimitExceeded(campaignId: string, limit: number, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      campaignId,
      limit,
      type: WhatsAppLogType.RATE_LIMIT_EXCEEDED,
      source: this.source,
    };

    logger.warn(`WhatsApp rate limit exceeded for campaign ${campaignId}: ${limit}`, logContext);
    await this.persistLog(LogLevel.WARN, WhatsAppLogType.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', logContext);
  }

  // Template approval logging methods
  async logTemplateSubmitted(templateId: string, metaTemplateId: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      templateId,
      metaTemplateId,
      type: WhatsAppLogType.TEMPLATE_SUBMITTED,
      source: this.source,
    };

    logger.info(`WhatsApp template submitted for approval: ${templateId} -> ${metaTemplateId}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.TEMPLATE_SUBMITTED, 'Template submitted for approval', logContext);
  }

  async logTemplateStatusChanged(templateId: string, status: string, context?: WhatsAppLogContext) {
    const logContext = {
      ...context,
      templateId,
      status,
      type: WhatsAppLogType.TEMPLATE_STATUS_CHANGED,
      source: this.source,
    };

    logger.info(`WhatsApp template status changed: ${templateId} -> ${status}`, logContext);
    await this.persistLog(LogLevel.INFO, WhatsAppLogType.TEMPLATE_STATUS_CHANGED, 'Template status changed', logContext);
  }

  // Utility methods
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 8) return phoneNumber;
    // Show first 3 and last 4 digits
    const visibleStart = phoneNumber.substring(0, 3);
    const visibleEnd = phoneNumber.substring(phoneNumber.length - 4);
    const maskedMiddle = '*'.repeat(phoneNumber.length - 7);
    return `${visibleStart}${maskedMiddle}${visibleEnd}`;
  }

  // Persist log to database
  private async persistLog(level: LogLevel, type: WhatsAppLogType, message: string, context: WhatsAppLogContext) {
    try {
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: type,
          entityType: 'WHATSAPP_CAMPAIGN',
          entityId: context.campaignId || null,
          userId: context.userId || 'system',
          details: {
            level,
            message,
            ...context,
            timestamp: new Date().toISOString(),
          } as any,
          userAgent: 'WhatsApp Campaign System',
          ipAddress: '127.0.0.1', // Internal system
        }
      });
    } catch (error) {
      // Don't throw errors from logging - just log to console
      console.error('Failed to persist WhatsApp campaign log:', error);
    }
  }
}

// Export singleton instance
export const whatsappLogger = new WhatsAppCampaignLogger();