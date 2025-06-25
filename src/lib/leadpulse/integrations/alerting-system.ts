/**
 * LeadPulse External Alerting System
 * 
 * Provides real-time alerting through multiple channels:
 * - Email notifications
 * - Slack integration
 * - Microsoft Teams
 * - SMS alerts (Twilio)
 * - Discord webhooks
 * - PagerDuty integration
 */

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import { type ErrorRecord, ErrorSeverity } from '../error-handler';
import nodemailer from 'nodemailer';

// Alert Types
export interface Alert {
  id: string;
  type: 'ERROR' | 'VISITOR_SPIKE' | 'CONVERSION_DROP' | 'HIGH_VALUE_VISITOR' | 'SYSTEM_HEALTH' | 'SECURITY_INCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  channels: AlertChannel[];
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export type AlertChannel = 'email' | 'slack' | 'teams' | 'sms' | 'discord' | 'pagerduty';

export interface AlertConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    templates: {
      subject: string;
      body: string;
    };
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    username?: string;
    iconEmoji?: string;
    mentionUsers?: string[];
  };
  teams?: {
    enabled: boolean;
    webhookUrl: string;
    adaptiveCard?: boolean;
  };
  sms?: {
    enabled: boolean;
    provider: 'twilio' | 'aws_sns';
    config: {
      accountSid?: string;
      authToken?: string;
      fromNumber?: string;
      awsAccessKey?: string;
      awsSecretKey?: string;
      awsRegion?: string;
    };
    recipients: string[];
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
  };
  pagerduty?: {
    enabled: boolean;
    routingKey: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
  };
}

export class AlertingSystem {
  private config: AlertConfig;
  private emailTransporter: nodemailer.Transporter | null = null;
  private alertQueue: Alert[] = [];
  private maxQueueSize = 1000;

  constructor(config: AlertConfig) {
    this.config = config;
    this.initializeServices();
    this.startAlertProcessor();
  }

  private async initializeServices() {
    // Initialize email transporter
    if (this.config.email?.enabled && this.config.email.smtpConfig) {
      try {
        this.emailTransporter = nodemailer.createTransporter(this.config.email.smtpConfig);
        await this.emailTransporter.verify();
        logger.info('Email alerting service initialized');
      } catch (error) {
        logger.error('Failed to initialize email alerting:', error);
      }
    }
  }

  // Send alert through specified channels
  async sendAlert(alert: Alert): Promise<{ success: boolean; results: Record<AlertChannel, boolean> }> {
    const results: Record<AlertChannel, boolean> = {} as any;

    // Add to queue for processing
    this.addToQueue(alert);

    // Send through each configured channel
    for (const channel of alert.channels) {
      try {
        switch (channel) {
          case 'email':
            results[channel] = await this.sendEmailAlert(alert);
            break;
          case 'slack':
            results[channel] = await this.sendSlackAlert(alert);
            break;
          case 'teams':
            results[channel] = await this.sendTeamsAlert(alert);
            break;
          case 'sms':
            results[channel] = await this.sendSMSAlert(alert);
            break;
          case 'discord':
            results[channel] = await this.sendDiscordAlert(alert);
            break;
          case 'pagerduty':
            results[channel] = await this.sendPagerDutyAlert(alert);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}:`, error);
        results[channel] = false;
      }
    }

    const success = Object.values(results).some(result => result);
    
    // Store alert in cache
    await this.storeAlert(alert, results);

    logger.info(`Alert sent: ${alert.id}`, { channels: alert.channels, results });
    return { success, results };
  }

  // Email alerting
  private async sendEmailAlert(alert: Alert): Promise<boolean> {
    if (!this.config.email?.enabled || !this.emailTransporter) {
      return false;
    }

    try {
      const subject = this.config.email.templates.subject
        .replace('{severity}', alert.severity)
        .replace('{title}', alert.title)
        .replace('{timestamp}', alert.timestamp.toISOString());

      const htmlBody = this.generateEmailHTML(alert);

      await this.emailTransporter.sendMail({
        from: this.config.email.smtpConfig.auth.user,
        to: this.config.email.recipients.join(', '),
        subject,
        html: htmlBody,
      });

      return true;
    } catch (error) {
      logger.error('Email alert failed:', error);
      return false;
    }
  }

  // Slack alerting
  private async sendSlackAlert(alert: Alert): Promise<boolean> {
    if (!this.config.slack?.enabled || !this.config.slack.webhookUrl) {
      return false;
    }

    try {
      const color = this.getSeverityColor(alert.severity);
      const mentions = this.config.slack.mentionUsers?.map(user => `<@${user}>`).join(' ') || '';

      const slackMessage = {
        channel: this.config.slack.channel,
        username: this.config.slack.username || 'LeadPulse Alerts',
        icon_emoji: this.config.slack.iconEmoji || ':warning:',
        text: mentions,
        attachments: [
          {
            color,
            title: `${alert.severity} Alert: ${alert.title}`,
            text: alert.message,
            fields: [
              {
                title: 'Alert Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Timestamp',
                value: alert.timestamp.toISOString(),
                short: true,
              },
              ...(alert.data ? Object.entries(alert.data).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              })) : []),
            ],
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      };

      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      return response.ok;
    } catch (error) {
      logger.error('Slack alert failed:', error);
      return false;
    }
  }

  // Microsoft Teams alerting
  private async sendTeamsAlert(alert: Alert): Promise<boolean> {
    if (!this.config.teams?.enabled || !this.config.teams.webhookUrl) {
      return false;
    }

    try {
      const color = this.getSeverityColor(alert.severity);
      
      let teamsMessage: any;

      if (this.config.teams.adaptiveCard) {
        // Adaptive Card format
        teamsMessage = {
          type: 'message',
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                type: 'AdaptiveCard',
                version: '1.2',
                body: [
                  {
                    type: 'TextBlock',
                    text: `${alert.severity} Alert`,
                    weight: 'Bolder',
                    size: 'Medium',
                    color: alert.severity === 'CRITICAL' ? 'Attention' : 'Warning',
                  },
                  {
                    type: 'TextBlock',
                    text: alert.title,
                    weight: 'Bolder',
                  },
                  {
                    type: 'TextBlock',
                    text: alert.message,
                    wrap: true,
                  },
                  {
                    type: 'FactSet',
                    facts: [
                      {
                        title: 'Type:',
                        value: alert.type,
                      },
                      {
                        title: 'Timestamp:',
                        value: alert.timestamp.toISOString(),
                      },
                      ...(alert.data ? Object.entries(alert.data).map(([key, value]) => ({
                        title: `${key}:`,
                        value: String(value),
                      })) : []),
                    ],
                  },
                ],
              },
            },
          ],
        };
      } else {
        // Simple message format
        teamsMessage = {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: `${alert.severity} Alert: ${alert.title}`,
          themeColor: color.replace('#', ''),
          title: `${alert.severity} Alert`,
          text: alert.message,
          sections: [
            {
              activityTitle: alert.title,
              activitySubtitle: alert.type,
              facts: [
                {
                  name: 'Timestamp',
                  value: alert.timestamp.toISOString(),
                },
                ...(alert.data ? Object.entries(alert.data).map(([key, value]) => ({
                  name: key,
                  value: String(value),
                })) : []),
              ],
            },
          ],
        };
      }

      const response = await fetch(this.config.teams.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      });

      return response.ok;
    } catch (error) {
      logger.error('Teams alert failed:', error);
      return false;
    }
  }

  // SMS alerting
  private async sendSMSAlert(alert: Alert): Promise<boolean> {
    if (!this.config.sms?.enabled || !this.config.sms.recipients.length) {
      return false;
    }

    try {
      const message = `${alert.severity} Alert: ${alert.title}\n${alert.message}`;

      if (this.config.sms.provider === 'twilio') {
        return await this.sendTwilioSMS(message);
      } else if (this.config.sms.provider === 'aws_sns') {
        return await this.sendAWSSNS(message);
      }

      return false;
    } catch (error) {
      logger.error('SMS alert failed:', error);
      return false;
    }
  }

  // Discord alerting
  private async sendDiscordAlert(alert: Alert): Promise<boolean> {
    if (!this.config.discord?.enabled || !this.config.discord.webhookUrl) {
      return false;
    }

    try {
      const color = Number.parseInt(this.getSeverityColor(alert.severity).replace('#', ''), 16);

      const discordMessage = {
        username: this.config.discord.username || 'LeadPulse Alerts',
        avatar_url: this.config.discord.avatarUrl,
        embeds: [
          {
            title: `${alert.severity} Alert: ${alert.title}`,
            description: alert.message,
            color,
            fields: [
              {
                name: 'Type',
                value: alert.type,
                inline: true,
              },
              {
                name: 'Timestamp',
                value: alert.timestamp.toISOString(),
                inline: true,
              },
              ...(alert.data ? Object.entries(alert.data).slice(0, 10).map(([key, value]) => ({
                name: key,
                value: String(value),
                inline: true,
              })) : []),
            ],
            timestamp: alert.timestamp.toISOString(),
          },
        ],
      };

      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessage),
      });

      return response.ok;
    } catch (error) {
      logger.error('Discord alert failed:', error);
      return false;
    }
  }

  // PagerDuty alerting
  private async sendPagerDutyAlert(alert: Alert): Promise<boolean> {
    if (!this.config.pagerduty?.enabled || !this.config.pagerduty.routingKey) {
      return false;
    }

    try {
      const pagerDutyEvent = {
        routing_key: this.config.pagerduty.routingKey,
        event_action: 'trigger',
        dedup_key: alert.id,
        payload: {
          summary: `${alert.severity} Alert: ${alert.title}`,
          source: 'LeadPulse',
          severity: this.config.pagerduty.severity,
          component: 'leadpulse',
          group: alert.type.toLowerCase(),
          class: alert.severity.toLowerCase(),
          custom_details: {
            message: alert.message,
            alert_type: alert.type,
            timestamp: alert.timestamp.toISOString(),
            ...alert.data,
          },
        },
      };

      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagerDutyEvent),
      });

      return response.ok;
    } catch (error) {
      logger.error('PagerDuty alert failed:', error);
      return false;
    }
  }

  // Twilio SMS implementation
  private async sendTwilioSMS(message: string): Promise<boolean> {
    if (!this.config.sms?.config.accountSid || !this.config.sms?.config.authToken) {
      return false;
    }

    try {
      const auth = Buffer.from(
        `${this.config.sms.config.accountSid}:${this.config.sms.config.authToken}`
      ).toString('base64');

      for (const recipient of this.config.sms.recipients) {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.config.sms.config.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: this.config.sms.config.fromNumber!,
              To: recipient,
              Body: message,
            }),
          }
        );

        if (!response.ok) {
          logger.error(`Failed to send SMS to ${recipient}:`, await response.text());
        }
      }

      return true;
    } catch (error) {
      logger.error('Twilio SMS failed:', error);
      return false;
    }
  }

  // AWS SNS implementation
  private async sendAWSSNS(message: string): Promise<boolean> {
    // Implementation would require AWS SDK
    // For now, return false to indicate not implemented
    logger.warn('AWS SNS SMS not implemented yet');
    return false;
  }

  // Helper methods
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '#FF0000';
      case 'HIGH': return '#FF8000';
      case 'MEDIUM': return '#FFFF00';
      case 'LOW': return '#00FF00';
      default: return '#808080';
    }
  }

  private generateEmailHTML(alert: Alert): string {
    const color = this.getSeverityColor(alert.severity);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; background: ${color}; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 LeadPulse Alert</h1>
            <span class="severity">${alert.severity}</span>
          </div>
          <div class="content">
            <h2>${alert.title}</h2>
            <p>${alert.message}</p>
            
            <div class="alert-details">
              <h3>Alert Details</h3>
              <p><strong>Type:</strong> ${alert.type}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
              <p><strong>Alert ID:</strong> ${alert.id}</p>
              ${alert.data ? Object.entries(alert.data).map(([key, value]) => 
                `<p><strong>${key}:</strong> ${value}</p>`
              ).join('') : ''}
            </div>
            
            <p>This alert was automatically generated by LeadPulse monitoring system.</p>
          </div>
          <div class="footer">
            <p>LeadPulse - Visitor Intelligence Platform</p>
            <p>Generated at ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Queue management
  private addToQueue(alert: Alert): void {
    if (this.alertQueue.length >= this.maxQueueSize) {
      this.alertQueue.shift();
    }
    this.alertQueue.push(alert);
  }

  private async storeAlert(alert: Alert, results: Record<AlertChannel, boolean>): Promise<void> {
    try {
      const cacheKey = `leadpulse:alerts:${alert.id}`;
      await leadPulseCache.set(cacheKey, { ...alert, deliveryResults: results }, 24 * 60 * 60);
      await leadPulseCache.addRecentActivity({
        type: 'ALERT_SENT',
        alertId: alert.id,
        severity: alert.severity,
        channels: alert.channels,
        timestamp: alert.timestamp,
      });
    } catch (error) {
      logger.error('Failed to store alert:', error);
    }
  }

  // Alert processor for queued alerts
  private startAlertProcessor(): void {
    setInterval(() => {
      this.processAlertQueue();
    }, 10000); // Process every 10 seconds
  }

  private processAlertQueue(): void {
    // Process any failed alerts for retry
    // Implementation for retry logic
    logger.debug(`Alert queue size: ${this.alertQueue.length}`);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      const cacheKey = `leadpulse:alerts:${alertId}`;
      const alert = await leadPulseCache.get(cacheKey);
      
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();
        
        await leadPulseCache.set(cacheKey, alert, 24 * 60 * 60);
        logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error);
      return false;
    }
  }

  // Get alert history
  async getAlertHistory(hours = 24): Promise<Alert[]> {
    try {
      const alerts = await leadPulseCache.lrange('leadpulse:alerts:list', 0, 100);
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return alerts.filter(alert => new Date(alert.timestamp) > cutoff);
    } catch (error) {
      logger.error('Failed to get alert history:', error);
      return [];
    }
  }
}

// Predefined alert templates
export const AlertTemplates = {
  ERROR_ALERT: (error: ErrorRecord): Omit<Alert, 'id' | 'timestamp'> => ({
    type: 'ERROR',
    severity: error.severity.toUpperCase() as Alert['severity'],
    title: `System Error: ${error.type}`,
    message: error.message,
    data: {
      errorId: error.id,
      errorType: error.type,
      context: error.context,
      retryCount: error.retryCount,
    },
    channels: error.severity === ErrorSeverity.CRITICAL 
      ? ['email', 'slack', 'pagerduty'] 
      : ['slack'],
  }),

  VISITOR_SPIKE: (count: number, threshold: number): Omit<Alert, 'id' | 'timestamp'> => ({
    type: 'VISITOR_SPIKE',
    severity: 'MEDIUM',
    title: 'Unusual Visitor Activity Detected',
    message: `Visitor count (${count}) has exceeded the threshold (${threshold}) indicating unusual traffic patterns.`,
    data: { visitorCount: count, threshold },
    channels: ['slack', 'email'],
  }),

  HIGH_VALUE_VISITOR: (visitorId: string, score: number): Omit<Alert, 'id' | 'timestamp'> => ({
    type: 'HIGH_VALUE_VISITOR',
    severity: 'HIGH',
    title: 'High-Value Visitor Detected',
    message: `A visitor with high engagement score (${score}) has been identified. Consider immediate outreach.`,
    data: { visitorId, score },
    channels: ['slack', 'email'],
  }),

  CONVERSION_DROP: (currentRate: number, previousRate: number): Omit<Alert, 'id' | 'timestamp'> => ({
    type: 'CONVERSION_DROP',
    severity: 'HIGH',
    title: 'Conversion Rate Drop Alert',
    message: `Conversion rate has dropped from ${previousRate}% to ${currentRate}%. Immediate attention required.`,
    data: { currentRate, previousRate, dropPercentage: ((previousRate - currentRate) / previousRate * 100).toFixed(2) },
    channels: ['email', 'slack', 'teams'],
  }),

  SECURITY_INCIDENT: (incidentType: string, details: any): Omit<Alert, 'id' | 'timestamp'> => ({
    type: 'SECURITY_INCIDENT',
    severity: 'CRITICAL',
    title: `Security Incident: ${incidentType}`,
    message: `A security incident has been detected and requires immediate attention.`,
    data: { incidentType, ...details },
    channels: ['email', 'slack', 'pagerduty', 'sms'],
  }),
};

// Generate unique alert ID
export function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}