/**
 * LeadPulse State Synchronization Manager
 * 
 * Prevents race conditions between real-time WebSocket updates and API polling
 * by managing state transitions and ensuring data consistency.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface DataSource {
  type: 'realtime' | 'api' | 'cache';
  timestamp: number;
  priority: number; // Higher number = higher priority
  version: string;
}

export interface SynchronizedData<T = any> {
  data: T;
  source: DataSource;
  isStale: boolean;
  lastUpdated: Date;
  version: string;
}

export interface UpdateOperation<T = any> {
  key: string;
  data: T;
  source: DataSource;
  mergeStrategy?: 'replace' | 'merge' | 'append';
  validator?: (data: T) => boolean;
}

export interface ConflictResolution {
  strategy: 'latest_wins' | 'priority_based' | 'merge' | 'manual';
  resolver?: (existing: any, incoming: any) => any;
}

class StateSynchronizationManager extends EventEmitter {
  private static instance: StateSynchronizationManager;
  private dataStore = new Map<string, SynchronizedData>();
  private pendingUpdates = new Map<string, UpdateOperation[]>();
  private conflictResolutions = new Map<string, ConflictResolution>();
  private subscriptions = new Map<string, Set<string>>(); // key -> Set of subscriber IDs
  private lastUpdateTimestamps = new Map<string, number>();
  private stalenessThreshold = 30000; // 30 seconds
  private maxPendingUpdates = 10;
  private updateQueue: UpdateOperation[] = [];
  private isProcessingQueue = false;
  private conflictBuffer = new Map<string, UpdateOperation[]>();
  private priorityLevels = {
    realtime: 3,
    api: 2,
    cache: 1
  };

  static getInstance(): StateSynchronizationManager {
    if (!StateSynchronizationManager.instance) {
      StateSynchronizationManager.instance = new StateSynchronizationManager();
    }
    return StateSynchronizationManager.instance;
  }

  private constructor() {
    super();
    this.setupCleanupInterval();
    this.setupQueueProcessor();
  }

  /**
   * Register a data key with conflict resolution strategy
   */
  registerDataKey(key: string, resolution: ConflictResolution): void {
    this.conflictResolutions.set(key, resolution);
    this.emit('key_registered', { key, resolution });
  }

  /**
   * Subscribe to updates for a specific data key
   */
  subscribe(key: string, subscriberId: string): void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(subscriberId);
    
    // Send current data if available
    const currentData = this.dataStore.get(key);
    if (currentData) {
      this.emit(`data_${key}`, currentData, subscriberId);
    }
  }

  /**
   * Unsubscribe from updates for a specific data key
   */
  unsubscribe(key: string, subscriberId: string): void {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.delete(subscriberId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(key);
      }
    }
  }

  /**
   * Update data with conflict resolution
   */
  async updateData<T>(operation: UpdateOperation<T>): Promise<SynchronizedData<T>> {
    const { key, data, source, mergeStrategy = 'replace', validator } = operation;

    // Validate data if validator provided
    if (validator && !validator(data)) {
      throw new Error(`Data validation failed for key: ${key}`);
    }

    // Check for conflicts
    const existingData = this.dataStore.get(key);
    const hasConflict = this.detectConflict(key, source, existingData);

    if (hasConflict) {
      return this.resolveConflict(operation, existingData!);
    }

    // Process the update
    const synchronizedData = await this.processUpdate(operation, existingData);
    
    // Update store
    this.dataStore.set(key, synchronizedData);
    this.lastUpdateTimestamps.set(key, Date.now());

    // Notify subscribers
    this.notifySubscribers(key, synchronizedData);

    return synchronizedData;
  }

  /**
   * Queue an update operation for batch processing
   */
  queueUpdate<T>(operation: UpdateOperation<T>): void {
    // Check if we already have pending updates for this key
    if (!this.pendingUpdates.has(operation.key)) {
      this.pendingUpdates.set(operation.key, []);
    }

    const pending = this.pendingUpdates.get(operation.key)!;
    
    // Limit pending updates to prevent memory issues
    if (pending.length >= this.maxPendingUpdates) {
      pending.shift(); // Remove oldest
    }
    
    pending.push(operation);
    this.updateQueue.push(operation);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Get current data for a key
   */
  getData<T>(key: string): SynchronizedData<T> | null {
    const data = this.dataStore.get(key);
    if (!data) return null;

    // Check if data is stale
    const isStale = this.isDataStale(key);
    return {
      ...data,
      isStale
    } as SynchronizedData<T>;
  }

  /**
   * Check if data is stale based on timestamp
   */
  isDataStale(key: string): boolean {
    const lastUpdate = this.lastUpdateTimestamps.get(key);
    if (!lastUpdate) return true;
    
    return Date.now() - lastUpdate > this.stalenessThreshold;
  }

  /**
   * Clear all data for a key
   */
  clearData(key: string): void {
    this.dataStore.delete(key);
    this.lastUpdateTimestamps.delete(key);
    this.pendingUpdates.delete(key);
    this.conflictBuffer.delete(key);
    this.emit('data_cleared', key);
  }

  /**
   * Get synchronization stats
   */
  getStats(): {
    totalKeys: number;
    staleKeys: number;
    pendingUpdates: number;
    conflicts: number;
    subscribers: number;
  } {
    const staleKeys = Array.from(this.dataStore.keys()).filter(key => this.isDataStale(key));
    const totalPendingUpdates = Array.from(this.pendingUpdates.values()).reduce((sum, updates) => sum + updates.length, 0);
    const totalConflicts = Array.from(this.conflictBuffer.values()).reduce((sum, conflicts) => sum + conflicts.length, 0);
    const totalSubscribers = Array.from(this.subscriptions.values()).reduce((sum, subscribers) => sum + subscribers.size, 0);

    return {
      totalKeys: this.dataStore.size,
      staleKeys: staleKeys.length,
      pendingUpdates: totalPendingUpdates,
      conflicts: totalConflicts,
      subscribers: totalSubscribers
    };
  }

  /**
   * Detect if there's a conflict with incoming data
   */
  private detectConflict(key: string, incomingSource: DataSource, existingData?: SynchronizedData): boolean {
    if (!existingData) return false;

    const timeDiff = Math.abs(incomingSource.timestamp - existingData.source.timestamp);
    const priorityDiff = incomingSource.priority - existingData.source.priority;
    
    // Conflict if updates are very close in time but from different sources
    if (timeDiff < 1000 && incomingSource.type !== existingData.source.type) {
      return true;
    }
    
    // Conflict if incoming data has lower priority but is very recent
    if (priorityDiff < 0 && timeDiff < 5000) {
      return true;
    }

    return false;
  }

  /**
   * Resolve conflicts based on configured strategy
   */
  private async resolveConflict<T>(operation: UpdateOperation<T>, existingData: SynchronizedData): Promise<SynchronizedData<T>> {
    const { key } = operation;
    const resolution = this.conflictResolutions.get(key);

    if (!resolution) {
      // Default: latest wins
      return this.processUpdate(operation, existingData);
    }

    // Add to conflict buffer for manual resolution if needed
    if (resolution.strategy === 'manual') {
      if (!this.conflictBuffer.has(key)) {
        this.conflictBuffer.set(key, []);
      }
      this.conflictBuffer.get(key)!.push(operation);
      this.emit('conflict_detected', { key, operation, existingData });
      return existingData as SynchronizedData<T>;
    }

    // Resolve based on strategy
    switch (resolution.strategy) {
      case 'priority_based':
        return operation.source.priority > existingData.source.priority
          ? this.processUpdate(operation, existingData)
          : existingData as SynchronizedData<T>;

      case 'latest_wins':
        return operation.source.timestamp > existingData.source.timestamp
          ? this.processUpdate(operation, existingData)
          : existingData as SynchronizedData<T>;

      case 'merge':
        if (resolution.resolver) {
          const mergedData = resolution.resolver(existingData.data, operation.data);
          const mergedOperation = { ...operation, data: mergedData };
          return this.processUpdate(mergedOperation, existingData);
        }
        return this.processUpdate(operation, existingData);

      default:
        return this.processUpdate(operation, existingData);
    }
  }

  /**
   * Process a single update operation
   */
  private async processUpdate<T>(operation: UpdateOperation<T>, existingData?: SynchronizedData): Promise<SynchronizedData<T>> {
    const { key, data, source, mergeStrategy } = operation;
    
    let finalData: T;
    
    if (existingData && mergeStrategy === 'merge') {
      finalData = { ...existingData.data, ...data };
    } else if (existingData && mergeStrategy === 'append' && Array.isArray(existingData.data)) {
      finalData = [...existingData.data, ...(Array.isArray(data) ? data : [data])] as T;
    } else {
      finalData = data;
    }

    // Generate version string
    const version = `${source.type}-${source.timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      data: finalData,
      source,
      isStale: false,
      lastUpdated: new Date(),
      version
    };
  }

  /**
   * Process queued updates in batches
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.updateQueue.length > 0) {
        const batch = this.updateQueue.splice(0, 5); // Process 5 at a time
        
        await Promise.all(batch.map(async (operation) => {
          try {
            await this.updateData(operation);
          } catch (error) {
            logger.error(`Failed to process queued update for key ${operation.key}:`, error);
          }
        }));
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Notify subscribers of data updates
   */
  private notifySubscribers<T>(key: string, data: SynchronizedData<T>): void {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.forEach(subscriberId => {
        this.emit(`data_${key}`, data, subscriberId);
      });
    }
    
    // Emit global update event
    this.emit('data_updated', { key, data });
  }

  /**
   * Setup cleanup interval for stale data
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupStaleData();
    }, 60000); // Clean up every minute
  }

  /**
   * Setup queue processor
   */
  private setupQueueProcessor(): void {
    setInterval(() => {
      if (this.updateQueue.length > 0 && !this.isProcessingQueue) {
        this.processQueue();
      }
    }, 100); // Check every 100ms
  }

  /**
   * Clean up stale data and expired conflicts
   */
  private cleanupStaleData(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Clean up stale data
    for (const [key, timestamp] of this.lastUpdateTimestamps.entries()) {
      if (now - timestamp > this.stalenessThreshold * 2) { // 2x staleness threshold
        expiredKeys.push(key);
      }
    }

    // Clean up expired conflicts
    for (const [key, conflicts] of this.conflictBuffer.entries()) {
      const validConflicts = conflicts.filter(op => now - op.source.timestamp < 300000); // 5 minutes
      if (validConflicts.length === 0) {
        this.conflictBuffer.delete(key);
      } else {
        this.conflictBuffer.set(key, validConflicts);
      }
    }

    // Remove expired keys
    expiredKeys.forEach(key => {
      this.dataStore.delete(key);
      this.lastUpdateTimestamps.delete(key);
      this.pendingUpdates.delete(key);
      logger.info(`Cleaned up stale data for key: ${key}`);
    });

    if (expiredKeys.length > 0) {
      this.emit('cleanup_completed', { removedKeys: expiredKeys });
    }
  }

  /**
   * Create a data source descriptor
   */
  createDataSource(type: 'realtime' | 'api' | 'cache', customPriority?: number): DataSource {
    return {
      type,
      timestamp: Date.now(),
      priority: customPriority || this.priorityLevels[type],
      version: `${type}-${Date.now()}`
    };
  }

  /**
   * Resolve manual conflicts
   */
  resolveManualConflict<T>(key: string, resolution: T): boolean {
    const conflicts = this.conflictBuffer.get(key);
    if (!conflicts || conflicts.length === 0) return false;

    const resolvedOperation: UpdateOperation<T> = {
      key,
      data: resolution,
      source: this.createDataSource('api'), // Use API source for manual resolutions
      mergeStrategy: 'replace'
    };

    // Clear conflicts and apply resolution
    this.conflictBuffer.delete(key);
    this.updateData(resolvedOperation);
    
    this.emit('conflict_resolved', { key, resolution });
    return true;
  }
}

export const stateSynchronizationManager = StateSynchronizationManager.getInstance();
export default stateSynchronizationManager;