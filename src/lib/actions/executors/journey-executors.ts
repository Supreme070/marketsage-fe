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
// NOTE: Prisma removed - using backend API (Workflow, WorkflowExecution, Segment, ContactSegment, List, ContactList tables exist in backend)
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

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
      const workflowResponse = await fetch(`${BACKEND_URL}/api/v2/workflows/${workflowId}`);

      if (!workflowResponse.ok) {
        return this.createFailureResult('Workflow not found');
      }

      const workflow = await workflowResponse.json();

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
      const executionResponse = await fetch(`${BACKEND_URL}/api/v2/workflow-executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });

      if (!executionResponse.ok) {
        throw new Error(`Failed to create workflow execution: ${executionResponse.status}`);
      }

      const workflowExecution = await executionResponse.json();

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
      const segmentResponse = await fetch(`${BACKEND_URL}/api/v2/segments/${segmentId}`);

      if (!segmentResponse.ok) {
        return this.createFailureResult('Segment not found');
      }

      const segment = await segmentResponse.json();

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
        const deleteResponse = await fetch(`${BACKEND_URL}/api/v2/contact-segments?contactId=${context.actionPlan.contactId}&excludeSegmentId=${segmentId}`, {
          method: 'DELETE'
        });

        if (!deleteResponse.ok) {
          throw new Error(`Failed to remove from other segments: ${deleteResponse.status}`);
        }
      }

      // Check if already in segment
      const checkResponse = await fetch(`${BACKEND_URL}/api/v2/contact-segments?contactId=${context.actionPlan.contactId}&segmentId=${segmentId}`);

      let existingRelation = null;
      if (checkResponse.ok) {
        const relations = await checkResponse.json();
        existingRelation = relations.length > 0 ? relations[0] : null;
      }

      // Add to new segment (if not already in it)
      if (!existingRelation) {
        const createResponse = await fetch(`${BACKEND_URL}/api/v2/contact-segments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: context.actionPlan.contactId,
            segmentId,
            addedBy: context.userId || 'supreme-ai-v3',
            metadata: {
              actionPlanId: context.actionPlan.id,
              aiAdded: true,
              addedAt: new Date().toISOString()
            }
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to add to segment: ${createResponse.status}`);
        }
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
      const listResponse = await fetch(`${BACKEND_URL}/api/v2/lists/${listId}`);

      if (!listResponse.ok) {
        return this.createFailureResult('List not found');
      }

      const list = await listResponse.json();

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
      const checkResponse = await fetch(`${BACKEND_URL}/api/v2/contact-lists?contactId=${context.actionPlan.contactId}&listId=${listId}`);

      let existingRelation = null;
      if (checkResponse.ok) {
        const relations = await checkResponse.json();
        existingRelation = relations.length > 0 ? relations[0] : null;
      }

      if (!existingRelation) {
        const createResponse = await fetch(`${BACKEND_URL}/api/v2/contact-lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: context.actionPlan.contactId,
            listId,
            addedBy: context.userId || 'supreme-ai-v3',
            metadata: {
              actionPlanId: context.actionPlan.id,
              aiAdded: true,
              addedAt: new Date().toISOString()
            }
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to add contact to list: ${createResponse.status}`);
        }
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
      const listResponse = await fetch(`${BACKEND_URL}/api/v2/lists/${listId}`);

      if (!listResponse.ok) {
        return this.createFailureResult('List not found');
      }

      const list = await listResponse.json();

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
      const checkResponse = await fetch(`${BACKEND_URL}/api/v2/contact-lists?contactId=${context.actionPlan.contactId}&listId=${listId}`);

      let existingRelation = null;
      if (checkResponse.ok) {
        const relations = await checkResponse.json();
        existingRelation = relations.length > 0 ? relations[0] : null;
      }

      if (existingRelation) {
        const deleteResponse = await fetch(`${BACKEND_URL}/api/v2/contact-lists/${existingRelation.id}`, {
          method: 'DELETE'
        });

        if (!deleteResponse.ok) {
          throw new Error(`Failed to remove contact from list: ${deleteResponse.status}`);
        }
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