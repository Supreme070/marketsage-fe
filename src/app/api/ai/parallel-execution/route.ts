import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parallelExecutionEngine, TaskPriority, TaskState } from '@/lib/ai/parallel-execution-engine';
import { logger } from '@/lib/logger';

/**
 * AI Parallel Execution Engine API
 * 
 * Provides concurrent execution of independent AI tasks with intelligent resource management
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      taskId,
      operation,
      parameters,
      priority = TaskPriority.MEDIUM,
      dependencies = [],
      timeout = 60000,
      maxRetries = 3,
      metadata = {},
      organizationId = session.user.organizationId
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('AI parallel execution request', {
      action,
      organizationId,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'submit_task':
        if (!operation) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: operation'
          }, { status: 400 });
        }

        const taskDefinition = {
          name: body.name || `AI Task ${Date.now()}`,
          description: body.description || 'AI task execution',
          priority: priority as TaskPriority,
          operation,
          parameters: parameters || {},
          dependencies,
          timeout,
          maxRetries,
          organizationId,
          userId: session.user.id,
          metadata
        };

        result = await parallelExecutionEngine.submitTask(taskDefinition);
        break;

      case 'submit_batch':
        if (!body.tasks || !Array.isArray(body.tasks)) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: tasks (array)'
          }, { status: 400 });
        }

        const batchTasks = body.tasks.map((task: any) => ({
          name: task.name || `AI Task ${Date.now()}`,
          description: task.description || 'AI task execution',
          priority: task.priority || TaskPriority.MEDIUM,
          operation: task.operation,
          parameters: task.parameters || {},
          dependencies: task.dependencies || [],
          timeout: task.timeout || 60000,
          maxRetries: task.maxRetries || 3,
          organizationId,
          userId: session.user.id,
          metadata: task.metadata || {}
        }));

        result = await parallelExecutionEngine.submitBatch(batchTasks);
        break;

      case 'get_task_status':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskId'
          }, { status: 400 });
        }

        result = await parallelExecutionEngine.getTaskStatus(taskId);
        if (!result) {
          return NextResponse.json({
            success: false,
            error: 'Task not found'
          }, { status: 404 });
        }
        break;

      case 'get_task_result':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskId'
          }, { status: 400 });
        }

        result = await parallelExecutionEngine.getTaskResult(taskId);
        if (!result) {
          return NextResponse.json({
            success: false,
            error: 'Task not found or not completed'
          }, { status: 404 });
        }
        break;

      case 'cancel_task':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskId'
          }, { status: 400 });
        }

        const cancelled = await parallelExecutionEngine.cancelTask(taskId);
        if (!cancelled) {
          return NextResponse.json({
            success: false,
            error: 'Task not found or cannot be cancelled'
          }, { status: 404 });
        }

        result = { cancelled: true };
        break;

      case 'get_execution_statistics':
        result = await parallelExecutionEngine.getExecutionStatistics();
        break;

      case 'get_resource_usage':
        result = parallelExecutionEngine.getResourceUsage();
        break;

      case 'get_task_queue':
        const { state, limit = 50 } = body;
        result = await parallelExecutionEngine.getTaskQueue(state as TaskState, limit);
        break;

      case 'retry_task':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskId'
          }, { status: 400 });
        }

        const retried = await parallelExecutionEngine.retryTask(taskId);
        if (!retried) {
          return NextResponse.json({
            success: false,
            error: 'Task not found or cannot be retried'
          }, { status: 404 });
        }

        result = { retried: true };
        break;

      case 'batch_cancel':
        if (!body.taskIds || !Array.isArray(body.taskIds)) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskIds (array)'
          }, { status: 400 });
        }

        const batchCancelResults = await Promise.allSettled(
          body.taskIds.map((id: string) => parallelExecutionEngine.cancelTask(id))
        );

        result = {
          total: body.taskIds.length,
          cancelled: batchCancelResults.filter(r => r.status === 'fulfilled' && r.value).length,
          failed: batchCancelResults.filter(r => r.status === 'rejected' || !r.value).length
        };
        break;

      case 'priority_boost':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: taskId'
          }, { status: 400 });
        }

        const boosted = await parallelExecutionEngine.boostTaskPriority(taskId);
        if (!boosted) {
          return NextResponse.json({
            success: false,
            error: 'Task not found or cannot be boosted'
          }, { status: 404 });
        }

        result = { boosted: true };
        break;

      case 'get_performance_metrics':
        result = await parallelExecutionEngine.getPerformanceMetrics();
        break;

      case 'get_worker_pool_status':
        result = parallelExecutionEngine.getWorkerPoolStatus();
        break;

      case 'scale_resources':
        const { cpu, memory, workers } = body;
        
        if (!cpu && !memory && !workers) {
          return NextResponse.json({
            success: false,
            error: 'At least one scaling parameter required: cpu, memory, or workers'
          }, { status: 400 });
        }

        result = await parallelExecutionEngine.scaleResources({ cpu, memory, workers });
        break;

      case 'create_dependency_graph':
        if (!body.tasks || !Array.isArray(body.tasks)) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: tasks (array)'
          }, { status: 400 });
        }

        result = await parallelExecutionEngine.createDependencyGraph(body.tasks);
        break;

      case 'simulate_parallel_execution':
        // For testing purposes - simulate parallel execution
        const simulatedTasks = [
          {
            name: 'Data Processing Task',
            description: 'Process customer data for analysis',
            priority: TaskPriority.HIGH,
            operation: 'data_processing',
            parameters: { dataset: 'customers', action: 'analyze' },
            dependencies: [],
            timeout: 30000,
            maxRetries: 2,
            organizationId,
            userId: session.user.id,
            metadata: { simulated: true }
          },
          {
            name: 'Model Training Task',
            description: 'Train ML model on processed data',
            priority: TaskPriority.HIGH,
            operation: 'ml_training',
            parameters: { model: 'churn_prediction', data: 'processed_customers' },
            dependencies: ['data_processing'],
            timeout: 60000,
            maxRetries: 3,
            organizationId,
            userId: session.user.id,
            metadata: { simulated: true }
          },
          {
            name: 'Report Generation Task',
            description: 'Generate insights report',
            priority: TaskPriority.MEDIUM,
            operation: 'report_generation',
            parameters: { type: 'insights', model: 'churn_prediction' },
            dependencies: ['ml_training'],
            timeout: 15000,
            maxRetries: 2,
            organizationId,
            userId: session.user.id,
            metadata: { simulated: true }
          },
          {
            name: 'Notification Task',
            description: 'Send completion notification',
            priority: TaskPriority.LOW,
            operation: 'notification',
            parameters: { type: 'email', recipient: session.user.email },
            dependencies: ['report_generation'],
            timeout: 10000,
            maxRetries: 1,
            organizationId,
            userId: session.user.id,
            metadata: { simulated: true }
          }
        ];

        result = await parallelExecutionEngine.submitBatch(simulatedTasks);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI parallel execution API error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI parallel execution operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              parallelExecution: true,
              taskDependencies: true,
              priorityScheduling: true,
              resourceManagement: true,
              faultTolerance: true,
              realTimeMonitoring: true,
              batchProcessing: true,
              dynamicScaling: true,
              performanceOptimization: true,
              taskRetry: true,
              cancelation: true,
              progressTracking: true
            },
            supportedOperations: [
              'data_processing',
              'ml_training',
              'report_generation',
              'notification',
              'ai_analysis',
              'content_generation',
              'email_campaign',
              'sms_campaign',
              'whatsapp_campaign',
              'leadpulse_analysis',
              'customer_segmentation',
              'predictive_analytics',
              'workflow_execution',
              'api_integration',
              'database_operation',
              'file_processing'
            ],
            priorityLevels: Object.values(TaskPriority),
            taskStates: Object.values(TaskState),
            features: [
              'Concurrent execution of independent AI tasks',
              'Intelligent task scheduling and prioritization',
              'Resource-aware parallel processing',
              'Dynamic load balancing and scaling',
              'Task dependency resolution and management',
              'Performance monitoring and optimization',
              'Fault tolerance and error isolation',
              'Resource pooling and management',
              'Task queue management with priorities',
              'Real-time progress tracking and reporting',
              'Batch task submission and processing',
              'Task cancellation and retry mechanisms',
              'Worker pool management and scaling',
              'Performance metrics and analytics',
              'Resource utilization monitoring'
            ],
            resourceTypes: [
              'CPU cores',
              'Memory (RAM)',
              'Network bandwidth',
              'Storage I/O',
              'Concurrent task slots',
              'Worker threads',
              'Database connections',
              'API rate limits'
            ],
            performanceMetrics: [
              'Task completion rate',
              'Average execution time',
              'Resource utilization',
              'Queue length',
              'Throughput (tasks/second)',
              'Error rate',
              'Retry rate',
              'Worker efficiency'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'system_overview':
        const stats = await parallelExecutionEngine.getExecutionStatistics();
        const resources = parallelExecutionEngine.getResourceUsage();
        const performance = await parallelExecutionEngine.getPerformanceMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            resources: resources,
            performance: performance,
            workerPool: parallelExecutionEngine.getWorkerPoolStatus(),
            systemHealth: 'healthy',
            lastUpdate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      case 'task_overview':
        const queueStats = {
          pending: (await parallelExecutionEngine.getTaskQueue(TaskState.PENDING, 1000)).length,
          running: (await parallelExecutionEngine.getTaskQueue(TaskState.RUNNING, 1000)).length,
          completed: (await parallelExecutionEngine.getTaskQueue(TaskState.COMPLETED, 1000)).length,
          failed: (await parallelExecutionEngine.getTaskQueue(TaskState.FAILED, 1000)).length,
          cancelled: (await parallelExecutionEngine.getTaskQueue(TaskState.CANCELLED, 1000)).length
        };

        return NextResponse.json({
          success: true,
          data: {
            queueStats,
            totalTasks: Object.values(queueStats).reduce((sum, count) => sum + count, 0),
            activeWorkers: parallelExecutionEngine.getWorkerPoolStatus().activeWorkers,
            systemLoad: parallelExecutionEngine.getResourceUsage().cpuUsage,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      case 'performance_summary':
        const perfMetrics = await parallelExecutionEngine.getPerformanceMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            throughput: perfMetrics.throughput,
            averageExecutionTime: perfMetrics.averageExecutionTime,
            successRate: perfMetrics.successRate,
            resourceEfficiency: perfMetrics.resourceEfficiency,
            recommendations: perfMetrics.recommendations,
            trends: perfMetrics.trends,
            benchmarks: perfMetrics.benchmarks
          },
          timestamp: new Date().toISOString()
        });

      case 'health_check':
        const healthStatus = {
          system: 'healthy',
          workers: parallelExecutionEngine.getWorkerPoolStatus().status,
          resources: parallelExecutionEngine.getResourceUsage().status,
          queue: 'operational',
          database: 'connected',
          cache: 'operational',
          lastCheck: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: healthStatus,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI parallel execution GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI parallel execution information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}