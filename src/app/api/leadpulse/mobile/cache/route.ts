import { NextRequest, NextResponse } from 'next/server';
import { leadPulseOfflineSyncService } from '@/lib/leadpulse/offline-sync-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schemas
const setCacheSchema = z.object({
  deviceId: z.string().min(1),
  cacheKey: z.string().min(1),
  cacheType: z.enum(['USER_DATA', 'FORM_CONFIG', 'ANALYTICS_CONFIG', 'VISITOR_PROFILE', 'ENGAGEMENT_RULES', 'GEOGRAPHIC_DATA']),
  data: z.any(),
  ttlHours: z.number().min(1).max(168).default(24) // Max 1 week
});

const getCacheSchema = z.object({
  deviceId: z.string().min(1),
  cacheKey: z.string().min(1)
});

const bulkCacheSchema = z.object({
  deviceId: z.string().min(1),
  cacheKeys: z.array(z.string()).min(1).max(50) // Limit bulk requests
});

// Set cache data
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'set';

    switch (action) {
      case 'set':
        return await handleSetCache(request);
      case 'bulk_get':
        return await handleBulkGetCache(request);
      case 'prepare_offline':
        return await handlePrepareOffline(request);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Mobile cache API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get cache data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const cacheKey = searchParams.get('cacheKey');

    if (!deviceId || !cacheKey) {
      return NextResponse.json({ 
        error: 'Device ID and cache key are required' 
      }, { status: 400 });
    }

    const validatedData = getCacheSchema.parse({ deviceId, cacheKey });

    const cachedData = await leadPulseOfflineSyncService.getCachedDataForOffline(
      validatedData.deviceId,
      validatedData.cacheKey
    );

    if (!cachedData) {
      return NextResponse.json({ 
        error: 'Cache entry not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: cachedData
    });

  } catch (error) {
    logger.error('Error getting cache data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cache data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete cache data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const cacheKey = searchParams.get('cacheKey');

    if (!deviceId) {
      return NextResponse.json({ 
        error: 'Device ID is required' 
      }, { status: 400 });
    }

    let whereCondition: any = { deviceId };
    
    if (cacheKey) {
      whereCondition.cacheKey = cacheKey;
    }

    const deleted = await prisma.leadPulseOfflineCache.deleteMany({
      where: whereCondition
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleted.count,
        message: cacheKey ? `Cache entry deleted: ${cacheKey}` : 'All cache entries deleted for device'
      }
    });

  } catch (error) {
    logger.error('Error deleting cache data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete cache data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleSetCache(request: NextRequest) {
  const body = await request.json();
  const validatedData = setCacheSchema.parse(body);

  await leadPulseOfflineSyncService.cacheDataForOffline(
    validatedData.deviceId,
    validatedData.cacheKey,
    validatedData.cacheType,
    validatedData.data,
    validatedData.ttlHours
  );

  return NextResponse.json({
    success: true,
    data: {
      message: 'Data cached successfully',
      cacheKey: validatedData.cacheKey,
      expiresAt: new Date(Date.now() + validatedData.ttlHours * 60 * 60 * 1000)
    }
  });
}

async function handleBulkGetCache(request: NextRequest) {
  const body = await request.json();
  const validatedData = bulkCacheSchema.parse(body);

  const results: Record<string, any> = {};

  for (const cacheKey of validatedData.cacheKeys) {
    try {
      const cachedData = await leadPulseOfflineSyncService.getCachedDataForOffline(
        validatedData.deviceId,
        cacheKey
      );
      
      if (cachedData) {
        results[cacheKey] = cachedData;
      } else {
        results[cacheKey] = null;
      }
    } catch (error) {
      logger.error(`Error getting cache for key ${cacheKey}:`, error);
      results[cacheKey] = { error: 'Failed to retrieve cache' };
    }
  }

  return NextResponse.json({
    success: true,
    data: results
  });
}

async function handlePrepareOffline(request: NextRequest) {
  const { deviceId } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    // Prepare essential data for offline use
    const offlineData = await prepareEssentialOfflineData();

    // Cache all essential data
    const cachePromises = [
      // Cache form configurations
      leadPulseOfflineSyncService.cacheDataForOffline(
        deviceId,
        'forms_config',
        'FORM_CONFIG',
        offlineData.forms,
        48 // 48 hours
      ),
      
      // Cache analytics configuration
      leadPulseOfflineSyncService.cacheDataForOffline(
        deviceId,
        'analytics_config',
        'ANALYTICS_CONFIG',
        offlineData.analyticsConfig,
        72 // 72 hours
      ),
      
      // Cache engagement rules
      leadPulseOfflineSyncService.cacheDataForOffline(
        deviceId,
        'engagement_rules',
        'ENGAGEMENT_RULES',
        offlineData.engagementRules,
        72 // 72 hours
      ),
      
      // Cache geographic data for African markets
      leadPulseOfflineSyncService.cacheDataForOffline(
        deviceId,
        'geographic_data',
        'GEOGRAPHIC_DATA',
        offlineData.geographicData,
        168 // 1 week
      )
    ];

    await Promise.all(cachePromises);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Device prepared for offline use',
        cachedItems: [
          'forms_config',
          'analytics_config',
          'engagement_rules',
          'geographic_data'
        ],
        estimatedOfflineCapability: '48-72 hours'
      }
    });

  } catch (error) {
    logger.error('Error preparing device for offline:', error);
    return NextResponse.json(
      { 
        error: 'Failed to prepare device for offline use',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Prepare essential data for offline use
async function prepareEssentialOfflineData() {
  // Get active forms
  const forms = await prisma.leadPulseForm.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      fields: true,
      settings: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Analytics configuration for offline tracking
  const analyticsConfig = {
    trackingEnabled: true,
    batchSize: 50,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxStorageSize: 10 * 1024 * 1024, // 10MB
    eventTypes: [
      'page_view',
      'click',
      'form_submit',
      'form_start',
      'scroll',
      'time_on_page',
      'download',
      'video_play',
      'search'
    ],
    priorityEvents: ['form_submit', 'download', 'email_click'],
    compressionEnabled: true
  };

  // Engagement scoring rules
  const engagementRules = {
    scoring: {
      page_view: 1,
      click: 2,
      form_start: 5,
      form_submit: 10,
      download: 7,
      email_click: 5,
      video_play: 3,
      search: 4,
      time_on_page: {
        '30s': 1,
        '60s': 2,
        '120s': 3,
        '300s': 5
      }
    },
    timeDecay: 0.95,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    qualificationThreshold: 50,
    categories: {
      cold: { min: 0, max: 20 },
      warm: { min: 21, max: 50 },
      hot: { min: 51, max: 80 },
      qualified: { min: 81, max: 100 }
    }
  };

  // Geographic data for African markets
  const geographicData = {
    countries: {
      NG: {
        name: 'Nigeria',
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        businessHours: { start: '08:00', end: '18:00' },
        majorCities: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan']
      },
      KE: {
        name: 'Kenya',
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        businessHours: { start: '08:00', end: '17:00' },
        majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']
      },
      ZA: {
        name: 'South Africa',
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
        businessHours: { start: '08:00', end: '17:00' },
        majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth']
      },
      GH: {
        name: 'Ghana',
        timezone: 'Africa/Accra',
        currency: 'GHS',
        businessHours: { start: '08:00', end: '17:00' },
        majorCities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast']
      },
      EG: {
        name: 'Egypt',
        timezone: 'Africa/Cairo',
        currency: 'EGP',
        businessHours: { start: '09:00', end: '17:00' },
        majorCities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said']
      }
    },
    timezones: [
      'Africa/Lagos',
      'Africa/Nairobi',
      'Africa/Johannesburg',
      'Africa/Accra',
      'Africa/Cairo'
    ],
    connectivityProfiles: {
      urban: { avgSpeed: 'fast', reliability: 'high' },
      suburban: { avgSpeed: 'medium', reliability: 'medium' },
      rural: { avgSpeed: 'slow', reliability: 'low' }
    }
  };

  return {
    forms,
    analyticsConfig,
    engagementRules,
    geographicData
  };
}