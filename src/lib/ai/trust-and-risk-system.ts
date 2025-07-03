/**
 * AI Trust Settings & Risk Classification System
 * =============================================
 * 
 * Advanced trust scoring and risk classification system for AI decisions.
 * Provides dynamic trust levels, risk assessment, and safety controls
 * for autonomous customer lifecycle management.
 * 
 * Key Features:
 * - Dynamic AI trust scoring based on performance history
 * - Multi-dimensional risk classification
 * - Confidence-based decision routing
 * - Adaptive trust thresholds
 * - Performance monitoring and feedback loops
 * - Safety guardrails and circuit breakers
 * 
 * Based on user's blueprint: Create AI Trust Settings & Risk Classification
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { ActionPlan, RiskLevel } from '@/lib/actions/action-plan-interface';

export type TrustLevel = 'untrusted' | 'low' | 'moderate' | 'high' | 'very_high';

export type RiskCategory = 
  | 'financial'      // Actions involving money/transactions
  | 'customer'       // Customer-facing communications
  | 'data'          // Data modification/access
  | 'system'        // System configuration changes
  | 'reputation'    // Actions affecting brand reputation
  | 'compliance'    // Regulatory/legal compliance
  | 'operational';  // Business operations

export interface TrustScore {
  overall: number;          // 0-1 overall trust score
  categories: Record<RiskCategory, number>; // Category-specific trust scores
  confidence: number;       // 0-1 confidence in the trust score
  lastUpdated: Date;
  sampleSize: number;       // Number of decisions used to calculate score
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  categoryRisks: Record<RiskCategory, RiskLevel>;
  riskFactors: RiskFactor[];
  mitigationSuggestions: string[];
  confidence: number;
  assessmentVersion: string;
}

export interface RiskFactor {
  category: RiskCategory;
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  likelihood: number; // 0-1
  weight: number;     // Importance in overall risk calculation
}

export interface TrustSettings {
  organizationId: string;
  globalTrustThreshold: number;           // Minimum trust score for autonomous actions
  categoryThresholds: Record<RiskCategory, number>; // Category-specific thresholds
  adaptiveThresholds: {
    enabled: boolean;
    performanceWindow: number;            // Days to consider for performance
    adjustmentFactor: number;             // How much to adjust thresholds
    minThreshold: number;                 // Never go below this
    maxThreshold: number;                 // Never go above this
  };
  riskToleranceProfile: {
    conservative: boolean;                // More restrictive thresholds
    riskAppetite: 'low' | 'medium' | 'high';
    priorityCategories: RiskCategory[];   // Categories requiring extra caution
  };
  circuitBreakers: {
    enabled: boolean;
    errorThreshold: number;               // Error rate that triggers circuit breaker
    timeWindow: number;                   // Minutes to evaluate error rate
    cooldownPeriod: number;               // Minutes before re-enabling
  };
  feedbackSettings: {
    enableContinuousLearning: boolean;
    feedbackWeight: number;               // How much human feedback affects trust
    decayRate: number;                    // How quickly old performance decays
  };
}

export interface TrustEvent {
  id: string;
  organizationId: string;
  actionPlanId: string;
  trustLevel: TrustLevel;
  riskAssessment: RiskAssessment;
  decision: 'approved' | 'rejected' | 'escalated';
  outcome?: 'success' | 'failure' | 'partial';
  humanFeedback?: 'correct' | 'incorrect' | 'partially_correct';
  impactMetrics?: {
    customerSatisfaction?: number;
    businessValue?: number;
    riskMaterialized?: boolean;
  };
  timestamp: Date;
}

/**
 * AI Trust and Risk Classification System
 */
export class AITrustAndRiskSystem {
  private readonly modelVersion = 'trust-risk-v1.0';
  private trustScores: Map<string, TrustScore> = new Map();
  private settings: Map<string, TrustSettings> = new Map();

  constructor() {
    this.initializeDefaultSettings();
  }

  /**
   * Calculate trust score for AI decisions in an organization
   */
  async calculateTrustScore(organizationId: string): Promise<TrustScore> {
    try {
      logger.debug('Calculating AI trust score', { organizationId });

      // Check if we have a cached score
      if (this.trustScores.has(organizationId)) {
        const cached = this.trustScores.get(organizationId)!;
        const ageMinutes = (Date.now() - cached.lastUpdated.getTime()) / (1000 * 60);
        if (ageMinutes < 30) { // Cache for 30 minutes
          return cached;
        }
      }

      // Get recent trust events for analysis
      const events = await this.getTrustEvents(organizationId, 30); // Last 30 days

      if (events.length === 0) {
        // No history, return default moderate trust
        const defaultScore: TrustScore = {
          overall: 0.5,
          categories: this.getDefaultCategoryScores(),
          confidence: 0.1, // Low confidence with no data
          lastUpdated: new Date(),
          sampleSize: 0
        };
        this.trustScores.set(organizationId, defaultScore);
        return defaultScore;
      }

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(events);
      
      // Calculate category-specific trust scores
      const categoryScores = this.calculateCategoryTrustScores(events);
      
      // Calculate overall trust score
      const overallTrust = this.calculateOverallTrust(performanceMetrics, categoryScores);
      
      // Calculate confidence based on sample size and consistency
      const confidence = this.calculateTrustConfidence(events, performanceMetrics);

      const trustScore: TrustScore = {
        overall: overallTrust,
        categories: categoryScores,
        confidence,
        lastUpdated: new Date(),
        sampleSize: events.length
      };

      // Cache the score
      this.trustScores.set(organizationId, trustScore);

      // Store in database
      await this.storeTrustScore(organizationId, trustScore);

      logger.info('Trust score calculated', {
        organizationId,
        overallTrust: overallTrust.toFixed(3),
        confidence: confidence.toFixed(3),
        sampleSize: events.length
      });

      return trustScore;

    } catch (error) {
      logger.error('Failed to calculate trust score', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Assess risk for a specific action plan
   */
  async assessActionPlanRisk(actionPlan: ActionPlan): Promise<RiskAssessment> {
    try {
      logger.debug('Assessing action plan risk', {
        actionPlanId: actionPlan.id,
        organizationId: actionPlan.organizationId
      });

      // Identify risk factors for this action plan
      const riskFactors = this.identifyRiskFactors(actionPlan);
      
      // Calculate category-specific risks
      const categoryRisks = this.calculateCategoryRisks(actionPlan, riskFactors);
      
      // Calculate overall risk level
      const overallRisk = this.calculateOverallRisk(categoryRisks, riskFactors);
      
      // Generate mitigation suggestions
      const mitigationSuggestions = this.generateMitigationSuggestions(riskFactors);
      
      // Calculate confidence in the assessment
      const confidence = this.calculateAssessmentConfidence(actionPlan, riskFactors);

      const assessment: RiskAssessment = {
        overallRisk,
        categoryRisks,
        riskFactors,
        mitigationSuggestions,
        confidence,
        assessmentVersion: this.modelVersion
      };

      logger.debug('Risk assessment completed', {
        actionPlanId: actionPlan.id,
        overallRisk,
        riskFactorCount: riskFactors.length,
        confidence: confidence.toFixed(3)
      });

      return assessment;

    } catch (error) {
      logger.error('Failed to assess action plan risk', {
        actionPlanId: actionPlan.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Determine if an action should be trusted based on trust score and risk assessment
   */
  async evaluateTrust(
    actionPlan: ActionPlan,
    trustScore: TrustScore,
    riskAssessment: RiskAssessment
  ): Promise<{
    trusted: boolean;
    trustLevel: TrustLevel;
    reasoning: string[];
    recommendedAction: 'approve' | 'escalate' | 'reject';
  }> {
    try {
      const settings = await this.getTrustSettings(actionPlan.organizationId);
      
      // Determine primary risk category for this action
      const primaryCategory = this.determinePrimaryRiskCategory(actionPlan);
      
      // Get applicable trust threshold
      const threshold = settings.categoryThresholds[primaryCategory] || settings.globalTrustThreshold;
      
      // Evaluate trust conditions
      const trustConditions = this.evaluateTrustConditions(
        actionPlan,
        trustScore,
        riskAssessment,
        settings,
        threshold
      );

      // Determine overall trust level
      const trustLevel = this.determineTrustLevel(trustScore.overall, riskAssessment.overallRisk);
      
      // Make recommendation
      const recommendedAction = this.makeRecommendation(
        trustConditions,
        riskAssessment,
        settings
      );

      const result = {
        trusted: trustConditions.meetsThreshold && !trustConditions.circuitBreakerTriggered,
        trustLevel,
        reasoning: trustConditions.reasoning,
        recommendedAction
      };

      logger.info('Trust evaluation completed', {
        actionPlanId: actionPlan.id,
        trusted: result.trusted,
        trustLevel: result.trustLevel,
        recommendedAction: result.recommendedAction
      });

      return result;

    } catch (error) {
      logger.error('Failed to evaluate trust', {
        actionPlanId: actionPlan.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Record trust event for continuous learning
   */
  async recordTrustEvent(
    organizationId: string,
    actionPlanId: string,
    trustLevel: TrustLevel,
    riskAssessment: RiskAssessment,
    decision: 'approved' | 'rejected' | 'escalated',
    outcome?: 'success' | 'failure' | 'partial',
    humanFeedback?: 'correct' | 'incorrect' | 'partially_correct'
  ): Promise<void> {
    try {
      const event: TrustEvent = {
        id: `trust_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        actionPlanId,
        trustLevel,
        riskAssessment,
        decision,
        outcome,
        humanFeedback,
        timestamp: new Date()
      };

      await this.storeTrustEvent(event);

      // Invalidate cached trust score to force recalculation
      this.trustScores.delete(organizationId);

      logger.info('Trust event recorded', {
        eventId: event.id,
        organizationId,
        actionPlanId,
        decision,
        outcome,
        humanFeedback
      });

    } catch (error) {
      logger.error('Failed to record trust event', {
        organizationId,
        actionPlanId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Update trust settings for an organization
   */
  async updateTrustSettings(
    organizationId: string,
    updates: Partial<TrustSettings>
  ): Promise<TrustSettings> {
    try {
      const currentSettings = await this.getTrustSettings(organizationId);
      const newSettings = { ...currentSettings, ...updates };

      // Validate settings
      this.validateTrustSettings(newSettings);

      // Store updated settings
      await this.storeTrustSettings(newSettings);
      this.settings.set(organizationId, newSettings);

      // Invalidate trust score cache to reflect new settings
      this.trustScores.delete(organizationId);

      logger.info('Trust settings updated', {
        organizationId,
        globalThreshold: newSettings.globalTrustThreshold,
        changes: Object.keys(updates)
      });

      return newSettings;

    } catch (error) {
      logger.error('Failed to update trust settings', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Private helper methods

  private async getTrustEvents(organizationId: string, days: number): Promise<TrustEvent[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const events = await prisma.aI_TrustEvent.findMany({
        where: {
          organizationId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      return events.map(e => ({
        id: e.id,
        organizationId: e.organizationId,
        actionPlanId: e.actionPlanId,
        trustLevel: e.trustLevel as TrustLevel,
        riskAssessment: e.riskAssessment as RiskAssessment,
        decision: e.decision as TrustEvent['decision'],
        outcome: e.outcome as TrustEvent['outcome'],
        humanFeedback: e.humanFeedback as TrustEvent['humanFeedback'],
        impactMetrics: e.impactMetrics as TrustEvent['impactMetrics'],
        timestamp: e.timestamp
      }));

    } catch (error) {
      logger.warn('Failed to get trust events, returning empty array', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }

  private calculatePerformanceMetrics(events: TrustEvent[]) {
    const totalEvents = events.length;
    if (totalEvents === 0) return { successRate: 0.5, feedbackAccuracy: 0.5 };

    // Calculate success rate based on outcomes
    const successfulEvents = events.filter(e => e.outcome === 'success').length;
    const successRate = successfulEvents / totalEvents;

    // Calculate feedback accuracy (when human feedback aligns with outcome)
    const feedbackEvents = events.filter(e => e.humanFeedback && e.outcome);
    const accurateFeedback = feedbackEvents.filter(e => 
      (e.humanFeedback === 'correct' && e.outcome === 'success') ||
      (e.humanFeedback === 'incorrect' && e.outcome === 'failure')
    ).length;
    const feedbackAccuracy = feedbackEvents.length > 0 ? 
      accurateFeedback / feedbackEvents.length : 0.5;

    return { successRate, feedbackAccuracy };
  }

  private calculateCategoryTrustScores(events: TrustEvent[]): Record<RiskCategory, number> {
    const categories: RiskCategory[] = [
      'financial', 'customer', 'data', 'system', 'reputation', 'compliance', 'operational'
    ];

    const scores: Record<RiskCategory, number> = {} as any;

    for (const category of categories) {
      const categoryEvents = events.filter(e => 
        e.riskAssessment.categoryRisks[category] !== undefined
      );

      if (categoryEvents.length === 0) {
        scores[category] = 0.5; // Default neutral score
        continue;
      }

      // Calculate success rate for this category
      const successful = categoryEvents.filter(e => e.outcome === 'success').length;
      const successRate = successful / categoryEvents.length;

      // Apply feedback adjustments
      const feedbackAdjustment = this.calculateFeedbackAdjustment(categoryEvents);
      
      scores[category] = Math.max(0, Math.min(1, successRate + feedbackAdjustment));
    }

    return scores;
  }

  private calculateOverallTrust(
    performanceMetrics: { successRate: number; feedbackAccuracy: number },
    categoryScores: Record<RiskCategory, number>
  ): number {
    // Weight performance metrics
    const performanceScore = (performanceMetrics.successRate * 0.7) + 
                           (performanceMetrics.feedbackAccuracy * 0.3);

    // Average category scores
    const categoryValues = Object.values(categoryScores);
    const avgCategoryScore = categoryValues.reduce((sum, score) => sum + score, 0) / categoryValues.length;

    // Combine with slight bias toward performance
    return Math.max(0, Math.min(1, (performanceScore * 0.6) + (avgCategoryScore * 0.4)));
  }

  private calculateTrustConfidence(
    events: TrustEvent[],
    performanceMetrics: { successRate: number; feedbackAccuracy: number }
  ): number {
    const sampleSize = events.length;
    
    // Base confidence on sample size
    let confidence = Math.min(1, sampleSize / 100); // Full confidence at 100+ events
    
    // Adjust for consistency in performance
    const outcomes = events.filter(e => e.outcome).map(e => e.outcome);
    if (outcomes.length > 0) {
      const consistency = this.calculateConsistency(outcomes);
      confidence *= consistency;
    }

    // Boost confidence if we have human feedback
    const feedbackEvents = events.filter(e => e.humanFeedback).length;
    if (feedbackEvents > 0) {
      confidence *= (1 + (feedbackEvents / sampleSize) * 0.2); // Up to 20% boost
    }

    return Math.max(0.1, Math.min(1, confidence));
  }

  private calculateFeedbackAdjustment(events: TrustEvent[]): number {
    const feedbackEvents = events.filter(e => e.humanFeedback);
    if (feedbackEvents.length === 0) return 0;

    const positiveWeight = feedbackEvents.filter(e => e.humanFeedback === 'correct').length;
    const negativeWeight = feedbackEvents.filter(e => e.humanFeedback === 'incorrect').length;
    
    const adjustment = (positiveWeight - negativeWeight) / feedbackEvents.length;
    return adjustment * 0.1; // Max 10% adjustment from feedback
  }

  private calculateConsistency(outcomes: string[]): number {
    if (outcomes.length < 2) return 1;

    const successCount = outcomes.filter(o => o === 'success').length;
    const ratio = successCount / outcomes.length;
    
    // Consistency is higher when outcomes are consistently good or bad
    // Less consistent when mixed
    return Math.abs(ratio - 0.5) * 2;
  }

  private identifyRiskFactors(actionPlan: ActionPlan): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Analyze action types for risk factors
    for (const action of actionPlan.actions) {
      // Financial risk factors
      if (action.type.includes('PAYMENT') || action.type.includes('REFUND')) {
        factors.push({
          category: 'financial',
          factor: 'Financial transaction action',
          severity: 'high',
          impact: 'Potential monetary loss or compliance issues',
          likelihood: 0.3,
          weight: 0.8
        });
      }

      // Customer communication risks
      if (action.type.includes('EMAIL') || action.type.includes('SMS') || action.type.includes('WHATSAPP')) {
        factors.push({
          category: 'customer',
          factor: 'Customer-facing communication',
          severity: 'medium',
          impact: 'Potential customer satisfaction impact',
          likelihood: 0.2,
          weight: 0.6
        });
      }

      // Data modification risks
      if (action.type.includes('UPDATE') || action.type.includes('DELETE')) {
        factors.push({
          category: 'data',
          factor: 'Data modification action',
          severity: 'medium',
          impact: 'Potential data integrity issues',
          likelihood: 0.15,
          weight: 0.7
        });
      }
    }

    // Risk based on plan complexity
    if (actionPlan.actions.length > 5) {
      factors.push({
        category: 'operational',
        factor: 'Complex multi-step action plan',
        severity: 'medium',
        impact: 'Higher chance of execution errors',
        likelihood: 0.25,
        weight: 0.5
      });
    }

    // Risk based on customer segment
    if (actionPlan.metadata?.customerSegment === 'high_value') {
      factors.push({
        category: 'reputation',
        factor: 'High-value customer target',
        severity: 'high',
        impact: 'Reputation damage if action fails',
        likelihood: 0.1,
        weight: 0.9
      });
    }

    return factors;
  }

  private calculateCategoryRisks(
    actionPlan: ActionPlan,
    riskFactors: RiskFactor[]
  ): Record<RiskCategory, RiskLevel> {
    const categories: RiskCategory[] = [
      'financial', 'customer', 'data', 'system', 'reputation', 'compliance', 'operational'
    ];

    const risks: Record<RiskCategory, RiskLevel> = {} as any;

    for (const category of categories) {
      const categoryFactors = riskFactors.filter(f => f.category === category);
      
      if (categoryFactors.length === 0) {
        risks[category] = 'low';
        continue;
      }

      // Calculate weighted risk score
      const riskScore = categoryFactors.reduce((sum, factor) => {
        const severityScore = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 }[factor.severity];
        return sum + (factor.likelihood * factor.weight * severityScore);
      }, 0) / categoryFactors.length;

      // Convert to risk level
      if (riskScore >= 0.8) risks[category] = 'critical';
      else if (riskScore >= 0.6) risks[category] = 'high';
      else if (riskScore >= 0.3) risks[category] = 'medium';
      else risks[category] = 'low';
    }

    return risks;
  }

  private calculateOverallRisk(
    categoryRisks: Record<RiskCategory, RiskLevel>,
    riskFactors: RiskFactor[]
  ): RiskLevel {
    // Get the highest category risk
    const riskLevels = Object.values(categoryRisks);
    const riskScores = riskLevels.map(level => 
      ({ low: 1, medium: 2, high: 3, critical: 4 }[level])
    );

    const maxRiskScore = Math.max(...riskScores);
    const avgRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;

    // Combine max and average with weights
    const combinedScore = (maxRiskScore * 0.7) + (avgRiskScore * 0.3);

    // Convert back to risk level
    if (combinedScore >= 3.5) return 'critical';
    if (combinedScore >= 2.5) return 'high';
    if (combinedScore >= 1.5) return 'medium';
    return 'low';
  }

  private generateMitigationSuggestions(riskFactors: RiskFactor[]): string[] {
    const suggestions: string[] = [];

    const highRiskFactors = riskFactors.filter(f => 
      f.severity === 'high' || f.severity === 'critical'
    );

    for (const factor of highRiskFactors) {
      switch (factor.category) {
        case 'financial':
          suggestions.push('Implement additional approval for financial actions');
          suggestions.push('Set transaction limits for autonomous actions');
          break;
        case 'customer':
          suggestions.push('Review customer communication templates');
          suggestions.push('Monitor customer feedback for communication quality');
          break;
        case 'data':
          suggestions.push('Require backup before data modification');
          suggestions.push('Implement data validation checks');
          break;
        case 'reputation':
          suggestions.push('Route high-value customer actions through human review');
          suggestions.push('Monitor social media and feedback channels');
          break;
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Monitor action execution closely');
      suggestions.push('Maintain audit trail for compliance');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private calculateAssessmentConfidence(actionPlan: ActionPlan, riskFactors: RiskFactor[]): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence with more risk factors identified
    confidence += Math.min(0.2, riskFactors.length * 0.05);

    // Higher confidence for well-known action types
    const knownActionTypes = ['SEND_EMAIL', 'CREATE_TASK', 'UPDATE_CONTACT'];
    const knownActions = actionPlan.actions.filter(a => knownActionTypes.includes(a.type)).length;
    confidence += (knownActions / actionPlan.actions.length) * 0.1;

    return Math.max(0.1, Math.min(1, confidence));
  }

  private async getTrustSettings(organizationId: string): Promise<TrustSettings> {
    if (this.settings.has(organizationId)) {
      return this.settings.get(organizationId)!;
    }

    try {
      const stored = await prisma.aI_TrustSettings.findUnique({
        where: { organizationId }
      });

      if (stored) {
        const settings = stored.settings as TrustSettings;
        this.settings.set(organizationId, settings);
        return settings;
      }
    } catch (error) {
      logger.warn('Failed to load stored trust settings, using default', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
    }

    // Return default settings
    const defaultSettings = this.getDefaultTrustSettings(organizationId);
    this.settings.set(organizationId, defaultSettings);
    return defaultSettings;
  }

  private getDefaultTrustSettings(organizationId: string): TrustSettings {
    return {
      organizationId,
      globalTrustThreshold: 0.7,
      categoryThresholds: {
        financial: 0.9,
        customer: 0.75,
        data: 0.8,
        system: 0.95,
        reputation: 0.85,
        compliance: 0.9,
        operational: 0.7
      },
      adaptiveThresholds: {
        enabled: true,
        performanceWindow: 30,
        adjustmentFactor: 0.1,
        minThreshold: 0.5,
        maxThreshold: 0.95
      },
      riskToleranceProfile: {
        conservative: true,
        riskAppetite: 'medium',
        priorityCategories: ['financial', 'compliance', 'reputation']
      },
      circuitBreakers: {
        enabled: true,
        errorThreshold: 0.3,
        timeWindow: 60,
        cooldownPeriod: 30
      },
      feedbackSettings: {
        enableContinuousLearning: true,
        feedbackWeight: 0.2,
        decayRate: 0.05
      }
    };
  }

  private getDefaultCategoryScores(): Record<RiskCategory, number> {
    return {
      financial: 0.5,
      customer: 0.5,
      data: 0.5,
      system: 0.5,
      reputation: 0.5,
      compliance: 0.5,
      operational: 0.5
    };
  }

  private determinePrimaryRiskCategory(actionPlan: ActionPlan): RiskCategory {
    // Simple heuristic - would be enhanced with more sophisticated analysis
    for (const action of actionPlan.actions) {
      if (action.type.includes('PAYMENT') || action.type.includes('REFUND')) return 'financial';
      if (action.type.includes('EMAIL') || action.type.includes('SMS')) return 'customer';
      if (action.type.includes('UPDATE') || action.type.includes('DELETE')) return 'data';
    }
    return 'operational';
  }

  private evaluateTrustConditions(
    actionPlan: ActionPlan,
    trustScore: TrustScore,
    riskAssessment: RiskAssessment,
    settings: TrustSettings,
    threshold: number
  ) {
    const reasoning: string[] = [];
    let meetsThreshold = true;
    let circuitBreakerTriggered = false;

    // Check trust threshold
    if (trustScore.overall < threshold) {
      meetsThreshold = false;
      reasoning.push(`Trust score ${trustScore.overall.toFixed(3)} below threshold ${threshold.toFixed(3)}`);
    } else {
      reasoning.push(`Trust score ${trustScore.overall.toFixed(3)} meets threshold`);
    }

    // Check confidence
    if (trustScore.confidence < 0.5) {
      reasoning.push(`Low confidence in trust score (${trustScore.confidence.toFixed(3)})`);
    }

    // Check risk assessment
    if (riskAssessment.overallRisk === 'critical') {
      meetsThreshold = false;
      reasoning.push('Critical risk level detected');
    } else if (riskAssessment.overallRisk === 'high' && trustScore.overall < 0.8) {
      meetsThreshold = false;
      reasoning.push('High risk requires higher trust score');
    }

    // Check circuit breaker (simplified)
    if (settings.circuitBreakers.enabled && trustScore.overall < 0.3) {
      circuitBreakerTriggered = true;
      reasoning.push('Circuit breaker triggered due to low trust');
    }

    return { meetsThreshold, circuitBreakerTriggered, reasoning };
  }

  private determineTrustLevel(trustScore: number, riskLevel: RiskLevel): TrustLevel {
    if (trustScore >= 0.9 && riskLevel === 'low') return 'very_high';
    if (trustScore >= 0.8) return 'high';
    if (trustScore >= 0.6) return 'moderate';
    if (trustScore >= 0.3) return 'low';
    return 'untrusted';
  }

  private makeRecommendation(
    trustConditions: { meetsThreshold: boolean; circuitBreakerTriggered: boolean },
    riskAssessment: RiskAssessment,
    settings: TrustSettings
  ): 'approve' | 'escalate' | 'reject' {
    if (trustConditions.circuitBreakerTriggered) return 'reject';
    if (!trustConditions.meetsThreshold) return 'escalate';
    if (riskAssessment.overallRisk === 'critical') return 'escalate';
    if (riskAssessment.overallRisk === 'high' && settings.riskToleranceProfile.conservative) return 'escalate';
    
    return 'approve';
  }

  private validateTrustSettings(settings: TrustSettings): void {
    if (settings.globalTrustThreshold < 0 || settings.globalTrustThreshold > 1) {
      throw new Error('Global trust threshold must be between 0 and 1');
    }

    if (settings.adaptiveThresholds.minThreshold >= settings.adaptiveThresholds.maxThreshold) {
      throw new Error('Minimum threshold must be less than maximum threshold');
    }
  }

  private async storeTrustScore(organizationId: string, trustScore: TrustScore): Promise<void> {
    try {
      await prisma.aI_TrustScore.upsert({
        where: { organizationId },
        update: {
          score: trustScore as any,
          lastUpdated: trustScore.lastUpdated
        },
        create: {
          organizationId,
          score: trustScore as any,
          lastUpdated: trustScore.lastUpdated
        }
      });
    } catch (error) {
      logger.warn('Failed to store trust score', { organizationId, error });
    }
  }

  private async storeTrustEvent(event: TrustEvent): Promise<void> {
    try {
      await prisma.aI_TrustEvent.create({
        data: {
          id: event.id,
          organizationId: event.organizationId,
          actionPlanId: event.actionPlanId,
          trustLevel: event.trustLevel,
          riskAssessment: event.riskAssessment as any,
          decision: event.decision,
          outcome: event.outcome,
          humanFeedback: event.humanFeedback,
          impactMetrics: event.impactMetrics as any,
          timestamp: event.timestamp
        }
      });
    } catch (error) {
      logger.error('Failed to store trust event', { eventId: event.id, error });
    }
  }

  private async storeTrustSettings(settings: TrustSettings): Promise<void> {
    try {
      await prisma.aI_TrustSettings.upsert({
        where: { organizationId: settings.organizationId },
        update: { settings: settings as any },
        create: {
          organizationId: settings.organizationId,
          settings: settings as any
        }
      });
    } catch (error) {
      logger.error('Failed to store trust settings', { 
        organizationId: settings.organizationId, 
        error 
      });
      throw error;
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    logger.info('AI Trust and Risk System initialized');
  }
}

/**
 * Singleton instance for trust and risk system
 */
let trustAndRiskSystem: AITrustAndRiskSystem | null = null;

/**
 * Get the trust and risk system instance
 */
export function getAITrustAndRiskSystem(): AITrustAndRiskSystem {
  if (!trustAndRiskSystem) {
    trustAndRiskSystem = new AITrustAndRiskSystem();
  }
  return trustAndRiskSystem;
}

/**
 * Calculate trust score for an organization
 */
export async function calculateOrganizationTrustScore(organizationId: string): Promise<TrustScore> {
  const system = getAITrustAndRiskSystem();
  return system.calculateTrustScore(organizationId);
}

/**
 * Assess risk for an action plan
 */
export async function assessActionPlanRisk(actionPlan: ActionPlan): Promise<RiskAssessment> {
  const system = getAITrustAndRiskSystem();
  return system.assessActionPlanRisk(actionPlan);
}

/**
 * Evaluate trust for an action plan
 */
export async function evaluateActionPlanTrust(
  actionPlan: ActionPlan,
  trustScore: TrustScore,
  riskAssessment: RiskAssessment
) {
  const system = getAITrustAndRiskSystem();
  return system.evaluateTrust(actionPlan, trustScore, riskAssessment);
}