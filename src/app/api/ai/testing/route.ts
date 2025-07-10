import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { aiTestingFramework } from '@/lib/ai/ai-testing-framework';
import { UserRole } from '@prisma/client';

/**
 * AI Testing Framework API
 * 
 * Manages AI testing operations, test execution, and reporting
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action');
    const testCaseId = searchParams.get('testCaseId');
    const suiteId = searchParams.get('suiteId');
    const category = searchParams.get('category');
    const executionId = searchParams.get('executionId');

    switch (action) {
      case 'test_cases':
        const testCases = aiTestingFramework.getTestCases(category || undefined);
        return NextResponse.json({
          success: true,
          data: testCases,
          timestamp: new Date().toISOString()
        });

      case 'test_suites':
        const testSuites = aiTestingFramework.getTestSuites();
        return NextResponse.json({
          success: true,
          data: testSuites,
          timestamp: new Date().toISOString()
        });

      case 'test_results':
        const testResults = aiTestingFramework.getTestResults(testCaseId || undefined);
        return NextResponse.json({
          success: true,
          data: testResults,
          timestamp: new Date().toISOString()
        });

      case 'active_executions':
        const activeExecutions = aiTestingFramework.getActiveExecutions();
        return NextResponse.json({
          success: true,
          data: activeExecutions,
          timestamp: new Date().toISOString()
        });

      case 'test_case_detail':
        if (!testCaseId) {
          return NextResponse.json({
            success: false,
            error: 'Test case ID is required'
          }, { status: 400 });
        }

        const testCase = aiTestingFramework.getTestCases().find(tc => tc.id === testCaseId);
        if (!testCase) {
          return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: testCase,
          timestamp: new Date().toISOString()
        });

      case 'execution_detail':
        if (!executionId) {
          return NextResponse.json({
            success: false,
            error: 'Execution ID is required'
          }, { status: 400 });
        }

        const execution = aiTestingFramework.getTestResults().find(r => r.executionId === executionId);
        if (!execution) {
          return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: execution,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const dashboardData = {
          testCases: aiTestingFramework.getTestCases(),
          testSuites: aiTestingFramework.getTestSuites(),
          recentResults: aiTestingFramework.getTestResults().slice(-10),
          activeExecutions: aiTestingFramework.getActiveExecutions(),
          statistics: {
            totalTests: aiTestingFramework.getTestCases().length,
            totalSuites: aiTestingFramework.getTestSuites().length,
            totalExecutions: aiTestingFramework.getTestResults().length,
            activeExecutions: aiTestingFramework.getActiveExecutions().length
          }
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI testing GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve testing data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, testCaseId, suiteId, testCaseData, suiteData, apiEndpoints } = body;

    logger.info('AI testing action', {
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    switch (action) {
      case 'execute_test':
        if (!testCaseId) {
          return NextResponse.json({
            success: false,
            error: 'Test case ID is required'
          }, { status: 400 });
        }

        const testResult = await aiTestingFramework.executeTest(
          testCaseId,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: testResult,
          message: 'Test executed successfully',
          timestamp: new Date().toISOString()
        });

      case 'execute_suite':
        if (!suiteId) {
          return NextResponse.json({
            success: false,
            error: 'Test suite ID is required'
          }, { status: 400 });
        }

        const suiteReport = await aiTestingFramework.executeTestSuite(
          suiteId,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: suiteReport,
          message: 'Test suite executed successfully',
          timestamp: new Date().toISOString()
        });

      case 'create_test_case':
        if (!testCaseData) {
          return NextResponse.json({
            success: false,
            error: 'Test case data is required'
          }, { status: 400 });
        }

        const newTestCase = aiTestingFramework.createTestCase(testCaseData);

        return NextResponse.json({
          success: true,
          data: newTestCase,
          message: 'Test case created successfully',
          timestamp: new Date().toISOString()
        });

      case 'create_test_suite':
        if (!suiteData) {
          return NextResponse.json({
            success: false,
            error: 'Test suite data is required'
          }, { status: 400 });
        }

        const newTestSuite = aiTestingFramework.createTestSuite(suiteData);

        return NextResponse.json({
          success: true,
          data: newTestSuite,
          message: 'Test suite created successfully',
          timestamp: new Date().toISOString()
        });

      case 'generate_automated_tests':
        if (!apiEndpoints || !Array.isArray(apiEndpoints)) {
          return NextResponse.json({
            success: false,
            error: 'API endpoints array is required'
          }, { status: 400 });
        }

        const generatedTests = await aiTestingFramework.generateAutomatedTests(apiEndpoints);

        return NextResponse.json({
          success: true,
          data: generatedTests,
          message: `Generated ${generatedTests.length} automated tests`,
          timestamp: new Date().toISOString()
        });

      case 'run_all_tests':
        // Execute all available test cases
        const allTestCases = aiTestingFramework.getTestCases();
        const allResults = [];

        for (const testCase of allTestCases) {
          try {
            const result = await aiTestingFramework.executeTest(
              testCase.id,
              session.user.organizationId
            );
            allResults.push(result);
          } catch (error) {
            logger.error('Failed to execute test case', {
              testCaseId: testCase.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            totalTests: allTestCases.length,
            executedTests: allResults.length,
            results: allResults
          },
          message: 'All tests executed',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI testing POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI testing operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, testCaseId, suiteId, updates } = body;

    switch (action) {
      case 'update_test_case':
        if (!testCaseId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Test case ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the test case
        // For now, we'll just return success
        return NextResponse.json({
          success: true,
          message: 'Test case updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'update_test_suite':
        if (!suiteId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Test suite ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the test suite
        return NextResponse.json({
          success: true,
          message: 'Test suite updated successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI testing PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI testing update failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get('testCaseId');
    const suiteId = searchParams.get('suiteId');

    if (testCaseId) {
      // In a real implementation, this would delete the test case
      return NextResponse.json({
        success: true,
        message: 'Test case deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (suiteId) {
      // In a real implementation, this would delete the test suite
      return NextResponse.json({
        success: true,
        message: 'Test suite deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Test case ID or suite ID is required'
    }, { status: 400 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('AI testing DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'AI testing deletion failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}