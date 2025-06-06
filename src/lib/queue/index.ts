import Queue from 'bull';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
};

// Create Redis connection
export const redis = new IORedis(redisConfig);

// Job Queues
export const workflowQueue = new Queue('workflow processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const delayQueue = new Queue('delayed actions', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const triggerQueue = new Queue('workflow triggers', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Job Types
export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  contactId: string;
  stepId?: string;
  context?: Record<string, any>;
}

export interface DelayJobData {
  executionId: string;
  stepId: string;
  delayMs: number;
  nextStepId: string;
}

export interface TriggerJobData {
  eventType: string;
  eventData: Record<string, any>;
  contactId?: string;
  workflowId?: string;
}

// Queue monitoring and health checks
export const getQueueStats = async () => {
  const [workflowStats, delayStats, triggerStats] = await Promise.all([
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
    },
    {
      waiting: await triggerQueue.getWaiting(),
      active: await triggerQueue.getActive(),
      completed: await triggerQueue.getCompleted(),
      failed: await triggerQueue.getFailed(),
    },
  ]);

  return {
    workflow: workflowStats,
    delay: delayStats,
    trigger: triggerStats,
  };
};

// Graceful shutdown
export const closeQueues = async () => {
  await Promise.all([
    workflowQueue.close(),
    delayQueue.close(),
    triggerQueue.close(),
    redis.disconnect(),
  ]);
};

// Queue error handling
workflowQueue.on('error', (error: Error) => {
  console.error('Workflow queue error:', error);
});

delayQueue.on('error', (error: Error) => {
  console.error('Delay queue error:', error);
});

triggerQueue.on('error', (error: Error) => {
  console.error('Trigger queue error:', error);
});

// Queue event logging
if (process.env.NODE_ENV === 'development') {
  workflowQueue.on('completed', (job: any, result: any) => {
    console.log(`Workflow job ${job.id} completed:`, result);
  });

  workflowQueue.on('failed', (job: any, err: Error) => {
    console.log(`Workflow job ${job.id} failed:`, err.message);
  });
} 