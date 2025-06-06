import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { triggerQueue, workflowQueue } from '@/lib/queue';
import { workflowEngine } from './execution-engine';

export interface TriggerEvent {
  type: string;
  contactId?: string;
  data: Record<string, any>;
  timestamp?: Date;
}

export class WorkflowTriggerManager {
  /**
   * Process a trigger event and start relevant workflows
   */
  async processTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      logger.info('Processing trigger event', { 
        type: event.type, 
        contactId: event.contactId 
      });

      // Store the event for audit and potential replay
      await this.storeEvent(event);

      // Find workflows that should be triggered by this event
      const workflows = await this.findTriggeredWorkflows(event);

      if (workflows.length === 0) {
        logger.info('No workflows found for trigger event', { type: event.type });
        return;
      }

      // Start workflow executions
      for (const workflow of workflows) {
        try {
          if (event.contactId) {
            await workflowEngine.startWorkflowExecution(
              workflow.id,
              event.contactId,
              event.data
            );
          } else {
            // If no specific contact, trigger for all eligible contacts
            await this.triggerForEligibleContacts(workflow, event);
          }
        } catch (error) {
          logger.error('Failed to start workflow execution', {
            workflowId: workflow.id,
            contactId: event.contactId,
            error,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process trigger event', { event, error });
      throw error;
    }
  }

  /**
   * Store event for audit trail
   */
  private async storeEvent(event: TriggerEvent): Promise<void> {
    await prisma.workflowEvent.create({
      data: {
        eventType: event.type,
        contactId: event.contactId || null,
        eventData: JSON.stringify(event.data),
        processed: false,
        createdAt: event.timestamp || new Date(),
      },
    });
  }

  /**
   * Find workflows that should be triggered by this event
   */
  private async findTriggeredWorkflows(event: TriggerEvent) {
    const activeWorkflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    });

    const triggeredWorkflows = [];

    for (const workflow of activeWorkflows) {
      const definition = JSON.parse(workflow.definition);
      const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');

      for (const triggerNode of triggerNodes) {
        if (this.doesEventMatchTrigger(event, triggerNode)) {
          triggeredWorkflows.push(workflow);
          break; // Only add workflow once even if multiple triggers match
        }
      }
    }

    return triggeredWorkflows;
  }

  /**
   * Check if an event matches a trigger node configuration
   */
  private doesEventMatchTrigger(event: TriggerEvent, triggerNode: any): boolean {
    const properties = triggerNode.data?.properties || {};
    const label = triggerNode.data?.label?.toLowerCase() || '';

    switch (event.type) {
      case 'contact_added_to_list':
        return label.includes('contact added to list') && 
               (!properties.listId || properties.listId === event.data.listId);

      case 'form_submission':
        return label.includes('form submission') && 
               (!properties.formId || properties.formId === event.data.formId);

      case 'email_opened':
        return label.includes('email opened');

      case 'email_clicked':
        return label.includes('email clicked');

      case 'contact_created':
        return label.includes('contact created') || label.includes('new contact');

      case 'purchase_completed':
        return label.includes('purchase') || label.includes('order');

      case 'abandoned_cart':
        return label.includes('abandoned cart') || label.includes('cart abandonment');

      case 'tag_added':
        return label.includes('tag added') && 
               (!properties.tagName || properties.tagName === event.data.tagName);

      default:
        return false;
    }
  }

  /**
   * Trigger workflows for all eligible contacts when no specific contact is provided
   */
  private async triggerForEligibleContacts(workflow: any, event: TriggerEvent): Promise<void> {
    // Get contacts based on workflow targeting criteria
    const contacts = await this.getEligibleContacts(workflow, event);

    for (const contact of contacts) {
      try {
        await workflowEngine.startWorkflowExecution(
          workflow.id,
          contact.id,
          event.data
        );
      } catch (error) {
        logger.error('Failed to start workflow for contact', {
          workflowId: workflow.id,
          contactId: contact.id,
          error,
        });
      }
    }
  }

  /**
   * Get contacts eligible for a workflow execution
   */
  private async getEligibleContacts(workflow: any, event: TriggerEvent) {
    // For now, return active contacts
    // In production, this would consider workflow targeting rules
    const contacts = await prisma.contact.findMany({
      where: { 
        status: 'ACTIVE',
        // Add more sophisticated targeting rules here
      },
      take: 100, // Limit to prevent overwhelming the system
    });

    return contacts;
  }

  /**
   * Specific trigger methods for common events
   */

  async onContactAddedToList(contactId: string, listId: string): Promise<void> {
    await this.processTriggerEvent({
      type: 'contact_added_to_list',
      contactId,
      data: { listId },
    });
  }

  async onFormSubmission(contactId: string, formId: string, formData: Record<string, any>): Promise<void> {
    await this.processTriggerEvent({
      type: 'form_submission',
      contactId,
      data: { formId, formData },
    });
  }

  async onEmailOpened(contactId: string, campaignId: string): Promise<void> {
    await this.processTriggerEvent({
      type: 'email_opened',
      contactId,
      data: { campaignId },
    });
  }

  async onEmailClicked(contactId: string, campaignId: string, linkUrl: string): Promise<void> {
    await this.processTriggerEvent({
      type: 'email_clicked',
      contactId,
      data: { campaignId, linkUrl },
    });
  }

  async onContactCreated(contactId: string): Promise<void> {
    await this.processTriggerEvent({
      type: 'contact_created',
      contactId,
      data: {},
    });
  }

  async onPurchaseCompleted(contactId: string, orderId: string, amount: number): Promise<void> {
    await this.processTriggerEvent({
      type: 'purchase_completed',
      contactId,
      data: { orderId, amount },
    });
  }

  async onTagAdded(contactId: string, tagName: string): Promise<void> {
    await this.processTriggerEvent({
      type: 'tag_added',
      contactId,
      data: { tagName },
    });
  }

  /**
   * Scheduled trigger for time-based workflows
   */
  async processScheduledTriggers(): Promise<void> {
    // This would be called by a cron job to process time-based triggers
    logger.info('Processing scheduled triggers');

    // Find workflows with time-based triggers
    const timeBasedWorkflows = await prisma.workflow.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const workflow of timeBasedWorkflows) {
      const definition = JSON.parse(workflow.definition);
      const triggerNodes = definition.nodes.filter((node: any) => 
        node.type === 'triggerNode' && 
        node.data?.label?.toLowerCase().includes('schedule')
      );

      if (triggerNodes.length > 0) {
        // Process scheduled triggers
        await this.processTriggerEvent({
          type: 'scheduled_trigger',
          data: { workflowId: workflow.id },
        });
      }
    }
  }
}

// Export singleton instance
export const triggerManager = new WorkflowTriggerManager();

/**
 * Queue processors for trigger events
 */

// Process trigger events from the queue
triggerQueue.process('trigger-event', async (job: any) => {
  const { eventType, eventData, contactId } = job.data;
  
  await triggerManager.processTriggerEvent({
    type: eventType,
    contactId,
    data: eventData,
  });
});

// Mark processed events
triggerQueue.on('completed', async (job: any) => {
  const { eventType, contactId } = job.data;
  
  // Mark the event as processed in the database
  await prisma.workflowEvent.updateMany({
    where: {
      eventType,
      contactId: contactId || null,
      processed: false,
    },
    data: { processed: true },
  });
});

/**
 * Helper functions to add trigger events to the queue
 */

export const queueTriggerEvent = async (event: TriggerEvent): Promise<void> => {
  await triggerQueue.add('trigger-event', {
    eventType: event.type,
    contactId: event.contactId,
    eventData: event.data,
  });
};

// Convenience functions for common triggers
export const triggerContactAddedToList = async (contactId: string, listId: string): Promise<void> => {
  await queueTriggerEvent({
    type: 'contact_added_to_list',
    contactId,
    data: { listId },
  });
};

export const triggerFormSubmission = async (
  contactId: string, 
  formId: string, 
  formData: Record<string, any>
): Promise<void> => {
  await queueTriggerEvent({
    type: 'form_submission',
    contactId,
    data: { formId, formData },
  });
};

export const triggerEmailEngagement = async (
  type: 'opened' | 'clicked',
  contactId: string,
  campaignId: string,
  linkUrl?: string
): Promise<void> => {
  await queueTriggerEvent({
    type: type === 'opened' ? 'email_opened' : 'email_clicked',
    contactId,
    data: { campaignId, linkUrl },
  });
}; 