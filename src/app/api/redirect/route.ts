import { type NextRequest, NextResponse } from 'next/server';
import { ActivityType, EntityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { initializeAIFeatures } from '@/lib/ai-features-init';

/**
 * Redirect handler with tracking
 * This endpoint tracks link clicks and then redirects to the target URL
 * 
 * Query parameters:
 * - url: The target URL to redirect to (required, URL encoded)
 * - cid: Contact ID (required)
 * - eid: Entity ID (campaign, etc.) (required)
 * - type: Entity type (default: EMAIL_CAMPAIGN)
 * - meta: Additional metadata (optional, JSON encoded)
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize AI features if needed
    await initializeAIFeatures();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const encodedUrl = searchParams.get('url');
    const contactId = searchParams.get('cid');
    const entityId = searchParams.get('eid');
    const entityType = (searchParams.get('type') as EntityType) || EntityType.EMAIL_CAMPAIGN;
    const encodedMeta = searchParams.get('meta');
    
    // Validate required parameters
    if (!encodedUrl || !contactId || !entityId) {
      logger.warn('Missing required parameters for redirect tracking', { 
        encodedUrl, 
        contactId, 
        entityId,
        url: request.url
      });
      
      return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // Decode the URL and metadata
    let url: string;
    try {
      url = decodeURIComponent(encodedUrl);
    } catch (error) {
      logger.error('Failed to decode URL', { encodedUrl, error });
      return new NextResponse('Invalid URL', { status: 400 });
    }
    
    let additionalMetadata: Record<string, any> = {};
    
    if (encodedMeta) {
      try {
        additionalMetadata = JSON.parse(decodeURIComponent(encodedMeta));
      } catch (error) {
        logger.warn('Failed to parse metadata', { encodedMeta, error });
      }
    }
    
    // Collect request information
    const metadata = {
      url,
      userAgent: request.headers.get('user-agent') || 'Unknown',
      referer: request.headers.get('referer') || 'Unknown',
      ip: 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'Unknown',
      timestamp: new Date().toISOString(),
      source: 'link_click',
      ...additionalMetadata,
    };
    
    // Record the click based on entity type
    switch (entityType) {
      case EntityType.EMAIL_CAMPAIGN:
        await prisma.emailActivity.create({
          data: {
            id: randomUUID(),
            campaignId: entityId,
            contactId: contactId,
            type: ActivityType.CLICKED,
            metadata: JSON.stringify(metadata),
          },
        });
        break;
        
      case EntityType.SMS_CAMPAIGN:
        await prisma.sMSActivity.create({
          data: {
            id: randomUUID(),
            campaignId: entityId,
            contactId: contactId,
            type: ActivityType.CLICKED,
            metadata: JSON.stringify(metadata),
          },
        });
        break;
        
      case EntityType.WHATSAPP_CAMPAIGN:
        await prisma.whatsAppActivity.create({
          data: {
            id: randomUUID(),
            campaignId: entityId,
            contactId: contactId,
            type: ActivityType.CLICKED,
            metadata: JSON.stringify(metadata),
          },
        });
        break;
        
      default:
        logger.warn(`Unsupported entity type for click tracking: ${entityType}`, {
          contactId,
          entityId,
        });
    }
    
    logger.info('Recorded click event', {
      contactId,
      entityId,
      entityType,
      url,
    });
    
    // Redirect to the target URL
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error('Error processing redirect', error);
    
    // If something fails, provide a simple error page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Redirect Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h1>Redirect Error</h1>
          <p>Sorry, we couldn't process your redirect. Please try again later.</p>
          <p><a href="/">Return to Home</a></p>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 500,
      }
    );
  }
}

// Make sure this route is dynamic to avoid caching
export const dynamic = 'force-dynamic'; 