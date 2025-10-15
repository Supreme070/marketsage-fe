// NOTE: Prisma removed - using backend API (LeadPulseAttributionConfig, LeadPulseAttribution, LeadPulseAttributionTouchpoint, LeadPulseTouchpoint exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

import { logger } from '@/lib/logger';

// Types for attribution
export interface AttributionConfig {
  id: string;
  name: string;
  description?: string;
  viewThroughWindow: number; // Days
  clickThroughWindow: number; // Days
  attributionModel: AttributionModel;
  conversionEvents: string[];
  conversionValue: Record<string, number>;
  channels: ChannelConfig;
  touchpointTypes: string[];
  isActive: boolean;
  isDefault: boolean;
  crossDevice: boolean;
  crossDomain: boolean;
  deduplicationWindow: number; // Hours
  duplicateHandling: AttributionDuplicateHandling;
}

export interface ChannelConfig {
  weights: Record<string, number>;
  aliases: Record<string, string[]>;
  hierarchies: Record<string, number>;
}

export interface ConversionEvent {
  conversionId: string;
  conversionType: string;
  conversionValue?: number;
  conversionData?: any;
  conversionTime: Date;
  visitorId?: string;
  anonymousVisitorId?: string;
  sessionId?: string;
}

export interface TouchpointData {
  id: string;
  timestamp: Date;
  type: string;
  url?: string;
  channel?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  metadata?: any;
}

export interface AttributionResult {
  conversionId: string;
  attributionModel: AttributionModel;
  touchpointsCount: number;
  totalCredit: number;
  touchpoints: AttributedTouchpoint[];
  firstTouch?: AttributedTouchpoint;
  lastTouch?: AttributedTouchpoint;
  channelBreakdown: Record<string, number>;
  deviceBreakdown?: Record<string, number>;
  journeyDuration: number; // Minutes
  touchpointCount: number;
  uniqueChannels: number;
}

export interface AttributedTouchpoint {
  touchpointId: string;
  credit: number;
  position: number;
  timeToConversion: number;
  touchpointType: string;
  channel?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  url?: string;
  timestamp: Date;
  decayFactor?: number;
  positionWeight?: number;
  channelWeight?: number;
}

export type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY' | 'POSITION_BASED' | 'DATA_DRIVEN' | 'CUSTOM';
export type AttributionDuplicateHandling = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'HIGHEST_VALUE' | 'SUM_VALUES' | 'IGNORE_DUPLICATES';

export class LeadPulseAttributionService {
  
  /**
   * Create attribution configuration
   */
  async createAttributionConfig(
    config: Omit<AttributionConfig, 'id'>,
    createdBy: string
  ): Promise<string> {
    try {
      // If this is set as default, unset other defaults
      if (config.isDefault) {
        const updateResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-configs/bulk-update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDefault: true, data: { isDefault: false } })
        });
        if (!updateResponse.ok) {
          throw new Error(`Failed to unset default configs: ${updateResponse.status}`);
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/v2/attribution-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          viewThroughWindow: config.viewThroughWindow,
          clickThroughWindow: config.clickThroughWindow,
          attributionModel: config.attributionModel,
          conversionEvents: JSON.stringify(config.conversionEvents),
          conversionValue: config.conversionValue ? JSON.stringify(config.conversionValue) : null,
          channels: JSON.stringify(config.channels),
          touchpointTypes: JSON.stringify(config.touchpointTypes),
          isActive: config.isActive,
          isDefault: config.isDefault,
          crossDevice: config.crossDevice,
          crossDomain: config.crossDomain,
          deduplicationWindow: config.deduplicationWindow,
          duplicateHandling: config.duplicateHandling,
          createdBy
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create attribution config: ${response.status}`);
      }

      const attributionConfig = await response.json();

      logger.info(`Created attribution config: ${attributionConfig.id}`, {
        name: config.name,
        model: config.attributionModel
      });

      return attributionConfig.id;

    } catch (error) {
      logger.error('Failed to create attribution config:', error);
      throw error;
    }
  }

  /**
   * Calculate attribution for a conversion event
   */
  async calculateAttribution(
    conversion: ConversionEvent,
    configId?: string
  ): Promise<AttributionResult> {
    try {
      // Get attribution config
      const config = await this.getAttributionConfig(configId);
      
      // Get touchpoints within attribution window
      const touchpoints = await this.getTouchpointsForAttribution(conversion, config);
      
      if (touchpoints.length === 0) {
        // No touchpoints found - direct conversion
        return this.createDirectAttributionResult(conversion, config);
      }

      // Calculate attribution based on model
      const attributionResult = await this.applyAttributionModel(
        conversion,
        touchpoints,
        config
      );

      // Store attribution result
      await this.storeAttributionResult(attributionResult, config.id);

      logger.info(`Calculated attribution for conversion: ${conversion.conversionId}`, {
        model: config.attributionModel,
        touchpoints: touchpoints.length,
        channels: Object.keys(attributionResult.channelBreakdown).length
      });

      return attributionResult;

    } catch (error) {
      logger.error('Failed to calculate attribution:', error);
      throw error;
    }
  }

  /**
   * Recalculate attribution for a time period
   */
  async recalculateAttribution(
    startDate: Date,
    endDate: Date,
    configId?: string
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    try {
      const config = await this.getAttributionConfig(configId);
      
      // Get conversions in the period
      const response = await fetch(`${BACKEND_URL}/api/v2/attribution?conversionTimeGte=${startDate.toISOString()}&conversionTimeLte=${endDate.toISOString()}&configId=${config.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch conversions: ${response.status}`);
      }
      const conversions = await response.json();

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const conversion of conversions) {
        try {
          processed++;
          
          const conversionEvent: ConversionEvent = {
            conversionId: conversion.conversionId,
            conversionType: conversion.conversionType,
            conversionValue: conversion.conversionValue || undefined,
            conversionData: conversion.conversionData ? JSON.parse(conversion.conversionData as string) : undefined,
            conversionTime: conversion.conversionTime,
            visitorId: conversion.visitorId || undefined,
            anonymousVisitorId: conversion.anonymousVisitorId || undefined,
            sessionId: conversion.sessionId || undefined
          };

          await this.calculateAttribution(conversionEvent, config.id);
          succeeded++;

        } catch (error) {
          failed++;
          logger.warn(`Failed to recalculate attribution for conversion ${conversion.conversionId}:`, error);
        }
      }

      logger.info(`Recalculated attribution for period`, {
        startDate,
        endDate,
        processed,
        succeeded,
        failed
      });

      return { processed, succeeded, failed };

    } catch (error) {
      logger.error('Failed to recalculate attribution:', error);
      throw error;
    }
  }

  /**
   * Get attribution config (default if not specified)
   */
  private async getAttributionConfig(configId?: string): Promise<AttributionConfig> {
    let config;

    if (configId) {
      const response = await fetch(`${BACKEND_URL}/api/v2/attribution-configs/${configId}?isActive=true`);
      if (response.ok) {
        config = await response.json();
      }
    } else {
      const response = await fetch(`${BACKEND_URL}/api/v2/attribution-configs?isDefault=true&isActive=true&limit=1`);
      if (response.ok) {
        const data = await response.json();
        config = data[0];
      }
    }

    if (!config) {
      // Create default config if none exists
      const defaultConfigId = await this.createDefaultAttributionConfig();
      const response = await fetch(`${BACKEND_URL}/api/v2/attribution-configs/${defaultConfigId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch created config: ${response.status}`);
      }
      config = await response.json();
    }

    if (!config) {
      throw new Error('No attribution configuration found');
    }

    return {
      id: config.id,
      name: config.name,
      description: config.description || undefined,
      viewThroughWindow: config.viewThroughWindow,
      clickThroughWindow: config.clickThroughWindow,
      attributionModel: config.attributionModel as AttributionModel,
      conversionEvents: JSON.parse(config.conversionEvents as string),
      conversionValue: config.conversionValue ? JSON.parse(config.conversionValue as string) : {},
      channels: JSON.parse(config.channels as string),
      touchpointTypes: JSON.parse(config.touchpointTypes as string),
      isActive: config.isActive,
      isDefault: config.isDefault,
      crossDevice: config.crossDevice,
      crossDomain: config.crossDomain,
      deduplicationWindow: config.deduplicationWindow,
      duplicateHandling: config.duplicateHandling as AttributionDuplicateHandling
    };
  }

  /**
   * Get touchpoints within attribution window
   */
  private async getTouchpointsForAttribution(
    conversion: ConversionEvent,
    config: AttributionConfig
  ): Promise<TouchpointData[]> {
    const windowStart = new Date(
      conversion.conversionTime.getTime() - 
      config.clickThroughWindow * 24 * 60 * 60 * 1000
    );

    const whereConditions: any = {
      timestamp: {
        gte: windowStart,
        lte: conversion.conversionTime
      }
    };

    // Add visitor filter
    if (conversion.visitorId) {
      whereConditions.visitorId = conversion.visitorId;
    } else if (conversion.anonymousVisitorId) {
      whereConditions.anonymousVisitorId = conversion.anonymousVisitorId;
    } else {
      return []; // No visitor to track
    }

    // Filter by touchpoint types if specified
    if (config.touchpointTypes.length > 0) {
      whereConditions.type = { in: config.touchpointTypes };
    }

    const params = new URLSearchParams({
      timestampGte: whereConditions.timestamp.gte.toISOString(),
      timestampLte: whereConditions.timestamp.lte.toISOString(),
      sortBy: 'timestamp',
      order: 'asc'
    });

    if (whereConditions.visitorId) {
      params.append('visitorId', whereConditions.visitorId);
    }
    if (whereConditions.anonymousVisitorId) {
      params.append('anonymousVisitorId', whereConditions.anonymousVisitorId);
    }
    if (whereConditions.type) {
      params.append('type', whereConditions.type.in.join(','));
    }

    const response = await fetch(`${BACKEND_URL}/api/v2/touchpoints?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch touchpoints: ${response.status}`);
    }
    const touchpoints = await response.json();

    return touchpoints.map(tp => ({
      id: tp.id,
      timestamp: tp.timestamp,
      type: tp.type,
      url: tp.url || undefined,
      channel: this.extractChannel(tp.metadata, tp.url),
      source: this.extractSource(tp.metadata, tp.url),
      medium: this.extractMedium(tp.metadata, tp.url),
      campaign: this.extractCampaign(tp.metadata, tp.url),
      content: this.extractContent(tp.metadata, tp.url),
      metadata: tp.metadata ? JSON.parse(tp.metadata as string) : undefined
    }));
  }

  /**
   * Apply attribution model to touchpoints
   */
  private async applyAttributionModel(
    conversion: ConversionEvent,
    touchpoints: TouchpointData[],
    config: AttributionConfig
  ): Promise<AttributionResult> {
    const attributedTouchpoints: AttributedTouchpoint[] = [];
    
    switch (config.attributionModel) {
      case 'FIRST_TOUCH':
        attributedTouchpoints.push(...this.applyFirstTouchAttribution(touchpoints, conversion));
        break;
      case 'LAST_TOUCH':
        attributedTouchpoints.push(...this.applyLastTouchAttribution(touchpoints, conversion));
        break;
      case 'LINEAR':
        attributedTouchpoints.push(...this.applyLinearAttribution(touchpoints, conversion));
        break;
      case 'TIME_DECAY':
        attributedTouchpoints.push(...this.applyTimeDecayAttribution(touchpoints, conversion));
        break;
      case 'POSITION_BASED':
        attributedTouchpoints.push(...this.applyPositionBasedAttribution(touchpoints, conversion));
        break;
      default:
        // Default to last touch
        attributedTouchpoints.push(...this.applyLastTouchAttribution(touchpoints, conversion));
    }

    // Apply channel weights
    this.applyChannelWeights(attributedTouchpoints, config.channels);

    // Calculate aggregated data
    const channelBreakdown = this.calculateChannelBreakdown(attributedTouchpoints);
    const journeyDuration = this.calculateJourneyDuration(touchpoints, conversion);
    const uniqueChannels = new Set(attributedTouchpoints.map(tp => tp.channel).filter(Boolean)).size;

    return {
      conversionId: conversion.conversionId,
      attributionModel: config.attributionModel,
      touchpointsCount: attributedTouchpoints.length,
      totalCredit: attributedTouchpoints.reduce((sum, tp) => sum + tp.credit, 0),
      touchpoints: attributedTouchpoints,
      firstTouch: attributedTouchpoints.find(tp => tp.position === 1),
      lastTouch: attributedTouchpoints.find(tp => tp.position === -1),
      channelBreakdown,
      journeyDuration,
      touchpointCount: touchpoints.length,
      uniqueChannels
    };
  }

  /**
   * First touch attribution - 100% credit to first touchpoint
   */
  private applyFirstTouchAttribution(
    touchpoints: TouchpointData[],
    conversion: ConversionEvent
  ): AttributedTouchpoint[] {
    if (touchpoints.length === 0) return [];

    const firstTouchpoint = touchpoints[0];
    
    return [{
      touchpointId: firstTouchpoint.id,
      credit: 1.0,
      position: 1,
      timeToConversion: this.calculateTimeToConversion(firstTouchpoint.timestamp, conversion.conversionTime),
      touchpointType: firstTouchpoint.type,
      channel: firstTouchpoint.channel,
      source: firstTouchpoint.source,
      medium: firstTouchpoint.medium,
      campaign: firstTouchpoint.campaign,
      content: firstTouchpoint.content,
      url: firstTouchpoint.url,
      timestamp: firstTouchpoint.timestamp,
      positionWeight: 1.0
    }];
  }

  /**
   * Last touch attribution - 100% credit to last touchpoint
   */
  private applyLastTouchAttribution(
    touchpoints: TouchpointData[],
    conversion: ConversionEvent
  ): AttributedTouchpoint[] {
    if (touchpoints.length === 0) return [];

    const lastTouchpoint = touchpoints[touchpoints.length - 1];
    
    return [{
      touchpointId: lastTouchpoint.id,
      credit: 1.0,
      position: -1,
      timeToConversion: this.calculateTimeToConversion(lastTouchpoint.timestamp, conversion.conversionTime),
      touchpointType: lastTouchpoint.type,
      channel: lastTouchpoint.channel,
      source: lastTouchpoint.source,
      medium: lastTouchpoint.medium,
      campaign: lastTouchpoint.campaign,
      content: lastTouchpoint.content,
      url: lastTouchpoint.url,
      timestamp: lastTouchpoint.timestamp,
      positionWeight: 1.0
    }];
  }

  /**
   * Linear attribution - equal credit to all touchpoints
   */
  private applyLinearAttribution(
    touchpoints: TouchpointData[],
    conversion: ConversionEvent
  ): AttributedTouchpoint[] {
    if (touchpoints.length === 0) return [];

    const creditPerTouchpoint = 1.0 / touchpoints.length;
    
    return touchpoints.map((tp, index) => ({
      touchpointId: tp.id,
      credit: creditPerTouchpoint,
      position: index + 1,
      timeToConversion: this.calculateTimeToConversion(tp.timestamp, conversion.conversionTime),
      touchpointType: tp.type,
      channel: tp.channel,
      source: tp.source,
      medium: tp.medium,
      campaign: tp.campaign,
      content: tp.content,
      url: tp.url,
      timestamp: tp.timestamp,
      positionWeight: creditPerTouchpoint
    }));
  }

  /**
   * Time decay attribution - more recent touchpoints get more credit
   */
  private applyTimeDecayAttribution(
    touchpoints: TouchpointData[],
    conversion: ConversionEvent
  ): AttributedTouchpoint[] {
    if (touchpoints.length === 0) return [];

    const halfLife = 7; // 7 days half-life
    let totalWeight = 0;
    
    // Calculate weights based on time decay
    const weights = touchpoints.map(tp => {
      const daysFromConversion = this.calculateTimeToConversion(tp.timestamp, conversion.conversionTime) / (24 * 60);
      const weight = Math.pow(0.5, daysFromConversion / halfLife);
      totalWeight += weight;
      return weight;
    });

    // Normalize weights to sum to 1.0
    return touchpoints.map((tp, index) => ({
      touchpointId: tp.id,
      credit: weights[index] / totalWeight,
      position: index + 1,
      timeToConversion: this.calculateTimeToConversion(tp.timestamp, conversion.conversionTime),
      touchpointType: tp.type,
      channel: tp.channel,
      source: tp.source,
      medium: tp.medium,
      campaign: tp.campaign,
      content: tp.content,
      url: tp.url,
      timestamp: tp.timestamp,
      decayFactor: weights[index] / totalWeight,
      positionWeight: weights[index] / totalWeight
    }));
  }

  /**
   * Position-based attribution - 40% first, 40% last, 20% middle
   */
  private applyPositionBasedAttribution(
    touchpoints: TouchpointData[],
    conversion: ConversionEvent
  ): AttributedTouchpoint[] {
    if (touchpoints.length === 0) return [];

    if (touchpoints.length === 1) {
      // Single touchpoint gets all credit
      return this.applyFirstTouchAttribution(touchpoints, conversion);
    }

    if (touchpoints.length === 2) {
      // Two touchpoints: 50% each
      return touchpoints.map((tp, index) => ({
        touchpointId: tp.id,
        credit: 0.5,
        position: index === 0 ? 1 : -1,
        timeToConversion: this.calculateTimeToConversion(tp.timestamp, conversion.conversionTime),
        touchpointType: tp.type,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        content: tp.content,
        url: tp.url,
        timestamp: tp.timestamp,
        positionWeight: 0.5
      }));
    }

    // Multiple touchpoints: 40% first, 40% last, 20% distributed among middle
    const middleCredit = 0.2 / (touchpoints.length - 2);
    
    return touchpoints.map((tp, index) => {
      let credit: number;
      let position: number;
      
      if (index === 0) {
        credit = 0.4; // First touch
        position = 1;
      } else if (index === touchpoints.length - 1) {
        credit = 0.4; // Last touch
        position = -1;
      } else {
        credit = middleCredit; // Middle touches
        position = index + 1;
      }

      return {
        touchpointId: tp.id,
        credit,
        position,
        timeToConversion: this.calculateTimeToConversion(tp.timestamp, conversion.conversionTime),
        touchpointType: tp.type,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        content: tp.content,
        url: tp.url,
        timestamp: tp.timestamp,
        positionWeight: credit
      };
    });
  }

  /**
   * Apply channel weights to attribution
   */
  private applyChannelWeights(
    attributedTouchpoints: AttributedTouchpoint[],
    channels: ChannelConfig
  ): void {
    attributedTouchpoints.forEach(tp => {
      const channelWeight = channels.weights[tp.channel || 'direct'] || 1.0;
      tp.channelWeight = channelWeight;
      tp.credit *= channelWeight;
    });

    // Renormalize credits to sum to 1.0
    const totalCredit = attributedTouchpoints.reduce((sum, tp) => sum + tp.credit, 0);
    if (totalCredit > 0) {
      attributedTouchpoints.forEach(tp => {
        tp.credit /= totalCredit;
      });
    }
  }

  /**
   * Calculate channel breakdown
   */
  private calculateChannelBreakdown(attributedTouchpoints: AttributedTouchpoint[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    attributedTouchpoints.forEach(tp => {
      const channel = tp.channel || 'direct';
      breakdown[channel] = (breakdown[channel] || 0) + tp.credit;
    });

    return breakdown;
  }

  /**
   * Calculate journey duration in minutes
   */
  private calculateJourneyDuration(touchpoints: TouchpointData[], conversion: ConversionEvent): number {
    if (touchpoints.length === 0) return 0;
    
    const firstTouchpoint = touchpoints[0];
    return Math.round((conversion.conversionTime.getTime() - firstTouchpoint.timestamp.getTime()) / (60 * 1000));
  }

  /**
   * Calculate time to conversion in minutes
   */
  private calculateTimeToConversion(touchpointTime: Date, conversionTime: Date): number {
    return Math.round((conversionTime.getTime() - touchpointTime.getTime()) / (60 * 1000));
  }

  /**
   * Extract channel from metadata or URL
   */
  private extractChannel(metadata: any, url?: string): string | undefined {
    if (metadata?.utm_medium) {
      return this.mapMediumToChannel(metadata.utm_medium);
    }
    
    if (metadata?.referrer) {
      return this.mapReferrerToChannel(metadata.referrer);
    }

    if (url) {
      return this.mapUrlToChannel(url);
    }

    return 'direct';
  }

  private extractSource(metadata: any, url?: string): string | undefined {
    return metadata?.utm_source || metadata?.referrer || 'direct';
  }

  private extractMedium(metadata: any, url?: string): string | undefined {
    return metadata?.utm_medium || 'organic';
  }

  private extractCampaign(metadata: any, url?: string): string | undefined {
    return metadata?.utm_campaign;
  }

  private extractContent(metadata: any, url?: string): string | undefined {
    return metadata?.utm_content;
  }

  private mapMediumToChannel(medium: string): string {
    const mapping: Record<string, string> = {
      'email': 'email',
      'social': 'social',
      'search': 'search',
      'display': 'display',
      'affiliate': 'affiliate',
      'sms': 'sms',
      'whatsapp': 'whatsapp',
      'referral': 'referral'
    };
    
    return mapping[medium.toLowerCase()] || 'other';
  }

  private mapReferrerToChannel(referrer: string): string {
    if (referrer.includes('google.')) return 'search';
    if (referrer.includes('facebook.') || referrer.includes('twitter.') || referrer.includes('linkedin.')) return 'social';
    if (referrer.includes('youtube.')) return 'video';
    return 'referral';
  }

  private mapUrlToChannel(url: string): string {
    // Extract channel from URL patterns
    if (url.includes('/email/')) return 'email';
    if (url.includes('/social/')) return 'social';
    if (url.includes('/search/')) return 'search';
    return 'direct';
  }

  /**
   * Create direct attribution result (no touchpoints)
   */
  private createDirectAttributionResult(
    conversion: ConversionEvent,
    config: AttributionConfig
  ): AttributionResult {
    return {
      conversionId: conversion.conversionId,
      attributionModel: config.attributionModel,
      touchpointsCount: 0,
      totalCredit: 1.0,
      touchpoints: [],
      channelBreakdown: { 'direct': 1.0 },
      journeyDuration: 0,
      touchpointCount: 0,
      uniqueChannels: 1
    };
  }

  /**
   * Store attribution result in database
   */
  private async storeAttributionResult(
    result: AttributionResult,
    configId: string
  ): Promise<void> {
    try {
      // Store main attribution record using upsert
      const attributionData = {
        configId,
        conversionId: result.conversionId,
        conversionType: 'unknown', // This should be passed from conversion event
        conversionTime: new Date(), // This should be passed from conversion event
        attributionModel: result.attributionModel,
        touchpointsCount: result.touchpointsCount,
        totalCredit: result.totalCredit,
        attributionData: JSON.stringify({
          channelBreakdown: result.channelBreakdown,
          journeyDuration: result.journeyDuration,
          uniqueChannels: result.uniqueChannels
        }),
        firstTouch: result.firstTouch ? JSON.stringify(result.firstTouch) : null,
        lastTouch: result.lastTouch ? JSON.stringify(result.lastTouch) : null,
        channelBreakdown: JSON.stringify(result.channelBreakdown),
        journeyDuration: result.journeyDuration,
        touchpointCount: result.touchpointCount,
        uniqueChannels: result.uniqueChannels
      };

      const upsertResponse = await fetch(`${BACKEND_URL}/api/v2/attribution/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversionId: result.conversionId,
          createData: attributionData,
          updateData: {
            attributionModel: result.attributionModel,
            touchpointsCount: result.touchpointsCount,
            totalCredit: result.totalCredit,
            attributionData: JSON.stringify({
              channelBreakdown: result.channelBreakdown,
              journeyDuration: result.journeyDuration,
              uniqueChannels: result.uniqueChannels
            }),
            firstTouch: result.firstTouch ? JSON.stringify(result.firstTouch) : null,
            lastTouch: result.lastTouch ? JSON.stringify(result.lastTouch) : null,
            channelBreakdown: JSON.stringify(result.channelBreakdown),
            journeyDuration: result.journeyDuration,
            touchpointCount: result.touchpointCount,
            uniqueChannels: result.uniqueChannels,
            recalculatedAt: new Date()
          }
        })
      });

      if (!upsertResponse.ok) {
        throw new Error(`Failed to upsert attribution: ${upsertResponse.status}`);
      }
      const attribution = await upsertResponse.json();

      // Delete existing touchpoint attributions
      const deleteResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-touchpoints?attributionId=${attribution.id}`, {
        method: 'DELETE'
      });
      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete old touchpoint attributions: ${deleteResponse.status}`);
      }

      // Store touchpoint attributions
      if (result.touchpoints.length > 0) {
        const touchpointData = result.touchpoints.map(tp => ({
          attributionId: attribution.id,
          touchpointId: tp.touchpointId,
          credit: tp.credit,
          position: tp.position,
          timeToCconv: tp.timeToConversion,
          touchpointType: tp.touchpointType,
          channel: tp.channel,
          source: tp.source,
          medium: tp.medium,
          campaign: tp.campaign,
          content: tp.content,
          url: tp.url,
          decayFactor: tp.decayFactor,
          positionWeight: tp.positionWeight,
          channelWeight: tp.channelWeight,
          timestamp: tp.timestamp
        }));

        const createResponse = await fetch(`${BACKEND_URL}/api/v2/attribution-touchpoints/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(touchpointData)
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create touchpoint attributions: ${createResponse.status}`);
        }
      }

    } catch (error) {
      logger.error('Failed to store attribution result:', error);
      throw error;
    }
  }

  /**
   * Create default attribution configuration
   */
  private async createDefaultAttributionConfig(): Promise<string> {
    const defaultConfig = {
      name: 'Default Attribution',
      description: 'Default last-touch attribution configuration',
      viewThroughWindow: 1, // 1 day
      clickThroughWindow: 30, // 30 days
      attributionModel: 'LAST_TOUCH' as AttributionModel,
      conversionEvents: ['form_submit', 'download', 'purchase', 'signup'],
      conversionValue: {
        'form_submit': 10,
        'download': 5,
        'purchase': 100,
        'signup': 25
      },
      channels: {
        weights: {
          'email': 1.0,
          'social': 0.8,
          'search': 1.2,
          'display': 0.6,
          'direct': 1.0,
          'referral': 0.9,
          'sms': 1.1,
          'whatsapp': 1.1
        },
        aliases: {
          'facebook': ['social'],
          'google': ['search'],
          'organic': ['search']
        },
        hierarchies: {
          'direct': 1,
          'search': 2,
          'email': 3,
          'social': 4,
          'display': 5
        }
      },
      touchpointTypes: ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'EMAIL_CLICK', 'DOWNLOAD'],
      isActive: true,
      isDefault: true,
      crossDevice: false,
      crossDomain: false,
      deduplicationWindow: 24,
      duplicateHandling: 'LAST_TOUCH' as AttributionDuplicateHandling
    };

    return await this.createAttributionConfig(defaultConfig, 'system');
  }
}

// Export singleton instance
export const leadPulseAttributionService = new LeadPulseAttributionService();