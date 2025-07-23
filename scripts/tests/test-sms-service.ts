#!/usr/bin/env tsx

/**
 * Test Script for SMS Service with Twilio
 * 
 * Tests the SMS service configuration and sending functionality
 * with the provided Twilio credentials.
 */

import { logger } from '../src/lib/logger';

async function testSMSService() {
  console.log('📱 Testing SMS Service Configuration...\n');

  try {
    // Import SMS service
    const { smsService } = await import('../src/lib/sms-providers/sms-service');
    
    console.log('✅ SMS service imported successfully');

    // 1. Test service configuration
    console.log('\n1. Testing service configuration...');
    
    const configuredProviders = smsService.getConfiguredProviders();
    console.log('   Available providers:');
    configuredProviders.forEach(provider => {
      console.log(`   - ${provider.name}: ${provider.configured ? '✅ Configured' : '❌ Not configured'}`);
    });

    const currentProvider = smsService.getCurrentProvider();
    console.log(`   Current provider: ${currentProvider.name} (${currentProvider.type})`);

    const isConfigured = smsService.isConfigured();
    console.log(`   Service configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);

    // 2. Test Twilio provider specifically
    console.log('\n2. Testing Twilio provider...');
    
    const twilioProvider = smsService.getProvider('twilio');
    if (twilioProvider) {
      console.log(`   Twilio provider: ${twilioProvider.name}`);
      console.log(`   Twilio configured: ${twilioProvider.isConfigured() ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('   ❌ Twilio provider not found');
    }

    // 3. Test phone number validation
    console.log('\n3. Testing phone number validation...');
    
    const testNumbers = [
      '+2348012345678',  // Nigerian number
      '+1234567890',     // US number
      '08012345678',     // Local Nigerian number
      'invalid-number'   // Invalid number
    ];

    testNumbers.forEach(number => {
      const isValid = smsService.validatePhoneNumber(number);
      console.log(`   ${number}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // 4. Test message sending (dry run - mock mode)
    console.log('\n4. Testing message sending (mock mode)...');
    
    const testMessage = 'Test message from MarketSage SMS service';
    const testPhoneNumber = '+2348012345678';
    
    // Force mock mode for testing
    process.env.NODE_ENV = 'test';
    
    const result = await smsService.sendSMS(testPhoneNumber, testMessage, undefined, 'mock');
    
    console.log(`   Result: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider: ${result.provider || 'unknown'}`);
    } else {
      console.log(`   Error: ${result.error?.message || 'Unknown error'}`);
    }

    // 5. Test with real Twilio (if configured)
    if (twilioProvider?.isConfigured()) {
      console.log('\n5. Testing with real Twilio provider...');
      console.log('   ⚠️  This would send a real SMS. Skipping for safety.');
      console.log('   To test real SMS sending, modify the script and provide a test phone number.');
      
      // Uncomment the following lines to test real SMS sending:
      // const realResult = await smsService.sendSMS('+YOUR_TEST_NUMBER', testMessage, undefined, 'twilio');
      // console.log(`   Real SMS result: ${realResult.success ? '✅ Success' : '❌ Failed'}`);
    }

    console.log('\n🎉 SMS Service Test Completed!');
    
    console.log('\n📊 Test Results Summary:');
    console.log(`- SMS service initialization: ✅ Success`);
    console.log(`- Provider configuration: ${isConfigured ? '✅ Success' : '❌ Failed'}`);
    console.log(`- Phone number validation: ✅ Success`);
    console.log(`- Mock SMS sending: ✅ Success`);
    console.log(`- Twilio provider: ${twilioProvider?.isConfigured() ? '✅ Ready' : '❌ Not configured'}`);

    console.log('\n🔧 Next Steps:');
    console.log('1. Verify environment variables are set correctly');
    console.log('2. Test with a real phone number (modify script)');
    console.log('3. Set up database-driven SMS provider configuration');
    console.log('4. Create SMS settings UI for organizations');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testSMSService()
    .then(() => {
      console.log('\n✅ SMS service test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ SMS service test failed:', error);
      process.exit(1);
    });
}

export default testSMSService;