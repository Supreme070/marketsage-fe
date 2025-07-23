import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-api-auth';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return auth.response;
    }

    // Date ranges for calculations
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Parallel data fetching with error handling
    const [
      userStatsResult,
      campaignStatsResult, 
      revenueStatsResult,
      engagementStatsResult,
      leadPulseStatsResult,
      workflowStatsResult
    ] = await Promise.allSettled([
      // User growth analytics
      Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfMonth
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfLastMonth,
              lt: startOfMonth
            }
          }
        }),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]),

      // Campaign analytics
      Promise.all([
        prisma.emailCampaign.count(),
        prisma.sMSCampaign.count(),
        prisma.whatsAppCampaign.count(),
        prisma.emailCampaign.count({
          where: {
            status: 'ACTIVE'
          }
        }),
        prisma.emailActivity.count({
          where: {
            type: 'SENT',
            timestamp: {
              gte: startOfMonth
            }
          }
        }),
        prisma.emailActivity.count({
          where: {
            type: 'DELIVERED',
            timestamp: {
              gte: startOfMonth
            }
          }
        })
      ]),

      // Revenue analytics  
      Promise.all([
        prisma.purchase.aggregate({
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        }),
        prisma.purchase.aggregate({
          where: {
            timestamp: {
              gte: startOfMonth
            }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        }),
        prisma.purchase.aggregate({
          where: {
            timestamp: {
              gte: startOfLastMonth,
              lt: startOfMonth
            }
          },
          _sum: {
            amount: true
          }
        })
      ]),

      // Engagement analytics
      Promise.all([
        prisma.emailActivity.count({
          where: {
            type: 'OPENED',
            timestamp: {
              gte: startOfMonth
            }
          }
        }),
        prisma.emailActivity.count({
          where: {
            type: 'CLICKED', 
            timestamp: {
              gte: startOfMonth
            }
          }
        }),
        prisma.userActivity.count({
          where: {
            timestamp: {
              gte: startOfMonth
            }
          }
        })
      ]),

      // LeadPulse analytics
      Promise.all([
        prisma.leadPulseSession.count({
          where: {
            createdAt: {
              gte: startOfMonth
            }
          }
        }),
        prisma.leadPulseVisitor.count({
          where: {
            firstSeen: {
              gte: startOfMonth
            }
          }
        }),
        prisma.leadPulseEvent.count({
          where: {
            timestamp: {
              gte: startOfMonth
            }
          }
        })
      ]),

      // Workflow analytics
      Promise.all([
        prisma.workflowExecution.count(),
        prisma.workflowExecution.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: startOfMonth
            }
          }
        }),
        prisma.workflowExecution.count({
          where: {
            status: 'FAILED',
            createdAt: {
              gte: startOfMonth
            }
          }
        })
      ])
    ]);

    // Process user stats
    const userStats = userStatsResult.status === 'fulfilled' ? userStatsResult.value : [0, 0, 0, 0, 0];
    const [totalUsers, usersToday, usersThisMonth, usersLastMonth, activeUsers] = userStats;

    // Calculate user growth rate
    const userGrowthRate = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

    // Process campaign stats
    const campaignStats = campaignStatsResult.status === 'fulfilled' ? campaignStatsResult.value : [0, 0, 0, 0, 0, 0];
    const [emailCampaigns, smsCampaigns, whatsappCampaigns, activeCampaigns, messagesSent, messagesDelivered] = campaignStats;
    
    const totalCampaigns = emailCampaigns + smsCampaigns + whatsappCampaigns;
    const deliveryRate = messagesSent > 0 ? (messagesDelivered / messagesSent) * 100 : 0;

    // Process revenue stats
    const revenueStats = revenueStatsResult.status === 'fulfilled' ? revenueStatsResult.value : [
      { _sum: { amount: 0 }, _count: { id: 0 } },
      { _sum: { amount: 0 }, _count: { id: 0 } },
      { _sum: { amount: 0 } }
    ];
    const [totalRevenue, thisMonthRevenue, lastMonthRevenue] = revenueStats;
    
    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const thisMonthAmount = thisMonthRevenue._sum.amount || 0;
    const lastMonthAmount = lastMonthRevenue._sum.amount || 0;
    const revenueGrowthRate = lastMonthAmount > 0 ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

    // Process engagement stats
    const engagementStats = engagementStatsResult.status === 'fulfilled' ? engagementStatsResult.value : [0, 0, 0];
    const [emailOpens, emailClicks, totalEngagements] = engagementStats;

    // Process LeadPulse stats
    const leadPulseStats = leadPulseStatsResult.status === 'fulfilled' ? leadPulseStatsResult.value : [0, 0, 0];
    const [sessions, newVisitors, events] = leadPulseStats;

    // Process workflow stats  
    const workflowStats = workflowStatsResult.status === 'fulfilled' ? workflowStatsResult.value : [0, 0, 0];
    const [totalWorkflows, completedWorkflows, failedWorkflows] = workflowStats;
    
    const workflowSuccessRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;

    // Generate trending data (mock data for demonstration - would need historical analytics)
    const userGrowthTrend = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + (totalUsers * 0.001)
    }));

    const revenueTrend = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 5000) + 1000
    }));

    // Platform performance metrics
    const platformMetrics = {
      uptime: 99.8, // Mock - would need real monitoring data
      responseTime: 245, // Mock average response time in ms
      errorRate: 0.2, // Mock error rate percentage
      apiCalls: totalEngagements + sessions + completedWorkflows,
      cacheHitRate: 94.5 // Mock cache performance
    };

    // Channel performance
    const channelPerformance = [
      {
        channel: 'Email',
        campaigns: emailCampaigns,
        sent: messagesSent,
        delivered: messagesDelivered,
        opened: emailOpens,
        clicked: emailClicks,
        deliveryRate: deliveryRate,
        openRate: messagesSent > 0 ? (emailOpens / messagesSent) * 100 : 0,
        clickRate: emailOpens > 0 ? (emailClicks / emailOpens) * 100 : 0
      },
      {
        channel: 'SMS', 
        campaigns: smsCampaigns,
        sent: Math.floor(messagesSent * 0.3), // Mock SMS portion
        delivered: Math.floor(messagesDelivered * 0.3),
        deliveryRate: 98.5 // SMS typically has higher delivery rates
      },
      {
        channel: 'WhatsApp',
        campaigns: whatsappCampaigns,
        sent: Math.floor(messagesSent * 0.2), // Mock WhatsApp portion
        delivered: Math.floor(messagesDelivered * 0.2),
        deliveryRate: 97.8
      }
    ];

    // Top performing campaigns (mock data - would need real performance metrics)
    const topCampaigns = [
      {
        id: '1',
        name: 'Welcome Series',
        type: 'EMAIL',
        sent: Math.floor(messagesSent * 0.2),
        deliveryRate: 98.5,
        openRate: 45.2,
        clickRate: 12.8,
        revenue: thisMonthAmount * 0.3
      },
      {
        id: '2', 
        name: 'Product Launch',
        type: 'EMAIL',
        sent: Math.floor(messagesSent * 0.15),
        deliveryRate: 97.8,
        openRate: 52.1,
        clickRate: 18.4,
        revenue: thisMonthAmount * 0.25
      },
      {
        id: '3',
        name: 'Payment Reminder',
        type: 'SMS',
        sent: Math.floor(messagesSent * 0.1),
        deliveryRate: 99.2,
        responseRate: 23.6,
        revenue: thisMonthAmount * 0.15
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        // Overview metrics
        overview: {
          totalUsers,
          usersToday,
          usersThisMonth,
          userGrowthRate: Number(userGrowthRate.toFixed(1)),
          activeUsers,
          totalRevenue: totalRevenueAmount,
          revenueThisMonth: thisMonthAmount,
          revenueGrowthRate: Number(revenueGrowthRate.toFixed(1)),
          totalCampaigns,
          activeCampaigns,
          messagesSent,
          deliveryRate: Number(deliveryRate.toFixed(1))
        },

        // User analytics
        userAnalytics: {
          totalUsers,
          newUsersToday: usersToday,
          newUsersThisMonth: usersThisMonth,
          activeUsers,
          growthRate: userGrowthRate,
          growthTrend: userGrowthTrend
        },

        // Revenue analytics
        revenueAnalytics: {
          totalRevenue: totalRevenueAmount,
          monthlyRevenue: thisMonthAmount,
          growthRate: revenueGrowthRate,
          totalTransactions: totalRevenue._count.id,
          monthlyTransactions: thisMonthRevenue._count.id,
          averageOrderValue: thisMonthRevenue._count.id > 0 ? thisMonthAmount / thisMonthRevenue._count.id : 0,
          revenueTrend
        },

        // Campaign analytics
        campaignAnalytics: {
          totalCampaigns,
          activeCampaigns,
          channelPerformance,
          topCampaigns,
          deliveryMetrics: {
            sent: messagesSent,
            delivered: messagesDelivered,
            opened: emailOpens,
            clicked: emailClicks,
            deliveryRate: Number(deliveryRate.toFixed(1)),
            openRate: messagesSent > 0 ? Number(((emailOpens / messagesSent) * 100).toFixed(1)) : 0,
            clickRate: emailOpens > 0 ? Number(((emailClicks / emailOpens) * 100).toFixed(1)) : 0
          }
        },

        // LeadPulse analytics
        leadPulseAnalytics: {
          totalSessions: sessions,
          newVisitors,
          totalEvents: events,
          averageSessionDuration: '4m 32s', // Mock - would need session duration calculation
          bounceRate: 34.5, // Mock
          conversionRate: 2.8 // Mock
        },

        // Workflow analytics
        workflowAnalytics: {
          totalExecutions: totalWorkflows,
          completedExecutions: completedWorkflows,
          failedExecutions: failedWorkflows,
          successRate: Number(workflowSuccessRate.toFixed(1)),
          averageExecutionTime: '2.1s' // Mock
        },

        // Platform metrics
        platformMetrics,

        // Generated at timestamp
        generatedAt: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  }
}