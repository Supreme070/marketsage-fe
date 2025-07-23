/**
 * Integration Test Setup for MCP Servers
 * 
 * This module provides utilities for setting up real database environments
 * for testing MCP servers with actual seeded data.
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

// Load environment variables
dotenv.config();

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  process.env.DATABASE_URL?.replace('/marketsage', '/marketsage_test') ||
  "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage_test?schema=public";

// Create test Prisma client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL
    }
  }
});

/**
 * Database setup utilities
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private isSetup = false;

  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  /**
   * Setup test database with fresh schema and seed data
   */
  async setup(): Promise<void> {
    if (this.isSetup) return;

    console.log('🏗️  Setting up test database...');
    console.log(`📊 Test Database URL: ${TEST_DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);

    try {
      // Ensure test database exists
      await this.ensureTestDatabase();

      // Run migrations
      await this.runMigrations();

      // Seed base data
      await this.seedBaseData();

      // Seed MCP-specific data
      await this.seedMCPData();

      this.isSetup = true;
      console.log('✅ Test database setup complete');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up test database
   */
  async teardown(): Promise<void> {
    if (!this.isSetup) return;

    console.log('🧹 Cleaning up test database...');
    try {
      await this.cleanupTestData();
      await testPrisma.$disconnect();
      this.isSetup = false;
      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Reset database between tests
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting test database...');
    try {
      await this.cleanupTestData();
      await this.seedBaseData();
      await this.seedMCPData();
      console.log('✅ Test database reset complete');
    } catch (error) {
      console.error('❌ Test database reset failed:', error);
      throw error;
    }
  }

  /**
   * Ensure test database exists
   */
  private async ensureTestDatabase(): Promise<void> {
    try {
      // Try to connect to test database
      await testPrisma.$connect();
      console.log('📊 Test database connection verified');
    } catch (error) {
      console.log('🏗️  Test database does not exist, attempting to create...');
      
      // If using Docker, the database should already exist
      // If using local setup, we might need to create it
      try {
        // Try connecting again after a brief delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testPrisma.$connect();
        console.log('📊 Test database connection established');
      } catch (retryError) {
        console.error('❌ Could not connect to test database:', retryError);
        throw new Error('Test database is not available. Please ensure the test database is running.');
      }
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    console.log('📋 Running database migrations...');
    try {
      // Set the test database URL for migration
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = TEST_DATABASE_URL;
      
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: path.resolve(process.cwd())
      });
      
      // Restore original database URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }
      
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Seed base data (organizations, users, contacts, campaigns)
   */
  private async seedBaseData(): Promise<void> {
    console.log('🌱 Seeding base test data...');
    try {
      // Seed basic organizations and users
      const testOrg = await testPrisma.organization.create({
        data: {
          id: 'test-org-1',
          name: 'Test Organization',
          plan: 'ENTERPRISE',
          websiteUrl: 'https://test-org.com',
          address: 'Lagos, Nigeria'
        }
      });

      const testUser = await testPrisma.user.create({
        data: {
          id: 'test-user-1',
          name: 'Test User',
          email: 'test@test-org.com',
          role: 'ADMIN',
          organizationId: testOrg.id
        }
      });

      // Seed test contacts
      await testPrisma.contact.createMany({
        data: [
          {
            id: 'test-contact-1',
            email: 'contact1@test.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+234123456789',
            organizationId: testOrg.id,
            status: 'ACTIVE'
          },
          {
            id: 'test-contact-2',
            email: 'contact2@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+234987654321',
            organizationId: testOrg.id,
            status: 'ACTIVE'
          },
          {
            id: 'test-contact-3',
            email: 'contact3@test.com',
            firstName: 'Bob',
            lastName: 'Johnson',
            phone: '+234555666777',
            organizationId: testOrg.id,
            status: 'INACTIVE'
          }
        ]
      });

      // Seed test campaigns
      await testPrisma.emailCampaign.createMany({
        data: [
          {
            id: 'test-email-campaign-1',
            name: 'Welcome Email Series',
            subject: 'Welcome to Our Platform!',
            organizationId: testOrg.id,
            userId: testUser.id,
            status: 'COMPLETED',
            scheduledAt: new Date('2024-01-15')
          },
          {
            id: 'test-email-campaign-2',
            name: 'Product Announcement',
            subject: 'Exciting New Features!',
            organizationId: testOrg.id,
            userId: testUser.id,
            status: 'COMPLETED',
            scheduledAt: new Date('2024-01-20')
          }
        ]
      });

      await testPrisma.sMSCampaign.createMany({
        data: [
          {
            id: 'test-sms-campaign-1',
            name: 'Flash Sale Alert',
            message: 'Limited time offer - 50% off!',
            organizationId: testOrg.id,
            userId: testUser.id,
            status: 'COMPLETED',
            scheduledAt: new Date('2024-01-25')
          }
        ]
      });

      await testPrisma.whatsAppCampaign.createMany({
        data: [
          {
            id: 'test-whatsapp-campaign-1',
            name: 'Customer Support Follow-up',
            message: 'How was your experience with our support?',
            organizationId: testOrg.id,
            userId: testUser.id,
            status: 'COMPLETED',
            scheduledAt: new Date('2024-01-30')
          }
        ]
      });

      console.log('✅ Base test data seeded successfully');
    } catch (error) {
      console.error('❌ Base data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed MCP-specific test data by running the MCP seed scripts
   */
  private async seedMCPData(): Promise<void> {
    console.log('🔄 Seeding MCP test data...');
    
    try {
      // Import and run MCP seed scripts with test database
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = TEST_DATABASE_URL;

      // Dynamically import seed scripts
      const seedCampaignAnalytics = (await import('../../../scripts/seed-mcp-campaign-analytics')).default;
      const seedCustomerPredictions = (await import('../../../scripts/seed-mcp-customer-predictions')).default;
      const seedVisitorSessions = (await import('../../../scripts/seed-mcp-visitor-sessions')).default;
      const seedMonitoringMetrics = (await import('../../../scripts/seed-mcp-monitoring-metrics')).default;

      // Run seed scripts in sequence
      await seedCampaignAnalytics();
      await seedCustomerPredictions();
      await seedVisitorSessions();
      await seedMonitoringMetrics();

      // Restore original database URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }

      console.log('✅ MCP test data seeded successfully');
    } catch (error) {
      console.error('❌ MCP data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data
   */
  private async cleanupTestData(): Promise<void> {
    try {
      // Clean up in reverse dependency order
      await testPrisma.mCPMonitoringMetrics.deleteMany();
      await testPrisma.mCPVisitorSessions.deleteMany();
      await testPrisma.mCPCustomerPredictions.deleteMany();
      await testPrisma.mCPCampaignMetrics.deleteMany();
      
      await testPrisma.whatsAppCampaign.deleteMany();
      await testPrisma.sMSCampaign.deleteMany();
      await testPrisma.emailCampaign.deleteMany();
      await testPrisma.contact.deleteMany();
      await testPrisma.user.deleteMany();
      await testPrisma.organization.deleteMany();
      
      console.log('🧹 Test data cleanup completed');
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get test data counts for verification
   */
  async getDataCounts(): Promise<any> {
    try {
      const counts = {
        organizations: await testPrisma.organization.count(),
        users: await testPrisma.user.count(),
        contacts: await testPrisma.contact.count(),
        emailCampaigns: await testPrisma.emailCampaign.count(),
        smsCampaigns: await testPrisma.sMSCampaign.count(),
        whatsappCampaigns: await testPrisma.whatsAppCampaign.count(),
        mcpCampaignMetrics: await testPrisma.mCPCampaignMetrics.count(),
        mcpCustomerPredictions: await testPrisma.mCPCustomerPredictions.count(),
        mcpVisitorSessions: await testPrisma.mCPVisitorSessions.count(),
        mcpMonitoringMetrics: await testPrisma.mCPMonitoringMetrics.count()
      };
      return counts;
    } catch (error) {
      console.error('❌ Error getting data counts:', error);
      throw error;
    }
  }
}

/**
 * Global test setup function
 */
export async function setupIntegrationTests(): Promise<void> {
  const dbManager = TestDatabaseManager.getInstance();
  await dbManager.setup();
}

/**
 * Global test teardown function
 */
export async function teardownIntegrationTests(): Promise<void> {
  const dbManager = TestDatabaseManager.getInstance();
  await dbManager.teardown();
}

/**
 * Reset test data between tests
 */
export async function resetTestData(): Promise<void> {
  const dbManager = TestDatabaseManager.getInstance();
  await dbManager.reset();
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private measurements: Map<string, number[]> = new Map();

  start(): void {
    this.startTime = Date.now();
  }

  measure(operation: string): number {
    const duration = Date.now() - this.startTime;
    
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    this.measurements.get(operation)!.push(duration);
    
    return duration;
  }

  getStats(operation: string): { avg: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(operation) || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [operation, _] of this.measurements) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  reset(): void {
    this.measurements.clear();
  }
}

/**
 * Docker environment detection
 */
export function isDockerEnvironment(): boolean {
  return process.env.DOCKER_ENV === 'true' || 
         process.env.DATABASE_URL?.includes('marketsage-db') ||
         false;
}

/**
 * Environment configuration for tests
 */
export const testConfig = {
  database: {
    url: TEST_DATABASE_URL,
    isDocker: isDockerEnvironment()
  },
  timeouts: {
    database: 30000, // 30 seconds
    mcp: 10000,      // 10 seconds
    integration: 60000 // 60 seconds
  },
  performance: {
    maxResponseTime: 2000, // 2 seconds
    maxQueryTime: 1000,    // 1 second
    maxConcurrentOperations: 10
  }
};

export default {
  TestDatabaseManager,
  setupIntegrationTests,
  teardownIntegrationTests,
  resetTestData,
  PerformanceTracker,
  testPrisma,
  testConfig
};
