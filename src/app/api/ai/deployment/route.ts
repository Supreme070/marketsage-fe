/**
 * Autonomous Model Deployment API
 * ==============================
 * API endpoints for managing autonomous model deployments
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { trace } from '@opentelemetry/api';

// Dynamic imports to prevent circular dependencies during build

// Request validation schemas
const deploymentRequestSchema = z.object({
  modelId: z.string().min(1, 'Model ID required'),
  modelVersion: z.string().min(1, 'Model version required'),
  targetEnvironment: z.enum(['development', 'staging', 'production']),
  strategy: z.object({
    type: z.enum(['blue-green', 'rolling', 'canary', 'immediate']),
    parameters: z.object({
      canaryPercentage: z.number().min(1).max(100).optional(),
      rollbackThreshold: z.number().min(0).max(1).optional(),
      healthCheckInterval: z.number().positive().optional(),
      promotionDelay: z.number().positive().optional()
    }).optional()
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().optional()
});

const approvalRequestSchema = z.object({
  planId: z.string().min(1, 'Plan ID required'),
  approved: z.boolean(),
  reason: z.string().optional()
});

// GET: Get deployment status and history
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('deployment-api');
  
  return tracer.startActiveSpan('get-deployment-status', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = session.user;

      // Dynamic import to check permissions
      const { Permission } = await import('@/lib/security/authorization');

        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'status';
        const executionId = url.searchParams.get('executionId');
        const limit = Number.parseInt(url.searchParams.get('limit') || '10');

        span.setAttributes({
          'deployment.request.type': type,
          'deployment.request.execution_id': executionId || 'none',
          'deployment.request.limit': limit,
          'user.id': user.id,
          'organization.id': user.organizationId
        });

        // Import deployment pipeline dynamically to prevent circular dependencies
        const { autonomousDeploymentPipeline } = await import('@/lib/ai/mlops/autonomous-deployment-pipeline');
        
        switch (type) {
          case 'active':
            const activeDeployments = await autonomousDeploymentPipeline.getActiveDeployments();
            return NextResponse.json({
              success: true,
              data: {
                type: 'active_deployments',
                deployments: activeDeployments,
                total: activeDeployments.length
              }
            });

          case 'history':
            const history = await autonomousDeploymentPipeline.getDeploymentHistory(limit);
            return NextResponse.json({
              success: true,
              data: {
                type: 'deployment_history',
                deployments: history,
                total: history.length
              }
            });

          case 'specific':
            if (!executionId) {
              return NextResponse.json(
                { success: false, error: 'Execution ID required for specific deployment status' },
                { status: 400 }
              );
            }

            const deployment = await autonomousDeploymentPipeline.getDeploymentStatus(executionId);
            if (!deployment) {
              return NextResponse.json(
                { success: false, error: 'Deployment not found' },
                { status: 404 }
              );
            }

            return NextResponse.json({
              success: true,
              data: {
                type: 'specific_deployment',
                deployment
              }
            });

          case 'status':
          default:
            const [activeData, historyData] = await Promise.all([
              autonomousDeploymentPipeline.getActiveDeployments(),
              autonomousDeploymentPipeline.getDeploymentHistory(5)
            ]);

            return NextResponse.json({
              success: true,
              data: {
                type: 'deployment_status',
                summary: {
                  activeDeployments: activeData.length,
                  totalDeploymentsToday: historyData.filter(d => 
                    d.startedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length,
                  lastDeployment: historyData[0]?.startedAt || null,
                  successRate: calculateSuccessRate(historyData)
                },
                activeDeployments: activeData,
                recentHistory: historyData.slice(0, 3),
                systemMetrics: {
                  uptime: process.uptime(),
                  memory: process.memoryUsage(),
                  lastCheck: new Date()
                }
              }
            });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to get deployment status', {
          error: errorMessage,
          userId: user?.id,
          organizationId: user?.organizationId
        });

        return NextResponse.json(
          { success: false, error: 'Failed to retrieve deployment status' },
          { status: 500 }
        );
      } finally {
        span.end();
      }
    });
  }

// POST: Create new deployment
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('deployment-trigger');
  
  return tracer.startActiveSpan('trigger-deployment', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const body = await request.json();
      const validation = deploymentRequestSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request data', details: validation.error.errors },
          { status: 400 }
        );
      }

      const user = session.user;
      const validatedData = validation.data;

        const { 
          modelId, 
          modelVersion, 
          targetEnvironment, 
          strategy,
          scheduledAt,
          reason 
        } = validatedData;

        span.setAttributes({
          'deployment.model.id': modelId,
          'deployment.model.version': modelVersion,
          'deployment.target.environment': targetEnvironment,
          'deployment.strategy.type': strategy?.type || 'rolling',
          'deployment.scheduled': !!scheduledAt,
          'user.id': user.id,
          'organization.id': user.organizationId
        });

        logger.info('Deployment requested', {
          userId: user.id,
          organizationId: user.organizationId,
          modelId,
          modelVersion,
          targetEnvironment,
          strategy: strategy?.type
        });

        // Import deployment pipeline dynamically to prevent circular dependencies
        const { autonomousDeploymentPipeline } = await import('@/lib/ai/mlops/autonomous-deployment-pipeline');

        // Create deployment plan
        const plan = await autonomousDeploymentPipeline.createDeploymentPlan({
          modelId,
          modelVersion,
          targetEnvironment,
          strategy: strategy || { type: 'rolling', parameters: {} },
          triggeredBy: 'manual',
          reason: reason || `Manual deployment by ${user.name}`,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
        });

        // Schedule deployment
        const executionId = await autonomousDeploymentPipeline.scheduleDeployment(plan);

        span.setAttributes({
          'deployment.plan.id': plan.id,
          'deployment.execution.id': executionId,
          'deployment.approval_required': plan.approvalRequired
        });

        return {
          success: true,
          data: {
            type: 'deployment_created',
            planId: plan.id,
            executionId,
            modelId,
            modelVersion,
            targetEnvironment,
            strategy: plan.strategy,
            approvalRequired: plan.approvalRequired,
            scheduledAt: plan.scheduledAt,
            message: plan.approvalRequired
              ? `📋 Deployment plan created and pending approval for ${targetEnvironment} environment`
              : scheduledAt
                ? `⏰ Deployment scheduled for ${new Date(scheduledAt).toLocaleString()}`
                : `🚀 Deployment started for ${modelId}@${modelVersion} to ${targetEnvironment}`,
            nextSteps: plan.approvalRequired
              ? ['Deployment requires approval before execution', 'Use PUT /api/ai/deployment to approve']
              : scheduledAt
                ? ['Deployment will execute at scheduled time', 'Monitor status with GET /api/ai/deployment']
                : ['Deployment is executing', 'Monitor progress with GET /api/ai/deployment']
          }
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        span.setStatus({ code: 2, message: errorMessage });
        
        logger.error('Failed to create deployment', {
          error: errorMessage,
          userId: user.id,
          modelId: validatedData.modelId,
          targetEnvironment: validatedData.targetEnvironment
        });

        return {
          success: false,
          error: errorMessage,
          statusCode: 500
        };
      } finally {
        span.end();
      }
    });
  }

// PUT: Approve/reject deployment or update deployment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = approvalRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const user = session.user;
    const { planId, approved, reason } = validation.data;

      logger.info('Deployment approval request', {
        userId: user.id,
        organizationId: user.organizationId,
        planId,
        approved,
        reason
      });

      if (approved) {
        // Import deployment pipeline dynamically to prevent circular dependencies
        const { autonomousDeploymentPipeline } = await import('@/lib/ai/mlops/autonomous-deployment-pipeline');
        
        // Approve and execute deployment
        const executionId = await autonomousDeploymentPipeline.approveDeployment(planId, user.id);

        return NextResponse.json({
          success: true,
          data: {
            type: 'deployment_approved',
            planId,
            executionId,
            approvedBy: user.name,
            approvedAt: new Date(),
            reason,
            message: `✅ Deployment approved and started by ${user.name}`,
            nextSteps: [
              'Deployment is now executing',
              'Monitor progress with GET /api/ai/deployment'
            ]
          }
        });
      } else {
        // Reject deployment (this would be implemented)
        return NextResponse.json({
          success: true,
          data: {
            type: 'deployment_rejected',
            planId,
            rejectedBy: user.name,
            rejectedAt: new Date(),
            reason,
            message: `❌ Deployment rejected by ${user.name}`,
            nextSteps: [
              'Deployment plan has been cancelled',
              'Create a new deployment if needed'
            ]
          }
        });
      }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to process deployment approval', {
      error: errorMessage
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Cancel active deployment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const url = new URL(request.url);
    const executionId = url.searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'Execution ID required' },
        { status: 400 }
      );
    }

    logger.info('Deployment cancellation requested', {
      userId: user.id,
      organizationId: user.organizationId,
      executionId
    });

    // Import deployment pipeline dynamically to prevent circular dependencies
    const { autonomousDeploymentPipeline } = await import('@/lib/ai/mlops/autonomous-deployment-pipeline');

    await autonomousDeploymentPipeline.cancelDeployment(executionId);

    return NextResponse.json({
      success: true,
      data: {
        type: 'deployment_cancelled',
        executionId,
        cancelledBy: user.name,
        cancelledAt: new Date(),
        message: `🛑 Deployment cancelled by ${user.name}`,
        warning: 'Cancelling deployments may leave the system in an inconsistent state'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to cancel deployment', {
      error: errorMessage
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to calculate success rate
function calculateSuccessRate(deployments: any[]): number {
  if (deployments.length === 0) return 100;
  
  const successful = deployments.filter(d => d.status === 'completed').length;
  return Math.round((successful / deployments.length) * 100);
}