/**
 * Customer Lifetime Value (CLV) Prediction API Endpoints
 * ======================================================
 * 
 * API endpoints for CLV prediction model operations including prediction,
 * training, and model management with multiple time horizons
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getCLVPredictionModel, 
  predictCustomerCLV, 
  trainCLVModel 
} from '@/lib/ml/customer-lifetime-value-model';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const PredictCLVSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  organizationId: z.string().optional(),
  timeHorizon: z.enum(['12_months', '24_months', '36_months']).default('24_months')
});

const BatchPredictCLVSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact ID is required').max(50, 'Maximum 50 contacts per batch'),
  organizationId: z.string().optional(),
  timeHorizon: z.enum(['12_months', '24_months', '36_months']).default('24_months')
});

const TrainCLVModelSchema = z.object({
  organizationId: z.string().optional(),
  timeHorizon: z.enum(['12_months', '24_months', '36_months']).default('24_months'),
  sampleSize: z.number().min(100).max(10000).default(1000)
});

/**
 * Predict CLV for customers
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
    const action = searchParams.get('action') || 'predict';

    const body = await request.json();

    if (action === 'predict') {
      return await handleSingleCLVPrediction(body, session);
    } else if (action === 'batch') {
      return await handleBatchCLVPrediction(body, session);
    } else if (action === 'train') {
      return await handleCLVModelTraining(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=predict, ?action=batch, or ?action=train' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process CLV prediction request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process CLV prediction request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get CLV predictions and model information
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
    const action = searchParams.get('action') || 'info';

    if (action === 'info') {
      // Get model information
      return await handleCLVModelInfo(searchParams, session);
    } else if (action === 'predictions') {
      // Get existing predictions
      return await handleGetCLVPredictions(searchParams, session);
    } else if (action === 'segments') {
      // Get value segments analysis
      return await handleValueSegments(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=info, ?action=predictions, or ?action=segments' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get CLV prediction data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get CLV prediction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single CLV prediction
 */
async function handleSingleCLVPrediction(body: any, session: any): Promise<NextResponse> {
  const validationResult = PredictCLVSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid CLV prediction request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactId, organizationId, timeHorizon } = validationResult.data;

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
    const prediction = await predictCustomerCLV(contactId, orgId, timeHorizon);

    logger.info('CLV prediction completed via API', {
      contactId,
      organizationId: orgId,
      predictedCLV: prediction.predictedCLV,
      valueSegment: prediction.valueSegment,
      timeHorizon,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        contactId: prediction.contactId,
        predictedCLV: prediction.predictedCLV,
        confidenceInterval: prediction.confidenceInterval,
        valueSegment: prediction.valueSegment,
        confidence: prediction.confidence,
        contributingFactors: prediction.contributingFactors,
        predictedAt: new Date(), // Use current date since prediction object might not have this field
        modelVersion: prediction.modelVersion,
        timeHorizon: prediction.timeHorizon,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name
        }
      }
    });

  } catch (error) {
    logger.error('Single CLV prediction failed', {
      contactId,
      organizationId: orgId,
      timeHorizon,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to predict CLV',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch CLV predictions
 */
async function handleBatchCLVPrediction(body: any, session: any): Promise<NextResponse> {
  const validationResult = BatchPredictCLVSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid batch CLV prediction request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactIds, organizationId, timeHorizon } = validationResult.data;

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
    const predictions = await Promise.allSettled(
      contactIds.map(contactId => predictCustomerCLV(contactId, orgId, timeHorizon))
    );

    const results = predictions.map((result, index) => {
      if (result.status === 'fulfilled') {
        const prediction = result.value;
        return {
          success: true,
          contactId: prediction.contactId,
          predictedCLV: prediction.predictedCLV,
          confidenceInterval: prediction.confidenceInterval,
          valueSegment: prediction.valueSegment,
          confidence: prediction.confidence,
          contributingFactors: prediction.contributingFactors,
          predictedAt: new Date(), // Use current date since prediction object might not have this field
          timeHorizon: prediction.timeHorizon
        };
      } else {
        return {
          success: false,
          contactId: contactIds[index],
          error: result.reason
        };
      }
    });

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    // Calculate aggregate statistics
    const successfulPredictions = results.filter(r => r.success && 'predictedCLV' in r);
    const totalCLV = successfulPredictions.reduce((sum, p: any) => sum + p.predictedCLV, 0);
    const averageCLV = successful > 0 ? totalCLV / successful : 0;
    
    const valueSegments = successfulPredictions.reduce((acc: any, p: any) => {
      acc[p.valueSegment] = (acc[p.valueSegment] || 0) + 1;
      return acc;
    }, {});

    logger.info('Batch CLV prediction completed via API', {
      totalContacts: contactIds.length,
      successful,
      failed,
      averageCLV: averageCLV.toFixed(2),
      totalCLV: totalCLV.toFixed(2),
      timeHorizon,
      organizationId: orgId,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        totalContacts: contactIds.length,
        successful,
        failed,
        successRate: (successful / contactIds.length * 100).toFixed(1) + '%',
        summary: {
          totalCLV: totalCLV.toFixed(2),
          averageCLV: averageCLV.toFixed(2),
          valueSegments,
          timeHorizon
        },
        predictions: results,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name,
          processedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Batch CLV prediction failed', {
      contactCount: contactIds.length,
      organizationId: orgId,
      timeHorizon,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process batch CLV predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CLV model training
 */
async function handleCLVModelTraining(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can train models
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for model training' },
      { status: 403 }
    );
  }

  const validationResult = TrainCLVModelSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid CLV training request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { organizationId, timeHorizon, sampleSize } = validationResult.data;

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
    const metrics = await trainCLVModel(orgId, timeHorizon, sampleSize);

    logger.info('CLV model training completed via API', {
      organizationId: orgId,
      timeHorizon,
      sampleSize,
      r2Score: metrics.r2Score,
      mape: metrics.mape,
      trainingSamples: metrics.trainingSamples,
      trainedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          accuracy: metrics.accuracy,
          mape: metrics.mape,
          rmse: metrics.rmse,
          r2Score: metrics.r2Score,
          trainingSamples: metrics.trainingSamples,
          validationSamples: metrics.validationSamples
        },
        featureImportance: metrics.featureImportance,
        modelVersion: metrics.modelVersion,
        timeHorizon,
        lastTrainedAt: metrics.lastTrainedAt,
        metadata: {
          trainedBy: session.user.id,
          trainedByName: session.user.name,
          organizationId: orgId,
          sampleSize
        }
      }
    });

  } catch (error) {
    logger.error('CLV model training failed', {
      organizationId: orgId,
      timeHorizon,
      sampleSize,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to train CLV model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CLV model information request
 */
async function handleCLVModelInfo(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const timeHorizon = searchParams.get('timeHorizon') || '24_months';

  try {
    const model = getCLVPredictionModel();
    
    // Get model status and information
    const modelInfo = {
      available: true,
      modelVersion: 'clv-ml-v1.0',
      description: 'Multi-model CLV prediction system using Linear, Polynomial, and Random Forest regression',
      timeHorizons: ['12_months', '24_months', '36_months'],
      defaultTimeHorizon: '24_months',
      features: [
        'Transaction history and patterns',
        'Customer engagement metrics', 
        'Behavioral indicators and trends',
        'Demographic and profile data',
        'Seasonal purchase patterns',
        'African market-specific factors'
      ],
      valueSegments: ['high', 'medium', 'low', 'prospect'],
      modelTypes: ['linear', 'polynomial', 'random_forest'],
      supportedActions: ['predict', 'batch', 'train'],
      organizationId,
      timeHorizon,
      lastUpdated: new Date()
    };

    return NextResponse.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    logger.error('Failed to get CLV model info', {
      organizationId,
      timeHorizon,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get CLV model information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get CLV predictions request
 */
async function handleGetCLVPredictions(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const valueSegment = searchParams.get('valueSegment');
  const timeHorizon = searchParams.get('timeHorizon');
  const limit = Number.parseInt(searchParams.get('limit') || '50');
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  try {
    // Get predictions from database
    const whereClause: any = { organizationId };
    
    if (valueSegment && ['high', 'medium', 'low', 'prospect'].includes(valueSegment)) {
      whereClause.valueSegment = valueSegment;
    }
    
    if (timeHorizon && ['12_months', '24_months', '36_months'].includes(timeHorizon)) {
      whereClause.timeHorizon = timeHorizon;
    }

    const predictions = await prisma.lifetimeValuePrediction.findMany({
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
            email: true,
            phone: true
          }
        }
      }
    });

    const total = await prisma.lifetimeValuePrediction.count({
      where: whereClause
    });

    // Calculate summary statistics
    const totalCLV = predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    const averageCLV = predictions.length > 0 ? totalCLV / predictions.length : 0;
    
    const segmentCounts = predictions.reduce((acc: any, p) => {
      acc[p.valueSegment] = (acc[p.valueSegment] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictions.map(p => {
          // Parse segments JSON if exists
          const segments = p.segments ? JSON.parse(p.segments) : {};
          return {
            contactId: p.contactId,
            contact: p.contact,
            predictedCLV: p.predictedValue,
            confidenceInterval: segments.confidenceInterval || { lower: 0, upper: 0 },
            valueSegment: segments.valueSegment || 'unknown',
            confidence: p.confidenceLevel,
            contributingFactors: segments.contributingFactors || [],
            predictedAt: p.createdAt,
            modelVersion: segments.modelVersion || '1.0.0',
            timeHorizon: `${p.timeframe}_months` as '12_months' | '24_months' | '36_months'
          };
        }),
        summary: {
          totalPredictions: total,
          displayedPredictions: predictions.length,
          totalCLV: totalCLV.toFixed(2),
          averageCLV: averageCLV.toFixed(2),
          segmentBreakdown: segmentCounts
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + predictions.length < total
        },
        filters: {
          organizationId,
          valueSegment: valueSegment || 'all',
          timeHorizon: timeHorizon || 'all'
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get CLV predictions', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get CLV predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle value segments analysis
 */
async function handleValueSegments(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const timeHorizon = searchParams.get('timeHorizon') || '24_months';

  try {
    const whereClause: any = { organizationId };
    
    if (timeHorizon !== 'all') {
      whereClause.timeHorizon = timeHorizon;
    }

    // Get segment statistics
    const segmentStats = await prisma.lifetimeValuePrediction.groupBy({
      by: ['valueSegment'],
      where: whereClause,
      _count: {
        contactId: true
      },
      _avg: {
        predictedValue: true,
        confidence: true
      },
      _sum: {
        predictedValue: true
      }
    });

    const totalCustomers = segmentStats.reduce((sum, stat) => sum + stat._count.contactId, 0);
    const totalCLV = segmentStats.reduce((sum, stat) => sum + (stat._sum.predictedValue || 0), 0);

    const segments = segmentStats.map(stat => ({
      segment: stat.valueSegment,
      customerCount: stat._count.contactId,
      percentage: totalCustomers > 0 ? (stat._count.contactId / totalCustomers * 100).toFixed(1) + '%' : '0%',
      averageCLV: stat._avg.predictedValue?.toFixed(2) || '0.00',
      totalCLV: (stat._sum.predictedValue || 0).toFixed(2),
      averageConfidence: stat._avg.confidence?.toFixed(3) || '0.000',
      clvContribution: totalCLV > 0 ? ((stat._sum.predictedValue || 0) / totalCLV * 100).toFixed(1) + '%' : '0%'
    }));

    // Sort by CLV value (high to low)
    const segmentOrder = { high: 4, medium: 3, low: 2, prospect: 1 };
    segments.sort((a, b) => (segmentOrder as any)[b.segment] - (segmentOrder as any)[a.segment]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalCLV: totalCLV.toFixed(2),
          averageCLV: totalCustomers > 0 ? (totalCLV / totalCustomers).toFixed(2) : '0.00',
          timeHorizon
        },
        segments,
        insights: [
          `${segments.find(s => s.segment === 'high')?.percentage || '0%'} of customers are high-value (CLV ≥ $10k)`,
          `Top 20% of customers likely contribute ${segments.find(s => s.segment === 'high')?.clvContribution || '0%'} of total CLV`,
          `Average CLV across all segments: $${totalCustomers > 0 ? (totalCLV / totalCustomers).toFixed(2) : '0.00'}`,
          'Focus retention efforts on high and medium value segments for maximum ROI'
        ],
        metadata: {
          organizationId,
          timeHorizon,
          generatedAt: new Date(),
          generatedBy: session.user.id
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get value segments analysis', {
      organizationId,
      timeHorizon,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get value segments analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}