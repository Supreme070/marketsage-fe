/**
 * SMS Cost Check API Endpoint
 * 
 * Checks if a user can afford a campaign within their budget limits.
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

// POST - Check if user can afford SMS campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { 
      contactCount, 
      provider = 'termii', 
      countryCode 
    } = body;

    // Validate required fields
    if (!contactCount || contactCount <= 0) {
      return validationError('contactCount must be a positive number');
    }

    if (contactCount > 1000000) {
      return validationError('contactCount cannot exceed 1,000,000');
    }

    // Calculate campaign cost
    const costCalculation = await smsCostTracker.calculateCampaignCost(
      contactCount, 
      provider, 
      countryCode
    );

    // Check budget affordability
    const affordabilityCheck = await smsCostTracker.canAffordCampaign(
      session.user.id, 
      costCalculation.totalCost
    );

    const response = {
      success: true,
      campaign: {
        contactCount,
        provider,
        countryCode: countryCode || 'global',
        estimatedCost: costCalculation.totalCost,
        costPerMessage: costCalculation.costPerMessage,
        discount: costCalculation.discount,
        originalCost: costCalculation.originalCost
      },
      budget: {
        canAfford: affordabilityCheck.canAfford,
        reason: affordabilityCheck.reason,
        currentStatus: affordabilityCheck.budgetStatus,
        remainingAfterCampaign: affordabilityCheck.canAfford ? 
          Math.round((affordabilityCheck.budgetStatus.remaining - costCalculation.totalCost) * 100) / 100 : 
          affordabilityCheck.budgetStatus.remaining
      },
      recommendations: []
    };

    // Add recommendations based on budget status
    if (!affordabilityCheck.canAfford) {
      response.recommendations.push({
        type: 'budget_increase',
        message: 'Increase your monthly SMS budget to send this campaign',
        priority: 'high'
      });
      
      if (costCalculation.discount > 0) {
        response.recommendations.push({
          type: 'bulk_discount',
          message: `You're already getting a ${costCalculation.discount}% bulk discount`,
          priority: 'low'
        });
      }
    } else {
      const remainingPercentage = affordabilityCheck.budgetStatus.allocated > 0 ? 
        ((affordabilityCheck.budgetStatus.remaining - costCalculation.totalCost) / affordabilityCheck.budgetStatus.allocated) * 100 : 100;

      if (remainingPercentage < 10) {
        response.recommendations.push({
          type: 'budget_warning',
          message: 'This campaign will use most of your remaining budget',
          priority: 'medium'
        });
      }

      if (costCalculation.discount === 0 && contactCount >= 500) {
        response.recommendations.push({
          type: 'bulk_opportunity',
          message: 'Consider increasing your message count to qualify for bulk discounts',
          priority: 'low'
        });
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking SMS campaign affordability:', error);
    return handleApiError(error, '/api/sms/cost/check/route.ts');
  }
}