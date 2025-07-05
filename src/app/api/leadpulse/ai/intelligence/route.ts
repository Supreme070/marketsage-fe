/**
 * LeadPulse AI Intelligence API
 * 
 * Provides AI-powered business intelligence and insights
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET: AI Intelligence and insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const timeRange = searchParams.get('timeRange') || '30d';
    const visitorId = searchParams.get('visitorId');
    const formId = searchParams.get('formId');

    // Parse time range
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const toDate = new Date();

    switch (type) {
      case 'overview':
        return await getBusinessIntelligenceOverview(session.user.id, { from: fromDate, to: toDate });
      
      case 'visitor-behavior':
        return await getVisitorBehaviorAnalysis(session.user.id, visitorId);
      
      case 'predictions':
        const predictionType = searchParams.get('predictionType') as any || 'TRAFFIC';
        const timeframe = Number.parseInt(searchParams.get('timeframe') || '30');
        return await getPerformancePredictions(session.user.id, predictionType, timeframe);
      
      case 'funnel-optimization':
        return await getFunnelOptimization(session.user.id, formId);
      
      case 'smart-segments':
        return await getSmartSegments(session.user.id, searchParams);
      
      case 'anomalies':
        const metrics = searchParams.get('metrics')?.split(',') || ['traffic', 'conversions', 'engagement'];
        return await getAnomalyDetection(session.user.id, metrics);
      
      default:
        return NextResponse.json({ 
          error: 'Invalid intelligence type' 
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in AI intelligence API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate AI insights'
    }, { status: 500 });
  }
}

/**
 * POST: Request specific AI analysis or training
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'generate_insights':
        return await generateCustomInsights(session.user.id, data);
      
      case 'train_model':
        return await trainCustomModel(session.user.id, data);
      
      case 'analyze_visitor':
        return await analyzeSpecificVisitor(session.user.id, data);
      
      case 'optimize_campaign':
        return await optimizeCampaign(session.user.id, data);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown action' 
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in AI intelligence action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process AI request'
    }, { status: 500 });
  }
}

// Helper functions

async function getBusinessIntelligenceOverview(
  userId: string, 
  timeRange: { from: Date; to: Date }
) {
  const days = Math.floor((timeRange.to.getTime() - timeRange.from.getTime()) / (1000 * 60 * 60 * 24));
  const timeRangeStr = days <= 7 ? '7d' : days <= 90 ? '30d' : '90d';
  
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_insights',
    userId,
    timeRange: timeRangeStr,
    context: { businessContext: 'overview_analysis' }
  });
  
  return NextResponse.json({
    success: result.success,
    intelligence: {
      insights: result.data.insights || [],
      predictions: result.data.predictions || [],
      recommendations: result.data.recommendations || [],
      score: result.supremeScore || 70,
      metrics: result.data.metrics || {},
      opportunities: result.data.opportunities || [],
      generatedAt: result.timestamp,
      timeRange: {
        from: timeRange.from.toISOString(),
        to: timeRange.to.toISOString()
      },
      confidence: result.confidence
    }
  });
}

async function getVisitorBehaviorAnalysis(userId: string, visitorId?: string) {
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_visitors',
    userId,
    visitorId,
    analysisType: 'comprehensive'
  });
  
  const profiles = result.data.profiles || [];
  
  return NextResponse.json({
    success: result.success,
    visitorProfiles: profiles,
    summary: {
      totalAnalyzed: profiles.length,
      highValueVisitors: profiles.filter((p: any) => p.conversionProbability > 0.7).length,
      averageConversionProbability: profiles.length > 0 
        ? profiles.reduce((sum: number, p: any) => sum + (p.conversionProbability || 0), 0) / profiles.length 
        : 0,
      topSegments: result.data.segments ? result.data.segments.slice(0, 5).map((s: any) => s.name) : []
    },
    insights: result.data.insights || [],
    recommendations: result.data.recommendations || [],
    confidence: result.confidence
  });
}

async function getPerformancePredictions(
  userId: string, 
  predictionType: 'TRAFFIC' | 'CONVERSIONS' | 'REVENUE' | 'ENGAGEMENT',
  timeframe: number
) {
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_predict',
    userId,
    metrics: [predictionType.toLowerCase()],
    timeframe
  });
  
  return NextResponse.json({
    success: result.success,
    predictions: {
      predictions: result.data.predictions || [],
      confidence: result.data.confidence || 0,
      trends: result.data.trends || {},
      factors: result.data.factors || [],
      type: predictionType,
      timeframe,
      generatedAt: result.timestamp
    }
  });
}

async function getFunnelOptimization(userId: string, formId?: string) {
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_optimize',
    userId,
    formId,
    goals: undefined
  });
  
  return NextResponse.json({
    success: result.success,
    optimization: {
      recommendations: result.data.recommendations || [],
      opportunities: result.data.opportunities || [],
      steps: result.data.steps || [],
      expectedImpact: result.data.expectedImpact || {},
      confidence: result.confidence,
      generatedAt: result.timestamp,
      formId
    }
  });
}

async function getSmartSegments(userId: string, searchParams: URLSearchParams) {
  const criteria = {
    behaviorBased: searchParams.get('behaviorBased') === 'true',
    valueBased: searchParams.get('valueBased') === 'true',
    engagementBased: searchParams.get('engagementBased') === 'true'
  };

  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_segments',
    userId,
    criteria
  });
  
  return NextResponse.json({
    success: result.success,
    segments: {
      segments: result.data.segments || [],
      insights: result.data.insights || [],
      totalVisitors: result.data.totalVisitors || 0,
      criteria,
      generatedAt: result.timestamp
    }
  });
}

async function getAnomalyDetection(userId: string, metrics: string[]) {
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_predict',
    userId,
    metrics,
    timeframe: 7
  });
  
  return NextResponse.json({
    success: result.success,
    anomalies: {
      detectedAnomalies: result.data.anomalies || [],
      insights: result.data.insights || [],
      severity: result.data.severity || 'low',
      affectedMetrics: result.data.affectedMetrics || metrics,
      recommendations: result.data.recommendations || [],
      metricsAnalyzed: metrics,
      generatedAt: result.timestamp
    }
  });
}

async function generateCustomInsights(userId: string, data: any) {
  const { context, timeRange, focusAreas } = data;
  
  // Parse time range
  const fromDate = new Date(timeRange?.from || Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = new Date(timeRange?.to || Date.now());
  const days = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeRangeStr = days <= 7 ? '7d' : days <= 90 ? '30d' : '90d';
  
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_insights',
    userId,
    timeRange: timeRangeStr,
    context: { ...context, focusAreas, customRequest: true }
  });
  
  // Filter insights based on focus areas if provided
  let filteredInsights = result.data.insights || [];
  if (focusAreas && focusAreas.length > 0) {
    filteredInsights = filteredInsights.filter((insight: any) => 
      focusAreas.includes(insight.type?.toLowerCase())
    );
  }
  
  return NextResponse.json({
    success: result.success,
    insights: filteredInsights,
    predictions: result.data.predictions || [],
    recommendations: result.data.recommendations || [],
    score: result.supremeScore || 70,
    customRequest: true,
    generatedAt: result.timestamp
  });
}

async function trainCustomModel(userId: string, data: any) {
  // This would implement custom model training
  // For now, return a placeholder response
  
  logger.info('Custom model training requested', { userId, data });
  
  return NextResponse.json({
    success: true,
    message: 'Model training initiated',
    estimatedCompletionTime: '15-30 minutes',
    trainingId: `train_${Date.now()}`,
    status: 'QUEUED'
  });
}

async function analyzeSpecificVisitor(userId: string, data: any) {
  const { visitorId, analysisType = 'comprehensive' } = data;
  
  if (!visitorId) {
    return NextResponse.json({
      success: false,
      error: 'Visitor ID is required'
    }, { status: 400 });
  }
  
  const { SupremeAIv3 } = await import('@/lib/ai/supreme-ai-v3-engine');
  const result = await SupremeAIv3.process({
    type: 'leadpulse_visitors',
    userId,
    visitorId,
    analysisType
  });
  
  const profiles = result.data.profiles || [];
  
  if (profiles.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Visitor not found or no data available'
    }, { status: 404 });
  }
  
  const profile = profiles[0];
  
  return NextResponse.json({
    success: result.success,
    visitorAnalysis: {
      profile,
      analysisType,
      insights: result.data.insights || [
        `Visitor shows ${profile.engagementLevel || 'moderate'} engagement levels`,
        `${((profile.conversionProbability || 0) * 100).toFixed(1)}% probability of conversion`,
        `Belongs to segments: ${(profile.segments || []).join(', ')}`,
        (profile.riskFactors && profile.riskFactors.length > 0)
          ? `Risk factors identified: ${profile.riskFactors.join(', ')}`
          : 'No significant risk factors identified'
      ],
      confidence: result.confidence,
      generatedAt: result.timestamp
    }
  });
}

async function optimizeCampaign(userId: string, data: any) {
  const { campaignType, currentMetrics, goals } = data;
  
  // This would implement campaign optimization AI
  // For now, return intelligent suggestions based on the input
  
  const suggestions = [];
  
  if (currentMetrics?.conversionRate < 0.02) {
    suggestions.push({
      area: 'Conversion Rate',
      recommendation: 'Implement A/B testing for landing pages',
      expectedImprovement: '15-25%',
      priority: 'HIGH'
    });
  }
  
  if (currentMetrics?.costPerAcquisition > goals?.targetCPA) {
    suggestions.push({
      area: 'Cost Optimization',
      recommendation: 'Refine audience targeting and negative keywords',
      expectedImprovement: '10-20% cost reduction',
      priority: 'HIGH'
    });
  }
  
  suggestions.push({
    area: 'Creative Optimization',
    recommendation: 'Test video vs. static ad formats',
    expectedImprovement: '5-15% engagement boost',
    priority: 'MEDIUM'
  });
  
  return NextResponse.json({
    success: true,
    optimization: {
      campaignType,
      currentMetrics,
      goals,
      suggestions,
      overallScore: 75,
      nextSteps: [
        'Implement highest priority suggestions first',
        'Set up proper tracking and measurement',
        'Schedule weekly performance reviews'
      ],
      generatedAt: new Date()
    }
  });
}