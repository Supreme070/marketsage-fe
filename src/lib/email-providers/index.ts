/**
 * Email providers index
 * Exports all email provider classes and utilities
 */

export { EmailProvider } from './base-provider';
export { MailgunEmailProvider } from './mailgun-provider';
export { SendGridEmailProvider } from './sendgrid-provider';
export { SMTPEmailProvider } from './smtp-provider';
export { PostmarkEmailProvider } from './postmark-provider';
export { EmailService, emailService } from './email-service';

import { EmailProvider } from './base-provider';
import { MailgunEmailProvider } from './mailgun-provider';
import { SendGridEmailProvider } from './sendgrid-provider';
import { SMTPEmailProvider } from './smtp-provider';
import { PostmarkEmailProvider } from './postmark-provider';

/**
 * Create a master email provider instance for platform-managed messaging
 */
export function createMasterEmailProvider(
  providerType: string,
  config: {
    apiKey: string;
    domain?: string;
    fromEmail?: string;
    fromName?: string;
  }
): EmailProvider {
  switch (providerType) {
    case 'mailgun':
      if (!config.domain) {
        throw new Error('Mailgun domain is required');
      }
      return new MailgunEmailProvider({
        apiKey: config.apiKey,
        domain: config.domain,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      });

    case 'sendgrid':
      return new SendGridEmailProvider({
        apiKey: config.apiKey,
        fromEmail: config.fromEmail || 'noreply@marketsage.africa',
        fromName: config.fromName || 'MarketSage',
      });

    case 'postmark':
      return new PostmarkEmailProvider({
        apiKey: config.apiKey,
        fromEmail: config.fromEmail || 'noreply@marketsage.africa',
        fromName: config.fromName || 'MarketSage',
      });

    case 'smtp':
      return new SMTPEmailProvider({
        host: 'smtp.marketsage.africa', // Default SMTP host
        port: 587,
        secure: false,
        username: config.fromEmail || 'noreply@marketsage.africa',
        password: config.apiKey, // Use API key as password
        fromEmail: config.fromEmail || 'noreply@marketsage.africa',
        fromName: config.fromName || 'MarketSage',
      });

    default:
      throw new Error(`Unsupported email provider: ${providerType}`);
  }
}

/**
 * Get available email provider types
 */
export function getAvailableEmailProviders(): string[] {
  return ['mailgun', 'sendgrid', 'postmark', 'smtp'];
}

/**
 * Validate email provider configuration
 */
export function validateEmailProviderConfig(providerType: string, config: any): boolean {
  switch (providerType) {
    case 'mailgun':
      return !!(config.apiKey && config.domain);
    case 'sendgrid':
      return !!(config.apiKey);
    case 'postmark':
      return !!(config.apiKey);
    case 'smtp':
      return !!(config.host && config.username && config.password);
    default:
      return false;
  }
}