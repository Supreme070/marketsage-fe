import { BaseEmailProvider, type EmailResult, type EmailOptions, type EmailStats, type DomainVerification } from './base-provider';
import { logger } from '@/lib/logger';

interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: 'us' | 'eu'; // Mailgun region
  trackingDomain?: string;
}

export class MailgunEmailProvider extends BaseEmailProvider {
  name = 'Mailgun';
  
  private apiKey: string;
  private domain: string;
  private region: string;
  private trackingDomain?: string;
  private baseUrl: string;

  constructor(config: MailgunConfig) {
    super();
    this.apiKey = config.apiKey;
    this.domain = config.domain;
    this.region = config.region || 'us';
    this.trackingDomain = config.trackingDomain;
    this.baseUrl = this.region === 'eu' 
      ? 'https://api.eu.mailgun.net/v3' 
      : 'https://api.mailgun.net/v3';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate emails
      if (!this.validateEmails(options.to)) {
        return {
          success: false,
          error: {
            message: 'Invalid email address(es)',
            code: 'INVALID_EMAIL'
          }
        };
      }

      if (!this.validateConfig()) {
        return {
          success: false,
          error: {
            message: 'Mailgun configuration is incomplete',
            code: 'INVALID_CONFIG'
          }
        };
      }

      // Prepare recipients
      const recipients = Array.isArray(options.to) ? options.to.join(',') : options.to;

      // Sanitize content
      const sanitizedHtml = this.sanitizeContent(options.html);
      const htmlWithUnsubscribe = this.addUnsubscribeLink(sanitizedHtml, recipients);
      const plainText = options.text || this.generatePlainText(htmlWithUnsubscribe);

      // Prepare form data
      const formData = new FormData();
      formData.append('from', options.fromName 
        ? `${options.fromName} <${options.from}>` 
        : options.from
      );
      formData.append('to', recipients);
      formData.append('subject', options.subject);
      formData.append('html', htmlWithUnsubscribe);
      formData.append('text', plainText);

      if (options.replyTo) {
        formData.append('h:Reply-To', options.replyTo);
      }

      // Add tracking
      formData.append('o:tracking', 'true');
      formData.append('o:tracking-clicks', 'true');
      formData.append('o:tracking-opens', 'true');

      // Add custom variables for tracking
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          formData.append(`v:${key}`, String(value));
        });
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        options.attachments.forEach((attachment, index) => {
          const blob = new Blob([attachment.content], { 
            type: attachment.contentType || 'application/octet-stream' 
          });
          formData.append('attachment', blob, attachment.filename);
        });
      }

      // Send email via Mailgun API
      const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
        },
        body: formData
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error('Mailgun API error:', { 
          status: response.status, 
          statusText: response.statusText,
          error: responseData 
        });
        
        return {
          success: false,
          error: {
            message: responseData.message || 'Mailgun API request failed',
            code: 'MAILGUN_API_ERROR'
          }
        };
      }

      logger.info('Email sent successfully via Mailgun', {
        messageId: responseData.id,
        to: recipients,
        subject: options.subject
      });

      return {
        success: true,
        messageId: responseData.id
      };

    } catch (error) {
      logger.error('Mailgun sending error:', { error, domain: this.domain });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Mailgun sending failed',
          code: 'MAILGUN_ERROR'
        }
      };
    }
  }

  validateConfig(): boolean {
    return !!(this.apiKey && this.domain);
  }

  async getStats(period?: { start: Date; end: Date }): Promise<EmailStats> {
    try {
      if (!this.validateConfig()) {
        return super.getStats(period);
      }

      const endDate = period?.end || new Date();
      const startDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const response = await fetch(
        `${this.baseUrl}/${this.domain}/stats/total?` + 
        `start=${startDate.toISOString().split('T')[0]}&` +
        `end=${endDate.toISOString().split('T')[0]}&` +
        `resolution=day&event=*`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
          }
        }
      );

      if (!response.ok) {
        logger.warn('Failed to fetch Mailgun stats:', { status: response.status });
        return super.getStats(period);
      }

      const data = await response.json();
      const stats = data.stats?.[0] || {};

      return {
        sent: stats.sent?.total || 0,
        delivered: stats.delivered?.total || 0,
        bounced: (stats.bounced?.total || 0) + (stats.dropped?.total || 0),
        opened: stats.opened?.total || 0,
        clicked: stats.clicked?.total || 0,
        unsubscribed: stats.unsubscribed?.total || 0,
        complained: stats.complained?.total || 0,
      };

    } catch (error) {
      logger.error('Error fetching Mailgun stats:', error);
      return super.getStats(period);
    }
  }

  async verifyDomain(domain: string): Promise<DomainVerification> {
    try {
      if (!this.validateConfig()) {
        return {
          verified: false,
          status: 'failed'
        };
      }

      const response = await fetch(`${this.baseUrl}/domains/${domain}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        return {
          verified: false,
          status: 'failed'
        };
      }

      const data = await response.json();
      const domainData = data.domain;

      return {
        verified: domainData.state === 'active',
        spfRecord: domainData.receiving_dns_records?.find((r: any) => r.record_type === 'TXT' && r.name.includes('spf'))?.value,
        dkimRecord: domainData.sending_dns_records?.find((r: any) => r.record_type === 'TXT' && r.name.includes('dkim'))?.value,
        status: domainData.state === 'active' ? 'verified' : 'pending'
      };

    } catch (error) {
      logger.error('Error verifying Mailgun domain:', error);
      return {
        verified: false,
        status: 'failed'
      };
    }
  }

  async setupWebhook(url: string): Promise<void> {
    try {
      if (!this.validateConfig()) {
        throw new Error('Mailgun configuration is incomplete');
      }

      // Set up webhooks for various events
      const events = ['delivered', 'bounced', 'complained', 'unsubscribed', 'clicked', 'opened'];
      
      for (const event of events) {
        const formData = new FormData();
        formData.append('url', `${url}?event=${event}`);

        const response = await fetch(`${this.baseUrl}/domains/${this.domain}/webhooks/${event}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
          },
          body: formData
        });

        if (!response.ok) {
          logger.warn(`Failed to setup ${event} webhook:`, { status: response.status });
        } else {
          logger.info(`Mailgun ${event} webhook configured successfully`);
        }
      }

    } catch (error) {
      logger.error('Error setting up Mailgun webhooks:', error);
      throw error;
    }
  }
}