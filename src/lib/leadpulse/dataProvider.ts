/**
 * LeadPulse Data Provider
 *
 * This module provides functions to fetch and transform data for the LeadPulse components.
 * It handles API interactions, data formatting, and caching.
 */

import { cache } from 'react';

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
 * Fetch visitor locations with proper error handling and fallbacks
 */
export const getVisitorLocations = cache(async (timeRange = '24h'): Promise<VisitorLocation[]> => {
  try {
    // Call API endpoint instead of using Prisma directly
    const response = await fetch(`/api/leadpulse/locations?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching locations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching visitor locations:', error);
    return []; // Return empty array instead of mock data
  }
});

/**
 * Fetch visitor segments with proper error handling
 */
export const getVisitorSegments = cache(async (): Promise<VisitorSegment[]> => {
  try {
    // Call API endpoint instead of using Prisma directly
    const response = await fetch('/api/leadpulse/segments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching segments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.segments || [];
  } catch (error) {
    console.error('Error fetching visitor segments:', error);
    return []; // Return empty array instead of mock data
  }
});

/**
 * Fetch visitor insights with proper error handling
 */
export const getVisitorInsights = cache(async (): Promise<InsightItem[]> => {
  try {
    // Call API endpoint instead of using Prisma directly
    const response = await fetch('/api/leadpulse/insights', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching insights: ${response.statusText}`);
    }

    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Error fetching visitor insights:', error);
    return []; // Return empty array instead of mock data
  }
});

/**
 * Fetch active visitors and their pulse data
 */
export const getActiveVisitors = cache(async (timeRange = '24h'): Promise<VisitorJourney[]> => {
  try {
    // Call API endpoint to get visitors
    const response = await fetch(`/api/leadpulse/visitors?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error fetching visitors: ${response.statusText}`);
    }

    return data.visitors || [];
  } catch (error) {
    console.error('Error fetching active visitors:', error);
    return []; // Return empty array instead of mock data since API handles fallback
  }
});

/**
 * Fetch visitor journeys and their touchpoints
 */
export const getVisitorJourneys = cache(async (visitorId?: string): Promise<VisitorPath[]> => {
  try {
    // Call API endpoint
    const url = visitorId 
      ? `/api/leadpulse/journeys?visitorId=${visitorId}`
      : '/api/leadpulse/journeys';
      
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching journeys: ${response.statusText}`);
    }

    const data = await response.json();
    return data.journeys || [];
  } catch (error) {
    console.error('Error fetching visitor journeys:', error);
    
    // Return mock data for now
    return generateMockJourneyData(visitorId);
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