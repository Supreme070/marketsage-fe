import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { AITaskAutomationEngine } from '@/lib/ai/task-automation-engine';

/**
 * AI Task Execution API
 * 
 * This endpoint allows the AI to actually execute tasks rather than just provide guidance:
 * - Create campaign workflows
 * - Set up automation sequences
 * - Generate and deploy marketing content
 * - Configure customer segments
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskType, parameters, userId = session.user.id } = body;

    logger.info('AI Task Execution Request', {
      taskType,
      userId,
      parametersCount: Object.keys(parameters || {}).length
    });

    const taskEngine = new AITaskAutomationEngine();
    let result;

    switch (taskType) {
      case 'create_campaign_workflow':
        result = await createCampaignWorkflow(parameters, userId);
        break;
        
      case 'setup_automation_sequence':
        result = await setupAutomationSequence(parameters, userId);
        break;
        
      case 'create_customer_segment':
        result = await createCustomerSegment(parameters, userId);
        break;
        
      case 'generate_marketing_content':
        result = await generateMarketingContent(parameters, userId);
        break;
        
      case 'configure_lead_nurturing':
        result = await configureLeadNurturing(parameters, userId);
        break;
        
      case 'setup_retention_campaign':
        result = await setupRetentionCampaign(parameters, userId);
        break;
        
      default:
        // For unknown task types, provide general guidance
        result = {
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

    // Log the execution
    await prisma.activity.create({
      data: {
        type: 'ai_task_execution',
        action: taskType,
        userId,
        details: JSON.stringify({
          taskType,
          parameters,
          result: typeof result === 'object' ? result : { message: result }
        })
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Task "${taskType}" executed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI Task Execution Error:', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function createCampaignWorkflow(params: any, userId: string) {
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
    await prisma.workflowStep.create({
      data: {
        workflowId: workflow.id,
        name: steps[i].name,
        type: steps[i].type,
        config: JSON.stringify(steps[i].config),
        order: i + 1,
        delay: steps[i].delay || 0
      }
    });
  }

  // Create a campaign linked to this workflow
  const campaign = await prisma.campaign.create({
    data: {
      name: `${name} - Campaign`,
      description: `AI-generated campaign for ${objective}`,
      type: 'EMAIL',
      status: 'DRAFT',
      config: JSON.stringify({
        workflowId: workflow.id,
        objective,
        aiGenerated: true
      }),
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
}

async function setupAutomationSequence(params: any, userId: string) {
  const {
    trigger = 'user_signup',
    sequence = 'welcome_series',
    duration = 7
  } = params;

  const automation = await prisma.automation.create({
    data: {
      name: `AI ${sequence.replace('_', ' ').toUpperCase()} Sequence`,
      description: `Automated ${sequence} triggered by ${trigger}`,
      trigger,
      isActive: false, // Start as draft
      config: JSON.stringify({
        sequence,
        duration,
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
}

async function createCustomerSegment(params: any, userId: string) {
  const {
    name = 'AI-Identified Segment',
    criteria = {},
    description = 'AI-generated customer segment'
  } = params;

  const segment = await prisma.segment.create({
    data: {
      name,
      description,
      criteria: JSON.stringify(criteria),
      isActive: true,
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
}

async function generateMarketingContent(params: any, userId: string) {
  const {
    type = 'email',
    purpose = 'engagement',
    audience = 'general'
  } = params;

  // Generate content based on African fintech context
  const content = generateContextualContent(type, purpose, audience);

  const template = await prisma.template.create({
    data: {
      name: `AI-Generated ${type.toUpperCase()} - ${purpose}`,
      type: type.toUpperCase(),
      content: JSON.stringify(content),
      isPublic: false,
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

  const campaign = await prisma.campaign.create({
    data: {
      name: `AI Retention Campaign - ${riskLevel} Risk`,
      description: `Automated retention campaign for ${riskLevel} churn risk customers`,
      type: 'EMAIL',
      status: 'DRAFT',
      config: JSON.stringify({
        riskLevel,
        interventionType,
        timeline,
        aiGenerated: true
      }),
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