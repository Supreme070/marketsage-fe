import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = params;
    const data = await request.json();
    const { winner } = data;

    // Verify test exists and user has access
    const test = await prisma.leadPulseABTest.findFirst({
      where: {
        id: testId,
        form: {
          organization: {
            users: {
              some: {
                userId: session.user.id
              }
            }
          }
        }
      },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                submissions: true,
                analytics: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    // Check if test can be ended
    if (test.status !== 'RUNNING' && test.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Only running or paused tests can be ended' },
        { status: 400 }
      );
    }

    const endedAt = new Date();

    // Determine winner if not specified
    let winnerVariantId = winner;
    if (!winnerVariantId) {
      // Auto-select winner based on best conversion rate
      const bestVariant = test.variants.reduce((best, current) => {
        const bestRate = best._count.analytics > 0 ? (best._count.submissions / best._count.analytics) : 0;
        const currentRate = current._count.analytics > 0 ? (current._count.submissions / current._count.analytics) : 0;
        return currentRate > bestRate ? current : best;
      });
      winnerVariantId = bestVariant.id;
    }

    // Calculate final statistics
    const totalViews = test.variants.reduce((sum, v) => sum + (v._count?.analytics || 0), 0);
    const totalConversions = test.variants.reduce((sum, v) => sum + (v._count?.submissions || 0), 0);
    const overallConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    // End the test
    await prisma.leadPulseABTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        endedAt,
        winnerVariantId,
        finalResults: {
          totalViews,
          totalConversions,
          overallConversionRate,
          duration: test.startedAt ? Math.floor((endedAt.getTime() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24)) : test.duration,
          endedBy: session.user.id,
          endReason: 'manual_completion'
        },
        variants: {
          updateMany: {
            where: { testId },
            data: {
              status: 'COMPLETED',
              endedAt
            }
          }
        }
      }
    });

    // If there's a winner, optionally update the original form
    if (winnerVariantId && winnerVariantId !== 'original') {
      const winnerVariant = test.variants.find(v => v.id === winnerVariantId);
      if (winnerVariant && winnerVariant.type === 'VARIANT') {
        // Log recommendation to update form
        await prisma.leadPulseAnalytics.create({
          data: {
            visitorId: 'system',
            event: 'ab_test_winner_identified',
            data: {
              testId,
              testName: test.name,
              winnerVariantId,
              winnerName: winnerVariant.name,
              improvementPotential: calculateImprovement(winnerVariant, test.variants),
              recommendAction: 'update_form_with_winner'
            }
          }
        });
      }
    }

    // Log the test completion event
    await prisma.leadPulseAnalytics.create({
      data: {
        visitorId: 'system',
        event: 'ab_test_completed',
        data: {
          testId,
          testName: test.name,
          duration: test.startedAt ? Math.floor((endedAt.getTime() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24)) : test.duration,
          totalParticipants: totalViews,
          winnerVariantId,
          endedBy: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test completed successfully',
      test: {
        id: test.id,
        status: 'COMPLETED',
        endedAt: endedAt.toISOString(),
        winner: winnerVariantId,
        finalResults: {
          totalViews,
          totalConversions,
          overallConversionRate: Number(overallConversionRate.toFixed(1))
        }
      }
    });

  } catch (error) {
    console.error('Error ending A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to end A/B test' },
      { status: 500 }
    );
  }
}

// Helper function to calculate improvement
function calculateImprovement(variant: any, allVariants: any[]): number {
  const original = allVariants.find(v => v.type === 'ORIGINAL');
  if (!original || variant.type === 'ORIGINAL') return 0;
  
  const originalRate = original._count.analytics > 0 ? (original._count.submissions / original._count.analytics) * 100 : 0;
  const variantRate = variant._count.analytics > 0 ? (variant._count.submissions / variant._count.analytics) * 100 : 0;
  
  if (originalRate === 0) return 0;
  return Number(((variantRate - originalRate) / originalRate * 100).toFixed(1));
}