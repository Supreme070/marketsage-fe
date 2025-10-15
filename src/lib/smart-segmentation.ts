/**
 * Smart Segmentation Module
 *
 * This module provides functionality to create intelligent user segments
 * based on engagement data, behavior patterns, and basic statistical analysis.
 */

// NOTE: Prisma removed - using backend API (SmartSegment, Contact, EmailActivity tables exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
import { logger } from '@/lib/logger';
import type { ActivityType } from '@/types/prisma-types';

// Types for segmentation module
export interface SegmentRule {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: string | number | string[] | number[] | Date;
}

export interface SegmentDefinition {
  operator: 'AND' | 'OR';
  conditions: SegmentRule[];
}

export interface SmartSegmentParams {
  minEngagementScore?: number;
  maxInactivityDays?: number;
  minPurchaseValue?: number;
  activityTypes?: ActivityType[];
}

export interface SegmentPreview {
  id: string;
  name: string;
  description: string;
  rules: string;
  score: number;
  estimatedCount: number;
}

export interface Contact {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

/**
 * Generate smart segment suggestions based on engagement data
 */
export async function generateSmartSegments(
  params: SmartSegmentParams = {}
): Promise<SegmentPreview[]> {
  try {
    // Check for existing smart segments
    const response = await fetch(`${BACKEND_URL}/api/v2/smart-segments?status=ACTIVE`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch smart segments: ${response.status}`);
    }

    const existingSegments = await response.json();

    if (existingSegments.length > 0) {
      // Add estimated counts to existing segments
      const segmentsWithCounts = await Promise.all(
        existingSegments.map(async segment => {
          const count = await estimateSegmentSize(JSON.parse(segment.rules) as SegmentDefinition);
          return {
            ...segment,
            estimatedCount: count
          };
        })
      );
      
      return segmentsWithCounts;
    }
    
    // Generate base segments with properly typed operators
    const segments = [
      {
        name: "High Engagement",
        description: "Contacts who frequently open and click emails",
        rules: {
          operator: "AND" as const,
          conditions: [
            { field: "email_opens", operator: "gt" as const, value: 5 },
            { field: "email_clicks", operator: "gt" as const, value: 2 },
            { field: "last_activity", operator: "lt" as const, value: "30 days" }
          ]
        } as SegmentDefinition,
        score: 0.9
      },
      {
        name: "At Risk",
        description: "Previously active contacts who haven't engaged recently",
        rules: {
          operator: "AND" as const,
          conditions: [
            { field: "email_opens", operator: "gt" as const, value: 5 },
            { field: "last_activity", operator: "gt" as const, value: "60 days" },
            { field: "last_activity", operator: "lt" as const, value: "120 days" }
          ]
        } as SegmentDefinition,
        score: 0.85
      },
      {
        name: "New Subscribers",
        description: "Recently added contacts who are new to your lists",
        rules: {
          operator: "AND" as const,
          conditions: [
            { field: "signup_date", operator: "gt" as const, value: "30 days" }
          ]
        } as SegmentDefinition,
        score: 0.8
      },
      {
        name: "Inactive",
        description: "Contacts who haven't engaged in a long time",
        rules: {
          operator: "AND" as const,
          conditions: [
            { field: "last_activity", operator: "gt" as const, value: "120 days" }
          ]
        } as SegmentDefinition,
        score: 0.75
      }
    ];
    
    // Store segments and get estimated counts
    const createdSegments: SegmentPreview[] = [];
    
    for (const segment of segments) {
      // Estimate segment size
      const estimatedCount = await estimateSegmentSize(segment.rules);

      // Store in database via backend API
      const createResponse = await fetch(`${BACKEND_URL}/api/v2/smart-segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segment.name,
          description: segment.description,
          rules: segment.rules,
          score: segment.score,
          status: 'ACTIVE',
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create smart segment: ${createResponse.status}`);
      }

      const result = await createResponse.json();
      createdSegments.push({
        ...result,
        estimatedCount
      });
    }
    
    return createdSegments;
  } catch (error) {
    logger.error("Error generating smart segments", error);
    return [];
  }
}

/**
 * Estimate the number of contacts that would match a segment
 */
async function estimateSegmentSize(rules: SegmentDefinition): Promise<number> {
  try {
    // This is a basic implementation that will be enhanced with actual SQL queries
    // For now, we'll return reasonable estimates
    
    // Convert rules to a SQL WHERE clause (simplified version)
    const whereConditions: string[] = [];
    
    for (const rule of rules.conditions) {
      switch (rule.field) {
        case 'email_opens':
          whereConditions.push(`
            (SELECT COUNT(*) FROM "EmailActivity" 
             WHERE "EmailActivity"."contactId" = "Contact"."id" 
             AND "EmailActivity"."type" = 'OPENED') ${getOperatorSQL(rule.operator)} ${rule.value}
          `);
          break;
        
        case 'email_clicks':
          whereConditions.push(`
            (SELECT COUNT(*) FROM "EmailActivity" 
             WHERE "EmailActivity"."contactId" = "Contact"."id" 
             AND "EmailActivity"."type" = 'CLICKED') ${getOperatorSQL(rule.operator)} ${rule.value}
          `);
          break;
          
        case 'last_activity':
          // Parse value like "30 days"
          const dayMatch = String(rule.value).match(/(\d+)\s*days/);
          if (dayMatch) {
            const days = Number.parseInt(dayMatch[1]);
            whereConditions.push(`
              (SELECT MAX("timestamp") FROM "EmailActivity" 
               WHERE "EmailActivity"."contactId" = "Contact"."id")
               ${getOperatorSQL(rule.operator)} NOW() - INTERVAL '${days} days'
            `);
          }
          break;
          
        case 'signup_date':
          const signupDayMatch = String(rule.value).match(/(\d+)\s*days/);
          if (signupDayMatch) {
            const days = Number.parseInt(signupDayMatch[1]);
            whereConditions.push(`
              "Contact"."createdAt" ${getOperatorSQL(rule.operator)} NOW() - INTERVAL '${days} days'
            `);
          }
          break;
      }
    }
    
    // If we have conditions, query the backend API
    if (whereConditions.length > 0) {
      const response = await fetch(`${BACKEND_URL}/api/v2/segments/estimate-size`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) {
        throw new Error(`Failed to estimate segment size: ${response.status}`);
      }

      const result = await response.json();
      return result.count || 0;
    }
    
    // Fallback to reasonable estimates
    switch(rules.conditions[0]?.field) {
      case 'email_opens':
        return 120;
      case 'email_clicks':
        return 75;
      case 'last_activity':
        return 200;
      case 'signup_date':
        return 50;
      default:
        return 100;
    }
  } catch (error) {
    logger.error("Error estimating segment size", error);
    return 0;
  }
}

/**
 * Convert a rule operator to SQL syntax
 */
function getOperatorSQL(operator: string): string {
  switch (operator) {
    case 'eq': return '=';
    case 'gt': return '>';
    case 'lt': return '<';
    case 'gte': return '>=';
    case 'lte': return '<=';
    case 'contains': return 'LIKE';
    case 'in': return 'IN';
    default: return '=';
  }
}

/**
 * Apply a segment to get matching contacts
 */
export async function getContactsInSegment(
  segmentId: string,
  limit = 100,
  offset = 0
): Promise<Contact[]> {
  try {
    // Get segment definition
    const response = await fetch(`${BACKEND_URL}/api/v2/smart-segments/${segmentId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch segment: ${response.status}`);
    }

    const segment = await response.json();

    if (!segment) {
      return [];
    }

    const rules: SegmentDefinition = JSON.parse(segment.rules);
    
    // Convert rules to a SQL WHERE clause (simplified version)
    const whereConditions: string[] = [];
    
    for (const rule of rules.conditions) {
      switch (rule.field) {
        case 'email_opens':
          whereConditions.push(`
            (SELECT COUNT(*) FROM "EmailActivity" 
             WHERE "EmailActivity"."contactId" = "Contact"."id" 
             AND "EmailActivity"."type" = 'OPENED') ${getOperatorSQL(rule.operator)} ${rule.value}
          `);
          break;
        
        case 'email_clicks':
          whereConditions.push(`
            (SELECT COUNT(*) FROM "EmailActivity" 
             WHERE "EmailActivity"."contactId" = "Contact"."id" 
             AND "EmailActivity"."type" = 'CLICKED') ${getOperatorSQL(rule.operator)} ${rule.value}
          `);
          break;
          
        case 'last_activity':
          // Parse value like "30 days"
          const dayMatch = String(rule.value).match(/(\d+)\s*days/);
          if (dayMatch) {
            const days = Number.parseInt(dayMatch[1]);
            whereConditions.push(`
              (SELECT MAX("timestamp") FROM "EmailActivity" 
               WHERE "EmailActivity"."contactId" = "Contact"."id")
               ${getOperatorSQL(rule.operator)} NOW() - INTERVAL '${days} days'
            `);
          }
          break;
          
        case 'signup_date':
          const signupDayMatch = String(rule.value).match(/(\d+)\s*days/);
          if (signupDayMatch) {
            const days = Number.parseInt(signupDayMatch[1]);
            whereConditions.push(`
              "Contact"."createdAt" ${getOperatorSQL(rule.operator)} NOW() - INTERVAL '${days} days'
            `);
          }
          break;
      }
    }
    
    // If we have conditions, query the backend API
    if (whereConditions.length > 0) {
      const contactsResponse = await fetch(
        `${BACKEND_URL}/api/v2/segments/${segmentId}/contacts?limit=${limit}&offset=${offset}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch segment contacts: ${contactsResponse.status}`);
      }

      const contacts = await contactsResponse.json();
      return contacts;
    }

    return [];
  } catch (error) {
    logger.error("Error getting contacts in segment", error);
    return [];
  }
} 