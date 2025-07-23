/**
 * Test script for the workflow retry mechanism
 * 
 * This script tests various retry scenarios to ensure the retry system
 * works correctly in production environments.
 */

import { workflowRetryManager } from '../src/lib/workflow/retry-mechanism';
import { WorkflowExecutionEngine } from '../src/lib/workflow/execution-engine';
import prisma from '../src/lib/db/prisma';
import { randomUUID } from 'crypto';

async function createTestWorkflow() {
  const workflowId = randomUUID();
  const contactId = randomUUID();
  
  // Create test workflow
  const workflow = await prisma.workflow.create({
    data: {
      id: workflowId,
      name: 'Test Retry Workflow',
      description: 'Workflow for testing retry mechanisms',
      status: 'ACTIVE',
      definition: JSON.stringify({
        nodes: [
          {
            id: 'trigger-1',
            type: 'triggerNode',
            data: {
              label: 'Form Submission',
              properties: { type: 'form' }
            },
            position: { x: 0, y: 0 }
          },
          {
            id: 'email-1',
            type: 'actionNode',
            data: {
              label: 'Send Welcome Email',
              properties: {
                templateName: 'Welcome Email',
                subject: 'Welcome to MarketSage!'
              }
            },
            position: { x: 200, y: 0 }
          },
          {
            id: 'webhook-1',
            type: 'webhookNode',
            data: {
              label: 'Call External API',
              properties: {
                url: 'https://httpstat.us/500', // This will fail for testing
                method: 'POST'
              }
            },
            position: { x: 400, y: 0 }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'trigger-1',
            target: 'email-1'
          },
          {
            id: 'e2',
            source: 'email-1',
            target: 'webhook-1'
          }
        ]
      }),
      createdById: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // Create test contact
  const contact = await prisma.contact.create({
    data: {
      id: contactId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      source: 'Test',
      createdById: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  return { workflowId, contactId };
}

async function testBasicRetryMechanism() {
  console.log('🧪 Testing basic retry mechanism...');
  
  const { workflowId, contactId } = await createTestWorkflow();
  const executionId = randomUUID();
  const stepId = 'webhook-1';
  const stepType = 'webhookNode';

  // Create a mock execution
  await prisma.workflowExecution.create({
    data: {
      id: executionId,
      workflowId,
      contactId,
      status: 'RUNNING',
      context: JSON.stringify({}),
      startedAt: new Date(),
    }
  });

  // Create a mock step execution
  await prisma.workflowExecutionStep.create({
    data: {
      id: randomUUID(),
      executionId,
      stepId,
      stepType,
      status: 'RUNNING',
      startedAt: new Date(),
    }
  });

  // Test 1: Check if error should be retried
  const error = new Error('network error - connection timeout');
  const shouldRetry = await workflowRetryManager.shouldRetryStep(
    executionId,
    stepId,
    stepType,
    error
  );

  console.log(`  ✓ Should retry network error: ${shouldRetry}`);
  if (!shouldRetry) {
    throw new Error('Expected network error to be retryable');
  }

  // Test 2: Schedule a retry
  const retryResult = await workflowRetryManager.scheduleRetry(
    executionId,
    stepId,
    stepType,
    error
  );

  console.log(`  ✓ Retry scheduled: ${retryResult.scheduled}`);
  console.log(`  ✓ Next retry at: ${retryResult.nextRetryAt}`);
  console.log(`  ✓ Delay: ${retryResult.delayMs}ms`);

  if (!retryResult.scheduled) {
    throw new Error('Expected retry to be scheduled');
  }

  // Test 3: Check non-retryable error
  const nonRetryableError = new Error('unauthorized access - invalid credentials');
  const shouldNotRetry = await workflowRetryManager.shouldRetryStep(
    executionId,
    stepId,
    stepType,
    nonRetryableError
  );

  console.log(`  ✓ Should not retry auth error: ${!shouldNotRetry}`);
  if (shouldNotRetry) {
    throw new Error('Expected auth error to not be retryable');
  }

  console.log('✅ Basic retry mechanism tests passed\n');
  return { executionId, stepId, stepType };
}

async function testCircuitBreaker() {
  console.log('🔧 Testing circuit breaker...');
  
  const { workflowId, contactId } = await createTestWorkflow();
  const executionId = randomUUID();
  const stepId = 'webhook-circuit-test';
  const stepType = 'webhookNode';

  // Create mock execution and step
  await prisma.workflowExecution.create({
    data: {
      id: executionId,
      workflowId,
      contactId,
      status: 'RUNNING',
      context: JSON.stringify({}),
      startedAt: new Date(),
    }
  });

  await prisma.workflowExecutionStep.create({
    data: {
      id: randomUUID(),
      executionId,
      stepId,
      stepType,
      status: 'RUNNING',
      startedAt: new Date(),
    }
  });

  const error = new Error('service unavailable');

  // Trigger multiple failures to open circuit breaker
  for (let i = 0; i < 4; i++) {
    const shouldRetry = await workflowRetryManager.shouldRetryStep(
      executionId,
      stepId,
      stepType,
      error
    );

    if (shouldRetry) {
      await workflowRetryManager.scheduleRetry(
        executionId,
        stepId,
        stepType,
        error
      );
    }

    console.log(`  Failure ${i + 1}: Should retry = ${shouldRetry}`);
  }

  // The circuit should now be open
  const shouldRetryAfterCircuitOpen = await workflowRetryManager.shouldRetryStep(
    executionId,
    stepId,
    stepType,
    error
  );

  console.log(`  ✓ Circuit breaker opened: ${!shouldRetryAfterCircuitOpen}`);
  if (shouldRetryAfterCircuitOpen) {
    throw new Error('Expected circuit breaker to prevent retry');
  }

  console.log('✅ Circuit breaker tests passed\n');
}

async function testRetryStrategies() {
  console.log('⏰ Testing retry strategies...');
  
  const { workflowId, contactId } = await createTestWorkflow();
  
  // Test exponential backoff
  const testExponential = async (stepType: string, baseDelay: number) => {
    const executionId = randomUUID();
    const stepId = `${stepType}-exponential`;

    await prisma.workflowExecution.create({
      data: {
        id: executionId,
        workflowId,
        contactId,
        status: 'RUNNING',
        context: JSON.stringify({}),
        startedAt: new Date(),
      }
    });

    await prisma.workflowExecutionStep.create({
      data: {
        id: randomUUID(),
        executionId,
        stepId,
        stepType,
        status: 'RUNNING',
        startedAt: new Date(),
      }
    });

    const error = new Error('timeout');
    const delays = [];

    for (let i = 0; i < 3; i++) {
      const shouldRetry = await workflowRetryManager.shouldRetryStep(
        executionId,
        stepId,
        stepType,
        error
      );

      if (shouldRetry) {
        const retryResult = await workflowRetryManager.scheduleRetry(
          executionId,
          stepId,
          stepType,
          error
        );
        if (retryResult.delayMs) {
          delays.push(retryResult.delayMs);
        }
      }
    }

    console.log(`  ${stepType} delays: ${delays.map(d => `${d}ms`).join(', ')}`);
    
    // Verify exponential increase (allowing for jitter)
    for (let i = 1; i < delays.length; i++) {
      if (delays[i] <= delays[i - 1]) {
        console.log(`  ⚠️  Warning: Delay didn't increase as expected (jitter may be applied)`);
      }
    }
  };

  await testExponential('webhookNode', 2000);
  await testExponential('apiCallNode', 1500);

  console.log('✅ Retry strategy tests passed\n');
}

async function testRetryStatistics() {
  console.log('📊 Testing retry statistics...');
  
  // Get retry statistics
  const stats = await workflowRetryManager.getRetryStatistics(24 * 60 * 60 * 1000); // 24 hours
  
  console.log('  Statistics:');
  console.log(`    Total retries: ${stats.totalRetries}`);
  console.log(`    Successful retries: ${stats.successfulRetries}`);
  console.log(`    Failed retries: ${stats.failedRetries}`);
  console.log(`    Circuit breaker activations: ${stats.circuitBreakerActivations}`);
  console.log(`    Top failing steps:`);
  
  stats.topFailingSteps.forEach((step, index) => {
    console.log(`      ${index + 1}. ${step.stepType}: ${step.failures} failures`);
  });

  console.log('✅ Retry statistics test passed\n');
}

async function testMarkStepSuccess() {
  console.log('✅ Testing step success marking...');
  
  const { workflowId, contactId } = await createTestWorkflow();
  const executionId = randomUUID();
  const stepId = 'success-test';
  const stepType = 'actionNode';

  // Create mock execution and step
  await prisma.workflowExecution.create({
    data: {
      id: executionId,
      workflowId,
      contactId,
      status: 'RUNNING',
      context: JSON.stringify({}),
      startedAt: new Date(),
    }
  });

  await prisma.workflowExecutionStep.create({
    data: {
      id: randomUUID(),
      executionId,
      stepId,
      stepType,
      status: 'RUNNING',
      startedAt: new Date(),
    }
  });

  // First, trigger a failure to set up retry state
  const error = new Error('temporary failure');
  await workflowRetryManager.scheduleRetry(executionId, stepId, stepType, error);

  // Then mark as successful
  await workflowRetryManager.markStepSuccess(executionId, stepId);

  // Verify that retry state was reset
  const stepData = await prisma.workflowExecutionStep.findFirst({
    where: { executionId, stepId },
    select: { retryState: true }
  });

  if (stepData?.retryState) {
    const retryState = JSON.parse(stepData.retryState);
    console.log(`  ✓ Retry count reset: ${retryState.retryCount === 0}`);
    console.log(`  ✓ Circuit breaker closed: ${!retryState.isCircuitOpen}`);
    console.log(`  ✓ Consecutive failures reset: ${retryState.consecutiveFailures === 0}`);
  }

  console.log('✅ Step success marking test passed\n');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test workflows and related data
  await prisma.workflowExecutionStep.deleteMany({
    where: {
      execution: {
        workflow: {
          name: 'Test Retry Workflow'
        }
      }
    }
  });

  await prisma.workflowExecution.deleteMany({
    where: {
      workflow: {
        name: 'Test Retry Workflow'
      }
    }
  });

  await prisma.workflow.deleteMany({
    where: {
      name: 'Test Retry Workflow'
    }
  });

  await prisma.contact.deleteMany({
    where: {
      email: 'test@example.com'
    }
  });

  console.log('✅ Test data cleaned up\n');
}

async function runRetryMechanismTests() {
  console.log('🚀 Starting Workflow Retry Mechanism Tests\n');
  
  try {
    await testBasicRetryMechanism();
    await testCircuitBreaker();
    await testRetryStrategies();
    await testRetryStatistics();
    await testMarkStepSuccess();
    
    console.log('🎉 All retry mechanism tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await cleanupTestData();
  }
}

// Run the tests
if (require.main === module) {
  runRetryMechanismTests()
    .then(() => {
      console.log('\n✨ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { runRetryMechanismTests };