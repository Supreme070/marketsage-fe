#!/usr/bin/env tsx
/**
 * End-to-End Provider Integration Test Script
 * Tests all BYOP implementations and platform fallbacks in real environment
 */

import { emailService } from '../src/lib/email-providers/email-service';
import { smsService } from '../src/lib/sms-providers/sms-service';
import { whatsappService } from '../src/lib/whatsapp-service';
import { unifiedMessagingService } from '../src/lib/messaging/unified-messaging-service';
import prisma from '../src/lib/db/prisma';

interface TestResult {
  service: string;
  test: string;
  success: boolean;
  message: string;
  duration: number;
}

class ProviderIntegrationTester {
  private results: TestResult[] = [];

  async runTest(
    serviceName: string, 
    testName: string, 
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`🧪 Testing ${serviceName}: ${testName}...`);

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      if (result && result.success !== false) {
        this.results.push({
          service: serviceName,
          test: testName,
          success: true,
          message: 'Passed',
          duration
        });
        console.log(`✅ ${serviceName}: ${testName} - PASSED (${duration}ms)`);
      } else {
        this.results.push({
          service: serviceName,
          test: testName,
          success: false,
          message: result?.error?.message || 'Test failed',
          duration
        });
        console.log(`❌ ${serviceName}: ${testName} - FAILED (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        service: serviceName,
        test: testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      console.log(`❌ ${serviceName}: ${testName} - ERROR: ${error} (${duration}ms)`);
    }
  }

  async testSMSProvider(): Promise<void> {
    console.log('\n📱 Testing SMS Provider Integration...');

    // Test platform default SMS
    await this.runTest('SMS', 'Platform Default SMS', async () => {
      return await smsService.sendSMS('+2348012345678', 'Test SMS from MarketSage platform');
    });

    // Test SMS provider configuration
    await this.runTest('SMS', 'Provider Configuration Check', async () => {
      const providers = smsService.getConfiguredProviders();
      const current = smsService.getCurrentProvider();
      console.log(`  Available providers: ${providers.map(p => `${p.name} (${p.configured ? 'configured' : 'not configured'})`).join(', ')}`);
      console.log(`  Current provider: ${current.name}`);
      return { success: true };
    });

    // Test phone number validation
    await this.runTest('SMS', 'Phone Number Validation', async () => {
      const validTests = [
        '+2348012345678',
        '08012345678', 
        '2348012345678',
        '+254701234567', // Kenya
        '+27821234567'   // South Africa
      ];
      
      const invalidTests = [
        'invalid',
        '123',
        '+1234567890123456', // Too long
        ''
      ];

      const validResults = validTests.map(num => smsService.validatePhoneNumber(num));
      const invalidResults = invalidTests.map(num => smsService.validatePhoneNumber(num));

      const allValidPassed = validResults.every(result => result === true);
      const allInvalidFailed = invalidResults.every(result => result === false);

      return { 
        success: allValidPassed && allInvalidFailed,
        validResults,
        invalidResults
      };
    });

    // Test organization SMS fallback
    await this.runTest('SMS', 'Organization Fallback', async () => {
      const testOrgId = 'non-existent-org-123';
      return await smsService.sendSMS('+2348012345678', 'Test fallback SMS', testOrgId);
    });
  }

  async testEmailProvider(): Promise<void> {
    console.log('\n📧 Testing Email Provider Integration...');

    // Test platform default email
    await this.runTest('Email', 'Platform Default Email', async () => {
      return await emailService.sendEmail('test-org', {
        to: 'test@example.com',
        from: 'noreply@marketsage.africa',
        subject: 'Test Email from MarketSage Platform',
        html: '<h1>Test Email</h1><p>This is a test email from MarketSage platform.</p>',
        text: 'Test Email - This is a test email from MarketSage platform.'
      });
    });

    // Test email provider types
    await this.runTest('Email', 'Available Provider Types', async () => {
      const providers = emailService.getAvailableProviders();
      console.log(`  Available email providers: ${providers.join(', ')}`);
      return { success: providers.length > 0 };
    });

    // Test email provider validation
    await this.runTest('Email', 'Provider Configuration Validation', async () => {
      const tests = [
        { type: 'sendgrid', config: { apiKey: 'test' }, expected: true },
        { type: 'mailgun', config: { apiKey: 'test', domain: 'test.com' }, expected: true },
        { type: 'smtp', config: { smtpHost: 'smtp.test.com', smtpUsername: 'user', smtpPassword: 'pass' }, expected: true },
        { type: 'sendgrid', config: {}, expected: false },
        { type: 'mailgun', config: { apiKey: 'test' }, expected: false }, // Missing domain
      ];

      const results = tests.map(test => {
        const result = emailService.validateProviderConfig(test.type as any, test.config);
        return result === test.expected;
      });

      return { success: results.every(r => r === true) };
    });

    // Test organization email fallback
    await this.runTest('Email', 'Organization Fallback', async () => {
      const testOrgId = 'non-existent-org-123';
      return await emailService.sendEmail(testOrgId, {
        to: 'test@example.com',
        from: 'noreply@marketsage.africa',
        subject: 'Test Fallback Email',
        html: '<p>Test fallback email</p>',
        text: 'Test fallback email'
      });
    });
  }

  async testWhatsAppProvider(): Promise<void> {
    console.log('\n💬 Testing WhatsApp Provider Integration...');

    // Test platform default WhatsApp
    await this.runTest('WhatsApp', 'Platform Default WhatsApp', async () => {
      return await whatsappService.sendTextMessage('+2348012345678', 'Test WhatsApp message from MarketSage platform');
    });

    // Test WhatsApp configuration check
    await this.runTest('WhatsApp', 'Configuration Check', async () => {
      const isConfigured = whatsappService.isConfigured();
      console.log(`  WhatsApp configured: ${isConfigured}`);
      return { success: true, configured: isConfigured };
    });

    // Test WhatsApp phone number validation
    await this.runTest('WhatsApp', 'Phone Number Validation', async () => {
      const validTests = [
        '+2348012345678',  // Nigeria
        '08012345678',     // Nigeria local
        '+254701234567',   // Kenya
        '+27821234567',    // South Africa
        '+233541234567',   // Ghana
      ];
      
      const invalidTests = [
        'invalid',
        '123',
        '+1234567890123456', // Too long
        '',
        '1234' // Too short
      ];

      const validResults = validTests.map(num => whatsappService.validatePhoneNumber(num));
      const invalidResults = invalidTests.map(num => whatsappService.validatePhoneNumber(num));

      const allValidPassed = validResults.every(result => result === true);
      const allInvalidFailed = invalidResults.every(result => result === false);

      console.log(`  Valid numbers: ${validTests.map((num, i) => `${num}: ${validResults[i]}`).join(', ')}`);
      console.log(`  Invalid numbers: ${invalidTests.map((num, i) => `${num}: ${invalidResults[i]}`).join(', ')}`);

      return { 
        success: allValidPassed && allInvalidFailed,
        validResults,
        invalidResults
      };
    });

    // Test organization WhatsApp fallback
    await this.runTest('WhatsApp', 'Organization Fallback', async () => {
      const testOrgId = 'non-existent-org-123';
      return await whatsappService.sendTextMessage('+2348012345678', 'Test fallback WhatsApp message', testOrgId);
    });
  }

  async testUnifiedMessagingService(): Promise<void> {
    console.log('\n🔗 Testing Unified Messaging Service...');

    const testOrgId = 'test-unified-org-123';

    // Test unified SMS
    await this.runTest('Unified Messaging', 'SMS Channel', async () => {
      return await unifiedMessagingService.sendMessage({
        to: '+2348012345678',
        content: 'Test SMS via unified service',
        channel: 'sms',
        organizationId: testOrgId
      });
    });

    // Test unified Email
    await this.runTest('Unified Messaging', 'Email Channel', async () => {
      return await unifiedMessagingService.sendMessage({
        to: 'test@example.com',
        content: '<p>Test email via unified service</p>',
        channel: 'email',
        organizationId: testOrgId
      });
    });

    // Test unified WhatsApp
    await this.runTest('Unified Messaging', 'WhatsApp Channel', async () => {
      return await unifiedMessagingService.sendMessage({
        to: '+2348012345678',
        content: 'Test WhatsApp via unified service',
        channel: 'whatsapp',
        organizationId: testOrgId
      });
    });

    // Test credit balance
    await this.runTest('Unified Messaging', 'Credit Balance Check', async () => {
      const balance = await unifiedMessagingService.getCreditBalance(testOrgId);
      console.log(`  Credit balance for org ${testOrgId}: ${balance}`);
      return { success: true, balance };
    });

    // Test bulk messaging
    await this.runTest('Unified Messaging', 'Bulk Message Sending', async () => {
      const requests = [
        {
          to: '+2348012345678',
          content: 'Bulk test message 1',
          channel: 'sms' as const,
          organizationId: testOrgId
        },
        {
          to: 'test1@example.com',
          content: 'Bulk test email 1',
          channel: 'email' as const,
          organizationId: testOrgId
        }
      ];

      const results = await unifiedMessagingService.bulkSendMessages(requests);
      const successCount = results.filter(r => r.success).length;
      
      console.log(`  Bulk send: ${successCount}/${results.length} successful`);
      
      return { 
        success: successCount > 0,
        results: results.length,
        successful: successCount
      };
    });
  }

  async testDatabaseConnectivity(): Promise<void> {
    console.log('\n🗄️  Testing Database Connectivity...');

    await this.runTest('Database', 'Connection Test', async () => {
      await prisma.$connect();
      return { success: true };
    });

    await this.runTest('Database', 'Provider Tables Check', async () => {
      // Check if provider tables exist by trying to count records
      const smsCount = await prisma.sMSProvider.count();
      const emailCount = await prisma.emailProvider.count();
      const whatsappCount = await prisma.whatsAppBusinessConfig.count();

      console.log(`  SMS Providers: ${smsCount}`);
      console.log(`  Email Providers: ${emailCount}`);
      console.log(`  WhatsApp Configs: ${whatsappCount}`);

      return { success: true, counts: { sms: smsCount, email: emailCount, whatsapp: whatsappCount } };
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Provider Integration Tests...\n');

    await this.testDatabaseConnectivity();
    await this.testSMSProvider();
    await this.testEmailProvider();
    await this.testWhatsAppProvider();
    await this.testUnifiedMessagingService();

    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 Test Results Summary:');
    console.log('=' + '='.repeat(80));

    const byService = this.results.reduce((acc, result) => {
      if (!acc[result.service]) {
        acc[result.service] = { passed: 0, failed: 0, total: 0 };
      }
      acc[result.service].total++;
      if (result.success) {
        acc[result.service].passed++;
      } else {
        acc[result.service].failed++;
      }
      return acc;
    }, {} as Record<string, { passed: number; failed: number; total: number }>);

    Object.entries(byService).forEach(([service, stats]) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      const status = stats.failed === 0 ? '✅' : '⚠️';
      console.log(`${status} ${service}: ${stats.passed}/${stats.total} passed (${percentage}%)`);
    });

    const totalPassed = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);

    console.log('=' + '='.repeat(80));
    console.log(`📈 Overall: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);

    if (this.results.some(r => !r.success)) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ${result.service}: ${result.test} - ${result.message}`);
        });
    }

    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    console.log(`⏱️  Average test duration: ${avgDuration.toFixed(0)}ms`);

    await prisma.$disconnect();
  }
}

// Run the tests
async function main() {
  const tester = new ProviderIntegrationTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export default ProviderIntegrationTester;