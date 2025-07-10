/**
 * LeadPulse Mobile Offline SDK
 * Handles offline tracking and synchronization for mobile applications
 */

// Types
export interface MobileSDKConfig {
  apiBaseUrl: string;
  deviceId: string;
  batchSize?: number;
  syncInterval?: number;
  maxStorageSize?: number;
  autoSync?: boolean;
  debug?: boolean;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
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

export interface TrackingEvent {
  localEventId: string;
  eventType: string;
  eventData: any;
  url?: string;
  timestamp: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingEvents: number;
  lastSyncAt?: Date;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  error: string;
  timestamp: Date;
  retryable: boolean;
}

export class LeadPulseMobileSDK {
  private config: MobileSDKConfig;
  private sessionId: string;
  private isInitialized: boolean = false;
  private eventQueue: TrackingEvent[] = [];
  private syncStatus: SyncStatus;
  private syncTimer?: NodeJS.Timeout;
  private storageKey: string;
  private onlineListeners: Array<(isOnline: boolean) => void> = [];

  constructor(config: MobileSDKConfig) {
    this.config = {
      batchSize: 50,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      maxStorageSize: 10 * 1024 * 1024, // 10MB
      autoSync: true,
      debug: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.storageKey = `leadpulse_offline_${this.config.deviceId}`;
    
    this.syncStatus = {
      isOnline: this.isOnline(),
      pendingEvents: 0,
      syncInProgress: false,
      errors: []
    };

    this.log('SDK initialized', { deviceId: this.config.deviceId, sessionId: this.sessionId });
  }

  /**
   * Initialize the SDK with device information
   */
  async initialize(deviceInfo: DeviceInfo, location?: LocationData): Promise<void> {
    try {
      this.log('Initializing SDK...', { deviceInfo, location });

      // Load persisted events from storage
      await this.loadPersistedEvents();

      // Initialize session on server
      const response = await this.apiCall('POST', '/leadpulse/mobile/sync?action=init_session', {
        deviceId: this.config.deviceId,
        sessionId: this.sessionId,
        deviceInfo,
        location
      });

      if (response.success) {
        this.isInitialized = true;
        
        // Prepare device for offline use
        await this.prepareOfflineCapabilities();

        // Set up online/offline detection
        this.setupConnectivityMonitoring();

        // Start auto-sync if enabled
        if (this.config.autoSync) {
          this.startAutoSync();
        }

        this.log('SDK initialized successfully');
      } else {
        throw new Error('Failed to initialize session on server');
      }

    } catch (error) {
      this.log('Initialization failed', error);
      
      // Continue in offline mode
      this.isInitialized = true;
      this.syncStatus.isOnline = false;
      
      await this.loadPersistedEvents();
      this.setupConnectivityMonitoring();
      
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Track an event (works offline)
   */
  async track(eventType: string, eventData: any, url?: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    const event: TrackingEvent = {
      localEventId: this.generateEventId(),
      eventType,
      eventData: {
        ...eventData,
        sessionId: this.sessionId,
        timestamp: new Date(),
        offline: !this.syncStatus.isOnline
      },
      url,
      timestamp: new Date()
    };

    // Add to queue
    this.eventQueue.push(event);
    this.syncStatus.pendingEvents = this.eventQueue.length;

    // Persist to storage
    await this.persistEvents();

    this.log('Event tracked', { eventType, eventId: event.localEventId, offline: !this.syncStatus.isOnline });

    // Try immediate sync if online and not already syncing
    if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
      this.scheduleSyncAttempt();
    }
  }

  /**
   * Manually trigger synchronization
   */
  async sync(force: boolean = false): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized');
    }

    if (this.syncStatus.syncInProgress && !force) {
      this.log('Sync already in progress');
      return false;
    }

    if (!this.syncStatus.isOnline && !force) {
      this.log('Device is offline, skipping sync');
      return false;
    }

    this.syncStatus.syncInProgress = true;
    this.log('Starting sync...', { pendingEvents: this.eventQueue.length });

    try {
      // Queue events on server
      if (this.eventQueue.length > 0) {
        const batches = this.chunkArray(this.eventQueue, this.config.batchSize!);
        
        for (const batch of batches) {
          try {
            const response = await this.apiCall('POST', '/leadpulse/mobile/sync?action=queue_events', {
              sessionId: this.sessionId,
              events: batch.map(event => ({
                ...event,
                timestamp: event.timestamp.toISOString()
              }))
            });

            if (response.success) {
              // Remove synced events from queue
              this.eventQueue = this.eventQueue.filter(event => 
                !batch.some(batchEvent => batchEvent.localEventId === event.localEventId)
              );
            }
          } catch (batchError) {
            this.log('Batch sync failed', batchError);
            this.addSyncError('Batch sync failed', true);
          }
        }
      }

      // Sync data with server
      const syncResponse = await this.apiCall('POST', '/leadpulse/mobile/sync?action=sync_data', {
        deviceId: this.config.deviceId,
        connectionType: this.getConnectionType(),
        networkSpeed: this.getNetworkSpeed()
      });

      if (syncResponse.success) {
        this.syncStatus.lastSyncAt = new Date();
        this.syncStatus.pendingEvents = this.eventQueue.length;
        this.clearSyncErrors();
        
        // Persist updated queue
        await this.persistEvents();
        
        this.log('Sync completed successfully', {
          result: syncResponse.data.syncResult
        });

        return true;
      } else {
        throw new Error('Server sync failed');
      }

    } catch (error) {
      this.log('Sync failed', error);
      this.addSyncError(error instanceof Error ? error.message : 'Unknown sync error', true);
      return false;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get cached data for offline use
   */
  async getCachedData(cacheKey: string): Promise<any> {
    try {
      const response = await this.apiCall('GET', `/leadpulse/mobile/cache?deviceId=${this.config.deviceId}&cacheKey=${cacheKey}`);
      
      if (response.success) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.log('Failed to get cached data', error);
      return null;
    }
  }

  /**
   * Cache data for offline use
   */
  async setCachedData(cacheKey: string, cacheType: string, data: any, ttlHours: number = 24): Promise<boolean> {
    try {
      const response = await this.apiCall('POST', '/leadpulse/mobile/cache?action=set', {
        deviceId: this.config.deviceId,
        cacheKey,
        cacheType,
        data,
        ttlHours
      });

      return response.success;
    } catch (error) {
      this.log('Failed to cache data', error);
      return false;
    }
  }

  /**
   * Add listener for online status changes
   */
  onConnectivityChange(listener: (isOnline: boolean) => void): void {
    this.onlineListeners.push(listener);
  }

  /**
   * Remove connectivity listener
   */
  removeConnectivityListener(listener: (isOnline: boolean) => void): void {
    const index = this.onlineListeners.indexOf(listener);
    if (index > -1) {
      this.onlineListeners.splice(index, 1);
    }
  }

  /**
   * Clean up SDK resources
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.onlineListeners = [];
    this.log('SDK cleaned up');
  }

  // Private methods

  private async prepareOfflineCapabilities(): Promise<void> {
    try {
      await this.apiCall('POST', '/leadpulse/mobile/cache?action=prepare_offline', {
        deviceId: this.config.deviceId
      });
      
      this.log('Device prepared for offline use');
    } catch (error) {
      this.log('Failed to prepare offline capabilities', error);
    }
  }

  private setupConnectivityMonitoring(): void {
    // Set up periodic online status checking
    setInterval(() => {
      const wasOnline = this.syncStatus.isOnline;
      const isOnline = this.isOnline();
      
      if (wasOnline !== isOnline) {
        this.syncStatus.isOnline = isOnline;
        this.log('Connectivity changed', { isOnline });
        
        // Notify listeners
        this.onlineListeners.forEach(listener => listener(isOnline));
        
        // Trigger sync when coming back online
        if (isOnline && this.eventQueue.length > 0) {
          this.scheduleSyncAttempt();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.syncStatus.isOnline && this.eventQueue.length > 0) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  private scheduleSyncAttempt(): void {
    // Use setTimeout to avoid immediate sync conflicts
    setTimeout(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.sync();
      }
    }, 1000);
  }

  private async persistEvents(): Promise<void> {
    try {
      const data = {
        sessionId: this.sessionId,
        events: this.eventQueue,
        lastUpdated: new Date()
      };

      // In a real implementation, use device storage (localStorage, AsyncStorage, etc.)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      this.log('Failed to persist events', error);
    }
  }

  private async loadPersistedEvents(): Promise<void> {
    try {
      // In a real implementation, load from device storage
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(this.storageKey);
        
        if (stored) {
          const data = JSON.parse(stored);
          this.eventQueue = data.events || [];
          this.syncStatus.pendingEvents = this.eventQueue.length;
          
          this.log('Loaded persisted events', { count: this.eventQueue.length });
        }
      }
    } catch (error) {
      this.log('Failed to load persisted events', error);
    }
  }

  private async apiCall(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadPulse-Mobile-SDK/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private isOnline(): boolean {
    // In a real implementation, use proper network detection
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online by default
  }

  private getConnectionType(): string {
    // In a real implementation, detect actual connection type
    return 'unknown';
  }

  private getNetworkSpeed(): string {
    // In a real implementation, measure network speed
    return 'unknown';
  }

  private generateSessionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private addSyncError(error: string, retryable: boolean): void {
    this.syncStatus.errors.push({
      error,
      timestamp: new Date(),
      retryable
    });

    // Keep only last 10 errors
    if (this.syncStatus.errors.length > 10) {
      this.syncStatus.errors = this.syncStatus.errors.slice(-10);
    }
  }

  private clearSyncErrors(): void {
    this.syncStatus.errors = [];
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[LeadPulse SDK] ${message}`, data || '');
    }
  }
}

// Export factory function for easy usage
export function createLeadPulseMobileSDK(config: MobileSDKConfig): LeadPulseMobileSDK {
  return new LeadPulseMobileSDK(config);
}

// Export utility functions for mobile apps
export const MobileSDKUtils = {
  /**
   * Generate device fingerprint for identification
   */
  generateDeviceFingerprint(): string {
    const factors = [
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
      typeof navigator !== 'undefined' ? navigator.language : '',
      new Date().getTimezoneOffset().toString()
    ];
    
    return btoa(factors.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  },

  /**
   * Get device information
   */
  getDeviceInfo(): Partial<DeviceInfo> {
    if (typeof navigator === 'undefined') {
      return {};
    }

    return {
      platform: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 
                /Android/.test(navigator.userAgent) ? 'android' : 'web',
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown'
    };
  },

  /**
   * Check if device supports offline capabilities
   */
  supportsOffline(): boolean {
    return typeof Storage !== 'undefined' && typeof fetch !== 'undefined';
  }
};