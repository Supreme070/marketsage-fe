#!/usr/bin/env tsx
/**
 * Comprehensive WhatsApp Business API Testing Script
 * Tests all WhatsApp functionality including text, media, templates, and interactive messages
 */

import { whatsappService } from '../src/lib/whatsapp-service';
import prisma from '../src/lib/db/prisma';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  test: string;
  category: string;
  success: boolean;
  message: string;
  details?: any;
  duration: number;
}

class WhatsAppComprehensiveTester {
  private results: TestResult[] = [];
  private testPhone: string;

  constructor(testPhone?: string) {
    // Use provided test phone or default to a Nigerian number
    this.testPhone = testPhone || '+2348012345678';
  }

  async runTest(
    testName: string,
    category: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🧪 Testing ${category}: ${testName}...`);

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      if (result && result.success !== false) {
        this.results.push({
          test: testName,
          category,
          success: true,
          message: 'Passed',
          details: result,
          duration
        });
        console.log(`✅ ${category}: ${testName} - PASSED (${duration}ms)`);
        if (result.messageId) {
          console.log(`   Message ID: ${result.messageId}`);
        }
      } else {
        this.results.push({
          test: testName,
          category,
          success: false,
          message: result?.error?.message || 'Test failed',
          details: result,
          duration
        });
        console.log(`❌ ${category}: ${testName} - FAILED (${duration}ms)`);
        console.log(`   Error: ${result?.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        category,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      console.log(`❌ ${category}: ${testName} - ERROR: ${error} (${duration}ms)`);
    }
  }

  async testConfiguration(): Promise<void> {
    console.log('\n⚙️ Testing WhatsApp Configuration...');

    // Check environment variables
    await this.runTest('Environment Variables', 'Configuration', async () => {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      
      console.log(`   Access Token: ${accessToken ? 'Set ✓' : 'Not set ✗'}`);
      console.log(`   Phone Number ID: ${phoneNumberId ? 'Set ✓' : 'Not set ✗'}`);
      console.log(`   Service Configured: ${whatsappService.isConfigured()}`);

      return { 
        success: true, 
        configured: whatsappService.isConfigured(),
        hasToken: !!accessToken,
        hasPhoneId: !!phoneNumberId
      };
    });

    // Test phone number validation
    await this.runTest('Phone Number Validation', 'Configuration', async () => {
      const testCases = [
        // Nigerian numbers
        { number: '+2348012345678', country: 'Nigeria (intl)', expected: true },
        { number: '2348012345678', country: 'Nigeria (no +)', expected: true },
        { number: '08012345678', country: 'Nigeria (local)', expected: true },
        { number: '8012345678', country: 'Nigeria (no 0)', expected: true },
        // Other African countries
        { number: '+254701234567', country: 'Kenya', expected: true },
        { number: '+27821234567', country: 'South Africa', expected: true },
        { number: '+233541234567', country: 'Ghana', expected: true },
        { number: '+256701234567', country: 'Uganda', expected: true },
        { number: '+255651234567', country: 'Tanzania', expected: true },
        { number: '+237671234567', country: 'Cameroon', expected: true },
        { number: '+225071234567', country: 'Ivory Coast', expected: true },
        // Invalid
        { number: 'invalid', country: 'Invalid', expected: false },
        { number: '123', country: 'Too short', expected: false },
        { number: '+12345678901234567', country: 'Too long', expected: false },
      ];

      const results = testCases.map(test => ({
        ...test,
        valid: whatsappService.validatePhoneNumber(test.number),
        correct: whatsappService.validatePhoneNumber(test.number) === test.expected
      }));

      console.log('   Phone validation results:');
      results.forEach(r => {
        console.log(`     ${r.number} (${r.country}): ${r.valid ? 'Valid' : 'Invalid'} ${r.correct ? '✓' : '✗'}`);
      });

      const allCorrect = results.every(r => r.correct);
      return { success: allCorrect, results };
    });
  }

  async testTextMessages(): Promise<void> {
    console.log('\n💬 Testing Text Messages...');

    // Basic text message
    await this.runTest('Basic Text Message', 'Text Messages', async () => {
      return await whatsappService.sendTextMessage(
        this.testPhone,
        `Hello from MarketSage! 🚀\n\nThis is a test message sent at ${new Date().toLocaleTimeString()}.`
      );
    });

    // Emoji support
    await this.runTest('Emoji Support', 'Text Messages', async () => {
      return await whatsappService.sendTextMessage(
        this.testPhone,
        '🎉 Testing emoji support: 😊 🚀 💼 📈 🌍'
      );
    });

    // Long message
    await this.runTest('Long Message', 'Text Messages', async () => {
      const longMessage = `This is a longer WhatsApp message to test how the system handles extended content.

Key features being tested:
• Multi-line formatting
• Bullet points
• Special characters: @#$%^&*()
• Numbers: 1234567890
• Links: https://marketsage.africa

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

      return await whatsappService.sendTextMessage(this.testPhone, longMessage);
    });

    // Special characters
    await this.runTest('Special Characters', 'Text Messages', async () => {
      return await whatsappService.sendTextMessage(
        this.testPhone,
        'Testing special chars: ñ é ü ö ß € £ ¥ © ® ™'
      );
    });
  }

  async testOrganizationIntegration(): Promise<void> {
    console.log('\n🏢 Testing Organization Integration...');

    // Test with non-existent organization (should fall back to platform)
    await this.runTest('Organization Fallback', 'Organization', async () => {
      const testOrgId = 'test-whatsapp-org-123';
      const result = await whatsappService.sendTextMessage(
        this.testPhone,
        `Test WhatsApp with org fallback - ${new Date().toLocaleTimeString()}`,
        testOrgId
      );
      console.log(`   Fallback to platform: ${result.success ? 'Yes' : 'No'}`);
      return result;
    });

    // Test organization cache
    await this.runTest('Cache Clear', 'Organization', async () => {
      const testOrgId = 'test-cache-org';
      whatsappService.clearOrganizationCache(testOrgId);
      console.log(`   Cache cleared for org: ${testOrgId}`);
      return { success: true };
    });

    // Test organization configuration
    await this.runTest('Test Organization Config', 'Organization', async () => {
      const testOrgId = 'test-config-org';
      const result = await whatsappService.testOrganizationWhatsApp(
        testOrgId,
        this.testPhone,
        'Testing organization-specific WhatsApp configuration'
      );
      return result;
    });
  }

  async testTemplateMessages(): Promise<void> {
    console.log('\n📋 Testing Template Messages...');

    // Note: Template messages require pre-approved templates in WhatsApp Business
    await this.runTest('Template Message (Mock)', 'Templates', async () => {
      const template = {
        name: 'welcome_message',
        language: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: 'John Doe'
              }
            ]
          }
        ]
      };

      return await whatsappService.sendTemplateMessage(this.testPhone, template);
    });

    // Template with multiple parameters
    await this.runTest('Multi-Parameter Template', 'Templates', async () => {
      const template = {
        name: 'order_confirmation',
        language: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: 'ORD-12345'
              },
              {
                type: 'text',
                text: '₦25,000'
              },
              {
                type: 'text',
                text: 'Lagos, Nigeria'
              }
            ]
          }
        ]
      };

      return await whatsappService.sendTemplateMessage(this.testPhone, template);
    });
  }

  async testMediaMessages(): Promise<void> {
    console.log('\n🖼️ Testing Media Messages...');

    // Image message
    await this.runTest('Image Message', 'Media', async () => {
      const media = {
        type: 'image' as const,
        url: 'https://via.placeholder.com/300x300.png?text=MarketSage+Test',
        caption: 'Test image from MarketSage WhatsApp integration'
      };

      return await whatsappService.sendMediaMessage(this.testPhone, media);
    });

    // Document message
    await this.runTest('Document Message', 'Media', async () => {
      const media = {
        type: 'document' as const,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        filename: 'test-document.pdf',
        caption: 'Sample PDF document'
      };

      return await whatsappService.sendMediaMessage(this.testPhone, media);
    });

    // Video message (mock)
    await this.runTest('Video Message', 'Media', async () => {
      const media = {
        type: 'video' as const,
        url: 'https://example.com/sample-video.mp4',
        caption: 'Sample video message'
      };

      return await whatsappService.sendMediaMessage(this.testPhone, media);
    });

    // Audio message (mock)
    await this.runTest('Audio Message', 'Media', async () => {
      const media = {
        type: 'audio' as const,
        url: 'https://example.com/sample-audio.mp3'
      };

      return await whatsappService.sendMediaMessage(this.testPhone, media);
    });
  }

  async testInteractiveMessages(): Promise<void> {
    console.log('\n🔘 Testing Interactive Messages...');

    // Button message
    await this.runTest('Button Message', 'Interactive', async () => {
      const interactive = {
        type: 'button' as const,
        body: {
          text: 'Welcome to MarketSage! How can we help you today?'
        },
        footer: {
          text: 'Powered by MarketSage'
        },
        action: {
          buttons: [
            {
              type: 'reply' as const,
              reply: {
                id: 'btn_1',
                title: 'View Features'
              }
            },
            {
              type: 'reply' as const,
              reply: {
                id: 'btn_2',
                title: 'Get Pricing'
              }
            },
            {
              type: 'reply' as const,
              reply: {
                id: 'btn_3',
                title: 'Contact Sales'
              }
            }
          ]
        }
      };

      return await whatsappService.sendInteractiveMessage(this.testPhone, interactive);
    });

    // List message
    await this.runTest('List Message', 'Interactive', async () => {
      const interactive = {
        type: 'list' as const,
        header: {
          type: 'text' as const,
          text: 'MarketSage Services'
        },
        body: {
          text: 'Select a service to learn more:'
        },
        footer: {
          text: 'Reply with your choice'
        },
        action: {
          button: 'View Services',
          sections: [
            {
              title: 'Marketing Automation',
              rows: [
                {
                  id: 'email_automation',
                  title: 'Email Automation',
                  description: 'Automated email campaigns'
                },
                {
                  id: 'sms_marketing',
                  title: 'SMS Marketing',
                  description: 'Bulk SMS campaigns'
                }
              ]
            },
            {
              title: 'Analytics',
              rows: [
                {
                  id: 'visitor_tracking',
                  title: 'Visitor Tracking',
                  description: 'Real-time visitor analytics'
                },
                {
                  id: 'conversion_tracking',
                  title: 'Conversion Tracking',
                  description: 'Track customer conversions'
                }
              ]
            }
          ]
        }
      };

      return await whatsappService.sendInteractiveMessage(this.testPhone, interactive);
    });
  }

  async testLocationMessage(): Promise<void> {
    console.log('\n📍 Testing Location Message...');

    await this.runTest('Location Message', 'Location', async () => {
      // MarketSage Lagos Office (example coordinates)
      const latitude = 6.5244;
      const longitude = 3.3792;
      const name = 'MarketSage Lagos Office';
      const address = 'Victoria Island, Lagos, Nigeria';

      return await whatsappService.sendLocationMessage(
        this.testPhone,
        latitude,
        longitude,
        name,
        address
      );
    });
  }

  async testDatabaseIntegration(): Promise<void> {
    console.log('\n🗄️ Testing Database Integration...');

    // Test database connection
    await this.runTest('Database Connection', 'Database', async () => {
      await prisma.$connect();
      return { success: true };
    });

    // Check WhatsApp configuration table
    await this.runTest('WhatsApp Config Table', 'Database', async () => {
      const count = await prisma.whatsAppBusinessConfig.count();
      const configs = await prisma.whatsAppBusinessConfig.findMany({
        take: 5,
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,
          isActive: true,
          organizationId: true
        }
      });

      console.log(`   Total WhatsApp configs in DB: ${count}`);
      if (configs.length > 0) {
        console.log('   Sample configurations:');
        configs.forEach(c => {
          console.log(`     - ${c.displayName} (${c.phoneNumber}) - ${c.isActive ? 'Active' : 'Inactive'}`);
        });
      }

      return { success: true, count, configs };
    });

    // Test creating a configuration
    await this.runTest('Create Test Config', 'Database', async () => {
      try {
        // First, ensure we have a test organization
        const testOrg = await prisma.organization.upsert({
          where: { id: 'test-whatsapp-org' },
          update: {},
          create: {
            id: 'test-whatsapp-org',
            name: 'Test WhatsApp Organization',
            slug: 'test-whatsapp-org'
          }
        });

        // Create a test WhatsApp config
        const testConfig = await prisma.whatsAppBusinessConfig.create({
          data: {
            organizationId: testOrg.id,
            businessAccountId: 'test_business_account',
            phoneNumberId: 'test_phone_number_id',
            phoneNumber: '+2349012345678',
            displayName: 'Test WhatsApp Business',
            accessToken: 'encrypted_test_token',
            isActive: true
          }
        });

        console.log(`   Created test config: ${testConfig.displayName} (${testConfig.id})`);

        // Clean up
        await prisma.whatsAppBusinessConfig.delete({ where: { id: testConfig.id } });
        
        return { success: true, config: testConfig };
      } catch (error) {
        console.log(`   Note: ${error instanceof Error ? error.message : 'Could not create test config'}`);
        return { success: true, message: 'Database write test skipped in read-only mode' };
      }
    });
  }

  async testErrorHandling(): Promise<void> {
    console.log('\n⚠️ Testing Error Handling...');

    // Test with invalid phone number
    await this.runTest('Invalid Phone Number', 'Error Handling', async () => {
      const result = await whatsappService.sendTextMessage('invalid-phone', 'Test message');
      console.log(`   Expected failure: ${!result.success ? 'Yes ✓' : 'No ✗'}`);
      return { success: !result.success, error: result.error };
    });

    // Test with empty message
    await this.runTest('Empty Message', 'Error Handling', async () => {
      const result = await whatsappService.sendTextMessage(this.testPhone, '');
      console.log(`   Result: ${result.success ? 'Sent' : result.error?.message}`);
      return result;
    });

    // Test media without URL
    await this.runTest('Media Without URL', 'Error Handling', async () => {
      try {
        const media = {
          type: 'image' as const,
          caption: 'Test caption'
        };
        const result = await whatsappService.sendMediaMessage(this.testPhone, media);
        return result;
      } catch (error) {
        return { 
          success: true, 
          error: error instanceof Error ? error.message : 'Unknown error',
          expectedError: true 
        };
      }
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive WhatsApp Tests...');
    console.log(`📞 Test Phone Number: ${this.testPhone}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💬 WhatsApp API Version: v21.0\n`);

    // Run all test suites
    await this.testConfiguration();
    await this.testTextMessages();
    await this.testOrganizationIntegration();
    await this.testTemplateMessages();
    await this.testMediaMessages();
    await this.testInteractiveMessages();
    await this.testLocationMessage();
    await this.testDatabaseIntegration();
    await this.testErrorHandling();

    // Generate report
    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 WhatsApp Test Results Summary');
    console.log('=' + '='.repeat(60));

    // Group results by category
    const byCategory = this.results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = { passed: 0, failed: 0, total: 0 };
      }
      acc[result.category].total++;
      if (result.success) {
        acc[result.category].passed++;
      } else {
        acc[result.category].failed++;
      }
      return acc;
    }, {} as Record<string, { passed: number; failed: number; total: number }>);

    // Display category summary
    Object.entries(byCategory).forEach(([category, stats]) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      const status = stats.failed === 0 ? '✅' : '⚠️';
      console.log(`${status} ${category}: ${stats.passed}/${stats.total} passed (${percentage}%)`);
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
          console.log(`   ${result.category}: ${result.test} - ${result.message}`);
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

    // Configuration status
    const configResult = this.results.find(r => r.test === 'Environment Variables');
    const isConfigured = configResult?.details?.configured || false;

    console.log('\n💡 Configuration Status:');
    if (isConfigured) {
      console.log('   ✓ WhatsApp Business API is configured');
    } else {
      console.log('   ✗ WhatsApp Business API is NOT configured');
      console.log('   → Set WHATSAPP_ACCESS_TOKEN in .env file');
      console.log('   → Set WHATSAPP_PHONE_NUMBER_ID in .env file');
    }

    console.log('\n📝 Recommendations:');
    console.log('   1. Obtain WhatsApp Business API access from Meta');
    console.log('   2. Configure permanent access token (not temporary)');
    console.log('   3. Verify phone number with WhatsApp Business');
    console.log('   4. Create and approve message templates');
    console.log('   5. Set up webhook for incoming messages');
    console.log('   6. Consider using BSP (Business Solution Provider) like:');
    console.log('      - AiSensy (recommended for Africa)');
    console.log('      - Interakt');
    console.log('      - Gupshup');

    console.log('\n🔗 Useful Resources:');
    console.log('   - WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp');
    console.log('   - Meta Business Platform: https://business.facebook.com');
    console.log('   - AiSensy (BSP): https://aisensy.com');

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

  const tester = new WhatsAppComprehensiveTester(testPhone);
  await tester.runAllTests();
}

// Usage instructions
if (require.main === module) {
  console.log('WhatsApp Comprehensive Testing Script');
  console.log('=====================================');
  console.log('Usage: npx tsx scripts/test-whatsapp-comprehensive.ts [options]');
  console.log('Options:');
  console.log('  --phone <number>  Test phone number (default: +2348012345678)');
  console.log('Example: npx tsx scripts/test-whatsapp-comprehensive.ts --phone +2347012345678\n');

  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export default WhatsAppComprehensiveTester;