/**
 * Customer Journey Mapping Service
 * 
 * Provides functionality to create, manage, and analyze customer journeys
 * across multiple channels and touchpoints.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// Type definitions for journey mapping
export enum JourneyStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  PAUSED = 'PAUSED'
}

export enum TransitionTriggerType {
  AUTOMATIC = 'AUTOMATIC',
  EVENT = 'EVENT',
  CONVERSION = 'CONVERSION',
  CONDITION = 'CONDITION',
  MANUAL = 'MANUAL'
}

export enum JourneyMetricType {
  CONVERSION_RATE = 'CONVERSION_RATE',
  CONTACTS_COUNT = 'CONTACTS_COUNT',
  DURATION = 'DURATION',
  REVENUE = 'REVENUE',
  CUSTOM = 'CUSTOM'
}

export enum MetricAggregationType {
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  COUNT = 'COUNT',
  MIN = 'MIN',
  MAX = 'MAX'
}

// Journey interface
export interface JourneyData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  stages: JourneyStageData[];
  metrics?: JourneyMetricData[];
}

// Journey stage interface
export interface JourneyStageData {
  id: string;
  name: string;
  description?: string;
  order: number;
  expectedDuration?: number;
  conversionGoal?: number;
  isEntryPoint?: boolean;
  isExitPoint?: boolean;
  transitions?: JourneyTransitionData[];
  contactCount?: number;
}

// Journey transition interface
export interface JourneyTransitionData {
  id?: string;
  name?: string;
  description?: string;
  fromStageId: string;
  toStageId: string;
  triggerType: TransitionTriggerType;
  triggerDetails?: any;
  conditions?: any;
}

// Journey metric interface
export interface JourneyMetricData {
  id?: string;
  name: string;
  description?: string;
  metricType: JourneyMetricType;
  targetValue?: number;
  aggregationType: MetricAggregationType;
  formula?: string;
  isSuccess?: boolean;
  stageMetrics?: JourneyStageMetricData[];
}

// Stage metric interface
export interface JourneyStageMetricData {
  id?: string;
  stageId: string;
  metricId?: string;
  targetValue?: number;
  actualValue?: number;
}

// Journey analytics interface
export interface JourneyAnalyticsData {
  journeyId: string;
  date: Date;
  totalContacts: number;
  activeContacts: number;
  completedContacts: number;
  droppedContacts: number;
  conversionRate: number;
  averageDuration: number;
  stageData: {
    [stageId: string]: {
      contacts: number;
      enteredCount: number;
      exitedCount: number;
      conversionRate: number;
      avgDuration: number;
    }
  };
}

// Contact's journey state
export interface ContactJourneyData {
  id: string;
  journeyId: string;
  contactId: string;
  status: JourneyStatus;
  startedAt: Date;
  completedAt?: Date;
  currentStageId?: string;
  stages?: ContactJourneyStageData[];
  transitions?: ContactJourneyTransitionData[];
}

// Contact's journey stage data
export interface ContactJourneyStageData {
  id?: string;
  contactJourneyId?: string;
  stageId: string;
  enteredAt: Date;
  exitedAt?: Date;
  durationSeconds?: number;
}

// Contact's journey transition data
export interface ContactJourneyTransitionData {
  id?: string;
  contactJourneyId?: string;
  transitionId: string;
  timestamp: Date;
  fromStageId: string;
  toStageId: string;
  triggerSource?: string;
}

// Journey stage bottleneck data
export interface JourneyBottleneckData {
  stageId: string;
  stageName: string;
  conversionRate: number;
  targetConversionRate?: number;
  averageDuration: number;
  expectedDuration?: number;
  dropOffRate: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

/**
 * Common helper function to validate that a journey exists
 */
export async function validateJourney(journeyId: string): Promise<void> {
  const journey = await (prisma as any).journey.findUnique({
    where: { id: journeyId }
  });
  
  if (!journey) {
    throw new Error(`Journey not found: ${journeyId}`);
  }
}

/**
 * Helper function to validate that a journey stage exists
 */
export async function validateJourneyStage(stageId: string): Promise<void> {
  const stage = await (prisma as any).journeyStage.findUnique({
    where: { id: stageId }
  });
  
  if (!stage) {
    throw new Error(`Journey stage not found: ${stageId}`);
  }
}

/**
 * Helper function to validate that a contact exists
 */
export async function validateContact(contactId: string): Promise<void> {
  const contact = await (prisma as any).contact.findUnique({
    where: { id: contactId }
  });
  
  if (!contact) {
    throw new Error(`Contact not found: ${contactId}`);
  }
}

/**
 * Helper function to validate transition between stages
 * Ensures that the transition is defined in the journey
 */
export async function validateTransition(fromStageId: string, toStageId: string): Promise<string> {
  const transition = await (prisma as any).journeyTransition.findFirst({
    where: {
      fromStageId,
      toStageId
    }
  });
  
  if (!transition) {
    throw new Error(`Invalid transition: No defined transition from stage ${fromStageId} to ${toStageId}`);
  }
  
  return transition.id;
}

/**
 * Helper function to validate metric
 */
export async function validateJourneyMetric(metricId: string): Promise<void> {
  const metric = await (prisma as any).journeyMetric.findUnique({
    where: { id: metricId }
  });
  
  if (!metric) {
    throw new Error(`Journey metric not found: ${metricId}`);
  }
}

// Export submodules after defining the interfaces they'll use
export * from './journey';
export * from './journey-analytics';
export * from './journey-metrics';
export * from './contact-journey'; 