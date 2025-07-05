/**
 * Autonomous Attribution Hook
 * ==========================
 * React hook for accessing autonomous attribution insights and actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  AttributionInsight, 
  AttributionRecommendation, 
  AutonomousAction 
} from '@/lib/attribution/autonomous-attribution-engine';

interface AttributionMetrics {
  totalConversions: number;
  totalRevenue: number;
  avgTimeToConversion: number;
  topChannels: any[];
  attributionHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface UseAutonomousAttributionReturn {
  insights: AttributionInsight[];
  metrics: AttributionMetrics | null;
  recommendations: AttributionRecommendation[];
  loading: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  triggerAnalysis: () => Promise<void>;
  configureAutomation: (config: any) => Promise<void>;
}

export function useAutonomousAttribution(
  hours = 24,
  autoRefresh = true
): UseAutonomousAttributionReturn {
  const [insights, setInsights] = useState<AttributionInsight[]>([]);
  const [metrics, setMetrics] = useState<AttributionMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AttributionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch(`/api/attribution/autonomous?action=insights&hours=${hours}`);
      const result = await response.json();
      
      if (result.success) {
        setInsights(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    }
  }, [hours]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/attribution/autonomous?action=metrics');
      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/attribution/autonomous?action=recommendations');
      const result = await response.json();
      
      if (result.success) {
        setRecommendations(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    }
  }, []);

  const refreshInsights = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInsights(),
        fetchMetrics(),
        fetchRecommendations()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchInsights, fetchMetrics, fetchRecommendations]);

  const approveAction = useCallback(async (actionId: string) => {
    try {
      const response = await fetch('/api/attribution/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_action',
          actionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Action approved successfully');
        await refreshInsights(); // Refresh to get updated status
      } else {
        toast.error(result.error || 'Failed to approve action');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve action');
    }
  }, [refreshInsights]);

  const rejectAction = useCallback(async (actionId: string) => {
    try {
      const response = await fetch('/api/attribution/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_action',
          actionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Action rejected');
        await refreshInsights(); // Refresh to get updated status
      } else {
        toast.error(result.error || 'Failed to reject action');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject action');
    }
  }, [refreshInsights]);

  const triggerAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/attribution/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_analysis'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Attribution analysis started');
        // Refresh insights after a delay to get new results
        setTimeout(() => {
          refreshInsights();
        }, 60000); // Wait 1 minute before refreshing
      } else {
        toast.error(result.error || 'Failed to trigger analysis');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to trigger analysis');
    }
  }, [refreshInsights]);

  const configureAutomation = useCallback(async (config: any) => {
    try {
      const response = await fetch('/api/attribution/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure_automation',
          ...config
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Automation configuration updated');
      } else {
        toast.error(result.error || 'Failed to update configuration');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update configuration');
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshInsights();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInsights]);

  return {
    insights,
    metrics,
    recommendations,
    loading,
    error,
    refreshInsights,
    approveAction,
    rejectAction,
    triggerAnalysis,
    configureAutomation
  };
}