import type { EmailProvider, EmailOptions, EmailResult, EmailStats } from './base-provider';
import { MailgunEmailProvider } from './mailgun-provider';
import { SendGridEmailProvider } from './sendgrid-provider';
import { SMTPEmailProvider } from './smtp-provider';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

// Email provider types
export type EmailProviderType = 'mailgun' | 'sendgrid' | 'smtp' | 'postmark' | 'ses';

// Encryption utilities
const decrypt = (encryptedText: string): string => {
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
};

// Email service for managing multiple providers per organization
export class EmailService {
  private providers: Map<EmailProviderType, typeof EmailProvider> = new Map();
  private organizationProviders: Map<string, EmailProvider> = new Map();

  constructor() {
    // Register available provider classes
    this.providers.set('mailgun', MailgunEmailProvider as any);
    this.providers.set('sendgrid', SendGridEmailProvider as any);
    this.providers.set('smtp', SMTPEmailProvider as any);
  }

  async sendEmail(
    organizationId: string, 
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      // Get organization-specific provider or fallback to platform default
      const provider = await this.getOrganizationProvider(organizationId);
      
      if (!provider) {
        logger.info('No organization provider found, using platform default email provider', { organizationId });
        // Use platform default provider from the legacy email service
        const { sendOrganizationEmail } = await import('@/lib/email-service');
        const fallbackResult = await sendOrganizationEmail(organizationId, options);
        return {
          success: fallbackResult.success,
          messageId: fallbackResult.messageId,
          error: fallbackResult.error,
          provider: 'platform-default'
        } as EmailResult & { provider: string };
      }

      // Send email using the provider
      const result = await provider.sendEmail(options);
      
      // Add provider info to result for tracking
      return {
        ...result,
        provider: provider.name
      } as EmailResult & { provider: string };

    } catch (error) {
      logger.error('Email service error:', { error, organizationId });
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Email sending failed',
          code: 'EMAIL_SERVICE_ERROR'
        }
      };
    }
  }

  // Get organization-specific email provider
  async getOrganizationProvider(organizationId: string): Promise<EmailProvider | null> {
    try {
      // Check cache first
      const cacheKey = `email_${organizationId}`;
      if (this.organizationProviders.has(cacheKey)) {
        return this.organizationProviders.get(cacheKey) || null;
      }

      // Get from database
      const emailConfig = await prisma.emailProvider.findFirst({
        where: {
          organizationId,
          isActive: true
        }
      });

      if (!emailConfig) {
        return null;
      }

      // Create provider instance based on type
      let provider: EmailProvider;
      
      switch (emailConfig.providerType) {
        case 'mailgun':
          if (!emailConfig.apiKey || !emailConfig.domain) {
            logger.warn('Mailgun configuration incomplete:', { organizationId });
            return null;
          }
          provider = new MailgunEmailProvider({
            apiKey: decrypt(emailConfig.apiKey),
            domain: emailConfig.domain,
            trackingDomain: emailConfig.trackingDomain || undefined
          });
          break;

        case 'sendgrid':
          if (!emailConfig.apiKey) {
            logger.warn('SendGrid configuration incomplete:', { organizationId });
            return null;
          }
          provider = new SendGridEmailProvider({
            apiKey: decrypt(emailConfig.apiKey),
            fromEmail: emailConfig.fromEmail,
            fromName: emailConfig.fromName || undefined,
            trackingDomain: emailConfig.trackingDomain || undefined
          });
          break;

        case 'smtp':
          if (!emailConfig.smtpHost || !emailConfig.smtpUsername || !emailConfig.smtpPassword) {
            logger.warn('SMTP configuration incomplete:', { organizationId });
            return null;
          }
          provider = new SMTPEmailProvider({
            host: emailConfig.smtpHost,
            port: emailConfig.smtpPort || 587,
            secure: emailConfig.smtpSecure,
            username: emailConfig.smtpUsername,
            password: decrypt(emailConfig.smtpPassword),
            fromEmail: emailConfig.fromEmail,
            fromName: emailConfig.fromName || undefined
          });
          break;

        default:
          logger.warn(`Unsupported email provider type: ${emailConfig.providerType}`);
          return null;
      }

      // Cache the provider
      this.organizationProviders.set(cacheKey, provider);
      
      return provider;
    } catch (error) {
      logger.error('Error getting organization email provider:', { error, organizationId });
      return null;
    }
  }

  // Clear organization provider cache
  clearOrganizationCache(organizationId: string): void {
    const cacheKey = `email_${organizationId}`;
    this.organizationProviders.delete(cacheKey);
  }

  // Test organization email configuration
  async testOrganizationEmail(
    organizationId: string, 
    testEmail: string, 
    subject?: string, 
    message?: string
  ): Promise<EmailResult> {
    const provider = await this.getOrganizationProvider(organizationId);
    
    if (!provider) {
      return {
        success: false,
        error: {
          message: 'Email provider not configured for this organization',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      };
    }

    if (!provider.validateConfig()) {
      return {
        success: false,
        error: {
          message: 'Email provider configuration is incomplete',
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

    // Send test email
    return provider.sendEmail({
      to: testEmail,
      from: 'test@marketsage.africa',
      fromName: `${orgName} Test`,
      subject: subject || `${orgName} Email Provider Test`,
      html: message || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Email Provider Test Successful!</h2>
          <p>This is a test email from your ${orgName} email provider configuration.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Organization:</strong> ${orgName}</p>
            <p><strong>Provider:</strong> ${provider.name}</p>
            <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>If you received this email, your email provider is configured correctly!</p>
          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This test was sent from MarketSage platform.<br>
            <a href="https://marketsage.africa">MarketSage - Smart Marketing Solutions</a>
          </p>
        </div>
      `,
      metadata: {
        test: true,
        organizationId,
        provider: provider.name
      }
    });
  }

  // Get stats for organization's email provider
  async getOrganizationStats(
    organizationId: string,
    period?: { start: Date; end: Date }
  ): Promise<EmailStats | null> {
    const provider = await this.getOrganizationProvider(organizationId);
    
    if (!provider || !provider.getStats) {
      return null;
    }

    try {
      return await provider.getStats(period);
    } catch (error) {
      logger.error('Error getting email stats:', { error, organizationId });
      return null;
    }
  }

  // Setup webhook for organization's email provider
  async setupOrganizationWebhook(
    organizationId: string,
    webhookUrl: string
  ): Promise<boolean> {
    const provider = await this.getOrganizationProvider(organizationId);
    
    if (!provider || !provider.setupWebhook) {
      return false;
    }

    try {
      await provider.setupWebhook(webhookUrl);
      return true;
    } catch (error) {
      logger.error('Error setting up webhook:', { error, organizationId });
      return false;
    }
  }

  // Get available provider types
  getAvailableProviders(): EmailProviderType[] {
    return Array.from(this.providers.keys());
  }

  // Validate provider configuration before saving
  validateProviderConfig(providerType: EmailProviderType, config: any): boolean {
    switch (providerType) {
      case 'mailgun':
        return !!(config.apiKey && config.domain);
      case 'sendgrid':
        return !!(config.apiKey);
      case 'smtp':
        return !!(config.smtpHost && config.smtpUsername && config.smtpPassword);
      default:
        return false;
    }
  }
}

// Export singleton instance for global use
export const emailService = new EmailService();

// Export legacy function for backward compatibility
export async function sendOrganizationEmail(
  organizationId: string,
  options: EmailOptions
): Promise<EmailResult> {
  return emailService.sendEmail(organizationId, options);
}