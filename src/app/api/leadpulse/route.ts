import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET: Fetch real-time dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Calculate time cutoff
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        cutoffTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get active visitors (visited in last 30 minutes)
    const activeVisitors = await prisma.leadPulseVisitor.count({
      where: {
        lastVisit: {
          gte: new Date(now.getTime() - 30 * 60 * 1000)
        }
      }
    });

    // Get total visitors for the time range
    const totalVisitors = await prisma.leadPulseVisitor.count({
      where: {
        lastVisit: {
          gte: cutoffTime
        }
      }
    });

    // Get average engagement score
    const engagementStats = await prisma.leadPulseVisitor.aggregate({
      where: {
        lastVisit: {
          gte: cutoffTime
        }
      },
      _avg: {
        engagementScore: true
      }
    });

    // Get touchpoint stats
    const touchpointStats = await prisma.leadPulseTouchpoint.groupBy({
      by: ['type'],
      where: {
        timestamp: {
          gte: cutoffTime
        }
      },
      _count: true
    });

    // Calculate conversion rate
    const conversions = touchpointStats.find(stat => stat.type === 'CONVERSION')?._count || 0;
    const conversionRate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;

    // Get top locations
    const topLocations = await prisma.leadPulseVisitor.groupBy({
      by: ['city', 'country'],
      where: {
        lastVisit: {
          gte: cutoffTime
        },
        city: { not: null },
        country: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 5
    });

    // Get recent touchpoints for activity feed
    const recentActivity = await prisma.leadPulseTouchpoint.findMany({
      where: {
        timestamp: {
          gte: cutoffTime
        }
      },
      include: {
        visitor: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    // Build touchpoints object without spread syntax
    const touchpointsMap: Record<string, number> = {};
    for (const stat of touchpointStats) {
      touchpointsMap[stat.type.toLowerCase()] = stat._count;
    }

    return NextResponse.json({
      overview: {
        activeVisitors,
        totalVisitors,
        avgEngagementScore: engagementStats._avg.engagementScore || 0,
        conversionRate
      },
      touchpoints: touchpointsMap,
      topLocations: topLocations.map((loc: any) => ({
        location: `${loc.city}, ${loc.country}`,
        visitors: loc._count._all
      })),
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        url: activity.url,
        timestamp: activity.timestamp,
        location: activity.visitor?.city 
          ? `${activity.visitor.city}, ${activity.visitor.country}`
          : 'Unknown Location'
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// POST: Record real-time event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fingerprint, 
      type, 
      url, 
      title, 
      metadata,
      device,
      browser,
      os,
      city,
      country,
      region,
      latitude,
      longitude
    } = body;

    // Find or create visitor
    let visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint }
    });

    if (!visitor) {
      visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint,
          device,
          browser,
          os,
          city,
          country,
          region,
          latitude,
          longitude
        }
      });
    } else {
      // Update visitor data
      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 },
          isActive: true,
          // Update location if provided
          ...(city && country ? {
            city,
            country,
            region,
            latitude,
            longitude
          } : {})
        }
      });
    }

    // Create touchpoint using raw SQL to avoid type issues
    await prisma.$executeRaw`
      INSERT INTO "LeadPulseTouchpoint" (id, "visitorId", timestamp, type, url, title, metadata, value)
      VALUES (${generateId()}, ${visitor.id}, ${new Date()}, ${type}::"LeadPulseTouchpointType", ${url}, ${title || null}, ${JSON.stringify(metadata || {})}, ${calculateTouchpointValue(type)})
    `;

    // Update engagement score
    const newScore = await calculateEngagementScore(visitor.id);
    await prisma.leadPulseVisitor.update({
      where: { id: visitor.id },
      data: { engagementScore: newScore }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

// Helper function to generate ID
function generateId(): string {
  return 'clxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 36 | 0).toString(36);
  });
}

// Helper function to calculate touchpoint value
function calculateTouchpointValue(type: string): number {
  switch (type) {
    case 'PAGEVIEW': return 1;
    case 'CLICK': return 2;
    case 'FORM_VIEW': return 3;
    case 'FORM_START': return 4;
    case 'FORM_SUBMIT': return 8;
    case 'CONVERSION': return 10;
    default: return 1;
  }
}

// Helper function to calculate engagement score
async function calculateEngagementScore(visitorId: string): Promise<number> {
  const recentTouchpoints = await prisma.leadPulseTouchpoint.findMany({
    where: {
      visitorId,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h
      }
    }
  });

  // Calculate score based on touchpoint values and recency
  const score = recentTouchpoints.reduce((total: number, tp: any) => {
    const age = Date.now() - tp.timestamp.getTime();
    const recencyFactor = Math.max(0.1, 1 - (age / (24 * 60 * 60 * 1000)));
    return total + ((tp.score || 1) * recencyFactor);
  }, 0);

  // Normalize score to 0-100 range
  return Math.min(100, Math.round(score));
} 