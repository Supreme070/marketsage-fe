/**
 * Unified API Hooks
 * Simple hooks for using the unified API client with loading states
 */

import { useState, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api/client';

// Generic hook for API operations
export function useApiOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <R = T>(
    operation: () => Promise<R>
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      const errorMessage = err instanceof ApiClientError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'An error occurred';
      setError(errorMessage);
      console.error('API operation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
}

// SMS Hooks
export function useSMS() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    // Campaigns
    createCampaign: useCallback((data: any) => execute(() => apiClient.post('/sms/campaigns', data)), [execute]),
    getCampaigns: useCallback((query?: any) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const endpoint = query ? `/sms/campaigns?${params.toString()}` : '/sms/campaigns';
      return execute(() => apiClient.get(endpoint));
    }, [execute]),
    getCampaignById: useCallback((id: string) => execute(() => apiClient.get(`/sms/campaigns/${id}`)), [execute]),
    updateCampaign: useCallback((id: string, data: any) => execute(() => apiClient.put(`/sms/campaigns/${id}`, data)), [execute]),
    deleteCampaign: useCallback((id: string) => execute(() => apiClient.delete(`/sms/campaigns/${id}`)), [execute]),
    sendCampaign: useCallback((id: string, data: any) => execute(() => apiClient.post(`/sms/campaigns/${id}/send`, data)), [execute]),
    getCampaignAnalytics: useCallback((id: string, query?: any) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const endpoint = query ? `/sms/campaigns/${id}/analytics?${params.toString()}` : `/sms/campaigns/${id}/analytics`;
      return execute(() => apiClient.get(endpoint));
    }, [execute]),
    
    // Templates
    createTemplate: useCallback((data: any) => execute(() => apiClient.post('/sms/templates', data)), [execute]),
    getTemplates: useCallback((query?: any) => execute(() => apiClient.get('/sms/templates', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getTemplateById: useCallback((id: string) => execute(() => apiClient.get(`/sms/templates/${id}`)), [execute]),
    updateTemplate: useCallback((id: string, data: any) => execute(() => apiClient.put(`/sms/templates/${id}`, data)), [execute]),
    deleteTemplate: useCallback((id: string) => execute(() => apiClient.delete(`/sms/templates/${id}`)), [execute]),
    
    // Providers
    createProvider: useCallback((data: any) => execute(() => apiClient.post('/sms/providers', data)), [execute]),
    getProviders: useCallback(() => execute(() => apiClient.get('/sms/providers')), [execute]),
    getProviderById: useCallback((id: string) => execute(() => apiClient.get(`/sms/providers/${id}`)), [execute]),
    updateProvider: useCallback((id: string, data: any) => execute(() => apiClient.put(`/sms/providers/${id}`, data)), [execute]),
    deleteProvider: useCallback((id: string) => execute(() => apiClient.delete(`/sms/providers/${id}`)), [execute]),
    testProvider: useCallback((id: string, data: any) => execute(() => apiClient.post(`/sms/providers/${id}/test`, data)), [execute]),
    
    // Tracking
    trackActivity: useCallback((campaignId: string, contactId: string, type: string, metadata?: any) => 
      execute(() => apiClient.post(`/sms/campaigns/${campaignId}/track`, { contactId, type, metadata })), [execute]),
    unsubscribeContact: useCallback((contactId: string, campaignId?: string) => 
      execute(() => apiClient.post(`/sms/unsubscribe`, { contactId, campaignId })), [execute]),
    
    // History
    getSMSHistory: useCallback((query?: any) => execute(() => apiClient.get('/sms/history', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getSMSHistoryById: useCallback((id: string) => execute(() => apiClient.get(`/sms/history/${id}`)), [execute]),
  };
}

// Email Hooks
export function useEmail() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    // Campaigns
    createCampaign: useCallback((data: any) => execute(() => apiClient.post('/email/campaigns', data)), [execute]),
    getCampaigns: useCallback((query?: any) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const endpoint = query ? `/email/campaigns?${params.toString()}` : '/email/campaigns';
      return execute(() => apiClient.get(endpoint));
    }, [execute]),
    getCampaignById: useCallback((id: string) => execute(() => apiClient.get(`/email/campaigns/${id}`)), [execute]),
    updateCampaign: useCallback((id: string, data: any) => execute(() => apiClient.put(`/email/campaigns/${id}`, data)), [execute]),
    deleteCampaign: useCallback((id: string) => execute(() => apiClient.delete(`/email/campaigns/${id}`)), [execute]),
    sendCampaign: useCallback((id: string, data: any) => execute(() => apiClient.post(`/email/campaigns/${id}/send`, data)), [execute]),
    getCampaignAnalytics: useCallback((id: string, query?: any) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const endpoint = query ? `/email/campaigns/${id}/analytics?${params.toString()}` : `/email/campaigns/${id}/analytics`;
      return execute(() => apiClient.get(endpoint));
    }, [execute]),
    
    // Templates
    createTemplate: useCallback((data: any) => execute(() => apiClient.post('/email/templates', data)), [execute]),
    getTemplates: useCallback((query?: any) => execute(() => apiClient.get('/email/templates', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getTemplateById: useCallback((id: string) => execute(() => apiClient.get(`/email/templates/${id}`)), [execute]),
    updateTemplate: useCallback((id: string, data: any) => execute(() => apiClient.put(`/email/templates/${id}`, data)), [execute]),
    deleteTemplate: useCallback((id: string) => execute(() => apiClient.delete(`/email/templates/${id}`)), [execute]),
    
    // Providers
    createProvider: useCallback((data: any) => execute(() => apiClient.post('/email/providers', data)), [execute]),
    getProviders: useCallback(() => execute(() => apiClient.get('/email/providers')), [execute]),
    getProviderById: useCallback((id: string) => execute(() => apiClient.get(`/email/providers/${id}`)), [execute]),
    updateProvider: useCallback((id: string, data: any) => execute(() => apiClient.put(`/email/providers/${id}`, data)), [execute]),
    deleteProvider: useCallback((id: string) => execute(() => apiClient.delete(`/email/providers/${id}`)), [execute]),
    testProvider: useCallback((id: string, data: any) => execute(() => apiClient.post(`/email/providers/${id}/test`, data)), [execute]),
    
    // Tracking
    trackActivity: useCallback((campaignId: string, contactId: string, type: string, metadata?: any) => 
      execute(() => apiClient.post(`/email/campaigns/${campaignId}/track`, { contactId, type, metadata })), [execute]),
    unsubscribeContact: useCallback((contactId: string, campaignId?: string) => 
      execute(() => apiClient.post(`/email/unsubscribe`, { contactId, campaignId })), [execute]),
    
    // History
    getEmailHistory: useCallback((query?: any) => execute(() => apiClient.get('/email/history', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getEmailHistoryById: useCallback((id: string) => execute(() => apiClient.get(`/email/history/${id}`)), [execute]),
  };
}

// Contact Hooks
export function useContacts() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    createContact: useCallback((data: any) => execute(() => apiClient.post('/contacts', data)), [execute]),
    getContacts: useCallback((query?: any) => execute(() => apiClient.get('/contacts', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getContactById: useCallback((id: string) => execute(() => apiClient.get(`/contacts/${id}`)), [execute]),
    updateContact: useCallback((id: string, data: any) => execute(() => apiClient.put(`/contacts/${id}`, data)), [execute]),
    deleteContact: useCallback((id: string) => execute(() => apiClient.delete(`/contacts/${id}`)), [execute]),
  };
}

// Workflow Hooks
export function useWorkflows() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    createWorkflow: useCallback((data: any) => execute(() => apiClient.post('/workflows', data)), [execute]),
    getWorkflows: useCallback((query?: any) => execute(() => apiClient.get('/workflows', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getWorkflowById: useCallback((id: string) => execute(() => apiClient.get(`/workflows/${id}`)), [execute]),
    updateWorkflow: useCallback((id: string, data: any) => execute(() => apiClient.put(`/workflows/${id}`, data)), [execute]),
    deleteWorkflow: useCallback((id: string) => execute(() => apiClient.delete(`/workflows/${id}`)), [execute]),
  };
}

// User Hooks
export function useUsers() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    createUser: useCallback((data: any) => execute(() => apiClient.post('/users', data)), [execute]),
    getUsers: useCallback((query?: any) => execute(() => apiClient.get('/users', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getUserById: useCallback((id: string) => execute(() => apiClient.get(`/users/${id}`)), [execute]),
    updateUser: useCallback((id: string, data: any) => execute(() => apiClient.put(`/users/${id}`, data)), [execute]),
    deleteUser: useCallback((id: string) => execute(() => apiClient.delete(`/users/${id}`)), [execute]),
  };
}

// Organization Hooks
export function useOrganizations() {
  const { loading, error, execute, clearError } = useApiOperation();

  return {
    loading,
    error,
    clearError,
    
    createOrganization: useCallback((data: any) => execute(() => apiClient.post('/organizations', data)), [execute]),
    getOrganizations: useCallback((query?: any) => execute(() => apiClient.get('/organizations', { headers: query ? { 'Content-Type': 'application/json' } : {} })), [execute]),
    getOrganizationById: useCallback((id: string) => execute(() => apiClient.get(`/organizations/${id}`)), [execute]),
    updateOrganization: useCallback((id: string, data: any) => execute(() => apiClient.put(`/organizations/${id}`, data)), [execute]),
    deleteOrganization: useCallback((id: string) => execute(() => apiClient.delete(`/organizations/${id}`)), [execute]),
  };
}
