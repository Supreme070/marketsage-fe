/**
 * MCP Test API Endpoint
 * 
 * This endpoint allows testing the MCP integration with the Supreme-AI v3 engine
 * in a controlled environment with proper authentication.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supremeAIV3Enhanced } from '@/lib/ai/supreme-ai-v3-mcp-integration';
import { getMCPServerManager } from '@/mcp/mcp-server-manager';
import { isMCPEnabled } from '@/mcp/config/mcp-config';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { question, taskType = 'question', enableMCP = true } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    logger.info('MCP Test API called', {
      userId: session.user.id,
      taskType,
      question: question.substring(0, 100),
      enableMCP,
      mcpGloballyEnabled: isMCPEnabled()
    });

    // Get MCP server status
    const mcpManager = getMCPServerManager();
    const serverStatus = mcpManager.getServerStatus();

    // Prepare AI task
    const aiTask = {
      type: taskType as any,
      userId: session.user.id,
      question,
      customers: [],
      enableTaskExecution: false
    };

    // Process with Supreme-AI v3 (with or without MCP)
    const startTime = Date.now();
    let result;

    if (enableMCP && isMCPEnabled()) {
      // Use MCP-enhanced version
      result = await supremeAIV3Enhanced.processWithMCP(aiTask, request.headers.get('authorization'));
    } else {
      // Use fallback to original version
      result = await supremeAIV3Enhanced['fallbackToOriginal'](aiTask);
    }

    const processingTime = Date.now() - startTime;

    // Add debug information
    const response = {
      success: true,
      data: result,
      meta: {
        processingTime: `${processingTime}ms`,
        mcpEnabled: enableMCP && isMCPEnabled(),
        mcpServerStatus: serverStatus,
        taskType,
        timestamp: new Date().toISOString()
      }
    };

    logger.info('MCP Test API completed', {
      userId: session.user.id,
      processingTime,
      success: result.success,
      mcpUsed: result.data?.mcpUsed || false
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('MCP Test API error', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get MCP status information
    const mcpManager = getMCPServerManager();
    const serverStatus = mcpManager.getServerStatus();
    const healthCheck = await mcpManager.healthCheck();

    const status = {
      mcpEnabled: isMCPEnabled(),
      serverStatus,
      healthCheck,
      availableServers: mcpManager.getAvailableServers(),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(status);

  } catch (error) {
    logger.error('MCP Status API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to get MCP status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}