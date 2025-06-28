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
      },
      include: {
        variants: true
      }
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      );
    }

    // Check if test can be started
    if (test.status !== 'DRAFT' && test.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Test cannot be started from current status' },
        { status: 400 }
      );
    }

    // Ensure test has at least 2 variants
    if (test.variants.length < 2) {
      return NextResponse.json(
        { error: 'Test must have at least 2 variants to start' },
        { status: 400 }
      );
    }

    // Calculate end date
    const startedAt = new Date();
    const estimatedEndAt = new Date(startedAt.getTime() + (test.duration * 24 * 60 * 60 * 1000));

    // Start the test
    await prisma.leadPulseABTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING',
        startedAt,
        estimatedEndAt,
        variants: {
          updateMany: {
            where: { testId },
            data: {
              status: 'RUNNING',
              startedAt
            }
          }
        }
      }
    });

    // Log the test start event
    await prisma.leadPulseAnalytics.create({
      data: {
        visitorId: 'system',
        event: 'ab_test_started',
        data: {
          testId,
          testName: test.name,
          variantCount: test.variants.length,
          startedBy: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test started successfully',
      test: {
        id: test.id,
        status: 'RUNNING',
        startedAt: startedAt.toISOString(),
        estimatedEndAt: estimatedEndAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error starting A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to start A/B test' },
      { status: 500 }
    );
  }
}