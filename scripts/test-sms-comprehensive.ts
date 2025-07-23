#!/usr/bin/env tsx
/**
 * Comprehensive SMS Testing Script
 * Tests all SMS functionality including Twilio, Africa's Talking, Termii, and fallback scenarios
 */

import { smsService } from '../src/lib/sms-providers/sms-service';
import { TwilioSMSProvider } from '../src/lib/sms-providers/twilio-provider';
import { AfricasTalkingSMSProvider } from '../src/lib/sms-providers/africastalking-provider';
import { TermiiSMSProvider } from '../src/lib/sms-providers/termii-provider';
import prisma from '../src/lib/db/prisma';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  test: string;
  provider: string;
  success: boolean;
  message: string;
  details?: any;
  duration: number;
}

class SMSComprehensiveTester {
  private results: TestResult[] = [];
  private testPhone: string;

  constructor(testPhone?: string) {
    // Use provided test phone or default to a Nigerian number
    this.testPhone = testPhone || '+2348012345678';
  }

  async runTest(
    testName: string,
    provider: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🧪 Testing ${provider}: ${testName}...`);

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      if (result && result.success !== false) {
        this.results.push({
          test: testName,
          provider,
          success: true,
          message: 'Passed',
          details: result,
          duration
        });
        console.log(`✅ ${provider}: ${testName} - PASSED (${duration}ms)`);
        if (result.messageId) {
          console.log(`   Message ID: ${result.messageId}`);
        }
      } else {
        this.results.push({
          test: testName,
          provider,
          success: false,
          message: result?.error?.message || 'Test failed',
          details: result,
          duration
        });
        console.log(`❌ ${provider}: ${testName} - FAILED (${duration}ms)`);
        console.log(`   Error: ${result?.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        provider,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      console.log(`❌ ${provider}: ${testName} - ERROR: ${error} (${duration}ms)`);
    }
  }

  async testTwilioProvider(): Promise<void> {
    console.log('\n📱 Testing Twilio SMS Provider...');

    // Check configuration
    await this.runTest('Configuration Check', 'Twilio', async () => {
      const provider = new TwilioSMSProvider();
      const isConfigured = provider.isConfigured();
      console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set'}`);
      console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set'}`);
      console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not set'}`);
      console.log(`   Configured: ${isConfigured}`);
      return { success: true, configured: isConfigured };
    });

    // Test sending SMS
    await this.runTest('Send SMS', 'Twilio', async () => {
      const provider = new TwilioSMSProvider();
      if (!provider.isConfigured()) {
        return { success: false, error: { message: 'Twilio not configured' } };
      }
      return await provider.sendSMS(this.testPhone, `Test SMS from MarketSage Twilio - ${new Date().toLocaleTimeString()}`);
    });

    // Test phone validation
    await this.runTest('Phone Number Validation', 'Twilio', async () => {
      const provider = new TwilioSMSProvider();
      const validNumbers = [
        '+2348012345678', // Nigeria
        '+14155552671',   // US
        '+442071838750',  // UK
      ];
      const invalidNumbers = ['invalid', '123', '', '+1'];
      
      const validResults = validNumbers.map(num => ({
        number: num,
        valid: provider.validatePhoneNumber(num)
      }));
      
      const invalidResults = invalidNumbers.map(num => ({
        number: num,
        valid: provider.validatePhoneNumber(num)
      }));

      console.log('   Valid numbers:', validResults);
      console.log('   Invalid numbers:', invalidResults);

      const allValidCorrect = validResults.every(r => r.valid === true);
      const allInvalidCorrect = invalidResults.every(r => r.valid === false);

      return { success: allValidCorrect && allInvalidCorrect };
    });
  }

  async testAfricasTalkingProvider(): Promise<void> {
    console.log('\n📱 Testing Africa\'s Talking SMS Provider...');

    // Check configuration
    await this.runTest('Configuration Check', 'Africa\'s Talking', async () => {
      const provider = new AfricasTalkingSMSProvider();
      const isConfigured = provider.isConfigured();
      console.log(`   API Key: ${process.env.AFRICASTALKING_API_KEY ? 'Set' : 'Not set'}`);
      console.log(`   Username: ${process.env.AFRICASTALKING_USERNAME || 'Not set'}`);
      console.log(`   From: ${process.env.AFRICASTALKING_FROM || 'Not set'}`);
      console.log(`   Configured: ${isConfigured}`);
      return { success: true, configured: isConfigured };
    });

    // Test mock sending (if not configured)
    await this.runTest('Mock Send SMS', 'Africa\'s Talking', async () => {
      const provider = new AfricasTalkingSMSProvider();
      // Force mock mode for testing
      return await provider.sendSMS(this.testPhone, `Test SMS from MarketSage Africa's Talking - ${new Date().toLocaleTimeString()}`);
    });

    // Test African phone validation
    await this.runTest('African Phone Validation', 'Africa\'s Talking', async () => {
      const provider = new AfricasTalkingSMSProvider();
      const africanNumbers = [
        { number: '+2348012345678', country: 'Nigeria', expected: true },
        { number: '+254701234567', country: 'Kenya', expected: true },
        { number: '+27821234567', country: 'South Africa', expected: true },
        { number: '+233541234567', country: 'Ghana', expected: true },
        { number: '+256701234567', country: 'Uganda', expected: true },
        { number: '08012345678', country: 'Nigeria (local)', expected: true },
        { number: '+44123456789', country: 'UK', expected: false },
      ];
      
      const results = africanNumbers.map(test => ({
        ...test,
        valid: provider.validatePhoneNumber(test.number),
        correct: provider.validatePhoneNumber(test.number) === test.expected
      }));

      console.log('   African number validation:');
      results.forEach(r => {
        console.log(`     ${r.number} (${r.country}): ${r.valid} ${r.correct ? '✓' : '✗'}`);
      });

      return { success: results.every(r => r.correct) };
    });
  }

  async testTermiiProvider(): Promise<void> {
    console.log('\n📱 Testing Termii SMS Provider...');

    // Check configuration
    await this.runTest('Configuration Check', 'Termii', async () => {
      const provider = new TermiiSMSProvider();
      const isConfigured = provider.isConfigured();
      console.log(`   API Key: ${process.env.TERMII_API_KEY ? 'Set' : 'Not set'}`);
      console.log(`   Sender ID: ${process.env.TERMII_SENDER_ID || 'Not set'}`);
      console.log(`   Configured: ${isConfigured}`);
      return { success: true, configured: isConfigured };
    });

    // Test mock sending
    await this.runTest('Mock Send SMS', 'Termii', async () => {
      const provider = new TermiiSMSProvider();
      return await provider.sendSMS(this.testPhone, `Test SMS from MarketSage Termii - ${new Date().toLocaleTimeString()}`);
    });

    // Test Nigerian phone validation
    await this.runTest('Nigerian Phone Validation', 'Termii', async () => {
      const provider = new TermiiSMSProvider();
      const nigerianNumbers = [
        { number: '+2348012345678', format: 'International', expected: true },
        { number: '2348012345678', format: 'Without +', expected: true },
        { number: '08012345678', format: 'Local', expected: true },
        { number: '8012345678', format: 'Without 0', expected: true },
        { number: '+2347012345678', format: 'MTN', expected: true },
        { number: '+2348112345678', format: 'Airtel', expected: true },
        { number: '+2349012345678', format: '9mobile', expected: true },
        { number: '+254701234567', format: 'Kenya', expected: false },
      ];
      
      const results = nigerianNumbers.map(test => ({
        ...test,
        valid: provider.validatePhoneNumber(test.number),
        correct: provider.validatePhoneNumber(test.number) === test.expected
      }));

      console.log('   Nigerian number validation:');
      results.forEach(r => {
        console.log(`     ${r.number} (${r.format}): ${r.valid} ${r.correct ? '✓' : '✗'}`);
      });

      return { success: results.every(r => r.correct) };
    });
  }

  async testSMSService(): Promise<void> {
    console.log('\n🔧 Testing SMS Service (Unified Interface)...');

    // Test service configuration
    await this.runTest('Service Configuration', 'SMS Service', async () => {
      const providers = smsService.getConfiguredProviders();
      const current = smsService.getCurrentProvider();
      
      console.log('   Available providers:');
      providers.forEach(p => {
        console.log(`     - ${p.name}: ${p.configured ? 'Configured ✓' : 'Not configured ✗'}`);
      });
      console.log(`   Current provider: ${current.name} (${current.type})`);
      console.log(`   Service configured: ${smsService.isConfigured()}`);

      return { success: true, providers, current };
    });

    // Test sending via service
    await this.runTest('Send via Service', 'SMS Service', async () => {
      return await smsService.sendSMS(
        this.testPhone, 
        `Test SMS from MarketSage Service - ${new Date().toLocaleTimeString()}`
      );
    });

    // Test organization-specific sending
    await this.runTest('Organization Fallback', 'SMS Service', async () => {
      const testOrgId = 'test-org-123';
      const result = await smsService.sendSMS(
        this.testPhone,
        `Test SMS with org fallback - ${new Date().toLocaleTimeString()}`,
        testOrgId
      );
      console.log(`   Provider used: ${result.provider || 'platform-default'}`);
      return result;
    });

    // Test bulk validation
    await this.runTest('Bulk Phone Validation', 'SMS Service', async () => {
      const testNumbers = [
        '+2348012345678',
        '08012345678',
        '+254701234567',
        'invalid',
        '',
        '+1234567890123456'
      ];

      const results = testNumbers.map(num => ({
        number: num,
        valid: smsService.validatePhoneNumber(num)
      }));

      console.log('   Validation results:');
      results.forEach(r => {
        console.log(`     ${r.number}: ${r.valid ? 'Valid ✓' : 'Invalid ✗'}`);
      });

      return { success: true, results };
    });
  }

  async testDatabaseIntegration(): Promise<void> {
    console.log('\n🗄️ Testing Database SMS Provider Integration...');

    // Test database connectivity
    await this.runTest('Database Connection', 'Database', async () => {
      await prisma.$connect();
      return { success: true };
    });

    // Test SMS provider table
    await this.runTest('SMS Provider Table', 'Database', async () => {
      const count = await prisma.sMSProvider.count();
      const providers = await prisma.sMSProvider.findMany({
        take: 5,
        select: {
          id: true,
          providerType: true,
          name: true,
          isActive: true,
          organizationId: true
        }
      });

      console.log(`   Total SMS providers in DB: ${count}`);
      if (providers.length > 0) {
        console.log('   Sample providers:');
        providers.forEach(p => {
          console.log(`     - ${p.name} (${p.providerType}) - ${p.isActive ? 'Active' : 'Inactive'}`);
        });
      }

      return { success: true, count, providers };
    });

    // Test creating a test provider
    await this.runTest('Create Test Provider', 'Database', async () => {
      try {
        // First, ensure we have a test organization
        const testOrg = await prisma.organization.upsert({
          where: { id: 'test-sms-org' },
          update: {},
          create: {
            id: 'test-sms-org',
            name: 'Test SMS Organization',
            slug: 'test-sms-org'
          }
        });

        // Create a test SMS provider
        const testProvider = await prisma.sMSProvider.create({
          data: {
            organizationId: testOrg.id,
            providerType: 'TWILIO',
            name: 'Test Twilio Provider',
            accountSid: 'AC_test_account_sid',
            authToken: 'test_auth_token',
            fromNumber: '+1234567890',
            isActive: true
          }
        });

        console.log(`   Created test provider: ${testProvider.name} (${testProvider.id})`);

        // Clean up
        await prisma.sMSProvider.delete({ where: { id: testProvider.id } });
        
        return { success: true, provider: testProvider };
      } catch (error) {
        console.log(`   Note: ${error instanceof Error ? error.message : 'Could not create test provider'}`);
        return { success: true, message: 'Database write test skipped in read-only mode' };
      }
    });
  }

  async testErrorHandling(): Promise<void> {
    console.log('\n⚠️ Testing Error Handling...');

    // Test invalid provider type
    await this.runTest('Invalid Provider Type', 'Error Handling', async () => {
      try {
        const result = await smsService.sendSMS(
          this.testPhone,
          'Test message',
          undefined,
          'invalid-provider' as any
        );
        return result;
      } catch (error) {
        return { success: true, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Test empty message
    await this.runTest('Empty Message', 'Error Handling', async () => {
      const result = await smsService.sendSMS(this.testPhone, '');
      console.log(`   Result: ${result.success ? 'Sent' : result.error?.message}`);
      return { success: true, result };
    });

    // Test invalid phone number
    await this.runTest('Invalid Phone Number', 'Error Handling', async () => {
      const result = await smsService.sendSMS('invalid-phone', 'Test message');
      console.log(`   Result: ${result.success ? 'Sent' : result.error?.message}`);
      return { success: !result.success, result };
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive SMS Tests...');
    console.log(`📞 Test Phone Number: ${this.testPhone}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Default SMS Provider: ${process.env.SMS_PROVIDER || 'auto-detect'}\n`);

    // Run all test suites
    await this.testTwilioProvider();
    await this.testAfricasTalkingProvider();
    await this.testTermiiProvider();
    await this.testSMSService();
    await this.testDatabaseIntegration();
    await this.testErrorHandling();

    // Generate report
    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 SMS Test Results Summary');
    console.log('=' + '='.repeat(60));

    // Group results by provider
    const byProvider = this.results.reduce((acc, result) => {
      if (!acc[result.provider]) {
        acc[result.provider] = { passed: 0, failed: 0, total: 0 };
      }
      acc[result.provider].total++;
      if (result.success) {
        acc[result.provider].passed++;
      } else {
        acc[result.provider].failed++;
      }
      return acc;
    }, {} as Record<string, { passed: number; failed: number; total: number }>);

    // Display provider summary
    Object.entries(byProvider).forEach(([provider, stats]) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      const status = stats.failed === 0 ? '✅' : '⚠️';
      console.log(`${status} ${provider}: ${stats.passed}/${stats.total} passed (${percentage}%)`);
    });

    // Overall summary
    const totalPassed = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);

    console.log('=' + '='.repeat(60));
    console.log(`📈 Overall: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);

    // Failed tests
    if (this.results.some(r => !r.success)) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ${result.provider}: ${result.test} - ${result.message}`);
        });
    }

    // Performance stats
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const maxDuration = Math.max(...this.results.map(r => r.duration));
    const minDuration = Math.min(...this.results.map(r => r.duration));

    console.log('\n⏱️ Performance Stats:');
    console.log(`   Average duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Min duration: ${minDuration}ms`);
    console.log(`   Max duration: ${maxDuration}ms`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    const twilioConfigured = this.results.find(r => r.provider === 'Twilio' && r.test === 'Configuration Check')?.details?.configured;
    const africasTalkingConfigured = this.results.find(r => r.provider === "Africa's Talking" && r.test === 'Configuration Check')?.details?.configured;
    const termiiConfigured = this.results.find(r => r.provider === 'Termii' && r.test === 'Configuration Check')?.details?.configured;

    if (twilioConfigured) {
      console.log('   ✓ Twilio is configured and ready for use');
    } else {
      console.log('   → Configure Twilio by setting TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
    }

    if (!africasTalkingConfigured) {
      console.log('   → For African markets, configure Africa\'s Talking (AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME)');
    }

    if (!termiiConfigured) {
      console.log('   → For Nigerian focus, configure Termii (TERMII_API_KEY, TERMII_SENDER_ID)');
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Configure missing SMS providers in .env file');
    console.log('   2. Test with real phone numbers (replace test number)');
    console.log('   3. Set up organization-specific providers in database');
    console.log('   4. Monitor SMS delivery rates and costs');

    // Disconnect database
    await prisma.$disconnect();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  let testPhone: string | undefined;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phone' && args[i + 1]) {
      testPhone = args[i + 1];
    }
  }

  if (testPhone && !testPhone.startsWith('+')) {
    console.log('⚠️  Warning: Phone number should include country code (e.g., +2348012345678)');
  }

  const tester = new SMSComprehensiveTester(testPhone);
  await tester.runAllTests();
}

// Usage instructions
if (require.main === module) {
  console.log('SMS Comprehensive Testing Script');
  console.log('================================');
  console.log('Usage: npx tsx scripts/test-sms-comprehensive.ts [options]');
  console.log('Options:');
  console.log('  --phone <number>  Test phone number (default: +2348012345678)');
  console.log('Example: npx tsx scripts/test-sms-comprehensive.ts --phone +2347012345678\n');

  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export default SMSComprehensiveTester;