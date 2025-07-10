/**
 * Intelligent Task Prioritization Engine
 * =====================================
 * ML-powered task prioritization system for MarketSage
 * 
 * Features:
 * 🧠 Machine learning-based priority scoring
 * ⚡ Real-time priority adjustment based on context
 * 📊 Business impact assessment
 * 🎯 Dynamic workload balancing
 * 🌍 African market context awareness
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { SupremeAI } from '@/lib/ai/supreme-ai-engine';

// Priority scoring factors
export interface PriorityFactors {
  urgency: number;           // 0.0 - 1.0 (deadline pressure)
  importance: number;        // 0.0 - 1.0 (business impact)
  complexity: number;        // 0.0 - 1.0 (effort required)
  dependencies: number;      // 0.0 - 1.0 (blocking other tasks)
  customer_impact: number;   // 0.0 - 1.0 (customer facing impact)
  revenue_impact: number;    // 0.0 - 1.0 (potential revenue impact)
  team_capacity: number;     // 0.0 - 1.0 (team availability)
  market_timing: number;     // 0.0 - 1.0 (market opportunity)
}

export interface TaskPriorityScore {
  taskId: string;
  priority_score: number;    // 0.0 - 100.0
  priority_tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  factors: PriorityFactors;
  reasoning: string;
  confidence: number;
  last_calculated: Date;
  african_market_context?: {
    business_hours_factor: number;
    cultural_timing_factor: number;
    local_competition_factor: number;
  };
}

export interface TaskContext {
  task: any;
  assignee?: any;
  related_tasks: any[];
  campaign_context?: any;
  customer_context?: any;
  deadline?: Date;
  estimated_effort?: number;
  business_domain: string;
}

export interface PrioritizationConfig {
  factor_weights: Partial<PriorityFactors>;
  african_market_emphasis: boolean;
  team_capacity_consideration: boolean;
  customer_priority_boost: boolean;
  deadline_urgency_multiplier: number;
}

export class IntelligentTaskPrioritizer {
  private supremeAI: typeof SupremeAI;
  private priorityCache: Map<string, TaskPriorityScore> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  // Default prioritization configuration
  private defaultConfig: PrioritizationConfig = {
    factor_weights: {
      urgency: 0.25,
      importance: 0.20,
      complexity: 0.10,
      dependencies: 0.15,
      customer_impact: 0.15,
      revenue_impact: 0.10,
      team_capacity: 0.05,
      market_timing: 0.05
    },
    african_market_emphasis: true,
    team_capacity_consideration: true,
    customer_priority_boost: true,
    deadline_urgency_multiplier: 1.5
  };

  constructor() {
    this.supremeAI = SupremeAI;
  }

  /**
   * Calculate intelligent priority score for a task
   */
  async calculateTaskPriority(
    taskId: string,
    context: TaskContext,
    config?: Partial<PrioritizationConfig>
  ): Promise<TaskPriorityScore> {
    try {
      // Check cache first
      const cached = this.priorityCache.get(taskId);
      if (cached && Date.now() - cached.last_calculated.getTime() < this.CACHE_DURATION) {
        return cached;
      }

      logger.info('Calculating intelligent task priority', { taskId, context: context.business_domain });

      const finalConfig = { ...this.defaultConfig, ...config };
      
      // Calculate individual priority factors
      const factors = await this.calculatePriorityFactors(context, finalConfig);
      
      // Apply ML-based scoring enhancement
      const mlEnhancedFactors = await this.enhanceFactorsWithML(factors, context);
      
      // Calculate weighted priority score
      const priorityScore = this.calculateWeightedScore(mlEnhancedFactors, finalConfig);
      
      // Determine priority tier
      const priorityTier = this.determinePriorityTier(priorityScore);
      
      // Generate reasoning
      const reasoning = this.generatePriorityReasoning(mlEnhancedFactors, priorityScore, context);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(context, mlEnhancedFactors);
      
      // Apply African market context if applicable
      const africanContext = finalConfig.african_market_emphasis 
        ? await this.calculateAfricanMarketContext(context)
        : undefined;

      const result: TaskPriorityScore = {
        taskId,
        priority_score: priorityScore,
        priority_tier: priorityTier,
        factors: mlEnhancedFactors,
        reasoning,
        confidence,
        last_calculated: new Date(),
        african_market_context: africanContext
      };

      // Cache the result
      this.priorityCache.set(taskId, result);
      
      // Store in database for analytics
      await this.storePriorityScore(result);

      logger.info('Task priority calculated', {
        taskId,
        priority_score: priorityScore,
        priority_tier: priorityTier,
        confidence
      });

      return result;
    } catch (error) {
      logger.error('Failed to calculate task priority', {
        error: error instanceof Error ? error.message : String(error),
        taskId
      });

      // Return default priority on error
      return {
        taskId,
        priority_score: 50,
        priority_tier: 'MEDIUM',
        factors: this.getDefaultFactors(),
        reasoning: 'Priority calculation failed, using default medium priority',
        confidence: 0.1,
        last_calculated: new Date()
      };
    }
  }

  /**
   * Prioritize multiple tasks and return them in optimal order
   */
  async prioritizeTaskList(
    tasks: any[],
    contexts: TaskContext[],
    config?: Partial<PrioritizationConfig>
  ): Promise<TaskPriorityScore[]> {
    if (tasks.length !== contexts.length) {
      throw new Error('Tasks and contexts arrays must have the same length');
    }

    // Calculate priorities for all tasks
    const priorityPromises = tasks.map((task, index) => 
      this.calculateTaskPriority(task.id, contexts[index], config)
    );

    const priorities = await Promise.all(priorityPromises);
    
    // Sort by priority score (highest first)
    return priorities.sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Update task priorities based on changing conditions
   */
  async updateTaskPriorities(
    taskIds: string[],
    triggerEvent: 'deadline_approaching' | 'team_capacity_change' | 'customer_escalation' | 'market_change'
  ): Promise<TaskPriorityScore[]> {
    logger.info('Updating task priorities due to trigger event', {
      triggerEvent,
      taskCount: taskIds.length
    });

    const updatedPriorities = [];

    for (const taskId of taskIds) {
      try {
        // Get task and context
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, creator: true }
        });

        if (!task) continue;

        // Build context from task data
        const context = await this.buildTaskContext(task);
        
        // Apply trigger-specific adjustments
        const adjustedConfig = this.getAdjustedConfigForTrigger(triggerEvent);
        
        // Recalculate priority
        const newPriority = await this.calculateTaskPriority(taskId, context, adjustedConfig);
        updatedPriorities.push(newPriority);
        
        // Update task priority in database if significantly changed
        const oldPriority = this.priorityCache.get(taskId);
        if (!oldPriority || Math.abs(newPriority.priority_score - oldPriority.priority_score) > 10) {
          await this.updateTaskPriorityInDB(taskId, newPriority);
        }
        
      } catch (error) {
        logger.error('Failed to update task priority', {
          error: error instanceof Error ? error.message : String(error),
          taskId,
          triggerEvent
        });
      }
    }

    return updatedPriorities.sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Get recommended task for a specific team member
   */
  async getRecommendedTaskForUser(
    userId: string,
    availableTaskIds: string[],
    userContext?: { skills: string[]; workload: number; timezone: string }
  ): Promise<{ taskId: string; priority: TaskPriorityScore; fit_score: number } | null> {
    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true,
          timezone: true
        }
      });

      if (!user) return null;

      // Calculate priorities for available tasks
      const taskPriorities = [];
      
      for (const taskId of availableTaskIds) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, creator: true }
        });

        if (!task) continue;

        const context = await this.buildTaskContext(task);
        const priority = await this.calculateTaskPriority(taskId, context);
        
        // Calculate fit score based on user context
        const fitScore = this.calculateUserTaskFit(user, task, userContext);
        
        taskPriorities.push({
          taskId,
          priority,
          fit_score: fitScore
        });
      }

      if (taskPriorities.length === 0) return null;

      // Sort by combined priority and fit score
      taskPriorities.sort((a, b) => {
        const scoreA = a.priority.priority_score * 0.7 + a.fit_score * 0.3;
        const scoreB = b.priority.priority_score * 0.7 + b.fit_score * 0.3;
        return scoreB - scoreA;
      });

      return taskPriorities[0];
    } catch (error) {
      logger.error('Failed to get recommended task for user', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return null;
    }
  }

  // Private helper methods

  private async calculatePriorityFactors(
    context: TaskContext,
    config: PrioritizationConfig
  ): Promise<PriorityFactors> {
    const task = context.task;
    
    // Urgency: Based on deadline and current date
    const urgency = this.calculateUrgencyFactor(context.deadline);
    
    // Importance: Based on task type and business impact
    const importance = this.calculateImportanceFactor(task, context);
    
    // Complexity: Based on estimated effort and task description
    const complexity = this.calculateComplexityFactor(context.estimated_effort, task.description);
    
    // Dependencies: Based on related tasks and blocking relationships
    const dependencies = this.calculateDependenciesFactor(context.related_tasks, task);
    
    // Customer Impact: Based on customer-facing nature and customer tier
    const customer_impact = this.calculateCustomerImpactFactor(context.customer_context, task);
    
    // Revenue Impact: Based on potential business value
    const revenue_impact = this.calculateRevenueImpactFactor(context, task);
    
    // Team Capacity: Based on assignee workload and availability
    const team_capacity = config.team_capacity_consideration 
      ? await this.calculateTeamCapacityFactor(context.assignee)
      : 0.5;
    
    // Market Timing: Based on African market conditions and timing
    const market_timing = config.african_market_emphasis 
      ? this.calculateMarketTimingFactor(context)
      : 0.5;

    return {
      urgency,
      importance,
      complexity,
      dependencies,
      customer_impact,
      revenue_impact,
      team_capacity,
      market_timing
    };
  }

  private async enhanceFactorsWithML(
    factors: PriorityFactors,
    context: TaskContext
  ): Promise<PriorityFactors> {
    try {
      // Use Supreme AI to analyze and enhance priority factors
      const analysis = await this.supremeAI.analyzeTaskPriority([{
        task_description: context.task.description,
        task_title: context.task.title,
        business_domain: context.business_domain,
        current_factors: factors,
        deadline: context.deadline?.toISOString(),
        estimated_effort: context.estimated_effort
      }]);

      // Extract ML-enhanced factors from analysis
      const enhancedFactors = analysis.data.enhancedFactors || factors;
      
      // Apply ML adjustments while keeping within valid ranges
      return {
        urgency: Math.max(0, Math.min(1, enhancedFactors.urgency || factors.urgency)),
        importance: Math.max(0, Math.min(1, enhancedFactors.importance || factors.importance)),
        complexity: Math.max(0, Math.min(1, enhancedFactors.complexity || factors.complexity)),
        dependencies: Math.max(0, Math.min(1, enhancedFactors.dependencies || factors.dependencies)),
        customer_impact: Math.max(0, Math.min(1, enhancedFactors.customer_impact || factors.customer_impact)),
        revenue_impact: Math.max(0, Math.min(1, enhancedFactors.revenue_impact || factors.revenue_impact)),
        team_capacity: Math.max(0, Math.min(1, enhancedFactors.team_capacity || factors.team_capacity)),
        market_timing: Math.max(0, Math.min(1, enhancedFactors.market_timing || factors.market_timing))
      };
    } catch (error) {
      logger.warn('ML enhancement failed, using original factors', {
        error: error instanceof Error ? error.message : String(error)
      });
      return factors;
    }
  }

  private calculateWeightedScore(factors: PriorityFactors, config: PrioritizationConfig): number {
    const weights = config.factor_weights;
    
    let score = 0;
    score += (factors.urgency * (weights.urgency || 0.25));
    score += (factors.importance * (weights.importance || 0.20));
    score += (factors.complexity * (weights.complexity || 0.10));
    score += (factors.dependencies * (weights.dependencies || 0.15));
    score += (factors.customer_impact * (weights.customer_impact || 0.15));
    score += (factors.revenue_impact * (weights.revenue_impact || 0.10));
    score += (factors.team_capacity * (weights.team_capacity || 0.05));
    score += (factors.market_timing * (weights.market_timing || 0.05));
    
    // Convert to 0-100 scale
    return Math.round(score * 100);
  }

  private determinePriorityTier(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 85) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private generatePriorityReasoning(
    factors: PriorityFactors,
    score: number,
    context: TaskContext
  ): string {
    const reasons = [];
    
    if (factors.urgency > 0.8) reasons.push('urgent deadline');
    if (factors.importance > 0.8) reasons.push('high business impact');
    if (factors.customer_impact > 0.7) reasons.push('significant customer impact');
    if (factors.dependencies > 0.7) reasons.push('blocks other tasks');
    if (factors.revenue_impact > 0.7) reasons.push('revenue opportunity');
    if (factors.market_timing > 0.8) reasons.push('optimal market timing');
    
    if (reasons.length === 0) {
      return `Medium priority task with balanced factors (score: ${score})`;
    }
    
    return `${this.determinePriorityTier(score).toLowerCase()} priority due to: ${reasons.join(', ')} (score: ${score})`;
  }

  private calculateConfidence(context: TaskContext, factors: PriorityFactors): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on available data
    if (context.deadline) confidence += 0.1;
    if (context.estimated_effort) confidence += 0.1;
    if (context.customer_context) confidence += 0.1;
    if (context.related_tasks.length > 0) confidence += 0.1;
    if (context.assignee) confidence += 0.1;
    
    // Decrease confidence for very high or low factor values (edge cases)
    const factorValues = Object.values(factors);
    const extremeValues = factorValues.filter(v => v < 0.1 || v > 0.9).length;
    confidence -= extremeValues * 0.05;
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Individual factor calculation methods
  private calculateUrgencyFactor(deadline?: Date): number {
    if (!deadline) return 0.3; // Default for no deadline
    
    const now = new Date();
    const timeToDeadline = deadline.getTime() - now.getTime();
    const daysToDeadline = timeToDeadline / (1000 * 60 * 60 * 24);
    
    if (daysToDeadline <= 0) return 1.0; // Overdue
    if (daysToDeadline <= 1) return 0.9; // Due today/tomorrow
    if (daysToDeadline <= 3) return 0.8; // Due within 3 days
    if (daysToDeadline <= 7) return 0.6; // Due within a week
    if (daysToDeadline <= 14) return 0.4; // Due within 2 weeks
    if (daysToDeadline <= 30) return 0.3; // Due within a month
    
    return 0.2; // Long-term deadline
  }

  private calculateImportanceFactor(task: any, context: TaskContext): number {
    let importance = 0.5; // Base importance
    
    // Task priority (from original task priority field)
    if (task.priority === 'URGENT') importance += 0.4;
    else if (task.priority === 'HIGH') importance += 0.3;
    else if (task.priority === 'MEDIUM') importance += 0.1;
    
    // Business domain impact
    if (context.business_domain === 'customer_success') importance += 0.2;
    if (context.business_domain === 'sales') importance += 0.2;
    if (context.business_domain === 'product') importance += 0.1;
    
    // Campaign-related tasks get boost
    if (context.campaign_context) importance += 0.1;
    
    return Math.min(1.0, importance);
  }

  private calculateComplexityFactor(estimated_effort?: number, description?: string): number {
    let complexity = 0.5; // Default complexity
    
    // Based on estimated effort (hours)
    if (estimated_effort) {
      if (estimated_effort > 40) complexity = 0.9; // Very complex (1+ week)
      else if (estimated_effort > 16) complexity = 0.7; // Complex (2+ days)
      else if (estimated_effort > 8) complexity = 0.5; // Medium (1+ day)
      else if (estimated_effort > 2) complexity = 0.3; // Simple (few hours)
      else complexity = 0.1; // Very simple
    }
    
    // Based on description keywords
    if (description) {
      const desc = description.toLowerCase();
      if (desc.includes('integrate') || desc.includes('refactor') || desc.includes('migrate')) {
        complexity += 0.2;
      }
      if (desc.includes('fix') || desc.includes('bug') || desc.includes('urgent')) {
        complexity -= 0.1;
      }
    }
    
    return Math.max(0.1, Math.min(1.0, complexity));
  }

  private calculateDependenciesFactor(relatedTasks: any[], task: any): number {
    // Simple dependency scoring based on related tasks
    if (relatedTasks.length === 0) return 0.1;
    
    // Tasks with many dependencies get higher scores
    const dependencyScore = Math.min(1.0, relatedTasks.length / 5);
    
    // Blocking tasks get extra boost
    const blockingTasks = relatedTasks.filter(t => 
      t.status === 'TODO' || t.status === 'IN_PROGRESS'
    );
    
    const blockingBoost = blockingTasks.length > 0 ? 0.3 : 0;
    
    return Math.min(1.0, dependencyScore + blockingBoost);
  }

  private calculateCustomerImpactFactor(customerContext: any, task: any): number {
    let impact = 0.3; // Default customer impact
    
    // Customer-facing tasks get higher impact
    if (task.title?.toLowerCase().includes('customer') || 
        task.description?.toLowerCase().includes('customer')) {
      impact += 0.4;
    }
    
    // VIP customer boost
    if (customerContext?.tier === 'VIP' || customerContext?.tier === 'Enterprise') {
      impact += 0.3;
    }
    
    // Support tickets get boost
    if (task.category === 'support' || task.type === 'bug') {
      impact += 0.2;
    }
    
    return Math.min(1.0, impact);
  }

  private calculateRevenueImpactFactor(context: TaskContext, task: any): number {
    let impact = 0.2; // Default revenue impact
    
    // Sales and marketing tasks get higher impact
    if (context.business_domain === 'sales' || context.business_domain === 'marketing') {
      impact += 0.3;
    }
    
    // Campaign-related tasks
    if (context.campaign_context) {
      impact += 0.2;
    }
    
    // Product features that drive revenue
    if (task.description?.toLowerCase().includes('feature') && 
        context.business_domain === 'product') {
      impact += 0.2;
    }
    
    // Performance and optimization tasks
    if (task.description?.toLowerCase().includes('optimize') || 
        task.description?.toLowerCase().includes('performance')) {
      impact += 0.1;
    }
    
    return Math.min(1.0, impact);
  }

  private async calculateTeamCapacityFactor(assignee?: any): Promise<number> {
    if (!assignee) return 0.5; // Default when no assignee
    
    try {
      // Count active tasks for the assignee
      const activeTasks = await prisma.task.count({
        where: {
          assigneeId: assignee.id,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        }
      });
      
      // Lower capacity factor for overloaded team members
      if (activeTasks > 10) return 0.1; // Overloaded
      if (activeTasks > 5) return 0.3;  // Busy
      if (activeTasks > 2) return 0.7;  // Normal load
      return 0.9; // Available
      
    } catch (error) {
      return 0.5; // Default on error
    }
  }

  private calculateMarketTimingFactor(context: TaskContext): number {
    // African market timing considerations
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    let timing = 0.5; // Base timing
    
    // Business hours boost (9 AM - 5 PM WAT)
    if (hour >= 9 && hour <= 17) {
      timing += 0.2;
    }
    
    // Weekday boost
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      timing += 0.2;
    }
    
    // Campaign timing
    if (context.campaign_context) {
      timing += 0.1;
    }
    
    return Math.min(1.0, timing);
  }

  private async calculateAfricanMarketContext(context: TaskContext): Promise<any> {
    const now = new Date();
    
    return {
      business_hours_factor: this.calculateAfricanBusinessHoursFactor(now),
      cultural_timing_factor: this.calculateCulturalTimingFactor(now),
      local_competition_factor: 0.5 // Placeholder for competitive analysis
    };
  }

  private calculateAfricanBusinessHoursFactor(date: Date): number {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // African business hours consideration (WAT timezone)
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.3; // Weekend
    if (hour < 8 || hour > 18) return 0.4; // Outside business hours
    if (hour >= 9 && hour <= 17) return 1.0; // Peak business hours
    return 0.7; // Shoulder hours
  }

  private calculateCulturalTimingFactor(date: Date): number {
    // Consider African cultural factors and holidays
    const month = date.getMonth();
    
    // Ramadan considerations (varies by year)
    if (month === 3 || month === 4) return 0.8; // April-May typically
    
    // End of year considerations
    if (month === 11) return 0.7; // December
    
    // Back to school period
    if (month === 8 || month === 0) return 0.9; // September, January
    
    return 1.0; // Normal timing
  }

  private async buildTaskContext(task: any): Promise<TaskContext> {
    // Build comprehensive task context from database
    const relatedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { creatorId: task.creatorId },
          { assigneeId: task.assigneeId },
          { contactId: task.contactId }
        ],
        NOT: { id: task.id }
      },
      take: 10
    });

    return {
      task,
      assignee: task.assignee,
      related_tasks: relatedTasks,
      business_domain: this.inferBusinessDomain(task),
      deadline: task.dueDate,
      estimated_effort: task.estimatedHours || 4 // Default estimate
    };
  }

  private inferBusinessDomain(task: any): string {
    const title = task.title?.toLowerCase() || '';
    const description = task.description?.toLowerCase() || '';
    const combined = `${title} ${description}`;
    
    if (combined.includes('customer') || combined.includes('support')) return 'customer_success';
    if (combined.includes('sale') || combined.includes('lead') || combined.includes('prospect')) return 'sales';
    if (combined.includes('campaign') || combined.includes('marketing')) return 'marketing';
    if (combined.includes('feature') || combined.includes('development')) return 'product';
    if (combined.includes('bug') || combined.includes('fix')) return 'engineering';
    
    return 'general';
  }

  private getAdjustedConfigForTrigger(trigger: string): Partial<PrioritizationConfig> {
    switch (trigger) {
      case 'deadline_approaching':
        return {
          factor_weights: { urgency: 0.4, importance: 0.3 },
          deadline_urgency_multiplier: 2.0
        };
      case 'customer_escalation':
        return {
          factor_weights: { customer_impact: 0.4, urgency: 0.3 },
          customer_priority_boost: true
        };
      case 'team_capacity_change':
        return {
          factor_weights: { team_capacity: 0.3, complexity: 0.2 },
          team_capacity_consideration: true
        };
      case 'market_change':
        return {
          factor_weights: { market_timing: 0.3, revenue_impact: 0.3 },
          african_market_emphasis: true
        };
      default:
        return {};
    }
  }

  private calculateUserTaskFit(user: any, task: any, userContext?: any): number {
    let fit = 0.5; // Base fit score
    
    // Role-based fit
    if (user.role === 'ADMIN' && task.priority === 'URGENT') fit += 0.2;
    if (user.role === 'USER' && task.complexity < 0.7) fit += 0.2;
    
    // Timezone fit
    if (userContext?.timezone && user.timezone === userContext.timezone) {
      fit += 0.1;
    }
    
    // Workload consideration
    if (userContext?.workload < 0.7) fit += 0.2; // Less loaded user
    
    return Math.min(1.0, fit);
  }

  private async updateTaskPriorityInDB(taskId: string, priority: TaskPriorityScore): Promise<void> {
    try {
      // Update task priority field if it exists in schema
      await prisma.task.update({
        where: { id: taskId },
        data: {
          // Store priority score in description metadata for now
          description: `${priority.priority_tier} priority (Score: ${priority.priority_score}) - ${priority.reasoning}`
        }
      });
    } catch (error) {
      logger.warn('Failed to update task priority in database', {
        error: error instanceof Error ? error.message : String(error),
        taskId
      });
    }
  }

  private async storePriorityScore(score: TaskPriorityScore): Promise<void> {
    try {
      // Store priority analytics for reporting
      await prisma.workflowEvent.create({
        data: {
          id: `priority-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          workflowId: 'task-prioritization',
          contactId: score.taskId,
          eventType: 'TASK_PRIORITY_CALCULATED',
          eventData: JSON.stringify({
            priority_score: score.priority_score,
            priority_tier: score.priority_tier,
            factors: score.factors,
            confidence: score.confidence,
            african_context: score.african_market_context
          })
        }
      });
    } catch (error) {
      logger.warn('Failed to store priority score for analytics', {
        error: error instanceof Error ? error.message : String(error),
        taskId: score.taskId
      });
    }
  }

  private getDefaultFactors(): PriorityFactors {
    return {
      urgency: 0.5,
      importance: 0.5,
      complexity: 0.5,
      dependencies: 0.5,
      customer_impact: 0.5,
      revenue_impact: 0.5,
      team_capacity: 0.5,
      market_timing: 0.5
    };
  }
}

// Export singleton instance
export const intelligentTaskPrioritizer = new IntelligentTaskPrioritizer();