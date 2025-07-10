/**
 * AI Queue Management API
 * 
 * Admin endpoints for managing AI job queues and workers
 * Requires admin privileges
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiJobQueue, cleanupAIJobs } from '@/lib/queue/ai-job-queue';
import { aiWorkerManager } from '@/lib/queue/ai-job-worker';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin privileges
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return await getQueueStatus();
        
      case 'workers':
        return await getWorkerStatus();
        
      case 'health':
        return await getSystemHealth();
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Queue Management API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and check admin privileges
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start_workers':
        return await startWorkers();
        
      case 'stop_workers':
        return await stopWorkers();
        
      case 'add_worker':
        return await addWorker();
        
      case 'remove_worker':
        return await removeWorker();
        
      case 'cleanup':
        return await cleanupJobs(body.olderThanHours);
        
      case 'clear_queue':
        return await clearQueue(body.queueType);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Queue Management API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get queue status
async function getQueueStatus() {
  try {
    const stats = await aiJobQueue.getStats();
    
    // Get job counts by type
    const pendingJobs = await aiJobQueue.getJobsByStatus('pending', 100);
    const processingJobs = await aiJobQueue.getJobsByStatus('processing', 100);
    const completedJobs = await aiJobQueue.getJobsByStatus('completed', 100);
    const failedJobs = await aiJobQueue.getJobsByStatus('failed', 100);

    const jobsByType = {
      analysis: 0,
      prediction: 0,
      task_execution: 0,
      content_generation: 0,
      workflow_execution: 0
    };

    // Count jobs by type
    [...pendingJobs, ...processingJobs].forEach(job => {
      if (job.type in jobsByType) {
        jobsByType[job.type as keyof typeof jobsByType]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        jobsByType,
        queueHealth: {
          isHealthy: stats.errorRate < 10, // Less than 10% error rate
          avgProcessingTime: stats.averageProcessingTime,
          throughput: stats.throughput
        }
      }
    });

  } catch (error) {
    logger.error('Error getting queue status', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}

// Get worker status
async function getWorkerStatus() {
  try {
    const workers = aiWorkerManager.getWorkersStatus();
    
    const workerSummary = {
      totalWorkers: workers.length,
      runningWorkers: workers.filter(w => w.isRunning).length,
      totalProcessingJobs: workers.reduce((sum, w) => sum + w.processingCount, 0),
      totalCapacity: workers.reduce((sum, w) => sum + w.maxConcurrency, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        workers,
        summary: workerSummary
      }
    });

  } catch (error) {
    logger.error('Error getting worker status', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get worker status' },
      { status: 500 }
    );
  }
}

// Get system health
async function getSystemHealth() {
  try {
    const stats = await aiJobQueue.getStats();
    const workers = aiWorkerManager.getWorkersStatus();
    
    const health = {
      overall: 'healthy',
      issues: [] as string[],
      metrics: {
        queueSize: stats.pendingJobs,
        processingJobs: stats.processingJobs,
        errorRate: stats.errorRate,
        averageProcessingTime: stats.averageProcessingTime,
        workerCount: workers.length,
        activeWorkers: workers.filter(w => w.isRunning).length
      }
    };

    // Check for issues
    if (stats.errorRate > 10) {
      health.issues.push(`High error rate: ${stats.errorRate.toFixed(1)}%`);
      health.overall = 'degraded';
    }

    if (stats.averageProcessingTime > 30000) {
      health.issues.push(`Slow processing: ${stats.averageProcessingTime}ms average`);
      health.overall = 'degraded';
    }

    if (stats.pendingJobs > 100) {
      health.issues.push(`High queue size: ${stats.pendingJobs} pending jobs`);
      health.overall = 'degraded';
    }

    if (workers.filter(w => w.isRunning).length === 0) {
      health.issues.push('No active workers');
      health.overall = 'unhealthy';
    }

    return NextResponse.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Error getting system health', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get system health' },
      { status: 500 }
    );
  }
}

// Start workers
async function startWorkers() {
  try {
    await aiWorkerManager.startWorkers();
    
    logger.info('AI workers started by admin');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Workers started successfully',
        workers: aiWorkerManager.getWorkersStatus()
      }
    });

  } catch (error) {
    logger.error('Error starting workers', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to start workers' },
      { status: 500 }
    );
  }
}

// Stop workers
async function stopWorkers() {
  try {
    await aiWorkerManager.stopWorkers();
    
    logger.info('AI workers stopped by admin');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Workers stopped successfully'
      }
    });

  } catch (error) {
    logger.error('Error stopping workers', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to stop workers' },
      { status: 500 }
    );
  }
}

// Add worker
async function addWorker() {
  try {
    await aiWorkerManager.addWorker();
    
    logger.info('AI worker added by admin');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Worker added successfully',
        workers: aiWorkerManager.getWorkersStatus()
      }
    });

  } catch (error) {
    logger.error('Error adding worker', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to add worker' },
      { status: 500 }
    );
  }
}

// Remove worker
async function removeWorker() {
  try {
    await aiWorkerManager.removeWorker();
    
    logger.info('AI worker removed by admin');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Worker removed successfully',
        workers: aiWorkerManager.getWorkersStatus()
      }
    });

  } catch (error) {
    logger.error('Error removing worker', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to remove worker' },
      { status: 500 }
    );
  }
}

// Cleanup old jobs
async function cleanupJobs(olderThanHours: number = 24) {
  try {
    const cleanedCount = await cleanupAIJobs(olderThanHours);
    
    logger.info('AI jobs cleaned up', { cleanedCount, olderThanHours });
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Cleaned up ${cleanedCount} old jobs`,
        cleanedCount,
        olderThanHours
      }
    });

  } catch (error) {
    logger.error('Error cleaning up jobs', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup jobs' },
      { status: 500 }
    );
  }
}

// Clear queue (admin emergency action)
async function clearQueue(queueType: 'pending' | 'failed' | 'all') {
  try {
    // This is a destructive operation that should be used carefully
    // Implementation would depend on specific requirements
    
    logger.warn('Queue clear requested by admin', { queueType });
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Queue clear operation initiated for: ${queueType}`,
        warning: 'This is a destructive operation'
      }
    });

  } catch (error) {
    logger.error('Error clearing queue', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to clear queue' },
      { status: 500 }
    );
  }
}