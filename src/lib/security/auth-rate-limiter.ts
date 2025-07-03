import { type NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number;  // Max attempts per window
  blockDurationMs: number;  // How long to block after limit exceeded
}

interface RateLimitStore {
  [key: string]: {
    attempts: number;
    windowStart: number;
    blockedUntil?: number;
  };
}

/**
 * Enhanced rate limiter specifically for authentication endpoints
 * Implements progressive delays and temporary blocking for brute force protection
 */
class AuthRateLimiter {
  private store: RateLimitStore = {};
  private configs: { [endpoint: string]: RateLimitConfig } = {
    // Stricter limits for authentication endpoints
    '/api/auth/signin': { windowMs: 15 * 60 * 1000, maxAttempts: 5, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per 15min, block 30min
    '/api/auth/signup': { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour, block 1hr
    '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour
    '/api/auth/reset-password': { windowMs: 60 * 60 * 1000, maxAttempts: 5, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per hour
    'default': { windowMs: 60 * 1000, maxAttempts: 60, blockDurationMs: 5 * 60 * 1000 } // Default: 60 per minute
  };

  /**
   * Check if request is rate limited
   * @param identifier Unique identifier (IP, user ID, email)
   * @param endpoint API endpoint path
   * @returns Rate limit result
   */
  check(identifier: string, endpoint: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const config = this.configs[endpoint] || this.configs['default'];
    const now = Date.now();
    const key = `${identifier}:${endpoint}`;
    
    // Clean up expired entries periodically
    this.cleanup();

    // Get or initialize store entry
    let entry = this.store[key];
    if (!entry) {
      entry = this.store[key] = {
        attempts: 0,
        windowStart: now
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // Reset window if expired
    if (now - entry.windowStart > config.windowMs) {
      entry.attempts = 0;
      entry.windowStart = now;
      delete entry.blockedUntil;
    }

    // Check if limit exceeded
    if (entry.attempts >= config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil(config.blockDurationMs / 1000)
      };
    }

    // Allow request and increment counter
    entry.attempts++;
    
    return {
      allowed: true,
      remaining: config.maxAttempts - entry.attempts,
      resetTime: entry.windowStart + config.windowMs
    };
  }

  /**
   * Record a failed authentication attempt
   * @param identifier Unique identifier
   * @param endpoint API endpoint path
   */
  recordFailedAttempt(identifier: string, endpoint: string): void {
    this.check(identifier, endpoint); // This will increment the counter
  }

  /**
   * Record a successful authentication (reset counter)
   * @param identifier Unique identifier  
   * @param endpoint API endpoint path
   */
  recordSuccessfulAttempt(identifier: string, endpoint: string): void {
    const key = `${identifier}:${endpoint}`;
    delete this.store[key]; // Clear the rate limit on success
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, entry] of Object.entries(this.store)) {
      // Remove if older than maxAge and not blocked
      if (now - entry.windowStart > maxAge && (!entry.blockedUntil || now > entry.blockedUntil)) {
        delete this.store[key];
      }
    }
  }

  /**
   * Get current status for an identifier
   * @param identifier Unique identifier
   * @param endpoint API endpoint path
   */
  getStatus(identifier: string, endpoint: string): {
    attempts: number;
    isBlocked: boolean;
    blockedUntil?: number;
  } {
    const key = `${identifier}:${endpoint}`;
    const entry = this.store[key];
    const now = Date.now();

    if (!entry) {
      return { attempts: 0, isBlocked: false };
    }

    const isBlocked = entry.blockedUntil ? now < entry.blockedUntil : false;

    return {
      attempts: entry.attempts,
      isBlocked,
      blockedUntil: entry.blockedUntil
    };
  }
}

// Export singleton instance
export const authRateLimiter = new AuthRateLimiter();

/**
 * Middleware function to apply authentication rate limiting
 * @param request Next.js request object
 * @param endpoint API endpoint path
 * @returns Rate limit response or null if allowed
 */
export function checkAuthRateLimit(
  request: NextRequest, 
  endpoint: string
): NextResponse | null {
  const identifier = getRequestIdentifier(request);
  const result = authRateLimiter.check(identifier, endpoint);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many authentication attempts',
        message: 'Your account has been temporarily locked due to too many failed attempts. Please try again later.',
        retryAfter: result.retryAfter
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': (result.retryAfter || 1800).toString(), // Default 30min
          'X-Auth-Block-Type': 'rate-limit'
        }
      }
    );
  }

  return null; // Request allowed
}

/**
 * Get unique identifier for rate limiting (IP + User Agent hash)
 * @param request Next.js request object
 * @returns Unique identifier string
 */
function getRequestIdentifier(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a simple hash of user agent for additional uniqueness
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 10);
  
  return `${ip}:${userAgentHash}`;
}

/**
 * Extract client IP from request headers
 * @param request Next.js request object
 * @returns Client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}