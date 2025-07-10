/**
 * Workflow Workers Management API
 * 
 * Provides endpoints to check status and manage workflow queue workers.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  initializeWorkflowWorkers, 
  getWorkersStatus, 
  stopWorkflowWorkers 
} from '@/lib/workflow/init-workers';
import { 
  handleApiError, 
  unauthorized, 
  forbidden 
} from '@/lib/errors';

// GET - Check workflow workers status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorized();
    }

    // Only admins can check worker status
    const isAdmin = session.user.role === 'SUPER_ADMIN' || 
                   session.user.role === 'ADMIN' || 
                   session.user.role === 'IT_ADMIN';
    
    if (!isAdmin) {
      return forbidden('Admin access required');
    }

    const status = await getWorkersStatus();

    return NextResponse.json({
      success: true,
      workers: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking workflow workers status:', error);
    return handleApiError(error, '/api/workflows/workers/route.ts');
  }
}

// POST - Start or restart workflow workers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorized();
    }

    // Only super admins can control workers
    if (session.user.role !== 'SUPER_ADMIN') {
      return forbidden('Super admin access required');
    }

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'start':
        await initializeWorkflowWorkers();
        result = { message: 'Workflow workers started successfully' };
        break;

      case 'stop':
        await stopWorkflowWorkers();
        result = { message: 'Workflow workers stopped successfully' };
        break;

      case 'restart':
        await stopWorkflowWorkers();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await initializeWorkflowWorkers();
        result = { message: 'Workflow workers restarted successfully' };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "start", "stop", or "restart"'
        }, { status: 400 });
    }

    // Get updated status
    const status = await getWorkersStatus();

    return NextResponse.json({
      success: true,
      ...result,
      workers: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error managing workflow workers:', error);
    return handleApiError(error, '/api/workflows/workers/route.ts');
  }
}