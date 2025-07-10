import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { multimodalAIEngine } from '@/lib/ai/multimodal-ai-engine';
import { UserRole } from '@prisma/client';

/**
 * Multimodal AI API
 * 
 * Handles voice, image, and document analysis with unified processing
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get('action') as string;
    const modality = formData.get('modality') as string;
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const options = formData.get('options') as string;

    logger.info('Multimodal AI request', {
      action,
      modality,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      hasFile: !!file,
      hasText: !!text
    });

    switch (action) {
      case 'process_media':
        if (!modality) {
          return NextResponse.json({
            success: false,
            error: 'Modality is required'
          }, { status: 400 });
        }

        // Prepare media input
        let mediaData: Buffer | string;
        let metadata: any;

        if (file) {
          mediaData = Buffer.from(await file.arrayBuffer());
          metadata = {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            source: 'upload',
            timestamp: new Date()
          };
        } else if (text) {
          mediaData = text;
          metadata = {
            mimeType: 'text/plain',
            size: text.length,
            source: 'text_input',
            timestamp: new Date()
          };
        } else {
          return NextResponse.json({
            success: false,
            error: 'Either file or text is required'
          }, { status: 400 });
        }

        // Parse processing options
        const processingOptions = options ? JSON.parse(options) : {
          extractText: true,
          extractObjects: modality === 'image',
          extractSentiment: true,
          generateSummary: true,
          africaOptimized: true
        };

        // Create media input
        const mediaInput = {
          id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: modality as any,
          data: mediaData,
          metadata,
          processingOptions
        };

        // Validate input
        const validation = multimodalAIEngine.validateMediaInput(mediaInput);
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            error: 'Invalid media input',
            details: validation.errors
          }, { status: 400 });
        }

        // Process media
        const result = await multimodalAIEngine.processMedia(
          mediaInput,
          session.user.organizationId,
          session.user.id
        );

        return NextResponse.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      case 'get_pipelines':
        const pipelines = multimodalAIEngine.getAvailablePipelines();
        return NextResponse.json({
          success: true,
          data: pipelines,
          timestamp: new Date().toISOString()
        });

      case 'get_active_processing':
        const activeProcessing = multimodalAIEngine.getActiveProcessing();
        return NextResponse.json({
          success: true,
          data: activeProcessing,
          timestamp: new Date().toISOString()
        });

      case 'get_supported_modalities':
        const modalities = multimodalAIEngine.getSupportedModalities();
        return NextResponse.json({
          success: true,
          data: modalities,
          timestamp: new Date().toISOString()
        });

      case 'get_africa_optimizations':
        const optimizations = multimodalAIEngine.getAfricaOptimizations();
        return NextResponse.json({
          success: true,
          data: optimizations,
          timestamp: new Date().toISOString()
        });

      case 'get_statistics':
        const statistics = multimodalAIEngine.getProcessingStatistics();
        return NextResponse.json({
          success: true,
          data: statistics,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Multimodal AI error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Multimodal AI operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'dashboard':
        const dashboardData = {
          pipelines: multimodalAIEngine.getAvailablePipelines(),
          activeProcessing: multimodalAIEngine.getActiveProcessing(),
          supportedModalities: multimodalAIEngine.getSupportedModalities(),
          africaOptimizations: multimodalAIEngine.getAfricaOptimizations(),
          statistics: multimodalAIEngine.getProcessingStatistics()
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });

      case 'pipelines':
        const pipelines = multimodalAIEngine.getAvailablePipelines();
        return NextResponse.json({
          success: true,
          data: pipelines,
          timestamp: new Date().toISOString()
        });

      case 'active_processing':
        const activeProcessing = multimodalAIEngine.getActiveProcessing();
        return NextResponse.json({
          success: true,
          data: activeProcessing,
          timestamp: new Date().toISOString()
        });

      case 'modalities':
        const modalities = multimodalAIEngine.getSupportedModalities();
        return NextResponse.json({
          success: true,
          data: modalities,
          timestamp: new Date().toISOString()
        });

      case 'optimizations':
        const optimizations = multimodalAIEngine.getAfricaOptimizations();
        return NextResponse.json({
          success: true,
          data: optimizations,
          timestamp: new Date().toISOString()
        });

      case 'statistics':
        const statistics = multimodalAIEngine.getProcessingStatistics();
        return NextResponse.json({
          success: true,
          data: statistics,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Multimodal AI GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve multimodal AI data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update multimodal settings
    if (![UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, optimizations } = body;

    switch (action) {
      case 'update_africa_optimizations':
        if (!optimizations) {
          return NextResponse.json({
            success: false,
            error: 'Optimizations data is required'
          }, { status: 400 });
        }

        multimodalAIEngine.updateAfricaOptimizations(optimizations);

        return NextResponse.json({
          success: true,
          message: 'Africa optimizations updated successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Multimodal AI PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Multimodal AI update failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

 