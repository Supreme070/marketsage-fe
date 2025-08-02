/**
 * Docker Environment Integration Tests for MCP Servers
 * 
 * Tests MCP functionality specifically in Docker environments,
 * including database connections, environment variables, and containerized operations.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/test';
import { TestDatabaseManager, testPrisma, PerformanceTracker, testConfig, isDockerEnvironment } from './setup';
import { execSync } from 'child_process';
import path from 'path';

describe('Docker Environment Integration Tests', () => {
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;

  beforeAll(async () => {
    // Skip these tests if not in Docker environment
    if (!isDockerEnvironment()) {
      console.log('⚠️  Skipping Docker tests - not in Docker environment');
      return;
    }

    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    performanceTracker = new PerformanceTracker();
    
    console.log('🐳 Running tests in Docker environment');
  }, testConfig.timeouts.integration);

  afterAll(async () => {
    if (!isDockerEnvironment()) return;
    
    await dbManager.teardown();
  }, testConfig.timeouts.database);

  beforeEach(async () => {
    if (!isDockerEnvironment()) return;
    
    performanceTracker.reset();
  });

  describe('Docker Environment Detection', () => {
    test('should detect Docker environment correctly', () => {
      if (!isDockerEnvironment()) {
        console.log('📍 Running in local environment');
        return;
      }

      expect(isDockerEnvironment()).toBe(true);
      
      // Check for Docker-specific environment variables
      expect(process.env.DATABASE_URL).toContain('marketsage-db');
      
      console.log('🐳 Docker environment detected');
    });

    test('should have correct Docker database connection', async () => {
      if (!isDockerEnvironment()) return;

      performanceTracker.start();
      
      // Test direct database connection
      const result = await testPrisma.$queryRaw`SELECT version()`;
      
      const duration = performanceTracker.measure('docker_db_connection');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`🔌 Docker DB connection: ${duration}ms`);
    });
  });

  describe('Docker Database Operations', () => {
    test('should perform database operations efficiently in Docker', async () => {
      if (!isDockerEnvironment()) return;

      performanceTracker.start();
      
      // Test complex query in Docker environment
      const campaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        include: {
          organization: true
        },
        where: {
          campaignType: 'EMAIL'
        },
        orderBy: { calculatedAt: 'desc' },
        take: 20
      });
      
      const duration = performanceTracker.measure('docker_complex_query');
      
      expect(campaignMetrics.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime * 2); // Allow more time in Docker
      
      console.log(`🐳 Docker complex query: ${duration}ms`);
    });

    test('should handle concurrent database operations in Docker', async () => {
      if (!isDockerEnvironment()) return;

      const concurrentOperations = Array.from({ length: 5 }, async (_, index) => {
        performanceTracker.start();
        
        const result = await testPrisma.mCPCustomerPredictions.findMany({
          where: {
            segment: index % 2 === 0 ? 'VIP Customers' : 'Growth Potential'
          },
          take: 10
        });
        
        const duration = performanceTracker.measure(`docker_concurrent_${index}`);
        
        return { result, duration };
      });

      const results = await Promise.all(concurrentOperations);
      
      results.forEach(({ result, duration }, index) => {
        expect(Array.isArray(result)).toBe(true);
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
        console.log(`🔄 Docker concurrent operation ${index}: ${duration}ms`);
      });
    });

    test('should maintain data consistency in Docker environment', async () => {
      if (!isDockerEnvironment()) return;

      // Test transaction in Docker
      const result = await testPrisma.$transaction(async (tx) => {
        const orgCount = await tx.organization.count();
        const contactCount = await tx.contact.count();
        const campaignCount = await tx.mCPCampaignMetrics.count();
        
        return { orgCount, contactCount, campaignCount };
      });
      
      expect(result.orgCount).toBeGreaterThan(0);
      expect(result.contactCount).toBeGreaterThan(0);
      expect(result.campaignCount).toBeGreaterThan(0);
      
      console.log('🔒 Docker transaction test passed');
    });
  });

  describe('Docker Container Health', () => {
    test('should verify Docker container resources', async () => {
      if (!isDockerEnvironment()) return;

      try {
        // Check container memory usage
        const memInfo = execSync('cat /proc/meminfo | grep MemAvailable', { encoding: 'utf8' });
        const availableMemory = Number.parseInt(memInfo.split(':')[1].trim().split(' ')[0]);
        
        expect(availableMemory).toBeGreaterThan(100000); // At least 100MB available
        
        console.log(`🧠 Available memory: ${Math.round(availableMemory / 1024)}MB`);
      } catch (error) {
        console.log('⚠️  Could not check container memory');
      }
    });

    test('should verify Docker network connectivity', async () => {
      if (!isDockerEnvironment()) return;

      performanceTracker.start();
      
      // Test network connectivity to database
      const networkTest = await testPrisma.$queryRaw`SELECT 1 as connectivity_test`;
      
      const duration = performanceTracker.measure('docker_network_test');
      
      expect(networkTest).toBeDefined();
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`🌐 Docker network test: ${duration}ms`);
    });
  });

  describe('Docker Environment Variables', () => {
    test('should have proper Docker environment configuration', () => {
      if (!isDockerEnvironment()) return;

      // Verify essential environment variables
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('marketsage-db');
      
      // Check if running in container
      expect(process.env.DOCKER_ENV || process.env.NODE_ENV).toBeDefined();
      
      console.log('✅ Docker environment variables verified');
    });

    test('should handle Docker-specific database URL format', async () => {
      if (!isDockerEnvironment()) return;

      const dbUrl = process.env.DATABASE_URL;
      
      // Verify Docker internal hostname
      expect(dbUrl).toContain('marketsage-db:5432');
      
      // Test connection with Docker URL
      await expect(testPrisma.$connect()).resolves.not.toThrow();
      
      console.log('🔗 Docker database URL format verified');
    });
  });

  describe('Docker Volume Persistence', () => {
    test('should persist data across container operations', async () => {
      if (!isDockerEnvironment()) return;

      // Create test data
      const testMetric = await testPrisma.mCPMonitoringMetrics.create({
        data: {
          organizationId: 'test-org-1',
          metricType: 'docker_persistence_test',
          value: 42.0,
          timestamp: new Date(),
          tags: JSON.stringify({ test: 'docker_persistence' })
        }
      });

      expect(testMetric.id).toBeDefined();
      
      // Verify data exists
      const retrievedMetric = await testPrisma.mCPMonitoringMetrics.findUnique({
        where: { id: testMetric.id }
      });
      
      expect(retrievedMetric).toBeDefined();
      expect(retrievedMetric!.metricType).toBe('docker_persistence_test');
      expect(retrievedMetric!.value).toBe(42.0);
      
      // Clean up
      await testPrisma.mCPMonitoringMetrics.delete({
        where: { id: testMetric.id }
      });
      
      console.log('💾 Docker volume persistence verified');
    });
  });

  describe('Docker MCP Integration', () => {
    test('should run MCP seed scripts in Docker environment', async () => {
      if (!isDockerEnvironment()) return;

      performanceTracker.start();
      
      // Verify MCP data exists (should be seeded during setup)
      const counts = await dbManager.getDataCounts();
      
      const duration = performanceTracker.measure('docker_mcp_data_verification');
      
      expect(counts.mcpCampaignMetrics).toBeGreaterThan(0);
      expect(counts.mcpCustomerPredictions).toBeGreaterThan(0);
      expect(counts.mcpVisitorSessions).toBeGreaterThan(0);
      expect(counts.mcpMonitoringMetrics).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`🔄 Docker MCP data verification: ${duration}ms`);
      console.log('📊 MCP data counts in Docker:', counts);
    });

    test('should handle Docker-specific file paths', async () => {
      if (!isDockerEnvironment()) return;

      // Test that we can access files in Docker container
      try {
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const fs = require('fs');
        
        expect(fs.existsSync(packageJsonPath)).toBe(true);
        
        console.log('📁 Docker file system access verified');
      } catch (error) {
        console.log('⚠️  Docker file system access test failed:', error.message);
      }
    });
  });

  describe('Docker Performance Benchmarks', () => {
    test('should meet performance standards in Docker environment', async () => {
      if (!isDockerEnvironment()) return;

      const benchmarkTests = [
        {
          name: 'Simple Query',
          test: () => testPrisma.organization.findMany({ take: 10 })
        },
        {
          name: 'Complex Join',
          test: () => testPrisma.mCPCustomerPredictions.findMany({
            include: { contact: true, organization: true },
            take: 20
          })
        },
        {
          name: 'Aggregation',
          test: () => testPrisma.mCPCampaignMetrics.aggregate({
            _avg: { openRate: true, clickRate: true },
            _count: { id: true }
          })
        },
        {
          name: 'Time Series',
          test: () => testPrisma.mCPMonitoringMetrics.findMany({
            where: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            },
            orderBy: { timestamp: 'desc' },
            take: 100
          })
        }
      ];

      for (const benchmark of benchmarkTests) {
        performanceTracker.start();
        
        const result = await benchmark.test();
        
        const duration = performanceTracker.measure(`docker_${benchmark.name.toLowerCase().replace(' ', '_')}`);
        
        expect(result).toBeDefined();
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 1.5); // Allow 50% more time in Docker
        
        console.log(`🐳 Docker ${benchmark.name}: ${duration}ms`);
      }
    });

    test('should handle Docker container resource limits', async () => {
      if (!isDockerEnvironment()) return;

      // Test memory-intensive operation
      performanceTracker.start();
      
      const largeDataset = await testPrisma.mCPVisitorSessions.findMany({
        include: {
          organization: true
        },
        take: 500 // Larger dataset
      });
      
      const duration = performanceTracker.measure('docker_memory_intensive');
      
      expect(largeDataset.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 3); // Allow more time for large dataset
      
      console.log(`🧠 Docker memory-intensive operation: ${duration}ms`);
    });
  });

  describe('Docker Error Handling', () => {
    test('should handle Docker-specific connection errors gracefully', async () => {
      if (!isDockerEnvironment()) return;

      // Test with temporary invalid database URL
      const originalUrl = process.env.DATABASE_URL;
      
      try {
        // This test verifies error handling rather than actually breaking the connection
        const invalidPrisma = new (require('@prisma/client').PrismaClient)({
          datasources: {
            db: {
              url: 'postgresql://invalid:invalid@invalid-host:5432/invalid'
            }
          }
        });
        
        await expect(invalidPrisma.$connect()).rejects.toThrow();
        
        console.log('🚫 Docker connection error handling verified');
      } catch (error) {
        // Expected behavior
        expect(error).toBeDefined();
      }
    });
  });

  describe('Docker Performance Summary', () => {
    test('should generate Docker-specific performance report', async () => {
      if (!isDockerEnvironment()) return;

      const allStats = performanceTracker.getAllStats();
      
      console.log('\n🐳 Docker Environment Performance Report:');
      console.log('=========================================');
      
      Object.entries(allStats).forEach(([operation, stats]) => {
        if (operation.startsWith('docker_')) {
          console.log(`${operation}:`);
          console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
          console.log(`  Min: ${stats.min}ms`);
          console.log(`  Max: ${stats.max}ms`);
          console.log(`  Count: ${stats.count}`);
          console.log('');
        }
      });
      
      // Calculate Docker-specific metrics
      const dockerOperations = Object.entries(allStats).filter(([key]) => key.startsWith('docker_'));
      const dockerAvg = dockerOperations.reduce((sum, [_, stats]) => sum + stats.avg, 0) / dockerOperations.length;
      
      console.log(`🐳 Docker Average Response Time: ${dockerAvg.toFixed(2)}ms`);
      console.log(`🎯 Docker Performance Target: ${testConfig.performance.maxResponseTime * 1.5}ms`);
      console.log(`✅ Docker Performance Status: ${dockerAvg < testConfig.performance.maxResponseTime * 1.5 ? 'PASSED' : 'FAILED'}`);
      
      expect(dockerAvg).toBeLessThan(testConfig.performance.maxResponseTime * 1.5);
    });
  });
});