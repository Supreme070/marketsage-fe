import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const queueUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'ERROR', 'MAINTENANCE', 'OFFLINE']).optional(),
  totalJobs: z.number().min(0).optional(),
  pendingJobs: z.number().min(0).optional(),
  processingJobs: z.number().min(0).optional(),
  completedJobs: z.number().min(0).optional(),
  failedJobs: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(100).optional(),
  throughput: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

const queueCreateSchema = z.object({
  queueName: z.string().min(1),
  status: z.enum(['ACTIVE', 'PAUSED', 'ERROR', 'MAINTENANCE', 'OFFLINE']).default('ACTIVE'),
  totalJobs: z.number().min(0).default(0),
  pendingJobs: z.number().min(0).default(0),
  processingJobs: z.number().min(0).default(0),
  completedJobs: z.number().min(0).default(0),
  failedJobs: z.number().min(0).default(0),
  errorRate: z.number().min(0).max(100).default(0),
  throughput: z.number().min(0).default(0),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/admin/messages/queues
 * Get all message queues with their current status
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || '';
    const queueName = url.searchParams.get('queueName') || '';
    const sortBy = url.searchParams.get('sortBy') || 'queueName';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';

    // Log the admin action
    await logAdminAction(user, 'VIEW_MESSAGE_QUEUES', 'queues', {
      filters: { status, queueName },
    });

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (queueName) {
      where.queueName = {
        contains: queueName,
        mode: 'insensitive',
      };
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get queues
    const queues = await prisma.messageQueue.findMany({
      where,
      orderBy,
      select: {
        id: true,
        queueName: true,
        status: true,
        totalJobs: true,
        pendingJobs: true,
        processingJobs: true,
        completedJobs: true,
        failedJobs: true,
        lastProcessed: true,
        avgProcessTime: true,
        errorRate: true,
        throughput: true,
        metadata: true,
        updatedAt: true,
      },
    });

    // Calculate queue statistics
    const stats = {
      totalQueues: queues.length,
      activeQueues: queues.filter(q => q.status === 'ACTIVE').length,
      pausedQueues: queues.filter(q => q.status === 'PAUSED').length,
      errorQueues: queues.filter(q => q.status === 'ERROR').length,
      totalPendingJobs: queues.reduce((sum, q) => sum + q.pendingJobs, 0),
      totalFailedJobs: queues.reduce((sum, q) => sum + q.failedJobs, 0),
      totalCompletedJobs: queues.reduce((sum, q) => sum + q.completedJobs, 0),
      avgErrorRate: queues.length > 0 ? queues.reduce((sum, q) => sum + q.errorRate, 0) / queues.length : 0,
      avgThroughput: queues.length > 0 ? queues.reduce((sum, q) => sum + q.throughput, 0) / queues.length : 0,
    };

    // Enhance queue data with health status
    const enhancedQueues = queues.map(queue => ({
      ...queue,
      healthStatus: calculateQueueHealth(queue),
      processingRate: queue.totalJobs > 0 ? Math.round((queue.completedJobs / queue.totalJobs) * 100) : 0,
      lastProcessedAgo: queue.lastProcessed ? Date.now() - new Date(queue.lastProcessed).getTime() : null,
    }));

    // Get queue performance over time (last 24 hours)
    const performanceData = await getQueuePerformanceData();

    return Response.json({
      success: true,
      data: {
        queues: enhancedQueues,
        stats,
        performance: performanceData,
      },
    });

  } catch (error) {
    console.error('Admin message queues error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch message queues',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * POST /api/admin/messages/queues
 * Create or update a message queue
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = queueCreateSchema.parse(body);

    // Check if queue already exists
    const existingQueue = await prisma.messageQueue.findUnique({
      where: { queueName: validatedData.queueName },
    });

    let queue;
    if (existingQueue) {
      // Update existing queue
      queue = await prisma.messageQueue.update({
        where: { queueName: validatedData.queueName },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new queue
      queue = await prisma.messageQueue.create({
        data: validatedData,
      });
    }

    // Log the admin action
    await logAdminAction(user, existingQueue ? 'UPDATE_MESSAGE_QUEUE' : 'CREATE_MESSAGE_QUEUE', 'queues', {
      queueName: queue.queueName,
      status: queue.status,
    });

    return Response.json({
      success: true,
      message: `Queue ${existingQueue ? 'updated' : 'created'} successfully`,
      data: queue,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid queue data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Admin message queue creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create/update queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Calculate queue health status
 */
function calculateQueueHealth(queue: any): string {
  // Check if queue is active
  if (queue.status !== 'ACTIVE') {
    return queue.status.toLowerCase();
  }

  // Check error rate
  if (queue.errorRate > 20) {
    return 'critical';
  } else if (queue.errorRate > 10) {
    return 'warning';
  }

  // Check if queue is processing jobs
  const timeSinceLastProcessed = queue.lastProcessed 
    ? Date.now() - new Date(queue.lastProcessed).getTime()
    : Infinity;

  if (timeSinceLastProcessed > 30 * 60 * 1000) { // 30 minutes
    return 'stale';
  } else if (timeSinceLastProcessed > 10 * 60 * 1000) { // 10 minutes
    return 'warning';
  }

  // Check pending job backlog
  if (queue.pendingJobs > 1000) {
    return 'warning';
  }

  return 'healthy';
}

/**
 * Get queue performance data for charts
 */
async function getQueuePerformanceData(): Promise<any> {
  try {
    // This would typically query a time-series database or metrics store
    // For now, we'll return mock data structure
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      return {
        timestamp: hour.toISOString(),
        totalJobs: Math.floor(Math.random() * 1000) + 500,
        completedJobs: Math.floor(Math.random() * 900) + 400,
        failedJobs: Math.floor(Math.random() * 50) + 10,
        errorRate: Math.random() * 5 + 1, // 1-6%
        throughput: Math.floor(Math.random() * 100) + 50, // jobs per minute
      };
    }).reverse();

    return {
      hourly: hours,
      summary: {
        avgThroughput: hours.reduce((sum, h) => sum + h.throughput, 0) / hours.length,
        avgErrorRate: hours.reduce((sum, h) => sum + h.errorRate, 0) / hours.length,
        totalJobsProcessed: hours.reduce((sum, h) => sum + h.completedJobs, 0),
        totalFailures: hours.reduce((sum, h) => sum + h.failedJobs, 0),
      },
    };
  } catch (error) {
    console.error('Failed to get queue performance data:', error);
    return { hourly: [], summary: {} };
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}