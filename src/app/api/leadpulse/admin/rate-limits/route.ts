import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { leadPulseRateLimiter, RATE_LIMIT_TYPES, type RateLimitType } from '@/lib/leadpulse/rate-limiter';
import { unauthorized, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET - Get rate limiting statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to view rate limit stats
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get rate limiting statistics
    const statistics = await leadPulseRateLimiter.getStatistics();
    
    // Get configuration information
    const configuration = Object.entries(RATE_LIMIT_TYPES).map(([type, config]) => ({
      type,
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      blockDurationMs: config.blockDurationMs,
      description: getRateLimitDescription(type as RateLimitType),
    }));

    return NextResponse.json({
      statistics,
      configuration,
      summary: {
        totalTypes: configuration.length,
        totalBlocked: statistics.totalBlocked,
        activeBlocks: statistics.activeBlocks,
        systemStatus: statistics.totalBlocked > 100 ? 'under_pressure' : 'normal',
      },
    });
  } catch (error) {
    console.error("Rate limits admin API Error:", error);
    return handleApiError(error, "/api/leadpulse/admin/rate-limits/route.ts");
  }
}

/**
 * POST - Reset rate limits for a specific IP or get rate limit status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to manage rate limits
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ip, type } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing required field: action" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'reset':
        if (!ip || !type) {
          return NextResponse.json(
            { error: "Invalid request", message: "Missing required fields: ip, type" },
            { status: 400 }
          );
        }

        if (!isValidRateLimitType(type)) {
          return NextResponse.json(
            { error: "Invalid rate limit type", message: `Valid types: ${Object.keys(RATE_LIMIT_TYPES).join(', ')}` },
            { status: 400 }
          );
        }

        await leadPulseRateLimiter.resetRateLimit(type as RateLimitType, { ip });
        
        logger.info('Rate limit reset by admin', {
          adminUserId: session.user.id,
          targetIp: ip,
          rateLimitType: type,
        });

        return NextResponse.json({
          message: `Rate limit reset successfully for IP ${ip} and type ${type}`,
          ip,
          type,
        });

      case 'check':
        if (!ip || !type) {
          return NextResponse.json(
            { error: "Invalid request", message: "Missing required fields: ip, type" },
            { status: 400 }
          );
        }

        if (!isValidRateLimitType(type)) {
          return NextResponse.json(
            { error: "Invalid rate limit type", message: `Valid types: ${Object.keys(RATE_LIMIT_TYPES).join(', ')}` },
            { status: 400 }
          );
        }

        const context = { ip };
        const [status, isBlocked] = await Promise.all([
          leadPulseRateLimiter.getRateLimitStatus(type as RateLimitType, context),
          leadPulseRateLimiter.isBlocked(type as RateLimitType, context),
        ]);

        return NextResponse.json({
          ip,
          type,
          isBlocked,
          status: {
            allowed: status.allowed,
            limit: status.limit,
            remaining: status.remaining,
            resetTime: status.resetTime,
          },
        });

      default:
        return NextResponse.json(
          { error: "Invalid action", message: "Supported actions: reset, check" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Rate limits admin action API Error:", error);
    return handleApiError(error, "/api/leadpulse/admin/rate-limits/route.ts");
  }
}

/**
 * Helper function to validate rate limit types
 */
function isValidRateLimitType(type: string): type is RateLimitType {
  return Object.keys(RATE_LIMIT_TYPES).includes(type);
}

/**
 * Get human-readable description for rate limit types
 */
function getRateLimitDescription(type: RateLimitType): string {
  const descriptions: Record<RateLimitType, string> = {
    TRACKING: 'General tracking events (page views, clicks, etc.)',
    FORM_SUBMIT: 'Form submissions and lead captures',
    MOBILE_TRACKING: 'Mobile app tracking events',
    ANALYTICS: 'Analytics API requests and dashboards',
    ADMIN: 'Administrative operations and management',
    BULK_OPERATIONS: 'Bulk data operations and imports',
  };

  return descriptions[type] || 'Unknown rate limit type';
}