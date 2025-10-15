import { logger, LogLevel, type LogContext } from './logger';
// NOTE: Prisma removed - using backend API (AuditLog table exists in backend)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

// SMS Campaign specific log types
export enum SMSLogType {
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'CAMPAIGN_UPDATED',
  CAMPAIGN_DELETED = 'CAMPAIGN_DELETED',
  CAMPAIGN_SENT = 'CAMPAIGN_SENT',
  CAMPAIGN_SCHEDULED = 'CAMPAIGN_SCHEDULED',
  CAMPAIGN_FAILED = 'CAMPAIGN_FAILED',
  SEND_INITIATED = 'SEND_INITIATED',
  SEND_BATCH_COMPLETED = 'SEND_BATCH_COMPLETED',
  SEND_COMPLETED = 'SEND_COMPLETED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_FAILED = 'MESSAGE_FAILED',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  PHONE_VALIDATION_FAILED = 'PHONE_VALIDATION_FAILED',
  PERSONALIZATION_ERROR = 'PERSONALIZATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Extended context for SMS operations
export interface SMSLogContext extends LogContext {
  campaignId?: string;
  contactId?: string;
  userId?: string;
  messageId?: string;
  provider?: string;
  phoneNumber?: string;
  recipientCount?: number;
  successCount?: number;
  failureCount?: number;
  batchNumber?: number;
  errorCode?: string;
  errorDetails?: any;
  metadata?: Record<string, any>;
}

// SMS Campaign Logger class
export class SMSCampaignLogger {
  private readonly source = 'SMS_CAMPAIGN';

  // Log campaign lifecycle events
  async logCampaignCreated(campaignId: string, userId: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: SMSLogType.CAMPAIGN_CREATED,
      source: this.source,
    };

    logger.info(`SMS campaign created: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.CAMPAIGN_CREATED, 'SMS campaign created', logContext);
  }

  async logCampaignUpdated(campaignId: string, userId: string, changes: any, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      changes,
      type: SMSLogType.CAMPAIGN_UPDATED,
      source: this.source,
    };

    logger.info(`SMS campaign updated: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.CAMPAIGN_UPDATED, 'SMS campaign updated', logContext);
  }

  async logCampaignDeleted(campaignId: string, userId: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: SMSLogType.CAMPAIGN_DELETED,
      source: this.source,
    };

    logger.info(`SMS campaign deleted: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.CAMPAIGN_DELETED, 'SMS campaign deleted', logContext);
  }

  async logCampaignFailed(campaignId: string, userId: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      userId,
      type: SMSLogType.CAMPAIGN_FAILED,
      source: this.source,
    };

    logger.error(`SMS campaign failed: ${campaignId}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.CAMPAIGN_FAILED, 'SMS campaign failed', logContext);
  }

  // Log sending operations
  async logSendInitiated(campaignId: string, recipientCount: number, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      recipientCount,
      type: SMSLogType.SEND_INITIATED,
      source: this.source,
    };

    logger.info(`SMS campaign send initiated: ${campaignId} to ${recipientCount} recipients`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.SEND_INITIATED, 'SMS campaign send initiated', logContext);
  }

  async logBatchCompleted(campaignId: string, batchNumber: number, successCount: number, failureCount: number, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      batchNumber,
      successCount,
      failureCount,
      type: SMSLogType.SEND_BATCH_COMPLETED,
      source: this.source,
    };

    logger.info(`SMS batch ${batchNumber} completed: ${successCount} sent, ${failureCount} failed`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.SEND_BATCH_COMPLETED, 'SMS batch completed', logContext);
  }

  async logSendCompleted(campaignId: string, totalSuccess: number, totalFailure: number, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      successCount: totalSuccess,
      failureCount: totalFailure,
      type: SMSLogType.SEND_COMPLETED,
      source: this.source,
    };

    logger.info(`SMS campaign send completed: ${campaignId} - ${totalSuccess} sent, ${totalFailure} failed`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.SEND_COMPLETED, 'SMS campaign send completed', logContext);
  }

  // Log individual message operations
  async logMessageSent(campaignId: string, contactId: string, messageId: string, phoneNumber: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      messageId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      type: SMSLogType.MESSAGE_SENT,
      source: this.source,
    };

    logger.debug(`SMS sent to ${this.maskPhoneNumber(phoneNumber)}`, logContext);
    // Only persist important message logs to avoid database bloat
    if (context?.metadata?.important) {
      await this.persistLog(LogLevel.DEBUG, SMSLogType.MESSAGE_SENT, 'SMS message sent', logContext);
    }
  }

  async logMessageFailed(campaignId: string, contactId: string, phoneNumber: string, error: any, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      error: error?.message || error,
      errorCode: error?.code,
      type: SMSLogType.MESSAGE_FAILED,
      source: this.source,
    };

    logger.error(`SMS failed to ${this.maskPhoneNumber(phoneNumber)}: ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.MESSAGE_FAILED, 'SMS message failed', logContext);
  }

  // Log error conditions
  async logValidationError(campaignId: string, error: string, details: any, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      error,
      errorDetails: details,
      type: SMSLogType.VALIDATION_ERROR,
      source: this.source,
    };

    logger.error(`SMS validation error: ${error}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.VALIDATION_ERROR, error, logContext);
  }

  async logAuthorizationError(userId: string, action: string, resource: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      userId,
      action,
      resource,
      type: SMSLogType.AUTHORIZATION_ERROR,
      source: this.source,
    };

    logger.warn(`SMS authorization error: User ${userId} denied ${action} on ${resource}`, logContext);
    await this.persistLog(LogLevel.WARN, SMSLogType.AUTHORIZATION_ERROR, 'Authorization denied', logContext);
  }

  async logProviderError(provider: string, error: any, context?: SMSLogContext) {
    const logContext = {
      ...context,
      provider,
      error: error?.message || error,
      errorCode: error?.code,
      errorDetails: error,
      type: SMSLogType.PROVIDER_ERROR,
      source: this.source,
    };

    logger.error(`SMS provider error (${provider}): ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.PROVIDER_ERROR, 'SMS provider error', logContext);
  }

  async logDatabaseError(operation: string, error: any, context?: SMSLogContext) {
    const logContext = {
      ...context,
      operation,
      error: error?.message || error,
      errorCode: error?.code,
      type: SMSLogType.DATABASE_ERROR,
      source: this.source,
    };

    logger.error(`SMS database error during ${operation}: ${error?.message || error}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.DATABASE_ERROR, 'Database operation failed', logContext);
  }

  // Log webhook events
  async logWebhookReceived(provider: string, messageId: string, status: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      provider,
      messageId,
      status,
      type: SMSLogType.WEBHOOK_RECEIVED,
      source: this.source,
    };

    logger.info(`SMS webhook received from ${provider} for message ${messageId}: ${status}`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.WEBHOOK_RECEIVED, 'SMS webhook received', logContext);
  }

  async logWebhookProcessed(provider: string, messageId: string, updateCount: number, context?: SMSLogContext) {
    const logContext = {
      ...context,
      provider,
      messageId,
      updateCount,
      type: SMSLogType.WEBHOOK_PROCESSED,
      source: this.source,
    };

    logger.info(`SMS webhook processed: ${updateCount} records updated`, logContext);
    await this.persistLog(LogLevel.INFO, SMSLogType.WEBHOOK_PROCESSED, 'SMS webhook processed', logContext);
  }

  // Log specific errors
  async logPhoneValidationFailed(phoneNumber: string, reason: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      reason,
      type: SMSLogType.PHONE_VALIDATION_FAILED,
      source: this.source,
    };

    logger.warn(`Phone validation failed for ${this.maskPhoneNumber(phoneNumber)}: ${reason}`, logContext);
    await this.persistLog(LogLevel.WARN, SMSLogType.PHONE_VALIDATION_FAILED, 'Phone validation failed', logContext);
  }

  async logPersonalizationError(campaignId: string, contactId: string, error: string, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      contactId,
      error,
      type: SMSLogType.PERSONALIZATION_ERROR,
      source: this.source,
    };

    logger.error(`SMS personalization error for contact ${contactId}: ${error}`, logContext);
    await this.persistLog(LogLevel.ERROR, SMSLogType.PERSONALIZATION_ERROR, 'Personalization failed', logContext);
  }

  async logRateLimitExceeded(campaignId: string, limit: number, context?: SMSLogContext) {
    const logContext = {
      ...context,
      campaignId,
      limit,
      type: SMSLogType.RATE_LIMIT_EXCEEDED,
      source: this.source,
    };

    logger.warn(`SMS rate limit exceeded for campaign ${campaignId}: ${limit}`, logContext);
    await this.persistLog(LogLevel.WARN, SMSLogType.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', logContext);
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
  private async persistLog(level: LogLevel, type: SMSLogType, message: string, context: SMSLogContext) {
    try {
      // Create audit log entry via backend API
      const response = await fetch(`${BACKEND_URL}/api/v2/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          entityType: 'SMS_CAMPAIGN',
          entityId: context.campaignId || null,
          userId: context.userId || 'system',
          details: {
            level,
            message,
            ...context,
            timestamp: new Date().toISOString(),
          },
          userAgent: 'SMS Campaign System',
          ipAddress: '127.0.0.1', // Internal system
        })
      });

      if (!response.ok) {
        console.error(`Failed to persist SMS campaign log: ${response.status}`);
      }
    } catch (error) {
      // Don't throw errors from logging - just log to console
      console.error('Failed to persist SMS campaign log:', error);
    }
  }
}

// Export singleton instance
export const smsLogger = new SMSCampaignLogger();