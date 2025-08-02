import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WhatsAppProviderFactoryService } from '../providers/whatsapp-provider-factory.service';
import {
  SendWhatsAppMessageDto,
  WhatsAppMessageDto,
  GetWhatsAppMessagesQueryDto,
  GetWhatsAppMessagesResponseDto,
  WhatsAppMessageAnalyticsDto,
  WhatsAppBulkMessageDto,
  WhatsAppBulkMessageResultDto,
} from '../dto/whatsapp-messages.dto';
import { WhatsAppMessageStatus, WhatsAppMessageType } from '../dto/whatsapp-base.dto';

@Injectable()
export class WhatsAppMessagesService {
  private readonly logger = new Logger(WhatsAppMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly providerFactory: WhatsAppProviderFactoryService,
  ) {}

  async send(sendMessageDto: SendWhatsAppMessageDto, organizationId: string, userId: string): Promise<WhatsAppMessageDto> {
    try {
      // Get default provider if not specified
      const providerId = sendMessageDto.providerId || await this.getDefaultProvider(organizationId);
      
      if (!providerId) {
        throw new Error('No WhatsApp provider configured');
      }

      // Mock message creation
      const message = {
        id: `wa_msg_${Date.now()}`,
        organizationId,
        providerId,
        recipient: sendMessageDto.recipient.phoneNumber,
        recipientName: sendMessageDto.recipient.name,
        type: sendMessageDto.type,
        status: WhatsAppMessageStatus.PENDING,
        content: sendMessageDto.text,
        media: sendMessageDto.media,
        location: sendMessageDto.location,
        templateName: sendMessageDto.templateName,
        templateData: sendMessageDto.templateComponents ? {
          language: sendMessageDto.templateLanguage,
          components: sendMessageDto.templateComponents,
        } : undefined,
        interactive: sendMessageDto.interactive,
        metadata: sendMessageDto.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Queue message for sending
      await this.queueService.addEmailTask({
        type: 'whatsapp-send',
        userId,
        metadata: {
          organizationId,
          providerId,
          messageData: sendMessageDto,
          messageId: message.id,
        },
      });

      return this.mapToDto(message);

    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async sendBulk(bulkMessageDto: WhatsAppBulkMessageDto, organizationId: string, userId: string): Promise<WhatsAppBulkMessageResultDto> {
    try {
      const batchId = `wa_bulk_${Date.now()}`;
      const messages: WhatsAppMessageDto[] = [];
      const errors: Array<{ recipient: string; error: string }> = [];

      // Process recipients in batches
      const batchSize = bulkMessageDto.batchSize || 100;
      const recipients = bulkMessageDto.recipients;
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          try {
            const messageDto: SendWhatsAppMessageDto = {
              recipient,
              type: bulkMessageDto.type,
              text: this.personalizeMessage(bulkMessageDto.text || '', recipient, bulkMessageDto.personalizationData),
              media: bulkMessageDto.media,
              templateName: bulkMessageDto.templateName,
              templateLanguage: bulkMessageDto.templateLanguage,
              templateComponents: bulkMessageDto.templateComponents,
              providerId: bulkMessageDto.providerId,
              metadata: bulkMessageDto.metadata,
            };

            const message = await this.send(messageDto, organizationId, userId);
            messages.push(message);

          } catch (error) {
            errors.push({
              recipient: recipient.phoneNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Delay between batches
        if (i + batchSize < recipients.length && bulkMessageDto.delayBetweenBatches) {
          await new Promise(resolve => setTimeout(resolve, bulkMessageDto.delayBetweenBatches));
        }
      }

      return {
        batchId,
        totalRecipients: recipients.length,
        successCount: messages.length,
        failureCount: errors.length,
        pendingCount: messages.filter(m => m.status === WhatsAppMessageStatus.PENDING).length,
        messages,
        errors,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to send bulk WhatsApp messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async findAll(query: GetWhatsAppMessagesQueryDto, organizationId: string): Promise<GetWhatsAppMessagesResponseDto> {
    // Mock data since table doesn't exist
    const messages: any[] = [];
    const total = 0;

    const messagesDto = messages.map(message => this.mapToDto(message));

    return {
      messages: messagesDto,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 50,
        total,
        pages: Math.ceil(total / (query.limit || 50)),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<WhatsAppMessageDto> {
    // Mock message data
    const message = {
      id,
      organizationId,
      providerId: 'mock_provider',
      recipient: '+1234567890',
      recipientName: 'Mock User',
      type: WhatsAppMessageType.TEXT,
      status: WhatsAppMessageStatus.SENT,
      content: 'Mock message content',
      messageId: 'mock_msg_id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.mapToDto(message);
  }

  async getAnalytics(organizationId: string, days: number = 30): Promise<WhatsAppMessageAnalyticsDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Mock analytics data
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      deliveryRate: 0,
      readRate: 0,
      avgDeliveryTime: 0,
      byType: {},
      byStatus: {},
      timeSeries: [],
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }

  async updateStatus(messageId: string, status: WhatsAppMessageStatus, metadata?: Record<string, any>): Promise<void> {
    try {
      // Mock status update
      this.logger.log(`Updated message ${messageId} status to ${status}`);
      
      // Update real-time counters
      await this.updateMessageCounters(messageId, status);

    } catch (error) {
      this.logger.error(`Failed to update message status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getDefaultProvider(organizationId: string): Promise<string | null> {
    // Mock default provider
    return 'mock_provider_id';
  }

  private personalizeMessage(template: string, recipient: any, personalizationData?: Record<string, any>): string {
    if (!template) return '';

    let message = template;
    
    // Replace recipient-specific variables
    message = message.replace(/{{name}}/g, recipient.name || 'Customer');
    message = message.replace(/{{phone}}/g, recipient.phoneNumber || '');
    
    // Replace custom personalization data
    if (personalizationData) {
      Object.entries(personalizationData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, String(value));
      });
    }

    return message;
  }

  private async updateMessageCounters(messageId: string, status: WhatsAppMessageStatus): Promise<void> {
    try {
      const dateKey = new Date().toISOString().split('T')[0];
      
      // Update daily counters
      await this.redis.increment(`whatsapp:messages:${dateKey}:${status.toLowerCase()}`);
      await this.redis.expire(`whatsapp:messages:${dateKey}:${status.toLowerCase()}`, 86400 * 30);

    } catch (error) {
      this.logger.error(`Error updating message counters: ${error}`);
    }
  }

  private mapToDto(message: any): WhatsAppMessageDto {
    return {
      id: message.id,
      organizationId: message.organizationId,
      providerId: message.providerId,
      recipient: message.recipient,
      recipientName: message.recipientName,
      type: message.type,
      status: message.status,
      content: message.content,
      media: message.media,
      location: message.location,
      templateName: message.templateName,
      templateData: message.templateData,
      interactive: message.interactive,
      messageId: message.messageId,
      conversationId: message.conversationId,
      error: message.error,
      sentAt: message.sentAt?.toISOString(),
      deliveredAt: message.deliveredAt?.toISOString(),
      readAt: message.readAt?.toISOString(),
      failedAt: message.failedAt?.toISOString(),
      metadata: message.metadata || {},
      createdAt: message.createdAt?.toISOString() || '',
      updatedAt: message.updatedAt?.toISOString() || '',
    };
  }
}