import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateMockSegmentData } from '@/app/api/leadpulse/_mockData';

/**
 * GET /api/leadpulse/segments
 * Returns visitor segments based on behavior patterns
 */
export async function GET(request: NextRequest) {
  try {
    // Use mock data for now - when AnonymousVisitor model is properly added to the schema,
    // we can uncomment and use the real data query
    /*
    // Attempt to generate real segments
    try {
      const totalVisitors = await prisma.anonymousVisitor.count();
      
      if (totalVisitors > 0) {
        // Get counts for different segments
        const highValueCount = await prisma.anonymousVisitor.count({
          where: {
            engagementScore: {
              gte: 70
            }
          }
        });
        
        const convertedCount = await prisma.anonymousVisitor.count({
          where: {
            contactId: {
              not: null
            }
          }
        });
        
        const newVisitorsCount = await prisma.anonymousVisitor.count({
          where: {
            visits: 1
          }
        });
        
        const returningVisitorsCount = await prisma.anonymousVisitor.count({
          where: {
            visits: {
              gt: 1
            }
          }
        });
        
        const inactiveVisitorsCount = await prisma.anonymousVisitor.count({
          where: {
            lastVisitedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
          }
        });
        
        // Calculate percentages
        const highValuePercentage = (highValueCount / totalVisitors) * 100;
        const convertedPercentage = (convertedCount / totalVisitors) * 100;
        const newVisitorsPercentage = (newVisitorsCount / totalVisitors) * 100;
        const returningVisitorsPercentage = (returningVisitorsCount / totalVisitors) * 100;
        const inactiveVisitorsPercentage = (inactiveVisitorsCount / totalVisitors) * 100;
        
        // Create segment objects
        const segments = [
          {
            id: 's1',
            name: 'High-Value Prospects',
            count: highValueCount,
            percentage: highValuePercentage,
            key: 'high_value'
          },
          {
            id: 's2',
            name: 'Converted Contacts',
            count: convertedCount,
            percentage: convertedPercentage,
            key: 'converted'
          },
          {
            id: 's3',
            name: 'First-Time Visitors',
            count: newVisitorsCount,
            percentage: newVisitorsPercentage,
            key: 'new'
          },
          {
            id: 's4',
            name: 'Returning Visitors',
            count: returningVisitorsCount,
            percentage: returningVisitorsPercentage,
            key: 'returning'
          },
          {
            id: 's5',
            name: 'Inactive Visitors',
            count: inactiveVisitorsCount,
            percentage: inactiveVisitorsPercentage,
            key: 'inactive'
          }
        ];
        
        return NextResponse.json({ segments });
      }
    } catch (prismaError) {
      console.error('Error generating segments from Prisma data:', prismaError);
      // Continue to fallback data
    }
    */
    
    // Return mock segments as fallback
    const mockSegments = generateMockSegmentData();
    return NextResponse.json({ segments: mockSegments });
    
  } catch (error) {
    console.error('Error in segments API:', error);
    return NextResponse.json(
      { error: 'Failed to generate segments' },
      { status: 500 }
    );
  }
} 