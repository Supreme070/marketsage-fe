/**
 * Unified Campaigns API Hooks
 * React hooks for multi-channel campaign orchestration
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface UnifiedCampaign {
  id: string;
  name: string;
  description?: string;
  channels: ChannelType[];
  status: CampaignStatus;
  priority: number;
  budget?: number;
  costPerMessage?: number;
  recurrence: RecurrenceType;
  recurrenceData?: any;
  timezone: string;
  listIds: string[];
  segmentIds: string[];
  emailConfig?: EmailConfig;
  smsConfig?: SMSConfig;
  whatsappConfig?: WhatsAppConfig;
  channelCampaigns: ChannelCampaign[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChannelCampaign {
  channel: ChannelType;
  campaignId: string;
  campaign: any;
}

export interface EmailConfig {
  subject?: string;
  content?: string;
  templateId?: string;
  from?: string;
  replyTo?: string;
}

export interface SMSConfig {
  content?: string;
  templateId?: string;
  from?: string;
}

export interface WhatsAppConfig {
  content?: string;
  templateId?: string;
  from?: string;
  messageType?: string;
}

export interface CreateUnifiedCampaignDto {
  name: string;
  description?: string;
  channels: ChannelType[];
  priority?: number;
  budget?: number;
  costPerMessage?: number;
  recurrence?: RecurrenceType;
  recurrenceData?: any;
  timezone?: string;
  listIds?: string[];
  segmentIds?: string[];
  emailConfig?: EmailConfig;
  smsConfig?: SMSConfig;
  whatsappConfig?: WhatsAppConfig;
}

export interface CampaignQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
  channels?: ChannelType[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CampaignAnalyticsQueryDto {
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  groupBy?: string;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  entityId: string;
  status: ABTestStatus;
  testType: string;
  testElements: string;
  winnerMetric: string;
  winnerThreshold?: number;
  distributionPercent: number;
  winnerVariantId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  variants: ABTestVariant[];
  results: ABTestResult[];
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: string;
  description?: string;
  content: string;
  trafficPercent: number;
  isControl: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestResult {
  id: string;
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  definition: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  executions: WorkflowExecution[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  status: WorkflowExecutionStatus;
  context: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export enum RecurrenceType {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum ABTestStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export enum WorkflowExecutionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export enum WinnerCriteria {
  OPEN_RATE = 'OPEN_RATE',
  CLICK_RATE = 'CLICK_RATE',
  CONVERSION_RATE = 'CONVERSION_RATE',
  REVENUE = 'REVENUE',
  ENGAGEMENT = 'ENGAGEMENT'
}

export enum VariantType {
  SUBJECT = 'SUBJECT',
  CONTENT = 'CONTENT',
  SENDER = 'SENDER',
  CTA = 'CTA',
  IMAGE = 'IMAGE',
  LAYOUT = 'LAYOUT'
}

export enum TriggerType {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  EVENT = 'EVENT',
  BEHAVIOR = 'BEHAVIOR',
  API = 'API',
  WEBHOOK = 'WEBHOOK'
}

export enum ActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  SEND_WHATSAPP = 'SEND_WHATSAPP',
  WAIT = 'WAIT',
  CONDITION = 'CONDITION',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  ADD_TAG = 'ADD_TAG',
  REMOVE_TAG = 'REMOVE_TAG',
  WEBHOOK = 'WEBHOOK',
  API_CALL = 'API_CALL'
}

// Unified Campaigns Hook
export function useUnifiedCampaigns(query?: CampaignQueryDto) {
  const apiClient = useApiClient();
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/campaigns', {
        params: {
          page: query?.page || 1,
          limit: query?.limit || 10,
          search: query?.search,
          status: query?.status,
          channels: query?.channels,
          sortBy: query?.sortBy,
          sortOrder: query?.sortOrder
        }
      });

      if (response.success && response.data) {
        setCampaigns(response.data.campaigns || []);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } else {
        setError(response.error?.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, query]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (data: CreateUnifiedCampaignDto) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/campaigns', data);
      
      if (response.success && response.data) {
        await fetchCampaigns(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create campaign');
        throw new Error(response.error?.message || 'Failed to create campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchCampaigns]);

  const updateCampaign = useCallback(async (id: string, data: Partial<CreateUnifiedCampaignDto>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put(`/campaigns/${id}`, data);
      
      if (response.success && response.data) {
        await fetchCampaigns(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update campaign');
        throw new Error(response.error?.message || 'Failed to update campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchCampaigns]);

  const deleteCampaign = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete(`/campaigns/${id}`);
      
      if (response.success) {
        await fetchCampaigns(); // Refresh the list
        return true;
      } else {
        setError(response.error?.message || 'Failed to delete campaign');
        throw new Error(response.error?.message || 'Failed to delete campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchCampaigns]);

  const sendCampaign = useCallback(async (id: string, data?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/${id}/send`, data);
      
      if (response.success && response.data) {
        await fetchCampaigns(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to send campaign');
        throw new Error(response.error?.message || 'Failed to send campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchCampaigns]);

  const duplicateCampaign = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/${id}/duplicate`);
      
      if (response.success && response.data) {
        await fetchCampaigns(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to duplicate campaign');
        throw new Error(response.error?.message || 'Failed to duplicate campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchCampaigns]);

  const getCampaignAnalytics = useCallback(async (id: string, query?: CampaignAnalyticsQueryDto) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/campaigns/${id}/analytics`, {
        params: query
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to fetch analytics');
        throw new Error(response.error?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    campaigns,
    loading,
    error,
    pagination,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    duplicateCampaign,
    getCampaignAnalytics
  };
}

// A/B Testing Hook
export function useABTests(campaignId?: string) {
  const apiClient = useApiClient();
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchABTests = useCallback(async () => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/ab-tests`);
      
      if (response.success && response.data) {
        setAbTests(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch A/B tests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, campaignId]);

  useEffect(() => {
    fetchABTests();
  }, [fetchABTests]);

  const createABTest = useCallback(async (data: any) => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/ab-tests`, data);
      
      if (response.success && response.data) {
        await fetchABTests(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create A/B test');
        throw new Error(response.error?.message || 'Failed to create A/B test');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, campaignId, fetchABTests]);

  const startABTest = useCallback(async (abTestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/ab-tests/${abTestId}/start`);
      
      if (response.success && response.data) {
        await fetchABTests(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to start A/B test');
        throw new Error(response.error?.message || 'Failed to start A/B test');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchABTests]);

  const getABTestAnalytics = useCallback(async (abTestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/campaigns/ab-tests/${abTestId}/analytics`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to fetch A/B test analytics');
        throw new Error(response.error?.message || 'Failed to fetch A/B test analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    abTests,
    loading,
    error,
    fetchABTests,
    createABTest,
    startABTest,
    getABTestAnalytics
  };
}

// Workflows Hook
export function useWorkflows(campaignId?: string) {
  const apiClient = useApiClient();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/workflows`);
      
      if (response.success && response.data) {
        setWorkflows(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, campaignId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(async (data: any) => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/workflows`, data);
      
      if (response.success && response.data) {
        await fetchWorkflows(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create workflow');
        throw new Error(response.error?.message || 'Failed to create workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, campaignId, fetchWorkflows]);

  const executeWorkflow = useCallback(async (workflowId: string, data?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/campaigns/workflows/${workflowId}/execute`, data);
      
      if (response.success && response.data) {
        await fetchWorkflows(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to execute workflow');
        throw new Error(response.error?.message || 'Failed to execute workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchWorkflows]);

  const getWorkflowAnalytics = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/campaigns/workflows/${workflowId}/analytics`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to fetch workflow analytics');
        throw new Error(response.error?.message || 'Failed to fetch workflow analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    executeWorkflow,
    getWorkflowAnalytics
  };
}
