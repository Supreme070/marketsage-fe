import { type NextRequest, NextResponse } from 'next/server';
import { engagementScoreUpdater } from '@/lib/cron/engagement-score-updater';
import { logger } from '@/lib/logger';

// This should be called by a cron job every hour
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting scheduled engagement score update');
    
    // Update high-value visitors every hour
    const highValueResult = await engagementScoreUpdater.updateHighValueVisitorScores();
    
    // Check if we should do a full update (every 6 hours)
    const hour = new Date().getHours();
    let fullUpdateResult = null;
    
    if (hour % 6 === 0) {
      logger.info('Running full engagement score update');
      fullUpdateResult = await engagementScoreUpdater.updateAllScores();
      
      // Also cleanup stale scores during full update
      await engagementScoreUpdater.cleanupStaleScores();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      highValueUpdate: highValueResult,
      fullUpdate: fullUpdateResult,
      message: fullUpdateResult 
        ? 'Full engagement score update completed'
        : 'High-value visitor engagement scores updated'
    });

  } catch (error) {
    logger.error('Error in engagement score cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update engagement scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}