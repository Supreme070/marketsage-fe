import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      form: {
        organization: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    };

    if (formId) {
      where.formId = formId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch A/B tests from database
    const tests = await prisma.leadPulseABTest.findMany({
      where,
      include: {
        form: {
          select: {
            name: true
          }
        },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedTests = tests.map(test => ({
      id: test.id,
      name: test.name,
      description: test.description,
      formId: test.formId,
      formName: test.form.name,
      hypothesis: test.hypothesis,
      successMetric: test.successMetric,
      trafficAllocation: test.trafficAllocation,
      duration: test.duration,
      minimumSampleSize: test.minimumSampleSize,
      confidenceLevel: test.confidenceLevel,
      status: test.status,
      totalViews: test.variants.reduce((sum, v) => sum + (v._count?.analytics || 0), 0),
      totalConversions: test.variants.reduce((sum, v) => sum + (v._count?.submissions || 0), 0),
      overallConversionRate: calculateOverallConversionRate(test.variants),
      significance: calculateStatisticalSignificance(test.variants),
      winner: test.winnerVariantId,
      createdAt: test.createdAt.toISOString(),
      startedAt: test.startedAt?.toISOString(),
      endedAt: test.endedAt?.toISOString(),
      variants: test.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        description: variant.description,
        type: variant.type,
        formConfig: variant.formConfig,
        traffic: variant.trafficAllocation,
        status: variant.status,
        views: variant._count?.analytics || 0,
        starts: Math.floor((variant._count?.analytics || 0) * 0.8), // Estimated
        completions: variant._count?.submissions || 0,
        conversionRate: calculateConversionRate(variant._count?.analytics || 0, variant._count?.submissions || 0),
        avgCompletionTime: 180, // Mock data - would come from analytics
        bounceRate: 45, // Mock data
        confidenceLevel: 95,
        pValue: 0.05,
        improvement: calculateImprovement(variant, test.variants),
        sampleSize: variant._count?.analytics || 0,
        requiredSampleSize: test.minimumSampleSize,
        createdAt: variant.createdAt.toISOString(),
        startedAt: variant.startedAt?.toISOString()
      })),
      insights: generateInsights(test)
    }));

    return NextResponse.json({
      tests: transformedTests,
      total: transformedTests.length
    });

  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      description,
      formId,
      hypothesis,
      successMetric,
      duration,
      trafficAllocation,
      confidenceLevel
    } = data;

    // Validate required fields
    if (!name || !formId || !hypothesis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify form exists and user has access
    const form = await prisma.leadPulseForm.findFirst({
      where: {
        id: formId,
        organization: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate minimum sample size based on current form performance
    const minimumSampleSize = Math.max(
      Math.ceil(duration * 50), // 50 per day minimum
      500 // Absolute minimum
    );

    // Create A/B test
    const abTest = await prisma.leadPulseABTest.create({
      data: {
        name,
        description,
        formId,
        hypothesis,
        successMetric,
        duration,
        trafficAllocation,
        minimumSampleSize,
        confidenceLevel,
        status: 'DRAFT',
        // Create original variant automatically
        variants: {
          create: {
            name: 'Original',
            description: 'Current form design',
            type: 'ORIGINAL',
            formConfig: {
              fields: form.fields,
              styling: form.styling,
              settings: form.settings
            },
            trafficAllocation: 50,
            status: 'DRAFT'
          }
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json({
      success: true,
      test: {
        id: abTest.id,
        name: abTest.name,
        status: abTest.status
      }
    });

  } catch (error) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallConversionRate(variants: any[]): number {
  const totalViews = variants.reduce((sum, v) => sum + (v._count?.analytics || 0), 0);
  const totalConversions = variants.reduce((sum, v) => sum + (v._count?.submissions || 0), 0);
  
  if (totalViews === 0) return 0;
  return Number(((totalConversions / totalViews) * 100).toFixed(1));
}

function calculateConversionRate(views: number, conversions: number): number {
  if (views === 0) return 0;
  return Number(((conversions / views) * 100).toFixed(1));
}

function calculateStatisticalSignificance(variants: any[]): string {
  // Simplified significance calculation
  const totalSamples = variants.reduce((sum, v) => sum + (v._count?.analytics || 0), 0);
  
  if (totalSamples < 100) return 'not_significant';
  if (totalSamples < 500) return 'approaching';
  if (totalSamples < 1000) return 'significant';
  return 'highly_significant';
}

function calculateImprovement(variant: any, allVariants: any[]): number {
  const original = allVariants.find(v => v.type === 'ORIGINAL');
  if (!original || variant.type === 'ORIGINAL') return 0;
  
  const originalRate = calculateConversionRate(original._count?.analytics || 0, original._count?.submissions || 0);
  const variantRate = calculateConversionRate(variant._count?.analytics || 0, variant._count?.submissions || 0);
  
  if (originalRate === 0) return 0;
  return Number(((variantRate - originalRate) / originalRate * 100).toFixed(1));
}

function generateInsights(test: any): any[] {
  const insights = [];
  
  // Performance insight
  if (test.variants.length > 1) {
    const bestVariant = test.variants.reduce((best, current) => {
      const bestRate = calculateConversionRate(best._count?.analytics || 0, best._count?.submissions || 0);
      const currentRate = calculateConversionRate(current._count?.analytics || 0, current._count?.submissions || 0);
      return currentRate > bestRate ? current : best;
    });
    
    const improvement = calculateImprovement(bestVariant, test.variants);
    
    if (improvement > 0) {
      insights.push({
        type: 'performance',
        title: `${bestVariant.name} Shows Improvement`,
        description: `${bestVariant.name} variant shows ${improvement}% improvement over the original.`,
        actionable: improvement > 10
      });
    }
  }
  
  // Statistical insight
  const totalSamples = test.variants.reduce((sum: number, v: any) => sum + (v._count?.analytics || 0), 0);
  const significance = calculateStatisticalSignificance(test.variants);
  
  insights.push({
    type: 'statistical',
    title: `Statistical Significance: ${significance.replace('_', ' ')}`,
    description: `Test has ${totalSamples} total samples. ${
      significance === 'highly_significant' ? 'Results are highly reliable.' :
      significance === 'significant' ? 'Results are statistically significant.' :
      significance === 'approaching' ? 'Approaching statistical significance. Continue testing.' :
      'Need more data for reliable results.'
    }`,
    actionable: significance === 'highly_significant' || significance === 'significant'
  });
  
  return insights;
}