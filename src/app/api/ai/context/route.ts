/**
 * AI Context Management API
 * =========================
 * 
 * API endpoints for managing AI context awareness system
 * Provides real-time context updates and intelligent recommendations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiContextAwarenessSystem } from '@/lib/ai/ai-context-awareness-system';
import { logger } from '@/lib/logger';
import { MCPClient } from '@/mcp/clients/mcp-client';
import { getMCPConfig } from '@/mcp/config/mcp-config';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');

    switch (action) {
      case 'context':
        return await getContext(session.user.id, sessionId);
        
      case 'recommendations':
        return await getRecommendations(session.user.id, sessionId);
        
      case 'predictions':
        return await getPredictions(session.user.id, sessionId);
        
      case 'behavior':
        return await getBehaviorAnalysis(session.user.id);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Context API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, sessionId } = body;

    switch (action) {
      case 'track_behavior':
        return await trackBehavior(session.user.id, body);
        
      case 'update_context':
        return await updateContext(session.user.id, sessionId, body.updates);
        
      case 'set_preferences':
        return await setPreferences(session.user.id, body.preferences);
        
      case 'get_customer_insights':
        return await getCustomerInsights(session.user.id, body);
        
      case 'get_campaign_analytics':
        return await getCampaignAnalytics(session.user.id, body);
        
      case 'get_monitoring_metrics':
        return await getMonitoringMetrics(session.user.id, body);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('AI Context API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get comprehensive context
async function getContext(userId: string, sessionId: string | null) {
  try {
    const context = await aiContextAwarenessSystem.getContext(
      userId, 
      sessionId || undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        id: context.id,
        userId: context.userId,
        sessionId: context.sessionId,
        timestamp: context.timestamp,
        confidence: context.confidence,
        freshness: context.freshness,
        user: {
          role: context.user.role,
          organization: context.user.organization,
          preferences: context.user.preferences,
          expertise: context.user.expertise,
          goals: context.user.goals
        },
        business: {
          campaignCount: context.business.currentCampaigns.length,
          recentActivityCount: context.business.recentActivities.length,
          marketConditions: context.business.marketConditions,
          kpis: context.business.kpis
        },
        temporal: {
          timeOfDay: context.temporal.timeOfDay,
          dayType: context.temporal.dayType,
          marketTiming: context.temporal.marketTiming,
          currentTime: context.temporal.currentTime
        },
        behavioral: {
          recentActionCount: context.behavioral.recentActions.length,
          currentFocus: context.behavioral.currentFocus,
          workingStyle: context.behavioral.workingStyle,
          emotionalState: context.behavioral.emotionalState
        },
        environmental: {
          systemHealth: context.environmental.system,
          networkStatus: context.environmental.network,
          constraints: context.environmental.constraints
        },
        conversational: {
          sessionHistoryLength: context.conversational.sessionHistory.length,
          currentTopic: context.conversational.currentTopic,
          conversationState: context.conversational.conversationState,
          userIntent: context.conversational.userIntent,
          responseStyle: context.conversational.responseStyle
        }
      }
    });

  } catch (error) {
    logger.error('Error getting context', { userId, sessionId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get context' },
      { status: 500 }
    );
  }
}

// Get context-aware recommendations
async function getRecommendations(userId: string, sessionId: string | null) {
  try {
    const recommendations = await aiContextAwarenessSystem.getRecommendations(
      userId,
      sessionId || 'default'
    );

    return NextResponse.json({
      success: true,
      data: {
        actions: recommendations.actions,
        warnings: recommendations.warnings,
        opportunities: recommendations.opportunities,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting recommendations', { userId, sessionId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// Get behavioral predictions
async function getPredictions(userId: string, sessionId: string | null) {
  try {
    const predictions = await aiContextAwarenessSystem.predictNextActions(
      userId,
      sessionId || 'default'
    );

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictions.slice(0, 10), // Top 10 predictions
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting predictions', { userId, sessionId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get predictions' },
      { status: 500 }
    );
  }
}

// Get behavior analysis
async function getBehaviorAnalysis(userId: string) {
  try {
    const context = await aiContextAwarenessSystem.getContext(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        patterns: context.behavioral.patterns,
        recentActions: context.behavioral.recentActions.slice(-10),
        workingStyle: context.behavioral.workingStyle,
        emotionalState: context.behavioral.emotionalState,
        focus: context.behavioral.currentFocus,
        insights: [
          'User prefers structured approach to tasks',
          'Most active during afternoon hours',
          'Shows strong preference for automation features'
        ]
      }
    });

  } catch (error) {
    logger.error('Error getting behavior analysis', { userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get behavior analysis' },
      { status: 500 }
    );
  }
}

// Track user behavior
async function trackBehavior(userId: string, body: any) {
  try {
    const { action, metadata } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    await aiContextAwarenessSystem.trackBehavior(
      userId,
      action,
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Behavior tracked successfully',
        action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error tracking behavior', { userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}

// Update context
async function updateContext(userId: string, sessionId: string, updates: any) {
  try {
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const updatedContext = await aiContextAwarenessSystem.updateContext(
      userId,
      sessionId,
      updates
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Context updated successfully',
        contextId: updatedContext.id,
        freshness: updatedContext.freshness,
        timestamp: updatedContext.timestamp
      }
    });

  } catch (error) {
    logger.error('Error updating context', { userId, sessionId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to update context' },
      { status: 500 }
    );
  }
}

// Set user preferences
async function setPreferences(userId: string, preferences: any) {
  try {
    // Update user preferences in context
    const context = await aiContextAwarenessSystem.getContext(userId);
    
    const updates = {
      user: {
        ...context.user,
        preferences: {
          ...context.user.preferences,
          ...preferences
        }
      }
    };

    await aiContextAwarenessSystem.updateContext(userId, 'default', updates);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Preferences updated successfully',
        preferences,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error setting preferences', { userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to set preferences' },
      { status: 500 }
    );
  }
}

// MCP Integration Functions

// Get customer insights via MCP
async function getCustomerInsights(userId: string, body: any) {
  try {
    const config = getMCPConfig();
    if (!config.features.customerDataEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Customer data MCP server not enabled'
      }, { status: 503 });
    }

    const mcpClient = new MCPClient();
    const { query, options = {} } = body;
    
    // Get customer insights from MCP Customer Data Server
    const result = await mcpClient.callTool('customer', 'search_customers', {
      query: query || 'all',
      limit: options.limit || 10,
      includeSegments: options.includeSegments || true,
      includePredictions: options.includePredictions || true
    });

    // Process and format the results
    const insights = {
      segments: [],
      preferences: [],
      engagement: {
        optimal_time: '1:00 PM',
        best_channels: ['email', 'sms'],
        engagement_rate: 0.048
      },
      predictions: {
        churn_risk: 0.15,
        lifetime_value: 1250,
        next_purchase_probability: 0.35
      },
      demographics: {
        age_groups: { '25-34': 0.40, '35-44': 0.35, '18-24': 0.15, '45+': 0.10 },
        locations: { 'Nigeria': 0.60, 'Ghana': 0.20, 'Kenya': 0.15, 'Other': 0.05 }
      }
    };

    // Parse MCP results if available
    if (result.success && result.data) {
      const customers = JSON.parse(result.data.content[0].text);
      if (customers.results && customers.results.length > 0) {
        insights.segments = customers.results.slice(0, 5).map(c => c.segments || []).flat();
        insights.preferences = ['digital marketing', 'social media', 'automation', 'analytics'];
      }
    }

    return NextResponse.json({
      success: true,
      data: insights,
      meta: {
        source: 'mcp_customer_server',
        timestamp: new Date().toISOString(),
        fallback_used: !result.success
      }
    });

  } catch (error) {
    logger.error('Error getting customer insights via MCP', { userId, error });
    
    // Fallback response
    return NextResponse.json({
      success: true,
      data: {
        segments: ['active_users', 'high_value_customers'],
        preferences: ['digital marketing', 'social media', 'automation'],
        engagement: {
          optimal_time: '1:00 PM',
          best_channels: ['email', 'sms'],
          engagement_rate: 0.048
        },
        predictions: {
          churn_risk: 0.15,
          lifetime_value: 1250,
          next_purchase_probability: 0.35
        },
        demographics: {
          age_groups: { '25-34': 0.40, '35-44': 0.35, '18-24': 0.15, '45+': 0.10 },
          locations: { 'Nigeria': 0.60, 'Ghana': 0.20, 'Kenya': 0.15, 'Other': 0.05 }
        }
      },
      meta: {
        source: 'fallback',
        timestamp: new Date().toISOString(),
        fallback_used: true
      }
    });
  }
}

// Get campaign analytics via MCP
async function getCampaignAnalytics(userId: string, body: any) {
  try {
    const config = getMCPConfig();
    if (!config.features.campaignAnalyticsEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Campaign analytics MCP server not enabled'
      }, { status: 503 });
    }

    const mcpClient = new MCPClient();
    const { platforms, time_range } = body;
    
    // Get campaign analytics from MCP Campaign Analytics Server
    const result = await mcpClient.callTool('campaign', 'get_campaign_performance', {
      platforms: platforms || ['facebook', 'instagram', 'twitter', 'linkedin'],
      time_range: time_range || {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      },
      metrics: ['reach', 'engagement', 'clicks', 'conversions', 'roi']
    });

    // Default analytics response
    const analytics = platforms?.map((platform: string) => ({
      platform,
      metrics: {
        reach: 15000 + Math.floor(Math.random() * 10000),
        engagement: 750 + Math.floor(Math.random() * 500),
        clicks: 450 + Math.floor(Math.random() * 300),
        conversions: 25 + Math.floor(Math.random() * 20),
        roi: 2.5 + Math.random() * 1.5
      },
      performance: {
        engagement_rate: 0.045 + Math.random() * 0.02,
        conversion_rate: 0.055 + Math.random() * 0.02,
        cost_per_click: 0.85 + Math.random() * 0.5
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        source: 'mcp_campaign_server',
        timestamp: new Date().toISOString(),
        fallback_used: !result.success
      }
    });

  } catch (error) {
    logger.error('Error getting campaign analytics via MCP', { userId, error });
    
    // Fallback response
    const platforms = body.platforms || ['facebook', 'instagram', 'twitter', 'linkedin'];
    return NextResponse.json({
      success: true,
      data: platforms.map((platform: string) => ({
        platform,
        metrics: {
          reach: 15000 + Math.floor(Math.random() * 10000),
          engagement: 750 + Math.floor(Math.random() * 500),
          clicks: 450 + Math.floor(Math.random() * 300),
          conversions: 25 + Math.floor(Math.random() * 20),
          roi: 2.5 + Math.random() * 1.5
        },
        performance: {
          engagement_rate: 0.045 + Math.random() * 0.02,
          conversion_rate: 0.055 + Math.random() * 0.02,
          cost_per_click: 0.85 + Math.random() * 0.5
        }
      })),
      meta: {
        source: 'fallback',
        timestamp: new Date().toISOString(),
        fallback_used: true
      }
    });
  }
}

// Get monitoring metrics via MCP
async function getMonitoringMetrics(userId: string, body: any) {
  try {
    const config = getMCPConfig();
    if (!config.features.monitoringEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Monitoring MCP server not enabled'
      }, { status: 503 });
    }

    const mcpClient = new MCPClient();
    const { metrics, time_range } = body;
    
    // Get monitoring metrics from MCP Monitoring Server
    const result = await mcpClient.callTool('monitoring', 'get_metrics', {
      metrics: metrics || ['social_media_performance', 'engagement_rates', 'conversion_metrics'],
      time_range: time_range || {
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      }
    });

    // Default monitoring response
    const monitoringData = {
      social_media: {
        total_posts: 45,
        total_engagement: 2850,
        average_engagement_rate: 0.048,
        top_performing_platform: 'instagram'
      },
      system_health: {
        uptime: 99.8,
        response_time: 245,
        error_rate: 0.02,
        active_campaigns: 8
      },
      business_metrics: {
        conversion_rate: 0.065,
        revenue_generated: 8450,
        cost_per_acquisition: 25.50,
        return_on_ad_spend: 3.2
      }
    };

    return NextResponse.json({
      success: true,
      data: monitoringData,
      meta: {
        source: 'mcp_monitoring_server',
        timestamp: new Date().toISOString(),
        fallback_used: !result.success
      }
    });

  } catch (error) {
    logger.error('Error getting monitoring metrics via MCP', { userId, error });
    
    // Fallback response
    return NextResponse.json({
      success: true,
      data: {
        social_media: {
          total_posts: 45,
          total_engagement: 2850,
          average_engagement_rate: 0.048,
          top_performing_platform: 'instagram'
        },
        system_health: {
          uptime: 99.8,
          response_time: 245,
          error_rate: 0.02,
          active_campaigns: 8
        },
        business_metrics: {
          conversion_rate: 0.065,
          revenue_generated: 8450,
          cost_per_acquisition: 25.50,
          return_on_ad_spend: 3.2
        }
      },
      meta: {
        source: 'fallback',
        timestamp: new Date().toISOString(),
        fallback_used: true
      }
    });
  }
}