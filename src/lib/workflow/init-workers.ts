/**
 * Workflow Workers Initialization
 * 
 * This module ensures that workflow queue workers are properly started
 * and handles the initialization of the workflow processing system.
 */

import { logger } from '@/lib/logger';
import { workerManager } from './workers';
import { triggerManager } from './trigger-manager';

let workersInitialized = false;

/**
 * Initialize workflow workers
 * This function should be called once when the application starts
 */
export async function initializeWorkflowWorkers(): Promise<void> {
  // Skip worker initialization during build time
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
    process.env.BUILDING === 'true' ||
    process.argv.includes('build') ||
    (process.argv.includes('next') && process.argv.includes('build'));

  if (isBuildTime) {
    logger.info('Skipping workflow workers initialization during build');
    return;
  }

  if (workersInitialized) {
    logger.warn('Workflow workers already running');
    return;
  }

  try {
    logger.info('Initializing workflow processing system...');

    // Start the worker manager
    await workerManager.start();

    // Test queue connectivity
    await testQueueConnectivity();

    workersInitialized = true;
    logger.info('Workflow workers successfully initialized');

  } catch (error) {
    logger.error('Failed to initialize workflow workers', { error });
    throw error;
  }
}

/**
 * Test queue connectivity and basic functionality
 */
async function testQueueConnectivity(): Promise<void> {
  try {
    const { workflowQueue, delayQueue, triggerQueue } = await import('@/lib/queue');

    // Test basic queue operations
    const testResults = await Promise.allSettled([
      workflowQueue.getWaiting(),
      delayQueue.getWaiting(),
      triggerQueue.getWaiting()
    ]);

    const failures = testResults.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      throw new Error(`Queue connectivity test failed: ${failures.length} queues unreachable`);
    }

    logger.info('Queue connectivity test passed');
  } catch (error) {
    logger.error('Queue connectivity test failed', { error });
    throw error;
  }
}

/**
 * Get workflow workers status
 */
export async function getWorkersStatus(): Promise<{
  initialized: boolean;
  queueStats?: any;
  error?: string;
}> {
  try {
    if (!workersInitialized) {
      return { initialized: false };
    }

    const { getWorkflowQueueStats } = await import('./workers');
    const queueStats = await getWorkflowQueueStats();

    return {
      initialized: true,
      queueStats
    };
  } catch (error) {
    return {
      initialized: workersInitialized,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Stop workflow workers (for graceful shutdown)
 */
export async function stopWorkflowWorkers(): Promise<void> {
  if (!workersInitialized) {
    return;
  }

  try {
    logger.info('Stopping workflow workers...');
    await workerManager.stop();
    workersInitialized = false;
    logger.info('Workflow workers stopped');
  } catch (error) {
    logger.error('Error stopping workflow workers', { error });
    throw error;
  }
}

// Auto-initialize in production mode
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_WORKERS === 'true') {
  initializeWorkflowWorkers().catch(error => {
    logger.error('Failed to auto-initialize workflow workers', { error });
  });
}