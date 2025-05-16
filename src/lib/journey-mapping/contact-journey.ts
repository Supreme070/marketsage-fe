/**
 * Contact Journey Service
 * 
 * Provides functionality to manage and track individual contacts through
 * their unique journey paths.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { 
  ContactJourneyData, 
  ContactJourneyStageData,
  ContactJourneyTransitionData,
  JourneyStatus,
  validateJourney,
  validateJourneyStage,
  validateContact,
  validateTransition
} from './index';

/**
 * Add a contact to a journey
 */
export async function addContactToJourney(
  journeyId: string,
  contactId: string
): Promise<ContactJourneyData> {
  try {
    // Validate inputs
    await validateJourney(journeyId);
    await validateContact(contactId);
    
    // Check if contact is already in this journey
    const existingJourney = await prisma.contactJourney.findFirst({
      where: {
        journeyId,
        contactId,
        status: {
          in: ['ACTIVE', 'PAUSED']
        }
      }
    });
    
    if (existingJourney) {
      logger.info(`Contact ${contactId} is already in journey ${journeyId}`);
      
      // Return the existing journey
      return {
        id: existingJourney.id,
        journeyId: existingJourney.journeyId,
        contactId: existingJourney.contactId,
        status: existingJourney.status as JourneyStatus,
        startedAt: existingJourney.startedAt,
        completedAt: existingJourney.completedAt,
        currentStageId: existingJourney.currentStageId
      };
    }
    
    // Find the entry point stage
    const entryStage = await prisma.journeyStage.findFirst({
      where: {
        journeyId,
        isEntryPoint: true
      }
    });
    
    if (!entryStage) {
      throw new Error(`Journey ${journeyId} has no entry point stage`);
    }
    
    // Create contact journey record
    const contactJourney = await prisma.contactJourney.create({
      data: {
        id: randomUUID(),
        journeyId,
        contactId,
        status: 'ACTIVE',
        startedAt: new Date(),
        currentStageId: entryStage.id
      }
    });
    
    // Add contact to the entry stage
    await prisma.contactJourneyStage.create({
      data: {
        id: randomUUID(),
        contactJourneyId: contactJourney.id,
        stageId: entryStage.id,
        enteredAt: new Date()
      }
    });
    
    logger.info(`Added contact ${contactId} to journey ${journeyId}`);
    
    return {
      id: contactJourney.id,
      journeyId: contactJourney.journeyId,
      contactId: contactJourney.contactId,
      status: contactJourney.status as JourneyStatus,
      startedAt: contactJourney.startedAt,
      currentStageId: contactJourney.currentStageId
    };
  } catch (error) {
    logger.error(`Error adding contact to journey: ${error.message}`, error);
    throw new Error(`Failed to add contact to journey: ${error.message}`);
  }
}

/**
 * Move a contact to the next stage in the journey
 */
export async function moveContactToStage(
  contactJourneyId: string,
  toStageId: string,
  options?: {
    triggerSource?: string;
  }
): Promise<ContactJourneyStageData> {
  try {
    // Get the contact journey record
    const contactJourney = await prisma.contactJourney.findUnique({
      where: { id: contactJourneyId },
      include: {
        stages: {
          orderBy: {
            enteredAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!contactJourney) {
      throw new Error(`Contact journey not found: ${contactJourneyId}`);
    }
    
    if (contactJourney.status !== 'ACTIVE') {
      throw new Error(`Contact journey is not active: ${contactJourneyId}`);
    }
    
    // Validate target stage
    await validateJourneyStage(toStageId);
    
    // Get current stage
    const currentStageId = contactJourney.currentStageId;
    if (!currentStageId) {
      throw new Error(`Contact journey has no current stage: ${contactJourneyId}`);
    }
    
    // Validate transition is allowed and get transition ID
    const transitionId = await validateTransition(currentStageId, toStageId);
    
    // Get the current stage record
    const currentStageRecord = contactJourney.stages[0];
    if (!currentStageRecord) {
      throw new Error(`No stage record found for contact journey: ${contactJourneyId}`);
    }
    
    // Mark exit from current stage
    await prisma.contactJourneyStage.update({
      where: { id: currentStageRecord.id },
      data: {
        exitedAt: new Date(),
        durationSeconds: Math.floor(
          (Date.now() - currentStageRecord.enteredAt.getTime()) / 1000
        )
      }
    });
    
    // Create new stage record
    const newStage = await prisma.contactJourneyStage.create({
      data: {
        id: randomUUID(),
        contactJourneyId,
        stageId: toStageId,
        enteredAt: new Date()
      }
    });
    
    // Record the transition
    await prisma.contactJourneyTransition.create({
      data: {
        id: randomUUID(),
        contactJourneyId,
        transitionId,
        timestamp: new Date(),
        fromStageId: currentStageId,
        toStageId,
        triggerSource: options?.triggerSource
      }
    });
    
    // Update the current stage in the contact journey
    await prisma.contactJourney.update({
      where: { id: contactJourneyId },
      data: {
        currentStageId: toStageId
      }
    });
    
    // Check if this is an exit stage
    const toStage = await prisma.journeyStage.findUnique({
      where: { id: toStageId }
    });
    
    // If this is an exit stage, mark the journey as completed
    if (toStage.isExitPoint) {
      await prisma.contactJourney.update({
        where: { id: contactJourneyId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      logger.info(`Contact journey ${contactJourneyId} completed`);
    }
    
    logger.info(`Moved contact in journey ${contactJourneyId} to stage ${toStageId}`);
    
    return {
      id: newStage.id,
      contactJourneyId,
      stageId: toStageId,
      enteredAt: newStage.enteredAt
    };
  } catch (error) {
    logger.error(`Error moving contact to stage: ${error.message}`, error);
    throw new Error(`Failed to move contact to stage: ${error.message}`);
  }
}

/**
 * Get the current journey state for a contact
 */
export async function getContactJourney(
  contactJourneyId: string
): Promise<ContactJourneyData> {
  try {
    const contactJourney = await prisma.contactJourney.findUnique({
      where: { id: contactJourneyId },
      include: {
        stages: {
          include: {
            stage: true
          },
          orderBy: {
            enteredAt: 'asc'
          }
        },
        transitions: {
          include: {
            transition: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });
    
    if (!contactJourney) {
      throw new Error(`Contact journey not found: ${contactJourneyId}`);
    }
    
    // Format stages data
    const stages: ContactJourneyStageData[] = contactJourney.stages.map(stage => ({
      id: stage.id,
      contactJourneyId: stage.contactJourneyId,
      stageId: stage.stageId,
      enteredAt: stage.enteredAt,
      exitedAt: stage.exitedAt,
      durationSeconds: stage.durationSeconds
    }));
    
    // Format transitions data
    const transitions: ContactJourneyTransitionData[] = contactJourney.transitions.map(trans => ({
      id: trans.id,
      contactJourneyId: trans.contactJourneyId,
      transitionId: trans.transitionId,
      timestamp: trans.timestamp,
      fromStageId: trans.fromStageId,
      toStageId: trans.toStageId,
      triggerSource: trans.triggerSource
    }));
    
    return {
      id: contactJourney.id,
      journeyId: contactJourney.journeyId,
      contactId: contactJourney.contactId,
      status: contactJourney.status as JourneyStatus,
      startedAt: contactJourney.startedAt,
      completedAt: contactJourney.completedAt,
      currentStageId: contactJourney.currentStageId,
      stages,
      transitions
    };
  } catch (error) {
    logger.error(`Error getting contact journey: ${error.message}`, error);
    throw new Error(`Failed to get contact journey: ${error.message}`);
  }
}

/**
 * Get all journeys for a contact
 */
export async function getContactJourneys(
  contactId: string
): Promise<ContactJourneyData[]> {
  try {
    await validateContact(contactId);
    
    const contactJourneys = await prisma.contactJourney.findMany({
      where: { contactId },
      include: {
        journey: true,
        stages: {
          include: {
            stage: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    
    return contactJourneys.map(cj => ({
      id: cj.id,
      journeyId: cj.journeyId,
      contactId: cj.contactId,
      status: cj.status as JourneyStatus,
      startedAt: cj.startedAt,
      completedAt: cj.completedAt,
      currentStageId: cj.currentStageId
    }));
  } catch (error) {
    logger.error(`Error getting contact journeys: ${error.message}`, error);
    throw new Error(`Failed to get contact journeys: ${error.message}`);
  }
}

/**
 * Get all contacts in a specific stage of a journey
 */
export async function getContactsInStage(
  stageId: string
): Promise<{ contactId: string; contactJourneyId: string }[]> {
  try {
    await validateJourneyStage(stageId);
    
    const contactStages = await prisma.contactJourneyStage.findMany({
      where: {
        stageId,
        exitedAt: null,
        contactJourney: {
          status: 'ACTIVE'
        }
      },
      select: {
        contactJourney: {
          select: {
            id: true,
            contactId: true
          }
        }
      }
    });
    
    return contactStages.map(cs => ({
      contactId: cs.contactJourney.contactId,
      contactJourneyId: cs.contactJourney.id
    }));
  } catch (error) {
    logger.error(`Error getting contacts in stage: ${error.message}`, error);
    throw new Error(`Failed to get contacts in stage: ${error.message}`);
  }
}

/**
 * Pause a contact's journey
 */
export async function pauseContactJourney(
  contactJourneyId: string
): Promise<ContactJourneyData> {
  try {
    const contactJourney = await prisma.contactJourney.findUnique({
      where: { id: contactJourneyId }
    });
    
    if (!contactJourney) {
      throw new Error(`Contact journey not found: ${contactJourneyId}`);
    }
    
    if (contactJourney.status !== 'ACTIVE') {
      throw new Error(`Contact journey is not active: ${contactJourneyId}`);
    }
    
    // Update status
    const updated = await prisma.contactJourney.update({
      where: { id: contactJourneyId },
      data: {
        status: 'PAUSED'
      }
    });
    
    logger.info(`Paused contact journey ${contactJourneyId}`);
    
    return {
      id: updated.id,
      journeyId: updated.journeyId,
      contactId: updated.contactId,
      status: updated.status as JourneyStatus,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      currentStageId: updated.currentStageId
    };
  } catch (error) {
    logger.error(`Error pausing contact journey: ${error.message}`, error);
    throw new Error(`Failed to pause contact journey: ${error.message}`);
  }
}

/**
 * Resume a paused contact journey
 */
export async function resumeContactJourney(
  contactJourneyId: string
): Promise<ContactJourneyData> {
  try {
    const contactJourney = await prisma.contactJourney.findUnique({
      where: { id: contactJourneyId }
    });
    
    if (!contactJourney) {
      throw new Error(`Contact journey not found: ${contactJourneyId}`);
    }
    
    if (contactJourney.status !== 'PAUSED') {
      throw new Error(`Contact journey is not paused: ${contactJourneyId}`);
    }
    
    // Update status
    const updated = await prisma.contactJourney.update({
      where: { id: contactJourneyId },
      data: {
        status: 'ACTIVE'
      }
    });
    
    logger.info(`Resumed contact journey ${contactJourneyId}`);
    
    return {
      id: updated.id,
      journeyId: updated.journeyId,
      contactId: updated.contactId,
      status: updated.status as JourneyStatus,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      currentStageId: updated.currentStageId
    };
  } catch (error) {
    logger.error(`Error resuming contact journey: ${error.message}`, error);
    throw new Error(`Failed to resume contact journey: ${error.message}`);
  }
}

/**
 * Drop a contact from a journey
 */
export async function dropContactFromJourney(
  contactJourneyId: string,
  reason?: string
): Promise<void> {
  try {
    const contactJourney = await prisma.contactJourney.findUnique({
      where: { id: contactJourneyId }
    });
    
    if (!contactJourney) {
      throw new Error(`Contact journey not found: ${contactJourneyId}`);
    }
    
    if (['COMPLETED', 'DROPPED'].includes(contactJourney.status)) {
      throw new Error(`Cannot drop a completed or already dropped journey: ${contactJourneyId}`);
    }
    
    // Update status
    await prisma.contactJourney.update({
      where: { id: contactJourneyId },
      data: {
        status: 'DROPPED'
      }
    });
    
    logger.info(`Dropped contact from journey ${contactJourneyId}`, { reason });
  } catch (error) {
    logger.error(`Error dropping contact from journey: ${error.message}`, error);
    throw new Error(`Failed to drop contact from journey: ${error.message}`);
  }
} 