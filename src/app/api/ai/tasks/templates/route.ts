/**
 * Smart Task Templates API
 * =======================
 * AI-powered task template management and suggestions
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smartTaskTemplateEngine } from '@/lib/ai/smart-task-templates';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = session.user.id;

    switch (action) {
      case 'recommendations':
        const currentProject = searchParams.get('project');
        const recentActivities = searchParams.get('activities')?.split(',') || [];
        
        const recommendations = await smartTaskTemplateEngine.getPersonalizedTemplateRecommendations(
          userId,
          {
            current_project: currentProject || undefined,
            recent_activities: recentActivities
          }
        );

        return NextResponse.json({
          success: true,
          recommendations
        });

      case 'analyze':
        const analysisResults = await smartTaskTemplateEngine.analyzeAndImproveTemplates(userId);

        return NextResponse.json({
          success: true,
          analysis: analysisResults
        });

      default:
        return NextResponse.json({
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Smart task templates GET API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process template request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const userId = session.user.id;

    switch (action) {
      case 'generate_suggestions':
        const {
          trigger_event,
          context,
          options = {}
        } = body;

        if (!trigger_event || !context) {
          return NextResponse.json({
            error: 'Trigger event and context required'
          }, { status: 400 });
        }

        const suggestions = await smartTaskTemplateEngine.generateTaskSuggestions(
          {
            user_id: userId,
            recent_tasks: context.recent_tasks || [],
            user_role: context.user_role || 'user',
            industry: context.industry || 'general',
            current_projects: context.current_projects || [],
            team_size: context.team_size || 1,
            african_market_context: context.african_market_context
          },
          trigger_event,
          options
        );

        return NextResponse.json({
          success: true,
          suggestions,
          message: `Generated ${suggestions.length} AI-powered task suggestions`
        });

      case 'apply_template':
        const {
          template_id,
          customizations = {}
        } = body;

        if (!template_id) {
          return NextResponse.json({
            error: 'Template ID required'
          }, { status: 400 });
        }

        const applicationResult = await smartTaskTemplateEngine.applyTemplateToCreateTask(
          template_id,
          userId,
          customizations
        );

        return NextResponse.json({
          success: true,
          message: 'Template applied successfully',
          ...applicationResult
        });

      case 'create_from_pattern':
        const {
          pattern_analysis,
          template_metadata
        } = body;

        if (!pattern_analysis || !template_metadata) {
          return NextResponse.json({
            error: 'Pattern analysis and template metadata required'
          }, { status: 400 });
        }

        const newTemplate = await smartTaskTemplateEngine.createSmartTemplateFromPattern(
          userId,
          pattern_analysis,
          template_metadata
        );

        return NextResponse.json({
          success: true,
          message: 'Smart template created from pattern',
          template: newTemplate
        });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Smart task templates POST API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process template request'
    }, { status: 500 });
  }
}