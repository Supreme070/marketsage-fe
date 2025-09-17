'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getWhatsAppCampaigns, 
  getWhatsAppCampaignById, 
  getWhatsAppTemplates, 
  getWhatsAppTemplateById,
  sendWhatsAppCampaign,
  scheduleWhatsAppCampaign,
  cancelScheduledWhatsAppCampaign
} from '@/lib/api';
import toast from 'react-hot-toast';

export interface WhatsAppCampaign {
  id: string;
  name: string;
  description?: string;
  from: string;
  content?: string;
  templateId?: string;
  messageType: 'text' | 'template' | 'image' | 'document' | 'video' | 'audio' | 'location' | 'contact' | 'interactive';
  mediaData?: {
    type: 'image' | 'document' | 'video' | 'audio';
    url: string;
    filename?: string;
    caption?: string;
  };
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  template?: {
    id: string;
    name: string;
    content: string;
  };
  lists: Array<{
    id: string;
    name: string;
  }>;
  segments: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    activities: number;
  };
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables?: string[];
  category?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  templateName?: string;
  language?: string;
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    text?: string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    campaigns: number;
  };
}

export interface WhatsAppProvider {
  id: string;
  provider: 'meta' | 'twilio' | 'infobip';
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookUrl: string;
  verifyToken: string;
  phoneNumber?: string;
  displayName?: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
  };
}

export interface WhatsAppAnalytics {
  campaign: {
    id: string;
    name: string;
    from: string;
    status: string;
    sentAt?: string;
  };
  analytics: {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    totalBounced: number;
    totalUnsubscribed: number;
    deliveryRate: number;
    readRate: number;
    failureRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  activities: Array<{
    id: string;
    type: string;
    timestamp: string;
    metadata?: string;
    contact: {
      id: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

export const useWhatsApp = () => {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [providers, setProviders] = useState<WhatsAppProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const campaignsData = await getWhatsAppCampaigns();
      setCampaigns(campaignsData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaigns';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const templatesData = await getWhatsAppTemplates();
      setTemplates(templatesData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load providers
  const loadProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v2/whatsapp/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const providersData = await response.json();
      setProviders(providersData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load providers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create campaign
  const createCampaign = useCallback(async (campaignData: Partial<WhatsAppCampaign>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v2/whatsapp/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      const newCampaign = await response.json();
      setCampaigns(prev => [newCampaign, ...prev]);
      toast.success('Campaign created successfully');
      return newCampaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update campaign
  const updateCampaign = useCallback(async (id: string, campaignData: Partial<WhatsAppCampaign>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update campaign');
      }

      const updatedCampaign = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updatedCampaign : c));
      toast.success('Campaign updated successfully');
      return updatedCampaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete campaign
  const deleteCampaign = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete campaign');
      }

      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success('Campaign deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete campaign';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Duplicate campaign
  const duplicateCampaign = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to duplicate campaign');
      }

      const result = await response.json();
      setCampaigns(prev => [result.duplicatedCampaign, ...prev]);
      toast.success('Campaign duplicated successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate campaign';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send campaign
  const sendCampaign = useCallback(async (id: string, scheduledFor?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduledFor }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send campaign');
      }

      const result = await response.json();
      
      // Update campaign status
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'SENDING' as const } : c
      ));
      
      toast.success(result.message || 'Campaign sent successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send campaign';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get campaign analytics
  const getCampaignAnalytics = useCallback(async (id: string, startDate?: string, endDate?: string): Promise<WhatsAppAnalytics> => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/analytics?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Create template
  const createTemplate = useCallback(async (templateData: Partial<WhatsAppTemplate>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/v2/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create template');
      }

      const newTemplate = await response.json();
      setTemplates(prev => [newTemplate, ...prev]);
      toast.success('Template created successfully');
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit template for approval
  const submitTemplate = useCallback(async (id: string, notes?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/v2/whatsapp/templates/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: id, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit template');
      }

      const result = await response.json();
      toast.success('Template submitted for approval');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit template';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    loadCampaigns();
    loadTemplates();
    loadProviders();
  }, [loadCampaigns, loadTemplates, loadProviders]);

  return {
    // Data
    campaigns,
    templates,
    providers,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    loadCampaigns,
    loadTemplates,
    loadProviders,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    sendCampaign,
    getCampaignAnalytics,
    createTemplate,
    submitTemplate,
    
    // Utilities
    refreshData: () => {
      loadCampaigns();
      loadTemplates();
      loadProviders();
    },
  };
};



