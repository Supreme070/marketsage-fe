/**
 * BehavioralPredictor
 * Advanced behavioral prediction and analysis system
 */

import { PrismaClient, ActivityType } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

interface BehaviorPrediction {
  predictions: {
    nextBestAction: string;
    churnRisk: number;
    lifetimeValue: number;
    engagementScore: number;
    nextPurchaseDate?: Date;
  };
  segments: string[];
  confidenceScores: {
    [key: string]: number;
  };
  insights: string[];
}

export class BehavioralPredictor {
  /**
   * Predict user behavior based on historical data and current context
   */
  async predictBehavior(userId: string): Promise<BehaviorPrediction> {
    try {
      // Get user's historical data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          EmailCampaign: true,
          SMSCampaign: true,
          WhatsAppCampaign: true,
          Contact: true,
          List: true,
          Segment: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get all activities across channels
      const emailActivities = await prisma.emailActivity.findMany({
        where: {
          campaignId: {
            in: user.EmailCampaign.map(c => c.id)
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      const smsActivities = await prisma.sMSActivity.findMany({
        where: {
          campaignId: {
            in: user.SMSCampaign.map(c => c.id)
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      const waActivities = await prisma.whatsAppActivity.findMany({
        where: {
          campaignId: {
            in: user.WhatsAppCampaign.map(c => c.id)
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      // Calculate engagement metrics
      const engagementScore = this.calculateEngagementScore(emailActivities, smsActivities, waActivities);
      
      // Predict churn risk
      const churnRisk = this.predictChurnRisk(emailActivities, smsActivities, waActivities);
      
      // Calculate customer lifetime value
      const lifetimeValue = this.calculateLifetimeValue(user);
      
      // Determine next best action
      const nextBestAction = this.determineNextBestAction(emailActivities, smsActivities, waActivities, churnRisk);
      
      // Predict next purchase
      const nextPurchaseDate = this.predictNextPurchase(user);
      
      // Segment user
      const segments = this.segmentUser(user, engagementScore, churnRisk);

      return {
        predictions: {
          nextBestAction,
          churnRisk,
          lifetimeValue,
          engagementScore,
          nextPurchaseDate
        },
        segments,
        confidenceScores: {
          nextBestAction: 0.85,
          churnRisk: 0.9,
          lifetimeValue: 0.8,
          engagementScore: 0.95
        },
        insights: this.generateInsights(user, churnRisk, engagementScore)
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error in behavioral prediction:', { error: error.message });
      } else {
        logger.error('Unknown error in behavioral prediction');
      }
      throw error;
    }
  }

  private calculateEngagementScore(
    emailActivities: any[],
    smsActivities: any[],
    waActivities: any[]
  ): number {
    const allActivities = [...emailActivities, ...smsActivities, ...waActivities];
    const recentActivities = allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 30); // Last 30 activities
    
    const metrics = {
      frequency: recentActivities.length / 30, // Activities per day
      recency: this.calculateRecency(recentActivities),
      duration: this.calculateAverageSessionDuration(recentActivities),
      interaction: this.calculateInteractionDepth(recentActivities)
    };
    
    return (
      (metrics.frequency * 0.3) +
      (metrics.recency * 0.3) +
      (metrics.duration * 0.2) +
      (metrics.interaction * 0.2)
    );
  }

  private predictChurnRisk(
    emailActivities: any[],
    smsActivities: any[],
    waActivities: any[]
  ): number {
    const allActivities = [...emailActivities, ...smsActivities, ...waActivities];
    
    const signals = {
      activityDecline: this.calculateActivityDecline(allActivities),
      engagementDrop: this.calculateEngagementDrop(allActivities),
      negativeFeedback: this.calculateNegativeFeedback(allActivities)
    };
    
    return (
      (signals.activityDecline * 0.4) +
      (signals.engagementDrop * 0.4) +
      (signals.negativeFeedback * 0.2)
    );
  }

  private calculateLifetimeValue(user: any): number {
    // Calculate total value from all campaigns
    const emailValue = user.EmailCampaign.reduce((sum: number, campaign: any) => {
      try {
        const metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
        return sum + (metadata.revenue || 0);
      } catch {
        return sum;
      }
    }, 0);
    
    const smsValue = user.SMSCampaign.reduce((sum: number, campaign: any) => {
      try {
        const metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
        return sum + (metadata.revenue || 0);
      } catch {
        return sum;
      }
    }, 0);
    
    const waValue = user.WhatsAppCampaign.reduce((sum: number, campaign: any) => {
      try {
        const metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
        return sum + (metadata.revenue || 0);
      } catch {
        return sum;
      }
    }, 0);
    
    const totalValue = emailValue + smsValue + waValue;
    const monthsSinceJoining = this.calculateMonthsBetween(
      new Date(user.createdAt),
      new Date()
    );
    
    return totalValue / (monthsSinceJoining || 1);
  }

  private determineNextBestAction(
    emailActivities: any[],
    smsActivities: any[],
    waActivities: any[],
    churnRisk: number
  ): string {
    const allActivities = [...emailActivities, ...smsActivities, ...waActivities];
    
    if (churnRisk > 0.7) {
      return 'RETENTION_CAMPAIGN';
    } else if (this.hasRecentActivity(allActivities)) {
      return 'CROSS_CHANNEL_CAMPAIGN';
    } else if (this.hasLowEngagement(allActivities)) {
      return 'REENGAGEMENT_CAMPAIGN';
    }
    return 'NURTURE_CAMPAIGN';
  }

  private predictNextPurchase(user: any): Date | undefined {
    const allCampaigns = [
      ...user.EmailCampaign,
      ...user.SMSCampaign,
      ...user.WhatsAppCampaign
    ].filter(c => c.status === 'SENT');
    
    if (allCampaigns.length < 2) return undefined;
    
    const sortedCampaigns = allCampaigns.sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
    
    const intervals = [];
    for (let i = 1; i < sortedCampaigns.length; i++) {
      intervals.push(
        new Date(sortedCampaigns[i-1].sentAt).getTime() -
        new Date(sortedCampaigns[i].sentAt).getTime()
      );
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return new Date(Date.now() + avgInterval);
  }

  private segmentUser(user: any, engagementScore: number, churnRisk: number): string[] {
    const segments = [];
    
    // Value-based segmentation
    if (engagementScore > 0.8) segments.push('HIGH_VALUE');
    else if (engagementScore > 0.5) segments.push('MEDIUM_VALUE');
    else segments.push('LOW_VALUE');
    
    // Lifecycle segmentation
    if (churnRisk > 0.7) segments.push('AT_RISK');
    else if (churnRisk < 0.3) segments.push('LOYAL');
    
    // Channel preference
    if (user.EmailCampaign.length > 0) segments.push('EMAIL_USER');
    if (user.SMSCampaign.length > 0) segments.push('SMS_USER');
    if (user.WhatsAppCampaign.length > 0) segments.push('WHATSAPP_USER');
    
    // Multi-channel engagement
    const channelCount = [
      user.EmailCampaign.length > 0,
      user.SMSCampaign.length > 0,
      user.WhatsAppCampaign.length > 0
    ].filter(Boolean).length;
    
    if (channelCount >= 2) segments.push('MULTI_CHANNEL');
    
    return segments;
  }

  private generateInsights(user: any, churnRisk: number, engagementScore: number): string[] {
    const insights = [];
    
    // Risk insights
    if (churnRisk > 0.7) {
      insights.push('High risk of churn - immediate attention required');
    }
    
    // Engagement insights
    if (engagementScore < 0.3) {
      insights.push('Low engagement - consider re-engagement campaign');
    }
    
    // Channel insights
    const channels = {
      email: user.EmailCampaign.length,
      sms: user.SMSCampaign.length,
      whatsapp: user.WhatsAppCampaign.length
    };
    
    const preferredChannel = Object.entries(channels)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    insights.push(`Preferred channel: ${preferredChannel.toUpperCase()}`);
    
    // Growth opportunities
    if (channels.email === 0) {
      insights.push('Opportunity: No email campaigns yet');
    }
    if (channels.sms === 0) {
      insights.push('Opportunity: No SMS campaigns yet');
    }
    if (channels.whatsapp === 0) {
      insights.push('Opportunity: No WhatsApp campaigns yet');
    }
    
    return insights;
  }

  // Helper methods
  private calculateRecency(activities: any[]): number {
    if (activities.length === 0) return 0;
    const mostRecent = new Date(activities[0].timestamp).getTime();
    const now = Date.now();
    const daysSinceLastActivity = (now - mostRecent) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceLastActivity / 30));
  }

  private calculateAverageSessionDuration(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    const sessions = activities.filter(a => 
      a.type === ActivityType.OPENED || a.type === ActivityType.CLICKED
    );
    if (sessions.length === 0) return 0;
    
    // Assume average session duration of 2 minutes for opens and 5 minutes for clicks
    const totalDuration = sessions.reduce((sum, s) => 
      sum + (s.type === ActivityType.CLICKED ? 5 : 2), 0);
    
    return Math.min(totalDuration / (sessions.length * 5), 1); // Normalize to 0-1
  }

  private calculateInteractionDepth(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    const interactionTypes = new Set(activities.map(a => a.type)).size;
    return Math.min(interactionTypes / 5, 1); // Normalize to 0-1 (max 5 types)
  }

  private calculateActivityDecline(activities: any[]): number {
    const recent = activities.slice(0, 30).length;
    const historical = activities.slice(30, 60).length;
    if (historical === 0) return 0;
    return Math.max(0, (historical - recent) / historical);
  }

  private calculateEngagementDrop(activities: any[]): number {
    const recent = activities.slice(0, 30);
    const historical = activities.slice(30, 60);
    
    const recentScore = this.calculateEngagementScore(recent, [], []);
    const historicalScore = this.calculateEngagementScore(historical, [], []);
    
    if (historicalScore === 0) return 0;
    return Math.max(0, (historicalScore - recentScore) / historicalScore);
  }

  private calculateNegativeFeedback(activities: any[]): number {
    const negativeTypes = [
      ActivityType.BOUNCED,
      ActivityType.UNSUBSCRIBED,
      ActivityType.FAILED
    ];
    const negative = activities.filter(a => negativeTypes.includes(a.type)).length;
    return negative / Math.max(activities.length, 1);
  }

  private hasRecentActivity(activities: any[]): boolean {
    if (activities.length === 0) return false;
    
    const mostRecent = new Date(activities[0].timestamp).getTime();
    const daysSinceLastActivity = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
    return daysSinceLastActivity < 7; // Within last week
  }

  private hasLowEngagement(activities: any[]): boolean {
    const last30Days = activities.filter(a => 
      (Date.now() - new Date(a.timestamp).getTime()) < (30 * 24 * 60 * 60 * 1000)
    );
    
    return last30Days.length < 5; // Less than 5 activities in last 30 days
  }

  private calculateMonthsBetween(date1: Date, date2: Date): number {
    return (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }
} 