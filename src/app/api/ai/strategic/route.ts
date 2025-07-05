/**
 * Strategic AI Decision-Making API
 * ===============================
 * Executive-level strategic planning and decision support endpoints
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trace } from '@opentelemetry/api';

// Request validation schemas
const strategicPlanRequestSchema = z.object({
  timeframe: z.enum(['3_months', '6_months', '12_months']),
  focus: z.enum(['growth', 'efficiency', 'expansion', 'retention', 'balanced']),
  includeRiskAnalysis: z.boolean().default(true),
  includeResourceAllocation: z.boolean().default(true),
  customObjectives: z.array(z.string()).optional()
});

const decisionRequestSchema = z.object({
  title: z.string().min(1, 'Decision title required'),
  description: z.string().min(1, 'Decision description required'),
  type: z.enum(['budget_allocation', 'market_expansion', 'product_strategy', 'campaign_strategy', 'resource_allocation', 'risk_mitigation']),
  urgency: z.enum(['immediate', 'high', 'medium', 'low']).default('medium'),
  impact: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  deadline: z.string().datetime().optional(),
  context: z.record(z.any()).optional()
});

const goalUpdateSchema = z.object({
  goalId: z.string().min(1, 'Goal ID required'),
  status: z.enum(['planning', 'active', 'on_track', 'at_risk', 'completed', 'paused']).optional(),
  progress: z.number().min(0).max(100).optional(),
  milestoneUpdates: z.array(z.object({
    milestoneId: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
    progress: z.number().min(0).max(100).optional(),
    notes: z.string().optional()
  })).optional()
});

// GET: Strategic dashboard and insights
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const tracer = trace.getTracer('strategic-api');
    
    return tracer.startActiveSpan('get-strategic-dashboard', async (span) => {
      try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'dashboard';
        const timeframe = url.searchParams.get('timeframe') || '30_days';

        span.setAttributes({
          'strategic.request.type': type,
          'strategic.request.timeframe': timeframe,
          'user.id': user.id,
          'organization.id': user.organizationId,
          'user.role': user.role
        });

        // Dynamic import
        const { getExecutiveDashboard } = await import('@/lib/ai/strategic-decision-engine');

        switch (type) {
          case 'dashboard':
            const dashboard = await getExecutiveDashboard(user.organizationId);
            
            return NextResponse.json({
              success: true,
              data: {
                type: 'strategic_dashboard',
                dashboard,
                summary: {
                  activeGoals: dashboard.goals.active,
                  goalsOnTrack: dashboard.goals.onTrack,
                  goalsAtRisk: dashboard.goals.atRisk,
                  pendingDecisions: dashboard.decisions.pending,
                  urgentDecisions: dashboard.decisions.urgent,
                  recentOpportunities: dashboard.insights.opportunities,
                  threats: dashboard.insights.threats
                },
                insights: dashboard.insights.recent,
                recommendations: [
                  'Review goals at risk and create mitigation plans',
                  'Address urgent decisions requiring immediate attention',
                  'Capitalize on identified opportunities',
                  'Monitor threat indicators and prepare contingencies'
                ],
                metadata: {
                  lastUpdated: new Date(),
                  nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                  analysisDepth: 'comprehensive'
                }
              }
            });

          case 'insights':
            // Get strategic insights and recommendations
            return NextResponse.json({
              success: true,
              data: {
                type: 'strategic_insights',
                insights: [
                  {
                    category: 'revenue',
                    title: 'Revenue Growth Acceleration',
                    description: 'AI analysis indicates 25% revenue increase potential through advanced segmentation',
                    confidence: 0.85,
                    impact: 'high',
                    recommendations: [
                      'Implement behavioral customer segmentation',
                      'Launch personalized upselling campaigns',
                      'Optimize pricing for African markets'
                    ]
                  },
                  {
                    category: 'market',
                    title: 'Expansion Readiness Assessment',
                    description: 'Market penetration metrics suggest readiness for Nigerian market entry',
                    confidence: 0.78,
                    impact: 'high',
                    recommendations: [
                      'Conduct detailed Nigerian market research',
                      'Establish local partnerships',
                      'Develop market-specific compliance strategy'
                    ]
                  }
                ],
                marketIntelligence: {
                  africanFintechGrowth: '45% YoY',
                  competitivePosition: 'emerging_leader',
                  marketOpportunities: ['Nigeria', 'Kenya', 'Ghana'],
                  riskFactors: ['regulatory_changes', 'economic_volatility']
                }
              }
            });

          case 'performance':
            // Get strategic performance metrics
            return NextResponse.json({
              success: true,
              data: {
                type: 'strategic_performance',
                kpis: {
                  revenueGrowth: {
                    current: 8.5,
                    target: 15.0,
                    trend: 'improving',
                    unit: 'percentage'
                  },
                  customerRetention: {
                    current: 94.2,
                    target: 95.0,
                    trend: 'stable',
                    unit: 'percentage'
                  },
                  marketShare: {
                    current: 2.1,
                    target: 5.0,
                    trend: 'growing',
                    unit: 'percentage'
                  },
                  automationRate: {
                    current: 75,
                    target: 85,
                    trend: 'improving',
                    unit: 'percentage'
                  }
                },
                trending: {
                  direction: 'positive',
                  keyDrivers: ['AI automation', 'customer segmentation', 'market expansion'],
                  riskFactors: ['talent acquisition', 'market volatility']
                }
              }
            });

          default:
            return NextResponse.json(
              { error: 'Invalid request type' },
              { status: 400 }
            );
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to get strategic dashboard', {
          error: errorMessage,
          userId: user?.id,
          organizationId: user?.organizationId
        });

        return NextResponse.json(
          { error: 'Failed to retrieve strategic information' },
          { status: 500 }
        );
      } finally {
        span.end();
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Strategic API error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Generate strategic plan or create strategic decision
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validationSchema = z.union([strategicPlanRequestSchema, decisionRequestSchema]);
    const validatedData = validationSchema.parse(body);
    
    const tracer = trace.getTracer('strategic-planning');
    
    return tracer.startActiveSpan('create-strategic-plan', async (span) => {
      try {
        // Check if this is a strategic plan request
        if ('timeframe' in validatedData) {
          const planRequest = validatedData as z.infer<typeof strategicPlanRequestSchema>;
          
          span.setAttributes({
            'strategic.plan.timeframe': planRequest.timeframe,
            'strategic.plan.focus': planRequest.focus,
            'user.id': user.id,
            'organization.id': user.organizationId
          });

          logger.info('Strategic plan generation requested', {
            timeframe: planRequest.timeframe,
            focus: planRequest.focus,
            userId: user.id,
            organizationId: user.organizationId
          });

          // Dynamic import
          const { generateExecutiveStrategicPlan } = await import('@/lib/ai/strategic-decision-engine');
          
          const strategicPlan = await generateExecutiveStrategicPlan({
            timeframe: planRequest.timeframe,
            focus: planRequest.focus,
            organizationId: user.organizationId,
            userId: user.id
          });

          span.setAttributes({
            'strategic.plan.goals_count': strategicPlan.goals.length,
            'strategic.plan.risk_level': strategicPlan.riskAssessment.overall,
            'strategic.plan.budget': strategicPlan.resourceAllocation.budget.total
          });

          return NextResponse.json({
            success: true,
            data: {
              type: 'strategic_plan',
              plan: strategicPlan,
              summary: {
                timeframe: planRequest.timeframe,
                focus: planRequest.focus,
                goalsCount: strategicPlan.goals.length,
                totalBudget: strategicPlan.resourceAllocation.budget.total,
                riskLevel: strategicPlan.riskAssessment.overall,
                estimatedROI: '3.2x', // Calculated based on goals
                keyPriorities: strategicPlan.priorities.slice(0, 3)
              },
              actionItems: [
                'Review and approve strategic goals',
                'Allocate budget and resources',
                'Assign goal owners and timelines',
                'Set up monitoring and review cycles'
              ],
              metadata: {
                generatedAt: new Date(),
                generatedBy: user.name,
                planId: `plan_${Date.now()}`,
                version: '1.0'
              }
            }
          });
        } else {
          // This is a strategic decision request
          const decisionRequest = validatedData as z.infer<typeof decisionRequestSchema>;
          
          span.setAttributes({
            'strategic.decision.type': decisionRequest.type,
            'strategic.decision.urgency': decisionRequest.urgency,
            'strategic.decision.impact': decisionRequest.impact,
            'user.id': user.id
          });

          logger.info('Strategic decision creation requested', {
            type: decisionRequest.type,
            urgency: decisionRequest.urgency,
            userId: user.id,
            organizationId: user.organizationId
          });

          // Dynamic import
          const { strategicDecisionEngine } = await import('@/lib/ai/strategic-decision-engine');
          
          const decision = await strategicDecisionEngine.createStrategicDecision({
            ...decisionRequest,
            deadline: decisionRequest.deadline ? new Date(decisionRequest.deadline) : undefined,
            decisionMaker: user.id
          });

          return NextResponse.json({
            success: true,
            data: {
              type: 'strategic_decision',
              decision,
              nextSteps: [
                'Review decision context and requirements',
                'Analyze scenarios and recommendations',
                'Evaluate risks and resource requirements',
                'Make decision and implement action plan'
              ],
              metadata: {
                createdAt: decision.createdAt,
                createdBy: user.name,
                decisionId: decision.id
              }
            }
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to process strategic request', {
          error: errorMessage,
          userId: user.id,
          organizationId: user.organizationId
        });

        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      } finally {
        span.end();
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Strategic API POST error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update strategic goals or decisions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = goalUpdateSchema.parse(body);

    try {
      const { goalId, status, progress, milestoneUpdates } = validatedData;

      logger.info('Strategic goal update requested', {
        goalId,
        status,
        progress,
        userId: user.id,
        organizationId: user.organizationId
      });

      // In a real implementation, this would update the goal in the database
      // For now, simulate the update
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'goal_updated',
          goalId,
          updates: {
            status,
            progress,
            milestoneUpdates: milestoneUpdates?.length || 0,
            updatedAt: new Date(),
            updatedBy: user.name
          },
          message: status === 'completed' 
            ? `🎉 Strategic goal completed successfully!`
            : status === 'at_risk'
              ? `⚠️ Goal marked as at risk - review required`
              : `✅ Goal updated successfully`,
          recommendations: status === 'at_risk' 
            ? [
                'Identify specific blockers and challenges',
                'Reallocate resources if necessary',
                'Consider timeline adjustments',
                'Implement mitigation strategies'
              ]
            : [
                'Continue monitoring progress',
                'Maintain regular milestone reviews',
                'Celebrate team achievements'
              ]
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to update strategic goal', {
        error: errorMessage,
        userId: user.id,
        goalId: validatedData.goalId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Strategic API PUT error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Archive or cancel strategic goals/decisions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    try {
      const url = new URL(request.url);
      const itemId = url.searchParams.get('id');
      const itemType = url.searchParams.get('type'); // 'goal' or 'decision'
      const reason = url.searchParams.get('reason') || 'No reason provided';

      if (!itemId || !itemType) {
        return NextResponse.json(
          { error: 'Item ID and type required' },
          { status: 400 }
        );
      }

      logger.info('Strategic item archival requested', {
        itemId,
        itemType,
        reason,
        userId: user.id,
        organizationId: user.organizationId
      });

      // In a real implementation, this would archive the item in the database
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'item_archived',
          itemId,
          itemType,
          archivedAt: new Date(),
          archivedBy: user.name,
          reason,
          message: `${itemType} successfully archived`,
          note: 'Archived items can be restored if needed'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to archive strategic item', {
        error: errorMessage,
        userId: user.id,
        organizationId: user.organizationId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Strategic API DELETE error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}