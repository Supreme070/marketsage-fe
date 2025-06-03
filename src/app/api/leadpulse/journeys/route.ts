import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockJourneyData, type VisitorPath } from '@/app/api/leadpulse/_mockData';

// Define interfaces for Prisma types
interface PrismaVisitor {
  id: string;
  score: number;
  contactId?: string | null;
  lastVisit: Date;
  LeadPulseTouchpoint: PrismaTouchpoint[];
  LeadPulseJourney: PrismaJourney[];
}

interface PrismaTouchpoint {
  id: string;
  timestamp: Date;
  url?: string | null;
  type: string;
  duration?: number | null;
  metadata?: any;
  score: number;
}

interface PrismaJourney {
  id: string;
  stage: string;
  isCompleted: boolean;
  completionDate?: Date | null;
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
    
    console.log('Journeys API - visitorId:', visitorId);
    
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
            },
            LeadPulseJourney: true
          }
        });
        
        console.log('Journeys API - Found visitor:', !!visitor, visitor?.id);
        
        if (visitor) {
          // Convert to journey format
          const typedVisitor = visitor as unknown as PrismaVisitor;
          const touchpoints = typedVisitor.LeadPulseTouchpoint.map((tp: PrismaTouchpoint) => {
            // Determine type based on data
            let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
            
            if (tp.type === 'click') {
              type = 'click';
            } else if (tp.type === 'form_view') {
              type = 'form_view';
            } else if (tp.type === 'form_submit') {
              type = 'form_submit';
            } else if (tp.type === 'conversion') {
              type = 'conversion';
            }
            
            return {
              id: tp.id,
              timestamp: tp.timestamp.toISOString(),
              type,
              url: tp.url || '/',
              title: `Page ${tp.id.slice(-8)}`,
              duration: tp.duration || undefined,
              formId: tp.type.includes('form') ? 'form_contact' : undefined,
              formName: tp.type.includes('form') ? 'Contact Form' : undefined,
              conversionValue: type === 'conversion' ? 99.99 : undefined
            };
          });
          
          // Calculate prediction metrics
          const engagementScore = typedVisitor.score || 0;
          const probability = Math.min(engagementScore / 100, 0.95);
          const predictedValue = probability * 199.99;
          let status: 'active' | 'converted' | 'lost' = 'active';
          
          // Determine status based on data
          if (typedVisitor.contactId) {
            status = 'converted';
          } else if (typedVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            status = 'lost';
          }
          
          // Check if journey is completed
          const journey = typedVisitor.LeadPulseJourney[0];
          if (journey && journey.isCompleted) {
            status = 'converted';
          }
          
          const journeyPath: VisitorPath = {
            visitorId: typedVisitor.id,
            touchpoints,
            probability,
            predictedValue,
            status
          };
          
          return NextResponse.json({ 
            journeys: [journeyPath]
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
            },
            LeadPulseJourney: true
          }
        });
        
        if (visitors && visitors.length > 0) {
          const journeys = visitors.map((visitor: unknown) => {
            const typedVisitor = visitor as PrismaVisitor;
            // Convert to journey format (similar to above)
            const touchpoints = typedVisitor.LeadPulseTouchpoint.map((tp: PrismaTouchpoint) => {
              // Determine type based on data
              let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
              
              if (tp.type === 'click') {
                type = 'click';
              } else if (tp.type === 'form_view') {
                type = 'form_view';
              } else if (tp.type === 'form_submit') {
                type = 'form_submit';
              } else if (tp.type === 'conversion') {
                type = 'conversion';
              }
              
              return {
                id: tp.id,
                timestamp: tp.timestamp.toISOString(),
                type,
                url: tp.url || '/',
                title: `Page ${tp.id.slice(-8)}`,
                duration: tp.duration || undefined,
                formId: tp.type.includes('form') ? 'form_contact' : undefined,
                formName: tp.type.includes('form') ? 'Contact Form' : undefined,
                conversionValue: type === 'conversion' ? 99.99 : undefined
              };
            });
            
            // Calculate prediction metrics
            const engagementScore = typedVisitor.score || 0;
            const probability = Math.min(engagementScore / 100, 0.95);
            const predictedValue = probability * 199.99;
            let status: 'active' | 'converted' | 'lost' = 'active';
            
            if (typedVisitor.contactId) {
              status = 'converted';
            } else if (typedVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
              status = 'lost';
            }
            
            // Check if journey is completed
            const journey = typedVisitor.LeadPulseJourney[0];
            if (journey && journey.isCompleted) {
              status = 'converted';
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
    
    // Return mock data as fallback
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