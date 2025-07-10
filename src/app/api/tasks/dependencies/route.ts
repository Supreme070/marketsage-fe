/**
 * Task Dependencies API
 * ====================
 * Automated task dependency management and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { automatedTaskDependencyManager } from '@/lib/task-automation/dependency-manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const taskId = searchParams.get('task_id');

    switch (action) {
      case 'analyze':
        if (!taskId) {
          return NextResponse.json({
            error: 'Task ID required for analysis'
          }, { status: 400 });
        }

        const includeAfrican = searchParams.get('african_optimization') === 'true';
        const autoCreate = searchParams.get('auto_create') === 'true';
        const depth = parseInt(searchParams.get('depth') || '3');

        const analysis = await automatedTaskDependencyManager.analyzeTaskDependencies(
          taskId,
          {
            include_suggestions: true,
            african_market_optimization: includeAfrican,
            auto_create_dependencies: autoCreate,
            dependency_depth: depth
          }
        );

        return NextResponse.json({
          success: true,
          analysis
        });

      case 'chain':
        if (!taskId) {
          return NextResponse.json({
            error: 'Task ID required for chain analysis'
          }, { status: 400 });
        }

        const maxDepth = parseInt(searchParams.get('max_depth') || '5');
        const includeParallel = searchParams.get('include_parallel') === 'true';
        const africanOptimization = searchParams.get('african_optimization') === 'true';

        const dependencyChain = await automatedTaskDependencyManager.buildDependencyChain(
          taskId,
          {
            max_depth: maxDepth,
            include_parallel_analysis: includeParallel,
            african_market_optimization: africanOptimization
          }
        );

        return NextResponse.json({
          success: true,
          dependency_chain: dependencyChain
        });

      case 'health':
        const healthMetrics = await automatedTaskDependencyManager.monitorDependencyHealth();

        return NextResponse.json({
          success: true,
          health_metrics: healthMetrics
        });

      default:
        return NextResponse.json({
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Task dependencies GET API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process dependency request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'resolve_conflicts':
        const {
          conflict_ids,
          resolution_strategy = 'ai_guided'
        } = body;

        if (!conflict_ids || !Array.isArray(conflict_ids)) {
          return NextResponse.json({
            error: 'Conflict IDs array required'
          }, { status: 400 });
        }

        const resolutionResult = await automatedTaskDependencyManager.resolveDependencyConflicts(
          conflict_ids,
          resolution_strategy
        );

        return NextResponse.json({
          success: true,
          message: `Resolved ${resolutionResult.resolved_conflicts} of ${conflict_ids.length} conflicts`,
          ...resolutionResult
        });

      case 'analyze_task':
        const {
          task_id,
          options = {}
        } = body;

        if (!task_id) {
          return NextResponse.json({
            error: 'Task ID required'
          }, { status: 400 });
        }

        const taskAnalysis = await automatedTaskDependencyManager.analyzeTaskDependencies(
          task_id,
          options
        );

        return NextResponse.json({
          success: true,
          message: 'Task dependency analysis completed',
          analysis: taskAnalysis
        });

      case 'build_chain':
        const {
          root_task_id,
          chain_options = {}
        } = body;

        if (!root_task_id) {
          return NextResponse.json({
            error: 'Root task ID required'
          }, { status: 400 });
        }

        const chain = await automatedTaskDependencyManager.buildDependencyChain(
          root_task_id,
          chain_options
        );

        return NextResponse.json({
          success: true,
          message: 'Dependency chain built successfully',
          chain
        });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Task dependencies POST API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process dependency request'
    }, { status: 500 });
  }
}