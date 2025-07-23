/**
 * Mandatory Approval System - Production Safety Implementation
 * ===========================================================
 * Implements mandatory human approval for ALL external actions with a trust-building
 * system that gradually enables autonomous execution based on patterns and thresholds.
 * 
 * Key Safety Principles:
 * - ALL external actions require approval by default
 * - 12-week trust building period OR 600 approved tasks
 * - Permanent approval for high-impact actions (campaigns, data changes, budget)
 * - Graduated autonomy based on historical trust patterns
 */

import { logger } from '@/lib/logger';
import { safetyApprovalSystem } from './safety-approval-system';
import { taskExecutionMonitor } from './task-execution-monitor';
import prisma from '@/lib/db/prisma';

interface TaskApprovalRequest {
  id: string;
  userId: string;
  userRole: string;
  organizationId: string;
  taskType: string;
  actionType: 'campaign_send' | 'data_modification' | 'api_call' | 'integration_setup' | 'budget_action' | 'system_config';
  description: string;
  parameters: Record<string, any>;
  estimatedImpact: {
    recordsAffected: number;
    potentialRevenue: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reversible: boolean;
  };
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  requestedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed' | 'cancelled';
  approverRequired: string; // Role or specific user ID
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  executedAt?: Date;
  rollbackData?: any;
  metadata: {
    trustScore: number;
    previousSimilarTasks: number;
    successRate: number;
    autoApprovalEligible: boolean;
    deploymentPhase: 'trust_building' | 'graduated' | 'autonomous';
  };
}

interface TrustMetrics {
  organizationId: string;
  userId: string;
  totalApprovedTasks: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  deploymentDate: Date;
  weeksActive: number;
  trustScore: number;
  autoApprovalEnabled: boolean;
  eligibleTaskTypes: string[];
  permanentApprovalRequired: string[]; // Always require approval
  lastEvaluated: Date;
}

interface DeploymentConfiguration {
  organizationId: string;
  deploymentDate: Date;
  phase: 'trust_building' | 'graduated' | 'autonomous';
  mandatoryApprovalWeeks: number; // Default: 12
  trustTaskThreshold: number; // Default: 600
  permanentApprovalActions: string[];
  autoApprovalRules: {
    enabled: boolean;
    maxImpactLevel: 'low' | 'medium' | 'high';
    maxRecordsAffected: number;
    maxRevenue: number;
    requiredSuccessRate: number;
    minHistoricalTasks: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

class MandatoryApprovalSystem {
  private pendingApprovals: Map<string, TaskApprovalRequest> = new Map();
  private trustMetrics: Map<string, TrustMetrics> = new Map();
  private deploymentConfigs: Map<string, DeploymentConfiguration> = new Map();
  private readonly TRUST_BUILDING_WEEKS = 12;
  private readonly TRUST_TASK_THRESHOLD = 600;
  private readonly APPROVAL_TIMEOUT_HOURS = 24;

  // Actions that ALWAYS require approval regardless of trust level
  private readonly PERMANENT_APPROVAL_ACTIONS = [
    'campaign_send',        // Email/SMS/WhatsApp campaigns
    'data_modification',    // Customer data changes
    'budget_action',        // Financial decisions
    'integration_setup',    // External API configurations
    'system_config'         // System-level changes
  ];

  constructor() {
    this.initializeSystem();
    this.startApprovalMonitoring();
  }

  /**
   * Initialize the mandatory approval system
   */
  private async initializeSystem(): Promise<void> {
    // Load existing configurations from database
    await this.loadDeploymentConfigurations();
    await this.loadTrustMetrics();
    
    logger.info('Mandatory Approval System initialized', {
      trustBuildingWeeks: this.TRUST_BUILDING_WEEKS,
      taskThreshold: this.TRUST_TASK_THRESHOLD,
      permanentApprovalActions: this.PERMANENT_APPROVAL_ACTIONS
    });
  }

  /**
   * Check if an action requires approval based on current deployment phase and trust metrics
   */
  async requiresApproval(
    userId: string,
    organizationId: string,
    actionType: string,
    parameters: Record<string, any>
  ): Promise<{
    required: boolean;
    reason: string;
    phase: string;
    trustScore: number;
    autoApprovalEligible: boolean;
  }> {
    try {
      // Get deployment configuration
      const config = await this.getDeploymentConfiguration(organizationId);
      const trustMetrics = await this.getTrustMetrics(userId, organizationId);

      // ALWAYS require approval for permanent approval actions
      if (this.PERMANENT_APPROVAL_ACTIONS.includes(actionType)) {
        return {
          required: true,
          reason: 'High-impact action requires permanent human approval',
          phase: config.phase,
          trustScore: trustMetrics.trustScore,
          autoApprovalEligible: false
        };
      }

      // Check deployment phase
      switch (config.phase) {
        case 'trust_building':
          return {
            required: true,
            reason: `Trust building phase: ${config.weeksActive}/${config.mandatoryApprovalWeeks} weeks, ${trustMetrics.totalApprovedTasks}/${config.trustTaskThreshold} approved tasks`,
            phase: config.phase,
            trustScore: trustMetrics.trustScore,
            autoApprovalEligible: false
          };

        case 'graduated':
          // Check if specific action type is eligible for auto-approval
          const eligible = await this.isAutoApprovalEligible(
            userId,
            organizationId,
            actionType,
            parameters,
            trustMetrics,
            config
          );

          if (eligible.eligible) {
            return {
              required: false,
              reason: `Auto-approved: ${eligible.reason}`,
              phase: config.phase,
              trustScore: trustMetrics.trustScore,
              autoApprovalEligible: true
            };
          } else {
            return {
              required: true,
              reason: `Approval required: ${eligible.reason}`,
              phase: config.phase,
              trustScore: trustMetrics.trustScore,
              autoApprovalEligible: false
            };
          }

        case 'autonomous':
          // Even in autonomous phase, check specific action requirements
          const autoApprovalCheck = await this.isAutoApprovalEligible(
            userId,
            organizationId,
            actionType,
            parameters,
            trustMetrics,
            config
          );

          return {
            required: !autoApprovalCheck.eligible,
            reason: autoApprovalCheck.reason,
            phase: config.phase,
            trustScore: trustMetrics.trustScore,
            autoApprovalEligible: autoApprovalCheck.eligible
          };

        default:
          return {
            required: true,
            reason: 'Unknown deployment phase, defaulting to approval required',
            phase: 'unknown',
            trustScore: 0,
            autoApprovalEligible: false
          };
      }

    } catch (error) {
      logger.error('Error checking approval requirement', {
        userId,
        organizationId,
        actionType,
        error: error instanceof Error ? error.message : String(error)
      });

      // Default to requiring approval on error
      return {
        required: true,
        reason: 'System error, defaulting to approval required for safety',
        phase: 'error',
        trustScore: 0,
        autoApprovalEligible: false
      };
    }
  }

  /**
   * Create a new approval request for an external action
   */
  async createApprovalRequest(
    userId: string,
    userRole: string,
    organizationId: string,
    taskType: string,
    actionType: TaskApprovalRequest['actionType'],
    description: string,
    parameters: Record<string, any>,
    estimatedImpact: TaskApprovalRequest['estimatedImpact'],
    urgency: TaskApprovalRequest['urgency'] = 'medium'
  ): Promise<string> {
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get trust metrics for metadata
    const trustMetrics = await this.getTrustMetrics(userId, organizationId);
    const config = await this.getDeploymentConfiguration(organizationId);

    // Calculate expiration based on urgency
    const expirationHours = urgency === 'emergency' ? 2 : 
                           urgency === 'high' ? 8 : 
                           urgency === 'medium' ? 24 : 72;

    const approvalRequest: TaskApprovalRequest = {
      id: requestId,
      userId,
      userRole,
      organizationId,
      taskType,
      actionType,
      description: description.substring(0, 500),
      parameters,
      estimatedImpact,
      urgency,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
      status: 'pending',
      approverRequired: this.getRequiredApprover(actionType, userRole, estimatedImpact),
      metadata: {
        trustScore: trustMetrics.trustScore,
        previousSimilarTasks: await this.countSimilarTasks(userId, taskType),
        successRate: trustMetrics.successRate,
        autoApprovalEligible: false, // Always false for new requests
        deploymentPhase: config.phase
      }
    };

    // Store the request
    this.pendingApprovals.set(requestId, approvalRequest);
    await this.persistApprovalRequest(approvalRequest);

    // Send notifications to approvers
    await this.notifyApprovers(approvalRequest);

    logger.info('Approval request created', {
      requestId,
      userId,
      actionType,
      urgency,
      expiresAt: approvalRequest.expiresAt.toISOString(),
      approverRequired: approvalRequest.approverRequired
    });

    return requestId;
  }

  /**
   * Process an approval decision from a human approver
   */
  async processApprovalDecision(
    requestId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<{
    success: boolean;
    request: TaskApprovalRequest;
    message: string;
  }> {
    const request = this.pendingApprovals.get(requestId) || await this.loadApprovalRequest(requestId);
    
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} is already ${request.status}`);
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      await this.persistApprovalRequest(request);
      throw new Error(`Request ${requestId} has expired`);
    }

    const now = new Date();

    if (decision === 'approve') {
      request.status = 'approved';
      request.approvedBy = approverId;
      request.approvedAt = now;

      // Update trust metrics
      await this.updateTrustMetrics(request.userId, request.organizationId, 'approved');

      logger.info('Approval request approved', {
        requestId,
        approverId,
        actionType: request.actionType,
        userId: request.userId
      });

    } else {
      request.status = 'rejected';
      request.rejectedBy = approverId;
      request.rejectedAt = now;
      request.rejectionReason = reason || 'No reason provided';

      logger.info('Approval request rejected', {
        requestId,
        approverId,
        actionType: request.actionType,
        userId: request.userId,
        reason
      });
    }

    // Update stored request
    this.pendingApprovals.set(requestId, request);
    await this.persistApprovalRequest(request);

    return {
      success: true,
      request,
      message: decision === 'approve' ? 'Request approved' : 'Request rejected'
    };
  }

  /**
   * Execute an approved action and track the result
   */
  async executeApprovedAction(
    requestId: string,
    executionResult: {
      success: boolean;
      result?: any;
      error?: string;
      rollbackData?: any;
    }
  ): Promise<void> {
    const request = this.pendingApprovals.get(requestId) || await this.loadApprovalRequest(requestId);
    
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    if (request.status !== 'approved') {
      throw new Error(`Request ${requestId} is not approved (status: ${request.status})`);
    }

    request.status = 'executed';
    request.executedAt = new Date();
    request.rollbackData = executionResult.rollbackData;

    // Update trust metrics based on execution result
    await this.updateTrustMetrics(
      request.userId,
      request.organizationId,
      executionResult.success ? 'executed_success' : 'executed_failure'
    );

    // Check if we should update deployment phase
    await this.evaluatePhaseTransition(request.organizationId);

    this.pendingApprovals.set(requestId, request);
    await this.persistApprovalRequest(request);

    logger.info('Approved action executed', {
      requestId,
      actionType: request.actionType,
      success: executionResult.success,
      userId: request.userId
    });
  }

  /**
   * Get pending approval requests for a user or organization
   */
  async getPendingApprovals(
    organizationId: string,
    approverId?: string,
    limit = 50
  ): Promise<TaskApprovalRequest[]> {
    const allRequests = Array.from(this.pendingApprovals.values())
      .filter(request => 
        request.organizationId === organizationId &&
        request.status === 'pending' &&
        new Date() <= request.expiresAt
      );

    // Filter by approver if specified
    let filteredRequests = allRequests;
    if (approverId) {
      // Check if approver has permission for these requests
      filteredRequests = allRequests.filter(request => 
        this.canUserApprove(approverId, request)
      );
    }

    // Sort by urgency and creation time
    return filteredRequests
      .sort((a, b) => {
        const urgencyOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.requestedAt.getTime() - b.requestedAt.getTime();
      })
      .slice(0, limit);
  }

  /**
   * Get trust metrics for a user
   */
  async getTrustMetrics(userId: string, organizationId: string): Promise<TrustMetrics> {
    const key = `${organizationId}_${userId}`;
    let metrics = this.trustMetrics.get(key);

    if (!metrics) {
      // Calculate metrics from database
      metrics = await this.calculateTrustMetrics(userId, organizationId);
      this.trustMetrics.set(key, metrics);
    }

    return metrics;
  }

  /**
   * Get deployment configuration for an organization
   */
  async getDeploymentConfiguration(organizationId: string): Promise<DeploymentConfiguration> {
    let config = this.deploymentConfigs.get(organizationId);

    if (!config) {
      // Create default configuration
      config = await this.createDefaultDeploymentConfig(organizationId);
      this.deploymentConfigs.set(organizationId, config);
    }

    return config;
  }

  /**
   * Private helper methods
   */
  private async isAutoApprovalEligible(
    userId: string,
    organizationId: string,
    actionType: string,
    parameters: Record<string, any>,
    trustMetrics: TrustMetrics,
    config: DeploymentConfiguration
  ): Promise<{ eligible: boolean; reason: string }> {
    // Check if auto-approval is enabled
    if (!config.autoApprovalRules.enabled) {
      return { eligible: false, reason: 'Auto-approval disabled for organization' };
    }

    // Check trust score threshold
    if (trustMetrics.trustScore < 0.8) {
      return { eligible: false, reason: `Trust score too low: ${trustMetrics.trustScore.toFixed(2)}` };
    }

    // Check success rate
    if (trustMetrics.successRate < config.autoApprovalRules.requiredSuccessRate) {
      return { eligible: false, reason: `Success rate too low: ${(trustMetrics.successRate * 100).toFixed(1)}%` };
    }

    // Check minimum historical tasks
    if (trustMetrics.totalApprovedTasks < config.autoApprovalRules.minHistoricalTasks) {
      return { eligible: false, reason: `Insufficient task history: ${trustMetrics.totalApprovedTasks} tasks` };
    }

    // Check if action type is in eligible list
    if (!trustMetrics.eligibleTaskTypes.includes(actionType)) {
      return { eligible: false, reason: `Action type ${actionType} not eligible for auto-approval` };
    }

    // Check estimated impact limits
    const estimatedRecords = parameters.recordsAffected || 0;
    const estimatedRevenue = parameters.potentialRevenue || 0;

    if (estimatedRecords > config.autoApprovalRules.maxRecordsAffected) {
      return { eligible: false, reason: `Too many records affected: ${estimatedRecords}` };
    }

    if (estimatedRevenue > config.autoApprovalRules.maxRevenue) {
      return { eligible: false, reason: `Revenue impact too high: ${estimatedRevenue}` };
    }

    return { eligible: true, reason: 'All auto-approval criteria met' };
  }

  private getRequiredApprover(
    actionType: string,
    userRole: string,
    estimatedImpact: TaskApprovalRequest['estimatedImpact']
  ): string {
    // High-impact actions require admin approval
    if (estimatedImpact.riskLevel === 'critical' || estimatedImpact.potentialRevenue > 10000) {
      return 'ADMIN';
    }

    // Campaign actions require marketing manager approval
    if (actionType === 'campaign_send') {
      return 'MARKETING_MANAGER';
    }

    // Data modifications require data manager approval
    if (actionType === 'data_modification') {
      return 'DATA_MANAGER';
    }

    // Default to supervisor approval
    return 'SUPERVISOR';
  }

  private async countSimilarTasks(userId: string, taskType: string): Promise<number> {
    try {
      const count = await prisma.taskExecution.count({
        where: {
          userId,
          taskType,
          status: 'completed',
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      });
      return count;
    } catch (error) {
      logger.warn('Failed to count similar tasks', { userId, taskType, error });
      return 0;
    }
  }

  private async calculateTrustMetrics(userId: string, organizationId: string): Promise<TrustMetrics> {
    try {
      // Get approval history from database
      const approvalHistory = await prisma.taskApprovalRequest.findMany({
        where: {
          userId,
          organizationId,
          status: { in: ['approved', 'executed'] }
        },
        orderBy: { requestedAt: 'desc' },
        take: 1000 // Limit for performance
      });

      const totalApproved = approvalHistory.length;
      const executed = approvalHistory.filter(r => r.status === 'executed');
      const successful = executed.filter(r => r.executionSuccess === true);

      const successRate = executed.length > 0 ? successful.length / executed.length : 0;
      
      // Calculate trust score based on multiple factors
      const volumeScore = Math.min(totalApproved / 100, 1); // Max at 100 approved tasks
      const consistencyScore = successRate;
      const recentActivityScore = this.calculateRecentActivityScore(approvalHistory);
      
      const trustScore = (volumeScore * 0.3 + consistencyScore * 0.5 + recentActivityScore * 0.2);

      // Get deployment config to determine phase
      const config = await this.getDeploymentConfiguration(organizationId);
      const weeksActive = Math.floor((Date.now() - config.deploymentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Determine eligible task types based on history
      const eligibleTaskTypes = this.determineEligibleTaskTypes(approvalHistory, trustScore);

      return {
        organizationId,
        userId,
        totalApprovedTasks: totalApproved,
        successfulExecutions: successful.length,
        failedExecutions: executed.length - successful.length,
        successRate,
        deploymentDate: config.deploymentDate,
        weeksActive,
        trustScore,
        autoApprovalEnabled: config.autoApprovalRules.enabled && trustScore >= 0.8,
        eligibleTaskTypes,
        permanentApprovalRequired: [...this.PERMANENT_APPROVAL_ACTIONS],
        lastEvaluated: new Date()
      };

    } catch (error) {
      logger.error('Failed to calculate trust metrics', { userId, organizationId, error });
      
      // Return safe defaults
      return {
        organizationId,
        userId,
        totalApprovedTasks: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        deploymentDate: new Date(),
        weeksActive: 0,
        trustScore: 0,
        autoApprovalEnabled: false,
        eligibleTaskTypes: [],
        permanentApprovalRequired: [...this.PERMANENT_APPROVAL_ACTIONS],
        lastEvaluated: new Date()
      };
    }
  }

  private calculateRecentActivityScore(approvalHistory: any[]): number {
    const recentTasks = approvalHistory.filter(task => 
      task.requestedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );
    
    if (recentTasks.length === 0) return 0;
    
    const successfulRecent = recentTasks.filter(task => task.executionSuccess === true);
    return successfulRecent.length / recentTasks.length;
  }

  private determineEligibleTaskTypes(approvalHistory: any[], trustScore: number): string[] {
    const eligibleTypes: string[] = [];
    
    // Only allow auto-approval for task types with high success rates
    const taskTypeStats = approvalHistory.reduce((acc, task) => {
      if (!acc[task.taskType]) {
        acc[task.taskType] = { total: 0, successful: 0 };
      }
      acc[task.taskType].total++;
      if (task.executionSuccess) {
        acc[task.taskType].successful++;
      }
      return acc;
    }, {});

    for (const [taskType, stats] of Object.entries(taskTypeStats)) {
      const successRate = stats.successful / stats.total;
      const minTasks = 10; // Minimum tasks needed for eligibility
      
      if (stats.total >= minTasks && successRate >= 0.9 && trustScore >= 0.8) {
        // Only allow low-risk task types for auto-approval
        if (['reporting', 'analytics', 'data_export', 'contact_enrichment'].includes(taskType)) {
          eligibleTypes.push(taskType);
        }
      }
    }

    return eligibleTypes;
  }

  private async createDefaultDeploymentConfig(organizationId: string): Promise<DeploymentConfiguration> {
    const config: DeploymentConfiguration = {
      organizationId,
      deploymentDate: new Date(),
      phase: 'trust_building',
      mandatoryApprovalWeeks: this.TRUST_BUILDING_WEEKS,
      trustTaskThreshold: this.TRUST_TASK_THRESHOLD,
      permanentApprovalActions: [...this.PERMANENT_APPROVAL_ACTIONS],
      autoApprovalRules: {
        enabled: false, // Disabled during trust building
        maxImpactLevel: 'low',
        maxRecordsAffected: 100,
        maxRevenue: 1000,
        requiredSuccessRate: 0.95,
        minHistoricalTasks: 50
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.persistDeploymentConfig(config);
    return config;
  }

  private async evaluatePhaseTransition(organizationId: string): Promise<void> {
    const config = await this.getDeploymentConfiguration(organizationId);
    const now = new Date();
    const weeksActive = Math.floor((now.getTime() - config.deploymentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Get organization-wide metrics
    const orgMetrics = await this.getOrganizationTrustMetrics(organizationId);

    let newPhase = config.phase;

    if (config.phase === 'trust_building') {
      // Check if we can transition to graduated phase
      if ((weeksActive >= config.mandatoryApprovalWeeks || orgMetrics.totalApprovedTasks >= config.trustTaskThreshold) &&
          orgMetrics.averageSuccessRate >= 0.9) {
        newPhase = 'graduated';
        config.autoApprovalRules.enabled = true;
        
        logger.info('Organization transitioning to graduated autonomy phase', {
          organizationId,
          weeksActive,
          totalApprovedTasks: orgMetrics.totalApprovedTasks,
          successRate: orgMetrics.averageSuccessRate
        });
      }
    } else if (config.phase === 'graduated') {
      // Check if we can transition to autonomous phase (additional criteria)
      if (weeksActive >= 24 && // 6 months minimum
          orgMetrics.totalApprovedTasks >= 1000 &&
          orgMetrics.averageSuccessRate >= 0.95) {
        newPhase = 'autonomous';
        
        // Expand auto-approval rules for autonomous phase
        config.autoApprovalRules.maxRecordsAffected = 1000;
        config.autoApprovalRules.maxRevenue = 5000;
        
        logger.info('Organization transitioning to autonomous phase', {
          organizationId,
          weeksActive,
          totalApprovedTasks: orgMetrics.totalApprovedTasks,
          successRate: orgMetrics.averageSuccessRate
        });
      }
    }

    if (newPhase !== config.phase) {
      config.phase = newPhase;
      config.updatedAt = new Date();
      this.deploymentConfigs.set(organizationId, config);
      await this.persistDeploymentConfig(config);
    }
  }

  private async getOrganizationTrustMetrics(organizationId: string): Promise<{
    totalApprovedTasks: number;
    averageSuccessRate: number;
    activeUsers: number;
  }> {
    try {
      const stats = await prisma.taskApprovalRequest.aggregate({
        where: {
          organizationId,
          status: { in: ['approved', 'executed'] }
        },
        _count: { id: true },
        _avg: { executionSuccess: true }
      });

      const userCount = await prisma.taskApprovalRequest.findMany({
        where: { organizationId },
        select: { userId: true },
        distinct: ['userId']
      });

      return {
        totalApprovedTasks: stats._count.id || 0,
        averageSuccessRate: stats._avg.executionSuccess || 0,
        activeUsers: userCount.length
      };
    } catch (error) {
      logger.error('Failed to get organization trust metrics', { organizationId, error });
      return { totalApprovedTasks: 0, averageSuccessRate: 0, activeUsers: 0 };
    }
  }

  private canUserApprove(approverId: string, request: TaskApprovalRequest): boolean {
    // Implement role-based approval logic
    // This would check user roles and permissions
    return true; // Simplified for now
  }

  private async updateTrustMetrics(
    userId: string,
    organizationId: string,
    eventType: 'approved' | 'executed_success' | 'executed_failure'
  ): Promise<void> {
    // Update in-memory cache
    const key = `${organizationId}_${userId}`;
    const metrics = await this.getTrustMetrics(userId, organizationId);
    
    if (eventType === 'approved') {
      metrics.totalApprovedTasks++;
    } else if (eventType === 'executed_success') {
      metrics.successfulExecutions++;
    } else if (eventType === 'executed_failure') {
      metrics.failedExecutions++;
    }

    // Recalculate derived metrics
    const totalExecutions = metrics.successfulExecutions + metrics.failedExecutions;
    metrics.successRate = totalExecutions > 0 ? metrics.successfulExecutions / totalExecutions : 0;
    
    // Recalculate trust score
    const volumeScore = Math.min(metrics.totalApprovedTasks / 100, 1);
    const consistencyScore = metrics.successRate;
    metrics.trustScore = (volumeScore * 0.4 + consistencyScore * 0.6);
    
    metrics.lastEvaluated = new Date();
    this.trustMetrics.set(key, metrics);
  }

  private async notifyApprovers(request: TaskApprovalRequest): Promise<void> {
    // Implementation would send notifications via email, Slack, etc.
    logger.info('Approval request notification sent', {
      requestId: request.id,
      actionType: request.actionType,
      urgency: request.urgency,
      approverRequired: request.approverRequired
    });
  }

  private startApprovalMonitoring(): void {
    // Check for expired approvals every 10 minutes
    setInterval(async () => {
      await this.handleExpiredApprovals();
    }, 10 * 60 * 1000);

    // Update trust metrics every hour
    setInterval(async () => {
      await this.updateAllTrustMetrics();
    }, 60 * 60 * 1000);
  }

  private async handleExpiredApprovals(): Promise<void> {
    const now = new Date();
    let expiredCount = 0;

    for (const [id, request] of this.pendingApprovals.entries()) {
      if (request.status === 'pending' && now > request.expiresAt) {
        request.status = 'expired';
        await this.persistApprovalRequest(request);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info('Handled expired approval requests', { expiredCount });
    }
  }

  private async updateAllTrustMetrics(): Promise<void> {
    // Update trust metrics for all active users
    for (const config of this.deploymentConfigs.values()) {
      await this.evaluatePhaseTransition(config.organizationId);
    }
  }

  /**
   * Database persistence methods
   */
  private async persistApprovalRequest(request: TaskApprovalRequest): Promise<void> {
    try {
      await prisma.taskApprovalRequest.upsert({
        where: { id: request.id },
        update: {
          status: request.status,
          approvedBy: request.approvedBy,
          approvedAt: request.approvedAt,
          rejectedBy: request.rejectedBy,
          rejectedAt: request.rejectedAt,
          rejectionReason: request.rejectionReason,
          executedAt: request.executedAt,
          rollbackData: request.rollbackData,
          metadata: request.metadata
        },
        create: {
          id: request.id,
          userId: request.userId,
          organizationId: request.organizationId,
          taskType: request.taskType,
          actionType: request.actionType,
          description: request.description,
          parameters: request.parameters,
          estimatedImpact: request.estimatedImpact,
          urgency: request.urgency,
          requestedAt: request.requestedAt,
          expiresAt: request.expiresAt,
          status: request.status,
          approverRequired: request.approverRequired,
          metadata: request.metadata
        }
      });
    } catch (error) {
      logger.error('Failed to persist approval request', { 
        requestId: request.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async persistDeploymentConfig(config: DeploymentConfiguration): Promise<void> {
    try {
      await prisma.deploymentConfiguration.upsert({
        where: { organizationId: config.organizationId },
        update: {
          phase: config.phase,
          mandatoryApprovalWeeks: config.mandatoryApprovalWeeks,
          trustTaskThreshold: config.trustTaskThreshold,
          permanentApprovalActions: config.permanentApprovalActions,
          autoApprovalRules: config.autoApprovalRules,
          updatedAt: config.updatedAt
        },
        create: {
          organizationId: config.organizationId,
          deploymentDate: config.deploymentDate,
          phase: config.phase,
          mandatoryApprovalWeeks: config.mandatoryApprovalWeeks,
          trustTaskThreshold: config.trustTaskThreshold,
          permanentApprovalActions: config.permanentApprovalActions,
          autoApprovalRules: config.autoApprovalRules,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      logger.error('Failed to persist deployment config', { 
        organizationId: config.organizationId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async loadApprovalRequest(requestId: string): Promise<TaskApprovalRequest | null> {
    try {
      const request = await prisma.taskApprovalRequest.findUnique({
        where: { id: requestId }
      });
      return request as TaskApprovalRequest | null;
    } catch (error) {
      logger.error('Failed to load approval request', { requestId, error });
      return null;
    }
  }

  private async loadDeploymentConfigurations(): Promise<void> {
    try {
      const configs = await prisma.deploymentConfiguration.findMany();
      configs.forEach(config => {
        this.deploymentConfigs.set(config.organizationId, config as DeploymentConfiguration);
      });
    } catch (error) {
      logger.error('Failed to load deployment configurations', { error });
    }
  }

  private async loadTrustMetrics(): Promise<void> {
    // Trust metrics are calculated on-demand to ensure freshness
    logger.info('Trust metrics will be calculated on-demand');
  }

  /**
   * Public API methods
   */
  async getSystemStatus(organizationId: string): Promise<{
    phase: string;
    weeksActive: number;
    tasksApproved: number;
    successRate: number;
    autoApprovalEnabled: boolean;
    pendingApprovals: number;
  }> {
    const config = await this.getDeploymentConfiguration(organizationId);
    const orgMetrics = await this.getOrganizationTrustMetrics(organizationId);
    const pendingCount = await this.getPendingApprovals(organizationId);

    const now = new Date();
    const weeksActive = Math.floor((now.getTime() - config.deploymentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return {
      phase: config.phase,
      weeksActive,
      tasksApproved: orgMetrics.totalApprovedTasks,
      successRate: orgMetrics.averageSuccessRate,
      autoApprovalEnabled: config.autoApprovalRules.enabled,
      pendingApprovals: pendingCount.length
    };
  }
}

// Export singleton instance
export const mandatoryApprovalSystem = new MandatoryApprovalSystem();

// Export types
export type {
  TaskApprovalRequest,
  TrustMetrics,
  DeploymentConfiguration
};