import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { QueueService } from '../../core/queue/queue.service';
import { WorkflowExecutionService } from './workflow-execution.service';

export enum TriggerType {
  EMAIL_OPENED = 'EMAIL_OPENED',
  EMAIL_CLICKED = 'EMAIL_CLICKED',
  CONTACT_CREATED = 'CONTACT_CREATED',
  CONTACT_UPDATED = 'CONTACT_UPDATED',
  CAMPAIGN_SENT = 'CAMPAIGN_SENT',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  PAGE_VISITED = 'PAGE_VISITED',
  TIME_DELAY = 'TIME_DELAY',
  DATE_SCHEDULED = 'DATE_SCHEDULED',
  CONDITIONAL = 'CONDITIONAL',
  WEBHOOK = 'WEBHOOK',
  API_CALL = 'API_CALL',
  MANUAL = 'MANUAL',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
  REGEX_MATCH = 'REGEX_MATCH',
}

export interface TriggerCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: TriggerType;
  name: string;
  description?: string;
  isActive: boolean;
  conditions: TriggerCondition[];
  config: Record<string, any>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerEvent {
  type: TriggerType;
  organizationId: string;
  contactId?: string;
  data: Record<string, any>;
  timestamp: string;
  source?: string;
}

@Injectable()
export class WorkflowTriggerService {
  private readonly logger = new Logger(WorkflowTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  async createTrigger(
    workflowId: string,
    triggerData: Partial<WorkflowTrigger>,
    organizationId: string,
    userId: string,
  ): Promise<WorkflowTrigger> {
    const trigger: WorkflowTrigger = {
      id: `trigger_${Date.now()}`,
      workflowId,
      type: triggerData.type || TriggerType.MANUAL,
      name: triggerData.name || `Trigger for Workflow ${workflowId}`,
      description: triggerData.description,
      isActive: triggerData.isActive ?? true,
      conditions: triggerData.conditions || [],
      config: triggerData.config || {},
      organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache trigger
    await this.redis.set(
      `workflow_trigger:${trigger.id}`,
      JSON.stringify(trigger),
      3600 * 24 * 7, // 7 days
    );

    // Add to organization's active triggers
    await this.addToActiveTriggers(organizationId, trigger);

    this.logger.log(`Created trigger ${trigger.id} for workflow ${workflowId}`);
    return trigger;
  }

  async handleTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      const activeTriggers = await this.getActiveTriggers(event.organizationId, event.type);
      
      for (const trigger of activeTriggers) {
        if (await this.evaluateTriggerConditions(trigger, event)) {
          await this.executeTrigger(trigger, event);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle trigger event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async evaluateTriggerConditions(trigger: WorkflowTrigger, event: TriggerEvent): Promise<boolean> {
    if (trigger.conditions.length === 0) {
      return true; // No conditions means always trigger
    }

    let result = true;
    let currentLogicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of trigger.conditions) {
      const conditionResult = this.evaluateCondition(condition, event.data);
      
      if (currentLogicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      // Set the logical operator for the next condition
      if (condition.logicalOperator) {
        currentLogicalOperator = condition.logicalOperator;
      }
    }

    return result;
  }

  private evaluateCondition(condition: TriggerCondition, data: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === conditionValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;
      case ConditionOperator.CONTAINS:
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(fieldValue) >= Number(conditionValue);
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(fieldValue) <= Number(conditionValue);
      case ConditionOperator.IN:
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case ConditionOperator.IS_EMPTY:
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case ConditionOperator.IS_NOT_EMPTY:
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case ConditionOperator.REGEX_MATCH:
        try {
          const regex = new RegExp(conditionValue);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeTrigger(trigger: WorkflowTrigger, event: TriggerEvent): Promise<void> {
    try {
      // Handle different trigger types
      switch (trigger.type) {
        case TriggerType.TIME_DELAY:
          await this.handleTimeDelayTrigger(trigger, event);
          break;
        case TriggerType.DATE_SCHEDULED:
          await this.handleScheduledTrigger(trigger, event);
          break;
        default:
          await this.executeWorkflow(trigger, event);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to execute trigger ${trigger.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleTimeDelayTrigger(trigger: WorkflowTrigger, event: TriggerEvent): Promise<void> {
    const delay = trigger.config.delayMinutes || 0;
    const scheduledFor = new Date(Date.now() + delay * 60 * 1000).toISOString();

    await this.queueService.addEmailTask({
      type: 'WORKFLOW_EXECUTION_DELAYED',
      userId: 'system',
      metadata: {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        contactId: event.contactId,
        organizationId: event.organizationId,
        triggerData: event.data,
        scheduledFor,
      },
    });
  }

  private async handleScheduledTrigger(trigger: WorkflowTrigger, event: TriggerEvent): Promise<void> {
    const scheduledDate = trigger.config.scheduledDate || new Date().toISOString();

    await this.queueService.addEmailTask({
      type: 'WORKFLOW_EXECUTION_SCHEDULED',
      userId: 'system',
      metadata: {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        contactId: event.contactId,
        organizationId: event.organizationId,
        triggerData: event.data,
        scheduledFor: scheduledDate,
      },
    });
  }

  private async executeWorkflow(trigger: WorkflowTrigger, event: TriggerEvent): Promise<void> {
    if (!event.contactId) {
      this.logger.warn(`Cannot execute workflow ${trigger.workflowId}: No contact ID provided`);
      return;
    }

    await this.workflowExecutionService.execute(
      trigger.workflowId,
      {
        contactId: event.contactId,
        triggerData: event.data,
        immediate: true,
      },
      event.organizationId,
      'system',
    );
  }

  private async getActiveTriggers(organizationId: string, triggerType?: TriggerType): Promise<WorkflowTrigger[]> {
    const cacheKey = `active_triggers:${organizationId}${triggerType ? `:${triggerType}` : ''}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Cache corrupted, continue to fetch fresh data
      }
    }

    // Mock data - would typically come from database
    const triggers: WorkflowTrigger[] = [
      {
        id: 'trigger_1',
        workflowId: 'workflow_1',
        type: TriggerType.CONTACT_CREATED,
        name: 'Welcome Series Trigger',
        description: 'Triggers welcome email series for new contacts',
        isActive: true,
        conditions: [],
        config: {},
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trigger_2',
        workflowId: 'workflow_2',
        type: TriggerType.EMAIL_OPENED,
        name: 'Follow-up Trigger',
        description: 'Triggers follow-up sequence when email is opened',
        isActive: true,
        conditions: [],
        config: {},
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const filteredTriggers = triggerType 
      ? triggers.filter(t => t.type === triggerType)
      : triggers;

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(filteredTriggers), 300);

    return filteredTriggers;
  }

  private async addToActiveTriggers(organizationId: string, trigger: WorkflowTrigger): Promise<void> {
    const allTriggers = await this.getActiveTriggers(organizationId);
    allTriggers.push(trigger);
    
    await this.redis.set(
      `active_triggers:${organizationId}`,
      JSON.stringify(allTriggers),
      300,
    );
  }

  // Public methods for external trigger events
  async triggerContactCreated(organizationId: string, contactId: string, contactData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.CONTACT_CREATED,
      organizationId,
      contactId,
      data: contactData,
      timestamp: new Date().toISOString(),
      source: 'contact_service',
    });
  }

  async triggerEmailOpened(organizationId: string, contactId: string, emailData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.EMAIL_OPENED,
      organizationId,
      contactId,
      data: emailData,
      timestamp: new Date().toISOString(),
      source: 'email_service',
    });
  }

  async triggerEmailClicked(organizationId: string, contactId: string, emailData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.EMAIL_CLICKED,
      organizationId,
      contactId,
      data: emailData,
      timestamp: new Date().toISOString(),
      source: 'email_service',
    });
  }

  async triggerFormSubmitted(organizationId: string, contactId: string, formData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.FORM_SUBMITTED,
      organizationId,
      contactId,
      data: formData,
      timestamp: new Date().toISOString(),
      source: 'form_service',
    });
  }

  async triggerPageVisited(organizationId: string, contactId: string, pageData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.PAGE_VISITED,
      organizationId,
      contactId,
      data: pageData,
      timestamp: new Date().toISOString(),
      source: 'tracking_service',
    });
  }

  async triggerWebhook(organizationId: string, webhookData: any): Promise<void> {
    await this.handleTriggerEvent({
      type: TriggerType.WEBHOOK,
      organizationId,
      contactId: webhookData.contactId,
      data: webhookData,
      timestamp: new Date().toISOString(),
      source: 'webhook',
    });
  }
}