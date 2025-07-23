/**
 * Autonomous Execution API Endpoint
 * =================================
 * Comprehensive API for managing autonomous AI task execution, including
 * task registration, monitoring, predictive insights, and governance controls.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { autonomousExecutionFramework } from '@/lib/ai/autonomous-execution-framework';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const TaskRegistrationSchema = z.object({
  type: z.enum(['scheduled', 'triggered', 'predictive', 'reactive']),
  taskType: z.string().min(1),
  description: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  parameters: z.record(z.any()),
  conditions: z.array(z.object({
    type: z.enum(['time', 'data', 'event', 'metric', 'approval']),
    operator: z.enum(['equals', 'greater_than', 'less_than', 'contains', 'exists']),
    field: z.string(),
    value: z.any(),
    required: z.boolean()
  })).optional(),
  dependencies: z.array(z.string()).optional(),
  maxRetries: z.number().min(0).max(5).default(3),
  timeoutMs: z.number().min(1000).max(300000).default(60000),
  schedule: z.object({
    type: z.enum(['interval', 'cron', 'event_driven']),
    interval: z.number().optional(),
    cronExpression: z.string().optional(),
    eventTrigger: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'register';

    switch (action) {
      case 'register':
        return await handleTaskRegistration(request, session);
      
      case 'cancel':
        return await handleTaskCancellation(request, session);
      
      case 'status':
        return await handleStatusRequest(request, session);
      
      case 'insights':
        return await handleInsightsRequest(request, session);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Autonomous Execution API error', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    const taskId = url.searchParams.get('taskId');

    switch (action) {
      case 'list':
        const tasks = await autonomousExecutionFramework.getAutonomousTasks(session.user.id);
        
        return NextResponse.json({
          success: true,
          data: {
            tasks: tasks.map(task => ({
              id: task.id,
              type: task.type,
              taskType: task.taskType,
              description: task.description,
              priority: task.priority,
              riskLevel: task.riskLevel,
              status: task.status,
              createdAt: task.createdAt,
              lastExecuted: task.lastExecuted,
              nextExecution: task.nextExecution,
              executionCount: task.executionHistory.length,
              successRate: task.executionHistory.length > 0 ? 
                (task.executionHistory.filter(e => e.status === 'completed').length / task.executionHistory.length) * 100 : 0
            })),
            totalTasks: tasks.length
          }
        });

      case 'detail':
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID required' },
            { status: 400 }
          );
        }

        const task = await autonomousExecutionFramework.getTaskById(taskId);
        if (!task || task.userId !== session.user.id) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        const insights = await autonomousExecutionFramework.getPredictiveInsights(taskId);
        
        return NextResponse.json({
          success: true,
          data: {
            task,
            insights,
            performanceAnalytics: {
              totalExecutions: task.executionHistory.length,
              successfulExecutions: task.executionHistory.filter(e => e.status === 'completed').length,
              failedExecutions: task.executionHistory.filter(e => e.status === 'failed').length,
              averageExecutionTime: task.executionHistory.length > 0 ? 
                task.executionHistory
                  .filter(e => e.executionTime)
                  .reduce((sum, e) => sum + (e.executionTime || 0), 0) / task.executionHistory.length : 0,
              lastExecution: task.executionHistory[task.executionHistory.length - 1],
              recentTrend: task.executionHistory.slice(-5).map(e => ({
                time: e.startTime,
                status: e.status,
                executionTime: e.executionTime
              }))
            }
          }
        });

      case 'framework-status':
        const frameworkStatus = autonomousExecutionFramework.getFrameworkStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            ...frameworkStatus,
            capabilities: {
              autonomousExecution: true,
              predictiveInsights: true,
              governanceRules: true,
              rollbackSupport: true,
              scheduleOptimization: true,
              resourceMonitoring: true
            }
          }
        });

      case 'insights':
        const allInsights = await autonomousExecutionFramework.getPredictiveInsights();
        const userInsights = allInsights.filter(insight => {
          const task = autonomousExecutionFramework.getTaskById(insight.taskId);
          return task && task.userId === session.user.id;
        });

        return NextResponse.json({
          success: true,
          data: {
            insights: userInsights,
            summary: {
              totalInsights: userInsights.length,
              highConfidenceInsights: userInsights.filter(i => i.confidence > 0.8).length,
              criticalImpactInsights: userInsights.filter(i => i.impact === 'critical').length,
              upcomingActions: userInsights
                .filter(i => i.timeframe <= 2)
                .map(i => ({
                  taskId: i.taskId,
                  predictionType: i.predictionType,
                  impact: i.impact,
                  timeframe: i.timeframe,
                  primaryRecommendation: i.recommendations[0]
                }))
            }
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Autonomous Execution GET API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleTaskRegistration(request: NextRequest, session: any) {
  const body = await request.json();
  
  // Validate request body
  const validation = TaskRegistrationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validation.error.issues
      },
      { status: 400 }
    );
  }

  const taskData = validation.data;

  // Check user permissions for autonomous task creation
  if (taskData.riskLevel === 'critical' && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Insufficient permissions for critical risk tasks' },
      { status: 403 }
    );
  }

  try {
    const taskId = await autonomousExecutionFramework.registerAutonomousTask({
      ...taskData,
      userId: session.user.id,
      userRole: session.user.role || 'USER',
      conditions: taskData.conditions || [],
      dependencies: taskData.dependencies || []
    });

    logger.info('Autonomous task registered via API', {
      taskId,
      userId: session.user.id,
      taskType: taskData.taskType,
      priority: taskData.priority,
      riskLevel: taskData.riskLevel
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        message: 'Autonomous task registered successfully',
        registrationTime: new Date().toISOString()
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    
    logger.error('Failed to register autonomous task', {
      userId: session.user.id,
      error: errorMessage,
      taskData: { ...taskData, parameters: '[REDACTED]' }
    });

    return NextResponse.json(
      { 
        error: 'Failed to register autonomous task',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

async function handleTaskCancellation(request: NextRequest, session: any) {
  const { taskId } = await request.json();
  
  if (!taskId) {
    return NextResponse.json(
      { error: 'Task ID required' },
      { status: 400 }
    );
  }

  // Verify task ownership
  const task = await autonomousExecutionFramework.getTaskById(taskId);
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json(
      { error: 'Task not found or access denied' },
      { status: 404 }
    );
  }

  try {
    const cancelled = await autonomousExecutionFramework.cancelTask(taskId);
    
    if (cancelled) {
      logger.info('Autonomous task cancelled via API', {
        taskId,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        data: {
          taskId,
          message: 'Task cancelled successfully',
          cancellationTime: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to cancel task' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Failed to cancel autonomous task', {
      taskId,
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to cancel task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleStatusRequest(request: NextRequest, session: any) {
  const { taskIds } = await request.json();
  
  if (!Array.isArray(taskIds)) {
    return NextResponse.json(
      { error: 'Task IDs array required' },
      { status: 400 }
    );
  }

  try {
    const statuses = [];
    
    for (const taskId of taskIds) {
      const task = await autonomousExecutionFramework.getTaskById(taskId);
      
      if (task && task.userId === session.user.id) {
        statuses.push({
          taskId,
          status: task.status,
          lastExecuted: task.lastExecuted,
          nextExecution: task.nextExecution,
          recentExecutions: task.executionHistory.slice(-3).map(e => ({
            status: e.status,
            startTime: e.startTime,
            executionTime: e.executionTime
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        statuses,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get task statuses', {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to get task statuses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleInsightsRequest(request: NextRequest, session: any) {
  const { taskId, predictionTypes } = await request.json();
  
  try {
    let insights;
    
    if (taskId) {
      // Verify task ownership
      const task = await autonomousExecutionFramework.getTaskById(taskId);
      if (!task || task.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Task not found or access denied' },
          { status: 404 }
        );
      }
      
      insights = await autonomousExecutionFramework.getPredictiveInsights(taskId);
    } else {
      // Get all insights for user's tasks
      const allInsights = await autonomousExecutionFramework.getPredictiveInsights();
      insights = [];
      
      for (const insight of allInsights) {
        const task = await autonomousExecutionFramework.getTaskById(insight.taskId);
        if (task && task.userId === session.user.id) {
          insights.push(insight);
        }
      }
    }

    // Filter by prediction types if specified
    if (predictionTypes && Array.isArray(predictionTypes)) {
      insights = insights.filter(insight => predictionTypes.includes(insight.predictionType));
    }

    // Sort by confidence and impact
    insights.sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = b.confidence * impactOrder[b.impact];
      const bScore = a.confidence * impactOrder[a.impact];
      return bScore - aScore;
    });

    return NextResponse.json({
      success: true,
      data: {
        insights,
        analytics: {
          totalInsights: insights.length,
          averageConfidence: insights.length > 0 ? 
            insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0,
          impactDistribution: insights.reduce((acc, i) => {
            acc[i.impact] = (acc[i.impact] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          predictionTypeDistribution: insights.reduce((acc, i) => {
            acc[i.predictionType] = (acc[i.predictionType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get predictive insights', {
      userId: session.user.id,
      taskId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        error: 'Failed to get predictive insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}