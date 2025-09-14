import { BaseApiClient } from '../base/api-client';
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
} from '../types/sms';

export class SMSService extends BaseApiClient {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  // ==================== SMS CAMPAIGNS ====================

  async createCampaign(data: CreateSMSCampaignDto): Promise<SMSCampaign> {
    return this.post<SMSCampaign>('/sms/campaigns', data);
  }

  async getCampaigns(query?: SMSCampaignQueryDto): Promise<SMSCampaignListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/sms/campaigns?${params.toString()}` : '/sms/campaigns';
    return this.get<SMSCampaignListResponse>(endpoint);
  }

  async getCampaignById(id: string): Promise<SMSCampaign> {
    return this.get<SMSCampaign>(`/sms/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: UpdateSMSCampaignDto): Promise<SMSCampaign> {
    return this.put<SMSCampaign>(`/sms/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.delete<void>(`/sms/campaigns/${id}`);
  }

  async sendCampaign(id: string, data: SendSMSCampaignDto): Promise<{
    message: string;
    campaign: SMSCampaign;
    recipientsCount: number;
  }> {
    return this.post<{
      message: string;
      campaign: SMSCampaign;
      recipientsCount: number;
    }>(`/sms/campaigns/${id}/send`, data);
  }

  async getCampaignAnalytics(
    id: string,
    query?: SMSCampaignAnalyticsDto
  ): Promise<SMSCampaignAnalytics> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() 
      ? `/sms/campaigns/${id}/analytics?${params.toString()}` 
      : `/sms/campaigns/${id}/analytics`;
    
    return this.get<SMSCampaignAnalytics>(endpoint);
  }

  // ==================== SMS TEMPLATES ====================

  async createTemplate(data: CreateSMSTemplateDto): Promise<SMSTemplate> {
    return this.post<SMSTemplate>('/sms/templates', data);
  }

  async getTemplates(query?: SMSTemplateQueryDto): Promise<SMSTemplateListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/sms/templates?${params.toString()}` : '/sms/templates';
    return this.get<SMSTemplateListResponse>(endpoint);
  }

  async getTemplateById(id: string): Promise<SMSTemplate> {
    return this.get<SMSTemplate>(`/sms/templates/${id}`);
  }

  async updateTemplate(id: string, data: UpdateSMSTemplateDto): Promise<SMSTemplate> {
    return this.put<SMSTemplate>(`/sms/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.delete<void>(`/sms/templates/${id}`);
  }

  // ==================== SMS PROVIDERS ====================

  async createProvider(data: CreateSMSProviderDto): Promise<SMSProvider> {
    return this.post<SMSProvider>('/sms/providers', data);
  }

  async getProviders(): Promise<SMSProvider[]> {
    return this.get<SMSProvider[]>('/sms/providers');
  }

  async getProviderById(id: string): Promise<SMSProvider> {
    return this.get<SMSProvider>(`/sms/providers/${id}`);
  }

  async updateProvider(id: string, data: UpdateSMSProviderDto): Promise<SMSProvider> {
    return this.put<SMSProvider>(`/sms/providers/${id}`, data);
  }

  async deleteProvider(id: string): Promise<void> {
    await this.delete<void>(`/sms/providers/${id}`);
  }

  async testProvider(id: string, data: TestSMSProviderDto): Promise<TestSMSProviderResult> {
    return this.post<TestSMSProviderResult>(`/sms/providers/${id}/test`, data);
  }

  // ==================== SMS TRACKING ====================

  async trackActivity(
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ): Promise<SMSActivity> {
    return this.post<SMSActivity>(`/sms/track/${campaignId}/${contactId}/${type}`, metadata);
  }

  async unsubscribeContact(contactId: string, campaignId?: string): Promise<UnsubscribeResult> {
    return this.post<UnsubscribeResult>(`/sms/unsubscribe/${contactId}`, { campaignId });
  }

  // ==================== SMS HISTORY ====================

  async getSMSHistory(query?: {
    page?: number;
    limit?: number;
    status?: string;
    contactId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    history: SMSHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/sms/history?${params.toString()}` : '/sms/history';
    return this.get<{
      history: SMSHistory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getSMSHistoryById(id: string): Promise<SMSHistory> {
    return this.get<SMSHistory>(`/sms/history/${id}`);
  }
}
