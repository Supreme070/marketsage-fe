import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiStreamingService } from '@/lib/websocket/ai-streaming-service';
import { logger } from '@/lib/logger';

/**
 * AI Stream History API
 * 
 * Retrieves historical stream messages for a user session/request
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId = session.user.id,
      sessionId,
      requestId,
      limit = 50
    } = body;

    if (!sessionId || !requestId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: sessionId and requestId'
      }, { status: 400 });
    }

    logger.info('AI Stream History Request', {
      userId,
      sessionId,
      requestId,
      limit
    });

    // Get stream history from the streaming service
    const messages = await aiStreamingService.getStreamHistory(
      userId,
      sessionId,
      requestId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        messages,
        count: messages.length,
        userId,
        sessionId,
        requestId
      },
      message: `Retrieved ${messages.length} stream messages`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI Stream History Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve stream history',
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

    // Get stream statistics
    const stats = aiStreamingService.getStreamStats();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        capabilities: {
          streamHistory: true,
          realTimeStreaming: true,
          messageFiltering: true,
          rateLimiting: true,
          permissionBasedAccess: true,
          multiClientBroadcasting: true,
          redisCaching: true
        }
      },
      message: 'AI streaming service statistics',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI Stream Stats Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve stream statistics',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}