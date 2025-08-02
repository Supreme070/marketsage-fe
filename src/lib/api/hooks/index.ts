// API hooks for specific services

'use client';

import { useApi, useMutation, usePaginatedApi } from './useApi';
import { apiClient } from '../client';
import type {
  LoginDto,
  RegisterDto,
  User,
  CreateUserDto,
  UpdateUserDto,
  CreateContactDto,
  UpdateContactDto,
  Contact,
  CreateCampaignDto,
  UpdateCampaignDto,
  Campaign,
  ChatDto,
  ContentGenerationDto,
} from '../types';

// Auth hooks
export function useLogin() {
  return useMutation((credentials: LoginDto) => 
    apiClient.auth.login(credentials)
  );
}

export function useRegister() {
  return useMutation((userData: RegisterDto) => 
    apiClient.auth.register(userData)
  );
}

export function useProfile() {
  return useApi(() => apiClient.auth.getProfile(), {
    cacheKey: 'user_profile',
  });
}

export function useVerifyToken() {
  return useApi(() => apiClient.auth.verifyToken(), {
    immediate: false,
    cacheKey: 'token_verification',
  });
}

// User hooks
export function useUsers(page = 1, limit = 10, search?: string) {
  return usePaginatedApi(
    (p, l) => apiClient.users.getUsers(p, l, search),
    {
      initialPage: page,
      pageSize: limit,
      cacheKey: `users_${search || 'all'}`,
    }
  );
}

export function useUser(userId: string) {
  return useApi(() => apiClient.users.getUserById(userId), {
    cacheKey: `user_${userId}`,
  });
}

export function useCreateUser() {
  return useMutation((userData: CreateUserDto) =>
    apiClient.users.createUser(userData)
  );
}

export function useUpdateUser() {
  return useMutation((data: { userId: string; updateData: UpdateUserDto }) =>
    apiClient.users.updateUser(data.userId, data.updateData)
  );
}

export function useDeleteUser() {
  return useMutation((userId: string) =>
    apiClient.users.deleteUser(userId)
  );
}

export function useUserStats(userId: string) {
  return useApi(() => apiClient.users.getUserStats(userId), {
    cacheKey: `user_stats_${userId}`,
  });
}

// Contact hooks
export function useContacts(options: {
  page?: number;
  limit?: number;
  search?: string;
  listId?: string;
  tags?: string[];
} = {}) {
  const { page = 1, limit = 10, ...filters } = options;
  
  return usePaginatedApi(
    (p, l) => apiClient.contacts.getContacts({ page: p, limit: l, ...filters }),
    {
      initialPage: page,
      pageSize: limit,
      cacheKey: `contacts_${JSON.stringify(filters)}`,
    }
  );
}

export function useContact(contactId: string) {
  return useApi(() => apiClient.contacts.getContactById(contactId), {
    cacheKey: `contact_${contactId}`,
  });
}

export function useCreateContact() {
  return useMutation((contactData: CreateContactDto) =>
    apiClient.contacts.createContact(contactData)
  );
}

export function useUpdateContact() {
  return useMutation((data: { contactId: string; updateData: UpdateContactDto }) =>
    apiClient.contacts.updateContact(data.contactId, data.updateData)
  );
}

export function useDeleteContact() {
  return useMutation((contactId: string) =>
    apiClient.contacts.deleteContact(contactId)
  );
}

export function useBulkUpdateContacts() {
  return useMutation((data: { contactIds: string[]; updateData: Partial<UpdateContactDto> }) =>
    apiClient.contacts.bulkUpdateContacts(data.contactIds, data.updateData)
  );
}

export function useContactsByList(listId: string, page = 1, limit = 10) {
  return usePaginatedApi(
    (p, l) => apiClient.contacts.getContactsByList(listId, p, l),
    {
      initialPage: page,
      pageSize: limit,
      cacheKey: `contacts_list_${listId}`,
    }
  );
}

// Campaign hooks
export function useCampaigns(filters: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
} = {}) {
  const { page = 1, limit = 10, ...queryFilters } = filters;
  
  return usePaginatedApi(
    (p, l) => apiClient.campaigns.getCampaigns({ page: p, limit: l, ...queryFilters }),
    {
      initialPage: page,
      pageSize: limit,
      cacheKey: `campaigns_${JSON.stringify(queryFilters)}`,
    }
  );
}

export function useCampaign(campaignId: string) {
  return useApi(() => apiClient.campaigns.getCampaignById(campaignId), {
    cacheKey: `campaign_${campaignId}`,
  });
}

export function useCreateCampaign() {
  return useMutation((campaignData: CreateCampaignDto) =>
    apiClient.campaigns.createCampaign(campaignData)
  );
}

export function useUpdateCampaign() {
  return useMutation((data: { campaignId: string; updateData: UpdateCampaignDto }) =>
    apiClient.campaigns.updateCampaign(data.campaignId, data.updateData)
  );
}

export function useDeleteCampaign() {
  return useMutation((campaignId: string) =>
    apiClient.campaigns.deleteCampaign(campaignId)
  );
}

export function useSendCampaign() {
  return useMutation((campaignId: string) =>
    apiClient.campaigns.sendCampaign(campaignId)
  );
}

export function usePauseCampaign() {
  return useMutation((campaignId: string) =>
    apiClient.campaigns.pauseCampaign(campaignId)
  );
}

export function useResumeCampaign() {
  return useMutation((campaignId: string) =>
    apiClient.campaigns.resumeCampaign(campaignId)
  );
}

export function useCampaignAnalytics(campaignId: string, days?: number) {
  return useApi(() => apiClient.campaigns.getCampaignAnalytics(campaignId, days), {
    cacheKey: `campaign_analytics_${campaignId}_${days || 'all'}`,
  });
}

export function useRecentCampaigns(limit = 10) {
  return useApi(() => apiClient.campaigns.getRecentCampaigns(limit), {
    cacheKey: `recent_campaigns_${limit}`,
  });
}

// AI hooks
export function useAIChat() {
  return useMutation((chatData: ChatDto) =>
    apiClient.ai.chat(chatData)
  );
}

export function useContentGeneration() {
  return useMutation((contentData: ContentGenerationDto) =>
    apiClient.ai.generateContent(contentData)
  );
}

export function useAIIntelligence() {
  return useMutation((queryData: { query: string; scope?: string }) =>
    apiClient.ai.getIntelligence(queryData)
  );
}

export function usePredictiveAnalysis() {
  return useMutation((analysisData: {
    analysisType: string;
    dataScope: any;
    parameters?: any;
  }) =>
    apiClient.ai.runPredictiveAnalysis(analysisData)
  );
}

export function useAISystemStatus() {
  return useApi(() => apiClient.ai.getSystemStatus(), {
    cacheKey: 'ai_system_status',
  });
}

export function useAIUsageStats(period: 'day' | 'week' | 'month' = 'day') {
  return useApi(() => apiClient.ai.getUsageStats(period), {
    cacheKey: `ai_usage_stats_${period}`,
  });
}

// Utility hooks
export function useApiStatus() {
  return useApi(() => apiClient.getStatus(), {
    cacheKey: 'api_status',
  });
}

// Export all API hooks
export * from './useApi';