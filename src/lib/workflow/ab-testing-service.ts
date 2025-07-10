/**
 * Workflow A/B Testing Service
 * 
 * Provides A/B testing capabilities for workflow automation optimization.
 * Integrates with existing A/B testing infrastructure without modifying core workflow execution.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Workflow A/B Testing Types
export interface WorkflowABTest {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  testType: 'SIMPLE_AB' | 'MULTIVARIATE';
  winnerMetric: 'COMPLETION_RATE' | 'CONVERSION_RATE' | 'EXECUTION_TIME' | 'ERROR_RATE';
  winnerThreshold: number; // 0-1 confidence level
  distributionPercent: number; // 0-1 percentage of audience
  variants: WorkflowABTestVariant[];
  startedAt?: Date;
  endedAt?: Date;
  winnerVariantId?: string;
}

export interface WorkflowABTestVariant {
  id: string;
  name: string;
  description?: string;
  workflowDefinition: any; // Modified workflow definition JSON
  trafficPercent: number; // 0-1 percentage of test traffic
  metrics?: {
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    avgExecutionTime: number;
    conversionEvents: number;
  };
}

export interface WorkflowABTestAssignment {
  contactId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
}

export interface WorkflowABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  recordedAt: Date;
}

export class WorkflowABTestingService {
  /**
   * Check if a workflow has active A/B tests and assign a variant
   */
  async assignWorkflowVariant(
    workflowId: string, 
    contactId: string
  ): Promise<{ variantId: string; workflowDefinition: any } | null> {
    try {
      // Check for active A/B tests on this workflow
      const activeTest = await prisma.aBTest.findFirst({
        where: {
          entityType: 'WORKFLOW',
          entityId: workflowId,
          status: 'RUNNING',
        },
        include: {
          variants: true,
        },
      });

      if (!activeTest) {
        return null; // No active test, use original workflow
      }

      // Check if contact already has an assignment
      const existingAssignment = await this.getContactAssignment(contactId, activeTest.id);
      if (existingAssignment) {
        const variant = activeTest.variants.find(v => v.id === existingAssignment.variantId);
        if (variant) {
          return {
            variantId: variant.id,
            workflowDefinition: JSON.parse(variant.content),
          };
        }
      }

      // Assign new variant based on traffic distribution
      const assignedVariant = this.selectVariantForContact(contactId, activeTest.variants);
      if (!assignedVariant) {
        return null;
      }

      // Store assignment
      await this.storeAssignment(contactId, activeTest.id, assignedVariant.id);

      logger.info('Assigned workflow A/B test variant', {
        workflowId,
        contactId,
        testId: activeTest.id,
        variantId: assignedVariant.id,
      });

      return {
        variantId: assignedVariant.id,
        workflowDefinition: JSON.parse(assignedVariant.content),
      };
    } catch (error) {
      logger.error('Failed to assign workflow variant', { error, workflowId, contactId });
      return null; // Fallback to original workflow on error
    }
  }

  /**
   * Record A/B test results for workflow execution
   */
  async recordWorkflowTestResult(
    workflowId: string,
    contactId: string,
    metric: 'COMPLETION_RATE' | 'EXECUTION_TIME' | 'ERROR_RATE' | 'CONVERSION_RATE',
    value: number
  ): Promise<void> {
    try {
      const activeTest = await prisma.aBTest.findFirst({
        where: {
          entityType: 'WORKFLOW',
          entityId: workflowId,
          status: 'RUNNING',
        },
      });

      if (!activeTest) {
        return; // No active test
      }

      const assignment = await this.getContactAssignment(contactId, activeTest.id);
      if (!assignment) {
        return; // Contact not in test
      }

      // Record the result
      await prisma.aBTestResult.upsert({
        where: {
          testId_variantId_metric: {
            testId: activeTest.id,
            variantId: assignment.variantId,
            metric: metric as any,
          },
        },
        update: {
          value: value,
          sampleSize: { increment: 1 },
        },
        create: {
          testId: activeTest.id,
          variantId: assignment.variantId,
          metric: metric as any,
          value: value,
          sampleSize: 1,
        },
      });

      logger.info('Recorded workflow A/B test result', {
        testId: activeTest.id,
        variantId: assignment.variantId,
        metric,
        value,
      });
    } catch (error) {
      logger.error('Failed to record workflow test result', { error, workflowId, contactId, metric, value });
    }
  }

  /**
   * Create a new workflow A/B test
   */
  async createWorkflowABTest(data: {
    name: string;
    description?: string;
    workflowId: string;
    testType: 'SIMPLE_AB' | 'MULTIVARIATE';
    winnerMetric: 'COMPLETION_RATE' | 'CONVERSION_RATE' | 'EXECUTION_TIME' | 'ERROR_RATE';
    winnerThreshold: number;
    distributionPercent: number;
    variants: Array<{
      name: string;
      description?: string;
      workflowDefinition: any;
      trafficPercent: number;
    }>;
    createdById: string;
  }): Promise<string> {
    try {
      // Validate traffic percentages
      const totalTraffic = data.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
      if (Math.abs(totalTraffic - 1.0) > 0.01) {
        throw new Error('Variant traffic percentages must sum to 100%');
      }

      // Check for existing active test
      const existingTest = await prisma.aBTest.findFirst({
        where: {
          entityType: 'WORKFLOW',
          entityId: data.workflowId,
          status: { in: ['RUNNING', 'PAUSED'] },
        },
      });

      if (existingTest) {
        throw new Error('Workflow already has an active A/B test');
      }

      // Create the test
      const test = await prisma.aBTest.create({
        data: {
          name: data.name,
          description: data.description,
          entityType: 'WORKFLOW',
          entityId: data.workflowId,
          testType: data.testType,
          testElements: JSON.stringify(['workflowDefinition']),
          winnerMetric: data.winnerMetric,
          winnerThreshold: data.winnerThreshold,
          distributionPercent: data.distributionPercent,
          createdById: data.createdById,
          variants: {
            create: data.variants.map(variant => ({
              name: variant.name,
              description: variant.description,
              content: JSON.stringify(variant.workflowDefinition),
              trafficPercent: variant.trafficPercent,
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      logger.info('Created workflow A/B test', {
        testId: test.id,
        workflowId: data.workflowId,
        variantCount: data.variants.length,
      });

      return test.id;
    } catch (error) {
      logger.error('Failed to create workflow A/B test', { error, workflowId: data.workflowId });
      throw error;
    }
  }

  /**
   * Start a workflow A/B test
   */
  async startWorkflowABTest(testId: string): Promise<void> {
    try {
      await prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      logger.info('Started workflow A/B test', { testId });
    } catch (error) {
      logger.error('Failed to start workflow A/B test', { error, testId });
      throw error;
    }
  }

  /**
   * Stop a workflow A/B test
   */
  async stopWorkflowABTest(testId: string): Promise<void> {
    try {
      await prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      logger.info('Stopped workflow A/B test', { testId });
    } catch (error) {
      logger.error('Failed to stop workflow A/B test', { error, testId });
      throw error;
    }
  }

  /**
   * Analyze A/B test results and determine winner
   */
  async analyzeWorkflowABTest(testId: string): Promise<{
    hasWinner: boolean;
    winnerVariantId?: string;
    confidence: number;
    results: Array<{
      variantId: string;
      variantName: string;
      sampleSize: number;
      metricValue: number;
      improvementPercent: number;
    }>;
  }> {
    try {
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          results: {
            where: { metric: test?.winnerMetric },
          },
        },
      });

      if (!test) {
        throw new Error('A/B test not found');
      }

      // Calculate results for each variant
      const variantResults = test.variants.map(variant => {
        const result = test.results.find(r => r.variantId === variant.id);
        return {
          variantId: variant.id,
          variantName: variant.name,
          sampleSize: result?.sampleSize || 0,
          metricValue: result?.value || 0,
          improvementPercent: 0, // Will be calculated below
        };
      });

      // Sort by metric value (higher is better for most metrics)
      const isLowerBetter = test.winnerMetric === 'EXECUTION_TIME' || test.winnerMetric === 'ERROR_RATE';
      variantResults.sort((a, b) => isLowerBetter ? a.metricValue - b.metricValue : b.metricValue - a.metricValue);

      // Calculate improvement percentages
      const baseline = variantResults[variantResults.length - 1]; // Worst performing variant
      variantResults.forEach(result => {
        if (baseline.metricValue > 0) {
          result.improvementPercent = isLowerBetter
            ? ((baseline.metricValue - result.metricValue) / baseline.metricValue) * 100
            : ((result.metricValue - baseline.metricValue) / baseline.metricValue) * 100;
        }
      });

      // Determine statistical significance (simplified)
      const winner = variantResults[0];
      const hasMinimumSampleSize = winner.sampleSize >= 30; // Minimum for basic significance
      const hasMinimumImprovement = Math.abs(winner.improvementPercent) >= 5; // 5% minimum improvement
      const confidence = hasMinimumSampleSize && hasMinimumImprovement ? 0.95 : 0.0;

      // Update test with winner if confidence threshold is met
      if (confidence >= test.winnerThreshold && !test.winnerVariantId) {
        await prisma.aBTest.update({
          where: { id: testId },
          data: {
            winnerVariantId: winner.variantId,
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        });

        logger.info('Workflow A/B test winner determined', {
          testId,
          winnerVariantId: winner.variantId,
          confidence,
          improvement: winner.improvementPercent,
        });
      }

      return {
        hasWinner: confidence >= test.winnerThreshold,
        winnerVariantId: confidence >= test.winnerThreshold ? winner.variantId : undefined,
        confidence,
        results: variantResults,
      };
    } catch (error) {
      logger.error('Failed to analyze workflow A/B test', { error, testId });
      throw error;
    }
  }

  /**
   * Get A/B test results for a workflow
   */
  async getWorkflowABTestResults(workflowId: string): Promise<WorkflowABTest[]> {
    try {
      const tests = await prisma.aBTest.findMany({
        where: {
          entityType: 'WORKFLOW',
          entityId: workflowId,
        },
        include: {
          variants: {
            include: {
              results: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return tests.map(test => ({
        id: test.id,
        name: test.name,
        description: test.description,
        workflowId: test.entityId,
        status: test.status as any,
        testType: test.testType as any,
        winnerMetric: test.winnerMetric as any,
        winnerThreshold: test.winnerThreshold || 0.95,
        distributionPercent: test.distributionPercent,
        startedAt: test.startedAt || undefined,
        endedAt: test.endedAt || undefined,
        winnerVariantId: test.winnerVariantId || undefined,
        variants: test.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          description: variant.description,
          workflowDefinition: JSON.parse(variant.content),
          trafficPercent: variant.trafficPercent,
          metrics: this.calculateVariantMetrics(variant.results),
        })),
      }));
    } catch (error) {
      logger.error('Failed to get workflow A/B test results', { error, workflowId });
      return [];
    }
  }

  // Private helper methods

  private async getContactAssignment(contactId: string, testId: string): Promise<{ variantId: string } | null> {
    // For simplicity, we'll derive assignment from contact ID and test ID
    // In production, you might want to store assignments in a dedicated table
    const assignmentKey = `${contactId}-${testId}`;
    
    try {
      // Check if there's a stored assignment (you could implement this with Redis or a database table)
      // For now, we'll use a deterministic hash-based assignment
      const variants = await prisma.aBTestVariant.findMany({
        where: { testId },
        orderBy: { trafficPercent: 'desc' },
      });

      if (variants.length === 0) return null;

      // Use a simple hash to ensure consistent assignment
      const hash = this.simpleHash(assignmentKey);
      const normalizedHash = hash % 100; // 0-99

      let cumulativePercent = 0;
      for (const variant of variants) {
        cumulativePercent += variant.trafficPercent * 100;
        if (normalizedHash < cumulativePercent) {
          return { variantId: variant.id };
        }
      }

      // Fallback to first variant
      return { variantId: variants[0].id };
    } catch (error) {
      logger.error('Failed to get contact assignment', { error, contactId, testId });
      return null;
    }
  }

  private selectVariantForContact(contactId: string, variants: any[]): any | null {
    if (variants.length === 0) return null;

    // Use contact ID to ensure consistent assignment
    const hash = this.simpleHash(contactId);
    const normalizedHash = (hash % 100) / 100; // 0-1

    let cumulativePercent = 0;
    for (const variant of variants) {
      cumulativePercent += variant.trafficPercent;
      if (normalizedHash < cumulativePercent) {
        return variant;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1];
  }

  private async storeAssignment(contactId: string, testId: string, variantId: string): Promise<void> {
    // In a full implementation, you'd store this in a database table or Redis
    // For now, we'll just log it as assignments are derived deterministically
    logger.info('Storing A/B test assignment', { contactId, testId, variantId });
  }

  private calculateVariantMetrics(results: any[]): any {
    if (results.length === 0) {
      return {
        totalExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
        avgExecutionTime: 0,
        conversionEvents: 0,
      };
    }

    // Aggregate metrics from results
    const completionRate = results.find(r => r.metric === 'COMPLETION_RATE');
    const executionTime = results.find(r => r.metric === 'EXECUTION_TIME');
    const errorRate = results.find(r => r.metric === 'ERROR_RATE');
    const conversionRate = results.find(r => r.metric === 'CONVERSION_RATE');

    const totalExecutions = completionRate?.sampleSize || 0;
    const completedExecutions = Math.round(totalExecutions * (completionRate?.value || 0));
    const failedExecutions = Math.round(totalExecutions * (errorRate?.value || 0));

    return {
      totalExecutions,
      completedExecutions,
      failedExecutions,
      avgExecutionTime: executionTime?.value || 0,
      conversionEvents: Math.round(totalExecutions * (conversionRate?.value || 0)),
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const workflowABTestingService = new WorkflowABTestingService();