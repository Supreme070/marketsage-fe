import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface HeatmapOverview {
  id: string;
  pageUrl: string;
  title: string;
  totalClicks: number;
  totalViews: number;
  clickThroughRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  topElements: {
    selector: string;
    clicks: number;
    percentage: number;
  }[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  timeRange: string;
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  heatmapIntensity: 'low' | 'medium' | 'high';
}

interface HeatmapSummary {
  totalPages: number;
  totalClicks: number;
  totalViews: number;
  avgEngagement: number;
  topPerformingPages: string[];
  improvementOpportunities: string[];
}

// GET: Fetch heatmap overview data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    // Calculate time cutoff
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
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
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get page-level statistics
    const pageStats = await prisma.leadPulseTouchpoint.groupBy({
      by: ['url'],
      where: {
        timestamp: { gte: cutoffTime },
        url: { not: null }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: limit
    });

    // Get click touchpoints for detailed analysis
    const clickTouchpoints = await prisma.leadPulseTouchpoint.findMany({
      where: {
        type: 'CLICK',
        timestamp: { gte: cutoffTime },
        url: { not: null }
      },
      include: {
        visitor: {
          select: {
            device: true,
            engagementScore: true
          }
        }
      }
    });

    // Get page views for comparison
    const pageViews = await prisma.leadPulseTouchpoint.groupBy({
      by: ['url'],
      where: {
        type: 'PAGEVIEW',
        timestamp: { gte: cutoffTime },
        url: { not: null }
      },
      _count: {
        _all: true
      }
    });

    // Get conversion touchpoints
    const conversions = await prisma.leadPulseTouchpoint.groupBy({
      by: ['url'],
      where: {
        type: 'CONVERSION',
        timestamp: { gte: cutoffTime },
        url: { not: null }
      },
      _count: {
        _all: true
      }
    });

    // Create lookup maps
    const pageViewsMap = new Map(pageViews.map(pv => [pv.url!, pv._count._all]));
    const conversionsMap = new Map(conversions.map(c => [c.url!, c._count._all]));

    // Transform to heatmap overview data
    const heatmaps: HeatmapOverview[] = pageStats.map((stat, index) => {
      const url = stat.url!;
      const pageClicks = clickTouchpoints.filter(ct => ct.url === url);
      const pageViewCount = pageViewsMap.get(url) || 0;
      const conversionCount = conversionsMap.get(url) || 0;
      
      // Calculate metrics
      const clickThroughRate = pageViewCount > 0 
        ? (pageClicks.length / pageViewCount) * 100 
        : 0;
      
      const conversionRate = pageViewCount > 0 
        ? (conversionCount / pageViewCount) * 100 
        : 0;

      // Device breakdown
      const deviceBreakdown = {
        desktop: 0,
        mobile: 0,
        tablet: 0
      };

      pageClicks.forEach(click => {
        const device = click.visitor?.device?.toLowerCase() || 'desktop';
        if (device.includes('mobile')) {
          deviceBreakdown.mobile++;
        } else if (device.includes('tablet')) {
          deviceBreakdown.tablet++;
        } else {
          deviceBreakdown.desktop++;
        }
      });

      // Generate top elements (simulated based on common patterns)
      const topElements = generateTopElements(url, pageClicks.length);

      // Calculate trends and intensity
      const trend = determineTrend(pageClicks.length, index);
      const heatmapIntensity = determineIntensity(pageClicks.length, pageViewCount);

      return {
        id: `heatmap_${index}`,
        pageUrl: url,
        title: getPageTitle(url),
        totalClicks: pageClicks.length,
        totalViews: pageViewCount,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        avgTimeOnPage: Math.floor(Math.random() * 180) + 60, // Simulate avg time
        bounceRate: Math.floor(Math.random() * 40) + 30, // Simulate bounce rate
        conversionRate: Math.round(conversionRate * 100) / 100,
        topElements,
        deviceBreakdown,
        timeRange,
        lastUpdated: new Date().toISOString(),
        trend,
        heatmapIntensity
      };
    });

    // Calculate summary statistics
    const totalClicks = clickTouchpoints.length;
    const totalViews = pageViews.reduce((sum, pv) => sum + pv._count._all, 0);
    const avgEngagement = clickTouchpoints.reduce((sum, ct) => 
      sum + (ct.visitor?.engagementScore || 0), 0
    ) / Math.max(clickTouchpoints.length, 1);

    const summary: HeatmapSummary = {
      totalPages: heatmaps.length,
      totalClicks,
      totalViews,
      avgEngagement: Math.round(avgEngagement),
      topPerformingPages: heatmaps
        .sort((a, b) => b.clickThroughRate - a.clickThroughRate)
        .slice(0, 3)
        .map(h => h.title),
      improvementOpportunities: heatmaps
        .filter(h => h.heatmapIntensity === 'low')
        .slice(0, 3)
        .map(h => h.title)
    };

    return NextResponse.json({
      heatmaps,
      summary,
      metadata: {
        timeRange,
        totalPages: pageStats.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching heatmaps overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmaps overview' },
      { status: 500 }
    );
  }
}

// Helper functions
function getPageTitle(url: string): string {
  const urlMap: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/pricing': 'Pricing Page',
    '/contact': 'Contact Us',
    '/demo': 'Request Demo',
    '/solutions': 'Solutions',
    '/about': 'About Us',
    '/leadpulse': 'LeadPulse Analytics',
    '/campaigns': 'Campaigns',
    '/workflows': 'Workflows'
  };

  // Find matching path
  for (const [path, title] of Object.entries(urlMap)) {
    if (url.includes(path)) {
      return title;
    }
  }

  // Default title based on URL
  const pathParts = url.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    return pathParts[pathParts.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return 'Unknown Page';
}

function generateTopElements(url: string, totalClicks: number): HeatmapOverview['topElements'] {
  const commonElements = [
    { selector: '.btn-primary', name: 'Primary CTA' },
    { selector: '.nav-menu', name: 'Navigation' },
    { selector: '.header-logo', name: 'Logo' },
    { selector: '.footer-links', name: 'Footer Links' },
    { selector: '.contact-form', name: 'Contact Form' }
  ];

  // Page-specific elements
  if (url.includes('pricing')) {
    commonElements.unshift(
      { selector: '.pricing-table', name: 'Pricing Table' },
      { selector: '.plan-select', name: 'Plan Selection' }
    );
  }

  if (url.includes('demo')) {
    commonElements.unshift(
      { selector: '.demo-form', name: 'Demo Form' },
      { selector: '.calendar-widget', name: 'Calendar' }
    );
  }

  // Distribute clicks among elements with realistic patterns
  const elements = commonElements.slice(0, 5);
  let remainingClicks = totalClicks;
  
  return elements.map((element, index) => {
    // Primary elements get more clicks, with diminishing returns
    const baseWeight = Math.pow(0.6, index);
    const clickCount = index === elements.length - 1 
      ? remainingClicks 
      : Math.floor(remainingClicks * baseWeight);
    
    remainingClicks -= clickCount;
    
    const percentage = totalClicks > 0 ? (clickCount / totalClicks) * 100 : 0;
    
    return {
      selector: element.selector,
      clicks: Math.max(0, clickCount),
      percentage: Math.round(percentage * 100) / 100
    };
  });
}

function determineTrend(clicks: number, index: number): HeatmapOverview['trend'] {
  // Simulate trend based on various factors
  const randomFactor = Math.random();
  
  if (clicks > 50 && randomFactor > 0.7) return 'increasing';
  if (clicks < 10 && randomFactor < 0.3) return 'decreasing';
  return 'stable';
}

function determineIntensity(clicks: number, views: number): HeatmapOverview['heatmapIntensity'] {
  const clickRate = views > 0 ? (clicks / views) * 100 : 0;
  
  if (clickRate > 15 || clicks > 100) return 'high';
  if (clickRate > 5 || clicks > 30) return 'medium';
  return 'low';
}