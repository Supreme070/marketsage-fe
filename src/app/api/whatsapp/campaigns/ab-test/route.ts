/**
 * WhatsApp A/B Testing API Endpoint
 * 
 * Handles creation and management of WhatsApp A/B tests using existing campaign structure.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { whatsappLogger } from '@/lib/whatsapp-campaign-logger';
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  validationError 
} from '@/lib/errors';

// POST - Create WhatsApp A/B test campaigns
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      variants, 
      trafficSplit, 
      lists = [], 
      segments = [],
      testDuration = 24 
    } = body;

    // Validate required fields
    if (!name) {
      return validationError('Test name is required');
    }

    if (!variants || !Array.isArray(variants) || variants.length < 2) {
      return validationError('At least 2 variants are required');
    }

    if (variants.length > 5) {
      return validationError('Maximum 5 variants allowed');
    }

    if (!trafficSplit || trafficSplit.length !== variants.length) {
      return validationError('Traffic split must match number of variants');
    }

    const totalTraffic = trafficSplit.reduce((sum: number, percentage: number) => sum + percentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      return validationError('Traffic split percentages must sum to 100');
    }

    // Validate variants
    for (const variant of variants) {
      if (!variant.name) {
        return validationError('All variants must have names');
      }
      if (!variant.content && !variant.templateId) {
        return validationError('All variants must have content or a template');
      }
    }

    // Check if user has permission to create campaigns
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    });

    if (!user) {
      return unauthorized();
    }

    // Create campaigns for each variant
    const campaignPromises = variants.map(async (variant: any, index: number) => {
      const campaign = await prisma.whatsAppCampaign.create({
        data: {
          name: `${name} - ${variant.name}`,
          description: `WhatsApp A/B Test Variant: ${variant.description || variant.name}`,
          from: variant.from || '1234', // Default sender
          content: variant.content,
          templateId: variant.templateId,
          status: 'DRAFT',
          createdById: session.user.id,
          // Store A/B test metadata
          metadata: JSON.stringify({
            isABTest: true,
            abTestName: name,
            abTestDescription: description,
            variantName: variant.name,
            variantIndex: index,
            trafficPercentage: trafficSplit[index],
            testDuration,
            messageType: variant.templateId ? 'template' : 'text',
            createdAt: new Date().toISOString()
          })
        }
      });

      // Connect lists and segments to the campaign
      if (lists.length > 0) {
        await prisma.whatsAppCampaign.update({
          where: { id: campaign.id },
          data: {
            lists: {
              connect: lists.map((listId: string) => ({ id: listId }))
            }
          }
        });
      }

      if (segments.length > 0) {
        await prisma.whatsAppCampaign.update({
          where: { id: campaign.id },
          data: {
            segments: {
              connect: segments.map((segmentId: string) => ({ id: segmentId }))
            }
          }
        });
      }

      return campaign;
    });

    const campaigns = await Promise.all(campaignPromises);

    // Create master A/B test record
    const masterCampaign = await prisma.whatsAppCampaign.create({
      data: {
        name: `[WhatsApp A/B TEST] ${name}`,
        description: description || `WhatsApp A/B test with ${variants.length} variants`,
        from: '1234',
        content: `WhatsApp A/B Test: ${name}`,
        status: 'DRAFT',
        createdById: session.user.id,
        metadata: JSON.stringify({
          isABTestMaster: true,
          abTestName: name,
          abTestDescription: description,
          variantCampaignIds: campaigns.map(c => c.id),
          variants: variants.map((v: any, i: number) => ({
            name: v.name,
            content: v.content,
            templateId: v.templateId,
            trafficPercentage: trafficSplit[i],
            campaignId: campaigns[i].id,
            messageType: v.templateId ? 'template' : 'text'
          })),
          trafficSplit,
          testDuration,
          createdAt: new Date().toISOString(),
          totalVariants: variants.length,
          platform: 'whatsapp'
        })
      }
    });

    await whatsappLogger.logCampaignCreated(masterCampaign.id, name, {
      userId: session.user.id,
      variantCount: variants.length,
      trafficSplit,
      isABTest: true
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp A/B test created successfully',
      abTest: {
        id: masterCampaign.id,
        name,
        description,
        status: 'DRAFT',
        variants: campaigns.map((campaign, index) => ({
          id: campaign.id,
          name: variants[index].name,
          content: variants[index].content,
          templateId: variants[index].templateId,
          trafficPercentage: trafficSplit[index],
          messageType: variants[index].templateId ? 'template' : 'text'
        })),
        testDuration,
        createdAt: masterCampaign.createdAt,
        createdBy: session.user.id
      }
    });

  } catch (error) {
    console.error('Error creating WhatsApp A/B test:', error);
    return handleApiError(error, '/api/whatsapp/campaigns/ab-test/route.ts');
  }
}

// GET - List WhatsApp A/B tests
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    // Get WhatsApp A/B test master campaigns
    const [abTests, totalCount] = await Promise.all([
      prisma.whatsAppCampaign.findMany({
        where: {
          createdById: session.user.id,
          metadata: {
            contains: '"isABTestMaster":true'
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.whatsAppCampaign.count({
        where: {
          createdById: session.user.id,
          metadata: {
            contains: '"isABTestMaster":true'
          }
        }
      })
    ]);

    const abTestsWithAnalytics = await Promise.all(
      abTests.map(async (abTest) => {
        const metadata = JSON.parse(abTest.metadata || '{}');
        
        // Get analytics for each variant
        const variantAnalytics = await Promise.all(
          (metadata.variantCampaignIds || []).map(async (campaignId: string) => {
            const activities = await prisma.whatsAppActivity.groupBy({
              by: ['type'],
              where: { campaignId },
              _count: { type: true }
            });

            const activityCounts = activities.reduce((acc: Record<string, number>, activity) => {
              acc[activity.type] = activity._count.type;
              return acc;
            }, {});

            const sent = activityCounts['SENT'] || 0;
            const delivered = activityCounts['DELIVERED'] || 0;
            const failed = activityCounts['FAILED'] || 0;
            const opened = activityCounts['OPENED'] || 0;
            const clicked = activityCounts['CLICKED'] || 0;
            const replied = activityCounts['REPLIED'] || 0;

            return {
              campaignId,
              sent,
              delivered,
              failed,
              opened,
              clicked,
              replied,
              deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100 * 10) / 10 : 0,
              engagementRate: delivered > 0 ? Math.round(((opened + clicked + replied) / delivered) * 100 * 10) / 10 : 0,
              conversionRate: sent > 0 ? Math.round((replied / sent) * 100 * 10) / 10 : 0
            };
          })
        );

        // Determine winner based on engagement rate (WhatsApp typically has higher engagement)
        const winner = variantAnalytics.reduce((best, current, index) => {
          if (current.engagementRate > best.engagementRate) {
            return { ...current, variantIndex: index };
          }
          return best;
        }, { ...variantAnalytics[0], variantIndex: 0 });

        return {
          id: abTest.id,
          name: metadata.abTestName || abTest.name,
          description: metadata.abTestDescription || abTest.description,
          status: abTest.status,
          variants: (metadata.variants || []).map((variant: any, index: number) => ({
            ...variant,
            analytics: variantAnalytics[index] || {
              sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, replied: 0,
              deliveryRate: 0, engagementRate: 0, conversionRate: 0
            }
          })),
          winner: winner.sent > 0 ? {
            variantName: metadata.variants?.[winner.variantIndex]?.name || 'Unknown',
            engagementRate: winner.engagementRate,
            variantIndex: winner.variantIndex
          } : null,
          totalSample: variantAnalytics.reduce((sum, analytics) => sum + analytics.sent, 0),
          createdAt: abTest.createdAt,
          sentAt: abTest.sentAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      abTests: abTestsWithAnalytics,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error listing WhatsApp A/B tests:', error);
    return handleApiError(error, '/api/whatsapp/campaigns/ab-test/route.ts');
  }
}