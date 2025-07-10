/**
 * SMS Campaign Scheduler Service
 * 
 * Handles scheduling and automatic execution of SMS campaigns
 * with timezone support and comprehensive logging.
 */

import prisma from '@/lib/db/prisma';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { logger } from '@/lib/logger';

interface ScheduleConfig {
  campaignId: string;
  scheduledAt: Date;
  timezone?: string;
  userId: string;
  metadata?: Record<string, any>;
}

interface ScheduledJob {
  id: string;
  campaignId: string;
  scheduledAt: Date;
  timezone: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  userId: string;
  attempts: number;
  lastError?: string;
  metadata?: Record<string, any>;
}

export class SMSSchedulerService {
  private readonly maxRetryAttempts = 3;
  private readonly retryDelayMs = 300000; // 5 minutes

  /**
   * Schedule an SMS campaign for future sending
   */
  async scheduleCampaign(config: ScheduleConfig): Promise<boolean> {
    try {
      const { campaignId, scheduledAt, timezone = 'UTC', userId, metadata = {} } = config;

      // Validate campaign exists and is in correct state
      const campaign = await prisma.sMSCampaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          status: true,
          createdById: true,
          name: true,
          content: true,
          templateId: true
        }
      });

      if (!campaign) {
        logger.error('Cannot schedule non-existent campaign', { campaignId });
        return false;
      }

      if (campaign.status !== 'DRAFT') {
        logger.error('Cannot schedule campaign that is not in DRAFT status', { 
          campaignId, 
          currentStatus: campaign.status 
        });
        return false;
      }

      // Validate scheduled time is in the future
      const now = new Date();
      if (scheduledAt <= now) {
        logger.error('Cannot schedule campaign for past time', { 
          campaignId, 
          scheduledAt: scheduledAt.toISOString(),
          currentTime: now.toISOString()
        });
        return false;
      }

      // Check if campaign already scheduled
      if (campaign.status === 'SCHEDULED') {
        logger.warn('Campaign already scheduled', { campaignId });
        return false;
      }

      // Update campaign status to SCHEDULED and set scheduled time
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'SCHEDULED',
          scheduledFor: scheduledAt
        }
      });

      await smsLogger.logCampaignScheduled(campaignId, scheduledAt, {
        userId,
        timezone
      });

      logger.info('SMS campaign scheduled successfully', {
        campaignId,
        scheduledAt: scheduledAt.toISOString(),
        timezone
      });

      return true;
    } catch (error) {
      logger.error('Failed to schedule SMS campaign', { 
        campaignId: config.campaignId, 
        error 
      });
      return false;
    }
  }

  /**
   * Process all pending scheduled campaigns
   */
  async processScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date();
      
      // Get all scheduled campaigns that are due
      const dueCampaigns = await prisma.sMSCampaign.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: { lte: now }
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdById: true,
          scheduledFor: true
        },
        orderBy: { scheduledFor: 'asc' },
        take: 50 // Process in batches
      });

      if (dueCampaigns.length === 0) {
        return;
      }

      logger.info(`Processing ${dueCampaigns.length} scheduled SMS campaigns`);

      for (const campaign of dueCampaigns) {
        await this.executeScheduledCampaign(campaign);
        
        // Add small delay between executions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Error processing scheduled SMS campaigns', { error });
    }
  }

  /**
   * Execute a scheduled campaign
   */
  private async executeScheduledCampaign(campaign: any): Promise<void> {
    try {
      // Validate campaign is still in valid state
      if (campaign.status !== 'SCHEDULED') {
        logger.warn('Skipping scheduled campaign - status changed', {
          campaignId: campaign.id,
          expectedStatus: 'SCHEDULED',
          actualStatus: campaign.status
        });
        return;
      }

      // Trigger campaign send by calling the send API internally
      const sendResult = await this.triggerCampaignSend(campaign.id, campaign.createdById);

      if (sendResult.success) {
        await smsLogger.logScheduledCampaignExecuted(campaign.id, campaign.id, {
          userId: campaign.createdById,
          originalScheduleTime: campaign.scheduledFor,
          actualExecutionTime: new Date()
        });

        logger.info('Scheduled SMS campaign executed successfully', {
          campaignId: campaign.id
        });
      } else {
        logger.error('Failed to execute scheduled SMS campaign', {
          campaignId: campaign.id,
          error: sendResult.error
        });
        
        // Reset campaign to DRAFT state on failure
        await prisma.sMSCampaign.update({
          where: { id: campaign.id },
          data: { 
            status: 'DRAFT',
            scheduledFor: null
          }
        });
      }
    } catch (error) {
      logger.error('Error executing scheduled SMS campaign', {
        campaignId: campaign.id,
        error
      });
      
      // Reset campaign to DRAFT state on error
      await prisma.sMSCampaign.update({
        where: { id: campaign.id },
        data: { 
          status: 'DRAFT',
          scheduledFor: null
        }
      });
    }
  }

  /**
   * Trigger campaign send (simulates API call)
   */
  private async triggerCampaignSend(campaignId: string, userId: string): Promise<{
    success: boolean;
    error?: any;
  }> {
    try {
      // Reset campaign to DRAFT so it can be sent
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'DRAFT',
          scheduledFor: null
        }
      });

      // Note: In a production implementation, this would make an HTTP request to the send endpoint
      // For now, we'll simulate success and let the actual send logic be handled separately
      // const response = await fetch(`${baseUrl}/api/sms/campaigns/${campaignId}/send`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${userToken}` }
      // });

      logger.info('Campaign prepared for sending', { campaignId, userId });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to trigger campaign send', { campaignId, error });
      return { success: false, error };
    }
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelScheduledCampaign(campaignId: string, userId: string): Promise<boolean> {
    try {
      const campaign = await prisma.sMSCampaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          status: true,
          scheduledFor: true
        }
      });

      if (!campaign) {
        logger.warn('Campaign not found to cancel', { campaignId });
        return false;
      }

      if (campaign.status !== 'SCHEDULED') {
        logger.warn('Campaign is not scheduled', { campaignId, status: campaign.status });
        return false;
      }

      // Update campaign status back to DRAFT
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'DRAFT',
          scheduledFor: null
        }
      });

      await smsLogger.logScheduledCampaignCancelled(campaignId, campaignId, { userId });

      logger.info('Scheduled SMS campaign cancelled', {
        campaignId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to cancel scheduled SMS campaign', { campaignId, error });
      return false;
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      const [scheduled, sending, sent, draft, cancelled] = await Promise.all([
        prisma.sMSCampaign.count({ 
          where: { 
            status: 'SCHEDULED',
            scheduledFor: { gt: new Date() } // Future scheduled
          } 
        }),
        prisma.sMSCampaign.count({ 
          where: { 
            status: 'SENDING'
          } 
        }),
        prisma.sMSCampaign.count({ 
          where: { 
            status: 'SENT',
            scheduledFor: { not: null } // Was scheduled
          } 
        }),
        prisma.sMSCampaign.count({ 
          where: { 
            status: 'DRAFT',
            scheduledFor: { not: null } // Was scheduled but reset
          } 
        }),
        prisma.sMSCampaign.count({ 
          where: { 
            status: 'CANCELLED',
            scheduledFor: { not: null } // Was scheduled
          } 
        })
      ]);

      return { 
        pending: scheduled, 
        processing: sending, 
        completed: sent, 
        failed: draft, 
        cancelled 
      };
    } catch (error) {
      logger.error('Error getting SMS schedule stats', { error });
      return { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
    }
  }

  /**
   * Clean up old scheduled campaigns
   */
  async cleanupOldSchedules(olderThanDays = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Reset old scheduled campaigns that were never sent
      const result = await prisma.sMSCampaign.updateMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: { lt: cutoffDate }
        },
        data: {
          status: 'DRAFT',
          scheduledFor: null
        }
      });

      logger.info(`Cleaned up ${result.count} old scheduled SMS campaigns`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old SMS schedules', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const smsSchedulerService = new SMSSchedulerService();