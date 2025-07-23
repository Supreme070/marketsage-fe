/**
 * Enhanced LeadPulse Engagement Scoring Engine
 * 
 * This module provides an accurate, multi-dimensional engagement scoring algorithm
 * that considers various behavioral factors, time decay, and contextual weights.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Scoring configuration
const SCORING_CONFIG = {
  // Action weights (0-100)
  actions: {
    PAGE_VIEW: 1,
    UNIQUE_PAGE_VIEW: 3,
    SCROLL_DEPTH_25: 2,
    SCROLL_DEPTH_50: 3,
    SCROLL_DEPTH_75: 5,
    SCROLL_DEPTH_100: 8,
    CLICK: 4,
    CTA_CLICK: 10,
    FORM_VIEW: 8,
    FORM_START: 15,
    FORM_SUBMIT: 30,
    FORM_ABANDON: -5,
    DOWNLOAD: 20,
    VIDEO_PLAY: 12,
    VIDEO_COMPLETE: 25,
    SOCIAL_SHARE: 15,
    COMMENT: 18,
    RETURN_VISIT: 5,
    DIRECT_VISIT: 8,
    REFERRAL_VISIT: 6,
    SEARCH_VISIT: 7,
    EMAIL_OPEN: 6,
    EMAIL_CLICK: 12,
    CHAT_INTERACTION: 20,
    PHONE_CALL: 40,
    DEMO_REQUEST: 50,
    PRICING_VIEW: 15,
    CHECKOUT_START: 35,
    PURCHASE: 100,
  },
  
  // Time-based decay factors
  timeDecay: {
    realTime: 1.0,      // Within 5 minutes
    recent: 0.9,        // Within 1 hour
    today: 0.8,         // Within 24 hours
    thisWeek: 0.6,      // Within 7 days
    thisMonth: 0.4,     // Within 30 days
    older: 0.2,         // Older than 30 days
  },
  
  // Session quality factors
  sessionQuality: {
    minDuration: 30,         // Minimum meaningful session (seconds)
    qualityDuration: 180,    // Quality session threshold (seconds)
    excellentDuration: 600,  // Excellent session threshold (seconds)
    bounceTime: 10,          // Bounce threshold (seconds)
  },
  
  // Engagement thresholds
  thresholds: {
    cold: 0,
    warm: 25,
    hot: 50,
    qualified: 75,
    highIntent: 90,
  },
  
  // Context multipliers
  contextMultipliers: {
    businessHours: 1.2,      // 9 AM - 5 PM local time
    afterHours: 0.8,         // Outside business hours
    weekend: 0.7,            // Weekend activity
    mobile: 0.9,             // Mobile device
    desktop: 1.1,            // Desktop device
    knownCompany: 1.5,       // Identified company
    targetIndustry: 1.3,     // Target industry match
    competitorResearch: 1.4, // Viewing competitor comparison
  },
  
  // Page value weights
  pageValues: {
    '/': 1,                    // Homepage
    '/pricing': 3,             // Pricing page
    '/demo': 4,                // Demo page
    '/contact': 3.5,           // Contact page
    '/features': 2,            // Features page
    '/case-studies': 2.5,      // Case studies
    '/blog': 1.5,              // Blog
    '/docs': 2,                // Documentation
    '/signup': 5,              // Signup page
    '/checkout': 5,            // Checkout page
  },
};

export interface EngagementScore {
  score: number;                    // 0-100 score
  category: 'cold' | 'warm' | 'hot' | 'qualified' | 'highIntent';
  breakdown: {
    behavioral: number;             // Activity-based score
    recency: number;               // Time-based score
    frequency: number;             // Visit frequency score
    depth: number;                 // Engagement depth score
    velocity: number;              // Engagement velocity score
  };
  factors: {
    totalActions: number;
    qualitySessions: number;
    averageSessionDuration: number;
    pageDepth: number;
    formInteractions: number;
    contentEngagement: number;
    channelEngagement: string[];
  };
  signals: {
    buyingIntent: boolean;
    researchMode: boolean;
    priceAware: boolean;
    multiSession: boolean;
    returning: boolean;
    engaged: boolean;
  };
  recommendations: string[];
  confidence: number;              // 0-1 confidence in score accuracy
  lastCalculated: Date;
}

export interface ScoringContext {
  visitorId: string;
  includeAnonymous?: boolean;
  timeRange?: number;              // Days to consider (default: 30)
  realTimeBoost?: boolean;         // Apply real-time scoring boost
}

export class EngagementScoringEngine {
  /**
   * Calculate comprehensive engagement score for a visitor
   */
  async calculateScore(context: ScoringContext): Promise<EngagementScore> {
    try {
      const { visitorId, includeAnonymous = true, timeRange = 30, realTimeBoost = true } = context;
      
      // Get visitor data
      const visitor = await this.getVisitorData(visitorId);
      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }
      
      // Get touchpoints within time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      
      const touchpoints = await prisma.leadPulseTouchpoint.findMany({
        where: {
          anonymousVisitorId: visitorId,
          timestamp: { gte: cutoffDate },
        },
        orderBy: { timestamp: 'desc' },
      });
      
      // Calculate score components
      const behavioral = await this.calculateBehavioralScore(touchpoints, visitor);
      const recency = this.calculateRecencyScore(touchpoints);
      const frequency = this.calculateFrequencyScore(touchpoints, timeRange);
      const depth = this.calculateDepthScore(touchpoints);
      const velocity = this.calculateVelocityScore(touchpoints);
      
      // Apply real-time boost if enabled and visitor is currently active
      let finalScore = this.combineScores({ behavioral, recency, frequency, depth, velocity });
      if (realTimeBoost && this.isCurrentlyActive(touchpoints)) {
        finalScore = Math.min(100, finalScore * 1.15);
      }
      
      // Determine category
      const category = this.determineCategory(finalScore);
      
      // Extract factors
      const factors = this.extractFactors(touchpoints, visitor);
      
      // Detect signals
      const signals = this.detectSignals(touchpoints, factors);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(finalScore, signals, factors);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(touchpoints, timeRange);
      
      return {
        score: Math.round(finalScore),
        category,
        breakdown: {
          behavioral: Math.round(behavioral),
          recency: Math.round(recency),
          frequency: Math.round(frequency),
          depth: Math.round(depth),
          velocity: Math.round(velocity),
        },
        factors,
        signals,
        recommendations,
        confidence,
        lastCalculated: new Date(),
      };
    } catch (error) {
      logger.error('Error calculating engagement score:', error);
      throw error;
    }
  }
  
  /**
   * Batch calculate scores for multiple visitors
   */
  async batchCalculateScores(visitorIds: string[]): Promise<Map<string, EngagementScore>> {
    const scores = new Map<string, EngagementScore>();
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < visitorIds.length; i += batchSize) {
      const batch = visitorIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id => 
        this.calculateScore({ visitorId: id })
          .then(score => scores.set(id, score))
          .catch(error => logger.error(`Error calculating score for ${id}:`, error))
      );
      await Promise.all(batchPromises);
    }
    
    return scores;
  }
  
  /**
   * Update visitor's engagement score in the database
   */
  async updateVisitorScore(visitorId: string): Promise<void> {
    try {
      const score = await this.calculateScore({ visitorId });
      
      await prisma.anonymousVisitor.update({
        where: { id: visitorId },
        data: {
          engagementScore: score.score,
          score: score.score,
          metadata: {
            ...score,
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Error updating visitor score:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  private async getVisitorData(visitorId: string) {
    return prisma.anonymousVisitor.findUnique({
      where: { id: visitorId },
    });
  }
  
  private async calculateBehavioralScore(touchpoints: any[], visitor: any): Promise<number> {
    let score = 0;
    const processedActions = new Set<string>();
    
    for (const touchpoint of touchpoints) {
      const actionType = this.getActionType(touchpoint);
      const actionWeight = SCORING_CONFIG.actions[actionType] || 1;
      
      // Apply time decay
      const timeDecay = this.getTimeDecay(touchpoint.timestamp);
      
      // Apply context multipliers
      const contextMultiplier = this.getContextMultiplier(touchpoint, visitor);
      
      // Apply page value multiplier
      const pageMultiplier = this.getPageValueMultiplier(touchpoint.url);
      
      // Calculate action score
      let actionScore = actionWeight * timeDecay * contextMultiplier * pageMultiplier;
      
      // Prevent duplicate high-value actions from inflating score
      const actionKey = `${actionType}_${touchpoint.url}`;
      if (processedActions.has(actionKey) && actionWeight > 10) {
        actionScore *= 0.5; // Reduce weight of duplicate high-value actions
      }
      processedActions.add(actionKey);
      
      score += actionScore;
    }
    
    // Normalize to 0-100 scale
    return Math.min(100, score / 10);
  }
  
  private calculateRecencyScore(touchpoints: any[]): number {
    if (touchpoints.length === 0) return 0;
    
    const mostRecent = new Date(touchpoints[0].timestamp);
    const hoursSinceLastActivity = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastActivity < 0.1) return 100;      // Within 6 minutes
    if (hoursSinceLastActivity < 1) return 90;         // Within 1 hour
    if (hoursSinceLastActivity < 24) return 70;        // Within 1 day
    if (hoursSinceLastActivity < 72) return 50;        // Within 3 days
    if (hoursSinceLastActivity < 168) return 30;       // Within 1 week
    if (hoursSinceLastActivity < 720) return 10;       // Within 30 days
    return 0;
  }
  
  private calculateFrequencyScore(touchpoints: any[], timeRange: number): number {
    const uniqueDays = new Set(
      touchpoints.map(tp => new Date(tp.timestamp).toDateString())
    ).size;
    
    const frequencyRate = uniqueDays / timeRange;
    
    if (frequencyRate > 0.8) return 100;      // Daily visitor
    if (frequencyRate > 0.5) return 80;       // Every other day
    if (frequencyRate > 0.2) return 60;       // Weekly
    if (frequencyRate > 0.1) return 40;       // Bi-weekly
    if (frequencyRate > 0.03) return 20;      // Monthly
    return 0;
  }
  
  private calculateDepthScore(touchpoints: any[]): number {
    const uniquePages = new Set(touchpoints.map(tp => tp.url)).size;
    const formInteractions = touchpoints.filter(tp => 
      tp.type === 'FORM_VIEW' || tp.type === 'FORM_START' || tp.type === 'FORM_SUBMIT'
    ).length;
    const contentActions = touchpoints.filter(tp =>
      tp.type === 'CLICK' || tp.type === 'DOWNLOAD' || tp.metadata?.scrollDepth > 50
    ).length;
    
    let score = 0;
    score += Math.min(50, uniquePages * 5);           // Up to 50 points for page diversity
    score += Math.min(30, formInteractions * 10);     // Up to 30 points for form engagement
    score += Math.min(20, contentActions * 2);        // Up to 20 points for content engagement
    
    return score;
  }
  
  private calculateVelocityScore(touchpoints: any[]): number {
    if (touchpoints.length < 2) return 0;
    
    // Group touchpoints by session (30 minute gaps)
    const sessions = this.groupIntoSessions(touchpoints);
    
    // Calculate average actions per session
    const avgActionsPerSession = touchpoints.length / sessions.length;
    
    // Calculate session velocity (how quickly they progress through funnel)
    let velocityScore = 0;
    
    if (avgActionsPerSession > 10) velocityScore = 100;
    else if (avgActionsPerSession > 5) velocityScore = 70;
    else if (avgActionsPerSession > 3) velocityScore = 40;
    else if (avgActionsPerSession > 1) velocityScore = 20;
    
    return velocityScore;
  }
  
  private getActionType(touchpoint: any): string {
    // Map touchpoint data to action types
    if (touchpoint.type === 'FORM_SUBMIT') return 'FORM_SUBMIT';
    if (touchpoint.type === 'FORM_START') return 'FORM_START';
    if (touchpoint.type === 'FORM_VIEW') return 'FORM_VIEW';
    if (touchpoint.type === 'CLICK' && touchpoint.metadata?.isCTA) return 'CTA_CLICK';
    if (touchpoint.type === 'CLICK') return 'CLICK';
    if (touchpoint.type === 'PAGEVIEW' && touchpoint.metadata?.isReturn) return 'RETURN_VISIT';
    if (touchpoint.type === 'PAGEVIEW' && touchpoint.url?.includes('/pricing')) return 'PRICING_VIEW';
    if (touchpoint.type === 'PAGEVIEW') return 'PAGE_VIEW';
    
    // Check for special actions in metadata
    if (touchpoint.metadata?.action) return touchpoint.metadata.action;
    
    return 'PAGE_VIEW';
  }
  
  private getTimeDecay(timestamp: Date): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const minutes = age / (1000 * 60);
    const hours = minutes / 60;
    const days = hours / 24;
    
    if (minutes < 5) return SCORING_CONFIG.timeDecay.realTime;
    if (hours < 1) return SCORING_CONFIG.timeDecay.recent;
    if (days < 1) return SCORING_CONFIG.timeDecay.today;
    if (days < 7) return SCORING_CONFIG.timeDecay.thisWeek;
    if (days < 30) return SCORING_CONFIG.timeDecay.thisMonth;
    return SCORING_CONFIG.timeDecay.older;
  }
  
  private getContextMultiplier(touchpoint: any, visitor: any): number {
    let multiplier = 1;
    
    // Business hours check (assuming UTC for now)
    const hour = new Date(touchpoint.timestamp).getHours();
    if (hour >= 9 && hour <= 17) {
      multiplier *= SCORING_CONFIG.contextMultipliers.businessHours;
    } else {
      multiplier *= SCORING_CONFIG.contextMultipliers.afterHours;
    }
    
    // Device type
    if (visitor.metadata?.device === 'Desktop') {
      multiplier *= SCORING_CONFIG.contextMultipliers.desktop;
    } else if (visitor.metadata?.device === 'Mobile') {
      multiplier *= SCORING_CONFIG.contextMultipliers.mobile;
    }
    
    // Known company
    if (visitor.metadata?.company) {
      multiplier *= SCORING_CONFIG.contextMultipliers.knownCompany;
    }
    
    return multiplier;
  }
  
  private getPageValueMultiplier(url: string): number {
    if (!url) return 1;
    
    // Check exact matches first
    if (SCORING_CONFIG.pageValues[url]) {
      return SCORING_CONFIG.pageValues[url];
    }
    
    // Check partial matches
    for (const [pattern, value] of Object.entries(SCORING_CONFIG.pageValues)) {
      if (url.includes(pattern)) {
        return value;
      }
    }
    
    return 1;
  }
  
  private combineScores(scores: { behavioral: number; recency: number; frequency: number; depth: number; velocity: number }): number {
    // Weighted combination of all score components
    const weights = {
      behavioral: 0.35,
      recency: 0.25,
      frequency: 0.15,
      depth: 0.15,
      velocity: 0.10,
    };
    
    return Object.entries(scores).reduce((total, [key, value]) => {
      return total + (value * weights[key as keyof typeof weights]);
    }, 0);
  }
  
  private determineCategory(score: number): EngagementScore['category'] {
    if (score >= SCORING_CONFIG.thresholds.highIntent) return 'highIntent';
    if (score >= SCORING_CONFIG.thresholds.qualified) return 'qualified';
    if (score >= SCORING_CONFIG.thresholds.hot) return 'hot';
    if (score >= SCORING_CONFIG.thresholds.warm) return 'warm';
    return 'cold';
  }
  
  private extractFactors(touchpoints: any[], visitor: any): EngagementScore['factors'] {
    const sessions = this.groupIntoSessions(touchpoints);
    const qualitySessions = sessions.filter(s => {
      const duration = this.calculateSessionDuration(s);
      return duration >= SCORING_CONFIG.sessionQuality.qualityDuration;
    });
    
    const totalDuration = sessions.reduce((sum, session) => 
      sum + this.calculateSessionDuration(session), 0
    );
    
    const uniquePages = new Set(touchpoints.map(tp => tp.url)).size;
    const formInteractions = touchpoints.filter(tp => 
      tp.type?.includes('FORM')
    ).length;
    
    const contentEngagement = touchpoints.filter(tp =>
      tp.type === 'CLICK' || 
      tp.type === 'DOWNLOAD' || 
      (tp.metadata?.scrollDepth && tp.metadata.scrollDepth > 50)
    ).length;
    
    const channelEngagement = Array.from(new Set(
      touchpoints.map(tp => tp.metadata?.channel || 'direct').filter(Boolean)
    ));
    
    return {
      totalActions: touchpoints.length,
      qualitySessions: qualitySessions.length,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      pageDepth: uniquePages,
      formInteractions,
      contentEngagement,
      channelEngagement,
    };
  }
  
  private detectSignals(touchpoints: any[], factors: EngagementScore['factors']): EngagementScore['signals'] {
    const pricingViews = touchpoints.filter(tp => 
      tp.url?.includes('/pricing') || tp.url?.includes('/plans')
    ).length;
    
    const demoRequests = touchpoints.filter(tp =>
      tp.url?.includes('/demo') || tp.type === 'DEMO_REQUEST'
    ).length;
    
    const researchPages = touchpoints.filter(tp =>
      tp.url?.includes('/features') || 
      tp.url?.includes('/case-studies') ||
      tp.url?.includes('/compare')
    ).length;
    
    return {
      buyingIntent: pricingViews > 0 || demoRequests > 0,
      researchMode: researchPages > 2,
      priceAware: pricingViews > 1,
      multiSession: factors.qualitySessions > 1,
      returning: touchpoints.some(tp => tp.metadata?.isReturn),
      engaged: factors.contentEngagement > 5,
    };
  }
  
  private generateRecommendations(score: number, signals: EngagementScore['signals'], factors: EngagementScore['factors']): string[] {
    const recommendations: string[] = [];
    
    if (score >= 75 && signals.buyingIntent) {
      recommendations.push('High-intent visitor - initiate sales outreach immediately');
    }
    
    if (score >= 50 && signals.researchMode) {
      recommendations.push('Research mode detected - provide educational content');
    }
    
    if (signals.priceAware && !signals.buyingIntent) {
      recommendations.push('Price-sensitive visitor - consider offering discount or trial');
    }
    
    if (factors.formInteractions > 0 && factors.formInteractions < 3) {
      recommendations.push('Form abandonment risk - simplify form or offer assistance');
    }
    
    if (signals.multiSession && score < 50) {
      recommendations.push('Returning but not engaged - personalize content based on interests');
    }
    
    if (factors.channelEngagement.length > 2) {
      recommendations.push('Multi-channel visitor - ensure consistent messaging across channels');
    }
    
    if (score < 25) {
      recommendations.push('Low engagement - consider re-engagement campaign or different approach');
    }
    
    return recommendations;
  }
  
  private calculateConfidence(touchpoints: any[], timeRange: number): number {
    // Base confidence on data quality and quantity
    let confidence = 0.5;
    
    // More touchpoints = higher confidence
    if (touchpoints.length > 50) confidence += 0.2;
    else if (touchpoints.length > 20) confidence += 0.15;
    else if (touchpoints.length > 10) confidence += 0.1;
    else if (touchpoints.length > 5) confidence += 0.05;
    
    // Longer observation period = higher confidence
    if (timeRange >= 30) confidence += 0.15;
    else if (timeRange >= 14) confidence += 0.1;
    else if (timeRange >= 7) confidence += 0.05;
    
    // Recent activity = higher confidence
    const mostRecent = touchpoints[0]?.timestamp;
    if (mostRecent) {
      const hoursSinceLastActivity = (Date.now() - new Date(mostRecent).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastActivity < 24) confidence += 0.1;
      else if (hoursSinceLastActivity < 72) confidence += 0.05;
    }
    
    return Math.min(0.95, confidence);
  }
  
  private isCurrentlyActive(touchpoints: any[]): boolean {
    if (touchpoints.length === 0) return false;
    
    const mostRecent = new Date(touchpoints[0].timestamp);
    const minutesSinceLastActivity = (Date.now() - mostRecent.getTime()) / (1000 * 60);
    
    return minutesSinceLastActivity < 5;
  }
  
  private groupIntoSessions(touchpoints: any[], gapMinutes = 30): any[][] {
    if (touchpoints.length === 0) return [];
    
    const sessions: any[][] = [];
    let currentSession: any[] = [touchpoints[0]];
    
    for (let i = 1; i < touchpoints.length; i++) {
      const timeDiff = new Date(touchpoints[i-1].timestamp).getTime() - 
                      new Date(touchpoints[i].timestamp).getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff > gapMinutes) {
        sessions.push(currentSession);
        currentSession = [touchpoints[i]];
      } else {
        currentSession.push(touchpoints[i]);
      }
    }
    
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    return sessions;
  }
  
  private calculateSessionDuration(session: any[]): number {
    if (session.length === 0) return 0;
    
    const start = new Date(session[session.length - 1].timestamp).getTime();
    const end = new Date(session[0].timestamp).getTime();
    
    return (end - start) / 1000; // Return duration in seconds
  }
}

// Export singleton instance
export const engagementScoringEngine = new EngagementScoringEngine();