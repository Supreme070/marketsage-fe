import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const clickEvent = await request.json();

    // Validate required fields
    if (!clickEvent.sessionId || !clickEvent.visitorId || !clickEvent.page) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store click event in database
    await prisma.leadPulseTouchpoint.create({
      data: {
        id: clickEvent.id,
        visitor: {
          connect: { fingerprint: clickEvent.visitorId }
        },
        timestamp: new Date(clickEvent.timestamp),
        type: clickEvent.rageCick ? 'RAGE_CLICK' : 'CLICK',
        url: clickEvent.page,
        title: clickEvent.elementText || `${clickEvent.elementType} click`,
        metadata: {
          x: clickEvent.x,
          y: clickEvent.y,
          elementType: clickEvent.elementType,
          elementText: clickEvent.elementText,
          elementId: clickEvent.elementId,
          elementClass: clickEvent.elementClass,
          elementTag: clickEvent.elementTag,
          xpath: clickEvent.xpath,
          isAboveTheFold: clickEvent.isAboveTheFold,
          clickIntent: clickEvent.clickIntent,
          timeOnPage: clickEvent.timeOnPage,
          scrollDepth: clickEvent.scrollDepth,
          deviceType: clickEvent.deviceType,
          rageClick: clickEvent.rageCick,
          sessionId: clickEvent.sessionId
        },
        value: this.calculateClickValue(clickEvent)
      }
    });

    logger.info('Click event recorded', {
      sessionId: clickEvent.sessionId,
      elementType: clickEvent.elementType,
      intent: clickEvent.clickIntent,
      rageClick: clickEvent.rageCick
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error recording click event:', error);
    return NextResponse.json(
      { error: 'Failed to record click event' },
      { status: 500 }
    );
  }
}

function calculateClickValue(clickEvent: any): number {
  let value = 1; // Base value

  // Intent-based scoring
  switch (clickEvent.clickIntent) {
    case 'navigation': value += 5; break;
    case 'interaction': value += 3; break;
    case 'selection': value += 2; break;
    case 'exploration': value += 1; break;
  }

  // Element type bonuses
  if (clickEvent.elementType.includes('cta')) value += 10;
  if (clickEvent.elementType.includes('submit')) value += 8;
  if (clickEvent.elementType.includes('download')) value += 6;
  if (clickEvent.elementType.includes('link')) value += 2;

  // Engagement factors
  if (clickEvent.timeOnPage > 30000) value += 2; // 30+ seconds on page
  if (clickEvent.scrollDepth > 50) value += 2; // Deep scroll before click
  if (clickEvent.isAboveTheFold) value += 1; // Above fold interaction

  // Penalty for rage clicks
  if (clickEvent.rageCick) value -= 5;

  return Math.max(1, value);
}