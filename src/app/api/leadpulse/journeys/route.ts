import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockJourneyData, type VisitorPath } from '@/app/api/leadpulse/_mockData';

// Define interfaces for Prisma types
interface PrismaVisitor {
  id: string;
  score: number;
  contactId?: string | null;
  lastVisit: Date;
  touchpoints: PrismaTouchpoint[];
}

interface PrismaTouchpoint {
  id: string;
  timestamp: Date;
  type: string;
  url?: string | null;
  duration?: number | null;
  metadata?: any;
}

/**
 * GET /api/leadpulse/journeys
 * Returns visitor journeys with their touchpoints
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbError) {
    console.error('Database connection failed in journeys API, using mock data:', dbError);
    
    // Return mock journey data
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    
    const mockJourneys = generateMockJourneyData(visitorId || undefined);
    return NextResponse.json({ 
      success: true,
      journeys: mockJourneys,
      dataSource: 'fallback'
    });
  }
  
  try {
    // Get visitor ID from query if provided
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    
    console.log('Journeys API - visitorId:', visitorId);
    console.log('Journeys API - Request URL:', request.url);
    
    // Log total visitor count for debugging - check both tables
    const totalVisitorsLead = await prisma.leadPulseVisitor.count();
    const totalVisitorsAnon = await prisma.anonymousVisitor.count();
    console.log('Journeys API - Total LeadPulseVisitors in DB:', totalVisitorsLead);
    console.log('Journeys API - Total AnonymousVisitors in DB:', totalVisitorsAnon);
    
    // Attempt to fetch real data from LeadPulseVisitor table (primary)
    try {
      // If visitor ID is provided, fetch that specific journey
      if (visitorId) {
        // Handle demo visitor IDs generated for consistency
        if (visitorId.startsWith('synthetic_') || visitorId.startsWith('visitor_demo_')) {
          console.log('Journeys API - Handling demo visitor:', visitorId);
          
          // Generate realistic journey data for demo visitors
          // Extract visitor number for consistent data
          const visitorNum = parseInt(visitorId.split('_').pop() || '0');
          const baseTime = Date.now() - (visitorNum * 1000); // Offset by visitor number for variety
          
          const syntheticJourney: VisitorPath = {
            visitorId,
            touchpoints: [
              {
                id: `${visitorId}_touch_1`,
                timestamp: new Date(baseTime - 60 * 60 * 1000).toISOString(),
                type: 'pageview',
                url: '/pricing',
                title: 'Pricing Page',
                duration: 120 + (visitorNum % 60)
              },
              {
                id: `${visitorId}_touch_2`,
                timestamp: new Date(baseTime - 45 * 60 * 1000).toISOString(),
                type: 'click',
                url: '/features',
                title: 'Features Section',
                duration: 80 + (visitorNum % 40)
              },
              {
                id: `${visitorId}_touch_3`,
                timestamp: new Date(baseTime - 30 * 60 * 1000).toISOString(),
                type: 'pageview',
                url: '/contact',
                title: 'Contact Page',
                duration: 90 + (visitorNum % 50)
              },
              {
                id: `${visitorId}_touch_4`,
                timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(),
                type: 'form_view',
                url: '/contact#form',
                title: 'Contact Form Viewed',
                duration: 45 + (visitorNum % 30)
              }
            ],
            probability: 0.2 + (visitorNum % 60) / 100, // 20-80% based on visitor number
            predictedValue: 50 + (visitorNum * 3), // $50-200 based on visitor number
            status: visitorNum % 5 === 0 ? 'converted' : 'active' // Every 5th visitor is converted
          };

          return NextResponse.json({
            success: true,
            journeys: [syntheticJourney]
          });
        }

        const visitor = await prisma.leadPulseVisitor.findUnique({
          where: {
            id: visitorId
          },
          include: {
            touchpoints: {
              orderBy: {
                timestamp: 'asc'
              }
            }
          }
        });
        
        console.log('Journeys API - Found LeadPulseVisitor:', !!visitor, visitor?.id);
        
        if (visitor) {
          // Convert to journey format
          const typedVisitor = visitor as unknown as PrismaVisitor;
          const touchpoints = typedVisitor.touchpoints.map((tp: PrismaTouchpoint) => {
            // Determine type based on data
            let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
            
            if (tp.type === 'CLICK') {
              type = 'click';
            } else if (tp.type === 'FORM_VIEW') {
              type = 'form_view';
            } else if (tp.type === 'FORM_SUBMIT') {
              type = 'form_submit';
            } else if (tp.type === 'CONVERSION') {
              type = 'conversion';
            }
            
            return {
              id: tp.id,
              timestamp: tp.timestamp.toISOString(),
              type,
              url: tp.url || '/',
              title: `Page ${tp.id.slice(-8)}`,
              duration: tp.duration || undefined,
              formId: tp.type.includes('FORM') ? 'form_contact' : undefined,
              formName: tp.type.includes('FORM') ? 'Contact Form' : undefined,
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
          
          const journeyPath: VisitorPath = {
            visitorId: typedVisitor.id,
            touchpoints,
            probability,
            predictedValue,
            status
          };
          
          console.log('Journeys API - Returning specific visitor with', touchpoints.length, 'touchpoints');
          return NextResponse.json({ 
            journeys: [journeyPath]
          });
        } else {
          // Visitor not found in LeadPulseVisitor - try AnonymousVisitor as fallback
          console.log(`Journeys API - Visitor ${visitorId} not found in LeadPulseVisitor, checking AnonymousVisitor...`);
          
          const anonVisitor = await prisma.anonymousVisitor.findUnique({
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
          
          if (anonVisitor) {
            console.log('Journeys API - Found in AnonymousVisitor, using that data');
            // Process anonymous visitor (existing logic)
            const touchpoints = anonVisitor.LeadPulseTouchpoint.map((tp: any) => {
              let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
              
              if (tp.type === 'CLICK') {
                type = 'click';
              } else if (tp.type === 'FORM_VIEW') {
                type = 'form_view';
              } else if (tp.type === 'FORM_SUBMIT') {
                type = 'form_submit';
              } else if (tp.type === 'CONVERSION') {
                type = 'conversion';
              }
              
              return {
                id: tp.id,
                timestamp: tp.timestamp.toISOString(),
                type,
                url: tp.url || '/',
                title: `Page ${tp.id.slice(-8)}`,
                duration: tp.duration || undefined,
                formId: tp.type.includes('FORM') ? 'form_contact' : undefined,
                formName: tp.type.includes('FORM') ? 'Contact Form' : undefined,
                conversionValue: type === 'conversion' ? 99.99 : undefined
              };
            });
            
            const engagementScore = anonVisitor.score || 0;
            const probability = Math.min(engagementScore / 100, 0.95);
            const predictedValue = probability * 199.99;
            let status: 'active' | 'converted' | 'lost' = 'active';
            
            if (anonVisitor.contactId) {
              status = 'converted';
            } else if (anonVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
              status = 'lost';
            }
            
            const journeyPath: VisitorPath = {
              visitorId: anonVisitor.id,
              touchpoints,
              probability,
              predictedValue,
              status
            };
            
            console.log('Journeys API - Returning AnonymousVisitor with', touchpoints.length, 'touchpoints');
            return NextResponse.json({ 
              journeys: [journeyPath]
            });
          }
          
          // Neither table has the visitor - return first available visitor from LeadPulseVisitor
          console.log(`Journeys API - Visitor ${visitorId} not found in either table, looking for first available...`);
          
          const firstVisitor = await prisma.leadPulseVisitor.findFirst({
            include: {
              touchpoints: {
                orderBy: { timestamp: 'asc' }
              }
            }
          });
          
          console.log('Journeys API - First LeadPulseVisitor query result:', !!firstVisitor, firstVisitor?.id);
          
          if (firstVisitor) {
            console.log('Journeys API - Using first available LeadPulseVisitor:', firstVisitor.id);
            
            // Process firstVisitor the same way
            const typedVisitor = firstVisitor as unknown as PrismaVisitor;
            const touchpoints = typedVisitor.touchpoints.map((tp: PrismaTouchpoint) => {
              let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
              
              if (tp.type === 'CLICK') {
                type = 'click';
              } else if (tp.type === 'FORM_VIEW') {
                type = 'form_view';
              } else if (tp.type === 'FORM_SUBMIT') {
                type = 'form_submit';
              } else if (tp.type === 'CONVERSION') {
                type = 'conversion';
              }
              
              return {
                id: tp.id,
                timestamp: tp.timestamp.toISOString(),
                type,
                url: tp.url || '/',
                title: `Page ${tp.id.slice(-8)}`,
                duration: tp.duration || undefined,
                formId: tp.type.includes('FORM') ? 'form_contact' : undefined,
                formName: tp.type.includes('FORM') ? 'Contact Form' : undefined,
                conversionValue: type === 'conversion' ? 99.99 : undefined
              };
            });
            
            const engagementScore = typedVisitor.score || 0;
            const probability = Math.min(engagementScore / 100, 0.95);
            const predictedValue = probability * 199.99;
            const status: 'active' | 'converted' | 'lost' = 'active';
            
            const journeyPath: VisitorPath = {
              visitorId: typedVisitor.id,
              touchpoints,
              probability,
              predictedValue,
              status
            };
            
            console.log('Journeys API - Returning fallback LeadPulseVisitor with', touchpoints.length, 'touchpoints');
            return NextResponse.json({ 
              journeys: [journeyPath]
            });
          } else {
            console.log('Journeys API - No visitors found in LeadPulseVisitor table either');
          }
        }
      } else {
        // Fetch multiple journeys from LeadPulseVisitor
        const visitors = await prisma.leadPulseVisitor.findMany({
          take: 10,
          orderBy: {
            lastVisit: 'desc'
          },
          include: {
            touchpoints: {
              orderBy: {
                timestamp: 'asc'
              }
            }
          }
        });
        
        console.log('Journeys API - Found', visitors.length, 'LeadPulseVisitors for multiple journeys');
        
        if (visitors && visitors.length > 0) {
          const journeys = visitors.map((visitor: unknown) => {
            const typedVisitor = visitor as PrismaVisitor;
            // Convert to journey format (similar to above)
            const touchpoints = typedVisitor.touchpoints.map((tp: PrismaTouchpoint) => {
              // Determine type based on data
              let type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion' = 'pageview';
              
              if (tp.type === 'CLICK') {
                type = 'click';
              } else if (tp.type === 'FORM_VIEW') {
                type = 'form_view';
              } else if (tp.type === 'FORM_SUBMIT') {
                type = 'form_submit';
              } else if (tp.type === 'CONVERSION') {
                type = 'conversion';
              }
              
              return {
                id: tp.id,
                timestamp: tp.timestamp.toISOString(),
                type,
                url: tp.url || '/',
                title: `Page ${tp.id.slice(-8)}`,
                duration: tp.duration || undefined,
                formId: tp.type.includes('FORM') ? 'form_contact' : undefined,
                formName: tp.type.includes('FORM') ? 'Contact Form' : undefined,
                conversionValue: type === 'conversion' ? 99.99 : undefined
              };
            });
            
            // Calculate prediction metrics
            const engagementScore = typedVisitor.score || 0;
            const probability = Math.min(engagementScore / 100, 0.95);
            const predictedValue = probability * 199.99;
            let status: 'active' | 'converted' | 'lost' = 'active';
            
            if (typedVisitor.lastVisit.getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)) {
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
    
    // Return mock data as fallback
    const mockJourneys = generateMockJourneyData(visitorId || undefined);
    console.log('Journeys API - Falling back to mock data');
    return NextResponse.json({ journeys: mockJourneys });
    
  } catch (error) {
    console.error('Error in journeys API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey data' },
      { status: 500 }
    );
  }
} 