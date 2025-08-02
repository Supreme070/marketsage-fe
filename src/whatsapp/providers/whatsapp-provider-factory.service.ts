import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { WhatsAppProvider, WhatsAppMessageType, WhatsAppMessageStatus } from '../dto/whatsapp-base.dto';
import { SendWhatsAppMessageDto } from '../dto/whatsapp-messages.dto';

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  providerId: string;
  status: WhatsAppMessageStatus;
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface WhatsAppProviderConfig {
  id: string;
  type: WhatsAppProvider;
  config: Record<string, any>;
  phoneNumber: string;
  displayName?: string;
}

@Injectable()
export class WhatsAppProviderFactoryService {
  private readonly logger = new Logger(WhatsAppProviderFactoryService.name);

  async sendMessage(provider: WhatsAppProviderConfig, message: SendWhatsAppMessageDto): Promise<WhatsAppResult> {
    try {
      switch (provider.type) {
        case WhatsAppProvider.TWILIO:
          return await this.sendViaTwilio(provider, message);
        case WhatsAppProvider.META_BUSINESS:
          return await this.sendViaMetaBusiness(provider, message);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return await this.sendViaBusinessAPI(provider, message);
        default:
          throw new Error(`Unsupported WhatsApp provider: ${provider.type}`);
      }
    } catch (error) {
      this.logger.error(`Provider ${provider.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        providerId: provider.id,
        status: WhatsAppMessageStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getBalance(provider: WhatsAppProviderConfig): Promise<number> {
    try {
      switch (provider.type) {
        case WhatsAppProvider.TWILIO:
          return await this.getTwilioBalance(provider);
        case WhatsAppProvider.META_BUSINESS:
          return await this.getMetaBusinessBalance(provider);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return await this.getBusinessAPIBalance(provider);
        default:
          throw new Error(`Balance check not supported for provider: ${provider.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get balance for ${provider.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    }
  }

  async validateConfig(provider: WhatsAppProviderConfig): Promise<boolean> {
    try {
      switch (provider.type) {
        case WhatsAppProvider.TWILIO:
          return await this.validateTwilioConfig(provider);
        case WhatsAppProvider.META_BUSINESS:
          return await this.validateMetaBusinessConfig(provider);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return await this.validateBusinessAPIConfig(provider);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Config validation failed for ${provider.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async sendViaTwilio(provider: WhatsAppProviderConfig, message: SendWhatsAppMessageDto): Promise<WhatsAppResult> {
    const { accountSid, authToken } = provider.config;
    const fromNumber = `whatsapp:${provider.phoneNumber}`;
    const toNumber = `whatsapp:${message.recipient.phoneNumber}`;

    let body = '';
    let mediaUrl = undefined;

    // Handle different message types
    switch (message.type) {
      case WhatsAppMessageType.TEXT:
        body = message.text || '';
        break;
      case WhatsAppMessageType.IMAGE:
      case WhatsAppMessageType.VIDEO:
      case WhatsAppMessageType.AUDIO:
      case WhatsAppMessageType.DOCUMENT:
        body = message.media?.caption || '';
        mediaUrl = message.media?.url;
        break;
      case WhatsAppMessageType.TEMPLATE:
        // Twilio template handling
        body = this.buildTwilioTemplateMessage(message);
        break;
      default:
        throw new Error(`Message type ${message.type} not supported by Twilio`);
    }

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: body,
        ...(mediaUrl && { MediaUrl: mediaUrl }),
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      success: (response.data as any).status !== 'failed',
      messageId: (response.data as any).sid,
      providerId: provider.id,
      status: this.mapTwilioStatus((response.data as any).status),
      providerResponse: response.data as Record<string, any>,
    };
  }

  private async sendViaMetaBusiness(provider: WhatsAppProviderConfig, message: SendWhatsAppMessageDto): Promise<WhatsAppResult> {
    const { accessToken, phoneNumberId } = provider.config;
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

    let messageData: any = {
      messaging_product: 'whatsapp',
      to: message.recipient.phoneNumber,
    };

    // Handle different message types
    switch (message.type) {
      case WhatsAppMessageType.TEXT:
        messageData.type = 'text';
        messageData.text = { body: message.text };
        break;
      case WhatsAppMessageType.IMAGE:
        messageData.type = 'image';
        messageData.image = {
          link: message.media?.url,
          caption: message.media?.caption,
        };
        break;
      case WhatsAppMessageType.VIDEO:
        messageData.type = 'video';
        messageData.video = {
          link: message.media?.url,
          caption: message.media?.caption,
        };
        break;
      case WhatsAppMessageType.AUDIO:
        messageData.type = 'audio';
        messageData.audio = { link: message.media?.url };
        break;
      case WhatsAppMessageType.DOCUMENT:
        messageData.type = 'document';
        messageData.document = {
          link: message.media?.url,
          filename: message.media?.filename,
          caption: message.media?.caption,
        };
        break;
      case WhatsAppMessageType.LOCATION:
        messageData.type = 'location';
        messageData.location = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        break;
      case WhatsAppMessageType.TEMPLATE:
        messageData.type = 'template';
        messageData.template = {
          name: message.templateName,
          language: { code: message.templateLanguage || 'en' },
          components: message.templateComponents || [],
        };
        break;
      case WhatsAppMessageType.INTERACTIVE:
        messageData.type = 'interactive';
        messageData.interactive = message.interactive;
        break;
      default:
        throw new Error(`Message type ${message.type} not supported by Meta Business`);
    }

    const response = await axios.post(url, messageData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const messageId = (response.data as any).messages?.[0]?.id;

    return {
      success: !!messageId,
      messageId,
      providerId: provider.id,
      status: messageId ? WhatsAppMessageStatus.SENT : WhatsAppMessageStatus.FAILED,
      providerResponse: response.data as Record<string, any>,
    };
  }

  private async sendViaBusinessAPI(provider: WhatsAppProviderConfig, message: SendWhatsAppMessageDto): Promise<WhatsAppResult> {
    const { apiKey, apiUrl } = provider.config;

    const messageData = {
      to: message.recipient.phoneNumber,
      type: message.type,
      content: this.buildBusinessAPIContent(message),
    };

    const response = await axios.post(`${apiUrl}/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: (response.data as any).success === true,
      messageId: (response.data as any).message_id,
      providerId: provider.id,
      status: (response.data as any).success ? WhatsAppMessageStatus.SENT : WhatsAppMessageStatus.FAILED,
      providerResponse: response.data as Record<string, any>,
    };
  }

  private async getTwilioBalance(provider: WhatsAppProviderConfig): Promise<number> {
    const { accountSid, authToken } = provider.config;
    
    const response = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`,
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
      }
    );

    return parseFloat((response.data as any).balance || '0');
  }

  private async getMetaBusinessBalance(provider: WhatsAppProviderConfig): Promise<number> {
    // Meta Business API doesn't have a direct balance endpoint
    // Return a mock value or implement custom logic
    return 1000;
  }

  private async getBusinessAPIBalance(provider: WhatsAppProviderConfig): Promise<number> {
    const { apiKey, apiUrl } = provider.config;
    
    try {
      const response = await axios.get(`${apiUrl}/account/balance`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return parseFloat((response.data as any).balance || '0');
    } catch (error) {
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateTwilioConfig(provider: WhatsAppProviderConfig): Promise<boolean> {
    const { accountSid, authToken } = provider.config;
    
    if (!accountSid || !authToken) {
      return false;
    }

    try {
      await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  private async validateMetaBusinessConfig(provider: WhatsAppProviderConfig): Promise<boolean> {
    const { accessToken, phoneNumberId } = provider.config;
    
    if (!accessToken || !phoneNumberId) {
      return false;
    }

    try {
      await axios.get(
        `https://graph.facebook.com/v17.0/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  private async validateBusinessAPIConfig(provider: WhatsAppProviderConfig): Promise<boolean> {
    const { apiKey, apiUrl } = provider.config;
    
    if (!apiKey || !apiUrl) {
      return false;
    }

    try {
      await axios.get(`${apiUrl}/account`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  private buildTwilioTemplateMessage(message: SendWhatsAppMessageDto): string {
    // Twilio uses a different template format
    // This is a simplified implementation
    return message.templateName ? `Template: ${message.templateName}` : message.text || '';
  }

  private buildBusinessAPIContent(message: SendWhatsAppMessageDto): any {
    switch (message.type) {
      case WhatsAppMessageType.TEXT:
        return { text: message.text };
      case WhatsAppMessageType.IMAGE:
        return { 
          media: message.media?.url,
          caption: message.media?.caption 
        };
      case WhatsAppMessageType.TEMPLATE:
        return {
          template: message.templateName,
          language: message.templateLanguage,
          components: message.templateComponents,
        };
      default:
        return { text: message.text || '' };
    }
  }

  private mapTwilioStatus(status: string): WhatsAppMessageStatus {
    switch (status) {
      case 'sent':
        return WhatsAppMessageStatus.SENT;
      case 'delivered':
        return WhatsAppMessageStatus.DELIVERED;
      case 'read':
        return WhatsAppMessageStatus.READ;
      case 'failed':
      case 'undelivered':
        return WhatsAppMessageStatus.FAILED;
      default:
        return WhatsAppMessageStatus.PENDING;
    }
  }
}