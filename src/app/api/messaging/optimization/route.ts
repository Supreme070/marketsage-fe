import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { providerOptimizationEngine } from '@/lib/messaging/provider-optimization-engine';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const optimizationRequestSchema = z.object({
  channel: z.enum(['sms', 'email', 'whatsapp']),
  messageCount: z.number().min(1).max(1000000),
  region: z.string().optional(),
  priority: z.enum(['cost', 'speed', 'reliability', 'balanced']).optional().default('balanced'),
  targetCountries: z.array(z.string()).optional(),
  scheduledTime: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = optimizationRequestSchema.parse(body);

    // Get organization's region if not provided
    let region = validatedData.region;
    if (!region) {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organization.id },
        select: { region: true }
      });
      region = org?.region || 'global';
    }

    const optimizationRequest = {
      ...validatedData,
      region,
      organizationId: session.user.organization.id,
    };

    const result = await providerOptimizationEngine.optimizeProvider(optimizationRequest);

    return NextResponse.json({
      success: true,
      optimization: result,
      request: optimizationRequest
    });

  } catch (error) {
    console.error('Provider optimization error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Optimization failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'recommendations') {
      // Get optimization recommendations for the organization
      const recommendations = await providerOptimizationEngine.getOptimizationRecommendations(
        session.user.organization.id
      );
      
      return NextResponse.json({
        success: true,
        recommendations: recommendations.recommendations,
        totalPotentialSavings: recommendations.totalPotentialSavings
      });
    }

    // Default: return current provider status
    const channels = ['sms', 'email', 'whatsapp'] as const;
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organization.id },
      select: { region: true }
    });
    
    const providerStatus = [];
    
    for (const channel of channels) {
      try {
        const optimization = await providerOptimizationEngine.optimizeProvider({
          channel,
          messageCount: 100, // Sample size
          region: org?.region || 'global',
          priority: 'balanced',
          organizationId: session.user.organization.id
        });
        
        providerStatus.push({
          channel,
          recommendedProvider: optimization.recommendedProvider,
          estimatedCost: optimization.estimatedCost,
          expectedDeliveryRate: optimization.expectedDeliveryRate,
          metrics: optimization.metrics
        });
      } catch (error) {
        console.error(`Failed to optimize ${channel}:`, error);
        providerStatus.push({
          channel,
          error: error instanceof Error ? error.message : 'Optimization failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      providerStatus,
      region: org?.region || 'global'
    });

  } catch (error) {
    console.error('Provider optimization status error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get provider status'
    }, { status: 500 });
  }
}