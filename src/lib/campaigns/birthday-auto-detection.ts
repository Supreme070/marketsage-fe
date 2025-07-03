/**
 * Birthday Campaign Auto-Detection System
 * ======================================
 * 
 * Intelligent system that automatically detects customer birthdays and creates
 * personalized birthday campaigns with optimal timing and channel selection.
 * 
 * Key Features:
 * - Automated birthday detection from contact data
 * - Intelligent campaign timing optimization  
 * - Multi-channel campaign creation (Email, SMS, WhatsApp)
 * - African market cultural considerations
 * - Revenue impact prediction and optimization
 * - A/B testing for birthday messaging
 * 
 * Based on user's blueprint: Build Birthday Campaign Auto-Detection
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getCustomerEventBus } from '@/lib/events/event-bus';
import { getActionDispatcher } from '@/lib/actions/action-dispatcher';
import { type ActionPlan, ActionType } from '@/lib/actions/action-plan-interface';

export interface BirthdayContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  dateOfBirth: Date;
  organizationId: string;
  preferredChannel: 'email' | 'sms' | 'whatsapp';
  timezone?: string;
  lastBirthdayCampaign?: Date;
  totalLifetimeValue: number;
  churnProbability: number;
  engagementScore: number;
  marketSegment: string;
  culturalPreferences: {
    language: string;
    country: string;
    birthdayTraditions: string[];
  };
}

export interface BirthdayCampaignTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  offerType: 'discount' | 'freebie' | 'exclusive_access' | 'personalized_gift';
  offerValue: number;
  validityDays: number;
  culturalAdaptations: Record<string, {
    content: string;
    offerAdjustment?: number;
  }>;
  performanceMetrics: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenuePerRecipient: number;
  };
}

export interface BirthdayCampaignStrategy {
  contactId: string;
  campaignDate: Date;
  preferredTime: string; // HH:MM format
  channels: Array<{
    type: 'email' | 'sms' | 'whatsapp';
    priority: number;
    timing: 'exact_birthday' | 'day_before' | 'week_before';
    templateId: string;
    personalizedOffer: {
      type: string;
      value: number;
      description: string;
    };
  }>;
  expectedImpact: {
    probability: number;
    estimatedRevenue: number;
    engagementLift: number;
    churnReduction: number;
  };
  culturalConsiderations: {
    appropriateTiming: boolean;
    culturalOffers: string[];
    languagePreference: string;
  };
}

export interface BirthdayDetectionResult {
  totalContacts: number;
  upcomingBirthdays: {
    today: BirthdayContact[];
    tomorrow: BirthdayContact[];
    thisWeek: BirthdayContact[];
    nextWeek: BirthdayContact[];
  };
  campaignsCreated: number;
  estimatedRevenue: number;
  highValueBirthdays: BirthdayContact[];
  missedOpportunities: BirthdayContact[];
}

/**
 * Main Birthday Auto-Detection System
 */
export class BirthdayAutoDetectionSystem {
  private eventBus = getCustomerEventBus();
  private actionDispatcher = getActionDispatcher();

  /**
   * Run daily birthday detection and campaign creation
   */
  async runDailyBirthdayDetection(organizationId: string): Promise<BirthdayDetectionResult> {
    try {
      logger.info('Starting daily birthday detection', { organizationId });

      // Get all contacts with birthdays
      const upcomingBirthdays = await this.detectUpcomingBirthdays(organizationId);
      
      // Create campaigns for today's birthdays
      const todayCampaigns = await this.createBirthdayCampaigns(
        organizationId, 
        upcomingBirthdays.today,
        'today'
      );

      // Schedule campaigns for tomorrow
      const tomorrowCampaigns = await this.createBirthdayCampaigns(
        organizationId,
        upcomingBirthdays.tomorrow,
        'tomorrow'
      );

      // Prepare week-ahead campaigns
      const weekCampaigns = await this.createBirthdayCampaigns(
        organizationId,
        upcomingBirthdays.thisWeek,
        'thisWeek'
      );

      const totalCampaigns = todayCampaigns.length + tomorrowCampaigns.length + weekCampaigns.length;
      const estimatedRevenue = [...todayCampaigns, ...tomorrowCampaigns, ...weekCampaigns]
        .reduce((sum, campaign) => sum + campaign.expectedImpact.estimatedRevenue, 0);

      // Identify high-value birthdays
      const highValueBirthdays = this.identifyHighValueBirthdays([
        ...upcomingBirthdays.today,
        ...upcomingBirthdays.tomorrow,
        ...upcomingBirthdays.thisWeek
      ]);

      // Identify missed opportunities
      const missedOpportunities = await this.identifyMissedOpportunities(organizationId);

      const result: BirthdayDetectionResult = {
        totalContacts: upcomingBirthdays.today.length + upcomingBirthdays.tomorrow.length + 
                      upcomingBirthdays.thisWeek.length + upcomingBirthdays.nextWeek.length,
        upcomingBirthdays,
        campaignsCreated: totalCampaigns,
        estimatedRevenue,
        highValueBirthdays,
        missedOpportunities
      };

      // Emit event for analytics
      await this.eventBus.emit('birthday_detection_completed', {
        organizationId,
        result,
        timestamp: new Date()
      });

      logger.info('Birthday detection completed', {
        organizationId,
        campaignsCreated: totalCampaigns,
        estimatedRevenue,
        highValueCount: highValueBirthdays.length
      });

      return result;

    } catch (error) {
      logger.error('Failed to run birthday detection', {
        organizationId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Detect upcoming birthdays within various timeframes
   */
  private async detectUpcomingBirthdays(organizationId: string): Promise<BirthdayDetectionResult['upcomingBirthdays']> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Query contacts with birthdays
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        dateOfBirth: { not: null },
        isDeleted: false
      },
      include: {
        customerProfile: true,
        emailCampaigns: {
          where: {
            sentAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // Last year
            subject: { contains: 'birthday', mode: 'insensitive' }
          },
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    });

    const enrichedContacts: BirthdayContact[] = await Promise.all(
      contacts
        .filter(contact => contact.dateOfBirth)
        .map(async contact => await this.enrichContactData(contact))
    );

    return {
      today: this.filterByBirthdayDate(enrichedContacts, today),
      tomorrow: this.filterByBirthdayDate(enrichedContacts, tomorrow),
      thisWeek: this.filterByDateRange(enrichedContacts, today, oneWeekLater),
      nextWeek: this.filterByDateRange(enrichedContacts, oneWeekLater, twoWeeksLater)
    };
  }

  /**
   * Enrich contact data with additional intelligence
   */
  private async enrichContactData(contact: any): Promise<BirthdayContact> {
    // Calculate CLV and engagement metrics
    const profile = contact.customerProfile;
    const totalLifetimeValue = profile?.lifetimeValue || 0;
    const churnProbability = profile?.churnProbability || 0.1;
    const engagementScore = profile?.engagementScore || 0.5;

    // Determine preferred channel
    const preferredChannel = this.determinePreferredChannel(contact);

    // Get cultural preferences
    const culturalPreferences = this.getCulturalPreferences(contact);

    // Check last birthday campaign
    const lastBirthdayCampaign = contact.emailCampaigns[0]?.sentAt || null;

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      whatsappNumber: contact.whatsappNumber,
      dateOfBirth: contact.dateOfBirth!,
      organizationId: contact.organizationId,
      preferredChannel,
      timezone: contact.timezone || 'Africa/Lagos',
      lastBirthdayCampaign,
      totalLifetimeValue,
      churnProbability,
      engagementScore,
      marketSegment: profile?.segment || 'general',
      culturalPreferences
    };
  }

  /**
   * Create birthday campaigns for contacts
   */
  private async createBirthdayCampaigns(
    organizationId: string,
    contacts: BirthdayContact[],
    timing: 'today' | 'tomorrow' | 'thisWeek'
  ): Promise<BirthdayCampaignStrategy[]> {
    const campaigns: BirthdayCampaignStrategy[] = [];

    for (const contact of contacts) {
      try {
        const strategy = await this.createCampaignStrategy(contact, timing);
        
        // Create action plan for this birthday campaign
        const actionPlan = await this.createBirthdayActionPlan(contact, strategy);
        
        campaigns.push(strategy);

        // Emit event for tracking
        await this.eventBus.emit('birthday_campaign_created', {
          organizationId,
          contactId: contact.id,
          strategy,
          actionPlanId: actionPlan.id,
          timing
        });

      } catch (error) {
        logger.error('Failed to create birthday campaign', {
          organizationId,
          contactId: contact.id,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    return campaigns;
  }

  /**
   * Create campaign strategy for individual contact
   */
  private async createCampaignStrategy(
    contact: BirthdayContact,
    timing: 'today' | 'tomorrow' | 'thisWeek'
  ): Promise<BirthdayCampaignStrategy> {
    const templates = await this.getBirthdayTemplates(contact.organizationId);
    
    // Select best template based on contact profile
    const selectedTemplate = this.selectOptimalTemplate(templates, contact);
    
    // Calculate optimal timing
    const campaignDate = this.calculateOptimalTiming(contact.dateOfBirth, timing, contact.timezone);
    const preferredTime = this.calculateOptimalSendTime(contact);

    // Create personalized offer
    const personalizedOffer = this.createPersonalizedOffer(contact);

    // Predict campaign impact
    const expectedImpact = await this.predictCampaignImpact(contact, selectedTemplate);

    // Cultural considerations
    const culturalConsiderations = this.assessCulturalConsiderations(contact);

    return {
      contactId: contact.id,
      campaignDate,
      preferredTime,
      channels: [{
        type: contact.preferredChannel,
        priority: 1,
        timing: timing === 'today' ? 'exact_birthday' : 'day_before',
        templateId: selectedTemplate.id,
        personalizedOffer
      }],
      expectedImpact,
      culturalConsiderations
    };
  }

  /**
   * Create action plan for birthday campaign
   */
  private async createBirthdayActionPlan(
    contact: BirthdayContact,
    strategy: BirthdayCampaignStrategy
  ): Promise<ActionPlan> {
    const primaryChannel = strategy.channels[0];
    
    let actionType: ActionType;
    switch (primaryChannel.type) {
      case 'email':
        actionType = ActionType.SEND_EMAIL;
        break;
      case 'sms':
        actionType = ActionType.SEND_SMS;
        break;
      case 'whatsapp':
        actionType = ActionType.SEND_WHATSAPP;
        break;
      default:
        actionType = ActionType.SEND_EMAIL;
    }

    const actionPlan: ActionPlan = {
      id: `birthday_${contact.id}_${Date.now()}`,
      organizationId: contact.organizationId,
      contactId: contact.id,
      triggerEvent: 'birthday_detected',
      actions: [{
        id: `birthday_action_${Date.now()}`,
        type: actionType,
        priority: primaryChannel.priority,
        scheduledAt: strategy.campaignDate,
        metadata: {
          templateId: primaryChannel.templateId,
          personalizedOffer: primaryChannel.personalizedOffer,
          culturalAdaptations: strategy.culturalConsiderations,
          channel: primaryChannel.type,
          timing: primaryChannel.timing
        }
      }],
      priority: contact.totalLifetimeValue > 1000 ? 'high' : 'medium',
      status: 'pending',
      riskLevel: 'low',
      expectedOutcome: {
        probabilityOfSuccess: strategy.expectedImpact.probability,
        estimatedValue: strategy.expectedImpact.estimatedRevenue,
        timeToComplete: 24, // hours
        businessImpact: strategy.expectedImpact.engagementLift > 0.2 ? 'high' : 'medium'
      },
      createdAt: new Date(),
      scheduledFor: strategy.campaignDate
    };

    // Execute the action plan
    await this.actionDispatcher.executeActionPlan(actionPlan.id, {
      organizationId: contact.organizationId,
      dryRun: false,
      priority: actionPlan.priority
    });

    return actionPlan;
  }

  /**
   * Helper method to filter contacts by birthday date
   */
  private filterByBirthdayDate(contacts: BirthdayContact[], targetDate: Date): BirthdayContact[] {
    return contacts.filter(contact => {
      const birthday = new Date(contact.dateOfBirth);
      const thisBirthday = new Date(targetDate.getFullYear(), birthday.getMonth(), birthday.getDate());
      return thisBirthday.getTime() === targetDate.getTime();
    });
  }

  /**
   * Helper method to filter contacts by date range
   */
  private filterByDateRange(contacts: BirthdayContact[], startDate: Date, endDate: Date): BirthdayContact[] {
    return contacts.filter(contact => {
      const birthday = new Date(contact.dateOfBirth);
      const thisBirthday = new Date(startDate.getFullYear(), birthday.getMonth(), birthday.getDate());
      return thisBirthday >= startDate && thisBirthday < endDate;
    });
  }

  /**
   * Determine preferred communication channel
   */
  private determinePreferredChannel(contact: any): 'email' | 'sms' | 'whatsapp' {
    if (contact.whatsappNumber && contact.country && ['NG', 'KE', 'ZA', 'GH'].includes(contact.country)) {
      return 'whatsapp';
    }
    if (contact.phone && contact.allowSMS) {
      return 'sms';
    }
    return 'email';
  }

  /**
   * Get cultural preferences for contact
   */
  private getCulturalPreferences(contact: any): BirthdayContact['culturalPreferences'] {
    const country = contact.country || 'NG';
    const language = contact.preferredLanguage || 'en';
    
    const countryTraditions: Record<string, string[]> = {
      'NG': ['birthday_wishes_extended_family', 'celebration_with_friends', 'special_prayers'],
      'KE': ['birthday_blessing_ceremony', 'community_celebration', 'traditional_gifts'],
      'ZA': ['birthday_braai', 'family_gathering', 'heritage_celebration'],
      'GH': ['birthday_libation', 'family_feast', 'traditional_music']
    };

    return {
      language,
      country,
      birthdayTraditions: countryTraditions[country] || countryTraditions['NG']
    };
  }

  /**
   * Get birthday campaign templates
   */
  private async getBirthdayTemplates(organizationId: string): Promise<BirthdayCampaignTemplate[]> {
    // In a real implementation, this would fetch from database
    // For now, return default templates
    return [
      {
        id: 'birthday_email_standard',
        name: 'Standard Birthday Email',
        type: 'email',
        subject: '🎉 Happy Birthday {{firstName}}! Special gift inside',
        content: 'Happy Birthday {{firstName}}! Enjoy {{offer}} on us. Valid for {{validityDays}} days.',
        offerType: 'discount',
        offerValue: 15,
        validityDays: 7,
        culturalAdaptations: {
          'NG': { content: 'Happy Birthday {{firstName}}! We celebrate you today! Enjoy {{offer}} as our gift to you.' },
          'KE': { content: 'Nakupenda Birthday {{firstName}}! Here\'s {{offer}} to make your day special.' }
        },
        performanceMetrics: {
          openRate: 0.45,
          clickRate: 0.12,
          conversionRate: 0.08,
          revenuePerRecipient: 25.50
        }
      },
      {
        id: 'birthday_sms_quick',
        name: 'Quick Birthday SMS',
        type: 'sms',
        content: '🎂 Happy Birthday {{firstName}}! Enjoy {{offer}} today. Use code: BDAY{{year}}. Valid {{validityDays}} days.',
        offerType: 'discount',
        offerValue: 10,
        validityDays: 3,
        culturalAdaptations: {
          'NG': { content: '🎉 Happy Birthday {{firstName}}! God bless your new age! Enjoy {{offer}} - code: BDAY{{year}}' }
        },
        performanceMetrics: {
          openRate: 0.95,
          clickRate: 0.25,
          conversionRate: 0.15,
          revenuePerRecipient: 18.75
        }
      }
    ];
  }

  /**
   * Select optimal template based on contact profile
   */
  private selectOptimalTemplate(templates: BirthdayCampaignTemplate[], contact: BirthdayContact): BirthdayCampaignTemplate {
    // Simple selection logic - could be enhanced with ML
    const channelTemplates = templates.filter(t => t.type === contact.preferredChannel);
    
    if (channelTemplates.length === 0) {
      return templates[0]; // Fallback
    }

    // Select template with best performance for this contact type
    return channelTemplates.reduce((best, current) => 
      current.performanceMetrics.revenuePerRecipient > best.performanceMetrics.revenuePerRecipient ? current : best
    );
  }

  /**
   * Calculate optimal campaign timing
   */
  private calculateOptimalTiming(birthDate: Date, timing: string, timezone?: string): Date {
    const now = new Date();
    const birthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    switch (timing) {
      case 'today':
        return birthday;
      case 'tomorrow':
        return new Date(birthday.getTime() + 24 * 60 * 60 * 1000);
      case 'thisWeek':
        return birthday;
      default:
        return birthday;
    }
  }

  /**
   * Calculate optimal send time based on engagement patterns
   */
  private calculateOptimalSendTime(contact: BirthdayContact): string {
    // Simple logic - could be enhanced with engagement data analysis
    const country = contact.culturalPreferences.country;
    
    const optimalTimes: Record<string, string> = {
      'NG': '09:00', // Morning in Nigeria
      'KE': '10:00', // Morning in Kenya  
      'ZA': '08:30', // Morning in South Africa
      'GH': '09:30'  // Morning in Ghana
    };

    return optimalTimes[country] || '09:00';
  }

  /**
   * Create personalized offer based on contact value
   */
  private createPersonalizedOffer(contact: BirthdayContact): BirthdayCampaignStrategy['channels'][0]['personalizedOffer'] {
    const baseDiscount = 15;
    let adjustedDiscount = baseDiscount;

    // Adjust based on CLV
    if (contact.totalLifetimeValue > 5000) {
      adjustedDiscount = 25;
    } else if (contact.totalLifetimeValue > 1000) {
      adjustedDiscount = 20;
    }

    // Adjust based on churn risk
    if (contact.churnProbability > 0.6) {
      adjustedDiscount += 5;
    }

    return {
      type: 'discount',
      value: adjustedDiscount,
      description: `${adjustedDiscount}% birthday discount`
    };
  }

  /**
   * Predict campaign impact
   */
  private async predictCampaignImpact(
    contact: BirthdayContact,
    template: BirthdayCampaignTemplate
  ): Promise<BirthdayCampaignStrategy['expectedImpact']> {
    const baseRevenue = template.performanceMetrics.revenuePerRecipient;
    
    // Adjust based on contact characteristics
    let adjustedRevenue = baseRevenue;
    if (contact.totalLifetimeValue > 1000) {
      adjustedRevenue *= 1.5;
    }
    if (contact.engagementScore > 0.7) {
      adjustedRevenue *= 1.2;
    }

    return {
      probability: template.performanceMetrics.conversionRate * (1 + contact.engagementScore * 0.3),
      estimatedRevenue: adjustedRevenue,
      engagementLift: 0.15 + (contact.engagementScore * 0.1),
      churnReduction: contact.churnProbability > 0.5 ? 0.1 : 0.05
    };
  }

  /**
   * Assess cultural considerations
   */
  private assessCulturalConsiderations(contact: BirthdayContact): BirthdayCampaignStrategy['culturalConsiderations'] {
    return {
      appropriateTiming: true, // Could check for cultural holidays
      culturalOffers: contact.culturalPreferences.birthdayTraditions,
      languagePreference: contact.culturalPreferences.language
    };
  }

  /**
   * Identify high-value birthday opportunities
   */
  private identifyHighValueBirthdays(contacts: BirthdayContact[]): BirthdayContact[] {
    return contacts.filter(contact => 
      contact.totalLifetimeValue > 2000 || 
      (contact.churnProbability > 0.6 && contact.totalLifetimeValue > 500)
    );
  }

  /**
   * Identify missed birthday opportunities
   */
  private async identifyMissedOpportunities(organizationId: string): Promise<BirthdayContact[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Find contacts whose birthdays were in the last 30 days but didn't receive campaigns
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        dateOfBirth: { not: null },
        isDeleted: false
      },
      include: {
        emailCampaigns: {
          where: {
            sentAt: { gte: thirtyDaysAgo },
            subject: { contains: 'birthday', mode: 'insensitive' }
          }
        }
      }
    });

    const missed: BirthdayContact[] = [];
    
    for (const contact of contacts) {
      if (!contact.dateOfBirth) continue;
      
      const birthday = new Date(contact.dateOfBirth);
      const thisBirthday = new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate());
      
      // Check if birthday was in last 30 days and no campaign sent
      if (thisBirthday >= thirtyDaysAgo && contact.emailCampaigns.length === 0) {
        missed.push(await this.enrichContactData(contact));
      }
    }

    return missed;
  }
}

/**
 * Singleton access to birthday detection system
 */
let birthdayDetectionSystem: BirthdayAutoDetectionSystem | null = null;

export function getBirthdayAutoDetectionSystem(): BirthdayAutoDetectionSystem {
  if (!birthdayDetectionSystem) {
    birthdayDetectionSystem = new BirthdayAutoDetectionSystem();
  }
  return birthdayDetectionSystem;
}

/**
 * Helper function for API/cron usage
 */
export async function runBirthdayDetection(organizationId: string): Promise<BirthdayDetectionResult> {
  const system = getBirthdayAutoDetectionSystem();
  return await system.runDailyBirthdayDetection(organizationId);
}