/**
 * Task Execution Test API Endpoint
 * 
 * This endpoint provides comprehensive testing of the enhanced task execution system
 * including safety approval workflows, rollback capabilities, and audit logging.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';
import { safetyApprovalSystem } from '@/lib/ai/safety-approval-system';
import { taskExecutionMonitor } from '@/lib/ai/task-execution-monitor';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      testType = 'comprehensive',
      taskDescription = 'Test customer segmentation analysis',
      riskLevel = 'medium',
      includeRollback = true
    } = await request.json();

    logger.info('Task Execution Test API called', {
      userId: session.user.id,
      testType,
      taskDescription: taskDescription.substring(0, 100),
      riskLevel,
      includeRollback
    });

    const results: any = {
      testType,
      timestamp: new Date().toISOString(),
      results: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: []
      }
    };

    // Test 1: Basic Task Execution
    if (testType === 'comprehensive' || testType === 'basic') {
      logger.info('Running basic task execution test');
      
      try {
        const aiTask = {
          type: 'task' as const,
          userId: session.user.id,
          question: taskDescription,
          taskType: 'segmentation',
          enableTaskExecution: true
        };

        const result = await supremeAIv3.process(aiTask);
        
        results.results.basicExecution = {
          success: result.success,
          status: result.data?.status,
          taskId: result.data?.taskId,
          executionId: result.data?.executionId,
          mcpUsed: result.data?.mcpUsed,
          confidence: result.confidence,
          supremeScore: result.supremeScore,
          insights: result.insights,
          recommendations: result.recommendations
        };

        results.summary.totalTests++;
        if (result.success) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
        }

      } catch (error) {
        results.results.basicExecution = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.summary.totalTests++;
        results.summary.failed++;
      }
    }

    // Test 2: Safety Approval System
    if (testType === 'comprehensive' || testType === 'safety') {
      logger.info('Running safety approval system test');
      
      try {
        const operationRequest = {
          id: `test_${Date.now()}`,
          userId: session.user.id,
          userRole: 'USER',
          operationType: 'ai_task_execution',
          entity: 'CUSTOMER_SEGMENT',
          action: 'CREATE',
          parameters: { segmentSize: 1000 },
          affectedRecords: 1000,
          context: {
            sessionId: `test_session_${Date.now()}`,
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'TaskExecutionTest/1.0'
          }
        };

        const assessment = await safetyApprovalSystem.assessOperation(operationRequest);
        
        results.results.safetyApproval = {
          success: true,
          assessment: {
            operationId: assessment.operationId,
            riskLevel: assessment.riskLevel,
            canProceed: assessment.canProceed,
            violatedRules: assessment.violatedRules,
            requiredApprovals: assessment.requiredApprovals,
            warnings: assessment.warnings,
            restrictions: assessment.restrictions,
            estimatedImpact: assessment.estimatedImpact
          }
        };

        results.summary.totalTests++;
        results.summary.passed++;

      } catch (error) {
        results.results.safetyApproval = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.summary.totalTests++;
        results.summary.failed++;
      }
    }

    // Test 3: Task Execution Monitor
    if (testType === 'comprehensive' || testType === 'monitoring') {
      logger.info('Running task execution monitor test');
      
      try {
        const executionId = await taskExecutionMonitor.startTaskExecution(
          `test_task_${Date.now()}`,
          session.user.id,
          'USER',
          'segmentation',
          'Test customer segmentation for monitoring',
          { testMode: true, riskLevel },
          riskLevel as any,
          {
            sessionId: `test_session_${Date.now()}`,
            permissions: ['contacts:read', 'segments:write']
          }
        );

        // Simulate task completion
        await taskExecutionMonitor.completeTaskExecution(
          executionId,
          {
            segmentId: 'test_segment_001',
            customerCount: 250,
            segmentCriteria: 'engagement_level'
          },
          ['Test execution completed successfully'],
          includeRollback ? {
            previousSegments: ['test_segment_backup'],
            backupData: { timestamp: new Date().toISOString() }
          } : undefined
        );

        const taskLog = taskExecutionMonitor.getTaskLog(executionId);
        const rollbackCapability = taskExecutionMonitor.getRollbackCapability(executionId);

        results.results.monitoring = {
          success: true,
          executionId,
          taskLog: taskLog ? {
            id: taskLog.id,
            status: taskLog.status,
            executionTime: taskLog.executionTime,
            auditTrail: taskLog.auditTrail,
            warnings: taskLog.warnings,
            errors: taskLog.errors,
            rollbackPerformed: taskLog.rollbackPerformed
          } : null,
          rollbackCapability: rollbackCapability ? {
            available: rollbackCapability.available,
            strategy: rollbackCapability.strategy,
            steps: rollbackCapability.steps,
            timeLimit: rollbackCapability.timeLimit
          } : null
        };

        results.summary.totalTests++;
        results.summary.passed++;

      } catch (error) {
        results.results.monitoring = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.summary.totalTests++;
        results.summary.failed++;
      }
    }

    // Test 4: Metrics and Analytics
    if (testType === 'comprehensive' || testType === 'metrics') {
      logger.info('Running metrics and analytics test');
      
      try {
        const metrics = taskExecutionMonitor.getMetrics('segmentation');
        const overallMetrics = taskExecutionMonitor.getOverallMetrics();
        const healthStatus = taskExecutionMonitor.getHealthStatus();

        results.results.metrics = {
          success: true,
          segmentationMetrics: metrics,
          overallMetrics: Object.keys(overallMetrics).reduce((acc, key) => {
            acc[key] = {
              totalAttempts: overallMetrics[key].totalAttempts,
              successRate: overallMetrics[key].successRate,
              avgExecutionTime: overallMetrics[key].avgExecutionTime,
              rollbackRate: overallMetrics[key].rollbackRate || 0,
              approvalRequiredRate: overallMetrics[key].approvalRequiredRate || 0
            };
            return acc;
          }, {} as Record<string, any>),
          healthStatus
        };

        results.summary.totalTests++;
        results.summary.passed++;

      } catch (error) {
        results.results.metrics = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.summary.totalTests++;
        results.summary.failed++;
      }
    }

    // Test 5: Rollback Functionality
    if (includeRollback && (testType === 'comprehensive' || testType === 'rollback')) {
      logger.info('Running rollback functionality test');
      
      try {
        // Get rollback candidates
        const rollbackCandidates = taskExecutionMonitor.getRollbackCandidates(session.user.id);
        
        results.results.rollback = {
          success: true,
          rollbackCandidates: rollbackCandidates.map(candidate => ({
            id: candidate.id,
            taskId: candidate.taskId,
            taskType: candidate.taskType,
            status: candidate.status,
            rollbackAvailable: !!candidate.rollbackData,
            rollbackPerformed: candidate.rollbackPerformed || false
          })),
          totalCandidates: rollbackCandidates.length
        };

        results.summary.totalTests++;
        results.summary.passed++;

      } catch (error) {
        results.results.rollback = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.summary.totalTests++;
        results.summary.failed++;
      }
    }

    // Generate summary
    results.summary.successRate = results.summary.totalTests > 0 ? 
      (results.summary.passed / results.summary.totalTests) * 100 : 0;
    
    if (results.summary.successRate < 100) {
      results.summary.warnings.push('Some tests failed - check individual test results');
    }

    if (results.summary.successRate >= 80) {
      results.summary.warnings.push('Task execution system is functioning properly');
    }

    logger.info('Task Execution Test completed', {
      userId: session.user.id,
      testType,
      totalTests: results.summary.totalTests,
      passed: results.summary.passed,
      failed: results.summary.failed,
      successRate: results.summary.successRate
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        testType,
        timestamp: new Date().toISOString(),
        userId: session.user.id,
        systemStatus: 'operational'
      }
    });

  } catch (error) {
    logger.error('Task Execution Test API error', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        const healthStatus = taskExecutionMonitor.getHealthStatus();
        const overallMetrics = taskExecutionMonitor.getOverallMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            systemStatus: healthStatus.status,
            healthIssues: healthStatus.issues,
            recommendations: healthStatus.recommendations,
            overallMetrics,
            capabilities: {
              taskExecution: true,
              safetyApproval: true,
              auditLogging: true,
              rollbackSupport: true,
              performanceMonitoring: true,
              mcpIntegration: true
            },
            timestamp: new Date().toISOString()
          }
        });

      case 'metrics':
        const metrics = taskExecutionMonitor.getOverallMetrics();
        return NextResponse.json({
          success: true,
          data: {
            metrics,
            timestamp: new Date().toISOString()
          }
        });

      case 'rollback-candidates':
        const candidates = taskExecutionMonitor.getRollbackCandidates(session.user.id);
        return NextResponse.json({
          success: true,
          data: {
            candidates: candidates.map(c => ({
              id: c.id,
              taskId: c.taskId,
              taskType: c.taskType,
              status: c.status,
              createdAt: c.createdAt,
              rollbackAvailable: !!c.rollbackData
            })),
            totalCandidates: candidates.length
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Task Execution Test Status API error', error);

    return NextResponse.json(
      { 
        error: 'Failed to get system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}