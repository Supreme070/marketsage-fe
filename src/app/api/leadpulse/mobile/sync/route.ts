import { NextRequest, NextResponse } from 'next/server';
import { leadPulseOfflineSyncService } from '@/lib/leadpulse/offline-sync-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const initSessionSchema = z.object({
  deviceId: z.string().min(1),
  sessionId: z.string().min(1),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android', 'web']),
    osVersion: z.string(),
    appVersion: z.string(),
    deviceModel: z.string(),
    screenSize: z.string(),
    userAgent: z.string().optional(),
    language: z.string(),
    timezone: z.string()
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    timestamp: z.string().datetime(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional()
  }).optional()
});

const queueEventsSchema = z.object({
  sessionId: z.string().min(1),
  events: z.array(z.object({
    localEventId: z.string().min(1),
    eventType: z.string().min(1),
    eventData: z.any(),
    url: z.string().optional(),
    timestamp: z.string().datetime()
  })).min(1).max(100) // Limit batch size
});

const syncDataSchema = z.object({
  deviceId: z.string().min(1),
  connectionType: z.enum(['wifi', 'cellular', 'unknown']).default('unknown'),
  networkSpeed: z.enum(['slow', 'fast', 'unknown']).default('unknown'),
  batchSize: z.number().min(1).max(100).default(50)
});

// Initialize offline session
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'init_session';

    switch (action) {
      case 'init_session':
        return await handleInitSession(request);
      case 'queue_events':
        return await handleQueueEvents(request);
      case 'sync_data':
        return await handleSyncData(request);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Mobile sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const syncStatus = await leadPulseOfflineSyncService.getSyncStatus(deviceId);

    if (!syncStatus) {
      return NextResponse.json({ error: 'No active session found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: syncStatus
    });

  } catch (error) {
    logger.error('Error getting sync status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleInitSession(request: NextRequest) {
  const body = await request.json();
  const validatedData = initSessionSchema.parse(body);

  const location = validatedData.location ? {
    ...validatedData.location,
    timestamp: new Date(validatedData.location.timestamp)
  } : undefined;

  const sessionId = await leadPulseOfflineSyncService.initializeOfflineSession(
    validatedData.deviceId,
    validatedData.sessionId,
    validatedData.deviceInfo,
    location
  );

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      message: 'Offline session initialized successfully'
    }
  }, { status: 201 });
}

async function handleQueueEvents(request: NextRequest) {
  const body = await request.json();
  const validatedData = queueEventsSchema.parse(body);

  const events = validatedData.events.map(event => ({
    ...event,
    timestamp: new Date(event.timestamp)
  }));

  await leadPulseOfflineSyncService.queueOfflineEvents(
    validatedData.sessionId,
    events
  );

  return NextResponse.json({
    success: true,
    data: {
      eventsQueued: events.length,
      message: 'Events queued for synchronization'
    }
  });
}

async function handleSyncData(request: NextRequest) {
  const body = await request.json();
  const validatedData = syncDataSchema.parse(body);

  const syncResult = await leadPulseOfflineSyncService.synchronizeOfflineData(
    validatedData.deviceId,
    validatedData.connectionType,
    validatedData.networkSpeed
  );

  return NextResponse.json({
    success: true,
    data: {
      syncResult,
      message: syncResult.success ? 'Data synchronized successfully' : 'Partial synchronization completed'
    }
  });
}