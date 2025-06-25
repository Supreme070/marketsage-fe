/**
 * LeadPulse Webhook System API
 * 
 * Endpoints for managing webhook configurations and processing webhooks
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookSystem, type WebhookEndpoint, type IncomingWebhook } from '@/lib/leadpulse/integrations/webhook-system';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET: List webhook endpoints or get webhook stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhookId');
    const type = searchParams.get('type'); // 'outgoing' or 'incoming'
    const stats = searchParams.get('stats'); // 'true' to get stats

    if (webhookId && stats === 'true') {
      // Get webhook statistics
      const webhookStats = await webhookSystem.getWebhookStats(webhookId);
      
      if (!webhookStats) {
        return NextResponse.json({
          success: false,
          error: 'Webhook not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        stats: webhookStats,
      });
    }

    // Get user's webhook endpoints
    const whereClause: any = { userId: session.user.id };
    
    let webhooks: any[] = [];
    
    if (type === 'incoming') {
      webhooks = await prisma.incomingWebhook.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Default to outgoing webhooks
      webhooks = await prisma.webhookEndpoint.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      webhooks,
      total: webhooks.length,
      type: type || 'outgoing',
    });

  } catch (error) {
    logger.error('Error listing webhooks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list webhooks',
    }, { status: 500 });
  }
}

/**
 * POST: Create new webhook endpoint or trigger webhook event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, webhook, event, data, type } = body;

    if (action === 'trigger') {
      // Trigger a webhook event
      if (!event) {
        return NextResponse.json({
          success: false,
          error: 'Event type is required',
        }, { status: 400 });
      }

      const result = await webhookSystem.triggerWebhook(event, data, session.user.id);
      
      return NextResponse.json({
        success: result.success,
        deliveries: result.deliveries,
        error: result.error,
      });
    }

    // Create new webhook endpoint
    if (!webhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook configuration is required',
      }, { status: 400 });
    }

    if (type === 'incoming') {
      // Create incoming webhook
      const incomingWebhook: Omit<IncomingWebhook, 'id' | 'userId'> = {
        name: webhook.name,
        url: webhook.url,
        processor: webhook.processor || 'default',
        active: webhook.active !== false,
        security: webhook.security || {
          validateSignature: false,
        },
        mapping: webhook.mapping || {
          eventType: 'generic',
          dataMapping: {},
        },
      };

      // Validate incoming webhook configuration
      const validation = validateIncomingWebhook(incomingWebhook);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: validation.error,
        }, { status: 400 });
      }

      // Store in database
      const created = await prisma.incomingWebhook.create({
        data: {
          ...incomingWebhook,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        webhookId: created.id,
        message: 'Incoming webhook created successfully',
        url: `/api/leadpulse/integrations/webhooks/incoming/${created.id}`,
      });

    } else {
      // Create outgoing webhook endpoint
      const outgoingWebhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'successCount' | 'failureCount' | 'userId'> = {
        url: webhook.url,
        events: webhook.events || [],
        active: webhook.active !== false,
        secret: webhook.secret,
        headers: webhook.headers || {},
        timeout: webhook.timeout || 10000,
        retryConfig: webhook.retryConfig || {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
          maxDelay: 30000,
        },
        filters: webhook.filters,
        transformations: webhook.transformations,
      };

      // Validate outgoing webhook configuration
      const validation = validateOutgoingWebhook(outgoingWebhook);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: validation.error,
        }, { status: 400 });
      }

      const result = await webhookSystem.registerWebhook(session.user.id, outgoingWebhook);

      if (result.success) {
        return NextResponse.json({
          success: true,
          webhookId: result.webhookId,
          message: 'Webhook endpoint registered successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
        }, { status: 400 });
      }
    }

  } catch (error) {
    logger.error('Error creating webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create webhook',
    }, { status: 500 });
  }
}

/**
 * PUT: Update webhook endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { webhookId, updates, type } = body;

    if (!webhookId) {
      return NextResponse.json({
        success: false,
        error: 'Webhook ID is required',
      }, { status: 400 });
    }

    if (type === 'incoming') {
      // Update incoming webhook
      const existing = await prisma.incomingWebhook.findFirst({
        where: { id: webhookId, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json({
          success: false,
          error: 'Incoming webhook not found',
        }, { status: 404 });
      }

      await prisma.incomingWebhook.update({
        where: { id: webhookId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Incoming webhook updated successfully',
      });

    } else {
      // Update outgoing webhook endpoint
      const existing = await prisma.webhookEndpoint.findFirst({
        where: { id: webhookId, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json({
          success: false,
          error: 'Webhook endpoint not found',
        }, { status: 404 });
      }

      await prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook endpoint updated successfully',
      });
    }

  } catch (error) {
    logger.error('Error updating webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update webhook',
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove webhook endpoint
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhookId');
    const type = searchParams.get('type');

    if (!webhookId) {
      return NextResponse.json({
        success: false,
        error: 'Webhook ID is required',
      }, { status: 400 });
    }

    if (type === 'incoming') {
      // Delete incoming webhook
      const existing = await prisma.incomingWebhook.findFirst({
        where: { id: webhookId, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json({
          success: false,
          error: 'Incoming webhook not found',
        }, { status: 404 });
      }

      await prisma.incomingWebhook.delete({
        where: { id: webhookId },
      });

      return NextResponse.json({
        success: true,
        message: 'Incoming webhook deleted successfully',
      });

    } else {
      // Delete outgoing webhook endpoint
      const existing = await prisma.webhookEndpoint.findFirst({
        where: { id: webhookId, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json({
          success: false,
          error: 'Webhook endpoint not found',
        }, { status: 404 });
      }

      // Disable the webhook first
      const disableResult = await webhookSystem.disableWebhook(webhookId);
      if (!disableResult) {
        logger.warn(`Failed to disable webhook ${webhookId} before deletion`);
      }

      // Delete from database
      await prisma.webhookEndpoint.delete({
        where: { id: webhookId },
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook endpoint deleted successfully',
      });
    }

  } catch (error) {
    logger.error('Error deleting webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete webhook',
    }, { status: 500 });
  }
}

// Validation helpers
function validateOutgoingWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'successCount' | 'failureCount' | 'userId'>): { valid: boolean; error?: string } {
  try {
    // Validate URL
    try {
      new URL(webhook.url);
    } catch {
      return { valid: false, error: 'Invalid webhook URL' };
    }

    // Validate events
    if (!webhook.events || webhook.events.length === 0) {
      return { valid: false, error: 'At least one event type must be specified' };
    }

    const validEvents = [
      'visitor.created', 'visitor.updated', 'visitor.converted',
      'touchpoint.created', 'form.submitted', 'segment.updated',
      'alert.triggered', 'error.occurred', 'analytics.updated'
    ];

    for (const event of webhook.events) {
      if (!validEvents.includes(event)) {
        return { valid: false, error: `Invalid event type: ${event}` };
      }
    }

    // Validate timeout
    if (webhook.timeout && (webhook.timeout < 1000 || webhook.timeout > 60000)) {
      return { valid: false, error: 'Timeout must be between 1000ms and 60000ms' };
    }

    // Validate retry configuration
    if (webhook.retryConfig) {
      const { maxRetries, backoffMultiplier, initialDelay, maxDelay } = webhook.retryConfig;
      
      if (maxRetries < 0 || maxRetries > 10) {
        return { valid: false, error: 'Max retries must be between 0 and 10' };
      }
      
      if (backoffMultiplier < 1 || backoffMultiplier > 5) {
        return { valid: false, error: 'Backoff multiplier must be between 1 and 5' };
      }
      
      if (initialDelay < 100 || initialDelay > 10000) {
        return { valid: false, error: 'Initial delay must be between 100ms and 10000ms' };
      }
      
      if (maxDelay < 1000 || maxDelay > 300000) {
        return { valid: false, error: 'Max delay must be between 1000ms and 300000ms' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid webhook configuration' };
  }
}

function validateIncomingWebhook(webhook: Omit<IncomingWebhook, 'id' | 'userId'>): { valid: boolean; error?: string } {
  try {
    // Validate name
    if (!webhook.name || webhook.name.trim().length === 0) {
      return { valid: false, error: 'Webhook name is required' };
    }

    // Validate URL path
    if (!webhook.url || !webhook.url.startsWith('/')) {
      return { valid: false, error: 'URL path must start with /' };
    }

    // Validate processor
    const validProcessors = ['crm_contact_sync', 'form_submission', 'visitor_update', 'default'];
    if (!validProcessors.includes(webhook.processor)) {
      return { valid: false, error: 'Invalid processor type' };
    }

    // Validate mapping
    if (!webhook.mapping || !webhook.mapping.eventType) {
      return { valid: false, error: 'Event type mapping is required' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid incoming webhook configuration' };
  }
}