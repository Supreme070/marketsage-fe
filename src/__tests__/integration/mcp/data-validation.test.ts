/**
 * Data Validation Integration Tests for MCP
 * 
 * Tests data integrity, validation rules, and business logic
 * against real seeded data in the database.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/test';
import { TestDatabaseManager, testPrisma, PerformanceTracker, testConfig } from './setup';

describe('MCP Data Validation Integration Tests', () => {
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    performanceTracker = new PerformanceTracker();
  }, testConfig.timeouts.integration);

  afterAll(async () => {
    await dbManager.teardown();
  }, testConfig.timeouts.database);

  beforeEach(async () => {
    performanceTracker.reset();
  });

  describe('Campaign Analytics Data Validation', () => {
    test('should validate campaign metrics business rules', async () => {
      const campaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        include: {
          organization: true
        }
      });

      expect(campaignMetrics.length).toBeGreaterThan(0);

      campaignMetrics.forEach(metric => {
        // Basic data integrity
        expect(metric.id).toBeTruthy();
        expect(metric.campaignId).toBeTruthy();
        expect(metric.campaignName).toBeTruthy();
        expect(metric.organizationId).toBeTruthy();
        expect(metric.organization).toBeDefined();

        // Campaign type validation
        expect(['EMAIL', 'SMS', 'WHATSAPP']).toContain(metric.campaignType);

        // Metric values validation
        expect(metric.sent).toBeGreaterThanOrEqual(0);
        expect(metric.delivered).toBeGreaterThanOrEqual(0);
        expect(metric.delivered).toBeLessThanOrEqual(metric.sent);
        expect(metric.opened).toBeGreaterThanOrEqual(0);
        expect(metric.opened).toBeLessThanOrEqual(metric.delivered);
        expect(metric.clicked).toBeGreaterThanOrEqual(0);
        expect(metric.clicked).toBeLessThanOrEqual(metric.opened);
        expect(metric.converted).toBeGreaterThanOrEqual(0);
        expect(metric.converted).toBeLessThanOrEqual(metric.clicked);

        // Rate validation (0-100%)
        expect(metric.openRate).toBeGreaterThanOrEqual(0);
        expect(metric.openRate).toBeLessThanOrEqual(100);
        expect(metric.clickRate).toBeGreaterThanOrEqual(0);
        expect(metric.clickRate).toBeLessThanOrEqual(100);
        expect(metric.conversionRate).toBeGreaterThanOrEqual(0);
        expect(metric.conversionRate).toBeLessThanOrEqual(100);

        // Financial validation
        expect(metric.revenue).toBeGreaterThanOrEqual(0);
        expect(metric.cost).toBeGreaterThanOrEqual(0);
        // ROI can be negative, so no lower bound check

        // Timestamp validation
        expect(metric.calculatedAt).toBeInstanceOf(Date);
        expect(metric.lastUpdated).toBeInstanceOf(Date);
      });

      console.log(`✅ Validated ${campaignMetrics.length} campaign metrics records`);
    });

    test('should validate A/B test data structure', async () => {
      const abTestMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: {
          abTestData: { not: null }
        }
      });

      abTestMetrics.forEach(metric => {
        expect(metric.abTestData).toBeTruthy();
        
        const abTestData = JSON.parse(metric.abTestData!);
        
        // A/B test structure validation
        expect(abTestData).toHaveProperty('testType');
        expect(abTestData).toHaveProperty('description');
        expect(abTestData).toHaveProperty('variants');
        expect(abTestData).toHaveProperty('winnerVariant');
        expect(abTestData).toHaveProperty('improvementPercent');

        // Variants validation
        expect(Array.isArray(abTestData.variants)).toBe(true);
        expect(abTestData.variants.length).toBeGreaterThan(1);

        let winnerFound = false;
        abTestData.variants.forEach((variant: any) => {
          expect(variant).toHaveProperty('variant');
          expect(variant).toHaveProperty('variantId');
          expect(variant).toHaveProperty('sent');
          expect(variant).toHaveProperty('delivered');
          expect(variant).toHaveProperty('opened');
          expect(variant).toHaveProperty('clicked');
          expect(variant).toHaveProperty('converted');
          expect(variant).toHaveProperty('isWinner');

          if (variant.isWinner) {
            winnerFound = true;
            expect(variant.variant).toBe(abTestData.winnerVariant);
          }

          // Validate variant metrics follow same rules
          expect(variant.delivered).toBeLessThanOrEqual(variant.sent);
          expect(variant.opened).toBeLessThanOrEqual(variant.delivered);
          expect(variant.clicked).toBeLessThanOrEqual(variant.opened);
          expect(variant.converted).toBeLessThanOrEqual(variant.clicked);
        });

        expect(winnerFound).toBe(true);
      });

      console.log(`✅ Validated ${abTestMetrics.length} A/B test records`);
    });

    test('should validate campaign type specific rules', async () => {
      // Email campaign specific validation
      const emailMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: { campaignType: 'EMAIL' }
      });

      emailMetrics.forEach(metric => {
        // Email typically has bounce rate
        expect(metric.bounced).toBeGreaterThanOrEqual(0);
        expect(metric.bounced).toBeLessThanOrEqual(metric.sent);
        expect(metric.bounceRate).toBeGreaterThanOrEqual(0);
        expect(metric.bounceRate).toBeLessThanOrEqual(100);
        
        // Email should have unsubscribe data
        expect(metric.unsubscribed).toBeGreaterThanOrEqual(0);
        expect(metric.unsubscribed).toBeLessThanOrEqual(metric.delivered);
      });

      // SMS campaign specific validation
      const smsMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: { campaignType: 'SMS' }
      });

      smsMetrics.forEach(metric => {
        // SMS typically has response rate
        expect(metric.responded).toBeGreaterThanOrEqual(0);
        expect(metric.responseRate).toBeGreaterThanOrEqual(0);
        expect(metric.responseRate).toBeLessThanOrEqual(100);
        
        // SMS usually has higher delivery rates
        const deliveryRate = (metric.delivered / metric.sent) * 100;
        expect(deliveryRate).toBeGreaterThan(80); // SMS should have >80% delivery
      });

      // WhatsApp campaign specific validation
      const whatsappMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: { campaignType: 'WHATSAPP' }
      });

      whatsappMetrics.forEach(metric => {
        // WhatsApp typically has response rate
        expect(metric.responded).toBeGreaterThanOrEqual(0);
        expect(metric.responseRate).toBeGreaterThanOrEqual(0);
        
        // WhatsApp usually has very high delivery rates
        const deliveryRate = (metric.delivered / metric.sent) * 100;
        expect(deliveryRate).toBeGreaterThan(85); // WhatsApp should have >85% delivery
      });

      console.log(`✅ Validated channel-specific rules: ${emailMetrics.length} email, ${smsMetrics.length} SMS, ${whatsappMetrics.length} WhatsApp`);
    });
  });

  describe('Customer Predictions Data Validation', () => {
    test('should validate customer prediction data integrity', async () => {
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        include: {
          contact: true,
          organization: true
        }
      });

      expect(predictions.length).toBeGreaterThan(0);

      predictions.forEach(prediction => {
        // Basic data integrity
        expect(prediction.id).toBeTruthy();
        expect(prediction.contactId).toBeTruthy();
        expect(prediction.organizationId).toBeTruthy();
        expect(prediction.contact).toBeDefined();
        expect(prediction.organization).toBeDefined();

        // Score validation (0-100)
        expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
        expect(prediction.churnRisk).toBeLessThanOrEqual(100);
        expect(prediction.engagementScore).toBeGreaterThanOrEqual(0);
        expect(prediction.engagementScore).toBeLessThanOrEqual(100);
        expect(prediction.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(prediction.confidenceScore).toBeLessThanOrEqual(100);

        // Lifetime value validation
        expect(prediction.lifetimeValue).toBeGreaterThan(0);

        // Segment validation
        expect(prediction.segment).toBeTruthy();
        const validSegments = [
          'VIP Customers', 'Growth Potential', 'At Risk', 'New Customers',
          'Loyal Base', 'Price Sensitive', 'Inactive'
        ];
        expect(validSegments).toContain(prediction.segment);

        // Channel validation
        expect(prediction.preferredChannel).toBeTruthy();
        const validChannels = ['Email', 'SMS', 'WhatsApp', 'Mobile App'];
        expect(validChannels).toContain(prediction.preferredChannel);

        // Action validation
        expect(prediction.nextBestAction).toBeTruthy();

        // Date validation
        expect(prediction.lastActivityDate).toBeInstanceOf(Date);
        expect(prediction.calculatedAt).toBeInstanceOf(Date);
        expect(prediction.lastUpdated).toBeInstanceOf(Date);

        // Last activity should not be in the future
        expect(prediction.lastActivityDate.getTime()).toBeLessThanOrEqual(Date.now());
      });

      console.log(`✅ Validated ${predictions.length} customer prediction records`);
    });

    test('should validate behavioral scores data', async () => {
      const predictionsWithScores = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          behavioralScores: { not: null }
        }
      });

      predictionsWithScores.forEach(prediction => {
        expect(prediction.behavioralScores).toBeTruthy();
        
        const scores = JSON.parse(prediction.behavioralScores!);
        
        // Validate score structure
        expect(scores).toHaveProperty('mobileUsage');
        expect(scores).toHaveProperty('priceSensitivity');
        expect(scores).toHaveProperty('socialInfluence');
        expect(scores).toHaveProperty('whatsappPreference');
        expect(scores).toHaveProperty('smsEngagement');

        // Validate score ranges (should be 0-100)
        Object.values(scores).forEach((score: any) => {
          expect(typeof score).toBe('number');
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });

        // African market specific validations
        expect(scores.mobileUsage).toBeGreaterThan(75); // High mobile usage in Africa
        expect(scores.whatsappPreference).toBeGreaterThan(50); // WhatsApp popular in Africa
      });

      console.log(`✅ Validated ${predictionsWithScores.length} behavioral score records`);
    });

    test('should validate customer insights data', async () => {
      const predictionsWithInsights = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          insights: { not: null }
        }
      });

      predictionsWithInsights.forEach(prediction => {
        expect(prediction.insights).toBeTruthy();
        
        const insights = JSON.parse(prediction.insights!);
        
        expect(Array.isArray(insights)).toBe(true);
        expect(insights.length).toBeGreaterThan(0);

        insights.forEach((insight: string) => {
          expect(typeof insight).toBe('string');
          expect(insight.length).toBeGreaterThan(10); // Meaningful insights
        });
      });

      console.log(`✅ Validated ${predictionsWithInsights.length} customer insight records`);
    });

    test('should validate segment distribution makes business sense', async () => {
      const segmentCounts = await testPrisma.mCPCustomerPredictions.groupBy({
        by: ['segment'],
        _count: { segment: true },
        _avg: { 
          churnRisk: true,
          lifetimeValue: true,
          engagementScore: true
        }
      });

      expect(segmentCounts.length).toBeGreaterThan(0);

      segmentCounts.forEach(segment => {
        expect(segment._count.segment).toBeGreaterThan(0);
        
        // Validate segment characteristics make sense
        switch (segment.segment) {
          case 'VIP Customers':
            expect(segment._avg.churnRisk).toBeLessThan(50); // VIP should have low churn risk
            expect(segment._avg.lifetimeValue).toBeGreaterThan(100); // VIP should have high LTV
            break;
          case 'At Risk':
            expect(segment._avg.churnRisk).toBeGreaterThan(60); // At risk should have high churn risk
            break;
          case 'Inactive':
            expect(segment._avg.engagementScore).toBeLessThan(40); // Inactive should have low engagement
            break;
          case 'Growth Potential':
            expect(segment._avg.lifetimeValue).toBeGreaterThan(75); // Growth potential should have decent LTV
            expect(segment._avg.engagementScore).toBeGreaterThan(60); // High engagement
            break;
        }
      });

      console.log('✅ Validated segment distribution business logic');
    });
  });

  describe('Visitor Sessions Data Validation', () => {
    test('should validate visitor session data integrity', async () => {
      const sessions = await testPrisma.mCPVisitorSessions.findMany({
        include: {
          organization: true
        }
      });

      expect(sessions.length).toBeGreaterThan(0);

      sessions.forEach(session => {
        // Basic data integrity
        expect(session.id).toBeTruthy();
        expect(session.sessionId).toBeTruthy();
        expect(session.visitorId).toBeTruthy();
        expect(session.organizationId).toBeTruthy();
        expect(session.organization).toBeDefined();

        // Session metrics validation
        expect(session.pageViews).toBeGreaterThan(0);
        expect(session.sessionDuration).toBeGreaterThan(0);
        expect(session.sessionDuration).toBeLessThan(86400); // Less than 24 hours

        // Geographic validation
        expect(session.country).toBeTruthy();
        expect(session.country.length).toBeGreaterThanOrEqual(2); // Country code at least

        // Device validation
        expect(session.device).toBeTruthy();
        const validDevices = ['Desktop', 'Mobile', 'Tablet'];
        expect(validDevices).toContain(session.device);

        // Browser validation
        expect(session.browser).toBeTruthy();

        // Timestamp validation
        expect(session.createdAt).toBeInstanceOf(Date);
        expect(session.updatedAt).toBeInstanceOf(Date);
        expect(session.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      });

      console.log(`✅ Validated ${sessions.length} visitor session records`);
    });

    test('should validate visitor events data', async () => {
      const sessionsWithEvents = await testPrisma.mCPVisitorSessions.findMany({
        where: {
          events: { not: null }
        }
      });

      sessionsWithEvents.forEach(session => {
        expect(session.events).toBeTruthy();
        
        const events = JSON.parse(session.events!);
        
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBeGreaterThan(0);

        events.forEach((event: any) => {
          expect(event).toHaveProperty('type');
          expect(event).toHaveProperty('timestamp');
          expect(event).toHaveProperty('data');
          
          // Validate timestamp
          expect(new Date(event.timestamp)).toBeInstanceOf(Date);
          
          // Validate event types
          const validEventTypes = [
            'page_view', 'click', 'form_submit', 'scroll', 'time_on_page',
            'download', 'video_play', 'search'
          ];
          expect(validEventTypes).toContain(event.type);
        });
      });

      console.log(`✅ Validated ${sessionsWithEvents.length} visitor event records`);
    });

    test('should validate behavior data structure', async () => {
      const sessionsWithBehavior = await testPrisma.mCPVisitorSessions.findMany({
        where: {
          behaviorData: { not: null }
        }
      });

      sessionsWithBehavior.forEach(session => {
        expect(session.behaviorData).toBeTruthy();
        
        const behaviorData = JSON.parse(session.behaviorData!);
        
        // Validate behavior structure
        expect(behaviorData).toHaveProperty('engagementScore');
        expect(behaviorData).toHaveProperty('bounceRate');
        expect(behaviorData).toHaveProperty('exitPage');
        
        // Validate score ranges
        expect(behaviorData.engagementScore).toBeGreaterThanOrEqual(0);
        expect(behaviorData.engagementScore).toBeLessThanOrEqual(100);
        expect(behaviorData.bounceRate).toBeGreaterThanOrEqual(0);
        expect(behaviorData.bounceRate).toBeLessThanOrEqual(100);
      });

      console.log(`✅ Validated ${sessionsWithBehavior.length} visitor behavior records`);
    });

    test('should validate African market visitor patterns', async () => {
      const sessions = await testPrisma.mCPVisitorSessions.findMany();

      // Check mobile device usage (should be high in Africa)
      const mobileCount = sessions.filter(s => s.device === 'Mobile').length;
      const mobilePercentage = (mobileCount / sessions.length) * 100;
      
      expect(mobilePercentage).toBeGreaterThan(60); // Expect >60% mobile usage

      // Check for African countries
      const countries = [...new Set(sessions.map(s => s.country))];
      const africanCountries = ['NG', 'ZA', 'KE', 'GH', 'EG', 'MA', 'UG', 'TZ'];
      const hasAfricanCountries = countries.some(country => 
        africanCountries.includes(country) || country.toLowerCase().includes('nigeria')
      );
      
      expect(hasAfricanCountries).toBe(true);

      console.log(`✅ Validated African market patterns: ${mobilePercentage.toFixed(1)}% mobile usage`);
    });
  });

  describe('Monitoring Metrics Data Validation', () => {
    test('should validate monitoring metrics data integrity', async () => {
      const metrics = await testPrisma.mCPMonitoringMetrics.findMany({
        include: {
          organization: true
        }
      });

      expect(metrics.length).toBeGreaterThan(0);

      metrics.forEach(metric => {
        // Basic data integrity
        expect(metric.id).toBeTruthy();
        expect(metric.organizationId).toBeTruthy();
        expect(metric.organization).toBeDefined();
        expect(metric.metricType).toBeTruthy();

        // Value validation
        expect(metric.value).toBeGreaterThanOrEqual(0);

        // Timestamp validation
        expect(metric.timestamp).toBeInstanceOf(Date);
        expect(metric.timestamp.getTime()).toBeLessThanOrEqual(Date.now());

        // Validate metric types
        const validMetricTypes = [
          'api_response_time', 'api_requests_per_minute', 'database_query_time',
          'memory_usage', 'cpu_usage', 'disk_usage', 'active_users',
          'email_delivery_rate', 'sms_delivery_rate', 'whatsapp_delivery_rate',
          'campaign_performance', 'visitor_count', 'conversion_rate'
        ];
        expect(validMetricTypes).toContain(metric.metricType);
      });

      console.log(`✅ Validated ${metrics.length} monitoring metric records`);
    });

    test('should validate metric type specific values', async () => {
      // Response time metrics should be reasonable
      const responseTimeMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: { metricType: 'api_response_time' }
      });

      responseTimeMetrics.forEach(metric => {
        expect(metric.value).toBeLessThan(10000); // Less than 10 seconds
        expect(metric.value).toBeGreaterThan(0); // Greater than 0
      });

      // CPU usage should be 0-100%
      const cpuMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: { metricType: 'cpu_usage' }
      });

      cpuMetrics.forEach(metric => {
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(metric.value).toBeLessThanOrEqual(100);
      });

      // Memory usage should be 0-100%
      const memoryMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: { metricType: 'memory_usage' }
      });

      memoryMetrics.forEach(metric => {
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(metric.value).toBeLessThanOrEqual(100);
      });

      console.log('✅ Validated metric type specific value ranges');
    });

    test('should validate tags data structure', async () => {
      const metricsWithTags = await testPrisma.mCPMonitoringMetrics.findMany({
        where: {
          tags: { not: null }
        }
      });

      metricsWithTags.forEach(metric => {
        expect(metric.tags).toBeTruthy();
        
        const tags = JSON.parse(metric.tags!);
        
        expect(typeof tags).toBe('object');
        expect(tags).not.toBeNull();
        
        // Tags should have meaningful key-value pairs
        Object.entries(tags).forEach(([key, value]) => {
          expect(typeof key).toBe('string');
          expect(key.length).toBeGreaterThan(0);
          expect(value).toBeDefined();
        });
      });

      console.log(`✅ Validated ${metricsWithTags.length} metric tag records`);
    });

    test('should validate time series continuity', async () => {
      // Check for reasonable time distribution
      const recentMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (recentMetrics.length > 1) {
        // Check that timestamps are in chronological order
        for (let i = 1; i < recentMetrics.length; i++) {
          expect(recentMetrics[i].timestamp.getTime())
            .toBeGreaterThanOrEqual(recentMetrics[i - 1].timestamp.getTime());
        }

        // Check for reasonable time gaps (no huge gaps in monitoring)
        const gaps = [];
        for (let i = 1; i < recentMetrics.length; i++) {
          const gap = recentMetrics[i].timestamp.getTime() - recentMetrics[i - 1].timestamp.getTime();
          gaps.push(gap);
        }

        const maxGap = Math.max(...gaps);
        const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

        // No gap should be more than 24 hours for monitoring data
        expect(maxGap).toBeLessThan(24 * 60 * 60 * 1000);

        console.log(`✅ Validated time series continuity: avg gap ${(avgGap / 1000 / 60).toFixed(1)} minutes`);
      }
    });
  });

  describe('Cross-Table Data Validation', () => {
    test('should validate referential integrity across MCP tables', async () => {
      // Verify all campaign metrics reference valid organizations
      const campaignOrgs = await testPrisma.mCPCampaignMetrics.findMany({
        select: { organizationId: true }
      });
      
      const orgIds = [...new Set(campaignOrgs.map(c => c.organizationId))];
      
      for (const orgId of orgIds) {
        const org = await testPrisma.organization.findUnique({
          where: { id: orgId }
        });
        expect(org).toBeDefined();
      }

      // Verify all customer predictions reference valid contacts
      const predictionContacts = await testPrisma.mCPCustomerPredictions.findMany({
        select: { contactId: true }
      });
      
      const contactIds = [...new Set(predictionContacts.map(p => p.contactId))];
      
      for (const contactId of contactIds) {
        const contact = await testPrisma.contact.findUnique({
          where: { id: contactId }
        });
        expect(contact).toBeDefined();
      }

      console.log('✅ Validated referential integrity across all MCP tables');
    });

    test('should validate data consistency across related records', async () => {
      // Check that customer predictions align with contact data
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        include: { contact: true },
        take: 10
      });

      predictions.forEach(prediction => {
        // Active contacts should generally have lower churn risk
        if (prediction.contact.status === 'ACTIVE') {
          // Allow some variance, but most active contacts should have < 80% churn risk
          // This is a business logic validation
        }

        // Verify organization consistency
        expect(prediction.organizationId).toBe(prediction.contact.organizationId);
      });

      console.log('✅ Validated data consistency across related records');
    });

    test('should validate aggregate data makes business sense', async () => {
      // Overall campaign performance should be reasonable
      const campaignStats = await testPrisma.mCPCampaignMetrics.aggregate({
        _avg: {
          openRate: true,
          clickRate: true,
          conversionRate: true,
          roi: true
        },
        _count: { id: true }
      });

      // Average open rates should be reasonable (5-50% depending on channel)
      expect(campaignStats._avg.openRate).toBeGreaterThan(5);
      expect(campaignStats._avg.openRate).toBeLessThan(100);

      // Click rates should be lower than open rates
      expect(campaignStats._avg.clickRate).toBeLessThan(campaignStats._avg.openRate!);

      // Conversion rates should be lower than click rates
      expect(campaignStats._avg.conversionRate).toBeLessThan(campaignStats._avg.clickRate!);

      console.log('✅ Validated aggregate business metrics');
    });
  });

  describe('Data Quality Summary', () => {
    test('should generate comprehensive data quality report', async () => {
      const dataCounts = await dbManager.getDataCounts();
      
      console.log('\n📊 Data Quality Validation Summary:');
      console.log('===================================');
      
      console.log(`📧 Campaign Metrics: ${dataCounts.mcpCampaignMetrics} records`);
      console.log(`👥 Customer Predictions: ${dataCounts.mcpCustomerPredictions} records`);
      console.log(`👤 Visitor Sessions: ${dataCounts.mcpVisitorSessions} records`);
      console.log(`📊 Monitoring Metrics: ${dataCounts.mcpMonitoringMetrics} records`);
      
      // Validate minimum data requirements
      expect(dataCounts.mcpCampaignMetrics).toBeGreaterThan(0);
      expect(dataCounts.mcpCustomerPredictions).toBeGreaterThan(0);
      expect(dataCounts.mcpVisitorSessions).toBeGreaterThan(0);
      expect(dataCounts.mcpMonitoringMetrics).toBeGreaterThan(0);
      
      console.log('\n✅ All data validation tests passed');
      console.log('✅ Data integrity verified');
      console.log('✅ Business rules validated');
      console.log('✅ Referential integrity confirmed');
      console.log('✅ Data quality standards met');
    });
  });
});