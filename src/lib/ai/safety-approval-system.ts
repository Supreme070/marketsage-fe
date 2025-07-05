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

class SafetyApprovalSystem {
  private safetyRules: Map<string, SafetyRule> = new Map();
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private operationHistory: Map<string, OperationRequest[]> = new Map();

  constructor() {
    this.initializeSafetyRules();
    this.startApprovalCleanup();
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
   * Assess safety of an operation
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