/**
 * Admin Analytics API Hooks
 * React hooks for admin dashboard analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AdminAnalyticsData {
  overview: {
    totalUsers: number;
    userGrowthRate: number;
    activeUsers: number;
    totalRevenue: number;
    revenueGrowthRate: number;
    usersThisMonth: number;
  };
  revenueAnalytics: {
    monthlyRevenue: number;
    growthRate: number;
    averageOrderValue: number;
  };
  campaignAnalytics: {
    channelPerformance: Array<{
      channel: string;
      campaigns: number;
      sent: number;
      delivered: number;
      opened?: number;
      clicked?: number;
      read?: number;
    }>;
  };
  leadPulseAnalytics: {
    totalSessions: number;
    totalForms: number;
    totalSubmissions: number;
    conversionRate: number;
  };
  workflowAnalytics: {
    totalExecutions: number;
    activeWorkflows: number;
    successRate: number;
  };
  platformMetrics: {
    apiCalls: number;
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface UsersAnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  retentionRate: number;
  churnRate: number;
  averageSessionDuration: number;
}

export interface RevenueAnalyticsData {
  monthlyRevenue: number;
  annualRevenue: number;
  averageOrderValue: number;
  growthRate: number;
  lifetimeValue: number;
  churnRevenue: number;
}

export interface PlatformMetricsData {
  apiRequests: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

// Admin Analytics Hook
export function useAdminAnalytics() {
  const apiClient = useApiClient();
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/analytics');
      
      if (response.success && response.data) {
        setAnalyticsData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error?.message || 'Failed to fetch admin analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    lastUpdated,
    refreshAnalytics
  };
}

// Users Analytics Hook
export function useUsersAnalytics() {
  const apiClient = useApiClient();
  const [usersData, setUsersData] = useState<UsersAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/analytics/users');
      
      if (response.success && response.data) {
        setUsersData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch users analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchUsersAnalytics();
  }, [fetchUsersAnalytics]);

  return {
    usersData,
    loading,
    error,
    fetchUsersAnalytics
  };
}

// Revenue Analytics Hook
export function useRevenueAnalytics() {
  const apiClient = useApiClient();
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/analytics/revenue');
      
      if (response.success && response.data) {
        setRevenueData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch revenue analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [fetchRevenueAnalytics]);

  return {
    revenueData,
    loading,
    error,
    fetchRevenueAnalytics
  };
}

// Platform Metrics Hook
export function usePlatformMetrics() {
  const apiClient = useApiClient();
  const [platformData, setPlatformData] = useState<PlatformMetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatformMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/analytics/platform');
      
      if (response.success && response.data) {
        setPlatformData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch platform metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPlatformMetrics();
    
    // Auto-refresh every 60 seconds for platform metrics
    const interval = setInterval(() => {
      fetchPlatformMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPlatformMetrics]);

  return {
    platformData,
    loading,
    error,
    fetchPlatformMetrics
  };
}

// Combined Admin Dashboard Hook
export function useAdminDashboard() {
  const analytics = useAdminAnalytics();
  const users = useUsersAnalytics();
  const revenue = useRevenueAnalytics();
  const platform = usePlatformMetrics();

  const refreshAll = useCallback(() => {
    analytics.refreshAnalytics();
    users.fetchUsersAnalytics();
    revenue.fetchRevenueAnalytics();
    platform.fetchPlatformMetrics();
  }, [analytics, users, revenue, platform]);

  return {
    analytics: analytics.analyticsData,
    users: users.usersData,
    revenue: revenue.revenueData,
    platform: platform.platformData,
    loading: analytics.loading || users.loading || revenue.loading || platform.loading,
    error: analytics.error || users.error || revenue.error || platform.error,
    lastUpdated: analytics.lastUpdated,
    refreshAll
  };
}
