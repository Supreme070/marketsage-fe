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
 * GET /api/admin/organizations/[id]
 * Get detailed information about a specific organization
 */
export const GET = createAdminHandler(async (req, { user }, context) => {
  try {
    const organizationId = context.params.id;
    
    // Log the admin action
    await logAdminAction(user, 'VIEW_ORGANIZATION_DETAILS', 'organizations', {
      organizationId,
    }, req);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        logoUrl: true,
        websiteUrl: true,
        address: true,
        billingEmail: true,
        billingName: true,
        billingAddress: true,
        vatNumber: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        region: true,
        messagingModel: true,
        preferredProviders: true,
        createdAt: true,
        updatedAt: true,
        // Relations with counts
        _count: {
          select: {
            users: true,
            contacts: true,
            emailCampaigns: true,
            lists: true,
            segments: true,
            integrations: true,
            workflows: true,
          },
        },
        // Users
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Active subscriptions
        subscriptions: {
          where: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'PAST_DUE' },
            ],
          },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            paystackSubscriptionId: true,
            plan: {
              select: {
                name: true,
                price: true,
                currency: true,
                interval: true,
                features: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Recent campaigns
        emailCampaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            recipientCount: true,
            _count: {
              select: {
                activities: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        // Credit transactions
        creditTransactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        // Messaging usage
        messagingUsage: {
          select: {
            id: true,
            provider: true,
            messageType: true,
            count: true,
            cost: true,
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate organization metrics
    const totalEmailActivities = organization.emailCampaigns.reduce(
      (sum, campaign) => sum + campaign._count.activities, 
      0
    );

    const totalMessagingUsage = organization.messagingUsage.reduce(
      (sum, usage) => sum + usage.count, 
      0
    );

    const totalMessagingCost = organization.messagingUsage.reduce(
      (sum, usage) => sum + usage.cost, 
      0
    );

    return Response.json({
      success: true,
      data: {
        ...organization,
        metrics: {
          totalUsers: organization._count.users,
          activeUsers: organization.users.filter(u => u.isActive).length,
          totalContacts: organization._count.contacts,
          totalCampaigns: organization._count.emailCampaigns,
          totalLists: organization._count.lists,
          totalSegments: organization._count.segments,
          totalIntegrations: organization._count.integrations,
          totalWorkflows: organization._count.workflows,
          totalEmailActivities,
          totalMessagingUsage,
          totalMessagingCost,
        },
        recentActivity: {
          lastUserLogin: Math.max(...organization.users.map(u => 
            u.lastLogin ? new Date(u.lastLogin).getTime() : 0
          )),
          recentCampaigns: organization.emailCampaigns.length,
          recentTransactions: organization.creditTransactions.length,
        },
      },
    });

  } catch (error) {
    console.error('Admin organization details error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch organization details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

/**
 * PUT /api/admin/organizations/[id]
 * Update organization information
 */
export const PUT = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;
    
    // Check permissions
    if (!permissions.canManageSubscriptions) {
      return Response.json(
        { success: false, error: 'Insufficient permissions to update organizations' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = organizationUpdateSchema.parse(body);

    // Get current organization data for audit logging
    const currentOrganization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        creditBalance: true,
        billingEmail: true,
      },
    });

    if (!currentOrganization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        plan: true,
        creditBalance: true,
        billingEmail: true,
        updatedAt: true,
      },
    });

    // If credit balance was updated, create a transaction record
    if (validatedData.creditBalance !== undefined && 
        validatedData.creditBalance !== currentOrganization.creditBalance) {
      const creditDifference = validatedData.creditBalance - currentOrganization.creditBalance;
      
      await prisma.creditTransaction.create({
        data: {
          organizationId: organizationId,
          type: creditDifference > 0 ? 'CREDIT' : 'DEBIT',
          amount: Math.abs(creditDifference),
          description: `Admin adjustment by ${user.email}`,
          metadata: {
            adminId: user.id,
            adminEmail: user.email,
            previousBalance: currentOrganization.creditBalance,
            newBalance: validatedData.creditBalance,
          },
        },
      });
    }

    // Log the admin action
    await logAdminAction(user, 'UPDATE_ORGANIZATION', 'organizations', {
      organizationId,
      organizationName: currentOrganization.name,
      changes: validatedData,
      previousValues: {
        name: currentOrganization.name,
        plan: currentOrganization.plan,
        creditBalance: currentOrganization.creditBalance,
      },
    }, req);

    return Response.json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization,
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

    console.error('Admin organization update error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to update organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageSubscriptions');

/**
 * DELETE /api/admin/organizations/[id]
 * Delete an organization (only if no active subscriptions)
 */
export const DELETE = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;
    
    // Check permissions
    if (!permissions.canManageStaff) {
      return Response.json(
        { success: false, error: 'Insufficient permissions to delete organizations' },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization has active subscriptions
    if (organization.subscriptions.length > 0) {
      return Response.json(
        { 
          success: false, 
          error: 'Cannot delete organization with active subscriptions' 
        },
        { status: 400 }
      );
    }

    // Check if organization has users
    if (organization._count.users > 0) {
      return Response.json(
        { 
          success: false, 
          error: 'Cannot delete organization with existing users' 
        },
        { status: 400 }
      );
    }

    // Delete organization
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    // Log the admin action
    await logAdminAction(user, 'DELETE_ORGANIZATION', 'organizations', {
      organizationId,
      organizationName: organization.name,
    }, req);

    return Response.json({
      success: true,
      message: 'Organization deleted successfully',
    });

  } catch (error) {
    console.error('Admin organization deletion error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to delete organization',
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}