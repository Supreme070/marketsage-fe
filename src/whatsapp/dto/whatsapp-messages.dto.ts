import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  WhatsAppMessageType, 
  WhatsAppMessageStatus, 
  WhatsAppRecipientDto, 
  WhatsAppMediaDto, 
  WhatsAppLocationDto,
  WhatsAppTemplateComponentDto,
  WhatsAppInteractiveDto,
  WhatsAppPaginationDto 
} from './whatsapp-base.dto';

export class SendWhatsAppMessageDto {
  @ValidateNested()
  @Type(() => WhatsAppRecipientDto)
  recipient: WhatsAppRecipientDto = new WhatsAppRecipientDto();

  @IsEnum(WhatsAppMessageType)
  type: WhatsAppMessageType = WhatsAppMessageType.TEXT;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  media?: WhatsAppMediaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppLocationDto)
  location?: WhatsAppLocationDto;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateLanguage?: string = 'en';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateComponentDto)
  templateComponents?: WhatsAppTemplateComponentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractiveDto)
  interactive?: WhatsAppInteractiveDto;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  trackDelivery?: boolean = true;

  @IsOptional()
  @IsBoolean()
  trackRead?: boolean = true;
}

export class WhatsAppMessageDto {
  @IsString()
  id: string = '';

  @IsString()
  organizationId: string = '';

  @IsString()
  providerId: string = '';

  @IsString()
  recipient: string = '';

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsEnum(WhatsAppMessageType)
  type: WhatsAppMessageType = WhatsAppMessageType.TEXT;

  @IsEnum(WhatsAppMessageStatus)
  status: WhatsAppMessageStatus = WhatsAppMessageStatus.PENDING;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  media?: WhatsAppMediaDto;

  @IsOptional()
  @IsObject()
  location?: WhatsAppLocationDto;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  interactive?: WhatsAppInteractiveDto;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  sentAt?: string;

  @IsOptional()
  @IsString()
  deliveredAt?: string;

  @IsOptional()
  @IsString()
  readAt?: string;

  @IsOptional()
  @IsString()
  failedAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsString()
  createdAt: string = '';

  @IsString()
  updatedAt: string = '';
}

export class GetWhatsAppMessagesQueryDto {
  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsEnum(WhatsAppMessageType)
  type?: WhatsAppMessageType;

  @IsOptional()
  @IsEnum(WhatsAppMessageStatus)
  status?: WhatsAppMessageStatus;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

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

export class GetWhatsAppMessagesResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  messages: WhatsAppMessageDto[] = [];

  @ValidateNested()
  @Type(() => WhatsAppPaginationDto)
  pagination: WhatsAppPaginationDto = new WhatsAppPaginationDto();
}

export class WhatsAppMessageAnalyticsDto {
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
  avgDeliveryTime: number = 0; // in seconds

  @IsObject()
  byType: Record<string, number> = {};

  @IsObject()
  byStatus: Record<string, number> = {};

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
}

export class WhatsAppBulkMessageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppRecipientDto)
  recipients: WhatsAppRecipientDto[] = [];

  @IsEnum(WhatsAppMessageType)
  type: WhatsAppMessageType = WhatsAppMessageType.TEXT;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  media?: WhatsAppMediaDto;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateLanguage?: string = 'en';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateComponentDto)
  templateComponents?: WhatsAppTemplateComponentDto[];

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  personalizeMessages?: boolean = false;

  @IsOptional()
  @IsObject()
  personalizationData?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  batchSize?: number = 100;

  @IsOptional()
  @IsNumber()
  delayBetweenBatches?: number = 1000; // milliseconds
}

export class WhatsAppBulkMessageResultDto {
  @IsString()
  batchId: string = '';

  @IsNumber()
  totalRecipients: number = 0;

  @IsNumber()
  successCount: number = 0;

  @IsNumber()
  failureCount: number = 0;

  @IsNumber()
  pendingCount: number = 0;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  messages: WhatsAppMessageDto[] = [];

  @IsArray()
  errors: Array<{
    recipient: string;
    error: string;
  }> = [];

  @IsString()
  status: string = 'processing';

  @IsString()
  createdAt: string = '';

  @IsOptional()
  @IsString()
  completedAt?: string;
}