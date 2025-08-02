import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNodeType, WorkflowNode } from './workflow-action-handler.service';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId: string;
  type: 'CONFIGURATION' | 'CONNECTION' | 'DEPENDENCY' | 'SECURITY';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ValidationWarning {
  nodeId: string;
  type: 'PERFORMANCE' | 'BEST_PRACTICE' | 'COMPATIBILITY';
  message: string;
}

export interface WorkflowConnection {
  sourceNodeId: string;
  targetNodeId: string;
  connectionType: 'success' | 'failure' | 'conditional';
  condition?: string;
}

export interface WorkflowValidationContext {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  organizationId: string;
  isProduction: boolean;
}

@Injectable()
export class WorkflowValidatorService {
  private readonly logger = new Logger(WorkflowValidatorService.name);

  async validateWorkflow(context: WorkflowValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Structural validation
      errors.push(...this.validateWorkflowStructure(context));
      
      // Node configuration validation
      for (const node of context.nodes) {
        errors.push(...this.validateNodeConfiguration(node, context));
        warnings.push(...this.validateNodeBestPractices(node, context));
      }

      // Connection validation
      errors.push(...this.validateConnections(context));
      
      // Circular dependency detection
      errors.push(...this.detectCircularDependencies(context));
      
      // Performance validation
      warnings.push(...this.validatePerformance(context));
      
      // Security validation
      errors.push(...this.validateSecurity(context));

      return {
        isValid: errors.filter(e => e.severity === 'HIGH').length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error(`Workflow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors: [{
          nodeId: 'system',
          type: 'CONFIGURATION',
          message: 'Validation system error',
          severity: 'HIGH',
        }],
        warnings: [],
      };
    }
  }

  private validateWorkflowStructure(context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];

    // Must have at least one trigger node
    const triggerNodes = context.nodes.filter(n => n.type === WorkflowNodeType.TRIGGER);
    if (triggerNodes.length === 0) {
      errors.push({
        nodeId: 'workflow',
        type: 'CONFIGURATION',
        message: 'Workflow must have at least one trigger node',
        severity: 'HIGH',
      });
    }

    // Must have at least one action node
    const actionNodes = context.nodes.filter(n => n.type !== WorkflowNodeType.TRIGGER);
    if (actionNodes.length === 0) {
      errors.push({
        nodeId: 'workflow',
        type: 'CONFIGURATION',
        message: 'Workflow must have at least one action node',
        severity: 'HIGH',
      });
    }

    // Check for orphaned nodes (no connections)
    for (const node of context.nodes) {
      const hasIncoming = context.connections.some(c => c.targetNodeId === node.id);
      const hasOutgoing = context.connections.some(c => c.sourceNodeId === node.id);
      
      if (!hasIncoming && node.type !== WorkflowNodeType.TRIGGER) {
        errors.push({
          nodeId: node.id,
          type: 'CONNECTION',
          message: `Node "${node.name}" is not connected to any trigger or previous node`,
          severity: 'MEDIUM',
        });
      }

      if (!hasOutgoing && this.shouldHaveOutgoingConnections(node.type)) {
        errors.push({
          nodeId: node.id,
          type: 'CONNECTION',
          message: `Node "${node.name}" should have outgoing connections`,
          severity: 'MEDIUM',
        });
      }
    }

    return errors;
  }

  private validateNodeConfiguration(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (node.type) {
      case WorkflowNodeType.EMAIL:
        errors.push(...this.validateEmailNode(node, context));
        break;
      case WorkflowNodeType.SMS:
        errors.push(...this.validateSmsNode(node, context));
        break;
      case WorkflowNodeType.WHATSAPP:
        errors.push(...this.validateWhatsAppNode(node, context));
        break;
      case WorkflowNodeType.WEBHOOK:
        errors.push(...this.validateWebhookNode(node, context));
        break;
      case WorkflowNodeType.CONDITION:
        errors.push(...this.validateConditionNode(node, context));
        break;
      case WorkflowNodeType.WAIT:
        errors.push(...this.validateWaitNode(node, context));
        break;
      case WorkflowNodeType.API_CALL:
        errors.push(...this.validateApiCallNode(node, context));
        break;
      case WorkflowNodeType.SPLIT_TEST:
        errors.push(...this.validateSplitTestNode(node, context));
        break;
    }

    return errors;
  }

  private validateEmailNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { templateId, subject, fromEmail } = node.config;

    if (!templateId && !subject) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Email node must have either a template ID or subject',
        severity: 'HIGH',
      });
    }

    if (fromEmail && !this.isValidEmail(fromEmail)) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Invalid from email address format',
        severity: 'HIGH',
      });
    }

    return errors;
  }

  private validateSmsNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { message, providerId } = node.config;

    if (!message || message.trim().length === 0) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'SMS node must have a message',
        severity: 'HIGH',
      });
    }

    if (!providerId) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'SMS node must have a provider ID',
        severity: 'HIGH',
      });
    }

    if (message && message.length > 1600) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'SMS message exceeds maximum length (1600 characters)',
        severity: 'MEDIUM',
      });
    }

    return errors;
  }

  private validateWhatsAppNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { templateName, providerId } = node.config;

    if (!templateName) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'WhatsApp node must have a template name',
        severity: 'HIGH',
      });
    }

    if (!providerId) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'WhatsApp node must have a provider ID',
        severity: 'HIGH',
      });
    }

    return errors;
  }

  private validateWebhookNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { url, method } = node.config;

    if (!url) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Webhook node must have a URL',
        severity: 'HIGH',
      });
    }

    if (url && !this.isValidUrl(url)) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Invalid webhook URL format',
        severity: 'HIGH',
      });
    }

    if (url && context.isProduction && !url.startsWith('https://')) {
      errors.push({
        nodeId: node.id,
        type: 'SECURITY',
        message: 'Production webhooks must use HTTPS',
        severity: 'HIGH',
      });
    }

    if (method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Invalid HTTP method for webhook',
        severity: 'MEDIUM',
      });
    }

    return errors;
  }

  private validateConditionNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { conditions } = node.config;

    if (!conditions || conditions.length === 0) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Condition node must have at least one condition',
        severity: 'HIGH',
      });
    }

    if (conditions) {
      for (const [index, condition] of conditions.entries()) {
        if (!condition.field) {
          errors.push({
            nodeId: node.id,
            type: 'CONFIGURATION',
            message: `Condition ${index + 1} must have a field`,
            severity: 'HIGH',
          });
        }

        if (!condition.operator) {
          errors.push({
            nodeId: node.id,
            type: 'CONFIGURATION',
            message: `Condition ${index + 1} must have an operator`,
            severity: 'HIGH',
          });
        }

        if (condition.value === undefined || condition.value === null) {
          errors.push({
            nodeId: node.id,
            type: 'CONFIGURATION',
            message: `Condition ${index + 1} must have a value`,
            severity: 'HIGH',
          });
        }
      }
    }

    // Validate that condition node has both success and failure connections
    const hasSuccessConnection = node.connections.success && node.connections.success.length > 0;
    const hasFailureConnection = node.connections.failure && node.connections.failure.length > 0;

    if (!hasSuccessConnection || !hasFailureConnection) {
      errors.push({
        nodeId: node.id,
        type: 'CONNECTION',
        message: 'Condition node must have both success and failure connections',
        severity: 'HIGH',
      });
    }

    return errors;
  }

  private validateWaitNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { duration, unit } = node.config;

    if (!duration || duration <= 0) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Wait node must have a positive duration',
        severity: 'HIGH',
      });
    }

    if (!unit || !['minutes', 'hours', 'days'].includes(unit)) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Wait node must have a valid time unit (minutes, hours, days)',
        severity: 'HIGH',
      });
    }

    // Performance warning for long delays
    if (duration && unit) {
      const totalMinutes = this.convertToMinutes(duration, unit);
      if (totalMinutes > 43200) { // 30 days
        errors.push({
          nodeId: node.id,
          type: 'CONFIGURATION',
          message: 'Wait duration exceeds recommended maximum of 30 days',
          severity: 'MEDIUM',
        });
      }
    }

    return errors;
  }

  private validateApiCallNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { url, method } = node.config;

    if (!url) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'API call node must have a URL',
        severity: 'HIGH',
      });
    }

    if (url && !this.isValidUrl(url)) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Invalid API call URL format',
        severity: 'HIGH',
      });
    }

    if (url && context.isProduction && !url.startsWith('https://')) {
      errors.push({
        nodeId: node.id,
        type: 'SECURITY',
        message: 'Production API calls must use HTTPS',
        severity: 'HIGH',
      });
    }

    if (method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Invalid HTTP method for API call',
        severity: 'MEDIUM',
      });
    }

    return errors;
  }

  private validateSplitTestNode(node: WorkflowNode, context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const { variants, distribution } = node.config;

    if (!variants || Object.keys(variants).length < 2) {
      errors.push({
        nodeId: node.id,
        type: 'CONFIGURATION',
        message: 'Split test node must have at least 2 variants',
        severity: 'HIGH',
      });
    }

    if (distribution === 'weighted' && variants) {
      const totalWeight = Object.values(variants).reduce((sum: number, config: any) => {
        return sum + (config.weight || 0);
      }, 0);

      if (totalWeight <= 0) {
        errors.push({
          nodeId: node.id,
          type: 'CONFIGURATION',
          message: 'Split test with weighted distribution must have positive total weight',
          severity: 'HIGH',
        });
      }
    }

    // Validate that each variant has a connection
    if (variants && node.connections.conditions) {
      for (const variantKey of Object.keys(variants)) {
        if (!node.connections.conditions[variantKey]) {
          errors.push({
            nodeId: node.id,
            type: 'CONNECTION',
            message: `Split test variant "${variantKey}" must have a connection`,
            severity: 'HIGH',
          });
        }
      }
    }

    return errors;
  }

  private validateConnections(context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeIds = new Set(context.nodes.map(n => n.id));

    for (const connection of context.connections) {
      // Validate source node exists
      if (!nodeIds.has(connection.sourceNodeId)) {
        errors.push({
          nodeId: connection.sourceNodeId,
          type: 'CONNECTION',
          message: `Connection references non-existent source node: ${connection.sourceNodeId}`,
          severity: 'HIGH',
        });
      }

      // Validate target node exists
      if (!nodeIds.has(connection.targetNodeId)) {
        errors.push({
          nodeId: connection.targetNodeId,
          type: 'CONNECTION',
          message: `Connection references non-existent target node: ${connection.targetNodeId}`,
          severity: 'HIGH',
        });
      }

      // Validate connection type
      if (!['success', 'failure', 'conditional'].includes(connection.connectionType)) {
        errors.push({
          nodeId: connection.sourceNodeId,
          type: 'CONNECTION',
          message: `Invalid connection type: ${connection.connectionType}`,
          severity: 'MEDIUM',
        });
      }
    }

    return errors;
  }

  private detectCircularDependencies(context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Get all outgoing connections
      const outgoingConnections = context.connections.filter(c => c.sourceNodeId === nodeId);
      
      for (const connection of outgoingConnections) {
        if (hasCycle(connection.targetNodeId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of context.nodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        errors.push({
          nodeId: node.id,
          type: 'DEPENDENCY',
          message: 'Circular dependency detected in workflow',
          severity: 'HIGH',
        });
        break; // Only report one circular dependency
      }
    }

    return errors;
  }

  private validatePerformance(context: WorkflowValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for too many nodes
    if (context.nodes.length > 50) {
      warnings.push({
        nodeId: 'workflow',
        type: 'PERFORMANCE',
        message: 'Workflow has many nodes which may impact performance',
      });
    }

    // Check for multiple wait nodes in sequence
    const waitNodes = context.nodes.filter(n => n.type === WorkflowNodeType.WAIT);
    if (waitNodes.length > 5) {
      warnings.push({
        nodeId: 'workflow',
        type: 'PERFORMANCE',
        message: 'Multiple wait nodes may cause long execution times',
      });
    }

    // Check for excessive external calls
    const externalCallNodes = context.nodes.filter(n => 
      n.type === WorkflowNodeType.WEBHOOK || n.type === WorkflowNodeType.API_CALL
    );
    if (externalCallNodes.length > 10) {
      warnings.push({
        nodeId: 'workflow',
        type: 'PERFORMANCE',
        message: 'Many external API calls may impact reliability',
      });
    }

    return warnings;
  }

  private validateSecurity(context: WorkflowValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for hardcoded credentials in configurations
    for (const node of context.nodes) {
      const configStr = JSON.stringify(node.config).toLowerCase();
      
      if (configStr.includes('password') || configStr.includes('secret') || 
          configStr.includes('token') || configStr.includes('key')) {
        errors.push({
          nodeId: node.id,
          type: 'SECURITY',
          message: 'Node configuration may contain hardcoded credentials',
          severity: 'HIGH',
        });
      }
    }

    return errors;
  }

  private validateNodeBestPractices(node: WorkflowNode, context: WorkflowValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for descriptive node names
    if (!node.name || node.name.trim().length < 3) {
      warnings.push({
        nodeId: node.id,
        type: 'BEST_PRACTICE',
        message: 'Node should have a descriptive name',
      });
    }

    // Check for node descriptions
    if (!node.description || node.description.trim().length === 0) {
      warnings.push({
        nodeId: node.id,
        type: 'BEST_PRACTICE',
        message: 'Node should have a description for documentation',
      });
    }

    return warnings;
  }

  // Helper methods
  private shouldHaveOutgoingConnections(nodeType: WorkflowNodeType): boolean {
    return nodeType !== WorkflowNodeType.UPDATE_CONTACT && 
           nodeType !== WorkflowNodeType.ADD_TAG && 
           nodeType !== WorkflowNodeType.REMOVE_TAG;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private convertToMinutes(duration: number, unit: string): number {
    switch (unit) {
      case 'minutes':
        return duration;
      case 'hours':
        return duration * 60;
      case 'days':
        return duration * 24 * 60;
      default:
        return 0;
    }
  }
}