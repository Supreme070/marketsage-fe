import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiTaskMonitoringDashboard } from '@/lib/ai/ai-task-monitoring-dashboard';
import { UserRole } from '@prisma/client';

/**
 * AI Task Monitoring API
 * 
 * Provides real-time monitoring data for AI tasks and system health
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const timeRange = searchParams.get('timeRange') || '1h';
    const taskId = searchParams.get('taskId');
    const format = searchParams.get('format') || 'json';

    if (taskId) {
      // Get specific task details
      const taskDetails = aiTaskMonitoringDashboard.getTaskDetails(taskId);
      if (!taskDetails) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: taskDetails,
        timestamp: new Date().toISOString()
      });
    }

    if (format === 'export') {
      // Export monitoring data
      const exportFormat = searchParams.get('exportFormat') || 'json';
      const exportData = aiTaskMonitoringDashboard.exportMonitoringData(organizationId, exportFormat as 'json' | 'csv');
      
      return new Response(exportData, {
        headers: {
          'Content-Type': exportFormat === 'csv' ? 'text/csv' : 'application/json',
          'Content-Disposition': `attachment; filename=monitoring-data.${exportFormat}`
        }
      });
    }

    // Get dashboard data
    const dashboardData = aiTaskMonitoringDashboard.getDashboardData(organizationId, {
      timeRange: timeRange as any,
      taskTypes: [],
      statuses: [],
      priorities: []
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task monitoring GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve monitoring data',
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
    const { action, taskData, alertRule, widgets } = body;

    logger.info('AI task monitoring action', {
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    switch (action) {
      case 'register_task':
        if (!taskData) {
          return NextResponse.json({
            success: false,
            error: 'Task data is required'
          }, { status: 400 });
        }

        aiTaskMonitoringDashboard.registerTask({
          ...taskData,
          organizationId: session.user.organizationId,
          userId: session.user.id
        });

        return NextResponse.json({
          success: true,
          message: 'Task registered for monitoring',
          timestamp: new Date().toISOString()
        });

      case 'update_task':
        if (!taskData.taskId) {
          return NextResponse.json({
            success: false,
            error: 'Task ID is required'
          }, { status: 400 });
        }

        aiTaskMonitoringDashboard.updateTaskMetrics(taskData.taskId, taskData);

        return NextResponse.json({
          success: true,
          message: 'Task metrics updated',
          timestamp: new Date().toISOString()
        });

      case 'complete_task':
        if (!taskData.taskId || !taskData.result) {
          return NextResponse.json({
            success: false,
            error: 'Task ID and result are required'
          }, { status: 400 });
        }

        aiTaskMonitoringDashboard.completeTask(
          taskData.taskId,
          taskData.result,
          taskData.error
        );

        return NextResponse.json({
          success: true,
          message: 'Task completed',
          timestamp: new Date().toISOString()
        });

      case 'add_alert_rule':
        if (!alertRule) {
          return NextResponse.json({
            success: false,
            error: 'Alert rule is required'
          }, { status: 400 });
        }

        aiTaskMonitoringDashboard.addAlertRule({
          ...alertRule,
          organizationId: session.user.organizationId,
          id: alertRule.id || `alert-${Date.now()}`
        });

        return NextResponse.json({
          success: true,
          message: 'Alert rule added',
          timestamp: new Date().toISOString()
        });

      case 'save_dashboard_widgets':
        if (!widgets) {
          return NextResponse.json({
            success: false,
            error: 'Widgets configuration is required'
          }, { status: 400 });
        }

        aiTaskMonitoringDashboard.saveDashboardWidgets(
          session.user.organizationId,
          widgets
        );

        return NextResponse.json({
          success: true,
          message: 'Dashboard widgets saved',
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
    
    logger.error('AI task monitoring POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI task monitoring operation failed',
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
    const alertRuleId = searchParams.get('alertRuleId');

    if (!alertRuleId) {
      return NextResponse.json({
        success: false,
        error: 'Alert rule ID is required'
      }, { status: 400 });
    }

    aiTaskMonitoringDashboard.removeAlertRule(alertRuleId);

    return NextResponse.json({
      success: true,
      message: 'Alert rule removed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI task monitoring DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to remove alert rule',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}