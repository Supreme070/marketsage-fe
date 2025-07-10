import type { SMSProvider, SMSResult } from './base-provider';
import { MockSMSProvider } from './mock-provider';
import { AfricasTalkingSMSProvider } from './africastalking-provider';
import { TwilioSMSProvider } from './twilio-provider';
import { DatabaseSMSProvider } from './database-provider';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// SMS provider types
export type SMSProviderType = 'mock' | 'africastalking' | 'twilio' | 'database';

// SMS service for managing multiple providers
export class SMSService {
  private providers: Map<SMSProviderType, SMSProvider> = new Map();
  private defaultProvider: SMSProviderType;
  private organizationProviders: Map<string, SMSProvider> = new Map();

  constructor() {
    // Initialize all providers
    this.providers.set('mock', new MockSMSProvider());
    this.providers.set('africastalking', new AfricasTalkingSMSProvider());
    this.providers.set('twilio', new TwilioSMSProvider());
    this.providers.set('database', new DatabaseSMSProvider());

    // Determine default provider based on configuration and environment
    this.defaultProvider = this.selectDefaultProvider();
  }

  private selectDefaultProvider(): SMSProviderType {
    const configuredProvider = process.env.SMS_PROVIDER as SMSProviderType;
    
    // If a specific provider is configured, use it
    if (configuredProvider && this.providers.has(configuredProvider)) {
      const provider = this.providers.get(configuredProvider);
      if (provider?.isConfigured()) {
        return configuredProvider;
      }
    }

    // Auto-select based on available configuration
    const africastalking = this.providers.get('africastalking');
    if (africastalking?.isConfigured()) {
      return 'africastalking';
    }

    const twilio = this.providers.get('twilio');
    if (twilio?.isConfigured()) {
      return 'twilio';
    }

    // Fallback to mock for development
    return 'mock';
  }

  async sendSMS(phoneNumber: string, message: string, organizationId?: string, providerType?: SMSProviderType): Promise<SMSResult> {
    try {
      // If organization ID is provided, try to get organization-specific provider
      if (organizationId) {
        const orgProvider = await this.getOrganizationProvider(organizationId);
        if (orgProvider) {
          const result = await orgProvider.sendSMS(phoneNumber, message);
          return {
            ...result,
            provider: orgProvider.name
          } as SMSResult & { provider: string };
        }
      }

      // Fall back to default provider selection
      const selectedProvider = providerType || this.defaultProvider;
      const provider = this.providers.get(selectedProvider);

      if (!provider) {
        return {
          success: false,
          error: {
            message: `SMS provider '${selectedProvider}' not found`,
            code: 'PROVIDER_NOT_FOUND'
          }
        };
      }

      const result = await provider.sendSMS(phoneNumber, message);
      
      // Add provider info to result for tracking
      return {
        ...result,
        provider: provider.name
      } as SMSResult & { provider: string };
    } catch (error) {
      logger.error('SMS service error:', { error, phoneNumber, organizationId });
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'SMS sending failed',
          code: 'SMS_SERVICE_ERROR'
        }
      };
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const provider = this.providers.get(this.defaultProvider);
    return provider?.validatePhoneNumber(phoneNumber) ?? false;
  }

  getProvider(providerType?: SMSProviderType): SMSProvider | undefined {
    return this.providers.get(providerType || this.defaultProvider);
  }

  getConfiguredProviders(): { type: SMSProviderType; name: string; configured: boolean }[] {
    return Array.from(this.providers.entries()).map(([type, provider]) => ({
      type,
      name: provider.name,
      configured: provider.isConfigured()
    }));
  }

  getCurrentProvider(): { type: SMSProviderType; name: string } {
    const provider = this.providers.get(this.defaultProvider);
    return {
      type: this.defaultProvider,
      name: provider?.name || 'Unknown'
    };
  }

  getProviderName(): string {
    const provider = this.providers.get(this.defaultProvider);
    return provider?.name || 'Unknown';
  }

  isConfigured(): boolean {
    const provider = this.providers.get(this.defaultProvider);
    return provider?.isConfigured() ?? false;
  }

  // Get organization-specific SMS provider
  async getOrganizationProvider(organizationId: string): Promise<SMSProvider | null> {
    try {
      // Check cache first
      const cacheKey = `sms_${organizationId}`;
      if (this.organizationProviders.has(cacheKey)) {
        return this.organizationProviders.get(cacheKey) || null;
      }

      // Get from database
      const smsConfig = await prisma.sMSProvider.findFirst({
        where: {
          organizationId,
          isActive: true
        }
      });

      if (!smsConfig) {
        return null;
      }

      // Create provider instance based on type
      let provider: SMSProvider;
      
      switch (smsConfig.providerType) {
        case 'TWILIO':
          provider = new TwilioSMSProvider({
            accountSid: smsConfig.accountSid || '',
            authToken: smsConfig.authToken || '',
            fromNumber: smsConfig.fromNumber || ''
          });
          break;
        case 'AFRICASTALKING':
          provider = new AfricasTalkingSMSProvider({
            apiKey: smsConfig.apiKey || '',
            username: smsConfig.username || '',
            fromNumber: smsConfig.fromNumber || ''
          });
          break;
        default:
          logger.warn(`Unknown SMS provider type: ${smsConfig.providerType}`);
          return null;
      }

      // Cache the provider
      this.organizationProviders.set(cacheKey, provider);
      
      return provider;
    } catch (error) {
      logger.error('Error getting organization SMS provider:', { error, organizationId });
      return null;
    }
  }

  // Clear organization provider cache
  clearOrganizationCache(organizationId: string): void {
    const cacheKey = `sms_${organizationId}`;
    this.organizationProviders.delete(cacheKey);
  }

  // Test organization SMS configuration
  async testOrganizationSMS(organizationId: string, testPhoneNumber: string): Promise<SMSResult> {
    const provider = await this.getOrganizationProvider(organizationId);
    
    if (!provider) {
      return {
        success: false,
        error: {
          message: 'SMS provider not configured for this organization',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      };
    }

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: {
          message: 'SMS provider configuration is incomplete',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      };
    }

    // Send test message
    return provider.sendSMS(testPhoneNumber, 'Test message from MarketSage SMS service');
  }
}

// Export singleton instance for global use
export const smsService = new SMSService();

// Export legacy function for backward compatibility
export async function sendSMS(phoneNumber: string, message: string, organizationId?: string): Promise<SMSResult> {
  return smsService.sendSMS(phoneNumber, message, organizationId);
}