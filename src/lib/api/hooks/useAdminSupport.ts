/**
 * Admin Support API Hooks
 * React hooks for admin support management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  customer: {
    name: string;
    email: string;
    organization: string;
    tier: 'free' | 'starter' | 'pro' | 'enterprise';
    avatar?: string;
  };
  assignedTo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  responseTime?: number; // in minutes
  resolutionTime?: number; // in minutes
  satisfaction?: number; // 1-5 stars
  tags: string[];
  messages: number;
  lastMessage: string;
}

export interface ChatSession {
  id: string;
  customer: {
    name: string;
    email: string;
    organization: string;
    avatar?: string;
  };
  agent?: {
    name: string;
    avatar?: string;
  };
  status: 'active' | 'waiting' | 'transferred' | 'ended';
  startTime: string;
  duration: number; // in minutes
  messageCount: number;
  lastMessage: string;
  lastActivity: string;
  tags: string[];
  waitTime?: number; // in minutes
  satisfactionScore?: number;
}

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  activeTickets: number;
  activeChatSessions: number;
  todayTicketsResolved: number;
  averageResponseTime: number; // in minutes
  satisfactionRating: number; // 1-5
  specialties: string[];
  shift: {
    start: string;
    end: string;
    timezone: string;
  };
  performance: {
    ticketsResolved: number;
    averageResolutionTime: number; // in hours
    customerSatisfaction: number;
    responseTime: number; // in minutes
  };
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting_started' | 'features' | 'billing' | 'troubleshooting' | 'api' | 'integrations';
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
  status: 'published' | 'draft' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SupportMetrics {
  activeTickets: number;
  averageResponseTime: number; // in hours
  customerSatisfactionScore: number;
  onlineStaff: number;
  todayTicketsResolved: number;
  ticketsOpenedToday: number;
  averageResolutionTime: number; // in hours
  firstResponseRate: number; // percentage within SLA
  resolutionRate: number;
  escalationRate: number;
}

// Support Metrics Hook
export function useAdminSupportMetrics() {
  const apiClient = useApiClient();
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SupportMetrics>('/admin/support/metrics');
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

// Support Tickets Hook
export function useAdminSupportTickets() {
  const apiClient = useApiClient();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SupportTicket[]>('/admin/support/tickets');
      setTickets(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = useCallback(async (ticketId: string, status: string, notes?: string) => {
    try {
      await apiClient.post(`/admin/support/tickets/${ticketId}/status`, { status, notes });
      await fetchTickets(); // Refresh tickets
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket status');
      throw err;
    }
  }, [apiClient, fetchTickets]);

  const assignTicket = useCallback(async (ticketId: string, agentId: string) => {
    try {
      await apiClient.post(`/admin/support/tickets/${ticketId}/assign`, { agentId });
      await fetchTickets(); // Refresh tickets
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
      throw err;
    }
  }, [apiClient, fetchTickets]);

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    updateTicketStatus,
    assignTicket
  };
}

// Chat Sessions Hook
export function useAdminChatSessions() {
  const apiClient = useApiClient();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ChatSession[]>('/admin/support/chat-sessions');
      setSessions(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions
  };
}

// Support Staff Hook
export function useAdminSupportStaff() {
  const apiClient = useApiClient();
  const [staff, setStaff] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SupportAgent[]>('/admin/support/staff');
      setStaff(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return {
    staff,
    loading,
    error,
    fetchStaff
  };
}

// Knowledge Articles Hook
export function useAdminKnowledgeArticles() {
  const apiClient = useApiClient();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<KnowledgeArticle[]>('/admin/support/knowledge');
      setArticles(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    fetchArticles
  };
}

// Combined Admin Support Dashboard Hook
export function useAdminSupportDashboard() {
  const metrics = useAdminSupportMetrics();
  const tickets = useAdminSupportTickets();
  const sessions = useAdminChatSessions();
  const staff = useAdminSupportStaff();
  const articles = useAdminKnowledgeArticles();

  const refreshAll = useCallback(() => {
    metrics.fetchMetrics();
    tickets.fetchTickets();
    sessions.fetchSessions();
    staff.fetchStaff();
    articles.fetchArticles();
  }, [metrics, tickets, sessions, staff, articles]);

  return {
    // Metrics
    metrics: metrics.metrics,
    metricsLoading: metrics.loading,
    metricsError: metrics.error,
    
    // Tickets
    tickets: tickets.tickets,
    ticketsLoading: tickets.loading,
    ticketsError: tickets.error,
    
    // Sessions
    sessions: sessions.sessions,
    sessionsLoading: sessions.loading,
    sessionsError: sessions.error,
    
    // Staff
    staff: staff.staff,
    staffLoading: staff.loading,
    staffError: staff.error,
    
    // Articles
    articles: articles.articles,
    articlesLoading: articles.loading,
    articlesError: articles.error,
    
    // Actions
    refreshAll,
    updateTicketStatus: tickets.updateTicketStatus,
    assignTicket: tickets.assignTicket,
    fetchTickets: tickets.fetchTickets,
    fetchSessions: sessions.fetchSessions,
    fetchStaff: staff.fetchStaff,
    fetchArticles: articles.fetchArticles,
  };
}
