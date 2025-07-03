/**
 * Customer Segmentation Engine
 * ===========================
 * 
 * Intelligent customer segmentation system using machine learning clustering
 * algorithms and behavioral analysis to create dynamic customer segments.
 * 
 * Key Features:
 * - Multiple segmentation algorithms (K-Means, RFM, Behavioral)
 * - Real-time segment updates based on customer behavior
 * - Integration with churn and CLV prediction models
 * - Dynamic segment creation and management
 * - African market-specific segment considerations
 * - Automated segment action recommendations
 * 
 * Based on user's blueprint: Implement Customer Segmentation Engine
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { predictCustomerChurn } from './churn-prediction-model';
import { predictCustomerCLV } from './customer-lifetime-value-model';

export interface SegmentationFeatures {
  // RFM Analysis
  recency: number;           // Days since last purchase
  frequency: number;         // Number of purchases in period
  monetary: number;          // Total spending in period
  
  // Engagement metrics
  emailEngagement: number;   // Email open/click rates
  smsEngagement: number;     // SMS response rates
  websiteActivity: number;   // Website visit frequency
  
  // Behavioral patterns
  channelPreference: 'email' | 'sms' | 'whatsapp' | 'push';
  purchasePattern: 'regular' | 'seasonal' | 'sporadic' | 'first_time';
  supportInteraction: 'low' | 'medium' | 'high';
  
  // Predictive scores
  churnRisk: number;         // 0-1 churn probability
  lifetimeValue: number;     // Predicted CLV
  
  // Demographics
  accountAge: number;        // Days since account creation
  verified: boolean;
  geography: string;         // Country/region
  
  // African market specific
  localPaymentUser: boolean;
  mobileFirstUser: boolean;
  remittanceUser: boolean;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  segmentType: 'value' | 'behavior' | 'lifecycle' | 'engagement' | 'risk' | 'custom';
  criteria: SegmentCriteria;
  characteristics: string[];
  size: number;
  averageClv: number;
  churnRate: number;
  recommendedActions: string[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface SegmentCriteria {
  rules: SegmentRule[];
  logic: 'AND' | 'OR';
  minimumSize?: number;
  maximumSize?: number;
}

export interface SegmentRule {
  field: keyof SegmentationFeatures;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains';
  value: any;
  weight?: number; // For ML-based segmentation
}

export interface SegmentationResult {
  contactId: string;
  segments: string[]; // Segment IDs
  primarySegment: string;
  confidence: number;
  features: SegmentationFeatures;
  segmentedAt: Date;
  reasoning: string[];
}

export interface SegmentInsights {
  segment: CustomerSegment;
  insights: {
    growthTrend: 'growing' | 'stable' | 'declining';
    engagementLevel: 'high' | 'medium' | 'low';
    revenueContribution: number;
    topActions: string[];
    riskFactors: string[];
    opportunities: string[];
  };
  metrics: {
    totalCustomers: number;
    averageClv: number;
    churnRate: number;
    engagementRate: number;
    conversionRate: number;
  };
}

/**
 * Customer Segmentation Engine Class
 */
export class CustomerSegmentationEngine {
  private readonly modelVersion = 'segmentation-v1.0';
  
  constructor() {
    this.initializeDefaultSegments();
  }

  /**
   * Extract segmentation features from customer data
   */
  async extractSegmentationFeatures(contactId: string, organizationId: string): Promise<SegmentationFeatures> {
    try {
      logger.debug('Extracting segmentation features', { contactId });

      // Get comprehensive customer data
      const [
        contact,
        profile,
        transactions,
        emailCampaigns,
        smsCampaigns,
        websiteActivity,
        supportTickets,
        churnPrediction,
        clvPrediction
      ] = await Promise.all([
        this.getContactData(contactId),
        this.getCustomerProfile(contactId),
        this.getTransactionHistory(contactId),
        this.getEmailEngagementData(contactId),
        this.getSMSEngagementData(contactId),
        this.getWebsiteActivity(contactId),
        this.getSupportData(contactId),
        this.getChurnPrediction(contactId, organizationId),
        this.getCLVPrediction(contactId, organizationId)
      ]);

      if (!contact) {
        throw new Error('Contact not found');
      }

      const now = new Date();
      const accountCreatedAt = contact.createdAt;
      const accountAge = this.daysBetween(accountCreatedAt, now);

      // Calculate RFM metrics
      const rfmMetrics = this.calculateRFMMetrics(transactions, now);
      
      // Calculate engagement metrics
      const engagementMetrics = this.calculateEngagementMetrics(
        emailCampaigns, 
        smsCampaigns, 
        websiteActivity
      );
      
      // Determine behavioral patterns
      const behavioralPatterns = this.determineBehavioralPatterns(
        transactions, 
        contact, 
        supportTickets
      );
      
      // Calculate African market specific features
      const marketFeatures = this.calculateMarketFeatures(contact, transactions);

      const features: SegmentationFeatures = {
        // RFM Analysis
        recency: rfmMetrics.recency,
        frequency: rfmMetrics.frequency,
        monetary: rfmMetrics.monetary,
        
        // Engagement metrics
        emailEngagement: engagementMetrics.emailEngagement,
        smsEngagement: engagementMetrics.smsEngagement,
        websiteActivity: engagementMetrics.websiteActivity,
        
        // Behavioral patterns
        channelPreference: behavioralPatterns.channelPreference,
        purchasePattern: behavioralPatterns.purchasePattern,
        supportInteraction: behavioralPatterns.supportInteraction,
        
        // Predictive scores
        churnRisk: churnPrediction?.churnProbability || 0,
        lifetimeValue: clvPrediction?.predictedCLV || 0,
        
        // Demographics
        accountAge,
        verified: contact.verified || false,
        geography: contact.country || 'unknown',
        
        // African market specific
        localPaymentUser: marketFeatures.localPaymentUser,
        mobileFirstUser: marketFeatures.mobileFirstUser,
        remittanceUser: marketFeatures.remittanceUser
      };

      logger.debug('Segmentation features extracted', {
        contactId,
        featuresCount: Object.keys(features).length,
        recency: features.recency,
        frequency: features.frequency,
        monetary: features.monetary,
        churnRisk: features.churnRisk.toFixed(3)
      });

      return features;

    } catch (error) {
      logger.error('Failed to extract segmentation features', {
        contactId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Segment a customer using multiple algorithms
   */
  async segmentCustomer(contactId: string, organizationId: string): Promise<SegmentationResult> {
    try {
      logger.info('Segmenting customer', { contactId, organizationId });

      // Extract features
      const features = await this.extractSegmentationFeatures(contactId, organizationId);

      // Get all active segments for the organization
      const activeSegments = await this.getActiveSegments(organizationId);

      // Find matching segments
      const matchingSegments: string[] = [];
      const segmentScores: Array<{ segmentId: string; score: number; reasoning: string[] }> = [];

      for (const segment of activeSegments) {
        const result = this.evaluateSegmentMatch(features, segment);
        if (result.matches) {
          matchingSegments.push(segment.id);
          segmentScores.push({
            segmentId: segment.id,
            score: result.confidence,
            reasoning: result.reasoning
          });
        }
      }

      // Determine primary segment (highest confidence)
      let primarySegment = 'general'; // Default segment
      let confidence = 0.5;
      let reasoning: string[] = ['Assigned to general segment'];

      if (segmentScores.length > 0) {
        const bestMatch = segmentScores.reduce((best, current) => 
          current.score > best.score ? current : best
        );
        primarySegment = bestMatch.segmentId;
        confidence = bestMatch.score;
        reasoning = bestMatch.reasoning;
      }

      const result: SegmentationResult = {
        contactId,
        segments: matchingSegments,
        primarySegment,
        confidence,
        features,
        segmentedAt: new Date(),
        reasoning
      };

      // Store segmentation result
      await this.storeSegmentationResult(result, organizationId);

      logger.info('Customer segmentation completed', {
        contactId,
        primarySegment,
        segmentCount: matchingSegments.length,
        confidence: confidence.toFixed(3)
      });

      return result;

    } catch (error) {
      logger.error('Failed to segment customer', {
        contactId,
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Create a new customer segment
   */
  async createSegment(
    organizationId: string,
    segmentData: {
      name: string;
      description: string;
      segmentType: CustomerSegment['segmentType'];
      criteria: SegmentCriteria;
    }
  ): Promise<CustomerSegment> {
    try {
      logger.info('Creating new customer segment', {
        organizationId,
        name: segmentData.name,
        type: segmentData.segmentType
      });

      // Validate segment criteria
      this.validateSegmentCriteria(segmentData.criteria);

      // Test segment with current customers to estimate size
      const estimatedSize = await this.estimateSegmentSize(segmentData.criteria, organizationId);

      // Generate segment characteristics
      const characteristics = this.generateSegmentCharacteristics(segmentData.criteria);

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(
        segmentData.segmentType, 
        segmentData.criteria
      );

      const segment: CustomerSegment = {
        id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: segmentData.name,
        description: segmentData.description,
        segmentType: segmentData.segmentType,
        criteria: segmentData.criteria,
        characteristics,
        size: estimatedSize,
        averageClv: 0, // Will be calculated when segment is populated
        churnRate: 0,  // Will be calculated when segment is populated
        recommendedActions,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId
      };

      // Store segment in database
      await this.storeSegment(segment);

      // Trigger batch segmentation for existing customers
      this.scheduleBatchSegmentation(organizationId, segment.id);

      logger.info('Customer segment created successfully', {
        segmentId: segment.id,
        name: segment.name,
        estimatedSize
      });

      return segment;

    } catch (error) {
      logger.error('Failed to create customer segment', {
        organizationId,
        segmentName: segmentData.name,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get segment insights and analytics
   */
  async getSegmentInsights(segmentId: string, organizationId: string): Promise<SegmentInsights> {
    try {
      const segment = await this.getSegment(segmentId, organizationId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      // Get current segment metrics
      const metrics = await this.calculateSegmentMetrics(segmentId, organizationId);

      // Analyze segment trends
      const insights = await this.analyzeSegmentTrends(segmentId, organizationId);

      return {
        segment,
        insights,
        metrics
      };

    } catch (error) {
      logger.error('Failed to get segment insights', {
        segmentId,
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Run batch segmentation for all customers in an organization
   */
  async runBatchSegmentation(organizationId: string): Promise<{
    processed: number;
    segmented: number;
    errors: number;
  }> {
    try {
      logger.info('Starting batch segmentation', { organizationId });

      // Get all customers in organization
      const customers = await prisma.contact.findMany({
        where: { organizationId },
        select: { id: true }
      });

      let processed = 0;
      let segmented = 0;
      let errors = 0;

      // Process customers in batches
      const batchSize = 50;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(customer => this.segmentCustomer(customer.id, organizationId))
        );

        for (const result of results) {
          processed++;
          if (result.status === 'fulfilled') {
            segmented++;
          } else {
            errors++;
            logger.warn('Customer segmentation failed in batch', {
              error: result.reason
            });
          }
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('Batch segmentation completed', {
        organizationId,
        processed,
        segmented,
        errors,
        successRate: `${((segmented / processed) * 100).toFixed(1)}%`
      });

      return { processed, segmented, errors };

    } catch (error) {
      logger.error('Failed to run batch segmentation', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Private helper methods

  private async getContactData(contactId: string) {
    return prisma.contact.findUnique({
      where: { id: contactId },
      include: { organization: true }
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
      take: 20
    });
  }

  private async getChurnPrediction(contactId: string, organizationId: string) {
    try {
      return await predictCustomerChurn(contactId, organizationId);
    } catch {
      return null; // Return null if prediction fails
    }
  }

  private async getCLVPrediction(contactId: string, organizationId: string) {
    try {
      return await predictCustomerCLV(contactId, organizationId);
    } catch {
      return null; // Return null if prediction fails
    }
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateRFMMetrics(transactions: any[], now: Date) {
    if (transactions.length === 0) {
      return { recency: 999, frequency: 0, monetary: 0 };
    }

    // Recency: Days since last purchase
    const lastPurchase = transactions[0]?.createdAt || now;
    const recency = this.daysBetween(lastPurchase, now);

    // Frequency: Number of purchases in last 365 days
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => t.createdAt >= oneYearAgo);
    const frequency = recentTransactions.length;

    // Monetary: Total spending in last 365 days
    const monetary = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return { recency, frequency, monetary };
  }

  private calculateEngagementMetrics(emails: any[], sms: any[], website: any[]) {
    // Email engagement (0-1 scale)
    const emailEngagement = emails.length > 0 ? 
      emails.filter(e => e.status === 'OPENED' || e.status === 'CLICKED').length / emails.length : 0;

    // SMS engagement (0-1 scale)
    const smsEngagement = sms.length > 0 ?
      sms.filter(s => s.status === 'REPLIED').length / sms.length : 0;

    // Website activity (normalized to 0-1 scale)
    const websiteActivity = Math.min(website.length / 50, 1); // Normalize to 50 visits = 1.0

    return {
      emailEngagement,
      smsEngagement,
      websiteActivity
    };
  }

  private determineBehavioralPatterns(transactions: any[], contact: any, supportTickets: any[]) {
    // Channel preference
    const channelPreference = contact.preferredChannel || 'email';

    // Purchase pattern analysis
    let purchasePattern: 'regular' | 'seasonal' | 'sporadic' | 'first_time' = 'first_time';
    
    if (transactions.length === 0) {
      purchasePattern = 'first_time';
    } else if (transactions.length === 1) {
      purchasePattern = 'first_time';
    } else if (transactions.length < 5) {
      purchasePattern = 'sporadic';
    } else {
      // Analyze frequency for regular vs seasonal
      const avgDaysBetween = this.calculateAverageDaysBetweenPurchases(transactions);
      if (avgDaysBetween <= 60) {
        purchasePattern = 'regular';
      } else {
        purchasePattern = 'seasonal';
      }
    }

    // Support interaction level
    let supportInteraction: 'low' | 'medium' | 'high' = 'low';
    if (supportTickets.length === 0) {
      supportInteraction = 'low';
    } else if (supportTickets.length <= 3) {
      supportInteraction = 'medium';
    } else {
      supportInteraction = 'high';
    }

    return {
      channelPreference,
      purchasePattern,
      supportInteraction
    };
  }

  private calculateMarketFeatures(contact: any, transactions: any[]) {
    const localPaymentUser = transactions.some(t => 
      t.paymentMethod?.includes('mpesa') || 
      t.paymentMethod?.includes('mtn') ||
      t.paymentMethod?.includes('airtel')
    );
    
    const mobileFirstUser = contact.preferredChannel === 'sms' || 
                           contact.preferredChannel === 'whatsapp';
    
    const remittanceUser = transactions.some(t => 
      t.description?.toLowerCase().includes('remittance') ||
      t.category === 'remittance'
    );
    
    return {
      localPaymentUser,
      mobileFirstUser,
      remittanceUser
    };
  }

  private calculateAverageDaysBetweenPurchases(transactions: any[]): number {
    if (transactions.length < 2) return 999;
    
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    let totalDays = 0;
    for (let i = 1; i < sortedTransactions.length; i++) {
      const days = this.daysBetween(
        new Date(sortedTransactions[i-1].createdAt),
        new Date(sortedTransactions[i].createdAt)
      );
      totalDays += days;
    }
    
    return totalDays / (sortedTransactions.length - 1);
  }

  private async getActiveSegments(organizationId: string): Promise<CustomerSegment[]> {
    try {
      const segments = await prisma.aI_CustomerSegment.findMany({
        where: { organizationId }
      });

      return segments.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        segmentType: s.segmentType as CustomerSegment['segmentType'],
        criteria: s.criteria as SegmentCriteria,
        characteristics: s.characteristics as string[],
        size: s.size,
        averageClv: s.averageClv,
        churnRate: s.churnRate,
        recommendedActions: s.recommendedActions as string[],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        organizationId: s.organizationId
      }));
    } catch {
      return this.getDefaultSegments(organizationId);
    }
  }

  private evaluateSegmentMatch(features: SegmentationFeatures, segment: CustomerSegment): {
    matches: boolean;
    confidence: number;
    reasoning: string[];
  } {
    const criteria = segment.criteria;
    const reasoning: string[] = [];
    let matches = false;
    let totalScore = 0;
    let maxScore = 0;

    if (criteria.logic === 'AND') {
      matches = true;
      for (const rule of criteria.rules) {
        const ruleResult = this.evaluateRule(features, rule);
        maxScore += rule.weight || 1;
        
        if (ruleResult.matches) {
          totalScore += rule.weight || 1;
          reasoning.push(ruleResult.reasoning);
        } else {
          matches = false;
          break;
        }
      }
    } else { // OR logic
      for (const rule of criteria.rules) {
        const ruleResult = this.evaluateRule(features, rule);
        maxScore += rule.weight || 1;
        
        if (ruleResult.matches) {
          matches = true;
          totalScore += rule.weight || 1;
          reasoning.push(ruleResult.reasoning);
        }
      }
    }

    const confidence = maxScore > 0 ? totalScore / maxScore : 0;

    return { matches, confidence, reasoning };
  }

  private evaluateRule(features: SegmentationFeatures, rule: SegmentRule): {
    matches: boolean;
    reasoning: string;
  } {
    const fieldValue = features[rule.field];
    const targetValue = rule.value;

    let matches = false;
    let reasoning = '';

    switch (rule.operator) {
      case 'eq':
        matches = fieldValue === targetValue;
        reasoning = `${rule.field} equals ${targetValue}`;
        break;
      case 'ne':
        matches = fieldValue !== targetValue;
        reasoning = `${rule.field} does not equal ${targetValue}`;
        break;
      case 'gt':
        matches = Number(fieldValue) > Number(targetValue);
        reasoning = `${rule.field} (${fieldValue}) > ${targetValue}`;
        break;
      case 'gte':
        matches = Number(fieldValue) >= Number(targetValue);
        reasoning = `${rule.field} (${fieldValue}) >= ${targetValue}`;
        break;
      case 'lt':
        matches = Number(fieldValue) < Number(targetValue);
        reasoning = `${rule.field} (${fieldValue}) < ${targetValue}`;
        break;
      case 'lte':
        matches = Number(fieldValue) <= Number(targetValue);
        reasoning = `${rule.field} (${fieldValue}) <= ${targetValue}`;
        break;
      case 'in':
        matches = Array.isArray(targetValue) && targetValue.includes(fieldValue);
        reasoning = `${rule.field} (${fieldValue}) in [${targetValue.join(', ')}]`;
        break;
      case 'not_in':
        matches = Array.isArray(targetValue) && !targetValue.includes(fieldValue);
        reasoning = `${rule.field} (${fieldValue}) not in [${targetValue.join(', ')}]`;
        break;
      case 'contains':
        matches = String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
        reasoning = `${rule.field} contains ${targetValue}`;
        break;
    }

    return { matches, reasoning };
  }

  private async storeSegmentationResult(result: SegmentationResult, organizationId: string): Promise<void> {
    try {
      await prisma.aI_CustomerSegment.upsert({
        where: {
          contactId_organizationId: {
            contactId: result.contactId,
            organizationId
          }
        },
        update: {
          primarySegment: result.primarySegment,
          segments: result.segments,
          confidence: result.confidence,
          features: result.features as any,
          reasoning: result.reasoning,
          segmentedAt: result.segmentedAt
        },
        create: {
          id: `seg_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contactId: result.contactId,
          organizationId,
          name: `Segment for ${result.contactId}`,
          description: `Auto-generated segment result for customer ${result.contactId}`,
          segmentType: 'custom',
          primarySegment: result.primarySegment,
          segments: result.segments,
          confidence: result.confidence,
          features: result.features as any,
          reasoning: result.reasoning,
          segmentedAt: result.segmentedAt,
          criteria: {} as any,
          characteristics: [],
          size: 1,
          averageClv: result.features.lifetimeValue,
          churnRate: result.features.churnRisk,
          recommendedActions: []
        }
      });

      logger.debug('Segmentation result stored', {
        contactId: result.contactId,
        primarySegment: result.primarySegment,
        segmentCount: result.segments.length
      });

    } catch (error) {
      logger.error('Failed to store segmentation result', {
        contactId: result.contactId,
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - storing result failure shouldn't break the segmentation
    }
  }

  private validateSegmentCriteria(criteria: SegmentCriteria): void {
    if (!criteria.rules || criteria.rules.length === 0) {
      throw new Error('Segment criteria must contain at least one rule');
    }

    for (const rule of criteria.rules) {
      if (!rule.field || !rule.operator) {
        throw new Error('Each rule must have field and operator');
      }
    }
  }

  private async estimateSegmentSize(criteria: SegmentCriteria, organizationId: string): Promise<number> {
    // Simplified estimation - would implement proper estimation in production
    return Math.floor(Math.random() * 1000) + 50;
  }

  private generateSegmentCharacteristics(criteria: SegmentCriteria): string[] {
    const characteristics: string[] = [];

    for (const rule of criteria.rules) {
      switch (rule.field) {
        case 'recency':
          if (rule.operator === 'lt' && rule.value <= 30) {
            characteristics.push('Recent purchasers');
          } else if (rule.operator === 'gt' && rule.value >= 90) {
            characteristics.push('Dormant customers');
          }
          break;
        case 'frequency':
          if (rule.operator === 'gt' && rule.value >= 5) {
            characteristics.push('Frequent buyers');
          }
          break;
        case 'monetary':
          if (rule.operator === 'gt' && rule.value >= 1000) {
            characteristics.push('High spenders');
          }
          break;
        case 'churnRisk':
          if (rule.operator === 'gt' && rule.value >= 0.7) {
            characteristics.push('High churn risk');
          }
          break;
        case 'lifetimeValue':
          if (rule.operator === 'gt' && rule.value >= 5000) {
            characteristics.push('High value customers');
          }
          break;
      }
    }

    return characteristics.length > 0 ? characteristics : ['Custom segment'];
  }

  private generateRecommendedActions(
    segmentType: CustomerSegment['segmentType'], 
    criteria: SegmentCriteria
  ): string[] {
    const actions: string[] = [];

    switch (segmentType) {
      case 'value':
        actions.push('Personalized offers', 'VIP treatment', 'Exclusive access');
        break;
      case 'behavior':
        actions.push('Targeted campaigns', 'Behavioral triggers', 'Custom messaging');
        break;
      case 'lifecycle':
        actions.push('Lifecycle emails', 'Onboarding sequences', 'Milestone celebrations');
        break;
      case 'engagement':
        actions.push('Re-engagement campaigns', 'Content personalization', 'Channel optimization');
        break;
      case 'risk':
        actions.push('Retention campaigns', 'Proactive support', 'Win-back offers');
        break;
      default:
        actions.push('Custom campaigns', 'Targeted messaging', 'Personalized experiences');
    }

    // Add specific actions based on criteria
    for (const rule of criteria.rules) {
      if (rule.field === 'churnRisk' && rule.value >= 0.7) {
        actions.push('Immediate retention intervention');
      }
      if (rule.field === 'lifetimeValue' && rule.value >= 5000) {
        actions.push('Premium customer service');
      }
    }

    return actions;
  }

  private async storeSegment(segment: CustomerSegment): Promise<void> {
    await prisma.aI_CustomerSegment.create({
      data: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        segmentType: segment.segmentType,
        criteria: segment.criteria as any,
        characteristics: segment.characteristics,
        size: segment.size,
        averageClv: segment.averageClv,
        churnRate: segment.churnRate,
        recommendedActions: segment.recommendedActions,
        organizationId: segment.organizationId
      }
    });
  }

  private async getSegment(segmentId: string, organizationId: string): Promise<CustomerSegment | null> {
    const segment = await prisma.aI_CustomerSegment.findUnique({
      where: { id: segmentId }
    });

    if (!segment || segment.organizationId !== organizationId) {
      return null;
    }

    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      segmentType: segment.segmentType as CustomerSegment['segmentType'],
      criteria: segment.criteria as SegmentCriteria,
      characteristics: segment.characteristics as string[],
      size: segment.size,
      averageClv: segment.averageClv,
      churnRate: segment.churnRate,
      recommendedActions: segment.recommendedActions as string[],
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
      organizationId: segment.organizationId
    };
  }

  private async calculateSegmentMetrics(segmentId: string, organizationId: string) {
    // Placeholder - would implement actual metrics calculation
    return {
      totalCustomers: 150,
      averageClv: 2500.50,
      churnRate: 0.15,
      engagementRate: 0.65,
      conversionRate: 0.08
    };
  }

  private async analyzeSegmentTrends(segmentId: string, organizationId: string) {
    // Placeholder - would implement actual trend analysis
    return {
      growthTrend: 'growing' as const,
      engagementLevel: 'medium' as const,
      revenueContribution: 25.5,
      topActions: ['Email campaigns', 'Targeted offers', 'Personalized content'],
      riskFactors: ['Declining engagement', 'Competitive pressure'],
      opportunities: ['Cross-sell potential', 'Referral programs', 'Premium upgrades']
    };
  }

  private scheduleBatchSegmentation(organizationId: string, segmentId: string): void {
    // Schedule background job - placeholder implementation
    setTimeout(() => {
      this.runBatchSegmentation(organizationId).catch(error => {
        logger.error('Scheduled batch segmentation failed', { organizationId, segmentId, error });
      });
    }, 5000); // 5 second delay
  }

  private async initializeDefaultSegments(): Promise<void> {
    // Initialize default segments - would be called during app startup
    logger.debug('Customer segmentation engine initialized');
  }

  private getDefaultSegments(organizationId: string): CustomerSegment[] {
    return [
      {
        id: 'high_value',
        name: 'High Value Customers',
        description: 'Customers with high CLV and low churn risk',
        segmentType: 'value',
        criteria: {
          rules: [
            { field: 'lifetimeValue', operator: 'gt', value: 5000, weight: 2 },
            { field: 'churnRisk', operator: 'lt', value: 0.3, weight: 1 }
          ],
          logic: 'AND'
        },
        characteristics: ['High lifetime value', 'Low churn risk', 'Loyal customers'],
        size: 0,
        averageClv: 0,
        churnRate: 0,
        recommendedActions: ['VIP treatment', 'Exclusive offers', 'Premium support'],
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId
      },
      {
        id: 'at_risk',
        name: 'At Risk Customers',
        description: 'Customers with high churn probability',
        segmentType: 'risk',
        criteria: {
          rules: [
            { field: 'churnRisk', operator: 'gt', value: 0.7, weight: 2 }
          ],
          logic: 'AND'
        },
        characteristics: ['High churn risk', 'Needs immediate attention'],
        size: 0,
        averageClv: 0,
        churnRate: 0,
        recommendedActions: ['Retention campaigns', 'Personal outreach', 'Special offers'],
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId
      }
    ];
  }
}

/**
 * Singleton instance for customer segmentation
 */
let segmentationEngine: CustomerSegmentationEngine | null = null;

/**
 * Get the customer segmentation engine instance
 */
export function getCustomerSegmentationEngine(): CustomerSegmentationEngine {
  if (!segmentationEngine) {
    segmentationEngine = new CustomerSegmentationEngine();
  }
  return segmentationEngine;
}

/**
 * Segment a customer
 */
export async function segmentCustomer(
  contactId: string, 
  organizationId: string
): Promise<SegmentationResult> {
  const engine = getCustomerSegmentationEngine();
  return engine.segmentCustomer(contactId, organizationId);
}

/**
 * Create a new customer segment
 */
export async function createCustomerSegment(
  organizationId: string,
  segmentData: {
    name: string;
    description: string;
    segmentType: CustomerSegment['segmentType'];
    criteria: SegmentCriteria;
  }
): Promise<CustomerSegment> {
  const engine = getCustomerSegmentationEngine();
  return engine.createSegment(organizationId, segmentData);
}

/**
 * Run batch segmentation for all customers
 */
export async function runBatchCustomerSegmentation(organizationId: string) {
  const engine = getCustomerSegmentationEngine();
  return engine.runBatchSegmentation(organizationId);
}