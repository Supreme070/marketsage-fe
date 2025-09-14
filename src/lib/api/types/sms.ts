// SMS Module Types for Frontend API Client

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
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum SMSProviderType {
  AFRICASTALKING = 'africastalking',
  TWILIO = 'twilio',
  TERMII = 'termii',
  NEXMO = 'nexmo',
  INFOBIP = 'infobip',
}

// ==================== SMS CAMPAIGN TYPES ====================

export interface SMSCampaign {
  id: string;
  name: string;
  description?: string;
  from: string;
  templateId?: string;
  content?: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  template?: {
    id: string;
    name: string;
    content: string;
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
      phone: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  _count?: {
    activities: number;
  };
}

export interface CreateSMSCampaignDto {
  name: string;
  description?: string;
  from: string;
  templateId?: string;
  content?: string;
  status?: CampaignStatus;
  scheduledFor?: string;
  listIds?: string[];
  segmentIds?: string[];
}

export interface UpdateSMSCampaignDto {
  name?: string;
  description?: string;
  from?: string;
  templateId?: string;
  content?: string;
  status?: CampaignStatus;
  scheduledFor?: string;
  listIds?: string[];
  segmentIds?: string[];
}

export interface SMSCampaignQueryDto {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SMSCampaignListResponse {
  campaigns: SMSCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SendSMSCampaignDto {
  scheduledFor?: string;
  testMode?: boolean;
}

export interface SMSCampaignAnalyticsDto {
  startDate?: string;
  endDate?: string;
}

export interface SMSCampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    from: string;
    status: CampaignStatus;
    sentAt?: string;
  };
  analytics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalUnsubscribed: number;
    deliveryRate: number;
    failureRate: number;
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
      phone: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

// ==================== SMS TEMPLATE TYPES ====================

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables?: string[];
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

export interface CreateSMSTemplateDto {
  name: string;
  content: string;
  variables?: string[];
  category?: string;
}

export interface UpdateSMSTemplateDto {
  name?: string;
  content?: string;
  variables?: string[];
  category?: string;
}

export interface SMSTemplateQueryDto {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SMSTemplateListResponse {
  templates: SMSTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== SMS PROVIDER TYPES ====================

export interface SMSProvider {
  id: string;
  organizationId: string;
  provider: SMSProviderType;
  senderId: string;
  credentials?: Record<string, unknown>;
  isActive?: boolean;
  verificationStatus?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateSMSProviderDto {
  provider: SMSProviderType;
  senderId: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  isActive?: boolean;
}

export interface UpdateSMSProviderDto {
  senderId?: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  isActive?: boolean;
  verificationStatus?: string;
}

export interface TestSMSProviderDto {
  testPhoneNumber: string;
  testMessage?: string;
}

export interface TestSMSProviderResult {
  success: boolean;
  message: string;
  timestamp: string;
}

// ==================== SMS TRACKING TYPES ====================

export interface SMSActivity {
  id: string;
  campaignId: string;
  contactId: string;
  type: ActivityType;
  timestamp: string;
  metadata?: string;
  campaign?: {
    id: string;
    name: string;
    from: string;
  };
  contact?: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface SMSHistory {
  id: string;
  to: string;
  from?: string;
  message: string;
  originalMessage?: string;
  contactId?: string;
  userId: string;
  status: string;
  messageId?: string;
  error?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UnsubscribeResult {
  message: string;
}
