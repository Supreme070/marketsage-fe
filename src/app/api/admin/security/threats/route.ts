import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { detectThreats, getIPLocation, isIPBlocked } from '@/lib/security/security-utils';
import { z } from 'zod';

/**
 * GET /api/admin/security/threats
 * Get active threats and suspicious activities
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const severity = url.searchParams.get('severity');
    const threatType = url.searchParams.get('type');
    const includeBlocked = url.searchParams.get('includeBlocked') === 'true';

    // Calculate time range
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges['24h'];
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Log the admin action
    await logAdminAction(user, 'VIEW_SECURITY_THREATS', 'security', {
      timeRange,
      filters: { severity, threatType, includeBlocked }
    });

    // Detect threats using our security analysis
    const allThreats = await detectThreats(fromDate);

    // Filter threats based on parameters
    let filteredThreats = allThreats;

    if (severity) {
      filteredThreats = filteredThreats.filter(threat => threat.severity === severity);
    }

    if (threatType) {
      filteredThreats = filteredThreats.filter(threat => threat.type === threatType);
    }

    if (!includeBlocked) {
      filteredThreats = filteredThreats.filter(threat => !threat.blocked);
    }

    // Get additional threat intelligence
    const threatStats = {
      total: allThreats.length,
      active: allThreats.filter(t => !t.blocked).length,
      blocked: allThreats.filter(t => t.blocked).length,
      critical: allThreats.filter(t => t.severity === 'CRITICAL').length,
      high: allThreats.filter(t => t.severity === 'HIGH').length,
      medium: allThreats.filter(t => t.severity === 'MEDIUM').length,
      low: allThreats.filter(t => t.severity === 'LOW').length,
      byType: allThreats.reduce((acc, threat) => {
        acc[threat.type] = (acc[threat.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Get top threatening IPs
    const topThreats = allThreats
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Get recent threat activity
    const recentActivity = await prisma.securityEvent.findMany({
      where: {
        eventType: {
          in: ['SUSPICIOUS_ACTIVITY', 'MALICIOUS_REQUEST', 'SQL_INJECTION_ATTEMPT', 'API_ABUSE']
        },
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20,
      select: {
        id: true,
        eventType: true,
        severity: true,
        title: true,
        ipAddress: true,
        timestamp: true,
        location: true,
        userAgent: true
      }
    });

    // Geographic distribution of threats
    const geoDistribution = allThreats.reduce((acc, threat) => {
      const location = threat.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Response.json({
      success: true,
      data: {
        threats: filteredThreats,
        stats: threatStats,
        topThreats,
        recentActivity,
        geoDistribution,
        timeRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
          label: timeRange
        }
      }
    });

  } catch (error) {
    console.error('Security threats API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch security threats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * POST /api/admin/security/threats/resolve
 * Mark a threat as resolved
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { threatId, resolution, notes } = body;

    if (!threatId) {
      return Response.json(
        { success: false, error: 'Threat ID is required' },
        { status: 400 }
      );
    }

    // Update related security events as resolved
    await prisma.securityEvent.updateMany({
      where: {
        OR: [
          { ipAddress: threatId.replace('brute_force_', '').replace('api_abuse_', '').replace('sql_injection_', '') },
          { id: threatId }
        ],
        resolved: false
      },
      data: {
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        metadata: {
          resolution,
          notes,
          resolvedBy: user.email
        }
      }
    });

    // Log the admin action
    await logAdminAction(user, 'RESOLVE_SECURITY_THREAT', 'security', {
      threatId,
      resolution,
      notes
    });

    return Response.json({
      success: true,
      message: 'Threat marked as resolved successfully'
    });

  } catch (error) {
    console.error('Threat resolution error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to resolve threat',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}