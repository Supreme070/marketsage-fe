/**
 * Security Middleware
 * ==================
 * Central security middleware for Next.js application
 * Handles security headers, rate limiting, and request validation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.vercel.app", "https://*.anthropic.com"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'connect-src': ["'self'", "https://*.vercel.app", "https://api.openai.com", "https://*.anthropic.com"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'block-all-mixed-content': []
    }
  },
  
  // Security headers
  headers: {
    'X-DNS-Prefetch-Control': 'off',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  
  // Rate limiting by path
  rateLimits: {
    '/api/auth/signin': { requests: 5, window: 15 * 60 * 1000 }, // 5 per 15 minutes
    '/api/auth/signup': { requests: 3, window: 60 * 60 * 1000 }, // 3 per hour
    '/api/ai/': { requests: 50, window: 5 * 60 * 1000 }, // 50 per 5 minutes
    '/api/': { requests: 100, window: 60 * 1000 }, // 100 per minute
    'default': { requests: 200, window: 60 * 1000 } // 200 per minute
  },
  
  // Blocked IPs and user agents
  blockedIPs: [
    // Add known malicious IPs here
  ],
  
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /^$/
  ]
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; violations: number }>();

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  try {
    // 1. Check blocked IPs
    if (SECURITY_CONFIG.blockedIPs.includes(ip)) {
      logger.warn('Blocked IP attempted access', { ip, pathname, userAgent });
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // 2. Check blocked user agents
    const isBlockedUserAgent = SECURITY_CONFIG.blockedUserAgents.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(userAgent);
      }
      return userAgent.includes(pattern);
    });
    
    if (isBlockedUserAgent) {
      logger.warn('Blocked user agent attempted access', { ip, pathname, userAgent });
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // 3. Rate limiting
    const rateLimitResult = checkRateLimit(ip, pathname, userAgent);
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', {
        ip,
        pathname,
        userAgent: userAgent.slice(0, 100),
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      });
      
      return NextResponse.json(
        { 
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': (rateLimitResult.retryAfter || 60).toString()
          }
        }
      );
    }
    
    // 4. Check request size (prevent large payloads)
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      logger.warn('Request payload too large', { ip, pathname, contentLength });
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }
    
    // 5. Validate content type for API routes
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ];
      
      if (!allowedTypes.some(type => contentType.includes(type))) {
        logger.warn('Invalid content type', { ip, pathname, contentType });
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 415 }
        );
      }
    }
    
    // 6. Check for suspicious request patterns
    const suspiciousPatterns = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS attempt
      /union.*select/i,  // SQL injection
      /exec\s*\(/i,  // Code injection
      /javascript:/i,  // JavaScript injection
      /data:.*base64/i  // Data URI
    ];
    
    const fullUrl = request.url;
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
    
    if (isSuspicious) {
      logger.warn('Suspicious request pattern detected', { 
        ip, 
        pathname, 
        url: fullUrl.slice(0, 200),
        userAgent: userAgent.slice(0, 100)
      });
      
      // Increase rate limit violations for suspicious requests
      const key = `${ip}:${pathname}`;
      const entry = rateLimitStore.get(key);
      if (entry) {
        entry.violations += 5; // Heavy penalty
      }
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
    
    // 7. Create response with security headers
    const response = NextResponse.next();
    
    // Add security headers
    Object.entries(SECURITY_CONFIG.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add Content Security Policy
    const cspHeader = Object.entries(SECURITY_CONFIG.csp.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    response.headers.set('Content-Security-Policy', cspHeader);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    
    return response;
    
  } catch (error) {
    logger.error('Security middleware error', {
      error: error instanceof Error ? error.message : String(error),
      pathname,
      ip,
      userAgent: userAgent.slice(0, 100)
    });
    
    // In case of error, still apply basic security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(ip: string, pathname: string, userAgent: string): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  
  // Determine rate limit config for this path
  let config = SECURITY_CONFIG.rateLimits.default;
  for (const [path, pathConfig] of Object.entries(SECURITY_CONFIG.rateLimits)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      config = pathConfig;
      break;
    }
  }
  
  // Create unique key combining IP, path pattern, and user agent hash
  const userAgentHash = Buffer.from(userAgent.slice(0, 100)).toString('base64').slice(0, 10);
  const key = `${ip}:${pathname}:${userAgentHash}`;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + config.window,
      violations: 0
    };
    rateLimitStore.set(key, entry);
  }
  
  // Reset if window has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + config.window;
    // Reduce violations over time
    entry.violations = Math.max(0, entry.violations - 1);
  }
  
  // Apply penalty for previous violations
  const adjustedLimit = Math.max(1, config.requests - entry.violations);
  
  // Check if limit exceeded
  if (entry.count >= adjustedLimit) {
    entry.violations += 1;
    
    return {
      allowed: false,
      limit: config.requests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    allowed: true,
    limit: config.requests,
    remaining: Math.max(0, adjustedLimit - entry.count),
    resetTime: entry.resetTime
  };
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  const forwarded = request.headers.get('forwarded');
  if (forwarded) {
    const match = forwarded.match(/for=([^;,\s]+)/);
    if (match) {
      return match[1].replace(/"/g, '');
    }
  }
  
  return 'unknown';
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimits(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of rateLimitStore) {
    // Remove entries older than 24 hours with no violations
    if (now > entry.resetTime + (24 * 60 * 60 * 1000) && entry.violations === 0) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info('Rate limit cleanup completed', {
      entriesRemoved: cleaned,
      remainingEntries: rateLimitStore.size
    });
  }
}

// Clean up every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

// Security monitoring functions
export const securityMonitor = {
  /**
   * Get security statistics
   */
  getStats(): {
    rateLimitEntries: number;
    topViolators: Array<{ key: string; violations: number; count: number }>;
    memoryUsage: number;
  } {
    const violators: Array<{ key: string; violations: number; count: number }> = [];
    
    for (const [key, entry] of rateLimitStore) {
      if (entry.violations > 0) {
        violators.push({
          key: key.split(':')[0], // Just the IP
          violations: entry.violations,
          count: entry.count
        });
      }
    }
    
    return {
      rateLimitEntries: rateLimitStore.size,
      topViolators: violators.sort((a, b) => b.violations - a.violations).slice(0, 10),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };
  },
  
  /**
   * Block an IP address
   */
  blockIP(ip: string, reason: string): void {
    SECURITY_CONFIG.blockedIPs.push(ip);
    logger.warn('IP blocked', { ip, reason });
  },
  
  /**
   * Clear rate limits for an IP
   */
  clearRateLimit(ip: string): void {
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(`${ip}:`)) {
        rateLimitStore.delete(key);
      }
    }
    logger.info('Rate limits cleared for IP', { ip });
  }
};