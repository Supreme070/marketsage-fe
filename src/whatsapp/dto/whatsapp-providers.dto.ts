import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsAppProvider, WhatsAppMessageType, WhatsAppPaginationDto } from './whatsapp-base.dto';

export enum WhatsAppProviderStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TESTING = 'TESTING',
  SUSPENDED = 'SUSPENDED',
  ERROR = 'ERROR',
}

export class WhatsAppProviderConfigDto {
  @IsOptional()
  @IsString()
  accountSid?: string; // For Twilio

  @IsOptional()
  @IsString()
  authToken?: string; // For Twilio

  @IsOptional()
  @IsString()
  phoneNumberId?: string; // For Meta Business

  @IsOptional()
  @IsString()
  accessToken?: string; // For Meta Business

  @IsOptional()
  @IsString()
  businessAccountId?: string; // For Meta Business

  @IsOptional()
  @IsString()
  apiKey?: string; // For WhatsApp Business API

  @IsOptional()
  @IsString()
  apiUrl?: string; // For WhatsApp Business API

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}

export class WhatsAppProviderLimitsDto {
  @IsOptional()
  @IsNumber()
  messagesPerDay?: number = 1000;

  @IsOptional()
  @IsNumber()
  messagesPerHour?: number = 100;

  @IsOptional()
  @IsNumber()
  templatesPerDay?: number = 50;

  @IsOptional()
  @IsNumber()
  mediaMessageSizeLimit?: number = 16; // MB

  @IsOptional()
  @IsArray()
  allowedCountries?: string[];

  @IsOptional()
  @IsArray()
  blockedCountries?: string[];
}

export class WhatsAppProviderStatsDto {
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
  averageResponseTime: number = 0;

  @IsOptional()
  @IsString()
  lastUsed?: string | null;

  @IsNumber()
  uptime: number = 100;

  @IsNumber()
  errorRate: number = 0;
}

export class WhatsAppProviderHealthDto {
  @IsString()
  status: string = 'unknown';

  @IsString()
  lastCheck: string = '';

  @IsNumber()
  responseTime: number = 0;

  @IsNumber()
  errorRate: number = 0;

  @IsNumber()
  uptime: number = 0;

  @IsOptional()
  @IsObject()
  webhookStatus?: {
    operational: boolean;
    lastReceived?: string;
  };
}

export class WhatsAppProviderDto {
  @IsString()
  id: string = '';

  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(WhatsAppProvider)
  type: WhatsAppProvider = WhatsAppProvider.META_BUSINESS;

  @IsEnum(WhatsAppProviderStatus)
  status: WhatsAppProviderStatus = WhatsAppProviderStatus.INACTIVE;

  @IsString()
  organizationId: string = '';

  @IsString()
  createdBy: string = '';

  @IsString()
  phoneNumber: string = '';

  @IsOptional()
  @IsString()
  displayName?: string;

  @ValidateNested()
  @Type(() => WhatsAppProviderConfigDto)
  config: WhatsAppProviderConfigDto = new WhatsAppProviderConfigDto();

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderLimitsDto)
  limits?: WhatsAppProviderLimitsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderStatsDto)
  stats?: WhatsAppProviderStatsDto;

  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsString()
  lastTestResult?: string;

  @IsOptional()
  @IsString()
  lastTestAt?: string;

  @IsString()
  createdAt: string = '';

  @IsString()
  updatedAt: string = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderHealthDto)
  health?: WhatsAppProviderHealthDto;

  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateWhatsAppProviderDto {
  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(WhatsAppProvider)
  type: WhatsAppProvider = WhatsAppProvider.META_BUSINESS;

  @IsString()
  phoneNumber: string = '';

  @IsOptional()
  @IsString()
  displayName?: string;

  @ValidateNested()
  @Type(() => WhatsAppProviderConfigDto)
  config: WhatsAppProviderConfigDto = new WhatsAppProviderConfigDto();

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderLimitsDto)
  limits?: WhatsAppProviderLimitsDto;

  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateWhatsAppProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WhatsAppProviderStatus)
  status?: WhatsAppProviderStatus;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderConfigDto)
  config?: WhatsAppProviderConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppProviderLimitsDto)
  limits?: WhatsAppProviderLimitsDto;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class GetWhatsAppProvidersQueryDto {
  @IsOptional()
  @IsEnum(WhatsAppProvider)
  type?: WhatsAppProvider;

  @IsOptional()
  @IsEnum(WhatsAppProviderStatus)
  status?: WhatsAppProviderStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

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
  sortBy?: string = 'priority';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';
}

export class GetWhatsAppProvidersResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppProviderDto)
  providers: WhatsAppProviderDto[] = [];

  @ValidateNested()
  @Type(() => WhatsAppPaginationDto)
  pagination: WhatsAppPaginationDto = new WhatsAppPaginationDto();
}

export class TestWhatsAppProviderDto {
  @IsString()
  testPhoneNumber: string = '';

  @IsOptional()
  @IsString()
  message?: string = 'MarketSage WhatsApp Provider Test Message';

  @IsOptional()
  @IsEnum(WhatsAppMessageType)
  messageType?: WhatsAppMessageType = WhatsAppMessageType.TEXT;
}

export class WhatsAppProviderTestResultDto {
  @IsBoolean()
  success: boolean = false;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsObject()
  providerResponse?: Record<string, any>;

  @IsString()
  testedAt: string = '';
}

export class WhatsAppProviderBalanceDto {
  @IsString()
  providerId: string = '';

  @IsNumber()
  credits: number = 0;

  @IsOptional()
  @IsString()
  currency?: string = 'NGN';

  @IsOptional()
  @IsNumber()
  messageLimit?: number;

  @IsString()
  lastChecked: string = '';

  @IsOptional()
  @IsString()
  lastError?: string;
}