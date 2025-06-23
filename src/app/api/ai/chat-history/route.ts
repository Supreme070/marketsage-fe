/**
 * Chat History API
 * Handles saving and retrieving AI conversation history
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// GET: Retrieve chat history for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    // Get chat history
    const chatHistory = await prisma.aI_ChatHistory.findMany({
      where: {
        userId: session.user.id,
        ...(sessionId ? { sessionId } : {})
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    // Convert to chat message format
    const messages = chatHistory.flatMap(history => {
      const messages = [];
      
      // Add user question
      if (history.question) {
        messages.push({
          id: `${history.id}-question`,
          role: 'user' as const,
          content: history.question,
          timestamp: history.createdAt.toISOString()
        });
      }
      
      // Add AI answer
      if (history.answer) {
        messages.push({
          id: `${history.id}-answer`,
          role: 'assistant' as const,
          content: history.answer,
          timestamp: history.createdAt.toISOString(),
          confidence: history.confidence,
          context: history.context ? JSON.parse(history.context) : undefined
        });
      }
      
      return messages;
    });

    return NextResponse.json({
      success: true,
      messages,
      totalCount: chatHistory.length
    });

  } catch (error) {
    logger.error('Failed to retrieve chat history', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

// POST: Save chat message to history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, question, answer, context, confidence = 0.95 } = body;

    // Validate required fields
    if (!question && !answer) {
      return NextResponse.json(
        { success: false, error: 'Either question or answer is required' },
        { status: 400 }
      );
    }

    // Save to database
    const chatHistory = await prisma.aI_ChatHistory.create({
      data: {
        userId: session.user.id,
        sessionId: sessionId || null,
        question: question || '',
        answer: answer || '',
        context: context ? JSON.stringify(context) : null,
        confidence: confidence
      }
    });

    logger.info('Chat message saved successfully', {
      historyId: chatHistory.id,
      userId: session.user.id,
      sessionId
    });

    return NextResponse.json({
      success: true,
      historyId: chatHistory.id,
      message: 'Chat message saved successfully'
    });

  } catch (error) {
    logger.error('Failed to save chat message', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}

// DELETE: Clear chat history for session or user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const clearAll = searchParams.get('clearAll') === 'true';

    let deletedCount;

    if (clearAll) {
      // Clear all chat history for user
      const result = await prisma.aI_ChatHistory.deleteMany({
        where: { userId: session.user.id }
      });
      deletedCount = result.count;
    } else if (sessionId) {
      // Clear specific session
      const result = await prisma.aI_ChatHistory.deleteMany({
        where: {
          userId: session.user.id,
          sessionId
        }
      });
      deletedCount = result.count;
    } else {
      return NextResponse.json(
        { success: false, error: 'Session ID required or use clearAll=true' },
        { status: 400 }
      );
    }

    logger.info('Chat history cleared', {
      userId: session.user.id,
      sessionId,
      clearAll,
      deletedCount
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} chat messages`
    });

  } catch (error) {
    logger.error('Failed to clear chat history', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}