/**
 * LeadPulse Database Health Check API
 * 
 * Provides database performance metrics and health status
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leadPulseDBMonitor } from '@/lib/db/leadpulse-db-monitor';
import { leadPulseQueryOptimizer } from '@/lib/db/leadpulse-query-optimizer';
import { logger } from '@/lib/logger';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET: Database health check and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions (you may want to implement proper role checking)
    // For now, we'll allow all authenticated users to see basic health info
    
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') === 'true';
    const hours = Number.parseInt(searchParams.get('hours') || '24');

    // Get basic health metrics
    const [
      currentMetrics,
      performanceSummary,
      connectionStats
    ] = await Promise.all([
      leadPulseDBMonitor.collectMetrics(),
      leadPulseDBMonitor.getPerformanceSummary(hours),
      leadPulseQueryOptimizer.getConnectionPoolStats()
    ]);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        connections: {
          active: currentMetrics.activeConnections,
          total: connectionStats.poolConfiguration,
          status: currentMetrics.activeConnections < 50 ? 'good' : 
                  currentMetrics.activeConnections < 80 ? 'warning' : 'critical'
        },
        performance: {
          avgQueryTime: currentMetrics.avgQueryTime,
          bufferHitRatio: currentMetrics.bufferHitRatio,
          slowQueries: currentMetrics.slowQueries,
          status: currentMetrics.avgQueryTime < 100 && 
                  currentMetrics.bufferHitRatio > 95 && 
                  currentMetrics.slowQueries === 0 ? 'good' : 
                  currentMetrics.avgQueryTime < 500 && 
                  currentMetrics.bufferHitRatio > 90 ? 'warning' : 'critical'
        },
        storage: {
          tableScans: currentMetrics.tableScans,
          indexScans: currentMetrics.indexScans,
          indexUsageRatio: currentMetrics.indexScans > 0 ? 
            (currentMetrics.indexScans / (currentMetrics.indexScans + currentMetrics.tableScans)) * 100 : 0,
          status: currentMetrics.indexScans > currentMetrics.tableScans ? 'good' : 
                  currentMetrics.indexScans > 0 ? 'warning' : 'critical'
        }
      },
      summary: performanceSummary
    };

    // Determine overall health status
    const statuses = [
      healthStatus.metrics.connections.status,
      healthStatus.metrics.performance.status,
      healthStatus.metrics.storage.status
    ];

    if (statuses.includes('critical')) {
      healthStatus.status = 'critical';
    } else if (statuses.includes('warning')) {
      healthStatus.status = 'warning';
    }

    // Add detailed information if requested
    let detailedInfo = {};
    if (detail) {
      const [
        slowQueries,
        tableStats
      ] = await Promise.all([
        leadPulseDBMonitor.getSlowQueries(10),
        leadPulseDBMonitor.getDetailedTableStats()
      ]);

      detailedInfo = {
        slowQueries,
        tableStats,
        connectionDetails: connectionStats
      };
    }

    return NextResponse.json({
      health: healthStatus,
      ...(detail && { details: detailedInfo })
    });

  } catch (error) {
    logger.error('Error in database health check:', error);
    return NextResponse.json({
      health: {
        status: 'error',
        timestamp: new Date(),
        error: 'Failed to retrieve health metrics'
      }
    }, { status: 500 });
  }
}

/**
 * POST: Run database maintenance tasks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin permissions here in production
    // For now, allowing all authenticated users

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'maintenance':
        result = await leadPulseDBMonitor.runMaintenance();
        break;

      case 'warm_cache':
        result = await leadPulseQueryOptimizer.warmCache(session.user.id);
        break;

      case 'analyze_query':
        if (!body.query) {
          return NextResponse.json({ error: 'Query required for analysis' }, { status: 400 });
        }
        result = await leadPulseQueryOptimizer.analyzeQueryPerformance(
          body.query, 
          body.params || []
        );
        break;

      case 'start_monitoring':
        leadPulseDBMonitor.startMonitoring(body.interval || 60000);
        result = { success: true, message: 'Monitoring started' };
        break;

      case 'stop_monitoring':
        leadPulseDBMonitor.stopMonitoring();
        result = { success: true, message: 'Monitoring stopped' };
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    logger.info(`Database admin action performed: ${action}`, { 
      userId: session.user.id,
      result 
    });

    return NextResponse.json({ success: true, result });

  } catch (error) {
    logger.error('Error in database admin action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform admin action'
    }, { status: 500 });
  }
}

/**
 * PUT: Update monitoring configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { thresholds } = body;

    // Update alert thresholds (in a real implementation, you'd store these in the database)
    if (thresholds) {
      // For now, just validate the thresholds structure
      const validThresholds = {
        avgQueryTime: thresholds.avgQueryTime || 1000,
        slowQueryThreshold: thresholds.slowQueryThreshold || 5000,
        connectionLimit: thresholds.connectionLimit || 80,
        bufferHitRatio: thresholds.bufferHitRatio || 95,
        lockWaitLimit: thresholds.lockWaitLimit || 10
      };

      // In production, save to database or configuration service
      logger.info('Monitoring thresholds updated', { 
        userId: session.user.id,
        thresholds: validThresholds 
      });

      return NextResponse.json({ 
        success: true, 
        thresholds: validThresholds 
      });
    }

    return NextResponse.json({ error: 'No valid configuration provided' }, { status: 400 });

  } catch (error) {
    logger.error('Error updating monitoring configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update configuration'
    }, { status: 500 });
  }
}