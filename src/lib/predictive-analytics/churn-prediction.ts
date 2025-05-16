/**
 * Churn Prediction Service
 * 
 * Predicts the likelihood of a contact churning (unsubscribing, disengaging) 
 * based on engagement history and profile data.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { PredictionModelType, ChurnRiskLevel, getActiveModel, savePrediction } from './index';

// Types for churn prediction
export interface ChurnPredictionResult {
  contactId: string;
  score: number;
  riskLevel: ChurnRiskLevel;
  topFactors: string[];
  nextActionDate?: Date;
  predictionId: string;
}

export interface ChurnRiskStats {
  total: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  veryHighRisk: number;
  averageScore: number;
}

/**
 * Predict churn risk for a specific contact
 */
export async function predictContactChurn(contactId: string): Promise<ChurnPredictionResult> {
  try {
    logger.info(`Generating churn prediction for contact ${contactId}`);
    
    // Get the active churn prediction model
    const model = await getActiveModel(PredictionModelType.CHURN);
    
    // Get contact data for prediction
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        emailActivities: {
          select: {
            type: true,
            timestamp: true
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 50
        }
      }
    });
    
    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    
    // Extract features for prediction
    const features = extractChurnFeatures(contact);
    
    // Run prediction (in production, this would call a proper ML model)
    const score = await runChurnModel(features, model.id);
    
    // Determine risk level based on score
    const riskLevel = determineRiskLevel(score);
    
    // Generate explanation factors
    const topFactors = generateChurnFactors(features, score);
    
    // Save prediction to database
    const predictionId = await savePrediction(
      model.id,
      'contact',
      contactId,
      PredictionModelType.CHURN,
      score,
      0.85, // Confidence level (hardcoded for demo)
      features,
      topFactors
    );
    
    // Save specific churn prediction details
    const nextActionDate = calculateNextActionDate(score);
    
    const churnPrediction = await prisma.churnPrediction.create({
      data: {
        id: randomUUID(),
        contactId,
        score,
        riskLevel,
        topFactors: JSON.stringify(topFactors),
        nextActionDate,
        createdAt: new Date()
      }
    });
    
    logger.info(`Churn prediction created for contact ${contactId}`, {
      predictionId,
      score,
      riskLevel
    });
    
    return {
      contactId,
      score,
      riskLevel,
      topFactors,
      nextActionDate,
      predictionId
    };
  } catch (error) {
    logger.error(`Error predicting churn for contact ${contactId}`, error);
    throw new Error(`Failed to predict churn: ${(error as Error).message}`);
  }
}

/**
 * Predict churn for all contacts or a segment
 */
export async function batchPredictChurn(segmentId?: string): Promise<ChurnRiskStats> {
  try {
    // Get contacts to process, using segment if provided
    const whereClause = segmentId 
      ? {
          listMembers: {
            some: {
              list: {
                id: segmentId
              }
            }
          }
        } 
      : {};
    
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      select: {
        id: true
      },
      take: 1000 // Limit batch size
    });
    
    logger.info(`Starting batch churn prediction for ${contacts.length} contacts`);
    
    // Process predictions in batches
    const predictions: ChurnPredictionResult[] = [];
    
    for (const contact of contacts) {
      try {
        const prediction = await predictContactChurn(contact.id);
        predictions.push(prediction);
      } catch (error) {
        logger.error(`Error in batch prediction for contact ${contact.id}`, error);
        // Continue with other contacts
      }
    }
    
    // Calculate summary statistics
    const stats: ChurnRiskStats = {
      total: predictions.length,
      lowRisk: predictions.filter(p => p.riskLevel === ChurnRiskLevel.LOW).length,
      mediumRisk: predictions.filter(p => p.riskLevel === ChurnRiskLevel.MEDIUM).length,
      highRisk: predictions.filter(p => p.riskLevel === ChurnRiskLevel.HIGH).length,
      veryHighRisk: predictions.filter(p => p.riskLevel === ChurnRiskLevel.VERY_HIGH).length,
      averageScore: predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length
    };
    
    logger.info(`Completed batch churn prediction`, stats);
    
    return stats;
  } catch (error) {
    logger.error(`Error in batch churn prediction`, error);
    throw new Error(`Failed to run batch churn prediction: ${(error as Error).message}`);
  }
}

/**
 * Get churn predictions for contacts
 */
export async function getChurnPredictions(contactIds?: string[]): Promise<ChurnPredictionResult[]> {
  try {
    const whereClause = contactIds?.length 
      ? { contactId: { in: contactIds } }
      : {};
    
    const predictions = await prisma.churnPrediction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      distinct: ['contactId'],
      take: 100
    });
    
    return predictions.map(p => ({
      contactId: p.contactId,
      score: p.score,
      riskLevel: p.riskLevel as ChurnRiskLevel,
      topFactors: JSON.parse(p.topFactors),
      nextActionDate: p.nextActionDate || undefined,
      predictionId: p.id
    }));
  } catch (error) {
    logger.error(`Error getting churn predictions`, error);
    throw new Error(`Failed to get churn predictions: ${(error as Error).message}`);
  }
}

// Helper functions

/**
 * Extract features for churn prediction from contact data
 */
function extractChurnFeatures(contact: any): Record<string, any> {
  // Calculate days since last activity
  const lastActivity = contact.emailActivities[0]?.timestamp;
  const daysSinceLastActivity = lastActivity 
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : 365; // Default to a year if no activity
  
  // Calculate engagement rate (opens / sent)
  const totalSent = contact.emailActivities.filter(a => a.type === 'SENT').length;
  const totalOpens = contact.emailActivities.filter(a => a.type === 'OPENED').length;
  const openRate = totalSent > 0 ? totalOpens / totalSent : 0;
  
  // Calculate click rate (clicks / opens)
  const totalClicks = contact.emailActivities.filter(a => a.type === 'CLICKED').length;
  const clickRate = totalOpens > 0 ? totalClicks / totalOpens : 0;
  
  // Account age in days
  const accountAge = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysSinceLastActivity,
    openRate,
    clickRate,
    accountAge,
    totalSent,
    totalOpens,
    totalClicks
  };
}

/**
 * Run the churn prediction model
 * (simplified implementation for demo purposes)
 */
async function runChurnModel(features: any, modelId: string): Promise<number> {
  // This is a simplified model for demonstration
  // In production, this would call a real ML model API or run a local model
  
  // High risk factors
  let score = 0.2; // Base score
  
  // Increase score (higher risk) based on features
  if (features.daysSinceLastActivity > 60) {
    score += 0.3;
  } else if (features.daysSinceLastActivity > 30) {
    score += 0.15;
  }
  
  if (features.openRate < 0.1) {
    score += 0.25;
  } else if (features.openRate < 0.2) {
    score += 0.1;
  }
  
  if (features.clickRate < 0.05) {
    score += 0.2;
  }
  
  // Account age factor (newer accounts churn more easily)
  if (features.accountAge < 30) {
    score += 0.1;
  }
  
  // Cap at 0.95
  return Math.min(0.95, score);
}

/**
 * Determine risk level based on churn score
 */
function determineRiskLevel(score: number): ChurnRiskLevel {
  if (score < 0.3) return ChurnRiskLevel.LOW;
  if (score < 0.5) return ChurnRiskLevel.MEDIUM;
  if (score < 0.7) return ChurnRiskLevel.HIGH;
  return ChurnRiskLevel.VERY_HIGH;
}

/**
 * Generate explanation factors for the churn prediction
 */
function generateChurnFactors(features: any, score: number): string[] {
  const factors: string[] = [];
  
  if (features.daysSinceLastActivity > 60) {
    factors.push(`No activity in ${features.daysSinceLastActivity} days`);
  }
  
  if (features.openRate < 0.1) {
    factors.push(`Low email open rate (${(features.openRate * 100).toFixed(1)}%)`);
  }
  
  if (features.clickRate < 0.05) {
    factors.push(`Low click engagement (${(features.clickRate * 100).toFixed(1)}%)`);
  }
  
  if (features.accountAge < 30) {
    factors.push(`New subscriber (${features.accountAge} days)`);
  }
  
  // Add generic factors if none specific
  if (factors.length === 0) {
    factors.push('Declining engagement pattern');
    factors.push('Similar to previously churned contacts');
  }
  
  return factors;
}

/**
 * Calculate recommended next action date based on risk score
 */
function calculateNextActionDate(score: number): Date | undefined {
  const now = new Date();
  
  if (score >= 0.7) {
    // Very high risk - act within 1 day
    return new Date(now.setDate(now.getDate() + 1));
  } else if (score >= 0.5) {
    // High risk - act within 3 days
    return new Date(now.setDate(now.getDate() + 3));
  } else if (score >= 0.3) {
    // Medium risk - act within 7 days
    return new Date(now.setDate(now.getDate() + 7));
  }
  
  // Low risk - no urgent action needed
  return undefined;
} 