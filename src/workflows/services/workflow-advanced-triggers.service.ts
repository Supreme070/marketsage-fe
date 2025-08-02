import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/database/redis/redis.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WorkflowTriggerService, TriggerType, TriggerEvent } from './workflow-trigger.service';

export enum AdvancedTriggerType {
  // Time-based triggers
  RECURRING_SCHEDULE = 'RECURRING_SCHEDULE',
  ANNIVERSARY_DATE = 'ANNIVERSARY_DATE',
  BUSINESS_HOURS = 'BUSINESS_HOURS',
  TIMEZONE_SPECIFIC = 'TIMEZONE_SPECIFIC',
  
  // Behavioral triggers
  BEHAVIORAL_SCORE = 'BEHAVIORAL_SCORE',
  ENGAGEMENT_PATTERN = 'ENGAGEMENT_PATTERN',
  INACTIVITY_PERIOD = 'INACTIVITY_PERIOD',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  
  // Data-driven triggers
  FIELD_CHANGED = 'FIELD_CHANGED',
  THRESHOLD_CROSSED = 'THRESHOLD_CROSSED',
  PATTERN_DETECTED = 'PATTERN_DETECTED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  
  // Integration triggers
  EXTERNAL_EVENT = 'EXTERNAL_EVENT',
  THIRD_PARTY_WEBHOOK = 'THIRD_PARTY_WEBHOOK',
  DATABASE_CHANGE = 'DATABASE_CHANGE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  
  // Advanced conditions
  MULTI_STEP_CONDITION = 'MULTI_STEP_CONDITION',
  PROBABILITY_BASED = 'PROBABILITY_BASED',
  AI_PREDICTION = 'AI_PREDICTION',
  CONTEXTUAL_CONDITION = 'CONTEXTUAL_CONDITION',
}

export interface AdvancedTriggerConfig {
  // Recurring schedule configuration
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number; // Every N periods
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    monthsOfYear?: number[]; // 1-12
    timeOfDay?: string; // HH:MM format
    timezone?: string;
    endDate?: string;
  };

  // Behavioral configuration
  behavioral?: {
    scoreThreshold: number;
    scoreType: 'ENGAGEMENT' | 'LEAD' | 'CUSTOMER_HEALTH' | 'CHURN_RISK';
    timeWindow: number; // days
    includeAnonymous: boolean;
    segments?: string[];
  };

  // Field change configuration
  fieldChange?: {
    field: string;
    previousValue?: any;
    newValue?: any;
    changeType: 'ANY' | 'INCREASED' | 'DECREASED' | 'SPECIFIC';
    threshold?: number;
  };

  // Pattern detection configuration
  pattern?: {
    events: string[];
    sequence: boolean; // Must occur in order
    timeWindow: number; // minutes
    minimumOccurrences: number;
    maximumGap: number; // minutes between events
  };

  // External integration configuration
  external?: {
    source: string;
    endpoint?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'API_KEY' | 'BEARER' | 'BASIC' | 'OAUTH';
      config: Record<string, any>;
    };
    payloadMapping?: Record<string, string>;
  };

  // AI/ML configuration
  aiPrediction?: {
    model: string;
    features: string[];
    threshold: number;
    confidenceLevel: number;
  };

  // Multi-step condition configuration
  multiStep?: {
    steps: Array<{
      condition: any;
      timeWindow: number;
      required: boolean;
    }>;
    operator: 'ALL' | 'ANY' | 'SEQUENCE';
  };
}

export interface AdvancedTrigger {
  id: string;
  workflowId: string;
  type: AdvancedTriggerType;
  name: string;
  description?: string;
  isActive: boolean;
  config: AdvancedTriggerConfig;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
  successCount: number;
  failureCount: number;
}

export interface TriggerExecutionContext {
  triggerId: string;
  workflowId: string;
  organizationId: string;
  contactId?: string;
  eventData: Record<string, any>;
  timestamp: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WorkflowAdvancedTriggersService {
  private readonly logger = new Logger(WorkflowAdvancedTriggersService.name);
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly httpService: HttpService,
    private readonly workflowTriggerService: WorkflowTriggerService,
  ) {
    this.startScheduler();
  }

  async createAdvancedTrigger(
    triggerData: Omit<AdvancedTrigger, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount' | 'successCount' | 'failureCount'>,
  ): Promise<AdvancedTrigger> {
    const trigger: AdvancedTrigger = {
      ...triggerData,
      id: `adv_trigger_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      successCount: 0,
      failureCount: 0,
    };

    // Validate trigger configuration
    await this.validateTriggerConfig(trigger);

    // Store trigger
    await this.redis.set(
      `advanced_trigger:${trigger.id}`,
      JSON.stringify(trigger),
      3600 * 24 * 30, // 30 days
    );

    // Add to active triggers
    await this.redis.sadd(
      `advanced_triggers:${trigger.organizationId}`,
      trigger.id,
    );

    // Schedule if time-based
    if (this.isTimeBased(trigger.type)) {
      await this.scheduleTimeBased(trigger);
    }

    this.logger.log(`Created advanced trigger: ${trigger.name} (${trigger.type})`);
    return trigger;
  }

  async updateAdvancedTrigger(
    triggerId: string,
    updates: Partial<AdvancedTrigger>,
  ): Promise<AdvancedTrigger> {
    const existingTrigger = await this.getAdvancedTrigger(triggerId);
    if (!existingTrigger) {
      throw new Error('Advanced trigger not found');
    }

    const updatedTrigger: AdvancedTrigger = {
      ...existingTrigger,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated configuration
    await this.validateTriggerConfig(updatedTrigger);

    // Update storage
    await this.redis.set(
      `advanced_trigger:${triggerId}`,
      JSON.stringify(updatedTrigger),
      3600 * 24 * 30,
    );

    return updatedTrigger;
  }

  async deleteAdvancedTrigger(triggerId: string, organizationId: string): Promise<void> {
    await this.redis.del(`advanced_trigger:${triggerId}`);
    await this.redis.srem(`advanced_triggers:${organizationId}`, triggerId);
    
    // Remove from scheduler
    await this.redis.del(`scheduled_trigger:${triggerId}`);
    
    this.logger.log(`Deleted advanced trigger: ${triggerId}`);
  }

  async executeAdvancedTrigger(context: TriggerExecutionContext): Promise<boolean> {
    try {
      const trigger = await this.getAdvancedTrigger(context.triggerId);
      if (!trigger || !trigger.isActive) {
        return false;
      }

      // Check if trigger conditions are met
      const shouldExecute = await this.evaluateTriggerConditions(trigger, context);
      
      if (shouldExecute) {
        // Convert to standard trigger event
        const triggerEvent: TriggerEvent = {
          type: this.mapToStandardTriggerType(trigger.type),
          organizationId: context.organizationId,
          contactId: context.contactId,
          data: context.eventData,
          timestamp: context.timestamp,
          source: 'advanced_trigger',
        };

        // Execute through standard trigger service
        await this.workflowTriggerService.handleTriggerEvent(triggerEvent);

        // Update trigger statistics
        await this.updateTriggerStats(trigger.id, true);

        this.logger.log(`Advanced trigger executed: ${trigger.name}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to execute advanced trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateTriggerStats(context.triggerId, false);
      return false;
    }
  }

  async handleRecurringSchedule(trigger: AdvancedTrigger): Promise<void> {
    if (!trigger.config.schedule) return;

    const now = new Date();
    const schedule = trigger.config.schedule;
    
    // Check if current time matches schedule
    if (this.matchesSchedule(now, schedule)) {
      // Get contacts that match this trigger
      const contacts = await this.getContactsForTrigger(trigger);
      
      for (const contact of contacts) {
        const context: TriggerExecutionContext = {
          triggerId: trigger.id,
          workflowId: trigger.workflowId,
          organizationId: trigger.organizationId,
          contactId: contact.id,
          eventData: {
            triggerType: 'RECURRING_SCHEDULE',
            scheduleType: schedule.frequency,
            contact,
          },
          timestamp: now.toISOString(),
          metadata: {
            scheduledExecution: true,
          },
        };

        await this.executeAdvancedTrigger(context);
      }
    }
  }

  async handleBehavioralScore(trigger: AdvancedTrigger, contactId: string, scoreData: any): Promise<void> {
    if (!trigger.config.behavioral) return;

    const config = trigger.config.behavioral;
    const currentScore = scoreData[config.scoreType.toLowerCase()] || 0;

    if (currentScore >= config.scoreThreshold) {
      const context: TriggerExecutionContext = {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        organizationId: trigger.organizationId,
        contactId,
        eventData: {
          triggerType: 'BEHAVIORAL_SCORE',
          scoreType: config.scoreType,
          currentScore,
          threshold: config.scoreThreshold,
          scoreData,
        },
        timestamp: new Date().toISOString(),
      };

      await this.executeAdvancedTrigger(context);
    }
  }

  async handleFieldChange(trigger: AdvancedTrigger, contactId: string, fieldChanges: Record<string, { old: any; new: any }>): Promise<void> {
    if (!trigger.config.fieldChange) return;

    const config = trigger.config.fieldChange;
    const change = fieldChanges[config.field];

    if (!change) return;

    let shouldTrigger = false;

    switch (config.changeType) {
      case 'ANY':
        shouldTrigger = change.old !== change.new;
        break;
      case 'INCREASED':
        shouldTrigger = Number(change.new) > Number(change.old);
        break;
      case 'DECREASED':
        shouldTrigger = Number(change.new) < Number(change.old);
        break;
      case 'SPECIFIC':
        shouldTrigger = change.new === config.newValue;
        break;
    }

    if (shouldTrigger) {
      const context: TriggerExecutionContext = {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        organizationId: trigger.organizationId,
        contactId,
        eventData: {
          triggerType: 'FIELD_CHANGED',
          field: config.field,
          previousValue: change.old,
          newValue: change.new,
          changeType: config.changeType,
        },
        timestamp: new Date().toISOString(),
      };

      await this.executeAdvancedTrigger(context);
    }
  }

  async handlePatternDetection(trigger: AdvancedTrigger, organizationId: string, events: Array<{ type: string; timestamp: string; contactId: string; data: any }>): Promise<void> {
    if (!trigger.config.pattern) return;

    const config = trigger.config.pattern;
    const pattern = config.events;
    const timeWindow = config.timeWindow * 60 * 1000; // Convert to milliseconds

    // Group events by contact
    const eventsByContact = new Map<string, typeof events>();
    events.forEach(event => {
      if (!eventsByContact.has(event.contactId)) {
        eventsByContact.set(event.contactId, []);
      }
      eventsByContact.get(event.contactId)!.push(event);
    });

    for (const [contactId, contactEvents] of eventsByContact) {
      const detectedPattern = this.detectEventPattern(contactEvents, pattern, timeWindow, config);
      
      if (detectedPattern) {
        const context: TriggerExecutionContext = {
          triggerId: trigger.id,
          workflowId: trigger.workflowId,
          organizationId,
          contactId,
          eventData: {
            triggerType: 'PATTERN_DETECTED',
            pattern: pattern,
            detectedEvents: detectedPattern.events,
            timespan: detectedPattern.timespan,
          },
          timestamp: new Date().toISOString(),
        };

        await this.executeAdvancedTrigger(context);
      }
    }
  }

  async handleExternalEvent(trigger: AdvancedTrigger, webhookData: any): Promise<void> {
    if (!trigger.config.external) return;

    // Map webhook data using configured mapping
    const mappedData = this.mapExternalData(webhookData, trigger.config.external.payloadMapping || {});

    const context: TriggerExecutionContext = {
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      organizationId: trigger.organizationId,
      contactId: mappedData.contactId,
      eventData: {
        triggerType: 'EXTERNAL_EVENT',
        source: trigger.config.external.source,
        originalData: webhookData,
        mappedData,
      },
      timestamp: new Date().toISOString(),
    };

    await this.executeAdvancedTrigger(context);
  }

  async handleAIPrediction(trigger: AdvancedTrigger, contactId: string, predictionData: any): Promise<void> {
    if (!trigger.config.aiPrediction) return;

    const config = trigger.config.aiPrediction;
    const prediction = predictionData[config.model];

    if (prediction && 
        prediction.score >= config.threshold && 
        prediction.confidence >= config.confidenceLevel) {
      
      const context: TriggerExecutionContext = {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        organizationId: trigger.organizationId,
        contactId,
        eventData: {
          triggerType: 'AI_PREDICTION',
          model: config.model,
          prediction: prediction.score,
          confidence: prediction.confidence,
          features: config.features,
          predictionData,
        },
        timestamp: new Date().toISOString(),
      };

      await this.executeAdvancedTrigger(context);
    }
  }

  async getAdvancedTriggers(organizationId: string, workflowId?: string): Promise<AdvancedTrigger[]> {
    const triggerIds = await this.redis.smembers(`advanced_triggers:${organizationId}`);
    const triggers: AdvancedTrigger[] = [];

    for (const triggerId of triggerIds) {
      const trigger = await this.getAdvancedTrigger(triggerId);
      if (trigger && (!workflowId || trigger.workflowId === workflowId)) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  async getAdvancedTriggerStats(triggerId: string): Promise<{
    triggerCount: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    lastTriggered?: string;
    averageResponseTime?: number;
  }> {
    const trigger = await this.getAdvancedTrigger(triggerId);
    if (!trigger) {
      throw new Error('Advanced trigger not found');
    }

    const successRate = trigger.triggerCount > 0 
      ? (trigger.successCount / trigger.triggerCount) * 100 
      : 0;

    return {
      triggerCount: trigger.triggerCount,
      successCount: trigger.successCount,
      failureCount: trigger.failureCount,
      successRate,
      lastTriggered: trigger.lastTriggered,
      averageResponseTime: await this.getAverageResponseTime(triggerId),
    };
  }

  // Private methods

  private async getAdvancedTrigger(triggerId: string): Promise<AdvancedTrigger | null> {
    const cached = await this.redis.get(`advanced_trigger:${triggerId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async validateTriggerConfig(trigger: AdvancedTrigger): Promise<void> {
    switch (trigger.type) {
      case AdvancedTriggerType.RECURRING_SCHEDULE:
        if (!trigger.config.schedule) {
          throw new Error('Schedule configuration is required for recurring schedule triggers');
        }
        break;
      case AdvancedTriggerType.BEHAVIORAL_SCORE:
        if (!trigger.config.behavioral) {
          throw new Error('Behavioral configuration is required for behavioral score triggers');
        }
        break;
      case AdvancedTriggerType.FIELD_CHANGED:
        if (!trigger.config.fieldChange) {
          throw new Error('Field change configuration is required for field change triggers');
        }
        break;
      case AdvancedTriggerType.PATTERN_DETECTED:
        if (!trigger.config.pattern) {
          throw new Error('Pattern configuration is required for pattern detection triggers');
        }
        break;
      case AdvancedTriggerType.EXTERNAL_EVENT:
        if (!trigger.config.external) {
          throw new Error('External configuration is required for external event triggers');
        }
        break;
    }
  }

  private isTimeBased(triggerType: AdvancedTriggerType): boolean {
    return [
      AdvancedTriggerType.RECURRING_SCHEDULE,
      AdvancedTriggerType.ANNIVERSARY_DATE,
      AdvancedTriggerType.BUSINESS_HOURS,
      AdvancedTriggerType.TIMEZONE_SPECIFIC,
    ].includes(triggerType);
  }

  private async scheduleTimeBased(trigger: AdvancedTrigger): Promise<void> {
    const scheduleKey = `scheduled_trigger:${trigger.id}`;
    await this.redis.set(
      scheduleKey,
      JSON.stringify({
        triggerId: trigger.id,
        type: trigger.type,
        config: trigger.config,
        nextExecution: this.calculateNextExecution(trigger),
      }),
      3600 * 24, // 24 hours
    );
  }

  private calculateNextExecution(trigger: AdvancedTrigger): string {
    if (!trigger.config.schedule) {
      return new Date().toISOString();
    }

    const now = new Date();
    const schedule = trigger.config.schedule;
    
    // Simple implementation - would be more complex in production
    switch (schedule.frequency) {
      case 'DAILY':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'MONTHLY':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
      case 'YEARLY':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour
    }
  }

  private matchesSchedule(now: Date, schedule: any): boolean {
    // Simplified schedule matching - production would be more sophisticated
    if (schedule.timeOfDay) {
      const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
      if (now.getHours() !== hours || now.getMinutes() !== minutes) {
        return false;
      }
    }

    if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(now.getDay())) {
      return false;
    }

    if (schedule.daysOfMonth && !schedule.daysOfMonth.includes(now.getDate())) {
      return false;
    }

    if (schedule.monthsOfYear && !schedule.monthsOfYear.includes(now.getMonth() + 1)) {
      return false;
    }

    return true;
  }

  private async getContactsForTrigger(trigger: AdvancedTrigger): Promise<any[]> {
    // Mock implementation - would query contacts based on trigger criteria
    return [
      { id: 'contact_1', email: 'user1@example.com' },
      { id: 'contact_2', email: 'user2@example.com' },
    ];
  }

  private async evaluateTriggerConditions(trigger: AdvancedTrigger, context: TriggerExecutionContext): Promise<boolean> {
    // Default implementation - can be extended for complex conditions
    return true;
  }

  private mapToStandardTriggerType(advancedType: AdvancedTriggerType): TriggerType {
    // Map advanced trigger types to standard trigger types
    switch (advancedType) {
      case AdvancedTriggerType.FIELD_CHANGED:
        return TriggerType.CONTACT_UPDATED;
      case AdvancedTriggerType.EXTERNAL_EVENT:
        return TriggerType.WEBHOOK;
      case AdvancedTriggerType.RECURRING_SCHEDULE:
        return TriggerType.DATE_SCHEDULED;
      default:
        return TriggerType.MANUAL;
    }
  }

  private detectEventPattern(events: any[], pattern: string[], timeWindow: number, config: any): any {
    // Simplified pattern detection - production would be more sophisticated
    const sortedEvents = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let matchedEvents = [];
    let lastMatchTime = 0;

    for (const eventType of pattern) {
      const matchingEvent = sortedEvents.find(event => 
        event.type === eventType && 
        new Date(event.timestamp).getTime() > lastMatchTime &&
        new Date(event.timestamp).getTime() <= lastMatchTime + timeWindow
      );

      if (matchingEvent) {
        matchedEvents.push(matchingEvent);
        lastMatchTime = new Date(matchingEvent.timestamp).getTime();
      } else if (config.sequence) {
        return null; // Pattern broken in sequence mode
      }
    }

    return matchedEvents.length >= config.minimumOccurrences ? {
      events: matchedEvents,
      timespan: lastMatchTime - new Date(matchedEvents[0].timestamp).getTime(),
    } : null;
  }

  private mapExternalData(webhookData: any, mapping: Record<string, string>): any {
    const mappedData: any = {};
    
    Object.entries(mapping).forEach(([targetField, sourcePath]) => {
      mappedData[targetField] = this.getNestedValue(webhookData, sourcePath);
    });

    return mappedData;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async updateTriggerStats(triggerId: string, success: boolean): Promise<void> {
    const trigger = await this.getAdvancedTrigger(triggerId);
    if (!trigger) return;

    const updatedTrigger: AdvancedTrigger = {
      ...trigger,
      triggerCount: trigger.triggerCount + 1,
      successCount: success ? trigger.successCount + 1 : trigger.successCount,
      failureCount: success ? trigger.failureCount : trigger.failureCount + 1,
      lastTriggered: new Date().toISOString(),
    };

    await this.redis.set(
      `advanced_trigger:${triggerId}`,
      JSON.stringify(updatedTrigger),
      3600 * 24 * 30,
    );
  }

  private async getAverageResponseTime(triggerId: string): Promise<number> {
    // Mock implementation - would calculate from execution logs
    return Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
  }

  private startScheduler(): void {
    // Check scheduled triggers every minute
    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledTriggers();
      } catch (error) {
        this.logger.error(`Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 60 * 1000);

    this.logger.log('Advanced triggers scheduler started');
  }

  private async processScheduledTriggers(): Promise<void> {
    // Get all scheduled triggers and check if they should execute
    const now = new Date();
    
    // This is a simplified implementation
    // Production would use a more sophisticated scheduling system
    this.logger.debug('Processing scheduled triggers...');
  }

  onModuleDestroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.logger.log('Advanced triggers scheduler stopped');
    }
  }
}