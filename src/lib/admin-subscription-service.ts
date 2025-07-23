import prisma from "@/lib/db/prisma";
import { SubscriptionStatus, TransactionStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface SubscriptionAudit {
  id: string;
  organizationName: string;
  userEmail: string;
  tier: string;
  status: string;
  startDate: Date;
  expiresAt: Date | null;
  monthlyRevenue: number;
  totalRevenue: number;
  paymentMethod?: string;
  lastPayment?: Date;
  usageStats: {
    emails: number;
    sms: number;
    whatsapp: number;
    leadPulseVisits: number;
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
}

export interface RevenueAnalytics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  totalActiveSubscriptions: number;
  averageRevenuePerUser: number;
  tierDistribution: Record<string, number>;
  paymentFailures: number;
  upcomingRenewals: number;
}

export class AdminSubscriptionService {
  /**
   * Get comprehensive subscription audit for all organizations
   */
  static async getSubscriptionAudit(): Promise<SubscriptionAudit[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE]
        }
      },
      include: {
        organization: {
          include: {
            users: {
              take: 1,
              orderBy: { createdAt: "asc" }
            }
          }
        },
        plan: true,
        transactions: {
          where: { status: TransactionStatus.SUCCESS },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    const audits: SubscriptionAudit[] = [];

    for (const sub of subscriptions) {
      const org = sub.organization;
      const primaryUser = org.users[0];
      const successfulTransactions = sub.transactions;
      const totalRevenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
      const lastPayment = successfulTransactions[0]?.createdAt;

      // Calculate usage stats
      const usage = org.featureUsage as any || {};
      const usageStats = {
        emails: usage.emailsSentThisMonth || 0,
        sms: usage.smsSentThisMonth || 0,
        whatsapp: usage.whatsappSentThisMonth || 0,
        leadPulseVisits: usage.leadPulseVisitsThisMonth || 0,
      };

      // Risk assessment
      const flags: string[] = [];
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

      // Check for risk factors
      if (sub.status === SubscriptionStatus.PAST_DUE) {
        flags.push("PAST_DUE");
        riskLevel = "HIGH";
      }

      if (lastPayment && new Date().getTime() - lastPayment.getTime() > 35 * 24 * 60 * 60 * 1000) {
        flags.push("LATE_PAYMENT");
        riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
      }

      if (successfulTransactions.length === 1) {
        flags.push("NEW_CUSTOMER");
      }

      if (totalRevenue === 0) {
        flags.push("NO_PAYMENT");
        riskLevel = "HIGH";
      }

      // Check for unusual usage patterns
      const tierLimits = this.getTierLimits(org.subscriptionTier as string);
      if (usageStats.emails > tierLimits.emails * 0.9) {
        flags.push("HIGH_EMAIL_USAGE");
      }

      audits.push({
        id: sub.id,
        organizationName: org.name,
        userEmail: primaryUser?.email || "No user",
        tier: org.subscriptionTier || "FREE",
        status: sub.status,
        startDate: sub.startDate,
        expiresAt: org.subscriptionExpiresAt,
        monthlyRevenue: sub.plan.interval === "monthly" ? sub.plan.price : sub.plan.price / 12,
        totalRevenue,
        lastPayment,
        usageStats,
        riskLevel,
        flags,
      });
    }

    return audits.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Get revenue analytics and KPIs
   */
  static async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]
        }
      },
      include: {
        plan: true,
        organization: true
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce((total, sub) => {
      const monthlyValue = sub.plan.interval === "monthly" 
        ? sub.plan.price 
        : sub.plan.price / 12;
      return total + monthlyValue;
    }, 0);

    const arr = mrr * 12;

    // New subscriptions this month
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      }
    });

    // Canceled subscriptions this month
    const canceledSubscriptions = await prisma.subscription.count({
      where: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      }
    });

    // Churn rate calculation
    const totalLastMonth = await prisma.subscription.count({
      where: {
        createdAt: {
          lt: currentMonthStart
        },
        status: {
          not: SubscriptionStatus.CANCELED
        }
      }
    });

    const churnRate = totalLastMonth > 0 ? (canceledSubscriptions / totalLastMonth) * 100 : 0;

    // Tier distribution
    const tierDistribution: Record<string, number> = {};
    activeSubscriptions.forEach(sub => {
      const tier = sub.organization.subscriptionTier || "FREE";
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    // Payment failures this month
    const paymentFailures = await prisma.transaction.count({
      where: {
        status: TransactionStatus.FAILED,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      }
    });

    // Upcoming renewals (next 7 days)
    const upcomingRenewals = await prisma.organization.count({
      where: {
        subscriptionExpiresAt: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const averageRevenuePerUser = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;

    return {
      mrr,
      arr,
      churnRate,
      newSubscriptions,
      canceledSubscriptions,
      totalActiveSubscriptions: activeSubscriptions.length,
      averageRevenuePerUser,
      tierDistribution,
      paymentFailures,
      upcomingRenewals,
    };
  }

  /**
   * Verify subscription integrity and detect anomalies
   */
  static async verifySubscriptionIntegrity() {
    const issues: Array<{
      type: string;
      description: string;
      organizationId: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      action: string;
    }> = [];

    // Check for subscriptions without payments
    const subscriptionsWithoutPayments = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        transactions: {
          none: {
            status: TransactionStatus.SUCCESS
          }
        }
      },
      include: {
        organization: true
      }
    });

    subscriptionsWithoutPayments.forEach(sub => {
      issues.push({
        type: "NO_PAYMENT",
        description: `Active subscription without successful payment`,
        organizationId: sub.organizationId,
        severity: "HIGH",
        action: "Verify payment or suspend account"
      });
    });

    // Check for expired subscriptions still marked as active
    const expiredActiveSubscriptions = await prisma.organization.findMany({
      where: {
        subscriptionExpiresAt: {
          lt: new Date()
        },
        subscriptionTier: {
          not: "FREE"
        }
      }
    });

    expiredActiveSubscriptions.forEach(org => {
      issues.push({
        type: "EXPIRED_ACTIVE",
        description: `Subscription expired but still marked as paid tier`,
        organizationId: org.id,
        severity: "MEDIUM",
        action: "Downgrade to FREE tier"
      });
    });

    // Check for usage exceeding tier limits
    const organizations = await prisma.organization.findMany({
      where: {
        subscriptionTier: {
          not: "FREE"
        }
      }
    });

    organizations.forEach(org => {
      const usage = org.featureUsage as any || {};
      const limits = this.getTierLimits(org.subscriptionTier as string);
      
      if (usage.emailsSentThisMonth > limits.emails && limits.emails !== -1) {
        issues.push({
          type: "USAGE_EXCEEDED",
          description: `Email usage (${usage.emailsSentThisMonth}) exceeds tier limit (${limits.emails})`,
          organizationId: org.id,
          severity: "MEDIUM",
          action: "Monitor for abuse or upgrade needed"
        });
      }
    });

    return issues;
  }

  /**
   * Get subscription history for an organization
   */
  static async getSubscriptionHistory(organizationId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { organizationId },
      include: {
        plan: true,
        transactions: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return subscriptions.map(sub => ({
      id: sub.id,
      planName: sub.plan.name,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      amount: sub.plan.price,
      transactions: sub.transactions.length,
      totalPaid: sub.transactions
        .filter(t => t.status === TransactionStatus.SUCCESS)
        .reduce((sum, t) => sum + t.amount, 0)
    }));
  }

  /**
   * Manually verify/approve a subscription
   */
  static async manuallyVerifySubscription(
    subscriptionId: string,
    adminUserId: string,
    action: "APPROVE" | "SUSPEND" | "DOWNGRADE",
    reason: string
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { organization: true }
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        action: `SUBSCRIPTION_${action}`,
        entity: "SUBSCRIPTION",
        entityId: subscriptionId,
        userId: adminUserId,
        metadata: {
          organizationId: subscription.organizationId,
          reason,
          previousStatus: subscription.status
        }
      }
    });

    // Perform the action
    switch (action) {
      case "APPROVE":
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.ACTIVE }
        });
        break;
        
      case "SUSPEND":
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.CANCELED }
        });
        await prisma.organization.update({
          where: { id: subscription.organizationId },
          data: { subscriptionTier: "FREE" }
        });
        break;
        
      case "DOWNGRADE":
        await prisma.organization.update({
          where: { id: subscription.organizationId },
          data: { subscriptionTier: "FREE" }
        });
        break;
    }

    return { success: true, message: `Subscription ${action.toLowerCase()}d successfully` };
  }

  private static getTierLimits(tier: string) {
    const limits: Record<string, any> = {
      FREE: { emails: 1000, sms: 0, whatsapp: 0 },
      STARTER: { emails: 10000, sms: 500, whatsapp: 0 },
      PROFESSIONAL: { emails: 50000, sms: 2000, whatsapp: 1000 },
      ENTERPRISE: { emails: -1, sms: 10000, whatsapp: 5000 }
    };
    return limits[tier] || limits.FREE;
  }
}