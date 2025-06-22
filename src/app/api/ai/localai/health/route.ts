import { type NextRequest, NextResponse } from 'next/server';
import { LocalAIIntegration } from '@/lib/ai/localai-integration';
import { logger } from '@/lib/logger';

/**
 * GET /api/ai/localai/health
 * Check LocalAI service health and available models
 */
export async function GET(request: NextRequest) {
  try {
    const localAI = new LocalAIIntegration();
    const healthStatus = await localAI.healthCheck();

    return NextResponse.json({
      success: true,
      ...healthStatus,
      timestamp: new Date().toISOString(),
      provider: 'LocalAI'
    });

  } catch (error) {
    logger.error('LocalAI health check failed', { error: String(error) });
    return NextResponse.json(
      { 
        success: false,
        status: 'unhealthy', 
        message: 'Health check failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        provider: 'LocalAI'
      },
      { status: 500 }
    );
  }
} 