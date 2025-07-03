/**
 * AI Feedback Loop & Continuous Learning System
 * =============================================
 * 
 * Comprehensive system for collecting feedback, measuring outcomes, and 
 * continuously improving AI decision-making through adaptive learning.
 * 
 * Key Features:
 * - Multi-source feedback collection (human, customer, system)
 * - Outcome measurement and correlation analysis
 * - Model performance tracking and adaptation
 * - Reinforcement learning for decision optimization
 * - Knowledge base updates and pattern recognition
 * - Automated model retraining triggers
 * 
 * Based on user's blueprint: Implement Feedback Loop & Continuous Learning
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getCustomerEventBus } from '@/lib/events/event-bus';
import { ActionPlan, RiskLevel } from '@/lib/actions/action-plan-interface';
import { getAITrustAndRiskSystem } from './trust-and-risk-system';

export type FeedbackSource = 'human' | 'customer' | 'system' | 'outcome';

export type FeedbackType = 
  | 'decision_quality'    // Was the AI decision good?
  | 'outcome_satisfaction' // Did the action achieve desired outcome?
  | 'customer_response'   // How did customer react?
  | 'business_impact'     // What was the business impact?
  | 'risk_accuracy'       // Was risk assessment accurate?
  | 'timing_appropriateness'; // Was timing appropriate?

export interface FeedbackEntry {
  id: string;
  organizationId: string;
  actionPlanId: string;
  contactId: string;
  source: FeedbackSource;
  type: FeedbackType;
  rating: number; // 1-5 scale
  confidence: number; // 0-1 confidence in the feedback
  details: {
    category: string;
    specificFeedback: string;
    suggestedImprovement?: string;
    contextFactors: string[];
  };
  metadata: {
    timestamp: Date;
    feedbackProvider?: string; // User ID if human feedback
    automatedSource?: string;  // System that provided feedback
    outcomeMetrics?: Record<string, number>;
  };
  processed: boolean;
  impactOnModel: {
    trustScoreAdjustment: number;
    confidenceAdjustment: number;
    patternReinforcement: string[];
  };
}

export interface LearningInsight {
  id: string;
  organizationId: string;
  category: 'pattern' | 'correlation' | 'improvement' | 'risk';
  title: string;
  description: string;
  confidence: number;
  evidenceCount: number;
  impactScore: number; // Business impact potential
  recommendations: string[];
  actionableSteps: string[];
  validatedAt?: Date;
  implementedAt?: Date;
}

export interface ModelPerformanceMetrics {
  organizationId: string;
  modelType: 'churn' | 'clv' | 'segmentation' | 'governance';
  timeWindow: {
    start: Date;
    end: Date;
  };
  accuracy: {
    overall: number;
    byCategory: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
  };
  feedbackMetrics: {
    totalFeedback: number;
    averageRating: number;
    satisfactionScore: number;
    humanApprovalRate: number;
  };
  businessImpact: {
    revenueImpact: number;
    customerSatisfactionImpact: number;
    efficiencyGains: number;
    costSavings: number;
  };
  recommendations: {
    retrainingNeeded: boolean;
    parameterAdjustments: Record<string, number>;
    dataQualityIssues: string[];
    featureImportanceChanges: Record<string, number>;
  };
}

export interface ContinuousLearningConfig {
  organizationId: string;
  enabled: boolean;
  feedbackCollection: {
    humanFeedbackWeight: number;
    customerFeedbackWeight: number;
    systemFeedbackWeight: number;
    minimumFeedbackThreshold: number;
  };
  learningParameters: {
    adaptationRate: number; // How quickly to adapt to new patterns
    stabilityThreshold: number; // Minimum confidence before making changes
    retrainingTriggers: {
      performanceDrop: number; // Trigger retraining if accuracy drops
      feedbackThreshold: number; // Number of negative feedback items
      timeInterval: number; // Days between automatic retraining
    };
  };
  knowledgeRetention: {
    maxHistoryDays: number;
    patternConfidenceThreshold: number;
    obsoletePatternDetection: boolean;
  };
}

/**
 * AI Feedback Loop & Continuous Learning System
 */
export class FeedbackLearningSystem {
  private readonly modelVersion = 'feedback-learning-v1.0';
  private config: Map<string, ContinuousLearningConfig> = new Map();

  constructor() {
    this.initializeLearningSystem();
  }

  /**
   * Collect feedback from various sources
   */
  async collectFeedback(
    organizationId: string,
    actionPlanId: string,
    contactId: string,
    source: FeedbackSource,
    type: FeedbackType,
    rating: number,
    details: FeedbackEntry['details'],
    metadata: Partial<FeedbackEntry['metadata']> = {}
  ): Promise<FeedbackEntry> {
    try {
      logger.info('Collecting AI feedback', {
        organizationId,
        actionPlanId,
        source,
        type,
        rating
      });

      // Calculate confidence based on source and context
      const confidence = this.calculateFeedbackConfidence(source, type, details);

      // Calculate impact on model
      const impactOnModel = await this.calculateModelImpact(
        organizationId,
        actionPlanId,
        rating,
        type,
        confidence
      );

      const feedback: FeedbackEntry = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        actionPlanId,
        contactId,
        source,
        type,
        rating,
        confidence,
        details,
        metadata: {
          timestamp: new Date(),
          ...metadata
        },
        processed: false,
        impactOnModel
      };

      // Store feedback
      await this.storeFeedback(feedback);

      // Process feedback immediately for high-impact items
      if (confidence > 0.8 && Math.abs(impactOnModel.trustScoreAdjustment) > 0.1) {
        await this.processFeedback(feedback);
      }

      // Emit learning event
      this.emitLearningEvent('feedback-collected', feedback);

      logger.info('Feedback collected successfully', {
        feedbackId: feedback.id,
        impact: impactOnModel,
        confidence
      });

      return feedback;

    } catch (error) {
      logger.error('Failed to collect feedback', {
        organizationId,
        actionPlanId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Process collected feedback and update models
   */
  async processFeedback(feedback: FeedbackEntry): Promise<void> {
    try {
      if (feedback.processed) return;

      logger.info('Processing feedback for learning', {
        feedbackId: feedback.id,
        type: feedback.type,
        rating: feedback.rating
      });

      // Update trust and risk system
      await this.updateTrustSystem(feedback);

      // Extract learning patterns
      const patterns = await this.extractLearningPatterns(feedback);

      // Update knowledge base
      await this.updateKnowledgeBase(feedback, patterns);

      // Generate insights if patterns are strong enough
      if (patterns.length > 0) {
        await this.generateLearningInsights(feedback.organizationId, patterns);
      }

      // Check if model retraining is needed
      await this.evaluateRetrainingNeed(feedback.organizationId);

      // Mark as processed
      feedback.processed = true;
      await this.updateFeedback(feedback);

      logger.info('Feedback processed successfully', {
        feedbackId: feedback.id,
        patternsFound: patterns.length
      });

    } catch (error) {
      logger.error('Failed to process feedback', {
        feedbackId: feedback.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Analyze model performance and generate improvement recommendations
   */
  async analyzeModelPerformance(
    organizationId: string,
    modelType: ModelPerformanceMetrics['modelType'],
    days = 30
  ): Promise<ModelPerformanceMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      logger.info('Analyzing model performance', {
        organizationId,
        modelType,
        timeWindow: { start: startDate, end: endDate }
      });

      // Get feedback for the time period
      const feedback = await this.getFeedbackByTimeWindow(
        organizationId,
        modelType,
        startDate,
        endDate
      );

      // Calculate accuracy metrics
      const accuracy = this.calculateAccuracyMetrics(feedback, modelType);

      // Calculate feedback metrics
      const feedbackMetrics = this.calculateFeedbackMetrics(feedback);

      // Estimate business impact
      const businessImpact = await this.estimateBusinessImpact(
        organizationId,
        feedback,
        modelType
      );

      // Generate recommendations
      const recommendations = this.generatePerformanceRecommendations(
        accuracy,
        feedbackMetrics,
        feedback
      );

      const metrics: ModelPerformanceMetrics = {
        organizationId,
        modelType,
        timeWindow: { start: startDate, end: endDate },
        accuracy,
        feedbackMetrics,
        businessImpact,
        recommendations
      };

      // Store performance metrics
      await this.storePerformanceMetrics(metrics);

      logger.info('Model performance analysis completed', {
        organizationId,
        modelType,
        overallAccuracy: accuracy.overall,
        averageRating: feedbackMetrics.averageRating
      });

      return metrics;

    } catch (error) {
      logger.error('Failed to analyze model performance', {
        organizationId,
        modelType,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Generate actionable insights from learning patterns
   */
  async generateLearningInsights(
    organizationId: string,
    patterns: string[]
  ): Promise<LearningInsight[]> {
    try {
      logger.info('Generating learning insights', {
        organizationId,
        patternCount: patterns.length
      });

      const insights: LearningInsight[] = [];

      // Analyze feedback patterns for insights
      const recentFeedback = await this.getRecentFeedback(organizationId, 30);
      
      // Pattern: Low satisfaction with specific action types
      const actionTypeIssues = this.analyzeActionTypePerformance(recentFeedback);
      if (actionTypeIssues.length > 0) {
        insights.push({
          id: `insight_actions_${Date.now()}`,
          organizationId,
          category: 'improvement',
          title: 'Action Type Performance Issues Detected',
          description: `Certain action types showing consistently low satisfaction: ${actionTypeIssues.join(', ')}`,
          confidence: 0.85,
          evidenceCount: recentFeedback.filter(f => actionTypeIssues.some(a => f.details.category.includes(a))).length,
          impactScore: 0.7,
          recommendations: [
            'Review and refine action execution for underperforming types',
            'Consider additional context factors for these actions',
            'Implement A/B testing for alternative approaches'
          ],
          actionableSteps: [
            'Analyze failed actions for common patterns',
            'Update action templates and messaging',
            'Retrain models with additional context features'
          ]
        });
      }

      // Pattern: Timing optimization opportunities
      const timingInsights = this.analyzeTimingPatterns(recentFeedback);
      if (timingInsights.confidence > 0.7) {
        insights.push({
          id: `insight_timing_${Date.now()}`,
          organizationId,
          category: 'pattern',
          title: 'Optimal Timing Patterns Identified',
          description: timingInsights.description,
          confidence: timingInsights.confidence,
          evidenceCount: timingInsights.evidenceCount,
          impactScore: 0.6,
          recommendations: [
            'Adjust default timing windows for actions',
            'Implement time-zone aware scheduling',
            'Consider customer behavior patterns in timing decisions'
          ],
          actionableSteps: [
            'Update timing algorithms with new patterns',
            'Create customer-specific timing profiles',
            'Monitor timing performance improvements'
          ]
        });
      }

      // Pattern: High-value customer preferences
      const highValueInsights = this.analyzeHighValueCustomerPatterns(recentFeedback);
      if (highValueInsights.length > 0) {
        insights.push({
          id: `insight_highvalue_${Date.now()}`,
          organizationId,
          category: 'correlation',
          title: 'High-Value Customer Preference Patterns',
          description: 'Distinct patterns identified for high-value customer engagement preferences',
          confidence: 0.8,
          evidenceCount: highValueInsights.length,
          impactScore: 0.9,
          recommendations: [
            'Create specialized action templates for high-value customers',
            'Implement premium customer journey optimization',
            'Adjust risk thresholds for high-value interactions'
          ],
          actionableSteps: [
            'Segment high-value customers for specialized treatment',
            'Update CLV models with preference factors',
            'Implement VIP-specific action workflows'
          ]
        });
      }

      // Store insights
      for (const insight of insights) {
        await this.storeLearningInsight(insight);
      }

      logger.info('Learning insights generated', {
        organizationId,
        insightCount: insights.length,
        categories: insights.map(i => i.category)
      });

      return insights;

    } catch (error) {
      logger.error('Failed to generate learning insights', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }

  /**
   * Trigger model retraining based on learning criteria
   */
  async triggerModelRetraining(
    organizationId: string,
    modelType: 'churn' | 'clv' | 'segmentation',
    reason: string
  ): Promise<void> {
    try {
      logger.info('Triggering model retraining', {
        organizationId,
        modelType,
        reason
      });

      // Create retraining task
      const retrainingTask = {
        id: `retrain_${modelType}_${Date.now()}`,
        organizationId,
        modelType,
        reason,
        status: 'queued',
        createdAt: new Date(),
        priority: this.calculateRetrainingPriority(modelType, reason)
      };

      // Store retraining task
      await this.storeRetrainingTask(retrainingTask);

      // Emit retraining event
      this.emitLearningEvent('model-retraining-triggered', retrainingTask);

      // Schedule actual retraining (would be picked up by background processor)
      await this.scheduleRetraining(retrainingTask);

      logger.info('Model retraining triggered successfully', {
        taskId: retrainingTask.id,
        priority: retrainingTask.priority
      });

    } catch (error) {
      logger.error('Failed to trigger model retraining', {
        organizationId,
        modelType,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  // Private helper methods

  private calculateFeedbackConfidence(
    source: FeedbackSource,
    type: FeedbackType,
    details: FeedbackEntry['details']
  ): number {
    let baseConfidence = 0.5;

    // Source-based confidence
    switch (source) {
      case 'human':
        baseConfidence = 0.8;
        break;
      case 'customer':
        baseConfidence = 0.9; // Customer feedback is highly valuable
        break;
      case 'system':
        baseConfidence = 0.7;
        break;
      case 'outcome':
        baseConfidence = 0.95; // Objective outcomes are most reliable
        break;
    }

    // Type-based adjustments
    if (type === 'outcome_satisfaction' || type === 'business_impact') {
      baseConfidence += 0.1;
    }

    // Context-based adjustments
    if (details.contextFactors.length > 3) {
      baseConfidence += 0.05; // More context = higher confidence
    }

    if (details.specificFeedback.length > 50) {
      baseConfidence += 0.05; // Detailed feedback = higher confidence
    }

    return Math.max(0.1, Math.min(1.0, baseConfidence));
  }

  private async calculateModelImpact(
    organizationId: string,
    actionPlanId: string,
    rating: number,
    type: FeedbackType,
    confidence: number
  ): Promise<FeedbackEntry['impactOnModel']> {
    // Calculate trust score adjustment based on rating and confidence
    const baseAdjustment = (rating - 3) / 10; // Scale to -0.2 to +0.2
    const trustScoreAdjustment = baseAdjustment * confidence;

    // Calculate confidence adjustment
    const confidenceAdjustment = confidence > 0.8 ? 0.05 : -0.02;

    // Identify pattern reinforcements
    const patternReinforcement: string[] = [];
    
    if (rating >= 4) {
      patternReinforcement.push(`positive_${type}`);
      if (confidence > 0.8) {
        patternReinforcement.push('high_confidence_success');
      }
    } else if (rating <= 2) {
      patternReinforcement.push(`negative_${type}`);
      if (confidence > 0.8) {
        patternReinforcement.push('high_confidence_failure');
      }
    }

    return {
      trustScoreAdjustment,
      confidenceAdjustment,
      patternReinforcement
    };
  }

  private async updateTrustSystem(feedback: FeedbackEntry): Promise<void> {
    try {
      const trustSystem = getAITrustAndRiskSystem();
      
      // Convert feedback to trust event outcome
      let outcome: 'success' | 'failure' | 'partial';
      if (feedback.rating >= 4) outcome = 'success';
      else if (feedback.rating <= 2) outcome = 'failure';
      else outcome = 'partial';

      // Convert feedback to human feedback format
      let humanFeedback: 'correct' | 'incorrect' | 'partially_correct';
      if (feedback.rating >= 4) humanFeedback = 'correct';
      else if (feedback.rating <= 2) humanFeedback = 'incorrect';
      else humanFeedback = 'partially_correct';

      await trustSystem.recordTrustEvent(
        feedback.organizationId,
        feedback.actionPlanId,
        'moderate', // Would calculate actual trust level
        {
          overallRisk: 'medium',
          categoryRisks: {} as any,
          riskFactors: [],
          mitigationSuggestions: [],
          confidence: feedback.confidence,
          assessmentVersion: this.modelVersion
        },
        'approved', // Assume approved since we have outcome
        outcome,
        humanFeedback
      );

    } catch (error) {
      logger.warn('Failed to update trust system with feedback', {
        feedbackId: feedback.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async extractLearningPatterns(feedback: FeedbackEntry): Promise<string[]> {
    const patterns: string[] = [];

    // Extract patterns based on feedback content
    if (feedback.rating <= 2) {
      patterns.push(`failure_pattern_${feedback.type}`);
      
      if (feedback.details.category.includes('timing')) {
        patterns.push('timing_optimization_needed');
      }
      
      if (feedback.details.category.includes('channel')) {
        patterns.push('channel_preference_mismatch');
      }
    }

    if (feedback.rating >= 4) {
      patterns.push(`success_pattern_${feedback.type}`);
      
      if (feedback.source === 'customer') {
        patterns.push('customer_satisfaction_factor');
      }
    }

    // Add contextual patterns
    for (const factor of feedback.details.contextFactors) {
      patterns.push(`context_${factor.toLowerCase().replace(/\s+/g, '_')}`);
    }

    return patterns;
  }

  private async updateKnowledgeBase(
    feedback: FeedbackEntry,
    patterns: string[]
  ): Promise<void> {
    try {
      for (const pattern of patterns) {
        await prisma.aI_KnowledgePattern.upsert({
          where: {
            organizationId_pattern: {
              organizationId: feedback.organizationId,
              pattern
            }
          },
          update: {
            count: { increment: 1 },
            confidence: { increment: feedback.confidence * 0.1 },
            lastSeen: new Date()
          },
          create: {
            organizationId: feedback.organizationId,
            pattern,
            count: 1,
            confidence: feedback.confidence,
            category: feedback.type,
            evidence: [feedback.id],
            lastSeen: new Date()
          }
        });
      }

      logger.debug('Knowledge base updated with patterns', {
        feedbackId: feedback.id,
        patternCount: patterns.length
      });

    } catch (error) {
      logger.warn('Failed to update knowledge base', {
        feedbackId: feedback.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async evaluateRetrainingNeed(organizationId: string): Promise<void> {
    try {
      const config = await this.getLearningConfig(organizationId);
      if (!config.enabled) return;

      // Check performance metrics for each model type
      const modelTypes: Array<'churn' | 'clv' | 'segmentation'> = ['churn', 'clv', 'segmentation'];
      
      for (const modelType of modelTypes) {
        const metrics = await this.analyzeModelPerformance(organizationId, modelType, 7);
        
        // Check retraining triggers
        if (metrics.recommendations.retrainingNeeded) {
          const reason = this.buildRetrainingReason(metrics);
          await this.triggerModelRetraining(organizationId, modelType, reason);
        }
      }

    } catch (error) {
      logger.warn('Failed to evaluate retraining need', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private buildRetrainingReason(metrics: ModelPerformanceMetrics): string {
    const reasons: string[] = [];
    
    if (metrics.accuracy.overall < 0.7) {
      reasons.push('accuracy drop below threshold');
    }
    
    if (metrics.feedbackMetrics.averageRating < 3) {
      reasons.push('low user satisfaction');
    }
    
    if (metrics.accuracy.trend === 'declining') {
      reasons.push('performance trend declining');
    }

    return reasons.join(', ') || 'scheduled retraining';
  }

  private async getFeedbackByTimeWindow(
    organizationId: string,
    modelType: string,
    startDate: Date,
    endDate: Date
  ): Promise<FeedbackEntry[]> {
    try {
      const feedback = await prisma.aI_Feedback.findMany({
        where: {
          organizationId,
          'metadata.timestamp': {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { 'metadata.timestamp': 'desc' }
      });

      return feedback.map(f => ({
        id: f.id,
        organizationId: f.organizationId,
        actionPlanId: f.actionPlanId,
        contactId: f.contactId,
        source: f.source as FeedbackSource,
        type: f.type as FeedbackType,
        rating: f.rating,
        confidence: f.confidence,
        details: f.details as FeedbackEntry['details'],
        metadata: f.metadata as FeedbackEntry['metadata'],
        processed: f.processed,
        impactOnModel: f.impactOnModel as FeedbackEntry['impactOnModel']
      }));

    } catch (error) {
      logger.warn('Failed to get feedback by time window', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }

  private calculateAccuracyMetrics(feedback: FeedbackEntry[], modelType: string) {
    const totalFeedback = feedback.length;
    if (totalFeedback === 0) {
      return {
        overall: 0.5,
        byCategory: {},
        trend: 'stable' as const
      };
    }

    const positiveRatings = feedback.filter(f => f.rating >= 4).length;
    const overall = positiveRatings / totalFeedback;

    // Calculate by category
    const byCategory: Record<string, number> = {};
    const categories = [...new Set(feedback.map(f => f.details.category))];
    
    for (const category of categories) {
      const categoryFeedback = feedback.filter(f => f.details.category === category);
      const categoryPositive = categoryFeedback.filter(f => f.rating >= 4).length;
      byCategory[category] = categoryPositive / categoryFeedback.length;
    }

    // Simple trend calculation (would be more sophisticated in production)
    const recentFeedback = feedback.slice(0, Math.floor(totalFeedback / 2));
    const olderFeedback = feedback.slice(Math.floor(totalFeedback / 2));
    
    const recentAccuracy = recentFeedback.filter(f => f.rating >= 4).length / recentFeedback.length;
    const olderAccuracy = olderFeedback.filter(f => f.rating >= 4).length / olderFeedback.length;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAccuracy > olderAccuracy + 0.05) trend = 'improving';
    else if (recentAccuracy < olderAccuracy - 0.05) trend = 'declining';

    return { overall, byCategory, trend };
  }

  private calculateFeedbackMetrics(feedback: FeedbackEntry[]) {
    const totalFeedback = feedback.length;
    if (totalFeedback === 0) {
      return {
        totalFeedback: 0,
        averageRating: 3,
        satisfactionScore: 0.5,
        humanApprovalRate: 0.5
      };
    }

    const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
    const satisfactionScore = feedback.filter(f => f.rating >= 4).length / totalFeedback;
    const humanFeedback = feedback.filter(f => f.source === 'human');
    const humanApprovalRate = humanFeedback.length > 0 ? 
      humanFeedback.filter(f => f.rating >= 4).length / humanFeedback.length : 0.5;

    return {
      totalFeedback,
      averageRating,
      satisfactionScore,
      humanApprovalRate
    };
  }

  private async estimateBusinessImpact(
    organizationId: string,
    feedback: FeedbackEntry[],
    modelType: string
  ) {
    // Simplified business impact calculation
    const positiveFeedback = feedback.filter(f => f.rating >= 4);
    const negativeFeedback = feedback.filter(f => f.rating <= 2);

    return {
      revenueImpact: positiveFeedback.length * 100 - negativeFeedback.length * 50,
      customerSatisfactionImpact: (positiveFeedback.length - negativeFeedback.length) * 0.1,
      efficiencyGains: feedback.filter(f => f.source === 'system' && f.rating >= 4).length * 10,
      costSavings: positiveFeedback.length * 5
    };
  }

  private generatePerformanceRecommendations(
    accuracy: any,
    feedbackMetrics: any,
    feedback: FeedbackEntry[]
  ) {
    const retrainingNeeded = accuracy.overall < 0.7 || feedbackMetrics.averageRating < 3;
    
    const parameterAdjustments: Record<string, number> = {};
    if (accuracy.overall < 0.8) {
      parameterAdjustments.confidenceThreshold = 0.05;
    }

    const dataQualityIssues: string[] = [];
    if (feedback.filter(f => f.confidence < 0.5).length > feedback.length * 0.3) {
      dataQualityIssues.push('Low confidence feedback indicates data quality issues');
    }

    const featureImportanceChanges: Record<string, number> = {};
    // Would analyze which features correlate with feedback

    return {
      retrainingNeeded,
      parameterAdjustments,
      dataQualityIssues,
      featureImportanceChanges
    };
  }

  private analyzeActionTypePerformance(feedback: FeedbackEntry[]): string[] {
    const actionTypePerformance: Record<string, { total: number; positive: number }> = {};
    
    for (const f of feedback) {
      const actionType = f.details.category;
      if (!actionTypePerformance[actionType]) {
        actionTypePerformance[actionType] = { total: 0, positive: 0 };
      }
      actionTypePerformance[actionType].total++;
      if (f.rating >= 4) {
        actionTypePerformance[actionType].positive++;
      }
    }

    return Object.entries(actionTypePerformance)
      .filter(([_, stats]) => stats.total >= 5 && stats.positive / stats.total < 0.6)
      .map(([actionType, _]) => actionType);
  }

  private analyzeTimingPatterns(feedback: FeedbackEntry[]) {
    // Simplified timing analysis
    const timingFeedback = feedback.filter(f => 
      f.type === 'timing_appropriateness' || 
      f.details.contextFactors.includes('timing')
    );

    if (timingFeedback.length < 10) {
      return { confidence: 0, description: '', evidenceCount: 0 };
    }

    const goodTiming = timingFeedback.filter(f => f.rating >= 4).length;
    const confidence = goodTiming / timingFeedback.length > 0.7 ? 0.8 : 0.5;

    return {
      confidence,
      description: 'Consistent patterns in timing preferences detected',
      evidenceCount: timingFeedback.length
    };
  }

  private analyzeHighValueCustomerPatterns(feedback: FeedbackEntry[]): FeedbackEntry[] {
    // Filter feedback from high-value customer interactions
    return feedback.filter(f => 
      f.details.contextFactors.includes('high_value_customer') ||
      f.details.category.includes('premium')
    );
  }

  private calculateRetrainingPriority(modelType: string, reason: string): 'low' | 'medium' | 'high' {
    if (reason.includes('accuracy drop') || reason.includes('critical')) return 'high';
    if (reason.includes('declining') || reason.includes('satisfaction')) return 'medium';
    return 'low';
  }

  private async scheduleRetraining(task: any): Promise<void> {
    // Would implement actual retraining scheduling
    logger.info('Retraining scheduled', { taskId: task.id });
  }

  private emitLearningEvent(eventType: string, data: any): void {
    try {
      const eventBus = getCustomerEventBus();
      eventBus.emit(eventType, {
        type: eventType,
        id: `learning_${Date.now()}`,
        timestamp: new Date(),
        data
      });
    } catch (error) {
      logger.warn('Failed to emit learning event', { eventType, error });
    }
  }

  private async getLearningConfig(organizationId: string): Promise<ContinuousLearningConfig> {
    // Return default config for now
    return {
      organizationId,
      enabled: true,
      feedbackCollection: {
        humanFeedbackWeight: 0.4,
        customerFeedbackWeight: 0.5,
        systemFeedbackWeight: 0.1,
        minimumFeedbackThreshold: 10
      },
      learningParameters: {
        adaptationRate: 0.1,
        stabilityThreshold: 0.8,
        retrainingTriggers: {
          performanceDrop: 0.1,
          feedbackThreshold: 20,
          timeInterval: 30
        }
      },
      knowledgeRetention: {
        maxHistoryDays: 365,
        patternConfidenceThreshold: 0.7,
        obsoletePatternDetection: true
      }
    };
  }

  private async getRecentFeedback(organizationId: string, days: number): Promise<FeedbackEntry[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.getFeedbackByTimeWindow(organizationId, 'all', startDate, new Date());
  }

  private async storeFeedback(feedback: FeedbackEntry): Promise<void> {
    try {
      await prisma.aI_Feedback.create({
        data: {
          id: feedback.id,
          organizationId: feedback.organizationId,
          actionPlanId: feedback.actionPlanId,
          contactId: feedback.contactId,
          source: feedback.source,
          type: feedback.type,
          rating: feedback.rating,
          confidence: feedback.confidence,
          details: feedback.details as any,
          metadata: feedback.metadata as any,
          processed: feedback.processed,
          impactOnModel: feedback.impactOnModel as any
        }
      });
    } catch (error) {
      logger.error('Failed to store feedback', { feedbackId: feedback.id, error });
      throw error;
    }
  }

  private async updateFeedback(feedback: FeedbackEntry): Promise<void> {
    try {
      await prisma.aI_Feedback.update({
        where: { id: feedback.id },
        data: { processed: feedback.processed }
      });
    } catch (error) {
      logger.warn('Failed to update feedback', { feedbackId: feedback.id, error });
    }
  }

  private async storeLearningInsight(insight: LearningInsight): Promise<void> {
    try {
      await prisma.aI_LearningInsight.create({
        data: {
          id: insight.id,
          organizationId: insight.organizationId,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          evidenceCount: insight.evidenceCount,
          impactScore: insight.impactScore,
          recommendations: insight.recommendations,
          actionableSteps: insight.actionableSteps,
          validatedAt: insight.validatedAt,
          implementedAt: insight.implementedAt
        }
      });
    } catch (error) {
      logger.warn('Failed to store learning insight', { insightId: insight.id, error });
    }
  }

  private async storePerformanceMetrics(metrics: ModelPerformanceMetrics): Promise<void> {
    try {
      await prisma.aI_ModelPerformance.create({
        data: {
          id: `perf_${metrics.modelType}_${Date.now()}`,
          organizationId: metrics.organizationId,
          modelType: metrics.modelType,
          timeWindow: metrics.timeWindow as any,
          accuracy: metrics.accuracy as any,
          feedbackMetrics: metrics.feedbackMetrics as any,
          businessImpact: metrics.businessImpact as any,
          recommendations: metrics.recommendations as any
        }
      });
    } catch (error) {
      logger.warn('Failed to store performance metrics', { error });
    }
  }

  private async storeRetrainingTask(task: any): Promise<void> {
    try {
      await prisma.aI_RetrainingTask.create({
        data: task
      });
    } catch (error) {
      logger.warn('Failed to store retraining task', { taskId: task.id, error });
    }
  }

  private async initializeLearningSystem(): Promise<void> {
    logger.info('Feedback Learning System initialized');
  }
}

/**
 * Singleton instance for feedback learning system
 */
let feedbackLearningSystem: FeedbackLearningSystem | null = null;

/**
 * Get the feedback learning system instance
 */
export function getFeedbackLearningSystem(): FeedbackLearningSystem {
  if (!feedbackLearningSystem) {
    feedbackLearningSystem = new FeedbackLearningSystem();
  }
  return feedbackLearningSystem;
}

/**
 * Collect feedback for continuous learning
 */
export async function collectAIFeedback(
  organizationId: string,
  actionPlanId: string,
  contactId: string,
  source: FeedbackSource,
  type: FeedbackType,
  rating: number,
  details: FeedbackEntry['details'],
  metadata?: Partial<FeedbackEntry['metadata']>
): Promise<FeedbackEntry> {
  const system = getFeedbackLearningSystem();
  return system.collectFeedback(organizationId, actionPlanId, contactId, source, type, rating, details, metadata);
}

/**
 * Analyze model performance for continuous improvement
 */
export async function analyzeModelPerformance(
  organizationId: string,
  modelType: ModelPerformanceMetrics['modelType'],
  days?: number
): Promise<ModelPerformanceMetrics> {
  const system = getFeedbackLearningSystem();
  return system.analyzeModelPerformance(organizationId, modelType, days);
}