import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WorkflowValidatorService, ValidationResult, WorkflowValidationContext } from './workflow-validator.service';
import { WorkflowOptimizerService, OptimizedWorkflow, WorkflowOptimizationContext } from './workflow-optimizer.service';
import { WorkflowNode, WorkflowNodeType } from './workflow-action-handler.service';

export interface EnhancedCreateWorkflowDto {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    connectionType: 'success' | 'failure' | 'conditional';
    condition?: string;
  }>;
  tags?: string[];
  isActive?: boolean;
  autoOptimize?: boolean;
  validateOnCreate?: boolean;
}

export interface EnhancedWorkflowDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    connectionType: string;
    condition?: string;
  }>;
  tags: string[];
  isActive: boolean;
  isOptimized: boolean;
  validationResult?: ValidationResult;
  optimizationResult?: any;
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgExecutionTime: number;
    lastExecution: string;
    completionRate: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    connectionType: string;
  }>;
  tags: string[];
  variables: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: any;
  }>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

@Injectable()
export class WorkflowBuilderEnhancedService {
  private readonly logger = new Logger(WorkflowBuilderEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly validatorService: WorkflowValidatorService,
    private readonly optimizerService: WorkflowOptimizerService,
  ) {}

  async createWorkflow(
    createDto: EnhancedCreateWorkflowDto,
    organizationId: string,
    userId: string,
  ): Promise<EnhancedWorkflowDto> {
    try {
      let { nodes, connections } = createDto;
      let validationResult: ValidationResult | undefined;
      let optimizationResult: any;
      let isOptimized = false;

      // Validate workflow if requested
      if (createDto.validateOnCreate !== false) {
        const validationContext: WorkflowValidationContext = {
          nodes,
          connections,
          organizationId,
          isProduction: process.env.NODE_ENV === 'production',
        };

        validationResult = await this.validatorService.validateWorkflow(validationContext);
        
        if (!validationResult.isValid) {
          throw new BadRequestException({
            message: 'Workflow validation failed',
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          });
        }
      }

      // Auto-optimize workflow if requested
      if (createDto.autoOptimize) {
        const optimizationContext: WorkflowOptimizationContext = {
          nodes,
          connections,
          organizationId,
        };

        const optimizedWorkflow = await this.optimizerService.optimizeWorkflow(optimizationContext);
        nodes = optimizedWorkflow.nodes;
        connections = optimizedWorkflow.connections;
        optimizationResult = optimizedWorkflow.optimizationResult;
        isOptimized = true;

        this.logger.log(`Workflow optimized: ${optimizationResult.optimizations.length} optimizations applied`);
      }

      const workflow: EnhancedWorkflowDto = {
        id: `workflow_${Date.now()}`,
        organizationId,
        name: createDto.name,
        description: createDto.description,
        nodes,
        connections,
        tags: createDto.tags ?? [],
        isActive: createDto.isActive ?? false,
        isOptimized,
        validationResult,
        optimizationResult,
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
        version: 1,
      };

      // Cache the workflow
      await this.redis.set(
        `workflow:${workflow.id}`,
        JSON.stringify(workflow),
        3600 * 24 * 7, // 7 days
      );

      this.logger.log(`Created workflow ${workflow.id} with ${nodes.length} nodes`);
      return workflow;
    } catch (error) {
      this.logger.error(`Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async validateWorkflow(
    workflowId: string,
    organizationId: string,
  ): Promise<ValidationResult> {
    const workflow = await this.getWorkflow(workflowId, organizationId);
    
    const validationContext: WorkflowValidationContext = {
      nodes: workflow.nodes,
      connections: workflow.connections,
      organizationId,
      isProduction: process.env.NODE_ENV === 'production',
    };

    return this.validatorService.validateWorkflow(validationContext);
  }

  async optimizeWorkflow(
    workflowId: string,
    organizationId: string,
  ): Promise<OptimizedWorkflow> {
    const workflow = await this.getWorkflow(workflowId, organizationId);
    
    const optimizationContext: WorkflowOptimizationContext = {
      nodes: workflow.nodes,
      connections: workflow.connections,
      organizationId,
    };

    const optimizedWorkflow = await this.optimizerService.optimizeWorkflow(optimizationContext);
    
    // Update the workflow with optimizations
    const updatedWorkflow: EnhancedWorkflowDto = {
      ...workflow,
      nodes: optimizedWorkflow.nodes,
      connections: optimizedWorkflow.connections,
      isOptimized: true,
      optimizationResult: optimizedWorkflow.optimizationResult,
      updatedAt: new Date().toISOString(),
      version: workflow.version + 1,
    };

    // Cache the updated workflow
    await this.redis.set(
      `workflow:${workflow.id}`,
      JSON.stringify(updatedWorkflow),
      3600 * 24 * 7,
    );

    this.logger.log(`Optimized workflow ${workflowId}: ${optimizedWorkflow.optimizationResult.optimizations.length} optimizations applied`);
    
    return optimizedWorkflow;
  }

  async cloneWorkflow(
    workflowId: string,
    newName: string,
    organizationId: string,
    userId: string,
  ): Promise<EnhancedWorkflowDto> {
    const originalWorkflow = await this.getWorkflow(workflowId, organizationId);
    
    // Generate new IDs for all nodes
    const nodeIdMapping = new Map<string, string>();
    const clonedNodes = originalWorkflow.nodes.map(node => {
      const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMapping.set(node.id, newNodeId);
      
      return {
        ...node,
        id: newNodeId,
        name: `${node.name} (Copy)`,
      };
    });

    // Update connections with new node IDs
    const clonedConnections = originalWorkflow.connections.map(connection => ({
      ...connection,
      sourceNodeId: nodeIdMapping.get(connection.sourceNodeId) || connection.sourceNodeId,
      targetNodeId: nodeIdMapping.get(connection.targetNodeId) || connection.targetNodeId,
    }));

    const cloneDto: EnhancedCreateWorkflowDto = {
      name: newName,
      description: `Cloned from: ${originalWorkflow.name}`,
      nodes: clonedNodes,
      connections: clonedConnections,
      tags: [...originalWorkflow.tags, 'cloned'],
      isActive: false, // Cloned workflows start inactive
      validateOnCreate: true,
    };

    return this.createWorkflow(cloneDto, organizationId, userId);
  }

  async createWorkflowFromTemplate(
    templateId: string,
    name: string,
    variables: Record<string, any>,
    organizationId: string,
    userId: string,
  ): Promise<EnhancedWorkflowDto> {
    const template = await this.getWorkflowTemplate(templateId);
    
    // Process template variables
    const processedNodes = this.processTemplateVariables(template.nodes, template.variables, variables);
    
    const createDto: EnhancedCreateWorkflowDto = {
      name,
      description: `Created from template: ${template.name}`,
      nodes: processedNodes,
      connections: template.connections,
      tags: [...template.tags, 'from-template'],
      isActive: false,
      validateOnCreate: true,
      autoOptimize: true,
    };

    return this.createWorkflow(createDto, organizationId, userId);
  }

  async getWorkflowTemplates(
    category?: string,
    organizationId?: string,
  ): Promise<WorkflowTemplate[]> {
    // Mock templates - in production, this would come from database
    const templates: WorkflowTemplate[] = [
      {
        id: 'template_welcome_series',
        name: 'Welcome Email Series',
        description: 'A comprehensive welcome sequence for new subscribers',
        category: 'Onboarding',
        nodes: [
          {
            id: 'trigger_1',
            type: WorkflowNodeType.TRIGGER,
            name: 'New Contact Trigger',
            description: 'Triggers when a new contact is created',
            config: {
              triggerType: 'CONTACT_CREATED',
            },
            position: { x: 100, y: 100 },
            connections: { success: ['email_1'] },
          },
          {
            id: 'email_1',
            type: WorkflowNodeType.EMAIL,
            name: 'Welcome Email',
            description: 'Send initial welcome email',
            config: {
              templateId: '{{WELCOME_TEMPLATE_ID}}',
              subject: 'Welcome to {{COMPANY_NAME}}!',
              fromName: '{{FROM_NAME}}',
              fromEmail: '{{FROM_EMAIL}}',
            },
            position: { x: 300, y: 100 },
            connections: { success: ['wait_1'] },
          },
          {
            id: 'wait_1',
            type: WorkflowNodeType.WAIT,
            name: 'Wait 24 Hours',
            description: 'Wait before sending follow-up',
            config: {
              duration: 24,
              unit: 'hours',
            },
            position: { x: 500, y: 100 },
            connections: { success: ['email_2'] },
          },
          {
            id: 'email_2',
            type: WorkflowNodeType.EMAIL,
            name: 'Getting Started Guide',
            description: 'Send getting started information',
            config: {
              templateId: '{{GUIDE_TEMPLATE_ID}}',
              subject: 'Getting Started with {{COMPANY_NAME}}',
              fromName: '{{FROM_NAME}}',
              fromEmail: '{{FROM_EMAIL}}',
            },
            position: { x: 700, y: 100 },
            connections: { success: ['tag_1'] },
          },
          {
            id: 'tag_1',
            type: WorkflowNodeType.ADD_TAG,
            name: 'Add Welcome Complete Tag',
            description: 'Tag contact as completed welcome series',
            config: {
              tags: ['welcome-complete'],
            },
            position: { x: 900, y: 100 },
            connections: {},
          },
        ],
        connections: [
          { sourceNodeId: 'trigger_1', targetNodeId: 'email_1', connectionType: 'success' },
          { sourceNodeId: 'email_1', targetNodeId: 'wait_1', connectionType: 'success' },
          { sourceNodeId: 'wait_1', targetNodeId: 'email_2', connectionType: 'success' },
          { sourceNodeId: 'email_2', targetNodeId: 'tag_1', connectionType: 'success' },
        ],
        tags: ['email', 'onboarding', 'popular'],
        variables: [
          { name: 'WELCOME_TEMPLATE_ID', type: 'string', description: 'Welcome email template ID' },
          { name: 'GUIDE_TEMPLATE_ID', type: 'string', description: 'Getting started guide template ID' },
          { name: 'COMPANY_NAME', type: 'string', description: 'Your company name' },
          { name: 'FROM_NAME', type: 'string', description: 'From name for emails' },
          { name: 'FROM_EMAIL', type: 'string', description: 'From email address' },
        ],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template_cart_abandonment',
        name: 'Cart Abandonment Recovery',
        description: 'Recover abandoned carts with targeted messaging',
        category: 'E-commerce',
        nodes: [
          {
            id: 'trigger_1',
            type: WorkflowNodeType.TRIGGER,
            name: 'Cart Abandoned Trigger',
            description: 'Triggers when cart is abandoned',
            config: {
              triggerType: 'CART_ABANDONED',
            },
            position: { x: 100, y: 100 },
            connections: { success: ['wait_1'] },
          },
          {
            id: 'wait_1',
            type: WorkflowNodeType.WAIT,
            name: 'Wait 1 Hour',
            description: 'Wait before first recovery email',
            config: {
              duration: 1,
              unit: 'hours',
            },
            position: { x: 300, y: 100 },
            connections: { success: ['email_1'] },
          },
          {
            id: 'email_1',
            type: WorkflowNodeType.EMAIL,
            name: 'First Recovery Email',
            description: 'Gentle reminder about abandoned cart',
            config: {
              templateId: '{{RECOVERY_TEMPLATE_1}}',
              subject: 'You left something in your cart',
              fromName: '{{FROM_NAME}}',
              fromEmail: '{{FROM_EMAIL}}',
            },
            position: { x: 500, y: 100 },
            connections: { success: ['wait_2'] },
          },
          {
            id: 'wait_2',
            type: WorkflowNodeType.WAIT,
            name: 'Wait 24 Hours',
            description: 'Wait before discount offer',
            config: {
              duration: 24,
              unit: 'hours',
            },
            position: { x: 700, y: 100 },
            connections: { success: ['condition_1'] },
          },
          {
            id: 'condition_1',
            type: WorkflowNodeType.CONDITION,
            name: 'Check Cart Value',
            description: 'Check if cart value is above discount threshold',
            config: {
              conditions: [{
                field: 'cart_value',
                operator: 'GREATER_THAN',
                value: '{{DISCOUNT_THRESHOLD}}',
              }],
            },
            position: { x: 900, y: 100 },
            connections: { 
              success: ['email_2'],
              failure: ['email_3'],
            },
          },
          {
            id: 'email_2',
            type: WorkflowNodeType.EMAIL,
            name: 'Discount Offer Email',
            description: 'Send discount code for high-value carts',
            config: {
              templateId: '{{DISCOUNT_TEMPLATE}}',
              subject: 'Special discount just for you!',
              fromName: '{{FROM_NAME}}',
              fromEmail: '{{FROM_EMAIL}}',
            },
            position: { x: 1100, y: 50 },
            connections: {},
          },
          {
            id: 'email_3',
            type: WorkflowNodeType.EMAIL,
            name: 'Final Reminder Email',
            description: 'Final reminder without discount',
            config: {
              templateId: '{{FINAL_TEMPLATE}}',
              subject: 'Last chance - your cart is waiting',
              fromName: '{{FROM_NAME}}',
              fromEmail: '{{FROM_EMAIL}}',
            },
            position: { x: 1100, y: 150 },
            connections: {},
          },
        ],
        connections: [
          { sourceNodeId: 'trigger_1', targetNodeId: 'wait_1', connectionType: 'success' },
          { sourceNodeId: 'wait_1', targetNodeId: 'email_1', connectionType: 'success' },
          { sourceNodeId: 'email_1', targetNodeId: 'wait_2', connectionType: 'success' },
          { sourceNodeId: 'wait_2', targetNodeId: 'condition_1', connectionType: 'success' },
          { sourceNodeId: 'condition_1', targetNodeId: 'email_2', connectionType: 'success' },
          { sourceNodeId: 'condition_1', targetNodeId: 'email_3', connectionType: 'failure' },
        ],
        tags: ['ecommerce', 'recovery', 'email'],
        variables: [
          { name: 'RECOVERY_TEMPLATE_1', type: 'string', description: 'First recovery email template' },
          { name: 'DISCOUNT_TEMPLATE', type: 'string', description: 'Discount offer email template' },
          { name: 'FINAL_TEMPLATE', type: 'string', description: 'Final reminder email template' },
          { name: 'FROM_NAME', type: 'string', description: 'From name for emails' },
          { name: 'FROM_EMAIL', type: 'string', description: 'From email address' },
          { name: 'DISCOUNT_THRESHOLD', type: 'number', description: 'Minimum cart value for discount', defaultValue: 100 },
        ],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      },
    ];

    let filteredTemplates = templates;
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.category.toLowerCase() === category.toLowerCase()
      );
    }

    return filteredTemplates;
  }

  async analyzeWorkflowPerformance(
    workflowId: string,
    organizationId: string,
  ): Promise<{
    performance: any;
    bottlenecks: string[];
    recommendations: string[];
  }> {
    const workflow = await this.getWorkflow(workflowId, organizationId);
    
    // Mock performance analysis
    const performance = {
      avgExecutionTime: workflow.stats.avgExecutionTime,
      successRate: (workflow.stats.successfulExecutions / workflow.stats.totalExecutions) * 100,
      nodePerformance: workflow.nodes.map(node => ({
        nodeId: node.id,
        nodeName: node.name,
        avgExecutionTime: Math.random() * 5000,
        successRate: 95 + Math.random() * 5,
        errorRate: Math.random() * 2,
      })),
    };

    const bottlenecks = [
      'Wait nodes causing long execution times',
      'External API calls with high latency',
      'Complex condition evaluations',
    ];

    const recommendations = [
      'Consider reducing wait times in non-critical paths',
      'Implement caching for frequently accessed data',
      'Optimize condition logic for better performance',
      'Use batch operations where possible',
    ];

    return {
      performance,
      bottlenecks,
      recommendations,
    };
  }

  private async getWorkflow(workflowId: string, organizationId: string): Promise<EnhancedWorkflowDto> {
    const cached = await this.redis.get(`workflow:${workflowId}`);
    if (cached) {
      const workflow = JSON.parse(cached);
      if (workflow.organizationId === organizationId) {
        return workflow;
      }
    }

    // Mock workflow - in production, this would come from database
    throw new Error('Workflow not found');
  }

  private async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate> {
    const templates = await this.getWorkflowTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Workflow template not found');
    }
    
    return template;
  }

  private processTemplateVariables(
    nodes: WorkflowNode[],
    templateVariables: any[],
    providedVariables: Record<string, any>,
  ): WorkflowNode[] {
    return nodes.map(node => {
      const processedNode = { ...node };
      processedNode.config = this.replaceTemplateVariables(
        node.config,
        templateVariables,
        providedVariables,
      );
      return processedNode;
    });
  }

  private replaceTemplateVariables(
    config: any,
    templateVariables: any[],
    providedVariables: Record<string, any>,
  ): any {
    if (typeof config === 'string') {
      let result = config;
      for (const variable of templateVariables) {
        const placeholder = `{{${variable.name}}}`;
        const value = providedVariables[variable.name] || variable.defaultValue || '';
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
      }
      return result;
    } else if (Array.isArray(config)) {
      return config.map(item => this.replaceTemplateVariables(item, templateVariables, providedVariables));
    } else if (config && typeof config === 'object') {
      const result: any = {};
      Object.entries(config).forEach(([key, value]) => {
        result[key] = this.replaceTemplateVariables(value, templateVariables, providedVariables);
      });
      return result;
    }
    return config;
  }
}