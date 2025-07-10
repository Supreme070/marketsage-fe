/**
 * AI Safe Execution Engine
 * =========================
 * 
 * Enhanced execution engine with comprehensive safety boundaries
 * Integrates with permission system, approval workflows, and rollback mechanisms
 * Provides autonomous AI task execution within strict safety constraints
 */

import { 
  AIPermissionService, 
  AIPermission, 
  RiskLevel,
  checkAIPermission
} from '@/lib/ai/ai-permission-system';
import { 
  safetyApprovalSystem, 
  type OperationRequest,
  type SafetyAssessment 
} from '@/lib/ai/safety-approval-system';
import { 
  universalTaskExecutionEngine,
  type ExecutionResult as UniversalExecutionResult
} from '@/lib/ai/universal-task-execution-engine';
import { intelligentExecutionEngine } from '@/lib/ai/intelligent-execution-engine';
import { recordTaskExecution } from '@/lib/ai/task-execution-monitor';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { redisCache } from '@/lib/cache/redis-client';

export interface SafeExecutionRequest {
  userId: string;
  operation: string;
  parameters: Record<string, any>;
  context?: {
    source: 'user' | 'ai_agent' | 'workflow' | 'scheduled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeoutMs?: number;
    maxRetries?: number;
    dryRun?: boolean;
    approvalOverride?: string;
  };
}

export interface SafeExecutionResult {
  success: boolean;
  executionId: string;
  operation: string;
  riskLevel: RiskLevel;
  executionTime: number;
  result?: any;
  error?: string;
  safetyBlocked?: boolean;
  approvalRequired?: boolean;
  approvalId?: string;
  rollbackId?: string;
  warnings: string[];
  recommendations: string[];
  confidence: number;
  debug?: Record<string, any>;
}

export interface SafetyBoundary {
  id: string;
  name: string;
  condition: (request: SafeExecutionRequest, context: ExecutionContext) => boolean;
  action: 'block' | 'warn' | 'require_approval' | 'monitor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldownPeriod?: number; // seconds
}

export interface ExecutionContext {
  user: {
    id: string;
    role: string;
    organizationId: string;
    isActive: boolean;
    permissions: AIPermission[];
  };
  session: {
    id: string;
    startTime: Date;
    operationCount: number;
    errorCount: number;
    lastOperation?: Date;
  };
  organization: {
    restrictions: string[];
    allowedHours: { start: number; end: number };
    maxOperationsPerHour: number;
    currentHourOperations: number;
  };
  environment: {
    isProduction: boolean;
    maintenanceMode: boolean;
    resourceUsage: number;
  };
}

class AISafeExecutionEngine {
  private boundaries: Map<string, SafetyBoundary> = new Map();
  private operationHistory: Map<string, Array<{ timestamp: Date; operation: string }>> = new Map();
  private rollbackQueue: Map<string, Array<{ id: string; operation: string; data: any }>> = new Map();

  constructor() {
    this.initializeSafetyBoundaries();
  }

  /**
   * Main safe execution method
   */
  async executeSafely(request: SafeExecutionRequest): Promise<SafeExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Build execution context
      const context = await this.buildExecutionContext(request.userId);
      
      if (!context) {
        return this.createErrorResult(executionId, request.operation, startTime, 'User context unavailable');
      }

      // Determine risk level
      const riskLevel = this.assessRiskLevel(request, context);
      
      // Check safety boundaries
      const boundaryCheck = await this.checkSafetyBoundaries(request, context);
      if (boundaryCheck.blocked) {
        return this.createBlockedResult(executionId, request.operation, startTime, riskLevel, boundaryCheck);
      }

      // Check AI permissions
      const permissionCheck = await this.checkPermissions(request, context);
      if (!permissionCheck.allowed) {
        return this.createPermissionDeniedResult(executionId, request.operation, startTime, riskLevel, permissionCheck);
      }

      // Check rate limits and quotas
      const quotaCheck = await this.checkQuotas(request, context);
      if (!quotaCheck.allowed) {
        return this.createQuotaExceededResult(executionId, request.operation, startTime, riskLevel, quotaCheck);
      }

      // Safety assessment for high-risk operations
      if ([RiskLevel.HIGH, RiskLevel.CRITICAL].includes(riskLevel)) {
        const safetyAssessment = await this.performSafetyAssessment(request, context);
        
        if (!safetyAssessment.canProceed) {
          if (safetyAssessment.requiresApproval) {
            const approvalId = await this.requestApproval(request, context, safetyAssessment);
            return this.createApprovalRequiredResult(executionId, request.operation, startTime, riskLevel, approvalId);
          } else {
            return this.createSafetyBlockedResult(executionId, request.operation, startTime, riskLevel, safetyAssessment);
          }
        }
      }

      // Create rollback point for destructive operations
      let rollbackId: string | undefined;
      if (this.isDestructiveOperation(request.operation)) {
        rollbackId = await this.createRollbackPoint(request, context);
      }

      // Execute the operation
      const result = await this.executeOperation(request, context);

      // Record successful execution
      await this.recordExecution(executionId, request, context, result, true);

      // Update operation history
      this.updateOperationHistory(request.userId, request.operation);

      return {
        success: true,
        executionId,
        operation: request.operation,
        riskLevel,
        executionTime: Date.now() - startTime,
        result: result.data,
        rollbackId,
        warnings: boundaryCheck.warnings,
        recommendations: this.generateRecommendations(request, context, result),
        confidence: result.confidence || 0.8,
        debug: {
          permissionChecks: permissionCheck,
          boundaryChecks: boundaryCheck,
          quotaStatus: quotaCheck,
          executionDetails: result
        }
      };

    } catch (error) {
      logger.error('Safe execution failed', {
        executionId,
        operation: request.operation,
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });

      await this.recordExecution(executionId, request, null, null, false, error);

      return this.createErrorResult(
        executionId, 
        request.operation, 
        startTime, 
        error instanceof Error ? error.message : 'Unknown execution error'
      );
    }
  }

  /**
   * Build comprehensive execution context
   */
  private async buildExecutionContext(userId: string): Promise<ExecutionContext | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          organizationId: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Get user's effective permissions
      const permissions = await AIPermissionService.getEffectiveAIPermissions(userId, user.role);

      // Get organization restrictions
      const orgRestrictions = await AIPermissionService.getOrganizationAIRestrictions(
        user.organizationId || ''
      );

      // Get current hour operations count
      const currentHour = new Date().getHours();
      const hourKey = `ops:${user.organizationId}:${currentHour}`;
      const currentHourOps = await redisCache.get<number>(hourKey) || 0;

      // Get session info
      const sessionKey = `session:${userId}`;
      const sessionData = await redisCache.get<any>(sessionKey) || {
        id: `sess_${Date.now()}`,
        startTime: new Date(),
        operationCount: 0,
        errorCount: 0
      };

      return {
        user: {
          id: user.id,
          role: user.role,
          organizationId: user.organizationId || '',
          isActive: user.isActive,
          permissions: permissions.effective
        },
        session: {
          id: sessionData.id,
          startTime: new Date(sessionData.startTime),
          operationCount: sessionData.operationCount,
          errorCount: sessionData.errorCount,
          lastOperation: sessionData.lastOperation ? new Date(sessionData.lastOperation) : undefined
        },
        organization: {
          restrictions: orgRestrictions.restricted,
          allowedHours: orgRestrictions.allowedHours,
          maxOperationsPerHour: orgRestrictions.maxOperationsPerHour,
          currentHourOperations: currentHourOps
        },
        environment: {
          isProduction: process.env.NODE_ENV === 'production',
          maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
          resourceUsage: 0.5 // TODO: Get actual resource usage
        }
      };

    } catch (error) {
      logger.error('Failed to build execution context', { userId, error });
      return null;
    }
  }

  /**
   * Check safety boundaries
   */
  private async checkSafetyBoundaries(
    request: SafeExecutionRequest, 
    context: ExecutionContext
  ): Promise<{ blocked: boolean; warnings: string[]; reasons: string[] }> {
    
    const warnings: string[] = [];
    const reasons: string[] = [];
    let blocked = false;

    for (const [id, boundary] of this.boundaries) {
      if (boundary.condition(request, context)) {
        const message = `Safety boundary triggered: ${boundary.name} - ${boundary.message}`;
        
        switch (boundary.action) {
          case 'block':
            blocked = true;
            reasons.push(message);
            break;
          case 'warn':
            warnings.push(message);
            break;
          case 'require_approval':
            // Handled separately in safety assessment
            break;
          case 'monitor':
            logger.warn('Safety boundary monitor', { boundaryId: id, userId: request.userId });
            break;
        }

        // Apply cooldown if specified
        if (boundary.cooldownPeriod) {
          const cooldownKey = `cooldown:${id}:${request.userId}`;
          await redisCache.set(cooldownKey, true, boundary.cooldownPeriod);
        }
      }
    }

    return { blocked, warnings, reasons };
  }

  /**
   * Check AI permissions
   */
  private async checkPermissions(
    request: SafeExecutionRequest,
    context: ExecutionContext
  ): Promise<{ allowed: boolean; reason?: string; missing?: AIPermission[] }> {
    
    const result = await checkAIPermission(
      context.user.id,
      context.user.role,
      context.user.organizationId,
      request.operation
    );

    return {
      allowed: result.allowed,
      reason: result.reason
    };
  }

  /**
   * Check rate limits and quotas
   */
  private async checkQuotas(
    request: SafeExecutionRequest,
    context: ExecutionContext
  ): Promise<{ allowed: boolean; reason?: string; limits?: any }> {
    
    // Check organization hourly limits
    if (context.organization.currentHourOperations >= context.organization.maxOperationsPerHour) {
      return {
        allowed: false,
        reason: `Hourly operation limit exceeded (${context.organization.maxOperationsPerHour})`,
        limits: {
          hourly: context.organization.maxOperationsPerHour,
          current: context.organization.currentHourOperations
        }
      };
    }

    // Check session limits
    if (context.session.operationCount > 100) { // Max 100 operations per session
      return {
        allowed: false,
        reason: 'Session operation limit exceeded',
        limits: {
          session: 100,
          current: context.session.operationCount
        }
      };
    }

    // Check maintenance mode
    if (context.environment.maintenanceMode && !['SUPER_ADMIN', 'IT_ADMIN'].includes(context.user.role)) {
      return {
        allowed: false,
        reason: 'System is in maintenance mode'
      };
    }

    return { allowed: true };
  }

  /**
   * Perform comprehensive safety assessment
   */
  private async performSafetyAssessment(
    request: SafeExecutionRequest,
    context: ExecutionContext
  ): Promise<SafetyAssessment> {
    
    const operationRequest: OperationRequest = {
      id: `op_${Date.now()}`,
      userId: context.user.id,
      userRole: context.user.role,
      operationType: request.operation,
      entity: this.extractEntity(request.operation),
      action: this.extractAction(request.operation),
      parameters: request.parameters,
      context: {
        sessionId: context.session.id,
        timestamp: new Date()
      }
    };

    return await safetyApprovalSystem.assessSafety(operationRequest);
  }

  /**
   * Execute the actual operation
   */
  private async executeOperation(
    request: SafeExecutionRequest,
    context: ExecutionContext
  ): Promise<{ success: boolean; data?: any; error?: string; confidence?: number }> {
    
    try {
      // Choose execution method based on operation type
      if (this.isUniversalOperation(request.operation)) {
        // Use universal task execution engine
        const result = await universalTaskExecutionEngine.execute(
          request.operation,
          {
            userId: context.user.id,
            userRole: context.user.role,
            organizationId: context.user.organizationId
          }
        );

        return {
          success: result.success,
          data: result.data,
          error: result.error,
          confidence: 0.9
        };
      } else {
        // Use intelligent execution engine for natural language
        const result = await intelligentExecutionEngine.executeUserRequest(
          request.operation,
          context.user.id
        );

        return {
          success: result.success,
          data: result.data,
          error: result.error,
          confidence: 0.8
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        confidence: 0
      };
    }
  }

  /**
   * Initialize safety boundaries
   */
  private initializeSafetyBoundaries() {
    // High-frequency operation boundary
    this.boundaries.set('high_frequency', {
      id: 'high_frequency',
      name: 'High Frequency Operations',
      condition: (request, context) => {
        const history = this.operationHistory.get(request.userId) || [];
        const recentOps = history.filter(
          op => Date.now() - op.timestamp.getTime() < 60000 // Last minute
        ).length;
        return recentOps > 10;
      },
      action: 'warn',
      severity: 'medium',
      message: 'User performing many operations rapidly',
      cooldownPeriod: 60
    });

    // Destructive operation boundary
    this.boundaries.set('destructive_ops', {
      id: 'destructive_ops',
      name: 'Destructive Operations',
      condition: (request, context) => {
        return this.isDestructiveOperation(request.operation);
      },
      action: 'require_approval',
      severity: 'high',
      message: 'Operation may delete or modify important data'
    });

    // Off-hours operation boundary
    this.boundaries.set('off_hours', {
      id: 'off_hours',
      name: 'Off Hours Operations',
      condition: (request, context) => {
        const currentHour = new Date().getHours();
        const { start, end } = context.organization.allowedHours;
        return currentHour < start || currentHour > end;
      },
      action: 'warn',
      severity: 'low',
      message: 'Operation performed outside allowed hours'
    });

    // Bulk operation boundary
    this.boundaries.set('bulk_operations', {
      id: 'bulk_operations',
      name: 'Bulk Operations',
      condition: (request, context) => {
        return request.parameters.bulk === true || 
               (request.parameters.count && request.parameters.count > 10);
      },
      action: 'require_approval',
      severity: 'high',
      message: 'Bulk operation affects multiple records'
    });

    // Session error rate boundary
    this.boundaries.set('error_rate', {
      id: 'error_rate',
      name: 'High Error Rate',
      condition: (request, context) => {
        const errorRate = context.session.errorCount / Math.max(context.session.operationCount, 1);
        return errorRate > 0.5; // More than 50% errors
      },
      action: 'block',
      severity: 'high',
      message: 'Session has high error rate, blocking further operations',
      cooldownPeriod: 300 // 5 minutes
    });
  }

  // Helper methods
  private assessRiskLevel(request: SafeExecutionRequest, context: ExecutionContext): RiskLevel {
    if (this.isDestructiveOperation(request.operation)) return RiskLevel.CRITICAL;
    if (request.parameters.bulk) return RiskLevel.HIGH;
    if (request.operation.includes('delete') || request.operation.includes('remove')) return RiskLevel.HIGH;
    if (request.operation.includes('update') || request.operation.includes('modify')) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private isDestructiveOperation(operation: string): boolean {
    const destructiveKeywords = ['delete', 'remove', 'destroy', 'purge', 'clear', 'drop'];
    return destructiveKeywords.some(keyword => operation.toLowerCase().includes(keyword));
  }

  private isUniversalOperation(operation: string): boolean {
    // Check if operation matches universal engine patterns
    return operation.includes('_') && !operation.includes(' ');
  }

  private extractEntity(operation: string): string {
    const parts = operation.split('_');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  private extractAction(operation: string): string {
    const parts = operation.split('_');
    return parts.length > 0 ? parts[0] : 'unknown';
  }

  private async createRollbackPoint(request: SafeExecutionRequest, context: ExecutionContext): Promise<string> {
    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Implementation would depend on the specific operation
    // For now, just return the ID
    return rollbackId;
  }

  private updateOperationHistory(userId: string, operation: string) {
    if (!this.operationHistory.has(userId)) {
      this.operationHistory.set(userId, []);
    }
    
    const history = this.operationHistory.get(userId)!;
    history.push({ timestamp: new Date(), operation });
    
    // Keep only last 50 operations
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private generateRecommendations(
    request: SafeExecutionRequest,
    context: ExecutionContext,
    result: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (context.session.operationCount > 50) {
      recommendations.push('Consider starting a new session to reset operation counters');
    }
    
    if (this.isDestructiveOperation(request.operation)) {
      recommendations.push('Always verify destructive operations in a test environment first');
    }
    
    return recommendations;
  }

  private async recordExecution(
    executionId: string,
    request: SafeExecutionRequest,
    context: ExecutionContext | null,
    result: any,
    success: boolean,
    error?: any
  ) {
    try {
      await recordTaskExecution(
        request.operation,
        request.userId,
        context?.user.role || 'unknown',
        success,
        Date.now()
      );

      // Log to system logger
      logger.info('Safe execution completed', {
        executionId,
        operation: request.operation,
        userId: request.userId,
        success,
        error: error instanceof Error ? error.message : error
      });

    } catch (logError) {
      logger.error('Failed to record execution', { executionId, logError });
    }
  }

  // Result creation helpers
  private async requestApproval(
    request: SafeExecutionRequest,
    context: ExecutionContext,
    assessment: SafetyAssessment
  ): Promise<string> {
    // Implementation would integrate with approval system
    return `approval_${Date.now()}`;
  }

  private createErrorResult(executionId: string, operation: string, startTime: number, error: string): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel: RiskLevel.LOW,
      executionTime: Date.now() - startTime,
      error,
      warnings: [],
      recommendations: [],
      confidence: 0
    };
  }

  private createBlockedResult(
    executionId: string, 
    operation: string, 
    startTime: number, 
    riskLevel: RiskLevel, 
    boundaryCheck: any
  ): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel,
      executionTime: Date.now() - startTime,
      safetyBlocked: true,
      error: 'Operation blocked by safety boundaries',
      warnings: boundaryCheck.warnings,
      recommendations: ['Review operation parameters and try again'],
      confidence: 0
    };
  }

  private createPermissionDeniedResult(
    executionId: string,
    operation: string,
    startTime: number,
    riskLevel: RiskLevel,
    permissionCheck: any
  ): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel,
      executionTime: Date.now() - startTime,
      error: `Permission denied: ${permissionCheck.reason}`,
      warnings: [],
      recommendations: ['Contact administrator for required permissions'],
      confidence: 0
    };
  }

  private createQuotaExceededResult(
    executionId: string,
    operation: string,
    startTime: number,
    riskLevel: RiskLevel,
    quotaCheck: any
  ): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel,
      executionTime: Date.now() - startTime,
      error: `Quota exceeded: ${quotaCheck.reason}`,
      warnings: [],
      recommendations: ['Wait for quota reset or contact administrator'],
      confidence: 0
    };
  }

  private createApprovalRequiredResult(
    executionId: string,
    operation: string,
    startTime: number,
    riskLevel: RiskLevel,
    approvalId: string
  ): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel,
      executionTime: Date.now() - startTime,
      approvalRequired: true,
      approvalId,
      error: 'Operation requires approval before execution',
      warnings: ['High-risk operation detected'],
      recommendations: ['Wait for approval or contact administrator'],
      confidence: 0.8
    };
  }

  private createSafetyBlockedResult(
    executionId: string,
    operation: string,
    startTime: number,
    riskLevel: RiskLevel,
    assessment: SafetyAssessment
  ): SafeExecutionResult {
    return {
      success: false,
      executionId,
      operation,
      riskLevel,
      executionTime: Date.now() - startTime,
      safetyBlocked: true,
      error: 'Operation blocked by safety assessment',
      warnings: assessment.warnings || [],
      recommendations: assessment.restrictions || [],
      confidence: 0
    };
  }
}

// Export singleton instance
export const aiSafeExecutionEngine = new AISafeExecutionEngine();
export { AISafeExecutionEngine };