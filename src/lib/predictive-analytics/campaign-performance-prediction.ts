/**
 * Campaign Performance Prediction Service
 * 
 * Predicts key performance metrics for campaigns before they are sent,
 * including open rates, click rates, conversion rates, and potential revenue.
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { PredictionModelType, getActiveModel, savePrediction } from './index';

// Types for campaign prediction
export interface CampaignPredictionResult {
  campaignId: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue?: number;
  factors: CampaignFactor[];
  confidence: number;
  predictionId: string;
}

export interface CampaignFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export interface PerformanceRange {
  min: number;
  max: number;
  likely: number;
}

/**
 * Predict performance metrics for an email campaign
 */
export async function predictCampaignPerformance(
  campaignId: string
): Promise<CampaignPredictionResult> {
  try {
    logger.info(`Generating performance prediction for campaign ${campaignId}`);
    
    // Get the active campaign prediction model
    const model = await getActiveModel(PredictionModelType.CAMPAIGN_PERFORMANCE);
    
    // Get campaign data for prediction
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        subject: true,
        content: true,
        createdById: true,
        templateId: true,
        // Include related data needed for prediction
        lists: {
          select: {
            id: true,
            name: true
          }
        },
        segments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Get template data if used
    let template = null;
    if (campaign.templateId) {
      template = await prisma.emailTemplate.findUnique({
        where: { id: campaign.templateId },
        select: {
          id: true,
          name: true,
          subject: true,
          content: true
        }
      });
    }
    
    // Get historical campaign data from the same user/organization
    const historicalCampaigns = await prisma.emailCampaign.findMany({
      where: {
        createdById: campaign.createdById,
        status: 'SENT',
        sentAt: { not: null }
      },
      select: {
        id: true,
        subject: true,
        _count: {
          select: {
            activities: true
          }
        },
        activities: {
          select: {
            type: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 10
    });
    
    // Extract features for prediction
    const features = extractCampaignFeatures(campaign, template, historicalCampaigns);
    
    // Run prediction model
    const prediction = await runCampaignModel(features, model.id);
    
    // Generate explanation factors
    const factors = generateCampaignFactors(features, prediction);
    
    // Save prediction to database
    const predictionId = await savePrediction(
      model.id,
      'email_campaign',
      campaignId,
      PredictionModelType.CAMPAIGN_PERFORMANCE,
      prediction.openRate, // Using open rate as the main value
      prediction.confidence,
      features,
      factors.map(f => f.name)
    );
    
    // Save specific campaign prediction details
    const campaignPrediction = await prisma.campaignPerformancePrediction.create({
      data: {
        id: randomUUID(),
        campaignId,
        openRate: prediction.openRate,
        clickRate: prediction.clickRate,
        conversionRate: prediction.conversionRate,
        revenue: prediction.revenue,
        factors: JSON.stringify(factors),
        createdAt: new Date()
      }
    });
    
    logger.info(`Campaign performance prediction created for ${campaignId}`, {
      predictionId,
      openRate: prediction.openRate,
      clickRate: prediction.clickRate
    });
    
    return {
      campaignId,
      openRate: prediction.openRate,
      clickRate: prediction.clickRate,
      conversionRate: prediction.conversionRate,
      revenue: prediction.revenue,
      factors,
      confidence: prediction.confidence,
      predictionId
    };
  } catch (error) {
    logger.error(`Error predicting performance for campaign ${campaignId}`, error);
    throw new Error(`Failed to predict campaign performance: ${(error as Error).message}`);
  }
}

/**
 * Get performance predictions for campaigns
 */
export async function getCampaignPredictions(campaignIds?: string[]): Promise<CampaignPredictionResult[]> {
  try {
    const whereClause = campaignIds?.length 
      ? { campaignId: { in: campaignIds } }
      : {};
    
    const predictions = await prisma.campaignPerformancePrediction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      distinct: ['campaignId'],
      take: 100
    });
    
    return predictions.map(p => ({
      campaignId: p.campaignId,
      openRate: p.openRate || 0,
      clickRate: p.clickRate || 0,
      conversionRate: p.conversionRate || 0,
      revenue: p.revenue || undefined,
      factors: JSON.parse(p.factors),
      confidence: 0.8, // Default confidence since it's not stored
      predictionId: p.id
    }));
  } catch (error) {
    logger.error(`Error getting campaign predictions`, error);
    throw new Error(`Failed to get campaign predictions: ${(error as Error).message}`);
  }
}

/**
 * Get performance prediction ranges for different list segments
 */
export async function predictCampaignSegmentPerformance(
  campaignId: string,
  segmentIds: string[]
): Promise<Record<string, PerformanceRange>> {
  try {
    // Get the base campaign prediction
    const basePrediction = await predictCampaignPerformance(campaignId);
    
    // Get data for each segment
    const segments = await prisma.segment.findMany({
      where: {
        id: { in: segmentIds }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    // For demo purposes, generate ranges for each segment
    const results: Record<string, PerformanceRange> = {};
    
    for (const segment of segments) {
      // Generate a performance range relative to base prediction
      // This is simplified; in production it would use real data analysis
      const modifier = Math.random() * 0.4 - 0.2; // -20% to +20%
      const baseRate = basePrediction.openRate;
      
      results[segment.id] = {
        min: Math.max(0, baseRate * (1 - 0.1 - Math.abs(modifier) * 0.5)),
        max: Math.min(1, baseRate * (1 + 0.1 + Math.abs(modifier) * 0.5)),
        likely: baseRate * (1 + modifier)
      };
    }
    
    return results;
  } catch (error) {
    logger.error(`Error predicting segment performance for campaign ${campaignId}`, error);
    throw new Error(`Failed to predict segment performance: ${(error as Error).message}`);
  }
}

// Helper functions

/**
 * Extract features for campaign performance prediction
 */
function extractCampaignFeatures(campaign: any, template: any, historicalCampaigns: any[]): Record<string, any> {
  // Use template subject/content if not in campaign
  const subject = campaign.subject || (template?.subject || '');
  const content = campaign.content || (template?.content || '');
  
  // Subject line features
  const subjectLength = subject.length;
  const hasPersonalization = /\[.*?\]|{.*?}/.test(subject);
  const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(subject); // Simple emoji detection
  const hasQuestion = subject.includes('?');
  const hasUrgency = /urgent|limited|now|today|last chance/i.test(subject);
  
  // Content features
  const contentLength = content.length;
  const hasImages = content.includes('img') || content.includes('image');
  const linkCount = (content.match(/href/g) || []).length;
  const ctaCount = (content.match(/button/g) || []).length;
  
    
  // Calculate historical performance metrics
  const historicalMetrics = calculateHistoricalMetrics(historicalCampaigns);
  
  // Audience size features
  const audienceSize = campaign.lists.length; // Simplified - would use actual counts
  const segmentCount = campaign.segments.length;
  
  return {
    subjectLength,
    hasPersonalization,
    hasEmoji,
    hasQuestion,
    hasUrgency,
    contentLength,
    hasImages,
    linkCount,
    ctaCount,
    historicalOpenRate: historicalMetrics.openRate,
    historicalClickRate: historicalMetrics.clickRate,
    audienceSize,
    segmentCount
  };
}

/**
 * Calculate historical campaign metrics
 */
function calculateHistoricalMetrics(campaigns: any[]): { openRate: number; clickRate: number } {
  if (!campaigns.length) {
    return { openRate: 0.2, clickRate: 0.05 }; // Default values if no history
  }
  
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  
  campaigns.forEach(campaign => {
    // Count activity types
    const sentCount = campaign.activities.filter(a => a.type === 'SENT').length;
    const openCount = campaign.activities.filter(a => a.type === 'OPENED').length;
    const clickCount = campaign.activities.filter(a => a.type === 'CLICKED').length;
    
    totalSent += sentCount;
    totalOpened += openCount;
    totalClicked += clickCount;
  });
  
  const openRate = totalSent > 0 ? totalOpened / totalSent : 0.2;
  const clickRate = totalOpened > 0 ? totalClicked / totalOpened : 0.05;
  
  return { openRate, clickRate };
}

/**
 * Run the campaign performance prediction model
 * (simplified implementation for demo purposes)
 */
async function runCampaignModel(features: any, modelId: string): Promise<{
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue?: number;
  confidence: number;
}> {
  // This is a simplified model for demonstration
  // In production, this would call a real ML model API or run a local model
  
  // Base rates from historical data or defaults
  let baseOpenRate = features.historicalOpenRate || 0.2;
  let baseClickRate = features.historicalClickRate || 0.05;
  
  // Adjust based on subject line features
  let openRateAdjustment = 0;
  
  if (features.hasPersonalization) openRateAdjustment += 0.05;
  if (features.hasEmoji) openRateAdjustment += 0.02;
  if (features.hasQuestion) openRateAdjustment += 0.03;
  if (features.hasUrgency) openRateAdjustment += 0.04;
  
  // Penalize very long or very short subject lines
  if (features.subjectLength > 70) openRateAdjustment -= 0.02;
  if (features.subjectLength < 20) openRateAdjustment -= 0.01;
  
  // Adjust click rate based on content features
  let clickRateAdjustment = 0;
  
  if (features.hasImages) clickRateAdjustment += 0.02;
  if (features.ctaCount > 0) clickRateAdjustment += 0.03;
  if (features.linkCount > 5) clickRateAdjustment += 0.02;
  
  // Penalize very long content
  if (features.contentLength > 3000) clickRateAdjustment -= 0.03;
  
  // Calculate predicted rates with adjustments
  const openRate = Math.min(0.9, Math.max(0.01, baseOpenRate + openRateAdjustment));
  const clickRate = Math.min(0.5, Math.max(0.01, baseClickRate + clickRateAdjustment));
  
  // Derive conversion rate from click rate (simplified)
  const conversionRate = clickRate * 0.2; // Assume 20% of clicks convert
  
  // Estimate revenue (if applicable)
  const revenue = conversionRate * 50; // Assume $50 average value per conversion
  
  // Calculate confidence based on amount of historical data
  const confidence = 0.5 + Math.min(0.4, features.historicalCampaignCount * 0.05);
  
  return {
    openRate: Number(openRate.toFixed(4)),
    clickRate: Number(clickRate.toFixed(4)), 
    conversionRate: Number(conversionRate.toFixed(4)),
    revenue: Number(revenue.toFixed(2)),
    confidence: Number(confidence.toFixed(2))
  };
}

/**
 * Generate explanation factors for the campaign prediction
 */
function generateCampaignFactors(features: any, prediction: any): CampaignFactor[] {
  const factors: CampaignFactor[] = [];
  
  // Subject line factors
  if (features.hasPersonalization) {
    factors.push({
      name: 'personalization',
      impact: 'positive',
      description: 'Personalization in subject line increases open rates',
      weight: 0.7
    });
  }
  
  if (features.hasUrgency) {
    factors.push({
      name: 'urgency',
      impact: 'positive',
      description: 'Urgency words in subject line drive action',
      weight: 0.6
    });
  }
  
  if (features.subjectLength > 70) {
    factors.push({
      name: 'subject_length',
      impact: 'negative',
      description: 'Subject line is too long (may get truncated)',
      weight: 0.5
    });
  }
  
  // Content factors
  if (features.hasImages) {
    factors.push({
      name: 'images',
      impact: 'positive',
      description: 'Visual content typically increases engagement',
      weight: 0.6
    });
  }
  
  if (features.ctaCount === 0) {
    factors.push({
      name: 'missing_cta',
      impact: 'negative',
      description: 'No clear call-to-action reduces click rates',
      weight: 0.8
    });
  } else if (features.ctaCount > 3) {
    factors.push({
      name: 'too_many_ctas',
      impact: 'negative',
      description: 'Too many CTAs can confuse recipients',
      weight: 0.4
    });
  }
  
  if (features.contentLength > 3000) {
    factors.push({
      name: 'content_length',
      impact: 'negative',
      description: 'Content is too long, may reduce engagement',
      weight: 0.5
    });
  }
  
  // Historical performance factor
  if (features.historicalOpenRate > 0.3) {
    factors.push({
      name: 'historical_performance',
      impact: 'positive',
      description: 'Past campaigns have performed well with this audience',
      weight: 0.8
    });
  } else if (features.historicalOpenRate < 0.15) {
    factors.push({
      name: 'historical_performance',
      impact: 'negative',
      description: 'Past campaigns have had low engagement with this audience',
      weight: 0.7
    });
  }
  
  return factors;
} 