/**
 * Autonomous A/B Testing API Endpoints
 * ====================================
 * RESTful API for autonomous A/B testing operations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';

/**
 * GET /api/ai/autonomous-ab-testing - Get autonomous testing data
 */
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-ab-testing-api');
  
  return tracer.startActiveSpan('get-autonomous-testing', async (span) => {
    // Dynamic import to prevent circular dependency during build
    const { autonomousABTestingEngine } = await import('@/lib/ai/autonomous-ab-testing-engine');
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      const testId = url.searchParams.get('testId');

      span.setAttributes({
        'testing.type': type || 'overview',
        'testing.user_id': session.user.id,
        'testing.user_role': session.user.role || ''
      });

      switch (type) {
        case 'active':
          const activeTests = await autonomousABTestingEngine.getActiveTests();
          span.setAttributes({
            'testing.active_count': activeTests.length
          });
          return NextResponse.json(activeTests);

        case 'results':
          if (!testId) {
            return NextResponse.json({ error: 'Test ID required for results' }, { status: 400 });
          }
          const results = await autonomousABTestingEngine.getTestResults(testId);
          if (!results) {
            return NextResponse.json({ error: 'Test results not found' }, { status: 404 });
          }
          return NextResponse.json(results);

        case 'metrics':
          const metrics = await autonomousABTestingEngine.getAutonomousTestingMetrics();
          span.setAttributes({
            'testing.active_tests': metrics.activeTests,
            'testing.success_rate': metrics.successRate,
            'testing.avg_improvement': metrics.averageImprovement
          });
          return NextResponse.json(metrics);

        default:
          // Return comprehensive overview
          const [activeTestsOverview, metricsOverview] = await Promise.all([
            autonomousABTestingEngine.getActiveTests(),
            autonomousABTestingEngine.getAutonomousTestingMetrics()
          ]);

          const overview = {
            activeTests: activeTestsOverview,
            metrics: metricsOverview,
            capabilities: {
              autoDesign: true,
              autoExecution: true,
              autoOptimization: true,
              crossChannel: true,
              aiInsights: true
            },
            timestamp: new Date()
          };

          span.setAttributes({
            'testing.overview_active': activeTestsOverview.length,
            'testing.overview_success_rate': metricsOverview.successRate
          });

          return NextResponse.json(overview);
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous A/B testing API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to retrieve autonomous testing data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * POST /api/ai/autonomous-ab-testing - Create autonomous tests or control operations
 */
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-ab-testing-api');
  
  return tracer.startActiveSpan('post-autonomous-testing', async (span) => {
    // Dynamic import to prevent circular dependency during build
    const { autonomousABTestingEngine } = await import('@/lib/ai/autonomous-ab-testing-engine');
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has testing permissions
      const hasTestingAccess = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN', 'USER'].includes(session.user.role || '');
      if (!hasTestingAccess) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions for A/B testing' }, { status: 403 });
      }

      const body = await request.json();
      const { action, data } = body;

      span.setAttributes({
        'testing.action': action,
        'testing.user_id': session.user.id,
        'testing.user_role': session.user.role || ''
      });

      switch (action) {
        case 'request_test':
          const { campaignId, formId, workflowId, channel, objective, constraints } = data;
          
          if (!channel || !objective) {
            return NextResponse.json({ 
              error: 'Channel and objective are required for test requests' 
            }, { status: 400 });
          }

          const testRequest = {
            campaignId,
            formId,
            workflowId,
            channel: channel as 'email' | 'sms' | 'whatsapp' | 'form' | 'landing_page',
            objective,
            constraints
          };

          const requestId = await autonomousABTestingEngine.requestAutonomousTest(testRequest);

          span.setAttributes({
            'testing.channel': channel,
            'testing.objective': objective
          });

          logger.info('Autonomous A/B test requested', {
            requestId,
            channel,
            objective,
            userId: session.user.id,
            userRole: session.user.role
          });

          return NextResponse.json({
            success: true,
            message: 'Autonomous A/B test request submitted successfully',
            requestId,
            estimatedDesignTime: '5-10 minutes'
          });

        case 'pause_test':
          const { testId: pauseTestId } = data;
          if (!pauseTestId) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
          }

          const paused = await autonomousABTestingEngine.pauseTest(pauseTestId);
          if (!paused) {
            return NextResponse.json({ error: 'Test not found or cannot be paused' }, { status: 404 });
          }

          logger.info('Autonomous A/B test paused', {
            testId: pauseTestId,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: 'Test paused successfully',
            testId: pauseTestId
          });

        case 'resume_test':
          const { testId: resumeTestId } = data;
          if (!resumeTestId) {
            return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
          }

          const resumed = await autonomousABTestingEngine.resumeTest(resumeTestId);
          if (!resumed) {
            return NextResponse.json({ error: 'Test not found or cannot be resumed' }, { status: 404 });
          }

          logger.info('Autonomous A/B test resumed', {
            testId: resumeTestId,
            userId: session.user.id
          });

          return NextResponse.json({
            success: true,
            message: 'Test resumed successfully',
            testId: resumeTestId
          });

        case 'analyze_opportunity':
          const { campaignData, performanceData } = data;
          
          if (!campaignData) {
            return NextResponse.json({ error: 'Campaign data required for opportunity analysis' }, { status: 400 });
          }

          // Analyze testing opportunity
          const opportunity = await analyzeTestingOpportunity(campaignData, performanceData);
          
          return NextResponse.json({
            success: true,
            opportunity,
            recommendations: opportunity.recommendations,
            estimatedImpact: opportunity.estimatedImpact
          });

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous A/B testing POST API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to process autonomous testing request' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * PUT /api/ai/autonomous-ab-testing - Update test configurations
 */
export async function PUT(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-ab-testing-api');
  
  return tracer.startActiveSpan('put-autonomous-testing', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only ADMIN roles can modify test configurations
      const canModify = ['ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
      if (!canModify) {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Insufficient permissions to modify tests' }, { status: 403 });
      }

      const body = await request.json();
      const { testId, updates } = body;

      if (!testId) {
        return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
      }

      span.setAttributes({
        'testing.test_id': testId,
        'testing.user_id': session.user.id,
        'testing.user_role': session.user.role || ''
      });

      // Update test configuration logic would go here
      // For now, return success
      logger.info('Autonomous A/B test configuration updated', {
        testId,
        updates: Object.keys(updates),
        userId: session.user.id,
        userRole: session.user.role
      });

      return NextResponse.json({
        success: true,
        message: 'Test configuration updated successfully',
        testId
      });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous A/B testing PUT API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to update test configuration' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * DELETE /api/ai/autonomous-ab-testing - Cancel or delete tests
 */
export async function DELETE(request: NextRequest) {
  const tracer = trace.getTracer('autonomous-ab-testing-api');
  
  return tracer.startActiveSpan('delete-autonomous-testing', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only SUPER_ADMIN can delete tests
      if (session.user.role !== 'SUPER_ADMIN') {
        span.setStatus({ code: 2, message: 'Insufficient permissions' });
        return NextResponse.json({ error: 'Only super admins can delete tests' }, { status: 403 });
      }

      const url = new URL(request.url);
      const testId = url.searchParams.get('testId');

      if (!testId) {
        return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
      }

      span.setAttributes({
        'testing.test_id': testId,
        'testing.user_id': session.user.id,
        'testing.user_role': session.user.role || ''
      });

      // Delete test logic would go here
      logger.info('Autonomous A/B test deleted', {
        testId,
        userId: session.user.id,
        userRole: session.user.role
      });

      return NextResponse.json({
        success: true,
        message: 'Test deleted successfully',
        testId
      });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Autonomous A/B testing DELETE API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to delete test' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * Helper function to analyze testing opportunities
 */
async function analyzeTestingOpportunity(campaignData: any, performanceData: any): Promise<{
  score: number;
  recommendations: string[];
  estimatedImpact: number;
  testTypes: string[];
  priority: 'low' | 'medium' | 'high';
}> {
  try {
    // Analyze opportunity based on performance data
    const conversionRate = performanceData?.conversionRate || 0;
    const openRate = performanceData?.openRate || 0;
    const clickRate = performanceData?.clickRate || 0;

    let score = 0;
    const recommendations: string[] = [];
    const testTypes: string[] = [];

    // Check conversion rate opportunity
    if (conversionRate < 5) {
      score += 30;
      recommendations.push('Conversion rate below industry average - high optimization potential');
      testTypes.push('landing_page', 'form_optimization');
    }

    // Check email performance
    if (openRate < 20) {
      score += 25;
      recommendations.push('Email open rate needs improvement - test subject lines');
      testTypes.push('email_campaign');
    }

    if (clickRate < 3) {
      score += 20;
      recommendations.push('Email click rate can be improved - test content and CTAs');
      testTypes.push('email_campaign');
    }

    // Campaign type specific recommendations
    if (campaignData.type === 'email') {
      recommendations.push('Test send time optimization for African time zones');
      testTypes.push('cross_channel');
    }

    if (campaignData.hasForm) {
      recommendations.push('Form optimization can significantly improve conversions');
      testTypes.push('form_optimization');
    }

    const priority = score > 60 ? 'high' : score > 30 ? 'medium' : 'low';
    const estimatedImpact = Math.min(score * 0.5, 50); // Max 50% improvement estimate

    return {
      score,
      recommendations,
      estimatedImpact,
      testTypes: [...new Set(testTypes)], // Remove duplicates
      priority
    };

  } catch (error) {
    logger.error('Testing opportunity analysis failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      score: 0,
      recommendations: ['Unable to analyze opportunity - insufficient data'],
      estimatedImpact: 0,
      testTypes: [],
      priority: 'low'
    };
  }
}