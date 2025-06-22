import { type NextRequest, NextResponse } from 'next/server';
import { aiTaskEngine } from '@/lib/ai/task-automation-engine';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, triggerEvent, workflowId, campaignId } = body;

    if (!customerId || !triggerEvent) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, triggerEvent' },
        { status: 400 }
      );
    }

    // Create task context
    const context = {
      customerId,
      workflowId,
      campaignId,
      contactId: customerId,
      triggerEvent,
      customerData: {},
      behaviorData: {}
    };

    // Generate AI task suggestions
    const suggestions = await aiTaskEngine.generateTaskSuggestions(context);

    logger.info('Generated AI task suggestions', {
      customerId,
      triggerEvent,
      suggestionCount: suggestions.length
    });

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      message: `Generated ${suggestions.length} intelligent task suggestions`
    });

  } catch (error) {
    logger.error('Failed to generate AI task suggestions', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to generate task suggestions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, triggerEvent, executeAutomatic = false } = body;

    if (!customerId || !triggerEvent) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, triggerEvent' },
        { status: 400 }
      );
    }

    // Create task context
    const context = {
      customerId,
      contactId: customerId,
      triggerEvent,
      customerData: {},
      behaviorData: {}
    };

    let result;
    if (executeAutomatic) {
      // Execute high-confidence automatic tasks
      const taskIds = await aiTaskEngine.executeAutomaticTasks(context);
      result = {
        success: true,
        executedTasks: taskIds,
        count: taskIds.length,
        message: `Executed ${taskIds.length} automatic tasks`
      };
    } else {
      // Just generate suggestions
      const suggestions = await aiTaskEngine.generateTaskSuggestions(context);
      result = {
        success: true,
        suggestions,
        count: suggestions.length,
        message: `Generated ${suggestions.length} task suggestions`
      };
    }

    logger.info('AI task operation completed', {
      customerId,
      triggerEvent,
      executeAutomatic,
      resultCount: result.count
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Failed to execute AI task operation', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to execute task operation' },
      { status: 500 }
    );
  }
} 