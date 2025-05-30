import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/db/prisma';

// Database simulation - in production this would be your actual database
interface VisitorSession {
  id: string;
  fingerprint: string;
  location: string;
  device: string;
  browser: string;
  engagementScore: number;
  lastActive: Date;
  sessionStart: Date;
  pageViews: number;
  clicks: number;
  formInteractions: number;
  conversions: number;
  isActive: boolean;
  pulseData: Array<{
    timestamp: Date;
    value: number;
    type: 'pageview' | 'click' | 'form_interaction' | 'conversion';
    url?: string;
    title?: string;
  }>;
}

// Simulated in-memory database (in production, use PostgreSQL/MongoDB)
let visitorsDB: VisitorSession[] = [];

// Initialize with some test data
if (visitorsDB.length === 0) {
  visitorsDB = generateInitialVisitorData();
}

function generateInitialVisitorData(): VisitorSession[] {
  const now = new Date();
  const visitors: VisitorSession[] = [];
  
  // Generate 50 realistic visitor sessions
  for (let i = 0; i < 50; i++) {
    const sessionStart = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Last 24h
    const lastActive = new Date(sessionStart.getTime() + Math.random() * 3 * 60 * 60 * 1000); // Up to 3h later
    const isActive = Math.random() > 0.7 && (now.getTime() - lastActive.getTime()) < 30 * 60 * 1000; // 30% chance active if within 30 mins
    
    const pageViews = Math.floor(Math.random() * 15) + 1;
    const clicks = Math.floor(Math.random() * 8);
    const formInteractions = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
    const conversions = Math.random() > 0.9 ? 1 : 0;
    
    // Calculate engagement score based on behavior
    const engagementScore = Math.min(100, 
      (pageViews * 5) + 
      (clicks * 10) + 
      (formInteractions * 20) + 
      (conversions * 50) +
      Math.random() * 20
    );
    
    const locations = [
      'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Port Harcourt, Nigeria',
      'Accra, Ghana', 'Kumasi, Ghana', 'Nairobi, Kenya', 'Kampala, Uganda',
      'Cairo, Egypt', 'Cape Town, South Africa', 'Johannesburg, South Africa',
      'Casablanca, Morocco', 'Tunis, Tunisia', 'Addis Ababa, Ethiopia'
    ];
    
    const devices = [
      'Mobile, Chrome', 'Desktop, Chrome', 'Mobile, Safari', 'Desktop, Firefox',
      'Mobile, Edge', 'Desktop, Safari', 'Tablet, Chrome', 'Mobile, Opera'
    ];
    
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];
    
    // Generate pulse data
    const pulseData = [];
    let currentTime = sessionStart;
    
    for (let j = 0; j < pageViews + clicks + formInteractions + conversions; j++) {
      currentTime = new Date(currentTime.getTime() + Math.random() * 300000); // 0-5 min intervals
      
      let type: 'pageview' | 'click' | 'form_interaction' | 'conversion';
      let value = 1;
      
      if (j < pageViews) {
        type = 'pageview';
        value = 1;
      } else if (j < pageViews + clicks) {
        type = 'click';
        value = 2;
      } else if (j < pageViews + clicks + formInteractions) {
        type = 'form_interaction';
        value = 3;
      } else {
        type = 'conversion';
        value = 5;
      }
      
      const urls = [
        '/home', '/products', '/pricing', '/about', '/contact',
        '/features', '/blog', '/support', '/dashboard', '/signup'
      ];
      
      pulseData.push({
        timestamp: currentTime,
        value,
        type,
        url: urls[Math.floor(Math.random() * urls.length)],
        title: `Page ${j + 1}`
      });
    }
    
    visitors.push({
      id: `visitor_${i + 1}`,
      fingerprint: `fp_${Math.random().toString(36).substr(2, 16)}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      engagementScore,
      lastActive,
      sessionStart,
      pageViews,
      clicks,
      formInteractions,
      conversions,
      isActive,
      pulseData
    });
  }
  
  return visitors;
}

function filterVisitorsByTimeRange(visitors: VisitorSession[], timeRange: string): VisitorSession[] {
  const now = new Date();
  let cutoffTime: Date;
  
  switch (timeRange) {
    case '1h':
      cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return visitors.filter(visitor => visitor.lastActive >= cutoffTime);
}

// GET: Fetch visitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Try to fetch real data from Prisma first
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
      const realVisitors = await prisma.anonymousVisitor.findMany({
        where: {
          lastVisit: {
            gte: cutoffTime
          }
        },
        include: {
          LeadPulseTouchpoint: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 10 // Limit touchpoints per visitor
          }
        },
        orderBy: {
          lastVisit: 'desc'
        },
        take: limit,
        skip: offset
      });

      if (realVisitors && realVisitors.length > 0) {
        // Transform real data to API format
        const visitors = realVisitors.map(visitor => {
          // Extract location info from geo data
          const geo = visitor.geo as any;
          const device = visitor.device as any;
          const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';
          
          // Determine if visitor is currently active (within last 30 minutes)
          const isActive = visitor.lastVisit.getTime() > (now.getTime() - 30 * 60 * 1000);
          
          // Create pulse data from touchpoints
          const pulseData = visitor.LeadPulseTouchpoint.map(tp => ({
            timestamp: tp.timestamp.toISOString(),
            value: tp.type === 'conversion' ? 5 : tp.type === 'form_submit' ? 3 : tp.type === 'click' ? 2 : 1,
            type: tp.type as 'pageview' | 'click' | 'form_interaction' | 'conversion',
            url: tp.url || '/',
            title: `Page ${tp.id.slice(-8)}`
          }));
          
          return {
            id: visitor.id,
            visitorId: visitor.id,
            fingerprint: visitor.fingerprint,
            location,
            device: device ? `${device.type}, ${device.browser}` : 'Unknown',
            browser: device?.browser || 'Unknown',
            engagementScore: visitor.score || 0,
            lastActive: formatLastActive(visitor.lastVisit),
            pulseData
          };
        });

        // Count total visitors for analytics
        const totalCount = await prisma.anonymousVisitor.count({
          where: {
            lastVisit: {
              gte: cutoffTime
            }
          }
        });

        // Calculate analytics
        const activeVisitors = visitors.filter(v => {
          // Check if lastActive indicates recent activity (within 30 minutes)
          return v.lastActive.includes('min') || v.lastActive === 'just now';
        }).length;

        const analytics = {
          totalVisitors: totalCount,
          activeVisitors,
          avgEngagementScore: Math.round(
            visitors.reduce((sum, v) => sum + v.engagementScore, 0) / visitors.length
          ),
          conversionRate: 0, // Will be calculated from journey data
          timeRange
        };

        return NextResponse.json({
          success: true,
          visitors,
          analytics,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        });
      }
    } catch (prismaError) {
      console.error('Error fetching real visitor data:', prismaError);
      // Continue to fallback
    }
    
    // Fallback to mock data
    let filteredVisitors = filterVisitorsByTimeRange(visitorsDB, timeRange);
    
    // Apply pagination
    const total = filteredVisitors.length;
    filteredVisitors = filteredVisitors.slice(offset, offset + limit);
    
    // Transform to API response format
    const visitors = filteredVisitors.map(visitor => ({
      id: visitor.id,
      visitorId: visitor.id,
      fingerprint: visitor.fingerprint,
      location: visitor.location,
      device: visitor.device,
      browser: visitor.browser,
      engagementScore: Math.round(visitor.engagementScore),
      lastActive: formatLastActive(visitor.lastActive),
      pulseData: visitor.pulseData.map(pulse => ({
        timestamp: pulse.timestamp.toISOString(),
        value: pulse.value,
        type: pulse.type,
        url: pulse.url,
        title: pulse.title
      }))
    }));
    
    // Calculate analytics
    const analytics = {
      totalVisitors: total,
      activeVisitors: filteredVisitors.filter(v => v.isActive).length,
      avgEngagementScore: Math.round(
        filteredVisitors.reduce((sum, v) => sum + v.engagementScore, 0) / filteredVisitors.length
      ),
      conversionRate: Math.round(
        (filteredVisitors.filter(v => v.conversions > 0).length / filteredVisitors.length) * 100
      ),
      timeRange
    };
    
    return NextResponse.json({
      success: true,
      visitors,
      analytics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}

// POST: Track new visitor event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fingerprint, 
      event, 
      url, 
      title, 
      location, 
      device, 
      browser 
    } = body;
    
    if (!fingerprint || !event) {
      return NextResponse.json(
        { success: false, error: 'Fingerprint and event are required' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    // Find existing visitor or create new one
    let visitor = visitorsDB.find(v => v.fingerprint === fingerprint);
    
    if (!visitor) {
      // Create new visitor session
      visitor = {
        id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fingerprint,
        location: location || 'Unknown',
        device: device || 'Unknown',
        browser: browser || 'Unknown',
        engagementScore: 0,
        lastActive: now,
        sessionStart: now,
        pageViews: 0,
        clicks: 0,
        formInteractions: 0,
        conversions: 0,
        isActive: true,
        pulseData: []
      };
      
      visitorsDB.push(visitor);
    }
    
    // Update visitor with new event
    visitor.lastActive = now;
    visitor.isActive = true;
    
    // Determine event value and type
    let value = 1;
    let eventType: 'pageview' | 'click' | 'form_interaction' | 'conversion' = 'pageview';
    
    switch (event.type) {
      case 'pageview':
        eventType = 'pageview';
        value = 1;
        visitor.pageViews++;
        visitor.engagementScore += 5;
        break;
      case 'click':
        eventType = 'click';
        value = 2;
        visitor.clicks++;
        visitor.engagementScore += 10;
        break;
      case 'form_interaction':
        eventType = 'form_interaction';
        value = 3;
        visitor.formInteractions++;
        visitor.engagementScore += 20;
        break;
      case 'conversion':
        eventType = 'conversion';
        value = 5;
        visitor.conversions++;
        visitor.engagementScore += 50;
        break;
    }
    
    // Add pulse data point
    visitor.pulseData.push({
      timestamp: now,
      value,
      type: eventType,
      url: url || '/',
      title: title || 'Page'
    });
    
    // Cap engagement score at 100
    visitor.engagementScore = Math.min(100, visitor.engagementScore);
    
    return NextResponse.json({
      success: true,
      visitor: {
        id: visitor.id,
        engagementScore: Math.round(visitor.engagementScore),
        isActive: visitor.isActive
      }
    });
    
  } catch (error) {
    console.error('Error tracking visitor event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
} 