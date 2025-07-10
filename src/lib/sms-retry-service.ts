/**
 * SMS Campaign Retry Service
 * 
 * Handles automatic retry of failed SMS sends with exponential backoff
 * and comprehensive logging for debugging and monitoring.
 */

import prisma from '@/lib/db/prisma';
import { sendSMS } from '@/lib/sms-providers/sms-service';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { logger } from '@/lib/logger';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrorCodes: string[];
}

interface RetryJob {
  id: string;
  campaignId: string;
  contactId: string;
  phoneNumber: string;
  messageContent: string;
  attempt: number;
  lastError: string;
  nextRetryAt: Date;
  userId: string;
}

export class SMSRetryService {
  private readonly config: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 60000, // 1 minute
    maxDelayMs: 3600000, // 1 hour
    backoffMultiplier: 2,
    retryableErrorCodes: [
      'TIMEOUT',
      'NETWORK_ERROR',
      'RATE_LIMIT',
      'TEMPORARY_FAILURE',
      'PROVIDER_UNAVAILABLE'
    ]
  };

  /**
   * Add a failed SMS to the retry queue
   */
  async addToRetryQueue(
    campaignId: string,
    contactId: string,
    phoneNumber: string,
    messageContent: string,
    error: any,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if this error is retryable
      if (!this.isRetryableError(error)) {
        await smsLogger.logMessageFailed(
          campaignId,
          contactId,
          phoneNumber,
          `Non-retryable error: ${error?.message || error}`,
          { userId, retryable: false }
        );
        return false;
      }

      // Check if we already have a retry job for this message
      const existingJob = await prisma.sMSHistory.findFirst({
        where: {
          contactId,
          campaignId: campaignId,
          status: 'RETRY_PENDING'
        }
      });

      if (existingJob) {
        logger.warn('SMS retry job already exists', { 
          campaignId, 
          contactId, 
          existingJobId: existingJob.id 
        });
        return false;
      }

      // Calculate next retry time
      const nextRetryAt = new Date(Date.now() + this.config.initialDelayMs);

      // Create retry job in SMS history
      await prisma.sMSHistory.create({
        data: {
          contactId,
          userId,
          to: phoneNumber,
          message: messageContent,
          status: 'RETRY_PENDING',
          errorMessage: error?.message || String(error),
          retryCount: 0,
          nextRetryAt,
          metadata: JSON.stringify({
            campaignId,
            originalError: error,
            retryConfig: this.config
          })
        }
      });

      await smsLogger.logMessageFailed(
        campaignId,
        contactId,
        phoneNumber,
        `Added to retry queue: ${error?.message || error}`,
        { userId, retryable: true, nextRetryAt }
      );

      logger.info('SMS added to retry queue', {
        campaignId,
        contactId,
        nextRetryAt,
        error: error?.message || error
      });

      return true;
    } catch (retryError) {
      logger.error('Failed to add SMS to retry queue', {
        campaignId,
        contactId,
        error: retryError
      });
      return false;
    }
  }

  /**
   * Process all pending retries
   */
  async processRetryQueue(): Promise<void> {
    try {
      const pendingRetries = await prisma.sMSHistory.findMany({
        where: {
          status: 'RETRY_PENDING',
          nextRetryAt: { lte: new Date() },
          retryCount: { lt: this.config.maxRetries }
        },
        orderBy: { nextRetryAt: 'asc' },
        take: 50 // Process in batches
      });

      if (pendingRetries.length === 0) {
        return;
      }

      logger.info(`Processing ${pendingRetries.length} SMS retry jobs`);

      for (const retryJob of pendingRetries) {
        await this.processRetryJob(retryJob);
        
        // Add small delay between retries to avoid overwhelming providers
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error('Error processing SMS retry queue', { error });
    }
  }

  /**
   * Process an individual retry job
   */
  private async processRetryJob(retryJob: any): Promise<void> {
    try {
      const metadata = JSON.parse(retryJob.metadata || '{}');
      const campaignId = metadata.campaignId;

      // Attempt to send SMS
      const result = await sendSMS(retryJob.to, retryJob.message);

      if (result.success) {
        // Success - update status and log
        await prisma.sMSHistory.update({
          where: { id: retryJob.id },
          data: {
            status: 'SENT',
            deliveredAt: new Date(),
            messageId: result.messageId
          }
        });

        await smsLogger.logMessageSent(
          campaignId,
          retryJob.contactId,
          result.messageId || '',
          retryJob.to,
          { 
            userId: retryJob.userId, 
            retryAttempt: retryJob.retryCount + 1,
            isRetry: true
          }
        );

        logger.info('SMS retry successful', {
          campaignId,
          contactId: retryJob.contactId,
          attempt: retryJob.retryCount + 1
        });
      } else {
        // Failed - check if we should retry again
        await this.handleRetryFailure(retryJob, result.error, campaignId);
      }
    } catch (error) {
      await this.handleRetryFailure(retryJob, error, null);
    }
  }

  /**
   * Handle a failed retry attempt
   */
  private async handleRetryFailure(retryJob: any, error: any, campaignId: string | null): Promise<void> {
    const newRetryCount = retryJob.retryCount + 1;
    const metadata = JSON.parse(retryJob.metadata || '{}');
    const actualCampaignId = campaignId || metadata.campaignId;

    if (newRetryCount >= this.config.maxRetries || !this.isRetryableError(error)) {
      // Max retries reached or non-retryable error - mark as failed
      await prisma.sMSHistory.update({
        where: { id: retryJob.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message || String(error),
          retryCount: newRetryCount
        }
      });

      await smsLogger.logMessageFailed(
        actualCampaignId,
        retryJob.contactId,
        retryJob.to,
        `Max retries exceeded: ${error?.message || error}`,
        { 
          userId: retryJob.userId, 
          finalAttempt: true,
          totalAttempts: newRetryCount
        }
      );

      logger.warn('SMS retry failed permanently', {
        campaignId: actualCampaignId,
        contactId: retryJob.contactId,
        attempts: newRetryCount,
        error: error?.message || error
      });
    } else {
      // Schedule next retry with exponential backoff
      const delay = Math.min(
        this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, newRetryCount),
        this.config.maxDelayMs
      );
      const nextRetryAt = new Date(Date.now() + delay);

      await prisma.sMSHistory.update({
        where: { id: retryJob.id },
        data: {
          retryCount: newRetryCount,
          nextRetryAt,
          errorMessage: error?.message || String(error)
        }
      });

      logger.info('SMS retry rescheduled', {
        campaignId: actualCampaignId,
        contactId: retryJob.contactId,
        attempt: newRetryCount,
        nextRetryAt,
        delay
      });
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || '';

    // Check for specific retryable error codes
    if (this.config.retryableErrorCodes.includes(errorCode)) {
      return true;
    }

    // Check for retryable error messages
    const retryableMessages = [
      'timeout',
      'network error',
      'rate limit',
      'temporary',
      'unavailable',
      'busy',
      'try again'
    ];

    return retryableMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg)
    );
  }

  /**
   * Get retry queue statistics
   */
  async getRetryStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    succeeded: number;
  }> {
    try {
      const [pending, processing, failed, succeeded] = await Promise.all([
        prisma.sMSHistory.count({
          where: { status: 'RETRY_PENDING' }
        }),
        prisma.sMSHistory.count({
          where: { status: 'RETRY_PROCESSING' }
        }),
        prisma.sMSHistory.count({
          where: { 
            status: 'FAILED',
            retryCount: { gt: 0 }
          }
        }),
        prisma.sMSHistory.count({
          where: { 
            status: 'SENT',
            retryCount: { gt: 0 }
          }
        })
      ]);

      return { pending, processing, failed, succeeded };
    } catch (error) {
      logger.error('Error getting SMS retry stats', { error });
      return { pending: 0, processing: 0, failed: 0, succeeded: 0 };
    }
  }

  /**
   * Clean up old retry jobs
   */
  async cleanupOldRetries(olderThanDays = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.sMSHistory.deleteMany({
        where: {
          OR: [
            { status: 'FAILED', updatedAt: { lt: cutoffDate } },
            { status: 'SENT', retryCount: { gt: 0 }, updatedAt: { lt: cutoffDate } }
          ]
        }
      });

      logger.info(`Cleaned up ${result.count} old SMS retry records`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old SMS retries', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const smsRetryService = new SMSRetryService();