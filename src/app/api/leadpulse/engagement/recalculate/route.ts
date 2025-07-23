import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { engagementScoringEngine } from '@/lib/leadpulse/engagement-scoring-engine';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorIds, recalculateAll = false, batchSize = 100 } = await request.json();

    if (!recalculateAll && (!visitorIds || !Array.isArray(visitorIds))) {
      return NextResponse.json(
        { error: 'Invalid input. Provide visitorIds array or set recalculateAll to true' },
        { status: 400 }
      );
    }

    let targetVisitorIds: string[] = visitorIds || [];
    
    // If recalculateAll is true, get all visitor IDs
    if (recalculateAll) {
      const allVisitors = await prisma.anonymousVisitor.findMany({
        select: { id: true },
        where: {
          isActive: true,
          lastVisit: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Active in last 90 days
          }
        }
      });
      targetVisitorIds = allVisitors.map(v => v.id);
    }

    // Process in batches
    const results = {
      total: targetVisitorIds.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < targetVisitorIds.length; i += batchSize) {
      const batch = targetVisitorIds.slice(i, i + batchSize);
      
      try {
        const batchScores = await engagementScoringEngine.batchCalculateScores(batch);
        
        // Update scores in database
        for (const [visitorId, score] of batchScores) {
          try {
            await prisma.anonymousVisitor.update({
              where: { id: visitorId },
              data: {
                engagementScore: score.score,
                score: score.score,
                metadata: {
                  engagementDetails: score,
                  lastRecalculated: new Date().toISOString()
                }
              }
            });
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update visitor ${visitorId}: ${error}`);
          }
        }
        
        results.processed += batch.length;
      } catch (error) {
        logger.error('Batch processing error:', error);
        results.failed += batch.length;
        results.errors.push(`Batch error: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Recalculated engagement scores for ${results.successful} visitors`
    });

  } catch (error) {
    logger.error('Error in engagement recalculation:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate engagement scores' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId parameter is required' },
        { status: 400 }
      );
    }

    const score = await engagementScoringEngine.calculateScore({
      visitorId,
      includeAnonymous: true,
      timeRange: 30,
      realTimeBoost: true
    });

    return NextResponse.json({
      success: true,
      score
    });

  } catch (error) {
    logger.error('Error calculating engagement score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate engagement score' },
      { status: 500 }
    );
  }
}