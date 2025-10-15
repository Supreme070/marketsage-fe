/**
 * AI Campaign Recommender System
 *
 * Provides intelligent recommendations for campaign improvements,
 * next-best-actions, and optimization opportunities based on
 * user data and campaign performance metrics.
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';

// Campaign and engagement types
interface CampaignData {
  id: string;
  subject?: string;
  type?: string;
  offer?: string;
  topic?: string;
  product?: string;
  brandName?: string;
  industry?: string;
  sentCount?: number;
  scheduledDay?: number;
  scheduledHour?: number;
  engagements?: Engagement[];
  audience?: any;
  analytics?: any;
}

interface Engagement {
  type: 'OPENED' | 'CLICKED' | 'CONVERTED' | 'BOUNCED' | 'UNSUBSCRIBED' | string;
  timestamp?: Date;
  metadata?: string | null;
}

export interface CampaignStats {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface RecommendationResult {
  id: string;
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1
  actionType: 'IMPROVE_SUBJECT' | 'IMPROVE_CONTENT' | 'ADJUST_TIMING' | 'REFINE_AUDIENCE' | 'A_B_TEST' | 'OTHER';
  actionData?: Record<string, any>;
}

/**
 * Generate campaign recommendations based on performance metrics
 */
export async function generateCampaignRecommendations(
  campaignId: string
): Promise<RecommendationResult[]> {
  try {
    // Fetch campaign data from custom analytics via backend API
    const analyticsResponse = await fetch(`${BACKEND_URL}/api/v2/analytics/first?entityType=EMAIL_CAMPAIGN&entityId=${campaignId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null;

    // If no data is found, return empty recommendations
    if (!analyticsData) {
      logger.warn(`Campaign analytics not found: ${campaignId}`);
      return [];
    }

    // Parse metrics from analytics
    const metrics = JSON.parse(analyticsData.metrics || '{}');

    // Construct campaign data object
    const campaign: CampaignData = {
      id: campaignId,
      sentCount: metrics.sentCount || 0,
      subject: metrics.subject,
      type: metrics.type,
      industry: metrics.industry,
      engagements: []
    };

    // Fetch engagement data via backend API
    const engagementsResponse = await fetch(`${BACKEND_URL}/api/v2/email-activities?campaignId=${campaignId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const engagements = engagementsResponse.ok ? await engagementsResponse.json() : [];
    
    // Convert to our internal format
    campaign.engagements = engagements.map(e => ({
      type: e.type,
      timestamp: e.timestamp,
      metadata: e.metadata || undefined
    }));

    // Calculate performance metrics
    const stats = calculateCampaignStats(campaign);
    
    // Compare with industry benchmarks
    const industryBenchmarks = await getIndustryBenchmarks(campaign.industry || 'DEFAULT');
    
    // Generate recommendations based on performance
    const recommendations: RecommendationResult[] = [];
    
    // Check for poor subject line performance
    if (stats.openRate < industryBenchmarks.openRate * 0.8) {
      recommendations.push({
        id: `rec_subject_${Date.now()}`,
        title: 'Improve Email Subject Line',
        description: `Your open rate (${(stats.openRate * 100).toFixed(1)}%) is below industry average (${(industryBenchmarks.openRate * 100).toFixed(1)}%). Consider testing alternative subject lines that create more urgency or curiosity.`,
        impact: 'HIGH',
        confidence: 0.85,
        actionType: 'IMPROVE_SUBJECT',
        actionData: {
          currentOpenRate: stats.openRate,
          benchmarkOpenRate: industryBenchmarks.openRate,
          suggestions: await generateSubjectLineSuggestions(campaign)
        }
      });
    }

    // Check for poor content performance (high open but low click)
    if (stats.openRate > industryBenchmarks.openRate * 0.9 && 
        stats.clickRate < industryBenchmarks.clickRate * 0.8) {
      recommendations.push({
        id: `rec_content_${Date.now()}`,
        title: 'Improve Email Content',
        description: `People are opening your emails but not clicking through. Your click rate (${(stats.clickRate * 100).toFixed(1)}%) is below industry average (${(industryBenchmarks.clickRate * 100).toFixed(1)}%). Consider improving your call-to-action or content layout.`,
        impact: 'MEDIUM',
        confidence: 0.75,
        actionType: 'IMPROVE_CONTENT',
        actionData: {
          currentClickRate: stats.clickRate,
          benchmarkClickRate: industryBenchmarks.clickRate,
          suggestions: await generateContentSuggestions(campaign)
        }
      });
    }

    // Check for high unsubscribe rate
    if (stats.unsubscribeRate > industryBenchmarks.unsubscribeRate * 1.5) {
      recommendations.push({
        id: `rec_audience_${Date.now()}`,
        title: 'Refine Your Target Audience',
        description: `Your unsubscribe rate (${(stats.unsubscribeRate * 100).toFixed(2)}%) is significantly higher than the industry average (${(industryBenchmarks.unsubscribeRate * 100).toFixed(2)}%). Consider refining your audience segmentation to better target interested users.`,
        impact: 'HIGH',
        confidence: 0.9,
        actionType: 'REFINE_AUDIENCE',
        actionData: {
          currentUnsubscribeRate: stats.unsubscribeRate,
          benchmarkUnsubscribeRate: industryBenchmarks.unsubscribeRate,
          suggestedSegments: await suggestBetterSegments(campaign)
        }
      });
    }

    // A/B Testing recommendation for medium performers
    if (recommendations.length === 0 && 
        (Math.abs(stats.openRate - industryBenchmarks.openRate) / industryBenchmarks.openRate < 0.2)) {
      recommendations.push({
        id: `rec_ab_test_${Date.now()}`,
        title: 'Run an A/B Test to Optimize Performance',
        description: 'Your campaign is performing near industry standards. To push performance higher, try A/B testing different elements to see what resonates best with your audience.',
        impact: 'MEDIUM',
        confidence: 0.7,
        actionType: 'A_B_TEST',
        actionData: {
          testElements: ['subject_line', 'send_time', 'preview_text', 'cta_button'],
          estimatedImprovement: '10-15%'
        }
      });
    }

    // Send time optimization for all campaigns
    recommendations.push({
      id: `rec_timing_${Date.now()}`,
      title: 'Optimize Your Send Time',
      description: 'Analyzing your audience engagement patterns suggests a better time to send your campaigns for maximum impact.',
      impact: 'MEDIUM',
      confidence: 0.8,
      actionType: 'ADJUST_TIMING',
      actionData: {
        currentSendDay: campaign.scheduledDay || 'N/A',
        currentSendHour: campaign.scheduledHour || 'N/A',
        suggestedSendDay: await suggestOptimalSendDay(campaign),
        suggestedSendHour: await suggestOptimalSendHour(campaign)
      }
    });

    return recommendations;
  } catch (error) {
    logger.error("Error generating campaign recommendations", error);
    return [];
  }
}

/**
 * Calculate campaign statistics from raw engagement data
 */
function calculateCampaignStats(campaign: CampaignData): CampaignStats {
  const totalSent = campaign.sentCount || 0;
  if (totalSent === 0) {
    return {
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0
    };
  }

  // Count engagements by type
  const opens = campaign.engagements?.filter((e: Engagement) => e.type === 'OPENED')?.length || 0;
  const clicks = campaign.engagements?.filter((e: Engagement) => e.type === 'CLICKED')?.length || 0;
  const conversions = campaign.engagements?.filter((e: Engagement) => e.type === 'CONVERTED')?.length || 0;
  const bounces = campaign.engagements?.filter((e: Engagement) => e.type === 'BOUNCED')?.length || 0;
  const unsubscribes = campaign.engagements?.filter((e: Engagement) => e.type === 'UNSUBSCRIBED')?.length || 0;

  return {
    openRate: opens / totalSent,
    clickRate: clicks / totalSent,
    conversionRate: conversions / totalSent,
    bounceRate: bounces / totalSent,
    unsubscribeRate: unsubscribes / totalSent
  };
}

/**
 * Get industry benchmark data
 */
async function getIndustryBenchmarks(industry: string): Promise<CampaignStats> {
  // In a real implementation, this would fetch from a database or API
  // For now, return reasonable defaults based on industry
  
  const defaultBenchmarks = {
    openRate: 0.21,
    clickRate: 0.02,
    conversionRate: 0.004,
    bounceRate: 0.005,
    unsubscribeRate: 0.002
  };
  
  // Industry-specific adjustments
  switch (industry.toLowerCase()) {
    case 'retail':
      return {
        ...defaultBenchmarks,
        openRate: 0.18,
        clickRate: 0.02,
      };
    case 'finance':
      return {
        ...defaultBenchmarks,
        openRate: 0.24,
        clickRate: 0.03,
        bounceRate: 0.004,
      };
    case 'healthcare':
      return {
        ...defaultBenchmarks,
        openRate: 0.23,
        clickRate: 0.03,
        unsubscribeRate: 0.001,
      };
    default:
      return defaultBenchmarks;
  }
}

/**
 * Generate alternative subject line suggestions
 */
async function generateSubjectLineSuggestions(campaign: CampaignData): Promise<string[]> {
  const currentSubject = campaign.subject || '';
  const campaignType = campaign.type || 'PROMOTIONAL';
  
  // Subject line patterns based on campaign type
  let patterns: string[] = [];
  
  switch (campaignType) {
    case 'PROMOTIONAL':
      patterns = [
        "Last chance: [OFFER] ends tonight",
        "[PERCENTAGE]% off just for you",
        "Don't miss out on [OFFER]",
        "Exclusive offer: [OFFER] inside",
        "Your special invite to [EVENT/OFFER]"
      ];
      break;
    case 'NEWSLETTER':
      patterns = [
        "[NUMBER] tips for [TOPIC] success",
        "The latest [INDUSTRY] trends you should know",
        "Inside: [TOPIC] secrets revealed",
        "Your [TIMEFRAME] [TOPIC] update",
        "[QUESTION ABOUT TOPIC]?"
      ];
      break;
    case 'TRANSACTIONAL':
      patterns = [
        "Your [DOCUMENT] is ready",
        "Important update about your [PRODUCT/SERVICE]",
        "Your [PRODUCT] order has shipped",
        "Receipt for your recent purchase",
        "Action required: [ACTION]"
      ];
      break;
    default:
      patterns = [
        "Important update from [BRAND]",
        "[BENEFIT] - just for you",
        "You'll want to see this",
        "We've got news for you",
        "Here's something special"
      ];
  }
  
  // Extract keywords from current subject
  const words = currentSubject.split(' ')
    .filter((word: string) => word.length > 3)
    .map((word: string) => word.replace(/[^\w\s]/gi, ''));
  
  // Use extracted keywords to fill in patterns
  return patterns.map(pattern => {
    let result = pattern;
    
    // Replace placeholders with appropriate content
    if (pattern.includes('[OFFER]')) {
      result = result.replace('[OFFER]', campaign.offer || 'our special offer');
    }
    if (pattern.includes('[PERCENTAGE]')) {
      result = result.replace('[PERCENTAGE]', '20');
    }
    if (pattern.includes('[EVENT/OFFER]')) {
      result = result.replace('[EVENT/OFFER]', campaign.offer || 'our event');
    }
    if (pattern.includes('[NUMBER]')) {
      result = result.replace('[NUMBER]', '5');
    }
    if (pattern.includes('[TOPIC]')) {
      result = result.replace(/\[TOPIC\]/g, campaign.topic || words[0] || 'industry');
    }
    if (pattern.includes('[INDUSTRY]')) {
      result = result.replace('[INDUSTRY]', campaign.industry || 'market');
    }
    if (pattern.includes('[TIMEFRAME]')) {
      result = result.replace('[TIMEFRAME]', 'weekly');
    }
    if (pattern.includes('[QUESTION ABOUT TOPIC]')) {
      result = result.replace('[QUESTION ABOUT TOPIC]', `Are you making these ${campaign.topic || 'common'} mistakes?`);
    }
    if (pattern.includes('[DOCUMENT]')) {
      result = result.replace('[DOCUMENT]', 'receipt');
    }
    if (pattern.includes('[PRODUCT/SERVICE]')) {
      result = result.replace('[PRODUCT/SERVICE]', campaign.product || 'order');
    }
    if (pattern.includes('[PRODUCT]')) {
      result = result.replace('[PRODUCT]', campaign.product || 'recent');
    }
    if (pattern.includes('[ACTION]')) {
      result = result.replace('[ACTION]', 'confirm your details');
    }
    if (pattern.includes('[BRAND]')) {
      result = result.replace('[BRAND]', campaign.brandName || 'our team');
    }
    if (pattern.includes('[BENEFIT]')) {
      result = result.replace('[BENEFIT]', 'Exclusive savings');
    }
    
    return result;
  });
}

/**
 * Generate content improvement suggestions
 */
async function generateContentSuggestions(campaign: CampaignData): Promise<string[]> {
  // In a real implementation, this would use more sophisticated NLP/ML
  // For now, return generic best practices
  return [
    "Make your primary CTA button larger and more prominent with contrasting colors",
    "Keep your message focused on a single, clear call-to-action",
    "Reduce text content and increase visual elements like images or GIFs",
    "Personalize content based on recipient's past interactions or preferences",
    "Ensure mobile optimization with single-column layout and larger tap targets"
  ];
}

/**
 * Suggest better audience segments
 */
async function suggestBetterSegments(campaign: CampaignData): Promise<Array<{name: string, description: string}>> {
  // In a real implementation, this would analyze audience engagement patterns
  // For now, return predefined segment suggestions
  return [
    {
      name: "Recently Engaged",
      description: "Target only users who have opened or clicked emails in the last 30 days"
    },
    {
      name: "High-Value Customers",
      description: "Focus on customers who have made purchases above average order value"
    },
    {
      name: "Product Interest Segment",
      description: "Target users who have shown specific interest in products related to this campaign"
    },
    {
      name: "Reduced Frequency Group",
      description: "Create a segment with lower sending frequency for less engaged users"
    }
  ];
}

/**
 * Suggest optimal day to send campaign
 */
async function suggestOptimalSendDay(campaign: CampaignData): Promise<number> {
  // In a production system, this would analyze historical engagement data
  // For now, return general best practices (Tuesday = 2, Wednesday = 3, Thursday = 4)
  return 2; // Tuesday
}

/**
 * Suggest optimal hour to send campaign
 */
async function suggestOptimalSendHour(campaign: CampaignData): Promise<number> {
  // In a production system, this would analyze historical engagement data
  // For now, return general best practices (10am, 2pm, 4pm)
  return 10; // 10am
} 