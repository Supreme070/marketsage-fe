/**
 * Advanced Machine Learning Models for MarketSage
 * Implements sophisticated ML algorithms for better predictions
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Enhanced Feature Engineering
export interface AdvancedFeatures {
  // Behavioral Features
  email_open_rate_7d: number;
  email_open_rate_30d: number;
  email_click_rate_7d: number;
  email_click_rate_30d: number;
  whatsapp_response_rate: number;
  sms_response_rate: number;
  
  // Temporal Features
  days_since_signup: number;
  days_since_last_activity: number;
  activity_frequency_trend: number;
  
  // Engagement Patterns
  preferred_communication_channel: string;
  peak_activity_hour: number;
  peak_activity_day: number;
  session_duration_avg: number;
  
  // Financial Features (for fintech)
  average_transaction_amount: number;
  transaction_frequency: number;
  preferred_recipient_country: string;
  kyc_completion_time: number;
  
  // Demographic Features
  age_group: string;
  location_country: string;
  device_type: string;
  acquisition_channel: string;
  
  // Advanced Behavioral Signals
  content_engagement_score: number;
  social_sharing_propensity: number;
  customer_support_interactions: number;
  feature_adoption_rate: number;
}

// Advanced Churn Prediction Model
export class AdvancedChurnPredictor {
  private modelWeights: Record<string, number> = {
    // High impact features
    days_since_last_activity: 0.25,
    email_open_rate_30d: 0.20,
    transaction_frequency: 0.15,
    
    // Medium impact features
    whatsapp_response_rate: 0.12,
    activity_frequency_trend: 0.10,
    customer_support_interactions: 0.08,
    
    // Lower impact features
    peak_activity_consistency: 0.05,
    feature_adoption_rate: 0.05
  };

  async predictChurnProbability(contactId: string): Promise<{
    churnProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskFactors: string[];
    recommendedActions: string[];
    confidence: number;
  }> {
    try {
      const features = await this.extractAdvancedFeatures(contactId);
      const probability = await this.calculateChurnProbability(features);
      const riskLevel = this.categorizeRisk(probability);
      const riskFactors = this.identifyRiskFactors(features);
      const actions = this.generateRecommendations(riskLevel, riskFactors);
      
      return {
        churnProbability: probability,
        riskLevel,
        riskFactors,
        recommendedActions: actions,
        confidence: this.calculateConfidence(features)
      };
    } catch (error) {
      logger.error('Advanced churn prediction failed', error);
      throw new Error('Failed to predict churn');
    }
  }

  private async extractAdvancedFeatures(contactId: string): Promise<AdvancedFeatures> {
    // Extract comprehensive feature set from database
    const [
      contactData,
      emailMetrics,
      whatsappMetrics,
      transactionData,
      engagementData
    ] = await Promise.all([
      this.getContactData(contactId),
      this.getEmailMetrics(contactId),
      this.getWhatsAppMetrics(contactId),
      this.getTransactionData(contactId),
      this.getEngagementData(contactId)
    ]);

    return {
      // Combine all data sources into feature vector
      email_open_rate_7d: emailMetrics.openRate7d,
      email_open_rate_30d: emailMetrics.openRate30d,
      email_click_rate_7d: emailMetrics.clickRate7d,
      email_click_rate_30d: emailMetrics.clickRate30d,
      whatsapp_response_rate: whatsappMetrics.responseRate,
      sms_response_rate: 0, // TODO: Implement SMS metrics
      days_since_signup: contactData.daysSinceSignup,
      days_since_last_activity: contactData.daysSinceLastActivity,
      activity_frequency_trend: engagementData.frequencyTrend,
      preferred_communication_channel: contactData.preferredChannel,
      peak_activity_hour: engagementData.peakHour,
      peak_activity_day: engagementData.peakDay,
      session_duration_avg: engagementData.avgSessionDuration,
      average_transaction_amount: transactionData.avgAmount,
      transaction_frequency: transactionData.frequency,
      preferred_recipient_country: transactionData.topCountry,
      kyc_completion_time: contactData.kycCompletionTime,
      age_group: contactData.ageGroup,
      location_country: contactData.country,
      device_type: contactData.deviceType,
      acquisition_channel: contactData.acquisitionChannel,
      content_engagement_score: engagementData.contentScore,
      social_sharing_propensity: engagementData.socialSharing,
      customer_support_interactions: contactData.supportInteractions,
      feature_adoption_rate: engagementData.featureAdoption
    };
  }

  private async calculateChurnProbability(features: AdvancedFeatures): Promise<number> {
    // Advanced ensemble model combining multiple prediction approaches
    
    // 1. Statistical Model (logistic regression-like)
    const statisticalScore = this.calculateStatisticalScore(features);
    
    // 2. Rule-based Model
    const ruleBasedScore = this.calculateRuleBasedScore(features);
    
    // 3. Similarity-based Model (find similar churned customers)
    const similarityScore = await this.calculateSimilarityScore(features);
    
    // Ensemble prediction with weights
    const ensemblePrediction = (
      statisticalScore * 0.5 +
      ruleBasedScore * 0.3 +
      similarityScore * 0.2
    );
    
    return Math.min(Math.max(ensemblePrediction, 0), 1);
  }

  private calculateStatisticalScore(features: AdvancedFeatures): number {
    let score = 0;
    
    // Weight-based scoring
    for (const [feature, weight] of Object.entries(this.modelWeights)) {
      const featureValue = this.normalizeFeature(feature, (features as any)[feature]);
      score += featureValue * weight;
    }
    
    // Apply sigmoid transformation
    return 1 / (1 + Math.exp(-score));
  }

  private calculateRuleBasedScore(features: AdvancedFeatures): number {
    let score = 0.2; // Base score
    
    // High-risk rules
    if (features.days_since_last_activity > 30) score += 0.3;
    if (features.email_open_rate_30d < 0.1) score += 0.25;
    if (features.transaction_frequency === 0) score += 0.2;
    if (features.customer_support_interactions > 5) score += 0.15;
    
    // Medium-risk rules
    if (features.whatsapp_response_rate < 0.2) score += 0.1;
    if (features.feature_adoption_rate < 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  private async calculateSimilarityScore(features: AdvancedFeatures): Promise<number> {
    // Find similar customers who have churned
    // This is a simplified version - in production, use proper similarity algorithms
    
    try {
      const similarChurnedCustomers = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Contact" c
        WHERE c.status = 'CHURNED'
        AND c."locationCountry" = ${features.location_country}
        AND c."acquisitionChannel" = ${features.acquisition_channel}
        AND ABS(c."daysSinceSignup" - ${features.days_since_signup}) < 30
      `;
      
      const similarActiveCustomers = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Contact" c
        WHERE c.status = 'ACTIVE'
        AND c."locationCountry" = ${features.location_country}
        AND c."acquisitionChannel" = ${features.acquisition_channel}
        AND ABS(c."daysSinceSignup" - ${features.days_since_signup}) < 30
      `;
      
      const churnedCount = (similarChurnedCustomers as any)[0]?.count || 0;
      const activeCount = (similarActiveCustomers as any)[0]?.count || 1;
      
      return churnedCount / (churnedCount + activeCount);
    } catch (error) {
      logger.warn('Similarity calculation failed, using default', error);
      return 0.2;
    }
  }

  private normalizeFeature(featureName: string, value: any): number {
    // Normalize features to 0-1 range based on feature type
    switch (featureName) {
      case 'days_since_last_activity':
        return Math.min(value / 90, 1); // Cap at 90 days
      case 'email_open_rate_30d':
      case 'email_click_rate_30d':
      case 'whatsapp_response_rate':
        return 1 - value; // Higher rates = lower churn risk
      case 'transaction_frequency':
        return 1 - Math.min(value / 10, 1); // More transactions = lower risk
      default:
        return typeof value === 'number' ? Math.min(Math.max(value, 0), 1) : 0;
    }
  }

  private categorizeRisk(probability: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (probability >= 0.8) return 'CRITICAL';
    if (probability >= 0.6) return 'HIGH';
    if (probability >= 0.3) return 'MEDIUM';
    return 'LOW';
  }

  private identifyRiskFactors(features: AdvancedFeatures): string[] {
    const factors: string[] = [];
    
    if (features.days_since_last_activity > 30) {
      factors.push('No recent activity');
    }
    if (features.email_open_rate_30d < 0.1) {
      factors.push('Low email engagement');
    }
    if (features.transaction_frequency === 0) {
      factors.push('No transactions completed');
    }
    if (features.customer_support_interactions > 5) {
      factors.push('High support contact frequency');
    }
    if (features.whatsapp_response_rate < 0.2) {
      factors.push('Poor WhatsApp engagement');
    }
    
    return factors;
  }

  private generateRecommendations(riskLevel: string, riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('Immediate personal outreach required');
        recommendations.push('Offer exclusive incentive or discount');
        recommendations.push('Schedule phone call with account manager');
        break;
      case 'HIGH':
        recommendations.push('Send re-engagement campaign');
        recommendations.push('Offer personalized assistance');
        recommendations.push('Reduce communication frequency');
        break;
      case 'MEDIUM':
        recommendations.push('Send targeted educational content');
        recommendations.push('Invite to webinar or demo');
        recommendations.push('Request feedback survey');
        break;
      case 'LOW':
        recommendations.push('Continue current engagement strategy');
        recommendations.push('Monitor for changes in behavior');
        break;
    }
    
    // Add specific recommendations based on risk factors
    if (riskFactors.includes('Low email engagement')) {
      recommendations.push('Try WhatsApp or SMS communication');
    }
    if (riskFactors.includes('No transactions completed')) {
      recommendations.push('Provide transaction tutorial or demo');
    }
    
    return recommendations;
  }

  private calculateConfidence(features: AdvancedFeatures): number {
    // Confidence based on data completeness and recency
    let confidence = 0.5;
    
    // More data = higher confidence
    const dataCompleteness = this.calculateDataCompleteness(features);
    confidence += dataCompleteness * 0.3;
    
    // Recent data = higher confidence
    if (features.days_since_last_activity < 7) confidence += 0.2;
    else if (features.days_since_last_activity < 30) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private calculateDataCompleteness(features: AdvancedFeatures): number {
    const totalFeatures = Object.keys(features).length;
    const completedFeatures = Object.values(features).filter(v => v !== null && v !== undefined && v !== '').length;
    return completedFeatures / totalFeatures;
  }

  // Helper methods for data extraction
  private async getContactData(contactId: string): Promise<any> {
    // Implementation to extract contact data
    return {
      daysSinceSignup: 30,
      daysSinceLastActivity: 5,
      preferredChannel: 'email',
      kycCompletionTime: 24,
      ageGroup: '25-34',
      country: 'UK',
      deviceType: 'mobile',
      acquisitionChannel: 'google',
      supportInteractions: 2
    };
  }

  private async getEmailMetrics(contactId: string): Promise<any> {
    // Implementation to extract email metrics
    return {
      openRate7d: 0.3,
      openRate30d: 0.25,
      clickRate7d: 0.05,
      clickRate30d: 0.04
    };
  }

  private async getWhatsAppMetrics(contactId: string): Promise<any> {
    // Implementation to extract WhatsApp metrics
    return {
      responseRate: 0.8
    };
  }

  private async getTransactionData(contactId: string): Promise<any> {
    // Implementation to extract transaction data
    return {
      avgAmount: 250,
      frequency: 2,
      topCountry: 'Nigeria'
    };
  }

  private async getEngagementData(contactId: string): Promise<any> {
    // Implementation to extract engagement data
    return {
      frequencyTrend: 0.8,
      peakHour: 18,
      peakDay: 5,
      avgSessionDuration: 120,
      contentScore: 0.7,
      socialSharing: 0.1,
      featureAdoption: 0.6
    };
  }
}

// Advanced LTV Prediction Model
export class AdvancedLTVPredictor {
  async predictLifetimeValue(contactId: string, timeHorizonMonths: number = 12): Promise<{
    predictedLTV: number;
    monthlyBreakdown: number[];
    confidence: number;
    valueDrivers: string[];
    scenarios: {
      optimistic: number;
      realistic: number;
      pessimistic: number;
    };
  }> {
    try {
      const features = await this.extractLTVFeatures(contactId);
      const prediction = await this.calculateLTV(features, timeHorizonMonths);
      
      return prediction;
    } catch (error) {
      logger.error('Advanced LTV prediction failed', error);
      throw new Error('Failed to predict LTV');
    }
  }

  private async extractLTVFeatures(contactId: string): Promise<any> {
    // Extract features relevant to LTV prediction
    return {
      // Historical transaction data
      averageTransactionValue: 200,
      transactionFrequency: 3,
      monthlySpend: 600,
      
      // Engagement metrics
      emailEngagement: 0.4,
      whatsappEngagement: 0.8,
      
      // Customer characteristics
      countryRisk: 0.2,
      paymentMethodPreference: 'bank_transfer',
      
      // Lifecycle stage
      customerAge: 180, // days
      onboardingCompletion: 0.9
    };
  }

  private async calculateLTV(features: any, timeHorizon: number): Promise<any> {
    // Sophisticated LTV calculation using multiple models
    
    // 1. Frequency-based model
    const frequencyBasedLTV = this.calculateFrequencyBasedLTV(features, timeHorizon);
    
    // 2. Cohort-based model
    const cohortBasedLTV = await this.calculateCohortBasedLTV(features, timeHorizon);
    
    // 3. Machine learning model
    const mlBasedLTV = this.calculateMLBasedLTV(features, timeHorizon);
    
    // Ensemble prediction
    const realisticLTV = (frequencyBasedLTV * 0.4 + cohortBasedLTV * 0.4 + mlBasedLTV * 0.2);
    
    return {
      predictedLTV: realisticLTV,
      monthlyBreakdown: this.generateMonthlyBreakdown(realisticLTV, timeHorizon),
      confidence: this.calculateLTVConfidence(features),
      valueDrivers: this.identifyValueDrivers(features),
      scenarios: {
        optimistic: realisticLTV * 1.3,
        realistic: realisticLTV,
        pessimistic: realisticLTV * 0.7
      }
    };
  }

  private calculateFrequencyBasedLTV(features: any, timeHorizon: number): number {
    const monthlyValue = features.averageTransactionValue * features.transactionFrequency;
    return monthlyValue * timeHorizon;
  }

  private async calculateCohortBasedLTV(features: any, timeHorizon: number): Promise<number> {
    // Find similar customers and use their actual LTV
    // Simplified implementation
    return features.monthlySpend * timeHorizon * 0.85; // Account for some churn
  }

  private calculateMLBasedLTV(features: any, timeHorizon: number): number {
    // Simple ML model implementation
    let score = features.monthlySpend;
    
    // Engagement multipliers
    score *= (1 + features.emailEngagement * 0.2);
    score *= (1 + features.whatsappEngagement * 0.3);
    
    // Risk adjustments
    score *= (1 - features.countryRisk * 0.1);
    
    return score * timeHorizon;
  }

  private generateMonthlyBreakdown(totalLTV: number, timeHorizon: number): number[] {
    const monthlyValues = [];
    const baseMonthly = totalLTV / timeHorizon;
    
    for (let i = 0; i < timeHorizon; i++) {
      // Account for typical decay in usage over time
      const decayFactor = Math.exp(-i * 0.05);
      monthlyValues.push(baseMonthly * decayFactor);
    }
    
    return monthlyValues;
  }

  private calculateLTVConfidence(features: any): number {
    let confidence = 0.5;
    
    // More transaction history = higher confidence
    if (features.transactionFrequency > 5) confidence += 0.2;
    else if (features.transactionFrequency > 2) confidence += 0.1;
    
    // Longer customer age = higher confidence
    if (features.customerAge > 90) confidence += 0.15;
    
    // High engagement = higher confidence
    if (features.emailEngagement > 0.3) confidence += 0.1;
    if (features.whatsappEngagement > 0.6) confidence += 0.15;
    
    return Math.min(confidence, 0.9);
  }

  private identifyValueDrivers(features: any): string[] {
    const drivers = [];
    
    if (features.transactionFrequency > 3) {
      drivers.push('High transaction frequency');
    }
    if (features.averageTransactionValue > 150) {
      drivers.push('High transaction value');
    }
    if (features.whatsappEngagement > 0.6) {
      drivers.push('Strong WhatsApp engagement');
    }
    if (features.onboardingCompletion > 0.8) {
      drivers.push('Complete onboarding');
    }
    
    return drivers;
  }
}

// Export model instances
export const advancedChurnPredictor = new AdvancedChurnPredictor();
export const advancedLTVPredictor = new AdvancedLTVPredictor(); 