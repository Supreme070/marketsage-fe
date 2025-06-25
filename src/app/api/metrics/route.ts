/**
 * Prometheus Metrics Endpoint for LeadPulse
 * 
 * Exposes application metrics for monitoring and observability
 */

import { NextResponse } from 'next/server';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Initialize default metrics collection
collectDefaultMetrics({ register });

// LeadPulse-specific metrics
const visitorCounter = new Counter({
  name: 'leadpulse_visitors_total',
  help: 'Total number of visitors tracked',
  labelNames: ['device', 'country', 'converted'],
  registers: [register]
});

const visitorEngagementGauge = new Gauge({
  name: 'leadpulse_visitor_engagement_score',
  help: 'Current average visitor engagement score',
  registers: [register]
});

const formSubmissionCounter = new Counter({
  name: 'leadpulse_form_submissions_total',
  help: 'Total number of form submissions',
  labelNames: ['form_id', 'form_name', 'status'],
  registers: [register]
});

const formConversionGauge = new Gauge({
  name: 'leadpulse_form_conversion_rate',
  help: 'Form conversion rate as percentage',
  labelNames: ['form_id', 'form_name'],
  registers: [register]
});

const formCompletionTimeHistogram = new Histogram({
  name: 'leadpulse_form_completion_time_seconds',
  help: 'Time taken to complete forms in seconds',
  labelNames: ['form_id'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register]
});

const apiRequestDuration = new Histogram({
  name: 'leadpulse_api_request_duration_seconds',
  help: 'Duration of LeadPulse API requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const apiRequestCounter = new Counter({
  name: 'leadpulse_api_requests_total',
  help: 'Total number of LeadPulse API requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const cacheHitCounter = new Counter({
  name: 'leadpulse_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['operation', 'key_type'],
  registers: [register]
});

const cacheMissCounter = new Counter({
  name: 'leadpulse_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['operation', 'key_type'],
  registers: [register]
});

const crmSyncSuccessCounter = new Counter({
  name: 'leadpulse_crm_sync_success_total',
  help: 'Total number of successful CRM synchronizations',
  labelNames: ['platform', 'operation'],
  registers: [register]
});

const crmSyncErrorCounter = new Counter({
  name: 'leadpulse_crm_sync_errors_total',
  help: 'Total number of CRM synchronization errors',
  labelNames: ['platform', 'operation', 'error_type'],
  registers: [register]
});

const webhookDeliveryCounter = new Counter({
  name: 'leadpulse_webhook_deliveries_total',
  help: 'Total number of webhook deliveries',
  labelNames: ['event_type', 'status'],
  registers: [register]
});

const webhookDeliveryDuration = new Histogram({
  name: 'leadpulse_webhook_delivery_duration_seconds',
  help: 'Duration of webhook deliveries in seconds',
  labelNames: ['event_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const realtimeConnectionsGauge = new Gauge({
  name: 'leadpulse_realtime_connections_active',
  help: 'Number of active real-time WebSocket connections',
  registers: [register]
});

const aiIntelligenceRequestCounter = new Counter({
  name: 'leadpulse_ai_intelligence_requests_total',
  help: 'Total number of AI intelligence requests',
  labelNames: ['analysis_type', 'status'],
  registers: [register]
});

const aiIntelligenceLatency = new Histogram({
  name: 'leadpulse_ai_intelligence_latency_seconds',
  help: 'Latency of AI intelligence analysis in seconds',
  labelNames: ['analysis_type'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [register]
});

const securityEventCounter = new Counter({
  name: 'leadpulse_security_events_total',
  help: 'Total number of security events',
  labelNames: ['event_type', 'severity'],
  registers: [register]
});

const gdprRequestCounter = new Counter({
  name: 'leadpulse_gdpr_requests_total',
  help: 'Total number of GDPR compliance requests',
  labelNames: ['request_type', 'status'],
  registers: [register]
});

// Database connection gauge
const dbConnectionsGauge = new Gauge({
  name: 'leadpulse_database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

const dbQueryDuration = new Histogram({
  name: 'leadpulse_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

const dbQueryCounter = new Counter({
  name: 'leadpulse_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

// Export metrics for use in other parts of the application
export const metrics = {
  visitorCounter,
  visitorEngagementGauge,
  formSubmissionCounter,
  formConversionGauge,
  formCompletionTimeHistogram,
  apiRequestDuration,
  apiRequestCounter,
  cacheHitCounter,
  cacheMissCounter,
  crmSyncSuccessCounter,
  crmSyncErrorCounter,
  webhookDeliveryCounter,
  webhookDeliveryDuration,
  realtimeConnectionsGauge,
  aiIntelligenceRequestCounter,
  aiIntelligenceLatency,
  securityEventCounter,
  gdprRequestCounter,
  dbConnectionsGauge,
  dbQueryDuration,
  dbQueryCounter,
};

// Update metrics with current system state
async function updateCurrentMetrics() {
  try {
    // Update visitor engagement score
    const analytics = await leadPulseCache.getAnalyticsOverview();
    if (analytics?.avgEngagementScore) {
      visitorEngagementGauge.set(analytics.avgEngagementScore);
    }

    // Update real-time connections (this would come from WebSocket server)
    // For now, we'll use a placeholder
    // const activeConnections = await leadPulseRealtime.getActiveConnections();
    // realtimeConnectionsGauge.set(activeConnections);

    // Update form metrics
    const recentForms = await prisma.leadPulseForm.findMany({
      where: {
        status: 'active',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    for (const form of recentForms) {
      // This would need proper analytics calculation
      const conversionRate = 0; // Placeholder - calculate actual conversion rate
      formConversionGauge.set({ form_id: form.id, form_name: form.name }, conversionRate);
    }

    // Database connection metrics would be updated by Prisma middleware
    // For demonstration, we'll set a placeholder value
    dbConnectionsGauge.set(1);

  } catch (error) {
    logger.error('Error updating metrics:', error);
  }
}

export async function GET() {
  try {
    // Update current metrics before serving
    await updateCurrentMetrics();

    // Get all metrics
    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}

// Helper function to record API request metrics (to be used in middleware)
export function recordApiRequest(method: string, route: string, statusCode: number, duration: number) {
  apiRequestCounter.inc({ method, route, status_code: statusCode.toString() });
  apiRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
}

// Helper function to record visitor metrics
export function recordVisitor(device: string, country: string, converted: boolean) {
  visitorCounter.inc({ device, country, converted: converted.toString() });
}

// Helper function to record form submission metrics
export function recordFormSubmission(formId: string, formName: string, status: 'success' | 'error') {
  formSubmissionCounter.inc({ form_id: formId, form_name: formName, status });
}

// Helper function to record form completion time
export function recordFormCompletionTime(formId: string, duration: number) {
  formCompletionTimeHistogram.observe({ form_id: formId }, duration);
}

// Helper function to record cache metrics
export function recordCacheOperation(operation: 'get' | 'set' | 'del', keyType: string, hit: boolean) {
  if (hit) {
    cacheHitCounter.inc({ operation, key_type: keyType });
  } else {
    cacheMissCounter.inc({ operation, key_type: keyType });
  }
}

// Helper function to record CRM sync metrics
export function recordCrmSync(platform: string, operation: string, success: boolean, errorType?: string) {
  if (success) {
    crmSyncSuccessCounter.inc({ platform, operation });
  } else {
    crmSyncErrorCounter.inc({ platform, operation, error_type: errorType || 'unknown' });
  }
}

// Helper function to record webhook delivery metrics
export function recordWebhookDelivery(eventType: string, status: 'success' | 'failed' | 'retrying', duration?: number) {
  webhookDeliveryCounter.inc({ event_type: eventType, status });
  if (duration !== undefined) {
    webhookDeliveryDuration.observe({ event_type: eventType }, duration);
  }
}

// Helper function to record AI intelligence metrics
export function recordAiIntelligence(analysisType: string, status: 'success' | 'error', latency?: number) {
  aiIntelligenceRequestCounter.inc({ analysis_type: analysisType, status });
  if (latency !== undefined) {
    aiIntelligenceLatency.observe({ analysis_type: analysisType }, latency);
  }
}

// Helper function to record security events
export function recordSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  securityEventCounter.inc({ event_type: eventType, severity });
}

// Helper function to record GDPR requests
export function recordGdprRequest(requestType: string, status: 'success' | 'error') {
  gdprRequestCounter.inc({ request_type: requestType, status });
}

// Helper function to record database operations
export function recordDatabaseOperation(operation: string, table: string, status: 'success' | 'error', duration?: number) {
  dbQueryCounter.inc({ operation, table, status });
  if (duration !== undefined) {
    dbQueryDuration.observe({ operation, table }, duration);
  }
}