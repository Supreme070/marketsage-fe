/**
 * Database Transaction Manager
 * ===========================
 * Ensures data consistency and handles rollbacks for multi-step operations
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';

export interface TransactionContext {
  id: string;
  userId: string;
  operationId: string;
  startTime: number;
  timeout: number;
  description?: string;
}

export interface TransactionStep {
  id: string;
  operation: string;
  entity: string;
  data: any;
  rollbackData?: any;
  executed: boolean;
  executedAt?: number;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId: string;
  stepsCompleted: number;
  totalSteps: number;
  error?: string;
  rollbackPerformed?: boolean;
  results?: any[];
}

export class TransactionManager {
  private static activeTransactions = new Map<string, TransactionContext>();
  private static transactionSteps = new Map<string, TransactionStep[]>();
  private static rollbackHandlers = new Map<string, (() => Promise<void>)[]>();

  /**
   * Start a new transaction
   */
  static async startTransaction(
    userId: string,
    operationId: string,
    description?: string,
    timeoutMs = 30000
  ): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: TransactionContext = {
      id: transactionId,
      userId,
      operationId,
      startTime: Date.now(),
      timeout: timeoutMs,
      description
    };

    this.activeTransactions.set(transactionId, context);
    this.transactionSteps.set(transactionId, []);
    this.rollbackHandlers.set(transactionId, []);

    logger.info('Transaction started', {
      transactionId,
      userId,
      operationId,
      description,
      timeout: timeoutMs
    });

    // Set timeout for automatic rollback
    setTimeout(() => {
      this.handleTimeout(transactionId);
    }, timeoutMs);

    return transactionId;
  }

  /**
   * Execute a step within a transaction
   */
  static async executeStep<T>(
    transactionId: string,
    stepId: string,
    operation: string,
    entity: string,
    executeFn: (tx: any) => Promise<T>,
    rollbackFn?: () => Promise<void>
  ): Promise<T> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const step: TransactionStep = {
      id: stepId,
      operation,
      entity,
      data: {},
      executed: false
    };

    try {
      logger.info('Transaction step starting', {
        transactionId,
        stepId,
        operation,
        entity
      });

      // Execute the operation (transactions handled by backend)
      const stepResult = await executeFn(null);

      // Store rollback data if needed
      step.rollbackData = stepResult;
      step.executed = true;
      step.executedAt = Date.now();

      const result = stepResult;

      // Add step to transaction
      const steps = this.transactionSteps.get(transactionId) || [];
      steps.push(step);
      this.transactionSteps.set(transactionId, steps);

      // Add rollback handler if provided
      if (rollbackFn) {
        const handlers = this.rollbackHandlers.get(transactionId) || [];
        handlers.push(rollbackFn);
        this.rollbackHandlers.set(transactionId, handlers);
      }

      logger.info('Transaction step completed', {
        transactionId,
        stepId,
        operation,
        entity,
        executionTime: Date.now() - (step.executedAt || 0)
      });

      return result;

    } catch (error) {
      step.error = error instanceof Error ? error.message : String(error);
      step.executed = false;

      // Add failed step to transaction
      const steps = this.transactionSteps.get(transactionId) || [];
      steps.push(step);
      this.transactionSteps.set(transactionId, steps);

      logger.error('Transaction step failed', {
        transactionId,
        stepId,
        operation,
        entity,
        error: step.error
      });

      throw error;
    }
  }

  /**
   * Commit a transaction
   */
  static async commitTransaction(transactionId: string): Promise<TransactionResult> {
    const context = this.activeTransactions.get(transactionId);
    const steps = this.transactionSteps.get(transactionId) || [];

    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      logger.info('Transaction committing', {
        transactionId,
        stepsCompleted: steps.filter(s => s.executed).length,
        totalSteps: steps.length
      });

      // Clean up transaction data
      this.activeTransactions.delete(transactionId);
      this.transactionSteps.delete(transactionId);
      this.rollbackHandlers.delete(transactionId);

      const result: TransactionResult = {
        success: true,
        transactionId,
        stepsCompleted: steps.filter(s => s.executed).length,
        totalSteps: steps.length,
        results: steps.map(s => s.rollbackData)
      };

      logger.info('Transaction committed successfully', {
        transactionId,
        stepsCompleted: result.stepsCompleted,
        totalSteps: result.totalSteps,
        executionTime: Date.now() - context.startTime
      });

      return result;

    } catch (error) {
      logger.error('Transaction commit failed', {
        transactionId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Attempt rollback on commit failure
      await this.rollbackTransaction(transactionId);

      throw error;
    }
  }

  /**
   * Rollback a transaction
   */
  static async rollbackTransaction(transactionId: string): Promise<TransactionResult> {
    const context = this.activeTransactions.get(transactionId);
    const steps = this.transactionSteps.get(transactionId) || [];
    const rollbackHandlers = this.rollbackHandlers.get(transactionId) || [];

    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    logger.warn('Transaction rollback started', {
      transactionId,
      stepsToRollback: steps.filter(s => s.executed).length,
      totalSteps: steps.length
    });

    const rollbackErrors: string[] = [];

    try {
      // Execute rollback handlers in reverse order
      for (let i = rollbackHandlers.length - 1; i >= 0; i--) {
        try {
          await rollbackHandlers[i]();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          rollbackErrors.push(errorMessage);
          logger.error('Rollback handler failed', {
            transactionId,
            handlerIndex: i,
            error: errorMessage
          });
        }
      }

      // Rollback executed steps in reverse order
      const executedSteps = steps.filter(s => s.executed).reverse();
      for (const step of executedSteps) {
        try {
          await this.rollbackStep(transactionId, step);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          rollbackErrors.push(errorMessage);
          logger.error('Step rollback failed', {
            transactionId,
            stepId: step.id,
            error: errorMessage
          });
        }
      }

      // Clean up transaction data
      this.activeTransactions.delete(transactionId);
      this.transactionSteps.delete(transactionId);
      this.rollbackHandlers.delete(transactionId);

      const result: TransactionResult = {
        success: rollbackErrors.length === 0,
        transactionId,
        stepsCompleted: steps.filter(s => s.executed).length,
        totalSteps: steps.length,
        rollbackPerformed: true,
        error: rollbackErrors.length > 0 ? rollbackErrors.join('; ') : undefined
      };

      logger.info('Transaction rollback completed', {
        transactionId,
        success: result.success,
        rollbackErrors: rollbackErrors.length,
        executionTime: Date.now() - context.startTime
      });

      return result;

    } catch (error) {
      logger.error('Transaction rollback failed', {
        transactionId,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Rollback a specific step
   */
  private static async rollbackStep(transactionId: string, step: TransactionStep): Promise<void> {
    logger.info('Rolling back step', {
      transactionId,
      stepId: step.id,
      operation: step.operation,
      entity: step.entity
    });

    try {
      // Implement rollback logic based on operation type
      switch (step.operation) {
        case 'CREATE':
          await this.rollbackCreate(step);
          break;
        case 'UPDATE':
          await this.rollbackUpdate(step);
          break;
        case 'DELETE':
          await this.rollbackDelete(step);
          break;
        default:
          logger.warn('No rollback handler for operation', {
            transactionId,
            stepId: step.id,
            operation: step.operation
          });
      }
    } catch (error) {
      logger.error('Step rollback failed', {
        transactionId,
        stepId: step.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Rollback create operation
   */
  private static async rollbackCreate(step: TransactionStep): Promise<void> {
    const { entity, rollbackData } = step;
    
    if (!rollbackData || !rollbackData.id) {
      logger.warn('No rollback data available for create operation', {
        stepId: step.id,
        entity
      });
      return;
    }

    try {
      switch (entity) {
        case 'USER':
          await fetch(`${BACKEND_URL}/api/v2/users/${rollbackData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'CONTACT':
          await fetch(`${BACKEND_URL}/api/v2/contacts/${rollbackData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'ORGANIZATION':
          await fetch(`${BACKEND_URL}/api/v2/organizations/${rollbackData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'CAMPAIGN':
          await fetch(`${BACKEND_URL}/api/v2/email-campaigns/${rollbackData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        case 'TASK':
          await fetch(`${BACKEND_URL}/api/v2/tasks/${rollbackData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          break;
        default:
          logger.warn('No rollback handler for entity', { entity });
      }
    } catch (error) {
      logger.error('Rollback create failed', {
        stepId: step.id,
        entity,
        id: rollbackData.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Rollback update operation
   */
  private static async rollbackUpdate(step: TransactionStep): Promise<void> {
    const { entity, rollbackData } = step;
    
    if (!rollbackData || !rollbackData.id || !rollbackData.previousData) {
      logger.warn('No rollback data available for update operation', {
        stepId: step.id,
        entity
      });
      return;
    }

    try {
      const { id, previousData } = rollbackData;

      switch (entity) {
        case 'USER':
          await fetch(`${BACKEND_URL}/api/v2/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previousData)
          });
          break;
        case 'CONTACT':
          await fetch(`${BACKEND_URL}/api/v2/contacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previousData)
          });
          break;
        case 'ORGANIZATION':
          await fetch(`${BACKEND_URL}/api/v2/organizations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previousData)
          });
          break;
        case 'CAMPAIGN':
          await fetch(`${BACKEND_URL}/api/v2/email-campaigns/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previousData)
          });
          break;
        case 'TASK':
          await fetch(`${BACKEND_URL}/api/v2/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(previousData)
          });
          break;
        default:
          logger.warn('No rollback handler for entity', { entity });
      }
    } catch (error) {
      logger.error('Rollback update failed', {
        stepId: step.id,
        entity,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Rollback delete operation
   */
  private static async rollbackDelete(step: TransactionStep): Promise<void> {
    const { entity, rollbackData } = step;
    
    if (!rollbackData || !rollbackData.deletedData) {
      logger.warn('No rollback data available for delete operation', {
        stepId: step.id,
        entity
      });
      return;
    }

    try {
      const { deletedData } = rollbackData;

      switch (entity) {
        case 'USER':
          await fetch(`${BACKEND_URL}/api/v2/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedData)
          });
          break;
        case 'CONTACT':
          await fetch(`${BACKEND_URL}/api/v2/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedData)
          });
          break;
        case 'ORGANIZATION':
          await fetch(`${BACKEND_URL}/api/v2/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedData)
          });
          break;
        case 'CAMPAIGN':
          await fetch(`${BACKEND_URL}/api/v2/email-campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedData)
          });
          break;
        case 'TASK':
          await fetch(`${BACKEND_URL}/api/v2/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedData)
          });
          break;
        default:
          logger.warn('No rollback handler for entity', { entity });
      }
    } catch (error) {
      logger.error('Rollback delete failed', {
        stepId: step.id,
        entity,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle transaction timeout
   */
  private static async handleTimeout(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    
    if (!context) {
      return; // Transaction already completed
    }

    logger.warn('Transaction timeout', {
      transactionId,
      timeout: context.timeout,
      executionTime: Date.now() - context.startTime
    });

    try {
      await this.rollbackTransaction(transactionId);
    } catch (error) {
      logger.error('Transaction timeout rollback failed', {
        transactionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get transaction status
   */
  static getTransactionStatus(transactionId: string): {
    exists: boolean;
    context?: TransactionContext;
    steps?: TransactionStep[];
    stepsCompleted: number;
    totalSteps: number;
  } {
    const context = this.activeTransactions.get(transactionId);
    const steps = this.transactionSteps.get(transactionId) || [];
    
    return {
      exists: !!context,
      context,
      steps,
      stepsCompleted: steps.filter(s => s.executed).length,
      totalSteps: steps.length
    };
  }

  /**
   * Clean up expired transactions
   */
  static cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [transactionId, context] of this.activeTransactions) {
      if (now - context.startTime > context.timeout) {
        expired.push(transactionId);
      }
    }

    for (const transactionId of expired) {
      this.handleTimeout(transactionId);
    }

    logger.info('Transaction cleanup completed', {
      expiredTransactions: expired.length
    });
  }
}

// Export helper functions
export async function withTransaction<T>(
  userId: string,
  operationId: string,
  description: string,
  operationFn: (transactionId: string) => Promise<T>
): Promise<T> {
  const transactionId = await TransactionManager.startTransaction(
    userId,
    operationId,
    description
  );

  try {
    const result = await operationFn(transactionId);
    await TransactionManager.commitTransaction(transactionId);
    return result;
  } catch (error) {
    await TransactionManager.rollbackTransaction(transactionId);
    throw error;
  }
}

// Schedule cleanup every 5 minutes
setInterval(() => {
  TransactionManager.cleanup();
}, 5 * 60 * 1000);