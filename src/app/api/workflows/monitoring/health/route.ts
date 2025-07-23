import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowQueueMonitor } from '@/lib/workflow/queue-monitor';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const workflowId = searchParams.get('workflowId');

    if (workflowId) {
      // Get detailed stats for specific workflow
      const workflowStats = await workflowQueueMonitor.getWorkflowStats(workflowId);
      return NextResponse.json({
        success: true,
        data: workflowStats[0] || null,
        timestamp: new Date().toISOString()
      });
    }

    if (detailed) {
      // Get comprehensive system health
      const systemHealth = await workflowQueueMonitor.getSystemHealth();
      return NextResponse.json({
        success: true,
        data: systemHealth,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get basic queue health
      const queueHealth = await workflowQueueMonitor.getQueueHealth();
      return NextResponse.json({
        success: true,
        data: {
          queues: queueHealth,
          overall: queueHealth.every(q => q.status === 'healthy') ? 'healthy' : 
                   queueHealth.some(q => q.status === 'critical' || q.status === 'down') ? 'critical' : 'warning'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Error getting workflow health:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow health',
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

    // Check if user has admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { action, queueName, olderThan } = await request.json();

    switch (action) {
      case 'pause_queue':
        if (!queueName) {
          return NextResponse.json({ error: 'Queue name is required' }, { status: 400 });
        }
        await workflowQueueMonitor.pauseQueue(queueName);
        return NextResponse.json({
          success: true,
          message: `Queue ${queueName} paused successfully`
        });

      case 'resume_queue':
        if (!queueName) {
          return NextResponse.json({ error: 'Queue name is required' }, { status: 400 });
        }
        await workflowQueueMonitor.resumeQueue(queueName);
        return NextResponse.json({
          success: true,
          message: `Queue ${queueName} resumed successfully`
        });

      case 'clean_failed_jobs':
        if (!queueName) {
          return NextResponse.json({ error: 'Queue name is required' }, { status: 400 });
        }
        const cleanedCount = await workflowQueueMonitor.cleanFailedJobs(
          queueName, 
          olderThan || 24 * 60 * 60 * 1000
        );
        return NextResponse.json({
          success: true,
          message: `Cleaned ${cleanedCount} failed jobs from ${queueName} queue`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in workflow health action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}