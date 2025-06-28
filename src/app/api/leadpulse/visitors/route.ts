import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockVisitorData } from '@/app/api/leadpulse/_mockData';

// Generate simulator visitors based on active visitor count
function generateSimulatorVisitors(simulatorStatus: any): any[] {
  const activeVisitors = simulatorStatus.activeVisitors || 0;
  const visitors: any[] = [];
  
  // Nigerian cities for realistic simulation
  const nigerianCities = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Enugu', 'Jos', 'Owerri'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  
  for (let i = 0; i < activeVisitors; i++) {
    const city = nigerianCities[Math.floor(Math.random() * nigerianCities.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    
    // Generate realistic touchpoints
    const touchpointCount = Math.floor(Math.random() * 5) + 1; // 1-5 touchpoints
    const pulseData = [];
    
    for (let j = 0; j < touchpointCount; j++) {
      const timestamp = new Date(Date.now() - Math.random() * 60 * 60 * 1000); // Within last hour
      const types = ['PAGEVIEW', 'CLICK', 'FORM_VIEW'];
      const urls = ['/home', '/pricing', '/solutions', '/contact', '/demo'];
      
      pulseData.push({
        timestamp: timestamp.toISOString(),
        value: Math.floor(Math.random() * 100) + 1,
        type: types[Math.floor(Math.random() * types.length)],
        url: urls[Math.floor(Math.random() * urls.length)],
        title: `Page ${j + 1}`
      });
    }
    
    visitors.push({
      id: `sim_visitor_${i}`,
      fingerprint: `sim_fp_${Date.now()}_${i}`,
      location: `${city}, Nigeria`,
      device: `${device}, ${browser}`,
      browser: browser,
      engagementScore: Math.floor(Math.random() * 60) + 40, // 40-100
      lastActive: Math.random() > 0.7 ? 'just now' : `${Math.floor(Math.random() * 30) + 1} min ago`,
      isActive: Math.random() > 0.3, // 70% are active
      totalVisits: Math.floor(Math.random() * 10) + 1,
      pulseData: pulseData
    });
  }
  
  return visitors;
}

// GET: Fetch visitors with their touchpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');
    
    // First check if simulator is running
    let simulatorStatus = null;
    let simulatorVisitors: any[] = [];
    
    try {
      const simulatorResponse = await fetch(`${new URL(request.url).origin}/api/leadpulse/simulator?action=status`);
      simulatorStatus = await simulatorResponse.json();
      
      if (simulatorStatus.isRunning) {
        // Generate simulator visitors based on active visitor count
        simulatorVisitors = generateSimulatorVisitors(simulatorStatus);
        console.log(`Simulator running: generated ${simulatorVisitors.length} visitors`);
      }
    } catch (error) {
      console.log('Could not fetch simulator status:', error);
    }
    
    // Try to fetch real data from database
    let realVisitors: any[] = [];
    let totalCount = 0;
    
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
      totalCount = await prisma.leadPulseVisitor.count({
        where: {
          lastVisit: {
            gte: cutoffTime
          }
        }
      });

      // Format response
      realVisitors = visitors.map(formatVisitorResponse);

    } catch (prismaError) {
      console.log('Database query failed, using simulator data:', prismaError);
    }

    // Combine simulator and real visitors, prioritizing simulator data
    const combinedVisitors = [...simulatorVisitors];
    
    // Add real visitors that aren't duplicates of simulator visitors
    realVisitors.forEach(realVisitor => {
      const exists = combinedVisitors.find(simVisitor => 
        simVisitor.fingerprint === realVisitor.fingerprint
      );
      if (!exists) {
        combinedVisitors.push(realVisitor);
      }
    });

    // If we have combined data, return it
    if (combinedVisitors.length > 0) {
      const effectiveTotal = Math.max(combinedVisitors.length, totalCount);
      return NextResponse.json({
        visitors: combinedVisitors,
        total: effectiveTotal,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(effectiveTotal / limit),
        simulatorActive: simulatorStatus?.isRunning || false
      });
    }

    // Fallback to mock data if nothing else works
    const mockVisitors = generateMockVisitorData();
    return NextResponse.json({
      visitors: mockVisitors,
      total: mockVisitors.length,
      page: 1,
      pageSize: limit,
      totalPages: 1,
      simulatorActive: false
    });
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

    // Create touchpoint using Prisma create method
    const touchpoint = await prisma.leadPulseTouchpoint.create({
      data: {
        id: generateId(),
        visitorId: visitor.id,
        timestamp: new Date(),
        type: type as any, // Cast to avoid type issues
        url: url,
        metadata: metadata || {},
        value: calculateTouchpointValue(type)
      }
    });

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
    return total + ((tp.value || 1) * recencyFactor);
  }, 0);

  // Normalize score to 0-100 range
  return Math.min(100, Math.round(score));
} 