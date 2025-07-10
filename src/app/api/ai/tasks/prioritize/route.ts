import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { 
  intelligentTaskPrioritizer,
  type TaskContext,
  type PrioritizationConfig
} from '@/lib/ai/intelligent-task-prioritizer';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      taskId, 
      taskIds, 
      userId,
      config 
    } = body;

    switch (action) {
      case 'calculate_single':
        return await handleCalculateSingleTaskPriority(taskId, config);
      
      case 'prioritize_list':
        return await handlePrioritizeTaskList(taskIds, config);
      
      case 'update_priorities':
        return await handleUpdateTaskPriorities(taskIds, body.triggerEvent);
      
      case 'recommend_for_user':
        return await handleRecommendTaskForUser(userId, taskIds, body.userContext);
      
      case 'bulk_recalculate':
        return await handleBulkRecalculate(body.filters);
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Task prioritization API error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCalculateSingleTaskPriority(
  taskId: string,
  config?: Partial<PrioritizationConfig>
) {
  try {
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    // Get task with related data
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true,
        contact: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Build task context
    const context = await buildTaskContextFromDB(task);
    
    // Calculate priority
    const priority = await intelligentTaskPrioritizer.calculateTaskPriority(
      taskId,
      context,
      config
    );

    return NextResponse.json({
      success: true,
      priority,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to calculate task priority', {
      error: error instanceof Error ? error.message : String(error),
      taskId
    });

    return NextResponse.json(
      { error: 'Failed to calculate task priority' },
      { status: 500 }
    );
  }
}

async function handlePrioritizeTaskList(
  taskIds: string[],
  config?: Partial<PrioritizationConfig>
) {
  try {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'taskIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (taskIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 tasks can be prioritized at once' },
        { status: 400 }
      );
    }

    // Get tasks with related data
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        assignee: true,
        creator: true,
        contact: true
      }
    });

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No valid tasks found' },
        { status: 404 }
      );
    }

    // Build contexts for all tasks
    const contexts = await Promise.all(
      tasks.map(task => buildTaskContextFromDB(task))
    );

    // Prioritize the list
    const priorities = await intelligentTaskPrioritizer.prioritizeTaskList(
      tasks,
      contexts,
      config
    );

    return NextResponse.json({
      success: true,
      priorities,
      totalTasks: priorities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to prioritize task list', {
      error: error instanceof Error ? error.message : String(error),
      taskCount: taskIds?.length
    });

    return NextResponse.json(
      { error: 'Failed to prioritize task list' },
      { status: 500 }
    );
  }
}

async function handleUpdateTaskPriorities(
  taskIds: string[],
  triggerEvent: string
) {
  try {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'taskIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const validTriggerEvents = [
      'deadline_approaching',
      'team_capacity_change',
      'customer_escalation',
      'market_change'
    ];

    if (!validTriggerEvents.includes(triggerEvent)) {
      return NextResponse.json(
        { error: `Invalid trigger event. Must be one of: ${validTriggerEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Update task priorities
    const updatedPriorities = await intelligentTaskPrioritizer.updateTaskPriorities(
      taskIds,
      triggerEvent as any
    );

    return NextResponse.json({
      success: true,
      updatedPriorities,
      triggerEvent,
      totalUpdated: updatedPriorities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to update task priorities', {
      error: error instanceof Error ? error.message : String(error),
      triggerEvent,
      taskCount: taskIds?.length
    });

    return NextResponse.json(
      { error: 'Failed to update task priorities' },
      { status: 500 }
    );
  }
}

async function handleRecommendTaskForUser(
  userId: string,
  availableTaskIds: string[],
  userContext?: any
) {
  try {
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(availableTaskIds) || availableTaskIds.length === 0) {
      return NextResponse.json(
        { error: 'availableTaskIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recommended task
    const recommendation = await intelligentTaskPrioritizer.getRecommendedTaskForUser(
      userId,
      availableTaskIds,
      userContext
    );

    if (!recommendation) {
      return NextResponse.json({
        success: true,
        recommendation: null,
        message: 'No suitable task found for user',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      recommendation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get task recommendation for user', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });

    return NextResponse.json(
      { error: 'Failed to get task recommendation' },
      { status: 500 }
    );
  }
}

async function handleBulkRecalculate(filters?: any) {
  try {
    // Get tasks based on filters
    const whereClause: any = {};
    
    if (filters?.status) {
      whereClause.status = { in: filters.status };
    } else {
      whereClause.status = { in: ['TODO', 'IN_PROGRESS'] }; // Default to active tasks
    }

    if (filters?.assigneeId) {
      whereClause.assigneeId = filters.assigneeId;
    }

    if (filters?.priority) {
      whereClause.priority = { in: filters.priority };
    }

    if (filters?.createdAfter) {
      whereClause.createdAt = { gte: new Date(filters.createdAfter) };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: true,
        creator: true,
        contact: true
      },
      take: 100 // Limit to prevent overload
    });

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tasks found matching filters',
        recalculated: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Build contexts and calculate priorities
    const contexts = await Promise.all(
      tasks.map(task => buildTaskContextFromDB(task))
    );

    const priorities = await intelligentTaskPrioritizer.prioritizeTaskList(
      tasks,
      contexts
    );

    return NextResponse.json({
      success: true,
      message: `Recalculated priorities for ${priorities.length} tasks`,
      recalculated: priorities.length,
      totalFiltered: tasks.length,
      highPriorityTasks: priorities.filter(p => p.priority_tier === 'HIGH' || p.priority_tier === 'CRITICAL').length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to bulk recalculate task priorities', {
      error: error instanceof Error ? error.message : String(error),
      filters
    });

    return NextResponse.json(
      { error: 'Failed to bulk recalculate priorities' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return API documentation and configuration options
    return NextResponse.json({
      success: true,
      documentation: {
        description: 'Intelligent task prioritization API using ML-powered scoring',
        actions: {
          calculate_single: {
            description: 'Calculate priority for a single task',
            parameters: ['taskId', 'config?']
          },
          prioritize_list: {
            description: 'Prioritize a list of tasks and return them in order',
            parameters: ['taskIds[]', 'config?']
          },
          update_priorities: {
            description: 'Update task priorities based on changing conditions',
            parameters: ['taskIds[]', 'triggerEvent']
          },
          recommend_for_user: {
            description: 'Get the best task recommendation for a specific user',
            parameters: ['userId', 'availableTaskIds[]', 'userContext?']
          },
          bulk_recalculate: {
            description: 'Recalculate priorities for multiple tasks based on filters',
            parameters: ['filters?']
          }
        },
        triggerEvents: [
          'deadline_approaching',
          'team_capacity_change', 
          'customer_escalation',
          'market_change'
        ],
        priorityTiers: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        africanMarketFeatures: [
          'Business hours optimization',
          'Cultural timing awareness',
          'Local market factors',
          'Multi-timezone support'
        ]
      },
      defaultConfig: {
        factor_weights: {
          urgency: 0.25,
          importance: 0.20,
          complexity: 0.10,
          dependencies: 0.15,
          customer_impact: 0.15,
          revenue_impact: 0.10,
          team_capacity: 0.05,
          market_timing: 0.05
        },
        african_market_emphasis: true,
        team_capacity_consideration: true,
        customer_priority_boost: true,
        deadline_urgency_multiplier: 1.5
      },
      examples: {
        calculate_single: {
          taskId: 'task-123',
          config: {
            factor_weights: { urgency: 0.4, importance: 0.3 },
            african_market_emphasis: true
          }
        },
        prioritize_list: {
          taskIds: ['task-1', 'task-2', 'task-3'],
          config: { customer_priority_boost: true }
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get task prioritization API info', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to get API information' },
      { status: 500 }
    );
  }
}

// Helper function to build task context from database
async function buildTaskContextFromDB(task: any): Promise<TaskContext> {
  try {
    // Get related tasks
    const relatedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { creatorId: task.creatorId },
          { assigneeId: task.assigneeId },
          { contactId: task.contactId }
        ],
        NOT: { id: task.id }
      },
      take: 10
    });

    // Get campaign context if task is related to campaigns
    let campaignContext = null;
    if (task.contactId) {
      try {
        const campaigns = await prisma.emailCampaign.findFirst({
          where: {
            activities: {
              some: { contactId: task.contactId }
            }
          }
        });
        campaignContext = campaigns;
      } catch (error) {
        // Campaign context is optional
      }
    }

    // Get customer context
    let customerContext = null;
    if (task.contactId) {
      try {
        customerContext = await prisma.contact.findUnique({
          where: { id: task.contactId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            leadScore: true,
            tags: true
          }
        });
      } catch (error) {
        // Customer context is optional
      }
    }

    // Infer business domain from task content
    const businessDomain = inferBusinessDomain(task);

    return {
      task,
      assignee: task.assignee,
      related_tasks: relatedTasks,
      campaign_context: campaignContext,
      customer_context: customerContext,
      deadline: task.dueDate,
      estimated_effort: task.estimatedHours || 4,
      business_domain: businessDomain
    };

  } catch (error) {
    logger.error('Failed to build task context', {
      error: error instanceof Error ? error.message : String(error),
      taskId: task.id
    });

    // Return minimal context on error
    return {
      task,
      assignee: task.assignee,
      related_tasks: [],
      business_domain: 'general',
      estimated_effort: 4
    };
  }
}

function inferBusinessDomain(task: any): string {
  const title = task.title?.toLowerCase() || '';
  const description = task.description?.toLowerCase() || '';
  const combined = `${title} ${description}`;
  
  if (combined.includes('customer') || combined.includes('support')) return 'customer_success';
  if (combined.includes('sale') || combined.includes('lead') || combined.includes('prospect')) return 'sales';
  if (combined.includes('campaign') || combined.includes('marketing')) return 'marketing';
  if (combined.includes('feature') || combined.includes('development')) return 'product';
  if (combined.includes('bug') || combined.includes('fix')) return 'engineering';
  
  return 'general';
}