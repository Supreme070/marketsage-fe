/**
 * Customer Profile Batch Processor
 * ================================
 * 
 * Nightly batch processing engine that runs every 2 days to:
 * - Update customer profiles with latest data
 * - Calculate engagement scores
 * - Detect churn risk
 * - Identify high-value customers
 * - Trigger birthday/anniversary campaigns
 * - Generate AI insights
 * 
 * Based on user's blueprint: Batch Processing (nightly cron jobs)
 */

import { prisma } from '@/lib/db/prisma';
import { SupremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';
import { getCustomerEventBus, CustomerEventType, EventPriority } from '@/lib/events/event-bus';
import { ContactEventListener } from '@/lib/events/listeners/contact-event-listener';
import { logger } from '@/lib/logger';

export interface CustomerProfileData {
  contactId: string;
  organizationId: string;
  totalTransactions: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastPurchaseDate?: Date;
  emailEngagementRate: number;
  smsEngagementRate: number;
  whatsappEngagementRate: number;
  websiteVisits: number;
  campaignInteractions: number;
  churnRiskScore: number;
  engagementScore: number;
  lifetimeValue: number;
  preferredChannel: 'email' | 'sms' | 'whatsapp' | 'website';
  customerSegment: string;
  behaviorTags: string[];
  nextBestActions: string[];
}

export interface BatchProcessingResult {
  totalContactsProcessed: number;
  profilesCreated: number;
  profilesUpdated: number;
  churnRisksDetected: number;
  highValueCustomersDetected: number;
  birthdayCampaignsTriggered: number;
  aiInsightsGenerated: number;
  errors: Array<{
    contactId: string;
    error: string;
  }>;
  executionTime: number;
  timestamp: Date;
}

/**
 * Customer Profile Batch Processor
 * 
 * Runs comprehensive analysis on all customer data every 2 days
 */
export class CustomerProfileProcessor {
  
  /**
   * Main entry point for batch processing
   */
  static async processBatch(organizationId?: string): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    
    logger.info('Starting customer profile batch processing', {
      organizationId: organizationId || 'all',
      timestamp: new Date().toISOString()
    });

    const result: BatchProcessingResult = {
      totalContactsProcessed: 0,
      profilesCreated: 0,
      profilesUpdated: 0,
      churnRisksDetected: 0,
      highValueCustomersDetected: 0,
      birthdayCampaignsTriggered: 0,
      aiInsightsGenerated: 0,
      errors: [],
      executionTime: 0,
      timestamp: new Date()
    };

    try {
      // Get all contacts to process
      const contacts = await CustomerProfileProcessor.getContactsToProcess(organizationId);
      result.totalContactsProcessed = contacts.length;

      logger.info('Processing customer profiles', {
        totalContacts: contacts.length,
        organizationId
      });

      // Process contacts in batches of 100
      const batchSize = 100;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        await CustomerProfileProcessor.processBatchOfContacts(batch, result);
        
        // Add small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      result.executionTime = Date.now() - startTime;

      logger.info('Customer profile batch processing completed', {
        ...result,
        organizationId
      });

      return result;

    } catch (error) {
      result.executionTime = Date.now() - startTime;
      
      logger.error('Customer profile batch processing failed', {
        error: error instanceof Error ? error.message : error,
        organizationId,
        executionTime: result.executionTime
      });

      throw error;
    }
  }

  /**
   * Get contacts that need profile processing
   */
  private static async getContactsToProcess(organizationId?: string): Promise<any[]> {
    const where = organizationId ? { organizationId } : {};
    
    return await prisma.contact.findMany({
      where: {
        ...where,
        isActive: true
      },
      include: {
        customerProfile: true,
        lists: true,
        segments: true,
        emailCampaigns: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        smsCampaigns: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        whatsappCampaigns: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Process a batch of contacts
   */
  private static async processBatchOfContacts(
    contacts: any[], 
    result: BatchProcessingResult
  ): Promise<void> {
    const promises = contacts.map(async (contact) => {
      try {
        await CustomerProfileProcessor.processContactProfile(contact, result);
      } catch (error) {
        result.errors.push({
          contactId: contact.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        logger.error('Failed to process contact profile', {
          contactId: contact.id,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Process individual contact profile
   */
  private static async processContactProfile(contact: any, result: BatchProcessingResult): Promise<void> {
    // Calculate customer profile data
    const profileData = await CustomerProfileProcessor.calculateProfileData(contact);
    
    // Update or create customer profile
    const existingProfile = contact.customerProfile;
    
    if (existingProfile) {
      // Update existing profile
      await CustomerProfileProcessor.updateCustomerProfile(existingProfile.id, profileData);
      result.profilesUpdated++;
    } else {
      // Create new profile
      await CustomerProfileProcessor.createCustomerProfile(profileData);
      result.profilesCreated++;
    }

    // Detect and trigger events based on profile changes
    await CustomerProfileProcessor.detectAndTriggerEvents(contact, profileData, result);
    
    // Generate AI insights for this customer
    await CustomerProfileProcessor.generateAIInsights(contact, profileData, result);
  }

  /**
   * Calculate comprehensive customer profile data
   */
  private static async calculateProfileData(contact: any): Promise<CustomerProfileData> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Get transaction data (mock for now - would integrate with actual transaction system)
    const transactionData = await CustomerProfileProcessor.getTransactionData(contact.id);
    
    // Calculate engagement metrics
    const emailEngagement = await CustomerProfileProcessor.calculateEmailEngagement(contact.id, thirtyDaysAgo);
    const smsEngagement = await CustomerProfileProcessor.calculateSMSEngagement(contact.id, thirtyDaysAgo);
    const whatsappEngagement = await CustomerProfileProcessor.calculateWhatsAppEngagement(contact.id, thirtyDaysAgo);
    
    // Calculate website engagement (mock data)
    const websiteVisits = Math.floor(Math.random() * 50);
    
    // Calculate overall engagement score (0-1)
    const engagementScore = CustomerProfileProcessor.calculateEngagementScore({
      emailEngagement,
      smsEngagement,
      whatsappEngagement,
      websiteVisits,
      transactionData
    });

    // Calculate churn risk score (0-1)
    const churnRiskScore = CustomerProfileProcessor.calculateChurnRisk({
      lastPurchaseDate: transactionData.lastPurchaseDate,
      engagementScore,
      transactionFrequency: transactionData.transactionCount,
      avgOrderValue: transactionData.avgOrderValue
    });

    // Determine preferred channel
    const preferredChannel = CustomerProfileProcessor.getPreferredChannel({
      emailEngagement,
      smsEngagement,
      whatsappEngagement,
      websiteVisits
    });

    // Calculate customer segment
    const customerSegment = CustomerProfileProcessor.calculateCustomerSegment({
      lifetimeValue: transactionData.totalRevenue,
      engagementScore,
      churnRiskScore,
      transactionCount: transactionData.transactionCount
    });

    // Generate behavior tags
    const behaviorTags = CustomerProfileProcessor.generateBehaviorTags({
      engagementScore,
      churnRiskScore,
      lifetimeValue: transactionData.totalRevenue,
      preferredChannel,
      transactionData
    });

    return {
      contactId: contact.id,
      organizationId: contact.organizationId,
      totalTransactions: transactionData.transactionCount,
      totalRevenue: transactionData.totalRevenue,
      avgOrderValue: transactionData.avgOrderValue,
      lastPurchaseDate: transactionData.lastPurchaseDate,
      emailEngagementRate: emailEngagement,
      smsEngagementRate: smsEngagement,
      whatsappEngagementRate: whatsappEngagement,
      websiteVisits,
      campaignInteractions: emailEngagement + smsEngagement + whatsappEngagement,
      churnRiskScore,
      engagementScore,
      lifetimeValue: transactionData.totalRevenue,
      preferredChannel,
      customerSegment,
      behaviorTags,
      nextBestActions: [] // Will be populated by AI
    };
  }

  /**
   * Get transaction data for customer (mock implementation)
   */
  private static async getTransactionData(contactId: string): Promise<{
    transactionCount: number;
    totalRevenue: number;
    avgOrderValue: number;
    lastPurchaseDate?: Date;
  }> {
    // Mock transaction data - in real implementation would query transaction system
    const transactionCount = Math.floor(Math.random() * 20);
    const totalRevenue = transactionCount * (Math.random() * 500 + 50);
    const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const lastPurchaseDate = transactionCount > 0 
      ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      : undefined;

    return {
      transactionCount,
      totalRevenue,
      avgOrderValue,
      lastPurchaseDate
    };
  }

  /**
   * Calculate email engagement rate
   */
  private static async calculateEmailEngagement(contactId: string, since: Date): Promise<number> {
    // Query actual email interaction data
    // For now, return mock data
    return Math.random() * 0.8; // 0-80% engagement rate
  }

  /**
   * Calculate SMS engagement rate
   */
  private static async calculateSMSEngagement(contactId: string, since: Date): Promise<number> {
    // Query actual SMS interaction data
    // For now, return mock data
    return Math.random() * 0.6; // 0-60% engagement rate
  }

  /**
   * Calculate WhatsApp engagement rate
   */
  private static async calculateWhatsAppEngagement(contactId: string, since: Date): Promise<number> {
    // Query actual WhatsApp interaction data
    // For now, return mock data
    return Math.random() * 0.7; // 0-70% engagement rate
  }

  /**
   * Calculate overall engagement score
   */
  private static calculateEngagementScore(data: {
    emailEngagement: number;
    smsEngagement: number;
    whatsappEngagement: number;
    websiteVisits: number;
    transactionData: any;
  }): number {
    const weights = {
      email: 0.3,
      sms: 0.2,
      whatsapp: 0.2,
      website: 0.2,
      transactions: 0.1
    };

    const normalizedWebsiteVisits = Math.min(data.websiteVisits / 50, 1);
    const normalizedTransactions = Math.min(data.transactionData.transactionCount / 10, 1);

    return (
      data.emailEngagement * weights.email +
      data.smsEngagement * weights.sms +
      data.whatsappEngagement * weights.whatsapp +
      normalizedWebsiteVisits * weights.website +
      normalizedTransactions * weights.transactions
    );
  }

  /**
   * Calculate churn risk score
   */
  private static calculateChurnRisk(data: {
    lastPurchaseDate?: Date;
    engagementScore: number;
    transactionFrequency: number;
    avgOrderValue: number;
  }): number {
    let riskScore = 0;

    // Time since last purchase
    if (data.lastPurchaseDate) {
      const daysSinceLastPurchase = Math.floor((Date.now() - data.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastPurchase > 90) riskScore += 0.4;
      else if (daysSinceLastPurchase > 60) riskScore += 0.3;
      else if (daysSinceLastPurchase > 30) riskScore += 0.2;
    } else {
      riskScore += 0.5; // No purchases
    }

    // Low engagement
    if (data.engagementScore < 0.2) riskScore += 0.3;
    else if (data.engagementScore < 0.4) riskScore += 0.2;

    // Low transaction frequency
    if (data.transactionFrequency === 0) riskScore += 0.2;
    else if (data.transactionFrequency < 2) riskScore += 0.1;

    return Math.min(riskScore, 1);
  }

  /**
   * Determine preferred communication channel
   */
  private static getPreferredChannel(data: {
    emailEngagement: number;
    smsEngagement: number;
    whatsappEngagement: number;
    websiteVisits: number;
  }): 'email' | 'sms' | 'whatsapp' | 'website' {
    const channels = [
      { channel: 'email' as const, score: data.emailEngagement },
      { channel: 'sms' as const, score: data.smsEngagement },
      { channel: 'whatsapp' as const, score: data.whatsappEngagement },
      { channel: 'website' as const, score: data.websiteVisits / 50 }
    ];

    return channels.sort((a, b) => b.score - a.score)[0].channel;
  }

  /**
   * Calculate customer segment
   */
  private static calculateCustomerSegment(data: {
    lifetimeValue: number;
    engagementScore: number;
    churnRiskScore: number;
    transactionCount: number;
  }): string {
    if (data.lifetimeValue > 5000 && data.engagementScore > 0.7) return 'VIP';
    if (data.lifetimeValue > 2000 && data.engagementScore > 0.5) return 'High Value';
    if (data.churnRiskScore > 0.7) return 'At Risk';
    if (data.engagementScore > 0.6) return 'Engaged';
    if (data.transactionCount === 0) return 'Prospect';
    return 'Regular';
  }

  /**
   * Generate behavior tags
   */
  private static generateBehaviorTags(data: {
    engagementScore: number;
    churnRiskScore: number;
    lifetimeValue: number;
    preferredChannel: string;
    transactionData: any;
  }): string[] {
    const tags: string[] = [];

    if (data.engagementScore > 0.8) tags.push('highly_engaged');
    if (data.engagementScore < 0.2) tags.push('low_engagement');
    if (data.churnRiskScore > 0.7) tags.push('churn_risk');
    if (data.lifetimeValue > 5000) tags.push('high_value');
    if (data.lifetimeValue > 1000) tags.push('valuable');
    if (data.transactionData.transactionCount === 0) tags.push('non_purchaser');
    if (data.transactionData.transactionCount > 10) tags.push('frequent_buyer');
    
    tags.push(`prefers_${data.preferredChannel}`);

    return tags;
  }

  /**
   * Update existing customer profile
   */
  private static async updateCustomerProfile(profileId: string, data: CustomerProfileData): Promise<void> {
    await prisma.customerProfile.update({
      where: { id: profileId },
      data: {
        totalTransactions: data.totalTransactions,
        totalRevenue: data.totalRevenue,
        avgOrderValue: data.avgOrderValue,
        lastPurchaseDate: data.lastPurchaseDate,
        emailEngagementRate: data.emailEngagementRate,
        smsEngagementRate: data.smsEngagementRate,
        whatsappEngagementRate: data.whatsappEngagementRate,
        websiteVisits: data.websiteVisits,
        campaignInteractions: data.campaignInteractions,
        churnRiskScore: data.churnRiskScore,
        engagementScore: data.engagementScore,
        lifetimeValue: data.lifetimeValue,
        preferredChannel: data.preferredChannel,
        customerSegment: data.customerSegment,
        behaviorTags: data.behaviorTags,
        nextBestActions: data.nextBestActions,
        lastUpdated: new Date(),
        profileCompleteness: CustomerProfileProcessor.calculateCompleteness(data),
        churnRisk: data.churnRiskScore > 0.7 ? 'high' : data.churnRiskScore > 0.4 ? 'medium' : 'low'
      }
    });
  }

  /**
   * Create new customer profile
   */
  private static async createCustomerProfile(data: CustomerProfileData): Promise<void> {
    await prisma.customerProfile.create({
      data: {
        contactId: data.contactId,
        organizationId: data.organizationId,
        totalTransactions: data.totalTransactions,
        totalRevenue: data.totalRevenue,
        avgOrderValue: data.avgOrderValue,
        lastPurchaseDate: data.lastPurchaseDate,
        emailEngagementRate: data.emailEngagementRate,
        smsEngagementRate: data.smsEngagementRate,
        whatsappEngagementRate: data.whatsappEngagementRate,
        websiteVisits: data.websiteVisits,
        campaignInteractions: data.campaignInteractions,
        churnRiskScore: data.churnRiskScore,
        engagementScore: data.engagementScore,
        lifetimeValue: data.lifetimeValue,
        preferredChannel: data.preferredChannel,
        customerSegment: data.customerSegment,
        behaviorTags: data.behaviorTags,
        nextBestActions: data.nextBestActions,
        firstInteraction: new Date(),
        lastInteraction: new Date(),
        lastUpdated: new Date(),
        profileCompleteness: CustomerProfileProcessor.calculateCompleteness(data),
        churnRisk: data.churnRiskScore > 0.7 ? 'high' : data.churnRiskScore > 0.4 ? 'medium' : 'low'
      }
    });
  }

  /**
   * Calculate profile completeness score
   */
  private static calculateCompleteness(data: CustomerProfileData): number {
    let score = 0.5; // Base score
    
    if (data.totalTransactions > 0) score += 0.2;
    if (data.emailEngagementRate > 0) score += 0.1;
    if (data.smsEngagementRate > 0) score += 0.1;
    if (data.websiteVisits > 0) score += 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Detect events and trigger appropriate actions
   */
  private static async detectAndTriggerEvents(
    contact: any, 
    profileData: CustomerProfileData, 
    result: BatchProcessingResult
  ): Promise<void> {
    // Detect churn risk
    if (profileData.churnRiskScore > 0.7) {
      await ContactEventListener.onChurnRiskDetected({
        contactId: contact.id,
        organizationId: contact.organizationId,
        riskLevel: 'high',
        riskScore: profileData.churnRiskScore,
        riskFactors: profileData.behaviorTags.filter(tag => 
          tag.includes('churn') || tag.includes('low_engagement') || tag.includes('non_purchaser')
        )
      });
      result.churnRisksDetected++;
    }

    // Detect high-value customers
    if (profileData.lifetimeValue > 2000 && profileData.engagementScore > 0.6) {
      await ContactEventListener.onHighValueDetected({
        contactId: contact.id,
        organizationId: contact.organizationId,
        lifetimeValue: profileData.lifetimeValue,
        valueSegment: profileData.customerSegment,
        recentPurchases: profileData.totalTransactions
      });
      result.highValueCustomersDetected++;
    }

    // Check for birthday campaigns
    if (contact.dateOfBirth) {
      const today = new Date();
      const birthday = new Date(contact.dateOfBirth);
      const isUpcomingBirthday = CustomerProfileProcessor.isUpcomingBirthday(birthday, today);
      
      if (isUpcomingBirthday) {
        await ContactEventListener.onBirthdayDetected({
          contactId: contact.id,
          organizationId: contact.organizationId,
          birthday: birthday,
          age: today.getFullYear() - birthday.getFullYear()
        });
        result.birthdayCampaignsTriggered++;
      }
    }
  }

  /**
   * Check if birthday is within next 7 days
   */
  private static isUpcomingBirthday(birthday: Date, today: Date): boolean {
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
    
    const daysToBirthday = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToNextYearBirthday = Math.floor((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return (daysToBirthday >= 0 && daysToBirthday <= 7) || (daysToNextYearBirthday >= 0 && daysToNextYearBirthday <= 7);
  }

  /**
   * Generate AI insights for customer
   */
  private static async generateAIInsights(
    contact: any, 
    profileData: CustomerProfileData, 
    result: BatchProcessingResult
  ): Promise<void> {
    try {
      // Use Supreme-AI v3 to generate insights and next best actions
      const aiResponse = await SupremeAIv3.process({
        type: 'analysis',
        userId: 'batch-processor',
        content: `Analyze customer profile and recommend next best actions: ${JSON.stringify({
          customerSegment: profileData.customerSegment,
          engagementScore: profileData.engagementScore,
          churnRiskScore: profileData.churnRiskScore,
          lifetimeValue: profileData.lifetimeValue,
          preferredChannel: profileData.preferredChannel,
          behaviorTags: profileData.behaviorTags,
          transactionHistory: {
            totalTransactions: profileData.totalTransactions,
            avgOrderValue: profileData.avgOrderValue,
            lastPurchaseDate: profileData.lastPurchaseDate
          }
        })}`
      });

      if (aiResponse.success) {
        // Parse AI recommendations
        const nextBestActions = CustomerProfileProcessor.parseAIRecommendations(aiResponse.data.answer);
        
        // Update customer profile with AI insights
        await prisma.customerProfile.updateMany({
          where: { contactId: contact.id },
          data: {
            nextBestActions,
            aiInsights: aiResponse.data.answer,
            lastAIAnalysis: new Date()
          }
        });

        result.aiInsightsGenerated++;
      }

    } catch (error) {
      logger.warn('Failed to generate AI insights for customer', {
        contactId: contact.id,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Parse AI recommendations into actionable items
   */
  private static parseAIRecommendations(aiResponse: string): string[] {
    const actions: string[] = [];
    const response = aiResponse.toLowerCase();

    if (response.includes('send email') || response.includes('email campaign')) {
      actions.push('send_personalized_email');
    }
    if (response.includes('offer discount') || response.includes('promotion')) {
      actions.push('offer_discount');
    }
    if (response.includes('follow up') || response.includes('contact')) {
      actions.push('schedule_follow_up');
    }
    if (response.includes('survey') || response.includes('feedback')) {
      actions.push('send_feedback_survey');
    }
    if (response.includes('upgrade') || response.includes('upsell')) {
      actions.push('upsell_opportunity');
    }
    if (response.includes('retention') || response.includes('re-engage')) {
      actions.push('retention_campaign');
    }

    return actions.length > 0 ? actions : ['monitor_engagement'];
  }
}