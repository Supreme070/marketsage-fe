/**
 * Global Setup for MCP Integration Tests
 * 
 * Runs once before all test suites to prepare the test environment.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  process.env.DATABASE_URL?.replace('/marketsage', '/marketsage_test') ||
  "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage_test?schema=public";

export default async function globalSetup(): Promise<void> {
  console.log('🏗️  Global Setup: Preparing MCP Integration Test Environment');
  console.log('============================================================');
  
  try {
    // Step 1: Verify test database connection
    console.log('📊 Step 1: Verifying test database connection...');
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL
        }
      }
    });

    try {
      await testPrisma.$connect();
      console.log('✅ Test database connection successful');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
      
      // Try to wait and retry (useful in Docker environments)
      console.log('⏳ Waiting 5 seconds and retrying...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        await testPrisma.$connect();
        console.log('✅ Test database connection successful on retry');
      } catch (retryError) {
        console.error('❌ Test database connection failed on retry:', retryError);
        throw new Error('Cannot connect to test database. Please ensure the database is running.');
      }
    } finally {
      await testPrisma.$disconnect();
    }

    // Step 2: Run database migrations
    console.log('📋 Step 2: Running database migrations...');
    try {
      // Set test database URL for migration
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = TEST_DATABASE_URL;
      
      execSync('npx prisma migrate deploy', { 
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      });
      
      // Restore original database URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }
      
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.warn('⚠️  Migration may have failed, but continuing with tests:', error);
      // Don't fail setup if migrations fail - the database might already be up to date
    }

    // Step 3: Verify Prisma client generation
    console.log('🔧 Step 3: Verifying Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'pipe',
        timeout: 30000 // 30 seconds timeout
      });
      console.log('✅ Prisma client verified');
    } catch (error) {
      console.warn('⚠️  Prisma generate warning (client may already be generated):', error);
    }

    // Step 4: Create test reports directory
    console.log('📁 Step 4: Creating test reports directory...');
    try {
      execSync('mkdir -p test-reports/integration', { stdio: 'pipe' });
      console.log('✅ Test reports directory created');
    } catch (error) {
      console.warn('⚠️  Could not create test reports directory:', error);
    }

    // Step 5: Clean up any existing test data
    console.log('🧹 Step 5: Cleaning up existing test data...');
    const cleanupPrisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL
        }
      }
    });

    try {
      await cleanupPrisma.$connect();
      
      // Clean up in reverse dependency order
      await cleanupPrisma.mCPMonitoringMetrics.deleteMany();
      await cleanupPrisma.mCPVisitorSessions.deleteMany();
      await cleanupPrisma.mCPCustomerPredictions.deleteMany();
      await cleanupPrisma.mCPCampaignMetrics.deleteMany();
      
      // Don't delete base data (organizations, users, contacts) as they're needed for seeding
      console.log('✅ Existing MCP test data cleaned up');
    } catch (error) {
      console.warn('⚠️  Could not clean up existing test data (may not exist):', error);
    } finally {
      await cleanupPrisma.$disconnect();
    }

    // Step 6: Environment verification
    console.log('🌍 Step 6: Environment verification...');
    console.log(`  Node.js Version: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  Test Database: ${TEST_DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`  Docker Environment: ${process.env.IS_DOCKER_ENV || 'false'}`);
    console.log('✅ Environment verification complete');

    console.log('\n🎉 Global Setup Complete - Ready for Integration Tests!');
    console.log('======================================================');

  } catch (error) {
    console.error('\n💥 Global Setup Failed:', error);
    console.error('======================================');
    
    // Provide helpful troubleshooting information
    console.error('\n🔧 Troubleshooting Tips:');
    console.error('1. Ensure the database is running and accessible');
    console.error('2. Check that DATABASE_URL is correctly configured');
    console.error('3. Verify network connectivity to the database');
    console.error('4. In Docker: ensure containers are running and can communicate');
    console.error('5. Check database credentials and permissions');
    
    throw error;
  }
};