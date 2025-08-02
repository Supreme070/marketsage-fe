// Campaign related types based on backend DTOs

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  MULTI_CHANNEL = 'MULTI_CHANNEL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum CampaignPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface CampaignContent {
  subject?: string;
  textContent?: string;
  htmlContent?: string;
  templateId?: string;
  personalization?: Record<string, any>;
}

export interface CreateCampaignDto {
  name: string;
  type: CampaignType;
  content: CampaignContent;
  targetAudience: {
    segmentIds?: string[];
    listIds?: string[];
    contactIds?: string[];
  };
  settings: {
    sendTime?: Date;
    timezone?: string;
    priority?: CampaignPriority;
    trackingEnabled?: boolean;
  };
  scheduledAt?: Date;
}

export interface UpdateCampaignDto {
  name?: string;
  content?: Partial<CampaignContent>;
  targetAudience?: {
    segmentIds?: string[];
    listIds?: string[];
    contactIds?: string[];
  };
  settings?: {
    sendTime?: Date;
    timezone?: string;
    priority?: CampaignPriority;
    trackingEnabled?: boolean;
  };
  scheduledAt?: Date;
  timezone?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  content: CampaignContent;
  targetAudience: {
    segmentIds: string[];
    listIds: string[];
    contactIds: string[];
  };
  settings: {
    sendTime?: Date;
    timezone?: string;
    priority: CampaignPriority;
    trackingEnabled: boolean;
  };
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  organizationId: string;
  createdBy: string;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalRecipients: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  revenueGenerated: number;
  costPerAcquisition: number;
  returnOnInvestment: number;
  timeSeriesData: Array<{
    timestamp: Date;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  topLinks: Array<{
    url: string;
    clicks: number;
  }>;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

export interface GetCampaignsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  priority?: CampaignPriority;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedCampaignsResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CampaignTestDto {
  recipientEmails: string[];
  customSubject?: string;
}

export interface CampaignTestResult {
  success: boolean;
  message: string;
  sentTo: string[];
  failedRecipients: Array<{
    email: string;
    error: string;
  }>;
}

export interface DuplicateCampaignDto {
  name: string;
  copyContent?: boolean;
  copyAudience?: boolean;
  copySchedule?: boolean;
}

export interface CampaignBulkActionDto {
  campaignIds: string[];
  action: 'delete' | 'pause' | 'resume' | 'duplicate';
  options?: Record<string, any>;
}

export interface CampaignBulkActionResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    campaignId: string;
    error: string;
  }>;
  status: 'completed' | 'partial' | 'failed';
  processedAt: string;
}

export interface CampaignPreview {
  campaignId: string;
  previewType: string;
  content: string;
  htmlContent?: string;
  metadata: {
    subject?: string;
    type: CampaignType;
  };
  generatedAt: string;
}

export interface CampaignScheduleDto {
  scheduledAt: string;
  timezone?: string;
}