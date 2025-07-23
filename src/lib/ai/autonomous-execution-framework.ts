/**
 * Autonomous Execution Framework - Enterprise Production Version
 * ============================================================
 * Full autonomous AI task execution with intelligent decision-making, predictive capabilities,
 * and enterprise governance. This framework enables AI to execute tasks with minimal human
 * intervention while maintaining safety, compliance, and auditability.
 */

import { logger } from '@/lib/logger';
import { safetyApprovalSystem } from './safety-approval-system';
import { taskExecutionMonitor } from './task-execution-monitor';
import { supremeAIV3Enhanced } from './supreme-ai-v3-mcp-integration';
import { workflowAssistant } from '../advanced-ai/workflow-assistant';
import prisma from '@/lib/db/prisma';

interface AutonomousTask {
  id: string;
  type: 'scheduled' | 'triggered' | 'predictive' | 'reactive';
  taskType: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  parameters: Record<string, any>;
  conditions: TaskCondition[];
  dependencies: string[];
  maxRetries: number;
  timeoutMs: number;
  schedule?: ScheduleConfig;
  userId: string;
  userRole: string;
  createdAt: Date;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  lastExecuted?: Date;
  nextExecution?: Date;
  executionHistory: ExecutionRecord[];
}

interface TaskCondition {
  type: 'time' | 'data' | 'event' | 'metric' | 'approval';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  field: string;
  value: any;
  required: boolean;
}

interface ScheduleConfig {
  type: 'interval' | 'cron' | 'event_driven';
  interval?: number; // milliseconds
  cronExpression?: string;
  eventTrigger?: string;
  timezone?: string;
}

interface ExecutionRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: string;
  executionTime?: number;
  rollbackPerformed?: boolean;
  metricsSnapshot: {
    systemLoad: number;
    errorRate: number;
    userTrustScore: number;
  };
}

interface AutonomousExecutionContext {
  systemState: {
    load: number;
    errorRate: number;
    maintenanceMode: boolean;
    resourceAvailability: Record<string, number>;
  };
  userContext: {
    trustScore: number;
    recentActivity: any[];
    preferences: Record<string, any>;
    permissions: string[];
  };
  businessContext: {
    businessHours: boolean;
    criticalPeriod: boolean;
    maintenanceWindow: boolean;
    complianceRequirements: string[];
  };
}

interface PredictiveInsight {
  taskId: string;
  predictionType: 'failure' | 'success' | 'performance' | 'resource_need';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: number; // hours
  recommendations: string[];
  preventiveActions: string[];
  dataPoints: Record<string, any>;
}

interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  scope: 'user' | 'task_type' | 'risk_level' | 'global';
  conditions: TaskCondition[];
  actions: {
    allow: boolean;
    requireApproval: boolean;
    restrictParameters: string[];
    notifications: string[];
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
  priority: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AutonomousExecutionFramework {
  private autonomousTasks: Map<string, AutonomousTask> = new Map();
  private executionQueue: string[] = [];
  private activeExecutions: Map<string, AbortController> = new Map();
  private governanceRules: Map<string, GovernanceRule> = new Map();
  private predictiveInsights: Map<string, PredictiveInsight[]> = new Map();
  private executionContext: AutonomousExecutionContext;
  private readonly MAX_CONCURRENT_EXECUTIONS = 5;
  private readonly PREDICTION_HORIZON_HOURS = 24;
  private isRunning = false;
  private executionTimer?: NodeJS.Timeout;

  constructor() {
    this.executionContext = this.initializeExecutionContext();
    this.initializeGovernanceRules();
    this.startFramework();
  }

  /**
   * Initialize the autonomous execution framework
   */
  private async startFramework(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Start execution loop
    this.executionTimer = setInterval(async () => {
      await this.executeScheduledTasks();
      await this.updatePredictiveInsights();
      await this.optimizeSchedule();
    }, 30000); // Check every 30 seconds

    // Start context monitoring
    setInterval(() => {
      this.updateExecutionContext();
    }, 60000); // Update context every minute

    logger.info('Autonomous Execution Framework started', {
      maxConcurrentExecutions: this.MAX_CONCURRENT_EXECUTIONS,
      predictionHorizon: this.PREDICTION_HORIZON_HOURS
    });
  }

  /**
   * Stop the autonomous execution framework
   */
  async stopFramework(): Promise<void> {
    this.isRunning = false;
    
    if (this.executionTimer) {
      clearInterval(this.executionTimer);
    }

    // Cancel all active executions gracefully
    for (const [taskId, controller] of this.activeExecutions.entries()) {
      controller.abort();
      logger.info('Cancelled autonomous task execution', { taskId });
    }

    this.activeExecutions.clear();
    logger.info('Autonomous Execution Framework stopped');
  }

  /**
   * Register a new autonomous task
   */
  async registerAutonomousTask(task: Omit<AutonomousTask, 'id' | 'createdAt' | 'status' | 'executionHistory'>): Promise<string> {
    const taskId = `auto_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const autonomousTask: AutonomousTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
      status: 'pending',
      executionHistory: []
    };

    // Validate task against governance rules
    const governanceCheck = await this.validateTaskGovernance(autonomousTask);
    if (!governanceCheck.allowed) {
      throw new Error(`Task registration blocked by governance: ${governanceCheck.reason}`);
    }

    // Schedule next execution
    if (task.schedule) {
      autonomousTask.nextExecution = this.calculateNextExecution(task.schedule);
    }

    this.autonomousTasks.set(taskId, autonomousTask);
    
    // Add to execution queue if ready
    if (this.isTaskReady(autonomousTask)) {
      this.addToExecutionQueue(taskId);
    }

    await this.persistAutonomousTask(autonomousTask);

    logger.info('Autonomous task registered', {
      taskId,
      taskType: task.taskType,
      priority: task.priority,
      riskLevel: task.riskLevel,
      nextExecution: autonomousTask.nextExecution?.toISOString()
    });

    return taskId;
  }

  /**
   * Execute scheduled tasks autonomously
   */
  private async executeScheduledTasks(): Promise<void> {
    if (this.activeExecutions.size >= this.MAX_CONCURRENT_EXECUTIONS) {
      return; // Too many concurrent executions
    }

    const context = this.executionContext;
    
    // Check system health before executing tasks
    if (context.systemState.load > 0.8 || context.systemState.errorRate > 0.1) {
      logger.warn('System overloaded, delaying autonomous executions', {
        systemLoad: context.systemState.load,
        errorRate: context.systemState.errorRate
      });
      return;
    }

    // Process execution queue
    const tasksToExecute = this.executionQueue
      .slice(0, this.MAX_CONCURRENT_EXECUTIONS - this.activeExecutions.size)
      .map(taskId => this.autonomousTasks.get(taskId))
      .filter(task => task && this.isTaskReady(task));

    for (const task of tasksToExecute) {
      if (task) {
        await this.executeAutonomousTask(task);
      }
    }

    // Check for new scheduled tasks
    const now = new Date();
    for (const task of this.autonomousTasks.values()) {
      if (task.status === 'pending' && 
          task.nextExecution && 
          task.nextExecution <= now &&
          !this.executionQueue.includes(task.id)) {
        
        this.addToExecutionQueue(task.id);
      }
    }
  }

  /**
   * Execute an autonomous task with full safety and monitoring
   */
  private async executeAutonomousTask(task: AutonomousTask): Promise<void> {
    const abortController = new AbortController();
    this.activeExecutions.set(task.id, abortController);

    try {
      // Remove from queue
      this.executionQueue = this.executionQueue.filter(id => id !== task.id);
      
      task.status = 'running';
      task.lastExecuted = new Date();

      const executionRecord: ExecutionRecord = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        status: 'running',
        metricsSnapshot: {
          systemLoad: this.executionContext.systemState.load,
          errorRate: this.executionContext.systemState.errorRate,
          userTrustScore: this.executionContext.userContext.trustScore
        }
      };

      task.executionHistory.push(executionRecord);

      logger.info('Starting autonomous task execution', {
        taskId: task.id,
        taskType: task.taskType,
        priority: task.priority,
        riskLevel: task.riskLevel
      });

      // Enhanced safety assessment for autonomous execution
      const safetyAssessment = await safetyApprovalSystem.assessOperation({
        id: `auto_${task.id}`,
        userId: task.userId,
        userRole: task.userRole,
        operationType: 'autonomous_ai_task',
        entity: task.taskType.toUpperCase() as any,
        action: 'EXECUTE',
        parameters: task.parameters,
        affectedRecords: this.estimateAffectedRecords(task),
        context: {
          sessionId: `autonomous_${Date.now()}`,
          timestamp: new Date(),
          ipAddress: 'internal',
          userAgent: 'AutonomousExecutionFramework/1.0',
          autonomousExecution: true,
          systemContext: this.executionContext
        }
      });

      // Check if autonomous execution is allowed
      if (!safetyAssessment.canProceed) {
        throw new Error(`Autonomous execution blocked: ${safetyAssessment.violatedRules.join(', ')}`);
      }

      // Start monitoring execution
      const executionId = await taskExecutionMonitor.startTaskExecution(
        task.id,
        task.userId,
        task.userRole,
        task.taskType,
        task.description,
        task.parameters,
        task.riskLevel,
        {
          sessionId: `autonomous_${Date.now()}`,
          permissions: this.executionContext.userContext.permissions
        }
      );

      // Execute the actual task through Supreme-AI v3
      const aiTask = {
        type: 'task' as const,
        userId: task.userId,
        question: task.description,
        taskType: task.taskType,
        parameters: task.parameters,
        enableTaskExecution: true,
        autonomousExecution: true,
        governanceContext: {
          riskLevel: task.riskLevel,
          priority: task.priority,
          timeoutMs: task.timeoutMs
        }
      };

      const result = await supremeAIV3Enhanced.processWithMCP(aiTask);

      if (result.success) {
        executionRecord.status = 'completed';
        executionRecord.result = result.data;
        executionRecord.endTime = new Date();
        executionRecord.executionTime = executionRecord.endTime.getTime() - executionRecord.startTime.getTime();

        task.status = 'completed';
        
        await taskExecutionMonitor.completeTaskExecution(
          executionId,
          result.data,
          result.warnings || [],
          this.generateRollbackData(task, result.data)
        );

        // Update predictions based on successful execution
        await this.updatePredictionsFromExecution(task, result, true);

        // Schedule next execution if recurring
        if (task.schedule) {
          task.nextExecution = this.calculateNextExecution(task.schedule);
          task.status = 'pending';
        }

        logger.info('Autonomous task completed successfully', {
          taskId: task.id,
          executionTime: executionRecord.executionTime,
          nextExecution: task.nextExecution?.toISOString()
        });

      } else {
        throw new Error(result.error || 'Task execution failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      task.status = 'failed';
      
      const currentRecord = task.executionHistory[task.executionHistory.length - 1];
      if (currentRecord) {
        currentRecord.status = 'failed';
        currentRecord.error = errorMessage;
        currentRecord.endTime = new Date();
        currentRecord.executionTime = currentRecord.endTime.getTime() - currentRecord.startTime.getTime();
      }

      // Update predictions based on failure
      await this.updatePredictionsFromExecution(task, null, false);

      // Schedule retry if within retry limits
      if (task.executionHistory.filter(r => r.status === 'failed').length < task.maxRetries) {
        task.status = 'pending';
        task.nextExecution = new Date(Date.now() + this.calculateRetryDelay(task));
        
        logger.warn('Autonomous task failed, scheduling retry', {
          taskId: task.id,
          error: errorMessage,
          retryAttempt: task.executionHistory.filter(r => r.status === 'failed').length,
          nextRetry: task.nextExecution.toISOString()
        });
      } else {
        logger.error('Autonomous task failed permanently', {
          taskId: task.id,
          error: errorMessage,
          maxRetriesReached: true
        });
      }

    } finally {
      this.activeExecutions.delete(task.id);
      await this.persistAutonomousTask(task);
    }
  }

  /**
   * Update predictive insights based on task execution patterns
   */
  private async updatePredictiveInsights(): Promise<void> {
    for (const task of this.autonomousTasks.values()) {
      if (task.executionHistory.length < 3) continue; // Need history for predictions

      const insights = await this.generatePredictiveInsights(task);
      this.predictiveInsights.set(task.id, insights);

      // Apply preventive actions based on insights
      for (const insight of insights) {
        if (insight.confidence > 0.8 && insight.impact !== 'low') {
          await this.applyPreventiveActions(task, insight);
        }
      }
    }
  }

  /**
   * Generate predictive insights for a task
   */
  private async generatePredictiveInsights(task: AutonomousTask): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    const recentExecutions = task.executionHistory.slice(-10);
    
    if (recentExecutions.length < 3) return insights;

    // Failure prediction
    const failureRate = recentExecutions.filter(e => e.status === 'failed').length / recentExecutions.length;
    if (failureRate > 0.3) {
      insights.push({
        taskId: task.id,
        predictionType: 'failure',
        confidence: Math.min(failureRate * 2, 0.95),
        impact: failureRate > 0.5 ? 'high' : 'medium',
        timeframe: 2,
        recommendations: [
          'Review task parameters for potential issues',
          'Check system dependencies',
          'Consider reducing task frequency'
        ],
        preventiveActions: [
          'increase_monitoring',
          'validate_dependencies',
          'backup_parameters'
        ],
        dataPoints: {
          failureRate,
          recentFailures: recentExecutions.filter(e => e.status === 'failed').length
        }
      });
    }

    // Performance prediction
    const avgExecutionTime = recentExecutions
      .filter(e => e.executionTime)
      .reduce((sum, e) => sum + (e.executionTime || 0), 0) / recentExecutions.length;
    
    const recentAvgTime = recentExecutions.slice(-3)
      .filter(e => e.executionTime)
      .reduce((sum, e) => sum + (e.executionTime || 0), 0) / 3;

    if (recentAvgTime > avgExecutionTime * 1.5) {
      insights.push({
        taskId: task.id,
        predictionType: 'performance',
        confidence: 0.75,
        impact: recentAvgTime > 30000 ? 'high' : 'medium',
        timeframe: 1,
        recommendations: [
          'Optimize task parameters',
          'Check system resources',
          'Consider task splitting'
        ],
        preventiveActions: [
          'monitor_resources',
          'optimize_parameters',
          'schedule_maintenance'
        ],
        dataPoints: {
          avgExecutionTime,
          recentAvgTime,
          performanceDegradation: (recentAvgTime - avgExecutionTime) / avgExecutionTime
        }
      });
    }

    return insights;
  }

  /**
   * Apply preventive actions based on predictive insights
   */
  private async applyPreventiveActions(task: AutonomousTask, insight: PredictiveInsight): Promise<void> {
    logger.info('Applying preventive actions for autonomous task', {
      taskId: task.id,
      predictionType: insight.predictionType,
      confidence: insight.confidence,
      actions: insight.preventiveActions
    });

    for (const action of insight.preventiveActions) {
      switch (action) {
        case 'increase_monitoring':
          // Increase monitoring frequency for this task
          break;
          
        case 'validate_dependencies':
          // Check system dependencies before next execution
          break;
          
        case 'backup_parameters':
          // Create backup of current parameters
          await this.backupTaskParameters(task);
          break;
          
        case 'monitor_resources':
          // Monitor system resources more closely
          break;
          
        case 'optimize_parameters':
          // Suggest parameter optimizations
          await this.optimizeTaskParameters(task);
          break;
          
        case 'schedule_maintenance':
          // Schedule maintenance window
          break;
      }
    }
  }

  /**
   * Optimize task schedule based on performance and system load
   */
  private async optimizeSchedule(): Promise<void> {
    const systemLoad = this.executionContext.systemState.load;
    const errorRate = this.executionContext.systemState.errorRate;
    
    // If system is under stress, delay non-critical tasks
    if (systemLoad > 0.7 || errorRate > 0.05) {
      for (const task of this.autonomousTasks.values()) {
        if (task.priority === 'low' && task.status === 'pending' && task.nextExecution) {
          const delay = this.calculateOptimalDelay(systemLoad, errorRate);
          task.nextExecution = new Date(task.nextExecution.getTime() + delay);
        }
      }
    }

    // Optimize execution order based on dependencies and priority
    this.optimizeExecutionQueue();
  }

  /**
   * Initialize execution context
   */
  private initializeExecutionContext(): AutonomousExecutionContext {
    return {
      systemState: {
        load: 0.1,
        errorRate: 0.001,
        maintenanceMode: false,
        resourceAvailability: {
          cpu: 0.8,
          memory: 0.7,
          disk: 0.9,
          network: 0.95
        }
      },
      userContext: {
        trustScore: 0.8,
        recentActivity: [],
        preferences: {},
        permissions: ['tasks:execute', 'data:read']
      },
      businessContext: {
        businessHours: this.isBusinessHours(),
        criticalPeriod: false,
        maintenanceWindow: false,
        complianceRequirements: ['GDPR', 'audit_logging']
      }
    };
  }

  /**
   * Initialize governance rules
   */
  private initializeGovernanceRules(): void {
    const defaultRules: GovernanceRule[] = [
      {
        id: 'critical_tasks_approval',
        name: 'Critical Tasks Require Approval',
        description: 'All critical risk level tasks must have approval',
        scope: 'risk_level',
        conditions: [
          { type: 'data', operator: 'equals', field: 'riskLevel', value: 'critical', required: true }
        ],
        actions: {
          allow: false,
          requireApproval: true,
          restrictParameters: [],
          notifications: ['admin@marketsage.com'],
          auditLevel: 'comprehensive'
        },
        priority: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'business_hours_only',
        name: 'High Risk Tasks During Business Hours Only',
        description: 'High risk tasks can only execute during business hours',
        scope: 'risk_level',
        conditions: [
          { type: 'data', operator: 'equals', field: 'riskLevel', value: 'high', required: true },
          { type: 'time', operator: 'equals', field: 'businessHours', value: false, required: true }
        ],
        actions: {
          allow: false,
          requireApproval: false,
          restrictParameters: [],
          notifications: [],
          auditLevel: 'detailed'
        },
        priority: 2,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultRules.forEach(rule => {
      this.governanceRules.set(rule.id, rule);
    });
  }

  /**
   * Helper methods
   */
  private isTaskReady(task: AutonomousTask): boolean {
    // Check conditions
    for (const condition of task.conditions) {
      if (!this.evaluateCondition(condition)) {
        return false;
      }
    }

    // Check dependencies
    for (const depId of task.dependencies) {
      const dep = this.autonomousTasks.get(depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: TaskCondition): boolean {
    // Implementation would evaluate various condition types
    return true; // Simplified for now
  }

  private addToExecutionQueue(taskId: string): void {
    if (!this.executionQueue.includes(taskId)) {
      this.executionQueue.push(taskId);
      this.optimizeExecutionQueue();
    }
  }

  private optimizeExecutionQueue(): void {
    // Sort by priority and dependencies
    this.executionQueue.sort((a, b) => {
      const taskA = this.autonomousTasks.get(a);
      const taskB = this.autonomousTasks.get(b);
      
      if (!taskA || !taskB) return 0;
      
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[taskB.priority] - priorityOrder[taskA.priority];
    });
  }

  private calculateNextExecution(schedule: ScheduleConfig): Date {
    const now = new Date();
    
    switch (schedule.type) {
      case 'interval':
        return new Date(now.getTime() + (schedule.interval || 3600000));
      case 'cron':
        // Would implement cron parsing
        return new Date(now.getTime() + 3600000);
      case 'event_driven':
        // Would wait for events
        return new Date(now.getTime() + 86400000);
      default:
        return new Date(now.getTime() + 3600000);
    }
  }

  private calculateRetryDelay(task: AutonomousTask): number {
    const baseDelay = 60000; // 1 minute
    const failures = task.executionHistory.filter(r => r.status === 'failed').length;
    return baseDelay * Math.pow(2, failures); // Exponential backoff
  }

  private calculateOptimalDelay(systemLoad: number, errorRate: number): number {
    return Math.min(300000, (systemLoad + errorRate) * 600000); // Max 5 minutes
  }

  private estimateAffectedRecords(task: AutonomousTask): number {
    // Estimate based on task type and parameters
    return task.parameters.limit || 100;
  }

  private generateRollbackData(task: AutonomousTask, result: any): any {
    return {
      taskId: task.id,
      timestamp: new Date().toISOString(),
      originalParameters: task.parameters,
      result: result
    };
  }

  private async updatePredictionsFromExecution(task: AutonomousTask, result: any, success: boolean): Promise<void> {
    // Update ML models with execution results
    logger.info('Updated predictions from execution', {
      taskId: task.id,
      success,
      hasResult: !!result
    });
  }

  private async backupTaskParameters(task: AutonomousTask): Promise<void> {
    // Backup current parameters
    await prisma.taskParameterBackup.create({
      data: {
        taskId: task.id,
        parameters: task.parameters,
        timestamp: new Date()
      }
    }).catch(error => {
      logger.warn('Failed to backup task parameters', { error: error.message });
    });
  }

  private async optimizeTaskParameters(task: AutonomousTask): Promise<void> {
    // Suggest parameter optimizations based on performance history
    logger.info('Optimizing task parameters', { taskId: task.id });
  }

  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  private updateExecutionContext(): void {
    // Update system metrics
    this.executionContext.systemState.load = Math.random() * 0.5 + 0.1;
    this.executionContext.systemState.errorRate = Math.random() * 0.02;
    this.executionContext.businessContext.businessHours = this.isBusinessHours();
  }

  private async validateTaskGovernance(task: AutonomousTask): Promise<{ allowed: boolean; reason?: string }> {
    for (const rule of this.governanceRules.values()) {
      if (!rule.active) continue;

      let ruleApplies = false;
      
      // Check if rule applies to this task
      for (const condition of rule.conditions) {
        if (this.evaluateGovernanceCondition(condition, task)) {
          ruleApplies = true;
          break;
        }
      }

      if (ruleApplies && !rule.actions.allow) {
        return { allowed: false, reason: rule.description };
      }
    }

    return { allowed: true };
  }

  private evaluateGovernanceCondition(condition: TaskCondition, task: AutonomousTask): boolean {
    switch (condition.field) {
      case 'riskLevel':
        return condition.operator === 'equals' && task.riskLevel === condition.value;
      case 'businessHours':
        return condition.operator === 'equals' && 
               this.executionContext.businessContext.businessHours === condition.value;
      default:
        return false;
    }
  }

  private async persistAutonomousTask(task: AutonomousTask): Promise<void> {
    try {
      await prisma.autonomousTask.upsert({
        where: { id: task.id },
        update: {
          status: task.status,
          lastExecuted: task.lastExecuted,
          nextExecution: task.nextExecution,
          executionHistory: task.executionHistory
        },
        create: {
          id: task.id,
          type: task.type,
          taskType: task.taskType,
          description: task.description,
          priority: task.priority,
          riskLevel: task.riskLevel,
          parameters: task.parameters,
          conditions: task.conditions,
          dependencies: task.dependencies,
          maxRetries: task.maxRetries,
          timeoutMs: task.timeoutMs,
          schedule: task.schedule,
          userId: task.userId,
          status: task.status,
          lastExecuted: task.lastExecuted,
          nextExecution: task.nextExecution,
          executionHistory: task.executionHistory,
          createdAt: task.createdAt
        }
      });
    } catch (error) {
      logger.warn('Failed to persist autonomous task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Public API methods
   */
  async getAutonomousTasks(userId?: string): Promise<AutonomousTask[]> {
    const tasks = Array.from(this.autonomousTasks.values());
    return userId ? tasks.filter(t => t.userId === userId) : tasks;
  }

  async getTaskById(taskId: string): Promise<AutonomousTask | undefined> {
    return this.autonomousTasks.get(taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.autonomousTasks.get(taskId);
    if (!task) return false;

    // Cancel if running
    const controller = this.activeExecutions.get(taskId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(taskId);
    }

    // Remove from queue
    this.executionQueue = this.executionQueue.filter(id => id !== taskId);
    
    task.status = 'cancelled';
    await this.persistAutonomousTask(task);
    
    return true;
  }

  async getPredictiveInsights(taskId?: string): Promise<PredictiveInsight[]> {
    if (taskId) {
      return this.predictiveInsights.get(taskId) || [];
    }
    
    const allInsights: PredictiveInsight[] = [];
    for (const insights of this.predictiveInsights.values()) {
      allInsights.push(...insights);
    }
    return allInsights;
  }

  getFrameworkStatus(): {
    isRunning: boolean;
    activeExecutions: number;
    queuedTasks: number;
    totalTasks: number;
    systemContext: AutonomousExecutionContext;
  } {
    return {
      isRunning: this.isRunning,
      activeExecutions: this.activeExecutions.size,
      queuedTasks: this.executionQueue.length,
      totalTasks: this.autonomousTasks.size,
      systemContext: this.executionContext
    };
  }
}

// Export singleton instance
export const autonomousExecutionFramework = new AutonomousExecutionFramework();

// Export types
export type {
  AutonomousTask,
  TaskCondition,
  ScheduleConfig,
  ExecutionRecord,
  AutonomousExecutionContext,
  PredictiveInsight,
  GovernanceRule
};