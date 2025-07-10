/**
 * WhatsApp Template Retry Cron Job
 * 
 * Retries failed template submissions to Meta.
 */

import { NextResponse } from 'next/server';
import { whatsappTemplateApproval } from '@/lib/whatsapp-template-approval';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    logger.info('Starting WhatsApp template retry job');

    const results = await whatsappTemplateApproval.retryFailedTemplates();

    logger.info('WhatsApp template retry job completed', results);

    return NextResponse.json({
      success: true,
      message: 'Template retry job completed',
      results
    });

  } catch (error) {
    logger.error('Error in WhatsApp template retry job', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Template retry job failed' 
    }, { status: 500 });
  }
}