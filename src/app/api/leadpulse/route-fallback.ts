import { type NextRequest, NextResponse } from 'next/server';

// Fallback mock data for when database is not available
function getMockOverviewData(timeRange: string) {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Business hour multipliers
  let multiplier = 1.0;
  if (currentHour >= 9 && currentHour <= 17) {
    multiplier = 1.5; // Business hours
  } else if (currentHour >= 18 && currentHour <= 22) {
    multiplier = 1.2; // Evening
  }
  
  const baseActive = Math.floor((Math.random() * 20 + 15) * multiplier);
  const baseTotal = Math.floor(baseActive * (Math.random() * 3 + 4));
  
  return {
    success: true,
    overview: {
      activeVisitors: baseActive,
      totalVisitors: baseTotal,
      conversionRate: Math.random() * 5 + 2, // 2-7%
      avgEngagement: Math.random() * 30 + 60, // 60-90
      topSources: [
        { source: 'google', visitors: Math.floor(baseTotal * 0.4) },
        { source: 'direct', visitors: Math.floor(baseTotal * 0.3) },
        { source: 'social', visitors: Math.floor(baseTotal * 0.2) },
        { source: 'referral', visitors: Math.floor(baseTotal * 0.1) }
      ]
    },
    platformBreakdown: {
      mobile: Math.floor(baseTotal * 0.65),
      desktop: Math.floor(baseTotal * 0.30),
      tablet: Math.floor(baseTotal * 0.05)
    },
    touchpointStats: [
      { type: 'PAGE_VIEW', count: Math.floor(baseTotal * 8) },
      { type: 'CLICK', count: Math.floor(baseTotal * 3) },
      { type: 'FORM_VIEW', count: Math.floor(baseTotal * 0.8) },
      { type: 'FORM_SUBMIT', count: Math.floor(baseTotal * 0.2) }
    ],
    metadata: {
      lastUpdated: now.toISOString(),
      timeRange,
      dataSource: 'mock_fallback'
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    console.log('LeadPulse Overview API - Using fallback mock data');
    
    // Return mock data
    const mockData = getMockOverviewData(timeRange);
    return NextResponse.json(mockData);
    
  } catch (error) {
    console.error('Error in LeadPulse overview API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch overview data',
        success: false
      },
      { status: 500 }
    );
  }
}