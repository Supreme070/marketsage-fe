import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockVisitorData, VisitorJourney } from '@/app/api/leadpulse/_mockData';

// Define interface for the visitor data structure from Prisma
interface PrismaVisitor {
  id: string;
  fingerprint: string;
  lastVisitedAt: Date;
  engagementScore: number;
  city?: string | null;
  country?: string | null;
  device?: string | null;
  browser?: string | null;
  LeadPulseTouchpoint: PrismaTouchpoint[];
  // Add other fields as needed
}

interface PrismaTouchpoint {
  id: string;
  timestamp: Date;
  pageUrl: string;
  pageTitle?: string | null;
  clickData?: any;
  exitIntent: boolean;
  formId?: string | null;
  // Add other fields as needed
}

/**
 * GET /api/leadpulse/visitors
 * Returns active visitors with their pulse data
 */
export async function GET(request: NextRequest) {
  try {
    // Get time range from query
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Convert timeRange to a Date object for filtering
    let startDate = new Date();
    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1); // Default to 24h
    }
    
    // Attempt to fetch real data
    try {
      // Check if the AnonymousVisitor model exists in the schema
      const visitors = await prisma.anonymousVisitor.findMany({
        where: {
          lastVisit: {
            gte: startDate
          }
        },
        orderBy: {
          lastVisit: 'desc'
        },
        include: {
          // Include touchpoints to generate pulse data
          LeadPulseTouchpoint: {
            orderBy: {
              timestamp: 'asc'
            }
          }
        },
        take: 20 // Limit to 20 most recent visitors
      });
      
      // If we have real data, transform it to the expected format
      if (visitors && visitors.length > 0) {
        const transformedVisitors = visitors.map((visitor: PrismaVisitor) => {
          // Convert touchpoints to pulse data
          const pulseData = visitor.LeadPulseTouchpoint.map((touchpoint: PrismaTouchpoint) => {
            // Determine type
            let type: 'pageview' | 'click' | 'form_interaction' | 'conversion' = 'pageview';
            
            if (touchpoint.clickData) {
              type = 'click';
            } else if (touchpoint.exitIntent) {
              type = 'conversion';
            } else if (touchpoint.formId) {
              type = 'form_interaction';
            }
            
            // Determine engagement value based on type
            let value = 1; // Default value
            if (type === 'click') value = 2;
            if (type === 'form_interaction') value = 3;
            if (type === 'conversion') value = 5;
            
            return {
              timestamp: touchpoint.timestamp.toISOString(),
              value,
              type,
              url: touchpoint.pageUrl,
              title: touchpoint.pageTitle
            };
          });
          
          // Determine how long ago the visitor was active
          const lastActive = getTimeAgo(visitor.lastVisitedAt);
          
          return {
            id: visitor.id,
            visitorId: visitor.id,
            fingerprint: visitor.fingerprint,
            location: visitor.city ? `${visitor.city}, ${visitor.country}` : visitor.country || 'Unknown',
            device: visitor.device,
            browser: visitor.browser,
            engagementScore: visitor.engagementScore,
            lastActive,
            pulseData
          };
        });
        
        return NextResponse.json({ visitors: transformedVisitors });
      }
    } catch (prismaError) {
      console.error('Error fetching from Prisma:', prismaError);
      // Continue to fallback data
    }
    
    // If no data or error, return mock data as fallback
    const mockVisitors = generateMockVisitorData();
    return NextResponse.json({ visitors: mockVisitors });
    
  } catch (error) {
    console.error('Error in visitors API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}

// Helper function to convert timestamp to "time ago" format
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 min ago' : `${interval} mins ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
} 