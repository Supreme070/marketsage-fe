import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface WhatsAppMediaMessage {
  type: 'image' | 'document' | 'audio' | 'video';
  url?: string;
  id?: string; // Media ID from upload
  caption?: string;
  filename?: string;
}

interface WhatsAppInteractiveMessage {
  type: 'button' | 'list';
  header?: {
    type: 'text' | 'image' | 'document' | 'video';
    text?: string;
    image?: { id: string } | { link: string };
    document?: { id: string } | { link: string };
    video?: { id: string } | { link: string };
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
    button?: string; // For list messages
  };
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private version = 'v21.0';
  private organizationProviders: Map<string, { accessToken: string; phoneNumberId: string }> = new Map();

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  /**
   * Get organization-specific WhatsApp provider configuration
   */
  async getOrganizationProvider(organizationId: string): Promise<{ accessToken: string; phoneNumberId: string } | null> {
    try {
      // Check cache first
      const cacheKey = `whatsapp_${organizationId}`;
      if (this.organizationProviders.has(cacheKey)) {
        return this.organizationProviders.get(cacheKey) || null;
      }

      // Get from database
      const whatsappConfig = await prisma.whatsAppBusinessConfig.findFirst({
        where: {
          organizationId,
          isActive: true
        }
      });

      if (!whatsappConfig) {
        return null;
      }

      // Decrypt the access token
      const accessToken = this.decrypt(whatsappConfig.accessToken);
      
      const provider = {
        accessToken,
        phoneNumberId: whatsappConfig.phoneNumberId
      };

      // Cache the provider
      this.organizationProviders.set(cacheKey, provider);
      
      return provider;
    } catch (error) {
      logger.error('Error getting organization WhatsApp provider:', { error, organizationId });
      return null;
    }
  }

  /**
   * Clear organization provider cache
   */
  clearOrganizationCache(organizationId: string): void {
    const cacheKey = `whatsapp_${organizationId}`;
    this.organizationProviders.delete(cacheKey);
  }

  /**
   * Send a text message via WhatsApp Business API
   */
  async sendTextMessage(to: string, message: string, organizationId?: string): Promise<WhatsAppResult> {
    try {
      let accessToken = this.accessToken;
      let phoneNumberId = this.phoneNumberId;
      
      // If organization ID is provided, try to get organization-specific provider
      if (organizationId) {
        const orgProvider = await this.getOrganizationProvider(organizationId);
        if (orgProvider) {
          accessToken = orgProvider.accessToken;
          phoneNumberId = orgProvider.phoneNumberId;
        } else {
          logger.info('No organization WhatsApp provider found, using platform default WhatsApp provider', { organizationId });
        }
      }

      // Remove any non-digit characters from phone number
      const cleanPhoneNumber = to.replace(/\D/g, '');
      
      // Ensure phone number has country code
      const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
        ? cleanPhoneNumber 
        : '234' + cleanPhoneNumber.replace(/^0/, '');

      const url = `https://graph.facebook.com/${this.version}/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp API request failed');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id || `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      logger.error('WhatsApp sending error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would send to ${to}: ${message}`);
        return {
          success: true,
          messageId: `mock_wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp sending failed',
        },
      };
    }
  }

  /**
   * Send a template message via WhatsApp Business API
   */
  async sendTemplateMessage(to: string, template: WhatsAppTemplate): Promise<WhatsAppResult> {
    try {
      // Remove any non-digit characters from phone number
      const cleanPhoneNumber = to.replace(/\D/g, '');
      
      // Ensure phone number has country code
      const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
        ? cleanPhoneNumber 
        : '234' + cleanPhoneNumber.replace(/^0/, '');

      const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'template',
        template: {
          name: template.name,
          language: {
            code: template.language
          },
          components: template.components
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp API request failed');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id || `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('WhatsApp template sending error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp Template] Would send to ${to}: ${template.name}`);
        return {
          success: true,
          messageId: `mock_wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp template sending failed',
        },
      };
    }
  }

  /**
   * Enhanced phone number validation for WhatsApp Business API
   * Supports multiple African countries as per WhatsApp international format requirements
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // WhatsApp requires 10-15 digits
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      return false;
    }
    
    // Enhanced African country validation
    const africanCountryValidation = [
      { code: '234', length: 13 }, // Nigeria: +234XXXXXXXXXX
      { code: '254', length: 12 }, // Kenya: +254XXXXXXXXX
      { code: '27', length: 11 },  // South Africa: +27XXXXXXXXX
      { code: '233', length: 12 }, // Ghana: +233XXXXXXXXX
      { code: '256', length: 12 }, // Uganda: +256XXXXXXXXX
      { code: '255', length: 12 }, // Tanzania: +255XXXXXXXXX
      { code: '237', length: 12 }, // Cameroon: +237XXXXXXXXX
      { code: '225', length: 12 }, // Ivory Coast: +225XXXXXXXXX
    ];
    
    // Check international format with country codes
    for (const country of africanCountryValidation) {
      if (cleanPhoneNumber.startsWith(country.code) && cleanPhoneNumber.length === country.length) {
        return true;
      }
    }
    
    // Special handling for Nigerian local numbers (most common)
    if (cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 11) {
      // Validate Nigerian network prefixes
      const validPrefixes = ['080', '081', '070', '090', '091', '071', '082', '083', '084', '085', '086', '087', '088', '089'];
      const prefix = cleanPhoneNumber.substring(1, 4);
      return validPrefixes.includes(prefix);
    }
    
    // Nigerian numbers without leading 0
    if (!cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 10) {
      const validPrefixes = ['80', '81', '70', '90', '91', '71', '82', '83', '84', '85', '86', '87', '88', '89'];
      const prefix = cleanPhoneNumber.substring(0, 2);
      return validPrefixes.includes(prefix);
    }
    
    return false;
  }

  /**
   * Upload media to WhatsApp for use in messages
   */
  async uploadMedia(fileUrl: string, type: 'image' | 'document' | 'audio' | 'video'): Promise<{ success: boolean; mediaId?: string; error?: any }> {
    try {
      const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/media`;
      
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', type);
      
      // Fetch the file and append it
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileUrl}`);
      }
      
      const fileBlob = await fileResponse.blob();
      formData.append('file', fileBlob);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'Media upload failed');
      }

      return {
        success: true,
        mediaId: responseData.id,
      };

    } catch (error) {
      console.error('WhatsApp media upload error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would upload media from: ${fileUrl}`);
        return {
          success: true,
          mediaId: `mock_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Media upload failed',
        },
      };
    }
  }

  /**
   * Send a media message (image, document, audio, video)
   */
  async sendMediaMessage(to: string, media: WhatsAppMediaMessage): Promise<WhatsAppResult> {
    try {
      // Remove any non-digit characters from phone number
      const cleanPhoneNumber = to.replace(/\D/g, '');
      
      // Ensure phone number has country code
      const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
        ? cleanPhoneNumber 
        : '234' + cleanPhoneNumber.replace(/^0/, '');

      const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
      
      const mediaObject: any = {};
      
      if (media.id) {
        mediaObject.id = media.id;
      } else if (media.url) {
        mediaObject.link = media.url;
      } else {
        throw new Error('Media must have either id or url');
      }

      if (media.caption) {
        mediaObject.caption = media.caption;
      }

      if (media.filename && media.type === 'document') {
        mediaObject.filename = media.filename;
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: media.type,
        [media.type]: mediaObject
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp media message failed');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id || `wa_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('WhatsApp media message error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would send ${media.type} to ${to}:`, media);
        return {
          success: true,
          messageId: `mock_wa_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp media message failed',
        },
      };
    }
  }

  /**
   * Send an interactive message (buttons or list)
   */
  async sendInteractiveMessage(to: string, interactive: WhatsAppInteractiveMessage): Promise<WhatsAppResult> {
    try {
      // Remove any non-digit characters from phone number
      const cleanPhoneNumber = to.replace(/\D/g, '');
      
      // Ensure phone number has country code
      const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
        ? cleanPhoneNumber 
        : '234' + cleanPhoneNumber.replace(/^0/, '');

      const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'interactive',
        interactive: {
          type: interactive.type,
          body: interactive.body,
          ...(interactive.header && { header: interactive.header }),
          ...(interactive.footer && { footer: interactive.footer }),
          action: interactive.action
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp interactive message failed');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id || `wa_interactive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('WhatsApp interactive message error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would send interactive ${interactive.type} to ${to}:`, interactive);
        return {
          success: true,
          messageId: `mock_wa_interactive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp interactive message failed',
        },
      };
    }
  }

  /**
   * Send a location message
   */
  async sendLocationMessage(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<WhatsAppResult> {
    try {
      // Remove any non-digit characters from phone number
      const cleanPhoneNumber = to.replace(/\D/g, '');
      
      // Ensure phone number has country code
      const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
        ? cleanPhoneNumber 
        : '234' + cleanPhoneNumber.replace(/^0/, '');

      const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
      
      const locationObject: any = {
        latitude: latitude.toString(),
        longitude: longitude.toString()
      };

      if (name) {
        locationObject.name = name;
      }

      if (address) {
        locationObject.address = address;
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'location',
        location: locationObject
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp location message failed');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id || `wa_location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('WhatsApp location message error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would send location to ${to}: ${latitude}, ${longitude}`);
        return {
          success: true,
          messageId: `mock_wa_location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'WhatsApp location message failed',
        },
      };
    }
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId: string): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
      const url = `https://graph.facebook.com/${this.version}/${mediaId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'Failed to get media URL');
      }

      return {
        success: true,
        url: responseData.url,
      };

    } catch (error) {
      console.error('WhatsApp get media URL error:', error);
      
      // If we don't have proper API credentials, simulate success for development
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`[MOCK WhatsApp] Would get media URL for: ${mediaId}`);
        return {
          success: true,
          url: `https://mock-media-url.com/${mediaId}`,
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get media URL',
        },
      };
    }
  }

  /**
   * Test organization WhatsApp configuration
   */
  async testOrganizationWhatsApp(organizationId: string, testPhoneNumber: string, testMessage?: string): Promise<WhatsAppResult> {
    const provider = await this.getOrganizationProvider(organizationId);
    
    if (!provider) {
      return {
        success: false,
        error: {
          message: 'WhatsApp provider not configured for this organization',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      };
    }

    if (!provider.accessToken || !provider.phoneNumberId) {
      return {
        success: false,
        error: {
          message: 'WhatsApp provider configuration is incomplete',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      };
    }

    // Get organization info for branding
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });

    const orgName = organization?.name || 'MarketSage';
    const message = testMessage || `Test message from ${orgName} WhatsApp service - ${new Date().toISOString()}`;

    // Send test message using organization's provider
    return this.sendTextMessage(testPhoneNumber, message, organizationId);
  }

  /**
   * Check if WhatsApp Business API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }
}

// Export a singleton instance
export const whatsappService = new WhatsAppService();

// Legacy function for backward compatibility
export async function sendWhatsAppMessage(phoneNumber: string, message: string, organizationId?: string): Promise<WhatsAppResult> {
  return whatsappService.sendTextMessage(phoneNumber, message, organizationId);
}