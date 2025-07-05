/**
 * Event Bus Initialization API Endpoint
 * =====================================
 * 
 * Initializes the Customer Event Bus and sets up AI decision handlers
 * This should be called once when the application starts
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow SUPER_ADMIN to initialize the event bus
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    logger.info('Initializing Customer Event Bus system', {
      userId: session.user.id,
      userRole: session.user.role
    });

    // Dynamic imports to prevent circular dependencies
    const { initializeCustomerEventBus, CustomerEventType } = await import('@/lib/events/event-bus');
    const { AIDecisionHandler } = await import('@/lib/events/handlers/ai-decision-handler');

    // Initialize the event bus connection
    const eventBus = await initializeCustomerEventBus();

    // Subscribe AI Decision Handler to all relevant customer events
    const customerEvents = [
      CustomerEventType.CONTACT_CREATED,
      CustomerEventType.CONTACT_EMAIL_OPENED,
      CustomerEventType.CONTACT_EMAIL_CLICKED,
      CustomerEventType.CONTACT_SMS_REPLIED,
      CustomerEventType.CONTACT_WHATSAPP_REPLIED,
      CustomerEventType.WEBSITE_VISIT,
      CustomerEventType.FORM_SUBMISSION,
      CustomerEventType.PURCHASE_COMPLETED,
      CustomerEventType.CART_ABANDONMENT,
      CustomerEventType.CHURN_RISK_DETECTED,
      CustomerEventType.HIGH_VALUE_DETECTED,
      CustomerEventType.BIRTHDAY_DETECTED,
      CustomerEventType.ANNIVERSARY_DETECTED,
      CustomerEventType.CAMPAIGN_OPENED,
      CustomerEventType.CAMPAIGN_CLICKED,
      CustomerEventType.CAMPAIGN_CONVERTED,
      CustomerEventType.WORKFLOW_COMPLETED,
      CustomerEventType.AI_INSIGHT_GENERATED
    ];

    // Subscribe AI Decision Handler to each event type
    for (const eventType of customerEvents) {
      await eventBus.subscribe(eventType, AIDecisionHandler.handleCustomerEvent);
    }

    // Subscribe to pattern for all high-priority events
    await eventBus.subscribePattern(
      'marketsage:events:*:high', 
      AIDecisionHandler.handleCustomerEvent
    );

    // Subscribe to pattern for all critical events
    await eventBus.subscribePattern(
      'marketsage:events:*:critical', 
      AIDecisionHandler.handleCustomerEvent
    );

    // Get event bus statistics
    const stats = await eventBus.getEventStats();

    logger.info('Customer Event Bus system initialized successfully', {
      subscribedEvents: customerEvents.length,
      totalHandlers: stats.totalHandlers,
      connectionStatus: stats.connectionStatus,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Customer Event Bus system initialized successfully',
      data: {
        subscribedEvents: customerEvents.length,
        eventTypes: customerEvents,
        stats: stats,
        aiDecisionHandlerActive: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to initialize Customer Event Bus system', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to initialize Event Bus system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dynamic import to prevent circular dependencies
    const { getCustomerEventBus } = await import('@/lib/events/event-bus');
    
    // Get current event bus status
    const eventBus = getCustomerEventBus();
    const stats = await eventBus.getEventStats();

    return NextResponse.json({
      success: true,
      data: {
        eventBusStatus: stats.connectionStatus,
        subscribedChannels: stats.subscribedChannels,
        patternSubscriptions: stats.patternSubscriptions,
        totalHandlers: stats.totalHandlers,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get Event Bus status', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get Event Bus status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}