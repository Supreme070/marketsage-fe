/**
 * Workflow Builder API
 * ===================
 * API for AI-powered workflow creation and management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schemas
const workflowBuildRequestSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  trigger: z.string().min(1, 'Trigger is required'),
  actions: z.array(z.string().min(1, 'Action cannot be empty')).min(1, 'At least one action is required').max(20, 'Too many actions'),
  conditions: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
  variables: z.record(z.any()).optional(),
  options: z.object({
    generatePreview: z.boolean().default(false),
    autoConnect: z.boolean().default(true),
    optimizeForPerformance: z.boolean().default(false)
  }).default({})
});

const templateCustomizationSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  customizations: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    variables: z.record(z.any()).optional()
  }).optional()
});

const nodeCreationSchema = z.object({
  description: z.string().min(1, 'Node description is required'),
  nodeType: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

// POST: Build workflow from natural language description
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = workflowBuildRequestSchema.parse(body);

    try {
      // Dynamic import
      const { workflowNodeBuilder } = await import('@/lib/ai/workflow-node-builder');
      type WorkflowBuildRequest = any; // Type imported as interface
      
      const buildRequest: WorkflowBuildRequest = {
        description: validatedData.description,
        trigger: validatedData.trigger,
        actions: validatedData.actions,
        conditions: validatedData.conditions,
        integrations: validatedData.integrations,
        variables: validatedData.variables,
        options: {
          generatePreview: validatedData.options?.generatePreview || false,
          autoConnect: validatedData.options?.autoConnect ?? true,
          optimizeForPerformance: validatedData.options?.optimizeForPerformance || false
        }
      };

      logger.info('AI workflow build requested', {
        userId: user.id,
        description: buildRequest.description.substring(0, 100),
        trigger: buildRequest.trigger,
        actionCount: buildRequest.actions.length,
        isPreview: buildRequest.options.generatePreview
      });

      const result = await workflowNodeBuilder.buildWorkflowFromDescription(
        buildRequest,
        user.id,
        user.role,
        user.organizationId
      );

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Failed to build workflow',
            errors: result.errors,
            warnings: result.warnings
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          workflowId: result.workflowId,
          nodes: result.nodes.map(node => ({
            id: node.id,
            type: node.type,
            name: node.name,
            description: node.description,
            position: node.position,
            config: {
              enabled: node.config.enabled,
              retryAttempts: node.config.retryAttempts,
              timeoutMs: node.config.timeoutMs
            },
            connections: node.connections,
            hasConditions: (node.conditions?.length || 0) > 0
          })),
          connections: result.connections,
          variables: result.variables,
          analysis: {
            complexity: result.estimatedComplexity,
            estimatedExecutionTime: result.estimatedExecutionTime,
            nodeCount: result.nodes.length,
            connectionCount: result.connections.length,
            variableCount: result.variables.length
          },
          insights: {
            suggestions: result.suggestions,
            warnings: result.warnings,
            isPreview: buildRequest.options.generatePreview
          }
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Workflow build failed', {
        error: errorMessage,
        userId: user.id,
        description: validatedData.description?.substring(0, 100)
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Workflow build API POST error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get workflow templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;

    try {
      const url = new URL(request.url);
      const category = url.searchParams.get('category');
      const action = url.searchParams.get('action');

      if (action === 'templates') {
        // Dynamic import and get workflow templates
        const { workflowNodeBuilder } = await import('@/lib/ai/workflow-node-builder');
        const templates = workflowNodeBuilder.getWorkflowTemplates(category || undefined);

        return NextResponse.json({
          success: true,
          data: {
            templates: templates.map(template => ({
              id: template.id,
              name: template.name,
              description: template.description,
              category: template.category,
              complexity: template.complexity,
              estimatedExecutionTime: template.estimatedExecutionTime,
              nodeCount: template.nodes.length,
              variableCount: template.variables.length,
              preview: {
                trigger: template.nodes.find(n => ['form_submission', 'time_trigger', 'webhook'].includes(n.type))?.type || 'unknown',
                actions: template.nodes.filter(n => !['form_submission', 'time_trigger', 'webhook'].includes(n.type)).map(n => n.type),
                hasConditions: template.nodes.some(n => n.conditions && n.conditions.length > 0)
              }
            })),
            categories: [...new Set(templates.map(t => t.category))],
            totalTemplates: templates.length
          }
        });
      }

      if (action === 'node-types') {
        // Get available node types
        return NextResponse.json({
          success: true,
          data: {
            nodeTypes: {
              triggers: [
                { type: 'form_submission', name: 'Form Submission', description: 'Triggered when a form is submitted' },
                { type: 'time_trigger', name: 'Scheduled Time', description: 'Triggered at specific times' },
                { type: 'webhook', name: 'Webhook', description: 'Triggered by external API calls' },
                { type: 'contact_created', name: 'Contact Created', description: 'Triggered when a new contact is created' },
                { type: 'contact_updated', name: 'Contact Updated', description: 'Triggered when a contact is updated' },
                { type: 'email_received', name: 'Email Received', description: 'Triggered when an email is received' }
              ],
              actions: [
                { type: 'send_email', name: 'Send Email', description: 'Send an email to contacts' },
                { type: 'send_sms', name: 'Send SMS', description: 'Send SMS message to contacts' },
                { type: 'send_whatsapp', name: 'Send WhatsApp', description: 'Send WhatsApp message to contacts' },
                { type: 'update_contact', name: 'Update Contact', description: 'Update contact information' },
                { type: 'add_to_list', name: 'Add to List', description: 'Add contact to a list' },
                { type: 'create_task', name: 'Create Task', description: 'Create a new task' },
                { type: 'api_call', name: 'API Call', description: 'Make external API call' }
              ],
              logic: [
                { type: 'condition', name: 'Condition', description: 'Branch workflow based on conditions' },
                { type: 'delay', name: 'Delay', description: 'Wait for specified time' },
                { type: 'split', name: 'Split', description: 'Split workflow into parallel branches' },
                { type: 'merge', name: 'Merge', description: 'Merge parallel branches' }
              ],
              integrations: [
                { type: 'zapier', name: 'Zapier', description: 'Connect with Zapier' },
                { type: 'slack', name: 'Slack', description: 'Send Slack notifications' },
                { type: 'salesforce', name: 'Salesforce', description: 'Integrate with Salesforce' }
              ],
              ai: [
                { type: 'ai_analysis', name: 'AI Analysis', description: 'Analyze data with AI' },
                { type: 'ai_generate_content', name: 'AI Content', description: 'Generate content with AI' },
                { type: 'ai_sentiment', name: 'AI Sentiment', description: 'Analyze sentiment with AI' }
              ]
            }
          }
        });
      }

      // Default: Return workflow capabilities
      return NextResponse.json({
        success: true,
        data: {
          capabilities: {
            maxNodes: 50,
            maxConnections: 100,
            maxVariables: 20,
            supportedTriggers: 6,
            supportedActions: 15,
            supportedIntegrations: 10
          },
          examples: [
            {
              description: 'Welcome new contacts with personalized email sequence',
              trigger: 'contact_created',
              actions: ['send_email', 'delay', 'send_email', 'add_to_list'],
              complexity: 'moderate'
            },
            {
              description: 'Send SMS reminder for abandoned form submissions',
              trigger: 'form_submission',
              actions: ['condition', 'delay', 'send_sms'],
              complexity: 'simple'
            },
            {
              description: 'AI-powered lead scoring and nurturing workflow',
              trigger: 'contact_updated',
              actions: ['ai_analysis', 'condition', 'update_contact', 'send_email'],
              complexity: 'advanced'
            }
          ]
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to get workflow data', {
        error: errorMessage,
        userId: user.id
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Workflow build API GET error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Customize workflow template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = templateCustomizationSchema.parse(body);

    try {
      logger.info('Workflow template customization requested', {
        userId: user.id,
        templateId: validatedData.templateId
      });

      // Dynamic import
      const { workflowNodeBuilder } = await import('@/lib/ai/workflow-node-builder');
      
      const result = await workflowNodeBuilder.customizeTemplate(
        validatedData.templateId,
        validatedData.customizations || {},
        user.id,
        user.organizationId
      );

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Failed to customize template',
            errors: result.errors,
            warnings: result.warnings
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          workflowId: result.workflowId,
          nodes: result.nodes.length,
          connections: result.connections.length,
          complexity: result.estimatedComplexity,
          estimatedExecutionTime: result.estimatedExecutionTime,
          message: 'Template customized and workflow created successfully'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Template customization failed', {
        error: errorMessage,
        userId: user.id,
        templateId: validatedData.templateId
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Workflow build API PUT error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Create individual workflow node
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    
    // Validate the request data
    const validatedData = nodeCreationSchema.parse(body);

    try {
      logger.info('Individual workflow node creation requested', {
        userId: user.id,
        description: validatedData.description.substring(0, 50),
        nodeType: validatedData.nodeType
      });

      // Dynamic import
      const { workflowNodeBuilder } = await import('@/lib/ai/workflow-node-builder');
      
      const node = await workflowNodeBuilder.createNodeFromDescription(
        validatedData.description,
        validatedData.nodeType as any,
        validatedData.position
      );

      return NextResponse.json({
        success: true,
        data: {
          node: {
            id: node.id,
            type: node.type,
            name: node.name,
            description: node.description,
            position: node.position,
            config: {
              enabled: node.config.enabled,
              retryAttempts: node.config.retryAttempts,
              timeoutMs: node.config.timeoutMs
            },
            hasConditions: (node.conditions?.length || 0) > 0,
            estimatedExecutionTime: node.metadata.averageExecutionTime
          },
          suggestions: [
            `Connect this node to other nodes to build your workflow`,
            `Configure the node settings for your specific use case`,
            `Test the node behavior before deploying`
          ]
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Node creation failed', {
        error: errorMessage,
        userId: user.id,
        description: validatedData.description?.substring(0, 50)
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Workflow build API PATCH error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}