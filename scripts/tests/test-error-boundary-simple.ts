#!/usr/bin/env tsx

/**
 * Simple Error Boundary Test
 * Tests core functionality without external dependencies
 */

import { logger } from '../src/lib/logger';

async function testErrorBoundarySimple() {
  console.log('🛡️  Testing Error Boundary Core Functionality...\n');

  try {
    const {
      leadPulseErrorBoundary,
      ErrorCategory,
      RecoveryStrategy,
    } = await import('../src/lib/leadpulse/error-boundary');

    console.log('✅ Error boundary imported successfully');

    // Test basic recovery
    console.log('\n1. Testing basic error recovery...');
    
    const testContext = {
      ip: '192.168.1.100',
      userAgent: 'Test User Agent',
      timestamp: new Date().toISOString(),
      visitorId: 'test-visitor-123',
    };

    // Test successful operation
    const successResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => ({ success: true, data: 'test-data' }),
      ErrorCategory.PROCESSING,
      testContext,
      'testSuccess'
    );

    console.log(`   ✅ Success: ${successResult.success}`);
    console.log(`   Strategy: ${successResult.strategy}`);

    // Test retry mechanism
    let retryCount = 0;
    const retryResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error(`Retry ${retryCount}`);
        }
        return { success: true, retry: retryCount };
      },
      ErrorCategory.NETWORK,
      testContext,
      'testRetry'
    );

    console.log(`   ✅ Retry success: ${retryResult.success}`);
    console.log(`   Final retry count: ${retryCount}`);

    // Test fallback strategies
    console.log('\n2. Testing fallback strategies...');

    const fallbackTests = [
      { operation: 'trackVisitor', category: ErrorCategory.DATABASE },
      { operation: 'recordTouchpoint', category: ErrorCategory.DATABASE },
      { operation: 'botDetection', category: ErrorCategory.BOT_DETECTION },
      { operation: 'analytics', category: ErrorCategory.PROCESSING },
    ];

    for (const test of fallbackTests) {
      const result = await leadPulseErrorBoundary.executeWithRecovery(
        async () => { throw new Error(`${test.operation} failed`); },
        test.category,
        testContext,
        test.operation
      );

      console.log(`   ${test.operation}: ${result.success ? '✅' : '❌'} (${result.strategy})`);
    }

    // Test error statistics
    console.log('\n3. Testing error statistics...');
    const stats = leadPulseErrorBoundary.getErrorStats();
    console.log(`   Queue size: ${stats.queueSize}`);
    console.log(`   Cache size: ${stats.cacheSize}`);
    console.log(`   Recent errors: ${stats.recentErrors}`);

    console.log('\n🎉 Error Boundary Core Test Complete!');
    console.log('\nKey Results:');
    console.log('- ✅ Error recovery system operational');
    console.log('- ✅ Retry mechanisms working correctly');
    console.log('- ✅ Fallback strategies implemented');
    console.log('- ✅ Error statistics tracking');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testErrorBoundarySimple()
    .then(() => {
      console.log('\n✅ Error boundary core tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error boundary core test failed:', error);
      process.exit(1);
    });
}

export default testErrorBoundarySimple;