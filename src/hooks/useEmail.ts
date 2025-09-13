import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { EmailService } from '@/lib/api/services/email.service';
import {
  EmailCampaign,
  CreateEmailCampaignDto,
  UpdateEmailCampaignDto,
  EmailCampaignQueryDto,
  EmailCampaignListResponse,
  SendEmailCampaignDto,
  EmailCampaignAnalyticsDto,
  EmailCampaignAnalytics,
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateQueryDto,
  EmailTemplateListResponse,
  EmailProvider,
  CreateEmailProviderDto,
  UpdateEmailProviderDto,
  TestEmailProviderDto,
  TestEmailProviderResult,
  EmailActivity,
  UnsubscribeResult,
} from '@/lib/api/types/email';

interface UseEmailOptions {
  baseUrl?: string;
}

export function useEmail(options: UseEmailOptions = {}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailService = useMemo(() => {
    const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';
    return new EmailService(baseUrl);
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
      console.error('Email service error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== EMAIL CAMPAIGNS ====================

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  const createCampaign = useCallback(async (data: CreateEmailCampaignDto) => {
    return handleRequest(async () => {
      const campaign = await emailService.createCampaign(data);
      setCampaigns(prev => [campaign, ...prev]);
      return campaign;
    });
  }, [emailService, handleRequest]);

  const getCampaigns = useCallback(async (query?: EmailCampaignQueryDto) => {
    try {
      setCampaignsLoading(true);
      setCampaignsError(null);
      const response = await emailService.getCampaigns(query);
      setCampaigns(response.campaigns);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setCampaignsError(errorMessage);
      throw err;
    } finally {
      setCampaignsLoading(false);
    }
  }, [emailService]);

  const getCampaignById = useCallback(async (id: string) => {
    return handleRequest(() => emailService.getCampaignById(id));
  }, [emailService, handleRequest]);

  const updateCampaign = useCallback(async (id: string, data: UpdateEmailCampaignDto) => {
    return handleRequest(async () => {
      const campaign = await emailService.updateCampaign(id, data);
      setCampaigns(prev => prev.map(c => c.id === id ? campaign : c));
      return campaign;
    });
  }, [emailService, handleRequest]);

  const deleteCampaign = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await emailService.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    });
  }, [emailService, handleRequest]);

  const sendCampaign = useCallback(async (id: string, data: SendEmailCampaignDto) => {
    return handleRequest(() => emailService.sendCampaign(id, data));
  }, [emailService, handleRequest]);

  const getCampaignAnalytics = useCallback(async (
    id: string,
    query?: EmailCampaignAnalyticsDto
  ) => {
    return handleRequest(() => emailService.getCampaignAnalytics(id, query));
  }, [emailService, handleRequest]);

  // ==================== EMAIL TEMPLATES ====================

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const createTemplate = useCallback(async (data: CreateEmailTemplateDto) => {
    return handleRequest(async () => {
      const template = await emailService.createTemplate(data);
      setTemplates(prev => [template, ...prev]);
      return template;
    });
  }, [emailService, handleRequest]);

  const getTemplates = useCallback(async (query?: EmailTemplateQueryDto) => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const response = await emailService.getTemplates(query);
      setTemplates(response.templates);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setTemplatesError(errorMessage);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, [emailService]);

  const getTemplateById = useCallback(async (id: string) => {
    return handleRequest(() => emailService.getTemplateById(id));
  }, [emailService, handleRequest]);

  const updateTemplate = useCallback(async (id: string, data: UpdateEmailTemplateDto) => {
    return handleRequest(async () => {
      const template = await emailService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? template : t));
      return template;
    });
  }, [emailService, handleRequest]);

  const deleteTemplate = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await emailService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    });
  }, [emailService, handleRequest]);

  // ==================== EMAIL PROVIDERS ====================

  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const createProvider = useCallback(async (data: CreateEmailProviderDto) => {
    return handleRequest(async () => {
      const provider = await emailService.createProvider(data);
      setProviders(prev => [provider, ...prev]);
      return provider;
    });
  }, [emailService, handleRequest]);

  const getProviders = useCallback(async () => {
    try {
      setProvidersLoading(true);
      setProvidersError(null);
      const providers = await emailService.getProviders();
      setProviders(providers);
      return providers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      setProvidersError(errorMessage);
      throw err;
    } finally {
      setProvidersLoading(false);
    }
  }, [emailService]);

  const getProviderById = useCallback(async (id: string) => {
    return handleRequest(() => emailService.getProviderById(id));
  }, [emailService, handleRequest]);

  const updateProvider = useCallback(async (id: string, data: UpdateEmailProviderDto) => {
    return handleRequest(async () => {
      const provider = await emailService.updateProvider(id, data);
      setProviders(prev => prev.map(p => p.id === id ? provider : p));
      return provider;
    });
  }, [emailService, handleRequest]);

  const deleteProvider = useCallback(async (id: string) => {
    return handleRequest(async () => {
      await emailService.deleteProvider(id);
      setProviders(prev => prev.filter(p => p.id !== id));
    });
  }, [emailService, handleRequest]);

  const testProvider = useCallback(async (id: string, data: TestEmailProviderDto) => {
    return handleRequest(() => emailService.testProvider(id, data));
  }, [emailService, handleRequest]);

  // ==================== EMAIL TRACKING ====================

  const trackActivity = useCallback(async (
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ) => {
    return handleRequest(() => emailService.trackActivity(campaignId, contactId, type, metadata));
  }, [emailService, handleRequest]);

  const unsubscribeContact = useCallback(async (contactId: string, campaignId?: string) => {
    return handleRequest(() => emailService.unsubscribeContact(contactId, campaignId));
  }, [emailService, handleRequest]);

  // ==================== UTILITY FUNCTIONS ====================

  const refresh = useCallback(async () => {
    await Promise.all([
      getCampaigns(),
      getTemplates(),
      getProviders(),
    ]);
  }, [getCampaigns, getTemplates, getProviders]);

  const clearError = useCallback(() => {
    setError(null);
    setCampaignsError(null);
    setTemplatesError(null);
    setProvidersError(null);
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

    // Utilities
    refresh,
  };
}
