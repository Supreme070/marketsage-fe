/**
 * AI Chat Streaming API
 * =====================
 * 
 * Server-sent events endpoint for real-time AI chat responses
 * with enhanced user experience and performance monitoring.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiResponseCache } from '@/lib/cache/ai-response-cache';
import prisma from '@/lib/db/prisma';

interface StreamingResponse {
  type: 'chunk' | 'complete' | 'error' | 'thinking' | 'processing';
  content?: string;
  metadata?: any;
  progress?: number;
  timestamp?: string;
}

function createStreamResponse(data: StreamingResponse): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { question, type = 'question', enableTaskExecution = false } = body;
    
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user and get permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    // Check admin privileges for task execution
    const hasAdminPrivileges = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'].includes(user.role);
    const canExecuteTasks = enableTaskExecution && hasAdminPrivileges;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial thinking state
          controller.enqueue(
            encoder.encode(createStreamResponse({
              type: 'thinking',
              content: 'Supreme-AI is processing your request...',
              progress: 10,
              timestamp: new Date().toISOString()
            }))
          );

          // Check cache first (unless it's a task execution)
          if (!canExecuteTasks) {
            const cachedResponse = await aiResponseCache.getCachedResponse(
              question,
              '',
              user.id,
              type
            );
            
            if (cachedResponse) {
              // Stream cached response in chunks for better UX
              const chunks = cachedResponse.response.split(' ');
              for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i] + ' ';
                controller.enqueue(
                  encoder.encode(createStreamResponse({
                    type: 'chunk',
                    content: chunk,
                    progress: Math.round((i / chunks.length) * 100),
                    timestamp: new Date().toISOString()
                  }))
                );
                
                // Add small delay for streaming effect
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              controller.enqueue(
                encoder.encode(createStreamResponse({
                  type: 'complete',
                  metadata: {
                    source: 'cache',
                    processingTime: Date.now() - startTime,
                    cached: true
                  },
                  timestamp: new Date().toISOString()
                }))
              );
              
              controller.close();
              return;
            }
          }

          // Send processing state
          controller.enqueue(
            encoder.encode(createStreamResponse({
              type: 'processing',
              content: 'Analyzing your request with Supreme-AI v3...',
              progress: 30,
              timestamp: new Date().toISOString()
            }))
          );

          // Process with Supreme-AI v3
          const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
          
          const task = {
            type,
            question,
            userId: user.id,
            enableTaskExecution: canExecuteTasks,
            organizationId: session.user.organizationId,
            context: {
              streamingMode: true,
              userRole: user.role,
              timestamp: new Date().toISOString()
            }
          };

          controller.enqueue(
            encoder.encode(createStreamResponse({
              type: 'processing',
              content: 'Supreme-AI is generating response...',
              progress: 60,
              timestamp: new Date().toISOString()
            }))
          );

          const result = await SupremeAIv3.process(task);
          
          if (!result.success) {
            controller.enqueue(
              encoder.encode(createStreamResponse({
                type: 'error',
                content: result.error || 'Failed to process request',
                timestamp: new Date().toISOString()
              }))
            );
            controller.close();
            return;
          }

          // Stream the response in chunks
          const response = result.data?.answer || 'No response generated';
          const chunks = response.split(' ');
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i] + ' ';
            controller.enqueue(
              encoder.encode(createStreamResponse({
                type: 'chunk',
                content: chunk,
                progress: Math.round(60 + (i / chunks.length) * 30),
                timestamp: new Date().toISOString()
              }))
            );
            
            // Add realistic streaming delay
            await new Promise(resolve => setTimeout(resolve, 80));
          }

          // Send completion
          const processingTime = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(createStreamResponse({
              type: 'complete',
              metadata: {
                source: 'supreme-ai-v3',
                processingTime,
                confidence: result.confidence,
                taskExecution: result.data?.taskExecution,
                model: 'supreme-ai-v3',
                cached: false
              },
              timestamp: new Date().toISOString()
            }))
          );

          // Cache the response for future requests
          if (!canExecuteTasks) {
            await aiResponseCache.cacheResponse(
              question,
              response,
              result.confidence || 0.8,
              processingTime,
              'supreme-ai-v3',
              '',
              user.id,
              type
            );
          }

          controller.close();
          
        } catch (error) {
          logger.error('AI Chat streaming error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: user.id,
            question: question.substring(0, 100)
          });
          
          controller.enqueue(
            encoder.encode(createStreamResponse({
              type: 'error',
              content: process.env.NODE_ENV === 'development' 
                ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                : 'An error occurred while processing your request',
              timestamp: new Date().toISOString()
            }))
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    logger.error('AI Chat streaming setup error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to initialize streaming' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'AI Chat Streaming API',
    version: '1.0',
    description: 'Server-sent events for real-time AI chat responses',
    features: [
      'Real-time response streaming',
      'Progress indicators',
      'Caching support',
      'Task execution capabilities',
      'Enhanced user experience'
    ]
  });
}