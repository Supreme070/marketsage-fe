/**
 * Journey Service
 * 
 * Provides functionality for creating and managing customer journeys
 * and their stages, transitions, and structure.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { 
  JourneyData, 
  JourneyStageData, 
  JourneyTransitionData,
  TransitionTriggerType,
  validateJourney,
  validateJourneyStage
} from './index';

/**
 * Create a new customer journey
 */
export async function createJourney(
  data: {
    name: string;
    description?: string;
    createdById: string;
    stages?: JourneyStageData[];
  }
): Promise<JourneyData> {
  try {
    logger.info(`Creating new customer journey: ${data.name}`);
    
    // Create journey in database
    const journey = await (prisma as any).journey.create({
      data: {
        id: randomUUID(),
        name: data.name,
        description: data.description,
        isActive: true,
        createdById: data.createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Create stages if provided
    let stages: JourneyStageData[] = [];
    
    if (data.stages && data.stages.length > 0) {
      stages = await Promise.all(
        data.stages.map(async (stageData, index) => {
          return await createJourneyStage({
            journeyId: journey.id,
            ...stageData,
            order: stageData.order ?? index
          });
        })
      );
    }
    
    // Return complete journey data
    return {
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: stages
    };
  } catch (error: any) {
    logger.error(`Error creating journey: ${error.message}`, error);
    throw new Error(`Failed to create journey: ${error.message}`);
  }
}

/**
 * Get a specific journey by ID with all its stages and transitions
 */
export async function getJourney(journeyId: string): Promise<JourneyData> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Get journey with stages and transitions
    const journey = await (prisma as any).journey.findUnique({
      where: { id: journeyId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            transitions: {
              include: {
                toStage: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            incomingTransitions: {
              include: {
                fromStage: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        metrics: true
      }
    });
    
    // Format data for response
    return {
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: journey.stages.map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        expectedDuration: stage.expectedDuration,
        conversionGoal: stage.conversionGoal,
        isEntryPoint: stage.isEntryPoint,
        isExitPoint: stage.isExitPoint,
        transitions: stage.transitions.map((transition: any) => ({
          id: transition.id,
          name: transition.name,
          description: transition.description,
          fromStageId: transition.fromStageId,
          toStageId: transition.toStageId,
          triggerType: transition.triggerType as TransitionTriggerType,
          triggerDetails: transition.triggerDetails ? JSON.parse(transition.triggerDetails) : null,
          conditions: transition.conditions ? JSON.parse(transition.conditions) : null
        }))
      })),
      metrics: journey.metrics.map((metric: any) => ({
        id: metric.id,
        name: metric.name,
        description: metric.description,
        metricType: metric.metricType,
        targetValue: metric.targetValue,
        aggregationType: metric.aggregationType,
        formula: metric.formula,
        isSuccess: metric.isSuccess
      }))
    };
  } catch (error: any) {
    logger.error(`Error getting journey ${journeyId}: ${error.message}`, error);
    throw new Error(`Failed to get journey: ${error.message}`);
  }
}

/**
 * Get all journeys with basic details (not including stages)
 */
export async function getJourneys(options?: {
  isActive?: boolean;
  createdById?: string;
  limit?: number;
}): Promise<JourneyData[]> {
  try {
    // Build where clause
    const where: any = {};
    
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    
    if (options?.createdById) {
      where.createdById = options.createdById;
    }
    
    // Get journeys
    const journeys = await (prisma as any).journey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      include: {
        stages: {
          select: {
            id: true,
            name: true,
            order: true,
            isEntryPoint: true,
            isExitPoint: true,
            _count: {
              select: {
                contactStages: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            contactJourneys: true
          }
        }
      }
    });
    
    // Format data for response
    return journeys.map((journey: any) => ({
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: journey.stages.map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        isEntryPoint: stage.isEntryPoint,
        isExitPoint: stage.isExitPoint,
        contactCount: stage._count?.contactStages || 0
      }))
    }));
  } catch (error: any) {
    logger.error(`Error getting journeys: ${error.message}`, error);
    throw new Error(`Failed to get journeys: ${error.message}`);
  }
}

/**
 * Update a journey's basic details (name, description, etc.)
 */
export async function updateJourney(
  journeyId: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<JourneyData> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Update journey
    const journey = await prisma.journey.update({
      where: { id: journeyId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return {
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: journey.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        expectedDuration: stage.expectedDuration,
        conversionGoal: stage.conversionGoal,
        isEntryPoint: stage.isEntryPoint,
        isExitPoint: stage.isExitPoint
      }))
    };
  } catch (error) {
    logger.error(`Error updating journey ${journeyId}: ${error.message}`, error);
    throw new Error(`Failed to update journey: ${error.message}`);
  }
}

/**
 * Delete a journey and all its stages, transitions, and related data
 */
export async function deleteJourney(journeyId: string): Promise<boolean> {
  try {
    // Validate journey exists
    await validateJourney(journeyId);
    
    // Delete journey - cascades to all related data
    await prisma.journey.delete({
      where: { id: journeyId }
    });
    
    logger.info(`Journey ${journeyId} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting journey ${journeyId}: ${error.message}`, error);
    throw new Error(`Failed to delete journey: ${error.message}`);
  }
}

/**
 * Create a journey stage
 */
export async function createJourneyStage(
  data: {
    journeyId: string;
    name: string;
    description?: string;
    order: number;
    expectedDuration?: number;
    conversionGoal?: number;
    isEntryPoint?: boolean;
    isExitPoint?: boolean;
  }
): Promise<JourneyStageData> {
  try {
    // Validate journey exists
    await validateJourney(data.journeyId);
    
    // Create stage in database
    const stage = await prisma.journeyStage.create({
      data: {
        id: randomUUID(),
        journeyId: data.journeyId,
        name: data.name,
        description: data.description,
        order: data.order,
        expectedDuration: data.expectedDuration,
        conversionGoal: data.conversionGoal,
        isEntryPoint: data.isEntryPoint || false,
        isExitPoint: data.isExitPoint || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    logger.info(`Created journey stage ${stage.name} for journey ${data.journeyId}`);
    
    return {
      id: stage.id,
      name: stage.name,
      description: stage.description,
      order: stage.order,
      expectedDuration: stage.expectedDuration,
      conversionGoal: stage.conversionGoal,
      isEntryPoint: stage.isEntryPoint,
      isExitPoint: stage.isExitPoint
    };
  } catch (error) {
    logger.error(`Error creating journey stage: ${error.message}`, error);
    throw new Error(`Failed to create journey stage: ${error.message}`);
  }
}

/**
 * Update a journey stage
 */
export async function updateJourneyStage(
  stageId: string,
  data: {
    name?: string;
    description?: string;
    order?: number;
    expectedDuration?: number;
    conversionGoal?: number;
    isEntryPoint?: boolean;
    isExitPoint?: boolean;
  }
): Promise<JourneyStageData> {
  try {
    // Validate stage exists
    await validateJourneyStage(stageId);
    
    // Update stage
    const stage = await prisma.journeyStage.update({
      where: { id: stageId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    
    logger.info(`Updated journey stage ${stageId}`);
    
    return {
      id: stage.id,
      name: stage.name,
      description: stage.description,
      order: stage.order,
      expectedDuration: stage.expectedDuration,
      conversionGoal: stage.conversionGoal,
      isEntryPoint: stage.isEntryPoint,
      isExitPoint: stage.isExitPoint
    };
  } catch (error) {
    logger.error(`Error updating journey stage ${stageId}: ${error.message}`, error);
    throw new Error(`Failed to update journey stage: ${error.message}`);
  }
}

/**
 * Delete a journey stage (only if no contacts are in this stage)
 */
export async function deleteJourneyStage(stageId: string): Promise<boolean> {
  try {
    // Validate stage exists
    await validateJourneyStage(stageId);
    
    // Check if any contacts are in this stage
    const contactsInStage = await prisma.contactJourneyStage.count({
      where: {
        stageId,
        exitedAt: null
      }
    });
    
    if (contactsInStage > 0) {
      throw new Error(`Cannot delete stage ${stageId}: ${contactsInStage} contacts are still in this stage`);
    }
    
    // Delete stage - cascades to transitions
    await prisma.journeyStage.delete({
      where: { id: stageId }
    });
    
    logger.info(`Journey stage ${stageId} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting journey stage ${stageId}: ${error.message}`, error);
    throw new Error(`Failed to delete journey stage: ${error.message}`);
  }
}

/**
 * Create a journey transition between stages
 */
export async function createJourneyTransition(
  data: JourneyTransitionData
): Promise<JourneyTransitionData> {
  try {
    // Validate stages exist
    await validateJourneyStage(data.fromStageId);
    await validateJourneyStage(data.toStageId);
    
    // Check that stages are part of the same journey
    const fromStage = await prisma.journeyStage.findUnique({
      where: { id: data.fromStageId },
      select: { journeyId: true }
    });
    
    const toStage = await prisma.journeyStage.findUnique({
      where: { id: data.toStageId },
      select: { journeyId: true }
    });
    
    if (fromStage.journeyId !== toStage.journeyId) {
      throw new Error('Cannot create transition between stages from different journeys');
    }
    
    // Create transition
    const transition = await prisma.journeyTransition.create({
      data: {
        id: randomUUID(),
        fromStageId: data.fromStageId,
        toStageId: data.toStageId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerDetails: data.triggerDetails ? JSON.stringify(data.triggerDetails) : null,
        conditions: data.conditions ? JSON.stringify(data.conditions) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    logger.info(`Created journey transition from stage ${data.fromStageId} to ${data.toStageId}`);
    
    return {
      id: transition.id,
      name: transition.name,
      description: transition.description,
      fromStageId: transition.fromStageId,
      toStageId: transition.toStageId,
      triggerType: transition.triggerType as TransitionTriggerType,
      triggerDetails: transition.triggerDetails ? JSON.parse(transition.triggerDetails) : null,
      conditions: transition.conditions ? JSON.parse(transition.conditions) : null
    };
  } catch (error) {
    logger.error(`Error creating journey transition: ${error.message}`, error);
    throw new Error(`Failed to create journey transition: ${error.message}`);
  }
}

/**
 * Update a journey transition
 */
export async function updateJourneyTransition(
  transitionId: string,
  data: {
    name?: string;
    description?: string;
    triggerType?: TransitionTriggerType;
    triggerDetails?: any;
    conditions?: any;
  }
): Promise<JourneyTransitionData> {
  try {
    // Find transition
    const existingTransition = await prisma.journeyTransition.findUnique({
      where: { id: transitionId }
    });
    
    if (!existingTransition) {
      throw new Error(`Transition not found: ${transitionId}`);
    }
    
    // Update fields
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };
    
    // Convert objects to JSON strings
    if (data.triggerDetails) {
      updateData.triggerDetails = JSON.stringify(data.triggerDetails);
    }
    
    if (data.conditions) {
      updateData.conditions = JSON.stringify(data.conditions);
    }
    
    // Update transition
    const transition = await prisma.journeyTransition.update({
      where: { id: transitionId },
      data: updateData
    });
    
    logger.info(`Updated journey transition ${transitionId}`);
    
    return {
      id: transition.id,
      name: transition.name,
      description: transition.description,
      fromStageId: transition.fromStageId,
      toStageId: transition.toStageId,
      triggerType: transition.triggerType as TransitionTriggerType,
      triggerDetails: transition.triggerDetails ? JSON.parse(transition.triggerDetails) : null,
      conditions: transition.conditions ? JSON.parse(transition.conditions) : null
    };
  } catch (error) {
    logger.error(`Error updating journey transition ${transitionId}: ${error.message}`, error);
    throw new Error(`Failed to update journey transition: ${error.message}`);
  }
}

/**
 * Delete a journey transition
 */
export async function deleteJourneyTransition(transitionId: string): Promise<boolean> {
  try {
    // Check if transition exists
    const transition = await prisma.journeyTransition.findUnique({
      where: { id: transitionId }
    });
    
    if (!transition) {
      throw new Error(`Transition not found: ${transitionId}`);
    }
    
    // Delete transition
    await prisma.journeyTransition.delete({
      where: { id: transitionId }
    });
    
    logger.info(`Journey transition ${transitionId} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting journey transition ${transitionId}: ${error.message}`, error);
    throw new Error(`Failed to delete journey transition: ${error.message}`);
  }
} 