/**
 * High-Value Customer Detection Rules Engine
 * ==========================================
 * 
 * Intelligent rule-based system for automatically identifying and segmenting
 * high-value customers based on multiple behavioral, transactional, and 
 * predictive indicators.
 * 
 * Key Features:
 * - Multi-dimensional value scoring
 * - Behavioral pattern recognition
 * - Predictive value assessment
 * - African market-specific considerations
 * - Dynamic rule adaptation
 * - Real-time customer classification
 * - Automated workflow triggers
 * 
 * Based on user's blueprint: Create High-Value Customer Detection Rules
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';
import { getCustomerEventBus } from '@/lib/events/event-bus';
import { getActionDispatcher } from '@/lib/actions/action-dispatcher';
import { type ActionPlan, ActionType } from '@/lib/actions/action-plan-interface';
import { getCustomerLifetimeValueModel } from '@/lib/ml/customer-lifetime-value-model';
import { getChurnPredictionModel } from '@/lib/ml/churn-prediction-model';

export type ValueTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HighValueCustomer {
  contactId: string;
  organizationId: string;
  valueTier: ValueTier;
  valueScore: number;
  lifetimeValue: {
    actual: number;
    predicted: number;
    potentialUpside: number;
  };
  riskAssessment: {
    churnProbability: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
  };
  behavioralIndicators: {
    engagementScore: number;
    purchaseFrequency: number;
    averageOrderValue: number;
    loyaltyIndex: number;
    referralActivity: number;
  };
  africanMarketFactors: {
    mobileUsage: number;
    localPaymentPreference: boolean;
    communityInfluence: number;
    culturalAlignment: number;
  };
  detectionTriggers: Array<{
    rule: string;
    threshold: number;
    actualValue: number;
    weight: number;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    expectedImpact: number;
    reasoning: string;
  }>;
  detectedAt: Date;
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface DetectionRule {
  id: string;
  name: string;
  category: 'transactional' | 'behavioral' | 'predictive' | 'demographic' | 'cultural';
  description: string;
  condition: {
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains' | 'between';
    threshold: number | string | [number, number];
    timeframe?: number; // days
  };
  weight: number; // 0-1, importance in final score
  tier: ValueTier; // minimum tier this rule contributes to
  enabled: boolean;
  metadata: {
    createdBy: string;
    lastModified: Date;
    performanceMetrics: {
      accuracy: number;
      falsePositiveRate: number;
      impactScore: number;
    };
  };
}

export interface DetectionResult {
  totalCustomers: number;
  highValueCustomers: HighValueCustomer[];
  tierDistribution: Record<ValueTier, number>;
  newDetections: HighValueCustomer[];
  upgrades: Array<{
    contactId: string;
    fromTier: ValueTier;
    toTier: ValueTier;
    reasons: string[];
  }>;
  downgrades: Array<{
    contactId: string;
    fromTier: ValueTier;
    toTier: ValueTier;
    reasons: string[];
  }>;
  actionTriggered: number;
  estimatedRevenuePotential: number;
  riskMitigationOpportunities: number;
}

/**
 * High-Value Customer Detection Rules Engine
 */
export class HighValueCustomerDetectionEngine {
  private eventBus = getCustomerEventBus();
  private actionDispatcher = getActionDispatcher();
  private clvModel = getCustomerLifetimeValueModel();
  private churnModel = getChurnPredictionModel();

  /**
   * Run comprehensive high-value customer detection
   */
  async runDetection(organizationId: string): Promise<DetectionResult> {
    try {
      logger.info('Starting high-value customer detection', { organizationId });

      // Get active detection rules
      const rules = await this.getActiveDetectionRules(organizationId);
      
      // Get all customers for evaluation
      const customers = await this.getCustomersForEvaluation(organizationId);
      
      // Evaluate each customer against all rules
      const evaluationResults = await Promise.all(
        customers.map(customer => this.evaluateCustomer(customer, rules))
      );

      // Filter high-value customers
      const highValueCustomers = evaluationResults.filter(result => 
        result && result.valueTier !== 'standard'
      ) as HighValueCustomer[];

      // Compare with previous classifications
      const { newDetections, upgrades, downgrades } = await this.compareWithPrevious(
        organizationId, 
        highValueCustomers
      );

      // Calculate tier distribution
      const tierDistribution = this.calculateTierDistribution(highValueCustomers);

      // Trigger automated actions for new detections and upgrades
      const actionTriggered = await this.triggerAutomatedActions(
        organizationId,
        [...newDetections, ...upgrades.map(u => highValueCustomers.find(hvc => hvc.contactId === u.contactId)!)]
      );

      // Calculate revenue potential and risk opportunities
      const estimatedRevenuePotential = this.calculateRevenuePotential(highValueCustomers);
      const riskMitigationOpportunities = this.calculateRiskOpportunities(highValueCustomers);

      // Update customer profiles in database
      await this.updateCustomerProfiles(highValueCustomers);

      const result: DetectionResult = {
        totalCustomers: customers.length,
        highValueCustomers,
        tierDistribution,
        newDetections,
        upgrades,
        downgrades,
        actionTriggered,
        estimatedRevenuePotential,
        riskMitigationOpportunities
      };

      // Emit event for analytics
      await this.eventBus.emit('high_value_detection_completed', {
        organizationId,
        result,
        timestamp: new Date()
      });

      logger.info('High-value customer detection completed', {
        organizationId,
        totalEvaluated: customers.length,
        highValueCount: highValueCustomers.length,
        newDetections: newDetections.length,
        actionsTriggered: actionTriggered
      });

      return result;

    } catch (error) {
      logger.error('Failed to run high-value customer detection', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get active detection rules for organization
   */
  private async getActiveDetectionRules(organizationId: string): Promise<DetectionRule[]> {
    // Default rules - in production these would be stored in database
    return [
      {
        id: 'clv_threshold_high',
        name: 'High CLV Threshold',
        category: 'predictive',
        description: 'Customers with predicted CLV above $2000',
        condition: {
          metric: 'predicted_clv',
          operator: 'gte',
          threshold: 2000
        },
        weight: 0.25,
        tier: 'gold',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.85,
            falsePositiveRate: 0.12,
            impactScore: 0.9
          }
        }
      },
      {
        id: 'purchase_frequency_high',
        name: 'High Purchase Frequency',
        category: 'behavioral',
        description: 'Customers purchasing more than 6 times in 6 months',
        condition: {
          metric: 'purchase_frequency',
          operator: 'gte',
          threshold: 6,
          timeframe: 180
        },
        weight: 0.2,
        tier: 'silver',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.78,
            falsePositiveRate: 0.15,
            impactScore: 0.75
          }
        }
      },
      {
        id: 'avg_order_value_high',
        name: 'High Average Order Value',
        category: 'transactional',
        description: 'Customers with AOV above $150',
        condition: {
          metric: 'average_order_value',
          operator: 'gte',
          threshold: 150
        },
        weight: 0.15,
        tier: 'bronze',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.82,
            falsePositiveRate: 0.08,
            impactScore: 0.8
          }
        }
      },
      {
        id: 'engagement_score_high',
        name: 'High Engagement Score',
        category: 'behavioral',
        description: 'Customers with engagement score above 0.8',
        condition: {
          metric: 'engagement_score',
          operator: 'gte',
          threshold: 0.8
        },
        weight: 0.15,
        tier: 'bronze',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.75,
            falsePositiveRate: 0.18,
            impactScore: 0.7
          }
        }
      },
      {
        id: 'referral_activity_high',
        name: 'High Referral Activity',
        category: 'behavioral',
        description: 'Customers who have referred 3+ new customers',
        condition: {
          metric: 'referral_count',
          operator: 'gte',
          threshold: 3
        },
        weight: 0.1,
        tier: 'silver',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.9,
            falsePositiveRate: 0.05,
            impactScore: 0.85
          }
        }
      },
      {
        id: 'mobile_engagement_african',
        name: 'High Mobile Engagement (African)',
        category: 'cultural',
        description: 'African customers with high mobile engagement',
        condition: {
          metric: 'mobile_engagement',
          operator: 'gte',
          threshold: 0.9
        },
        weight: 0.1,
        tier: 'bronze',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.72,
            falsePositiveRate: 0.22,
            impactScore: 0.65
          }
        }
      },
      {
        id: 'local_payment_loyalty',
        name: 'Local Payment Loyalty',
        category: 'cultural',
        description: 'Customers consistently using local payment methods',
        condition: {
          metric: 'local_payment_usage',
          operator: 'gte',
          threshold: 0.8
        },
        weight: 0.05,
        tier: 'bronze',
        enabled: true,
        metadata: {
          createdBy: 'system',
          lastModified: new Date(),
          performanceMetrics: {
            accuracy: 0.68,
            falsePositiveRate: 0.25,
            impactScore: 0.6
          }
        }
      }
    ];
  }

  /**
   * Get customers for evaluation
   */
  private async getCustomersForEvaluation(organizationId: string) {
    try {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${BACKEND_URL}/api/contacts?organizationId=${organizationId}&isDeleted=false&include=customerProfile,orders,emailCampaigns,referrals&ordersAfter=${oneYearAgo.toISOString()}&campaignsAfter=${sixMonthsAgo.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contacts || data.data || data;
    } catch (error) {
      logger.error('Failed to fetch customers for evaluation', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Evaluate individual customer against detection rules
   */
  private async evaluateCustomer(customer: any, rules: DetectionRule[]): Promise<HighValueCustomer | null> {
    try {
      // Extract customer metrics
      const metrics = await this.extractCustomerMetrics(customer);
      
      // Evaluate against each rule
      const ruleResults = rules
        .filter(rule => rule.enabled)
        .map(rule => this.evaluateRule(rule, metrics))
        .filter(result => result.triggered);

      // Calculate overall value score
      const valueScore = ruleResults.reduce((sum, result) => sum + result.contribution, 0);

      // Determine value tier
      const valueTier = this.determineValueTier(valueScore, ruleResults);

      // Only process if customer qualifies as high-value
      if (valueTier === 'standard') {
        return null;
      }

      // Get predictive insights
      const [clvPrediction, churnPrediction] = await Promise.all([
        this.clvModel.predictCLV(customer.id, customer.organizationId),
        this.churnModel.predictChurn(customer.id, customer.organizationId)
      ]);

      // Generate recommendations
      const recommendations = this.generateRecommendations(valueTier, metrics, churnPrediction);

      const highValueCustomer: HighValueCustomer = {
        contactId: customer.id,
        organizationId: customer.organizationId,
        valueTier,
        valueScore,
        lifetimeValue: {
          actual: metrics.actualCLV,
          predicted: clvPrediction.predictedValue,
          potentialUpside: Math.max(0, clvPrediction.predictedValue - metrics.actualCLV)
        },
        riskAssessment: {
          churnProbability: churnPrediction.probability,
          riskLevel: this.assessRiskLevel(churnPrediction.probability),
          riskFactors: churnPrediction.riskFactors
        },
        behavioralIndicators: {
          engagementScore: metrics.engagementScore,
          purchaseFrequency: metrics.purchaseFrequency,
          averageOrderValue: metrics.averageOrderValue,
          loyaltyIndex: metrics.loyaltyIndex,
          referralActivity: metrics.referralCount
        },
        africanMarketFactors: {
          mobileUsage: metrics.mobileEngagement,
          localPaymentPreference: metrics.localPaymentUsage > 0.5,
          communityInfluence: metrics.referralCount / 10, // Normalized
          culturalAlignment: metrics.culturalAlignment
        },
        detectionTriggers: ruleResults.map(result => ({
          rule: result.ruleName,
          threshold: result.threshold,
          actualValue: result.actualValue,
          weight: result.weight
        })),
        recommendations,
        detectedAt: new Date(),
        lastUpdated: new Date(),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      return highValueCustomer;

    } catch (error) {
      logger.error('Failed to evaluate customer', {
        customerId: customer.id,
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  /**
   * Extract customer metrics for evaluation
   */
  private async extractCustomerMetrics(customer: any) {
    const orders = customer.orders || [];
    const campaigns = customer.emailCampaigns || [];
    const referrals = customer.referrals || [];
    const profile = customer.customerProfile;

    // Calculate transactional metrics
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const purchaseFrequency = orders.length;
    const averageOrderValue = purchaseFrequency > 0 ? totalRevenue / purchaseFrequency : 0;

    // Calculate engagement metrics
    const totalOpens = campaigns.reduce((sum: number, campaign: any) => sum + (campaign.opens || 0), 0);
    const totalClicks = campaigns.reduce((sum: number, campaign: any) => sum + (campaign.clicks || 0), 0);
    const engagementScore = campaigns.length > 0 ? 
      (totalOpens + totalClicks * 2) / (campaigns.length * 3) : 0;

    // Calculate loyalty metrics
    const daysSinceFirstOrder = orders.length > 0 ? 
      Math.floor((new Date().getTime() - new Date(orders[0].createdAt).getTime()) / (24 * 60 * 60 * 1000)) : 0;
    const loyaltyIndex = daysSinceFirstOrder > 0 ? 
      Math.min(1, (purchaseFrequency * averageOrderValue) / (daysSinceFirstOrder * 2)) : 0;

    // African market-specific metrics
    const mobileEngagement = profile?.mobileEngagementRate || 0.5;
    const localPaymentUsage = profile?.localPaymentRate || 0.3;
    const culturalAlignment = profile?.culturalAlignment || 0.5;

    return {
      actualCLV: totalRevenue,
      predicted_clv: profile?.predictedLifetimeValue || 0,
      purchase_frequency: purchaseFrequency,
      average_order_value: averageOrderValue,
      engagement_score: Math.min(1, engagementScore),
      referral_count: referrals.length,
      loyalty_index: loyaltyIndex,
      mobile_engagement: mobileEngagement,
      local_payment_usage: localPaymentUsage,
      cultural_alignment: culturalAlignment,
      days_since_last_purchase: orders.length > 0 ? 
        Math.floor((new Date().getTime() - new Date(orders[orders.length - 1].createdAt).getTime()) / (24 * 60 * 60 * 1000)) : 999,
      total_orders: purchaseFrequency,
      total_revenue: totalRevenue
    };
  }

  /**
   * Evaluate individual rule against customer metrics
   */
  private evaluateRule(rule: DetectionRule, metrics: any): {
    triggered: boolean;
    contribution: number;
    ruleName: string;
    threshold: any;
    actualValue: any;
    weight: number;
  } {
    const { condition, weight, name } = rule;
    const actualValue = metrics[condition.metric];
    let triggered = false;

    if (actualValue === undefined || actualValue === null) {
      return {
        triggered: false,
        contribution: 0,
        ruleName: name,
        threshold: condition.threshold,
        actualValue: 0,
        weight
      };
    }

    // Evaluate condition
    switch (condition.operator) {
      case 'gt':
        triggered = actualValue > condition.threshold;
        break;
      case 'gte':
        triggered = actualValue >= condition.threshold;
        break;
      case 'lt':
        triggered = actualValue < condition.threshold;
        break;
      case 'lte':
        triggered = actualValue <= condition.threshold;
        break;
      case 'eq':
        triggered = actualValue === condition.threshold;
        break;
      case 'contains':
        triggered = String(actualValue).toLowerCase().includes(String(condition.threshold).toLowerCase());
        break;
      case 'between':
        if (Array.isArray(condition.threshold) && condition.threshold.length === 2) {
          triggered = actualValue >= condition.threshold[0] && actualValue <= condition.threshold[1];
        }
        break;
    }

    return {
      triggered,
      contribution: triggered ? weight : 0,
      ruleName: name,
      threshold: condition.threshold,
      actualValue,
      weight
    };
  }

  /**
   * Determine value tier based on score and triggered rules
   */
  private determineValueTier(valueScore: number, ruleResults: any[]): ValueTier {
    // Check for platinum tier (exceptional value)
    if (valueScore >= 0.8) return 'platinum';
    
    // Check for gold tier (high value)
    if (valueScore >= 0.6) return 'gold';
    
    // Check for silver tier (medium-high value)
    if (valueScore >= 0.4) return 'silver';
    
    // Check for bronze tier (above-average value)
    if (valueScore >= 0.2) return 'bronze';
    
    return 'standard';
  }

  /**
   * Assess risk level based on churn probability
   */
  private assessRiskLevel(churnProbability: number): RiskLevel {
    if (churnProbability >= 0.8) return 'critical';
    if (churnProbability >= 0.6) return 'high';
    if (churnProbability >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations for high-value customer
   */
  private generateRecommendations(
    valueTier: ValueTier,
    metrics: any,
    churnPrediction: any
  ): HighValueCustomer['recommendations'] {
    const recommendations: HighValueCustomer['recommendations'] = [];

    // VIP treatment recommendations
    if (valueTier === 'platinum' || valueTier === 'gold') {
      recommendations.push({
        action: 'Assign dedicated account manager',
        priority: 'high',
        expectedImpact: 0.25,
        reasoning: 'High-value customers benefit from personalized service'
      });
    }

    // Churn prevention recommendations
    if (churnPrediction.probability > 0.6) {
      recommendations.push({
        action: 'Immediate retention campaign',
        priority: 'immediate',
        expectedImpact: 0.4,
        reasoning: 'High churn risk requires immediate intervention'
      });
    }

    // Engagement optimization
    if (metrics.engagement_score < 0.5) {
      recommendations.push({
        action: 'Personalized engagement campaign',
        priority: 'medium',
        expectedImpact: 0.2,
        reasoning: 'Low engagement despite high value suggests opportunity'
      });
    }

    // Upselling opportunities
    if (metrics.average_order_value > 100 && metrics.purchase_frequency > 3) {
      recommendations.push({
        action: 'Premium product upselling',
        priority: 'medium',
        expectedImpact: 0.3,
        reasoning: 'High AOV and frequency suggest appetite for premium offerings'
      });
    }

    // Referral program
    if (metrics.referral_count < 1 && metrics.loyalty_index > 0.7) {
      recommendations.push({
        action: 'Referral program invitation',
        priority: 'low',
        expectedImpact: 0.15,
        reasoning: 'Loyal customers are likely to refer others'
      });
    }

    return recommendations;
  }

  /**
   * Compare with previous classifications
   */
  private async compareWithPrevious(organizationId: string, currentCustomers: HighValueCustomer[]) {
    // Get previous high-value customer records
    let previousRecords = [];
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/ai/high-value-customers?organizationId=${organizationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        previousRecords = data.customers || data.data || data;
      }
    } catch (error) {
      logger.error('Failed to fetch previous high-value customers', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      // Continue with empty previousRecords
    }

    const previousMap = new Map(previousRecords.map((record: any) => [record.contactId, record.valueTier]));
    const currentMap = new Map(currentCustomers.map(customer => [customer.contactId, customer.valueTier]));

    const newDetections: HighValueCustomer[] = [];
    const upgrades: Array<{ contactId: string; fromTier: ValueTier; toTier: ValueTier; reasons: string[] }> = [];
    const downgrades: Array<{ contactId: string; fromTier: ValueTier; toTier: ValueTier; reasons: string[] }> = [];

    // Check for new detections
    for (const customer of currentCustomers) {
      if (!previousMap.has(customer.contactId)) {
        newDetections.push(customer);
      } else {
        const previousTier = previousMap.get(customer.contactId) as ValueTier;
        const currentTier = customer.valueTier;
        
        if (this.getTierRank(currentTier) > this.getTierRank(previousTier)) {
          upgrades.push({
            contactId: customer.contactId,
            fromTier: previousTier,
            toTier: currentTier,
            reasons: customer.detectionTriggers.map(trigger => trigger.rule)
          });
        } else if (this.getTierRank(currentTier) < this.getTierRank(previousTier)) {
          downgrades.push({
            contactId: customer.contactId,
            fromTier: previousTier,
            toTier: currentTier,
            reasons: ['Decreased performance in key metrics']
          });
        }
      }
    }

    return { newDetections, upgrades, downgrades };
  }

  /**
   * Get tier rank for comparison
   */
  private getTierRank(tier: ValueTier): number {
    const ranks = { standard: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 };
    return ranks[tier];
  }

  /**
   * Calculate tier distribution
   */
  private calculateTierDistribution(customers: HighValueCustomer[]): Record<ValueTier, number> {
    const distribution: Record<ValueTier, number> = {
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      standard: 0
    };

    customers.forEach(customer => {
      distribution[customer.valueTier]++;
    });

    return distribution;
  }

  /**
   * Trigger automated actions for high-value customers
   */
  private async triggerAutomatedActions(
    organizationId: string,
    customers: HighValueCustomer[]
  ): Promise<number> {
    let actionsTriggered = 0;

    for (const customer of customers) {
      try {
        // Create personalized action plan based on tier and recommendations
        const actionPlan = await this.createHighValueActionPlan(customer);
        
        await this.actionDispatcher.executeActionPlan(actionPlan.id, {
          organizationId,
          dryRun: false,
          priority: customer.valueTier === 'platinum' ? 'high' : 'medium'
        });

        actionsTriggered++;

      } catch (error) {
        logger.error('Failed to trigger action for high-value customer', {
          customerId: customer.contactId,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    return actionsTriggered;
  }

  /**
   * Create action plan for high-value customer
   */
  private async createHighValueActionPlan(customer: HighValueCustomer): Promise<ActionPlan> {
    const immediateActions = customer.recommendations.filter(r => r.priority === 'immediate');
    const highPriorityActions = customer.recommendations.filter(r => r.priority === 'high');

    const actions = [];

    // Add immediate actions
    for (const recommendation of immediateActions) {
      if (recommendation.action.includes('retention')) {
        actions.push({
          id: `retention_${customer.contactId}_${Date.now()}`,
          type: ActionType.SEND_EMAIL,
          priority: 1,
          scheduledAt: new Date(),
          metadata: {
            template: 'high_value_retention',
            personalizedContent: recommendation.reasoning,
            urgency: 'immediate',
            customerTier: customer.valueTier
          }
        });
      }
    }

    // Add high priority actions
    for (const recommendation of highPriorityActions) {
      if (recommendation.action.includes('account manager')) {
        actions.push({
          id: `assign_manager_${customer.contactId}_${Date.now()}`,
          type: ActionType.CREATE_TASK,
          priority: 2,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          metadata: {
            taskType: 'assign_account_manager',
            customerTier: customer.valueTier,
            customerValue: customer.lifetimeValue.predicted,
            reasoning: recommendation.reasoning
          }
        });
      }
    }

    const actionPlan: ActionPlan = {
      id: `high_value_${customer.contactId}_${Date.now()}`,
      organizationId: customer.organizationId,
      contactId: customer.contactId,
      triggerEvent: 'high_value_detected',
      actions,
      priority: customer.valueTier === 'platinum' ? 'high' : 'medium',
      status: 'pending',
      riskLevel: 'low',
      expectedOutcome: {
        probabilityOfSuccess: 0.8,
        estimatedValue: customer.lifetimeValue.potentialUpside,
        timeToComplete: 72, // hours
        businessImpact: 'high'
      },
      createdAt: new Date(),
      scheduledFor: new Date()
    };

    return actionPlan;
  }

  /**
   * Calculate revenue potential
   */
  private calculateRevenuePotential(customers: HighValueCustomer[]): number {
    return customers.reduce((sum, customer) => 
      sum + customer.lifetimeValue.potentialUpside, 0
    );
  }

  /**
   * Calculate risk mitigation opportunities
   */
  private calculateRiskOpportunities(customers: HighValueCustomer[]): number {
    return customers.filter(customer => 
      customer.riskAssessment.churnProbability > 0.5
    ).length;
  }

  /**
   * Update customer profiles in database
   */
  private async updateCustomerProfiles(customers: HighValueCustomer[]): Promise<void> {
    for (const customer of customers) {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/ai/high-value-customers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contactId: customer.contactId,
              organizationId: customer.organizationId,
              valueTier: customer.valueTier,
              valueScore: customer.valueScore,
              lifetimeValue: customer.lifetimeValue,
              riskAssessment: customer.riskAssessment,
              behavioralIndicators: customer.behavioralIndicators,
              africanMarketFactors: customer.africanMarketFactors,
              detectionTriggers: customer.detectionTriggers,
              recommendations: customer.recommendations,
              detectedAt: customer.detectedAt,
              lastUpdated: customer.lastUpdated,
              nextReviewDate: customer.nextReviewDate
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update customer profile: ${response.statusText}`);
        }
      } catch (error) {
        logger.error('Failed to update customer profile', {
          customerId: customer.contactId,
          error: error instanceof Error ? error.message : error
        });
      }
    }
  }
}

/**
 * Singleton access to high-value customer detection engine
 */
let highValueDetectionEngine: HighValueCustomerDetectionEngine | null = null;

export function getHighValueCustomerDetectionEngine(): HighValueCustomerDetectionEngine {
  if (!highValueDetectionEngine) {
    highValueDetectionEngine = new HighValueCustomerDetectionEngine();
  }
  return highValueDetectionEngine;
}

/**
 * Helper function for API/cron usage
 */
export async function runHighValueDetection(organizationId: string): Promise<DetectionResult> {
  const engine = getHighValueCustomerDetectionEngine();
  return await engine.runDetection(organizationId);
}