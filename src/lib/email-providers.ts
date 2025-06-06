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
    
    case 'mailgun':
      return new MailgunProvider(
        process.env.MAILGUN_API_KEY!,
        process.env.MAILGUN_DOMAIN!
      );
    
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

// Export the configured provider
export const emailProvider = createEmailProvider(); 