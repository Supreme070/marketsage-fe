/**
 * Birthday Campaign Auto-Detection API Endpoints
 * ==============================================
 * 
 * API endpoints for managing automated birthday campaign detection and creation.
 * Provides both manual triggers and analytics for birthday campaign performance.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getBirthdayAutoDetectionSystem,
  runBirthdayDetection,
  type BirthdayDetectionResult
} from '@/lib/campaigns/birthday-auto-detection';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const TriggerDetectionSchema = z.object({
  organizationId: z.string().optional(),
  dryRun: z.boolean().default(false),
  timeframe: z.enum(['today', 'tomorrow', 'week', 'all']).default('all')
});

const AnalyticsSchema = z.object({
  organizationId: z.string().optional(),
  days: z.number().min(1).max(365).default(30),
  includeRevenue: z.boolean().default(true)
});

/**
 * Handle birthday detection operations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'trigger-detection';

    const body = await request.json();

    if (action === 'trigger-detection') {
      return await handleTriggerDetection(body, session);
    } else if (action === 'analytics') {
      return await handleGetAnalytics(body, session);
    } else if (action === 'preview') {
      return await handlePreviewDetection(body, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=trigger-detection, ?action=analytics, or ?action=preview' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to process birthday detection request', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to process birthday detection request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get birthday detection data and insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';

    if (action === 'dashboard') {
      return await handleGetDashboard(searchParams, session);
    } else if (action === 'upcoming') {
      return await handleGetUpcoming(searchParams, session);
    } else if (action === 'performance') {
      return await handleGetPerformance(searchParams, session);
    } else if (action === 'templates') {
      return await handleGetTemplates(searchParams, session);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=dashboard, ?action=upcoming, ?action=performance, or ?action=templates' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to get birthday detection data', {
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get birthday detection data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle manual birthday detection trigger
 */
async function handleTriggerDetection(body: any, session: any): Promise<NextResponse> {
  // Check permissions - only ADMIN and above can trigger detection
  if (!['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions - ADMIN access required' },
      { status: 403 }
    );
  }

  const validationResult = TriggerDetectionSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid birthday detection request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { organizationId, dryRun, timeframe } = validationResult.data;
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const result = await runBirthdayDetection(orgId);

    logger.info('Birthday detection triggered via API', {
      organizationId: orgId,
      timeframe,
      dryRun,
      campaignsCreated: result.campaignsCreated,
      estimatedRevenue: result.estimatedRevenue,
      triggeredBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        insights: [
          `Found ${result.totalContacts} upcoming birthdays`,
          `Created ${result.campaignsCreated} birthday campaigns`,
          `Estimated revenue: $${result.estimatedRevenue.toLocaleString()}`,
          `High-value birthdays: ${result.highValueBirthdays.length}`,
          `Missed opportunities: ${result.missedOpportunities.length}`
        ],
        recommendations: [
          result.missedOpportunities.length > 0 ? 
            `Consider creating recovery campaigns for ${result.missedOpportunities.length} missed birthdays` : 
            'No missed opportunities detected',
          result.highValueBirthdays.length > 0 ? 
            `Focus on ${result.highValueBirthdays.length} high-value birthday customers` : 
            'No high-value birthdays in current timeframe',
          'Enable daily automation for optimal birthday campaign timing'
        ],
        metadata: {
          triggeredBy: session.user.id,
          triggeredByName: session.user.name,
          triggeredAt: new Date(),
          dryRun,
          timeframe
        }
      }
    });

  } catch (error) {
    logger.error('Failed to trigger birthday detection', {
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to trigger birthday detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle birthday analytics request
 */
async function handleGetAnalytics(body: any, session: any): Promise<NextResponse> {
  const validationResult = AnalyticsSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid analytics request',
        details: validationResult.error.errors
      },
      { status: 400 }
    );
  }

  const { organizationId, days, includeRevenue } = validationResult.data;
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get birthday campaign performance
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        organizationId: orgId,
        sentAt: { gte: startDate },
        subject: { contains: 'birthday', mode: 'insensitive' }
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true
          }
        }
      }
    });

    // Calculate metrics
    const totalCampaigns = campaigns.length;
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const averageOpenRate = campaigns.length > 0 ? 
      campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length : 0;
    const averageClickRate = campaigns.length > 0 ?
      campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length : 0;

    // Get upcoming birthdays count
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingCount = await prisma.contact.count({
      where: {
        organizationId: orgId,
        dateOfBirth: { not: null },
        isDeleted: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days,
          startDate,
          endDate: new Date()
        },
        performance: {
          totalCampaigns,
          totalRevenue: includeRevenue ? totalRevenue : null,
          averageOpenRate: Number((averageOpenRate * 100).toFixed(1)),
          averageClickRate: Number((averageClickRate * 100).toFixed(1)),
          revenuePerCampaign: includeRevenue ? (totalRevenue / Math.max(totalCampaigns, 1)) : null
        },
        upcoming: {
          totalUpcoming: upcomingCount,
          nextMonth: upcomingCount // Simplified - would need proper birthday filtering
        },
        insights: [
          `${totalCampaigns} birthday campaigns sent in last ${days} days`,
          `Average open rate: ${(averageOpenRate * 100).toFixed(1)}%`,
          `Average click rate: ${(averageClickRate * 100).toFixed(1)}%`,
          includeRevenue ? `Total revenue: $${totalRevenue.toLocaleString()}` : 'Revenue tracking enabled',
          `${upcomingCount} contacts with birthday data available`
        ]
      }
    });

  } catch (error) {
    logger.error('Failed to get birthday analytics', {
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get birthday analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle preview detection (dry run)
 */
async function handlePreviewDetection(body: any, session: any): Promise<NextResponse> {
  const { organizationId } = body;
  const orgId = organizationId || session.user.organizationId;

  // Check organization access
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId !== orgId) {
    return NextResponse.json(
      { error: 'Unauthorized - Access denied to organization' },
      { status: 403 }
    );
  }

  try {
    // Get upcoming birthdays without creating campaigns
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: orgId,
        dateOfBirth: { not: null },
        isDeleted: false
      },
      include: {
        customerProfile: true
      },
      take: 100 // Limit for preview
    });

    const preview = {
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      highValue: 0,
      estimatedRevenue: 0
    };

    contacts.forEach(contact => {
      if (!contact.dateOfBirth) return;
      
      const birthday = new Date(contact.dateOfBirth);
      const thisBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      if (thisBirthday.getTime() === today.getTime()) {
        preview.today++;
      } else if (thisBirthday.getTime() === tomorrow.getTime()) {
        preview.tomorrow++;
      } else if (thisBirthday >= today && thisBirthday <= oneWeekLater) {
        preview.thisWeek++;
      }

      const clv = contact.customerProfile?.lifetimeValue || 0;
      if (clv > 1000) {
        preview.highValue++;
        preview.estimatedRevenue += 25; // Estimated revenue per high-value birthday
      } else {
        preview.estimatedRevenue += 15; // Estimated revenue per standard birthday
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        preview,
        insights: [
          `${preview.today} birthdays today`,
          `${preview.tomorrow} birthdays tomorrow`,
          `${preview.thisWeek} birthdays this week`,
          `${preview.highValue} high-value customers`,
          `Estimated revenue: $${preview.estimatedRevenue.toLocaleString()}`
        ],
        totalContacts: contacts.length,
        previewDate: new Date()
      }
    });

  } catch (error) {
    logger.error('Failed to preview birthday detection', {
      organizationId: orgId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to preview birthday detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle dashboard data request
 */
async function handleGetDashboard(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  try {
    // Quick dashboard stats
    const totalContacts = await prisma.contact.count({
      where: {
        organizationId,
        dateOfBirth: { not: null },
        isDeleted: false
      }
    });

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCampaigns = await prisma.emailCampaign.count({
      where: {
        organizationId,
        sentAt: { gte: last30Days },
        subject: { contains: 'birthday', mode: 'insensitive' }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalContacts,
        recentCampaigns,
        automationEnabled: true,
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    logger.error('Failed to get birthday dashboard data', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get birthday dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle upcoming birthdays request
 */
async function handleGetUpcoming(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const days = Number.parseInt(searchParams.get('days') || '7');

  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const contacts = await prisma.contact.findMany({
      where: {
        organizationId,
        dateOfBirth: { not: null },
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        customerProfile: {
          select: {
            lifetimeValue: true
          }
        }
      }
    });

    const upcomingBirthdays = contacts
      .filter(contact => {
        if (!contact.dateOfBirth) return false;
        const birthday = new Date(contact.dateOfBirth);
        const thisBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        return thisBirthday >= now && thisBirthday <= futureDate;
      })
      .sort((a, b) => {
        const aBirthday = new Date(now.getFullYear(), a.dateOfBirth!.getMonth(), a.dateOfBirth!.getDate());
        const bBirthday = new Date(now.getFullYear(), b.dateOfBirth!.getMonth(), b.dateOfBirth!.getDate());
        return aBirthday.getTime() - bBirthday.getTime();
      });

    return NextResponse.json({
      success: true,
      data: {
        upcomingBirthdays: upcomingBirthdays.map(contact => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          birthday: contact.dateOfBirth,
          lifetimeValue: contact.customerProfile?.lifetimeValue || 0,
          daysUntil: Math.ceil(
            (new Date(now.getFullYear(), contact.dateOfBirth!.getMonth(), contact.dateOfBirth!.getDate()).getTime() - now.getTime()) 
            / (24 * 60 * 60 * 1000)
          )
        })),
        total: upcomingBirthdays.length,
        timeframe: days
      }
    });

  } catch (error) {
    logger.error('Failed to get upcoming birthdays', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get upcoming birthdays',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle performance metrics request
 */
async function handleGetPerformance(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  const organizationId = session.user.role === 'SUPER_ADMIN' ? 
    searchParams.get('organizationId') || session.user.organizationId : 
    session.user.organizationId;

  const days = Number.parseInt(searchParams.get('days') || '30');

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        organizationId,
        sentAt: { gte: startDate },
        subject: { contains: 'birthday', mode: 'insensitive' }
      }
    });

    const metrics = {
      totalSent: campaigns.length,
      totalOpens: campaigns.reduce((sum, c) => sum + (c.opens || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
      openRate: campaigns.length > 0 ? 
        campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length : 0,
      clickRate: campaigns.length > 0 ?
        campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          ...metrics,
          openRate: Number((metrics.openRate * 100).toFixed(1)),
          clickRate: Number((metrics.clickRate * 100).toFixed(1)),
          revenuePerCampaign: metrics.totalSent > 0 ? metrics.totalRevenue / metrics.totalSent : 0
        },
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get birthday performance', {
      organizationId,
      error: error instanceof Error ? error.message : error
    });

    return NextResponse.json(
      { 
        error: 'Failed to get birthday performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle templates request
 */
async function handleGetTemplates(searchParams: URLSearchParams, session: any): Promise<NextResponse> {
  // Return default templates - in real implementation would fetch from database
  const templates = [
    {
      id: 'birthday_email_standard',
      name: 'Standard Birthday Email',
      type: 'email',
      subject: '🎉 Happy Birthday {{firstName}}! Special gift inside',
      preview: 'Happy Birthday! Enjoy 15% off on us...',
      performance: {
        openRate: 45,
        clickRate: 12,
        conversionRate: 8
      }
    },
    {
      id: 'birthday_sms_quick',
      name: 'Quick Birthday SMS',
      type: 'sms',
      preview: '🎂 Happy Birthday! Enjoy 10% off today...',
      performance: {
        openRate: 95,
        clickRate: 25,
        conversionRate: 15
      }
    }
  ];

  return NextResponse.json({
    success: true,
    data: {
      templates,
      total: templates.length
    }
  });
}