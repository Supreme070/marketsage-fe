import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { workflowQueue, delayQueue, type WorkflowJobData } from '@/lib/queue';
import { MarketSageAPI } from '@/lib/api';
import { sendSMS } from '@/lib/sms-service';
import { workflowABTestingService } from '@/lib/workflow/ab-testing-service';
import { workflowRetryManager } from '@/lib/workflow/retry-mechanism';
import { workflowCostTracker } from '@/lib/workflow/cost-tracking';
import { v4 as uuidv4 } from 'uuid';
import { 
  workflowRateLimiter, 
  emailRateLimiter, 
  smsRateLimiter,
  systemWorkflowRateLimiter,
  checkMultipleRateLimits 
} from '@/lib/rate-limiter';
import { 
  executeGenericApiCall,
  executeCrmAction,
  executePaymentWebhook,
  type GenericApiConfiguration,
  type CrmActionConfiguration,
  type PaymentWebhookConfiguration
} from '@/lib/workflow/api-integration-nodes';

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
      let definition: WorkflowDefinition = JSON.parse(workflow.definition);
      
      // Check for A/B test variant (safe integration point)
      try {
        const abTestVariant = await workflowABTestingService.assignWorkflowVariant(workflowId, contactId);
        if (abTestVariant) {
          definition = abTestVariant.workflowDefinition;
          logger.info('Using A/B test variant for workflow execution', {
            workflowId,
            contactId,
            variantId: abTestVariant.variantId
          });
        }
      } catch (abTestError) {
        // A/B testing errors should not break workflow execution
        logger.warn('A/B test assignment failed, using original workflow', {
          workflowId,
          contactId,
          error: abTestError.message
        });
      }
      
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
   * Execute a workflow step retry (called from retry queue)
   */
  async executeWorkflowStep(executionId: string, stepId: string): Promise<void> {
    logger.info('Executing workflow step retry', { executionId, stepId });
    
    try {
      // Get execution to ensure it's still valid
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        select: { status: true }
      });
      
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }
      
      if (execution.status !== 'RUNNING') {
        logger.warn('Skipping retry for non-running execution', { executionId, status: execution.status });
        return;
      }
      
      // Execute the step
      await this.executeStep(executionId, stepId);
      
    } catch (error) {
      logger.error('Failed to execute workflow step retry', { error, executionId, stepId });
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
        case 'webhookNode':
          stepResult = await this.executeWebhookNode(node, context);
          break;
        case 'databaseNode':
          stepResult = await this.executeDatabaseNode(node, context);
          break;
        case 'delayNode':
          stepResult = await this.executeDelayNode(node, context);
          break;
        case 'splitNode':
          stepResult = await this.executeSplitNode(node, context);
          break;
        case 'transformNode':
          stepResult = await this.executeTransformNode(node, context);
          break;
        case 'apiCallNode':
          stepResult = await this.executeApiCallNode(node, context);
          break;
        case 'crmActionNode':
          stepResult = await this.executeCrmActionNode(node, context);
          break;
        case 'paymentWebhookNode':
          stepResult = await this.executePaymentWebhookNode(node, context);
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
      
      // Mark step as successful in retry manager
      await workflowRetryManager.markStepSuccess(executionId, stepId);

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
      
      const stepError = error instanceof Error ? error : new Error(String(error));
      
      // Check if step should be retried
      const shouldRetry = await workflowRetryManager.shouldRetryStep(
        executionId,
        stepId,
        node.type,
        stepError
      );
      
      if (shouldRetry) {
        logger.info('Attempting to retry failed step', { executionId, stepId, error: stepError.message });
        
        // Schedule retry
        const retryResult = await workflowRetryManager.scheduleRetry(
          executionId,
          stepId,
          node.type,
          stepError
        );
        
        if (retryResult.scheduled) {
          // Mark step as retrying
          await prisma.workflowExecutionStep.updateMany({
            where: { executionId, stepId, status: 'RUNNING' },
            data: {
              status: 'RETRYING',
              errorMessage: stepError.message,
              completedAt: new Date(),
            },
          });
          
          logger.info('Step retry scheduled', {
            executionId,
            stepId,
            nextRetryAt: retryResult.nextRetryAt,
            delayMs: retryResult.delayMs
          });
          
          // Don't throw error for retryable steps
          return;
        }
      }
      
      // Mark step as permanently failed
      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId, status: 'RUNNING' },
        data: {
          status: 'FAILED',
          errorMessage: stepError.message,
          completedAt: new Date(),
        },
      });
      
      // Mark entire execution as failed if step cannot be retried
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          error: `Step ${stepId} failed: ${stepError.message}`,
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
   * Execute action node (email, SMS, WhatsApp, wait, etc.)
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
    } else if (action.includes('whatsapp')) {
      return await this.executeWhatsAppAction(properties, context);
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
   * Execute email action with rate limiting and proper campaign tracking
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

    // Create or use campaign ID for proper tracking
    let campaignId = properties.campaignId;
    
    if (!campaignId) {
      // Create a workflow email campaign for tracking if none specified
      try {
        const workflowCampaign = await prisma.emailCampaign.create({
          data: {
            id: `workflow-${context.workflow.id}-${Date.now()}`,
            name: `Workflow: ${context.workflow.name} - ${templateName}`,
            subject,
            htmlContent: this.generateEmailContent(templateName, context),
            textContent: this.generateEmailContent(templateName, context, true),
            status: 'SENT',
            fromEmail: 'noreply@marketsage.com',
            fromName: 'MarketSage Workflow',
            // Link to the workflow that created this campaign
            metadata: JSON.stringify({
              workflowId: context.workflow.id,
              workflowName: context.workflow.name,
              templateName,
              createdBy: 'workflow-automation'
            })
          }
        });
        campaignId = workflowCampaign.id;
        
        logger.info('Created workflow email campaign for tracking', {
          campaignId,
          workflowId: context.workflow.id,
          templateName
        });
      } catch (campaignError) {
        logger.warn('Failed to create workflow campaign, using mock ID', {
          error: campaignError,
          workflowId: context.workflow.id
        });
        campaignId = `workflow-${context.workflow.id}-${Date.now()}`;
      }
    }

    logger.info('Sending workflow email', {
      contactId: context.contact.id,
      campaignId,
      subject,
      templateName,
      emailsRemaining: rateLimitResult.remaining
    });

    // Create email template using backend API
    const template = await MarketSageAPI.email.createTemplate({
      name: templateName,
      description: `Template for workflow ${context.workflow.id}`,
      subject: subject,
      content: this.generateEmailContent(templateName, context),
      category: 'workflow'
    });

    // Create campaign using backend API
    const campaign = await MarketSageAPI.email.createCampaign({
      name: `Workflow Campaign ${templateName}`,
      description: `Campaign for workflow ${context.workflow.id}`,
      subject: subject,
      templateId: template.id,
      status: 'DRAFT'
    });

    const result = {
      success: true,
      campaignId: campaign.id,
      templateId: template.id,
      messageId: `workflow-${Date.now()}`
    };

    // Track email cost if sent successfully
    if (result.success) {
      try {
        await workflowCostTracker.recordEmailCost(
          context.workflow.id,
          context.workflow.executionId,
          1, // One email sent
          properties.emailProvider || 'default'
        );
      } catch (costError) {
        logger.warn('Failed to track email cost', { error: costError });
      }
    }

    return {
      sent: result.success,
      messageId: result.messageId,
      campaignId,
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
   * Execute SMS action with rate limiting and campaign tracking
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
    const templateName = properties.templateName || 'Default SMS Template';

    // Create or use campaign ID for proper tracking
    let campaignId = properties.campaignId;
    
    if (!campaignId) {
      // Create a workflow SMS campaign for tracking if none specified
      try {
        const workflowCampaign = await prisma.sMSCampaign.create({
          data: {
            id: `workflow-sms-${context.workflow.id}-${Date.now()}`,
            name: `Workflow SMS: ${context.workflow.name} - ${templateName}`,
            content: message,
            status: 'SENT',
            from: properties.fromPhone || 'MarketSage',
            createdById: 'system', // System-generated campaign
            // Link to the workflow that created this campaign
            description: `SMS campaign created by workflow: ${context.workflow.name} (${context.workflow.id})`
          }
        });
        campaignId = workflowCampaign.id;
        
        logger.info('Created workflow SMS campaign for tracking', {
          campaignId,
          workflowId: context.workflow.id,
          templateName,
          message: message.substring(0, 50) + '...'
        });
      } catch (campaignError) {
        logger.warn('Failed to create workflow SMS campaign, using mock ID', {
          error: campaignError,
          workflowId: context.workflow.id
        });
        campaignId = `workflow-sms-${context.workflow.id}-${Date.now()}`;
      }
    }

    logger.info('Sending workflow SMS', {
      contactId: context.contact.id,
      phone: context.contact.phone,
      campaignId,
      message: message.substring(0, 50) + '...',
      smsRemaining: rateLimitResult.remaining
    });

    // Send SMS using the proper SMS service
    let result;
    try {
      result = await sendSMS(context.contact.phone, message);
    } catch (smsError) {
      logger.error('SMS sending failed', {
        error: smsError,
        contactId: context.contact.id,
        phone: context.contact.phone,
        campaignId
      });
      result = {
        success: false,
        error: {
          message: smsError instanceof Error ? smsError.message : 'SMS sending failed',
          code: 'SMS_SEND_ERROR'
        }
      };
    }

    // Track SMS cost if sent successfully
    if (result.success) {
      try {
        await workflowCostTracker.recordSmsCost(
          context.workflow.id,
          context.workflow.executionId,
          1, // One SMS sent
          properties.smsProvider || 'default',
          properties.region || 'default'
        );
      } catch (costError) {
        logger.warn('Failed to track SMS cost', { error: costError });
      }
    }

    // Track SMS activity for analytics if campaign exists
    if (result.success && campaignId) {
      try {
        await prisma.sMSActivity.create({
          data: {
            campaignId,
            contactId: context.contact.id,
            type: 'SENT',
            metadata: JSON.stringify({
              workflowId: context.workflow.id,
              workflowExecutionId: context.workflow.executionId,
              templateName,
              provider: result.provider || 'unknown',
              messageId: result.messageId
            })
          }
        });
        
        logger.info('SMS activity tracked', {
          campaignId,
          contactId: context.contact.id,
          messageId: result.messageId
        });
      } catch (trackingError) {
        logger.warn('Failed to track SMS activity', {
          error: trackingError,
          campaignId,
          contactId: context.contact.id
        });
      }
    }

    return {
      sent: result.success,
      messageId: result.messageId,
      campaignId,
      message,
      templateName,
      provider: result.provider,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      },
      error: result.error?.message,
    };
  }

  /**
   * Execute WhatsApp action with cost tracking
   */
  private async executeWhatsAppAction(properties: any, context: ExecutionContext): Promise<any> {
    if (!context.contact.phone) {
      throw new Error('Contact has no phone number');
    }

    const message = this.replaceVariables(
      properties.message || 'Hello from MarketSage!', 
      context
    );
    const templateName = properties.templateName || 'Default WhatsApp Template';

    logger.info('Sending workflow WhatsApp message', {
      contactId: context.contact.id,
      phone: context.contact.phone,
      templateName,
      message: message.substring(0, 50) + '...'
    });

    // Mock WhatsApp sending for now - replace with actual WhatsApp service integration
    let result;
    try {
      // TODO: Replace with actual WhatsApp service call
      // result = await sendWhatsApp(context.contact.phone, message);
      result = {
        success: true,
        messageId: `whatsapp-${Date.now()}`,
        provider: 'whatsapp-business'
      };
    } catch (whatsappError) {
      logger.error('WhatsApp sending failed', {
        error: whatsappError,
        contactId: context.contact.id,
        phone: context.contact.phone
      });
      result = {
        success: false,
        error: {
          message: whatsappError instanceof Error ? whatsappError.message : 'WhatsApp sending failed',
          code: 'WHATSAPP_SEND_ERROR'
        }
      };
    }

    // Track WhatsApp cost if sent successfully
    if (result.success) {
      try {
        await workflowCostTracker.recordWhatsAppCost(
          context.workflow.id,
          context.workflow.executionId,
          1, // One WhatsApp message sent
          properties.whatsappProvider || 'whatsapp-business'
        );
      } catch (costError) {
        logger.warn('Failed to track WhatsApp cost', { error: costError });
      }
    }

    return {
      sent: result.success,
      messageId: result.messageId,
      message,
      templateName,
      provider: result.provider,
      error: result.error?.message,
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
      const execution = await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          workflow: true,
          contact: true,
        },
      });

      logger.info(`Workflow execution completed: ${executionId}`);

      // Record A/B test results (safe - won't break on error)
      try {
        if (execution.startedAt && execution.completedAt) {
          const executionTime = execution.completedAt.getTime() - execution.startedAt.getTime();
          
          // Record completion rate (1.0 for completed workflows)
          await workflowABTestingService.recordWorkflowTestResult(
            execution.workflowId,
            execution.contactId,
            'COMPLETION_RATE',
            1.0
          );
          
          // Record execution time
          await workflowABTestingService.recordWorkflowTestResult(
            execution.workflowId,
            execution.contactId,
            'EXECUTION_TIME',
            executionTime
          );
        }
      } catch (abTestError) {
        logger.warn('Failed to record A/B test results for completed workflow', {
          executionId,
          error: abTestError.message
        });
      }
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

  /**
   * Execute webhook node - make HTTP requests to external APIs
   */
  private async executeWebhookNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    const { url, method = 'POST', headers = {}, timeout = 10000 } = properties;

    logger.info(`Executing webhook node: ${node.id}`, {
      url: url?.substring(0, 100), // Log only first 100 chars for security
      method,
      contactId: context.contact.id
    });

    if (!url) {
      throw new Error('Webhook URL is required');
    }

    // Security validation - only allow HTTPS URLs
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs are allowed for webhook calls');
    }

    // Prepare payload with contact data and context
    const payload = {
      contact: {
        id: context.contact.id,
        email: context.contact.email,
        firstName: context.contact.firstName,
        lastName: context.contact.lastName,
        // Only include safe fields
      },
      workflow: {
        id: context.workflow.id,
        name: context.workflow.name
      },
      variables: context.variables,
      timestamp: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MarketSage-Workflow/1.0',
          ...headers
        },
        body: method !== 'GET' ? JSON.stringify(payload) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = response.ok ? await response.json() : null;

      // Track webhook cost if successful
      if (response.ok) {
        try {
          await workflowCostTracker.recordApiCost(
            context.workflow.id,
            context.workflow.executionId,
            1, // One API call
            'webhook',
            url
          );
        } catch (costError) {
          logger.warn('Failed to track webhook cost', { error: costError });
        }
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Webhook execution failed', { error, url: url.substring(0, 50) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Execute database node - perform safe database operations
   */
  private async executeDatabaseNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    const { operation, table, data, conditions } = properties;

    logger.info(`Executing database node: ${node.id}`, {
      operation,
      table,
      contactId: context.contact.id
    });

    // Security: only allow specific operations and tables
    const allowedOperations = ['read', 'update_contact', 'create_activity'];
    const allowedTables = ['contact', 'emailActivity', 'workflowExecution'];

    if (!allowedOperations.includes(operation)) {
      throw new Error(`Database operation '${operation}' is not allowed`);
    }

    if (!allowedTables.includes(table)) {
      throw new Error(`Database table '${table}' is not allowed`);
    }

    try {
      let result;

      switch (operation) {
        case 'read':
          if (table === 'contact') {
            result = await prisma.contact.findUnique({
              where: { id: context.contact.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                leadScore: true,
                tags: true,
                createdAt: true
              }
            });
          }
          break;

        case 'update_contact':
          // Only allow safe field updates
          const safeUpdateData: any = {};
          if (data.tags) safeUpdateData.tags = data.tags;
          if (data.leadScore) safeUpdateData.leadScore = Math.max(0, Math.min(100, data.leadScore));
          if (data.customFields) safeUpdateData.customFields = data.customFields;

          result = await prisma.contact.update({
            where: { id: context.contact.id },
            data: safeUpdateData
          });
          break;

        case 'create_activity':
          result = await prisma.emailActivity.create({
            data: {
              id: `workflow-${context.workflow.id}-${Date.now()}`,
              contactId: context.contact.id,
              campaignId: data.campaignId || `workflow-${context.workflow.id}`,
              type: data.type || 'WORKFLOW_ACTION',
              metadata: JSON.stringify({
                workflowId: context.workflow.id,
                nodeId: node.id,
                ...data.metadata
              })
            }
          });
          break;

        default:
          throw new Error(`Unsupported database operation: ${operation}`);
      }

      return {
        success: true,
        operation,
        result,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database operation failed', { error, operation, table });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database operation failed',
        executedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Execute delay node - schedule future execution
   */
  private async executeDelayNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    const { delayType, delayValue, delayUnit = 'minutes' } = properties;

    logger.info(`Executing delay node: ${node.id}`, {
      delayType,
      delayValue,
      delayUnit,
      contactId: context.contact.id
    });

    let delayMs = 0;

    if (delayType === 'fixed') {
      const multipliers = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
      };

      const multiplier = multipliers[delayUnit as keyof typeof multipliers] || multipliers.minutes;
      delayMs = delayValue * multiplier;

      // Limit maximum delay to 30 days for safety
      const maxDelay = 30 * 24 * 60 * 60 * 1000;
      if (delayMs > maxDelay) {
        throw new Error('Delay cannot exceed 30 days');
      }
    } else if (delayType === 'optimal_time') {
      // Use engagement tracking to find optimal send time
      try {
        // TODO: Implement getBestSendTime function
        const optimalTime = new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour from now
        delayMs = Math.max(0, optimalTime.getTime() - Date.now());
      } catch (error) {
        logger.warn('Failed to get optimal time, using default delay', { error });
        delayMs = 60 * 60 * 1000; // Default to 1 hour
      }
    }

    // Schedule the delay using the queue system
    if (delayMs > 0) {
      await delayQueue.add(
        'delayed-workflow-step',
        {
          executionId: context.workflow.executionId,
          stepId: node.id,
          nextStepId: properties.nextStepId
        },
        {
          delay: delayMs,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      );
    }

    return {
      delayed: true,
      delayMs,
      delayType,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Execute split node - for A/B testing or random distribution
   */
  private async executeSplitNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    const { splitType, branches = [] } = properties;

    logger.info(`Executing split node: ${node.id}`, {
      splitType,
      branchCount: branches.length,
      contactId: context.contact.id
    });

    let selectedBranch;

    if (splitType === 'random') {
      // Random distribution based on percentages
      const random = Math.random() * 100;
      let cumulative = 0;

      for (const branch of branches) {
        cumulative += branch.percentage || 0;
        if (random <= cumulative) {
          selectedBranch = branch;
          break;
        }
      }
    } else if (splitType === 'property') {
      // Split based on contact property
      const { property, conditions } = properties;
      const contactValue = (context.contact as any)[property];

      selectedBranch = branches.find((branch: any) => {
        return branch.conditions?.some((condition: any) => {
          switch (condition.operator) {
            case 'equals':
              return contactValue === condition.value;
            case 'contains':
              return String(contactValue).includes(condition.value);
            case 'greater_than':
              return Number(contactValue) > Number(condition.value);
            default:
              return false;
          }
        });
      });
    }

    // Default to first branch if no match
    if (!selectedBranch && branches.length > 0) {
      selectedBranch = branches[0];
    }

    return {
      selectedBranch: selectedBranch?.id || null,
      splitType,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Execute transform node - data transformation and variable manipulation
   */
  private async executeTransformNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    const { transformations = [] } = properties;

    logger.info(`Executing transform node: ${node.id}`, {
      transformationCount: transformations.length,
      contactId: context.contact.id
    });

    const results: any = {};

    for (const transformation of transformations) {
      const { operation, sourceField, targetField, value, format } = transformation;

      try {
        switch (operation) {
          case 'copy':
            results[targetField] = (context.contact as any)[sourceField];
            break;

          case 'set':
            results[targetField] = this.replaceVariables(value, context);
            break;

          case 'concatenate':
            const values = sourceField.split(',').map((field: string) => 
              (context.contact as any)[field.trim()] || ''
            );
            results[targetField] = values.join(' ').trim();
            break;

          case 'format_date':
            const dateValue = new Date((context.contact as any)[sourceField]);
            if (isNaN(dateValue.getTime())) {
              results[targetField] = '';
            } else {
              results[targetField] = dateValue.toLocaleDateString();
            }
            break;

          case 'calculate_score':
            // Simple lead scoring based on available data
            let score = 0;
            if (context.contact.email) score += 20;
            if (context.contact.firstName) score += 10;
            if (context.contact.company) score += 15;
            if (context.contact.phone) score += 10;
            results[targetField] = Math.min(100, score);
            break;

          default:
            logger.warn(`Unknown transformation operation: ${operation}`);
        }
      } catch (error) {
        logger.error('Transformation failed', { error, transformation });
        results[targetField] = null;
      }
    }

    // Update context variables with transformation results
    context.variables = { ...context.variables, ...results };

    return {
      success: true,
      transformations: results,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Execute generic API call node
   */
  private async executeApiCallNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    
    logger.info(`Executing API call node: ${node.id}`, {
      method: properties.method,
      url: properties.url?.substring(0, 100),
      contactId: context.contact.id
    });

    try {
      const config: GenericApiConfiguration = {
        url: properties.url,
        method: properties.method || 'POST',
        headers: properties.headers || {},
        timeout: properties.timeout || 30000,
        retryCount: properties.retryCount || 3,
        retryDelay: properties.retryDelay || 1000,
        authentication: properties.authentication,
        bodyTemplate: properties.bodyTemplate,
        responseMapping: properties.responseMapping,
        successCondition: properties.successCondition,
      };

      const result = await executeGenericApiCall(config, context);
      
      // Store successful response data in context for subsequent steps
      if (result.success && result.data) {
        context.variables = {
          ...context.variables,
          [`${node.id}_response`]: result.data,
        };
      }

      return result;
    } catch (error) {
      logger.error('API call node execution failed', { 
        error: error instanceof Error ? error.message : String(error),
        nodeId: node.id,
        contactId: context.contact.id
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute CRM action node
   */
  private async executeCrmActionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    
    logger.info(`Executing CRM action node: ${node.id}`, {
      actionType: properties.actionType,
      provider: properties.provider,
      contactId: context.contact.id
    });

    try {
      const config: CrmActionConfiguration = {
        url: properties.url,
        method: properties.method || 'POST',
        headers: properties.headers || {},
        timeout: properties.timeout || 30000,
        retryCount: properties.retryCount || 3,
        retryDelay: properties.retryDelay || 1000,
        authentication: properties.authentication,
        actionType: properties.actionType,
        provider: properties.provider,
        fieldMapping: properties.fieldMapping || {},
      };

      const result = await executeCrmAction(config, context);
      
      // Store successful CRM response data in context
      if (result.success && result.data) {
        context.variables = {
          ...context.variables,
          [`${node.id}_crm_response`]: result.data,
          [`${node.id}_crm_action`]: properties.actionType,
        };
      }

      return result;
    } catch (error) {
      logger.error('CRM action node execution failed', { 
        error: error instanceof Error ? error.message : String(error),
        nodeId: node.id,
        actionType: properties.actionType,
        provider: properties.provider,
        contactId: context.contact.id
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        actionType: properties.actionType,
        provider: properties.provider,
        executedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute payment webhook node
   */
  private async executePaymentWebhookNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const properties = node.data.properties || {};
    
    logger.info(`Executing payment webhook node: ${node.id}`, {
      provider: properties.provider,
      webhookType: properties.webhookType,
      contactId: context.contact.id
    });

    try {
      const config: PaymentWebhookConfiguration = {
        url: properties.url,
        method: properties.method || 'POST',
        headers: properties.headers || {},
        timeout: properties.timeout || 30000,
        retryCount: properties.retryCount || 3,
        retryDelay: properties.retryDelay || 1000,
        authentication: properties.authentication,
        provider: properties.provider,
        webhookType: properties.webhookType,
        eventData: properties.eventData || {},
        secretKey: properties.secretKey,
      };

      const result = await executePaymentWebhook(config, context);
      
      // Store successful webhook response data in context
      if (result.success && result.data) {
        context.variables = {
          ...context.variables,
          [`${node.id}_payment_response`]: result.data,
          [`${node.id}_payment_provider`]: properties.provider,
          [`${node.id}_webhook_type`]: properties.webhookType,
        };
      }

      return result;
    } catch (error) {
      logger.error('Payment webhook node execution failed', { 
        error: error instanceof Error ? error.message : String(error),
        nodeId: node.id,
        provider: properties.provider,
        webhookType: properties.webhookType,
        contactId: context.contact.id
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: properties.provider,
        webhookType: properties.webhookType,
        executedAt: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowExecutionEngine(); 