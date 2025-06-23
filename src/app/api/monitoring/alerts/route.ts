import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { EnterpriseErrorHandler, EnterpriseErrorType } from '@/lib/errors/enterprise-error-handling';

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'availability' | 'error' | 'sla' | 'security' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  affectedServices: string[];
  metrics?: {
    threshold?: number;
    current?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
  recommendations: string[];
  correlationId?: string;
  tenantId?: string;
}

interface AlertsResponse {
  alerts: PerformanceAlert[];
  summary: {
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  timestamp: string;
}

// GET - Fetch performance alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return EnterpriseErrorHandler.getInstance().createErrorResponse(
        EnterpriseErrorType.UNAUTHORIZED_TENANT_ACCESS,
        { endpoint: '/api/monitoring/alerts' }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    // Generate realistic alerts for demonstration
    const alerts = generateMockAlerts();
    
    // Apply filters
    let filteredAlerts = alerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    if (resolved !== null) {
      const isResolved = resolved === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved);
    }

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

    // Generate summary statistics
    const summary = {
      total: filteredAlerts.length,
      unresolved: filteredAlerts.filter(alert => !alert.resolved).length,
      byType: filteredAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: filteredAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const response: AlertsResponse = {
      alerts: paginatedAlerts,
      summary,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        limit,
        offset,
        hasMore: offset + limit < filteredAlerts.length
      }
    });

  } catch (error) {
    logger.error('Alerts API error:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return EnterpriseErrorHandler.getInstance().createErrorResponse(
      EnterpriseErrorType.DATA_SOURCE_UNAVAILABLE,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/monitoring/alerts' 
      }
    );
  }
}

// POST - Create or update alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return EnterpriseErrorHandler.getInstance().createErrorResponse(
        EnterpriseErrorType.UNAUTHORIZED_TENANT_ACCESS,
        { endpoint: '/api/monitoring/alerts' }
      );
    }

    const body = await request.json();
    const { action, alertId, ...alertData } = body;

    if (action === 'resolve' && alertId) {
      // Resolve an existing alert
      const resolvedAlert = await resolveAlert(alertId, session.user.id);
      
      logger.info('Alert resolved', {
        alertId,
        resolvedBy: session.user.id,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Alert resolved successfully',
        data: resolvedAlert
      });
    } else if (action === 'create') {
      // Create a new alert
      const newAlert = await createAlert(alertData, session.user.id);
      
      logger.info('Alert created', {
        alertId: newAlert.id,
        type: newAlert.type,
        severity: newAlert.severity,
        createdBy: session.user.id
      });

      return NextResponse.json({
        success: true,
        message: 'Alert created successfully',
        data: newAlert
      });
    } else {
      return EnterpriseErrorHandler.getInstance().createErrorResponse(
        EnterpriseErrorType.DATA_QUALITY_ISSUE,
        { message: 'Invalid action or missing alertId' }
      );
    }

  } catch (error) {
    logger.error('Alert operation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return EnterpriseErrorHandler.getInstance().createErrorResponse(
      EnterpriseErrorType.API_INTEGRATION_ERROR,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/monitoring/alerts' 
      }
    );
  }
}

function generateMockAlerts(): PerformanceAlert[] {
  const currentTime = new Date();
  
  return [
    {
      id: 'alert_001',
      type: 'performance',
      severity: 'high',
      message: 'API response time exceeded 5s threshold for /api/email/campaigns',
      description: 'The email campaigns API is experiencing degraded performance with response times averaging 6.2 seconds, well above the 5-second SLA threshold.',
      timestamp: new Date(currentTime.getTime() - 15 * 60 * 1000), // 15 minutes ago
      resolved: false,
      affectedServices: ['Email Campaigns', 'Campaign Analytics', 'Automation Workflows'],
      metrics: {
        threshold: 5000,
        current: 6200,
        trend: 'increasing'
      },
      recommendations: [
        'Check database query performance for campaign retrieval',
        'Review recent code deployments to campaigns service',
        'Consider scaling up email processing workers',
        'Implement query optimization for large campaign datasets'
      ],
      correlationId: 'perf_001_20241215'
    },
    {
      id: 'alert_002',
      type: 'sla',
      severity: 'medium',
      message: 'SLA compliance dropped below 99.9% for AI Intelligence endpoints',
      description: 'AI Intelligence API endpoints are showing 99.87% uptime over the last 4 hours, falling below the enterprise SLA requirement of 99.9%.',
      timestamp: new Date(currentTime.getTime() - 45 * 60 * 1000), // 45 minutes ago
      resolved: true,
      resolvedAt: new Date(currentTime.getTime() - 10 * 60 * 1000), // 10 minutes ago
      resolvedBy: 'system-auto-recovery',
      affectedServices: ['AI Intelligence', 'Predictive Analytics', 'Content Intelligence'],
      metrics: {
        threshold: 99.9,
        current: 99.87,
        trend: 'stable'
      },
      recommendations: [
        'Monitor AI model loading times',
        'Check GPU resource allocation',
        'Review ML pipeline health',
        'Consider implementing circuit breakers'
      ],
      correlationId: 'sla_002_20241215'
    },
    {
      id: 'alert_003',
      type: 'availability',
      severity: 'low',
      message: 'Scheduled maintenance completed successfully',
      description: 'Database maintenance window completed successfully with no data loss. All services have been restored to full capacity.',
      timestamp: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      resolved: true,
      resolvedAt: new Date(currentTime.getTime() - 105 * 60 * 1000), // 1h 45m ago
      resolvedBy: 'maintenance-team',
      affectedServices: ['All Services'],
      recommendations: [
        'Maintenance completed as scheduled',
        'All systems operating normally',
        'Next maintenance window: January 15, 2024'
      ],
      correlationId: 'maint_003_20241215'
    },
    {
      id: 'alert_004',
      type: 'error',
      severity: 'medium',
      message: 'Increased error rate detected in SMS gateway integration',
      description: 'SMS delivery service showing 3.2% error rate over the last hour, above the normal baseline of 0.5%.',
      timestamp: new Date(currentTime.getTime() - 30 * 60 * 1000), // 30 minutes ago
      resolved: false,
      affectedServices: ['SMS Campaigns', 'Two-Factor Authentication', 'Notifications'],
      metrics: {
        threshold: 1.0,
        current: 3.2,
        trend: 'increasing'
      },
      recommendations: [
        'Check SMS provider API status',
        'Verify SMS gateway credentials',
        'Review message content for compliance issues',
        'Consider switching to backup SMS provider'
      ],
      correlationId: 'error_004_20241215'
    },
    {
      id: 'alert_005',
      type: 'security',
      severity: 'critical',
      message: 'Unusual API access pattern detected',
      description: 'Detected 500+ API calls from a single IP address in Nigeria within 5 minutes, exceeding normal usage patterns by 1000%.',
      timestamp: new Date(currentTime.getTime() - 5 * 60 * 1000), // 5 minutes ago
      resolved: false,
      affectedServices: ['API Gateway', 'Authentication Service'],
      metrics: {
        threshold: 50,
        current: 523,
        trend: 'increasing'
      },
      recommendations: [
        'IMMEDIATE: Review API access logs',
        'Check if legitimate high-volume integration',
        'Consider temporary rate limiting for this IP',
        'Verify API key security and rotation',
        'Contact security team if suspicious activity confirmed'
      ],
      correlationId: 'sec_005_20241215',
      tenantId: 'tenant_enterprise_bank_ng'
    },
    {
      id: 'alert_006',
      type: 'compliance',
      severity: 'high',
      message: 'Data retention policy violation detected',
      description: 'Customer data found that exceeds the configured 7-year retention policy for Nigerian banking regulations.',
      timestamp: new Date(currentTime.getTime() - 60 * 60 * 1000), // 1 hour ago
      resolved: false,
      affectedServices: ['Data Management', 'Customer Records', 'Compliance Dashboard'],
      recommendations: [
        'URGENT: Review data retention configuration',
        'Identify affected customer records',
        'Implement automated data archival process',
        'Notify compliance team immediately',
        'Document remediation actions for audit trail'
      ],
      correlationId: 'comp_006_20241215',
      tenantId: 'tenant_microfinance_ke'
    },
    {
      id: 'alert_007',
      type: 'performance',
      severity: 'low',
      message: 'Database connection pool utilization at 75%',
      description: 'Main application database showing 75% connection pool utilization, approaching the 80% warning threshold.',
      timestamp: new Date(currentTime.getTime() - 20 * 60 * 1000), // 20 minutes ago
      resolved: false,
      affectedServices: ['Database', 'All API Endpoints'],
      metrics: {
        threshold: 80,
        current: 75,
        trend: 'stable'
      },
      recommendations: [
        'Monitor connection pool usage trends',
        'Review long-running queries',
        'Consider connection pool size adjustment',
        'Optimize database query performance'
      ],
      correlationId: 'perf_007_20241215'
    }
  ];
}

async function resolveAlert(alertId: string, userId: string): Promise<PerformanceAlert | null> {
  // In production, update the alert in the database
  // For now, return a mock resolved alert
  const mockAlert: PerformanceAlert = {
    id: alertId,
    type: 'performance',
    severity: 'medium',
    message: 'Alert resolved',
    description: 'Alert has been manually resolved',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    resolved: true,
    resolvedAt: new Date(),
    resolvedBy: userId,
    affectedServices: ['Sample Service'],
    recommendations: ['Alert resolved']
  };
  
  return mockAlert;
}

async function createAlert(alertData: any, userId: string): Promise<PerformanceAlert> {
  // In production, save the alert to the database
  const newAlert: PerformanceAlert = {
    id: `alert_${Date.now()}`,
    type: alertData.type || 'performance',
    severity: alertData.severity || 'medium',
    message: alertData.message || 'New alert',
    description: alertData.description || '',
    timestamp: new Date(),
    resolved: false,
    affectedServices: alertData.affectedServices || [],
    recommendations: alertData.recommendations || [],
    correlationId: `manual_${Date.now()}`
  };
  
  return newAlert;
} 