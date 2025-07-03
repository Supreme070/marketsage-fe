import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const scrollEvent = await request.json();

    // Validate required fields
    if (!scrollEvent.sessionId || !scrollEvent.visitorId || !scrollEvent.page) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store scroll depth event in database
    await prisma.leadPulseTouchpoint.create({
      data: {
        id: scrollEvent.id,
        visitor: {
          connect: { fingerprint: scrollEvent.visitorId }
        },
        timestamp: new Date(scrollEvent.timestamp),
        type: 'SCROLL_DEPTH',
        url: scrollEvent.page,
        title: `Scroll ${scrollEvent.depth}%`,
        metadata: {
          depth: scrollEvent.depth,
          timeToReach: scrollEvent.timeToReach,
          viewportHeight: scrollEvent.viewportHeight,
          documentHeight: scrollEvent.documentHeight,
          scrollVelocity: scrollEvent.scrollVelocity,
          isEngaged: scrollEvent.isEngaged,
          sessionId: scrollEvent.sessionId
        },
        value: Math.round(scrollEvent.depth / 10) // Value based on depth achieved
      }
    });

    logger.info('Scroll depth event recorded', {
      sessionId: scrollEvent.sessionId,
      depth: scrollEvent.depth,
      isEngaged: scrollEvent.isEngaged
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error recording scroll depth event:', error);
    return NextResponse.json(
      { error: 'Failed to record scroll depth event' },
      { status: 500 }
    );
  }
}