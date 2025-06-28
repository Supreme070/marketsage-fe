import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * Visitor Lookup API
 * Attempts to find existing visitor by device fingerprint
 * Used for visitor identity recovery across sessions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      );
    }

    // Look for existing visitor with this fingerprint
    const existingVisitor = await prisma.leadPulseVisitor.findFirst({
      where: {
        OR: [
          { fingerprint },
          // Also check if fingerprint is stored in metadata
          {
            metadata: {
              path: ['deviceFingerprint'],
              equals: fingerprint
            }
          }
        ]
      },
      select: {
        id: true,
        fingerprint: true,
        firstVisit: true,
        lastVisit: true,
        totalVisits: true,
        engagementScore: true,
        city: true,
        country: true
      }
    });

    if (existingVisitor) {
      // Update last visit time
      await prisma.leadPulseVisitor.update({
        where: { id: existingVisitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 },
          isActive: true
        }
      });

      return NextResponse.json({
        visitorId: existingVisitor.fingerprint,
        isReturning: true,
        previousVisits: existingVisitor.totalVisits,
        engagementScore: existingVisitor.engagementScore,
        location: existingVisitor.city ? `${existingVisitor.city}, ${existingVisitor.country}` : null,
        firstVisit: existingVisitor.firstVisit,
        lastVisit: existingVisitor.lastVisit
      });
    } else {
      // No existing visitor found
      return NextResponse.json({
        visitorId: null,
        isReturning: false
      });
    }

  } catch (error) {
    console.error('Error in visitor lookup:', error);
    return NextResponse.json(
      { error: 'Failed to lookup visitor' },
      { status: 500 }
    );
  }
}