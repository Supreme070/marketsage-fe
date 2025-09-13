// Email Module Types for Frontend API Client

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum ActivityType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  COMPLAINED = 'COMPLAINED',
}

export enum EmailProviderType {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  SMTP = 'smtp',
  POSTMARK = 'postmark',
  SES = 'ses',
}

// ==================== EMAIL CAMPAIGN TYPES ====================

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  subject: string;
  from: string;
  replyTo?: string;
  templateId?: string;
  content?: string;
  design?: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  organizationId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  template?: {
    id: string;
    name: string;
    subject: string;
  };
  lists?: Array<{
    id: string;
    name: string;
  }>;
  segments?: Array<{
    id: string;
    name: string;
  }>;
  activities?: Array<{
    id: string;
    type: ActivityType;
    timestamp: string;
    metadata?: string;
    contact?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  _count?: {
    activities: number;
  };
}

export interface CreateEmailCampaignDto {
  name: string;
  description?: string;
  subject: string;
  from: string;
  replyTo?: string;
  templateId?: string;
  content?: string;
  design?: string;
  status?: CampaignStatus;
  scheduledFor?: string;
  listIds?: string[];
  segmentIds?: string[];
}

export interface UpdateEmailCampaignDto {
  name?: string;
  description?: string;
  subject?: string;
  from?: string;
  replyTo?: string;
  templateId?: string;
  content?: string;
  design?: string;
  status?: CampaignStatus;
  scheduledFor?: string;
  listIds?: string[];
  segmentIds?: string[];
}

export interface EmailCampaignQueryDto {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmailCampaignListResponse {
  campaigns: EmailCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendEmailCampaignDto {
  scheduledFor?: string;
  testMode?: boolean;
}

export interface EmailCampaignAnalyticsDto {
  startDate?: string;
  endDate?: string;
}

export interface EmailCampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    subject: string;
    status: CampaignStatus;
    sentAt?: string;
  };
  analytics: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  activities: Array<{
    id: string;
    type: ActivityType;
    timestamp: string;
    metadata?: string;
    contact?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

// ==================== EMAIL TEMPLATE TYPES ====================

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  content: string;
  design?: string;
  previewText?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  campaigns?: Array<{
    id: string;
    name: string;
    status: CampaignStatus;
    sentAt?: string;
  }>;
  _count?: {
    campaigns: number;
  };
}

export interface CreateEmailTemplateDto {
  name: string;
  description?: string;
  subject: string;
  content: string;
  design?: string;
  previewText?: string;
  category?: string;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  description?: string;
  subject?: string;
  content?: string;
  design?: string;
  previewText?: string;
  category?: string;
}

export interface EmailTemplateQueryDto {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== EMAIL PROVIDER TYPES ====================

export interface EmailProvider {
  id: string;
  organizationId: string;
  providerType: EmailProviderType;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  trackingDomain?: string;
  enableTracking?: boolean;
  isActive?: boolean;
  verificationStatus?: string;
  lastTested?: string;
  testStatus?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateEmailProviderDto {
  providerType: EmailProviderType;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  trackingDomain?: string;
  enableTracking?: boolean;
}

export interface UpdateEmailProviderDto {
  name?: string;
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  trackingDomain?: string;
  enableTracking?: boolean;
  isActive?: boolean;
}

export interface TestEmailProviderDto {
  testEmail: string;
  testSubject?: string;
  testContent?: string;
}

export interface TestEmailProviderResult {
  success: boolean;
  message: string;
  timestamp: string;
}

// ==================== EMAIL TRACKING TYPES ====================

export interface EmailActivity {
  id: string;
  campaignId: string;
  contactId: string;
  type: ActivityType;
  timestamp: string;
  metadata?: string;
  campaign?: {
    id: string;
    name: string;
    subject: string;
  };
  contact?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface UnsubscribeResult {
  message: string;
}
