import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { systemMetricsCollector } from '@/lib/system-metrics-collector';

/**
 * GET /api/admin/system/metrics-collector
 * Get metrics collector status
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const status = systemMetricsCollector.getStatus();

    return Response.json({
      success: true,
      data: {
        ...status,
        lastChecked: new Date(),
      },
    });

  } catch (error) {
    console.error('Metrics collector status error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get metrics collector status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * POST /api/admin/system/metrics-collector
 * Control metrics collector (start/stop/collect)
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, intervalMs } = body;

    // Log the admin action
    await logAdminAction(user, 'CONTROL_METRICS_COLLECTOR', 'system', {
      action,
      intervalMs,
    });

    let result: any = {};

    switch (action) {
      case 'start':
        systemMetricsCollector.startCollection(intervalMs || 60000);
        result = {
          action: 'started',
          message: `Metrics collection started with ${intervalMs || 60000}ms interval`,
          status: systemMetricsCollector.getStatus(),
        };
        break;

      case 'stop':
        systemMetricsCollector.stopCollection();
        result = {
          action: 'stopped',
          message: 'Metrics collection stopped',
          status: systemMetricsCollector.getStatus(),
        };
        break;

      case 'collect':
        await systemMetricsCollector.collectMetrics();
        result = {
          action: 'collected',
          message: 'Manual metrics collection completed',
          status: systemMetricsCollector.getStatus(),
          timestamp: new Date(),
        };
        break;

      case 'status':
        result = {
          action: 'status',
          status: systemMetricsCollector.getStatus(),
          timestamp: new Date(),
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return Response.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Metrics collector control error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to control metrics collector',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}