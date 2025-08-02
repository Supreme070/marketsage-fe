import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsAppProvider } from '../dto/whatsapp-base.dto';
import { WhatsAppProviderDto } from '../dto/whatsapp-providers.dto';

export interface TemplateStatus {
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  language: string;
  category: string;
  components: any[];
  lastUpdated: string;
}

export interface TemplateSyncResult {
  success: boolean;
  templatesUpdated: number;
  templatesAdded: number;
  templatesRemoved: number;
  errors: string[];
}

@Injectable()
export class WhatsAppTemplateSyncService {
  private readonly logger = new Logger(WhatsAppTemplateSyncService.name);

  constructor(private readonly httpService: HttpService) {}

  async syncTemplates(provider: WhatsAppProviderDto): Promise<TemplateSyncResult> {
    try {
      const result: TemplateSyncResult = {
        success: false,
        templatesUpdated: 0,
        templatesAdded: 0,
        templatesRemoved: 0,
        errors: [],
      };

      switch (provider.type) {
        case WhatsAppProvider.META_BUSINESS:
          return this.syncMetaBusinessTemplates(provider, result);
        case WhatsAppProvider.TWILIO:
          return this.syncTwilioTemplates(provider, result);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return this.syncBusinessAPITemplates(provider, result);
        default:
          result.errors.push(`Template sync not supported for provider: ${provider.type}`);
          return result;
      }
    } catch (error) {
      this.logger.error(`Template sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        templatesUpdated: 0,
        templatesAdded: 0,
        templatesRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async syncMetaBusinessTemplates(provider: WhatsAppProviderDto, result: TemplateSyncResult): Promise<TemplateSyncResult> {
    try {
      const { accessToken, businessAccountId } = provider.config;
      
      // Get templates from Meta Business API
      const response = await firstValueFrom(
        this.httpService.get(
          `https://graph.facebook.com/v17.0/${businessAccountId}/message_templates`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              fields: 'name,status,language,category,components',
              limit: 1000,
            },
          }
        )
      );

      const templates = response.data.data || [];
      
      for (const template of templates) {
        const templateStatus: TemplateStatus = {
          name: template.name,
          status: template.status,
          language: template.language,
          category: template.category,
          components: template.components || [],
          lastUpdated: new Date().toISOString(),
        };

        // Here you would typically update your database
        // For now, we'll just count the templates
        if (template.status === 'APPROVED') {
          result.templatesAdded++;
        } else if (template.status === 'PENDING') {
          result.templatesUpdated++;
        }
      }

      result.success = true;
      this.logger.log(`Synced ${templates.length} templates from Meta Business API`);
      
      return result;
    } catch (error) {
      this.logger.error('Meta Business template sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Meta Business API error');
      return result;
    }
  }

  private async syncTwilioTemplates(provider: WhatsAppProviderDto, result: TemplateSyncResult): Promise<TemplateSyncResult> {
    try {
      const { accountSid, authToken } = provider.config;
      
      // Get templates from Twilio API
      const response = await firstValueFrom(
        this.httpService.get(
          `https://content.twilio.com/v1/Content`,
          {
            auth: {
              username: accountSid,
              password: authToken,
            },
            params: {
              PageSize: 1000,
            },
          }
        )
      );

      const templates = response.data.contents || [];
      
      for (const template of templates) {
        const templateStatus: TemplateStatus = {
          name: template.friendly_name,
          status: template.approval_requests?.[0]?.status === 'approved' ? 'APPROVED' : 'PENDING',
          language: template.language || 'en',
          category: 'UTILITY', // Twilio default
          components: template.types?.['twilio/text']?.body || [],
          lastUpdated: template.date_updated || new Date().toISOString(),
        };

        result.templatesAdded++;
      }

      result.success = true;
      this.logger.log(`Synced ${templates.length} templates from Twilio`);
      
      return result;
    } catch (error) {
      this.logger.error('Twilio template sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Twilio API error');
      return result;
    }
  }

  private async syncBusinessAPITemplates(provider: WhatsAppProviderDto, result: TemplateSyncResult): Promise<TemplateSyncResult> {
    try {
      const { apiKey, apiUrl } = provider.config;
      
      // Get templates from Business API
      const response = await firstValueFrom(
        this.httpService.get(
          `${apiUrl}/templates`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        )
      );

      const templates = response.data.templates || [];
      
      for (const template of templates) {
        const templateStatus: TemplateStatus = {
          name: template.name,
          status: template.status || 'APPROVED',
          language: template.language || 'en',
          category: template.category || 'MARKETING',
          components: template.components || [],
          lastUpdated: template.updated_at || new Date().toISOString(),
        };

        result.templatesAdded++;
      }

      result.success = true;
      this.logger.log(`Synced ${templates.length} templates from Business API`);
      
      return result;
    } catch (error) {
      this.logger.error('Business API template sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Business API error');
      return result;
    }
  }

  async getTemplateStatus(provider: WhatsAppProviderDto, templateName: string, language: string = 'en'): Promise<TemplateStatus | null> {
    try {
      switch (provider.type) {
        case WhatsAppProvider.META_BUSINESS:
          return this.getMetaBusinessTemplateStatus(provider, templateName, language);
        case WhatsAppProvider.TWILIO:
          return this.getTwilioTemplateStatus(provider, templateName);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return this.getBusinessAPITemplateStatus(provider, templateName, language);
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Failed to get template status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private async getMetaBusinessTemplateStatus(provider: WhatsAppProviderDto, templateName: string, language: string): Promise<TemplateStatus | null> {
    try {
      const { accessToken, businessAccountId } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.get(
          `https://graph.facebook.com/v17.0/${businessAccountId}/message_templates`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              name: templateName,
              language: language,
              fields: 'name,status,language,category,components',
            },
          }
        )
      );

      const template = response.data.data?.[0];
      if (!template) return null;

      return {
        name: template.name,
        status: template.status,
        language: template.language,
        category: template.category,
        components: template.components || [],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Meta Business template status error:', error);
      return null;
    }
  }

  private async getTwilioTemplateStatus(provider: WhatsAppProviderDto, templateName: string): Promise<TemplateStatus | null> {
    try {
      const { accountSid, authToken } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.get(
          `https://content.twilio.com/v1/Content`,
          {
            auth: {
              username: accountSid,
              password: authToken,
            },
            params: {
              FriendlyName: templateName,
            },
          }
        )
      );

      const template = response.data.contents?.[0];
      if (!template) return null;

      return {
        name: template.friendly_name,
        status: template.approval_requests?.[0]?.status === 'approved' ? 'APPROVED' : 'PENDING',
        language: template.language || 'en',
        category: 'UTILITY',
        components: template.types?.['twilio/text']?.body || [],
        lastUpdated: template.date_updated || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Twilio template status error:', error);
      return null;
    }
  }

  private async getBusinessAPITemplateStatus(provider: WhatsAppProviderDto, templateName: string, language: string): Promise<TemplateStatus | null> {
    try {
      const { apiKey, apiUrl } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${apiUrl}/templates/${templateName}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            params: {
              language,
            },
          }
        )
      );

      const template = response.data.template;
      if (!template) return null;

      return {
        name: template.name,
        status: template.status || 'APPROVED',
        language: template.language || 'en',
        category: template.category || 'MARKETING',
        components: template.components || [],
        lastUpdated: template.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Business API template status error:', error);
      return null;
    }
  }

  async submitTemplate(provider: WhatsAppProviderDto, templateData: any): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      switch (provider.type) {
        case WhatsAppProvider.META_BUSINESS:
          return this.submitMetaBusinessTemplate(provider, templateData);
        case WhatsAppProvider.TWILIO:
          return this.submitTwilioTemplate(provider, templateData);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return this.submitBusinessAPITemplate(provider, templateData);
        default:
          return { success: false, error: `Template submission not supported for provider: ${provider.type}` };
      }
    } catch (error) {
      this.logger.error(`Template submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async submitMetaBusinessTemplate(provider: WhatsAppProviderDto, templateData: any): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { accessToken, businessAccountId } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v17.0/${businessAccountId}/message_templates`,
          templateData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        success: true,
        templateId: response.data.id,
      };
    } catch (error) {
      this.logger.error('Meta Business template submission error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Meta Business API error' };
    }
  }

  private async submitTwilioTemplate(provider: WhatsAppProviderDto, templateData: any): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { accountSid, authToken } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.post(
          'https://content.twilio.com/v1/Content',
          templateData,
          {
            auth: {
              username: accountSid,
              password: authToken,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        success: true,
        templateId: response.data.sid,
      };
    } catch (error) {
      this.logger.error('Twilio template submission error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Twilio API error' };
    }
  }

  private async submitBusinessAPITemplate(provider: WhatsAppProviderDto, templateData: any): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { apiKey, apiUrl } = provider.config;
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${apiUrl}/templates`,
          templateData,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        success: true,
        templateId: response.data.template_id,
      };
    } catch (error) {
      this.logger.error('Business API template submission error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Business API error' };
    }
  }
}