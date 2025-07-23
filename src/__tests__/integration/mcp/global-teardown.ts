/**
 * Global Teardown for MCP Integration Tests
 * 
 * Runs once after all test suites to clean up the test environment.
 */

import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  process.env.DATABASE_URL?.replace('/marketsage', '/marketsage_test') ||
  "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage_test?schema=public";

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Global Teardown: Cleaning Up MCP Integration Test Environment');
  console.log('================================================================');
  
  try {
    // Step 1: Clean up test database
    console.log('🗑️  Step 1: Cleaning up test database...');
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DATABASE_URL
        }
      }
    });

    try {
      await testPrisma.$connect();
      
      // Clean up all test data in reverse dependency order
      console.log('   Cleaning MCP monitoring metrics...');
      await testPrisma.mCPMonitoringMetrics.deleteMany();
      
      console.log('   Cleaning MCP visitor sessions...');
      await testPrisma.mCPVisitorSessions.deleteMany();
      
      console.log('   Cleaning MCP customer predictions...');
      await testPrisma.mCPCustomerPredictions.deleteMany();
      
      console.log('   Cleaning MCP campaign metrics...');
      await testPrisma.mCPCampaignMetrics.deleteMany();
      
      console.log('   Cleaning test campaigns...');
      await testPrisma.whatsAppCampaign.deleteMany();
      await testPrisma.sMSCampaign.deleteMany();
      await testPrisma.emailCampaign.deleteMany();
      
      console.log('   Cleaning test contacts...');
      await testPrisma.contact.deleteMany();
      
      console.log('   Cleaning test users...');
      await testPrisma.user.deleteMany();
      
      console.log('   Cleaning test organizations...');
      await testPrisma.organization.deleteMany();
      
      console.log('✅ Test database cleaned up successfully');
    } catch (error) {
      console.warn('⚠️  Could not clean up test database (may already be clean):', error);
    } finally {
      await testPrisma.$disconnect();
    }

    // Step 2: Generate final test summary
    console.log('📊 Step 2: Generating test summary...');
    const endTime = new Date();
    console.log(`   Test suite completed at: ${endTime.toISOString()}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'test'}`);
    console.log(`   Docker mode: ${process.env.IS_DOCKER_ENV || 'false'}`);
    console.log('✅ Test summary generated');

    // Step 3: Clean up temporary files and connections
    console.log('🧹 Step 3: Final cleanup...');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('   Garbage collection triggered');
    }
    
    // Clear any remaining timers
    if (process.env.NODE_ENV === 'test') {
      // Clear any intervals that might be running
      const maxTimerId = setTimeout(() => {}, 0);
      for (let i = 1; i < maxTimerId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      console.log('   Cleared timers and intervals');
    }
    
    console.log('✅ Final cleanup completed');

    console.log('\n🎯 Global Teardown Complete - Environment Cleaned');
    console.log('=================================================');

  } catch (error) {
    console.error('\n💥 Global Teardown Failed:', error);
    console.error('===================================');
    
    // Log the error but don't throw - teardown failures shouldn't fail the test suite
    console.warn('⚠️  Teardown errors are logged but won\'t fail the test suite');
    console.warn('💡 Manual cleanup may be required if database connections persist');
  }
};