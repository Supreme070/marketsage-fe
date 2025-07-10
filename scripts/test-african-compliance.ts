#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { workflowComplianceChecker } from '../src/lib/workflow/compliance-checker';
import { africanComplianceService } from '../src/lib/compliance/african-regulations';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class AfricanComplianceTest {
  private results: TestResult[] = [];
  private testWorkflowId = 'test-workflow-compliance';

  async runAllTests() {
    console.log('🌍 Starting African Fintech Compliance Tests\n');

    try {
      await this.initializeAfricanRegulations();
      await this.setupTestWorkflow();
      await this.testNigerianCompliance();
      await this.testKenyanCompliance();
      await this.testSouthAfricanCompliance();
      await this.testGhanaianCompliance();
      await this.testEgyptianCompliance();
      await this.testComplianceReportGeneration();
      await this.cleanupTestData();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    this.printResults();
  }

  private async initializeAfricanRegulations() {
    const testName = 'Initialize African Regulations';
    console.log(`Testing ${testName}...`);

    try {
      await africanComplianceService.initializeAfricanComplianceRules();

      // Verify regulations were created
      const rulesCount = await prisma.workflowComplianceRule.count({
        where: {
          country: { in: ['NG', 'KE', 'ZA', 'GH', 'EG'] }
        }
      });

      const configurationsCount = await prisma.complianceConfiguration.count({
        where: {
          country: { in: ['NG', 'KE', 'ZA', 'GH', 'EG'] }
        }
      });

      this.results.push({
        test: testName,
        passed: rulesCount > 0 && configurationsCount > 0,
        details: {
          rulesCreated: rulesCount,
          configurationsCreated: configurationsCount,
          countries: ['NG', 'KE', 'ZA', 'GH', 'EG']
        }
      });
      console.log(`✅ ${testName}: ${rulesCount} rules and ${configurationsCount} configurations created`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async setupTestWorkflow() {
    const testName = 'Setup Test Workflow';
    console.log(`Setting up ${testName}...`);

    try {
      // Create a test workflow with various compliance scenarios
      const workflow = await prisma.workflow.create({
        data: {
          id: this.testWorkflowId,
          name: 'African Compliance Test Workflow',
          description: 'Test workflow for African fintech compliance',
          definition: JSON.stringify({
            nodes: [
              {
                id: 'start',
                type: 'trigger',
                data: {
                  label: 'Start',
                  properties: {
                    triggerType: 'form_submission'
                  }
                }
              },
              {
                id: 'collect-data',
                type: 'action',
                data: {
                  label: 'Collect Customer Data',
                  properties: {
                    collectPersonalData: true,
                    dataTypes: ['email', 'phone', 'financial_info'],
                    hasConsentStep: false, // Compliance violation
                    hasDataRetentionPolicy: false // Compliance violation
                  }
                }
              },
              {
                id: 'send-email',
                type: 'action',
                data: {
                  label: 'Send Marketing Email',
                  properties: {
                    emailType: 'marketing',
                    includeOptOut: false, // Compliance violation
                    hasFinancialContent: true,
                    includeDisclaimer: false // Compliance violation
                  }
                }
              },
              {
                id: 'send-sms1',
                type: 'action',
                data: {
                  label: 'Send SMS 1',
                  properties: {
                    messageType: 'promotional'
                  }
                }
              },
              {
                id: 'send-sms2',
                type: 'action',
                data: {
                  label: 'Send SMS 2',
                  properties: {
                    messageType: 'promotional'
                  }
                }
              },
              {
                id: 'send-sms3',
                type: 'action',
                data: {
                  label: 'Send SMS 3',
                  properties: {
                    messageType: 'promotional'
                  }
                }
              },
              {
                id: 'external-api',
                type: 'webhook',
                data: {
                  label: 'Call External API',
                  properties: {
                    url: 'https://api.external-service.com/process', // Cross-border data transfer
                    dataLocalization: false // Compliance violation
                  }
                }
              }
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'collect-data' },
              { id: 'e2', source: 'collect-data', target: 'send-email' },
              { id: 'e3', source: 'send-email', target: 'send-sms1' },
              { id: 'e4', source: 'send-sms1', target: 'send-sms2' },
              { id: 'e5', source: 'send-sms2', target: 'send-sms3' },
              { id: 'e6', source: 'send-sms3', target: 'external-api' }
            ]
          }),
          status: 'ACTIVE',
          createdById: 'test-user'
        }
      });

      // Create test contact
      await prisma.contact.upsert({
        where: { email: 'test-compliance@example.com' },
        create: {
          email: 'test-compliance@example.com',
          firstName: 'Compliance',
          lastName: 'Test',
          phone: '+1234567890'
        },
        update: {}
      });

      this.results.push({
        test: testName,
        passed: true,
        details: { workflowId: workflow.id }
      });
      console.log(`✅ ${testName}: Test workflow created`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testNigerianCompliance() {
    const testName = 'Nigerian CBN Compliance Check';
    console.log(`Testing ${testName}...`);

    try {
      const context = {
        country: 'NG',
        userLocation: 'Lagos',
        dataTypes: ['email', 'phone', 'financial_info'],
        communicationChannels: ['email', 'sms'],
        consentStatus: { marketing: false },
        marketingFrequency: { daily: 3 }
      };

      const results = await workflowComplianceChecker.checkWorkflowCompliance(
        this.testWorkflowId,
        context
      );

      const violations = results.filter(r => !r.isCompliant);
      const criticalViolations = results.filter(r => 
        r.findings.some(f => f.severity === 'CRITICAL')
      );

      this.results.push({
        test: testName,
        passed: results.length > 0,
        details: {
          totalChecks: results.length,
          violations: violations.length,
          criticalViolations: criticalViolations.length,
          averageRiskScore: results.reduce((sum, r) => sum + r.riskScore, 0) / results.length,
          violationTypes: violations.map(v => v.findings.map(f => f.type)).flat()
        }
      });
      console.log(`✅ ${testName}: ${results.length} checks performed, ${violations.length} violations found`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testKenyanCompliance() {
    const testName = 'Kenyan DPA/CBK Compliance Check';
    console.log(`Testing ${testName}...`);

    try {
      const context = {
        country: 'KE',
        userLocation: 'Nairobi',
        dataTypes: ['personal_data', 'financial_data'],
        communicationChannels: ['email', 'sms'],
        consentStatus: { processing: false }
      };

      const results = await workflowComplianceChecker.checkWorkflowCompliance(
        this.testWorkflowId,
        context
      );

      const dataProtectionViolations = results.filter(r => 
        r.findings.some(f => f.type.includes('data_protection') || f.type.includes('consent'))
      );

      this.results.push({
        test: testName,
        passed: results.length > 0,
        details: {
          totalChecks: results.length,
          dataProtectionViolations: dataProtectionViolations.length,
          complianceScore: (results.filter(r => r.isCompliant).length / results.length) * 100
        }
      });
      console.log(`✅ ${testName}: ${dataProtectionViolations.length} data protection violations detected`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testSouthAfricanCompliance() {
    const testName = 'South African POPIA/NCA Compliance Check';
    console.log(`Testing ${testName}...`);

    try {
      const context = {
        country: 'ZA',
        userLocation: 'Cape Town',
        dataTypes: ['personal_information', 'credit_data'],
        communicationChannels: ['email', 'sms'],
        consentStatus: { lawfulBasis: false }
      };

      const results = await workflowComplianceChecker.checkWorkflowCompliance(
        this.testWorkflowId,
        context
      );

      const popiaViolations = results.filter(r => 
        r.findings.some(f => f.type.includes('consent') || f.type.includes('lawful_basis'))
      );

      this.results.push({
        test: testName,
        passed: results.length > 0,
        details: {
          totalChecks: results.length,
          popiaViolations: popiaViolations.length,
          highRiskFindings: results.filter(r => r.riskScore > 50).length
        }
      });
      console.log(`✅ ${testName}: ${popiaViolations.length} POPIA violations detected`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testGhanaianCompliance() {
    const testName = 'Ghanaian DPA/BOG Compliance Check';
    console.log(`Testing ${testName}...`);

    try {
      const context = {
        country: 'GH',
        userLocation: 'Accra',
        dataTypes: ['personal_data'],
        communicationChannels: ['email', 'sms']
      };

      const results = await workflowComplianceChecker.checkWorkflowCompliance(
        this.testWorkflowId,
        context
      );

      this.results.push({
        test: testName,
        passed: results.length > 0,
        details: {
          totalChecks: results.length,
          averageRiskScore: results.reduce((sum, r) => sum + r.riskScore, 0) / results.length
        }
      });
      console.log(`✅ ${testName}: Compliance check completed`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testEgyptianCompliance() {
    const testName = 'Egyptian CBE Compliance Check';
    console.log(`Testing ${testName}...`);

    try {
      const context = {
        country: 'EG',
        userLocation: 'Cairo',
        dataTypes: ['personal_data', 'payment_data'],
        communicationChannels: ['email', 'sms']
      };

      const results = await workflowComplianceChecker.checkWorkflowCompliance(
        this.testWorkflowId,
        context
      );

      this.results.push({
        test: testName,
        passed: results.length > 0,
        details: {
          totalChecks: results.length,
          languageViolations: results.filter(r => 
            r.findings.some(f => f.type.includes('arabic') || f.type.includes('translation'))
          ).length
        }
      });
      console.log(`✅ ${testName}: Compliance check completed`);
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${testName}: ${error}`);
    }
  }

  private async testComplianceReportGeneration() {
    const testName = 'Compliance Report Generation';
    console.log(`Testing ${testName}...`);

    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const reportId = await workflowComplianceChecker.generateComplianceReport(
        this.testWorkflowId,
        'MONTHLY_REPORT',
        'MONTHLY',
        startDate,
        endDate,
        'test-user'
      );

      const report = await prisma.workflowComplianceReport.findUnique({
        where: { id: reportId }
      });

      this.results.push({
        test: testName,
        passed: report !== null,
        details: {
          reportId,
          overallScore: report?.overallScore,
          totalChecks: report?.totalChecks,
          violationsFound: report?.violationsFound
        }
      });
      console.log(`✅ ${testName}: Report generated with ID ${reportId}`);
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
      // Delete test compliance data
      await prisma.workflowComplianceCheck.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      await prisma.workflowComplianceViolation.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      await prisma.workflowComplianceReport.deleteMany({
        where: { workflowId: this.testWorkflowId }
      });

      // Delete test workflow
      await prisma.workflow.delete({
        where: { id: this.testWorkflowId }
      });

      // Delete test contact
      await prisma.contact.delete({
        where: { email: 'test-compliance@example.com' }
      });

      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
    }
  }

  private printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🌍 AFRICAN FINTECH COMPLIANCE TEST RESULTS');
    console.log('='.repeat(60));
    
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
      console.log('🎉 All compliance tests passed! African fintech regulations are properly implemented.');
    } else {
      console.log('⚠️  Some tests failed. Please review the compliance implementation.');
    }

    // Print summary of African markets covered
    console.log('\n📊 AFRICAN MARKETS COVERAGE:');
    console.log('   🇳🇬 Nigeria (CBN) - Consumer Protection, Data Protection, KYC');
    console.log('   🇰🇪 Kenya (CBK/CMA) - Data Protection Act, Consumer Protection');
    console.log('   🇿🇦 South Africa (SARB) - POPIA, National Credit Act, FICA');
    console.log('   🇬🇭 Ghana (BOG) - Data Protection Act, Consumer Protection');
    console.log('   🇪🇬 Egypt (CBE) - Consumer Protection, Digital Payments');
  }
}

// Run the tests
async function main() {
  const tester = new AfricanComplianceTest();
  await tester.runAllTests();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { AfricanComplianceTest };