import { BaseEmailProvider, type EmailResult, type EmailOptions, type EmailStats, type DomainVerification } from './base-provider';
import { logger } from '@/lib/logger';

interface SendGridConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
  trackingDomain?: string;
}

export class SendGridEmailProvider extends BaseEmailProvider {
  name = 'SendGrid';
  
  private apiKey: string;
  private defaultFromEmail?: string;
  private defaultFromName?: string;
  private trackingDomain?: string;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor(config: SendGridConfig) {
    super();
    this.apiKey = config.apiKey;
    this.defaultFromEmail = config.fromEmail;
    this.defaultFromName = config.fromName;
    this.trackingDomain = config.trackingDomain;
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
            message: 'SendGrid configuration is incomplete',
            code: 'INVALID_CONFIG'
          }
        };
      }

      // Prepare recipients
      const recipients = Array.isArray(options.to) 
        ? options.to.map(email => ({ email }))
        : [{ email: options.to }];

      // Sanitize content
      const sanitizedHtml = this.sanitizeContent(options.html);
      const htmlWithUnsubscribe = this.addUnsubscribeLink(sanitizedHtml, options.to.toString());
      const plainText = options.text || this.generatePlainText(htmlWithUnsubscribe);

      // Prepare email data
      const emailData = {
        personalizations: [{
          to: recipients,
          subject: options.subject,
          ...(options.metadata && {
            custom_args: options.metadata
          })
        }],
        from: {
          email: options.from || this.defaultFromEmail,
          name: options.fromName || this.defaultFromName || 'MarketSage'
        },
        content: [
          {
            type: 'text/plain',
            value: plainText
          },
          {
            type: 'text/html',
            value: htmlWithUnsubscribe
          }
        ],
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: true
          },
          open_tracking: {
            enable: true,
            substitution_tag: '%opentrack%'
          },
          subscription_tracking: {
            enable: true
          }
        }
      };

      // Add reply-to if specified
      if (options.replyTo) {
        (emailData as any).reply_to = {
          email: options.replyTo
        };
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        (emailData as any).attachments = options.attachments.map(attachment => ({
          content: Buffer.from(attachment.content).toString('base64'),
          filename: attachment.filename,
          type: attachment.contentType || 'application/octet-stream',
          disposition: 'attachment'
        }));
      }

      // Send email via SendGrid API
      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      // SendGrid returns empty body on success
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        logger.error('SendGrid API error:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorData 
        });
        
        return {
          success: false,
          error: {
            message: errorData.errors?.[0]?.message || errorData.message || 'SendGrid API request failed',
            code: 'SENDGRID_API_ERROR'
          }
        };
      }

      // Get message ID from response headers
      const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Email sent successfully via SendGrid', {
        messageId,
        to: options.to,
        subject: options.subject
      });

      return {
        success: true,
        messageId
      };

    } catch (error) {
      logger.error('SendGrid sending error:', { error });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'SendGrid sending failed',
          code: 'SENDGRID_ERROR'
        }
      };
    }
  }

  validateConfig(): boolean {
    return !!(this.apiKey);
  }

  async getStats(period?: { start: Date; end: Date }): Promise<EmailStats> {
    try {
      if (!this.validateConfig()) {
        return super.getStats(period);
      }

      const endDate = period?.end || new Date();
      const startDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const response = await fetch(
        `${this.baseUrl}/stats?` + 
        `start_date=${startDate.toISOString().split('T')[0]}&` +
        `end_date=${endDate.toISOString().split('T')[0]}&` +
        `aggregated_by=day`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        logger.warn('Failed to fetch SendGrid stats:', { status: response.status });
        return super.getStats(period);
      }

      const data = await response.json();
      const stats = data[0]?.stats || [];

      // Aggregate stats across all days
      const totals = stats.reduce((acc: any, day: any) => {
        const metrics = day.metrics;
        return {
          blocks: (acc.blocks || 0) + (metrics.blocks || 0),
          bounce_drops: (acc.bounce_drops || 0) + (metrics.bounce_drops || 0),
          bounces: (acc.bounces || 0) + (metrics.bounces || 0),
          clicks: (acc.clicks || 0) + (metrics.clicks || 0),
          deferred: (acc.deferred || 0) + (metrics.deferred || 0),
          delivered: (acc.delivered || 0) + (metrics.delivered || 0),
          invalid_emails: (acc.invalid_emails || 0) + (metrics.invalid_emails || 0),
          opens: (acc.opens || 0) + (metrics.opens || 0),
          processed: (acc.processed || 0) + (metrics.processed || 0),
          requests: (acc.requests || 0) + (metrics.requests || 0),
          spam_report_drops: (acc.spam_report_drops || 0) + (metrics.spam_report_drops || 0),
          spam_reports: (acc.spam_reports || 0) + (metrics.spam_reports || 0),
          unique_clicks: (acc.unique_clicks || 0) + (metrics.unique_clicks || 0),
          unique_opens: (acc.unique_opens || 0) + (metrics.unique_opens || 0),
          unsubscribe_drops: (acc.unsubscribe_drops || 0) + (metrics.unsubscribe_drops || 0),
          unsubscribes: (acc.unsubscribes || 0) + (metrics.unsubscribes || 0)
        };
      }, {});

      return {
        sent: totals.requests || 0,
        delivered: totals.delivered || 0,
        bounced: (totals.bounces || 0) + (totals.blocks || 0),
        opened: totals.unique_opens || 0,
        clicked: totals.unique_clicks || 0,
        unsubscribed: totals.unsubscribes || 0,
        complained: totals.spam_reports || 0,
      };

    } catch (error) {
      logger.error('Error fetching SendGrid stats:', error);
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

      // SendGrid uses domain authentication
      const response = await fetch(`${this.baseUrl}/whitelabel/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return {
          verified: false,
          status: 'failed'
        };
      }

      const domains = await response.json();
      const domainData = domains.find((d: any) => d.domain === domain);

      if (!domainData) {
        return {
          verified: false,
          status: 'failed'
        };
      }

      return {
        verified: domainData.valid,
        status: domainData.valid ? 'verified' : 'pending'
      };

    } catch (error) {
      logger.error('Error verifying SendGrid domain:', error);
      return {
        verified: false,
        status: 'failed'
      };
    }
  }

  async setupWebhook(url: string): Promise<void> {
    try {
      if (!this.validateConfig()) {
        throw new Error('SendGrid configuration is incomplete');
      }

      const webhookData = {
        enabled: true,
        url: url,
        group_resubscribe: true,
        delivered: true,
        group_unsubscribe: true,
        spam_report: true,
        bounce: true,
        deferred: true,
        unsubscribe: true,
        processed: true,
        open: true,
        click: true,
        dropped: true
      };

      const response = await fetch(`${this.baseUrl}/user/webhooks/event/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid webhook setup failed: ${error}`);
      }

      logger.info('SendGrid webhook configured successfully');

    } catch (error) {
      logger.error('Error setting up SendGrid webhooks:', error);
      throw error;
    }
  }
}