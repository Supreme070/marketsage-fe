import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiRateLimiter } from '@/lib/rate-limiter';

export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  ...args: any[]
): Promise<NextResponse> {
  try {
    // Get user session for rate limiting
    const session = await getServerSession(authOptions);
    
    // Use IP address if no session (for public endpoints)
    const identifier = session?.user?.id || getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = await apiRateLimiter.check(identifier);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args);
    
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;

  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, continue with request (fail open)
    return handler(request, ...args);
  }
}

function getClientIP(request: NextRequest): string {
  // Get IP from various headers (considering proxies)
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
  
  // Fallback to a default if no IP found
  return 'unknown';
}

// Helper function for manual rate limit checks
export async function checkApiRateLimit(identifier: string) {
  return await apiRateLimiter.check(identifier);
} 