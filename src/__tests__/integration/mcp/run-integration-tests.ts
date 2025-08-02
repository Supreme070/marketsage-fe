#!/usr/bin/env tsx
/**
 * MCP Integration Test Runner
 * 
 * Orchestrates running all MCP integration tests with proper setup,
 * database management, and comprehensive reporting.
 */

import { execSync } from 'child_process';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
}

class IntegrationTestRunner {
  private testResults: TestResult[] = [];
  private startTime = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all integration tests in sequence
   */
  async runAll(): Promise<void> {
    console.log('🚀 Starting MCP Integration Test Suite');
    console.log('=====================================');
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🐳 Docker Mode: ${this.isDockerEnvironment()}`);
    console.log('');

    const testSuites = [
      {
        name: 'Database Integration Tests',
        file: 'database-integration.test.ts',
        description: 'Tests database operations, performance, and data integrity'
      },
      {
        name: 'Data Validation Tests',
        file: 'data-validation.test.ts',
        description: 'Validates business rules, data consistency, and integrity'
      },
      {
        name: 'MCP Servers Integration Tests',
        file: 'mcp-servers-integration.test.ts',
        description: 'Tests MCP server implementations with real data'
      },
      {
        name: 'Docker Environment Tests',
        file: 'docker-environment.test.ts',
        description: 'Tests Docker-specific functionality and environment compatibility'
      }
    ];

    // Run each test suite
    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate final report
    this.generateFinalReport();
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(suite: { name: string; file: string; description: string }): Promise<void> {
    console.log(`🧪 Running: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log('');

    const startTime = Date.now();
    
    try {
      // Set test environment
      const testEnv = {
        ...process.env,
        NODE_ENV: 'test',
        // Use test database if available
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      };

      // Run Jest for specific test file
      const jestCommand = `npx jest "${suite.file}" --verbose --testTimeout=300000 --runInBand`;
      
      console.log(`⚡ Executing: ${jestCommand}`);
      
      execSync(jestCommand, {
        stdio: 'inherit',
        cwd: path.resolve(process.cwd()),
        env: testEnv
      });

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: suite.name,
        status: 'PASSED',
        duration
      });

      console.log(`✅ ${suite.name} completed successfully in ${duration}ms`);
      console.log('');

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: suite.name,
        status: 'FAILED',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });

      console.error(`❌ ${suite.name} failed after ${duration}ms`);
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.log('');

      // Continue with other tests but note the failure
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(r => r.status === 'PASSED');
    const failedTests = this.testResults.filter(r => r.status === 'FAILED');
    const skippedTests = this.testResults.filter(r => r.status === 'SKIPPED');

    console.log('\n📊 MCP Integration Test Suite Report');
    console.log('====================================');
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log('');

    console.log('📈 Test Results Summary:');
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`⏭️  Skipped: ${skippedTests.length}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    console.log('');

    // Individual test results
    console.log('📋 Individual Test Results:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : 
                     result.status === 'FAILED' ? '❌' : '⏭️';
      
      console.log(`${index + 1}. ${status} ${result.name}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Performance summary
    if (passedTests.length > 0) {
      const avgDuration = passedTests.reduce((sum, test) => sum + test.duration, 0) / passedTests.length;
      const minDuration = Math.min(...passedTests.map(t => t.duration));
      const maxDuration = Math.max(...passedTests.map(t => t.duration));

      console.log('⚡ Performance Summary:');
      console.log(`Average Duration: ${(avgDuration / 1000).toFixed(2)}s`);
      console.log(`Fastest Test: ${(minDuration / 1000).toFixed(2)}s`);
      console.log(`Slowest Test: ${(maxDuration / 1000).toFixed(2)}s`);
      console.log('');
    }

    // Environment information
    console.log('🌍 Environment Information:');
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Docker Environment: ${this.isDockerEnvironment()}`);
    console.log(`Database URL: ${this.maskDatabaseUrl(process.env.DATABASE_URL || 'Not set')}`);
    console.log('');

    // Final status
    const overallStatus = failedTests.length === 0 ? 'PASSED' : 'FAILED';
    const statusIcon = overallStatus === 'PASSED' ? '🎉' : '💥';
    
    console.log(`${statusIcon} Overall Status: ${overallStatus}`);
    
    if (overallStatus === 'PASSED') {
      console.log('🎯 All MCP integration tests passed successfully!');
      console.log('✅ System is ready for production deployment');
    } else {
      console.log('⚠️  Some tests failed - please review the errors above');
      console.log('🔧 Fix the issues before proceeding to production');
    }

    // Exit with appropriate code
    process.exit(failedTests.length === 0 ? 0 : 1);
  }

  /**
   * Check if running in Docker environment
   */
  private isDockerEnvironment(): boolean {
    return process.env.DOCKER_ENV === 'true' || 
           process.env.DATABASE_URL?.includes('marketsage-db') ||
           false;
  }

  /**
   * Mask sensitive information in database URL
   */
  private maskDatabaseUrl(url: string): string {
    return url.replace(/\/\/.*@/, '//***:***@');
  }

  /**
   * Pre-flight checks before running tests
   */
  async preflightChecks(): Promise<boolean> {
    console.log('🔍 Running pre-flight checks...');

    try {
      // Check if required dependencies are available
      execSync('npx jest --version', { stdio: 'pipe' });
      console.log('✅ Jest is available');

      // Check if TypeScript is available
      execSync('npx tsc --version', { stdio: 'pipe' });
      console.log('✅ TypeScript is available');

      // Check if Prisma is available
      execSync('npx prisma --version', { stdio: 'pipe' });
      console.log('✅ Prisma is available');

      // Check database connection
      if (process.env.DATABASE_URL) {
        console.log('✅ Database URL is configured');
      } else {
        console.log('⚠️  Database URL not configured - using default');
      }

      console.log('✅ All pre-flight checks passed');
      console.log('');
      return true;

    } catch (error) {
      console.error('❌ Pre-flight checks failed:', error);
      return false;
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const runner = new IntegrationTestRunner();

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('MCP Integration Test Runner');
    console.log('Usage: npm run test:integration [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --skip-checks  Skip pre-flight checks');
    console.log('');
    console.log('Environment Variables:');
    console.log('  DATABASE_URL        Database connection string');
    console.log('  TEST_DATABASE_URL   Test database connection string');
    console.log('  NODE_ENV           Environment (test, development, production)');
    console.log('  DOCKER_ENV         Set to "true" if running in Docker');
    return;
  }

  // Run pre-flight checks unless skipped
  if (!args.includes('--skip-checks')) {
    const checksPass = await runner.preflightChecks();
    if (!checksPass) {
      console.error('❌ Pre-flight checks failed. Aborting test run.');
      process.exit(1);
    }
  }

  // Run all tests
  await runner.runAll();
}

// Execute if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

export default IntegrationTestRunner;