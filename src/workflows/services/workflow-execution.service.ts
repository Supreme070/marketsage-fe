import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import {
  ExecuteWorkflowDto,
  WorkflowExecutionDto,
  GetWorkflowExecutionsQueryDto,
  GetWorkflowExecutionsResponseDto,
  ExecuteWorkflowResponseDto,
  CancelExecutionDto,
  RetryExecutionDto,
  WorkflowExecutionMetricsDto,
  ExecutionStatus,
  ExecutionStepStatus,
  WorkflowExecutionStepDto,
} from '../dto';
import { WorkflowBuilderService } from './workflow-builder.service';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly workflowBuilderService: WorkflowBuilderService,
  ) {}

  async execute(
    workflowId: string,
    executeDto: ExecuteWorkflowDto,
    organizationId: string,
    userId: string,
  ): Promise<ExecuteWorkflowResponseDto> {
    const workflow = await this.workflowBuilderService.findOne(workflowId, organizationId);
    
    if (!workflow.isActive) {
      throw new Error('Cannot execute inactive workflow');
    }

    const executionId = `execution_${Date.now()}`;
    
    // Create execution record
    const execution: WorkflowExecutionDto = {
      id: executionId,
      workflowId,
      organizationId,
      contactId: executeDto.contactId,
      status: ExecutionStatus.PENDING,
      triggerData: executeDto.triggerData,
      steps: workflow.nodes.map((node, index) => ({
        id: `step_${executionId}_${index}`,
        nodeId: node.id,
        nodeName: node.name,
        status: ExecutionStepStatus.PENDING,
        input: {},
        output: {},
        startedAt: new Date().toISOString(),
        executionTime: 0,
        retryCount: 0,
      })),
      currentStep: 0,
      startedAt: new Date().toISOString(),
      totalExecutionTime: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache execution
    await this.redis.set(
      `workflow_execution:${executionId}`,
      JSON.stringify(execution),
      3600 * 24, // 24 hours
    );

    // Queue for execution
    if (executeDto.immediate) {
      await this.queueService.addEmailTask({
        type: 'WORKFLOW_EXECUTION',
        userId,
        metadata: {
          executionId,
          workflowId,
          contactId: executeDto.contactId,
          organizationId,
        },
      });
    } else if (executeDto.scheduledFor) {
      await this.queueService.addEmailTask({
        type: 'WORKFLOW_EXECUTION_SCHEDULED',
        userId,
        metadata: {
          executionId,
          workflowId,
          contactId: executeDto.contactId,
          organizationId,
          scheduledFor: executeDto.scheduledFor,
        },
      });
    }

    return {
      executionId,
      status: ExecutionStatus.PENDING,
      success: true,
      message: executeDto.immediate 
        ? 'Workflow execution started'
        : `Workflow scheduled for ${executeDto.scheduledFor}`,
    };
  }

  async findAll(
    query: GetWorkflowExecutionsQueryDto,
    organizationId: string,
  ): Promise<GetWorkflowExecutionsResponseDto> {
    // Mock executions data
    const mockExecutions: WorkflowExecutionDto[] = [
      {
        id: 'execution_1',
        workflowId: 'workflow_1',
        organizationId,
        contactId: 'contact_1',
        status: ExecutionStatus.COMPLETED,
        triggerData: {
          source: 'website_signup',
          email: 'user@example.com',
        },
        steps: [
          {
            id: 'step_1',
            nodeId: 'node_1',
            nodeName: 'New Contact Trigger',
            status: ExecutionStepStatus.COMPLETED,
            input: {},
            output: { triggered: true },
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: new Date(Date.now() - 3599500).toISOString(),
            executionTime: 500,
            retryCount: 0,
          },
          {
            id: 'step_2',
            nodeId: 'node_2',
            nodeName: 'Send Welcome Email',
            status: ExecutionStepStatus.COMPLETED,
            input: { templateId: 'email_template_1' },
            output: { emailSent: true, messageId: 'msg_123' },
            startedAt: new Date(Date.now() - 3599000).toISOString(),
            completedAt: new Date(Date.now() - 3597000).toISOString(),
            executionTime: 2000,
            retryCount: 0,
          },
        ],
        currentStep: 2,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3597000).toISOString(),
        totalExecutionTime: 3000,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3597000).toISOString(),
      },
      {
        id: 'execution_2',
        workflowId: 'workflow_2',
        organizationId,
        contactId: 'contact_2',
        status: ExecutionStatus.FAILED,
        triggerData: {
          cartValue: 149.99,
          abandondedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        steps: [
          {
            id: 'step_1',
            nodeId: 'node_1',
            nodeName: 'Cart Abandonment',
            status: ExecutionStepStatus.COMPLETED,
            input: {},
            output: { triggered: true },
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: new Date(Date.now() - 3599800).toISOString(),
            executionTime: 200,
            retryCount: 0,
          },
          {
            id: 'step_2',
            nodeId: 'node_2',
            nodeName: 'Wait 1 Hour',
            status: ExecutionStepStatus.COMPLETED,
            input: { delayMinutes: 60 },
            output: { waitCompleted: true },
            startedAt: new Date(Date.now() - 3599500).toISOString(),
            completedAt: new Date(Date.now() - 1800000).toISOString(),
            executionTime: 3600000,
            retryCount: 0,
          },
          {
            id: 'step_3',
            nodeId: 'node_3',
            nodeName: 'Send Recovery Email',
            status: ExecutionStepStatus.FAILED,
            input: { templateId: 'cart_recovery_template' },
            errorMessage: 'Email template not found',
            errorDetails: { templateId: 'cart_recovery_template', error: 'TEMPLATE_NOT_FOUND' },
            startedAt: new Date(Date.now() - 1800000).toISOString(),
            executionTime: 1000,
            retryCount: 2,
          },
        ],
        currentStep: 2,
        errorMessage: 'Email template not found',
        errorDetails: { step: 'step_3' },
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        totalExecutionTime: 3601200,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ];

    // Apply filters
    let filteredExecutions = mockExecutions;
    if (query.workflowId) {
      filteredExecutions = filteredExecutions.filter(e => e.workflowId === query.workflowId);
    }
    if (query.contactId) {
      filteredExecutions = filteredExecutions.filter(e => e.contactId === query.contactId);
    }
    if (query.status) {
      filteredExecutions = filteredExecutions.filter(e => e.status === query.status);
    }

    // Pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExecutions = filteredExecutions.slice(startIndex, endIndex);

    return {
      executions: paginatedExecutions,
      total: filteredExecutions.length,
      page,
      limit,
      totalPages: Math.ceil(filteredExecutions.length / limit),
    };
  }

  async findOne(id: string, organizationId: string): Promise<WorkflowExecutionDto> {
    // Check cache first
    const cached = await this.redis.get(`workflow_execution:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Mock execution
    const execution: WorkflowExecutionDto = {
      id,
      workflowId: 'workflow_1',
      organizationId,
      contactId: 'contact_1',
      status: ExecutionStatus.COMPLETED,
      triggerData: {},
      steps: [],
      currentStep: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalExecutionTime: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache the result
    await this.redis.set(
      `workflow_execution:${id}`,
      JSON.stringify(execution),
      3600 * 24,
    );

    return execution;
  }

  async cancel(
    id: string,
    cancelDto: CancelExecutionDto,
    organizationId: string,
  ): Promise<WorkflowExecutionDto> {
    const execution = await this.findOne(id, organizationId);
    
    if (execution.status === ExecutionStatus.COMPLETED || execution.status === ExecutionStatus.FAILED) {
      throw new Error('Cannot cancel completed or failed execution');
    }

    execution.status = ExecutionStatus.CANCELLED;
    execution.errorMessage = cancelDto.reason || 'Execution cancelled by user';
    execution.completedAt = new Date().toISOString();
    execution.updatedAt = new Date().toISOString();

    await this.redis.set(
      `workflow_execution:${id}`,
      JSON.stringify(execution),
      3600 * 24,
    );

    return execution;
  }

  async retry(
    id: string,
    retryDto: RetryExecutionDto,
    organizationId: string,
    userId: string,
  ): Promise<ExecuteWorkflowResponseDto> {
    const execution = await this.findOne(id, organizationId);
    
    if (execution.status !== ExecutionStatus.FAILED) {
      throw new Error('Can only retry failed executions');
    }

    // Reset execution status
    execution.status = ExecutionStatus.PENDING;
    execution.currentStep = retryDto.fromStep ?? 0;
    execution.errorMessage = undefined;
    execution.errorDetails = undefined;
    execution.completedAt = undefined;
    execution.updatedAt = new Date().toISOString();

    // Reset steps from retry point
    for (let i = execution.currentStep; i < execution.steps.length; i++) {
      execution.steps[i].status = ExecutionStepStatus.PENDING;
      execution.steps[i].errorMessage = undefined;
      execution.steps[i].errorDetails = undefined;
      execution.steps[i].completedAt = undefined;
      execution.steps[i].retryCount = 0;
    }

    // Apply override data if provided
    if (retryDto.overrideData) {
      execution.triggerData = { ...execution.triggerData, ...retryDto.overrideData };
    }

    await this.redis.set(
      `workflow_execution:${id}`,
      JSON.stringify(execution),
      3600 * 24,
    );

    // Queue for re-execution
    await this.queueService.addEmailTask({
      type: 'WORKFLOW_EXECUTION_RETRY',
      userId,
      metadata: {
        executionId: id,
        workflowId: execution.workflowId,
        contactId: execution.contactId,
        organizationId,
        fromStep: execution.currentStep,
      },
    });

    return {
      executionId: id,
      status: ExecutionStatus.PENDING,
      success: true,
      message: 'Workflow execution retry queued',
    };
  }

  async getMetrics(
    workflowId: string,
    organizationId: string,
  ): Promise<WorkflowExecutionMetricsDto> {
    // Mock metrics calculation
    const totalExecutions = 1247;
    const successfulExecutions = 1189;
    const failedExecutions = 58;
    const cancelledExecutions = 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      cancelledExecutions,
      avgExecutionTime: 15000,
      successRate: (successfulExecutions / totalExecutions) * 100,
      commonFailureStep: 'Send Email',
      commonFailureReason: 'Template not found',
    };
  }

  async updateExecutionStep(
    executionId: string,
    stepId: string,
    stepData: Partial<WorkflowExecutionStepDto>,
    organizationId: string,
  ): Promise<void> {
    const execution = await this.findOne(executionId, organizationId);
    
    const stepIndex = execution.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      throw new Error('Step not found');
    }

    // Update step
    Object.assign(execution.steps[stepIndex], stepData);
    execution.updatedAt = new Date().toISOString();

    // Update execution status based on step status
    if (stepData.status === ExecutionStepStatus.FAILED) {
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = stepData.errorMessage;
      execution.errorDetails = stepData.errorDetails;
      execution.completedAt = new Date().toISOString();
    } else if (stepData.status === ExecutionStepStatus.COMPLETED) {
      // Check if this was the last step
      if (stepIndex === execution.steps.length - 1) {
        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date().toISOString();
      } else {
        execution.currentStep = stepIndex + 1;
      }
    }

    await this.redis.set(
      `workflow_execution:${executionId}`,
      JSON.stringify(execution),
      3600 * 24,
    );
  }
}