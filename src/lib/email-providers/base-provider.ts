// Base email provider interface for extensibility
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export interface EmailOptions {
  to: string | string[];
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number;
}

export interface DomainVerification {
  verified: boolean;
  spfRecord?: string;
  dkimRecord?: string;
  dmarcRecord?: string;
  mxRecord?: string;
  status: 'verified' | 'pending' | 'failed';
}

export interface EmailProvider {
  name: string;
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  validateConfig(): boolean;
  getStats?(period?: { start: Date; end: Date }): Promise<EmailStats>;
  verifyDomain?(domain: string): Promise<DomainVerification>;
  setupWebhook?(url: string): Promise<void>;
}

export abstract class BaseEmailProvider implements EmailProvider {
  abstract name: string;
  
  abstract sendEmail(options: EmailOptions): Promise<EmailResult>;
  
  abstract validateConfig(): boolean;

  // Enhanced email validation for various formats
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate multiple emails
  validateEmails(emails: string | string[]): boolean {
    const emailArray = Array.isArray(emails) ? emails : [emails];
    return emailArray.every(email => this.validateEmail(email));
  }

  // Sanitize email content
  sanitizeContent(content: string): string {
    if (!content) return '';
    
    // Remove potentially harmful scripts and tags
    return content
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/<object[^>]*>.*?<\/object>/gis, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gis, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Generate plain text from HTML
  generatePlainText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Add unsubscribe link if missing
  addUnsubscribeLink(html: string, email: string): string {
    if (html.includes('unsubscribe')) {
      return html;
    }

    const unsubscribeFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
      <p>You received this email because you are subscribed to our communications. 
      <a href="mailto:unsubscribe@marketsage.africa?subject=Unsubscribe&body=Please unsubscribe ${encodeURIComponent(email)}" style="color: #666;">Unsubscribe</a> | 
      <a href="mailto:support@marketsage.africa" style="color: #666;">Contact Support</a></p>
    </div>
    `;

    if (html.includes('</body>')) {
      return html.replace('</body>', unsubscribeFooter + '</body>');
    } else {
      return html + unsubscribeFooter;
    }
  }

  // Basic stats implementation (can be overridden)
  async getStats(period?: { start: Date; end: Date }): Promise<EmailStats> {
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      complained: 0,
    };
  }
}