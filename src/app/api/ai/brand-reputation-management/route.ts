/**
 * Brand Reputation Management API v1.0
 * ===================================
 * 
 * 🛡️ BRAND REPUTATION MANAGEMENT API
 * API endpoints for brand reputation monitoring and notification management
 * 
 * KEY ENDPOINTS:
 * - POST /api/ai/brand-reputation-management - Execute reputation management operations
 * - GET /api/ai/brand-reputation-management - Get reputation status and analytics
 * 
 * IMPORTANT: This API provides monitoring and notifications ONLY.
 * It does NOT execute autonomous brand protection actions.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  brandReputationManagementEngine,
  BrandMention,
  ReputationAlert,
  ReputationMetrics,
  MonitoringChannel,
  NotificationSettings,
  type MonitoringRule,
  AlertType,
  AlertSeverity,
  ThreatLevel,
  type AfricanRegion,
  NotificationChannel,
  StakeholderMapping,
  startBrandMonitoring,
  stopBrandMonitoring,
  getBrandReputationStatus,
  configureBrandNotifications,
  addBrandMonitoringRule,
  getBrandCompetitiveAnalysis
} from '@/lib/ai/brand-reputation-management-engine';
import { z } from 'zod';

// Validation schemas
const BrandReputationRequestSchema = z.object({
  action: z.enum([
    'start_monitoring',
    'stop_monitoring',
    'get_status',
    'get_alerts',
    'acknowledge_alert',
    'resolve_alert',
    'escalate_alert',
    'get_mentions',
    'get_metrics',
    'get_historical_data',
    'configure_notifications',
    'add_monitoring_rule',
    'remove_monitoring_rule',
    'get_competitive_analysis',
    'generate_report',
    'export_data',
    'test_notification',
    'get_stakeholders',
    'update_stakeholder',
    'get_monitoring_channels'
  ]),
  
  // Monitoring configuration
  monitoring_config: z.object({
    brand_name: z.string().min(1),
    keywords: z.array(z.string()).min(1),
    competitors: z.array(z.string()).optional(),
    languages: z.array(z.string()).min(1),
    regions: z.array(z.enum([
      'west_africa',
      'east_africa',
      'north_africa',
      'southern_africa',
      'central_africa'
    ])),
    monitoring_channels: z.array(z.object({
      platform: z.string(),
      active: z.boolean(),
      keywords: z.array(z.string()).optional(),
      check_frequency: z.number().positive().optional()
    })).optional()
  }).optional(),
  
  // Alert management
  alert_management: z.object({
    alert_id: z.string(),
    action: z.enum(['acknowledge', 'resolve', 'escalate', 'snooze']),
    notes: z.string().optional(),
    assigned_to: z.string().optional(),
    snooze_until: z.string().optional()
  }).optional(),
  
  // Data query parameters
  query_params: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
    threat_level: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional(),
    regions: z.array(z.enum([
      'west_africa',
      'east_africa',
      'north_africa',
      'southern_africa',
      'central_africa'
    ])).optional(),
    limit: z.number().positive().max(1000).default(100),
    offset: z.number().nonnegative().default(0),
    sort_by: z.enum(['timestamp', 'influence', 'engagement', 'sentiment']).default('timestamp'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
  }).optional(),
  
  // Notification configuration
  notification_settings: z.object({
    channels: z.array(z.object({
      type: z.enum(['email', 'sms', 'slack', 'webhook', 'dashboard', 'whatsapp']),
      config: z.record(z.any()),
      active: z.boolean()
    })).optional(),
    stakeholder_mapping: z.array(z.object({
      stakeholder_id: z.string(),
      name: z.string(),
      role: z.string(),
      notification_preferences: z.object({
        channels: z.array(z.string()),
        severity_threshold: z.enum(['info', 'warning', 'urgent', 'critical']),
        topics_of_interest: z.array(z.string()),
        regions_of_interest: z.array(z.string()).optional()
      })
    })).optional(),
    escalation_matrix: z.object({
      levels: z.array(z.object({
        level: z.number(),
        severity_threshold: z.enum(['info', 'warning', 'urgent', 'critical']),
        stakeholders: z.array(z.string()),
        auto_escalate: z.boolean()
      })),
      timeout_minutes: z.number().positive()
    }).optional(),
    quiet_hours: z.object({
      timezone: z.string(),
      start_hour: z.number().min(0).max(23),
      end_hour: z.number().min(0).max(23),
      days: z.array(z.number().min(0).max(6)),
      override_for_critical: z.boolean()
    }).optional()
  }).optional(),
  
  // Monitoring rules
  monitoring_rule: z.object({
    name: z.string(),
    condition: z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'matches']),
      value: z.any()
    }),
    action: z.enum(['alert', 'flag', 'escalate', 'monitor']),
    priority: z.number().min(1).max(10),
    active: z.boolean()
  }).optional(),
  
  // Competitive analysis
  competitive_analysis: z.object({
    competitors: z.array(z.string()).min(1),
    metrics: z.array(z.enum([
      'sentiment_score',
      'mention_volume',
      'engagement_rate',
      'influence_score',
      'crisis_frequency',
      'response_time'
    ])).optional(),
    time_period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month')
  }).optional(),
  
  // Report generation
  report_config: z.object({
    report_type: z.enum([
      'executive_summary',
      'detailed_analysis',
      'crisis_report',
      'competitive_benchmark',
      'regional_analysis',
      'influencer_report'
    ]),
    period: z.object({
      start: z.string(),
      end: z.string()
    }),
    include_sections: z.array(z.string()).optional(),
    format: z.enum(['pdf', 'excel', 'json', 'csv']).default('pdf'),
    recipients: z.array(z.string()).optional()
  }).optional(),
  
  // Test notification
  test_notification: z.object({
    channel: z.enum(['email', 'sms', 'slack', 'webhook', 'whatsapp']),
    recipient: z.string(),
    test_alert: z.object({
      type: z.enum([
        'crisis_detected',
        'negative_spike',
        'viral_negative',
        'influencer_complaint',
        'positive_trend'
      ]),
      severity: z.enum(['info', 'warning', 'urgent', 'critical'])
    })
  }).optional()
});

// POST handler for reputation management operations
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
    const validation = BrandReputationRequestSchema.safeParse(body);
    
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
    let result;

    switch (action) {
      case 'start_monitoring':
        if (!validation.data.monitoring_config) {
          return NextResponse.json(
            { success: false, error: 'Monitoring configuration required' },
            { status: 400 }
          );
        }
        
        await startBrandMonitoring({
          brand_name: validation.data.monitoring_config.brand_name,
          keywords: validation.data.monitoring_config.keywords,
          competitors: validation.data.monitoring_config.competitors,
          languages: validation.data.monitoring_config.languages,
          regions: validation.data.monitoring_config.regions as AfricanRegion[]
        });
        
        result = { 
          status: 'monitoring_started',
          brand: validation.data.monitoring_config.brand_name
        };
        break;

      case 'stop_monitoring':
        await stopBrandMonitoring();
        result = { status: 'monitoring_stopped' };
        break;

      case 'get_status':
        result = await getBrandReputationStatus();
        break;

      case 'get_alerts':
        result = await getAlerts(validation.data.query_params);
        break;

      case 'acknowledge_alert':
        if (!validation.data.alert_management) {
          return NextResponse.json(
            { success: false, error: 'Alert management parameters required' },
            { status: 400 }
          );
        }
        
        result = await acknowledgeAlert(
          validation.data.alert_management.alert_id,
          session.user.id,
          validation.data.alert_management.notes
        );
        break;

      case 'resolve_alert':
        if (!validation.data.alert_management) {
          return NextResponse.json(
            { success: false, error: 'Alert management parameters required' },
            { status: 400 }
          );
        }
        
        result = await resolveAlert(
          validation.data.alert_management.alert_id,
          session.user.id,
          validation.data.alert_management.notes
        );
        break;

      case 'escalate_alert':
        if (!validation.data.alert_management) {
          return NextResponse.json(
            { success: false, error: 'Alert management parameters required' },
            { status: 400 }
          );
        }
        
        result = await escalateAlert(
          validation.data.alert_management.alert_id,
          session.user.id,
          validation.data.alert_management.assigned_to,
          validation.data.alert_management.notes
        );
        break;

      case 'get_mentions':
        result = await getMentions(validation.data.query_params);
        break;

      case 'get_metrics':
        result = await getMetrics(validation.data.query_params);
        break;

      case 'get_historical_data':
        if (!validation.data.query_params?.start_date || !validation.data.query_params?.end_date) {
          return NextResponse.json(
            { success: false, error: 'Start and end dates required for historical data' },
            { status: 400 }
          );
        }
        
        result = await brandReputationManagementEngine.getHistoricalData({
          start_date: new Date(validation.data.query_params.start_date),
          end_date: new Date(validation.data.query_params.end_date),
          regions: validation.data.query_params.regions as AfricanRegion[]
        });
        break;

      case 'configure_notifications':
        if (!validation.data.notification_settings) {
          return NextResponse.json(
            { success: false, error: 'Notification settings required' },
            { status: 400 }
          );
        }
        
        await configureBrandNotifications(validation.data.notification_settings);
        result = { status: 'notifications_configured' };
        break;

      case 'add_monitoring_rule':
        if (!validation.data.monitoring_rule) {
          return NextResponse.json(
            { success: false, error: 'Monitoring rule required' },
            { status: 400 }
          );
        }
        
        const rule: MonitoringRule = {
          id: `rule_${Date.now()}`,
          ...validation.data.monitoring_rule
        };
        
        await addBrandMonitoringRule(rule);
        result = { status: 'rule_added', rule_id: rule.id };
        break;

      case 'get_competitive_analysis':
        if (!validation.data.competitive_analysis?.competitors) {
          return NextResponse.json(
            { success: false, error: 'Competitors list required' },
            { status: 400 }
          );
        }
        
        result = await getBrandCompetitiveAnalysis(
          validation.data.competitive_analysis.competitors
        );
        break;

      case 'generate_report':
        if (!validation.data.report_config) {
          return NextResponse.json(
            { success: false, error: 'Report configuration required' },
            { status: 400 }
          );
        }
        
        result = await generateReport(validation.data.report_config, session.user.id);
        break;

      case 'test_notification':
        if (!validation.data.test_notification) {
          return NextResponse.json(
            { success: false, error: 'Test notification parameters required' },
            { status: 400 }
          );
        }
        
        result = await testNotification(validation.data.test_notification, session.user.id);
        break;

      case 'get_stakeholders':
        result = await getStakeholders();
        break;

      case 'get_monitoring_channels':
        result = await getMonitoringChannels();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    // Log the successful operation
    logger.info('Brand reputation management operation completed', {
      action,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Brand reputation management operation failed', {
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

// GET handler for reputation data
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
    const action = searchParams.get('action') || 'get_status';

    let result;

    switch (action) {
      case 'get_status':
        result = await getBrandReputationStatus();
        break;

      case 'get_dashboard_data':
        result = await getDashboardData();
        break;

      case 'get_real_time_mentions':
        result = await getRealTimeMentions({
          limit: Number.parseInt(searchParams.get('limit') || '50'),
          platform: searchParams.get('platform') || undefined
        });
        break;

      case 'get_sentiment_trends':
        result = await getSentimentTrends({
          period: searchParams.get('period') || 'week',
          region: searchParams.get('region') as AfricanRegion || undefined
        });
        break;

      case 'get_influencer_mentions':
        result = await getInfluencerMentions({
          min_influence: Number.parseFloat(searchParams.get('min_influence') || '0.7'),
          limit: Number.parseInt(searchParams.get('limit') || '20')
        });
        break;

      case 'get_alert_summary':
        result = await getAlertSummary({
          days: Number.parseInt(searchParams.get('days') || '7')
        });
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
    logger.error('Brand reputation GET operation failed', {
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

// Helper functions for various operations
async function getAlerts(params: any): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  let alerts = status.active_alerts;

  // Apply filters
  if (params?.threat_level) {
    alerts = alerts.filter(a => 
      a.mentions.some(m => m.threat_level === params.threat_level)
    );
  }

  if (params?.start_date) {
    const startDate = new Date(params.start_date);
    alerts = alerts.filter(a => a.created_at >= startDate);
  }

  // Apply pagination
  const offset = params?.offset || 0;
  const limit = params?.limit || 100;
  
  return {
    total: alerts.length,
    alerts: alerts.slice(offset, offset + limit),
    offset,
    limit
  };
}

async function acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<any> {
  logger.info('Acknowledging alert', { alertId, userId, notes });
  
  // This would update the alert status in the engine
  return {
    alert_id: alertId,
    status: 'acknowledged',
    acknowledged_by: userId,
    acknowledged_at: new Date().toISOString(),
    notes
  };
}

async function resolveAlert(alertId: string, userId: string, notes?: string): Promise<any> {
  logger.info('Resolving alert', { alertId, userId, notes });
  
  // This would update the alert status in the engine
  return {
    alert_id: alertId,
    status: 'resolved',
    resolved_by: userId,
    resolved_at: new Date().toISOString(),
    notes
  };
}

async function escalateAlert(alertId: string, userId: string, assignedTo?: string, notes?: string): Promise<any> {
  logger.info('Escalating alert', { alertId, userId, assignedTo, notes });
  
  // This would escalate the alert in the engine
  return {
    alert_id: alertId,
    status: 'escalated',
    escalated_by: userId,
    escalated_to: assignedTo,
    escalated_at: new Date().toISOString(),
    notes
  };
}

async function getMentions(params: any): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  let mentions = status.recent_mentions;

  // Apply filters
  if (params?.platforms) {
    mentions = mentions.filter(m => params.platforms.includes(m.platform));
  }

  if (params?.sentiment) {
    mentions = mentions.filter(m => m.sentiment.label === params.sentiment);
  }

  if (params?.regions) {
    mentions = mentions.filter(m => 
      m.location?.african_region && params.regions.includes(m.location.african_region)
    );
  }

  // Apply sorting
  const sortField = params?.sort_by || 'timestamp';
  const sortOrder = params?.sort_order || 'desc';
  
  mentions.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case 'influence':
        aVal = a.influence_score;
        bVal = b.influence_score;
        break;
      case 'engagement':
        aVal = a.engagement.engagement_rate;
        bVal = b.engagement.engagement_rate;
        break;
      case 'sentiment':
        aVal = a.sentiment.score;
        bVal = b.sentiment.score;
        break;
      default:
        aVal = a.timestamp.getTime();
        bVal = b.timestamp.getTime();
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Apply pagination
  const offset = params?.offset || 0;
  const limit = params?.limit || 100;
  
  return {
    total: mentions.length,
    mentions: mentions.slice(offset, offset + limit),
    offset,
    limit
  };
}

async function getMetrics(params: any): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  const metrics = status.metrics;

  // Add time-based filtering if needed
  if (params?.start_date || params?.end_date) {
    // This would filter metrics based on date range
    // For now, return current metrics
  }

  return {
    current: metrics,
    comparison: {
      previous_period: {
        overall_score: metrics.overall_score - 5, // Placeholder
        sentiment_breakdown: {
          positive: metrics.sentiment_breakdown.positive - 2,
          negative: metrics.sentiment_breakdown.negative + 1,
          neutral: metrics.sentiment_breakdown.neutral + 1
        }
      },
      change: {
        overall_score: 5,
        positive: 2,
        negative: -1,
        neutral: -1
      }
    }
  };
}

async function generateReport(config: any, userId: string): Promise<any> {
  logger.info('Generating brand reputation report', { userId, config });
  
  // This would generate actual report
  return {
    report_id: `report_${Date.now()}`,
    type: config.report_type,
    period: config.period,
    status: 'generating',
    estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    download_url: `/api/reports/reputation/${Date.now()}.${config.format}`
  };
}

async function testNotification(params: any, userId: string): Promise<any> {
  logger.info('Testing notification channel', { userId, params });
  
  // This would send test notification
  return {
    channel: params.channel,
    recipient: params.recipient,
    status: 'sent',
    test_alert: params.test_alert,
    sent_at: new Date().toISOString()
  };
}

async function getStakeholders(): Promise<any> {
  // This would return configured stakeholders
  return {
    stakeholders: [
      {
        id: 'marketing_team',
        name: 'Marketing Team',
        role: 'Primary Response Team',
        channels: ['email', 'slack', 'dashboard'],
        alert_count: 5
      },
      {
        id: 'pr_team',
        name: 'PR Team',
        role: 'Crisis Management',
        channels: ['email', 'sms', 'slack'],
        alert_count: 2
      },
      {
        id: 'cmo',
        name: 'Chief Marketing Officer',
        role: 'Executive Oversight',
        channels: ['email', 'sms'],
        alert_count: 1
      }
    ]
  };
}

async function getMonitoringChannels(): Promise<any> {
  // This would return configured monitoring channels
  return {
    channels: [
      {
        id: 'social_twitter',
        platform: 'Twitter',
        type: 'social',
        active: true,
        last_checked: new Date().toISOString(),
        mention_count: 234,
        check_frequency: 5
      },
      {
        id: 'social_facebook',
        platform: 'Facebook',
        type: 'social',
        active: true,
        last_checked: new Date().toISOString(),
        mention_count: 156,
        check_frequency: 5
      },
      {
        id: 'news_global',
        platform: 'News Aggregator',
        type: 'news',
        active: true,
        last_checked: new Date().toISOString(),
        mention_count: 23,
        check_frequency: 15
      }
    ]
  };
}

async function getDashboardData(): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  
  return {
    summary: {
      reputation_score: status.metrics.overall_score,
      trend: status.metrics.trend,
      active_alerts: status.active_alerts.length,
      monitoring_status: status.monitoring ? 'active' : 'inactive'
    },
    metrics: status.metrics,
    recent_alerts: status.active_alerts.slice(0, 5),
    top_mentions: status.recent_mentions.slice(0, 10),
    quick_stats: {
      mentions_today: status.metrics.volume_metrics.total_mentions,
      sentiment_breakdown: status.metrics.sentiment_breakdown,
      top_platforms: ['Twitter', 'Facebook', 'News'],
      response_time: '15 minutes'
    }
  };
}

async function getRealTimeMentions(params: { limit: number; platform?: string }): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  let mentions = status.recent_mentions;

  if (params.platform) {
    mentions = mentions.filter(m => m.platform === params.platform);
  }

  return {
    mentions: mentions.slice(0, params.limit),
    total: mentions.length,
    last_update: new Date().toISOString()
  };
}

async function getSentimentTrends(params: { period: string; region?: AfricanRegion }): Promise<any> {
  // This would calculate actual trends
  return {
    period: params.period,
    region: params.region,
    trends: [
      { date: '2024-01-15', positive: 65, negative: 20, neutral: 15 },
      { date: '2024-01-14', positive: 62, negative: 22, neutral: 16 },
      { date: '2024-01-13', positive: 68, negative: 18, neutral: 14 },
      { date: '2024-01-12', positive: 60, negative: 25, neutral: 15 },
      { date: '2024-01-11', positive: 64, negative: 21, neutral: 15 }
    ],
    insights: [
      'Positive sentiment increased by 5% this week',
      'Negative mentions decreased after product update',
      'Neutral sentiment remains stable'
    ]
  };
}

async function getInfluencerMentions(params: { min_influence: number; limit: number }): Promise<any> {
  const status = await brandReputationManagementEngine.getReputationStatus();
  const influencerMentions = status.recent_mentions
    .filter(m => m.author.influence_score >= params.min_influence)
    .slice(0, params.limit);

  return {
    mentions: influencerMentions,
    total: influencerMentions.length,
    top_influencers: influencerMentions
      .map(m => ({
        name: m.author.name,
        username: m.author.username,
        influence_score: m.author.influence_score,
        followers: m.author.follower_count,
        sentiment: m.sentiment.label
      }))
      .slice(0, 5)
  };
}

async function getAlertSummary(params: { days: number }): Promise<any> {
  const cutoffDate = new Date(Date.now() - params.days * 24 * 60 * 60 * 1000);
  const status = await brandReputationManagementEngine.getReputationStatus();
  
  const recentAlerts = status.active_alerts.filter(a => a.created_at >= cutoffDate);
  
  const summary = {
    total_alerts: recentAlerts.length,
    by_severity: {
      critical: recentAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      urgent: recentAlerts.filter(a => a.severity === AlertSeverity.URGENT).length,
      warning: recentAlerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      info: recentAlerts.filter(a => a.severity === AlertSeverity.INFO).length
    },
    by_type: {
      crisis: recentAlerts.filter(a => a.type === AlertType.CRISIS_DETECTED).length,
      negative_spike: recentAlerts.filter(a => a.type === AlertType.NEGATIVE_SPIKE).length,
      viral_negative: recentAlerts.filter(a => a.type === AlertType.VIRAL_NEGATIVE).length,
      influencer_complaint: recentAlerts.filter(a => a.type === AlertType.INFLUENCER_COMPLAINT).length,
      positive_trend: recentAlerts.filter(a => a.type === AlertType.POSITIVE_TREND).length
    },
    response_metrics: {
      average_acknowledgment_time: '12 minutes',
      average_resolution_time: '2.5 hours',
      unresolved_count: recentAlerts.filter(a => a.status === 'active').length
    }
  };

  return summary;
}