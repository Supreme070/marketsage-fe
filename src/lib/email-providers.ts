// Email provider interface for easy switching
export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  sendBulkEmail?(emails: EmailOptions[]): Promise<EmailResult[]>;
}

export interface EmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: any[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

// Postmark Provider (Recommended)
class PostmarkProvider implements EmailProvider {
  constructor(private serverToken: string) {}

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.serverToken,
        },
        body: JSON.stringify({
          From: options.from,
          To: Array.isArray(options.to) ? options.to.join(',') : options.to,
          Subject: options.subject,
          HtmlBody: options.html,
          TextBody: options.text,
          ReplyTo: options.replyTo,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.MessageID,
        };
      }

      return {
        success: false,
        error: {
          message: result.Message || 'Email sending failed',
          code: result.ErrorCode,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Resend Provider
class ResendProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.id,
        };
      }

      return {
        success: false,
        error: {
          message: result.message || 'Email sending failed',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: Array.isArray(options.to) 
                ? options.to.map(email => ({ email }))
                : [{ email: options.to }],
            },
          ],
          from: { email: options.from },
          subject: options.subject,
          content: [
            ...(options.html ? [{ type: 'text/html', value: options.html }] : []),
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
        }),
      });

      if (response.ok) {
        const xMessageId = response.headers.get('X-Message-Id');
        return {
          success: true,
          messageId: xMessageId || 'sendgrid-message-sent',
        };
      }

      const result = await response.json();
      return {
        success: false,
        error: {
          message: result.errors?.[0]?.message || 'Email sending failed',
          code: result.errors?.[0]?.field,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    try {
      const personalizations = emails.map(email => ({
        to: Array.isArray(email.to) 
          ? email.to.map(addr => ({ email: addr }))
          : [{ email: email.to }],
        subject: email.subject,
      }));

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations,
          from: { email: emails[0].from },
          content: [
            ...(emails[0].html ? [{ type: 'text/html', value: emails[0].html }] : []),
            ...(emails[0].text ? [{ type: 'text/plain', value: emails[0].text }] : []),
          ],
        }),
      });

      if (response.ok) {
        return emails.map(() => ({
          success: true,
          messageId: 'sendgrid-bulk-message-sent',
        }));
      }

      const result = await response.json();
      return emails.map(() => ({
        success: false,
        error: {
          message: result.errors?.[0]?.message || 'Bulk email sending failed',
        },
      }));
    } catch (error) {
      return emails.map(() => ({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  }
}

// Mailgun Provider
class MailgunProvider implements EmailProvider {
  constructor(private apiKey: string, private domain: string) {}

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const formData = new FormData();
      formData.append('from', options.from);
      formData.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
      formData.append('subject', options.subject);
      if (options.html) formData.append('html', options.html);
      if (options.text) formData.append('text', options.text);
      if (options.replyTo) formData.append('h:Reply-To', options.replyTo);

      const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.id,
        };
      }

      return {
        success: false,
        error: {
          message: result.message || 'Email sending failed',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Provider factory
export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'postmark';

  switch (provider.toLowerCase()) {
    case 'postmark':
      return new PostmarkProvider(process.env.POSTMARK_SERVER_TOKEN!);
    
    case 'resend':
      return new ResendProvider(process.env.RESEND_API_KEY!);
    
    case 'sendgrid':
      return new SendGridProvider(process.env.SENDGRID_API_KEY!);
    
    case 'mailgun':
      return new MailgunProvider(
        process.env.MAILGUN_API_KEY!,
        process.env.MAILGUN_DOMAIN!
      );
    
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

// Factory for master account email providers
export function createMasterEmailProvider(
  provider: string,
  config: { apiKey: string; domain?: string; fromEmail?: string }
): EmailProvider {
  switch (provider.toLowerCase()) {
    case 'sendgrid':
      return new SendGridProvider(config.apiKey);
    
    case 'mailgun':
      if (!config.domain) {
        throw new Error('Mailgun domain is required');
      }
      return new MailgunProvider(config.apiKey, config.domain);
    
    case 'postmark':
      return new PostmarkProvider(config.apiKey);
    
    case 'resend':
      return new ResendProvider(config.apiKey);
    
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

// Export the configured provider
export const emailProvider = createEmailProvider(); 