/**
 * Unified MarketSage API Services
 * All API services using the unified client
 */

import { apiClient } from './client';

// Import all types
import {
  // SMS Types
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
} from './types/sms';

import {
  // Email Types
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
  EmailHistory,
} from './types/email';

import {
  // Contact Types
  Contact,
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
  ContactListResponse,
} from './types/contacts';

import {
  // Workflow Types
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowQueryDto,
  WorkflowListResponse,
} from './types/workflows';

import {
  // User Types
  User,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserListResponse,
} from './types/users';

import {
  // Organization Types
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationQueryDto,
  OrganizationListResponse,
} from './types/organizations';

/**
 * SMS Service using unified API client
 */
export class SMSService {
  // ==================== SMS CAMPAIGNS ====================

  async createCampaign(data: CreateSMSCampaignDto): Promise<SMSCampaign> {
    return apiClient.post<SMSCampaign>('/sms/campaigns', data);
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
    return apiClient.get<SMSCampaignListResponse>(endpoint);
  }

  async getCampaignById(id: string): Promise<SMSCampaign> {
    return apiClient.get<SMSCampaign>(`/sms/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: UpdateSMSCampaignDto): Promise<SMSCampaign> {
    return apiClient.put<SMSCampaign>(`/sms/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete<void>(`/sms/campaigns/${id}`);
  }

  async sendCampaign(id: string, data: SendSMSCampaignDto): Promise<{
    message: string;
    campaign: SMSCampaign;
    recipientsCount: number;
  }> {
    return apiClient.post<{
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
    
    return apiClient.get<SMSCampaignAnalytics>(endpoint);
  }

  // ==================== SMS TEMPLATES ====================

  async createTemplate(data: CreateSMSTemplateDto): Promise<SMSTemplate> {
    return apiClient.post<SMSTemplate>('/sms/templates', data);
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
    return apiClient.get<SMSTemplateListResponse>(endpoint);
  }

  async getTemplateById(id: string): Promise<SMSTemplate> {
    return apiClient.get<SMSTemplate>(`/sms/templates/${id}`);
  }

  async updateTemplate(id: string, data: UpdateSMSTemplateDto): Promise<SMSTemplate> {
    return apiClient.put<SMSTemplate>(`/sms/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete<void>(`/sms/templates/${id}`);
  }

  // ==================== SMS PROVIDERS ====================

  async createProvider(data: CreateSMSProviderDto): Promise<SMSProvider> {
    return apiClient.post<SMSProvider>('/sms/providers', data);
  }

  async getProviders(): Promise<SMSProvider[]> {
    return apiClient.get<SMSProvider[]>('/sms/providers');
  }

  async getProviderById(id: string): Promise<SMSProvider> {
    return apiClient.get<SMSProvider>(`/sms/providers/${id}`);
  }

  async updateProvider(id: string, data: UpdateSMSProviderDto): Promise<SMSProvider> {
    return apiClient.put<SMSProvider>(`/sms/providers/${id}`, data);
  }

  async deleteProvider(id: string): Promise<void> {
    await apiClient.delete<void>(`/sms/providers/${id}`);
  }

  async testProvider(id: string, data: TestSMSProviderDto): Promise<TestSMSProviderResult> {
    return apiClient.post<TestSMSProviderResult>(`/sms/providers/${id}/test`, data);
  }

  // ==================== SMS TRACKING ====================

  async trackActivity(
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ): Promise<SMSActivity> {
    return apiClient.post<SMSActivity>(`/sms/track/${campaignId}/${contactId}/${type}`, metadata);
  }

  async unsubscribeContact(contactId: string, campaignId?: string): Promise<UnsubscribeResult> {
    return apiClient.post<UnsubscribeResult>(`/sms/unsubscribe/${contactId}`, { campaignId });
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
    return apiClient.get<{
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
    return apiClient.get<SMSHistory>(`/sms/history/${id}`);
  }
}

/**
 * Email Service using unified API client
 */
export class EmailService {
  // ==================== EMAIL CAMPAIGNS ====================

  async createCampaign(data: CreateEmailCampaignDto): Promise<EmailCampaign> {
    return apiClient.post<EmailCampaign>('/email/campaigns', data);
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
    return apiClient.get<EmailCampaignListResponse>(endpoint);
  }

  async getCampaignById(id: string): Promise<EmailCampaign> {
    return apiClient.get<EmailCampaign>(`/email/campaigns/${id}`);
  }

  async updateCampaign(id: string, data: UpdateEmailCampaignDto): Promise<EmailCampaign> {
    return apiClient.put<EmailCampaign>(`/email/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete<void>(`/email/campaigns/${id}`);
  }

  async sendCampaign(id: string, data: SendEmailCampaignDto): Promise<{
    message: string;
    campaign: EmailCampaign;
    recipientsCount: number;
  }> {
    return apiClient.post<{
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
    
    return apiClient.get<EmailCampaignAnalytics>(endpoint);
  }

  // ==================== EMAIL TEMPLATES ====================

  async createTemplate(data: CreateEmailTemplateDto): Promise<EmailTemplate> {
    return apiClient.post<EmailTemplate>('/email/templates', data);
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
    return apiClient.get<EmailTemplateListResponse>(endpoint);
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    return apiClient.get<EmailTemplate>(`/email/templates/${id}`);
  }

  async updateTemplate(id: string, data: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    return apiClient.put<EmailTemplate>(`/email/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete<void>(`/email/templates/${id}`);
  }

  // ==================== EMAIL PROVIDERS ====================

  async createProvider(data: CreateEmailProviderDto): Promise<EmailProvider> {
    return apiClient.post<EmailProvider>('/email/providers', data);
  }

  async getProviders(): Promise<EmailProvider[]> {
    return apiClient.get<EmailProvider[]>('/email/providers');
  }

  async getProviderById(id: string): Promise<EmailProvider> {
    return apiClient.get<EmailProvider>(`/email/providers/${id}`);
  }

  async updateProvider(id: string, data: UpdateEmailProviderDto): Promise<EmailProvider> {
    return apiClient.put<EmailProvider>(`/email/providers/${id}`, data);
  }

  async deleteProvider(id: string): Promise<void> {
    await apiClient.delete<void>(`/email/providers/${id}`);
  }

  async testProvider(id: string, data: TestEmailProviderDto): Promise<TestEmailProviderResult> {
    return apiClient.post<TestEmailProviderResult>(`/email/providers/${id}/test`, data);
  }

  // ==================== EMAIL TRACKING ====================

  async trackActivity(
    campaignId: string,
    contactId: string,
    type: string,
    metadata?: Record<string, unknown>
  ): Promise<EmailActivity> {
    return apiClient.post<EmailActivity>(`/email/track/${campaignId}/${contactId}/${type}`, metadata);
  }

  async unsubscribeContact(contactId: string, campaignId?: string): Promise<UnsubscribeResult> {
    return apiClient.post<UnsubscribeResult>(`/email/unsubscribe/${contactId}`, { campaignId });
  }

  // ==================== EMAIL HISTORY ====================

  async getEmailHistory(query?: {
    page?: number;
    limit?: number;
    status?: string;
    contactId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    history: EmailHistory[];
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
    
    const endpoint = params.toString() ? `/email/history?${params.toString()}` : '/email/history';
    return apiClient.get<{
      history: EmailHistory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getEmailHistoryById(id: string): Promise<EmailHistory> {
    return apiClient.get<EmailHistory>(`/email/history/${id}`);
  }
}

/**
 * Contact Service using unified API client
 */
export class ContactService {
  async createContact(data: CreateContactDto): Promise<Contact> {
    return apiClient.post<Contact>('/contacts', data);
  }

  async getContacts(query?: ContactQueryDto): Promise<ContactListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/contacts?${params.toString()}` : '/contacts';
    return apiClient.get<ContactListResponse>(endpoint);
  }

  async getContactById(id: string): Promise<Contact> {
    return apiClient.get<Contact>(`/contacts/${id}`);
  }

  async updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
    return apiClient.put<Contact>(`/contacts/${id}`, data);
  }

  async deleteContact(id: string): Promise<void> {
    await apiClient.delete<void>(`/contacts/${id}`);
  }
}

/**
 * Workflow Service using unified API client
 */
export class WorkflowService {
  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    return apiClient.post<Workflow>('/workflows', data);
  }

  async getWorkflows(query?: WorkflowQueryDto): Promise<WorkflowListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/workflows?${params.toString()}` : '/workflows';
    return apiClient.get<WorkflowListResponse>(endpoint);
  }

  async getWorkflowById(id: string): Promise<Workflow> {
    return apiClient.get<Workflow>(`/workflows/${id}`);
  }

  async updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    return apiClient.put<Workflow>(`/workflows/${id}`, data);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await apiClient.delete<void>(`/workflows/${id}`);
  }
}

/**
 * User Service using unified API client
 */
export class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async getUsers(query?: UserQueryDto): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/users?${params.toString()}` : '/users';
    return apiClient.get<UserListResponse>(endpoint);
  }

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete<void>(`/users/${id}`);
  }
}

/**
 * Organization Service using unified API client
 */
export class OrganizationService {
  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {
    return apiClient.post<Organization>('/organizations', data);
  }

  async getOrganizations(query?: OrganizationQueryDto): Promise<OrganizationListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = params.toString() ? `/organizations?${params.toString()}` : '/organizations';
    return apiClient.get<OrganizationListResponse>(endpoint);
  }

  async getOrganizationById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(`/organizations/${id}`);
  }

  async updateOrganization(id: string, data: UpdateOrganizationDto): Promise<Organization> {
    return apiClient.put<Organization>(`/organizations/${id}`, data);
  }

  async deleteOrganization(id: string): Promise<void> {
    await apiClient.delete<void>(`/organizations/${id}`);
  }
}

// Export singleton instances
export const smsService = new SMSService();
export const emailService = new EmailService();
export const contactService = new ContactService();
export const workflowService = new WorkflowService();
export const userService = new UserService();
export const organizationService = new OrganizationService();

// Export the unified API client
export { apiClient };
