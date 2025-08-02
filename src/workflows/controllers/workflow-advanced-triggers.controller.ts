import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { 
  WorkflowAdvancedTriggersService, 
  AdvancedTrigger, 
  AdvancedTriggerType,
  TriggerExecutionContext,
} from '../services/workflow-advanced-triggers.service';

@ApiTags('Advanced Workflow Triggers')
@Controller('workflows/advanced-triggers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowAdvancedTriggersController {
  constructor(
    private readonly advancedTriggersService: WorkflowAdvancedTriggersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create advanced workflow trigger' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Advanced trigger created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        workflowId: { type: 'string' },
        type: { type: 'string', enum: Object.values(AdvancedTriggerType) },
        name: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
        config: { type: 'object' },
        organizationId: { type: 'string' },
        createdBy: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        triggerCount: { type: 'number' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
      },
    },
  })
  async createAdvancedTrigger(
    @Body()
    createDto: {
      workflowId: string;
      type: AdvancedTriggerType;
      name: string;
      description?: string;
      isActive?: boolean;
      config: any;
    },
    @Request() req: any,
  ): Promise<AdvancedTrigger> {
    return this.advancedTriggersService.createAdvancedTrigger({
      ...createDto,
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
      isActive: createDto.isActive ?? true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get advanced workflow triggers' })
  @ApiQuery({ name: 'workflowId', required: false, description: 'Filter by workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Advanced triggers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          workflowId: { type: 'string' },
          type: { type: 'string' },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
          triggerCount: { type: 'number' },
          successCount: { type: 'number' },
          lastTriggered: { type: 'string' },
        },
      },
    },
  })
  async getAdvancedTriggers(
    @Query('workflowId') workflowId?: string,
    @Request() req?: any,
  ): Promise<AdvancedTrigger[]> {
    return this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
      workflowId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advanced trigger by ID' })
  @ApiParam({ name: 'id', description: 'Advanced trigger ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Advanced trigger retrieved successfully',
  })
  async getAdvancedTrigger(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<AdvancedTrigger | null> {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );
    return triggers.find(t => t.id === id) || null;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update advanced workflow trigger' })
  @ApiParam({ name: 'id', description: 'Advanced trigger ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Advanced trigger updated successfully',
  })
  async updateAdvancedTrigger(
    @Param('id') id: string,
    @Body()
    updateDto: {
      name?: string;
      description?: string;
      isActive?: boolean;
      config?: any;
    },
    @Request() req: any,
  ): Promise<AdvancedTrigger> {
    return this.advancedTriggersService.updateAdvancedTrigger(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete advanced workflow trigger' })
  @ApiParam({ name: 'id', description: 'Advanced trigger ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Advanced trigger deleted successfully',
  })
  async deleteAdvancedTrigger(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    await this.advancedTriggersService.deleteAdvancedTrigger(
      id,
      req.user.organizationId,
    );
    
    return {
      success: true,
      message: 'Advanced trigger deleted successfully',
    };
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually execute advanced trigger' })
  @ApiParam({ name: 'id', description: 'Advanced trigger ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Advanced trigger executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        executed: { type: 'boolean' },
      },
    },
  })
  async executeAdvancedTrigger(
    @Param('id') id: string,
    @Body()
    executionData: {
      contactId?: string;
      eventData?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );
    const trigger = triggers.find(t => t.id === id);

    if (!trigger) {
      return {
        success: false,
        message: 'Advanced trigger not found',
        executed: false,
      };
    }

    const context: TriggerExecutionContext = {
      triggerId: id,
      workflowId: trigger.workflowId,
      organizationId: req.user.organizationId,
      contactId: executionData.contactId,
      eventData: executionData.eventData || {},
      timestamp: new Date().toISOString(),
      metadata: {
        ...executionData.metadata,
        manualExecution: true,
        executedBy: req.user.id,
      },
    };

    const executed = await this.advancedTriggersService.executeAdvancedTrigger(context);

    return {
      success: true,
      message: executed 
        ? 'Advanced trigger executed successfully' 
        : 'Advanced trigger conditions not met',
      executed,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get advanced trigger statistics' })
  @ApiParam({ name: 'id', description: 'Advanced trigger ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Advanced trigger statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        triggerCount: { type: 'number' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
        successRate: { type: 'number' },
        lastTriggered: { type: 'string' },
        averageResponseTime: { type: 'number' },
      },
    },
  })
  async getAdvancedTriggerStats(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.advancedTriggersService.getAdvancedTriggerStats(id);
  }

  @Post('types/behavioral/score')
  @ApiOperation({ summary: 'Handle behavioral score trigger' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Behavioral score trigger processed successfully',
  })
  async handleBehavioralScore(
    @Body()
    scoreData: {
      contactId: string;
      scoreType: 'ENGAGEMENT' | 'LEAD' | 'CUSTOMER_HEALTH' | 'CHURN_RISK';
      scores: Record<string, number>;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );

    const behavioralTriggers = triggers.filter(
      t => t.type === AdvancedTriggerType.BEHAVIORAL_SCORE && t.isActive,
    );

    let processedCount = 0;
    for (const trigger of behavioralTriggers) {
      await this.advancedTriggersService.handleBehavioralScore(
        trigger,
        scoreData.contactId,
        scoreData.scores,
      );
      processedCount++;
    }

    return {
      success: true,
      message: `Processed ${processedCount} behavioral score triggers`,
      processedTriggers: processedCount,
    };
  }

  @Post('types/field-change')
  @ApiOperation({ summary: 'Handle field change trigger' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field change trigger processed successfully',
  })
  async handleFieldChange(
    @Body()
    changeData: {
      contactId: string;
      fieldChanges: Record<string, { old: any; new: any }>;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );

    const fieldChangeTriggers = triggers.filter(
      t => t.type === AdvancedTriggerType.FIELD_CHANGED && t.isActive,
    );

    let processedCount = 0;
    for (const trigger of fieldChangeTriggers) {
      await this.advancedTriggersService.handleFieldChange(
        trigger,
        changeData.contactId,
        changeData.fieldChanges,
      );
      processedCount++;
    }

    return {
      success: true,
      message: `Processed ${processedCount} field change triggers`,
      processedTriggers: processedCount,
    };
  }

  @Post('types/pattern-detection')
  @ApiOperation({ summary: 'Handle pattern detection trigger' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pattern detection trigger processed successfully',
  })
  async handlePatternDetection(
    @Body()
    patternData: {
      events: Array<{
        type: string;
        timestamp: string;
        contactId: string;
        data: any;
      }>;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );

    const patternTriggers = triggers.filter(
      t => t.type === AdvancedTriggerType.PATTERN_DETECTED && t.isActive,
    );

    let processedCount = 0;
    for (const trigger of patternTriggers) {
      await this.advancedTriggersService.handlePatternDetection(
        trigger,
        req.user.organizationId,
        patternData.events,
      );
      processedCount++;
    }

    return {
      success: true,
      message: `Processed ${processedCount} pattern detection triggers`,
      processedTriggers: processedCount,
    };
  }

  @Post('types/external-event')
  @ApiOperation({ summary: 'Handle external event trigger' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'External event trigger processed successfully',
  })
  async handleExternalEvent(
    @Body()
    eventData: {
      source: string;
      webhookData: any;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );

    const externalTriggers = triggers.filter(
      t => t.type === AdvancedTriggerType.EXTERNAL_EVENT && 
          t.isActive &&
          t.config.external?.source === eventData.source,
    );

    let processedCount = 0;
    for (const trigger of externalTriggers) {
      await this.advancedTriggersService.handleExternalEvent(
        trigger,
        eventData.webhookData,
      );
      processedCount++;
    }

    return {
      success: true,
      message: `Processed ${processedCount} external event triggers`,
      processedTriggers: processedCount,
    };
  }

  @Post('types/ai-prediction')
  @ApiOperation({ summary: 'Handle AI prediction trigger' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI prediction trigger processed successfully',
  })
  async handleAIPrediction(
    @Body()
    predictionData: {
      contactId: string;
      predictions: Record<string, { score: number; confidence: number; features?: any }>;
    },
    @Request() req: any,
  ) {
    const triggers = await this.advancedTriggersService.getAdvancedTriggers(
      req.user.organizationId,
    );

    const aiTriggers = triggers.filter(
      t => t.type === AdvancedTriggerType.AI_PREDICTION && t.isActive,
    );

    let processedCount = 0;
    for (const trigger of aiTriggers) {
      await this.advancedTriggersService.handleAIPrediction(
        trigger,
        predictionData.contactId,
        predictionData.predictions,
      );
      processedCount++;
    }

    return {
      success: true,
      message: `Processed ${processedCount} AI prediction triggers`,
      processedTriggers: processedCount,
    };
  }

  @Get('templates/behavioral-score')
  @ApiOperation({ summary: 'Get behavioral score trigger template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Behavioral score trigger template',
  })
  async getBehavioralScoreTemplate() {
    return {
      type: AdvancedTriggerType.BEHAVIORAL_SCORE,
      name: 'High Engagement Score Trigger',
      description: 'Triggers when contact reaches high engagement score',
      config: {
        behavioral: {
          scoreThreshold: 80,
          scoreType: 'ENGAGEMENT',
          timeWindow: 7,
          includeAnonymous: false,
          segments: ['active_users', 'subscribers'],
        },
      },
    };
  }

  @Get('templates/recurring-schedule')
  @ApiOperation({ summary: 'Get recurring schedule trigger template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring schedule trigger template',
  })
  async getRecurringScheduleTemplate() {
    return {
      type: AdvancedTriggerType.RECURRING_SCHEDULE,
      name: 'Weekly Newsletter Trigger',
      description: 'Triggers weekly newsletter workflow',
      config: {
        schedule: {
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: [2], // Tuesday
          timeOfDay: '09:00',
          timezone: 'UTC',
        },
      },
    };
  }

  @Get('templates/field-change')
  @ApiOperation({ summary: 'Get field change trigger template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field change trigger template',
  })
  async getFieldChangeTemplate() {
    return {
      type: AdvancedTriggerType.FIELD_CHANGED,
      name: 'Status Change Trigger',
      description: 'Triggers when contact status changes',
      config: {
        fieldChange: {
          field: 'status',
          changeType: 'SPECIFIC',
          newValue: 'customer',
        },
      },
    };
  }

  @Get('templates/pattern-detection')
  @ApiOperation({ summary: 'Get pattern detection trigger template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pattern detection trigger template',
  })
  async getPatternDetectionTemplate() {
    return {
      type: AdvancedTriggerType.PATTERN_DETECTED,
      name: 'Purchase Intent Pattern',
      description: 'Detects purchase intent behavior pattern',
      config: {
        pattern: {
          events: ['page_view', 'product_view', 'cart_add'],
          sequence: true,
          timeWindow: 60, // 1 hour
          minimumOccurrences: 3,
          maximumGap: 30, // 30 minutes between events
        },
      },
    };
  }

  @Get('templates/external-event')
  @ApiOperation({ summary: 'Get external event trigger template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'External event trigger template',
  })
  async getExternalEventTemplate() {
    return {
      type: AdvancedTriggerType.EXTERNAL_EVENT,
      name: 'Stripe Payment Success',
      description: 'Triggers on successful Stripe payment',
      config: {
        external: {
          source: 'stripe',
          payloadMapping: {
            contactId: 'data.object.customer',
            amount: 'data.object.amount',
            currency: 'data.object.currency',
            paymentId: 'data.object.id',
          },
        },
      },
    };
  }
}