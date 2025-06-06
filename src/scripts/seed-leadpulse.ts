#!/usr/bin/env tsx

/**
 * LeadPulse Seed Data Script
 * 
 * This script populates the database with realistic LeadPulse data including:
 * - Visitors from various locations with different devices/browsers
 * - Touchpoints showing visitor journeys 
 * - Segments for visitor categorization
 * - AI-generated insights
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Sample locations with realistic coordinates
const locations = [
  { city: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 },
  { city: 'Abuja', country: 'Nigeria', latitude: 9.0579, longitude: 7.4951 },
  { city: 'Accra', country: 'Ghana', latitude: 5.6037, longitude: -0.1870 },
  { city: 'Nairobi', country: 'Kenya', latitude: -1.2921, longitude: 36.8219 },
  { city: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
  { city: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241 },
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708 },
  { city: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777 }
];

// Device and browser combinations
const devices = [
  { device: 'Mobile', browser: 'Chrome', os: 'Android' },
  { device: 'Mobile', browser: 'Safari', os: 'iOS' },
  { device: 'Desktop', browser: 'Chrome', os: 'Windows' },
  { device: 'Desktop', browser: 'Firefox', os: 'Windows' },
  { device: 'Desktop', browser: 'Safari', os: 'macOS' },
  { device: 'Tablet', browser: 'Chrome', os: 'Android' },
  { device: 'Tablet', browser: 'Safari', os: 'iOS' }
];

// Sample page URLs for realistic journeys
const pages = [
  { url: '/', pageTitle: 'Home Page' },
  { url: '/about', pageTitle: 'About Us' },
  { url: '/products', pageTitle: 'Products' },
  { url: '/products/analytics', pageTitle: 'Analytics Platform' },
  { url: '/products/leadpulse', pageTitle: 'LeadPulse' },
  { url: '/pricing', pageTitle: 'Pricing' },
  { url: '/contact', pageTitle: 'Contact Us' },
  { url: '/blog', pageTitle: 'Blog' },
  { url: '/blog/ai-marketing', pageTitle: 'AI in Marketing' },
  { url: '/demo', pageTitle: 'Request Demo' },
  { url: '/signup', pageTitle: 'Sign Up' },
  { url: '/login', pageTitle: 'Login' }
];

// Generate realistic fingerprint
function generateFingerprint(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Generate realistic user agent
function generateUserAgent(device: string, browser: string, os: string): string {
  const versions = {
    Chrome: '120.0.6099.109',
    Safari: '17.2.1',
    Firefox: '121.0'
  };
  
  if (device === 'Mobile') {
    if (os === 'iOS') {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${versions.Safari} Mobile/15E148 Safari/604.1`;
    } else {
      return `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.Chrome} Mobile Safari/537.36`;
    }
  } else {
    return `Mozilla/5.0 (${os === 'Windows' ? 'Windows NT 10.0; Win64; x64' : 'Macintosh; Intel Mac OS X 10_15_7'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.Chrome} Safari/537.36`;
  }
}

// Calculate engagement score based on touchpoints
function calculateEngagementScore(touchpoints: any[]): number {
  const baseScore = touchpoints.reduce((sum, tp) => sum + tp.score, 0);
  const diversityBonus = new Set(touchpoints.map(tp => tp.type)).size * 5;
  const conversionBonus = touchpoints.some(tp => tp.type === 'CONVERSION') ? 30 : 0;
  
  return Math.min(100, baseScore + diversityBonus + conversionBonus);
}

// Generate visitor journey with realistic patterns
function generateVisitorJourney(startTime: Date, visitorType: 'explorer' | 'focused' | 'converter'): any[] {
  const journey = [];
  let currentTime = new Date(startTime);
  
  // Different journey patterns based on visitor type
  switch (visitorType) {
    case 'explorer':
      // Visits many pages, lower conversion
      const explorerPages = [
        { ...pages[0], type: 'PAGEVIEW', score: 1, duration: 45000 },
        { ...pages[1], type: 'PAGEVIEW', score: 1, duration: 30000 },
        { ...pages[7], type: 'PAGEVIEW', score: 1, duration: 60000 },
        { ...pages[8], type: 'CLICK', score: 2, duration: 20000 },
        { ...pages[2], type: 'PAGEVIEW', score: 1, duration: 40000 },
        { ...pages[5], type: 'PAGEVIEW', score: 1, duration: 25000 }
      ];
      
      for (const page of explorerPages) {
        journey.push({
          timestamp: new Date(currentTime),
          type: page.type,
          url: page.url,
          pageTitle: page.pageTitle,
          score: page.score,
          duration: page.duration
        });
        currentTime = new Date(currentTime.getTime() + page.duration + Math.random() * 30000);
      }
      break;
      
    case 'focused':
      // Direct path to specific product/service
      const focusedPages = [
        { ...pages[0], type: 'PAGEVIEW', score: 1, duration: 20000 },
        { ...pages[4], type: 'CLICK', score: 2, duration: 90000 },
        { ...pages[5], type: 'PAGEVIEW', score: 1, duration: 45000 },
        { ...pages[6], type: 'FORM_VIEW', score: 3, duration: 30000 }
      ];
      
      for (const page of focusedPages) {
        journey.push({
          timestamp: new Date(currentTime),
          type: page.type,
          url: page.url,
          pageTitle: page.pageTitle,
          score: page.score,
          duration: page.duration
        });
        currentTime = new Date(currentTime.getTime() + page.duration + Math.random() * 15000);
      }
      break;
      
    case 'converter':
      // Full conversion journey
      const converterPages = [
        { ...pages[0], type: 'PAGEVIEW', score: 1, duration: 30000 },
        { ...pages[2], type: 'PAGEVIEW', score: 1, duration: 60000 },
        { ...pages[3], type: 'CLICK', score: 2, duration: 120000 },
        { ...pages[9], type: 'FORM_VIEW', score: 3, duration: 45000 },
        { ...pages[9], type: 'FORM_START', score: 4, duration: 180000 },
        { ...pages[10], type: 'CONVERSION', score: 10, duration: 60000 }
      ];
      
      for (const page of converterPages) {
        journey.push({
          timestamp: new Date(currentTime),
          type: page.type,
          url: page.url,
          pageTitle: page.pageTitle,
          score: page.score,
          duration: page.duration
        });
        currentTime = new Date(currentTime.getTime() + page.duration + Math.random() * 20000);
      }
      break;
  }
  
  return journey;
}

async function main() {
  console.log('🌱 Starting LeadPulse seed data generation...');

  // Clear existing data using Prisma client instead of raw SQL
  console.log('🗑️ Clearing existing LeadPulse data...');
  
  try {
    // Clear in correct order due to foreign key constraints
    await prisma.leadPulseTouchpoint.deleteMany({});
    await prisma.leadPulseInsight.deleteMany({});
    await prisma.leadPulseSegment.deleteMany({});
    await prisma.leadPulseVisitor.deleteMany({});
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.log('ℹ️ No existing data to clear');
  }

  // Create visitor segments using Prisma client
  console.log('📊 Creating visitor segments...');
  const segmentData = [
    {
      name: 'High-Value Prospects',
      description: 'Visitors with high engagement scores and demo requests',
      criteria: { engagementScore: { min: 70 }, demoRequested: true }
    },
    {
      name: 'Product Browsers',
      description: 'Visitors who spend significant time on product pages',
      criteria: { productPageViews: { min: 3 }, timeOnSite: { min: 300 } }
    },
    {
      name: 'Blog Readers',
      description: 'Visitors who engage with blog content',
      criteria: { blogEngagement: true, returnVisitor: true }
    },
    {
      name: 'Mobile Users',
      description: 'Visitors primarily using mobile devices',
      criteria: { device: 'mobile', mobileOptimized: true }
    }
  ];

  // Create segments using Prisma client
  for (const segment of segmentData) {
    await prisma.leadPulseSegment.create({
      data: {
        name: segment.name,
        description: segment.description,
        criteria: segment.criteria
      }
    });
  }

  // Generate visitors with realistic data
  console.log('👥 Creating visitors and touchpoints...');
  const visitors = [];
  const now = new Date();
  const visitorTypes: ('explorer' | 'focused' | 'converter')[] = ['explorer', 'focused', 'converter'];

  for (let i = 0; i < 50; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const deviceInfo = devices[Math.floor(Math.random() * devices.length)];
    const visitorType = visitorTypes[Math.floor(Math.random() * visitorTypes.length)];
    
    // Create visitor session in the last 7 days
    const sessionStart = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const lastVisit = new Date(sessionStart.getTime() + Math.random() * 2 * 60 * 60 * 1000);
    
    // Generate journey
    const journey = generateVisitorJourney(sessionStart, visitorType);
    const engagementScore = calculateEngagementScore(journey);
    
    // Determine if visitor is currently active (within last 30 minutes)
    const isActive = Math.random() < 0.15 && (now.getTime() - lastVisit.getTime()) < 30 * 60 * 1000;
    
    const fingerprint = generateFingerprint();
    const ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const userAgent = generateUserAgent(deviceInfo.device, deviceInfo.browser, deviceInfo.os);
    const region = location.country === 'Nigeria' ? (location.city === 'Lagos' ? 'Lagos State' : 'FCT') : 'Unknown';
    const engagementLevel = engagementScore > 70 ? 'High' : engagementScore > 40 ? 'Medium' : 'Low';

    // Create visitor using Prisma client
    const visitor = await prisma.leadPulseVisitor.create({
      data: {
        fingerprint,
        ipAddress,
        userAgent,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        city: location.city,
        country: location.country,
        region,
        latitude: location.latitude,
        longitude: location.longitude,
        firstVisit: sessionStart,
        lastVisit,
        totalVisits: Math.floor(Math.random() * 5) + 1,
        isActive,
        engagementScore,
        engagementLevel,
        score: engagementScore
      }
    });

    // Create touchpoints for this visitor
    const touchpointPromises = journey.map(touchpoint => {
      const metadata = {
        sessionId: generateFingerprint().slice(0, 8),
        referrer: i === 0 ? 'direct' : 'google.com',
        scrollDepth: Math.floor(Math.random() * 100),
        timeOnPage: touchpoint.duration,
        pageTitle: touchpoint.pageTitle
      };

      return prisma.leadPulseTouchpoint.create({
        data: {
          visitorId: visitor.id,
          timestamp: touchpoint.timestamp,
          type: touchpoint.type,
          url: touchpoint.url,
          score: touchpoint.score,
          duration: touchpoint.duration,
          metadata
        }
      });
    });

    await Promise.all(touchpointPromises);
    visitors.push({ id: visitor.id, engagementScore, journey });
  }

  // Create AI-generated insights
  console.log('🧠 Creating insights...');
  const insights = [
    {
      type: 'TREND',
      title: 'Mobile Traffic Surge',
      description: 'Mobile device usage has increased by 45% this week, with most users coming from Lagos and Accra.',
      importance: 'HIGH',
      metric: {
        label: 'Mobile Traffic Increase',
        value: 45,
        format: 'percentage',
        change: 12
      },
      recommendation: 'Consider optimizing mobile experience and running mobile-specific campaigns in Lagos and Accra markets.'
    },
    {
      type: 'BEHAVIOR',
      title: 'Product Page Engagement Pattern',
      description: 'Visitors who view the analytics platform page spend 3x more time on site and have 60% higher conversion rates.',
      importance: 'MEDIUM',
      metric: {
        label: 'Conversion Rate',
        value: 8.5,
        format: 'percentage',
        change: 2.3
      },
      recommendation: 'Promote analytics platform more prominently on homepage and in navigation.'
    },
    {
      type: 'OPPORTUNITY',
      title: 'Blog-to-Demo Conversion Gap',
      description: 'Blog readers show high engagement but low demo request rates. There\'s potential to better funnel blog traffic.',
      importance: 'MEDIUM',
      metric: {
        label: 'Blog-to-Demo Rate',
        value: 2.1,
        format: 'percentage',
        change: -0.5
      },
      recommendation: 'Add strategic CTAs in blog posts and create blog-specific landing pages for demo requests.'
    },
    {
      type: 'PREDICTION',
      title: 'Weekend Traffic Optimization',
      description: 'ML models predict 23% higher conversion rates for weekend visitors, especially from GMT+1 timezone.',
      importance: 'LOW',
      metric: {
        label: 'Predicted Weekend Uplift',
        value: 23,
        format: 'percentage',
        change: 5
      },
      recommendation: 'Schedule targeted campaigns and ensure sales team availability during weekend hours for African markets.'
    }
  ];

  const insightPromises = insights.map(insight => {
    return prisma.leadPulseInsight.create({
      data: {
        type: insight.type as any,
        title: insight.title,
        description: insight.description,
        importance: insight.importance as any,
        metric: insight.metric,
        recommendation: insight.recommendation
      }
    });
  });

  await Promise.all(insightPromises);

  console.log('✅ LeadPulse seed data created successfully!');
  console.log(`📊 Created ${visitors.length} visitors with realistic touchpoint journeys`);
  console.log(`🎯 Created ${segmentData.length} visitor segments`);
  console.log(`🧠 Created ${insights.length} AI insights`);
  console.log('\n🚀 Your LeadPulse dashboard is now populated with realistic data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding LeadPulse data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 