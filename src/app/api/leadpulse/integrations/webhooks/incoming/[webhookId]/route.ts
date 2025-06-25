/**
 * Incoming Webhook Processor
 * 
 * Handles incoming webhook requests for specific webhook IDs
 */

import { type NextRequest, NextResponse } from 'next/server';
import { webhookSystem } from '@/lib/leadpulse/integrations/webhook-system';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST: Process incoming webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const webhookId = params.webhookId;
    
    if (!webhookId) {
      return NextResponse.json({
        success: false,
        error: 'Webhook ID is required',
      }, { status: 400 });
    }

    // Get request headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get request body
    let body: any;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
      }, { status: 400 });
    }

    // Get source IP for security validation
    const sourceIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';

    // Process the webhook
    const result = await webhookSystem.processIncomingWebhook(
      webhookId,
      headers,
      body,
      sourceIP
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        processed: result.processed,
      });
    } else {
      const statusCode = result.error === 'Webhook not found' ? 404 :
                        result.error === 'Webhook is disabled' ? 403 :
                        result.error === 'IP not allowed' ? 403 :
                        result.error === 'Invalid signature' ? 401 : 400;

      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: statusCode });
    }

  } catch (error) {
    logger.error('Error processing incoming webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * GET: Get webhook information (for debugging)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const webhookId = params.webhookId;
    
    if (!webhookId) {
      return NextResponse.json({
        success: false,
        error: 'Webhook ID is required',
      }, { status: 400 });
    }

    // Return basic webhook info without sensitive data
    return NextResponse.json({
      success: true,
      webhookId,
      endpoint: `/api/leadpulse/integrations/webhooks/incoming/${webhookId}`,
      methods: ['POST'],
      message: 'Webhook endpoint is active and ready to receive requests',
    });

  } catch (error) {
    logger.error('Error getting webhook info:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * OPTIONS: Handle preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature, X-Hub-Signature, X-GitHub-Event, X-Slack-Signature',
    },
  });
}