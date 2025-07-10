import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { advancedTriggersService } from "@/lib/workflow/advanced-triggers-service";
import { unauthorized, handleApiError } from "@/lib/errors";
import prisma from "@/lib/db/prisma";

/**
 * GET - Get advanced triggers for a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const { id: workflowId } = params;

    // Get the workflow to parse its advanced triggers
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const definition = JSON.parse(workflow.definition);
    const triggerNodes = definition.nodes.filter((node: any) => node.type === 'triggerNode');
    
    // Analyze triggers for advanced capabilities
    const advancedTriggers = triggerNodes.map((node: any) => {
      const label = node.data?.label?.toLowerCase() || '';
      const properties = node.data?.properties || {};
      
      let triggerType = 'basic';
      let advancedConfig = null;
      
      // Identify advanced trigger types
      if (label.includes('schedule') || label.includes('time') || label.includes('daily') || label.includes('weekly') || label.includes('monthly')) {
        triggerType = 'time_based';
        advancedConfig = {
          type: label.includes('daily') ? 'RECURRING' : label.includes('weekly') ? 'RECURRING' : label.includes('monthly') ? 'RECURRING' : 'SCHEDULED',
          config: properties
        };
      } else if (label.includes('engagement') || label.includes('behavior') || label.includes('activity') || label.includes('inactivity')) {
        triggerType = 'behavioral';
        advancedConfig = {
          type: label.includes('engagement') ? 'ENGAGEMENT_SCORE' : label.includes('inactivity') ? 'INACTIVITY' : 'ACTIVITY_PATTERN',
          config: properties
        };
      } else if (label.includes('churn') || label.includes('prediction') || label.includes('likelihood')) {
        triggerType = 'predictive';
        advancedConfig = {
          type: label.includes('churn') ? 'CHURN_RISK' : label.includes('likelihood') ? 'CONVERSION_LIKELIHOOD' : 'PURCHASE_INTENT',
          config: properties
        };
      }
      
      return {
        nodeId: node.id,
        label: node.data?.label,
        triggerType,
        advancedConfig,
        properties
      };
    });

    return NextResponse.json({
      workflowId,
      advancedTriggers,
      summary: {
        totalTriggers: triggerNodes.length,
        timeBasedCount: advancedTriggers.filter(t => t.triggerType === 'time_based').length,
        behavioralCount: advancedTriggers.filter(t => t.triggerType === 'behavioral').length,
        predictiveCount: advancedTriggers.filter(t => t.triggerType === 'predictive').length,
        basicCount: advancedTriggers.filter(t => t.triggerType === 'basic').length,
      }
    });
  } catch (error) {
    console.error("Advanced triggers API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/triggers/advanced/route.ts");
  }
}

/**
 * POST - Process manual advanced trigger
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    const { id: workflowId } = params;
    const body = await request.json();
    const { triggerType, contactId, data } = body;

    if (!triggerType || !contactId) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing required fields: triggerType, contactId" },
        { status: 400 }
      );
    }

    // Process the advanced trigger based on type
    switch (triggerType) {
      case 'behavioral':
        await advancedTriggersService.processBehavioralTriggers(
          contactId,
          data.activityType || 'manual_trigger',
          data
        );
        break;

      case 'predictive':
        await advancedTriggersService.processPredictiveTriggers(
          contactId,
          data.predictions || {}
        );
        break;

      case 'time_based':
        // For manual time-based triggers, we can schedule them
        if (data.delayConfig) {
          await advancedTriggersService.scheduleDelayedTrigger(
            workflowId,
            contactId,
            data.delayConfig,
            data
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid trigger type", message: "Supported types: behavioral, predictive, time_based" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Advanced trigger processed successfully",
      triggerType,
      contactId,
      workflowId,
    });
  } catch (error) {
    console.error("Advanced triggers processing API Error:", error);
    return handleApiError(error, "/api/workflows/[id]/triggers/advanced/route.ts");
  }
}
