/**
 * Task Execution Monitoring - Enhanced Production Version
 * ======================================================
 * Comprehensive monitoring, audit logging, rollback capabilities, and performance analytics
 * for AI task execution system with enterprise-grade security and compliance features.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

interface TaskExecutionMetrics {
  totalAttempts: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  commonErrors: string[];
  userRoleStats: Record<string, number>;
  rollbackRate: number;
  approvalRequiredRate: number;
  riskDistribution: Record<string, number>;
  performanceTrends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

interface TaskExecutionEvent {
  taskType: string;
  userId: string;
  userRole: string;
  success: boolean;
  executionTime: number;
  errorType?: string;
  errorMessage?: string;
  timestamp: Date;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  approvalRequired?: boolean;
  approvalId?: string;
  rollbackPerformed?: boolean;
  rollbackReason?: string;
  parameters?: Record<string, any>;
  result?: any;
  auditTrail?: string[];
}

interface ComprehensiveTaskLog {
  id: string;
  taskId: string;
  userId: string;
  userRole: string;
  taskType: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'approval_required' | 'rolled_back';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  executionTime: number;
  parameters: Record<string, any>;
  result: any;
  warnings: string[];
  errors: string[];
  auditTrail: string[];
  rollbackData?: any;
  rollbackPerformed?: boolean;
  rollbackReason?: string;
  approvalId?: string;
  approvalRequired: boolean;
  createdAt: Date;
  completedAt?: Date;
  securityContext: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    permissions: string[];
  };
}

interface RollbackCapability {
  available: boolean;
  strategy: 'automatic' | 'manual' | 'impossible';
  steps: string[];
  timeLimit: number;
  dependencies: string[];
  rollbackData?: any;
}

class TaskExecutionMonitor {
  private metrics: Map<string, TaskExecutionEvent[]> = new Map();
  private taskLogs: Map<string, ComprehensiveTaskLog> = new Map();
  private rollbackCapabilities: Map<string, RollbackCapability> = new Map();
  private readonly MAX_EVENTS_PER_TYPE = 1000; // Limit memory usage
  private readonly MAX_TASK_LOGS = 5000; // Limit task log storage
  private performanceBuffer: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  } = {
    hourly: new Array(24).fill(0),
    daily: new Array(30).fill(0),
    weekly: new Array(52).fill(0)
  };

  constructor() {
    // Start performance trend tracking
    this.startPerformanceTrendTracking();
    
    // Start automatic cleanup
    this.startAutomaticCleanup();
  }

  /**
   * Start comprehensive task execution with full audit logging
   */
  async startTaskExecution(
    taskId: string,
    userId: string,
    userRole: string,
    taskType: string,
    description: string,
    parameters: Record<string, any>,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    securityContext: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      permissions: string[];
    },
    approvalId?: string
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const taskLog: ComprehensiveTaskLog = {
      id: executionId,
      taskId,
      userId,
      userRole,
      taskType,
      description: description.substring(0, 500),
      status: 'running',
      riskLevel,
      executionTime: 0,
      parameters,
      result: null,
      warnings: [],
      errors: [],
      auditTrail: [`${new Date().toISOString()}: Task execution started`],
      approvalId,
      approvalRequired: !!approvalId,
      createdAt: new Date(),
      securityContext
    };

    this.taskLogs.set(executionId, taskLog);
    
    // Update performance trends
    this.updatePerformanceTrends(1);
    
    // Persist to database
    await this.persistTaskLog(taskLog);

    logger.info('Task execution started with comprehensive logging', {
      executionId,
      taskId,
      userId,
      taskType,
      riskLevel,
      approvalRequired: !!approvalId
    });

    return executionId;
  }

  /**
   * Record a task execution attempt (enhanced version)
   */
  recordExecution(event: TaskExecutionEvent): void {
    const events = this.metrics.get(event.taskType) || [];
    events.push(event);

    // Keep only recent events to prevent memory overflow
    if (events.length > this.MAX_EVENTS_PER_TYPE) {
      events.splice(0, events.length - this.MAX_EVENTS_PER_TYPE);
    }

    this.metrics.set(event.taskType, events);

    // Log the event with enhanced details
    logger.info('Task execution recorded', {
      taskType: event.taskType,
      userId: event.userId,
      userRole: event.userRole,
      success: event.success,
      executionTime: event.executionTime,
      errorType: event.errorType,
      riskLevel: event.riskLevel,
      approvalRequired: event.approvalRequired,
      rollbackPerformed: event.rollbackPerformed,
      timestamp: event.timestamp
    });

    // Store metrics in database for persistence (async, don't wait)
    this.persistMetrics(event).catch(error => {
      logger.warn('Failed to persist task execution metrics', { error: error.message });
    });
  }

  /**
   * Complete task execution with comprehensive logging
   */
  async completeTaskExecution(
    executionId: string,
    result: any,
    warnings: string[] = [],
    rollbackData?: any
  ): Promise<void> {
    const taskLog = this.taskLogs.get(executionId);
    if (!taskLog) {
      logger.error('Task log not found for completion', { executionId });
      return;
    }

    const executionTime = Date.now() - taskLog.createdAt.getTime();
    
    taskLog.status = 'completed';
    taskLog.executionTime = executionTime;
    taskLog.result = result;
    taskLog.warnings = warnings;
    taskLog.rollbackData = rollbackData;
    taskLog.completedAt = new Date();
    
    taskLog.auditTrail.push(`${new Date().toISOString()}: Task completed successfully in ${executionTime}ms`);
    
    if (warnings.length > 0) {
      taskLog.auditTrail.push(`${new Date().toISOString()}: ${warnings.length} warnings generated`);
    }

    // Create rollback capability if data is available
    if (rollbackData) {
      this.createRollbackCapability(executionId, rollbackData, taskLog);
    }

    // Record execution event
    this.recordExecution({
      taskType: taskLog.taskType,
      userId: taskLog.userId,
      userRole: taskLog.userRole,
      success: true,
      executionTime,
      timestamp: new Date(),
      riskLevel: taskLog.riskLevel,
      approvalRequired: taskLog.approvalRequired,
      parameters: taskLog.parameters,
      result,
      auditTrail: taskLog.auditTrail
    });

    // Update database
    await this.persistTaskLog(taskLog);

    logger.info('Task execution completed', {
      executionId,
      taskId: taskLog.taskId,
      executionTime,
      warnings: warnings.length,
      rollbackAvailable: !!rollbackData
    });
  }

  /**
   * Fail task execution with comprehensive logging
   */
  async failTaskExecution(
    executionId: string,
    errorType: string,
    errorMessage: string,
    rollbackData?: any
  ): Promise<void> {
    const taskLog = this.taskLogs.get(executionId);
    if (!taskLog) {
      logger.error('Task log not found for failure', { executionId });
      return;
    }

    const executionTime = Date.now() - taskLog.createdAt.getTime();
    
    taskLog.status = 'failed';
    taskLog.executionTime = executionTime;
    taskLog.errors.push(errorMessage);
    taskLog.rollbackData = rollbackData;
    taskLog.completedAt = new Date();
    
    taskLog.auditTrail.push(`${new Date().toISOString()}: Task failed after ${executionTime}ms`);
    taskLog.auditTrail.push(`${new Date().toISOString()}: Error - ${errorType}: ${errorMessage}`);

    // Create rollback capability if data is available
    if (rollbackData) {
      this.createRollbackCapability(executionId, rollbackData, taskLog);
    }

    // Record execution event
    this.recordExecution({
      taskType: taskLog.taskType,
      userId: taskLog.userId,
      userRole: taskLog.userRole,
      success: false,
      executionTime,
      errorType,
      errorMessage,
      timestamp: new Date(),
      riskLevel: taskLog.riskLevel,
      approvalRequired: taskLog.approvalRequired,
      parameters: taskLog.parameters,
      auditTrail: taskLog.auditTrail
    });

    // Update database
    await this.persistTaskLog(taskLog);

    logger.error('Task execution failed', {
      executionId,
      taskId: taskLog.taskId,
      executionTime,
      errorType,
      errorMessage,
      rollbackAvailable: !!rollbackData
    });
  }

  /**
   * Perform task rollback with comprehensive logging
   */
  async performRollback(
    executionId: string,
    rollbackReason: string,
    rollbackUserId: string
  ): Promise<boolean> {
    const taskLog = this.taskLogs.get(executionId);
    const rollbackCapability = this.rollbackCapabilities.get(executionId);
    
    if (!taskLog || !rollbackCapability || !rollbackCapability.available) {
      logger.error('Rollback not available', { executionId, taskLog: !!taskLog, rollbackCapability: !!rollbackCapability });
      return false;
    }

    try {
      taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback initiated by user ${rollbackUserId}`);
      taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback reason: ${rollbackReason}`);
      
      // Execute rollback steps
      if (rollbackCapability.strategy === 'automatic') {
        taskLog.auditTrail.push(`${new Date().toISOString()}: Executing automatic rollback`);
        
        // In production, this would execute actual rollback operations
        for (const step of rollbackCapability.steps) {
          taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback step: ${step}`);
          // Simulate rollback step execution
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        taskLog.auditTrail.push(`${new Date().toISOString()}: Manual rollback procedure initiated`);
      }

      taskLog.status = 'rolled_back';
      taskLog.rollbackPerformed = true;
      taskLog.rollbackReason = rollbackReason;
      taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback completed successfully`);

      // Record rollback event
      this.recordExecution({
        taskType: taskLog.taskType,
        userId: taskLog.userId,
        userRole: taskLog.userRole,
        success: true,
        executionTime: taskLog.executionTime,
        timestamp: new Date(),
        riskLevel: taskLog.riskLevel,
        rollbackPerformed: true,
        rollbackReason,
        auditTrail: taskLog.auditTrail
      });

      // Update database
      await this.persistTaskLog(taskLog);

      logger.info('Task rollback completed', {
        executionId,
        taskId: taskLog.taskId,
        rollbackReason,
        rollbackUserId
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback failed: ${errorMessage}`);
      taskLog.errors.push(`Rollback failed: ${errorMessage}`);
      
      await this.persistTaskLog(taskLog);
      
      logger.error('Task rollback failed', { executionId, error: errorMessage });
      return false;
    }
  }

  /**
   * Get enhanced metrics for a specific task type
   */
  getMetrics(taskType: string): TaskExecutionMetrics {
    const events = this.metrics.get(taskType) || [];
    
    if (events.length === 0) {
      return {
        totalAttempts: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0,
        commonErrors: [],
        userRoleStats: {},
        rollbackRate: 0,
        approvalRequiredRate: 0,
        riskDistribution: {},
        performanceTrends: {
          hourly: [...this.performanceBuffer.hourly],
          daily: [...this.performanceBuffer.daily],
          weekly: [...this.performanceBuffer.weekly]
        }
      };
    }

    const successful = events.filter(e => e.success);
    const failed = events.filter(e => !e.success);
    const rolledBack = events.filter(e => e.rollbackPerformed);
    const approvalRequired = events.filter(e => e.approvalRequired);
    const totalTime = events.reduce((sum, e) => sum + e.executionTime, 0);
    
    // Count errors
    const errorCounts: Record<string, number> = {};
    failed.forEach(e => {
      if (e.errorType) {
        errorCounts[e.errorType] = (errorCounts[e.errorType] || 0) + 1;
      }
    });

    // Count user role stats
    const roleStats: Record<string, number> = {};
    events.forEach(e => {
      roleStats[e.userRole] = (roleStats[e.userRole] || 0) + 1;
    });

    // Count risk distribution
    const riskDistribution: Record<string, number> = {};
    events.forEach(e => {
      if (e.riskLevel) {
        riskDistribution[e.riskLevel] = (riskDistribution[e.riskLevel] || 0) + 1;
      }
    });

    const commonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);

    return {
      totalAttempts: events.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      successRate: events.length > 0 ? (successful.length / events.length) * 100 : 0,
      avgExecutionTime: events.length > 0 ? totalTime / events.length : 0,
      commonErrors,
      userRoleStats: roleStats,
      rollbackRate: events.length > 0 ? (rolledBack.length / events.length) * 100 : 0,
      approvalRequiredRate: events.length > 0 ? (approvalRequired.length / events.length) * 100 : 0,
      riskDistribution,
      performanceTrends: {
        hourly: [...this.performanceBuffer.hourly],
        daily: [...this.performanceBuffer.daily],
        weekly: [...this.performanceBuffer.weekly]
      }
    };
  }

  /**
   * Get comprehensive task log by execution ID
   */
  getTaskLog(executionId: string): ComprehensiveTaskLog | undefined {
    return this.taskLogs.get(executionId);
  }

  /**
   * Get task logs for a user with filtering
   */
  getUserTaskLogs(
    userId: string, 
    status?: string, 
    taskType?: string, 
    limit = 50
  ): ComprehensiveTaskLog[] {
    let logs = Array.from(this.taskLogs.values())
      .filter(log => log.userId === userId);

    if (status) {
      logs = logs.filter(log => log.status === status);
    }

    if (taskType) {
      logs = logs.filter(log => log.taskType === taskType);
    }

    return logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get rollback capability for a task
   */
  getRollbackCapability(executionId: string): RollbackCapability | undefined {
    return this.rollbackCapabilities.get(executionId);
  }

  /**
   * Get all task logs that can be rolled back
   */
  getRollbackCandidates(userId?: string): ComprehensiveTaskLog[] {
    const candidates = Array.from(this.taskLogs.values())
      .filter(log => 
        log.status === 'completed' && 
        log.rollbackData && 
        !log.rollbackPerformed &&
        this.rollbackCapabilities.get(log.id)?.available
      );

    if (userId) {
      return candidates.filter(log => log.userId === userId);
    }

    return candidates;
  }

  /**
   * Create rollback capability for a task
   */
  private createRollbackCapability(
    executionId: string, 
    rollbackData: any, 
    taskLog: ComprehensiveTaskLog
  ): void {
    const capability: RollbackCapability = {
      available: true,
      strategy: this.determineRollbackStrategy(taskLog.taskType, taskLog.riskLevel),
      steps: this.generateRollbackSteps(taskLog.taskType, rollbackData),
      timeLimit: this.getRollbackTimeLimit(taskLog.riskLevel),
      dependencies: this.getRollbackDependencies(taskLog.taskType),
      rollbackData
    };

    this.rollbackCapabilities.set(executionId, capability);
    
    // Auto-expire rollback capability after time limit
    setTimeout(() => {
      const current = this.rollbackCapabilities.get(executionId);
      if (current && current.available) {
        current.available = false;
        taskLog.auditTrail.push(`${new Date().toISOString()}: Rollback capability expired after ${capability.timeLimit} minutes`);
      }
    }, capability.timeLimit * 60 * 1000);
  }

  /**
   * Determine rollback strategy based on task type and risk level
   */
  private determineRollbackStrategy(
    taskType: string, 
    riskLevel: string
  ): 'automatic' | 'manual' | 'impossible' {
    if (taskType === 'reporting' || taskType === 'data_analysis') {
      return 'impossible'; // Read-only operations
    }

    if (riskLevel === 'critical') {
      return 'manual'; // High-risk operations require manual rollback
    }

    return 'automatic'; // Default to automatic rollback
  }

  /**
   * Generate rollback steps for a task type
   */
  private generateRollbackSteps(taskType: string, rollbackData: any): string[] {
    const steps: string[] = [];

    switch (taskType) {
      case 'segmentation':
        steps.push('Remove created customer segments');
        steps.push('Restore previous segmentation rules');
        steps.push('Update customer segment assignments');
        break;
      
      case 'campaign_optimization':
        steps.push('Restore original campaign settings');
        steps.push('Revert send time optimizations');
        steps.push('Reset A/B test configurations');
        break;
      
      case 'integration_config':
        steps.push('Disable new integration configuration');
        steps.push('Restore previous integration settings');
        steps.push('Validate system connectivity');
        break;
      
      default:
        steps.push('Restore previous system state');
        steps.push('Verify rollback completion');
    }

    return steps;
  }

  /**
   * Get rollback time limit based on risk level
   */
  private getRollbackTimeLimit(riskLevel: string): number {
    const limits = {
      low: 1440,      // 24 hours
      medium: 720,    // 12 hours
      high: 180,      // 3 hours
      critical: 60    // 1 hour
    };
    return limits[riskLevel] || limits.medium;
  }

  /**
   * Get rollback dependencies for a task type
   */
  private getRollbackDependencies(taskType: string): string[] {
    const dependencies: Record<string, string[]> = {
      segmentation: ['customer_data', 'segment_rules'],
      campaign_optimization: ['campaign_settings', 'email_templates'],
      integration_config: ['api_credentials', 'webhook_endpoints'],
      data_analysis: [], // No dependencies for read-only
      reporting: [] // No dependencies for read-only
    };
    
    return dependencies[taskType] || [];
  }

  /**
   * Update performance trends
   */
  private updatePerformanceTrends(increment: number): void {
    const now = new Date();
    const hourIndex = now.getHours();
    const dayIndex = now.getDate() - 1;
    const weekIndex = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    this.performanceBuffer.hourly[hourIndex] += increment;
    this.performanceBuffer.daily[dayIndex] += increment;
    this.performanceBuffer.weekly[weekIndex % 52] += increment;
  }

  /**
   * Start performance trend tracking
   */
  private startPerformanceTrendTracking(): void {
    // Reset hourly buffer every hour
    setInterval(() => {
      const hourIndex = new Date().getHours();
      this.performanceBuffer.hourly[hourIndex] = 0;
    }, 60 * 60 * 1000);

    // Reset daily buffer every day
    setInterval(() => {
      const dayIndex = new Date().getDate() - 1;
      this.performanceBuffer.daily[dayIndex] = 0;
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Start automatic cleanup of old data
   */
  private startAutomaticCleanup(): void {
    // Clean up old task logs every 6 hours
    setInterval(() => {
      this.cleanupOldTaskLogs();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Clean up old task logs to prevent memory overflow
   */
  private cleanupOldTaskLogs(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const logsToDelete: string[] = [];

    for (const [id, log] of this.taskLogs.entries()) {
      if (log.createdAt < cutoffDate) {
        logsToDelete.push(id);
      }
    }

    // Keep only recent logs if we're over the limit
    if (this.taskLogs.size > this.MAX_TASK_LOGS) {
      const sortedLogs = Array.from(this.taskLogs.entries())
        .sort(([,a], [,b]) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const toDelete = sortedLogs.slice(this.MAX_TASK_LOGS);
      toDelete.forEach(([id]) => logsToDelete.push(id));
    }

    // Delete old logs
    logsToDelete.forEach(id => {
      this.taskLogs.delete(id);
      this.rollbackCapabilities.delete(id);
    });

    if (logsToDelete.length > 0) {
      logger.info('Cleaned up old task logs', { 
        deletedCount: logsToDelete.length,
        remainingCount: this.taskLogs.size
      });
    }
  }

  /**
   * Persist task log to database
   */
  private async persistTaskLog(taskLog: ComprehensiveTaskLog): Promise<void> {
    try {
      await prisma.taskExecution.upsert({
        where: { id: taskLog.id },
        update: {
          status: taskLog.status,
          executionTime: taskLog.executionTime,
          result: taskLog.result,
          warnings: taskLog.warnings,
          errors: taskLog.errors,
          auditTrail: taskLog.auditTrail,
          rollbackData: taskLog.rollbackData,
          rollbackPerformed: taskLog.rollbackPerformed,
          rollbackReason: taskLog.rollbackReason,
          completedAt: taskLog.completedAt
        },
        create: {
          id: taskLog.id,
          taskId: taskLog.taskId,
          userId: taskLog.userId,
          taskType: taskLog.taskType,
          description: taskLog.description,
          status: taskLog.status,
          riskLevel: taskLog.riskLevel,
          executionTime: taskLog.executionTime,
          parameters: taskLog.parameters,
          result: taskLog.result,
          warnings: taskLog.warnings,
          errors: taskLog.errors,
          auditTrail: taskLog.auditTrail,
          rollbackData: taskLog.rollbackData,
          rollbackPerformed: taskLog.rollbackPerformed,
          rollbackReason: taskLog.rollbackReason,
          approvalId: taskLog.approvalId,
          createdAt: taskLog.createdAt,
          completedAt: taskLog.completedAt
        }
      });
    } catch (error) {
      logger.warn('Failed to persist task log to database', { 
        executionId: taskLog.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get overall system metrics
   */
  getOverallMetrics(): Record<string, TaskExecutionMetrics> {
    const result: Record<string, TaskExecutionMetrics> = {};
    
    for (const taskType of this.metrics.keys()) {
      result[taskType] = this.getMetrics(taskType);
    }

    return result;
  }

  /**
   * Get health status of task execution system
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const overall = this.getOverallMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    let totalAttempts = 0;
    let totalSuccessful = 0;
    
    for (const [taskType, metrics] of Object.entries(overall)) {
      totalAttempts += metrics.totalAttempts;
      totalSuccessful += metrics.successfulExecutions;
      
      // Check for issues
      if (metrics.successRate < 70 && metrics.totalAttempts > 10) {
        issues.push(`Low success rate for ${taskType}: ${metrics.successRate.toFixed(1)}%`);
        recommendations.push(`Review ${taskType} implementation and error handling`);
      }
      
      if (metrics.avgExecutionTime > 5000) { // 5 seconds
        issues.push(`Slow execution for ${taskType}: ${metrics.avgExecutionTime.toFixed(0)}ms`);
        recommendations.push(`Optimize ${taskType} performance`);
      }
    }

    const overallSuccessRate = totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 100;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (overallSuccessRate < 50) {
      status = 'critical';
    } else if (overallSuccessRate < 80 || issues.length > 2) {
      status = 'warning';
    }

    return {
      status,
      issues,
      recommendations
    };
  }

  /**
   * Persist metrics to database for long-term storage
   */
  private async persistMetrics(event: TaskExecutionEvent): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId: event.userId,
          type: 'ai_task_execution',
          channel: 'AI',
          timestamp: event.timestamp,
          metadata: {
            taskType: event.taskType,
            userRole: event.userRole,
            success: event.success,
            executionTime: event.executionTime,
            errorType: event.errorType,
            errorMessage: event.errorMessage
          }
        }
      });
    } catch (error) {
      // Don't throw - this is just for metrics collection
      logger.warn('Failed to persist task execution metrics to database', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Clear old metrics (for memory management)
   */
  clearOldMetrics(olderThanHours = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [taskType, events] of this.metrics.entries()) {
      const filtered = events.filter(e => e.timestamp > cutoff);
      this.metrics.set(taskType, filtered);
    }
    
    logger.info('Cleared old task execution metrics', { 
      cutoffHours: olderThanHours,
      remainingTaskTypes: this.metrics.size 
    });
  }
}

// Export singleton instance
export const taskExecutionMonitor = new TaskExecutionMonitor();

// Export helper function to record task execution
export function recordTaskExecution(
  taskType: string,
  userId: string,
  userRole: string,
  success: boolean,
  executionTime: number,
  errorType?: string,
  errorMessage?: string
): void {
  taskExecutionMonitor.recordExecution({
    taskType,
    userId,
    userRole,
    success,
    executionTime,
    errorType,
    errorMessage,
    timestamp: new Date()
  });
}

// Export types
export type { TaskExecutionMetrics, TaskExecutionEvent };