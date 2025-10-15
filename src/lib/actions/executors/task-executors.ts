/**
 * Task Management Executor Implementations
 * ========================================
 * 
 * Safe implementations for task creation, assignment, and updates
 * that integrate with existing task management system.
 */

import { ActionType, type ActionExecutionResult } from '../action-plan-interface';
import type { ExecutionContext } from '../action-dispatcher';
import { BaseExecutor } from './base-executor';
// NOTE: Prisma removed - using backend API (Task, User tables exist in backend)
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

/**
 * Task Creation Executor
 */
export class TaskCreationExecutor extends BaseExecutor {
  actionType = ActionType.CREATE_TASK;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Get task parameters
      const taskTitle = this.getParameter(context, 'taskTitle', `Follow up with ${contact.firstName || 'customer'}`);
      const taskDescription = this.getParameter(context, 'taskDescription', context.actionPlan.actionDescription);
      const taskPriority = this.getParameter(context, 'taskPriority', 'medium');
      const dueDate = this.getParameter(context, 'dueDate', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
      const assigneeId = this.getParameter(context, 'assigneeId', null);

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'create_task',
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate,
          message: 'Dry run - Task would be created'
        });
      }

      // Create the task
      const response = await fetch(`${BACKEND_URL}/api/v2/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: this.mapPriority(taskPriority),
          status: 'todo',
          dueDate: new Date(dueDate).toISOString(),
          organizationId: context.organizationId,
          createdBy: context.userId || 'supreme-ai-v3',
          assigneeId: assigneeId,
          metadata: {
            actionPlanId: context.actionPlan.id,
            contactId: context.actionPlan.contactId,
            aiGenerated: true,
            source: 'action-dispatcher',
            customerName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
            customerEmail: contact.email,
            customerPhone: contact.phone
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      const task = await response.json();

      logger.info('Task created successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        taskId: task.id,
        contactId: context.actionPlan.contactId,
        title: taskTitle
      });

      return this.createSuccessResult({
        taskId: task.id,
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate,
        assigneeId,
        createdAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Task creation failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private mapPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'URGENT'
    };
    
    return priorityMap[priority.toLowerCase()] || 'MEDIUM';
  }

  estimateExecutionTime(): number {
    return 1500; // 1.5 seconds
  }
}

/**
 * Task Assignment Executor
 */
export class TaskAssignmentExecutor extends BaseExecutor {
  actionType = ActionType.ASSIGN_TASK;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['taskId', 'assigneeId'])) {
        return this.createFailureResult('Missing required task assignment parameters');
      }

      const taskId = this.getParameter(context, 'taskId');
      const assigneeId = this.getParameter(context, 'assigneeId');
      const assignmentNotes = this.getParameter(context, 'notes', '');

      // Check if task exists
      const taskResponse = await fetch(`${BACKEND_URL}/api/v2/tasks/${taskId}`);

      if (!taskResponse.ok) {
        return this.createFailureResult('Task not found');
      }

      const task = await taskResponse.json();

      // Check if assignee exists
      const assigneeResponse = await fetch(`${BACKEND_URL}/api/v2/users/${assigneeId}`);

      if (!assigneeResponse.ok) {
        return this.createFailureResult('Assignee not found');
      }

      const assignee = await assigneeResponse.json();

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'assign_task',
          taskId,
          assigneeId,
          assigneeName: assignee.name,
          message: 'Dry run - Task would be assigned'
        });
      }

      // Update task assignment
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId,
          metadata: {
            ...task.metadata,
            lastAssignedBy: context.userId || 'supreme-ai-v3',
            assignedAt: new Date().toISOString(),
            assignmentNotes,
            aiAssigned: true
          }
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update task assignment: ${updateResponse.status}`);
      }

      const updatedTask = await updateResponse.json();

      logger.info('Task assigned successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        taskId,
        assigneeId,
        assigneeName: assignee.name
      });

      return this.createSuccessResult({
        taskId,
        assigneeId,
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        assignedAt: new Date(),
        notes: assignmentNotes
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Task assignment failed', {
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
 * Task Update Executor
 */
export class TaskUpdateExecutor extends BaseExecutor {
  actionType = ActionType.UPDATE_TASK;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['taskId'])) {
        return this.createFailureResult('Missing required task ID parameter');
      }

      const taskId = this.getParameter(context, 'taskId');
      const status = this.getParameter(context, 'status', null);
      const priority = this.getParameter(context, 'priority', null);
      const title = this.getParameter(context, 'title', null);
      const description = this.getParameter(context, 'description', null);
      const dueDate = this.getParameter(context, 'dueDate', null);
      const updateNotes = this.getParameter(context, 'notes', '');

      // Check if task exists
      const taskResponse = await fetch(`${BACKEND_URL}/api/v2/tasks/${taskId}`);

      if (!taskResponse.ok) {
        return this.createFailureResult('Task not found');
      }

      const task = await taskResponse.json();

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'update_task',
          taskId,
          updates: { status, priority, title, description, dueDate },
          message: 'Dry run - Task would be updated'
        });
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
        metadata: {
          ...task.metadata,
          lastUpdatedBy: context.userId || 'supreme-ai-v3',
          updatedAt: new Date(),
          updateNotes,
          aiUpdated: true
        }
      };

      if (status) updateData.status = this.mapStatus(status);
      if (priority) updateData.priority = this.mapPriority(priority);
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);

      // Update the task
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update task: ${updateResponse.status}`);
      }

      const updatedTask = await updateResponse.json();

      logger.info('Task updated successfully via AI action', {
        actionPlanId: context.actionPlan.id,
        taskId,
        updates: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'metadata')
      });

      return this.createSuccessResult({
        taskId,
        previousValues: {
          status: task.status,
          priority: task.priority,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate
        },
        newValues: {
          status: updatedTask.status,
          priority: updatedTask.priority,
          title: updatedTask.title,
          description: updatedTask.description,
          dueDate: updatedTask.dueDate
        },
        updatedAt: new Date(),
        notes: updateNotes
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Task update failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'todo': 'todo',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'on_hold': 'on_hold'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }

  private mapPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'URGENT'
    };
    
    return priorityMap[priority.toLowerCase()] || 'MEDIUM';
  }

  estimateExecutionTime(): number {
    return 1000; // 1 second
  }
}