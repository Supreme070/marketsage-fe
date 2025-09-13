/**
 * LeadPulse API Hook
 * 
 * This hook uses the new LeadPulse service to interact with the backend API
 * with proper authentication and API key management for public endpoints.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import type {
  LeadPulseForm,
  CreateFormDto,
  UpdateFormDto,
  FormQueryDto,
  LeadPulseFormSubmission,
  FormSubmissionDto,
  SubmissionQueryDto,
  LeadPulseVisitor,
  CreateVisitorDto,
  VisitorQueryDto,
  LeadPulseTouchpoint,
  CreateTouchpointDto,
  LeadPulseInsight,
  CreateInsightDto,
  InsightQueryDto,
  GenerateInsightDto,
  LeadPulseAnalytics,
  LeadPulseApiKey,
  CreateApiKeyDto,
  UpdateApiKeyDto,
} from '@/lib/api/types/leadpulse';

interface UseLeadPulseOptions {
  apiKey?: string;
  domain?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseLeadPulseReturn {
  // Forms
  forms: LeadPulseForm[];
  formsLoading: boolean;
  formsError: string | null;
  createForm: (data: CreateFormDto) => Promise<LeadPulseForm>;
  updateForm: (id: string, data: UpdateFormDto) => Promise<LeadPulseForm>;
  deleteForm: (id: string) => Promise<void>;
  getForm: (id: string) => Promise<LeadPulseForm>;
  getForms: (options?: FormQueryDto) => Promise<void>;

  // Submissions
  submissions: LeadPulseFormSubmission[];
  submissionsLoading: boolean;
  submissionsError: string | null;
  submitForm: (data: FormSubmissionDto) => Promise<LeadPulseFormSubmission>;
  getSubmissions: (options?: SubmissionQueryDto) => Promise<void>;
  getSubmission: (id: string) => Promise<LeadPulseFormSubmission>;

  // Visitors
  visitors: LeadPulseVisitor[];
  visitorsLoading: boolean;
  visitorsError: string | null;
  createVisitor: (data: CreateVisitorDto) => Promise<LeadPulseVisitor>;
  getVisitors: (options?: VisitorQueryDto) => Promise<void>;
  getVisitor: (id: string) => Promise<LeadPulseVisitor>;

  // Touchpoints
  touchpoints: LeadPulseTouchpoint[];
  touchpointsLoading: boolean;
  touchpointsError: string | null;
  createTouchpoint: (data: CreateTouchpointDto) => Promise<LeadPulseTouchpoint>;
  getTouchpointsByVisitor: (visitorId: string) => Promise<void>;

  // Insights
  insights: LeadPulseInsight[];
  insightsLoading: boolean;
  insightsError: string | null;
  createInsight: (data: CreateInsightDto) => Promise<LeadPulseInsight>;
  generateInsight: (data: GenerateInsightDto) => Promise<LeadPulseInsight>;
  deleteInsight: (id: string) => Promise<void>;
  getInsights: (options?: InsightQueryDto) => Promise<void>;

  // Analytics
  analytics: LeadPulseAnalytics | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  getAnalytics: () => Promise<void>;
  getFormAnalytics: (formId: string) => Promise<any>;

  // API Keys
  apiKeys: LeadPulseApiKey[];
  apiKeysLoading: boolean;
  apiKeysError: string | null;
  createApiKey: (data: CreateApiKeyDto) => Promise<LeadPulseApiKey>;
  updateApiKey: (id: string, data: UpdateApiKeyDto) => Promise<LeadPulseApiKey>;
  deleteApiKey: (id: string) => Promise<void>;
  getApiKeys: () => Promise<void>;

  // Utility methods
  configurePublicAccess: (apiKey: string, domain: string) => void;
  clearPublicAccess: () => void;
  refresh: () => Promise<void>;
}

export function useLeadPulse(options: UseLeadPulseOptions = {}): UseLeadPulseReturn {
  const { data: session } = useSession();
  const { apiKey, domain, autoRefresh = false, refreshInterval = 30000 } = options;

  // State for forms
  const [forms, setForms] = useState<LeadPulseForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);

  // State for submissions
  const [submissions, setSubmissions] = useState<LeadPulseFormSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  // State for visitors
  const [visitors, setVisitors] = useState<LeadPulseVisitor[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsError, setVisitorsError] = useState<string | null>(null);

  // State for touchpoints
  const [touchpoints, setTouchpoints] = useState<LeadPulseTouchpoint[]>([]);
  const [touchpointsLoading, setTouchpointsLoading] = useState(false);
  const [touchpointsError, setTouchpointsError] = useState<string | null>(null);

  // State for insights
  const [insights, setInsights] = useState<LeadPulseInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // State for analytics
  const [analytics, setAnalytics] = useState<LeadPulseAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // State for API keys
  const [apiKeys, setApiKeys] = useState<LeadPulseApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);

  // Configure public access for API key endpoints
  useEffect(() => {
    if (apiKey && domain) {
      apiClient.leadpulse.configurePublicAccess(apiKey, domain);
    }
  }, [apiKey, domain]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !session) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, session]);

  // Forms methods
  const createForm = useCallback(async (data: CreateFormDto): Promise<LeadPulseForm> => {
    try {
      setFormsLoading(true);
      setFormsError(null);
      const form = await apiClient.leadpulse.createForm(data);
      setForms(prev => [form, ...prev]);
      return form;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create form';
      setFormsError(errorMessage);
      throw error;
    } finally {
      setFormsLoading(false);
    }
  }, []);

  const updateForm = useCallback(async (id: string, data: UpdateFormDto): Promise<LeadPulseForm> => {
    try {
      setFormsLoading(true);
      setFormsError(null);
      const form = await apiClient.leadpulse.updateForm(id, data);
      setForms(prev => prev.map(f => f.id === id ? form : f));
      return form;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update form';
      setFormsError(errorMessage);
      throw error;
    } finally {
      setFormsLoading(false);
    }
  }, []);

  const deleteForm = useCallback(async (id: string): Promise<void> => {
    try {
      setFormsLoading(true);
      setFormsError(null);
      await apiClient.leadpulse.deleteForm(id);
      setForms(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete form';
      setFormsError(errorMessage);
      throw error;
    } finally {
      setFormsLoading(false);
    }
  }, []);

  const getForm = useCallback(async (id: string): Promise<LeadPulseForm> => {
    try {
      setFormsLoading(true);
      setFormsError(null);
      return await apiClient.leadpulse.getFormById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get form';
      setFormsError(errorMessage);
      throw error;
    } finally {
      setFormsLoading(false);
    }
  }, []);

  const getForms = useCallback(async (options?: FormQueryDto): Promise<void> => {
    try {
      setFormsLoading(true);
      setFormsError(null);
      const response = await apiClient.leadpulse.getForms(options);
      setForms(response.forms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get forms';
      setFormsError(errorMessage);
    } finally {
      setFormsLoading(false);
    }
  }, []);

  // Submissions methods
  const submitForm = useCallback(async (data: FormSubmissionDto): Promise<LeadPulseFormSubmission> => {
    try {
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      const submission = await apiClient.leadpulse.submitForm(data);
      setSubmissions(prev => [submission, ...prev]);
      return submission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      setSubmissionsError(errorMessage);
      throw error;
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  const getSubmissions = useCallback(async (options?: SubmissionQueryDto): Promise<void> => {
    try {
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      const response = await apiClient.leadpulse.getSubmissions(options);
      setSubmissions(response.submissions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get submissions';
      setSubmissionsError(errorMessage);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  const getSubmission = useCallback(async (id: string): Promise<LeadPulseFormSubmission> => {
    try {
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      return await apiClient.leadpulse.getSubmissionById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get submission';
      setSubmissionsError(errorMessage);
      throw error;
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  // Visitors methods
  const createVisitor = useCallback(async (data: CreateVisitorDto): Promise<LeadPulseVisitor> => {
    try {
      setVisitorsLoading(true);
      setVisitorsError(null);
      const visitor = await apiClient.leadpulse.createVisitor(data);
      setVisitors(prev => [visitor, ...prev]);
      return visitor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create visitor';
      setVisitorsError(errorMessage);
      throw error;
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  const getVisitors = useCallback(async (options?: VisitorQueryDto): Promise<void> => {
    try {
      setVisitorsLoading(true);
      setVisitorsError(null);
      const response = await apiClient.leadpulse.getVisitors(options);
      setVisitors(response.visitors);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get visitors';
      setVisitorsError(errorMessage);
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  const getVisitor = useCallback(async (id: string): Promise<LeadPulseVisitor> => {
    try {
      setVisitorsLoading(true);
      setVisitorsError(null);
      return await apiClient.leadpulse.getVisitorById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get visitor';
      setVisitorsError(errorMessage);
      throw error;
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  // Touchpoints methods
  const createTouchpoint = useCallback(async (data: CreateTouchpointDto): Promise<LeadPulseTouchpoint> => {
    try {
      setTouchpointsLoading(true);
      setTouchpointsError(null);
      const touchpoint = await apiClient.leadpulse.createTouchpoint(data);
      setTouchpoints(prev => [touchpoint, ...prev]);
      return touchpoint;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create touchpoint';
      setTouchpointsError(errorMessage);
      throw error;
    } finally {
      setTouchpointsLoading(false);
    }
  }, []);

  const getTouchpointsByVisitor = useCallback(async (visitorId: string): Promise<void> => {
    try {
      setTouchpointsLoading(true);
      setTouchpointsError(null);
      const touchpoints = await apiClient.leadpulse.getTouchpointsByVisitor(visitorId);
      setTouchpoints(touchpoints);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get touchpoints';
      setTouchpointsError(errorMessage);
    } finally {
      setTouchpointsLoading(false);
    }
  }, []);

  // Insights methods
  const createInsight = useCallback(async (data: CreateInsightDto): Promise<LeadPulseInsight> => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const insight = await apiClient.leadpulse.createInsight(data);
      setInsights(prev => [insight, ...prev]);
      return insight;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create insight';
      setInsightsError(errorMessage);
      throw error;
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const generateInsight = useCallback(async (data: GenerateInsightDto): Promise<LeadPulseInsight> => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const insight = await apiClient.leadpulse.generateInsight(data);
      setInsights(prev => [insight, ...prev]);
      return insight;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate insight';
      setInsightsError(errorMessage);
      throw error;
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const deleteInsight = useCallback(async (id: string): Promise<void> => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      await apiClient.leadpulse.deleteInsight(id);
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete insight';
      setInsightsError(errorMessage);
      throw error;
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const getInsights = useCallback(async (options?: InsightQueryDto): Promise<void> => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const response = await apiClient.leadpulse.getInsights(options);
      setInsights(response.insights);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get insights';
      setInsightsError(errorMessage);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Analytics methods
  const getAnalytics = useCallback(async (): Promise<void> => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const analyticsData = await apiClient.leadpulse.getAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get analytics';
      setAnalyticsError(errorMessage);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const getFormAnalytics = useCallback(async (formId: string): Promise<any> => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      return await apiClient.leadpulse.getFormAnalytics(formId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get form analytics';
      setAnalyticsError(errorMessage);
      throw error;
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // API Keys methods
  const createApiKey = useCallback(async (data: CreateApiKeyDto): Promise<LeadPulseApiKey> => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      const apiKey = await apiClient.leadpulse.createApiKey(data);
      setApiKeys(prev => [apiKey, ...prev]);
      return apiKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
      setApiKeysError(errorMessage);
      throw error;
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  const updateApiKey = useCallback(async (id: string, data: UpdateApiKeyDto): Promise<LeadPulseApiKey> => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      const apiKey = await apiClient.leadpulse.updateApiKey(id, data);
      setApiKeys(prev => prev.map(k => k.id === id ? apiKey : k));
      return apiKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update API key';
      setApiKeysError(errorMessage);
      throw error;
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (id: string): Promise<void> => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      await apiClient.leadpulse.deleteApiKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
      setApiKeysError(errorMessage);
      throw error;
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  const getApiKeys = useCallback(async (): Promise<void> => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      const keys = await apiClient.leadpulse.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get API keys';
      setApiKeysError(errorMessage);
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  // Utility methods
  const configurePublicAccess = useCallback((apiKey: string, domain: string) => {
    apiClient.leadpulse.configurePublicAccess(apiKey, domain);
  }, []);

  const clearPublicAccess = useCallback(() => {
    apiClient.leadpulse.clearPublicAccess();
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    
    try {
      await Promise.all([
        getForms(),
        getSubmissions(),
        getVisitors(),
        getInsights(),
        getAnalytics(),
        getApiKeys(),
      ]);
    } catch (error) {
      console.error('Failed to refresh LeadPulse data:', error);
    }
  }, [session, getForms, getSubmissions, getVisitors, getInsights, getAnalytics, getApiKeys]);

  return {
    // Forms
    forms,
    formsLoading,
    formsError,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    getForms,

    // Submissions
    submissions,
    submissionsLoading,
    submissionsError,
    submitForm,
    getSubmissions,
    getSubmission,

    // Visitors
    visitors,
    visitorsLoading,
    visitorsError,
    createVisitor,
    getVisitors,
    getVisitor,

    // Touchpoints
    touchpoints,
    touchpointsLoading,
    touchpointsError,
    createTouchpoint,
    getTouchpointsByVisitor,

    // Insights
    insights,
    insightsLoading,
    insightsError,
    createInsight,
    generateInsight,
    deleteInsight,
    getInsights,

    // Analytics
    analytics,
    analyticsLoading,
    analyticsError,
    getAnalytics,
    getFormAnalytics,

    // API Keys
    apiKeys,
    apiKeysLoading,
    apiKeysError,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    getApiKeys,

    // Utility methods
    configurePublicAccess,
    clearPublicAccess,
    refresh,
  };
}
