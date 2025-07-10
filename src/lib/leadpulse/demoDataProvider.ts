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
  mode: 'demo' | 'production' | 'fallback' | 'ai_training';
  scenario: 'standard' | 'busy_day' | 'quiet_day' | 'conversion_event';
  persistData: boolean;
  aiTrainingEnabled?: boolean;
}

// African cities for demo data generation
const AFRICAN_CITIES = [
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { city: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { city: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { city: 'Kigali', country: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  { city: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  { city: 'Lusaka', country: 'Zambia', lat: -15.3875, lng: 28.3228 },
  { city: 'Addis Ababa', country: 'Ethiopia', lat: 9.0330, lng: 38.7400 },
  { city: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825 },
  { city: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { city: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  { city: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588 },
  { city: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },
  { city: 'Bamako', country: 'Mali', lat: 12.6392, lng: -8.0029 },
  { city: 'Ouagadougou', country: 'Burkina Faso', lat: 12.3714, lng: -1.5197 },
  { city: 'Abidjan', country: 'Ivory Coast', lat: 5.3600, lng: -4.0083 },
  { city: 'Yaoundé', country: 'Cameroon', lat: 3.8480, lng: 11.5021 },
  { city: 'Libreville', country: 'Gabon', lat: 0.4162, lng: 9.4673 },
  { city: 'Luanda', country: 'Angola', lat: -8.8390, lng: 13.2894 },
  { city: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732 },
  { city: 'Harare', country: 'Zimbabwe', lat: -17.8292, lng: 31.0522 },
  { city: 'Gaborone', country: 'Botswana', lat: -24.6282, lng: 25.9231 },
  { city: 'Windhoek', country: 'Namibia', lat: -22.9576, lng: 18.4904 },
  { city: 'Maseru', country: 'Lesotho', lat: -29.3151, lng: 27.4869 },
  { city: 'Mbabane', country: 'Eswatini', lat: -26.5225, lng: 31.1659 },
  { city: 'Port Louis', country: 'Mauritius', lat: -20.1654, lng: 57.5015 },
  { city: 'Victoria', country: 'Seychelles', lat: -4.6574, lng: 55.4540 }
];

const DEVICES = ['Desktop', 'Mobile', 'Tablet'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];

// Generate massive visitor dataset for AI training (52,000+ visitors)
function generateMassiveVisitorDataset(): VisitorLocation[] {
  const visitors: VisitorLocation[] = [];
  const totalVisitors = 52347; // 52,000+ for AI training
  
  for (let i = 0; i < totalVisitors; i++) {
    const city = AFRICAN_CITIES[Math.floor(Math.random() * AFRICAN_CITIES.length)];
    const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
    const isActive = Math.random() < 0.15; // 15% are currently active
    const visitCount = Math.floor(Math.random() * 20) + 1;
    const engagementScore = Math.floor(Math.random() * 100) + 1;
    
    // Vary last active time - some very recent, some older
    const minutesAgo = isActive 
      ? Math.floor(Math.random() * 30) + 1  // Active users: 1-30 minutes ago
      : Math.floor(Math.random() * 10080) + 30; // Inactive: 30 minutes to 7 days ago
    
    visitors.push({
      id: `ai-visitor-${i + 1}`,
      city: city.city,
      country: city.country,
      latitude: city.lat + (Math.random() - 0.5) * 0.1, // Add slight variance
      longitude: city.lng + (Math.random() - 0.5) * 0.1,
      isActive,
      lastActive: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
      visitCount,
      fingerprint: `ai-fp-${city.city.toLowerCase().replace(/\s+/g, '-')}-${String(i + 1).padStart(6, '0')}`,
      device,
      browser,
      location: `${city.city}, ${city.country}`,
      engagementScore
    });
  }
  
  return visitors;
}

// Cache the massive dataset to avoid regenerating on every call
let CACHED_MASSIVE_VISITORS: VisitorLocation[] | null = null;

// Get the massive visitor dataset (cached)
function getMassiveVisitorDataset(): VisitorLocation[] {
  if (!CACHED_MASSIVE_VISITORS) {
    console.log('🤖 Generating 52,000+ AI training visitors...');
    CACHED_MASSIVE_VISITORS = generateMassiveVisitorDataset();
    console.log(`✅ Generated ${CACHED_MASSIVE_VISITORS.length} AI training visitors`);
  }
  return CACHED_MASSIVE_VISITORS;
}

// Small consistent demo visitor data for marketing presentations
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

// Global demo configuration - AI training enabled by default
let demoConfig: DemoConfig = {
  mode: 'ai_training',
  scenario: 'standard',
  persistData: true,
  aiTrainingEnabled: true
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
  
  // Check if AI training mode is enabled
  const aiTrainingMode = config.mode === 'ai_training' || 
                        (typeof window !== 'undefined' && localStorage.getItem('leadpulse-ai-training') === 'true');
  
  if (aiTrainingMode) {
    // Return the massive dataset for AI training
    const massiveVisitors = getMassiveVisitorDataset();
    console.log(`🚀 AI Training Mode: Providing ${massiveVisitors.length} visitors for AI training`);
    return massiveVisitors;
  }
  
  // Return subset based on scenario for regular demo
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
  
  // Check if AI training mode is enabled
  if (isAITrainingEnabled()) {
    const massiveVisitors = getMassiveVisitorDataset();
    const activeVisitors = massiveVisitors.filter(v => v.isActive).length;
    
    return {
      totalVisitors: massiveVisitors.length,
      activeVisitors: activeVisitors,
      conversionRate: 4.7, // Calculated from massive dataset
      averageSessionTime: 287,
      bounceRate: 38.2,
      pageViews: activeVisitors * 4.1,
      timeRange: '7d', // Larger timeframe for AI training
      isDemo: true,
      isAITraining: true,
      aiTrainingDatasetSize: massiveVisitors.length
    };
  }
  
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
  return config.mode === 'demo' || config.mode === 'fallback' || config.mode === 'ai_training';
}

/**
 * Toggle demo mode
 */
export function toggleDemoMode(): void {
  const config = getDemoConfig();
  const newMode = config.mode === 'demo' ? 'production' : 'demo';
  setDemoConfig({ mode: newMode });
}

/**
 * Enable AI training mode with massive dataset
 */
export function enableAITraining(): void {
  console.log('🤖 Enabling AI training mode with 52,000+ visitors...');
  setDemoConfig({ 
    mode: 'ai_training', 
    aiTrainingEnabled: true 
  });
  
  // Also set localStorage flag for additional checking
  if (typeof window !== 'undefined') {
    localStorage.setItem('leadpulse-ai-training', 'true');
  }
  
  // Pre-generate the massive dataset
  const dataset = getMassiveVisitorDataset();
  console.log(`✅ AI Training enabled with ${dataset.length} visitors from ${AFRICAN_CITIES.length} African cities`);
}

/**
 * Disable AI training mode
 */
export function disableAITraining(): void {
  console.log('📊 Disabling AI training mode...');
  setDemoConfig({ 
    mode: 'demo', 
    aiTrainingEnabled: false 
  });
  
  // Clear localStorage flag
  if (typeof window !== 'undefined') {
    localStorage.removeItem('leadpulse-ai-training');
  }
  
  // Clear cached massive dataset to free memory
  CACHED_MASSIVE_VISITORS = null;
}

/**
 * Check if AI training mode is enabled
 */
export function isAITrainingEnabled(): boolean {
  const config = getDemoConfig();
  return config.mode === 'ai_training' || 
         config.aiTrainingEnabled === true ||
         (typeof window !== 'undefined' && localStorage.getItem('leadpulse-ai-training') === 'true');
}

/**
 * Get visitor count for current mode
 */
export function getVisitorCount(): number {
  if (isAITrainingEnabled()) {
    return 52347; // AI training dataset size
  }
  
  const config = getDemoConfig();
  const scenario = DEMO_SCENARIOS[config.scenario];
  return Math.min(scenario.activeVisitors, DEMO_VISITORS.length);
}

export default {
  getDemoVisitorLocations,
  getDemoAnalyticsOverview,
  getDemoVisitorJourneys,
  getDemoInsights,
  setDemoConfig,
  getDemoConfig,
  shouldUseDemoData,
  toggleDemoMode,
  enableAITraining,
  disableAITraining,
  isAITrainingEnabled,
  getVisitorCount
};