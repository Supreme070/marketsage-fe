import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowQueueMonitor } from '@/lib/workflow/queue-monitor';
import { QueueManager } from '@/lib/queue';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const workflowId = searchParams.get('workflowId');
    const includeErrors = searchParams.get('includeErrors') === 'true';

    // Convert time range to date
    const getTimeRangeDate = (range: string): Date => {
      const now = new Date();
      switch (range) {
        case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
        case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
        case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    };

    const fromDate = getTimeRangeDate(timeRange);

    if (workflowId) {
      // Get detailed stats for specific workflow
      const workflowStats = await workflowQueueMonitor.getWorkflowStats(workflowId);
      
      // Get execution history
      const executions = await prisma.workflowExecution.findMany({
        where: {
          workflowId,
          createdAt: { gte: fromDate }
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          error: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      // Calculate hourly execution data for charts
      const hourlyStats = new Map<string, { successful: number; failed: number; total: number }>();
      
      executions.forEach(exec => {
        const hour = new Date(exec.createdAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        const current = hourlyStats.get(hour) || { successful: 0, failed: 0, total: 0 };
        
        current.total++;
        if (exec.status === 'COMPLETED') current.successful++;
        if (exec.status === 'FAILED') current.failed++;
        
        hourlyStats.set(hour, current);
      });

      const chartData = Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
        time: hour,
        ...stats,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      })).sort((a, b) => a.time.localeCompare(b.time));

      return NextResponse.json({
        success: true,
        data: {
          workflow: workflowStats[0] || null,
          executions: includeErrors ? executions : executions.filter(e => !e.error),
          chartData,
          summary: {
            totalExecutions: executions.length,
            successfulExecutions: executions.filter(e => e.status === 'COMPLETED').length,
            failedExecutions: executions.filter(e => e.status === 'FAILED').length,
            runningExecutions: executions.filter(e => e.status === 'RUNNING').length,
          }
        },
        timeRange,
        timestamp: new Date().toISOString()
      });
    }

    // Get overall workflow statistics
    const [queueStats, workflowStats, systemMetrics] = await Promise.all([
      QueueManager.getQueueStats(),
      workflowQueueMonitor.getWorkflowStats(),
      getSystemMetrics(fromDate)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        queues: queueStats,
        workflows: workflowStats,
        system: systemMetrics,
      },
      timeRange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting workflow stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getSystemMetrics(fromDate: Date) {
  try {
    const [
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      avgExecutionTime,
      topWorkflows,
      errorsByWorkflow
    ] = await Promise.all([
      // Total executions in time range
      prisma.workflowExecution.count({
        where: { createdAt: { gte: fromDate } }
      }),
      
      // Successful executions
      prisma.workflowExecution.count({
        where: { 
          createdAt: { gte: fromDate },
          status: 'COMPLETED'
        }
      }),
      
      // Failed executions
      prisma.workflowExecution.count({
        where: { 
          createdAt: { gte: fromDate },
          status: 'FAILED'
        }
      }),
      
      // Currently running executions
      prisma.workflowExecution.count({
        where: { status: 'RUNNING' }
      }),
      
      // Average execution time
      prisma.workflowExecution.findMany({
        where: {
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null },
          createdAt: { gte: fromDate }
        },
        select: { startedAt: true, completedAt: true },
        take: 1000
      }).then(executions => {
        if (executions.length === 0) return 0;
        
        const totalTime = executions.reduce((sum, exec) => {
          if (exec.startedAt && exec.completedAt) {
            return sum + (exec.completedAt.getTime() - exec.startedAt.getTime());
          }
          return sum;
        }, 0);
        
        return totalTime / executions.length;
      }),
      
      // Top workflows by execution count
      prisma.workflowExecution.groupBy({
        by: ['workflowId'],
        where: { createdAt: { gte: fromDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (groups) => {
        const workflowIds = groups.map(g => g.workflowId);
        const workflows = await prisma.workflow.findMany({
          where: { id: { in: workflowIds } },
          select: { id: true, name: true }
        });
        
        return groups.map(group => ({
          workflowId: group.workflowId,
          name: workflows.find(w => w.id === group.workflowId)?.name || 'Unknown',
          executionCount: group._count.id
        }));
      }),
      
      // Errors by workflow
      prisma.workflowExecution.groupBy({
        by: ['workflowId'],
        where: { 
          createdAt: { gte: fromDate },
          status: 'FAILED'
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (groups) => {
        const workflowIds = groups.map(g => g.workflowId);
        const workflows = await prisma.workflow.findMany({
          where: { id: { in: workflowIds } },
          select: { id: true, name: true }
        });
        
        return groups.map(group => ({
          workflowId: group.workflowId,
          name: workflows.find(w => w.id === group.workflowId)?.name || 'Unknown',
          errorCount: group._count.id
        }));
      })
    ]);

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Calculate throughput (executions per hour)
    const hoursInRange = Math.max(1, (Date.now() - fromDate.getTime()) / (1000 * 60 * 60));
    const throughput = totalExecutions / hoursInRange;

    return {
      executions: {
        total: totalExecutions,
        successful: successfulExecutions,
        failed: failedExecutions,
        running: runningExecutions,
        successRate,
      },
      performance: {
        avgExecutionTime,
        throughput,
        hoursInRange,
      },
      insights: {
        topWorkflows,
        errorsByWorkflow,
      }
    };
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    return {
      executions: { total: 0, successful: 0, failed: 0, running: 0, successRate: 0 },
      performance: { avgExecutionTime: 0, throughput: 0, hoursInRange: 0 },
      insights: { topWorkflows: [], errorsByWorkflow: [] }
    };
  }
}