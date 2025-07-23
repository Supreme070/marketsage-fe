/**
 * AI Task Execution API Endpoint
 * 
 * This endpoint handles AI task execution requests with safety approval workflows.
 * It integrates with the Supreme-AI v3 engine and MCP for secure task execution.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supremeAIV3Enhanced } from '@/lib/ai/supreme-ai-v3-mcp-integration';
import { safetyApprovalSystem } from '@/lib/ai/safety-approval-system';
import { logger } from '@/lib/logger';

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

    const { 
      taskDescription, 
      taskType = 'general',
      enableTaskExecution = false,
      approvalId 
    } = await request.json();

    if (!taskDescription) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    logger.info('AI Task Execution API called', {
      userId: session.user.id,
      taskType,
      taskDescription: taskDescription.substring(0, 100),
      enableTaskExecution,
      approvalId
    });

    // If this is an approved task execution, verify approval
    if (approvalId) {
      const isApproved = await safetyApprovalSystem.isOperationApproved(approvalId);
      if (!isApproved) {
        return NextResponse.json(
          { error: 'Task is not approved for execution' },
          { status: 403 }
        );
      }
    }

    // Prepare AI task for execution
    const aiTask = {
      type: 'task' as const,
      userId: session.user.id,
      question: taskDescription,
      taskType,
      enableTaskExecution,
      approvalId
    };

    // Process with Supreme-AI v3 with task execution
    const startTime = Date.now();
    const result = await supremeAIV3Enhanced.processWithMCP(
      aiTask, 
      request.headers.get('authorization')
    );
    const processingTime = Date.now() - startTime;

    // Add execution metadata
    const response = {
      success: true,
      data: result,
      meta: {
        processingTime: `${processingTime}ms`,
        taskExecutionEnabled: enableTaskExecution,
        approvalRequired: result.data?.status === 'approval_required',
        timestamp: new Date().toISOString()
      }
    };

    logger.info('AI Task Execution completed', {
      userId: session.user.id,
      processingTime,
      success: result.success,
      status: result.data?.status,
      taskExecuted: result.data?.status === 'executed'
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('AI Task Execution API error', error);

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
    const action = url.searchParams.get('action');

    switch (action) {
      case 'pending-approvals':
        // Get pending approvals for the user
        const pendingApprovals = safetyApprovalSystem.getPendingApprovals(session.user.id);
        return NextResponse.json({
          success: true,
          data: {
            pendingApprovals,
            count: pendingApprovals.length
          }
        });

      case 'approval-status':
        // Check approval status for a specific operation
        const operationId = url.searchParams.get('operationId');
        if (!operationId) {
          return NextResponse.json(
            { error: 'Operation ID is required' },
            { status: 400 }
          );
        }
        
        const isApproved = await safetyApprovalSystem.isOperationApproved(operationId);
        return NextResponse.json({
          success: true,
          data: {
            operationId,
            isApproved,
            status: isApproved ? 'approved' : 'pending_or_rejected'
          }
        });

      default:
        // Get task execution status and capabilities
        return NextResponse.json({
          success: true,
          data: {
            taskExecutionEnabled: true,
            supportedTaskTypes: [
              'segmentation',
              'campaign_optimization', 
              'data_analysis',
              'reporting',
              'integration_config'
            ],
            approvalWorkflowActive: true,
            safetySystemActive: true,
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    logger.error('AI Task Execution Status API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to get task execution status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { approvalId, action, reason } = await request.json();

    if (!approvalId || !action) {
      return NextResponse.json(
        { error: 'Approval ID and action are required' },
        { status: 400 }
      );
    }

    logger.info('Approval action requested', {
      userId: session.user.id,
      approvalId,
      action,
      reason: reason?.substring(0, 100)
    });

    let result;
    
    switch (action) {
      case 'approve':
        result = await safetyApprovalSystem.approveOperation(
          approvalId,
          session.user.id,
          session.user.role || 'USER'
        );
        break;
        
      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        result = await safetyApprovalSystem.rejectOperation(
          approvalId,
          session.user.id,
          reason
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "approve" or "reject"' },
          { status: 400 }
        );
    }

    logger.info('Approval action completed', {
      userId: session.user.id,
      approvalId,
      action,
      success: result.success
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        approvalId,
        action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Approval action API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to process approval action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}