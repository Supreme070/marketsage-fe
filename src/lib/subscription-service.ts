import prisma from "@/lib/db/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { addMonths, addYears, isAfter, addDays } from "date-fns";

export enum SubscriptionTier {
  FREE = "FREE",
  STARTER = "STARTER",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE"
}

export interface TierFeatures {
  // Contact Management
  maxContacts: number;
  maxLists: number;
  
  // Email Features
  emailsPerMonth: number;
  emailTemplates: number;
  customEmailDomain: boolean;
  
  // SMS/WhatsApp
  smsCreditsPerMonth: number;
  whatsappEnabled: boolean;
  whatsappCreditsPerMonth: number;
  
  // LeadPulse Analytics
  leadPulseEnabled: boolean;
  leadPulseVisitorsPerMonth: number;
  heatmapsEnabled: boolean;
  formBuilderEnabled: boolean;
  
  // AI Features
  aiChatEnabled: boolean;
  aiContentGeneration: boolean;
  predictiveAnalytics: boolean;
  smartSegmentation: boolean;
  
  // Other Features
  teamMembers: number;
  apiAccess: boolean;
  customIntegrations: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  [SubscriptionTier.FREE]: {
    maxContacts: 500,
    maxLists: 3,
    emailsPerMonth: 1000,
    emailTemplates: 5,
    customEmailDomain: false,
    smsCreditsPerMonth: 0,
    whatsappEnabled: false,
    whatsappCreditsPerMonth: 0,
    leadPulseEnabled: false,
    leadPulseVisitorsPerMonth: 0,
    heatmapsEnabled: false,
    formBuilderEnabled: false,
    aiChatEnabled: false,
    aiContentGeneration: false,
    predictiveAnalytics: false,
    smartSegmentation: false,
    teamMembers: 1,
    apiAccess: false,
    customIntegrations: false,
    whiteLabel: false,
    prioritySupport: false,
  },
  [SubscriptionTier.STARTER]: {
    maxContacts: 2500,
    maxLists: 10,
    emailsPerMonth: 10000,
    emailTemplates: 25,
    customEmailDomain: false,
    smsCreditsPerMonth: 500,
    whatsappEnabled: false,
    whatsappCreditsPerMonth: 0,
    leadPulseEnabled: false,
    leadPulseVisitorsPerMonth: 0,
    heatmapsEnabled: false,
    formBuilderEnabled: false,
    aiChatEnabled: false,
    aiContentGeneration: false,
    predictiveAnalytics: false,
    smartSegmentation: false,
    teamMembers: 2,
    apiAccess: false,
    customIntegrations: false,
    whiteLabel: false,
    prioritySupport: false,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    maxContacts: 10000,
    maxLists: 50,
    emailsPerMonth: 50000,
    emailTemplates: 100,
    customEmailDomain: true,
    smsCreditsPerMonth: 2000,
    whatsappEnabled: true,
    whatsappCreditsPerMonth: 1000,
    leadPulseEnabled: true,
    leadPulseVisitorsPerMonth: 50000,
    heatmapsEnabled: true,
    formBuilderEnabled: true,
    aiChatEnabled: true,
    aiContentGeneration: false,
    predictiveAnalytics: false,
    smartSegmentation: true,
    teamMembers: 10,
    apiAccess: true,
    customIntegrations: false,
    whiteLabel: false,
    prioritySupport: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxContacts: -1, // unlimited
    maxLists: -1,
    emailsPerMonth: -1,
    emailTemplates: -1,
    customEmailDomain: true,
    smsCreditsPerMonth: 10000,
    whatsappEnabled: true,
    whatsappCreditsPerMonth: 5000,
    leadPulseEnabled: true,
    leadPulseVisitorsPerMonth: -1,
    heatmapsEnabled: true,
    formBuilderEnabled: true,
    aiChatEnabled: true,
    aiContentGeneration: true,
    predictiveAnalytics: true,
    smartSegmentation: true,
    teamMembers: -1,
    apiAccess: true,
    customIntegrations: true,
    whiteLabel: true,
    prioritySupport: true,
  },
};

export class SubscriptionService {
  /**
   * Updates organization's subscription tier and expiry after successful payment
   */
  static async activateSubscription(
    organizationId: string,
    planId: string,
    interval: "monthly" | "annually" = "monthly"
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const now = new Date();
    const expiresAt = interval === "annually" 
      ? addYears(now, 1) 
      : addMonths(now, 1);
    
    // 7-day grace period after expiry
    const gracePeriodEndsAt = addDays(expiresAt, 7);

    // Update organization with new subscription details
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionTier: plan.tier as SubscriptionTier,
        subscriptionExpiresAt: expiresAt,
        gracePeriodEndsAt: gracePeriodEndsAt,
        featureUsage: {
          emailsSentThisMonth: 0,
          smsSentThisMonth: 0,
          whatsappSentThisMonth: 0,
          leadPulseVisitsThisMonth: 0,
          lastResetDate: now.toISOString(),
        },
      },
    });

    return {
      tier: plan.tier,
      expiresAt,
      gracePeriodEndsAt,
    };
  }

  /**
   * Check if organization has access to a specific feature
   */
  static async checkFeatureAccess(
    organizationId: string,
    feature: keyof TierFeatures
  ): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        gracePeriodEndsAt: true,
      },
    });

    if (!org) return false;

    // Check if subscription is expired
    const now = new Date();
    if (org.subscriptionExpiresAt && isAfter(now, org.subscriptionExpiresAt)) {
      // Check if in grace period
      if (org.gracePeriodEndsAt && isAfter(now, org.gracePeriodEndsAt)) {
        // Grace period expired, downgrade to FREE
        await prisma.organization.update({
          where: { id: organizationId },
          data: { subscriptionTier: SubscriptionTier.FREE },
        });
        return TIER_FEATURES[SubscriptionTier.FREE][feature] as boolean;
      }
    }

    const tier = (org.subscriptionTier || SubscriptionTier.FREE) as SubscriptionTier;
    const featureValue = TIER_FEATURES[tier][feature];
    
    // For boolean features
    if (typeof featureValue === "boolean") {
      return featureValue;
    }
    
    // For numeric features, -1 means unlimited
    return featureValue !== 0;
  }

  /**
   * Check usage limits for metered features
   */
  static async checkUsageLimit(
    organizationId: string,
    feature: "emails" | "sms" | "whatsapp" | "leadPulseVisits",
    incrementBy: number = 0
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        featureUsage: true,
      },
    });

    if (!org) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const tier = (org.subscriptionTier || SubscriptionTier.FREE) as SubscriptionTier;
    const features = TIER_FEATURES[tier];
    const usage = org.featureUsage as any || {};

    // Reset monthly usage if needed
    const lastReset = usage.lastResetDate ? new Date(usage.lastResetDate) : new Date();
    const now = new Date();
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      usage.emailsSentThisMonth = 0;
      usage.smsSentThisMonth = 0;
      usage.whatsappSentThisMonth = 0;
      usage.leadPulseVisitsThisMonth = 0;
      usage.lastResetDate = now.toISOString();
      
      await prisma.organization.update({
        where: { id: organizationId },
        data: { featureUsage: usage },
      });
    }

    let limit: number;
    let current: number;

    switch (feature) {
      case "emails":
        limit = features.emailsPerMonth;
        current = usage.emailsSentThisMonth || 0;
        break;
      case "sms":
        limit = features.smsCreditsPerMonth;
        current = usage.smsSentThisMonth || 0;
        break;
      case "whatsapp":
        limit = features.whatsappCreditsPerMonth;
        current = usage.whatsappSentThisMonth || 0;
        break;
      case "leadPulseVisits":
        limit = features.leadPulseVisitorsPerMonth;
        current = usage.leadPulseVisitsThisMonth || 0;
        break;
    }

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const remaining = limit - current;
    const allowed = remaining >= incrementBy;

    // If incrementing, update the usage
    if (incrementBy > 0 && allowed) {
      const updateField = `${feature}SentThisMonth`;
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          featureUsage: {
            ...usage,
            [updateField]: current + incrementBy,
          },
        },
      });
    }

    return { allowed, remaining: Math.max(0, remaining - incrementBy), limit };
  }

  /**
   * Get subscription status and details for an organization
   */
  static async getSubscriptionStatus(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: {
            OR: [
              { status: SubscriptionStatus.ACTIVE },
              { status: SubscriptionStatus.TRIALING },
            ],
          },
          include: {
            plan: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!org) return null;

    const tier = (org.subscriptionTier || SubscriptionTier.FREE) as SubscriptionTier;
    const features = TIER_FEATURES[tier];
    const usage = org.featureUsage as any || {};

    return {
      tier,
      features,
      expiresAt: org.subscriptionExpiresAt,
      gracePeriodEndsAt: org.gracePeriodEndsAt,
      usage: {
        emails: {
          used: usage.emailsSentThisMonth || 0,
          limit: features.emailsPerMonth,
        },
        sms: {
          used: usage.smsSentThisMonth || 0,
          limit: features.smsCreditsPerMonth,
        },
        whatsapp: {
          used: usage.whatsappSentThisMonth || 0,
          limit: features.whatsappCreditsPerMonth,
        },
        leadPulseVisits: {
          used: usage.leadPulseVisitsThisMonth || 0,
          limit: features.leadPulseVisitorsPerMonth,
        },
      },
      activeSubscription: org.subscriptions[0],
    };
  }
}