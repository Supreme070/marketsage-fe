/**
 * Action Dispatcher API Endpoints
 * ===============================
 * 
 * Safe API endpoints for managing action plan execution
 * with comprehensive validation and error handling
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActionDispatcher } from '@/lib/actions/action-dispatcher';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const ExecuteActionPlanSchema = z.object({
  actionPlanId: z.string().min(1, 'Action plan ID is required'),
  userId: z.string().optional(),
  dryRun: z.boolean().default(false),
  forceExecution: z.boolean().default(false)
});

const BatchExecutionSchema = z.object({
  actionPlanIds: z.array(z.string()).min(1, 'At least one action plan ID is required').max(50, 'Maximum 50 action plans per batch'),
  userId: z.string().optional(),
  dryRun: z.boolean().default(false),
  maxConcurrent: z.number().min(1).max(10).default(3)
});

const GetReadyActionsSchema = z.object({
  organizationId: z.string().optional(),
  limit: z.number().min(1).max(100).default(20)
});

/**
 * Execute a single action plan
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

    // Only ADMIN and above can execute actions
    if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - ADMIN access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = ExecuteActionPlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid execution request',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { actionPlanId, userId, dryRun, forceExecution } = validationResult.data;

    // Get the action dispatcher
    const dispatcher = getActionDispatcher();

    // Execute the action plan
    const result = await dispatcher.executeActionPlan(actionPlanId, {
      userId: userId || session.user.id,
      dryRun,
      forceExecution
    });

    logger.info('Action plan executed via API', {
      actionPlanId,
      executionId: result.executionId,
      success: result.success,
      dryRun,
      executedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        executionId: result.executionId,
        actionPlanId: result.actionPlanId,
        success: result.success,
        executedAt: result.executedAt,
        executionDuration: result.executionDuration,
        result: result.result,
        error: result.error,
        dryRun,
        metadata: {
          executedBy: session.user.id,
          executedByName: session.user.name,
          ...result.metadata
        }
      }
    });

  } catch (error) {
    logger.error('Failed to execute action plan via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to execute action plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get actions ready for execution or batch execute
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
    const action = searchParams.get('action');

    if (action === 'ready') {
      // Get actions ready for execution
      const queryParams: any = {};
      
      searchParams.forEach((value, key) => {
        if (key === 'organizationId') {
          queryParams[key] = value;
        } else if (key === 'limit') {
          queryParams[key] = Number.parseInt(value);
        }
      });

      const validationResult = GetReadyActionsSchema.safeParse(queryParams);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Invalid query parameters',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }

      const query = validationResult.data;

      // Set organization filter for non-super-admin users
      if (session.user.role !== 'SUPER_ADMIN') {
        query.organizationId = session.user.organizationId;
      }

      const dispatcher = getActionDispatcher();
      const readyActions = await dispatcher.getActionsReadyForExecution(query.organizationId);

      // Limit results
      const limitedActions = readyActions.slice(0, query.limit);

      return NextResponse.json({
        success: true,
        data: {
          readyActions: limitedActions.map(action => ({
            id: action.id,
            contactId: action.contactId,
            organizationId: action.organizationId,
            actionType: action.actionType,
            actionName: action.actionName,
            status: action.status,
            priority: action.priority,
            riskLevel: action.riskLevel,
            scheduledAt: action.scheduledAt,
            expiresAt: action.expiresAt,
            requiresApproval: action.requiresApproval,
            aiConfidence: action.aiConfidence,
            createdAt: action.createdAt
          })),
          total: limitedActions.length,
          hasMore: readyActions.length > query.limit
        }
      });

    } else if (action === 'stats') {
      // Get execution statistics
      const organizationId = session.user.role === 'SUPER_ADMIN' ? 
        searchParams.get('organizationId') || undefined : 
        session.user.organizationId;

      const dispatcher = getActionDispatcher();
      const stats = await dispatcher.getExecutionStats(organizationId);

      return NextResponse.json({
        success: true,
        data: stats
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=ready or ?action=stats' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get dispatcher data via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get dispatcher data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Batch execute multiple action plans
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and above can execute batch actions
    if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - ADMIN access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = BatchExecutionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid batch execution request',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { actionPlanIds, userId, dryRun, maxConcurrent } = validationResult.data;

    // Get the action dispatcher
    const dispatcher = getActionDispatcher();

    // Execute batch
    const results = await dispatcher.executeBatch(actionPlanIds, {
      userId: userId || session.user.id,
      dryRun,
      maxConcurrent
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Batch action execution completed via API', {
      totalActions: results.length,
      successful: successCount,
      failed: failureCount,
      dryRun,
      executedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        totalActions: results.length,
        successful: successCount,
        failed: failureCount,
        successRate: (successCount / results.length * 100).toFixed(1) + '%',
        dryRun,
        results: results.map(result => ({
          executionId: result.executionId,
          actionPlanId: result.actionPlanId,
          success: result.success,
          executedAt: result.executedAt,
          executionDuration: result.executionDuration,
          error: result.error,
          metadata: {
            executedBy: session.user.id,
            executedByName: session.user.name,
            ...result.metadata
          }
        })),
        metadata: {
          executedBy: session.user.id,
          executedByName: session.user.name,
          executedAt: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to execute batch actions via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to execute batch actions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}