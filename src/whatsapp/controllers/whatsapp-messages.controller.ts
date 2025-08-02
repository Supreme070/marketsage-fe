import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { WhatsAppMessagesService } from '../services/whatsapp-messages.service';
import {
  SendWhatsAppMessageDto,
  WhatsAppMessageDto,
  GetWhatsAppMessagesQueryDto,
  GetWhatsAppMessagesResponseDto,
  WhatsAppMessageAnalyticsDto,
  WhatsAppBulkMessageDto,
  WhatsAppBulkMessageResultDto,
} from '../dto/whatsapp-messages.dto';

@ApiTags('WhatsApp Messages')
@Controller('whatsapp/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppMessagesController {
  constructor(private readonly messagesService: WhatsAppMessagesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a WhatsApp message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: WhatsAppMessageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async send(
    @Body() sendMessageDto: SendWhatsAppMessageDto,
    @Request() req: any,
  ): Promise<WhatsAppMessageDto> {
    return this.messagesService.send(
      sendMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk WhatsApp messages' })
  @ApiResponse({
    status: 201,
    description: 'Bulk messages initiated successfully',
    type: WhatsAppBulkMessageResultDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendBulk(
    @Body() bulkMessageDto: WhatsAppBulkMessageDto,
    @Request() req: any,
  ): Promise<WhatsAppBulkMessageResultDto> {
    return this.messagesService.sendBulk(
      bulkMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all WhatsApp messages' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: GetWhatsAppMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetWhatsAppMessagesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppMessagesResponseDto> {
    return this.messagesService.findAll(query, req.user.organizationId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get WhatsApp message analytics' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: WhatsAppMessageAnalyticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(
    @Query('days') days?: number,
    @Request() req?: any,
  ): Promise<WhatsAppMessageAnalyticsDto> {
    return this.messagesService.getAnalytics(req.user.organizationId, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get WhatsApp message by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    type: WhatsAppMessageDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppMessageDto> {
    return this.messagesService.findOne(id, req.user.organizationId);
  }

  @Post('send-template')
  @ApiOperation({ summary: 'Send a WhatsApp template message' })
  @ApiResponse({
    status: 201,
    description: 'Template message sent successfully',
    type: WhatsAppMessageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendTemplate(
    @Body() 
    templateMessage: {
      recipient: { phoneNumber: string; name?: string };
      templateName: string;
      templateLanguage?: string;
      templateComponents?: any[];
      providerId?: string;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ): Promise<WhatsAppMessageDto> {
    const sendMessageDto: SendWhatsAppMessageDto = {
      recipient: templateMessage.recipient,
      type: 'template' as any,
      templateName: templateMessage.templateName,
      templateLanguage: templateMessage.templateLanguage || 'en',
      templateComponents: templateMessage.templateComponents,
      providerId: templateMessage.providerId,
      metadata: templateMessage.metadata,
    };

    return this.messagesService.send(
      sendMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Post('send-media')
  @ApiOperation({ summary: 'Send a WhatsApp media message' })
  @ApiResponse({
    status: 201,
    description: 'Media message sent successfully',
    type: WhatsAppMessageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMedia(
    @Body() 
    mediaMessage: {
      recipient: { phoneNumber: string; name?: string };
      type: 'image' | 'video' | 'audio' | 'document';
      media: {
        url: string;
        caption?: string;
        filename?: string;
        mimeType?: string;
      };
      providerId?: string;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ): Promise<WhatsAppMessageDto> {
    const sendMessageDto: SendWhatsAppMessageDto = {
      recipient: mediaMessage.recipient,
      type: mediaMessage.type as any,
      media: mediaMessage.media,
      providerId: mediaMessage.providerId,
      metadata: mediaMessage.metadata,
    };

    return this.messagesService.send(
      sendMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Post('send-interactive')
  @ApiOperation({ summary: 'Send a WhatsApp interactive message' })
  @ApiResponse({
    status: 201,
    description: 'Interactive message sent successfully',
    type: WhatsAppMessageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendInteractive(
    @Body() 
    interactiveMessage: {
      recipient: { phoneNumber: string; name?: string };
      interactive: {
        type: string;
        header?: string;
        body: string;
        footer?: string;
        buttons?: Array<{
          type: string;
          id: string;
          title: string;
        }>;
      };
      providerId?: string;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ): Promise<WhatsAppMessageDto> {
    const sendMessageDto: SendWhatsAppMessageDto = {
      recipient: interactiveMessage.recipient,
      type: 'interactive' as any,
      interactive: interactiveMessage.interactive,
      providerId: interactiveMessage.providerId,
      metadata: interactiveMessage.metadata,
    };

    return this.messagesService.send(
      sendMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get('recipient/:phoneNumber')
  @ApiOperation({ summary: 'Get messages by recipient phone number' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: GetWhatsAppMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByRecipient(
    @Param('phoneNumber') phoneNumber: string,
    @Query() query: GetWhatsAppMessagesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppMessagesResponseDto> {
    return this.messagesService.findAll(
      { ...query, recipient: phoneNumber },
      req.user.organizationId,
    );
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get messages by conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation messages retrieved successfully',
    type: GetWhatsAppMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Query() query: GetWhatsAppMessagesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppMessagesResponseDto> {
    return this.messagesService.findAll(
      { ...query, conversationId },
      req.user.organizationId,
    );
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get messages by status' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: GetWhatsAppMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByStatus(
    @Param('status') status: string,
    @Query() query: GetWhatsAppMessagesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppMessagesResponseDto> {
    return this.messagesService.findAll(
      { ...query, status: status as any },
      req.user.organizationId,
    );
  }
}