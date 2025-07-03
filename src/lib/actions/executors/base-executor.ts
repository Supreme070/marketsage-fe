/**
 * Base Executor Class and Strategy Implementations
 * ================================================
 * 
 * Base class and specific implementations for executing different action types
 * with comprehensive error handling, validation, and rollback capabilities.
 */

import { 
  type ActionExecutionResult,
  type ActionType,
  RiskLevel 
} from '../action-plan-interface';
import type { ExecutionContext, ExecutorStrategy } from '../action-dispatcher';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * Base executor class with common functionality
 */
export abstract class BaseExecutor implements ExecutorStrategy {
  abstract actionType: ActionType;
  protected maxRetries = 3;
  protected retryDelayMs = 1000;

  /**
   * Execute the action - must be implemented by subclasses
   */
  abstract execute(context: ExecutionContext): Promise<ActionExecutionResult>;

  /**
   * Validate execution context - can be overridden by subclasses
   */
  async validate(context: ExecutionContext): Promise<boolean> {
    // Basic validation
    if (!context.actionPlan) {
      logger.warn('Missing action plan in execution context');
      return false;
    }

    if (!context.actionPlan.contactId) {
      logger.warn('Missing contact ID in action plan');
      return false;
    }

    if (!context.organizationId) {
      logger.warn('Missing organization ID in execution context');
      return false;
    }

    // Check if contact exists
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: context.actionPlan.contactId }
      });

      if (!contact) {
        logger.warn('Contact not found', { contactId: context.actionPlan.contactId });
        return false;
      }

      // Check if contact belongs to the organization
      if (contact.organizationId !== context.organizationId) {
        logger.warn('Contact does not belong to organization', {
          contactId: context.actionPlan.contactId,
          organizationId: context.organizationId
        });
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Error validating execution context', {
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }

  /**
   * Default rollback implementation - can be overridden
   */
  async rollback(context: ExecutionContext, executionResult: ActionExecutionResult): Promise<void> {
    logger.info('No rollback implementation for action type', {
      actionType: this.actionType,
      actionPlanId: context.actionPlan.id
    });
  }

  /**
   * Estimate execution time - can be overridden
   */
  estimateExecutionTime(): number {
    return 5000; // 5 seconds default
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry(
    context: ExecutionContext,
    executeFunction: () => Promise<ActionExecutionResult>
  ): Promise<ActionExecutionResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug('Executing action attempt', {
          actionType: this.actionType,
          attempt,
          maxRetries: this.maxRetries
        });

        const result = await executeFunction();
        
        if (result.success) {
          return result;
        } else if (attempt === this.maxRetries) {
          // Last attempt failed
          return result;
        }
        
        // Wait before retry
        await this.sleep(this.retryDelayMs * attempt);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.maxRetries) {
          break;
        }
        
        logger.warn('Action execution attempt failed, retrying', {
          actionType: this.actionType,
          attempt,
          error: lastError.message
        });
        
        // Wait before retry
        await this.sleep(this.retryDelayMs * attempt);
      }
    }

    // All attempts failed
    return {
      success: false,
      executedAt: new Date(),
      executionDuration: 0,
      error: lastError?.message || 'All retry attempts failed',
      metadata: {
        attempts: this.maxRetries,
        finalError: lastError?.message
      }
    };
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get contact information
   */
  protected async getContact(contactId: string): Promise<any> {
    return prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        organization: true,
        lists: true,
        segments: true
      }
    });
  }

  /**
   * Get organization information
   */
  protected async getOrganization(organizationId: string): Promise<any> {
    return prisma.organization.findUnique({
      where: { id: organizationId }
    });
  }

  /**
   * Check if this is a dry run
   */
  protected isDryRun(context: ExecutionContext): boolean {
    return context.dryRun === true;
  }

  /**
   * Create a successful execution result
   */
  protected createSuccessResult(
    result: any = null,
    metadata: Record<string, any> = {}
  ): ActionExecutionResult {
    return {
      success: true,
      executedAt: new Date(),
      executionDuration: 0, // Will be calculated by dispatcher
      result,
      metadata: {
        executor: this.actionType,
        ...metadata
      }
    };
  }

  /**
   * Create a failed execution result
   */
  protected createFailureResult(
    error: string,
    metadata: Record<string, any> = {}
  ): ActionExecutionResult {
    return {
      success: false,
      executedAt: new Date(),
      executionDuration: 0, // Will be calculated by dispatcher
      error,
      metadata: {
        executor: this.actionType,
        ...metadata
      }
    };
  }

  /**
   * Log execution start
   */
  protected logExecutionStart(context: ExecutionContext): void {
    logger.info('Starting action execution', {
      actionType: this.actionType,
      actionPlanId: context.actionPlan.id,
      contactId: context.actionPlan.contactId,
      organizationId: context.organizationId,
      dryRun: this.isDryRun(context)
    });
  }

  /**
   * Log execution completion
   */
  protected logExecutionComplete(
    context: ExecutionContext,
    result: ActionExecutionResult
  ): void {
    logger.info('Action execution completed', {
      actionType: this.actionType,
      actionPlanId: context.actionPlan.id,
      success: result.success,
      error: result.error,
      dryRun: this.isDryRun(context)
    });
  }

  /**
   * Validate action parameters
   */
  protected validateParameters(
    context: ExecutionContext,
    requiredParams: string[]
  ): boolean {
    const parameters = context.actionPlan.parameters || {};
    
    for (const param of requiredParams) {
      if (!parameters[param]) {
        logger.warn('Missing required parameter', {
          actionType: this.actionType,
          parameter: param,
          actionPlanId: context.actionPlan.id
        });
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get parameter value with default
   */
  protected getParameter<T>(
    context: ExecutionContext,
    paramName: string,
    defaultValue?: T
  ): T {
    const parameters = context.actionPlan.parameters || {};
    return parameters[paramName] ?? defaultValue;
  }
}