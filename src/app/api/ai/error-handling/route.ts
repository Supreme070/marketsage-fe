import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiErrorHandlingSystem } from '@/lib/ai/ai-error-handling-system';
import { logger } from '@/lib/logger';

/**
 * AI Error Handling and Recovery API
 * 
 * Provides comprehensive error handling, recovery mechanisms, and system health monitoring
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      errorData,
      context,
      organizationId = session.user.organizationId,
      startDate,
      endDate
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('AI error handling request', {
      action,
      organizationId,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'handle_error':
        if (!errorData || !context) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: errorData, context'
          }, { status: 400 });
        }

        const error = new Error(errorData.message);
        error.name = errorData.name || 'AIError';
        error.stack = errorData.stack;

        result = await aiErrorHandlingSystem.handleError(
          error,
          {
            operation: context.operation,
            userId: session.user.id,
            organizationId,
            requestId: context.requestId,
            sessionId: context.sessionId
          },
          errorData.metadata
        );
        break;

      case 'get_system_health':
        result = aiErrorHandlingSystem.getSystemHealth();
        break;

      case 'get_error_patterns':
        const patterns = aiErrorHandlingSystem.getErrorPatterns();
        result = {
          patterns: Array.from(patterns.entries()).map(([key, pattern]) => ({
            key,
            ...pattern
          })),
          totalPatterns: patterns.size
        };
        break;

      case 'get_circuit_breaker_states':
        const circuitBreakers = aiErrorHandlingSystem.getCircuitBreakerStates();
        result = {
          circuitBreakers: Array.from(circuitBreakers.entries()).map(([key, state]) => ({
            key,
            ...state
          })),
          totalCircuitBreakers: circuitBreakers.size
        };
        break;

      case 'get_error_statistics':
        if (!startDate || !endDate) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: startDate, endDate'
          }, { status: 400 });
        }

        result = await aiErrorHandlingSystem.getErrorStatistics(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );
        break;

      case 'simulate_error':
        // For testing purposes - simulate different error types
        const { errorType, severity, message } = body;
        
        if (!errorType || !severity || !message) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: errorType, severity, message'
          }, { status: 400 });
        }

        const simulatedError = new Error(message);
        simulatedError.name = errorType;

        result = await aiErrorHandlingSystem.handleError(
          simulatedError,
          {
            operation: 'error_simulation',
            userId: session.user.id,
            organizationId,
            requestId: `sim_${Date.now()}`,
            sessionId: context?.sessionId
          },
          { simulated: true, errorType, severity }
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI error handling API error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI error handling operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              errorClassification: true,
              intelligentRecovery: true,
              circuitBreakerPattern: true,
              exponentialBackoff: true,
              fallbackStrategies: true,
              systemHealthMonitoring: true,
              errorPatternAnalysis: true,
              realTimeRecovery: true,
              selfHealing: true,
              performanceDegradation: true,
              rootCauseAnalysis: true,
              predictiveErrorDetection: true
            },
            supportedErrorTypes: [
              'network_error',
              'timeout_error',
              'authentication_error',
              'authorization_error',
              'validation_error',
              'processing_error',
              'memory_error',
              'storage_error',
              'external_api_error',
              'rate_limit_error',
              'resource_exhaustion',
              'configuration_error',
              'dependency_error',
              'business_logic_error',
              'unknown_error'
            ],
            recoveryStrategies: [
              'retry',
              'fallback',
              'circuit_breaker',
              'failover',
              'degrade',
              'abort',
              'restart'
            ],
            features: [
              'Advanced error classification and categorization',
              'Intelligent recovery strategies based on error types',
              'Circuit breaker pattern for service protection',
              'Retry mechanisms with exponential backoff',
              'Fallback strategies for critical operations',
              'Error correlation and root cause analysis',
              'Self-healing mechanisms with automatic recovery',
              'Performance degradation detection and mitigation',
              'Comprehensive logging and monitoring',
              'Real-time error alerting and notification',
              'WebSocket streaming for real-time updates',
              'Historical error analysis and pattern detection'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'health_overview':
        const systemHealth = aiErrorHandlingSystem.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: systemHealth,
          timestamp: new Date().toISOString()
        });

      case 'error_patterns_summary':
        const patterns = aiErrorHandlingSystem.getErrorPatterns();
        const patternsSummary = {
          totalPatterns: patterns.size,
          topPatterns: Array.from(patterns.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(pattern => ({
              pattern: pattern.pattern,
              frequency: pattern.frequency,
              recoverySuccessRate: pattern.recoverySuccessRate,
              averageImpact: pattern.averageImpact
            }))
        };
        
        return NextResponse.json({
          success: true,
          data: patternsSummary,
          timestamp: new Date().toISOString()
        });

      case 'circuit_breaker_status':
        const circuitBreakers = aiErrorHandlingSystem.getCircuitBreakerStates();
        const circuitBreakerStatus = {
          totalCircuitBreakers: circuitBreakers.size,
          openCircuitBreakers: Array.from(circuitBreakers.values())
            .filter(cb => cb.state === 'open').length,
          halfOpenCircuitBreakers: Array.from(circuitBreakers.values())
            .filter(cb => cb.state === 'half_open').length,
          closedCircuitBreakers: Array.from(circuitBreakers.values())
            .filter(cb => cb.state === 'closed').length
        };
        
        return NextResponse.json({
          success: true,
          data: circuitBreakerStatus,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI error handling GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI error handling information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}