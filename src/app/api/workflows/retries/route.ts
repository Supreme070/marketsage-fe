import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowRetryManager } from '@/lib/workflow/retry-mechanism';
import { WorkflowExecutionEngine } from '@/lib/workflow/execution-engine';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = parseInt(searchParams.get('timeRange') || '86400000'); // Default 24 hours
    const executionId = searchParams.get('executionId');
    const stepId = searchParams.get('stepId');

    switch (action) {
      case 'statistics':
        // Get retry statistics
        const stats = await workflowRetryManager.getRetryStatistics(timeRange);
        return NextResponse.json({
          success: true,
          data: stats,
          timeRange,
          timestamp: new Date().toISOString()
        });

      case 'execution-retries':
        if (!executionId) {
          return NextResponse.json({ error: 'executionId is required' }, { status: 400 });
        }
        
        // Get retry information for specific execution
        const executionRetries = await getExecutionRetries(executionId);
        return NextResponse.json({
          success: true,
          data: executionRetries,
          timestamp: new Date().toISOString()
        });

      case 'step-retry-state':
        if (!executionId || !stepId) {
          return NextResponse.json({ error: 'executionId and stepId are required' }, { status: 400 });
        }
        
        // Get retry state for specific step
        const stepRetryState = await getStepRetryState(executionId, stepId);
        return NextResponse.json({
          success: true,
          data: stepRetryState,
          timestamp: new Date().toISOString()
        });

      case 'failed-steps':
        // Get all failed steps that could be retried
        const failedSteps = await getRetryableFailedSteps(timeRange);
        return NextResponse.json({
          success: true,
          data: failedSteps,
          timeRange,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in workflow retries GET:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get retry information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage workflows
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action, executionId, stepId, stepType } = await request.json();

    switch (action) {
      case 'manual_retry':
        if (!executionId || !stepId) {
          return NextResponse.json({ error: 'executionId and stepId are required' }, { status: 400 });
        }
        
        // Manually trigger a step retry
        const result = await manualRetryStep(executionId, stepId, stepType);
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Manual retry initiated'
        });

      case 'cancel_retries':
        if (!executionId || !stepId) {
          return NextResponse.json({ error: 'executionId and stepId are required' }, { status: 400 });
        }
        
        // Cancel pending retries for a step
        await cancelStepRetries(executionId, stepId);
        return NextResponse.json({
          success: true,
          message: 'Step retries cancelled'
        });

      case 'reset_circuit_breaker':
        if (!executionId || !stepId) {
          return NextResponse.json({ error: 'executionId and stepId are required' }, { status: 400 });
        }
        
        // Reset circuit breaker for a step
        await resetStepCircuitBreaker(executionId, stepId);
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker reset'
        });

      case 'bulk_retry':
        const { executionIds, maxAge } = await request.json();
        
        // Bulk retry failed steps
        const bulkResult = await bulkRetryFailedSteps(executionIds, maxAge);
        return NextResponse.json({
          success: true,
          data: bulkResult,
          message: `Bulk retry initiated for ${bulkResult.retriedCount} steps`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in workflow retries POST:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute retry action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions

async function getExecutionRetries(executionId: string) {
  try {
    const steps = await prisma.workflowExecutionStep.findMany({
      where: { executionId },
      select: {
        id: true,
        stepId: true,
        stepType: true,
        status: true,
        retryState: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { startedAt: 'asc' }
    });

    return steps.map(step => {
      let retryInfo = null;
      if (step.retryState) {
        try {
          retryInfo = JSON.parse(step.retryState);
        } catch (error) {
          logger.warn('Error parsing retry state:', error);
        }
      }

      return {
        stepId: step.stepId,
        stepType: step.stepType,
        status: step.status,
        errorMessage: step.errorMessage,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        retryInfo: retryInfo ? {
          retryCount: retryInfo.retryCount || 0,
          maxRetries: retryInfo.maxRetries || 0,
          isCircuitOpen: retryInfo.isCircuitOpen || false,
          consecutiveFailures: retryInfo.consecutiveFailures || 0,
          nextRetryAt: retryInfo.nextRetryAt,
          attempts: retryInfo.attempts || [],
        } : null,
      };
    });
  } catch (error) {
    logger.error('Error getting execution retries:', error);
    return [];
  }
}

async function getStepRetryState(executionId: string, stepId: string) {
  try {
    const step = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { retryState: true, status: true, errorMessage: true }
    });

    if (!step) {
      return null;
    }

    let retryState = null;
    if (step.retryState) {
      try {
        retryState = JSON.parse(step.retryState);
      } catch (error) {
        logger.warn('Error parsing retry state:', error);
      }
    }

    return {
      status: step.status,
      errorMessage: step.errorMessage,
      retryState,
    };
  } catch (error) {
    logger.error('Error getting step retry state:', error);
    return null;
  }
}

async function getRetryableFailedSteps(timeRange: number) {
  try {
    const since = new Date(Date.now() - timeRange);
    
    const failedSteps = await prisma.workflowExecutionStep.findMany({
      where: {
        status: 'FAILED',
        createdAt: { gte: since },
      },
      include: {
        execution: {
          select: {
            id: true,
            workflowId: true,
            contactId: true,
            status: true,
            workflow: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return failedSteps.map(step => {
      let retryInfo = null;
      if (step.retryState) {
        try {
          retryInfo = JSON.parse(step.retryState);
        } catch (error) {
          logger.warn('Error parsing retry state:', error);
        }
      }

      return {
        executionId: step.executionId,
        stepId: step.stepId,
        stepType: step.stepType,
        errorMessage: step.errorMessage,
        failedAt: step.completedAt,
        workflowName: step.execution.workflow?.name,
        workflowId: step.execution.workflowId,
        contactId: step.execution.contactId,
        executionStatus: step.execution.status,
        retryCount: retryInfo?.retryCount || 0,
        maxRetries: retryInfo?.maxRetries || 0,
        canRetry: (retryInfo?.retryCount || 0) < (retryInfo?.maxRetries || 0),
        isCircuitOpen: retryInfo?.isCircuitOpen || false,
      };
    });
  } catch (error) {
    logger.error('Error getting retryable failed steps:', error);
    return [];
  }
}

async function manualRetryStep(executionId: string, stepId: string, stepType?: string) {
  try {
    // Get the execution to ensure it exists
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: { status: true, workflowId: true, contactId: true }
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    // Get the step
    const step = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { stepType: true, status: true }
    });

    if (!step) {
      throw new Error('Step not found');
    }

    // Force a retry by creating a manual error and using the retry manager
    const manualError = new Error('Manual retry requested');
    
    const retryResult = await workflowRetryManager.scheduleRetry(
      executionId,
      stepId,
      stepType || step.stepType,
      manualError
    );

    if (!retryResult.scheduled) {
      throw new Error('Failed to schedule manual retry');
    }

    // Update step status to retrying
    await prisma.workflowExecutionStep.updateMany({
      where: { executionId, stepId },
      data: {
        status: 'RETRYING',
        errorMessage: 'Manual retry initiated',
      }
    });

    logger.info('Manual retry scheduled', {
      executionId,
      stepId,
      nextRetryAt: retryResult.nextRetryAt,
      delayMs: retryResult.delayMs
    });

    return {
      scheduled: true,
      nextRetryAt: retryResult.nextRetryAt,
      delayMs: retryResult.delayMs,
    };
  } catch (error) {
    logger.error('Error in manual retry:', error);
    throw error;
  }
}

async function cancelStepRetries(executionId: string, stepId: string) {
  try {
    // Update retry state to prevent further retries
    const step = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { retryState: true }
    });

    if (step?.retryState) {
      const retryState = JSON.parse(step.retryState);
      retryState.maxRetries = retryState.retryCount || 0; // Set max retries to current count
      retryState.cancelled = true;

      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId },
        data: {
          retryState: JSON.stringify(retryState)
        }
      });
    }

    logger.info('Step retries cancelled', { executionId, stepId });
  } catch (error) {
    logger.error('Error cancelling step retries:', error);
    throw error;
  }
}

async function resetStepCircuitBreaker(executionId: string, stepId: string) {
  try {
    const step = await prisma.workflowExecutionStep.findFirst({
      where: { executionId, stepId },
      select: { retryState: true }
    });

    if (step?.retryState) {
      const retryState = JSON.parse(step.retryState);
      retryState.isCircuitOpen = false;
      retryState.consecutiveFailures = 0;

      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId },
        data: {
          retryState: JSON.stringify(retryState)
        }
      });
    }

    logger.info('Circuit breaker reset', { executionId, stepId });
  } catch (error) {
    logger.error('Error resetting circuit breaker:', error);
    throw error;
  }
}

async function bulkRetryFailedSteps(executionIds?: string[], maxAge?: number) {
  try {
    const since = new Date(Date.now() - (maxAge || 24 * 60 * 60 * 1000)); // Default 24 hours
    
    const whereCondition: any = {
      status: 'FAILED',
      createdAt: { gte: since },
    };

    if (executionIds && executionIds.length > 0) {
      whereCondition.executionId = { in: executionIds };
    }

    const failedSteps = await prisma.workflowExecutionStep.findMany({
      where: whereCondition,
      select: {
        executionId: true,
        stepId: true,
        stepType: true,
        retryState: true,
      },
      take: 100 // Limit to prevent overwhelming the system
    });

    let retriedCount = 0;
    const results = [];

    for (const step of failedSteps) {
      try {
        let retryInfo = null;
        if (step.retryState) {
          retryInfo = JSON.parse(step.retryState);
        }

        // Check if step can be retried
        const canRetry = (retryInfo?.retryCount || 0) < (retryInfo?.maxRetries || 3);
        if (!canRetry) {
          continue;
        }

        // Schedule retry
        const retryResult = await workflowRetryManager.scheduleRetry(
          step.executionId,
          step.stepId,
          step.stepType,
          new Error('Bulk retry')
        );

        if (retryResult.scheduled) {
          retriedCount++;
          results.push({
            executionId: step.executionId,
            stepId: step.stepId,
            scheduled: true,
            nextRetryAt: retryResult.nextRetryAt,
          });
        }
      } catch (stepError) {
        logger.error('Error in bulk retry for step:', stepError);
        results.push({
          executionId: step.executionId,
          stepId: step.stepId,
          scheduled: false,
          error: stepError instanceof Error ? stepError.message : 'Unknown error',
        });
      }
    }

    logger.info('Bulk retry completed', { 
      totalSteps: failedSteps.length, 
      retriedCount 
    });

    return {
      totalSteps: failedSteps.length,
      retriedCount,
      results,
    };
  } catch (error) {
    logger.error('Error in bulk retry:', error);
    throw error;
  }
}