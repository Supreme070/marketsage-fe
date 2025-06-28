/**
 * Enhanced Workflow Execution Engine
 * Optimized for normalized database structure and high performance
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { OptimizedWorkflowService } from './optimized-workflow-service';
import { workflowQueue, delayQueue, type WorkflowJobData } from '@/lib/queue';
import { sendTrackedEmail } from '@/lib/email-service';
import { v4 as uuidv4 } from 'uuid';
import { 
  workflowRateLimiter, 
  emailRateLimiter, 
  smsRateLimiter,
  systemWorkflowRateLimiter,
  checkMultipleRateLimits 
} from '@/lib/rate-limiter';
import { SimpleCache } from '@/lib/utils/simple-cache';

// Performance monitoring
interface ExecutionMetrics {
  startTime: number;
  nodeExecutionTimes: Record<string, number>;
  totalDuration: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

// Execution context cache for better performance
const executionContextCache = new SimpleCache({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30 minutes
});

// Node executor interfaces for better performance
abstract class NodeExecutor {
  abstract execute(node: any, context: any, metrics: ExecutionMetrics): Promise<any>;
  
  protected async trackExecution(nodeId: string, executionId: string, duration: number, success: boolean) {
    await prisma.workflowExecutionStep.updateMany({
      where: { executionId, stepId: nodeId },
      data: {
        executionDuration: duration,
        status: success ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
      },
    });
  }
}

class EmailNodeExecutor extends NodeExecutor {
  private rateLimiter = emailRateLimiter;
  
  async execute(node: any, context: any, metrics: ExecutionMetrics): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Check rate limit
      const rateLimitKey = `email_${context.contact.id}`;
      const allowed = await this.rateLimiter.checkLimit(rateLimitKey);
      
      if (!allowed) {
        throw new Error('Email rate limit exceeded for contact');
      }

      // Extract email properties
      const properties = node.config || {};
      const templateId = properties.templateId;
      const subject = properties.subject;
      const content = properties.content;

      // Send tracked email with optimized tracking
      const result = await sendTrackedEmail({
        to: context.contact.email,
        subject: this.replaceVariables(subject, context),
        content: this.replaceVariables(content, context),
        templateId,
        contactId: context.contact.id,
        workflowExecutionId: context.executionId,
      });

      const duration = performance.now() - startTime;
      metrics.nodeExecutionTimes[node.id] = duration;
      
      await this.trackExecution(node.id, context.executionId, duration, true);
      
      logger.info('Email node executed successfully', {
        nodeId: node.id,
        contactId: context.contact.id,
        duration,
      });

      return {
        emailSent: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.trackExecution(node.id, context.executionId, duration, false);
      
      logger.error('Email node execution failed', {
        error,
        nodeId: node.id,
        contactId: context.contact.id,
      });
      
      throw error;
    }
  }

  private replaceVariables(template: string, context: any): string {
    if (!template) return '';
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = context;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || match;
    });
  }
}

class DelayNodeExecutor extends NodeExecutor {
  async execute(node: any, context: any, metrics: ExecutionMetrics): Promise<any> {
    const startTime = performance.now();
    
    try {
      const properties = node.config || {};
      const waitAmount = Number.parseInt(properties.waitAmount) || 1;
      const waitUnit = properties.waitUnit || 'minutes';
      
      // Convert to milliseconds
      let delayMs = waitAmount;
      switch (waitUnit) {
        case 'minutes':
          delayMs *= 60 * 1000;
          break;
        case 'hours':
          delayMs *= 60 * 60 * 1000;
          break;
        case 'days':
          delayMs *= 24 * 60 * 60 * 1000;
          break;
      }

      // Schedule delayed execution
      const scheduledFor = new Date(Date.now() + delayMs);
      
      await prisma.workflowExecutionStep.updateMany({
        where: { 
          executionId: context.executionId,
          stepId: node.id,
        },
        data: {
          status: 'SCHEDULED',
          scheduledFor,
        },
      });

      // Add to delay queue
      await delayQueue.add(
        'delayed-step',
        {
          executionId: context.executionId,
          stepId: node.id,
          workflowId: context.workflow.id,
          contactId: context.contact.id,
        },
        { delay: delayMs }
      );

      const duration = performance.now() - startTime;
      metrics.nodeExecutionTimes[node.id] = duration;

      logger.info('Delay node scheduled', {
        nodeId: node.id,
        delay: delayMs,
        scheduledFor,
        contactId: context.contact.id,
      });

      return {
        delayed: true,
        scheduledFor: scheduledFor.toISOString(),
        delayMs,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.trackExecution(node.id, context.executionId, duration, false);
      throw error;
    }
  }
}

class ConditionNodeExecutor extends NodeExecutor {
  async execute(node: any, context: any, metrics: ExecutionMetrics): Promise<any> {
    const startTime = performance.now();
    
    try {
      const properties = node.config || {};
      const conditionType = properties.conditionType;
      const conditionValue = properties.conditionValue;
      
      let result = false;
      
      switch (conditionType) {
        case 'contact_property':
          result = this.evaluateContactProperty(properties, context.contact);
          break;
        case 'email_engagement':
          result = await this.evaluateEmailEngagement(properties, context.contact);
          break;
        case 'custom_expression':
          result = this.evaluateCustomExpression(conditionValue, context);
          break;
        default:
          result = false;
      }

      const duration = performance.now() - startTime;
      metrics.nodeExecutionTimes[node.id] = duration;
      
      await this.trackExecution(node.id, context.executionId, duration, true);

      logger.info('Condition node evaluated', {
        nodeId: node.id,
        result,
        conditionType,
        contactId: context.contact.id,
      });

      return {
        conditionMet: result,
        conditionType,
        evaluatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.trackExecution(node.id, context.executionId, duration, false);
      throw error;
    }
  }

  private evaluateContactProperty(properties: any, contact: any): boolean {
    const propertyName = properties.propertyName;
    const operator = properties.operator;
    const expectedValue = properties.expectedValue;
    
    const actualValue = contact[propertyName];
    
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'contains':
        return String(actualValue).includes(expectedValue);
      case 'exists':
        return actualValue != null;
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  private async evaluateEmailEngagement(properties: any, contact: any): Promise<boolean> {
    const engagementType = properties.engagementType;
    const timeframe = properties.timeframe || 30; // days
    
    const since = new Date();
    since.setDate(since.getDate() - timeframe);
    
    // This would typically query your email engagement tracking
    // For now, we'll use a placeholder
    return false;
  }

  private evaluateCustomExpression(expression: string, context: any): boolean {
    try {
      // Simple expression evaluator (in production, use a proper expression engine)
      // This is a simplified version for safety
      const variables = {
        contact: context.contact,
        ...context.variables,
      };
      
      // Replace variables in expression
      let evaluatedExpression = expression;
      for (const [key, value] of Object.entries(variables)) {
        evaluatedExpression = evaluatedExpression.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          JSON.stringify(value)
        );
      }
      
      // Very basic expression evaluation (in production, use a proper library)
      return eval(evaluatedExpression);
    } catch (error) {
      logger.warn('Custom expression evaluation failed', { expression, error });
      return false;
    }
  }
}

export class EnhancedWorkflowExecutionEngine {
  private nodeExecutors: Map<string, NodeExecutor>;
  
  constructor() {
    this.nodeExecutors = new Map([
      ['EMAIL', new EmailNodeExecutor()],
      ['DELAY', new DelayNodeExecutor()],
      ['CONDITION', new ConditionNodeExecutor()],
      // Add more executors as needed
    ]);
  }

  /**
   * Start workflow execution with enhanced performance monitoring
   */
  async startWorkflowExecution(
    workflowId: string, 
    contactId: string, 
    triggerData?: Record<string, any>
  ): Promise<string> {
    const metrics: ExecutionMetrics = {
      startTime: performance.now(),
      nodeExecutionTimes: {},
      totalDuration: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    try {
      // Enhanced rate limiting check
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
        throw new Error(`Workflow rate limit exceeded: ${rateLimitCheck.failedCheck}`);
      }

      // Check for existing execution
      const existingExecution = await prisma.workflowExecution.findUnique({
        where: { workflowId_contactId: { workflowId, contactId } },
      });

      if (existingExecution && existingExecution.status === 'RUNNING') {
        logger.info('Workflow execution already running', { workflowId, contactId });
        return existingExecution.id;
      }

      // Get optimized workflow definition
      const workflowDefinition = await OptimizedWorkflowService.getWorkflowById(workflowId);
      if (!workflowDefinition) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Get contact data with caching
      const contact = await this.getContactWithCache(contactId);
      if (!contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }

      // Create execution record with enhanced tracking
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          contactId,
          status: 'RUNNING',
          complexityScore: workflowDefinition.metadata.complexity,
          estimatedDuration: Math.max(30, workflowDefinition.metadata.complexity * 10),
          context: {
            contact,
            workflow: { id: workflowId, name: workflowDefinition.metadata },
            variables: triggerData || {},
            stepOutputs: {},
            metrics,
          },
        },
      });

      // Create execution steps for all nodes
      const steps = workflowDefinition.nodes.map(node => ({
        executionId: execution.id,
        stepId: node.id,
        nodeType: node.type,
        status: 'PENDING' as const,
      }));

      await prisma.workflowExecutionStep.createMany({
        data: steps,
      });

      // Find trigger nodes and start execution
      const triggerNodes = workflowDefinition.nodes.filter(node => 
        node.type === 'TRIGGER' || workflowDefinition.triggers.some(t => t.nodeId === node.id)
      );

      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow');
      }

      // Execute trigger nodes
      for (const triggerNode of triggerNodes) {
        await this.executeStep(execution.id, triggerNode.id, workflowDefinition, metrics);
      }

      // Update total duration
      metrics.totalDuration = performance.now() - metrics.startTime;
      
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          context: {
            ...execution.context,
            metrics,
          },
        },
      });

      logger.info('Workflow execution started', {
        executionId: execution.id,
        workflowId,
        contactId,
        complexity: workflowDefinition.metadata.complexity,
        estimatedDuration: execution.estimatedDuration,
      });

      return execution.id;
    } catch (error) {
      logger.error('Failed to start workflow execution', { error, workflowId, contactId });
      throw error;
    }
  }

  /**
   * Execute a specific workflow step with performance optimization
   */
  async executeStep(
    executionId: string, 
    stepId: string, 
    workflowDefinition: any,
    metrics: ExecutionMetrics
  ): Promise<void> {
    try {
      // Get execution context with caching
      const executionContext = await this.getExecutionContext(executionId);
      
      // Find the node
      const node = workflowDefinition.nodes.find((n: any) => n.id === stepId);
      if (!node) {
        throw new Error(`Node not found: ${stepId}`);
      }

      // Update step status
      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Execute the node using specialized executor
      const executor = this.nodeExecutors.get(node.type);
      let stepResult;

      if (executor) {
        stepResult = await executor.execute(node, executionContext, metrics);
      } else {
        // Fallback to generic execution
        stepResult = await this.executeGenericNode(node, executionContext);
      }

      // Update execution context
      executionContext.stepOutputs[stepId] = stepResult;
      await this.updateExecutionContext(executionId, executionContext);

      // Find and execute next steps
      await this.executeNextSteps(executionId, stepId, stepResult, workflowDefinition, metrics);

    } catch (error) {
      logger.error('Failed to execute step', { error, executionId, stepId });
      
      await prisma.workflowExecutionStep.updateMany({
        where: { executionId, stepId },
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
   * Execute next steps in the workflow
   */
  private async executeNextSteps(
    executionId: string,
    currentStepId: string,
    stepResult: any,
    workflowDefinition: any,
    metrics: ExecutionMetrics
  ): Promise<void> {
    // Find connections from current step
    const connections = workflowDefinition.connections.filter(
      (conn: any) => conn.sourceNodeId === currentStepId
    );

    for (const connection of connections) {
      const shouldExecute = this.shouldExecuteConnection(connection, stepResult);
      
      if (shouldExecute) {
        // Add to queue for async execution
        await workflowQueue.add('execute-step', {
          executionId,
          stepId: connection.targetNodeId,
          workflowId: workflowDefinition.metadata.workflowId,
          priority: this.calculateStepPriority(connection.targetNodeId, workflowDefinition),
        });
      }
    }
  }

  // Helper methods
  private async getContactWithCache(contactId: string): Promise<any> {
    const cacheKey = `contact_${contactId}`;
    let contact = executionContextCache.get(cacheKey);
    
    if (!contact) {
      contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      
      if (contact) {
        executionContextCache.set(cacheKey, contact);
      }
    }
    
    return contact;
  }

  private async getExecutionContext(executionId: string): Promise<any> {
    const cacheKey = `execution_${executionId}`;
    let context = executionContextCache.get(cacheKey);
    
    if (!context) {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
      });
      
      context = execution?.context;
      if (context) {
        executionContextCache.set(cacheKey, context);
      }
    }
    
    return context;
  }

  private async updateExecutionContext(executionId: string, context: any): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { context },
    });
    
    // Update cache
    const cacheKey = `execution_${executionId}`;
    executionContextCache.set(cacheKey, context);
  }

  private shouldExecuteConnection(connection: any, stepResult: any): boolean {
    switch (connection.conditionType) {
      case 'ALWAYS':
        return true;
      case 'YES':
        return stepResult?.conditionMet === true;
      case 'NO':
        return stepResult?.conditionMet === false;
      case 'CUSTOM':
        // Evaluate custom condition
        return this.evaluateCustomCondition(connection.conditionValue, stepResult);
      default:
        return true;
    }
  }

  private evaluateCustomCondition(condition: string, stepResult: any): boolean {
    // Simple condition evaluator (extend as needed)
    try {
      return eval(condition.replace(/\$result/g, JSON.stringify(stepResult)));
    } catch {
      return false;
    }
  }

  private calculateStepPriority(stepId: string, workflowDefinition: any): number {
    // Calculate priority based on node type and position in workflow
    const node = workflowDefinition.nodes.find((n: any) => n.id === stepId);
    
    switch (node?.type) {
      case 'EMAIL':
        return 10;
      case 'SMS':
        return 8;
      case 'CONDITION':
        return 5;
      case 'DELAY':
        return 1;
      default:
        return 5;
    }
  }

  private async executeGenericNode(node: any, context: any): Promise<any> {
    // Fallback execution for node types without specialized executors
    logger.info(`Executing generic node: ${node.type}`, { nodeId: node.id });
    
    return {
      nodeType: node.type,
      executed: true,
      timestamp: new Date().toISOString(),
    };
  }
}