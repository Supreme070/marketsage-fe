/**
 * Provider Optimization Engine
 * 
 * Automatically selects the best messaging provider based on:
 * - Cost efficiency 
 * - Deliverability rates
 * - Performance metrics
 * - Regional optimization
 * - Rate limiting
 * - Historical success rates
 */

import prisma from '@/lib/db/prisma';
import { MasterAccountManager, masterAccountsConfig, MasterAccountConfig } from '@/lib/config/master-accounts';
import { logger } from '@/lib/logger';

export interface ProviderMetrics {
  provider: string;
  channel: 'sms' | 'email' | 'whatsapp';
  deliveryRate: number;
  averageDeliveryTime: number; // in seconds
  errorRate: number;
  costPerMessage: number;
  rateLimit: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  region: string;
  lastUpdated: Date;
  totalMessagesSent: number;
  totalSuccessful: number;
  totalFailed: number;
}

export interface OptimizationRequest {
  channel: 'sms' | 'email' | 'whatsapp';
  messageCount: number;
  region: string;
  priority: 'cost' | 'speed' | 'reliability' | 'balanced';
  targetCountries?: string[];
  scheduledTime?: Date;
  organizationId: string;
}

export interface OptimizationResult {
  recommendedProvider: string;
  fallbackProviders: string[];
  estimatedCost: number;
  estimatedDeliveryTime: number;
  expectedDeliveryRate: number;
  reasoning: string;
  metrics: {
    costScore: number;
    deliveryScore: number;
    reliabilityScore: number;
    overallScore: number;
  };
  warnings?: string[];
}

export class ProviderOptimizationEngine {
  private static instance: ProviderOptimizationEngine;
  private metricsCache: Map<string, ProviderMetrics> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ProviderOptimizationEngine {
    if (!ProviderOptimizationEngine.instance) {
      ProviderOptimizationEngine.instance = new ProviderOptimizationEngine();
    }
    return ProviderOptimizationEngine.instance;
  }

  /**
   * Get the optimal provider for a messaging request
   */
  async optimizeProvider(request: OptimizationRequest): Promise<OptimizationResult> {
    try {
      // Get current metrics for all providers
      const providerMetrics = await this.getProviderMetrics(request.channel, request.region);
      
      if (providerMetrics.length === 0) {
        throw new Error(`No active providers found for ${request.channel} in ${request.region}`);
      }

      // Filter providers based on capacity
      const availableProviders = await this.filterByCapacity(providerMetrics, request);
      
      if (availableProviders.length === 0) {
        throw new Error(`No providers have sufficient capacity for ${request.messageCount} messages`);
      }

      // Score providers based on optimization criteria
      const scoredProviders = await this.scoreProviders(availableProviders, request);
      
      // Sort by overall score (descending)
      scoredProviders.sort((a, b) => b.overallScore - a.overallScore);
      
      const best = scoredProviders[0];
      const fallbacks = scoredProviders.slice(1, 3).map(p => p.provider);

      return {
        recommendedProvider: best.provider,
        fallbackProviders: fallbacks,
        estimatedCost: this.calculateCost(best, request.messageCount),
        estimatedDeliveryTime: best.averageDeliveryTime,
        expectedDeliveryRate: best.deliveryRate,
        reasoning: this.generateReasoning(best, request),
        metrics: {
          costScore: this.calculateCostScore(best, scoredProviders),
          deliveryScore: this.calculateDeliveryScore(best, scoredProviders),
          reliabilityScore: this.calculateReliabilityScore(best, scoredProviders),
          overallScore: best.overallScore
        },
        warnings: this.generateWarnings(best, request)
      };

    } catch (error) {
      logger.error('Provider optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for all providers
   */
  private async getProviderMetrics(channel: 'sms' | 'email' | 'whatsapp', region: string): Promise<ProviderMetrics[]> {
    const cacheKey = `${channel}-${region}`;
    
    // Check cache first
    if (this.metricsCache.has(cacheKey)) {
      const cached = this.metricsCache.get(cacheKey)!;
      if (Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
        return [cached];
      }
    }

    try {
      // Get metrics from database
      const dbMetrics = await prisma.providerMetrics.findMany({
        where: {
          channel,
          region: {
            in: [region, 'global']
          }
        },
        orderBy: {
          lastUpdated: 'desc'
        }
      });

      // Convert to our format and merge with master account config
      const metrics: ProviderMetrics[] = [];
      
      for (const metric of dbMetrics) {
        const masterAccount = this.getMasterAccountConfig(channel, metric.provider);
        if (masterAccount?.isActive) {
          metrics.push({
            provider: metric.provider,
            channel: metric.channel as 'sms' | 'email' | 'whatsapp',
            deliveryRate: metric.deliveryRate,
            averageDeliveryTime: metric.averageDeliveryTime,
            errorRate: metric.errorRate,
            costPerMessage: masterAccount.costPerMessage?.[channel] || 0,
            rateLimit: masterAccount.rateLimit || { perMinute: 60, perHour: 3600, perDay: 86400 },
            region: metric.region,
            lastUpdated: metric.lastUpdated,
            totalMessagesSent: metric.totalMessagesSent,
            totalSuccessful: metric.totalSuccessful,
            totalFailed: metric.totalFailed
          });
        }
      }

      // If no DB metrics, create baseline from master accounts
      if (metrics.length === 0) {
        metrics.push(...this.getBaselineMetrics(channel, region));
      }

      // Cache results
      metrics.forEach(metric => {
        this.metricsCache.set(`${metric.channel}-${metric.region}`, metric);
      });

      return metrics;

    } catch (error) {
      logger.error('Failed to get provider metrics:', error);
      // Return baseline metrics on error
      return this.getBaselineMetrics(channel, region);
    }
  }

  /**
   * Filter providers by capacity
   */
  private async filterByCapacity(metrics: ProviderMetrics[], request: OptimizationRequest): Promise<ProviderMetrics[]> {
    const available: ProviderMetrics[] = [];
    
    for (const metric of metrics) {
      // Check daily capacity
      if (metric.rateLimit.perDay >= request.messageCount) {
        // Check current usage (simplified - in production would check Redis)
        const currentUsage = await this.getCurrentUsage(metric.provider, metric.channel);
        const remainingCapacity = metric.rateLimit.perDay - currentUsage;
        
        if (remainingCapacity >= request.messageCount) {
          available.push(metric);
        }
      }
    }
    
    return available;
  }

  /**
   * Score providers based on optimization criteria
   */
  private async scoreProviders(
    metrics: ProviderMetrics[], 
    request: OptimizationRequest
  ): Promise<(ProviderMetrics & { overallScore: number })[]> {
    const scored = [];
    
    for (const metric of metrics) {
      const costScore = this.calculateCostScore(metric, metrics);
      const deliveryScore = this.calculateDeliveryScore(metric, metrics);
      const reliabilityScore = this.calculateReliabilityScore(metric, metrics);
      const regionalScore = this.calculateRegionalScore(metric, request.region);
      
      // Weight scores based on priority
      let overallScore = 0;
      switch (request.priority) {
        case 'cost':
          overallScore = costScore * 0.5 + deliveryScore * 0.2 + reliabilityScore * 0.2 + regionalScore * 0.1;
          break;
        case 'speed':
          overallScore = deliveryScore * 0.5 + reliabilityScore * 0.3 + regionalScore * 0.15 + costScore * 0.05;
          break;
        case 'reliability':
          overallScore = reliabilityScore * 0.5 + deliveryScore * 0.3 + regionalScore * 0.15 + costScore * 0.05;
          break;
        case 'balanced':
        default:
          overallScore = costScore * 0.25 + deliveryScore * 0.25 + reliabilityScore * 0.25 + regionalScore * 0.25;
      }
      
      scored.push({
        ...metric,
        overallScore
      });
    }
    
    return scored;
  }

  /**
   * Calculate cost efficiency score (0-100)
   */
  private calculateCostScore(metric: ProviderMetrics, allMetrics: ProviderMetrics[]): number {
    const costs = allMetrics.map(m => m.costPerMessage);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    
    if (minCost === maxCost) return 100;
    
    // Invert score so lower cost = higher score
    return 100 - ((metric.costPerMessage - minCost) / (maxCost - minCost)) * 100;
  }

  /**
   * Calculate delivery speed score (0-100)
   */
  private calculateDeliveryScore(metric: ProviderMetrics, allMetrics: ProviderMetrics[]): number {
    const deliveryTimes = allMetrics.map(m => m.averageDeliveryTime);
    const minTime = Math.min(...deliveryTimes);
    const maxTime = Math.max(...deliveryTimes);
    
    if (minTime === maxTime) return 100;
    
    // Invert score so faster delivery = higher score
    return 100 - ((metric.averageDeliveryTime - minTime) / (maxTime - minTime)) * 100;
  }

  /**
   * Calculate reliability score (0-100)
   */
  private calculateReliabilityScore(metric: ProviderMetrics, allMetrics: ProviderMetrics[]): number {
    const deliveryRates = allMetrics.map(m => m.deliveryRate);
    const minRate = Math.min(...deliveryRates);
    const maxRate = Math.max(...deliveryRates);
    
    if (minRate === maxRate) return 100;
    
    return ((metric.deliveryRate - minRate) / (maxRate - minRate)) * 100;
  }

  /**
   * Calculate regional optimization score (0-100)
   */
  private calculateRegionalScore(metric: ProviderMetrics, targetRegion: string): number {
    // Perfect match
    if (metric.region === targetRegion) return 100;
    
    // Regional compatibility
    const regionCompatibility = {
      'africa': ['nigeria', 'kenya', 'ghana', 'south-africa'],
      'nigeria': ['africa'],
      'kenya': ['africa'],
      'ghana': ['africa'],
      'south-africa': ['africa'],
      'us': ['global'],
      'europe': ['global'],
      'global': ['us', 'europe', 'africa']
    };
    
    const compatible = regionCompatibility[metric.region as keyof typeof regionCompatibility] || [];
    if (compatible.includes(targetRegion)) return 75;
    
    // Global fallback
    if (metric.region === 'global') return 50;
    
    return 25;
  }

  /**
   * Generate reasoning for provider selection
   */
  private generateReasoning(metric: ProviderMetrics, request: OptimizationRequest): string {
    const reasons = [];
    
    // Cost analysis
    if (metric.costPerMessage < 0.05) {
      reasons.push('highly cost-effective');
    } else if (metric.costPerMessage < 0.1) {
      reasons.push('cost-effective');
    }
    
    // Delivery performance
    if (metric.deliveryRate > 0.98) {
      reasons.push('excellent delivery rate');
    } else if (metric.deliveryRate > 0.95) {
      reasons.push('good delivery rate');
    }
    
    // Regional optimization
    if (metric.region === request.region) {
      reasons.push('optimized for your region');
    }
    
    // Capacity
    if (metric.rateLimit.perDay > request.messageCount * 10) {
      reasons.push('excellent capacity');
    }
    
    return `Selected for ${reasons.join(', ')}`;
  }

  /**
   * Generate warnings for provider selection
   */
  private generateWarnings(metric: ProviderMetrics, request: OptimizationRequest): string[] {
    const warnings = [];
    
    // Cost warnings
    if (metric.costPerMessage > 0.15) {
      warnings.push('Higher than average cost per message');
    }
    
    // Delivery warnings
    if (metric.deliveryRate < 0.95) {
      warnings.push('Below average delivery rate');
    }
    
    // Capacity warnings
    if (metric.rateLimit.perDay < request.messageCount * 2) {
      warnings.push('Limited capacity - consider splitting campaign');
    }
    
    // Regional warnings
    if (metric.region !== request.region && metric.region !== 'global') {
      warnings.push('Provider not optimized for your region');
    }
    
    return warnings;
  }

  /**
   * Get baseline metrics for providers with no historical data
   */
  private getBaselineMetrics(channel: 'sms' | 'email' | 'whatsapp', region: string): ProviderMetrics[] {
    const baselineMetrics: ProviderMetrics[] = [];
    const channelAccounts = masterAccountsConfig[channel];
    
    for (const [providerName, config] of Object.entries(channelAccounts)) {
      if (config.isActive) {
        baselineMetrics.push({
          provider: providerName,
          channel,
          deliveryRate: this.getBaselineDeliveryRate(providerName, channel),
          averageDeliveryTime: this.getBaselineDeliveryTime(providerName, channel),
          errorRate: 0.02, // 2% baseline error rate
          costPerMessage: config.costPerMessage?.[channel] || 0,
          rateLimit: config.rateLimit || { perMinute: 60, perHour: 3600, perDay: 86400 },
          region: config.region || 'global',
          lastUpdated: new Date(),
          totalMessagesSent: 0,
          totalSuccessful: 0,
          totalFailed: 0
        });
      }
    }
    
    return baselineMetrics;
  }

  /**
   * Get baseline delivery rate for provider
   */
  private getBaselineDeliveryRate(provider: string, channel: 'sms' | 'email' | 'whatsapp'): number {
    const rates = {
      'twilio': { sms: 0.98, email: 0.95, whatsapp: 0.97 },
      'africas-talking': { sms: 0.96, email: 0.93, whatsapp: 0.95 },
      'termii': { sms: 0.95, email: 0.92, whatsapp: 0.94 },
      'sendgrid': { sms: 0.90, email: 0.97, whatsapp: 0.90 },
      'mailgun': { sms: 0.90, email: 0.96, whatsapp: 0.90 },
      'postmark': { sms: 0.90, email: 0.98, whatsapp: 0.90 }
    };
    
    return rates[provider as keyof typeof rates]?.[channel] || 0.95;
  }

  /**
   * Get baseline delivery time for provider
   */
  private getBaselineDeliveryTime(provider: string, channel: 'sms' | 'email' | 'whatsapp'): number {
    const times = {
      'twilio': { sms: 5, email: 30, whatsapp: 10 },
      'africas-talking': { sms: 8, email: 45, whatsapp: 15 },
      'termii': { sms: 10, email: 60, whatsapp: 20 },
      'sendgrid': { sms: 60, email: 15, whatsapp: 60 },
      'mailgun': { sms: 60, email: 20, whatsapp: 60 },
      'postmark': { sms: 60, email: 10, whatsapp: 60 }
    };
    
    return times[provider as keyof typeof times]?.[channel] || 30;
  }

  /**
   * Get master account configuration for provider
   */
  private getMasterAccountConfig(channel: 'sms' | 'email' | 'whatsapp', provider: string): MasterAccountConfig | null {
    const channelAccounts = masterAccountsConfig[channel];
    return channelAccounts[provider as keyof typeof channelAccounts] || null;
  }

  /**
   * Calculate cost for message count
   */
  private calculateCost(metric: ProviderMetrics, messageCount: number): number {
    return metric.costPerMessage * messageCount;
  }

  /**
   * Get current usage for provider (simplified)
   */
  private async getCurrentUsage(provider: string, channel: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const usage = await prisma.messagingUsage.aggregate({
        where: {
          provider,
          channel,
          timestamp: {
            gte: today
          }
        },
        _sum: {
          messageCount: true
        }
      });
      
      return usage._sum.messageCount || 0;
    } catch (error) {
      logger.error('Failed to get current usage:', error);
      return 0;
    }
  }

  /**
   * Update provider metrics after message sending
   */
  async updateProviderMetrics(
    provider: string,
    channel: 'sms' | 'email' | 'whatsapp',
    region: string,
    messageCount: number,
    successCount: number,
    failCount: number,
    averageDeliveryTime: number
  ): Promise<void> {
    try {
      const deliveryRate = successCount / messageCount;
      const errorRate = failCount / messageCount;
      
      await prisma.providerMetrics.upsert({
        where: {
          provider_channel_region: {
            provider,
            channel,
            region
          }
        },
        create: {
          provider,
          channel,
          region,
          deliveryRate,
          averageDeliveryTime,
          errorRate,
          totalMessagesSent: messageCount,
          totalSuccessful: successCount,
          totalFailed: failCount,
          lastUpdated: new Date()
        },
        update: {
          deliveryRate: (deliveryRate * 0.3) + (deliveryRate * 0.7), // Weighted average
          averageDeliveryTime: (averageDeliveryTime * 0.3) + (averageDeliveryTime * 0.7),
          errorRate: (errorRate * 0.3) + (errorRate * 0.7),
          totalMessagesSent: {
            increment: messageCount
          },
          totalSuccessful: {
            increment: successCount
          },
          totalFailed: {
            increment: failCount
          },
          lastUpdated: new Date()
        }
      });
      
      // Clear cache for this provider
      this.metricsCache.delete(`${channel}-${region}`);
      
    } catch (error) {
      logger.error('Failed to update provider metrics:', error);
    }
  }

  /**
   * Get optimization recommendations for an organization
   */
  async getOptimizationRecommendations(organizationId: string): Promise<{
    recommendations: Array<{
      channel: string;
      currentProvider: string;
      recommendedProvider: string;
      potentialSavings: number;
      improvementArea: string;
    }>;
    totalPotentialSavings: number;
  }> {
    try {
      // Get organization's recent usage
      const recentUsage = await prisma.messagingUsage.findMany({
        where: {
          organizationId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      const recommendations = [];
      let totalPotentialSavings = 0;

      // Group by channel
      const channelUsage = recentUsage.reduce((acc, usage) => {
        if (!acc[usage.channel]) {
          acc[usage.channel] = [];
        }
        acc[usage.channel].push(usage);
        return acc;
      }, {} as Record<string, any[]>);

      // Get org config for region
      const orgConfig = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { region: true }
      });

      for (const [channel, usageData] of Object.entries(channelUsage)) {
        const totalMessages = usageData.reduce((sum, u) => sum + u.messageCount, 0);
        const totalCost = usageData.reduce((sum, u) => sum + u.credits, 0);
        const currentProvider = usageData[0]?.provider;

        if (totalMessages > 0) {
          // Get optimization for this channel
          const optimization = await this.optimizeProvider({
            channel: channel as 'sms' | 'email' | 'whatsapp',
            messageCount: totalMessages,
            region: orgConfig?.region || 'global',
            priority: 'cost',
            organizationId
          });

          if (optimization.recommendedProvider !== currentProvider) {
            const potentialSavings = totalCost - optimization.estimatedCost;
            
            if (potentialSavings > 0) {
              recommendations.push({
                channel,
                currentProvider,
                recommendedProvider: optimization.recommendedProvider,
                potentialSavings,
                improvementArea: potentialSavings > totalCost * 0.2 ? 'cost' : 'reliability'
              });
              
              totalPotentialSavings += potentialSavings;
            }
          }
        }
      }

      return {
        recommendations,
        totalPotentialSavings
      };

    } catch (error) {
      logger.error('Failed to get optimization recommendations:', error);
      return {
        recommendations: [],
        totalPotentialSavings: 0
      };
    }
  }
}

export const providerOptimizationEngine = ProviderOptimizationEngine.getInstance();