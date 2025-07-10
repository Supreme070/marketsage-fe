/**
 * Advanced Workflow Trigger Engine
 * ================================
 * ML-powered intelligent trigger system for MarketSage workflows
 * 
 * Features:
 * 🧠 Machine learning-based trigger scoring
 * 🎯 Behavioral pattern recognition  
 * 📊 Real-time customer engagement analysis
 * 🚀 Predictive trigger optimization
 * 🌍 African market intelligence integration
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { SupremeAI } from '@/lib/ai/supreme-ai-engine';
import { workflowEngine } from '@/lib/workflow/execution-engine';

// Enhanced trigger types
export type AdvancedTriggerType = 
  | 'behavioral_score_threshold'
  | 'engagement_drop_detection'
  | 'churn_risk_alert'
  | 'purchase_intent_spike'
  | 'optimal_engagement_window'
  | 'seasonal_behavior_pattern'
  | 'competitor_activity_response'
  | 'market_trend_alignment'
  | 'cultural_event_timing'
  | 'payment_behavior_change';

export interface AdvancedTriggerCondition {
  id: string;
  type: AdvancedTriggerType;
  enabled: boolean;
  confidence_threshold: number; // 0.0 - 1.0
  parameters: Record<string, any>;
  ml_model_version?: string;
  african_market_context?: {
    countries: string[];
    cultural_factors: string[];
    local_timing_preferences: boolean;
  };
}

export interface TriggerEvaluationResult {
  shouldTrigger: boolean;
  confidence: number;
  reasoning: string;
  metadata: Record<string, any>;
  african_context?: {
    optimal_timing: Date;
    cultural_relevance: number;
    local_market_factors: string[];
  };
}

export interface CustomerBehaviorData {
  contactId: string;
  recent_activities: any[];
  engagement_scores: number[];
  purchase_history: any[];
  interaction_patterns: any[];
  churn_indicators: any[];
  market_context: {
    country: string;
    timezone: string;
    currency: string;
    local_events: any[];
  };
}

export class AdvancedWorkflowTriggerEngine {
  private supremeAI: typeof SupremeAI;
  private behaviorCache: Map<string, CustomerBehaviorData> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supremeAI = SupremeAI;
  }

  /**
   * Evaluate if a workflow should be triggered based on advanced ML conditions
   */
  async evaluateAdvancedTrigger(
    workflowId: string,
    contactId: string,
    triggerConditions: AdvancedTriggerCondition[]
  ): Promise<TriggerEvaluationResult> {
    try {
      logger.info('Evaluating advanced workflow trigger', {
        workflowId,
        contactId,
        conditionCount: triggerConditions.length
      });

      // Get comprehensive customer behavior data
      const behaviorData = await this.getCustomerBehaviorData(contactId);
      
      // Evaluate each trigger condition
      const evaluationResults = await Promise.all(
        triggerConditions.map(condition => 
          this.evaluateSingleCondition(condition, behaviorData)
        )
      );

      // Combine results using weighted scoring
      const combinedResult = this.combineEvaluationResults(evaluationResults);
      
      // Apply African market context if applicable
      if (this.hasAfricanMarketContext(triggerConditions)) {
        combinedResult.african_context = await this.enhanceWithAfricanContext(
          behaviorData, 
          combinedResult
        );
      }

      logger.info('Advanced trigger evaluation completed', {
        workflowId,
        contactId,
        shouldTrigger: combinedResult.shouldTrigger,
        confidence: combinedResult.confidence,
        hasAfricanContext: !!combinedResult.african_context
      });

      return combinedResult;
    } catch (error) {
      logger.error('Advanced trigger evaluation failed', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
        contactId
      });

      return {
        shouldTrigger: false,
        confidence: 0,
        reasoning: 'Evaluation failed due to system error',
        metadata: { error: true }
      };
    }
  }

  /**
   * Start workflow if advanced triggers are met
   */
  async triggerWorkflowIfConditionsMet(
    workflowId: string,
    contactId: string,
    triggerConditions: AdvancedTriggerCondition[]
  ): Promise<{ triggered: boolean; executionId?: string; result: TriggerEvaluationResult }> {
    const result = await this.evaluateAdvancedTrigger(workflowId, contactId, triggerConditions);
    
    if (result.shouldTrigger) {
      try {
        const executionId = await workflowEngine.startWorkflowExecution(
          workflowId,
          contactId,
          {
            trigger_type: 'advanced_ml',
            confidence: result.confidence,
            reasoning: result.reasoning,
            metadata: result.metadata,
            african_context: result.african_context
          }
        );

        // Log successful ML-triggered workflow
        await this.logTriggerEvent(workflowId, contactId, result, executionId);

        return { triggered: true, executionId, result };
      } catch (executionError) {
        logger.error('Failed to start workflow after trigger evaluation', {
          error: executionError,
          workflowId,
          contactId,
          triggerResult: result
        });
        return { triggered: false, result };
      }
    }

    return { triggered: false, result };
  }

  /**
   * Get comprehensive customer behavior data for ML analysis
   */
  private async getCustomerBehaviorData(contactId: string): Promise<CustomerBehaviorData> {
    // Check cache first
    const cached = this.behaviorCache.get(contactId);
    if (cached && Date.now() - cached.market_context.local_events.length < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const [contact, activities, emailActivities, smsActivities, workflowExecutions] = await Promise.all([
        prisma.contact.findUnique({
          where: { id: contactId },
          include: { lists: true }
        }),
        prisma.userActivity.findMany({
          where: { userId: contactId },
          take: 50,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.emailActivity.findMany({
          where: { contactId },
          take: 30,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.sMSActivity.findMany({
          where: { contactId },
          take: 20,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.workflowExecution.findMany({
          where: { contactId },
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: { workflow: true }
        })
      ]);

      if (!contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }

      // Calculate engagement scores over time
      const engagementScores = this.calculateEngagementScores(emailActivities, smsActivities, activities);
      
      // Extract interaction patterns
      const interactionPatterns = this.analyzeInteractionPatterns(activities, emailActivities);
      
      // Identify churn indicators
      const churnIndicators = this.identifyChurnIndicators(contact, activities, engagementScores);

      const behaviorData: CustomerBehaviorData = {
        contactId,
        recent_activities: activities,
        engagement_scores: engagementScores,
        purchase_history: [], // TODO: Add purchase tracking
        interaction_patterns: interactionPatterns,
        churn_indicators: churnIndicators,
        market_context: {
          country: contact.country || 'NG', // Default to Nigeria
          timezone: contact.timezone || 'Africa/Lagos',
          currency: contact.currency || 'NGN',
          local_events: [] // TODO: Add local events/holidays
        }
      };

      // Cache the result
      this.behaviorCache.set(contactId, behaviorData);

      return behaviorData;
    } catch (error) {
      logger.error('Failed to get customer behavior data', {
        error: error instanceof Error ? error.message : String(error),
        contactId
      });
      throw error;
    }
  }

  /**
   * Evaluate a single advanced trigger condition
   */
  private async evaluateSingleCondition(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    switch (condition.type) {
      case 'behavioral_score_threshold':
        return await this.evaluateBehavioralScoreThreshold(condition, behaviorData);
      
      case 'engagement_drop_detection':
        return await this.evaluateEngagementDropDetection(condition, behaviorData);
      
      case 'churn_risk_alert':
        return await this.evaluateChurnRiskAlert(condition, behaviorData);
      
      case 'purchase_intent_spike':
        return await this.evaluatePurchaseIntentSpike(condition, behaviorData);
      
      case 'optimal_engagement_window':
        return await this.evaluateOptimalEngagementWindow(condition, behaviorData);
      
      case 'seasonal_behavior_pattern':
        return await this.evaluateSeasonalBehaviorPattern(condition, behaviorData);
      
      case 'cultural_event_timing':
        return await this.evaluateCulturalEventTiming(condition, behaviorData);
      
      case 'payment_behavior_change':
        return await this.evaluatePaymentBehaviorChange(condition, behaviorData);

      default:
        return {
          shouldTrigger: false,
          confidence: 0,
          reasoning: `Unknown trigger condition type: ${condition.type}`,
          metadata: { condition_type: condition.type }
        };
    }
  }

  /**
   * Evaluate behavioral score threshold trigger
   */
  private async evaluateBehavioralScoreThreshold(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const threshold = condition.parameters.score_threshold || 0.7;
    const timeWindow = condition.parameters.time_window_days || 7;
    
    // Use Supreme AI to analyze behavioral patterns
    const analysis = await this.supremeAI.analyzeCustomerBehavior([{
      engagement_scores: behaviorData.engagement_scores,
      recent_activities: behaviorData.recent_activities.slice(0, timeWindow * 5), // ~5 activities per day
      interaction_patterns: behaviorData.interaction_patterns
    }]);

    const behavioralScore = analysis.data.behavioralScore || 0;
    const shouldTrigger = behavioralScore >= threshold;
    const confidence = analysis.confidence || 0.5;

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Behavioral score (${behavioralScore.toFixed(2)}) ${shouldTrigger ? 'exceeds' : 'below'} threshold (${threshold})`,
      metadata: {
        behavioral_score: behavioralScore,
        threshold,
        time_window_days: timeWindow,
        analysis_method: 'supreme_ai'
      }
    };
  }

  /**
   * Evaluate engagement drop detection
   */
  private async evaluateEngagementDropDetection(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const dropThreshold = condition.parameters.drop_percentage || 0.3; // 30% drop
    const compareWindow = condition.parameters.compare_window_days || 14;
    
    if (behaviorData.engagement_scores.length < 2) {
      return {
        shouldTrigger: false,
        confidence: 0,
        reasoning: 'Insufficient engagement data for drop detection',
        metadata: { scores_available: behaviorData.engagement_scores.length }
      };
    }

    const recentEngagement = behaviorData.engagement_scores.slice(0, Math.ceil(compareWindow / 2)).reduce((a, b) => a + b, 0);
    const previousEngagement = behaviorData.engagement_scores.slice(Math.ceil(compareWindow / 2)).reduce((a, b) => a + b, 0);
    
    const recentAvg = recentEngagement / Math.ceil(compareWindow / 2);
    const previousAvg = previousEngagement / Math.ceil(compareWindow / 2);
    
    const dropPercentage = previousAvg > 0 ? (previousAvg - recentAvg) / previousAvg : 0;
    const shouldTrigger = dropPercentage >= dropThreshold;
    
    // Higher confidence for larger drops
    const confidence = Math.min(0.95, 0.5 + dropPercentage);

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Engagement dropped by ${(dropPercentage * 100).toFixed(1)}% over ${compareWindow} days`,
      metadata: {
        drop_percentage: dropPercentage,
        recent_avg_engagement: recentAvg,
        previous_avg_engagement: previousAvg,
        threshold: dropThreshold
      }
    };
  }

  /**
   * Evaluate churn risk alert
   */
  private async evaluateChurnRiskAlert(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const riskThreshold = condition.parameters.risk_threshold || 0.6;
    
    // Calculate churn risk based on multiple factors
    let riskScore = 0;
    const factors = [];

    // Factor 1: Declining engagement
    if (behaviorData.engagement_scores.length >= 3) {
      const trend = this.calculateTrend(behaviorData.engagement_scores.slice(0, 3));
      if (trend < -0.1) {
        riskScore += 0.3;
        factors.push('declining_engagement');
      }
    }

    // Factor 2: Reduced activity frequency
    const recentActivityCount = behaviorData.recent_activities.filter(
      a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    if (recentActivityCount < 2) {
      riskScore += 0.4;
      factors.push('low_activity');
    }

    // Factor 3: Time since last interaction
    const lastActivity = behaviorData.recent_activities[0];
    if (lastActivity) {
      const daysSinceLastActivity = (Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 14) {
        riskScore += 0.3;
        factors.push('inactive_period');
      }
    }

    const shouldTrigger = riskScore >= riskThreshold;
    const confidence = Math.min(0.9, 0.4 + riskScore * 0.5);

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Churn risk score: ${riskScore.toFixed(2)} (${factors.join(', ')})`,
      metadata: {
        risk_score: riskScore,
        risk_factors: factors,
        threshold: riskThreshold,
        days_since_last_activity: lastActivity ? (Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24) : null
      }
    };
  }

  /**
   * Evaluate purchase intent spike
   */
  private async evaluatePurchaseIntentSpike(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    // Analyze recent activities for purchase intent signals
    const intentSignals = this.analyzePurchaseIntentSignals(behaviorData.recent_activities);
    const intentScore = intentSignals.score;
    const threshold = condition.parameters.intent_threshold || 0.7;
    
    const shouldTrigger = intentScore >= threshold;
    const confidence = Math.min(0.9, 0.5 + intentScore * 0.4);

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Purchase intent score: ${intentScore.toFixed(2)} based on ${intentSignals.signals.length} signals`,
      metadata: {
        intent_score: intentScore,
        intent_signals: intentSignals.signals,
        threshold,
        signal_count: intentSignals.signals.length
      }
    };
  }

  /**
   * Evaluate optimal engagement window
   */
  private async evaluateOptimalEngagementWindow(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const currentHour = new Date().getHours();
    const timezone = behaviorData.market_context.timezone;
    
    // Analyze historical engagement patterns by hour
    const hourlyPatterns = this.analyzeHourlyEngagementPatterns(behaviorData.interaction_patterns);
    const currentHourEngagement = hourlyPatterns[currentHour] || 0;
    const avgEngagement = Object.values(hourlyPatterns).reduce((a, b) => a + b, 0) / 24;
    
    const isOptimalWindow = currentHourEngagement > avgEngagement * 1.2; // 20% above average
    const confidence = Math.min(0.9, currentHourEngagement / Math.max(avgEngagement, 0.1));

    return {
      shouldTrigger: isOptimalWindow && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Current hour (${currentHour}) has ${(currentHourEngagement / avgEngagement * 100).toFixed(0)}% of average engagement`,
      metadata: {
        current_hour: currentHour,
        current_hour_engagement: currentHourEngagement,
        average_engagement: avgEngagement,
        timezone,
        optimal_window: isOptimalWindow
      }
    };
  }

  /**
   * Evaluate seasonal behavior pattern
   */
  private async evaluateSeasonalBehaviorPattern(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const now = new Date();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();
    
    // Seasonal factors for African markets
    const seasonalFactors = this.getAfricanSeasonalFactors(month, behaviorData.market_context.country);
    const weekdayFactor = this.getWeekdayFactor(dayOfWeek, behaviorData.market_context.country);
    
    const combinedFactor = (seasonalFactors + weekdayFactor) / 2;
    const threshold = condition.parameters.seasonal_threshold || 0.6;
    
    const shouldTrigger = combinedFactor >= threshold;
    const confidence = Math.min(0.8, 0.5 + combinedFactor * 0.3);

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: `Seasonal behavior factor: ${combinedFactor.toFixed(2)} (month: ${month}, day: ${dayOfWeek})`,
      metadata: {
        month,
        day_of_week: dayOfWeek,
        seasonal_factor: seasonalFactors,
        weekday_factor: weekdayFactor,
        combined_factor: combinedFactor,
        country: behaviorData.market_context.country
      }
    };
  }

  /**
   * Evaluate cultural event timing
   */
  private async evaluateCulturalEventTiming(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    const country = behaviorData.market_context.country;
    const now = new Date();
    
    // Check for upcoming cultural events in African markets
    const culturalEvents = this.getAfricanCulturalEvents(country, now);
    const relevantEvents = culturalEvents.filter(event => 
      Math.abs(event.date.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    );
    
    const hasRelevantEvent = relevantEvents.length > 0;
    const eventImportance = relevantEvents.reduce((max, event) => Math.max(max, event.importance), 0);
    
    const shouldTrigger = hasRelevantEvent && eventImportance >= (condition.parameters.min_importance || 0.7);
    const confidence = hasRelevantEvent ? Math.min(0.9, 0.6 + eventImportance * 0.3) : 0;

    return {
      shouldTrigger: shouldTrigger && confidence >= condition.confidence_threshold,
      confidence,
      reasoning: hasRelevantEvent 
        ? `Cultural event detected: ${relevantEvents[0].name} (importance: ${eventImportance.toFixed(2)})`
        : 'No relevant cultural events in the next 7 days',
      metadata: {
        country,
        relevant_events: relevantEvents.map(e => ({ name: e.name, date: e.date, importance: e.importance })),
        event_count: relevantEvents.length,
        max_importance: eventImportance
      }
    };
  }

  /**
   * Evaluate payment behavior change
   */
  private async evaluatePaymentBehaviorChange(
    condition: AdvancedTriggerCondition,
    behaviorData: CustomerBehaviorData
  ): Promise<TriggerEvaluationResult> {
    // For now, return a placeholder since payment data isn't fully implemented
    // TODO: Implement when payment tracking is added
    
    return {
      shouldTrigger: false,
      confidence: 0,
      reasoning: 'Payment behavior analysis not yet implemented',
      metadata: {
        feature_status: 'pending_implementation',
        note: 'Requires payment tracking integration'
      }
    };
  }

  // Helper methods

  private combineEvaluationResults(results: TriggerEvaluationResult[]): TriggerEvaluationResult {
    if (results.length === 0) {
      return {
        shouldTrigger: false,
        confidence: 0,
        reasoning: 'No conditions to evaluate',
        metadata: {}
      };
    }

    // Use weighted average based on confidence
    const triggeredResults = results.filter(r => r.shouldTrigger);
    
    if (triggeredResults.length === 0) {
      const highestConfidenceResult = results.reduce((max, result) => 
        result.confidence > max.confidence ? result : max
      );
      
      return {
        shouldTrigger: false,
        confidence: highestConfidenceResult.confidence,
        reasoning: `No conditions met. Highest confidence: ${highestConfidenceResult.reasoning}`,
        metadata: { evaluated_conditions: results.length }
      };
    }

    const weightedConfidence = triggeredResults.reduce((sum, result) => sum + result.confidence, 0) / triggeredResults.length;
    const combinedReasons = triggeredResults.map(r => r.reasoning).join('; ');

    return {
      shouldTrigger: true,
      confidence: weightedConfidence,
      reasoning: `${triggeredResults.length} conditions met: ${combinedReasons}`,
      metadata: {
        triggered_conditions: triggeredResults.length,
        total_conditions: results.length,
        condition_details: triggeredResults.map(r => ({ 
          confidence: r.confidence, 
          reasoning: r.reasoning 
        }))
      }
    };
  }

  private hasAfricanMarketContext(conditions: AdvancedTriggerCondition[]): boolean {
    return conditions.some(c => c.african_market_context?.countries?.length > 0);
  }

  private async enhanceWithAfricanContext(
    behaviorData: CustomerBehaviorData,
    result: TriggerEvaluationResult
  ): Promise<any> {
    const country = behaviorData.market_context.country;
    const timezone = behaviorData.market_context.timezone;
    
    // Calculate optimal timing for African markets
    const optimalTiming = this.calculateOptimalAfricanTiming(country, timezone);
    
    // Calculate cultural relevance
    const culturalRelevance = this.calculateCulturalRelevance(country, new Date());
    
    // Get local market factors
    const localMarketFactors = this.getLocalMarketFactors(country);

    return {
      optimal_timing: optimalTiming,
      cultural_relevance: culturalRelevance,
      local_market_factors: localMarketFactors
    };
  }

  private calculateEngagementScores(emailActivities: any[], smsActivities: any[], activities: any[]): number[] {
    const scores = [];
    const days = 14; // Last 14 days
    
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      let dayScore = 0;
      
      // Email engagement
      const dayEmailActivities = emailActivities.filter(a => 
        new Date(a.timestamp).toDateString() === date.toDateString()
      );
      dayScore += dayEmailActivities.length * 0.3;
      
      // SMS engagement  
      const daySmsActivities = smsActivities.filter(a => 
        new Date(a.createdAt).toDateString() === date.toDateString()
      );
      dayScore += daySmsActivities.length * 0.4;
      
      // General activities
      const dayActivities = activities.filter(a => 
        new Date(a.timestamp).toDateString() === date.toDateString()
      );
      dayScore += dayActivities.length * 0.3;
      
      scores.push(Math.min(1.0, dayScore)); // Cap at 1.0
    }
    
    return scores;
  }

  private analyzeInteractionPatterns(activities: any[], emailActivities: any[]): any[] {
    // Group activities by hour to find patterns
    const hourlyPatterns = new Array(24).fill(0);
    
    [...activities, ...emailActivities].forEach(activity => {
      const hour = new Date(activity.timestamp || activity.createdAt).getHours();
      hourlyPatterns[hour]++;
    });
    
    return hourlyPatterns.map((count, hour) => ({ hour, activity_count: count }));
  }

  private identifyChurnIndicators(contact: any, activities: any[], engagementScores: number[]): any[] {
    const indicators = [];
    
    // Long inactivity
    const lastActivity = activities[0];
    if (lastActivity) {
      const daysSinceLastActivity = (Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 30) {
        indicators.push({ type: 'long_inactivity', value: daysSinceLastActivity });
      }
    }
    
    // Declining engagement
    if (engagementScores.length >= 5) {
      const recentAvg = engagementScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const olderAvg = engagementScores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
      
      if (recentAvg < olderAvg * 0.7) {
        indicators.push({ type: 'declining_engagement', recent: recentAvg, previous: olderAvg });
      }
    }
    
    return indicators;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private analyzePurchaseIntentSignals(activities: any[]): { score: number; signals: string[] } {
    const signals = [];
    let score = 0;
    
    activities.forEach(activity => {
      const action = activity.action?.toLowerCase() || '';
      
      if (action.includes('pricing') || action.includes('price')) {
        signals.push('pricing_interest');
        score += 0.3;
      }
      
      if (action.includes('demo') || action.includes('trial')) {
        signals.push('demo_request');
        score += 0.4;
      }
      
      if (action.includes('contact') || action.includes('sales')) {
        signals.push('sales_contact');
        score += 0.5;
      }
      
      if (action.includes('feature') || action.includes('comparison')) {
        signals.push('feature_research');
        score += 0.2;
      }
    });
    
    return { score: Math.min(1.0, score), signals: [...new Set(signals)] };
  }

  private analyzeHourlyEngagementPatterns(interactionPatterns: any[]): Record<number, number> {
    const patterns: Record<number, number> = {};
    
    interactionPatterns.forEach(pattern => {
      patterns[pattern.hour] = pattern.activity_count;
    });
    
    return patterns;
  }

  private getAfricanSeasonalFactors(month: number, country: string): number {
    // African seasonal business patterns
    const seasonalFactors: Record<string, number[]> = {
      'NG': [0.7, 0.8, 0.9, 0.9, 0.8, 0.7, 0.6, 0.6, 0.8, 0.9, 0.9, 0.8], // Nigeria
      'KE': [0.8, 0.9, 0.9, 0.8, 0.7, 0.7, 0.6, 0.7, 0.8, 0.9, 0.9, 0.8], // Kenya  
      'ZA': [0.6, 0.7, 0.8, 0.9, 0.9, 0.8, 0.7, 0.8, 0.9, 0.9, 0.8, 0.7], // South Africa
      'GH': [0.8, 0.8, 0.9, 0.9, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 0.9, 0.8], // Ghana
    };
    
    return seasonalFactors[country]?.[month] || 0.7; // Default
  }

  private getWeekdayFactor(dayOfWeek: number, country: string): number {
    // African weekday business patterns (0 = Sunday, 6 = Saturday)
    const weekdayFactors = [0.3, 0.9, 0.9, 0.9, 0.9, 0.8, 0.4]; // Lower on weekends
    return weekdayFactors[dayOfWeek];
  }

  private getAfricanCulturalEvents(country: string, date: Date): Array<{ name: string; date: Date; importance: number }> {
    // Major African cultural and business events
    const events = [
      { name: 'Eid al-Fitr', date: new Date('2024-04-10'), importance: 0.9 },
      { name: 'Eid al-Adha', date: new Date('2024-06-17'), importance: 0.9 },
      { name: 'Independence Day Nigeria', date: new Date('2024-10-01'), importance: 0.8 },
      { name: 'Christmas', date: new Date('2024-12-25'), importance: 0.9 },
      { name: 'New Year', date: new Date('2024-01-01'), importance: 0.8 },
    ];
    
    // Adjust dates to current year
    const currentYear = date.getFullYear();
    return events.map(event => ({
      ...event,
      date: new Date(currentYear, event.date.getMonth(), event.date.getDate())
    }));
  }

  private calculateOptimalAfricanTiming(country: string, timezone: string): Date {
    // African business hours optimization
    const now = new Date();
    const businessHours = { start: 9, end: 17 }; // 9 AM to 5 PM local time
    
    const currentHour = now.getHours();
    
    if (currentHour >= businessHours.start && currentHour <= businessHours.end) {
      return now; // Current time is good
    } else if (currentHour < businessHours.start) {
      // Schedule for start of business day
      const optimal = new Date(now);
      optimal.setHours(businessHours.start, 0, 0, 0);
      return optimal;
    } else {
      // Schedule for next business day
      const optimal = new Date(now);
      optimal.setDate(optimal.getDate() + 1);
      optimal.setHours(businessHours.start, 0, 0, 0);
      return optimal;
    }
  }

  private calculateCulturalRelevance(country: string, date: Date): number {
    const events = this.getAfricanCulturalEvents(country, date);
    const nearbyEvents = events.filter(event => 
      Math.abs(event.date.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    
    return nearbyEvents.reduce((max, event) => Math.max(max, event.importance), 0.5);
  }

  private getLocalMarketFactors(country: string): string[] {
    const factors: Record<string, string[]> = {
      'NG': ['naira_volatility', 'mobile_money_adoption', 'youth_demographic'],
      'KE': ['m_pesa_dominance', 'tech_hub_growth', 'agriculture_seasonal'],
      'ZA': ['rand_stability', 'urban_concentration', 'inequality_awareness'],
      'GH': ['cedi_challenges', 'cocoa_economy', 'digital_transformation'],
    };
    
    return factors[country] || ['generic_african_market'];
  }

  private async logTriggerEvent(
    workflowId: string,
    contactId: string,
    result: TriggerEvaluationResult,
    executionId: string
  ): Promise<void> {
    try {
      // Log to workflow events for analytics
      await prisma.workflowEvent.create({
        data: {
          id: `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          workflowId,
          contactId,
          eventType: 'ADVANCED_TRIGGER',
          eventData: JSON.stringify({
            trigger_confidence: result.confidence,
            trigger_reasoning: result.reasoning,
            trigger_metadata: result.metadata,
            african_context: result.african_context,
            execution_id: executionId
          })
        }
      });

      logger.info('Advanced trigger event logged', {
        workflowId,
        contactId,
        executionId,
        confidence: result.confidence
      });
    } catch (error) {
      logger.warn('Failed to log trigger event', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
        contactId
      });
    }
  }
}

// Export singleton instance
export const advancedTriggerEngine = new AdvancedWorkflowTriggerEngine();