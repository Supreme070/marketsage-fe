import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const organizationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.string().optional(),
  logoUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  address: z.string().nullable().optional(),
  billingEmail: z.string().email().nullable().optional(),
  billingName: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  creditBalance: z.number().min(0).optional(),
  autoTopUp: z.boolean().optional(),
  autoTopUpAmount: z.number().min(0).optional(),
  autoTopUpThreshold: z.number().min(0).optional(),
  region: z.string().optional(),
});

/**
 * GET /api/admin/organizations
 * Get paginated list of organizations with search and filters
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const plan = url.searchParams.get('plan') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Log the admin action
    await logAdminAction(user, 'VIEW_ORGANIZATIONS', 'organizations', {
      page,
      limit,
      search,
      filters: { plan, status },
    }, req);

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (plan && plan !== 'all') {
      where.plan = plan;
    }

    // Build sort clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get organizations with pagination
    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          plan: true,
          logoUrl: true,
          websiteUrl: true,
          billingEmail: true,
          creditBalance: true,
          region: true,
          createdAt: true,
          updatedAt: true,
          // User count
          _count: {
            select: {
              users: true,
              contacts: true,
              emailCampaigns: true,
              lists: true,
            },
          },
          // Active subscription info
          subscriptions: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              plan: {
                select: {
                  name: true,
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
          // Recent activity
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
      }),
      prisma.organization.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get organization statistics
    const [planStats, creditStats, activityStats] = await Promise.all([
      // Plan distribution
      prisma.organization.groupBy({
        by: ['plan'],
        _count: {
          plan: true,
        },
      }),
      // Credit statistics
      prisma.organization.aggregate({
        _avg: {
          creditBalance: true,
        },
        _sum: {
          creditBalance: true,
        },
        _count: {
          _all: true,
        },
        where: {
          creditBalance: {
            gt: 0,
          },
        },
      }),
      // Organizations with recent activity (users logged in last 30 days)
      prisma.organization.count({
        where: {
          users: {
            some: {
              lastLogin: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
    ]);

    const planDistribution = planStats.reduce((acc, stat) => {
      acc[stat.plan || 'FREE'] = stat._count.plan;
      return acc;
    }, {} as Record<string, number>);

    return Response.json({
      success: true,
      data: {
        organizations: organizations.map(org => ({
          ...org,
          status: org.subscriptions.length > 0 ? 'active' : 'inactive',
          activeSubscription: org.subscriptions[0] || null,
          lastUserActivity: org.users[0]?.lastLogin || null,
          userCount: org._count.users,
          totalContacts: org._count.contacts,
          totalCampaigns: org._count.emailCampaigns,
          totalLists: org._count.lists,
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
          plans: planDistribution,
          activeSubscriptions: organizations.filter(org => org.subscriptions.length > 0).length,
          totalCreditBalance: creditStats._sum.creditBalance || 0,
          avgCreditBalance: creditStats._avg.creditBalance || 0,
          orgsWithCredits: creditStats._count._all,
          recentlyActive: activityStats,
        },
      },
    });

  } catch (error) {
    console.error('Admin organizations fetch error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch organizations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

/**
 * POST /api/admin/organizations
 * Create a new organization
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    // Check permissions
    if (!permissions.canManageStaff) {
      return Response.json(
        { success: false, error: 'Insufficient permissions to create organizations' },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.name) {
      return Response.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const validatedData = organizationUpdateSchema.parse(body);

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name!,
        plan: validatedData.plan || 'FREE',
        logoUrl: validatedData.logoUrl,
        websiteUrl: validatedData.websiteUrl,
        address: validatedData.address,
        billingEmail: validatedData.billingEmail,
        billingName: validatedData.billingName,
        billingAddress: validatedData.billingAddress,
        vatNumber: validatedData.vatNumber,
        creditBalance: validatedData.creditBalance || 0,
        autoTopUp: validatedData.autoTopUp || false,
        autoTopUpAmount: validatedData.autoTopUpAmount || 100,
        autoTopUpThreshold: validatedData.autoTopUpThreshold || 10,
        region: validatedData.region || 'us',
      },
      select: {
        id: true,
        name: true,
        plan: true,
        creditBalance: true,
        createdAt: true,
      },
    });

    // Log the admin action
    await logAdminAction(user, 'CREATE_ORGANIZATION', 'organizations', {
      organizationId: organization.id,
      organizationName: organization.name,
      plan: organization.plan,
    }, req);

    return Response.json({
      success: true,
      message: 'Organization created successfully',
      data: organization,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Admin organization creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageStaff');

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