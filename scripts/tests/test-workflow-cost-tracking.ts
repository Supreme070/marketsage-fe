#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { workflowCostTracker } from '../src/lib/workflow/cost-tracking';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class WorkflowCostTrackingTest {
  private results: TestResult[] = [];
  private testWorkflowId = 'test-workflow-cost-tracking';
  private testExecutionId = 'test-execution-cost-tracking';

  async runAllTests() {
    console.log('🚀 Starting Workflow Cost Tracking Tests\n');

    try {
      await this.setupTestData();
      await this.testEmailCostRecording();
      await this.testSmsCostRecording();
      await this.testWhatsAppCostRecording();
      await this.testApiCostRecording();
      await this.testBudgetCreation();
      await this.testCostSummary();
      await this.testCostProjection();
      await this.testBudgetAlerts();
      await this.testCostOptimizationRecommendations();
      await this.cleanupTestData();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    this.printResults();
  }

  private async setupTestData() {
    console.log('Setting up test data...');
    
    try {
      // Create test workflow if it doesn't exist
      await prisma.workflow.upsert({
        where: { id: this.testWorkflowId },
        create: {
          id: this.testWorkflowId,
          name: 'Test Workflow for Cost Tracking',
          description: 'Test workflow for cost tracking functionality',
          definition: JSON.stringify({
            nodes: [
              { id: 'start', type: 'trigger', data: { label: 'Start' } },
              { id: 'email', type: 'action', data: { label: 'Send Email' } }
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'email' }
            ]
          }),
          status: 'ACTIVE',
          createdById: 'test-user'
        },
        update: {}
      });

      // Create test contact
      await prisma.contact.upsert({
        where: { email: 'test-cost-tracking@example.com' },
        create: {
          email: 'test-cost-tracking@example.com',
          firstName: 'Cost',
          lastName: 'Tracking',
          phone: '+1234567890'
        },
        update: {}
      });

      console.log('✅ Test data setup complete\n');
    } catch (error) {
      console.error('❌ Failed to setup test data:', error);
      throw error;
    }
  }

  private async testEmailCostRecording() {
    const testName = 'Email Cost Recording';
    console.log(`Testing ${testName}...`);

    try {
      await workflowCostTracker.recordEmailCost(
        this.testWorkflowId,
        this.testExecutionId,
        5, // 5 emails
        'sendgrid'
      );

      // Verify cost was recorded
      const costEntry = await prisma.workflowCostEntry.findFirst({
        where: {
          workflowId: this.testWorkflowId,
          costType: 'EMAIL_SEND'
        }
      });

      if (costEntry) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            costRecorded: costEntry.amount,
            quantity: costEntry.quantity,
            provider: costEntry.provider
          }
        });
        console.log(`✅ ${testName}: Cost recorded successfully`);
      } else {
        throw new Error('Cost entry not found');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testSmsCostRecording() {
    const testName = 'SMS Cost Recording';
    console.log(`Testing ${testName}...`);

    try {
      await workflowCostTracker.recordSmsCost(
        this.testWorkflowId,
        this.testExecutionId,
        3, // 3 SMS
        'twilio',
        'US'
      );

      // Verify cost was recorded
      const costEntry = await prisma.workflowCostEntry.findFirst({
        where: {
          workflowId: this.testWorkflowId,
          costType: 'SMS_SEND'
        }
      });

      if (costEntry) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            costRecorded: costEntry.amount,
            quantity: costEntry.quantity,
            provider: costEntry.provider,
            region: costEntry.region
          }
        });
        console.log(`✅ ${testName}: Cost recorded successfully`);
      } else {
        throw new Error('Cost entry not found');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testWhatsAppCostRecording() {
    const testName = 'WhatsApp Cost Recording';
    console.log(`Testing ${testName}...`);

    try {
      await workflowCostTracker.recordWhatsAppCost(
        this.testWorkflowId,
        this.testExecutionId,
        2, // 2 WhatsApp messages
        'whatsapp-business'
      );

      // Verify cost was recorded
      const costEntry = await prisma.workflowCostEntry.findFirst({
        where: {
          workflowId: this.testWorkflowId,
          costType: 'WHATSAPP_SEND'
        }
      });

      if (costEntry) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            costRecorded: costEntry.amount,
            quantity: costEntry.quantity,
            provider: costEntry.provider
          }
        });
        console.log(`✅ ${testName}: Cost recorded successfully`);
      } else {
        throw new Error('Cost entry not found');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testApiCostRecording() {
    const testName = 'API Call Cost Recording';
    console.log(`Testing ${testName}...`);

    try {
      await workflowCostTracker.recordApiCost(
        this.testWorkflowId,
        this.testExecutionId,
        1, // 1 API call
        'webhook',
        'https://api.example.com/webhook'
      );

      // Verify cost was recorded
      const costEntry = await prisma.workflowCostEntry.findFirst({
        where: {
          workflowId: this.testWorkflowId,
          costType: 'API_CALL'
        }
      });

      if (costEntry) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            costRecorded: costEntry.amount,
            quantity: costEntry.quantity,
            provider: costEntry.provider,
            endpoint: costEntry.metadata ? JSON.parse(costEntry.metadata as string).endpoint : null
          }
        });
        console.log(`✅ ${testName}: Cost recorded successfully`);
      } else {
        throw new Error('Cost entry not found');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testBudgetCreation() {
    const testName = 'Budget Creation';
    console.log(`Testing ${testName}...`);

    try {
      const budgetId = await workflowCostTracker.createBudget(
        this.testWorkflowId,
        {
          budgetAmount: 100.00,
          currency: 'USD',
          period: 'MONTHLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          warningThreshold: 75,
          criticalThreshold: 90,
          pauseOnExceeded: false,
          autoRenew: false
        },
        'test-user'
      );

      // Verify budget was created
      const budget = await prisma.workflowBudget.findUnique({
        where: { id: budgetId }
      });

      if (budget) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            budgetId,
            budgetAmount: budget.budgetAmount,
            currency: budget.currency,
            period: budget.period
          }
        });
        console.log(`✅ ${testName}: Budget created successfully`);
      } else {
        throw new Error('Budget not found');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testCostSummary() {
    const testName = 'Cost Summary Generation';
    console.log(`Testing ${testName}...`);

    try {
      const summary = await workflowCostTracker.getCostSummary(this.testWorkflowId);

      if (summary && summary.totalCost > 0) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            totalCost: summary.totalCost,
            breakdown: summary.breakdown,
            periodStart: summary.periodStart,
            periodEnd: summary.periodEnd
          }
        });
        console.log(`✅ ${testName}: Summary generated successfully`);
      } else {
        throw new Error('Invalid cost summary');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testCostProjection() {
    const testName = 'Cost Projection Generation';
    console.log(`Testing ${testName}...`);

    try {
      const projection = await workflowCostTracker.generateCostProjection(
        this.testWorkflowId,
        'MONTHLY'
      );

      if (projection && projection.projectedCost >= 0) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            projectedCost: projection.projectedCost,
            projectionPeriod: projection.projectionPeriod,
            confidence: projection.confidence
          }
        });
        console.log(`✅ ${testName}: Projection generated successfully`);
      } else {
        throw new Error('Invalid cost projection');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testBudgetAlerts() {
    const testName = 'Budget Alert Creation';
    console.log(`Testing ${testName}...`);

    try {
      await workflowCostTracker.checkBudgetAlerts(this.testWorkflowId);

      // Check if any alerts were created (might not be if under threshold)
      const alerts = await prisma.workflowCostAlert.findMany({
        where: { workflowId: this.testWorkflowId }
      });

      this.results.push({
        test: testName,
        passed: true,
        details: { 
          alertsChecked: true,
          alertsCreated: alerts.length
        }
      });
      console.log(`✅ ${testName}: Budget alerts checked successfully`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testCostOptimizationRecommendations() {
    const testName = 'Cost Optimization Recommendations';
    console.log(`Testing ${testName}...`);

    try {
      const recommendations = await workflowCostTracker.getCostOptimizationRecommendations(
        this.testWorkflowId
      );

      if (Array.isArray(recommendations)) {
        this.results.push({
          test: testName,
          passed: true,
          details: { 
            recommendationsCount: recommendations.length,
            recommendations: recommendations.map(r => ({
              type: r.type,
              title: r.title,
              potentialSavings: r.potentialSavings
            }))
          }
        });
        console.log(`✅ ${testName}: Recommendations generated successfully`);
      } else {
        throw new Error('Invalid recommendations format');
      }
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async cleanupTestData() {
    console.log('\nCleaning up test data...');
    
    try {
      // Delete test cost entries
      await prisma.workflowCostEntry.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      // Delete test alerts
      await prisma.workflowCostAlert.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      // Delete test budget
      await prisma.workflowBudget.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      // Delete test workflow
      await prisma.workflow.delete({
        where: { id: this.testWorkflowId }
      });

      // Delete test contact
      await prisma.contact.delete({
        where: { email: 'test-cost-tracking@example.com' }
      });

      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
    }
  }

  private printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 WORKFLOW COST TRACKING TEST RESULTS');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\n✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    if (passed === total) {
      console.log('🎉 All tests passed! Workflow cost tracking is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
async function main() {
  const tester = new WorkflowCostTrackingTest();
  await tester.runAllTests();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { WorkflowCostTrackingTest };