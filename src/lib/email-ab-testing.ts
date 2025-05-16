/**
 * Email A/B Testing Integration
 * 
 * This module integrates the A/B testing framework with email campaigns,
 * specifically for testing subject lines, content variations, and send times.
 */

import { ABTestMetric, ABTestType, EntityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { 
  assignContactToVariant, 
  getVariantContent,
  recordABTestResult
} from '@/lib/ab-testing';

/**
 * Create a subject line A/B test for an email campaign
 */
export async function createSubjectLineTest(
  campaignId: string,
  subjects: string[], // Array of subject lines to test
  distributionPercent: number, // 0-1 value, percent of audience to test with
  userId: string
): Promise<string | null> {
  try {
    // Create variants with equal distribution
    const variantCount = subjects.length;
    const trafficPercent = 1 / variantCount;
    
    const variants = subjects.map((subject, index) => ({
      name: index === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
      description: `Subject line: ${subject}`,
      content: {
        subject: subject
      },
      trafficPercent: trafficPercent
    }));
    
    // Create the A/B test
    const response = await fetch('/api/ab-tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Subject Test - ${new Date().toISOString().split('T')[0]}`,
        description: 'Testing different email subject lines',
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaignId,
        testType: ABTestType.SIMPLE_AB,
        testElements: ['subject'],
        winnerMetric: ABTestMetric.OPEN_RATE,
        winnerThreshold: 0.95, // 95% confidence level
        distributionPercent,
        variants
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error('Failed to create subject line test', error);
      return null;
    }
    
    const result = await response.json();
    
    logger.info(`Created subject line test for campaign ${campaignId}`, { testId: result.id });
    
    return result.id;
  } catch (error) {
    logger.error('Error creating subject line test', error);
    return null;
  }
}

/**
 * Apply a subject line variant to an email before sending
 */
export async function applySubjectVariant(
  contactId: string,
  campaign: any
): Promise<{ subject: string; isTest: boolean }> {
  try {
    // Check if there's an active A/B test for this campaign
    const test = await prisma.aBTest.findFirst({
      where: {
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaign.id,
        status: 'RUNNING',
        testElements: {
          contains: 'subject'
        }
      },
      select: {
        id: true
      }
    });
    
    if (!test) {
      return { subject: campaign.subject, isTest: false };
    }
    
    // Assign the contact to a variant
    const variantId = await assignContactToVariant(test.id, contactId);
    
    if (!variantId) {
      return { subject: campaign.subject, isTest: false };
    }
    
    // Get the variant content
    const content = await getVariantContent(variantId);
    
    if (!content || !content.subject) {
      return { subject: campaign.subject, isTest: false };
    }
    
    return {
      subject: content.subject,
      isTest: true
    };
  } catch (error) {
    logger.error('Error applying subject variant', error);
    return { subject: campaign.subject, isTest: false };
  }
}

/**
 * Record email open for a subject line test
 */
export async function recordSubjectTestOpen(
  campaignId: string,
  contactId: string
): Promise<boolean> {
  try {
    // Find active subject line test for this campaign
    const test = await prisma.aBTest.findFirst({
      where: {
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaignId,
        status: 'RUNNING',
        testElements: {
          contains: 'subject'
        }
      }
    });
    
    if (!test) {
      return false;
    }
    
    // Get the variant assigned to this contact
    const variantId = await assignContactToVariant(test.id, contactId);
    
    if (!variantId) {
      return false;
    }
    
    // Get current metrics for the variant
    const currentResult = await prisma.aBTestResult.findUnique({
      where: {
        testId_variantId_metric: {
          testId: test.id,
          variantId: variantId,
          metric: ABTestMetric.OPEN_RATE
        }
      }
    });
    
    let value = 1; // This is an open, so 100% open rate for this contact
    let sampleSize = 1;
    
    if (currentResult) {
      // Update the existing result
      sampleSize += currentResult.sampleSize;
    }
    
    // Record the result
    await recordABTestResult(
      test.id,
      variantId,
      ABTestMetric.OPEN_RATE,
      value,
      sampleSize
    );
    
    return true;
  } catch (error) {
    logger.error('Error recording subject test open', error);
    return false;
  }
}

/**
 * Record email click for a subject line test
 */
export async function recordSubjectTestClick(
  campaignId: string,
  contactId: string
): Promise<boolean> {
  try {
    // Find active subject line test for this campaign
    const test = await prisma.aBTest.findFirst({
      where: {
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaignId,
        status: 'RUNNING',
        testElements: {
          contains: 'subject'
        }
      }
    });
    
    if (!test) {
      return false;
    }
    
    // Get the variant assigned to this contact
    const variantId = await assignContactToVariant(test.id, contactId);
    
    if (!variantId) {
      return false;
    }
    
    // Get current metrics for the variant
    const currentResult = await prisma.aBTestResult.findUnique({
      where: {
        testId_variantId_metric: {
          testId: test.id,
          variantId: variantId,
          metric: ABTestMetric.CLICK_RATE
        }
      }
    });
    
    let value = 1; // This is a click, so 100% click rate for this contact
    let sampleSize = 1;
    
    if (currentResult) {
      // Update the existing result
      sampleSize += currentResult.sampleSize;
    }
    
    // Record the result
    await recordABTestResult(
      test.id,
      variantId,
      ABTestMetric.CLICK_RATE,
      value,
      sampleSize
    );
    
    return true;
  } catch (error) {
    logger.error('Error recording subject test click', error);
    return false;
  }
}

/**
 * Get the winning subject line from a completed test
 */
export async function getWinningSubject(campaignId: string): Promise<string | null> {
  try {
    // Find completed subject line test for this campaign
    const test = await prisma.aBTest.findFirst({
      where: {
        entityType: EntityType.EMAIL_CAMPAIGN,
        entityId: campaignId,
        status: 'COMPLETED',
        testElements: {
          contains: 'subject'
        }
      },
      include: {
        variants: true
      }
    });
    
    if (!test || !test.winnerVariantId) {
      return null;
    }
    
    // Find the winning variant
    const winningVariant = test.variants.find(v => v.id === test.winnerVariantId);
    
    if (!winningVariant) {
      return null;
    }
    
    // Parse the content to get the subject
    const content = JSON.parse(winningVariant.content);
    
    return content.subject || null;
  } catch (error) {
    logger.error('Error getting winning subject', error);
    return null;
  }
} 