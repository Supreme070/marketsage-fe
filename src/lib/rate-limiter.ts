import { redisCache } from '@/lib/cache/redis-client';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Skip rate limiting in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowMs
        };
      }
      
      // TODO: Implement proper Redis-based rate limiting when Redis is available
      // For now, always allow requests since Redis is not connected
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
      
      /*
      // Use Redis sorted set to track requests in time window
      const pipeline = redisCache.pipeline();
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry on the key
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const currentCount = (results[1][1] as number) || 0;
      const remaining = Math.max(0, this.config.maxRequests - currentCount - 1);
      const resetTime = now + this.config.windowMs;

      if (currentCount >= this.config.maxRequests) {
        // Remove the request we just added since it's not allowed
        await redisCache.zrem(key, `${now}-${Math.random()}`);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          error: 'Rate limit exceeded'
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime
      };
      */
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        error: 'Rate limiter service unavailable'
      };
    }
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      await redisClient.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redisClient.zcard(key);
      return Math.max(0, this.config.maxRequests - currentCount);
    } catch (error) {
      console.error('Error getting remaining requests:', error);
      return this.config.maxRequests;
    }
  }
}

// Pre-configured rate limiters for different use cases

// Email rate limiter: 100 emails per hour per user
export const emailRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  keyPrefix: 'rate_limit:email'
});

// Workflow execution rate limiter: 500 workflow starts per hour per user
export const workflowRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 500,
  keyPrefix: 'rate_limit:workflow'
});

// API rate limiter: 1000 requests per 15 minutes per user
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  keyPrefix: 'rate_limit:api'
});

// SMS rate limiter: 50 SMS per hour per user
export const smsRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50,
  keyPrefix: 'rate_limit:sms'
});

// Global system rate limiter: 10,000 workflow executions per hour system-wide
export const systemWorkflowRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10000,
  keyPrefix: 'rate_limit:system:workflow'
});

// Helper function to check multiple rate limits
export async function checkMultipleRateLimits(
  checks: Array<{ limiter: RateLimiter; identifier: string; name: string }>
): Promise<{ allowed: boolean; failedCheck?: string; results: Record<string, RateLimitResult> }> {
  const results: Record<string, RateLimitResult> = {};
  
  for (const check of checks) {
    const result = await check.limiter.check(check.identifier);
    results[check.name] = result;
    
    if (!result.allowed) {
      return {
        allowed: false,
        failedCheck: check.name,
        results
      };
    }
  }
  
  return { allowed: true, results };
} 