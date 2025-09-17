/**
 * Admin Audit API Hooks
 * React hooks for admin audit trail management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: any;
  metadata?: any;
  timestamp: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditStats {
  totalEvents: number;
  todayEvents: number;
  activeUsers: number;
  systemChanges: number;
  recentActivities: AuditLog[];
  topResources: { resource: string; count: number }[];
  topUsers: { userId: string; email: string; count: number }[];
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditFilters {
  action?: string;
  resource?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
  type: string;
}

// Audit Stats Hook
export function useAdminAuditStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AuditStats>('/admin/audit/stats');
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

// Audit Logs Hook
export function useAdminAuditLogs() {
  const apiClient = useApiClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchLogs = useCallback(async (filters: AuditFilters = {}, paginationParams: AuditPagination) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: paginationParams.page.toString(),
        limit: paginationParams.limit.toString(),
        type: paginationParams.type,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as any),
      });

      const response = await apiClient.get<AuditLogsResponse>(`/admin/audit/logs?${params}`);
      setLogs(response.logs);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const refreshLogs = useCallback((filters: AuditFilters = {}, paginationParams: AuditPagination) => {
    fetchLogs(filters, paginationParams);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    pagination,
    fetchLogs,
    refreshLogs
  };
}

// Audit Export Hook
export function useAdminAuditExport() {
  const apiClient = useApiClient();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportLogs = useCallback(async (filters: AuditFilters = {}, type: string = 'admin-actions') => {
    setExporting(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as any),
      });

      const response = await fetch(`${apiClient.baseURL}/admin/audit/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      throw err;
    } finally {
      setExporting(false);
    }
  }, [apiClient]);

  return {
    exporting,
    error,
    exportLogs
  };
}

// Combined Admin Audit Dashboard Hook
export function useAdminAuditDashboard() {
  const stats = useAdminAuditStats();
  const logs = useAdminAuditLogs();
  const exportHook = useAdminAuditExport();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
  }, [stats]);

  const refreshLogsWithFilters = useCallback((filters: AuditFilters, paginationParams: AuditPagination) => {
    logs.refreshLogs(filters, paginationParams);
  }, [logs]);

  return {
    // Stats
    stats: stats.stats,
    statsLoading: stats.loading,
    statsError: stats.error,
    
    // Logs
    logs: logs.logs,
    logsLoading: logs.loading,
    logsError: logs.error,
    pagination: logs.pagination,
    
    // Export
    exporting: exportHook.exporting,
    exportError: exportHook.error,
    
    // Actions
    refreshAll,
    refreshLogs: refreshLogsWithFilters,
    exportLogs: exportHook.exportLogs,
    fetchLogs: logs.fetchLogs,
  };
}
