import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { botDetector, BotConfidence } from '@/lib/leadpulse/bot-detector';
import { unauthorized, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * GET - Get bot detection statistics and recent detections
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to view bot detection data
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get bot detection statistics
    const statistics = await botDetector.getStatistics();
    
    // Get recent bot detections
    const recentDetections = await prisma.leadPulseSecurityEvent.findMany({
      where: {
        type: 'BOT_DETECTED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        severity: true,
        description: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Parse detection data
    const detectionData = recentDetections.map(detection => {
      const metadata = JSON.parse(detection.metadata || '{}');
      return {
        id: detection.id,
        severity: detection.severity,
        description: detection.description,
        ipAddress: detection.ipAddress,
        userAgent: detection.userAgent?.substring(0, 100) + (detection.userAgent?.length > 100 ? '...' : ''),
        botScore: metadata.botScore || 0,
        confidence: metadata.confidence || BotConfidence.SUSPICIOUS,
        action: metadata.action || 'flag',
        reasons: metadata.reasons || [],
        createdAt: detection.createdAt,
      };
    });

    // Get bot patterns analysis
    const userAgentPatterns = await this.analyzeBotPatterns();

    return NextResponse.json({
      statistics,
      recentDetections: detectionData,
      patterns: userAgentPatterns,
      summary: {
        totalDetections: statistics.totalDetections,
        riskLevel: this.calculateRiskLevel(statistics),
        topRisks: this.identifyTopRisks(detectionData),
      },
    });
  } catch (error) {
    console.error("Bot detection admin API Error:", error);
    return handleApiError(error, "/api/leadpulse/admin/bot-detection/route.ts");
  }
}

/**
 * POST - Manage bot detection settings or perform admin actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to manage bot detection
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ipAddress, visitorId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing required field: action" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'whitelist_ip':
        if (!ipAddress) {
          return NextResponse.json(
            { error: "Invalid request", message: "Missing required field: ipAddress" },
            { status: 400 }
          );
        }

        // Create whitelist entry (in real implementation, you'd have a whitelist table)
        await prisma.leadPulseSecurityEvent.create({
          data: {
            type: 'IP_WHITELISTED',
            severity: 'INFO',
            description: `IP address ${ipAddress} whitelisted by admin`,
            ipAddress,
            metadata: JSON.stringify({
              whitelistedBy: session.user.id,
              whitelistedAt: new Date().toISOString(),
            }),
          },
        });

        logger.info('IP whitelisted by admin', {
          adminUserId: session.user.id,
          whitelistedIp: ipAddress,
        });

        return NextResponse.json({
          message: `IP address ${ipAddress} has been whitelisted`,
          ipAddress,
        });

      case 'mark_false_positive':
        if (!visitorId) {
          return NextResponse.json(
            { error: "Invalid request", message: "Missing required field: visitorId" },
            { status: 400 }
          );
        }

        // Update visitor record to mark as false positive
        await prisma.leadPulseVisitor.update({
          where: { id: visitorId },
          data: {
            metadata: {
              botDetection: {
                falsePositive: true,
                markedBy: session.user.id,
                markedAt: new Date().toISOString(),
              },
            },
          },
        });

        // Create audit event
        await prisma.leadPulseSecurityEvent.create({
          data: {
            type: 'FALSE_POSITIVE_MARKED',
            severity: 'INFO',
            description: `Visitor ${visitorId} marked as false positive`,
            metadata: JSON.stringify({
              visitorId,
              markedBy: session.user.id,
            }),
          },
        });

        return NextResponse.json({
          message: `Visitor ${visitorId} marked as false positive`,
          visitorId,
        });

      case 'get_visitor_details':
        if (!visitorId) {
          return NextResponse.json(
            { error: "Invalid request", message: "Missing required field: visitorId" },
            { status: 400 }
          );
        }

        // Get detailed visitor information
        const visitor = await prisma.leadPulseVisitor.findUnique({
          where: { id: visitorId },
          include: {
            touchpoints: {
              take: 20,
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        if (!visitor) {
          return NextResponse.json(
            { error: "Visitor not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          visitor: {
            id: visitor.id,
            fingerprint: visitor.fingerprint,
            ipAddress: visitor.ipAddress,
            userAgent: visitor.userAgent,
            engagementScore: visitor.engagementScore,
            totalVisits: visitor.totalVisits,
            isActive: visitor.isActive,
            metadata: visitor.metadata,
            firstVisit: visitor.firstVisit,
            lastVisit: visitor.lastVisit,
            recentTouchpoints: visitor.touchpoints.map(tp => ({
              id: tp.id,
              type: tp.type,
              url: tp.url,
              timestamp: tp.timestamp,
              metadata: tp.metadata,
            })),
          },
        });

      default:
        return NextResponse.json(
          { error: "Invalid action", message: "Supported actions: whitelist_ip, mark_false_positive, get_visitor_details" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Bot detection admin action API Error:", error);
    return handleApiError(error, "/api/leadpulse/admin/bot-detection/route.ts");
  }
}

/**
 * Analyze bot patterns from recent detections
 */
async function analyzeBotPatterns(): Promise<{
  topUserAgents: Array<{ userAgent: string; count: number }>;
  topIpRanges: Array<{ ipRange: string; count: number }>;
  detectionTrends: Array<{ date: string; count: number }>;
}> {
  try {
    // Get recent bot detections
    const recentDetections = await prisma.leadPulseSecurityEvent.findMany({
      where: {
        type: 'BOT_DETECTED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        userAgent: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    // Analyze user agent patterns
    const userAgentCounts: Record<string, number> = {};
    const ipRangeCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    recentDetections.forEach(detection => {
      // Count user agents
      if (detection.userAgent) {
        const truncatedUA = detection.userAgent.substring(0, 100);
        userAgentCounts[truncatedUA] = (userAgentCounts[truncatedUA] || 0) + 1;
      }

      // Count IP ranges (first 3 octets)
      if (detection.ipAddress) {
        const ipRange = detection.ipAddress.split('.').slice(0, 3).join('.') + '.x';
        ipRangeCounts[ipRange] = (ipRangeCounts[ipRange] || 0) + 1;
      }

      // Count by day
      const date = detection.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Sort and get top patterns
    const topUserAgents = Object.entries(userAgentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userAgent, count]) => ({ userAgent, count }));

    const topIpRanges = Object.entries(ipRangeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ipRange, count]) => ({ ipRange, count }));

    const detectionTrends = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      topUserAgents,
      topIpRanges,
      detectionTrends,
    };
  } catch (error) {
    logger.error('Failed to analyze bot patterns', { error });
    return {
      topUserAgents: [],
      topIpRanges: [],
      detectionTrends: [],
    };
  }
}

/**
 * Calculate risk level based on statistics
 */
function calculateRiskLevel(statistics: any): 'low' | 'medium' | 'high' | 'critical' {
  const totalDetections = statistics.totalDetections || 0;
  const blockedRequests = statistics.blockedRequests || 0;

  if (blockedRequests > 100) return 'critical';
  if (totalDetections > 50) return 'high';
  if (totalDetections > 20) return 'medium';
  return 'low';
}

/**
 * Identify top risks from detection data
 */
function identifyTopRisks(detections: any[]): string[] {
  const risks: string[] = [];

  // Count by IP
  const ipCounts: Record<string, number> = {};
  detections.forEach(detection => {
    if (detection.ipAddress) {
      ipCounts[detection.ipAddress] = (ipCounts[detection.ipAddress] || 0) + 1;
    }
  });

  // Find IPs with multiple detections
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if (count >= 5) {
      risks.push(`High-frequency bot activity from IP ${ip} (${count} detections)`);
    }
  });

  // Check for recent spikes
  const recentDetections = detections.filter(d => 
    new Date(d.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );

  if (recentDetections.length > 20) {
    risks.push(`High bot activity spike: ${recentDetections.length} detections in last 24 hours`);
  }

  return risks.slice(0, 5); // Return top 5 risks
}