/**
 * Progressive Web App offline management utilities
 * Handles offline functionality, caching, and sync for MarketSage
 */

interface CacheConfig {
  name: string;
  version: number;
  patterns: string[];
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

interface OfflineData {
  id: string;
  type: 'contact' | 'campaign' | 'template' | 'draft';
  data: any;
  timestamp: number;
  synced: boolean;
}

/**
 * PWA Offline Manager for MarketSage
 * Provides offline capabilities for critical dashboard features
 */
class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: OfflineData[] = [];
  private dbName = 'marketsage-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private cacheConfigs: CacheConfig[] = [
    {
      name: 'marketsage-static-v1',
      version: 1,
      patterns: ['/_next/static/', '/icons/', '/manifest.json'],
      strategy: 'cache-first'
    },
    {
      name: 'marketsage-api-v1',
      version: 1,
      patterns: ['/api/contacts', '/api/campaigns', '/api/templates'],
      strategy: 'network-first'
    },
    {
      name: 'marketsage-dashboard-v1',
      version: 1,
      patterns: ['/dashboard'],
      strategy: 'network-first'
    }
  ];

  private constructor() {
    this.initializeOfflineSupport();
    this.setupEventListeners();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize offline support
   */
  private async initializeOfflineSupport(): Promise<void> {
    try {
      // Initialize IndexedDB for offline storage
      await this.initializeDB();
      
      // Load offline queue from storage
      await this.loadOfflineQueue();
      
      // Register service worker if supported
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }
      
      console.log('PWA offline support initialized');
    } catch (error) {
      console.error('Failed to initialize offline support:', error);
    }
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          queueStore.createIndex('type', 'type', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cachedData')) {
          const dataStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          dataStore.createIndex('type', 'type', { unique: false });
          dataStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Register service worker for caching
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.notifyUpdate();
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleConnectionChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleConnectionChange(false);
    });
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  /**
   * Handle connection status changes
   */
  private async handleConnectionChange(online: boolean): Promise<void> {
    if (online) {
      console.log('Connection restored - syncing offline data');
      await this.syncOfflineData();
      this.notifyConnectionStatus('online');
    } else {
      console.log('Connection lost - switching to offline mode');
      this.notifyConnectionStatus('offline');
    }
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any, type: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    
    await store.put({
      key,
      data,
      type,
      lastAccessed: Date.now(),
      cached: Date.now()
    });
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update last accessed time
          this.updateLastAccessed(key);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add data to offline queue for later sync
   */
  async addToOfflineQueue(type: string, data: any): Promise<string> {
    const offlineItem: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      data,
      timestamp: Date.now(),
      synced: false
    };
    
    this.offlineQueue.push(offlineItem);
    
    // Save to IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      await store.put(offlineItem);
    }
    
    return offlineItem.id;
  }

  /**
   * Sync offline data when connection is restored
   */
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;
    
    console.log(`Syncing ${this.offlineQueue.length} offline items`);
    
    for (const item of this.offlineQueue) {
      if (item.synced) continue;
      
      try {
        await this.syncItem(item);
        item.synced = true;
        
        // Update in IndexedDB
        if (this.db) {
          const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
          const store = transaction.objectStore('offlineQueue');
          await store.put(item);
        }
      } catch (error) {
        console.error(`Failed to sync offline item ${item.id}:`, error);
      }
    }
    
    // Remove synced items
    this.offlineQueue = this.offlineQueue.filter(item => !item.synced);
    await this.cleanupSyncedItems();
  }

  /**
   * Sync individual offline item
   */
  private async syncItem(item: OfflineData): Promise<void> {
    const endpoint = this.getEndpointForType(item.type);
    if (!endpoint) return;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  /**
   * Get API endpoint for data type
   */
  private getEndpointForType(type: string): string | null {
    const endpoints = {
      'contact': '/api/contacts',
      'campaign': '/api/campaigns',
      'template': '/api/templates',
      'draft': '/api/drafts'
    };
    
    return endpoints[type as keyof typeof endpoints] || null;
  }

  /**
   * Load offline queue from IndexedDB
   */
  private async loadOfflineQueue(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.offlineQueue = request.result.filter(item => !item.synced);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup synced items from IndexedDB
   */
  private async cleanupSyncedItems(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const index = store.index('timestamp');
    
    // Remove items older than 7 days that are synced
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const request = index.openCursor(IDBKeyRange.upperBound(weekAgo));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.synced) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  /**
   * Update last accessed time for cached data
   */
  private async updateLastAccessed(key: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cachedData'], 'readwrite');
    const store = transaction.objectStore('cachedData');
    const request = store.get(key);
    
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        data.lastAccessed = Date.now();
        store.put(data);
      }
    };
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline queue status
   */
  getOfflineStatus(): {
    isOnline: boolean;
    queueLength: number;
    lastSync?: number;
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.offlineQueue.filter(item => !item.synced).length,
      lastSync: this.offlineQueue
        .filter(item => item.synced)
        .reduce((latest, item) => Math.max(latest, item.timestamp), 0) || undefined
    };
  }

  /**
   * Notify about connection status
   */
  private notifyConnectionStatus(status: 'online' | 'offline'): void {
    // Dispatch custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('marketsage:connection', {
      detail: { status, isOnline: this.isOnline }
    }));
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate(): void {
    window.dispatchEvent(new CustomEvent('marketsage:update', {
      detail: { updateAvailable: true }
    }));
  }

  /**
   * Manually trigger sync
   */
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOfflineData();
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cachedData', 'offlineQueue'], 'readwrite');
    await transaction.objectStore('cachedData').clear();
    await transaction.objectStore('offlineQueue').clear();
    
    this.offlineQueue = [];
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// Helper hooks for React components
export const useOfflineStatus = () => {
  const [status, setStatus] = React.useState(() => offlineManager.getOfflineStatus());
  
  React.useEffect(() => {
    const handleConnectionChange = () => {
      setStatus(offlineManager.getOfflineStatus());
    };
    
    window.addEventListener('marketsage:connection', handleConnectionChange);
    
    // Check status periodically
    const interval = setInterval(handleConnectionChange, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('marketsage:connection', handleConnectionChange);
      clearInterval(interval);
    };
  }, []);
  
  return status;
};

// React import stub (will be resolved by Next.js)
const React = {
  useState: (initialState: any) => [initialState, () => {}],
  useEffect: (effect: () => void, deps?: any[]) => {},
};