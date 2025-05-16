/**
 * Send Time Prediction Service
 * 
 * Predicts optimal days and times to send messages to contacts based on
 * their past engagement patterns, enhancing the existing time optimization.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { PredictionModelType, getActiveModel, savePrediction } from './index';

// Types for send time prediction
export interface SendTimePrediction {
  contactId: string;
  channelType: string;
  dayOfWeek: number;
  hourOfDay: number;
  probability: number;
  confidenceLevel: number;
  predictionId: string;
}

export interface DayTimeSlot {
  dayOfWeek: number;
  hourOfDay: number;
  probability: number;
}

export interface TopSendTimePrediction {
  contactId: string;
  channelType: string;
  bestTimes: DayTimeSlot[];
  worstTimes: DayTimeSlot[];
  averageResponseTime: number; // minutes
  predictionId: string;
}

export interface GlobalSendTimeRecommendation {
  dayOfWeek: number;
  hourOfDay: number;
  audiencePercentage: number;
  confidence: number;
}

/**
 * Predict optimal send times for a specific contact
 */
export async function predictContactSendTime(
  contactId: string,
  channelType: string = 'email'
): Promise<TopSendTimePrediction> {
  try {
    logger.info(`Generating send time prediction for contact ${contactId} on ${channelType} channel`);
    
    // Get the active send time prediction model
    const model = await getActiveModel(PredictionModelType.SEND_TIME);
    
    // Get contact's activity history
    let activities: any[] = [];
    
    if (channelType === 'email') {
      activities = await prisma.emailActivity.findMany({
        where: { 
          contactId,
          type: { in: ['OPENED', 'CLICKED'] }
        },
        select: {
          type: true,
          timestamp: true,
          campaign: {
            select: {
              sentAt: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });
    } else if (channelType === 'sms') {
      activities = await prisma.smsActivity.findMany({
        where: { 
          contactId,
          type: { in: ['DELIVERED', 'CLICKED'] }
        },
        select: {
          type: true,
          timestamp: true,
          campaign: {
            select: {
              sentAt: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });
    } else if (channelType === 'whatsapp') {
      activities = await prisma.whatsAppActivity.findMany({
        where: { 
          contactId,
          type: { in: ['DELIVERED', 'READ'] }
        },
        select: {
          type: true,
          timestamp: true,
          campaign: {
            select: {
              sentAt: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });
    }
    
    // Extract features for prediction
    const features = extractSendTimeFeatures(activities);
    
    // Run prediction model
    const timePredictions = runSendTimeModel(features, model.id);
    
    // Get best and worst time slots
    const allTimeSlots = timePredictions.map(p => ({
      dayOfWeek: p.dayOfWeek,
      hourOfDay: p.hourOfDay,
      probability: p.probability
    }));
    
    // Sort by probability
    allTimeSlots.sort((a, b) => b.probability - a.probability);
    
    // Get top 5 and bottom 5 times
    const bestTimes = allTimeSlots.slice(0, 5);
    const worstTimes = allTimeSlots.slice(-5).reverse();
    
    // Calculate average response time (in minutes)
    const avgResponseTime = calculateAverageResponseTime(activities);
    
    // Save predictions to database
    const predictionIds: string[] = [];
    
    for (const prediction of timePredictions) {
      // Only save significant predictions
      if (prediction.probability > 0.1) {
        try {
          // Save to general predictions table
          const predictionId = await savePrediction(
            model.id,
            'contact',
            contactId,
            PredictionModelType.SEND_TIME,
            prediction.probability,
            prediction.confidenceLevel,
            { 
              channelType,
              dayOfWeek: prediction.dayOfWeek,
              hourOfDay: prediction.hourOfDay
            },
            []
          );
          
          // Save to specific optimal send time table
          await prisma.optimalSendTime.upsert({
            where: {
              contactId_channelType_dayOfWeek_hourOfDay: {
                contactId,
                channelType,
                dayOfWeek: prediction.dayOfWeek,
                hourOfDay: prediction.hourOfDay
              }
            },
            update: {
              probability: prediction.probability,
              confidenceLevel: prediction.confidenceLevel,
              lastUpdated: new Date()
            },
            create: {
              id: randomUUID(),
              contactId,
              channelType,
              dayOfWeek: prediction.dayOfWeek,
              hourOfDay: prediction.hourOfDay,
              probability: prediction.probability,
              confidenceLevel: prediction.confidenceLevel,
              lastUpdated: new Date()
            }
          });
          
          predictionIds.push(predictionId);
        } catch (error) {
          logger.error(`Error saving send time prediction for ${contactId}`, error);
          // Continue with other predictions
        }
      }
    }
    
    logger.info(`Send time prediction created for contact ${contactId}`, {
      predictionCount: predictionIds.length,
      channelType
    });
    
    return {
      contactId,
      channelType,
      bestTimes,
      worstTimes,
      averageResponseTime: avgResponseTime,
      predictionId: predictionIds[0] || 'unknown'
    };
  } catch (error) {
    logger.error(`Error predicting send times for contact ${contactId}`, error);
    throw new Error(`Failed to predict send times: ${(error as Error).message}`);
  }
}

/**
 * Get the optimal send time for a list or segment of contacts
 */
export async function getOptimalSendTimeForAudience(
  listId?: string,
  segmentId?: string,
  channelType: string = 'email'
): Promise<GlobalSendTimeRecommendation[]> {
  try {
    // Get contacts in the list or segment
    let contactIds: string[] = [];
    
    if (listId) {
      const members = await prisma.listMember.findMany({
        where: { listId },
        select: { contactId: true }
      });
      contactIds = members.map(m => m.contactId);
    } else if (segmentId) {
      // For segments, we would run the segment query
      // This is simplified for the demo
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId }
      });
      
      if (!segment) {
        throw new Error(`Segment not found: ${segmentId}`);
      }
      
      // In a real implementation, would execute segment rules
      // For now, get a sample of contacts
      const sample = await prisma.contact.findMany({
        select: { id: true },
        take: 100
      });
      contactIds = sample.map(c => c.id);
    } else {
      // Get a sample of all contacts
      const sample = await prisma.contact.findMany({
        select: { id: true },
        take: 100
      });
      contactIds = sample.map(c => c.id);
    }
    
    logger.info(`Analyzing optimal send times for ${contactIds.length} contacts`);
    
    // Get all optimal send times for these contacts
    const optimalTimes = await prisma.optimalSendTime.findMany({
      where: {
        contactId: { in: contactIds },
        channelType
      }
    });
    
    // Group by day and hour
    const timeSlots: Record<string, {
      dayOfWeek: number;
      hourOfDay: number;
      count: number;
      totalProbability: number;
      totalConfidence: number;
    }> = {};
    
    optimalTimes.forEach(time => {
      const key = `${time.dayOfWeek}_${time.hourOfDay}`;
      
      if (!timeSlots[key]) {
        timeSlots[key] = {
          dayOfWeek: time.dayOfWeek,
          hourOfDay: time.hourOfDay,
          count: 0,
          totalProbability: 0,
          totalConfidence: 0
        };
      }
      
      timeSlots[key].count++;
      timeSlots[key].totalProbability += time.probability;
      timeSlots[key].totalConfidence += time.confidenceLevel;
    });
    
    // Calculate audience percentages and average probabilities
    const totalContacts = contactIds.length;
    const recommendations: GlobalSendTimeRecommendation[] = Object.values(timeSlots)
      .map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        hourOfDay: slot.hourOfDay,
        audiencePercentage: slot.count / totalContacts,
        confidence: slot.totalConfidence / slot.count
      }))
      .filter(rec => rec.audiencePercentage > 0.1) // Only include slots with at least 10% of audience
      .sort((a, b) => b.audiencePercentage - a.audiencePercentage);
    
    return recommendations.slice(0, 10); // Return top 10 recommendations
  } catch (error) {
    logger.error(`Error getting optimal send times for audience`, error);
    throw new Error(`Failed to get optimal send times: ${(error as Error).message}`);
  }
}

/**
 * Get send time predictions for a contact
 */
export async function getContactSendTimePredictions(
  contactId: string,
  channelType: string = 'email'
): Promise<SendTimePrediction[]> {
  try {
    const predictions = await prisma.optimalSendTime.findMany({
      where: {
        contactId,
        channelType
      },
      orderBy: {
        probability: 'desc'
      }
    });
    
    return predictions.map(p => ({
      contactId: p.contactId,
      channelType: p.channelType,
      dayOfWeek: p.dayOfWeek,
      hourOfDay: p.hourOfDay,
      probability: p.probability,
      confidenceLevel: p.confidenceLevel,
      predictionId: p.id
    }));
  } catch (error) {
    logger.error(`Error getting send time predictions for contact ${contactId}`, error);
    throw new Error(`Failed to get send time predictions: ${(error as Error).message}`);
  }
}

// Helper functions

/**
 * Extract send time features from contact activities
 */
function extractSendTimeFeatures(activities: any[]): any {
  // Count engagements by day and hour
  const dayHourCounts: Record<string, number> = {};
  const sentResponseTimes: number[] = []; // Minutes from sent to engagement
  
  // Initialize all day/hour combinations with 0
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      dayHourCounts[`${day}_${hour}`] = 0;
    }
  }
  
  // Count activities by day and hour
  activities.forEach(activity => {
    if (!activity.timestamp) return;
    
    const timestamp = new Date(activity.timestamp);
    const day = timestamp.getDay(); // 0-6 (Sunday-Saturday)
    const hour = timestamp.getHours(); // 0-23
    
    const key = `${day}_${hour}`;
    dayHourCounts[key] = (dayHourCounts[key] || 0) + 1;
    
    // Calculate response time if sent time is available
    if (activity.campaign?.sentAt) {
      const sentTime = new Date(activity.campaign.sentAt);
      const responseTimeMinutes = (timestamp.getTime() - sentTime.getTime()) / (1000 * 60);
      
      // Only count reasonable response times (within 7 days)
      if (responseTimeMinutes >= 0 && responseTimeMinutes < 10080) {
        sentResponseTimes.push(responseTimeMinutes);
      }
    }
  });
  
  return {
    activityCounts: dayHourCounts,
    responseTimeMinutes: sentResponseTimes,
    totalActivities: activities.length
  };
}

/**
 * Run the send time prediction model
 * (simplified implementation for demo purposes)
 */
function runSendTimeModel(features: any, modelId: string): SendTimePrediction[] {
  // This is a simplified model for demonstration
  // In production, this would call a real ML model API or run a local model
  
  const { activityCounts, totalActivities } = features;
  
  // Only make predictions if we have enough data
  if (totalActivities < 3) {
    // Return default predictions based on general patterns
    return generateDefaultTimePredictions();
  }
  
  const predictions: SendTimePrediction[] = [];
  
  // Calculate probabilities for each day/hour
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}_${hour}`;
      const count = activityCounts[key] || 0;
      
      // Calculate raw probability
      let probability = count / totalActivities;
      
      // Adjust for common patterns (business hours, workdays)
      // Workdays (Mon-Fri)
      if (day >= 1 && day <= 5) {
        probability *= 1.1;
      }
      
      // Business hours (9am-5pm)
      if (hour >= 9 && hour <= 17) {
        probability *= 1.2;
      }
      
      // Adjust for lunch time dip
      if (hour >= 12 && hour <= 13) {
        probability *= 0.9;
      }
      
      // Adjust for evening peak
      if (hour >= 19 && hour <= 21) {
        probability *= 1.15;
      }
      
      // Calculate confidence based on amount of data
      let confidenceLevel = Math.min(0.9, 0.4 + (totalActivities * 0.02));
      
      // Add prediction if probability is significant
      if (probability > 0) {
        predictions.push({
          contactId: 'temp', // Will be replaced when saved
          channelType: 'email',
          dayOfWeek: day,
          hourOfDay: hour,
          probability: Number(probability.toFixed(4)),
          confidenceLevel: Number(confidenceLevel.toFixed(2)),
          predictionId: 'temp'
        });
      }
    }
  }
  
  // Normalize probabilities to sum to 1
  const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
  if (totalProbability > 0) {
    predictions.forEach(p => {
      p.probability = Number((p.probability / totalProbability).toFixed(4));
    });
  }
  
  // Sort by probability
  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * Generate default time predictions based on general patterns
 */
function generateDefaultTimePredictions(): SendTimePrediction[] {
  const predictions: SendTimePrediction[] = [];
  
  // Generate predictions for business days and hours
  for (let day = 1; day <= 5; day++) { // Monday to Friday
    for (let hour = 9; hour <= 17; hour++) { // 9 AM to 5 PM
      let probability = 0.01;
      
      // Prioritize mid-morning and mid-afternoon
      if (hour === 10 || hour === 14) {
        probability = 0.05;
      } else if (hour >= 9 && hour <= 11) {
        probability = 0.03;
      } else if (hour >= 13 && hour <= 16) {
        probability = 0.025;
      }
      
      // Tuesday and Thursday are often good days
      if (day === 2 || day === 4) {
        probability *= 1.2;
      }
      
      predictions.push({
        contactId: 'default',
        channelType: 'email',
        dayOfWeek: day,
        hourOfDay: hour,
        probability,
        confidenceLevel: 0.4, // Low confidence for default predictions
        predictionId: 'default'
      });
    }
  }
  
  // Add some weekend times with lower probabilities
  for (let day of [0, 6]) { // Sunday and Saturday
    for (let hour of [10, 11, 15, 16, 20]) {
      predictions.push({
        contactId: 'default',
        channelType: 'email',
        dayOfWeek: day,
        hourOfDay: hour,
        probability: 0.01,
        confidenceLevel: 0.3,
        predictionId: 'default'
      });
    }
  }
  
  // Normalize probabilities
  const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
  predictions.forEach(p => {
    p.probability = Number((p.probability / totalProbability).toFixed(4));
  });
  
  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * Calculate average response time in minutes
 */
function calculateAverageResponseTime(activities: any[]): number {
  const responseTimes: number[] = [];
  
  activities.forEach(activity => {
    if (activity.campaign?.sentAt && activity.timestamp) {
      const sentTime = new Date(activity.campaign.sentAt);
      const responseTime = new Date(activity.timestamp);
      
      const diffMinutes = (responseTime.getTime() - sentTime.getTime()) / (1000 * 60);
      
      // Only count reasonable response times (within 24 hours)
      if (diffMinutes >= 0 && diffMinutes < 1440) {
        responseTimes.push(diffMinutes);
      }
    }
  });
  
  if (responseTimes.length === 0) {
    return 60; // Default: 1 hour
  }
  
  const sum = responseTimes.reduce((total, time) => total + time, 0);
  return Math.round(sum / responseTimes.length);
} 