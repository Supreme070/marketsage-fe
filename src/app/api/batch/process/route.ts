/**
 * Batch Processing API Endpoints
 * ==============================
 * 
 * Manage customer profile batch processing jobs
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schema
const BatchProcessRequestSchema = z.object({
  organizationId: z.string().optional(),
  immediate: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and above can trigger batch processing
    if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions - ADMIN access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = BatchProcessRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { organizationId, immediate } = validationResult.data;

    // Check organization access
    const targetOrgId = organizationId || session.user.organizationId;
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== targetOrgId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to organization' },
        { status: 403 }
      );
    }

    logger.info('Customer profile batch processing requested', {
      userId: session.user.id,
      userRole: session.user.role,
      organizationId: targetOrgId,
      immediate
    });

    if (immediate) {
      // Execute immediately - dynamic import to prevent circular dependencies
      const { CustomerProfileProcessor } = await import('@/lib/batch/customer-profile-processor');
      const result = await CustomerProfileProcessor.processBatch(targetOrgId);
      
      return NextResponse.json({
        success: true,
        message: 'Batch processing completed',
        data: {
          execution: 'immediate',
          ...result
        }
      });
    } else {
      // Schedule for next run - dynamic import to prevent circular dependencies
      const { getBatchScheduler } = await import('@/lib/batch/scheduler');
      const scheduler = getBatchScheduler();
      const execution = await scheduler.runJobNow('customer-profile-batch', targetOrgId);
      
      return NextResponse.json({
        success: true,
        message: 'Batch processing job triggered',
        data: {
          execution: 'scheduled',
          executionId: execution.id,
          startTime: execution.startTime,
          status: execution.status
        }
      });
    }

  } catch (error) {
    logger.error('Failed to trigger batch processing', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to trigger batch processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const jobId = searchParams.get('jobId') || 'customer-profile-batch';

    // Get batch job status - dynamic import to prevent circular dependencies
    const { getBatchScheduler } = await import('@/lib/batch/scheduler');
    const scheduler = getBatchScheduler();
    const status = scheduler.getJobStatus(jobId);

    // Get recent executions
    const executions = scheduler.getExecutions()
      .filter(e => e.jobId === jobId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10); // Last 10 executions

    return NextResponse.json({
      success: true,
      data: {
        job: status.job,
        isRunning: status.isRunning,
        lastExecution: status.lastExecution,
        recentExecutions: executions,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get batch processing status', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get batch processing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}