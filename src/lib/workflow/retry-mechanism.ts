/**
 * Workflow Execution Retry Mechanism
 * 
 * Handles intelligent retry logic for failed workflow steps,
 * implementing various retry strategies and circuit breaking.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { QueueManager } from '@/lib/queue';

// Retry configuration types
export interface RetryConfig {
  maxRetries: number;
  strategy: 'fixed' | 'exponential' | 'linear' | 'custom';
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add randomness to prevent thundering herd
  retryableErrors: string[]; // Error patterns that should trigger retries
  nonRetryableErrors: string[]; // Error patterns that should never retry
  circuitBreakerThreshold: number; // Consecutive failures before circuit opens
  circuitBreakerResetTime: number; // Time before circuit reset attempt
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  error: string;
  nextRetryAt?: Date;
  delayMs?: number;
}

export interface StepRetryState {
  stepId: string;
  executionId: string;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Date;
  nextRetryAt?: Date;
  strategy: string;
  isCircuitOpen: boolean;
  consecutiveFailures: number;
  attempts: RetryAttempt[];
  config: RetryConfig;
}

// Default retry configurations for different node types
const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  actionNode: {
    maxRetries: 3,
    strategy: 'exponential',
    baseDelay: 1000, // 1 second
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'network error',
      'timeout',
      'rate limit',
      'temporary failure',
      'service unavailable',
      'gateway timeout',
      'connection reset',
    ],
    nonRetryableErrors: [
      'invalid credentials',
      'unauthorized',
      'forbidden',
      'not found',
      'invalid input',
      'validation error',
      'malformed request',
    ],
    circuitBreakerThreshold: 5,
    circuitBreakerResetTime: 300000, // 5 minutes
  },
  webhookNode: {
    maxRetries: 5,
    strategy: 'exponential',
    baseDelay: 2000,
    maxDelay: 600000, // 10 minutes
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'network error',
      'timeout',
      'service unavailable',
      'gateway timeout',
      '5xx',
      'connection',
    ],
    nonRetryableErrors: [
      '4xx',
      'invalid webhook',
      'unauthorized',
      'forbidden',
      'not found',
    ],
    circuitBreakerThreshold: 3,
    circuitBreakerResetTime: 600000, // 10 minutes
  },
  apiCallNode: {
    maxRetries: 4,
    strategy: 'exponential',
    baseDelay: 1500,
    maxDelay: 300000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryableErrors: [
      'network error',
      'timeout',
      'rate limit',
      '5xx',
      'service unavailable',
    ],
    nonRetryableErrors: [
      '4xx',
      'authentication',
      'authorization',
      'invalid api key',
    ],
    circuitBreakerThreshold: 4,
    circuitBreakerResetTime: 300000,
  },
  databaseNode: {
    maxRetries: 2,
    strategy: 'fixed',
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1,
    jitter: false,
    retryableErrors: [
      'connection error',
      'timeout',
      'deadlock',
      'temporary failure',
    ],
    nonRetryableErrors: [
      'constraint violation',
      'syntax error',
      'invalid query',
      'permission denied',
    ],
    circuitBreakerThreshold: 3,
    circuitBreakerResetTime: 120000, // 2 minutes
  },
  default: {
    maxRetries: 2,
    strategy: 'exponential',
    baseDelay: 1000,
    maxDelay: 60000, // 1 minute
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'error',
      'failure',
      'timeout',
    ],
    nonRetryableErrors: [
      'invalid',
      'unauthorized',
      'forbidden',
    ],
    circuitBreakerThreshold: 3,
    circuitBreakerResetTime: 180000, // 3 minutes
  },
};

export class WorkflowRetryManager {
  /**
   * Determine if a step should be retried based on error and configuration
   */
  async shouldRetryStep(
    executionId: string,
    stepId: string,
    stepType: string,
    error: Error
  ): Promise<boolean> {
    try {
      const retryState = await this.getStepRetryState(executionId, stepId, stepType);
      
      // Check if max retries exceeded
      if (retryState.retryCount >= retryState.maxRetries) {
        logger.info('Max retries exceeded', { executionId, stepId, retryCount: retryState.retryCount });
        return false;
      }

      // Check if circuit is open
      if (retryState.isCircuitOpen) {
        const now = new Date();
        const resetTime = new Date(retryState.lastAttempt!.getTime() + retryState.config.circuitBreakerResetTime);
        
        if (now < resetTime) {
          logger.info('Circuit breaker is open', { executionId, stepId, resetTime });
          return false;
        } else {
          // Attempt to close circuit
          await this.resetCircuitBreaker(executionId, stepId);
          logger.info('Attempting to close circuit breaker', { executionId, stepId });
        }
      }

      // Check if error is retryable
      const isRetryable = this.isErrorRetryable(error, retryState.config);
      
      if (!isRetryable) {
        logger.info('Error is not retryable', { 
          executionId, 
          stepId, 
          error: error.message,
          nonRetryablePatterns: retryState.config.nonRetryableErrors
        });
        return false;
      }

      return true;
    } catch (retryError) {
      logger.error('Error determining retry eligibility:', retryError);
      return false;
    }
  }

  /**
   * Schedule a retry for a failed step
   */
  async scheduleRetry(
    executionId: string,
    stepId: string,
    stepType: string,
    error: Error
  ): Promise<{ scheduled: boolean; nextRetryAt?: Date; delayMs?: number }> {
    try {
      const retryState = await this.getStepRetryState(executionId, stepId, stepType);
      
      // Calculate retry delay
      const delayMs = this.calculateRetryDelay(retryState);
      const nextRetryAt = new Date(Date.now() + delayMs);

      // Record retry attempt
      const attempt: RetryAttempt = {
        attemptNumber: retryState.retryCount + 1,
        timestamp: new Date(),
        error: error.message,
        nextRetryAt,
        delayMs,
      };

      // Update retry state
      const updatedState: StepRetryState = {
        ...retryState,
        retryCount: retryState.retryCount + 1,
        lastAttempt: new Date(),
        nextRetryAt,
        consecutiveFailures: retryState.consecutiveFailures + 1,
        attempts: [...retryState.attempts, attempt],
      };

      // Check if circuit breaker should open
      if (updatedState.consecutiveFailures >= retryState.config.circuitBreakerThreshold) {
        updatedState.isCircuitOpen = true;
        logger.warn('Circuit breaker opened', { 
          executionId, 
          stepId, 
          consecutiveFailures: updatedState.consecutiveFailures 
        });
      }

      // Save retry state
      await this.saveStepRetryState(updatedState);

      // Schedule the retry using delay queue
      await QueueManager.addDelayedJob({
        type: 'workflow',
        originalJobData: {
          workflowId: '', // Will be filled by the execution engine
          contactId: '', // Will be filled by the execution engine
          executionId,
          stepId,
          retryCount: updatedState.retryCount,
        },
        delay: delayMs,
        executeAt: nextRetryAt,
      });

      logger.info('Retry scheduled', {
        executionId,
        stepId,
        attempt: attempt.attemptNumber,
        delayMs,
        nextRetryAt,
      });

      return {
        scheduled: true,
        nextRetryAt,
        delayMs,
      };
    } catch (scheduleError) {
      logger.error('Error scheduling retry:', scheduleError);
      return { scheduled: false };
    }
  }

  /**
   * Mark a step as successfully completed (resets circuit breaker)
   */
  async markStepSuccess(executionId: string, stepId: string): Promise<void> {
    try {
      // Reset retry state on success
      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId },
        data: {
          retryState: JSON.stringify({
            retryCount: 0,
            consecutiveFailures: 0,
            isCircuitOpen: false,
            lastSuccess: new Date(),
          }),
        },
      });

      logger.debug('Step success recorded, retry state reset', { executionId, stepId });
    } catch (error) {
      logger.error('Error marking step success:', error);
    }
  }

  /**
   * Get retry statistics for monitoring
   */
  async getRetryStatistics(timeRange: number = 24 * 60 * 60 * 1000): Promise<{
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    topFailingSteps: Array<{ stepType: string; failures: number }>;
    circuitBreakerActivations: number;
  }> {
    try {
      const since = new Date(Date.now() - timeRange);

      // Get all step executions with retry data
      const stepExecutions = await prisma.workflowExecutionStep.findMany({
        where: {
          createdAt: { gte: since },
          retryState: { not: null },
        },
        select: {
          stepType: true,
          status: true,
          retryState: true,
        },
      });

      let totalRetries = 0;
      let successfulRetries = 0;
      let failedRetries = 0;
      let circuitBreakerActivations = 0;
      const stepTypeFailures = new Map<string, number>();

      stepExecutions.forEach(step => {
        if (step.retryState) {
          try {
            const retryState = JSON.parse(step.retryState);
            totalRetries += retryState.retryCount || 0;

            if (step.status === 'COMPLETED' && retryState.retryCount > 0) {
              successfulRetries += retryState.retryCount;
            } else if (step.status === 'FAILED') {
              failedRetries += retryState.retryCount || 0;
              const currentFailures = stepTypeFailures.get(step.stepType) || 0;
              stepTypeFailures.set(step.stepType, currentFailures + 1);
            }

            if (retryState.isCircuitOpen) {
              circuitBreakerActivations++;
            }
          } catch (parseError) {
            logger.warn('Error parsing retry state:', parseError);
          }
        }
      });

      const topFailingSteps = Array.from(stepTypeFailures.entries())
        .map(([stepType, failures]) => ({ stepType, failures }))
        .sort((a, b) => b.failures - a.failures)
        .slice(0, 10);

      return {
        totalRetries,
        successfulRetries,
        failedRetries,
        topFailingSteps,
        circuitBreakerActivations,
      };
    } catch (error) {
      logger.error('Error getting retry statistics:', error);
      return {
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        topFailingSteps: [],
        circuitBreakerActivations: 0,
      };
    }
  }

  // Private helper methods

  private async getStepRetryState(
    executionId: string,
    stepId: string,
    stepType: string
  ): Promise<StepRetryState> {
    // Try to get existing retry state
    const existingStep = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { retryState: true },
    });

    if (existingStep?.retryState) {
      try {
        const saved = JSON.parse(existingStep.retryState);
        return {
          stepId,
          executionId,
          retryCount: saved.retryCount || 0,
          maxRetries: saved.maxRetries || DEFAULT_RETRY_CONFIGS[stepType]?.maxRetries || DEFAULT_RETRY_CONFIGS.default.maxRetries,
          lastAttempt: saved.lastAttempt ? new Date(saved.lastAttempt) : undefined,
          nextRetryAt: saved.nextRetryAt ? new Date(saved.nextRetryAt) : undefined,
          strategy: saved.strategy || DEFAULT_RETRY_CONFIGS[stepType]?.strategy || DEFAULT_RETRY_CONFIGS.default.strategy,
          isCircuitOpen: saved.isCircuitOpen || false,
          consecutiveFailures: saved.consecutiveFailures || 0,
          attempts: saved.attempts || [],
          config: saved.config || DEFAULT_RETRY_CONFIGS[stepType] || DEFAULT_RETRY_CONFIGS.default,
        };
      } catch (parseError) {
        logger.warn('Error parsing existing retry state, creating new:', parseError);
      }
    }

    // Create new retry state
    const config = DEFAULT_RETRY_CONFIGS[stepType] || DEFAULT_RETRY_CONFIGS.default;
    return {
      stepId,
      executionId,
      retryCount: 0,
      maxRetries: config.maxRetries,
      strategy: config.strategy,
      isCircuitOpen: false,
      consecutiveFailures: 0,
      attempts: [],
      config,
    };
  }

  private async saveStepRetryState(state: StepRetryState): Promise<void> {
    await prisma.workflowExecutionStep.updateMany({
      where: {
        executionId: state.executionId,
        stepId: state.stepId,
      },
      data: {
        retryState: JSON.stringify(state),
      },
    });
  }

  private isErrorRetryable(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();

    // Check non-retryable patterns first
    for (const pattern of config.nonRetryableErrors) {
      if (errorMessage.includes(pattern.toLowerCase())) {
        return false;
      }
    }

    // Check retryable patterns
    for (const pattern of config.retryableErrors) {
      if (errorMessage.includes(pattern.toLowerCase())) {
        return true;
      }
    }

    // Default to not retryable if no pattern matches
    return false;
  }

  private calculateRetryDelay(state: StepRetryState): number {
    const { config, retryCount } = state;
    let delay = config.baseDelay;

    switch (config.strategy) {
      case 'fixed':
        delay = config.baseDelay;
        break;
      
      case 'linear':
        delay = config.baseDelay * (retryCount + 1);
        break;
      
      case 'exponential':
        delay = config.baseDelay * Math.pow(config.backoffMultiplier, retryCount);
        break;
      
      default:
        delay = config.baseDelay;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }

    return Math.max(100, Math.round(delay)); // Minimum 100ms delay
  }

  private async resetCircuitBreaker(executionId: string, stepId: string): Promise<void> {
    const existingStep = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { retryState: true },
    });

    if (existingStep?.retryState) {
      try {
        const state = JSON.parse(existingStep.retryState);
        state.isCircuitOpen = false;
        state.consecutiveFailures = 0;

        await prisma.workflowExecutionStep.updateMany({
          where: { executionId, stepId },
          data: { retryState: JSON.stringify(state) },
        });

        logger.info('Circuit breaker reset', { executionId, stepId });
      } catch (error) {
        logger.error('Error resetting circuit breaker:', error);
      }
    }
  }
}

// Export singleton instance
export const workflowRetryManager = new WorkflowRetryManager();