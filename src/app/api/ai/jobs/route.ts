/**
 * AI Jobs API
 * 
 * API endpoints for managing AI job queues
 * Supports job creation, status checking, and queue management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiJobQueue, addAIJob, getAIJobStatus, getAIJobStats, cancelAIJob } from '@/lib/queue/ai-job-queue';
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
    const { action, type, payload, options } = body;

    switch (action) {
      case 'create':
        return await createJob(type, payload, options, session.user.id);
        
      case 'cancel':
        return await cancelJob(body.jobId, session.user.id);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Jobs API error', { error });
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
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    switch (action) {
      case 'status':
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        return await getJobStatus(jobId, session.user.id);
        
      case 'stats':
        return await getJobStats();
        
      case 'list':
        return await listJobs(status as any, session.user.id);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Jobs API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new AI job
async function createJob(type: string, payload: any, options: any, userId: string) {
  try {
    // Validate job type
    const validTypes = ['analysis', 'prediction', 'task_execution', 'content_generation', 'workflow_execution'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job type' },
        { status: 400 }
      );
    }

    // Add user ID to payload
    const jobPayload = {
      ...payload,
      userId
    };

    // Create job with options
    const jobId = await addAIJob(type as any, jobPayload, options);

    logger.info('AI job created', {
      jobId,
      type,
      userId,
      priority: options?.priority || 'medium'
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        type,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error creating AI job', { error, type, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// Get job status
async function getJobStatus(jobId: string, userId: string) {
  try {
    const job = await getAIJobStatus(jobId);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this job
    if (job.payload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        retries: job.retries,
        maxRetries: job.maxRetries,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTime: job.processingTime,
        workerId: job.workerId,
        error: job.error,
        result: job.result
      }
    });

  } catch (error) {
    logger.error('Error getting job status', { error, jobId, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

// Get job statistics
async function getJobStats() {
  try {
    const stats = await getAIJobStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting job stats', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get job stats' },
      { status: 500 }
    );
  }
}

// List jobs by status
async function listJobs(status: string, userId: string) {
  try {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const jobs = await aiJobQueue.getJobsByStatus(status as any, 50);
    
    // Filter jobs for current user
    const userJobs = jobs.filter(job => job.payload.userId === userId);

    return NextResponse.json({
      success: true,
      data: userJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        retries: job.retries,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTime: job.processingTime,
        workerId: job.workerId,
        error: job.error
      }))
    });

  } catch (error) {
    logger.error('Error listing jobs', { error, status, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to list jobs' },
      { status: 500 }
    );
  }
}

// Cancel a job
async function cancelJob(jobId: string, userId: string) {
  try {
    // Check if user has access to this job
    const job = await getAIJobStatus(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.payload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const cancelled = await cancelAIJob(jobId);

    if (cancelled) {
      logger.info('AI job cancelled', { jobId, userId });
      
      return NextResponse.json({
        success: true,
        data: {
          jobId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel job' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Error cancelling job', { error, jobId, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}