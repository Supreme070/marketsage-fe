/**
 * SMS A/B Test Management API Endpoint
 * 
 * Handles individual A/B test operations (start, stop, get details).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { sendSMS, smsService } from '@/lib/sms-providers/sms-service';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from '@/lib/errors';

// GET - Get A/B test details and results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: abTestId } = await params;

  try {
    // Get A/B test master campaign
    const abTest = await prisma.sMSCampaign.findUnique({
      where: { id: abTestId },
      include: {
        lists: {
          include: {
            members: {
              include: { contact: true }
            }
          }
        },
        segments: {
          include: {
            members: {
              include: { contact: true }
            }
          }
        }
      }
    });

    if (!abTest) {
      return notFound('A/B test not found');
    }

    const metadata = JSON.parse(abTest.metadata || '{}');
    
    if (!metadata.isABTestMaster) {
      return validationError('Invalid A/B test ID');
    }

    // Check permissions
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'IT_ADMIN';
    if (!isAdmin && abTest.createdById !== session.user.id) {
      return forbidden("You don't have permission to view this A/B test");
    }

    // Get detailed analytics for each variant
    const variantAnalytics = await Promise.all(
      (metadata.variantCampaignIds || []).map(async (campaignId: string, index: number) => {
        const [activities, campaign] = await Promise.all([
          prisma.sMSActivity.findMany({
            where: { campaignId },
            include: { contact: true }
          }),
          prisma.sMSCampaign.findUnique({
            where: { id: campaignId },
            select: { status: true, sentAt: true }
          })
        ]);

        // Group activities by type
        const activityCounts = activities.reduce((acc: Record<string, number>, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {});

        const sent = activityCounts['SENT'] || 0;
        const delivered = activityCounts['DELIVERED'] || 0;
        const failed = activityCounts['FAILED'] || 0;
        const opened = activityCounts['OPENED'] || 0;
        const clicked = activityCounts['CLICKED'] || 0;
        const replied = activityCounts['REPLIED'] || 0;

        // Calculate rates
        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        const failureRate = sent > 0 ? (failed / sent) * 100 : 0;
        const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
        const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
        const responseRate = delivered > 0 ? (replied / delivered) * 100 : 0;
        const conversionRate = sent > 0 ? (replied / sent) * 100 : 0;

        // Get time-based breakdown if sent recently
        let hourlyBreakdown = null;
        if (campaign?.sentAt) {
          const sentTime = new Date(campaign.sentAt);
          const now = new Date();
          const hoursSinceSent = (now.getTime() - sentTime.getTime()) / (1000 * 60 * 60);

          if (hoursSinceSent <= 24) {
            const hourlyStats = activities.reduce((acc: Record<string, Record<string, number>>, activity) => {
              const hour = new Date(activity.timestamp).getHours();
              const hourKey = `${hour}:00`;
              
              if (!acc[hourKey]) {
                acc[hourKey] = { SENT: 0, DELIVERED: 0, FAILED: 0, OPENED: 0, CLICKED: 0, REPLIED: 0 };
              }
              
              acc[hourKey][activity.type] = (acc[hourKey][activity.type] || 0) + 1;
              return acc;
            }, {});

            hourlyBreakdown = Object.entries(hourlyStats).map(([hour, stats]) => ({
              hour,
              ...stats
            }));
          }
        }

        return {
          variantIndex: index,
          variantName: metadata.variants?.[index]?.name || `Variant ${index + 1}`,
          campaignId,
          status: campaign?.status || 'DRAFT',
          sentAt: campaign?.sentAt,
          sent,
          delivered,
          failed,
          opened,
          clicked,
          replied,
          deliveryRate: Math.round(deliveryRate * 10) / 10,
          failureRate: Math.round(failureRate * 10) / 10,
          openRate: Math.round(openRate * 10) / 10,
          clickRate: Math.round(clickRate * 10) / 10,
          responseRate: Math.round(responseRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          hourlyBreakdown
        };
      })
    );

    // Calculate statistical significance (simplified)
    const hasSignificantData = variantAnalytics.every(v => v.sent >= 100); // Minimum sample size
    let winner = null;
    let isStatisticallySignificant = false;

    if (hasSignificantData && variantAnalytics.length === 2) {
      const [control, treatment] = variantAnalytics;
      const improvementPercentage = control.conversionRate > 0 ? 
        ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100 : 0;
      
      // Simple significance test - improvement > 20% and sample size > 100
      isStatisticallySignificant = Math.abs(improvementPercentage) > 20 && 
        control.sent >= 100 && treatment.sent >= 100;

      if (isStatisticallySignificant) {
        winner = treatment.conversionRate > control.conversionRate ? treatment : control;
      }
    }

    // Get total contact count
    const allContacts = new Map();
    
    // Add contacts from lists
    abTest.lists.forEach(list => {
      list.members.forEach(member => {
        if (member.contact.phone && member.contact.status === 'ACTIVE') {
          allContacts.set(member.contact.id, member.contact);
        }
      });
    });

    // Add contacts from segments
    abTest.segments.forEach(segment => {
      segment.members.forEach(member => {
        if (member.contact.phone && member.contact.status === 'ACTIVE') {
          allContacts.set(member.contact.id, member.contact);
        }
      });
    });

    const totalContacts = allContacts.size;
    const totalSent = variantAnalytics.reduce((sum, v) => sum + v.sent, 0);

    const response = {
      id: abTest.id,
      name: metadata.abTestName || abTest.name,
      description: metadata.abTestDescription || abTest.description,
      status: abTest.status,
      testDuration: metadata.testDuration || 24,
      createdAt: abTest.createdAt,
      sentAt: abTest.sentAt,
      
      // Test configuration
      variants: (metadata.variants || []).map((variant: any, index: number) => ({
        name: variant.name,
        content: variant.content,
        trafficPercentage: variant.trafficPercentage,
        analytics: variantAnalytics[index]
      })),
      
      // Overall metrics
      totalContacts,
      totalSent,
      completionPercentage: totalContacts > 0 ? Math.round((totalSent / totalContacts) * 100) : 0,
      
      // Test results
      winner: winner ? {
        variantName: winner.variantName,
        conversionRate: winner.conversionRate,
        improvementPercentage: variantAnalytics.length === 2 ? 
          Math.round(((winner.conversionRate - variantAnalytics.find(v => v !== winner)!.conversionRate) / 
          variantAnalytics.find(v => v !== winner)!.conversionRate) * 100 * 10) / 10 : 0
      } : null,
      isStatisticallySignificant,
      
      // Insights
      insights: {
        hasMinimumSample: hasSignificantData,
        recommendation: this.getTestRecommendation(abTest.status, variantAnalytics, hasSignificantData)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting A/B test details:', error);
    return handleApiError(error, '/api/sms/campaigns/ab-test/[id]/route.ts');
  }
}

// POST - Start A/B test
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: abTestId } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'start') {
      return validationError('Only "start" action is supported');
    }

    // Get A/B test
    const abTest = await prisma.sMSCampaign.findUnique({
      where: { id: abTestId },
      include: {
        lists: {
          include: {
            members: {
              include: { contact: true }
            }
          }
        },
        segments: {
          include: {
            members: {
              include: { contact: true }
            }
          }
        }
      }
    });

    if (!abTest) {
      return notFound('A/B test not found');
    }

    const metadata = JSON.parse(abTest.metadata || '{}');
    
    if (!metadata.isABTestMaster) {
      return validationError('Invalid A/B test ID');
    }

    // Check permissions
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'IT_ADMIN';
    if (!isAdmin && abTest.createdById !== session.user.id) {
      return forbidden("You don't have permission to start this A/B test");
    }

    if (abTest.status !== 'DRAFT') {
      return validationError(`Cannot start A/B test with status: ${abTest.status}`);
    }

    // Get all contacts for the test
    const allContacts = new Map();
    
    abTest.lists.forEach(list => {
      list.members.forEach(member => {
        if (member.contact.phone && member.contact.status === 'ACTIVE' && 
            smsService.validatePhoneNumber(member.contact.phone)) {
          allContacts.set(member.contact.id, member.contact);
        }
      });
    });

    abTest.segments.forEach(segment => {
      segment.members.forEach(member => {
        if (member.contact.phone && member.contact.status === 'ACTIVE' &&
            smsService.validatePhoneNumber(member.contact.phone)) {
          allContacts.set(member.contact.id, member.contact);
        }
      });
    });

    const contacts = Array.from(allContacts.values());

    if (contacts.length === 0) {
      return validationError('No valid contacts found for A/B test');
    }

    // Split contacts among variants based on traffic split
    const variantContacts = this.splitContactsForABTest(contacts, metadata.trafficSplit);

    // Send campaigns for each variant
    const results = await Promise.all(
      metadata.variantCampaignIds.map(async (campaignId: string, index: number) => {
        const variantData = metadata.variants[index];
        const contactsForVariant = variantContacts[index];

        // Update variant campaign status
        await prisma.sMSCampaign.update({
          where: { id: campaignId },
          data: { 
            status: 'SENDING',
            sentAt: new Date()
          }
        });

        // Send messages to contacts assigned to this variant
        let successCount = 0;
        let failureCount = 0;

        for (const contact of contactsForVariant) {
          try {
            const personalizedContent = this.personalizeMessage(variantData.content, contact);
            const smsResult = await sendSMS(contact.phone, personalizedContent);

            const activityData = {
              campaignId,
              contactId: contact.id,
              type: smsResult.success ? 'SENT' : 'FAILED',
              timestamp: new Date(),
              metadata: JSON.stringify({
                messageId: smsResult.messageId,
                error: smsResult.error?.message,
                phoneNumber: contact.phone,
                isABTest: true,
                variantName: variantData.name
              })
            };

            await prisma.sMSActivity.create({ data: activityData });

            if (smsResult.success) {
              successCount++;
            } else {
              failureCount++;
            }

          } catch (error) {
            failureCount++;
            console.error(`Error sending A/B test SMS to contact ${contact.id}:`, error);
          }
        }

        // Update variant campaign status
        await prisma.sMSCampaign.update({
          where: { id: campaignId },
          data: { status: 'SENT' }
        });

        return {
          variantName: variantData.name,
          contactCount: contactsForVariant.length,
          successCount,
          failureCount
        };
      })
    );

    // Update master A/B test status
    await prisma.sMSCampaign.update({
      where: { id: abTestId },
      data: { 
        status: 'SENT',
        sentAt: new Date()
      }
    });

    await smsLogger.logSendInitiated(abTestId, contacts.length, {
      userId: session.user.id,
      variantCount: metadata.variants.length,
      isABTest: true,
      abTestName: metadata.abTestName
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test started successfully',
      results: {
        totalContacts: contacts.length,
        variants: results,
        startedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error starting A/B test:', error);
    return handleApiError(error, '/api/sms/campaigns/ab-test/[id]/route.ts');
  }
}

// Helper methods (would be moved to service class in production)
function getTestRecommendation(status: string, variants: any[], hasMinimumSample: boolean): string {
  if (status === 'DRAFT') {
    return 'Test is ready to start. Click "Start Test" to begin sending.';
  }
  
  if (status === 'SENT' || status === 'SENDING') {
    if (!hasMinimumSample) {
      return 'Test is running. Wait for more data before making decisions.';
    }
    
    const bestVariant = variants.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    return `Variant "${bestVariant.variantName}" is currently performing best with ${bestVariant.conversionRate}% conversion rate.`;
  }
  
  return 'Test completed. Review results above.';
}

function splitContactsForABTest(contacts: any[], trafficSplit: number[]): any[][] {
  // Shuffle contacts for random distribution
  const shuffled = [...contacts].sort(() => Math.random() - 0.5);
  
  const result: any[][] = [];
  let currentIndex = 0;
  
  trafficSplit.forEach((percentage, variantIndex) => {
    const count = Math.floor((percentage / 100) * contacts.length);
    result[variantIndex] = shuffled.slice(currentIndex, currentIndex + count);
    currentIndex += count;
  });
  
  // Distribute any remaining contacts to the first variant
  if (currentIndex < shuffled.length) {
    result[0].push(...shuffled.slice(currentIndex));
  }
  
  return result;
}

function personalizeMessage(content: string, contact: any): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  let personalizedContent = content;
  
  const contactVariables = {
    'firstName': contact.firstName || '',
    'lastName': contact.lastName || '',
    'fullName': `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Customer',
    'email': contact.email || '',
    'phone': contact.phone || '',
    'company': contact.company || '',
  };

  Object.entries(contactVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    personalizedContent = personalizedContent.replace(regex, String(value));
  });

  return personalizedContent;
}