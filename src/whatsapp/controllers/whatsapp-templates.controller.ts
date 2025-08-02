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
import { WhatsAppTemplatesService } from '../services/whatsapp-templates.service';
import { WhatsAppTemplateSyncService } from '../services/whatsapp-template-sync.service';
import {
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
  GetWhatsAppTemplatesQueryDto,
  GetWhatsAppTemplatesResponseDto,
  WhatsAppTemplateDto,
  WhatsAppTemplatePreviewDto,
} from '../dto/whatsapp-templates.dto';

@ApiTags('WhatsApp Templates')
@Controller('whatsapp/templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppTemplatesController {
  constructor(
    private readonly templatesService: WhatsAppTemplatesService,
    private readonly templateSyncService: WhatsAppTemplateSyncService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new WhatsApp template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: WhatsAppTemplateDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createTemplateDto: CreateWhatsAppTemplateDto,
    @Request() req: any,
  ): Promise<WhatsAppTemplateDto> {
    return this.templatesService.create(
      createTemplateDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all WhatsApp templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(query, req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get WhatsApp template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: WhatsAppTemplateDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WhatsAppTemplateDto> {
    return this.templatesService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update WhatsApp template' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: WhatsAppTemplateDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateWhatsAppTemplateDto,
    @Request() req: any,
  ): Promise<WhatsAppTemplateDto> {
    return this.templatesService.update(id, updateTemplateDto, req.user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete WhatsApp template' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    return this.templatesService.remove(id, req.user.organizationId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit WhatsApp template for approval' })
  @ApiResponse({
    status: 200,
    description: 'Template submitted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submit(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.templatesService.submit(id, req.user.organizationId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve WhatsApp template' })
  @ApiResponse({
    status: 200,
    description: 'Template approved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async approve(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.templatesService.approve(id, req.user.organizationId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject WhatsApp template' })
  @ApiResponse({
    status: 200,
    description: 'Template rejected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.templatesService.reject(id, body.reason, req.user.organizationId);
  }

  @Post('sync/:providerId')
  @ApiOperation({ summary: 'Sync templates from WhatsApp provider' })
  @ApiResponse({
    status: 200,
    description: 'Templates synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        templatesUpdated: { type: 'number' },
        templatesAdded: { type: 'number' },
        templatesRemoved: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncTemplates(
    @Param('providerId') providerId: string,
    @Request() req: any,
  ) {
    // Get provider details - this would typically come from WhatsAppProvidersService
    const mockProvider = {
      id: providerId,
      type: 'META_BUSINESS' as any,
      config: {
        accessToken: 'mock_token',
        businessAccountId: 'mock_account_id',
      },
    };
    
    return this.templateSyncService.syncTemplates(mockProvider);
  }

  @Get(':templateName/status/:providerId')
  @ApiOperation({ summary: 'Get template status from provider' })
  @ApiResponse({
    status: 200,
    description: 'Template status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        status: { type: 'string' },
        language: { type: 'string' },
        category: { type: 'string' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  async getTemplateStatus(
    @Param('templateName') templateName: string,
    @Param('providerId') providerId: string,
    @Query('language') language: string = 'en',
    @Request() req: any,
  ) {
    // Get provider details - this would typically come from WhatsAppProvidersService
    const mockProvider = {
      id: providerId,
      type: 'META_BUSINESS' as any,
      config: {
        accessToken: 'mock_token',
        businessAccountId: 'mock_account_id',
      },
    };
    
    return this.templateSyncService.getTemplateStatus(mockProvider, templateName, language);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate WhatsApp template' })
  @ApiResponse({
    status: 201,
    description: 'Template duplicated successfully',
    type: WhatsAppTemplateDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name: string },
    @Request() req: any,
  ): Promise<WhatsAppTemplateDto> {
    return this.templatesService.duplicate(
      id,
      body.name,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview WhatsApp template with variables' })
  @ApiResponse({
    status: 200,
    description: 'Template preview generated successfully',
    type: WhatsAppTemplatePreviewDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async preview(
    @Body() 
    previewData: {
      components: any[];
      variables: Record<string, string>;
    },
    @Request() req: any,
  ): Promise<{ preview: string; html?: string }> {
    return this.templatesService.preview(
      previewData.components,
      previewData.variables,
    );
  }

  @Get(':id/variables')
  @ApiOperation({ summary: 'Get template variables and examples' })
  @ApiResponse({
    status: 200,
    description: 'Template variables retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        variables: {
          type: 'array',
          items: { type: 'string' },
        },
        examples: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getVariables(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ variables: string[]; examples: Record<string, string> }> {
    return this.templatesService.getVariables(id, req.user.organizationId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByCategory(
    @Param('category') category: string,
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(
      { ...query, category: category as any },
      req.user.organizationId,
    );
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get templates by status' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByStatus(
    @Param('status') status: string,
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(
      { ...query, status: status as any },
      req.user.organizationId,
    );
  }

  @Get('language/:language')
  @ApiOperation({ summary: 'Get templates by language' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByLanguage(
    @Param('language') language: string,
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(
      { ...query, language: language as any },
      req.user.organizationId,
    );
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get templates by provider' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByProvider(
    @Param('providerId') providerId: string,
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(
      { ...query, providerId },
      req.user.organizationId,
    );
  }

  @Get('approved/list')
  @ApiOperation({ summary: 'Get only approved templates' })
  @ApiResponse({
    status: 200,
    description: 'Approved templates retrieved successfully',
    type: GetWhatsAppTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApproved(
    @Query() query: GetWhatsAppTemplatesQueryDto,
    @Request() req: any,
  ): Promise<GetWhatsAppTemplatesResponseDto> {
    return this.templatesService.findAll(
      { ...query, isApproved: true },
      req.user.organizationId,
    );
  }
}