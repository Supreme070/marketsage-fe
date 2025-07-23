import { workflowQueue, delayQueue, type WorkflowJobData, type DelayJobData } from '@/lib/queue';
import { workflowEngine } from './execution-engine';
import { logger } from '@/lib/logger';
import cron from 'node-cron';
import { triggerManager } from './trigger-manager';
import prisma from '@/lib/db/prisma';

/**
 * Workflow Queue Processors
 */

// Process workflow execution steps (only if queue is available)
if (workflowQueue) {
  workflowQueue.process('execute-step', async (job: any) => {
  const { executionId, stepId } = job.data as WorkflowJobData;
  
  logger.info('Processing workflow step', { executionId, stepId, jobId: job.id });
  
  try {
    await workflowEngine.executeStep(executionId, stepId!);
    logger.info('Workflow step completed', { executionId, stepId, jobId: job.id });
  } catch (error) {
    logger.error('Workflow step failed', { executionId, stepId, jobId: job.id, error });
    throw error;
  }
  });

  // Process workflow start requests
  workflowQueue.process('start-workflow', async (job: any) => {
  const { workflowId, contactId, context } = job.data as WorkflowJobData;
  
  logger.info('Starting workflow execution', { workflowId, contactId, jobId: job.id });
  
  try {
    const executionId = await workflowEngine.startWorkflowExecution(
      workflowId!,
      contactId!,
      context
    );
    logger.info('Workflow execution started', { workflowId, contactId, executionId, jobId: job.id });
    return { executionId };
  } catch (error) {
    logger.error('Failed to start workflow execution', { workflowId, contactId, jobId: job.id, error });
    throw error;
  }
  });
}

/**
 * Delay Queue Processors
 */

// Process delayed workflow steps (only if queue is available)
if (delayQueue) {
  delayQueue.process('delayed-step', async (job: any) => {
  const { executionId, stepId } = job.data as DelayJobData;
  
  logger.info('Processing delayed workflow step', { executionId, stepId, jobId: job.id });
  
  try {
    await workflowEngine.executeStep(executionId, stepId);
    logger.info('Delayed workflow step completed', { executionId, stepId, jobId: job.id });
  } catch (error) {
    logger.error('Delayed workflow step failed', { executionId, stepId, jobId: job.id, error });
    throw error;
  }
  });
}

/**
 * Error Handling (only if queues are available)
 */

if (workflowQueue) {
  workflowQueue.on('completed', (job: any, result: any) => {
    logger.debug('Workflow job completed', { 
      jobId: job.id, 
      jobType: job.name,
      result 
    });
  });

  workflowQueue.on('failed', (job: any, err: any) => {
    logger.error('Workflow job failed', { 
      jobId: job.id, 
      jobType: job.name,
      error: err.message,
      stack: err.stack
    });
  });
}

if (delayQueue) {
  delayQueue.on('completed', (job: any, result: any) => {
    logger.debug('Delay job completed', { 
      jobId: job.id, 
      jobType: job.name,
    result 
  });
  });

  delayQueue.on('failed', (job: any, err: any) => {
    logger.error('Delay job failed', { 
      jobId: job.id, 
      jobType: job.name,
      error: err.message,
      stack: err.stack
    });
  });
}

/**
 * Scheduled Tasks (Cron Jobs) - Only run if not in build mode
 */

// Check if we're in build mode
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
  process.env.BUILDING === 'true' ||
  process.argv.includes('build') ||
  (process.argv.includes('next') && process.argv.includes('build'));

if (!isBuildTime) {
  // Process scheduled triggers every minute
  cron.schedule('* * * * *', async () => {
  try {
    await triggerManager.processScheduledTriggers();
  } catch (error) {
    logger.error('Failed to process scheduled triggers', { error });
  }
  });

  // Health check and cleanup every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await performHealthCheck();
      await cleanupCompletedJobs();
    } catch (error) {
      logger.error('Failed to perform health check', { error });
    }
  });

  // Cleanup stale executions every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupStaleExecutions();
    } catch (error) {
      logger.error('Failed to cleanup stale executions', { error });
    }
  });
}

/**
 * Health Check Functions
 */

async function performHealthCheck(): Promise<void> {
  logger.info('Performing workflow system health check');
  
  // Check queue health (only if queues are available)
  let workflowWaiting: any[] = [];
  let workflowActive: any[] = [];
  let delayWaiting: any[] = [];
  let delayActive: any[] = [];
  
  if (workflowQueue) {
    workflowWaiting = await workflowQueue.getWaiting();
    workflowActive = await workflowQueue.getActive();
  }
  
  if (delayQueue) {
    delayWaiting = await delayQueue.getWaiting();
    delayActive = await delayQueue.getActive();
  }
  
  logger.info('Queue status', {
    workflow: { waiting: workflowWaiting.length, active: workflowActive.length },
    delay: { waiting: delayWaiting.length, active: delayActive.length }
  });
  
  // Alert if queues are backing up
  if (workflowWaiting.length > 1000) {
    logger.warn('Workflow queue backing up', { waiting: workflowWaiting.length });
  }
  
  if (delayWaiting.length > 5000) {
    logger.warn('Delay queue backing up', { waiting: delayWaiting.length });
  }
}

async function cleanupCompletedJobs(): Promise<void> {
  logger.debug('Cleaning up completed jobs');
  
  // Clean up completed jobs older than 1 hour (only if queues are available)
  if (workflowQueue) {
    await workflowQueue.clean(60 * 60 * 1000, 'completed');
    await workflowQueue.clean(60 * 60 * 1000, 'failed');
  }
  
  if (delayQueue) {
    await delayQueue.clean(60 * 60 * 1000, 'completed');
    await delayQueue.clean(60 * 60 * 1000, 'failed');
  }
}

async function cleanupStaleExecutions(): Promise<void> {
  logger.info('Cleaning up stale workflow executions');
  
  // Find executions that have been running for more than 24 hours
  const staleExecutions = await prisma.workflowExecution.findMany({
    where: {
      status: 'RUNNING',
      lastExecutedAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });
  
  logger.info(`Found ${staleExecutions.length} stale executions`);
  
  // Mark them as failed
  for (const execution of staleExecutions) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        errorMessage: 'Execution timed out - marked as stale',
        completedAt: new Date()
      }
    });
  }
}

/**
 * Queue Management Functions
 */

export const pauseWorkflowProcessing = async (): Promise<void> => {
  await workflowQueue.pause();
  await delayQueue.pause();
  logger.info('Workflow processing paused');
};

export const resumeWorkflowProcessing = async (): Promise<void> => {
  await workflowQueue.resume();
  await delayQueue.resume();
  logger.info('Workflow processing resumed');
};

export const getWorkflowQueueStats = async () => {
  const [workflowStats, delayStats] = await Promise.all([
    {
      waiting: await workflowQueue.getWaiting(),
      active: await workflowQueue.getActive(),
      completed: await workflowQueue.getCompleted(),
      failed: await workflowQueue.getFailed(),
    },
    {
      waiting: await delayQueue.getWaiting(),
      active: await delayQueue.getActive(),
      completed: await delayQueue.getCompleted(),
      failed: await delayQueue.getFailed(),
    }
  ]);

  return {
    workflow: {
      waiting: workflowStats.waiting.length,
      active: workflowStats.active.length,
      completed: workflowStats.completed.length,
      failed: workflowStats.failed.length,
    },
    delay: {
      waiting: delayStats.waiting.length,
      active: delayStats.active.length,
      completed: delayStats.completed.length,
      failed: delayStats.failed.length,
    }
  };
};

/**
 * Worker Health and Monitoring
 */

export class WorkflowWorkerManager {
  private isRunning = false;
  
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Workflow workers already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting workflow workers');
    
    // Start processing jobs
    await resumeWorkflowProcessing();
    
    // Set up graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    logger.info('Stopping workflow workers');
    
    await pauseWorkflowProcessing();
  }
  
  private async gracefulShutdown(): Promise<void> {
    logger.info('Graceful shutdown initiated');
    
    await this.stop();
    
    // Wait for current jobs to complete (max 30 seconds)
    const timeout = setTimeout(() => {
      logger.warn('Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 30000);
    
    // Wait for active jobs to complete
    let activeJobs = 0;
    do {
      const stats = await getWorkflowQueueStats();
      activeJobs = stats.workflow.active + stats.delay.active;
      
      if (activeJobs > 0) {
        logger.info(`Waiting for ${activeJobs} active jobs to complete`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (activeJobs > 0);
    
    clearTimeout(timeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// Export worker manager instance
export const workerManager = new WorkflowWorkerManager();

// Auto-start workers in production (only if not in build mode)
if (process.env.NODE_ENV === 'production' && !isBuildTime) {
  workerManager.start().catch(error => {
    logger.error('Failed to start workflow workers', { error });
    process.exit(1);
  });
}

if (!isBuildTime) {
  logger.info('Workflow workers initialized');
} 