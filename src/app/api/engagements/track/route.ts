import { NextRequest, NextResponse } from 'next/server';
import { recordEngagement } from '@/lib/engagement-tracking';
import { initializeAIFeatures } from '@/lib/ai-features-init';
import { logger } from '@/lib/logger';
import { ActivityType, EntityType } from '@prisma/client';

/**
 * API endpoint to track engagement events
 * 
 * Example POST body:
 * {
 *   "contactId": "cuid123",
 *   "entityType": "EMAIL_CAMPAIGN",
 *   "entityId": "cuid456",
 *   "activityType": "OPENED",
 *   "metadata": {
 *     "userAgent": "Mozilla/5.0...",
 *     "ipAddress": "123.456.789.0"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize AI features if needed
    await initializeAIFeatures();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.contactId || !body.entityType || !body.entityId || !body.activityType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate entity type
    if (!Object.values(EntityType).includes(body.entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }
    
    // Validate activity type
    if (!Object.values(ActivityType).includes(body.activityType)) {
      return NextResponse.json(
        { error: "Invalid activity type" },
        { status: 400 }
      );
    }
    
    // Record the engagement
    await recordEngagement(
      body.contactId,
      body.entityType as EntityType,
      body.entityId,
      body.activityType as ActivityType,
      body.metadata
    );
    
    logger.info("Recorded engagement event", {
      contactId: body.contactId,
      entityType: body.entityType,
      entityId: body.entityId,
      activityType: body.activityType
    });
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error tracking engagement", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow this endpoint to be used from client-side tracking pixels
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 