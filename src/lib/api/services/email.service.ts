import { BaseApiClient } from '../base/api-client';
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
} from '../types/email';

export class EmailService extends BaseApiClient {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  // ==================== EMAIL CAMPAIGNS ====================

  async createCampaign(data: CreateEmailCampaignDto): Promise<EmailCampaign> {
    return this.post<EmailCampaign>('/email/campaigns', data);
  }

  async getCampaigns(query?: EmailCampaignQueryDto): Promise<EmailCampaignListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/email/campaigns?${params.toString()}` : '/email/campaigns';
    return this.get<EmailCampaignListResponse>(endpoint);
  }

  async getCampaignById(id: string): Promise<EmailCampaign> {
    return this.get<EmailCampaign>(`/email/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: UpdateEmailCampaignDto): Promise<EmailCampaign> {
    return this.put<EmailCampaign>(`/email/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.delete<void>(`/email/campaigns/${id}`);
  }

  async sendCampaign(id: string, data: SendEmailCampaignDto): Promise<{
    message: string;
    campaign: EmailCampaign;
    recipientsCount: number;
  }> {
    return this.post<{
      message: string;
      campaign: EmailCampaign;
      recipientsCount: number;
    }>(`/email/campaigns/${id}/send`, data);
  }

  async getCampaignAnalytics(
    id: string,
    query?: EmailCampaignAnalyticsDto
  ): Promise<EmailCampaignAnalytics> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() 
      ? `/email/campaigns/${id}/analytics?${params.toString()}` 
      : `/email/campaigns/${id}/analytics`;
    
    return this.get<EmailCampaignAnalytics>(endpoint);
  }

  // ==================== EMAIL TEMPLATES ====================

  async createTemplate(data: CreateEmailTemplateDto): Promise<EmailTemplate> {
    return this.post<EmailTemplate>('/email/templates', data);
  }

  async getTemplates(query?: EmailTemplateQueryDto): Promise<EmailTemplateListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/email/templates?${params.toString()}` : '/email/templates';
    return this.get<EmailTemplateListResponse>(endpoint);
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    return this.get<EmailTemplate>(`/email/templates/${id}`);
  }

  async updateTemplate(id: string, data: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    return this.put<EmailTemplate>(`/email/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.delete<void>(`/email/templates/${id}`);
  }

  // ==================== EMAIL PROVIDERS ====================

  async createProvider(data: CreateEmailProviderDto): Promise<EmailProvider> {
    return this.post<EmailProvider>('/email/providers', data);
  }

  async getProviders(): Promise<EmailProvider[]> {
    return this.get<EmailProvider[]>('/email/providers');
  }

  async getProviderById(id: string): Promise<EmailProvider> {
    return this.get<EmailProvider>(`/email/providers/${id}`);
  }

  async updateProvider(id: string, data: UpdateEmailProviderDto): Promise<EmailProvider> {
    return this.put<EmailProvider>(`/email/providers/${id}`, data);
  }

  async deleteProvider(id: string): Promise<void> {
    await this.delete<void>(`/email/providers/${id}`);
  }

  async testProvider(id: string, data: TestEmailProviderDto): Promise<TestEmailProviderResult> {
    return this.post<TestEmailProviderResult>(`/email/providers/${id}/test`, data);
  }

  // ==================== EMAIL TRACKING ====================

  async trackActivity(
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ): Promise<EmailActivity> {
    return this.post<EmailActivity>(`/email/track/${campaignId}/${contactId}/${type}`, metadata);
  }

  async unsubscribeContact(contactId: string, campaignId?: string): Promise<UnsubscribeResult> {
    return this.post<UnsubscribeResult>(`/email/unsubscribe/${contactId}`, { campaignId });
  }
}
