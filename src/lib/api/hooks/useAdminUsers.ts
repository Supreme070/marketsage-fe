/**
 * Admin Users API Hooks
 * React hooks for admin user management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  emailVerified?: string | null;
  image?: string;
  isSuspended?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
}

export interface AdminUserStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Users Hook
export function useAdminUsers(query?: UserQueryParams) {
  const apiClient = useApiClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.role && query.role !== 'all') params.append('role', query.role);
      if (query?.status && query.status !== 'all') params.append('status', query.status);

      const response = await apiClient.get<UsersResponse>(`/users?${params.toString()}`);
      
      if (response.users && response.pagination) {
        setUsers(response.users);
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
    fetchUsers();
  }, [fetchUsers]);

  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const suspendUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/users/admin/suspend/${userId}`);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to suspend user');
        throw new Error(response.error?.message || 'Failed to suspend user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const activateUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/users/admin/activate/${userId}`);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to activate user');
        throw new Error(response.error?.message || 'Failed to activate user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    refreshUsers,
    suspendUser,
    activateUser
  };
}

// Admin User Stats Hook
export function useAdminUserStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AdminUserStats>('/users/admin/stats');
      
      if (response) {
        setStats(response);
      } else {
        setError('Failed to fetch user stats');
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

// Combined Admin Users Dashboard Hook
export function useAdminUsersDashboard(query?: UserQueryParams) {
  const users = useAdminUsers(query);
  const stats = useAdminUserStats();

  const refreshAll = useCallback(() => {
    users.refreshUsers();
    stats.fetchStats();
  }, [users, stats]);

  return {
    users: users.users,
    stats: stats.stats,
    loading: users.loading || stats.loading,
    error: users.error || stats.error,
    pagination: users.pagination,
    refreshAll,
    suspendUser: users.suspendUser,
    activateUser: users.activateUser
  };
}
