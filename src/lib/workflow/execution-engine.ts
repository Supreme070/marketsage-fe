import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { workflowQueue, delayQueue, type WorkflowJobData } from '@/lib/queue';
import { sendTrackedEmail } from '@/lib/email-service';
// import { sendSMS } from '@/lib/sms-service'; // Temporarily disabled
import { v4 as uuidv4 } from 'uuid';
import { 
  workflowRateLimiter, 
  emailRateLimiter, 
  smsRateLimiter,
  systemWorkflowRateLimiter,
  checkMultipleRateLimits 
} from '@/lib/rate-limiter';

// Types
interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    description?: string;
    properties: Record<string, any>;
  };
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
}

interface ExecutionContext {
  contact: any;
  workflow: any;
  variables: Record<string, any>;
  stepOutputs: Record<string, any>;
}

export class WorkflowExecutionEngine {
  /**
   * Start a new workflow execution for a contact
   */
  async startWorkflowExecution(
    workflowId: string, 
    contactId: string, 
    triggerData?: Record<string, any>
  ): Promise<string> {
    try {
      // Check rate limits before starting workflow
      const rateLimitCheck = await checkMultipleRateLimits([
        { 
          limiter: workflowRateLimiter, 
          identifier: contactId, 
          name: 'user_workflow' 
        },
        { 
          limiter: systemWorkflowRateLimiter, 
          identifier: 'global', 
          name: 'system_workflow' 
        }
      ]);

      if (!rateLimitCheck.allowed) {
        const error = `Workflow rate limit exceeded: ${rateLimitCheck.failedCheck}`;
        logger.warn(error, { workflowId, contactId, rateLimitCheck });
        throw new Error(error);
      }

      // Check if execution already exists
      const existingExecution = await prisma.workflowExecution.findUnique({
        where: { workflowId_contactId: { workflowId, contactId } },
      });

      if (existingExecution && existingExecution.status === 'RUNNING') {
        logger.info(`Workflow execution already running`, { workflowId, contactId });
        return existingExecution.id;
      }

      // Get workflow and contact data
      const [workflow, contact] = await Promise.all([
        prisma.workflow.findUnique({ where: { id: workflowId } }),
        prisma.contact.findUnique({ where: { id: contactId } }),
      ]);

      if (!workflow || !contact) {
        throw new Error(`Workflow or contact not found: ${workflowId}, ${contactId}`);
      }

      if (workflow.status !== 'ACTIVE') {
        throw new Error(`Workflow is not active: ${workflowId}`);
      }

      // Parse workflow definition
      const definition: WorkflowDefinition = JSON.parse(workflow.definition);
      
      // Find trigger nodes
      const triggerNodes = definition.nodes.filter(node => node.type === 'triggerNode');
      if (triggerNodes.length === 0) {
        throw new Error(`No trigger nodes found in workflow: ${workflowId}`);
      }

      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          id: uuidv4(),
          workflowId,
          contactId,
          status: 'RUNNING',
          context: JSON.stringify({
            triggerData: triggerData || {},
            variables: {},
            stepOutputs: {},
            rateLimits: rateLimitCheck.results, // Store rate limit info
          }),
          startedAt: new Date(),
        },
      });

      // Start from the first trigger node
      const firstTrigger = triggerNodes[0];
      await this.executeStep(execution.id, firstTrigger.id);

      logger.info(`Started workflow execution`, { 
        executionId: execution.id, 
        workflowId, 
        contactId,
        remainingWorkflowLimits: rateLimitCheck.results
      });

      return execution.id;
    } catch (error) {
      logger.error('Failed to start workflow execution', { error, workflowId, contactId });
      throw error;
    }
  }

  /**
   * Execute a specific workflow step
   */
  async executeStep(executionId: string, stepId: string): Promise<void> {
    try {
      // Get execution data
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: { workflow: true, contact: true },
      });

      if (!execution || execution.status !== 'RUNNING') {
        logger.warn(`Execution not found or not running: ${executionId}`);
        return;
      }

      // Parse workflow definition
      const definition: WorkflowDefinition = JSON.parse(execution.workflow.definition);
      const node = definition.nodes.find(n => n.id === stepId);
      
      if (!node) {
        throw new Error(`Step not found: ${stepId}`);
      }

      // Create step execution record
      const stepExecution = await prisma.workflowExecutionStep.create({
        data: {
          id: uuidv4(),
          executionId,
          stepId,
          stepType: node.type,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Parse execution context
      const context: ExecutionContext = JSON.parse(execution.context);
      context.contact = execution.contact;
      context.workflow = execution.workflow;

      // Execute the step based on its type
      let stepResult: any = null;
      
      switch (node.type) {
        case 'triggerNode':
          stepResult = await this.executeTriggerNode(node, context);
          break;
        case 'actionNode':
          stepResult = await this.executeActionNode(node, context);
          break;
        case 'conditionNode':
          stepResult = await this.executeConditionNode(node, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update step execution
      await prisma.workflowExecutionStep.update({
        where: { id: stepExecution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          output: JSON.stringify(stepResult),
        },
      });

      // Store step output in context
      context.stepOutputs[stepId] = stepResult;

      // Update execution context
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          context: JSON.stringify(context),
          currentStepId: stepId,
          lastExecutedAt: new Date(),
        },
      });

      // Find and execute next steps
      await this.executeNextSteps(executionId, stepId, stepResult, definition);

    } catch (error) {
      logger.error('Failed to execute step', { error, executionId, stepId });
      
      // Mark step as failed
      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId, status: 'RUNNING' },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Execute trigger node (usually just passes through)
   */
  private async executeTriggerNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    logger.info(`Executing trigger node: ${node.id}`, { 
      trigger: node.data.label,
      contactId: context.contact.id 
    });

    return {
      triggered: true,
      triggerType: node.data.properties?.type || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute action node (email, SMS, wait, etc.)
   */
  private async executeActionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const action = node.data.label.toLowerCase();
    const properties = node.data.properties || {};

    logger.info(`Executing action node: ${node.id}`, { 
      action: node.data.label,
      contactId: context.contact.id 
    });

    if (action.includes('email')) {
      return await this.executeEmailAction(properties, context);
    } else if (action.includes('sms')) {
      return await this.executeSMSAction(properties, context);
    } else if (action.includes('wait')) {
      return await this.executeWaitAction(properties, context);
    } else if (action.includes('tag')) {
      return await this.executeTagAction(properties, context);
    }

    throw new Error(`Unknown action type: ${action}`);
  }

  /**
   * Execute condition node (branching logic)
   */
  private async executeConditionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    
    logger.info(`Executing condition node: ${node.id}`, { 
      condition: node.data.label,
      contactId: context.contact.id 
    });

    // Evaluate condition based on type
    let conditionResult = false;

    if (properties.conditionType === 'email') {
      conditionResult = await this.evaluateEmailCondition(properties, context);
    } else if (properties.conditionType === 'custom') {
      conditionResult = await this.evaluateCustomCondition(properties, context);
    } else if (properties.conditionType === 'contact_property') {
      conditionResult = await this.evaluateContactPropertyCondition(properties, context);
    }

    return {
      conditionMet: conditionResult,
      conditionType: properties.conditionType,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute email action with rate limiting
   */
  private async executeEmailAction(properties: any, context: ExecutionContext): Promise<any> {
    // Check email rate limit
    const rateLimitResult = await emailRateLimiter.check(context.contact.id);
    
    if (!rateLimitResult.allowed) {
      const error = `Email rate limit exceeded for contact ${context.contact.id}. ${rateLimitResult.error}`;
      logger.warn(error, { 
        contactId: context.contact.id,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime)
      });
      throw new Error(error);
    }

    const subject = this.replaceVariables(properties.subject || 'MarketSage Message', context);
    const templateName = properties.templateName || 'Default Template';

    // Create a mock campaign for tracking
    const mockCampaignId = `workflow-${context.workflow.id}-${Date.now()}`;

    logger.info('Sending workflow email', {
      contactId: context.contact.id,
      subject,
      templateName,
      emailsRemaining: rateLimitResult.remaining
    });

    const result = await sendTrackedEmail(
      context.contact,
      mockCampaignId,
      {
        subject,
        from: 'noreply@marketsage.com',
        html: this.generateEmailContent(templateName, context),
        text: this.generateEmailContent(templateName, context, true),
      }
    );

    return {
      sent: result.success,
      messageId: result.messageId,
      subject,
      templateName,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      },
      error: result.error?.message,
    };
  }

  /**
   * Execute SMS action with rate limiting
   */
  private async executeSMSAction(properties: any, context: ExecutionContext): Promise<any> {
    if (!context.contact.phone) {
      throw new Error('Contact has no phone number');
    }

    // Check SMS rate limit
    const rateLimitResult = await smsRateLimiter.check(context.contact.id);
    
    if (!rateLimitResult.allowed) {
      const error = `SMS rate limit exceeded for contact ${context.contact.id}. ${rateLimitResult.error}`;
      logger.warn(error, { 
        contactId: context.contact.id,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime)
      });
      throw new Error(error);
    }

    const message = this.replaceVariables(
      properties.message || 'Hello from MarketSage!', 
      context
    );

    logger.info('Sending workflow SMS', {
      contactId: context.contact.id,
      phone: context.contact.phone,
      smsRemaining: rateLimitResult.remaining
    });

    // Mock SMS sending for now
    const result = {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    return {
      sent: result.success,
      messageId: result.messageId,
      message,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      },
    };
  }

  /**
   * Execute wait action (schedule next step)
   */
  private async executeWaitAction(properties: any, context: ExecutionContext): Promise<any> {
    const waitAmount = properties.waitAmount || 1;
    const waitUnit = properties.waitUnit || 'days';
    
    let delayMs = 0;
    switch (waitUnit) {
      case 'minutes':
        delayMs = waitAmount * 60 * 1000;
        break;
      case 'hours':
        delayMs = waitAmount * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = waitAmount * 24 * 60 * 60 * 1000;
        break;
      default:
        delayMs = waitAmount * 60 * 1000; // default to minutes
    }

    return {
      waitAmount,
      waitUnit,
      delayMs,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    };
  }

  /**
   * Execute tag action
   */
  private async executeTagAction(properties: any, context: ExecutionContext): Promise<any> {
    const tagName = properties.tagName || properties.tag;
    
    if (!tagName) {
      throw new Error('No tag specified');
    }

    // For now, just log the tag action since customFields column has issues
    logger.info('Tag action executed', {
      contactId: context.contact.id,
      tagName: tagName
    });

    return {
      tagAdded: tagName,
      allTags: [tagName],
    };
  }

  /**
   * Find and execute next steps in the workflow
   */
  private async executeNextSteps(
    executionId: string,
    currentStepId: string,
    stepResult: any,
    definition: WorkflowDefinition
  ): Promise<void> {
    const outgoingEdges = definition.edges.filter(edge => edge.source === currentStepId);
    
    for (const edge of outgoingEdges) {
      let shouldExecute = true;

      // For condition nodes, check which path to take
      if (stepResult.conditionMet !== undefined) {
        const isYesPath = edge.sourceHandle === 'yes' || edge.sourceHandle === 'true';
        const isNoPath = edge.sourceHandle === 'no' || edge.sourceHandle === 'false';
        
        if (isYesPath && !stepResult.conditionMet) {
          shouldExecute = false;
        } else if (isNoPath && stepResult.conditionMet) {
          shouldExecute = false;
        }
      }

      if (shouldExecute) {
        // For wait actions, schedule the next step
        if (stepResult.delayMs) {
          await delayQueue.add(
            'delayed-step',
            { executionId, stepId: edge.target, delayMs: stepResult.delayMs },
            { delay: stepResult.delayMs }
          );
        } else {
          // Execute immediately
          await workflowQueue.add('execute-step', { 
            executionId, 
            stepId: edge.target 
          });
        }
      }
    }

    // Check if workflow is complete (no more steps to execute)
    if (outgoingEdges.length === 0) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      logger.info(`Workflow execution completed: ${executionId}`);
    }
  }

  /**
   * Replace variables in text with actual values
   */
  private replaceVariables(text: string, context: ExecutionContext): string {
    return text
      .replace(/\{\{contact\.firstName\}\}/g, context.contact.firstName || '')
      .replace(/\{\{contact\.lastName\}\}/g, context.contact.lastName || '')
      .replace(/\{\{contact\.email\}\}/g, context.contact.email || '')
      .replace(/\{\{contact\.company\}\}/g, context.contact.company || '')
      .replace(/\{\{workflow\.name\}\}/g, context.workflow.name || '');
  }

  /**
   * Generate email content (simplified)
   */
  private generateEmailContent(templateName: string, context: ExecutionContext, isText = false): string {
    const greeting = `Hello ${context.contact.firstName || 'there'}!`;
    const signature = 'Best regards,\nThe MarketSage Team';
    
    if (isText) {
      return `${greeting}\n\nThis is a message from your ${templateName} workflow.\n\n${signature}`;
    }
    
    return `
      <html>
        <body>
          <p>${greeting}</p>
          <p>This is a message from your <strong>${templateName}</strong> workflow.</p>
          <p>${signature.replace('\n', '<br>')}</p>
        </body>
      </html>
    `;
  }

  /**
   * Evaluate email-based conditions
   */
  private async evaluateEmailCondition(properties: any, context: ExecutionContext): Promise<boolean> {
    // Check email engagement from recent activities
    const recentActivity = await prisma.emailActivity.findFirst({
      where: {
        contactId: context.contact.id,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      orderBy: { timestamp: 'desc' },
    });

    if (properties.property === 'opened') {
      return recentActivity?.type === 'OPENED';
    } else if (properties.property === 'clicked') {
      return recentActivity?.type === 'CLICKED';
    }

    return false;
  }

  /**
   * Evaluate custom conditions
   */
  private async evaluateCustomCondition(properties: any, context: ExecutionContext): Promise<boolean> {
    const condition = properties.customCondition || '';
    
    // Simple condition evaluation (expand as needed)
    if (condition.includes('contact.events.includes')) {
      const eventType = condition.match(/'([^']+)'/)?.[1];
      if (eventType) {
        const hasEvent = await prisma.workflowEvent.findFirst({
          where: {
            contactId: context.contact.id,
            eventType,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
        });
        return !!hasEvent;
      }
    }

    return false;
  }

  /**
   * Evaluate contact property conditions
   */
  private async evaluateContactPropertyCondition(properties: any, context: ExecutionContext): Promise<boolean> {
    const property = properties.property;
    const operator = properties.operator || 'equals';
    const value = properties.value;

    const contactValue = (context.contact as any)[property];

    switch (operator) {
      case 'equals':
        return contactValue === value;
      case 'not_equals':
        return contactValue !== value;
      case 'contains':
        return String(contactValue).includes(value);
      case 'exists':
        return contactValue != null && contactValue !== '';
      default:
        return false;
    }
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowExecutionEngine(); 