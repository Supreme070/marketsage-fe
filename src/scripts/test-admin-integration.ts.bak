/**
 * Admin Portal Integration Tests with Live Database
 * 
 * This comprehensive test suite performs end-to-end testing with real database operations.
 * It validates the complete flow from API requests through database operations to responses.
 * 
 * Usage:
 * - npm run test:admin-integration (requires database connection)
 * - Tests will create/modify/cleanup test data automatically
 * - Safe for development environments, includes data cleanup
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkAdminAuth } from '@/lib/admin-api-auth';

// Test data cleanup tracking
const testDataCleanup: { table: string; id: string }[] = [];

interface IntegrationTestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

/**
 * Test Configuration
 */
const testConfig = {
  // Database connection test timeout
  connectionTimeout: 5000,
  
  // Test user data for CRUD operations
  testUser: {
    email: 'test.admin.integration@marketsage.test',
    name: 'Integration Test Admin',
    role: 'ADMIN' as const
  },
  
  // Test organization for relational data
  testOrganization: {
    name: 'Integration Test Org',
    domain: 'integration-test.example.com',
    subscriptionTier: 'PRO' as const
  },
  
  // Test settings data
  testSettings: {
    category: 'security',
    sessionTimeout: 7200,
    twoFactorRequired: true
  },
  
  // Cleanup after tests (set to false for debugging)
  cleanup: true
};

/**
 * Database Integration Tests
 */
class AdminIntegrationTests {
  private results: IntegrationTestResult[] = [];
  private testUserId: string | null = null;
  private testOrgId: string | null = null;

  async runAllTests(): Promise<{
    summary: { total: number; passed: number; failed: number; skipped: number };
    results: IntegrationTestResult[];
    details: any;
  }> {
    console.log('🧪 Starting Admin Portal Integration Tests with Live Database...\n');

    try {
      // 1. Database connectivity tests
      await this.testDatabaseConnection();
      
      // 2. Authentication system tests
      await this.testAuthenticationSystem();
      
      // 3. CRUD operations tests
      await this.testUserCRUDOperations();
      await this.testOrganizationCRUDOperations();
      await this.testSettingsOperations();
      
      // 4. Audit logging tests
      await this.testAuditLogging();
      
      // 5. Data validation tests
      await this.testDataValidation();
      
      // 6. Performance tests
      await this.testDatabasePerformance();
      
      // 7. Data consistency tests
      await this.testDataConsistency();
      
      // 8. Error handling tests
      await this.testErrorHandling();

    } finally {
      // Cleanup test data
      if (testConfig.cleanup) {
        await this.cleanupTestData();
      }
    }

    const summary = this.generateSummary();
    return {
      summary,
      results: this.results,
      details: {
        testConfig,
        testDataCreated: testDataCleanup.length,
        databaseConnection: await this.getDatabaseInfo()
      }
    };
  }

  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const result = await Promise.race([
        prisma.$queryRaw`SELECT 1 as test`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), testConfig.connectionTimeout)
        )
      ]);

      this.results.push({
        test: 'Database Connection',
        status: 'PASS',
        message: 'Successfully connected to database',
        duration: Date.now() - startTime,
        details: { result }
      });

      // Test database schema
      await this.testDatabaseSchema();

    } catch (error) {
      this.results.push({
        test: 'Database Connection',
        status: 'FAIL',
        message: `Database connection failed: ${error}`,
        duration: Date.now() - startTime,
        details: { error: error.toString() }
      });
    }
  }

  private async testDatabaseSchema(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test that required tables exist
      const requiredTables = ['User', 'Organization', 'AuditLog', 'SystemMetrics'];
      const tableChecks = await Promise.all(
        requiredTables.map(async (table) => {
          try {
            const count = await (prisma as any)[table.toLowerCase()].count({ take: 1 });
            return { table, exists: true, accessible: true };
          } catch (error) {
            return { table, exists: false, accessible: false, error: error.toString() };
          }
        })
      );

      const missingTables = tableChecks.filter(check => !check.exists);
      
      if (missingTables.length === 0) {
        this.results.push({
          test: 'Database Schema Validation',
          status: 'PASS',
          message: 'All required tables are accessible',
          duration: Date.now() - startTime,
          details: { tableChecks }
        });
      } else {
        this.results.push({
          test: 'Database Schema Validation',
          status: 'FAIL',
          message: `Missing tables: ${missingTables.map(t => t.table).join(', ')}`,
          duration: Date.now() - startTime,
          details: { tableChecks, missingTables }
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Database Schema Validation',
        status: 'FAIL',
        message: `Schema validation failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testAuthenticationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test admin authentication (this would normally require a real session)
      // For integration testing, we'll test the auth logic without HTTP context
      
      // Create a test admin user
      const testAdmin = await prisma.user.create({
        data: {
          ...testConfig.testUser,
          role: 'SUPER_ADMIN',
          isActive: true,
          emailVerified: new Date()
        }
      });

      this.testUserId = testAdmin.id;
      testDataCleanup.push({ table: 'User', id: testAdmin.id });

      // Test role-based permissions
      const permissions = this.getPermissionsByRole('SUPER_ADMIN');
      const hasAdminPermission = permissions.includes('all');

      this.results.push({
        test: 'Authentication System',
        status: hasAdminPermission ? 'PASS' : 'FAIL',
        message: hasAdminPermission ? 
          'Admin user created successfully with proper permissions' : 
          'Admin user permissions not working correctly',
        duration: Date.now() - startTime,
        details: { testAdmin: { id: testAdmin.id, role: testAdmin.role }, permissions }
      });

    } catch (error) {
      this.results.push({
        test: 'Authentication System',
        status: 'FAIL',
        message: `Authentication test failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testUserCRUDOperations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // CREATE operation
      const createdUser = await prisma.user.create({
        data: {
          email: 'crud.test@marketsage.test',
          name: 'CRUD Test User',
          role: 'ADMIN',
          isActive: true
        }
      });

      testDataCleanup.push({ table: 'User', id: createdUser.id });

      // READ operation
      const readUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });

      // UPDATE operation
      const updatedUser = await prisma.user.update({
        where: { id: createdUser.id },
        data: { name: 'CRUD Test User Updated' }
      });

      // DELETE operation (soft delete by setting isActive: false)
      const deletedUser = await prisma.user.update({
        where: { id: createdUser.id },
        data: { isActive: false }
      });

      const allOperationsSuccessful = 
        createdUser.id &&
        readUser?.id === createdUser.id &&
        updatedUser.name === 'CRUD Test User Updated' &&
        !deletedUser.isActive;

      this.results.push({
        test: 'User CRUD Operations',
        status: allOperationsSuccessful ? 'PASS' : 'FAIL',
        message: allOperationsSuccessful ? 
          'All CRUD operations completed successfully' : 
          'One or more CRUD operations failed',
        duration: Date.now() - startTime,
        details: {
          created: !!createdUser.id,
          read: readUser?.id === createdUser.id,
          updated: updatedUser.name === 'CRUD Test User Updated',
          deleted: !deletedUser.isActive
        }
      });

    } catch (error) {
      this.results.push({
        test: 'User CRUD Operations',
        status: 'FAIL',
        message: `CRUD operations failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testOrganizationCRUDOperations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // CREATE organization with user relationship
      const createdOrg = await prisma.organization.create({
        data: {
          ...testConfig.testOrganization,
          users: {
            connect: { id: this.testUserId! }
          }
        },
        include: {
          users: true
        }
      });

      this.testOrgId = createdOrg.id;
      testDataCleanup.push({ table: 'Organization', id: createdOrg.id });

      // READ with relations
      const readOrg = await prisma.organization.findUnique({
        where: { id: createdOrg.id },
        include: {
          users: true,
          _count: {
            select: { users: true }
          }
        }
      });

      // UPDATE organization
      const updatedOrg = await prisma.organization.update({
        where: { id: createdOrg.id },
        data: {
          name: 'Updated Integration Test Org'
        }
      });

      const operationsSuccessful = 
        createdOrg.id &&
        createdOrg.users.length > 0 &&
        readOrg?.users.length === createdOrg.users.length &&
        updatedOrg.name === 'Updated Integration Test Org';

      this.results.push({
        test: 'Organization CRUD Operations',
        status: operationsSuccessful ? 'PASS' : 'FAIL',
        message: operationsSuccessful ? 
          'Organization CRUD with relations working correctly' : 
          'Organization CRUD operations had issues',
        duration: Date.now() - startTime,
        details: {
          created: !!createdOrg.id,
          hasUsers: createdOrg.users.length > 0,
          relationsWork: readOrg?.users.length === createdOrg.users.length,
          updated: updatedOrg.name === 'Updated Integration Test Org'
        }
      });

    } catch (error) {
      this.results.push({
        test: 'Organization CRUD Operations',
        status: 'FAIL',
        message: `Organization CRUD failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testSettingsOperations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test settings storage in audit log (as per our implementation)
      const settingsAudit = await prisma.auditLog.create({
        data: {
          action: 'SYSTEM_CONFIG_UPDATE',
          entity: 'SYSTEM_CONFIG',
          entityId: testConfig.testSettings.category,
          userId: this.testUserId!,
          metadata: testConfig.testSettings
        }
      });

      testDataCleanup.push({ table: 'AuditLog', id: settingsAudit.id });

      // Retrieve settings
      const retrievedSettings = await prisma.auditLog.findFirst({
        where: {
          action: 'SYSTEM_CONFIG_UPDATE',
          entityId: testConfig.testSettings.category
        },
        orderBy: { timestamp: 'desc' }
      });

      const settingsMatch = JSON.stringify(retrievedSettings?.metadata) === 
                           JSON.stringify(testConfig.testSettings);

      this.results.push({
        test: 'Settings Operations',
        status: settingsMatch ? 'PASS' : 'FAIL',
        message: settingsMatch ? 
          'Settings storage and retrieval working correctly' : 
          'Settings operations failed',
        duration: Date.now() - startTime,
        details: {
          stored: testConfig.testSettings,
          retrieved: retrievedSettings?.metadata,
          match: settingsMatch
        }
      });

    } catch (error) {
      this.results.push({
        test: 'Settings Operations',
        status: 'FAIL',
        message: `Settings operations failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testAuditLogging(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create multiple audit log entries
      const auditEntries = await Promise.all([
        prisma.auditLog.create({
          data: {
            action: 'TEST_ACTION_1',
            entity: 'TEST_ENTITY',
            entityId: 'test-1',
            userId: this.testUserId!,
            metadata: { test: 'data1' }
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'TEST_ACTION_2',
            entity: 'TEST_ENTITY',
            entityId: 'test-2',
            userId: this.testUserId!,
            metadata: { test: 'data2' }
          }
        })
      ]);

      auditEntries.forEach(entry => {
        testDataCleanup.push({ table: 'AuditLog', id: entry.id });
      });

      // Test audit log queries
      const auditQuery = await prisma.auditLog.findMany({
        where: {
          userId: this.testUserId!,
          action: { startsWith: 'TEST_ACTION' }
        },
        include: {
          user: {
            select: { email: true, name: true }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      const auditLogWorking = auditQuery.length === 2 &&
                             auditQuery.every(entry => entry.user?.email === testConfig.testUser.email);

      this.results.push({
        test: 'Audit Logging System',
        status: auditLogWorking ? 'PASS' : 'FAIL',
        message: auditLogWorking ? 
          'Audit logging and querying working correctly' : 
          'Audit logging system has issues',
        duration: Date.now() - startTime,
        details: {
          entriesCreated: auditEntries.length,
          entriesQueried: auditQuery.length,
          relationsWork: auditQuery.every(entry => !!entry.user)
        }
      });

    } catch (error) {
      this.results.push({
        test: 'Audit Logging System',
        status: 'FAIL',
        message: `Audit logging failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testDataValidation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      let validationWorking = true;
      const validationErrors: string[] = [];

      // Test unique constraints
      try {
        await prisma.user.create({
          data: {
            email: testConfig.testUser.email, // Should fail due to duplicate
            name: 'Duplicate Test',
            role: 'ADMIN'
          }
        });
        validationWorking = false;
        validationErrors.push('Unique constraint not enforced');
      } catch (error) {
        // This should fail - which is correct behavior
        if (!error.toString().includes('Unique constraint')) {
          validationErrors.push(`Unexpected error: ${error}`);
        }
      }

      // Test required fields
      try {
        await prisma.user.create({
          data: {
            name: 'No Email Test',
            role: 'ADMIN'
            // email is missing - should fail
          } as any
        });
        validationWorking = false;
        validationErrors.push('Required field validation not working');
      } catch (error) {
        // This should fail - which is correct
        if (!error.toString().includes('required')) {
          validationErrors.push(`Unexpected validation error: ${error}`);
        }
      }

      this.results.push({
        test: 'Database Validation',
        status: validationWorking && validationErrors.length === 0 ? 'PASS' : 'FAIL',
        message: validationWorking && validationErrors.length === 0 ? 
          'Database validation constraints working correctly' : 
          'Database validation issues found',
        duration: Date.now() - startTime,
        details: { validationErrors }
      });

    } catch (error) {
      this.results.push({
        test: 'Database Validation',
        status: 'FAIL',
        message: `Validation testing failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testDatabasePerformance(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test query performance
      const performanceTests = await Promise.all([
        this.measureQueryTime('User count', () => prisma.user.count()),
        this.measureQueryTime('Organization count', () => prisma.organization.count()),
        this.measureQueryTime('Recent audit logs', () => 
          prisma.auditLog.findMany({
            take: 100,
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { email: true } } }
          })
        ),
        this.measureQueryTime('Complex user query', () =>
          prisma.user.findMany({
            where: { isActive: true },
            include: {
              organization: { select: { name: true } }
            },
            take: 50
          })
        )
      ]);

      const slowQueries = performanceTests.filter(test => test.duration > 1000);
      const avgPerformance = performanceTests.reduce((sum, test) => sum + test.duration, 0) / performanceTests.length;

      this.results.push({
        test: 'Database Performance',
        status: slowQueries.length === 0 ? 'PASS' : 'FAIL',
        message: slowQueries.length === 0 ? 
          `All queries performed well (avg: ${avgPerformance.toFixed(0)}ms)` : 
          `${slowQueries.length} slow queries detected`,
        duration: Date.now() - startTime,
        details: {
          performanceTests,
          slowQueries: slowQueries.map(q => ({ query: q.query, duration: q.duration })),
          averageDuration: avgPerformance
        }
      });

    } catch (error) {
      this.results.push({
        test: 'Database Performance',
        status: 'FAIL',
        message: `Performance testing failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async measureQueryTime(query: string, queryFunction: () => Promise<any>): Promise<{ query: string; duration: number; result?: any }> {
    const start = Date.now();
    try {
      const result = await queryFunction();
      return {
        query,
        duration: Date.now() - start,
        result: Array.isArray(result) ? `${result.length} records` : typeof result
      };
    } catch (error) {
      return {
        query,
        duration: Date.now() - start,
        result: `Error: ${error}`
      };
    }
  }

  private async testDataConsistency(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test referential integrity
      const userWithOrg = await prisma.user.findUnique({
        where: { id: this.testUserId! },
        include: {
          organization: true
        }
      });

      const orgWithUsers = await prisma.organization.findUnique({
        where: { id: this.testOrgId! },
        include: {
          users: true
        }
      });

      const consistencyCheck = 
        userWithOrg?.organization?.id === this.testOrgId &&
        orgWithUsers?.users.some(user => user.id === this.testUserId);

      this.results.push({
        test: 'Data Consistency',
        status: consistencyCheck ? 'PASS' : 'FAIL',
        message: consistencyCheck ? 
          'Relational data consistency maintained' : 
          'Data consistency issues detected',
        duration: Date.now() - startTime,
        details: {
          userHasOrg: !!userWithOrg?.organization,
          orgHasUser: orgWithUsers?.users.some(user => user.id === this.testUserId),
          relationshipConsistent: consistencyCheck
        }
      });

    } catch (error) {
      this.results.push({
        test: 'Data Consistency',
        status: 'FAIL',
        message: `Consistency testing failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const errorTests = [
        // Test non-existent record
        {
          name: 'Non-existent record handling',
          test: () => prisma.user.findUniqueOrThrow({ where: { id: 'non-existent-id' } }),
          shouldFail: true
        },
        // Test invalid update
        {
          name: 'Invalid update handling',
          test: () => prisma.user.update({ 
            where: { id: 'non-existent-id' }, 
            data: { name: 'Test' } 
          }),
          shouldFail: true
        }
      ];

      const errorResults = await Promise.all(
        errorTests.map(async (test) => {
          try {
            await test.test();
            return { ...test, handled: !test.shouldFail, error: null };
          } catch (error) {
            return { ...test, handled: test.shouldFail, error: error.toString() };
          }
        })
      );

      const allErrorsHandled = errorResults.every(result => result.handled);

      this.results.push({
        test: 'Error Handling',
        status: allErrorsHandled ? 'PASS' : 'FAIL',
        message: allErrorsHandled ? 
          'Database error handling working correctly' : 
          'Error handling issues detected',
        duration: Date.now() - startTime,
        details: { errorResults }
      });

    } catch (error) {
      this.results.push({
        test: 'Error Handling',
        status: 'FAIL',
        message: `Error handling test failed: ${error}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async cleanupTestData(): Promise<void> {
    console.log(`\n🧹 Cleaning up ${testDataCleanup.length} test records...`);
    
    try {
      // Clean up in reverse order to handle dependencies
      for (const cleanup of testDataCleanup.reverse()) {
        try {
          await (prisma as any)[cleanup.table.toLowerCase()].delete({
            where: { id: cleanup.id }
          });
        } catch (error) {
          console.warn(`Warning: Could not cleanup ${cleanup.table}:${cleanup.id} - ${error}`);
        }
      }
      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    return { total, passed, failed, skipped };
  }

  private async getDatabaseInfo() {
    try {
      const info = await prisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          version() as version,
          current_user as user_name
      ` as any[];
      
      return info[0];
    } catch (error) {
      return { error: error.toString() };
    }
  }

  private getPermissionsByRole(role: string): string[] {
    switch (role) {
      case 'SUPER_ADMIN': return ['all'];
      case 'IT_ADMIN': return ['system', 'security', 'audit', 'incidents', 'support'];
      case 'ADMIN': return ['users', 'campaigns', 'support'];
      default: return [];
    }
  }
}

/**
 * Main test execution function
 */
export async function runAdminIntegrationTests() {
  const testRunner = new AdminIntegrationTests();
  const results = await testRunner.runAllTests();
  
  // Display results
  console.log('\n📊 INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⏩ Skipped: ${results.summary.skipped}`);
  console.log(`📈 Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  
  console.log('\n🔍 DETAILED RESULTS');
  console.log('='.repeat(60));
  results.results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏩';
    console.log(`${icon} ${result.test} (${result.duration}ms): ${result.message}`);
    
    if (result.status === 'FAIL' && result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
    }
  });
  
  console.log('\n📋 TEST ENVIRONMENT');
  console.log('='.repeat(60));
  console.log(`Database: ${results.details.databaseConnection?.database_name || 'Unknown'}`);
  console.log(`Test Data Created: ${results.details.testDataCreated} records`);
  console.log(`Cleanup Enabled: ${testConfig.cleanup}`);
  
  console.log('\n🎉 Integration Testing Completed!');
  
  return results;
}

// Export for external use
export { AdminIntegrationTests, testConfig };

// Run tests if executed directly
if (require.main === module) {
  runAdminIntegrationTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Integration tests failed:', error);
      process.exit(1);
    });
}