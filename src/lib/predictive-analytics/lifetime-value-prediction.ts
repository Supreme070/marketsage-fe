/**
 * Lifetime Value Prediction Service
 * 
 * Predicts the future monetary value of contacts based on their
 * past behavior, engagement, and conversion patterns.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { PredictionModelType, getActiveModel, savePrediction } from './index';

// Types for LTV prediction
export interface LTVPredictionResult {
  contactId: string;
  predictedValue: number;
  confidenceLevel: number;
  timeframe: number; // Months
  segments: string[];
  predictionId: string;
}

export interface ValueSegment {
  minValue: number;
  maxValue: number;
  name: string;
  description: string;
}

/**
 * Predict lifetime value for a specific contact
 */
export async function predictContactLTV(
  contactId: string, 
  timeframeMonths: number = 12
): Promise<LTVPredictionResult> {
  try {
    logger.info(`Generating LTV prediction for contact ${contactId} over ${timeframeMonths} months`);
    
    // Get the active LTV prediction model
    const model = await getActiveModel(PredictionModelType.LTV);
    
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
          }
        }
      }
    });
    
    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    
    // Get conversion data related to the contact
    const conversions = await prisma.conversionTracking.findMany({
      where: { 
        contactId,
        value: { not: null }
      },
      select: {
        value: true,
        occurredAt: true,
        event: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        occurredAt: 'desc'
      }
    });
    
    // Extract features for prediction
    const features = extractLTVFeatures(contact, conversions, timeframeMonths);
    
    // Run prediction model
    const { predictedValue, confidence } = await runLTVModel(features, model.id);
    
    // Determine value segments
    const segments = determineValueSegments(predictedValue);
    
    // Save prediction to database
    const predictionId = await savePrediction(
      model.id,
      'contact',
      contactId,
      PredictionModelType.LTV,
      predictedValue,
      confidence,
      features,
      segments
    );
    
    // Save specific LTV prediction details
    const ltvPrediction = await prisma.lifetimeValuePrediction.create({
      data: {
        id: randomUUID(),
        contactId,
        predictedValue,
        confidenceLevel: confidence,
        timeframe: timeframeMonths,
        segments: JSON.stringify(segments),
        createdAt: new Date()
      }
    });
    
    logger.info(`LTV prediction created for contact ${contactId}`, {
      predictionId,
      predictedValue,
      timeframeMonths
    });
    
    return {
      contactId,
      predictedValue,
      confidenceLevel: confidence,
      timeframe: timeframeMonths,
      segments,
      predictionId
    };
  } catch (error) {
    logger.error(`Error predicting LTV for contact ${contactId}`, error);
    throw new Error(`Failed to predict LTV: ${(error as Error).message}`);
  }
}

/**
 * Batch predict LTV for multiple contacts
 */
export async function batchPredictLTV(
  segmentId?: string, 
  timeframeMonths: number = 12
): Promise<{ count: number; totalValue: number; averageValue: number }> {
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
    
    logger.info(`Starting batch LTV prediction for ${contacts.length} contacts`);
    
    // Process predictions in batches
    const predictions: LTVPredictionResult[] = [];
    
    for (const contact of contacts) {
      try {
        const prediction = await predictContactLTV(contact.id, timeframeMonths);
        predictions.push(prediction);
      } catch (error) {
        logger.error(`Error in batch LTV prediction for contact ${contact.id}`, error);
        // Continue with other contacts
      }
    }
    
    // Calculate summary statistics
    const totalValue = predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    const averageValue = predictions.length > 0 ? totalValue / predictions.length : 0;
    
    const summary = {
      count: predictions.length,
      totalValue,
      averageValue
    };
    
    logger.info(`Completed batch LTV prediction`, summary);
    
    return summary;
  } catch (error) {
    logger.error(`Error in batch LTV prediction`, error);
    throw new Error(`Failed to run batch LTV prediction: ${(error as Error).message}`);
  }
}

/**
 * Get LTV predictions for contacts
 */
export async function getLTVPredictions(contactIds?: string[]): Promise<LTVPredictionResult[]> {
  try {
    const whereClause = contactIds?.length 
      ? { contactId: { in: contactIds } }
      : {};
    
    const predictions = await prisma.lifetimeValuePrediction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      distinct: ['contactId'],
      take: 100
    });
    
    return predictions.map(p => ({
      contactId: p.contactId,
      predictedValue: p.predictedValue,
      confidenceLevel: p.confidenceLevel,
      timeframe: p.timeframe,
      segments: p.segments ? JSON.parse(p.segments) : [],
      predictionId: p.id
    }));
  } catch (error) {
    logger.error(`Error getting LTV predictions`, error);
    throw new Error(`Failed to get LTV predictions: ${(error as Error).message}`);
  }
}

// Helper functions

/**
 * Extract features for LTV prediction
 */
function extractLTVFeatures(contact: any, conversions: any[], timeframeMonths: number): Record<string, any> {
  // Account age in days
  const accountAge = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate engagement metrics
  const totalSent = contact.emailActivities.filter(a => a.type === 'SENT').length;
  const totalOpens = contact.emailActivities.filter(a => a.type === 'OPENED').length;
  const totalClicks = contact.emailActivities.filter(a => a.type === 'CLICKED').length;
  
  const openRate = totalSent > 0 ? totalOpens / totalSent : 0;
  const clickRate = totalOpens > 0 ? totalClicks / totalOpens : 0;
  
  // Calculate historical conversion value
  const pastConversions = conversions || [];
  const conversionValues = pastConversions.map(c => c.value || 0);
  const totalConversionValue = conversionValues.reduce((sum, val) => sum + val, 0);
  const conversionCount = pastConversions.length;
  const averageConversionValue = conversionCount > 0 ? totalConversionValue / conversionCount : 0;
  
  // Calculate recency of conversions (days)
  const lastConversionDate = pastConversions[0]?.occurredAt;
  const daysSinceLastConversion = lastConversionDate
    ? Math.floor((Date.now() - new Date(lastConversionDate).getTime()) / (1000 * 60 * 60 * 24))
    : accountAge;
  
  // Calculate frequency (conversions per month)
  const monthsActive = Math.max(1, accountAge / 30);
  const frequency = conversionCount / monthsActive;
  
  return {
    accountAge,
    openRate,
    clickRate,
    totalConversionValue,
    conversionCount,
    averageConversionValue,
    daysSinceLastConversion,
    frequency,
    timeframeMonths
  };
}

/**
 * Run the LTV prediction model
 * (simplified implementation for demo purposes)
 */
async function runLTVModel(features: any, modelId: string): Promise<{ predictedValue: number, confidence: number }> {
  // This is a simplified model for demonstration
  // In production, this would call a real ML model API or run a local model
  
  const { 
    averageConversionValue, 
    frequency, 
    timeframeMonths,
    openRate,
    clickRate,
    daysSinceLastConversion
  } = features;
  
  // Basic RFM (Recency, Frequency, Monetary) model
  // Predict future conversions based on past frequency and expected value
  
  // Adjust frequency based on engagement metrics
  let adjustedFrequency = frequency;
  
  if (openRate > 0.3) adjustedFrequency *= 1.2;
  if (clickRate > 0.2) adjustedFrequency *= 1.3;
  
  // Adjust based on recency
  if (daysSinceLastConversion < 30) {
    adjustedFrequency *= 1.2; // Recently active customers likely to continue
  } else if (daysSinceLastConversion > 90) {
    adjustedFrequency *= 0.7; // Less active customers likely to convert less
  }
  
  // Predict future number of conversions
  const predictedConversions = adjustedFrequency * (timeframeMonths / 12);
  
  // Predict future value
  let predictedValue = predictedConversions * averageConversionValue;
  
  // If no conversion history, make a baseline prediction
  if (predictedValue === 0) {
    predictedValue = 10 * (openRate > 0.2 ? 2 : 1) * (clickRate > 0.1 ? 1.5 : 1);
  }
  
  // Calculate confidence level
  let confidence = 0.5; // Base confidence
  
  if (features.conversionCount > 10) confidence += 0.3;
  else if (features.conversionCount > 5) confidence += 0.2;
  else if (features.conversionCount > 0) confidence += 0.1;
  
  if (features.accountAge > 180) confidence += 0.1;
  if (daysSinceLastConversion < 30) confidence += 0.1;
  
  // Cap values
  confidence = Math.min(0.95, Math.max(0.4, confidence));
  predictedValue = Math.max(0, predictedValue);
  
  return {
    predictedValue: Number(predictedValue.toFixed(2)),
    confidence
  };
}

/**
 * Determine value segments based on predicted LTV
 */
function determineValueSegments(predictedValue: number): string[] {
  const segments: string[] = [];
  
  // Value-based segments
  if (predictedValue >= 1000) {
    segments.push('high_value');
  } else if (predictedValue >= 500) {
    segments.push('medium_value');
  } else if (predictedValue >= 100) {
    segments.push('low_value');
  } else {
    segments.push('minimal_value');
  }
  
  // Add potential segments
  if (predictedValue >= 2000) {
    segments.push('vip');
  }
  
  if (predictedValue >= 200 && predictedValue < 1000) {
    segments.push('growth_potential');
  }
  
  return segments;
} 