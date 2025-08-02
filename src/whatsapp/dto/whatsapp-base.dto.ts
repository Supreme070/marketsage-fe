import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
}

export enum WhatsAppMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

export enum WhatsAppProvider {
  TWILIO = 'TWILIO',
  META_BUSINESS = 'META_BUSINESS',
  WHATSAPP_BUSINESS_API = 'WHATSAPP_BUSINESS_API',
}

export enum WhatsAppTemplateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export enum WhatsAppWebhookEvent {
  MESSAGE_SENT = 'message.sent',
  MESSAGE_DELIVERED = 'message.delivered',
  MESSAGE_READ = 'message.read',
  MESSAGE_FAILED = 'message.failed',
  MESSAGE_RECEIVED = 'message.received',
}

export enum WhatsAppWebhookStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export class WhatsAppRecipientDto {
  @IsString()
  phoneNumber: string = '';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  countryCode?: string = '+234'; // Default to Nigeria
}

export class WhatsAppMediaDto {
  @IsString()
  url: string = '';

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class WhatsAppLocationDto {
  @IsNumber()
  latitude: number = 0;

  @IsNumber()
  longitude: number = 0;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class WhatsAppTemplateParameterDto {
  @IsString()
  type: string = 'text';

  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppMediaDto)
  media?: WhatsAppMediaDto;
}

export class WhatsAppTemplateComponentDto {
  @IsString()
  type: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateParameterDto)
  parameters: WhatsAppTemplateParameterDto[] = [];
}

export class WhatsAppInteractiveButtonDto {
  @IsString()
  type: string = 'reply';

  @IsString()
  id: string = '';

  @IsString()
  title: string = '';
}

export class WhatsAppInteractiveDto {
  @IsString()
  type: string = 'button';

  @IsOptional()
  @IsString()
  header?: string;

  @IsString()
  body: string = '';

  @IsOptional()
  @IsString()
  footer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppInteractiveButtonDto)
  buttons?: WhatsAppInteractiveButtonDto[];
}

export class WhatsAppPaginationDto {
  @IsNumber()
  page: number = 1;

  @IsNumber()
  limit: number = 10;

  @IsNumber()
  total: number = 0;

  @IsNumber()
  pages: number = 0;
}