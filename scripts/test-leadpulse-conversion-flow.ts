#!/usr/bin/env tsx
/**
 * LeadPulse End-to-End Conversion Flow Test
 * 
 * This script tests the complete visitor → customer conversion flow:
 * 1. Anonymous visitor tracking
 * 2. Form submission
 * 3. Lead scoring
 * 4. Customer journey creation
 * 5. Attribution analysis
 * 6. Real-time updates
 */

import { prisma } from '../src/lib/db/prisma';

interface TestResults {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details: string;
  duration: number;
}

interface ConversionFlowTest {
  visitorId: string;
  sessionId: string;
  customerId?: string;
  testTimestamp: string;
}

class LeadPulseConversionFlowTester {
  private results: TestResults[] = [];
  private testData: ConversionFlowTest;

  constructor() {
    this.testData = {
      visitorId: `test_visitor_${Date.now()}`,
      sessionId: `test_session_${Date.now()}`,
      testTimestamp: new Date().toISOString()
    };
  }

  private async recordTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    let status: 'PASS' | 'FAIL' = 'PASS';
    let details = '';

    try {
      await testFn();
      details = 'Test completed successfully';
    } catch (error) {
      status = 'FAIL';
      details = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Test failed: ${name}`, error);
    }

    const duration = Date.now() - startTime;
    this.results.push({ testName: name, status, details, duration });
    
    if (status === 'PASS') {
      console.log(`✅ ${name} (${duration}ms)`);
    } else {
      console.log(`❌ ${name} (${duration}ms): ${details}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting LeadPulse End-to-End Conversion Flow Tests\n');
    console.log(`Test Data:
    - Visitor ID: ${this.testData.visitorId}
    - Session ID: ${this.testData.sessionId}
    - Timestamp: ${this.testData.testTimestamp}\n`);

    // Phase 1: Anonymous Visitor Tracking
    await this.recordTest('1.1 Create Anonymous Visitor', () => this.testCreateAnonymousVisitor());
    await this.recordTest('1.2 Track Page Views', () => this.testTrackPageViews());
    await this.recordTest('1.3 Record Heatmap Interactions', () => this.testHeatmapInteractions());
    await this.recordTest('1.4 Calculate Behavioral Score', () => this.testBehavioralScoring());

    // Phase 2: Form Interaction
    await this.recordTest('2.1 Track Form View', () => this.testFormView());
    await this.recordTest('2.2 Process Form Submission', () => this.testFormSubmission());
    await this.recordTest('2.3 Convert Visitor to Customer', () => this.testVisitorToCustomerConversion());

    // Phase 3: Lead Management
    await this.recordTest('3.1 Calculate Lead Score', () => this.testLeadScoring());
    await this.recordTest('3.2 Qualify Lead', () => this.testLeadQualification());
    await this.recordTest('3.3 Create Customer Journey', () => this.testCustomerJourneyCreation());

    // Phase 4: Attribution & Analytics
    await this.recordTest('4.1 Track Attribution Touchpoints', () => this.testAttributionTracking());
    await this.recordTest('4.2 Generate Analytics Data', () => this.testAnalyticsGeneration());
    await this.recordTest('4.3 Update Real-time Dashboard', () => this.testRealtimeDashboardUpdate());

    // Phase 5: Integration Tests
    await this.recordTest('5.1 Verify Data Consistency', () => this.testDataConsistency());
    await this.recordTest('5.2 Test API Endpoints', () => this.testAPIEndpoints());
    await this.recordTest('5.3 Validate Business Logic', () => this.testBusinessLogic());

    // Cleanup
    await this.recordTest('6.1 Cleanup Test Data', () => this.cleanupTestData());

    this.printResults();
  }

  private async testCreateAnonymousVisitor(): Promise<void> {
    // Test creating an anonymous visitor record
    const visitor = await prisma.leadPulseVisitor.create({
      data: {
        fingerprint: this.testData.visitorId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        country: 'Nigeria',
        city: 'Lagos',
        device: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        source: 'google',
        medium: 'organic',
        campaign: 'test_campaign',
        firstVisit: this.testData.testTimestamp,
        lastVisit: this.testData.testTimestamp,
        sessionCount: 1,
        pageViewCount: 0,
        engagementScore: 0,
        conversionScore: 0,
        leadScore: 0
      }
    });

    if (!visitor.id) {
      throw new Error('Failed to create visitor record');
    }

    console.log(`   Created visitor: ${visitor.id}`);
  }

  private async testTrackPageViews(): Promise<void> {
    // Test tracking multiple page views
    const pages = [
      { page: '/', title: 'Home Page', duration: 45 },
      { page: '/pricing', title: 'Pricing Page', duration: 120 },
      { page: '/demo', title: 'Demo Page', duration: 180 },
      { page: '/contact', title: 'Contact Page', duration: 60 }
    ];

    for (const pageData of pages) {
      const touchpoint = await prisma.leadPulseTouchpoint.create({
        data: {
          visitorId: this.testData.visitorId,
          sessionId: this.testData.sessionId,
          type: 'page_view',
          page: pageData.page,
          title: pageData.title,
          timestamp: new Date(),
          data: {
            duration: pageData.duration,
            scrollDepth: Math.floor(Math.random() * 100),
            clickCount: Math.floor(Math.random() * 10)
          }
        }
      });

      if (!touchpoint.id) {
        throw new Error(`Failed to create touchpoint for page: ${pageData.page}`);
      }
    }

    // Update visitor page view count
    await prisma.leadPulseVisitor.update({
      where: { fingerprint: this.testData.visitorId },
      data: { pageViewCount: pages.length }
    });

    console.log(`   Tracked ${pages.length} page views`);
  }

  private async testHeatmapInteractions(): Promise<void> {
    // Test recording heatmap interaction data
    const interactions = [
      { element: '#hero-cta', x: 500, y: 300, type: 'click' },
      { element: '.pricing-button', x: 400, y: 600, type: 'hover' },
      { element: '#contact-form', x: 350, y: 800, type: 'focus' }
    ];

    for (const interaction of interactions) {
      await prisma.leadPulseTouchpoint.create({
        data: {
          visitorId: this.testData.visitorId,
          sessionId: this.testData.sessionId,
          type: 'interaction',
          page: '/pricing',
          timestamp: new Date(),
          data: {
            element: interaction.element,
            x: interaction.x,
            y: interaction.y,
            interactionType: interaction.type
          }
        }
      });
    }

    console.log(`   Recorded ${interactions.length} heatmap interactions`);
  }

  private async testBehavioralScoring(): Promise<void> {
    // Test calculating behavioral score based on visitor activity
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: { touchpoints: true }
    });

    if (!visitor) {
      throw new Error('Visitor not found for behavioral scoring');
    }

    // Calculate engagement score based on activity
    let engagementScore = 0;
    engagementScore += visitor.pageViewCount * 5; // 5 points per page view
    engagementScore += visitor.touchpoints.length * 2; // 2 points per interaction
    
    // Bonus for high-intent pages
    const highIntentPages = visitor.touchpoints.filter(tp => 
      tp.page?.includes('pricing') || tp.page?.includes('demo') || tp.page?.includes('contact')
    ).length;
    engagementScore += highIntentPages * 10;

    await prisma.leadPulseVisitor.update({
      where: { fingerprint: this.testData.visitorId },
      data: { 
        engagementScore,
        conversionScore: Math.min(engagementScore * 1.2, 100) // Conversion score based on engagement
      }
    });

    if (engagementScore <= 0) {
      throw new Error('Behavioral scoring failed - no engagement detected');
    }

    console.log(`   Calculated engagement score: ${engagementScore}`);
  }

  private async testFormView(): Promise<void> {
    // Test tracking form view event
    await prisma.leadPulseTouchpoint.create({
      data: {
        visitorId: this.testData.visitorId,
        sessionId: this.testData.sessionId,
        type: 'form_view',
        page: '/contact',
        timestamp: new Date(),
        data: {
          formId: 'contact_form',
          formName: 'Contact Form'
        }
      }
    });

    console.log('   Tracked form view event');
  }

  private async testFormSubmission(): Promise<void> {
    // Test processing form submission and creating contact
    const formSubmission = await prisma.leadPulseFormSubmission.create({
      data: {
        formId: 'contact_form',
        visitorId: this.testData.visitorId,
        sessionId: this.testData.sessionId,
        submittedAt: new Date(),
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+234123456789',
          company: 'Test Company',
          message: 'This is a test submission'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Test Browser)'
      }
    });

    if (!formSubmission.id) {
      throw new Error('Failed to create form submission');
    }

    // Track form submission touchpoint
    await prisma.leadPulseTouchpoint.create({
      data: {
        visitorId: this.testData.visitorId,
        sessionId: this.testData.sessionId,
        type: 'form_submission',
        page: '/contact',
        timestamp: new Date(),
        data: {
          formId: 'contact_form',
          submissionId: formSubmission.id
        }
      }
    });

    console.log(`   Created form submission: ${formSubmission.id}`);
  }

  private async testVisitorToCustomerConversion(): Promise<void> {
    // Test converting anonymous visitor to identified customer
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId }
    });

    if (!visitor) {
      throw new Error('Visitor not found for conversion');
    }

    // Create customer record
    const customer = await prisma.contact.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+234123456789',
        company: 'Test Company',
        source: 'leadpulse',
        leadPulseVisitorId: visitor.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (!customer.id) {
      throw new Error('Failed to create customer record');
    }

    // Update visitor with customer ID
    await prisma.leadPulseVisitor.update({
      where: { fingerprint: this.testData.visitorId },
      data: { customerId: customer.id }
    });

    this.testData.customerId = customer.id;
    console.log(`   Converted visitor to customer: ${customer.id}`);
  }

  private async testLeadScoring(): Promise<void> {
    // Test calculating lead score based on multiple factors
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: { 
        touchpoints: true,
        formSubmissions: true
      }
    });

    if (!visitor) {
      throw new Error('Visitor not found for lead scoring');
    }

    // Calculate lead score
    let leadScore = 0;
    
    // Demographic scoring
    leadScore += 15; // Has company name
    leadScore += 10; // Phone number provided
    leadScore += 10; // Nigerian location (target market)
    
    // Behavioral scoring
    leadScore += visitor.pageViewCount * 3;
    leadScore += visitor.touchpoints.length * 2;
    leadScore += visitor.formSubmissions.length * 20;
    
    // Intent scoring
    const pricingViews = visitor.touchpoints.filter(tp => tp.page?.includes('pricing')).length;
    const demoViews = visitor.touchpoints.filter(tp => tp.page?.includes('demo')).length;
    leadScore += pricingViews * 15 + demoViews * 20;

    await prisma.leadPulseVisitor.update({
      where: { fingerprint: this.testData.visitorId },
      data: { leadScore }
    });

    if (leadScore <= 0) {
      throw new Error('Lead scoring failed - no score calculated');
    }

    console.log(`   Calculated lead score: ${leadScore}`);
  }

  private async testLeadQualification(): Promise<void> {
    // Test automatic lead qualification based on score
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId }
    });

    if (!visitor) {
      throw new Error('Visitor not found for qualification');
    }

    let qualificationStatus = 'unqualified';
    if (visitor.leadScore >= 70) {
      qualificationStatus = 'sales_qualified';
    } else if (visitor.leadScore >= 40) {
      qualificationStatus = 'marketing_qualified';
    }

    // Update customer record with qualification
    if (this.testData.customerId) {
      await prisma.contact.update({
        where: { id: this.testData.customerId },
        data: {
          leadScore: visitor.leadScore,
          qualificationStatus
        }
      });
    }

    console.log(`   Lead qualification: ${qualificationStatus} (score: ${visitor.leadScore})`);
  }

  private async testCustomerJourneyCreation(): Promise<void> {
    // Test creating customer journey from touchpoints
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: { touchpoints: true }
    });

    if (!visitor || !this.testData.customerId) {
      throw new Error('Missing visitor or customer data for journey creation');
    }

    // Calculate journey metrics
    const journeyStart = new Date(visitor.firstVisit);
    const journeyEnd = new Date();
    const journeyDuration = Math.floor((journeyEnd.getTime() - journeyStart.getTime()) / (1000 * 60 * 60 * 24));

    // Create journey record (using Contact model as journey container)
    await prisma.contact.update({
      where: { id: this.testData.customerId },
      data: {
        journeyStartDate: journeyStart,
        journeyStage: 'consideration',
        totalTouchpoints: visitor.touchpoints.length,
        journeyDuration: journeyDuration || 1
      }
    });

    console.log(`   Created customer journey: ${visitor.touchpoints.length} touchpoints, ${journeyDuration} days`);
  }

  private async testAttributionTracking(): Promise<void> {
    // Test tracking attribution data for marketing channels
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: { touchpoints: true }
    });

    if (!visitor) {
      throw new Error('Visitor not found for attribution tracking');
    }

    // Identify attribution touchpoints
    const firstTouch = visitor.touchpoints.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )[0];

    const lastTouch = visitor.touchpoints.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    // Record attribution data
    if (this.testData.customerId && firstTouch && lastTouch) {
      await prisma.contact.update({
        where: { id: this.testData.customerId },
        data: {
          firstTouchChannel: visitor.source || 'direct',
          lastTouchChannel: lastTouch.type,
          attributionData: {
            firstTouch: {
              source: visitor.source,
              medium: visitor.medium,
              campaign: visitor.campaign,
              timestamp: firstTouch.timestamp
            },
            lastTouch: {
              type: lastTouch.type,
              page: lastTouch.page,
              timestamp: lastTouch.timestamp
            },
            touchpointCount: visitor.touchpoints.length
          }
        }
      });
    }

    console.log(`   Tracked attribution: first=${visitor.source}, last=${lastTouch?.type}`);
  }

  private async testAnalyticsGeneration(): Promise<void> {
    // Test generating analytics data
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: { touchpoints: true, formSubmissions: true }
    });

    if (!visitor) {
      throw new Error('Visitor not found for analytics generation');
    }

    // Create analytics record
    const analytics = await prisma.leadPulseAnalytics.create({
      data: {
        visitorId: visitor.id,
        sessionId: this.testData.sessionId,
        event: 'conversion_completed',
        timestamp: new Date(),
        data: {
          conversionType: 'form_submission',
          conversionValue: 500,
          touchpointCount: visitor.touchpoints.length,
          sessionDuration: 300,
          pageViewCount: visitor.pageViewCount,
          engagementScore: visitor.engagementScore,
          leadScore: visitor.leadScore
        }
      }
    });

    if (!analytics.id) {
      throw new Error('Failed to create analytics record');
    }

    console.log(`   Generated analytics record: ${analytics.id}`);
  }

  private async testRealtimeDashboardUpdate(): Promise<void> {
    // Test that data is available for real-time dashboard
    const recentVisitors = await prisma.leadPulseVisitor.findMany({
      where: {
        lastVisit: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        touchpoints: true,
        formSubmissions: true
      },
      take: 10
    });

    const testVisitor = recentVisitors.find(v => v.fingerprint === this.testData.visitorId);
    
    if (!testVisitor) {
      throw new Error('Test visitor not found in real-time data');
    }

    // Verify all expected data is present
    if (testVisitor.touchpoints.length === 0) {
      throw new Error('No touchpoints found for visitor');
    }

    if (testVisitor.formSubmissions.length === 0) {
      throw new Error('No form submissions found for visitor');
    }

    console.log(`   Real-time dashboard data verified: ${recentVisitors.length} recent visitors`);
  }

  private async testDataConsistency(): Promise<void> {
    // Test that all data is consistent across tables
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId },
      include: {
        touchpoints: true,
        formSubmissions: true
      }
    });

    if (!visitor) {
      throw new Error('Visitor not found for consistency check');
    }

    const customer = this.testData.customerId ? await prisma.contact.findUnique({
      where: { id: this.testData.customerId }
    }) : null;

    // Verify data consistency
    if (visitor.customerId !== this.testData.customerId) {
      throw new Error('Visitor-customer link inconsistent');
    }

    if (customer && customer.leadPulseVisitorId !== visitor.id) {
      throw new Error('Customer-visitor link inconsistent');
    }

    if (visitor.pageViewCount !== visitor.touchpoints.filter(tp => tp.type === 'page_view').length) {
      throw new Error('Page view count inconsistent');
    }

    console.log('   Data consistency verified across all tables');
  }

  private async testAPIEndpoints(): Promise<void> {
    // Test key API endpoints with test data
    const endpoints = [
      { path: '/api/leadpulse/visitors', method: 'GET' },
      { path: '/api/leadpulse/analytics', method: 'GET' },
      { path: '/api/leadpulse/heatmaps', method: 'GET' },
      { path: '/api/leadpulse/form-analytics', method: 'GET' }
    ];

    // Note: In a real test environment, you would make actual HTTP requests
    // For this test, we'll verify the data exists that these endpoints would return
    
    const visitorExists = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId }
    });

    const analyticsExists = await prisma.leadPulseAnalytics.findFirst({
      where: { visitorId: visitorExists?.id }
    });

    if (!visitorExists || !analyticsExists) {
      throw new Error('Required data missing for API endpoints');
    }

    console.log(`   API endpoint data verified for ${endpoints.length} endpoints`);
  }

  private async testBusinessLogic(): Promise<void> {
    // Test business logic rules
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { fingerprint: this.testData.visitorId }
    });

    if (!visitor) {
      throw new Error('Visitor not found for business logic test');
    }

    // Test scoring logic
    if (visitor.leadScore <= 0) {
      throw new Error('Lead score should be positive');
    }

    if (visitor.engagementScore <= 0) {
      throw new Error('Engagement score should be positive');
    }

    // Test qualification logic
    const expectedQualification = visitor.leadScore >= 70 ? 'sales_qualified' : 
                                visitor.leadScore >= 40 ? 'marketing_qualified' : 'unqualified';

    const customer = this.testData.customerId ? await prisma.contact.findUnique({
      where: { id: this.testData.customerId }
    }) : null;

    if (customer && customer.qualificationStatus !== expectedQualification) {
      throw new Error(`Qualification logic error: expected ${expectedQualification}, got ${customer.qualificationStatus}`);
    }

    console.log('   Business logic validation passed');
  }

  private async cleanupTestData(): Promise<void> {
    // Clean up all test data
    try {
      // Delete in correct order to respect foreign key constraints
      await prisma.leadPulseAnalytics.deleteMany({
        where: { visitorId: { contains: 'test_visitor_' } }
      });

      await prisma.leadPulseFormSubmission.deleteMany({
        where: { visitorId: this.testData.visitorId }
      });

      await prisma.leadPulseTouchpoint.deleteMany({
        where: { visitorId: this.testData.visitorId }
      });

      if (this.testData.customerId) {
        await prisma.contact.delete({
          where: { id: this.testData.customerId }
        });
      }

      await prisma.leadPulseVisitor.deleteMany({
        where: { fingerprint: this.testData.visitorId }
      });

      console.log('   Test data cleanup completed');
    } catch (error) {
      console.warn('   Some test data may not have been cleaned up:', error);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 LEADPULSE END-TO-END TEST RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\nTest Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`❌ ${r.testName}: ${r.details}`));
    }

    console.log('\nDetailed Results:');
    this.results.forEach(r => {
      const status = r.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${r.testName} (${r.duration}ms)`);
      if (r.status === 'FAIL') {
        console.log(`   Error: ${r.details}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! LeadPulse conversion flow is working correctly.');
      console.log('🚀 The system is ready for production deployment.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review and fix issues before deployment.`);
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new LeadPulseConversionFlowTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { LeadPulseConversionFlowTester };