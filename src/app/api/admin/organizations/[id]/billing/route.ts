import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const billingActionSchema = z.object({
  action: z.enum(['update_plan', 'credit_adjustment', 'refund', 'process_payment', 'cancel_subscription', 'reactivate_subscription']),
  planId: z.string().optional(),
  amount: z.number().min(0).optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  subscriptionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/organizations/[id]/billing
 * Get comprehensive billing information for an organization
 */
export const GET = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;

    // Log the admin action
    await logAdminAction(user, 'VIEW_ORGANIZATION_BILLING', 'billing', {
      organizationId,
      adminUser: user.email,
    }, req);

    // Get organization with billing details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        billingEmail: true,
        billingName: true,
        billingAddress: true,
        vatNumber: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        createdAt: true,
        
        // Subscriptions
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            canceledAt: true,
            paystackSubscriptionId: true,
            paystackCustomerId: true,
            createdAt: true,
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                currency: true,
                interval: true,
                features: true,
                paystackPlanId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        
        // Payment methods
        paymentMethods: {
          select: {
            id: true,
            type: true,
            last4: true,
            brand: true,
            expiryMonth: true,
            expiryYear: true,
            isDefault: true,
            paystackAuthCode: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        
        // Credit transactions
        creditTransactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            paymentMethod: true,
            paymentId: true,
            status: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        
        // Messaging usage
        messagingUsage: {
          select: {
            id: true,
            channel: true,
            messageCount: true,
            credits: true,
            provider: true,
            timestamp: true,
            campaignId: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get transactions related to this organization's subscriptions
    const subscriptionTransactions = await prisma.transaction.findMany({
      where: {
        subscription: {
          organizationId: organizationId,
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paystackReference: true,
        paystackTransactionId: true,
        metadata: true,
        createdAt: true,
        subscription: {
          select: {
            id: true,
            plan: {
              select: {
                name: true,
                interval: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Calculate billing metrics
    const totalSpent = subscriptionTransactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCreditsUsed = organization.messagingUsage
      .reduce((sum, usage) => sum + usage.credits, 0);

    const monthlySpend = subscriptionTransactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return transactionDate >= thirtyDaysAgo && t.status === 'COMPLETED';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const activeSubscription = organization.subscriptions.find(s => s.status === 'ACTIVE');
    const isSubscriptionActive = !!activeSubscription;
    const nextBillingDate = activeSubscription?.endDate;

    // Usage statistics by channel
    const usageByChannel = organization.messagingUsage.reduce((acc, usage) => {
      if (!acc[usage.channel]) {
        acc[usage.channel] = { messages: 0, credits: 0 };
      }
      acc[usage.channel].messages += usage.messageCount;
      acc[usage.channel].credits += usage.credits;
      return acc;
    }, {} as Record<string, { messages: number; credits: number }>);

    // Recent credit transactions summary
    const creditSummary = organization.creditTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'purchase' || transaction.type === 'bonus') {
        acc.credited += transaction.amount;
      } else if (transaction.type === 'deduction') {
        acc.spent += transaction.amount;
      } else if (transaction.type === 'refund') {
        acc.refunded += transaction.amount;
      }
      return acc;
    }, { credited: 0, spent: 0, refunded: 0 });

    return Response.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          billingEmail: organization.billingEmail,
          billingName: organization.billingName,
          billingAddress: organization.billingAddress,
          vatNumber: organization.vatNumber,
          createdAt: organization.createdAt,
        },
        
        billing: {
          creditBalance: Math.round(organization.creditBalance * 100) / 100,
          autoTopUp: organization.autoTopUp,
          autoTopUpAmount: organization.autoTopUpAmount,
          autoTopUpThreshold: organization.autoTopUpThreshold,
          totalSpent: Math.round(totalSpent * 100) / 100,
          monthlySpend: Math.round(monthlySpend * 100) / 100,
          totalCreditsUsed: Math.round(totalCreditsUsed * 100) / 100,
          creditSummary: {
            credited: Math.round(creditSummary.credited * 100) / 100,
            spent: Math.round(creditSummary.spent * 100) / 100,
            refunded: Math.round(creditSummary.refunded * 100) / 100,
          },
        },
        
        subscription: {
          isActive: isSubscriptionActive,
          current: activeSubscription,
          nextBillingDate,
          history: organization.subscriptions,
        },
        
        paymentMethods: organization.paymentMethods,
        
        transactions: {
          subscription: subscriptionTransactions,
          credits: organization.creditTransactions,
        },
        
        usage: {
          byChannel: usageByChannel,
          recent: organization.messagingUsage.slice(0, 10),
          total: {
            messages: organization.messagingUsage.reduce((sum, u) => sum + u.messageCount, 0),
            credits: Math.round(totalCreditsUsed * 100) / 100,
          },
        },
        
        metadata: {
          generatedAt: new Date().toISOString(),
          adminUser: user.email,
        },
      },
    });

  } catch (error) {
    console.error('Admin organization billing fetch error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch organization billing information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canViewUsers');

/**
 * POST /api/admin/organizations/[id]/billing
 * Perform billing actions for an organization
 */
export const POST = createAdminHandler(async (req, { user, permissions }, context) => {
  try {
    const organizationId = context.params.id;

    // Check permissions
    if (!permissions.canManageSubscriptions) {
      return Response.json(
        { success: false, error: 'Insufficient permissions for billing operations' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = billingActionSchema.parse(body);

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        creditBalance: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true, status: true, planId: true },
          take: 1,
        },
      },
    });

    if (!organization) {
      return Response.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    let result: any = {};

    switch (validatedData.action) {
      case 'credit_adjustment':
        if (typeof validatedData.amount !== 'number') {
          return Response.json(
            { success: false, error: 'Amount is required for credit adjustment' },
            { status: 400 }
          );
        }

        // Update credit balance
        const updatedOrg = await prisma.organization.update({
          where: { id: organizationId },
          data: {
            creditBalance: {
              increment: validatedData.amount,
            },
          },
          select: {
            creditBalance: true,
          },
        });

        // Create transaction record
        await prisma.creditTransaction.create({
          data: {
            organizationId: organizationId,
            type: validatedData.amount > 0 ? 'purchase' : 'deduction',
            amount: Math.abs(validatedData.amount),
            description: validatedData.description || `Admin adjustment by ${user.email}`,
            paymentMethod: 'manual',
            status: 'completed',
            metadata: {
              adminId: user.id,
              adminEmail: user.email,
              previousBalance: organization.creditBalance,
              adjustment: validatedData.amount,
              ...validatedData.metadata,
            },
          },
        });

        result = {
          action: 'credit_adjustment',
          previousBalance: organization.creditBalance,
          adjustment: validatedData.amount,
          newBalance: Math.round(updatedOrg.creditBalance * 100) / 100,
        };
        break;

      case 'update_plan':
        if (!validatedData.planId) {
          return Response.json(
            { success: false, error: 'Plan ID is required for plan update' },
            { status: 400 }
          );
        }

        // Verify plan exists
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: validatedData.planId },
          select: { id: true, name: true, price: true },
        });

        if (!plan) {
          return Response.json(
            { success: false, error: 'Subscription plan not found' },
            { status: 404 }
          );
        }

        // Cancel existing subscription if any
        if (organization.subscriptions.length > 0) {
          await prisma.subscription.update({
            where: { id: organization.subscriptions[0].id },
            data: {
              status: 'CANCELED',
              canceledAt: new Date(),
            },
          });
        }

        // Create new subscription
        const newSubscription = await prisma.subscription.create({
          data: {
            organizationId: organizationId,
            planId: validatedData.planId,
            status: 'ACTIVE',
            startDate: new Date(),
          },
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        });

        result = {
          action: 'update_plan',
          newSubscription,
        };
        break;

      case 'cancel_subscription':
        if (!validatedData.subscriptionId && organization.subscriptions.length === 0) {
          return Response.json(
            { success: false, error: 'No active subscription to cancel' },
            { status: 400 }
          );
        }

        const subscriptionToCancel = validatedData.subscriptionId 
          ? validatedData.subscriptionId 
          : organization.subscriptions[0].id;

        await prisma.subscription.update({
          where: { id: subscriptionToCancel },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });

        result = {
          action: 'cancel_subscription',
          subscriptionId: subscriptionToCancel,
          canceledAt: new Date().toISOString(),
          reason: validatedData.reason,
        };
        break;

      case 'reactivate_subscription':
        if (!validatedData.subscriptionId) {
          return Response.json(
            { success: false, error: 'Subscription ID is required for reactivation' },
            { status: 400 }
          );
        }

        await prisma.subscription.update({
          where: { id: validatedData.subscriptionId },
          data: {
            status: 'ACTIVE',
            canceledAt: null,
          },
        });

        result = {
          action: 'reactivate_subscription',
          subscriptionId: validatedData.subscriptionId,
          reactivatedAt: new Date().toISOString(),
        };
        break;

      case 'refund':
        if (typeof validatedData.amount !== 'number' || validatedData.amount <= 0) {
          return Response.json(
            { success: false, error: 'Valid refund amount is required' },
            { status: 400 }
          );
        }

        // Create refund transaction
        await prisma.creditTransaction.create({
          data: {
            organizationId: organizationId,
            type: 'refund',
            amount: validatedData.amount,
            description: validatedData.description || `Refund processed by ${user.email}`,
            paymentMethod: validatedData.paymentMethod || 'manual',
            status: 'completed',
            metadata: {
              adminId: user.id,
              adminEmail: user.email,
              reason: validatedData.reason,
              ...validatedData.metadata,
            },
          },
        });

        // Update credit balance if refund is in credits
        if (validatedData.paymentMethod === 'credits') {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              creditBalance: {
                increment: validatedData.amount,
              },
            },
          });
        }

        result = {
          action: 'refund',
          amount: validatedData.amount,
          method: validatedData.paymentMethod,
          reason: validatedData.reason,
        };
        break;

      default:
        return Response.json(
          { success: false, error: 'Unknown billing action' },
          { status: 400 }
        );
    }

    // Log the admin action
    await logAdminAction(user, 'BILLING_ACTION', 'billing', {
      organizationId,
      organizationName: organization.name,
      action: validatedData.action,
      details: result,
      adminUser: user.email,
    }, req);

    return Response.json({
      success: true,
      message: `Billing action '${validatedData.action}' completed successfully`,
      data: result,
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

    console.error('Admin billing action error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to perform billing action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canManageSubscriptions');

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