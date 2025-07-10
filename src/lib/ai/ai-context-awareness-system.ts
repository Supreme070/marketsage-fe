/**
 * AI Context Awareness System
 * ============================
 * 
 * Comprehensive context awareness system for intelligent AI decision making
 * Integrates user behavior, business context, temporal patterns, and environmental factors
 * Provides real-time context updates and predictive context modeling
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { redisCache } from '@/lib/cache/redis-client';
import { supremeMemory } from '@/lib/ai/memory-engine';
import { 
  AIPermissionService,
  type AIPermission 
} from '@/lib/ai/ai-permission-system';

// Core context interfaces
export interface AIContext {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  user: UserContext;
  business: BusinessContext;
  temporal: TemporalContext;
  behavioral: BehavioralContext;
  environmental: EnvironmentalContext;
  conversational: ConversationalContext;
  predictive: PredictiveContext;
  confidence: number;
  freshness: number; // 0-1, how recently this context was updated
}

export interface UserContext {
  id: string;
  role: string;
  permissions: AIPermission[];
  organization: {
    id: string;
    name: string;
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    market: string;
    timezone: string;
  };
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'technical';
    riskTolerance: 'low' | 'medium' | 'high';
    automationLevel: 'minimal' | 'moderate' | 'high' | 'full';
    preferredChannels: string[];
    workingHours: { start: number; end: number };
  };
  expertise: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    domains: string[];
    recentLearning: string[];
  };
  goals: {
    shortTerm: string[];
    longTerm: string[];
    priorities: string[];
  };
}

export interface BusinessContext {
  currentCampaigns: Array<{
    id: string;
    type: 'email' | 'sms' | 'whatsapp';
    status: string;
    performance: Record<string, number>;
  }>;
  recentActivities: Array<{
    type: string;
    outcome: 'success' | 'failure' | 'pending';
    timestamp: Date;
    impact: number;
  }>;
  marketConditions: {
    competitiveness: number;
    trends: string[];
    opportunities: string[];
    threats: string[];
  };
  resources: {
    budget: number;
    teamSize: number;
    techStack: string[];
    limitations: string[];
  };
  kpis: {
    current: Record<string, number>;
    targets: Record<string, number>;
    trends: Record<string, number>;
  };
}

export interface TemporalContext {
  currentTime: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  dayType: 'weekday' | 'weekend' | 'holiday';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  marketTiming: {
    optimal: boolean;
    reason: string;
    nextOptimal: Date;
  };
  patterns: {
    userActivity: Record<string, number>;
    businessPeaks: Record<string, number>;
    seasonalTrends: Record<string, number>;
  };
}

export interface BehavioralContext {
  recentActions: Array<{
    action: string;
    timestamp: Date;
    success: boolean;
    duration: number;
    complexity: number;
  }>;
  patterns: {
    frequency: Record<string, number>;
    preferences: Record<string, number>;
    effectiveness: Record<string, number>;
  };
  currentFocus: {
    area: string;
    intensity: number;
    duration: number;
  };
  workingStyle: {
    pace: 'slow' | 'moderate' | 'fast';
    methodology: 'structured' | 'flexible' | 'chaotic';
    collaboration: 'individual' | 'team' | 'mixed';
  };
  emotionalState: {
    mood: 'positive' | 'neutral' | 'negative';
    stress: number; // 0-1
    confidence: number; // 0-1
    frustration: number; // 0-1
  };
}

export interface EnvironmentalContext {
  system: {
    performance: number;
    load: number;
    availability: number;
    maintenance: boolean;
  };
  network: {
    latency: number;
    bandwidth: number;
    reliability: number;
  };
  external: {
    marketHours: boolean;
    apiHealth: Record<string, boolean>;
    serviceStatus: Record<string, string>;
  };
  constraints: {
    rateLimits: Record<string, number>;
    quotas: Record<string, number>;
    restrictions: string[];
  };
}

export interface ConversationalContext {
  sessionHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    success: boolean;
  }>;
  currentTopic: string;
  topicProgression: string[];
  conversationState: 'starting' | 'exploring' | 'deciding' | 'executing' | 'concluding';
  userIntent: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  responseStyle: {
    verbosity: 'brief' | 'detailed' | 'comprehensive';
    technicality: 'simple' | 'moderate' | 'advanced';
    formality: 'casual' | 'professional' | 'formal';
  };
}

export interface PredictiveContext {
  nextLikelyActions: Array<{
    action: string;
    probability: number;
    timing: Date;
    impact: number;
  }>;
  riskFactors: Array<{
    factor: string;
    probability: number;
    severity: number;
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    probability: number;
    value: number;
    requirements: string[];
  }>;
  trends: {
    behavior: Record<string, number>;
    business: Record<string, number>;
    market: Record<string, number>;
  };
}

// Context awareness engine
class AIContextAwarenessEngine {
  private contextCache: Map<string, AIContext> = new Map();
  private behaviorTracker: Map<string, Array<any>> = new Map();
  private contextUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startContextMonitoring();
  }

  /**
   * Get comprehensive context for a user
   */
  async getContext(userId: string, sessionId?: string): Promise<AIContext> {
    const cacheKey = `${userId}:${sessionId || 'default'}`;
    
    // Check cache first
    const cached = this.contextCache.get(cacheKey);
    if (cached && this.isContextFresh(cached)) {
      return cached;
    }

    // Build fresh context
    const context = await this.buildContext(userId, sessionId);
    
    // Cache the context
    this.contextCache.set(cacheKey, context);
    
    // Store in Redis for cross-instance sharing
    await this.storeContextInRedis(cacheKey, context);
    
    return context;
  }

  /**
   * Update context with new information
   */
  async updateContext(
    userId: string, 
    sessionId: string, 
    updates: Partial<AIContext>
  ): Promise<AIContext> {
    const cacheKey = `${userId}:${sessionId}`;
    const existing = this.contextCache.get(cacheKey);
    
    if (!existing) {
      // If no existing context, build fresh
      return await this.getContext(userId, sessionId);
    }

    // Merge updates
    const updated = {
      ...existing,
      ...updates,
      timestamp: new Date(),
      freshness: 1.0
    };

    // Update cache
    this.contextCache.set(cacheKey, updated);
    
    // Update Redis
    await this.storeContextInRedis(cacheKey, updated);
    
    return updated;
  }

  /**
   * Track user behavior for context building
   */
  async trackBehavior(userId: string, action: string, metadata: Record<string, any>) {
    const behavior = {
      action,
      timestamp: new Date(),
      metadata,
      success: metadata.success || true,
      duration: metadata.duration || 0,
      complexity: metadata.complexity || 0.5
    };

    // Add to local tracker
    if (!this.behaviorTracker.has(userId)) {
      this.behaviorTracker.set(userId, []);
    }
    
    const behaviors = this.behaviorTracker.get(userId)!;
    behaviors.push(behavior);
    
    // Keep only last 100 behaviors
    if (behaviors.length > 100) {
      behaviors.splice(0, behaviors.length - 100);
    }

    // Store in Redis for persistence
    await redisCache.set(`behavior:${userId}`, behaviors, 86400 * 7); // 7 days
    
    // Update existing context if available
    const existingContext = this.contextCache.get(userId);
    if (existingContext) {
      existingContext.behavioral.recentActions.push(behavior);
      existingContext.behavioral.recentActions = existingContext.behavioral.recentActions.slice(-20);
      existingContext.timestamp = new Date();
      existingContext.freshness = 1.0;
    }
  }

  /**
   * Get context-aware recommendations
   */
  async getRecommendations(userId: string, sessionId: string): Promise<{
    actions: Array<{ action: string; confidence: number; reasoning: string }>;
    warnings: Array<{ warning: string; severity: number; mitigation: string }>;
    opportunities: Array<{ opportunity: string; value: number; requirements: string[] }>;
  }> {
    const context = await this.getContext(userId, sessionId);
    
    const recommendations = {
      actions: this.generateActionRecommendations(context),
      warnings: this.generateWarnings(context),
      opportunities: this.generateOpportunities(context)
    };

    return recommendations;
  }

  /**
   * Predict next likely user actions
   */
  async predictNextActions(userId: string, sessionId: string): Promise<Array<{
    action: string;
    probability: number;
    timing: Date;
    context: string;
  }>> {
    const context = await this.getContext(userId, sessionId);
    
    // Analyze behavioral patterns
    const patterns = this.analyzeBehavioralPatterns(context.behavioral);
    
    // Generate predictions based on patterns
    const predictions = patterns.map(pattern => ({
      action: pattern.action,
      probability: pattern.frequency * context.confidence,
      timing: new Date(Date.now() + pattern.avgInterval * 1000),
      context: pattern.context
    }));

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Build comprehensive context
   */
  private async buildContext(userId: string, sessionId?: string): Promise<AIContext> {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get user context
      const userContext = await this.buildUserContext(userId);
      
      // Get business context
      const businessContext = await this.buildBusinessContext(userContext.organization.id);
      
      // Get temporal context
      const temporalContext = this.buildTemporalContext(userContext.organization.timezone);
      
      // Get behavioral context
      const behavioralContext = await this.buildBehavioralContext(userId);
      
      // Get environmental context
      const environmentalContext = await this.buildEnvironmentalContext();
      
      // Get conversational context
      const conversationalContext = await this.buildConversationalContext(userId, sessionId);
      
      // Generate predictive context
      const predictiveContext = await this.buildPredictiveContext(
        userContext, 
        businessContext, 
        behavioralContext
      );

      const context: AIContext = {
        id: contextId,
        userId,
        sessionId: sessionId || 'default',
        timestamp: new Date(),
        user: userContext,
        business: businessContext,
        temporal: temporalContext,
        behavioral: behavioralContext,
        environmental: environmentalContext,
        conversational: conversationalContext,
        predictive: predictiveContext,
        confidence: this.calculateContextConfidence(
          userContext, 
          businessContext, 
          behavioralContext
        ),
        freshness: 1.0
      };

      return context;

    } catch (error) {
      logger.error('Failed to build AI context', { userId, sessionId, error });
      
      // Return minimal context in case of error
      return this.buildMinimalContext(userId, sessionId);
    }
  }

  /**
   * Build user context
   */
  private async buildUserContext(userId: string): Promise<UserContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user permissions
    const permissions = await AIPermissionService.getEffectiveAIPermissions(userId, user.role);

    return {
      id: user.id,
      role: user.role,
      permissions: permissions.effective,
      organization: {
        id: user.organization?.id || '',
        name: user.organization?.name || '',
        industry: 'fintech', // Default for MarketSage
        size: 'medium',
        market: 'Nigeria',
        timezone: 'Africa/Lagos'
      },
      preferences: {
        communicationStyle: 'professional',
        riskTolerance: 'medium',
        automationLevel: 'high',
        preferredChannels: ['email', 'sms'],
        workingHours: { start: 9, end: 17 }
      },
      expertise: {
        level: 'intermediate',
        domains: ['marketing', 'automation'],
        recentLearning: []
      },
      goals: {
        shortTerm: ['improve campaign performance'],
        longTerm: ['grow customer base'],
        priorities: ['efficiency', 'growth']
      }
    };
  }

  /**
   * Build business context
   */
  private async buildBusinessContext(organizationId: string): Promise<BusinessContext> {
    const [campaigns, activities] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: { organizationId },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      // Would get activities from audit log or similar
      []
    ]);

    return {
      currentCampaigns: campaigns.map(c => ({
        id: c.id,
        type: 'email' as const,
        status: c.status,
        performance: {} // Would be populated from analytics
      })),
      recentActivities: activities,
      marketConditions: {
        competitiveness: 0.7,
        trends: ['mobile-first', 'personalization'],
        opportunities: ['ai-automation', 'cross-channel'],
        threats: ['privacy-regulations', 'market-saturation']
      },
      resources: {
        budget: 10000,
        teamSize: 5,
        techStack: ['react', 'nodejs', 'postgres'],
        limitations: ['integration-complexity']
      },
      kpis: {
        current: { revenue: 50000, customers: 1000 },
        targets: { revenue: 100000, customers: 2000 },
        trends: { revenue: 0.15, customers: 0.1 }
      }
    };
  }

  /**
   * Build temporal context
   */
  private buildTemporalContext(timezone: string): TemporalContext {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      currentTime: now,
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      dayType: [0, 6].includes(now.getDay()) ? 'weekend' : 'weekday',
      season: 'spring', // Would calculate based on date
      marketTiming: {
        optimal: hour >= 9 && hour <= 17,
        reason: hour >= 9 && hour <= 17 ? 'Business hours' : 'Outside business hours',
        nextOptimal: new Date(now.getTime() + (hour >= 17 ? 16 : 9 - hour) * 60 * 60 * 1000)
      },
      patterns: {
        userActivity: { morning: 0.3, afternoon: 0.5, evening: 0.2 },
        businessPeaks: { '9-12': 0.4, '13-17': 0.6 },
        seasonalTrends: { spring: 0.2, summer: 0.3, fall: 0.3, winter: 0.2 }
      }
    };
  }

  /**
   * Build behavioral context
   */
  private async buildBehavioralContext(userId: string): Promise<BehavioralContext> {
    const behaviors = await redisCache.get<Array<any>>(`behavior:${userId}`) || [];
    
    return {
      recentActions: behaviors.slice(-20),
      patterns: {
        frequency: this.calculateFrequencyPatterns(behaviors),
        preferences: this.calculatePreferencePatterns(behaviors),
        effectiveness: this.calculateEffectivenessPatterns(behaviors)
      },
      currentFocus: {
        area: 'campaigns',
        intensity: 0.7,
        duration: 1800 // 30 minutes
      },
      workingStyle: {
        pace: 'moderate',
        methodology: 'structured',
        collaboration: 'individual'
      },
      emotionalState: {
        mood: 'positive',
        stress: 0.3,
        confidence: 0.8,
        frustration: 0.1
      }
    };
  }

  /**
   * Build environmental context
   */
  private async buildEnvironmentalContext(): Promise<EnvironmentalContext> {
    return {
      system: {
        performance: 0.9,
        load: 0.3,
        availability: 0.99,
        maintenance: false
      },
      network: {
        latency: 50,
        bandwidth: 1000,
        reliability: 0.99
      },
      external: {
        marketHours: true,
        apiHealth: { twilio: true, paystack: true },
        serviceStatus: { email: 'healthy', sms: 'healthy' }
      },
      constraints: {
        rateLimits: { api: 1000, sms: 100 },
        quotas: { storage: 1000, bandwidth: 10000 },
        restrictions: []
      }
    };
  }

  /**
   * Build conversational context
   */
  private async buildConversationalContext(userId: string, sessionId?: string): Promise<ConversationalContext> {
    const memories = await supremeMemory.getRecentMemories(userId, 10);
    
    return {
      sessionHistory: memories.map(m => ({
        role: m.type === 'conversation' ? 'user' : 'assistant',
        content: m.content,
        timestamp: m.timestamp,
        success: true
      })),
      currentTopic: 'general',
      topicProgression: ['greeting', 'general'],
      conversationState: 'exploring',
      userIntent: {
        primary: 'assistance',
        secondary: ['automation', 'optimization'],
        confidence: 0.8
      },
      responseStyle: {
        verbosity: 'detailed',
        technicality: 'moderate',
        formality: 'professional'
      }
    };
  }

  /**
   * Build predictive context
   */
  private async buildPredictiveContext(
    user: UserContext, 
    business: BusinessContext, 
    behavioral: BehavioralContext
  ): Promise<PredictiveContext> {
    return {
      nextLikelyActions: [
        { action: 'create_campaign', probability: 0.6, timing: new Date(Date.now() + 3600000), impact: 0.8 },
        { action: 'check_analytics', probability: 0.4, timing: new Date(Date.now() + 1800000), impact: 0.5 }
      ],
      riskFactors: [
        { factor: 'budget_constraint', probability: 0.3, severity: 0.7, mitigation: 'Optimize spend' }
      ],
      opportunities: [
        { opportunity: 'automation_expansion', probability: 0.7, value: 0.9, requirements: ['integration'] }
      ],
      trends: {
        behavior: { automation: 0.8, manual: 0.2 },
        business: { growth: 0.6, retention: 0.4 },
        market: { expansion: 0.5, competition: 0.3 }
      }
    };
  }

  // Helper methods
  private isContextFresh(context: AIContext): boolean {
    const age = Date.now() - context.timestamp.getTime();
    return age < 300000 && context.freshness > 0.5; // 5 minutes and 50% freshness
  }

  private calculateContextConfidence(
    user: UserContext, 
    business: BusinessContext, 
    behavioral: BehavioralContext
  ): number {
    const userScore = user.permissions.length > 0 ? 0.8 : 0.5;
    const businessScore = business.currentCampaigns.length > 0 ? 0.9 : 0.6;
    const behaviorScore = behavioral.recentActions.length > 5 ? 0.8 : 0.4;
    
    return (userScore + businessScore + behaviorScore) / 3;
  }

  private buildMinimalContext(userId: string, sessionId?: string): AIContext {
    return {
      id: `minimal_${Date.now()}`,
      userId,
      sessionId: sessionId || 'default',
      timestamp: new Date(),
      user: {} as UserContext,
      business: {} as BusinessContext,
      temporal: {} as TemporalContext,
      behavioral: {} as BehavioralContext,
      environmental: {} as EnvironmentalContext,
      conversational: {} as ConversationalContext,
      predictive: {} as PredictiveContext,
      confidence: 0.1,
      freshness: 1.0
    };
  }

  private calculateFrequencyPatterns(behaviors: Array<any>): Record<string, number> {
    const patterns: Record<string, number> = {};
    behaviors.forEach(b => {
      patterns[b.action] = (patterns[b.action] || 0) + 1;
    });
    return patterns;
  }

  private calculatePreferencePatterns(behaviors: Array<any>): Record<string, number> {
    // Would calculate based on user choices and preferences
    return {};
  }

  private calculateEffectivenessPatterns(behaviors: Array<any>): Record<string, number> {
    // Would calculate based on success rates
    return {};
  }

  private analyzeBehavioralPatterns(behavioral: BehavioralContext): Array<any> {
    // Would analyze patterns from behavioral data
    return [];
  }

  private generateActionRecommendations(context: AIContext): Array<{
    action: string;
    confidence: number;
    reasoning: string;
  }> {
    const recommendations = [];
    
    // Based on temporal context
    if (context.temporal.marketTiming.optimal) {
      recommendations.push({
        action: 'create_campaign',
        confidence: 0.8,
        reasoning: 'Optimal timing for campaign creation during business hours'
      });
    }
    
    // Based on business context
    if (context.business.currentCampaigns.length < 3) {
      recommendations.push({
        action: 'expand_campaigns',
        confidence: 0.7,
        reasoning: 'Low campaign volume suggests opportunity for expansion'
      });
    }
    
    return recommendations;
  }

  private generateWarnings(context: AIContext): Array<{
    warning: string;
    severity: number;
    mitigation: string;
  }> {
    const warnings = [];
    
    // Check for high error rates
    if (context.behavioral.emotionalState.frustration > 0.7) {
      warnings.push({
        warning: 'High user frustration detected',
        severity: 0.8,
        mitigation: 'Provide more guidance and support'
      });
    }
    
    return warnings;
  }

  private generateOpportunities(context: AIContext): Array<{
    opportunity: string;
    value: number;
    requirements: string[];
  }> {
    const opportunities = [];
    
    // Based on user expertise
    if (context.user.expertise.level === 'advanced') {
      opportunities.push({
        opportunity: 'advanced_automation',
        value: 0.9,
        requirements: ['api_integration', 'custom_workflows']
      });
    }
    
    return opportunities;
  }

  private async storeContextInRedis(key: string, context: AIContext): Promise<void> {
    try {
      await redisCache.set(`context:${key}`, context, 1800); // 30 minutes
    } catch (error) {
      logger.warn('Failed to store context in Redis', { key, error });
    }
  }

  private startContextMonitoring(): void {
    // Update context freshness every 5 minutes
    this.contextUpdateInterval = setInterval(() => {
      this.updateContextFreshness();
    }, 300000);
  }

  private updateContextFreshness(): void {
    for (const [key, context] of this.contextCache) {
      const age = Date.now() - context.timestamp.getTime();
      const freshness = Math.max(0, 1 - age / 1800000); // Decay over 30 minutes
      context.freshness = freshness;
      
      // Remove stale contexts
      if (freshness < 0.1) {
        this.contextCache.delete(key);
      }
    }
  }

  // Cleanup
  destroy(): void {
    if (this.contextUpdateInterval) {
      clearInterval(this.contextUpdateInterval);
    }
    this.contextCache.clear();
    this.behaviorTracker.clear();
  }
}

// Export singleton instance
export const aiContextAwarenessSystem = new AIContextAwarenessEngine();
export { AIContextAwarenessEngine };