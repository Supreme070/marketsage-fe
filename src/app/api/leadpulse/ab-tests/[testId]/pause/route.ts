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
      }
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    // Check if test can be paused
    if (test.status !== 'RUNNING') {
      return NextResponse.json(
        { error: 'Only running tests can be paused' },
        { status: 400 }
      );
    }

    const pausedAt = new Date();

    // Pause the test
    await prisma.leadPulseABTest.update({
      where: { id: testId },
      data: {
        status: 'PAUSED',
        pausedAt,
        variants: {
          updateMany: {
            where: { testId },
            data: {
              status: 'PAUSED',
              pausedAt
            }
          }
        }
      }
    });

    // Log the test pause event
    await prisma.leadPulseAnalytics.create({
      data: {
        visitorId: 'system',
        event: 'ab_test_paused',
        data: {
          testId,
          testName: test.name,
          pausedBy: session.user.id,
          reason: 'manual_pause'
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test paused successfully',
      test: {
        id: test.id,
        status: 'PAUSED',
        pausedAt: pausedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error pausing A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to pause A/B test' },
      { status: 500 }
    );
  }
}