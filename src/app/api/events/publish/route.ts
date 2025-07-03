/**
 * Event Publishing API Endpoint
 * ==============================
 * 
 * Allows applications to publish customer events to the event bus
 * for AI decision making and automation triggers
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomerEventBus, CustomerEventType, EventPriority } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for event publishing
const PublishEventSchema = z.object({
  eventType: z.nativeEnum(CustomerEventType),
  contactId: z.string().optional(),
  organizationId: z.string(),
  priority: z.nativeEnum(EventPriority).optional().default(EventPriority.NORMAL),
  data: z.record(z.any()),
  source: z.string().optional(),
  correlationId: z.string().optional(),
  sessionId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = PublishEventSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid event data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const {
      eventType,
      contactId,
      organizationId,
      priority,
      data,
      source,
      correlationId,
      sessionId
    } = validationResult.data;

    // Check if user has access to the organization
    if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied to organization' },
        { status: 403 }
      );
    }

    // Get event bus and publish event
    const eventBus = getCustomerEventBus();
    
    const eventId = await eventBus.publishCustomerEvent(
      eventType,
      data,
      {
        contactId,
        organizationId,
        userId: session.user.id,
        priority,
        source: source || 'api',
        correlationId,
        sessionId
      }
    );

    logger.info('Customer event published via API', {
      eventId,
      eventType,
      contactId,
      organizationId,
      userId: session.user.id,
      priority,
      source
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId,
        eventType,
        contactId,
        organizationId,
        priority,
        publishedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to publish customer event via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to publish event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch event publishing
const BatchPublishEventSchema = z.object({
  events: z.array(PublishEventSchema).max(100) // Limit to 100 events per batch
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = BatchPublishEventSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid batch event data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { events } = validationResult.data;

    // Check access to all organizations
    for (const event of events) {
      if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== event.organizationId) {
        return NextResponse.json(
          { error: `Unauthorized - Access denied to organization ${event.organizationId}` },
          { status: 403 }
        );
      }
    }

    // Get event bus
    const eventBus = getCustomerEventBus();
    
    // Publish all events
    const results = [];
    
    for (const eventData of events) {
      try {
        const eventId = await eventBus.publishCustomerEvent(
          eventData.eventType,
          eventData.data,
          {
            contactId: eventData.contactId,
            organizationId: eventData.organizationId,
            userId: session.user.id,
            priority: eventData.priority,
            source: eventData.source || 'api-batch',
            correlationId: eventData.correlationId,
            sessionId: eventData.sessionId
          }
        );

        results.push({
          success: true,
          eventId,
          eventType: eventData.eventType,
          contactId: eventData.contactId,
          organizationId: eventData.organizationId
        });

      } catch (error) {
        results.push({
          success: false,
          eventType: eventData.eventType,
          contactId: eventData.contactId,
          organizationId: eventData.organizationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Batch customer events published via API', {
      totalEvents: events.length,
      successCount,
      failureCount,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: events.length,
        successCount,
        failureCount,
        results,
        publishedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to publish batch customer events via API', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to publish batch events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}