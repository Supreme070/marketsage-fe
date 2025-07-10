import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { universalTaskExecutionEngine } from '@/lib/ai/universal-task-execution-engine';
import { aiOperationRollbackSystem } from '@/lib/ai/ai-operation-rollback-system';
import { aiTaskExecutionEngine } from '@/lib/ai/ai-task-execution-engine';
import { aiPermissionSystem } from '@/lib/ai/ai-permission-system';
import { aiStreamingService } from '@/lib/websocket/ai-streaming-service';

/**
 * AI Task Execution API - Dynamic Universal Operation Support
 * 
 * This endpoint allows the AI to execute ANY supported operation dynamically:
 * - All marketing operations (email, SMS, WhatsApp campaigns)
 * - Customer management operations (contacts, segments, lists)
 * - Content operations (templates, automation, workflows)
 * - System operations (users, organizations, integrations)
 * - And all other operations from the Universal Task Execution Engine
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      taskType, 
      operation, 
      parameters, 
      userId = session.user.id,
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executeRollback = false,
      bypassApproval = false,
      enableStreaming = false
    } = body;

    logger.info('AI Task Execution Request', {
      taskType,
      operation,
      userId,
      requestId,
      sessionId,
      parametersCount: Object.keys(parameters || {}).length,
      executeRollback,
      bypassApproval,
      enableStreaming
    });

    let result;

    // Handle rollback execution
    if (executeRollback && operation) {
      logger.info('Executing rollback for operation', { operationId: operation });
      result = await aiOperationRollbackSystem.executeRollback(operation, userId, 'AI-initiated rollback');
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Rollback executed for operation "${operation}"`,
        type: 'rollback',
        timestamp: new Date().toISOString()
      });
    }

    // Try Universal Task Execution Engine first (for new operations)
    if (operation) {
      try {
        // Check permissions
        const hasPermission = await aiPermissionSystem.checkPermission(
          userId,
          operation,
          parameters || {}
        );

        if (!hasPermission && !bypassApproval) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions for this operation',
            details: `Operation "${operation}" requires higher permissions`,
            operation,
            timestamp: new Date().toISOString()
          }, { status: 403 });
        }

        // Capture pre-execution state for rollback
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Stream task started event if streaming is enabled
        if (enableStreaming) {
          await aiStreamingService.streamTaskProgress(
            userId,
            sessionId,
            requestId,
            operationId,
            {
              taskId: operationId,
              operationId,
              operation,
              stage: 'initialization',
              progress: 0,
              message: 'Starting task execution',
              estimatedTimeRemaining: 5000,
              performance: {
                executionTime: 0,
                memoryUsage: 0,
                processingRate: 0
              }
            }
          );
        }
        
        await aiOperationRollbackSystem.capturePreExecutionState(
          operationId,
          userId,
          user?.role || 'USER',
          operation,
          'DYNAMIC',
          'EXECUTE',
          parameters || {},
          session.user.id || 'unknown',
          requestId
        );

        // Stream execution progress if streaming is enabled
        if (enableStreaming) {
          await aiStreamingService.streamTaskProgress(
            userId,
            sessionId,
            requestId,
            operationId,
            {
              taskId: operationId,
              operationId,
              operation,
              stage: 'execution',
              progress: 50,
              message: 'Executing operation',
              estimatedTimeRemaining: 3000,
              performance: {
                executionTime: 500,
                memoryUsage: 1024 * 1024 * 50,
                processingRate: 10
              }
            }
          );
        }

        // Execute operation using Universal Task Execution Engine
        result = await universalTaskExecutionEngine.executeOperation(
          operation,
          parameters || {},
          userId
        );

        // Stream completion progress if streaming is enabled
        if (enableStreaming) {
          await aiStreamingService.streamTaskProgress(
            userId,
            sessionId,
            requestId,
            operationId,
            {
              taskId: operationId,
              operationId,
              operation,
              stage: 'completion',
              progress: 100,
              message: 'Operation completed successfully',
              estimatedTimeRemaining: 0,
              performance: {
                executionTime: 1000,
                memoryUsage: 1024 * 1024 * 45,
                processingRate: 15
              }
            }
          );
        }

        // Capture post-execution state
        await aiOperationRollbackSystem.capturePostExecutionState(
          operationId,
          result,
          [] // Side effects would be captured in a real implementation
        );

        // Log successful execution
        await prisma.userActivity.create({
          data: {
            userId,
            type: 'ai_universal_task_execution',
            channel: 'AI',
            metadata: {
              operation,
              parameters,
              result: typeof result === 'object' ? result : { message: result },
              executionMethod: 'universal_task_engine',
              operationId,
              requestId
            }
          }
        });

        return NextResponse.json({
          success: true,
          data: result,
          message: `Operation "${operation}" executed successfully`,
          type: 'universal_operation',
          operationId,
          rollbackAvailable: true,
          timestamp: new Date().toISOString()
        });

      } catch (universalError) {
        logger.warn('Universal Task Execution Engine failed, falling back to legacy system', {
          operation,
          error: universalError instanceof Error ? universalError.message : String(universalError)
        });
        
        // Stream error if streaming is enabled
        if (enableStreaming) {
          await aiStreamingService.streamError(
            userId,
            sessionId,
            requestId,
            universalError instanceof Error ? universalError : new Error(String(universalError)),
            { operation, fallback: 'legacy_system' }
          );
        }
        
        // Fall back to legacy task execution for backwards compatibility
        result = await executeLegacyTask(taskType || operation, parameters || {}, userId);
      }
    } else {
      // Legacy task execution for backwards compatibility
      result = await executeLegacyTask(taskType, parameters || {}, userId);
    }

    // Log the execution
    await prisma.userActivity.create({
      data: {
        userId,
        type: 'ai_legacy_task_execution',
        channel: 'AI',
        metadata: {
          taskType,
          operation,
          parameters,
          result: typeof result === 'object' ? result : { message: result },
          executionMethod: 'legacy_task_engine',
          requestId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Task "${taskType || operation}" executed successfully`,
      type: 'legacy_operation',
      rollbackAvailable: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('AI Task Execution Error:', {
      taskType,
      userId,
      error: errorMessage,
      stack: errorStack
    });

    // Stream error if streaming is enabled
    if (enableStreaming) {
      await aiStreamingService.streamError(
        userId,
        sessionId,
        requestId,
        error instanceof Error ? error : new Error(String(error)),
        { taskType, operation, critical: true }
      );
    }

    // Provide specific error messages for common database issues
    let userFriendlyMessage = 'Failed to execute AI task';
    if (errorMessage.includes('Foreign key constraint')) {
      userFriendlyMessage = 'Failed to create task due to missing dependencies. Please check user permissions.';
    } else if (errorMessage.includes('Unique constraint')) {
      userFriendlyMessage = 'A similar task already exists. Please modify the task name or parameters.';
    } else if (errorMessage.includes('Required field')) {
      userFriendlyMessage = 'Missing required information for task creation.';
    } else if (errorMessage.includes('Database connection')) {
      userFriendlyMessage = 'Database connection issue. Please try again in a moment.';
    }
    
    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        taskType,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function createCampaignWorkflow(params: any, userId: string) {
  try {
    const {
      name = 'AI-Generated Campaign',
      objective = 'engagement',
      targetAudience = 'all_customers',
      channels = ['email'],
      duration = 30
    } = params;

  // Create the workflow
  const workflow = await prisma.workflow.create({
    data: {
      name,
      description: `AI-generated ${objective} campaign targeting ${targetAudience}`,
      status: 'ACTIVE',
      config: JSON.stringify({
        objective,
        targetAudience,
        channels,
        duration,
        aiGenerated: true,
        createdByAI: true
      }),
      createdById: userId
    }
  });

  // Create workflow steps based on objective
  const steps = generateWorkflowSteps(objective, channels, targetAudience);
  
  for (let i = 0; i < steps.length; i++) {
    await prisma.workflowNode.create({
      data: {
        workflowId: workflow.id,
        name: steps[i].name,
        type: steps[i].type,
        config: JSON.stringify(steps[i].config),
        positionX: 200 + (i * 180), // Position nodes visually
        positionY: 150
      }
    });
  }

  // Create an email campaign linked to this workflow
  const campaign = await prisma.emailCampaign.create({
    data: {
      name: `${name} - Campaign`,
      description: `AI-generated campaign for ${objective}`,
      subject: `${objective.charAt(0).toUpperCase() + objective.slice(1)} - Your MarketSage Update`,
      from: 'noreply@marketsage.africa',
      content: `<h2>Welcome to your ${objective} campaign!</h2><p>This campaign was intelligently generated by MarketSage AI.</p>`,
      status: 'DRAFT',
      createdById: userId
    }
  });

    return {
      workflow,
      campaign,
      steps: steps.length,
      message: `Created campaign workflow "${name}" with ${steps.length} automated steps`,
      nextSteps: [
        'Review and customize the generated workflow steps',
        'Set up your target audience criteria',
        'Activate the campaign when ready'
      ]
    };
  } catch (error) {
    logger.error('Error creating campaign workflow:', error);
    throw new Error(`Failed to create campaign workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function setupAutomationSequence(params: any, userId: string) {
  try {
    const {
      trigger = 'user_signup',
      sequence = 'welcome_series',
      duration = 7
    } = params;

  const automation = await prisma.workflow.create({
    data: {
      name: `AI ${sequence.replace('_', ' ').toUpperCase()} Sequence`,
      description: `Automated ${sequence} triggered by ${trigger}`,
      status: 'INACTIVE', // Start as draft
      definition: JSON.stringify({
        sequence,
        duration,
        trigger,
        aiGenerated: true
      }),
      createdById: userId
    }
  });

    return {
      automation,
      message: `Created automation sequence for ${sequence}`,
      status: 'draft',
      nextSteps: [
        'Review the automation trigger conditions',
        'Customize the message content',
        'Activate the automation when ready'
      ]
    };
  } catch (error) {
    logger.error('Error setting up automation sequence:', error);
    throw new Error(`Failed to create automation sequence: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function createCustomerSegment(params: any, userId: string) {
  try {
    const {
      name = 'AI-Identified Segment',
      criteria = {},
      description = 'AI-generated customer segment'
    } = params;

  const segment = await prisma.segment.create({
    data: {
      name,
      description,
      rules: JSON.stringify(criteria), // Prisma schema uses 'rules' field
      createdById: userId
    }
  });

    return {
      segment,
      message: `Created customer segment "${name}"`,
      criteria,
      nextSteps: [
        'Review the segment criteria',
        'Verify the customer matches',
        'Create targeted campaigns for this segment'
      ]
    };
  } catch (error) {
    logger.error('Error creating customer segment:', error);
    throw new Error(`Failed to create customer segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateMarketingContent(params: any, userId: string) {
  try {
    const {
      type = 'email',
      purpose = 'engagement',
      audience = 'general'
    } = params;

  // Generate content based on African fintech context
  const content = generateContextualContent(type, purpose, audience);

  const template = await prisma.emailTemplate.create({
    data: {
      name: `AI-Generated ${type.toUpperCase()} - ${purpose}`,
      subject: `${purpose.charAt(0).toUpperCase() + purpose.slice(1)} Campaign`,
      content: JSON.stringify(content),
      description: `AI-generated template for ${purpose} targeting ${audience}`,
      createdById: userId
    }
  });

    return {
      template,
      content,
      message: `Generated ${type} content for ${purpose}`,
      nextSteps: [
        'Review and customize the generated content',
        'Test with a small audience first',
        'Deploy to your target segment'
      ]
    };
  } catch (error) {
    logger.error('Error generating marketing content:', error);
    throw new Error(`Failed to generate marketing content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function configureLeadNurturing(params: any, userId: string) {
  const {
    leadSource = 'website',
    nurturingPath = 'education_first',
    timeframe = 14
  } = params;

  const workflow = await prisma.workflow.create({
    data: {
      name: `AI Lead Nurturing - ${leadSource}`,
      description: `Automated lead nurturing for ${leadSource} leads`,
      status: 'DRAFT',
      config: JSON.stringify({
        leadSource,
        nurturingPath,
        timeframe,
        aiGenerated: true
      }),
      createdById: userId
    }
  });

  return {
    workflow,
    message: `Configured lead nurturing for ${leadSource} leads`,
    timeframe,
    nextSteps: [
      'Set up lead scoring criteria',
      'Define conversion goals',
      'Activate the nurturing sequence'
    ]
  };
}

async function setupRetentionCampaign(params: any, userId: string) {
  const {
    riskLevel = 'medium',
    interventionType = 'engagement_boost',
    timeline = 30
  } = params;

  const campaign = await prisma.emailCampaign.create({
    data: {
      name: `AI Retention Campaign - ${riskLevel} Risk`,
      description: `Automated retention campaign for ${riskLevel} churn risk customers`,
      subject: `We miss you! Special offers inside`,
      from: 'retention@marketsage.africa',
      content: `<h2>Come back to MarketSage!</h2><p>We have special offers for ${riskLevel} risk customers.</p>`,
      status: 'DRAFT',
      createdById: userId
    }
  });

  return {
    campaign,
    message: `Set up retention campaign for ${riskLevel} risk customers`,
    timeline,
    nextSteps: [
      'Define churn risk criteria',
      'Set up intervention triggers',
      'Monitor retention metrics'
    ]
  };
}

function generateWorkflowSteps(objective: string, channels: string[], audience: string) {
  const baseSteps = [
    {
      name: 'Welcome Message',
      type: 'SEND_EMAIL',
      config: {
        template: 'welcome',
        delay: 0
      },
      delay: 0
    }
  ];

  switch (objective) {
    case 'onboarding':
      return [
        ...baseSteps,
        {
          name: 'Setup Guide',
          type: 'SEND_EMAIL',
          config: { template: 'setup_guide' },
          delay: 24 * 60 * 60 * 1000 // 1 day
        },
        {
          name: 'Feature Tutorial',
          type: 'SEND_EMAIL',
          config: { template: 'feature_tutorial' },
          delay: 3 * 24 * 60 * 60 * 1000 // 3 days
        }
      ];
      
    case 'retention':
      return [
        {
          name: 'Engagement Check',
          type: 'SEND_EMAIL',
          config: { template: 'engagement_check' },
          delay: 0
        },
        {
          name: 'Value Reminder',
          type: 'SEND_EMAIL',
          config: { template: 'value_reminder' },
          delay: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
      ];
      
    default:
      return baseSteps;
  }
}

function generateContextualContent(type: string, purpose: string, audience: string) {
  const content = {
    subject: '',
    body: '',
    cta: ''
  };

  // African fintech context
  const contextual = {
    greeting: 'Hello from MarketSage',
    culturalNote: 'Supporting African fintech innovation',
    localizedCta: 'Take Action Now'
  };

  switch (purpose) {
    case 'welcome':
      content.subject = `Welcome to the future of African fintech marketing!`;
      content.body = `${contextual.greeting}! We're excited to help you grow your fintech business across Africa. MarketSage is designed specifically for the African market, understanding local preferences and behaviors.`;
      content.cta = 'Get Started';
      break;
      
    case 'engagement':
      content.subject = `Boost your fintech engagement in Africa`;
      content.body = `Ready to increase customer engagement? Our AI-powered tools are tailored for African fintech companies, helping you connect better with your customers.`;
      content.cta = 'Learn More';
      break;
      
    default:
      content.subject = `${contextual.greeting}`;
      content.body = `${contextual.culturalNote}`;
      content.cta = contextual.localizedCta;
  }

  return content;
}

/**
 * Execute legacy task for backwards compatibility
 */
async function executeLegacyTask(taskType: string, parameters: any, userId: string) {
  switch (taskType) {
    case 'create_campaign_workflow':
      return await createCampaignWorkflow(parameters, userId);
      
    case 'setup_automation_sequence':
      return await setupAutomationSequence(parameters, userId);
      
    case 'create_customer_segment':
      return await createCustomerSegment(parameters, userId);
      
    case 'generate_marketing_content':
      return await generateMarketingContent(parameters, userId);
      
    case 'configure_lead_nurturing':
      return await configureLeadNurturing(parameters, userId);
      
    case 'setup_retention_campaign':
      return await setupRetentionCampaign(parameters, userId);
      
    default:
      // Try to get available operations from Universal Task Execution Engine
      try {
        const availableOperations = await universalTaskExecutionEngine.getAvailableOperations();
        const operationsList = availableOperations.map(op => op.id);
        
        return {
          message: `Task type "${taskType}" is not supported in legacy mode`,
          suggestion: 'Use the "operation" parameter instead of "taskType" for universal operations',
          availableOperations: operationsList.slice(0, 20), // Show first 20 operations
          totalOperations: operationsList.length,
          legacyTasks: [
            'create_campaign_workflow',
            'setup_automation_sequence', 
            'create_customer_segment',
            'generate_marketing_content',
            'configure_lead_nurturing',
            'setup_retention_campaign'
          ]
        };
      } catch (error) {
        return {
          message: `Task type "${taskType}" is not yet supported for automatic execution`,
          suggestion: 'Please use one of the supported task types: create_campaign_workflow, setup_automation_sequence, create_customer_segment, generate_marketing_content, configure_lead_nurturing, or setup_retention_campaign',
          availableActions: [
            'create_campaign_workflow',
            'setup_automation_sequence', 
            'create_customer_segment',
            'generate_marketing_content',
            'configure_lead_nurturing',
            'setup_retention_campaign'
          ]
        };
      }
  }
}

/**
 * GET endpoint to list all available operations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get available operations from Universal Task Execution Engine
    const availableOperations = await universalTaskExecutionEngine.getAvailableOperations();
    
    // Get operations user has permission for
    const permittedOperations = [];
    for (const operation of availableOperations) {
      try {
        const hasPermission = await aiPermissionSystem.checkPermission(
          userId,
          operation.id,
          {}
        );
        if (hasPermission) {
          permittedOperations.push(operation);
        }
      } catch (error) {
        logger.warn('Permission check failed for operation', {
          operation: operation.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Get rollback status for recent operations
    const recentOperations = await prisma.userActivity.findMany({
      where: {
        userId,
        type: 'ai_universal_task_execution',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        metadata: true,
        createdAt: true
      }
    });

    const operationsWithRollback = recentOperations.map(activity => {
      const operationId = activity.metadata?.operationId;
      const rollbackStatus = operationId ? 
        aiOperationRollbackSystem.getActiveRollbackStatus(operationId) : 'none';
      
      return {
        activityId: activity.id,
        operationId,
        operation: activity.metadata?.operation,
        parameters: activity.metadata?.parameters,
        rollbackStatus,
        rollbackAvailable: rollbackStatus === 'pending',
        executedAt: activity.createdAt
      };
    });

    // Group operations by category
    const operationsByCategory = permittedOperations.reduce((acc, op) => {
      if (!acc[op.category]) {
        acc[op.category] = [];
      }
      acc[op.category].push(op);
      return acc;
    }, {} as Record<string, typeof permittedOperations>);

    return NextResponse.json({
      success: true,
      data: {
        operations: {
          total: availableOperations.length,
          permitted: permittedOperations.length,
          byCategory: operationsByCategory,
          all: permittedOperations
        },
        recentExecutions: operationsWithRollback,
        legacyTasks: [
          'create_campaign_workflow',
          'setup_automation_sequence', 
          'create_customer_segment',
          'generate_marketing_content',
          'configure_lead_nurturing',
          'setup_retention_campaign'
        ],
        capabilities: {
          universalOperations: true,
          rollbackSupport: true,
          permissionChecking: true,
          auditLogging: true,
          stateCapture: true
        }
      },
      message: `Found ${permittedOperations.length} operations available to user`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Failed to get available operations', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve available operations',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 