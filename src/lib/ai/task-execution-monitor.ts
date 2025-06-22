/**
 * Task Execution Monitoring
 * ========================
 * Monitors and tracks AI task execution success rates, performance, and errors
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
}

class TaskExecutionMonitor {
  private metrics: Map<string, TaskExecutionEvent[]> = new Map();
  private readonly MAX_EVENTS_PER_TYPE = 1000; // Limit memory usage

  /**
   * Record a task execution attempt
   */
  recordExecution(event: TaskExecutionEvent): void {
    const events = this.metrics.get(event.taskType) || [];
    events.push(event);

    // Keep only recent events to prevent memory overflow
    if (events.length > this.MAX_EVENTS_PER_TYPE) {
      events.splice(0, events.length - this.MAX_EVENTS_PER_TYPE);
    }

    this.metrics.set(event.taskType, events);

    // Log the event
    logger.info('Task execution recorded', {
      taskType: event.taskType,
      userId: event.userId,
      userRole: event.userRole,
      success: event.success,
      executionTime: event.executionTime,
      errorType: event.errorType,
      timestamp: event.timestamp
    });

    // Store metrics in database for persistence (async, don't wait)
    this.persistMetrics(event).catch(error => {
      logger.warn('Failed to persist task execution metrics', { error: error.message });
    });
  }

  /**
   * Get metrics for a specific task type
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
        userRoleStats: {}
      };
    }

    const successful = events.filter(e => e.success);
    const failed = events.filter(e => !e.success);
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
      userRoleStats: roleStats
    };
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
  clearOldMetrics(olderThanHours: number = 24): void {
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