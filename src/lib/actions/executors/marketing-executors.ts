/**
 * Marketing and Engagement Executor Implementations
 * ==================================================
 * 
 * Safe implementations for discounts, surveys, reviews, and special occasion actions
 * that integrate with existing systems without breaking functionality.
 */

import { ActionType, type ActionExecutionResult } from '../action-plan-interface';
import type { ExecutionContext } from '../action-dispatcher';
import { BaseExecutor } from './base-executor';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * Discount Apply Executor
 */
export class DiscountApplyExecutor extends BaseExecutor {
  actionType = ActionType.APPLY_DISCOUNT;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Get discount parameters
      const discountType = this.getParameter(context, 'discountType', 'percentage');
      const discountValue = this.getParameter(context, 'discountValue', 10);
      const validUntil = this.getParameter(context, 'validUntil', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      const minimumPurchase = this.getParameter(context, 'minimumPurchase', 0);
      const discountCode = this.getParameter(context, 'discountCode', this.generateDiscountCode());

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'apply_discount',
          discountType,
          discountValue,
          discountCode,
          validUntil,
          contactId: context.actionPlan.contactId,
          message: 'Dry run - Discount would be created'
        });
      }

      // Create discount record (using a generic approach since we don't have a specific discount table)
      const discountRecord = await this.createDiscountRecord(context, {
        discountType,
        discountValue,
        discountCode,
        validUntil,
        minimumPurchase,
        contact
      });

      logger.info('Discount applied successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        contactId: context.actionPlan.contactId,
        discountCode,
        discountValue,
        discountType
      });

      return this.createSuccessResult({
        discountCode,
        discountType,
        discountValue,
        validUntil,
        minimumPurchase,
        contactId: context.actionPlan.contactId,
        createdAt: new Date(),
        discountRecordId: discountRecord?.id
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Discount application failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private generateDiscountCode(): string {
    const prefix = 'AI';
    const suffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  }

  private async createDiscountRecord(context: ExecutionContext, discountData: any): Promise<any> {
    // Since we don't have a specific discount table, we'll create a task to track this
    return await prisma.task.create({
      data: {
        title: `Discount Created: ${discountData.discountCode}`,
        description: `AI-generated discount for ${discountData.contact.firstName || 'customer'}: ${discountData.discountValue}${discountData.discountType === 'percentage' ? '%' : ' currency'} off`,
        priority: 'MEDIUM',
        status: 'todo',
        dueDate: new Date(discountData.validUntil),
        creator: {
          connect: { id: context.userId || 'supreme-ai-v3' }
        }
        // metadata field not available - storing discount info in description instead
      }
    });
  }

  estimateExecutionTime(): number {
    return 2000; // 2 seconds
  }
}