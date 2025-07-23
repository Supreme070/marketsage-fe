import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/organizations/stats
 * Get comprehensive organization statistics for admin dashboard
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    // Log the admin action
    await logAdminAction(user, 'VIEW_ORGANIZATION_STATS', 'organizations', {
      requestedBy: user.email,
    }, req);

    // Get query parameters for date filtering
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Execute all statistics queries in parallel
    const [
      // Basic organization counts
      totalOrganizations,
      recentOrganizations,
      activeOrganizations,
      
      // Plan distribution
      planDistribution,
      
      // Subscription statistics
      subscriptionStats,
      activeSubscriptions,
      
      // User statistics
      totalUsers,
      activeUsers,
      recentUsers,
      
      // Activity statistics
      organizationsWithRecentActivity,
      
      // Credit and billing statistics
      creditStats,
      billingStats,
      
      // Usage statistics
      messagingUsageStats,
      campaignStats,
      contactStats,
      
      // Growth trends
      monthlyGrowth,
      
      // Geographic distribution
      regionalDistribution,
      
      // Top organizations by metrics
      topOrganizationsByUsers,
      topOrganizationsByRevenue,
      topOrganizationsByActivity,
    ] = await Promise.all([
      // Basic counts
      prisma.organization.count(),
      prisma.organization.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.organization.count({
        where: {
          users: {
            some: {
              lastLogin: {
                gte: startDate,
              },
            },
          },
        },
      }),
      
      // Plan distribution
      prisma.organization.groupBy({
        by: ['plan'],
        _count: {
          plan: true,
        },
        orderBy: {
          _count: {
            plan: 'desc',
          },
        },
      }),
      
      // Subscription statistics
      prisma.subscription.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      
      // User statistics
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: startDate,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Organizations with recent activity
      prisma.organization.count({
        where: {
          OR: [
            {
              users: {
                some: {
                  lastLogin: {
                    gte: startDate,
                  },
                },
              },
            },
            {
              emailCampaigns: {
                some: {
                  createdAt: {
                    gte: startDate,
                  },
                },
              },
            },
          ],
        },
      }),
      
      // Credit statistics
      prisma.organization.aggregate({
        _sum: {
          creditBalance: true,
        },
        _avg: {
          creditBalance: true,
        },
        _count: {
          creditBalance: true,
        },
        where: {
          creditBalance: {
            gt: 0,
          },
        },
      }),
      
      // Billing statistics (organizations with payment methods)
      prisma.organization.count({
        where: {
          paymentMethods: {
            some: {},
          },
        },
      }),
      
      // Messaging usage statistics
      prisma.messagingUsage.aggregate({
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        _sum: {
          messageCount: true,
          credits: true,
        },
        _avg: {
          credits: true,
        },
      }),
      
      // Campaign statistics
      prisma.emailCampaign.aggregate({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          recipientCount: true,
        },
      }),
      
      // Contact statistics
      prisma.contact.aggregate({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      }),
      
      // Monthly growth (last 12 months)
      prisma.organization.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Regional distribution
      prisma.organization.groupBy({
        by: ['region'],
        _count: {
          region: true,
        },
        orderBy: {
          _count: {
            region: 'desc',
          },
        },
      }),
      
      // Top organizations by user count
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          users: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
      
      // Top organizations by revenue (active subscriptions)
      prisma.organization.findMany({
        where: {
          subscriptions: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
          subscriptions: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              plan: {
                select: {
                  price: true,
                  currency: true,
                  interval: true,
                },
              },
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          subscriptions: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
      
      // Top organizations by recent activity
      prisma.organization.findMany({
        where: {
          users: {
            some: {
              lastLogin: {
                gte: startDate,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          plan: true,
          _count: {
            select: {
              users: true,
              emailCampaigns: true,
              contacts: true,
            },
          },
          users: {
            select: {
              lastLogin: true,
            },
            orderBy: {
              lastLogin: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          users: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Get subscription revenue data separately
    const subscriptionRevenue = await prisma.subscription.findMany({
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
    });

    // Calculate monthly revenue projection
    const monthlyRevenueProjection = subscriptionRevenue.reduce((total, sub) => {
      const price = sub.plan.price;
      // Convert all to monthly for projection
      if (sub.plan.interval === 'annually') {
        return total + (price / 12);
      }
      return total + price;
    }, 0);
    
    // Process monthly growth data
    const monthlyGrowthData = monthlyGrowth.reduce((acc, item) => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate growth rate
    const currentMonthOrgs = recentOrganizations;
    const previousMonthStart = new Date(Date.now() - (days + 30) * 24 * 60 * 60 * 1000);
    const previousMonthEnd = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const previousMonthOrgs = await prisma.organization.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: previousMonthEnd,
        },
      },
    });

    const growthRate = previousMonthOrgs > 0 
      ? ((currentMonthOrgs - previousMonthOrgs) / previousMonthOrgs) * 100 
      : 0;

    // Calculate average revenue per organization
    const avgRevenuePerOrg = totalOrganizations > 0 
      ? monthlyRevenueProjection / totalOrganizations 
      : 0;

    // Calculate user engagement rate
    const engagementRate = totalUsers > 0 
      ? (activeUsers / totalUsers) * 100 
      : 0;

    // Convert plan distribution to object
    const planStats = planDistribution.reduce((acc, item) => {
      acc[item.plan || 'FREE'] = item._count.plan;
      return acc;
    }, {} as Record<string, number>);

    // Convert subscription status distribution to object  
    const subscriptionStatusStats = subscriptionStats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Convert regional distribution to object
    const regionStats = regionalDistribution.reduce((acc, item) => {
      acc[item.region || 'unknown'] = item._count.region;
      return acc;
    }, {} as Record<string, number>);

    return Response.json({
      success: true,
      data: {
        overview: {
          totalOrganizations,
          activeOrganizations,
          recentOrganizations,
          growthRate: Math.round(growthRate * 100) / 100,
          totalUsers,
          activeUsers,
          recentUsers,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        
        subscriptions: {
          active: activeSubscriptions,
          statusDistribution: subscriptionStatusStats,
          monthlyRevenueProjection: Math.round(monthlyRevenueProjection * 100) / 100,
          avgRevenuePerOrg: Math.round(avgRevenuePerOrg * 100) / 100,
        },
        
        plans: {
          distribution: planStats,
          totalPlans: Object.keys(planStats).length,
        },
        
        activity: {
          recentlyActive: organizationsWithRecentActivity,
          activityRate: totalOrganizations > 0 
            ? Math.round((organizationsWithRecentActivity / totalOrganizations) * 100 * 100) / 100
            : 0,
          recentCampaigns: campaignStats._count.id || 0,
          totalRecipients: campaignStats._sum.recipientCount || 0,
          newContacts: contactStats._count.id || 0,
        },
        
        billing: {
          totalCreditBalance: Math.round((creditStats._sum.creditBalance || 0) * 100) / 100,
          avgCreditBalance: Math.round((creditStats._avg.creditBalance || 0) * 100) / 100,
          orgsWithCredits: creditStats._count.creditBalance || 0,
          orgsWithPaymentMethods: billingStats,
        },
        
        messaging: {
          totalMessages: messagingUsageStats._sum.messageCount || 0,
          totalCreditsUsed: Math.round((messagingUsageStats._sum.credits || 0) * 100) / 100,
          avgCreditsPerMessage: Math.round((messagingUsageStats._avg.credits || 0) * 1000) / 1000,
        },
        
        geography: {
          regions: regionStats,
          topRegion: regionalDistribution[0]?.region || 'us',
        },
        
        growth: {
          monthlyData: monthlyGrowthData,
          trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
        },
        
        topOrganizations: {
          byUsers: topOrganizationsByUsers.map(org => ({
            ...org,
            userCount: org._count.users,
          })),
          byRevenue: topOrganizationsByRevenue.map(org => ({
            ...org,
            monthlyRevenue: org.subscriptions[0]?.plan?.price || 0,
            currency: org.subscriptions[0]?.plan?.currency || 'NGN',
          })),
          byActivity: topOrganizationsByActivity.map(org => ({
            ...org,
            lastActivity: org.users[0]?.lastLogin,
            userCount: org._count.users,
            campaignCount: org._count.emailCampaigns,
            contactCount: org._count.contacts,
          })),
        },
        
        metadata: {
          generatedAt: new Date().toISOString(),
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
            days,
          },
          adminUser: user.email,
        },
      },
    });

  } catch (error) {
    console.error('Admin organization stats error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch organization statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

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