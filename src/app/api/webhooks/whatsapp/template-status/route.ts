/**
 * WhatsApp Template Status Webhook Endpoint
 * 
 * Handles Meta webhook notifications for template status updates.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { whatsappTemplateApproval } from '@/lib/whatsapp-template-approval';
import { logger } from '@/lib/logger';

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified successfully');
    return new NextResponse(challenge);
  }

  logger.warn('WhatsApp webhook verification failed', { mode, token });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Handle webhook notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('Received WhatsApp template webhook', { 
      object: body.object,
      entryCount: body.entry?.length 
    });

    // Verify the webhook signature (recommended for production)
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifyWebhookSignature(await request.text(), signature)) {
      logger.warn('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process template status updates
    if (body.object === 'whatsapp_business_account') {
      await whatsappTemplateApproval.handleTemplateStatusWebhook(body);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error processing WhatsApp template webhook', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  try {
    const crypto = require('crypto');
    const appSecret = process.env.META_APP_SECRET;
    
    if (!appSecret) {
      logger.warn('META_APP_SECRET not configured for webhook verification');
      return true; // Allow in development
    }

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error verifying webhook signature', { error });
    return false;
  }
}