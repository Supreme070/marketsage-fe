/**
 * Admin AI API Hooks
 * React hooks for admin AI management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AIUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  totalCost: number;
  costToday: number;
  costThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  activeModels: number;
  safetyIncidents: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  version: string;
  requests: number;
  cost: number;
  averageResponseTime: number;
  errorRate: number;
  accuracy: number;
  lastUsed: string;
  capabilities: string[];
}

export interface CostBreakdown {
  provider: string;
  model: string;
  requests: number;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface SafetyIncident {
  id: string;
  type: 'content_violation' | 'safety_filter' | 'unauthorized_access' | 'data_leak' | 'model_misuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  model: string;
  user?: string;
  organization?: string;
  timestamp: string;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  action: string;
  details: any;
}

export interface AIOperation {
  id: string;
  type: 'chat' | 'task_execution' | 'content_generation' | 'analysis' | 'prediction';
  model: string;
  organization: string;
  user: string;
  prompt: string;
  response: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  safetyChecks: {
    passed: boolean;
    flags: string[];
  };
}

export interface UsageAnalytics {
  byModel: Array<{
    model: string;
    requests: number;
    percentage: number;
  }>;
  byType: Array<{
    type: string;
    requests: number;
    percentage: number;
  }>;
  peakUsage: {
    peakHour: string;
    peakDay: string;
    avgQueueTime: string;
    capacityUsed: number;
  };
}

// AI Stats Hook
export function useAdminAIStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AIUsageStats>('/ai/admin/stats');
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

// AI Models Hook
export function useAdminAIModels() {
  const apiClient = useApiClient();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AIModel[]>('/ai/admin/models');
      setModels(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    fetchModels
  };
}

// AI Costs Hook
export function useAdminAICosts() {
  const apiClient = useApiClient();
  const [costs, setCosts] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<CostBreakdown[]>('/ai/admin/costs');
      setCosts(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  return {
    costs,
    loading,
    error,
    fetchCosts
  };
}

// Safety Incidents Hook
export function useAdminSafetyIncidents() {
  const apiClient = useApiClient();
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSafetyIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SafetyIncident[]>('/ai/admin/safety-incidents');
      setSafetyIncidents(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSafetyIncidents();
  }, [fetchSafetyIncidents]);

  return {
    safetyIncidents,
    loading,
    error,
    fetchSafetyIncidents
  };
}

// AI Operations Hook
export function useAdminAIOperations() {
  const apiClient = useApiClient();
  const [operations, setOperations] = useState<AIOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AIOperation[]>('/ai/admin/operations');
      setOperations(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  return {
    operations,
    loading,
    error,
    fetchOperations
  };
}

// Usage Analytics Hook
export function useAdminAIUsageAnalytics() {
  const apiClient = useApiClient();
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<UsageAnalytics>('/ai/admin/usage-analytics');
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

// Combined Admin AI Dashboard Hook
export function useAdminAIDashboard() {
  const stats = useAdminAIStats();
  const models = useAdminAIModels();
  const costs = useAdminAICosts();
  const safetyIncidents = useAdminSafetyIncidents();
  const operations = useAdminAIOperations();
  const analytics = useAdminAIUsageAnalytics();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
    models.fetchModels();
    costs.fetchCosts();
    safetyIncidents.fetchSafetyIncidents();
    operations.fetchOperations();
    analytics.fetchAnalytics();
  }, [stats, models, costs, safetyIncidents, operations, analytics]);

  return {
    // Stats
    stats: stats.stats,
    statsLoading: stats.loading,
    statsError: stats.error,
    
    // Models
    models: models.models,
    modelsLoading: models.loading,
    modelsError: models.error,
    
    // Costs
    costs: costs.costs,
    costsLoading: costs.loading,
    costsError: costs.error,
    
    // Safety Incidents
    safetyIncidents: safetyIncidents.safetyIncidents,
    safetyIncidentsLoading: safetyIncidents.loading,
    safetyIncidentsError: safetyIncidents.error,
    
    // Operations
    operations: operations.operations,
    operationsLoading: operations.loading,
    operationsError: operations.error,
    
    // Analytics
    analytics: analytics.analytics,
    analyticsLoading: analytics.loading,
    analyticsError: analytics.error,
    
    // Actions
    refreshAll,
    fetchStats: stats.fetchStats,
    fetchModels: models.fetchModels,
    fetchCosts: costs.fetchCosts,
    fetchSafetyIncidents: safetyIncidents.fetchSafetyIncidents,
    fetchOperations: operations.fetchOperations,
    fetchAnalytics: analytics.fetchAnalytics,
  };
}
