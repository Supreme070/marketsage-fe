import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiAuditTrailSystem } from '@/lib/ai/ai-audit-trail-system';
import { aiStreamingService } from '@/lib/websocket/ai-streaming-service';
import type { UserRole } from '@prisma/client';

/**
 * AI Task Approval API
 * 
 * Provides task preview and approval functionality for AI operations
 */

interface AITaskApprovalRequest {
  taskId: string;
  action: 'approve' | 'reject' | 'modify' | 'preview';
  reason?: string;
  modifications?: any;
}

interface AITask {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'automation' | 'campaign' | 'optimization' | 'integration' | 'workflow';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
  requiredPermissions: string[];
  estimatedDuration: number;
  resourceRequirements: {
    cpu: number;
    memory: number;
    network: boolean;
    database: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impactAssessment: {
    dataAccess: string[];
    systemChanges: string[];
    userImpact: string;
    businessImpact: string;
  };
  parameters: Record<string, any>;
  expectedOutputs: string[];
  dependencies: string[];
  rollbackPlan: string;
  confidenceScore: number;
  createdAt: Date;
  requestedBy: string;
  approvalRequired: boolean;
  autoApprove: boolean;
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring';
    scheduledAt?: Date;
    recurrence?: string;
  };
}

// In-memory store for demo purposes - in production, use database
const taskStore = new Map<string, AITask>();

// Initialize with sample tasks
const initializeSampleTasks = () => {
  const sampleTasks: AITask[] = [
    {
      id: 'task-001',
      name: 'Customer Behavior Analysis',
      description: 'Analyze customer behavior patterns to improve engagement strategies',
      type: 'analysis',
      priority: 'high',
      status: 'pending',
      requiredPermissions: ['analytics:read', 'customers:read'],
      estimatedDuration: 300000,
      resourceRequirements: {
        cpu: 0.4,
        memory: 0.3,
        network: true,
        database: true
      },
      riskLevel: 'medium',
      impactAssessment: {
        dataAccess: ['Customer interaction data', 'Purchase history', 'Behavioral metrics'],
        systemChanges: ['Create behavior profiles', 'Update analytics dashboard'],
        userImpact: 'Enhanced customer insights and targeting capabilities',
        businessImpact: 'Improved customer engagement and retention rates'
      },
      parameters: {
        analysisType: 'behavioral_patterns',
        timeframe: '30_days',
        segmentation: 'dynamic'
      },
      expectedOutputs: [
        'Customer behavior patterns report',
        'Engagement optimization recommendations',
        'Predictive models for customer actions'
      ],
      dependencies: ['Customer data pipeline', 'Analytics infrastructure'],
      rollbackPlan: 'Remove generated profiles and restore previous analytics configuration',
      confidenceScore: 89,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      requestedBy: 'Marketing Analytics Team',
      approvalRequired: true,
      autoApprove: false
    },
    {
      id: 'task-002',
      name: 'Email Campaign Personalization',
      description: 'Implement AI-driven personalization for email campaigns',
      type: 'campaign',
      priority: 'medium',
      status: 'pending',
      requiredPermissions: ['campaigns:write', 'templates:modify'],
      estimatedDuration: 240000,
      resourceRequirements: {
        cpu: 0.3,
        memory: 0.2,
        network: true,
        database: true
      },
      riskLevel: 'low',
      impactAssessment: {
        dataAccess: ['Email campaign data', 'Customer preferences', 'Performance metrics'],
        systemChanges: ['Update email templates', 'Modify personalization engine'],
        userImpact: 'Personalized email content for all recipients',
        businessImpact: 'Increased email engagement and conversion rates'
      },
      parameters: {
        personalizationLevel: 'advanced',
        contentTypes: ['subject_lines', 'body_content', 'cta_buttons'],
        testGroup: 'segment_a'
      },
      expectedOutputs: [
        'Personalized email templates',
        'Performance prediction models',
        'A/B testing recommendations'
      ],
      dependencies: ['Email service integration', 'Customer segmentation'],
      rollbackPlan: 'Restore original email templates and disable personalization',
      confidenceScore: 92,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      requestedBy: 'Email Marketing Team',
      approvalRequired: false,
      autoApprove: true
    },
    {
      id: 'task-003',
      name: 'Database Query Optimization',
      description: 'Optimize database queries for improved application performance',
      type: 'optimization',
      priority: 'critical',
      status: 'pending',
      requiredPermissions: ['database:admin', 'system:modify'],
      estimatedDuration: 600000,
      resourceRequirements: {
        cpu: 0.6,
        memory: 0.4,
        network: false,
        database: true
      },
      riskLevel: 'high',
      impactAssessment: {
        dataAccess: ['Database performance metrics', 'Query execution plans', 'Index statistics'],
        systemChanges: ['Create optimized indexes', 'Rewrite slow queries', 'Update database schema'],
        userImpact: 'Faster application response times across all features',
        businessImpact: 'Reduced infrastructure costs and improved user experience'
      },
      parameters: {
        optimizationScope: 'full_system',
        performanceTarget: '50_percent_improvement',
        maintenanceWindow: true
      },
      expectedOutputs: [
        'Database optimization report',
        'Performance improvement metrics',
        'Monitoring dashboard updates'
      ],
      dependencies: ['Database maintenance window', 'Performance monitoring tools'],
      rollbackPlan: 'Restore previous database configuration and remove optimization changes',
      confidenceScore: 78,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      requestedBy: 'Database Administrator',
      approvalRequired: true,
      autoApprove: false
    }
  ];

  sampleTasks.forEach(task => {
    taskStore.set(task.id, task);
  });
};

// Initialize sample tasks
initializeSampleTasks();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;

    if (taskId) {
      // Get specific task
      const task = taskStore.get(taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: task,
        timestamp: new Date().toISOString()
      });
    }

    // Get all tasks with optional filtering
    let tasks = Array.from(taskStore.values());

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    if (type) {
      tasks = tasks.filter(task => task.type === type);
    }

    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }

    // Sort by creation time (newest first)
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      approved: tasks.filter(t => t.status === 'approved').length,
      rejected: tasks.filter(t => t.status === 'rejected').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      highRisk: tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length
    };

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task approval GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI tasks',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action, reason, modifications } = body as AITaskApprovalRequest;

    if (!taskId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: taskId, action'
      }, { status: 400 });
    }

    const task = taskStore.get(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    logger.info('AI task approval action', {
      taskId,
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    let result;
    let auditAction = '';
    let auditDetails: any = {};

    switch (action) {
      case 'preview':
        result = task;
        auditAction = 'ai_task_previewed';
        auditDetails = { taskId, taskName: task.name };
        break;

      case 'approve':
        if (task.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Task is not in pending status'
          }, { status: 400 });
        }

        // Update task status
        task.status = 'approved';
        taskStore.set(taskId, task);

        // Log approval
        auditAction = 'ai_task_approved';
        auditDetails = {
          taskId,
          taskName: task.name,
          taskType: task.type,
          riskLevel: task.riskLevel,
          approvedBy: session.user.id
        };

        // Stream approval notification
        await aiStreamingService.streamTaskApproval(session.user.organizationId, {
          taskId,
          taskName: task.name,
          status: 'approved',
          approvedBy: session.user.email || session.user.id,
          timestamp: new Date()
        });

        result = { approved: true, task };
        break;

      case 'reject':
        if (task.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Task is not in pending status'
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({
            success: false,
            error: 'Rejection reason is required'
          }, { status: 400 });
        }

        // Update task status
        task.status = 'rejected';
        taskStore.set(taskId, task);

        // Log rejection
        auditAction = 'ai_task_rejected';
        auditDetails = {
          taskId,
          taskName: task.name,
          taskType: task.type,
          riskLevel: task.riskLevel,
          rejectedBy: session.user.id,
          reason
        };

        // Stream rejection notification
        await aiStreamingService.streamTaskApproval(session.user.organizationId, {
          taskId,
          taskName: task.name,
          status: 'rejected',
          rejectedBy: session.user.email || session.user.id,
          reason,
          timestamp: new Date()
        });

        result = { rejected: true, reason, task };
        break;

      case 'modify':
        if (!modifications) {
          return NextResponse.json({
            success: false,
            error: 'Modifications are required'
          }, { status: 400 });
        }

        // Apply modifications
        const modifiedTask = { ...task, ...modifications };
        taskStore.set(taskId, modifiedTask);

        // Log modification
        auditAction = 'ai_task_modified';
        auditDetails = {
          taskId,
          taskName: task.name,
          modifications,
          modifiedBy: session.user.id
        };

        // Stream modification notification
        await aiStreamingService.streamTaskUpdate(session.user.organizationId, {
          taskId,
          taskName: task.name,
          modifications,
          modifiedBy: session.user.email || session.user.id,
          timestamp: new Date()
        });

        result = { modified: true, task: modifiedTask };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    // Log audit trail
    await aiAuditTrailSystem.logAction({
      userId: session.user.id,
      userRole: session.user.role as UserRole,
      action: auditAction,
      resource: `ai_task:${taskId}`,
      details: auditDetails,
      impact: task.riskLevel === 'high' || task.riskLevel === 'critical' ? 'high' : 'medium',
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task approval POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI task approval operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, updates } = body;

    if (!taskId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: taskId, updates'
      }, { status: 400 });
    }

    const task = taskStore.get(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Apply updates
    const updatedTask = { ...task, ...updates };
    taskStore.set(taskId, updatedTask);

    // Log update
    await aiAuditTrailSystem.logAction({
      userId: session.user.id,
      userRole: session.user.role as UserRole,
      action: 'ai_task_updated',
      resource: `ai_task:${taskId}`,
      details: {
        taskId,
        taskName: task.name,
        updates,
        updatedBy: session.user.id
      },
      impact: 'medium',
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task approval PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update AI task',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: taskId'
      }, { status: 400 });
    }

    const task = taskStore.get(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow deletion of pending or rejected tasks
    if (task.status === 'running' || task.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete running or completed tasks'
      }, { status: 400 });
    }

    // Delete task
    taskStore.delete(taskId);

    // Log deletion
    await aiAuditTrailSystem.logAction({
      userId: session.user.id,
      userRole: session.user.role as UserRole,
      action: 'ai_task_deleted',
      resource: `ai_task:${taskId}`,
      details: {
        taskId,
        taskName: task.name,
        deletedBy: session.user.id
      },
      impact: 'medium',
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task approval DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to delete AI task',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}