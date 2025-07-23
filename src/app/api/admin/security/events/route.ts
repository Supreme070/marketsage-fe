import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const securityEventSchema = z.object({
  eventType: z.enum([
    'LOGIN_ATTEMPT',
    'FAILED_LOGIN', 
    'SUSPICIOUS_ACTIVITY',
    'PRIVILEGE_ESCALATION',
    'DATA_BREACH_ATTEMPT',
    'MALICIOUS_REQUEST',
    'RATE_LIMIT_EXCEEDED',
    'UNAUTHORIZED_ACCESS',
    'PASSWORD_RESET',
    'ACCOUNT_LOCKED',
    'API_ABUSE',
    'SQL_INJECTION_ATTEMPT'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/admin/security/events
 * Get paginated list of security events
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const severity = url.searchParams.get('severity') || '';
    const eventType = url.searchParams.get('eventType') || '';
    const resolved = url.searchParams.get('resolved');
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Calculate time range
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['7d'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_SECURITY_EVENTS', 'security', {
      page,
      limit,
      filters: { severity, eventType, resolved, timeRange },
    });

    // Build where clause
    const where: any = {
      timestamp: {
        gte: fromDate,
      },
    };

    if (severity) {
      where.severity = severity;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true';
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get security events with pagination
    const [events, totalCount] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          eventType: true,
          severity: true,
          title: true,
          description: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          location: true,
          resolved: true,
          resolvedBy: true,
          resolvedAt: true,
          timestamp: true,
          metadata: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.securityEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get security statistics
    const [severityStats, eventTypeStats, resolutionStats] = await Promise.all([
      // Severity distribution
      prisma.securityEvent.groupBy({
        by: ['severity'],
        _count: {
          severity: true,
        },
        where: {
          timestamp: {
            gte: fromDate,
          },
        },
      }),
      // Event type distribution
      prisma.securityEvent.groupBy({
        by: ['eventType'],
        _count: {
          eventType: true,
        },
        where: {
          timestamp: {
            gte: fromDate,
          },
        },
        orderBy: {
          _count: {
            eventType: 'desc',
          },
        },
        take: 10,
      }),
      // Resolution statistics
      prisma.securityEvent.aggregate({
        _count: {
          _all: true,
        },
        where: {
          resolved: true,
          timestamp: {
            gte: fromDate,
          },
        },
      }),
    ]);

    const severityDistribution = severityStats.reduce((acc, stat) => {
      acc[stat.severity] = stat._count.severity;
      return acc;
    }, {} as Record<string, number>);

    const eventTypeDistribution = eventTypeStats.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventType;
      return acc;
    }, {} as Record<string, number>);

    return Response.json({
      success: true,
      data: {
        events: events.map(event => ({
          ...event,
          riskScore: calculateRiskScore(event),
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats: {
          total: totalCount,
          resolved: resolutionStats._count._all,
          unresolved: totalCount - resolutionStats._count._all,
          severity: severityDistribution,
          eventTypes: eventTypeDistribution,
          resolutionRate: totalCount > 0 ? Math.round((resolutionStats._count._all / totalCount) * 100) : 0,
        },
      },
    });

  } catch (error) {
    console.error('Admin security events error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch security events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * POST /api/admin/security/events
 * Create a new security event
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = securityEventSchema.parse(body);

    // Create security event
    const event = await prisma.securityEvent.create({
      data: {
        ...validatedData,
        timestamp: new Date(),
      },
      select: {
        id: true,
        eventType: true,
        severity: true,
        title: true,
        timestamp: true,
      },
    });

    // Log the admin action
    await logAdminAction(user, 'CREATE_SECURITY_EVENT', 'security', {
      eventId: event.id,
      eventType: event.eventType,
      severity: event.severity,
    });

    return Response.json({
      success: true,
      message: 'Security event created successfully',
      data: event,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid event data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Admin security event creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create security event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * Calculate risk score based on event attributes
 */
function calculateRiskScore(event: any): number {
  let score = 0;

  // Severity scoring
  const severityScores = {
    LOW: 1,
    MEDIUM: 3,
    HIGH: 7,
    CRITICAL: 10,
  };
  score += severityScores[event.severity as keyof typeof severityScores] || 1;

  // Event type scoring
  const riskEventTypes = [
    'DATA_BREACH_ATTEMPT',
    'PRIVILEGE_ESCALATION', 
    'SQL_INJECTION_ATTEMPT',
    'MALICIOUS_REQUEST',
  ];
  if (riskEventTypes.includes(event.eventType)) {
    score += 5;
  }

  // Unresolved events are riskier
  if (!event.resolved) {
    score += 2;
  }

  // Recent events are more concerning
  const hoursAgo = (Date.now() - new Date(event.timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) {
    score += 3;
  } else if (hoursAgo < 24) {
    score += 1;
  }

  return Math.min(score, 10); // Cap at 10
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}