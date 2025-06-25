/**
 * LeadPulse Security Management API
 * 
 * Provides security monitoring, GDPR compliance, and audit capabilities
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leadPulseSecurityManager } from '@/lib/leadpulse/security-manager';
import { gdprComplianceManager } from '@/lib/leadpulse/gdpr-compliance';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET: Security dashboard and monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '24h';

    switch (type) {
      case 'events':
        return await getSecurityEvents(timeRange);
      
      case 'alerts':
        return await getSecurityAlerts();
      
      case 'audit':
        return await getAuditLogs(searchParams);
      
      case 'consent':
        return await getConsentSummary(searchParams);
      
      case 'gdpr-requests':
        return await getGDPRRequests();
      
      default:
        return await getSecurityDashboard(timeRange);
    }

  } catch (error) {
    logger.error('Error in security API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve security data'
    }, { status: 500 });
  }
}

/**
 * POST: Handle security actions and GDPR requests
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type } = body;

    // Get client information
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    switch (action) {
      case 'validate_input':
        return await handleInputValidation(body);
      
      case 'record_consent':
        return await handleConsentRecording(body, { ip, userAgent });
      
      case 'gdpr_request':
        return await handleGDPRRequest(body, session.user);
      
      case 'resolve_security_event':
        return await handleSecurityEventResolution(body, session.user);
      
      case 'export_audit_log':
        return await handleAuditLogExport(body);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown action' 
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in security action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process security action'
    }, { status: 500 });
  }
}

// Helper functions

async function getSecurityDashboard(timeRange: string) {
  const hours = timeRange === '7d' ? 168 : timeRange === '24h' ? 24 : 1;
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const [
    recentEvents,
    eventStats,
    alertsCount,
    rateLimitEvents
  ] = await Promise.all([
    prisma.leadPulseSecurityEvent.findMany({
      where: {
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    }),
    
    prisma.leadPulseSecurityEvent.groupBy({
      by: ['type', 'severity'],
      where: {
        timestamp: { gte: since }
      },
      _count: true
    }),
    
    prisma.leadPulseSecurityEvent.count({
      where: {
        timestamp: { gte: since },
        severity: { in: ['HIGH', 'CRITICAL'] },
        resolved: false
      }
    }),
    
    prisma.leadPulseSecurityEvent.count({
      where: {
        timestamp: { gte: since },
        type: 'RATE_LIMIT_EXCEEDED'
      }
    })
  ]);

  // Calculate security score
  const criticalEvents = eventStats.filter(e => e.severity === 'CRITICAL').reduce((sum, e) => sum + e._count, 0);
  const highEvents = eventStats.filter(e => e.severity === 'HIGH').reduce((sum, e) => sum + e._count, 0);
  const mediumEvents = eventStats.filter(e => e.severity === 'MEDIUM').reduce((sum, e) => sum + e._count, 0);
  
  const securityScore = Math.max(0, 100 - (criticalEvents * 20) - (highEvents * 10) - (mediumEvents * 5));

  return NextResponse.json({
    success: true,
    dashboard: {
      securityScore,
      timeRange,
      summary: {
        totalEvents: eventStats.reduce((sum, e) => sum + e._count, 0),
        alertsCount,
        rateLimitEvents,
        eventsResolved: recentEvents.filter(e => e.resolved).length
      },
      recentEvents: recentEvents.map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        source: event.source,
        timestamp: event.timestamp,
        resolved: event.resolved,
        ipAddress: event.ipAddress
      })),
      eventsByType: eventStats.reduce((acc, stat) => {
        if (!acc[stat.type]) acc[stat.type] = { total: 0, bySeverity: {} };
        acc[stat.type].total += stat._count;
        acc[stat.type].bySeverity[stat.severity] = stat._count;
        return acc;
      }, {} as Record<string, any>)
    }
  });
}

async function getSecurityEvents(timeRange: string) {
  const hours = timeRange === '7d' ? 168 : timeRange === '24h' ? 24 : 1;
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const events = await prisma.leadPulseSecurityEvent.findMany({
    where: {
      timestamp: { gte: since }
    },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  return NextResponse.json({
    success: true,
    events: events.map(event => ({
      id: event.id,
      type: event.type,
      severity: event.severity,
      source: event.source,
      timestamp: event.timestamp,
      resolved: event.resolved,
      ipAddress: event.ipAddress,
      details: event.details
    }))
  });
}

async function getSecurityAlerts() {
  const alerts = await prisma.leadPulseSecurityEvent.findMany({
    where: {
      severity: { in: ['HIGH', 'CRITICAL'] },
      resolved: false
    },
    orderBy: { timestamp: 'desc' },
    take: 20
  });

  return NextResponse.json({
    success: true,
    alerts: alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      source: alert.source,
      timestamp: alert.timestamp,
      ipAddress: alert.ipAddress,
      details: alert.details
    }))
  });
}

async function getAuditLogs(searchParams: URLSearchParams) {
  const action = searchParams.get('action');
  const resource = searchParams.get('resource');
  const userId = searchParams.get('userId');
  const limit = Number.parseInt(searchParams.get('limit') || '50');
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  const where: any = {};
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.leadPulseAuditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.leadPulseAuditLog.count({ where })
  ]);

  return NextResponse.json({
    success: true,
    logs: logs.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      user: log.user,
      userEmail: log.userEmail,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      changes: log.changes
    })),
    pagination: {
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    }
  });
}

async function getConsentSummary(searchParams: URLSearchParams) {
  const email = searchParams.get('email');
  
  if (email) {
    const summary = await gdprComplianceManager.getConsentSummary(email);
    return NextResponse.json({ success: true, summary });
  }

  // Get overall consent statistics
  const [
    totalConsents,
    activeConsents,
    consentsByType
  ] = await Promise.all([
    prisma.leadPulseConsent.count(),
    prisma.leadPulseConsent.count({
      where: { granted: true, withdrawnAt: null }
    }),
    prisma.leadPulseConsent.groupBy({
      by: ['consentType'],
      where: { granted: true, withdrawnAt: null },
      _count: true
    })
  ]);

  return NextResponse.json({
    success: true,
    summary: {
      totalConsents,
      activeConsents,
      withdrawnConsents: totalConsents - activeConsents,
      consentsByType: consentsByType.reduce((acc, item) => {
        acc[item.consentType] = item._count;
        return acc;
      }, {} as Record<string, number>)
    }
  });
}

async function getGDPRRequests() {
  // In a real implementation, you'd have a separate table for GDPR requests
  // For now, we'll show data processing logs of relevant types
  const requests = await prisma.leadPulseDataProcessingLog.findMany({
    where: {
      type: { in: ['ACCESS', 'DELETION', 'PORTABILITY', 'RECTIFICATION'] }
    },
    orderBy: { timestamp: 'desc' },
    take: 50
  });

  return NextResponse.json({
    success: true,
    requests: requests.map(req => ({
      id: req.id,
      type: req.type,
      dataSubject: req.dataSubject,
      purpose: req.purpose,
      timestamp: req.timestamp,
      processed: req.deleted || false
    }))
  });
}

async function handleInputValidation(body: any) {
  const { data, context } = body;
  
  if (!data || !context) {
    return NextResponse.json({
      success: false,
      error: 'Missing data or context'
    }, { status: 400 });
  }

  const validation = leadPulseSecurityManager.validateAndSanitizeInput(data, context);
  
  return NextResponse.json({
    success: true,
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      sanitized: validation.sanitized
    }
  });
}

async function handleConsentRecording(body: any, request: { ip: string; userAgent: string }) {
  const { email, consentType, purpose, granted, source } = body;
  
  if (!email || !consentType || !purpose || typeof granted !== 'boolean') {
    return NextResponse.json({
      success: false,
      error: 'Missing required consent fields'
    }, { status: 400 });
  }

  const result = await gdprComplianceManager.recordConsent({
    email,
    consentType,
    purpose,
    granted,
    source,
    ipAddress: request.ip,
    userAgent: request.userAgent
  });
  
  return NextResponse.json(result);
}

async function handleGDPRRequest(body: any, user: any) {
  const { requestType, email, details } = body;
  
  if (!requestType || !email) {
    return NextResponse.json({
      success: false,
      error: 'Missing request type or email'
    }, { status: 400 });
  }

  let result;
  
  switch (requestType) {
    case 'ACCESS':
      result = await gdprComplianceManager.handleAccessRequest(email);
      break;
    case 'ERASURE':
      result = await gdprComplianceManager.handleErasureRequest(email, details);
      break;
    case 'PORTABILITY':
      result = await gdprComplianceManager.handlePortabilityRequest(email);
      break;
    default:
      return NextResponse.json({
        success: false,
        error: 'Unsupported request type'
      }, { status: 400 });
  }

  // Log the GDPR request handling
  await prisma.leadPulseAuditLog.create({
    data: {
      action: `GDPR_${requestType}`,
      resource: 'gdpr_request',
      resourceId: email,
      userId: user.id,
      userEmail: user.email,
      metadata: { requestDetails: details },
      timestamp: new Date()
    }
  });

  return NextResponse.json(result);
}

async function handleSecurityEventResolution(body: any, user: any) {
  const { eventId, resolution } = body;
  
  if (!eventId) {
    return NextResponse.json({
      success: false,
      error: 'Missing event ID'
    }, { status: 400 });
  }

  const updatedEvent = await prisma.leadPulseSecurityEvent.update({
    where: { id: eventId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: user.id
    }
  });

  // Log the resolution
  await prisma.leadPulseAuditLog.create({
    data: {
      action: 'RESOLVE_SECURITY_EVENT',
      resource: 'security_event',
      resourceId: eventId,
      userId: user.id,
      userEmail: user.email,
      metadata: { resolution },
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    event: updatedEvent
  });
}

async function handleAuditLogExport(body: any) {
  const { filters, format = 'json' } = body;
  
  const where: any = {};
  if (filters?.startDate) where.timestamp = { gte: new Date(filters.startDate) };
  if (filters?.endDate) where.timestamp = { ...where.timestamp, lte: new Date(filters.endDate) };
  if (filters?.action) where.action = filters.action;
  if (filters?.resource) where.resource = filters.resource;

  const logs = await prisma.leadPulseAuditLog.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return NextResponse.json({
    success: true,
    exportData: logs,
    format,
    exportedAt: new Date(),
    totalRecords: logs.length
  });
}