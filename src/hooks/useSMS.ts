import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { SMSService } from '@/lib/api/services/sms.service';
import {
  SMSCampaign,
  CreateSMSCampaignDto,
  UpdateSMSCampaignDto,
  SMSCampaignQueryDto,
  SMSCampaignListResponse,
  SendSMSCampaignDto,
  SMSCampaignAnalyticsDto,
  SMSCampaignAnalytics,
  SMSTemplate,
  CreateSMSTemplateDto,
  UpdateSMSTemplateDto,
  SMSTemplateQueryDto,
  SMSTemplateListResponse,
  SMSProvider,
  CreateSMSProviderDto,
  UpdateSMSProviderDto,
  TestSMSProviderDto,
  TestSMSProviderResult,
  SMSActivity,
  SMSHistory,
  UnsubscribeResult,
} from '@/lib/api/types/sms';

interface UseSMSOptions {
  baseUrl?: string;
}

export function useSMS(options: UseSMSOptions = {}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smsService = useMemo(() => {
    const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';
    return new SMSService(baseUrl);
  }, [options.baseUrl]);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await requestFn();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('SMS service error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== SMS CAMPAIGNS ====================

  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  const createCampaign = useCallback(async (data: CreateSMSCampaignDto) => {
    return handleRequest(async () => {
      const campaign = await smsService.createCampaign(data);
      setCampaigns(prev => [campaign, ...prev]);
      return campaign;
    });
  }, [smsService, handleRequest]);

  const getCampaigns = useCallback(async (query?: SMSCampaignQueryDto) => {
    try {
      setCampaignsLoading(true);
      setCampaignsError(null);
      const response = await smsService.getCampaigns(query);
      setCampaigns(response.campaigns);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setCampaignsError(errorMessage);
      throw err;
    } finally {
      setCampaignsLoading(false);
    }
  }, [smsService]);

  const getCampaignById = useCallback(async (id: string) => {
    return handleRequest(() => smsService.getCampaignById(id));
  }, [smsService, handleRequest]);

  const updateCampaign = useCallback(async (id: string, data: UpdateSMSCampaignDto) => {
    return handleRequest(async () => {
      const campaign = await smsService.updateCampaign(id, data);
      setCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      return campaign;
    });
  }, [smsService, handleRequest]);

  const deleteCampaign = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await smsService.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    });
  }, [smsService, handleRequest]);

  const sendCampaign = useCallback(async (id: string, data: SendSMSCampaignDto) => {
    return handleRequest(() => smsService.sendCampaign(id, data));
  }, [smsService, handleRequest]);

  const getCampaignAnalytics = useCallback(async (
    id: string,
    query?: SMSCampaignAnalyticsDto
  ) => {
    return handleRequest(() => smsService.getCampaignAnalytics(id, query));
  }, [smsService, handleRequest]);

  // ==================== SMS TEMPLATES ====================

  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const createTemplate = useCallback(async (data: CreateSMSTemplateDto) => {
    return handleRequest(async () => {
      const template = await smsService.createTemplate(data);
      setTemplates(prev => [template, ...prev]);
      return template;
    });
  }, [smsService, handleRequest]);

  const getTemplates = useCallback(async (query?: SMSTemplateQueryDto) => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const response = await smsService.getTemplates(query);
      setTemplates(response.templates);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setTemplatesError(errorMessage);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, [smsService]);

  const getTemplateById = useCallback(async (id: string) => {
    return handleRequest(() => smsService.getTemplateById(id));
  }, [smsService, handleRequest]);

  const updateTemplate = useCallback(async (id: string, data: UpdateSMSTemplateDto) => {
    return handleRequest(async () => {
      const template = await smsService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? template : t));
      return template;
    });
  }, [smsService, handleRequest]);

  const deleteTemplate = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await smsService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    });
  }, [smsService, handleRequest]);

  // ==================== SMS PROVIDERS ====================

  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const createProvider = useCallback(async (data: CreateSMSProviderDto) => {
    return handleRequest(async () => {
      const provider = await smsService.createProvider(data);
      setProviders(prev => [provider, ...prev]);
      return provider;
    });
  }, [smsService, handleRequest]);

  const getProviders = useCallback(async () => {
    try {
      setProvidersLoading(true);
      setProvidersError(null);
      const providers = await smsService.getProviders();
      setProviders(providers);
      return providers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      setProvidersError(errorMessage);
      throw err;
    } finally {
      setProvidersLoading(false);
    }
  }, [smsService]);

  const getProviderById = useCallback(async (id: string) => {
    return handleRequest(() => smsService.getProviderById(id));
  }, [smsService, handleRequest]);

  const updateProvider = useCallback(async (id: string, data: UpdateSMSProviderDto) => {
    return handleRequest(async () => {
      const provider = await smsService.updateProvider(id, data);
      setProviders(prev => prev.map(p => p.id === id ? provider : p));
      return provider;
    });
  }, [smsService, handleRequest]);

  const deleteProvider = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await smsService.deleteProvider(id);
      setProviders(prev => prev.filter(p => p.id !== id));
    });
  }, [smsService, handleRequest]);

  const testProvider = useCallback(async (id: string, data: TestSMSProviderDto) => {
    return handleRequest(() => smsService.testProvider(id, data));
  }, [smsService, handleRequest]);

  // ==================== SMS TRACKING ====================

  const trackActivity = useCallback(async (
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ) => {
    return handleRequest(() => smsService.trackActivity(campaignId, contactId, type, metadata));
  }, [smsService, handleRequest]);

  const unsubscribeContact = useCallback(async (contactId: string, campaignId?: string) => {
    return handleRequest(() => smsService.unsubscribeContact(contactId, campaignId));
  }, [smsService, handleRequest]);

  // ==================== SMS HISTORY ====================

  const [history, setHistory] = useState<SMSHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const getSMSHistory = useCallback(async (query?: {
    page?: number;
    limit?: number;
    status?: string;
    contactId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const response = await smsService.getSMSHistory(query);
      setHistory(response.history);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SMS history';
      setHistoryError(errorMessage);
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  }, [smsService]);

  const getSMSHistoryById = useCallback(async (id: string) => {
    return handleRequest(() => smsService.getSMSHistoryById(id));
  }, [smsService, handleRequest]);

  // ==================== UTILITY FUNCTIONS ====================

  const refresh = useCallback(async () => {
    await Promise.all([
      getCampaigns(),
      getTemplates(),
      getProviders(),
      getSMSHistory(),
    ]);
  }, [getCampaigns, getTemplates, getProviders, getSMSHistory]);

  const clearError = useCallback(() => {
    setError(null);
    setCampaignsError(null);
    setTemplatesError(null);
    setProvidersError(null);
    setHistoryError(null);
  }, []);

  return {
    // General state
    loading,
    error,
    clearError,

    // Campaigns
    campaigns,
    campaignsLoading,
    campaignsError,
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    getCampaignAnalytics,

    // Templates
    templates,
    templatesLoading,
    templatesError,
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,

    // Providers
    providers,
    providersLoading,
    providersError,
    createProvider,
    getProviders,
    getProviderById,
    updateProvider,
    deleteProvider,
    testProvider,

    // Tracking
    trackActivity,
    unsubscribeContact,

    // History
    history,
    historyLoading,
    historyError,
    getSMSHistory,
    getSMSHistoryById,

    // Utilities
    refresh,
  };
}
