/**
 * WhatsApp Retry Cron Job Endpoint
 * 
 * Processes pending WhatsApp retries on a scheduled basis.
 * Should be called by a cron service every 5-10 minutes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { whatsappRetryService } from '@/lib/whatsapp-retry-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized WhatsApp retry cron request', {
        authHeader: authHeader ? 'provided' : 'missing'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    
    // Get stats before processing
    const statsBefore = await whatsappRetryService.getRetryStats();
    
    // Process retry queue
    await whatsappRetryService.processRetryQueue();
    
    // Get stats after processing
    const statsAfter = await whatsappRetryService.getRetryStats();
    
    // Calculate processing metrics
    const processingTime = Date.now() - startTime;
    const processed = statsBefore.pending - statsAfter.pending;
    
    logger.info('WhatsApp retry cron job completed', {
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
    logger.error('WhatsApp retry cron job failed', { error });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET for health checks
export async function GET() {
  try {
    const stats = await whatsappRetryService.getRetryStats();
    
    return NextResponse.json({
      service: 'WhatsApp Retry Service',
      status: 'healthy',
      stats
    });
  } catch (error) {
    return NextResponse.json({
      service: 'WhatsApp Retry Service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}