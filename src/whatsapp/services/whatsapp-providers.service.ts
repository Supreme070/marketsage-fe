import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { WhatsAppProviderFactoryService } from '../providers/whatsapp-provider-factory.service';
import {
  CreateWhatsAppProviderDto,
  UpdateWhatsAppProviderDto,
  GetWhatsAppProvidersQueryDto,
  GetWhatsAppProvidersResponseDto,
  WhatsAppProviderDto,
  WhatsAppProviderStatsDto,
  TestWhatsAppProviderDto,
  WhatsAppProviderTestResultDto,
  WhatsAppProviderBalanceDto,
  WhatsAppProviderHealthDto,
  WhatsAppProviderStatus,
} from '../dto/whatsapp-providers.dto';
import { WhatsAppProvider } from '../dto/whatsapp-base.dto';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppProvidersService {
  private readonly logger = new Logger(WhatsAppProvidersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly providerFactory: WhatsAppProviderFactoryService,
  ) {}

  async create(createProviderDto: CreateWhatsAppProviderDto, organizationId: string, userId: string): Promise<WhatsAppProviderDto> {
    try {
      // Validate configuration
      this.validateConfig(createProviderDto.type, createProviderDto.config);

      // Encrypt sensitive configuration
      const encryptedConfig = this.encryptConfig(createProviderDto.config);

      // Mock provider creation since WhatsAppProvider table doesn't exist in schema
      const provider = {
        id: `wa_provider_${Date.now()}`,
        name: createProviderDto.name,
        description: createProviderDto.description,
        type: createProviderDto.type,
        phoneNumber: createProviderDto.phoneNumber,
        displayName: createProviderDto.displayName,
        status: WhatsAppProviderStatus.INACTIVE,
        organizationId,
        createdBy: userId,
        config: encryptedConfig,
        limits: createProviderDto.limits,
        priority: createProviderDto.priority || 0,
        isPrimary: createProviderDto.isPrimary || false,
        rateLimit: createProviderDto.rateLimit || 100,
        isDefault: createProviderDto.isDefault || false,
        metadata: createProviderDto.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Initialize provider stats
      await this.initializeProviderStats(provider.id);

      return this.mapToDto(provider);

    } catch (error) {
      throw new BadRequestException('Failed to create WhatsApp provider');
    }
  }

  async findAll(query: GetWhatsAppProvidersQueryDto, organizationId: string): Promise<GetWhatsAppProvidersResponseDto> {
    const {
      type,
      status,
      search,
      isDefault,
      page = 1,
      limit = 10,
      sortBy = 'priority',
      sortOrder = 'desc',
    } = query;

    // Mock data since table doesn't exist
    const providers: any[] = [];
    const total = 0;

    const providersWithStats = await Promise.all(
      providers.map(async (provider) => {
        const stats = await this.getProviderStats(provider.id);
        return {
          ...this.mapToDto(provider),
          stats,
        };
      })
    );

    return {
      providers: providersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<WhatsAppProviderDto> {
    // Mock provider data
    const provider = {
      id,
      name: 'Mock WhatsApp Provider',
      description: 'Mock provider data',
      type: WhatsAppProvider.META_BUSINESS,
      phoneNumber: '+1234567890',
      displayName: 'Mock Provider',
      status: WhatsAppProviderStatus.INACTIVE,
      organizationId,
      createdBy: 'system',
      config: {},
      limits: {},
      priority: 0,
      isPrimary: false,
      rateLimit: 100,
      isDefault: false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const providerDto = this.mapToDto(provider);
    providerDto.stats = await this.getProviderStats(id);
    providerDto.health = await this.checkProviderHealth(id);

    return providerDto;
  }

  async update(id: string, updateProviderDto: UpdateWhatsAppProviderDto, organizationId: string): Promise<WhatsAppProviderDto> {
    // Mock update - return updated provider data
    const existingProvider = {
      id,
      name: updateProviderDto.name || 'Updated Mock Provider',
      description: updateProviderDto.description,
      type: WhatsAppProvider.META_BUSINESS,
      phoneNumber: '+1234567890',
      displayName: updateProviderDto.displayName || 'Updated Mock Provider',
      status: updateProviderDto.status || WhatsAppProviderStatus.ACTIVE,
      organizationId,
      createdBy: 'system',
      config: updateProviderDto.config || {},
      limits: updateProviderDto.limits || {},
      priority: updateProviderDto.priority || 0,
      isPrimary: updateProviderDto.isPrimary || false,
      rateLimit: 100,
      isDefault: updateProviderDto.isDefault || false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.mapToDto(existingProvider);
  }

  async remove(id: string, organizationId: string): Promise<{ success: boolean }> {
    // Mock deletion
    return { success: true };
  }

  async test(id: string, testProviderDto: TestWhatsAppProviderDto, organizationId: string): Promise<WhatsAppProviderTestResultDto> {
    const startTime = Date.now();

    try {
      // Mock provider for testing
      const provider = {
        id,
        type: WhatsAppProvider.META_BUSINESS,
        config: {
          accessToken: 'mock_token',
          phoneNumberId: 'mock_phone_id',
        },
        phoneNumber: '+1234567890',
      };

      // Test with actual provider factory
      const result = await this.providerFactory.sendMessage(provider, {
        recipient: { phoneNumber: testProviderDto.testPhoneNumber },
        type: testProviderDto.messageType || 'text',
        text: testProviderDto.message,
      } as any);

      const responseTime = Date.now() - startTime;

      return {
        success: result.success,
        responseTime,
        messageId: result.messageId,
        error: result.error,
        message: result.success ? 'Test message sent successfully' : result.error || 'Test failed',
        providerResponse: result.providerResponse,
        testedAt: new Date().toISOString(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        testedAt: new Date().toISOString(),
      };
    }
  }

  async getBalance(id: string, organizationId: string): Promise<WhatsAppProviderBalanceDto> {
    try {
      // Mock balance data
      return {
        providerId: id,
        credits: 1000,
        currency: 'NGN',
        messageLimit: 10000,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to get balance for provider ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        providerId: id,
        credits: 0,
        currency: 'NGN',
        lastChecked: new Date().toISOString(),
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateConfig(type: WhatsAppProvider, config: any) {
    const requiredFields: Record<WhatsAppProvider, string[]> = {
      [WhatsAppProvider.TWILIO]: ['accountSid', 'authToken'],
      [WhatsAppProvider.META_BUSINESS]: ['accessToken', 'phoneNumberId'],
      [WhatsAppProvider.WHATSAPP_BUSINESS_API]: ['apiKey', 'apiUrl'],
    };

    const required = requiredFields[type] || [];
    const missing = required.filter(field => !(config as any)[field]);

    if (missing.length > 0) {
      throw new BadRequestException(`Missing required fields for ${type}: ${missing.join(', ')}`);
    }
  }

  private encryptConfig(config: any): any {
    // Simple encryption for demo - would use proper encryption in production
    const encrypted: any = { ...config };
    
    // Encrypt sensitive fields
    const sensitiveFields = ['accessToken', 'authToken', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }

  private encrypt(text: string): string {
    // Simple base64 encoding for demo - would use proper encryption
    return Buffer.from(text).toString('base64');
  }

  private async getProviderStats(providerId: string): Promise<WhatsAppProviderStatsDto> {
    try {
      const cacheKey = `whatsapp:provider:${providerId}:stats`;
      const cachedStats = await this.redis.get(cacheKey);
      
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }

      // Mock stats data
      const stats: WhatsAppProviderStatsDto = {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
        averageResponseTime: 0,
        lastUsed: null,
        uptime: 100,
        errorRate: 0,
      };

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(stats), 3600);

      return stats;

    } catch (error) {
      this.logger.error(`Error getting provider stats: ${error}`);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
        averageResponseTime: 0,
        lastUsed: null,
        uptime: 100,
        errorRate: 0,
      };
    }
  }

  private async checkProviderHealth(providerId: string): Promise<WhatsAppProviderHealthDto> {
    // Mock health data
    const health: WhatsAppProviderHealthDto = {
      status: 'operational',
      lastCheck: new Date().toISOString(),
      responseTime: 150,
      errorRate: 0.1,
      uptime: 99.9,
      webhookStatus: {
        operational: true,
        lastReceived: new Date().toISOString(),
      },
    };

    return health;
  }

  private async initializeProviderStats(providerId: string) {
    const initialStats = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      deliveryRate: 0,
      readRate: 0,
      averageResponseTime: 0,
      lastUsed: null,
      uptime: 100,
      errorRate: 0,
    };

    const cacheKey = `whatsapp:provider:${providerId}:stats`;
    await this.redis.set(cacheKey, JSON.stringify(initialStats), 3600);
  }

  private mapToDto(provider: any): WhatsAppProviderDto {
    return {
      id: provider.id,
      name: provider.name,
      description: provider.description,
      type: provider.type,
      status: provider.status,
      organizationId: provider.organizationId,
      createdBy: provider.createdBy,
      phoneNumber: provider.phoneNumber,
      displayName: provider.displayName,
      config: this.sanitizeConfig(provider.config),
      limits: provider.limits,
      stats: undefined, // Will be populated separately
      priority: provider.priority,
      isPrimary: provider.isPrimary,
      isDefault: provider.isDefault,
      lastTestResult: provider.lastTestResult,
      lastTestAt: provider.lastTestAt,
      createdAt: provider.createdAt?.toISOString() || '',
      updatedAt: provider.updatedAt?.toISOString() || '',
      health: undefined, // Will be populated separately
      rateLimit: provider.rateLimit,
      metadata: provider.metadata,
    };
  }

  private sanitizeConfig(config: any): any {
    if (!config) return {};

    const sanitized = { ...config };
    
    // Hide sensitive data
    const sensitiveFields = ['accessToken', 'authToken', 'apiKey', 'webhookSecret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[HIDDEN]';
      }
    });

    return sanitized;
  }
}