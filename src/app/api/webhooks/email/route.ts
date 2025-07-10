/**
 * Email Provider Webhook Endpoint
 * 
 * Handles webhooks from email service providers for delivery status updates,
 * bounces, spam reports, and other email events.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { ActivityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// POST - Handle email provider webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Log the incoming webhook for debugging
    logger.info('Email webhook received', {
      userAgent,
      bodyKeys: Object.keys(body),
      timestamp: new Date().toISOString()
    });

    // Handle different email provider webhook formats
    const provider = detectEmailProvider(userAgent, body);
    
    switch (provider) {
      case 'sendgrid':
        return await handleSendGridWebhook(body);
      case 'mailgun':
        return await handleMailgunWebhook(body);
      case 'postmark':
        return await handlePostmarkWebhook(body);
      case 'ses':
        return await handleSESWebhook(body);
      case 'smtp':
        return await handleGenericSMTPWebhook(body);
      default:
        logger.warn('Unknown email provider webhook', { userAgent, body });
        return NextResponse.json({ success: true, message: 'Webhook received but not processed' });
    }

  } catch (error) {
    logger.error('Error processing email webhook', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, { status: 500 });
  }
}

// Detect email provider from webhook
function detectEmailProvider(userAgent: string, body: any): string {
  if (userAgent.includes('SendGrid')) return 'sendgrid';
  if (userAgent.includes('Mailgun')) return 'mailgun';
  if (userAgent.includes('Postmark')) return 'postmark';
  if (body.Type && body.Type.includes('Amazon')) return 'ses';
  if (body.event_type || body.eventType) return 'smtp'; // Generic SMTP webhook
  return 'unknown';
}

// Handle SendGrid webhooks
async function handleSendGridWebhook(events: any[]): Promise<NextResponse> {
  let processedCount = 0;
  
  for (const event of events) {
    try {
      const { email, event: eventType, timestamp, sg_message_id } = event;
      
      // Find the contact and campaign from the email
      const result = await findContactAndCampaign(email, sg_message_id);
      if (!result) continue;

      const { contact, campaignId } = result;
      const activityType = mapSendGridEventToActivity(eventType);
      
      if (activityType) {
        await createEmailActivity(campaignId, contact.id, activityType, {
          provider: 'sendgrid',
          messageId: sg_message_id,
          providerEvent: eventType,
          email,
          timestamp: new Date(timestamp * 1000).toISOString()
        });
        processedCount++;
      }
    } catch (error) {
      logger.warn('Failed to process SendGrid event', { error, event });
    }
  }

  return NextResponse.json({ 
    success: true, 
    processed: processedCount,
    provider: 'sendgrid'
  });
}

// Handle Mailgun webhooks
async function handleMailgunWebhook(body: any): Promise<NextResponse> {
  try {
    const { 'event-data': eventData } = body;
    if (!eventData) return NextResponse.json({ success: true, message: 'No event data' });

    const { event, recipient, message, timestamp } = eventData;
    const messageId = message?.headers?.['message-id'];

    const result = await findContactAndCampaign(recipient, messageId);
    if (!result) return NextResponse.json({ success: true, message: 'Contact/campaign not found' });

    const { contact, campaignId } = result;
    const activityType = mapMailgunEventToActivity(event);

    if (activityType) {
      await createEmailActivity(campaignId, contact.id, activityType, {
        provider: 'mailgun',
        messageId,
        providerEvent: event,
        email: recipient,
        timestamp: new Date(timestamp * 1000).toISOString()
      });
    }

    return NextResponse.json({ success: true, provider: 'mailgun' });
  } catch (error) {
    logger.error('Error processing Mailgun webhook', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Handle Postmark webhooks
async function handlePostmarkWebhook(body: any): Promise<NextResponse> {
  try {
    const { Type, Email, MessageID, DeliveredAt, BouncedAt } = body;

    const result = await findContactAndCampaign(Email, MessageID);
    if (!result) return NextResponse.json({ success: true, message: 'Contact/campaign not found' });

    const { contact, campaignId } = result;
    const activityType = mapPostmarkEventToActivity(Type);

    if (activityType) {
      await createEmailActivity(campaignId, contact.id, activityType, {
        provider: 'postmark',
        messageId: MessageID,
        providerEvent: Type,
        email: Email,
        timestamp: DeliveredAt || BouncedAt || new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, provider: 'postmark' });
  } catch (error) {
    logger.error('Error processing Postmark webhook', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Handle Amazon SES webhooks
async function handleSESWebhook(body: any): Promise<NextResponse> {
  try {
    const { Message } = body;
    const message = JSON.parse(Message);
    const { eventType, mail, delivery, bounce } = message;

    const email = mail?.commonHeaders?.to?.[0] || mail?.destination?.[0];
    const messageId = mail?.messageId;

    const result = await findContactAndCampaign(email, messageId);
    if (!result) return NextResponse.json({ success: true, message: 'Contact/campaign not found' });

    const { contact, campaignId } = result;
    const activityType = mapSESEventToActivity(eventType);

    if (activityType) {
      await createEmailActivity(campaignId, contact.id, activityType, {
        provider: 'ses',
        messageId,
        providerEvent: eventType,
        email,
        timestamp: delivery?.timestamp || bounce?.timestamp || new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, provider: 'ses' });
  } catch (error) {
    logger.error('Error processing SES webhook', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Handle generic SMTP webhooks
async function handleGenericSMTPWebhook(body: any): Promise<NextResponse> {
  try {
    const { email, event_type, message_id, timestamp } = body;

    const result = await findContactAndCampaign(email, message_id);
    if (!result) return NextResponse.json({ success: true, message: 'Contact/campaign not found' });

    const { contact, campaignId } = result;
    const activityType = mapGenericEventToActivity(event_type);

    if (activityType) {
      await createEmailActivity(campaignId, contact.id, activityType, {
        provider: 'smtp',
        messageId: message_id,
        providerEvent: event_type,
        email,
        timestamp: timestamp || new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, provider: 'smtp' });
  } catch (error) {
    logger.error('Error processing generic SMTP webhook', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Helper function to find contact and campaign
async function findContactAndCampaign(email: string, messageId: string): Promise<{
  contact: { id: string; email: string };
  campaignId: string;
} | null> {
  try {
    // First try to find by message ID in existing activities
    if (messageId) {
      const activity = await prisma.emailActivity.findFirst({
        where: {
          metadata: {
            contains: messageId
          }
        },
        include: {
          contact: true,
          campaign: true
        }
      });

      if (activity) {
        return {
          contact: activity.contact,
          campaignId: activity.campaignId
        };
      }
    }

    // Fallback: find the most recent campaign for this email
    const contact = await prisma.contact.findFirst({
      where: { email }
    });

    if (!contact) return null;

    const recentActivity = await prisma.emailActivity.findFirst({
      where: {
        contactId: contact.id,
        type: ActivityType.SENT
      },
      orderBy: { timestamp: 'desc' }
    });

    if (!recentActivity) return null;

    return {
      contact,
      campaignId: recentActivity.campaignId
    };
  } catch (error) {
    logger.error('Error finding contact and campaign', { error, email, messageId });
    return null;
  }
}

// Helper function to create email activity
async function createEmailActivity(
  campaignId: string,
  contactId: string,
  type: ActivityType,
  metadata: any
): Promise<void> {
  try {
    await prisma.emailActivity.create({
      data: {
        id: randomUUID(),
        campaignId,
        contactId,
        type,
        metadata: JSON.stringify(metadata),
      },
    });

    logger.info('Email activity recorded from webhook', {
      campaignId,
      contactId,
      type,
      provider: metadata.provider
    });
  } catch (error) {
    logger.error('Failed to create email activity from webhook', {
      error,
      campaignId,
      contactId,
      type
    });
  }
}

// Event mapping functions
function mapSendGridEventToActivity(event: string): ActivityType | null {
  switch (event) {
    case 'delivered': return ActivityType.DELIVERED;
    case 'bounce': return ActivityType.BOUNCED;
    case 'open': return ActivityType.OPENED;
    case 'click': return ActivityType.CLICKED;
    case 'unsubscribe': return ActivityType.UNSUBSCRIBED;
    case 'spamreport': return ActivityType.SPAM;
    default: return null;
  }
}

function mapMailgunEventToActivity(event: string): ActivityType | null {
  switch (event) {
    case 'delivered': return ActivityType.DELIVERED;
    case 'failed': return ActivityType.BOUNCED;
    case 'opened': return ActivityType.OPENED;
    case 'clicked': return ActivityType.CLICKED;
    case 'unsubscribed': return ActivityType.UNSUBSCRIBED;
    case 'complained': return ActivityType.SPAM;
    default: return null;
  }
}

function mapPostmarkEventToActivity(type: string): ActivityType | null {
  switch (type) {
    case 'Delivery': return ActivityType.DELIVERED;
    case 'Bounce': return ActivityType.BOUNCED;
    case 'Open': return ActivityType.OPENED;
    case 'Click': return ActivityType.CLICKED;
    case 'SpamComplaint': return ActivityType.SPAM;
    default: return null;
  }
}

function mapSESEventToActivity(event: string): ActivityType | null {
  switch (event) {
    case 'delivery': return ActivityType.DELIVERED;
    case 'bounce': return ActivityType.BOUNCED;
    case 'complaint': return ActivityType.SPAM;
    default: return null;
  }
}

function mapGenericEventToActivity(event: string): ActivityType | null {
  switch (event.toLowerCase()) {
    case 'delivered':
    case 'delivery': return ActivityType.DELIVERED;
    case 'bounced':
    case 'bounce': return ActivityType.BOUNCED;
    case 'opened':
    case 'open': return ActivityType.OPENED;
    case 'clicked':
    case 'click': return ActivityType.CLICKED;
    case 'unsubscribed':
    case 'unsubscribe': return ActivityType.UNSUBSCRIBED;
    case 'spam':
    case 'complaint': return ActivityType.SPAM;
    default: return null;
  }
}