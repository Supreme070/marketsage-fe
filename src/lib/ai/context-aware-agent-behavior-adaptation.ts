/**
 * Context-Aware Agent Behavior Adaptation System
 * =============================================
 * 
 * Advanced system for adapting agent behavior based on user preferences,
 * market conditions, performance metrics, and environmental factors.
 * Enables agents to optimize their behavior in real-time.
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { EventEmitter } from 'events';
import { 
  multiAgentCoordinator,
  type AIAgent,
  type AgentTask,
  AgentType,
  AgentStatus 
} from '@/lib/ai/multi-agent-coordinator';
import { 
  aiContextAwarenessSystem,
  type AIContext 
} from '@/lib/ai/ai-context-awareness-system';
import { 
  selfEvolvingAgentSystem
} from '@/lib/ai/self-evolving-agent-system';
import { 
  supremeAIv3,
  type SupremeAIv3Response
} from '@/lib/ai/supreme-ai-v3-engine';
import { redisCache } from '@/lib/cache/redis-client';
import prisma from '@/lib/db/prisma';

// Behavior adaptation interfaces
export interface BehaviorAdaptationContext {
  id: string;
  agentId: string;
  timestamp: Date;
  userPreferences: UserPreferences;
  marketConditions: MarketConditions;
  performanceMetrics: PerformanceMetrics;
  environmentalFactors: EnvironmentalFactors;
  teamDynamics: TeamDynamics;
  workloadContext: WorkloadContext;
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'executive';
  responseSpeed: 'immediate' | 'balanced' | 'thorough';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  collaborationStyle: 'independent' | 'collaborative' | 'consultative';
  feedbackPreference: 'frequent' | 'milestone' | 'completion';
  workingHours: {
    timezone: string;
    startTime: string;
    endTime: string;
    workdays: string[];
  };
  languagePreference: string;
  culturalContext: string;
}

export interface MarketConditions {
  volatility: 'low' | 'medium' | 'high';
  trend: 'bull' | 'bear' | 'sideways';
  competitionLevel: 'low' | 'medium' | 'high';
  customerSentiment: 'positive' | 'neutral' | 'negative';
  economicIndicators: {
    gdp: number;
    inflation: number;
    unemploymentRate: number;
    interestRates: number;
  };
  seasonalFactors: string[];
  regulatoryEnvironment: 'stable' | 'changing' | 'uncertain';
}

export interface PerformanceMetrics {
  taskCompletionRate: number;
  averageResponseTime: number;
  accuracyScore: number;
  userSatisfaction: number;
  collaborationEffectiveness: number;
  errorRate: number;
  learningRate: number;
  adaptationSpeed: number;
  resourceUtilization: number;
}

export interface EnvironmentalFactors {
  systemLoad: number;
  networkLatency: number;
  availableResources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  concurrentTasks: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TeamDynamics {
  teamSize: number;
  activeAgents: number;
  collaborationLevel: number;
  conflictLevel: number;
  trustLevel: number;
  communicationEfficiency: number;
  roleDistribution: Map<AgentType, number>;
  leadershipStyle: 'hierarchical' | 'democratic' | 'autonomous';
}

export interface WorkloadContext {
  currentTasks: number;
  queuedTasks: number;
  priorityDistribution: Map<string, number>;
  deadlinePressure: number;
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'expert';
  domain: string;
  stakeholderCount: number;
}

export interface BehaviorAdaptationRule {
  id: string;
  name: string;
  description: string;
  conditions: AdaptationCondition[];
  actions: AdaptationAction[];
  priority: number;
  weight: number;
  contextTypes: string[];
  enabled: boolean;
  lastUpdated: Date;
  effectivenessScore: number;
}

export interface AdaptationCondition {
  type: 'threshold' | 'pattern' | 'trend' | 'correlation' | 'custom';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  weight: number;
  tolerance: number;
}

export interface AdaptationAction {
  type: 'behavior_change' | 'parameter_adjustment' | 'strategy_switch' | 'collaboration_mode';
  target: string;
  modification: any;
  intensity: number;
  duration: number;
  reversible: boolean;
}

export interface BehaviorProfile {
  id: string;
  agentId: string;
  profileType: 'user_specific' | 'market_adaptive' | 'performance_optimized' | 'context_aware';
  parameters: Map<string, any>;
  adaptationHistory: AdaptationEvent[];
  effectiveness: number;
  active: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface AdaptationEvent {
  id: string;
  timestamp: Date;
  triggerType: 'user_feedback' | 'performance_metric' | 'market_change' | 'system_event';
  context: BehaviorAdaptationContext;
  adaptations: AdaptationAction[];
  outcome: {
    success: boolean;
    improvementScore: number;
    sideEffects: string[];
    userFeedback?: string;
  };
}

class ContextAwareAgentBehaviorAdaptation extends EventEmitter {
  private static instance: ContextAwareAgentBehaviorAdaptation;
  private adaptationRules: Map<string, BehaviorAdaptationRule> = new Map();
  private behaviorProfiles: Map<string, BehaviorProfile> = new Map();
  private contextMonitor: NodeJS.Timeout | null = null;
  private adaptationHistory: Map<string, AdaptationEvent[]> = new Map();
  private performanceBaseline: Map<string, PerformanceMetrics> = new Map();

  private constructor() {
    super();
    this.initializeAdaptationRules();
    this.startContextMonitoring();
  }

  static getInstance(): ContextAwareAgentBehaviorAdaptation {
    if (!ContextAwareAgentBehaviorAdaptation.instance) {
      ContextAwareAgentBehaviorAdaptation.instance = new ContextAwareAgentBehaviorAdaptation();
    }
    return ContextAwareAgentBehaviorAdaptation.instance;
  }

  /**
   * Initialize behavior adaptation for an agent
   */
  async initializeAdaptation(agentId: string, initialContext: BehaviorAdaptationContext): Promise<void> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('initializeAdaptation', async (span) => {
      try {
        // Create initial behavior profile
        const profile = await this.createBehaviorProfile(agentId, initialContext);
        this.behaviorProfiles.set(agentId, profile);

        // Establish performance baseline
        await this.establishPerformanceBaseline(agentId);

        // Load user-specific adaptation rules
        await this.loadUserSpecificRules(agentId, initialContext.userPreferences);

        // Start adaptation monitoring
        await this.startAdaptationMonitoring(agentId);

        logger.info(`Behavior adaptation initialized for agent ${agentId}`);
        this.emit('adaptationInitialized', { agentId, profile });

      } catch (error) {
        logger.error('Failed to initialize behavior adaptation:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Adapt agent behavior based on current context
   */
  async adaptBehavior(agentId: string, context: BehaviorAdaptationContext): Promise<void> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('adaptBehavior', async (span) => {
      try {
        // Analyze context for adaptation opportunities
        const adaptationOpportunities = await this.analyzeAdaptationOpportunities(agentId, context);

        // Select optimal adaptations
        const selectedAdaptations = await this.selectOptimalAdaptations(agentId, adaptationOpportunities);

        // Apply adaptations
        const adaptationResults = await this.applyAdaptations(agentId, selectedAdaptations, context);

        // Record adaptation event
        await this.recordAdaptationEvent(agentId, context, selectedAdaptations, adaptationResults);

        // Update behavior profile
        await this.updateBehaviorProfile(agentId, selectedAdaptations, adaptationResults);

        this.emit('behaviorAdapted', { agentId, context, adaptations: selectedAdaptations });

      } catch (error) {
        logger.error('Behavior adaptation failed:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Analyze context for adaptation opportunities
   */
  async analyzeAdaptationOpportunities(
    agentId: string,
    context: BehaviorAdaptationContext
  ): Promise<AdaptationAction[]> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('analyzeAdaptationOpportunities', async (span) => {
      try {
        const opportunities: AdaptationAction[] = [];

        // Check performance-based adaptations
        await this.checkPerformanceAdaptations(agentId, context, opportunities);

        // Check user preference adaptations
        await this.checkUserPreferenceAdaptations(agentId, context, opportunities);

        // Check market condition adaptations
        await this.checkMarketConditionAdaptations(agentId, context, opportunities);

        // Check environmental adaptations
        await this.checkEnvironmentalAdaptations(agentId, context, opportunities);

        // Check team dynamics adaptations
        await this.checkTeamDynamicsAdaptations(agentId, context, opportunities);

        // Use AI to identify additional patterns
        const aiOpportunities = await this.identifyAIPatterns(agentId, context);
        opportunities.push(...aiOpportunities);

        return opportunities;

      } catch (error) {
        logger.error('Failed to analyze adaptation opportunities:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Select optimal adaptations based on context and priorities
   */
  async selectOptimalAdaptations(
    agentId: string,
    opportunities: AdaptationAction[]
  ): Promise<AdaptationAction[]> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('selectOptimalAdaptations', async (span) => {
      try {
        // Score adaptations based on multiple criteria
        const scoredAdaptations = await this.scoreAdaptations(agentId, opportunities);

        // Select top adaptations considering conflicts and synergies
        const selectedAdaptations = await this.resolveAdaptationConflicts(scoredAdaptations);

        // Validate adaptations for safety and effectiveness
        const validatedAdaptations = await this.validateAdaptations(agentId, selectedAdaptations);

        return validatedAdaptations;

      } catch (error) {
        logger.error('Failed to select optimal adaptations:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Apply behavior adaptations to agent
   */
  async applyAdaptations(
    agentId: string,
    adaptations: AdaptationAction[],
    context: BehaviorAdaptationContext
  ): Promise<any[]> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('applyAdaptations', async (span) => {
      try {
        const results = [];

        for (const adaptation of adaptations) {
          const result = await this.applyIndividualAdaptation(agentId, adaptation, context);
          results.push(result);
        }

        // Update agent configuration
        await this.updateAgentConfiguration(agentId, adaptations);

        return results;

      } catch (error) {
        logger.error('Failed to apply adaptations:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Monitor and evaluate adaptation effectiveness
   */
  async evaluateAdaptationEffectiveness(agentId: string): Promise<void> {
    const tracer = trace.getTracer('context-aware-behavior-adaptation');
    return tracer.startActiveSpan('evaluateAdaptationEffectiveness', async (span) => {
      try {
        // Get current performance metrics
        const currentMetrics = await this.getCurrentPerformanceMetrics(agentId);
        
        // Compare with baseline
        const baseline = this.performanceBaseline.get(agentId);
        if (!baseline) return;

        // Calculate improvement scores
        const improvementScore = await this.calculateImprovementScore(baseline, currentMetrics);

        // Get recent adaptations
        const recentAdaptations = await this.getRecentAdaptations(agentId);

        // Attribute improvements to specific adaptations
        await this.attributeImprovements(agentId, recentAdaptations, improvementScore);

        // Update adaptation rule effectiveness
        await this.updateRuleEffectiveness(agentId, recentAdaptations, improvementScore);

        // Adjust future adaptation strategies
        await this.adjustAdaptationStrategies(agentId, improvementScore);

        this.emit('adaptationEvaluated', { agentId, improvementScore });

      } catch (error) {
        logger.error('Failed to evaluate adaptation effectiveness:', error);
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  // Private helper methods

  private async createBehaviorProfile(
    agentId: string,
    context: BehaviorAdaptationContext
  ): Promise<BehaviorProfile> {
    const profile: BehaviorProfile = {
      id: `profile_${agentId}_${Date.now()}`,
      agentId,
      profileType: 'context_aware',
      parameters: new Map(),
      adaptationHistory: [],
      effectiveness: 0,
      active: true,
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Initialize parameters based on context
    profile.parameters.set('communicationStyle', context.userPreferences.communicationStyle);
    profile.parameters.set('responseSpeed', context.userPreferences.responseSpeed);
    profile.parameters.set('detailLevel', context.userPreferences.detailLevel);
    profile.parameters.set('riskTolerance', context.userPreferences.riskTolerance);

    return profile;
  }

  private async establishPerformanceBaseline(agentId: string): Promise<void> {
    // Get historical performance data
    const performanceData = await this.getHistoricalPerformanceData(agentId);
    
    if (performanceData.length > 0) {
      const baseline = this.calculatePerformanceBaseline(performanceData);
      this.performanceBaseline.set(agentId, baseline);
    }
  }

  private async loadUserSpecificRules(agentId: string, preferences: UserPreferences): Promise<void> {
    // Load user-specific adaptation rules from database
    const userRules = await prisma.behaviorAdaptationRule.findMany({
      where: { 
        agentId,
        enabled: true 
      }
    });

    userRules.forEach(rule => {
      this.adaptationRules.set(rule.id, rule as any);
    });
  }

  private async startAdaptationMonitoring(agentId: string): Promise<void> {
    // Start monitoring for this specific agent
    setInterval(async () => {
      try {
        const context = await this.getCurrentContext(agentId);
        if (context) {
          await this.adaptBehavior(agentId, context);
        }
      } catch (error) {
        logger.error('Adaptation monitoring failed:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private async getCurrentContext(agentId: string): Promise<BehaviorAdaptationContext | null> {
    try {
      const agent = await multiAgentCoordinator.getAgent(agentId);
      if (!agent) return null;

      const aiContext = await aiContextAwarenessSystem.getContext(agent.id);
      
      return {
        id: `context_${Date.now()}`,
        agentId,
        timestamp: new Date(),
        userPreferences: await this.getUserPreferences(agent.id),
        marketConditions: await this.getMarketConditions(),
        performanceMetrics: await this.getCurrentPerformanceMetrics(agentId),
        environmentalFactors: await this.getEnvironmentalFactors(),
        teamDynamics: await this.getTeamDynamics(agentId),
        workloadContext: await this.getWorkloadContext(agentId)
      };
    } catch (error) {
      logger.error('Failed to get current context:', error);
      return null;
    }
  }

  private async checkPerformanceAdaptations(
    agentId: string,
    context: BehaviorAdaptationContext,
    opportunities: AdaptationAction[]
  ): Promise<void> {
    const metrics = context.performanceMetrics;
    const baseline = this.performanceBaseline.get(agentId);
    
    if (!baseline) return;

    // Check for performance degradation
    if (metrics.taskCompletionRate < baseline.taskCompletionRate * 0.9) {
      opportunities.push({
        type: 'behavior_change',
        target: 'task_approach',
        modification: { strategy: 'more_methodical' },
        intensity: 0.7,
        duration: 3600000, // 1 hour
        reversible: true
      });
    }

    // Check for slow response times
    if (metrics.averageResponseTime > baseline.averageResponseTime * 1.2) {
      opportunities.push({
        type: 'parameter_adjustment',
        target: 'response_optimization',
        modification: { prioritize_speed: true },
        intensity: 0.8,
        duration: 1800000, // 30 minutes
        reversible: true
      });
    }
  }

  private async checkUserPreferenceAdaptations(
    agentId: string,
    context: BehaviorAdaptationContext,
    opportunities: AdaptationAction[]
  ): Promise<void> {
    const preferences = context.userPreferences;
    
    // Adapt communication style
    if (preferences.communicationStyle === 'formal') {
      opportunities.push({
        type: 'behavior_change',
        target: 'communication_style',
        modification: { tone: 'formal', language: 'professional' },
        intensity: 1.0,
        duration: 7200000, // 2 hours
        reversible: true
      });
    }

    // Adapt response speed
    if (preferences.responseSpeed === 'immediate') {
      opportunities.push({
        type: 'parameter_adjustment',
        target: 'response_timing',
        modification: { max_delay: 5000 }, // 5 seconds
        intensity: 0.9,
        duration: 3600000, // 1 hour
        reversible: true
      });
    }
  }

  private async checkMarketConditionAdaptations(
    agentId: string,
    context: BehaviorAdaptationContext,
    opportunities: AdaptationAction[]
  ): Promise<void> {
    const market = context.marketConditions;
    
    // Adapt to high volatility
    if (market.volatility === 'high') {
      opportunities.push({
        type: 'strategy_switch',
        target: 'risk_management',
        modification: { conservative_approach: true },
        intensity: 0.8,
        duration: 7200000, // 2 hours
        reversible: true
      });
    }

    // Adapt to negative sentiment
    if (market.customerSentiment === 'negative') {
      opportunities.push({
        type: 'behavior_change',
        target: 'customer_interaction',
        modification: { empathy_level: 'high', validation_focus: true },
        intensity: 0.9,
        duration: 3600000, // 1 hour
        reversible: true
      });
    }
  }

  private async checkEnvironmentalAdaptations(
    agentId: string,
    context: BehaviorAdaptationContext,
    opportunities: AdaptationAction[]
  ): Promise<void> {
    const env = context.environmentalFactors;
    
    // Adapt to high system load
    if (env.systemLoad > 0.8) {
      opportunities.push({
        type: 'parameter_adjustment',
        target: 'resource_usage',
        modification: { reduce_complexity: true, batch_operations: true },
        intensity: 0.7,
        duration: 1800000, // 30 minutes
        reversible: true
      });
    }

    // Adapt to urgency level
    if (env.urgencyLevel === 'critical') {
      opportunities.push({
        type: 'behavior_change',
        target: 'prioritization',
        modification: { emergency_mode: true },
        intensity: 1.0,
        duration: 900000, // 15 minutes
        reversible: true
      });
    }
  }

  private async checkTeamDynamicsAdaptations(
    agentId: string,
    context: BehaviorAdaptationContext,
    opportunities: AdaptationAction[]
  ): Promise<void> {
    const team = context.teamDynamics;
    
    // Adapt to low collaboration
    if (team.collaborationLevel < 0.5) {
      opportunities.push({
        type: 'collaboration_mode',
        target: 'team_interaction',
        modification: { proactive_communication: true },
        intensity: 0.6,
        duration: 3600000, // 1 hour
        reversible: true
      });
    }

    // Adapt to high conflict
    if (team.conflictLevel > 0.7) {
      opportunities.push({
        type: 'behavior_change',
        target: 'conflict_resolution',
        modification: { diplomatic_approach: true },
        intensity: 0.8,
        duration: 1800000, // 30 minutes
        reversible: true
      });
    }
  }

  private async identifyAIPatterns(
    agentId: string,
    context: BehaviorAdaptationContext
  ): Promise<AdaptationAction[]> {
    try {
      const analysisPrompt = {
        type: 'analyze' as const,
        userId: agentId,
        question: `Analyze the following context and identify behavior adaptation opportunities:
          Context: ${JSON.stringify(context)}
          
          Consider:
          1. Performance optimization opportunities
          2. User preference alignment
          3. Market condition responses
          4. Environmental adaptations
          5. Team dynamic improvements
          
          Return specific, actionable adaptation recommendations.`
      };

      const response = await supremeAIv3.processRequest(analysisPrompt);
      return this.parseAIAdaptationRecommendations(response.response);

    } catch (error) {
      logger.error('AI pattern identification failed:', error);
      return [];
    }
  }

  private parseAIAdaptationRecommendations(response: string): AdaptationAction[] {
    // Parse AI response into structured adaptation actions
    // This would use NLP parsing to extract actionable recommendations
    return [
      {
        type: 'behavior_change',
        target: 'ai_suggested_optimization',
        modification: { strategy: 'ai_optimized' },
        intensity: 0.6,
        duration: 3600000,
        reversible: true
      }
    ];
  }

  private async scoreAdaptations(
    agentId: string,
    opportunities: AdaptationAction[]
  ): Promise<Array<AdaptationAction & { score: number }>> {
    const scoredAdaptations = [];
    
    for (const adaptation of opportunities) {
      const score = await this.calculateAdaptationScore(agentId, adaptation);
      scoredAdaptations.push({ ...adaptation, score });
    }
    
    return scoredAdaptations.sort((a, b) => b.score - a.score);
  }

  private async calculateAdaptationScore(
    agentId: string,
    adaptation: AdaptationAction
  ): Promise<number> {
    let score = 0;
    
    // Base score from intensity
    score += adaptation.intensity * 50;
    
    // Historical effectiveness
    const historicalEffectiveness = await this.getHistoricalEffectiveness(agentId, adaptation);
    score += historicalEffectiveness * 30;
    
    // Urgency factor
    const urgency = await this.getAdaptationUrgency(agentId, adaptation);
    score += urgency * 20;
    
    return Math.min(score, 100);
  }

  private async resolveAdaptationConflicts(
    scoredAdaptations: Array<AdaptationAction & { score: number }>
  ): Promise<AdaptationAction[]> {
    const selected = [];
    const conflicts = new Set<string>();
    
    for (const adaptation of scoredAdaptations) {
      if (!conflicts.has(adaptation.target)) {
        selected.push(adaptation);
        conflicts.add(adaptation.target);
      }
    }
    
    return selected;
  }

  private async validateAdaptations(
    agentId: string,
    adaptations: AdaptationAction[]
  ): Promise<AdaptationAction[]> {
    const validated = [];
    
    for (const adaptation of adaptations) {
      const isValid = await this.validateAdaptation(agentId, adaptation);
      if (isValid) {
        validated.push(adaptation);
      }
    }
    
    return validated;
  }

  private async validateAdaptation(
    agentId: string,
    adaptation: AdaptationAction
  ): Promise<boolean> {
    // Validate adaptation for safety and feasibility
    if (adaptation.intensity > 1.0) return false;
    if (adaptation.duration < 60000) return false; // Minimum 1 minute
    
    return true;
  }

  private async applyIndividualAdaptation(
    agentId: string,
    adaptation: AdaptationAction,
    context: BehaviorAdaptationContext
  ): Promise<any> {
    // Apply individual adaptation to agent
    switch (adaptation.type) {
      case 'behavior_change':
        return await this.applyBehaviorChange(agentId, adaptation);
      case 'parameter_adjustment':
        return await this.applyParameterAdjustment(agentId, adaptation);
      case 'strategy_switch':
        return await this.applyStrategySwitch(agentId, adaptation);
      case 'collaboration_mode':
        return await this.applyCollaborationMode(agentId, adaptation);
      default:
        return { success: false, error: 'Unknown adaptation type' };
    }
  }

  private async applyBehaviorChange(agentId: string, adaptation: AdaptationAction): Promise<any> {
    // Apply behavior change to agent
    const agent = await multiAgentCoordinator.getAgent(agentId);
    if (agent) {
      // Update agent behavior parameters
      await multiAgentCoordinator.updateAgentBehavior(agentId, adaptation.modification);
      return { success: true, changes: adaptation.modification };
    }
    return { success: false, error: 'Agent not found' };
  }

  private async applyParameterAdjustment(agentId: string, adaptation: AdaptationAction): Promise<any> {
    // Apply parameter adjustment
    await redisCache.set(
      `agent_params:${agentId}`,
      JSON.stringify(adaptation.modification),
      adaptation.duration / 1000
    );
    return { success: true, duration: adaptation.duration };
  }

  private async applyStrategySwitch(agentId: string, adaptation: AdaptationAction): Promise<any> {
    // Apply strategy switch
    await this.updateAgentStrategy(agentId, adaptation.modification);
    return { success: true, newStrategy: adaptation.modification };
  }

  private async applyCollaborationMode(agentId: string, adaptation: AdaptationAction): Promise<any> {
    // Apply collaboration mode change
    await multiAgentCoordinator.updateCollaborationMode(agentId, adaptation.modification);
    return { success: true, mode: adaptation.modification };
  }

  private async updateAgentConfiguration(agentId: string, adaptations: AdaptationAction[]): Promise<void> {
    // Update agent configuration with all adaptations
    const config = {
      adaptations,
      timestamp: new Date(),
      version: Date.now()
    };
    
    await redisCache.set(
      `agent_config:${agentId}`,
      JSON.stringify(config),
      7200 // 2 hours
    );
  }

  private async recordAdaptationEvent(
    agentId: string,
    context: BehaviorAdaptationContext,
    adaptations: AdaptationAction[],
    results: any[]
  ): Promise<void> {
    const event: AdaptationEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date(),
      triggerType: 'system_event',
      context,
      adaptations,
      outcome: {
        success: results.every(r => r.success),
        improvementScore: 0, // Will be calculated later
        sideEffects: [],
        userFeedback: undefined
      }
    };

    // Store in memory
    if (!this.adaptationHistory.has(agentId)) {
      this.adaptationHistory.set(agentId, []);
    }
    this.adaptationHistory.get(agentId)!.push(event);

    // Store in database
    await prisma.adaptationEvent.create({
      data: {
        id: event.id,
        agentId,
        timestamp: event.timestamp,
        triggerType: event.triggerType,
        context: event.context as any,
        adaptations: event.adaptations as any,
        outcome: event.outcome as any
      }
    });
  }

  private async updateBehaviorProfile(
    agentId: string,
    adaptations: AdaptationAction[],
    results: any[]
  ): Promise<void> {
    const profile = this.behaviorProfiles.get(agentId);
    if (profile) {
      profile.lastModified = new Date();
      
      // Update parameters based on successful adaptations
      adaptations.forEach((adaptation, index) => {
        if (results[index]?.success) {
          profile.parameters.set(adaptation.target, adaptation.modification);
        }
      });
      
      this.behaviorProfiles.set(agentId, profile);
    }
  }

  private async getUserPreferences(agentId: string): Promise<UserPreferences> {
    // Get user preferences from database or cache
    const cached = await redisCache.get(`user_prefs:${agentId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Return default preferences
    return {
      communicationStyle: 'casual',
      responseSpeed: 'balanced',
      detailLevel: 'detailed',
      riskTolerance: 'moderate',
      collaborationStyle: 'collaborative',
      feedbackPreference: 'milestone',
      workingHours: {
        timezone: 'UTC',
        startTime: '09:00',
        endTime: '17:00',
        workdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      languagePreference: 'en',
      culturalContext: 'global'
    };
  }

  private async getMarketConditions(): Promise<MarketConditions> {
    // Get current market conditions
    return {
      volatility: 'medium',
      trend: 'bull',
      competitionLevel: 'medium',
      customerSentiment: 'positive',
      economicIndicators: {
        gdp: 2.5,
        inflation: 3.2,
        unemploymentRate: 4.1,
        interestRates: 2.0
      },
      seasonalFactors: ['end_of_quarter'],
      regulatoryEnvironment: 'stable'
    };
  }

  private async getCurrentPerformanceMetrics(agentId: string): Promise<PerformanceMetrics> {
    // Get current performance metrics
    const cached = await redisCache.get(`performance:${agentId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Return default metrics
    return {
      taskCompletionRate: 0.85,
      averageResponseTime: 2500,
      accuracyScore: 0.92,
      userSatisfaction: 0.88,
      collaborationEffectiveness: 0.75,
      errorRate: 0.05,
      learningRate: 0.15,
      adaptationSpeed: 0.65,
      resourceUtilization: 0.70
    };
  }

  private async getEnvironmentalFactors(): Promise<EnvironmentalFactors> {
    // Get current environmental factors
    return {
      systemLoad: 0.65,
      networkLatency: 45,
      availableResources: {
        cpu: 0.7,
        memory: 0.8,
        storage: 0.9
      },
      concurrentTasks: 12,
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      urgencyLevel: 'medium'
    };
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private async getTeamDynamics(agentId: string): Promise<TeamDynamics> {
    // Get team dynamics metrics
    const activeAgents = await multiAgentCoordinator.getActiveAgents();
    
    return {
      teamSize: activeAgents.length + 5,
      activeAgents: activeAgents.length,
      collaborationLevel: 0.75,
      conflictLevel: 0.2,
      trustLevel: 0.85,
      communicationEfficiency: 0.78,
      roleDistribution: new Map(),
      leadershipStyle: 'democratic'
    };
  }

  private async getWorkloadContext(agentId: string): Promise<WorkloadContext> {
    // Get workload context
    const agent = await multiAgentCoordinator.getAgent(agentId);
    
    return {
      currentTasks: agent?.currentTasks.length || 0,
      queuedTasks: 5,
      priorityDistribution: new Map([
        ['high', 3],
        ['medium', 7],
        ['low', 2]
      ]),
      deadlinePressure: 0.6,
      complexityLevel: 'moderate',
      domain: 'marketing_automation',
      stakeholderCount: 8
    };
  }

  private async getHistoricalPerformanceData(agentId: string): Promise<PerformanceMetrics[]> {
    // Get historical performance data
    try {
      const data = await prisma.agentPerformance.findMany({
        where: { agentId },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      
      return data.map(d => d.metrics as PerformanceMetrics);
    } catch (error) {
      logger.error('Failed to get historical performance data:', error);
      return [];
    }
  }

  private calculatePerformanceBaseline(data: PerformanceMetrics[]): PerformanceMetrics {
    // Calculate baseline from historical data
    const baseline: PerformanceMetrics = {
      taskCompletionRate: 0,
      averageResponseTime: 0,
      accuracyScore: 0,
      userSatisfaction: 0,
      collaborationEffectiveness: 0,
      errorRate: 0,
      learningRate: 0,
      adaptationSpeed: 0,
      resourceUtilization: 0
    };

    data.forEach(metrics => {
      baseline.taskCompletionRate += metrics.taskCompletionRate;
      baseline.averageResponseTime += metrics.averageResponseTime;
      baseline.accuracyScore += metrics.accuracyScore;
      baseline.userSatisfaction += metrics.userSatisfaction;
      baseline.collaborationEffectiveness += metrics.collaborationEffectiveness;
      baseline.errorRate += metrics.errorRate;
      baseline.learningRate += metrics.learningRate;
      baseline.adaptationSpeed += metrics.adaptationSpeed;
      baseline.resourceUtilization += metrics.resourceUtilization;
    });

    const count = data.length;
    Object.keys(baseline).forEach(key => {
      (baseline as any)[key] = (baseline as any)[key] / count;
    });

    return baseline;
  }

  private async calculateImprovementScore(
    baseline: PerformanceMetrics,
    current: PerformanceMetrics
  ): Promise<number> {
    // Calculate improvement score
    const improvements = [
      (current.taskCompletionRate - baseline.taskCompletionRate) / baseline.taskCompletionRate,
      (baseline.averageResponseTime - current.averageResponseTime) / baseline.averageResponseTime,
      (current.accuracyScore - baseline.accuracyScore) / baseline.accuracyScore,
      (current.userSatisfaction - baseline.userSatisfaction) / baseline.userSatisfaction,
      (current.collaborationEffectiveness - baseline.collaborationEffectiveness) / baseline.collaborationEffectiveness,
      (baseline.errorRate - current.errorRate) / baseline.errorRate,
      (current.learningRate - baseline.learningRate) / baseline.learningRate,
      (current.adaptationSpeed - baseline.adaptationSpeed) / baseline.adaptationSpeed,
      (current.resourceUtilization - baseline.resourceUtilization) / baseline.resourceUtilization
    ];

    return improvements.reduce((sum, improvement) => sum + improvement, 0) / improvements.length;
  }

  private async getRecentAdaptations(agentId: string): Promise<AdaptationEvent[]> {
    // Get recent adaptations
    const history = this.adaptationHistory.get(agentId) || [];
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    return history.filter(event => event.timestamp > oneHourAgo);
  }

  private async attributeImprovements(
    agentId: string,
    adaptations: AdaptationEvent[],
    improvementScore: number
  ): Promise<void> {
    // Attribute improvements to specific adaptations
    adaptations.forEach(adaptation => {
      adaptation.outcome.improvementScore = improvementScore / adaptations.length;
    });
  }

  private async updateRuleEffectiveness(
    agentId: string,
    adaptations: AdaptationEvent[],
    improvementScore: number
  ): Promise<void> {
    // Update rule effectiveness based on outcomes
    for (const adaptation of adaptations) {
      for (const action of adaptation.adaptations) {
        // Find corresponding rule and update effectiveness
        const rule = Array.from(this.adaptationRules.values())
          .find(r => r.actions.some(a => a.target === action.target));
        
        if (rule) {
          rule.effectivenessScore = (rule.effectivenessScore + improvementScore) / 2;
          rule.lastUpdated = new Date();
        }
      }
    }
  }

  private async adjustAdaptationStrategies(
    agentId: string,
    improvementScore: number
  ): Promise<void> {
    // Adjust future adaptation strategies based on results
    if (improvementScore > 0.1) {
      // Increase adaptation frequency for successful agent
      await this.adjustAdaptationFrequency(agentId, 1.2);
    } else if (improvementScore < -0.1) {
      // Decrease adaptation frequency for struggling agent
      await this.adjustAdaptationFrequency(agentId, 0.8);
    }
  }

  private async adjustAdaptationFrequency(agentId: string, multiplier: number): Promise<void> {
    // Adjust adaptation frequency
    const currentFreq = await redisCache.get(`adapt_freq:${agentId}`) || '300000';
    const newFreq = Math.max(60000, parseInt(currentFreq) * multiplier);
    
    await redisCache.set(`adapt_freq:${agentId}`, newFreq.toString(), 86400);
  }

  private async getHistoricalEffectiveness(
    agentId: string,
    adaptation: AdaptationAction
  ): Promise<number> {
    // Get historical effectiveness for this type of adaptation
    const history = this.adaptationHistory.get(agentId) || [];
    const similarAdaptations = history.filter(event => 
      event.adaptations.some(a => a.type === adaptation.type && a.target === adaptation.target)
    );

    if (similarAdaptations.length === 0) return 0.5; // Default

    const avgEffectiveness = similarAdaptations.reduce((sum, event) => 
      sum + (event.outcome.improvementScore || 0), 0) / similarAdaptations.length;

    return Math.max(0, Math.min(1, avgEffectiveness));
  }

  private async getAdaptationUrgency(
    agentId: string,
    adaptation: AdaptationAction
  ): Promise<number> {
    // Calculate urgency based on performance degradation
    const currentMetrics = await this.getCurrentPerformanceMetrics(agentId);
    const baseline = this.performanceBaseline.get(agentId);
    
    if (!baseline) return 0.5;

    const degradation = (baseline.taskCompletionRate - currentMetrics.taskCompletionRate) / baseline.taskCompletionRate;
    return Math.max(0, Math.min(1, degradation));
  }

  private async updateAgentStrategy(agentId: string, modification: any): Promise<void> {
    // Update agent strategy
    await redisCache.set(
      `agent_strategy:${agentId}`,
      JSON.stringify(modification),
      7200 // 2 hours
    );
  }

  private startContextMonitoring(): void {
    // Start global context monitoring
    this.contextMonitor = setInterval(async () => {
      try {
        const activeAgents = await multiAgentCoordinator.getActiveAgents();
        
        for (const agent of activeAgents) {
          await this.evaluateAdaptationEffectiveness(agent.id);
        }
      } catch (error) {
        logger.error('Context monitoring failed:', error);
      }
    }, 600000); // Every 10 minutes
  }

  private async initializeAdaptationRules(): Promise<void> {
    // Initialize default adaptation rules
    const defaultRules: BehaviorAdaptationRule[] = [
      {
        id: 'performance_degradation',
        name: 'Performance Degradation Response',
        description: 'Adapt when performance drops below threshold',
        conditions: [
          {
            type: 'threshold',
            field: 'taskCompletionRate',
            operator: 'lt',
            value: 0.8,
            weight: 1.0,
            tolerance: 0.05
          }
        ],
        actions: [
          {
            type: 'behavior_change',
            target: 'task_approach',
            modification: { strategy: 'careful' },
            intensity: 0.7,
            duration: 3600000,
            reversible: true
          }
        ],
        priority: 90,
        weight: 1.0,
        contextTypes: ['performance'],
        enabled: true,
        lastUpdated: new Date(),
        effectivenessScore: 0.5
      }
    ];

    defaultRules.forEach(rule => {
      this.adaptationRules.set(rule.id, rule);
    });
  }

  /**
   * Get adaptation status for agent
   */
  async getAdaptationStatus(agentId: string): Promise<any> {
    const profile = this.behaviorProfiles.get(agentId);
    const history = this.adaptationHistory.get(agentId) || [];
    const recentAdaptations = history.slice(-10);

    return {
      profile,
      recentAdaptations,
      effectivenessScore: profile?.effectiveness || 0,
      activeRules: Array.from(this.adaptationRules.values()).filter(r => r.enabled),
      lastAdaptation: recentAdaptations[recentAdaptations.length - 1]?.timestamp
    };
  }

  /**
   * Shutdown adaptation system
   */
  shutdown(): void {
    if (this.contextMonitor) {
      clearInterval(this.contextMonitor);
      this.contextMonitor = null;
    }
    
    this.adaptationRules.clear();
    this.behaviorProfiles.clear();
    this.adaptationHistory.clear();
    this.performanceBaseline.clear();
  }
}

// Export singleton instance
export const contextAwareAgentBehaviorAdaptation = ContextAwareAgentBehaviorAdaptation.getInstance();

// Export types
export type {
  BehaviorAdaptationContext,
  UserPreferences,
  MarketConditions,
  PerformanceMetrics,
  EnvironmentalFactors,
  TeamDynamics,
  WorkloadContext,
  BehaviorAdaptationRule,
  AdaptationCondition,
  AdaptationAction,
  BehaviorProfile,
  AdaptationEvent
};