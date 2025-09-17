/**
 * Admin Organizations API Hooks
 * React hooks for admin organization management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AdminOrganization {
  id: string;
  name: string;
  plan: string;
  websiteUrl?: string;
  address?: string;
  logoUrl?: string;
  billingEmail?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    contacts: number;
    emailCampaigns: number;
  };
}

export interface AdminOrganizationStats {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalRevenue: number;
  averageUsersPerOrg: number;
}

export interface OrganizationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  status?: string;
}

export interface OrganizationsResponse {
  organizations: AdminOrganization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Organizations Hook
export function useAdminOrganizations(query?: OrganizationQueryParams) {
  const apiClient = useApiClient();
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.tier && query.tier !== 'all') params.append('tier', query.tier);
      if (query?.status && query.status !== 'all') params.append('status', query.status);

      const response = await apiClient.get<OrganizationsResponse>(`/organizations?${params.toString()}`);
      
      if (response.organizations && response.pagination) {
        setOrganizations(response.organizations);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, query]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const refreshOrganizations = useCallback(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const suspendOrganization = useCallback(async (orgId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/organizations/admin/suspend/${orgId}`);
      
      if (response.success) {
        await fetchOrganizations(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to suspend organization');
        throw new Error(response.error?.message || 'Failed to suspend organization');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchOrganizations]);

  const activateOrganization = useCallback(async (orgId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/organizations/admin/activate/${orgId}`);
      
      if (response.success) {
        await fetchOrganizations(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to activate organization');
        throw new Error(response.error?.message || 'Failed to activate organization');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    pagination,
    refreshOrganizations,
    suspendOrganization,
    activateOrganization
  };
}

// Admin Organization Stats Hook
export function useAdminOrganizationStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AdminOrganizationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AdminOrganizationStats>('/organizations/admin/stats');
      
      if (response) {
        setStats(response);
      } else {
        setError('Failed to fetch organization stats');
      }
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

// Combined Admin Organizations Dashboard Hook
export function useAdminOrganizationsDashboard(query?: OrganizationQueryParams) {
  const organizations = useAdminOrganizations(query);
  const stats = useAdminOrganizationStats();

  const refreshAll = useCallback(() => {
    organizations.refreshOrganizations();
    stats.fetchStats();
  }, [organizations, stats]);

  return {
    organizations: organizations.organizations,
    stats: stats.stats,
    loading: organizations.loading || stats.loading,
    error: organizations.error || stats.error,
    pagination: organizations.pagination,
    refreshAll,
    suspendOrganization: organizations.suspendOrganization,
    activateOrganization: organizations.activateOrganization
  };
}
