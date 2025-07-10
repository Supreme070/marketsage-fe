/**
 * SMS Budget Management API Endpoint
 * 
 * Handles SMS budget setting, monitoring, and alerts.
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

// POST - Set SMS budget
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { monthlyBudget, alerts = [] } = body;

    // Validate required fields
    if (!monthlyBudget || monthlyBudget <= 0) {
      return validationError('monthlyBudget must be a positive number');
    }

    if (monthlyBudget > 100000) {
      return validationError('monthlyBudget cannot exceed $100,000');
    }

    // Validate alerts
    if (alerts.length > 0) {
      for (const alert of alerts) {
        if (!alert.threshold || alert.threshold <= 0 || alert.threshold > 100) {
          return validationError('Alert threshold must be between 1 and 100');
        }
        if (!alert.alertType || !['email', 'sms', 'webhook'].includes(alert.alertType)) {
          return validationError('Alert type must be email, sms, or webhook');
        }
        if (!alert.recipients || !Array.isArray(alert.recipients) || alert.recipients.length === 0) {
          return validationError('Alert recipients are required');
        }
      }
    }

    const result = await smsCostTracker.setUserBudget(session.user.id, monthlyBudget, alerts);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to set budget'
      }, { status: 500 });
    }

    // Get updated budget status
    const budgetStatus = await smsCostTracker.getBudgetStatus(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'SMS budget set successfully',
      budget: {
        monthlyBudget,
        alerts: alerts.length,
        status: budgetStatus
      }
    });

  } catch (error) {
    console.error('Error setting SMS budget:', error);
    return handleApiError(error, '/api/sms/cost/budget/route.ts');
  }
}

// GET - Get SMS budget status
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('includeUsage') === 'true';

    const budgetStatus = await smsCostTracker.getBudgetStatus(session.user.id);

    const response: any = {
      success: true,
      budget: budgetStatus
    };

    if (includeUsage) {
      const [currentUsage, lastUsage] = await Promise.all([
        smsCostTracker.getUserUsage(session.user.id, 'current'),
        smsCostTracker.getUserUsage(session.user.id, 'last')
      ]);

      response.usage = {
        current: currentUsage,
        last: lastUsage,
        comparison: {
          messageDifference: currentUsage.messageCount - lastUsage.messageCount,
          costDifference: Math.round((currentUsage.totalCost - lastUsage.totalCost) * 100) / 100,
          percentChange: lastUsage.totalCost > 0 ? 
            Math.round(((currentUsage.totalCost - lastUsage.totalCost) / lastUsage.totalCost) * 100) : 0
        }
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting SMS budget status:', error);
    return handleApiError(error, '/api/sms/cost/budget/route.ts');
  }
}