import { NextRequest, NextResponse } from 'next/server';

interface TrafficData {
  date: string;
  visitors: number;
  applications: number;
  sales: number;
  revenue: number;
  sources: {
    organic: number;
    paid: number;
    social: number;
    direct: number;
    referral: number;
  };
}

interface HeatmapData {
  pageUrl: string;
  pageTitle: string;
  totalInteractions: number;
  hotspots: Array<{
    x: number;
    y: number;
    intensity: number;
    type: 'click' | 'hover' | 'scroll';
    count: number;
  }>;
  scrollDepth: {
    '25%': number;
    '50%': number;
    '75%': number;
    '100%': number;
  };
}

interface ABTestData {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    traffic: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
  }>;
  startDate: string;
  endDate?: string;
}

// Simulated analytics database
let analyticsDB = {
  traffic: generateTrafficData(),
  heatmap: generateHeatmapData(),
  abtests: generateABTestData()
};

function generateTrafficData(): TrafficData[] {
  const data: TrafficData[] = [];
  const now = new Date();
  
  // Generate last 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseVisitors = 800 + Math.random() * 400; // 800-1200 base
    
    // Add weekly patterns (higher on weekdays)
    const dayOfWeek = date.getDay();
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
    
    const visitors = Math.floor(baseVisitors * weekdayMultiplier);
    const applications = Math.floor(visitors * (0.12 + Math.random() * 0.08)); // 12-20% conversion
    const sales = Math.floor(applications * (0.15 + Math.random() * 0.15)); // 15-30% sales conversion
    const revenue = sales * (120000 + Math.random() * 80000); // ₦120k-200k per sale
    
    // Traffic source distribution
    const organicShare = 0.35 + Math.random() * 0.15; // 35-50%
    const paidShare = 0.25 + Math.random() * 0.10; // 25-35%
    const socialShare = 0.15 + Math.random() * 0.10; // 15-25%
    const directShare = 0.15 + Math.random() * 0.05; // 15-20%
    const referralShare = 1 - (organicShare + paidShare + socialShare + directShare);
    
    data.push({
      date: date.toISOString().split('T')[0],
      visitors,
      applications,
      sales,
      revenue,
      sources: {
        organic: Math.floor(visitors * organicShare),
        paid: Math.floor(visitors * paidShare),
        social: Math.floor(visitors * socialShare),
        direct: Math.floor(visitors * directShare),
        referral: Math.floor(visitors * referralShare)
      }
    });
  }
  
  return data;
}

function generateHeatmapData(): HeatmapData[] {
  const pages = [
    { url: '/home', title: 'Homepage' },
    { url: '/pricing', title: 'Pricing Page' },
    { url: '/features', title: 'Features Page' },
    { url: '/about', title: 'About Us' },
    { url: '/contact', title: 'Contact Page' }
  ];
  
  return pages.map(page => {
    // Generate hotspots for each page
    const hotspots = [];
    const numHotspots = 15 + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < numHotspots; i++) {
      hotspots.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        intensity: Math.random() * 100,
        type: ['click', 'hover', 'scroll'][Math.floor(Math.random() * 3)] as 'click' | 'hover' | 'scroll',
        count: Math.floor(Math.random() * 500) + 10
      });
    }
    
    // Generate scroll depth data
    const baseScrollers = 1000 + Math.random() * 500;
    
    return {
      pageUrl: page.url,
      pageTitle: page.title,
      totalInteractions: hotspots.reduce((sum, h) => sum + h.count, 0),
      hotspots,
      scrollDepth: {
        '25%': Math.floor(baseScrollers * (0.85 + Math.random() * 0.10)),
        '50%': Math.floor(baseScrollers * (0.70 + Math.random() * 0.15)),
        '75%': Math.floor(baseScrollers * (0.45 + Math.random() * 0.20)),
        '100%': Math.floor(baseScrollers * (0.25 + Math.random() * 0.15))
      }
    };
  });
}

function generateABTestData(): ABTestData[] {
  return [
    {
      id: 'test_1',
      name: 'Homepage CTA Button Color',
      status: 'active',
      variants: [
        {
          id: 'variant_a',
          name: 'Green Button (Control)',
          traffic: 2456,
          conversions: 187,
          conversionRate: 7.61,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'Orange Button',
          traffic: 2534,
          conversions: 213,
          conversionRate: 8.40,
          confidence: 89
        }
      ],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'test_2',
      name: 'Pricing Page Layout',
      status: 'completed',
      variants: [
        {
          id: 'variant_a',
          name: 'Table Layout (Control)',
          traffic: 1876,
          conversions: 94,
          conversionRate: 5.01,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'Card Layout',
          traffic: 1923,
          conversions: 125,
          conversionRate: 6.50,
          confidence: 95
        }
      ],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'test_3',
      name: 'Mobile Form Optimization',
      status: 'active',
      variants: [
        {
          id: 'variant_a',
          name: 'Single Page Form (Control)',
          traffic: 3421,
          conversions: 341,
          conversionRate: 9.97,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'Multi-step Form',
          traffic: 3456,
          conversions: 398,
          conversionRate: 11.52,
          confidence: 78
        }
      ],
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
}

// GET: Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const timeRange = searchParams.get('timeRange') || '30d';
    const page = searchParams.get('page');
    
    let response: any = { success: true };
    
    // Filter traffic data by time range
    let filteredTrafficData = [...analyticsDB.traffic];
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    filteredTrafficData = filteredTrafficData.filter(data => 
      new Date(data.date) >= cutoffDate
    );
    
    switch (type) {
      case 'traffic':
        // Calculate aggregated metrics
        const totalVisitors = filteredTrafficData.reduce((sum, d) => sum + d.visitors, 0);
        const totalApplications = filteredTrafficData.reduce((sum, d) => sum + d.applications, 0);
        const totalSales = filteredTrafficData.reduce((sum, d) => sum + d.sales, 0);
        const totalRevenue = filteredTrafficData.reduce((sum, d) => sum + d.revenue, 0);
        
        response.traffic = {
          data: filteredTrafficData,
          metrics: {
            totalVisitors,
            totalApplications,
            totalSales,
            totalRevenue,
            applicationRate: (totalApplications / totalVisitors) * 100,
            salesConversionRate: (totalSales / totalApplications) * 100,
            overallConversionRate: (totalSales / totalVisitors) * 100,
            averageOrderValue: totalRevenue / totalSales
          }
        };
        break;
        
      case 'heatmap':
        let heatmapData = [...analyticsDB.heatmap];
        if (page) {
          heatmapData = heatmapData.filter(h => h.pageUrl === page);
        }
        response.heatmap = heatmapData;
        break;
        
      case 'abtests':
        response.abtests = analyticsDB.abtests;
        break;
        
      case 'all':
        response = {
          success: true,
          traffic: {
            data: filteredTrafficData.slice(-7), // Last 7 days for overview
            metrics: (() => {
              const totalVisitors = filteredTrafficData.reduce((sum, d) => sum + d.visitors, 0);
              const totalApplications = filteredTrafficData.reduce((sum, d) => sum + d.applications, 0);
              const totalSales = filteredTrafficData.reduce((sum, d) => sum + d.sales, 0);
              const totalRevenue = filteredTrafficData.reduce((sum, d) => sum + d.revenue, 0);
              
              return {
                totalVisitors,
                totalApplications,
                totalSales,
                totalRevenue,
                applicationRate: (totalApplications / totalVisitors) * 100,
                salesConversionRate: (totalSales / totalApplications) * 100,
                overallConversionRate: (totalSales / totalVisitors) * 100,
                averageOrderValue: totalRevenue / totalSales
              };
            })()
          },
          heatmap: analyticsDB.heatmap.slice(0, 3), // Top 3 pages
          abtests: analyticsDB.abtests.filter(test => test.status === 'active')
        };
        break;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// POST: Track new analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    switch (type) {
      case 'heatmap_interaction':
        // Add new heatmap interaction
        const { pageUrl, x, y, interactionType } = data;
        const pageData = analyticsDB.heatmap.find(h => h.pageUrl === pageUrl);
        
        if (pageData) {
          // Find nearby hotspot or create new one
          const nearbyHotspot = pageData.hotspots.find(h => 
            Math.abs(h.x - x) < 5 && Math.abs(h.y - y) < 5 && h.type === interactionType
          );
          
          if (nearbyHotspot) {
            nearbyHotspot.count++;
            nearbyHotspot.intensity = Math.min(100, nearbyHotspot.intensity + 1);
          } else {
            pageData.hotspots.push({
              x,
              y,
              intensity: 10,
              type: interactionType,
              count: 1
            });
          }
          
          pageData.totalInteractions++;
        }
        break;
        
      case 'conversion_event':
        // Add conversion to today's traffic data
        const today = new Date().toISOString().split('T')[0];
        const todayData = analyticsDB.traffic.find(t => t.date === today);
        
        if (todayData) {
          if (data.eventType === 'application') {
            todayData.applications++;
          } else if (data.eventType === 'sale') {
            todayData.sales++;
            todayData.revenue += data.amount || 0;
          }
        }
        break;
        
      case 'abtest_conversion':
        // Track A/B test conversion
        const { testId, variantId } = data;
        const test = analyticsDB.abtests.find(t => t.id === testId);
        
        if (test) {
          const variant = test.variants.find(v => v.id === variantId);
          if (variant) {
            variant.conversions++;
            variant.conversionRate = (variant.conversions / variant.traffic) * 100;
            
            // Recalculate confidence (simplified)
            if (variantId !== 'variant_a') {
              const control = test.variants.find(v => v.id === 'variant_a');
              if (control && variant.traffic > 100 && control.traffic > 100) {
                const lift = (variant.conversionRate - control.conversionRate) / control.conversionRate;
                variant.confidence = Math.min(99, Math.max(0, 50 + lift * 100));
              }
            }
          }
        }
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}

// PUT: Update A/B test status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, action, data: updateData } = body;
    
    const test = analyticsDB.abtests.find(t => t.id === testId);
    
    if (!test) {
      return NextResponse.json(
        { success: false, error: 'A/B test not found' },
        { status: 404 }
      );
    }
    
    switch (action) {
      case 'pause':
        test.status = 'paused';
        break;
        
      case 'resume':
        test.status = 'active';
        break;
        
      case 'complete':
        test.status = 'completed';
        test.endDate = new Date().toISOString();
        break;
        
      case 'add_traffic':
        // Simulate adding traffic to a variant
        const { variantId, trafficIncrease } = updateData;
        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
          variant.traffic += trafficIncrease;
          variant.conversionRate = (variant.conversions / variant.traffic) * 100;
        }
        break;
    }
    
    return NextResponse.json({
      success: true,
      test
    });
    
  } catch (error) {
    console.error('Error updating A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update A/B test' },
      { status: 500 }
    );
  }
} 