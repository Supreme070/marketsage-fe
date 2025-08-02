import { type NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime > Date.now()) {
      return entry;
    }
    // Clean up expired entries
    if (entry) {
      this.store.delete(key);
    }
    return undefined;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const existing = this.get(key);
    if (existing) {
      existing.count++;
      this.set(key, existing);
      return existing;
    } else {
      const newEntry = { count: 1, resetTime: Date.now() + windowMs };
      this.set(key, newEntry);
      return newEntry;
    }
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

export const adminRateLimitConfigs = {
  // Standard rate limiting for most admin operations
  standard: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Strict rate limiting for sensitive operations
  strict: {
    requests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Bulk operations rate limiting
  bulk: {
    requests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  // Authentication related operations
  auth: {
    requests: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
  }
} as const;

/**
 * Rate limiting middleware for admin endpoints
 */
export async function adminRateLimit(
  req: NextRequest, 
  config: RateLimitConfig
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  try {
    // Generate rate limiting key
    const keyGenerator = config.keyGenerator || defaultKeyGenerator;
    const key = keyGenerator(req);

    // Check current usage
    const usage = rateLimitStore.increment(key, config.windowMs);

    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.requests - usage.count).toString(),
      'X-RateLimit-Reset': new Date(usage.resetTime).toISOString(),
    };

    // Check if rate limit exceeded
    if (usage.count > config.requests) {
      const retryAfter = Math.ceil((usage.resetTime - Date.now()) / 1000);
      
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${retryAfter} seconds.`,
            retryAfter: retryAfter
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': retryAfter.toString(),
            }
          }
        )
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow the request to proceed (fail open)
    return { allowed: true };
  }
}

/**
 * Default key generator for rate limiting
 * Combines IP address and user agent for better accuracy
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Get client IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  
  // Get user agent hash for additional uniqueness
  const userAgent = req.headers.get('user-agent') || '';
  const userAgentHash = simpleHash(userAgent);
  
  return `admin_${ip}_${userAgentHash}`;
}

/**
 * Simple hash function for user agent
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Enhanced rate limiting with user-specific limits
 */
export async function adminRateLimitWithUser(
  req: NextRequest,
  userId: string,
  operation: 'standard' | 'strict' | 'bulk' | 'auth'
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const config = {
    ...adminRateLimitConfigs[operation],
    keyGenerator: () => `admin_user_${userId}_${operation}`
  };

  return adminRateLimit(req, config);
}

/**
 * Rate limiting decorator for admin API routes
 */
export function withAdminRateLimit(
  operation: 'standard' | 'strict' | 'bulk' | 'auth' = 'standard'
) {
  return (handler: Function) => async (req: NextRequest, ...args: any[]) => {
      const rateLimitResult = await adminRateLimit(req, adminRateLimitConfigs[operation]);
      
      if (!rateLimitResult.allowed) {
        return rateLimitResult.response;
      }

      return handler(req, ...args);
    };
}

/**
 * Rate limiting middleware specifically for authentication endpoints
 */
export async function authRateLimit(req: NextRequest): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  return adminRateLimit(req, adminRateLimitConfigs.auth);
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key: string) {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return {
      requests: 0,
      remaining: 100, // Default limit
      resetTime: null
    };
  }

  return {
    requests: entry.count,
    remaining: Math.max(0, 100 - entry.count), // Assuming standard limit
    resetTime: new Date(entry.resetTime).toISOString()
  };
}

export default adminRateLimit;