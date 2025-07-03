/**
 * AI Governance Layer
 * ==================
 * 
 * Comprehensive governance system for controlling AI decision-making and action execution.
 * Provides multiple operation modes from full human oversight to complete autonomy.
 * 
 * Key Features:
 * - Multiple governance modes (Queue, Semi-Autonomous, Autonomous)
 * - Risk-based decision routing
 * - Human approval workflows
 * - AI trust scoring and validation
 * - Compliance and audit trails
 * - Escalation and override mechanisms
 * 
 * Based on user's blueprint: Build AI Governance Layer (Queue vs Autonomous Modes)
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getCustomerEventBus } from '@/lib/events/event-bus';
import { 
  type ActionPlan, 
  ActionStatus, 
  type RiskLevel,
  ExecutionMode 
} from '@/lib/actions/action-plan-interface';

export type GovernanceMode = 'queue' | 'semi_autonomous' | 'autonomous' | 'emergency_stop';

export type DecisionConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface GovernanceConfig {
  organizationId: string;
  mode: GovernanceMode;
  riskThresholds: {
    lowRisk: RiskLevel[];
    mediumRisk: RiskLevel[];
    highRisk: RiskLevel[];
  };
  autoApprovalLimits: {
    maxActions: number;
    maxValue: number; // For monetary actions
    timeWindow: number; // Minutes
  };
  requiresApproval: {
    actionTypes: string[];
    riskLevels: RiskLevel[];
    valueThreshold: number;
    customerSegments: string[];
  };
  escalationRules: {
    timeouts: {
      lowPriority: number; // Minutes
      mediumPriority: number;
      highPriority: number;
    };
    escalationChain: string[]; // User IDs
  };
  trustedAI: {
    enabled: boolean;
    confidenceThreshold: number;
    modelVersions: string[];
  };
  complianceSettings: {
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionPeriod: number; // Days
    requireJustification: boolean;
  };
}

export interface GovernanceDecision {
  id: string;
  actionPlanId: string;
  organizationId: string;
  contactId: string;
  decisionType: 'approve' | 'reject' | 'escalate' | 'defer' | 'auto_approve';
  riskLevel: RiskLevel;
  confidenceLevel: DecisionConfidenceLevel;
  reasoning: string;
  aiRecommendation: 'approve' | 'reject' | 'review';
  humanDecision?: 'approve' | 'reject' | 'modify';
  decisionMaker: 'ai' | 'human' | 'system';
  decisionMakerId?: string;
  justification?: string;
  metadata: {
    actionSummary: string;
    expectedImpact: string;
    riskFactors: string[];
    mitigations: string[];
    estimatedValue?: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
  createdAt: Date;
  decidedAt?: Date;
  expiresAt: Date;
}

export interface GovernanceMetrics {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  actionCounts: {
    total: number;
    autoApproved: number;
    humanApproved: number;
    rejected: number;
    escalated: number;
    expired: number;
  };
  averageDecisionTime: number; // Minutes
  riskDistribution: Record<RiskLevel, number>;
  accuracyMetrics: {
    aiRecommendationAccuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
  complianceScore: number;
}

/**
 * AI Governance Layer Class
 */
export class AIGovernanceLayer {
  private config: Map<string, GovernanceConfig> = new Map();
  private readonly defaultConfig: Omit<GovernanceConfig, 'organizationId'> = {
    mode: 'queue', // Start conservatively
    riskThresholds: {
      lowRisk: ['low'],
      mediumRisk: ['medium'],
      highRisk: ['high', 'critical']
    },
    autoApprovalLimits: {
      maxActions: 5,
      maxValue: 100,
      timeWindow: 60
    },
    requiresApproval: {
      actionTypes: ['SEND_EMAIL', 'CREATE_TASK', 'UPDATE_SEGMENT'],
      riskLevels: ['medium', 'high', 'critical'],
      valueThreshold: 50,
      customerSegments: ['high_value', 'at_risk']
    },
    escalationRules: {
      timeouts: {
        lowPriority: 240,    // 4 hours
        mediumPriority: 60,  // 1 hour
        highPriority: 15     // 15 minutes
      },
      escalationChain: []
    },
    trustedAI: {
      enabled: false, // Start with human oversight
      confidenceThreshold: 0.9,
      modelVersions: ['supreme-ai-v3']
    },
    complianceSettings: {
      auditLevel: 'detailed',
      retentionPeriod: 365,
      requireJustification: true
    }
  };

  constructor() {
    this.initializeGovernance();
  }

  /**
   * Evaluate an action plan for governance approval
   */
  async evaluateActionPlan(actionPlan: ActionPlan): Promise<GovernanceDecision> {
    try {
      logger.info('Evaluating action plan for governance', {
        actionPlanId: actionPlan.id,
        organizationId: actionPlan.organizationId,
        riskLevel: actionPlan.riskLevel
      });

      const config = await this.getGovernanceConfig(actionPlan.organizationId);
      
      // Calculate decision metrics
      const riskLevel = this.assessRiskLevel(actionPlan, config);
      const confidenceLevel = this.calculateConfidenceLevel(actionPlan);
      const aiRecommendation = this.generateAIRecommendation(actionPlan, config);
      
      // Determine if human approval is required
      const requiresHumanApproval = this.requiresHumanApproval(actionPlan, config, riskLevel);
      
      let decisionType: GovernanceDecision['decisionType'];
      let status: GovernanceDecision['status'];
      
      if (config.mode === 'emergency_stop') {
        decisionType = 'reject';
        status = 'rejected';
      } else if (config.mode === 'autonomous' && !requiresHumanApproval && aiRecommendation === 'approve') {
        decisionType = 'auto_approve';
        status = 'approved';
      } else if (requiresHumanApproval || config.mode === 'queue') {
        decisionType = 'defer';
        status = 'pending';
      } else {
        decisionType = 'escalate';
        status = 'escalated';
      }

      // Generate comprehensive reasoning
      const reasoning = this.generateDecisionReasoning(
        actionPlan, 
        config, 
        riskLevel, 
        confidenceLevel, 
        aiRecommendation
      );

      // Calculate expiration time
      const priority = this.determinePriority(riskLevel);
      const expiresAt = new Date(Date.now() + config.escalationRules.timeouts[priority] * 60 * 1000);

      const decision: GovernanceDecision = {
        id: `gov_dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionPlanId: actionPlan.id,
        organizationId: actionPlan.organizationId,
        contactId: actionPlan.contactId,
        decisionType,
        riskLevel,
        confidenceLevel,
        reasoning,
        aiRecommendation,
        decisionMaker: decisionType === 'auto_approve' ? 'ai' : 'system',
        metadata: {
          actionSummary: this.generateActionSummary(actionPlan),
          expectedImpact: this.estimateImpact(actionPlan),
          riskFactors: this.identifyRiskFactors(actionPlan),
          mitigations: this.suggestMitigations(actionPlan),
          estimatedValue: this.estimateActionValue(actionPlan)
        },
        status,
        createdAt: new Date(),
        decidedAt: status === 'approved' || status === 'rejected' ? new Date() : undefined,
        expiresAt
      };

      // Store decision in database
      await this.storeGovernanceDecision(decision);

      // Send notifications if human approval required
      if (status === 'pending' || status === 'escalated') {
        await this.notifyApprovers(decision, config);
      }

      // Emit governance event
      this.emitGovernanceEvent(decision, actionPlan);

      logger.info('Governance decision made', {
        decisionId: decision.id,
        actionPlanId: actionPlan.id,
        decisionType: decision.decisionType,
        status: decision.status,
        riskLevel: decision.riskLevel
      });

      return decision;

    } catch (error) {
      logger.error('Failed to evaluate action plan for governance', {
        actionPlanId: actionPlan.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Process human decision on a governance request
   */
  async processHumanDecision(
    decisionId: string,
    humanDecision: 'approve' | 'reject' | 'modify',
    userId: string,
    justification?: string,
    modifications?: Partial<ActionPlan>
  ): Promise<GovernanceDecision> {
    try {
      const decision = await this.getGovernanceDecision(decisionId);
      if (!decision) {
        throw new Error('Governance decision not found');
      }

      if (decision.status !== 'pending' && decision.status !== 'escalated') {
        throw new Error('Decision has already been processed');
      }

      // Check if decision has expired
      if (new Date() > decision.expiresAt) {
        decision.status = 'expired';
        await this.updateGovernanceDecision(decision);
        throw new Error('Decision has expired');
      }

      // Update decision with human input
      decision.humanDecision = humanDecision;
      decision.decisionMakerId = userId;
      decision.justification = justification;
      decision.decisionMaker = 'human';
      decision.decidedAt = new Date();
      
      if (humanDecision === 'approve') {
        decision.status = 'approved';
      } else if (humanDecision === 'reject') {
        decision.status = 'rejected';
      } else if (humanDecision === 'modify') {
        decision.status = 'approved'; // Approved with modifications
        // Handle modifications would be implemented here
      }

      await this.updateGovernanceDecision(decision);

      // Execute or reject the action plan based on decision
      await this.executeGovernanceDecision(decision);

      logger.info('Human governance decision processed', {
        decisionId,
        humanDecision,
        userId,
        finalStatus: decision.status
      });

      return decision;

    } catch (error) {
      logger.error('Failed to process human governance decision', {
        decisionId,
        humanDecision,
        userId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Update governance configuration for an organization
   */
  async updateGovernanceConfig(
    organizationId: string,
    updates: Partial<GovernanceConfig>
  ): Promise<GovernanceConfig> {
    try {
      const currentConfig = await this.getGovernanceConfig(organizationId);
      const newConfig = { ...currentConfig, ...updates };

      // Validate configuration
      this.validateGovernanceConfig(newConfig);

      // Store updated configuration
      await this.storeGovernanceConfig(newConfig);
      this.config.set(organizationId, newConfig);

      logger.info('Governance configuration updated', {
        organizationId,
        mode: newConfig.mode,
        changes: Object.keys(updates)
      });

      return newConfig;

    } catch (error) {
      logger.error('Failed to update governance configuration', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get governance metrics for an organization
   */
  async getGovernanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GovernanceMetrics> {
    try {
      // Get all decisions in the time period
      const decisions = await prisma.aI_GovernanceDecision.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate metrics
      const totalDecisions = decisions.length;
      const autoApproved = decisions.filter(d => d.decisionType === 'auto_approve').length;
      const humanApproved = decisions.filter(d => d.humanDecision === 'approve').length;
      const rejected = decisions.filter(d => d.status === 'rejected').length;
      const escalated = decisions.filter(d => d.status === 'escalated').length;
      const expired = decisions.filter(d => d.status === 'expired').length;

      // Calculate average decision time
      const decisionsWithTime = decisions.filter(d => d.decidedAt);
      const averageDecisionTime = decisionsWithTime.length > 0 ?
        decisionsWithTime.reduce((sum, d) => {
          const timeDiff = new Date(d.decidedAt!).getTime() - new Date(d.createdAt).getTime();
          return sum + (timeDiff / (1000 * 60)); // Convert to minutes
        }, 0) / decisionsWithTime.length : 0;

      // Risk distribution
      const riskDistribution = decisions.reduce((acc, d) => {
        const risk = d.riskLevel as RiskLevel;
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      }, {} as Record<RiskLevel, number>);

      // Calculate AI accuracy metrics
      const aiDecisionsWithHumanFeedback = decisions.filter(d => 
        d.aiRecommendation && d.humanDecision
      );
      
      let aiAccurate = 0;
      if (aiDecisionsWithHumanFeedback.length > 0) {
        aiAccurate = aiDecisionsWithHumanFeedback.filter(d => 
          (d.aiRecommendation === 'approve' && d.humanDecision === 'approve') ||
          (d.aiRecommendation === 'reject' && d.humanDecision === 'reject')
        ).length;
      }

      const aiAccuracy = aiDecisionsWithHumanFeedback.length > 0 ? 
        aiAccurate / aiDecisionsWithHumanFeedback.length : 0;

      // Calculate compliance score (simplified)
      const complianceScore = Math.max(0, Math.min(1, 
        (autoApproved + humanApproved) / Math.max(totalDecisions, 1) * 0.8 +
        aiAccuracy * 0.2
      ));

      const metrics: GovernanceMetrics = {
        organizationId,
        period: { start: startDate, end: endDate },
        actionCounts: {
          total: totalDecisions,
          autoApproved,
          humanApproved,
          rejected,
          escalated,
          expired
        },
        averageDecisionTime,
        riskDistribution,
        accuracyMetrics: {
          aiRecommendationAccuracy: aiAccuracy,
          falsePositiveRate: 0, // Would calculate based on actual outcomes
          falseNegativeRate: 0  // Would calculate based on actual outcomes
        },
        complianceScore
      };

      return metrics;

    } catch (error) {
      logger.error('Failed to get governance metrics', {
        organizationId,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Private helper methods

  private async getGovernanceConfig(organizationId: string): Promise<GovernanceConfig> {
    if (this.config.has(organizationId)) {
      return this.config.get(organizationId)!;
    }

    try {
      const stored = await prisma.aI_GovernanceConfig.findUnique({
        where: { organizationId }
      });

      if (stored) {
        const config = {
          organizationId,
          ...stored.config as any
        } as GovernanceConfig;
        this.config.set(organizationId, config);
        return config;
      }
    } catch (error) {
      logger.warn('Failed to load stored governance config, using default', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
    }

    // Return default config
    const defaultConfig: GovernanceConfig = {
      organizationId,
      ...this.defaultConfig
    };
    
    this.config.set(organizationId, defaultConfig);
    return defaultConfig;
  }

  private assessRiskLevel(actionPlan: ActionPlan, config: GovernanceConfig): RiskLevel {
    // Use the action plan's risk level, but could be enhanced with additional logic
    return actionPlan.riskLevel;
  }

  private calculateConfidenceLevel(actionPlan: ActionPlan): DecisionConfidenceLevel {
    // Calculate confidence based on action plan metadata
    const confidence = actionPlan.metadata?.confidence || 0.5;
    
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.25) return 'low';
    return 'very_low';
  }

  private generateAIRecommendation(
    actionPlan: ActionPlan, 
    config: GovernanceConfig
  ): 'approve' | 'reject' | 'review' {
    // Simple recommendation logic - would be enhanced with ML model
    if (actionPlan.riskLevel === 'critical') return 'review';
    if (actionPlan.riskLevel === 'high') return 'review';
    if (actionPlan.riskLevel === 'medium' && actionPlan.metadata?.confidence < 0.7) return 'review';
    if (actionPlan.riskLevel === 'low') return 'approve';
    
    return 'approve';
  }

  private requiresHumanApproval(
    actionPlan: ActionPlan,
    config: GovernanceConfig,
    riskLevel: RiskLevel
  ): boolean {
    // Check various approval requirements
    if (config.requiresApproval.riskLevels.includes(riskLevel)) return true;
    
    if (actionPlan.actions.some(action => 
      config.requiresApproval.actionTypes.includes(action.type)
    )) return true;

    if (actionPlan.metadata?.estimatedValue && 
        actionPlan.metadata.estimatedValue > config.requiresApproval.valueThreshold) {
      return true;
    }

    return false;
  }

  private generateDecisionReasoning(
    actionPlan: ActionPlan,
    config: GovernanceConfig,
    riskLevel: RiskLevel,
    confidenceLevel: DecisionConfidenceLevel,
    aiRecommendation: 'approve' | 'reject' | 'review'
  ): string {
    const reasons: string[] = [];

    reasons.push(`Risk level: ${riskLevel}`);
    reasons.push(`AI confidence: ${confidenceLevel}`);
    reasons.push(`AI recommendation: ${aiRecommendation}`);
    reasons.push(`Governance mode: ${config.mode}`);

    if (config.mode === 'emergency_stop') {
      reasons.push('Emergency stop mode active - all actions blocked');
    } else if (config.mode === 'queue') {
      reasons.push('Queue mode active - human approval required');
    } else if (config.mode === 'autonomous') {
      reasons.push('Autonomous mode active - auto-approval eligible');
    }

    return reasons.join('; ');
  }

  private determinePriority(riskLevel: RiskLevel): keyof GovernanceConfig['escalationRules']['timeouts'] {
    switch (riskLevel) {
      case 'critical': return 'highPriority';
      case 'high': return 'highPriority';
      case 'medium': return 'mediumPriority';
      default: return 'lowPriority';
    }
  }

  private generateActionSummary(actionPlan: ActionPlan): string {
    const actionTypes = actionPlan.actions.map(a => a.type).join(', ');
    return `${actionPlan.actions.length} action(s): ${actionTypes}`;
  }

  private estimateImpact(actionPlan: ActionPlan): string {
    // Simple impact estimation
    const impact = actionPlan.metadata?.expectedImpact || 'Unknown impact';
    return typeof impact === 'string' ? impact : 'Moderate impact expected';
  }

  private identifyRiskFactors(actionPlan: ActionPlan): string[] {
    const factors: string[] = [];
    
    if (actionPlan.riskLevel === 'critical' || actionPlan.riskLevel === 'high') {
      factors.push('High risk action');
    }
    
    if (actionPlan.actions.length > 5) {
      factors.push('Multiple actions in plan');
    }
    
    if (actionPlan.metadata?.estimatedValue > 1000) {
      factors.push('High value action');
    }

    return factors.length > 0 ? factors : ['No specific risk factors identified'];
  }

  private suggestMitigations(actionPlan: ActionPlan): string[] {
    const mitigations: string[] = [];
    
    if (actionPlan.riskLevel === 'high' || actionPlan.riskLevel === 'critical') {
      mitigations.push('Consider manual review before execution');
      mitigations.push('Monitor execution closely');
    }
    
    mitigations.push('Ensure compliance with organization policies');
    mitigations.push('Log all actions for audit trail');

    return mitigations;
  }

  private estimateActionValue(actionPlan: ActionPlan): number {
    return actionPlan.metadata?.estimatedValue || 0;
  }

  private async storeGovernanceDecision(decision: GovernanceDecision): Promise<void> {
    try {
      await prisma.aI_GovernanceDecision.create({
        data: {
          id: decision.id,
          actionPlanId: decision.actionPlanId,
          organizationId: decision.organizationId,
          contactId: decision.contactId,
          decisionType: decision.decisionType,
          riskLevel: decision.riskLevel,
          confidenceLevel: decision.confidenceLevel,
          reasoning: decision.reasoning,
          aiRecommendation: decision.aiRecommendation,
          humanDecision: decision.humanDecision,
          decisionMaker: decision.decisionMaker,
          decisionMakerId: decision.decisionMakerId,
          justification: decision.justification,
          metadata: decision.metadata as any,
          status: decision.status,
          decidedAt: decision.decidedAt,
          expiresAt: decision.expiresAt
        }
      });

      logger.debug('Governance decision stored', {
        decisionId: decision.id,
        status: decision.status
      });

    } catch (error) {
      logger.error('Failed to store governance decision', {
        decisionId: decision.id,
        error: error instanceof Error ? error.message : error
      });
      // Don't throw - storing failure shouldn't break the governance process
    }
  }

  private async getGovernanceDecision(decisionId: string): Promise<GovernanceDecision | null> {
    try {
      const stored = await prisma.aI_GovernanceDecision.findUnique({
        where: { id: decisionId }
      });

      if (!stored) return null;

      return {
        id: stored.id,
        actionPlanId: stored.actionPlanId,
        organizationId: stored.organizationId,
        contactId: stored.contactId,
        decisionType: stored.decisionType as GovernanceDecision['decisionType'],
        riskLevel: stored.riskLevel as RiskLevel,
        confidenceLevel: stored.confidenceLevel as DecisionConfidenceLevel,
        reasoning: stored.reasoning,
        aiRecommendation: stored.aiRecommendation as GovernanceDecision['aiRecommendation'],
        humanDecision: stored.humanDecision as GovernanceDecision['humanDecision'],
        decisionMaker: stored.decisionMaker as GovernanceDecision['decisionMaker'],
        decisionMakerId: stored.decisionMakerId,
        justification: stored.justification,
        metadata: stored.metadata as GovernanceDecision['metadata'],
        status: stored.status as GovernanceDecision['status'],
        createdAt: stored.createdAt,
        decidedAt: stored.decidedAt,
        expiresAt: stored.expiresAt
      };

    } catch (error) {
      logger.error('Failed to get governance decision', {
        decisionId,
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  private async updateGovernanceDecision(decision: GovernanceDecision): Promise<void> {
    try {
      await prisma.aI_GovernanceDecision.update({
        where: { id: decision.id },
        data: {
          humanDecision: decision.humanDecision,
          decisionMakerId: decision.decisionMakerId,
          justification: decision.justification,
          decisionMaker: decision.decisionMaker,
          status: decision.status,
          decidedAt: decision.decidedAt
        }
      });

      logger.debug('Governance decision updated', {
        decisionId: decision.id,
        status: decision.status
      });

    } catch (error) {
      logger.error('Failed to update governance decision', {
        decisionId: decision.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  private async executeGovernanceDecision(decision: GovernanceDecision): Promise<void> {
    try {
      if (decision.status === 'approved') {
        // Trigger action plan execution
        const eventBus = getCustomerEventBus();
        eventBus.emit('governance-approved', {
          type: 'governance-approved',
          id: `gov_approved_${Date.now()}`,
          actionPlanId: decision.actionPlanId,
          decisionId: decision.id,
          organizationId: decision.organizationId,
          contactId: decision.contactId,
          timestamp: new Date()
        });

        logger.info('Action plan approved for execution', {
          actionPlanId: decision.actionPlanId,
          decisionId: decision.id
        });
      } else if (decision.status === 'rejected') {
        // Notify about rejection
        const eventBus = getCustomerEventBus();
        eventBus.emit('governance-rejected', {
          type: 'governance-rejected',
          id: `gov_rejected_${Date.now()}`,
          actionPlanId: decision.actionPlanId,
          decisionId: decision.id,
          organizationId: decision.organizationId,
          contactId: decision.contactId,
          reason: decision.justification || 'Action plan rejected by governance',
          timestamp: new Date()
        });

        logger.info('Action plan rejected by governance', {
          actionPlanId: decision.actionPlanId,
          decisionId: decision.id,
          reason: decision.justification
        });
      }

    } catch (error) {
      logger.error('Failed to execute governance decision', {
        decisionId: decision.id,
        status: decision.status,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async notifyApprovers(decision: GovernanceDecision, config: GovernanceConfig): Promise<void> {
    try {
      // Emit notification event
      const eventBus = getCustomerEventBus();
      eventBus.emit('governance-approval-required', {
        type: 'governance-approval-required',
        id: `gov_approval_${Date.now()}`,
        decisionId: decision.id,
        actionPlanId: decision.actionPlanId,
        organizationId: decision.organizationId,
        contactId: decision.contactId,
        riskLevel: decision.riskLevel,
        priority: this.determinePriority(decision.riskLevel),
        expiresAt: decision.expiresAt,
        approvers: config.escalationRules.escalationChain,
        timestamp: new Date()
      });

      logger.debug('Approval notification sent', {
        decisionId: decision.id,
        approvers: config.escalationRules.escalationChain.length
      });

    } catch (error) {
      logger.error('Failed to notify approvers', {
        decisionId: decision.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private emitGovernanceEvent(decision: GovernanceDecision, actionPlan: ActionPlan): void {
    try {
      const eventBus = getCustomerEventBus();
      eventBus.emit('governance-decision-made', {
        type: 'governance-decision-made',
        id: `gov_decision_${Date.now()}`,
        decisionId: decision.id,
        actionPlanId: decision.actionPlanId,
        organizationId: decision.organizationId,
        contactId: decision.contactId,
        decisionType: decision.decisionType,
        status: decision.status,
        riskLevel: decision.riskLevel,
        timestamp: new Date()
      });

    } catch (error) {
      logger.warn('Failed to emit governance event', {
        decisionId: decision.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private validateGovernanceConfig(config: GovernanceConfig): void {
    if (!config.organizationId) {
      throw new Error('Organization ID is required');
    }

    if (!['queue', 'semi_autonomous', 'autonomous', 'emergency_stop'].includes(config.mode)) {
      throw new Error('Invalid governance mode');
    }

    if (config.autoApprovalLimits.maxActions < 0 || config.autoApprovalLimits.maxValue < 0) {
      throw new Error('Auto-approval limits must be non-negative');
    }
  }

  private async storeGovernanceConfig(config: GovernanceConfig): Promise<void> {
    try {
      await prisma.aI_GovernanceConfig.upsert({
        where: { organizationId: config.organizationId },
        update: { config: config as any },
        create: {
          organizationId: config.organizationId,
          config: config as any
        }
      });

      logger.debug('Governance configuration stored', {
        organizationId: config.organizationId,
        mode: config.mode
      });

    } catch (error) {
      logger.error('Failed to store governance configuration', {
        organizationId: config.organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  private async initializeGovernance(): Promise<void> {
    logger.info('AI Governance Layer initialized');
  }
}

/**
 * Singleton instance for AI governance
 */
let governanceLayer: AIGovernanceLayer | null = null;

/**
 * Get the AI governance layer instance
 */
export function getAIGovernanceLayer(): AIGovernanceLayer {
  if (!governanceLayer) {
    governanceLayer = new AIGovernanceLayer();
  }
  return governanceLayer;
}

/**
 * Evaluate an action plan for governance approval
 */
export async function evaluateActionPlanGovernance(actionPlan: ActionPlan): Promise<GovernanceDecision> {
  const governance = getAIGovernanceLayer();
  return governance.evaluateActionPlan(actionPlan);
}

/**
 * Process human decision on a governance request
 */
export async function processHumanGovernanceDecision(
  decisionId: string,
  humanDecision: 'approve' | 'reject' | 'modify',
  userId: string,
  justification?: string
): Promise<GovernanceDecision> {
  const governance = getAIGovernanceLayer();
  return governance.processHumanDecision(decisionId, humanDecision, userId, justification);
}

/**
 * Update governance configuration
 */
export async function updateOrganizationGovernanceConfig(
  organizationId: string,
  updates: Partial<GovernanceConfig>
): Promise<GovernanceConfig> {
  const governance = getAIGovernanceLayer();
  return governance.updateGovernanceConfig(organizationId, updates);
}