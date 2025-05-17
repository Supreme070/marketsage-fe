/**
 * Journey Metrics Service
 * 
 * Provides functionality to define, calculate, and track metrics for customer journeys.
 * Supports metrics at both journey and stage levels.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { 
  JourneyMetricData, 
  JourneyStageMetricData,
  JourneyMetricType,
  MetricAggregationType,
  validateJourney,
  validateJourneyStage,
  validateJourneyMetric,
  debugLog
} from './index';

/**
 * Create a new journey metric
 */
export async function createJourneyMetric(
  journeyId: string,
  metricData: JourneyMetricData
): Promise<JourneyMetricData> {
  try {
    debugLog(`Creating journey metric:`, { journeyId, metricName: metricData.name });
    
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Create metric
    const metric = await prisma.JourneyMetric.create({
      data: {
        id: metricData.id || randomUUID(),
        journeyId,
        name: metricData.name,
        description: metricData.description,
        metricType: metricData.metricType,
        targetValue: metricData.targetValue,
        aggregationType: metricData.aggregationType || MetricAggregationType.SUM,
        formula: metricData.formula,
        isSuccess: metricData.isSuccess || false
      }
    });
    
    // Create stage metrics if provided
    if (metricData.stageMetrics && metricData.stageMetrics.length > 0) {
      for (const stageMetric of metricData.stageMetrics) {
        // Validate stage exists
        await validateJourneyStage(stageMetric.stageId);
        
        // Create stage metric
        await prisma.JourneyStageMetric.create({
          data: {
            id: stageMetric.id || randomUUID(),
            stageId: stageMetric.stageId,
            metricId: metric.id,
            targetValue: stageMetric.targetValue,
            actualValue: stageMetric.actualValue
          }
        });
      }
    }
    
    logger.info(`Created journey metric ${metric.id} for journey ${journeyId}`);
    debugLog(`Successfully created journey metric:`, metric);
    
    // Return the created metric with stage metrics
    return {
      id: metric.id,
      name: metric.name,
      description: metric.description,
      metricType: metric.metricType as JourneyMetricType,
      targetValue: metric.targetValue,
      aggregationType: metric.aggregationType as MetricAggregationType,
      formula: metric.formula,
      isSuccess: metric.isSuccess,
      stageMetrics: metricData.stageMetrics
    };
  } catch (error) {
    logger.error(`Error creating journey metric: ${error.message}`, error);
    debugLog(`Error creating journey metric:`, { journeyId, error: (error as Error).message });
    throw new Error(`Failed to create journey metric: ${error.message}`);
  }
}

/**
 * Update journey metric
 */
export async function updateJourneyMetric(
  metricId: string,
  metricData: Partial<JourneyMetricData>
): Promise<JourneyMetricData> {
  try {
    debugLog(`Updating journey metric:`, { metricId });
    
    // Validate metric exists
    await validateJourneyMetric(metricId);
    
    // Update metric
    const metric = await prisma.JourneyMetric.update({
      where: { id: metricId },
      data: {
        name: metricData.name,
        description: metricData.description,
        metricType: metricData.metricType,
        targetValue: metricData.targetValue,
        aggregationType: metricData.aggregationType,
        formula: metricData.formula,
        isSuccess: metricData.isSuccess
      },
      include: {
        stageMetrics: true
      }
    });
    
    // Update stage metrics if provided
    if (metricData.stageMetrics && metricData.stageMetrics.length > 0) {
      for (const stageMetric of metricData.stageMetrics) {
        // Validate stage exists
        await validateJourneyStage(stageMetric.stageId);
        
        // Update or create stage metric
        await prisma.JourneyStageMetric.upsert({
          where: {
            stageId_metricId: {
              stageId: stageMetric.stageId,
              metricId
            }
          },
          update: {
            targetValue: stageMetric.targetValue,
            actualValue: stageMetric.actualValue
          },
          create: {
            id: stageMetric.id || randomUUID(),
            stageId: stageMetric.stageId,
            metricId,
            targetValue: stageMetric.targetValue,
            actualValue: stageMetric.actualValue
          }
        });
      }
    }
    
    logger.info(`Updated journey metric ${metricId}`);
    debugLog(`Successfully updated journey metric:`, metric);
    
    // Format stage metrics
    const stageMetrics = metric.stageMetrics.map(sm => ({
      id: sm.id,
      stageId: sm.stageId,
      metricId: sm.metricId,
      targetValue: sm.targetValue,
      actualValue: sm.actualValue
    }));
    
    // Return the updated metric with stage metrics
    return {
      id: metric.id,
      name: metric.name,
      description: metric.description,
      metricType: metric.metricType as JourneyMetricType,
      targetValue: metric.targetValue,
      aggregationType: metric.aggregationType as MetricAggregationType,
      formula: metric.formula,
      isSuccess: metric.isSuccess,
      stageMetrics
    };
  } catch (error) {
    logger.error(`Error updating journey metric: ${error.message}`, error);
    debugLog(`Error updating journey metric:`, { metricId, error: (error as Error).message });
    throw new Error(`Failed to update journey metric: ${error.message}`);
  }
}

/**
 * Get journey metrics for a specific journey
 */
export async function getJourneyMetrics(journeyId: string): Promise<JourneyMetricData[]> {
  try {
    debugLog(`Getting journey metrics:`, { journeyId });
    
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Get metrics with stage metrics
    const metrics = await prisma.JourneyMetric.findMany({
      where: { journeyId },
      include: {
        stageMetrics: true
      }
    });
    
    // Format response
    return metrics.map(metric => ({
      id: metric.id,
      name: metric.name,
      description: metric.description,
      metricType: metric.metricType as JourneyMetricType,
      targetValue: metric.targetValue,
      aggregationType: metric.aggregationType as MetricAggregationType,
      formula: metric.formula,
      isSuccess: metric.isSuccess,
      stageMetrics: metric.stageMetrics.map(sm => ({
        id: sm.id,
        stageId: sm.stageId,
        metricId: sm.metricId,
        targetValue: sm.targetValue,
        actualValue: sm.actualValue
      }))
    }));
  } catch (error) {
    logger.error(`Error getting journey metrics: ${error.message}`, error);
    debugLog(`Error getting journey metrics:`, { journeyId, error: (error as Error).message });
    throw new Error(`Failed to get journey metrics: ${error.message}`);
  }
}

/**
 * Delete journey metric
 */
export async function deleteJourneyMetric(metricId: string): Promise<void> {
  try {
    debugLog(`Deleting journey metric:`, { metricId });
    
    // Validate metric exists
    await validateJourneyMetric(metricId);
    
    // Delete stage metrics first (cascade doesn't always work as expected)
    await prisma.JourneyStageMetric.deleteMany({
      where: { metricId }
    });
    
    // Delete the metric
    await prisma.JourneyMetric.delete({
      where: { id: metricId }
    });
    
    logger.info(`Deleted journey metric ${metricId}`);
    debugLog(`Successfully deleted journey metric:`, { metricId });
  } catch (error) {
    logger.error(`Error deleting journey metric: ${error.message}`, error);
    debugLog(`Error deleting journey metric:`, { metricId, error: (error as Error).message });
    throw new Error(`Failed to delete journey metric: ${error.message}`);
  }
}

/**
 * Update stage metric value
 */
export async function updateStageMetricValue(
  stageId: string,
  metricId: string,
  actualValue: number
): Promise<JourneyStageMetricData> {
  try {
    debugLog(`Updating stage metric value:`, { stageId, metricId, actualValue });
    
    // Validate stage and metric exist
    await validateJourneyStage(stageId);
    await validateJourneyMetric(metricId);
    
    // Update stage metric
    const stageMetric = await prisma.JourneyStageMetric.upsert({
      where: {
        stageId_metricId: {
          stageId,
          metricId
        }
      },
      update: {
        actualValue,
        lastUpdated: new Date()
      },
      create: {
        id: randomUUID(),
        stageId,
        metricId,
        actualValue,
        lastUpdated: new Date()
      }
    });
    
    logger.info(`Updated stage metric value for stage ${stageId}, metric ${metricId}`);
    debugLog(`Successfully updated stage metric value:`, stageMetric);
    
    return {
      id: stageMetric.id,
      stageId: stageMetric.stageId,
      metricId: stageMetric.metricId,
      targetValue: stageMetric.targetValue,
      actualValue: stageMetric.actualValue
    };
  } catch (error) {
    logger.error(`Error updating stage metric value: ${error.message}`, error);
    debugLog(`Error updating stage metric value:`, { 
      stageId, 
      metricId, 
      error: (error as Error).message 
    });
    throw new Error(`Failed to update stage metric value: ${error.message}`);
  }
}

/**
 * Calculate journey metrics based on current data
 * This recalculates metrics for a journey based on the latest analytics
 */
export async function calculateJourneyMetrics(journeyId: string): Promise<JourneyMetricData[]> {
  try {
    debugLog(`Calculating journey metrics:`, { journeyId });
    
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Get journey with stages, metrics, and analytics
    const journey = await prisma.Journey.findUnique({
      where: { id: journeyId },
      include: {
        stages: {
          include: {
            contactStages: true
          }
        },
        metrics: {
          include: {
            stageMetrics: true
          }
        },
        contactJourneys: true
      }
    });
    
    // Get the latest analytics
    const latestAnalytics = await prisma.JourneyAnalytics.findFirst({
      where: { journeyId },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Calculate metrics
    for (const metric of journey.metrics) {
      let journeyMetricValue: number | null = null;
      
      // Calculate journey-level metrics
      switch (metric.metricType) {
        case 'CONVERSION_RATE':
          // Use the latest analytics or calculate
          if (latestAnalytics) {
            journeyMetricValue = latestAnalytics.conversionRate;
          } else {
            const totalContacts = journey.contactJourneys.length;
            const completedContacts = journey.contactJourneys.filter(cj => cj.status === 'COMPLETED').length;
            journeyMetricValue = totalContacts > 0 ? completedContacts / totalContacts : 0;
          }
          break;
          
        case 'CONTACTS_COUNT':
          journeyMetricValue = journey.contactJourneys.length;
          break;
          
        case 'DURATION':
          // Use the latest analytics or calculate
          if (latestAnalytics) {
            journeyMetricValue = latestAnalytics.averageDuration;
          } else {
            let totalDuration = 0;
            let completedCount = 0;
            
            journey.contactJourneys.forEach(cj => {
              if (cj.status === 'COMPLETED' && cj.completedAt) {
                const durationHours = (cj.completedAt.getTime() - cj.startedAt.getTime()) / (1000 * 60 * 60);
                totalDuration += durationHours;
                completedCount++;
              }
            });
            
            journeyMetricValue = completedCount > 0 ? Math.round(totalDuration / completedCount) : 0;
          }
          break;
          
        case 'REVENUE':
          // Would require data from conversion tracking
          journeyMetricValue = 0;
          break;
          
        case 'CUSTOM':
          // Custom metrics would be calculated elsewhere or through the formula
          if (metric.formula) {
            // Simple evaluation of basic formulas (not a full parser)
            try {
              // This is just a placeholder - real implementation would need a formula parser
              journeyMetricValue = 0;
            } catch (e) {
              logger.warn(`Could not evaluate formula for metric ${metric.id}: ${(e as Error).message}`);
              journeyMetricValue = 0;
            }
          }
          break;
      }
      
      // Update the journey-level metric value
      if (journeyMetricValue !== null) {
        await prisma.JourneyMetric.update({
          where: { id: metric.id },
          data: {
            targetValue: metric.targetValue // Keep the same target
          }
        });
      }
      
      // Calculate stage-level metrics
      for (const stage of journey.stages) {
        let stageMetricValue: number | null = null;
        
        // Calculate different types of metrics for this stage
        switch (metric.metricType) {
          case 'CONVERSION_RATE':
            // Calculate stage conversion rate
            const contactStages = stage.contactStages;
            const enteredCount = contactStages.length;
            const exitedCount = contactStages.filter(cs => cs.exitedAt !== null).length;
            stageMetricValue = enteredCount > 0 ? exitedCount / enteredCount : 0;
            break;
            
          case 'CONTACTS_COUNT':
            // Current contacts in this stage
            stageMetricValue = stage.contactStages.filter(cs => cs.exitedAt === null).length;
            break;
            
          case 'DURATION':
            // Average time spent in this stage
            let stageTotalDuration = 0;
            let stageCompletedCount = 0;
            
            stage.contactStages.forEach(cs => {
              if (cs.exitedAt) {
                // Calculate duration in hours
                const durationHours = (cs.exitedAt.getTime() - cs.enteredAt.getTime()) / (1000 * 60 * 60);
                stageTotalDuration += durationHours;
                stageCompletedCount++;
              }
            });
            
            stageMetricValue = stageCompletedCount > 0 ? 
              Math.round(stageTotalDuration / stageCompletedCount) : 0;
            break;
            
          // Other metric types would be calculated similarly
        }
        
        // Find the stage metric record
        const stageMetric = metric.stageMetrics.find(sm => sm.stageId === stage.id);
        
        // Update stage metric if value was calculated
        if (stageMetricValue !== null) {
          if (stageMetric) {
            // Update existing stage metric
            await prisma.JourneyStageMetric.update({
              where: {
                id: stageMetric.id
              },
              data: {
                actualValue: stageMetricValue,
                lastUpdated: new Date()
              }
            });
          } else {
            // Create new stage metric
            await prisma.JourneyStageMetric.create({
              data: {
                id: randomUUID(),
                stageId: stage.id,
                metricId: metric.id,
                actualValue: stageMetricValue,
                lastUpdated: new Date()
              }
            });
          }
        }
      }
    }
    
    debugLog(`Successfully calculated journey metrics`);
    
    // Get updated metrics
    return await getJourneyMetrics(journeyId);
  } catch (error) {
    logger.error(`Error calculating journey metrics: ${error.message}`, error);
    debugLog(`Error calculating journey metrics:`, { journeyId, error: (error as Error).message });
    throw new Error(`Failed to calculate journey metrics: ${error.message}`);
  }
} 