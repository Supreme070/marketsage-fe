/**
 * Admin Security API Hooks
 * React hooks for admin security management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  ipAddress?: string;
  userId?: string;
  timestamp: string;
  resolved: boolean;
  metadata: any;
}

export interface AccessLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  organization: string;
  keyPreview: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'ddos' | 'malware' | 'suspicious_activity' | 'api_abuse';
  source: string;
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
  timestamp: string;
  details: string;
}

export interface SecurityStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
    totalApiKeys: number;
    activeApiKeys: number;
    expiredApiKeys: number;
  };
  recentEvents: SecurityEvent[];
  topThreats: Array<{
    ipAddress: string;
    threatType: string;
    riskScore: number;
    eventCount: number;
    blocked: boolean;
    location?: string;
    lastSeen: string;
  }>;
  systemStatus: {
    firewall: string;
    ddosProtection: string;
    intrusionDetection: string;
    vulnerabilityScan: string;
  };
}

// Security Stats Hook
export function useAdminSecurityStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SecurityStats>('/admin/security/stats');
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

// Security Events Hook
export function useAdminSecurityEvents(limit: number = 50, offset: number = 0) {
  const apiClient = useApiClient();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<{
        events: SecurityEvent[];
        total: number;
        hasMore: boolean;
      }>(`/admin/security/events?limit=${limit}&offset=${offset}`);
      
      setEvents(response.events);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, limit, offset]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resolveEvent = useCallback(async (eventId: string) => {
    try {
      await apiClient.post(`/admin/security/events/${eventId}/resolve`);
      await fetchEvents(); // Refresh events
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve event');
      throw err;
    }
  }, [apiClient, fetchEvents]);

  return {
    events,
    loading,
    error,
    total,
    hasMore,
    fetchEvents,
    resolveEvent
  };
}

// Access Logs Hook
export function useAdminAccessLogs(limit: number = 50, offset: number = 0) {
  const apiClient = useApiClient();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<{
        logs: AccessLog[];
        total: number;
        hasMore: boolean;
      }>(`/admin/security/access-logs?limit=${limit}&offset=${offset}`);
      
      setLogs(response.logs);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, limit, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    total,
    hasMore,
    fetchLogs
  };
}

// API Keys Hook
export function useAdminApiKeys() {
  const apiClient = useApiClient();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ApiKey[]>('/admin/security/api-keys');
      setApiKeys(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const revokeApiKey = useCallback(async (apiKeyId: string) => {
    try {
      await apiClient.post(`/admin/security/api-keys/${apiKeyId}/revoke`);
      await fetchApiKeys(); // Refresh API keys
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
      throw err;
    }
  }, [apiClient, fetchApiKeys]);

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    revokeApiKey
  };
}

// Threat Detection Hook
export function useAdminThreatDetection() {
  const apiClient = useApiClient();
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ThreatDetection[]>('/admin/security/threats');
      setThreats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  const blockThreat = useCallback(async (threatId: string) => {
    try {
      await apiClient.post(`/admin/security/threats/${threatId}/block`);
      await fetchThreats(); // Refresh threats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block threat');
      throw err;
    }
  }, [apiClient, fetchThreats]);

  return {
    threats,
    loading,
    error,
    fetchThreats,
    blockThreat
  };
}

// Combined Admin Security Dashboard Hook
export function useAdminSecurityDashboard() {
  const stats = useAdminSecurityStats();
  const events = useAdminSecurityEvents();
  const logs = useAdminAccessLogs();
  const apiKeys = useAdminApiKeys();
  const threats = useAdminThreatDetection();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
    events.fetchEvents();
    logs.fetchLogs();
    apiKeys.fetchApiKeys();
    threats.fetchThreats();
  }, [stats, events, logs, apiKeys, threats]);

  return {
    stats: stats.stats,
    events: events.events,
    logs: logs.logs,
    apiKeys: apiKeys.apiKeys,
    threats: threats.threats,
    loading: stats.loading || events.loading || logs.loading || apiKeys.loading || threats.loading,
    error: stats.error || events.error || logs.error || apiKeys.error || threats.error,
    refreshAll,
    resolveEvent: events.resolveEvent,
    revokeApiKey: apiKeys.revokeApiKey,
    blockThreat: threats.blockThreat
  };
}
