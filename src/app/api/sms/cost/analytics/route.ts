/**
 * SMS Cost Analytics API Endpoint
 * 
 * Provides detailed cost analytics, trends, and insights for SMS campaigns.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smsCostTracker } from '@/lib/sms-cost-tracker';
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from '@/lib/errors';

// GET - Get SMS cost analytics
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const months = Math.min(12, Math.max(1, Number.parseInt(searchParams.get('months') || '6')));
    const includePrediction = searchParams.get('includePrediction') === 'true';

    const analytics = await smsCostTracker.getCostAnalytics(session.user.id, months);

    const response: any = {
      success: true,
      analytics: {
        ...analytics,
        period: {
          months,
          startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7),
          endDate: new Date().toISOString().substring(0, 7)
        }
      }
    };

    // Add cost predictions if requested
    if (includePrediction && analytics.monthlyBreakdown.length >= 3) {
      const recentMonths = analytics.monthlyBreakdown.slice(-3);
      const avgMonthlyCost = recentMonths.reduce((sum, month) => sum + month.cost, 0) / recentMonths.length;
      const avgMonthlyMessages = recentMonths.reduce((sum, month) => sum + month.messageCount, 0) / recentMonths.length;

      // Simple trend prediction
      const costTrend = recentMonths.length >= 2 ? 
        (recentMonths[recentMonths.length - 1].cost - recentMonths[0].cost) / (recentMonths.length - 1) : 0;

      response.analytics.predictions = {
        nextMonthEstimate: Math.max(0, avgMonthlyCost + costTrend),
        nextMonthMessages: Math.round(avgMonthlyMessages),
        costTrend: costTrend > 0 ? 'increasing' : costTrend < 0 ? 'decreasing' : 'stable',
        confidenceLevel: recentMonths.length >= 3 ? 'medium' : 'low'
      };
    }

    // Add cost optimization recommendations
    const recommendations = [];

    if (analytics.providerComparison.length > 1) {
      const sortedProviders = analytics.providerComparison.sort((a, b) => a.averageCostPerMessage - b.averageCostPerMessage);
      const cheapest = sortedProviders[0];
      const mostExpensive = sortedProviders[sortedProviders.length - 1];

      if (mostExpensive.averageCostPerMessage > cheapest.averageCostPerMessage * 1.1) {
        const savings = (mostExpensive.averageCostPerMessage - cheapest.averageCostPerMessage) * 
                       analytics.monthlyBreakdown.reduce((sum, m) => sum + m.messageCount, 0);
        
        recommendations.push({
          type: 'provider_optimization',
          message: `Switch to ${cheapest.provider} to save approximately $${savings.toFixed(2)} per month`,
          priority: 'high',
          potentialSavings: savings
        });
      }
    }

    if (analytics.costTrends.costEfficiencyTrend === 'worsening') {
      recommendations.push({
        type: 'efficiency_alert',
        message: 'Your SMS costs per message are increasing. Review your provider rates and message optimization.',
        priority: 'medium'
      });
    }

    const totalMessages = analytics.monthlyBreakdown.reduce((sum, m) => sum + m.messageCount, 0);
    if (totalMessages >= 10000) {
      recommendations.push({
        type: 'bulk_discount',
        message: 'You qualify for bulk pricing discounts. Contact your SMS provider for better rates.',
        priority: 'medium'
      });
    }

    response.analytics.recommendations = recommendations;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting SMS cost analytics:', error);
    return handleApiError(error, '/api/sms/cost/analytics/route.ts');
  }
}