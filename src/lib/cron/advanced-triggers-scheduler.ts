/**
 * Advanced Triggers Cron Scheduler
 * 
 * Schedules and processes time-based workflow triggers using cron jobs.
 * Integrates with the advanced triggers service for comprehensive automation.
 */

import cron from 'node-cron';
import { logger } from '@/lib/logger';
import { advancedTriggersService } from '@/lib/workflow/advanced-triggers-service';

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

class AdvancedTriggersScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Advanced triggers scheduler is already running');
      return;
    }

    logger.info('Starting advanced workflow triggers scheduler');

    // Schedule time-based trigger processing every minute
    const timeBasedJob = cron.schedule('* * * * *', async () => {
      try {
        await advancedTriggersService.processTimeBasedTriggers();
      } catch (error) {
        logger.error('Failed to process time-based triggers', { error: error.message });
      }
    }, {
      scheduled: false
    });

    // Schedule delayed trigger processing every 5 minutes
    const delayedTriggersJob = cron.schedule('*/5 * * * *', async () => {
      try {
        await this.processDelayedTriggers();
      } catch (error) {
        logger.error('Failed to process delayed triggers', { error: error.message });
      }
    }, {
      scheduled: false
    });

    // Schedule behavioral trigger cleanup every hour
    const cleanupJob = cron.schedule('0 * * * *', async () => {
      try {
        await this.cleanupOldTriggerEvents();
      } catch (error) {
        logger.error('Failed to cleanup old trigger events', { error: error.message });
      }
    }, {
      scheduled: false
    });

    this.jobs.set('time-based-triggers', timeBasedJob);
    this.jobs.set('delayed-triggers', delayedTriggersJob);
    this.jobs.set('cleanup-triggers', cleanupJob);

    // Start all jobs
    timeBasedJob.start();
    delayedTriggersJob.start();
    cleanupJob.start();

    this.isRunning = true;
    logger.info('Advanced triggers scheduler started successfully', {
      jobsCount: this.jobs.size
    });
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Advanced triggers scheduler is not running');
      return;
    }

    logger.info('Stopping advanced workflow triggers scheduler');

    // Stop all jobs
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;

    logger.info('Advanced triggers scheduler stopped successfully');
  }

  /**
   * Process delayed triggers that are ready to execute
   */
  private async processDelayedTriggers(): Promise<void> {
    try {
      const now = new Date();

      // Find delayed triggers that are ready to execute
      const response = await fetch(`${BACKEND_URL}/api/workflow-events/delayed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch delayed triggers: ${response.statusText}`);
      }

      const readyTriggers = await response.json();

      let processedCount = 0;

      for (const trigger of readyTriggers) {
        try {
          const eventData = JSON.parse(trigger.eventData || '{}');
          const scheduledFor = new Date(eventData.scheduledFor);

          // Check if it's time to execute this trigger
          if (scheduledFor <= now) {
            const { workflowId, originalTriggerData } = eventData;

            // Process the delayed trigger
            await advancedTriggersService.processTriggerEvent({
              type: 'delayed_trigger_execution',
              contactId: trigger.contactId!,
              data: {
                workflowId,
                originalTriggerData,
                delayedTriggerId: trigger.id,
              },
            });

            // Mark as processed
            const updateResponse = await fetch(`${BACKEND_URL}/api/workflow-events/${trigger.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ processed: true }),
            });

            if (!updateResponse.ok) {
              throw new Error(`Failed to update trigger: ${updateResponse.statusText}`);
            }

            processedCount++;
          }
        } catch (error) {
          logger.error('Failed to process delayed trigger', {
            triggerId: trigger.id,
            error: error.message,
          });
        }
      }

      if (processedCount > 0) {
        logger.info('Processed delayed triggers', {
          processedCount,
          totalFound: readyTriggers.length,
        });
      }
    } catch (error) {
      logger.error('Failed to process delayed triggers', { error: error.message });
    }
  }

  /**
   * Cleanup old trigger events to maintain database performance
   */
  private async cleanupOldTriggerEvents(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const response = await fetch(`${BACKEND_URL}/api/workflow-events/cleanup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cutoffDate: cutoffDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cleanup old trigger events: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.count > 0) {
        logger.info('Cleaned up old trigger events', {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup old trigger events', { error: error.message });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; jobsCount: number; jobs: string[] } {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

// Export singleton instance
export const advancedTriggersScheduler = new AdvancedTriggersScheduler();

// Auto-start in production environments
if (process.env.NODE_ENV === 'production') {
  advancedTriggersScheduler.start();
}
