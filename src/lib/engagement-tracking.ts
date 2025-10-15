/**
 * Engagement Tracking Module
 * 
 * This module provides functions to track user engagement with various types
 * of content (emails, SMS, WhatsApp) and analyze engagement patterns for
 * optimizing future communications.
 */

import type { ActivityType, EntityType } from '@/types/prisma-types';
// NOTE: Prisma removed - using backend API for activity tables, Redis for EngagementTime/SendTimeOptimization
import { redisCache } from '@/lib/cache/redis-client';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

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

    // Create activity record via backend API based on entity type
    let endpoint = '';
    switch (entityType) {
      case 'EMAIL_CAMPAIGN':
        endpoint = '/api/v2/email-activities';
        break;
      case 'SMS_CAMPAIGN':
        endpoint = '/api/v2/sms-activities';
        break;
      case 'WHATSAPP_CAMPAIGN':
        endpoint = '/api/v2/whatsapp-activities';
        break;
      default:
        logger.warn(`No specific activity table for entity type: ${entityType}`);
        return;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: activityId,
        campaignId: entityId,
        contactId,
        type: activityType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
    });

    if (!response.ok) {
      logger.warn(`Failed to create ${entityType} activity: ${response.status}`);
    }

    // Store engagement time in Redis cache
    const engKey = `engagement_times:${contactId}`;
    const cached = await redisCache.get(engKey);
    const engagements: any[] = cached ? JSON.parse(cached) : [];

    engagements.unshift({
      id: activityId,
      contactId,
      entityType,
      entityId,
      engagementType: activityType,
      dayOfWeek,
      hourOfDay,
      timestamp: now.toISOString()
    });

    // Keep only the most recent 100 engagements
    const trimmed = engagements.slice(0, 100);
    await redisCache.set(engKey, JSON.stringify(trimmed), 86400 * 90); // 90 days

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

    // Fetch activities from backend API based on entity type
    let endpoint = '';
    switch (entityType) {
      case 'EMAIL_CAMPAIGN':
        endpoint = `/api/v2/email-activities?campaignId=${entityId}`;
        break;
      case 'SMS_CAMPAIGN':
        endpoint = `/api/v2/sms-activities?campaignId=${entityId}`;
        break;
      case 'WHATSAPP_CAMPAIGN':
        endpoint = `/api/v2/whatsapp-activities?campaignId=${entityId}`;
        break;
      default:
        logger.warn(`No specific activity table for entity type: ${entityType}`);
        return {
          totalActivities: 0,
          engagementByHour: {},
          engagementByDay: {},
        };
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      activities = result.data || result || [];
    }

    // Count activity types
    const totalActivities = activities.length;
    const sentCount = activities.filter(a => a.type === 'SENT').length;
    const openCount = activities.filter(a => a.type === 'OPENED').length;
    const clickCount = activities.filter(a => a.type === 'CLICKED').length;
    const bounceCount = activities.filter(a => a.type === 'BOUNCED').length;
    const unsubscribeCount = activities.filter(a => a.type === 'UNSUBSCRIBED').length;

    // Calculate engagement by hour and day from Redis cache
    const engagementByHour: Record<number, number> = {};
    const engagementByDay: Record<number, number> = {};

    // Get all engagement times for this entity from Redis
    // Since engagement times are stored per contact, we need to aggregate
    const timeKey = `engagement_times_entity:${entityType}:${entityId}`;
    const cached = await redisCache.get(timeKey);

    if (cached) {
      const timeData: Array<{dayOfWeek: number, hourOfDay: number, count: number}> = JSON.parse(cached);

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
    }

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
    // Get optimization data from Redis cache
    const optKey = `send_time_optimization:${contactId}`;
    const cachedOpt = await redisCache.get(optKey);

    if (cachedOpt) {
      const optimizations: Array<{dayOfWeek: number, hourOfDay: number, confidenceLevel: number, engagementScore: number}> = JSON.parse(cachedOpt);
      const filtered = optimizations.filter(o => o.confidenceLevel >= minConfidence)
        .sort((a, b) => b.engagementScore - a.engagementScore);

      if (filtered.length > 0) {
        return {
          dayOfWeek: filtered[0].dayOfWeek,
          hourOfDay: filtered[0].hourOfDay,
          confidence: filtered[0].confidenceLevel,
        };
      }
    }

    // If no optimization data, analyze engagement times from Redis cache
    const engKey = `engagement_times:${contactId}`;
    const cachedEng = await redisCache.get(engKey);
    let engagements: Array<{dayOfWeek: number, hourOfDay: number, timestamp: string}> = cachedEng ? JSON.parse(cachedEng) : [];

    // Limit to 50 most recent
    engagements = engagements.slice(0, 50);

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

    // Store this result in Redis cache
    const newOptimization = {
      dayOfWeek: bestTime.dayOfWeek,
      hourOfDay: bestTime.hourOfDay,
      engagementScore: bestTime.count / engagements.length,
      confidenceLevel: confidence,
      lastUpdated: new Date().toISOString()
    };

    const existingOpts: any[] = cachedOpt ? JSON.parse(cachedOpt) : [];
    const updatedOpts = existingOpts.filter(o =>
      !(o.dayOfWeek === bestTime.dayOfWeek && o.hourOfDay === bestTime.hourOfDay)
    );
    updatedOpts.push(newOptimization);

    await redisCache.set(optKey, JSON.stringify(updatedOpts), 86400 * 90); // 90 days

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