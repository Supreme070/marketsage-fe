/**
 * Workflow Cost Tracking and Budget Management System
 * 
 * Provides comprehensive cost tracking for workflow executions including:
 * - Real-time cost calculation for email, SMS, WhatsApp, API calls
 * - Budget management with alerts and restrictions
 * - Cost projections and analytics
 * - Cost optimization recommendations
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface CostEntry {
  costType: string;
  amount: number;
  quantity: number;
  unitCost: number;
  description?: string;
  provider?: string;
  region?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface BudgetAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  thresholdValue?: number;
  currentValue?: number;
  projectedValue?: number;
}

export interface CostProjection {
  period: string;
  projectedCost: number;
  projectedVolume: number;
  confidenceLevel: number;
  breakdown: {
    email: number;
    sms: number;
    whatsapp: number;
    api: number;
  };
}

export interface BudgetSettings {
  budgetAmount: number;
  currency: string;
  period: string;
  startDate: Date;
  endDate: Date;
  warningThreshold: number;
  criticalThreshold: number;
  pauseOnExceeded: boolean;
  autoRenew: boolean;
}

export class WorkflowCostTracker {
  /**
   * Initialize cost tracking for a workflow
   */
  async initializeCostTracking(workflowId: string): Promise<string> {
    try {
      // Check if cost tracking already exists
      const existingTracking = await prisma.workflowCostTracking.findUnique({
        where: { workflowId }
      });

      if (existingTracking) {
        return existingTracking.id;
      }

      // Create new cost tracking record
      const costTracking = await prisma.workflowCostTracking.create({
        data: {
          workflowId,
          currentPeriodCost: 0,
          lastPeriodCost: 0,
          totalCost: 0,
          periodStartDate: new Date(),
          lastCalculatedAt: new Date()
        }
      });

      logger.info('Cost tracking initialized', { workflowId, trackingId: costTracking.id });
      return costTracking.id;
    } catch (error) {
      logger.error('Error initializing cost tracking:', error);
      throw error;
    }
  }

  /**
   * Record a cost entry for workflow execution
   */
  async recordCost(
    workflowId: string,
    executionId: string | null,
    costEntry: CostEntry
  ): Promise<void> {
    try {
      // Ensure cost tracking exists
      const trackingId = await this.initializeCostTracking(workflowId);

      // Create cost entry
      await prisma.workflowCostEntry.create({
        data: {
          id: uuidv4(),
          workflowId,
          costTrackingId: trackingId,
          executionId,
          costType: costEntry.costType as any,
          amount: costEntry.amount,
          quantity: costEntry.quantity,
          unitCost: costEntry.unitCost,
          description: costEntry.description,
          provider: costEntry.provider,
          region: costEntry.region,
          currency: costEntry.currency || 'USD',
          metadata: costEntry.metadata || {}
        }
      });

      // Update cost tracking aggregates
      await this.updateCostTracking(workflowId, costEntry);

      // Check budget alerts
      await this.checkBudgetAlerts(workflowId);

      logger.debug('Cost recorded', {
        workflowId,
        executionId,
        costType: costEntry.costType,
        amount: costEntry.amount
      });
    } catch (error) {
      logger.error('Error recording cost:', error);
      throw error;
    }
  }

  /**
   * Record email sending cost
   */
  async recordEmailCost(
    workflowId: string,
    executionId: string | null,
    emailCount: number,
    provider = 'default'
  ): Promise<void> {
    const unitCost = await this.getCostRule(workflowId, 'EMAIL_SEND', provider);
    
    await this.recordCost(workflowId, executionId, {
      costType: 'EMAIL_SEND',
      amount: emailCount * unitCost,
      quantity: emailCount,
      unitCost,
      description: `Email sending via ${provider}`,
      provider
    });
  }

  /**
   * Record SMS sending cost
   */
  async recordSmsCost(
    workflowId: string,
    executionId: string | null,
    smsCount: number,
    provider = 'default',
    region = 'default'
  ): Promise<void> {
    const unitCost = await this.getCostRule(workflowId, 'SMS_SEND', provider, region);
    
    await this.recordCost(workflowId, executionId, {
      costType: 'SMS_SEND',
      amount: smsCount * unitCost,
      quantity: smsCount,
      unitCost,
      description: `SMS sending via ${provider} in ${region}`,
      provider,
      region
    });
  }

  /**
   * Record WhatsApp sending cost
   */
  async recordWhatsAppCost(
    workflowId: string,
    executionId: string | null,
    messageCount: number,
    provider = 'meta'
  ): Promise<void> {
    const unitCost = await this.getCostRule(workflowId, 'WHATSAPP_SEND', provider);
    
    await this.recordCost(workflowId, executionId, {
      costType: 'WHATSAPP_SEND',
      amount: messageCount * unitCost,
      quantity: messageCount,
      unitCost,
      description: `WhatsApp messages via ${provider}`,
      provider
    });
  }

  /**
   * Record API call cost
   */
  async recordApiCallCost(
    workflowId: string,
    executionId: string | null,
    callCount: number,
    apiProvider: string
  ): Promise<void> {
    const unitCost = await this.getCostRule(workflowId, 'API_CALL', apiProvider);
    
    await this.recordCost(workflowId, executionId, {
      costType: 'API_CALL',
      amount: callCount * unitCost,
      quantity: callCount,
      unitCost,
      description: `API calls to ${apiProvider}`,
      provider: apiProvider
    });
  }

  /**
   * Get workflow cost summary
   */
  async getCostSummary(workflowId: string) {
    try {
      const costTracking = await prisma.workflowCostTracking.findUnique({
        where: { workflowId },
        include: {
          costEntries: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      if (!costTracking) {
        await this.initializeCostTracking(workflowId);
        return this.getCostSummary(workflowId);
      }

      // Get budget information
      const activeBudgets = await prisma.workflowBudget.findMany({
        where: {
          workflowId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      // Get recent alerts
      const recentAlerts = await prisma.workflowCostAlert.findMany({
        where: { workflowId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return {
        totalCost: costTracking.totalCost,
        currentPeriodCost: costTracking.currentPeriodCost,
        lastPeriodCost: costTracking.lastPeriodCost,
        breakdown: {
          email: costTracking.emailCosts,
          sms: costTracking.smsCosts,
          whatsapp: costTracking.whatsappCosts,
          api: costTracking.apiCosts,
          webhook: costTracking.webhookCosts,
          storage: costTracking.storageCosts,
          compute: costTracking.computeCosts,
          external: costTracking.externalCosts
        },
        volume: {
          totalExecutions: costTracking.totalExecutions,
          emailsSent: costTracking.emailsSent,
          smsSent: costTracking.smsSent,
          whatsappSent: costTracking.whatsappSent,
          apiCalls: costTracking.apiCalls,
          webhookCalls: costTracking.webhookCalls
        },
        efficiency: {
          costPerExecution: costTracking.costPerExecution,
          costPerContact: costTracking.costPerContact,
          costPerConversion: costTracking.costPerConversion
        },
        budgets: activeBudgets.map(budget => ({
          id: budget.id,
          name: budget.name,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          remainingAmount: budget.remainingAmount,
          percentage: (budget.spentAmount / budget.budgetAmount) * 100,
          period: budget.budgetPeriod,
          endDate: budget.endDate
        })),
        recentEntries: costTracking.costEntries,
        alerts: recentAlerts,
        lastCalculatedAt: costTracking.lastCalculatedAt
      };
    } catch (error) {
      logger.error('Error getting cost summary:', error);
      throw error;
    }
  }

  /**
   * Create or update workflow budget
   */
  async createBudget(
    workflowId: string,
    settings: BudgetSettings,
    createdBy: string
  ): Promise<string> {
    try {
      const budget = await prisma.workflowBudget.create({
        data: {
          id: uuidv4(),
          workflowId,
          name: `${settings.period} Budget`,
          budgetAmount: settings.budgetAmount,
          spentAmount: 0,
          remainingAmount: settings.budgetAmount,
          currency: settings.currency,
          budgetPeriod: settings.period as any,
          startDate: settings.startDate,
          endDate: settings.endDate,
          warningThreshold: settings.warningThreshold,
          criticalThreshold: settings.criticalThreshold,
          pauseOnExceeded: settings.pauseOnExceeded,
          autoRenew: settings.autoRenew,
          createdBy
        }
      });

      logger.info('Budget created', {
        workflowId,
        budgetId: budget.id,
        amount: settings.budgetAmount
      });

      return budget.id;
    } catch (error) {
      logger.error('Error creating budget:', error);
      throw error;
    }
  }

  /**
   * Get cost projections for workflow
   */
  async generateCostProjection(
    workflowId: string,
    projectionPeriod = 'MONTHLY'
  ): Promise<CostProjection> {
    try {
      // Get historical data for the last period
      const endDate = new Date();
      const startDate = new Date();
      
      // Adjust start date based on projection period
      switch (projectionPeriod) {
        case 'WEEKLY':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'MONTHLY':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'QUARTERLY':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get historical cost data
      const costEntries = await prisma.workflowCostEntry.findMany({
        where: {
          workflowId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate historical totals
      const historicalCost = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const historicalVolume = costEntries.reduce((sum, entry) => sum + entry.quantity, 0);

      // Get cost breakdown by type
      const breakdown = {
        email: costEntries.filter(e => e.costType === 'EMAIL_SEND').reduce((sum, e) => sum + e.amount, 0),
        sms: costEntries.filter(e => e.costType === 'SMS_SEND').reduce((sum, e) => sum + e.amount, 0),
        whatsapp: costEntries.filter(e => e.costType === 'WHATSAPP_SEND').reduce((sum, e) => sum + e.amount, 0),
        api: costEntries.filter(e => e.costType === 'API_CALL').reduce((sum, e) => sum + e.amount, 0)
      };

      // Simple growth projection (can be enhanced with ML)
      const growthRate = 1.1; // 10% growth assumption
      const projectedCost = historicalCost * growthRate;
      const projectedVolume = Math.round(historicalVolume * growthRate);

      // Calculate confidence level based on data quality
      const confidenceLevel = Math.min(95, Math.max(60, costEntries.length * 2));

      // Store projection
      await prisma.workflowCostProjection.create({
        data: {
          workflowId,
          projectionPeriod: projectionPeriod as any,
          projectionDate: new Date(),
          basePeriodStart: startDate,
          basePeriodEnd: endDate,
          historicalCost,
          historicalVolume,
          projectedCost,
          projectedVolume,
          confidenceLevel,
          projectedEmailCost: breakdown.email * growthRate,
          projectedSmsCost: breakdown.sms * growthRate,
          projectedWhatsappCost: breakdown.whatsapp * growthRate,
          projectedApiCost: breakdown.api * growthRate,
          calculationMethod: 'linear_growth'
        }
      });

      return {
        period: projectionPeriod,
        projectedCost,
        projectedVolume,
        confidenceLevel,
        breakdown: {
          email: breakdown.email * growthRate,
          sms: breakdown.sms * growthRate,
          whatsapp: breakdown.whatsapp * growthRate,
          api: breakdown.api * growthRate
        }
      };
    } catch (error) {
      logger.error('Error generating cost projection:', error);
      throw error;
    }
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizationRecommendations(workflowId: string) {
    try {
      const costSummary = await this.getCostSummary(workflowId);
      const recommendations = [];

      // Analyze cost breakdown for optimization opportunities
      const totalCost = costSummary.totalCost;
      
      if (costSummary.breakdown.email > totalCost * 0.5) {
        recommendations.push({
          type: 'EMAIL_OPTIMIZATION',
          priority: 'HIGH',
          title: 'Optimize Email Costs',
          description: 'Email costs account for over 50% of workflow expenses. Consider email list segmentation or alternative providers.',
          potentialSavings: costSummary.breakdown.email * 0.2,
          actions: [
            'Implement email list segmentation',
            'Review email provider pricing',
            'Add unsubscribe management',
            'Optimize email frequency'
          ]
        });
      }

      if (costSummary.breakdown.sms > totalCost * 0.3) {
        recommendations.push({
          type: 'SMS_OPTIMIZATION',
          priority: 'MEDIUM',
          title: 'Optimize SMS Costs',
          description: 'SMS costs are significant. Consider bulk messaging discounts or regional optimization.',
          potentialSavings: costSummary.breakdown.sms * 0.15,
          actions: [
            'Negotiate bulk SMS rates',
            'Optimize SMS timing',
            'Consider WhatsApp for some messages',
            'Implement SMS character optimization'
          ]
        });
      }

      if (costSummary.efficiency.costPerConversion > 5) {
        recommendations.push({
          type: 'CONVERSION_OPTIMIZATION',
          priority: 'HIGH',
          title: 'Improve Conversion Efficiency',
          description: 'Cost per conversion is high. Focus on improving workflow targeting and timing.',
          potentialSavings: totalCost * 0.3,
          actions: [
            'Improve audience targeting',
            'A/B test messaging content',
            'Optimize send timing',
            'Add personalization'
          ]
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Error getting optimization recommendations:', error);
      throw error;
    }
  }

  // Private helper methods

  private async updateCostTracking(workflowId: string, costEntry: CostEntry) {
    try {
      const updates: any = {
        totalCost: { increment: costEntry.amount },
        currentPeriodCost: { increment: costEntry.amount },
        lastCalculatedAt: new Date()
      };

      // Update specific cost type
      switch (costEntry.costType) {
        case 'EMAIL_SEND':
          updates.emailCosts = { increment: costEntry.amount };
          updates.emailsSent = { increment: costEntry.quantity };
          break;
        case 'SMS_SEND':
          updates.smsCosts = { increment: costEntry.amount };
          updates.smsSent = { increment: costEntry.quantity };
          break;
        case 'WHATSAPP_SEND':
          updates.whatsappCosts = { increment: costEntry.amount };
          updates.whatsappSent = { increment: costEntry.quantity };
          break;
        case 'API_CALL':
          updates.apiCosts = { increment: costEntry.amount };
          updates.apiCalls = { increment: costEntry.quantity };
          break;
        case 'WEBHOOK_CALL':
          updates.webhookCosts = { increment: costEntry.amount };
          updates.webhookCalls = { increment: costEntry.quantity };
          break;
      }

      await prisma.workflowCostTracking.update({
        where: { workflowId },
        data: updates
      });

      // Update budget spent amounts
      await this.updateBudgetSpending(workflowId, costEntry.amount);
    } catch (error) {
      logger.error('Error updating cost tracking:', error);
      throw error;
    }
  }

  private async updateBudgetSpending(workflowId: string, amount: number) {
    try {
      await prisma.workflowBudget.updateMany({
        where: {
          workflowId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        data: {
          spentAmount: { increment: amount },
          remainingAmount: { decrement: amount }
        }
      });
    } catch (error) {
      logger.error('Error updating budget spending:', error);
    }
  }

  private async checkBudgetAlerts(workflowId: string) {
    try {
      const budgets = await prisma.workflowBudget.findMany({
        where: {
          workflowId,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      for (const budget of budgets) {
        const spentPercentage = (budget.spentAmount / budget.budgetAmount) * 100;
        
        // Check for threshold alerts
        if (spentPercentage >= budget.criticalThreshold && budget.lastAlertSent !== budget.exceededAt) {
          await this.createBudgetAlert(workflowId, budget.id, 'BUDGET_THRESHOLD', 'CRITICAL', {
            title: 'Budget Critical Threshold Exceeded',
            message: `Workflow has spent ${spentPercentage.toFixed(1)}% of budget (${budget.spentAmount}/${budget.budgetAmount})`,
            thresholdValue: budget.criticalThreshold,
            currentValue: spentPercentage
          });
        } else if (spentPercentage >= budget.warningThreshold && !budget.lastAlertSent) {
          await this.createBudgetAlert(workflowId, budget.id, 'BUDGET_THRESHOLD', 'MEDIUM', {
            title: 'Budget Warning Threshold Reached',
            message: `Workflow has spent ${spentPercentage.toFixed(1)}% of budget`,
            thresholdValue: budget.warningThreshold,
            currentValue: spentPercentage
          });
        }

        // Check for budget exceeded
        if (budget.spentAmount > budget.budgetAmount && !budget.exceededAt) {
          await prisma.workflowBudget.update({
            where: { id: budget.id },
            data: { exceededAt: new Date() }
          });

          if (budget.pauseOnExceeded) {
            // Pause workflow when budget is exceeded
            await prisma.workflow.update({
              where: { id: workflowId },
              data: { status: 'PAUSED' }
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking budget alerts:', error);
    }
  }

  private async createBudgetAlert(
    workflowId: string,
    budgetId: string,
    alertType: string,
    severity: string,
    alertData: any
  ) {
    try {
      await prisma.workflowCostAlert.create({
        data: {
          workflowId,
          budgetId,
          alertType: alertType as any,
          severity,
          title: alertData.title,
          message: alertData.message,
          thresholdValue: alertData.thresholdValue,
          currentValue: alertData.currentValue,
          projectedValue: alertData.projectedValue,
          metadata: alertData.metadata || {}
        }
      });

      // Update budget alert timestamp
      await prisma.workflowBudget.update({
        where: { id: budgetId },
        data: { lastAlertSent: new Date() }
      });
    } catch (error) {
      logger.error('Error creating budget alert:', error);
    }
  }

  private async getCostRule(
    workflowId: string,
    costType: string,
    provider?: string,
    region?: string
  ): Promise<number> {
    try {
      // Get most specific cost rule first (workflow-specific)
      const rules = await prisma.workflowCostRule.findMany({
        where: {
          OR: [
            { workflowId },
            { workflowId: null }  // Global rules
          ],
          costType: costType as any,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        },
        orderBy: [
          { workflowId: 'desc' },  // Workflow-specific first
          { priority: 'desc' }     // Higher priority first
        ]
      });

      // Find the best matching rule
      for (const rule of rules) {
        if ((!rule.provider || rule.provider === provider) &&
            (!rule.region || rule.region === region)) {
          return rule.unitCost;
        }
      }

      // Default pricing if no rule found
      const defaultPricing: Record<string, number> = {
        EMAIL_SEND: 0.001,      // $0.001 per email
        SMS_SEND: 0.05,         // $0.05 per SMS
        WHATSAPP_SEND: 0.02,    // $0.02 per WhatsApp message
        API_CALL: 0.01,         // $0.01 per API call
        WEBHOOK_CALL: 0.005,    // $0.005 per webhook
        DATA_STORAGE: 0.1,      // $0.1 per GB
        COMPUTE_TIME: 0.0001    // $0.0001 per second
      };

      return defaultPricing[costType] || 0.01;
    } catch (error) {
      logger.error('Error getting cost rule:', error);
      return 0.01; // Fallback cost
    }
  }
}

// Export singleton instance
export const workflowCostTracker = new WorkflowCostTracker();