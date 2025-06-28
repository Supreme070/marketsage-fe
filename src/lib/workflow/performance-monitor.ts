/**
 * Advanced Workflow Performance Monitoring System
 * Real-time metrics collection, analysis, and alerting
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { SimpleCache } from '@/lib/utils/simple-cache';
import Redis from 'ioredis';

// Performance metrics interfaces
interface WorkflowPerformanceMetrics {
  workflowId: string;
  timestamp: Date;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
  throughput: number; // executions per minute
  errorRate: number;
  avgStepTime: number;
  nodeBottlenecks: NodeBottleneck[];
}

interface NodeBottleneck {
  nodeId: string;
  nodeType: string;
  avgExecutionTime: number;
  errorCount: number;
  bottleneckScore: number; // 0-100
}

interface SystemHealthMetrics {
  timestamp: Date;
  queueDepth: number;
  activeExecutions: number;
  completedLastHour: number;
  failedLastHour: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  redisConnections: number;
  databaseConnections: number;
}

interface PerformanceAlert {
  id: string;
  workflowId?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

enum AlertType {
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  SLOW_EXECUTION = 'SLOW_EXECUTION',
  MEMORY_LEAK = 'MEMORY_LEAK',
  QUEUE_BACKUP = 'QUEUE_BACKUP',
  NODE_BOTTLENECK = 'NODE_BOTTLENECK',
  SYSTEM_OVERLOAD = 'SYSTEM_OVERLOAD',
}

enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Performance data caches
const metricsCache = new SimpleCache({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

const systemHealthCache = new SimpleCache({
  max: 100,
  ttl: 1000 * 30, // 30 seconds
});

const alertsCache = new SimpleCache({
  max: 50,
  ttl: 1000 * 60, // 1 minute
});

export class WorkflowPerformanceMonitor {
  private redis: Redis;
  private alertThresholds: Map<AlertType, number>;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timer;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    this.alertThresholds = new Map([
      [AlertType.HIGH_ERROR_RATE, 0.05], // 5% error rate
      [AlertType.SLOW_EXECUTION, 30000], // 30 seconds
      [AlertType.MEMORY_LEAK, 0.8], // 80% memory usage
      [AlertType.QUEUE_BACKUP, 100], // 100 jobs in queue
      [AlertType.NODE_BOTTLENECK, 10000], // 10 second node execution
      [AlertType.SYSTEM_OVERLOAD, 0.9], // 90% system load
    ]);
  }

  /**
   * Start real-time performance monitoring
   */
  async startMonitoring(intervalMs = 30000): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already running');
      return;
    }

    this.isMonitoring = true;
    
    logger.info('Starting workflow performance monitoring', { intervalMs });

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.analyzeWorkflowPerformance();
        await this.detectBottlenecks();
        await this.checkAlertConditions();
      } catch (error) {
        logger.error('Performance monitoring cycle failed', { error });
      }
    }, intervalMs);

    // Initial collection
    await this.collectSystemMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info('Performance monitoring stopped');
  }

  /**
   * Collect system-wide performance metrics
   */
  async collectSystemMetrics(): Promise<SystemHealthMetrics> {
    try {
      const cacheKey = `system_health_${Math.floor(Date.now() / 30000)}`;
      const cached = systemHealthCache.get(cacheKey);
      if (cached) return cached;

      const [
        queueStats,
        activeExecutions,
        recentExecutions,
        systemStats
      ] = await Promise.all([
        this.getQueueStatistics(),
        this.getActiveExecutionsCount(),
        this.getRecentExecutionsStats(),
        this.getSystemResourceStats(),
      ]);

      const metrics: SystemHealthMetrics = {
        timestamp: new Date(),
        queueDepth: queueStats.waiting + queueStats.delayed,
        activeExecutions: activeExecutions,
        completedLastHour: recentExecutions.completed,
        failedLastHour: recentExecutions.failed,
        avgResponseTime: recentExecutions.avgTime,
        memoryUsage: systemStats.memoryUsage,
        cpuUsage: systemStats.cpuUsage,
        diskUsage: systemStats.diskUsage,
        redisConnections: queueStats.redisConnections,
        databaseConnections: systemStats.dbConnections,
      };

      // Cache and store metrics
      systemHealthCache.set(cacheKey, metrics);
      await this.storeSystemMetrics(metrics);

      logger.info('System metrics collected', {
        queueDepth: metrics.queueDepth,
        activeExecutions: metrics.activeExecutions,
        memoryUsage: metrics.memoryUsage,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
      throw error;
    }
  }

  /**
   * Analyze individual workflow performance
   */
  async analyzeWorkflowPerformance(): Promise<WorkflowPerformanceMetrics[]> {
    try {
      const activeWorkflows = await this.getActiveWorkflows();
      const metrics: WorkflowPerformanceMetrics[] = [];

      for (const workflowId of activeWorkflows) {
        const cacheKey = `workflow_perf_${workflowId}_${Math.floor(Date.now() / 60000)}`;
        let workflowMetrics = metricsCache.get(cacheKey);

        if (!workflowMetrics) {
          workflowMetrics = await this.calculateWorkflowMetrics(workflowId);
          metricsCache.set(cacheKey, workflowMetrics);
        }

        metrics.push(workflowMetrics);
        await this.storeWorkflowMetrics(workflowMetrics);
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to analyze workflow performance', { error });
      return [];
    }
  }

  /**
   * Calculate detailed metrics for a specific workflow
   */
  private async calculateWorkflowMetrics(workflowId: string): Promise<WorkflowPerformanceMetrics> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get recent executions with detailed timing
    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId,
        createdAt: { gte: oneHourAgo },
      },
      include: {
        steps: {
          select: {
            stepId: true,
            nodeType: true,
            status: true,
            executionDuration: true,
            errorMessage: true,
          },
        },
      },
    });

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === 'COMPLETED').length;
    const failedExecutions = executions.filter(e => e.status === 'FAILED').length;

    // Calculate execution times
    const executionTimes = executions
      .filter(e => e.completedAt && e.startedAt)
      .map(e => e.completedAt!.getTime() - e.startedAt.getTime());

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    // Calculate step metrics
    const allSteps = executions.flatMap(e => e.steps);
    const avgStepTime = allSteps.length > 0
      ? allSteps.reduce((sum, step) => sum + (step.executionDuration || 0), 0) / allSteps.length
      : 0;

    // Find bottlenecks
    const nodeBottlenecks = this.identifyNodeBottlenecks(allSteps);

    // Calculate throughput (executions per minute)
    const throughput = totalExecutions / 60;

    return {
      workflowId,
      timestamp: new Date(),
      executionTime: avgExecutionTime,
      memoryUsage: await this.getWorkflowMemoryUsage(workflowId),
      cpuUsage: 0, // Would need system integration
      successRate: totalExecutions > 0 ? completedExecutions / totalExecutions : 0,
      throughput,
      errorRate: totalExecutions > 0 ? failedExecutions / totalExecutions : 0,
      avgStepTime,
      nodeBottlenecks,
    };
  }

  /**
   * Identify performance bottlenecks at the node level
   */
  private identifyNodeBottlenecks(steps: any[]): NodeBottleneck[] {
    const nodeStats = new Map<string, {
      totalTime: number;
      executionCount: number;
      errorCount: number;
      nodeType: string;
    }>();

    // Aggregate step statistics
    steps.forEach(step => {
      const key = step.stepId;
      const existing = nodeStats.get(key) || {
        totalTime: 0,
        executionCount: 0,
        errorCount: 0,
        nodeType: step.nodeType,
      };

      existing.totalTime += step.executionDuration || 0;
      existing.executionCount += 1;
      if (step.status === 'FAILED') {
        existing.errorCount += 1;
      }

      nodeStats.set(key, existing);
    });

    // Calculate bottleneck scores and identify problematic nodes
    const bottlenecks: NodeBottleneck[] = [];

    nodeStats.forEach((stats, nodeId) => {
      const avgExecutionTime = stats.totalTime / stats.executionCount;
      const errorRate = stats.errorCount / stats.executionCount;
      
      // Bottleneck score: combination of execution time and error rate
      const timeScore = Math.min(avgExecutionTime / 1000, 10) * 10; // Normalize to 0-100
      const errorScore = errorRate * 100;
      const bottleneckScore = (timeScore * 0.7) + (errorScore * 0.3);

      if (bottleneckScore > 30 || avgExecutionTime > 5000) { // 5 second threshold
        bottlenecks.push({
          nodeId,
          nodeType: stats.nodeType,
          avgExecutionTime,
          errorCount: stats.errorCount,
          bottleneckScore,
        });
      }
    });

    return bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  /**
   * Detect system bottlenecks and performance issues
   */
  async detectBottlenecks(): Promise<string[]> {
    try {
      const systemMetrics = await this.collectSystemMetrics();
      const bottlenecks: string[] = [];

      // Check queue depth
      if (systemMetrics.queueDepth > this.alertThresholds.get(AlertType.QUEUE_BACKUP)!) {
        bottlenecks.push(`High queue depth: ${systemMetrics.queueDepth} jobs waiting`);
      }

      // Check memory usage
      if (systemMetrics.memoryUsage > this.alertThresholds.get(AlertType.MEMORY_LEAK)!) {
        bottlenecks.push(`High memory usage: ${Math.round(systemMetrics.memoryUsage * 100)}%`);
      }

      // Check error rate
      const totalRecent = systemMetrics.completedLastHour + systemMetrics.failedLastHour;
      if (totalRecent > 0) {
        const errorRate = systemMetrics.failedLastHour / totalRecent;
        if (errorRate > this.alertThresholds.get(AlertType.HIGH_ERROR_RATE)!) {
          bottlenecks.push(`High error rate: ${Math.round(errorRate * 100)}%`);
        }
      }

      // Check response time
      if (systemMetrics.avgResponseTime > this.alertThresholds.get(AlertType.SLOW_EXECUTION)!) {
        bottlenecks.push(`Slow execution: ${Math.round(systemMetrics.avgResponseTime / 1000)}s average`);
      }

      if (bottlenecks.length > 0) {
        logger.warn('Performance bottlenecks detected', { bottlenecks });
      }

      return bottlenecks;
    } catch (error) {
      logger.error('Failed to detect bottlenecks', { error });
      return [];
    }
  }

  /**
   * Check alert conditions and trigger notifications
   */
  async checkAlertConditions(): Promise<PerformanceAlert[]> {
    try {
      const alerts: PerformanceAlert[] = [];
      const systemMetrics = await this.collectSystemMetrics();

      // System-level alerts
      if (systemMetrics.queueDepth > this.alertThresholds.get(AlertType.QUEUE_BACKUP)!) {
        alerts.push(this.createAlert(
          AlertType.QUEUE_BACKUP,
          AlertSeverity.HIGH,
          `Queue backup detected: ${systemMetrics.queueDepth} jobs waiting`,
          systemMetrics.queueDepth
        ));
      }

      if (systemMetrics.memoryUsage > this.alertThresholds.get(AlertType.MEMORY_LEAK)!) {
        alerts.push(this.createAlert(
          AlertType.MEMORY_LEAK,
          systemMetrics.memoryUsage > 0.95 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          `High memory usage: ${Math.round(systemMetrics.memoryUsage * 100)}%`,
          systemMetrics.memoryUsage
        ));
      }

      // Workflow-specific alerts
      const workflowMetrics = await this.analyzeWorkflowPerformance();
      
      for (const metrics of workflowMetrics) {
        if (metrics.errorRate > this.alertThresholds.get(AlertType.HIGH_ERROR_RATE)!) {
          alerts.push(this.createAlert(
            AlertType.HIGH_ERROR_RATE,
            AlertSeverity.MEDIUM,
            `High error rate in workflow ${metrics.workflowId}: ${Math.round(metrics.errorRate * 100)}%`,
            metrics.errorRate,
            metrics.workflowId
          ));
        }

        if (metrics.executionTime > this.alertThresholds.get(AlertType.SLOW_EXECUTION)!) {
          alerts.push(this.createAlert(
            AlertType.SLOW_EXECUTION,
            AlertSeverity.MEDIUM,
            `Slow execution in workflow ${metrics.workflowId}: ${Math.round(metrics.executionTime / 1000)}s`,
            metrics.executionTime,
            metrics.workflowId
          ));
        }

        // Node bottleneck alerts
        metrics.nodeBottlenecks.forEach(bottleneck => {
          if (bottleneck.bottleneckScore > 70) {
            alerts.push(this.createAlert(
              AlertType.NODE_BOTTLENECK,
              AlertSeverity.MEDIUM,
              `Node bottleneck in workflow ${metrics.workflowId}: ${bottleneck.nodeType} node taking ${Math.round(bottleneck.avgExecutionTime / 1000)}s`,
              bottleneck.bottleneckScore,
              metrics.workflowId
            ));
          }
        });
      }

      // Store and cache alerts
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
        alertsCache.set('current_alerts', alerts);
        
        logger.warn('Performance alerts triggered', { 
          alertCount: alerts.length,
          criticalCount: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length 
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to check alert conditions', { error });
      return [];
    }
  }

  /**
   * Get real-time performance dashboard data
   */
  async getPerformanceDashboard(): Promise<{
    systemHealth: SystemHealthMetrics;
    workflowMetrics: WorkflowPerformanceMetrics[];
    activeAlerts: PerformanceAlert[];
    bottlenecks: string[];
  }> {
    try {
      const [systemHealth, workflowMetrics, bottlenecks] = await Promise.all([
        this.collectSystemMetrics(),
        this.analyzeWorkflowPerformance(),
        this.detectBottlenecks(),
      ]);

      const activeAlerts = alertsCache.get('current_alerts') || [];

      return {
        systemHealth,
        workflowMetrics,
        activeAlerts,
        bottlenecks,
      };
    } catch (error) {
      logger.error('Failed to get performance dashboard', { error });
      throw error;
    }
  }

  // Helper methods
  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    currentValue: number,
    workflowId?: string
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      alertType: type,
      severity,
      message,
      threshold: this.alertThresholds.get(type) || 0,
      currentValue,
      timestamp: new Date(),
      resolved: false,
    };
  }

  private async getQueueStatistics(): Promise<any> {
    try {
      const queueData = await this.redis.eval(`
        local waiting = redis.call('llen', 'bull:workflow:waiting')
        local active = redis.call('llen', 'bull:workflow:active')
        local delayed = redis.call('zcard', 'bull:workflow:delayed')
        local completed = redis.call('llen', 'bull:workflow:completed')
        local failed = redis.call('llen', 'bull:workflow:failed')
        return {waiting, active, delayed, completed, failed}
      `, 0);

      return {
        waiting: queueData[0] || 0,
        active: queueData[1] || 0,
        delayed: queueData[2] || 0,
        completed: queueData[3] || 0,
        failed: queueData[4] || 0,
        redisConnections: await this.redis.client('list'),
      };
    } catch (error) {
      logger.warn('Failed to get queue statistics', { error });
      return { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, redisConnections: 0 };
    }
  }

  private async getActiveExecutionsCount(): Promise<number> {
    try {
      return await prisma.workflowExecution.count({
        where: { status: 'RUNNING' },
      });
    } catch (error) {
      return 0;
    }
  }

  private async getRecentExecutionsStats(): Promise<{
    completed: number;
    failed: number;
    avgTime: number;
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const executions = await prisma.workflowExecution.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
          status: { in: ['COMPLETED', 'FAILED'] },
        },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
        },
      });

      const completed = executions.filter(e => e.status === 'COMPLETED').length;
      const failed = executions.filter(e => e.status === 'FAILED').length;
      
      const times = executions
        .filter(e => e.completedAt && e.startedAt)
        .map(e => e.completedAt!.getTime() - e.startedAt!.getTime());
      
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      return { completed, failed, avgTime };
    } catch (error) {
      return { completed: 0, failed: 0, avgTime: 0 };
    }
  }

  private async getSystemResourceStats(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    dbConnections: number;
  }> {
    try {
      // In a real implementation, you'd integrate with system monitoring tools
      const memoryUsage = process.memoryUsage();
      const totalMemory = 1024 * 1024 * 1024; // 1GB default
      
      return {
        memoryUsage: memoryUsage.heapUsed / totalMemory,
        cpuUsage: process.cpuUsage().system / 1000000, // Convert to percentage
        diskUsage: 0.5, // Would need disk monitoring
        dbConnections: 10, // Would need database pool monitoring
      };
    } catch (error) {
      return { memoryUsage: 0, cpuUsage: 0, diskUsage: 0, dbConnections: 0 };
    }
  }

  private async getActiveWorkflows(): Promise<string[]> {
    try {
      const workflows = await prisma.workflow.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      return workflows.map(w => w.id);
    } catch (error) {
      return [];
    }
  }

  private async getWorkflowMemoryUsage(workflowId: string): Promise<number> {
    // Placeholder - would need actual memory monitoring
    return 0.1;
  }

  private async storeSystemMetrics(metrics: SystemHealthMetrics): Promise<void> {
    try {
      await prisma.workflowQueueMetrics.create({
        data: {
          queueName: 'workflow',
          timestamp: metrics.timestamp,
          waitingJobs: metrics.queueDepth,
          activeJobs: metrics.activeExecutions,
          completedJobs: metrics.completedLastHour,
          failedJobs: metrics.failedLastHour,
          processingRate: metrics.completedLastHour / 60, // per minute
          avgProcessingTime: metrics.avgResponseTime,
          memoryUsageMb: metrics.memoryUsage * 1024, // Convert to MB
        },
      });
    } catch (error) {
      logger.warn('Failed to store system metrics', { error });
    }
  }

  private async storeWorkflowMetrics(metrics: WorkflowPerformanceMetrics): Promise<void> {
    try {
      // Store in workflow analytics cache table
      await prisma.workflowAnalytics.upsert({
        where: {
          workflowId_dateRange_periodStart: {
            workflowId: metrics.workflowId,
            dateRange: 'HOUR',
            periodStart: new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000),
          },
        },
        update: {
          avgCompletionTime: metrics.executionTime,
          errorRate: metrics.errorRate,
          performanceScore: (metrics.successRate * 0.6) + ((1 - metrics.errorRate) * 0.4),
          updatedAt: new Date(),
        },
        create: {
          workflowId: metrics.workflowId,
          dateRange: 'HOUR',
          periodStart: new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000),
          periodEnd: new Date(),
          totalExecutions: Math.round(metrics.throughput * 60), // Convert from per-minute
          completedExecutions: Math.round(metrics.throughput * 60 * metrics.successRate),
          failedExecutions: Math.round(metrics.throughput * 60 * metrics.errorRate),
          avgCompletionTime: metrics.executionTime,
          completionRate: metrics.successRate,
          errorRate: metrics.errorRate,
          performanceScore: (metrics.successRate * 0.6) + ((1 - metrics.errorRate) * 0.4),
        },
      });
    } catch (error) {
      logger.warn('Failed to store workflow metrics', { error, workflowId: metrics.workflowId });
    }
  }

  private async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    try {
      // In a real implementation, you'd store alerts in a dedicated table
      // and potentially send notifications via email, Slack, etc.
      logger.info('Performance alerts generated', { 
        alerts: alerts.map(a => ({ type: a.alertType, severity: a.severity, message: a.message }))
      });
    } catch (error) {
      logger.warn('Failed to store alerts', { error });
    }
  }
}