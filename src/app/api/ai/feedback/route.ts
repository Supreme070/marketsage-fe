/**
 * AI Feedback & Learning API Endpoints
 * ====================================
 * 
 * API endpoints for collecting feedback, analyzing performance, and managing
 * continuous learning for AI models and decision-making systems.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getFeedbackLearningSystem,
  collectAIFeedback,
  analyzeModelPerformance,
  type FeedbackSource,
  type FeedbackType
} from '@/lib/ai/feedback-learning-system';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CollectFeedbackSchema = z.object({
  actionPlanId: z.string().min(1, 'Action plan ID is required'),
  contactId: z.string().min(1, 'Contact ID is required'),
  source: z.enum(['human', 'customer', 'system', 'outcome']),
  type: z.enum(['decision_quality', 'outcome_satisfaction', 'customer_response', 'business_impact', 'risk_accuracy', 'timing_appropriateness']),
  rating: z.number().min(1).max(5),
  details: z.object({
    category: z.string(),
    specificFeedback: z.string(),
    suggestedImprovement: z.string().optional(),
    contextFactors: z.array(z.string())
  }),
  metadata: z.object({
    feedbackProvider: z.string().optional(),
    automatedSource: z.string().optional(),
    outcomeMetrics: z.record(z.number()).optional()
  }).optional()
});

const AnalyzePerformanceSchema = z.object({
  modelType: z.enum(['churn', 'clv', 'segmentation', 'governance']),
  days: z.number().min(1).max(365).default(30),
  organizationId: z.string().optional()
});

/**
 * Handle feedback collection and learning operations
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
    const action = searchParams.get('action') || 'collect-feedback';

    const body = await request.json();

    if (action === 'collect-feedback') {
      return await handleCollectFeedback(body, session);
    } else if (action === 'analyze-performance') {
      return await handleAnalyzePerformance(body, session);
    } else if (action === 'trigger-retraining') {
      return await handleTriggerRetraining(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=collect-feedback, ?action=analyze-performance, or ?action=trigger-retraining' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process feedback request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process feedback request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get feedback data and learning insights
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
    const action = searchParams.get('action') || 'insights';

    if (action === 'insights') {
      return await handleGetInsights(searchParams, session);
    } else if (action === 'feedback-history') {
      return await handleGetFeedbackHistory(searchParams, session);
    } else if (action === 'performance-metrics') {
      return await handleGetPerformanceMetrics(searchParams, session);
    } else if (action === 'retraining-status') {
      return await handleGetRetrainingStatus(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=insights, ?action=feedback-history, ?action=performance-metrics, or ?action=retraining-status' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get feedback data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get feedback data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle feedback collection
 */
async function handleCollectFeedback(body: any, session: any): Promise<NextResponse> {
  const validationResult = CollectFeedbackSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid feedback collection request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { actionPlanId, contactId, source, type, rating, details, metadata } = validationResult.data;
  const organizationId = session.user.organizationId;

  try {
    const feedbackMetadata = {
      ...metadata,
      feedbackProvider: source === 'human' ? session.user.id : metadata?.feedbackProvider,
      timestamp: new Date()
    };

    const feedback = await collectAIFeedback(
      organizationId,
      actionPlanId,
      contactId,
      source,
      type,
      rating,
      details,
      feedbackMetadata
    );

    logger.info('Feedback collected via API', {
      feedbackId: feedback.id,
      actionPlanId,
      source,
      type,
      rating,
      collectedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        feedbackId: feedback.id,
        rating: feedback.rating,
        confidence: feedback.confidence,
        impactOnModel: feedback.impactOnModel,
        processed: feedback.processed,
        metadata: {
          collectedBy: session.user.id,
          collectedByName: session.user.name,
          collectedAt: feedback.metadata.timestamp
        }
      }
    });

  } catch (error) {
    logger.error('Failed to collect feedback', {
      actionPlanId,
      source,
      type,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to collect feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle performance analysis
 */
async function handleAnalyzePerformance(body: any, session: any): Promise<NextResponse> {
  const validationResult = AnalyzePerformanceSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid performance analysis request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { modelType, days, organizationId } = validationResult.data;

  // Use session organization if not provided
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const metrics = await analyzeModelPerformance(orgId, modelType, days);

    logger.info('Model performance analyzed via API', {
      organizationId: orgId,
      modelType,
      timeWindow: days,
      overallAccuracy: metrics.accuracy.overall,
      analyzedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        insights: [
          `Overall accuracy: ${(metrics.accuracy.overall * 100).toFixed(1)}%`,
          `Average user rating: ${metrics.feedbackMetrics.averageRating.toFixed(1)}/5`,
          `Satisfaction score: ${(metrics.feedbackMetrics.satisfactionScore * 100).toFixed(1)}%`,
          `Performance trend: ${metrics.accuracy.trend}`,
          metrics.recommendations.retrainingNeeded ? 'Retraining recommended' : 'Model performing well'
        ],
        metadata: {
          analyzedBy: session.user.id,
          analyzedByName: session.user.name,
          analyzedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to analyze model performance', {
      organizationId: orgId,
      modelType,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to analyze model performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle retraining trigger
 */
async function handleTriggerRetraining(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can trigger retraining
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for model retraining' },
      { status: 403 }
    );
  }

  const { modelType, reason, organizationId } = body;

  if (!modelType || !['churn', 'clv', 'segmentation'].includes(modelType)) {
    return NextResponse.json(
      { error: 'Valid model type is required (churn, clv, segmentation)' },
      { status: 400 }
    );
  }

  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const learningSystem = getFeedbackLearningSystem();
    await learningSystem.triggerModelRetraining(
      orgId, 
      modelType, 
      reason || `Manual retraining triggered by ${session.user.name}`
    );

    logger.info('Model retraining triggered via API', {
      organizationId: orgId,
      modelType,
      reason,
      triggeredBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `${modelType} model retraining triggered successfully`,
        modelType,
        organizationId: orgId,
        reason,
        metadata: {
          triggeredBy: session.user.id,
          triggeredByName: session.user.name,
          triggeredAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to trigger model retraining', {
      organizationId: orgId,
      modelType,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to trigger model retraining',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get learning insights
 */
async function handleGetInsights(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const category = searchParams.get('category');
  const limit = Number.parseInt(searchParams.get('limit') || '20');

  try {
    const whereClause: any = { organizationId };
    
    if (category && ['pattern', 'correlation', 'improvement', 'risk'].includes(category)) {
      whereClause.category = category;
    }

    const insights = await prisma.aI_LearningInsight.findMany({
      where: whereClause,
      orderBy: [
        { impactScore: 'desc' },
        { confidence: 'desc' }
      ],
      take: Math.min(limit, 100)
    });

    const totalInsights = await prisma.aI_LearningInsight.count({
      where: whereClause
    });

    // Calculate summary statistics
    const avgConfidence = insights.length > 0 ? 
      insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0;
    
    const avgImpactScore = insights.length > 0 ? 
      insights.reduce((sum, i) => sum + i.impactScore, 0) / insights.length : 0;

    const categoryBreakdown = insights.reduce((acc: any, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        insights: insights.map(i => ({
          id: i.id,
          category: i.category,
          title: i.title,
          description: i.description,
          confidence: i.confidence,
          evidenceCount: i.evidenceCount,
          impactScore: i.impactScore,
          recommendations: i.recommendations,
          actionableSteps: i.actionableSteps,
          validatedAt: i.validatedAt,
          implementedAt: i.implementedAt,
          createdAt: i.createdAt
        })),
        summary: {
          totalInsights,
          averageConfidence: avgConfidence.toFixed(3),
          averageImpactScore: avgImpactScore.toFixed(3),
          categoryBreakdown,
          highImpactInsights: insights.filter(i => i.impactScore > 0.7).length
        },
        filters: {
          organizationId,
          category: category || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get learning insights', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get learning insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get feedback history
 */
async function handleGetFeedbackHistory(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const source = searchParams.get('source');
  const type = searchParams.get('type');
  const limit = Number.parseInt(searchParams.get('limit') || '50');
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  try {
    const whereClause: any = { organizationId };
    
    if (source && ['human', 'customer', 'system', 'outcome'].includes(source)) {
      whereClause.source = source;
    }
    
    if (type && ['decision_quality', 'outcome_satisfaction', 'customer_response', 'business_impact', 'risk_accuracy', 'timing_appropriateness'].includes(type)) {
      whereClause.type = type;
    }

    const feedback = await prisma.aI_Feedback.findMany({
      where: whereClause,
      orderBy: { 'metadata.timestamp': 'desc' },
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

    const total = await prisma.aI_Feedback.count({
      where: whereClause
    });

    // Calculate summary statistics
    const avgRating = feedback.length > 0 ? 
      feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;
    
    const satisfactionRate = feedback.length > 0 ? 
      feedback.filter(f => f.rating >= 4).length / feedback.length : 0;

    const sourceBreakdown = feedback.reduce((acc: any, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        feedback: feedback.map(f => ({
          id: f.id,
          actionPlanId: f.actionPlanId,
          contactId: f.contactId,
          contact: f.contact,
          source: f.source,
          type: f.type,
          rating: f.rating,
          confidence: f.confidence,
          details: f.details,
          processed: f.processed,
          impactOnModel: f.impactOnModel,
          timestamp: (f.metadata as any)?.timestamp
        })),
        summary: {
          total,
          averageRating: avgRating.toFixed(1),
          satisfactionRate: (satisfactionRate * 100).toFixed(1) + '%',
          sourceBreakdown,
          processedCount: feedback.filter(f => f.processed).length
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + feedback.length < total
        },
        filters: {
          organizationId,
          source: source || 'all',
          type: type || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get feedback history', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get feedback history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get performance metrics
 */
async function handleGetPerformanceMetrics(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const modelType = searchParams.get('modelType');
  const days = Number.parseInt(searchParams.get('days') || '30');

  try {
    const whereClause: any = { organizationId };
    
    if (modelType && ['churn', 'clv', 'segmentation', 'governance'].includes(modelType)) {
      whereClause.modelType = modelType;
    }

    const metrics = await prisma.aI_ModelPerformance.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          metrics: [],
          summary: {
            noData: true,
            message: 'No performance metrics available yet'
          }
        }
      });
    }

    // Calculate trend analysis
    const latestMetric = metrics[0];
    const previousMetric = metrics[1];
    
    let trend = 'stable';
    if (previousMetric) {
      const latestAccuracy = (latestMetric.accuracy as any)?.overall || 0;
      const previousAccuracy = (previousMetric.accuracy as any)?.overall || 0;
      
      if (latestAccuracy > previousAccuracy + 0.05) trend = 'improving';
      else if (latestAccuracy < previousAccuracy - 0.05) trend = 'declining';
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics: metrics.map(m => ({
          id: m.id,
          modelType: m.modelType,
          timeWindow: m.timeWindow,
          accuracy: m.accuracy,
          feedbackMetrics: m.feedbackMetrics,
          businessImpact: m.businessImpact,
          recommendations: m.recommendations,
          createdAt: m.createdAt
        })),
        summary: {
          latestAccuracy: ((latestMetric.accuracy as any)?.overall * 100).toFixed(1) + '%',
          trend,
          retrainingRecommended: (latestMetric.recommendations as any)?.retrainingNeeded || false,
          totalMetrics: metrics.length
        },
        filters: {
          organizationId,
          modelType: modelType || 'all',
          days
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get performance metrics', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get retraining status
 */
async function handleGetRetrainingStatus(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  try {
    const retrainingTasks = await prisma.aI_RetrainingTask.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const activeJobs = retrainingTasks.filter(t => t.status === 'running').length;
    const queuedJobs = retrainingTasks.filter(t => t.status === 'queued').length;
    const completedJobs = retrainingTasks.filter(t => t.status === 'completed').length;
    const failedJobs = retrainingTasks.filter(t => t.status === 'failed').length;

    return NextResponse.json({
      success: true,
      data: {
        tasks: retrainingTasks.map(t => ({
          id: t.id,
          modelType: t.modelType,
          reason: t.reason,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt,
          startedAt: t.startedAt,
          completedAt: t.completedAt,
          error: t.error
        })),
        summary: {
          active: activeJobs,
          queued: queuedJobs,
          completed: completedJobs,
          failed: failedJobs,
          total: retrainingTasks.length
        },
        status: {
          systemHealthy: failedJobs === 0 && activeJobs <= 3,
          lastRetraining: retrainingTasks.length > 0 ? retrainingTasks[0].createdAt : null,
          averageRetrainingTime: '~15 minutes' // Would calculate from actual data
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get retraining status', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get retraining status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}