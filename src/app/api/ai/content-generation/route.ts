/**
 * Autonomous Content Generation API Endpoints
 * ==========================================
 * RESTful API for AI-powered content creation and management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
// Dynamic import to prevent circular dependencies - imported in functions
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';

/**
 * GET /api/ai/content-generation - Get content generation data
 */
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('content-generation-api');
  
  return tracer.startActiveSpan('get-content-generation-data', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      const requestId = url.searchParams.get('requestId');
      const organizationId = url.searchParams.get('organizationId') || session.user.organizationId;

      span.setAttributes({
        'content.action': action || 'overview',
        'content.organization_id': organizationId,
        'content.user_id': session.user.id,
        'content.user_role': session.user.role || ''
      });

      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      switch (action) {
        case 'generated_content':
          if (!requestId) {
            return NextResponse.json({ error: 'Request ID required for generated content' }, { status: 400 });
          }
          
          const { autonomousContentGenerator } = await import('@/lib/ai/autonomous-content-generator');
          const generatedContent = await autonomousContentGenerator.getGeneratedContent(requestId);
          span.setAttributes({
            'content.generated_count': generatedContent.length
          });
          
          return NextResponse.json({
            success: true,
            data: generatedContent
          });

        case 'brand_profile':
          const { autonomousContentGenerator: contentGen1 } = await import('@/lib/ai/autonomous-content-generator');
          const brandProfile = await contentGen1.getBrandProfile(organizationId);
          
          return NextResponse.json({
            success: true,
            data: brandProfile
          });

        case 'performance_analysis':
          const { autonomousContentGenerator: contentGen2 } = await import('@/lib/ai/autonomous-content-generator');
          const performanceData = await contentGen2.analyzeContentPerformance(organizationId);
          
          span.setAttributes({
            'content.has_performance_data': !!performanceData
          });
          
          return NextResponse.json({
            success: true,
            data: performanceData
          });

        case 'templates':
          const typeFilter = url.searchParams.get('type');
          const purposeFilter = url.searchParams.get('purpose');
          
          // Get templates (implementation would fetch from database)
          const templates = await this.getContentTemplates(organizationId, typeFilter, purposeFilter);
          
          return NextResponse.json({
            success: true,
            data: templates
          });

        case 'generation_history':
          const limit = Number.parseInt(url.searchParams.get('limit') || '50');
          const offset = Number.parseInt(url.searchParams.get('offset') || '0');
          
          const history = await this.getGenerationHistory(organizationId, limit, offset);
          
          span.setAttributes({
            'content.history_count': history.length,
            'content.query_limit': limit,
            'content.query_offset': offset
          });
          
          return NextResponse.json({
            success: true,
            data: history,
            pagination: {
              limit,
              offset,
              hasMore: history.length === limit
            }
          });

        default:
          // Return content generation overview
          const overview = await this.getContentGenerationOverview(organizationId);
          
          span.setAttributes({
            'content.overview_requests': overview.totalRequests || 0,
            'content.overview_generated': overview.totalGenerated || 0
          });
          
          return NextResponse.json({
            success: true,
            data: overview
          });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Content generation API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to retrieve content generation data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  // Helper methods for GET endpoints
  async function getContentTemplates(organizationId: string, type?: string, purpose?: string) {
    try {
      // Implementation would fetch from database with filters
      return {
        templates: [],
        total: 0,
        filters: { type, purpose }
      };
    } catch (error) {
      logger.warn('Failed to fetch content templates', { organizationId, error });
      return { templates: [], total: 0 };
    }
  }

  async function getGenerationHistory(organizationId: string, limit: number, offset: number) {
    try {
      // Implementation would fetch from database
      return [];
    } catch (error) {
      logger.warn('Failed to fetch generation history', { organizationId, error });
      return [];
    }
  }

  async function getContentGenerationOverview(organizationId: string) {
    try {
      // Implementation would aggregate data from database
      return {
        totalRequests: 0,
        totalGenerated: 0,
        avgQualityScore: 0,
        topPerformingTypes: [],
        recentActivity: [],
        brandProfileStatus: 'configured',
        capabilities: {
          multiChannelGeneration: true,
          abTesting: true,
          culturalAdaptation: true,
          brandVoiceConsistency: true,
          performancePrediction: true
        }
      };
    } catch (error) {
      logger.warn('Failed to fetch content generation overview', { organizationId, error });
      return {
        totalRequests: 0,
        totalGenerated: 0,
        capabilities: {}
      };
    }
  }
}

/**
 * POST /api/ai/content-generation - Create content generation requests
 */
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('content-generation-api');
  
  return tracer.startActiveSpan('post-content-generation', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { action, data } = body;

      span.setAttributes({
        'content.action': action,
        'content.user_id': session.user.id,
        'content.user_role': session.user.role || ''
      });

      switch (action) {
        case 'generate_content':
          const {
            type,
            purpose,
            targetAudience,
            brandGuidelines,
            contentParameters,
            context,
            abTestVariations,
            priority
          } = data;

          // Validate required fields
          if (!type || !purpose) {
            return NextResponse.json({ 
              error: 'Content type and purpose are required' 
            }, { status: 400 });
          }

          // Dynamic import for generator
          const { autonomousContentGenerator: contentGen3 } = await import('@/lib/ai/autonomous-content-generator');
          
          // Create content generation request
          const generationRequest = {
            id: `content_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId: session.user.organizationId || '',
            userId: session.user.id,
            type,
            purpose,
            targetAudience: targetAudience || {},
            brandGuidelines: brandGuidelines || {
              voice: 'professional',
              tone: 'conversational'
            },
            contentParameters: contentParameters || {},
            context,
            abTestVariations: abTestVariations || 1,
            createdAt: new Date(),
            priority: priority || 'medium'
          };

          // Generate content
          const generatedContent = await contentGen3.generateContent(generationRequest);

          span.setAttributes({
            'content.request_id': generationRequest.id,
            'content.type': type,
            'content.purpose': purpose,
            'content.variations': abTestVariations || 1,
            'content.generated_count': generatedContent.length
          });

          logger.info('Content generation request processed', {
            requestId: generationRequest.id,
            type,
            purpose,
            userId: session.user.id,
            generatedCount: generatedContent.length
          });

          return NextResponse.json({
            success: true,
            message: 'Content generated successfully',
            data: {
              requestId: generationRequest.id,
              generatedContent,
              totalVariations: generatedContent.length,
              avgQualityScore: generatedContent.reduce((sum, content) => sum + content.qualityScore, 0) / generatedContent.length
            }
          });

        case 'update_brand_profile':
          const { brandProfile } = data;
          const organizationId = session.user.organizationId;

          if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
          }

          const { autonomousContentGenerator: contentGen4 } = await import('@/lib/ai/autonomous-content-generator');
          await contentGen4.updateBrandProfile(organizationId, brandProfile);

          logger.info('Brand profile updated', {
            organizationId,
            userId: session.user.id,
            updates: Object.keys(brandProfile)
          });

          return NextResponse.json({
            success: true,
            message: 'Brand profile updated successfully'
          });

        case 'approve_content':
          const { contentId, approved, reviewNotes } = data;

          if (!contentId) {
            return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
          }

          // Update content approval status
          await this.updateContentApproval(contentId, approved, reviewNotes, session.user.id);

          logger.info('Content approval updated', {
            contentId,
            approved,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: `Content ${approved ? 'approved' : 'rejected'} successfully`
          });

        case 'create_template':
          const { template } = data;

          if (!template.type || !template.purpose || !template.content) {
            return NextResponse.json({ 
              error: 'Template type, purpose, and content are required' 
            }, { status: 400 });
          }

          const templateId = await this.createContentTemplate(template, session.user.organizationId, session.user.id);

          return NextResponse.json({
            success: true,
            message: 'Content template created successfully',
            data: { templateId }
          });

        case 'batch_generate':
          const { requests } = data;

          if (!Array.isArray(requests) || requests.length === 0) {
            return NextResponse.json({ 
              error: 'Array of generation requests required' 
            }, { status: 400 });
          }

          // Process batch generation
          const batchResults = await this.processBatchGeneration(requests, session.user);

          span.setAttributes({
            'content.batch_size': requests.length,
            'content.batch_successful': batchResults.successful.length,
            'content.batch_failed': batchResults.failed.length
          });

          return NextResponse.json({
            success: true,
            message: 'Batch content generation completed',
            data: batchResults
          });

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Content generation POST API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to process content generation request' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  // Helper methods for POST endpoints
  async function updateContentApproval(contentId: string, approved: boolean, reviewNotes?: string, userId?: string) {
    try {
      // Implementation would update database
      logger.info('Content approval updated', { contentId, approved, reviewNotes, userId });
    } catch (error) {
      logger.error('Failed to update content approval', { contentId, error });
      throw error;
    }
  }

  async function createContentTemplate(template: any, organizationId?: string, userId?: string) {
    try {
      // Implementation would create template in database
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info('Content template created', { templateId, organizationId, userId });
      return templateId;
    } catch (error) {
      logger.error('Failed to create content template', { template, error });
      throw error;
    }
  }

  async function processBatchGeneration(requests: any[], user: any) {
    try {
      const successful = [];
      const failed = [];

      for (const req of requests) {
        try {
          const generationRequest = {
            id: `batch_content_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId: user.organizationId || '',
            userId: user.id,
            ...req,
            createdAt: new Date(),
            priority: req.priority || 'medium'
          };

          const { autonomousContentGenerator: contentGen5 } = await import('@/lib/ai/autonomous-content-generator');
          const result = await contentGen5.generateContent(generationRequest);
          successful.push({ requestId: generationRequest.id, result });
        } catch (error) {
          failed.push({ request: req, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return { successful, failed };
    } catch (error) {
      logger.error('Batch generation processing failed', { error });
      throw error;
    }
  }
}

/**
 * PUT /api/ai/content-generation - Update content generation settings
 */
export async function PUT(request: NextRequest) {
  const tracer = trace.getTracer('content-generation-api');
  
  return tracer.startActiveSpan('put-content-generation-settings', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check permissions for content generation settings
      const canModify = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!canModify) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ 
          error: 'Insufficient permissions to modify content generation settings' 
        }, { status: 403 });
      }

      const body = await request.json();
      const { settingsType, settings } = body;

      span.setAttributes({
        'content.settings_type': settingsType,
        'content.user_id': session.user.id,
        'content.user_role': session.user.role || ''
      });

      // Update content generation settings
      logger.info('Updating content generation settings', {
        settingsType,
        settings: Object.keys(settings),
        userId: session.user.id,
        userRole: session.user.role
      });

      // Implementation would update specific settings in database
      await this.updateContentGenerationSettings(settingsType, settings, session.user.organizationId);

      return NextResponse.json({
        success: true,
        message: 'Content generation settings updated successfully',
        settingsType,
        appliedSettings: Object.keys(settings)
      });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Content generation PUT API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to update content generation settings' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  async function updateContentGenerationSettings(settingsType: string, settings: any, organizationId?: string) {
    try {
      // Implementation would update settings in database
      logger.info('Content generation settings updated', { settingsType, organizationId });
    } catch (error) {
      logger.error('Failed to update content generation settings', { settingsType, error });
      throw error;
    }
  }
}

/**
 * DELETE /api/ai/content-generation - Delete content generation data
 */
export async function DELETE(request: NextRequest) {
  const tracer = trace.getTracer('content-generation-api');
  
  return tracer.startActiveSpan('delete-content-generation-data', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      const id = url.searchParams.get('id');

      span.setAttributes({
        'content.delete_action': action || 'unknown',
        'content.target_id': id || 'none',
        'content.user_id': session.user.id
      });

      if (!action || !id) {
        return NextResponse.json({ 
          error: 'Action and ID parameters required' 
        }, { status: 400 });
      }

      switch (action) {
        case 'generated_content':
          await this.deleteGeneratedContent(id, session.user.id);
          
          logger.info('Generated content deleted', {
            contentId: id,
            userId: session.user.id
          });
          
          return NextResponse.json({
            success: true,
            message: 'Generated content deleted successfully'
          });

        case 'template':
          await this.deleteContentTemplate(id, session.user.id);
          
          logger.info('Content template deleted', {
            templateId: id,
            userId: session.user.id
          });
          
          return NextResponse.json({
            success: true,
            message: 'Content template deleted successfully'
          });

        case 'generation_request':
          await this.deleteGenerationRequest(id, session.user.id);
          
          return NextResponse.json({
            success: true,
            message: 'Generation request deleted successfully'
          });

        default:
          return NextResponse.json({ error: 'Unknown delete action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Content generation DELETE API error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return NextResponse.json(
        { error: 'Failed to delete content generation data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });

  async function deleteGeneratedContent(contentId: string, userId: string) {
    // Implementation would delete from database
    logger.info('Deleting generated content', { contentId, userId });
  }

  async function deleteContentTemplate(templateId: string, userId: string) {
    // Implementation would delete from database
    logger.info('Deleting content template', { templateId, userId });
  }

  async function deleteGenerationRequest(requestId: string, userId: string) {
    // Implementation would delete from database
    logger.info('Deleting generation request', { requestId, userId });
  }
}