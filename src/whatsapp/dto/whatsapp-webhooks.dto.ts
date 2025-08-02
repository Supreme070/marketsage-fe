import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsAppWebhookEvent, WhatsAppWebhookStatus, WhatsAppPaginationDto, WhatsAppMessageStatus } from './whatsapp-base.dto';

export class WhatsAppWebhookDto {
  @IsString()
  id: string = '';

  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  url: string = '';

  @IsEnum(WhatsAppWebhookStatus)
  status: WhatsAppWebhookStatus = WhatsAppWebhookStatus.PENDING;

  @IsString()
  organizationId: string = '';

  @IsString()
  createdBy: string = '';

  @IsArray()
  @IsEnum(WhatsAppWebhookEvent, { each: true })
  events: WhatsAppWebhookEvent[] = [];

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  timeout?: number = 30;

  @IsOptional()
  @IsNumber()
  maxRetries?: number = 3;

  @IsOptional()
  @IsBoolean()
  verifySSL?: boolean = true;

  @IsOptional()
  @IsObject()
  stats?: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number;
    averageResponseTime: number;
    lastAttempt?: string;
    lastSuccess?: string;
  };

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean = false;

  @IsString()
  createdAt: string = '';

  @IsString()
  updatedAt: string = '';

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsObject()
  payload?: any;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  processedAt?: string;
}

export class CreateWhatsAppWebhookDto {
  @IsString()
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  url: string = '';

  @IsArray()
  @IsEnum(WhatsAppWebhookEvent, { each: true })
  events: WhatsAppWebhookEvent[] = [];

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  timeout?: number = 30;

  @IsOptional()
  @IsNumber()
  maxRetries?: number = 3;

  @IsOptional()
  @IsBoolean()
  verifySSL?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean = false;
}

export class UpdateWhatsAppWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsEnum(WhatsAppWebhookStatus)
  status?: WhatsAppWebhookStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(WhatsAppWebhookEvent, { each: true })
  events?: WhatsAppWebhookEvent[];

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  timeout?: number;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;

  @IsOptional()
  @IsBoolean()
  verifySSL?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}


export class GetWhatsAppWebhooksResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppWebhookDto)
  webhooks: WhatsAppWebhookDto[] = [];

  @ValidateNested()
  @Type(() => WhatsAppPaginationDto)
  pagination: WhatsAppPaginationDto = new WhatsAppPaginationDto();
}

export class TestWhatsAppWebhookDto {
  @IsOptional()
  @IsEnum(WhatsAppWebhookEvent)
  eventType?: WhatsAppWebhookEvent = WhatsAppWebhookEvent.MESSAGE_SENT;

  @IsOptional()
  @IsObject()
  testPayload?: Record<string, any>;
}

export class WhatsAppWebhookTestResultDto {
  @IsBoolean()
  success: boolean = false;

  @IsString()
  message: string = '';

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @IsOptional()
  @IsObject()
  response?: any;

  @IsString()
  timestamp: string = '';
}

export class WhatsAppWebhookLogDto {
  @IsString()
  id: string = '';

  @IsString()
  webhookId: string = '';

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsEnum(WhatsAppWebhookEvent)
  eventType: WhatsAppWebhookEvent = WhatsAppWebhookEvent.MESSAGE_SENT;

  @IsString()
  url: string = '';

  @IsObject()
  payload: Record<string, any> = {};

  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @IsOptional()
  @IsObject()
  response?: any;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsNumber()
  attempt?: number = 1;

  @IsBoolean()
  success: boolean = false;

  @IsString()
  createdAt: string = '';
}

export class GetWhatsAppWebhookLogsQueryDto {
  @IsOptional()
  @IsString()
  webhookId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsEnum(WhatsAppWebhookEvent)
  eventType?: WhatsAppWebhookEvent;

  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';
}

export class GetWhatsAppWebhookLogsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppWebhookLogDto)
  logs: WhatsAppWebhookLogDto[] = [];

  @ValidateNested()
  @Type(() => WhatsAppPaginationDto)
  pagination: WhatsAppPaginationDto = new WhatsAppPaginationDto();
}

export class IncomingWhatsAppWebhookDto {
  @IsString()
  messageId: string = '';

  @IsEnum(WhatsAppWebhookEvent)
  eventType: WhatsAppWebhookEvent = WhatsAppWebhookEvent.MESSAGE_SENT;

  @IsString()
  timestamp: string = '';

  @IsString()
  recipient: string = '';

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WhatsAppWebhookEventDto {
  @IsString()
  eventType: string = '';

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsEnum(WhatsAppMessageStatus)
  status?: WhatsAppMessageStatus;

  @IsString()
  timestamp: string = '';

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WhatsAppWebhookStatsDto {
  @IsNumber()
  totalReceived: number = 0;

  @IsNumber()
  totalProcessed: number = 0;

  @IsNumber()
  totalFailed: number = 0;

  @IsNumber()
  successRate: number = 0;

  @IsNumber()
  avgProcessingTime: number = 0;

  @IsObject()
  byEventType: Record<string, number> = {};

  @IsObject()
  byProvider: Record<string, number> = {};

  @IsArray()
  recentEvents: any[] = [];

  @IsObject()
  failureReasons: Record<string, number> = {};

  @IsString()
  periodStart: string = '';

  @IsString()
  periodEnd: string = '';
}

export class GetWhatsAppWebhooksQueryDto {
  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsEnum(WhatsAppWebhookStatus)
  status?: WhatsAppWebhookStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';
}