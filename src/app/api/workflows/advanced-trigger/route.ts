import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { 
  advancedTriggerEngine,
  type AdvancedTriggerCondition 
} from '@/lib/workflow/advanced-trigger-engine';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      workflowId, 
      contactId, 
      triggerConditions 
    } = body;

    if (!action || !workflowId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, workflowId, contactId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'evaluate':
        return await handleEvaluateTrigger(workflowId, contactId, triggerConditions);
      
      case 'trigger_if_conditions_met':
        return await handleTriggerIfConditionsMet(workflowId, contactId, triggerConditions);
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Advanced trigger API error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleEvaluateTrigger(
  workflowId: string,
  contactId: string,
  triggerConditions: AdvancedTriggerCondition[]
) {
  try {
    if (!Array.isArray(triggerConditions)) {
      return NextResponse.json(
        { error: 'triggerConditions must be an array' },
        { status: 400 }
      );
    }

    const result = await advancedTriggerEngine.evaluateAdvancedTrigger(
      workflowId,
      contactId,
      triggerConditions
    );

    return NextResponse.json({
      success: true,
      evaluation: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to evaluate advanced trigger', {
      error: error instanceof Error ? error.message : String(error),
      workflowId,
      contactId
    });

    return NextResponse.json(
      { error: 'Failed to evaluate trigger conditions' },
      { status: 500 }
    );
  }
}

async function handleTriggerIfConditionsMet(
  workflowId: string,
  contactId: string,
  triggerConditions: AdvancedTriggerCondition[]
) {
  try {
    if (!Array.isArray(triggerConditions)) {
      return NextResponse.json(
        { error: 'triggerConditions must be an array' },
        { status: 400 }
      );
    }

    const result = await advancedTriggerEngine.triggerWorkflowIfConditionsMet(
      workflowId,
      contactId,
      triggerConditions
    );

    return NextResponse.json({
      success: true,
      triggered: result.triggered,
      executionId: result.executionId,
      evaluation: result.result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to trigger workflow with advanced conditions', {
      error: error instanceof Error ? error.message : String(error),
      workflowId,
      contactId
    });

    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available trigger types and documentation
    const triggerTypes = [
      {
        type: 'behavioral_score_threshold',
        name: 'Behavioral Score Threshold',
        description: 'Trigger when customer behavioral score exceeds threshold',
        parameters: [
          { name: 'score_threshold', type: 'number', default: 0.7, description: 'Score threshold (0.0-1.0)' },
          { name: 'time_window_days', type: 'number', default: 7, description: 'Days to analyze' }
        ]
      },
      {
        type: 'engagement_drop_detection',
        name: 'Engagement Drop Detection',
        description: 'Trigger when engagement drops significantly',
        parameters: [
          { name: 'drop_percentage', type: 'number', default: 0.3, description: 'Drop threshold (0.0-1.0)' },
          { name: 'compare_window_days', type: 'number', default: 14, description: 'Comparison window' }
        ]
      },
      {
        type: 'churn_risk_alert',
        name: 'Churn Risk Alert',
        description: 'Trigger when churn risk exceeds threshold',
        parameters: [
          { name: 'risk_threshold', type: 'number', default: 0.6, description: 'Risk threshold (0.0-1.0)' }
        ]
      },
      {
        type: 'purchase_intent_spike',
        name: 'Purchase Intent Spike',
        description: 'Trigger when purchase intent signals increase',
        parameters: [
          { name: 'intent_threshold', type: 'number', default: 0.7, description: 'Intent threshold (0.0-1.0)' }
        ]
      },
      {
        type: 'optimal_engagement_window',
        name: 'Optimal Engagement Window',
        description: 'Trigger during optimal engagement time',
        parameters: []
      },
      {
        type: 'seasonal_behavior_pattern',
        name: 'Seasonal Behavior Pattern',
        description: 'Trigger based on seasonal patterns',
        parameters: [
          { name: 'seasonal_threshold', type: 'number', default: 0.6, description: 'Seasonal factor threshold' }
        ]
      },
      {
        type: 'cultural_event_timing',
        name: 'Cultural Event Timing',
        description: 'Trigger around cultural events in African markets',
        parameters: [
          { name: 'min_importance', type: 'number', default: 0.7, description: 'Minimum event importance' }
        ]
      },
      {
        type: 'payment_behavior_change',
        name: 'Payment Behavior Change',
        description: 'Trigger when payment patterns change (pending implementation)',
        parameters: []
      }
    ];

    return NextResponse.json({
      success: true,
      triggerTypes,
      africanMarketSupport: {
        countries: ['NG', 'KE', 'ZA', 'GH', 'EG'],
        features: [
          'Cultural event awareness',
          'Local business hours optimization',
          'Seasonal pattern recognition',
          'Currency and market context'
        ]
      },
      documentation: {
        usage: 'POST /api/workflows/advanced-trigger with action: "evaluate" or "trigger_if_conditions_met"',
        example: {
          action: 'trigger_if_conditions_met',
          workflowId: 'workflow-123',
          contactId: 'contact-456',
          triggerConditions: [
            {
              id: 'condition-1',
              type: 'behavioral_score_threshold',
              enabled: true,
              confidence_threshold: 0.8,
              parameters: {
                score_threshold: 0.7,
                time_window_days: 7
              },
              african_market_context: {
                countries: ['NG', 'KE'],
                cultural_factors: ['business_hours', 'seasonal_patterns'],
                local_timing_preferences: true
              }
            }
          ]
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get advanced trigger info', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to get trigger information' },
      { status: 500 }
    );
  }
}