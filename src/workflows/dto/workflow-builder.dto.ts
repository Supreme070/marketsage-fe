import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum NodeType {
  TRIGGER = 'TRIGGER',
  CONDITION = 'CONDITION',
  ACTION = 'ACTION',
  DELAY = 'DELAY',
  BRANCH = 'BRANCH',
  MERGE = 'MERGE',
}

export enum TriggerType {
  CONTACT_CREATED = 'CONTACT_CREATED',
  CONTACT_UPDATED = 'CONTACT_UPDATED',
  EMAIL_OPENED = 'EMAIL_OPENED',
  EMAIL_CLICKED = 'EMAIL_CLICKED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  PAGE_VISITED = 'PAGE_VISITED',
  TAG_ADDED = 'TAG_ADDED',
  DATE_BASED = 'DATE_BASED',
  MANUAL = 'MANUAL',
}

export enum ActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  SEND_WHATSAPP = 'SEND_WHATSAPP',
  ADD_TAG = 'ADD_TAG',
  REMOVE_TAG = 'REMOVE_TAG',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  CREATE_TASK = 'CREATE_TASK',
  WEBHOOK = 'WEBHOOK',
  WAIT = 'WAIT',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  BETWEEN = 'BETWEEN',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
}

export class WorkflowNodePositionDto {
  @ApiProperty({ description: 'X coordinate' })
  x: number = 0;

  @ApiProperty({ description: 'Y coordinate' })
  y: number = 0;
}

export class WorkflowConditionDto {
  @ApiProperty({ description: 'Field to check' })
  field: string = '';

  @ApiProperty({ description: 'Condition operator', enum: ConditionOperator })
  operator: ConditionOperator = ConditionOperator.EQUALS;

  @ApiProperty({ description: 'Value to compare against' })
  value: string = '';

  @ApiPropertyOptional({ description: 'Second value for BETWEEN operator' })
  value2?: string;
}

export class WorkflowNodeConfigDto {
  @ApiPropertyOptional({ description: 'Node-specific configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any> = {};

  @ApiPropertyOptional({ description: 'Template ID for message actions' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Delay duration in minutes' })
  @IsOptional()
  @IsNumber()
  delayMinutes?: number;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Conditions for conditional nodes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowConditionDto)
  conditions?: WorkflowConditionDto[] = [];

  @ApiPropertyOptional({ description: 'Tags to add/remove' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @ApiPropertyOptional({ description: 'Contact field updates' })
  @IsOptional()
  @IsObject()
  contactUpdates?: Record<string, any> = {};
}

export class WorkflowNodeDto {
  @ApiProperty({ description: 'Node ID' })
  id: string = '';

  @ApiProperty({ description: 'Node type', enum: NodeType })
  type: NodeType = NodeType.ACTION;

  @ApiProperty({ description: 'Node name' })
  name: string = '';

  @ApiPropertyOptional({ description: 'Node description' })
  description?: string;

  @ApiProperty({ description: 'Node position on canvas' })
  @ValidateNested()
  @Type(() => WorkflowNodePositionDto)
  position: WorkflowNodePositionDto = new WorkflowNodePositionDto();

  @ApiProperty({ description: 'Node configuration' })
  @ValidateNested()
  @Type(() => WorkflowNodeConfigDto)
  config: WorkflowNodeConfigDto = new WorkflowNodeConfigDto();

  @ApiProperty({ description: 'Connected node IDs' })
  connections: string[] = [];

  @ApiProperty({ description: 'Node is active' })
  isActive: boolean = true;
}

export class WorkflowTriggerDto {
  @ApiProperty({ description: 'Trigger type', enum: TriggerType })
  type: TriggerType = TriggerType.MANUAL;

  @ApiProperty({ description: 'Trigger configuration' })
  @IsObject()
  config: Record<string, any> = {};

  @ApiProperty({ description: 'Trigger is active' })
  isActive: boolean = true;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @ApiPropertyOptional({ description: 'Workflow description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Workflow trigger configuration' })
  @ValidateNested()
  @Type(() => WorkflowTriggerDto)
  trigger: WorkflowTriggerDto = new WorkflowTriggerDto();

  @ApiProperty({ description: 'Workflow nodes', type: [WorkflowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[] = [];

  @ApiPropertyOptional({ description: 'Workflow tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @ApiPropertyOptional({ description: 'Workflow is active', default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = false;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({ description: 'Workflow name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Workflow description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow trigger configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowTriggerDto)
  trigger?: WorkflowTriggerDto;

  @ApiPropertyOptional({ description: 'Workflow nodes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes?: WorkflowNodeDto[];

  @ApiPropertyOptional({ description: 'Workflow tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Workflow is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WorkflowStatsDto {
  @ApiProperty({ description: 'Total executions' })
  totalExecutions: number = 0;

  @ApiProperty({ description: 'Successful executions' })
  successfulExecutions: number = 0;

  @ApiProperty({ description: 'Failed executions' })
  failedExecutions: number = 0;

  @ApiProperty({ description: 'Average execution time (ms)' })
  avgExecutionTime: number = 0;

  @ApiProperty({ description: 'Last execution date' })
  lastExecution: string = new Date().toISOString();

  @ApiProperty({ description: 'Completion rate percentage' })
  completionRate: number = 0;
}

export class WorkflowDto {
  @ApiProperty({ description: 'Workflow ID' })
  id: string = '';

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string = '';

  @ApiProperty({ description: 'Workflow name' })
  name: string = '';

  @ApiPropertyOptional({ description: 'Workflow description' })
  description?: string;

  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus })
  status: WorkflowStatus = WorkflowStatus.DRAFT;

  @ApiProperty({ description: 'Workflow trigger configuration' })
  trigger: WorkflowTriggerDto = new WorkflowTriggerDto();

  @ApiProperty({ description: 'Workflow nodes', type: [WorkflowNodeDto] })
  nodes: WorkflowNodeDto[] = [];

  @ApiProperty({ description: 'Workflow tags' })
  tags: string[] = [];

  @ApiProperty({ description: 'Workflow is active' })
  isActive: boolean = false;

  @ApiProperty({ description: 'Workflow statistics' })
  stats: WorkflowStatsDto = new WorkflowStatsDto();

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string = '';

  @ApiProperty({ description: 'Created at' })
  createdAt: string = new Date().toISOString();

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string = new Date().toISOString();
}

export class GetWorkflowsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;
}

export class GetWorkflowsResponseDto {
  @ApiProperty({ description: 'List of workflows', type: [WorkflowDto] })
  workflows: WorkflowDto[] = [];

  @ApiProperty({ description: 'Total count' })
  total: number = 0;

  @ApiProperty({ description: 'Current page' })
  page: number = 1;

  @ApiProperty({ description: 'Items per page' })
  limit: number = 20;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number = 1;
}