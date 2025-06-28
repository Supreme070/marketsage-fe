/**
 * Simple in-memory cache implementation
 * Temporary replacement for LRUCache to fix build issues
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class SimpleCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: { max: number; ttl?: number }) {
    this.maxSize = options.max;
    this.defaultTTL = options.ttl || 1000 * 60 * 15; // 15 minutes default
  }

  set(key: string, value: T, ttl?: number): void {
    // Clean expired entries if cache is at max size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
      
      // If still at max size, remove oldest entry
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    this.cleanup();
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    this.cleanup();
    return this.cache.keys();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}