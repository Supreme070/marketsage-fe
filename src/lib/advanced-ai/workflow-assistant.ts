/**
 * AI Workflow Assistant
 * 
 * Provides intelligent recommendations and optimizations for workflow automation,
 * helping users build more effective workflows based on best practices and
 * patterns identified from successful campaigns.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { Node, Edge } from 'reactflow';

/**
 * Types of workflow nodes
 */
export type NodeType = 'triggerNode' | 'actionNode' | 'conditionNode';

/**
 * Represents a recommendation for a workflow
 */
export interface WorkflowRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'ADD_NODE' | 'MODIFY_NODE' | 'ADD_CONNECTION' | 'OPTIMIZE' | 'GENERAL';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1
  actionData?: {
    nodeType?: NodeType;
    nodeName?: string;
    nodeIcon?: string;
    nodeDescription?: string;
    nodePosition?: { x: number, y: number };
    properties?: Record<string, any>;
    targetNodeId?: string;
    sourceNodeId?: string;
  };
}

/**
 * Workflow goal categories
 */
export type WorkflowGoal = 
  | 'LEAD_NURTURING' 
  | 'ONBOARDING' 
  | 'ABANDONED_CART_RECOVERY'
  | 'CUSTOMER_RETENTION'
  | 'EVENT_REGISTRATION'
  | 'RE_ENGAGEMENT'
  | 'FEEDBACK_COLLECTION'
  | 'CROSS_SELLING'
  | 'SUBSCRIPTION_RENEWAL'
  | 'DATA_ENRICHMENT'
  | 'GENERAL';

/**
 * Options for workflow recommendations
 */
export interface WorkflowRecommendationOptions {
  goal?: WorkflowGoal;
  industry?: string;
  specificObjective?: string;
  existingTargetAudience?: string[];
}

/**
 * Generate recommendations for a workflow based on its current structure
 * and the user's goals
 */
export async function getWorkflowRecommendations(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowRecommendationOptions = {}
): Promise<WorkflowRecommendation[]> {
  try {
    // Initialize recommendations array
    const recommendations: WorkflowRecommendation[] = [];
    
    // Set default goal if not provided
    const goal = options.goal || 'GENERAL';
    
    // Analyze workflow structure
    const structureRecommendations = analyzeWorkflowStructure(nodes, edges);
    recommendations.push(...structureRecommendations);
    
    // Get goal-specific recommendations
    const goalRecommendations = getGoalBasedRecommendations(goal, nodes, edges, options);
    recommendations.push(...goalRecommendations);
    
    // Check for missing best practices
    const bestPracticeRecommendations = checkBestPractices(nodes, edges);
    recommendations.push(...bestPracticeRecommendations);
    
    // Get industry-specific recommendations if industry is provided
    if (options.industry) {
      const industryRecommendations = getIndustrySpecificRecommendations(options.industry, nodes);
      recommendations.push(...industryRecommendations);
    }
    
    // Sort recommendations by impact and confidence
    return recommendations.sort((a, b) => {
      // Sort by impact first (HIGH > MEDIUM > LOW)
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      
      if (impactDiff !== 0) return -impactDiff; // Higher impact first
      
      // Then sort by confidence
      return b.confidence - a.confidence; // Higher confidence first
    });
  } catch (error) {
    // Enhanced error handling for Docker environment
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for connection issues which are common in Docker environments
    if (errorMessage.includes('connection') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('network')) {
      logger.warn(`Docker environment connection issue detected: ${errorMessage}`);
      
      // Return a minimal set of recommendations that don't require DB access
      return [
        {
          id: `docker_fallback_${Date.now()}`,
          title: "Add branching logic",
          description: "Your workflow could benefit from branching logic based on user behavior or conditions.",
          type: "GENERAL",
          impact: "MEDIUM",
          confidence: 0.8
        },
        {
          id: `docker_fallback_spacing_${Date.now()}`,
          title: "Add spacing between messages",
          description: "Consider adding wait nodes between messages to space them out and improve engagement.",
          type: "GENERAL",
          impact: "MEDIUM",
          confidence: 0.85
        }
      ];
    }
    
    logger.error("Error generating workflow recommendations", error);
    return [];
  }
}

/**
 * Analyze workflow structure and provide basic recommendations
 */
function analyzeWorkflowStructure(nodes: Node[], edges: Edge[]): WorkflowRecommendation[] {
  const recommendations: WorkflowRecommendation[] = [];
  
  // Check if workflow has any nodes
  if (nodes.length === 0) {
    recommendations.push({
      id: `structure_empty_${Date.now()}`,
      title: "Start with a trigger",
      description: "Begin your workflow by adding a trigger that will start the automation.",
      type: "ADD_NODE",
      impact: "HIGH",
      confidence: 1.0,
      actionData: {
        nodeType: "triggerNode",
        nodeName: "Contact added to list",
        nodeIcon: "List",
        nodeDescription: "When a contact is added to a specified list",
        nodePosition: { x: 250, y: 100 }
      }
    });
    return recommendations;
  }
  
  // Check if workflow has a trigger node
  const hasTrigger = nodes.some(node => node.type === 'triggerNode');
  if (!hasTrigger) {
    recommendations.push({
      id: `structure_no_trigger_${Date.now()}`,
      title: "Add a trigger",
      description: "Every workflow needs a trigger to start the automation. Add a trigger node to define when this workflow should run.",
      type: "ADD_NODE",
      impact: "HIGH",
      confidence: 1.0,
      actionData: {
        nodeType: "triggerNode",
        nodeName: "Contact added to list",
        nodeIcon: "List",
        nodeDescription: "When a contact is added to a specified list",
        nodePosition: { x: 250, y: 100 }
      }
    });
  }
  
  // Check if workflow has an action node
  const hasAction = nodes.some(node => node.type === 'actionNode');
  if (!hasAction && hasTrigger) {
    // Find the trigger node to position the action after it
    const triggerNode = nodes.find(node => node.type === 'triggerNode');
    const actionX = triggerNode ? triggerNode.position.x : 250;
    const actionY = triggerNode ? triggerNode.position.y + 150 : 250;
    
    recommendations.push({
      id: `structure_no_action_${Date.now()}`,
      title: "Add an action",
      description: "Your workflow needs at least one action. Add an action node to define what should happen when the trigger is activated.",
      type: "ADD_NODE",
      impact: "HIGH",
      confidence: 1.0,
      actionData: {
        nodeType: "actionNode",
        nodeName: "Send Email",
        nodeIcon: "Mail",
        nodeDescription: "Send an email to the contact",
        nodePosition: { x: actionX, y: actionY }
      }
    });
  }
  
  // Check for disconnected nodes (except triggers which may have no incoming connections)
  const connectedNodeIds = new Set<string>();
  
  // Add all source and target nodes to the set
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  
  // Find disconnected non-trigger nodes
  const disconnectedNodes = nodes.filter(
    node => node.type !== 'triggerNode' && !connectedNodeIds.has(node.id)
  );
  
  if (disconnectedNodes.length > 0) {
    // Find a potential node to connect to
    const potentialSourceNodes = nodes.filter(node => 
      node.id !== disconnectedNodes[0].id && 
      !edges.some(edge => edge.source === node.id && edge.target === disconnectedNodes[0].id)
    );
    
    if (potentialSourceNodes.length > 0) {
      recommendations.push({
        id: `structure_disconnected_${Date.now()}`,
        title: "Connect disconnected node",
        description: `You have ${disconnectedNodes.length} disconnected node(s). Connect them to your workflow to ensure they are part of the automation.`,
        type: "ADD_CONNECTION",
        impact: "HIGH",
        confidence: 0.95,
        actionData: {
          sourceNodeId: potentialSourceNodes[0].id,
          targetNodeId: disconnectedNodes[0].id
        }
      });
    }
  }
  
  return recommendations;
}

/**
 * Get recommendations based on the workflow goal
 */
function getGoalBasedRecommendations(
  goal: WorkflowGoal,
  nodes: Node[],
  edges: Edge[],
  options: WorkflowRecommendationOptions
): WorkflowRecommendation[] {
  const recommendations: WorkflowRecommendation[] = [];
  
  // Extract node types from the workflow
  const nodeTypes = nodes.map(node => node.type);
  const nodeLabels = nodes.map(node => node.data?.label || '');
  
  // Check if we have an email action
  const hasEmailAction = nodeLabels.some(label => label.includes('Email'));
  // Check if we have an SMS action
  const hasSmsAction = nodeLabels.some(label => label.includes('SMS'));
  // Check if we have a wait/delay action
  const hasWaitAction = nodeLabels.some(label => label.includes('Wait'));
  // Check if we have a condition node
  const hasConditionNode = nodeTypes.includes('conditionNode');
  
  switch (goal) {
    case 'LEAD_NURTURING':
      // Lead nurturing typically involves multiple touchpoints over time
      if (!hasWaitAction) {
        recommendations.push({
          id: `goal_nurture_wait_${Date.now()}`,
          title: "Add waiting period",
          description: "Lead nurturing works best with multiple messages spread over time. Add a waiting period between messages.",
          type: "ADD_NODE",
          impact: "HIGH",
          confidence: 0.9,
          actionData: {
            nodeType: "actionNode",
            nodeName: "Wait",
            nodeIcon: "Clock",
            nodeDescription: "Wait for a specific amount of time",
            properties: {
              waitAmount: 3,
              waitUnit: "days"
            }
          }
        });
      }
      
      // Recommend adding multiple touchpoints if there's only one message
      if (hasEmailAction && !hasSmsAction && nodes.length < 4) {
        recommendations.push({
          id: `goal_nurture_multi_channel_${Date.now()}`,
          title: "Add multi-channel touchpoint",
          description: "Increase engagement by adding an SMS follow-up to your email sequence.",
          type: "ADD_NODE",
          impact: "MEDIUM",
          confidence: 0.85,
          actionData: {
            nodeType: "actionNode",
            nodeName: "Send SMS",
            nodeIcon: "MessageSquare",
            nodeDescription: "Send an SMS message to the contact"
          }
        });
      }
      
      // Recommend adding engagement tracking if missing
      if (!hasConditionNode) {
        recommendations.push({
          id: `goal_nurture_track_engagement_${Date.now()}`,
          title: "Track engagement",
          description: "Add a condition to check if contacts engaged with your email, and send different follow-ups based on their activity.",
          type: "ADD_NODE",
          impact: "MEDIUM",
          confidence: 0.8,
          actionData: {
            nodeType: "conditionNode",
            nodeName: "Email opened?",
            nodeIcon: "GitBranch",
            nodeDescription: "Check if the contact opened the email"
          }
        });
      }
      break;
      
    case 'ABANDONED_CART_RECOVERY':
      // Abandoned cart recovery typically needs quick initial follow-up
      if (hasWaitAction) {
        const waitNode = nodes.find(node => node.data?.label?.includes('Wait'));
        if (waitNode && waitNode.data?.properties?.waitAmount > 1) {
          recommendations.push({
            id: `goal_cart_quick_followup_${Date.now()}`,
            title: "Speed up initial follow-up",
            description: "For abandoned cart recovery, the first follow-up should be sent within hours, not days. Consider reducing the waiting time.",
            type: "MODIFY_NODE",
            impact: "HIGH",
            confidence: 0.9,
            actionData: {
              nodeType: "actionNode",
              nodeIcon: "Clock",
              properties: {
                waitAmount: 4,
                waitUnit: "hours"
              }
            }
          });
        }
      }
      
      // Recommend adding a discount incentive if not present
      const hasDiscount = nodes.some(node => 
        node.data?.properties?.subject?.includes('discount') || 
        node.data?.properties?.subject?.includes('offer') ||
        node.data?.properties?.subject?.includes('%')
      );
      
      if (!hasDiscount) {
        recommendations.push({
          id: `goal_cart_incentive_${Date.now()}`,
          title: "Add discount incentive",
          description: "Increase conversion rate by offering a limited-time discount in your abandoned cart emails.",
          type: "MODIFY_NODE",
          impact: "HIGH",
          confidence: 0.85
        });
      }
      break;
      
    case 'ONBOARDING':
      // Onboarding typically involves education and multiple steps
      if (nodes.length < 4) {
        recommendations.push({
          id: `goal_onboarding_series_${Date.now()}`,
          title: "Create a full onboarding series",
          description: "Effective onboarding usually requires 3-5 emails spread over 1-2 weeks. Consider adding more educational steps to your workflow.",
          type: "GENERAL",
          impact: "MEDIUM",
          confidence: 0.9
        });
      }
      
      // Check for educational content
      recommendations.push({
        id: `goal_onboarding_educational_${Date.now()}`,
        title: "Include educational content",
        description: "Make sure your onboarding emails include educational content like guides, tutorials, and tips for getting started.",
        type: "GENERAL",
        impact: "MEDIUM",
        confidence: 0.85
      });
      break;
    
    // Add more goal-specific recommendations for other goals
    default:
      // General recommendations for any type of workflow
      if (nodes.length > 3 && !hasConditionNode) {
        recommendations.push({
          id: `goal_general_personalize_${Date.now()}`,
          title: "Personalize your workflow",
          description: "Add branching logic to create personalized experiences based on user behavior or preferences.",
          type: "ADD_NODE",
          impact: "MEDIUM",
          confidence: 0.8,
          actionData: {
            nodeType: "conditionNode",
            nodeName: "If/Else",
            nodeIcon: "GitBranch",
            nodeDescription: "Branch based on a condition"
          }
        });
      }
  }
  
  return recommendations;
}

/**
 * Check for best practices and provide recommendations
 */
function checkBestPractices(nodes: Node[], edges: Edge[]): WorkflowRecommendation[] {
  const recommendations: WorkflowRecommendation[] = [];
  
  // Check if the workflow is too linear (no branches)
  if (nodes.length > 4 && !nodes.some(node => node.type === 'conditionNode')) {
    recommendations.push({
      id: `practice_linear_${Date.now()}`,
      title: "Add branching logic",
      description: "Your workflow is very linear. Adding branching logic based on user behavior can significantly improve engagement.",
      type: "GENERAL",
      impact: "MEDIUM",
      confidence: 0.8
    });
  }
  
  // Check if emails have proper spacing
  const emailNodes = nodes.filter(node => 
    node.data?.label === 'Send Email'
  );
  
  if (emailNodes.length > 1) {
    const hasWaitBetweenEmails = edges.some(edge => {
      // Check if the source is an email and target is a wait node
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      return sourceNode?.data?.label === 'Send Email' && 
             targetNode?.data?.label === 'Wait';
    });
    
    if (!hasWaitBetweenEmails) {
      recommendations.push({
        id: `practice_email_spacing_${Date.now()}`,
        title: "Add spacing between emails",
        description: "Sending multiple emails too close together can lead to fatigue. Add wait nodes between emails to space them out.",
        type: "GENERAL",
        impact: "MEDIUM",
        confidence: 0.85
      });
    }
  }
  
  // Check if there's an end node or clear endpoint
  const endNodes = nodes.filter(node => 
    !edges.some(edge => edge.source === node.id)
  );
  
  if (endNodes.length === 0 && nodes.length > 1) {
    recommendations.push({
      id: `practice_no_endpoint_${Date.now()}`,
      title: "Define a clear endpoint",
      description: "Your workflow doesn't have a clear endpoint. Consider adding a final action that marks the completion of the workflow.",
      type: "GENERAL",
      impact: "LOW",
      confidence: 0.7
    });
  }
  
  return recommendations;
}

/**
 * Get industry-specific recommendations
 */
function getIndustrySpecificRecommendations(
  industry: string,
  nodes: Node[]
): WorkflowRecommendation[] {
  const recommendations: WorkflowRecommendation[] = [];
  
  switch (industry.toLowerCase()) {
    case 'ecommerce':
    case 'retail':
      if (!nodes.some(node => node.data?.label === 'Add tag')) {
        recommendations.push({
          id: `industry_ecomm_tags_${Date.now()}`,
          title: "Add product interest tagging",
          description: "For e-commerce, tagging contacts based on product interests helps create more targeted campaigns.",
          type: "ADD_NODE",
          impact: "MEDIUM",
          confidence: 0.85,
          actionData: {
            nodeType: "actionNode",
            nodeName: "Add tag",
            nodeIcon: "Tag",
            nodeDescription: "Add a product interest tag to the contact"
          }
        });
      }
      break;
      
    case 'saas':
    case 'software':
      recommendations.push({
        id: `industry_saas_feature_${Date.now()}`,
        title: "Track feature adoption",
        description: "For SaaS businesses, tracking feature adoption is crucial. Consider adding logic to identify and follow up with users who haven't adopted key features.",
        type: "GENERAL",
        impact: "HIGH",
        confidence: 0.9
      });
      break;
      
    case 'education':
      recommendations.push({
        id: `industry_edu_progressive_${Date.now()}`,
        title: "Progressive education approach",
        description: "Educational workflows work best with progressive complexity. Start with basics and gradually introduce more advanced concepts.",
        type: "GENERAL",
        impact: "MEDIUM",
        confidence: 0.85
      });
      break;
      
    case 'finance':
    case 'banking':
    case 'insurance':
      recommendations.push({
        id: `industry_finance_compliance_${Date.now()}`,
        title: "Add compliance check",
        description: "For financial services, ensure compliance with regulations by adding a final approval step for all outgoing communications.",
        type: "GENERAL",
        impact: "HIGH",
        confidence: 0.95
      });
      break;
  }
  
  return recommendations;
}

/**
 * Suggest optimal workflow template based on user goals
 */
export async function suggestWorkflowTemplate(
  goal: WorkflowGoal,
  options: WorkflowRecommendationOptions = {}
): Promise<{
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}> {
  try {
    // In a production implementation, this would fetch predefined templates 
    // from a database based on the goal and customize them.
    // For now, return hardcoded templates for demonstration
    
    switch (goal) {
      case 'LEAD_NURTURING':
        return {
          name: "3-Step Lead Nurturing Sequence",
          description: "A proven lead nurturing sequence with educational content, engagement tracking, and personalized follow-ups.",
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "Contact added to list",
                description: "When a contact is added to a specified list",
                icon: "List",
                properties: {
                  listId: "",
                  listName: "Lead List"
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 200 },
              data: {
                label: "Send Email",
                description: "Send welcome and introduction email",
                icon: "Mail",
                properties: {
                  subject: "Welcome to [Company]",
                  templateName: "Welcome Email"
                }
              }
            },
            {
              id: "wait-1",
              type: "actionNode",
              position: { x: 250, y: 300 },
              data: {
                label: "Wait",
                description: "Wait for 2 days",
                icon: "Clock",
                properties: {
                  waitAmount: 2,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "condition-1",
              type: "conditionNode",
              position: { x: 250, y: 400 },
              data: {
                label: "Email opened?",
                description: "Check if the contact opened the first email",
                icon: "GitBranch",
                properties: {
                  condition: "EMAIL_OPENED",
                  emailId: "action-1"
                }
              }
            },
            {
              id: "action-2a",
              type: "actionNode",
              position: { x: 100, y: 500 },
              data: {
                label: "Send Email",
                description: "Send educational content for engaged users",
                icon: "Mail",
                properties: {
                  subject: "Deep dive: [Topic]",
                  templateName: "Educational Email - Engaged"
                }
              }
            },
            {
              id: "action-2b",
              type: "actionNode",
              position: { x: 400, y: 500 },
              data: {
                label: "Send Email",
                description: "Send reminder with value proposition",
                icon: "Mail",
                properties: {
                  subject: "Did you miss our introduction?",
                  templateName: "Reminder Email"
                }
              }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
            { id: 'e2-3', source: 'action-1', target: 'wait-1' },
            { id: 'e3-4', source: 'wait-1', target: 'condition-1' },
            { id: 'e4-5a', source: 'condition-1', target: 'action-2a', sourceHandle: 'true', targetHandle: 'in' },
            { id: 'e4-5b', source: 'condition-1', target: 'action-2b', sourceHandle: 'false', targetHandle: 'in' }
          ]
        };
        
      case 'ABANDONED_CART_RECOVERY':
        return {
          name: "Abandoned Cart Recovery Sequence",
          description: "A high-converting abandoned cart recovery sequence with timely reminders and incentives.",
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "Cart abandoned",
                description: "When a user abandons their shopping cart",
                icon: "ShoppingCart",
                properties: {}
              }
            },
            {
              id: "wait-1",
              type: "actionNode",
              position: { x: 250, y: 200 },
              data: {
                label: "Wait",
                description: "Wait for 1 hour",
                icon: "Clock",
                properties: {
                  waitAmount: 1,
                  waitUnit: "hours"
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 300 },
              data: {
                label: "Send Email",
                description: "Reminder about items in cart",
                icon: "Mail",
                properties: {
                  subject: "Did you forget something?",
                  templateName: "Cart Reminder"
                }
              }
            },
            {
              id: "condition-1",
              type: "conditionNode",
              position: { x: 250, y: 400 },
              data: {
                label: "Returned to cart?",
                description: "Check if user returned to cart",
                icon: "GitBranch",
                properties: {
                  condition: "EVENT_OCCURRED",
                  eventName: "cart_view"
                }
              }
            },
            {
              id: "wait-2",
              type: "actionNode",
              position: { x: 400, y: 500 },
              data: {
                label: "Wait",
                description: "Wait for 24 hours",
                icon: "Clock",
                properties: {
                  waitAmount: 24,
                  waitUnit: "hours"
                }
              }
            },
            {
              id: "action-2",
              type: "actionNode",
              position: { x: 400, y: 600 },
              data: {
                label: "Send Email",
                description: "Offer discount to complete purchase",
                icon: "Mail",
                properties: {
                  subject: "Special 10% discount on your cart",
                  templateName: "Cart Discount"
                }
              }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'wait-1' },
            { id: 'e2-3', source: 'wait-1', target: 'action-1' },
            { id: 'e3-4', source: 'action-1', target: 'condition-1' },
            { id: 'e4-5', source: 'condition-1', target: 'wait-2', sourceHandle: 'false', targetHandle: 'in' },
            { id: 'e5-6', source: 'wait-2', target: 'action-2' }
          ]
        };
        
      // Add more template cases here
        
      default:
        // General workflow template
        return {
          name: "Basic Automation Sequence",
          description: "A simple automation sequence to get you started.",
          nodes: [
            {
              id: "trigger-1",
              type: "triggerNode",
              position: { x: 250, y: 100 },
              data: {
                label: "Contact added to list",
                description: "When a contact is added to a specified list",
                icon: "List",
                properties: {
                  listId: "",
                  listName: "Select a list..."
                }
              }
            },
            {
              id: "action-1",
              type: "actionNode",
              position: { x: 250, y: 200 },
              data: {
                label: "Send Email",
                description: "Send an email to the contact",
                icon: "Mail",
                properties: {
                  subject: "Welcome message",
                  templateName: "Welcome Email"
                }
              }
            },
            {
              id: "wait-1",
              type: "actionNode",
              position: { x: 250, y: 300 },
              data: {
                label: "Wait",
                description: "Wait for 3 days",
                icon: "Clock",
                properties: {
                  waitAmount: 3,
                  waitUnit: "days"
                }
              }
            },
            {
              id: "action-2",
              type: "actionNode",
              position: { x: 250, y: 400 },
              data: {
                label: "Send Email",
                description: "Send a follow-up email",
                icon: "Mail",
                properties: {
                  subject: "Follow-up message",
                  templateName: "Follow-up Email"
                }
              }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
            { id: 'e2-3', source: 'action-1', target: 'wait-1' },
            { id: 'e3-4', source: 'wait-1', target: 'action-2' }
          ]
        };
    }
  } catch (error) {
    // Handle any Docker environment issues
    logger.warn(`Error suggesting workflow template, falling back to basic template: ${error}`);
    
    // Return a simple template that works even with connection issues
    return {
      name: "Basic Automation Sequence",
      description: "A simple automation sequence to get you started.",
      nodes: [
        {
          id: "trigger-1",
          type: "triggerNode",
          position: { x: 250, y: 100 },
          data: {
            label: "Contact added to list",
            description: "When a contact is added to a specified list",
            icon: "List",
            properties: {
              listId: "",
              listName: "Select a list..."
            }
          }
        },
        {
          id: "action-1",
          type: "actionNode",
          position: { x: 250, y: 200 },
          data: {
            label: "Send Email",
            description: "Send an email to the contact",
            icon: "Mail",
            properties: {
              subject: "Welcome message",
              templateName: "Welcome Email"
            }
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'action-1' }
      ]
    };
  }
} 