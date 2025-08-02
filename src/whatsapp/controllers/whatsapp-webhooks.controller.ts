import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { WhatsAppWebhooksService } from '../services/whatsapp-webhooks.service';
import {
  IncomingWhatsAppWebhookDto,
  WhatsAppWebhookStatsDto,
  GetWhatsAppWebhooksQueryDto,
  GetWhatsAppWebhooksResponseDto,
  WhatsAppWebhookDto,
} from '../dto/whatsapp-webhooks.dto';

@ApiTags('WhatsApp Webhooks')
@Controller('whatsapp/webhooks')
export class WhatsAppWebhooksController {
  private readonly logger = new Logger(WhatsAppWebhooksController.name);

  constructor(private readonly webhooksService: WhatsAppWebhooksService) {}

  @Post(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming WhatsApp webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handleWebhook(
    @Param('providerId') providerId: string,
    @Body() payload: IncomingWhatsAppWebhookDto,
    @Headers('x-hub-signature-256') signature?: string,
    @Headers('x-twilio-signature') twilioSignature?: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Use appropriate signature header based on provider
      const webhookSignature = signature || twilioSignature;
      
      // For webhook verification, organizationId might be in query params
      const orgId = organizationId || 'default';

      const result = await this.webhooksService.handleIncomingWebhook(
        providerId,
        orgId,
        payload,
        webhookSignature,
      );

      if (result.success) {
        this.logger.log(`Webhook processed successfully for provider ${providerId}`);
      } else {
        this.logger.warn(`Webhook processing failed for provider ${providerId}: ${result.message}`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Webhook handling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetWhatsAppWebhooksQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(query, req.user.organizationId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({
    status: 200,
    description: 'Webhook statistics retrieved successfully',
    type: WhatsAppWebhookStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Query('providerId') providerId?: string,
    @Query('days') days?: number,
    @Request() req?: any,
  ): Promise<WhatsAppWebhookStatsDto> {
    return this.webhooksService.getStats(
      req?.user?.organizationId || 'default',
      providerId,
      days,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event retrieved successfully',
    type: WhatsAppWebhookDto,
  })
  @ApiResponse({ status: 404, description: 'Webhook event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppWebhookDto> {
    return this.webhooksService.findOne(id, req.user.organizationId);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry processing webhook event' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event reprocessed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Webhook event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async retry(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.webhooksService.retry(id, req.user.organizationId);
  }

  @Get('provider/:providerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook events by provider' })
  @ApiResponse({
    status: 200,
    description: 'Provider webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByProvider(
    @Param('providerId') providerId: string,
    @Query() query: GetWhatsAppWebhooksQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(
      { ...query, providerId },
      req.user.organizationId,
    );
  }

  @Get('event/:eventType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook events by event type' })
  @ApiResponse({
    status: 200,
    description: 'Event type webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByEventType(
    @Param('eventType') eventType: string,
    @Query() query: GetWhatsAppWebhooksQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(
      { ...query, eventType },
      req.user.organizationId,
    );
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook events by status' })
  @ApiResponse({
    status: 200,
    description: 'Status webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByStatus(
    @Param('status') status: string,
    @Query() query: GetWhatsAppWebhooksQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(
      { ...query, status: status as any },
      req.user.organizationId,
    );
  }

  @Get('failed/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get failed webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Failed webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFailed(
    @Query() query: GetWhatsAppWebhooksQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(
      { ...query, status: 'failed' as any },
      req.user.organizationId,
    );
  }

  @Get('recent/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Recent webhook events retrieved successfully',
    type: GetWhatsAppWebhooksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecent(
    @Query('limit') limit?: number,
    @Request() req?: any,
  ): Promise<GetWhatsAppWebhooksResponseDto> {
    return this.webhooksService.findAll(
      {
        page: 1,
        limit: limit || 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      req?.user?.organizationId || 'default',
    );
  }

  // Webhook verification endpoint for Meta Business API
  @Get('verify/:providerId')
  @ApiOperation({ summary: 'Verify webhook endpoint for Meta Business API' })
  @ApiResponse({
    status: 200,
    description: 'Webhook verification successful',
    schema: { type: 'string' },
  })
  @ApiResponse({ status: 400, description: 'Invalid verification request' })
  async verifyWebhook(
    @Param('providerId') providerId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ): Promise<string> {
    try {
      // In a real implementation, you would validate the verify token
      // against the one configured for the provider
      const expectedToken = 'your_verify_token'; // This should come from provider config

      if (mode === 'subscribe' && verifyToken === expectedToken) {
        this.logger.log(`Webhook verification successful for provider ${providerId}`);
        return challenge;
      } else {
        this.logger.warn(`Webhook verification failed for provider ${providerId}`);
        throw new Error('Invalid verification token');
      }

    } catch (error) {
      this.logger.error(`Webhook verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Health check endpoint for webhook status
  @Get('health/:providerId')
  @ApiOperation({ summary: 'Check webhook health status' })
  @ApiResponse({
    status: 200,
    description: 'Webhook health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        lastReceived: { type: 'string', nullable: true },
        eventsProcessed: { type: 'number' },
        errorRate: { type: 'number' },
      },
    },
  })
  async getHealth(
    @Param('providerId') providerId: string,
  ): Promise<{
    status: string;
    lastReceived: string | null;
    eventsProcessed: number;
    errorRate: number;
  }> {
    try {
      const stats = await this.webhooksService.getStats('default', providerId, 1);
      
      return {
        status: stats.successRate > 95 ? 'healthy' : stats.successRate > 80 ? 'degraded' : 'unhealthy',
        lastReceived: stats.recentEvents[0]?.timestamp || null,
        eventsProcessed: stats.totalProcessed,
        errorRate: ((stats.totalFailed / (stats.totalReceived || 1)) * 100),
      };

    } catch (error) {
      return {
        status: 'unknown',
        lastReceived: null,
        eventsProcessed: 0,
        errorRate: 0,
      };
    }
  }
}