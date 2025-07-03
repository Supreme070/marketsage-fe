/**
 * AI Governance API Endpoints
 * ===========================
 * 
 * API endpoints for AI governance operations including decision management,
 * configuration updates, and governance analytics
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getAIGovernanceLayer,
  processHumanGovernanceDecision,
  updateOrganizationGovernanceConfig,
  type GovernanceConfig
} from '@/lib/ai/governance-layer';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const ProcessDecisionSchema = z.object({
  decisionId: z.string().min(1, 'Decision ID is required'),
  humanDecision: z.enum(['approve', 'reject', 'modify']),
  justification: z.string().optional()
});

const UpdateConfigSchema = z.object({
  organizationId: z.string().optional(),
  mode: z.enum(['queue', 'semi_autonomous', 'autonomous', 'emergency_stop']).optional(),
  autoApprovalLimits: z.object({
    maxActions: z.number().min(0).optional(),
    maxValue: z.number().min(0).optional(),
    timeWindow: z.number().min(1).optional()
  }).optional(),
  escalationRules: z.object({
    timeouts: z.object({
      lowPriority: z.number().min(1).optional(),
      mediumPriority: z.number().min(1).optional(),
      highPriority: z.number().min(1).optional()
    }).optional(),
    escalationChain: z.array(z.string()).optional()
  }).optional()
});

/**
 * Handle governance decision operations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'process-decision';

    const body = await request.json();

    if (action === 'process-decision') {
      return await handleProcessDecision(body, session);
    } else if (action === 'update-config') {
      return await handleUpdateConfig(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=process-decision or ?action=update-config' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process governance request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process governance request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get governance data and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'pending-decisions';

    if (action === 'pending-decisions') {
      return await handleGetPendingDecisions(searchParams, session);
    } else if (action === 'config') {
      return await handleGetConfig(searchParams, session);
    } else if (action === 'metrics') {
      return await handleGetMetrics(searchParams, session);
    } else if (action === 'decision-history') {
      return await handleGetDecisionHistory(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=pending-decisions, ?action=config, ?action=metrics, or ?action=decision-history' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get governance data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get governance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle human decision processing
 */
async function handleProcessDecision(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can make governance decisions
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for governance decisions' },
      { status: 403 }
    );
  }

  const validationResult = ProcessDecisionSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid decision processing request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { decisionId, humanDecision, justification } = validationResult.data;

  try {
    const decision = await processHumanGovernanceDecision(
      decisionId,
      humanDecision,
      session.user.id,
      justification
    );

    logger.info('Human governance decision processed via API', {
      decisionId,
      humanDecision,
      finalStatus: decision.status,
      processedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        decisionId: decision.id,
        actionPlanId: decision.actionPlanId,
        humanDecision: decision.humanDecision,
        finalStatus: decision.status,
        justification: decision.justification,
        decidedAt: decision.decidedAt,
        metadata: {
          processedBy: session.user.id,
          processedByName: session.user.name
        }
      }
    });

  } catch (error) {
    logger.error('Failed to process governance decision', {
      decisionId,
      humanDecision,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process governance decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle governance configuration updates
 */
async function handleUpdateConfig(body: any, session: any): Promise<NextResponse> {
  // Only SUPER_ADMIN can update governance configuration
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Insufficient permissions - SUPER_ADMIN access required for configuration updates' },
      { status: 403 }
    );
  }

  const validationResult = UpdateConfigSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid configuration update request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const updates = validationResult.data;
  const organizationId = updates.organizationId || session.user.organizationId;

  try {
    const updatedConfig = await updateOrganizationGovernanceConfig(organizationId, updates);

    logger.info('Governance configuration updated via API', {
      organizationId,
      mode: updatedConfig.mode,
      updatedBy: session.user.id,
      changes: Object.keys(updates)
    });

    return NextResponse.json({
      success: true,
      data: {
        organizationId: updatedConfig.organizationId,
        mode: updatedConfig.mode,
        autoApprovalLimits: updatedConfig.autoApprovalLimits,
        escalationRules: updatedConfig.escalationRules,
        trustedAI: updatedConfig.trustedAI,
        complianceSettings: updatedConfig.complianceSettings,
        metadata: {
          updatedBy: session.user.id,
          updatedByName: session.user.name,
          updatedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to update governance configuration', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to update governance configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get pending decisions
 */
async function handleGetPendingDecisions(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const limit = Number.parseInt(searchParams.get('limit') || '20');
  const offset = Number.parseInt(searchParams.get('offset') || '0');
  const riskLevel = searchParams.get('riskLevel');

  try {
    const whereClause: any = {
      organizationId,
      status: {
        in: ['pending', 'escalated']
      }
    };

    if (riskLevel && ['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
      whereClause.riskLevel = riskLevel;
    }

    const decisions = await prisma.aI_GovernanceDecision.findMany({
      where: whereClause,
      orderBy: [
        { riskLevel: 'desc' },
        { createdAt: 'asc' }
      ],
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.aI_GovernanceDecision.count({
      where: whereClause
    });

    // Calculate time remaining for each decision
    const now = new Date();
    const decisionsWithTimeRemaining = decisions.map(d => ({
      id: d.id,
      actionPlanId: d.actionPlanId,
      contactId: d.contactId,
      contact: d.contact,
      decisionType: d.decisionType,
      riskLevel: d.riskLevel,
      confidenceLevel: d.confidenceLevel,
      reasoning: d.reasoning,
      aiRecommendation: d.aiRecommendation,
      metadata: d.metadata,
      status: d.status,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
      timeRemaining: Math.max(0, Math.floor((d.expiresAt.getTime() - now.getTime()) / (1000 * 60))), // Minutes remaining
      isExpired: now > d.expiresAt
    }));

    // Group by risk level for summary
    const riskSummary = decisionsWithTimeRemaining.reduce((acc: any, d) => {
      acc[d.riskLevel] = (acc[d.riskLevel] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        decisions: decisionsWithTimeRemaining,
        summary: {
          total,
          pending: decisionsWithTimeRemaining.filter(d => d.status === 'pending').length,
          escalated: decisionsWithTimeRemaining.filter(d => d.status === 'escalated').length,
          expired: decisionsWithTimeRemaining.filter(d => d.isExpired).length,
          riskBreakdown: riskSummary
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + decisions.length < total
        },
        filters: {
          organizationId,
          riskLevel: riskLevel || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get pending governance decisions', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get pending decisions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get governance configuration
 */
async function handleGetConfig(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  try {
    const governance = getAIGovernanceLayer();
    const config = await (governance as any).getGovernanceConfig(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        organizationId: config.organizationId,
        mode: config.mode,
        riskThresholds: config.riskThresholds,
        autoApprovalLimits: config.autoApprovalLimits,
        requiresApproval: config.requiresApproval,
        escalationRules: config.escalationRules,
        trustedAI: config.trustedAI,
        complianceSettings: config.complianceSettings,
        metadata: {
          retrievedBy: session.user.id,
          retrievedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get governance configuration', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get governance configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get governance metrics
 */
async function handleGetMetrics(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const days = Number.parseInt(searchParams.get('days') || '30');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    const governance = getAIGovernanceLayer();
    const metrics = await governance.getGovernanceMetrics(organizationId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        insights: [
          `${metrics.actionCounts.total} total decisions made in ${days} days`,
          `${((metrics.actionCounts.autoApproved / Math.max(metrics.actionCounts.total, 1)) * 100).toFixed(1)}% auto-approved`,
          `Average decision time: ${metrics.averageDecisionTime.toFixed(1)} minutes`,
          `AI recommendation accuracy: ${(metrics.accuracyMetrics.aiRecommendationAccuracy * 100).toFixed(1)}%`,
          `Compliance score: ${(metrics.complianceScore * 100).toFixed(1)}%`
        ],
        metadata: {
          generatedBy: session.user.id,
          generatedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get governance metrics', {
      organizationId,
      days,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get governance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get decision history
 */
async function handleGetDecisionHistory(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const limit = Number.parseInt(searchParams.get('limit') || '50');
  const offset = Number.parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');
  const decisionMaker = searchParams.get('decisionMaker');

  try {
    const whereClause: any = { organizationId };

    if (status && ['approved', 'rejected', 'expired'].includes(status)) {
      whereClause.status = status;
    }

    if (decisionMaker && ['ai', 'human', 'system'].includes(decisionMaker)) {
      whereClause.decisionMaker = decisionMaker;
    }

    const decisions = await prisma.aI_GovernanceDecision.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.aI_GovernanceDecision.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      data: {
        decisions: decisions.map(d => ({
          id: d.id,
          actionPlanId: d.actionPlanId,
          contactId: d.contactId,
          contact: d.contact,
          decisionType: d.decisionType,
          riskLevel: d.riskLevel,
          aiRecommendation: d.aiRecommendation,
          humanDecision: d.humanDecision,
          decisionMaker: d.decisionMaker,
          decisionMakerId: d.decisionMakerId,
          justification: d.justification,
          status: d.status,
          createdAt: d.createdAt,
          decidedAt: d.decidedAt,
          decisionTime: d.decidedAt ? 
            Math.floor((d.decidedAt.getTime() - d.createdAt.getTime()) / (1000 * 60)) : null
        })),
        summary: {
          total,
          byStatus: decisions.reduce((acc: any, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
          }, {}),
          byDecisionMaker: decisions.reduce((acc: any, d) => {
            acc[d.decisionMaker] = (acc[d.decisionMaker] || 0) + 1;
            return acc;
          }, {})
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + decisions.length < total
        },
        filters: {
          organizationId,
          status: status || 'all',
          decisionMaker: decisionMaker || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get governance decision history', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get decision history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}