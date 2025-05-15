import { NextRequest, NextResponse } from 'next/server';
import { generateSmartSegments, getContactsInSegment } from '@/lib/smart-segmentation';
import { initializeAIFeatures } from '@/lib/ai-features-init';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET smart segment suggestions
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Initialize AI features if needed
    await initializeAIFeatures();
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const minEngagementScore = searchParams.get('minEngagementScore') 
      ? parseFloat(searchParams.get('minEngagementScore')!) 
      : undefined;
    const maxInactivityDays = searchParams.get('maxInactivityDays') 
      ? parseInt(searchParams.get('maxInactivityDays')!) 
      : undefined;
    
    // Generate smart segments
    const segments = await generateSmartSegments({
      minEngagementScore,
      maxInactivityDays
    });
    
    return NextResponse.json(segments);
  } catch (error) {
    logger.error("Error generating smart segments", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET contacts in a specific smart segment
 * 
 * Route: /api/segments/smart/{segmentId}/contacts
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Initialize AI features if needed
    await initializeAIFeatures();
    
    // Parse request body
    const body = await request.json();
    
    // Validate segmentId
    if (!body.segmentId) {
      return NextResponse.json(
        { error: "Missing segmentId" },
        { status: 400 }
      );
    }
    
    // Get pagination parameters
    const limit = body.limit || 100;
    const offset = body.offset || 0;
    
    // Get contacts in segment
    const contacts = await getContactsInSegment(
      body.segmentId,
      limit,
      offset
    );
    
    return NextResponse.json({
      contacts,
      pagination: {
        limit,
        offset,
        total: contacts.length === limit ? limit + 1 : offset + contacts.length // Estimate
      }
    });
  } catch (error) {
    logger.error("Error getting contacts in smart segment", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 