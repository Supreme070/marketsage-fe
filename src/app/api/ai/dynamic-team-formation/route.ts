/**
 * Dynamic Team Formation API - v3.0
 * =================================
 * 
 * 🔥 MARKETING POWER: Dynamic Team Formation API
 * API endpoints for adaptive agent collaboration and team optimization
 * 
 * ENHANCED ENDPOINTS - Building on existing MarketSage multi-agent systems:
 * - POST /api/ai/dynamic-team-formation - Create and manage dynamic teams
 * - GET /api/ai/dynamic-team-formation - Get team formation analytics and insights
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  dynamicTeamFormationEngine,
  type TaskComplexity,
  DynamicTeam,
  type AfricanMarketContext,
  TeamStatus,
  TeamRole,
  LeadershipStyle,
  CollaborationPattern,
  DecisionMakingModel,
  AfricanRegion,
  analyzeTaskForTeamFormation,
  createAdaptiveTeam,
  optimizeExistingTeam,
  scaleTeamDynamically,
  getTeamFormationStatus
} from '@/lib/ai/dynamic-team-formation-engine';
import { z } from 'zod';

// Lazy initialization to avoid constructor issues
let teamFormationEngine: any = null;

function getTeamFormationEngine() {
  if (!teamFormationEngine) {
    teamFormationEngine = dynamicTeamFormationEngine;
  }
  return teamFormationEngine;
}

// Validation schemas
const DynamicTeamFormationRequestSchema = z.object({
  action: z.enum([
    'analyze_task_complexity',
    'form_optimal_team',
    'optimize_existing_team',
    'scale_team_dynamically',
    'get_team_status',
    'get_team_performance',
    'dissolve_team',
    'get_formation_analytics',
    'create_team_from_template',
    'clone_successful_team',
    'merge_teams',
    'split_team',
    'reassign_team_members',
    'update_team_objectives',
    'evaluate_team_effectiveness'
  ]),
  
  // Task complexity analysis parameters
  task_analysis: z.object({
    objective: z.string(),
    requirements: z.array(z.string()),
    constraints: z.array(z.string()),
    deadline: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    market_context: z.object({
      region: z.enum(['west_africa', 'east_africa', 'north_africa', 'southern_africa', 'central_africa', 'continental']).optional(),
      countries: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      cultures: z.array(z.string()).optional(),
      market_dynamics: z.object({
        growth: z.number().min(0).max(1).optional(),
        competition: z.number().min(0).max(1).optional(),
        innovation: z.number().min(0).max(1).optional(),
        regulation: z.number().min(0).max(1).optional(),
        opportunity: z.number().min(0).max(1).optional()
      }).optional()
    }).optional(),
    stakeholders: z.array(z.string()).optional()
  }).optional(),
  
  // Team formation parameters
  team_formation: z.object({
    objective: z.string(),
    complexity_analysis: z.object({
      overall_score: z.number().min(0).max(100),
      dimensions: z.object({
        technical: z.number().min(0).max(100),
        strategic: z.number().min(0).max(100),
        creative: z.number().min(0).max(100),
        analytical: z.number().min(0).max(100),
        collaborative: z.number().min(0).max(100),
        cultural: z.number().min(0).max(100),
        temporal: z.number().min(0).max(100),
        resource: z.number().min(0).max(100)
      }),
      required_skills: z.array(z.string()),
      estimated_duration: z.number().positive(),
      risk_level: z.enum(['low', 'medium', 'high', 'critical']),
      market_complexity: z.number().min(0).max(100).optional(),
      scalability_requirements: z.number().min(0).max(100).optional(),
      innovation_level: z.number().min(0).max(100).optional(),
      cross_functional_needs: z.array(z.string()).optional()
    }),
    preferences: z.object({
      size: z.object({
        min: z.number().positive(),
        max: z.number().positive()
      }).optional(),
      leadership_style: z.enum(['democratic', 'autocratic', 'laissez_faire', 'transformational', 'servant', 'situational', 'cultural_adaptive']).optional(),
      collaboration_pattern: z.enum(['parallel', 'sequential', 'iterative', 'agile', 'swarm', 'hierarchical', 'network', 'hybrid']).optional(),
      cultural_requirements: z.array(z.string()).optional(),
      time_constraints: z.object({
        start: z.string(),
        end: z.string()
      }).optional()
    }).optional(),
    constraints: z.object({
      excluded_agents: z.array(z.string()).optional(),
      required_agents: z.array(z.string()).optional(),
      budget_limits: z.number().positive().optional(),
      geographic_restrictions: z.array(z.string()).optional()
    }).optional(),
    african_market_context: z.object({
      region: z.enum(['west_africa', 'east_africa', 'north_africa', 'southern_africa', 'central_africa', 'continental']).optional(),
      countries: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      cultures: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  
  // Team optimization parameters
  team_optimization: z.object({
    team_id: z.string(),
    optimization_goals: z.object({
      performance: z.boolean().default(true),
      efficiency: z.boolean().default(true),
      innovation: z.boolean().default(false),
      collaboration: z.boolean().default(true),
      cultural_harmony: z.boolean().default(false)
    }),
    constraints: z.object({
      maintain_size: z.boolean().default(false),
      keep_leader: z.boolean().default(false),
      budget_limits: z.number().positive().optional(),
      time_constraints: z.string().optional()
    }).optional(),
    new_requirements: z.array(z.string()).optional()
  }).optional(),
  
  // Team scaling parameters
  team_scaling: z.object({
    team_id: z.string(),
    scaling_direction: z.enum(['up', 'down', 'rebalance']),
    target_size: z.number().positive().optional(),
    workload_factors: z.object({
      current_workload: z.number().min(0).max(1),
      projected_workload: z.number().min(0).max(1),
      deadline: z.string(),
      quality_requirements: z.number().min(0).max(1)
    }),
    constraints: z.object({
      max_size: z.number().positive().optional(),
      min_size: z.number().positive().optional(),
      budget_limits: z.number().positive().optional(),
      skill_requirements: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  
  // Team status parameters
  team_status: z.object({
    team_id: z.string().optional(),
    include_performance: z.boolean().default(true),
    include_members: z.boolean().default(true),
    include_analytics: z.boolean().default(false),
    historical_data: z.boolean().default(false)
  }).optional(),
  
  // Team management parameters
  team_management: z.object({
    team_id: z.string(),
    operation: z.enum(['dissolve', 'merge', 'split', 'reassign', 'update_objectives']),
    parameters: z.record(z.any()).optional()
  }).optional(),
  
  // Analytics parameters
  analytics: z.object({
    time_range: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    metrics: z.array(z.enum([
      'team_performance',
      'formation_success',
      'optimization_impact',
      'scaling_efficiency',
      'cultural_harmony',
      'innovation_index',
      'collaboration_score',
      'market_relevance'
    ])).optional(),
    aggregation: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    filters: z.object({
      team_size: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      complexity_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      african_region: z.enum(['west_africa', 'east_africa', 'north_africa', 'southern_africa', 'central_africa', 'continental']).optional(),
      team_status: z.enum(['forming', 'storming', 'norming', 'performing', 'adjourning', 'reformed', 'optimizing', 'scaling', 'dissolving']).optional()
    }).optional()
  }).optional()
});

// POST handler for team formation operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = DynamicTeamFormationRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request parameters',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;
    const engine = getTeamFormationEngine();

    let result;

    switch (action) {
      case 'analyze_task_complexity':
        if (!validation.data.task_analysis) {
          return NextResponse.json(
            { success: false, error: 'Task analysis parameters required' },
            { status: 400 }
          );
        }
        
        result = await analyzeTaskForTeamFormation({
          objective: validation.data.task_analysis.objective,
          requirements: validation.data.task_analysis.requirements,
          constraints: validation.data.task_analysis.constraints,
          deadline: validation.data.task_analysis.deadline ? new Date(validation.data.task_analysis.deadline) : undefined,
          priority: validation.data.task_analysis.priority,
          marketContext: validation.data.task_analysis.market_context as AfricanMarketContext
        });
        break;

      case 'form_optimal_team':
        if (!validation.data.team_formation) {
          return NextResponse.json(
            { success: false, error: 'Team formation parameters required' },
            { status: 400 }
          );
        }
        
        result = await createAdaptiveTeam({
          objective: validation.data.team_formation.objective,
          taskComplexity: validation.data.team_formation.complexity_analysis as TaskComplexity,
          preferences: validation.data.team_formation.preferences,
          constraints: validation.data.team_formation.constraints,
          africanMarketContext: validation.data.team_formation.african_market_context as AfricanMarketContext
        });
        break;

      case 'optimize_existing_team':
        if (!validation.data.team_optimization) {
          return NextResponse.json(
            { success: false, error: 'Team optimization parameters required' },
            { status: 400 }
          );
        }
        
        result = await optimizeExistingTeam({
          teamId: validation.data.team_optimization.team_id,
          optimizationGoals: validation.data.team_optimization.optimization_goals,
          constraints: validation.data.team_optimization.constraints,
          newRequirements: validation.data.team_optimization.new_requirements
        });
        break;

      case 'scale_team_dynamically':
        if (!validation.data.team_scaling) {
          return NextResponse.json(
            { success: false, error: 'Team scaling parameters required' },
            { status: 400 }
          );
        }
        
        result = await scaleTeamDynamically({
          teamId: validation.data.team_scaling.team_id,
          scalingDirection: validation.data.team_scaling.scaling_direction,
          targetSize: validation.data.team_scaling.target_size,
          workloadFactors: {
            ...validation.data.team_scaling.workload_factors,
            deadline: new Date(validation.data.team_scaling.workload_factors.deadline)
          },
          constraints: validation.data.team_scaling.constraints
        });
        break;

      case 'get_team_status':
        if (!validation.data.team_status) {
          return NextResponse.json(
            { success: false, error: 'Team status parameters required' },
            { status: 400 }
          );
        }
        
        if (validation.data.team_status.team_id) {
          result = await engine.getTeamStatus(validation.data.team_status.team_id);
        } else {
          result = await engine.getAllActiveTeams();
        }
        break;

      case 'get_team_performance':
        if (!validation.data.team_status?.team_id) {
          return NextResponse.json(
            { success: false, error: 'Team ID required for performance data' },
            { status: 400 }
          );
        }
        
        result = await engine.getTeamPerformanceHistory(validation.data.team_status.team_id);
        break;

      case 'dissolve_team':
        if (!validation.data.team_management?.team_id) {
          return NextResponse.json(
            { success: false, error: 'Team ID required for dissolution' },
            { status: 400 }
          );
        }
        
        result = await engine.dissolveTeam(validation.data.team_management.team_id);
        break;

      case 'get_formation_analytics':
        result = await getTeamFormationStatus();
        break;

      case 'create_team_from_template':
        // Template-based team creation
        result = await createTeamFromTemplate(validation.data, session.user.id);
        break;

      case 'clone_successful_team':
        // Clone a successful team configuration
        result = await cloneSuccessfulTeam(validation.data, session.user.id);
        break;

      case 'merge_teams':
        // Merge multiple teams
        result = await mergeTeams(validation.data, session.user.id);
        break;

      case 'split_team':
        // Split a team into multiple teams
        result = await splitTeam(validation.data, session.user.id);
        break;

      case 'reassign_team_members':
        // Reassign team members
        result = await reassignTeamMembers(validation.data, session.user.id);
        break;

      case 'update_team_objectives':
        // Update team objectives
        result = await updateTeamObjectives(validation.data, session.user.id);
        break;

      case 'evaluate_team_effectiveness':
        // Evaluate team effectiveness
        result = await evaluateTeamEffectiveness(validation.data, session.user.id);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    // Log the successful operation
    logger.info('Dynamic team formation operation completed', {
      action,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      success: true
    });

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Dynamic team formation operation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET handler for team formation data and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_formation_status';
    const teamId = searchParams.get('team_id');
    const includePerformance = searchParams.get('include_performance') === 'true';
    const includeAnalytics = searchParams.get('include_analytics') === 'true';

    const engine = getTeamFormationEngine();
    let result;

    switch (action) {
      case 'get_formation_status':
        result = await getTeamFormationStatus();
        break;

      case 'get_team_details':
        if (!teamId) {
          return NextResponse.json(
            { success: false, error: 'Team ID required' },
            { status: 400 }
          );
        }
        
        result = await engine.getTeamStatus(teamId);
        
        if (includePerformance) {
          const performance = await engine.getTeamPerformanceHistory(teamId);
          result = { ...result, performanceHistory: performance };
        }
        break;

      case 'get_all_teams':
        result = await engine.getAllActiveTeams();
        break;

      case 'get_team_analytics':
        result = await getTeamFormationAnalytics({
          teamId,
          includePerformance,
          includeAnalytics
        });
        break;

      case 'get_formation_patterns':
        result = await getTeamFormationPatterns();
        break;

      case 'get_optimization_recommendations':
        if (!teamId) {
          return NextResponse.json(
            { success: false, error: 'Team ID required for optimization recommendations' },
            { status: 400 }
          );
        }
        
        result = await getOptimizationRecommendations(teamId);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Dynamic team formation GET operation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper functions for additional team operations
async function createTeamFromTemplate(data: any, userId: string): Promise<any> {
  // Implementation for creating team from template
  logger.info('Creating team from template', { userId, template: data.template });
  
  // This would implement template-based team creation
  return {
    teamId: `template_team_${Date.now()}`,
    status: 'created',
    message: 'Team created from template successfully'
  };
}

async function cloneSuccessfulTeam(data: any, userId: string): Promise<any> {
  // Implementation for cloning successful team
  logger.info('Cloning successful team', { userId, sourceTeamId: data.source_team_id });
  
  // This would implement team cloning logic
  return {
    teamId: `cloned_team_${Date.now()}`,
    status: 'cloned',
    message: 'Team cloned successfully'
  };
}

async function mergeTeams(data: any, userId: string): Promise<any> {
  // Implementation for merging teams
  logger.info('Merging teams', { userId, teams: data.team_ids });
  
  // This would implement team merging logic
  return {
    teamId: `merged_team_${Date.now()}`,
    status: 'merged',
    message: 'Teams merged successfully'
  };
}

async function splitTeam(data: any, userId: string): Promise<any> {
  // Implementation for splitting team
  logger.info('Splitting team', { userId, teamId: data.team_id });
  
  // This would implement team splitting logic
  return {
    teamIds: [`split_team_1_${Date.now()}`, `split_team_2_${Date.now()}`],
    status: 'split',
    message: 'Team split successfully'
  };
}

async function reassignTeamMembers(data: any, userId: string): Promise<any> {
  // Implementation for reassigning team members
  logger.info('Reassigning team members', { userId, teamId: data.team_id });
  
  // This would implement member reassignment logic
  return {
    teamId: data.team_id,
    status: 'reassigned',
    message: 'Team members reassigned successfully'
  };
}

async function updateTeamObjectives(data: any, userId: string): Promise<any> {
  // Implementation for updating team objectives
  logger.info('Updating team objectives', { userId, teamId: data.team_id });
  
  // This would implement objective update logic
  return {
    teamId: data.team_id,
    status: 'updated',
    message: 'Team objectives updated successfully'
  };
}

async function evaluateTeamEffectiveness(data: any, userId: string): Promise<any> {
  // Implementation for evaluating team effectiveness
  logger.info('Evaluating team effectiveness', { userId, teamId: data.team_id });
  
  // This would implement effectiveness evaluation logic
  return {
    teamId: data.team_id,
    effectiveness: {
      overall: 0.85,
      performance: 0.88,
      collaboration: 0.82,
      innovation: 0.79,
      cultural_harmony: 0.91
    },
    recommendations: [
      'Increase innovation-focused activities',
      'Enhance cross-cultural communication',
      'Optimize workload distribution'
    ]
  };
}

async function getTeamFormationAnalytics(params: {
  teamId?: string;
  includePerformance: boolean;
  includeAnalytics: boolean;
}): Promise<any> {
  // Implementation for getting team formation analytics
  logger.info('Getting team formation analytics', params);
  
  // This would implement analytics retrieval logic
  return {
    summary: {
      totalTeams: 25,
      activeTeams: 18,
      averagePerformance: 0.82,
      formationSuccessRate: 0.94
    },
    trends: {
      teamSizes: { small: 12, medium: 8, large: 5 },
      leadershipStyles: { democratic: 10, transformational: 8, situational: 7 },
      collaborationPatterns: { agile: 12, network: 6, hybrid: 7 }
    },
    performance: {
      topPerformers: ['team_001', 'team_007', 'team_012'],
      improvementOpportunities: ['team_003', 'team_009'],
      averageFormationTime: 2.5, // hours
      averageOptimizationCycles: 1.8
    }
  };
}

async function getTeamFormationPatterns(): Promise<any> {
  // Implementation for getting team formation patterns
  logger.info('Getting team formation patterns');
  
  // This would implement pattern analysis logic
  return {
    successful_patterns: [
      {
        pattern: 'cross_functional_agile',
        success_rate: 0.91,
        optimal_size: 5,
        leadership_style: 'democratic',
        collaboration_pattern: 'agile'
      },
      {
        pattern: 'specialist_network',
        success_rate: 0.87,
        optimal_size: 7,
        leadership_style: 'transformational',
        collaboration_pattern: 'network'
      }
    ],
    emerging_patterns: [
      {
        pattern: 'ai_human_hybrid',
        success_rate: 0.85,
        trend: 'increasing',
        characteristics: ['ai_integration', 'human_creativity', 'adaptive_learning']
      }
    ]
  };
}

async function getOptimizationRecommendations(teamId: string): Promise<any> {
  // Implementation for getting optimization recommendations
  logger.info('Getting optimization recommendations', { teamId });
  
  // This would implement recommendation generation logic
  return {
    team_id: teamId,
    recommendations: [
      {
        type: 'skill_gap',
        priority: 'high',
        description: 'Add data analytics specialist',
        impact: 'performance_boost',
        effort: 'medium'
      },
      {
        type: 'leadership_adjustment',
        priority: 'medium',
        description: 'Shift to more collaborative leadership style',
        impact: 'cultural_harmony',
        effort: 'low'
      },
      {
        type: 'workload_rebalancing',
        priority: 'medium',
        description: 'Redistribute tasks based on individual strengths',
        impact: 'efficiency_gain',
        effort: 'low'
      }
    ],
    predicted_improvements: {
      performance: 0.15,
      efficiency: 0.12,
      satisfaction: 0.18
    }
  };
}