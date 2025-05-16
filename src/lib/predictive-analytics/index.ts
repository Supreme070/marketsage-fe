/**
 * Predictive Analytics Module
 * 
 * Provides machine learning-based predictions for contact churn, lifetime value,
 * campaign performance, and optimal send times.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// Export all prediction services
export * from './churn-prediction';
export * from './lifetime-value-prediction';
export * from './campaign-performance-prediction';
export * from './send-time-prediction';

// Common types for predictive analytics
export enum PredictionModelType {
  CHURN = 'CHURN',
  LTV = 'LTV',
  CAMPAIGN_PERFORMANCE = 'CAMPAIGN_PERFORMANCE',
  SEND_TIME = 'SEND_TIME',
  OPEN_RATE = 'OPEN_RATE',
  CLICK_RATE = 'CLICK_RATE',
  CONVERSION_RATE = 'CONVERSION_RATE'
}

export enum ChurnRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export interface PredictionResult {
  id: string;
  value: number;
  confidence: number;
  explanation?: string[];
  createdAt: Date;
}

export interface ModelFeatures {
  [key: string]: number | string | boolean | null;
}

/**
 * Save a prediction result to the database
 */
export async function savePrediction(
  modelId: string,
  entityType: string,
  entityId: string,
  predictionType: PredictionModelType,
  value: number,
  confidence: number,
  features?: ModelFeatures,
  explanation?: string[]
): Promise<string> {
  try {
    // Create the prediction record
    const prediction = await prisma.prediction.create({
      data: {
        id: randomUUID(),
        modelId,
        entityType,
        entityId,
        predictionType,
        value,
        confidence,
        features: features ? JSON.stringify(features) : null,
        explanation: explanation ? JSON.stringify(explanation) : null,
        createdAt: new Date()
      }
    });

    logger.info(`Saved ${predictionType} prediction for ${entityType}:${entityId}`, {
      predictionId: prediction.id,
      value,
      confidence
    });

    return prediction.id;
  } catch (error) {
    logger.error(`Error saving prediction for ${entityType}:${entityId}`, error);
    throw new Error(`Failed to save prediction: ${(error as Error).message}`);
  }
}

/**
 * Get the active prediction model for a given type
 */
export async function getActiveModel(type: PredictionModelType): Promise<any> {
  try {
    const model = await prisma.predictionModel.findFirst({
      where: {
        type,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!model) {
      throw new Error(`No active model found for type: ${type}`);
    }

    return model;
  } catch (error) {
    logger.error(`Error getting active model for type: ${type}`, error);
    throw new Error(`Failed to get active model: ${(error as Error).message}`);
  }
} 