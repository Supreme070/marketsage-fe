import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { WorkflowAnalyticsService } from '../services/workflow-analytics.service';

@ApiTags('Workflow Analytics')
@Controller('workflows/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowAnalyticsController {
  constructor(
    private readonly analyticsService: WorkflowAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get workflow analytics overview' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for analytics (7d, 30d, 90d)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalWorkflows: { type: 'number' },
        activeWorkflows: { type: 'number' },
        totalExecutions: { type: 'number' },
        successfulExecutions: { type: 'number' },
        failedExecutions: { type: 'number' },
        avgExecutionTime: { type: 'number' },
        successRate: { type: 'number' },
        failureRate: { type: 'number' },
      },
    },
  })
  async getOverview(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req: any,
  ) {
    return this.analyticsService.getWorkflowAnalytics(
      req.user.organizationId,
      timeRange,
    );
  }

  @Get('performance/:workflowId')
  @ApiOperation({ summary: 'Get workflow performance metrics' })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        workflowName: { type: 'string' },
        totalExecutions: { type: 'number' },
        successfulExecutions: { type: 'number' },
        failedExecutions: { type: 'number' },
        avgExecutionTime: { type: 'number' },
        successRate: { type: 'number' },
        conversionFunnel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepName: { type: 'string' },
              completionRate: { type: 'number' },
              avgExecutionTime: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getWorkflowPerformance(
    @Param('workflowId') workflowId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getWorkflowPerformanceMetrics(
      workflowId,
      req.user.organizationId,
    );
  }

  @Get('triggers')
  @ApiOperation({ summary: 'Get trigger analytics' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trigger analytics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          triggerType: { type: 'string' },
          totalTriggers: { type: 'number' },
          successfulTriggers: { type: 'number' },
          failedTriggers: { type: 'number' },
          avgResponseTime: { type: 'number' },
          mostActiveHour: { type: 'number' },
          mostActiveDay: { type: 'string' },
        },
      },
    },
  })
  async getTriggerAnalytics(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req: any,
  ) {
    return this.analyticsService.getTriggerAnalytics(
      req.user.organizationId,
      timeRange,
    );
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Get contact engagement metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalContacts: { type: 'number' },
        activeContacts: { type: 'number' },
        engagedContacts: { type: 'number' },
        avgWorkflowsPerContact: { type: 'number' },
        topEngagementTags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              engagementRate: { type: 'number' },
            },
          },
        },
        segmentPerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              totalContacts: { type: 'number' },
              engagementRate: { type: 'number' },
              avgWorkflowCompletion: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getEngagementMetrics(@Request() req: any) {
    return this.analyticsService.getContactEngagementMetrics(
      req.user.organizationId,
    );
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time workflow metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        activeExecutions: { type: 'number' },
        queuedExecutions: { type: 'number' },
        executionsLastHour: { type: 'number' },
        errorRateLastHour: { type: 'number' },
        avgExecutionTimeLast24h: { type: 'number' },
        systemLoad: {
          type: 'object',
          properties: {
            cpu: { type: 'number' },
            memory: { type: 'number' },
            queueSize: { type: 'number' },
          },
        },
      },
    },
  })
  async getRealtimeMetrics(@Request() req: any) {
    return this.analyticsService.getRealtimeMetrics(req.user.organizationId);
  }

  @Get('split-tests')
  @ApiOperation({ summary: 'Get split test analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split test analytics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testId: { type: 'string' },
          testName: { type: 'string' },
          status: { type: 'string', enum: ['RUNNING', 'COMPLETED', 'PAUSED'] },
          totalParticipants: { type: 'number' },
          statisticalSignificance: { type: 'number' },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                participants: { type: 'number' },
                conversionRate: { type: 'number' },
                confidence: { type: 'number' },
                isWinner: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  async getSplitTestAnalytics(@Request() req: any) {
    return this.analyticsService.getSplitTestAnalytics(req.user.organizationId);
  }

  @Get('heatmap/:workflowId')
  @ApiOperation({ summary: 'Get workflow heatmap data' })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Heatmap data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          nodeName: { type: 'string' },
          nodeType: { type: 'string' },
          executionCount: { type: 'number' },
          successRate: { type: 'number' },
          avgExecutionTime: { type: 'number' },
          errorRate: { type: 'number' },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getWorkflowHeatmap(
    @Param('workflowId') workflowId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getWorkflowHeatmap(
      workflowId,
      req.user.organizationId,
    );
  }

  @Post('events/execution')
  @ApiOperation({ summary: 'Record workflow execution event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event recorded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async recordExecutionEvent(
    @Body()
    eventData: {
      workflowId: string;
      executionId: string;
      nodeId: string;
      eventType: 'started' | 'completed' | 'failed';
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    await this.analyticsService.recordExecutionEvent(
      eventData.workflowId,
      eventData.executionId,
      eventData.nodeId,
      eventData.eventType,
      req.user.organizationId,
      eventData.metadata,
    );

    return {
      success: true,
      message: 'Event recorded successfully',
    };
  }

  @Post('events/trigger')
  @ApiOperation({ summary: 'Record workflow trigger event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trigger event recorded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async recordTriggerEvent(
    @Body()
    eventData: {
      triggerType: string;
      success: boolean;
      responseTime: number;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    await this.analyticsService.recordTriggerEvent(
      eventData.triggerType,
      req.user.organizationId,
      eventData.success,
      eventData.responseTime,
      eventData.metadata,
    );

    return {
      success: true,
      message: 'Trigger event recorded successfully',
    };
  }

  @Get('reports/comprehensive')
  @ApiOperation({ summary: 'Generate comprehensive analytics report' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comprehensive report generated successfully',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'object' },
        triggers: { type: 'array' },
        engagement: { type: 'object' },
        splitTests: { type: 'array' },
        generatedAt: { type: 'string' },
      },
    },
  })
  async generateComprehensiveReport(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req: any,
  ) {
    return this.analyticsService.generateAnalyticsReport(
      req.user.organizationId,
      timeRange,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'], description: 'Export format' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for export' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics data exported successfully',
  })
  async exportAnalytics(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('timeRange') timeRange: string = '30d',
    @Request() req: any,
  ) {
    const report = await this.analyticsService.generateAnalyticsReport(
      req.user.organizationId,
      timeRange,
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = this.convertToCSV(report);
      return {
        format: 'csv',
        data: csvData,
        filename: `workflow-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }

    return {
      format: 'json',
      data: report,
      filename: `workflow-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`,
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get workflow analytics dashboard data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: { type: 'object' },
        recentActivity: { type: 'array' },
        topPerformingWorkflows: { type: 'array' },
        alertsAndNotifications: { type: 'array' },
        quickStats: { type: 'object' },
      },
    },
  })
  async getDashboardData(@Request() req: any) {
    const [overview, realtime, splitTests] = await Promise.all([
      this.analyticsService.getWorkflowAnalytics(req.user.organizationId),
      this.analyticsService.getRealtimeMetrics(req.user.organizationId),
      this.analyticsService.getSplitTestAnalytics(req.user.organizationId),
    ]);

    return {
      overview,
      recentActivity: [
        {
          type: 'execution',
          message: 'Welcome Series workflow completed successfully',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'success',
        },
        {
          type: 'trigger',
          message: 'Cart Abandonment trigger activated',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          status: 'info',
        },
        {
          type: 'error',
          message: 'Email delivery failed for Contact #1234',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          status: 'error',
        },
      ],
      topPerformingWorkflows: [
        {
          id: 'workflow_1',
          name: 'Welcome Email Series',
          successRate: 96.8,
          totalExecutions: 2847,
          avgExecutionTime: 18500,
        },
        {
          id: 'workflow_2',
          name: 'Cart Abandonment Recovery',
          successRate: 94.2,
          totalExecutions: 1925,
          avgExecutionTime: 22100,
        },
        {
          id: 'workflow_3',
          name: 'Post-Purchase Follow-up',
          successRate: 91.5,
          totalExecutions: 1456,
          avgExecutionTime: 15200,
        },
      ],
      alertsAndNotifications: [
        {
          type: 'warning',
          title: 'High failure rate detected',
          message: 'Workflow "Email Newsletter" has a 15% failure rate in the last 24 hours',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          type: 'info',
          title: 'Split test winner identified',
          message: 'Variant B in "Subject Line Test" shows 22% better performance',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      quickStats: {
        activeExecutions: realtime.activeExecutions,
        queuedExecutions: realtime.queuedExecutions,
        runningSplitTests: splitTests.filter(t => t.status === 'RUNNING').length,
        systemHealth: realtime.systemLoad.cpu < 80 ? 'healthy' : 'warning',
      },
    };
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const headers = ['Metric', 'Value', 'Category'];
    const rows = [
      headers.join(','),
      `Total Workflows,${data.summary.totalWorkflows},Overview`,
      `Active Workflows,${data.summary.activeWorkflows},Overview`,
      `Total Executions,${data.summary.totalExecutions},Overview`,
      `Success Rate,${data.summary.successRate}%,Overview`,
      `Avg Execution Time,${data.summary.avgExecutionTime}ms,Performance`,
    ];

    // Add trigger data
    data.triggers.forEach((trigger: any) => {
      rows.push(`${trigger.triggerType} Success Rate,${(trigger.successfulTriggers / trigger.totalTriggers * 100).toFixed(1)}%,Triggers`);
    });

    return rows.join('\n');
  }
}