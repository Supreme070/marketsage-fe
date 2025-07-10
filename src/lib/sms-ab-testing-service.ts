/**
 * SMS A/B Testing Service
 * 
 * Handles creation, management, and analysis of A/B tests for SMS campaigns
 * with statistical significance testing and comprehensive analytics.
 */

import prisma from '@/lib/db/prisma';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { logger } from '@/lib/logger';

interface ABTestConfig {
  name: string;
  description?: string;
  variants: ABTestVariant[];
  trafficSplit: number[]; // Array of percentages (must sum to 100)
  testDuration?: number; // Duration in hours
  significanceLevel?: number; // Default 0.05 (95% confidence)
  minimumSampleSize?: number; // Minimum sample size per variant
  userId: string;
  organizationId?: string;
}

interface ABTestVariant {
  name: string;
  description?: string;
  content: string;
  from?: string;
  templateId?: string;
}

interface ABTestResult {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'STOPPED';
  variants: {
    id: string;
    name: string;
    content: string;
    trafficPercentage: number;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
    conversionRate: number;
    deliveryRate: number;
    engagementRate: number;
  }[];
  winner?: {
    variantId: string;
    variantName: string;
    confidence: number;
    improvementPercentage: number;
    metric: string;
  };
  isStatisticallySignificant: boolean;
  totalSample: number;
  startedAt?: Date;
  completedAt?: Date;
}

export class SMSABTestingService {
  private readonly defaultSignificanceLevel = 0.05;
  private readonly defaultMinimumSampleSize = 100;

  /**
   * Create a new A/B test
   */
  async createABTest(config: ABTestConfig): Promise<{ success: boolean; testId?: string; error?: string }> {
    try {
      // Validate configuration
      const validationResult = this.validateABTestConfig(config);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.error };
      }

      // Create A/B test record
      const abTest = await prisma.sMSABTest.create({
        data: {
          name: config.name,
          description: config.description,
          status: 'DRAFT',
          trafficSplit: JSON.stringify(config.trafficSplit),
          testDuration: config.testDuration || 24, // Default 24 hours
          significanceLevel: config.significanceLevel || this.defaultSignificanceLevel,
          minimumSampleSize: config.minimumSampleSize || this.defaultMinimumSampleSize,
          createdById: config.userId,
          organizationId: config.organizationId,
          metadata: JSON.stringify({
            createdAt: new Date().toISOString(),
            createdBy: config.userId
          })
        }
      });

      // Create variants
      const variantPromises = config.variants.map((variant, index) => 
        prisma.sMSABTestVariant.create({
          data: {
            abTestId: abTest.id,
            name: variant.name,
            description: variant.description,
            content: variant.content,
            from: variant.from,
            templateId: variant.templateId,
            trafficPercentage: config.trafficSplit[index],
            variantIndex: index
          }
        })
      );

      await Promise.all(variantPromises);

      await smsLogger.logABTestCreated(abTest.id, config.name, {
        userId: config.userId,
        variantCount: config.variants.length,
        trafficSplit: config.trafficSplit
      });

      logger.info('SMS A/B test created successfully', {
        testId: abTest.id,
        name: config.name,
        variants: config.variants.length
      });

      return { success: true, testId: abTest.id };
    } catch (error) {
      logger.error('Failed to create SMS A/B test', { error, config });
      return { success: false, error: 'Failed to create A/B test' };
    }
  }

  /**
   * Start an A/B test
   */
  async startABTest(testId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const abTest = await prisma.sMSABTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      if (abTest.status !== 'DRAFT') {
        return { success: false, error: `Cannot start test with status: ${abTest.status}` };
      }

      if (abTest.variants.length < 2) {
        return { success: false, error: 'A/B test must have at least 2 variants' };
      }

      // Update test status
      await prisma.sMSABTest.update({
        where: { id: testId },
        data: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      await smsLogger.logABTestStarted(testId, abTest.name, {
        userId,
        variantCount: abTest.variants.length
      });

      logger.info('SMS A/B test started', { testId, name: abTest.name });

      return { success: true };
    } catch (error) {
      logger.error('Failed to start SMS A/B test', { error, testId });
      return { success: false, error: 'Failed to start A/B test' };
    }
  }

  /**
   * Stop an A/B test
   */
  async stopABTest(testId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const abTest = await prisma.sMSABTest.findUnique({
        where: { id: testId }
      });

      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      if (abTest.status !== 'RUNNING') {
        return { success: false, error: `Cannot stop test with status: ${abTest.status}` };
      }

      // Update test status
      await prisma.sMSABTest.update({
        where: { id: testId },
        data: {
          status: 'STOPPED',
          completedAt: new Date()
        }
      });

      await smsLogger.logABTestStopped(testId, abTest.name, {
        userId,
        reason: 'manually_stopped'
      });

      logger.info('SMS A/B test stopped', { testId, name: abTest.name });

      return { success: true };
    } catch (error) {
      logger.error('Failed to stop SMS A/B test', { error, testId });
      return { success: false, error: 'Failed to stop A/B test' };
    }
  }

  /**
   * Assign a contact to an A/B test variant
   */
  async assignContactToVariant(testId: string, contactId: string): Promise<{ success: boolean; variantId?: string; error?: string }> {
    try {
      const abTest = await prisma.sMSABTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      if (abTest.status !== 'RUNNING') {
        return { success: false, error: 'A/B test is not running' };
      }

      // Check if contact is already assigned
      const existingAssignment = await prisma.sMSABTestAssignment.findFirst({
        where: {
          abTestId: testId,
          contactId
        }
      });

      if (existingAssignment) {
        return { success: true, variantId: existingAssignment.variantId };
      }

      // Assign contact to variant based on traffic split
      const selectedVariant = this.selectVariantForContact(abTest.variants, contactId);

      // Create assignment record
      await prisma.sMSABTestAssignment.create({
        data: {
          abTestId: testId,
          contactId,
          variantId: selectedVariant.id,
          assignedAt: new Date()
        }
      });

      return { success: true, variantId: selectedVariant.id };
    } catch (error) {
      logger.error('Failed to assign contact to A/B test variant', { error, testId, contactId });
      return { success: false, error: 'Failed to assign contact to variant' };
    }
  }

  /**
   * Record A/B test activity (sent, delivered, etc.)
   */
  async recordABTestActivity(
    testId: string,
    variantId: string,
    contactId: string,
    activityType: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'CLICKED' | 'REPLIED',
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.sMSABTestActivity.create({
        data: {
          abTestId: testId,
          variantId,
          contactId,
          activityType,
          timestamp: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to record A/B test activity', { error, testId, variantId, activityType });
      return { success: false, error: 'Failed to record activity' };
    }
  }

  /**
   * Get A/B test results with statistical analysis
   */
  async getABTestResults(testId: string): Promise<{ success: boolean; results?: ABTestResult; error?: string }> {
    try {
      const abTest = await prisma.sMSABTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          activities: true,
          assignments: true
        }
      });

      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      // Calculate metrics for each variant
      const variantResults = await Promise.all(
        abTest.variants.map(async (variant) => {
          const activities = abTest.activities.filter(a => a.variantId === variant.id);
          
          const sent = activities.filter(a => a.activityType === 'SENT').length;
          const delivered = activities.filter(a => a.activityType === 'DELIVERED').length;
          const failed = activities.filter(a => a.activityType === 'FAILED').length;
          const opened = activities.filter(a => a.activityType === 'OPENED').length;
          const clicked = activities.filter(a => a.activityType === 'CLICKED').length;
          const replied = activities.filter(a => a.activityType === 'REPLIED').length;

          const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
          const engagementRate = delivered > 0 ? ((opened + clicked + replied) / delivered) * 100 : 0;
          const conversionRate = sent > 0 ? (replied / sent) * 100 : 0;

          return {
            id: variant.id,
            name: variant.name,
            content: variant.content,
            trafficPercentage: variant.trafficPercentage,
            sent,
            delivered,
            failed,
            opened,
            clicked,
            replied,
            conversionRate: Math.round(conversionRate * 100) / 100,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            engagementRate: Math.round(engagementRate * 100) / 100
          };
        })
      );

      // Determine statistical significance and winner
      const { isSignificant, winner } = this.calculateStatisticalSignificance(variantResults, abTest.significanceLevel);

      const results: ABTestResult = {
        id: abTest.id,
        name: abTest.name,
        status: abTest.status as any,
        variants: variantResults,
        winner,
        isStatisticallySignificant: isSignificant,
        totalSample: abTest.assignments.length,
        startedAt: abTest.startedAt || undefined,
        completedAt: abTest.completedAt || undefined
      };

      return { success: true, results };
    } catch (error) {
      logger.error('Failed to get A/B test results', { error, testId });
      return { success: false, error: 'Failed to get test results' };
    }
  }

  /**
   * Process automatic completion of A/B tests
   */
  async processAutomaticCompletion(): Promise<void> {
    try {
      const now = new Date();
      
      // Find running tests that should be completed
      const testsToComplete = await prisma.sMSABTest.findMany({
        where: {
          status: 'RUNNING',
          OR: [
            // Tests that have reached their duration
            {
              startedAt: {
                lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default 24 hours ago
              }
            }
          ]
        },
        include: {
          variants: true,
          activities: true,
          assignments: true
        }
      });

      for (const test of testsToComplete) {
        // Check if test has enough sample size
        const totalSample = test.assignments.length;
        if (totalSample < test.minimumSampleSize * test.variants.length) {
          logger.info('A/B test does not have sufficient sample size yet', {
            testId: test.id,
            totalSample,
            requiredSample: test.minimumSampleSize * test.variants.length
          });
          continue;
        }

        // Mark test as completed
        await prisma.sMSABTest.update({
          where: { id: test.id },
          data: {
            status: 'COMPLETED',
            completedAt: now
          }
        });

        await smsLogger.logABTestCompleted(test.id, test.name, {
          reason: 'automatic_completion',
          totalSample,
          duration: test.testDuration
        });

        logger.info('A/B test automatically completed', {
          testId: test.id,
          name: test.name,
          totalSample
        });
      }
    } catch (error) {
      logger.error('Failed to process automatic A/B test completion', { error });
    }
  }

  /**
   * Validate A/B test configuration
   */
  private validateABTestConfig(config: ABTestConfig): { isValid: boolean; error?: string } {
    if (!config.name || config.name.trim().length === 0) {
      return { isValid: false, error: 'Test name is required' };
    }

    if (!config.variants || config.variants.length < 2) {
      return { isValid: false, error: 'At least 2 variants are required' };
    }

    if (config.variants.length > 10) {
      return { isValid: false, error: 'Maximum 10 variants allowed' };
    }

    if (!config.trafficSplit || config.trafficSplit.length !== config.variants.length) {
      return { isValid: false, error: 'Traffic split must match number of variants' };
    }

    const totalTraffic = config.trafficSplit.reduce((sum, percentage) => sum + percentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      return { isValid: false, error: 'Traffic split must sum to 100%' };
    }

    for (const variant of config.variants) {
      if (!variant.name || variant.name.trim().length === 0) {
        return { isValid: false, error: 'All variants must have names' };
      }

      if (!variant.content || variant.content.trim().length === 0) {
        return { isValid: false, error: 'All variants must have content' };
      }
    }

    return { isValid: true };
  }

  /**
   * Select variant for contact based on traffic split
   */
  private selectVariantForContact(variants: any[], contactId: string): any {
    // Use contact ID hash for consistent assignment
    const hash = this.hashString(contactId);
    const percentage = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (percentage < cumulativePercentage) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  /**
   * Calculate statistical significance using Chi-square test
   */
  private calculateStatisticalSignificance(variants: any[], significanceLevel: number): {
    isSignificant: boolean;
    winner?: {
      variantId: string;
      variantName: string;
      confidence: number;
      improvementPercentage: number;
      metric: string;
    };
  } {
    if (variants.length !== 2) {
      // Multi-variant testing requires more complex analysis
      return { isSignificant: false };
    }

    const [control, treatment] = variants;
    
    // Use conversion rate as primary metric
    const controlConversions = Math.round((control.conversionRate / 100) * control.sent);
    const treatmentConversions = Math.round((treatment.conversionRate / 100) * treatment.sent);

    // Chi-square test for independence
    const chiSquare = this.calculateChiSquare(
      controlConversions,
      control.sent - controlConversions,
      treatmentConversions,
      treatment.sent - treatmentConversions
    );

    // Critical value for 95% confidence (df=1)
    const criticalValue = 3.841;
    const isSignificant = chiSquare > criticalValue;

    if (!isSignificant) {
      return { isSignificant: false };
    }

    // Determine winner
    const winner = treatment.conversionRate > control.conversionRate ? treatment : control;
    const loser = winner === treatment ? control : treatment;
    
    const improvementPercentage = ((winner.conversionRate - loser.conversionRate) / loser.conversionRate) * 100;
    const confidence = (1 - significanceLevel) * 100;

    return {
      isSignificant: true,
      winner: {
        variantId: winner.id,
        variantName: winner.name,
        confidence,
        improvementPercentage: Math.round(improvementPercentage * 100) / 100,
        metric: 'conversion_rate'
      }
    };
  }

  /**
   * Calculate Chi-square statistic
   */
  private calculateChiSquare(a: number, b: number, c: number, d: number): number {
    const n = a + b + c + d;
    const numerator = n * Math.pow((a * d - b * c), 2);
    const denominator = (a + b) * (c + d) * (a + c) * (b + d);
    
    return numerator / denominator;
  }

  /**
   * Simple hash function for consistent contact assignment
   */
  private hashString(str: string): number {
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
export const smsABTestingService = new SMSABTestingService();