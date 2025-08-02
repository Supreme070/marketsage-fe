import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import {
  ExecuteWorkflowDto,
  WorkflowExecutionDto,
  GetWorkflowExecutionsQueryDto,
  GetWorkflowExecutionsResponseDto,
  ExecuteWorkflowResponseDto,
  CancelExecutionDto,
  RetryExecutionDto,
  WorkflowExecutionMetricsDto,
} from '../dto';

@ApiTags('Workflow Execution')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowExecutionController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow execution started',
    type: ExecuteWorkflowResponseDto,
  })
  async execute(
    @Param('id') workflowId: string,
    @Body() executeDto: ExecuteWorkflowDto,
    @Request() req: any,
  ): Promise<ExecuteWorkflowResponseDto> {
    return this.workflowExecutionService.execute(
      workflowId,
      executeDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get('executions')
  @ApiOperation({ summary: 'Get workflow executions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workflow executions',
    type: GetWorkflowExecutionsResponseDto,
  })
  async findAllExecutions(
    @Query() query: GetWorkflowExecutionsQueryDto,
    @Request() req: any,
  ): Promise<GetWorkflowExecutionsResponseDto> {
    return this.workflowExecutionService.findAll(
      query,
      req.user.organizationId,
    );
  }

  @Get('executions/:id')
  @ApiOperation({ summary: 'Get workflow execution by ID' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution details',
    type: WorkflowExecutionDto,
  })
  async findOneExecution(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkflowExecutionDto> {
    return this.workflowExecutionService.findOne(
      id,
      req.user.organizationId,
    );
  }

  @Post('executions/:id/cancel')
  @ApiOperation({ summary: 'Cancel workflow execution' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution cancelled successfully',
    type: WorkflowExecutionDto,
  })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelExecutionDto,
    @Request() req: any,
  ): Promise<WorkflowExecutionDto> {
    return this.workflowExecutionService.cancel(
      id,
      cancelDto,
      req.user.organizationId,
    );
  }

  @Post('executions/:id/retry')
  @ApiOperation({ summary: 'Retry failed workflow execution' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution retry started',
    type: ExecuteWorkflowResponseDto,
  })
  async retry(
    @Param('id') id: string,
    @Body() retryDto: RetryExecutionDto,
    @Request() req: any,
  ): Promise<ExecuteWorkflowResponseDto> {
    return this.workflowExecutionService.retry(
      id,
      retryDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get workflow execution metrics' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow execution metrics',
    type: WorkflowExecutionMetricsDto,
  })
  async getMetrics(
    @Param('id') workflowId: string,
    @Request() req: any,
  ): Promise<WorkflowExecutionMetricsDto> {
    return this.workflowExecutionService.getMetrics(
      workflowId,
      req.user.organizationId,
    );
  }
}