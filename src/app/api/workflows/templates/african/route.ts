/**
 * African Workflow Templates API
 * =============================
 * Manage African market-specific workflow templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { africanWorkflowTemplateManager } from '@/lib/workflow/african-workflow-templates';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const language = searchParams.get('language');
    const action = searchParams.get('action');

    switch (action) {
      case 'list':
        const templates = africanWorkflowTemplateManager.getAvailableTemplates();
        return NextResponse.json({
          success: true,
          templates,
          count: templates.length
        });

      case 'by-country':
        if (!country) {
          return NextResponse.json({ error: 'Country parameter required' }, { status: 400 });
        }
        const countryTemplates = africanWorkflowTemplateManager.getTemplatesForCountry(country);
        return NextResponse.json({
          success: true,
          templates: countryTemplates,
          country,
          count: countryTemplates.length
        });

      case 'by-language':
        if (!language) {
          return NextResponse.json({ error: 'Language parameter required' }, { status: 400 });
        }
        const languageTemplates = africanWorkflowTemplateManager.getTemplatesByLanguage(language);
        return NextResponse.json({
          success: true,
          templates: languageTemplates,
          language,
          count: languageTemplates.length
        });

      case 'cultural-timing':
        if (!country) {
          return NextResponse.json({ error: 'Country parameter required' }, { status: 400 });
        }
        const timingRecommendations = await africanWorkflowTemplateManager.generateCulturalTimingRecommendations(country);
        return NextResponse.json({
          success: true,
          country,
          timing_recommendations: timingRecommendations
        });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    logger.error('African workflow templates API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, templateId, customizations } = body;

    switch (action) {
      case 'deploy':
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
        }

        const deployResult = await africanWorkflowTemplateManager.deployTemplate(
          templateId,
          customizations
        );

        return NextResponse.json({
          success: true,
          message: 'African workflow template deployed successfully',
          ...deployResult
        });

      case 'customize':
        if (!templateId || !customizations) {
          return NextResponse.json({ 
            error: 'Template ID and customizations required' 
          }, { status: 400 });
        }

        const customizedTemplate = await africanWorkflowTemplateManager.customizeTemplate(
          templateId,
          customizations
        );

        return NextResponse.json({
          success: true,
          message: 'Template customized successfully',
          customized_template: customizedTemplate
        });

      case 'analyze-performance':
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
        }

        const performanceAnalysis = await africanWorkflowTemplateManager.analyzeTemplatePerformance(templateId);

        return NextResponse.json({
          success: true,
          analysis: performanceAnalysis
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('African workflow templates POST API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}