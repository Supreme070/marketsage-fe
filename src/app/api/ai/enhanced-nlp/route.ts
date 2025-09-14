import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const nlpRequestSchema = z.object({
  command: z.string().min(1, "Command cannot be empty"),
  context: z.object({
    businessContext: z.object({
      industry: z.string().optional(),
      market: z.string().optional(),
      organizationSize: z.string().optional(),
      currentGoals: z.array(z.string()).optional()
    }).optional(),
    userPreferences: z.object({
      communicationStyle: z.string().optional(),
      riskTolerance: z.string().optional(),
      automationLevel: z.string().optional()
    }).optional()
  }).optional(),
  dryRun: z.boolean().default(false),
  includeExecutionPlan: z.boolean().default(true),
  includeSuggestions: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = nlpRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { command, context, dryRun, includeExecutionPlan, includeSuggestions } = validation.data;

    logger.info('Enhanced NLP API request', {
      userId: session.user.id,
      command: command.substring(0, 100),
      dryRun
    });

    // Build full context
    const commandContext = {
      userId: session.user.id,
      sessionId: `api_session_${Date.now()}`,
      ...context
    };

    // Parse the command
    const { enhancedNLPParser } = await import('@/lib/ai/enhanced-nlp-parser');
    const result = await enhancedNLPParser.parseCommand(command, commandContext);

    // Prepare response
    const response: any = {
      success: result.success,
      command: result.command ? {
        id: result.command.id,
        complexity: result.command.complexity,
        confidence: result.command.confidence,
        riskLevel: result.command.riskLevel,
        estimatedTime: result.command.estimatedTime,
        mainIntent: {
          action: result.command.mainIntent.action,
          entity: result.command.mainIntent.entity,
          confidence: result.command.mainIntent.confidence
        },
        subCommandsCount: result.command.subCommands.length,
        dependencies: result.command.dependencies
      } : null,
      errors: result.errors,
      clarificationNeeded: result.clarificationNeeded,
      clarificationQuestions: result.clarificationQuestions
    };

    // Include execution plan if requested and available
    if (includeExecutionPlan && result.command) {
      response.executionPlan = result.command.executionPlan.map(step => ({
        id: step.id,
        description: step.description,
        action: step.action,
        entity: step.entity,
        order: step.order,
        estimatedTime: step.estimated_time,
        rollbackPossible: step.rollback_possible,
        dependencies: step.dependencies
      }));
    }

    // Include suggestions if requested
    if (includeSuggestions) {
      response.suggestions = result.suggestions;
      
      // Add contextual suggestions
      const { enhancedNLPParser: nlpParser1 } = await import('@/lib/ai/enhanced-nlp-parser');
      const contextualSuggestions = nlpParser1.getContextualSuggestions(command.split(' ').slice(-1)[0] || '');
      if (contextualSuggestions.length > 0) {
        response.contextualSuggestions = contextualSuggestions.slice(0, 5);
      }
    }

    // For dry run, don't include sensitive execution details
    if (dryRun && result.command) {
      response.dryRunSummary = {
        wouldExecute: result.command.executionPlan.length,
        totalEstimatedTime: result.command.estimatedTime,
        riskAssessment: result.command.riskLevel,
        complexityLevel: result.command.complexity
      };
    }

    logger.info('Enhanced NLP API response', {
      userId: session.user.id,
      success: result.success,
      complexity: result.command?.complexity,
      stepCount: result.command?.executionPlan.length
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Enhanced NLP API error', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.headers.get('user-id') || 'unknown'
    });

    return NextResponse.json(
      { 
        error: "Internal server error",
        message: "Failed to process NLP request" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current context and suggestions
    const { enhancedNLPParser: nlpParser2 } = await import('@/lib/ai/enhanced-nlp-parser');
    const context = nlpParser2.getContext();
    const recentCommands = context.slice(-5); // Last 5 commands

    return NextResponse.json({
      contextSummary: {
        recentCommandsCount: recentCommands.length,
        recentEntities: [...new Set(recentCommands.map(cmd => cmd.entity))],
        recentActions: [...new Set(recentCommands.map(cmd => cmd.action))],
        averageConfidence: recentCommands.length > 0 
          ? recentCommands.reduce((sum, cmd) => sum + cmd.confidence, 0) / recentCommands.length 
          : 0
      },
      capabilities: {
        supportedActions: ['CREATE', 'UPDATE', 'DELETE', 'FETCH', 'ASSIGN', 'ANALYZE'],
        supportedEntities: ['CONTACT', 'USER', 'ORGANIZATION', 'WORKFLOW', 'CAMPAIGN', 'TASK', 'SEGMENT', 'TEMPLATE', 'LIST', 'INTEGRATION', 'JOURNEY', 'ABTEST', 'DATA'],
        complexityLevels: ['simple', 'moderate', 'complex', 'enterprise'],
        riskLevels: ['low', 'medium', 'high', 'critical']
      },
      examples: [
        {
          command: "Create a user john@company.com with name John Doe as Admin",
          complexity: "simple",
          description: "Creates a single user account with admin privileges"
        },
        {
          command: "Create organization Acme Corp and add admin user admin@acme.com",
          complexity: "moderate", 
          description: "Multi-step operation: creates organization then admin user"
        },
        {
          command: "Set up complete onboarding: create welcome campaign, add to nurture sequence, and track engagement",
          complexity: "complex",
          description: "Complex multi-step marketing automation setup"
        }
      ]
    });

  } catch (error) {
    logger.error('Enhanced NLP capabilities endpoint error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to get NLP capabilities" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Clear the context window
    const { enhancedNLPParser: nlpParser3 } = await import('@/lib/ai/enhanced-nlp-parser');
    nlpParser3.clearContext();

    logger.info('Enhanced NLP context cleared', {
      userId: session.user.id
    });

    return NextResponse.json({
      message: "NLP context cleared successfully"
    });

  } catch (error) {
    logger.error('Enhanced NLP context clear error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to clear NLP context" },
      { status: 500 }
    );
  }
}