import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsAppTemplateStatus, WhatsAppPaginationDto } from './whatsapp-base.dto';

export enum WhatsAppTemplateCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
}

export enum WhatsAppTemplateLanguage {
  EN = 'en',
  EN_US = 'en_US',
  ES = 'es',
  PT_BR = 'pt_BR',
  FR = 'fr',
  AR = 'ar',
  HA = 'ha', // Hausa for Nigeria
  YO = 'yo', // Yoruba for Nigeria
  IG = 'ig', // Igbo for Nigeria
}

export class WhatsAppTemplateButtonDto {
  @IsString()
  type: string = 'QUICK_REPLY';

  @IsString()
  text: string = '';

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class WhatsAppTemplateHeaderDto {
  @IsString()
  format: string = 'TEXT';

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  filename?: string;
}

export class WhatsAppTemplateDto {
  @IsString()
  id: string = '';

  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  organizationId: string = '';

  @IsString()
  providerId: string = '';

  @IsEnum(WhatsAppTemplateCategory)
  category: WhatsAppTemplateCategory = WhatsAppTemplateCategory.UTILITY;

  @IsEnum(WhatsAppTemplateLanguage)
  language: WhatsAppTemplateLanguage = WhatsAppTemplateLanguage.EN;

  @IsEnum(WhatsAppTemplateStatus)
  status: WhatsAppTemplateStatus = WhatsAppTemplateStatus.PENDING;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTemplateHeaderDto)
  header?: WhatsAppTemplateHeaderDto;

  @IsString()
  body: string = '';

  @IsOptional()
  @IsString()
  footer?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateButtonDto)
  buttons?: WhatsAppTemplateButtonDto[];

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsString()
  createdBy: string = '';

  @IsString()
  createdAt: string = '';

  @IsString()
  updatedAt: string = '';

  @IsOptional()
  @IsString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  rejectedAt?: string;

  @IsOptional()
  @IsString()
  lastModified?: string;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsObject()
  usageStats?: {
    totalSent: number;
    totalDelivered: number;
    deliveryRate: number;
    lastUsed?: string;
  };

  @IsOptional()
  @IsArray()
  components?: any[];

  // Add stats field for service compatibility
  stats?: WhatsAppTemplateStatsDto;
}

export class WhatsAppTemplateStatsDto {
  @IsNumber()
  totalSent: number = 0;

  @IsNumber()
  totalDelivered: number = 0;

  @IsNumber()
  totalRead: number = 0;

  @IsNumber()
  totalFailed: number = 0;

  @IsNumber()
  deliveryRate: number = 0;

  @IsNumber()
  readRate: number = 0;

  @IsNumber()
  clickRate: number = 0;

  @IsNumber()
  conversionRate: number = 0;

  @IsNumber()
  avgResponseTime: number = 0;

  @IsOptional()
  @IsString()
  lastUsed?: string | null;

  @IsOptional()
  @IsObject()
  popularVariables?: Record<string, number>;
}

export class CreateWhatsAppTemplateDto {
  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  providerId: string = '';

  @IsEnum(WhatsAppTemplateCategory)
  category: WhatsAppTemplateCategory = WhatsAppTemplateCategory.UTILITY;

  @IsOptional()
  @IsEnum(WhatsAppTemplateLanguage)
  language?: WhatsAppTemplateLanguage = WhatsAppTemplateLanguage.EN;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTemplateHeaderDto)
  header?: WhatsAppTemplateHeaderDto;

  @IsString()
  body: string = '';

  @IsOptional()
  @IsString()
  footer?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateButtonDto)
  buttons?: WhatsAppTemplateButtonDto[];

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsArray()
  components?: any[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateWhatsAppTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEnum(WhatsAppTemplateCategory)
  category?: WhatsAppTemplateCategory;

  @IsOptional()
  @IsEnum(WhatsAppTemplateLanguage)
  language?: WhatsAppTemplateLanguage;

  @IsOptional()
  @IsEnum(WhatsAppTemplateStatus)
  status?: WhatsAppTemplateStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTemplateHeaderDto)
  header?: WhatsAppTemplateHeaderDto;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  footer?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateButtonDto)
  buttons?: WhatsAppTemplateButtonDto[];

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsArray()
  components?: any[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetWhatsAppTemplatesQueryDto {
  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEnum(WhatsAppTemplateCategory)
  category?: WhatsAppTemplateCategory;

  @IsOptional()
  @IsEnum(WhatsAppTemplateLanguage)
  language?: WhatsAppTemplateLanguage;

  @IsOptional()
  @IsEnum(WhatsAppTemplateStatus)
  status?: WhatsAppTemplateStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';
}

export class GetWhatsAppTemplatesResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateDto)
  templates: WhatsAppTemplateDto[] = [];

  @ValidateNested()
  @Type(() => WhatsAppPaginationDto)
  pagination: WhatsAppPaginationDto = new WhatsAppPaginationDto();
}

export class WhatsAppTemplatePreviewDto {
  @IsString()
  templateId: string = '';

  @IsString()
  previewText: string = '';

  @IsOptional()
  @IsString()
  previewHeader?: string;

  @IsOptional()
  @IsString()
  previewFooter?: string;

  @IsOptional()
  @IsArray()
  previewButtons?: Array<{
    type: string;
    text: string;
    action?: string;
  }>;

  @IsObject()
  variables: Record<string, string> = {};
}

export class WhatsAppTemplateAnalyticsDto {
  @IsString()
  templateId: string = '';

  @IsString()
  templateName: string = '';

  @IsNumber()
  totalSent: number = 0;

  @IsNumber()
  totalDelivered: number = 0;

  @IsNumber()
  totalRead: number = 0;

  @IsNumber()
  totalFailed: number = 0;

  @IsNumber()
  deliveryRate: number = 0;

  @IsNumber()
  readRate: number = 0;

  @IsNumber()
  failureRate: number = 0;

  @IsArray()
  timeSeries: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }> = [];

  @IsString()
  periodStart: string = '';

  @IsString()
  periodEnd: string = '';

  @IsOptional()
  @IsString()
  lastUsed?: string;
}