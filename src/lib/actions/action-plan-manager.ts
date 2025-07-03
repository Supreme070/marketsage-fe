/**
 * Action Plan Manager
 * ===================
 * 
 * Manages the lifecycle of AI-generated action plans
 * Handles creation, validation, approval, scheduling, and execution
 */

import { 
  type ActionPlan, 
  ActionPlanBuilder, 
  ActionPlanValidator, 
  ActionPlanUtils,
  ActionStatus, 
  ActionType,
  ExecutionMode,
  RiskLevel,
  type ActionExecutionResult
} from './action-plan-interface';
import { prisma } from '@/lib/db/prisma';
import { getCustomerEventBus, CustomerEventType, type EventPriority } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';

export interface ActionPlanQuery {
  contactId?: string;
  organizationId?: string;
  status?: ActionStatus | ActionStatus[];
  actionType?: ActionType | ActionType[];
  riskLevel?: RiskLevel | RiskLevel[];
  requiresApproval?: boolean;
  createdBy?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
  offset?: number;
}

export interface ActionPlanStats {
  total: number;
  byStatus: Record<ActionStatus, number>;
  byType: Record<ActionType, number>;
  byRiskLevel: Record<RiskLevel, number>;
  averageConfidence: number;
  pendingApprovals: number;
  scheduledActions: number;
  expiredActions: number;
}

/**
 * Action Plan Manager
 * 
 * Central service for managing all action plan operations
 */
export class ActionPlanManager {
  
  /**
   * Create a new action plan
   */
  static async createActionPlan(plan: ActionPlan): Promise<string> {
    try {
      // Validate the action plan
      const validation = ActionPlanValidator.validate(plan);
      if (!validation.isValid) {
        throw new Error(`Invalid action plan: ${validation.errors.join(', ')}`);
      }

      // Store in database
      const createdPlan = await prisma.aIActionPlan.create({
        data: {
          id: plan.id,
          contactId: plan.contactId,
          organizationId: plan.organizationId,
          actionType: plan.actionType,
          actionName: plan.actionName,
          actionDescription: plan.actionDescription,
          status: plan.status,
          priority: plan.priority,
          confidence: plan.aiConfidence || 0,
          reasoning: plan.aiReasoning || '',
          createdBy: plan.createdBy || 'system',
          scheduledAt: plan.scheduledAt,
          expiresAt: plan.expiresAt,
          actionData: {
            parameters: plan.parameters,
            context: plan.context,
            dependencies: plan.dependencies,
            approval: plan.approval,
            executionMode: plan.executionMode,
            riskLevel: plan.riskLevel,
            requiresApproval: plan.requiresApproval,
            tags: plan.tags,
            metadata: plan.metadata,
            estimatedImpact: plan.estimatedImpact,
            costEstimate: plan.costEstimate,
            maxRetries: plan.maxRetries
          }
        }
      });

      // Publish action plan created event
      await ActionPlanManager.publishActionEvent(plan, 'action_plan_created');

      logger.info('Action plan created successfully', {
        actionPlanId: plan.id,
        contactId: plan.contactId,
        actionType: plan.actionType,
        status: plan.status,
        requiresApproval: plan.requiresApproval
      });

      return createdPlan.id;

    } catch (error) {
      logger.error('Failed to create action plan', {
        actionPlanId: plan.id,
        contactId: plan.contactId,
        actionType: plan.actionType,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get action plan by ID
   */
  static async getActionPlan(actionPlanId: string): Promise<ActionPlan | null> {
    try {
      const dbPlan = await prisma.aIActionPlan.findUnique({
        where: { id: actionPlanId }
      });

      if (!dbPlan) {
        return null;
      }

      return ActionPlanManager.mapDbToActionPlan(dbPlan);

    } catch (error) {
      logger.error('Failed to get action plan', {
        actionPlanId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Query action plans with filters
   */
  static async queryActionPlans(query: ActionPlanQuery): Promise<ActionPlan[]> {
    try {
      const where: any = {};

      // Build where clause
      if (query.contactId) where.contactId = query.contactId;
      if (query.organizationId) where.organizationId = query.organizationId;
      if (query.createdBy) where.createdBy = query.createdBy;
      
      if (query.status) {
        if (Array.isArray(query.status)) {
          where.status = { in: query.status };
        } else {
          where.status = query.status;
        }
      }
      
      if (query.actionType) {
        if (Array.isArray(query.actionType)) {
          where.actionType = { in: query.actionType };
        } else {
          where.actionType = query.actionType;
        }
      }
      
      if (query.dateRange) {
        where.createdAt = {
          gte: query.dateRange.from,
          lte: query.dateRange.to
        };
      }

      const dbPlans = await prisma.aIActionPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0
      });

      const actionPlans = dbPlans.map(ActionPlanManager.mapDbToActionPlan);

      // Apply additional filters that can't be done in DB
      let filteredPlans = actionPlans;

      if (query.riskLevel) {
        const riskLevels = Array.isArray(query.riskLevel) ? query.riskLevel : [query.riskLevel];
        filteredPlans = filteredPlans.filter(plan => 
          riskLevels.includes(plan.riskLevel)
        );
      }

      if (query.requiresApproval !== undefined) {
        filteredPlans = filteredPlans.filter(plan => 
          plan.requiresApproval === query.requiresApproval
        );
      }

      if (query.tags && query.tags.length > 0) {
        filteredPlans = filteredPlans.filter(plan =>
          query.tags!.some(tag => plan.tags.includes(tag))
        );
      }

      return filteredPlans;

    } catch (error) {
      logger.error('Failed to query action plans', {
        query,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Update action plan status
   */
  static async updateActionPlanStatus(
    actionPlanId: string, 
    status: ActionStatus,
    updateData?: Partial<ActionPlan>
  ): Promise<void> {
    try {
      const updateFields: any = {
        status,
        updatedAt: new Date()
      };

      // Add status-specific fields
      switch (status) {
        case ActionStatus.APPROVED:
          updateFields.approvedAt = new Date();
          if (updateData?.approval?.approverId) {
            updateFields.actionData = {
              ...updateFields.actionData,
              approval: {
                ...updateData.approval,
                approvedAt: new Date()
              }
            };
          }
          break;
        
        case ActionStatus.REJECTED:
          updateFields.rejectedAt = new Date();
          if (updateData?.approval) {
            updateFields.actionData = {
              ...updateFields.actionData,
              approval: {
                ...updateData.approval,
                rejectedAt: new Date()
              }
            };
          }
          break;
        
        case ActionStatus.EXECUTING:
          updateFields.executingAt = new Date();
          break;
        
        case ActionStatus.COMPLETED:
          updateFields.executedAt = new Date();
          if (updateData?.executionResult) {
            updateFields.actionData = {
              ...updateFields.actionData,
              executionResult: updateData.executionResult
            };
          }
          break;
        
        case ActionStatus.FAILED:
          updateFields.failedAt = new Date();
          if (updateData?.executionResult) {
            updateFields.actionData = {
              ...updateFields.actionData,
              executionResult: updateData.executionResult
            };
          }
          break;
      }

      await prisma.aIActionPlan.update({
        where: { id: actionPlanId },
        data: updateFields
      });

      // Publish status change event
      const plan = await ActionPlanManager.getActionPlan(actionPlanId);
      if (plan) {
        await ActionPlanManager.publishActionEvent(plan, 'action_plan_status_changed');
      }

      logger.info('Action plan status updated', {
        actionPlanId,
        newStatus: status,
        previousStatus: plan?.status
      });

    } catch (error) {
      logger.error('Failed to update action plan status', {
        actionPlanId,
        status,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Approve action plan
   */
  static async approveActionPlan(
    actionPlanId: string, 
    approverId: string,
    approvalNotes?: string
  ): Promise<void> {
    const plan = await ActionPlanManager.getActionPlan(actionPlanId);
    
    if (!plan) {
      throw new Error('Action plan not found');
    }

    if (!plan.requiresApproval) {
      throw new Error('Action plan does not require approval');
    }

    if (plan.status !== ActionStatus.QUEUED) {
      throw new Error(`Cannot approve action plan with status: ${plan.status}`);
    }

    await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.APPROVED, {
      approval: {
        ...plan.approval,
        approverId,
        approvedAt: new Date(),
        approvalNotes
      }
    });
  }

  /**
   * Reject action plan
   */
  static async rejectActionPlan(
    actionPlanId: string, 
    approverId: string,
    rejectionReason: string
  ): Promise<void> {
    const plan = await ActionPlanManager.getActionPlan(actionPlanId);
    
    if (!plan) {
      throw new Error('Action plan not found');
    }

    if (plan.status !== ActionStatus.QUEUED) {
      throw new Error(`Cannot reject action plan with status: ${plan.status}`);
    }

    await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.REJECTED, {
      approval: {
        ...plan.approval,
        approverId,
        rejectedAt: new Date(),
        rejectionReason
      }
    });
  }

  /**
   * Get action plans ready for execution
   */
  static async getActionPlansReadyForExecution(organizationId?: string): Promise<ActionPlan[]> {
    const query: ActionPlanQuery = {
      status: [ActionStatus.PENDING, ActionStatus.APPROVED],
      organizationId
    };

    const allPlans = await ActionPlanManager.queryActionPlans(query);
    
    return allPlans.filter(plan => {
      // Check if ready for execution
      if (!ActionPlanUtils.isReadyForExecution(plan)) {
        return false;
      }

      // Check dependencies if any
      if (plan.dependencies && plan.dependencies.length > 0) {
        return ActionPlanUtils.areDependenciesSatisfied(plan, allPlans);
      }

      return true;
    });
  }

  /**
   * Mark action plan as executing
   */
  static async markActionPlanExecuting(actionPlanId: string): Promise<void> {
    await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.EXECUTING);
  }

  /**
   * Mark action plan as completed
   */
  static async markActionPlanCompleted(
    actionPlanId: string, 
    executionResult: ActionExecutionResult
  ): Promise<void> {
    await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.COMPLETED, {
      executionResult
    });
  }

  /**
   * Mark action plan as failed
   */
  static async markActionPlanFailed(
    actionPlanId: string, 
    executionResult: ActionExecutionResult
  ): Promise<void> {
    const plan = await ActionPlanManager.getActionPlan(actionPlanId);
    
    if (plan && plan.retryCount < plan.maxRetries) {
      // Increment retry count and reset to pending
      await prisma.aIActionPlan.update({
        where: { id: actionPlanId },
        data: {
          status: ActionStatus.PENDING,
          actionData: {
            ...plan.metadata,
            retryCount: plan.retryCount + 1,
            lastFailure: executionResult
          }
        }
      });
      
      logger.info('Action plan scheduled for retry', {
        actionPlanId,
        retryCount: plan.retryCount + 1,
        maxRetries: plan.maxRetries
      });
    } else {
      // Mark as permanently failed
      await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.FAILED, {
        executionResult
      });
    }
  }

  /**
   * Cancel action plan
   */
  static async cancelActionPlan(actionPlanId: string, reason?: string): Promise<void> {
    await ActionPlanManager.updateActionPlanStatus(actionPlanId, ActionStatus.CANCELLED);
    
    logger.info('Action plan cancelled', {
      actionPlanId,
      reason
    });
  }

  /**
   * Clean up expired action plans
   */
  static async cleanupExpiredActionPlans(organizationId?: string): Promise<number> {
    try {
      const where: any = {
        expiresAt: {
          lte: new Date()
        },
        status: {
          in: [ActionStatus.PENDING, ActionStatus.QUEUED, ActionStatus.APPROVED]
        }
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const result = await prisma.aIActionPlan.updateMany({
        where,
        data: {
          status: ActionStatus.EXPIRED,
          updatedAt: new Date()
        }
      });

      logger.info('Expired action plans cleaned up', {
        count: result.count,
        organizationId
      });

      return result.count;

    } catch (error) {
      logger.error('Failed to cleanup expired action plans', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get action plan statistics
   */
  static async getActionPlanStats(organizationId?: string): Promise<ActionPlanStats> {
    try {
      const where = organizationId ? { organizationId } : {};
      
      const plans = await prisma.aIActionPlan.findMany({
        where,
        select: {
          status: true,
          actionType: true,
          confidence: true,
          actionData: true
        }
      });

      const stats: ActionPlanStats = {
        total: plans.length,
        byStatus: {} as Record<ActionStatus, number>,
        byType: {} as Record<ActionType, number>,
        byRiskLevel: {} as Record<RiskLevel, number>,
        averageConfidence: 0,
        pendingApprovals: 0,
        scheduledActions: 0,
        expiredActions: 0
      };

      // Initialize counters
      Object.values(ActionStatus).forEach(status => {
        stats.byStatus[status] = 0;
      });
      
      Object.values(ActionType).forEach(type => {
        stats.byType[type] = 0;
      });
      
      Object.values(RiskLevel).forEach(level => {
        stats.byRiskLevel[level] = 0;
      });

      let totalConfidence = 0;
      
      plans.forEach(plan => {
        // Status counts
        stats.byStatus[plan.status as ActionStatus]++;
        
        // Type counts
        stats.byType[plan.actionType as ActionType]++;
        
        // Risk level counts
        const riskLevel = (plan.actionData as any)?.riskLevel as RiskLevel;
        if (riskLevel) {
          stats.byRiskLevel[riskLevel]++;
        }
        
        // Confidence
        totalConfidence += plan.confidence || 0;
        
        // Special counters
        if (plan.status === ActionStatus.QUEUED) {
          stats.pendingApprovals++;
        }
        
        if (plan.status === ActionStatus.APPROVED && (plan.actionData as any)?.executionMode === ExecutionMode.SCHEDULED) {
          stats.scheduledActions++;
        }
        
        if (plan.status === ActionStatus.EXPIRED) {
          stats.expiredActions++;
        }
      });

      stats.averageConfidence = plans.length > 0 ? totalConfidence / plans.length : 0;

      return stats;

    } catch (error) {
      logger.error('Failed to get action plan stats', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Map database record to ActionPlan interface
   */
  private static mapDbToActionPlan(dbPlan: any): ActionPlan {
    const actionData = dbPlan.actionData || {};
    
    return {
      id: dbPlan.id,
      contactId: dbPlan.contactId,
      organizationId: dbPlan.organizationId,
      createdBy: dbPlan.createdBy,
      createdAt: dbPlan.createdAt,
      updatedAt: dbPlan.updatedAt,
      actionType: dbPlan.actionType as ActionType,
      actionName: dbPlan.actionName || '',
      actionDescription: dbPlan.actionDescription || '',
      aiConfidence: dbPlan.confidence || 0,
      aiReasoning: dbPlan.reasoning || '',
      aiModel: actionData.aiModel || 'supreme-ai-v3',
      aiDecisionId: actionData.aiDecisionId,
      status: dbPlan.status as ActionStatus,
      executionMode: actionData.executionMode || ExecutionMode.IMMEDIATE,
      priority: dbPlan.priority as EventPriority,
      riskLevel: actionData.riskLevel || RiskLevel.LOW,
      scheduledAt: dbPlan.scheduledAt,
      executedAt: dbPlan.executedAt,
      expiresAt: dbPlan.expiresAt,
      parameters: actionData.parameters || {},
      context: actionData.context || {},
      dependencies: actionData.dependencies || [],
      requiresApproval: actionData.requiresApproval || false,
      approval: actionData.approval,
      executionResult: actionData.executionResult,
      retryCount: actionData.retryCount || 0,
      maxRetries: actionData.maxRetries || 3,
      tags: actionData.tags || [],
      metadata: actionData.metadata || {},
      estimatedImpact: actionData.estimatedImpact,
      actualImpact: actionData.actualImpact,
      costEstimate: actionData.costEstimate,
      actualCost: actionData.actualCost
    };
  }

  /**
   * Publish action plan events to event bus
   */
  private static async publishActionEvent(plan: ActionPlan, eventType: string): Promise<void> {
    try {
      const eventBus = getCustomerEventBus();
      
      await eventBus.publishCustomerEvent(
        CustomerEventType.AI_ACTION_RECOMMENDED,
        {
          actionPlanId: plan.id,
          actionType: plan.actionType,
          actionName: plan.actionName,
          status: plan.status,
          confidence: plan.aiConfidence,
          riskLevel: plan.riskLevel,
          requiresApproval: plan.requiresApproval,
          eventType,
          timestamp: new Date()
        },
        {
          contactId: plan.contactId,
          organizationId: plan.organizationId,
          priority: plan.priority,
          source: 'action-plan-manager'
        }
      );

    } catch (error) {
      logger.warn('Failed to publish action plan event', {
        actionPlanId: plan.id,
        eventType,
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - event publishing failure shouldn't break action plan operations
    }
  }
}