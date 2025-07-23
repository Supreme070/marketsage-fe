import { BaseEmailProvider, type EmailResult, type EmailOptions, type EmailStats } from './base-provider';
import { logger } from '@/lib/logger';
import nodemailer from 'nodemailer';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
}

export class SMTPEmailProvider extends BaseEmailProvider {
  name = 'SMTP';
  
  private config: SMTPConfig;
  private transporter: any;

  constructor(config: SMTPConfig) {
    super();
    this.config = config;
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14 // Max 14 messages per second
    });
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
            message: 'SMTP configuration is incomplete',
            code: 'INVALID_CONFIG'
          }
        };
      }

      // Verify SMTP connection
      await this.transporter.verify();

      // Prepare recipients
      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      // Sanitize content
      const sanitizedHtml = this.sanitizeContent(options.html);
      const htmlWithUnsubscribe = this.addUnsubscribeLink(sanitizedHtml, recipients);
      const plainText = options.text || this.generatePlainText(htmlWithUnsubscribe);

      // Prepare mail options
      const mailOptions = {
        from: options.fromName 
          ? `"${options.fromName}" <${options.from || this.config.fromEmail}>` 
          : options.from || this.config.fromEmail,
        to: recipients,
        subject: options.subject,
        html: htmlWithUnsubscribe,
        text: plainText,
        replyTo: options.replyTo,
        headers: {
          'X-Mailer': 'MarketSage Email Platform',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'List-Unsubscribe': `<mailto:unsubscribe@marketsage.africa>, <https://marketsage.africa/unsubscribe?email=${encodeURIComponent(recipients)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Return-Path': this.config.username,
          'Message-ID': `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@marketsage.africa>`,
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
          'Precedence': 'bulk',
          'X-Spam-Status': 'No',
          'X-Entity-ID': 'MarketSage-Platform',
          'Organization': 'MarketSage - Smart Marketing Solutions',
        },
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully via SMTP', {
        messageId: info.messageId,
        to: recipients,
        subject: options.subject,
        smtpHost: this.config.host,
        response: info.response
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      logger.error('SMTP sending error:', { 
        error: error instanceof Error ? error.message : error,
        smtpHost: this.config.host,
        smtpPort: this.config.port
      });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'SMTP sending failed',
          code: 'SMTP_ERROR'
        }
      };
    }
  }

  validateConfig(): boolean {
    return !!(
      this.config.host &&
      this.config.port &&
      this.config.username &&
      this.config.password
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.validateConfig()) {
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP connection test failed:', error);
      return false;
    }
  }

  async getStats(period?: { start: Date; end: Date }): Promise<EmailStats> {
    // SMTP doesn't provide built-in analytics
    // This would need to be implemented by tracking sent emails in the database
    return super.getStats(period);
  }

  // Close the SMTP connection pool
  close(): void {
    if (this.transporter) {
      this.transporter.close();
    }
  }

  // Get SMTP server capabilities
  async getCapabilities(): Promise<string[]> {
    try {
      // This is a simplified version - you might want to extend this
      // to actually check SMTP server capabilities
      return [
        'STARTTLS',
        'AUTH LOGIN',
        'AUTH PLAIN',
        '8BITMIME',
        'SIZE'
      ];
    } catch (error) {
      logger.error('Error getting SMTP capabilities:', error);
      return [];
    }
  }
}