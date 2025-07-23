import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const subscriptionUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  paystackSubscriptionId: z.string().optional(),
  paystackCustomerId: z.string().optional(),
});

/**
 * GET /api/admin/billing/subscriptions
 * Get paginated list of subscriptions with billing information
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canManageSubscriptions) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || '';
    const planId = url.searchParams.get('planId') || '';
    const search = url.searchParams.get('search') || '';
    const timeRange = url.searchParams.get('timeRange') || '30d';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Calculate time range for filtering
    const timeRanges: Record<string, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['30d'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_BILLING_SUBSCRIPTIONS', 'billing', {
      page,
      limit,
      filters: { status, planId, search, timeRange },
    });

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (planId) {
      where.planId = planId;
    }

    if (search) {
      where.organization = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { billingEmail: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get subscriptions with pagination
    const [subscriptions, totalCount] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          canceledAt: true,
          paystackSubscriptionId: true,
          paystackCustomerId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
              billingName: true,
              plan: true,
              creditBalance: true,
              _count: {
                select: {
                  users: true,
                  contacts: true,
                  emailCampaigns: true,
                },
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              interval: true,
              features: true,
              paystackPlanId: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get subscription statistics
    const [statusStats, planStats, revenueStats] = await Promise.all([
      // Status distribution
      prisma.subscription.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      // Plan distribution
      prisma.subscription.groupBy({
        by: ['planId'],
        _count: {
          planId: true,
        },
        orderBy: {
          _count: {
            planId: 'desc',
          },
        },
      }),
      // Revenue calculations
      prisma.subscription.findMany({
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
      }),
    ]);

    const statusDistribution = statusStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Calculate revenue metrics
    const monthlyRevenue = revenueStats.reduce((sum, sub) => {
      const price = sub.plan.price;
      const multiplier = sub.plan.interval === 'annually' ? 1/12 : 1;
      return sum + (price * multiplier);
    }, 0);

    const annualRevenue = revenueStats.reduce((sum, sub) => {
      const price = sub.plan.price;
      const multiplier = sub.plan.interval === 'annually' ? 1 : 12;
      return sum + (price * multiplier);
    }, 0);

    // Get plan information for stats
    const planInfo = await prisma.subscriptionPlan.findMany({
      where: {
        id: {
          in: planStats.map(p => p.planId),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
      },
    });

    const planDistribution = planStats.map(stat => {
      const plan = planInfo.find(p => p.id === stat.planId);
      return {
        planId: stat.planId,
        planName: plan?.name || 'Unknown',
        count: stat._count.planId,
        revenue: (plan?.price || 0) * stat._count.planId,
      };
    });

    return Response.json({
      success: true,
      data: {
        subscriptions: subscriptions.map(sub => ({
          ...sub,
          monthsActive: calculateMonthsActive(sub.startDate, sub.endDate || new Date()),
          isExpiringSoon: isExpiringSoon(sub.endDate),
          totalRevenue: calculateTotalRevenue(sub),
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
          status: statusDistribution,
          plans: planDistribution,
          revenue: {
            monthly: Math.round(monthlyRevenue * 100) / 100,
            annual: Math.round(annualRevenue * 100) / 100,
            currency: 'NGN', // Default currency
          },
          averageSubscriptionValue: totalCount > 0 ? Math.round((annualRevenue / totalCount) * 100) / 100 : 0,
        },
      },
    });

  } catch (error) {
    console.error('Admin billing subscriptions error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch billing subscriptions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageSubscriptions');

/**
 * PUT /api/admin/billing/subscriptions/[id]
 * Update a subscription (implemented in separate file)
 */

/**
 * Helper functions
 */

function calculateMonthsActive(startDate: Date, endDate: Date): number {
  const months = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.round(months * 100) / 100;
}

function isExpiringSoon(endDate: Date | null): boolean {
  if (!endDate) return false;
  const daysUntilExpiry = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

function calculateTotalRevenue(subscription: any): number {
  if (!subscription.plan) return 0;
  
  const monthsActive = calculateMonthsActive(
    subscription.startDate, 
    subscription.endDate || new Date()
  );
  
  const monthlyPrice = subscription.plan.interval === 'annually' 
    ? subscription.plan.price / 12 
    : subscription.plan.price;
  
  return Math.round(monthlyPrice * monthsActive * 100) / 100;
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