/**
 * Admin Security Middleware
 * =========================
 * 
 * Additional security layer for admin API routes:
 * - Rate limiting for admin operations
 * - IP whitelisting for admin access
 * - Enhanced logging for admin actions
 * - Suspicious activity detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/utils';
import { logSQLInjectionAttempt, logXSSAttempt, logRateLimitExceeded, logSuspiciousActivity } from '@/lib/security';

interface AdminRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipIPs?: string[];
}

interface AdminSecurityOptions {
  rateLimiting?: AdminRateLimitConfig;
  ipWhitelist?: string[];
  enableSQLInjectionDetection?: boolean;
  enableXSSDetection?: boolean;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Admin API Security Middleware
 */
export async function adminSecurityMiddleware(
  request: NextRequest,
  options: AdminSecurityOptions = {}
): Promise<NextResponse | null> {
  const clientIP = getClientIP(request) || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.url;
  const method = request.method;

  try {
    // 1. Rate Limiting Check
    if (options.rateLimiting) {
      const rateLimitResult = await checkRateLimit(clientIP, options.rateLimiting, request);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    // 2. IP Whitelist Check (if configured)
    if (options.ipWhitelist && options.ipWhitelist.length > 0) {
      if (!options.ipWhitelist.includes(clientIP)) {
        await logSuspiciousActivity(
          'Admin IP Whitelist Violation',
          `Access attempt from non-whitelisted IP: ${clientIP}`,
          'HIGH',
          clientIP,
          undefined,
          { url, userAgent }
        );

        return new NextResponse(
          JSON.stringify({ error: 'Access denied from this IP address' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 3. SQL Injection Detection
    if (options.enableSQLInjectionDetection !== false) {
      const sqlInjectionResult = await detectSQLInjection(request, clientIP, userAgent);
      if (sqlInjectionResult) {
        return sqlInjectionResult;
      }
    }

    // 4. XSS Detection
    if (options.enableXSSDetection !== false) {
      const xssResult = await detectXSS(request, clientIP, userAgent);
      if (xssResult) {
        return xssResult;
      }
    }

    // 5. Suspicious Pattern Detection
    const suspiciousResult = await detectSuspiciousPatterns(request, clientIP, userAgent);
    if (suspiciousResult) {
      return suspiciousResult;
    }

    // If all checks pass, continue to the actual handler
    return null;

  } catch (error) {
    console.error('Admin security middleware error:', error);
    // Don't block on middleware errors, but log them
    return null;
  }
}

/**
 * Check rate limiting for admin API calls
 */
async function checkRateLimit(
  clientIP: string,
  config: AdminRateLimitConfig,
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip rate limiting for whitelisted IPs
  if (config.skipIPs?.includes(clientIP)) {
    return null;
  }

  const key = `admin_rate_${clientIP}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // First request or window expired - reset
    rateLimitData = {
      count: 1,
      resetTime: now + config.windowMs
    };
  } else {
    // Increment counter
    rateLimitData.count += 1;
  }

  rateLimitStore.set(key, rateLimitData);

  // Check if limit exceeded
  if (rateLimitData.count > config.maxRequests) {
    // Log rate limit exceeded
    await logRateLimitExceeded(
      clientIP,
      request.nextUrl.pathname,
      request.headers.get('user-agent') || '',
      {
        method: request.method,
        count: rateLimitData.count,
        limit: config.maxRequests,
        windowMs: config.windowMs
      }
    );

    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many admin requests. Limit: ${config.maxRequests} per ${Math.round(config.windowMs / 1000)}s`,
        retryAfter: Math.round((rateLimitData.resetTime - now) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, config.maxRequests - rateLimitData.count).toString(),
          'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
          'Retry-After': Math.round((rateLimitData.resetTime - now) / 1000).toString()
        }
      }
    );
  }

  return null;
}

/**
 * Detect SQL injection attempts
 */
async function detectSQLInjection(
  request: NextRequest,
  clientIP: string,
  userAgent: string
): Promise<NextResponse | null> {
  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)|(\-\-)|(\#)|(\bOR\b.*=.*\bOR\b)|(\bUNION\b.*\bSELECT\b)/i,
    /'[^']*'(\s*(;|--|#|\/\*)|\s+(OR|AND)\s+)/i,
    /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b/i,
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))\s*union/i
  ];

  const url = request.nextUrl;
  const searchParams = url.searchParams.toString();
  
  // Check URL parameters
  for (const pattern of sqlPatterns) {
    if (pattern.test(url.pathname) || pattern.test(searchParams)) {
      await logSQLInjectionAttempt(
        clientIP,
        `${url.pathname}?${searchParams}`,
        userAgent,
        {
          method: request.method,
          detectedPattern: 'URL parameter injection'
        }
      );

      return new NextResponse(
        JSON.stringify({ error: 'Malicious request detected' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Check POST body for JSON requests
  if (request.method === 'POST' || request.method === 'PUT') {
    try {
      const body = await request.clone().text();
      for (const pattern of sqlPatterns) {
        if (pattern.test(body)) {
          await logSQLInjectionAttempt(
            clientIP,
            body.substring(0, 200), // Log first 200 chars
            userAgent,
            {
              method: request.method,
              detectedPattern: 'Request body injection'
            }
          );

          return new NextResponse(
            JSON.stringify({ error: 'Malicious request detected' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    } catch (error) {
      // If body parsing fails, continue
    }
  }

  return null;
}

/**
 * Detect XSS attempts
 */
async function detectXSS(
  request: NextRequest,
  clientIP: string,
  userAgent: string
): Promise<NextResponse | null> {
  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /<iframe[^>]*>.*?<\/iframe>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]*onerror[^>]*>/i,
    /<svg[^>]*onload[^>]*>/i,
    /eval\s*\(/i,
    /alert\s*\(/i
  ];

  const url = request.nextUrl;
  const searchParams = url.searchParams.toString();

  // Check URL parameters
  for (const pattern of xssPatterns) {
    if (pattern.test(searchParams)) {
      await logXSSAttempt(
        clientIP,
        searchParams.substring(0, 200),
        userAgent,
        {
          method: request.method,
          detectedPattern: 'URL parameter XSS'
        }
      );

      return new NextResponse(
        JSON.stringify({ error: 'Malicious request detected' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return null;
}

/**
 * Detect suspicious patterns
 */
async function detectSuspiciousPatterns(
  request: NextRequest,
  clientIP: string,
  userAgent: string
): Promise<NextResponse | null> {
  const url = request.nextUrl;
  
  // Suspicious patterns
  const suspiciousPatterns = [
    // Path traversal
    /\.\./,
    // Null bytes
    /\x00/,
    // Suspicious user agents
    /^(wget|curl|python|perl|php|ruby|java)/i,
    // Admin brute force patterns
    /admin.*login/i
  ];

  const fullUrl = url.toString();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(userAgent)) {
      await logSuspiciousActivity(
        'Suspicious Admin Access Pattern',
        `Suspicious pattern detected in admin request: ${fullUrl}`,
        'MEDIUM',
        clientIP,
        undefined,
        {
          userAgent,
          method: request.method,
          detectedPattern: 'Suspicious access pattern'
        }
      );
      
      // Log but don't block - this could be legitimate
      break;
    }
  }

  return null;
}

/**
 * Default admin security configuration
 */
export const defaultAdminSecurityConfig: AdminSecurityOptions = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes per IP
    skipIPs: ['127.0.0.1', '::1'] // Skip localhost
  },
  enableSQLInjectionDetection: true,
  enableXSSDetection: true
};

/**
 * Strict admin security configuration for production
 */
export const strictAdminSecurityConfig: AdminSecurityOptions = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // More restrictive: 50 requests per 15 minutes
    skipIPs: [] // No skipped IPs in production
  },
  enableSQLInjectionDetection: true,
  enableXSSDetection: true
};