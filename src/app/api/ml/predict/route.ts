/**
 * Model Inference API
 * ==================
 * Unified endpoint for all ML model predictions with load balancing and monitoring
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trace } from '@opentelemetry/api';

// Request validation schemas
const inferenceRequestSchema = z.object({
  modelId: z.string().min(1, 'Model ID required'),
  modelVersion: z.string().optional(),
  input: z.any(), // Model input can be any structure
  metadata: z.object({
    requestId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    features: z.record(z.any()).optional()
  }).optional(),
  options: z.object({
    timeout: z.number().positive().max(30000).optional(), // Max 30 seconds
    retries: z.number().int().min(0).max(3).optional(),
    explainPrediction: z.boolean().optional()
  }).optional()
});

const batchInferenceSchema = z.object({
  modelId: z.string().min(1, 'Model ID required'),
  modelVersion: z.string().optional(),
  inputs: z.array(z.any()).min(1).max(100), // Max 100 batch requests
  metadata: z.object({
    batchId: z.string().optional(),
    userId: z.string().optional()
  }).optional(),
  options: z.object({
    timeout: z.number().positive().max(60000).optional(), // Max 60 seconds for batch
    explainPredictions: z.boolean().optional()
  }).optional()
});

// POST: Single model inference
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = inferenceRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const validatedData = validation.data;
    const user = session.user;
    const tracer = trace.getTracer('model-inference-api');
    
    return tracer.startActiveSpan('process-inference-request', async (span) => {
      try {
        const requestId = validatedData.metadata?.requestId || 
          `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        span.setAttributes({
          'inference.request.id': requestId,
          'inference.model.id': validatedData.modelId,
          'inference.model.version': validatedData.modelVersion || 'latest',
          'inference.user.id': user.id,
          'inference.organization.id': user.organizationId,
          'inference.explain_prediction': validatedData.options?.explainPrediction || false
        });

        logger.info('Model inference request received', {
          requestId,
          modelId: validatedData.modelId,
          modelVersion: validatedData.modelVersion || 'latest',
          userId: user.id,
          organizationId: user.organizationId,
          hasExplanation: validatedData.options?.explainPrediction
        });

        // Prepare inference request
        const inferenceRequest = {
          modelId: validatedData.modelId,
          modelVersion: validatedData.modelVersion,
          input: validatedData.input,
          metadata: {
            ...validatedData.metadata,
            requestId,
            userId: user.id
          },
          options: validatedData.options
        };

        // Process inference
        const { processModelInference } = await import('@/lib/ai/mlops/model-serving-engine');
        const response = await processModelInference(inferenceRequest);

        span.setAttributes({
          'inference.response.processing_time': response.metadata.processingTime,
          'inference.response.confidence': response.confidence || 0,
          'inference.response.warnings_count': response.warnings?.length || 0,
          'inference.response.has_explanation': !!response.explanation
        });

        logger.info('Model inference completed', {
          requestId,
          modelId: validatedData.modelId,
          processingTime: response.metadata.processingTime,
          confidence: response.confidence,
          warningsCount: response.warnings?.length || 0
        });

        return NextResponse.json({
          success: true,
          data: {
            type: 'inference_result',
            ...response,
            modelInfo: {
              id: response.modelId,
              version: response.modelVersion,
              performance: response.metadata.modelPerformance
            },
            requestInfo: {
              requestId,
              userId: user.id,
              processedAt: response.metadata.timestamp,
              processingTime: `${response.metadata.processingTime}ms`
            }
          }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        span.setAttributes({
          'inference.error': true,
          'inference.error.message': errorMessage
        });
        
        logger.error('Model inference failed', {
          error: errorMessage,
          modelId: validatedData.modelId,
          userId: user?.id,
          organizationId: user?.organizationId
        });

        // Return structured error response
        return NextResponse.json({
          success: false,
          error: errorMessage,
          data: {
            type: 'inference_error',
            modelId: validatedData.modelId,
            requestId: validatedData.metadata?.requestId,
            timestamp: new Date(),
            suggestions: [
              'Check model availability with GET /api/ml/predict',
              'Verify input format matches model requirements',
              'Try again with a different model version'
            ]
          }
        }, { status: 500 });
      } finally {
        span.end();
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Batch model inference
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = batchInferenceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const validatedData = validation.data;
    const user = session.user;
    const tracer = trace.getTracer('batch-inference-api');
    
    return tracer.startActiveSpan('process-batch-inference', async (span) => {
      try {
        const batchId = validatedData.metadata?.batchId || 
          `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        span.setAttributes({
          'batch.inference.id': batchId,
          'batch.inference.model.id': validatedData.modelId,
          'batch.inference.model.version': validatedData.modelVersion || 'latest',
          'batch.inference.inputs.count': validatedData.inputs.length,
          'batch.inference.user.id': user.id,
          'batch.inference.organization.id': user.organizationId
        });

        logger.info('Batch inference request received', {
          batchId,
          modelId: validatedData.modelId,
          inputsCount: validatedData.inputs.length,
          userId: user.id,
          organizationId: user.organizationId
        });

        const startTime = Date.now();
        const results = [];
        const errors = [];

        const { processModelInference } = await import('@/lib/ai/mlops/model-serving-engine');

        // Process each input sequentially (could be parallelized with throttling)
        for (let i = 0; i < validatedData.inputs.length; i++) {
          try {
            const inferenceRequest = {
              modelId: validatedData.modelId,
              modelVersion: validatedData.modelVersion,
              input: validatedData.inputs[i],
              metadata: {
                requestId: `${batchId}_${i}`,
                userId: user.id,
                batchIndex: i
              },
              options: {
                timeout: validatedData.options?.timeout,
                explainPrediction: validatedData.options?.explainPredictions
              }
            };

            const response = await processModelInference(inferenceRequest);
            results.push({
              index: i,
              success: true,
              result: response
            });

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({
              index: i,
              error: errorMessage,
              input: validatedData.inputs[i]
            });
            
            results.push({
              index: i,
              success: false,
              error: errorMessage
            });
          }
        }

        const totalTime = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const errorCount = errors.length;

        span.setAttributes({
          'batch.inference.total_time': totalTime,
          'batch.inference.success_count': successCount,
          'batch.inference.error_count': errorCount,
          'batch.inference.success_rate': (successCount / validatedData.inputs.length) * 100
        });

        logger.info('Batch inference completed', {
          batchId,
          totalTime,
          inputsProcessed: validatedData.inputs.length,
          successCount,
          errorCount,
          successRate: (successCount / validatedData.inputs.length) * 100
        });

        return NextResponse.json({
          success: true,
          data: {
            type: 'batch_inference_result',
            batchId,
            modelId: validatedData.modelId,
            modelVersion: validatedData.modelVersion || 'latest',
            summary: {
              totalInputs: validatedData.inputs.length,
              successfulPredictions: successCount,
              failedPredictions: errorCount,
              successRate: Math.round((successCount / validatedData.inputs.length) * 100),
              totalProcessingTime: totalTime,
              averageLatency: Math.round(totalTime / validatedData.inputs.length)
            },
            results,
            errors: errorCount > 0 ? errors : undefined,
            metadata: {
              processedAt: new Date(),
              userId: user.id,
              batchId
            }
          }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Batch inference failed', {
          error: errorMessage,
          modelId: validatedData.modelId,
          inputsCount: validatedData.inputs.length,
          userId: user?.id
        });

        return NextResponse.json({
          success: false,
          error: errorMessage,
          data: {
            type: 'batch_inference_error',
            modelId: validatedData.modelId,
            batchId: validatedData.metadata?.batchId,
            timestamp: new Date()
          }
        }, { status: 500 });
      } finally {
        span.end();
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Model serving status and available models
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;
    const url = new URL(request.url);
    const modelId = url.searchParams.get('modelId');
    const includeHealth = url.searchParams.get('health') === 'true';

    const { modelServingEngine, getServingStatus } = await import('@/lib/ai/mlops/model-serving-engine');

    if (modelId) {
      // Get specific model endpoint status
      const endpoint = await modelServingEngine.getEndpointStatus(modelId);
      
      if (!endpoint) {
        return NextResponse.json({ 
          success: false, 
          error: 'Model endpoint not found' 
        }, { status: 404 });
      }

      let healthData = undefined;
      if (includeHealth) {
        healthData = await modelServingEngine.getInstanceHealth(
          endpoint.modelId, 
          endpoint.modelVersion
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'model_endpoint_status',
          endpoint,
          health: healthData,
          availableAt: endpoint.path,
          lastActivity: endpoint.lastRequestAt,
          performance: {
            requestCount: endpoint.requestCount,
            errorCount: endpoint.errorCount,
            errorRate: endpoint.requestCount > 0 ? 
              (endpoint.errorCount / endpoint.requestCount) * 100 : 0,
            averageLatency: `${Math.round(endpoint.averageLatency)}ms`
          }
        }
      });
    } else {
      // Get overall serving status
      const servingStatus = await getServingStatus();
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'serving_status',
          summary: {
            totalEndpoints: servingStatus.endpoints.length,
            activeEndpoints: servingStatus.endpoints.filter(ep => ep.status === 'active').length,
            totalRequests: servingStatus.totalRequests,
            totalErrors: servingStatus.totalErrors,
            overallErrorRate: servingStatus.totalRequests > 0 ? 
              (servingStatus.totalErrors / servingStatus.totalRequests) * 100 : 0,
            averageLatency: `${Math.round(servingStatus.averageLatency)}ms`
          },
          endpoints: servingStatus.endpoints.map(endpoint => ({
            id: endpoint.id,
            modelId: endpoint.modelId,
            modelVersion: endpoint.modelVersion,
            environment: endpoint.environment,
            path: endpoint.path,
            status: endpoint.status,
            requestCount: endpoint.requestCount,
            errorRate: endpoint.requestCount > 0 ? 
              (endpoint.errorCount / endpoint.requestCount) * 100 : 0,
            averageLatency: `${Math.round(endpoint.averageLatency)}ms`,
            lastRequestAt: endpoint.lastRequestAt
          })),
          systemMetrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date()
          }
        }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to get serving status', {
      error: errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve serving status'
    }, { status: 500 });
  }
}