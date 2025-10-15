/**
 * Churn Prediction API Endpoints
 * ==============================
 * 
 * API endpoints for churn prediction model operations
 * including prediction, training, and model management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getChurnPredictionModel, 
  predictCustomerChurn, 
  trainChurnModel 
} from '@/lib/ml/churn-prediction-model';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const PredictChurnSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  organizationId: z.string().optional()
});

const BatchPredictChurnSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact ID is required').max(100, 'Maximum 100 contacts per batch'),
  organizationId: z.string().optional()
});

const TrainModelSchema = z.object({
  organizationId: z.string().optional(),
  sampleSize: z.number().min(100).max(10000).default(1000)
});

/**
 * Predict churn for customers
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
      return await handleSinglePrediction(body, session);
    } else if (action === 'batch') {
      return await handleBatchPrediction(body, session);
    } else if (action === 'train') {
      return await handleModelTraining(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=predict, ?action=batch, or ?action=train' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process churn prediction request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process churn prediction request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get churn predictions and model information
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
      return await handleModelInfo(searchParams, session);
    } else if (action === 'predictions') {
      // Get existing predictions
      return await handleGetPredictions(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=info or ?action=predictions' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get churn prediction data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get churn prediction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single churn prediction
 */
async function handleSinglePrediction(body: any, session: any): Promise<NextResponse> {
  const validationResult = PredictChurnSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid prediction request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactId, organizationId } = validationResult.data;

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
    const prediction = await predictCustomerChurn(contactId, orgId);

    logger.info('Churn prediction completed via API', {
      contactId,
      organizationId: orgId,
      probability: prediction.churnProbability,
      riskLevel: prediction.riskLevel,
      requestedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        contactId: prediction.contactId,
        churnProbability: prediction.churnProbability,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        reasoningFactors: prediction.reasoningFactors,
        predictedAt: prediction.predictedAt,
        modelVersion: prediction.modelVersion,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name
        }
      }
    });

  } catch (error) {
    logger.error('Single churn prediction failed', {
      contactId,
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to predict churn',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch churn predictions
 */
async function handleBatchPrediction(body: any, session: any): Promise<NextResponse> {
  const validationResult = BatchPredictChurnSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid batch prediction request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { contactIds, organizationId } = validationResult.data;

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
      contactIds.map(contactId => predictCustomerChurn(contactId, orgId))
    );

    const results = predictions.map((result, index) => {
      if (result.status === 'fulfilled') {
        const prediction = result.value;
        return {
          success: true,
          contactId: prediction.contactId,
          churnProbability: prediction.churnProbability,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          reasoningFactors: prediction.reasoningFactors,
          predictedAt: prediction.predictedAt
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

    logger.info('Batch churn prediction completed via API', {
      totalContacts: contactIds.length,
      successful,
      failed,
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
        predictions: results,
        metadata: {
          requestedBy: session.user.id,
          requestedByName: session.user.name,
          processedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Batch churn prediction failed', {
      contactCount: contactIds.length,
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process batch predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle model training
 */
async function handleModelTraining(body: any, session: any): Promise<NextResponse> {
  // Only ADMIN and above can train models
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required for model training' },
      { status: 403 }
    );
  }

  const validationResult = TrainModelSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid training request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { organizationId, sampleSize } = validationResult.data;

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
    const metrics = await trainChurnModel(orgId, sampleSize);

    logger.info('Churn model training completed via API', {
      organizationId: orgId,
      sampleSize,
      accuracy: metrics.accuracy,
      trainingSamples: metrics.trainingSamples,
      trainedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          accuracy: metrics.accuracy,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics.f1Score,
          auc: metrics.auc,
          trainingSamples: metrics.trainingSamples,
          validationSamples: metrics.validationSamples
        },
        featureImportance: metrics.featureImportance,
        modelVersion: metrics.modelVersion,
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
    logger.error('Model training failed', {
      organizationId: orgId,
      sampleSize,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to train model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle model information request
 */
async function handleModelInfo(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  try {
    const model = getChurnPredictionModel();
    
    // Get model status and information
    const modelInfo = {
      available: true,
      modelVersion: 'churn-lr-v1.0',
      description: 'Logistic Regression model for customer churn prediction',
      features: [
        'Customer engagement metrics',
        'Transaction patterns', 
        'Communication preferences',
        'Behavioral indicators',
        'African market factors'
      ],
      riskLevels: ['low', 'medium', 'high', 'critical'],
      supportedActions: ['predict', 'batch', 'train'],
      organizationId,
      lastUpdated: new Date()
    };

    return NextResponse.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    logger.error('Failed to get model info', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get model information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get predictions request
 * Proxies to backend /api/v2/ai/churn-predictions
 */
async function handleGetPredictions(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ?
    searchParams.get('organizationId') || session.user.organizationId :
    session.user.organizationId;

  const riskLevel = searchParams.get('riskLevel');
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';

  try {
    // Build backend URL with query params
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (riskLevel) params.append('riskLevel', riskLevel);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const url = `${BACKEND_URL}/api/v2/ai/churn-predictions?${params.toString()}`;

    // Call backend endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    logger.error('Failed to get predictions', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}