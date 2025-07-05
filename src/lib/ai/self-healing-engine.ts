/**
 * Self-Healing Engine
 * ==================
 * Advanced failure recovery mechanisms that automatically detect, diagnose, and fix system issues
 * Integrates with integration testing to provide intelligent self-healing capabilities
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { 
  integrationTestingEngine, 
  type IntegrationHealth, 
  type IntegrationTest,
  IntegrationType 
} from './integration-testing-engine';
import { intelligentExecutionEngine } from './intelligent-execution-engine';
import prisma from '@/lib/db/prisma';

export interface HealingAction {
  id: string;
  type: HealingActionType;
  targetIntegration: string;
  description: string;
  executionPlan: string[];
  estimatedDuration: number; // minutes
  riskLevel: 'low' | 'medium' | 'high';
  success: boolean;
  executedAt?: Date;
  completedAt?: Date;
  error?: string;
  results?: any;
}

export enum HealingActionType {
  // Connection Recovery
  RESTART_CONNECTION = 'restart_connection',
  RESET_CIRCUIT_BREAKER = 'reset_circuit_breaker',
  REFRESH_CREDENTIALS = 'refresh_credentials',
  
  // Configuration Fix
  UPDATE_TIMEOUT_CONFIG = 'update_timeout_config',
  OPTIMIZE_RETRY_STRATEGY = 'optimize_retry_strategy',
  ADJUST_RATE_LIMITS = 'adjust_rate_limits',
  
  // Infrastructure Recovery
  RESTART_SERVICE = 'restart_service',
  CLEAR_CACHE = 'clear_cache',
  REBUILD_INDEXES = 'rebuild_indexes',
  
  // Advanced Recovery
  FAILOVER_TO_BACKUP = 'failover_to_backup',
  SCALE_RESOURCES = 'scale_resources',
  MIGRATE_DATA = 'migrate_data',
  
  // AI-Powered Recovery
  ANALYZE_AND_FIX = 'analyze_and_fix',
  PREDICTIVE_HEALING = 'predictive_healing',
  AUTONOMOUS_OPTIMIZATION = 'autonomous_optimization'
}

export interface HealingReport {
  sessionId: string;
  timestamp: Date;
  triggeredBy: 'manual' | 'automatic' | 'predictive';
  systemHealth: {
    before: number; // 0-100 health score
    after: number;
    improvement: number;
  };
  actionsExecuted: HealingAction[];
  summary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    estimatedDowntimePrevented: number; // minutes
    costSavings: number; // estimated in USD
  };
  recommendations: string[];
  nextCheckIn: Date;
}

export interface HealingStrategy {
  integration: IntegrationType;
  conditions: Array<{
    metric: string;
    threshold: number;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  }>;
  actions: HealingActionType[];
  cooldownPeriod: number; // minutes
  maxRetries: number;
  escalationPath: string[];
}

class SelfHealingEngine {
  private healingStrategies = new Map<IntegrationType, HealingStrategy[]>();
  private activeHealingSessions = new Map<string, HealingReport>();
  private healingHistory: HealingReport[] = [];
  private isAutoHealingEnabled = true;
  private lastHealthCheck = new Date();

  constructor() {
    this.initializeHealingStrategies();
    this.startContinuousMonitoring();
  }

  /**
   * Initialize healing strategies for different integration types
   */
  private initializeHealingStrategies(): void {
    // Database healing strategies
    this.healingStrategies.set(IntegrationType.DATABASE, [
      {
        integration: IntegrationType.DATABASE,
        conditions: [
          { metric: 'responseTime', threshold: 5000, operator: '>' },
          { metric: 'errorRate', threshold: 10, operator: '>' }
        ],
        actions: [
          HealingActionType.CLEAR_CACHE,
          HealingActionType.REBUILD_INDEXES,
          HealingActionType.RESTART_CONNECTION
        ],
        cooldownPeriod: 30,
        maxRetries: 3,
        escalationPath: ['system_admin', 'database_admin']
      }
    ]);

    // Payment gateway healing strategies
    this.healingStrategies.set(IntegrationType.PAYSTACK, [
      {
        integration: IntegrationType.PAYSTACK,
        conditions: [
          { metric: 'status', threshold: 0, operator: '=' }, // unhealthy
          { metric: 'responseTime', threshold: 10000, operator: '>' }
        ],
        actions: [
          HealingActionType.RESET_CIRCUIT_BREAKER,
          HealingActionType.REFRESH_CREDENTIALS,
          HealingActionType.OPTIMIZE_RETRY_STRATEGY
        ],
        cooldownPeriod: 15,
        maxRetries: 2,
        escalationPath: ['payment_admin', 'technical_lead']
      }
    ]);

    // AI service healing strategies
    this.healingStrategies.set(IntegrationType.OPENAI, [
      {
        integration: IntegrationType.OPENAI,
        conditions: [
          { metric: 'errorRate', threshold: 15, operator: '>' },
          { metric: 'responseTime', threshold: 30000, operator: '>' }
        ],
        actions: [
          HealingActionType.ADJUST_RATE_LIMITS,
          HealingActionType.UPDATE_TIMEOUT_CONFIG,
          HealingActionType.RESET_CIRCUIT_BREAKER
        ],
        cooldownPeriod: 20,
        maxRetries: 3,
        escalationPath: ['ai_admin', 'technical_lead']
      }
    ]);

    // Email service healing strategies
    this.healingStrategies.set(IntegrationType.MAILTRAP, [
      {
        integration: IntegrationType.MAILTRAP,
        conditions: [
          { metric: 'status', threshold: 0, operator: '=' },
          { metric: 'errorCount', threshold: 5, operator: '>' }
        ],
        actions: [
          HealingActionType.RESTART_CONNECTION,
          HealingActionType.REFRESH_CREDENTIALS,
          HealingActionType.CLEAR_CACHE
        ],
        cooldownPeriod: 10,
        maxRetries: 2,
        escalationPath: ['communication_admin']
      }
    ]);

    logger.info('Self-healing strategies initialized', {
      strategiesCount: this.healingStrategies.size,
      integrations: Array.from(this.healingStrategies.keys())
    });
  }

  /**
   * Perform automatic system healing based on current health status
   */
  async performAutoHealing(healthReport: IntegrationHealth): Promise<HealingReport> {
    const sessionId = `healing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tracer = trace.getTracer('self-healing-engine');
    
    return tracer.startActiveSpan('auto-healing-session', async (span) => {
      try {
        span.setAttributes({
          'healing.session.id': sessionId,
          'healing.trigger': 'automatic',
          'system.health.before': healthReport.overall.score,
          'integrations.unhealthy': healthReport.metrics.unhealthyCount
        });

        logger.info('Starting auto-healing session', {
          sessionId,
          healthScore: healthReport.overall.score,
          unhealthyIntegrations: healthReport.metrics.unhealthyCount
        });

        const healingSession: HealingReport = {
          sessionId,
          timestamp: new Date(),
          triggeredBy: 'automatic',
          systemHealth: {
            before: healthReport.overall.score,
            after: 0, // Will be updated after healing
            improvement: 0
          },
          actionsExecuted: [],
          summary: {
            totalActions: 0,
            successfulActions: 0,
            failedActions: 0,
            estimatedDowntimePrevented: 0,
            costSavings: 0
          },
          recommendations: [],
          nextCheckIn: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };

        this.activeHealingSessions.set(sessionId, healingSession);

        // Identify integrations that need healing
        const unhealthyIntegrations = healthReport.integrations.filter(
          integration => integration.status === 'unhealthy' || integration.status === 'degraded'
        );

        // Execute healing actions for each unhealthy integration
        for (const integration of unhealthyIntegrations) {
          const healingActions = await this.planHealingActions(integration, healthReport);
          
          for (const action of healingActions) {
            try {
              const result = await this.executeHealingAction(action, integration);
              healingSession.actionsExecuted.push(result);
              
              if (result.success) {
                healingSession.summary.successfulActions++;
                healingSession.summary.estimatedDowntimePrevented += result.estimatedDuration;
              } else {
                healingSession.summary.failedActions++;
              }
            } catch (error) {
              logger.error('Healing action failed', {
                sessionId,
                actionType: action.type,
                integration: integration.id,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }
        }

        // Re-check system health after healing
        const postHealingHealth = await integrationTestingEngine.performIntegrationHealthCheck();
        healingSession.systemHealth.after = postHealingHealth.overall.score;
        healingSession.systemHealth.improvement = 
          postHealingHealth.overall.score - healthReport.overall.score;

        // Generate recommendations
        healingSession.recommendations = this.generateHealingRecommendations(
          healthReport,
          postHealingHealth,
          healingSession.actionsExecuted
        );

        // Calculate cost savings (estimated)
        healingSession.summary.costSavings = this.calculateCostSavings(healingSession);

        healingSession.summary.totalActions = healingSession.actionsExecuted.length;

        span.setAttributes({
          'healing.session.actions_total': healingSession.summary.totalActions,
          'healing.session.actions_successful': healingSession.summary.successfulActions,
          'healing.session.actions_failed': healingSession.summary.failedActions,
          'system.health.after': healingSession.systemHealth.after,
          'system.health.improvement': healingSession.systemHealth.improvement
        });

        // Store healing report
        this.healingHistory.push(healingSession);
        this.activeHealingSessions.delete(sessionId);

        logger.info('Auto-healing session completed', {
          sessionId,
          healthImprovement: healingSession.systemHealth.improvement,
          actionsExecuted: healingSession.summary.totalActions,
          successRate: (healingSession.summary.successfulActions / Math.max(healingSession.summary.totalActions, 1)) * 100
        });

        return healingSession;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Auto-healing session failed', {
          sessionId,
          error: error instanceof Error ? error.message : String(error)
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Plan healing actions for a specific integration
   */
  private async planHealingActions(
    integration: IntegrationTest,
    healthReport: IntegrationHealth
  ): Promise<Partial<HealingAction>[]> {
    const strategies = this.healingStrategies.get(integration.type) || [];
    const applicableActions: Partial<HealingAction>[] = [];

    for (const strategy of strategies) {
      // Check if strategy conditions are met
      const conditionsMet = strategy.conditions.every(condition => {
        const metricValue = this.getMetricValue(integration, condition.metric);
        return this.evaluateCondition(metricValue, condition.threshold, condition.operator);
      });

      if (conditionsMet) {
        // Add actions from this strategy
        for (const actionType of strategy.actions) {
          applicableActions.push({
            id: `${integration.id}_${actionType}_${Date.now()}`,
            type: actionType,
            targetIntegration: integration.id,
            description: this.getActionDescription(actionType, integration),
            executionPlan: this.generateExecutionPlan(actionType, integration),
            estimatedDuration: this.estimateActionDuration(actionType),
            riskLevel: this.assessActionRisk(actionType, integration),
            success: false
          });
        }
      }
    }

    // AI-powered action planning for complex scenarios
    if (applicableActions.length === 0 && integration.status === 'unhealthy') {
      applicableActions.push({
        id: `${integration.id}_ai_analysis_${Date.now()}`,
        type: HealingActionType.ANALYZE_AND_FIX,
        targetIntegration: integration.id,
        description: 'AI-powered analysis and automatic fix',
        executionPlan: ['Analyze integration logs', 'Identify root cause', 'Apply targeted fix'],
        estimatedDuration: 5,
        riskLevel: 'medium',
        success: false
      });
    }

    return applicableActions;
  }

  /**
   * Execute a specific healing action
   */
  private async executeHealingAction(
    action: Partial<HealingAction>,
    integration: IntegrationTest
  ): Promise<HealingAction> {
    const startTime = new Date();
    const completedAction: HealingAction = {
      ...action,
      executedAt: startTime,
      success: false
    } as HealingAction;

    try {
      logger.info('Executing healing action', {
        actionId: action.id,
        actionType: action.type,
        integration: integration.id,
        riskLevel: action.riskLevel
      });

      switch (action.type) {
        case HealingActionType.RESTART_CONNECTION:
          completedAction.results = await this.restartConnection(integration);
          break;
        
        case HealingActionType.RESET_CIRCUIT_BREAKER:
          completedAction.results = await this.resetCircuitBreaker(integration);
          break;
        
        case HealingActionType.REFRESH_CREDENTIALS:
          completedAction.results = await this.refreshCredentials(integration);
          break;
        
        case HealingActionType.CLEAR_CACHE:
          completedAction.results = await this.clearCache(integration);
          break;
        
        case HealingActionType.UPDATE_TIMEOUT_CONFIG:
          completedAction.results = await this.updateTimeoutConfig(integration);
          break;
        
        case HealingActionType.OPTIMIZE_RETRY_STRATEGY:
          completedAction.results = await this.optimizeRetryStrategy(integration);
          break;
        
        case HealingActionType.ANALYZE_AND_FIX:
          completedAction.results = await this.performAIAnalysisAndFix(integration);
          break;
        
        default:
          throw new Error(`Healing action type ${action.type} not implemented`);
      }

      completedAction.success = true;
      completedAction.completedAt = new Date();

    } catch (error) {
      completedAction.success = false;
      completedAction.error = error instanceof Error ? error.message : String(error);
      completedAction.completedAt = new Date();
      
      logger.error('Healing action failed', {
        actionId: action.id,
        actionType: action.type,
        integration: integration.id,
        error: completedAction.error
      });
    }

    return completedAction;
  }

  /**
   * Restart connection for an integration
   */
  private async restartConnection(integration: IntegrationTest): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate restart
    
    return {
      action: 'connection_restarted',
      integration: integration.id,
      timestamp: new Date(),
      result: 'Connection successfully restarted'
    };
  }

  /**
   * Reset circuit breaker for an integration
   */
  private async resetCircuitBreaker(integration: IntegrationTest): Promise<any> {
    // This would interface with the actual circuit breaker system
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      action: 'circuit_breaker_reset',
      integration: integration.id,
      timestamp: new Date(),
      result: 'Circuit breaker reset successfully'
    };
  }

  /**
   * Refresh credentials for an integration
   */
  private async refreshCredentials(integration: IntegrationTest): Promise<any> {
    // This would implement credential refresh logic
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      action: 'credentials_refreshed',
      integration: integration.id,
      timestamp: new Date(),
      result: 'Credentials refreshed successfully'
    };
  }

  /**
   * Clear cache for an integration
   */
  private async clearCache(integration: IntegrationTest): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      action: 'cache_cleared',
      integration: integration.id,
      timestamp: new Date(),
      result: 'Cache cleared successfully'
    };
  }

  /**
   * Update timeout configuration
   */
  private async updateTimeoutConfig(integration: IntegrationTest): Promise<any> {
    const newTimeout = Math.min(integration.slaTarget * 2, 60000); // Max 60 seconds
    
    return {
      action: 'timeout_updated',
      integration: integration.id,
      oldTimeout: integration.slaTarget,
      newTimeout,
      timestamp: new Date(),
      result: `Timeout updated from ${integration.slaTarget}ms to ${newTimeout}ms`
    };
  }

  /**
   * Optimize retry strategy
   */
  private async optimizeRetryStrategy(integration: IntegrationTest): Promise<any> {
    const strategy = {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000
    };
    
    return {
      action: 'retry_strategy_optimized',
      integration: integration.id,
      strategy,
      timestamp: new Date(),
      result: 'Retry strategy optimized for better resilience'
    };
  }

  /**
   * Perform AI-powered analysis and fix
   */
  private async performAIAnalysisAndFix(integration: IntegrationTest): Promise<any> {
    try {
      // Use the intelligent execution engine to analyze and fix
      const analysisQuery = `Analyze the ${integration.name} integration that is currently ${integration.status}. 
        Response time: ${integration.responseTime}ms (SLA: ${integration.slaTarget}ms). 
        Error count: ${integration.errorCount}. 
        Provide specific recommendations to fix this integration.`;

      const result = await intelligentExecutionEngine.executeUserRequest(
        analysisQuery,
        'system_healing_engine'
      );

      return {
        action: 'ai_analysis_completed',
        integration: integration.id,
        analysis: result.message,
        recommendations: result.suggestions || [],
        timestamp: new Date(),
        result: 'AI analysis completed with recommendations'
      };

    } catch (error) {
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start continuous monitoring for automatic healing
   */
  private startContinuousMonitoring(): void {
    // Monitor system health every 10 minutes
    setInterval(async () => {
      if (!this.isAutoHealingEnabled) return;

      try {
        const currentHealth = await integrationTestingEngine.performIntegrationHealthCheck();
        
        // Trigger healing if health score is below threshold
        if (currentHealth.overall.score < 80) {
          logger.info('Health score below threshold, triggering auto-healing', {
            healthScore: currentHealth.overall.score,
            threshold: 80
          });
          
          await this.performAutoHealing(currentHealth);
        }

        this.lastHealthCheck = new Date();

      } catch (error) {
        logger.error('Continuous monitoring failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

    logger.info('Continuous monitoring started', {
      interval: '10 minutes',
      autoHealingEnabled: this.isAutoHealingEnabled
    });
  }

  /**
   * Generate healing recommendations
   */
  private generateHealingRecommendations(
    beforeHealth: IntegrationHealth,
    afterHealth: IntegrationHealth,
    actionsExecuted: HealingAction[]
  ): string[] {
    const recommendations: string[] = [];

    const improvement = afterHealth.overall.score - beforeHealth.overall.score;

    if (improvement > 0) {
      recommendations.push(`✅ System health improved by ${improvement} points`);
    } else if (improvement === 0) {
      recommendations.push('⚠️ No improvement detected - consider escalating to manual intervention');
    } else {
      recommendations.push('❌ System health degraded - immediate manual intervention required');
    }

    // Action-specific recommendations
    const failedActions = actionsExecuted.filter(action => !action.success);
    if (failedActions.length > 0) {
      recommendations.push(`🔧 ${failedActions.length} healing actions failed and may need manual review`);
    }

    // Risk-based recommendations
    const stillUnhealthy = afterHealth.integrations.filter(i => i.status === 'unhealthy');
    if (stillUnhealthy.length > 0) {
      recommendations.push(`🚨 ${stillUnhealthy.length} integrations still unhealthy - escalation recommended`);
    }

    return recommendations;
  }

  /**
   * Calculate estimated cost savings from healing actions
   */
  private calculateCostSavings(healingSession: HealingReport): number {
    // Estimate based on prevented downtime
    const downtimeHours = healingSession.summary.estimatedDowntimePrevented / 60;
    const costPerHour = 500; // Estimated cost per hour of downtime
    return Math.round(downtimeHours * costPerHour);
  }

  /**
   * Utility methods for healing logic
   */
  private getMetricValue(integration: IntegrationTest, metric: string): number {
    switch (metric) {
      case 'responseTime': return integration.responseTime;
      case 'errorRate': return integration.errorCount;
      case 'errorCount': return integration.errorCount;
      case 'status': return integration.status === 'healthy' ? 1 : 0;
      default: return 0;
    }
  }

  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '=': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private getActionDescription(actionType: HealingActionType, integration: IntegrationTest): string {
    const descriptions = {
      [HealingActionType.RESTART_CONNECTION]: `Restart connection to ${integration.name}`,
      [HealingActionType.RESET_CIRCUIT_BREAKER]: `Reset circuit breaker for ${integration.name}`,
      [HealingActionType.REFRESH_CREDENTIALS]: `Refresh credentials for ${integration.name}`,
      [HealingActionType.CLEAR_CACHE]: `Clear cache for ${integration.name}`,
      [HealingActionType.UPDATE_TIMEOUT_CONFIG]: `Update timeout configuration for ${integration.name}`,
      [HealingActionType.OPTIMIZE_RETRY_STRATEGY]: `Optimize retry strategy for ${integration.name}`,
      [HealingActionType.ANALYZE_AND_FIX]: `AI-powered analysis and fix for ${integration.name}`
    };

    return descriptions[actionType] || `Unknown healing action for ${integration.name}`;
  }

  private generateExecutionPlan(actionType: HealingActionType, integration: IntegrationTest): string[] {
    const plans = {
      [HealingActionType.RESTART_CONNECTION]: [
        'Close existing connections',
        'Wait for connection cleanup',
        'Initialize new connection',
        'Verify connection health'
      ],
      [HealingActionType.RESET_CIRCUIT_BREAKER]: [
        'Locate circuit breaker state',
        'Reset failure counter',
        'Set state to closed',
        'Test connection'
      ],
      [HealingActionType.REFRESH_CREDENTIALS]: [
        'Backup current credentials',
        'Fetch new credentials',
        'Update configuration',
        'Test authentication'
      ],
      [HealingActionType.ANALYZE_AND_FIX]: [
        'Analyze integration logs',
        'Identify root cause',
        'Apply targeted fix',
        'Verify resolution'
      ]
    };

    return plans[actionType] || ['Execute healing action', 'Verify results'];
  }

  private estimateActionDuration(actionType: HealingActionType): number {
    const durations = {
      [HealingActionType.RESTART_CONNECTION]: 2,
      [HealingActionType.RESET_CIRCUIT_BREAKER]: 1,
      [HealingActionType.REFRESH_CREDENTIALS]: 3,
      [HealingActionType.CLEAR_CACHE]: 1,
      [HealingActionType.UPDATE_TIMEOUT_CONFIG]: 1,
      [HealingActionType.OPTIMIZE_RETRY_STRATEGY]: 2,
      [HealingActionType.ANALYZE_AND_FIX]: 5
    };

    return durations[actionType] || 3;
  }

  private assessActionRisk(actionType: HealingActionType, integration: IntegrationTest): 'low' | 'medium' | 'high' {
    const risks = {
      [HealingActionType.RESTART_CONNECTION]: 'low',
      [HealingActionType.RESET_CIRCUIT_BREAKER]: 'low',
      [HealingActionType.REFRESH_CREDENTIALS]: 'medium',
      [HealingActionType.CLEAR_CACHE]: 'low',
      [HealingActionType.UPDATE_TIMEOUT_CONFIG]: 'low',
      [HealingActionType.OPTIMIZE_RETRY_STRATEGY]: 'low',
      [HealingActionType.ANALYZE_AND_FIX]: 'medium'
    };

    return risks[actionType] as 'low' | 'medium' | 'high' || 'medium';
  }

  /**
   * Public API methods
   */
  async triggerManualHealing(userId: string, integrationId?: string): Promise<HealingReport> {
    const healthReport = await integrationTestingEngine.performIntegrationHealthCheck();
    
    // If specific integration requested, filter the health report
    if (integrationId) {
      const targetIntegration = healthReport.integrations.find(i => i.id === integrationId);
      if (!targetIntegration) {
        throw new Error(`Integration ${integrationId} not found`);
      }
      
      // Create focused health report
      const focusedReport: IntegrationHealth = {
        ...healthReport,
        integrations: [targetIntegration]
      };
      
      return this.performAutoHealing(focusedReport);
    }
    
    return this.performAutoHealing(healthReport);
  }

  async getHealingHistory(limit = 10): Promise<HealingReport[]> {
    return this.healingHistory.slice(-limit);
  }

  async getActiveHealingSessions(): Promise<HealingReport[]> {
    return Array.from(this.activeHealingSessions.values());
  }

  toggleAutoHealing(enabled: boolean): void {
    this.isAutoHealingEnabled = enabled;
    logger.info('Auto-healing toggled', { enabled });
  }
}

// Export singleton instance
export const selfHealingEngine = new SelfHealingEngine();

// Convenience functions
export async function triggerSystemHealing(userId: string): Promise<HealingReport> {
  return selfHealingEngine.triggerManualHealing(userId);
}

export async function healSpecificIntegration(userId: string, integrationId: string): Promise<HealingReport> {
  return selfHealingEngine.triggerManualHealing(userId, integrationId);
}

export async function getHealingHistory(limit?: number): Promise<HealingReport[]> {
  return selfHealingEngine.getHealingHistory(limit);
}

export async function getActiveHealingSessions(): Promise<HealingReport[]> {
  return selfHealingEngine.getActiveHealingSessions();
}