/**
 * Postmark Email Provider
 * Provides email sending capabilities using Postmark API
 */

import type { EmailProvider, EmailOptions, EmailResult, EmailStats } from './base-provider';
import { logger } from '@/lib/logger';

export interface PostmarkConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
  trackOpens?: boolean;
  trackLinks?: boolean;
  trackingDomain?: string;
}

export class PostmarkEmailProvider implements EmailProvider {
  public readonly name = 'Postmark';
  private config: PostmarkConfig;

  constructor(config: PostmarkConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: {
            message: 'Postmark provider not properly configured',
            code: 'PROVIDER_NOT_CONFIGURED'
          }
        };
      }

      const payload = {
        From: options.fromName 
          ? `${options.fromName} <${options.from || this.config.fromEmail}>` 
          : (options.from || this.config.fromEmail),
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
        ReplyTo: options.replyTo,
        Cc: options.cc?.join(','),
        Bcc: options.bcc?.join(','),
        Tag: options.metadata?.tag || 'marketsage',
        TrackOpens: this.config.trackOpens ?? true,
        TrackLinks: this.config.trackLinks ? 'HtmlAndText' : 'None',
        Headers: options.headers ? Object.entries(options.headers).map(([Name, Value]) => ({ Name, Value })) : undefined,
        Attachments: options.attachments?.map(attachment => ({
          Name: attachment.filename,
          Content: attachment.content,
          ContentType: attachment.contentType,
          ContentID: attachment.cid
        }))
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof typeof payload] === undefined) {
          delete payload[key as keyof typeof payload];
        }
      });

      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error('Postmark API error:', {
          status: response.status,
          error: responseData
        });

        return {
          success: false,
          error: {
            message: responseData.Message || 'Postmark API error',
            code: responseData.ErrorCode?.toString() || 'POSTMARK_ERROR'
          }
        };
      }

      return {
        success: true,
        messageId: responseData.MessageID,
        metadata: {
          to: responseData.To,
          submittedAt: responseData.SubmittedAt,
          provider: 'postmark'
        }
      };

    } catch (error) {
      logger.error('Postmark send error:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown Postmark error',
          code: 'POSTMARK_SEND_ERROR'
        }
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.fromEmail);
  }

  validateConfig(): boolean {
    return this.isConfigured();
  }

  async getStats(period?: { start: Date; end: Date }): Promise<EmailStats | null> {
    try {
      if (!this.isConfigured()) {
        return null;
      }

      const fromDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = period?.end || new Date();

      // Get outbound message stats
      const statsResponse = await fetch(
        `https://api.postmarkapp.com/stats/outbound?fromdate=${fromDate.toISOString().split('T')[0]}&todate=${toDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Postmark-Server-Token': this.config.apiKey,
          }
        }
      );

      if (!statsResponse.ok) {
        logger.warn('Failed to fetch Postmark stats:', statsResponse.status);
        return null;
      }

      const statsData = await statsResponse.json();

      // Get bounce stats
      const bounceResponse = await fetch(
        `https://api.postmarkapp.com/bounces?count=500&offset=0&fromdate=${fromDate.toISOString().split('T')[0]}&todate=${toDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Postmark-Server-Token': this.config.apiKey,
          }
        }
      );

      let bounces = 0;
      if (bounceResponse.ok) {
        const bounceData = await bounceResponse.json();
        bounces = bounceData.TotalCount || 0;
      }

      return {
        sent: statsData.Sent || 0,
        delivered: (statsData.Sent || 0) - bounces,
        bounced: bounces,
        complaints: 0, // Postmark doesn't provide spam complaints in basic stats
        opens: 0, // Would need to call separate opens API
        clicks: 0, // Would need to call separate clicks API
        period: {
          start: fromDate,
          end: toDate
        }
      };

    } catch (error) {
      logger.error('Error fetching Postmark stats:', error);
      return null;
    }
  }

  async setupWebhook(webhookUrl: string): Promise<void> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Postmark provider not configured');
      }

      const payload = {
        Url: webhookUrl,
        MessageStream: 'outbound',
        HttpAuth: {
          Username: 'marketsage',
          Password: Math.random().toString(36).substring(2, 15)
        },
        HttpHeaders: [
          {
            Name: 'X-Source',
            Value: 'MarketSage'
          }
        ],
        Triggers: {
          Open: {
            Enabled: true,
            PostFirstOpenOnly: false
          },
          Click: {
            Enabled: true
          },
          Delivery: {
            Enabled: true
          },
          Bounce: {
            Enabled: true,
            IncludeContent: true
          },
          SpamComplaint: {
            Enabled: true,
            IncludeContent: true
          }
        }
      };

      const response = await fetch('https://api.postmarkapp.com/webhooks', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to setup Postmark webhook: ${errorData.Message}`);
      }

      logger.info('Postmark webhook configured successfully', { webhookUrl });

    } catch (error) {
      logger.error('Error setting up Postmark webhook:', error);
      throw error;
    }
  }

  /**
   * Verify domain configuration
   */
  async verifyDomain(domain: string): Promise<{ verified: boolean; records: any[] }> {
    try {
      const response = await fetch(`https://api.postmarkapp.com/domains/${domain}`, {
        headers: {
          'Accept': 'application/json',
          'X-Postmark-Server-Token': this.config.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify domain');
      }

      const domainData = await response.json();

      return {
        verified: domainData.DKIMVerified && domainData.SPFVerified,
        records: [
          {
            type: 'DKIM',
            verified: domainData.DKIMVerified,
            value: domainData.DKIMTextValue
          },
          {
            type: 'SPF',
            verified: domainData.SPFVerified,
            value: 'include:spf.postmarkapp.com'
          },
          {
            type: 'Return-Path',
            verified: domainData.ReturnPathDomainVerified,
            value: domainData.ReturnPathDomainCNAMEValue
          }
        ]
      };

    } catch (error) {
      logger.error('Error verifying Postmark domain:', error);
      return {
        verified: false,
        records: []
      };
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(messageId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.postmarkapp.com/messages/outbound/${messageId}/details`, {
        headers: {
          'Accept': 'application/json',
          'X-Postmark-Server-Token': this.config.apiKey,
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();

    } catch (error) {
      logger.error('Error fetching Postmark delivery stats:', error);
      return null;
    }
  }
}