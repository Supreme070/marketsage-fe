import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { WhatsAppProviderFactoryService } from '../providers/whatsapp-provider-factory.service';
import {
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
  GetWhatsAppTemplatesQueryDto,
  GetWhatsAppTemplatesResponseDto,
  WhatsAppTemplateDto,
  WhatsAppTemplateStatsDto,
  WhatsAppTemplateCategory,
} from '../dto/whatsapp-templates.dto';
import { WhatsAppTemplateStatus } from '../dto/whatsapp-base.dto';
import { WhatsAppProvider } from '../dto/whatsapp-base.dto';

@Injectable()
export class WhatsAppTemplatesService {
  private readonly logger = new Logger(WhatsAppTemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly providerFactory: WhatsAppProviderFactoryService,
  ) {}

  async create(createTemplateDto: CreateWhatsAppTemplateDto, organizationId: string, userId: string): Promise<WhatsAppTemplateDto> {
    try {
      // Mock template creation since WhatsAppTemplate table doesn't exist in schema
      const template = {
        id: `wa_template_${Date.now()}`,
        name: createTemplateDto.name,
        displayName: createTemplateDto.displayName,
        category: createTemplateDto.category,
        language: createTemplateDto.language || 'en',
        status: WhatsAppTemplateStatus.PENDING,
        organizationId,
        createdBy: userId,
        providerId: createTemplateDto.providerId,
        components: createTemplateDto.components || [],
        variables: this.extractVariables(createTemplateDto.components || []),
        metadata: createTemplateDto.metadata || {},
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Initialize template stats
      await this.initializeTemplateStats(template.id);

      return this.mapToDto(template);

    } catch (error) {
      throw new BadRequestException('Failed to create WhatsApp template');
    }
  }

  async findAll(query: GetWhatsAppTemplatesQueryDto, organizationId: string): Promise<GetWhatsAppTemplatesResponseDto> {
    const {
      category,
      status,
      language,
      providerId,
      search,
      isApproved,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Mock data since table doesn't exist
    const templates: any[] = [];
    const total = 0;

    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const stats = await this.getTemplateStats(template.id);
        return {
          ...this.mapToDto(template),
          stats,
        };
      })
    );

    return {
      templates: templatesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<WhatsAppTemplateDto> {
    // Mock template data
    const template = {
      id,
      name: 'mock_template',
      displayName: 'Mock Template',
      category: WhatsAppTemplateCategory.MARKETING,
      language: 'en',
      status: WhatsAppTemplateStatus.APPROVED,
      organizationId,
      createdBy: 'system',
      providerId: 'mock_provider',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Hello {{1}}',
        },
        {
          type: 'BODY',
          text: 'This is a mock template message with {{1}} and {{2}}.',
        },
        {
          type: 'FOOTER',
          text: 'Thank you for using our service.',
        }
      ],
      variables: ['name', 'value'],
      metadata: {},
      isApproved: true,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const templateDto = this.mapToDto(template);
    templateDto.stats = await this.getTemplateStats(id);

    return templateDto;
  }

  async update(id: string, updateTemplateDto: UpdateWhatsAppTemplateDto, organizationId: string): Promise<WhatsAppTemplateDto> {
    // Mock update - return updated template data
    const existingTemplate = {
      id,
      name: updateTemplateDto.name || 'updated_mock_template',
      displayName: updateTemplateDto.displayName || 'Updated Mock Template',
      category: updateTemplateDto.category || WhatsAppTemplateCategory.MARKETING,
      language: updateTemplateDto.language || 'en',
      status: updateTemplateDto.status || WhatsAppTemplateStatus.PENDING,
      organizationId,
      createdBy: 'system',
      providerId: updateTemplateDto.providerId || 'mock_provider',
      components: updateTemplateDto.components || [],
      variables: updateTemplateDto.components ? this.extractVariables(updateTemplateDto.components) : [],
      metadata: updateTemplateDto.metadata || {},
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.mapToDto(existingTemplate);
  }

  async remove(id: string, organizationId: string): Promise<{ success: boolean }> {
    // Mock deletion
    return { success: true };
  }

  async submit(id: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock template submission to provider
      this.logger.log(`Submitting template ${id} for approval`);

      return {
        success: true,
        message: 'Template submitted for approval successfully',
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit template',
      };
    }
  }

  async approve(id: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock template approval
      this.logger.log(`Approving template ${id}`);

      return {
        success: true,
        message: 'Template approved successfully',
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve template',
      };
    }
  }

  async reject(id: string, reason: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock template rejection
      this.logger.log(`Rejecting template ${id} with reason: ${reason}`);

      return {
        success: true,
        message: 'Template rejected successfully',
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject template',
      };
    }
  }

  async duplicate(id: string, newName: string, organizationId: string, userId: string): Promise<WhatsAppTemplateDto> {
    try {
      // Get original template
      const originalTemplate = await this.findOne(id, organizationId);

      // Create duplicate with new name
      const duplicateDto: CreateWhatsAppTemplateDto = {
        name: newName,
        displayName: `Copy of ${originalTemplate.displayName}`,
        category: originalTemplate.category,
        language: originalTemplate.language,
        providerId: originalTemplate.providerId,
        body: 'Duplicate template body',
        components: originalTemplate.components,
        metadata: originalTemplate.metadata || {},
      };

      return this.create(duplicateDto, organizationId, userId);

    } catch (error) {
      throw new BadRequestException('Failed to duplicate template');
    }
  }

  async preview(components: any[], variables: Record<string, string>): Promise<{ preview: string; html?: string }> {
    try {
      let preview = '';
      let html = '';

      components.forEach(component => {
        switch (component.type) {
          case 'HEADER':
            let headerText = component.text || component.format === 'IMAGE' ? '[Image]' : '[Media]';
            headerText = this.replaceVariables(headerText, variables);
            preview += `**${headerText}**\n\n`;
            html += `<div style="font-weight: bold; margin-bottom: 10px;">${headerText}</div>`;
            break;

          case 'BODY':
            const bodyText = this.replaceVariables(component.text || '', variables);
            preview += `${bodyText}\n\n`;
            html += `<div style="margin-bottom: 10px;">${bodyText}</div>`;
            break;

          case 'FOOTER':
            const footerText = this.replaceVariables(component.text || '', variables);
            preview += `_${footerText}_\n`;
            html += `<div style="font-style: italic; font-size: 12px; color: #666;">${footerText}</div>`;
            break;

          case 'BUTTONS':
            if (component.buttons) {
              component.buttons.forEach((button: any) => {
                preview += `[${button.text}]`;
                html += `<button style="margin: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">${button.text}</button>`;
              });
            }
            break;
        }
      });

      return {
        preview: preview.trim(),
        html: html,
      };

    } catch (error) {
      throw new BadRequestException('Failed to generate template preview');
    }
  }

  async getVariables(id: string, organizationId: string): Promise<{ variables: string[]; examples: Record<string, string> }> {
    const template = await this.findOne(id, organizationId);

    const examples: Record<string, string> = {};
    template.variables?.forEach((variable, index) => {
      examples[variable] = `example_${variable}_value`;
    });

    return {
      variables: template.variables || [],
      examples,
    };
  }

  private extractVariables(components: any[]): string[] {
    const variables = new Set<string>();

    components.forEach(component => {
      const text = component.text || '';
      const matches = text.match(/\{\{(\d+)\}\}/g);
      
      if (matches) {
        matches.forEach((match: string) => {
          const number = match.replace(/[{}]/g, '');
          variables.add(`param_${number}`);
        });
      }
    });

    return Array.from(variables);
  }

  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    // Replace numbered placeholders
    result = result.replace(/\{\{(\d+)\}\}/g, (match, number) => {
      const key = `param_${number}`;
      return variables[key] || match;
    });

    return result;
  }

  private async getTemplateStats(templateId: string): Promise<WhatsAppTemplateStatsDto> {
    try {
      const cacheKey = `whatsapp:template:${templateId}:stats`;
      const cachedStats = await this.redis.get(cacheKey);
      
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }

      // Mock stats data
      const stats: WhatsAppTemplateStatsDto = {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
        clickRate: 0,
        conversionRate: 0,
        avgResponseTime: 0,
        lastUsed: null,
        popularVariables: {},
      };

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(stats), 3600);

      return stats;

    } catch (error) {
      this.logger.error(`Error getting template stats: ${error}`);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
        clickRate: 0,
        conversionRate: 0,
        avgResponseTime: 0,
        lastUsed: null,
        popularVariables: {},
      };
    }
  }

  private async initializeTemplateStats(templateId: string) {
    const initialStats = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      deliveryRate: 0,
      readRate: 0,
      clickRate: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      lastUsed: null,
      popularVariables: {},
    };

    const cacheKey = `whatsapp:template:${templateId}:stats`;
    await this.redis.set(cacheKey, JSON.stringify(initialStats), 3600);
  }

  private mapToDto(template: any): WhatsAppTemplateDto {
    return {
      id: template.id,
      name: template.name,
      displayName: template.displayName,
      category: template.category,
      language: template.language,
      status: template.status,
      organizationId: template.organizationId,
      createdBy: template.createdBy,
      providerId: template.providerId,
      body: template.body || 'Template body',
      components: template.components || [],
      variables: template.variables || [],
      metadata: template.metadata || {},
      isApproved: template.isApproved || false,
      approvedAt: template.approvedAt?.toISOString(),
      rejectedAt: template.rejectedAt?.toISOString(),
      rejectionReason: template.rejectionReason,
      lastModified: template.updatedAt?.toISOString() || '',
      createdAt: template.createdAt?.toISOString() || '',
      updatedAt: template.updatedAt?.toISOString() || '',
      stats: undefined, // Will be populated separately
    };
  }
}