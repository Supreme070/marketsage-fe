/**
 * Journey Analytics Service
 * 
 * Provides functionality to analyze customer journey performance,
 * identify bottlenecks, and calculate journey metrics.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { 
  JourneyAnalyticsData, 
  JourneyBottleneckData,
  validateJourney,
  validateJourneyStage
} from './index';

/**
 * Calculate and store journey analytics for a specific journey
 */
export async function calculateJourneyAnalytics(journeyId: string): Promise<JourneyAnalyticsData> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Get journey with stages
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        stages: {
          orderBy: {
            order: 'asc'
          }
        },
        contactJourneys: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            currentStageId: true
          }
        }
      }
    });
    
    // Count total contacts
    const totalContacts = journey.contactJourneys.length;
    const activeContacts = journey.contactJourneys.filter(cj => cj.status === 'ACTIVE').length;
    const completedContacts = journey.contactJourneys.filter(cj => cj.status === 'COMPLETED').length;
    const droppedContacts = journey.contactJourneys.filter(cj => cj.status === 'DROPPED').length;
    
    // Calculate overall conversion rate
    const conversionRate = totalContacts > 0 ? completedContacts / totalContacts : 0;
    
    // Calculate average duration for completed journeys (in hours)
    let totalDuration = 0;
    let completedCount = 0;
    
    journey.contactJourneys.forEach(cj => {
      if (cj.status === 'COMPLETED' && cj.completedAt) {
        const durationHours = (cj.completedAt.getTime() - cj.startedAt.getTime()) / (1000 * 60 * 60);
        totalDuration += durationHours;
        completedCount++;
      }
    });
    
    const averageDuration = completedCount > 0 ? Math.round(totalDuration / completedCount) : 0;
    
    // Calculate stage-level analytics
    const stageData: {
      [stageId: string]: {
        contacts: number;
        enteredCount: number;
        exitedCount: number;
        conversionRate: number;
        avgDuration: number;
      }
    } = {};
    
    // Process each stage
    for (const stage of journey.stages) {
      // Get all contact journey stages for this stage
      const contactStages = await prisma.contactJourneyStage.findMany({
        where: {
          stageId: stage.id,
          contactJourney: {
            journeyId
          }
        },
        include: {
          contactJourney: {
            select: {
              status: true
            }
          }
        }
      });
      
      // Count metrics
      const currentlyInStage = contactStages.filter(cs => cs.exitedAt === null).length;
      const enteredCount = contactStages.length;
      const exitedCount = contactStages.filter(cs => cs.exitedAt !== null).length;
      
      // Calculate conversion rate (how many who entered this stage have exited it)
      const stageConversionRate = enteredCount > 0 ? exitedCount / enteredCount : 0;
      
      // Calculate average time in stage (in hours)
      let stageTotalDuration = 0;
      let stageCompletedCount = 0;
      
      contactStages.forEach(cs => {
        if (cs.exitedAt) {
          const durationHours = (cs.exitedAt.getTime() - cs.enteredAt.getTime()) / (1000 * 60 * 60);
          stageTotalDuration += durationHours;
          stageCompletedCount++;
        }
      });
      
      const stageAvgDuration = stageCompletedCount > 0 ? 
        Math.round(stageTotalDuration / stageCompletedCount) : 0;
      
      // Store stage analytics
      stageData[stage.id] = {
        contacts: currentlyInStage,
        enteredCount,
        exitedCount,
        conversionRate: stageConversionRate,
        avgDuration: stageAvgDuration
      };
    }
    
    // Create analytics record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analyticsData: JourneyAnalyticsData = {
      journeyId,
      date: today,
      totalContacts,
      activeContacts,
      completedContacts,
      droppedContacts,
      conversionRate,
      averageDuration,
      stageData
    };
    
    // Save analytics to database
    await prisma.journeyAnalytics.upsert({
      where: {
        journeyId_date: {
          journeyId,
          date: today
        }
      },
      update: {
        totalContacts,
        activeContacts,
        completedContacts,
        droppedContacts,
        conversionRate,
        averageDuration,
        stageData: JSON.stringify(stageData)
      },
      create: {
        id: randomUUID(),
        journeyId,
        date: today,
        totalContacts,
        activeContacts,
        completedContacts,
        droppedContacts,
        conversionRate,
        averageDuration,
        stageData: JSON.stringify(stageData)
      }
    });
    
    logger.info(`Calculated journey analytics for journey ${journeyId}`, {
      totalContacts,
      activeContacts,
      completedContacts,
      droppedContacts,
      conversionRate,
      averageDuration
    });
    
    return analyticsData;
  } catch (error) {
    logger.error(`Error calculating journey analytics: ${error.message}`, error);
    throw new Error(`Failed to calculate journey analytics: ${error.message}`);
  }
}

/**
 * Get journey analytics for a specific date range
 */
export async function getJourneyAnalytics(
  journeyId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<JourneyAnalyticsData[]> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Build query
    const where: any = { journeyId };
    
    if (options?.startDate || options?.endDate) {
      where.date = {};
      
      if (options?.startDate) {
        where.date.gte = options.startDate;
      }
      
      if (options?.endDate) {
        where.date.lte = options.endDate;
      }
    }
    
    // Get analytics
    const analytics = await prisma.journeyAnalytics.findMany({
      where,
      orderBy: {
        date: 'asc'
      }
    });
    
    // Format data
    return analytics.map(item => ({
      journeyId: item.journeyId,
      date: item.date,
      totalContacts: item.totalContacts,
      activeContacts: item.activeContacts,
      completedContacts: item.completedContacts,
      droppedContacts: item.droppedContacts,
      conversionRate: item.conversionRate,
      averageDuration: item.averageDuration,
      stageData: JSON.parse(item.stageData)
    }));
  } catch (error) {
    logger.error(`Error getting journey analytics: ${error.message}`, error);
    throw new Error(`Failed to get journey analytics: ${error.message}`);
  }
}

/**
 * Identify bottlenecks in a journey based on analytics
 */
export async function identifyJourneyBottlenecks(journeyId: string): Promise<JourneyBottleneckData[]> {
  try {
    // Get the most recent analytics
    const analytics = await calculateJourneyAnalytics(journeyId);
    
    // Get journey with stages to get stage details
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        stages: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    const bottlenecks: JourneyBottleneckData[] = [];
    
    // Analyze each stage
    for (const stage of journey.stages) {
      const stageAnalytics = analytics.stageData[stage.id];
      
      if (!stageAnalytics) continue;
      
      // Calculate drop-off rate (1 - conversion rate)
      const dropOffRate = 1 - stageAnalytics.conversionRate;
      
      // Check if this stage is a bottleneck
      let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let recommendations: string[] = [];
      
      // Check conversion rate against target
      const hasLowConversion = stage.conversionGoal && 
        stageAnalytics.conversionRate < stage.conversionGoal;
      
      // Check duration against expected
      const hasTooLongDuration = stage.expectedDuration && 
        stageAnalytics.avgDuration > stage.expectedDuration;
      
      // Determine if this is a bottleneck
      if (dropOffRate > 0.3 || hasLowConversion || hasTooLongDuration) {
        // This is a bottleneck - determine severity
        if (dropOffRate > 0.5 || 
            (stage.conversionGoal && stageAnalytics.conversionRate < stage.conversionGoal * 0.7) ||
            (stage.expectedDuration && stageAnalytics.avgDuration > stage.expectedDuration * 1.5)) {
          impact = 'HIGH';
        } else if (dropOffRate > 0.3 || 
                  (stage.conversionGoal && stageAnalytics.conversionRate < stage.conversionGoal * 0.85) ||
                  (stage.expectedDuration && stageAnalytics.avgDuration > stage.expectedDuration * 1.2)) {
          impact = 'MEDIUM';
        }
        
        // Generate recommendations
        if (dropOffRate > 0.3) {
          recommendations.push(`High drop-off rate (${(dropOffRate * 100).toFixed(1)}%). Consider improving engagement.`);
        }
        
        if (hasLowConversion) {
          recommendations.push(`Conversion rate (${(stageAnalytics.conversionRate * 100).toFixed(1)}%) below target (${(stage.conversionGoal * 100).toFixed(1)}%). Review transition triggers.`);
        }
        
        if (hasTooLongDuration) {
          recommendations.push(`Average duration (${stageAnalytics.avgDuration} hours) exceeds expected time (${stage.expectedDuration} hours). Streamline this stage.`);
        }
        
        // Add more specific recommendations
        if (stageAnalytics.enteredCount > 0 && stageAnalytics.exitedCount === 0) {
          recommendations.push('No contacts have moved past this stage. Check if transitions are configured correctly.');
        }
        
        // Add to bottlenecks list
        bottlenecks.push({
          stageId: stage.id,
          stageName: stage.name,
          conversionRate: stageAnalytics.conversionRate,
          targetConversionRate: stage.conversionGoal,
          averageDuration: stageAnalytics.avgDuration,
          expectedDuration: stage.expectedDuration,
          dropOffRate,
          impact,
          recommendations
        });
      }
    }
    
    // Sort bottlenecks by impact (high to low)
    return bottlenecks.sort((a, b) => {
      const impactOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  } catch (error) {
    logger.error(`Error identifying journey bottlenecks: ${error.message}`, error);
    throw new Error(`Failed to identify journey bottlenecks: ${error.message}`);
  }
}

/**
 * Get contact flow distribution across journey stages
 */
export async function getJourneyFlowDistribution(
  journeyId: string
): Promise<{ 
  stageId: string;
  stageName: string; 
  order: number;
  count: number;
  percentage: number;
}[]> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Get journey with stages
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        stages: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            name: true,
            order: true,
            _count: {
              select: {
                contactStages: true
              }
            }
          }
        },
        _count: {
          select: {
            contactJourneys: true
          }
        }
      }
    });
    
    // Get counts of contacts currently in each stage
    const stageCounts = await Promise.all(journey.stages.map(async stage => {
      const activeCount = await prisma.contactJourneyStage.count({
        where: {
          stageId: stage.id,
          exitedAt: null,
          contactJourney: {
            journeyId,
            status: 'ACTIVE'
          }
        }
      });
      
      return {
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        count: activeCount
      };
    }));
    
    // Calculate percentages
    const totalContacts = journey._count.contactJourneys;
    const distribution = stageCounts.map(stage => ({
      ...stage,
      percentage: totalContacts > 0 ? (stage.count / totalContacts) * 100 : 0
    }));
    
    return distribution;
  } catch (error) {
    logger.error(`Error getting journey flow distribution: ${error.message}`, error);
    throw new Error(`Failed to get journey flow distribution: ${error.message}`);
  }
}

/**
 * Get journey completion time distribution
 */
export async function getJourneyCompletionTimeDistribution(
  journeyId: string
): Promise<{ 
  timeRange: string;
  count: number;
  percentage: number;
}[]> {
  try {
    // Get completed contact journeys
    const completedJourneys = await prisma.contactJourney.findMany({
      where: {
        journeyId,
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      }
    });
    
    // Calculate completion times in hours
    const completionTimesHours = completedJourneys.map(journey => {
      const durationMs = journey.completedAt.getTime() - journey.startedAt.getTime();
      return Math.floor(durationMs / (1000 * 60 * 60)); // Convert to hours
    });
    
    // Define time ranges in hours
    const timeRanges = [
      { label: 'Under 1 hour', min: 0, max: 1 },
      { label: '1-6 hours', min: 1, max: 6 },
      { label: '6-24 hours', min: 6, max: 24 },
      { label: '1-3 days', min: 24, max: 72 },
      { label: '3-7 days', min: 72, max: 168 },
      { label: 'Over 7 days', min: 168, max: Infinity }
    ];
    
    // Count journeys in each range
    const distribution = timeRanges.map(range => {
      const count = completionTimesHours.filter(
        time => time >= range.min && time < range.max
      ).length;
      
      return {
        timeRange: range.label,
        count,
        percentage: completedJourneys.length > 0 ? 
          (count / completedJourneys.length) * 100 : 0
      };
    });
    
    return distribution;
  } catch (error) {
    logger.error(`Error getting journey completion time distribution: ${error.message}`, error);
    throw new Error(`Failed to get journey completion time distribution: ${error.message}`);
  }
} 