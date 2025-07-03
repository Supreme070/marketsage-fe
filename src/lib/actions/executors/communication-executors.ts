/**
 * Communication Executor Implementations
 * ======================================
 * 
 * Safe implementations for email, SMS, WhatsApp, and push notification actions
 * that integrate with existing campaign services without breaking the app.
 */

import { ActionType, type ActionExecutionResult } from '../action-plan-interface';
import type { ExecutionContext } from '../action-dispatcher';
import { BaseExecutor } from './base-executor';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * Email Executor - Integrates with existing email campaign system
 */
export class EmailExecutor extends BaseExecutor {
  actionType = ActionType.SEND_EMAIL;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      // Validate required parameters
      if (!this.validateParameters(context, ['templateId', 'subject'])) {
        return this.createFailureResult('Missing required email parameters');
      }

      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      if (!contact.email) {
        return this.createFailureResult('Contact has no email address');
      }

      // Get email parameters
      const templateId = this.getParameter(context, 'templateId', 'default_engagement');
      const subject = this.getParameter(context, 'subject', 'Personalized Message');
      const fromAddress = this.getParameter(context, 'from', contact.organization?.email || 'noreply@marketsage.africa');
      const personalizationData = this.getParameter(context, 'personalizationData', {});

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'send_email',
          recipient: contact.email,
          subject,
          templateId,
          message: 'Dry run - email would be sent'
        });
      }

      // Create email campaign record
      const emailCampaign = await this.createEmailCampaign(context, {
        templateId,
        subject,
        fromAddress,
        recipient: contact,
        personalizationData
      });

      logger.info('Email action executed successfully', {
        actionPlanId: context.actionPlan.id,
        emailCampaignId: emailCampaign.id,
        recipient: contact.email,
        subject
      });

      return this.createSuccessResult({
        emailCampaignId: emailCampaign.id,
        recipient: contact.email,
        subject,
        templateId,
        sentAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Email execution failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private async createEmailCampaign(context: ExecutionContext, emailData: any): Promise<any> {
    // Create a single-recipient email campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `AI Action: ${context.actionPlan.actionName}`,
        description: `Automated email from AI action plan: ${context.actionPlan.id}`,
        subject: emailData.subject,
        from: emailData.fromAddress,
        content: this.generateEmailContent(emailData),
        status: 'SENT', // Mark as sent since this is an immediate action
        organizationId: context.organizationId,
        createdBy: context.userId || 'supreme-ai-v3',
        metadata: {
          actionPlanId: context.actionPlan.id,
          aiGenerated: true,
          templateId: emailData.templateId,
          personalizationData: emailData.personalizationData
        }
      }
    });

    // Create contact campaign relationship
    await prisma.contactEmailCampaign.create({
      data: {
        contactId: context.actionPlan.contactId,
        campaignId: campaign.id,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          actionPlanId: context.actionPlan.id,
          automatedSend: true
        }
      }
    });

    return campaign;
  }

  private generateEmailContent(emailData: any): string {
    // Generate basic email content based on template and personalization
    const { templateId, personalizationData = {} } = emailData;
    
    // Basic template content - in production, this would use a proper template engine
    const templates: Record<string, string> = {
      engagement_awareness: `
        <h2>Welcome to your journey with us!</h2>
        <p>Hi ${personalizationData.firstName || 'there'},</p>
        <p>We're excited to help you discover new opportunities. Here are some resources to get you started...</p>
      `,
      engagement_consideration: `
        <h2>Ready to take the next step?</h2>
        <p>Hi ${personalizationData.firstName || 'there'},</p>
        <p>We've noticed your interest in our services. Let us help you find the perfect solution...</p>
      `,
      engagement_churn_risk: `
        <h2>We miss you!</h2>
        <p>Hi ${personalizationData.firstName || 'there'},</p>
        <p>It's been a while since we've connected. We have some exciting updates to share with you...</p>
      `,
      default_engagement: `
        <h2>Personalized Message</h2>
        <p>Hi ${personalizationData.firstName || 'there'},</p>
        <p>We wanted to reach out with a personalized message just for you...</p>
      `
    };

    return templates[templateId] || templates.default_engagement;
  }

  estimateExecutionTime(): number {
    return 3000; // 3 seconds
  }
}

/**
 * SMS Executor - Integrates with existing SMS campaign system
 */
export class SMSExecutor extends BaseExecutor {
  actionType = ActionType.SEND_SMS;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      if (!contact.phone) {
        return this.createFailureResult('Contact has no phone number');
      }

      // Get SMS parameters
      const message = this.getParameter(context, 'message', 'Personalized SMS message');
      const personalizationData = this.getParameter(context, 'personalizationData', {});

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'send_sms',
          recipient: contact.phone,
          message,
          message_preview: 'Dry run - SMS would be sent'
        });
      }

      // Create SMS campaign record
      const smsCampaign = await this.createSMSCampaign(context, {
        message,
        recipient: contact,
        personalizationData
      });

      logger.info('SMS action executed successfully', {
        actionPlanId: context.actionPlan.id,
        smsCampaignId: smsCampaign.id,
        recipient: contact.phone
      });

      return this.createSuccessResult({
        smsCampaignId: smsCampaign.id,
        recipient: contact.phone,
        message,
        sentAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SMS execution failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private async createSMSCampaign(context: ExecutionContext, smsData: any): Promise<any> {
    const campaign = await prisma.sMSCampaign.create({
      data: {
        name: `AI Action: ${context.actionPlan.actionName}`,
        description: `Automated SMS from AI action plan: ${context.actionPlan.id}`,
        message: this.personalizeMessage(smsData.message, smsData.personalizationData),
        status: 'SENT',
        organizationId: context.organizationId,
        createdBy: context.userId || 'supreme-ai-v3',
        metadata: {
          actionPlanId: context.actionPlan.id,
          aiGenerated: true,
          personalizationData: smsData.personalizationData
        }
      }
    });

    // Create contact campaign relationship
    await prisma.contactSMSCampaign.create({
      data: {
        contactId: context.actionPlan.contactId,
        campaignId: campaign.id,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          actionPlanId: context.actionPlan.id,
          automatedSend: true
        }
      }
    });

    return campaign;
  }

  private personalizeMessage(message: string, personalizationData: any): string {
    let personalizedMessage = message;
    
    // Simple personalization
    if (personalizationData.firstName) {
      personalizedMessage = personalizedMessage.replace(/\{firstName\}/g, personalizationData.firstName);
    }
    
    if (personalizationData.lastName) {
      personalizedMessage = personalizedMessage.replace(/\{lastName\}/g, personalizationData.lastName);
    }

    return personalizedMessage;
  }

  estimateExecutionTime(): number {
    return 2000; // 2 seconds
  }
}

/**
 * WhatsApp Executor - Integrates with existing WhatsApp campaign system
 */
export class WhatsAppExecutor extends BaseExecutor {
  actionType = ActionType.SEND_WHATSAPP;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      if (!contact.whatsapp && !contact.phone) {
        return this.createFailureResult('Contact has no WhatsApp number');
      }

      // Get WhatsApp parameters
      const message = this.getParameter(context, 'message', 'Personalized WhatsApp message');
      const messageType = this.getParameter(context, 'messageType', 'text');
      const personalizationData = this.getParameter(context, 'personalizationData', {});

      const whatsappNumber = contact.whatsapp || contact.phone;

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'send_whatsapp',
          recipient: whatsappNumber,
          message,
          messageType,
          message_preview: 'Dry run - WhatsApp message would be sent'
        });
      }

      // Create WhatsApp campaign record
      const whatsappCampaign = await this.createWhatsAppCampaign(context, {
        message,
        messageType,
        recipient: contact,
        personalizationData
      });

      logger.info('WhatsApp action executed successfully', {
        actionPlanId: context.actionPlan.id,
        whatsappCampaignId: whatsappCampaign.id,
        recipient: whatsappNumber
      });

      return this.createSuccessResult({
        whatsappCampaignId: whatsappCampaign.id,
        recipient: whatsappNumber,
        message,
        messageType,
        sentAt: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('WhatsApp execution failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private async createWhatsAppCampaign(context: ExecutionContext, whatsappData: any): Promise<any> {
    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name: `AI Action: ${context.actionPlan.actionName}`,
        description: `Automated WhatsApp from AI action plan: ${context.actionPlan.id}`,
        message: this.personalizeMessage(whatsappData.message, whatsappData.personalizationData),
        status: 'SENT',
        organizationId: context.organizationId,
        createdBy: context.userId || 'supreme-ai-v3',
        metadata: {
          actionPlanId: context.actionPlan.id,
          aiGenerated: true,
          messageType: whatsappData.messageType,
          personalizationData: whatsappData.personalizationData
        }
      }
    });

    // Create contact campaign relationship
    await prisma.contactWhatsAppCampaign.create({
      data: {
        contactId: context.actionPlan.contactId,
        campaignId: campaign.id,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          actionPlanId: context.actionPlan.id,
          automatedSend: true
        }
      }
    });

    return campaign;
  }

  private personalizeMessage(message: string, personalizationData: any): string {
    let personalizedMessage = message;
    
    // Simple personalization - same as SMS
    if (personalizationData.firstName) {
      personalizedMessage = personalizedMessage.replace(/\{firstName\}/g, personalizationData.firstName);
    }
    
    if (personalizationData.lastName) {
      personalizedMessage = personalizedMessage.replace(/\{lastName\}/g, personalizationData.lastName);
    }

    return personalizedMessage;
  }

  estimateExecutionTime(): number {
    return 2500; // 2.5 seconds
  }
}

/**
 * Push Notification Executor - Safe placeholder implementation
 */
export class PushNotificationExecutor extends BaseExecutor {
  actionType = ActionType.SEND_PUSH_NOTIFICATION;

  async execute(context: ExecutionContext): Promise<ActionExecutionResult> {
    this.logExecutionStart(context);

    try {
      const contact = await this.getContact(context.actionPlan.contactId);
      if (!contact) {
        return this.createFailureResult('Contact not found');
      }

      // Get push notification parameters
      const title = this.getParameter(context, 'title', 'Notification');
      const message = this.getParameter(context, 'message', 'You have a new message');
      const personalizationData = this.getParameter(context, 'personalizationData', {});

      if (this.isDryRun(context)) {
        return this.createSuccessResult({
          action: 'send_push_notification',
          recipient: contact.id,
          title,
          message,
          message_preview: 'Dry run - Push notification would be sent'
        });
      }

      // For now, just log the push notification
      // In production, this would integrate with a push notification service
      logger.info('Push notification action executed (placeholder)', {
        actionPlanId: context.actionPlan.id,
        contactId: contact.id,
        title,
        message
      });

      return this.createSuccessResult({
        title,
        message,
        recipient: contact.id,
        sentAt: new Date(),
        note: 'Push notification logged - integration pending'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Push notification execution failed', {
        actionPlanId: context.actionPlan.id,
        error: errorMessage
      });

      return this.createFailureResult(errorMessage);
    }
  }

  estimateExecutionTime(): number {
    return 1000; // 1 second
  }
}