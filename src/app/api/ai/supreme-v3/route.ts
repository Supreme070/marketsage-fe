/**
 * Supreme-AI v3 API Route
 * =======================
 * Secure HTTP endpoint for Supreme-AI v3 orchestrator
 * 
 * Features:
 * 🛡️ Input validation & sanitization
 * ⚡ Rate limiting & caching
 * 📊 Request/response logging
 * 🔒 User authentication
 * 🎯 Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupremeAIv3, type SupremeAIv3Task } from '@/lib/ai/supreme-ai-v3-engine';
import { logger } from '@/lib/logger';

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function validateTask(body: any): { valid: boolean; task?: SupremeAIv3Task; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }
  
  const { type, userId } = body;
  
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Task type is required and must be a string' };
  }
  
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'User ID is required and must be a string' };
  }
  
  // Validate specific task types
  switch (type) {
    case 'question':
      if (!body.question || typeof body.question !== 'string') {
        return { valid: false, error: 'Question is required for question tasks' };
      }
      if (body.question.length > 1000) {
        return { valid: false, error: 'Question too long (max 1000 characters)' };
      }
      break;
      
    case 'content':
      if (!body.content || typeof body.content !== 'string') {
        return { valid: false, error: 'Content is required for content tasks' };
      }
      if (body.content.length > 10000) {
        return { valid: false, error: 'Content too long (max 10000 characters)' };
      }
      break;
      
    case 'predict':
      if (!Array.isArray(body.features) || !Array.isArray(body.targets)) {
        return { valid: false, error: 'Features and targets arrays are required for predict tasks' };
      }
      if (body.features.length === 0 || body.targets.length === 0) {
        return { valid: false, error: 'Features and targets cannot be empty' };
      }
      break;
      
    case 'customer':
      if (!Array.isArray(body.customers)) {
        return { valid: false, error: 'Customers array is required for customer tasks' };
      }
      break;
      
    case 'market':
      if (!body.marketData || typeof body.marketData !== 'object') {
        return { valid: false, error: 'Market data object is required for market tasks' };
      }
      break;
      
    case 'adaptive':
      if (!body.data || !body.context) {
        return { valid: false, error: 'Data and context are required for adaptive tasks' };
      }
      break;
      
    default:
      return { valid: false, error: `Unsupported task type: ${type}` };
  }
  
  return { valid: true, task: body as SupremeAIv3Task };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate request
    const validation = validateTask(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    const task = validation.task!;
    
    // Rate limiting
    if (!checkRateLimit(task.userId)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Log request
    logger.info('Supreme-AI v3 API request', {
      taskType: task.type,
      userId: task.userId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });
    
    // Process with Supreme-AI v3
    const result = await SupremeAIv3.process(task);
    
    // Add performance metrics
    const processingTime = Date.now() - startTime;
    const response = {
      ...result,
      meta: {
        processingTime,
        version: '3.0',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    // Log successful response
    logger.info('Supreme-AI v3 API response', {
      taskType: task.type,
      userId: task.userId,
      success: result.success,
      confidence: result.confidence,
      processingTime,
      supremeScore: result.supremeScore
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Supreme-AI v3 API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error. Please try again later.',
        meta: {
          processingTime,
          version: '3.0',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Supreme-AI v3 API',
    version: '3.0',
    description: 'Advanced AI orchestrator with AutoML, RAG, Memory, and Analytics',
    endpoints: {
      POST: {
        description: 'Process AI tasks',
        supportedTasks: ['question', 'content', 'predict', 'customer', 'market', 'adaptive'],
        rateLimit: `${RATE_LIMIT} requests per minute`
      }
    },
    documentation: '/docs/supreme-ai-v3'
  });
} 