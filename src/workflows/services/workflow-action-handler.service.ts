import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export enum WorkflowNodeType {
  TRIGGER = 'TRIGGER',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  WAIT = 'WAIT',
  CONDITION = 'CONDITION',
  WEBHOOK = 'WEBHOOK',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  ADD_TAG = 'ADD_TAG',
  REMOVE_TAG = 'REMOVE_TAG',
  API_CALL = 'API_CALL',
  SPLIT_TEST = 'SPLIT_TEST',
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: {
    success?: string[];
    failure?: string[];
    conditions?: Record<string, string[]>;
  };
}

export interface ActionExecutionContext {
  workflowId: string;
  executionId: string;
  contactId: string;
  organizationId: string;
  triggerData: Record<string, any>;
  previousStepOutput?: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  output: Record<string, any>;
  errorMessage?: string;
  nextNodes?: string[];
  delayUntil?: string;
}

@Injectable()
export class WorkflowActionHandlerService {
  private readonly logger = new Logger(WorkflowActionHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly httpService: HttpService,
  ) {}

  async executeAction(
    node: WorkflowNode,
    context: ActionExecutionContext,
  ): Promise<ActionResult> {
    try {
      this.logger.log(`Executing ${node.type} action for workflow ${context.workflowId}`);

      switch (node.type) {
        case WorkflowNodeType.EMAIL:
          return this.executeEmailAction(node, context);
        case WorkflowNodeType.SMS:
          return this.executeSmsAction(node, context);
        case WorkflowNodeType.WHATSAPP:
          return this.executeWhatsAppAction(node, context);
        case WorkflowNodeType.WAIT:
          return this.executeWaitAction(node, context);
        case WorkflowNodeType.CONDITION:
          return this.executeConditionAction(node, context);
        case WorkflowNodeType.WEBHOOK:
          return this.executeWebhookAction(node, context);
        case WorkflowNodeType.UPDATE_CONTACT:
          return this.executeUpdateContactAction(node, context);
        case WorkflowNodeType.ADD_TAG:
          return this.executeAddTagAction(node, context);
        case WorkflowNodeType.REMOVE_TAG:
          return this.executeRemoveTagAction(node, context);
        case WorkflowNodeType.API_CALL:
          return this.executeApiCallAction(node, context);
        case WorkflowNodeType.SPLIT_TEST:
          return this.executeSplitTestAction(node, context);
        default:
          return {
            success: false,
            output: {},
            errorMessage: `Unsupported node type: ${node.type}`,
          };
      }
    } catch (error) {
      this.logger.error(`Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        output: {},
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeEmailAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { templateId, subject, customContent, fromName, fromEmail } = node.config;

    // Get contact details
    const contact = await this.getContactDetails(context.contactId, context.organizationId);
    if (!contact) {
      return {
        success: false,
        output: {},
        errorMessage: 'Contact not found',
      };
    }

    // Queue email task
    await this.queueService.addEmailTask({
      type: 'WORKFLOW_EMAIL',
      userId: 'system',
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId,
        contactId: context.contactId,
        organizationId: context.organizationId,
        templateId,
        subject,
        customContent,
        fromName,
        fromEmail,
        recipientEmail: contact.email,
        recipientName: contact.name,
        variables: this.buildVariables(contact, context.triggerData),
      },
    });

    return {
      success: true,
      output: {
        emailQueued: true,
        templateId,
        recipientEmail: contact.email,
        timestamp: new Date().toISOString(),
      },
      nextNodes: node.connections.success,
    };
  }

  private async executeSmsAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { message, providerId, fromNumber } = node.config;

    // Get contact details
    const contact = await this.getContactDetails(context.contactId, context.organizationId);
    if (!contact?.phone) {
      return {
        success: false,
        output: {},
        errorMessage: 'Contact phone number not found',
      };
    }

    // Queue SMS task
    await this.queueService.addEmailTask({
      type: 'WORKFLOW_SMS',
      userId: 'system',
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId,
        contactId: context.contactId,
        organizationId: context.organizationId,
        providerId,
        fromNumber,
        toNumber: contact.phone,
        message: this.replaceVariables(message, contact, context.triggerData),
      },
    });

    return {
      success: true,
      output: {
        smsQueued: true,
        providerId,
        recipientPhone: contact.phone,
        timestamp: new Date().toISOString(),
      },
      nextNodes: node.connections.success,
    };
  }

  private async executeWhatsAppAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { templateName, providerId, parameters } = node.config;

    // Get contact details
    const contact = await this.getContactDetails(context.contactId, context.organizationId);
    if (!contact?.phone) {
      return {
        success: false,
        output: {},
        errorMessage: 'Contact phone number not found',
      };
    }

    // Queue WhatsApp task
    await this.queueService.addEmailTask({
      type: 'WORKFLOW_WHATSAPP',
      userId: 'system',
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId,
        contactId: context.contactId,
        organizationId: context.organizationId,
        providerId,
        templateName,
        recipientPhone: contact.phone,
        parameters: this.buildWhatsAppParameters(parameters, contact, context.triggerData),
      },
    });

    return {
      success: true,
      output: {
        whatsappQueued: true,
        templateName,
        providerId,
        recipientPhone: contact.phone,
        timestamp: new Date().toISOString(),
      },
      nextNodes: node.connections.success,
    };
  }

  private async executeWaitAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { duration, unit } = node.config; // duration: number, unit: 'minutes' | 'hours' | 'days'

    let delayMs = 0;
    switch (unit) {
      case 'minutes':
        delayMs = duration * 60 * 1000;
        break;
      case 'hours':
        delayMs = duration * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = duration * 24 * 60 * 60 * 1000;
        break;
      default:
        delayMs = duration * 60 * 1000; // Default to minutes
    }

    const delayUntil = new Date(Date.now() + delayMs).toISOString();

    return {
      success: true,
      output: {
        waitDuration: duration,
        waitUnit: unit,
        delayUntil,
      },
      nextNodes: node.connections.success,
      delayUntil,
    };
  }

  private async executeConditionAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { conditions, logicalOperator = 'AND' } = node.config;

    // Get contact details for condition evaluation
    const contact = await this.getContactDetails(context.contactId, context.organizationId);
    if (!contact) {
      return {
        success: false,
        output: {},
        errorMessage: 'Contact not found for condition evaluation',
      };
    }

    // Combine contact data with trigger data for evaluation
    const evaluationData = {
      ...contact,
      ...context.triggerData,
      ...context.previousStepOutput,
    };

    let result = logicalOperator === 'AND';
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, evaluationData);
      
      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    const nextNodes = result ? node.connections.success : node.connections.failure;

    return {
      success: true,
      output: {
        conditionResult: result,
        evaluatedConditions: conditions.length,
        logicalOperator,
      },
      nextNodes,
    };
  }

  private async executeWebhookAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { url, method = 'POST', headers = {}, payload } = node.config;

    try {
      // Get contact details for webhook payload
      const contact = await this.getContactDetails(context.contactId, context.organizationId);
      
      const webhookPayload = {
        ...payload,
        contact,
        workflow: {
          id: context.workflowId,
          executionId: context.executionId,
        },
        triggerData: context.triggerData,
        timestamp: new Date().toISOString(),
        organizationId: context.organizationId,
      };

      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toUpperCase(),
          url,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          data: webhookPayload,
          timeout: 30000, // 30 seconds timeout
        })
      );

      return {
        success: true,
        output: {
          webhookCalled: true,
          url,
          method,
          responseStatus: response.status,
          responseData: response.data,
          timestamp: new Date().toISOString(),
        },
        nextNodes: node.connections.success,
      };
    } catch (error) {
      this.logger.error('Webhook execution failed:', error);
      return {
        success: false,
        output: {
          webhookCalled: false,
          url,
          method,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        errorMessage: `Webhook failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  private async executeUpdateContactAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { updates } = node.config;

    try {
      // Process variable replacements in updates
      const contact = await this.getContactDetails(context.contactId, context.organizationId);
      const processedUpdates = this.processVariableReplacements(updates, contact, context.triggerData);

      // Cache the update (in a real implementation, this would update the database)
      await this.redis.set(
        `contact_update:${context.contactId}:${Date.now()}`,
        JSON.stringify({
          contactId: context.contactId,
          updates: processedUpdates,
          workflowId: context.workflowId,
          executionId: context.executionId,
          timestamp: new Date().toISOString(),
        }),
        3600 * 24, // 24 hours
      );

      return {
        success: true,
        output: {
          contactUpdated: true,
          updates: processedUpdates,
          timestamp: new Date().toISOString(),
        },
        nextNodes: node.connections.success,
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        errorMessage: `Contact update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  private async executeAddTagAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { tags } = node.config;

    try {
      // Cache the tag addition (in a real implementation, this would update the database)
      await this.redis.set(
        `contact_tags_add:${context.contactId}:${Date.now()}`,
        JSON.stringify({
          contactId: context.contactId,
          tagsToAdd: tags,
          workflowId: context.workflowId,
          executionId: context.executionId,
          timestamp: new Date().toISOString(),
        }),
        3600 * 24, // 24 hours
      );

      return {
        success: true,
        output: {
          tagsAdded: tags,
          timestamp: new Date().toISOString(),
        },
        nextNodes: node.connections.success,
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        errorMessage: `Add tag failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  private async executeRemoveTagAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { tags } = node.config;

    try {
      // Cache the tag removal (in a real implementation, this would update the database)
      await this.redis.set(
        `contact_tags_remove:${context.contactId}:${Date.now()}`,
        JSON.stringify({
          contactId: context.contactId,
          tagsToRemove: tags,
          workflowId: context.workflowId,
          executionId: context.executionId,
          timestamp: new Date().toISOString(),
        }),
        3600 * 24, // 24 hours
      );

      return {
        success: true,
        output: {
          tagsRemoved: tags,
          timestamp: new Date().toISOString(),
        },
        nextNodes: node.connections.success,
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        errorMessage: `Remove tag failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  private async executeApiCallAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { url, method = 'GET', headers = {}, body, responseMapping } = node.config;

    try {
      // Get contact details for API call
      const contact = await this.getContactDetails(context.contactId, context.organizationId);
      
      // Process variables in URL, headers, and body
      const processedUrl = this.replaceVariables(url, contact, context.triggerData);
      const processedHeaders = this.processVariableReplacements(headers, contact, context.triggerData);
      const processedBody = body ? this.processVariableReplacements(body, contact, context.triggerData) : undefined;

      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toUpperCase(),
          url: processedUrl,
          headers: {
            'Content-Type': 'application/json',
            ...processedHeaders,
          },
          data: processedBody,
          timeout: 30000, // 30 seconds timeout
        })
      );

      // Map response data if mapping is provided
      let mappedResponse = response.data;
      if (responseMapping) {
        mappedResponse = this.mapResponseData(response.data, responseMapping);
      }

      return {
        success: true,
        output: {
          apiCallSuccess: true,
          url: processedUrl,
          method,
          responseStatus: response.status,
          responseData: mappedResponse,
          timestamp: new Date().toISOString(),
        },
        nextNodes: node.connections.success,
      };
    } catch (error) {
      this.logger.error('API call execution failed:', error);
      return {
        success: false,
        output: {
          apiCallSuccess: false,
          url,
          method,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        errorMessage: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  private async executeSplitTestAction(node: WorkflowNode, context: ActionExecutionContext): Promise<ActionResult> {
    const { variants, distribution = 'equal' } = node.config;

    try {
      let selectedVariant: string;

      if (distribution === 'equal') {
        // Equal distribution among variants
        const variantKeys = Object.keys(variants);
        const randomIndex = Math.floor(Math.random() * variantKeys.length);
        selectedVariant = variantKeys[randomIndex];
      } else {
        // Weighted distribution
        const weights = Object.entries(variants).map(([key, config]: [string, any]) => ({
          key,
          weight: config.weight || 1,
        }));
        
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        selectedVariant = weights[0].key; // fallback
        
        for (const weight of weights) {
          currentWeight += weight.weight;
          if (random <= currentWeight) {
            selectedVariant = weight.key;
            break;
          }
        }
      }

      // Cache the split test result for analytics
      await this.redis.set(
        `split_test:${context.workflowId}:${node.id}:${context.contactId}`,
        JSON.stringify({
          workflowId: context.workflowId,
          nodeId: node.id,
          contactId: context.contactId,
          selectedVariant,
          timestamp: new Date().toISOString(),
        }),
        3600 * 24 * 30, // 30 days
      );

      const nextNodes = node.connections.conditions?.[selectedVariant] || node.connections.success;

      return {
        success: true,
        output: {
          splitTestVariant: selectedVariant,
          availableVariants: Object.keys(variants),
          distribution,
          timestamp: new Date().toISOString(),
        },
        nextNodes,
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        errorMessage: `Split test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextNodes: node.connections.failure,
      };
    }
  }

  // Helper methods
  private async getContactDetails(contactId: string, organizationId: string): Promise<any> {
    // Mock contact data - in a real implementation, this would query the database
    return {
      id: contactId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      organizationId,
      tags: ['customer', 'vip'],
      customFields: {
        company: 'Acme Corp',
        position: 'Manager',
      },
    };
  }

  private buildVariables(contact: any, triggerData: Record<string, any>): Record<string, string> {
    return {
      contact_name: contact.name || '',
      contact_email: contact.email || '',
      contact_phone: contact.phone || '',
      ...contact.customFields,
      ...triggerData,
    };
  }

  private replaceVariables(text: string, contact: any, triggerData: Record<string, any>): string {
    const variables = this.buildVariables(contact, triggerData);
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return result;
  }

  private processVariableReplacements(obj: any, contact: any, triggerData: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, contact, triggerData);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.processVariableReplacements(item, contact, triggerData));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        result[key] = this.processVariableReplacements(value, contact, triggerData);
      });
      return result;
    }
    return obj;
  }

  private buildWhatsAppParameters(parameters: any[], contact: any, triggerData: Record<string, any>): any[] {
    return parameters.map(param => this.processVariableReplacements(param, contact, triggerData));
  }

  private evaluateCondition(condition: any, data: Record<string, any>): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(data, field);

    switch (operator) {
      case 'EQUALS':
        return fieldValue === value;
      case 'NOT_EQUALS':
        return fieldValue !== value;
      case 'CONTAINS':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(value);
      case 'LESS_THAN':
        return Number(fieldValue) < Number(value);
      case 'IS_EMPTY':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'IS_NOT_EMPTY':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private mapResponseData(responseData: any, mapping: Record<string, string>): any {
    const result: any = {};
    Object.entries(mapping).forEach(([targetKey, sourcePath]) => {
      result[targetKey] = this.getNestedValue(responseData, sourcePath);
    });
    return result;
  }
}