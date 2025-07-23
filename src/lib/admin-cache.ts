import { NextRequest, NextResponse } from 'next/server';

// Cache implementation (in production, use Redis)
class AdminCache {
  private cache = new Map<string, { data: any; expires: number; etag: string }>();

  get(key: string): { data: any; etag: string } | null {
    const entry = this.cache.get(key);
    if (entry && entry.expires > Date.now()) {
      return { data: entry.data, etag: entry.etag };
    }
    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  set(key: string, data: any, ttlMs: number): string {
    const etag = this.generateETag(data);
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { data, expires, etag });
    return etag;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache entries matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Generate ETag for cache validation
  private generateETag(data: any): string {
    const hash = this.simpleHash(JSON.stringify(data));
    return `"${hash}"`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const total = this.cache.size;
    const expired = Array.from(this.cache.values()).filter(entry => entry.expires <= now).length;
    
    return {
      total,
      active: total - expired,
      expired,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.entries());
    const size = entries.reduce((total, [key, value]) => {
      return total + key.length + JSON.stringify(value.data).length;
    }, 0);
    
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
}

const adminCache = new AdminCache();

// Cleanup expired entries every 10 minutes
setInterval(() => adminCache.cleanup(), 10 * 60 * 1000);

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
  invalidateOnMutation?: boolean;
  varyBy?: string[]; // Headers or parameters to vary cache by
}

// Cache configurations for different admin operations
export const adminCacheConfigs = {
  // Dashboard overview - cache for 5 minutes
  dashboardOverview: {
    ttl: 5 * 60 * 1000,
    key: 'admin_dashboard_overview',
    invalidateOnMutation: true
  },
  
  // User lists - cache for 2 minutes
  userLists: {
    ttl: 2 * 60 * 1000,
    key: 'admin_users',
    invalidateOnMutation: true,
    varyBy: ['page', 'limit', 'search', 'status']
  },

  // Analytics data - cache for 15 minutes
  analytics: {
    ttl: 15 * 60 * 1000,
    key: 'admin_analytics',
    varyBy: ['dateFrom', 'dateTo', 'type']
  },

  // System settings - cache for 30 minutes
  systemSettings: {
    ttl: 30 * 60 * 1000,
    key: 'admin_settings',
    invalidateOnMutation: true,
    varyBy: ['type']
  },

  // Audit logs - cache for 1 minute (frequently changing)
  auditLogs: {
    ttl: 1 * 60 * 1000,
    key: 'admin_audit',
    varyBy: ['page', 'limit', 'dateFrom', 'dateTo']
  }
} as const;

/**
 * Generate cache key with variations
 */
function generateCacheKey(config: CacheConfig, req: NextRequest, params?: any): string {
  let key = config.key;
  
  if (config.varyBy) {
    const url = new URL(req.url);
    const variations = config.varyBy.map(param => {
      return `${param}:${url.searchParams.get(param) || params?.[param] || 'null'}`;
    }).join('|');
    
    key = `${key}_${variations}`;
  }
  
  return key;
}

/**
 * Cache middleware for admin GET requests
 */
export async function withAdminCache(
  req: NextRequest,
  config: CacheConfig,
  fetchFunction: () => Promise<any>,
  params?: any
): Promise<NextResponse> {
  try {
    const cacheKey = generateCacheKey(config, req, params);
    
    // Check for client-side caching headers
    const ifNoneMatch = req.headers.get('if-none-match');
    
    // Try to get from cache
    const cached = adminCache.get(cacheKey);
    
    if (cached) {
      // Check if client has the same version (ETag)
      if (ifNoneMatch === cached.etag) {
        return new NextResponse(null, { 
          status: 304,
          headers: {
            'ETag': cached.etag,
            'Cache-Control': `max-age=${Math.floor(config.ttl / 1000)}`,
          }
        });
      }
      
      // Return cached data with proper headers
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheKey
      }, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': `max-age=${Math.floor(config.ttl / 1000)}`,
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch fresh data
    const data = await fetchFunction();
    
    // Store in cache
    const etag = adminCache.set(cacheKey, data, config.ttl);
    
    // Return fresh data with cache headers
    return NextResponse.json({
      success: true,
      data,
      cached: false,
      cacheKey
    }, {
      headers: {
        'ETag': etag,
        'Cache-Control': `max-age=${Math.floor(config.ttl / 1000)}`,
        'X-Cache': 'MISS'
      }
    });
    
  } catch (error) {
    console.error('Cache middleware error:', error);
    // Fallback to direct fetch on cache error
    const data = await fetchFunction();
    return NextResponse.json({
      success: true,
      data,
      cached: false,
      error: 'Cache error, served fresh'
    });
  }
}

/**
 * Invalidate cache entries when data is mutated
 */
export function invalidateAdminCache(pattern: string): void {
  adminCache.invalidatePattern(pattern);
}

/**
 * Specific cache invalidation functions
 */
export const cacheInvalidators = {
  // Invalidate user-related caches
  users: () => {
    invalidateAdminCache('admin_users');
    invalidateAdminCache('admin_dashboard_overview');
  },
  
  // Invalidate settings caches
  settings: () => {
    invalidateAdminCache('admin_settings');
    invalidateAdminCache('admin_dashboard_overview');
  },
  
  // Invalidate analytics caches
  analytics: () => {
    invalidateAdminCache('admin_analytics');
  },
  
  // Invalidate all caches
  all: () => {
    invalidateAdminCache('admin_.*');
  }
};

/**
 * Cache warming function for critical data
 */
export async function warmAdminCache(): Promise<void> {
  try {
    // This would pre-populate cache with critical admin data
    console.log('Admin cache warming started...');
    
    // Example: Pre-fetch dashboard data, user counts, system status
    // In a real implementation, you'd call the actual data fetch functions
    
    console.log('Admin cache warming completed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getAdminCacheStats() {
  return {
    ...adminCache.getStats(),
    configurations: Object.keys(adminCacheConfigs).length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware decorator for caching admin responses
 */
export function withCaching(config: CacheConfig) {
  return function(handler: Function) {
    return async function(req: NextRequest, ...args: any[]) {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return handler(req, ...args);
      }
      
      return withAdminCache(req, config, () => handler(req, ...args));
    };
  };
}

export { adminCache };
export default withAdminCache;