/**
 * LeadPulse Data Provider
 *
 * This module provides functions to fetch and transform data for the LeadPulse components.
 * It handles API interactions, data formatting, and caching.
 */

import { cache } from 'react';

// Interfaces matching the component props
export interface PulseDataPoint {
  timestamp: string;
  value: number;
  type: 'pageview' | 'click' | 'form_interaction' | 'conversion';
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
  type: 'behavior' | 'prediction' | 'opportunity' | 'trend';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
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
 * Fetch active visitors and their pulse data
 */
export const getActiveVisitors = cache(async (timeRange: string = '24h'): Promise<VisitorJourney[]> => {
  try {
    // Call API endpoint to get visitors
    const response = await fetch(`/api/leadpulse/visitors?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching visitors: ${response.statusText}`);
    }

    const data = await response.json();
    return data.visitors || [];
  } catch (error) {
    console.error('Error fetching active visitors:', error);
    
    // Return mock data for now
    return generateMockVisitorData();
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

/**
 * Fetch AI insights about visitors
 */
export const getVisitorInsights = cache(async (): Promise<InsightItem[]> => {
  try {
    // Call API endpoint
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
    
    // Return mock data for now
    return generateMockInsightData();
  }
});

/**
 * Fetch visitor segments
 */
export const getVisitorSegments = cache(async (): Promise<VisitorSegment[]> => {
  try {
    // Call API endpoint
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
    
    // Return mock data for now
    return generateMockSegmentData();
  }
});

/**
 * Fetch visitor locations
 */
export const getVisitorLocations = cache(async (timeRange: string = '24h'): Promise<VisitorLocation[]> => {
  try {
    // Call API endpoint
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
    
    // Return mock data for now
    return generateMockLocationData();
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
        { timestamp: '2023-05-17T14:00:00Z', value: 1, type: 'pageview', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T14:01:30Z', value: 2, type: 'click', url: '/products', title: 'Products Page' },
        { timestamp: '2023-05-17T14:03:00Z', value: 1, type: 'pageview', url: '/products/1', title: 'Product Detail' },
        { timestamp: '2023-05-17T14:05:00Z', value: 3, type: 'form_interaction', url: '/contact', title: 'Contact Form' },
        { timestamp: '2023-05-17T14:07:00Z', value: 5, type: 'conversion', url: '/checkout', title: 'Checkout' }
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
        { timestamp: '2023-05-17T13:50:00Z', value: 1, type: 'pageview', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T13:52:00Z', value: 1, type: 'pageview', url: '/about', title: 'About Us' },
        { timestamp: '2023-05-17T13:55:00Z', value: 2, type: 'click', url: '/team', title: 'Our Team' },
        { timestamp: '2023-05-17T13:59:00Z', value: 1, type: 'pageview', url: '/blog', title: 'Blog' }
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
        { timestamp: '2023-05-17T13:40:00Z', value: 1, type: 'pageview', url: '/home', title: 'Home Page' },
        { timestamp: '2023-05-17T13:42:00Z', value: 2, type: 'click', url: '/products', title: 'Products Page' },
        { timestamp: '2023-05-17T13:44:00Z', value: 1, type: 'pageview', url: '/products/2', title: 'Product Detail' },
        { timestamp: '2023-05-17T13:46:00Z', value: 3, type: 'form_interaction', url: '/contact', title: 'Contact Form' }
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

function generateMockInsightData(): InsightItem[] {
  return [
    {
      id: 'i1',
      type: 'behavior',
      title: 'High bounce rate on pricing page',
      description: 'Visitors are leaving the pricing page without taking action. Consider simplifying the pricing structure or adding more clear calls-to-action.',
      importance: 'high',
      metric: {
        label: 'Bounce Rate',
        value: 68.5,
        format: 'percentage',
        change: 12.3
      },
      recommendation: 'Add testimonials or case studies near pricing to build confidence.',
      createdAt: '2023-05-16T12:00:00Z'
    },
    {
      id: 'i2',
      type: 'opportunity',
      title: 'Form conversion opportunity',
      description: 'Your contact form has a higher than average view-to-submission ratio. This represents a good opportunity to capture more leads.',
      importance: 'medium',
      metric: {
        label: 'Form Conversion',
        value: 18.2,
        format: 'percentage',
        change: 3.5
      },
      recommendation: 'Simplify the form by reducing required fields to essential information only.',
      createdAt: '2023-05-16T10:30:00Z'
    },
    {
      id: 'i3',
      type: 'prediction',
      title: 'Revenue forecast increase',
      description: 'Based on current visitor engagement patterns, we predict a significant increase in conversion value for the next period.',
      importance: 'medium',
      metric: {
        label: 'Predicted Revenue',
        value: 12500,
        format: 'currency',
        change: 8.2
      },
      createdAt: '2023-05-15T16:45:00Z'
    },
    {
      id: 'i4',
      type: 'trend',
      title: 'Mobile traffic growth',
      description: 'Mobile visitors have increased significantly over the past month, now representing the majority of your traffic.',
      importance: 'low',
      metric: {
        label: 'Mobile Traffic',
        value: 62.8,
        format: 'percentage',
        change: 15.4
      },
      recommendation: 'Ensure all critical pages and forms are optimized for mobile devices.',
      createdAt: '2023-05-14T09:15:00Z'
    }
  ];
}

function generateMockSegmentData(): VisitorSegment[] {
  return [
    {
      id: 's1',
      name: 'High-Value Prospects',
      count: 124,
      percentage: 28.5,
      key: 'high_value'
    },
    {
      id: 's2',
      name: 'First-Time Visitors',
      count: 215,
      percentage: 49.4,
      key: 'first_time'
    },
    {
      id: 's3',
      name: 'Repeat Visitors',
      count: 87,
      percentage: 20.0,
      key: 'repeat'
    },
    {
      id: 's4',
      name: 'Cart Abandoners',
      count: 42,
      percentage: 9.7,
      key: 'cart_abandon'
    },
    {
      id: 's5',
      name: 'Newsletter Subscribers',
      count: 156,
      percentage: 35.9,
      key: 'newsletter'
    }
  ];
}

function generateMockLocationData(): VisitorLocation[] {
  return [
    {
      id: 'loc_1',
      city: 'New York',
      country: 'USA',
      isActive: true,
      lastActive: 'just now',
      visitCount: 145,
      latitude: 40.7128,
      longitude: -74.0060
    },
    {
      id: 'loc_2',
      city: 'London',
      country: 'UK',
      isActive: true,
      lastActive: '2 mins ago',
      visitCount: 87,
      latitude: 51.5074,
      longitude: -0.1278
    },
    {
      id: 'loc_3',
      city: 'Lagos',
      country: 'Nigeria',
      isActive: true,
      lastActive: '5 mins ago',
      visitCount: 62,
      latitude: 6.5244,
      longitude: 3.3792
    },
    {
      id: 'loc_4',
      city: 'Tokyo',
      country: 'Japan',
      isActive: false,
      lastActive: '15 mins ago',
      visitCount: 43,
      latitude: 35.6762,
      longitude: 139.6503
    },
    {
      id: 'loc_5',
      city: 'Sydney',
      country: 'Australia',
      isActive: false,
      lastActive: '32 mins ago',
      visitCount: 28,
      latitude: -33.8688,
      longitude: 151.2093
    }
  ];
} 