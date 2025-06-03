import { type NextRequest, NextResponse } from 'next/server';
import { ActivityType, EntityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { initializeAIFeatures } from '@/lib/ai-features-init';

/**
 * Transparent 1x1 pixel GIF in base64 format
 */
const TRANSPARENT_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * GET handler for tracking pixel
 * 
 * Query parameters:
 * - cid: Contact ID (required)
 * - eid: Entity ID (campaign, etc.) (required)
 * - type: Entity type (default: EMAIL_CAMPAIGN)
 * - t: Timestamp (for cache busting)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize AI features if needed
    await initializeAIFeatures();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('cid');
    const entityId = searchParams.get('eid');
    const entityType = (searchParams.get('type') as EntityType) || EntityType.EMAIL_CAMPAIGN;
    
    // Always return the transparent pixel, even if parameters are missing
    // This ensures the email displays correctly regardless of tracking errors
    const headers = {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // If missing required parameters, return the pixel but don't track
    if (!contactId || !entityId) {
      logger.warn('Missing required tracking parameters', { 
        contactId, 
        entityId,
        url: request.url 
      });
      return new NextResponse(TRANSPARENT_PIXEL, { headers });
    }
    
    // Check if this is a duplicate open
    let existingOpen = false;
    
    if (entityType === EntityType.EMAIL_CAMPAIGN) {
      const existing = await prisma.emailActivity.findFirst({
        where: {
          campaignId: entityId,
          contactId: contactId,
          type: ActivityType.OPENED,
        },
      });
      
      if (existing) {
        existingOpen = true;
      }
    }
    
    // If not a duplicate, record the open
    if (!existingOpen) {
      // Get additional info from request
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const referer = request.headers.get('referer') || 'Unknown';
      const ip = 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'Unknown';
      
      // Record activity based on entity type
      switch (entityType) {
        case EntityType.EMAIL_CAMPAIGN:
          await prisma.emailActivity.create({
            data: {
              id: randomUUID(),
              campaignId: entityId,
              contactId: contactId,
              type: ActivityType.OPENED,
              metadata: JSON.stringify({
                userAgent,
                referer,
                ip,
                timestamp: new Date().toISOString(),
                source: 'tracking_pixel',
              }),
            },
          });
          break;
          
        // Add other entity types here as needed, for now SMS and WhatsApp
        // just log a warning since we don't typically track opens with pixels for these
        case EntityType.SMS_CAMPAIGN:
        case EntityType.WHATSAPP_CAMPAIGN:
          logger.warn(`Tracking pixel not typically used for ${entityType}`, {
            contactId,
            entityId,
          });
          break;
          
        default:
          logger.warn(`Unsupported entity type for tracking: ${entityType}`, {
            contactId,
            entityId,
          });
      }
      
      logger.info('Recorded open event via tracking pixel', {
        contactId,
        entityId,
        entityType,
      });
    }
    
    // Always return the pixel, regardless of whether tracking was recorded
    return new NextResponse(TRANSPARENT_PIXEL, { headers });
  } catch (error) {
    logger.error('Error processing tracking pixel', error);
    
    // If there's an error, still return the pixel so the email displays correctly
    return new NextResponse(TRANSPARENT_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

// Make sure this route is dynamic to avoid caching
export const dynamic = 'force-dynamic'; 