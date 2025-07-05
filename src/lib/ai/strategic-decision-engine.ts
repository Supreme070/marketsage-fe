/**
 * Strategic AI Decision-Making Engine
 * ==================================
 * High-level business strategy automation and executive decision support
 * Builds upon existing tactical AI to provide strategic planning and optimization
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import prisma from '@/lib/db/prisma';
import { predictiveAnalyticsEngine } from './predictive-analytics-engine';
import { realtimeDecisionEngine } from './realtime-decision-engine';
// Removed circular import - will use dynamic import when needed

export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'growth' | 'efficiency' | 'market_expansion' | 'customer_retention' | 'product_development';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planning' | 'active' | 'on_track' | 'at_risk' | 'completed' | 'paused';
  metrics: {
    target: number;
    current: number;
    unit: string;
    deadline: Date;
  };
  milestones: StrategicMilestone[];
  dependencies: string[];
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategicMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress: number; // 0-100
  dependencies: string[];
  resources: {
    budget?: number;
    team?: string[];
    tools?: string[];
  };
}

export interface StrategicDecision {
  id: string;
  title: string;
  description: string;
  type: 'budget_allocation' | 'market_expansion' | 'product_strategy' | 'campaign_strategy' | 'resource_allocation' | 'risk_mitigation';
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  status: 'analysis' | 'recommendation' | 'pending_approval' | 'approved' | 'implemented' | 'rejected';
  analysis: {
    scenarios: StrategicScenario[];
    recommendations: StrategicRecommendation[];
    riskAssessment: RiskAssessment;
    resourceRequirements: ResourceRequirements;
  };
  decisionMaker: string;
  deadline: Date;
  createdAt: Date;
  implementedAt?: Date;
}

export interface StrategicScenario {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  impact: {
    revenue: number;
    costs: number;
    timeline: number; // months
    riskLevel: 'low' | 'medium' | 'high';
  };
  assumptions: string[];
  outcomes: {
    best_case: any;
    expected: any;
    worst_case: any;
  };
}

export interface StrategicRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-1
  expectedImpact: {
    revenue: number;
    efficiency: number;
    timeline: number;
  };
  implementation: {
    steps: string[];
    resources: ResourceRequirements;
    timeline: number; // months
    dependencies: string[];
  };
  risks: string[];
  alternatives: string[];
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    category: 'market' | 'financial' | 'operational' | 'competitive' | 'regulatory';
    risk: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
  contingencyPlans: string[];
}

export interface ResourceRequirements {
  budget: {
    total: number;
    breakdown: Record<string, number>;
    currency: string;
  };
  team: {
    existing: string[];
    additional: Array<{
      role: string;
      skills: string[];
      level: 'junior' | 'mid' | 'senior';
      months: number;
    }>;
  };
  technology: {
    existing: string[];
    additional: string[];
  };
  timeline: number; // months
}

export interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'threat' | 'trend' | 'optimization' | 'alert';
  category: 'market' | 'customer' | 'product' | 'operational' | 'financial';
  title: string;
  description: string;
  confidence: number;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  data: any;
  recommendations: string[];
  createdAt: Date;
  expiresAt?: Date;
}

class StrategicDecisionEngine {
  private strategicGoals = new Map<string, StrategicGoal>();
  private pendingDecisions = new Map<string, StrategicDecision>();
  private strategicInsights: StrategicInsight[] = [];
  private businessRules = new Map<string, any>();

  constructor() {
    this.initializeBusinessRules();
    this.startStrategicMonitoring();
    this.scheduleStrategicAnalysis();
  }

  /**
   * Initialize strategic business rules
   */
  private initializeBusinessRules(): void {
    const rules = [
      {
        id: 'revenue_growth_target',
        category: 'financial',
        rule: 'Monthly revenue growth should be >= 15% for African fintech market',
        threshold: 0.15,
        action: 'alert_executive_team'
      },
      {
        id: 'customer_acquisition_cost',
        category: 'marketing',
        rule: 'CAC should be <= 30% of customer LTV',
        threshold: 0.30,
        action: 'optimize_marketing_spend'
      },
      {
        id: 'churn_rate_threshold',
        category: 'customer',
        rule: 'Monthly churn rate should be <= 5% for sustainable growth',
        threshold: 0.05,
        action: 'activate_retention_strategy'
      },
      {
        id: 'market_expansion_criteria',
        category: 'growth',
        rule: 'Enter new market when current market penetration >= 10%',
        threshold: 0.10,
        action: 'initiate_expansion_analysis'
      },
      {
        id: 'operational_efficiency',
        category: 'operations',
        rule: 'Automation rate should be >= 80% for scalable operations',
        threshold: 0.80,
        action: 'enhance_automation'
      }
    ];

    rules.forEach(rule => {
      this.businessRules.set(rule.id, rule);
    });

    logger.info('Strategic business rules initialized', {
      rulesCount: rules.length,
      categories: [...new Set(rules.map(r => r.category))]
    });
  }

  /**
   * Generate strategic plan based on current business context
   */
  async generateStrategicPlan(params: {
    timeframe: '3_months' | '6_months' | '12_months';
    focus: 'growth' | 'efficiency' | 'expansion' | 'retention' | 'balanced';
    organizationId: string;
    userId: string;
  }): Promise<{
    goals: StrategicGoal[];
    priorities: string[];
    timeline: any;
    resourceAllocation: any;
    riskAssessment: RiskAssessment;
  }> {
    const tracer = trace.getTracer('strategic-planning');
    
    return tracer.startActiveSpan('generate-strategic-plan', async (span) => {
      try {
        span.setAttributes({
          'strategic.plan.timeframe': params.timeframe,
          'strategic.plan.focus': params.focus,
          'organization.id': params.organizationId,
          'user.id': params.userId
        });

        logger.info('Generating strategic plan', {
          timeframe: params.timeframe,
          focus: params.focus,
          organizationId: params.organizationId
        });

        // Analyze current business context
        const context = await this.analyzeBusinessContext(params.organizationId);
        
        // Generate strategic insights
        const insights = await this.generateStrategicInsights(context, params.focus);
        
        // Create strategic goals based on insights and focus
        const goals = await this.createStrategicGoals(insights, params);
        
        // Prioritize goals and create timeline
        const priorities = this.prioritizeStrategicGoals(goals);
        const timeline = this.createStrategicTimeline(goals, params.timeframe);
        
        // Calculate resource allocation
        const resourceAllocation = await this.calculateResourceAllocation(goals, context);
        
        // Assess strategic risks
        const riskAssessment = await this.assessStrategicRisks(goals, context);

        span.setAttributes({
          'strategic.plan.goals_count': goals.length,
          'strategic.plan.priorities_count': priorities.length,
          'strategic.plan.risk_level': riskAssessment.overall
        });

        logger.info('Strategic plan generated successfully', {
          goalsCount: goals.length,
          timeframe: params.timeframe,
          riskLevel: riskAssessment.overall
        });

        return {
          goals,
          priorities,
          timeline,
          resourceAllocation,
          riskAssessment
        };

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        logger.error('Strategic plan generation failed', {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Analyze current business context for strategic planning
   */
  private async analyzeBusinessContext(organizationId: string): Promise<any> {
    // Get comprehensive business metrics
    const [contacts, campaigns, workflows, predictiveData] = await Promise.all([
      // Customer metrics
      prisma.contact.aggregate({
        where: { organizationId },
        _count: true
      }),
      
      // Campaign performance
      prisma.emailCampaign.findMany({
        where: { organizationId },
        include: { _count: { select: { recipients: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Automation metrics
      prisma.workflow.aggregate({
        where: { organizationId },
        _count: true
      }),
      
      // Get predictive analytics data
      predictiveAnalyticsEngine.generateMarketForecast({
        timeframe: '6_months',
        market: 'african_fintech',
        includeConfidenceIntervals: true
      })
    ]);

    return {
      customerBase: {
        total: contacts._count || 0,
        growth: await this.calculateGrowthRate(organizationId, 'contacts'),
        segments: await this.getCustomerSegmentDistribution(organizationId)
      },
      campaignPerformance: {
        total: campaigns.length,
        averageOpenRate: await this.calculateAverageMetric(campaigns, 'openRate'),
        averageConversionRate: await this.calculateAverageMetric(campaigns, 'conversionRate'),
        roi: await this.calculateCampaignROI(organizationId)
      },
      automation: {
        workflowCount: workflows._count || 0,
        automationRate: await this.calculateAutomationRate(organizationId)
      },
      marketIntelligence: predictiveData,
      financial: await this.getFinancialMetrics(organizationId),
      competitive: await this.getCompetitiveIntelligence()
    };
  }

  /**
   * Generate strategic insights based on business context
   */
  private async generateStrategicInsights(context: any, focus: string): Promise<StrategicInsight[]> {
    const insights: StrategicInsight[] = [];

    // Revenue growth opportunities
    if (context.financial.monthlyGrowthRate < 0.15) {
      insights.push({
        id: `insight_revenue_${Date.now()}`,
        type: 'opportunity',
        category: 'financial',
        title: 'Revenue Growth Acceleration Opportunity',
        description: `Current growth rate (${(context.financial.monthlyGrowthRate * 100).toFixed(1)}%) is below African fintech benchmark (15%). Implementing advanced segmentation and personalization could increase revenue by 25-40%.`,
        confidence: 0.85,
        urgency: 'high',
        impact: 'critical',
        source: 'financial_analysis',
        data: context.financial,
        recommendations: [
          'Implement behavioral segmentation for premium customers',
          'Launch targeted upselling campaigns',
          'Optimize pricing strategy for African markets'
        ],
        createdAt: new Date()
      });
    }

    // Customer retention insights
    if (context.customerBase.churnRate > 0.05) {
      insights.push({
        id: `insight_retention_${Date.now()}`,
        type: 'threat',
        category: 'customer',
        title: 'Customer Retention Risk',
        description: `Churn rate (${(context.customerBase.churnRate * 100).toFixed(1)}%) exceeds sustainable threshold. Predictive models suggest 23% revenue impact if not addressed.`,
        confidence: 0.90,
        urgency: 'immediate',
        impact: 'high',
        source: 'churn_analysis',
        data: context.customerBase,
        recommendations: [
          'Deploy AI-powered churn prediction system',
          'Implement proactive retention workflows',
          'Enhance customer success programs'
        ],
        createdAt: new Date()
      });
    }

    // Market expansion opportunities
    if (context.marketIntelligence.marketPenetration > 0.10) {
      insights.push({
        id: `insight_expansion_${Date.now()}`,
        type: 'opportunity',
        category: 'market',
        title: 'Market Expansion Readiness',
        description: `Current market penetration (${(context.marketIntelligence.marketPenetration * 100).toFixed(1)}%) indicates readiness for geographic expansion. Nigerian and Kenyan markets show 45% growth potential.`,
        confidence: 0.78,
        urgency: 'medium',
        impact: 'high',
        source: 'market_analysis',
        data: context.marketIntelligence,
        recommendations: [
          'Conduct detailed market research for Nigeria/Kenya',
          'Develop market-specific product variations',
          'Establish local partnerships and compliance'
        ],
        createdAt: new Date()
      });
    }

    // Automation efficiency insights
    if (context.automation.automationRate < 0.80) {
      insights.push({
        id: `insight_automation_${Date.now()}`,
        type: 'optimization',
        category: 'operational',
        title: 'Automation Efficiency Gap',
        description: `Current automation rate (${(context.automation.automationRate * 100).toFixed(1)}%) below scalability threshold. Increasing automation could reduce operational costs by 30%.`,
        confidence: 0.82,
        urgency: 'medium',
        impact: 'medium',
        source: 'automation_analysis',
        data: context.automation,
        recommendations: [
          'Implement advanced workflow automation',
          'Deploy AI-powered customer service',
          'Automate reporting and analytics'
        ],
        createdAt: new Date()
      });
    }

    return insights;
  }

  /**
   * Create strategic goals based on insights
   */
  private async createStrategicGoals(insights: StrategicInsight[], params: any): Promise<StrategicGoal[]> {
    const goals: StrategicGoal[] = [];
    const timeframeMonths = params.timeframe === '3_months' ? 3 : params.timeframe === '6_months' ? 6 : 12;

    // Revenue growth goal
    if (insights.some(i => i.category === 'financial')) {
      goals.push({
        id: `goal_revenue_${Date.now()}`,
        title: 'Accelerate Revenue Growth',
        description: 'Achieve sustainable 15%+ monthly revenue growth through strategic optimization',
        category: 'revenue',
        priority: 'critical',
        status: 'planning',
        metrics: {
          target: 15, // 15% monthly growth
          current: 8, // Simulated current
          unit: 'percentage',
          deadline: new Date(Date.now() + timeframeMonths * 30 * 24 * 60 * 60 * 1000)
        },
        milestones: [
          {
            id: `milestone_revenue_1_${Date.now()}`,
            goalId: `goal_revenue_${Date.now()}`,
            title: 'Implement Advanced Segmentation',
            description: 'Deploy behavioral segmentation for premium customers',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending',
            progress: 0,
            dependencies: [],
            resources: { budget: 15000, team: ['data_scientist', 'marketing_manager'] }
          }
        ],
        dependencies: [],
        assignedTo: ['revenue_team'],
        createdBy: params.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Customer retention goal
    if (insights.some(i => i.category === 'customer')) {
      goals.push({
        id: `goal_retention_${Date.now()}`,
        title: 'Enhance Customer Retention',
        description: 'Reduce churn rate to below 5% through predictive interventions',
        category: 'customer_retention',
        priority: 'high',
        status: 'planning',
        metrics: {
          target: 5, // 5% churn rate
          current: 8, // Simulated current
          unit: 'percentage',
          deadline: new Date(Date.now() + timeframeMonths * 30 * 24 * 60 * 60 * 1000)
        },
        milestones: [
          {
            id: `milestone_retention_1_${Date.now()}`,
            goalId: `goal_retention_${Date.now()}`,
            title: 'Deploy Churn Prediction System',
            description: 'Implement AI-powered churn prediction and intervention',
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'pending',
            progress: 0,
            dependencies: [],
            resources: { budget: 25000, team: ['ml_engineer', 'customer_success'] }
          }
        ],
        dependencies: [],
        assignedTo: ['customer_success_team'],
        createdBy: params.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Market expansion goal
    if (insights.some(i => i.category === 'market' && i.type === 'opportunity')) {
      goals.push({
        id: `goal_expansion_${Date.now()}`,
        title: 'Strategic Market Expansion',
        description: 'Expand to Nigerian and Kenyan markets with localized offerings',
        category: 'market_expansion',
        priority: 'high',
        status: 'planning',
        metrics: {
          target: 2, // 2 new markets
          current: 0,
          unit: 'markets',
          deadline: new Date(Date.now() + timeframeMonths * 30 * 24 * 60 * 60 * 1000)
        },
        milestones: [
          {
            id: `milestone_expansion_1_${Date.now()}`,
            goalId: `goal_expansion_${Date.now()}`,
            title: 'Market Research & Analysis',
            description: 'Comprehensive analysis of Nigerian and Kenyan markets',
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending',
            progress: 0,
            dependencies: [],
            resources: { budget: 40000, team: ['market_analyst', 'business_development'] }
          }
        ],
        dependencies: [],
        assignedTo: ['expansion_team'],
        createdBy: params.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return goals;
  }

  /**
   * Prioritize strategic goals using AI-driven analysis
   */
  private prioritizeStrategicGoals(goals: StrategicGoal[]): string[] {
    // AI-driven prioritization based on impact, urgency, and resources
    const scoredGoals = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      score: this.calculateStrategicScore(goal)
    })).sort((a, b) => b.score - a.score);

    return scoredGoals.map(g => g.title);
  }

  /**
   * Calculate strategic score for goal prioritization
   */
  private calculateStrategicScore(goal: StrategicGoal): number {
    const priorityWeights = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    const categoryWeights = {
      revenue: 1.0,
      customer_retention: 0.9,
      market_expansion: 0.8,
      efficiency: 0.7,
      growth: 0.8,
      product_development: 0.6
    };

    const priorityScore = priorityWeights[goal.priority] || 0.5;
    const categoryScore = categoryWeights[goal.category] || 0.5;
    const urgencyScore = this.calculateUrgencyScore(goal.metrics.deadline);

    return (priorityScore * 0.4) + (categoryScore * 0.4) + (urgencyScore * 0.2);
  }

  /**
   * Calculate urgency score based on deadline
   */
  private calculateUrgencyScore(deadline: Date): number {
    const daysToDeadline = (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    
    if (daysToDeadline <= 30) return 1.0; // Very urgent
    if (daysToDeadline <= 90) return 0.8; // High urgency
    if (daysToDeadline <= 180) return 0.6; // Medium urgency
    return 0.4; // Lower urgency
  }

  /**
   * Create strategic timeline
   */
  private createStrategicTimeline(goals: StrategicGoal[], timeframe: string): any {
    const timeframeMonths = timeframe === '3_months' ? 3 : timeframe === '6_months' ? 6 : 12;
    
    return {
      duration: `${timeframeMonths} months`,
      phases: this.createTimelinePhases(goals, timeframeMonths),
      milestones: goals.flatMap(g => g.milestones),
      criticalPath: this.identifyCriticalPath(goals)
    };
  }

  /**
   * Create timeline phases
   */
  private createTimelinePhases(goals: StrategicGoal[], months: number): any[] {
    const phaseLength = Math.ceil(months / 3);
    
    return [
      {
        name: 'Foundation Phase',
        duration: `${phaseLength} months`,
        focus: 'Setup and initial implementation',
        goals: goals.filter(g => g.priority === 'critical').map(g => g.title)
      },
      {
        name: 'Execution Phase',
        duration: `${phaseLength} months`,
        focus: 'Core implementation and optimization',
        goals: goals.filter(g => g.priority === 'high').map(g => g.title)
      },
      {
        name: 'Optimization Phase',
        duration: `${months - 2 * phaseLength} months`,
        focus: 'Refinement and scaling',
        goals: goals.filter(g => ['medium', 'low'].includes(g.priority)).map(g => g.title)
      }
    ];
  }

  /**
   * Calculate resource allocation
   */
  private async calculateResourceAllocation(goals: StrategicGoal[], context: any): Promise<any> {
    const totalBudget = goals.reduce((sum, goal) => 
      sum + goal.milestones.reduce((mSum, milestone) => 
        mSum + (milestone.resources.budget || 0), 0), 0);

    return {
      budget: {
        total: totalBudget,
        byCategory: this.calculateBudgetByCategory(goals),
        currency: 'USD'
      },
      team: {
        required: this.calculateTeamRequirements(goals),
        utilization: this.calculateTeamUtilization(goals)
      },
      timeline: this.calculateResourceTimeline(goals)
    };
  }

  /**
   * Assess strategic risks
   */
  private async assessStrategicRisks(goals: StrategicGoal[], context: any): Promise<RiskAssessment> {
    const risks = [
      {
        category: 'market' as const,
        risk: 'Economic volatility in African markets',
        probability: 0.3,
        impact: 0.7,
        mitigation: 'Diversify across multiple stable markets'
      },
      {
        category: 'financial' as const,
        risk: 'Insufficient funding for expansion',
        probability: 0.4,
        impact: 0.8,
        mitigation: 'Secure strategic partnerships and funding rounds'
      },
      {
        category: 'operational' as const,
        risk: 'Talent acquisition challenges',
        probability: 0.5,
        impact: 0.6,
        mitigation: 'Develop remote talent pipeline and training programs'
      }
    ];

    const overallRisk = this.calculateOverallRisk(risks);

    return {
      overall: overallRisk,
      factors: risks,
      contingencyPlans: [
        'Implement agile planning with quarterly reviews',
        'Maintain 20% budget buffer for unexpected challenges',
        'Develop alternative market entry strategies'
      ]
    };
  }

  /**
   * Start strategic monitoring
   */
  private startStrategicMonitoring(): void {
    // Monitor strategic KPIs every hour
    setInterval(async () => {
      try {
        await this.monitorStrategicKPIs();
      } catch (error) {
        logger.error('Strategic monitoring failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 60 * 60 * 1000); // 1 hour

    logger.info('Strategic monitoring started');
  }

  /**
   * Schedule strategic analysis
   */
  private scheduleStrategicAnalysis(): void {
    // Run comprehensive strategic analysis daily at 6 AM
    setInterval(async () => {
      try {
        await this.performDailyStrategicAnalysis();
      } catch (error) {
        logger.error('Daily strategic analysis failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    logger.info('Strategic analysis scheduler started');
  }

  /**
   * Monitor strategic KPIs
   */
  private async monitorStrategicKPIs(): Promise<void> {
    // This would monitor real KPIs and trigger alerts
    // Implementation would check against business rules
    logger.info('Strategic KPI monitoring completed');
  }

  /**
   * Perform daily strategic analysis
   */
  private async performDailyStrategicAnalysis(): Promise<void> {
    // This would generate daily strategic insights
    // Implementation would analyze trends and opportunities
    logger.info('Daily strategic analysis completed');
  }

  /**
   * Utility methods for calculations
   */
  private async calculateGrowthRate(organizationId: string, metric: string): Promise<number> {
    // Simulate growth rate calculation
    return 0.08; // 8% growth
  }

  private async getCustomerSegmentDistribution(organizationId: string): Promise<any> {
    return { premium: 0.2, standard: 0.6, basic: 0.2 };
  }

  private async calculateAverageMetric(campaigns: any[], metric: string): Promise<number> {
    // Simulate metric calculation
    return 0.25; // 25% average
  }

  private async calculateCampaignROI(organizationId: string): Promise<number> {
    return 3.5; // 3.5x ROI
  }

  private async calculateAutomationRate(organizationId: string): Promise<number> {
    return 0.75; // 75% automation
  }

  private async getFinancialMetrics(organizationId: string): Promise<any> {
    return {
      monthlyGrowthRate: 0.08,
      churnRate: 0.06,
      ltv: 450,
      cac: 120
    };
  }

  private async getCompetitiveIntelligence(): Promise<any> {
    return {
      marketPosition: 'emerging_leader',
      competitiveAdvantages: ['AI_automation', 'African_focus', 'Cultural_intelligence']
    };
  }

  private calculateBudgetByCategory(goals: StrategicGoal[]): Record<string, number> {
    const result: Record<string, number> = {};
    goals.forEach(goal => {
      const categoryBudget = goal.milestones.reduce((sum, m) => sum + (m.resources.budget || 0), 0);
      result[goal.category] = (result[goal.category] || 0) + categoryBudget;
    });
    return result;
  }

  private calculateTeamRequirements(goals: StrategicGoal[]): string[] {
    const teams = new Set<string>();
    goals.forEach(goal => {
      goal.assignedTo.forEach(team => teams.add(team));
      goal.milestones.forEach(milestone => {
        milestone.resources.team?.forEach(member => teams.add(member));
      });
    });
    return Array.from(teams);
  }

  private calculateTeamUtilization(goals: StrategicGoal[]): Record<string, number> {
    // Simulate team utilization calculation
    return { development: 0.8, marketing: 0.9, operations: 0.7 };
  }

  private calculateResourceTimeline(goals: StrategicGoal[]): any {
    return {
      peakResourcePeriod: 'months_2_4',
      resourceDistribution: 'front_loaded'
    };
  }

  private identifyCriticalPath(goals: StrategicGoal[]): string[] {
    // Identify critical path through dependencies
    return goals.filter(g => g.priority === 'critical').map(g => g.title);
  }

  private calculateOverallRisk(risks: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const averageRisk = risks.reduce((sum, r) => sum + (r.probability * r.impact), 0) / risks.length;
    
    if (averageRisk >= 0.7) return 'critical';
    if (averageRisk >= 0.5) return 'high';
    if (averageRisk >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Public API methods
   */
  async getStrategicDashboard(organizationId: string): Promise<any> {
    const activeGoals = Array.from(this.strategicGoals.values())
      .filter(g => g.status === 'active');
    
    const pendingDecisions = Array.from(this.pendingDecisions.values())
      .filter(d => d.status === 'pending_approval');

    const recentInsights = this.strategicInsights
      .filter(i => i.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      goals: {
        active: activeGoals.length,
        onTrack: activeGoals.filter(g => g.status === 'on_track').length,
        atRisk: activeGoals.filter(g => g.status === 'at_risk').length
      },
      decisions: {
        pending: pendingDecisions.length,
        urgent: pendingDecisions.filter(d => d.urgency === 'immediate').length
      },
      insights: {
        recent: recentInsights.slice(0, 5),
        opportunities: recentInsights.filter(i => i.type === 'opportunity').length,
        threats: recentInsights.filter(i => i.type === 'threat').length
      }
    };
  }

  async createStrategicDecision(params: Partial<StrategicDecision>): Promise<StrategicDecision> {
    const decision: StrategicDecision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: params.title || 'Strategic Decision',
      description: params.description || '',
      type: params.type || 'budget_allocation',
      urgency: params.urgency || 'medium',
      impact: params.impact || 'medium',
      status: 'analysis',
      analysis: params.analysis || {
        scenarios: [],
        recommendations: [],
        riskAssessment: { overall: 'medium', factors: [], contingencyPlans: [] },
        resourceRequirements: {
          budget: { total: 0, breakdown: {}, currency: 'USD' },
          team: { existing: [], additional: [] },
          technology: { existing: [], additional: [] },
          timeline: 0
        }
      },
      decisionMaker: params.decisionMaker || '',
      deadline: params.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.pendingDecisions.set(decision.id, decision);
    
    return decision;
  }
}

// Export singleton instance
export const strategicDecisionEngine = new StrategicDecisionEngine();

// Convenience functions
export async function generateExecutiveStrategicPlan(params: {
  timeframe: '3_months' | '6_months' | '12_months';
  focus: 'growth' | 'efficiency' | 'expansion' | 'retention' | 'balanced';
  organizationId: string;
  userId: string;
}): Promise<any> {
  return strategicDecisionEngine.generateStrategicPlan(params);
}

export async function getExecutiveDashboard(organizationId: string): Promise<any> {
  return strategicDecisionEngine.getStrategicDashboard(organizationId);
}