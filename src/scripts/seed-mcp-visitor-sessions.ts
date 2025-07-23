#!/usr/bin/env tsx

/**
 * MCP Visitor Sessions Seed Script
 * 
 * This script generates realistic visitor session data for MCP servers by:
 * - Extending existing seed-leadpulse.ts patterns with MCP-specific session data
 * - Creating visitor sessions with comprehensive journey tracking
 * - Generating real-time session analytics and behavior patterns
 * - Adding conversion funnel data and drop-off points
 * 
 * Follows the same patterns as existing seed scripts for Docker compatibility.
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

// Allow connection to both Docker internal and local connections
const databaseUrl = process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage?schema=public";

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// African cities with realistic visitor distributions
const AFRICAN_LOCATIONS = [
  { city: 'Lagos', country: 'Nigeria', region: 'Lagos State', percentage: 25, timezone: 'Africa/Lagos' },
  { city: 'Abuja', country: 'Nigeria', region: 'FCT', percentage: 12, timezone: 'Africa/Lagos' },
  { city: 'Accra', country: 'Ghana', region: 'Greater Accra', percentage: 10, timezone: 'Africa/Accra' },
  { city: 'Nairobi', country: 'Kenya', region: 'Nairobi', percentage: 8, timezone: 'Africa/Nairobi' },
  { city: 'Cape Town', country: 'South Africa', region: 'Western Cape', percentage: 8, timezone: 'Africa/Johannesburg' },
  { city: 'Cairo', country: 'Egypt', region: 'Cairo Governorate', percentage: 7, timezone: 'Africa/Cairo' },
  { city: 'Johannesburg', country: 'South Africa', region: 'Gauteng', percentage: 6, timezone: 'Africa/Johannesburg' },
  { city: 'Casablanca', country: 'Morocco', region: 'Casablanca-Settat', percentage: 5, timezone: 'Africa/Casablanca' },
  { city: 'Addis Ababa', country: 'Ethiopia', region: 'Addis Ababa', percentage: 4, timezone: 'Africa/Addis_Ababa' },
  { city: 'Kampala', country: 'Uganda', region: 'Central Region', percentage: 3, timezone: 'Africa/Kampala' },
  { city: 'Other African Cities', country: 'Various', region: 'Various', percentage: 12, timezone: 'Africa/Lagos' }
];

// Device preferences based on African market data
const DEVICE_PATTERNS = {
  mobile: { percentage: 85, browsers: ['Chrome', 'Safari', 'Firefox', 'Opera'] },
  desktop: { percentage: 12, browsers: ['Chrome', 'Edge', 'Safari', 'Firefox'] },
  tablet: { percentage: 3, browsers: ['Chrome', 'Safari', 'Firefox'] }
};

// User journey patterns for African customers
const JOURNEY_PATTERNS = [
  {
    type: 'mobile_first_explorer',
    percentage: 35,
    avgPages: 4,
    avgTimeOnSite: 180000, // 3 minutes
    conversionRate: 2.5,
    characteristics: ['high_mobile_usage', 'price_sensitive', 'social_influenced']
  },
  {
    type: 'business_decision_maker',
    percentage: 20,
    avgPages: 7,
    avgTimeOnSite: 420000, // 7 minutes
    conversionRate: 8.5,
    characteristics: ['desktop_preference', 'thorough_researcher', 'high_value']
  },
  {
    type: 'quick_browser',
    percentage: 25,
    avgPages: 2,
    avgTimeOnSite: 45000, // 45 seconds
    conversionRate: 0.8,
    characteristics: ['mobile_only', 'impatient', 'price_focused']
  },
  {
    type: 'returning_prospect',
    percentage: 15,
    avgPages: 5,
    avgTimeOnSite: 300000, // 5 minutes
    conversionRate: 12.0,
    characteristics: ['familiar_with_brand', 'evaluation_phase', 'high_intent']
  },
  {
    type: 'social_media_referral',
    percentage: 5,
    avgPages: 3,
    avgTimeOnSite: 120000, // 2 minutes
    conversionRate: 4.2,
    characteristics: ['social_influenced', 'mobile_heavy', 'community_driven']
  }
];

// Page hierarchy for realistic navigation
const SITE_PAGES = [
  { url: '/', title: 'MarketSage - African Marketing Automation', type: 'landing', conversionValue: 1 },
  { url: '/about', title: 'About MarketSage', type: 'information', conversionValue: 2 },
  { url: '/features', title: 'Features Overview', type: 'product', conversionValue: 3 },
  { url: '/features/leadpulse', title: 'LeadPulse - Visitor Intelligence', type: 'product', conversionValue: 4 },
  { url: '/features/ai-automation', title: 'AI-Powered Automation', type: 'product', conversionValue: 4 },
  { url: '/features/multi-channel', title: 'Multi-Channel Campaigns', type: 'product', conversionValue: 4 },
  { url: '/pricing', title: 'Pricing Plans', type: 'conversion', conversionValue: 8 },
  { url: '/case-studies', title: 'African Success Stories', type: 'social_proof', conversionValue: 5 },
  { url: '/demo', title: 'Request Demo', type: 'conversion', conversionValue: 10 },
  { url: '/contact', title: 'Contact Sales', type: 'conversion', conversionValue: 9 },
  { url: '/blog', title: 'Marketing Insights Blog', type: 'content', conversionValue: 2 },
  { url: '/blog/sms-marketing-africa', title: 'SMS Marketing in Africa', type: 'content', conversionValue: 3 },
  { url: '/blog/whatsapp-business-nigeria', title: 'WhatsApp Business in Nigeria', type: 'content', conversionValue: 3 },
  { url: '/integrations', title: 'Integrations & APIs', type: 'technical', conversionValue: 4 },
  { url: '/security', title: 'Security & Compliance', type: 'trust', conversionValue: 3 }
];

// Conversion funnel stages
const FUNNEL_STAGES = [
  { stage: 'awareness', weight: 1.0, exitRate: 0.7 },
  { stage: 'interest', weight: 0.3, exitRate: 0.6 },
  { stage: 'consideration', weight: 0.12, exitRate: 0.4 },
  { stage: 'intent', weight: 0.072, exitRate: 0.3 },
  { stage: 'evaluation', weight: 0.05, exitRate: 0.2 },
  { stage: 'purchase', weight: 0.04, exitRate: 0.0 }
];

/**
 * Generate realistic visitor session based on journey pattern
 */
function generateVisitorSession(pattern: any, location: any): any {
  const now = new Date();
  const sessionStart = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  // Generate session duration based on pattern
  const baseDuration = pattern.avgTimeOnSite;
  const variance = 0.6; // ±60% variance
  const sessionDuration = baseDuration * (1 + (Math.random() - 0.5) * 2 * variance);
  
  // Generate pages visited
  const basePages = pattern.avgPages;
  const pagesVisited = Math.max(1, Math.round(basePages * (1 + (Math.random() - 0.5) * 0.8)));
  
  // Device selection based on pattern
  let deviceType = 'mobile';
  if (pattern.characteristics.includes('desktop_preference')) {
    deviceType = Math.random() < 0.7 ? 'desktop' : 'mobile';
  } else if (pattern.characteristics.includes('mobile_only')) {
    deviceType = 'mobile';
  } else {
    const rand = Math.random() * 100;
    if (rand < DEVICE_PATTERNS.mobile.percentage) deviceType = 'mobile';
    else if (rand < DEVICE_PATTERNS.mobile.percentage + DEVICE_PATTERNS.desktop.percentage) deviceType = 'desktop';
    else deviceType = 'tablet';
  }
  
  // Browser selection
  const browsers = DEVICE_PATTERNS[deviceType as keyof typeof DEVICE_PATTERNS].browsers;
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  
  // Generate unique identifiers
  const sessionId = randomUUID();
  const fingerprint = generateFingerprint();
  const ipAddress = generateAfricanIP(location.country);
  
  // Traffic source
  const trafficSources = [
    { source: 'google', medium: 'organic', weight: 40 },
    { source: 'direct', medium: 'none', weight: 25 },
    { source: 'facebook', medium: 'social', weight: 15 },
    { source: 'linkedin', medium: 'social', weight: 8 },
    { source: 'twitter', medium: 'social', weight: 5 },
    { source: 'whatsapp', medium: 'referral', weight: 4 },
    { source: 'email', medium: 'email', weight: 3 }
  ];
  
  const sourceRand = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedSource = trafficSources[0];
  
  for (const source of trafficSources) {
    cumulativeWeight += source.weight;
    if (sourceRand <= cumulativeWeight) {
      selectedSource = source;
      break;
    }
  }
  
  // Conversion likelihood
  const hasConverted = Math.random() < (pattern.conversionRate / 100);
  
  return {
    sessionId,
    fingerprint,
    ipAddress,
    location,
    deviceType,
    browser,
    sessionStart,
    sessionDuration,
    pagesVisited,
    pattern,
    trafficSource: selectedSource,
    hasConverted,
    characteristics: pattern.characteristics
  };
}

/**
 * Generate page views for a session
 */
function generatePageViews(session: any): any[] {
  const pageViews = [];
  let currentTime = new Date(session.sessionStart);
  const timePerPage = session.sessionDuration / session.pagesVisited;
  
  // Always start with homepage or referral page
  let currentPage = SITE_PAGES[0]; // Homepage
  
  // If from social media, might start with blog
  if (session.trafficSource.medium === 'social' && Math.random() < 0.4) {
    currentPage = SITE_PAGES[Math.floor(Math.random() * 3) + 10]; // Blog pages
  }
  
  for (let i = 0; i < session.pagesVisited; i++) {
    const timeOnPage = timePerPage * (0.5 + Math.random()); // Realistic variance
    const scrollDepth = Math.floor(20 + Math.random() * 80); // 20-100% scroll
    
    pageViews.push({
      url: currentPage.url,
      title: currentPage.title,
      timestamp: new Date(currentTime),
      timeOnPage: Math.round(timeOnPage),
      scrollDepth,
      conversionValue: currentPage.conversionValue,
      isExit: i === session.pagesVisited - 1,
      interactions: generatePageInteractions(currentPage, session)
    });
    
    currentTime = new Date(currentTime.getTime() + timeOnPage);
    
    // Navigate to next page based on realistic patterns
    if (i < session.pagesVisited - 1) {
      currentPage = selectNextPage(currentPage, session);
    }
  }
  
  return pageViews;
}

/**
 * Select next page based on current page and user pattern
 */
function selectNextPage(currentPage: any, session: any): any {
  const { characteristics } = session;
  
  // Business decision makers tend to go deeper
  if (characteristics.includes('thorough_researcher')) {
    if (currentPage.url === '/') return SITE_PAGES.find(p => p.url === '/features')!;
    if (currentPage.url === '/features') return SITE_PAGES.find(p => p.url === '/pricing')!;
    if (currentPage.url === '/pricing') return SITE_PAGES.find(p => p.url === '/case-studies')!;
    if (currentPage.url === '/case-studies') return SITE_PAGES.find(p => p.url === '/demo')!;
  }
  
  // Quick browsers tend to bounce or go to pricing
  if (characteristics.includes('impatient')) {
    if (currentPage.url === '/') {
      return Math.random() < 0.6 ? SITE_PAGES.find(p => p.url === '/pricing')! : SITE_PAGES[Math.floor(Math.random() * SITE_PAGES.length)];
    }
  }
  
  // Social media referrals often browse content
  if (characteristics.includes('social_influenced')) {
    const contentPages = SITE_PAGES.filter(p => p.type === 'content');
    if (Math.random() < 0.5 && contentPages.length > 0) {
      return contentPages[Math.floor(Math.random() * contentPages.length)];
    }
  }
  
  // Default: semi-random but logical navigation
  const currentType = currentPage.type;
  let possibleNext = SITE_PAGES.filter(p => p.url !== currentPage.url);
  
  if (currentType === 'landing') {
    possibleNext = SITE_PAGES.filter(p => ['product', 'conversion', 'content'].includes(p.type));
  } else if (currentType === 'product') {
    possibleNext = SITE_PAGES.filter(p => ['conversion', 'social_proof', 'technical'].includes(p.type));
  }
  
  return possibleNext[Math.floor(Math.random() * possibleNext.length)] || SITE_PAGES[0];
}

/**
 * Generate page interactions
 */
function generatePageInteractions(page: any, session: any): any[] {
  const interactions = [];
  
  // Click interactions based on page type
  if (page.type === 'conversion') {
    if (Math.random() < 0.4) {
      interactions.push({
        type: 'click',
        element: 'cta_button',
        timestamp: Date.now() + Math.random() * 30000,
        value: page.conversionValue
      });
    }
  }
  
  if (page.type === 'product' && Math.random() < 0.3) {
    interactions.push({
      type: 'click',
      element: 'feature_tab',
      timestamp: Date.now() + Math.random() * 20000,
      value: 2
    });
  }
  
  // Form interactions
  if (page.url === '/demo' && session.hasConverted) {
    interactions.push({
      type: 'form_start',
      element: 'demo_form',
      timestamp: Date.now() + Math.random() * 60000,
      value: 8
    });
    
    if (Math.random() < 0.8) { // 80% complete forms they start
      interactions.push({
        type: 'form_submit',
        element: 'demo_form',
        timestamp: Date.now() + Math.random() * 120000,
        value: 15
      });
    }
  }
  
  return interactions;
}

/**
 * Helper functions
 */
function generateFingerprint(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateAfricanIP(country: string): string {
  // Generate realistic IP ranges for African countries
  const ipRanges = {
    'Nigeria': ['197.210', '105.112', '41.203', '165.73'],
    'Ghana': ['154.160', '197.255', '45.223', '41.190'],
    'Kenya': ['197.136', '105.48', '41.206', '154.122'],
    'South Africa': ['41.185', '196.21', '197.84', '105.184'],
    'Egypt': ['197.55', '41.178', '154.178', '196.218']
  };
  
  const ranges = ipRanges[country as keyof typeof ipRanges] || ipRanges['Nigeria'];
  const baseRange = ranges[Math.floor(Math.random() * ranges.length)];
  const suffix = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  
  return `${baseRange}.${suffix}`;
}

function calculateEngagementScore(pageViews: any[], session: any): number {
  let score = 0;
  
  // Base score from page views
  score += pageViews.length * 5;
  
  // Time on site bonus
  const avgTimePerPage = session.sessionDuration / pageViews.length;
  if (avgTimePerPage > 60000) score += 20; // >1 minute per page
  else if (avgTimePerPage > 30000) score += 10; // >30 seconds per page
  
  // Scroll depth bonus
  const avgScrollDepth = pageViews.reduce((sum, pv) => sum + pv.scrollDepth, 0) / pageViews.length;
  score += Math.round(avgScrollDepth / 10); // 1 point per 10% scroll
  
  // Interaction bonus
  const totalInteractions = pageViews.reduce((sum, pv) => sum + pv.interactions.length, 0);
  score += totalInteractions * 5;
  
  // Conversion bonus
  if (session.hasConverted) score += 30;
  
  // Page type bonus
  const highValuePages = pageViews.filter(pv => pv.conversionValue >= 5).length;
  score += highValuePages * 3;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Main seeding function
 */
async function seedMCPVisitorSessions() {
  console.log('👥 Starting MCP Visitor Sessions Seeding...');
  console.log(`📊 Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    // Get existing organizations for proper data association
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });

    console.log(`🏢 Found ${organizations.length} organizations`);

    if (organizations.length === 0) {
      console.log('⚠️  No organizations found. Please run organization seeding first.');
      return;
    }

    // Clear existing MCP visitor session data
    console.log('🧹 Clearing existing MCP visitor sessions...');
    await prisma.$executeRaw`DELETE FROM "MCPVisitorSessions"`;

    let sessionsCreated = 0;
    const totalSessions = 200; // Generate 200 realistic sessions

    console.log(`🚀 Generating ${totalSessions} visitor sessions...`);

    for (let i = 0; i < totalSessions; i++) {
      // Select location based on weighted distribution
      const locationRand = Math.random() * 100;
      let cumulativeWeight = 0;
      let selectedLocation = AFRICAN_LOCATIONS[0];

      for (const location of AFRICAN_LOCATIONS) {
        cumulativeWeight += location.percentage;
        if (locationRand <= cumulativeWeight) {
          selectedLocation = location;
          break;
        }
      }

      // Select journey pattern based on weighted distribution
      const patternRand = Math.random() * 100;
      cumulativeWeight = 0;
      let selectedPattern = JOURNEY_PATTERNS[0];

      for (const pattern of JOURNEY_PATTERNS) {
        cumulativeWeight += pattern.percentage;
        if (patternRand <= cumulativeWeight) {
          selectedPattern = pattern;
          break;
        }
      }

      // Generate session data
      const session = generateVisitorSession(selectedPattern, selectedLocation);
      const pageViews = generatePageViews(session);
      const engagementScore = calculateEngagementScore(pageViews, session);

      // Calculate session metrics
      const totalInteractions = pageViews.reduce((sum, pv) => sum + pv.interactions.length, 0);
      const bounceRate = pageViews.length === 1 ? 1.0 : 0.0;
      const conversionValue = session.hasConverted ? 
        pageViews.reduce((sum, pv) => sum + pv.conversionValue, 0) : 0;

      // Select random organization
      const organization = organizations[Math.floor(Math.random() * organizations.length)];

      // Create visitor session record
      await prisma.mCPVisitorSessions.create({
        data: {
          id: randomUUID(),
          sessionId: session.sessionId,
          organizationId: organization.id,
          fingerprint: session.fingerprint,
          ipAddress: session.ipAddress,
          userAgent: generateUserAgent(session.deviceType, session.browser),
          device: session.deviceType,
          browser: session.browser,
          os: getOSFromDevice(session.deviceType),
          city: session.location.city,
          country: session.location.country,
          region: session.location.region,
          timezone: session.location.timezone,
          sessionStart: session.sessionStart,
          sessionEnd: new Date(session.sessionStart.getTime() + session.sessionDuration),
          duration: Math.round(session.sessionDuration / 1000), // Convert to seconds
          pagesViewed: session.pagesVisited,
          interactions: totalInteractions,
          engagementScore: engagementScore,
          conversionValue: conversionValue,
          bounceRate: bounceRate,
          trafficSource: session.trafficSource.source,
          trafficMedium: session.trafficSource.medium,
          referrer: generateReferrer(session.trafficSource),
          utmCampaign: generateUTMCampaign(session.trafficSource),
          pageViews: JSON.stringify(pageViews),
          journeyPattern: selectedPattern.type,
          characteristics: JSON.stringify(session.characteristics),
          isActive: isSessionActive(session.sessionStart),
          hasConverted: session.hasConverted,
          calculatedAt: new Date(),
          lastUpdated: new Date()
        }
      });

      sessionsCreated++;

      if (sessionsCreated % 50 === 0) {
        console.log(`  📈 Created ${sessionsCreated}/${totalSessions} sessions...`);
      }
    }

    console.log(`✅ Successfully created ${sessionsCreated} visitor session records`);

    // Display analytics summary
    const sessionStats = await prisma.mCPVisitorSessions.groupBy({
      by: ['journeyPattern'],
      _count: { journeyPattern: true },
      _avg: { engagementScore: true, duration: true },
      orderBy: { _count: { journeyPattern: 'desc' } }
    });

    console.log('\n📊 Session Pattern Distribution:');
    sessionStats.forEach(stat => {
      const percentage = ((stat._count.journeyPattern / sessionsCreated) * 100).toFixed(1);
      console.log(`  ${stat.journeyPattern}: ${stat._count.journeyPattern} sessions (${percentage}%)`);
      console.log(`    Avg Engagement: ${stat._avg.engagementScore?.toFixed(1)}/100`);
      console.log(`    Avg Duration: ${Math.round((stat._avg.duration || 0) / 60)} minutes`);
    });

    // Display conversion metrics
    const conversionStats = await prisma.mCPVisitorSessions.aggregate({
      _count: { hasConverted: true },
      _avg: { conversionValue: true },
      where: { hasConverted: true }
    });

    const totalConversions = await prisma.mCPVisitorSessions.count({
      where: { hasConverted: true }
    });

    console.log('\n🎯 Conversion Metrics:');
    console.log(`  Total Conversions: ${totalConversions}`);
    console.log(`  Conversion Rate: ${((totalConversions / sessionsCreated) * 100).toFixed(2)}%`);
    console.log(`  Avg Conversion Value: ${conversionStats._avg.conversionValue?.toFixed(1) || 0}`);

    // Sample sessions
    const sampleSessions = await prisma.mCPVisitorSessions.findMany({
      take: 3,
      orderBy: { engagementScore: 'desc' }
    });

    console.log('\n🏆 Top Engagement Sessions:');
    sampleSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.city}, ${session.country} (${session.device})`);
      console.log(`     Pattern: ${session.journeyPattern} | Engagement: ${session.engagementScore}/100`);
      console.log(`     Duration: ${Math.round(session.duration / 60)} min | Pages: ${session.pagesViewed} | Converted: ${session.hasConverted ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding MCP visitor sessions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper functions
 */
function generateUserAgent(deviceType: string, browser: string): string {
  const versions = {
    Chrome: '120.0.6099.109',
    Safari: '17.2.1',
    Firefox: '121.0',
    Edge: '120.0.2210.77',
    Opera: '106.0.4998.16'
  };

  if (deviceType === 'mobile') {
    if (browser === 'Safari') {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${versions.Safari} Mobile/15E148 Safari/604.1`;
    } else {
      return `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.Chrome} Mobile Safari/537.36`;
    }
  } else if (deviceType === 'tablet') {
    return `Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${versions.Safari} Mobile/15E148 Safari/604.1`;
  } else {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versions.Chrome} Safari/537.36`;
  }
}

function getOSFromDevice(deviceType: string): string {
  if (deviceType === 'mobile') {
    return Math.random() < 0.7 ? 'Android' : 'iOS';
  } else if (deviceType === 'tablet') {
    return Math.random() < 0.6 ? 'iOS' : 'Android';
  } else {
    return Math.random() < 0.8 ? 'Windows' : 'macOS';
  }
}

function generateReferrer(trafficSource: any): string {
  const referrers = {
    google: 'https://www.google.com/',
    facebook: 'https://m.facebook.com/',
    linkedin: 'https://www.linkedin.com/',
    twitter: 'https://t.co/',
    whatsapp: 'https://wa.me/',
    email: 'https://mail.google.com/',
    direct: ''
  };

  return referrers[trafficSource.source as keyof typeof referrers] || '';
}

function generateUTMCampaign(trafficSource: any): string | null {
  if (trafficSource.medium === 'organic') return null;
  
  const campaigns = {
    social: ['african_expansion_2024', 'social_awareness_campaign', 'community_outreach'],
    email: ['newsletter_cta', 'product_announcement', 're_engagement'],
    referral: ['partner_referral', 'word_of_mouth', 'affiliate_program']
  };

  const mediumCampaigns = campaigns[trafficSource.medium as keyof typeof campaigns];
  if (!mediumCampaigns) return null;

  return mediumCampaigns[Math.floor(Math.random() * mediumCampaigns.length)];
}

function isSessionActive(sessionStart: Date): boolean {
  const now = new Date();
  const sessionAge = now.getTime() - sessionStart.getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  
  // 10% chance of being active if session was in last 30 minutes
  return sessionAge < thirtyMinutes && Math.random() < 0.1;
}

// Run the seeding script
if (require.main === module) {
  seedMCPVisitorSessions()
    .then(() => {
      console.log('🎉 MCP Visitor Sessions seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedMCPVisitorSessions;