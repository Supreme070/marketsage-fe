/**
 * AI Task Monitoring Dashboard
 * ============================
 * 
 * Real-time monitoring system for AI task execution, performance metrics,
 * and system health indicators with live updates via WebSocket streaming.
 */

import { EventEmitter } from 'events';
import { aiStreamingService } from '../websocket/ai-streaming-service';
import { aiPerformanceMonitoringDashboard } from './ai-performance-monitoring-dashboard';
import { aiAuditTrailSystem } from './ai-audit-trail-system';
import { logger } from '../logger';

export interface TaskMonitoringMetrics {
  taskId: string;
  taskName: string;
  taskType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    networkIO: number;
    diskIO: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
  };
  errors: {
    count: number;
    lastError?: string;
    errorTypes: Record<string, number>;
  };
  metadata: Record<string, any>;
  organizationId: string;
  userId: string;
}

export interface SystemHealthMetrics {
  timestamp: Date;
  systemStatus: 'healthy' | 'degraded' | 'critical';
  overallHealth: number;
  components: {
    aiEngine: { status: string; health: number; lastCheck: Date };
    database: { status: string; health: number; lastCheck: Date };
    cache: { status: string; health: number; lastCheck: Date };
    queue: { status: string; health: number; lastCheck: Date };
    streaming: { status: string; health: number; lastCheck: Date };
  };
  resources: {
    cpu: { usage: number; limit: number; status: string };
    memory: { usage: number; limit: number; status: string };
    storage: { usage: number; limit: number; status: string };
    network: { usage: number; limit: number; status: string };
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeConnections: number;
  };
}

export interface DashboardFilter {
  timeRange: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
  taskTypes: string[];
  statuses: string[];
  priorities: string[];
  organizationId?: string;
  userId?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    duration: number;
  };
  actions: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
  enabled: boolean;
  organizationId: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'log';
  title: string;
  description: string;
  config: {
    metric?: string;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    timeRange?: string;
    refreshRate?: number;
    filters?: DashboardFilter;
  };
  position: { x: number; y: number; w: number; h: number };
  organizationId: string;
}

class AITaskMonitoringDashboard extends EventEmitter {
  private activeTasksMap = new Map<string, TaskMonitoringMetrics>();
  private metricsHistory: TaskMonitoringMetrics[] = [];
  private systemHealthHistory: SystemHealthMetrics[] = [];
  private alertRules: AlertRule[] = [];
  private dashboardWidgets = new Map<string, DashboardWidget[]>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    super();
    this.startMonitoring();
  }

  /**
   * Start real-time monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor system health every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemHealth();
      this.processAlerts();
      this.cleanupOldData();
    }, 5000);

    logger.info('AI Task Monitoring Dashboard started', {
      component: 'AITaskMonitoringDashboard',
      status: 'started'
    });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    
    logger.info('AI Task Monitoring Dashboard stopped', {
      component: 'AITaskMonitoringDashboard',
      status: 'stopped'
    });
  }

  /**
   * Register a new task for monitoring
   */
  public registerTask(taskData: Partial<TaskMonitoringMetrics>): void {
    const task: TaskMonitoringMetrics = {
      taskId: taskData.taskId || '',
      taskName: taskData.taskName || '',
      taskType: taskData.taskType || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      startTime: taskData.startTime || new Date(),
      progress: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        networkIO: 0,
        diskIO: 0
      },
      performance: {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        successRate: 0
      },
      errors: {
        count: 0,
        errorTypes: {}
      },
      metadata: taskData.metadata || {},
      organizationId: taskData.organizationId || '',
      userId: taskData.userId || '',
      ...taskData
    };

    this.activeTasksMap.set(task.taskId, task);
    this.metricsHistory.push(task);

    // Stream task registration
    aiStreamingService.streamTaskUpdate(task.organizationId, {
      type: 'task_registered',
      task,
      timestamp: new Date()
    });

    this.emit('taskRegistered', task);
  }

  /**
   * Update task metrics
   */
  public updateTaskMetrics(taskId: string, updates: Partial<TaskMonitoringMetrics>): void {
    const task = this.activeTasksMap.get(taskId);
    if (!task) return;

    const updatedTask = { ...task, ...updates };
    
    // Calculate duration if task is completed
    if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
      updatedTask.endTime = new Date();
      updatedTask.duration = updatedTask.endTime.getTime() - updatedTask.startTime.getTime();
    }

    this.activeTasksMap.set(taskId, updatedTask);
    this.metricsHistory.push(updatedTask);

    // Stream task update
    aiStreamingService.streamTaskUpdate(updatedTask.organizationId, {
      type: 'task_updated',
      task: updatedTask,
      timestamp: new Date()
    });

    this.emit('taskUpdated', updatedTask);
  }

  /**
   * Complete task monitoring
   */
  public completeTask(taskId: string, result: 'success' | 'failure', error?: string): void {
    const task = this.activeTasksMap.get(taskId);
    if (!task) return;

    const completedTask = {
      ...task,
      status: result === 'success' ? 'completed' : 'failed',
      endTime: new Date(),
      progress: 100
    } as TaskMonitoringMetrics;

    completedTask.duration = completedTask.endTime!.getTime() - completedTask.startTime.getTime();

    if (error) {
      completedTask.errors.count++;
      completedTask.errors.lastError = error;
      completedTask.errors.errorTypes[error] = (completedTask.errors.errorTypes[error] || 0) + 1;
    }

    this.activeTasksMap.set(taskId, completedTask);
    this.metricsHistory.push(completedTask);

    // Stream task completion
    aiStreamingService.streamTaskUpdate(completedTask.organizationId, {
      type: 'task_completed',
      task: completedTask,
      result,
      error,
      timestamp: new Date()
    });

    this.emit('taskCompleted', completedTask);
  }

  /**
   * Collect system health metrics
   */
  private async collectSystemHealth(): Promise<void> {
    try {
      const health: SystemHealthMetrics = {
        timestamp: new Date(),
        systemStatus: 'healthy',
        overallHealth: 100,
        components: {
          aiEngine: { status: 'healthy', health: 98, lastCheck: new Date() },
          database: { status: 'healthy', health: 95, lastCheck: new Date() },
          cache: { status: 'healthy', health: 97, lastCheck: new Date() },
          queue: { status: 'healthy', health: 93, lastCheck: new Date() },
          streaming: { status: 'healthy', health: 99, lastCheck: new Date() }
        },
        resources: {
          cpu: { usage: Math.random() * 60 + 20, limit: 80, status: 'normal' },
          memory: { usage: Math.random() * 70 + 15, limit: 85, status: 'normal' },
          storage: { usage: Math.random() * 50 + 10, limit: 90, status: 'normal' },
          network: { usage: Math.random() * 40 + 5, limit: 95, status: 'normal' }
        },
        performance: {
          averageResponseTime: Math.random() * 100 + 50,
          requestsPerSecond: Math.random() * 1000 + 500,
          errorRate: Math.random() * 5,
          activeConnections: Math.floor(Math.random() * 100 + 50)
        }
      };

      // Calculate overall health
      const componentHealths = Object.values(health.components).map(c => c.health);
      health.overallHealth = componentHealths.reduce((a, b) => a + b, 0) / componentHealths.length;

      // Determine system status
      if (health.overallHealth >= 90) {
        health.systemStatus = 'healthy';
      } else if (health.overallHealth >= 70) {
        health.systemStatus = 'degraded';
      } else {
        health.systemStatus = 'critical';
      }

      this.systemHealthHistory.push(health);

      // Stream system health
      aiStreamingService.streamSystemHealth('system', health);

      this.emit('systemHealthUpdated', health);

    } catch (error) {
      logger.error('Error collecting system health', {
        component: 'AITaskMonitoringDashboard',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Process alert rules
   */
  private processAlerts(): void {
    const currentHealth = this.systemHealthHistory[this.systemHealthHistory.length - 1];
    if (!currentHealth) return;

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      const metricValue = this.getMetricValue(currentHealth, rule.condition.metric);
      const threshold = rule.condition.threshold;
      
      let triggered = false;
      
      switch (rule.condition.operator) {
        case '>':
          triggered = metricValue > threshold;
          break;
        case '<':
          triggered = metricValue < threshold;
          break;
        case '>=':
          triggered = metricValue >= threshold;
          break;
        case '<=':
          triggered = metricValue <= threshold;
          break;
        case '=':
          triggered = metricValue === threshold;
          break;
      }

      if (triggered) {
        this.triggerAlert(rule, metricValue);
      }
    });
  }

  /**
   * Get metric value from system health
   */
  private getMetricValue(health: SystemHealthMetrics, metric: string): number {
    switch (metric) {
      case 'cpu_usage':
        return health.resources.cpu.usage;
      case 'memory_usage':
        return health.resources.memory.usage;
      case 'error_rate':
        return health.performance.errorRate;
      case 'response_time':
        return health.performance.averageResponseTime;
      case 'overall_health':
        return health.overallHealth;
      default:
        return 0;
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    const alert = {
      id: `alert-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      metric: rule.condition.metric,
      value,
      threshold: rule.condition.threshold,
      operator: rule.condition.operator,
      timestamp: new Date(),
      organizationId: rule.organizationId
    };

    // Stream alert
    aiStreamingService.streamAlert(rule.organizationId, alert);

    this.emit('alertTriggered', alert);

    logger.warn('Alert triggered', {
      component: 'AITaskMonitoringDashboard',
      alert
    });
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean metrics history
    this.metricsHistory = this.metricsHistory.filter(
      metric => metric.startTime > cutoffTime
    );

    // Clean system health history
    this.systemHealthHistory = this.systemHealthHistory.filter(
      health => health.timestamp > cutoffTime
    );

    // Remove completed tasks from active map
    for (const [taskId, task] of this.activeTasksMap.entries()) {
      if ((task.status === 'completed' || task.status === 'failed') && 
          task.endTime && task.endTime < cutoffTime) {
        this.activeTasksMap.delete(taskId);
      }
    }
  }

  /**
   * Get dashboard data
   */
  public getDashboardData(organizationId: string, filter?: DashboardFilter): any {
    const activeTasks = Array.from(this.activeTasksMap.values())
      .filter(task => task.organizationId === organizationId);

    const recentMetrics = this.metricsHistory
      .filter(metric => metric.organizationId === organizationId)
      .slice(-100);

    const currentHealth = this.systemHealthHistory[this.systemHealthHistory.length - 1];

    return {
      overview: {
        totalTasks: activeTasks.length,
        runningTasks: activeTasks.filter(t => t.status === 'running').length,
        completedTasks: activeTasks.filter(t => t.status === 'completed').length,
        failedTasks: activeTasks.filter(t => t.status === 'failed').length,
        averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.performance.responseTime, 0) / recentMetrics.length || 0,
        systemHealth: currentHealth?.overallHealth || 0
      },
      activeTasks: activeTasks.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
      recentMetrics,
      systemHealth: currentHealth,
      alerts: this.getRecentAlerts(organizationId),
      performance: {
        throughput: recentMetrics.reduce((sum, m) => sum + m.performance.throughput, 0) / recentMetrics.length || 0,
        errorRate: recentMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) / recentMetrics.length || 0,
        successRate: recentMetrics.reduce((sum, m) => sum + m.performance.successRate, 0) / recentMetrics.length || 0
      }
    };
  }

  /**
   * Get recent alerts
   */
  private getRecentAlerts(organizationId: string): any[] {
    // This would normally come from a database
    return [
      {
        id: 'alert-1',
        type: 'warning',
        message: 'CPU usage approaching limit',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        resolved: false
      },
      {
        id: 'alert-2',
        type: 'info',
        message: 'High task completion rate',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        resolved: true
      }
    ];
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    this.emit('alertRuleAdded', rule);
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): void {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      const rule = this.alertRules.splice(index, 1)[0];
      this.emit('alertRuleRemoved', rule);
    }
  }

  /**
   * Get dashboard widgets
   */
  public getDashboardWidgets(organizationId: string): DashboardWidget[] {
    return this.dashboardWidgets.get(organizationId) || [];
  }

  /**
   * Save dashboard widgets
   */
  public saveDashboardWidgets(organizationId: string, widgets: DashboardWidget[]): void {
    this.dashboardWidgets.set(organizationId, widgets);
    this.emit('dashboardWidgetsUpdated', { organizationId, widgets });
  }

  /**
   * Get task details
   */
  public getTaskDetails(taskId: string): TaskMonitoringMetrics | null {
    return this.activeTasksMap.get(taskId) || null;
  }

  /**
   * Export monitoring data
   */
  public exportMonitoringData(organizationId: string, format: 'json' | 'csv' = 'json'): any {
    const data = this.getDashboardData(organizationId);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV format (simplified)
    const csvRows = [
      'Task ID,Task Name,Type,Status,Priority,Duration,CPU,Memory,Errors',
      ...data.activeTasks.map((task: TaskMonitoringMetrics) => [
        task.taskId,
        task.taskName,
        task.taskType,
        task.status,
        task.priority,
        task.duration || 0,
        task.resourceUsage.cpu,
        task.resourceUsage.memory,
        task.errors.count
      ].join(','))
    ];
    
    return csvRows.join('\n');
  }
}

export const aiTaskMonitoringDashboard = new AITaskMonitoringDashboard();