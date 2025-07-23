/**
 * Safety & Approval Workflow System
 * =================================
 * Comprehensive safety system that evaluates, approves, and monitors dangerous operations
 * Prevents unauthorized actions and provides rollback capabilities
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { recordTaskExecution } from './task-execution-monitor';
import { AuthorizationService, Permission } from '@/lib/security/authorization';
import { TransactionManager } from '@/lib/security/transaction-manager';
import { SecurityValidator } from '@/lib/security/input-validation';

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  category: 'user_management' | 'data_destruction' | 'system_config' | 'financial' | 'bulk_operations';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  condition: (operation: OperationRequest) => boolean;
  requiredRole: 'USER' | 'IT_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  requiresApproval: boolean;
  maxRetries: number;
  cooldownPeriod: number; // minutes
}

export interface OperationRequest {
  id: string;
  userId: string;
  userRole: string;
  operationType: string;
  entity: string;
  action: string;
  parameters: Record<string, any>;
  affectedRecords?: number;
  context: {
    sessionId: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface ApprovalRequest {
  id: string;
  operationId: string;
  requesterId: string;
  requesterRole: string;
  approvalLevel: 'admin' | 'super_admin' | 'multi_admin';
  operation: OperationRequest;
  justification: string;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  autoRollbackScheduled?: boolean;
}

export interface SafetyAssessment {
  operationId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violatedRules: string[];
  requiredApprovals: string[];
  canProceed: boolean;
  warnings: string[];
  restrictions: string[];
  rollbackStrategy?: RollbackStrategy;
  estimatedImpact: {
    affectedUsers: number;
    affectedRecords: number;
    systemDowntime: number; // minutes
    reversibility: 'full' | 'partial' | 'none';
  };
}

export interface RollbackStrategy {
  id: string;
  operationId: string;
  strategy: 'automatic' | 'manual' | 'impossible';
  backupData?: any;
  rollbackSteps: RollbackStep[];
  timeLimit: number; // minutes
  dependencies: string[];
}

export interface RollbackStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  order: number;
  critical: boolean;
}

interface SmartApprovalMetrics {
  userTrustScore: number;
  operationSuccessRate: number;
  averageRiskLevel: number;
  autoApprovalEligible: boolean;
  historicalPatterns: {
    commonOperations: string[];
    typicalRiskLevel: string;
    averageApprovalTime: number;
    rejectionRate: number;
  };
}

interface LearningPattern {
  operationType: string;
  entity: string;
  action: string;
  userRole: string;
  riskLevel: string;
  approved: boolean;
  approvalTime: number;
  outcome: 'success' | 'failure' | 'rollback';
  timestamp: Date;
}

class SafetyApprovalSystem {
  private safetyRules: Map<string, SafetyRule> = new Map();
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private operationHistory: Map<string, OperationRequest[]> = new Map();
  private learningPatterns: Map<string, LearningPattern[]> = new Map();
  private userTrustScores: Map<string, number> = new Map();
  private smartApprovalThresholds = {
    trustScoreMinimum: 0.8,
    successRateMinimum: 0.95,
    maxAutoApprovalRisk: 'medium' as const,
    learningPeriodDays: 30,
    patternConfidenceThreshold: 0.9
  };

  constructor() {
    this.initializeSafetyRules();
    this.startApprovalCleanup();
    this.startLearningEngine();
    this.loadHistoricalPatterns();
  }

  /**
   * Initialize comprehensive safety rules
   */
  private initializeSafetyRules() {
    // User Management Safety Rules
    this.addSafetyRule({
      id: 'prevent_self_deletion',
      name: 'Prevent Self-Deletion',
      description: 'Users cannot delete their own accounts',
      category: 'user_management',
      riskLevel: 'high',
      condition: (op) => op.action === 'DELETE' && op.entity === 'USER' && op.parameters.userId === op.userId,
      requiredRole: 'SUPER_ADMIN',
      requiresApproval: true,
      maxRetries: 0,
      cooldownPeriod: 60
    });

    this.addSafetyRule({
      id: 'prevent_last_admin_deletion',
      name: 'Prevent Last Admin Deletion',
      description: 'Cannot delete the last admin user',
      category: 'user_management',
      riskLevel: 'critical',
      condition: (op) => op.action === 'DELETE' && op.entity === 'USER' && op.parameters.role === 'SUPER_ADMIN',
      requiredRole: 'SUPER_ADMIN',
      requiresApproval: true,
      maxRetries: 0,
      cooldownPeriod: 1440 // 24 hours
    });

    this.addSafetyRule({
      id: 'role_escalation_control',
      name: 'Role Escalation Control',
      description: 'Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN users',
      category: 'user_management',
      riskLevel: 'high',
      condition: (op) => op.action === 'CREATE' && op.entity === 'USER' && 
                         ['ADMIN', 'SUPER_ADMIN'].includes(op.parameters.role) && 
                         op.userRole !== 'SUPER_ADMIN',
      requiredRole: 'SUPER_ADMIN',
      requiresApproval: true,
      maxRetries: 1,
      cooldownPeriod: 30
    });

    // Data Destruction Safety Rules
    this.addSafetyRule({
      id: 'bulk_deletion_limit',
      name: 'Bulk Deletion Limit',
      description: 'Bulk deletions affecting >100 records require approval',
      category: 'bulk_operations',
      riskLevel: 'high',
      condition: (op) => op.action === 'DELETE' && (op.affectedRecords || 0) > 100,
      requiredRole: 'ADMIN',
      requiresApproval: true,
      maxRetries: 1,
      cooldownPeriod: 60
    });

    this.addSafetyRule({
      id: 'organization_deletion',
      name: 'Organization Deletion',
      description: 'Organization deletion requires multi-admin approval',
      category: 'system_config',
      riskLevel: 'critical',
      condition: (op) => op.action === 'DELETE' && op.entity === 'ORGANIZATION',
      requiredRole: 'SUPER_ADMIN',
      requiresApproval: true,
      maxRetries: 0,
      cooldownPeriod: 10080 // 7 days
    });

    // Financial Safety Rules
    this.addSafetyRule({
      id: 'high_value_transaction',
      name: 'High Value Transaction',
      description: 'Transactions over $10,000 require approval',
      category: 'financial',
      riskLevel: 'high',
      condition: (op) => op.operationType === 'payment' && (op.parameters.amount || 0) > 10000,
      requiredRole: 'ADMIN',
      requiresApproval: true,
      maxRetries: 2,
      cooldownPeriod: 120
    });

    // System Configuration Safety Rules
    this.addSafetyRule({
      id: 'integration_modification',
      name: 'Integration Modification',
      description: 'Critical integration changes require approval',
      category: 'system_config',
      riskLevel: 'medium',
      condition: (op) => op.entity === 'INTEGRATION' && ['UPDATE', 'DELETE'].includes(op.action),
      requiredRole: 'IT_ADMIN',
      requiresApproval: true,
      maxRetries: 2,
      cooldownPeriod: 30
    });

    // Rate limiting for sensitive operations
    this.addSafetyRule({
      id: 'rapid_user_creation',
      name: 'Rapid User Creation',
      description: 'Creating >5 users in 10 minutes requires cooling down',
      category: 'user_management',
      riskLevel: 'medium',
      condition: (op) => {
        if (op.action !== 'CREATE' || op.entity !== 'USER') return false;
        const userHistory = this.operationHistory.get(op.userId) || [];
        const recentCreations = userHistory.filter(
          hist => hist.action === 'CREATE' && 
                  hist.entity === 'USER' && 
                  Date.now() - hist.context.timestamp.getTime() < 10 * 60 * 1000
        );
        return recentCreations.length >= 5;
      },
      requiredRole: 'ADMIN',
      requiresApproval: false,
      maxRetries: 0,
      cooldownPeriod: 10
    });
  }

  /**
   * Add a safety rule to the system
   */
  private addSafetyRule(rule: SafetyRule) {
    this.safetyRules.set(rule.id, rule);
  }

  /**
   * Get smart approval metrics for a user
   */
  async getSmartApprovalMetrics(userId: string): Promise<SmartApprovalMetrics> {
    const userPatterns = this.learningPatterns.get(userId) || [];
    const recentPatterns = userPatterns.filter(p => 
      p.timestamp > new Date(Date.now() - this.smartApprovalThresholds.learningPeriodDays * 24 * 60 * 60 * 1000)
    );

    const trustScore = this.userTrustScores.get(userId) || 0.5;
    const successfulOps = recentPatterns.filter(p => p.outcome === 'success').length;
    const totalOps = recentPatterns.length;
    const successRate = totalOps > 0 ? successfulOps / totalOps : 0;

    const riskLevels = recentPatterns.map(p => p.riskLevel);
    const avgRiskValue = this.calculateAverageRiskLevel(riskLevels);

    const operationTypes = recentPatterns.map(p => `${p.operationType}:${p.entity}:${p.action}`);
    const commonOperations = this.getMostCommonItems(operationTypes, 5);

    const approvedPatterns = recentPatterns.filter(p => p.approved);
    const avgApprovalTime = approvedPatterns.length > 0 
      ? approvedPatterns.reduce((sum, p) => sum + p.approvalTime, 0) / approvedPatterns.length 
      : 0;

    const rejectionRate = totalOps > 0 
      ? recentPatterns.filter(p => !p.approved).length / totalOps 
      : 0;

    const autoApprovalEligible = 
      trustScore >= this.smartApprovalThresholds.trustScoreMinimum &&
      successRate >= this.smartApprovalThresholds.successRateMinimum &&
      avgRiskValue <= this.getRiskLevelValue(this.smartApprovalThresholds.maxAutoApprovalRisk) &&
      rejectionRate < 0.1;

    return {
      userTrustScore: trustScore,
      operationSuccessRate: successRate,
      averageRiskLevel: avgRiskValue,
      autoApprovalEligible,
      historicalPatterns: {
        commonOperations,
        typicalRiskLevel: this.getTypicalRiskLevel(riskLevels),
        averageApprovalTime: avgApprovalTime,
        rejectionRate
      }
    };
  }

  /**
   * Smart approval decision based on patterns and trust
   */
  async makeSmartApprovalDecision(
    operation: OperationRequest, 
    assessment: SafetyAssessment
  ): Promise<{ 
    autoApprove: boolean; 
    confidence: number; 
    reasoning: string[]; 
    suggestedApprovalLevel?: string;
  }> {
    const metrics = await this.getSmartApprovalMetrics(operation.userId);
    const reasoning: string[] = [];
    let confidence = 0;
    let autoApprove = false;

    // Check if operation matches common patterns
    const operationSignature = `${operation.operationType}:${operation.entity}:${operation.action}`;
    const isCommonOperation = metrics.historicalPatterns.commonOperations.includes(operationSignature);

    if (isCommonOperation) {
      confidence += 0.3;
      reasoning.push('Operation matches user\'s common patterns');
    }

    // Check trust score
    if (metrics.userTrustScore >= this.smartApprovalThresholds.trustScoreMinimum) {
      confidence += 0.3;
      reasoning.push(`High user trust score: ${(metrics.userTrustScore * 100).toFixed(1)}%`);
    }

    // Check success rate
    if (metrics.operationSuccessRate >= this.smartApprovalThresholds.successRateMinimum) {
      confidence += 0.2;
      reasoning.push(`Excellent operation success rate: ${(metrics.operationSuccessRate * 100).toFixed(1)}%`);
    }

    // Check risk level
    if (assessment.riskLevel === 'low' || 
        (assessment.riskLevel === 'medium' && metrics.autoApprovalEligible)) {
      confidence += 0.2;
      reasoning.push(`Acceptable risk level: ${assessment.riskLevel}`);
    }

    // Final decision
    autoApprove = 
      confidence >= this.smartApprovalThresholds.patternConfidenceThreshold &&
      metrics.autoApprovalEligible &&
      assessment.riskLevel !== 'critical' &&
      assessment.riskLevel !== 'high';

    if (!autoApprove && confidence > 0.7) {
      reasoning.push('Recommend expedited manual review due to high confidence');
    }

    // Learn from this assessment
    this.recordLearningPattern(operation, assessment, autoApprove);

    return {
      autoApprove,
      confidence,
      reasoning,
      suggestedApprovalLevel: this.suggestApprovalLevel(assessment.riskLevel, confidence)
    };
  }

  /**
   * Assess safety of an operation with smart approval
   */
  async assessOperation(operation: OperationRequest): Promise<SafetyAssessment> {
    try {
      logger.info('Assessing operation safety', {
        operationId: operation.id,
        userId: operation.userId,
        action: operation.action,
        entity: operation.entity
      });

      const violatedRules: string[] = [];
      const warnings: string[] = [];
      const restrictions: string[] = [];
      const requiredApprovals: string[] = [];
      let highestRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Check each safety rule
      for (const [ruleId, rule] of this.safetyRules.entries()) {
        try {
          if (rule.condition(operation)) {
            violatedRules.push(ruleId);
            
            if (this.getRiskLevelValue(rule.riskLevel) > this.getRiskLevelValue(highestRiskLevel)) {
              highestRiskLevel = rule.riskLevel;
            }

            if (rule.requiresApproval) {
              requiredApprovals.push(ruleId);
            }

            warnings.push(`${rule.name}: ${rule.description}`);

            // Check role requirements
            if (!this.hasRequiredRole(operation.userRole, rule.requiredRole)) {
              restrictions.push(`Requires ${rule.requiredRole} role or higher`);
            }

            // Check cooldown period
            if (await this.isInCooldown(operation.userId, ruleId, rule.cooldownPeriod)) {
              restrictions.push(`Operation is in cooldown period for ${rule.cooldownPeriod} minutes`);
            }
          }
        } catch (ruleError) {
          logger.warn('Safety rule evaluation failed', {
            ruleId,
            error: ruleError instanceof Error ? ruleError.message : String(ruleError)
          });
        }
      }

      // Estimate impact
      const estimatedImpact = await this.estimateImpact(operation);

      // Create rollback strategy if needed
      const rollbackStrategy = this.createRollbackStrategy(operation, highestRiskLevel);

      const assessment: SafetyAssessment = {
        operationId: operation.id,
        riskLevel: highestRiskLevel,
        violatedRules,
        requiredApprovals,
        canProceed: restrictions.length === 0 && requiredApprovals.length === 0,
        warnings,
        restrictions,
        rollbackStrategy,
        estimatedImpact
      };

      // Record the assessment
      await this.recordAssessment(operation, assessment);

      // Check for smart approval if assessment requires approval
      if (requiredApprovals.length > 0 && restrictions.length === 0) {
        const smartDecision = await this.makeSmartApprovalDecision(operation, assessment);
        
        if (smartDecision.autoApprove) {
          // Auto-approve low-risk operations for trusted users
          assessment.canProceed = true;
          assessment.requiredApprovals = [];
          assessment.warnings.push('Auto-approved based on user trust and patterns');
          assessment.warnings.push(...smartDecision.reasoning);
          
          // Record auto-approval
          await this.recordAutoApproval(operation, assessment, smartDecision);
          
          logger.info('Operation auto-approved by smart system', {
            operationId: operation.id,
            userId: operation.userId,
            confidence: smartDecision.confidence,
            reasoning: smartDecision.reasoning
          });
        } else if (smartDecision.confidence > 0.7) {
          // Add recommendation for expedited review
          assessment.warnings.push('High confidence for approval - expedited review recommended');
          assessment.warnings.push(...smartDecision.reasoning);
        }
      }

      return assessment;

    } catch (error) {
      logger.error('Safety assessment failed', {
        operationId: operation.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        operationId: operation.id,
        riskLevel: 'critical',
        violatedRules: ['assessment_failed'],
        requiredApprovals: ['manual_review'],
        canProceed: false,
        warnings: ['Safety assessment failed - manual review required'],
        restrictions: ['Operation blocked due to assessment failure'],
        estimatedImpact: {
          affectedUsers: 0,
          affectedRecords: 0,
          systemDowntime: 0,
          reversibility: 'none'
        }
      };
    }
  }

  /**
   * Request approval for a dangerous operation
   */
  async requestApproval(
    operation: OperationRequest,
    assessment: SafetyAssessment,
    justification: string
  ): Promise<ApprovalRequest> {
    const approvalId = this.generateApprovalId();
    
    // Determine approval level based on risk
    let approvalLevel: 'admin' | 'super_admin' | 'multi_admin';
    if (assessment.riskLevel === 'critical') {
      approvalLevel = 'multi_admin';
    } else if (assessment.riskLevel === 'high') {
      approvalLevel = 'super_admin';
    } else {
      approvalLevel = 'admin';
    }

    const approvalRequest: ApprovalRequest = {
      id: approvalId,
      operationId: operation.id,
      requesterId: operation.userId,
      requesterRole: operation.userRole,
      approvalLevel,
      operation,
      justification,
      expiresAt: new Date(Date.now() + this.getApprovalTimeout(assessment.riskLevel)),
      status: 'pending',
      autoRollbackScheduled: assessment.riskLevel === 'critical'
    };

    // Store the approval request
    this.pendingApprovals.set(approvalId, approvalRequest);

    // Save to database
    await prisma.approvalRequest.create({
      data: {
        id: approvalId,
        operationId: operation.id,
        requesterId: operation.userId,
        approvalLevel,
        operationData: operation,
        justification,
        expiresAt: approvalRequest.expiresAt,
        status: 'pending'
      }
    });

    // Send notifications to approvers
    await this.notifyApprovers(approvalRequest);

    logger.info('Approval request created', {
      approvalId,
      operationId: operation.id,
      approvalLevel,
      riskLevel: assessment.riskLevel
    });

    return approvalRequest;
  }

  /**
   * Approve an operation
   */
  async approveOperation(
    approvalId: string,
    approverId: string,
    approverRole: string
  ): Promise<{ success: boolean; message: string }> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return { success: false, message: 'Approval request not found' };
    }

    if (approval.status !== 'pending') {
      return { success: false, message: 'Approval request is no longer pending' };
    }

    if (approval.expiresAt < new Date()) {
      approval.status = 'expired';
      return { success: false, message: 'Approval request has expired' };
    }

    // Check if approver has sufficient role
    const hasPermission = this.canApprove(approverRole, approval.approvalLevel);
    if (!hasPermission) {
      return { success: false, message: 'Insufficient permissions to approve this operation' };
    }

    // Update approval
    approval.status = 'approved';
    approval.approvedBy = approverId;
    approval.approvedAt = new Date();

    // Update database
    await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date()
      }
    });

    // Schedule auto-rollback if needed
    if (approval.autoRollbackScheduled) {
      await this.scheduleAutoRollback(approval);
    }

    logger.info('Operation approved', {
      approvalId,
      operationId: approval.operationId,
      approverId,
      approverRole
    });

    return { success: true, message: 'Operation approved successfully' };
  }

  /**
   * Reject an operation
   */
  async rejectOperation(
    approvalId: string,
    approverId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return { success: false, message: 'Approval request not found' };
    }

    if (approval.status !== 'pending') {
      return { success: false, message: 'Approval request is no longer pending' };
    }

    // Update approval
    approval.status = 'rejected';
    approval.rejectionReason = reason;

    // Update database
    await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        rejectionReason: reason
      }
    });

    logger.info('Operation rejected', {
      approvalId,
      operationId: approval.operationId,
      approverId,
      reason
    });

    return { success: true, message: 'Operation rejected' };
  }

  /**
   * Check if an operation is approved
   */
  async isOperationApproved(operationId: string): Promise<boolean> {
    const approval = Array.from(this.pendingApprovals.values())
      .find(a => a.operationId === operationId);
    
    return approval?.status === 'approved' || false;
  }

  /**
   * Create rollback strategy
   */
  private createRollbackStrategy(operation: OperationRequest, riskLevel: string): RollbackStrategy | undefined {
    if (operation.action === 'DELETE' || riskLevel === 'critical') {
      const rollbackId = this.generateRollbackId();
      
      return {
        id: rollbackId,
        operationId: operation.id,
        strategy: operation.action === 'DELETE' ? 'impossible' : 'manual',
        rollbackSteps: this.generateRollbackSteps(operation),
        timeLimit: this.getRollbackTimeLimit(riskLevel),
        dependencies: []
      };
    }
    
    return undefined;
  }

  /**
   * Generate rollback steps
   */
  private generateRollbackSteps(operation: OperationRequest): RollbackStep[] {
    const steps: RollbackStep[] = [];
    
    switch (operation.action) {
      case 'CREATE':
        steps.push({
          id: 'rollback_create',
          description: `Delete created ${operation.entity.toLowerCase()}`,
          action: 'DELETE',
          parameters: { id: operation.parameters.id },
          order: 1,
          critical: true
        });
        break;
        
      case 'UPDATE':
        steps.push({
          id: 'rollback_update',
          description: `Restore previous ${operation.entity.toLowerCase()} state`,
          action: 'UPDATE',
          parameters: { id: operation.parameters.id, previousState: 'TO_BE_CAPTURED' },
          order: 1,
          critical: true
        });
        break;
    }
    
    return steps;
  }

  /**
   * Helper methods
   */
  private getRiskLevelValue(level: string): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[level] || 1;
  }

  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const hierarchy = ['USER', 'IT_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
    const userIndex = hierarchy.indexOf(userRole);
    const requiredIndex = hierarchy.indexOf(requiredRole);
    return userIndex >= requiredIndex;
  }

  private async isInCooldown(userId: string, ruleId: string, cooldownMinutes: number): Promise<boolean> {
    const lastViolation = await prisma.safetyViolation.findFirst({
      where: {
        userId,
        ruleId,
        createdAt: {
          gte: new Date(Date.now() - cooldownMinutes * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return !!lastViolation;
  }

  private async estimateImpact(operation: OperationRequest): Promise<SafetyAssessment['estimatedImpact']> {
    // Mock implementation - in production, this would analyze actual data
    return {
      affectedUsers: operation.affectedRecords || 1,
      affectedRecords: operation.affectedRecords || 1,
      systemDowntime: 0,
      reversibility: operation.action === 'DELETE' ? 'none' : 'full'
    };
  }

  private async recordAssessment(operation: OperationRequest, assessment: SafetyAssessment): Promise<void> {
    if (assessment.violatedRules.length > 0) {
      await prisma.safetyViolation.create({
        data: {
          userId: operation.userId,
          ruleId: assessment.violatedRules[0],
          operationId: operation.id,
          riskLevel: assessment.riskLevel,
          details: {
            operation,
            assessment
          }
        }
      });
    }
  }

  private canApprove(approverRole: string, requiredLevel: string): boolean {
    if (requiredLevel === 'multi_admin') {
      return approverRole === 'SUPER_ADMIN'; // For now, only SUPER_ADMIN can approve critical
    }
    if (requiredLevel === 'super_admin') {
      return ['SUPER_ADMIN'].includes(approverRole);
    }
    return ['ADMIN', 'SUPER_ADMIN'].includes(approverRole);
  }

  private getApprovalTimeout(riskLevel: string): number {
    const timeouts = {
      low: 60 * 60 * 1000,      // 1 hour
      medium: 30 * 60 * 1000,   // 30 minutes
      high: 15 * 60 * 1000,     // 15 minutes
      critical: 5 * 60 * 1000   // 5 minutes
    };
    return timeouts[riskLevel] || timeouts.medium;
  }

  private getRollbackTimeLimit(riskLevel: string): number {
    const limits = { low: 1440, medium: 720, high: 180, critical: 60 }; // minutes
    return limits[riskLevel] || limits.medium;
  }

  private async notifyApprovers(approval: ApprovalRequest): Promise<void> {
    // In production, this would send notifications to appropriate approvers
    logger.info('Approval notification sent', {
      approvalId: approval.id,
      approvalLevel: approval.approvalLevel
    });
  }

  private async scheduleAutoRollback(approval: ApprovalRequest): Promise<void> {
    // In production, this would schedule automatic rollback
    logger.info('Auto-rollback scheduled', {
      approvalId: approval.id,
      operationId: approval.operationId
    });
  }

  private startApprovalCleanup(): void {
    // Clean up expired approvals every 5 minutes
    setInterval(async () => {
      const now = new Date();
      for (const [id, approval] of this.pendingApprovals.entries()) {
        if (approval.expiresAt < now && approval.status === 'pending') {
          approval.status = 'expired';
          await prisma.approvalRequest.update({
            where: { id },
            data: { status: 'expired' }
          });
          this.pendingApprovals.delete(id);
        }
      }
    }, 5 * 60 * 1000);
  }

  private generateApprovalId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRollbackId(): string {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Smart approval helper methods
   */
  private calculateAverageRiskLevel(riskLevels: string[]): number {
    if (riskLevels.length === 0) return 0;
    
    const sum = riskLevels.reduce((acc, level) => acc + this.getRiskLevelValue(level), 0);
    return sum / riskLevels.length;
  }

  private getMostCommonItems(items: string[], limit: number): string[] {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  private getTypicalRiskLevel(riskLevels: string[]): string {
    const counts = riskLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts).sort(([,a], [,b]) => b - a);
    return sorted.length > 0 ? sorted[0][0] : 'medium';
  }

  private suggestApprovalLevel(riskLevel: string, confidence: number): string {
    if (riskLevel === 'critical') return 'multi_admin';
    if (riskLevel === 'high') return 'super_admin';
    if (confidence < 0.5) return 'super_admin';
    if (confidence < 0.7) return 'admin';
    return 'auto';
  }

  private async recordLearningPattern(
    operation: OperationRequest, 
    assessment: SafetyAssessment, 
    autoApproved: boolean
  ): Promise<void> {
    const pattern: LearningPattern = {
      operationType: operation.operationType,
      entity: operation.entity,
      action: operation.action,
      userRole: operation.userRole,
      riskLevel: assessment.riskLevel,
      approved: autoApproved || assessment.canProceed,
      approvalTime: 0, // Will be updated when approval completes
      outcome: 'success', // Will be updated based on execution
      timestamp: new Date()
    };

    const userPatterns = this.learningPatterns.get(operation.userId) || [];
    userPatterns.push(pattern);
    
    // Keep only recent patterns
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    const recentPatterns = userPatterns.filter(p => p.timestamp > cutoff);
    
    this.learningPatterns.set(operation.userId, recentPatterns);

    // Update trust score
    await this.updateUserTrustScore(operation.userId);
  }

  private async updateUserTrustScore(userId: string): Promise<void> {
    const patterns = this.learningPatterns.get(userId) || [];
    const recentPatterns = patterns.filter(p => 
      p.timestamp > new Date(Date.now() - this.smartApprovalThresholds.learningPeriodDays * 24 * 60 * 60 * 1000)
    );

    if (recentPatterns.length < 5) {
      // Not enough data for trust score
      this.userTrustScores.set(userId, 0.5);
      return;
    }

    const successCount = recentPatterns.filter(p => p.outcome === 'success').length;
    const rollbackCount = recentPatterns.filter(p => p.outcome === 'rollback').length;
    const failureCount = recentPatterns.filter(p => p.outcome === 'failure').length;
    
    const successRate = successCount / recentPatterns.length;
    const rollbackPenalty = rollbackCount * 0.1;
    const failurePenalty = failureCount * 0.2;
    
    const trustScore = Math.max(0, Math.min(1, successRate - rollbackPenalty - failurePenalty));
    
    this.userTrustScores.set(userId, trustScore);
  }

  private async recordAutoApproval(
    operation: OperationRequest,
    assessment: SafetyAssessment,
    decision: any
  ): Promise<void> {
    try {
      await prisma.approvalRequest.create({
        data: {
          id: `auto_${operation.id}`,
          operationId: operation.id,
          requesterId: operation.userId,
          approvalLevel: 'auto',
          operationData: operation,
          justification: 'Auto-approved by smart approval system',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          status: 'approved',
          approvedBy: 'SMART_APPROVAL_SYSTEM',
          approvedAt: new Date()
        }
      });
    } catch (error) {
      logger.warn('Failed to record auto-approval', { error });
    }
  }

  /**
   * Learning engine methods
   */
  private startLearningEngine(): void {
    // Update trust scores periodically
    setInterval(() => {
      this.updateAllUserTrustScores();
    }, 60 * 60 * 1000); // Every hour

    // Clean up old patterns
    setInterval(() => {
      this.cleanupOldPatterns();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async updateAllUserTrustScores(): Promise<void> {
    for (const userId of this.learningPatterns.keys()) {
      await this.updateUserTrustScore(userId);
    }
    
    logger.info('Updated user trust scores', {
      totalUsers: this.userTrustScores.size,
      averageTrustScore: Array.from(this.userTrustScores.values())
        .reduce((sum, score) => sum + score, 0) / Math.max(1, this.userTrustScores.size)
    });
  }

  private cleanupOldPatterns(): void {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    
    for (const [userId, patterns] of this.learningPatterns.entries()) {
      const recentPatterns = patterns.filter(p => p.timestamp > cutoff);
      if (recentPatterns.length === 0) {
        this.learningPatterns.delete(userId);
        this.userTrustScores.delete(userId);
      } else {
        this.learningPatterns.set(userId, recentPatterns);
      }
    }
  }

  private async loadHistoricalPatterns(): Promise<void> {
    try {
      // Load recent approval patterns from database
      const recentApprovals = await prisma.approvalRequest.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        take: 1000,
        orderBy: { createdAt: 'desc' }
      });

      // Convert to learning patterns
      for (const approval of recentApprovals) {
        const operation = approval.operationData as OperationRequest;
        if (operation) {
          const pattern: LearningPattern = {
            operationType: operation.operationType,
            entity: operation.entity,
            action: operation.action,
            userRole: operation.userRole,
            riskLevel: 'medium', // Default if not stored
            approved: approval.status === 'approved',
            approvalTime: approval.approvedAt ? 
              approval.approvedAt.getTime() - approval.createdAt.getTime() : 0,
            outcome: 'success', // Default, will be updated from execution logs
            timestamp: approval.createdAt
          };

          const userId = approval.requesterId;
          const userPatterns = this.learningPatterns.get(userId) || [];
          userPatterns.push(pattern);
          this.learningPatterns.set(userId, userPatterns);
        }
      }

      // Initial trust score calculation
      await this.updateAllUserTrustScores();

      logger.info('Loaded historical approval patterns', {
        totalPatterns: Array.from(this.learningPatterns.values())
          .reduce((sum, patterns) => sum + patterns.length, 0),
        totalUsers: this.learningPatterns.size
      });

    } catch (error) {
      logger.warn('Failed to load historical patterns', { error });
    }
  }

  /**
   * Update learning outcome after task execution
   */
  async updateLearningOutcome(
    operationId: string,
    userId: string,
    outcome: 'success' | 'failure' | 'rollback'
  ): Promise<void> {
    const patterns = this.learningPatterns.get(userId) || [];
    const pattern = patterns.find(p => 
      // Find pattern by matching operation characteristics and timing
      Math.abs(p.timestamp.getTime() - Date.now()) < 24 * 60 * 60 * 1000
    );

    if (pattern) {
      pattern.outcome = outcome;
      await this.updateUserTrustScore(userId);
      
      logger.info('Updated learning pattern outcome', {
        userId,
        operationId,
        outcome,
        newTrustScore: this.userTrustScores.get(userId)
      });
    }
  }

  /**
   * Add operation to user history for rate limiting
   */
  addToHistory(operation: OperationRequest): void {
    const userHistory = this.operationHistory.get(operation.userId) || [];
    userHistory.push(operation);
    
    // Keep only last 100 operations
    if (userHistory.length > 100) {
      userHistory.shift();
    }
    
    this.operationHistory.set(operation.userId, userHistory);
  }

  /**
   * Get pending approvals for a user
   */
  getPendingApprovals(userId: string): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values())
      .filter(approval => approval.requesterId === userId);
  }

  /**
   * Get approvals requiring action from a specific role
   */
  getApprovalsForRole(role: string): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values())
      .filter(approval => 
        approval.status === 'pending' && 
        this.canApprove(role, approval.approvalLevel)
      );
  }
}

// Export singleton instance
export const safetyApprovalSystem = new SafetyApprovalSystem();

// Export types
export type { SafetyApprovalSystem };