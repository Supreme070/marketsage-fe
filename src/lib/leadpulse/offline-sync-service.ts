// NOTE: Prisma removed - using backend API (OfflineSession, OfflineEvent, OfflineSyncLog, OfflineCache, AnonymousVisitor, LeadPulseVisitor, LeadPulseTouchpoint, Form exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

import { logger } from '@/lib/logger';

// Types for offline synchronization
export interface OfflineSession {
  id: string;
  deviceId: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  eventsCount: number;
  dataSize: number;
  lastSyncAt?: Date;
  syncStatus: OfflineSyncStatus;
  lastKnownLocation?: LocationData;
  timezone?: string;
}

export interface DeviceInfo {
  platform: string; // ios, android, web
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize: string;
  userAgent?: string;
  language: string;
  timezone: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  city?: string;
  country?: string;
  region?: string;
}

export interface OfflineEvent {
  localEventId: string;
  eventType: string;
  eventData: any;
  url?: string;
  timestamp: Date;
}

export interface SyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsSucceeded: number;
  eventsFailed: number;
  dataTransferred: number;
  errors: SyncError[];
  conflictCount: number;
}

export interface SyncError {
  eventId?: string;
  error: string;
  errorCode: string;
  retryable: boolean;
}

export type ConnectionStatus = 'offline' | 'online' | 'syncing' | 'poor_connection';
export type OfflineSyncStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type SyncType = 'UPLOAD' | 'DOWNLOAD' | 'FULL_SYNC' | 'INCREMENTAL_SYNC';

export class LeadPulseOfflineSyncService {
  
  /**
   * Initialize offline session for mobile device
   */
  async initializeOfflineSession(
    deviceId: string,
    sessionId: string,
    deviceInfo: DeviceInfo,
    location?: LocationData
  ): Promise<string> {
    try {
      // End any existing active sessions for this device
      await this.endActiveSessionsForDevice(deviceId);

      // Create new offline session
      const response = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          sessionId,
          deviceInfo: JSON.stringify(deviceInfo),
          startTime: new Date(),
          connectionStatus: 'offline',
          lastKnownLocation: location ? JSON.stringify(location) : null,
          timezone: deviceInfo.timezone
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to create offline session: ${response.status}`);
      }
      const data = await response.json();
      const session = data.data;

      // Initialize cache for this device
      await this.initializeDeviceCache(deviceId);

      logger.info(`Initialized offline session for device: ${deviceId}`, {
        sessionId: session.id,
        platform: deviceInfo.platform
      });

      return session.id;

    } catch (error) {
      logger.error('Failed to initialize offline session:', error);
      throw error;
    }
  }

  /**
   * Queue offline events for later synchronization
   */
  async queueOfflineEvents(
    sessionId: string,
    events: OfflineEvent[]
  ): Promise<void> {
    try {
      const sessionResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Create offline events
      const response = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          events: events.map(event => ({
            localEventId: event.localEventId,
            eventType: event.eventType,
            eventData: JSON.stringify(event.eventData),
            url: event.url,
            timestamp: event.timestamp,
            syncStatus: 'PENDING'
          }))
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to queue offline events: ${response.status}`);
      }

      // Update session metrics
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventsCount_increment: events.length,
          dataSize_increment: this.calculateEventsSize(events)
        })
      });
      if (!updateResponse.ok) {
        throw new Error(`Failed to update session metrics: ${updateResponse.status}`);
      }

      logger.info(`Queued ${events.length} offline events for session: ${sessionId}`);

    } catch (error) {
      logger.error('Failed to queue offline events:', error);
      throw error;
    }
  }

  /**
   * Synchronize offline data when connection is restored
   */
  async synchronizeOfflineData(
    deviceId: string,
    connectionType = 'unknown',
    networkSpeed = 'unknown'
  ): Promise<SyncResult> {
    let syncLogId: string | null = null;

    try {
      // Get active session for device
      const sessionResponse = await fetch(
        `${BACKEND_URL}/api/v2/sync-queue/offline-sessions?deviceId=${deviceId}&isActive=true&include=events&events.syncStatus=PENDING&events.orderBy=timestamp:asc&limit=1`
      );
      if (!sessionResponse.ok) {
        throw new Error(`Failed to get active session: ${sessionResponse.status}`);
      }
      const sessionData = await sessionResponse.json();
      const session = sessionData.data?.[0];

      if (!session) {
        throw new Error(`No active session found for device: ${deviceId}`);
      }

      // Create sync log
      const syncLogResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/sync-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          syncType: 'UPLOAD',
          status: 'STARTED',
          startTime: new Date(),
          connectionType,
          networkSpeed
        })
      });
      if (!syncLogResponse.ok) {
        throw new Error(`Failed to create sync log: ${syncLogResponse.status}`);
      }
      const syncLogData = await syncLogResponse.json();
      const syncLog = syncLogData.data;
      syncLogId = syncLog.id;

      // Update session status
      const updateSessionResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionStatus: 'syncing',
          syncStatus: 'SYNCING'
        })
      });
      if (!updateSessionResponse.ok) {
        throw new Error(`Failed to update session status: ${updateSessionResponse.status}`);
      }

      // Process events in batches
      const batchSize = 50;
      const events = session.events || [];
      let eventsProcessed = 0;
      let eventsSucceeded = 0;
      let eventsFailed = 0;
      let dataTransferred = 0;
      const errors: SyncError[] = [];
      let conflictCount = 0;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);

        const batchResult = await this.processBatchEvents(batch);

        eventsProcessed += batch.length;
        eventsSucceeded += batchResult.succeeded;
        eventsFailed += batchResult.failed;
        dataTransferred += batchResult.dataSize;
        errors.push(...batchResult.errors);
        conflictCount += batchResult.conflicts;

        // Update sync progress
        const progressResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/sync-logs/${syncLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'IN_PROGRESS',
            eventsProcessed,
            eventsSucceeded,
            eventsFailed
          })
        });
        if (!progressResponse.ok) {
          logger.error('Failed to update sync progress');
        }
      }

      // Finalize sync
      const syncStatus = eventsFailed > 0 ? 'PARTIAL' : 'COMPLETED';
      const connectionStatus = eventsFailed === 0 ? 'online' : 'poor_connection';

      await Promise.all([
        // Update session
        fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/${session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionStatus,
            syncStatus,
            lastSyncAt: new Date()
          })
        }),
        // Complete sync log
        fetch(`${BACKEND_URL}/api/v2/sync-queue/sync-logs/${syncLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            endTime: new Date(),
            eventsProcessed,
            eventsSucceeded,
            eventsFailed,
            dataTransferred,
            errors: errors.length > 0 ? JSON.stringify(errors) : null
          })
        })
      ]);

      logger.info(`Sync completed for device: ${deviceId}`, {
        eventsProcessed,
        eventsSucceeded,
        eventsFailed,
        conflictCount
      });

      return {
        success: eventsFailed === 0,
        eventsProcessed,
        eventsSucceeded,
        eventsFailed,
        dataTransferred,
        errors,
        conflictCount
      };

    } catch (error) {
      logger.error('Sync failed:', error);

      if (syncLogId) {
        await fetch(`${BACKEND_URL}/api/v2/sync-queue/sync-logs/${syncLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'FAILED',
            endTime: new Date(),
            errors: JSON.stringify([{
              error: error instanceof Error ? error.message : 'Unknown error',
              errorCode: 'SYNC_FAILED',
              retryable: true
            }])
          })
        });
      }

      throw error;
    }
  }

  /**
   * Process a batch of offline events
   */
  private async processBatchEvents(events: any[]): Promise<{
    succeeded: number;
    failed: number;
    dataSize: number;
    errors: SyncError[];
    conflicts: number;
  }> {
    let succeeded = 0;
    let failed = 0;
    let dataSize = 0;
    const errors: SyncError[] = [];
    let conflicts = 0;

    for (const event of events) {
      try {
        // Check for duplicate events
        const existingEvent = await this.findDuplicateEvent(event);

        if (existingEvent) {
          // Mark as duplicate
          await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncStatus: 'DUPLICATE',
              serverTimestamp: new Date()
            })
          });
          conflicts++;
          continue;
        }

        // Process the event - convert to regular LeadPulse touchpoint
        const eventData = JSON.parse(event.eventData);
        const touchpoint = await this.convertOfflineEventToTouchpoint(event, eventData);

        if (touchpoint) {
          // Mark event as synced
          await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncStatus: 'COMPLETED',
              serverTimestamp: new Date()
            })
          });

          succeeded++;
          dataSize += JSON.stringify(eventData).length;
        } else {
          throw new Error('Failed to convert offline event to touchpoint');
        }

      } catch (error) {
        // Mark event as failed
        await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            syncStatus: 'FAILED',
            syncAttempts_increment: 1,
            lastSyncAttempt: new Date(),
            syncError: error instanceof Error ? error.message : 'Unknown error'
          })
        });

        errors.push({
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'PROCESSING_FAILED',
          retryable: true
        });

        failed++;
      }
    }

    return { succeeded, failed, dataSize, errors, conflicts };
  }

  /**
   * Check for duplicate events
   */
  private async findDuplicateEvent(offlineEvent: any): Promise<any> {
    // Check in offline events table
    const duplicateOfflineResponse = await fetch(
      `${BACKEND_URL}/api/v2/sync-queue/offline-events?localEventId=${offlineEvent.localEventId}&syncStatus=COMPLETED,DUPLICATE&id_not=${offlineEvent.id}&limit=1`
    );
    if (duplicateOfflineResponse.ok) {
      const data = await duplicateOfflineResponse.json();
      const duplicateOffline = data.data?.[0];
      if (duplicateOffline) return duplicateOffline;
    }

    // Check in regular touchpoints table based on timestamp and event type
    const timeWindow = 60000; // 1 minute window
    const timestamp = new Date(offlineEvent.timestamp);
    const timeGte = new Date(timestamp.getTime() - timeWindow).toISOString();
    const timeLte = new Date(timestamp.getTime() + timeWindow).toISOString();

    const duplicateTouchpointResponse = await fetch(
      `${BACKEND_URL}/api/v2/leadpulse-touchpoints?type=${this.mapEventTypeToTouchpointType(offlineEvent.eventType)}&timestamp_gte=${timeGte}&timestamp_lte=${timeLte}&url=${encodeURIComponent(offlineEvent.url)}&limit=1`
    );
    if (duplicateTouchpointResponse.ok) {
      const data = await duplicateTouchpointResponse.json();
      return data.data?.[0];
    }

    return null;
  }

  /**
   * Convert offline event to regular LeadPulse touchpoint
   */
  private async convertOfflineEventToTouchpoint(
    offlineEvent: any,
    eventData: any
  ): Promise<any> {
    try {
      // Find or create visitor based on device ID
      const sessionResponse = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/${offlineEvent.sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error('Session not found');
      }
      const sessionData = await sessionResponse.json();
      const session = sessionData.data;

      // Try to find existing visitor by device fingerprint or create anonymous visitor
      let visitorId = null;
      let anonymousVisitorId = null;

      // Check if we can match to an existing visitor
      const existingVisitorResponse = await fetch(
        `${BACKEND_URL}/api/v2/leadpulse-visitors?fingerprint=${session.deviceId}&limit=1`
      );
      if (existingVisitorResponse.ok) {
        const visitorData = await existingVisitorResponse.json();
        const existingVisitor = visitorData.data?.[0];
        if (existingVisitor) {
          visitorId = existingVisitor.id;
        }
      }

      if (!visitorId) {
        // Create/update anonymous visitor
        const anonVisitorResponse = await fetch(
          `${BACKEND_URL}/api/v2/anonymous-visitors/upsert`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fingerprint: session.deviceId,
              create: {
                fingerprint: session.deviceId,
                firstVisit: session.startTime,
                lastVisit: offlineEvent.timestamp,
                totalVisits: 1,
                visitCount: 1,
                userAgent: eventData.userAgent,
                city: eventData.location?.city,
                country: eventData.location?.country,
                region: eventData.location?.region,
                latitude: eventData.location?.latitude,
                longitude: eventData.location?.longitude
              },
              update: {
                lastVisit: offlineEvent.timestamp,
                totalVisits_increment: 1,
                visitCount_increment: 1
              }
            })
          }
        );
        if (!anonVisitorResponse.ok) {
          throw new Error(`Failed to upsert anonymous visitor: ${anonVisitorResponse.status}`);
        }
        const anonData = await anonVisitorResponse.json();
        anonymousVisitorId = anonData.data.id;
      }

      // Create touchpoint
      const touchpointResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-touchpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          anonymousVisitorId,
          timestamp: offlineEvent.timestamp,
          type: this.mapEventTypeToTouchpointType(offlineEvent.eventType),
          url: offlineEvent.url,
          duration: eventData.duration,
          value: eventData.value || 1,
          score: eventData.score || 1,
          metadata: eventData
        })
      });
      if (!touchpointResponse.ok) {
        throw new Error(`Failed to create touchpoint: ${touchpointResponse.status}`);
      }
      const touchpointData = await touchpointResponse.json();
      return touchpointData.data;

    } catch (error) {
      logger.error('Failed to convert offline event to touchpoint:', error);
      throw error;
    }
  }

  /**
   * Map offline event types to touchpoint types
   */
  private mapEventTypeToTouchpointType(eventType: string): string {
    const mapping: Record<string, string> = {
      'page_view': 'PAGE_VIEW',
      'click': 'CLICK',
      'form_submit': 'FORM_SUBMIT',
      'form_start': 'FORM_START',
      'scroll': 'SCROLL',
      'time_on_page': 'TIME_ON_PAGE',
      'download': 'DOWNLOAD',
      'email_click': 'EMAIL_CLICK',
      'video_play': 'VIDEO_PLAY',
      'search': 'SEARCH'
    };

    return mapping[eventType] || 'PAGE_VIEW';
  }

  /**
   * Cache data for offline access
   */
  async cacheDataForOffline(
    deviceId: string,
    cacheKey: string,
    cacheType: string,
    data: any,
    ttlHours = 24
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
      const version = Date.now().toString();

      const response = await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-cache/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          cacheKey,
          create: {
            deviceId,
            cacheKey,
            cacheType,
            data: JSON.stringify(data),
            version,
            expiresAt,
            lastUpdated: new Date()
          },
          update: {
            data: JSON.stringify(data),
            version,
            expiresAt,
            lastUpdated: new Date(),
            isStale: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cache data: ${response.status}`);
      }

      logger.info(`Cached data for offline access: ${cacheKey}`, {
        deviceId,
        cacheType,
        expiresAt
      });

    } catch (error) {
      logger.error('Failed to cache data for offline:', error);
      throw error;
    }
  }

  /**
   * Retrieve cached data for offline access
   */
  async getCachedDataForOffline(
    deviceId: string,
    cacheKey: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v2/sync-queue/offline-cache?deviceId=${deviceId}&cacheKey=${encodeURIComponent(cacheKey)}&limit=1`
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get cached data: ${response.status}`);
      }

      const data = await response.json();
      const cached = data.data?.[0];

      if (!cached) {
        return null;
      }

      // Check if expired
      if (new Date(cached.expiresAt) < new Date()) {
        // Mark as stale but still return data
        await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-cache/${cached.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isStale: true })
        });

        return {
          data: JSON.parse(cached.data as string),
          isStale: true,
          version: cached.version
        };
      }

      return {
        data: JSON.parse(cached.data as string),
        isStale: cached.isStale,
        version: cached.version
      };

    } catch (error) {
      logger.error('Failed to get cached data:', error);
      throw error;
    }
  }

  /**
   * Get sync status for a device
   */
  async getSyncStatus(deviceId: string): Promise<any> {
    try {
      const sessionResponse = await fetch(
        `${BACKEND_URL}/api/v2/sync-queue/offline-sessions?deviceId=${deviceId}&isActive=true&include=events,syncLogs&events.syncStatus=PENDING&syncLogs.orderBy=startTime:desc&syncLogs.limit=1&limit=1`
      );

      if (!sessionResponse.ok) {
        if (sessionResponse.status === 404) return null;
        throw new Error(`Failed to get sync status: ${sessionResponse.status}`);
      }

      const sessionData = await sessionResponse.json();
      const session = sessionData.data?.[0];

      if (!session) {
        return null;
      }

      const pendingEvents = session.events?.length || 0;
      const lastSync = session.syncLogs?.[0];

      return {
        sessionId: session.id,
        deviceId: session.deviceId,
        connectionStatus: session.connectionStatus,
        syncStatus: session.syncStatus,
        pendingEvents,
        lastSyncAt: session.lastSyncAt,
        lastSyncLog: lastSync ? {
          syncType: lastSync.syncType,
          status: lastSync.status,
          eventsProcessed: lastSync.eventsProcessed,
          eventsSucceeded: lastSync.eventsSucceeded,
          eventsFailed: lastSync.eventsFailed
        } : null
      };

    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * End active sessions for a device
   */
  private async endActiveSessionsForDevice(deviceId: string): Promise<void> {
    await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-sessions/bulk-update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: {
          deviceId,
          isActive: true
        },
        data: {
          isActive: false,
          endTime: new Date(),
          connectionStatus: 'offline'
        }
      })
    });
  }

  /**
   * Initialize device cache with essential data
   */
  private async initializeDeviceCache(deviceId: string): Promise<void> {
    // Cache form configurations
    const formsResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-forms?isActive=true`);
    if (formsResponse.ok) {
      const formsData = await formsResponse.json();
      const forms = (formsData.data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        fields: f.fields,
        settings: f.settings
      }));

      if (forms.length > 0) {
        await this.cacheDataForOffline(
          deviceId,
          'forms_config',
          'FORM_CONFIG',
          forms,
          48 // 48 hours TTL
        );
      }
    }

    // Cache engagement rules
    const engagementRules = {
      scoring: {
        pageView: 1,
        formSubmit: 10,
        emailClick: 5,
        download: 7
      },
      timeDecay: 0.95,
      sessionTimeout: 30 * 60 * 1000 // 30 minutes
    };

    await this.cacheDataForOffline(
      deviceId,
      'engagement_rules',
      'ENGAGEMENT_RULES',
      engagementRules,
      72 // 72 hours TTL
    );
  }

  /**
   * Calculate size of events for storage metrics
   */
  private calculateEventsSize(events: OfflineEvent[]): number {
    return events.reduce((total, event) => {
      return total + JSON.stringify(event).length;
    }, 0);
  }

  /**
   * Clean up old offline data
   */
  async cleanupOldOfflineData(daysOld = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    try {
      // Delete old completed events
      await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-events/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncStatus: 'COMPLETED',
          createdAt_lt: cutoffDate
        })
      });

      // Delete old sync logs
      await fetch(`${BACKEND_URL}/api/v2/sync-queue/sync-logs/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          startTime_lt: cutoffDate
        })
      });

      // Delete expired cache entries
      await fetch(`${BACKEND_URL}/api/v2/sync-queue/offline-cache/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresAt_lt: new Date()
        })
      });

      logger.info(`Cleaned up offline data older than ${daysOld} days`);

    } catch (error) {
      logger.error('Failed to cleanup old offline data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadPulseOfflineSyncService = new LeadPulseOfflineSyncService();