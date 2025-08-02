// Caching utilities for API responses

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh data
}

export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
};

export class ApiCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired && !this.options.staleWhileRevalidate) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired && !this.options.staleWhileRevalidate) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    return Date.now() - entry.timestamp > entry.ttl;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired entries
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      isStale: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      isStale: now - entry.timestamp > entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: 0, // Would need to track hits/misses to calculate
      entries,
    };
  }
}

// Cache manager for coordinating multiple caches
export class CacheManager {
  private caches: Map<string, ApiCache> = new Map();
  private defaultOptions: CacheOptions;

  constructor(defaultOptions: Partial<CacheOptions> = {}) {
    this.defaultOptions = { ...DEFAULT_CACHE_OPTIONS, ...defaultOptions };
  }

  getCache<T>(namespace: string, options?: Partial<CacheOptions>): ApiCache<T> {
    if (!this.caches.has(namespace)) {
      const cacheOptions = { ...this.defaultOptions, ...options };
      this.caches.set(namespace, new ApiCache<T>(cacheOptions));
    }
    return this.caches.get(namespace) as ApiCache<T>;
  }

  clearNamespace(namespace: string): boolean {
    const cache = this.caches.get(namespace);
    if (cache) {
      cache.clear();
      return true;
    }
    return false;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  cleanupAll(): number {
    let totalRemoved = 0;
    for (const cache of this.caches.values()) {
      totalRemoved += cache.cleanup();
    }
    return totalRemoved;
  }

  getGlobalStats(): {
    totalCaches: number;
    totalEntries: number;
    cacheStats: Array<{
      namespace: string;
      size: number;
      staleEntries: number;
    }>;
  } {
    const cacheStats = Array.from(this.caches.entries()).map(([namespace, cache]) => {
      const stats = cache.getStats();
      return {
        namespace,
        size: stats.size,
        staleEntries: stats.entries.filter(e => e.isStale).length,
      };
    });

    return {
      totalCaches: this.caches.size,
      totalEntries: cacheStats.reduce((sum, stats) => sum + stats.size, 0),
      cacheStats,
    };
  }
}

// Key generation utilities
export class CacheKeyGenerator {
  static forApiCall(
    endpoint: string,
    params?: Record<string, any>,
    userId?: string
  ): string {
    const keyParts = [endpoint];
    
    if (userId) {
      keyParts.push(`user:${userId}`);
    }
    
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${JSON.stringify(params[key])}`)
        .join('|');
      keyParts.push(sortedParams);
    }
    
    return keyParts.join('::');
  }

  static forUser(userId: string, resource: string, id?: string): string {
    const parts = [`user:${userId}`, resource];
    if (id) {
      parts.push(id);
    }
    return parts.join('::');
  }

  static forResource(resource: string, id: string, action?: string): string {
    const parts = [resource, id];
    if (action) {
      parts.push(action);
    }
    return parts.join('::');
  }

  static forQuery(query: string, filters?: Record<string, any>): string {
    const parts = [`query:${query}`];
    
    if (filters && Object.keys(filters).length > 0) {
      const sortedFilters = Object.keys(filters)
        .sort()
        .map(key => `${key}:${JSON.stringify(filters[key])}`)
        .join('|');
      parts.push(sortedFilters);
    }
    
    return parts.join('::');
  }
}

// Global cache instance
export const globalCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  staleWhileRevalidate: true,
});