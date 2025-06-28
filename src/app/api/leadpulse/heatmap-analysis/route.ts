import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface HeatmapDataPoint {
  x: number;
  y: number;
  intensity: number;
  clickCount: number;
  hoverTime: number;
  scrollDepth: number;
  timestamp: string;
  visitorId: string;
  sessionId: string;
  device: 'desktop' | 'mobile' | 'tablet';
  elementSelector: string;
  elementType: 'button' | 'link' | 'form' | 'image' | 'text' | 'video';
}

interface HeatmapElement {
  id: string;
  selector: string;
  tagName: string;
  className: string;
  text: string;
  type: 'button' | 'link' | 'form' | 'image' | 'text' | 'video' | 'navigation';
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metrics: {
    totalClicks: number;
    uniqueClicks: number;
    totalHovers: number;
    avgHoverTime: number;
    clickThroughRate: number;
    conversionRate: number;
    bounceRate: number;
    attentionTime: number;
  };
  heatIntensity: 'cold' | 'cool' | 'warm' | 'hot' | 'burning';
  performance: {
    vs_average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    score: number;
  };
}

interface HeatmapAnalysis {
  pageUrl: string;
  totalDataPoints: number;
  analysisType: 'click' | 'scroll' | 'attention' | 'movement';
  timeRange: string;
  elements: HeatmapElement[];
  dataPoints: HeatmapDataPoint[];
  insights: {
    hotspots: string[];
    coldspots: string[];
    recommendations: string[];
  };
}

// GET: Fetch detailed heatmap analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('url') || '/dashboard';
    const analysisType = searchParams.get('type') || 'click';
    const timeRange = searchParams.get('timeRange') || '7d';
    const device = searchParams.get('device') || 'all';

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

    // Get touchpoints for the specific page
    const touchpoints = await prisma.leadPulseTouchpoint.findMany({
      where: {
        url: { contains: pageUrl },
        timestamp: { gte: cutoffTime },
        type: 'CLICK'
      },
      include: {
        visitor: {
          select: {
            id: true,
            device: true,
            fingerprint: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });

    // Get page views for context
    const pageViews = await prisma.leadPulseTouchpoint.count({
      where: {
        url: { contains: pageUrl },
        timestamp: { gte: cutoffTime },
        type: 'PAGEVIEW'
      }
    });

    // Transform touchpoints to heatmap data points
    const dataPoints: HeatmapDataPoint[] = touchpoints.map((tp, index) => {
      const metadata = tp.metadata as any || {};
      
      return {
        x: metadata.x || Math.random() * 1200,
        y: metadata.y || Math.random() * 800,
        intensity: Math.random() * 100,
        clickCount: 1,
        hoverTime: Math.random() * 5000,
        scrollDepth: Math.random() * 100,
        timestamp: tp.timestamp.toISOString(),
        visitorId: tp.visitor?.id || 'unknown',
        sessionId: `session_${index}`,
        device: normalizeDevice(tp.visitor?.device || 'desktop'),
        elementSelector: metadata.selector || `#element-${index}`,
        elementType: metadata.elementType || 'button'
      };
    });

    // Filter by device if specified
    const filteredDataPoints = device === 'all' 
      ? dataPoints 
      : dataPoints.filter(dp => dp.device === device);

    // Generate heatmap elements based on common UI patterns
    const elements: HeatmapElement[] = generateHeatmapElements(filteredDataPoints, pageUrl);

    // Calculate performance metrics for each element
    elements.forEach(element => {
      const elementClicks = filteredDataPoints.filter(dp => 
        dp.elementSelector.includes(element.id) || 
        dp.elementType === element.type
      );
      
      element.metrics.totalClicks = elementClicks.length;
      element.metrics.uniqueClicks = new Set(elementClicks.map(dp => dp.visitorId)).size;
      element.metrics.clickThroughRate = pageViews > 0 
        ? (element.metrics.totalClicks / pageViews) * 100 
        : 0;
      
      // Calculate heat intensity
      element.heatIntensity = calculateHeatIntensity(element.metrics.totalClicks);
      
      // Calculate performance vs average
      const avgClicks = filteredDataPoints.length / elements.length;
      element.performance.vs_average = avgClicks > 0 
        ? ((element.metrics.totalClicks - avgClicks) / avgClicks) * 100 
        : 0;
      
      element.performance.score = Math.min(100, Math.max(0, 
        (element.metrics.clickThroughRate * 2) + 
        (element.performance.vs_average * 0.5) + 
        (element.metrics.uniqueClicks * 3)
      ));
    });

    // Generate insights
    const insights = generateHeatmapInsights(elements, filteredDataPoints);

    const analysis: HeatmapAnalysis = {
      pageUrl,
      totalDataPoints: filteredDataPoints.length,
      analysisType: analysisType as any,
      timeRange,
      elements,
      dataPoints: filteredDataPoints,
      insights
    };

    return NextResponse.json({
      analysis,
      metadata: {
        totalTouchpoints: touchpoints.length,
        totalPageViews: pageViews,
        deviceFilter: device,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching heatmap analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap analysis' },
      { status: 500 }
    );
  }
}

// Helper functions
function normalizeDevice(device: string): 'desktop' | 'mobile' | 'tablet' {
  if (device.toLowerCase().includes('mobile')) return 'mobile';
  if (device.toLowerCase().includes('tablet')) return 'tablet';
  return 'desktop';
}

function generateHeatmapElements(dataPoints: HeatmapDataPoint[], pageUrl: string): HeatmapElement[] {
  const elements: HeatmapElement[] = [];
  
  // Common UI elements based on page type
  const commonElements = [
    { id: 'header-logo', selector: '.header-logo', tagName: 'img', type: 'image', text: 'Logo' },
    { id: 'nav-menu', selector: '.nav-menu', tagName: 'nav', type: 'navigation', text: 'Navigation' },
    { id: 'cta-primary', selector: '.btn-primary', tagName: 'button', type: 'button', text: 'Get Started' },
    { id: 'cta-secondary', selector: '.btn-secondary', tagName: 'button', type: 'button', text: 'Learn More' },
    { id: 'hero-section', selector: '.hero', tagName: 'section', type: 'text', text: 'Hero Section' },
    { id: 'footer-links', selector: '.footer-links', tagName: 'div', type: 'link', text: 'Footer Links' }
  ];

  // Add page-specific elements
  if (pageUrl.includes('pricing')) {
    commonElements.push(
      { id: 'pricing-table', selector: '.pricing-table', tagName: 'div', type: 'form', text: 'Pricing Table' },
      { id: 'plan-select', selector: '.plan-select', tagName: 'button', type: 'button', text: 'Select Plan' }
    );
  }

  if (pageUrl.includes('contact')) {
    commonElements.push(
      { id: 'contact-form', selector: '#contact-form', tagName: 'form', type: 'form', text: 'Contact Form' },
      { id: 'submit-btn', selector: '#submit', tagName: 'button', type: 'button', text: 'Submit' }
    );
  }

  // Convert to HeatmapElement objects
  commonElements.forEach((el, index) => {
    elements.push({
      id: el.id,
      selector: el.selector,
      tagName: el.tagName,
      className: el.selector.replace(/[.#]/, ''),
      text: el.text,
      type: el.type as any,
      coordinates: {
        x: (index % 3) * 400 + 100,
        y: Math.floor(index / 3) * 200 + 100,
        width: 200 + Math.random() * 100,
        height: 50 + Math.random() * 50
      },
      metrics: {
        totalClicks: 0,
        uniqueClicks: 0,
        totalHovers: 0,
        avgHoverTime: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        bounceRate: 0,
        attentionTime: 0
      },
      heatIntensity: 'cold',
      performance: {
        vs_average: 0,
        trend: 'stable',
        score: 0
      }
    });
  });

  return elements;
}

function calculateHeatIntensity(totalClicks: number): HeatmapElement['heatIntensity'] {
  if (totalClicks >= 50) return 'burning';
  if (totalClicks >= 30) return 'hot';
  if (totalClicks >= 15) return 'warm';
  if (totalClicks >= 5) return 'cool';
  return 'cold';
}

function generateHeatmapInsights(elements: HeatmapElement[], dataPoints: HeatmapDataPoint[]): HeatmapAnalysis['insights'] {
  const sortedElements = [...elements].sort((a, b) => b.metrics.totalClicks - a.metrics.totalClicks);
  
  const hotspots = sortedElements
    .filter(el => el.heatIntensity === 'hot' || el.heatIntensity === 'burning')
    .slice(0, 3)
    .map(el => `${el.text} (${el.metrics.totalClicks} clicks)`);

  const coldspots = sortedElements
    .filter(el => el.heatIntensity === 'cold' || el.heatIntensity === 'cool')
    .slice(-3)
    .map(el => `${el.text} needs attention`);

  const recommendations = [];
  
  if (hotspots.length > 0) {
    recommendations.push(`Optimize high-performing elements: ${hotspots[0]}`);
  }
  
  if (coldspots.length > 0) {
    recommendations.push(`Improve visibility of under-performing elements`);
  }
  
  const mobileDataPoints = dataPoints.filter(dp => dp.device === 'mobile').length;
  const totalDataPoints = dataPoints.length;
  
  if (mobileDataPoints > totalDataPoints * 0.6) {
    recommendations.push('Consider mobile-first design optimization');
  }
  
  recommendations.push('A/B test element positions for better engagement');

  return {
    hotspots,
    coldspots,
    recommendations
  };
}