/**
 * Workflow Queue Monitor and Health Check System
 * 
 * Monitors workflow queue performance, tracks execution health,
 * and provides real-time insights into workflow system status.
 */

import { workflowQueue, delayQueue, emailQueue, smsQueue } from '@/lib/queue';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { redisCache } from '@/lib/cache/redis-client';

// Types
export interface QueueHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  metrics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
    throughput: number; // jobs per minute
    avgProcessingTime: number; // milliseconds
    errorRate: number; // percentage
  };
  lastUpdate: Date;
}

export interface WorkflowSystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  queues: QueueHealth[];
  database: {
    status: 'healthy' | 'warning' | 'critical' | 'down';
    executionsRunning: number;
    executionsPending: number;
    executionsFailed: number;
    avgExecutionTime: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    redisConnections: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    source: string;
  }>;
  performance: {
    totalWorkflowsToday: number;
    successRate: number;
    avgCompletionTime: number;
    bottlenecks: string[];
  };
  lastCheck: Date;
}

export interface WorkflowExecutionStats {
  workflowId: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  executions: {
    total: number;
    successful: number;
    failed: number;
    running: number;
    pending: number;
  };
  performance: {
    avgExecutionTime: number;
    successRate: number;
    throughput: number;
  };
  errors: Array<{
    count: number;
    message: string;
    lastOccurrence: Date;
  }>;
  lastExecution: Date;
}

export class WorkflowQueueMonitor {
  private alertThresholds = {
    queueSize: 1000,
    errorRate: 0.05, // 5%
    avgProcessingTime: 300000, // 5 minutes
    failedJobs: 50,
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.7, // 70%
  };

  /**
   * Get comprehensive system health check
   */
  async getSystemHealth(): Promise<WorkflowSystemHealth> {
    try {
      const [queues, database, resources, alerts, performance] = await Promise.all([
        this.getQueueHealth(),
        this.getDatabaseHealth(),
        this.getResourceHealth(),
        this.getActiveAlerts(),
        this.getPerformanceMetrics(),
      ]);

      // Determine overall system status
      const overall = this.determineOverallHealth(queues, database, resources);

      return {
        overall,
        queues,
        database,
        resources,
        alerts,
        performance,
        lastCheck: new Date(),
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Monitor health of all workflow queues
   */
  async getQueueHealth(): Promise<QueueHealth[]> {
    const queueConfigs = [
      { queue: workflowQueue, name: 'workflow' },
      { queue: delayQueue, name: 'delay' },
      { queue: emailQueue, name: 'email' },
      { queue: smsQueue, name: 'sms' },
    ];

    const healthPromises = queueConfigs.map(({ queue, name }) => 
      this.getIndividualQueueHealth(queue, name)
    );

    return Promise.all(healthPromises);
  }

  /**
   * Get health metrics for a specific queue
   */
  private async getIndividualQueueHealth(queue: any, name: string): Promise<QueueHealth> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      // Get metrics from the last hour
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentJobs = await queue.getJobs(['completed', 'failed'], 0, -1, true);
      const recentJobsFiltered = recentJobs.filter(job => 
        new Date(job.finishedOn || job.processedOn || 0) > hourAgo
      );

      const completedRecent = recentJobsFiltered.filter(job => job.finishedOn && !job.failedReason);
      const failedRecent = recentJobsFiltered.filter(job => job.failedReason);

      // Calculate metrics
      const throughput = recentJobsFiltered.length; // jobs in last hour
      const avgProcessingTime = completedRecent.length > 0 
        ? completedRecent.reduce((sum, job) => sum + (job.finishedOn - job.processedOn), 0) / completedRecent.length 
        : 0;
      const errorRate = recentJobsFiltered.length > 0 ? failedRecent.length / recentJobsFiltered.length : 0;

      // Determine status
      let status: QueueHealth['status'] = 'healthy';
      if (waiting.length > this.alertThresholds.queueSize) status = 'warning';
      if (failed.length > this.alertThresholds.failedJobs) status = 'critical';
      if (errorRate > this.alertThresholds.errorRate) status = 'critical';
      if (avgProcessingTime > this.alertThresholds.avgProcessingTime) status = 'warning';

      return {
        name,
        status,
        metrics: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused: await queue.isPaused(),
          throughput,
          avgProcessingTime,
          errorRate: errorRate * 100,
        },
        lastUpdate: new Date(),
      };
    } catch (error) {
      logger.error(`Error getting queue health for ${name}:`, error);
      return {
        name,
        status: 'down',
        metrics: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: true,
          throughput: 0,
          avgProcessingTime: 0,
          errorRate: 100,
        },
        lastUpdate: new Date(),
      };
    }
  }

  /**
   * Get database health metrics
   */
  private async getDatabaseHealth() {
    try {
      const [runningCount, pendingCount, failedCount] = await Promise.all([
        prisma.workflowExecution.count({ where: { status: 'RUNNING' } }),
        prisma.workflowExecution.count({ where: { status: 'PENDING' } }),
        prisma.workflowExecution.count({ 
          where: { 
            status: 'FAILED',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
      ]);

      // Calculate average execution time
      const recentExecutions = await prisma.workflowExecution.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { startedAt: true, completedAt: true },
        take: 100,
      });

      const avgExecutionTime = recentExecutions.length > 0
        ? recentExecutions.reduce((sum, exec) => {
            if (exec.startedAt && exec.completedAt) {
              return sum + (exec.completedAt.getTime() - exec.startedAt.getTime());
            }
            return sum;
          }, 0) / recentExecutions.length
        : 0;

      let status: 'healthy' | 'warning' | 'critical' | 'down' = 'healthy';
      if (runningCount > 500) status = 'warning';
      if (pendingCount > 1000) status = 'warning';
      if (failedCount > 100) status = 'critical';
      if (avgExecutionTime > 10 * 60 * 1000) status = 'warning'; // 10 minutes

      return {
        status,
        executionsRunning: runningCount,
        executionsPending: pendingCount,
        executionsFailed: failedCount,
        avgExecutionTime,
      };
    } catch (error) {
      logger.error('Error getting database health:', error);
      return {
        status: 'down' as const,
        executionsRunning: 0,
        executionsPending: 0,
        executionsFailed: 0,
        avgExecutionTime: 0,
      };
    }
  }

  /**
   * Get system resource health metrics
   */
  private async getResourceHealth() {
    try {
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;

      // Get Redis connection info
      let redisConnections = 0;
      try {
        const redisInfo = await redisCache.info('clients');
        const connectedClients = redisInfo.match(/connected_clients:(\d+)/);
        redisConnections = connectedClients ? parseInt(connectedClients[1]) : 0;
      } catch (redisError) {
        logger.warn('Could not get Redis connection info:', redisError);
      }

      return {
        memoryUsage: memoryUsagePercent,
        cpuUsage: 0, // Would need additional monitoring for actual CPU usage
        diskUsage: 0, // Would need additional monitoring for disk usage
        redisConnections,
      };
    } catch (error) {
      logger.error('Error getting resource health:', error);
      return {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        redisConnections: 0,
      };
    }
  }

  /**
   * Get active system alerts
   */
  private async getActiveAlerts() {
    const alerts: Array<{
      level: 'info' | 'warning' | 'error' | 'critical';
      message: string;
      timestamp: Date;
      source: string;
    }> = [];

    try {
      // Check for high queue sizes
      const queueHealths = await this.getQueueHealth();
      for (const queue of queueHealths) {
        if (queue.metrics.waiting > this.alertThresholds.queueSize) {
          alerts.push({
            level: 'warning',
            message: `High queue size detected in ${queue.name}: ${queue.metrics.waiting} jobs waiting`,
            timestamp: new Date(),
            source: `queue:${queue.name}`,
          });
        }

        if (queue.metrics.errorRate > this.alertThresholds.errorRate * 100) {
          alerts.push({
            level: 'error',
            message: `High error rate in ${queue.name}: ${queue.metrics.errorRate.toFixed(1)}%`,
            timestamp: new Date(),
            source: `queue:${queue.name}`,
          });
        }

        if (queue.status === 'critical' || queue.status === 'down') {
          alerts.push({
            level: 'critical',
            message: `Queue ${queue.name} is ${queue.status}`,
            timestamp: new Date(),
            source: `queue:${queue.name}`,
          });
        }
      }

      // Check for failed workflows
      const recentFailures = await prisma.workflowExecution.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
      });

      if (recentFailures > 10) {
        alerts.push({
          level: 'warning',
          message: `High number of workflow failures: ${recentFailures} in the last hour`,
          timestamp: new Date(),
          source: 'workflows',
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      return alerts;
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalToday, successfulToday, completedExecutions] = await Promise.all([
        prisma.workflowExecution.count({
          where: { createdAt: { gte: today } },
        }),
        prisma.workflowExecution.count({
          where: { 
            status: 'COMPLETED',
            createdAt: { gte: today },
          },
        }),
        prisma.workflowExecution.findMany({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { startedAt: true, completedAt: true },
          take: 200,
        }),
      ]);

      const successRate = totalToday > 0 ? (successfulToday / totalToday) * 100 : 100;

      const avgCompletionTime = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, exec) => {
            if (exec.startedAt && exec.completedAt) {
              return sum + (exec.completedAt.getTime() - exec.startedAt.getTime());
            }
            return sum;
          }, 0) / completedExecutions.length
        : 0;

      // Identify bottlenecks
      const bottlenecks: string[] = [];
      const queueHealths = await this.getQueueHealth();
      
      for (const queue of queueHealths) {
        if (queue.metrics.waiting > 100) {
          bottlenecks.push(`${queue.name} queue backlog`);
        }
        if (queue.metrics.avgProcessingTime > 120000) { // 2 minutes
          bottlenecks.push(`${queue.name} slow processing`);
        }
      }

      return {
        totalWorkflowsToday: totalToday,
        successRate,
        avgCompletionTime,
        bottlenecks,
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return {
        totalWorkflowsToday: 0,
        successRate: 0,
        avgCompletionTime: 0,
        bottlenecks: [],
      };
    }
  }

  /**
   * Get detailed statistics for specific workflows
   */
  async getWorkflowStats(workflowId?: string): Promise<WorkflowExecutionStats[]> {
    try {
      const whereClause = workflowId ? { id: workflowId } : {};
      
      const workflows = await prisma.workflow.findMany({
        where: whereClause,
        select: { id: true, name: true },
        take: workflowId ? 1 : 20,
      });

      const statsPromises = workflows.map(async (workflow) => {
        const [total, successful, failed, running, pending] = await Promise.all([
          prisma.workflowExecution.count({ where: { workflowId: workflow.id } }),
          prisma.workflowExecution.count({ 
            where: { workflowId: workflow.id, status: 'COMPLETED' }
          }),
          prisma.workflowExecution.count({ 
            where: { workflowId: workflow.id, status: 'FAILED' }
          }),
          prisma.workflowExecution.count({ 
            where: { workflowId: workflow.id, status: 'RUNNING' }
          }),
          prisma.workflowExecution.count({ 
            where: { workflowId: workflow.id, status: 'PENDING' }
          }),
        ]);

        // Get recent executions for performance calculation
        const recentExecutions = await prisma.workflowExecution.findMany({
          where: {
            workflowId: workflow.id,
            status: 'COMPLETED',
            completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
          select: { startedAt: true, completedAt: true },
        });

        const avgExecutionTime = recentExecutions.length > 0
          ? recentExecutions.reduce((sum, exec) => {
              if (exec.startedAt && exec.completedAt) {
                return sum + (exec.completedAt.getTime() - exec.startedAt.getTime());
              }
              return sum;
            }, 0) / recentExecutions.length
          : 0;

        const successRate = total > 0 ? (successful / total) * 100 : 0;
        const throughput = recentExecutions.length / 7; // per day

        // Get common errors
        const errorExecutions = await prisma.workflowExecution.findMany({
          where: {
            workflowId: workflow.id,
            status: 'FAILED',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
          select: { error: true, completedAt: true },
        });

        const errorCounts = new Map<string, { count: number; lastOccurrence: Date }>();
        errorExecutions.forEach(exec => {
          if (exec.error) {
            const errorKey = exec.error.substring(0, 100); // Truncate for grouping
            const existing = errorCounts.get(errorKey);
            if (existing) {
              existing.count++;
              if (exec.completedAt && exec.completedAt > existing.lastOccurrence) {
                existing.lastOccurrence = exec.completedAt;
              }
            } else {
              errorCounts.set(errorKey, {
                count: 1,
                lastOccurrence: exec.completedAt || new Date(),
              });
            }
          }
        });

        const errors = Array.from(errorCounts.entries()).map(([message, data]) => ({
          message,
          count: data.count,
          lastOccurrence: data.lastOccurrence,
        }));

        // Determine status
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (successRate < 90) status = 'warning';
        if (successRate < 70) status = 'critical';
        if (failed > successful && total > 10) status = 'critical';

        const lastExecution = await prisma.workflowExecution.findFirst({
          where: { workflowId: workflow.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          workflowId: workflow.id,
          name: workflow.name,
          status,
          executions: { total, successful, failed, running, pending },
          performance: { avgExecutionTime, successRate, throughput },
          errors,
          lastExecution: lastExecution?.createdAt || new Date(0),
        };
      });

      return Promise.all(statsPromises);
    } catch (error) {
      logger.error('Error getting workflow stats:', error);
      return [];
    }
  }

  /**
   * Determine overall system health based on component status
   */
  private determineOverallHealth(
    queues: QueueHealth[],
    database: any,
    resources: any
  ): 'healthy' | 'warning' | 'critical' | 'down' {
    // Check for any critical or down status
    if (queues.some(q => q.status === 'down') || database.status === 'down') {
      return 'down';
    }

    if (queues.some(q => q.status === 'critical') || database.status === 'critical') {
      return 'critical';
    }

    if (queues.some(q => q.status === 'warning') || database.status === 'warning') {
      return 'warning';
    }

    if (resources.memoryUsage > this.alertThresholds.memoryUsage) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Pause a specific queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueueByName(queueName);
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    } catch (error) {
      logger.error(`Error pausing queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Resume a specific queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueueByName(queueName);
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    } catch (error) {
      logger.error(`Error resuming queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Clean failed jobs from a queue
   */
  async cleanFailedJobs(queueName: string, olderThan: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const queue = this.getQueueByName(queueName);
      const cleaned = await queue.clean(olderThan, 'failed');
      logger.info(`Cleaned ${cleaned} failed jobs from ${queueName} queue`);
      return cleaned;
    } catch (error) {
      logger.error(`Error cleaning failed jobs from ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get queue instance by name
   */
  private getQueueByName(name: string) {
    switch (name) {
      case 'workflow': return workflowQueue;
      case 'delay': return delayQueue;
      case 'email': return emailQueue;
      case 'sms': return smsQueue;
      default: throw new Error(`Unknown queue: ${name}`);
    }
  }
}

// Export singleton instance
export const workflowQueueMonitor = new WorkflowQueueMonitor();