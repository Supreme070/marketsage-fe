/**
 * Subscription API Types
 */

export enum SubscriptionTier {
  FREE = "FREE",
  STARTER = "STARTER",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE"
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  TRIALING = "TRIALING",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED",
  UNPAID = "UNPAID"
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: TierFeatures;
  popular?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInfo {
  id: string;
  organizationId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureUsage {
  emailsSentThisMonth: number;
  smsSentThisMonth: number;
  whatsappSentThisMonth: number;
  leadPulseVisitsThisMonth: number;
  lastResetDate: string;
}

export interface UsageLimit {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  features: TierFeatures;
  expiresAt?: string;
  gracePeriodEndsAt?: string;
  usage: {
    emails: {
      used: number;
      limit: number;
    };
    sms: {
      used: number;
      limit: number;
    };
    whatsapp: {
      used: number;
      limit: number;
    };
    leadPulseVisits: {
      used: number;
      limit: number;
    };
  };
  activeSubscription?: SubscriptionInfo;
}

export interface SubscriptionActivationRequest {
  organizationId: string;
  planId: string;
  interval: "monthly" | "annually";
  paymentMethodId?: string;
}

export interface SubscriptionActivationResponse {
  tier: SubscriptionTier;
  expiresAt: string;
  gracePeriodEndsAt: string;
  subscription: SubscriptionInfo;
}

export interface FeatureAccessRequest {
  organizationId: string;
  feature: keyof TierFeatures;
}

export interface UsageLimitRequest {
  organizationId: string;
  feature: "emails" | "sms" | "whatsapp" | "leadPulseVisits";
  incrementBy?: number;
}

export interface BillingHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  description: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}