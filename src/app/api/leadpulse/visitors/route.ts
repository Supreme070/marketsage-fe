import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockVisitorData } from '@/app/api/leadpulse/_mockData';

// GET: Fetch visitors with their touchpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');
    
    // Try to fetch real data first
    try {
      // Calculate time cutoff based on timeRange
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

      // Fetch visitors from database
      const visitors = await prisma.leadPulseVisitor.findMany({
        where: {
          lastVisit: {
            gte: cutoffTime
          }
        },
        include: {
          touchpoints: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 10 // Only get last 10 touchpoints per visitor
          }
        },
        orderBy: {
          lastVisit: 'desc'
        },
        skip: offset,
        take: limit
      });

      // Get total count for pagination
      const totalCount = await prisma.leadPulseVisitor.count({
        where: {
          lastVisit: {
            gte: cutoffTime
          }
        }
      });

      // Format response
      const formattedVisitors = visitors.map(formatVisitorResponse);

      return NextResponse.json({
        visitors: formattedVisitors,
        total: totalCount,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (prismaError) {
      console.log('Using mock data as fallback:', prismaError);
      // If database tables don't exist yet, use mock data
      const mockVisitors = generateMockVisitorData();
      return NextResponse.json({
        visitors: mockVisitors,
        total: mockVisitors.length,
        page: 1,
        pageSize: limit,
        totalPages: 1
      });
    }
  } catch (error) {
    console.error('Error in visitors API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}

// POST: Record a new visitor touchpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, type, url, metadata } = body;

    // Find or create visitor
    let visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint }
    });

    if (!visitor) {
      visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint,
          // Add any additional visitor data from request
          device: body.device,
          browser: body.browser,
          os: body.os,
          city: body.city,
          country: body.country,
          region: body.region,
          latitude: body.latitude,
          longitude: body.longitude
        }
      });
    } else {
      // Update visitor data
      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 },
          isActive: true
        }
      });
    }

    // Create touchpoint - using raw SQL approach to avoid type issues
    const touchpoint = await prisma.$executeRaw`
      INSERT INTO "LeadPulseTouchpoint" (id, "visitorId", timestamp, type, url, metadata, value)
      VALUES (${generateId()}, ${visitor.id}, ${new Date()}, ${type}::"LeadPulseTouchpointType", ${url}, ${JSON.stringify(metadata || {})}, ${calculateTouchpointValue(type)})
    `;

    // Update engagement score
    const newScore = await calculateEngagementScore(visitor.id);
    await prisma.leadPulseVisitor.update({
      where: { id: visitor.id },
      data: { engagementScore: newScore }
    });

    return NextResponse.json({ success: true, touchpoint });
  } catch (error) {
    console.error('Error recording touchpoint:', error);
    return NextResponse.json(
      { error: 'Failed to record touchpoint' },
      { status: 500 }
    );
  }
}

// Helper function to format visitor response
function formatVisitorResponse(visitor: any) {
  return {
    id: visitor.id,
    fingerprint: visitor.fingerprint,
    location: visitor.city ? `${visitor.city}, ${visitor.country}` : undefined,
    device: visitor.device,
    browser: visitor.browser,
    engagementScore: visitor.engagementScore,
    lastActive: visitor.lastVisit,
    isActive: visitor.isActive,
    totalVisits: visitor.totalVisits,
    pulseData: visitor.touchpoints.map((tp: any) => ({
      timestamp: tp.timestamp,
      value: tp.value || 1,
      type: tp.type,
      url: tp.url,
      title: tp.title
    }))
  };
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