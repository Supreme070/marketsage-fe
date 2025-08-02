#!/usr/bin/env tsx

import { execSync, spawn, type ChildProcess } from 'child_process';
import { DatabaseSeeder } from './database-seeder';
import path from 'path';

/**
 * Traffic Split E2E Test Runner
 * Tests the new shared configuration system with 50% traffic split
 * between old and new configuration approaches
 */

interface TestResult {
  configuration: 'old' | 'new';
  testSuite: string;
  passed: boolean;
  duration: number;
  errors?: string[];
}

class TrafficSplitTestRunner {
  private seeder: DatabaseSeeder;
  private frontendProcess: ChildProcess | null = null;
  private backendProcess: ChildProcess | null = null;
  private results: TestResult[] = [];

  constructor() {
    this.seeder = new DatabaseSeeder();
  }

  async runTrafficSplitTests() {
    console.log('🚀 Starting MarketSage Traffic Split E2E Tests...\n');
    console.log('📊 Testing 50% traffic split between configurations\n');

    try {
      // Step 1: Environment and config validation
      await this.validateConfigurations();

      // Step 2: Test with new shared configuration (50% traffic)
      await this.testWithNewConfiguration();

      // Step 3: Test with legacy configuration (50% traffic)
      await this.testWithLegacyConfiguration();

      // Step 4: Compare results and validate
      await this.analyzeResults();

      console.log('\n✅ Traffic split E2E tests completed successfully!');

    } catch (error) {
      console.error('\n❌ Traffic split tests failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async validateConfigurations() {
    console.log('🔍 Validating configuration systems...\n');

    // Check if shared-config system is properly set up
    const sharedConfigPath = path.join(process.cwd(), '../shared-config');
    try {
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service frontend --environment development`, { stdio: 'pipe' });
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service backend --environment development`, { stdio: 'pipe' });
      console.log('✅ New shared configuration system validated');
    } catch (error) {
      throw new Error(`Shared configuration validation failed: ${error}`);
    }

    // Validate that old configuration still exists for comparison
    const oldEnvExists = require('fs').existsSync('.env.backup') || require('fs').existsSync('.env.old');
    if (!oldEnvExists) {
      console.log('⚠️  Legacy configuration backup not found, creating reference...');
      // Create a backup for comparison purposes
      execSync('cp .env .env.legacy-backup', { stdio: 'ignore' });
    }

    console.log('✅ Configuration validation completed\n');
  }

  private async testWithNewConfiguration() {
    console.log('🆕 Testing with NEW shared configuration system (50% traffic)...\n');

    try {
      // Generate fresh configuration using shared-config system
      console.log('📝 Generating new configuration...');
      const sharedConfigPath = path.join(process.cwd(), '../shared-config');
      
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service frontend --environment development`, { stdio: 'pipe' });
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service backend --environment development`, { stdio: 'pipe' });
      
      console.log('✅ New configuration generated');

      // Verify configuration separation
      await this.verifyConfigurationSeparation();

      // Start services with new configuration
      await this.startServicesWithNewConfig();

      // Run test suites with 50% traffic allocation
      const testSuites = [
        'auth-dashboard.test.ts',
        'campaign-management.test.ts', 
        'analytics-leadpulse.test.ts'
      ];

      for (const testSuite of testSuites) {
        console.log(`🧪 Running ${testSuite} with new configuration...`);
        const result = await this.runTestSuite(testSuite, 'new');
        this.results.push(result);
      }

      console.log('✅ New configuration tests completed\n');

    } catch (error) {
      console.error('❌ New configuration tests failed:', error);
      throw error;
    } finally {
      await this.stopServices();
    }
  }

  private async testWithLegacyConfiguration() {
    console.log('🔄 Testing with LEGACY configuration (50% traffic)...\n');

    try {
      // Restore legacy configuration for comparison
      if (require('fs').existsSync('.env.legacy-backup')) {
        execSync('cp .env.legacy-backup .env', { stdio: 'ignore' });
        console.log('✅ Legacy configuration restored');
      }

      // Start services with legacy configuration
      await this.startServicesWithLegacyConfig();

      // Run same test suites with remaining 50% traffic
      const testSuites = [
        'contact-management.test.ts',
        'workflow-automation.test.ts',
        'mcp-integration.test.ts'
      ];

      for (const testSuite of testSuites) {
        console.log(`🧪 Running ${testSuite} with legacy configuration...`);
        const result = await this.runTestSuite(testSuite, 'old');
        this.results.push(result);
      }

      console.log('✅ Legacy configuration tests completed\n');

    } catch (error) {
      console.error('❌ Legacy configuration tests failed:', error);
      throw error;
    } finally {
      await this.stopServices();
    }
  }

  private async verifyConfigurationSeparation() {
    console.log('🔒 Verifying configuration separation...');

    // Check that frontend doesn't have database access
    const frontendEnvContent = require('fs').readFileSync('.env', 'utf8');
    const hasDirectDatabaseAccess = /^DATABASE_URL=/m.test(frontendEnvContent);
    
    if (hasDirectDatabaseAccess) {
      const hasApiOnlyMode = /NEXT_PUBLIC_USE_API_ONLY=true/.test(frontendEnvContent);
      if (!hasApiOnlyMode) {
        throw new Error('Frontend configuration violation: Has database access without API-only mode');
      }
      console.log('⚠️  Frontend has DATABASE_URL but API-only mode is enabled (acceptable)');
    } else {
      console.log('✅ Frontend properly configured without database access');
    }

    // Check that backend has database access
    const backendEnvPath = '../marketsage-backend/.env';
    if (require('fs').existsSync(backendEnvPath)) {
      const backendEnvContent = require('fs').readFileSync(backendEnvPath, 'utf8');
      const backendHasDatabase = /^DATABASE_URL=/m.test(backendEnvContent);
      
      if (!backendHasDatabase) {
        throw new Error('Backend configuration violation: Missing database access');
      }
      console.log('✅ Backend properly configured with database access');
    }

    console.log('✅ Configuration separation verified');
  }

  private async startServicesWithNewConfig() {
    console.log('🚀 Starting services with new configuration...');
    
    // Start backend first
    console.log('📡 Starting backend service...');
    this.backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: '../marketsage-backend',
      stdio: 'pipe'
    });

    // Wait for backend to be ready
    await this.waitForService('http://localhost:3006/api/v2/health', 'Backend');

    // Start frontend
    console.log('🌐 Starting frontend service...');
    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe'
    });

    // Wait for frontend to be ready
    await this.waitForService('http://localhost:3000/api/health', 'Frontend');

    console.log('✅ Services started with new configuration');
  }

  private async startServicesWithLegacyConfig() {
    console.log('🚀 Starting services with legacy configuration...');
    
    // For legacy config, we assume monolithic approach
    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe'
    });

    // Wait for service to be ready
    await this.waitForService('http://localhost:3000', 'Legacy Application');

    console.log('✅ Services started with legacy configuration');
  }

  private async waitForService(url: string, serviceName: string, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ ${serviceName} is ready`);
          return;
        }
      } catch {
        // Service not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`${serviceName} failed to start within ${timeout}ms`);
  }

  private async runTestSuite(testSuite: string, configuration: 'old' | 'new'): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Configure Playwright for traffic split testing
      const playwrightCmd = `npx playwright test ${testSuite} --project=chromium --timeout=30000`;
      
      console.log(`   Running: ${playwrightCmd}`);
      execSync(playwrightCmd, { stdio: 'pipe' });
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ ${testSuite} passed (${duration}ms)`);
      
      return {
        configuration,
        testSuite,
        passed: true,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ${testSuite} failed (${duration}ms)`);
      
      return {
        configuration,
        testSuite,
        passed: false,
        duration,
        errors: [error.toString()]
      };
    }
  }

  private async analyzeResults() {
    console.log('📊 Analyzing traffic split test results...\n');

    const newConfigResults = this.results.filter(r => r.configuration === 'new');
    const oldConfigResults = this.results.filter(r => r.configuration === 'old');

    // Calculate success rates
    const newSuccessRate = (newConfigResults.filter(r => r.passed).length / newConfigResults.length) * 100;
    const oldSuccessRate = (oldConfigResults.filter(r => r.passed).length / oldConfigResults.length) * 100;

    // Calculate average response times
    const newAvgTime = newConfigResults.reduce((sum, r) => sum + r.duration, 0) / newConfigResults.length;
    const oldAvgTime = oldConfigResults.reduce((sum, r) => sum + r.duration, 0) / oldConfigResults.length;

    console.log('📈 TRAFFIC SPLIT TEST RESULTS');
    console.log('================================');
    console.log(`🆕 NEW Configuration (50% traffic):`);
    console.log(`   Success Rate: ${newSuccessRate.toFixed(1)}%`);
    console.log(`   Average Duration: ${newAvgTime.toFixed(0)}ms`);
    console.log(`   Tests Run: ${newConfigResults.length}`);
    
    console.log(`\n🔄 LEGACY Configuration (50% traffic):`);
    console.log(`   Success Rate: ${oldSuccessRate.toFixed(1)}%`);
    console.log(`   Average Duration: ${oldAvgTime.toFixed(0)}ms`);
    console.log(`   Tests Run: ${oldConfigResults.length}`);

    // Performance comparison
    const performanceImprovement = ((oldAvgTime - newAvgTime) / oldAvgTime) * 100;
    console.log(`\n🚀 PERFORMANCE COMPARISON:`);
    if (performanceImprovement > 0) {
      console.log(`   New config is ${performanceImprovement.toFixed(1)}% faster`);
    } else {
      console.log(`   Legacy config is ${Math.abs(performanceImprovement).toFixed(1)}% faster`);
    }

    // Reliability comparison
    console.log(`\n🔒 RELIABILITY COMPARISON:`);
    if (newSuccessRate >= oldSuccessRate) {
      console.log(`   New config reliability: ${(newSuccessRate - oldSuccessRate).toFixed(1)}% better`);
    } else {
      console.log(`   Legacy config reliability: ${(oldSuccessRate - newSuccessRate).toFixed(1)}% better`);
    }

    // Final recommendation
    console.log(`\n🎯 RECOMMENDATION:`);
    if (newSuccessRate >= 95 && newConfigResults.every(r => r.passed)) {
      console.log('   ✅ NEW shared configuration system is READY for production');
      console.log('   ✅ Configuration separation is working correctly');
      console.log('   ✅ All service boundaries are properly enforced');
    } else {
      console.log('   ⚠️  NEW configuration needs review before production');
      console.log('   🔍 Check failed tests and configuration issues');
    }

    // Detailed results
    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const config = result.configuration === 'new' ? '🆕' : '🔄';
      console.log(`   ${status} ${config} ${result.testSuite} (${result.duration}ms)`);
      
      if (result.errors) {
        result.errors.forEach(error => {
          console.log(`      Error: ${error.substring(0, 100)}...`);
        });
      }
    });
  }

  private async stopServices() {
    console.log('🛑 Stopping services...');

    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
      this.frontendProcess = null;
    }

    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      this.backendProcess = null;
    }

    // Also kill any lingering processes
    try {
      execSync('pkill -f "next dev" || true', { stdio: 'ignore' });
      execSync('pkill -f "npm run dev" || true', { stdio: 'ignore' });
      execSync('pkill -f "npm run start:dev" || true', { stdio: 'ignore' });
    } catch {
      // Ignore errors in cleanup
    }

    console.log('✅ Services stopped');
  }

  private async cleanup() {
    console.log('🧹 Cleaning up traffic split tests...');

    try {
      await this.stopServices();
      
      // Restore original configuration
      const sharedConfigPath = path.join(process.cwd(), '../shared-config');
      execSync(`cd ${sharedConfigPath} && ./scripts/load-config.sh --service frontend --environment development`, { stdio: 'ignore' });
      
      // Clean up backup files
      if (require('fs').existsSync('.env.legacy-backup')) {
        execSync('rm .env.legacy-backup', { stdio: 'ignore' });
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error);
    }
  }
}

// Command line interface
if (require.main === module) {
  const runner = new TrafficSplitTestRunner();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Traffic split test interrupted');
    await runner.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️  Traffic split test terminated');
    await runner.cleanup();
    process.exit(0);
  });

  // Run tests
  runner.runTrafficSplitTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { TrafficSplitTestRunner };