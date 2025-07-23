import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowTemplateMarketplace } from '@/lib/workflow/template-marketplace';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get template categories with counts
    const categories = await workflowTemplateMarketplace.getCategories();

    // Add category metadata
    const categoryMetadata = {
      WELCOME_SERIES: {
        name: 'Welcome Series',
        description: 'Onboard new customers with automated welcome sequences',
        icon: 'welcome'
      },
      ABANDONED_CART: {
        name: 'Abandoned Cart',
        description: 'Recover lost sales with automated cart recovery emails',
        icon: 'cart'
      },
      LEAD_NURTURING: {
        name: 'Lead Nurturing',
        description: 'Convert prospects into customers with targeted nurturing',
        icon: 'nurture'
      },
      CUSTOMER_RETENTION: {
        name: 'Customer Retention',
        description: 'Keep customers engaged and reduce churn',
        icon: 'retention'
      },
      RE_ENGAGEMENT: {
        name: 'Re-engagement',
        description: 'Win back inactive customers and subscribers',
        icon: 'reengage'
      },
      EVENT_BASED: {
        name: 'Event-Based',
        description: 'Trigger campaigns based on user actions and events',
        icon: 'event'
      },
      BIRTHDAY_CAMPAIGNS: {
        name: 'Birthday Campaigns',
        description: 'Celebrate customer birthdays with special offers',
        icon: 'birthday'
      },
      PRODUCT_LAUNCH: {
        name: 'Product Launch',
        description: 'Announce new products and features to your audience',
        icon: 'launch'
      },
      EDUCATIONAL_SERIES: {
        name: 'Educational Series',
        description: 'Educate customers with valuable content series',
        icon: 'education'
      },
      FEEDBACK_COLLECTION: {
        name: 'Feedback Collection',
        description: 'Gather customer feedback and improve your service',
        icon: 'feedback'
      },
      REFERRAL_PROGRAMS: {
        name: 'Referral Programs',
        description: 'Leverage customer referrals to grow your business',
        icon: 'referral'
      },
      SEASONAL_CAMPAIGNS: {
        name: 'Seasonal Campaigns',
        description: 'Create campaigns for holidays and special occasions',
        icon: 'seasonal'
      },
      TRANSACTIONAL: {
        name: 'Transactional',
        description: 'Order confirmations, receipts, and shipping updates',
        icon: 'transaction'
      },
      FINTECH_ONBOARDING: {
        name: 'Fintech Onboarding',
        description: 'KYC, account verification, and fintech user onboarding',
        icon: 'fintech'
      },
      PAYMENT_REMINDERS: {
        name: 'Payment Reminders',
        description: 'Automated payment due dates and overdue reminders',
        icon: 'payment'
      },
      KYC_VERIFICATION: {
        name: 'KYC Verification',
        description: 'Know Your Customer verification workflows',
        icon: 'kyc'
      },
      LOAN_APPLICATION: {
        name: 'Loan Application',
        description: 'Loan application processing and approval workflows',
        icon: 'loan'
      },
      SAVINGS_GOALS: {
        name: 'Savings Goals',
        description: 'Help customers track and achieve savings goals',
        icon: 'savings'
      },
      INVESTMENT_ALERTS: {
        name: 'Investment Alerts',
        description: 'Market updates and investment opportunity alerts',
        icon: 'investment'
      },
      CUSTOM: {
        name: 'Custom',
        description: 'Build your own custom workflow templates',
        icon: 'custom'
      }
    };

    const enrichedCategories = categories.map(cat => ({
      ...cat,
      ...categoryMetadata[cat.category as keyof typeof categoryMetadata]
    }));

    return NextResponse.json({
      success: true,
      data: enrichedCategories
    });

  } catch (error) {
    logger.error('Error getting template categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get template categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}