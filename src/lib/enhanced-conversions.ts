/**
 * Enhanced Conversion Tracking & Attribution
 * 
 * This module provides advanced functionality for tracking conversions,
 * implementing different attribution models, and analyzing funnel performance.
 */

import {
  AttributionModel,
  type ConversionCategory,
  type ConversionValueType,
  type EntityType,
} from '@/types/prisma-types';
// NOTE: Prisma removed - using backend API (all conversion tables exist in backend)
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

// Types for conversion tracking
export interface ConversionEventData {
  name: string;
  description?: string;
  eventType: string;
  category: ConversionCategory;
  valueType: ConversionValueType;
  isSystem?: boolean;
}

export interface ConversionTrackingData {
  eventId: string;
  entityType: EntityType;
  entityId: string;
  contactId?: string;
  value?: number;
  metadata?: Record<string, any>;
  attributionModel?: AttributionModel;
  touchPoints?: TouchPoint[];
}

export interface TouchPoint {
  entityType: EntityType;
  entityId: string;
  timestamp: Date;
  type: string;
  weight?: number;
}

export interface FunnelStage {
  eventId: string;
  name: string;
  count: number;
  dropOffRate?: number;
  conversionRate?: number;
  totalValue?: number;
}

export interface FunnelData {
  name: string;
  totalEntries: number;
  totalConversions: number;
  conversionRate: number;
  totalValue: number;
  stages: FunnelStage[];
  startDate: Date;
  endDate: Date;
}

// Standard conversion event types
export const ConversionEventTypes = {
  // Email events
  EMAIL_OPEN: 'email_open',
  EMAIL_CLICK: 'email_click',
  EMAIL_REPLY: 'email_reply',
  
  // SMS events
  SMS_DELIVERY: 'sms_delivery',
  SMS_REPLY: 'sms_reply',
  
  // WhatsApp events
  WHATSAPP_DELIVERY: 'whatsapp_delivery',
  WHATSAPP_READ: 'whatsapp_read',
  WHATSAPP_REPLY: 'whatsapp_reply',
  
  // Web events
  PAGE_VIEW: 'page_view',
  CONTENT_VIEW: 'content_view',
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  
  // E-commerce events
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  CHECKOUT_START: 'checkout_start',
  PURCHASE: 'purchase',
  
  // Custom event prefix
  CUSTOM: 'custom_'
};

/**
 * Create a new conversion event type
 */
export async function createConversionEvent(
  data: ConversionEventData,
  userId: string
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        name: data.name,
        description: data.description,
        eventType: data.eventType,
        category: data.category,
        valueType: data.valueType,
        isSystem: data.isSystem || false,
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversion event: ${response.status}`);
    }

    const event = await response.json();

    logger.info(`Created conversion event: ${event.id}`, { eventId: event.id, name: data.name });

    return event.id;
  } catch (error) {
    logger.error('Error creating conversion event', error);
    throw error;
  }
}

/**
 * Track a conversion with the specified attribution model
 */
export async function trackConversion(data: ConversionTrackingData): Promise<boolean> {
  try {
    // Get attribution settings for default values
    const attributionSettings = await getAttributionSettings();

    // Create the conversion record
    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        eventId: data.eventId,
        entityType: data.entityType,
        entityId: data.entityId,
        contactId: data.contactId,
        value: data.value,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        attributionModel: data.attributionModel || attributionSettings.defaultModel,
        touchPoints: data.touchPoints ? JSON.stringify(data.touchPoints) : null,
        occurredAt: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track conversion: ${response.status}`);
    }

    return true;
  } catch (error) {
    logger.error('Error tracking conversion', error);
    return false;
  }
}

/**
 * Get attribution settings
 */
export async function getAttributionSettings(): Promise<{
  defaultModel: AttributionModel;
  customWeights?: Record<string, number>;
  lookbackWindow: number;
}> {
  try {
    // Look for existing settings
    const response = await fetch(`${BACKEND_URL}/api/v2/attribution-settings?limit=1`);

    if (!response.ok) {
      throw new Error(`Failed to get attribution settings: ${response.status}`);
    }

    const data = await response.json();
    const settings = data[0];

    if (settings) {
      return {
        defaultModel: settings.defaultModel,
        customWeights: settings.customWeights ? JSON.parse(settings.customWeights) : undefined,
        lookbackWindow: settings.lookbackWindow,
      };
    }

    // Create default settings if none exist
    const createResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        defaultModel: AttributionModel.LAST_TOUCH,
        lookbackWindow: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create attribution settings: ${createResponse.status}`);
    }

    const defaultSettings = await createResponse.json();

    return {
      defaultModel: defaultSettings.defaultModel,
      lookbackWindow: defaultSettings.lookbackWindow,
    };
  } catch (error) {
    logger.error('Error getting attribution settings', error);
    // Return sensible defaults if there's an error
    return {
      defaultModel: AttributionModel.LAST_TOUCH,
      lookbackWindow: 30,
    };
  }
}

/**
 * Update attribution settings
 */
export async function updateAttributionSettings(
  defaultModel: AttributionModel,
  lookbackWindow: number,
  customWeights?: Record<string, number>
): Promise<boolean> {
  try {
    // Look for existing settings
    const response = await fetch(`${BACKEND_URL}/api/v2/attribution-settings?limit=1`);

    if (!response.ok) {
      throw new Error(`Failed to get attribution settings: ${response.status}`);
    }

    const data = await response.json();
    const settings = data[0];

    const payload = {
      defaultModel,
      lookbackWindow,
      customWeights: customWeights ? JSON.stringify(customWeights) : null,
      updatedAt: new Date(),
    };

    if (settings) {
      // Update existing settings
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-settings/${settings.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update attribution settings: ${updateResponse.status}`);
      }
    } else {
      // Create new settings
      const createResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: randomUUID(),
          ...payload,
          createdAt: new Date(),
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create attribution settings: ${createResponse.status}`);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error updating attribution settings', error);
    return false;
  }
}

/**
 * Create a conversion funnel
 */
export async function createConversionFunnel(
  name: string,
  stages: string[], // Array of conversion event IDs
  userId: string,
  description?: string
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-funnels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        name,
        description,
        stages: JSON.stringify(stages),
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversion funnel: ${response.status}`);
    }

    const funnel = await response.json();

    logger.info(`Created conversion funnel: ${funnel.id}`, { funnelId: funnel.id, name });

    return funnel.id;
  } catch (error) {
    logger.error('Error creating conversion funnel', error);
    throw error;
  }
}

/**
 * Generate a funnel report for a specific time period
 */
export async function generateFunnelReport(
  funnelId: string,
  startDate: Date,
  endDate: Date
): Promise<FunnelData | null> {
  try {
    // Get the funnel
    const funnelResponse = await fetch(`${BACKEND_URL}/api/v2/conversion-funnels/${funnelId}`);

    if (!funnelResponse.ok) {
      throw new Error(`Failed to get conversion funnel: ${funnelResponse.status}`);
    }

    const funnel = await funnelResponse.json();

    if (!funnel) {
      logger.warn(`Funnel not found: ${funnelId}`);
      return null;
    }

    // Parse stages
    const stageIds = JSON.parse(funnel.stages) as string[];

    // Get the events for these stages
    const eventsResponse = await fetch(
      `${BACKEND_URL}/api/v2/conversion-events?${stageIds.map(id => `id=${id}`).join('&')}`
    );

    if (!eventsResponse.ok) {
      throw new Error(`Failed to get conversion events: ${eventsResponse.status}`);
    }

    const events = await eventsResponse.json();

    // Create a map of event IDs to names
    const eventMap = new Map(events.map((event: any) => [event.id, event.name]));

    // Get conversion counts for each stage
    const stageCounts = await Promise.all(
      stageIds.map(async (eventId) => {
        const conversionsResponse = await fetch(
          `${BACKEND_URL}/api/v2/conversion-tracking?eventId=${eventId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (!conversionsResponse.ok) {
          throw new Error(`Failed to get conversion tracking: ${conversionsResponse.status}`);
        }

        const conversions = await conversionsResponse.json();

        const uniqueContacts = new Set(conversions.map((c: any) => c.contactId).filter(Boolean));
        const totalValue = conversions.reduce((sum: number, c: any) => sum + (c.value || 0), 0);

        return {
          eventId,
          name: eventMap.get(eventId) || 'Unknown Event',
          count: uniqueContacts.size,
          totalValue,
        };
      })
    );

    // Calculate drop-off and conversion rates
    const stages: FunnelStage[] = [];
    let previousCount = stageCounts[0]?.count || 0;
    const totalEntries = previousCount;

    for (let i = 0; i < stageCounts.length; i++) {
      const stage = stageCounts[i];
      const dropOffRate = i > 0 ? (previousCount - stage.count) / previousCount : 0;
      const conversionRate = totalEntries > 0 ? stage.count / totalEntries : 0;

      stages.push({
        eventId: stage.eventId,
        name: stage.name,
        count: stage.count,
        dropOffRate,
        conversionRate,
        totalValue: stage.totalValue,
      });

      previousCount = stage.count;
    }

    // Calculate overall funnel metrics
    const totalConversions = stages[stages.length - 1]?.count || 0;
    const conversionRate = totalEntries > 0 ? totalConversions / totalEntries : 0;
    const totalValue = stages.reduce((sum, stage) => sum + (stage.totalValue || 0), 0);

    // Create a report record in the database
    const reportData = {
      stages,
      totalEntries,
      totalConversions,
      conversionRate,
      totalValue,
    };

    const reportResponse = await fetch(`${BACKEND_URL}/api/v2/conversion-funnel-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        funnelId,
        startDate,
        endDate,
        data: JSON.stringify(reportData),
        createdAt: new Date(),
      }),
    });

    if (!reportResponse.ok) {
      throw new Error(`Failed to create conversion funnel report: ${reportResponse.status}`);
    }

    return {
      name: funnel.name,
      ...reportData,
      startDate,
      endDate,
    };
  } catch (error) {
    logger.error(`Error generating funnel report: ${funnelId}`, error);
    return null;
  }
}

/**
 * Apply an attribution model to touch points
 */
export function applyAttributionModel(
  touchPoints: TouchPoint[],
  model: AttributionModel,
  customWeights?: Record<string, number>
): TouchPoint[] {
  // Sort touch points by timestamp
  const sortedPoints = [...touchPoints].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  if (sortedPoints.length === 0) {
    return [];
  }
  
  if (sortedPoints.length === 1) {
    // If there's only one touch point, it gets 100% credit
    sortedPoints[0].weight = 1;
    return sortedPoints;
  }
  
  switch (model) {
    case AttributionModel.FIRST_TOUCH:
      // First touch gets 100% credit
      sortedPoints.forEach((point, index) => {
        point.weight = index === 0 ? 1 : 0;
      });
      break;
      
    case AttributionModel.LAST_TOUCH:
      // Last touch gets 100% credit
      sortedPoints.forEach((point, index) => {
        point.weight = index === sortedPoints.length - 1 ? 1 : 0;
      });
      break;
      
    case AttributionModel.LINEAR:
      // Equal distribution
      const equalWeight = 1 / sortedPoints.length;
      sortedPoints.forEach(point => {
        point.weight = equalWeight;
      });
      break;
      
    case AttributionModel.TIME_DECAY:
      // More recent touches get more credit
      const halfLifeDays = 7; // 7-day half-life
      const latestTime = sortedPoints[sortedPoints.length - 1].timestamp.getTime();
      
      // Calculate raw weights based on time decay
      let totalWeight = 0;
      
      sortedPoints.forEach(point => {
        const daysAgo = (latestTime - point.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const weight = Math.pow(0.5, daysAgo / halfLifeDays);
        point.weight = weight;
        totalWeight += weight;
      });
      
      // Normalize weights to sum to 1
      sortedPoints.forEach(point => {
        point.weight = (point.weight || 0) / totalWeight;
      });
      break;
      
    case AttributionModel.POSITION_BASED:
      // U-shaped: 40% to first, 40% to last, 20% distributed among middle touches
      sortedPoints.forEach((point, index) => {
        if (index === 0) {
          point.weight = 0.4;
        } else if (index === sortedPoints.length - 1) {
          point.weight = 0.4;
        } else {
          // Distribute the remaining 20% among middle touch points
          point.weight = 0.2 / (sortedPoints.length - 2);
        }
      });
      break;
      
    case AttributionModel.CUSTOM:
      // Use custom weights if provided
      if (customWeights) {
        sortedPoints.forEach((point, index) => {
          const position = index === 0 ? 'first' : (index === sortedPoints.length - 1 ? 'last' : 'middle');
          point.weight = customWeights[position] || 0;
        });
        
        // Normalize weights to sum to 1
        const totalCustomWeight = sortedPoints.reduce((sum, point) => sum + (point.weight || 0), 0);
        if (totalCustomWeight > 0) {
          sortedPoints.forEach(point => {
            point.weight = (point.weight || 0) / totalCustomWeight;
          });
        }
      } else {
        // Fall back to position-based if no custom weights
        return applyAttributionModel(touchPoints, AttributionModel.POSITION_BASED);
      }
      break;
  }
  
  return sortedPoints;
}

/**
 * Get attribution for a specific conversion
 */
export async function getConversionAttribution(
  conversionTrackingId: string
): Promise<TouchPoint[] | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-tracking/${conversionTrackingId}`);

    if (!response.ok) {
      throw new Error(`Failed to get conversion tracking: ${response.status}`);
    }

    const conversion = await response.json();

    if (!conversion || !conversion.touchPoints) {
      return null;
    }

    const touchPoints = JSON.parse(conversion.touchPoints) as TouchPoint[];
    const attributionSettings = await getAttributionSettings();

    // Apply the attribution model
    const attributedPoints = applyAttributionModel(
      touchPoints,
      conversion.attributionModel || attributionSettings.defaultModel,
      attributionSettings.customWeights
    );

    return attributedPoints;
  } catch (error) {
    logger.error(`Error getting conversion attribution: ${conversionTrackingId}`, error);
    return null;
  }
}

/**
 * Get all previously defined conversion events
 */
export async function getConversionEvents(): Promise<{
  system: Array<{ id: string; name: string; eventType: string; category: ConversionCategory }>;
  custom: Array<{ id: string; name: string; eventType: string; category: ConversionCategory }>;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-events?orderBy=name&order=asc`);

    if (!response.ok) {
      throw new Error(`Failed to get conversion events: ${response.status}`);
    }

    const events = await response.json();

    return {
      system: events.filter((e: any) => e.isSystem).map(({ isSystem, ...rest }: any) => rest),
      custom: events.filter((e: any) => !e.isSystem).map(({ isSystem, ...rest }: any) => rest),
    };
  } catch (error) {
    logger.error('Error getting conversion events', error);
    return { system: [], custom: [] };
  }
}

/**
 * Get conversion data for an entity (campaign, workflow, etc.)
 */
export async function getEntityConversions(
  entityType: EntityType,
  entityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, { count: number; value: number }>> {
  try {
    const params = new URLSearchParams({
      entityType,
      entityId,
    });

    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }

    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    params.append('include', 'event');

    const response = await fetch(`${BACKEND_URL}/api/v2/conversion-tracking?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to get entity conversions: ${response.status}`);
    }

    const conversions = await response.json();

    // Group by event type
    const results: Record<string, { count: number; value: number }> = {};

    conversions.forEach((conversion: any) => {
      const eventType = conversion.event.eventType;

      if (!results[eventType]) {
        results[eventType] = { count: 0, value: 0 };
      }

      results[eventType].count += 1;
      results[eventType].value += conversion.value || 0;
    });

    return results;
  } catch (error) {
    logger.error(`Error getting entity conversions: ${entityType}/${entityId}`, error);
    return {};
  }
} 