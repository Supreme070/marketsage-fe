import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { leadPulseCacheOptimizer } from '@/lib/leadpulse/cache-optimization';
import { z } from 'zod';

// Request schemas
const warmStrategySchema = z.object({
  strategyId: z.string()
});

const invalidateCacheSchema = z.object({
  trigger: z.string(),
  metadata: z.record(z.any()).optional()
});

const addStrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().min(1).max(10),
  enabled: z.boolean(),
  schedule: z.object({
    frequency: z.enum(['realtime', 'every_minute', 'every_5_minutes', 'every_15_minutes', 'hourly', 'daily']),
    conditions: z.array(z.string()).optional()
  }),
  keys: z.array(z.string()),
  dependsOn: z.array(z.string()).optional()
});

const addInvalidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  triggers: z.array(z.string()),
  keys: z.array(z.string()),
  cascadeRules: z.array(z.string()).optional(),
  debounceMs: z.number().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'get-metrics':
        const metrics = leadPulseCacheOptimizer.getMetrics();
        return NextResponse.json({ metrics });

      case 'get-strategies':
        // Mock data - in a real implementation, this would come from the service
        const strategies = [
          {
            id: 'realtime_visitors',
            name: 'Real-time Visitors',
            priority: 10,
            enabled: true,
            schedule: { frequency: 'realtime', conditions: ['visitor_activity'] },
            keys: ['leadpulse:visitors:active'],
            lastRun: new Date(),
            status: 'running'
          },
          {
            id: 'analytics_overview',
            name: 'Analytics Overview',
            priority: 9,
            enabled: true,
            schedule: { frequency: 'every_minute' },
            keys: ['leadpulse:analytics:overview'],
            lastRun: new Date(),
            status: 'running'
          }
        ];
        return NextResponse.json({ strategies });

      case 'get-invalidation-rules':
        // Mock data - in a real implementation, this would come from the service
        const rules = [
          {
            id: 'visitor_activity',
            name: 'Visitor Activity',
            triggers: ['visitor_created', 'visitor_updated', 'touchpoint_created'],
            keys: ['leadpulse:visitors:active', 'leadpulse:count:visitors'],
            debounceMs: 1000
          }
        ];
        return NextResponse.json({ rules });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache optimization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'warm-strategy':
        const warmData = warmStrategySchema.parse(body);
        // In a real implementation, this would trigger the warming strategy
        console.log(`Warming strategy: ${warmData.strategyId}`);
        return NextResponse.json({ success: true });

      case 'invalidate-cache':
        const invalidateData = invalidateCacheSchema.parse(body);
        await leadPulseCacheOptimizer.invalidateCache(invalidateData.trigger, invalidateData.metadata);
        return NextResponse.json({ success: true });

      case 'add-strategy':
        const strategyData = addStrategySchema.parse(body);
        const strategy = {
          ...strategyData,
          preloadData: async () => {
            // Mock preload function
            console.log(`Preloading data for strategy: ${strategyData.id}`);
          }
        };
        leadPulseCacheOptimizer.addWarmingStrategy(strategy);
        return NextResponse.json({ success: true });

      case 'add-invalidation-rule':
        const ruleData = addInvalidationRuleSchema.parse(body);
        leadPulseCacheOptimizer.addInvalidationRule(ruleData);
        return NextResponse.json({ success: true });

      case 'initialize-optimizer':
        await leadPulseCacheOptimizer.initialize();
        return NextResponse.json({ success: true });

      case 'warm-critical-caches':
        await leadPulseCacheOptimizer.warmCriticalCaches();
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache optimization API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'clear-cache':
        // In a real implementation, this would clear the cache
        console.log('Clearing cache');
        return NextResponse.json({ success: true });

      case 'stop-optimizer':
        await leadPulseCacheOptimizer.stop();
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cache optimization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}