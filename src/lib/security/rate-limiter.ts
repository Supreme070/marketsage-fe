/**
 * Advanced Rate Limiting System
 * ============================
 * Prevents abuse and protects against DDoS attacks
 */

import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string, endpoint: string) => string;
  skipIf?: (identifier: string, endpoint: string) => boolean;
  onLimitReached?: (identifier: string, endpoint: string) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  violations: number;
}

export class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string, endpoint: string): RateLimitResult {
    const now = Date.now();
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier, endpoint)
      : `${identifier}:${endpoint}`;

    // Check if this request should be skipped
    if (this.config.skipIf && this.config.skipIf(identifier, endpoint)) {
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }

    let entry = this.storage.get(key);
    
    // Create new entry if doesn't exist
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
        lastRequest: now,
        blocked: false,
        violations: 0
      };
      this.storage.set(key, entry);
    }

    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.blocked = false;
      entry.firstRequest = now;
    }

    // Update last request time
    entry.lastRequest = now;

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      entry.blocked = true;
      entry.violations++;

      // Call limit reached callback
      if (this.config.onLimitReached) {
        this.config.onLimitReached(identifier, endpoint);
      }

      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint,
        count: entry.count,
        limit: this.config.maxRequests,
        violations: entry.violations,
        windowMs: this.config.windowMs
      });

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Record a failed attempt (for progressive penalties)
   */
  recordFailedAttempt(identifier: string, endpoint: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier, endpoint)
      : `${identifier}:${endpoint}`;

    const entry = this.storage.get(key);
    if (entry) {
      entry.violations++;
      
      // Apply progressive penalty
      if (entry.violations > 5) {
        // Extend the reset time for repeated violations
        entry.resetTime = Date.now() + (this.config.windowMs * Math.min(entry.violations, 10));
      }
    }
  }

  /**
   * Record a successful attempt (clears violations)
   */
  recordSuccessfulAttempt(identifier: string, endpoint: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier, endpoint)
      : `${identifier}:${endpoint}`;

    const entry = this.storage.get(key);
    if (entry) {
      entry.violations = Math.max(0, entry.violations - 1);
      entry.blocked = false;
    }
  }

  /**
   * Get current status for identifier
   */
  getStatus(identifier: string, endpoint: string): RateLimitEntry | null {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier, endpoint)
      : `${identifier}:${endpoint}`;

    return this.storage.get(key) || null;
  }

  /**
   * Clear rate limit for identifier
   */
  clear(identifier: string, endpoint: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier, endpoint)
      : `${identifier}:${endpoint}`;

    this.storage.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.storage) {
      // Remove entries that are expired and have no violations
      if (now > entry.resetTime && entry.violations === 0) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Rate limiter cleanup completed', {
        entriesRemoved: cleanedCount,
        remainingEntries: this.storage.size
      });
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    topViolators: Array<{ key: string; violations: number; count: number }>;
  } {
    const stats = {
      totalEntries: this.storage.size,
      blockedEntries: 0,
      topViolators: [] as Array<{ key: string; violations: number; count: number }>
    };

    const violators: Array<{ key: string; violations: number; count: number }> = [];

    for (const [key, entry] of this.storage) {
      if (entry.blocked) {
        stats.blockedEntries++;
      }
      
      if (entry.violations > 0) {
        violators.push({
          key,
          violations: entry.violations,
          count: entry.count
        });
      }
    }

    stats.topViolators = violators
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    return stats;
  }

  /**
   * Destroy rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // Authentication attempts
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    onLimitReached: (identifier) => {
      logger.warn('Authentication rate limit exceeded', { identifier });
    }
  }),

  // API requests
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    onLimitReached: (identifier, endpoint) => {
      logger.warn('API rate limit exceeded', { identifier, endpoint });
    }
  }),

  // AI operations
  ai: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50, // 50 AI operations per 5 minutes
    onLimitReached: (identifier) => {
      logger.warn('AI rate limit exceeded', { identifier });
    }
  }),

  // Email sending
  email: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // 1000 emails per hour
    onLimitReached: (identifier) => {
      logger.warn('Email rate limit exceeded', { identifier });
    }
  }),

  // SMS sending
  sms: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 SMS per hour
    onLimitReached: (identifier) => {
      logger.warn('SMS rate limit exceeded', { identifier });
    }
  }),

  // File uploads
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 uploads per hour
    onLimitReached: (identifier) => {
      logger.warn('Upload rate limit exceeded', { identifier });
    }
  }),

  // Data exports
  export: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10, // 10 exports per day
    onLimitReached: (identifier) => {
      logger.warn('Export rate limit exceeded', { identifier });
    }
  }),

  // Password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 password resets per hour
    onLimitReached: (identifier) => {
      logger.warn('Password reset rate limit exceeded', { identifier });
    }
  }),

  // Account creation
  registration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
    onLimitReached: (identifier) => {
      logger.warn('Registration rate limit exceeded', { identifier });
    }
  })
};

// Role-based rate limits
export const roleBasedRateLimits = {
  USER: {
    api: { windowMs: 60 * 1000, maxRequests: 60 },
    ai: { windowMs: 5 * 60 * 1000, maxRequests: 20 },
    email: { windowMs: 60 * 60 * 1000, maxRequests: 100 },
    sms: { windowMs: 60 * 60 * 1000, maxRequests: 50 }
  },
  ADMIN: {
    api: { windowMs: 60 * 1000, maxRequests: 200 },
    ai: { windowMs: 5 * 60 * 1000, maxRequests: 100 },
    email: { windowMs: 60 * 60 * 1000, maxRequests: 500 },
    sms: { windowMs: 60 * 60 * 1000, maxRequests: 200 }
  },
  IT_ADMIN: {
    api: { windowMs: 60 * 1000, maxRequests: 500 },
    ai: { windowMs: 5 * 60 * 1000, maxRequests: 200 },
    email: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },
    sms: { windowMs: 60 * 60 * 1000, maxRequests: 500 }
  },
  SUPER_ADMIN: {
    api: { windowMs: 60 * 1000, maxRequests: 1000 },
    ai: { windowMs: 5 * 60 * 1000, maxRequests: 500 },
    email: { windowMs: 60 * 60 * 1000, maxRequests: 5000 },
    sms: { windowMs: 60 * 60 * 1000, maxRequests: 1000 }
  }
};

/**
 * Create role-based rate limiter
 */
export function createRoleBasedRateLimiter(
  role: keyof typeof roleBasedRateLimits,
  type: keyof typeof roleBasedRateLimits.USER
): RateLimiter {
  const config = roleBasedRateLimits[role][type];
  
  return new RateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    keyGenerator: (identifier, endpoint) => `${role}:${identifier}:${endpoint}`,
    onLimitReached: (identifier, endpoint) => {
      logger.warn(`${role} rate limit exceeded`, { 
        identifier, 
        endpoint, 
        type,
        role 
      });
    }
  });
}

/**
 * Express middleware for rate limiting
 */
export function rateLimitMiddleware(rateLimiter: RateLimiter) {
  return (req: any, res: any, next: any) => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const endpoint = req.path || req.url || 'unknown';
    
    const result = rateLimiter.check(identifier, endpoint);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
      if (result.retryAfter) {
        res.set('Retry-After', result.retryAfter.toString());
      }
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter
      });
    }
    
    next();
  };
}

// Export the main rate limiter instance
export const authRateLimiter = rateLimiters.auth;