/**
 * Batch Scheduler Management API
 * ==============================
 * 
 * Manage the batch processing scheduler system
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBatchScheduler, startBatchScheduler, stopBatchScheduler } from '@/lib/batch/scheduler';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const scheduler = getBatchScheduler();
    const jobs = scheduler.getJobs();
    const executions = scheduler.getExecutions();

    // Get summary statistics
    const activeJobs = jobs.filter(j => j.isActive).length;
    const recentExecutions = executions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 20);

    const executionStats = {
      total: executions.length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length
    };

    return NextResponse.json({
      success: true,
      data: {
        scheduler: {
          isRunning: true, // Assume running if we can get the instance
          totalJobs: jobs.length,
          activeJobs,
          executionStats
        },
        jobs: jobs.map(job => ({
          ...job,
          nextRun: job.nextRun.toISOString(),
          lastRun: job.lastRun?.toISOString()
        })),
        recentExecutions: recentExecutions.map(exec => ({
          ...exec,
          startTime: exec.startTime.toISOString(),
          endTime: exec.endTime?.toISOString(),
          duration: exec.endTime ? 
            exec.endTime.getTime() - exec.startTime.getTime() : null
        })),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get batch scheduler status', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only SUPER_ADMIN can control the scheduler
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    logger.info('Batch scheduler action requested', {
      action,
      userId: session.user.id,
      userRole: session.user.role
    });

    switch (action) {
      case 'start':
        const scheduler = startBatchScheduler();
        return NextResponse.json({
          success: true,
          message: 'Batch scheduler started',
          data: {
            isRunning: true,
            jobs: scheduler.getJobs().length
          }
        });

      case 'stop':
        stopBatchScheduler();
        return NextResponse.json({
          success: true,
          message: 'Batch scheduler stopped',
          data: {
            isRunning: false
          }
        });

      case 'restart':
        stopBatchScheduler();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const restartedScheduler = startBatchScheduler();
        return NextResponse.json({
          success: true,
          message: 'Batch scheduler restarted',
          data: {
            isRunning: true,
            jobs: restartedScheduler.getJobs().length
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Failed to control batch scheduler', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to control scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}