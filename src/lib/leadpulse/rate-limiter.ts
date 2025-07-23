/**
 * LeadPulse Rate Limiter
 * 
 * Comprehensive rate limiting system to prevent tracking abuse and ensure
 * system stability. Supports multiple rate limiting strategies and 
 * configurable thresholds for different tracking scenarios.
 */

import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

// Rate limit types for different endpoints
export const RATE_LIMIT_TYPES = {
  // Core tracking endpoints
  TRACKING: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 1000,        // 1000 events per minute per IP
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
  },
  
  // Form submissions (more restrictive)
  FORM_SUBMIT: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 submissions per minute per IP
    blockDurationMs: 10 * 60 * 1000, // 10 minute block
  },
  
  // Mobile tracking (higher limits)
  MOBILE_TRACKING: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 2000,        // 2000 events per minute per IP
    blockDurationMs: 2 * 60 * 1000, // 2 minute block
  },
  
  // API analytics (moderate limits)
  ANALYTICS: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute per IP
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
  },
  
  // Admin endpoints (very restrictive)
  ADMIN: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 20,          // 20 requests per minute per IP
    blockDurationMs: 30 * 60 * 1000, // 30 minute block
  },
  
  // Bulk operations (very restrictive)
  BULK_OPERATIONS: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 5,           // 5 bulk operations per 5 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  }
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_TYPES;

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds to wait before retrying
}

interface RateLimitContext {
  ip: string;
  userAgent?: string;
  fingerprint?: string;
  userId?: string;
  organizationId?: string;
}

class LeadPulseRateLimiter {
  private redis: Redis | null = null;
  
  constructor() {
    // Initialize Redis connection for rate limiting
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT || '6379'),
        db: 1, // Use separate DB for rate limiting
        keyPrefix: 'leadpulse:ratelimit:',
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
      
      this.redis.on('error', (error) => {
        logger.warn('Redis rate limiter connection error', { error: error.message });
      });
    } catch (error) {
      logger.warn('Failed to initialize Redis for rate limiting', { error });
    }
  }
  
  /**
   * Check if a request should be rate limited
   */
  async checkRateLimit(
    type: RateLimitType,
    context: RateLimitContext,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config = { ...RATE_LIMIT_TYPES[type], ...customConfig };
    const key = this.generateKey(type, context);
    
    try {
      if (!this.redis) {
        // Fallback to in-memory rate limiting
        return await this.fallbackRateLimit(key, config);
      }
      
      return await this.redisRateLimit(key, config);
    } catch (error) {
      logger.error('Rate limiting error', { error, type, key });
      
      // On error, allow the request but log the issue
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }
  }
  
  /**
   * Check if an IP is currently blocked
   */
  async isBlocked(type: RateLimitType, context: RateLimitContext): Promise<boolean> {
    const blockKey = this.generateBlockKey(type, context);
    
    try {
      if (!this.redis) {
        return false; // No blocking without Redis
      }
      
      const blocked = await this.redis.get(blockKey);
      return blocked !== null;
    } catch (error) {
      logger.warn('Error checking block status', { error, type });
      return false; // Allow on error
    }
  }
  
  /**
   * Block an IP for exceeding rate limits
   */
  async blockIP(type: RateLimitType, context: RateLimitContext): Promise<void> {
    const config = RATE_LIMIT_TYPES[type];
    if (!config.blockDurationMs) return;
    
    const blockKey = this.generateBlockKey(type, context);
    
    try {
      if (!this.redis) return;
      
      await this.redis.setex(
        blockKey,
        Math.floor(config.blockDurationMs / 1000),
        Date.now().toString()
      );
      
      logger.warn('IP blocked for rate limit violation', {
        type,
        ip: context.ip,
        blockDuration: config.blockDurationMs,
      });
    } catch (error) {
      logger.error('Error blocking IP', { error, type, ip: context.ip });
    }
  }
  
  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    type: RateLimitType,
    context: RateLimitContext
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_TYPES[type];
    const key = this.generateKey(type, context);
    
    try {
      if (!this.redis) {
        return {
          allowed: true,
          limit: config.maxRequests,
          remaining: config.maxRequests,
          resetTime: new Date(Date.now() + config.windowMs),
        };
      }
      
      const current = await this.redis.get(key);
      const count = current ? Number.parseInt(current) : 0;
      const ttl = await this.redis.ttl(key);
      
      return {
        allowed: count < config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs)),
      };
    } catch (error) {
      logger.error('Error getting rate limit status', { error, type, key });
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }
  }
  
  /**
   * Reset rate limit for a specific context (admin function)
   */
  async resetRateLimit(type: RateLimitType, context: RateLimitContext): Promise<void> {
    const key = this.generateKey(type, context);
    const blockKey = this.generateBlockKey(type, context);
    
    try {
      if (!this.redis) return;
      
      await Promise.all([
        this.redis.del(key),
        this.redis.del(blockKey),
      ]);
      
      logger.info('Rate limit reset', { type, ip: context.ip });
    } catch (error) {
      logger.error('Error resetting rate limit', { error, type, ip: context.ip });
    }
  }
  
  /**
   * Get rate limiting statistics
   */
  async getStatistics(): Promise<{
    totalBlocked: number;
    activeBlocks: number;
    rateLimitsByType: Record<string, number>;
  }> {
    try {
      if (!this.redis) {
        return {
          totalBlocked: 0,
          activeBlocks: 0,
          rateLimitsByType: {},
        };
      }
      
      const blockKeys = await this.redis.keys('*:block:*');
      const rateLimitKeys = await this.redis.keys('*:limit:*');
      
      const rateLimitsByType: Record<string, number> = {};
      
      // Count rate limits by type
      for (const key of rateLimitKeys) {
        const type = key.split(':')[2]; // Extract type from key
        if (!rateLimitsByType[type]) {
          rateLimitsByType[type] = 0;
        }
        rateLimitsByType[type]++;
      }
      
      return {
        totalBlocked: blockKeys.length,
        activeBlocks: blockKeys.length,
        rateLimitsByType,
      };
    } catch (error) {
      logger.error('Error getting rate limit statistics', { error });
      return {
        totalBlocked: 0,
        activeBlocks: 0,
        rateLimitsByType: {},
      };
    }
  }
  
  /**
   * Redis-based rate limiting implementation
   */
  private async redisRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Use Redis pipeline for atomic operations
    const pipeline = this.redis!.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results || results.length < 3) {
      throw new Error('Redis pipeline execution failed');
    }
    
    const count = results[2][1] as number;
    const allowed = count <= config.maxRequests;
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetTime: new Date(now + config.windowMs),
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
    };
  }
  
  /**
   * Fallback in-memory rate limiting (less accurate but functional)
   */
  private memoryStore = new Map<string, { count: number; resetTime: number }>();
  
  private async fallbackRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const stored = this.memoryStore.get(key);
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanupMemoryStore();
    }
    
    if (!stored || stored.resetTime <= now) {
      // New window
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now + config.windowMs),
      };
    }
    
    // Increment count
    stored.count++;
    const allowed = stored.count <= config.maxRequests;
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - stored.count),
      resetTime: new Date(stored.resetTime),
      retryAfter: allowed ? undefined : Math.ceil((stored.resetTime - now) / 1000),
    };
  }
  
  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, stored] of this.memoryStore.entries()) {
      if (stored.resetTime <= now) {
        this.memoryStore.delete(key);
      }
    }
  }
  
  /**
   * Generate cache key for rate limiting
   */
  private generateKey(type: RateLimitType, context: RateLimitContext): string {
    // Use multiple identifiers for more robust tracking
    const identifiers = [];
    
    // Primary identifier: IP address
    identifiers.push(context.ip);
    
    // Secondary identifier: User or organization (if available)
    if (context.userId) {
      identifiers.push(`user:${context.userId}`);
    } else if (context.organizationId) {
      identifiers.push(`org:${context.organizationId}`);
    }
    
    // Tertiary identifier: Browser fingerprint (if available)
    if (context.fingerprint) {
      identifiers.push(`fp:${context.fingerprint.slice(0, 16)}`);
    }
    
    return `limit:${type}:${identifiers.join(':')}`.toLowerCase();
  }
  
  /**
   * Generate block key for IP blocking
   */
  private generateBlockKey(type: RateLimitType, context: RateLimitContext): string {
    return `block:${type}:${context.ip}`.toLowerCase();
  }
  
  /**
   * Cleanup expired entries (called periodically)
   */
  async cleanup(): Promise<void> {
    try {
      if (!this.redis) {
        this.cleanupMemoryStore();
        return;
      }
      
      // Clean up expired Redis entries
      const keys = await this.redis.keys('*');
      const expiredKeys = [];
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1 || ttl === 0) {
          expiredKeys.push(key);
        }
      }
      
      if (expiredKeys.length > 0) {
        await this.redis.del(...expiredKeys);
        logger.info('Cleaned up expired rate limit entries', { count: expiredKeys.length });
      }
    } catch (error) {
      logger.error('Error during rate limit cleanup', { error });
    }
  }
}

// Export singleton instance
export const leadPulseRateLimiter = new LeadPulseRateLimiter();

/**
 * Middleware helper for Next.js API routes
 */
export function createRateLimitMiddleware(type: RateLimitType, customConfig?: Partial<RateLimitConfig>) {
  return async (request: Request, context: Partial<RateLimitContext> = {}) => {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    
    const rateLimitContext: RateLimitContext = {
      ip,
      userAgent,
      ...context,
    };
    
    // Check if IP is blocked
    const isBlocked = await leadPulseRateLimiter.isBlocked(type, rateLimitContext);
    if (isBlocked) {
      return {
        blocked: true,
        status: 429,
        headers: {
          'X-RateLimit-Blocked': 'true',
          'Retry-After': '300', // 5 minutes
        },
      };
    }
    
    // Check rate limit
    const result = await leadPulseRateLimiter.checkRateLimit(type, rateLimitContext, customConfig);
    
    // Block IP if limit exceeded
    if (!result.allowed) {
      await leadPulseRateLimiter.blockIP(type, rateLimitContext);
    }
    
    return {
      blocked: false,
      allowed: result.allowed,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toISOString(),
        ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
      },
      status: result.allowed ? 200 : 429,
    };
  };
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string {
  // Try multiple headers in order of preference
  const headers = [
    'cf-connecting-ip',     // Cloudflare
    'x-forwarded-for',      // Standard proxy header
    'x-real-ip',            // Nginx
    'x-client-ip',          // Apache
    'x-forwarded',          // General
    'forwarded-for',        // General
    'forwarded',            // RFC 7239
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Handle comma-separated IPs (take the first one)
      return value.split(',')[0].trim();
    }
  }
  
  return '127.0.0.1'; // Fallback
}

/**
 * Rate limiting decorator for API route handlers
 */
export function withRateLimit(type: RateLimitType, customConfig?: Partial<RateLimitConfig>) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (request: Request, ...args: any[]) {
      const middleware = createRateLimitMiddleware(type, customConfig);
      const result = await middleware(request);
      
      if (result.blocked || !result.allowed) {
        return Response.json(
          {
            error: 'Rate limit exceeded',
            message: result.blocked 
              ? 'IP temporarily blocked due to excessive requests'
              : 'Too many requests. Please try again later.',
          },
          {
            status: result.status,
            headers: result.headers,
          }
        );
      }
      
      // Call the original method
      const response = await method.call(this, request, ...args);
      
      // Add rate limit headers to response
      if (response && typeof response === 'object' && 'headers' in response) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    };
    
    return descriptor;
  };
}

// Periodic cleanup (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    leadPulseRateLimiter.cleanup().catch(error => {
      logger.error('Rate limiter cleanup failed', { error });
    });
  }, 5 * 60 * 1000);
}