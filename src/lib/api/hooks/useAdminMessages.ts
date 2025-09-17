/**
 * Admin Messages API Hooks
 * React hooks for admin message queue management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface QueueStats {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'WEBHOOK';
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stuck: number;
  averageProcessTime: string;
  status: 'healthy' | 'degraded' | 'error';
}

export interface FailedMessage {
  id: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  error: string;
  retryCount: number;
  failedAt: string;
  campaignName?: string;
  organizationName: string;
}

export interface ProviderHealth {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  status: 'operational' | 'degraded' | 'down';
  responseTime: string;
  successRate: number;
  lastChecked: string;
  issues?: string[];
}

export interface MessageMetrics {
  totalQueued: number;
  totalProcessing: number;
  totalFailed: number;
  totalCompleted: number;
  successRate: number;
  failedToday: number;
  failedSinceLastHour: number;
  successRateImprovement: number;
}

// Message Queue Stats Hook
export function useAdminMessageQueueStats() {
  const apiClient = useApiClient();
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<QueueStats[]>('/admin/messages/queues');
      setQueueStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchQueueStats();
  }, [fetchQueueStats]);

  return {
    queueStats,
    loading,
    error,
    fetchQueueStats
  };
}

// Failed Messages Hook
export function useAdminFailedMessages() {
  const apiClient = useApiClient();
  const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFailedMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<FailedMessage[]>('/admin/messages/failed');
      setFailedMessages(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchFailedMessages();
  }, [fetchFailedMessages]);

  const retryMessage = useCallback(async (messageId: string) => {
    try {
      await apiClient.post(`/admin/messages/failed/${messageId}/retry`);
      await fetchFailedMessages(); // Refresh failed messages
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry message');
      throw err;
    }
  }, [apiClient, fetchFailedMessages]);

  return {
    failedMessages,
    loading,
    error,
    fetchFailedMessages,
    retryMessage
  };
}

// Provider Health Hook
export function useAdminProviderHealth() {
  const apiClient = useApiClient();
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ProviderHealth[]>('/admin/messages/providers');
      setProviderHealth(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchProviderHealth();
  }, [fetchProviderHealth]);

  return {
    providerHealth,
    loading,
    error,
    fetchProviderHealth
  };
}

// Message Metrics Hook
export function useAdminMessageMetrics() {
  const apiClient = useApiClient();
  const [metrics, setMetrics] = useState<MessageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<MessageMetrics>('/admin/messages/metrics');
      setMetrics(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    fetchMetrics
  };
}

// Queue Management Hook
export function useAdminQueueManagement() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearQueue = useCallback(async (queueName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/admin/messages/queues/${queueName}/clear`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear queue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const pauseQueue = useCallback(async (queueName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/admin/messages/queues/${queueName}/pause`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause queue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const resumeQueue = useCallback(async (queueName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/admin/messages/queues/${queueName}/resume`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume queue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    loading,
    error,
    clearQueue,
    pauseQueue,
    resumeQueue
  };
}

// Combined Admin Messages Dashboard Hook
export function useAdminMessagesDashboard() {
  const queueStats = useAdminMessageQueueStats();
  const failedMessages = useAdminFailedMessages();
  const providerHealth = useAdminProviderHealth();
  const metrics = useAdminMessageMetrics();
  const queueManagement = useAdminQueueManagement();

  const refreshAll = useCallback(() => {
    queueStats.fetchQueueStats();
    failedMessages.fetchFailedMessages();
    providerHealth.fetchProviderHealth();
    metrics.fetchMetrics();
  }, [queueStats, failedMessages, providerHealth, metrics]);

  return {
    // Queue Stats
    queueStats: queueStats.queueStats,
    queueStatsLoading: queueStats.loading,
    queueStatsError: queueStats.error,
    
    // Failed Messages
    failedMessages: failedMessages.failedMessages,
    failedMessagesLoading: failedMessages.loading,
    failedMessagesError: failedMessages.error,
    
    // Provider Health
    providerHealth: providerHealth.providerHealth,
    providerHealthLoading: providerHealth.loading,
    providerHealthError: providerHealth.error,
    
    // Metrics
    metrics: metrics.metrics,
    metricsLoading: metrics.loading,
    metricsError: metrics.error,
    
    // Queue Management
    queueManagementLoading: queueManagement.loading,
    queueManagementError: queueManagement.error,
    
    // Actions
    refreshAll,
    retryMessage: failedMessages.retryMessage,
    clearQueue: queueManagement.clearQueue,
    pauseQueue: queueManagement.pauseQueue,
    resumeQueue: queueManagement.resumeQueue,
    fetchQueueStats: queueStats.fetchQueueStats,
    fetchFailedMessages: failedMessages.fetchFailedMessages,
    fetchProviderHealth: providerHealth.fetchProviderHealth,
    fetchMetrics: metrics.fetchMetrics,
  };
}
