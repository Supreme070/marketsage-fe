import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockJourneyData, VisitorPath } from '@/app/api/leadpulse/_mockData';

// Define interfaces for Prisma types
interface PrismaVisitor {
  id: string;
  engagementScore: number;
  contactId?: string | null;
  lastVisit: Date;
  LeadPulseTouchpoint: PrismaTouchpoint[];
  // Add other fields as needed
}

interface PrismaTouchpoint {
  id: string;
  timestamp: Date;
  pageUrl: string;
  pageTitle?: string | null;
  duration?: number | null;
  clickData?: any;
  exitIntent: boolean;
  formId?: string | null;
  // Add other fields as needed
}

/**
 * GET /api/leadpulse/journeys
 * Returns visitor journeys with their touchpoints
 */
export async function GET(request: NextRequest) {
  try {
    // Get visitor ID from query if provided
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    
    // Use mock data for now - when AnonymousVisitor model is properly added to the schema,
    // we can uncomment and use the real data query
    /*
    // Attempt to fetch real data
    try {
      // If visitor ID is provided, fetch that specific journey
      if (visitorId) {
        const visitor = await prisma.anonymousVisitor.findUnique({
          where: {
            id: visitorId
          },
          include: {
            LeadPulseTouchpoint: {
              orderBy: {
                timestamp: 'asc'
              }
            }
          }
        });
        
        if (visitor) {
          // Convert to journey format
          const touchpoints = (visitor as unknown as PrismaVisitor).LeadPulseTouchpoint.map((tp: PrismaTouchpoint) => {
            // Determine type based on data
            let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
            
            if (tp.clickData) {
              type = 'click';
            } else if (tp.formId) {
              if (tp.duration && tp.duration > 0) {
                type = 'form_submit';
              } else {
                type = 'form_view';
              }
            } else if (tp.exitIntent) {
              type = 'conversion';
            }
            
            return {
              id: tp.id,
              timestamp: tp.timestamp.toISOString(),
              type,
              url: tp.pageUrl,
              title: tp.pageTitle || undefined,
              duration: tp.duration || undefined,
              formId: tp.formId || undefined,
              formName: 'Contact Form', // This would be fetched from forms table
              conversionValue: type === 'conversion' ? 99.99 : undefined // This would be calculated from actual data
            };
          });
          
          // Calculate prediction metrics
          // This would be done with a ML model in production
          const typedVisitor = visitor as unknown as PrismaVisitor;
          const engagementScore = typedVisitor.engagementScore || 0;
          const probability = Math.min(engagementScore / 100, 0.95);
          const predictedValue = probability * 199.99;
          let status: 'active' | 'converted' | 'lost' = 'active';
          
          // Determine status based on data
          if (typedVisitor.contactId) {
            status = 'converted';
          } else if (typedVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            status = 'lost';
          }
          
          const journey: VisitorPath = {
            visitorId: typedVisitor.id,
            touchpoints,
            probability,
            predictedValue,
            status
          };
          
          return NextResponse.json({ 
            journeys: [journey]
          });
        }
      } else {
        // Fetch multiple journeys
        const visitors = await prisma.anonymousVisitor.findMany({
          take: 10,
          orderBy: {
            lastVisit: 'desc'
          },
          include: {
            LeadPulseTouchpoint: {
              orderBy: {
                timestamp: 'asc'
              }
            }
          }
        });
        
        if (visitors && visitors.length > 0) {
          const journeys = visitors.map((visitor: unknown) => {
            const typedVisitor = visitor as PrismaVisitor;
            // Convert to journey format (similar to above)
            const touchpoints = typedVisitor.LeadPulseTouchpoint.map((tp: PrismaTouchpoint) => {
              // Determine type based on data
              let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
              
              if (tp.clickData) {
                type = 'click';
              } else if (tp.formId) {
                if (tp.duration && tp.duration > 0) {
                  type = 'form_submit';
                } else {
                  type = 'form_view';
                }
              } else if (tp.exitIntent) {
                type = 'conversion';
              }
              
              return {
                id: tp.id,
                timestamp: tp.timestamp.toISOString(),
                type,
                url: tp.pageUrl,
                title: tp.pageTitle || undefined,
                duration: tp.duration || undefined,
                formId: tp.formId || undefined,
                formName: 'Contact Form',
                conversionValue: type === 'conversion' ? 99.99 : undefined
              };
            });
            
            // Calculate prediction metrics
            const engagementScore = typedVisitor.engagementScore || 0;
            const probability = Math.min(engagementScore / 100, 0.95);
            const predictedValue = probability * 199.99;
            let status: 'active' | 'converted' | 'lost' = 'active';
            
            if (typedVisitor.contactId) {
              status = 'converted';
            } else if (typedVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
              status = 'lost';
            }
            
            return {
              visitorId: typedVisitor.id,
              touchpoints,
              probability,
              predictedValue,
              status
            };
          });
          
          return NextResponse.json({ journeys });
        }
      }
    } catch (prismaError) {
      console.error('Error fetching journey data from Prisma:', prismaError);
      // Continue to fallback data
    }
    */
    
    // Return mock data
    const mockJourneys = generateMockJourneyData(visitorId || undefined);
    return NextResponse.json({ journeys: mockJourneys });
    
  } catch (error) {
    console.error('Error in journeys API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey data' },
      { status: 500 }
    );
  }
} 