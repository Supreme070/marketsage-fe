/**
 * Admin Incidents API Hooks
 * React hooks for admin incident management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedSystems: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo: string;
  reporter: string;
  impactDescription: string;
  resolutionNotes?: string;
  escalationLevel: number;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  rootCause?: string;
  followUpActions?: string[];
}

export interface SystemComponent {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  description: string;
  lastIncident?: string;
  uptime: string;
  dependencies: string[];
}

export interface PostMortem {
  id: string;
  incidentId: string;
  incidentTitle: string;
  createdAt: string;
  duration: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  timeline: {
    time: string;
    event: string;
    action?: string;
  }[];
  lessonsLearned: string[];
  actionItems: {
    description: string;
    assignee: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  affectedUsers: number;
  financialImpact?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerConditions: string[];
  escalationPath: {
    level: number;
    role: string;
    timeoutMinutes: number;
    notificationMethods: ('email' | 'sms' | 'slack')[];
  }[];
  isActive: boolean;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: {
    warning: number;
    critical: number;
  };
  currentValue: number;
  status: 'normal' | 'warning' | 'critical';
  lastTriggered?: string;
  isEnabled: boolean;
}

export interface IncidentMetrics {
  activeIncidents: number;
  criticalIncidents: number;
  systemHealth: number;
  avgResolutionTime: string;
  activeAlerts: number;
  totalIncidents: number;
  resolvedIncidents: number;
  escalationLevel: number;
}

// Incidents Hook
export function useAdminIncidents() {
  const apiClient = useApiClient();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Incident[]>('/admin/incidents/incidents');
      setIncidents(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const updateIncidentStatus = useCallback(async (incidentId: string, status: string, notes?: string) => {
    try {
      await apiClient.post(`/admin/incidents/incidents/${incidentId}/status`, { status, notes });
      await fetchIncidents(); // Refresh incidents
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident status');
      throw err;
    }
  }, [apiClient, fetchIncidents]);

  const createIncident = useCallback(async (incidentData: Partial<Incident>) => {
    try {
      const result = await apiClient.post('/admin/incidents/incidents', incidentData);
      await fetchIncidents(); // Refresh incidents
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
      throw err;
    }
  }, [apiClient, fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    updateIncidentStatus,
    createIncident
  };
}

// System Components Hook
export function useAdminSystemComponents() {
  const apiClient = useApiClient();
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SystemComponent[]>('/admin/incidents/components');
      setComponents(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  return {
    components,
    loading,
    error,
    fetchComponents
  };
}

// Post-Mortems Hook
export function useAdminPostMortems() {
  const apiClient = useApiClient();
  const [postMortems, setPostMortems] = useState<PostMortem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostMortems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<PostMortem[]>('/admin/incidents/postmortems');
      setPostMortems(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPostMortems();
  }, [fetchPostMortems]);

  return {
    postMortems,
    loading,
    error,
    fetchPostMortems
  };
}

// Escalation Rules Hook
export function useAdminEscalationRules() {
  const apiClient = useApiClient();
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEscalationRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<EscalationRule[]>('/admin/incidents/escalation');
      setEscalationRules(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchEscalationRules();
  }, [fetchEscalationRules]);

  return {
    escalationRules,
    loading,
    error,
    fetchEscalationRules
  };
}

// Alerts Hook
export function useAdminAlerts() {
  const apiClient = useApiClient();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Alert[]>('/admin/incidents/alerts');
      setAlerts(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts
  };
}

// Incident Metrics Hook
export function useAdminIncidentMetrics() {
  const apiClient = useApiClient();
  const [metrics, setMetrics] = useState<IncidentMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<IncidentMetrics>('/admin/incidents/metrics');
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

// Combined Admin Incidents Dashboard Hook
export function useAdminIncidentsDashboard() {
  const incidents = useAdminIncidents();
  const components = useAdminSystemComponents();
  const postMortems = useAdminPostMortems();
  const escalationRules = useAdminEscalationRules();
  const alerts = useAdminAlerts();
  const metrics = useAdminIncidentMetrics();

  const refreshAll = useCallback(() => {
    incidents.fetchIncidents();
    components.fetchComponents();
    postMortems.fetchPostMortems();
    escalationRules.fetchEscalationRules();
    alerts.fetchAlerts();
    metrics.fetchMetrics();
  }, [incidents, components, postMortems, escalationRules, alerts, metrics]);

  return {
    // Incidents
    incidents: incidents.incidents,
    incidentsLoading: incidents.loading,
    incidentsError: incidents.error,
    
    // System Components
    components: components.components,
    componentsLoading: components.loading,
    componentsError: components.error,
    
    // Post-Mortems
    postMortems: postMortems.postMortems,
    postMortemsLoading: postMortems.loading,
    postMortemsError: postMortems.error,
    
    // Escalation Rules
    escalationRules: escalationRules.escalationRules,
    escalationRulesLoading: escalationRules.loading,
    escalationRulesError: escalationRules.error,
    
    // Alerts
    alerts: alerts.alerts,
    alertsLoading: alerts.loading,
    alertsError: alerts.error,
    
    // Metrics
    metrics: metrics.metrics,
    metricsLoading: metrics.loading,
    metricsError: metrics.error,
    
    // Actions
    refreshAll,
    updateIncidentStatus: incidents.updateIncidentStatus,
    createIncident: incidents.createIncident,
    fetchIncidents: incidents.fetchIncidents,
    fetchComponents: components.fetchComponents,
    fetchPostMortems: postMortems.fetchPostMortems,
    fetchEscalationRules: escalationRules.fetchEscalationRules,
    fetchAlerts: alerts.fetchAlerts,
    fetchMetrics: metrics.fetchMetrics,
  };
}
