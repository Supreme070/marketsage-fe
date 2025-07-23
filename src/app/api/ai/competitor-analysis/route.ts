/**
 * Enhanced Competitor Analysis API
 * ===============================
 * 
 * API endpoints for comprehensive competitor analysis and intelligence
 * 
 * Endpoints:
 * - POST /api/ai/competitor-analysis - Analyze competitor
 * - GET /api/ai/competitor-analysis - Get competitor data
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { realTimeMarketResponseEngine } from '@/lib/ai/realtime-market-response-engine';
import { z } from 'zod';

// Validation schemas
const CompetitorAnalysisRequestSchema = z.object({
  action: z.enum([
    'analyze_competitor',
    'pricing_intelligence', 
    'feature_comparison',
    'content_intelligence',
    'sales_intelligence',
    'generate_report',
    'monitor_activity',
    'get_profile',
    'list_competitors'
  ]),
  
  // Competitor identification
  competitor_name: z.string().min(1).optional(),
  competitor_id: z.string().optional(),
  
  // Analysis options
  analysis_depth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  include_historical: z.boolean().default(false),
  real_time_updates: z.boolean().default(true),
  
  // Time range for analysis
  time_range: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional()
  }).optional(),
  
  // Specific analysis parameters
  pricing_focus: z.array(z.string()).optional(),
  feature_categories: z.array(z.string()).optional(),
  content_channels: z.array(z.string()).optional(),
  sales_segments: z.array(z.string()).optional(),
  
  // Report configuration
  report_format: z.enum(['json', 'detailed', 'executive_summary']).default('json'),
  include_recommendations: z.boolean().default(true),
  include_threat_assessment: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CompetitorAnalysisRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Invalid competitor analysis request', {
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

    logger.info('Processing competitor analysis request', {
      action: data.action,
      competitor: data.competitor_name,
      userId: session.user.id,
      organizationId
    });

    switch (data.action) {
      case 'analyze_competitor':
        return await handleAnalyzeCompetitor(data, organizationId);
        
      case 'pricing_intelligence':
        return await handlePricingIntelligence(data, organizationId);
        
      case 'feature_comparison':
        return await handleFeatureComparison(data, organizationId);
        
      case 'content_intelligence':
        return await handleContentIntelligence(data, organizationId);
        
      case 'sales_intelligence':
        return await handleSalesIntelligence(data, organizationId);
        
      case 'generate_report':
        return await handleGenerateReport(data, organizationId);
        
      case 'monitor_activity':
        return await handleMonitorActivity(data, organizationId);
        
      case 'get_profile':
        return await handleGetProfile(data, organizationId);
        
      case 'list_competitors':
        return await handleListCompetitors(data, organizationId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Competitor analysis API error', {
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
    const action = searchParams.get('action') || 'list_competitors';
    const competitorName = searchParams.get('competitor_name');

    switch (action) {
      case 'list_competitors':
        return await handleListCompetitors({}, organizationId);
        
      case 'get_profile':
        if (!competitorName) {
          return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
        }
        return await handleGetProfile({ competitor_name: competitorName }, organizationId);
        
      case 'get_activities':
        if (!competitorName) {
          return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
        }
        return await handleMonitorActivity({ competitor_name: competitorName }, organizationId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Competitor analysis GET API error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

async function handleAnalyzeCompetitor(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const competitorName = data.competitor_name;
    
    // Perform basic competitor analysis
    const profile = await realTimeMarketResponseEngine.getCompetitorProfile(competitorName, organizationId);
    
    if (!profile) {
      return NextResponse.json({ 
        error: 'Failed to analyze competitor',
        message: 'Unable to generate competitor profile'
      }, { status: 500 });
    }

    // Get additional analysis based on depth
    let additionalAnalysis = {};
    
    if (data.analysis_depth === 'comprehensive') {
      const [pricingIntelligence, featureAnalysis, contentAnalysis] = await Promise.all([
        realTimeMarketResponseEngine.analyzePricingIntelligence(competitorName, organizationId),
        realTimeMarketResponseEngine.analyzeFeatureComparison(competitorName, organizationId),
        realTimeMarketResponseEngine.analyzeContentIntelligence(competitorName, organizationId)
      ]);
      
      additionalAnalysis = {
        pricing_intelligence: pricingIntelligence,
        feature_analysis: featureAnalysis,
        content_analysis: contentAnalysis
      };
    }

    logger.info('Competitor analysis completed', {
      competitorName,
      organizationId,
      analysisDepth: data.analysis_depth,
      profileCompleteness: Object.keys(profile).length
    });

    return NextResponse.json({
      success: true,
      data: {
        competitor_profile: profile,
        ...additionalAnalysis,
        analysis_metadata: {
          analysis_date: new Date().toISOString(),
          analysis_depth: data.analysis_depth,
          data_freshness: 'real_time'
        }
      },
      message: 'Competitor analysis completed successfully'
    });

  } catch (error) {
    logger.error('Failed to analyze competitor', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Competitor analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handlePricingIntelligence(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const pricingIntelligence = await realTimeMarketResponseEngine.analyzePricingIntelligence(
      data.competitor_name, 
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: {
        pricing_intelligence: pricingIntelligence,
        analysis_metadata: {
          competitor: data.competitor_name,
          analysis_date: new Date().toISOString(),
          focus_areas: data.pricing_focus || ['all']
        }
      },
      message: 'Pricing intelligence analysis completed'
    });

  } catch (error) {
    logger.error('Pricing intelligence analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Pricing intelligence analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleFeatureComparison(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const featureAnalysis = await realTimeMarketResponseEngine.analyzeFeatureComparison(
      data.competitor_name, 
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: {
        feature_analysis: featureAnalysis,
        analysis_metadata: {
          competitor: data.competitor_name,
          analysis_date: new Date().toISOString(),
          categories_analyzed: data.feature_categories || ['all']
        }
      },
      message: 'Feature comparison analysis completed'
    });

  } catch (error) {
    logger.error('Feature comparison analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Feature comparison analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleContentIntelligence(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const contentAnalysis = await realTimeMarketResponseEngine.analyzeContentIntelligence(
      data.competitor_name, 
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: {
        content_intelligence: contentAnalysis,
        analysis_metadata: {
          competitor: data.competitor_name,
          analysis_date: new Date().toISOString(),
          channels_analyzed: data.content_channels || ['all']
        }
      },
      message: 'Content intelligence analysis completed'
    });

  } catch (error) {
    logger.error('Content intelligence analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Content intelligence analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleSalesIntelligence(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const salesAnalysis = await realTimeMarketResponseEngine.analyzeSalesIntelligence(
      data.competitor_name, 
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: {
        sales_intelligence: salesAnalysis,
        analysis_metadata: {
          competitor: data.competitor_name,
          analysis_date: new Date().toISOString(),
          segments_analyzed: data.sales_segments || ['all']
        }
      },
      message: 'Sales intelligence analysis completed'
    });

  } catch (error) {
    logger.error('Sales intelligence analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Sales intelligence analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleGenerateReport(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const report = await realTimeMarketResponseEngine.generateCompetitiveIntelligenceReport(
      data.competitor_name, 
      organizationId
    );

    // Format report based on requested format
    let formattedReport = report;
    
    if (data.report_format === 'executive_summary') {
      formattedReport = {
        executive_summary: {
          competitor: data.competitor_name,
          overall_threat_level: report.threat_assessment.overall_threat_level,
          key_findings: [
            `Market position: ${report.competitor_profile.market_position}`,
            `Price competitiveness: ${Math.round(report.pricing_intelligence.price_competitiveness * 100)}%`,
            `Feature gaps identified: ${report.feature_analysis.feature_gap_analysis.length}`,
            `Brand threat level: ${report.content_intelligence.brand_positioning.brand_threat_level}%`
          ],
          top_recommendations: report.strategic_recommendations.slice(0, 3),
          immediate_actions: report.threat_assessment.immediate_actions
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        competitive_intelligence_report: formattedReport,
        report_metadata: {
          competitor: data.competitor_name,
          generated_date: new Date().toISOString(),
          report_format: data.report_format,
          includes_recommendations: data.include_recommendations,
          includes_threat_assessment: data.include_threat_assessment
        }
      },
      message: 'Competitive intelligence report generated successfully'
    });

  } catch (error) {
    logger.error('Report generation failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Report generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleMonitorActivity(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const activities = await realTimeMarketResponseEngine.monitorCompetitorActivity(
      data.competitor_name, 
      organizationId
    );

    // Filter activities by time range if provided
    let filteredActivities = activities;
    if (data.time_range?.start_date) {
      const startDate = new Date(data.time_range.start_date);
      filteredActivities = activities.filter(activity => activity.detected_at >= startDate);
    }
    if (data.time_range?.end_date) {
      const endDate = new Date(data.time_range.end_date);
      filteredActivities = filteredActivities.filter(activity => activity.detected_at <= endDate);
    }

    return NextResponse.json({
      success: true,
      data: {
        competitor_activities: filteredActivities,
        activity_summary: {
          total_activities: filteredActivities.length,
          high_threat_activities: filteredActivities.filter(a => a.threat_level === 'high' || a.threat_level === 'critical').length,
          recent_activities_24h: filteredActivities.filter(a => 
            Date.now() - a.detected_at.getTime() < 24 * 60 * 60 * 1000
          ).length,
          activity_types: [...new Set(filteredActivities.map(a => a.activity_type))]
        },
        monitoring_metadata: {
          competitor: data.competitor_name,
          monitoring_date: new Date().toISOString(),
          time_range: data.time_range || 'all_time'
        }
      },
      message: 'Competitor activity monitoring completed'
    });

  } catch (error) {
    logger.error('Activity monitoring failed', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Activity monitoring failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleGetProfile(data: any, organizationId: string) {
  try {
    if (!data.competitor_name) {
      return NextResponse.json({ error: 'Competitor name required' }, { status: 400 });
    }

    const profile = await realTimeMarketResponseEngine.getCompetitorProfile(
      data.competitor_name, 
      organizationId
    );

    if (!profile) {
      return NextResponse.json({ 
        error: 'Competitor profile not found',
        message: 'No profile data available for this competitor'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        competitor_profile: profile,
        profile_metadata: {
          competitor: data.competitor_name,
          last_updated: profile.last_updated,
          data_completeness: Math.round((Object.keys(profile).filter(key => 
            (profile as any)[key] !== null && (profile as any)[key] !== undefined
          ).length / Object.keys(profile).length) * 100)
        }
      },
      message: 'Competitor profile retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get competitor profile', {
      error: error instanceof Error ? error.message : String(error),
      competitor: data.competitor_name,
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get competitor profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleListCompetitors(data: any, organizationId: string) {
  try {
    // Mock competitor list - in production this would come from a database
    const competitors = [
      {
        name: 'HubSpot',
        category: 'direct',
        market_position: 'leader',
        threat_level: 85,
        last_analyzed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        monitoring_status: 'active'
      },
      {
        name: 'Salesforce Marketing Cloud',
        category: 'direct',
        market_position: 'leader',
        threat_level: 90,
        last_analyzed: new Date(Date.now() - 12 * 60 * 60 * 1000),
        monitoring_status: 'active'
      },
      {
        name: 'Mailchimp',
        category: 'indirect',
        market_position: 'challenger',
        threat_level: 60,
        last_analyzed: new Date(Date.now() - 48 * 60 * 60 * 1000),
        monitoring_status: 'periodic'
      },
      {
        name: 'Klaviyo',
        category: 'direct',
        market_position: 'challenger',
        threat_level: 70,
        last_analyzed: new Date(Date.now() - 36 * 60 * 60 * 1000),
        monitoring_status: 'active'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        competitors: competitors,
        competitor_summary: {
          total_competitors: competitors.length,
          active_monitoring: competitors.filter(c => c.monitoring_status === 'active').length,
          high_threat_competitors: competitors.filter(c => c.threat_level >= 70).length,
          direct_competitors: competitors.filter(c => c.category === 'direct').length
        },
        list_metadata: {
          generated_date: new Date().toISOString(),
          organization_id: organizationId
        }
      },
      message: 'Competitor list retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to list competitors', {
      error: error instanceof Error ? error.message : String(error),
      organizationId
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to list competitors',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}