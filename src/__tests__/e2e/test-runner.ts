#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { DatabaseSeeder } from './database-seeder';

/**
 * E2E Test Runner
 * Coordinates test execution, database setup, and cleanup
 */

class E2ETestRunner {
  private seeder: DatabaseSeeder;

  constructor() {
    this.seeder = new DatabaseSeeder();
  }

  async runTests() {
    console.log('🚀 Starting MarketSage E2E Test Suite...\n');

    try {
      // Step 1: Environment checks
      await this.checkEnvironment();

      // Step 2: Database setup
      await this.setupDatabase();

      // Step 3: Start application
      await this.startApplication();

      // Step 4: Run tests
      await this.executeTests();

      console.log('\n✅ All E2E tests completed successfully!');

    } catch (error) {
      console.error('\n❌ E2E tests failed:', error);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async checkEnvironment() {
    console.log('🔍 Checking environment...');

    // Check if required environment variables are set
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Check if application is not already running
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        console.log('⚠️  Application already running on port 3000');
      }
    } catch {
      // Application not running, which is expected
    }

    console.log('✅ Environment check passed');
  }

  private async setupDatabase() {
    console.log('🗄️  Setting up test database...');

    try {
      // Run database migrations
      execSync('npm run db:migrate', { stdio: 'inherit' });

      // Seed database with test data
      await this.seeder.seedAll();

      console.log('✅ Database setup completed');
    } catch (error) {
      throw new Error(`Database setup failed: ${error}`);
    }
  }

  private async startApplication() {
    console.log('🖥️  Starting application...');

    // Start the application in background
    const appProcess = execSync('npm run build', { stdio: 'inherit' });

    // Wait for application to be ready
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
          console.log('✅ Application started successfully');
          return;
        }
      } catch {
        // Still starting up
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    }

    throw new Error('Application failed to start within 60 seconds');
  }

  private async executeTests() {
    console.log('🧪 Executing E2E tests...');

    const testSuites = [
      'auth-dashboard.test.ts',
      'campaign-management.test.ts',
      'contact-management.test.ts',
      'workflow-automation.test.ts',
      'analytics-leadpulse.test.ts',
      'mcp-integration.test.ts',
      'performance-cross-browser.test.ts'
    ];

    // Run tests based on command line arguments
    const args = process.argv.slice(2);
    const testPattern = args.includes('--test') ? args[args.indexOf('--test') + 1] : undefined;
    const browser = args.includes('--browser') ? args[args.indexOf('--browser') + 1] : 'chromium';
    const headed = args.includes('--headed');
    const debug = args.includes('--debug');

    let playwrightCmd = 'npx playwright test';
    
    if (testPattern) {
      playwrightCmd += ` --grep "${testPattern}"`;
    }
    
    playwrightCmd += ` --project=${browser}`;
    
    if (headed) {
      playwrightCmd += ' --headed';
    }
    
    if (debug) {
      playwrightCmd += ' --debug';
    }

    // Add timeout for CI environments
    if (process.env.CI) {
      playwrightCmd += ' --timeout=60000';
    }

    try {
      execSync(playwrightCmd, { stdio: 'inherit' });
      console.log('✅ E2E tests passed');
    } catch (error) {
      throw new Error(`E2E tests failed: ${error}`);
    }
  }

  private async cleanup() {
    console.log('🧹 Cleaning up...');

    try {
      // Clean up test database
      await this.seeder.cleanup();

      // Stop application if we started it
      execSync('pkill -f "next start" || true', { stdio: 'ignore' });

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error);
    }
  }
}

// Command line interface
if (require.main === module) {
  const runner = new E2ETestRunner();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Test run interrupted');
    await runner.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️  Test run terminated');
    await runner.cleanup();
    process.exit(0);
  });

  // Run tests
  runner.runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { E2ETestRunner };