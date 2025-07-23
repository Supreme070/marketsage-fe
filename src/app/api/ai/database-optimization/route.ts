import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { databaseOptimizationEngine } from '@/lib/ai/database-optimization-engine';
import { logger } from '@/lib/logger';

/**
 * Database Optimization Engine API
 * 
 * Provides AI-powered database optimization for better performance
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      organizationId = session.user.organizationId,
      queryId,
      query,
      tables,
      optimizationLevel = 'intermediate',
      autoApply = false
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('Database optimization request', {
      action,
      organizationId,
      queryId,
      optimizationLevel,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'analyze_query':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: query'
          }, { status: 400 });
        }

        result = await databaseOptimizationEngine.analyzeQuery(
          query,
          organizationId,
          session.user.id
        );
        break;

      case 'optimize_query':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: query'
          }, { status: 400 });
        }

        result = await databaseOptimizationEngine.optimizeQuery(
          query,
          organizationId,
          session.user.id,
          optimizationLevel
        );
        break;

      case 'analyze_performance':
        const { startDate, endDate } = body;
        
        if (!startDate || !endDate) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: startDate, endDate'
          }, { status: 400 });
        }

        result = await databaseOptimizationEngine.analyzePerformance(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );
        break;

      case 'get_recommendations':
        result = await databaseOptimizationEngine.getOptimizationRecommendations(
          organizationId,
          tables
        );
        break;

      case 'apply_optimization':
        if (!queryId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: queryId'
          }, { status: 400 });
        }

        result = await databaseOptimizationEngine.applyOptimization(
          queryId,
          organizationId,
          session.user.id,
          autoApply
        );
        break;

      case 'get_optimization_status':
        result = await databaseOptimizationEngine.getOptimizationStatus(
          organizationId
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Database optimization error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Database optimization operation failed',
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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              queryAnalysis: true,
              queryOptimization: true,
              performanceAnalysis: true,
              indexRecommendations: true,
              cacheOptimization: true,
              connectionPooling: true,
              realTimeMonitoring: true,
              autoOptimization: true
            },
            supportedOptimizationLevels: ['basic', 'intermediate', 'advanced', 'aggressive'],
            supportedQueryTypes: ['select', 'insert', 'update', 'delete', 'aggregate', 'join', 'complex'],
            features: [
              'AI-powered query analysis and optimization',
              'Dynamic indexing recommendations',
              'Real-time performance monitoring',
              'Connection pooling optimization',
              'Query caching with Redis',
              'Performance metrics and insights',
              'Automated optimization suggestions',
              'Risk assessment and safety checks'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'performance_overview':
        const stats = await databaseOptimizationEngine.getPerformanceOverview(organizationId);
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'query_history':
        const limit = Number.parseInt(searchParams.get('limit') || '50');
        const offset = Number.parseInt(searchParams.get('offset') || '0');
        
        const queryHistory = await databaseOptimizationEngine.getQueryHistory(
          organizationId,
          limit,
          offset
        );
        
        return NextResponse.json({
          success: true,
          data: queryHistory,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Database optimization GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve database optimization information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}