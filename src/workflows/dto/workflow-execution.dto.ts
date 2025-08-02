import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested, IsObject, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export enum ExecutionStepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export class ExecuteWorkflowDto {
  @ApiProperty({ description: 'Contact ID to execute workflow for' })
  @IsString()
  @IsNotEmpty()
  contactId: string = '';

  @ApiPropertyOptional({ description: 'Trigger data/context' })
  @IsOptional()
  @IsObject()
  triggerData?: Record<string, any> = {};

  @ApiPropertyOptional({ description: 'Execute immediately or schedule' })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = true;

  @ApiPropertyOptional({ description: 'Schedule execution time' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

export class WorkflowExecutionStepDto {
  @ApiProperty({ description: 'Step ID' })
  id: string = '';

  @ApiProperty({ description: 'Node ID this step represents' })
  nodeId: string = '';

  @ApiProperty({ description: 'Node name' })
  nodeName: string = '';

  @ApiProperty({ description: 'Step execution status', enum: ExecutionStepStatus })
  status: ExecutionStepStatus = ExecutionStepStatus.PENDING;

  @ApiPropertyOptional({ description: 'Step input data' })
  input?: Record<string, any> = {};

  @ApiPropertyOptional({ description: 'Step output data' })
  output?: Record<string, any> = {};

  @ApiPropertyOptional({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Error details' })
  errorDetails?: Record<string, any> = {};

  @ApiProperty({ description: 'Step started at' })
  startedAt: string = new Date().toISOString();

  @ApiPropertyOptional({ description: 'Step completed at' })
  completedAt?: string;

  @ApiProperty({ description: 'Execution time in milliseconds' })
  executionTime: number = 0;

  @ApiProperty({ description: 'Retry count' })
  retryCount: number = 0;
}

export class WorkflowExecutionDto {
  @ApiProperty({ description: 'Execution ID' })
  id: string = '';

  @ApiProperty({ description: 'Workflow ID' })
  workflowId: string = '';

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string = '';

  @ApiProperty({ description: 'Contact ID' })
  contactId: string = '';

  @ApiProperty({ description: 'Execution status', enum: ExecutionStatus })
  status: ExecutionStatus = ExecutionStatus.PENDING;

  @ApiPropertyOptional({ description: 'Trigger data that started execution' })
  triggerData?: Record<string, any> = {};

  @ApiProperty({ description: 'Execution steps', type: [WorkflowExecutionStepDto] })
  steps: WorkflowExecutionStepDto[] = [];

  @ApiProperty({ description: 'Current step index' })
  currentStep: number = 0;

  @ApiPropertyOptional({ description: 'Global error message' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Global error details' })
  errorDetails?: Record<string, any> = {};

  @ApiProperty({ description: 'Execution started at' })
  startedAt: string = new Date().toISOString();

  @ApiPropertyOptional({ description: 'Execution completed at' })
  completedAt?: string;

  @ApiProperty({ description: 'Total execution time in milliseconds' })
  totalExecutionTime: number = 0;

  @ApiProperty({ description: 'Created at' })
  createdAt: string = new Date().toISOString();

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string = new Date().toISOString();
}

export class GetWorkflowExecutionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by workflow ID' })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ExecutionStatus })
  @IsOptional()
  @IsEnum(ExecutionStatus)
  status?: ExecutionStatus;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;
}

export class GetWorkflowExecutionsResponseDto {
  @ApiProperty({ description: 'List of workflow executions', type: [WorkflowExecutionDto] })
  executions: WorkflowExecutionDto[] = [];

  @ApiProperty({ description: 'Total count' })
  total: number = 0;

  @ApiProperty({ description: 'Current page' })
  page: number = 1;

  @ApiProperty({ description: 'Items per page' })
  limit: number = 20;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number = 1;
}

export class ExecuteWorkflowResponseDto {
  @ApiProperty({ description: 'Execution ID' })
  executionId: string = '';

  @ApiProperty({ description: 'Execution status', enum: ExecutionStatus })
  status: ExecutionStatus = ExecutionStatus.PENDING;

  @ApiProperty({ description: 'Workflow was queued successfully' })
  success: boolean = true;

  @ApiPropertyOptional({ description: 'Message' })
  message?: string;
}

export class CancelExecutionDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RetryExecutionDto {
  @ApiPropertyOptional({ description: 'Retry from specific step index' })
  @IsOptional()
  @IsNumber()
  fromStep?: number;

  @ApiPropertyOptional({ description: 'Override execution data' })
  @IsOptional()
  @IsObject()
  overrideData?: Record<string, any> = {};
}

export class WorkflowExecutionMetricsDto {
  @ApiProperty({ description: 'Total executions' })
  totalExecutions: number = 0;

  @ApiProperty({ description: 'Successful executions' })
  successfulExecutions: number = 0;

  @ApiProperty({ description: 'Failed executions' })
  failedExecutions: number = 0;

  @ApiProperty({ description: 'Cancelled executions' })
  cancelledExecutions: number = 0;

  @ApiProperty({ description: 'Average execution time (ms)' })
  avgExecutionTime: number = 0;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number = 0;

  @ApiProperty({ description: 'Most common failure step' })
  commonFailureStep: string = '';

  @ApiProperty({ description: 'Most common failure reason' })
  commonFailureReason: string = '';
}