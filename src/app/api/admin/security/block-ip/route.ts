import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { getIPLocation } from '@/lib/security/security-utils';
import { z } from 'zod';

const blockIPSchema = z.object({
  ipAddress: z.string().min(1, 'IP address is required'),
  reason: z.string().min(1, 'Reason is required'),
  duration: z.enum(['1h', '24h', '7d', '30d', 'permanent']).optional(),
  threatType: z.enum(['BRUTE_FORCE', 'DDOS', 'MALICIOUS', 'SPAM', 'SUSPICIOUS', 'OTHER']).optional(),
  notes: z.string().optional(),
});

const unblockIPSchema = z.object({
  ipAddress: z.string().min(1, 'IP address is required'),
  reason: z.string().min(1, 'Unblock reason is required'),
});

/**
 * GET /api/admin/security/block-ip
 * Get IP blocking status and blocked IP list
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status'); // active, expired, all
    const threatType = url.searchParams.get('threatType');
    const ipAddress = url.searchParams.get('ipAddress');
    const sortBy = url.searchParams.get('sortBy') || 'blockedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Log the admin action
    await logAdminAction(user, 'VIEW_IP_BLOCKS', 'security', {
      page,
      limit,
      filters: { status, threatType, ipAddress }
    });

    // For demonstration, we'll use SecurityEvent data to simulate IP blocking
    // In a real implementation, you'd have a dedicated IPBlock table
    
    // Get blocked IPs from critical security events
    const blockedIPsQuery = await prisma.securityEvent.findMany({
      where: {
        severity: 'CRITICAL',
        eventType: {
          in: ['UNAUTHORIZED_ACCESS', 'MALICIOUS_REQUEST', 'RATE_LIMIT_EXCEEDED']
        },
        ...(ipAddress && { ipAddress: { contains: ipAddress } })
      },
      select: {
        ipAddress: true,
        eventType: true,
        timestamp: true,
        title: true,
        description: true,
        userAgent: true,
        location: true,
        metadata: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 500 // Limit for performance
    });

    // Group by IP address to simulate blocked IP entries
    const ipGroups = new Map();
    
    for (const event of blockedIPsQuery) {
      if (!event.ipAddress) continue;
      
      if (!ipGroups.has(event.ipAddress)) {
        ipGroups.set(event.ipAddress, {
          ipAddress: event.ipAddress,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          eventCount: 1,
          threatTypes: new Set([event.eventType]),
          location: event.location,
          userAgent: event.userAgent,
          events: [event]
        });
      } else {
        const existing = ipGroups.get(event.ipAddress);
        existing.eventCount++;
        existing.threatTypes.add(event.eventType);
        existing.lastSeen = new Date(Math.max(existing.lastSeen.getTime(), event.timestamp.getTime()));
        existing.firstSeen = new Date(Math.min(existing.firstSeen.getTime(), event.timestamp.getTime()));
        existing.events.push(event);
      }
    }

    // Convert to blocked IP format
    const now = new Date();
    let blockedIPs = Array.from(ipGroups.values()).map(group => ({
      id: `block_${group.ipAddress}`,
      ipAddress: group.ipAddress,
      reason: `Blocked due to ${group.eventCount} security violations`,
      blockedAt: group.firstSeen,
      blockedBy: user.id,
      blockedByEmail: user.email,
      expiresAt: null, // Simulating permanent blocks
      isActive: true,
      threatType: Array.from(group.threatTypes)[0] || 'SUSPICIOUS',
      location: group.location,
      eventCount: group.eventCount,
      lastActivity: group.lastSeen,
      userAgent: group.userAgent,
      metadata: {
        events: group.events.length,
        threatTypes: Array.from(group.threatTypes),
        autoBlocked: true
      }
    }));

    // Apply filters
    if (status === 'active') {
      blockedIPs = blockedIPs.filter(ip => ip.isActive && (!ip.expiresAt || ip.expiresAt > now));
    } else if (status === 'expired') {
      blockedIPs = blockedIPs.filter(ip => ip.expiresAt && ip.expiresAt <= now);
    }

    if (threatType) {
      blockedIPs = blockedIPs.filter(ip => ip.threatType === threatType);
    }

    // Sort
    blockedIPs.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    // Paginate
    const totalCount = blockedIPs.length;
    const paginatedIPs = blockedIPs.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate statistics
    const stats = {
      totalBlocked: totalCount,
      activeBlocks: blockedIPs.filter(ip => ip.isActive).length,
      expiredBlocks: blockedIPs.filter(ip => ip.expiresAt && ip.expiresAt <= now).length,
      permanentBlocks: blockedIPs.filter(ip => !ip.expiresAt).length,
      recentBlocks: blockedIPs.filter(ip => ip.blockedAt > new Date(now.getTime() - 24 * 60 * 60 * 1000)).length,
      threatDistribution: blockedIPs.reduce((acc, ip) => {
        acc[ip.threatType] = (acc[ip.threatType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      locationDistribution: blockedIPs.reduce((acc, ip) => {
        if (ip.location) {
          acc[ip.location] = (acc[ip.location] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    // Recent security events that might warrant IP blocking
    const recentThreats = await prisma.securityEvent.findMany({
      where: {
        timestamp: {
          gte: new Date(now.getTime() - 60 * 60 * 1000) // Last hour
        },
        severity: {
          in: ['HIGH', 'CRITICAL']
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10,
      select: {
        id: true,
        eventType: true,
        severity: true,
        title: true,
        ipAddress: true,
        timestamp: true,
        location: true
      }
    });

    return Response.json({
      success: true,
      data: {
        blockedIPs: paginatedIPs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        recentThreats,
        recommendations: generateBlockingRecommendations(blockedIPs, recentThreats)
      }
    });

  } catch (error) {
    console.error('IP blocking API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch IP blocks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * POST /api/admin/security/block-ip
 * Block an IP address
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
    const validatedData = blockIPSchema.parse(body);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (validatedData.duration && validatedData.duration !== 'permanent') {
      const durations = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      expiresAt = new Date(Date.now() + durations[validatedData.duration]);
    }

    // Get IP location
    const location = await getIPLocation(validatedData.ipAddress);

    // Create a security event to represent the IP block
    const blockEvent = await prisma.securityEvent.create({
      data: {
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'CRITICAL',
        title: `IP Address Blocked: ${validatedData.ipAddress}`,
        description: `Admin ${user.email} blocked IP ${validatedData.ipAddress}. Reason: ${validatedData.reason}`,
        ipAddress: validatedData.ipAddress,
        location,
        resolved: false,
        metadata: {
          blockAction: true,
          duration: validatedData.duration,
          expiresAt: expiresAt?.toISOString(),
          threatType: validatedData.threatType,
          notes: validatedData.notes,
          blockedBy: user.id,
          blockedByEmail: user.email
        }
      }
    });

    // Log the admin action
    await logAdminAction(user, 'BLOCK_IP_ADDRESS', 'security', {
      ipAddress: validatedData.ipAddress,
      reason: validatedData.reason,
      duration: validatedData.duration,
      threatType: validatedData.threatType,
      expiresAt: expiresAt?.toISOString(),
      eventId: blockEvent.id
    });

    return Response.json({
      success: true,
      message: `IP address ${validatedData.ipAddress} blocked successfully`,
      data: {
        id: blockEvent.id,
        ipAddress: validatedData.ipAddress,
        reason: validatedData.reason,
        blockedAt: blockEvent.timestamp,
        blockedBy: user.email,
        expiresAt,
        threatType: validatedData.threatType,
        location,
        duration: validatedData.duration || 'permanent'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid IP block data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('IP blocking error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to block IP address',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * DELETE /api/admin/security/block-ip
 * Unblock an IP address
 */
export const DELETE = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = unblockIPSchema.parse(body);

    // Update existing security events for this IP to resolved
    const updatedEvents = await prisma.securityEvent.updateMany({
      where: {
        ipAddress: validatedData.ipAddress,
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'CRITICAL',
        resolved: false
      },
      data: {
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        metadata: {
          unblockAction: true,
          unblockReason: validatedData.reason,
          unblockedBy: user.id,
          unblockedByEmail: user.email
        }
      }
    });

    // Create an unblock event
    const unblockEvent = await prisma.securityEvent.create({
      data: {
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'LOW',
        title: `IP Address Unblocked: ${validatedData.ipAddress}`,
        description: `Admin ${user.email} unblocked IP ${validatedData.ipAddress}. Reason: ${validatedData.reason}`,
        ipAddress: validatedData.ipAddress,
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        metadata: {
          unblockAction: true,
          unblockReason: validatedData.reason,
          unblockedBy: user.id,
          unblockedByEmail: user.email
        }
      }
    });

    // Log the admin action
    await logAdminAction(user, 'UNBLOCK_IP_ADDRESS', 'security', {
      ipAddress: validatedData.ipAddress,
      reason: validatedData.reason,
      eventsUpdated: updatedEvents.count,
      eventId: unblockEvent.id
    });

    return Response.json({
      success: true,
      message: `IP address ${validatedData.ipAddress} unblocked successfully`,
      data: {
        ipAddress: validatedData.ipAddress,
        unblockedAt: new Date(),
        unblockedBy: user.email,
        reason: validatedData.reason,
        eventsUpdated: updatedEvents.count
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid unblock data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('IP unblocking error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to unblock IP address',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * Generate blocking recommendations based on threat analysis
 */
function generateBlockingRecommendations(blockedIPs: any[], recentThreats: any[]) {
  const recommendations = [];

  // Check for unblocked IPs with multiple recent threats
  const threatsByIP = recentThreats.reduce((acc, threat) => {
    if (threat.ipAddress) {
      acc[threat.ipAddress] = (acc[threat.ipAddress] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const blockedIPSet = new Set(blockedIPs.map(ip => ip.ipAddress));

  Object.entries(threatsByIP).forEach(([ip, count]) => {
    if (count >= 3 && !blockedIPSet.has(ip)) {
      recommendations.push({
        type: 'BLOCK_RECOMMENDATION',
        priority: 'HIGH',
        ipAddress: ip,
        reason: `${count} security threats detected in the last hour`,
        suggestedDuration: '24h',
        threatCount: count
      });
    }
  });

  // Check for expired blocks that might need renewal
  const now = new Date();
  blockedIPs.forEach(ip => {
    if (ip.expiresAt && ip.expiresAt <= now && ip.eventCount > 10) {
      recommendations.push({
        type: 'RENEW_BLOCK',
        priority: 'MEDIUM',
        ipAddress: ip.ipAddress,
        reason: `Previous block expired but IP had ${ip.eventCount} violations`,
        suggestedDuration: '7d',
        threatCount: ip.eventCount
      });
    }
  });

  return recommendations.sort((a, b) => {
    const priorities = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priorities[b.priority as keyof typeof priorities] - priorities[a.priority as keyof typeof priorities];
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}