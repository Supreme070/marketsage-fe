/**
 * LeadPulse Demo Data Provider
 * 
 * Provides consistent, presentation-ready demo data for marketing showcases.
 * This is separate from the technical simulation and works independently.
 */

import type { 
  VisitorLocation, 
  VisitorJourney, 
  InsightItem, 
  VisitorSegment,
  PulseDataPoint,
  Touchpoint 
} from './dataProvider';

// Demo mode configuration
export interface DemoConfig {
  mode: 'demo' | 'production' | 'fallback';
  scenario: 'standard' | 'busy_day' | 'quiet_day' | 'conversion_event';
  persistData: boolean;
}

// Consistent demo visitor data for marketing presentations
const DEMO_VISITORS: VisitorLocation[] = [
  {
    id: 'demo-visitor-1',
    city: 'Lagos',
    country: 'Nigeria',
    latitude: 6.5244,
    longitude: 3.3792,
    isActive: true,
    lastActive: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    visitCount: 3,
    fingerprint: 'demo-fp-lagos-001',
    device: 'Desktop',
    browser: 'Chrome',
    location: 'Lagos, Nigeria',
    engagementScore: 85
  },
  {
    id: 'demo-visitor-2', 
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
    isActive: true,
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    visitCount: 1,
    fingerprint: 'demo-fp-nairobi-001',
    device: 'Mobile',
    browser: 'Safari',
    location: 'Nairobi, Kenya',
    engagementScore: 72
  },
  {
    id: 'demo-visitor-3',
    city: 'Cape Town',
    country: 'South Africa', 
    latitude: -33.9249,
    longitude: 18.4241,
    isActive: true,
    lastActive: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
    visitCount: 5,
    fingerprint: 'demo-fp-capetown-001',
    device: 'Desktop',
    browser: 'Firefox',
    location: 'Cape Town, South Africa',
    engagementScore: 93
  },
  {
    id: 'demo-visitor-4',
    city: 'Accra',
    country: 'Ghana',
    latitude: 5.6037,
    longitude: -0.1870,
    isActive: true,
    lastActive: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
    visitCount: 2,
    fingerprint: 'demo-fp-accra-001',
    device: 'Mobile',
    browser: 'Chrome',
    location: 'Accra, Ghana',
    engagementScore: 68
  },
  {
    id: 'demo-visitor-5',
    city: 'Cairo',
    country: 'Egypt',
    latitude: 30.0444,
    longitude: 31.2357,
    isActive: true,
    lastActive: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 minutes ago
    visitCount: 1,
    fingerprint: 'demo-fp-cairo-001',
    device: 'Desktop',
    browser: 'Edge',
    location: 'Cairo, Egypt',
    engagementScore: 79
  },
  {
    id: 'demo-visitor-6',
    city: 'Johannesburg',
    country: 'South Africa',
    latitude: -26.2041,
    longitude: 28.0473,
    isActive: true,
    lastActive: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 minutes ago
    visitCount: 8,
    fingerprint: 'demo-fp-joburg-001',
    device: 'Tablet',
    browser: 'Safari',
    location: 'Johannesburg, South Africa',
    engagementScore: 91
  },
  {
    id: 'demo-visitor-7',
    city: 'Abuja',
    country: 'Nigeria',
    latitude: 9.0765,
    longitude: 7.3986,
    isActive: true,
    lastActive: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
    visitCount: 3,
    fingerprint: 'demo-fp-abuja-001',
    device: 'Mobile',
    browser: 'Chrome',
    location: 'Abuja, Nigeria',
    engagementScore: 76
  },
  {
    id: 'demo-visitor-8',
    city: 'Kigali',
    country: 'Rwanda',
    latitude: -1.9441,
    longitude: 30.0619,
    isActive: true,
    lastActive: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
    visitCount: 2,
    fingerprint: 'demo-fp-kigali-001',
    device: 'Desktop',
    browser: 'Chrome',
    location: 'Kigali, Rwanda',
    engagementScore: 83
  },
  {
    id: 'demo-visitor-9',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    latitude: -6.7924,
    longitude: 39.2083,
    isActive: true,
    lastActive: new Date(Date.now() - 9 * 60 * 1000).toISOString(), // 9 minutes ago
    visitCount: 1,
    fingerprint: 'demo-fp-dar-001',
    device: 'Mobile',
    browser: 'Opera',
    location: 'Dar es Salaam, Tanzania',
    engagementScore: 64
  },
  {
    id: 'demo-visitor-10',
    city: 'Lusaka',
    country: 'Zambia',
    latitude: -15.3875,
    longitude: 28.3228,
    isActive: true,
    lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    visitCount: 4,
    fingerprint: 'demo-fp-lusaka-001',
    device: 'Desktop',
    browser: 'Firefox',
    location: 'Lusaka, Zambia',
    engagementScore: 87
  }
];

// Demo scenario configurations
const DEMO_SCENARIOS = {
  standard: {
    activeVisitors: 10,
    conversionRate: 3.2,
    averageSessionTime: 245,
    bounceRate: 42
  },
  busy_day: {
    activeVisitors: 25,
    conversionRate: 4.8,
    averageSessionTime: 312,
    bounceRate: 35
  },
  quiet_day: {
    activeVisitors: 3,
    conversionRate: 2.1,
    averageSessionTime: 189,
    bounceRate: 58
  },
  conversion_event: {
    activeVisitors: 15,
    conversionRate: 8.7,
    averageSessionTime: 423,
    bounceRate: 28
  }
};

// Global demo configuration
let demoConfig: DemoConfig = {
  mode: 'fallback',
  scenario: 'standard',
  persistData: true
};

/**
 * Set demo configuration
 */
export function setDemoConfig(config: Partial<DemoConfig>) {
  demoConfig = { ...demoConfig, ...config };
  
  // Store in localStorage for persistence if enabled
  if (config.persistData && typeof window !== 'undefined') {
    localStorage.setItem('leadpulse-demo-config', JSON.stringify(demoConfig));
  }
}

/**
 * Get current demo configuration
 */
export function getDemoConfig(): DemoConfig {
  // Load from localStorage if available
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('leadpulse-demo-config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored demo config');
      }
    }
  }
  
  return demoConfig;
}

/**
 * Get consistent demo visitor locations
 */
export function getDemoVisitorLocations(timeRange = '24h'): VisitorLocation[] {
  const config = getDemoConfig();
  const scenario = DEMO_SCENARIOS[config.scenario];
  
  // Return subset based on scenario
  const visitorCount = Math.min(scenario.activeVisitors, DEMO_VISITORS.length);
  return DEMO_VISITORS.slice(0, visitorCount).map(visitor => ({
    ...visitor,
    // Update timestamps to be recent
    lastActive: new Date(Date.now() - Math.random() * 10 * 60 * 1000).toISOString()
  }));
}

/**
 * Get demo analytics overview
 */
export function getDemoAnalyticsOverview() {
  const config = getDemoConfig();
  const scenario = DEMO_SCENARIOS[config.scenario];
  
  return {
    totalVisitors: scenario.activeVisitors * 24, // Extrapolate daily total
    activeVisitors: scenario.activeVisitors,
    conversionRate: scenario.conversionRate,
    averageSessionTime: scenario.averageSessionTime,
    bounceRate: scenario.bounceRate,
    pageViews: scenario.activeVisitors * 3.2,
    timeRange: '24h',
    isDemo: true
  };
}

/**
 * Get demo visitor journeys with consistent touchpoints
 */
export function getDemoVisitorJourneys(): VisitorJourney[] {
  return DEMO_VISITORS.slice(0, 5).map((visitor, index) => {
    const baseTime = Date.now() - (index + 1) * 5 * 60 * 1000;
    
    return {
      id: `demo-journey-${visitor.id}`,
      visitorId: visitor.id,
      fingerprint: visitor.fingerprint!,
      location: visitor.location,
      device: visitor.device,
      browser: visitor.browser,
      engagementScore: visitor.engagementScore!,
      lastActive: visitor.lastActive,
      pulseData: generateDemoPulseData(baseTime, visitor.engagementScore!)
    };
  });
}

/**
 * Generate consistent pulse data for a visitor
 */
function generateDemoPulseData(baseTime: number, engagementScore: number): PulseDataPoint[] {
  const pulseData: PulseDataPoint[] = [];
  const actionCount = Math.floor(engagementScore / 20) + 2; // 2-6 actions based on engagement
  
  for (let i = 0; i < actionCount; i++) {
    const timestamp = new Date(baseTime + i * 2 * 60 * 1000).toISOString(); // 2 min intervals
    
    pulseData.push({
      timestamp,
      value: Math.random() * 100,
      type: i === 0 ? 'PAGEVIEW' : (i === actionCount - 1 ? 'CONVERSION' : 'CLICK'),
      url: i === 0 ? '/dashboard' : `/page-${i}`,
      title: i === 0 ? 'MarketSage Dashboard' : `Page ${i}`
    });
  }
  
  return pulseData;
}

/**
 * Get demo insights
 */
export function getDemoInsights(): InsightItem[] {
  return [
    {
      id: 'demo-insight-1',
      type: 'BEHAVIOR',
      title: 'African Market Engagement Rising',
      description: 'Visitors from African markets show 23% higher engagement than global average',
      importance: 'HIGH',
      metric: {
        label: 'Engagement Increase',
        value: 23,
        format: 'percentage',
        change: 8
      },
      recommendation: 'Consider targeting more African markets with localized content',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-insight-2',
      type: 'PREDICTION',
      title: 'High-Value Visitor Detected',
      description: 'Visitor from Cape Town shows 89% conversion probability',
      importance: 'HIGH',
      metric: {
        label: 'Conversion Probability',
        value: 89,
        format: 'percentage'
      },
      recommendation: 'Engage immediately with personalized offer',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-insight-3',
      type: 'OPPORTUNITY',
      title: 'Mobile Optimization Opportunity',
      description: 'Mobile visitors from Nigeria have 15% lower conversion rate',
      importance: 'MEDIUM',
      metric: {
        label: 'Mobile Conversion Gap',
        value: 15,
        format: 'percentage'
      },
      recommendation: 'Optimize mobile checkout flow for Nigerian users',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ];
}

/**
 * Check if we should use demo data
 */
export function shouldUseDemoData(): boolean {
  const config = getDemoConfig();
  return config.mode === 'demo' || config.mode === 'fallback';
}

/**
 * Toggle demo mode
 */
export function toggleDemoMode(): void {
  const config = getDemoConfig();
  const newMode = config.mode === 'demo' ? 'production' : 'demo';
  setDemoConfig({ mode: newMode });
}

export default {
  getDemoVisitorLocations,
  getDemoAnalyticsOverview,
  getDemoVisitorJourneys,
  getDemoInsights,
  setDemoConfig,
  getDemoConfig,
  shouldUseDemoData,
  toggleDemoMode
};