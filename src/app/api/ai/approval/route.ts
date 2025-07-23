/**
 * Mandatory Approval API Endpoint
 * ===============================
 * API endpoints for managing the mandatory approval system including
 * approval requests, trust metrics, and deployment phase management.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { mandatoryApprovalSystem } from '@/lib/ai/mandatory-approval-system';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateApprovalRequestSchema = z.object({
  taskType: z.string().min(1),
  actionType: z.enum(['campaign_send', 'data_modification', 'api_call', 'integration_setup', 'budget_action', 'system_config']),
  description: z.string().min(1).max(500),
  parameters: z.record(z.any()),
  estimatedImpact: z.object({
    recordsAffected: z.number().min(0),
    potentialRevenue: z.number().min(0),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    reversible: z.boolean()
  }),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).default('medium')
});

const ProcessApprovalSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional()
});

const ExecuteApprovedActionSchema = z.object({
  requestId: z.string().min(1),
  executionResult: z.object({
    success: z.boolean(),
    result: z.any().optional(),
    error: z.string().optional(),
    rollbackData: z.any().optional()
  })
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'create-request';

    switch (action) {
      case 'create-request':
        return await handleCreateApprovalRequest(request, session);
        
      case 'process-approval':
        return await handleProcessApproval(request, session);
        
      case 'execute-action':
        return await handleExecuteApprovedAction(request, session);
        
      case 'check-requirement':
        return await handleCheckApprovalRequirement(request, session);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Mandatory Approval API error', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'pending-requests';
    const organizationId = session.user.organizationId;

    switch (action) {
      case 'pending-requests':
        const pendingRequests = await mandatoryApprovalSystem.getPendingApprovals(
          organizationId,
          session.user.id,
          50
        );

        return NextResponse.json({
          success: true,
          data: {
            requests: pendingRequests.map(request => ({
              id: request.id,
              userId: request.userId,
              taskType: request.taskType,
              actionType: request.actionType,
              description: request.description,
              estimatedImpact: request.estimatedImpact,
              urgency: request.urgency,
              requestedAt: request.requestedAt,
              expiresAt: request.expiresAt,
              timeRemaining: Math.max(0, Math.floor((request.expiresAt.getTime() - Date.now()) / (1000 * 60))),
              approverRequired: request.approverRequired,
              metadata: request.metadata
            })),
            totalRequests: pendingRequests.length
          }
        });

      case 'trust-metrics':
        const userId = url.searchParams.get('userId') || session.user.id;
        const trustMetrics = await mandatoryApprovalSystem.getTrustMetrics(userId, organizationId);

        return NextResponse.json({
          success: true,
          data: {
            userId,
            organizationId,
            trustScore: trustMetrics.trustScore,
            totalApprovedTasks: trustMetrics.totalApprovedTasks,
            successfulExecutions: trustMetrics.successfulExecutions,
            failedExecutions: trustMetrics.failedExecutions,
            successRate: trustMetrics.successRate,
            autoApprovalEnabled: trustMetrics.autoApprovalEnabled,
            eligibleTaskTypes: trustMetrics.eligibleTaskTypes,
            permanentApprovalRequired: trustMetrics.permanentApprovalRequired,
            deploymentPhase: trustMetrics.deploymentDate,
            weeksActive: trustMetrics.weeksActive,
            lastEvaluated: trustMetrics.lastEvaluated
          }
        });

      case 'system-status':
        const systemStatus = await mandatoryApprovalSystem.getSystemStatus(organizationId);

        return NextResponse.json({
          success: true,
          data: {
            organizationId,
            deploymentPhase: systemStatus.phase,
            weeksActive: systemStatus.weeksActive,
            tasksApproved: systemStatus.tasksApproved,
            successRate: systemStatus.successRate,
            autoApprovalEnabled: systemStatus.autoApprovalEnabled,
            pendingApprovals: systemStatus.pendingApprovals,
            phaseProgress: {
              current: systemStatus.phase,
              nextPhase: systemStatus.phase === 'trust_building' ? 'graduated' : 
                        systemStatus.phase === 'graduated' ? 'autonomous' : 'autonomous',
              progressToNext: systemStatus.phase === 'trust_building' ? 
                Math.min((systemStatus.weeksActive / 12) * 100, (systemStatus.tasksApproved / 600) * 100) :
                systemStatus.phase === 'graduated' && systemStatus.weeksActive < 24 ?
                (systemStatus.weeksActive / 24) * 100 : 100
            },
            thresholds: {
              trustBuildingWeeks: 12,
              trustTaskThreshold: 600,
              autonomousWeeks: 24,
              autonomousTaskThreshold: 1000
            }
          }
        });

      case 'deployment-config':
        const deploymentConfig = await mandatoryApprovalSystem.getDeploymentConfiguration(organizationId);

        return NextResponse.json({
          success: true,
          data: {
            organizationId: deploymentConfig.organizationId,
            deploymentDate: deploymentConfig.deploymentDate,
            currentPhase: deploymentConfig.phase,
            mandatoryApprovalWeeks: deploymentConfig.mandatoryApprovalWeeks,
            trustTaskThreshold: deploymentConfig.trustTaskThreshold,
            permanentApprovalActions: deploymentConfig.permanentApprovalActions,
            autoApprovalRules: deploymentConfig.autoApprovalRules,
            lastUpdated: deploymentConfig.updatedAt
          }
        });

      case 'approval-history':
        const limit = Number(url.searchParams.get('limit')) || 50;
        const offset = Number(url.searchParams.get('offset')) || 0;
        const status = url.searchParams.get('status');
        const userIdFilter = url.searchParams.get('userId');

        // This would typically query the database directly
        // For now, return empty array as placeholder
        return NextResponse.json({
          success: true,
          data: {
            requests: [],
            pagination: {
              total: 0,
              limit,
              offset,
              hasMore: false
            },
            filters: {
              status: status || 'all',
              userId: userIdFilter || 'all'
            }
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Mandatory Approval GET API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCreateApprovalRequest(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = CreateApprovalRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid approval request data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const requestData = validation.data;

  try {
    const requestId = await mandatoryApprovalSystem.createApprovalRequest(
      session.user.id,
      session.user.role || 'USER',
      session.user.organizationId,
      requestData.taskType,
      requestData.actionType,
      requestData.description,
      requestData.parameters,
      requestData.estimatedImpact,
      requestData.urgency
    );

    logger.info('Approval request created via API', {
      requestId,
      userId: session.user.id,
      actionType: requestData.actionType,
      urgency: requestData.urgency
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        message: 'Approval request created successfully',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Request creation failed';
    
    logger.error('Failed to create approval request', {
      userId: session.user.id,
      error: errorMessage,
      actionType: requestData.actionType
    });

    return NextResponse.json(
      { 
        error: 'Failed to create approval request',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function handleProcessApproval(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = ProcessApprovalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid approval processing data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const { requestId, decision, reason } = validation.data;

  // Check if user has approval permissions
  if (!['ADMIN', 'SUPERVISOR', 'MARKETING_MANAGER', 'DATA_MANAGER'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions to process approvals' },
      { status: 403 }
    );
  }

  try {
    const result = await mandatoryApprovalSystem.processApprovalDecision(
      requestId,
      session.user.id,
      decision,
      reason
    );

    logger.info('Approval decision processed via API', {
      requestId,
      decision,
      approverId: session.user.id,
      actionType: result.request.actionType
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        decision,
        status: result.request.status,
        processedAt: decision === 'approve' ? result.request.approvedAt : result.request.rejectedAt,
        message: result.message
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Approval processing failed';
    
    logger.error('Failed to process approval', {
      requestId,
      decision,
      approverId: session.user.id,
      error: errorMessage
    });

    return NextResponse.json(
      { 
        error: 'Failed to process approval',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function handleExecuteApprovedAction(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = ExecuteApprovedActionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid execution data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const { requestId, executionResult } = validation.data;

  try {
    await mandatoryApprovalSystem.executeApprovedAction(requestId, executionResult);

    logger.info('Approved action executed via API', {
      requestId,
      success: executionResult.success,
      executedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        executionSuccess: executionResult.success,
        executedAt: new Date().toISOString(),
        message: 'Action executed and recorded successfully'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Execution recording failed';
    
    logger.error('Failed to record action execution', {
      requestId,
      executedBy: session.user.id,
      error: errorMessage
    });

    return NextResponse.json(
      { 
        error: 'Failed to record action execution',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function handleCheckApprovalRequirement(request: NextRequest, session: any) {
  const body = await request.json();
  
  const { actionType, parameters } = body;

  if (!actionType) {
    return NextResponse.json(
      { error: 'Action type required' },
      { status: 400 }
    );
  }

  try {
    const approvalCheck = await mandatoryApprovalSystem.requiresApproval(
      session.user.id,
      session.user.organizationId,
      actionType,
      parameters || {}
    );

    return NextResponse.json({
      success: true,
      data: {
        actionType,
        approvalRequired: approvalCheck.required,
        reason: approvalCheck.reason,
        deploymentPhase: approvalCheck.phase,
        userTrustScore: approvalCheck.trustScore,
        autoApprovalEligible: approvalCheck.autoApprovalEligible,
        recommendations: approvalCheck.required ? [
          'Submit approval request before proceeding',
          'Ensure all required information is included',
          'Consider lower-risk alternatives if urgent'
        ] : [
          'Action can proceed without approval',
          'Execution will be monitored and logged',
          'Results will contribute to trust score'
        ]
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Approval check failed';
    
    logger.error('Failed to check approval requirement', {
      actionType,
      userId: session.user.id,
      error: errorMessage
    });

    return NextResponse.json(
      { 
        error: 'Failed to check approval requirement',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}