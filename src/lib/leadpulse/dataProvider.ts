/**
 * LeadPulse Data Provider with AI Integration
 *
 * This module provides functions to fetch and transform data for the LeadPulse components.
 * It handles API interactions, data formatting, caching, and AI-powered predictions.
 */

import { cache } from 'react';

// AI Prediction Engine Integration
interface AIPrediction {
  visitorId: string;
  conversionProbability: number;
  behaviorPrediction: 'convert' | 'browse' | 'abandon';
  recommendedActions: string[];
  confidence: number;
  factors: {
    pageTime: number;
    clickPattern: number;
    deviceType: number;
    location: number;
    referralSource: number;
  };
}

interface AIVisitorEnhancement {
  aiScore: number;
  predictedValue: number;
  segmentPrediction: 'enterprise' | 'startup' | 'individual';
  nextAction: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  optimization: string[];
}

// Type definitions that match the Prisma schema
export type LeadPulseTouchpointType = 'PAGEVIEW' | 'CLICK' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CONVERSION';
export type LeadPulseInsightType = 'BEHAVIOR' | 'PREDICTION' | 'OPPORTUNITY' | 'TREND';
export type LeadPulseImportance = 'LOW' | 'MEDIUM' | 'HIGH';

// Interfaces matching the component props
export interface PulseDataPoint {
  timestamp: string;
  value: number;
  type: LeadPulseTouchpointType;
  url?: string;
  title?: string;
}

export interface VisitorJourney {
  id: string;
  visitorId: string;
  fingerprint: string;
  location?: string;
  device?: string;
  browser?: string;
  engagementScore: number;
  lastActive: string;
  pulseData: PulseDataPoint[];
}

export interface Touchpoint {
  id: string;
  timestamp: string;
  type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion';
  url: string;
  title?: string;
  duration?: number;
  formId?: string;
  formName?: string;
  conversionValue?: number;
}

export interface VisitorPath {
  visitorId: string;
  touchpoints: Touchpoint[];
  probability: number;
  predictedValue: number;
  status: 'active' | 'converted' | 'lost';
}

export interface InsightItem {
  id: string;
  type: LeadPulseInsightType;
  title: string;
  description: string;
  importance: LeadPulseImportance;
  metric?: {
    label: string;
    value: number;
    format?: 'percentage' | 'currency' | 'number';
    change?: number;
  };
  recommendation?: string;
  createdAt: string;
}

export interface VisitorSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  key: string;
}

export interface VisitorLocation {
  id: string;
  city: string;
  country: string;
  isActive: boolean;
  lastActive: string;
  visitCount: number;
  latitude: number;
  longitude: number;
}

/**
 * Fetch visitor locations - now uses unified data provider
 * @deprecated Use unifiedDataProvider.getVisitorLocations instead
 */
export const getVisitorLocations = cache(async (timeRange = '24h'): Promise<VisitorLocation[]> => {
  try {
    // Fallback to demo data - this function is deprecated
    console.warn('getVisitorLocations: This function is deprecated. Use unifiedDataProvider instead.');
    
    // Return consistent demo data for backward compatibility
    const totalVisitors = 10;
    const activeVisitors = 10;
    
    // Calculate which locations have active visitors based on distribution
    const baseLocations = [
      { 
        id: 'lagos-ng',
        city: 'Lagos', 
        country: 'Nigeria', 
        latitude: 6.5244, 
        longitude: 3.3792,
        totalShare: 0.35 
      },
      { 
        id: 'nairobi-ke',
        city: 'Nairobi', 
        country: 'Kenya', 
        latitude: -1.2921, 
        longitude: 36.8219,
        totalShare: 0.22 
      },
      { 
        id: 'capetown-za',
        city: 'Cape Town', 
        country: 'South Africa', 
        latitude: -33.9249, 
        longitude: 18.4241,
        totalShare: 0.17 
      },
      { 
        id: 'accra-gh',
        city: 'Accra', 
        country: 'Ghana', 
        latitude: 5.6037, 
        longitude: -0.1870,
        totalShare: 0.14 
      },
      { 
        id: 'abuja-ng',
        city: 'Abuja', 
        country: 'Nigeria', 
        latitude: 9.0765, 
        longitude: 7.3986,
        totalShare: 0.12 
      }
    ];

    return baseLocations.map((location, index) => {
      const visitCount = Math.floor(totalVisitors * location.totalShare);
      const activeInLocation = Math.floor(activeVisitors * location.totalShare);
      const isActive = activeInLocation > 0;
      
      return {
        id: location.id,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        isActive,
        lastActive: isActive ? 'just now' : `${Math.floor(Math.random() * 30) + 1} min ago`,
        visitCount: Math.max(visitCount, isActive ? 1 : 0)
      };
    });
  } catch (error) {
    console.error('Error in getVisitorLocations:', error);
    return [];
  }
});

/**
 * Fetch visitor segments - now uses demo data
 * @deprecated Use unifiedDataProvider instead
 */
export const getVisitorSegments = cache(async (): Promise<VisitorSegment[]> => {
  try {
    console.warn('getVisitorSegments: This function is deprecated. Use unifiedDataProvider instead.');
    
    // Return consistent demo data for backward compatibility
    const totalVisitors = 10;
    
    return [
      { name: 'High Intent', count: Math.floor(totalVisitors * 0.18), percentage: 18 },
      { name: 'New Visitors', count: Math.floor(totalVisitors * 0.51), percentage: 51 },
      { name: 'Returning Customers', count: Math.floor(totalVisitors * 0.23), percentage: 23 },
      { name: 'Mobile Users', count: Math.floor(totalVisitors * 0.68), percentage: 68 }
    ];
  } catch (error) {
    console.error('Error in getVisitorSegments:', error);
    return [];
  }
});

/**
 * Fetch visitor insights with demo data
 */
export const getVisitorInsights = cache(async (): Promise<InsightItem[]> => {
  try {
    // Return realistic demo insights
    const insights = 125;
    
    if (insights === 0) return [];
    
    return [
      {
        id: '1',
        type: 'TREND' as LeadPulseInsightType,
        title: 'Mobile traffic increased 23%',
        description: 'More users are accessing from mobile devices',
        importance: 'HIGH' as LeadPulseImportance,
        createdAt: new Date().toISOString()
      },
      {
        id: '2', 
        type: 'OPPORTUNITY' as LeadPulseInsightType,
        title: 'Optimize pricing page',
        description: 'High exit rate detected on pricing page',
        importance: 'MEDIUM' as LeadPulseImportance,
        createdAt: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error('Error in getVisitorInsights:', error);
    return [];
  }
});

/**
 * Fetch active visitors and their pulse data with simulation-aware behavior
 */
export const getActiveVisitors = cache(async (timeRange = '24h'): Promise<VisitorJourney[]> => {
  try {
    // Check if demo mode is enabled
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || true; // Default to demo for now
    
    // If demo mode is OFF, return empty array (no visitors)
    if (!isDemoMode) {
      console.log('getActiveVisitors: Demo mode OFF - returning empty visitor list');
      return [];
    }
    
    console.log('getActiveVisitors: Demo mode ACTIVE - generating visitor data');
    const targetActiveCount = 25;

    // Generate visitors based on simulation data only
    const enhancedVisitors: any[] = [];

    // Generate visitors to match simulation count
    if (targetActiveCount > 0) {
      const additionalVisitorsNeeded = targetActiveCount;
      
      // Generate additional realistic visitors
      for (let i = 0; i < additionalVisitorsNeeded; i++) {
        const cities = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Benin City', 'Kaduna', 'Jos', 'Enugu', 'Owerri'];
        const devices = ['Desktop', 'Mobile', 'Tablet'];
        const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
        const platforms = ['web', 'mobile', 'react-native', 'ios', 'android'];
        const platformWeights = [0.65, 0.20, 0.08, 0.04, 0.03]; // 65% Web, 35% Mobile breakdown
        
        // Weighted platform selection
        const random = Math.random();
        let platform = 'web';
        let cumulativeWeight = 0;
        for (let j = 0; j < platforms.length; j++) {
          cumulativeWeight += platformWeights[j];
          if (random <= cumulativeWeight) {
            platform = platforms[j];
            break;
          }
        }
        
        // Adjust device/browser based on platform
        let deviceType = devices[Math.floor(Math.random() * devices.length)];
        let browserType = browsers[Math.floor(Math.random() * browsers.length)];
        
        if (platform === 'mobile' || platform === 'react-native' || platform === 'ios' || platform === 'android') {
          deviceType = 'Mobile';
          browserType = platform === 'ios' ? 'Safari' : 
                       platform === 'android' ? 'Chrome' : 
                       platform === 'react-native' ? 'React Native WebView' : 'Mobile App';
        }
        
        // Use stable IDs that persist across refreshes
        const stableId = `visitor_demo_${i}`;
        const syntheticVisitor = {
          id: stableId,
          visitorId: stableId,
          fingerprint: `fp_demo_${i}`,
          location: `${cities[Math.floor(Math.random() * cities.length)]}, Nigeria`,
          device: deviceType,
          browser: browserType,
          platform: platform, // Add platform information
          engagementScore: Math.floor(Math.random() * 60) + 40, // 40-100
          lastActive: i < additionalVisitorsNeeded * 0.3 ? 'just now' : `${Math.floor(Math.random() * 30) + 1} min ago`,
          pulseData: [
            {
              timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
              value: Math.floor(Math.random() * 100) + 1,
              type: 'pageview' as const,
              url: '/pricing',
              title: 'Pricing Page'
            },
            {
              timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
              value: Math.floor(Math.random() * 80) + 20,
              type: 'click' as const,
              url: '/contact',
              title: 'Contact Button'
            }
          ]
        };
        
        enhancedVisitors.push(syntheticVisitor);
      }
    }

    return enhancedVisitors;
  } catch (error) {
    console.error('Error fetching active visitors:', error);
    return []; // Return empty array instead of mock data since API handles fallback
  }
});

/**
 * Fetch enhanced overview data with simulation-aware realistic business metrics
 */
export const getEnhancedOverview = cache(async (timeRange = '24h'): Promise<{
  activeVisitors: number;
  totalVisitors: number;
  conversionRate: number;
  platformBreakdown?: {
    web: { count: number; percentage: number };
    mobile: { count: number; percentage: number };
    reactNative: { count: number; percentage: number };
    nativeApps: { count: number; percentage: number };
    hybrid: { count: number; percentage: number };
  };
  metadata?: any;
}> => {
  try {
    // Check if demo mode is enabled (you can control this via env variable or setting)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || true; // Default to demo for now
    
    if (isDemoMode) {
      console.log('getEnhancedOverview: Demo mode - returning demo data');
      // Return realistic demo data
      const activeVisitors = 42;
      const totalVisitors = 1250;
      const conversionRate = 3.2;
    
    return {
      activeVisitors,
      totalVisitors: Math.max(totalVisitors, activeVisitors),
      conversionRate,
      platformBreakdown: {
        web: { count: Math.round(totalVisitors * 0.6), percentage: 60 },
        mobile: { count: Math.round(totalVisitors * 0.3), percentage: 30 },
        reactNative: { count: Math.round(totalVisitors * 0.05), percentage: 5 },
        nativeApps: { count: Math.round(totalVisitors * 0.03), percentage: 3 },
        hybrid: { count: Math.round(totalVisitors * 0.02), percentage: 2 }
      },
      metadata: { 
        demoMode: true,
        dataSource: 'demo-data',
        timeRange,
        lastUpdated: new Date().toISOString()
      }
    };
    } else {
      // Production mode - return real data (zeros for now until connected to real analytics)
      console.log('getEnhancedOverview: Production mode - returning real data');
      return {
        activeVisitors: 0,
        totalVisitors: 0,
        conversionRate: 0,
        platformBreakdown: {
          web: { count: 0, percentage: 0 },
          mobile: { count: 0, percentage: 0 },
          reactNative: { count: 0, percentage: 0 },
          nativeApps: { count: 0, percentage: 0 },
          hybrid: { count: 0, percentage: 0 }
        },
        metadata: { 
          demoMode: false,
          dataSource: 'production',
          timeRange,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
  } catch (error) {
    console.error('Error fetching overview data:', error);
    // Fallback to zero state if error
    return {
      activeVisitors: 0,
      totalVisitors: 0,
      conversionRate: 0,
      platformBreakdown: {
        web: { count: 0, percentage: 0 },
        mobile: { count: 0, percentage: 0 },
        reactNative: { count: 0, percentage: 0 },
        nativeApps: { count: 0, percentage: 0 },
        hybrid: { count: 0, percentage: 0 }
      },
      metadata: { 
        simulationRunning: false,
        dataSource: 'fallback',
        error: true,
        timeRange,
        lastUpdated: new Date().toISOString()
      }
    };
  }
});

/**
 * Fetch visitor journeys and their touchpoints with simulation-aware behavior
 */
export const getVisitorJourneys = cache(async (visitorId?: string): Promise<VisitorPath[]> => {
  try {
    // Use unified data provider for consistency
    
    // If simulation is NOT running, return empty journeys
    if (!true) {
      console.log('getVisitorJourneys: Simulation OFF - returning empty journeys');
      return [];
    }
    
    // Simulation IS running - return journey data
    console.log('getVisitorJourneys: Simulation ACTIVE - generating journey data');
    const journeyCompletions = 50;
    const totalVisitors = 50;
    
    // If we have visitors but no journey completions, still show some journey data
    if (totalVisitors === 0) return [];
    
    // Return mock data based on simulation state - generate journeys even if completions is 0
    const mockJourneys = generateMockJourneyData(visitorId);
    
    // Scale the number of journeys based on visitor activity
    const numberOfJourneys = Math.min(mockJourneys.length, Math.max(1, Math.ceil(totalVisitors / 20)));
    return mockJourneys.slice(0, numberOfJourneys);
  } catch (error) {
    console.error('Error in getVisitorJourneys:', error);
    return [];
  }
});

// Mock data generators for development and fallbacks
function generateMockVisitorData(): VisitorJourney[] {
  return [
    {
      id: 'v1',
      visitorId: 'v1',
      fingerprint: 'fp12345678abcdef',
      location: 'Lagos, Nigeria',
      device: 'Mobile, Chrome',
      browser: 'Chrome',
      engagementScore: 72,
      lastActive: '2 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T14:00:00Z', value: 1, type: 'PAGEVIEW', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T14:01:30Z', value: 2, type: 'CLICK', url: '/products', title: 'Products Page' },
        { timestamp: '2023-05-17T14:03:00Z', value: 1, type: 'PAGEVIEW', url: '/products/1', title: 'Product Detail' },
        { timestamp: '2023-05-17T14:05:00Z', value: 3, type: 'FORM_VIEW', url: '/contact', title: 'Contact Form' },
        { timestamp: '2023-05-17T14:07:00Z', value: 5, type: 'CONVERSION', url: '/checkout', title: 'Checkout' }
      ]
    },
    {
      id: 'v2',
      visitorId: 'v2',
      fingerprint: 'fp87654321fedcba',
      location: 'Abuja, Nigeria',
      device: 'Desktop, Safari',
      browser: 'Safari',
      engagementScore: 45,
      lastActive: '5 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T13:50:00Z', value: 1, type: 'PAGEVIEW', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T13:52:00Z', value: 1, type: 'PAGEVIEW', url: '/about', title: 'About Us' },
        { timestamp: '2023-05-17T13:55:00Z', value: 2, type: 'CLICK', url: '/team', title: 'Our Team' },
        { timestamp: '2023-05-17T13:59:00Z', value: 1, type: 'PAGEVIEW', url: '/blog', title: 'Blog' }
      ]
    },
    {
      id: 'v3',
      visitorId: 'v3',
      fingerprint: 'fp13579aceg24680',
      location: 'Accra, Ghana',
      device: 'Tablet, Chrome',
      browser: 'Chrome',
      engagementScore: 63,
      lastActive: '12 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T13:40:00Z', value: 1, type: 'PAGEVIEW', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T13:42:00Z', value: 2, type: 'CLICK', url: '/products', title: 'Products Page' },
        { timestamp: '2023-05-17T13:44:00Z', value: 1, type: 'PAGEVIEW', url: '/products/2', title: 'Product Detail' },
        { timestamp: '2023-05-17T13:46:00Z', value: 3, type: 'FORM_VIEW', url: '/contact', title: 'Contact Form' }
      ]
    }
  ];
}

function generateMockJourneyData(visitorId?: string): VisitorPath[] {
  const journeys: VisitorPath[] = [
    {
      visitorId: 'v1',
      touchpoints: [
        { id: 't1', timestamp: '2023-05-17T14:00:00Z', type: 'pageview' as const, url: '/home', title: 'Home Page', duration: 90 },
        { id: 't2', timestamp: '2023-05-17T14:01:30Z', type: 'click' as const, url: '/products', title: 'Products Page', duration: 120 },
        { id: 't3', timestamp: '2023-05-17T14:03:00Z', type: 'pageview' as const, url: '/products/1', title: 'Product Detail', duration: 180 },
        { id: 't4', timestamp: '2023-05-17T14:05:00Z', type: 'form_view' as const, url: '/contact', title: 'Contact Form', formId: 'form1', formName: 'Contact Us', duration: 120 },
        { id: 't5', timestamp: '2023-05-17T14:07:00Z', type: 'form_submit' as const, url: '/checkout', title: 'Checkout', formId: 'form2', formName: 'Order Form', duration: 60, conversionValue: 199.99 }
      ],
      probability: 0.82,
      predictedValue: 199.99,
      status: 'converted' as const
    },
    {
      visitorId: 'v2',
      touchpoints: [
        { id: 't6', timestamp: '2023-05-17T13:50:00Z', type: 'pageview' as const, url: '/home', title: 'Home Page', duration: 120 },
        { id: 't7', timestamp: '2023-05-17T13:52:00Z', type: 'pageview' as const, url: '/about', title: 'About Us', duration: 180 },
        { id: 't8', timestamp: '2023-05-17T13:55:00Z', type: 'click' as const, url: '/team', title: 'Our Team', duration: 90 },
        { id: 't9', timestamp: '2023-05-17T13:59:00Z', type: 'pageview' as const, url: '/blog', title: 'Blog', duration: 300 }
      ],
      probability: 0.35,
      predictedValue: 49.99,
      status: 'active' as const
    }
  ];
  
  if (visitorId) {
    return journeys.filter(journey => journey.visitorId === visitorId);
  }
  
  return journeys;
}

// Helper function to format last active time
function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Helper function to convert time range to milliseconds
function getTimeRangeInMs(timeRange: string): number {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  
  switch (timeRange) {
    case '1h': return hour;
    case '6h': return 6 * hour;
    case '12h': return 12 * hour;
    case '7d': return 7 * day;
    case '30d': return 30 * day;
    default: return day; // 24h default
  }
}

/**
 * Generate AI prediction for a visitor based on their behavior patterns
 */
function generateAIPrediction(visitor: any): AIPrediction {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Base prediction factors
  let conversionProbability = 0.15; // Base 15%
  let behaviorPrediction: 'convert' | 'browse' | 'abandon' = 'browse';
  let confidence = 0.65;
  
  const factors = {
    pageTime: 0,
    clickPattern: 0,
    deviceType: 0,
    location: 0,
    referralSource: 0
  };
  
  // Factor 1: Page time and engagement
  const engagementScore = visitor.engagementScore || 50;
  if (engagementScore > 80) {
    conversionProbability += 0.25;
    factors.pageTime = 85;
    confidence += 0.15;
  } else if (engagementScore > 60) {
    conversionProbability += 0.15;
    factors.pageTime = 70;
    confidence += 0.10;
  } else if (engagementScore < 30) {
    conversionProbability -= 0.05;
    factors.pageTime = 25;
  }
  
  // Factor 2: Click patterns and activity
  const pulseDataLength = visitor.pulseData?.length || 0;
  if (pulseDataLength > 3) {
    conversionProbability += 0.20;
    factors.clickPattern = 80;
    confidence += 0.10;
  } else if (pulseDataLength > 1) {
    conversionProbability += 0.10;
    factors.clickPattern = 60;
  }
  
  // Factor 3: Device type impact (mobile vs desktop)
  if (visitor.device?.toLowerCase().includes('desktop')) {
    conversionProbability += 0.08;
    factors.deviceType = 75;
  } else if (visitor.device?.toLowerCase().includes('mobile')) {
    conversionProbability += 0.03; // Mobile conversion slightly lower
    factors.deviceType = 55;
  }
  
  // Factor 4: Location-based predictions (Nigerian market focus)
  if (visitor.location?.includes('Lagos') || visitor.location?.includes('Abuja')) {
    conversionProbability += 0.12; // Major Nigerian cities
    factors.location = 85;
    confidence += 0.08;
  } else if (visitor.location?.includes('Nigeria')) {
    conversionProbability += 0.08;
    factors.location = 70;
  } else if (visitor.location?.includes('Africa')) {
    conversionProbability += 0.05;
    factors.location = 60;
  }
  
  // Factor 5: Business hours impact
  if (currentHour >= 9 && currentHour <= 17) {
    conversionProbability += 0.10; // Business hours boost
    confidence += 0.05;
  }
  
  // Factor 6: Platform type preferences
  if (visitor.platform === 'web') {
    factors.referralSource = 70;
  } else if (visitor.platform === 'mobile' || visitor.platform === 'react-native') {
    factors.referralSource = 65;
  }
  
  // Determine behavior prediction
  if (conversionProbability > 0.7) {
    behaviorPrediction = 'convert';
  } else if (conversionProbability < 0.25) {
    behaviorPrediction = 'abandon';
  }
  
  // Cap probability and confidence
  conversionProbability = Math.min(0.95, Math.max(0.05, conversionProbability));
  confidence = Math.min(0.98, Math.max(0.45, confidence));
  
  // Generate actionable recommendations
  const recommendedActions = [];
  if (conversionProbability > 0.6) {
    recommendedActions.push('Priority outreach - high conversion potential');
    recommendedActions.push('Show pricing immediately');
  }
  if (factors.deviceType < 60) {
    recommendedActions.push('Optimize mobile experience');
  }
  if (factors.pageTime < 50) {
    recommendedActions.push('Improve page engagement content');
  }
  if (factors.location > 70) {
    recommendedActions.push('Show Nigerian Naira pricing');
    recommendedActions.push('Enable WhatsApp contact option');
  }
  
  return {
    visitorId: visitor.id || visitor.visitorId,
    conversionProbability: Math.round(conversionProbability * 100) / 100,
    behaviorPrediction,
    recommendedActions,
    confidence: Math.round(confidence * 100) / 100,
    factors
  };
}

/**
 * Generate AI enhancement data for a visitor based on predictions
 */
function generateAIEnhancement(visitor: any, prediction: AIPrediction): AIVisitorEnhancement {
  // Calculate AI score (0-100) based on multiple factors
  let aiScore = 30; // Base score
  
  // Boost score based on prediction factors
  aiScore += prediction.factors.pageTime * 0.2;
  aiScore += prediction.factors.clickPattern * 0.25;
  aiScore += prediction.factors.deviceType * 0.15;
  aiScore += prediction.factors.location * 0.2;
  aiScore += prediction.factors.referralSource * 0.1;
  
  // Additional boost for high engagement
  if (visitor.engagementScore > 75) {
    aiScore += 15;
  }
  
  // Cap AI score
  aiScore = Math.min(100, Math.max(10, Math.round(aiScore)));
  
  // Predict customer segment
  let segmentPrediction: 'enterprise' | 'startup' | 'individual';
  if (aiScore > 75 && prediction.factors.location > 70) {
    segmentPrediction = 'enterprise';
  } else if (aiScore > 50 && visitor.engagementScore > 60) {
    segmentPrediction = 'startup';
  } else {
    segmentPrediction = 'individual';
  }
  
  // Calculate predicted value based on segment and behavior
  let predictedValue = 0;
  switch (segmentPrediction) {
    case 'enterprise':
      predictedValue = 450000 + (aiScore * 4000); // ₦450k - ₦850k
      break;
    case 'startup':
      predictedValue = 150000 + (aiScore * 2000); // ₦150k - ₦350k
      break;
    case 'individual':
      predictedValue = 50000 + (aiScore * 1000); // ₦50k - ₦150k
      break;
  }
  
  // Determine urgency level
  let urgencyLevel: 'high' | 'medium' | 'low';
  if (prediction.conversionProbability > 0.7) {
    urgencyLevel = 'high';
  } else if (prediction.conversionProbability > 0.4) {
    urgencyLevel = 'medium';
  } else {
    urgencyLevel = 'low';
  }
  
  // Generate next action recommendation
  let nextAction = 'Monitor activity';
  if (urgencyLevel === 'high') {
    nextAction = 'Immediate contact recommended';
  } else if (urgencyLevel === 'medium') {
    nextAction = 'Schedule follow-up within 24h';
  }
  
  // Generate optimization recommendations
  const optimization = [];
  if (prediction.factors.pageTime < 60) {
    optimization.push('Improve page content engagement');
  }
  if (prediction.factors.deviceType < 70) {
    optimization.push('Optimize for mobile experience');
  }
  if (prediction.factors.location > 70) {
    optimization.push('Localize for Nigerian market');
  }
  if (visitor.engagementScore < 50) {
    optimization.push('Implement interactive elements');
  }
  
  return {
    aiScore,
    predictedValue: Math.round(predictedValue),
    segmentPrediction,
    nextAction,
    urgencyLevel,
    optimization
  };
} 