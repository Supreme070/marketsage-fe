/**
 * Queue Management System for MarketSage
 * 
 * Handles job queues for workflows, email, SMS, and other async operations
 * using Bull Queue with Redis backing store.
 */

import Queue from 'bull';
import { redisClient } from '@/lib/cache/redis-client';
import { logger } from '@/lib/logger';

// Queue job data interfaces
export interface WorkflowJobData {
  workflowId: string;
  contactId: string;
  executionId: string;
  stepId?: string;
  triggerData?: Record<string, any>;
  retryCount?: number;
}

export interface EmailJobData {
  campaignId?: string;
  contactId: string;
  templateId?: string;
  emailData: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  };
  trackingData?: Record<string, any>;
  retryCount?: number;
}

export interface SMSJobData {
  campaignId?: string;
  contactId: string;
  templateId?: string;
  smsData: {
    to: string;
    message: string;
    from?: string;
  };
  trackingData?: Record<string, any>;
  retryCount?: number;
}

export interface DelayJobData {
  type: 'workflow' | 'email' | 'sms';
  originalJobData: WorkflowJobData | EmailJobData | SMSJobData;
  delay: number; // milliseconds
  executeAt: Date;
}

// Redis configuration for Bull queues
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: Number.parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  },
};

// Check if we're in build mode
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
  process.env.BUILDING === 'true' ||
  process.argv.includes('build') ||
  (process.argv.includes('next') && process.argv.includes('build'));

// Create queues only if not in build mode
export const workflowQueue: Queue<WorkflowJobData> | null = isBuildTime ? null : new Queue<WorkflowJobData>('workflow-execution', redisConfig);
export const emailQueue: Queue<EmailJobData> | null = isBuildTime ? null : new Queue<EmailJobData>('email-sending', redisConfig);
export const smsQueue: Queue<SMSJobData> | null = isBuildTime ? null : new Queue<SMSJobData>('sms-sending', redisConfig);
export const delayQueue: Queue<DelayJobData> | null = isBuildTime ? null : new Queue<DelayJobData>('delayed-jobs', redisConfig);

// Queue configuration
const commonQueueOptions = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
  attempts: 3,           // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

// Apply settings to all queues (only if they exist)
if (!isBuildTime) {
  [workflowQueue, emailQueue, smsQueue, delayQueue].forEach(queue => {
    if (queue) {
      queue.setMaxListeners(50); // Increase listener limit
    }
  });
}

// Error handling for all queues
const setupQueueErrorHandling = (queue: Queue, name: string) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} is waiting in ${name} queue`);
  });

  queue.on('active', (job) => {
    logger.debug(`Job ${job.id} started in ${name} queue`);
  });

  queue.on('completed', (job, result) => {
    logger.debug(`Job ${job.id} completed in ${name} queue`, { result });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed in ${name} queue:`, err);
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in ${name} queue`);
  });
};

// Setup error handling for all queues (only if they exist)
if (!isBuildTime) {
  if (workflowQueue) setupQueueErrorHandling(workflowQueue, 'workflow');
  if (emailQueue) setupQueueErrorHandling(emailQueue, 'email');
  if (smsQueue) setupQueueErrorHandling(smsQueue, 'sms');
  if (delayQueue) setupQueueErrorHandling(delayQueue, 'delay');
}

// Workflow queue processors (only if not in build mode)
if (!isBuildTime && workflowQueue) {
  workflowQueue.process('execute-workflow', async (job) => {
  const { WorkflowExecutionEngine } = await import('@/lib/workflow/execution-engine');
  const engine = new WorkflowExecutionEngine();
  
  const { workflowId, contactId, executionId, stepId, triggerData } = job.data;
  
  try {
    if (stepId) {
      // Execute specific step
      return await engine.executeWorkflowStep(executionId, stepId);
    } else {
      // Start workflow execution
      return await engine.startWorkflowExecution(workflowId, contactId, triggerData);
    }
  } catch (error) {
    logger.error('Workflow execution failed:', error);
    throw error;
  }
  });
}

// Email queue processors
if (!isBuildTime && emailQueue) {
  emailQueue.process('send-email', async (job) => {
  const { sendTrackedEmail } = await import('@/lib/email-service');
  
  const { contactId, emailData, trackingData, campaignId } = job.data;
  
  try {
    return await sendTrackedEmail({
      ...emailData,
      campaignId,
      contactId,
      trackingData,
    });
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
  });
}

// SMS queue processors
if (!isBuildTime && smsQueue) {
  smsQueue.process('send-sms', async (job) => {
  const { sendSMS } = await import('@/lib/sms-service');
  
  const { contactId, smsData, trackingData, campaignId } = job.data;
  
  try {
    return await sendSMS({
      ...smsData,
      campaignId,
      contactId,
      trackingData,
    });
  } catch (error) {
    logger.error('SMS sending failed:', error);
    throw error;
  }
  });
}

// Delay queue processors
if (!isBuildTime && delayQueue) {
  delayQueue.process('execute-delayed', async (job) => {
  const { type, originalJobData } = job.data;
  
  try {
    switch (type) {
      case 'workflow':
        if (!workflowQueue) throw new Error('Workflow queue not available');
        return await workflowQueue.add('execute-workflow', originalJobData as WorkflowJobData, commonQueueOptions);
      case 'email':
        if (!emailQueue) throw new Error('Email queue not available');
        return await emailQueue.add('send-email', originalJobData as EmailJobData, commonQueueOptions);
      case 'sms':
        if (!smsQueue) throw new Error('SMS queue not available');
        return await smsQueue.add('send-sms', originalJobData as SMSJobData, commonQueueOptions);
      default:
        throw new Error(`Unknown delayed job type: ${type}`);
    }
  } catch (error) {
    logger.error('Delayed job execution failed:', error);
    throw error;
  }
  });
}

// Queue utility functions
export class QueueManager {
  /**
   * Add a workflow execution job
   */
  static async addWorkflowJob(data: WorkflowJobData, options = {}): Promise<void> {
    if (!workflowQueue) {
      throw new Error('Workflow queue not available (build mode)');
    }
    try {
      await workflowQueue.add('execute-workflow', data, {
        ...commonQueueOptions,
        ...options,
      });
      logger.info('Workflow job added to queue', { workflowId: data.workflowId, contactId: data.contactId });
    } catch (error) {
      logger.error('Failed to add workflow job:', error);
      throw error;
    }
  }

  /**
   * Add an email sending job
   */
  static async addEmailJob(data: EmailJobData, options = {}): Promise<void> {
    if (!emailQueue) {
      throw new Error('Email queue not available (build mode)');
    }
    try {
      await emailQueue.add('send-email', data, {
        ...commonQueueOptions,
        ...options,
      });
      logger.info('Email job added to queue', { to: data.emailData.to, campaignId: data.campaignId });
    } catch (error) {
      logger.error('Failed to add email job:', error);
      throw error;
    }
  }

  /**
   * Add an SMS sending job
   */
  static async addSMSJob(data: SMSJobData, options = {}): Promise<void> {
    if (!smsQueue) {
      throw new Error('SMS queue not available (build mode)');
    }
    try {
      await smsQueue.add('send-sms', data, {
        ...commonQueueOptions,
        ...options,
      });
      logger.info('SMS job added to queue', { to: data.smsData.to, campaignId: data.campaignId });
    } catch (error) {
      logger.error('Failed to add SMS job:', error);
      throw error;
    }
  }

  /**
   * Add a delayed job
   */
  static async addDelayedJob(data: DelayJobData, options = {}): Promise<void> {
    if (!delayQueue) {
      throw new Error('Delay queue not available (build mode)');
    }
    try {
      const delay = Math.max(0, data.executeAt.getTime() - Date.now());
      
      await delayQueue.add('execute-delayed', data, {
        ...commonQueueOptions,
        delay,
        ...options,
      });
      logger.info('Delayed job added to queue', { type: data.type, delay, executeAt: data.executeAt });
    } catch (error) {
      logger.error('Failed to add delayed job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    if (isBuildTime) {
      return {
        workflow: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0 },
        email: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0 },
        sms: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0 },
        delay: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0 },
        timestamp: new Date(),
      };
    }
    try {
      const [workflowStats, emailStats, smsStats, delayStats] = await Promise.all([
        this.getIndividualQueueStats(workflowQueue, 'workflow'),
        this.getIndividualQueueStats(emailQueue, 'email'),
        this.getIndividualQueueStats(smsQueue, 'sms'),
        this.getIndividualQueueStats(delayQueue, 'delay'),
      ]);

      return {
        workflow: workflowStats,
        email: emailStats,
        sms: smsStats,
        delay: delayStats,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Get statistics for an individual queue
   */
  private static async getIndividualQueueStats(queue: Queue | null, name: string) {
    if (!queue) {
      return {
        name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: false,
      };
    }
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: await queue.isPaused(),
      };
    } catch (error) {
      logger.error(`Failed to get stats for ${name} queue:`, error);
      return {
        name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: false,
        error: true,
      };
    }
  }

  /**
   * Pause all queues
   */
  static async pauseAllQueues(): Promise<void> {
    try {
      await Promise.all([
        workflowQueue.pause(),
        emailQueue.pause(),
        smsQueue.pause(),
        delayQueue.pause(),
      ]);
      logger.info('All queues paused');
    } catch (error) {
      logger.error('Failed to pause all queues:', error);
      throw error;
    }
  }

  /**
   * Resume all queues
   */
  static async resumeAllQueues(): Promise<void> {
    try {
      await Promise.all([
        workflowQueue.resume(),
        emailQueue.resume(),
        smsQueue.resume(),
        delayQueue.resume(),
      ]);
      logger.info('All queues resumed');
    } catch (error) {
      logger.error('Failed to resume all queues:', error);
      throw error;
    }
  }

  /**
   * Clean old jobs from all queues
   */
  static async cleanAllQueues(olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cleanPromises = [workflowQueue, emailQueue, smsQueue, delayQueue].map(async (queue) => {
        const [completedCleaned, failedCleaned] = await Promise.all([
          queue.clean(olderThan, 'completed'),
          queue.clean(olderThan, 'failed'),
        ]);
        return { completed: completedCleaned, failed: failedCleaned };
      });

      const results = await Promise.all(cleanPromises);
      logger.info('Queue cleanup completed', { results });
    } catch (error) {
      logger.error('Failed to clean queues:', error);
      throw error;
    }
  }

  /**
   * Gracefully shutdown all queues
   */
  static async shutdown(): Promise<void> {
    try {
      await Promise.all([
        workflowQueue.close(),
        emailQueue.close(),
        smsQueue.close(),
        delayQueue.close(),
      ]);
      logger.info('All queues shut down gracefully');
    } catch (error) {
      logger.error('Error during queue shutdown:', error);
      throw error;
    }
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down queues...');
  await QueueManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down queues...');
  await QueueManager.shutdown();
  process.exit(0);
});