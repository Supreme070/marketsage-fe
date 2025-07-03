/**
 * Customer Journey Executor Implementations
 * =========================================
 * 
 * Safe implementations for workflow triggers, segment management,
 * and list operations that integrate with existing systems.
 */

import { ActionType, type ActionExecutionResult } from '../action-plan-interface';
import type { ExecutionContext } from '../action-dispatcher';
import { BaseExecutor } from './base-executor';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * Workflow Trigger Executor
 */
export class WorkflowTriggerExecutor extends BaseExecutor {
  actionType = ActionType.TRIGGER_WORKFLOW;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['workflowId'])) {
        return this.createFailureResult('Missing required workflow ID parameter');
      }

      const workflowId = this.getParameter(context, 'workflowId');
      const startNodeId = this.getParameter(context, 'startNodeId', null);
      const workflowData = this.getParameter(context, 'workflowData', {});

      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Check if workflow exists
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        return this.createFailureResult('Workflow not found');
      }

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'trigger_workflow',
          workflowId,
          workflowName: workflow.name,
          contactId: context.actionPlan.contactId,
          message: 'Dry run - Workflow would be triggered'
        });
      }

      // Create workflow execution record
      const workflowExecution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          contactId: context.actionPlan.contactId,
          organizationId: context.organizationId,
          status: 'running',
          startedBy: context.userId || 'supreme-ai-v3',
          data: {
            ...workflowData,
            actionPlanId: context.actionPlan.id,
            aiTriggered: true,
            startNodeId
          }
        }
      });

      logger.info('Workflow triggered successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        workflowId,
        workflowExecutionId: workflowExecution.id,
        contactId: context.actionPlan.contactId
      });

      return this.createSuccessResult({
        workflowId,
        workflowName: workflow.name,
        workflowExecutionId: workflowExecution.id,
        contactId: context.actionPlan.contactId,
        startNodeId,
        triggeredAt: new Date(),
        data: workflowData
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Workflow trigger failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  estimateExecutionTime(): number {
    return 2000; // 2 seconds
  }
}

/**
 * Segment Move Executor
 */
export class SegmentMoveExecutor extends BaseExecutor {
  actionType = ActionType.MOVE_TO_SEGMENT;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['segmentId'])) {
        return this.createFailureResult('Missing required segment ID parameter');
      }

      const segmentId = this.getParameter(context, 'segmentId');
      const removeFromOtherSegments = this.getParameter(context, 'removeFromOthers', false);

      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Check if segment exists
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        return this.createFailureResult('Segment not found');
      }

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'move_to_segment',
          segmentId,
          segmentName: segment.name,
          contactId: context.actionPlan.contactId,
          removeFromOthers: removeFromOtherSegments,
          message: 'Dry run - Contact would be moved to segment'
        });
      }

      // Remove from other segments if requested
      if (removeFromOtherSegments) {
        await prisma.contactSegment.deleteMany({
          where: {
            contactId: context.actionPlan.contactId,
            segmentId: { not: segmentId }
          }
        });
      }

      // Add to new segment (if not already in it)
      const existingRelation = await prisma.contactSegment.findUnique({
        where: {
          contactId_segmentId: {
            contactId: context.actionPlan.contactId,
            segmentId
          }
        }
      });

      if (!existingRelation) {
        await prisma.contactSegment.create({
          data: {
            contactId: context.actionPlan.contactId,
            segmentId,
            addedBy: context.userId || 'supreme-ai-v3',
            metadata: {
              actionPlanId: context.actionPlan.id,
              aiAdded: true,
              addedAt: new Date()
            }
          }
        });
      }

      logger.info('Contact moved to segment successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        contactId: context.actionPlan.contactId,
        segmentId,
        segmentName: segment.name
      });

      return this.createSuccessResult({
        segmentId,
        segmentName: segment.name,
        contactId: context.actionPlan.contactId,
        removeFromOthers: removeFromOtherSegments,
        wasAlreadyInSegment: !!existingRelation,
        movedAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Segment move failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  estimateExecutionTime(): number {
    return 1500; // 1.5 seconds
  }
}

/**
 * List Add Executor
 */
export class ListAddExecutor extends BaseExecutor {
  actionType = ActionType.ADD_TO_LIST;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['listId'])) {
        return this.createFailureResult('Missing required list ID parameter');
      }

      const listId = this.getParameter(context, 'listId');

      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Check if list exists
      const list = await prisma.list.findUnique({
        where: { id: listId }
      });

      if (!list) {
        return this.createFailureResult('List not found');
      }

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'add_to_list',
          listId,
          listName: list.name,
          contactId: context.actionPlan.contactId,
          message: 'Dry run - Contact would be added to list'
        });
      }

      // Check if contact is already in the list
      const existingRelation = await prisma.contactList.findUnique({
        where: {
          contactId_listId: {
            contactId: context.actionPlan.contactId,
            listId
          }
        }
      });

      if (!existingRelation) {
        await prisma.contactList.create({
          data: {
            contactId: context.actionPlan.contactId,
            listId,
            addedBy: context.userId || 'supreme-ai-v3',
            metadata: {
              actionPlanId: context.actionPlan.id,
              aiAdded: true,
              addedAt: new Date()
            }
          }
        });
      }

      logger.info('Contact added to list successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        contactId: context.actionPlan.contactId,
        listId,
        listName: list.name
      });

      return this.createSuccessResult({
        listId,
        listName: list.name,
        contactId: context.actionPlan.contactId,
        wasAlreadyInList: !!existingRelation,
        addedAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('List add failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  estimateExecutionTime(): number {
    return 1000; // 1 second
  }
}

/**
 * List Remove Executor
 */
export class ListRemoveExecutor extends BaseExecutor {
  actionType = ActionType.REMOVE_FROM_LIST;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['listId'])) {
        return this.createFailureResult('Missing required list ID parameter');
      }

      const listId = this.getParameter(context, 'listId');

      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Check if list exists
      const list = await prisma.list.findUnique({
        where: { id: listId }
      });

      if (!list) {
        return this.createFailureResult('List not found');
      }

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'remove_from_list',
          listId,
          listName: list.name,
          contactId: context.actionPlan.contactId,
          message: 'Dry run - Contact would be removed from list'
        });
      }

      // Check if contact is in the list
      const existingRelation = await prisma.contactList.findUnique({
        where: {
          contactId_listId: {
            contactId: context.actionPlan.contactId,
            listId
          }
        }
      });

      if (existingRelation) {
        await prisma.contactList.delete({
          where: {
            contactId_listId: {
              contactId: context.actionPlan.contactId,
              listId
            }
          }
        });
      }

      logger.info('Contact removed from list successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        contactId: context.actionPlan.contactId,
        listId,
        listName: list.name
      });

      return this.createSuccessResult({
        listId,
        listName: list.name,
        contactId: context.actionPlan.contactId,
        wasInList: !!existingRelation,
        removedAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('List remove failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  estimateExecutionTime(): number {
    return 1000; // 1 second
  }
}