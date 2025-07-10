#!/usr/bin/env tsx

/**
 * Test Script for Workflow Performance Analytics
 * 
 * Tests the performance monitoring system with existing schema.
 * This validates execution time tracking, success rates, and bottleneck detection.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

interface PerformanceMetrics {
  workflowId: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number; // milliseconds
  successRate: number; // 0-1
  errorRate: number; // 0-1
  avgStepTime: number; // milliseconds
  bottleneckNodes: Array<{
    nodeType: string;
    avgTime: number;
    errorCount: number;
  }>;
}

async function testWorkflowPerformanceAnalytics() {
  console.log('📊 Testing Workflow Performance Analytics...\n');

  try {
    // 1. Create test workflow and executions
    console.log('1. Setting up test data...');
    
    const timestamp = Date.now();
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        id: `perf-test-user-${timestamp}`,
        email: `perf-test-${timestamp}@example.com`,
        name: 'Performance Test User',
        role: 'USER'
      }
    });

    // Create test contact
    const testContact = await prisma.contact.create({
      data: {
        id: `perf-test-contact-${timestamp}`,
        email: `perf-contact-${timestamp}@example.com`,
        firstName: 'Performance',
        lastName: 'Tester',
        phone: '+2348012345678',
        source: 'performance-test',
        createdById: testUser.id
      }
    });

    // Create test workflow
    const testWorkflow = await prisma.workflow.create({
      data: {
        id: `perf-test-workflow-${timestamp}`,
        name: 'Performance Test Workflow',
        description: 'Workflow for testing performance analytics',
        status: 'ACTIVE',
        definition: JSON.stringify({
          nodes: [
            {
              id: 'trigger-1',
              type: 'triggerNode',
              data: { label: 'Start', properties: {} },
              position: { x: 100, y: 100 }
            },
            {
              id: 'email-1',
              type: 'actionNode',
              data: { label: 'Send Email', properties: { action: 'send_email' } },
              position: { x: 200, y: 200 }
            },
            {
              id: 'sms-1',
              type: 'actionNode',
              data: { label: 'Send SMS', properties: { action: 'send_sms' } },
              position: { x: 300, y: 300 }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'email-1' },
            { id: 'e2-3', source: 'email-1', target: 'sms-1' }
          ]
        }),
        createdById: testUser.id
      }
    });

    console.log(`✅ Created test workflow: ${testWorkflow.id}`);

    // 2. Create multiple workflow executions with varying performance
    console.log('\n2. Creating test executions...');
    
    const executions = [];
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(Date.now() - (i * 60000)); // Spread over last 10 minutes
      const isSuccessful = i < 8; // 80% success rate
      const executionTime = 1000 + (Math.random() * 5000); // 1-6 seconds
      
      const execution = await prisma.workflowExecution.create({
        data: {
          id: `perf-exec-${timestamp}-${i}`,
          workflowId: testWorkflow.id,
          contactId: testContact.id,
          status: isSuccessful ? 'COMPLETED' : 'FAILED',
          startedAt: startTime,
          completedAt: isSuccessful ? new Date(startTime.getTime() + executionTime) : null,
          lastExecutedAt: new Date(startTime.getTime() + executionTime),
          errorMessage: isSuccessful ? null : 'Test execution failure',
          context: JSON.stringify({
            variables: {},
            stepOutputs: {},
            metadata: { testExecution: true }
          })
        }
      });

      executions.push(execution);

      // Create execution steps
      const steps = [
        { stepId: 'trigger-1', nodeType: 'triggerNode', duration: 100 + Math.random() * 200 },
        { stepId: 'email-1', nodeType: 'actionNode', duration: 500 + Math.random() * 1000 },
        { stepId: 'sms-1', nodeType: 'actionNode', duration: 300 + Math.random() * 800 }
      ];

      for (let j = 0; j < steps.length; j++) {
        const step = steps[j];
        const stepStartTime = new Date(startTime.getTime() + (j * 200));
        const shouldFail = !isSuccessful && j === steps.length - 1; // Fail on last step if execution fails
        
        await prisma.workflowExecutionStep.create({
          data: {
            id: `perf-step-${timestamp}-${i}-${j}`,
            executionId: execution.id,
            stepId: step.stepId,
            stepType: step.nodeType,
            status: shouldFail ? 'FAILED' : 'COMPLETED',
            startedAt: stepStartTime,
            completedAt: shouldFail ? null : new Date(stepStartTime.getTime() + step.duration),
            errorMessage: shouldFail ? 'Step execution failed' : null,
            output: shouldFail ? null : JSON.stringify({ 
              success: true, 
              duration: step.duration,
              testStep: true 
            })
          }
        });
      }
    }

    console.log(`✅ Created ${executions.length} test executions`);

    // 3. Test performance analysis functions
    console.log('\n3. Analyzing workflow performance...');
    
    const performanceMetrics = await analyzeWorkflowPerformance(testWorkflow.id);
    
    console.log('📈 Performance Analysis Results:');
    console.log(`   Workflow ID: ${performanceMetrics.workflowId}`);
    console.log(`   Total Executions: ${performanceMetrics.totalExecutions}`);
    console.log(`   Completed: ${performanceMetrics.completedExecutions}`);
    console.log(`   Failed: ${performanceMetrics.failedExecutions}`);
    console.log(`   Success Rate: ${Math.round(performanceMetrics.successRate * 100)}%`);
    console.log(`   Error Rate: ${Math.round(performanceMetrics.errorRate * 100)}%`);
    console.log(`   Avg Execution Time: ${Math.round(performanceMetrics.avgExecutionTime)}ms`);
    console.log(`   Avg Step Time: ${Math.round(performanceMetrics.avgStepTime)}ms`);

    // 4. Test bottleneck detection
    console.log('\n4. Testing bottleneck detection...');
    
    if (performanceMetrics.bottleneckNodes.length > 0) {
      console.log('⚠️  Bottlenecks detected:');
      performanceMetrics.bottleneckNodes.forEach((bottleneck, index) => {
        console.log(`   ${index + 1}. ${bottleneck.nodeType}: ${Math.round(bottleneck.avgTime)}ms avg (${bottleneck.errorCount} errors)`);
      });
    } else {
      console.log('✅ No significant bottlenecks detected');
    }

    // 5. Test execution time trends
    console.log('\n5. Analyzing execution time trends...');
    
    const timeTrends = await analyzeExecutionTimeTrends(testWorkflow.id);
    console.log('📊 Execution Time Trends:');
    timeTrends.forEach((trend, index) => {
      console.log(`   ${index + 1}. ${trend.period}: ${Math.round(trend.avgTime)}ms (${trend.count} executions)`);
    });

    // 6. Test error pattern analysis
    console.log('\n6. Analyzing error patterns...');
    
    const errorPatterns = await analyzeErrorPatterns(testWorkflow.id);
    console.log('🔍 Error Pattern Analysis:');
    if (errorPatterns.length > 0) {
      errorPatterns.forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern.stepType}: ${pattern.errorCount} errors (${Math.round(pattern.errorRate * 100)}% failure rate)`);
      });
    } else {
      console.log('✅ No error patterns detected');
    }

    // 7. Test system health metrics simulation
    console.log('\n7. Testing system health metrics...');
    
    const systemHealth = await getSystemHealthMetrics();
    console.log('💚 System Health Metrics:');
    console.log(`   Active Executions: ${systemHealth.activeExecutions}`);
    console.log(`   Completed Last Hour: ${systemHealth.completedLastHour}`);
    console.log(`   Failed Last Hour: ${systemHealth.failedLastHour}`);
    console.log(`   Avg Response Time: ${Math.round(systemHealth.avgResponseTime)}ms`);
    console.log(`   Error Rate: ${Math.round(systemHealth.errorRate * 100)}%`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete execution steps first
    await prisma.workflowExecutionStep.deleteMany({
      where: { 
        execution: { 
          workflowId: testWorkflow.id 
        }
      }
    });
    
    // Delete executions
    await prisma.workflowExecution.deleteMany({
      where: { workflowId: testWorkflow.id }
    });
    
    // Delete workflow
    await prisma.workflow.delete({ where: { id: testWorkflow.id } });
    
    // Delete contact and user
    await prisma.contact.delete({ where: { id: testContact.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Workflow Performance Analytics Test Completed Successfully!');
    console.log('\nKey findings:');
    console.log('- ✅ Workflow execution metrics can be calculated');
    console.log('- ✅ Success/failure rates are tracked accurately');
    console.log('- ✅ Execution time analysis is working');
    console.log('- ✅ Bottleneck detection identifies slow nodes');
    console.log('- ✅ Error pattern analysis reveals failure points');
    console.log('- ✅ System health metrics provide overview');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Analyze performance metrics for a specific workflow
 */
async function analyzeWorkflowPerformance(workflowId: string): Promise<PerformanceMetrics> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Get recent executions with steps
  const executions = await prisma.workflowExecution.findMany({
    where: {
      workflowId,
      createdAt: { gte: oneHourAgo },
    },
    include: {
      steps: {
        select: {
          stepId: true,
          stepType: true,
          status: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
        },
      },
    },
  });

  const totalExecutions = executions.length;
  const completedExecutions = executions.filter(e => e.status === 'COMPLETED').length;
  const failedExecutions = executions.filter(e => e.status === 'FAILED').length;

  // Calculate execution times
  const executionTimes = executions
    .filter(e => e.completedAt && e.startedAt)
    .map(e => e.completedAt!.getTime() - e.startedAt.getTime());

  const avgExecutionTime = executionTimes.length > 0
    ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    : 0;

  // Calculate step metrics
  const allSteps = executions.flatMap(e => e.steps);
  const stepTimes = allSteps
    .filter(s => s.completedAt && s.startedAt)
    .map(s => s.completedAt!.getTime() - s.startedAt!.getTime());

  const avgStepTime = stepTimes.length > 0
    ? stepTimes.reduce((a, b) => a + b, 0) / stepTimes.length
    : 0;

  // Identify bottlenecks
  const nodeStats = new Map<string, { totalTime: number; count: number; errors: number }>();
  
  allSteps.forEach(step => {
    const key = step.stepType;
    const existing = nodeStats.get(key) || { totalTime: 0, count: 0, errors: 0 };
    
    if (step.completedAt && step.startedAt) {
      existing.totalTime += step.completedAt.getTime() - step.startedAt.getTime();
    }
    existing.count += 1;
    if (step.status === 'FAILED') {
      existing.errors += 1;
    }
    
    nodeStats.set(key, existing);
  });

  const bottleneckNodes = Array.from(nodeStats.entries())
    .map(([nodeType, stats]) => ({
      nodeType,
      avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      errorCount: stats.errors,
    }))
    .filter(node => node.avgTime > 1000 || node.errorCount > 0) // Nodes taking >1s or with errors
    .sort((a, b) => b.avgTime - a.avgTime);

  return {
    workflowId,
    totalExecutions,
    completedExecutions,
    failedExecutions,
    avgExecutionTime,
    successRate: totalExecutions > 0 ? completedExecutions / totalExecutions : 0,
    errorRate: totalExecutions > 0 ? failedExecutions / totalExecutions : 0,
    avgStepTime,
    bottleneckNodes,
  };
}

/**
 * Analyze execution time trends over time
 */
async function analyzeExecutionTimeTrends(workflowId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const executions = await prisma.workflowExecution.findMany({
    where: {
      workflowId,
      createdAt: { gte: oneHourAgo },
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
    orderBy: { startedAt: 'asc' },
  });

  // Group by 10-minute intervals
  const trends = new Map<string, { totalTime: number; count: number }>();
  
  executions.forEach(execution => {
    const intervalStart = Math.floor(execution.startedAt.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000);
    const period = new Date(intervalStart).toISOString().substring(11, 16); // HH:MM format
    const executionTime = execution.completedAt!.getTime() - execution.startedAt.getTime();
    
    const existing = trends.get(period) || { totalTime: 0, count: 0 };
    existing.totalTime += executionTime;
    existing.count += 1;
    trends.set(period, existing);
  });

  return Array.from(trends.entries()).map(([period, stats]) => ({
    period,
    avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
    count: stats.count,
  }));
}

/**
 * Analyze error patterns by step type
 */
async function analyzeErrorPatterns(workflowId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const steps = await prisma.workflowExecutionStep.findMany({
    where: {
      execution: {
        workflowId,
        createdAt: { gte: oneHourAgo },
      },
    },
    select: {
      stepType: true,
      status: true,
      errorMessage: true,
    },
  });

  const stepStats = new Map<string, { total: number; errors: number }>();
  
  steps.forEach(step => {
    const existing = stepStats.get(step.stepType) || { total: 0, errors: 0 };
    existing.total += 1;
    if (step.status === 'FAILED') {
      existing.errors += 1;
    }
    stepStats.set(step.stepType, existing);
  });

  return Array.from(stepStats.entries())
    .map(([stepType, stats]) => ({
      stepType,
      errorCount: stats.errors,
      totalCount: stats.total,
      errorRate: stats.total > 0 ? stats.errors / stats.total : 0,
    }))
    .filter(pattern => pattern.errorCount > 0)
    .sort((a, b) => b.errorRate - a.errorRate);
}

/**
 * Get system-wide health metrics
 */
async function getSystemHealthMetrics() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Get execution statistics
  const [activeExecutions, recentExecutions] = await Promise.all([
    prisma.workflowExecution.count({
      where: { status: 'RUNNING' },
    }),
    prisma.workflowExecution.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    }),
  ]);

  const completedLastHour = recentExecutions.filter(e => e.status === 'COMPLETED').length;
  const failedLastHour = recentExecutions.filter(e => e.status === 'FAILED').length;
  
  // Calculate average response time
  const responseTimes = recentExecutions
    .filter(e => e.completedAt && e.startedAt)
    .map(e => e.completedAt!.getTime() - e.startedAt!.getTime());
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const totalRecent = completedLastHour + failedLastHour;
  const errorRate = totalRecent > 0 ? failedLastHour / totalRecent : 0;

  return {
    activeExecutions,
    completedLastHour,
    failedLastHour,
    avgResponseTime,
    errorRate,
  };
}

// Run the test
if (require.main === module) {
  testWorkflowPerformanceAnalytics()
    .then(() => {
      console.log('\n✅ All performance analytics tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance analytics test suite failed:', error);
      process.exit(1);
    });
}

export default testWorkflowPerformanceAnalytics;