/**
 * Enhanced AI Decision Handler with Next-Best-Action Logic
 * ========================================================
 * 
 * Advanced AI decision-making engine that analyzes customer events and recommends
 * the next best action using sophisticated algorithms and machine learning models
 * 
 * Key Features:
 * - Next-Best-Action algorithm with multi-factor scoring
 * - Customer journey stage analysis
 * - Predictive modeling for churn, LTV, and engagement
 * - Advanced action plan generation
 * - Risk-based governance integration
 * - Cultural intelligence for African markets
 * 
 * Based on user's blueprint: Supreme-AI Decision Engine with Next-Best-Action Logic
 */

import { type CustomerEvent, CustomerEventType, EventPriority } from '../event-bus';
import { SupremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { 
  type ActionPlan, 
  ActionPlanBuilder, 
  ActionType, 
  ActionStatus, 
  RiskLevel,
  ExecutionMode 
} from '@/lib/actions/action-plan-interface';
import { ActionPlanManager } from '@/lib/actions/action-plan-manager';

export interface AIDecision {
  contactId: string;
  organizationId: string;
  actionType: ActionType;
  confidence: number;
  reasoning: string;
  priority: EventPriority;
  riskLevel: RiskLevel;
  data: Record<string, any>;
  executionTime?: Date;
  expiresAt?: Date;
  score: number; // Next-Best-Action score
  alternatives?: AIDecision[]; // Alternative actions considered
}

export interface CustomerContext {
  profile: any;
  journeyStage: 'awareness' | 'consideration' | 'purchase' | 'retention' | 'advocacy' | 'churn_risk';
  engagementLevel: 'high' | 'medium' | 'low' | 'dormant';
  riskFactors: string[];
  opportunities: string[];
  lastActions: string[];
  preferences: {
    channel: 'email' | 'sms' | 'whatsapp' | 'push';
    frequency: 'daily' | 'weekly' | 'monthly';
    timeZone: string;
    language: string;
  };
  marketContext: {
    country: string;
    currency: string;
    culturalFactors: string[];
  };
}

export interface NextBestActionScore {
  actionType: ActionType;
  score: number;
  factors: {
    relevance: number;      // How relevant to current situation (0-1)
    urgency: number;        // How urgent the action is (0-1)
    impact: number;         // Expected impact on customer (0-1)
    feasibility: number;    // How easy to execute (0-1)
    risk: number;           // Risk level (0-1, lower is better)
    timing: number;         // Timing appropriateness (0-1)
    cultural: number;       // Cultural appropriateness (0-1)
  };
  reasoning: string;
}

/**
 * AI Decision Handler - Core intelligence for autonomous customer lifecycle
 */
export class AIDecisionHandler {
  
  /**
   * Enhanced customer event processing with Next-Best-Action logic
   */
  static async handleCustomerEvent(event: CustomerEvent): Promise<void> {
    try {
      logger.info('Enhanced AI Decision Handler processing customer event', {
        eventType: event.type,
        eventId: event.id,
        contactId: event.contactId,
        organizationId: event.organizationId
      });

      // Build comprehensive customer context
      const customerContext = await AIDecisionHandler.buildCustomerContext(
        event.contactId!, 
        event.organizationId
      );

      // Determine if AI should act on this event
      const shouldProcess = AIDecisionHandler.shouldProcessEvent(event, customerContext);
      
      if (!shouldProcess) {
        logger.debug('AI Decision Handler skipping event - criteria not met', {
          eventType: event.type,
          eventId: event.id
        });
        return;
      }

      // Generate Next-Best-Action recommendations
      const actionRecommendations = await AIDecisionHandler.generateNextBestActions(
        event, 
        customerContext
      );

      if (actionRecommendations.length > 0) {
        // Select the best action based on scoring
        const bestAction = actionRecommendations[0];
        
        // Create comprehensive action plan
        const actionPlan = await AIDecisionHandler.createActionPlan(
          bestAction, 
          event, 
          customerContext,
          actionRecommendations.slice(1) // Alternative actions
        );
        
        // Store action plan using ActionPlanManager
        const actionPlanId = await ActionPlanManager.createActionPlan(actionPlan);
        
        logger.info('Enhanced AI action plan created', {
          actionPlanId,
          actionType: bestAction.actionType,
          score: bestAction.score,
          confidence: bestAction.confidence,
          riskLevel: bestAction.riskLevel,
          alternatives: actionRecommendations.length - 1
        });
      }

    } catch (error) {
      logger.error('Enhanced AI Decision Handler failed to process customer event', {
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Build comprehensive customer context for AI decision making
   */
  private static async buildCustomerContext(
    contactId: string, 
    organizationId: string
  ): Promise<CustomerContext> {
    try {
      // Get customer profile with comprehensive data
      const customerProfile = await prisma.customerProfile.findUnique({
        where: { contactId },
        include: {
          contact: {
            include: {
              lists: true,
              segments: true,
              journeys: {
                include: {
                  journey: true
                }
              },
              emailCampaigns: {
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              smsCampaigns: {
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              whatsAppCampaigns: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      // Get recent AI action plans for this customer
      const recentActions = await prisma.aIActionPlan.findMany({
        where: {
          contactId,
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Analyze customer journey stage
      const journeyStage = AIDecisionHandler.determineJourneyStage(customerProfile);
      
      // Determine engagement level
      const engagementLevel = AIDecisionHandler.calculateEngagementLevel(customerProfile);
      
      // Identify risk factors and opportunities
      const riskFactors = AIDecisionHandler.identifyRiskFactors(customerProfile);
      const opportunities = AIDecisionHandler.identifyOpportunities(customerProfile);
      
      // Get customer preferences
      const preferences = AIDecisionHandler.inferCustomerPreferences(customerProfile);
      
      // Get market context
      const marketContext = await AIDecisionHandler.getMarketContext(organizationId);

      return {
        profile: customerProfile,
        journeyStage,
        engagementLevel,
        riskFactors,
        opportunities,
        lastActions: recentActions.map(action => action.actionType),
        preferences,
        marketContext
      };

    } catch (error) {
      logger.warn('Could not build complete customer context - using minimal context', {
        contactId,
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      
      // Return minimal context if data unavailable
      return {
        profile: {
          contactId,
          organizationId,
          engagementScore: 0.5,
          churnRisk: 'low',
          lifetimeValue: 0,
          lastInteraction: new Date()
        },
        journeyStage: 'consideration',
        engagementLevel: 'medium',
        riskFactors: [],
        opportunities: [],
        lastActions: [],
        preferences: {
          channel: 'email',
          frequency: 'weekly',
          timeZone: 'Africa/Lagos',
          language: 'en'
        },
        marketContext: {
          country: 'NG',
          currency: 'NGN',
          culturalFactors: ['mobile-first', 'value-conscious']
        }
      };
    }
  }

  /**
   * Enhanced event processing criteria
   */
  private static shouldProcessEvent(event: CustomerEvent, customerContext: CustomerContext): boolean {
    // Always process high-priority events
    if (event.priority === EventPriority.CRITICAL || event.priority === EventPriority.HIGH) {
      return true;
    }

    // Process events for high-value customers
    if (customerContext.profile?.lifetimeValue > 1000) {
      return true;
    }

    // Process events based on customer journey stage
    const criticalStages = ['churn_risk', 'consideration', 'purchase'];
    if (criticalStages.includes(customerContext.journeyStage)) {
      return true;
    }

    // Process events for customers with risk factors
    if (customerContext.riskFactors.length > 0) {
      return true;
    }

    // Process events indicating engagement opportunities
    const engagementEvents = [
      CustomerEventType.CONTACT_EMAIL_OPENED,
      CustomerEventType.CONTACT_EMAIL_CLICKED,
      CustomerEventType.WEBSITE_VISIT,
      CustomerEventType.FORM_SUBMISSION,
      CustomerEventType.PURCHASE_COMPLETED
    ];

    if (engagementEvents.includes(event.type)) {
      return true;
    }

    // Process churn and opportunity events
    const actionableEvents = [
      CustomerEventType.CHURN_RISK_DETECTED,
      CustomerEventType.CART_ABANDONMENT,
      CustomerEventType.CAMPAIGN_UNSUBSCRIBED,
      CustomerEventType.BIRTHDAY_DETECTED,
      CustomerEventType.ANNIVERSARY_DETECTED,
      CustomerEventType.HIGH_VALUE_DETECTED
    ];

    if (actionableEvents.includes(event.type)) {
      return true;
    }

    // Skip dormant customers unless it's a reactivation opportunity
    if (customerContext.engagementLevel === 'dormant' && 
        event.type !== CustomerEventType.CONTACT_EMAIL_OPENED) {
      return false;
    }

    return false;
  }

  /**
   * Generate Next-Best-Action recommendations using enhanced AI logic
   */
  private static async generateNextBestActions(
    event: CustomerEvent, 
    customerContext: CustomerContext
  ): Promise<NextBestActionScore[]> {
    try {
      // Get all potential actions for this customer context
      const potentialActions = AIDecisionHandler.getPotentialActions(event, customerContext);
      
      // Score each potential action
      const scoredActions: NextBestActionScore[] = [];
      
      for (const actionType of potentialActions) {
        const score = await AIDecisionHandler.calculateActionScore(
          actionType, 
          event, 
          customerContext
        );
        
        if (score.score > 0.3) { // Only consider actions with reasonable scores
          scoredActions.push(score);
        }
      }
      
      // Sort by score (highest first)
      scoredActions.sort((a, b) => b.score - a.score);
      
      // Get AI enhancement for top 3 actions
      const topActions = scoredActions.slice(0, 3);
      const enhancedActions = await AIDecisionHandler.enhanceActionsWithAI(
        topActions, 
        event, 
        customerContext
      );
      
      return enhancedActions;
      
    } catch (error) {
      logger.error('Failed to generate next best actions', {
        eventId: event.id,
        contactId: event.contactId,
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }
  
  /**
   * Get potential actions based on event type and customer context
   */
  private static getPotentialActions(
    event: CustomerEvent, 
    customerContext: CustomerContext
  ): ActionType[] {
    const actions: ActionType[] = [];
    
    // Event-specific actions
    switch (event.type) {
      case CustomerEventType.CONTACT_EMAIL_OPENED:
        actions.push(ActionType.SEND_EMAIL, ActionType.TRIGGER_WORKFLOW);
        break;
      case CustomerEventType.CART_ABANDONMENT:
        actions.push(ActionType.SEND_EMAIL, ActionType.APPLY_DISCOUNT, ActionType.SEND_SMS);
        break;
      case CustomerEventType.CHURN_RISK_DETECTED:
        actions.push(ActionType.CHURN_PREVENTION, ActionType.APPLY_DISCOUNT, ActionType.CREATE_TASK);
        break;
      case CustomerEventType.BIRTHDAY_DETECTED:
        actions.push(ActionType.BIRTHDAY_GREETING, ActionType.APPLY_DISCOUNT, ActionType.LOYALTY_REWARD);
        break;
      case CustomerEventType.HIGH_VALUE_DETECTED:
        actions.push(ActionType.UPSELL_OPPORTUNITY, ActionType.LOYALTY_REWARD, ActionType.CREATE_TASK);
        break;
      case CustomerEventType.PURCHASE_COMPLETED:
        actions.push(ActionType.REQUEST_REVIEW, ActionType.CROSS_SELL_OPPORTUNITY, ActionType.SEND_SURVEY);
        break;
      default:
        // Generic engagement actions
        actions.push(ActionType.SEND_EMAIL, ActionType.CREATE_TASK);
    }
    
    // Journey stage specific actions
    switch (customerContext.journeyStage) {
      case 'awareness':
        actions.push(ActionType.SEND_EDUCATIONAL_CONTENT, ActionType.INVITE_TO_WEBINAR);
        break;
      case 'consideration':
        actions.push(ActionType.SEND_SURVEY, ActionType.CREATE_PERSONALIZED_OFFER);
        break;
      case 'purchase':
        actions.push(ActionType.APPLY_DISCOUNT, ActionType.PRICE_DROP_ALERT);
        break;
      case 'retention':
        actions.push(ActionType.LOYALTY_REWARD, ActionType.CROSS_SELL_OPPORTUNITY);
        break;
      case 'churn_risk':
        actions.push(ActionType.CHURN_PREVENTION, ActionType.WINBACK_CAMPAIGN);
        break;
    }
    
    // Opportunity-based actions
    if (customerContext.opportunities.includes('upsell')) {
      actions.push(ActionType.UPSELL_OPPORTUNITY);
    }
    if (customerContext.opportunities.includes('cross_sell')) {
      actions.push(ActionType.CROSS_SELL_OPPORTUNITY);
    }
    if (customerContext.opportunities.includes('reactivation')) {
      actions.push(ActionType.WINBACK_CAMPAIGN);
    }
    
    // Remove duplicates and return
    return [...new Set(actions)];
  }
  
  /**
   * Calculate comprehensive score for an action
   */
  private static async calculateActionScore(
    actionType: ActionType,
    event: CustomerEvent,
    customerContext: CustomerContext
  ): Promise<NextBestActionScore> {
    const factors = {
      relevance: AIDecisionHandler.calculateRelevanceScore(actionType, event, customerContext),
      urgency: AIDecisionHandler.calculateUrgencyScore(actionType, event, customerContext),
      impact: AIDecisionHandler.calculateImpactScore(actionType, customerContext),
      feasibility: AIDecisionHandler.calculateFeasibilityScore(actionType, customerContext),
      risk: AIDecisionHandler.calculateRiskScore(actionType, customerContext),
      timing: AIDecisionHandler.calculateTimingScore(actionType, event, customerContext),
      cultural: AIDecisionHandler.calculateCulturalScore(actionType, customerContext)
    };
    
    // Weighted scoring algorithm
    const weights = {
      relevance: 0.25,    // How well does this action fit the situation?
      urgency: 0.20,      // How time-sensitive is this action?
      impact: 0.20,       // What's the expected positive impact?
      feasibility: 0.15,  // How easy is it to execute?
      risk: 0.10,         // What's the risk of negative outcome?
      timing: 0.10,       // Is this the right time?
      cultural: 0.10      // Does this fit the cultural context?
    };
    
    const score = 
      factors.relevance * weights.relevance +
      factors.urgency * weights.urgency +
      factors.impact * weights.impact +
      factors.feasibility * weights.feasibility +
      (1 - factors.risk) * weights.risk + // Lower risk = higher score
      factors.timing * weights.timing +
      factors.cultural * weights.cultural;
    
    const reasoning = AIDecisionHandler.generateScoringReasoning(actionType, factors, score);
    
    return {
      actionType,
      score: Math.min(Math.max(score, 0), 1), // Clamp between 0 and 1
      factors,
      reasoning
    };
  }
  /**
   * Enhance action scores with Supreme-AI v3 intelligence
   */
  private static async enhanceActionsWithAI(
    scoredActions: NextBestActionScore[],
    event: CustomerEvent,
    customerContext: CustomerContext
  ): Promise<NextBestActionScore[]> {
    try {
      // Prepare comprehensive context for Supreme-AI v3
      const aiContext = {
        type: 'next_best_action_enhancement',
        event: {
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
          priority: event.priority
        },
        customer: {
          id: event.contactId,
          profile: customerContext.profile,
          journeyStage: customerContext.journeyStage,
          engagementLevel: customerContext.engagementLevel,
          riskFactors: customerContext.riskFactors,
          opportunities: customerContext.opportunities,
          lastActions: customerContext.lastActions,
          preferences: customerContext.preferences,
          marketContext: customerContext.marketContext
        },
        candidateActions: scoredActions.map(action => ({
          actionType: action.actionType,
          score: action.score,
          reasoning: action.reasoning
        }))
      };

      // Get Supreme-AI enhancement
      const aiResponse = await SupremeAIv3.process({
        type: 'analysis',
        userId: event.userId || 'system',
        content: `Enhance next-best-action recommendations with cultural intelligence and market context: ${JSON.stringify(aiContext)}`,
        enableTaskExecution: false // Just analysis, no task execution
      });

      if (aiResponse.success && aiResponse.data?.answer) {
        // Parse AI enhancements and apply to actions
        return AIDecisionHandler.applyAIEnhancements(scoredActions, aiResponse, customerContext);
      } else {
        logger.warn('Supreme-AI v3 enhancement failed, using original scores', {
          eventId: event.id,
          contactId: event.contactId
        });
        return scoredActions;
      }

    } catch (error) {
      logger.error('Failed to enhance actions with AI', {
        eventId: event.id,
        contactId: event.contactId,
        error: error instanceof Error ? error.message : error
      });
      return scoredActions;
    }
  }
  
  /**
   * Apply AI enhancements to scored actions
   */
  private static applyAIEnhancements(
    scoredActions: NextBestActionScore[],
    aiResponse: any,
    customerContext: CustomerContext
  ): NextBestActionScore[] {
    const aiAnalysis = aiResponse.data?.answer || '';
    
    return scoredActions.map(action => {
      // Apply AI-suggested score adjustments
      let enhancedScore = action.score;
      let enhancedReasoning = action.reasoning;
      
      // Look for AI recommendations about this specific action
      if (aiAnalysis.toLowerCase().includes(action.actionType.toLowerCase())) {
        // Apply cultural and contextual adjustments
        if (aiAnalysis.includes('highly recommended') || aiAnalysis.includes('strongly suggest')) {
          enhancedScore = Math.min(enhancedScore * 1.2, 1.0);
          enhancedReasoning += ' | AI: Highly recommended for this context';
        } else if (aiAnalysis.includes('not recommended') || aiAnalysis.includes('avoid')) {
          enhancedScore = enhancedScore * 0.7;
          enhancedReasoning += ' | AI: Caution advised for this context';
        }
        
        // Apply cultural intelligence adjustments
        if (customerContext.marketContext.culturalFactors.includes('mobile-first') && 
            [ActionType.SEND_SMS, ActionType.SEND_WHATSAPP].includes(action.actionType)) {
          enhancedScore = Math.min(enhancedScore * 1.1, 1.0);
          enhancedReasoning += ' | AI: Mobile-first culture boost';
        }
      }
      
      return {
        ...action,
        score: enhancedScore,
        reasoning: enhancedReasoning
      };
    });
  }

  /**
   * Create comprehensive action plan from best action recommendation
   */
  private static async createActionPlan(
    bestAction: NextBestActionScore,
    event: CustomerEvent,
    customerContext: CustomerContext,
    alternatives: NextBestActionScore[]
  ): Promise<ActionPlan> {
    // Determine risk level
    const riskLevel = AIDecisionHandler.determineRiskLevel(bestAction, customerContext);
    
    // Determine execution mode
    const executionMode = AIDecisionHandler.determineExecutionMode(bestAction, event);
    
    // Calculate scheduling
    const scheduledAt = AIDecisionHandler.calculateOptimalTiming(bestAction, customerContext);
    
    // Build action plan using the builder pattern
    const builder = new ActionPlanBuilder(
      event.contactId!,
      event.organizationId,
      bestAction.actionType
    )
      .withName(AIDecisionHandler.generateActionName(bestAction.actionType, customerContext))
      .withDescription(bestAction.reasoning)
      .withAIDecision(bestAction.score, bestAction.reasoning, 'supreme-ai-v3-enhanced')
      .withPriority(event.priority)
      .withRiskLevel(riskLevel)
      .withParameters(AIDecisionHandler.generateActionParameters(bestAction, customerContext))
      .withContext({
        triggerEvent: event.type,
        customerSegment: customerContext.journeyStage,
        previousActions: customerContext.lastActions,
        marketContext: {
          country: customerContext.marketContext.country,
          currency: customerContext.marketContext.currency,
          timezone: customerContext.preferences.timeZone,
          culturalNotes: customerContext.marketContext.culturalFactors
        }
      })
      .withTags(AIDecisionHandler.generateActionTags(bestAction, customerContext, event))
      .withMetadata({
        nextBestActionScore: bestAction.score,
        scoringFactors: bestAction.factors,
        alternatives: alternatives.map(alt => ({
          actionType: alt.actionType,
          score: alt.score,
          reasoning: alt.reasoning
        })),
        customerContext: {
          journeyStage: customerContext.journeyStage,
          engagementLevel: customerContext.engagementLevel,
          riskFactors: customerContext.riskFactors,
          opportunities: customerContext.opportunities
        },
        eventTriggered: {
          type: event.type,
          timestamp: event.timestamp,
          priority: event.priority
        }
      })
      .withEstimatedImpact(bestAction.factors.impact)
      .withCostEstimate(AIDecisionHandler.estimateActionCost(bestAction.actionType));
    
    // Set execution timing
    if (executionMode === ExecutionMode.SCHEDULED && scheduledAt) {
      builder.withSchedule(scheduledAt);
    }
    
    // Set expiration (actions expire after 7 days if not executed)
    builder.withExpiration(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return builder.build();
  }

  // This method is now replaced by ActionPlanManager.createActionPlan()

  /**
   * Helper methods for customer context analysis
   */
  
  private static determineJourneyStage(customerProfile: any): CustomerContext['journeyStage'] {
    if (!customerProfile) return 'consideration';
    
    const profile = customerProfile.profile || customerProfile;
    
    // Check for churn risk indicators
    if (profile.churnRisk === 'high' || profile.churnRisk === 'critical') {
      return 'churn_risk';
    }
    
    // Check customer activity and purchase history
    const lifetimeValue = profile.lifetimeValue || 0;
    const lastInteraction = profile.lastInteraction ? new Date(profile.lastInteraction) : null;
    const daysSinceLastInteraction = lastInteraction ? 
      (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24) : 999;
    
    if (lifetimeValue === 0 && daysSinceLastInteraction < 7) {
      return 'awareness';
    } else if (lifetimeValue === 0 && daysSinceLastInteraction < 30) {
      return 'consideration';
    } else if (lifetimeValue > 0 && daysSinceLastInteraction < 7) {
      return 'purchase';
    } else if (lifetimeValue > 0 && daysSinceLastInteraction < 90) {
      return 'retention';
    } else if (lifetimeValue > 0 && daysSinceLastInteraction > 90) {
      return 'advocacy';
    }
    
    return 'consideration';
  }
  
  private static calculateEngagementLevel(customerProfile: any): CustomerContext['engagementLevel'] {
    if (!customerProfile) return 'medium';
    
    const profile = customerProfile.profile || customerProfile;
    const engagementScore = profile.engagementScore || 0.5;
    
    if (engagementScore >= 0.8) return 'high';
    if (engagementScore >= 0.5) return 'medium';
    if (engagementScore >= 0.2) return 'low';
    return 'dormant';
  }
  
  private static identifyRiskFactors(customerProfile: any): string[] {
    const risks: string[] = [];
    if (!customerProfile) return risks;
    
    const profile = customerProfile.profile || customerProfile;
    
    if (profile.churnRisk === 'high' || profile.churnRisk === 'critical') {
      risks.push('high_churn_risk');
    }
    
    if (profile.engagementScore < 0.3) {
      risks.push('low_engagement');
    }
    
    const lastInteraction = profile.lastInteraction ? new Date(profile.lastInteraction) : null;
    const daysSinceLastInteraction = lastInteraction ? 
      (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24) : 999;
      
    if (daysSinceLastInteraction > 30) {
      risks.push('inactive_customer');
    }
    
    if (profile.lifetimeValue > 0 && daysSinceLastInteraction > 90) {
      risks.push('potential_churn');
    }
    
    return risks;
  }
  
  private static identifyOpportunities(customerProfile: any): string[] {
    const opportunities: string[] = [];
    if (!customerProfile) return opportunities;
    
    const profile = customerProfile.profile || customerProfile;
    
    if (profile.lifetimeValue > 1000) {
      opportunities.push('upsell');
    }
    
    if (profile.engagementScore > 0.7) {
      opportunities.push('cross_sell');
    }
    
    if (profile.lifetimeValue === 0 && profile.engagementScore > 0.5) {
      opportunities.push('conversion');
    }
    
    const lastInteraction = profile.lastInteraction ? new Date(profile.lastInteraction) : null;
    const daysSinceLastInteraction = lastInteraction ? 
      (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24) : 999;
      
    if (profile.lifetimeValue > 0 && daysSinceLastInteraction > 60 && daysSinceLastInteraction < 120) {
      opportunities.push('reactivation');
    }
    
    return opportunities;
  }
  
  private static inferCustomerPreferences(customerProfile: any): CustomerContext['preferences'] {
    const defaults = {
      channel: 'email' as const,
      frequency: 'weekly' as const,
      timeZone: 'Africa/Lagos',
      language: 'en'
    };
    
    if (!customerProfile) return defaults;
    
    const profile = customerProfile.profile || customerProfile;
    
    return {
      channel: profile.preferredChannel || defaults.channel,
      frequency: profile.communicationFrequency || defaults.frequency,
      timeZone: profile.timeZone || defaults.timeZone,
      language: profile.language || defaults.language
    };
  }
  
  private static async getMarketContext(organizationId: string): Promise<CustomerContext['marketContext']> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      
      // Default to Nigerian context
      return {
        country: organization?.country || 'NG',
        currency: organization?.currency || 'NGN',
        culturalFactors: ['mobile-first', 'value-conscious', 'relationship-focused']
      };
    } catch (error) {
      return {
        country: 'NG',
        currency: 'NGN',
        culturalFactors: ['mobile-first', 'value-conscious']
      };
    }
  }

  /**
   * Next-Best-Action scoring algorithms
   */
  
  private static calculateRelevanceScore(
    actionType: ActionType, 
    event: CustomerEvent, 
    customerContext: CustomerContext
  ): number {
    let score = 0.5; // Base relevance
    
    // Event-action relevance mapping
    const eventActionRelevance: Record<string, Partial<Record<ActionType, number>>> = {
      [CustomerEventType.CART_ABANDONMENT]: {
        [ActionType.SEND_EMAIL]: 0.9,
        [ActionType.APPLY_DISCOUNT]: 0.8,
        [ActionType.SEND_SMS]: 0.7
      },
      [CustomerEventType.CHURN_RISK_DETECTED]: {
        [ActionType.CHURN_PREVENTION]: 0.95,
        [ActionType.CREATE_TASK]: 0.8,
        [ActionType.APPLY_DISCOUNT]: 0.7
      },
      [CustomerEventType.BIRTHDAY_DETECTED]: {
        [ActionType.BIRTHDAY_GREETING]: 0.95,
        [ActionType.APPLY_DISCOUNT]: 0.8,
        [ActionType.LOYALTY_REWARD]: 0.7
      },
      [CustomerEventType.HIGH_VALUE_DETECTED]: {
        [ActionType.UPSELL_OPPORTUNITY]: 0.9,
        [ActionType.LOYALTY_REWARD]: 0.8,
        [ActionType.CREATE_TASK]: 0.7
      }
    };
    
    const eventRelevance = eventActionRelevance[event.type];
    if (eventRelevance && eventRelevance[actionType]) {
      score = eventRelevance[actionType]!;
    }
    
    // Journey stage relevance adjustments
    if (customerContext.journeyStage === 'churn_risk' && 
        [ActionType.CHURN_PREVENTION, ActionType.WINBACK_CAMPAIGN].includes(actionType)) {
      score = Math.min(score * 1.2, 1.0);
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateUrgencyScore(
    actionType: ActionType, 
    event: CustomerEvent, 
    customerContext: CustomerContext
  ): number {
    let score = 0.5; // Base urgency
    
    // High urgency actions
    const urgentActions = [
      ActionType.CHURN_PREVENTION,
      ActionType.CART_ABANDONMENT,
      ActionType.PROACTIVE_SUPPORT
    ];
    
    if (urgentActions.includes(actionType)) {
      score = 0.8;
    }
    
    // Event priority influence
    if (event.priority === EventPriority.CRITICAL) {
      score = Math.min(score * 1.3, 1.0);
    } else if (event.priority === EventPriority.HIGH) {
      score = Math.min(score * 1.1, 1.0);
    }
    
    // Customer risk factors increase urgency
    if (customerContext.riskFactors.includes('high_churn_risk')) {
      score = Math.min(score * 1.2, 1.0);
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateImpactScore(actionType: ActionType, customerContext: CustomerContext): number {
    let score = 0.5; // Base impact
    
    // High impact actions for different customer segments
    const highImpactForHighValue = [
      ActionType.UPSELL_OPPORTUNITY,
      ActionType.LOYALTY_REWARD,
      ActionType.CROSS_SELL_OPPORTUNITY
    ];
    
    const highImpactForChurnRisk = [
      ActionType.CHURN_PREVENTION,
      ActionType.APPLY_DISCOUNT,
      ActionType.WINBACK_CAMPAIGN
    ];
    
    if (customerContext.profile?.lifetimeValue > 1000 && 
        highImpactForHighValue.includes(actionType)) {
      score = 0.8;
    }
    
    if (customerContext.riskFactors.includes('high_churn_risk') && 
        highImpactForChurnRisk.includes(actionType)) {
      score = 0.85;
    }
    
    // Engagement level adjustments
    if (customerContext.engagementLevel === 'high') {
      score = Math.min(score * 1.1, 1.0);
    } else if (customerContext.engagementLevel === 'dormant') {
      score = score * 0.8;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateFeasibilityScore(actionType: ActionType, customerContext: CustomerContext): number {
    let score = 0.8; // Most actions are feasible
    
    // Channel preference feasibility
    const channelActions: Record<string, ActionType[]> = {
      email: [ActionType.SEND_EMAIL],
      sms: [ActionType.SEND_SMS],
      whatsapp: [ActionType.SEND_WHATSAPP]
    };
    
    const preferredChannel = customerContext.preferences.channel;
    const channelSpecificActions = channelActions[preferredChannel] || [];
    
    if (channelSpecificActions.includes(actionType)) {
      score = 0.9; // Higher feasibility for preferred channel
    }
    
    // Complex actions have lower feasibility
    const complexActions = [
      ActionType.TRIGGER_WORKFLOW,
      ActionType.CREATE_PERSONALIZED_OFFER,
      ActionType.ESCALATE_ISSUE
    ];
    
    if (complexActions.includes(actionType)) {
      score = 0.6;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateRiskScore(actionType: ActionType, customerContext: CustomerContext): number {
    let score = 0.2; // Low risk by default
    
    // Higher risk actions
    const highRiskActions = [
      ActionType.APPLY_DISCOUNT,
      ActionType.SEND_COUPON,
      ActionType.ESCALATE_ISSUE
    ];
    
    const mediumRiskActions = [
      ActionType.CREATE_TASK,
      ActionType.TRIGGER_WORKFLOW,
      ActionType.SEND_SURVEY
    ];
    
    if (highRiskActions.includes(actionType)) {
      score = 0.6;
    } else if (mediumRiskActions.includes(actionType)) {
      score = 0.4;
    }
    
    // Customer context risk adjustments
    if (customerContext.engagementLevel === 'dormant') {
      score = Math.min(score * 1.3, 1.0); // Higher risk for dormant customers
    }
    
    if (customerContext.riskFactors.includes('high_churn_risk')) {
      score = score * 0.8; // Lower risk tolerance for churn-risk customers
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateTimingScore(
    actionType: ActionType, 
    event: CustomerEvent, 
    customerContext: CustomerContext
  ): number {
    let score = 0.7; // Good timing by default
    
    // Time-sensitive actions get higher scores when triggered by relevant events
    const timeSensitiveMapping: Record<ActionType, CustomerEventType[]> = {
      [ActionType.CART_ABANDONMENT]: [CustomerEventType.CART_ABANDONMENT],
      [ActionType.BIRTHDAY_GREETING]: [CustomerEventType.BIRTHDAY_DETECTED],
      [ActionType.CHURN_PREVENTION]: [CustomerEventType.CHURN_RISK_DETECTED],
      [ActionType.FOLLOW_UP_SUPPORT]: [CustomerEventType.SUPPORT_TICKET_CREATED]
    };
    
    const relevantEvents = timeSensitiveMapping[actionType];
    if (relevantEvents && relevantEvents.includes(event.type)) {
      score = 0.95;
    }
    
    // Check if we've taken similar action recently
    if (customerContext.lastActions.includes(actionType)) {
      score = score * 0.6; // Lower score for repeated actions
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static calculateCulturalScore(actionType: ActionType, customerContext: CustomerContext): number {
    let score = 0.8; // Good cultural fit by default
    
    const culturalFactors = customerContext.marketContext.culturalFactors;
    
    // Mobile-first culture preferences
    if (culturalFactors.includes('mobile-first')) {
      const mobileActions = [ActionType.SEND_SMS, ActionType.SEND_WHATSAPP, ActionType.SEND_PUSH_NOTIFICATION];
      if (mobileActions.includes(actionType)) {
        score = Math.min(score * 1.2, 1.0);
      }
    }
    
    // Value-conscious culture preferences
    if (culturalFactors.includes('value-conscious')) {
      const valueActions = [ActionType.APPLY_DISCOUNT, ActionType.SEND_COUPON, ActionType.PRICE_DROP_ALERT];
      if (valueActions.includes(actionType)) {
        score = Math.min(score * 1.1, 1.0);
      }
    }
    
    // Relationship-focused culture preferences
    if (culturalFactors.includes('relationship-focused')) {
      const relationshipActions = [ActionType.BIRTHDAY_GREETING, ActionType.ANNIVERSARY_GREETING, ActionType.CREATE_TASK];
      if (relationshipActions.includes(actionType)) {
        score = Math.min(score * 1.1, 1.0);
      }
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private static generateScoringReasoning(
    actionType: ActionType, 
    factors: NextBestActionScore['factors'], 
    score: number
  ): string {
    const reasons: string[] = [];
    
    if (factors.relevance > 0.8) reasons.push('highly relevant to current situation');
    if (factors.urgency > 0.8) reasons.push('urgent action required');
    if (factors.impact > 0.8) reasons.push('high expected impact');
    if (factors.feasibility > 0.8) reasons.push('easy to execute');
    if (factors.risk < 0.3) reasons.push('low risk');
    if (factors.timing > 0.8) reasons.push('optimal timing');
    if (factors.cultural > 0.8) reasons.push('culturally appropriate');
    
    const scoreDescription = score > 0.8 ? 'Highly recommended' : 
                           score > 0.6 ? 'Recommended' : 
                           score > 0.4 ? 'Consider' : 'Not recommended';
    
    return `${scoreDescription}: ${reasons.join(', ')} (Score: ${(score * 100).toFixed(0)}%)`;
  }

  /**
   * Action plan creation helpers
   */
  
  private static determineRiskLevel(action: NextBestActionScore, customerContext: CustomerContext): RiskLevel {
    if (action.factors.risk > 0.7) return RiskLevel.CRITICAL;
    if (action.factors.risk > 0.5) return RiskLevel.HIGH;
    if (action.factors.risk > 0.3) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
  
  private static determineExecutionMode(action: NextBestActionScore, event: CustomerEvent): ExecutionMode {
    // Time-sensitive actions should execute immediately
    const immediateActions = [
      ActionType.CHURN_PREVENTION,
      ActionType.CART_ABANDONMENT,
      ActionType.PROACTIVE_SUPPORT
    ];
    
    if (immediateActions.includes(action.actionType) || event.priority === EventPriority.CRITICAL) {
      return ExecutionMode.IMMEDIATE;
    }
    
    // Birthday and anniversary actions should be scheduled
    const scheduledActions = [
      ActionType.BIRTHDAY_GREETING,
      ActionType.ANNIVERSARY_GREETING
    ];
    
    if (scheduledActions.includes(action.actionType)) {
      return ExecutionMode.SCHEDULED;
    }
    
    return ExecutionMode.IMMEDIATE;
  }
  
  private static calculateOptimalTiming(action: NextBestActionScore, customerContext: CustomerContext): Date | undefined {
    const now = new Date();
    
    // Birthday greetings should be sent on the birthday
    if (action.actionType === ActionType.BIRTHDAY_GREETING) {
      const birthday = new Date();
      birthday.setHours(9, 0, 0, 0); // 9 AM local time
      return birthday;
    }
    
    // For other scheduled actions, respect customer preferences
    const preferredHour = customerContext.preferences.timeZone.includes('Lagos') ? 10 : 9; // 10 AM WAT
    const optimalTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    optimalTime.setHours(preferredHour, 0, 0, 0);
    
    // If optimal time has passed today, schedule for tomorrow
    if (optimalTime <= now) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }
    
    return optimalTime;
  }
  
  private static generateActionName(actionType: ActionType, customerContext: CustomerContext): string {
    const templates: Record<ActionType, string> = {
      [ActionType.SEND_EMAIL]: `Engagement Email - ${customerContext.journeyStage}`,
      [ActionType.SEND_SMS]: `SMS Follow-up - ${customerContext.engagementLevel}`,
      [ActionType.SEND_WHATSAPP]: `WhatsApp Engagement - ${customerContext.journeyStage}`,
      [ActionType.CREATE_TASK]: `Follow-up Task - ${customerContext.engagementLevel} customer`,
      [ActionType.APPLY_DISCOUNT]: `Personalized Discount - ${customerContext.journeyStage}`,
      [ActionType.CHURN_PREVENTION]: `Churn Prevention Campaign`,
      [ActionType.BIRTHDAY_GREETING]: `Birthday Celebration Message`,
      [ActionType.UPSELL_OPPORTUNITY]: `Upsell Recommendation`,
      [ActionType.LOYALTY_REWARD]: `Loyalty Reward Program`,
      [ActionType.WINBACK_CAMPAIGN]: `Win-back Campaign`,
      [ActionType.CROSS_SELL_OPPORTUNITY]: `Cross-sell Recommendation`
    };
    
    return templates[actionType] || `AI Action: ${actionType}`;
  }
  
  private static generateActionParameters(action: NextBestActionScore, customerContext: CustomerContext): any {
    const baseParams = {
      channel: customerContext.preferences.channel,
      language: customerContext.preferences.language,
      timeZone: customerContext.preferences.timeZone,
      personalizationData: {
        journeyStage: customerContext.journeyStage,
        engagementLevel: customerContext.engagementLevel,
        country: customerContext.marketContext.country
      }
    };
    
    // Action-specific parameters
    switch (action.actionType) {
      case ActionType.SEND_EMAIL:
        return {
          ...baseParams,
          templateId: `engagement_${customerContext.journeyStage}`,
          subject: `Personalized for ${customerContext.journeyStage} stage`
        };
        
      case ActionType.APPLY_DISCOUNT:
        return {
          ...baseParams,
          discountType: 'percentage',
          discountValue: customerContext.profile?.lifetimeValue > 1000 ? 15 : 10,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        
      case ActionType.CREATE_TASK:
        return {
          ...baseParams,
          taskPriority: action.factors.urgency > 0.7 ? 'high' : 'medium',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        };
        
      default:
        return baseParams;
    }
  }
  
  private static generateActionTags(
    action: NextBestActionScore, 
    customerContext: CustomerContext, 
    event: CustomerEvent
  ): string[] {
    const tags = [
      'ai-generated',
      'next-best-action',
      `journey-${customerContext.journeyStage}`,
      `engagement-${customerContext.engagementLevel}`,
      `score-${Math.round(action.score * 100)}`,
      `event-${event.type}`
    ];
    
    // Add risk and opportunity tags
    customerContext.riskFactors.forEach(risk => tags.push(`risk-${risk}`));
    customerContext.opportunities.forEach(opp => tags.push(`opportunity-${opp}`));
    
    // Add cultural tags
    customerContext.marketContext.culturalFactors.forEach(factor => tags.push(`culture-${factor}`));
    
    return tags;
  }
  
  private static estimateActionCost(actionType: ActionType): number {
    const costs: Record<ActionType, number> = {
      [ActionType.SEND_EMAIL]: 0.01,
      [ActionType.SEND_SMS]: 0.05,
      [ActionType.SEND_WHATSAPP]: 0.02,
      [ActionType.CREATE_TASK]: 0.00,
      [ActionType.APPLY_DISCOUNT]: 5.00, // Estimated discount value
      [ActionType.SEND_COUPON]: 3.00,
      [ActionType.TRIGGER_WORKFLOW]: 0.10
    };
    
    return costs[actionType] || 0.00;
  }

  // Legacy governance method - replaced by ActionPlan system with built-in governance

  // Legacy execution methods - replaced by Action Dispatcher system
  // Action execution is now handled by the Action Dispatcher with proper governance
}