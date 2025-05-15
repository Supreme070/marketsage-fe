/**
 * AI Features Library for MarketSage
 * 
 * This library provides AI-powered features without requiring external AI APIs:
 * - Content generation using templates and basic NLP
 * - Smart segmentation using statistical analysis
 * - Send time optimization based on historical engagement data
 * - Natural language campaign building
 */

import prisma from '@/lib/db/prisma';
import { ActivityType, EntityType } from '@prisma/client';
import { logger } from '@/lib/logger';

// Enum to match the one in schema.prisma
export enum ContentTemplateType {
  EMAIL_SUBJECT = 'EMAIL_SUBJECT',
  EMAIL_BODY = 'EMAIL_BODY',
  SMS_MESSAGE = 'SMS_MESSAGE',
  WHATSAPP_MESSAGE = 'WHATSAPP_MESSAGE',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION'
}

// Types for AI features
export interface ContentGenerationParams {
  type: ContentTemplateType;
  industry?: string;
  keywords?: string[];
  contactSegment?: string;
  tone?: string;
}

export interface SmartSegmentParams {
  minEngagementScore?: number;
  maxInactivityDays?: number;
  minPurchaseValue?: number;
  activityTypes?: ActivityType[];
}

export interface SendTimeParams {
  contactId: string;
  entityType?: EntityType;
  minConfidence?: number;
}

export interface NLCommandResult {
  action?: string;
  audience?: string;
  schedule?: string;
  template?: string;
  subject?: string;
  content?: string;
}

/**
 * Generate content based on templates and basic rules
 */
export async function generateContent(params: ContentGenerationParams): Promise<string> {
  try {
    // Find appropriate templates by direct query until contentTemplate is available
    // This is a temporary workaround until we migrate the schema
    const templates = await prisma.$queryRaw<Array<{id: string, template: string}>>`
      SELECT id, template FROM "ContentTemplate" 
      WHERE type = ${params.type}
      ${params.industry ? `AND industry = ${params.industry}` : ''}
      LIMIT 5
    `;

    if (templates.length === 0) {
      // Fall back to default templates if none found for specific industry
      const defaultTemplates = getDefaultTemplates(params.type);
      return processTemplate(defaultTemplates[Math.floor(Math.random() * defaultTemplates.length)], params);
    }

    // Get a random template from the matches
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Process the template with keywords
    return processTemplate(template.template, params);
  } catch (error) {
    logger.error("Error generating content", error);
    return getDefaultContent(params.type);
  }
}

/**
 * Apply keywords and rules to a content template
 */
function processTemplate(template: string, params: ContentGenerationParams): string {
  let processed = template;
  
  // Replace keyword placeholders
  if (params.keywords && params.keywords.length > 0) {
    // Sort keywords by relevance/importance (just using length as a simple proxy)
    const sortedKeywords = [...params.keywords].sort((a, b) => b.length - a.length);
    
    // Replace {keyword} with the most important keyword
    processed = processed.replace(/\{keyword\}/g, sortedKeywords[0]);
    
    // Replace {keyword1}, {keyword2}, etc. with corresponding keywords
    sortedKeywords.forEach((keyword, index) => {
      processed = processed.replace(new RegExp(`\\{keyword${index + 1}\\}`, 'g'), keyword);
    });
    
    // Replace any remaining {keywordN} placeholders with the last keyword
    const lastKeyword = sortedKeywords[sortedKeywords.length - 1];
    processed = processed.replace(/\{keyword\d+\}/g, lastKeyword);
  }
  
  // Handle other placeholder types
  processed = processed.replace(/\{date\}/g, new Date().toLocaleDateString());
  processed = processed.replace(/\{time\}/g, new Date().toLocaleTimeString());
  
  // Handle tone adjustments if specified
  if (params.tone) {
    processed = adjustTone(processed, params.tone);
  }
  
  return processed;
}

/**
 * Adjust the tone of content
 */
function adjustTone(content: string, tone: string): string {
  switch (tone.toLowerCase()) {
    case 'formal':
      return content
        .replace(/hey/gi, 'Hello')
        .replace(/hi there/gi, 'Greetings')
        .replace(/thanks/gi, 'Thank you')
        .replace(/!+/g, '.');
    case 'friendly':
      return content
        .replace(/hello/gi, 'Hey there')
        .replace(/greetings/gi, 'Hi')
        .replace(/\./g, match => Math.random() > 0.7 ? '!' : match);
    case 'urgent':
      return content
        .replace(/\./g, '!')
        .replace(/soon/gi, 'now')
        .replace(/consider/gi, 'act on')
        .toUpperCase();
    default:
      return content;
  }
}

/**
 * Get default templates for different content types
 */
function getDefaultTemplates(type: ContentTemplateType): string[] {
  switch (type) {
    case 'EMAIL_SUBJECT':
      return [
        "Don't miss our special {keyword} offer",
        "{keyword}: Limited time promotion inside",
        "Your exclusive {keyword} update",
        "New {keyword} collection available now",
        "{keyword1} and {keyword2}: Perfect together"
      ];
    case 'EMAIL_BODY':
      return [
        "Hello,\n\nWe're excited to share our latest {keyword} collection with you. Check out the exclusive selection we've prepared for you.\n\nBest regards,\nThe Team",
        "Hi there,\n\nThought you might be interested in our new {keyword} offering. It's perfect for anyone looking to improve their {keyword2} experience.\n\nCheers,\nThe Team",
        "Greetings,\n\nJust a quick note to let you know about our {keyword} promotion. Limited time only!\n\nThank you,\nThe Team"
      ];
    case 'SMS_MESSAGE':
      return [
        "{keyword} deal: 20% off today only! Shop now",
        "New {keyword} just arrived! Reply YES for details",
        "Your {keyword} order is confirmed. Track at our website"
      ];
    case 'WHATSAPP_MESSAGE':
      return [
        "Hi! We thought you'd like to know about our new {keyword} service. Would you like more info?",
        "Hello! Your {keyword} order #12345 has been shipped. Tracking: https://example.com/track",
        "Special offer for you: 15% off all {keyword} products this week! Shop now: https://example.com/shop"
      ];
    default:
      return ["New {keyword} update for you"];
  }
}

/**
 * Get fallback content if template processing fails
 */
function getDefaultContent(type: ContentTemplateType): string {
  switch (type) {
    case 'EMAIL_SUBJECT':
      return "Special offer inside";
    case 'EMAIL_BODY':
      return "Hello,\n\nThank you for being our customer. We have some exciting offers for you.\n\nBest regards,\nThe Team";
    case 'SMS_MESSAGE':
      return "New deals available now! Check our website for details.";
    case 'WHATSAPP_MESSAGE':
      return "Hello! We have some news to share with you. Would you like to know more?";
    default:
      return "Thank you for your interest in our products and services.";
  }
}

/**
 * Get optimized send time for a contact
 */
export async function getOptimalSendTime(
  params: SendTimeParams
): Promise<{ dayOfWeek: number; hourOfDay: number; confidence: number } | null> {
  try {
    // Use raw query as a temporary solution until schema migration
    const optimization = await prisma.$queryRaw<Array<{dayOfWeek: number, hourOfDay: number, confidenceLevel: number}>>`
      SELECT "dayOfWeek", "hourOfDay", "confidenceLevel" 
      FROM "SendTimeOptimization"
      WHERE "contactId" = ${params.contactId}
      AND "confidenceLevel" >= ${params.minConfidence || 0.3}
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
    
    // Raw query for engagement times
    const engagements = await prisma.$queryRaw<Array<{dayOfWeek: number, hourOfDay: number, timestamp: Date}>>`
      SELECT "dayOfWeek", "hourOfDay", timestamp
      FROM "EngagementTime"
      WHERE "contactId" = ${params.contactId}
      ${params.entityType ? `AND "entityType" = ${params.entityType}` : ''}
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    
    if (engagements.length === 0) {
      // Fall back to general best practices if no data
      return {
        dayOfWeek: 2, // Tuesday
        hourOfDay: 10, // 10 AM
        confidence: 0.2,
      };
    }
    
    // Aggregate by day/hour and find most common engagement time
    const timeCounts: Record<string, { count: number; dayOfWeek: number; hourOfDay: number }> = {};
    
    engagements.forEach((engagement) => {
      const key = `${engagement.dayOfWeek}-${engagement.hourOfDay}`;
      if (!timeCounts[key]) {
        timeCounts[key] = { count: 0, dayOfWeek: engagement.dayOfWeek, hourOfDay: engagement.hourOfDay };
      }
      timeCounts[key].count++;
    });
    
    // Find the time with most engagements
    const bestTime = Object.values(timeCounts).sort((a, b) => b.count - a.count)[0];
    
    // Calculate confidence based on data points and recency
    const confidence = Math.min(bestTime.count / 10, 1);
    
    // Store this result for future reference via raw query
    await prisma.$executeRaw`
      INSERT INTO "SendTimeOptimization" ("id", "contactId", "dayOfWeek", "hourOfDay", "engagementScore", "confidenceLevel", "lastUpdated")
      VALUES (
        gen_random_uuid(), 
        ${params.contactId}, 
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
    logger.error("Error determining optimal send time", error);
    return null;
  }
}

/**
 * Record engagement time for optimization
 */
export async function recordEngagementTime(
  contactId: string,
  entityType: EntityType,
  entityId: string,
  engagementType: ActivityType
): Promise<void> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6, 0 is Sunday
    const hourOfDay = now.getHours(); // 0-23
    
    // Use raw query until schema migration is complete
    await prisma.$executeRaw`
      INSERT INTO "EngagementTime" (
        "id", "contactId", "entityType", "entityId", "engagementType", 
        "dayOfWeek", "hourOfDay", "timestamp"
      )
      VALUES (
        gen_random_uuid(), 
        ${contactId}, 
        ${entityType}, 
        ${entityId}, 
        ${engagementType}, 
        ${dayOfWeek}, 
        ${hourOfDay}, 
        ${now}
      )
    `;
    
    logger.info("Recorded engagement time", {
      contactId,
      entityType,
      entityId,
      engagementType,
      dayOfWeek,
      hourOfDay,
    });
  } catch (error) {
    logger.error("Error recording engagement time", error);
  }
}

/**
 * Generate smart segment suggestions
 */
export async function generateSmartSegments(
  params: SmartSegmentParams = {}
): Promise<{ id: string; name: string; description: string; rules: string; score: number }[]> {
  try {
    // First, check if we already have smart segments via raw query
    const existingSegments = await prisma.$queryRaw<Array<{id: string, name: string, description: string, rules: string, score: number}>>`
      SELECT id, name, description, rules, score 
      FROM "SmartSegment"
      WHERE status = 'ACTIVE'
    `;
    
    if (existingSegments.length > 0) {
      return existingSegments;
    }
    
    // Generate some basic segments based on engagement patterns
    const segments = [
      {
        name: "High Engagement",
        description: "Contacts who frequently open and click emails",
        rules: JSON.stringify({
          operator: "AND",
          conditions: [
            { field: "email_opens", operator: "gt", value: 5 },
            { field: "email_clicks", operator: "gt", value: 2 },
            { field: "last_activity", operator: "lt", value: "30 days" }
          ]
        }),
        score: 0.9
      },
      {
        name: "At Risk",
        description: "Previously active contacts who haven't engaged recently",
        rules: JSON.stringify({
          operator: "AND",
          conditions: [
            { field: "email_opens", operator: "gt", value: 5 },
            { field: "last_activity", operator: "gt", value: "60 days" },
            { field: "last_activity", operator: "lt", value: "120 days" }
          ]
        }),
        score: 0.85
      },
      {
        name: "New Subscribers",
        description: "Recently added contacts who are new to your lists",
        rules: JSON.stringify({
          operator: "AND",
          conditions: [
            { field: "signup_date", operator: "gt", value: "30 days" }
          ]
        }),
        score: 0.8
      },
      {
        name: "Inactive",
        description: "Contacts who haven't engaged in a long time",
        rules: JSON.stringify({
          operator: "AND",
          conditions: [
            { field: "last_activity", operator: "gt", value: "120 days" }
          ]
        }),
        score: 0.75
      }
    ];
    
    // Store these segments for future use via raw queries
    const createdSegments = [];
    
    for (const segment of segments) {
      const result = await prisma.$queryRaw<Array<{id: string, name: string, description: string, rules: string, score: number}>>`
        INSERT INTO "SmartSegment" (
          id, name, description, rules, score, status, "createdAt", "lastUpdated"
        )
        VALUES (
          gen_random_uuid(),
          ${segment.name},
          ${segment.description},
          ${segment.rules},
          ${segment.score},
          'ACTIVE',
          NOW(),
          NOW()
        )
        RETURNING id, name, description, rules, score
      `;
      
      if (result.length > 0) {
        createdSegments.push(result[0]);
      }
    }
    
    return createdSegments;
  } catch (error) {
    logger.error("Error generating smart segments", error);
    return [];
  }
}

/**
 * Parse natural language command for campaign creation
 */
export function parseNaturalLanguageCommand(command: string): NLCommandResult {
  try {
    const result: NLCommandResult = {};
    
    // Extract audience (to/for/targeting)
    const audienceRegex = /(?:to|for|targeting)\s+([^,;.]+)/i;
    const audienceMatch = command.match(audienceRegex);
    if (audienceMatch && audienceMatch[1]) {
      result.audience = audienceMatch[1].trim();
    }
    
    // Extract schedule (on/at/schedule)
    const scheduleRegex = /(?:on|at|scheduled? for)\s+([^,;.]+)/i;
    const scheduleMatch = command.match(scheduleRegex);
    if (scheduleMatch && scheduleMatch[1]) {
      result.schedule = scheduleMatch[1].trim();
    }
    
    // Extract template (using/with template/design)
    const templateRegex = /(?:using|with template|template)\s+([^,;.]+)/i;
    const templateMatch = command.match(templateRegex);
    if (templateMatch && templateMatch[1]) {
      result.template = templateMatch[1].trim();
    }
    
    // Extract subject (with subject/titled/about)
    const subjectRegex = /(?:with subject|titled|about)\s+"([^"]+)"/i;
    const subjectMatch = command.match(subjectRegex);
    if (subjectMatch && subjectMatch[1]) {
      result.subject = subjectMatch[1].trim();
    }
    
    // Determine action (create/schedule/draft/send)
    if (/schedule|plan/i.test(command)) {
      result.action = "schedule";
    } else if (/send|dispatch/i.test(command)) {
      result.action = "send";
    } else if (/draft|prepare/i.test(command)) {
      result.action = "draft";
    } else {
      result.action = "create";
    }
    
    return result;
  } catch (error) {
    logger.error("Error parsing natural language command", error);
    return {};
  }
}

// Export default helpers for templates
export const defaultTemplates = {
  getEmailSubjectTemplates: () => getDefaultTemplates(ContentTemplateType.EMAIL_SUBJECT),
  getEmailBodyTemplates: () => getDefaultTemplates(ContentTemplateType.EMAIL_BODY),
  getSmsTemplates: () => getDefaultTemplates(ContentTemplateType.SMS_MESSAGE),
  getWhatsAppTemplates: () => getDefaultTemplates(ContentTemplateType.WHATSAPP_MESSAGE),
}; 