import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/dashboard/overview
 * Get comprehensive admin dashboard overview with key metrics
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    // Log the admin action
    await logAdminAction(user, 'VIEW_ADMIN_DASHBOARD', 'dashboard');

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users metrics
    const [userStats, newUsersToday, activeUsersWeek] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: last24h,
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: last7d,
          },
        },
      }),
    ]);

    // Organizations metrics
    const [organizationStats, newOrgsToday, activeSubscriptions] = await Promise.all([
      prisma.organization.aggregate({
        _count: {
          _all: true,
        },
        _sum: {
          creditBalance: true,
        },
      }),
      prisma.organization.count({
        where: {
          createdAt: {
            gte: last24h,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      }),
    ]);

    // Security metrics (if user has permission)
    let securityStats = null;
    if (permissions.canAccessSecurity) {
      securityStats = await Promise.all([
        prisma.securityEvent.count({
          where: {
            timestamp: {
              gte: last24h,
            },
          },
        }),
        prisma.securityEvent.count({
          where: {
            resolved: false,
            severity: {
              in: ['HIGH', 'CRITICAL'],
            },
          },
        }),
        prisma.securityEvent.groupBy({
          by: ['severity'],
          _count: {
            severity: true,
          },
          where: {
            timestamp: {
              gte: last7d,
            },
          },
        }),
      ]).then(([todayEvents, criticalUnresolved, severityBreakdown]) => ({
        eventsToday: todayEvents,
        criticalUnresolved,
        severityBreakdown: severityBreakdown.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {} as Record<string, number>),
      }));
    }

    // System metrics (if user has permission)
    let systemStats = null;
    if (permissions.canAccessSystem) {
      const [queueStats, recentMetrics] = await Promise.all([
        prisma.messageQueue.aggregate({
          _count: {
            _all: true,
          },
          _sum: {
            pendingJobs: true,
            failedJobs: true,
          },
          _avg: {
            errorRate: true,
            throughput: true,
          },
        }),
        prisma.systemMetrics.findMany({
          where: {
            timestamp: {
              gte: new Date(now.getTime() - 5 * 60 * 1000), // Last 5 minutes
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 20,
        }),
      ]);

      // Calculate system health
      const cpuMetrics = recentMetrics.filter(m => m.metricType === 'cpu_usage');
      const memoryMetrics = recentMetrics.filter(m => m.metricType === 'memory_usage');
      
      const avgCpu = cpuMetrics.length > 0 ? 
        cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length : 0;
      const avgMemory = memoryMetrics.length > 0 ? 
        memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length : 0;

      systemStats = {
        queues: {
          total: queueStats._count._all,
          pendingJobs: queueStats._sum.pendingJobs || 0,
          failedJobs: queueStats._sum.failedJobs || 0,
          avgErrorRate: Math.round((queueStats._avg.errorRate || 0) * 100) / 100,
          avgThroughput: Math.round((queueStats._avg.throughput || 0) * 100) / 100,
        },
        resources: {
          cpu: Math.round(avgCpu * 100) / 100,
          memory: Math.round(avgMemory * 100) / 100,
          healthStatus: avgCpu > 80 || avgMemory > 85 ? 'warning' : 'healthy',
        },
      };
    }

    // Billing metrics (if user has permission)
    let billingStats = null;
    if (permissions.canManageSubscriptions) {
      const [subscriptionBreakdown, monthlyRevenue] = await Promise.all([
        prisma.subscription.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
        }),
        prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
          },
          select: {
            plan: {
              select: {
                price: true,
                interval: true,
              },
            },
          },
        }),
      ]);

      const totalMonthlyRevenue = monthlyRevenue.reduce((sum, sub) => {
        const price = sub.plan.price;
        const multiplier = sub.plan.interval === 'annually' ? 1/12 : 1;
        return sum + (price * multiplier);
      }, 0);

      billingStats = {
        subscriptions: subscriptionBreakdown.reduce((acc, item) => {
          acc[item.status.toLowerCase()] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        monthlyRevenue: Math.round(totalMonthlyRevenue * 100) / 100,
        annualRevenue: Math.round(totalMonthlyRevenue * 12 * 100) / 100,
      };
    }

    // Activity trends (last 7 days)
    const activityTrends = await Promise.all([
      // Daily user registrations
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "User"
        WHERE created_at >= ${last7d}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `,
      // Daily organization registrations
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "Organization"
        WHERE created_at >= ${last7d}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `,
    ]);

    // Calculate growth rates
    const userGrowthRate = calculateGrowthRate(
      await prisma.user.count({
        where: { createdAt: { gte: last7d } }
      }),
      await prisma.user.count({
        where: { 
          createdAt: { 
            gte: new Date(last7d.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: last7d
          } 
        }
      })
    );

    const orgGrowthRate = calculateGrowthRate(
      await prisma.organization.count({
        where: { createdAt: { gte: last7d } }
      }),
      await prisma.organization.count({
        where: { 
          createdAt: { 
            gte: new Date(last7d.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: last7d
          } 
        }
      })
    );

    return Response.json({
      success: true,
      data: {
        overview: {
          users: {
            total: userStats.reduce((sum, stat) => sum + stat._count.role, 0),
            newToday: newUsersToday,
            activeThisWeek: activeUsersWeek,
            growthRate: userGrowthRate,
            roleDistribution: userStats.reduce((acc, stat) => {
              acc[stat.role] = stat._count.role;
              return acc;
            }, {} as Record<string, number>),
          },
          organizations: {
            total: organizationStats._count._all,
            newToday: newOrgsToday,
            activeSubscriptions,
            totalCredits: Math.round((organizationStats._sum.creditBalance || 0) * 100) / 100,
            growthRate: orgGrowthRate,
          },
          security: securityStats,
          system: systemStats,
          billing: billingStats,
        },
        trends: {
          userRegistrations: activityTrends[0],
          organizationRegistrations: activityTrends[1],
        },
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin dashboard overview error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard overview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers'); // Base permission required

/**
 * Calculate growth rate between two periods
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}