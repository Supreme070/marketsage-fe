/**
 * Subscriptions API Service
 * Handles subscription management, billing, and feature access
 */

import { BaseApiClient } from '../base/api-client';
import type {
  SubscriptionTier,
  SubscriptionStatus,
  TierFeatures,
  SubscriptionPlan,
  SubscriptionInfo,
  FeatureUsage,
  UsageLimit,
  SubscriptionStatus as SubscriptionStatusType,
  SubscriptionActivationRequest,
  SubscriptionActivationResponse,
  FeatureAccessRequest,
  UsageLimitRequest,
  BillingHistory,
  PaymentMethod,
} from '../types/subscriptions';

export class SubscriptionsService extends BaseApiClient {
  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await this.get('/subscriptions/plans');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      return await this.get(`/subscriptions/plans/${planId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Subscription Management
  async activateSubscription(
    request: SubscriptionActivationRequest
  ): Promise<SubscriptionActivationResponse> {
    try {
      return await this.post('/subscriptions/activate', request);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatusType> {
    try {
      return await this.get(`/subscriptions/organizations/${organizationId}/status`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getOrganizationSubscription(organizationId: string): Promise<SubscriptionInfo | null> {
    try {
      return await this.get(`/subscriptions/organizations/${organizationId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      cancelAtPeriodEnd?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<SubscriptionInfo> {
    try {
      return await this.patch(`/subscriptions/${subscriptionId}`, updates);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<SubscriptionInfo> {
    try {
      return await this.patch(`/subscriptions/${subscriptionId}/cancel`, {
        cancelAtPeriodEnd,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    try {
      return await this.patch(`/subscriptions/${subscriptionId}/reactivate`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Feature Access and Usage
  async checkFeatureAccess(
    organizationId: string,
    feature: keyof TierFeatures
  ): Promise<boolean> {
    try {
      const response = await this.post('/subscriptions/features/check-access', {
        organizationId,
        feature,
      });
      return response.hasAccess;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async checkUsageLimit(
    organizationId: string,
    feature: "emails" | "sms" | "whatsapp" | "leadPulseVisits",
    incrementBy = 0
  ): Promise<UsageLimit> {
    try {
      return await this.post('/subscriptions/usage/check-limit', {
        organizationId,
        feature,
        incrementBy,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFeatureUsage(organizationId: string): Promise<FeatureUsage> {
    try {
      return await this.get(`/subscriptions/organizations/${organizationId}/usage`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async incrementUsage(
    organizationId: string,
    feature: "emails" | "sms" | "whatsapp" | "leadPulseVisits",
    amount = 1
  ): Promise<{
    success: boolean;
    newUsage: number;
    remaining: number;
    limit: number;
  }> {
    try {
      return await this.post('/subscriptions/usage/increment', {
        organizationId,
        feature,
        amount,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resetMonthlyUsage(organizationId: string): Promise<FeatureUsage> {
    try {
      return await this.post(`/subscriptions/organizations/${organizationId}/usage/reset`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Tier Features
  async getTierFeatures(tier: SubscriptionTier): Promise<TierFeatures> {
    try {
      return await this.get(`/subscriptions/tiers/${tier}/features`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllTierFeatures(): Promise<Record<SubscriptionTier, TierFeatures>> {
    try {
      return await this.get('/subscriptions/tiers/features');
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Billing and Payment
  async getBillingHistory(
    organizationId: string,
    limit?: number,
    startingAfter?: string
  ): Promise<{
    data: BillingHistory[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (startingAfter) params.append('starting_after', startingAfter);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/subscriptions/organizations/${organizationId}/billing${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUpcomingInvoice(organizationId: string): Promise<{
    amount: number;
    currency: string;
    dueDate: string;
    items: Array<{
      description: string;
      amount: number;
      quantity: number;
    }>;
  }> {
    try {
      return await this.get(`/subscriptions/organizations/${organizationId}/upcoming-invoice`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const response = await this.get(`/subscriptions/invoices/${invoiceId}/download`, {
        headers: {
          'Accept': 'application/pdf',
        },
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Payment Methods
  async getPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    try {
      return await this.get(`/subscriptions/organizations/${organizationId}/payment-methods`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addPaymentMethod(
    organizationId: string,
    paymentMethodData: {
      type: 'card' | 'bank_account';
      token: string;
      setAsDefault?: boolean;
    }
  ): Promise<PaymentMethod> {
    try {
      return await this.post(
        `/subscriptions/organizations/${organizationId}/payment-methods`,
        paymentMethodData
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updatePaymentMethod(
    organizationId: string,
    paymentMethodId: string,
    updates: {
      isDefault?: boolean;
      expiryMonth?: number;
      expiryYear?: number;
    }
  ): Promise<PaymentMethod> {
    try {
      return await this.patch(
        `/subscriptions/organizations/${organizationId}/payment-methods/${paymentMethodId}`,
        updates
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deletePaymentMethod(
    organizationId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.delete(
        `/subscriptions/organizations/${organizationId}/payment-methods/${paymentMethodId}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async setDefaultPaymentMethod(
    organizationId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    try {
      return await this.patch(
        `/subscriptions/organizations/${organizationId}/payment-methods/${paymentMethodId}/set-default`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Trials and Promotions
  async startTrial(
    organizationId: string,
    planId: string,
    trialDays = 14
  ): Promise<SubscriptionInfo> {
    try {
      return await this.post('/subscriptions/trial/start', {
        organizationId,
        planId,
        trialDays,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async extendTrial(
    subscriptionId: string,
    additionalDays: number
  ): Promise<SubscriptionInfo> {
    try {
      return await this.patch(`/subscriptions/${subscriptionId}/trial/extend`, {
        additionalDays,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async applyPromoCode(
    organizationId: string,
    promoCode: string
  ): Promise<{
    success: boolean;
    discount: {
      amount: number;
      percentage?: number;
      duration: string;
    };
    appliedAt: string;
  }> {
    try {
      return await this.post(`/subscriptions/organizations/${organizationId}/promo`, {
        promoCode,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Analytics and Reporting
  async getSubscriptionAnalytics(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    usageTrends: {
      emails: Array<{ date: string; count: number }>;
      sms: Array<{ date: string; count: number }>;
      whatsapp: Array<{ date: string; count: number }>;
      leadPulseVisits: Array<{ date: string; count: number }>;
    };
    featureUtilization: Record<string, number>;
    costSavings: {
      estimatedCostWithoutPlan: number;
      actualCost: number;
      savings: number;
    };
    recommendations: Array<{
      type: 'upgrade' | 'downgrade' | 'feature';
      title: string;
      description: string;
      potentialSavings?: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/subscriptions/organizations/${organizationId}/analytics${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Admin/Platform Methods
  async getAllSubscriptions(
    filters?: {
      status?: SubscriptionStatus;
      tier?: SubscriptionTier;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    subscriptions: SubscriptionInfo[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/subscriptions/admin/all${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSubscriptionMetrics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    churnRate: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    byTier: Record<SubscriptionTier, number>;
  }> {
    try {
      return await this.get('/subscriptions/admin/metrics');
    } catch (error) {
      return this.handleError(error);
    }
  }
}