/**
 * Advanced Monitoring Hook
 * ========================
 * React hook for easy integration with the advanced monitoring orchestrator
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface SystemHealthMetrics {
  timestamp: Date;
  overall: {
    status: 'healthy' | 'warning' | 'critical' | 'down';
    score: number;
    uptime: number;
  };
  components: {
    infrastructure: ComponentHealth;
    application: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    ai: ComponentHealth;
    security: ComponentHealth;
    attribution: ComponentHealth;
    monitoring: ComponentHealth;
  };
  predictions: {
    nextHour: HealthPrediction;
    next6Hours: HealthPrediction;
    next24Hours: HealthPrediction;
  };
  recommendations: string[];
  activeAlerts: ActiveAlert[];
}

interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  score: number;
  metrics: Record<string, number>;
  lastCheck: Date;
  issues: string[];
  recommendations: string[];
}

interface HealthPrediction {
  status: 'healthy' | 'warning' | 'critical';
  confidence: number;
  factors: string[];
  mitigations: string[];
}

interface ActiveAlert {
  id: string;
  rule: string;
  severity: string;
  message: string;
  component: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  escalated: boolean;
  actions: string[];
}

interface MonitoringInsight {
  id: string;
  type: 'performance_trend' | 'capacity_warning' | 'security_pattern' | 'cost_optimization' | 'reliability_issue';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  recommendations: string[];
  autoFixAvailable: boolean;
  estimatedResolution: string;
  createdAt: Date;
}

interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'correlation' | 'predictive';
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  conditions: any[];
  actions: any[];
  cooldownPeriod: number;
  lastTriggered?: Date;
  triggerCount: number;
  created: Date;
  updatedAt: Date;
}

interface ExecutionStats {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
}

interface UseAdvancedMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onError?: (error: string) => void;
}

export function useAdvancedMonitoring(options: UseAdvancedMonitoringOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    onError
  } = options;

  // State management
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [insights, setInsights] = useState<MonitoringInsight[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler
  const handleError = useCallback((err: string) => {
    setError(err);
    if (onError) {
      onError(err);
    } else {
      toast.error(`Monitoring Error: ${err}`);
    }
  }, [onError]);

  // API call wrapper
  const makeApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`/api/monitoring${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      handleError(errorMessage);
      throw err;
    }
  }, [handleError]);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await makeApiCall('?type=health');
      setSystemHealth(health);
      return health;
    } catch (err) {
      // Error is already handled in makeApiCall
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch active alerts
  const fetchActiveAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const alerts = await makeApiCall('?type=alerts');
      setActiveAlerts(alerts);
      return alerts;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch monitoring insights
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const insightsData = await makeApiCall('?type=insights');
      setInsights(insightsData);
      return insightsData;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch monitoring rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rulesData = await makeApiCall('?type=rules');
      setRules(rulesData);
      return rulesData;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch execution stats
  const fetchExecutionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await makeApiCall('?type=stats');
      setExecutionStats(stats);
      return stats;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Fetch all monitoring data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await makeApiCall('');
      setSystemHealth(overview.health);
      setActiveAlerts(overview.alerts);
      setInsights(overview.insights);
      setExecutionStats(overview.stats);
      return overview;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeApiCall]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'acknowledge_alert',
          data: { alertId }
        }),
      });

      if (result.success) {
        toast.success(`Alert ${alertId} acknowledged successfully`);
        // Refresh alerts
        await fetchActiveAlerts();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveAlerts]);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'resolve_alert',
          data: { alertId }
        }),
      });

      if (result.success) {
        toast.success(`Alert ${alertId} resolved successfully`);
        // Refresh alerts
        await fetchActiveAlerts();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchActiveAlerts]);

  // Create monitoring rule
  const createRule = useCallback(async (ruleData: Partial<MonitoringRule>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_rule',
          data: { rule: ruleData }
        }),
      });

      if (result.success) {
        toast.success('Monitoring rule created successfully');
        // Refresh rules
        await fetchRules();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchRules]);

  // Update monitoring rule
  const updateRule = useCallback(async (ruleId: string, updates: Partial<MonitoringRule>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall('', {
        method: 'PUT',
        body: JSON.stringify({
          ruleId,
          updates
        }),
      });

      if (result.success) {
        toast.success('Monitoring rule updated successfully');
        // Refresh rules
        await fetchRules();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchRules]);

  // Delete monitoring rule
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiCall(`?ruleId=${ruleId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        toast.success('Monitoring rule deleted successfully');
        // Refresh rules
        await fetchRules();
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, [makeApiCall, fetchRules]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Computed values
  const healthStatus = systemHealth?.overall.status || 'unknown';
  const healthScore = systemHealth?.overall.score || 0;
  const alertCount = activeAlerts.length;
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical').length;
  const highPriorityInsights = insights.filter(insight => 
    insight.impact === 'high' || insight.impact === 'critical'
  ).length;

  return {
    // Data
    systemHealth,
    activeAlerts,
    insights,
    rules,
    executionStats,
    
    // Status
    loading,
    error,
    
    // Computed values
    healthStatus,
    healthScore,
    alertCount,
    criticalAlerts,
    highPriorityInsights,
    
    // Actions
    fetchSystemHealth,
    fetchActiveAlerts,
    fetchInsights,
    fetchRules,
    fetchExecutionStats,
    fetchAllData,
    acknowledgeAlert,
    resolveAlert,
    createRule,
    updateRule,
    deleteRule,
    
    // Utilities
    refresh: fetchAllData,
    clearError: () => setError(null),
  };
}