/**
 * Multi-Agent AI Coordination API
 * ===============================
 * HTTP endpoints for managing AI agent collaboration and coordination
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Rate limiting for agent coordination
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    // Check permissions - only admins can coordinate agents
    const hasPermission = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'].includes(user.role);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions for agent coordination' },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    logger.info('Agent coordination request', {
      action,
      userId: user.id,
      userRole: user.role
    });

    let result;

    switch (action) {
      case 'create_collaboration':
        {
          const { createAgentCollaboration } = await import('@/lib/ai/multi-agent-coordinator');
          result = await createAgentCollaboration({
            objective: params.objective,
            capabilities: params.capabilities || [],
            priority: params.priority || 'medium'
          });
        }
        break;

      case 'delegate_task':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.delegateTaskToAgents({
            task: params.task,
            requiredCapabilities: params.capabilities || [],
            priority: params.priority || 'medium',
            deadline: params.deadline ? new Date(params.deadline) : undefined
          });
        }
        break;

      case 'get_status':
        {
          const { getMultiAgentStatus } = await import('@/lib/ai/multi-agent-coordinator');
          result = await getMultiAgentStatus();
        }
        break;

      case 'get_agent_status':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getAgentStatus(params.agentId);
        }
        break;

      case 'get_collaborations':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getActiveCollaborations();
        }
        break;

      case 'get_performance':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getAgentPerformance();
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Agent coordination API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    let result;

    switch (action) {
      case 'status':
        {
          const { getMultiAgentStatus } = await import('@/lib/ai/multi-agent-coordinator');
          result = await getMultiAgentStatus();
        }
        break;

      case 'agents':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getAgentStatus();
        }
        break;

      case 'collaborations':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getActiveCollaborations();
        }
        break;

      case 'performance':
        {
          const { multiAgentCoordinator } = await import('@/lib/ai/multi-agent-coordinator');
          result = await multiAgentCoordinator.getAgentPerformance();
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Agent coordination GET API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}