/**
 * Autonomous Attribution Engine
 * ============================
 * Connects multi-touch attribution with autonomous decision-making
 * Enables AI to make data-driven decisions based on attribution insights
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';
import { EventEmitter } from 'events';
import { 
  AttributionModel, 
  ConversionCategory,
  EntityType,
  type ConversionEvent,
  type ConversionTracking
} from '@/types/prisma-types';
import { 
  trackConversion, 
  applyAttributionModel,
  getConversionAttribution,
  type TouchPoint
} from '@/lib/enhanced-conversions';
import { strategicDecisionEngine } from '@/lib/ai/strategic-decision-engine';
import { realtimeDecisionEngine } from '@/lib/ai/realtime-decision-engine';
import { multiAgentCoordinator } from '@/lib/ai/multi-agent-coordinator';

export interface AttributionInsight {
  id: string;
  timestamp: Date;
  type: 'channel_performance' | 'journey_pattern' | 'conversion_driver' | 'optimization_opportunity' | 'anomaly';
  confidence: number; // 0-1
  insight: string;
  details: {
    channels?: ChannelPerformance[];
    journeyPatterns?: JourneyPattern[];
    conversionDrivers?: ConversionDriver[];
    recommendations?: AttributionRecommendation[];
    impact?: BusinessImpact;
  };
  actionRequired: boolean;
  suggestedActions?: AutonomousAction[];
}

export interface ChannelPerformance {
  channel: string;
  entityType: EntityType;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  roas: number; // Return on Ad Spend
  attribution: {
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    positionBased: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  anomalies?: string[];
}

export interface JourneyPattern {
  id: string;
  pattern: TouchPoint[];
  frequency: number;
  avgTimeToConversion: number; // hours
  avgValue: number;
  conversionRate: number;
  channels: string[];
  significance: 'high' | 'medium' | 'low';
  insights: string[];
}

export interface ConversionDriver {
  factor: string;
  type: 'channel' | 'content' | 'timing' | 'frequency' | 'sequence';
  impact: number; // -1 to 1
  confidence: number; // 0-1
  description: string;
  examples: string[];
}

export interface AttributionRecommendation {
  id: string;
  type: 'budget_reallocation' | 'channel_optimization' | 'journey_optimization' | 'content_adjustment' | 'timing_change';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: {
    conversions: number; // percentage change
    revenue: number; // percentage change
    cost: number; // percentage change
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeframe: string;
    steps: string[];
  };
}

export interface BusinessImpact {
  revenue: {
    current: number;
    projected: number;
    change: number;
  };
  conversions: {
    current: number;
    projected: number;
    change: number;
  };
  efficiency: {
    currentCPA: number; // Cost Per Acquisition
    projectedCPA: number;
    currentROAS: number;
    projectedROAS: number;
  };
}

export interface AutonomousAction {
  id: string;
  type: 'immediate' | 'scheduled' | 'conditional';
  action: string;
  description: string;
  targetEntity: {
    type: EntityType;
    id: string;
  };
  parameters: Record<string, any>;
  trigger?: {
    condition: string;
    threshold: number;
  };
  approvalRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

class AutonomousAttributionEngine extends EventEmitter {
  private analysisInterval: NodeJS.Timeout | null = null;
  private decisionQueue: AutonomousAction[] = [];
  private insightHistory: Map<string, AttributionInsight[]> = new Map();
  private performanceBaseline: Map<string, ChannelPerformance> = new Map();

  constructor() {
    super();
    this.initializeEngine();
  }

  /**
   * Initialize the autonomous attribution engine
   */
  private async initializeEngine() {
    try {
      logger.info('Initializing autonomous attribution engine...');

      // Load performance baselines
      await this.loadPerformanceBaselines();

      // Start continuous analysis
      this.startContinuousAnalysis();

      // Register with strategic decision engine
      this.registerWithDecisionEngines();

      logger.info('Autonomous attribution engine initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize autonomous attribution engine', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Load historical performance baselines
   */
  private async loadPerformanceBaselines() {
    try {
      // Get last 30 days of conversion data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await fetch(`${BACKEND_URL}/api/conversions/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            occurredAt: { gte: thirtyDaysAgo.toISOString() }
          },
          include: {
            event: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion tracking: ${response.statusText}`);
      }

      const conversions = await response.json();

      // Calculate baseline performance by channel
      const channelData = new Map<string, any>();

      for (const conversion of conversions) {
        const touchPoints = conversion.touchPoints ? 
          JSON.parse(conversion.touchPoints as string) as TouchPoint[] : [];

        for (const touchPoint of touchPoints) {
          const key = `${touchPoint.entityType}_${touchPoint.type}`;
          
          if (!channelData.has(key)) {
            channelData.set(key, {
              conversions: 0,
              revenue: 0,
              touchPoints: []
            });
          }

          const data = channelData.get(key);
          data.conversions++;
          data.revenue += conversion.value || 0;
          data.touchPoints.push(touchPoint);
        }
      }

      // Convert to performance baselines
      for (const [key, data] of channelData.entries()) {
        const [entityType, channel] = key.split('_');
        
        const performance: ChannelPerformance = {
          channel,
          entityType: entityType as EntityType,
          conversions: data.conversions,
          revenue: data.revenue,
          cost: 0, // Would need cost data from campaigns
          roi: 0,
          roas: 0,
          attribution: {
            firstTouch: 0,
            lastTouch: 0,
            linear: 0,
            timeDecay: 0,
            positionBased: 0
          },
          trend: 'stable'
        };

        this.performanceBaseline.set(key, performance);
      }

      logger.info('Loaded performance baselines', {
        channels: this.performanceBaseline.size
      });

    } catch (error) {
      logger.error('Failed to load performance baselines', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Start continuous attribution analysis
   */
  private startContinuousAnalysis() {
    // Run analysis every 30 minutes
    this.analysisInterval = setInterval(async () => {
      await this.performAttributionAnalysis();
    }, 30 * 60 * 1000);

    // Run initial analysis
    this.performAttributionAnalysis();
  }

  /**
   * Perform comprehensive attribution analysis
   */
  private async performAttributionAnalysis() {
    const tracer = trace.getTracer('attribution-analysis');
    
    return tracer.startActiveSpan('analyze-attribution', async (span) => {
      try {
        span.setAttributes({
          'analysis.timestamp': Date.now(),
          'analysis.type': 'comprehensive'
        });

        logger.info('Starting autonomous attribution analysis...');

        // Analyze channel performance
        const channelInsights = await this.analyzeChannelPerformance();
        
        // Analyze customer journey patterns
        const journeyInsights = await this.analyzeJourneyPatterns();
        
        // Identify conversion drivers
        const driverInsights = await this.identifyConversionDrivers();
        
        // Detect anomalies
        const anomalyInsights = await this.detectAttributionAnomalies();
        
        // Generate optimization opportunities
        const optimizationInsights = await this.generateOptimizationOpportunities();

        // Process all insights
        const allInsights = [
          ...channelInsights,
          ...journeyInsights,
          ...driverInsights,
          ...anomalyInsights,
          ...optimizationInsights
        ];

        // Generate autonomous actions
        for (const insight of allInsights) {
          if (insight.actionRequired && insight.suggestedActions) {
            await this.processAutonomousActions(insight);
          }
        }

        // Store insights
        this.storeInsights(allInsights);

        // Emit analysis complete event
        this.emit('analysis_complete', {
          timestamp: new Date(),
          insightCount: allInsights.length,
          actionsGenerated: this.decisionQueue.length
        });

        logger.info('Attribution analysis completed', {
          insights: allInsights.length,
          actions: this.decisionQueue.length
        });

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Attribution analysis failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        span.end();
      }
    });
  }

  /**
   * Analyze channel performance across attribution models
   */
  private async analyzeChannelPerformance(): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    try {
      // Get recent conversions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const response = await fetch(`${BACKEND_URL}/api/conversions/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            occurredAt: { gte: sevenDaysAgo.toISOString() }
          },
          include: {
            event: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion tracking: ${response.statusText}`);
      }

      const conversions = await response.json();

      // Analyze by channel and attribution model
      const channelMetrics = new Map<string, ChannelPerformance>();
      const models: AttributionModel[] = [
        AttributionModel.FIRST_TOUCH,
        AttributionModel.LAST_TOUCH,
        AttributionModel.LINEAR,
        AttributionModel.TIME_DECAY,
        AttributionModel.POSITION_BASED
      ];

      for (const conversion of conversions) {
        const touchPoints = conversion.touchPoints ? 
          JSON.parse(conversion.touchPoints as string) as TouchPoint[] : [];

        if (touchPoints.length === 0) continue;

        // Apply each attribution model
        for (const model of models) {
          const attributedTouchPoints = applyAttributionModel(touchPoints, model);
          
          for (const touchPoint of attributedTouchPoints) {
            const key = `${touchPoint.entityType}_${touchPoint.type}`;
            
            if (!channelMetrics.has(key)) {
              channelMetrics.set(key, {
                channel: touchPoint.type,
                entityType: touchPoint.entityType,
                conversions: 0,
                revenue: 0,
                cost: 0,
                roi: 0,
                roas: 0,
                attribution: {
                  firstTouch: 0,
                  lastTouch: 0,
                  linear: 0,
                  timeDecay: 0,
                  positionBased: 0
                },
                trend: 'stable'
              });
            }

            const metrics = channelMetrics.get(key)!;
            const attributionKey = model.toLowerCase().replace('_', '') as keyof typeof metrics.attribution;
            
            metrics.conversions += touchPoint.weight || 0;
            metrics.revenue += (conversion.value || 0) * (touchPoint.weight || 0);
            metrics.attribution[attributionKey] += touchPoint.weight || 0;
          }
        }
      }

      // Compare with baselines and generate insights
      for (const [key, metrics] of channelMetrics.entries()) {
        const baseline = this.performanceBaseline.get(key);
        
        if (baseline) {
          // Calculate trend
          const conversionChange = (metrics.conversions - baseline.conversions) / baseline.conversions;
          metrics.trend = conversionChange > 0.1 ? 'improving' : 
                         conversionChange < -0.1 ? 'declining' : 'stable';

          // Check for significant changes
          if (Math.abs(conversionChange) > 0.2) {
            const insight: AttributionInsight = {
              id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              type: 'channel_performance',
              confidence: 0.85,
              insight: `${metrics.channel} channel ${metrics.trend} with ${Math.round(Math.abs(conversionChange) * 100)}% change in conversions`,
              details: {
                channels: [metrics],
                impact: {
                  revenue: {
                    current: metrics.revenue,
                    projected: metrics.revenue * (1 + conversionChange),
                    change: conversionChange
                  },
                  conversions: {
                    current: metrics.conversions,
                    projected: metrics.conversions * (1 + conversionChange),
                    change: conversionChange
                  },
                  efficiency: {
                    currentCPA: metrics.cost / metrics.conversions || 0,
                    projectedCPA: metrics.cost / (metrics.conversions * (1 + conversionChange)) || 0,
                    currentROAS: metrics.revenue / metrics.cost || 0,
                    projectedROAS: (metrics.revenue * (1 + conversionChange)) / metrics.cost || 0
                  }
                }
              },
              actionRequired: Math.abs(conversionChange) > 0.3,
              suggestedActions: this.generateChannelActions(metrics, conversionChange)
            };

            insights.push(insight);
          }
        }
      }

    } catch (error) {
      logger.error('Channel performance analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return insights;
  }

  /**
   * Analyze customer journey patterns
   */
  private async analyzeJourneyPatterns(): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    try {
      // Get conversions with multiple touchpoints
      const response = await fetch(`${BACKEND_URL}/api/conversions/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            touchPoints: { not: null }
          },
          include: {
            event: true
          },
          take: 1000,
          orderBy: { occurredAt: 'desc' }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion tracking: ${response.statusText}`);
      }

      const conversions = await response.json();

      // Extract journey patterns
      const patternMap = new Map<string, JourneyPattern>();

      for (const conversion of conversions) {
        const touchPoints = JSON.parse(conversion.touchPoints as string) as TouchPoint[];
        
        if (touchPoints.length < 2) continue;

        // Create pattern key
        const patternKey = touchPoints
          .map(tp => `${tp.entityType}_${tp.type}`)
          .join(' -> ');

        if (!patternMap.has(patternKey)) {
          patternMap.set(patternKey, {
            id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            pattern: touchPoints,
            frequency: 0,
            avgTimeToConversion: 0,
            avgValue: 0,
            conversionRate: 0,
            channels: [...new Set(touchPoints.map(tp => tp.type))],
            significance: 'low',
            insights: []
          });
        }

        const pattern = patternMap.get(patternKey)!;
        pattern.frequency++;
        pattern.avgValue = (pattern.avgValue * (pattern.frequency - 1) + (conversion.value || 0)) / pattern.frequency;
        
        // Calculate time to conversion
        const firstTouch = new Date(touchPoints[0].timestamp);
        const lastTouch = new Date(touchPoints[touchPoints.length - 1].timestamp);
        const timeToConversion = (lastTouch.getTime() - firstTouch.getTime()) / (1000 * 60 * 60); // hours
        
        pattern.avgTimeToConversion = (pattern.avgTimeToConversion * (pattern.frequency - 1) + timeToConversion) / pattern.frequency;
      }

      // Analyze significant patterns
      const totalConversions = conversions.length;
      
      for (const pattern of patternMap.values()) {
        pattern.conversionRate = pattern.frequency / totalConversions;
        pattern.significance = pattern.conversionRate > 0.1 ? 'high' : 
                              pattern.conversionRate > 0.05 ? 'medium' : 'low';

        if (pattern.significance !== 'low') {
          // Generate insights
          pattern.insights = this.generateJourneyInsights(pattern);

          const insight: AttributionInsight = {
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            type: 'journey_pattern',
            confidence: Math.min(0.6 + pattern.conversionRate, 0.95),
            insight: `Discovered ${pattern.significance} value journey pattern with ${Math.round(pattern.conversionRate * 100)}% of conversions`,
            details: {
              journeyPatterns: [pattern]
            },
            actionRequired: pattern.significance === 'high',
            suggestedActions: pattern.significance === 'high' ? 
              this.generateJourneyActions(pattern) : undefined
          };

          insights.push(insight);
        }
      }

    } catch (error) {
      logger.error('Journey pattern analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return insights;
  }

  /**
   * Identify key conversion drivers
   */
  private async identifyConversionDrivers(): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    try {
      // Analyze various conversion factors
      const drivers: ConversionDriver[] = [];

      // Channel sequence analysis
      const sequenceDriver = await this.analyzeChannelSequence();
      if (sequenceDriver) drivers.push(sequenceDriver);

      // Timing analysis
      const timingDriver = await this.analyzeConversionTiming();
      if (timingDriver) drivers.push(timingDriver);

      // Frequency analysis
      const frequencyDriver = await this.analyzeTouchpointFrequency();
      if (frequencyDriver) drivers.push(frequencyDriver);

      // Content type analysis
      const contentDriver = await this.analyzeContentPerformance();
      if (contentDriver) drivers.push(contentDriver);

      // Create insights for significant drivers
      const significantDrivers = drivers.filter(d => Math.abs(d.impact) > 0.2);

      if (significantDrivers.length > 0) {
        const insight: AttributionInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'conversion_driver',
          confidence: 0.8,
          insight: `Identified ${significantDrivers.length} key conversion drivers`,
          details: {
            conversionDrivers: significantDrivers,
            recommendations: this.generateDriverRecommendations(significantDrivers)
          },
          actionRequired: significantDrivers.some(d => Math.abs(d.impact) > 0.4),
          suggestedActions: this.generateDriverActions(significantDrivers)
        };

        insights.push(insight);
      }

    } catch (error) {
      logger.error('Conversion driver analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return insights;
  }

  /**
   * Detect attribution anomalies
   */
  private async detectAttributionAnomalies(): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    try {
      // Compare current performance with historical patterns
      const anomalies: string[] = [];

      // Check for sudden channel performance changes
      for (const [key, baseline] of this.performanceBaseline.entries()) {
        const current = await this.getCurrentChannelMetrics(key);
        
        if (current) {
          const conversionChange = Math.abs((current.conversions - baseline.conversions) / baseline.conversions);
          const revenueChange = Math.abs((current.revenue - baseline.revenue) / baseline.revenue);

          if (conversionChange > 0.5 || revenueChange > 0.5) {
            anomalies.push(`${baseline.channel} showing ${Math.round(Math.max(conversionChange, revenueChange) * 100)}% deviation from baseline`);
          }
        }
      }

      // Check for unusual journey patterns
      const unusualPatterns = await this.detectUnusualJourneys();
      anomalies.push(...unusualPatterns);

      if (anomalies.length > 0) {
        const insight: AttributionInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'anomaly',
          confidence: 0.75,
          insight: `Detected ${anomalies.length} attribution anomalies requiring attention`,
          details: {
            channels: anomalies.map(a => ({
              channel: a,
              entityType: EntityType.CAMPAIGN,
              conversions: 0,
              revenue: 0,
              cost: 0,
              roi: 0,
              roas: 0,
              attribution: {
                firstTouch: 0,
                lastTouch: 0,
                linear: 0,
                timeDecay: 0,
                positionBased: 0
              },
              trend: 'stable' as const,
              anomalies: [a]
            }))
          },
          actionRequired: true,
          suggestedActions: [{
            id: `action_${Date.now()}`,
            type: 'immediate',
            action: 'investigate_anomalies',
            description: 'Investigate and address attribution anomalies',
            targetEntity: {
              type: EntityType.CAMPAIGN,
              id: 'all'
            },
            parameters: { anomalies },
            approvalRequired: false,
            riskLevel: 'low'
          }]
        };

        insights.push(insight);
      }

    } catch (error) {
      logger.error('Anomaly detection failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return insights;
  }

  /**
   * Generate optimization opportunities
   */
  private async generateOptimizationOpportunities(): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    try {
      const recommendations: AttributionRecommendation[] = [];

      // Budget reallocation opportunities
      const budgetReco = await this.analyzeBudgetAllocation();
      if (budgetReco) recommendations.push(budgetReco);

      // Channel mix optimization
      const channelMixReco = await this.optimizeChannelMix();
      if (channelMixReco) recommendations.push(channelMixReco);

      // Journey optimization
      const journeyReco = await this.optimizeCustomerJourneys();
      if (journeyReco) recommendations.push(journeyReco);

      // Timing optimization
      const timingReco = await this.optimizeCampaignTiming();
      if (timingReco) recommendations.push(timingReco);

      if (recommendations.length > 0) {
        const insight: AttributionInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'optimization_opportunity',
          confidence: 0.85,
          insight: `Identified ${recommendations.length} optimization opportunities`,
          details: {
            recommendations,
            impact: this.calculateTotalImpact(recommendations)
          },
          actionRequired: recommendations.some(r => r.priority === 'high'),
          suggestedActions: this.generateOptimizationActions(recommendations)
        };

        insights.push(insight);
      }

    } catch (error) {
      logger.error('Optimization analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return insights;
  }

  /**
   * Process autonomous actions based on insights
   */
  private async processAutonomousActions(insight: AttributionInsight) {
    if (!insight.suggestedActions) return;

    for (const action of insight.suggestedActions) {
      // Check risk level and approval requirements
      if (action.riskLevel === 'high' || action.approvalRequired) {
        // Queue for approval
        await this.queueForApproval(action, insight);
      } else if (action.type === 'immediate') {
        // Execute immediately
        await this.executeAutonomousAction(action);
      } else if (action.type === 'scheduled') {
        // Schedule for later execution
        await this.scheduleAction(action);
      } else if (action.type === 'conditional') {
        // Set up monitoring for trigger condition
        await this.setupConditionalTrigger(action);
      }
    }
  }

  /**
   * Execute an autonomous action
   */
  private async executeAutonomousAction(action: AutonomousAction) {
    const tracer = trace.getTracer('autonomous-attribution');
    
    return tracer.startActiveSpan('execute-action', async (span) => {
      try {
        span.setAttributes({
          'action.id': action.id,
          'action.type': action.type,
          'action.riskLevel': action.riskLevel
        });

        logger.info('Executing autonomous attribution action', {
          actionId: action.id,
          action: action.action,
          targetEntity: action.targetEntity
        });

        // Execute based on action type
        switch (action.action) {
          case 'reallocate_budget':
            await this.executeBudgetReallocation(action);
            break;

          case 'adjust_channel_mix':
            await this.executeChannelMixAdjustment(action);
            break;

          case 'optimize_journey':
            await this.executeJourneyOptimization(action);
            break;

          case 'update_attribution_model':
            await this.updateAttributionModel(action);
            break;

          case 'pause_underperforming':
            await this.pauseUnderperformingChannels(action);
            break;

          case 'scale_high_performers':
            await this.scaleHighPerformingChannels(action);
            break;

          default:
            logger.warn('Unknown autonomous action', { action: action.action });
        }

        // Emit action executed event
        this.emit('action_executed', {
          actionId: action.id,
          action: action.action,
          timestamp: new Date(),
          success: true
        });

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Autonomous action execution failed', {
          actionId: action.id,
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        span.end();
      }
    });
  }

  /**
   * Register with decision engines for coordination
   */
  private registerWithDecisionEngines() {
    // Register attribution insights provider
    strategicDecisionEngine.registerDataProvider('attribution', {
      getInsights: async () => this.getRecentInsights(),
      getMetrics: async () => this.getAttributionMetrics(),
      getRecommendations: async () => this.getAttributionRecommendations()
    });

    // Register real-time attribution handler
    realtimeDecisionEngine.registerHandler('attribution_change', async (event) => {
      await this.handleRealtimeAttributionChange(event);
    });

    // Register with multi-agent coordinator
    multiAgentCoordinator.on('collaboration_request', async (request) => {
      if (request.capabilities.includes('attribution')) {
        await this.participateInCollaboration(request);
      }
    });
  }

  /**
   * Get recent attribution insights
   */
  async getRecentInsights(hours = 24): Promise<AttributionInsight[]> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const allInsights: AttributionInsight[] = [];
    
    for (const insights of this.insightHistory.values()) {
      allInsights.push(...insights.filter(i => i.timestamp > cutoff));
    }

    return allInsights.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get current attribution metrics
   */
  async getAttributionMetrics(): Promise<Record<string, any>> {
    const metrics = {
      totalConversions: 0,
      totalRevenue: 0,
      avgTimeToConversion: 0,
      topChannels: [] as any[],
      attributionHealth: 'good' as 'excellent' | 'good' | 'warning' | 'critical'
    };

    // Calculate metrics from recent data
    const response = await fetch(`${BACKEND_URL}/api/conversions/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: {
          occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversion tracking: ${response.statusText}`);
    }

    const recentConversions = await response.json();

    metrics.totalConversions = recentConversions.length;
    metrics.totalRevenue = recentConversions.reduce((sum, c) => sum + (c.value || 0), 0);

    return metrics;
  }

  /**
   * Get attribution-based recommendations
   */
  async getAttributionRecommendations(): Promise<AttributionRecommendation[]> {
    const insights = await this.getRecentInsights(168); // Last week
    const recommendations: AttributionRecommendation[] = [];

    for (const insight of insights) {
      if (insight.details.recommendations) {
        recommendations.push(...insight.details.recommendations);
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Handle real-time attribution changes
   */
  private async handleRealtimeAttributionChange(event: any) {
    logger.info('Handling real-time attribution change', { event });

    // Trigger immediate analysis if significant
    if (event.significance === 'high') {
      await this.performAttributionAnalysis();
    }
  }

  /**
   * Participate in multi-agent collaboration
   */
  private async participateInCollaboration(request: any) {
    logger.info('Participating in multi-agent collaboration for attribution', {
      sessionId: request.sessionId,
      objective: request.objective
    });

    // Provide attribution insights for collaboration
    const insights = await this.getRecentInsights();
    const metrics = await this.getAttributionMetrics();

    return {
      agentId: 'attribution_engine',
      insights,
      metrics,
      recommendations: await this.getAttributionRecommendations()
    };
  }

  // Helper methods for generating actions and recommendations

  private generateChannelActions(metrics: ChannelPerformance, change: number): AutonomousAction[] {
    const actions: AutonomousAction[] = [];

    if (change > 0.3) {
      // Channel performing well - scale up
      actions.push({
        id: `action_${Date.now()}_scale`,
        type: 'immediate',
        action: 'scale_high_performers',
        description: `Scale up ${metrics.channel} channel due to ${Math.round(change * 100)}% improvement`,
        targetEntity: {
          type: metrics.entityType,
          id: metrics.channel
        },
        parameters: {
          scalePercentage: Math.min(50, Math.round(change * 100))
        },
        approvalRequired: change > 0.5,
        riskLevel: change > 0.5 ? 'medium' : 'low'
      });
    } else if (change < -0.3) {
      // Channel underperforming - investigate or pause
      actions.push({
        id: `action_${Date.now()}_pause`,
        type: 'conditional',
        action: 'pause_underperforming',
        description: `Consider pausing ${metrics.channel} channel due to ${Math.round(Math.abs(change) * 100)}% decline`,
        targetEntity: {
          type: metrics.entityType,
          id: metrics.channel
        },
        parameters: {
          threshold: -0.4
        },
        trigger: {
          condition: 'performance_below_threshold',
          threshold: -0.4
        },
        approvalRequired: true,
        riskLevel: 'medium'
      });
    }

    return actions;
  }

  private generateJourneyInsights(pattern: JourneyPattern): string[] {
    const insights: string[] = [];

    if (pattern.avgTimeToConversion < 24) {
      insights.push('Fast conversion journey - customers decide quickly');
    } else if (pattern.avgTimeToConversion > 168) {
      insights.push('Long consideration period - nurturing required');
    }

    if (pattern.channels.length > 3) {
      insights.push('Multi-channel journey - coordination important');
    }

    if (pattern.avgValue > 1000) {
      insights.push('High-value conversion path - prioritize optimization');
    }

    return insights;
  }

  private generateJourneyActions(pattern: JourneyPattern): AutonomousAction[] {
    return [{
      id: `action_${Date.now()}_optimize_journey`,
      type: 'scheduled',
      action: 'optimize_journey',
      description: `Optimize high-value journey pattern with ${pattern.frequency} conversions`,
      targetEntity: {
        type: EntityType.WORKFLOW,
        id: 'journey_optimization'
      },
      parameters: {
        pattern: pattern.pattern,
        targetConversionRate: pattern.conversionRate * 1.2
      },
      approvalRequired: false,
      riskLevel: 'low'
    }];
  }

  private generateDriverRecommendations(drivers: ConversionDriver[]): AttributionRecommendation[] {
    return drivers.map(driver => ({
      id: `reco_${Date.now()}_${driver.factor}`,
      type: driver.type === 'channel' ? 'channel_optimization' : 
            driver.type === 'timing' ? 'timing_change' : 'content_adjustment',
      priority: Math.abs(driver.impact) > 0.4 ? 'high' : 'medium',
      description: driver.description,
      expectedImpact: {
        conversions: driver.impact * 20,
        revenue: driver.impact * 25,
        cost: 5
      },
      implementation: {
        difficulty: 'medium',
        timeframe: '1-2 weeks',
        steps: [`Analyze ${driver.factor}`, 'Implement changes', 'Monitor results']
      }
    }));
  }

  private generateDriverActions(drivers: ConversionDriver[]): AutonomousAction[] {
    const highImpactDrivers = drivers.filter(d => Math.abs(d.impact) > 0.4);
    
    return highImpactDrivers.map(driver => ({
      id: `action_${Date.now()}_${driver.factor}`,
      type: 'scheduled',
      action: 'implement_driver_optimization',
      description: `Optimize ${driver.factor} based on attribution analysis`,
      targetEntity: {
        type: EntityType.CAMPAIGN,
        id: 'all'
      },
      parameters: {
        driver,
        optimization: driver.type
      },
      approvalRequired: driver.type === 'budget_reallocation',
      riskLevel: driver.type === 'budget_reallocation' ? 'medium' : 'low'
    }));
  }

  private calculateTotalImpact(recommendations: AttributionRecommendation[]): BusinessImpact {
    const current = { revenue: 100000, conversions: 1000 }; // Example baseline
    
    const projectedRevenue = recommendations.reduce((sum, r) => 
      sum + (current.revenue * (r.expectedImpact.revenue / 100)), current.revenue);
    
    const projectedConversions = recommendations.reduce((sum, r) => 
      sum + (current.conversions * (r.expectedImpact.conversions / 100)), current.conversions);

    return {
      revenue: {
        current: current.revenue,
        projected: projectedRevenue,
        change: (projectedRevenue - current.revenue) / current.revenue
      },
      conversions: {
        current: current.conversions,
        projected: projectedConversions,
        change: (projectedConversions - current.conversions) / current.conversions
      },
      efficiency: {
        currentCPA: 50,
        projectedCPA: 45,
        currentROAS: 4,
        projectedROAS: 4.5
      }
    };
  }

  private generateOptimizationActions(recommendations: AttributionRecommendation[]): AutonomousAction[] {
    return recommendations
      .filter(r => r.priority === 'high')
      .map(r => ({
        id: `action_${Date.now()}_${r.type}`,
        type: 'scheduled' as const,
        action: `implement_${r.type}`,
        description: r.description,
        targetEntity: {
          type: EntityType.CAMPAIGN,
          id: 'optimization_target'
        },
        parameters: {
          recommendation: r,
          steps: r.implementation.steps
        },
        approvalRequired: r.implementation.difficulty === 'hard',
        riskLevel: r.implementation.difficulty === 'hard' ? 'high' : 
                   r.implementation.difficulty === 'medium' ? 'medium' : 'low'
      }));
  }

  // Stub methods for specific analyses
  private async analyzeChannelSequence(): Promise<ConversionDriver | null> {
    // Implementation would analyze optimal channel sequences
    return null;
  }

  private async analyzeConversionTiming(): Promise<ConversionDriver | null> {
    // Implementation would analyze optimal timing patterns
    return null;
  }

  private async analyzeTouchpointFrequency(): Promise<ConversionDriver | null> {
    // Implementation would analyze optimal contact frequency
    return null;
  }

  private async analyzeContentPerformance(): Promise<ConversionDriver | null> {
    // Implementation would analyze content effectiveness
    return null;
  }

  private async getCurrentChannelMetrics(key: string): Promise<ChannelPerformance | null> {
    // Implementation would fetch current metrics
    return null;
  }

  private async detectUnusualJourneys(): Promise<string[]> {
    // Implementation would detect anomalous journey patterns
    return [];
  }

  private async analyzeBudgetAllocation(): Promise<AttributionRecommendation | null> {
    // Implementation would analyze and recommend budget changes
    return null;
  }

  private async optimizeChannelMix(): Promise<AttributionRecommendation | null> {
    // Implementation would recommend channel mix changes
    return null;
  }

  private async optimizeCustomerJourneys(): Promise<AttributionRecommendation | null> {
    // Implementation would recommend journey optimizations
    return null;
  }

  private async optimizeCampaignTiming(): Promise<AttributionRecommendation | null> {
    // Implementation would recommend timing optimizations
    return null;
  }

  private async queueForApproval(action: AutonomousAction, insight: AttributionInsight) {
    logger.info('Queueing action for approval', {
      actionId: action.id,
      insightId: insight.id
    });
  }

  private async scheduleAction(action: AutonomousAction) {
    logger.info('Scheduling action for later execution', {
      actionId: action.id
    });
  }

  private async setupConditionalTrigger(action: AutonomousAction) {
    logger.info('Setting up conditional trigger for action', {
      actionId: action.id,
      trigger: action.trigger
    });
  }

  private async executeBudgetReallocation(action: AutonomousAction) {
    logger.info('Executing budget reallocation', action.parameters);
  }

  private async executeChannelMixAdjustment(action: AutonomousAction) {
    logger.info('Executing channel mix adjustment', action.parameters);
  }

  private async executeJourneyOptimization(action: AutonomousAction) {
    logger.info('Executing journey optimization', action.parameters);
  }

  private async updateAttributionModel(action: AutonomousAction) {
    logger.info('Updating attribution model', action.parameters);
  }

  private async pauseUnderperformingChannels(action: AutonomousAction) {
    logger.info('Pausing underperforming channels', action.parameters);
  }

  private async scaleHighPerformingChannels(action: AutonomousAction) {
    logger.info('Scaling high performing channels', action.parameters);
  }

  private storeInsights(insights: AttributionInsight[]) {
    const key = new Date().toISOString().split('T')[0]; // Daily key
    
    if (!this.insightHistory.has(key)) {
      this.insightHistory.set(key, []);
    }
    
    this.insightHistory.get(key)!.push(...insights);
    
    // Keep only last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    
    for (const [date, _] of this.insightHistory.entries()) {
      if (new Date(date) < cutoff) {
        this.insightHistory.delete(date);
      }
    }
  }

  /**
   * Cleanup and stop the engine
   */
  destroy() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.removeAllListeners();
    logger.info('Autonomous attribution engine destroyed');
  }
}

// Export singleton instance
export const autonomousAttributionEngine = new AutonomousAttributionEngine();

// Export types
export { AutonomousAttributionEngine };