/**
 * ActionPlan Interface & Structure
 * ================================
 * 
 * Comprehensive interface for AI-generated action plans
 * Provides structured way to plan, queue, approve, and execute customer actions
 * 
 * Based on user's blueprint: ActionPlan Interface & Structure
 */

import { EventPriority } from '@/lib/events/event-bus';

// Core Action Types
export enum ActionType {
  // Communication Actions
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms', 
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_PUSH_NOTIFICATION = 'send_push_notification',
  
  // Task Management Actions
  CREATE_TASK = 'create_task',
  ASSIGN_TASK = 'assign_task',
  UPDATE_TASK = 'update_task',
  
  // Customer Journey Actions
  TRIGGER_WORKFLOW = 'trigger_workflow',
  MOVE_TO_SEGMENT = 'move_to_segment',
  ADD_TO_LIST = 'add_to_list',
  REMOVE_FROM_LIST = 'remove_from_list',
  
  // Marketing Actions
  APPLY_DISCOUNT = 'apply_discount',
  SEND_COUPON = 'send_coupon',
  CREATE_PERSONALIZED_OFFER = 'create_personalized_offer',
  SCHEDULE_CAMPAIGN = 'schedule_campaign',
  
  // Engagement Actions
  SEND_SURVEY = 'send_survey',
  REQUEST_REVIEW = 'request_review',
  SEND_EDUCATIONAL_CONTENT = 'send_educational_content',
  INVITE_TO_WEBINAR = 'invite_to_webinar',
  
  // Retention Actions
  CHURN_PREVENTION = 'churn_prevention',
  WINBACK_CAMPAIGN = 'winback_campaign',
  LOYALTY_REWARD = 'loyalty_reward',
  ANNIVERSARY_GREETING = 'anniversary_greeting',
  BIRTHDAY_GREETING = 'birthday_greeting',
  
  // Sales Actions
  UPSELL_OPPORTUNITY = 'upsell_opportunity',
  CROSS_SELL_OPPORTUNITY = 'cross_sell_opportunity',
  PRICE_DROP_ALERT = 'price_drop_alert',
  RESTOCK_NOTIFICATION = 'restock_notification',
  
  // Support Actions
  PROACTIVE_SUPPORT = 'proactive_support',
  FOLLOW_UP_SUPPORT = 'follow_up_support',
  ESCALATE_ISSUE = 'escalate_issue',
  
  // Data Actions
  UPDATE_PROFILE = 'update_profile',
  REQUEST_INFORMATION = 'request_information',
  SYNC_DATA = 'sync_data',
  
  // Custom Actions
  CUSTOM_ACTION = 'custom_action'
}

// Action Status
export enum ActionStatus {
  PENDING = 'pending',           // Waiting for execution
  QUEUED = 'queued',             // Queued for human approval
  APPROVED = 'approved',         // Approved and ready for execution
  REJECTED = 'rejected',         // Rejected by human reviewer
  EXECUTING = 'executing',       // Currently being executed
  COMPLETED = 'completed',       // Successfully completed
  FAILED = 'failed',             // Failed during execution
  CANCELLED = 'cancelled',       // Cancelled before execution
  EXPIRED = 'expired'            // Expired before execution
}

// Execution Mode
export enum ExecutionMode {
  IMMEDIATE = 'immediate',       // Execute immediately
  SCHEDULED = 'scheduled',       // Execute at specific time
  TRIGGERED = 'triggered',       // Execute when condition is met
  MANUAL = 'manual'              // Execute manually by user
}

// Risk Level
export enum RiskLevel {
  LOW = 'low',                   // Low risk, can be auto-executed
  MEDIUM = 'medium',             // Medium risk, may need approval
  HIGH = 'high',                 // High risk, needs human approval
  CRITICAL = 'critical'          // Critical risk, needs senior approval
}

// Action Context - additional context for action execution
export interface ActionContext {
  triggerEvent?: string;         // Event that triggered this action
  customerSegment?: string;      // Customer segment
  campaignId?: string;           // Related campaign
  workflowId?: string;           // Related workflow
  previousActions?: string[];    // Previous actions taken
  relatedActions?: string[];     // Related actions in the plan
  marketContext?: {              // African market context
    country: string;
    currency: string;
    timezone: string;
    culturalNotes: string[];
  };
}

// Action Parameters - specific data needed for action execution
export interface ActionParameters {
  // Communication parameters
  templateId?: string;
  subject?: string;
  message?: string;
  recipientChannel?: 'email' | 'sms' | 'whatsapp' | 'push';
  personalizationData?: Record<string, any>;
  
  // Task parameters
  taskTitle?: string;
  taskDescription?: string;
  assigneeId?: string;
  dueDate?: Date;
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Marketing parameters
  discountType?: 'percentage' | 'fixed' | 'buy_one_get_one';
  discountValue?: number;
  discountCode?: string;
  validUntil?: Date;
  minimumPurchase?: number;
  
  // Workflow parameters
  workflowId?: string;
  startNodeId?: string;
  workflowData?: Record<string, any>;
  
  // List/Segment parameters
  listId?: string;
  segmentId?: string;
  segmentCriteria?: Record<string, any>;
  
  // Survey parameters
  surveyId?: string;
  surveyType?: 'nps' | 'satisfaction' | 'feedback' | 'custom';
  surveyQuestions?: Array<{
    question: string;
    type: 'text' | 'rating' | 'choice' | 'boolean';
    options?: string[];
  }>;
  
  // Custom parameters
  customData?: Record<string, any>;
}

// Action Execution Result
export interface ActionExecutionResult {
  success: boolean;
  executedAt: Date;
  executionDuration: number;    // milliseconds
  result?: any;                 // Execution result data
  error?: string;               // Error message if failed
  metadata?: Record<string, any>; // Additional execution metadata
}

// Action Dependencies
export interface ActionDependency {
  dependsOnActionId: string;
  dependencyType: 'completion' | 'success' | 'failure' | 'timing';
  delayAfterDependency?: number; // milliseconds to wait after dependency
}

// Action Approval
export interface ActionApproval {
  requiredApproverRole: 'ADMIN' | 'IT_ADMIN' | 'SUPER_ADMIN';
  approverId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvalNotes?: string;
  rejectionReason?: string;
}

// Main ActionPlan Interface
export interface ActionPlan {
  // Basic Information
  id: string;
  contactId: string;
  organizationId: string;
  createdBy: string;             // User ID or 'supreme-ai-v3'
  createdAt: Date;
  updatedAt: Date;
  
  // Action Details
  actionType: ActionType;
  actionName: string;            // Human-readable action name
  actionDescription: string;     // Detailed description of the action
  
  // AI Decision Information
  aiConfidence: number;          // AI confidence score (0-1)
  aiReasoning: string;           // AI explanation for this action
  aiModel: string;               // AI model version used
  aiDecisionId?: string;         // Link to AI decision record
  
  // Execution Information
  status: ActionStatus;
  executionMode: ExecutionMode;
  priority: EventPriority;
  riskLevel: RiskLevel;
  
  // Timing
  scheduledAt?: Date;            // When to execute (for scheduled actions)
  executedAt?: Date;             // When actually executed
  expiresAt?: Date;              // When action expires
  
  // Action Data
  parameters: ActionParameters;
  context: ActionContext;
  dependencies?: ActionDependency[];
  
  // Approval Process
  requiresApproval: boolean;
  approval?: ActionApproval;
  
  // Execution Results
  executionResult?: ActionExecutionResult;
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  tags: string[];                // Tags for categorization
  metadata: Record<string, any>; // Additional metadata
  
  // Performance Tracking
  estimatedImpact?: number;      // Expected impact score
  actualImpact?: number;         // Measured impact after execution
  costEstimate?: number;         // Estimated cost to execute
  actualCost?: number;           // Actual cost after execution
}

// Action Plan Builder - Helper class for creating action plans
export class ActionPlanBuilder {
  private plan: Partial<ActionPlan>;

  constructor(contactId: string, organizationId: string, actionType: ActionType) {
    this.plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      organizationId,
      actionType,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: ActionStatus.PENDING,
      executionMode: ExecutionMode.IMMEDIATE,
      priority: EventPriority.NORMAL,
      riskLevel: RiskLevel.LOW,
      requiresApproval: false,
      retryCount: 0,
      maxRetries: 3,
      parameters: {},
      context: {},
      tags: [],
      metadata: {}
    };
  }

  // Fluent interface methods
  withName(name: string): ActionPlanBuilder {
    this.plan.actionName = name;
    return this;
  }

  withDescription(description: string): ActionPlanBuilder {
    this.plan.actionDescription = description;
    return this;
  }

  withAIDecision(confidence: number, reasoning: string, model = 'supreme-ai-v3'): ActionPlanBuilder {
    this.plan.aiConfidence = confidence;
    this.plan.aiReasoning = reasoning;
    this.plan.aiModel = model;
    this.plan.createdBy = 'supreme-ai-v3';
    return this;
  }

  withPriority(priority: EventPriority): ActionPlanBuilder {
    this.plan.priority = priority;
    return this;
  }

  withRiskLevel(riskLevel: RiskLevel): ActionPlanBuilder {
    this.plan.riskLevel = riskLevel;
    
    // Auto-set approval requirement based on risk level
    this.plan.requiresApproval = riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;
    
    return this;
  }

  withSchedule(scheduledAt: Date): ActionPlanBuilder {
    this.plan.executionMode = ExecutionMode.SCHEDULED;
    this.plan.scheduledAt = scheduledAt;
    return this;
  }

  withExpiration(expiresAt: Date): ActionPlanBuilder {
    this.plan.expiresAt = expiresAt;
    return this;
  }

  withParameters(parameters: ActionParameters): ActionPlanBuilder {
    this.plan.parameters = { ...this.plan.parameters, ...parameters };
    return this;
  }

  withContext(context: ActionContext): ActionPlanBuilder {
    this.plan.context = { ...this.plan.context, ...context };
    return this;
  }

  withDependency(dependency: ActionDependency): ActionPlanBuilder {
    if (!this.plan.dependencies) {
      this.plan.dependencies = [];
    }
    this.plan.dependencies.push(dependency);
    return this;
  }

  withApprovalRequired(requiredRole: 'ADMIN' | 'IT_ADMIN' | 'SUPER_ADMIN' = 'ADMIN'): ActionPlanBuilder {
    this.plan.requiresApproval = true;
    this.plan.approval = {
      requiredApproverRole: requiredRole
    };
    return this;
  }

  withTags(tags: string[]): ActionPlanBuilder {
    this.plan.tags = [...(this.plan.tags || []), ...tags];
    return this;
  }

  withMetadata(metadata: Record<string, any>): ActionPlanBuilder {
    this.plan.metadata = { ...this.plan.metadata, ...metadata };
    return this;
  }

  withEstimatedImpact(impact: number): ActionPlanBuilder {
    this.plan.estimatedImpact = impact;
    return this;
  }

  withCostEstimate(cost: number): ActionPlanBuilder {
    this.plan.costEstimate = cost;
    return this;
  }

  // Build the final action plan
  build(): ActionPlan {
    // Validate required fields
    if (!this.plan.actionName) {
      throw new Error('Action name is required');
    }
    
    if (!this.plan.actionDescription) {
      throw new Error('Action description is required');
    }

    // Set status based on approval requirement
    if (this.plan.requiresApproval) {
      this.plan.status = ActionStatus.QUEUED;
    }

    // Set appropriate tags based on action type
    this.setDefaultTags();

    return this.plan as ActionPlan;
  }

  private setDefaultTags(): void {
    const actionType = this.plan.actionType;
    
    // Add default tags based on action type
    if (actionType?.includes('email')) {
      this.plan.tags?.push('email', 'communication');
    } else if (actionType?.includes('sms')) {
      this.plan.tags?.push('sms', 'communication');
    } else if (actionType?.includes('whatsapp')) {
      this.plan.tags?.push('whatsapp', 'communication');
    } else if (actionType?.includes('task')) {
      this.plan.tags?.push('task', 'management');
    } else if (actionType?.includes('workflow')) {
      this.plan.tags?.push('workflow', 'automation');
    } else if (actionType?.includes('discount') || actionType?.includes('coupon')) {
      this.plan.tags?.push('promotion', 'marketing');
    } else if (actionType?.includes('churn') || actionType?.includes('winback')) {
      this.plan.tags?.push('retention', 'churn');
    } else if (actionType?.includes('birthday') || actionType?.includes('anniversary')) {
      this.plan.tags?.push('celebration', 'engagement');
    }

    // Add risk level tag
    this.plan.tags?.push(`risk-${this.plan.riskLevel}`);
    
    // Add AI tag if created by AI
    if (this.plan.createdBy === 'supreme-ai-v3') {
      this.plan.tags?.push('ai-generated');
    }
  }
}

// Action Plan Validator
export class ActionPlanValidator {
  
  static validate(plan: ActionPlan): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!plan.id) errors.push('Action plan ID is required');
    if (!plan.contactId) errors.push('Contact ID is required');
    if (!plan.organizationId) errors.push('Organization ID is required');
    if (!plan.actionType) errors.push('Action type is required');
    if (!plan.actionName) errors.push('Action name is required');
    if (!plan.actionDescription) errors.push('Action description is required');
    
    // Business logic validation
    if (plan.aiConfidence && (plan.aiConfidence < 0 || plan.aiConfidence > 1)) {
      errors.push('AI confidence must be between 0 and 1');
    }
    
    if (plan.estimatedImpact && (plan.estimatedImpact < 0 || plan.estimatedImpact > 1)) {
      errors.push('Estimated impact must be between 0 and 1');
    }
    
    if (plan.scheduledAt && plan.scheduledAt <= new Date()) {
      errors.push('Scheduled time must be in the future');
    }
    
    if (plan.expiresAt && plan.expiresAt <= new Date()) {
      errors.push('Expiration time must be in the future');
    }
    
    if (plan.executionMode === ExecutionMode.SCHEDULED && !plan.scheduledAt) {
      errors.push('Scheduled execution mode requires scheduledAt time');
    }
    
    // Risk level and approval validation
    if ((plan.riskLevel === RiskLevel.HIGH || plan.riskLevel === RiskLevel.CRITICAL) && !plan.requiresApproval) {
      errors.push('High and critical risk actions must require approval');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for action plans
export class ActionPlanUtils {
  
  /**
   * Check if action plan is ready for execution
   */
  static isReadyForExecution(plan: ActionPlan): boolean {
    if (plan.status !== ActionStatus.PENDING && plan.status !== ActionStatus.APPROVED) {
      return false;
    }
    
    if (plan.requiresApproval && plan.status !== ActionStatus.APPROVED) {
      return false;
    }
    
    if (plan.scheduledAt && plan.scheduledAt > new Date()) {
      return false;
    }
    
    if (plan.expiresAt && plan.expiresAt <= new Date()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate action plan score based on various factors
   */
  static calculateActionScore(plan: ActionPlan): number {
    let score = 0;
    
    // AI confidence contribution (0-40 points)
    score += (plan.aiConfidence || 0) * 40;
    
    // Priority contribution (0-30 points)
    const priorityScores = {
      [EventPriority.CRITICAL]: 30,
      [EventPriority.HIGH]: 25,
      [EventPriority.NORMAL]: 15,
      [EventPriority.LOW]: 5
    };
    score += priorityScores[plan.priority] || 0;
    
    // Risk level contribution (0-20 points, lower risk = higher score)
    const riskScores = {
      [RiskLevel.LOW]: 20,
      [RiskLevel.MEDIUM]: 15,
      [RiskLevel.HIGH]: 10,
      [RiskLevel.CRITICAL]: 5
    };
    score += riskScores[plan.riskLevel] || 0;
    
    // Estimated impact contribution (0-10 points)
    score += (plan.estimatedImpact || 0) * 10;
    
    return score;
  }
  
  /**
   * Generate human-readable action summary
   */
  static generateActionSummary(plan: ActionPlan): string {
    const actionName = plan.actionName;
    const confidence = plan.aiConfidence ? `${Math.round(plan.aiConfidence * 100)}%` : 'Unknown';
    const priority = plan.priority;
    const riskLevel = plan.riskLevel;
    
    return `${actionName} (AI Confidence: ${confidence}, Priority: ${priority}, Risk: ${riskLevel})`;
  }
  
  /**
   * Get next actions in dependency chain
   */
  static getNextActions(plan: ActionPlan, allPlans: ActionPlan[]): ActionPlan[] {
    return allPlans.filter(otherPlan => 
      otherPlan.dependencies?.some(dep => dep.dependsOnActionId === plan.id)
    );
  }
  
  /**
   * Check if all dependencies are satisfied
   */
  static areDependenciesSatisfied(plan: ActionPlan, allPlans: ActionPlan[]): boolean {
    if (!plan.dependencies || plan.dependencies.length === 0) {
      return true;
    }
    
    return plan.dependencies.every(dependency => {
      const dependentPlan = allPlans.find(p => p.id === dependency.dependsOnActionId);
      
      if (!dependentPlan) {
        return false; // Dependency not found
      }
      
      switch (dependency.dependencyType) {
        case 'completion':
          return dependentPlan.status === ActionStatus.COMPLETED || dependentPlan.status === ActionStatus.FAILED;
        case 'success':
          return dependentPlan.status === ActionStatus.COMPLETED;
        case 'failure':
          return dependentPlan.status === ActionStatus.FAILED;
        case 'timing':
          return dependentPlan.executedAt !== undefined;
        default:
          return false;
      }
    });
  }
}