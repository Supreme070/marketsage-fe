import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WorkflowValidatorService, ValidationResult } from './workflow-validator.service';
import { WorkflowOptimizerService, OptimizedWorkflow } from './workflow-optimizer.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowDto,
  GetWorkflowsQueryDto,
  GetWorkflowsResponseDto,
  WorkflowStatus,
  NodeType,
  TriggerType,
  ActionType,
  ConditionOperator,
} from '../dto';

@Injectable()
export class WorkflowBuilderService {
  private readonly logger = new Logger(WorkflowBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly validatorService: WorkflowValidatorService,
    private readonly optimizerService: WorkflowOptimizerService,
  ) {}

  async create(
    createDto: CreateWorkflowDto,
    organizationId: string,
    userId: string,
  ): Promise<WorkflowDto> {
    const workflow: WorkflowDto = {
      id: `workflow_${Date.now()}`,
      organizationId,
      name: createDto.name,
      description: createDto.description,
      status: WorkflowStatus.DRAFT,
      trigger: createDto.trigger,
      nodes: createDto.nodes,
      tags: createDto.tags ?? [],
      isActive: createDto.isActive ?? false,
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTime: 0,
        lastExecution: new Date().toISOString(),
        completionRate: 0,
      },
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate workflow structure
    await this.validateWorkflow(workflow);

    // Cache workflow
    await this.redis.set(
      `workflow:${workflow.id}`,
      JSON.stringify(workflow),
      3600,
    );

    return workflow;
  }

  async findAll(
    query: GetWorkflowsQueryDto,
    organizationId: string,
  ): Promise<GetWorkflowsResponseDto> {
    // Mock workflows data
    const mockWorkflows: WorkflowDto[] = [
      {
        id: 'workflow_1',
        organizationId,
        name: 'Welcome Email Sequence',
        description: 'Automated welcome series for new subscribers',
        status: WorkflowStatus.ACTIVE,
        trigger: {
          type: TriggerType.CONTACT_CREATED,
          config: {
            conditions: [{
              field: 'source',
              operator: 'EQUALS',
              value: 'website_signup',
            }],
          },
          isActive: true,
        },
        nodes: [
          {
            id: 'node_1',
            type: NodeType.TRIGGER,
            name: 'New Contact Trigger',
            position: { x: 100, y: 100 },
            config: {},
            connections: ['node_2'],
            isActive: true,
          },
          {
            id: 'node_2',
            type: NodeType.ACTION,
            name: 'Send Welcome Email',
            position: { x: 300, y: 100 },
            config: {
              config: { actionType: ActionType.SEND_EMAIL },
              templateId: 'email_template_1',
            },
            connections: ['node_3'],
            isActive: true,
          },
          {
            id: 'node_3',
            type: NodeType.DELAY,
            name: 'Wait 2 Days',
            position: { x: 500, y: 100 },
            config: {
              delayMinutes: 2880, // 48 hours
            },
            connections: ['node_4'],
            isActive: true,
          },
          {
            id: 'node_4',
            type: NodeType.ACTION,
            name: 'Send Follow-up Email',
            position: { x: 700, y: 100 },
            config: {
              config: { actionType: ActionType.SEND_EMAIL },
              templateId: 'email_template_2',
            },
            connections: [],
            isActive: true,
          },
        ],
        tags: ['onboarding', 'email'],
        isActive: true,
        stats: {
          totalExecutions: 1247,
          successfulExecutions: 1189,
          failedExecutions: 58,
          avgExecutionTime: 15000,
          lastExecution: new Date(Date.now() - 3600000).toISOString(),
          completionRate: 95.3,
        },
        createdBy: 'user_123',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'workflow_2',
        organizationId,
        name: 'Abandoned Cart Recovery',
        description: 'Re-engage customers who abandoned their shopping cart',
        status: WorkflowStatus.ACTIVE,
        trigger: {
          type: TriggerType.PAGE_VISITED,
          config: {
            pageUrl: '/checkout',
            exitWithoutPurchase: true,
            timeThreshold: 900, // 15 minutes
          },
          isActive: true,
        },
        nodes: [
          {
            id: 'node_1',
            type: NodeType.TRIGGER,
            name: 'Cart Abandonment',
            position: { x: 100, y: 200 },
            config: {},
            connections: ['node_2'],
            isActive: true,
          },
          {
            id: 'node_2',
            type: NodeType.DELAY,
            name: 'Wait 1 Hour',
            position: { x: 300, y: 200 },
            config: {
              delayMinutes: 60,
            },
            connections: ['node_3'],
            isActive: true,
          },
          {
            id: 'node_3',
            type: NodeType.CONDITION,
            name: 'Check Purchase Status',
            position: { x: 500, y: 200 },
            config: {
              conditions: [{
                field: 'last_purchase_date',
                operator: ConditionOperator.IS_EMPTY,
                value: '',
              }],
            },
            connections: ['node_4', 'node_5'],
            isActive: true,
          },
          {
            id: 'node_4',
            type: NodeType.ACTION,
            name: 'Send Recovery Email',
            position: { x: 400, y: 350 },
            config: {
              config: { actionType: ActionType.SEND_EMAIL },
              templateId: 'cart_recovery_template',
            },
            connections: [],
            isActive: true,
          },
          {
            id: 'node_5',
            type: NodeType.ACTION,
            name: 'Add Purchased Tag',
            position: { x: 600, y: 350 },
            config: {
              config: { actionType: ActionType.ADD_TAG },
              tags: ['purchased'],
            },
            connections: [],
            isActive: true,
          },
        ],
        tags: ['ecommerce', 'recovery'],
        isActive: true,
        stats: {
          totalExecutions: 892,
          successfulExecutions: 856,
          failedExecutions: 36,
          avgExecutionTime: 8500,
          lastExecution: new Date(Date.now() - 7200000).toISOString(),
          completionRate: 95.9,
        },
        createdBy: 'user_123',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    // Apply filters
    let filteredWorkflows = mockWorkflows;
    if (query.status) {
      filteredWorkflows = filteredWorkflows.filter(w => w.status === query.status);
    }
    if (query.isActive !== undefined) {
      filteredWorkflows = filteredWorkflows.filter(w => w.isActive === query.isActive);
    }
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(w => 
        w.name.toLowerCase().includes(searchTerm) ||
        (w.description && w.description.toLowerCase().includes(searchTerm))
      );
    }
    if (query.tags && query.tags.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(w => 
        query.tags!.some(tag => w.tags.includes(tag))
      );
    }

    // Pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWorkflows = filteredWorkflows.slice(startIndex, endIndex);

    return {
      workflows: paginatedWorkflows,
      total: filteredWorkflows.length,
      page,
      limit,
      totalPages: Math.ceil(filteredWorkflows.length / limit),
    };
  }

  async findOne(id: string, organizationId: string): Promise<WorkflowDto> {
    // Check cache first
    const cached = await this.redis.get(`workflow:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Mock workflow
    const workflow: WorkflowDto = {
      id,
      organizationId,
      name: 'Welcome Email Sequence',
      description: 'Automated welcome series for new subscribers',
      status: WorkflowStatus.ACTIVE,
      trigger: {
        type: TriggerType.CONTACT_CREATED,
        config: {},
        isActive: true,
      },
      nodes: [],
      tags: ['onboarding'],
      isActive: true,
      stats: {
        totalExecutions: 1247,
        successfulExecutions: 1189,
        failedExecutions: 58,
        avgExecutionTime: 15000,
        lastExecution: new Date().toISOString(),
        completionRate: 95.3,
      },
      createdBy: 'user_123',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache the result
    await this.redis.set(
      `workflow:${id}`,
      JSON.stringify(workflow),
      3600,
    );

    return workflow;
  }

  async update(
    id: string,
    updateDto: UpdateWorkflowDto,
    organizationId: string,
  ): Promise<WorkflowDto> {
    const existingWorkflow = await this.findOne(id, organizationId);
    
    const updatedWorkflow: WorkflowDto = {
      ...existingWorkflow,
      name: updateDto.name ?? existingWorkflow.name,
      description: updateDto.description ?? existingWorkflow.description,
      trigger: updateDto.trigger ?? existingWorkflow.trigger,
      nodes: updateDto.nodes ?? existingWorkflow.nodes,
      tags: updateDto.tags ?? existingWorkflow.tags,
      isActive: updateDto.isActive ?? existingWorkflow.isActive,
      updatedAt: new Date().toISOString(),
    };

    // Validate workflow structure if nodes changed
    if (updateDto.nodes) {
      await this.validateWorkflow(updatedWorkflow);
    }

    // Update cache
    await this.redis.set(
      `workflow:${id}`,
      JSON.stringify(updatedWorkflow),
      3600,
    );

    return updatedWorkflow;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    // Remove from cache
    await this.redis.del(`workflow:${id}`);
  }

  async activate(id: string, organizationId: string): Promise<WorkflowDto> {
    const workflow = await this.findOne(id, organizationId);
    
    // Validate before activation
    await this.validateWorkflow(workflow);
    
    workflow.isActive = true;
    workflow.status = WorkflowStatus.ACTIVE;
    workflow.updatedAt = new Date().toISOString();

    await this.redis.set(
      `workflow:${id}`,
      JSON.stringify(workflow),
      3600,
    );

    return workflow;
  }

  async deactivate(id: string, organizationId: string): Promise<WorkflowDto> {
    const workflow = await this.findOne(id, organizationId);
    
    workflow.isActive = false;
    workflow.status = WorkflowStatus.PAUSED;
    workflow.updatedAt = new Date().toISOString();

    await this.redis.set(
      `workflow:${id}`,
      JSON.stringify(workflow),
      3600,
    );

    return workflow;
  }

  async duplicate(
    id: string,
    name: string,
    organizationId: string,
    userId: string,
  ): Promise<WorkflowDto> {
    const originalWorkflow = await this.findOne(id, organizationId);
    
    const createDto: CreateWorkflowDto = {
      name,
      description: `Copy of ${originalWorkflow.name}`,
      trigger: originalWorkflow.trigger,
      nodes: originalWorkflow.nodes.map(node => ({
        ...node,
        id: `${node.id}_copy_${Date.now()}`, // Generate new IDs
      })),
      tags: [...originalWorkflow.tags, 'duplicate'],
      isActive: false, // Start inactive
    };

    return this.create(createDto, organizationId, userId);
  }

  private async validateWorkflow(workflow: WorkflowDto): Promise<void> {
    // Validate that workflow has at least one trigger node
    const triggerNodes = workflow.nodes.filter(node => node.type === NodeType.TRIGGER);
    if (triggerNodes.length === 0) {
      throw new Error('Workflow must have at least one trigger node');
    }

    // Validate that all node connections exist
    const nodeIds = new Set(workflow.nodes.map(node => node.id));
    for (const node of workflow.nodes) {
      for (const connection of node.connections) {
        if (!nodeIds.has(connection)) {
          throw new Error(`Invalid connection: Node ${node.id} connects to non-existent node ${connection}`);
        }
      }
    }

    // Validate that there are no circular dependencies
    this.validateNoCycles(workflow.nodes);
  }

  private validateNoCycles(nodes: any[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (this.hasCycle(node.id, nodes, visited, recursionStack)) {
          throw new Error('Workflow contains circular dependencies');
        }
      }
    }
  }

  private hasCycle(
    nodeId: string,
    nodes: any[],
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      for (const connection of node.connections) {
        if (!visited.has(connection)) {
          if (this.hasCycle(connection, nodes, visited, recursionStack)) {
            return true;
          }
        } else if (recursionStack.has(connection)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }
}