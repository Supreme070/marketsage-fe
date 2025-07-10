/**
 * SMS Cost Tracking and Budget Management Service
 * 
 * Handles cost tracking, budget management, and billing for SMS campaigns
 * with support for multiple providers and regional pricing.
 */

import prisma from '@/lib/db/prisma';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { logger } from '@/lib/logger';

interface SMSCostConfig {
  providers: {
    [provider: string]: {
      baseRate: number; // Cost per SMS in USD
      bulkDiscounts: Array<{
        minQuantity: number;
        discountPercentage: number;
      }>;
      regionalRates: {
        [countryCode: string]: number; // Override rates for specific countries
      };
    };
  };
  defaultProvider: string;
}

interface BudgetAlert {
  threshold: number; // Percentage of budget used
  alertType: 'email' | 'sms' | 'webhook';
  recipients: string[];
  isActive: boolean;
}

interface UsageCost {
  messageCount: number;
  totalCost: number;
  averageCostPerMessage: number;
  provider: string;
  currency: string;
  billingPeriod: string;
}

interface BudgetStatus {
  allocated: number;
  used: number;
  remaining: number;
  percentageUsed: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  alertsTriggered: string[];
}

export class SMSCostTracker {
  private readonly config: SMSCostConfig = {
    providers: {
      twilio: {
        baseRate: 0.0075, // $0.0075 per SMS
        bulkDiscounts: [
          { minQuantity: 1000, discountPercentage: 5 },
          { minQuantity: 10000, discountPercentage: 10 },
          { minQuantity: 100000, discountPercentage: 15 }
        ],
        regionalRates: {
          '234': 0.008, // Nigeria
          '254': 0.009, // Kenya
          '27': 0.012,  // South Africa
          '233': 0.010  // Ghana
        }
      },
      africastalking: {
        baseRate: 0.005, // $0.005 per SMS
        bulkDiscounts: [
          { minQuantity: 1000, discountPercentage: 3 },
          { minQuantity: 5000, discountPercentage: 7 },
          { minQuantity: 25000, discountPercentage: 12 }
        ],
        regionalRates: {
          '234': 0.006, // Nigeria
          '254': 0.004, // Kenya
          '256': 0.005, // Uganda
          '255': 0.006  // Tanzania
        }
      },
      termii: {
        baseRate: 0.007, // $0.007 per SMS
        bulkDiscounts: [
          { minQuantity: 500, discountPercentage: 5 },
          { minQuantity: 2500, discountPercentage: 8 },
          { minQuantity: 15000, discountPercentage: 12 }
        ],
        regionalRates: {
          '234': 0.0065, // Nigeria primary
          '233': 0.008,  // Ghana
          '237': 0.009   // Cameroon
        }
      }
    },
    defaultProvider: 'termii'
  };

  /**
   * Calculate cost for SMS campaign
   */
  async calculateCampaignCost(
    contactCount: number,
    provider: string = this.config.defaultProvider,
    countryCode?: string
  ): Promise<{
    totalCost: number;
    costPerMessage: number;
    discount: number;
    originalCost: number;
    provider: string;
    breakdown: any;
  }> {
    try {
      const providerConfig = this.config.providers[provider];
      if (!providerConfig) {
        throw new Error(`Provider ${provider} not configured`);
      }

      // Determine the rate
      let baseRate = providerConfig.baseRate;
      if (countryCode && providerConfig.regionalRates[countryCode]) {
        baseRate = providerConfig.regionalRates[countryCode];
      }

      // Calculate original cost
      const originalCost = contactCount * baseRate;

      // Apply bulk discounts
      let discount = 0;
      for (const tier of providerConfig.bulkDiscounts) {
        if (contactCount >= tier.minQuantity) {
          discount = tier.discountPercentage;
        }
      }

      const discountAmount = originalCost * (discount / 100);
      const totalCost = originalCost - discountAmount;
      const costPerMessage = totalCost / contactCount;

      const breakdown = {
        messageCount: contactCount,
        baseRate,
        originalCost,
        discountPercentage: discount,
        discountAmount,
        finalRate: costPerMessage
      };

      return {
        totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
        costPerMessage: Math.round(costPerMessage * 10000) / 10000,
        discount,
        originalCost: Math.round(originalCost * 10000) / 10000,
        provider,
        breakdown
      };
    } catch (error) {
      logger.error('Failed to calculate SMS campaign cost', { error, contactCount, provider });
      throw error;
    }
  }

  /**
   * Record SMS usage and cost
   */
  async recordUsage(
    campaignId: string,
    userId: string,
    messageCount: number,
    cost: number,
    provider: string,
    metadata?: any
  ): Promise<{ success: boolean; usageId?: string; error?: string }> {
    try {
      const usage = await prisma.sMSUsage.create({
        data: {
          campaignId,
          userId,
          messageCount,
          cost,
          provider,
          currency: 'USD',
          billingPeriod: this.getCurrentBillingPeriod(),
          recordedAt: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });

      await smsLogger.logCostRecorded(campaignId, cost, messageCount, {
        userId,
        provider,
        usageId: usage.id
      });

      // Check budget alerts
      await this.checkBudgetAlerts(userId);

      return { success: true, usageId: usage.id };
    } catch (error) {
      logger.error('Failed to record SMS usage', { error, campaignId, messageCount, cost });
      return { success: false, error: 'Failed to record usage' };
    }
  }

  /**
   * Get user's SMS usage for a period
   */
  async getUserUsage(
    userId: string,
    period: 'current' | 'last' | string = 'current'
  ): Promise<UsageCost> {
    try {
      const billingPeriod = period === 'current' ? this.getCurrentBillingPeriod() :
                           period === 'last' ? this.getLastBillingPeriod() : period;

      const usageRecords = await prisma.sMSUsage.findMany({
        where: {
          userId,
          billingPeriod
        }
      });

      const totalMessages = usageRecords.reduce((sum, record) => sum + record.messageCount, 0);
      const totalCost = usageRecords.reduce((sum, record) => sum + record.cost, 0);
      const averageCost = totalMessages > 0 ? totalCost / totalMessages : 0;

      // Determine most used provider
      const providerUsage = usageRecords.reduce((acc, record) => {
        acc[record.provider] = (acc[record.provider] || 0) + record.messageCount;
        return acc;
      }, {} as Record<string, number>);

      const primaryProvider = Object.entries(providerUsage)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

      return {
        messageCount: totalMessages,
        totalCost: Math.round(totalCost * 100) / 100,
        averageCostPerMessage: Math.round(averageCost * 10000) / 10000,
        provider: primaryProvider,
        currency: 'USD',
        billingPeriod
      };
    } catch (error) {
      logger.error('Failed to get user SMS usage', { error, userId, period });
      throw error;
    }
  }

  /**
   * Set user budget
   */
  async setUserBudget(
    userId: string,
    monthlyBudget: number,
    alerts: BudgetAlert[] = []
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existingBudget = await prisma.sMSBudget.findFirst({
        where: { userId }
      });

      if (existingBudget) {
        await prisma.sMSBudget.update({
          where: { id: existingBudget.id },
          data: {
            monthlyLimit: monthlyBudget,
            alerts: JSON.stringify(alerts),
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.sMSBudget.create({
          data: {
            userId,
            monthlyLimit: monthlyBudget,
            currentUsage: 0,
            alerts: JSON.stringify(alerts),
            isActive: true
          }
        });
      }

      await smsLogger.logBudgetUpdated(userId, monthlyBudget, {
        alertCount: alerts.length
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to set user SMS budget', { error, userId, monthlyBudget });
      return { success: false, error: 'Failed to set budget' };
    }
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(userId: string): Promise<BudgetStatus> {
    try {
      const budget = await prisma.sMSBudget.findFirst({
        where: { userId }
      });

      if (!budget) {
        return {
          allocated: 0,
          used: 0,
          remaining: 0,
          percentageUsed: 0,
          status: 'healthy',
          alertsTriggered: []
        };
      }

      const currentUsage = await this.getUserUsage(userId, 'current');
      const used = currentUsage.totalCost;
      const remaining = Math.max(0, budget.monthlyLimit - used);
      const percentageUsed = budget.monthlyLimit > 0 ? (used / budget.monthlyLimit) * 100 : 0;

      let status: 'healthy' | 'warning' | 'critical' | 'exceeded' = 'healthy';
      const alertsTriggered: string[] = [];

      if (percentageUsed >= 100) {
        status = 'exceeded';
        alertsTriggered.push('Budget exceeded');
      } else if (percentageUsed >= 90) {
        status = 'critical';
        alertsTriggered.push('90% budget used');
      } else if (percentageUsed >= 75) {
        status = 'warning';
        alertsTriggered.push('75% budget used');
      }

      return {
        allocated: budget.monthlyLimit,
        used: Math.round(used * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        status,
        alertsTriggered
      };
    } catch (error) {
      logger.error('Failed to get budget status', { error, userId });
      throw error;
    }
  }

  /**
   * Check if user can send campaign within budget
   */
  async canAffordCampaign(
    userId: string,
    estimatedCost: number
  ): Promise<{ canAfford: boolean; budgetStatus: BudgetStatus; reason?: string }> {
    try {
      const budgetStatus = await this.getBudgetStatus(userId);
      
      if (budgetStatus.allocated === 0) {
        // No budget set - allow unlimited
        return { canAfford: true, budgetStatus };
      }

      if (estimatedCost > budgetStatus.remaining) {
        return {
          canAfford: false,
          budgetStatus,
          reason: `Campaign cost ($${estimatedCost.toFixed(4)}) exceeds remaining budget ($${budgetStatus.remaining.toFixed(2)})`
        };
      }

      const newPercentage = ((budgetStatus.used + estimatedCost) / budgetStatus.allocated) * 100;
      if (newPercentage > 100) {
        return {
          canAfford: false,
          budgetStatus,
          reason: `Campaign would exceed monthly budget limit`
        };
      }

      return { canAfford: true, budgetStatus };
    } catch (error) {
      logger.error('Failed to check campaign affordability', { error, userId, estimatedCost });
      throw error;
    }
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(
    userId: string,
    months = 6
  ): Promise<{
    monthlyBreakdown: Array<{
      month: string;
      messageCount: number;
      cost: number;
      averageCostPerMessage: number;
    }>;
    providerComparison: Array<{
      provider: string;
      messageCount: number;
      cost: number;
      averageCostPerMessage: number;
      marketShare: number;
    }>;
    costTrends: {
      totalSpent: number;
      averageMonthlySpend: number;
      costEfficiencyTrend: 'improving' | 'stable' | 'worsening';
    };
  }> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const usageRecords = await prisma.sMSUsage.findMany({
        where: {
          userId,
          recordedAt: { gte: startDate }
        },
        orderBy: { recordedAt: 'asc' }
      });

      // Monthly breakdown
      const monthlyData = new Map<string, { messageCount: number; cost: number }>();
      
      usageRecords.forEach(record => {
        const monthKey = record.recordedAt.toISOString().substring(0, 7); // YYYY-MM
        const existing = monthlyData.get(monthKey) || { messageCount: 0, cost: 0 };
        monthlyData.set(monthKey, {
          messageCount: existing.messageCount + record.messageCount,
          cost: existing.cost + record.cost
        });
      });

      const monthlyBreakdown = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        messageCount: data.messageCount,
        cost: Math.round(data.cost * 100) / 100,
        averageCostPerMessage: data.messageCount > 0 ? 
          Math.round((data.cost / data.messageCount) * 10000) / 10000 : 0
      }));

      // Provider comparison
      const providerData = new Map<string, { messageCount: number; cost: number }>();
      
      usageRecords.forEach(record => {
        const existing = providerData.get(record.provider) || { messageCount: 0, cost: 0 };
        providerData.set(record.provider, {
          messageCount: existing.messageCount + record.messageCount,
          cost: existing.cost + record.cost
        });
      });

      const totalMessages = usageRecords.reduce((sum, r) => sum + r.messageCount, 0);
      
      const providerComparison = Array.from(providerData.entries()).map(([provider, data]) => ({
        provider,
        messageCount: data.messageCount,
        cost: Math.round(data.cost * 100) / 100,
        averageCostPerMessage: data.messageCount > 0 ? 
          Math.round((data.cost / data.messageCount) * 10000) / 10000 : 0,
        marketShare: totalMessages > 0 ? Math.round((data.messageCount / totalMessages) * 100) : 0
      }));

      // Cost trends
      const totalSpent = usageRecords.reduce((sum, r) => sum + r.cost, 0);
      const averageMonthlySpend = monthlyBreakdown.length > 0 ? 
        totalSpent / monthlyBreakdown.length : 0;

      // Determine cost efficiency trend
      let costEfficiencyTrend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (monthlyBreakdown.length >= 3) {
        const recent3Months = monthlyBreakdown.slice(-3);
        const older3Months = monthlyBreakdown.slice(-6, -3);
        
        const recentAvgCost = recent3Months.reduce((sum, m) => sum + m.averageCostPerMessage, 0) / recent3Months.length;
        const olderAvgCost = older3Months.reduce((sum, m) => sum + m.averageCostPerMessage, 0) / older3Months.length;
        
        if (recentAvgCost < olderAvgCost * 0.95) {
          costEfficiencyTrend = 'improving';
        } else if (recentAvgCost > olderAvgCost * 1.05) {
          costEfficiencyTrend = 'worsening';
        }
      }

      return {
        monthlyBreakdown,
        providerComparison,
        costTrends: {
          totalSpent: Math.round(totalSpent * 100) / 100,
          averageMonthlySpend: Math.round(averageMonthlySpend * 100) / 100,
          costEfficiencyTrend
        }
      };
    } catch (error) {
      logger.error('Failed to get cost analytics', { error, userId, months });
      throw error;
    }
  }

  /**
   * Check budget alerts
   */
  private async checkBudgetAlerts(userId: string): Promise<void> {
    try {
      const budgetStatus = await this.getBudgetStatus(userId);
      
      if (budgetStatus.alertsTriggered.length > 0) {
        // In a real implementation, you would send actual alerts here
        logger.info('Budget alerts triggered', {
          userId,
          alerts: budgetStatus.alertsTriggered,
          budgetStatus
        });

        await smsLogger.logBudgetAlert(userId, budgetStatus.alertsTriggered, {
          percentageUsed: budgetStatus.percentageUsed,
          remaining: budgetStatus.remaining
        });
      }
    } catch (error) {
      logger.error('Failed to check budget alerts', { error, userId });
    }
  }

  /**
   * Get current billing period (YYYY-MM format)
   */
  private getCurrentBillingPeriod(): string {
    return new Date().toISOString().substring(0, 7);
  }

  /**
   * Get last billing period
   */
  private getLastBillingPeriod(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().substring(0, 7);
  }
}

// Export singleton instance
export const smsCostTracker = new SMSCostTracker();