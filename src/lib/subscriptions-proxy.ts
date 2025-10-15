/**
 * Subscriptions Proxy - ALL subscription operations through backend API
 *
 * This file provides a secure client-side interface to the subscription service.
 * ALL business logic, feature checks, and usage tracking are handled by the backend.
 *
 * Backend Implementation: /Users/supreme/Desktop/marketsage-backend/src/subscriptions/subscriptions.service.ts
 * Migration Date: October 11, 2025
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export interface TierFeatures {
  maxContacts: number;
  maxLists: number;
  emailsPerMonth: number;
  emailTemplates: number;
  customEmailDomain: boolean;
  smsCreditsPerMonth: number;
  whatsappEnabled: boolean;
  whatsappCreditsPerMonth: number;
  leadPulseEnabled: boolean;
  leadPulseVisitorsPerMonth: number;
  heatmapsEnabled: boolean;
  formBuilderEnabled: boolean;
  aiChatEnabled: boolean;
  aiContentGeneration: boolean;
  predictiveAnalytics: boolean;
  smartSegmentation: boolean;
  teamMembers: number;
  apiAccess: boolean;
  customIntegrations: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
}

export interface UsageInfo {
  used: number;
  limit: number;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  features: TierFeatures;
  expiresAt: Date | null;
  gracePeriodEndsAt: Date | null;
  usage: {
    emails: UsageInfo;
    sms: UsageInfo;
    whatsapp: UsageInfo;
    leadPulseVisits: UsageInfo;
  };
  activeSubscription: any;
}

/**
 * Activate a subscription for an organization
 */
export const activateSubscription = async (
  organizationId: string,
  planId: string,
  interval: 'monthly' | 'annually',
  token: string,
) => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId, planId, interval }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to activate subscription');
  }

  return await response.json();
};

/**
 * Get subscription status for an organization
 */
export const getSubscriptionStatus = async (
  organizationId: string,
  token: string,
): Promise<SubscriptionStatus> => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/status/${organizationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get subscription status');
  }

  return await response.json();
};

/**
 * Check if organization has access to a specific feature
 */
export const checkFeatureAccess = async (
  organizationId: string,
  feature: keyof TierFeatures,
  token: string,
): Promise<boolean> => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/check-feature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId, feature }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.hasAccess;
};

/**
 * Check usage limit for a metered feature
 */
export const checkUsageLimit = async (
  organizationId: string,
  usageType: 'emails' | 'sms' | 'whatsapp' | 'leadPulseVisits',
  incrementBy: number = 0,
  token: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/check-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId, usageType, incrementBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check usage limit');
  }

  return await response.json();
};

/**
 * Increment usage for a specific feature
 */
export const incrementUsage = async (
  organizationId: string,
  usageType: 'emails' | 'sms' | 'whatsapp' | 'leadPulseVisits',
  amount: number,
  token: string,
) => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/increment-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId, usageType, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to increment usage');
  }

  return await response.json();
};

/**
 * Get all subscription tier configurations
 */
export const getAllTiers = async (token: string): Promise<Record<SubscriptionTier, TierFeatures>> => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/tiers`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get tiers');
  }

  return await response.json();
};

/**
 * Get features for a specific tier
 */
export const getTierFeatures = async (
  tier: SubscriptionTier,
  token: string,
): Promise<TierFeatures> => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/features/${tier}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get tier features');
  }

  return await response.json();
};

/**
 * Reset monthly usage for an organization
 */
export const resetMonthlyUsage = async (
  organizationId: string,
  token: string,
) => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/reset-usage/${organizationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset monthly usage');
  }

  return await response.json();
};

/**
 * Enforce grace period for an organization
 */
export const enforceGracePeriod = async (
  organizationId: string,
  token: string,
) => {
  const response = await fetch(`${BACKEND_URL}/subscriptions/enforce-grace-period/${organizationId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to enforce grace period');
  }

  return await response.json();
};
