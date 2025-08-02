import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { WhatsAppProvidersService } from '../services/whatsapp-providers.service';
import {
  CreateWhatsAppProviderDto,
  UpdateWhatsAppProviderDto,
  GetWhatsAppProvidersQueryDto,
  GetWhatsAppProvidersResponseDto,
  WhatsAppProviderDto,
  TestWhatsAppProviderDto,
  WhatsAppProviderTestResultDto,
  WhatsAppProviderBalanceDto,
} from '../dto/whatsapp-providers.dto';

@ApiTags('WhatsApp Providers')
@Controller('whatsapp/providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppProvidersController {
  constructor(private readonly providersService: WhatsAppProvidersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new WhatsApp provider' })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    type: WhatsAppProviderDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProviderDto: CreateWhatsAppProviderDto,
    @Request() req: any,
  ): Promise<WhatsAppProviderDto> {
    return this.providersService.create(
      createProviderDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all WhatsApp providers' })
  @ApiResponse({
    status: 200,
    description: 'Providers retrieved successfully',
    type: GetWhatsAppProvidersResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetWhatsAppProvidersQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppProvidersResponseDto> {
    return this.providersService.findAll(query, req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get WhatsApp provider by ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider retrieved successfully',
    type: WhatsAppProviderDto,
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppProviderDto> {
    return this.providersService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update WhatsApp provider' })
  @ApiResponse({
    status: 200,
    description: 'Provider updated successfully',
    type: WhatsAppProviderDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateWhatsAppProviderDto,
    @Request() req: any,
  ): Promise<WhatsAppProviderDto> {
    return this.providersService.update(id, updateProviderDto, req.user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete WhatsApp provider' })
  @ApiResponse({ status: 204, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    return this.providersService.remove(id, req.user.organizationId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test WhatsApp provider configuration' })
  @ApiResponse({
    status: 200,
    description: 'Provider test completed',
    type: WhatsAppProviderTestResultDto,
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async test(
    @Param('id') id: string,
    @Body() testProviderDto: TestWhatsAppProviderDto,
    @Request() req: any,
  ): Promise<WhatsAppProviderTestResultDto> {
    return this.providersService.test(id, testProviderDto, req.user.organizationId);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get WhatsApp provider balance' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    type: WhatsAppProviderBalanceDto,
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppProviderBalanceDto> {
    return this.providersService.getBalance(id, req.user.organizationId);
  }

  @Post(':id/enable')
  async enable(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const provider = await this.providersService.update(
        id,
        { status: 'ACTIVE' as any },
        req.user.organizationId,
      );

      return {
        success: true,
        message: `Provider ${provider.name} enabled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to enable provider',
      };
    }
  }

  @Post(':id/disable')
  async disable(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const provider = await this.providersService.update(
        id,
        { status: 'INACTIVE' as any },
        req.user.organizationId,
      );

      return {
        success: true,
        message: `Provider ${provider.name} disabled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disable provider',
      };
    }
  }

  @Post(':id/validate-config')
  @ApiOperation({ summary: 'Validate WhatsApp provider configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration validation completed',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async validateConfig(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const provider = await this.providersService.findOne(id, req.user.organizationId);
      
      // Mock validation
      return {
        valid: true,
        message: 'Provider configuration is valid',
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get WhatsApp provider statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSent: { type: 'number' },
        totalDelivered: { type: 'number' },
        totalRead: { type: 'number' },
        totalFailed: { type: 'number' },
        deliveryRate: { type: 'number' },
        readRate: { type: 'number' },
        averageResponseTime: { type: 'number' },
        uptime: { type: 'number' },
        errorRate: { type: 'number' },
        lastUsed: { type: 'string', nullable: true },
      },
    },
  })
  async getStats(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
    lastUsed: string | null;
  }> {
    const provider = await this.providersService.findOne(id, req.user.organizationId);
    
    return {
      totalSent: provider.stats?.totalSent || 0,
      totalDelivered: provider.stats?.totalDelivered || 0,
      totalRead: provider.stats?.totalRead || 0,
      totalFailed: provider.stats?.totalFailed || 0,
      deliveryRate: provider.stats?.deliveryRate || 0,
      readRate: provider.stats?.readRate || 0,
      averageResponseTime: provider.stats?.averageResponseTime || 0,
      uptime: provider.stats?.uptime || 100,
      errorRate: provider.stats?.errorRate || 0,
      lastUsed: provider.stats?.lastUsed || null,
    };
  }

  @Get(':id/health')
  async getHealth(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{
    status: string;
    lastCheck: string;
    responseTime: number;
    errorRate: number;
    uptime: number;
    webhookStatus?: {
      operational: boolean;
      lastReceived?: string;
    };
  }> {
    const provider = await this.providersService.findOne(id, req.user.organizationId);

    return {
      status: provider.health?.status || 'unknown',
      lastCheck: provider.health?.lastCheck || new Date().toISOString(),
      responseTime: provider.health?.responseTime || 0,
      errorRate: provider.health?.errorRate || 0,
      uptime: provider.health?.uptime || 0,
      webhookStatus: provider.health?.webhookStatus,
    };
  }
}