/**
 * Autonomous Lead Qualification API
 * ================================
 * 
 * API endpoints for autonomous lead qualification, scoring, and routing
 * 
 * Endpoints:
 * - POST /api/ai/autonomous-lead-qualification - Qualify a lead
 * - GET /api/ai/autonomous-lead-qualification - Get qualification analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { autonomousLeadQualificationEngine } from '@/lib/ai/autonomous-lead-qualification-engine';
import { z } from 'zod';

// Validation schemas
const LeadQualificationRequestSchema = z.object({
  action: z.enum(['qualify_lead', 'get_analytics', 'update_routing', 'test_model']),
  
  // For qualify_lead action
  contactId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  visitorId: z.string().optional(),
  formData: z.record(z.any()).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  page_url: z.string().url().optional(),
  referring_url: z.string().url().optional(),
  
  // Behavioral data
  behavioral_data: z.object({
    pages_visited: z.number().default(1),
    time_on_site: z.number().default(0),
    downloads: z.array(z.string()).default([]),
    forms_completed: z.number().default(0),
    email_interactions: z.object({
      campaigns_opened: z.number().default(0),
      links_clicked: z.number().default(0),
      last_interaction: z.string().datetime().optional(),
      engagement_score: z.number().default(0)
    }).optional(),
    device_info: z.object({
      type: z.enum(['mobile', 'desktop', 'tablet']).default('desktop'),
      os: z.string().default('unknown'),
      browser: z.string().default('unknown'),
      is_bot: z.boolean().default(false)
    }).optional(),
    location_data: z.object({
      country: z.string().default('unknown'),
      region: z.string().default('unknown'),
      city: z.string().default('unknown'),
      timezone: z.string().default('UTC'),
      is_african_market: z.boolean().default(false)
    }).optional()
  }).optional(),
  
  // Firmographic data
  firmographic_data: z.object({
    company_name: z.string().optional(),
    industry: z.string().optional(),
    company_size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
    annual_revenue: z.number().optional(),
    location: z.string().optional(),
    technology_stack: z.array(z.string()).optional(),
    funding_stage: z.string().optional()
  }).optional(),
  
  // Attribution data
  attribution_data: z.object({
    first_touch_campaign: z.string().optional(),
    last_touch_campaign: z.string().optional(),
    touchpoint_count: z.number().default(1),
    multi_touch_value: z.number().default(0),
    source_quality_score: z.number().default(50)
  }).optional(),
  
  // Options
  real_time_processing: z.boolean().default(true),
  auto_route: z.boolean().default(true),
  auto_notify: z.boolean().default(true),
  experiment_id: z.string().optional(),
  
  // For analytics action
  date_range: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional()
  }).optional(),
  
  // For routing configuration
  routing_config: z.object({
    routing_strategy: z.enum(['round_robin', 'skill_based', 'territory', 'load_balanced', 'ai_optimized']).optional(),
    sales_teams: z.array(z.any()).optional(),
    territories: z.array(z.any()).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = LeadQualificationRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Invalid lead qualification request', {
        errors: validation.error.errors,
        userId: session.user.id
      });
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.errors 
      }, { status: 400 });
    }

    const data = validation.data;
    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    logger.info('Processing lead qualification request', {
      action: data.action,
      userId: session.user.id,
      organizationId
    });

    switch (data.action) {
      case 'qualify_lead':
        return await handleQualifyLead(data, organizationId);
        
      case 'get_analytics':
        return await handleGetAnalytics(data, organizationId);
        
      case 'update_routing':
        return await handleUpdateRouting(data, organizationId);
        
      case 'test_model':
        return await handleTestModel(data, organizationId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Lead qualification API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_analytics';

    switch (action) {
      case 'get_analytics':
        return await handleGetAnalytics({}, organizationId);
        
      case 'get_models':
        return await handleGetModels(organizationId);
        
      case 'get_routing_config':
        return await handleGetRoutingConfig(organizationId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Lead qualification GET API error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

async function handleQualifyLead(data: any, organizationId: string) {
  try {
    const qualificationRequest = {
      contactId: data.contactId,
      email: data.email,
      phone: data.phone,
      visitorId: data.visitorId,
      formData: data.formData,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      page_url: data.page_url,
      referring_url: data.referring_url,
      behavioral_data: data.behavioral_data,
      firmographic_data: data.firmographic_data,
      attribution_data: data.attribution_data,
      real_time_processing: data.real_time_processing
    };

    const options = {
      real_time: data.real_time_processing,
      auto_route: data.auto_route,
      auto_notify: data.auto_notify,
      experiment_id: data.experiment_id
    };

    const result = await autonomousLeadQualificationEngine.qualifyLead(
      qualificationRequest,
      organizationId,
      options
    );

    logger.info('Lead qualification completed successfully', {
      qualificationId: result.qualificationId,
      score: result.qualification_score,
      grade: result.qualification_grade,
      status: result.qualification_status,
      organizationId
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Lead qualified successfully'
    });

  } catch (error) {
    logger.error('Lead qualification failed', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Lead qualification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleGetAnalytics(data: any, organizationId: string) {
  try {
    // Mock analytics data - would be implemented with real database queries
    const analytics = {
      summary: {
        total_leads_qualified: 1247,
        average_qualification_score: 67.3,
        conversion_rate: 23.8,
        top_performing_sources: [
          { source: 'organic', leads: 423, conversion_rate: 34.2 },
          { source: 'linkedin', leads: 287, conversion_rate: 28.9 },
          { source: 'referral', leads: 198, conversion_rate: 41.4 }
        ]
      },
      
      score_distribution: {
        'A+ (95-100)': 89,
        'A (90-94)': 156,
        'B+ (85-89)': 203,
        'B (80-84)': 178,
        'C+ (70-79)': 234,
        'C (60-69)': 198,
        'D (50-59)': 123,
        'F (0-49)': 66
      },
      
      routing_performance: {
        average_routing_time: '4.2 minutes',
        successful_assignments: 89.3,
        sales_rep_utilization: 76.8,
        escalation_rate: 3.2
      },
      
      african_market_insights: {
        regional_performance: {
          'Nigeria': { leads: 445, conversion_rate: 28.7 },
          'South Africa': { leads: 298, conversion_rate: 24.1 },
          'Kenya': { leads: 189, conversion_rate: 31.2 },
          'Ghana': { leads: 134, conversion_rate: 26.8 }
        },
        cultural_optimization_impact: 15.4,
        local_timing_effectiveness: 22.1
      },
      
      model_performance: {
        accuracy: 87.3,
        precision: 84.7,
        recall: 89.1,
        f1_score: 86.8,
        last_training: '2024-07-10T08:00:00Z'
      },
      
      recommendations: [
        {
          type: 'optimization',
          title: 'Increase LinkedIn campaign budget',
          impact: 'Could improve lead quality by 12%',
          confidence: 0.89
        },
        {
          type: 'routing',
          title: 'Assign more African market specialists',
          impact: 'Could reduce response time by 8 minutes',
          confidence: 0.76
        },
        {
          type: 'model',
          title: 'Retrain qualification model',
          impact: 'Model accuracy could improve to 91%',
          confidence: 0.82
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get qualification analytics', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleUpdateRouting(data: any, organizationId: string) {
  try {
    // Mock routing configuration update
    const routingConfig = {
      id: `routing_${organizationId}`,
      updated: new Date().toISOString(),
      strategy: data.routing_config?.routing_strategy || 'ai_optimized',
      sales_teams: data.routing_config?.sales_teams || [],
      territories: data.routing_config?.territories || [],
      success: true
    };

    logger.info('Routing configuration updated', {
      organizationId,
      strategy: routingConfig.strategy
    });

    return NextResponse.json({
      success: true,
      data: routingConfig,
      message: 'Routing configuration updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update routing configuration', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update routing configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleTestModel(data: any, organizationId: string) {
  try {
    // Mock model testing
    const testResult = {
      model_id: 'default_qualification_v1',
      test_date: new Date().toISOString(),
      test_data_size: 500,
      results: {
        accuracy: 87.3,
        precision: 84.7,
        recall: 89.1,
        f1_score: 86.8,
        auc_roc: 0.923
      },
      confusion_matrix: {
        true_positives: 178,
        false_positives: 32,
        true_negatives: 267,
        false_negatives: 23
      },
      recommendations: [
        'Model performing well for African market leads',
        'Consider adding more behavioral features',
        'Retrain model with recent data for improved accuracy'
      ]
    };

    return NextResponse.json({
      success: true,
      data: testResult,
      message: 'Model test completed successfully'
    });

  } catch (error) {
    logger.error('Model testing failed', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Model testing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleGetModels(organizationId: string) {
  try {
    // Mock model information
    const models = [
      {
        model_id: 'default_qualification_v1',
        model_type: 'ensemble',
        version: '1.0.0',
        status: 'active',
        accuracy: 87.3,
        training_date: '2024-07-10T08:00:00Z',
        african_market_optimized: true,
        features_count: 23
      },
      {
        model_id: 'experimental_qualification_v2',
        model_type: 'neural_network',
        version: '2.0.0-beta',
        status: 'testing',
        accuracy: 89.1,
        training_date: '2024-07-12T10:00:00Z',
        african_market_optimized: true,
        features_count: 31
      }
    ];

    return NextResponse.json({
      success: true,
      data: { models },
      message: 'Models retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get models', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get models',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleGetRoutingConfig(organizationId: string) {
  try {
    // Mock routing configuration
    const routingConfig = {
      organizationId,
      routing_strategy: 'ai_optimized',
      sales_teams: [
        {
          id: 'team_enterprise',
          name: 'Enterprise Sales',
          members: [
            { id: 'rep_001', name: 'Sarah Johnson', specializations: ['enterprise', 'technology'] },
            { id: 'rep_002', name: 'Michael Chen', specializations: ['enterprise', 'finance'] }
          ],
          capacity: 20,
          current_load: 14
        },
        {
          id: 'team_african_markets',
          name: 'African Markets',
          members: [
            { id: 'rep_003', name: 'Adaora Okafor', specializations: ['nigeria', 'west_africa'] },
            { id: 'rep_004', name: 'Kwame Asante', specializations: ['ghana', 'west_africa'] }
          ],
          capacity: 15,
          current_load: 8
        }
      ],
      territories: [
        { id: 'territory_west_africa', name: 'West Africa', regions: ['Nigeria', 'Ghana', 'Senegal'] },
        { id: 'territory_east_africa', name: 'East Africa', regions: ['Kenya', 'Tanzania', 'Uganda'] }
      ],
      business_hours: {
        timezone: 'Africa/Lagos',
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }]
      }
    };

    return NextResponse.json({
      success: true,
      data: routingConfig,
      message: 'Routing configuration retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get routing configuration', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get routing configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}