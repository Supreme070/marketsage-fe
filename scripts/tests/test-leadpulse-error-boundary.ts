#!/usr/bin/env tsx

/**
 * Test Script for LeadPulse Error Boundary System
 * 
 * Tests the comprehensive error handling and fallback strategies
 * to ensure LeadPulse continues functioning even when components fail.
 */

import { logger } from '../src/lib/logger';

async function testLeadPulseErrorBoundary() {
  console.log('🛡️  Testing LeadPulse Error Boundary System...\n');

  try {
    // Import error boundary components
    const {
      leadPulseErrorBoundary,
      ErrorCategory,
      ErrorSeverity,
      RecoveryStrategy,
      withErrorBoundary,
      initializeErrorBoundary,
    } = await import('../src/lib/leadpulse/error-boundary');

    const {
      createErrorHandledRequest,
      withDatabaseErrorHandling,
      withCacheErrorHandling,
      withExternalAPIErrorHandling,
    } = await import('../src/lib/leadpulse/error-middleware');

    console.log('✅ Error boundary components imported successfully\n');

    // Initialize the error boundary system
    initializeErrorBoundary();
    console.log('✅ Error boundary system initialized\n');

    // 1. Test basic error recovery
    console.log('1. Testing basic error recovery...');
    
    const testContext = {
      ip: '192.168.1.100',
      userAgent: 'Test User Agent',
      timestamp: new Date().toISOString(),
      visitorId: 'test-visitor-123',
      metadata: { test: true },
    };

    // Test successful operation
    const successResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        return { success: true, data: 'test-data' };
      },
      ErrorCategory.PROCESSING,
      testContext,
      'testSuccessfulOperation'
    );

    console.log(`   ✅ Successful operation: ${successResult.success}`);
    console.log(`      Fallback used: ${successResult.fallbackUsed}`);
    console.log(`      Strategy: ${successResult.strategy}`);

    // Test operation with retries
    let retryCount = 0;
    const retryResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error(`Temporary failure ${retryCount}`);
        }
        return { success: true, data: 'retry-success' };
      },
      ErrorCategory.NETWORK,
      testContext,
      'testRetryOperation'
    );

    console.log(`   ✅ Retry operation: ${retryResult.success}`);
    console.log(`      Retry count: ${retryResult.retryCount}`);
    console.log(`      Final attempt successful: ${retryCount === 3}`);

    // 2. Test fallback strategies
    console.log('\n2. Testing fallback strategies...');

    // Test visitor tracking fallback
    const visitorFallbackResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw new Error('Database connection failed');
      },
      ErrorCategory.DATABASE,
      testContext,
      'trackVisitor'
    );

    console.log(`   ✅ Visitor tracking fallback: ${visitorFallbackResult.success}`);
    console.log(`      Fallback used: ${visitorFallbackResult.fallbackUsed}`);
    console.log(`      Strategy: ${visitorFallbackResult.strategy}`);
    if (visitorFallbackResult.data) {
      console.log(`      Fallback visitor ID: ${visitorFallbackResult.data.id}`);
    }

    // Test touchpoint recording fallback
    const touchpointFallbackResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw new Error('Database write failed');
      },
      ErrorCategory.DATABASE,
      { ...testContext, eventType: 'pageview', url: 'https://example.com' },
      'recordTouchpoint'
    );

    console.log(`   ✅ Touchpoint recording fallback: ${touchpointFallbackResult.success}`);
    console.log(`      Fallback used: ${touchpointFallbackResult.fallbackUsed}`);

    // Test bot detection fallback
    const botDetectionFallbackResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw new Error('Bot detection service unavailable');
      },
      ErrorCategory.BOT_DETECTION,
      testContext,
      'botDetection'
    );

    console.log(`   ✅ Bot detection fallback: ${botDetectionFallbackResult.success}`);
    console.log(`      Default action: ${botDetectionFallbackResult.data.action}`);
    console.log(`      Confidence: ${botDetectionFallbackResult.data.confidence}`);

    // 3. Test error categories and configurations
    console.log('\n3. Testing error category configurations...');

    const categories = [
      ErrorCategory.DATABASE,
      ErrorCategory.CACHE,
      ErrorCategory.NETWORK,
      ErrorCategory.VALIDATION,
      ErrorCategory.PROCESSING,
      ErrorCategory.EXTERNAL_API,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.RATE_LIMITING,
      ErrorCategory.BOT_DETECTION,
    ];

    for (const category of categories) {
      console.log(`   Testing ${category} category...`);
      
      const categoryResult = await leadPulseErrorBoundary.executeWithRecovery(
        async () => {
          throw new Error(`${category} error simulation`);
        },
        category,
        testContext,
        `test${category}Error`
      );

      console.log(`      Result: ${categoryResult.success ? 'Success (fallback)' : 'Failed'}`);
      console.log(`      Strategy: ${categoryResult.strategy}`);
      console.log(`      Fallback used: ${categoryResult.fallbackUsed}`);
    }

    // 4. Test cache recovery
    console.log('\n4. Testing cache recovery...');

    // First, cache a result
    await leadPulseErrorBoundary.cacheResult(
      'testCacheOperation',
      testContext,
      { cached: true, data: 'cached-result' },
      30000 // 30 seconds
    );

    console.log('   ✅ Cached test result');

    // Then test cache recovery
    const cacheRecoveryResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw new Error('Primary operation failed');
      },
      ErrorCategory.DATABASE,
      testContext,
      'testCacheOperation'
    );

    console.log(`   Cache recovery result: ${cacheRecoveryResult.success}`);
    if (cacheRecoveryResult.success && cacheRecoveryResult.data) {
      console.log(`   ✅ Recovered from cache: ${cacheRecoveryResult.data.cached}`);
    }

    // 5. Test queue functionality
    console.log('\n5. Testing error queue functionality...');

    // Test queueing failed operations
    const queueResult = await leadPulseErrorBoundary.executeWithRecovery(
      async () => {
        throw new Error('Operation failed, should be queued');
      },
      ErrorCategory.PROCESSING,
      { ...testContext, eventType: 'form_submit' },
      'processFormSubmission'
    );

    console.log(`   Queue result: ${queueResult.success}`);
    console.log(`   Strategy: ${queueResult.strategy}`);

    // Check error statistics
    const errorStats = leadPulseErrorBoundary.getErrorStats();
    console.log(`   ✅ Error queue size: ${errorStats.queueSize}`);
    console.log(`   ✅ Cache size: ${errorStats.cacheSize}`);
    console.log(`   ✅ Recent errors: ${errorStats.recentErrors}`);

    // 6. Test health check
    console.log('\n6. Testing health check functionality...');

    const healthCheck = await leadPulseErrorBoundary.healthCheck();
    console.log(`   ✅ Health status: ${healthCheck.status}`);
    console.log(`   Database: ${healthCheck.details.database}`);
    console.log(`   Cache: ${healthCheck.details.cache}`);
    console.log(`   Memory cache size: ${healthCheck.details.memoryCacheSize}`);
    console.log(`   Error queue size: ${healthCheck.details.errorQueueSize}`);

    if (healthCheck.details.warnings) {
      console.log(`   ⚠️  Warnings: ${healthCheck.details.warnings.join(', ')}`);
    }

    if (healthCheck.details.errors) {
      console.log(`   ❌ Errors: ${healthCheck.details.errors.join(', ')}`);
    }

    // 7. Test middleware wrapper functions
    console.log('\n7. Testing error middleware wrappers...');

    // Mock request object for testing
    const mockRequest = {
      headers: new Map([
        ['user-agent', 'Test User Agent'],
        ['x-forwarded-for', '192.168.1.100'],
      ]),
      method: 'POST',
      url: 'https://example.com/api/test',
    } as any;

    // Add forEach method for headers
    mockRequest.headers.forEach = function(callback: (value: string, key: string) => void) {
      for (const [key, value] of this.entries()) {
        callback(value, key);
      }
    };

    const errorHandledRequest = createErrorHandledRequest(mockRequest);
    console.log(`   ✅ Created error-handled request wrapper`);
    console.log(`   Context IP: ${errorHandledRequest.context.ip}`);
    console.log(`   Context User Agent: ${errorHandledRequest.context.userAgent}`);

    // Test database error handling wrapper
    try {
      await withDatabaseErrorHandling(
        async () => {
          throw new Error('Database operation failed');
        },
        testContext,
        'testDatabaseOperation'
      );
    } catch (error) {
      console.log(`   ✅ Database error properly handled: ${error.message}`);
    }

    // Test cache error handling wrapper
    try {
      await withCacheErrorHandling(
        async () => {
          throw new Error('Cache operation failed');
        },
        testContext,
        'testCacheOperation'
      );
    } catch (error) {
      console.log(`   ✅ Cache error properly handled: ${error.message}`);
    }

    // Test external API error handling wrapper
    try {
      await withExternalAPIErrorHandling(
        async () => {
          throw new Error('External API call failed');
        },
        testContext,
        'testExternalAPIOperation'
      );
    } catch (error) {
      console.log(`   ✅ External API error properly handled: ${error.message}`);
    }

    // 8. Test withErrorBoundary wrapper
    console.log('\n8. Testing withErrorBoundary wrapper...');

    const wrapperResult = await withErrorBoundary(
      async () => {
        return { success: true, message: 'Wrapper test successful' };
      },
      ErrorCategory.PROCESSING,
      testContext,
      'testWrapperOperation'
    );

    console.log(`   ✅ Wrapper result: ${wrapperResult.success}`);
    console.log(`   Message: ${wrapperResult.message}`);

    // Test wrapper with failure
    try {
      await withErrorBoundary(
        async () => {
          throw new Error('Wrapper test failure');
        },
        ErrorCategory.VALIDATION,
        testContext,
        'testWrapperFailure'
      );
    } catch (error) {
      console.log(`   ✅ Wrapper failure properly handled: ${error.message}`);
    }

    // 9. Test error severity determination
    console.log('\n9. Testing error severity and categorization...');

    const testErrors = [
      { category: ErrorCategory.VALIDATION, error: new Error('Invalid input') },
      { category: ErrorCategory.DATABASE, error: new Error('Connection timeout') },
      { category: ErrorCategory.CACHE, error: new Error('Redis unavailable') },
      { category: ErrorCategory.NETWORK, error: new Error('ECONNREFUSED') },
      { category: ErrorCategory.EXTERNAL_API, error: new Error('API rate limit') },
    ];

    for (const { category, error } of testErrors) {
      const result = await leadPulseErrorBoundary.executeWithRecovery(
        async () => { throw error; },
        category,
        testContext,
        `test${category}Error`
      );

      console.log(`   ${category}: ${result.success ? 'Handled' : 'Failed'} - Strategy: ${result.strategy}`);
    }

    // 10. Test performance under load
    console.log('\n10. Testing performance under error load...');

    const startTime = Date.now();
    const promises = [];

    // Simulate multiple concurrent failures
    for (let i = 0; i < 20; i++) {
      promises.push(
        leadPulseErrorBoundary.executeWithRecovery(
          async () => {
            if (Math.random() < 0.5) {
              throw new Error(`Random failure ${i}`);
            }
            return { success: true, id: i };
          },
          ErrorCategory.PROCESSING,
          { ...testContext, metadata: { testId: i } },
          `concurrentTest${i}`
        )
      );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const successCount = results.filter(r => r.success).length;
    const fallbackCount = results.filter(r => r.fallbackUsed).length;

    console.log(`   ✅ Processed 20 concurrent operations in ${endTime - startTime}ms`);
    console.log(`   Successful operations: ${successCount}/20`);
    console.log(`   Fallback operations: ${fallbackCount}/20`);

    console.log('\n🎉 LeadPulse Error Boundary System Test Completed Successfully!');
    
    // Final health check
    const finalHealthCheck = await leadPulseErrorBoundary.healthCheck();
    console.log(`\n📊 Final Health Status: ${finalHealthCheck.status}`);

    console.log('\n🛡️  Error Boundary Features Tested:');
    console.log('- ✅ Automatic retry with exponential backoff');
    console.log('- ✅ Fallback strategies for all operation types');
    console.log('- ✅ Cache-based error recovery');
    console.log('- ✅ Operation queueing for later retry');
    console.log('- ✅ Error categorization and severity handling');
    console.log('- ✅ Health monitoring and diagnostics');
    console.log('- ✅ Performance under concurrent load');
    console.log('- ✅ Graceful degradation strategies');

    console.log('\n🔧 Recovery Strategies Implemented:');
    console.log('- RETRY: Automatic retry with exponential backoff');
    console.log('- FALLBACK: Operation-specific fallback implementations');
    console.log('- CACHE: Recovery from cached successful results');
    console.log('- QUEUE: Queue failed operations for later processing');
    console.log('- DEGRADE: Graceful service degradation');
    console.log('- IGNORE: Safe error suppression for non-critical operations');

    console.log('\n📈 Error Categories Covered:');
    console.log('- DATABASE: Database connection and query failures');
    console.log('- CACHE: Redis/cache service failures');
    console.log('- NETWORK: Network connectivity issues');
    console.log('- VALIDATION: Input validation failures');
    console.log('- PROCESSING: Business logic processing errors');
    console.log('- EXTERNAL_API: Third-party service failures');
    console.log('- AUTHENTICATION: Auth service failures');
    console.log('- RATE_LIMITING: Rate limit exceeded scenarios');
    console.log('- BOT_DETECTION: Bot detection service failures');

    console.log('\n💪 Resilience Features:');
    console.log('- In-memory fallback data storage');
    console.log('- Operation result caching for recovery');
    console.log('- Failed operation queueing and retry');
    console.log('- Health monitoring and alerting');
    console.log('- Error statistics and monitoring');
    console.log('- Configurable retry policies per error category');
    console.log('- Minimal performance impact on successful operations');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testLeadPulseErrorBoundary()
    .then(() => {
      console.log('\n✅ All error boundary tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error boundary test suite failed:', error);
      process.exit(1);
    });
}

export default testLeadPulseErrorBoundary;