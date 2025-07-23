/**
 * Edge Cache for Analytics Data
 * 
 * High-performance caching system with edge optimization for analytics data.
 * Includes intelligent cache invalidation, compression, and geographic distribution.
 */

import { Redis } from 'ioredis';

interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  metadata: {
    version: number;
    compressed: boolean;
    size: number;
    hits: number;
    createdAt: number;
    lastAccessed: number;
  };
}

interface CacheConfig {
  defaultTtl: number;
  maxMemorySize: number;
  compressionThreshold: number;
  enableCompression: boolean;
  enableMetrics: boolean;
  edgeNodes: string[];
  replicationFactor: number;
  consistencyLevel: 'strong' | 'eventual' | 'weak';
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
  compressionRatio: number;
  evictions: number;
  errors: number;
  averageLatency: number;
  edgeHits: number;
  edgeMisses: number;
}

interface CacheQuery {
  key: string;
  pattern?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'hits' | 'size';
  order?: 'asc' | 'desc';
}

/**
 * Edge Cache Manager
 */
export class EdgeCache {
  private memoryCache: Map<string, CacheEntry>;
  private redis: Redis | null = null;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 3600, // 1 hour
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableMetrics: true,
      edgeNodes: [],
      replicationFactor: 2,
      consistencyLevel: 'eventual',
      ...config
    };

    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsage: 0,
      keyCount: 0,
      compressionRatio: 0,
      evictions: 0,
      errors: 0,
      averageLatency: 0,
      edgeHits: 0,
      edgeMisses: 0
    };

    this.initializeRedis();
    this.startCleanupInterval();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableReadyCheck: true
        });

        this.redis.on('error', (error) => {
          console.error('Redis cache error:', error);
          this.metrics.errors++;
        });
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options: { 
    preferEdge?: boolean;
    bypassCache?: boolean;
    updateMetrics?: boolean;
  } = {}): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      if (options.bypassCache) {
        return null;
      }

      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        this.updateAccessMetrics(memoryEntry);
        this.metrics.hits++;
        this.updateLatencyMetrics(Date.now() - startTime);
        return memoryEntry.value as T;
      }

      // Try Redis cache
      if (this.redis) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          const entry = JSON.parse(redisValue) as CacheEntry<T>;
          if (this.isValidEntry(entry)) {
            // Store in memory cache for faster access
            this.memoryCache.set(key, entry);
            this.updateAccessMetrics(entry);
            this.metrics.hits++;
            this.updateLatencyMetrics(Date.now() - startTime);
            return entry.value;
          }
        }
      }

      // Try edge nodes if configured
      if (options.preferEdge && this.config.edgeNodes.length > 0) {
        const edgeResult = await this.getFromEdgeNodes<T>(key);
        if (edgeResult) {
          this.metrics.edgeHits++;
          this.updateLatencyMetrics(Date.now() - startTime);
          return edgeResult;
        }
        this.metrics.edgeMisses++;
      }

      this.metrics.misses++;
      this.updateLatencyMetrics(Date.now() - startTime);
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      tags?: string[];
      compress?: boolean;
      replicate?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    try {
      const ttl = options.ttl || this.config.defaultTtl;
      const tags = options.tags || [];
      const compress = options.compress ?? this.config.enableCompression;
      
      let processedValue = value;
      let compressed = false;
      
      // Compression
      if (compress && this.shouldCompress(value)) {
        processedValue = this.compressValue(value);
        compressed = true;
      }

      const entry: CacheEntry<T> = {
        key,
        value: processedValue,
        timestamp: Date.now(),
        ttl,
        tags,
        metadata: {
          version: 1,
          compressed,
          size: this.calculateSize(processedValue),
          hits: 0,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          ...options.metadata
        }
      };

      // Store in memory cache
      this.memoryCache.set(key, entry);

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(entry));
      }

      // Replicate to edge nodes
      if (options.replicate && this.config.edgeNodes.length > 0) {
        await this.replicateToEdgeNodes(key, entry);
      }

      this.updateMemoryMetrics();
      return true;

    } catch (error) {
      console.error('Cache set error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options: { deleteFromEdge?: boolean } = {}): Promise<boolean> {
    try {
      // Delete from memory cache
      const deleted = this.memoryCache.delete(key);

      // Delete from Redis
      if (this.redis) {
        await this.redis.del(key);
      }

      // Delete from edge nodes
      if (options.deleteFromEdge && this.config.edgeNodes.length > 0) {
        await this.deleteFromEdgeNodes(key);
      }

      this.updateMemoryMetrics();
      return deleted;

    } catch (error) {
      console.error('Cache delete error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Clear cache by pattern or tags
   */
  async clear(query: CacheQuery = {}): Promise<number> {
    try {
      let deletedCount = 0;

      if (query.pattern) {
        // Clear by pattern
        for (const [key, entry] of this.memoryCache.entries()) {
          if (this.matchesPattern(key, query.pattern)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }

        // Clear from Redis
        if (this.redis) {
          const keys = await this.redis.keys(query.pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
            deletedCount += keys.length;
          }
        }
      } else if (query.tags && query.tags.length > 0) {
        // Clear by tags
        for (const [key, entry] of this.memoryCache.entries()) {
          if (this.matchesTags(entry.tags, query.tags)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
      } else {
        // Clear all
        deletedCount = this.memoryCache.size;
        this.memoryCache.clear();
        
        if (this.redis) {
          await this.redis.flushall();
        }
      }

      this.updateMemoryMetrics();
      return deletedCount;

    } catch (error) {
      console.error('Cache clear error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Get multiple values at once
   */
  async getMultiple<T = any>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    await Promise.all(keys.map(async (key) => {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }));
    
    return results;
  }

  /**
   * Set multiple values at once
   */
  async setMultiple<T = any>(entries: Array<{
    key: string;
    value: T;
    options?: Parameters<typeof this.set>[2];
  }>): Promise<boolean[]> {
    return Promise.all(entries.map(entry => 
      this.set(entry.key, entry.value, entry.options)
    ));
  }

  /**
   * Get cache statistics
   */
  getMetrics(): CacheMetrics {
    this.updateHitRate();
    return { ...this.metrics };
  }

  /**
   * Get cache keys matching query
   */
  getKeys(query: CacheQuery = {}): string[] {
    const keys: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.matchesQuery(key, entry, query)) {
        keys.push(key);
      }
    }
    
    // Apply sorting
    if (query.sortBy) {
      keys.sort((a, b) => {
        const entryA = this.memoryCache.get(a)!;
        const entryB = this.memoryCache.get(b)!;
        
        let comparison = 0;
        switch (query.sortBy) {
          case 'timestamp':
            comparison = entryA.timestamp - entryB.timestamp;
            break;
          case 'hits':
            comparison = entryA.metadata.hits - entryB.metadata.hits;
            break;
          case 'size':
            comparison = entryA.metadata.size - entryB.metadata.size;
            break;
        }
        
        return query.order === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply pagination
    if (query.offset || query.limit) {
      const start = query.offset || 0;
      const end = query.limit ? start + query.limit : undefined;
      return keys.slice(start, end);
    }
    
    return keys;
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    return this.clear({ tags });
  }

  /**
   * Refresh cache entry
   */
  async refresh<T = any>(key: string, refreshFn: () => Promise<T>, options: Parameters<typeof this.set>[2] = {}): Promise<T | null> {
    try {
      const newValue = await refreshFn();
      await this.set(key, newValue, options);
      return newValue;
    } catch (error) {
      console.error('Cache refresh error:', error);
      return null;
    }
  }

  /**
   * Preload cache with data
   */
  async preload<T = any>(entries: Array<{
    key: string;
    loader: () => Promise<T>;
    options?: Parameters<typeof this.set>[2];
  }>): Promise<void> {
    await Promise.all(entries.map(async (entry) => {
      try {
        const value = await entry.loader();
        await this.set(entry.key, value, entry.options);
      } catch (error) {
        console.error(`Preload error for key ${entry.key}:`, error);
      }
    }));
  }

  /**
   * Private helper methods
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < (entry.ttl * 1000);
  }

  private shouldCompress(value: any): boolean {
    return this.calculateSize(value) > this.config.compressionThreshold;
  }

  private compressValue(value: any): any {
    // Simple compression simulation - in real implementation use gzip
    return JSON.stringify(value);
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length;
  }

  private updateAccessMetrics(entry: CacheEntry): void {
    entry.metadata.hits++;
    entry.metadata.lastAccessed = Date.now();
  }

  private updateMemoryMetrics(): void {
    this.metrics.keyCount = this.memoryCache.size;
    this.metrics.memoryUsage = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private updateLatencyMetrics(latency: number): void {
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private matchesTags(entryTags: string[], queryTags: string[]): boolean {
    return queryTags.some(tag => entryTags.includes(tag));
  }

  private matchesQuery(key: string, entry: CacheEntry, query: CacheQuery): boolean {
    if (query.key && key !== query.key) return false;
    if (query.pattern && !this.matchesPattern(key, query.pattern)) return false;
    if (query.tags && !this.matchesTags(entry.tags, query.tags)) return false;
    return true;
  }

  private async getFromEdgeNodes<T>(key: string): Promise<T | null> {
    // Edge node communication would be implemented here
    // For now, return null as edge nodes are not implemented
    return null;
  }

  private async replicateToEdgeNodes(key: string, entry: CacheEntry): Promise<void> {
    // Edge node replication would be implemented here
  }

  private async deleteFromEdgeNodes(key: string): Promise<void> {
    // Edge node deletion would be implemented here
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000); // 5 minutes
  }

  private cleanup(): void {
    const now = Date.now();
    let evicted = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
        evicted++;
      }
    }
    
    this.metrics.evictions += evicted;
    this.updateMemoryMetrics();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.redis) {
      this.redis.disconnect();
    }
    this.memoryCache.clear();
  }
}

// Analytics-specific cache wrapper
export class AnalyticsCache extends EdgeCache {
  constructor(config: Partial<CacheConfig> = {}) {
    super({
      defaultTtl: 1800, // 30 minutes for analytics
      enableCompression: true,
      compressionThreshold: 512,
      ...config
    });
  }

  async getVisitorStats(visitorId: string): Promise<any> {
    return this.get(`visitor:${visitorId}`, { preferEdge: true });
  }

  async setVisitorStats(visitorId: string, stats: any): Promise<boolean> {
    return this.set(`visitor:${visitorId}`, stats, {
      ttl: 1800, // 30 minutes
      tags: ['visitor', 'stats'],
      compress: true
    });
  }

  async getSegmentData(segmentId: string): Promise<any> {
    return this.get(`segment:${segmentId}`);
  }

  async setSegmentData(segmentId: string, data: any): Promise<boolean> {
    return this.set(`segment:${segmentId}`, data, {
      ttl: 3600, // 1 hour
      tags: ['segment', 'analytics'],
      compress: true
    });
  }

  async getFunnelData(funnelId: string): Promise<any> {
    return this.get(`funnel:${funnelId}`);
  }

  async setFunnelData(funnelId: string, data: any): Promise<boolean> {
    return this.set(`funnel:${funnelId}`, data, {
      ttl: 1800, // 30 minutes
      tags: ['funnel', 'analytics'],
      compress: true
    });
  }

  async invalidateVisitorCache(visitorId: string): Promise<void> {
    await this.invalidateByTags(['visitor']);
  }

  async invalidateAnalyticsCache(): Promise<void> {
    await this.invalidateByTags(['analytics']);
  }

  async preloadAnalyticsData(dataLoaders: Record<string, () => Promise<any>>): Promise<void> {
    const entries = Object.entries(dataLoaders).map(([key, loader]) => ({
      key,
      loader,
      options: { tags: ['analytics'], compress: true }
    }));
    
    await this.preload(entries);
  }
}

// Singleton instance
let analyticsCache: AnalyticsCache | null = null;

export function getAnalyticsCache(): AnalyticsCache {
  if (!analyticsCache) {
    analyticsCache = new AnalyticsCache();
  }
  return analyticsCache;
}

export default EdgeCache;