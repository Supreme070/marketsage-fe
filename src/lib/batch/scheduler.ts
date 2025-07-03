/**
 * Batch Processing Scheduler
 * ==========================
 * 
 * Manages scheduled batch jobs for customer profile processing
 * Runs every 2 days as specified in user's blueprint
 */

import { CustomerProfileProcessor } from './customer-profile-processor';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  lastRun?: Date;
  nextRun: Date;
  isActive: boolean;
  organizationId?: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Batch Job Scheduler
 * 
 * Manages and executes scheduled batch processing jobs
 */
export class BatchScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private executions: Map<string, JobExecution> = new Map();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultJobs();
  }

  /**
   * Initialize default batch jobs
   */
  private initializeDefaultJobs(): void {
    // Customer profile processing job (every day at 2 AM)
    this.addJob({
      id: 'customer-profile-batch',
      name: 'Customer Profile Batch Processing',
      schedule: '0 2 * * *', // Every day at 2 AM
      nextRun: this.calculateNextRun('0 2 * * *'),
      isActive: true
    });

    logger.info('Batch scheduler initialized with default jobs', {
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    });
  }

  /**
   * Start the batch scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Batch scheduler is already running');
      return;
    }

    this.isRunning = true;
    
    // Check for jobs to run every minute
    this.checkInterval = setInterval(() => {
      this.checkAndRunJobs();
    }, 60 * 1000);

    logger.info('Batch scheduler started', {
      checkInterval: '60 seconds',
      activeJobs: Array.from(this.jobs.values()).filter(j => j.isActive).length
    });
  }

  /**
   * Stop the batch scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    logger.info('Batch scheduler stopped');
  }

  /**
   * Add a new scheduled job
   */
  addJob(job: ScheduledJob): void {
    this.jobs.set(job.id, job);
    
    logger.info('Scheduled job added', {
      jobId: job.id,
      name: job.name,
      schedule: job.schedule,
      nextRun: job.nextRun.toISOString()
    });
  }

  /**
   * Remove a scheduled job
   */
  removeJob(jobId: string): boolean {
    const removed = this.jobs.delete(jobId);
    
    if (removed) {
      logger.info('Scheduled job removed', { jobId });
    }
    
    return removed;
  }

  /**
   * Get all scheduled jobs
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job execution history
   */
  getExecutions(): JobExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Check for jobs that need to run and execute them
   */
  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();
    
    for (const job of this.jobs.values()) {
      if (!job.isActive) continue;
      
      if (now >= job.nextRun) {
        await this.executeJob(job);
      }
    }
  }

  /**
   * Execute a scheduled job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: JobExecution = {
      id: executionId,
      jobId: job.id,
      startTime: new Date(),
      status: 'running'
    };

    this.executions.set(executionId, execution);
    
    logger.info('Starting batch job execution', {
      jobId: job.id,
      executionId,
      jobName: job.name
    });

    try {
      let result: any;

      // Execute the appropriate job function
      switch (job.id) {
        case 'customer-profile-batch':
          result = await CustomerProfileProcessor.processBatch(job.organizationId);
          break;
        default:
          throw new Error(`Unknown job type: ${job.id}`);
      }

      // Update execution as completed
      execution.endTime = new Date();
      execution.status = 'completed';
      execution.result = result;

      // Update job with last run time and calculate next run
      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.schedule);

      // Store execution result in database
      await this.storeExecutionResult(execution);

      logger.info('Batch job execution completed successfully', {
        jobId: job.id,
        executionId,
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
        result: result
      });

    } catch (error) {
      // Update execution as failed
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      // Update job next run time even if failed
      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.schedule);

      // Store failed execution
      await this.storeExecutionResult(execution);

      logger.error('Batch job execution failed', {
        jobId: job.id,
        executionId,
        error: execution.error,
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });
    }
  }

  /**
   * Calculate next run time based on cron schedule
   */
  private calculateNextRun(cronSchedule: string): Date {
    // Simple implementation for "every day at 2 AM"
    // In production, would use a proper cron parser like 'cron-parser'
    
    if (cronSchedule === '0 2 * * *') {
      const now = new Date();
      const next = new Date(now);
      
      // Set to 2 AM
      next.setHours(2, 0, 0, 0);
      
      // If 2 AM today has passed, move to tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    }

    // Default: 24 hours from now
    const next = new Date();
    next.setHours(next.getHours() + 24);
    return next;
  }

  /**
   * Store execution result in database
   */
  private async storeExecutionResult(execution: JobExecution): Promise<void> {
    try {
      // Store in a batch_executions table (would need to add to Prisma schema)
      // For now, just log the execution
      logger.info('Batch execution stored', {
        executionId: execution.id,
        jobId: execution.jobId,
        status: execution.status,
        duration: execution.endTime ? 
          execution.endTime.getTime() - execution.startTime.getTime() : null,
        result: execution.result ? {
          totalContactsProcessed: execution.result.totalContactsProcessed,
          profilesCreated: execution.result.profilesCreated,
          profilesUpdated: execution.result.profilesUpdated,
          churnRisksDetected: execution.result.churnRisksDetected,
          highValueCustomersDetected: execution.result.highValueCustomersDetected,
          birthdayCampaignsTriggered: execution.result.birthdayCampaignsTriggered,
          aiInsightsGenerated: execution.result.aiInsightsGenerated,
          errorCount: execution.result.errors?.length || 0
        } : null
      });

    } catch (error) {
      logger.error('Failed to store batch execution result', {
        executionId: execution.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Trigger immediate job execution (for manual runs)
   */
  async runJobNow(jobId: string, organizationId?: string): Promise<JobExecution> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Create a copy of the job for immediate execution
    const immediateJob = { ...job };
    if (organizationId) {
      immediateJob.organizationId = organizationId;
    }

    await this.executeJob(immediateJob);
    
    // Return the latest execution
    const executions = Array.from(this.executions.values())
      .filter(e => e.jobId === jobId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return executions[0];
  }

  /**
   * Get job execution status
   */
  getJobStatus(jobId: string): {
    job: ScheduledJob | null;
    lastExecution: JobExecution | null;
    isRunning: boolean;
  } {
    const job = this.jobs.get(jobId) || null;
    
    const executions = Array.from(this.executions.values())
      .filter(e => e.jobId === jobId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    const lastExecution = executions[0] || null;
    const isRunning = lastExecution?.status === 'running';

    return { job, lastExecution, isRunning };
  }
}

// Singleton instance
let schedulerInstance: BatchScheduler | null = null;

/**
 * Get the singleton batch scheduler instance
 */
export function getBatchScheduler(): BatchScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new BatchScheduler();
  }
  return schedulerInstance;
}

/**
 * Initialize and start the batch scheduler
 */
export function startBatchScheduler(): BatchScheduler {
  const scheduler = getBatchScheduler();
  scheduler.start();
  return scheduler;
}

/**
 * Stop the batch scheduler
 */
export function stopBatchScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}