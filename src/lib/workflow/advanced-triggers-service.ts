/**
 * Advanced Workflow Triggers Service
 * 
 * Extends the existing trigger system with time-based, behavioral, and predictive triggers.
 * Builds on top of existing WorkflowTriggerManager without disrupting core functionality.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { triggerManager, queueTriggerEvent, type TriggerEvent } from './trigger-manager';

// Advanced trigger types
export interface TimeBasedTrigger {
  type: 'SCHEDULED' | 'RECURRING' | 'DELAY_AFTER_EVENT' | 'RELATIVE_DATE';
  config: {
    // For scheduled triggers
    scheduledAt?: Date;
    timezone?: string;
    
    // For recurring triggers
    recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    recurrenceValue?: number; // e.g., every 2 weeks
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    hour?: number; // 0-23
    minute?: number; // 0-59
    
    // For delay triggers
    delayAmount?: number;
    delayUnit?: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
    triggerAfterEvent?: string;
    
    // For relative date triggers
    relativeTo?: 'BIRTHDAY' | 'ANNIVERSARY' | 'SIGNUP_DATE' | 'LAST_PURCHASE';
    offsetDays?: number; // days before/after the date
  };
}

export interface BehavioralTrigger {
  type: 'ENGAGEMENT_SCORE' | 'ACTIVITY_PATTERN' | 'INACTIVITY' | 'PAGE_VISITS' | 'EMAIL_BEHAVIOR';
  config: {
    // For engagement score triggers
    scoreThreshold?: number;
    scoreComparison?: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
    
    // For activity pattern triggers
    activityType?: 'EMAIL_OPENS' | 'EMAIL_CLICKS' | 'WEBSITE_VISITS' | 'PURCHASES';
    frequency?: number; // times per period
    period?: 'DAY' | 'WEEK' | 'MONTH';
    
    // For inactivity triggers
    inactivityDays?: number;
    lastActivityType?: string;
    
    // For page visit triggers
    pageUrl?: string;
    visitCount?: number;
    timeSpent?: number; // seconds
    
    // For email behavior triggers
    openRate?: number; // percentage
    clickRate?: number; // percentage
    timeframe?: number; // days to analyze
  };
}

export interface PredictiveTrigger {
  type: 'CHURN_RISK' | 'CONVERSION_LIKELIHOOD' | 'PURCHASE_INTENT' | 'LIFECYCLE_STAGE';
  config: {
    // For churn risk triggers
    churnProbability?: number; // 0-1
    
    // For conversion likelihood triggers
    conversionProbability?: number; // 0-1
    conversionGoal?: string;
    
    // For purchase intent triggers
    intentScore?: number; // 0-100
    productCategory?: string;
    
    // For lifecycle stage triggers
    fromStage?: string;
    toStage?: string;
  };
}

export class AdvancedTriggersService {
  /**
   * Process time-based triggers (called by cron job)
   */
  async processTimeBasedTriggers(): Promise<void> {
    try {
      logger.info('Processing advanced time-based triggers');

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDayOfWeek = now.getDay();
      const currentDayOfMonth = now.getDate();

      // Find workflows with time-based triggers
      const workflows = await this.getWorkflowsWithTimeTriggers();

      for (const workflow of workflows) {
        try {
          await this.evaluateWorkflowTimeTriggers(workflow, now);
        } catch (error) {
          logger.error('Failed to evaluate time triggers for workflow', {
            workflowId: workflow.id,
            error: error.message
          });
        }
      }

      logger.info('Completed processing time-based triggers', {
        workflowsChecked: workflows.length
      });
    } catch (error) {
      logger.error('Failed to process time-based triggers', { error: error.message });
    }
  }

  /**
   * Process a trigger event (integration with existing trigger system)
   */
  async processTriggerEvent(event: { type: string; contactId: string; data: any }): Promise<void> {
    try {
      logger.info('Processing advanced trigger event', { 
        type: event.type, 
        contactId: event.contactId 
      });

      // Delegate to existing trigger manager for processing
      await queueTriggerEvent({
        type: event.type,
        contactId: event.contactId,
        data: event.data,
      });
    } catch (error) {
      logger.error('Failed to process advanced trigger event', { 
        event, 
        error: error.message 
      });
    }
  }

  /**
   * Process behavioral triggers (called by activity events)
   */
  async processBehavioralTriggers(contactId: string, activityType: string, activityData: any): Promise<void> {
    try {
      logger.info('Processing behavioral triggers', { contactId, activityType });

      // Get contact's recent activity to evaluate behavioral patterns
      const recentActivity = await this.getContactRecentActivity(contactId, 30); // 30 days
      
      // Find workflows with behavioral triggers
      const workflows = await this.getWorkflowsWithBehavioralTriggers();

      for (const workflow of workflows) {
        try {
          await this.evaluateWorkflowBehavioralTriggers(
            workflow,
            contactId,
            activityType,
            activityData,
            recentActivity
          );
        } catch (error) {
          logger.error('Failed to evaluate behavioral triggers for workflow', {
            workflowId: workflow.id,
            contactId,
            error: error.message
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process behavioral triggers', { error: error.message, contactId });
    }
  }

  /**
   * Process predictive triggers (called by ML model updates)
   */
  async processPredictiveTriggers(contactId: string, predictions: any): Promise<void> {
    try {
      logger.info('Processing predictive triggers', { contactId });

      // Find workflows with predictive triggers
      const workflows = await this.getWorkflowsWithPredictiveTriggers();

      for (const workflow of workflows) {
        try {
          await this.evaluateWorkflowPredictiveTriggers(workflow, contactId, predictions);
        } catch (error) {
          logger.error('Failed to evaluate predictive triggers for workflow', {
            workflowId: workflow.id,
            contactId,
            error: error.message
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process predictive triggers', { error: error.message, contactId });
    }
  }

  /**
   * Schedule a delayed trigger
   */
  async scheduleDelayedTrigger(
    workflowId: string,
    contactId: string,
    delayConfig: TimeBasedTrigger['config'],
    triggerData: any = {}
  ): Promise<void> {
    try {
      const { delayAmount = 1, delayUnit = 'HOURS' } = delayConfig;
      
      // Calculate delay in milliseconds
      const multipliers = {
        MINUTES: 60 * 1000,
        HOURS: 60 * 60 * 1000,
        DAYS: 24 * 60 * 60 * 1000,
        WEEKS: 7 * 24 * 60 * 60 * 1000,
        MONTHS: 30 * 24 * 60 * 60 * 1000, // Approximate
      };

      const delayMs = delayAmount * (multipliers[delayUnit] || multipliers.HOURS);
      const triggerAt = new Date(Date.now() + delayMs);

      // Store the scheduled trigger (in production, you'd use a job scheduler like Bull/Agenda)
      await prisma.workflowEvent.create({
        data: {
          eventType: 'DELAYED_TRIGGER',
          contactId,
          eventData: JSON.stringify({
            workflowId,
            originalTriggerData: triggerData,
            scheduledFor: triggerAt.toISOString(),
          }),
          processed: false,
          createdAt: new Date(),
        },
      });

      logger.info('Scheduled delayed trigger', {
        workflowId,
        contactId,
        delayAmount,
        delayUnit,
        triggerAt: triggerAt.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to schedule delayed trigger', {
        workflowId,
        contactId,
        error: error.message
      });
    }
  }

  // Private helper methods

  private async getWorkflowsWithTimeTriggers(): Promise<any[]> {
    const workflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    });

    return workflows.filter(workflow => {
      const definition = JSON.parse(workflow.definition);
      const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');
      
      return triggerNodes.some((node: any) => {
        const label = node.data?.label?.toLowerCase() || '';
        return label.includes('schedule') || 
               label.includes('time') || 
               label.includes('daily') || 
               label.includes('weekly') || 
               label.includes('monthly') ||
               label.includes('recurring');
      });
    });
  }

  private async getWorkflowsWithBehavioralTriggers(): Promise<any[]> {
    const workflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    });

    return workflows.filter(workflow => {
      const definition = JSON.parse(workflow.definition);
      const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');
      
      return triggerNodes.some((node: any) => {
        const label = node.data?.label?.toLowerCase() || '';
        return label.includes('engagement') || 
               label.includes('activity') || 
               label.includes('behavior') || 
               label.includes('inactivity') ||
               label.includes('score');
      });
    });
  }

  private async getWorkflowsWithPredictiveTriggers(): Promise<any[]> {
    const workflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    });

    return workflows.filter(workflow => {
      const definition = JSON.parse(workflow.definition);
      const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');
      
      return triggerNodes.some((node: any) => {
        const label = node.data?.label?.toLowerCase() || '';
        return label.includes('churn') || 
               label.includes('prediction') || 
               label.includes('likelihood') || 
               label.includes('intent') ||
               label.includes('lifecycle');
      });
    });
  }

  private async evaluateWorkflowTimeTriggers(workflow: any, now: Date): Promise<void> {
    const definition = JSON.parse(workflow.definition);
    const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');

    for (const triggerNode of triggerNodes) {
      const properties = triggerNode.data?.properties || {};
      const label = triggerNode.data?.label?.toLowerCase() || '';

      // Check for different time-based trigger patterns
      if (this.shouldTriggerAtTime(label, properties, now)) {
        // Get eligible contacts for this workflow
        const eligibleContacts = await this.getEligibleContactsForWorkflow(workflow.id);
        
        for (const contact of eligibleContacts) {
          await queueTriggerEvent({
            type: 'time_based_trigger',
            contactId: contact.id,
            data: {
              workflowId: workflow.id,
              triggerType: 'scheduled',
              triggerTime: now.toISOString(),
            },
          });
        }
        
        logger.info('Triggered time-based workflow', {
          workflowId: workflow.id,
          triggerLabel: label,
          contactsTriggered: eligibleContacts.length,
        });
      }
    }
  }

  private shouldTriggerAtTime(label: string, properties: any, now: Date): boolean {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDayOfWeek = now.getDay();

    // Daily triggers
    if (label.includes('daily')) {
      const targetHour = properties.hour || 9; // Default 9 AM
      const targetMinute = properties.minute || 0;
      return currentHour === targetHour && currentMinute === targetMinute;
    }

    // Weekly triggers
    if (label.includes('weekly')) {
      const targetDay = properties.dayOfWeek || 1; // Default Monday
      const targetHour = properties.hour || 9;
      const targetMinute = properties.minute || 0;
      return currentDayOfWeek === targetDay && 
             currentHour === targetHour && 
             currentMinute === targetMinute;
    }

    // Monthly triggers
    if (label.includes('monthly')) {
      const targetDay = properties.dayOfMonth || 1; // Default 1st of month
      const targetHour = properties.hour || 9;
      const targetMinute = properties.minute || 0;
      return now.getDate() === targetDay && 
             currentHour === targetHour && 
             currentMinute === targetMinute;
    }

    return false;
  }

  private async evaluateWorkflowBehavioralTriggers(
    workflow: any,
    contactId: string,
    activityType: string,
    activityData: any,
    recentActivity: any[]
  ): Promise<void> {
    const definition = JSON.parse(workflow.definition);
    const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');

    for (const triggerNode of triggerNodes) {
      const properties = triggerNode.data?.properties || {};
      const label = triggerNode.data?.label?.toLowerCase() || '';

      if (this.shouldTriggerOnBehavior(label, properties, contactId, activityType, recentActivity)) {
        await queueTriggerEvent({
          type: 'behavioral_trigger',
          contactId,
          data: {
            workflowId: workflow.id,
            triggerType: 'behavioral',
            activityType,
            activityData,
          },
        });

        logger.info('Triggered behavioral workflow', {
          workflowId: workflow.id,
          contactId,
          triggerLabel: label,
          activityType,
        });
      }
    }
  }

  private shouldTriggerOnBehavior(
    label: string,
    properties: any,
    contactId: string,
    activityType: string,
    recentActivity: any[]
  ): boolean {
    // Engagement score triggers
    if (label.includes('engagement score')) {
      const engagementScore = this.calculateEngagementScore(recentActivity);
      const threshold = properties.scoreThreshold || 50;
      const comparison = properties.scoreComparison || 'GREATER_THAN';
      
      switch (comparison) {
        case 'GREATER_THAN':
          return engagementScore > threshold;
        case 'LESS_THAN':
          return engagementScore < threshold;
        case 'EQUALS':
          return Math.abs(engagementScore - threshold) < 5; // 5 point tolerance
        default:
          return false;
      }
    }

    // Inactivity triggers
    if (label.includes('inactivity')) {
      const inactivityDays = properties.inactivityDays || 7;
      const lastActivity = recentActivity[0]; // Most recent activity
      
      if (!lastActivity) return true; // No activity at all
      
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivity.timestamp).getTime()) / (24 * 60 * 60 * 1000)
      );
      
      return daysSinceLastActivity >= inactivityDays;
    }

    // Email behavior triggers
    if (label.includes('email behavior')) {
      const emailActivities = recentActivity.filter(a => a.type === 'EMAIL_OPENED' || a.type === 'EMAIL_CLICKED');
      const totalEmails = emailActivities.length;
      
      if (totalEmails === 0) return false;
      
      const openRate = emailActivities.filter(a => a.type === 'EMAIL_OPENED').length / totalEmails;
      const clickRate = emailActivities.filter(a => a.type === 'EMAIL_CLICKED').length / totalEmails;
      
      const minOpenRate = properties.openRate || 0.2; // 20%
      const minClickRate = properties.clickRate || 0.05; // 5%
      
      return openRate >= minOpenRate && clickRate >= minClickRate;
    }

    return false;
  }

  private async evaluateWorkflowPredictiveTriggers(
    workflow: any,
    contactId: string,
    predictions: any
  ): Promise<void> {
    const definition = JSON.parse(workflow.definition);
    const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');

    for (const triggerNode of triggerNodes) {
      const properties = triggerNode.data?.properties || {};
      const label = triggerNode.data?.label?.toLowerCase() || '';

      if (this.shouldTriggerOnPrediction(label, properties, predictions)) {
        await queueTriggerEvent({
          type: 'predictive_trigger',
          contactId,
          data: {
            workflowId: workflow.id,
            triggerType: 'predictive',
            predictions,
          },
        });

        logger.info('Triggered predictive workflow', {
          workflowId: workflow.id,
          contactId,
          triggerLabel: label,
        });
      }
    }
  }

  private shouldTriggerOnPrediction(label: string, properties: any, predictions: any): boolean {
    // Churn risk triggers
    if (label.includes('churn risk')) {
      const churnProbability = predictions.churnProbability || 0;
      const threshold = properties.churnProbability || 0.7; // 70%
      return churnProbability >= threshold;
    }

    // Conversion likelihood triggers
    if (label.includes('conversion likelihood')) {
      const conversionProbability = predictions.conversionProbability || 0;
      const threshold = properties.conversionProbability || 0.8; // 80%
      return conversionProbability >= threshold;
    }

    // Purchase intent triggers
    if (label.includes('purchase intent')) {
      const intentScore = predictions.purchaseIntentScore || 0;
      const threshold = properties.intentScore || 70; // 70/100
      return intentScore >= threshold;
    }

    return false;
  }

  private async getContactRecentActivity(contactId: string, days: number): Promise<any[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate activity from multiple sources
    const [emailActivities, workflowEvents] = await Promise.all([
      prisma.emailActivity.findMany({
        where: {
          contactId,
          timestamp: { gte: cutoffDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.workflowEvent.findMany({
        where: {
          contactId,
          createdAt: { gte: cutoffDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Combine and normalize activities
    const activities = [
      ...emailActivities.map(a => ({
        type: a.type,
        timestamp: a.timestamp,
        data: a.metadata ? JSON.parse(a.metadata) : {},
      })),
      ...workflowEvents.map(e => ({
        type: e.eventType,
        timestamp: e.createdAt,
        data: e.eventData ? JSON.parse(e.eventData) : {},
      })),
    ];

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private calculateEngagementScore(activities: any[]): number {
    if (activities.length === 0) return 0;

    let score = 0;
    const weights = {
      EMAIL_OPENED: 1,
      EMAIL_CLICKED: 3,
      WORKFLOW_COMPLETED: 5,
      FORM_SUBMITTED: 4,
      PURCHASE_COMPLETED: 10,
    };

    activities.forEach(activity => {
      const weight = weights[activity.type as keyof typeof weights] || 1;
      score += weight;
    });

    // Normalize to 0-100 scale
    return Math.min(100, Math.floor(score / activities.length * 10));
  }

  private async getEligibleContactsForWorkflow(workflowId: string): Promise<any[]> {
    // For safety, limit to a small number of contacts
    return await prisma.contact.findMany({
      where: { 
        status: 'ACTIVE',
        // Add workflow-specific targeting rules here
      },
      take: 50, // Conservative limit
    });
  }
}

// Export singleton instance
export const advancedTriggersService = new AdvancedTriggersService();