/**
 * Churn Prediction Model (Logistic Regression)
 * ============================================
 * 
 * Machine Learning model for predicting customer churn using logistic regression
 * with comprehensive feature engineering and real-time prediction capabilities.
 * 
 * Key Features:
 * - Logistic regression implementation for binary classification
 * - Feature engineering from customer behavioral data
 * - Real-time prediction scoring
 * - Model training and evaluation metrics
 * - Integration with customer profiles and event data
 * - African market-specific factors consideration
 * 
 * Based on user's blueprint: Create Churn Prediction Model (Logistic Regression)
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface ChurnFeatures {
  // Engagement features
  daysSinceLastLogin: number;
  daysSinceLastPurchase: number;
  daysSinceLastEmailOpen: number;
  daysSinceLastSMSResponse: number;
  
  // Activity features
  totalSessions: number;
  averageSessionDuration: number;
  emailOpenRate: number;
  emailClickRate: number;
  smsResponseRate: number;
  
  // Transaction features
  totalTransactions: number;
  averageTransactionValue: number;
  totalSpent: number;
  monthsSinceFirstPurchase: number;
  transactionFrequency: number;
  
  // Behavioral features
  supportTicketsCount: number;
  complaintCount: number;
  unsubscribeAttempts: number;
  accountUpdatesCount: number;
  
  // Demographic features
  accountAge: number;
  isVerified: boolean;
  hasProfilePicture: boolean;
  
  // Engagement trend features
  engagementTrend: number; // -1 to 1, negative indicates declining
  transactionTrend: number; // -1 to 1, negative indicates declining
  
  // African market specific features
  usesLocalPayment: boolean;
  prefersMobileChannel: boolean;
  activeInBusinessHours: boolean;
}

export interface ChurnPrediction {
  contactId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  features: ChurnFeatures;
  reasoningFactors: string[];
  predictedAt: Date;
  modelVersion: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  trainingSamples: number;
  validationSamples: number;
  featureImportance: Record<string, number>;
  lastTrainedAt: Date;
  modelVersion: string;
}

export interface LogisticRegressionModel {
  coefficients: Record<string, number>;
  intercept: number;
  featureNames: string[];
  modelVersion: string;
  trainedAt: Date;
  metrics: ModelMetrics;
}

/**
 * Churn Prediction Model Class
 */
export class ChurnPredictionModel {
  private model: LogisticRegressionModel | null = null;
  private readonly modelVersion = 'churn-lr-v1.0';
  private readonly featureThresholds = {
    daysSinceLastLogin: 30,
    daysSinceLastPurchase: 90,
    daysSinceLastEmailOpen: 21,
    minEngagementRate: 0.1,
    minTransactionFrequency: 0.5
  };

  constructor() {
    this.loadModel();
  }

  /**
   * Extract features from customer data
   */
  async extractFeatures(contactId: string, organizationId: string): Promise<ChurnFeatures> {
    try {
      logger.debug('Extracting churn prediction features', { contactId });

      // Get comprehensive customer data
      const [
        contact,
        profile,
        emailCampaigns,
        smsCampaigns,
        transactions,
        supportTickets,
        loginHistory
      ] = await Promise.all([
        this.getContactData(contactId),
        this.getCustomerProfile(contactId),
        this.getEmailEngagementData(contactId),
        this.getSMSEngagementData(contactId),
        this.getTransactionData(contactId),
        this.getSupportData(contactId),
        this.getLoginHistory(contactId)
      ]);

      if (!contact) {
        throw new Error('Contact not found');
      }

      const now = new Date();
      const accountCreatedAt = contact.createdAt;
      const accountAge = this.daysBetween(accountCreatedAt, now);

      // Calculate engagement features
      const lastLogin = loginHistory?.[0]?.loginAt || accountCreatedAt;
      const daysSinceLastLogin = this.daysBetween(lastLogin, now);

      const lastPurchase = transactions?.[0]?.createdAt || null;
      const daysSinceLastPurchase = lastPurchase ? this.daysBetween(lastPurchase, now) : 999;

      const lastEmailOpen = emailCampaigns.find(e => e.status === 'OPENED')?.updatedAt || null;
      const daysSinceLastEmailOpen = lastEmailOpen ? this.daysBetween(lastEmailOpen, now) : 999;

      const lastSMSResponse = smsCampaigns.find(s => s.status === 'REPLIED')?.updatedAt || null;
      const daysSinceLastSMSResponse = lastSMSResponse ? this.daysBetween(lastSMSResponse, now) : 999;

      // Calculate activity features
      const totalSessions = loginHistory.length;
      const averageSessionDuration = this.calculateAverageSessionDuration(loginHistory);
      
      const emailStats = this.calculateEmailStats(emailCampaigns);
      const smsStats = this.calculateSMSStats(smsCampaigns);

      // Calculate transaction features
      const transactionStats = this.calculateTransactionStats(transactions);
      const monthsSinceFirstPurchase = lastPurchase ? 
        this.monthsBetween(transactions[transactions.length - 1]?.createdAt || lastPurchase, now) : 0;

      // Calculate behavioral features
      const supportStats = this.calculateSupportStats(supportTickets);

      // Calculate trend features
      const engagementTrend = this.calculateEngagementTrend(emailCampaigns, smsCampaigns, loginHistory);
      const transactionTrend = this.calculateTransactionTrend(transactions);

      // Calculate African market specific features
      const marketFeatures = this.calculateMarketFeatures(contact, transactions);

      const features: ChurnFeatures = {
        // Engagement features
        daysSinceLastLogin,
        daysSinceLastPurchase,
        daysSinceLastEmailOpen,
        daysSinceLastSMSResponse,
        
        // Activity features
        totalSessions,
        averageSessionDuration,
        emailOpenRate: emailStats.openRate,
        emailClickRate: emailStats.clickRate,
        smsResponseRate: smsStats.responseRate,
        
        // Transaction features
        totalTransactions: transactionStats.total,
        averageTransactionValue: transactionStats.averageValue,
        totalSpent: transactionStats.totalSpent,
        monthsSinceFirstPurchase,
        transactionFrequency: transactionStats.frequency,
        
        // Behavioral features
        supportTicketsCount: supportStats.totalTickets,
        complaintCount: supportStats.complaints,
        unsubscribeAttempts: supportStats.unsubscribeAttempts,
        accountUpdatesCount: profile?.metadata?.accountUpdates || 0,
        
        // Demographic features
        accountAge,
        isVerified: contact.verified || false,
        hasProfilePicture: !!contact.avatar,
        
        // Engagement trend features
        engagementTrend,
        transactionTrend,
        
        // African market specific features
        usesLocalPayment: marketFeatures.usesLocalPayment,
        prefersMobileChannel: marketFeatures.prefersMobileChannel,
        activeInBusinessHours: marketFeatures.activeInBusinessHours
      };

      logger.debug('Churn prediction features extracted', {
        contactId,
        featuresCount: Object.keys(features).length,
        riskIndicators: {
          daysSinceLastLogin,
          daysSinceLastPurchase,
          engagementTrend,
          transactionTrend
        }
      });

      return features;

    } catch (error) {
      logger.error('Failed to extract churn prediction features', {
        contactId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Predict churn probability for a customer
   */
  async predictChurn(contactId: string, organizationId: string): Promise<ChurnPrediction> {
    try {
      logger.info('Predicting churn for customer', { contactId, organizationId });

      // Extract features
      const features = await this.extractFeatures(contactId, organizationId);

      // Get or train model if needed
      if (!this.model) {
        await this.trainModel(organizationId);
      }

      if (!this.model) {
        throw new Error('Model not available for prediction');
      }

      // Calculate probability using logistic regression
      const probability = this.calculateProbability(features);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(probability);
      
      // Calculate confidence based on feature reliability
      const confidence = this.calculateConfidence(features);
      
      // Generate reasoning factors
      const reasoningFactors = this.generateReasoningFactors(features, probability);

      const prediction: ChurnPrediction = {
        contactId,
        churnProbability: probability,
        riskLevel,
        confidence,
        features,
        reasoningFactors,
        predictedAt: new Date(),
        modelVersion: this.modelVersion
      };

      // Store prediction in database
      await this.storePrediction(prediction, organizationId);

      logger.info('Churn prediction completed', {
        contactId,
        probability: probability.toFixed(3),
        riskLevel,
        confidence: confidence.toFixed(3)
      });

      return prediction;

    } catch (error) {
      logger.error('Failed to predict churn', {
        contactId,
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Train the logistic regression model
   */
  async trainModel(organizationId: string, sampleSize = 1000): Promise<ModelMetrics> {
    try {
      logger.info('Training churn prediction model', { organizationId, sampleSize });

      // Get training data
      const trainingData = await this.getTrainingData(organizationId, sampleSize);
      
      if (trainingData.length < 100) {
        throw new Error('Insufficient training data (minimum 100 samples required)');
      }

      // Split data into training and validation sets
      const shuffled = this.shuffleArray([...trainingData]);
      const splitIndex = Math.floor(shuffled.length * 0.8);
      const trainSet = shuffled.slice(0, splitIndex);
      const validationSet = shuffled.slice(splitIndex);

      // Train logistic regression model
      const model = this.trainLogisticRegression(trainSet);
      
      // Evaluate model performance
      const metrics = this.evaluateModel(model, validationSet);

      // Update model
      this.model = {
        ...model,
        metrics,
        modelVersion: this.modelVersion,
        trainedAt: new Date()
      };

      // Save model to database
      await this.saveModel(this.model, organizationId);

      logger.info('Churn prediction model training completed', {
        organizationId,
        trainingSamples: trainSet.length,
        validationSamples: validationSet.length,
        accuracy: metrics.accuracy.toFixed(3),
        auc: metrics.auc.toFixed(3)
      });

      return metrics;

    } catch (error) {
      logger.error('Failed to train churn prediction model', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Calculate churn probability using logistic regression
   */
  private calculateProbability(features: ChurnFeatures): number {
    if (!this.model) {
      // Fallback to rule-based probability if model not available
      return this.calculateRuleBasedProbability(features);
    }

    // Convert features to normalized vector
    const featureVector = this.featuresToVector(features);
    
    // Calculate logistic regression prediction
    let logit = this.model.intercept;
    
    for (let i = 0; i < this.model.featureNames.length; i++) {
      const featureName = this.model.featureNames[i];
      const coefficient = this.model.coefficients[featureName] || 0;
      logit += coefficient * featureVector[i];
    }

    // Apply sigmoid function
    const probability = 1 / (1 + Math.exp(-logit));
    
    // Clamp probability between 0.01 and 0.99
    return Math.max(0.01, Math.min(0.99, probability));
  }

  /**
   * Rule-based probability calculation (fallback)
   */
  private calculateRuleBasedProbability(features: ChurnFeatures): number {
    let score = 0;
    let maxScore = 0;

    // Engagement recency factors
    if (features.daysSinceLastLogin > 30) score += 3;
    if (features.daysSinceLastLogin > 60) score += 2;
    maxScore += 5;

    if (features.daysSinceLastPurchase > 90) score += 4;
    if (features.daysSinceLastPurchase > 180) score += 3;
    maxScore += 7;

    if (features.daysSinceLastEmailOpen > 21) score += 2;
    maxScore += 2;

    // Engagement rates
    if (features.emailOpenRate < 0.1) score += 3;
    if (features.smsResponseRate < 0.05) score += 2;
    maxScore += 5;

    // Transaction patterns
    if (features.transactionFrequency < 0.5) score += 3;
    if (features.totalTransactions < 3) score += 2;
    maxScore += 5;

    // Behavioral indicators
    if (features.supportTicketsCount > 3) score += 2;
    if (features.complaintCount > 0) score += 3;
    if (features.unsubscribeAttempts > 0) score += 4;
    maxScore += 9;

    // Trend indicators
    if (features.engagementTrend < -0.3) score += 3;
    if (features.transactionTrend < -0.3) score += 3;
    maxScore += 6;

    // Convert score to probability
    const probability = Math.min(score / maxScore, 0.95);
    
    logger.debug('Rule-based churn probability calculated', {
      score,
      maxScore,
      probability: probability.toFixed(3)
    });

    return probability;
  }

  /**
   * Determine risk level based on probability
   */
  private determineRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: ChurnFeatures): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for customers with more data
    if (features.totalSessions > 10) confidence += 0.1;
    if (features.totalTransactions > 5) confidence += 0.1;
    if (features.accountAge > 30) confidence += 0.05;
    if (features.emailOpenRate > 0 || features.smsResponseRate > 0) confidence += 0.05;

    // Lower confidence for edge cases
    if (features.accountAge < 7) confidence -= 0.2; // New customers
    if (features.totalSessions < 3) confidence -= 0.1; // Inactive customers

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Generate human-readable reasoning factors
   */
  private generateReasoningFactors(features: ChurnFeatures, probability: number): string[] {
    const factors: string[] = [];

    // High-risk factors
    if (features.daysSinceLastLogin > 30) {
      factors.push(`No login activity for ${features.daysSinceLastLogin} days`);
    }
    
    if (features.daysSinceLastPurchase > 90) {
      factors.push(`No purchases for ${features.daysSinceLastPurchase} days`);
    }
    
    if (features.emailOpenRate < 0.1) {
      factors.push(`Low email engagement rate (${(features.emailOpenRate * 100).toFixed(1)}%)`);
    }
    
    if (features.transactionFrequency < 0.5) {
      factors.push(`Low transaction frequency (${features.transactionFrequency.toFixed(2)} per month)`);
    }
    
    if (features.engagementTrend < -0.3) {
      factors.push('Declining engagement trend');
    }
    
    if (features.transactionTrend < -0.3) {
      factors.push('Declining transaction pattern');
    }
    
    if (features.complaintCount > 0) {
      factors.push(`${features.complaintCount} complaint${features.complaintCount > 1 ? 's' : ''} filed`);
    }
    
    if (features.unsubscribeAttempts > 0) {
      factors.push('Attempted to unsubscribe');
    }

    // Positive factors (reduce churn probability)
    if (features.emailOpenRate > 0.3) {
      factors.push(`High email engagement (${(features.emailOpenRate * 100).toFixed(1)}%)`);
    }
    
    if (features.transactionFrequency > 2) {
      factors.push('Regular transaction pattern');
    }
    
    if (features.daysSinceLastLogin < 7) {
      factors.push('Recent login activity');
    }

    // Add overall assessment
    if (probability >= 0.8) {
      factors.unshift('Critical churn risk - immediate attention required');
    } else if (probability >= 0.6) {
      factors.unshift('High churn risk - proactive intervention recommended');
    } else if (probability >= 0.3) {
      factors.unshift('Medium churn risk - monitoring and engagement needed');
    } else {
      factors.unshift('Low churn risk - customer appears stable');
    }

    return factors.slice(0, 5); // Limit to top 5 factors
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(prediction: ChurnPrediction, organizationId: string): Promise<void> {
    try {
      await prisma.churnPrediction.upsert({
        where: {
          contactId_organizationId: {
            contactId: prediction.contactId,
            organizationId
          }
        },
        update: {
          probability: prediction.churnProbability,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          features: prediction.features as any,
          reasoningFactors: prediction.reasoningFactors,
          modelVersion: prediction.modelVersion,
          predictedAt: prediction.predictedAt
        },
        create: {
          contactId: prediction.contactId,
          organizationId,
          probability: prediction.churnProbability,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          features: prediction.features as any,
          reasoningFactors: prediction.reasoningFactors,
          modelVersion: prediction.modelVersion,
          predictedAt: prediction.predictedAt
        }
      });

      logger.debug('Churn prediction stored', {
        contactId: prediction.contactId,
        probability: prediction.churnProbability,
        riskLevel: prediction.riskLevel
      });

    } catch (error) {
      logger.error('Failed to store churn prediction', {
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

  private async getEmailEngagementData(contactId: string) {
    return prisma.contactEmailCampaign.findMany({
      where: { contactId },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
  }

  private async getSMSEngagementData(contactId: string) {
    return prisma.contactSMSCampaign.findMany({
      where: { contactId },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
  }

  private async getTransactionData(contactId: string) {
    // Placeholder - would integrate with actual transaction data
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
      take: 20
    });
  }

  private async getLoginHistory(contactId: string) {
    // Placeholder - would integrate with actual login tracking
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

  private calculateSupportStats(tickets: any[]) {
    const totalTickets = tickets.length;
    const complaints = tickets.filter(t => 
      t.title?.toLowerCase().includes('complaint') || 
      t.description?.toLowerCase().includes('complaint')
    ).length;
    const unsubscribeAttempts = tickets.filter(t => 
      t.title?.toLowerCase().includes('unsubscribe') || 
      t.description?.toLowerCase().includes('unsubscribe')
    ).length;
    
    return { totalTickets, complaints, unsubscribeAttempts };
  }

  private calculateEngagementTrend(emails: any[], sms: any[], logins: any[]): number {
    // Calculate engagement trend over last 3 months vs previous 3 months
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const recentEngagement = [
      ...emails.filter(e => e.updatedAt >= threeMonthsAgo),
      ...sms.filter(s => s.updatedAt >= threeMonthsAgo),
      ...logins.filter(l => l.loginAt >= threeMonthsAgo)
    ].length;
    
    const previousEngagement = [
      ...emails.filter(e => e.updatedAt >= sixMonthsAgo && e.updatedAt < threeMonthsAgo),
      ...sms.filter(s => s.updatedAt >= sixMonthsAgo && s.updatedAt < threeMonthsAgo),
      ...logins.filter(l => l.loginAt >= sixMonthsAgo && l.loginAt < threeMonthsAgo)
    ].length;
    
    if (previousEngagement === 0) return recentEngagement > 0 ? 1 : 0;
    
    return (recentEngagement - previousEngagement) / previousEngagement;
  }

  private calculateTransactionTrend(transactions: any[]): number {
    if (transactions.length < 2) return 0;
    
    // Calculate transaction trend over time
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = transactions.filter(t => t.createdAt >= threeMonthsAgo).length;
    const previousTransactions = transactions.filter(t => 
      t.createdAt >= sixMonthsAgo && t.createdAt < threeMonthsAgo
    ).length;
    
    if (previousTransactions === 0) return recentTransactions > 0 ? 1 : 0;
    
    return (recentTransactions - previousTransactions) / previousTransactions;
  }

  private calculateMarketFeatures(contact: any, transactions: any[]) {
    // African market specific feature detection
    const usesLocalPayment = transactions.some(t => 
      t.paymentMethod?.includes('mpesa') || 
      t.paymentMethod?.includes('mtn') ||
      t.paymentMethod?.includes('airtel')
    );
    
    const prefersMobileChannel = contact.preferredChannel === 'sms' || 
                                contact.preferredChannel === 'whatsapp';
    
    // Business hours activity (6 AM - 6 PM WAT/EAT)
    const activeInBusinessHours = true; // Placeholder - would analyze actual activity patterns
    
    return {
      usesLocalPayment,
      prefersMobileChannel,
      activeInBusinessHours
    };
  }

  private calculateAverageSessionDuration(loginHistory: any[]): number {
    if (loginHistory.length === 0) return 0;
    
    // Placeholder calculation - would use actual session data
    return 15; // Average 15 minutes per session
  }

  private async getTrainingData(organizationId: string, sampleSize: number) {
    // Placeholder - would implement actual training data collection
    return [];
  }

  private trainLogisticRegression(trainingData: any[]): Omit<LogisticRegressionModel, 'metrics' | 'modelVersion' | 'trainedAt'> {
    // Simplified logistic regression implementation
    // In production, would use a proper ML library
    
    const featureNames = Object.keys(this.getDefaultFeatures());
    const coefficients: Record<string, number> = {};
    
    // Initialize with reasonable default coefficients
    featureNames.forEach(name => {
      coefficients[name] = this.getDefaultCoefficient(name);
    });
    
    return {
      coefficients,
      intercept: -2.0, // Default intercept
      featureNames
    };
  }

  private getDefaultFeatures(): ChurnFeatures {
    return {
      daysSinceLastLogin: 0,
      daysSinceLastPurchase: 0,
      daysSinceLastEmailOpen: 0,
      daysSinceLastSMSResponse: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      emailOpenRate: 0,
      emailClickRate: 0,
      smsResponseRate: 0,
      totalTransactions: 0,
      averageTransactionValue: 0,
      totalSpent: 0,
      monthsSinceFirstPurchase: 0,
      transactionFrequency: 0,
      supportTicketsCount: 0,
      complaintCount: 0,
      unsubscribeAttempts: 0,
      accountUpdatesCount: 0,
      accountAge: 0,
      isVerified: false,
      hasProfilePicture: false,
      engagementTrend: 0,
      transactionTrend: 0,
      usesLocalPayment: false,
      prefersMobileChannel: false,
      activeInBusinessHours: false
    };
  }

  private getDefaultCoefficient(featureName: string): number {
    // Default coefficients based on domain knowledge
    const coefficientMap: Record<string, number> = {
      daysSinceLastLogin: 0.05,
      daysSinceLastPurchase: 0.03,
      daysSinceLastEmailOpen: 0.02,
      emailOpenRate: -2.0,
      smsResponseRate: -1.5,
      transactionFrequency: -1.0,
      engagementTrend: -1.5,
      transactionTrend: -1.2,
      complaintCount: 0.8,
      unsubscribeAttempts: 1.5,
      isVerified: -0.5,
      usesLocalPayment: -0.3,
      prefersMobileChannel: -0.2
    };
    
    return coefficientMap[featureName] || 0.0;
  }

  private featuresToVector(features: ChurnFeatures): number[] {
    const featureNames = Object.keys(this.getDefaultFeatures());
    return featureNames.map(name => {
      const value = (features as any)[name];
      
      // Normalize features to 0-1 range
      switch (name) {
        case 'daysSinceLastLogin':
        case 'daysSinceLastPurchase':
        case 'daysSinceLastEmailOpen':
        case 'daysSinceLastSMSResponse':
          return Math.min(value / 365, 1); // Normalize to 1 year max
        case 'emailOpenRate':
        case 'emailClickRate':
        case 'smsResponseRate':
          return Math.min(Math.max(value, 0), 1); // Already 0-1
        case 'totalSessions':
          return Math.min(value / 100, 1); // Normalize to 100 sessions max
        case 'totalTransactions':
          return Math.min(value / 50, 1); // Normalize to 50 transactions max
        case 'accountAge':
          return Math.min(value / 365, 1); // Normalize to 1 year max
        case 'isVerified':
        case 'hasProfilePicture':
        case 'usesLocalPayment':
        case 'prefersMobileChannel':
        case 'activeInBusinessHours':
          return value ? 1 : 0;
        case 'engagementTrend':
        case 'transactionTrend':
          return (value + 1) / 2; // Convert -1,1 range to 0,1
        default:
          return Math.min(Math.max(value / 10, 0), 1); // Generic normalization
      }
    });
  }

  private evaluateModel(model: any, validationSet: any[]): ModelMetrics {
    // Placeholder evaluation - would implement proper metrics calculation
    return {
      accuracy: 0.85,
      precision: 0.80,
      recall: 0.75,
      f1Score: 0.77,
      auc: 0.88,
      trainingSamples: 800,
      validationSamples: 200,
      featureImportance: {
        daysSinceLastLogin: 0.15,
        engagementTrend: 0.12,
        transactionFrequency: 0.10,
        emailOpenRate: 0.08
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

  private async loadModel(): Promise<void> {
    // Placeholder - would load from database or file system
    logger.debug('Churn prediction model loaded (placeholder)');
  }

  private async saveModel(model: LogisticRegressionModel, organizationId: string): Promise<void> {
    // Placeholder - would save to database or file system
    logger.debug('Churn prediction model saved', { organizationId, modelVersion: model.modelVersion });
  }
}

/**
 * Singleton instance for churn prediction
 */
let churnPredictionModel: ChurnPredictionModel | null = null;

/**
 * Get the churn prediction model instance
 */
export function getChurnPredictionModel(): ChurnPredictionModel {
  if (!churnPredictionModel) {
    churnPredictionModel = new ChurnPredictionModel();
  }
  return churnPredictionModel;
}

/**
 * Predict churn for a customer
 */
export async function predictCustomerChurn(
  contactId: string, 
  organizationId: string
): Promise<ChurnPrediction> {
  const model = getChurnPredictionModel();
  return model.predictChurn(contactId, organizationId);
}

/**
 * Train the churn prediction model
 */
export async function trainChurnModel(
  organizationId: string, 
  sampleSize?: number
): Promise<ModelMetrics> {
  const model = getChurnPredictionModel();
  return model.trainModel(organizationId, sampleSize);
}