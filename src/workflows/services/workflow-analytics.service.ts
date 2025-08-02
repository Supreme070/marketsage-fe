import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { ExecutionStatus } from '../dto';

export interface WorkflowAnalyticsMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  avgExecutionTime: number;
  executionRate: number;
  successRate: number;
  failureRate: number;
}

export interface WorkflowPerformanceMetrics {
  workflowId: string;
  workflowName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  avgExecutionTime: number;
  successRate: number;
  lastExecuted: string;
  mostCommonFailureStep?: string;
  mostCommonFailureReason?: string;
  conversionFunnel: {
    stepName: string;
    completionRate: number;
    avgExecutionTime: number;
  }[];
}

export interface TriggerAnalytics {
  triggerType: string;
  totalTriggers: number;
  successfulTriggers: number;
  failedTriggers: number;
  avgResponseTime: number;
  mostActiveHour: number;
  mostActiveDay: string;
  triggerVolumeTrend: {
    date: string;
    count: number;
  }[];
}

export interface ContactEngagementMetrics {
  totalContacts: number;
  activeContacts: number;
  engagedContacts: number;
  avgWorkflowsPerContact: number;
  topEngagementTags: {
    tag: string;
    engagementRate: number;
  }[];
  segmentPerformance: {
    segment: string;
    totalContacts: number;
    engagementRate: number;
    avgWorkflowCompletion: number;
  }[];
}

export interface RealtimeMetrics {
  activeExecutions: number;
  queuedExecutions: number;
  executionsLastHour: number;
  errorRateLastHour: number;
  avgExecutionTimeLast24h: number;
  systemLoad: {
    cpu: number;
    memory: number;
    queueSize: number;
  };
}

export interface SplitTestAnalytics {
  testId: string;
  testName: string;
  status: 'RUNNING' | 'COMPLETED' | 'PAUSED';
  variants: {
    name: string;
    participants: number;
    conversionRate: number;
    confidence: number;
    isWinner?: boolean;
  }[];
  totalParticipants: number;
  startDate: string;
  endDate?: string;
  statisticalSignificance: number;
}

export interface WorkflowHeatmapData {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  errorRate: number;
  position: { x: number; y: number };
}

@Injectable()
export class WorkflowAnalyticsService {
  private readonly logger = new Logger(WorkflowAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getWorkflowAnalytics(organizationId: string, timeRange: string = '30d'): Promise<WorkflowAnalyticsMetrics> {
    try {
      const cacheKey = `workflow_analytics:${organizationId}:${timeRange}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock analytics data - in a real implementation, this would aggregate from database
      const analytics: WorkflowAnalyticsMetrics = {
        totalWorkflows: 47,
        activeWorkflows: 32,
        totalExecutions: 15847,
        successfulExecutions: 14203,
        failedExecutions: 1344,
        cancelledExecutions: 300,
        avgExecutionTime: 23000, // milliseconds
        executionRate: 892.5, // executions per day
        successRate: 89.6,
        failureRate: 8.5,
      };

      // Cache for 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(analytics), 300);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get workflow analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getWorkflowPerformanceMetrics(workflowId: string, organizationId: string): Promise<WorkflowPerformanceMetrics> {
    try {
      const cacheKey = `workflow_performance:${workflowId}:${organizationId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock performance data
      const performance: WorkflowPerformanceMetrics = {
        workflowId,
        workflowName: 'Welcome Email Series',
        totalExecutions: 2847,
        successfulExecutions: 2654,
        failedExecutions: 158,
        cancelledExecutions: 35,
        avgExecutionTime: 18500,
        successRate: 93.2,
        lastExecuted: new Date(Date.now() - 3600000).toISOString(),
        mostCommonFailureStep: 'Send Email',
        mostCommonFailureReason: 'Email template not found',
        conversionFunnel: [
          {
            stepName: 'Trigger: New Contact',
            completionRate: 100,
            avgExecutionTime: 500,
          },
          {
            stepName: 'Send Welcome Email',
            completionRate: 96.8,
            avgExecutionTime: 8500,
          },
          {
            stepName: 'Wait 24 Hours',
            completionRate: 94.2,
            avgExecutionTime: 86400000,
          },
          {
            stepName: 'Send Follow-up Email',
            completionRate: 91.5,
            avgExecutionTime: 9200,
          },
          {
            stepName: 'Add to Newsletter List',
            completionRate: 89.7,
            avgExecutionTime: 1200,
          },
        ],
      };

      // Cache for 10 minutes
      await this.redis.set(cacheKey, JSON.stringify(performance), 600);
      return performance;
    } catch (error) {
      this.logger.error(`Failed to get workflow performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getTriggerAnalytics(organizationId: string, timeRange: string = '30d'): Promise<TriggerAnalytics[]> {
    try {
      const cacheKey = `trigger_analytics:${organizationId}:${timeRange}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock trigger analytics
      const triggers: TriggerAnalytics[] = [
        {
          triggerType: 'CONTACT_CREATED',
          totalTriggers: 4589,
          successfulTriggers: 4412,
          failedTriggers: 177,
          avgResponseTime: 850,
          mostActiveHour: 14, // 2 PM
          mostActiveDay: 'Tuesday',
          triggerVolumeTrend: this.generateVolumeTrend(30),
        },
        {
          triggerType: 'EMAIL_OPENED',
          totalTriggers: 8932,
          successfulTriggers: 8845,
          failedTriggers: 87,
          avgResponseTime: 1200,
          mostActiveHour: 10, // 10 AM
          mostActiveDay: 'Wednesday',
          triggerVolumeTrend: this.generateVolumeTrend(30),
        },
        {
          triggerType: 'FORM_SUBMITTED',
          totalTriggers: 1247,
          successfulTriggers: 1198,
          failedTriggers: 49,
          avgResponseTime: 650,
          mostActiveHour: 11, // 11 AM
          mostActiveDay: 'Monday',
          triggerVolumeTrend: this.generateVolumeTrend(30),
        },
      ];

      // Cache for 15 minutes
      await this.redis.set(cacheKey, JSON.stringify(triggers), 900);
      return triggers;
    } catch (error) {
      this.logger.error(`Failed to get trigger analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getContactEngagementMetrics(organizationId: string): Promise<ContactEngagementMetrics> {
    try {
      const cacheKey = `contact_engagement:${organizationId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock engagement metrics
      const engagement: ContactEngagementMetrics = {
        totalContacts: 12847,
        activeContacts: 8492,
        engagedContacts: 6785,
        avgWorkflowsPerContact: 2.4,
        topEngagementTags: [
          { tag: 'premium', engagementRate: 94.2 },
          { tag: 'newsletter', engagementRate: 87.5 },
          { tag: 'customer', engagementRate: 82.1 },
          { tag: 'lead', engagementRate: 76.8 },
          { tag: 'trial', engagementRate: 71.3 },
        ],
        segmentPerformance: [
          {
            segment: 'High Value Customers',
            totalContacts: 1247,
            engagementRate: 91.2,
            avgWorkflowCompletion: 4.8,
          },
          {
            segment: 'Trial Users',
            totalContacts: 3842,
            engagementRate: 73.5,
            avgWorkflowCompletion: 2.1,
          },
          {
            segment: 'Newsletter Subscribers',
            totalContacts: 7589,
            engagementRate: 68.9,
            avgWorkflowCompletion: 1.8,
          },
        ],
      };

      // Cache for 30 minutes
      await this.redis.set(cacheKey, JSON.stringify(engagement), 1800);
      return engagement;
    } catch (error) {
      this.logger.error(`Failed to get contact engagement metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getRealtimeMetrics(organizationId: string): Promise<RealtimeMetrics> {
    try {
      // Don't cache realtime metrics as they should be fresh
      const metrics: RealtimeMetrics = {
        activeExecutions: 47,
        queuedExecutions: 123,
        executionsLastHour: 89,
        errorRateLastHour: 3.2,
        avgExecutionTimeLast24h: 19500,
        systemLoad: {
          cpu: 68.5,
          memory: 72.1,
          queueSize: 234,
        },
      };

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get realtime metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getSplitTestAnalytics(organizationId: string): Promise<SplitTestAnalytics[]> {
    try {
      const cacheKey = `split_test_analytics:${organizationId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock split test data
      const splitTests: SplitTestAnalytics[] = [
        {
          testId: 'test_1',
          testName: 'Welcome Email Subject Line Test',
          status: 'RUNNING',
          variants: [
            {
              name: 'Variant A: "Welcome to our platform!"',
              participants: 1247,
              conversionRate: 18.4,
              confidence: 95.2,
            },
            {
              name: 'Variant B: "Get started with your free account"',
              participants: 1198,
              conversionRate: 22.1,
              confidence: 97.8,
              isWinner: true,
            },
            {
              name: 'Variant C: "Your journey begins now"',
              participants: 1205,
              conversionRate: 16.9,
              confidence: 89.3,
            },
          ],
          totalParticipants: 3650,
          startDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
          statisticalSignificance: 97.8,
        },
        {
          testId: 'test_2',
          testName: 'Cart Abandonment Email Timing',
          status: 'COMPLETED',
          variants: [
            {
              name: '1 Hour Delay',
              participants: 847,
              conversionRate: 12.8,
              confidence: 92.1,
            },
            {
              name: '24 Hour Delay',
              participants: 892,
              conversionRate: 15.3,
              confidence: 96.4,
              isWinner: true,
            },
          ],
          totalParticipants: 1739,
          startDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          endDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
          statisticalSignificance: 96.4,
        },
      ];

      // Cache for 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(splitTests), 300);
      return splitTests;
    } catch (error) {
      this.logger.error(`Failed to get split test analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getWorkflowHeatmap(workflowId: string, organizationId: string): Promise<WorkflowHeatmapData[]> {
    try {
      const cacheKey = `workflow_heatmap:${workflowId}:${organizationId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock heatmap data
      const heatmap: WorkflowHeatmapData[] = [
        {
          nodeId: 'node_1',
          nodeName: 'New Contact Trigger',
          nodeType: 'TRIGGER',
          executionCount: 2847,
          successRate: 100,
          avgExecutionTime: 500,
          errorRate: 0,
          position: { x: 100, y: 100 },
        },
        {
          nodeId: 'node_2',
          nodeName: 'Send Welcome Email',
          nodeType: 'EMAIL',
          executionCount: 2847,
          successRate: 96.8,
          avgExecutionTime: 8500,
          errorRate: 3.2,
          position: { x: 300, y: 100 },
        },
        {
          nodeId: 'node_3',
          nodeName: 'Wait 24 Hours',
          nodeType: 'WAIT',
          executionCount: 2756,
          successRate: 100,
          avgExecutionTime: 86400000,
          errorRate: 0,
          position: { x: 500, y: 100 },
        },
        {
          nodeId: 'node_4',
          nodeName: 'Send Follow-up Email',
          nodeType: 'EMAIL',
          executionCount: 2756,
          successRate: 94.2,
          avgExecutionTime: 9200,
          errorRate: 5.8,
          position: { x: 700, y: 100 },
        },
        {
          nodeId: 'node_5',
          nodeName: 'Add to Newsletter List',
          nodeType: 'UPDATE_CONTACT',
          executionCount: 2598,
          successRate: 98.9,
          avgExecutionTime: 1200,
          errorRate: 1.1,
          position: { x: 900, y: 100 },
        },
      ];

      // Cache for 10 minutes
      await this.redis.set(cacheKey, JSON.stringify(heatmap), 600);
      return heatmap;
    } catch (error) {
      this.logger.error(`Failed to get workflow heatmap: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async recordExecutionEvent(
    workflowId: string,
    executionId: string,
    nodeId: string,
    eventType: 'started' | 'completed' | 'failed',
    organizationId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const event = {
        workflowId,
        executionId,
        nodeId,
        eventType,
        organizationId,
        timestamp: new Date().toISOString(),
        metadata: metadata || {},
      };

      // Store event for analytics processing
      await this.redis.lpush(
        `workflow_events:${organizationId}`,
        JSON.stringify(event),
      );

      // Keep only last 10000 events
      await this.redis.ltrim(`workflow_events:${organizationId}`, 0, 9999);

      // Update realtime counters
      const counterKey = `workflow_counters:${organizationId}:${new Date().toISOString().split('T')[0]}`;
      await this.redis.hincrby(counterKey, `${eventType}_count`, 1);
      await this.redis.expire(counterKey, 86400 * 7); // Keep for 7 days
    } catch (error) {
      this.logger.error(`Failed to record execution event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async recordTriggerEvent(
    triggerType: string,
    organizationId: string,
    success: boolean,
    responseTime: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const event = {
        triggerType,
        organizationId,
        success,
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: metadata || {},
      };

      // Store trigger event
      await this.redis.lpush(
        `trigger_events:${organizationId}`,
        JSON.stringify(event),
      );

      // Keep only last 5000 trigger events
      await this.redis.ltrim(`trigger_events:${organizationId}`, 0, 4999);

      // Update trigger counters
      const counterKey = `trigger_counters:${organizationId}:${new Date().toISOString().split('T')[0]}`;
      await this.redis.hincrby(counterKey, `${triggerType}_total`, 1);
      if (success) {
        await this.redis.hincrby(counterKey, `${triggerType}_success`, 1);
      } else {
        await this.redis.hincrby(counterKey, `${triggerType}_failed`, 1);
      }
      await this.redis.expire(counterKey, 86400 * 7); // Keep for 7 days
    } catch (error) {
      this.logger.error(`Failed to record trigger event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateAnalyticsReport(organizationId: string, timeRange: string = '30d'): Promise<{
    summary: WorkflowAnalyticsMetrics;
    triggers: TriggerAnalytics[];
    engagement: ContactEngagementMetrics;
    splitTests: SplitTestAnalytics[];
    generatedAt: string;
  }> {
    try {
      const [summary, triggers, engagement, splitTests] = await Promise.all([
        this.getWorkflowAnalytics(organizationId, timeRange),
        this.getTriggerAnalytics(organizationId, timeRange),
        this.getContactEngagementMetrics(organizationId),
        this.getSplitTestAnalytics(organizationId),
      ]);

      return {
        summary,
        triggers,
        engagement,
        splitTests,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate analytics report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Helper method to generate volume trend data
  private generateVolumeTrend(days: number): { date: string; count: number }[] {
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 3600000);
      trend.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 200) + 50, // Random count between 50-250
      });
    }
    return trend;
  }
}