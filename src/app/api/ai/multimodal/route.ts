import { type NextRequest, NextResponse } from 'next/server';
import { multiModalIntelligence } from '@/lib/ai/multimodal-intelligence';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai/multimodal
 * Analyze multi-modal input (text, image, audio, video, documents)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      imageBase64,
      audioBase64,
      videoBase64,
      documentBase64,
      metadata
    } = body;

    if (!metadata || !metadata.userId) {
      return NextResponse.json(
        { error: 'Missing required metadata.userId' },
        { status: 400 }
      );
    }

    const input = {
      text,
      imageBase64,
      audioBase64,
      videoBase64,
      documentBase64,
      metadata: {
        contentType: metadata.contentType || 'mixed',
        source: metadata.source || 'upload',
        userId: metadata.userId,
        timestamp: new Date()
      }
    };

    const analysis = await multiModalIntelligence.analyzeMultiModal(input);

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Multi-modal analysis failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Multi-modal analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}

 