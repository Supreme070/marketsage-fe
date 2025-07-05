/**
 * Enhanced Natural Language Command Parser
 * =======================================
 * Advanced NLP engine that understands complex, multi-step business requests
 * Supports context awareness, intent chaining, and sophisticated parameter extraction
 */

import { getAIInstance } from '@/lib/ai/openai-integration';
import { logger } from '@/lib/logger';
import { intelligentIntentAnalyzer, type IntelligentIntent } from './intelligent-intent-analyzer';

export interface EnhancedCommand {
  id: string;
  mainIntent: IntelligentIntent;
  subCommands: IntelligentIntent[];
  executionPlan: ExecutionStep[];
  context: CommandContext;
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  confidence: number;
  dependencies: string[];
  estimatedTime: number; // seconds
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExecutionStep {
  id: string;
  action: string;
  entity: string;
  parameters: Record<string, any>;
  dependencies: string[];
  order: number;
  description: string;
  estimated_time: number;
  rollback_possible: boolean;
}

export interface CommandContext {
  userId: string;
  sessionId?: string;
  previousCommands: IntelligentIntent[];
  businessContext: {
    industry: string;
    market: string;
    organizationSize: string;
    currentGoals: string[];
  };
  temporalContext: {
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    businessHours: boolean;
  };
  userPreferences: {
    communicationStyle: string;
    riskTolerance: string;
    automationLevel: string;
  };
}

export interface NLPParsingResult {
  success: boolean;
  command: EnhancedCommand | null;
  errors: string[];
  suggestions: string[];
  clarificationNeeded: boolean;
  clarificationQuestions: string[];
}

class EnhancedNLPParser {
  private aiInstance: any;
  private contextWindow: IntelligentIntent[] = [];
  private maxContextSize = 10;

  constructor() {
    this.aiInstance = getAIInstance();
  }

  /**
   * Parse complex natural language commands into structured execution plans
   */
  async parseCommand(
    userInput: string, 
    context: Partial<CommandContext>
  ): Promise<NLPParsingResult> {
    try {
      logger.info('Enhanced NLP parsing started', { 
        input: userInput.substring(0, 100),
        userId: context.userId 
      });

      // Step 1: Analyze overall command structure
      const commandStructure = await this.analyzeCommandStructure(userInput);
      
      // Step 2: Break down into sub-commands if needed
      const subCommands = await this.extractSubCommands(userInput, commandStructure);
      
      // Step 3: Create execution plan
      const executionPlan = await this.createExecutionPlan(subCommands, context);
      
      // Step 4: Assess complexity and risk
      const complexity = this.assessComplexity(subCommands, executionPlan);
      const riskLevel = this.assessRiskLevel(executionPlan);
      
      // Step 5: Validate dependencies
      const dependencies = this.extractDependencies(executionPlan);
      const validation = await this.validateCommand(executionPlan, context);

      if (!validation.valid) {
        return {
          success: false,
          command: null,
          errors: validation.errors,
          suggestions: validation.suggestions,
          clarificationNeeded: true,
          clarificationQuestions: validation.clarificationQuestions
        };
      }

      // Step 6: Build enhanced command
      const enhancedCommand: EnhancedCommand = {
        id: this.generateCommandId(),
        mainIntent: subCommands[0] || await intelligentIntentAnalyzer.analyzeIntent(userInput),
        subCommands,
        executionPlan,
        context: this.buildFullContext(context),
        complexity,
        confidence: this.calculateOverallConfidence(subCommands),
        dependencies,
        estimatedTime: executionPlan.reduce((total, step) => total + step.estimated_time, 0),
        riskLevel
      };

      // Add to context window for future reference
      this.updateContextWindow(enhancedCommand.mainIntent);

      return {
        success: true,
        command: enhancedCommand,
        errors: [],
        suggestions: this.generateOptimizationSuggestions(enhancedCommand),
        clarificationNeeded: false,
        clarificationQuestions: []
      };

    } catch (error) {
      logger.error('Enhanced NLP parsing failed', {
        error: error instanceof Error ? error.message : String(error),
        input: userInput.substring(0, 100),
        userId: context.userId
      });

      return {
        success: false,
        command: null,
        errors: ['Failed to parse command due to system error'],
        suggestions: ['Try breaking down your request into smaller steps', 'Use simpler language'],
        clarificationNeeded: true,
        clarificationQuestions: ['Could you rephrase your request more simply?']
      };
    }
  }

  /**
   * Analyze the overall structure of the command
   */
  private async analyzeCommandStructure(userInput: string): Promise<{
    type: 'simple' | 'compound' | 'conditional' | 'sequential';
    mainVerb: string;
    subjects: string[];
    modifiers: string[];
    conditions: string[];
  }> {
    const structurePrompt = `
Analyze the structure of this command for a business automation system:

Command: "${userInput}"

Respond with JSON containing:
{
  "type": "simple|compound|conditional|sequential",
  "mainVerb": "primary action verb",
  "subjects": ["what the action applies to"],
  "modifiers": ["qualifying phrases"],
  "conditions": ["if/when/unless clauses"],
  "reasoning": "brief explanation"
}

Types:
- simple: Single action ("create contact")
- compound: Multiple related actions ("create contact and add to list")
- conditional: Action depends on condition ("if churn risk > 70% then create retention task")
- sequential: Step-by-step process ("first create campaign, then test it, then launch")

Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        structurePrompt,
        'You are a command structure analyzer. Respond only with valid JSON.',
        [],
        {
          model: 'gpt-4o-mini',
          temperature: 0.1,
          maxTokens: 400
        }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      // Fallback to simple analysis
      return {
        type: 'simple',
        mainVerb: 'process',
        subjects: ['request'],
        modifiers: [],
        conditions: []
      };
    }
  }

  /**
   * Extract sub-commands from complex requests
   */
  private async extractSubCommands(
    userInput: string, 
    structure: any
  ): Promise<IntelligentIntent[]> {
    if (structure.type === 'simple') {
      // Single command
      return [await intelligentIntentAnalyzer.analyzeIntent(userInput)];
    }

    // For complex commands, break them down
    const decompositionPrompt = `
Break down this complex business command into individual sub-commands:

Original Command: "${userInput}"
Command Type: ${structure.type}

For each sub-command, extract:
1. The specific action
2. What it operates on
3. Any parameters or conditions

Respond with a JSON array of sub-commands:
[
  {
    "command": "specific command text",
    "action": "CREATE|UPDATE|DELETE|FETCH|ASSIGN|ANALYZE",
    "entity": "CONTACT|WORKFLOW|CAMPAIGN|TASK|SEGMENT|TEMPLATE|LIST|INTEGRATION|JOURNEY|ABTEST|DATA|USER|ORGANIZATION",
    "parameters": {"key": "value"},
    "order": 1,
    "dependencies": ["list of prerequisite commands"]
  }
]

Examples:
"Create a user john@company.com and add them to admin group" →
[
  {"command": "create user john@company.com", "action": "CREATE", "entity": "USER", "order": 1},
  {"command": "add user to admin group", "action": "UPDATE", "entity": "USER", "order": 2, "dependencies": ["create user"]}
]

Respond with valid JSON array only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        decompositionPrompt,
        'You are a command decomposition AI. Respond only with valid JSON array.',
        [],
        {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          maxTokens: 800
        }
      );

      const subCommandData = JSON.parse(response.answer);
      const subCommands: IntelligentIntent[] = [];

      for (const subCmd of subCommandData) {
        const intent = await intelligentIntentAnalyzer.analyzeIntent(subCmd.command);
        intent.data = { ...intent.data, ...subCmd.parameters };
        subCommands.push(intent);
      }

      return subCommands;
    } catch (error) {
      logger.warn('Sub-command extraction failed, using fallback', { error });
      return [await intelligentIntentAnalyzer.analyzeIntent(userInput)];
    }
  }

  /**
   * Create detailed execution plan
   */
  private async createExecutionPlan(
    subCommands: IntelligentIntent[],
    context: Partial<CommandContext>
  ): Promise<ExecutionStep[]> {
    const executionPlan: ExecutionStep[] = [];
    
    for (let i = 0; i < subCommands.length; i++) {
      const cmd = subCommands[i];
      
      const step: ExecutionStep = {
        id: `step_${i + 1}`,
        action: cmd.action,
        entity: cmd.entity,
        parameters: cmd.data,
        dependencies: i > 0 ? [`step_${i}`] : [],
        order: i + 1,
        description: this.generateStepDescription(cmd),
        estimated_time: this.estimateExecutionTime(cmd),
        rollback_possible: this.canRollback(cmd)
      };

      executionPlan.push(step);
    }

    return executionPlan;
  }

  /**
   * Assess command complexity
   */
  private assessComplexity(
    subCommands: IntelligentIntent[],
    executionPlan: ExecutionStep[]
  ): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    const commandCount = subCommands.length;
    const hasExternalDeps = executionPlan.some(step => 
      step.dependencies.length > 1 || 
      ['INTEGRATION', 'ORGANIZATION'].includes(step.entity)
    );
    const avgConfidence = subCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / commandCount;

    if (commandCount === 1 && avgConfidence > 0.8) return 'simple';
    if (commandCount <= 3 && !hasExternalDeps) return 'moderate';
    if (commandCount <= 6 || hasExternalDeps) return 'complex';
    return 'enterprise';
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(executionPlan: ExecutionStep[]): 'low' | 'medium' | 'high' | 'critical' {
    const hasDeleteOperations = executionPlan.some(step => step.action === 'DELETE');
    const hasUserManagement = executionPlan.some(step => step.entity === 'USER');
    const hasOrgManagement = executionPlan.some(step => step.entity === 'ORGANIZATION');
    const hasMultipleSteps = executionPlan.length > 3;
    const hasLowRollback = executionPlan.some(step => !step.rollback_possible);

    if (hasOrgManagement || (hasDeleteOperations && hasLowRollback)) return 'critical';
    if (hasUserManagement || (hasDeleteOperations && hasMultipleSteps)) return 'high';
    if (hasDeleteOperations || hasMultipleSteps) return 'medium';
    return 'low';
  }

  /**
   * Extract dependencies between steps
   */
  private extractDependencies(executionPlan: ExecutionStep[]): string[] {
    const allDeps = new Set<string>();
    
    for (const step of executionPlan) {
      step.dependencies.forEach(dep => allDeps.add(dep));
    }

    return Array.from(allDeps);
  }

  /**
   * Validate command before execution
   */
  private async validateCommand(
    executionPlan: ExecutionStep[],
    context: Partial<CommandContext>
  ): Promise<{
    valid: boolean;
    errors: string[];
    suggestions: string[];
    clarificationQuestions: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];
    const clarificationQuestions: string[] = [];

    // Check for missing required parameters
    for (const step of executionPlan) {
      if (step.action === 'CREATE' && step.entity === 'USER') {
        if (!step.parameters.email) {
          errors.push('Email address is required for user creation');
          clarificationQuestions.push('What email address should be used for the new user?');
        }
        if (!step.parameters.name) {
          errors.push('Name is required for user creation');
          clarificationQuestions.push('What should be the user\'s full name?');
        }
      }

      if (step.action === 'CREATE' && step.entity === 'ORGANIZATION') {
        if (!step.parameters.name) {
          errors.push('Organization name is required');
          clarificationQuestions.push('What should be the organization name?');
        }
      }

      if (step.action === 'DELETE' && !step.parameters.id && !step.parameters.email) {
        errors.push(`ID or identifier is required for ${step.entity.toLowerCase()} deletion`);
        clarificationQuestions.push(`Which ${step.entity.toLowerCase()} should be deleted?`);
      }
    }

    // Check permissions
    if (executionPlan.some(step => step.entity === 'ORGANIZATION')) {
      suggestions.push('Organization operations require Super Admin privileges');
    }

    if (executionPlan.some(step => step.entity === 'USER')) {
      suggestions.push('User management operations require Admin or Super Admin privileges');
    }

    // Check for potential conflicts
    const hasCreateAndDelete = executionPlan.some(s => s.action === 'CREATE') && 
                               executionPlan.some(s => s.action === 'DELETE');
    if (hasCreateAndDelete) {
      suggestions.push('This operation contains both create and delete actions - please confirm this is intentional');
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions,
      clarificationQuestions
    };
  }

  /**
   * Build full context for command execution
   */
  private buildFullContext(context: Partial<CommandContext>): CommandContext {
    const now = new Date();
    
    return {
      userId: context.userId || '',
      sessionId: context.sessionId || this.generateSessionId(),
      previousCommands: this.contextWindow,
      businessContext: {
        industry: context.businessContext?.industry || 'fintech',
        market: context.businessContext?.market || 'african',
        organizationSize: context.businessContext?.organizationSize || 'medium',
        currentGoals: context.businessContext?.currentGoals || []
      },
      temporalContext: {
        timeOfDay: this.getTimeOfDay(now),
        dayOfWeek: now.toLocaleDateString('en', { weekday: 'long' }),
        season: this.getSeason(now),
        businessHours: this.isBusinessHours(now)
      },
      userPreferences: {
        communicationStyle: context.userPreferences?.communicationStyle || 'professional',
        riskTolerance: context.userPreferences?.riskTolerance || 'medium',
        automationLevel: context.userPreferences?.automationLevel || 'high'
      }
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(subCommands: IntelligentIntent[]): number {
    if (subCommands.length === 0) return 0;
    
    const avgConfidence = subCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / subCommands.length;
    
    // Reduce confidence for complex multi-step operations
    const complexityPenalty = Math.max(0, (subCommands.length - 1) * 0.05);
    
    return Math.max(0, Math.min(1, avgConfidence - complexityPenalty));
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(command: EnhancedCommand): string[] {
    const suggestions: string[] = [];

    if (command.complexity === 'complex' || command.complexity === 'enterprise') {
      suggestions.push('Consider breaking this into smaller, separate operations for better reliability');
    }

    if (command.riskLevel === 'high' || command.riskLevel === 'critical') {
      suggestions.push('This operation has high risk - consider testing in a staging environment first');
    }

    if (command.estimatedTime > 300) { // 5 minutes
      suggestions.push('This operation may take several minutes - consider running during off-peak hours');
    }

    if (command.confidence < 0.7) {
      suggestions.push('Some parts of this command may need clarification for optimal results');
    }

    return suggestions;
  }

  /**
   * Helper methods
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepDescription(intent: IntelligentIntent): string {
    return `${intent.action.toLowerCase()} ${intent.entity.toLowerCase()}${intent.data.name ? ` "${intent.data.name}"` : ''}`;
  }

  private estimateExecutionTime(intent: IntelligentIntent): number {
    const baseTime = {
      'CREATE': 5,
      'UPDATE': 3,
      'DELETE': 2,
      'FETCH': 1,
      'ASSIGN': 2,
      'ANALYZE': 10
    };

    const entityMultiplier = {
      'CONTACT': 1,
      'USER': 1.5,
      'ORGANIZATION': 3,
      'WORKFLOW': 2,
      'CAMPAIGN': 2,
      'TASK': 1,
      'DATA': 1.5
    };

    return (baseTime[intent.action] || 5) * (entityMultiplier[intent.entity] || 1);
  }

  private canRollback(intent: IntelligentIntent): boolean {
    if (intent.action === 'DELETE') return false;
    if (intent.entity === 'ORGANIZATION' && intent.action === 'CREATE') return false;
    return true;
  }

  private updateContextWindow(intent: IntelligentIntent): void {
    this.contextWindow.push(intent);
    if (this.contextWindow.length > this.maxContextSize) {
      this.contextWindow.shift();
    }
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  /**
   * Get context-aware suggestions for similar commands
   */
  public getContextualSuggestions(partialInput: string): string[] {
    const suggestions: string[] = [];
    
    // Based on context window, suggest similar or follow-up actions
    const recentEntities = this.contextWindow.slice(-3).map(intent => intent.entity);
    const recentActions = this.contextWindow.slice(-3).map(intent => intent.action);

    if (recentEntities.includes('USER')) {
      suggestions.push('assign role to user', 'create user group', 'update user permissions');
    }

    if (recentEntities.includes('CAMPAIGN')) {
      suggestions.push('create A/B test for campaign', 'analyze campaign performance', 'duplicate campaign');
    }

    if (recentActions.includes('CREATE')) {
      suggestions.push('view created items', 'update settings', 'activate workflow');
    }

    return suggestions.filter(s => s.toLowerCase().includes(partialInput.toLowerCase()));
  }

  /**
   * Clear context window
   */
  public clearContext(): void {
    this.contextWindow = [];
  }

  /**
   * Get current context window
   */
  public getContext(): IntelligentIntent[] {
    return [...this.contextWindow];
  }
}

// Export singleton instance
export const enhancedNLPParser = new EnhancedNLPParser();

// Export types
export type { EnhancedNLPParser };