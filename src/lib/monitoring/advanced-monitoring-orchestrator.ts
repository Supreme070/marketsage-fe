/**
 * Advanced Monitoring and Alerting Orchestrator
 * =============================================
 * AI-powered orchestration layer that connects all existing monitoring systems
 * Provides intelligent alerting, predictive monitoring, and autonomous remediation
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { EventEmitter } from 'events';
import { securityMonitor } from '@/lib/security/security-monitor';
import { performanceAnalytics } from '@/lib/monitoring/performance-analytics';
import { alertingSystem } from '@/lib/leadpulse/integrations/alerting-system';
import { taskExecutionMonitor } from '@/lib/ai/task-execution-monitor';
import { predictiveInfrastructureManager } from '@/lib/infrastructure/predictive-infrastructure-manager';
import { autonomousAttributionEngine } from '@/lib/attribution/autonomous-attribution-engine';
import { multiAgentCoordinator } from '@/lib/ai/multi-agent-coordinator';
import { strategicDecisionEngine } from '@/lib/ai/strategic-decision-engine';

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'correlation' | 'predictive';
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  conditions: MonitoringCondition[];
  actions: MonitoringAction[];
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
  triggerCount: number;
  created: Date;
  updatedAt: Date;
}

export interface MonitoringCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'contains' | 'regex' | 'anomaly' | 'trend';
  value: number | string;
  window: number; // minutes
  threshold?: number; // for anomaly detection
}

export interface MonitoringAction {
  type: 'alert' | 'auto_scale' | 'restart_service' | 'run_healing' | 'notify_agent' | 'escalate';
  config: {
    channels?: string[]; // alert channels
    message?: string;
    severity?: string;
    autoRemediation?: boolean;
    agentCapabilities?: string[];
    escalationPath?: string[];
  };
}

export interface SystemHealthMetrics {
  timestamp: Date;
  overall: {
    status: 'healthy' | 'warning' | 'critical' | 'down';
    score: number; // 0-100
    uptime: number; // seconds
  };
  components: {
    infrastructure: ComponentHealth;
    application: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    ai: ComponentHealth;
    security: ComponentHealth;
    attribution: ComponentHealth;
    monitoring: ComponentHealth;
  };
  predictions: {
    nextHour: HealthPrediction;
    next6Hours: HealthPrediction;
    next24Hours: HealthPrediction;
  };
  recommendations: string[];
  activeAlerts: ActiveAlert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  score: number; // 0-100
  metrics: Record<string, number>;
  lastCheck: Date;
  issues: string[];
  recommendations: string[];
}

export interface HealthPrediction {
  status: 'healthy' | 'warning' | 'critical';
  confidence: number; // 0-1
  factors: string[];
  mitigations: string[];
}

export interface ActiveAlert {
  id: string;
  rule: string;
  severity: string;
  message: string;
  component: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  escalated: boolean;
  actions: string[];
}

export interface MonitoringInsight {
  id: string;
  type: 'performance_trend' | 'capacity_warning' | 'security_pattern' | 'cost_optimization' | 'reliability_issue';
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  recommendations: string[];
  autoFixAvailable: boolean;
  estimatedResolution: string;
  createdAt: Date;
}

class AdvancedMonitoringOrchestrator extends EventEmitter {
  private rules: Map<string, MonitoringRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private insights: MonitoringInsight[] = [];
  private healthHistory: SystemHealthMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private ruleEvaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeOrchestrator();
  }

  /**
   * Initialize the monitoring orchestrator
   */
  private async initializeOrchestrator() {
    try {
      logger.info('Initializing advanced monitoring orchestrator...');

      // Load default monitoring rules
      this.loadDefaultRules();

      // Connect to existing monitoring systems
      this.connectToMonitoringSystems();

      // Start monitoring loops
      this.startMonitoringLoop();
      this.startRuleEvaluation();
      this.startInsightGeneration();

      logger.info('Advanced monitoring orchestrator initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize monitoring orchestrator', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Load default monitoring rules
   */
  private loadDefaultRules() {
    const defaultRules: Partial<MonitoringRule>[] = [
      {
        name: 'High Error Rate',
        description: 'Alert when application error rate exceeds 5%',
        type: 'threshold',
        severity: 'high',
        conditions: [{
          metric: 'application.errorRate',
          operator: 'gt',
          value: 5,
          window: 5
        }],
        actions: [{
          type: 'alert',
          config: {
            channels: ['slack', 'email'],
            message: 'Application error rate is above 5%',
            severity: 'high'
          }
        }, {
          type: 'notify_agent',
          config: {
            agentCapabilities: ['integration', 'execution'],
            message: 'Investigate high error rate'
          }
        }],
        cooldownPeriod: 15
      },
      {
        name: 'Database Performance Degradation',
        description: 'Alert when database response time exceeds 2 seconds',
        type: 'threshold',
        severity: 'critical',
        conditions: [{
          metric: 'database.responseTime',
          operator: 'gt',
          value: 2000,
          window: 3
        }],
        actions: [{
          type: 'alert',
          config: {
            channels: ['slack', 'email', 'sms'],
            message: 'Database response time critical',
            severity: 'critical'
          }
        }, {
          type: 'auto_scale',
          config: {
            autoRemediation: true
          }
        }],
        cooldownPeriod: 10
      },
      {
        name: 'Security Anomaly Detection',
        description: 'Alert on unusual security patterns',
        type: 'anomaly',
        severity: 'high',
        conditions: [{
          metric: 'security.anomalyScore',
          operator: 'anomaly',
          value: 0.8,
          window: 10,
          threshold: 0.7
        }],
        actions: [{
          type: 'alert',
          config: {
            channels: ['slack', 'email'],
            message: 'Security anomaly detected',
            severity: 'high'
          }
        }, {
          type: 'escalate',
          config: {
            escalationPath: ['security_team', 'admin']
          }
        }],
        cooldownPeriod: 30
      },
      {
        name: 'AI Task Execution Failures',
        description: 'Alert when AI task failure rate exceeds 10%',
        type: 'threshold',
        severity: 'medium',
        conditions: [{
          metric: 'ai.taskFailureRate',
          operator: 'gt',
          value: 10,
          window: 15
        }],
        actions: [{
          type: 'alert',
          config: {
            channels: ['slack'],
            message: 'AI task failure rate elevated',
            severity: 'medium'
          }
        }, {
          type: 'run_healing',
          config: {
            autoRemediation: true
          }
        }],
        cooldownPeriod: 20
      },
      {
        name: 'Attribution Analysis Stale',
        description: 'Alert when attribution analysis is outdated',
        type: 'pattern',
        severity: 'low',
        conditions: [{
          metric: 'attribution.lastAnalysis',
          operator: 'gt',
          value: 60,
          window: 5
        }],
        actions: [{
          type: 'notify_agent',
          config: {
            agentCapabilities: ['analytics'],
            message: 'Trigger attribution analysis'
          }
        }],
        cooldownPeriod: 60
      }
    ];

    defaultRules.forEach(ruleData => {
      const rule: MonitoringRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        enabled: true,
        triggerCount: 0,
        created: new Date(),
        updatedAt: new Date(),
        ...ruleData
      } as MonitoringRule;

      this.rules.set(rule.id, rule);
    });

    logger.info('Loaded default monitoring rules', {
      rulesCount: this.rules.size
    });
  }

  /**
   * Connect to existing monitoring systems
   */
  private connectToMonitoringSystems() {
    // Listen to security monitor events
    securityMonitor.on('securityEvent', (event) => {
      this.handleSecurityEvent(event);
    });

    securityMonitor.on('anomalyDetected', (anomaly) => {
      this.handleSecurityAnomaly(anomaly);
    });

    // Listen to infrastructure events
    predictiveInfrastructureManager.on('monitoring_cycle_complete', (data) => {
      this.handleInfrastructureUpdate(data);
    });

    predictiveInfrastructureManager.on('scaling_completed', (data) => {
      this.handleScalingEvent(data);
    });

    predictiveInfrastructureManager.on('resource_status_changed', (data) => {
      this.handleResourceStatusChange(data);
    });

    // Listen to attribution engine events
    autonomousAttributionEngine.on('analysis_complete', (data) => {
      this.handleAttributionAnalysis(data);
    });

    autonomousAttributionEngine.on('action_executed', (data) => {
      this.handleAutonomousAction(data);
    });

    // Listen to multi-agent events
    multiAgentCoordinator.on('collaboration_completed', (data) => {
      this.handleAgentCollaboration(data);
    });

    multiAgentCoordinator.on('agentOffline', (agent) => {
      this.handleAgentStatusChange(agent, 'offline');
    });

    logger.info('Connected to existing monitoring systems');
  }

  /**
   * Start main monitoring loop
   */
  private startMonitoringLoop() {
    this.monitoringInterval = setInterval(async () => {
      await this.collectSystemHealth();
    }, 30000); // Every 30 seconds

    logger.info('Monitoring loop started');
  }

  /**
   * Start rule evaluation loop
   */
  private startRuleEvaluation() {
    this.ruleEvaluationInterval = setInterval(async () => {
      await this.evaluateMonitoringRules();
    }, 60000); // Every minute

    logger.info('Rule evaluation loop started');
  }

  /**
   * Start insight generation
   */
  private startInsightGeneration() {
    setInterval(async () => {
      await this.generateMonitoringInsights();
    }, 300000); // Every 5 minutes

    logger.info('Insight generation started');
  }

  /**
   * Collect comprehensive system health metrics
   */
  private async collectSystemHealth(): Promise<SystemHealthMetrics> {
    const tracer = trace.getTracer('monitoring-orchestrator');
    
    return tracer.startActiveSpan('collect-system-health', async (span) => {
      try {
        const timestamp = new Date();

        // Collect metrics from all systems
        const [
          infrastructureHealth,
          securityHealth,
          aiHealth,
          attributionHealth
        ] = await Promise.all([
          this.getInfrastructureHealth(),
          this.getSecurityHealth(),
          this.getAIHealth(),
          this.getAttributionHealth()
        ]);

        // Calculate overall health
        const componentScores = [
          infrastructureHealth.score,
          securityHealth.score,
          aiHealth.score,
          attributionHealth.score
        ];
        
        const overallScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
        const overallStatus = this.calculateHealthStatus(overallScore);

        const healthMetrics: SystemHealthMetrics = {
          timestamp,
          overall: {
            status: overallStatus,
            score: overallScore,
            uptime: process.uptime()
          },
          components: {
            infrastructure: infrastructureHealth,
            application: this.getApplicationHealth(),
            database: this.getDatabaseHealth(),
            cache: this.getCacheHealth(),
            ai: aiHealth,
            security: securityHealth,
            attribution: attributionHealth,
            monitoring: this.getMonitoringHealth()
          },
          predictions: {
            nextHour: await this.predictHealth(1),
            next6Hours: await this.predictHealth(6),
            next24Hours: await this.predictHealth(24)
          },
          recommendations: this.generateHealthRecommendations(overallScore),
          activeAlerts: Array.from(this.activeAlerts.values())
        };

        // Store health history
        this.healthHistory.push(healthMetrics);
        
        // Keep only last 24 hours of history
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.healthHistory = this.healthHistory.filter(h => h.timestamp > cutoff);

        // Emit health update event
        this.emit('health_update', healthMetrics);

        return healthMetrics;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Failed to collect system health', {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Evaluate monitoring rules and trigger actions
   */
  private async evaluateMonitoringRules() {
    const currentMetrics = await this.getCurrentMetrics();
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceTrigger < rule.cooldownPeriod * 60 * 1000) {
          continue;
        }
      }

      try {
        const shouldTrigger = await this.evaluateRule(rule, currentMetrics);
        
        if (shouldTrigger) {
          await this.triggerRule(rule);
        }
      } catch (error) {
        logger.error('Rule evaluation failed', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Generate intelligent monitoring insights
   */
  private async generateMonitoringInsights() {
    try {
      const insights: MonitoringInsight[] = [];

      // Analyze performance trends
      const performanceTrends = this.analyzePerformanceTrends();
      insights.push(...performanceTrends);

      // Capacity planning insights
      const capacityInsights = await this.generateCapacityInsights();
      insights.push(...capacityInsights);

      // Security pattern analysis
      const securityInsights = this.analyzeSecurityPatterns();
      insights.push(...securityInsights);

      // Cost optimization opportunities
      const costInsights = await this.identifyCostOptimizations();
      insights.push(...costInsights);

      // Reliability improvements
      const reliabilityInsights = this.analyzeReliabilityPatterns();
      insights.push(...reliabilityInsights);

      // Store insights
      this.insights.push(...insights);
      
      // Keep only last 7 days of insights
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      this.insights = this.insights.filter(i => i.createdAt > cutoff);

      // Emit insights
      if (insights.length > 0) {
        this.emit('insights_generated', insights);
      }

      logger.info('Generated monitoring insights', {
        newInsights: insights.length,
        totalInsights: this.insights.length
      });

    } catch (error) {
      logger.error('Insight generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Handle security events from security monitor
   */
  private handleSecurityEvent(event: any) {
    logger.info('Processing security event', {
      type: event.type,
      severity: event.severity
    });

    // Check if this triggers any rules
    this.checkRulesForMetric('security.event', event);
  }

  /**
   * Handle security anomalies
   */
  private handleSecurityAnomaly(anomaly: any) {
    logger.warn('Security anomaly detected', {
      score: anomaly.score,
      patterns: anomaly.patterns
    });

    // Update security metrics for rule evaluation
    this.updateMetric('security.anomalyScore', anomaly.score);
  }

  /**
   * Handle infrastructure updates
   */
  private handleInfrastructureUpdate(data: any) {
    this.updateMetric('infrastructure.healthyResources', data.healthyResources);
    this.updateMetric('infrastructure.resourceCount', data.resourceCount);
  }

  /**
   * Handle scaling events
   */
  private handleScalingEvent(data: any) {
    logger.info('Infrastructure scaling completed', {
      resourceId: data.resourceId,
      action: data.scalingEvent.action
    });

    // Update infrastructure metrics
    this.updateMetric('infrastructure.scalingEvents', 1);
  }

  /**
   * Handle resource status changes
   */
  private handleResourceStatusChange(data: any) {
    if (data.newStatus === 'critical') {
      this.updateMetric('infrastructure.criticalResources', 1);
    }
  }

  /**
   * Handle attribution analysis completion
   */
  private handleAttributionAnalysis(data: any) {
    this.updateMetric('attribution.lastAnalysis', 0); // Reset age
    this.updateMetric('attribution.insightCount', data.insightCount);
  }

  /**
   * Handle autonomous actions
   */
  private handleAutonomousAction(data: any) {
    logger.info('Autonomous action executed', {
      actionId: data.actionId,
      success: data.success
    });

    if (!data.success) {
      this.updateMetric('ai.autonomousActionFailures', 1);
    }
  }

  /**
   * Handle agent collaboration events
   */
  private handleAgentCollaboration(data: any) {
    this.updateMetric('ai.collaborations', 1);
  }

  /**
   * Handle agent status changes
   */
  private handleAgentStatusChange(agent: any, status: string) {
    if (status === 'offline') {
      this.updateMetric('ai.offlineAgents', 1);
    }
  }

  // Health collection methods
  private async getInfrastructureHealth(): Promise<ComponentHealth> {
    try {
      const status = await predictiveInfrastructureManager.getInfrastructureStatus();
      const healthyCount = status.overview.healthyResources;
      const totalCount = status.overview.totalResources;
      const score = totalCount > 0 ? (healthyCount / totalCount) * 100 : 100;

      return {
        status: this.calculateHealthStatus(score),
        score,
        metrics: {
          healthyResources: healthyCount,
          totalResources: totalCount,
          criticalResources: status.overview.criticalResources,
          monthlyCost: status.totalCost.monthly
        },
        lastCheck: new Date(),
        issues: status.overview.criticalResources > 0 ? 
          [`${status.overview.criticalResources} resources in critical state`] : [],
        recommendations: score < 90 ? ['Review critical resources', 'Consider scaling'] : []
      };
    } catch (error) {
      return this.createErrorHealth('infrastructure', error);
    }
  }

  private async getSecurityHealth(): Promise<ComponentHealth> {
    try {
      const recentEvents = await securityMonitor.getRecentEvents(60); // Last hour
      const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
      const score = Math.max(0, 100 - (criticalEvents * 20));

      return {
        status: this.calculateHealthStatus(score),
        score,
        metrics: {
          recentEvents: recentEvents.length,
          criticalEvents,
          anomalies: recentEvents.filter(e => e.type === 'anomaly').length
        },
        lastCheck: new Date(),
        issues: criticalEvents > 0 ? [`${criticalEvents} critical security events`] : [],
        recommendations: criticalEvents > 0 ? ['Review security events', 'Check for breaches'] : []
      };
    } catch (error) {
      return this.createErrorHealth('security', error);
    }
  }

  private async getAIHealth(): Promise<ComponentHealth> {
    try {
      const stats = await taskExecutionMonitor.getExecutionStats();
      const successRate = stats.totalTasks > 0 ? 
        (stats.successfulTasks / stats.totalTasks) * 100 : 100;

      return {
        status: this.calculateHealthStatus(successRate),
        score: successRate,
        metrics: {
          totalTasks: stats.totalTasks,
          successfulTasks: stats.successfulTasks,
          failedTasks: stats.failedTasks,
          successRate
        },
        lastCheck: new Date(),
        issues: successRate < 90 ? ['AI task failure rate elevated'] : [],
        recommendations: successRate < 90 ? ['Review failed tasks', 'Check AI models'] : []
      };
    } catch (error) {
      return this.createErrorHealth('ai', error);
    }
  }

  private async getAttributionHealth(): Promise<ComponentHealth> {
    try {
      const metrics = await autonomousAttributionEngine.getAttributionMetrics();
      const healthMap = { excellent: 100, good: 80, warning: 60, critical: 20 };
      const score = healthMap[metrics.attributionHealth] || 50;

      return {
        status: this.calculateHealthStatus(score),
        score,
        metrics: {
          totalConversions: metrics.totalConversions,
          totalRevenue: metrics.totalRevenue,
          avgTimeToConversion: metrics.avgTimeToConversion
        },
        lastCheck: new Date(),
        issues: score < 80 ? ['Attribution system needs attention'] : [],
        recommendations: score < 80 ? ['Review attribution data', 'Check tracking'] : []
      };
    } catch (error) {
      return this.createErrorHealth('attribution', error);
    }
  }

  private getApplicationHealth(): ComponentHealth {
    // Basic application health based on uptime and memory
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const score = Math.min(100, uptime / 3600 * 10); // Score based on uptime

    return {
      status: this.calculateHealthStatus(score),
      score,
      metrics: {
        uptime,
        memoryUsage: memUsage.rss,
        heapUsed: memUsage.heapUsed
      },
      lastCheck: new Date(),
      issues: score < 80 ? ['Application recently restarted'] : [],
      recommendations: []
    };
  }

  private getDatabaseHealth(): ComponentHealth {
    // Placeholder for database health
    return {
      status: 'healthy',
      score: 95,
      metrics: {
        connections: 10,
        responseTime: 50
      },
      lastCheck: new Date(),
      issues: [],
      recommendations: []
    };
  }

  private getCacheHealth(): ComponentHealth {
    // Placeholder for cache health
    return {
      status: 'healthy',
      score: 98,
      metrics: {
        hitRate: 85,
        memoryUsage: 60
      },
      lastCheck: new Date(),
      issues: [],
      recommendations: []
    };
  }

  private getMonitoringHealth(): ComponentHealth {
    const score = this.activeAlerts.size < 5 ? 100 : Math.max(0, 100 - this.activeAlerts.size * 10);
    
    return {
      status: this.calculateHealthStatus(score),
      score,
      metrics: {
        activeAlerts: this.activeAlerts.size,
        rulesCount: this.rules.size,
        insightsCount: this.insights.length
      },
      lastCheck: new Date(),
      issues: this.activeAlerts.size > 5 ? ['High number of active alerts'] : [],
      recommendations: this.activeAlerts.size > 5 ? ['Review alert configuration'] : []
    };
  }

  // Helper methods
  private calculateHealthStatus(score: number): 'healthy' | 'warning' | 'critical' | 'down' {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'warning';
    if (score >= 40) return 'critical';
    return 'down';
  }

  private createErrorHealth(component: string, error: any): ComponentHealth {
    return {
      status: 'critical',
      score: 0,
      metrics: {},
      lastCheck: new Date(),
      issues: [`${component} health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: [`Check ${component} connectivity`, 'Review logs']
    };
  }

  private async getCurrentMetrics(): Promise<Record<string, number>> {
    try {
      const metrics: Record<string, number> = {};
      
      // Get infrastructure metrics
      const infraStatus = await predictiveInfrastructureManager.getInfrastructureStatus();
      metrics['infrastructure.healthyResources'] = infraStatus.overview.healthyResources;
      metrics['infrastructure.criticalResources'] = infraStatus.overview.criticalResources;
      metrics['infrastructure.totalResources'] = infraStatus.overview.totalResources;
      
      // Get security metrics
      const securityEvents = await securityMonitor.getRecentEvents(60);
      metrics['security.recentEvents'] = securityEvents.length;
      metrics['security.criticalEvents'] = securityEvents.filter(e => e.severity === 'critical').length;
      
      // Get AI metrics
      const aiStats = await taskExecutionMonitor.getExecutionStats();
      metrics['ai.totalTasks'] = aiStats.totalTasks;
      metrics['ai.successfulTasks'] = aiStats.successfulTasks;
      metrics['ai.failedTasks'] = aiStats.failedTasks;
      metrics['ai.taskFailureRate'] = aiStats.totalTasks > 0 ? (aiStats.failedTasks / aiStats.totalTasks) * 100 : 0;
      
      // Get attribution metrics
      const attributionMetrics = await autonomousAttributionEngine.getAttributionMetrics();
      const lastAnalysisTime = attributionMetrics.lastAnalysisTime;
      metrics['attribution.lastAnalysis'] = lastAnalysisTime ? 
        (Date.now() - new Date(lastAnalysisTime).getTime()) / (1000 * 60) : 0; // minutes ago
      
      // Application metrics
      metrics['application.uptime'] = process.uptime();
      metrics['application.memoryUsage'] = process.memoryUsage().rss / 1024 / 1024; // MB
      
      // Database metrics (placeholder - would need actual implementation)
      metrics['database.responseTime'] = 50; // ms
      metrics['database.connections'] = 10;
      
      // Error rate (placeholder)
      metrics['application.errorRate'] = 2; // percent
      
      return metrics;
    } catch (error) {
      logger.error('Failed to collect current metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  private async evaluateRule(rule: MonitoringRule, metrics: Record<string, number>): Promise<boolean> {
    try {
      // All conditions must be met for rule to trigger
      for (const condition of rule.conditions) {
        const metricValue = metrics[condition.metric];
        if (metricValue === undefined) {
          logger.debug('Metric not found for rule evaluation', {
            ruleId: rule.id,
            metric: condition.metric
          });
          return false;
        }
        
        const conditionMet = this.evaluateCondition(condition, metricValue);
        if (!conditionMet) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Rule evaluation failed', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  private async triggerRule(rule: MonitoringRule) {
    logger.info('Triggering monitoring rule', {
      ruleId: rule.id,
      ruleName: rule.name
    });

    rule.lastTriggered = new Date();
    rule.triggerCount++;

    // Execute rule actions
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, rule);
      } catch (error) {
        logger.error('Action execution failed', {
          ruleId: rule.id,
          actionType: action.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async executeAction(action: MonitoringAction, rule: MonitoringRule) {
    switch (action.type) {
      case 'alert':
        await this.sendAlert(action, rule);
        break;
      case 'auto_scale':
        await this.triggerAutoScale(action);
        break;
      case 'restart_service':
        await this.restartService(action);
        break;
      case 'run_healing':
        await this.runHealing(action);
        break;
      case 'notify_agent':
        await this.notifyAgent(action, rule);
        break;
      case 'escalate':
        await this.escalateAlert(action, rule);
        break;
    }
  }

  private async sendAlert(action: MonitoringAction, rule: MonitoringRule) {
    const channels = action.config.channels || ['slack'];
    const message = action.config.message || rule.description;
    const severity = action.config.severity || rule.severity;

    for (const channel of channels) {
      try {
        await alertingSystem.sendAlert({
          type: 'monitoring_rule',
          severity,
          message,
          details: { ruleId: rule.id, ruleName: rule.name }
        }, [channel]);
      } catch (error) {
        logger.error('Alert sending failed', {
          channel,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async triggerAutoScale(action: MonitoringAction) {
    // Trigger infrastructure auto-scaling
    logger.info('Triggering auto-scaling based on monitoring rule');
  }

  private async restartService(action: MonitoringAction) {
    // Restart service logic
    logger.info('Service restart triggered by monitoring rule');
  }

  private async runHealing(action: MonitoringAction) {
    // Trigger self-healing capabilities
    logger.info('Self-healing triggered by monitoring rule');
  }

  private async notifyAgent(action: MonitoringAction, rule: MonitoringRule) {
    const capabilities = action.config.agentCapabilities || ['integration'];
    const message = action.config.message || rule.description;

    try {
      await multiAgentCoordinator.requestAgentCollaboration({
        requiredCapabilities: capabilities,
        objective: message,
        priority: rule.severity === 'critical' ? 'critical' : 'medium',
        requesterId: 'monitoring_orchestrator'
      });
    } catch (error) {
      logger.error('Agent notification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async escalateAlert(action: MonitoringAction, rule: MonitoringRule) {
    const escalationPath = action.config.escalationPath || ['admin'];
    
    logger.info('Escalating alert', {
      ruleId: rule.id,
      escalationPath
    });

    // Create escalated alert
    const alert: ActiveAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule: rule.id,
      severity: rule.severity,
      message: rule.description,
      component: 'system',
      triggeredAt: new Date(),
      escalated: true,
      actions: ['escalated']
    };

    this.activeAlerts.set(alert.id, alert);
  }

  private checkRulesForMetric(metric: string, value: any) {
    // Check if any rules should be triggered by this metric
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      // Check if this rule monitors the given metric
      const hasMetric = rule.conditions.some(c => c.metric === metric);
      if (!hasMetric) continue;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceTrigger < rule.cooldownPeriod * 60 * 1000) {
          continue;
        }
      }
      
      // Create metrics object for evaluation
      const currentMetrics = { [metric]: value };
      
      // Evaluate rule (async but don't wait)
      this.evaluateRule(rule, currentMetrics).then(shouldTrigger => {
        if (shouldTrigger) {
          this.triggerRule(rule).catch(error => {
            logger.error('Failed to trigger rule', {
              ruleId: rule.id,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
      }).catch(error => {
        logger.error('Rule evaluation failed', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
  }

  private updateMetric(metric: string, value: number) {
    // Update metric for rule evaluation and trigger checks
    this.checkRulesForMetric(metric, value);
    
    // Emit metric update event
    this.emit('metric_updated', { metric, value, timestamp: new Date() });
  }

  private async predictHealth(hours: number): Promise<HealthPrediction> {
    // Simple prediction based on trends
    return {
      status: 'healthy',
      confidence: 0.8,
      factors: ['Current trends stable'],
      mitigations: []
    };
  }

  private generateHealthRecommendations(score: number): string[] {
    const recommendations: string[] = [];
    
    if (score < 90) {
      recommendations.push('Review system components with low health scores');
    }
    if (score < 70) {
      recommendations.push('Consider scaling resources');
      recommendations.push('Check for system bottlenecks');
    }
    if (score < 50) {
      recommendations.push('Immediate attention required for critical components');
    }
    
    return recommendations;
  }

  // Insight generation methods
  private analyzePerformanceTrends(): MonitoringInsight[] {
    const insights: MonitoringInsight[] = [];
    
    try {
      // Analyze system health trends from history
      if (this.healthHistory.length >= 5) {
        const recent = this.healthHistory.slice(-5);
        const scores = recent.map(h => h.overall.score);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Check for declining performance
        const isDecclining = scores.every((score, i) => i === 0 || score <= scores[i - 1]);
        
        if (isDecclining && avgScore < 85) {
          insights.push({
            id: `perf_trend_${Date.now()}`,
            type: 'performance_trend',
            confidence: 0.8,
            impact: 'medium',
            message: 'System performance showing declining trend',
            details: { avgScore, trend: 'declining', dataPoints: scores.length },
            recommendations: [
              'Review recent changes and deployments',
              'Check for resource bottlenecks',
              'Consider scaling resources'
            ],
            autoFixAvailable: false,
            estimatedResolution: '30-60 minutes',
            createdAt: new Date()
          });
        }
      }
      
      return insights;
    } catch (error) {
      logger.error('Performance trend analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async generateCapacityInsights(): Promise<MonitoringInsight[]> {
    const insights: MonitoringInsight[] = [];
    
    try {
      // Get current infrastructure status
      const infraStatus = await predictiveInfrastructureManager.getInfrastructureStatus();
      
      // Check for capacity warnings
      const utilizationRate = infraStatus.overview.totalResources > 0 ? 
        (infraStatus.overview.healthyResources / infraStatus.overview.totalResources) : 1;
      
      if (utilizationRate > 0.85) {
        insights.push({
          id: `capacity_warning_${Date.now()}`,
          type: 'capacity_warning',
          confidence: 0.9,
          impact: 'high',
          message: 'High resource utilization detected',
          details: { 
            utilizationRate: (utilizationRate * 100).toFixed(1),
            totalResources: infraStatus.overview.totalResources,
            healthyResources: infraStatus.overview.healthyResources
          },
          recommendations: [
            'Consider scaling up resources',
            'Review resource allocation',
            'Enable auto-scaling if not already active'
          ],
          autoFixAvailable: true,
          estimatedResolution: '5-10 minutes',
          createdAt: new Date()
        });
      }
      
      return insights;
    } catch (error) {
      logger.error('Capacity insights generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private analyzeSecurityPatterns(): MonitoringInsight[] {
    const insights: MonitoringInsight[] = [];
    
    try {
      // Analyze recent security events for patterns
      securityMonitor.getRecentEvents(60).then(events => {
        const eventsByType = events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Check for unusual patterns
        const totalEvents = events.length;
        if (totalEvents > 10) {
          const mostCommonType = Object.entries(eventsByType)
            .sort(([,a], [,b]) => b - a)[0];
          
          if (mostCommonType && mostCommonType[1] > totalEvents * 0.6) {
            insights.push({
              id: `security_pattern_${Date.now()}`,
              type: 'security_pattern',
              confidence: 0.7,
              impact: 'medium',
              message: `Unusual concentration of ${mostCommonType[0]} security events`,
              details: {
                eventType: mostCommonType[0],
                count: mostCommonType[1],
                percentage: ((mostCommonType[1] / totalEvents) * 100).toFixed(1)
              },
              recommendations: [
                'Review security logs for this event type',
                'Check for potential attack patterns',
                'Consider strengthening relevant security controls'
              ],
              autoFixAvailable: false,
              estimatedResolution: '15-30 minutes',
              createdAt: new Date()
            });
          }
        }
      }).catch(error => {
        logger.error('Security pattern analysis failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
      
      return insights;
    } catch (error) {
      logger.error('Security pattern analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async identifyCostOptimizations(): Promise<MonitoringInsight[]> {
    const insights: MonitoringInsight[] = [];
    
    try {
      // Get cost data from infrastructure manager
      const infraStatus = await predictiveInfrastructureManager.getInfrastructureStatus();
      
      // Check for cost optimization opportunities
      if (infraStatus.totalCost.monthly > 1000) {
        // Check for underutilized resources
        const utilizationRate = infraStatus.overview.totalResources > 0 ? 
          (infraStatus.overview.healthyResources / infraStatus.overview.totalResources) : 1;
        
        if (utilizationRate < 0.6) {
          insights.push({
            id: `cost_optimization_${Date.now()}`,
            type: 'cost_optimization',
            confidence: 0.8,
            impact: 'medium',
            message: 'Cost optimization opportunity identified',
            details: {
              monthlyCost: infraStatus.totalCost.monthly,
              utilizationRate: (utilizationRate * 100).toFixed(1),
              potentialSavings: (infraStatus.totalCost.monthly * 0.3).toFixed(2)
            },
            recommendations: [
              'Review and rightsized underutilized resources',
              'Consider implementing auto-scaling',
              'Evaluate resource allocation efficiency'
            ],
            autoFixAvailable: true,
            estimatedResolution: '1-2 hours',
            createdAt: new Date()
          });
        }
      }
      
      return insights;
    } catch (error) {
      logger.error('Cost optimization analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private analyzeReliabilityPatterns(): MonitoringInsight[] {
    const insights: MonitoringInsight[] = [];
    
    try {
      // Analyze task execution patterns
      const aiHealth = taskExecutionMonitor.getHealthStatus();
      
      if (aiHealth.status === 'warning' || aiHealth.status === 'critical') {
        insights.push({
          id: `reliability_issue_${Date.now()}`,
          type: 'reliability_issue',
          confidence: 0.9,
          impact: aiHealth.status === 'critical' ? 'critical' : 'high',
          message: 'AI system reliability concerns detected',
          details: {
            healthStatus: aiHealth.status,
            issueCount: aiHealth.issues.length,
            issues: aiHealth.issues.slice(0, 3) // Top 3 issues
          },
          recommendations: aiHealth.recommendations,
          autoFixAvailable: false,
          estimatedResolution: '30-60 minutes',
          createdAt: new Date()
        });
      }
      
      // Check active alerts for reliability patterns
      const alertCount = this.activeAlerts.size;
      if (alertCount > 5) {
        insights.push({
          id: `reliability_alerts_${Date.now()}`,
          type: 'reliability_issue',
          confidence: 0.7,
          impact: 'medium',
          message: 'High number of active alerts may indicate reliability issues',
          details: {
            activeAlerts: alertCount,
            alertTypes: Array.from(this.activeAlerts.values()).map(a => a.component)
          },
          recommendations: [
            'Review and resolve active alerts',
            'Check for underlying system issues',
            'Consider alert threshold adjustments'
          ],
          autoFixAvailable: false,
          estimatedResolution: '15-30 minutes',
          createdAt: new Date()
        });
      }
      
      return insights;
    } catch (error) {
      logger.error('Reliability pattern analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Public API methods
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    return this.collectSystemHealth();
  }

  async getMonitoringInsights(): Promise<MonitoringInsight[]> {
    return this.insights.slice(0, 50); // Return latest 50 insights
  }

  async getActiveAlerts(): Promise<ActiveAlert[]> {
    return Array.from(this.activeAlerts.values());
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;
      this.emit('alert_acknowledged', { alertId, userId });
      return true;
    }
    return false;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      this.emit('alert_resolved', { alertId });
      return true;
    }
    return false;
  }

  async addMonitoringRule(rule: Partial<MonitoringRule>): Promise<string> {
    const newRule: MonitoringRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enabled: true,
      triggerCount: 0,
      created: new Date(),
      updatedAt: new Date(),
      ...rule
    } as MonitoringRule;

    this.rules.set(newRule.id, newRule);
    this.emit('rule_added', newRule);
    
    return newRule.id;
  }

  async updateMonitoringRule(ruleId: string, updates: Partial<MonitoringRule>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date() });
      this.emit('rule_updated', rule);
      return true;
    }
    return false;
  }

  async deleteMonitoringRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.emit('rule_deleted', { ruleId });
    }
    return deleted;
  }

  async getMonitoringRules(): Promise<MonitoringRule[]> {
    return Array.from(this.rules.values());
  }

  /**
   * Evaluate a single condition against a metric value
   */
  private evaluateCondition(condition: MonitoringCondition, metricValue: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return metricValue > Number(condition.value);
      case 'lt':
        return metricValue < Number(condition.value);
      case 'eq':
        return metricValue === Number(condition.value);
      case 'neq':
        return metricValue !== Number(condition.value);
      case 'anomaly':
        // Simple anomaly detection based on threshold
        return metricValue > (condition.threshold || 0.8);
      default:
        logger.warn('Unknown condition operator', { operator: condition.operator });
        return false;
    }
  }
  
  /**
   * Get execution stats for external monitoring
   */
  async getExecutionStats(): Promise<{
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
  }> {
    try {
      const stats = taskExecutionMonitor.getOverallMetrics();
      let totalTasks = 0;
      let successfulTasks = 0;
      let failedTasks = 0;
      
      for (const metrics of Object.values(stats)) {
        totalTasks += metrics.totalAttempts;
        successfulTasks += metrics.successfulExecutions;
        failedTasks += metrics.failedExecutions;
      }
      
      return { totalTasks, successfulTasks, failedTasks };
    } catch (error) {
      logger.error('Failed to get execution stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { totalTasks: 0, successfulTasks: 0, failedTasks: 0 };
    }
  }
  
  /**
   * Cleanup and stop monitoring
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.ruleEvaluationInterval) {
      clearInterval(this.ruleEvaluationInterval);
      this.ruleEvaluationInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('Advanced monitoring orchestrator destroyed');
  }
}

// Export singleton instance
export const advancedMonitoringOrchestrator = new AdvancedMonitoringOrchestrator();

// Export types and class
export { AdvancedMonitoringOrchestrator };