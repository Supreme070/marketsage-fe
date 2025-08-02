import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WhatsAppMessagesService } from './whatsapp-messages.service';
import {
  IncomingWhatsAppWebhookDto,
  WhatsAppWebhookEventDto,
  WhatsAppWebhookStatsDto,
  GetWhatsAppWebhooksQueryDto,
  GetWhatsAppWebhooksResponseDto,
  WhatsAppWebhookDto,
} from '../dto/whatsapp-webhooks.dto';
import { WhatsAppMessageStatus, WhatsAppProvider } from '../dto/whatsapp-base.dto';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppWebhooksService {
  private readonly logger = new Logger(WhatsAppWebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly messagesService: WhatsAppMessagesService,
  ) {}

  async handleIncomingWebhook(
    providerId: string,
    organizationId: string,
    payload: IncomingWhatsAppWebhookDto,
    signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature if provided
      if (signature) {
        const isValid = await this.verifyWebhookSignature(providerId, payload, signature);
        if (!isValid) {
          this.logger.warn(`Invalid webhook signature for provider ${providerId}`);
          return {
            success: false,
            message: 'Invalid webhook signature',
          };
        }
      }

      // Process webhook based on provider type
      const provider = await this.getProvider(providerId);
      if (!provider) {
        this.logger.error(`Provider ${providerId} not found`);
        return {
          success: false,
          message: 'Provider not found',
        };
      }

      const events = await this.parseWebhookPayload(provider.type, payload);
      
      // Process each event
      for (const event of events) {
        await this.processWebhookEvent(organizationId, providerId, event);
      }

      // Update webhook stats
      await this.updateWebhookStats(providerId, events.length);

      // Log webhook event
      await this.logWebhookEvent(providerId, organizationId, payload, events);

      return {
        success: true,
        message: `Processed ${events.length} webhook events successfully`,
      };

    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log failed webhook
      await this.logWebhookEvent(providerId, organizationId, payload, [], error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        message: 'Webhook processing failed',
      };
    }
  }

  async findAll(query: GetWhatsAppWebhooksQueryDto, organizationId: string): Promise<GetWhatsAppWebhooksResponseDto> {
    const {
      providerId,
      eventType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Mock data since table doesn't exist
    const webhooks: any[] = [];
    const total = 0;

    const webhooksDto = webhooks.map(webhook => this.mapToDto(webhook));

    return {
      webhooks: webhooksDto,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<WhatsAppWebhookDto> {
    // Mock webhook data
    const webhook = {
      id,
      organizationId,
      providerId: 'mock_provider',
      eventType: 'message.status',
      payload: {
        messageId: 'mock_message_id',
        status: 'delivered',
        timestamp: new Date().toISOString(),
      },
      signature: 'mock_signature',
      status: 'processed',
      processedAt: new Date(),
      createdAt: new Date(),
    };

    return this.mapToDto(webhook);
  }

  async getStats(organizationId: string, providerId?: string, days: number = 30): Promise<WhatsAppWebhookStatsDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const cacheKey = `whatsapp:webhooks:stats:${organizationId}:${providerId || 'all'}:${days}`;
      const cachedStats = await this.redis.get(cacheKey);
      
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }

      // Mock stats data
      const stats: WhatsAppWebhookStatsDto = {
        totalReceived: 0,
        totalProcessed: 0,
        totalFailed: 0,
        successRate: 0,
        avgProcessingTime: 0,
        byEventType: {},
        byProvider: {},
        recentEvents: [],
        failureReasons: {},
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      };

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(stats), 3600);

      return stats;

    } catch (error) {
      this.logger.error(`Error getting webhook stats: ${error}`);
      return {
        totalReceived: 0,
        totalProcessed: 0,
        totalFailed: 0,
        successRate: 0,
        avgProcessingTime: 0,
        byEventType: {},
        byProvider: {},
        recentEvents: [],
        failureReasons: {},
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      };
    }
  }

  async retry(id: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const webhook = await this.findOne(id, organizationId);
      
      // Reprocess the webhook
      const events = await this.parseWebhookPayload(WhatsAppProvider.META_BUSINESS, webhook.payload);
      
      for (const event of events) {
        await this.processWebhookEvent(organizationId, webhook.providerId || 'default_provider', event);
      }

      return {
        success: true,
        message: 'Webhook reprocessed successfully',
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retry webhook',
      };
    }
  }

  private async verifyWebhookSignature(providerId: string, payload: any, signature: string): Promise<boolean> {
    try {
      // Get provider webhook secret
      const provider = await this.getProvider(providerId);
      if (!provider?.config?.webhookSecret) {
        return true; // Skip verification if no secret configured
      }

      const webhookSecret = provider.config.webhookSecret;
      const payloadString = JSON.stringify(payload);
      
      // Different providers use different signature formats
      switch (provider.type) {
        case WhatsAppProvider.META_BUSINESS:
          return this.verifyMetaBusinessSignature(payloadString, signature, webhookSecret);
        case WhatsAppProvider.TWILIO:
          return this.verifyTwilioSignature(payloadString, signature, webhookSecret);
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          return this.verifyBusinessAPISignature(payloadString, signature, webhookSecret);
        default:
          return true;
      }

    } catch (error) {
      this.logger.error(`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private verifyMetaBusinessSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }

  private verifyTwilioSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(payload)
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'base64'),
      Buffer.from(signature, 'base64')
    );
  }

  private verifyBusinessAPISignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  private async parseWebhookPayload(providerType: WhatsAppProvider, payload: any): Promise<WhatsAppWebhookEventDto[]> {
    const events: WhatsAppWebhookEventDto[] = [];

    try {
      switch (providerType) {
        case WhatsAppProvider.META_BUSINESS:
          events.push(...this.parseMetaBusinessWebhook(payload));
          break;
        case WhatsAppProvider.TWILIO:
          events.push(...this.parseTwilioWebhook(payload));
          break;
        case WhatsAppProvider.WHATSAPP_BUSINESS_API:
          events.push(...this.parseBusinessAPIWebhook(payload));
          break;
        default:
          this.logger.warn(`Unknown provider type: ${providerType}`);
      }

    } catch (error) {
      this.logger.error(`Failed to parse webhook payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return events;
  }

  private parseMetaBusinessWebhook(payload: any): WhatsAppWebhookEventDto[] {
    const events: WhatsAppWebhookEventDto[] = [];

    if (payload.entry) {
      payload.entry.forEach((entry: any) => {
        if (entry.changes) {
          entry.changes.forEach((change: any) => {
            if (change.value) {
              // Parse status updates
              if (change.value.statuses) {
                change.value.statuses.forEach((status: any) => {
                  events.push({
                    eventType: 'message.status',
                    messageId: status.id,
                    status: this.mapMetaBusinessStatus(status.status),
                    timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
                    recipient: status.recipient_id,
                    metadata: {
                      conversationId: status.conversation?.id,
                      errorCode: status.errors?.[0]?.code,
                      errorMessage: status.errors?.[0]?.title,
                    },
                  });
                });
              }

              // Parse incoming messages
              if (change.value.messages) {
                change.value.messages.forEach((message: any) => {
                  events.push({
                    eventType: 'message.received',
                    messageId: message.id,
                    status: WhatsAppMessageStatus.RECEIVED,
                    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                    sender: message.from,
                    recipient: change.value.metadata?.phone_number_id,
                    content: message.text?.body || message.type,
                    metadata: {
                      messageType: message.type,
                      conversationId: message.context?.id,
                    },
                  });
                });
              }
            }
          });
        }
      });
    }

    return events;
  }

  private parseTwilioWebhook(payload: any): WhatsAppWebhookEventDto[] {
    const events: WhatsAppWebhookEventDto[] = [];

    if (payload.MessageSid) {
      events.push({
        eventType: 'message.status',
        messageId: payload.MessageSid,
        status: this.mapTwilioStatus(payload.MessageStatus),
        timestamp: new Date().toISOString(),
        recipient: payload.To?.replace('whatsapp:', ''),
        sender: payload.From?.replace('whatsapp:', ''),
        metadata: {
          errorCode: payload.ErrorCode,
          errorMessage: payload.ErrorMessage,
          accountSid: payload.AccountSid,
        },
      });
    }

    return events;
  }

  private parseBusinessAPIWebhook(payload: any): WhatsAppWebhookEventDto[] {
    const events: WhatsAppWebhookEventDto[] = [];

    if (payload.message_id && payload.status) {
      events.push({
        eventType: 'message.status',
        messageId: payload.message_id,
        status: this.mapBusinessAPIStatus(payload.status),
        timestamp: payload.timestamp || new Date().toISOString(),
        recipient: payload.recipient,
        metadata: payload.metadata || {},
      });
    }

    return events;
  }

  private async processWebhookEvent(organizationId: string, providerId: string, event: WhatsAppWebhookEventDto): Promise<void> {
    try {
      switch (event.eventType) {
        case 'message.status':
          if (event.messageId && event.status) {
            await this.messagesService.updateStatus(event.messageId, event.status, event.metadata);
          }
          break;

        case 'message.received':
          // Handle incoming messages
          this.logger.log(`Received message ${event.messageId} from ${event.sender}`);
          break;

        default:
          this.logger.warn(`Unknown event type: ${event.eventType}`);
      }

      // Update event processing stats
      await this.updateEventStats(providerId, event.eventType, true);

    } catch (error) {
      this.logger.error(`Failed to process webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateEventStats(providerId, event.eventType, false);
    }
  }

  private mapMetaBusinessStatus(status: string): WhatsAppMessageStatus {
    switch (status) {
      case 'sent':
        return WhatsAppMessageStatus.SENT;
      case 'delivered':
        return WhatsAppMessageStatus.DELIVERED;
      case 'read':
        return WhatsAppMessageStatus.READ;
      case 'failed':
        return WhatsAppMessageStatus.FAILED;
      default:
        return WhatsAppMessageStatus.PENDING;
    }
  }

  private mapTwilioStatus(status: string): WhatsAppMessageStatus {
    switch (status) {
      case 'sent':
        return WhatsAppMessageStatus.SENT;
      case 'delivered':
        return WhatsAppMessageStatus.DELIVERED;
      case 'read':
        return WhatsAppMessageStatus.READ;
      case 'failed':
      case 'undelivered':
        return WhatsAppMessageStatus.FAILED;
      default:
        return WhatsAppMessageStatus.PENDING;
    }
  }

  private mapBusinessAPIStatus(status: string): WhatsAppMessageStatus {
    switch (status) {
      case 'sent':
        return WhatsAppMessageStatus.SENT;
      case 'delivered':
        return WhatsAppMessageStatus.DELIVERED;
      case 'read':
        return WhatsAppMessageStatus.READ;
      case 'failed':
        return WhatsAppMessageStatus.FAILED;
      default:
        return WhatsAppMessageStatus.PENDING;
    }
  }

  private async getProvider(providerId: string): Promise<any> {
    // Mock provider data
    return {
      id: providerId,
      type: WhatsAppProvider.META_BUSINESS,
      config: {
        webhookSecret: 'mock_secret',
      },
    };
  }

  private async updateWebhookStats(providerId: string, eventCount: number): Promise<void> {
    try {
      const dateKey = new Date().toISOString().split('T')[0];
      
      await this.redis.increment(`whatsapp:webhooks:${providerId}:${dateKey}:received`);
      await this.redis.increment(`whatsapp:webhooks:${providerId}:${dateKey}:processed`);
      await this.redis.expire(`whatsapp:webhooks:${providerId}:${dateKey}:received`, 86400 * 30);
      await this.redis.expire(`whatsapp:webhooks:${providerId}:${dateKey}:processed`, 86400 * 30);

    } catch (error) {
      this.logger.error(`Failed to update webhook stats: ${error}`);
    }
  }

  private async updateEventStats(providerId: string, eventType: string, success: boolean): Promise<void> {
    try {
      const dateKey = new Date().toISOString().split('T')[0];
      const statusKey = success ? 'processed' : 'failed';
      
      await this.redis.increment(`whatsapp:events:${providerId}:${dateKey}:${eventType}:${statusKey}`);
      await this.redis.expire(`whatsapp:events:${providerId}:${dateKey}:${eventType}:${statusKey}`, 86400 * 30);

    } catch (error) {
      this.logger.error(`Failed to update event stats: ${error}`);
    }
  }

  private async logWebhookEvent(
    providerId: string,
    organizationId: string,
    payload: any,
    events: WhatsAppWebhookEventDto[],
    error?: string,
  ): Promise<void> {
    try {
      const webhookLog = {
        id: `webhook_${Date.now()}`,
        organizationId,
        providerId,
        payload,
        eventCount: events.length,
        events,
        status: error ? 'failed' : 'processed',
        error,
        processedAt: new Date(),
        createdAt: new Date(),
      };

      // In a real implementation, this would be saved to database
      this.logger.log(`Webhook logged: ${webhookLog.id}`);

    } catch (error) {
      this.logger.error(`Failed to log webhook event: ${error}`);
    }
  }

  private mapToDto(webhook: any): WhatsAppWebhookDto {
    return {
      id: webhook.id,
      name: webhook.name || 'Webhook',
      description: webhook.description,
      url: webhook.url || '',
      status: webhook.status,
      organizationId: webhook.organizationId,
      createdBy: webhook.createdBy || 'system',
      events: webhook.events || [],
      secret: webhook.secret,
      providerId: webhook.providerId,
      headers: webhook.headers,
      timeout: webhook.timeout,
      maxRetries: webhook.maxRetries,
      verifySSL: webhook.verifySSL,
      isGlobal: webhook.isGlobal,
      createdAt: webhook.createdAt?.toISOString() || '',
      updatedAt: webhook.updatedAt?.toISOString() || '',
      eventType: webhook.eventType,
      payload: webhook.payload,
      signature: webhook.signature,
      error: webhook.error,
      processedAt: webhook.processedAt?.toISOString(),
    };
  }
}