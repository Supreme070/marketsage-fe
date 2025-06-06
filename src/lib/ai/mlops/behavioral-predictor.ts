/**
 * Behavioral Prediction System
 * Advanced behavioral analytics and prediction engine
 */

import { logger } from '@/lib/logger';
import { errorBoundary } from '../utils/error-boundary';
import { NeuralNetworkPredictor, NetworkConfig } from '../supreme-ai-engine';
import { ModelRegistry } from './model-registry';
import { PerformanceMonitor } from './performance-monitor';
import prisma from '@/lib/db/prisma';

interface BehavioralFeatures {
  // Engagement Features
  engagementScore: number;
  interactionFrequency: number;
  averageSessionDuration: number;
  bounceRate: number;
  
  // Channel Preferences
  emailEngagement: number;
  smsEngagement: number;
  whatsappEngagement: number;
  webEngagement: number;
  
  // Temporal Patterns
  timeOfDayPreference: number[];  // 24-hour distribution
  dayOfWeekPreference: number[];  // 7-day distribution
  seasonalityScore: number;
  
  // Content Interaction
  contentTypePreferences: Record<string, number>;
  clickThroughRates: Record<string, number>;
  responseLatency: number;
  
  // Purchase Behavior
  purchaseFrequency: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
  productCategoryPreferences: Record<string, number>;
  
  // Social Behavior
  socialShareRate: number;
  referralCount: number;
  influenceScore: number;
  
  // Support Interaction
  supportTicketFrequency: number;
  averageResolutionTime: number;
  satisfactionScore: number;
}

interface BehavioralPrediction {
  userId: string;
  predictions: {
    nextPurchaseLikelihood: number;
    churnRisk: number;
    lifetimeValue: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    nextBestAction: string;
    optimalContactTime: {
      dayOfWeek: number;
      hourOfDay: number;
      confidence: number;
    };
  };
  segments: string[];
  confidenceScores: Record<string, number>;
  explanatoryFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    direction: 'positive' | 'negative';
    description: string;
  }>;
  timestamp: Date;
}

export class BehavioralPredictor {
  private registry: ModelRegistry;
  private monitor: PerformanceMonitor;
  private modelConfig: NetworkConfig = {
    layers: [
      { size: 64, activation: 'relu', dropout: 0.2 },
      { size: 128, activation: 'relu', dropout: 0.3 },
      { size: 64, activation: 'relu', dropout: 0.2 },
      { size: 32, activation: 'relu', dropout: 0.1 },
      { size: 8, activation: 'sigmoid' }
    ],
    learningRate: 0.001,
    batchSize: 32
  };

  constructor(registry: ModelRegistry, monitor: PerformanceMonitor) {
    this.registry = registry;
    this.monitor = monitor;
  }

  async predictBehavior(userId: string): Promise<BehavioralPrediction> {
    try {
      // Extract behavioral features
      const features = await this.extractBehavioralFeatures(userId);
      
      // Get latest production model
      const model = await this.getProductionModel();
      
      // Generate predictions
      const rawPredictions = model.predict(this.flattenFeatures(features));
      
      // Process predictions
      const predictions = this.processPredictions(rawPredictions);
      
      // Generate segments
      const segments = await this.generateSegments(features, predictions);
      
      // Calculate confidence scores
      const confidenceScores = this.calculateConfidenceScores(features, predictions);
      
      // Generate explanatory factors
      const explanatoryFactors = this.generateExplanatoryFactors(features, predictions);
      
      // Record prediction for monitoring
      await this.monitor.recordPrediction('behavioral', userId, features, predictions);
      
      return {
        userId,
        predictions,
        segments,
        confidenceScores,
        explanatoryFactors,
        timestamp: new Date()
      };
    } catch (error) {
      throw errorBoundary.handleError(error, 'BehavioralPredictor.predictBehavior');
    }
  }

  private async extractBehavioralFeatures(userId: string): Promise<BehavioralFeatures> {
    // Get user activities from the last 90 days
    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        purchases: true,
        sessions: true,
        interactions: true
      }
    });

    // Calculate engagement metrics
    const engagementMetrics = this.calculateEngagementMetrics(activities);
    
    // Calculate channel preferences
    const channelPreferences = this.calculateChannelPreferences(activities);
    
    // Calculate temporal patterns
    const temporalPatterns = this.calculateTemporalPatterns(activities);
    
    // Calculate content interaction metrics
    const contentMetrics = this.calculateContentMetrics(activities);
    
    // Calculate purchase behavior
    const purchaseMetrics = this.calculatePurchaseMetrics(activities);
    
    // Calculate social behavior
    const socialMetrics = this.calculateSocialMetrics(activities);
    
    // Calculate support interaction metrics
    const supportMetrics = this.calculateSupportMetrics(activities);

    return {
      ...engagementMetrics,
      ...channelPreferences,
      ...temporalPatterns,
      ...contentMetrics,
      ...purchaseMetrics,
      ...socialMetrics,
      ...supportMetrics
    };
  }

  private async getProductionModel(): Promise<NeuralNetworkPredictor> {
    const latestVersion = this.registry.getLatestVersion('behavioral', 'production');
    if (!latestVersion) {
      // Initialize new model if none exists
      const model = new NeuralNetworkPredictor(this.modelConfig);
      await this.registry.registerModel(model, 'behavioral', {
        description: 'Initial behavioral prediction model',
        tags: ['behavioral', 'production']
      });
      return model;
    }
    return new NeuralNetworkPredictor(latestVersion.config);
  }

  private flattenFeatures(features: BehavioralFeatures): number[] {
    const flattened: number[] = [];
    
    // Add scalar features
    flattened.push(
      features.engagementScore,
      features.interactionFrequency,
      features.averageSessionDuration,
      features.bounceRate,
      features.emailEngagement,
      features.smsEngagement,
      features.whatsappEngagement,
      features.webEngagement,
      features.seasonalityScore,
      features.responseLatency,
      features.purchaseFrequency,
      features.averageOrderValue,
      features.cartAbandonmentRate,
      features.socialShareRate,
      features.referralCount,
      features.influenceScore,
      features.supportTicketFrequency,
      features.averageResolutionTime,
      features.satisfactionScore
    );
    
    // Add time distributions
    flattened.push(...features.timeOfDayPreference);
    flattened.push(...features.dayOfWeekPreference);
    
    // Add normalized preference scores
    const normalizeAndAdd = (prefs: Record<string, number>) => {
      const values = Object.values(prefs);
      const sum = values.reduce((a, b) => a + b, 0);
      values.forEach(v => flattened.push(sum > 0 ? v / sum : 0));
    };
    
    normalizeAndAdd(features.contentTypePreferences);
    normalizeAndAdd(features.clickThroughRates);
    normalizeAndAdd(features.productCategoryPreferences);
    
    return flattened;
  }

  private processPredictions(raw: number[]): BehavioralPrediction['predictions'] {
    return {
      nextPurchaseLikelihood: raw[0],
      churnRisk: raw[1],
      lifetimeValue: raw[2] * 10000, // Scale to realistic values
      engagementTrend: raw[3] > 0.66 ? 'increasing' : raw[3] > 0.33 ? 'stable' : 'decreasing',
      nextBestAction: this.determineNextBestAction(raw[4]),
      optimalContactTime: {
        dayOfWeek: Math.floor(raw[5] * 7),
        hourOfDay: Math.floor(raw[6] * 24),
        confidence: raw[7]
      }
    };
  }

  private async generateSegments(
    features: BehavioralFeatures,
    predictions: BehavioralPrediction['predictions']
  ): Promise<string[]> {
    const segments: string[] = [];
    
    // Value-based segmentation
    if (predictions.lifetimeValue > 5000) {
      segments.push('High Value');
    } else if (predictions.lifetimeValue > 1000) {
      segments.push('Medium Value');
    } else {
      segments.push('Low Value');
    }
    
    // Engagement-based segmentation
    if (features.engagementScore > 0.8) {
      segments.push('Highly Engaged');
    } else if (features.engagementScore < 0.2) {
      segments.push('Disengaged');
    }
    
    // Risk-based segmentation
    if (predictions.churnRisk > 0.7) {
      segments.push('High Risk');
    } else if (predictions.churnRisk < 0.3) {
      segments.push('Loyal');
    }
    
    // Behavior-based segmentation
    if (features.socialShareRate > 0.5) {
      segments.push('Brand Advocate');
    }
    if (features.purchaseFrequency > 2) {
      segments.push('Frequent Buyer');
    }
    
    return segments;
  }

  private calculateConfidenceScores(
    features: BehavioralFeatures,
    predictions: BehavioralPrediction['predictions']
  ): Record<string, number> {
    return {
      nextPurchase: this.calculatePredictionConfidence('purchase', features),
      churnRisk: this.calculatePredictionConfidence('churn', features),
      lifetimeValue: this.calculatePredictionConfidence('ltv', features),
      engagement: this.calculatePredictionConfidence('engagement', features),
      nextBestAction: this.calculatePredictionConfidence('action', features),
      timing: predictions.optimalContactTime.confidence
    };
  }

  private generateExplanatoryFactors(
    features: BehavioralFeatures,
    predictions: BehavioralPrediction['predictions']
  ): BehavioralPrediction['explanatoryFactors'] {
    const factors: BehavioralPrediction['explanatoryFactors'] = [];
    
    // Engagement factors
    if (features.engagementScore < 0.3) {
      factors.push({
        factor: 'engagement',
        impact: 'high',
        direction: 'negative',
        description: 'Low overall engagement indicates reduced interest'
      });
    }
    
    // Purchase behavior
    if (features.purchaseFrequency > 2) {
      factors.push({
        factor: 'purchase_frequency',
        impact: 'high',
        direction: 'positive',
        description: 'Frequent purchases indicate strong product affinity'
      });
    }
    
    // Response patterns
    if (features.responseLatency > 48) {
      factors.push({
        factor: 'response_time',
        impact: 'medium',
        direction: 'negative',
        description: 'Slow response to communications suggests reduced engagement'
      });
    }
    
    // Channel preferences
    const channels = [
      { name: 'email', score: features.emailEngagement },
      { name: 'sms', score: features.smsEngagement },
      { name: 'whatsapp', score: features.whatsappEngagement },
      { name: 'web', score: features.webEngagement }
    ];
    
    const preferredChannel = channels.reduce((a, b) => a.score > b.score ? a : b);
    if (preferredChannel.score > 0.5) {
      factors.push({
        factor: 'channel_preference',
        impact: 'medium',
        direction: 'positive',
        description: `Strong preference for ${preferredChannel.name} channel`
      });
    }
    
    return factors;
  }

  private calculatePredictionConfidence(
    predictionType: string,
    features: BehavioralFeatures
  ): number {
    // Base confidence based on data completeness
    let confidence = 0.5;
    
    // Adjust based on data recency and volume
    if (features.interactionFrequency > 10) confidence += 0.2;
    if (features.purchaseFrequency > 2) confidence += 0.15;
    
    // Adjust based on prediction type
    switch (predictionType) {
      case 'purchase':
        if (features.cartAbandonmentRate < 0.3) confidence += 0.1;
        break;
      case 'churn':
        if (features.engagementScore < 0.2) confidence += 0.15;
        break;
      case 'ltv':
        if (features.averageOrderValue > 100) confidence += 0.1;
        break;
      case 'engagement':
        if (features.averageSessionDuration > 300) confidence += 0.1;
        break;
      case 'action':
        if (features.clickThroughRates['promotional'] > 0.3) confidence += 0.1;
        break;
    }
    
    return Math.min(0.95, confidence);
  }

  private determineNextBestAction(score: number): string {
    if (score < 0.2) return 'Send re-engagement email';
    if (score < 0.4) return 'Offer personalized discount';
    if (score < 0.6) return 'Share product recommendations';
    if (score < 0.8) return 'Invite to loyalty program';
    return 'Request product review';
  }

  private calculateEngagementMetrics(activities: any[]): Pick<BehavioralFeatures, 'engagementScore' | 'interactionFrequency' | 'averageSessionDuration' | 'bounceRate'> {
    // Implementation would calculate engagement metrics from activities
    return {
      engagementScore: 0.75,
      interactionFrequency: 12,
      averageSessionDuration: 300,
      bounceRate: 0.25
    };
  }

  private calculateChannelPreferences(activities: any[]): Pick<BehavioralFeatures, 'emailEngagement' | 'smsEngagement' | 'whatsappEngagement' | 'webEngagement'> {
    // Implementation would calculate channel preferences from activities
    return {
      emailEngagement: 0.8,
      smsEngagement: 0.4,
      whatsappEngagement: 0.6,
      webEngagement: 0.7
    };
  }

  private calculateTemporalPatterns(activities: any[]): Pick<BehavioralFeatures, 'timeOfDayPreference' | 'dayOfWeekPreference' | 'seasonalityScore'> {
    // Implementation would calculate temporal patterns from activities
    return {
      timeOfDayPreference: Array(24).fill(1/24),
      dayOfWeekPreference: Array(7).fill(1/7),
      seasonalityScore: 0.5
    };
  }

  private calculateContentMetrics(activities: any[]): Pick<BehavioralFeatures, 'contentTypePreferences' | 'clickThroughRates' | 'responseLatency'> {
    // Implementation would calculate content interaction metrics from activities
    return {
      contentTypePreferences: {
        'promotional': 0.4,
        'informational': 0.3,
        'transactional': 0.3
      },
      clickThroughRates: {
        'promotional': 0.2,
        'informational': 0.3,
        'transactional': 0.4
      },
      responseLatency: 24
    };
  }

  private calculatePurchaseMetrics(activities: any[]): Pick<BehavioralFeatures, 'purchaseFrequency' | 'averageOrderValue' | 'cartAbandonmentRate' | 'productCategoryPreferences'> {
    // Implementation would calculate purchase metrics from activities
    return {
      purchaseFrequency: 2.5,
      averageOrderValue: 150,
      cartAbandonmentRate: 0.3,
      productCategoryPreferences: {
        'electronics': 0.4,
        'clothing': 0.3,
        'accessories': 0.3
      }
    };
  }

  private calculateSocialMetrics(activities: any[]): Pick<BehavioralFeatures, 'socialShareRate' | 'referralCount' | 'influenceScore'> {
    // Implementation would calculate social metrics from activities
    return {
      socialShareRate: 0.4,
      referralCount: 3,
      influenceScore: 0.6
    };
  }

  private calculateSupportMetrics(activities: any[]): Pick<BehavioralFeatures, 'supportTicketFrequency' | 'averageResolutionTime' | 'satisfactionScore'> {
    // Implementation would calculate support interaction metrics from activities
    return {
      supportTicketFrequency: 0.5,
      averageResolutionTime: 48,
      satisfactionScore: 0.8
    };
  }
} 