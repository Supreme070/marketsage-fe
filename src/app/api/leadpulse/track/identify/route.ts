import { type NextRequest, NextResponse } from 'next/server';
import { generateVisitorFingerprint, trackAnonymousVisitor } from '@/lib/leadpulse/visitorTracking';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * Visitor identification endpoint for LeadPulse
 * Identifies visitors and returns visitor ID
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.pixelId || !body.fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if pixel ID is valid
    const pixelConfig = await prisma.leadPulseConfig.findUnique({
      where: { pixelId: body.pixelId }
    });
    
    if (!pixelConfig) {
      return NextResponse.json(
        { error: 'Invalid pixel ID' },
        { status: 400 }
      );
    }
    
    // If we have an existing visitor ID, try to fetch that visitor
    let visitor = null;
    if (body.existingId) {
      visitor = await prisma.anonymousVisitor.findUnique({
        where: { id: body.existingId }
      });
    }
    
    // If visitor wasn't found by ID, look up by fingerprint
    if (!visitor) {
      visitor = await prisma.anonymousVisitor.findUnique({
        where: { fingerprint: body.fingerprint }
      });
    }
    
    // Extract visitor metadata
    const metadata: Record<string, any> = {
      userAgent: body.userAgent || request.headers.get('user-agent'),
      referrer: body.referrer,
      url: body.url,
      language: body.language,
      screenSize: body.screenSize,
      timezone: body.timezone
    };
    
    // If visitor exists, update it, otherwise create a new one
    if (visitor) {
      visitor = await prisma.anonymousVisitor.update({
        where: { id: visitor.id },
        data: {
          lastVisitedAt: new Date(),
          visits: { increment: 1 },
          ipAddress: ip,
          ...metadata
        }
      });
      
      logger.info('Updated existing visitor', {
        pixelId: body.pixelId,
        visitorId: visitor.id
      });
    } else {
      // Create a new visitor
      visitor = await trackAnonymousVisitor(body.fingerprint, ip, metadata);
      
      logger.info('Created new visitor', {
        pixelId: body.pixelId,
        visitorId: visitor.id
      });
    }
    
    // Return the visitor ID
    return NextResponse.json(
      { success: true, visitorId: visitor.id },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error identifying visitor', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 