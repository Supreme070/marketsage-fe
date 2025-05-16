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
  TransitionTriggerType
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
    
    // Create journey in database using raw query since model access isn't working
    const journey = await prisma.$queryRaw`
      INSERT INTO "Journey" ("id", "name", "description", "isActive", "createdById", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${data.name}, ${data.description}, true, ${data.createdById}, now(), now())
      RETURNING *
    `;
    
    // Extract journey from result (array with one element)
    const journeyRecord = Array.isArray(journey) ? journey[0] : journey;
    
    // Create stages if provided
    let stages: JourneyStageData[] = [];
    
    if (data.stages && data.stages.length > 0) {
      stages = await Promise.all(
        data.stages.map(async (stageData, index) => {
          return await createJourneyStage({
            journeyId: journeyRecord.id,
            ...stageData,
            order: stageData.order ?? index
          });
        })
      );
    }
    
    // Return complete journey data
    return {
      id: journeyRecord.id,
      name: journeyRecord.name,
      description: journeyRecord.description,
      isActive: journeyRecord.isActive,
      createdAt: journeyRecord.createdAt,
      createdById: journeyRecord.createdById,
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
    
    // Get journey with stages and transitions using raw query
    const journey = await prisma.$queryRaw`
      SELECT j.*, 
        (SELECT json_agg(s.*) FROM "JourneyStage" s WHERE s."journeyId" = j.id ORDER BY s."order" ASC) as stages,
        (SELECT json_agg(m.*) FROM "JourneyMetric" m WHERE m."journeyId" = j.id) as metrics
      FROM "Journey" j
      WHERE j.id = ${journeyId}
      LIMIT 1
    `;
    
    const journeyRecord = Array.isArray(journey) ? journey[0] : journey;
    
    // Get transitions for each stage
    if (journeyRecord.stages) {
      for (const stage of journeyRecord.stages) {
        const transitions = await prisma.$queryRaw`
          SELECT t.*, 
            json_build_object('id', ts.id, 'name', ts.name) as "toStage"
          FROM "JourneyTransition" t
          JOIN "JourneyStage" ts ON t."toStageId" = ts.id
          WHERE t."fromStageId" = ${stage.id}
        `;
        stage.transitions = transitions;
        
        const incomingTransitions = await prisma.$queryRaw`
          SELECT t.*, 
            json_build_object('id', fs.id, 'name', fs.name) as "fromStage"
          FROM "JourneyTransition" t
          JOIN "JourneyStage" fs ON t."fromStageId" = fs.id
          WHERE t."toStageId" = ${stage.id}
        `;
        stage.incomingTransitions = incomingTransitions;
      }
    }
    
    // Format data for response
    return {
      id: journeyRecord.id,
      name: journeyRecord.name,
      description: journeyRecord.description,
      isActive: journeyRecord.isActive,
      createdAt: journeyRecord.createdAt,
      createdById: journeyRecord.createdById,
      stages: (journeyRecord.stages || []).map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        expectedDuration: stage.expectedDuration,
        conversionGoal: stage.conversionGoal,
        isEntryPoint: stage.isEntryPoint,
        isExitPoint: stage.isExitPoint,
        transitions: (stage.transitions || []).map((transition: any) => ({
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
      metrics: (journeyRecord.metrics || []).map((metric: any) => ({
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
    // Build where clause for raw query
    let whereClause = '';
    const whereParams: any[] = [];
    
    if (options?.isActive !== undefined) {
      whereClause += ' AND "isActive" = $1';
      whereParams.push(options.isActive);
    }
    
    if (options?.createdById) {
      whereClause += ` AND "createdById" = $${whereParams.length + 1}`;
      whereParams.push(options.createdById);
    }
    
    // Get journeys
    const query = `
      SELECT j.*,
        (SELECT json_agg(s.*) FROM "JourneyStage" s 
         WHERE s."journeyId" = j.id 
         ORDER BY s."order" ASC) as stages,
        (SELECT COUNT(*) FROM "ContactJourney" cj WHERE cj."journeyId" = j.id) as contact_count
      FROM "Journey" j
      WHERE 1=1 ${whereClause}
      ORDER BY j."createdAt" DESC
      LIMIT ${options?.limit || 100}
    `;
    
    const journeys = await prisma.$queryRawUnsafe(query, ...whereParams);
    
    // Format data for response
    return (journeys as any[]).map((journey: any) => ({
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: (journey.stages || []).map((stage: any) => ({
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
    
    // Build SET clause for update
    const setClauses = [];
    const setValues = [];
    
    if (data.name !== undefined) {
      setClauses.push(`"name" = $${setValues.length + 1}`);
      setValues.push(data.name);
    }
    
    if (data.description !== undefined) {
      setClauses.push(`"description" = $${setValues.length + 1}`);
      setValues.push(data.description);
    }
    
    if (data.isActive !== undefined) {
      setClauses.push(`"isActive" = $${setValues.length + 1}`);
      setValues.push(data.isActive);
    }
    
    // Add updated timestamp
    setClauses.push(`"updatedAt" = now()`);
    
    // Execute update query
    const query = `
      UPDATE "Journey" 
      SET ${setClauses.join(', ')}
      WHERE "id" = $${setValues.length + 1}
      RETURNING *
    `;
    
    const result = await prisma.$queryRawUnsafe(query, ...setValues, journeyId);
    const journey = Array.isArray(result) ? result[0] : result;
    
    // Get stages
    const stages = await prisma.$queryRaw`
      SELECT * FROM "JourneyStage"
      WHERE "journeyId" = ${journeyId}
      ORDER BY "order" ASC
    `;
    
    return {
      id: journey.id,
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      createdAt: journey.createdAt,
      createdById: journey.createdById,
      stages: Array.isArray(stages) ? stages.map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        expectedDuration: stage.expectedDuration,
        conversionGoal: stage.conversionGoal,
        isEntryPoint: stage.isEntryPoint,
        isExitPoint: stage.isExitPoint
      })) : []
    };
  } catch (error: any) {
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
    await prisma.$queryRaw`DELETE FROM "Journey" WHERE id = ${journeyId}`;
    
    logger.info(`Journey ${journeyId} deleted successfully`);
    
    return true;
  } catch (error: any) {
    logger.error(`Error deleting journey ${journeyId}: ${error.message}`, error);
    throw new Error(`Failed to delete journey: ${error.message}`);
  }
}

/**
 * Create a new journey stage
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
    
    // Create stage using raw query
    const stageId = randomUUID();
    const result = await prisma.$queryRaw`
      INSERT INTO "JourneyStage" (
        "id", "journeyId", "name", "description", "order", 
        "expectedDuration", "conversionGoal", "isEntryPoint", "isExitPoint", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${stageId}, ${data.journeyId}, ${data.name}, ${data.description}, ${data.order},
        ${data.expectedDuration}, ${data.conversionGoal}, ${data.isEntryPoint ?? false}, ${data.isExitPoint ?? false},
        now(), now()
      ) RETURNING *
    `;
    
    const stage = Array.isArray(result) ? result[0] : result;
    
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
  } catch (error: any) {
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
    
    // Build SET clause for update
    const setClauses = [];
    const setValues = [];
    
    if (data.name !== undefined) {
      setClauses.push(`"name" = $${setValues.length + 1}`);
      setValues.push(data.name);
    }
    
    if (data.description !== undefined) {
      setClauses.push(`"description" = $${setValues.length + 1}`);
      setValues.push(data.description);
    }
    
    if (data.order !== undefined) {
      setClauses.push(`"order" = $${setValues.length + 1}`);
      setValues.push(data.order);
    }
    
    if (data.expectedDuration !== undefined) {
      setClauses.push(`"expectedDuration" = $${setValues.length + 1}`);
      setValues.push(data.expectedDuration);
    }
    
    if (data.conversionGoal !== undefined) {
      setClauses.push(`"conversionGoal" = $${setValues.length + 1}`);
      setValues.push(data.conversionGoal);
    }
    
    if (data.isEntryPoint !== undefined) {
      setClauses.push(`"isEntryPoint" = $${setValues.length + 1}`);
      setValues.push(data.isEntryPoint);
    }
    
    if (data.isExitPoint !== undefined) {
      setClauses.push(`"isExitPoint" = $${setValues.length + 1}`);
      setValues.push(data.isExitPoint);
    }
    
    // Add updated timestamp
    setClauses.push(`"updatedAt" = now()`);
    
    // Execute update query
    const query = `
      UPDATE "JourneyStage" 
      SET ${setClauses.join(', ')}
      WHERE "id" = $${setValues.length + 1}
      RETURNING *
    `;
    
    const result = await prisma.$queryRawUnsafe(query, ...setValues, stageId);
    const stage = Array.isArray(result) ? result[0] : result;
    
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
  } catch (error: any) {
    logger.error(`Error updating journey stage ${stageId}: ${error.message}`, error);
    throw new Error(`Failed to update journey stage: ${error.message}`);
  }
}

/**
 * Delete a journey stage
 */
export async function deleteJourneyStage(stageId: string): Promise<boolean> {
  try {
    // Validate stage exists
    await validateJourneyStage(stageId);
    
    // Check if there are any contacts in this stage
    const contactsResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "ContactJourneyStage"
      WHERE "stageId" = ${stageId}
    `;
    
    // Type-cast the contactsResult and handle both array and object return types
    const contactsInStage = Array.isArray(contactsResult) 
      ? Number((contactsResult[0] as any).count) 
      : Number((contactsResult as any).count);
    
    if (contactsInStage > 0) {
      throw new Error(`Cannot delete stage with ${contactsInStage} contacts assigned to it`);
    }
    
    // Delete stage
    await prisma.$queryRaw`DELETE FROM "JourneyStage" WHERE id = ${stageId}`;
    
    logger.info(`Journey stage ${stageId} deleted successfully`);
    
    return true;
  } catch (error: any) {
    logger.error(`Error deleting journey stage ${stageId}: ${error.message}`, error);
    throw new Error(`Failed to delete journey stage: ${error.message}`);
  }
}

/**
 * Create a transition between journey stages
 */
export async function createJourneyTransition(
  data: JourneyTransitionData
): Promise<JourneyTransitionData> {
  try {
    // Validate from and to stages exist
    await validateJourneyStage(data.fromStageId);
    await validateJourneyStage(data.toStageId);
    
    // Validate stages are from the same journey
    const fromStageResult = await prisma.$queryRaw`
      SELECT "journeyId" FROM "JourneyStage" WHERE id = ${data.fromStageId}
    `;
    
    const toStageResult = await prisma.$queryRaw`
      SELECT "journeyId" FROM "JourneyStage" WHERE id = ${data.toStageId}
    `;
    
    const fromStage = Array.isArray(fromStageResult) ? fromStageResult[0] : fromStageResult;
    const toStage = Array.isArray(toStageResult) ? toStageResult[0] : toStageResult;
    
    if (fromStage.journeyId !== toStage.journeyId) {
      throw new Error("Cannot create transition between stages from different journeys");
    }
    
    // Create transition
    const transitionId = randomUUID();
    const triggerDetails = data.triggerDetails ? JSON.stringify(data.triggerDetails) : null;
    const conditions = data.conditions ? JSON.stringify(data.conditions) : null;
    
    const result = await prisma.$queryRaw`
      INSERT INTO "JourneyTransition" (
        "id", "fromStageId", "toStageId", "name", "description",
        "triggerType", "triggerDetails", "conditions", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${transitionId}, ${data.fromStageId}, ${data.toStageId}, ${data.name}, ${data.description},
        ${data.triggerType}, ${triggerDetails}, ${conditions},
        now(), now()
      ) RETURNING *
    `;
    
    const transition = Array.isArray(result) ? result[0] : result;
    
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
  } catch (error: any) {
    logger.error(`Error creating transition: ${error.message}`, error);
    throw new Error(`Failed to create transition: ${error.message}`);
  }
}

/**
 * Update a transition between stages
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
    // Check if transition exists
    const existingTransitionResult = await prisma.$queryRaw`
      SELECT id FROM "JourneyTransition" WHERE id = ${transitionId}
    `;
    
    const existingTransition = Array.isArray(existingTransitionResult) 
      ? existingTransitionResult.length > 0 
      : !!existingTransitionResult;
    
    if (!existingTransition) {
      throw new Error(`Transition not found: ${transitionId}`);
    }
    
    // Prepare update data
    const setClauses = [];
    const setValues = [];
    
    if (data.name !== undefined) {
      setClauses.push(`"name" = $${setValues.length + 1}`);
      setValues.push(data.name);
    }
    
    if (data.description !== undefined) {
      setClauses.push(`"description" = $${setValues.length + 1}`);
      setValues.push(data.description);
    }
    
    if (data.triggerType !== undefined) {
      setClauses.push(`"triggerType" = $${setValues.length + 1}`);
      setValues.push(data.triggerType);
    }
    
    if (data.triggerDetails !== undefined) {
      setClauses.push(`"triggerDetails" = $${setValues.length + 1}`);
      setValues.push(JSON.stringify(data.triggerDetails));
    }
    
    if (data.conditions !== undefined) {
      setClauses.push(`"conditions" = $${setValues.length + 1}`);
      setValues.push(JSON.stringify(data.conditions));
    }
    
    // Add updated timestamp
    setClauses.push(`"updatedAt" = now()`);
    
    // Execute update query
    const query = `
      UPDATE "JourneyTransition" 
      SET ${setClauses.join(', ')}
      WHERE "id" = $${setValues.length + 1}
      RETURNING *
    `;
    
    const result = await prisma.$queryRawUnsafe(query, ...setValues, transitionId);
    const transition = Array.isArray(result) ? result[0] : result;
    
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
  } catch (error: any) {
    logger.error(`Error updating transition ${transitionId}: ${error.message}`, error);
    throw new Error(`Failed to update transition: ${error.message}`);
  }
}

/**
 * Delete a transition
 */
export async function deleteJourneyTransition(transitionId: string): Promise<boolean> {
  try {
    // Check if transition exists
    const transitionResult = await prisma.$queryRaw`
      SELECT id FROM "JourneyTransition" WHERE id = ${transitionId}
    `;
    
    const transition = Array.isArray(transitionResult) 
      ? transitionResult.length > 0 
      : !!transitionResult;
    
    if (!transition) {
      throw new Error(`Transition not found: ${transitionId}`);
    }
    
    // Delete transition
    await prisma.$queryRaw`DELETE FROM "JourneyTransition" WHERE id = ${transitionId}`;
    
    logger.info(`Transition ${transitionId} deleted successfully`);
    
    return true;
  } catch (error: any) {
    logger.error(`Error deleting transition ${transitionId}: ${error.message}`, error);
    throw new Error(`Failed to delete transition: ${error.message}`);
  }
}

/**
 * Helper function to validate if a journey exists
 */
async function validateJourney(journeyId: string): Promise<void> {
  const journey = await prisma.$queryRaw`SELECT id FROM "Journey" WHERE id = ${journeyId} LIMIT 1`;
  const journeyExists = Array.isArray(journey) ? journey.length > 0 : !!journey;
  
  if (!journeyExists) {
    throw new Error(`Journey not found: ${journeyId}`);
  }
}

/**
 * Helper function to validate if a stage exists
 */
async function validateJourneyStage(stageId: string): Promise<void> {
  const stage = await prisma.$queryRaw`SELECT id FROM "JourneyStage" WHERE id = ${stageId} LIMIT 1`;
  const stageExists = Array.isArray(stage) ? stage.length > 0 : !!stage;
  
  if (!stageExists) {
    throw new Error(`Journey stage not found: ${stageId}`);
  }
} 