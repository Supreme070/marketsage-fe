/**
 * SMS Scheduler Cron Job Endpoint
 * 
 * Processes scheduled SMS campaigns that are due for execution.
 * Should be called by a cron service every 1-2 minutes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { smsSchedulerService } from '@/lib/sms-scheduler-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized SMS scheduler cron request', {
        authHeader: authHeader ? 'provided' : 'missing'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    
    // Get stats before processing
    const statsBefore = await smsSchedulerService.getScheduleStats();
    
    // Process scheduled campaigns
    await smsSchedulerService.processScheduledCampaigns();
    
    // Get stats after processing
    const statsAfter = await smsSchedulerService.getScheduleStats();
    
    // Calculate processing metrics
    const processingTime = Date.now() - startTime;
    const processed = statsBefore.pending - statsAfter.pending;
    
    logger.info('SMS scheduler cron job completed', {
      processingTime,
      processed,
      statsBefore,
      statsAfter
    });

    return NextResponse.json({
      success: true,
      processingTime,
      processed,
      stats: {
        before: statsBefore,
        after: statsAfter
      }
    });
  } catch (error) {
    logger.error('SMS scheduler cron job failed', { error });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET for health checks and manual monitoring
export async function GET() {
  try {
    const stats = await smsSchedulerService.getScheduleStats();
    
    return NextResponse.json({
      service: 'SMS Scheduler Service',
      status: 'healthy',
      stats,
      nextCheck: new Date(Date.now() + 60000).toISOString() // Suggest next check in 1 minute
    });
  } catch (error) {
    return NextResponse.json({
      service: 'SMS Scheduler Service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}