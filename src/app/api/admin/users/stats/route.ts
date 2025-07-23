import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Request validation schema
const statsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  timezone: z.string().optional().default('UTC'),
});

// Response types
interface UserStatsResponse {
  overview: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    unverified: number;
    newThisMonth: number;
    activeToday: number;
  };
  byRole: {
    SUPER_ADMIN: number;
    ADMIN: number;
    USER: number;
  };
  byOrganization: Array<{
    organizationId: string | null;
    organizationName: string | null;
    count: number;
    active: number;
    suspended: number;
  }>;
  growth: {
    period: string;
    data: Array<{
      date: string;
      newUsers: number;
      totalUsers: number;
      activeUsers: number;
    }>;
  };
  activity: {
    topCountries: Array<{
      country: string;
      count: number;
    }>;
    loginStats: {
      totalLogins: number;
      uniqueUsers: number;
      averageSessionDuration: number;
    };
  };
  engagement: {
    campaignCreators: number;
    contactImporters: number;
    workflowBuilders: number;
    aiUsage: number;
  };
}

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const validatedParams = statsSchema.parse(searchParams);

    const periodDays = getPeriodDays(validatedParams.period);
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Build where clause for organization restrictions
    const orgFilter = session.user.role === 'ADMIN' && session.user.organizationId 
      ? { organizationId: session.user.organizationId }
      : {};

    // Execute all queries in parallel for better performance
    const [
      totalUsers,
      usersByStatus,
      usersByRole,
      usersByOrg,
      newUsersThisMonth,
      activeUsersToday,
      growthData,
      loginStats,
      campaignCreators,
      contactImporters,
      workflowBuilders,
      aiUsage,
    ] = await Promise.all([
      // Total users count
      prisma.user.count({
        where: orgFilter,
      }),

      // Users by status (active/suspended/verified)
      prisma.user.groupBy({
        by: ['isSuspended', 'emailVerified'],
        _count: true,
        where: orgFilter,
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: orgFilter,
      }),

      // Users by organization
      prisma.user.groupBy({
        by: ['organizationId'],
        _count: true,
        where: orgFilter,
      }).then(async (results) => {
        const orgIds = results
          .map(r => r.organizationId)
          .filter((id): id is string => id !== null);
        
        const orgs = orgIds.length > 0 
          ? await prisma.organization.findMany({
              where: { id: { in: orgIds } },
              select: { id: true, name: true },
            })
          : [];

        return results.map(result => {
          const org = orgs.find(o => o.id === result.organizationId);
          return {
            organizationId: result.organizationId,
            organizationName: org?.name || null,
            count: result._count,
          };
        });
      }),

      // New users this month
      prisma.user.count({
        where: {
          ...orgFilter,
          createdAt: { gte: monthStart },
        },
      }),

      // Active users today (users who logged in today)
      prisma.user.count({
        where: {
          ...orgFilter,
          lastActiveAt: { gte: todayStart },
        },
      }),

      // Growth data over the selected period
      Promise.all(
        Array.from({ length: periodDays }, (_, i) => {
          const date = new Date(Date.now() - (periodDays - i - 1) * 24 * 60 * 60 * 1000);
          const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
          
          return Promise.all([
            // New users on this date
            prisma.user.count({
              where: {
                ...orgFilter,
                createdAt: {
                  gte: date,
                  lt: nextDate,
                },
              },
            }),
            // Total users up to this date
            prisma.user.count({
              where: {
                ...orgFilter,
                createdAt: { lte: nextDate },
              },
            }),
            // Active users on this date
            prisma.user.count({
              where: {
                ...orgFilter,
                lastActiveAt: {
                  gte: date,
                  lt: nextDate,
                },
              },
            }),
          ]).then(([newUsers, totalUsers, activeUsers]) => ({
            date: date.toISOString().split('T')[0],
            newUsers,
            totalUsers,
            activeUsers,
          }));
        })
      ),

      // Login statistics
      prisma.adminAuditLog.aggregate({
        where: {
          action: 'LOGIN',
          timestamp: { gte: periodStart },
        },
        _count: { id: true },
      }).then(async (loginCount) => {
        const uniqueLoginUsers = await prisma.adminAuditLog.findMany({
          where: {
            action: 'LOGIN',
            timestamp: { gte: periodStart },
          },
          select: { adminUserId: true },
          distinct: ['adminUserId'],
        });

        return {
          totalLogins: loginCount._count.id,
          uniqueUsers: uniqueLoginUsers.length,
          averageSessionDuration: 0, // Would need session tracking to calculate this
        };
      }),

      // Users who created campaigns
      prisma.user.count({
        where: {
          ...orgFilter,
          campaigns: { some: {} },
        },
      }),

      // Users who imported contacts
      prisma.user.count({
        where: {
          ...orgFilter,
          contacts: { some: {} },
        },
      }),

      // Users who built workflows
      prisma.user.count({
        where: {
          ...orgFilter,
          workflows: { some: {} },
        },
      }),

      // AI usage (users who used AI features)
      prisma.adminAuditLog.findMany({
        where: {
          action: { contains: 'AI' },
          timestamp: { gte: periodStart },
        },
        select: { adminUserId: true },
        distinct: ['adminUserId'],
      }).then(results => results.length),
    ]);

    // Process status statistics
    let activeCount = 0;
    let suspendedCount = 0;
    let verifiedCount = 0;
    let unverifiedCount = 0;

    usersByStatus.forEach(stat => {
      const count = stat._count;
      if (stat.isSuspended) {
        suspendedCount += count;
      } else {
        activeCount += count;
      }
      
      if (stat.emailVerified) {
        verifiedCount += count;
      } else {
        unverifiedCount += count;
      }
    });

    // Process role statistics
    const roleStats = {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      USER: 0,
    };

    usersByRole.forEach(stat => {
      if (stat.role in roleStats) {
        roleStats[stat.role as keyof typeof roleStats] = stat._count;
      }
    });

    // Add active/suspended counts to organization data
    const orgStatsWithDetails = await Promise.all(
      usersByOrg.map(async (org) => {
        const [activeCount, suspendedCount] = await Promise.all([
          prisma.user.count({
            where: {
              organizationId: org.organizationId,
              isSuspended: false,
            },
          }),
          prisma.user.count({
            where: {
              organizationId: org.organizationId,
              isSuspended: true,
            },
          }),
        ]);

        return {
          ...org,
          active: activeCount,
          suspended: suspendedCount,
        };
      })
    );

    const response: UserStatsResponse = {
      overview: {
        total: totalUsers,
        active: activeCount,
        suspended: suspendedCount,
        verified: verifiedCount,
        unverified: unverifiedCount,
        newThisMonth: newUsersThisMonth,
        activeToday: activeUsersToday,
      },
      byRole: roleStats,
      byOrganization: orgStatsWithDetails,
      growth: {
        period: validatedParams.period,
        data: growthData,
      },
      activity: {
        topCountries: [], // Would need to track user countries
        loginStats,
      },
      engagement: {
        campaignCreators,
        contactImporters,
        workflowBuilders,
        aiUsage,
      },
    };

    // Log the admin access
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'VIEW_USER_STATS',
        resource: 'USER',
        details: {
          period: validatedParams.period,
          totalUsers,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}