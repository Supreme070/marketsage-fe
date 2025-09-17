/**
 * Admin System API Hooks
 * React hooks for admin system monitoring and management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
}

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  responseTime: string;
  lastCheck: string;
  endpoint?: string;
  version?: string;
  dependencies?: string[];
  issues?: string[];
}

export interface InfrastructureMetric {
  category: string;
  metrics: {
    name: string;
    current: number;
    max: number;
    unit: string;
    status: 'healthy' | 'warning' | 'critical';
  }[];
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemStats {
  systemResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  alerts: SystemAlert[];
}

// System Stats Hook
export function useAdminSystemStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SystemStats>('/metrics/admin/system/stats');
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

// System Services Hook
export function useAdminSystemServices() {
  const apiClient = useApiClient();
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ServiceHealth[]>('/metrics/admin/system/services');
      setServices(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices
  };
}

// System Infrastructure Hook
export function useAdminSystemInfrastructure() {
  const apiClient = useApiClient();
  const [infrastructure, setInfrastructure] = useState<InfrastructureMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfrastructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<InfrastructureMetric[]>('/metrics/admin/system/infrastructure');
      setInfrastructure(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchInfrastructure();
  }, [fetchInfrastructure]);

  return {
    infrastructure,
    loading,
    error,
    fetchInfrastructure
  };
}

// Combined Admin System Dashboard Hook
export function useAdminSystemDashboard() {
  const stats = useAdminSystemStats();
  const services = useAdminSystemServices();
  const infrastructure = useAdminSystemInfrastructure();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
    services.fetchServices();
    infrastructure.fetchInfrastructure();
  }, [stats, services, infrastructure]);

  // Transform stats to system metrics format for compatibility
  const systemMetrics: SystemMetric[] = stats.stats ? [
    {
      name: 'CPU Usage',
      value: stats.stats.systemResources.cpu,
      unit: '%',
      status: stats.stats.systemResources.cpu > 80 ? 'critical' : stats.stats.systemResources.cpu > 60 ? 'warning' : 'healthy',
      trend: 'stable',
      threshold: { warning: 70, critical: 90 }
    },
    {
      name: 'Memory Usage',
      value: stats.stats.systemResources.memory,
      unit: '%',
      status: stats.stats.systemResources.memory > 85 ? 'critical' : stats.stats.systemResources.memory > 75 ? 'warning' : 'healthy',
      trend: 'stable',
      threshold: { warning: 75, critical: 90 }
    },
    {
      name: 'Disk Usage',
      value: stats.stats.systemResources.disk,
      unit: '%',
      status: stats.stats.systemResources.disk > 90 ? 'critical' : stats.stats.systemResources.disk > 80 ? 'warning' : 'healthy',
      trend: 'stable',
      threshold: { warning: 80, critical: 95 }
    },
    {
      name: 'Network I/O',
      value: stats.stats.systemResources.network,
      unit: 'Mbps',
      status: 'healthy',
      trend: 'stable',
      threshold: { warning: 80, critical: 100 }
    }
  ] : [];

  return {
    stats: stats.stats,
    systemMetrics,
    services: services.services,
    infrastructure: infrastructure.infrastructure,
    loading: stats.loading || services.loading || infrastructure.loading,
    error: stats.error || services.error || infrastructure.error,
    refreshAll
  };
}
