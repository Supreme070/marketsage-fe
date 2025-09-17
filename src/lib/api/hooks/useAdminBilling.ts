/**
 * Admin Billing API Hooks
 * React hooks for admin billing management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface BillingStats {
  monthlyRevenue: number;
  activeSubscriptions: number;
  paymentSuccessRate: number;
  churnRate: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
  paymentFailureRate: number;
  churnImprovement: number;
}

export interface SubscriptionAudit {
  id: string;
  organizationName: string;
  userEmail: string;
  tier: string;
  status: string;
  startDate: string;
  expiresAt: string | null;
  monthlyRevenue: number;
  totalRevenue: number;
  lastPayment?: string;
  usageStats: {
    emails: number;
    sms: number;
    whatsapp: number;
    leadPulseVisits: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
}

export interface RevenueAnalytics {
  mrr: number;
  arr: number;
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  totalActiveSubscriptions: number;
  averageRevenuePerUser: number;
  tierDistribution: Record<string, number>;
  paymentFailures: number;
  upcomingRenewals: number;
}

export interface SubscriptionIssue {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  organizationId: string;
  organizationName: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  invoiceNumber: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string;
  processedAt: string | null;
  failureReason?: string;
}

export interface SubscriptionVerification {
  subscriptionId: string;
  action: string;
  reason: string;
}

// Billing Stats Hook
export function useAdminBillingStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<BillingStats>('/admin/billing/stats');
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

// Subscription Audits Hook
export function useAdminSubscriptionAudits() {
  const apiClient = useApiClient();
  const [audits, setAudits] = useState<SubscriptionAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SubscriptionAudit[]>('/admin/billing/subscriptions/audit');
      setAudits(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  return {
    audits,
    loading,
    error,
    fetchAudits
  };
}

// Revenue Analytics Hook
export function useAdminRevenueAnalytics() {
  const apiClient = useApiClient();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<RevenueAnalytics>('/admin/billing/subscriptions/analytics');
      setAnalytics(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
}

// Subscription Issues Hook
export function useAdminSubscriptionIssues() {
  const apiClient = useApiClient();
  const [issues, setIssues] = useState<SubscriptionIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SubscriptionIssue[]>('/admin/billing/subscriptions/verify');
      setIssues(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const verifySubscription = useCallback(async (verification: SubscriptionVerification) => {
    try {
      await apiClient.post('/admin/billing/subscriptions/verify', verification);
      await fetchIssues(); // Refresh issues
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      throw err;
    }
  }, [apiClient, fetchIssues]);

  return {
    issues,
    loading,
    error,
    fetchIssues,
    verifySubscription
  };
}

// Invoices Hook
export function useAdminInvoices() {
  const apiClient = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (filters: { status?: string; organizationId?: string } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      
      const response = await apiClient.get<Invoice[]>(`/admin/billing/invoices?${params}`);
      setInvoices(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices
  };
}

// Payments Hook
export function useAdminPayments() {
  const apiClient = useApiClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters: { status?: string; organizationId?: string } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      
      const response = await apiClient.get<Payment[]>(`/admin/billing/payments?${params}`);
      setPayments(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments
  };
}

// Combined Admin Billing Dashboard Hook
export function useAdminBillingDashboard() {
  const stats = useAdminBillingStats();
  const audits = useAdminSubscriptionAudits();
  const analytics = useAdminRevenueAnalytics();
  const issues = useAdminSubscriptionIssues();
  const invoices = useAdminInvoices();
  const payments = useAdminPayments();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
    audits.fetchAudits();
    analytics.fetchAnalytics();
    issues.fetchIssues();
    invoices.fetchInvoices();
    payments.fetchPayments();
  }, [stats, audits, analytics, issues, invoices, payments]);

  return {
    // Stats
    stats: stats.stats,
    statsLoading: stats.loading,
    statsError: stats.error,
    
    // Audits
    audits: audits.audits,
    auditsLoading: audits.loading,
    auditsError: audits.error,
    
    // Analytics
    analytics: analytics.analytics,
    analyticsLoading: analytics.loading,
    analyticsError: analytics.error,
    
    // Issues
    issues: issues.issues,
    issuesLoading: issues.loading,
    issuesError: issues.error,
    
    // Invoices
    invoices: invoices.invoices,
    invoicesLoading: invoices.loading,
    invoicesError: invoices.error,
    
    // Payments
    payments: payments.payments,
    paymentsLoading: payments.loading,
    paymentsError: payments.error,
    
    // Actions
    refreshAll,
    verifySubscription: issues.verifySubscription,
    fetchInvoices: invoices.fetchInvoices,
    fetchPayments: payments.fetchPayments,
  };
}
