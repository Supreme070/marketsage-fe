import { type NextRequest, NextResponse } from 'next/server';
import { validateAnalyticsQuery, createValidationErrorResponse } from '@/lib/leadpulse/validation';
import { logger } from '@/lib/logger';

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
const analyticsDB = {
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
    const applications = Math.floor(visitors * (0.15 + Math.random() * 0.10)); // 15-25% conversion (higher for AI solutions)
    const sales = Math.floor(applications * (0.20 + Math.random() * 0.15)); // 20-35% sales conversion (TechFlow quality)
    const revenue = sales * (450000 + Math.random() * 350000); // ₦450k-800k per TechFlow AI solution sale
    
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
    { url: '/home', title: 'TechFlow Solutions - Home' },
    { url: '/pricing', title: 'TechFlow Pricing - Nigerian Market' },
    { url: '/solutions/ai-intelligence', title: 'AI Intelligence Platform' },
    { url: '/solutions/leadpulse', title: 'LeadPulse Analytics' },
    { url: '/enterprise', title: 'TechFlow Enterprise Solutions' },
    { url: '/contact', title: 'Contact TechFlow Solutions' }
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
      name: 'TechFlow WhatsApp vs Email Contact',
      status: 'active',
      variants: [
        {
          id: 'variant_a',
          name: 'Email Contact (Control)',
          traffic: 1456,
          conversions: 87,
          conversionRate: 5.97,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'WhatsApp Contact',
          traffic: 1534,
          conversions: 156,
          conversionRate: 10.17,
          confidence: 95
        }
      ],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'test_2',
      name: 'Nigerian Naira vs USD Pricing Display',
      status: 'completed',
      variants: [
        {
          id: 'variant_a',
          name: 'USD Pricing (Control)',
          traffic: 876,
          conversions: 34,
          conversionRate: 3.88,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'Nigerian Naira Pricing',
          traffic: 923,
          conversions: 78,
          conversionRate: 8.45,
          confidence: 98
        }
      ],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'test_3',
      name: 'TechFlow AI Demo vs Trial Signup',
      status: 'active',
      variants: [
        {
          id: 'variant_a',
          name: 'Free Trial CTA (Control)',
          traffic: 2421,
          conversions: 194,
          conversionRate: 8.01,
          confidence: 0
        },
        {
          id: 'variant_b',
          name: 'Book AI Demo CTA',
          traffic: 2456,
          conversions: 268,
          conversionRate: 10.91,
          confidence: 87
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
    
    // Extract and validate query parameters
    const queryParams = {
      type: searchParams.get('type') || 'all',
      timeRange: searchParams.get('timeRange') || '30d',
      page: searchParams.get('page'),
      pixelId: searchParams.get('pixelId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      eventType: searchParams.get('eventType'),
      groupBy: searchParams.get('groupBy'),
      includeDetails: searchParams.get('includeDetails') === 'true',
      limit: searchParams.get('limit') ? Number.parseInt(searchParams.get('limit')!) : undefined,
    };
    
    // Skip validation for simple analytics queries (traffic, heatmap, abtests)
    const simpleQueryTypes = ['traffic', 'heatmap', 'abtests', 'all'];
    const isSimpleQuery = simpleQueryTypes.includes(queryParams.type);
    
    if (!isSimpleQuery) {
      // Only validate complex queries that require detailed parameters
      const validation = validateAnalyticsQuery(queryParams);
      if (!validation.success) {
        logger.warn('Invalid analytics query parameters', {
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
          error: validation.error,
          queryParams,
        });
        
        return NextResponse.json(
          createValidationErrorResponse(validation),
          { status: 400 }
        );
      }
    }
    
    const { type, timeRange, page } = queryParams;
    
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
    logger.error('Error fetching analytics', {
      error,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// POST: Track new analytics event
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in analytics tracking request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { type, data } = body;
    
    // Basic validation
    if (!type || !data) {
      logger.warn('Missing required fields in analytics event', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        body,
      });
      
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }
    
    // Validate event type
    const validEventTypes = ['heatmap_interaction', 'conversion_event', 'abtest_conversion'];
    if (!validEventTypes.includes(type)) {
      logger.warn('Invalid analytics event type', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        type,
        validTypes: validEventTypes,
      });
      
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    switch (type) {
      case 'heatmap_interaction':
        // Validate heatmap interaction data
        const { pageUrl, x, y, interactionType } = data;
        
        if (!pageUrl || typeof x !== 'number' || typeof y !== 'number' || !interactionType) {
          logger.warn('Invalid heatmap interaction data', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            data,
          });
          
          return NextResponse.json(
            { error: 'Invalid heatmap interaction data. Required: pageUrl, x, y, interactionType' },
            { status: 400 }
          );
        }
        
        // Validate coordinate bounds
        if (x < 0 || x > 100 || y < 0 || y > 100) {
          logger.warn('Invalid coordinates in heatmap interaction', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            x, y,
          });
          
          return NextResponse.json(
            { error: 'Coordinates must be between 0 and 100' },
            { status: 400 }
          );
        }
        
        // Validate interaction type
        const validInteractionTypes = ['click', 'hover', 'scroll'];
        if (!validInteractionTypes.includes(interactionType)) {
          logger.warn('Invalid interaction type', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            interactionType,
          });
          
          return NextResponse.json(
            { error: `Invalid interaction type. Valid types: ${validInteractionTypes.join(', ')}` },
            { status: 400 }
          );
        }
        
        // Add new heatmap interaction
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
        // Validate conversion event data
        if (!data.eventType) {
          logger.warn('Missing eventType in conversion event', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            data,
          });
          
          return NextResponse.json(
            { error: 'Missing eventType in conversion event data' },
            { status: 400 }
          );
        }
        
        const validConversionTypes = ['application', 'sale'];
        if (!validConversionTypes.includes(data.eventType)) {
          logger.warn('Invalid conversion event type', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            eventType: data.eventType,
          });
          
          return NextResponse.json(
            { error: `Invalid conversion event type. Valid types: ${validConversionTypes.join(', ')}` },
            { status: 400 }
          );
        }
        
        // Validate amount for sale events
        if (data.eventType === 'sale' && (typeof data.amount !== 'number' || data.amount < 0)) {
          logger.warn('Invalid sale amount', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            amount: data.amount,
          });
          
          return NextResponse.json(
            { error: 'Sale events must include a valid positive amount' },
            { status: 400 }
          );
        }
        
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
        // Validate A/B test conversion data
        const { testId, variantId } = data;
        
        if (!testId || !variantId) {
          logger.warn('Missing testId or variantId in A/B test conversion', {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            data,
          });
          
          return NextResponse.json(
            { error: 'Missing testId or variantId in A/B test conversion data' },
            { status: 400 }
          );
        }
        
        // Track A/B test conversion
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
    logger.error('Error tracking analytics event', {
      error,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}

// PUT: Update A/B test status
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in A/B test update request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { testId, action, data: updateData } = body;
    
    // Validate required fields
    if (!testId || !action) {
      logger.warn('Missing required fields in A/B test update', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        body,
      });
      
      return NextResponse.json(
        { error: 'Missing required fields: testId and action' },
        { status: 400 }
      );
    }
    
    // Validate action type
    const validActions = ['pause', 'resume', 'complete', 'add_traffic'];
    if (!validActions.includes(action)) {
      logger.warn('Invalid A/B test action', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        action,
        validActions,
      });
      
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }
    
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
    logger.error('Error updating A/B test', {
      error,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to update A/B test' },
      { status: 500 }
    );
  }
} 