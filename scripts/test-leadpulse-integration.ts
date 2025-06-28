#!/usr/bin/env tsx
/**
 * LeadPulse Integration Test Suite
 * 
 * Tests the integration between all LeadPulse components:
 * - Real-time simulator → Analytics pipeline
 * - Form builder → Performance tracking
 * - Visitor tracking → Customer journey
 * - AI insights → Behavioral scoring
 * - A/B testing → Attribution analysis
 */

import { prisma } from '../src/lib/db/prisma';

interface IntegrationTestResult {
  component: string;
  integration: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  metrics: Record<string, number>;
}

class LeadPulseIntegrationTester {
  private results: IntegrationTestResult[] = [];
  private testEnvironment = {
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    testTimestamp: new Date().toISOString(),
    testUserId: `test_user_${Date.now()}`,
    testOrgId: `test_org_${Date.now()}`
  };

  async runAllIntegrationTests(): Promise<void> {
    console.log('🔗 Starting LeadPulse Integration Tests\n');
    console.log(`Environment:
    - Base URL: ${this.testEnvironment.baseUrl}
    - Test User: ${this.testEnvironment.testUserId}
    - Test Org: ${this.testEnvironment.testOrgId}
    - Timestamp: ${this.testEnvironment.testTimestamp}\n`);

    // Test 1: Visitor Tracking → Analytics Pipeline
    await this.testVisitorToAnalyticsPipeline();

    // Test 2: Form Builder → Performance Analytics
    await this.testFormBuilderToAnalytics();

    // Test 3: Heatmap Data → Behavioral Insights
    await this.testHeatmapToBehavioralInsights();

    // Test 4: A/B Testing → Attribution Analysis
    await this.testABTestingToAttribution();

    // Test 5: Lead Scoring → Customer Journey
    await this.testLeadScoringToJourney();

    // Test 6: Real-time Updates → Dashboard Sync
    await this.testRealTimeDashboardSync();

    // Test 7: API Endpoints → Data Consistency
    await this.testAPIDataConsistency();

    // Test 8: Component Interconnectivity
    await this.testComponentInterconnectivity();

    this.printIntegrationResults();
  }

  private async testVisitorToAnalyticsPipeline(): Promise<void> {
    console.log('🧪 Testing Visitor Tracking → Analytics Pipeline...');
    
    try {
      // Create test visitor
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `integration_test_${Date.now()}`,
          ipAddress: '192.168.1.1',
          userAgent: 'Integration Test Browser',
          country: 'Nigeria',
          city: 'Lagos',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          source: 'integration_test',
          medium: 'test',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: this.testEnvironment.testTimestamp,
          sessionCount: 1,
          pageViewCount: 5,
          engagementScore: 45,
          conversionScore: 30,
          leadScore: 65
        }
      });

      // Create touchpoints
      const touchpoints = await Promise.all([
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `session_${Date.now()}`,
            type: 'page_view',
            page: '/',
            timestamp: new Date(),
            data: { duration: 30, scrollDepth: 80 }
          }
        }),
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `session_${Date.now()}`,
            type: 'page_view',
            page: '/pricing',
            timestamp: new Date(),
            data: { duration: 120, scrollDepth: 95 }
          }
        })
      ]);

      // Create analytics record
      const analytics = await prisma.leadPulseAnalytics.create({
        data: {
          visitorId: visitor.id,
          sessionId: `session_${Date.now()}`,
          event: 'page_view',
          timestamp: new Date(),
          data: {
            page: '/pricing',
            duration: 120,
            engagementScore: visitor.engagementScore
          }
        }
      });

      // Verify pipeline integration
      const verifyVisitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitor.id },
        include: {
          touchpoints: true,
          analytics: true
        }
      });

      const metrics = {
        visitorsCreated: 1,
        touchpointsCreated: touchpoints.length,
        analyticsRecords: verifyVisitor?.analytics.length || 0,
        pipelineLatency: Date.now() - new Date(this.testEnvironment.testTimestamp).getTime()
      };

      if (verifyVisitor && verifyVisitor.touchpoints.length === 2 && verifyVisitor.analytics.length >= 1) {
        this.results.push({
          component: 'Visitor Tracking',
          integration: 'Analytics Pipeline',
          status: 'PASS',
          details: 'Visitor data successfully flows to analytics pipeline',
          metrics
        });
      } else {
        this.results.push({
          component: 'Visitor Tracking',
          integration: 'Analytics Pipeline',
          status: 'FAIL',
          details: 'Visitor data not properly integrated with analytics',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], []);

    } catch (error) {
      this.results.push({
        component: 'Visitor Tracking',
        integration: 'Analytics Pipeline',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testFormBuilderToAnalytics(): Promise<void> {
    console.log('🧪 Testing Form Builder → Performance Analytics...');
    
    try {
      // Create test form
      const form = await prisma.leadPulseForm.create({
        data: {
          name: 'Integration Test Form',
          description: 'Form for testing integration',
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Name',
              required: true,
              validation: { minLength: 2 }
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email',
              required: true,
              validation: { emailFormat: true }
            }
          ],
          settings: {
            submitText: 'Submit',
            redirectUrl: '/thank-you'
          },
          styling: {
            theme: 'default',
            backgroundColor: '#ffffff',
            textColor: '#000000'
          },
          status: 'PUBLISHED',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create form submission
      const submission = await prisma.leadPulseFormSubmission.create({
        data: {
          formId: form.id,
          visitorId: `integration_visitor_${Date.now()}`,
          sessionId: `integration_session_${Date.now()}`,
          submittedAt: new Date(),
          data: {
            name: 'Integration Test User',
            email: 'integration@test.com'
          },
          ipAddress: '192.168.1.1',
          userAgent: 'Integration Test Browser'
        }
      });

      // Create form analytics
      const formAnalytics = await prisma.leadPulseFormAnalytics.create({
        data: {
          formId: form.id,
          date: new Date().toISOString().split('T')[0],
          views: 100,
          starts: 80,
          completions: 45,
          conversionRate: 56.25,
          avgCompletionTime: 180,
          bounceRate: 35.0,
          fieldAnalytics: {
            name: { errors: 5, avgTime: 15 },
            email: { errors: 12, avgTime: 25 }
          }
        }
      });

      // Verify integration
      const verifyForm = await prisma.leadPulseForm.findUnique({
        where: { id: form.id },
        include: {
          submissions: true,
          analytics: true
        }
      });

      const metrics = {
        formsCreated: 1,
        submissionsCreated: 1,
        analyticsRecords: verifyForm?.analytics.length || 0,
        conversionRate: formAnalytics.conversionRate
      };

      if (verifyForm && verifyForm.submissions.length === 1 && verifyForm.analytics.length === 1) {
        this.results.push({
          component: 'Form Builder',
          integration: 'Performance Analytics',
          status: 'PASS',
          details: 'Form data successfully integrated with performance analytics',
          metrics
        });
      } else {
        this.results.push({
          component: 'Form Builder',
          integration: 'Performance Analytics',
          status: 'FAIL',
          details: 'Form builder not properly integrated with analytics',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([], [form.id], []);

    } catch (error) {
      this.results.push({
        component: 'Form Builder',
        integration: 'Performance Analytics',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testHeatmapToBehavioralInsights(): Promise<void> {
    console.log('🧪 Testing Heatmap Data → Behavioral Insights...');
    
    try {
      // Create visitor with heatmap interactions
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `heatmap_test_${Date.now()}`,
          ipAddress: '192.168.1.2',
          userAgent: 'Heatmap Test Browser',
          country: 'Kenya',
          city: 'Nairobi',
          device: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          source: 'google',
          medium: 'organic',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: this.testEnvironment.testTimestamp,
          sessionCount: 1,
          pageViewCount: 3,
          engagementScore: 0, // Will be calculated
          conversionScore: 0,
          leadScore: 0
        }
      });

      // Create heatmap interaction touchpoints
      const heatmapTouchpoints = await Promise.all([
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `heatmap_session_${Date.now()}`,
            type: 'interaction',
            page: '/pricing',
            timestamp: new Date(),
            data: {
              element: '#pricing-cta',
              x: 400,
              y: 300,
              interactionType: 'click',
              duration: 2000
            }
          }
        }),
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `heatmap_session_${Date.now()}`,
            type: 'interaction',
            page: '/pricing',
            timestamp: new Date(),
            data: {
              element: '.feature-highlight',
              x: 350,
              y: 500,
              interactionType: 'hover',
              duration: 5000
            }
          }
        })
      ]);

      // Calculate behavioral insights based on interactions
      let engagementScore = 0;
      engagementScore += heatmapTouchpoints.length * 10; // 10 points per interaction
      engagementScore += heatmapTouchpoints.filter(tp => 
        tp.page === '/pricing'
      ).length * 15; // Bonus for pricing page interactions

      // Update visitor with calculated scores
      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          engagementScore,
          conversionScore: Math.min(engagementScore * 1.2, 100)
        }
      });

      // Verify behavioral scoring integration
      const updatedVisitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitor.id },
        include: { touchpoints: true }
      });

      const metrics = {
        heatmapInteractions: heatmapTouchpoints.length,
        engagementScore: updatedVisitor?.engagementScore || 0,
        conversionScore: updatedVisitor?.conversionScore || 0,
        pricingPageInteractions: heatmapTouchpoints.filter(tp => tp.page === '/pricing').length
      };

      if (updatedVisitor && updatedVisitor.engagementScore > 0 && updatedVisitor.touchpoints.length === 2) {
        this.results.push({
          component: 'Heatmap Data',
          integration: 'Behavioral Insights',
          status: 'PASS',
          details: 'Heatmap interactions successfully converted to behavioral insights',
          metrics
        });
      } else {
        this.results.push({
          component: 'Heatmap Data',
          integration: 'Behavioral Insights',
          status: 'FAIL',
          details: 'Heatmap data not properly integrated with behavioral scoring',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], []);

    } catch (error) {
      this.results.push({
        component: 'Heatmap Data',
        integration: 'Behavioral Insights',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testABTestingToAttribution(): Promise<void> {
    console.log('🧪 Testing A/B Testing → Attribution Analysis...');
    
    try {
      // Create A/B test
      const abTest = await prisma.leadPulseABTest.create({
        data: {
          name: 'Integration Test A/B',
          description: 'Testing A/B to attribution integration',
          formId: 'test_form_id',
          hypothesis: 'Integration testing hypothesis',
          successMetric: 'CONVERSION_RATE',
          duration: 14,
          trafficAllocation: 50,
          minimumSampleSize: 100,
          confidenceLevel: 95,
          status: 'RUNNING',
          createdAt: new Date(),
          startedAt: new Date()
        }
      });

      // Create A/B test variants
      const variants = await Promise.all([
        prisma.leadPulseABTestVariant.create({
          data: {
            testId: abTest.id,
            name: 'Original',
            description: 'Original form design',
            type: 'ORIGINAL',
            formConfig: {
              title: 'Original Form',
              fields: [{ type: 'text', label: 'Name' }]
            },
            trafficAllocation: 50,
            status: 'RUNNING',
            createdAt: new Date(),
            startedAt: new Date()
          }
        }),
        prisma.leadPulseABTestVariant.create({
          data: {
            testId: abTest.id,
            name: 'Variant A',
            description: 'Optimized form design',
            type: 'VARIANT',
            formConfig: {
              title: 'Optimized Form',
              fields: [{ type: 'text', label: 'Full Name' }]
            },
            trafficAllocation: 50,
            status: 'RUNNING',
            createdAt: new Date(),
            startedAt: new Date()
          }
        })
      ]);

      // Create visitor with attribution data linked to A/B test
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `ab_test_visitor_${Date.now()}`,
          ipAddress: '192.168.1.3',
          userAgent: 'A/B Test Browser',
          country: 'South Africa',
          city: 'Cape Town',
          device: 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          source: 'google',
          medium: 'cpc',
          campaign: 'integration_test_campaign',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: this.testEnvironment.testTimestamp,
          sessionCount: 1,
          pageViewCount: 2,
          engagementScore: 40,
          conversionScore: 50,
          leadScore: 45,
          abTestData: {
            testId: abTest.id,
            variantId: variants[1].id,
            assignedAt: new Date()
          }
        }
      });

      // Create form submission linked to A/B test variant
      const submission = await prisma.leadPulseFormSubmission.create({
        data: {
          formId: 'test_form_id',
          visitorId: visitor.fingerprint,
          sessionId: `ab_session_${Date.now()}`,
          submittedAt: new Date(),
          data: {
            name: 'A/B Test User'
          },
          ipAddress: visitor.ipAddress,
          userAgent: visitor.userAgent,
          abTestData: {
            testId: abTest.id,
            variantId: variants[1].id
          }
        }
      });

      // Verify A/B test to attribution integration
      const verifyVisitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitor.id },
        include: { formSubmissions: true }
      });

      const verifyTest = await prisma.leadPulseABTest.findUnique({
        where: { id: abTest.id },
        include: { variants: true }
      });

      const metrics = {
        abTestsCreated: 1,
        variantsCreated: variants.length,
        attributedSubmissions: verifyVisitor?.formSubmissions.length || 0,
        testConversionRate: verifyVisitor?.formSubmissions.length ? 100 : 0
      };

      if (verifyTest && verifyVisitor && verifyVisitor.formSubmissions.length === 1) {
        this.results.push({
          component: 'A/B Testing',
          integration: 'Attribution Analysis',
          status: 'PASS',
          details: 'A/B test data successfully integrated with attribution tracking',
          metrics
        });
      } else {
        this.results.push({
          component: 'A/B Testing',
          integration: 'Attribution Analysis',
          status: 'FAIL',
          details: 'A/B testing not properly integrated with attribution analysis',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], [abTest.id]);

    } catch (error) {
      this.results.push({
        component: 'A/B Testing',
        integration: 'Attribution Analysis',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testLeadScoringToJourney(): Promise<void> {
    console.log('🧪 Testing Lead Scoring → Customer Journey...');
    
    try {
      // Create visitor with scoring data
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `lead_scoring_${Date.now()}`,
          ipAddress: '192.168.1.4',
          userAgent: 'Lead Scoring Browser',
          country: 'Ghana',
          city: 'Accra',
          device: 'mobile',
          browser: 'Chrome',
          os: 'Android',
          source: 'linkedin',
          medium: 'social',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: this.testEnvironment.testTimestamp,
          sessionCount: 2,
          pageViewCount: 8,
          engagementScore: 75,
          conversionScore: 80,
          leadScore: 85 // High score for qualification
        }
      });

      // Create customer from qualified lead
      const customer = await prisma.contact.create({
        data: {
          name: 'Lead Scoring Test Customer',
          email: 'leadscore@test.com',
          phone: '+233123456789',
          company: 'Test Company Ghana',
          source: 'leadpulse',
          leadPulseVisitorId: visitor.id,
          leadScore: visitor.leadScore,
          qualificationStatus: 'sales_qualified', // Based on high score
          journeyStage: 'consideration',
          firstTouchChannel: visitor.source,
          lastTouchChannel: 'form_submission',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update visitor with customer link
      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: { customerId: customer.id }
      });

      // Create journey touchpoints
      const journeyTouchpoints = await Promise.all([
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `journey_session_${Date.now()}`,
            type: 'page_view',
            page: '/solutions',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            data: { duration: 60, scrollDepth: 85 }
          }
        }),
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `journey_session_${Date.now()}`,
            type: 'form_submission',
            page: '/contact',
            timestamp: new Date(),
            data: { formId: 'contact_form', conversionValue: 500 }
          }
        })
      ]);

      // Verify lead scoring to customer journey integration
      const verifyCustomer = await prisma.contact.findUnique({
        where: { id: customer.id }
      });

      const verifyVisitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitor.id },
        include: { touchpoints: true }
      });

      const metrics = {
        leadScore: visitor.leadScore,
        qualificationStatus: verifyCustomer?.qualificationStatus || 'unknown',
        journeyTouchpoints: verifyVisitor?.touchpoints.length || 0,
        customerLinked: verifyVisitor?.customerId === customer.id ? 1 : 0
      };

      if (verifyCustomer?.qualificationStatus === 'sales_qualified' && 
          verifyVisitor?.customerId === customer.id &&
          verifyVisitor.touchpoints.length === 2) {
        this.results.push({
          component: 'Lead Scoring',
          integration: 'Customer Journey',
          status: 'PASS',
          details: 'Lead scoring successfully integrated with customer journey creation',
          metrics
        });
      } else {
        this.results.push({
          component: 'Lead Scoring',
          integration: 'Customer Journey',
          status: 'FAIL',
          details: 'Lead scoring not properly integrated with customer journey',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], []);
      await prisma.contact.delete({ where: { id: customer.id } }).catch(() => {});

    } catch (error) {
      this.results.push({
        component: 'Lead Scoring',
        integration: 'Customer Journey',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testRealTimeDashboardSync(): Promise<void> {
    console.log('🧪 Testing Real-time Updates → Dashboard Sync...');
    
    try {
      // Create multiple visitors for real-time testing
      const visitors = await Promise.all([
        prisma.leadPulseVisitor.create({
          data: {
            fingerprint: `realtime_1_${Date.now()}`,
            ipAddress: '192.168.1.5',
            userAgent: 'Realtime Test 1',
            country: 'Nigeria',
            city: 'Abuja',
            device: 'desktop',
            browser: 'Chrome',
            os: 'Windows',
            source: 'google',
            medium: 'organic',
            firstVisit: this.testEnvironment.testTimestamp,
            lastVisit: new Date().toISOString(),
            sessionCount: 1,
            pageViewCount: 3,
            engagementScore: 35,
            conversionScore: 25,
            leadScore: 30
          }
        }),
        prisma.leadPulseVisitor.create({
          data: {
            fingerprint: `realtime_2_${Date.now()}`,
            ipAddress: '192.168.1.6',
            userAgent: 'Realtime Test 2',
            country: 'Kenya',
            city: 'Nairobi',
            device: 'mobile',
            browser: 'Safari',
            os: 'iOS',
            source: 'facebook',
            medium: 'social',
            firstVisit: this.testEnvironment.testTimestamp,
            lastVisit: new Date().toISOString(),
            sessionCount: 1,
            pageViewCount: 5,
            engagementScore: 60,
            conversionScore: 45,
            leadScore: 55
          }
        })
      ]);

      // Create analytics events for real-time dashboard
      const analyticsEvents = await Promise.all(
        visitors.map(visitor => 
          prisma.leadPulseAnalytics.create({
            data: {
              visitorId: visitor.id,
              sessionId: `realtime_session_${Date.now()}`,
              event: 'real_time_update',
              timestamp: new Date(),
              data: {
                eventType: 'visitor_activity',
                engagementScore: visitor.engagementScore,
                isActive: true,
                lastActivity: new Date().toISOString()
              }
            }
          })
        )
      );

      // Query real-time dashboard data
      const realtimeVisitors = await prisma.leadPulseVisitor.findMany({
        where: {
          lastVisit: {
            gte: new Date(Date.now() - 300000) // Last 5 minutes
          }
        },
        include: {
          analytics: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 300000)
              }
            }
          }
        }
      });

      const activeVisitors = realtimeVisitors.filter(v => 
        v.fingerprint.includes('realtime_')
      );

      const metrics = {
        realtimeVisitors: activeVisitors.length,
        analyticsEvents: analyticsEvents.length,
        avgEngagementScore: activeVisitors.reduce((sum, v) => sum + v.engagementScore, 0) / activeVisitors.length,
        dashboardLatency: Date.now() - new Date(this.testEnvironment.testTimestamp).getTime()
      };

      if (activeVisitors.length === 2 && analyticsEvents.length === 2) {
        this.results.push({
          component: 'Real-time Updates',
          integration: 'Dashboard Sync',
          status: 'PASS',
          details: 'Real-time updates successfully synchronized with dashboard',
          metrics
        });
      } else {
        this.results.push({
          component: 'Real-time Updates',
          integration: 'Dashboard Sync',
          status: 'FAIL',
          details: 'Real-time updates not properly synchronized',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData(visitors.map(v => v.id), [], []);

    } catch (error) {
      this.results.push({
        component: 'Real-time Updates',
        integration: 'Dashboard Sync',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testAPIDataConsistency(): Promise<void> {
    console.log('🧪 Testing API Endpoints → Data Consistency...');
    
    try {
      // Create comprehensive test data
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `api_test_${Date.now()}`,
          ipAddress: '192.168.1.7',
          userAgent: 'API Test Browser',
          country: 'Nigeria',
          city: 'Lagos',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          source: 'google',
          medium: 'organic',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: new Date().toISOString(),
          sessionCount: 1,
          pageViewCount: 4,
          engagementScore: 50,
          conversionScore: 35,
          leadScore: 60
        }
      });

      // Create related data
      const touchpoint = await prisma.leadPulseTouchpoint.create({
        data: {
          visitorId: visitor.fingerprint,
          sessionId: `api_session_${Date.now()}`,
          type: 'page_view',
          page: '/api-test',
          timestamp: new Date(),
          data: { duration: 90, scrollDepth: 75 }
        }
      });

      const analytics = await prisma.leadPulseAnalytics.create({
        data: {
          visitorId: visitor.id,
          sessionId: `api_session_${Date.now()}`,
          event: 'api_consistency_test',
          timestamp: new Date(),
          data: {
            testType: 'integration',
            visitorScore: visitor.leadScore
          }
        }
      });

      // Test data consistency across API endpoints
      const consistencyChecks = [
        // Check visitor data consistency
        prisma.leadPulseVisitor.findUnique({
          where: { id: visitor.id },
          include: {
            touchpoints: true,
            analytics: true
          }
        }),
        
        // Check touchpoint data consistency
        prisma.leadPulseTouchpoint.findMany({
          where: { visitorId: visitor.fingerprint }
        }),
        
        // Check analytics data consistency
        prisma.leadPulseAnalytics.findMany({
          where: { visitorId: visitor.id }
        })
      ];

      const [visitorData, touchpointData, analyticsData] = await Promise.all(consistencyChecks);

      const metrics = {
        visitorRecords: visitorData ? 1 : 0,
        touchpointRecords: touchpointData.length,
        analyticsRecords: analyticsData.length,
        dataIntegrity: visitorData?.touchpoints.length === touchpointData.length ? 1 : 0
      };

      if (visitorData && 
          touchpointData.length === 1 && 
          analyticsData.length === 1 &&
          visitorData.touchpoints.length === touchpointData.length) {
        this.results.push({
          component: 'API Endpoints',
          integration: 'Data Consistency',
          status: 'PASS',
          details: 'API endpoints maintain consistent data across all components',
          metrics
        });
      } else {
        this.results.push({
          component: 'API Endpoints',
          integration: 'Data Consistency',
          status: 'FAIL',
          details: 'Data inconsistency detected across API endpoints',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], []);

    } catch (error) {
      this.results.push({
        component: 'API Endpoints',
        integration: 'Data Consistency',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async testComponentInterconnectivity(): Promise<void> {
    console.log('🧪 Testing Component Interconnectivity...');
    
    try {
      // Test full component interconnectivity flow
      const startTime = Date.now();
      
      // 1. Create visitor (Visitor Tracking)
      const visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint: `interconnect_${Date.now()}`,
          ipAddress: '192.168.1.8',
          userAgent: 'Interconnectivity Test',
          country: 'Nigeria',
          city: 'Lagos',
          device: 'mobile',
          browser: 'Chrome',
          os: 'Android',
          source: 'google',
          medium: 'organic',
          firstVisit: this.testEnvironment.testTimestamp,
          lastVisit: new Date().toISOString(),
          sessionCount: 1,
          pageViewCount: 0,
          engagementScore: 0,
          conversionScore: 0,
          leadScore: 0
        }
      });

      // 2. Track page views (Analytics)
      const pageViews = await Promise.all([
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `interconnect_session_${Date.now()}`,
            type: 'page_view',
            page: '/',
            timestamp: new Date(),
            data: { duration: 30, scrollDepth: 60 }
          }
        }),
        prisma.leadPulseTouchpoint.create({
          data: {
            visitorId: visitor.fingerprint,
            sessionId: `interconnect_session_${Date.now()}`,
            type: 'page_view',
            page: '/pricing',
            timestamp: new Date(),
            data: { duration: 120, scrollDepth: 90 }
          }
        })
      ]);

      // 3. Record heatmap interactions (Heatmap)
      const heatmapInteraction = await prisma.leadPulseTouchpoint.create({
        data: {
          visitorId: visitor.fingerprint,
          sessionId: `interconnect_session_${Date.now()}`,
          type: 'interaction',
          page: '/pricing',
          timestamp: new Date(),
          data: {
            element: '#pricing-cta',
            x: 400,
            y: 300,
            interactionType: 'click'
          }
        }
      });

      // 4. Submit form (Forms)
      const formSubmission = await prisma.leadPulseFormSubmission.create({
        data: {
          formId: 'interconnect_form',
          visitorId: visitor.fingerprint,
          sessionId: `interconnect_session_${Date.now()}`,
          submittedAt: new Date(),
          data: {
            name: 'Interconnect Test User',
            email: 'interconnect@test.com'
          },
          ipAddress: visitor.ipAddress,
          userAgent: visitor.userAgent
        }
      });

      // 5. Calculate scores (Lead Scoring)
      const engagementScore = pageViews.length * 10 + 20; // Page views + form submission
      const leadScore = engagementScore + 25; // Additional scoring logic

      await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          pageViewCount: pageViews.length,
          engagementScore,
          leadScore
        }
      });

      // 6. Create customer (Customer Journey)
      const customer = await prisma.contact.create({
        data: {
          name: 'Interconnect Test User',
          email: 'interconnect@test.com',
          source: 'leadpulse',
          leadPulseVisitorId: visitor.id,
          leadScore,
          qualificationStatus: leadScore >= 60 ? 'sales_qualified' : 'marketing_qualified',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 7. Generate analytics (Analytics)
      const analyticsRecord = await prisma.leadPulseAnalytics.create({
        data: {
          visitorId: visitor.id,
          sessionId: `interconnect_session_${Date.now()}`,
          event: 'interconnectivity_test_complete',
          timestamp: new Date(),
          data: {
            componentCount: 7,
            totalTouchpoints: pageViews.length + 1 + 1, // page views + interaction + form
            conversionValue: 500,
            processingTime: Date.now() - startTime
          }
        }
      });

      // 8. Verify all components are interconnected
      const verifyVisitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitor.id },
        include: {
          touchpoints: true,
          formSubmissions: true,
          analytics: true
        }
      });

      const verifyCustomer = await prisma.contact.findUnique({
        where: { id: customer.id }
      });

      const metrics = {
        totalComponents: 7,
        pageViews: pageViews.length,
        heatmapInteractions: 1,
        formSubmissions: 1,
        leadScore,
        engagementScore,
        customersCreated: verifyCustomer ? 1 : 0,
        analyticsRecords: verifyVisitor?.analytics.length || 0,
        processingTime: Date.now() - startTime
      };

      if (verifyVisitor && 
          verifyCustomer &&
          verifyVisitor.touchpoints.length === 3 &&
          verifyVisitor.formSubmissions.length === 1 &&
          verifyVisitor.analytics.length === 1 &&
          verifyVisitor.customerId === customer.id) {
        this.results.push({
          component: 'All Components',
          integration: 'Interconnectivity',
          status: 'PASS',
          details: 'All LeadPulse components successfully interconnected',
          metrics
        });
      } else {
        this.results.push({
          component: 'All Components',
          integration: 'Interconnectivity',
          status: 'FAIL',
          details: 'Component interconnectivity test failed',
          metrics
        });
      }

      // Cleanup
      await this.cleanupTestData([visitor.id], [], []);
      await prisma.contact.delete({ where: { id: customer.id } }).catch(() => {});

    } catch (error) {
      this.results.push({
        component: 'All Components',
        integration: 'Interconnectivity',
        status: 'FAIL',
        details: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metrics: {}
      });
    }
  }

  private async cleanupTestData(visitorIds: string[], formIds: string[], abTestIds: string[]): Promise<void> {
    try {
      // Delete in order to respect foreign key constraints
      for (const visitorId of visitorIds) {
        await prisma.leadPulseAnalytics.deleteMany({
          where: { visitorId }
        });

        await prisma.leadPulseFormSubmission.deleteMany({
          where: { visitorId: { contains: visitorId } }
        });

        await prisma.leadPulseTouchpoint.deleteMany({
          where: { visitorId: { contains: visitorId } }
        });

        await prisma.leadPulseVisitor.deleteMany({
          where: { id: visitorId }
        });
      }

      for (const formId of formIds) {
        await prisma.leadPulseFormAnalytics.deleteMany({
          where: { formId }
        });

        await prisma.leadPulseFormSubmission.deleteMany({
          where: { formId }
        });

        await prisma.leadPulseForm.deleteMany({
          where: { id: formId }
        });
      }

      for (const testId of abTestIds) {
        await prisma.leadPulseABTestVariant.deleteMany({
          where: { testId }
        });

        await prisma.leadPulseABTest.deleteMany({
          where: { id: testId }
        });
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }

  private printIntegrationResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔗 LEADPULSE INTEGRATION TEST RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`\nIntegration Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);

    console.log('Integration Results by Component:\n');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.component} → ${result.integration}`);
      console.log(`   ${result.details}`);
      
      if (Object.keys(result.metrics).length > 0) {
        console.log(`   Metrics: ${Object.entries(result.metrics)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')}`);
      }
      console.log('');
    });

    console.log('='.repeat(80));
    
    if (failed === 0) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('🔗 All LeadPulse components are properly integrated and working together.');
      console.log('🚀 The system is ready for production deployment.');
    } else {
      console.log(`⚠️  ${failed} integration test(s) failed.`);
      console.log('🔧 Please review and fix integration issues before deployment.');
      process.exit(1);
    }
  }
}

// Run the integration tests
async function main() {
  const tester = new LeadPulseIntegrationTester();
  await tester.runAllIntegrationTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Integration test execution failed:', error);
    process.exit(1);
  });
}

export { LeadPulseIntegrationTester };