import { type NextRequest, NextResponse } from 'next/server';

interface DashboardOverview {
  kpis: {
    revenueToday: number;
    conversionRate: number;
    activeJourneys: number;
    runningAutomations: number;
  };
  livePulse: {
    activeVisitors: number;
    conversionsToday: number;
    engagementTrend: number;
  };
  modules: {
    workflows: { count: number; trend: string };
    notifications: { count: number; trend: string };
    journeys: { count: number; trend: string };
    leadpulse: { count: number; trend: string };
    campaigns: { count: number; trend: string };
    support: { count: number; trend: string };
  };
  recentActivity: Array<{
    id: string;
    type: 'campaign' | 'workflow' | 'journey' | 'support' | 'leadpulse';
    title: string;
    description: string;
    timestamp: string;
    href: string;
  }>;
}

// Function to get synced visitor data from LeadPulse API
async function getSyncedVisitorData() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/leadpulse?timeRange=24h`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        activeVisitors: data.overview?.activeVisitors || 50,
        conversionsToday: Math.floor((data.overview?.conversionRate || 15) / 100 * (data.overview?.activeVisitors || 50)),
        engagementTrend: 85 + Math.random() * 10,
      };
    }
  } catch (error) {
    console.log('Could not sync with LeadPulse API, using fallback');
  }
  
  // Fallback to original logic if API fails
  return {
    activeVisitors: 45 + Math.floor(Math.random() * 25),
    conversionsToday: 6 + Math.floor(Math.random() * 4),
    engagementTrend: 85 + Math.random() * 10,
  };
}

// Simulated data aggregation
async function generateOverviewData(): Promise<DashboardOverview> {
  const now = new Date();
  const livePulseData = await getSyncedVisitorData();
  
  return {
    kpis: {
      revenueToday: 1420000 + Math.floor(Math.random() * 200000), // ₦1.4M-1.6M
      conversionRate: 3.7 + Math.random() * 0.6, // 3.7-4.3%
      activeJourneys: 15 + Math.floor(Math.random() * 8), // 15-23
      runningAutomations: 22 + Math.floor(Math.random() * 6), // 22-28
    },
    livePulse: livePulseData,
    modules: {
      workflows: { 
        count: 24 + Math.floor(Math.random() * 6), 
        trend: '+2' 
      },
      notifications: { 
        count: 1200 + Math.floor(Math.random() * 300), 
        trend: '+47' 
      },
      journeys: { 
        count: 17 + Math.floor(Math.random() * 5), 
        trend: '+1' 
      },
      leadpulse: { 
        count: 56 + Math.floor(Math.random() * 20), 
        trend: '+12' 
      },
      campaigns: { 
        count: 12 + Math.floor(Math.random() * 4), 
        trend: '+3' 
      },
      support: { 
        count: 2 + Math.floor(Math.random() * 4), 
        trend: '-1' 
      },
    },
    recentActivity: [
      {
        id: '1',
        type: 'campaign',
        title: 'Email Campaign Sent',
        description: 'Monthly Newsletter to 15,400 subscribers',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        href: '/email/campaigns'
      },
      {
        id: '2',
        type: 'workflow',
        title: 'Workflow Triggered',
        description: 'Welcome sequence for new Lagos subscribers',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        href: '/workflows'
      },
      {
        id: '3',
        type: 'leadpulse',
        title: 'High-Intent Visitor Detected',
        description: 'Visitor from Abuja spent 8 min on pricing page',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        href: '/leadpulse'
      },
      {
        id: '4',
        type: 'journey',
        title: 'Customer Journey Completed',
        description: 'Fintech prospect converted to paid plan',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        href: '/customer-journey'
      },
      {
        id: '5',
        type: 'support',
        title: 'Support Ticket Resolved',
        description: 'WhatsApp integration setup assistance',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        href: '/support'
      },
      {
        id: '6',
        type: 'campaign',
        title: 'SMS Campaign Performance',
        description: 'Promo campaign: 23% click-through rate',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        href: '/sms/campaigns'
      },
      {
        id: '7',
        type: 'workflow',
        title: 'Automation Created',
        description: 'Cart abandonment SMS sequence for e-commerce',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        href: '/workflows'
      },
      {
        id: '8',
        type: 'leadpulse',
        title: 'Traffic Spike Detected',
        description: 'Organic traffic up 45% from yesterday',
        timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
        href: '/leadpulse/analytics'
      },
      {
        id: '9',
        type: 'journey',
        title: 'Journey Optimization',
        description: 'Mobile checkout flow improved conversion by 12%',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        href: '/customer-journey'
      },
      {
        id: '10',
        type: 'campaign',
        title: 'WhatsApp Broadcast',
        description: 'Product announcement to VIP segment',
        timestamp: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
        href: '/whatsapp/campaigns'
      }
    ]
  };
}

// GET: Fetch dashboard overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // In production, this would aggregate real data from:
    // - Revenue from sales/orders API
    // - Conversion rates from analytics
    // - Active journeys from customer journey engine
    // - Running automations from workflow engine
    // - Live visitors from LeadPulse
    // - Recent activity from activity logs
    
    const overviewData = await generateOverviewData();
    
    return NextResponse.json({
      success: true,
      data: overviewData,
      generatedAt: new Date().toISOString(),
      timeRange
    });
    
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}

// POST: Track dashboard action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, module, metadata } = body;
    
    // Track dashboard interactions for analytics
    // This could be used for:
    // - Understanding which modules users interact with most
    // - A/B testing dashboard layouts
    // - Performance monitoring
    
    console.log('Dashboard action tracked:', { action, module, metadata, timestamp: new Date().toISOString() });
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard action tracked'
    });
    
  } catch (error) {
    console.error('Error tracking dashboard action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track dashboard action' },
      { status: 500 }
    );
  }
} 