import { Organization, User, Subscription, SubscriptionPlan, PaymentMethod, CreditTransaction, MessagingUsage, SubscriptionStatus, UserRole } from '@prisma/client';

// Organization with relations for admin views
export interface AdminOrganization extends Organization {
  _count: {
    users: number;
    contacts: number;
    emailCampaigns: number;
    lists: number;
    segments: number;
    integrations: number;
    workflows: number;
  };
  subscriptions: AdminSubscription[];
  users: AdminUser[];
  paymentMethods: PaymentMethod[];
  creditTransactions: CreditTransaction[];
  messagingUsage: MessagingUsage[];
}

export interface AdminSubscription extends Subscription {
  plan: SubscriptionPlan;
}

export interface AdminUser extends User {
  _count: {
    activities: number;
    sessions: number;
  };
  activities: UserActivity[];
  sessions: UserSession[];
  accounts: UserAccount[];
  preferences: UserPreference | null;
  metrics?: UserMetrics;
  parsedPreferences?: any;
}

export interface UserActivity {
  id: string;
  type: string;
  channel: string;
  timestamp: Date;
  metadata: any;
}

export interface UserSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
}

export interface UserAccount {
  id: string;
  type: string;
  provider: string;
  providerAccountId: string;
}

export interface UserPreference {
  id: string;
  preferences: string;
  updatedAt: Date;
}

export interface UserMetrics {
  totalActivities: number;
  totalSessions: number;
  avgSessionDuration: number;
  engagementScore: number;
  lastActivity: Date | null;
  daysSinceLogin: number | null;
}

// Organization statistics interfaces
export interface OrganizationStats {
  overview: {
    totalOrganizations: number;
    activeOrganizations: number;
    recentOrganizations: number;
    growthRate: number;
    totalUsers: number;
    activeUsers: number;
    recentUsers: number;
    engagementRate: number;
  };
  
  subscriptions: {
    active: number;
    statusDistribution: Record<SubscriptionStatus, number>;
    monthlyRevenueProjection: number;
    avgRevenuePerOrg: number;
  };
  
  plans: {
    distribution: Record<string, number>;
    totalPlans: number;
  };
  
  activity: {
    recentlyActive: number;
    activityRate: number;
    recentCampaigns: number;
    totalRecipients: number;
    newContacts: number;
  };
  
  billing: {
    totalCreditBalance: number;
    avgCreditBalance: number;
    orgsWithCredits: number;
    orgsWithPaymentMethods: number;
  };
  
  messaging: {
    totalMessages: number;
    totalCreditsUsed: number;
    avgCreditsPerMessage: number;
  };
  
  geography: {
    regions: Record<string, number>;
    topRegion: string;
  };
  
  growth: {
    monthlyData: Record<string, number>;
    trend: 'up' | 'down' | 'stable';
  };
  
  topOrganizations: {
    byUsers: TopOrganization[];
    byRevenue: TopOrganizationByRevenue[];
    byActivity: TopOrganizationByActivity[];
  };
  
  metadata: {
    generatedAt: string;
    dateRange: {
      start: string;
      end: string;
      days: number;
    };
    adminUser: string;
  };
}

export interface TopOrganization {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  userCount: number;
}

export interface TopOrganizationByRevenue extends TopOrganization {
  monthlyRevenue: number;
  currency: string;
}

export interface TopOrganizationByActivity extends TopOrganization {
  lastActivity: Date | null;
  campaignCount: number;
  contactCount: number;
}

// Billing interfaces
export interface OrganizationBillingInfo {
  organization: {
    id: string;
    name: string;
    plan: string;
    billingEmail: string | null;
    billingName: string | null;
    billingAddress: string | null;
    vatNumber: string | null;
    createdAt: Date;
  };
  
  billing: {
    creditBalance: number;
    autoTopUp: boolean;
    autoTopUpAmount: number;
    autoTopUpThreshold: number;
    totalSpent: number;
    monthlySpend: number;
    totalCreditsUsed: number;
    creditSummary: {
      credited: number;
      spent: number;
      refunded: number;
    };
  };
  
  subscription: {
    isActive: boolean;
    current: AdminSubscription | null;
    nextBillingDate: Date | null;
    history: AdminSubscription[];
  };
  
  paymentMethods: PaymentMethod[];
  
  transactions: {
    subscription: SubscriptionTransaction[];
    credits: CreditTransaction[];
  };
  
  usage: {
    byChannel: Record<string, { messages: number; credits: number }>;
    recent: MessagingUsage[];
    total: {
      messages: number;
      credits: number;
    };
  };
  
  metadata: {
    generatedAt: string;
    adminUser: string;
  };
}

export interface SubscriptionTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paystackReference: string;
  paystackTransactionId: string | null;
  metadata: string | null;
  createdAt: Date;
  subscription: {
    id: string;
    plan: {
      name: string;
      interval: string;
    };
  };
}

// Action schemas
export type BillingActionType = 
  | 'update_plan'
  | 'credit_adjustment'
  | 'refund'
  | 'process_payment'
  | 'cancel_subscription'
  | 'reactivate_subscription';

export interface BillingActionRequest {
  action: BillingActionType;
  planId?: string;
  amount?: number;
  description?: string;
  paymentMethod?: string;
  subscriptionId?: string;
  metadata?: Record<string, any>;
  reason?: string;
}

export type UserActionType = 
  | 'update_role'
  | 'suspend'
  | 'activate'
  | 'transfer'
  | 'remove';

export interface UserActionRequest {
  action: UserActionType;
  userId: string;
  role?: UserRole;
  targetOrganizationId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// API Response interfaces
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and sort interfaces
export interface OrganizationFilters {
  search?: string;
  plan?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Organization update schema
export interface OrganizationUpdateRequest {
  name?: string;
  plan?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  billingEmail?: string | null;
  billingName?: string | null;
  billingAddress?: string | null;
  vatNumber?: string | null;
  creditBalance?: number;
  autoTopUp?: boolean;
  autoTopUpAmount?: number;
  autoTopUpThreshold?: number;
  region?: string;
  messagingModel?: string;
  preferredProviders?: string;
}