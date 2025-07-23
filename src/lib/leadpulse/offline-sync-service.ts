import prisma from '@/lib/db/prisma';
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
      const session = await prisma.leadPulseOfflineSession.create({
        data: {
          deviceId,
          sessionId,
          deviceInfo: JSON.stringify(deviceInfo),
          startTime: new Date(),
          connectionStatus: 'offline',
          lastKnownLocation: location ? JSON.stringify(location) : null,
          timezone: deviceInfo.timezone
        }
      });

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
      const session = await prisma.leadPulseOfflineSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Create offline events
      const eventPromises = events.map(event => 
        prisma.leadPulseOfflineEvent.create({
          data: {
            sessionId,
            localEventId: event.localEventId,
            eventType: event.eventType,
            eventData: JSON.stringify(event.eventData),
            url: event.url,
            timestamp: event.timestamp,
            syncStatus: 'PENDING'
          }
        })
      );

      await Promise.all(eventPromises);

      // Update session metrics
      await prisma.leadPulseOfflineSession.update({
        where: { id: sessionId },
        data: {
          eventsCount: {
            increment: events.length
          },
          dataSize: {
            increment: this.calculateEventsSize(events)
          }
        }
      });

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
      const session = await prisma.leadPulseOfflineSession.findFirst({
        where: {
          deviceId,
          isActive: true
        },
        include: {
          events: {
            where: {
              syncStatus: 'PENDING'
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      if (!session) {
        throw new Error(`No active session found for device: ${deviceId}`);
      }

      // Create sync log
      const syncLog = await prisma.leadPulseOfflineSyncLog.create({
        data: {
          sessionId: session.id,
          syncType: 'UPLOAD',
          status: 'STARTED',
          startTime: new Date(),
          connectionType,
          networkSpeed
        }
      });
      syncLogId = syncLog.id;

      // Update session status
      await prisma.leadPulseOfflineSession.update({
        where: { id: session.id },
        data: {
          connectionStatus: 'syncing',
          syncStatus: 'SYNCING'
        }
      });

      // Process events in batches
      const batchSize = 50;
      const events = session.events;
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
        await prisma.leadPulseOfflineSyncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'IN_PROGRESS',
            eventsProcessed,
            eventsSucceeded,
            eventsFailed
          }
        });
      }

      // Finalize sync
      const syncStatus = eventsFailed > 0 ? 'PARTIAL' : 'COMPLETED';
      const connectionStatus = eventsFailed === 0 ? 'online' : 'poor_connection';

      await Promise.all([
        // Update session
        prisma.leadPulseOfflineSession.update({
          where: { id: session.id },
          data: {
            connectionStatus,
            syncStatus: syncStatus as any,
            lastSyncAt: new Date()
          }
        }),
        // Complete sync log
        prisma.leadPulseOfflineSyncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'COMPLETED',
            endTime: new Date(),
            eventsProcessed,
            eventsSucceeded,
            eventsFailed,
            dataTransferred,
            errors: errors.length > 0 ? JSON.stringify(errors) : null
          }
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
        await prisma.leadPulseOfflineSyncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'FAILED',
            endTime: new Date(),
            errors: JSON.stringify([{
              error: error instanceof Error ? error.message : 'Unknown error',
              errorCode: 'SYNC_FAILED',
              retryable: true
            }])
          }
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
          await prisma.leadPulseOfflineEvent.update({
            where: { id: event.id },
            data: {
              syncStatus: 'DUPLICATE',
              serverTimestamp: new Date()
            }
          });
          conflicts++;
          continue;
        }

        // Process the event - convert to regular LeadPulse touchpoint
        const eventData = JSON.parse(event.eventData);
        const touchpoint = await this.convertOfflineEventToTouchpoint(event, eventData);

        if (touchpoint) {
          // Mark event as synced
          await prisma.leadPulseOfflineEvent.update({
            where: { id: event.id },
            data: {
              syncStatus: 'COMPLETED',
              serverTimestamp: new Date()
            }
          });

          succeeded++;
          dataSize += JSON.stringify(eventData).length;
        } else {
          throw new Error('Failed to convert offline event to touchpoint');
        }

      } catch (error) {
        // Mark event as failed
        await prisma.leadPulseOfflineEvent.update({
          where: { id: event.id },
          data: {
            syncStatus: 'FAILED',
            syncAttempts: { increment: 1 },
            lastSyncAttempt: new Date(),
            syncError: error instanceof Error ? error.message : 'Unknown error'
          }
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
    const duplicateOffline = await prisma.leadPulseOfflineEvent.findFirst({
      where: {
        localEventId: offlineEvent.localEventId,
        syncStatus: { in: ['COMPLETED', 'DUPLICATE'] },
        id: { not: offlineEvent.id }
      }
    });

    if (duplicateOffline) return duplicateOffline;

    // Check in regular touchpoints table based on timestamp and event type
    const eventData = JSON.parse(offlineEvent.eventData);
    const timeWindow = 60000; // 1 minute window
    
    const duplicateTouchpoint = await prisma.leadPulseTouchpoint.findFirst({
      where: {
        type: this.mapEventTypeToTouchpointType(offlineEvent.eventType),
        timestamp: {
          gte: new Date(offlineEvent.timestamp.getTime() - timeWindow),
          lte: new Date(offlineEvent.timestamp.getTime() + timeWindow)
        },
        url: offlineEvent.url
      }
    });

    return duplicateTouchpoint;
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
      const session = await prisma.leadPulseOfflineSession.findUnique({
        where: { id: offlineEvent.sessionId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Try to find existing visitor by device fingerprint or create anonymous visitor
      let visitorId = null;
      let anonymousVisitorId = null;

      // Check if we can match to an existing visitor
      const existingVisitor = await prisma.leadPulseVisitor.findFirst({
        where: {
          fingerprint: session.deviceId
        }
      });

      if (existingVisitor) {
        visitorId = existingVisitor.id;
      } else {
        // Create/update anonymous visitor
        const anonymousVisitor = await prisma.anonymousVisitor.upsert({
          where: { fingerprint: session.deviceId },
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
            totalVisits: { increment: 1 },
            visitCount: { increment: 1 }
          }
        });
        anonymousVisitorId = anonymousVisitor.id;
      }

      // Create touchpoint
      const touchpoint = await prisma.leadPulseTouchpoint.create({
        data: {
          visitorId,
          anonymousVisitorId,
          timestamp: offlineEvent.timestamp,
          type: this.mapEventTypeToTouchpointType(offlineEvent.eventType),
          url: offlineEvent.url,
          duration: eventData.duration,
          value: eventData.value || 1,
          score: eventData.score || 1,
          metadata: eventData
        }
      });

      return touchpoint;

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

      await prisma.leadPulseOfflineCache.upsert({
        where: {
          deviceId_cacheKey: {
            deviceId,
            cacheKey
          }
        },
        create: {
          deviceId,
          cacheKey,
          cacheType: cacheType as any,
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
      });

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
      const cached = await prisma.leadPulseOfflineCache.findUnique({
        where: {
          deviceId_cacheKey: {
            deviceId,
            cacheKey
          }
        }
      });

      if (!cached) {
        return null;
      }

      // Check if expired
      if (cached.expiresAt < new Date()) {
        // Mark as stale but still return data
        await prisma.leadPulseOfflineCache.update({
          where: { id: cached.id },
          data: { isStale: true }
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
      const session = await prisma.leadPulseOfflineSession.findFirst({
        where: {
          deviceId,
          isActive: true
        },
        include: {
          events: {
            where: {
              syncStatus: 'PENDING'
            }
          },
          syncLogs: {
            orderBy: {
              startTime: 'desc'
            },
            take: 1
          }
        }
      });

      if (!session) {
        return null;
      }

      const pendingEvents = session.events.length;
      const lastSync = session.syncLogs[0];

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
    await prisma.leadPulseOfflineSession.updateMany({
      where: {
        deviceId,
        isActive: true
      },
      data: {
        isActive: false,
        endTime: new Date(),
        connectionStatus: 'offline'
      }
    });
  }

  /**
   * Initialize device cache with essential data
   */
  private async initializeDeviceCache(deviceId: string): Promise<void> {
    // Cache form configurations
    const forms = await prisma.leadPulseForm.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        fields: true,
        settings: true
      }
    });

    if (forms.length > 0) {
      await this.cacheDataForOffline(
        deviceId,
        'forms_config',
        'FORM_CONFIG',
        forms,
        48 // 48 hours TTL
      );
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
      await prisma.leadPulseOfflineEvent.deleteMany({
        where: {
          syncStatus: 'COMPLETED',
          createdAt: { lt: cutoffDate }
        }
      });

      // Delete old sync logs
      await prisma.leadPulseOfflineSyncLog.deleteMany({
        where: {
          status: 'COMPLETED',
          startTime: { lt: cutoffDate }
        }
      });

      // Delete expired cache entries
      await prisma.leadPulseOfflineCache.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
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