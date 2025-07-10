/**
 * AI Safe Execution API
 * =====================
 * 
 * API endpoint for safe AI task execution with comprehensive safety boundaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  aiSafeExecutionEngine,
  type SafeExecutionRequest
} from '@/lib/ai/ai-safe-execution-engine';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, parameters, context } = body;

    // Validate required fields
    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required' },
        { status: 400 }
      );
    }

    // Create safe execution request
    const safeRequest: SafeExecutionRequest = {
      userId: session.user.id,
      operation,
      parameters: parameters || {},
      context: {
        source: context?.source || 'user',
        priority: context?.priority || 'medium',
        timeoutMs: context?.timeoutMs || 30000,
        maxRetries: context?.maxRetries || 3,
        dryRun: context?.dryRun || false,
        approvalOverride: context?.approvalOverride
      }
    };

    // Execute safely
    const result = await aiSafeExecutionEngine.executeSafely(safeRequest);

    // Log execution attempt
    logger.info('Safe AI execution completed', {
      userId: session.user.id,
      operation,
      success: result.success,
      executionId: result.executionId,
      riskLevel: result.riskLevel,
      executionTime: result.executionTime
    });

    // Return result with appropriate status code
    const statusCode = result.success ? 200 : 
                      result.approvalRequired ? 202 : 
                      result.safetyBlocked ? 403 : 400;

    return NextResponse.json({
      success: result.success,
      data: {
        executionId: result.executionId,
        operation: result.operation,
        riskLevel: result.riskLevel,
        executionTime: result.executionTime,
        result: result.result,
        error: result.error,
        safetyBlocked: result.safetyBlocked,
        approvalRequired: result.approvalRequired,
        approvalId: result.approvalId,
        rollbackId: result.rollbackId,
        warnings: result.warnings,
        recommendations: result.recommendations,
        confidence: result.confidence
      },
      debug: result.debug
    }, { status: statusCode });

  } catch (error) {
    logger.error('Safe execution API error', { 
      error: error instanceof Error ? error.message : String(error),
      userId: session?.user?.id 
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return await getExecutionStatus(searchParams.get('executionId'));
        
      case 'history':
        return await getExecutionHistory(session.user.id);
        
      case 'safety-boundaries':
        return await getSafetyBoundaries();
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Safe execution API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get execution status
async function getExecutionStatus(executionId: string | null) {
  if (!executionId) {
    return NextResponse.json(
      { success: false, error: 'Execution ID required' },
      { status: 400 }
    );
  }

  // This would typically query a database or cache
  // For now, return a mock response
  return NextResponse.json({
    success: true,
    data: {
      executionId,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 1500
    }
  });
}

// Get execution history
async function getExecutionHistory(userId: string) {
  // This would typically query execution history from database
  // For now, return a mock response
  return NextResponse.json({
    success: true,
    data: {
      executions: [],
      totalCount: 0,
      page: 1,
      pageSize: 20
    }
  });
}

// Get safety boundaries info
async function getSafetyBoundaries() {
  return NextResponse.json({
    success: true,
    data: {
      boundaries: [
        {
          id: 'high_frequency',
          name: 'High Frequency Operations',
          description: 'Monitors for rapid operation execution',
          severity: 'medium',
          action: 'warn'
        },
        {
          id: 'destructive_ops',
          name: 'Destructive Operations',
          description: 'Requires approval for operations that modify/delete data',
          severity: 'high',
          action: 'require_approval'
        },
        {
          id: 'off_hours',
          name: 'Off Hours Operations',
          description: 'Warns about operations outside business hours',
          severity: 'low',
          action: 'warn'
        },
        {
          id: 'bulk_operations',
          name: 'Bulk Operations',
          description: 'Requires approval for operations affecting multiple records',
          severity: 'high',
          action: 'require_approval'
        },
        {
          id: 'error_rate',
          name: 'High Error Rate',
          description: 'Blocks operations when session error rate is high',
          severity: 'high',
          action: 'block'
        }
      ],
      riskLevels: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      actions: ['warn', 'block', 'require_approval', 'monitor']
    }
  });
}