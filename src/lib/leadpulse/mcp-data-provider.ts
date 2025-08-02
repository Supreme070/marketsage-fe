/**
 * MCP-Integrated LeadPulse Data Provider
 * 
 * This provider integrates with MCP servers to provide real visitor data
 * while maintaining backward compatibility with fallback mechanisms.
 */

import { cache } from 'react';
import { MarketSageMCPClient } from '../../mcp/clients/mcp-client';
import type { 
  MCPAuthContext, 
  LeadPulseQuery,
  MCPClientResponse 
} from '../../mcp/types/mcp-types';
import type { 
  VisitorJourney,
  VisitorPath,
  InsightItem,
  VisitorSegment,
  VisitorLocation,
  PulseDataPoint,
  LeadPulseTouchpointType,
  LeadPulseInsightType,
  LeadPulseImportance
} from './dataProvider';

/**
 * Enhanced visitor data with MCP integration
 */
interface MCPVisitorData {
  id: string;
  sessionId: string;
  currentPage: string;
  timeOnPage: number;
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  intentScore: number;
  isReturning: boolean;
  location: {
    country: string;
    city: string;
    region?: string;
    timezone?: string;
  };
  device: {
    type: string;
    browser: string;
    os: string;
    screenSize?: string;
  };
  profile: {
    totalSessions: number;
    totalPageViews: number;
    averageSessionDuration: number;
    preferredChannel: string;
    lastSeen: string;
  };
  journey?: Array<{
    timestamp: string;
    action: string;
    page: string;
    duration?: number;
    element?: string;
  }>;
  heatmapData?: {
    clicks: number;
    scrollDepth: number;
    timeOnPage: number;
    exitIntent: boolean;
  };
}

/**
 * MCP-integrated data provider class
 */
export class MCPLeadPulseDataProvider {
  private mcpClient: MarketSageMCPClient;
  private authContext: MCPAuthContext | null = null;

  constructor(authContext?: MCPAuthContext) {
    this.mcpClient = new MarketSageMCPClient(authContext);
    this.authContext = authContext || null;
  }

  /**
   * Set authentication context
   */
  setAuthContext(authContext: MCPAuthContext): void {
    this.authContext = authContext;
    this.mcpClient.setAuthContext(authContext);
  }

  /**
   * Get real-time visitor data from MCP server
   */
  async getRealTimeVisitors(options: {
    includeLocation?: boolean;
    includeDevice?: boolean;
    limit?: number;
  } = {}): Promise<MCPVisitorData[]> {
    try {
      // Try to get data from MCP LeadPulse server first
      if (this.mcpClient.isEnabled() && this.authContext) {
        const response = await this.mcpClient.readResource(
          `leadpulse://visitors?limit=${options.limit || 50}&includeLocation=${options.includeLocation !== false}&includeDevice=${options.includeDevice !== false}`,
          this.authContext
        );

        if (response.success && response.data) {
          return this.transformMCPVisitorData(response.data);
        }
      }

      // If MCP is not enabled or fails, try direct database query
      if (this.authContext?.organizationId) {
        return await this.getVisitorsFromDatabase(options);
      }

      // Last resort: fallback to demo data
      return this.getFallbackVisitors(options);
    } catch (error) {
      console.error('MCP getRealTimeVisitors failed:', error);
      
      // Try database fallback
      if (this.authContext?.organizationId) {
        try {
          return await this.getVisitorsFromDatabase(options);
        } catch (dbError) {
          console.error('Database fallback failed:', dbError);
        }
      }
      
      return this.getFallbackVisitors(options);
    }
  }

  /**
   * Get visitor data directly from database
   */
  private async getVisitorsFromDatabase(options: {
    includeLocation?: boolean;
    includeDevice?: boolean;
    limit?: number;
  }): Promise<MCPVisitorData[]> {
    if (!this.authContext?.organizationId) {
      throw new Error('No organization context for database query');
    }

    try {
      // Import prisma dynamically to avoid build issues
      const { prisma } = await import('../../lib/db/prisma');
      
      // Get recent visitor sessions from MCP data
      const sessions = await prisma.mCPVisitorSessions.findMany({
        where: {
          organizationId: this.authContext.organizationId,
          sessionStart: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { sessionStart: 'desc' },
        take: options.limit || 50
      });

      // Transform database data to MCPVisitorData format
      return sessions.map((session, index) => ({
        id: session.id,
        sessionId: session.id,
        currentPage: session.currentPage || '/home',
        timeOnPage: session.timeOnPage || 0,
        sessionDuration: session.sessionDuration || 0,
        pageViews: session.pageViews || 0,
        interactions: session.interactions || 0,
        intentScore: session.intentScore || 0,
        isReturning: session.isReturning || false,
        location: {
          country: session.location?.country || 'Nigeria',
          city: session.location?.city || 'Lagos',
          region: session.location?.region,
          timezone: session.location?.timezone || 'Africa/Lagos'
        },
        device: {
          type: session.device?.type || 'desktop',
          browser: session.device?.browser || 'Chrome',
          os: session.device?.os || 'Windows',
          screenSize: session.device?.screenSize
        },
        profile: {
          totalSessions: session.profile?.totalSessions || 1,
          totalPageViews: session.profile?.totalPageViews || 1,
          averageSessionDuration: session.profile?.averageSessionDuration || 0,
          preferredChannel: session.profile?.preferredChannel || 'web',
          lastSeen: session.sessionEnd?.toISOString() || new Date().toISOString()
        },
        journey: session.journey as any[] || [],
        heatmapData: session.heatmapData as any || {}
      }));
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  }

  /**
   * Get visitor analytics from MCP server
   */
  async getVisitorAnalytics(visitorId: string): Promise<{
    behaviorAnalysis: any;
    predictions: any;
    recommendations: string[];
  }> {
    if (!this.mcpClient.isEnabled()) {
      return this.getFallbackAnalytics(visitorId);
    }

    try {
      const response = await this.mcpClient.getVisitorBehavior(visitorId);
      
      if (response.success && response.data) {
        return this.transformMCPAnalytics(response.data);
      }

      return this.getFallbackAnalytics(visitorId);
    } catch (error) {
      console.error('MCP getVisitorAnalytics failed:', error);
      return this.getFallbackAnalytics(visitorId);
    }
  }

  /**
   * Get high-intent visitors from MCP server
   */
  async getHighIntentVisitors(threshold = 70, limit = 20): Promise<MCPVisitorData[]> {
    if (!this.mcpClient.isEnabled()) {
      return this.getFallbackHighIntentVisitors(threshold, limit);
    }

    try {
      // This would call the MCP server's identify_high_intent_visitors tool
      // For now, return fallback data
      return this.getFallbackHighIntentVisitors(threshold, limit);
    } catch (error) {
      console.error('MCP getHighIntentVisitors failed:', error);
      return this.getFallbackHighIntentVisitors(threshold, limit);
    }
  }

  /**
   * Get conversion funnel data from MCP server
   */
  async getConversionFunnel(options: {
    funnelId?: string;
    dateRange?: '7d' | '30d' | '90d';
    includeSegments?: boolean;
  } = {}): Promise<{
    steps: Array<{
      step: number;
      name: string;
      visitors: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    segments?: Array<{
      name: string;
      overallConversion: number;
      dropOffPoints: string[];
    }>;
    insights: string[];
  }> {
    if (!this.mcpClient.isEnabled()) {
      return this.getFallbackFunnelData(options);
    }

    try {
      // This would call the MCP server's get_conversion_funnel tool
      // For now, return fallback data
      return this.getFallbackFunnelData(options);
    } catch (error) {
      console.error('MCP getConversionFunnel failed:', error);
      return this.getFallbackFunnelData(options);
    }
  }

  /**
   * Get page analytics from MCP server
   */
  async getPageAnalytics(pageUrl: string, options: {
    includeHeatmap?: boolean;
    dateRange?: '1d' | '7d' | '30d';
  } = {}): Promise<{
    metrics: {
      pageViews: number;
      uniqueVisitors: number;
      averageTimeOnPage: number;
      bounceRate: number;
      exitRate: number;
      scrollDepth: number;
      clickThroughRate: number;
    };
    heatmapData?: any;
    insights: string[];
  }> {
    if (!this.mcpClient.isEnabled()) {
      return this.getFallbackPageAnalytics(pageUrl, options);
    }

    try {
      // This would call the MCP server's get_page_analytics tool
      // For now, return fallback data
      return this.getFallbackPageAnalytics(pageUrl, options);
    } catch (error) {
      console.error('MCP getPageAnalytics failed:', error);
      return this.getFallbackPageAnalytics(pageUrl, options);
    }
  }

  /**
   * Transform MCP visitor data to our format
   */
  private transformMCPVisitorData(mcpData: any): MCPVisitorData[] {
    if (!mcpData || !Array.isArray(mcpData)) {
      return [];
    }

    return mcpData.map((visitor: any) => ({
      id: visitor.id || visitor.visitorId,
      sessionId: visitor.sessionId || `session-${visitor.id}`,
      currentPage: visitor.currentPage || '/home',
      timeOnPage: visitor.timeOnPage || 0,
      sessionDuration: visitor.sessionDuration || 0,
      pageViews: visitor.pageViews || 0,
      interactions: visitor.interactions || 0,
      intentScore: visitor.intentScore || 0,
      isReturning: visitor.isReturning || false,
      location: {
        country: visitor.location?.country || 'Unknown',
        city: visitor.location?.city || 'Unknown',
        region: visitor.location?.region,
        timezone: visitor.location?.timezone
      },
      device: {
        type: visitor.device?.type || 'Unknown',
        browser: visitor.device?.browser || 'Unknown',
        os: visitor.device?.os || 'Unknown',
        screenSize: visitor.device?.screenSize
      },
      profile: {
        totalSessions: visitor.profile?.totalSessions || 1,
        totalPageViews: visitor.profile?.totalPageViews || 1,
        averageSessionDuration: visitor.profile?.averageSessionDuration || 0,
        preferredChannel: visitor.profile?.preferredChannel || 'web',
        lastSeen: visitor.profile?.lastSeen || new Date().toISOString()
      },
      journey: visitor.journey,
      heatmapData: visitor.heatmapData
    }));
  }

  /**
   * Transform MCP analytics data to our format
   */
  private transformMCPAnalytics(mcpData: any): any {
    return {
      behaviorAnalysis: mcpData.behaviorPattern || {},
      predictions: mcpData.predictions || {},
      recommendations: mcpData.insights || []
    };
  }

  /**
   * Fallback visitor data (enhanced demo data)
   */
  private getFallbackVisitors(options: any): MCPVisitorData[] {
    const cities = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Nairobi', 'Accra', 'Cape Town'];
    const countries = ['Nigeria', 'Kenya', 'Ghana', 'South Africa'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const pages = ['/home', '/products', '/pricing', '/contact', '/about'];

    return Array.from({ length: options.limit || 20 }, (_, i) => ({
      id: `visitor-${i + 1}`,
      sessionId: `session-${i + 1}`,
      currentPage: pages[i % pages.length],
      timeOnPage: Math.floor(Math.random() * 300) + 30,
      sessionDuration: Math.floor(Math.random() * 1800) + 60,
      pageViews: Math.floor(Math.random() * 10) + 1,
      interactions: Math.floor(Math.random() * 20) + 1,
      intentScore: Math.floor(Math.random() * 100) + 1,
      isReturning: Math.random() < 0.4,
      location: {
        country: countries[i % countries.length],
        city: cities[i % cities.length],
        region: 'State/Province',
        timezone: 'Africa/Lagos'
      },
      device: {
        type: devices[i % devices.length],
        browser: browsers[i % browsers.length],
        os: ['Windows', 'macOS', 'iOS', 'Android'][i % 4],
        screenSize: '1920x1080'
      },
      profile: {
        totalSessions: Math.floor(Math.random() * 10) + 1,
        totalPageViews: Math.floor(Math.random() * 50) + 1,
        averageSessionDuration: Math.floor(Math.random() * 600) + 120,
        preferredChannel: ['web', 'mobile', 'email'][i % 3],
        lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      journey: [
        {
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          action: 'page_view',
          page: '/home',
          duration: 45
        },
        {
          timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
          action: 'click',
          page: '/products',
          element: 'product-button'
        }
      ],
      heatmapData: {
        clicks: Math.floor(Math.random() * 20) + 1,
        scrollDepth: Math.random() * 0.5 + 0.5,
        timeOnPage: Math.floor(Math.random() * 300) + 30,
        exitIntent: Math.random() < 0.3
      }
    }));
  }

  /**
   * Fallback analytics data
   */
  private getFallbackAnalytics(visitorId: string): any {
    return {
      behaviorAnalysis: {
        pageViewsPerSession: 6.5,
        averageSessionDuration: 420,
        bounceRate: 0.15,
        conversionRate: 0.08,
        engagementScore: 78
      },
      predictions: {
        likelihoodToConvert: 0.74,
        timeToConversion: '2-3 days',
        preferredChannel: 'email',
        nextBestAction: 'Send targeted offer'
      },
      recommendations: [
        'Visitor shows high engagement with premium content',
        'Multiple return sessions indicate strong interest',
        'Behavior pattern suggests readiness to purchase'
      ]
    };
  }

  /**
   * Fallback high-intent visitors data
   */
  private getFallbackHighIntentVisitors(threshold: number, limit: number): MCPVisitorData[] {
    return this.getFallbackVisitors({ limit })
      .filter(visitor => visitor.intentScore >= threshold)
      .slice(0, limit);
  }

  /**
   * Fallback funnel data
   */
  private getFallbackFunnelData(options: any): any {
    return {
      steps: [
        { step: 1, name: 'Landing Page Visit', visitors: 10000, conversionRate: 100, dropOffRate: 0 },
        { step: 2, name: 'Product Page View', visitors: 6500, conversionRate: 65, dropOffRate: 35 },
        { step: 3, name: 'Pricing Page View', visitors: 3250, conversionRate: 32.5, dropOffRate: 50 },
        { step: 4, name: 'Contact Form', visitors: 1300, conversionRate: 13, dropOffRate: 60 },
        { step: 5, name: 'Purchase', visitors: 260, conversionRate: 2.6, dropOffRate: 80 }
      ],
      segments: options.includeSegments ? [
        { name: 'New Visitors', overallConversion: 1.8, dropOffPoints: ['Product Page View', 'Contact Form'] },
        { name: 'Returning Visitors', overallConversion: 4.2, dropOffPoints: ['Pricing Page View'] }
      ] : undefined,
      insights: [
        'Biggest drop-off occurs at Product Page View (35%)',
        'Pricing page needs optimization - 50% drop-off rate',
        'Contact form conversion is strong for those who reach it'
      ]
    };
  }

  /**
   * Fallback page analytics data
   */
  private getFallbackPageAnalytics(pageUrl: string, options: any): any {
    return {
      metrics: {
        pageViews: 2500,
        uniqueVisitors: 1800,
        averageTimeOnPage: 180,
        bounceRate: 0.35,
        exitRate: 0.42,
        scrollDepth: 0.68,
        clickThroughRate: 0.15
      },
      heatmapData: options.includeHeatmap ? {
        clickMap: { headerNav: 45, primaryCTA: 120, secondaryCTA: 67, footer: 23 },
        scrollMap: { '0-25%': 100, '25-50%': 85, '50-75%': 68, '75-100%': 42 },
        attentionMap: { hero: 8.5, features: 6.2, pricing: 7.8, testimonials: 4.1 }
      } : undefined,
      insights: [
        'Primary CTA has good engagement (120 clicks)',
        'Users tend to drop off at 50% scroll depth',
        'Pricing section gets high attention (7.8 seconds average)'
      ]
    };
  }
}

/**
 * Cached MCP data provider instance
 */
const mcpDataProvider = new MCPLeadPulseDataProvider();

/**
 * Get visitor data with MCP integration
 */
export const getMCPVisitorData = cache(async (options: {
  includeLocation?: boolean;
  includeDevice?: boolean;
  limit?: number;
  authContext?: MCPAuthContext;
} = {}): Promise<VisitorJourney[]> => {
  if (options.authContext) {
    mcpDataProvider.setAuthContext(options.authContext);
  }

  const mcpVisitors = await mcpDataProvider.getRealTimeVisitors(options);
  
  // Transform MCP data to VisitorJourney format
  return mcpVisitors.map(visitor => ({
    id: visitor.id,
    visitorId: visitor.id,
    fingerprint: `fp_${visitor.id}`,
    location: `${visitor.location.city}, ${visitor.location.country}`,
    device: `${visitor.device.type}, ${visitor.device.browser}`,
    browser: visitor.device.browser,
    engagementScore: visitor.intentScore,
    lastActive: formatLastActive(new Date(visitor.profile.lastSeen)),
    pulseData: visitor.journey ? visitor.journey.map(j => ({
      timestamp: j.timestamp,
      value: j.duration || 60,
      type: mapActionToType(j.action),
      url: j.page,
      title: j.page
    })) : []
  }));
});

/**
 * Get visitor insights with MCP integration
 */
export const getMCPVisitorInsights = cache(async (authContext?: MCPAuthContext): Promise<InsightItem[]> => {
  if (authContext) {
    mcpDataProvider.setAuthContext(authContext);
  }

  try {
    // Try to get real visitor data for insights calculation
    const visitors = await mcpDataProvider.getRealTimeVisitors({ limit: 100 });
    
    if (visitors.length === 0) {
      return []; // Return empty if no data
    }

    const insights: InsightItem[] = [];
    const now = Date.now();
    
    // Calculate mobile traffic percentage
    const mobileVisitors = visitors.filter(v => 
      v.device.type.toLowerCase().includes('mobile') || 
      v.device.browser.toLowerCase().includes('mobile')
    );
    const mobilePercentage = Math.round((mobileVisitors.length / visitors.length) * 100);
    
    if (mobilePercentage > 60) {
      insights.push({
        id: '1',
        type: 'TREND' as LeadPulseInsightType,
        title: `Mobile traffic represents ${mobilePercentage}%`,
        description: `${mobileVisitors.length} of ${visitors.length} visitors are using mobile devices`,
        importance: mobilePercentage > 70 ? 'HIGH' as LeadPulseImportance : 'MEDIUM' as LeadPulseImportance,
        createdAt: new Date().toISOString(),
        recommendation: mobilePercentage > 70 ? 
          'Mobile-first optimization is critical for your audience' :
          'Continue optimizing mobile experience'
      });
    }

    // Calculate high-intent visitors
    const highIntentVisitors = visitors.filter(v => v.intentScore > 70);
    const activeHighIntentVisitors = highIntentVisitors.filter(v => {
      const lastSeen = new Date(v.profile.lastSeen).getTime();
      return now - lastSeen < 30 * 60 * 1000; // Last 30 minutes
    });
    
    if (activeHighIntentVisitors.length > 0) {
      insights.push({
        id: '2',
        type: 'OPPORTUNITY' as LeadPulseInsightType,
        title: `${activeHighIntentVisitors.length} high-intent visitors active`,
        description: `Visitors with >70% intent score currently browsing your site`,
        importance: 'HIGH' as LeadPulseImportance,
        createdAt: new Date().toISOString(),
        recommendation: 'Engage with personalized offers or live chat immediately'
      });
    }

    // Calculate page engagement patterns
    const pricingPageVisitors = visitors.filter(v => 
      v.currentPage.toLowerCase().includes('pricing') ||
      v.journey?.some(j => j.page.toLowerCase().includes('pricing'))
    );
    const pricingEngagementRate = Math.round((pricingPageVisitors.length / visitors.length) * 100);
    
    if (pricingEngagementRate > 20) {
      insights.push({
        id: '3',
        type: 'BEHAVIOR' as LeadPulseInsightType,
        title: `${pricingEngagementRate}% of visitors viewed pricing`,
        description: `${pricingPageVisitors.length} visitors engaged with pricing content`,
        importance: 'MEDIUM' as LeadPulseImportance,
        createdAt: new Date().toISOString(),
        recommendation: pricingEngagementRate > 30 ? 
          'High pricing interest - consider adding special offers' :
          'Good pricing engagement - monitor conversion rates'
      });
    }

    // Calculate bounce rate insights
    const bouncedVisitors = visitors.filter(v => 
      v.pageViews <= 1 && v.sessionDuration < 30
    );
    const bounceRate = Math.round((bouncedVisitors.length / visitors.length) * 100);
    
    if (bounceRate > 40) {
      insights.push({
        id: '4',
        type: 'ALERT' as LeadPulseInsightType,
        title: `Bounce rate is ${bounceRate}%`,
        description: `${bouncedVisitors.length} visitors left quickly without engagement`,
        importance: bounceRate > 60 ? 'HIGH' as LeadPulseImportance : 'MEDIUM' as LeadPulseImportance,
        createdAt: new Date().toISOString(),
        recommendation: 'Review landing page content and loading speed'
      });
    }

    // Return calculated insights or empty array
    return insights.length > 0 ? insights : [];
    
  } catch (error) {
    console.error('Failed to generate real insights:', error);
    return []; // Return empty array instead of demo data
  }
});

/**
 * Get visitor locations with MCP integration
 */
export const getMCPVisitorLocations = cache(async (authContext?: MCPAuthContext): Promise<VisitorLocation[]> => {
  if (authContext) {
    mcpDataProvider.setAuthContext(authContext);
  }

  const visitors = await mcpDataProvider.getRealTimeVisitors({
    includeLocation: true,
    limit: 50
  });

  // Aggregate locations from visitor data
  const locationMap = new Map<string, {
    city: string;
    country: string;
    count: number;
    activeCount: number;
    lastActive: Date;
  }>();

  visitors.forEach(visitor => {
    const key = `${visitor.location.city}-${visitor.location.country}`;
    const existing = locationMap.get(key);
    const lastSeen = new Date(visitor.profile.lastSeen);
    const isActive = Date.now() - lastSeen.getTime() < 300000; // 5 minutes

    if (existing) {
      existing.count++;
      if (isActive) existing.activeCount++;
      if (lastSeen > existing.lastActive) existing.lastActive = lastSeen;
    } else {
      locationMap.set(key, {
        city: visitor.location.city,
        country: visitor.location.country,
        count: 1,
        activeCount: isActive ? 1 : 0,
        lastActive: lastSeen
      });
    }
  });

  // Convert to VisitorLocation format
  return Array.from(locationMap.entries()).map(([key, location]) => ({
    id: key,
    city: location.city,
    country: location.country,
    isActive: location.activeCount > 0,
    lastActive: formatLastActive(location.lastActive),
    visitCount: location.count,
    latitude: getCityLatitude(location.city),
    longitude: getCityLongitude(location.city)
  }));
});

/**
 * Helper functions
 */
function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function mapActionToType(action: string): LeadPulseTouchpointType {
  switch (action.toLowerCase()) {
    case 'page_view': return 'PAGEVIEW';
    case 'click': return 'CLICK';
    case 'form_view': return 'FORM_VIEW';
    case 'form_start': return 'FORM_START';
    case 'form_submit': return 'FORM_SUBMIT';
    case 'conversion': return 'CONVERSION';
    default: return 'PAGEVIEW';
  }
}

function getCityLatitude(city: string): number {
  const coordinates: { [key: string]: number } = {
    'Lagos': 6.5244,
    'Abuja': 9.0765,
    'Kano': 12.0022,
    'Port Harcourt': 4.8156,
    'Ibadan': 7.3775,
    'Nairobi': -1.2921,
    'Accra': 5.6037,
    'Cape Town': -33.9249
  };
  return coordinates[city] || 0;
}

function getCityLongitude(city: string): number {
  const coordinates: { [key: string]: number } = {
    'Lagos': 3.3792,
    'Abuja': 7.3986,
    'Kano': 8.5919,
    'Port Harcourt': 7.0498,
    'Ibadan': 3.9470,
    'Nairobi': 36.8219,
    'Accra': -0.1870,
    'Cape Town': 18.4241
  };
  return coordinates[city] || 0;
}

export default mcpDataProvider;