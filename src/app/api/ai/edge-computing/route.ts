import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { edgeComputingSystem } from '@/lib/ai/edge-computing-system';
import { UserRole } from '@prisma/client';

/**
 * Edge Computing API
 * 
 * Manages distributed edge computing infrastructure for African markets
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action');
    const nodeId = searchParams.get('nodeId');
    const clusterId = searchParams.get('clusterId');
    const taskId = searchParams.get('taskId');

    switch (action) {
      case 'nodes':
        const nodes = edgeComputingSystem.getEdgeNodes();
        return NextResponse.json({
          success: true,
          data: nodes,
          timestamp: new Date().toISOString()
        });

      case 'clusters':
        const clusters = edgeComputingSystem.getEdgeClusters();
        return NextResponse.json({
          success: true,
          data: clusters,
          timestamp: new Date().toISOString()
        });

      case 'tasks':
        const tasks = edgeComputingSystem.getEdgeTasks();
        return NextResponse.json({
          success: true,
          data: tasks,
          timestamp: new Date().toISOString()
        });

      case 'node_detail':
        if (!nodeId) {
          return NextResponse.json({
            success: false,
            error: 'Node ID is required'
          }, { status: 400 });
        }

        const node = edgeComputingSystem.getEdgeNodes().find(n => n.id === nodeId);
        if (!node) {
          return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: node,
          timestamp: new Date().toISOString()
        });

      case 'cluster_detail':
        if (!clusterId) {
          return NextResponse.json({
            success: false,
            error: 'Cluster ID is required'
          }, { status: 400 });
        }

        const cluster = edgeComputingSystem.getEdgeClusters().find(c => c.id === clusterId);
        if (!cluster) {
          return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: cluster,
          timestamp: new Date().toISOString()
        });

      case 'task_detail':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: 'Task ID is required'
          }, { status: 400 });
        }

        const task = edgeComputingSystem.getEdgeTasks().find(t => t.id === taskId);
        if (!task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: task,
          timestamp: new Date().toISOString()
        });

      case 'statistics':
        const statistics = edgeComputingSystem.getSystemStatistics();
        return NextResponse.json({
          success: true,
          data: statistics,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const dashboardData = {
          nodes: edgeComputingSystem.getEdgeNodes(),
          clusters: edgeComputingSystem.getEdgeClusters(),
          tasks: edgeComputingSystem.getEdgeTasks(),
          statistics: edgeComputingSystem.getSystemStatistics()
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Edge computing GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve edge computing data',
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
    const { action, taskData } = body;

    logger.info('Edge computing action', {
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    switch (action) {
      case 'submit_task':
        if (!taskData) {
          return NextResponse.json({
            success: false,
            error: 'Task data is required'
          }, { status: 400 });
        }

        const newTask = await edgeComputingSystem.submitTask(
          taskData,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: newTask,
          message: 'Task submitted successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Edge computing POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Edge computing operation failed',
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

    // Only admins can update edge computing settings
    if (![UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, nodeId, clusterId, updates } = body;

    switch (action) {
      case 'update_node':
        if (!nodeId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Node ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the node
        return NextResponse.json({
          success: true,
          message: 'Node updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'update_cluster':
        if (!clusterId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Cluster ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the cluster
        return NextResponse.json({
          success: true,
          message: 'Cluster updated successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Edge computing PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Edge computing update failed',
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

    // Only admins can delete edge computing resources
    if (![UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const clusterId = searchParams.get('clusterId');
    const taskId = searchParams.get('taskId');

    if (nodeId) {
      // In a real implementation, this would delete the node
      return NextResponse.json({
        success: true,
        message: 'Node deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (clusterId) {
      // In a real implementation, this would delete the cluster
      return NextResponse.json({
        success: true,
        message: 'Cluster deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (taskId) {
      // In a real implementation, this would delete the task
      return NextResponse.json({
        success: true,
        message: 'Task deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Node ID, Cluster ID, or Task ID is required'
    }, { status: 400 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Edge computing DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Edge computing deletion failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}