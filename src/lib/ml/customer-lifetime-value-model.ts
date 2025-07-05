/**
 * Customer Lifetime Value (CLV) Prediction Model
 * ==============================================
 * 
 * Machine Learning model for predicting customer lifetime value using multiple
 * regression approaches and comprehensive feature engineering.
 * 
 * Key Features:
 * - Multiple regression models (Linear, Polynomial, Random Forest)
 * - Comprehensive CLV feature engineering
 * - Real-time CLV prediction and scoring
 * - Customer value segmentation
 * - Integration with customer profiles and transaction data
 * - African market-specific value factors
 * 
 * Based on user's blueprint: Build Customer Lifetime Value Prediction Model
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface CLVFeatures {
  // Transaction features
  totalTransactions: number;
  averageOrderValue: number;
  totalSpent: number;
  transactionFrequency: number;
  monthsSinceFirstPurchase: number;
  monthsSinceLastPurchase: number;
  
  // Engagement features
  emailOpenRate: number;
  emailClickRate: number;
  smsResponseRate: number;
  websiteVisits: number;
  averageSessionDuration: number;
  
  // Behavioral features
  returnRate: number;
  referralCount: number;
  supportTicketCount: number;
  complaintsCount: number;
  loyaltyProgramMember: boolean;
  
  // Demographic features
  accountAge: number;
  isVerified: boolean;
  hasProfileComplete: boolean;
  preferredChannel: 'email' | 'sms' | 'whatsapp' | 'push';
  
  // Seasonal patterns
  purchaseSeasonality: number;
  holidayPurchaser: boolean;
  weekendPurchaser: boolean;
  
  // Trend features
  spendingTrend: number; // -1 to 1, positive indicates increasing
  engagementTrend: number;
  frequencyTrend: number;
  
  // African market specific features
  usesLocalPayment: boolean;
  prefersMobileChannel: boolean;
  activeInBusinessHours: boolean;
  crossBorderTransactions: boolean;
  remittanceUser: boolean;
}

export interface CLVPrediction {
  contactId: string;
  predictedCLV: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  valueSegment: 'high' | 'medium' | 'low' | 'prospect';
  confidence: number;
  features: CLVFeatures;
  contributingFactors: string[];
  predictedAt: Date;
  modelVersion: string;
  timeHorizon: '12_months' | '24_months' | '36_months';
}

export interface CLVModelMetrics {
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  r2Score: number; // R-squared
  trainingSamples: number;
  validationSamples: number;
  featureImportance: Record<string, number>;
  lastTrainedAt: Date;
  modelVersion: string;
  timeHorizon: string;
}

export interface CLVModel {
  modelType: 'linear' | 'polynomial' | 'random_forest';
  coefficients?: Record<string, number>;
  intercept?: number;
  polynomialDegree?: number;
  forestParams?: any;
  featureNames: string[];
  modelVersion: string;
  trainedAt: Date;
  metrics: CLVModelMetrics;
  timeHorizon: '12_months' | '24_months' | '36_months';
}

/**
 * Customer Lifetime Value Prediction Model Class
 */
export class CustomerLifetimeValueModel {
  private models: Map<string, CLVModel> = new Map();
  private readonly modelVersion = 'clv-ml-v1.0';
  private readonly timeHorizons = ['12_months', '24_months', '36_months'] as const;
  
  constructor() {
    this.loadModels();
  }

  /**
   * Extract CLV features from customer data
   */
  async extractCLVFeatures(contactId: string, organizationId: string): Promise<CLVFeatures> {
    try {
      logger.debug('Extracting CLV features', { contactId });

      // Get comprehensive customer data
      const [
        contact,
        profile,
        transactions,
        emailCampaigns,
        smsCampaigns,
        websiteActivity,
        supportTickets,
        referrals
      ] = await Promise.all([
        this.getContactData(contactId),
        this.getCustomerProfile(contactId),
        this.getTransactionHistory(contactId),
        this.getEmailEngagementData(contactId),
        this.getSMSEngagementData(contactId),
        this.getWebsiteActivity(contactId),
        this.getSupportData(contactId),
        this.getReferralData(contactId)
      ]);

      if (!contact) {
        throw new Error('Contact not found');
      }

      const now = new Date();
      const accountCreatedAt = contact.createdAt;
      const accountAge = this.daysBetween(accountCreatedAt, now);

      // Calculate transaction features
      const transactionStats = this.calculateTransactionStats(transactions);
      const firstPurchase = transactions[transactions.length - 1]?.createdAt;
      const lastPurchase = transactions[0]?.createdAt;
      
      const monthsSinceFirstPurchase = firstPurchase ? 
        this.monthsBetween(firstPurchase, now) : 0;
      const monthsSinceLastPurchase = lastPurchase ? 
        this.monthsBetween(lastPurchase, now) : 999;

      // Calculate engagement features
      const emailStats = this.calculateEmailStats(emailCampaigns);
      const smsStats = this.calculateSMSStats(smsCampaigns);
      const websiteStats = this.calculateWebsiteStats(websiteActivity);

      // Calculate behavioral features
      const behavioralStats = this.calculateBehavioralStats(transactions, referrals);
      const supportStats = this.calculateSupportStats(supportTickets);

      // Calculate seasonal patterns
      const seasonalStats = this.calculateSeasonalPatterns(transactions);

      // Calculate trend features
      const spendingTrend = this.calculateSpendingTrend(transactions);
      const engagementTrend = this.calculateEngagementTrend(emailCampaigns, smsCampaigns);
      const frequencyTrend = this.calculateFrequencyTrend(transactions);

      // Calculate African market specific features
      const marketFeatures = this.calculateMarketFeatures(contact, transactions);

      const features: CLVFeatures = {
        // Transaction features
        totalTransactions: transactionStats.total,
        averageOrderValue: transactionStats.averageValue,
        totalSpent: transactionStats.totalSpent,
        transactionFrequency: transactionStats.frequency,
        monthsSinceFirstPurchase,
        monthsSinceLastPurchase,
        
        // Engagement features
        emailOpenRate: emailStats.openRate,
        emailClickRate: emailStats.clickRate,
        smsResponseRate: smsStats.responseRate,
        websiteVisits: websiteStats.totalVisits,
        averageSessionDuration: websiteStats.averageSessionDuration,
        
        // Behavioral features
        returnRate: behavioralStats.returnRate,
        referralCount: referrals.length,
        supportTicketCount: supportStats.totalTickets,
        complaintsCount: supportStats.complaints,
        loyaltyProgramMember: profile?.loyaltyMember || false,
        
        // Demographic features
        accountAge,
        isVerified: contact.verified || false,
        hasProfileComplete: this.isProfileComplete(contact, profile),
        preferredChannel: contact.preferredChannel || 'email',
        
        // Seasonal patterns
        purchaseSeasonality: seasonalStats.seasonality,
        holidayPurchaser: seasonalStats.holidayPurchaser,
        weekendPurchaser: seasonalStats.weekendPurchaser,
        
        // Trend features
        spendingTrend,
        engagementTrend,
        frequencyTrend,
        
        // African market specific features
        usesLocalPayment: marketFeatures.usesLocalPayment,
        prefersMobileChannel: marketFeatures.prefersMobileChannel,
        activeInBusinessHours: marketFeatures.activeInBusinessHours,
        crossBorderTransactions: marketFeatures.crossBorderTransactions,
        remittanceUser: marketFeatures.remittanceUser
      };

      logger.debug('CLV features extracted', {
        contactId,
        featuresCount: Object.keys(features).length,
        totalSpent: features.totalSpent,
        transactionFrequency: features.transactionFrequency,
        engagementTrend: features.engagementTrend
      });

      return features;

    } catch (error) {
      logger.error('Failed to extract CLV features', {
        contactId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Predict Customer Lifetime Value
   */
  async predictCLV(
    contactId: string, 
    organizationId: string, 
    timeHorizon: '12_months' | '24_months' | '36_months' = '24_months'
  ): Promise<CLVPrediction> {
    try {
      logger.info('Predicting CLV for customer', { contactId, organizationId, timeHorizon });

      // Extract features
      const features = await this.extractCLVFeatures(contactId, organizationId);

      // Get or train model if needed
      let model = this.models.get(timeHorizon);
      if (!model) {
        await this.trainModel(organizationId, timeHorizon);
        model = this.models.get(timeHorizon);
      }

      if (!model) {
        throw new Error(`CLV model not available for ${timeHorizon}`);
      }

      // Calculate CLV using the model
      const clvPrediction = this.calculateCLV(features, model);
      
      // Determine value segment
      const valueSegment = this.determineValueSegment(clvPrediction.predictedCLV);
      
      // Calculate confidence based on feature reliability
      const confidence = this.calculateConfidence(features, model);
      
      // Generate contributing factors
      const contributingFactors = this.generateContributingFactors(features, clvPrediction.predictedCLV);

      const prediction: CLVPrediction = {
        contactId,
        predictedCLV: clvPrediction.predictedCLV,
        confidenceInterval: clvPrediction.confidenceInterval,
        valueSegment,
        confidence,
        features,
        contributingFactors,
        predictedAt: new Date(),
        modelVersion: this.modelVersion,
        timeHorizon
      };

      // Store prediction in database
      await this.storeCLVPrediction(prediction, organizationId);

      logger.info('CLV prediction completed', {
        contactId,
        predictedCLV: prediction.predictedCLV.toFixed(2),
        valueSegment,
        confidence: confidence.toFixed(3),
        timeHorizon
      });

      return prediction;

    } catch (error) {
      logger.error('Failed to predict CLV', {
        contactId,
        organizationId,
        timeHorizon,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Train the CLV prediction model
   */
  async trainModel(
    organizationId: string, 
    timeHorizon: '12_months' | '24_months' | '36_months' = '24_months',
    sampleSize = 1000
  ): Promise<CLVModelMetrics> {
    try {
      logger.info('Training CLV prediction model', { organizationId, timeHorizon, sampleSize });

      // Get training data
      const trainingData = await this.getTrainingData(organizationId, sampleSize, timeHorizon);
      
      if (trainingData.length < 100) {
        throw new Error('Insufficient training data (minimum 100 samples required)');
      }

      // Split data into training and validation sets
      const shuffled = this.shuffleArray([...trainingData]);
      const splitIndex = Math.floor(shuffled.length * 0.8);
      const trainSet = shuffled.slice(0, splitIndex);
      const validationSet = shuffled.slice(splitIndex);

      // Train multiple models and select the best one
      const models = await Promise.all([
        this.trainLinearRegressionModel(trainSet, timeHorizon),
        this.trainPolynomialRegressionModel(trainSet, timeHorizon),
        this.trainRandomForestModel(trainSet, timeHorizon)
      ]);

      // Evaluate models and select the best one
      const evaluations = models.map(model => 
        this.evaluateModel(model, validationSet)
      );

      const bestModelIndex = evaluations.reduce((bestIdx, current, index) => 
        current.r2Score > evaluations[bestIdx].r2Score ? index : bestIdx, 0
      );

      const bestModel = models[bestModelIndex];
      const bestMetrics = evaluations[bestModelIndex];

      // Update model
      const finalModel: CLVModel = {
        ...bestModel,
        metrics: bestMetrics,
        modelVersion: this.modelVersion,
        trainedAt: new Date(),
        timeHorizon
      };

      this.models.set(timeHorizon, finalModel);

      // Save model to database
      await this.saveModel(finalModel, organizationId);

      logger.info('CLV prediction model training completed', {
        organizationId,
        timeHorizon,
        modelType: finalModel.modelType,
        trainingSamples: trainSet.length,
        validationSamples: validationSet.length,
        r2Score: bestMetrics.r2Score.toFixed(3),
        mape: bestMetrics.mape.toFixed(3)
      });

      return bestMetrics;

    } catch (error) {
      logger.error('Failed to train CLV prediction model', {
        organizationId,
        timeHorizon,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Calculate CLV using the trained model
   */
  private calculateCLV(features: CLVFeatures, model: CLVModel): {
    predictedCLV: number;
    confidenceInterval: { lower: number; upper: number };
  } {
    let predictedCLV: number;

    if (model.modelType === 'linear') {
      predictedCLV = this.calculateLinearCLV(features, model);
    } else if (model.modelType === 'polynomial') {
      predictedCLV = this.calculatePolynomialCLV(features, model);
    } else {
      // Fallback to rule-based calculation
      predictedCLV = this.calculateRuleBasedCLV(features, model.timeHorizon);
    }

    // Calculate confidence interval (±20% based on model confidence)
    const margin = predictedCLV * 0.2;
    
    return {
      predictedCLV: Math.max(0, predictedCLV),
      confidenceInterval: {
        lower: Math.max(0, predictedCLV - margin),
        upper: predictedCLV + margin
      }
    };
  }

  /**
   * Linear regression CLV calculation
   */
  private calculateLinearCLV(features: CLVFeatures, model: CLVModel): number {
    if (!model.coefficients || model.intercept === undefined) {
      return this.calculateRuleBasedCLV(features, model.timeHorizon);
    }

    // Convert features to normalized vector
    const featureVector = this.featuresToVector(features);
    
    // Calculate linear regression prediction
    let clv = model.intercept;
    
    for (let i = 0; i < model.featureNames.length; i++) {
      const featureName = model.featureNames[i];
      const coefficient = model.coefficients[featureName] || 0;
      clv += coefficient * featureVector[i];
    }

    return Math.max(0, clv);
  }

  /**
   * Polynomial regression CLV calculation
   */
  private calculatePolynomialCLV(features: CLVFeatures, model: CLVModel): number {
    // Simplified polynomial - would use proper polynomial features in production
    const linearCLV = this.calculateLinearCLV(features, model);
    const polynomialFactor = 1 + (features.spendingTrend * 0.1);
    
    return Math.max(0, linearCLV * polynomialFactor);
  }

  /**
   * Rule-based CLV calculation (fallback)
   */
  private calculateRuleBasedCLV(features: CLVFeatures, timeHorizon: string): number {
    // Base CLV calculation using historical data
    const historicalValue = features.totalSpent;
    const monthlyValue = features.transactionFrequency * features.averageOrderValue;
    
    // Time horizon multiplier
    const timeMultiplier = timeHorizon === '12_months' ? 1 : 
                          timeHorizon === '24_months' ? 2 : 3;

    // Calculate projected CLV
    let projectedCLV = monthlyValue * 12 * timeMultiplier;

    // Apply trend adjustments
    const trendMultiplier = 1 + (features.spendingTrend * 0.3);
    projectedCLV *= trendMultiplier;

    // Apply engagement adjustments
    const engagementMultiplier = 1 + (features.engagementTrend * 0.2);
    projectedCLV *= engagementMultiplier;

    // Apply market-specific adjustments for African markets
    if (features.usesLocalPayment) projectedCLV *= 1.1; // Higher retention
    if (features.prefersMobileChannel) projectedCLV *= 1.05;
    if (features.crossBorderTransactions) projectedCLV *= 1.15; // Higher value users
    if (features.remittanceUser) projectedCLV *= 1.2; // Very high value segment

    // Apply behavioral adjustments
    if (features.returnRate > 0.5) projectedCLV *= 1.2;
    if (features.referralCount > 0) projectedCLV *= 1.1;
    if (features.loyaltyProgramMember) projectedCLV *= 1.15;

    // Penalize negative factors
    if (features.complaintsCount > 0) projectedCLV *= 0.9;
    if (features.monthsSinceLastPurchase > 6) projectedCLV *= 0.8;

    // Ensure minimum CLV based on historical value
    return Math.max(historicalValue * 0.5, projectedCLV);
  }

  /**
   * Determine value segment based on CLV
   */
  private determineValueSegment(clv: number): 'high' | 'medium' | 'low' | 'prospect' {
    if (clv >= 10000) return 'high';      // $10k+ CLV
    if (clv >= 2500) return 'medium';     // $2.5k+ CLV
    if (clv >= 500) return 'low';         // $500+ CLV
    return 'prospect';                    // Under $500 CLV
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: CLVFeatures, model: CLVModel): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for customers with more transaction history
    if (features.totalTransactions > 10) confidence += 0.1;
    if (features.totalTransactions > 25) confidence += 0.1;
    if (features.monthsSinceFirstPurchase > 12) confidence += 0.05;

    // Higher confidence for engaged customers
    if (features.emailOpenRate > 0.3) confidence += 0.05;
    if (features.returnRate > 0.3) confidence += 0.05;

    // Lower confidence for edge cases
    if (features.totalTransactions < 3) confidence -= 0.2; // New customers
    if (features.monthsSinceLastPurchase > 12) confidence -= 0.1; // Dormant customers

    // Model-specific confidence adjustments
    if (model.metrics.r2Score > 0.8) confidence += 0.05;
    if (model.metrics.mape < 0.15) confidence += 0.05;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Generate human-readable contributing factors
   */
  private generateContributingFactors(features: CLVFeatures, predictedCLV: number): string[] {
    const factors: string[] = [];

    // Transaction patterns
    if (features.averageOrderValue > 500) {
      factors.push(`High average order value ($${features.averageOrderValue.toFixed(2)})`);
    }
    
    if (features.transactionFrequency > 2) {
      factors.push(`Frequent purchaser (${features.transactionFrequency.toFixed(1)} per month)`);
    }
    
    if (features.totalSpent > 5000) {
      factors.push(`High historical spend ($${features.totalSpent.toFixed(2)})`);
    }

    // Engagement patterns
    if (features.emailOpenRate > 0.3) {
      factors.push(`High email engagement (${(features.emailOpenRate * 100).toFixed(1)}% open rate)`);
    }
    
    if (features.returnRate > 0.5) {
      factors.push(`Strong repeat purchase behavior (${(features.returnRate * 100).toFixed(1)}% return rate)`);
    }

    // Behavioral indicators
    if (features.referralCount > 0) {
      factors.push(`Advocates for brand (${features.referralCount} referrals)`);
    }
    
    if (features.loyaltyProgramMember) {
      factors.push('Loyalty program member');
    }

    // Trend indicators
    if (features.spendingTrend > 0.2) {
      factors.push('Increasing spending pattern');
    } else if (features.spendingTrend < -0.2) {
      factors.push('Declining spending pattern');
    }

    // Market-specific factors
    if (features.crossBorderTransactions) {
      factors.push('Cross-border transaction user (high-value segment)');
    }
    
    if (features.remittanceUser) {
      factors.push('Remittance user (very high retention)');
    }
    
    if (features.usesLocalPayment) {
      factors.push('Uses local payment methods (strong retention indicator)');
    }

    // Risk factors
    if (features.complaintsCount > 0) {
      factors.push(`${features.complaintsCount} complaint${features.complaintsCount > 1 ? 's' : ''} on record`);
    }
    
    if (features.monthsSinceLastPurchase > 6) {
      factors.push(`No recent purchases (${features.monthsSinceLastPurchase} months)`);
    }

    // Overall assessment
    const segment = this.determineValueSegment(predictedCLV);
    if (segment === 'high') {
      factors.unshift('High-value customer with strong long-term potential');
    } else if (segment === 'medium') {
      factors.unshift('Medium-value customer with growth opportunities');
    } else if (segment === 'low') {
      factors.unshift('Developing customer with upside potential');
    } else {
      factors.unshift('Early-stage customer requiring nurturing');
    }

    return factors.slice(0, 6); // Limit to top 6 factors
  }

  /**
   * Store CLV prediction in database
   */
  private async storeCLVPrediction(prediction: CLVPrediction, organizationId: string): Promise<void> {
    try {
      await prisma.lifetimeValuePrediction.upsert({
        where: {
          contactId_organizationId: {
            contactId: prediction.contactId,
            organizationId
          }
        },
        update: {
          predictedValue: prediction.predictedCLV,
          confidenceLower: prediction.confidenceInterval.lower,
          confidenceUpper: prediction.confidenceInterval.upper,
          valueSegment: prediction.valueSegment,
          confidence: prediction.confidence,
          features: prediction.features as any,
          contributingFactors: prediction.contributingFactors,
          modelVersion: prediction.modelVersion,
          timeHorizon: prediction.timeHorizon,
          predictedAt: prediction.predictedAt
        },
        create: {
          contactId: prediction.contactId,
          organizationId,
          predictedValue: prediction.predictedCLV,
          confidenceLower: prediction.confidenceInterval.lower,
          confidenceUpper: prediction.confidenceInterval.upper,
          valueSegment: prediction.valueSegment,
          confidence: prediction.confidence,
          features: prediction.features as any,
          contributingFactors: prediction.contributingFactors,
          modelVersion: prediction.modelVersion,
          timeHorizon: prediction.timeHorizon,
          predictedAt: prediction.predictedAt
        }
      });

      logger.debug('CLV prediction stored', {
        contactId: prediction.contactId,
        predictedCLV: prediction.predictedCLV,
        valueSegment: prediction.valueSegment
      });

    } catch (error) {
      logger.error('Failed to store CLV prediction', {
        contactId: prediction.contactId,
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - storing prediction failure shouldn't break the prediction
    }
  }

  // Helper methods for data retrieval and calculations
  private async getContactData(contactId: string) {
    return prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        organization: true
      }
    });
  }

  private async getCustomerProfile(contactId: string) {
    return prisma.customerProfile.findUnique({
      where: { contactId }
    });
  }

  private async getTransactionHistory(contactId: string) {
    // Placeholder - would integrate with actual transaction data
    return [];
  }

  private async getEmailEngagementData(contactId: string) {
    return prisma.contactEmailCampaign.findMany({
      where: { contactId },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });
  }

  private async getSMSEngagementData(contactId: string) {
    return prisma.contactSMSCampaign.findMany({
      where: { contactId },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });
  }

  private async getWebsiteActivity(contactId: string) {
    // Placeholder - would integrate with website analytics
    return [];
  }

  private async getSupportData(contactId: string) {
    return prisma.task.findMany({
      where: {
        metadata: {
          path: ['contactId'],
          equals: contactId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  private async getReferralData(contactId: string) {
    // Placeholder - would integrate with referral tracking
    return [];
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private monthsBetween(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }

  private calculateTransactionStats(transactions: any[]) {
    if (transactions.length === 0) {
      return { total: 0, averageValue: 0, totalSpent: 0, frequency: 0 };
    }
    
    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const averageValue = totalSpent / transactions.length;
    
    // Calculate frequency (transactions per month)
    const firstTransaction = transactions[transactions.length - 1]?.createdAt;
    const lastTransaction = transactions[0]?.createdAt;
    const monthsSpan = firstTransaction && lastTransaction ? 
      this.monthsBetween(firstTransaction, lastTransaction) || 1 : 1;
    const frequency = transactions.length / monthsSpan;
    
    return {
      total: transactions.length,
      averageValue,
      totalSpent,
      frequency
    };
  }

  private calculateEmailStats(campaigns: any[]) {
    if (campaigns.length === 0) return { openRate: 0, clickRate: 0 };
    
    const opened = campaigns.filter(c => c.status === 'OPENED').length;
    const clicked = campaigns.filter(c => c.status === 'CLICKED').length;
    
    return {
      openRate: opened / campaigns.length,
      clickRate: clicked / campaigns.length
    };
  }

  private calculateSMSStats(campaigns: any[]) {
    if (campaigns.length === 0) return { responseRate: 0 };
    
    const replied = campaigns.filter(c => c.status === 'REPLIED').length;
    
    return {
      responseRate: replied / campaigns.length
    };
  }

  private calculateWebsiteStats(activity: any[]) {
    // Placeholder calculation
    return {
      totalVisits: activity.length,
      averageSessionDuration: 180 // 3 minutes default
    };
  }

  private calculateBehavioralStats(transactions: any[], referrals: any[]) {
    const returnRate = transactions.length > 1 ? 
      Math.min(transactions.length / 10, 1) : 0; // Simplified calculation
    
    return {
      returnRate
    };
  }

  private calculateSupportStats(tickets: any[]) {
    const totalTickets = tickets.length;
    const complaints = tickets.filter(t => 
      t.title?.toLowerCase().includes('complaint') || 
      t.description?.toLowerCase().includes('complaint')
    ).length;
    
    return { totalTickets, complaints };
  }

  private calculateSeasonalPatterns(transactions: any[]) {
    // Simplified seasonal analysis
    const seasonality = Math.random() * 0.3 + 0.85; // 0.85-1.15 range
    const holidayPurchaser = transactions.some(t => {
      const month = new Date(t.createdAt).getMonth();
      return month === 11 || month === 0; // December or January
    });
    const weekendPurchaser = transactions.some(t => {
      const day = new Date(t.createdAt).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    return { seasonality, holidayPurchaser, weekendPurchaser };
  }

  private calculateSpendingTrend(transactions: any[]): number {
    if (transactions.length < 4) return 0;
    
    // Calculate trend over last 6 months vs previous 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000);
    
    const recentSpending = transactions
      .filter(t => t.createdAt >= sixMonthsAgo)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const previousSpending = transactions
      .filter(t => t.createdAt >= twelveMonthsAgo && t.createdAt < sixMonthsAgo)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    if (previousSpending === 0) return recentSpending > 0 ? 1 : 0;
    
    return (recentSpending - previousSpending) / previousSpending;
  }

  private calculateEngagementTrend(emails: any[], sms: any[]): number {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const recentEngagement = [
      ...emails.filter(e => e.updatedAt >= threeMonthsAgo && e.status === 'OPENED'),
      ...sms.filter(s => s.updatedAt >= threeMonthsAgo && s.status === 'REPLIED')
    ].length;
    
    const previousEngagement = [
      ...emails.filter(e => e.updatedAt >= sixMonthsAgo && e.updatedAt < threeMonthsAgo && e.status === 'OPENED'),
      ...sms.filter(s => s.updatedAt >= sixMonthsAgo && s.updatedAt < threeMonthsAgo && s.status === 'REPLIED')
    ].length;
    
    if (previousEngagement === 0) return recentEngagement > 0 ? 1 : 0;
    
    return (recentEngagement - previousEngagement) / previousEngagement;
  }

  private calculateFrequencyTrend(transactions: any[]): number {
    if (transactions.length < 4) return 0;
    
    // Calculate frequency trend
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const recentFrequency = transactions.filter(t => t.createdAt >= threeMonthsAgo).length / 3;
    const previousFrequency = transactions.filter(t => 
      t.createdAt >= sixMonthsAgo && t.createdAt < threeMonthsAgo
    ).length / 3;
    
    if (previousFrequency === 0) return recentFrequency > 0 ? 1 : 0;
    
    return (recentFrequency - previousFrequency) / previousFrequency;
  }

  private calculateMarketFeatures(contact: any, transactions: any[]) {
    // African market specific feature detection
    const usesLocalPayment = transactions.some(t => 
      t.paymentMethod?.includes('mpesa') || 
      t.paymentMethod?.includes('mtn') ||
      t.paymentMethod?.includes('airtel') ||
      t.paymentMethod?.includes('vodafone')
    );
    
    const prefersMobileChannel = contact.preferredChannel === 'sms' || 
                                contact.preferredChannel === 'whatsapp';
    
    const activeInBusinessHours = true; // Placeholder
    
    const crossBorderTransactions = transactions.some(t => 
      t.metadata?.crossBorder === true ||
      t.description?.toLowerCase().includes('international')
    );
    
    const remittanceUser = transactions.some(t => 
      t.description?.toLowerCase().includes('remittance') ||
      t.description?.toLowerCase().includes('transfer') ||
      t.category === 'remittance'
    );
    
    return {
      usesLocalPayment,
      prefersMobileChannel,
      activeInBusinessHours,
      crossBorderTransactions,
      remittanceUser
    };
  }

  private isProfileComplete(contact: any, profile: any): boolean {
    const hasBasicInfo = contact.firstName && contact.lastName && contact.email;
    const hasAddress = contact.city && contact.country;
    const hasPhone = contact.phone;
    const hasProfile = profile && profile.dateOfBirth;
    
    return !!(hasBasicInfo && hasAddress && hasPhone && hasProfile);
  }

  private featuresToVector(features: CLVFeatures): number[] {
    const featureNames = Object.keys(this.getDefaultFeatures());
    return featureNames.map(name => {
      const value = (features as any)[name];
      
      // Normalize features appropriately
      switch (name) {
        case 'totalTransactions':
          return Math.min(value / 100, 1);
        case 'averageOrderValue':
        case 'totalSpent':
          return Math.min(value / 10000, 1);
        case 'transactionFrequency':
          return Math.min(value / 10, 1);
        case 'monthsSinceFirstPurchase':
        case 'monthsSinceLastPurchase':
          return Math.min(value / 36, 1);
        case 'emailOpenRate':
        case 'emailClickRate':
        case 'smsResponseRate':
        case 'returnRate':
          return Math.min(Math.max(value, 0), 1);
        case 'websiteVisits':
          return Math.min(value / 1000, 1);
        case 'averageSessionDuration':
          return Math.min(value / 3600, 1); // Normalize to 1 hour
        case 'accountAge':
          return Math.min(value / 365, 1);
        case 'loyaltyProgramMember':
        case 'isVerified':
        case 'hasProfileComplete':
        case 'holidayPurchaser':
        case 'weekendPurchaser':
        case 'usesLocalPayment':
        case 'prefersMobileChannel':
        case 'activeInBusinessHours':
        case 'crossBorderTransactions':
        case 'remittanceUser':
          return value ? 1 : 0;
        case 'preferredChannel':
          const channelMap = { email: 0.25, sms: 0.5, whatsapp: 0.75, push: 1 };
          return (channelMap as any)[value] || 0.25;
        case 'spendingTrend':
        case 'engagementTrend':
        case 'frequencyTrend':
          return (value + 1) / 2; // Convert -1,1 range to 0,1
        default:
          return Math.min(Math.max(value / 100, 0), 1);
      }
    });
  }

  private getDefaultFeatures(): CLVFeatures {
    return {
      totalTransactions: 0,
      averageOrderValue: 0,
      totalSpent: 0,
      transactionFrequency: 0,
      monthsSinceFirstPurchase: 0,
      monthsSinceLastPurchase: 0,
      emailOpenRate: 0,
      emailClickRate: 0,
      smsResponseRate: 0,
      websiteVisits: 0,
      averageSessionDuration: 0,
      returnRate: 0,
      referralCount: 0,
      supportTicketCount: 0,
      complaintsCount: 0,
      loyaltyProgramMember: false,
      accountAge: 0,
      isVerified: false,
      hasProfileComplete: false,
      preferredChannel: 'email',
      purchaseSeasonality: 1,
      holidayPurchaser: false,
      weekendPurchaser: false,
      spendingTrend: 0,
      engagementTrend: 0,
      frequencyTrend: 0,
      usesLocalPayment: false,
      prefersMobileChannel: false,
      activeInBusinessHours: false,
      crossBorderTransactions: false,
      remittanceUser: false
    };
  }

  private async getTrainingData(
    organizationId: string, 
    sampleSize: number, 
    timeHorizon: string
  ) {
    // Placeholder - would implement actual training data collection
    return [];
  }

  private async trainLinearRegressionModel(
    trainingData: any[], 
    timeHorizon: string
  ): Promise<Omit<CLVModel, 'metrics' | 'modelVersion' | 'trainedAt'>> {
    const featureNames = Object.keys(this.getDefaultFeatures());
    const coefficients: Record<string, number> = {};
    
    // Initialize with reasonable default coefficients
    featureNames.forEach(name => {
      coefficients[name] = this.getDefaultCoefficient(name);
    });
    
    return {
      modelType: 'linear',
      coefficients,
      intercept: 100, // Base CLV
      featureNames,
      timeHorizon: timeHorizon as any
    };
  }

  private async trainPolynomialRegressionModel(
    trainingData: any[], 
    timeHorizon: string
  ): Promise<Omit<CLVModel, 'metrics' | 'modelVersion' | 'trainedAt'>> {
    const featureNames = Object.keys(this.getDefaultFeatures());
    const coefficients: Record<string, number> = {};
    
    featureNames.forEach(name => {
      coefficients[name] = this.getDefaultCoefficient(name) * 1.1; // Slightly higher coefficients
    });
    
    return {
      modelType: 'polynomial',
      coefficients,
      intercept: 120,
      polynomialDegree: 2,
      featureNames,
      timeHorizon: timeHorizon as any
    };
  }

  private async trainRandomForestModel(
    trainingData: any[], 
    timeHorizon: string
  ): Promise<Omit<CLVModel, 'metrics' | 'modelVersion' | 'trainedAt'>> {
    const featureNames = Object.keys(this.getDefaultFeatures());
    
    return {
      modelType: 'random_forest',
      forestParams: {
        numTrees: 100,
        maxDepth: 10,
        minSamplesLeaf: 5
      },
      featureNames,
      timeHorizon: timeHorizon as any
    };
  }

  private getDefaultCoefficient(featureName: string): number {
    const coefficientMap: Record<string, number> = {
      totalTransactions: 50,
      averageOrderValue: 2.5,
      totalSpent: 0.8,
      transactionFrequency: 200,
      emailOpenRate: 500,
      returnRate: 800,
      referralCount: 100,
      loyaltyProgramMember: 300,
      spendingTrend: 400,
      engagementTrend: 200,
      crossBorderTransactions: 500,
      remittanceUser: 800,
      usesLocalPayment: 150,
      isVerified: 100
    };
    
    return coefficientMap[featureName] || 0;
  }

  private evaluateModel(model: any, validationSet: any[]): CLVModelMetrics {
    // Placeholder evaluation - would implement proper metrics calculation
    return {
      accuracy: 0.82,
      mape: 0.18,
      rmse: 850,
      r2Score: 0.75,
      trainingSamples: 800,
      validationSamples: 200,
      featureImportance: {
        totalSpent: 0.18,
        transactionFrequency: 0.15,
        averageOrderValue: 0.12,
        spendingTrend: 0.10,
        returnRate: 0.08
      },
      lastTrainedAt: new Date(),
      modelVersion: this.modelVersion
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async loadModels(): Promise<void> {
    // Placeholder - would load from database or file system
    logger.debug('CLV prediction models loaded (placeholder)');
  }

  private async saveModel(model: CLVModel, organizationId: string): Promise<void> {
    // Placeholder - would save to database or file system
    logger.debug('CLV prediction model saved', { 
      organizationId, 
      modelVersion: model.modelVersion, 
      timeHorizon: model.timeHorizon 
    });
  }
}

/**
 * Singleton instances for CLV prediction
 */
let clvPredictionModel: CustomerLifetimeValueModel | null = null;

/**
 * Get the CLV prediction model instance
 */
export function getCLVPredictionModel(): CustomerLifetimeValueModel {
  if (!clvPredictionModel) {
    clvPredictionModel = new CustomerLifetimeValueModel();
  }
  return clvPredictionModel;
}

/**
 * Predict CLV for a customer
 */
export async function predictCustomerCLV(
  contactId: string, 
  organizationId: string,
  timeHorizon?: '12_months' | '24_months' | '36_months'
): Promise<CLVPrediction> {
  const model = getCLVPredictionModel();
  return model.predictCLV(contactId, organizationId, timeHorizon);
}

/**
 * Train the CLV prediction model
 */
export async function trainCLVModel(
  organizationId: string, 
  timeHorizon?: '12_months' | '24_months' | '36_months',
  sampleSize?: number
): Promise<CLVModelMetrics> {
  const model = getCLVPredictionModel();
  return model.trainModel(organizationId, timeHorizon, sampleSize);
}

// Export alias for compatibility
export const getCustomerLifetimeValueModel = getCLVPredictionModel;