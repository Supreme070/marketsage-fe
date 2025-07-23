import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { getIPLocation } from '@/lib/security/security-utils';
import { z } from 'zod';

/**
 * GET /api/admin/security/access-logs
 * Get admin access logs and activity monitoring
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');
    const ipAddress = url.searchParams.get('ipAddress');
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Calculate time range
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['7d'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_ACCESS_LOGS', 'security', {
      page,
      limit,
      filters: { timeRange, userId, action, resource, ipAddress }
    });

    // Build where clause for admin audit logs
    const auditWhere: any = {
      timestamp: {
        gte: fromDate
      }
    };

    if (userId) {
      auditWhere.adminUserId = userId;
    }

    if (action) {
      auditWhere.action = {
        contains: action,
        mode: 'insensitive'
      };
    }

    if (resource) {
      auditWhere.resource = {
        contains: resource,
        mode: 'insensitive'
      };
    }

    if (ipAddress) {
      auditWhere.ipAddress = ipAddress;
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get admin audit logs
    const [auditLogs, auditCount] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where: auditWhere,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          adminUserId: true,
          adminEmail: true,
          action: true,
          resource: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          sessionId: true,
          timestamp: true,
          success: true,
        }
      }),
      prisma.adminAuditLog.count({ where: auditWhere })
    ]);

    // Get admin session data for additional context
    const [adminSessions, sessionCount] = await Promise.all([
      prisma.adminSession.findMany({
        where: {
          loginAt: {
            gte: fromDate
          }
        },
        orderBy: {
          loginAt: 'desc'
        },
        take: 20,
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          location: true,
          loginAt: true,
          lastActivity: true,
          logoutAt: true,
          isActive: true,
        }
      }),
      prisma.adminSession.count({
        where: {
          loginAt: {
            gte: fromDate
          }
        }
      })
    ]);

    // Get user information for sessions
    const sessionUserIds = [...new Set(adminSessions.map(s => s.userId))];
    const sessionUsers = await prisma.user.findMany({
      where: {
        id: {
          in: sessionUserIds
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    // Map users to sessions
    const sessionsWithUsers = adminSessions.map(session => ({
      ...session,
      user: sessionUsers.find(u => u.id === session.userId)
    }));

    // Calculate statistics
    const [actionStats, resourceStats, userStats, hourlyStats] = await Promise.all([
      // Action distribution
      prisma.adminAuditLog.groupBy({
        by: ['action'],
        _count: {
          action: true
        },
        where: {
          timestamp: {
            gte: fromDate
          }
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        },
        take: 10
      }),
      // Resource distribution
      prisma.adminAuditLog.groupBy({
        by: ['resource'],
        _count: {
          resource: true
        },
        where: {
          timestamp: {
            gte: fromDate
          }
        },
        orderBy: {
          _count: {
            resource: 'desc'
          }
        },
        take: 10
      }),
      // Top admin users
      prisma.adminAuditLog.groupBy({
        by: ['adminUserId', 'adminEmail'],
        _count: {
          adminUserId: true
        },
        where: {
          timestamp: {
            gte: fromDate
          }
        },
        orderBy: {
          _count: {
            adminUserId: 'desc'
          }
        },
        take: 10
      }),
      // Hourly activity distribution (last 24 hours)
      getHourlyActivity(fromDate)
    ]);

    // Get failed login attempts
    const failedLogins = await prisma.securityEvent.findMany({
      where: {
        eventType: 'FAILED_LOGIN',
        timestamp: {
          gte: fromDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        location: true,
        timestamp: true,
        metadata: true,
        userId: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Geographic distribution of access
    const locationStats = await getLocationStats(fromDate);

    const totalPages = Math.ceil(auditCount / limit);

    return Response.json({
      success: true,
      data: {
        auditLogs,
        adminSessions: sessionsWithUsers,
        failedLogins,
        pagination: {
          page,
          limit,
          total: auditCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          totalLogs: auditCount,
          totalSessions: sessionCount,
          activeSessions: adminSessions.filter(s => s.isActive).length,
          failedLoginAttempts: failedLogins.length,
          actions: actionStats.reduce((acc, stat) => {
            acc[stat.action] = stat._count.action;
            return acc;
          }, {} as Record<string, number>),
          resources: resourceStats.reduce((acc, stat) => {
            acc[stat.resource] = stat._count.resource;
            return acc;
          }, {} as Record<string, number>),
          topUsers: userStats.map(stat => ({
            userId: stat.adminUserId,
            email: stat.adminEmail,
            actions: stat._count.adminUserId
          })),
          hourlyActivity: hourlyStats,
          locations: locationStats
        },
        timeRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
          label: timeRange
        }
      }
    });

  } catch (error) {
    console.error('Access logs API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch access logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * GET /api/admin/security/access-logs/export
 * Export access logs as CSV
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
    const { timeRange, format = 'json' } = body;

    const timeRanges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['7d'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Get all logs for export (limit to 10,000 for performance)
    const logs = await prisma.adminAuditLog.findMany({
      where: {
        timestamp: {
          gte: fromDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10000,
      select: {
        adminEmail: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        userAgent: true,
        timestamp: true,
        success: true,
        details: true
      }
    });

    // Log the export action
    await logAdminAction(user, 'EXPORT_ACCESS_LOGS', 'security', {
      recordCount: logs.length,
      timeRange,
      format
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        'Timestamp,Admin Email,Action,Resource,Resource ID,IP Address,Success,User Agent',
        ...logs.map(log => [
          log.timestamp.toISOString(),
          log.adminEmail,
          log.action,
          log.resource,
          log.resourceId || '',
          log.ipAddress || '',
          log.success ? 'Yes' : 'No',
          `"${log.userAgent?.replace(/"/g, '""') || ''}"` // Escape quotes in user agent
        ].join(','))
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="access-logs-${timeRange}-${Date.now()}.csv"`
        }
      });
    }

    return Response.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        exportedAt: new Date().toISOString(),
        timeRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Access logs export error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to export access logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * Helper function to get hourly activity distribution
 */
async function getHourlyActivity(fromDate: Date) {
  const hourlyData = [];
  const now = new Date();
  
  // Get last 24 hours of data in hourly buckets
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i, 0, 0, 0);
    
    const nextHour = new Date(hour);
    nextHour.setHours(nextHour.getHours() + 1);

    const count = await prisma.adminAuditLog.count({
      where: {
        timestamp: {
          gte: hour,
          lt: nextHour
        }
      }
    });

    hourlyData.push({
      hour: hour.getHours(),
      count,
      timestamp: hour.toISOString()
    });
  }

  return hourlyData;
}

/**
 * Helper function to get location statistics
 */
async function getLocationStats(fromDate: Date) {
  const sessions = await prisma.adminSession.findMany({
    where: {
      loginAt: {
        gte: fromDate
      },
      location: {
        not: null
      }
    },
    select: {
      location: true
    }
  });

  const locationCounts = sessions.reduce((acc, session) => {
    if (session.location) {
      acc[session.location] = (acc[session.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(locationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce((acc, [location, count]) => {
      acc[location] = count;
      return acc;
    }, {} as Record<string, number>);
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