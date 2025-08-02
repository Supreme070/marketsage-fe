/**
 * Communications API Service
 * Handles email, SMS, and WhatsApp operations
 */

import { BaseApiClient } from '../base/api-client';
import type {
  EmailOptions,
  EmailSendResult,
  CampaignSendOptions,
  CampaignSendResult,
  WhatsAppTemplate,
  WhatsAppMediaMessage,
  WhatsAppInteractiveMessage,
  WhatsAppResult,
  SMSOptions,
  SMSResult,
  ContactInfo,
  CommunicationProvider,
  CommunicationActivity,
} from '../types/communications';

export class CommunicationsService extends BaseApiClient {
  // Email Methods
  async sendEmail(
    contact: ContactInfo,
    campaignId: string,
    options: Omit<EmailOptions, 'to'>,
    organizationId?: string
  ): Promise<EmailSendResult> {
    try {
      return await this.post('/communications/email/send', {
        contact,
        campaignId,
        options,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendCampaign(options: CampaignSendOptions): Promise<CampaignSendResult> {
    try {
      return await this.post('/communications/email/campaigns/send', options);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendOrganizationEmail(
    organizationId: string,
    options: EmailOptions
  ): Promise<EmailSendResult> {
    try {
      return await this.post(`/communications/email/organizations/${organizationId}/send`, options);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // WhatsApp Methods
  async sendWhatsAppMessage(
    to: string,
    message: string,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post('/communications/whatsapp/send', {
        to,
        message,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendWhatsAppTemplate(
    to: string,
    template: WhatsAppTemplate,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post('/communications/whatsapp/template', {
        to,
        template,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendWhatsAppMedia(
    to: string,
    media: WhatsAppMediaMessage,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post('/communications/whatsapp/media', {
        to,
        media,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendWhatsAppInteractive(
    to: string,
    interactive: WhatsAppInteractiveMessage,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post('/communications/whatsapp/interactive', {
        to,
        interactive,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendWhatsAppLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
    organizationId?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post('/communications/whatsapp/location', {
        to,
        latitude,
        longitude,
        name,
        address,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadWhatsAppMedia(
    fileUrl: string,
    type: 'image' | 'document' | 'audio' | 'video',
    organizationId?: string
  ): Promise<{ success: boolean; mediaId?: string; error?: any }> {
    try {
      return await this.post('/communications/whatsapp/media/upload', {
        fileUrl,
        type,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWhatsAppMediaUrl(
    mediaId: string,
    organizationId?: string
  ): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
      return await this.get(`/communications/whatsapp/media/${mediaId}`, {
        headers: organizationId ? { 'X-Organization-ID': organizationId } : {},
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async validateWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.post('/communications/whatsapp/validate', {
        phoneNumber,
      });
      return response.valid;
    } catch (error) {
      return false;
    }
  }

  async testWhatsAppConfiguration(
    organizationId: string,
    testPhoneNumber: string,
    testMessage?: string
  ): Promise<WhatsAppResult> {
    try {
      return await this.post(`/communications/whatsapp/test/${organizationId}`, {
        testPhoneNumber,
        testMessage,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // SMS Methods
  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    try {
      return await this.post('/communications/sms/send', options);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendBulkSMS(
    phoneNumbers: string[],
    message: string,
    organizationId?: string
  ): Promise<SMSResult[]> {
    try {
      return await this.post('/communications/sms/bulk', {
        phoneNumbers,
        message,
        organizationId,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSMSBalance(organizationId?: string): Promise<{
    balance: number;
    currency: string;
    provider: string;
  }> {
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      return await this.get(`/communications/sms/balance${params}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async validateSMSNumber(phoneNumber: string): Promise<{
    valid: boolean;
    country?: string;
    carrier?: string;
  }> {
    try {
      return await this.post('/communications/sms/validate', {
        phoneNumber,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Communication Providers
  async getCommunicationProviders(
    organizationId: string,
    type?: 'email' | 'whatsapp' | 'sms'
  ): Promise<CommunicationProvider[]> {
    try {
      const params = type ? `?type=${type}` : '';
      return await this.get(`/communications/providers/${organizationId}${params}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCommunicationProvider(
    organizationId: string,
    provider: Omit<CommunicationProvider, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
  ): Promise<CommunicationProvider> {
    try {
      return await this.post(`/communications/providers/${organizationId}`, provider);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCommunicationProvider(
    organizationId: string,
    providerId: string,
    updates: Partial<CommunicationProvider>
  ): Promise<CommunicationProvider> {
    try {
      return await this.patch(`/communications/providers/${organizationId}/${providerId}`, updates);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCommunicationProvider(
    organizationId: string,
    providerId: string
  ): Promise<void> {
    try {
      await this.delete(`/communications/providers/${organizationId}/${providerId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async testCommunicationProvider(
    organizationId: string,
    providerId: string,
    testData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.post(`/communications/providers/${organizationId}/${providerId}/test`, testData);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Communication Activity
  async getCommunicationActivity(
    organizationId: string,
    filters?: {
      contactId?: string;
      campaignId?: string;
      type?: string;
      provider?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    activities: CommunicationActivity[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await this.get(`/communications/activity/${organizationId}${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCommunicationActivity(
    activity: Omit<CommunicationActivity, 'id' | 'timestamp'>
  ): Promise<CommunicationActivity> {
    try {
      return await this.post('/communications/activity', activity);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Analytics and Reporting
  async getCommunicationStats(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    byChannel: {
      email: number;
      sms: number;
      whatsapp: number;
    };
    byStatus: Record<string, number>;
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.get(`/communications/stats/${organizationId}${query}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
}