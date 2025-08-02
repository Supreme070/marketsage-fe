/**
 * Communication API Types
 * Types for email, SMS, and WhatsApp services
 */

export interface EmailOptions {
  to: string | string[];
  from: string;
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

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  provider: string;
}

export interface CampaignSendOptions {
  campaignId: string;
  useOptimalSendTime?: boolean;
}

export interface CampaignSendResult {
  success: boolean;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  details: Record<string, any>;
}

// WhatsApp Types
export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export interface WhatsAppMediaMessage {
  type: 'image' | 'document' | 'audio' | 'video';
  url?: string;
  id?: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list';
  header?: {
    type: 'text' | 'image' | 'document' | 'video';
    text?: string;
    image?: { id: string } | { link: string };
    document?: { id: string } | { link: string };
    video?: { id: string } | { link: string };
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
    button?: string;
  };
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

// SMS Types
export type SMSProviderType = 'twilio' | 'nexmo' | 'africastalking' | 'bulk-sms';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
  provider: string;
  cost?: number;
}

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  organizationId?: string;
}

// Common Communication Types
export interface ContactInfo {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface CommunicationProvider {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  organizationId: string;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationActivity {
  id: string;
  type: 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';
  contactId: string;
  campaignId?: string;
  messageId?: string;
  provider: string;
  metadata?: Record<string, any>;
  timestamp: string;
}