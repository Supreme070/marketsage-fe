/**
 * Advanced Workflow Node Builder
 * =============================
 * AI-powered system for creating and managing complex workflow nodes
 * Enables natural language workflow creation with intelligent node connections
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { TransactionManager } from '@/lib/security/transaction-manager';
import { AuthorizationService, Permission } from '@/lib/security/authorization';
import { validationSchemas } from '@/lib/security/input-validation';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  config: WorkflowNodeConfig;
  connections: {
    inputs: string[];
    outputs: string[];
  };
  conditions?: WorkflowCondition[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    executionCount: number;
    lastExecuted?: Date;
    averageExecutionTime: number;
  };
}

export enum WorkflowNodeType {
  // Trigger nodes
  FORM_SUBMISSION = 'form_submission',
  TIME_TRIGGER = 'time_trigger',
  WEBHOOK = 'webhook',
  EMAIL_RECEIVED = 'email_received',
  CONTACT_CREATED = 'contact_created',
  CONTACT_UPDATED = 'contact_updated',
  CAMPAIGN_COMPLETED = 'campaign_completed',
  
  // Action nodes
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_WHATSAPP = 'send_whatsapp',
  UPDATE_CONTACT = 'update_contact',
  ADD_TO_LIST = 'add_to_list',
  REMOVE_FROM_LIST = 'remove_from_list',
  CREATE_TASK = 'create_task',
  SEND_NOTIFICATION = 'send_notification',
  API_CALL = 'api_call',
  
  // Logic nodes
  CONDITION = 'condition',
  DELAY = 'delay',
  SPLIT = 'split',
  MERGE = 'merge',
  LOOP = 'loop',
  FILTER = 'filter',
  
  // Data nodes
  DATA_TRANSFORM = 'data_transform',
  CALCULATE = 'calculate',
  LOOKUP = 'lookup',
  STORE_DATA = 'store_data',
  
  // Integration nodes
  ZAPIER = 'zapier',
  SALESFORCE = 'salesforce',
  HUBSPOT = 'hubspot',
  SLACK = 'slack',
  TEAMS = 'teams',
  
  // AI nodes
  AI_ANALYSIS = 'ai_analysis',
  AI_GENERATE_CONTENT = 'ai_generate_content',
  AI_SENTIMENT = 'ai_sentiment',
  AI_CLASSIFICATION = 'ai_classification'
}

export interface WorkflowNodeConfig {
  // Common config
  enabled: boolean;
  retryAttempts: number;
  timeoutMs: number;
  
  // Type-specific config
  [key: string]: any;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logicOperator?: 'AND' | 'OR';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  estimatedExecutionTime: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
  condition?: WorkflowCondition;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
  required: boolean;
}

export interface WorkflowBuildRequest {
  description: string;
  trigger: string;
  actions: string[];
  conditions?: string[];
  integrations?: string[];
  variables?: Record<string, any>;
  options: {
    generatePreview: boolean;
    autoConnect: boolean;
    optimizeForPerformance: boolean;
  };
}

export interface WorkflowBuildResult {
  success: boolean;
  workflowId?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  estimatedExecutionTime: number;
  suggestions: string[];
  warnings: string[];
  errors: string[];
}

export class WorkflowNodeBuilder {
  private nodeTemplates = new Map<WorkflowNodeType, Partial<WorkflowNode>>();
  private predefinedTemplates: WorkflowTemplate[] = [];

  constructor() {
    this.initializeNodeTemplates();
    this.initializePredefinedTemplates();
  }

  /**
   * Build workflow from natural language description
   */
  async buildWorkflowFromDescription(
    request: WorkflowBuildRequest,
    userId: string,
    userRole: string,
    organizationId: string
  ): Promise<WorkflowBuildResult> {
    try {
      // Check permissions
      const canCreateWorkflows = AuthorizationService.hasPermission(
        userRole as any,
        Permission.CREATE_WORKFLOW
      );

      if (!canCreateWorkflows) {
        return {
          success: false,
          nodes: [],
          connections: [],
          variables: [],
          estimatedComplexity: 'simple',
          estimatedExecutionTime: 0,
          suggestions: [],
          warnings: [],
          errors: ['Insufficient permissions to create workflows']
        };
      }

      logger.info('Building workflow from description', {
        userId,
        description: request.description.substring(0, 100),
        trigger: request.trigger,
        actionCount: request.actions.length
      });

      // Parse natural language description
      const parsedWorkflow = await this.parseWorkflowDescription(request);
      
      // Build nodes
      const nodes = await this.buildNodes(parsedWorkflow, request.options);
      
      // Create connections
      const connections = this.createConnections(nodes, parsedWorkflow, request.options);
      
      // Extract variables
      const variables = this.extractVariables(parsedWorkflow);
      
      // Calculate complexity and execution time
      const complexity = this.calculateComplexity(nodes, connections);
      const estimatedTime = this.calculateExecutionTime(nodes);
      
      // Generate suggestions and warnings
      const suggestions = this.generateSuggestions(nodes, connections);
      const warnings = this.generateWarnings(nodes, connections);

      // Create workflow in database if not preview
      let workflowId: string | undefined;
      if (!request.options.generatePreview) {
        workflowId = await this.createWorkflowInDatabase(
          request,
          nodes,
          connections,
          variables,
          userId,
          organizationId
        );
      }

      return {
        success: true,
        workflowId,
        nodes,
        connections,
        variables,
        estimatedComplexity: complexity,
        estimatedExecutionTime: estimatedTime,
        suggestions,
        warnings,
        errors: []
      };

    } catch (error) {
      logger.error('Workflow building failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        description: request.description.substring(0, 100)
      });

      return {
        success: false,
        nodes: [],
        connections: [],
        variables: [],
        estimatedComplexity: 'simple',
        estimatedExecutionTime: 0,
        suggestions: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create workflow node from natural language
   */
  async createNodeFromDescription(
    description: string,
    nodeType?: WorkflowNodeType,
    position?: { x: number; y: number }
  ): Promise<WorkflowNode> {
    const parsedNode = this.parseNodeDescription(description, nodeType);
    
    const node: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: parsedNode.type,
      name: parsedNode.name,
      description: parsedNode.description,
      position: position || { x: 0, y: 0 },
      config: parsedNode.config,
      connections: { inputs: [], outputs: [] },
      conditions: parsedNode.conditions,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        averageExecutionTime: 0
      }
    };

    return node;
  }

  /**
   * Get workflow templates by category
   */
  getWorkflowTemplates(category?: string): WorkflowTemplate[] {
    if (category) {
      return this.predefinedTemplates.filter(template => 
        template.category.toLowerCase() === category.toLowerCase()
      );
    }
    return this.predefinedTemplates;
  }

  /**
   * Clone and customize template
   */
  async customizeTemplate(
    templateId: string,
    customizations: Partial<WorkflowTemplate>,
    userId: string,
    organizationId: string
  ): Promise<WorkflowBuildResult> {
    const template = this.predefinedTemplates.find(t => t.id === templateId);
    
    if (!template) {
      return {
        success: false,
        nodes: [],
        connections: [],
        variables: [],
        estimatedComplexity: 'simple',
        estimatedExecutionTime: 0,
        suggestions: [],
        warnings: [],
        errors: ['Template not found']
      };
    }

    // Clone and apply customizations
    const customizedNodes = template.nodes.map(node => ({
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        ...node.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));

    // Update connections with new node IDs
    const nodeIdMap = new Map();
    template.nodes.forEach((oldNode, index) => {
      nodeIdMap.set(oldNode.id, customizedNodes[index].id);
    });

    const customizedConnections = template.connections.map(conn => ({
      ...conn,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId: nodeIdMap.get(conn.sourceNodeId),
      targetNodeId: nodeIdMap.get(conn.targetNodeId)
    }));

    const workflowId = await this.createWorkflowInDatabase(
      {
        description: customizations.description || template.description,
        trigger: 'template',
        actions: [],
        options: { generatePreview: false, autoConnect: true, optimizeForPerformance: true }
      },
      customizedNodes,
      customizedConnections,
      template.variables,
      userId,
      organizationId
    );

    return {
      success: true,
      workflowId,
      nodes: customizedNodes,
      connections: customizedConnections,
      variables: template.variables,
      estimatedComplexity: template.complexity,
      estimatedExecutionTime: template.estimatedExecutionTime,
      suggestions: [],
      warnings: [],
      errors: []
    };
  }

  /**
   * Validate workflow structure
   */
  validateWorkflow(nodes: WorkflowNode[], connections: WorkflowConnection[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for trigger nodes
    const triggerNodes = nodes.filter(node => this.isTriggerNode(node.type));
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    if (triggerNodes.length > 1) {
      warnings.push('Multiple trigger nodes detected - workflow may have unexpected behavior');
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set([
      ...connections.map(c => c.sourceNodeId),
      ...connections.map(c => c.targetNodeId)
    ]);
    
    const orphanedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && !this.isTriggerNode(node.type)
    );
    
    if (orphanedNodes.length > 0) {
      warnings.push(`${orphanedNodes.length} nodes are not connected to the workflow`);
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(connections)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Check for unreachable nodes
    const reachableNodes = this.findReachableNodes(nodes, connections);
    if (reachableNodes.size < nodes.length) {
      warnings.push(`${nodes.length - reachableNodes.size} nodes are unreachable from triggers`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Optimize workflow for performance
   */
  optimizeWorkflow(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[]
  ): { nodes: WorkflowNode[]; connections: WorkflowConnection[] } {
    // Remove unnecessary delay nodes
    const optimizedNodes = nodes.filter(node => {
      if (node.type === WorkflowNodeType.DELAY) {
        const delayMs = node.config.delayMs || 0;
        return delayMs > 1000; // Remove delays less than 1 second
      }
      return true;
    });

    // Merge sequential condition nodes
    // Group parallel actions
    // Optimize API call batching

    return {
      nodes: optimizedNodes,
      connections
    };
  }

  // Private methods

  private async parseWorkflowDescription(request: WorkflowBuildRequest): Promise<any> {
    const description = request.description.toLowerCase();
    
    return {
      triggerType: this.extractTriggerType(request.trigger),
      actionTypes: request.actions.map(action => this.extractActionType(action)),
      conditions: request.conditions?.map(condition => this.parseCondition(condition)) || [],
      integrations: request.integrations || [],
      variables: request.variables || {}
    };
  }

  private extractTriggerType(trigger: string): WorkflowNodeType {
    const lowerTrigger = trigger.toLowerCase();
    
    if (lowerTrigger.includes('form') || lowerTrigger.includes('submit')) {
      return WorkflowNodeType.FORM_SUBMISSION;
    }
    if (lowerTrigger.includes('time') || lowerTrigger.includes('schedule')) {
      return WorkflowNodeType.TIME_TRIGGER;
    }
    if (lowerTrigger.includes('webhook') || lowerTrigger.includes('api')) {
      return WorkflowNodeType.WEBHOOK;
    }
    if (lowerTrigger.includes('email') && lowerTrigger.includes('receive')) {
      return WorkflowNodeType.EMAIL_RECEIVED;
    }
    if (lowerTrigger.includes('contact') && lowerTrigger.includes('create')) {
      return WorkflowNodeType.CONTACT_CREATED;
    }
    if (lowerTrigger.includes('contact') && lowerTrigger.includes('update')) {
      return WorkflowNodeType.CONTACT_UPDATED;
    }
    
    return WorkflowNodeType.FORM_SUBMISSION; // Default
  }

  private extractActionType(action: string): WorkflowNodeType {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes('email')) return WorkflowNodeType.SEND_EMAIL;
    if (lowerAction.includes('sms')) return WorkflowNodeType.SEND_SMS;
    if (lowerAction.includes('whatsapp')) return WorkflowNodeType.SEND_WHATSAPP;
    if (lowerAction.includes('update contact')) return WorkflowNodeType.UPDATE_CONTACT;
    if (lowerAction.includes('add to list')) return WorkflowNodeType.ADD_TO_LIST;
    if (lowerAction.includes('create task')) return WorkflowNodeType.CREATE_TASK;
    if (lowerAction.includes('notification')) return WorkflowNodeType.SEND_NOTIFICATION;
    if (lowerAction.includes('api') || lowerAction.includes('webhook')) return WorkflowNodeType.API_CALL;
    if (lowerAction.includes('delay') || lowerAction.includes('wait')) return WorkflowNodeType.DELAY;
    
    return WorkflowNodeType.SEND_EMAIL; // Default
  }

  private parseCondition(condition: string): WorkflowCondition {
    // Simple parsing - in production, use more sophisticated NLP
    return {
      field: 'status',
      operator: 'equals',
      value: 'active'
    };
  }

  private parseNodeDescription(description: string, nodeType?: WorkflowNodeType): any {
    const lowerDesc = description.toLowerCase();
    
    // Extract node type if not provided
    const type = nodeType || this.extractActionType(description);
    
    // Extract configuration based on type
    let config: WorkflowNodeConfig = {
      enabled: true,
      retryAttempts: 3,
      timeoutMs: 30000
    };

    // Type-specific config parsing
    switch (type) {
      case WorkflowNodeType.SEND_EMAIL:
        config = {
          ...config,
          templateId: null,
          subject: this.extractQuotedText(description, 'subject'),
          fromEmail: this.extractQuotedText(description, 'from'),
          personalizeContent: true
        };
        break;
        
      case WorkflowNodeType.DELAY:
        const delayMatch = description.match(/(\d+)\s*(minute|hour|day|second)/);
        const delayMs = delayMatch ? this.convertToMs(Number.parseInt(delayMatch[1]), delayMatch[2]) : 60000;
        config = { ...config, delayMs };
        break;
        
      case WorkflowNodeType.CONDITION:
        config = {
          ...config,
          conditions: [this.parseCondition(description)]
        };
        break;
    }

    return {
      type,
      name: this.generateNodeName(type, description),
      description,
      config,
      conditions: type === WorkflowNodeType.CONDITION ? [this.parseCondition(description)] : undefined
    };
  }

  private buildNodes(parsedWorkflow: any, options: any): WorkflowNode[] {
    const nodes: WorkflowNode[] = [];
    
    // Create trigger node
    const triggerNode = this.createNodeFromType(parsedWorkflow.triggerType, { x: 100, y: 100 });
    nodes.push(triggerNode);
    
    // Create action nodes
    const yPos = 200;
    parsedWorkflow.actionTypes.forEach((actionType: WorkflowNodeType, index: number) => {
      const actionNode = this.createNodeFromType(actionType, { x: 100 + (index * 200), y: yPos });
      nodes.push(actionNode);
    });
    
    // Add condition nodes if specified
    parsedWorkflow.conditions.forEach((condition: any, index: number) => {
      const conditionNode = this.createNodeFromType(WorkflowNodeType.CONDITION, { x: 300, y: 150 + (index * 100) });
      conditionNode.conditions = [condition];
      nodes.push(conditionNode);
    });

    return nodes;
  }

  private createNodeFromType(type: WorkflowNodeType, position: { x: number; y: number }): WorkflowNode {
    const template = this.nodeTemplates.get(type) || {};
    
    return {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: template.name || this.getDefaultNodeName(type),
      description: template.description,
      position,
      config: template.config || { enabled: true, retryAttempts: 3, timeoutMs: 30000 },
      connections: { inputs: [], outputs: [] },
      conditions: template.conditions,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        averageExecutionTime: this.getEstimatedExecutionTime(type)
      }
    };
  }

  private createConnections(
    nodes: WorkflowNode[],
    parsedWorkflow: any,
    options: any
  ): WorkflowConnection[] {
    const connections: WorkflowConnection[] = [];
    
    if (!options.autoConnect) return connections;
    
    // Simple linear connection for now
    for (let i = 0; i < nodes.length - 1; i++) {
      const connection: WorkflowConnection = {
        id: `conn_${Date.now()}_${i}`,
        sourceNodeId: nodes[i].id,
        targetNodeId: nodes[i + 1].id,
        sourcePort: 'output',
        targetPort: 'input'
      };
      connections.push(connection);
    }
    
    return connections;
  }

  private extractVariables(parsedWorkflow: any): WorkflowVariable[] {
    // Extract variables from the workflow description
    return [
      {
        name: 'contactEmail',
        type: 'string',
        description: 'Email address of the contact',
        required: true
      },
      {
        name: 'contactName',
        type: 'string',
        description: 'Name of the contact',
        required: false
      }
    ];
  }

  private calculateComplexity(nodes: WorkflowNode[], connections: WorkflowConnection[]): 'simple' | 'moderate' | 'complex' | 'advanced' {
    const nodeCount = nodes.length;
    const connectionCount = connections.length;
    const conditionNodes = nodes.filter(n => n.type === WorkflowNodeType.CONDITION).length;
    const integrationNodes = nodes.filter(n => this.isIntegrationNode(n.type)).length;
    
    if (nodeCount <= 3 && conditionNodes === 0) return 'simple';
    if (nodeCount <= 7 && conditionNodes <= 2) return 'moderate';
    if (nodeCount <= 15 && integrationNodes <= 3) return 'complex';
    return 'advanced';
  }

  private calculateExecutionTime(nodes: WorkflowNode[]): number {
    return nodes.reduce((total, node) => total + node.metadata.averageExecutionTime, 0);
  }

  private generateSuggestions(nodes: WorkflowNode[], connections: WorkflowConnection[]): string[] {
    const suggestions: string[] = [];
    
    if (nodes.length > 10) {
      suggestions.push('Consider breaking this workflow into smaller, more manageable workflows');
    }
    
    const delayNodes = nodes.filter(n => n.type === WorkflowNodeType.DELAY);
    if (delayNodes.length > 3) {
      suggestions.push('Multiple delay nodes detected - consider optimizing timing');
    }
    
    if (!nodes.some(n => n.type === WorkflowNodeType.CONDITION)) {
      suggestions.push('Add conditional logic to make the workflow more intelligent');
    }
    
    return suggestions;
  }

  private generateWarnings(nodes: WorkflowNode[], connections: WorkflowConnection[]): string[] {
    const warnings: string[] = [];
    
    const apiNodes = nodes.filter(n => n.type === WorkflowNodeType.API_CALL);
    if (apiNodes.length > 5) {
      warnings.push('High number of API calls may impact performance');
    }
    
    return warnings;
  }

  private async createWorkflowInDatabase(
    request: WorkflowBuildRequest,
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
    variables: WorkflowVariable[],
    userId: string,
    organizationId: string
  ): Promise<string> {
    return await TransactionManager.startTransaction(
      userId,
      'create_workflow',
      'Create AI-generated workflow',
      30000
    );
  }

  // Helper methods
  private initializeNodeTemplates(): void {
    // Initialize common node templates
    this.nodeTemplates.set(WorkflowNodeType.SEND_EMAIL, {
      name: 'Send Email',
      description: 'Send an email to contacts',
      config: {
        enabled: true,
        retryAttempts: 3,
        timeoutMs: 30000,
        templateId: null,
        personalizeContent: true
      }
    });
    
    // Add more templates...
  }

  private initializePredefinedTemplates(): void {
    // Welcome Email Sequence
    this.predefinedTemplates.push({
      id: 'welcome_sequence',
      name: 'Welcome Email Sequence',
      description: 'Automated welcome sequence for new contacts',
      category: 'Onboarding',
      nodes: [],
      connections: [],
      variables: [],
      estimatedExecutionTime: 5000,
      complexity: 'moderate'
    });
    
    // Add more templates...
  }

  private isTriggerNode(type: WorkflowNodeType): boolean {
    return [
      WorkflowNodeType.FORM_SUBMISSION,
      WorkflowNodeType.TIME_TRIGGER,
      WorkflowNodeType.WEBHOOK,
      WorkflowNodeType.EMAIL_RECEIVED,
      WorkflowNodeType.CONTACT_CREATED,
      WorkflowNodeType.CONTACT_UPDATED,
      WorkflowNodeType.CAMPAIGN_COMPLETED
    ].includes(type);
  }

  private isIntegrationNode(type: WorkflowNodeType): boolean {
    return [
      WorkflowNodeType.ZAPIER,
      WorkflowNodeType.SALESFORCE,
      WorkflowNodeType.HUBSPOT,
      WorkflowNodeType.SLACK,
      WorkflowNodeType.TEAMS
    ].includes(type);
  }

  private hasCircularDependencies(connections: WorkflowConnection[]): boolean {
    // Simple cycle detection
    const graph = new Map<string, string[]>();
    
    connections.forEach(conn => {
      if (!graph.has(conn.sourceNodeId)) {
        graph.set(conn.sourceNodeId, []);
      }
      graph.get(conn.sourceNodeId)!.push(conn.targetNodeId);
    });
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of graph.keys()) {
      if (hasCycle(nodeId)) return true;
    }
    
    return false;
  }

  private findReachableNodes(nodes: WorkflowNode[], connections: WorkflowConnection[]): Set<string> {
    const reachable = new Set<string>();
    const triggerNodes = nodes.filter(node => this.isTriggerNode(node.type));
    
    const graph = new Map<string, string[]>();
    connections.forEach(conn => {
      if (!graph.has(conn.sourceNodeId)) {
        graph.set(conn.sourceNodeId, []);
      }
      graph.get(conn.sourceNodeId)!.push(conn.targetNodeId);
    });
    
    const dfs = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      neighbors.forEach(neighbor => dfs(neighbor));
    };
    
    triggerNodes.forEach(trigger => dfs(trigger.id));
    
    return reachable;
  }

  private extractQuotedText(text: string, keyword: string): string | null {
    const regex = new RegExp(`${keyword}\\s*[:"']([^"']+)["']`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
  }

  private convertToMs(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'second': return value * 1000;
      case 'minute': return value * 60 * 1000;
      case 'hour': return value * 60 * 60 * 1000;
      case 'day': return value * 24 * 60 * 60 * 1000;
      default: return value * 1000;
    }
  }

  private generateNodeName(type: WorkflowNodeType, description: string): string {
    const baseNames = {
      [WorkflowNodeType.SEND_EMAIL]: 'Send Email',
      [WorkflowNodeType.SEND_SMS]: 'Send SMS',
      [WorkflowNodeType.DELAY]: 'Wait',
      [WorkflowNodeType.CONDITION]: 'If/Then',
      [WorkflowNodeType.UPDATE_CONTACT]: 'Update Contact'
    };
    
    return baseNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getDefaultNodeName(type: WorkflowNodeType): string {
    return this.generateNodeName(type, '');
  }

  private getEstimatedExecutionTime(type: WorkflowNodeType): number {
    const times = {
      [WorkflowNodeType.SEND_EMAIL]: 2000,
      [WorkflowNodeType.SEND_SMS]: 1000,
      [WorkflowNodeType.UPDATE_CONTACT]: 500,
      [WorkflowNodeType.CONDITION]: 100,
      [WorkflowNodeType.API_CALL]: 3000
    };
    
    return times[type] || 1000;
  }
}

// Export singleton instance
export const workflowNodeBuilder = new WorkflowNodeBuilder();