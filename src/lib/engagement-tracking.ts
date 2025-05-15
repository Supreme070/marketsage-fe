/**
 * Engagement Tracking Module
 * 
 * This module provides functions to track user engagement with various types
 * of content (emails, SMS, WhatsApp) and analyze engagement patterns for
 * optimizing future communications.
 */

import { ActivityType, EntityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Records an engagement event in the system
 * 
 * @param contactId The ID of the contact who engaged
 * @param entityType The type of entity engaged with (campaign type)
 * @param entityId The specific entity ID
 * @param activityType The type of engagement activity
 * @param metadata Optional additional data about the engagement
 */
export async function recordEngagement(
  contactId: string,
  entityType: EntityType,
  entityId: string,
  activityType: ActivityType,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6, Sunday is 0
    const hourOfDay = now.getHours(); // 0-23
    const activityId = uuidv4(); // Generate a unique ID for the activity

    // Create activity record based on entity type
    switch (entityType) {
      case 'EMAIL_CAMPAIGN':
        await prisma.emailActivity.create({
          data: {
            id: activityId, // Add the required ID field
            campaignId: entityId,
            contactId,
            type: activityType,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
        break;
      case 'SMS_CAMPAIGN':
        await prisma.sMSActivity.create({
          data: {
            id: activityId, // Add the required ID field
            campaignId: entityId,
            contactId,
            type: activityType,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
        break;
      case 'WHATSAPP_CAMPAIGN':
        await prisma.whatsAppActivity.create({
          data: {
            id: activityId, // Add the required ID field
            campaignId: entityId,
            contactId,
            type: activityType,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
        break;
      default:
        logger.warn(`No specific activity table for entity type: ${entityType}`);
    }

    // Create raw SQL query for engagement time tracking
    // This will be replaced with proper Prisma model once migrations are created
    await prisma.$executeRaw`
      INSERT INTO "EngagementTime" (
        "id", "contactId", "entityType", "entityId", "engagementType", 
        "dayOfWeek", "hourOfDay", "timestamp"
      )
      VALUES (
        ${activityId}, 
        ${contactId}, 
        ${entityType}, 
        ${entityId}, 
        ${activityType}, 
        ${dayOfWeek}, 
        ${hourOfDay}, 
        ${now}
      )
    `;

    logger.info("Recorded engagement event", {
      contactId,
      entityType,
      entityId,
      activityType,
      dayOfWeek,
      hourOfDay,
    });
  } catch (error) {
    logger.error("Error recording engagement", error);
  }
}

/**
 * Returns engagement statistics for a specific entity
 */
export async function getEngagementStats(
  entityType: EntityType,
  entityId: string
): Promise<{
  totalActivities: number;
  openRate?: number;
  clickRate?: number;
  bounceRate?: number;
  unsubscribeRate?: number;
  engagementByHour: Record<number, number>;
  engagementByDay: Record<number, number>;
}> {
  try {
    let activities: any[] = [];

    // Fetch activities based on entity type
    switch (entityType) {
      case 'EMAIL_CAMPAIGN':
        activities = await prisma.emailActivity.findMany({
          where: { campaignId: entityId },
        });
        break;
      case 'SMS_CAMPAIGN':
        activities = await prisma.sMSActivity.findMany({
          where: { campaignId: entityId },
        });
        break;
      case 'WHATSAPP_CAMPAIGN':
        activities = await prisma.whatsAppActivity.findMany({
          where: { campaignId: entityId },
        });
        break;
      default:
        logger.warn(`No specific activity table for entity type: ${entityType}`);
        return {
          totalActivities: 0,
          engagementByHour: {},
          engagementByDay: {},
        };
    }

    // Count activity types
    const totalActivities = activities.length;
    const sentCount = activities.filter(a => a.type === 'SENT').length;
    const openCount = activities.filter(a => a.type === 'OPENED').length;
    const clickCount = activities.filter(a => a.type === 'CLICKED').length;
    const bounceCount = activities.filter(a => a.type === 'BOUNCED').length;
    const unsubscribeCount = activities.filter(a => a.type === 'UNSUBSCRIBED').length;

    // Calculate engagement by hour and day
    const engagementByHour: Record<number, number> = {};
    const engagementByDay: Record<number, number> = {};

    // Use raw SQL query since we don't have the EngagementTime model in Prisma yet
    const timeData = await prisma.$queryRaw<Array<{dayOfWeek: number, hourOfDay: number, count: number}>>`
      SELECT "dayOfWeek", "hourOfDay", COUNT(*) as count
      FROM "EngagementTime"
      WHERE "entityType" = ${entityType} AND "entityId" = ${entityId}
      GROUP BY "dayOfWeek", "hourOfDay"
    `;

    // Process time data
    timeData.forEach(item => {
      if (!engagementByHour[item.hourOfDay]) {
        engagementByHour[item.hourOfDay] = 0;
      }
      if (!engagementByDay[item.dayOfWeek]) {
        engagementByDay[item.dayOfWeek] = 0;
      }
      
      engagementByHour[item.hourOfDay] += Number(item.count);
      engagementByDay[item.dayOfWeek] += Number(item.count);
    });

    return {
      totalActivities,
      openRate: sentCount > 0 ? openCount / sentCount : 0,
      clickRate: openCount > 0 ? clickCount / openCount : 0,
      bounceRate: sentCount > 0 ? bounceCount / sentCount : 0,
      unsubscribeRate: sentCount > 0 ? unsubscribeCount / sentCount : 0,
      engagementByHour,
      engagementByDay,
    };
  } catch (error) {
    logger.error("Error getting engagement stats", error);
    return {
      totalActivities: 0,
      engagementByHour: {},
      engagementByDay: {},
    };
  }
}

/**
 * Determines the best time to send content to a specific contact
 * based on their historical engagement patterns
 */
export async function getBestSendTime(
  contactId: string,
  minConfidence = 0.3
): Promise<{ dayOfWeek: number; hourOfDay: number; confidence: number } | null> {
  try {
    // Try to get optimization data from database
    const optimization = await prisma.$queryRaw<Array<{dayOfWeek: number, hourOfDay: number, confidenceLevel: number}>>`
      SELECT "dayOfWeek", "hourOfDay", "confidenceLevel" 
      FROM "SendTimeOptimization"
      WHERE "contactId" = ${contactId}
      AND "confidenceLevel" >= ${minConfidence}
      ORDER BY "engagementScore" DESC
      LIMIT 1
    `;

    if (optimization.length > 0) {
      return {
        dayOfWeek: optimization[0].dayOfWeek,
        hourOfDay: optimization[0].hourOfDay,
        confidence: optimization[0].confidenceLevel,
      };
    }
    
    // If no optimization data, analyze engagement times
    const engagements = await prisma.$queryRaw<Array<{dayOfWeek: number, hourOfDay: number, timestamp: Date}>>`
      SELECT "dayOfWeek", "hourOfDay", timestamp
      FROM "EngagementTime"
      WHERE "contactId" = ${contactId}
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    
    if (engagements.length === 0) {
      // Fall back to general best practices
      return {
        dayOfWeek: 2, // Tuesday
        hourOfDay: 10, // 10 AM
        confidence: 0.2,
      };
    }
    
    // Find most common engagement time
    const timeCounts: Record<string, { count: number; dayOfWeek: number; hourOfDay: number }> = {};
    
    engagements.forEach((engagement) => {
      const key = `${engagement.dayOfWeek}-${engagement.hourOfDay}`;
      if (!timeCounts[key]) {
        timeCounts[key] = { count: 0, dayOfWeek: engagement.dayOfWeek, hourOfDay: engagement.hourOfDay };
      }
      timeCounts[key].count++;
    });
    
    const bestTime = Object.values(timeCounts).sort((a, b) => b.count - a.count)[0];
    const confidence = Math.min(bestTime.count / 10, 1);
    
    // Store this result for future reference
    await prisma.$executeRaw`
      INSERT INTO "SendTimeOptimization" ("id", "contactId", "dayOfWeek", "hourOfDay", "engagementScore", "confidenceLevel", "lastUpdated")
      VALUES (
        gen_random_uuid(), 
        ${contactId}, 
        ${bestTime.dayOfWeek}, 
        ${bestTime.hourOfDay}, 
        ${bestTime.count / engagements.length}, 
        ${confidence},
        NOW()
      )
      ON CONFLICT ("contactId", "dayOfWeek", "hourOfDay") 
      DO UPDATE SET 
        "engagementScore" = ${bestTime.count / engagements.length},
        "confidenceLevel" = ${confidence},
        "lastUpdated" = NOW()
    `;
    
    return {
      dayOfWeek: bestTime.dayOfWeek,
      hourOfDay: bestTime.hourOfDay,
      confidence,
    };
  } catch (error) {
    logger.error("Error determining best send time", error);
    return null;
  }
} 