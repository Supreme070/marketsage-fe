import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WorkflowAnalyticsService } from './workflow-analytics.service';

export interface WorkflowAlert {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  workflowId?: string;
  workflowName?: string;
  organizationId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  workflowId?: string; // If null, applies to all workflows
  ruleType: 'FAILURE_RATE' | 'EXECUTION_TIME' | 'QUEUE_SIZE' | 'SUCCESS_RATE' | 'CUSTOM';
  conditions: {
    metric: string;
    operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'NOT_EQUALS';
    threshold: number;
    timeWindow: number; // minutes
  };
  actions: {
    type: 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'SMS';
    config: Record<string, any>;
  }[];
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  components: {
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED';
    responseTime?: number;
    lastCheck: string;
    details?: Record<string, any>;
  }[];
  overallScore: number; // 0-100
  lastUpdated: string;
}

export interface WorkflowStatus {
  workflowId: string;
  workflowName: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR';
  activeExecutions: number;
  queuedExecutions: number;
  lastExecution?: string;
  lastError?: {
    message: string;
    timestamp: string;
    nodeId?: string;
  };
  healthScore: number; // 0-100
}

export interface PerformanceMetrics {
  timestamp: string;
  metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgExecutionTime: number;
    queueSize: number;
    activeWorkflows: number;
    systemLoad: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
}

@Injectable()
export class WorkflowMonitoringService {
  private readonly logger = new Logger(WorkflowMonitoringService.name);
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly analyticsService: WorkflowAnalyticsService,
  ) {
    this.startMonitoring();
  }

  async createMonitoringRule(
    rule: Omit<MonitoringRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>,
  ): Promise<MonitoringRule> {
    const monitoringRule: MonitoringRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `monitoring_rule:${monitoringRule.id}`,
      JSON.stringify(monitoringRule),
      3600 * 24 * 30, // 30 days
    );

    // Add to organization's rules list
    await this.redis.sadd(
      `monitoring_rules:${rule.organizationId}`,
      monitoringRule.id,
    );

    this.logger.log(`Created monitoring rule: ${monitoringRule.name}`);
    return monitoringRule;
  }

  async updateMonitoringRule(
    ruleId: string,
    updates: Partial<MonitoringRule>,
  ): Promise<MonitoringRule> {
    const existingRule = await this.getMonitoringRule(ruleId);
    if (!existingRule) {
      throw new Error('Monitoring rule not found');
    }

    const updatedRule: MonitoringRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `monitoring_rule:${ruleId}`,
      JSON.stringify(updatedRule),
      3600 * 24 * 30,
    );

    return updatedRule;
  }

  async deleteMonitoringRule(ruleId: string, organizationId: string): Promise<void> {
    await this.redis.del(`monitoring_rule:${ruleId}`);
    await this.redis.srem(`monitoring_rules:${organizationId}`, ruleId);
    this.logger.log(`Deleted monitoring rule: ${ruleId}`);
  }

  async getMonitoringRules(organizationId: string): Promise<MonitoringRule[]> {
    const ruleIds = await this.redis.smembers(`monitoring_rules:${organizationId}`);
    const rules: MonitoringRule[] = [];

    for (const ruleId of ruleIds) {
      const rule = await this.getMonitoringRule(ruleId);
      if (rule) {
        rules.push(rule);
      }
    }

    return rules;
  }

  async createAlert(alert: Omit<WorkflowAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<WorkflowAlert> {
    const workflowAlert: WorkflowAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    // Store alert
    await this.redis.set(
      `alert:${workflowAlert.id}`,
      JSON.stringify(workflowAlert),
      3600 * 24 * 7, // 7 days
    );

    // Add to organization's alerts list
    await this.redis.lpush(
      `alerts:${alert.organizationId}`,
      workflowAlert.id,
    );

    // Keep only last 1000 alerts
    await this.redis.ltrim(`alerts:${alert.organizationId}`, 0, 999);

    // Trigger alert actions based on severity
    await this.processAlertActions(workflowAlert);

    this.logger.warn(`Alert created: ${workflowAlert.title} (${workflowAlert.severity})`);
    return workflowAlert;
  }

  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<WorkflowAlert> {
    const alert = await this.getAlert(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    const updatedAlert: WorkflowAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `alert:${alertId}`,
      JSON.stringify(updatedAlert),
      3600 * 24 * 7,
    );

    this.logger.log(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    return updatedAlert;
  }

  async getAlerts(
    organizationId: string,
    options: {
      acknowledged?: boolean;
      severity?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<WorkflowAlert[]> {
    const alertIds = await this.redis.lrange(
      `alerts:${organizationId}`,
      options.offset || 0,
      (options.offset || 0) + (options.limit || 50) - 1,
    );

    const alerts: WorkflowAlert[] = [];
    for (const alertId of alertIds) {
      const alert = await this.getAlert(alertId);
      if (alert) {
        // Apply filters
        if (options.acknowledged !== undefined && alert.acknowledged !== options.acknowledged) {
          continue;
        }
        if (options.severity && alert.severity !== options.severity) {
          continue;
        }
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const components = [
      {
        name: 'Redis Cache',
        status: await this.checkRedisHealth(),
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Queue Service',
        status: await this.checkQueueHealth(),
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Workflow Engine',
        status: await this.checkWorkflowEngineHealth(),
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Analytics Service',
        status: await this.checkAnalyticsHealth(),
        lastCheck: new Date().toISOString(),
      },
    ];

    const healthyComponents = components.filter(c => c.status === 'UP').length;
    const overallScore = (healthyComponents / components.length) * 100;

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (overallScore < 50) {
      status = 'CRITICAL';
    } else if (overallScore < 80) {
      status = 'WARNING';
    }

    return {
      status,
      components,
      overallScore,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getWorkflowStatuses(organizationId: string): Promise<WorkflowStatus[]> {
    // Mock workflow statuses - in production, this would query actual workflow states
    const statuses: WorkflowStatus[] = [
      {
        workflowId: 'workflow_1',
        workflowName: 'Welcome Email Series',
        status: 'RUNNING',
        activeExecutions: 12,
        queuedExecutions: 45,
        lastExecution: new Date(Date.now() - 300000).toISOString(),
        healthScore: 96,
      },
      {
        workflowId: 'workflow_2',
        workflowName: 'Cart Abandonment Recovery',
        status: 'RUNNING',
        activeExecutions: 8,
        queuedExecutions: 23,
        lastExecution: new Date(Date.now() - 180000).toISOString(),
        healthScore: 94,
      },
      {
        workflowId: 'workflow_3',
        workflowName: 'Newsletter Campaign',
        status: 'ERROR',
        activeExecutions: 0,
        queuedExecutions: 0,
        lastExecution: new Date(Date.now() - 3600000).toISOString(),
        lastError: {
          message: 'Email template not found',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          nodeId: 'node_email_1',
        },
        healthScore: 45,
      },
    ];

    return statuses;
  }

  async getPerformanceMetrics(
    organizationId: string,
    timeRange: string = '24h',
  ): Promise<PerformanceMetrics[]> {
    const cacheKey = `performance_metrics:${organizationId}:${timeRange}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Generate mock performance metrics over time
    const metrics: PerformanceMetrics[] = [];
    const now = Date.now();
    const intervalMs = timeRange === '24h' ? 3600000 : timeRange === '7d' ? 3600000 * 24 : 3600000; // 1 hour intervals
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now - (i * intervalMs)).toISOString();
      
      metrics.push({
        timestamp,
        metrics: {
          totalExecutions: Math.floor(Math.random() * 500) + 100,
          successfulExecutions: Math.floor(Math.random() * 450) + 90,
          failedExecutions: Math.floor(Math.random() * 50) + 5,
          avgExecutionTime: Math.floor(Math.random() * 10000) + 15000,
          queueSize: Math.floor(Math.random() * 200) + 50,
          activeWorkflows: Math.floor(Math.random() * 20) + 25,
          systemLoad: {
            cpu: Math.random() * 40 + 30, // 30-70%
            memory: Math.random() * 30 + 50, // 50-80%
            disk: Math.random() * 20 + 20, // 20-40%
            network: Math.random() * 50 + 10, // 10-60%
          },
        },
      });
    }

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(metrics), 300);
    return metrics;
  }

  async pauseWorkflow(workflowId: string, organizationId: string): Promise<void> {
    // Mock implementation - in production, this would interact with workflow engine
    await this.redis.set(
      `workflow_status:${workflowId}`,
      JSON.stringify({
        status: 'PAUSED',
        pausedAt: new Date().toISOString(),
        pausedBy: 'monitoring_service',
      }),
      3600 * 24, // 24 hours
    );

    await this.createAlert({
      type: 'WARNING',
      title: 'Workflow Paused',
      message: `Workflow ${workflowId} has been automatically paused due to monitoring rule`,
      workflowId,
      organizationId,
      severity: 'MEDIUM',
      metadata: { action: 'auto_pause', trigger: 'monitoring_rule' },
    });

    this.logger.warn(`Workflow ${workflowId} paused by monitoring service`);
  }

  async resumeWorkflow(workflowId: string, organizationId: string): Promise<void> {
    await this.redis.set(
      `workflow_status:${workflowId}`,
      JSON.stringify({
        status: 'RUNNING',
        resumedAt: new Date().toISOString(),
        resumedBy: 'monitoring_service',
      }),
      3600 * 24,
    );

    await this.createAlert({
      type: 'INFO',
      title: 'Workflow Resumed',
      message: `Workflow ${workflowId} has been resumed`,
      workflowId,
      organizationId,
      severity: 'LOW',
      metadata: { action: 'resume', trigger: 'manual' },
    });

    this.logger.log(`Workflow ${workflowId} resumed`);
  }

  private startMonitoring(): void {
    // Run monitoring checks every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runMonitoringChecks();
      } catch (error) {
        this.logger.error(`Monitoring check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 5 * 60 * 1000);

    this.logger.log('Workflow monitoring service started');
  }

  private async runMonitoringChecks(): Promise<void> {
    // Get all organizations with monitoring rules
    const organizationIds = await this.getOrganizationsWithRules();

    for (const orgId of organizationIds) {
      const rules = await this.getMonitoringRules(orgId);
      
      for (const rule of rules) {
        if (rule.isActive) {
          await this.evaluateRule(rule);
        }
      }
    }
  }

  private async getOrganizationsWithRules(): Promise<string[]> {
    // Mock implementation - would query database in production
    return ['org_1', 'org_2', 'org_3'];
  }

  private async evaluateRule(rule: MonitoringRule): Promise<void> {
    try {
      const shouldTrigger = await this.checkRuleCondition(rule);
      
      if (shouldTrigger) {
        // Update trigger count and last triggered
        await this.updateMonitoringRule(rule.id, {
          lastTriggered: new Date().toISOString(),
          triggerCount: rule.triggerCount + 1,
        });

        // Create alert
        await this.createAlert({
          type: this.mapSeverityToType(rule.conditions.threshold),
          title: `Monitoring Rule Triggered: ${rule.name}`,
          message: `Rule "${rule.name}" has been triggered. ${rule.conditions.metric} ${rule.conditions.operator} ${rule.conditions.threshold}`,
          workflowId: rule.workflowId,
          organizationId: rule.organizationId,
          severity: this.calculateSeverity(rule),
          metadata: {
            ruleId: rule.id,
            metric: rule.conditions.metric,
            threshold: rule.conditions.threshold,
            timeWindow: rule.conditions.timeWindow,
          },
        });

        // Execute rule actions
        await this.executeRuleActions(rule);
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkRuleCondition(rule: MonitoringRule): Promise<boolean> {
    // Mock rule evaluation - in production, this would query real metrics
    const mockMetricValue = Math.random() * 100;
    
    switch (rule.conditions.operator) {
      case 'GREATER_THAN':
        return mockMetricValue > rule.conditions.threshold;
      case 'LESS_THAN':
        return mockMetricValue < rule.conditions.threshold;
      case 'EQUALS':
        return Math.abs(mockMetricValue - rule.conditions.threshold) < 0.01;
      case 'NOT_EQUALS':
        return Math.abs(mockMetricValue - rule.conditions.threshold) >= 0.01;
      default:
        return false;
    }
  }

  private async executeRuleActions(rule: MonitoringRule): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'EMAIL':
            await this.sendEmailAlert(rule, action.config);
            break;
          case 'WEBHOOK':
            await this.sendWebhookAlert(rule, action.config);
            break;
          case 'SLACK':
            await this.sendSlackAlert(rule, action.config);
            break;
          case 'SMS':
            await this.sendSmsAlert(rule, action.config);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to execute action ${action.type} for rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async processAlertActions(alert: WorkflowAlert): Promise<void> {
    // Process immediate alert actions based on severity
    if (alert.severity === 'CRITICAL') {
      // Auto-pause workflow if critical error
      if (alert.workflowId) {
        await this.pauseWorkflow(alert.workflowId, alert.organizationId);
      }
    }
  }

  // Health check methods
  private async checkRedisHealth(): Promise<'UP' | 'DOWN' | 'DEGRADED'> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      return responseTime > 1000 ? 'DEGRADED' : 'UP';
    } catch {
      return 'DOWN';
    }
  }

  private async checkQueueHealth(): Promise<'UP' | 'DOWN' | 'DEGRADED'> {
    try {
      // Mock queue health check
      const queueSize = Math.floor(Math.random() * 1000);
      return queueSize > 500 ? 'DEGRADED' : 'UP';
    } catch {
      return 'DOWN';
    }
  }

  private async checkWorkflowEngineHealth(): Promise<'UP' | 'DOWN' | 'DEGRADED'> {
    try {
      // Mock workflow engine health check
      return 'UP';
    } catch {
      return 'DOWN';
    }
  }

  private async checkAnalyticsHealth(): Promise<'UP' | 'DOWN' | 'DEGRADED'> {
    try {
      // Mock analytics service health check
      return 'UP';
    } catch {
      return 'DOWN';
    }
  }

  // Utility methods
  private async getMonitoringRule(ruleId: string): Promise<MonitoringRule | null> {
    const cached = await this.redis.get(`monitoring_rule:${ruleId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async getAlert(alertId: string): Promise<WorkflowAlert | null> {
    const cached = await this.redis.get(`alert:${alertId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private mapSeverityToType(threshold: number): 'ERROR' | 'WARNING' | 'INFO' {
    return threshold > 80 ? 'ERROR' : threshold > 50 ? 'WARNING' : 'INFO';
  }

  private calculateSeverity(rule: MonitoringRule): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (rule.ruleType === 'FAILURE_RATE' && rule.conditions.threshold > 50) {
      return 'CRITICAL';
    }
    if (rule.conditions.threshold > 80) {
      return 'HIGH';
    }
    if (rule.conditions.threshold > 50) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private async sendEmailAlert(rule: MonitoringRule, config: Record<string, any>): Promise<void> {
    this.logger.log(`Sending email alert for rule: ${rule.name}`);
    // Implementation would integrate with email service
  }

  private async sendWebhookAlert(rule: MonitoringRule, config: Record<string, any>): Promise<void> {
    this.logger.log(`Sending webhook alert for rule: ${rule.name}`);
    // Implementation would make HTTP request to webhook URL
  }

  private async sendSlackAlert(rule: MonitoringRule, config: Record<string, any>): Promise<void> {
    this.logger.log(`Sending Slack alert for rule: ${rule.name}`);
    // Implementation would integrate with Slack API
  }

  private async sendSmsAlert(rule: MonitoringRule, config: Record<string, any>): Promise<void> {
    this.logger.log(`Sending SMS alert for rule: ${rule.name}`);
    // Implementation would integrate with SMS service
  }

  onModuleDestroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.logger.log('Workflow monitoring service stopped');
    }
  }
}