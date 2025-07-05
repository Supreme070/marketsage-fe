/**
 * Mobile SDK Events API Endpoint
 * ============================
 * Handles event ingestion from LeadPulse Mobile SDK
 */

import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get headers
    const headersList = headers();
    const apiKey = headersList.get('authorization')?.replace('Bearer ', '');
    const appVersion = headersList.get('x-app-version');
    const deviceId = headersList.get('x-device-id');

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { events, session, timestamp } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array required' },
        { status: 400 }
      );
    }

    logger.info('Mobile events received', {
      eventCount: events.length,
      sessionId: session?.id,
      deviceId,
      appVersion
    });

    // Process events in batches
    const processedEvents = [];
    
    for (const event of events) {
      try {
        const processedEvent = await processEvent(event, session, deviceId, appVersion);
        if (processedEvent) {
          processedEvents.push(processedEvent);
        }
      } catch (error) {
        logger.error('Failed to process event', {
          event,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Store session information
    if (session) {
      await storeSession(session, deviceId);
    }

    logger.info('Mobile events processed', {
      totalEvents: events.length,
      processedEvents: processedEvents.length,
      sessionId: session?.id
    });

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      total: events.length,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to process mobile events', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process individual event based on type
 */
async function processEvent(
  event: any,
  session: any,
  deviceId?: string | null,
  appVersion?: string | null
): Promise<any> {
  const baseData = {
    id: event.id,
    sessionId: event.sessionId,
    userId: event.userId || null,
    timestamp: new Date(event.timestamp),
    deviceId: deviceId || 'unknown',
    appVersion: appVersion || 'unknown',
    metadata: event.metadata || {}
  };

  // Handle different event types
  switch (event.event || event.type) {
    case 'app_start':
    case 'app_foreground':
    case 'app_background':
    case 'app_terminate':
    case 'app_crash':
      return await processLifecycleEvent(event, baseData);
    
    case 'screen_view':
    case 'button_tap':
    case 'swipe':
    case 'scroll':
    case 'form_submit':
    case 'purchase':
    case 'search':
    case 'custom':
      return await processUserAction(event, baseData);
    
    case 'app_startup':
    case 'screen_load':
    case 'api_call':
    case 'memory_usage':
    case 'cpu_usage':
    case 'battery_usage':
      return await processPerformanceMetric(event, baseData);
    
    default:
      logger.warn('Unknown event type', { event });
      return null;
  }
}

/**
 * Process app lifecycle events
 */
async function processLifecycleEvent(event: any, baseData: any) {
  try {
    // Store as LeadPulse touchpoint for consistency
    const touchpoint = await prisma.leadPulseTouchpoint.create({
      data: {
        id: baseData.id,
        fingerprint: baseData.deviceId,
        type: 'MOBILE_LIFECYCLE',
        url: `mobile://app/${event.event}`,
        title: `App ${event.event}`,
        timestamp: baseData.timestamp,
        sessionId: baseData.sessionId,
        metadata: {
          ...baseData.metadata,
          lifecycleEvent: event.event,
          duration: event.duration,
          previousEvent: event.metadata?.previousEvent,
          crashDetails: event.metadata?.crashDetails,
          batteryLevel: event.metadata?.batteryLevel,
          memoryUsage: event.metadata?.memoryUsage,
          storageUsage: event.metadata?.storageUsage,
          networkType: event.metadata?.networkType,
          appVersion: baseData.appVersion
        },
        device: event.metadata?.deviceModel || 'unknown',
        browser: `Mobile App ${baseData.appVersion}`,
        os: event.metadata?.osVersion || 'unknown',
        country: event.metadata?.country || null,
        city: event.metadata?.city || null,
        utm_source: 'mobile_app',
        utm_medium: 'app',
        utm_campaign: event.event
      }
    });

    // For crash events, store additional crash data
    if (event.event === 'app_crash' && event.metadata?.crashDetails) {
      // You could store crash details in a separate table
      logger.error('Mobile app crash reported', {
        sessionId: baseData.sessionId,
        deviceId: baseData.deviceId,
        error: event.metadata.crashDetails.error,
        stackTrace: event.metadata.crashDetails.stackTrace,
        breadcrumbs: event.metadata.crashDetails.breadcrumbs
      });
    }

    return touchpoint;
  } catch (error) {
    logger.error('Failed to store lifecycle event', { event, error });
    throw error;
  }
}

/**
 * Process user action events
 */
async function processUserAction(event: any, baseData: any) {
  try {
    const touchpoint = await prisma.leadPulseTouchpoint.create({
      data: {
        id: baseData.id,
        fingerprint: baseData.deviceId,
        type: 'MOBILE_ACTION',
        url: `mobile://app/${event.screen}`,
        title: event.element || event.screen,
        timestamp: baseData.timestamp,
        sessionId: baseData.sessionId,
        metadata: {
          ...baseData.metadata,
          actionType: event.type,
          screen: event.screen,
          element: event.element,
          value: event.value,
          coordinates: event.coordinates,
          screenDimensions: event.metadata?.screenDimensions,
          viewportSize: event.metadata?.viewportSize,
          orientation: event.metadata?.orientation,
          connectionType: event.metadata?.connectionType,
          loadTime: event.metadata?.loadTime,
          scrollDepth: event.metadata?.scrollDepth,
          appVersion: baseData.appVersion
        },
        device: event.metadata?.deviceModel || 'mobile',
        browser: `Mobile App ${baseData.appVersion}`,
        os: event.metadata?.osVersion || 'unknown',
        utm_source: 'mobile_app',
        utm_medium: 'app',
        utm_campaign: event.type
      }
    });

    // Track conversion events
    if (event.type === 'purchase') {
      await trackMobileConversion(event, baseData);
    }

    return touchpoint;
  } catch (error) {
    logger.error('Failed to store user action', { event, error });
    throw error;
  }
}

/**
 * Process performance metrics
 */
async function processPerformanceMetric(event: any, baseData: any) {
  try {
    // Store performance metrics as touchpoints with special type
    const touchpoint = await prisma.leadPulseTouchpoint.create({
      data: {
        id: baseData.id,
        fingerprint: baseData.deviceId,
        type: 'MOBILE_PERFORMANCE',
        url: `mobile://performance/${event.type}`,
        title: `Performance: ${event.type}`,
        timestamp: baseData.timestamp,
        sessionId: baseData.sessionId,
        metadata: {
          ...baseData.metadata,
          performanceType: event.type,
          value: event.value,
          unit: event.unit,
          screen: event.metadata?.screen,
          apiEndpoint: event.metadata?.apiEndpoint,
          method: event.metadata?.method,
          statusCode: event.metadata?.statusCode,
          responseSize: event.metadata?.responseSize,
          appVersion: baseData.appVersion
        },
        device: event.metadata?.deviceModel || 'mobile',
        browser: `Mobile App ${baseData.appVersion}`,
        os: event.metadata?.osVersion || 'unknown',
        utm_source: 'mobile_app',
        utm_medium: 'performance',
        utm_campaign: event.type
      }
    });

    return touchpoint;
  } catch (error) {
    logger.error('Failed to store performance metric', { event, error });
    throw error;
  }
}

/**
 * Store mobile session information
 */
async function storeSession(session: any, deviceId?: string | null) {
  try {
    // Check if visitor exists
    let visitor = await prisma.leadPulseVisitor.findFirst({
      where: {
        fingerprint: deviceId || session.deviceId
      }
    });

    // Create visitor if doesn't exist
    if (!visitor) {
      visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: deviceId || session.deviceId,
          first_visit: new Date(session.startTime),
          last_visit: new Date(),
          visit_count: 1,
          page_views: session.screenViews || 0,
          session_duration: session.duration || 0,
          bounce_rate: session.screenViews <= 1 ? 100 : 0,
          device: session.metadata?.deviceModel || 'mobile',
          browser: `Mobile App ${session.metadata?.appVersion}`,
          os: session.metadata?.osVersion || 'unknown',
          country: session.metadata?.country || null,
          city: session.metadata?.city || null,
          referrer: session.metadata?.referrer || 'mobile_app',
          utm_source: 'mobile_app',
          utm_medium: 'app',
          is_mobile: true,
          metadata: {
            deviceType: session.metadata?.deviceType,
            appVersion: session.metadata?.appVersion,
            osVersion: session.metadata?.osVersion,
            networkType: session.metadata?.networkType,
            timezone: session.metadata?.timezone,
            firstSession: session.metadata?.firstSession,
            sessionId: session.id,
            actions: session.actions,
            crashes: session.crashes
          }
        }
      });
    } else {
      // Update existing visitor
      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          last_visit: new Date(),
          visit_count: { increment: 1 },
          page_views: { increment: session.screenViews || 0 },
          session_duration: session.duration || visitor.session_duration,
          metadata: {
            ...visitor.metadata,
            lastSessionId: session.id,
            lastAppVersion: session.metadata?.appVersion,
            totalActions: (visitor.metadata as any)?.totalActions ? 
              (visitor.metadata as any).totalActions + (session.actions || 0) : 
              session.actions || 0,
            totalCrashes: (visitor.metadata as any)?.totalCrashes ? 
              (visitor.metadata as any).totalCrashes + (session.crashes || 0) : 
              session.crashes || 0
          }
        }
      });
    }

    logger.info('Mobile session stored', {
      visitorId: visitor.id,
      sessionId: session.id,
      deviceId: deviceId || session.deviceId
    });

  } catch (error) {
    logger.error('Failed to store mobile session', { session, error });
    throw error;
  }
}

/**
 * Track mobile conversion events
 */
async function trackMobileConversion(event: any, baseData: any) {
  try {
    // Create conversion event
    await prisma.conversionEvent.create({
      data: {
        id: `mobile_${baseData.id}`,
        visitor_fingerprint: baseData.deviceId,
        event_type: 'purchase',
        event_value: Number.parseFloat(event.value?.toString() || '0'),
        currency: event.metadata?.currency || 'USD',
        timestamp: baseData.timestamp,
        metadata: {
          ...baseData.metadata,
          productId: event.element,
          screen: event.screen,
          appVersion: baseData.appVersion,
          source: 'mobile_app'
        }
      }
    });

    logger.info('Mobile conversion tracked', {
      sessionId: baseData.sessionId,
      value: event.value,
      productId: event.element
    });

  } catch (error) {
    logger.error('Failed to track mobile conversion', { event, error });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'mobile-events-api',
    timestamp: new Date().toISOString()
  });
}