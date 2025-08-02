/**
 * Integration Test Configuration for MCP Data Integration
 * 
 * This configuration file sets up the testing environment for frontend integration tests
 * that use real MCP data connections and database queries.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Test database configuration
export const TEST_DATABASE_CONFIG = {
  host: process.env.TEST_DATABASE_HOST || 'localhost',
  port: Number.parseInt(process.env.TEST_DATABASE_PORT || '5432'),
  database: process.env.TEST_DATABASE_NAME || 'marketsage_test',
  username: process.env.TEST_DATABASE_USER || 'test_user',
  password: process.env.TEST_DATABASE_PASSWORD || 'test_password'
};

// MCP server configuration for testing
export const TEST_MCP_CONFIG = {
  servers: {
    leadpulse: {
      url: process.env.TEST_MCP_LEADPULSE_URL || 'http://localhost:3001/mcp/leadpulse',
      enabled: process.env.TEST_MCP_LEADPULSE_ENABLED === 'true'
    },
    analytics: {
      url: process.env.TEST_MCP_ANALYTICS_URL || 'http://localhost:3002/mcp/analytics',
      enabled: process.env.TEST_MCP_ANALYTICS_ENABLED === 'true'
    },
    campaigns: {
      url: process.env.TEST_MCP_CAMPAIGNS_URL || 'http://localhost:3003/mcp/campaigns',
      enabled: process.env.TEST_MCP_CAMPAIGNS_ENABLED === 'true'
    }
  },
  timeout: 5000,
  retries: 3
};

// Performance thresholds specific to integration tests
export const INTEGRATION_PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER_WITH_DATA: 200, // ms - components with real data
  DATABASE_QUERY: 1000, // ms - database query response time
  MCP_REQUEST: 500, // ms - MCP server request time
  FULL_PAGE_LOAD: 3000, // ms - complete page load with all data
  REAL_TIME_UPDATE: 100 // ms - real-time data update response
};

// Test data seeds for consistent testing
export const TEST_DATA_SEEDS = {
  visitors: [
    {
      id: 'test_visitor_1',
      sessionId: 'test_session_1',
      location: 'Lagos, Nigeria',
      device: 'mobile',
      engagementScore: 85,
      timestamp: new Date('2024-07-19T10:00:00Z')
    },
    {
      id: 'test_visitor_2',
      sessionId: 'test_session_2',
      location: 'Abuja, Nigeria',
      device: 'desktop',
      engagementScore: 92,
      timestamp: new Date('2024-07-19T10:15:00Z')
    }
  ],
  customers: [
    {
      id: 'test_customer_1',
      email: 'test1@example.ng',
      name: 'Test Customer 1',
      segment: 'high_value',
      clv: 5000,
      churnRisk: 0.15
    },
    {
      id: 'test_customer_2',
      email: 'test2@example.ng',
      name: 'Test Customer 2',
      segment: 'medium_value',
      clv: 1500,
      churnRisk: 0.45
    }
  ],
  campaigns: [
    {
      id: 'test_campaign_1',
      name: 'Test Email Campaign',
      type: 'email',
      status: 'active',
      openRate: 0.25,
      clickRate: 0.08,
      conversionRate: 0.04
    }
  ]
};

// Setup functions for integration tests
export const setupIntegrationTest = async () => {
  console.log('Setting up integration test environment...');
  
  // Initialize test database
  await initializeTestDatabase();
  
  // Seed test data
  await seedTestData();
  
  // Start mock MCP servers if needed
  await startMockMCPServers();
  
  console.log('Integration test environment ready');
};

export const teardownIntegrationTest = async () => {
  console.log('Tearing down integration test environment...');
  
  // Clean up test data
  await cleanupTestData();
  
  // Stop mock MCP servers
  await stopMockMCPServers();
  
  console.log('Integration test environment cleaned up');
};

// Database utilities for testing
const initializeTestDatabase = async () => {
  // This would initialize the test database schema
  // In a real implementation, this would use Prisma test database setup
  console.log('Initializing test database schema...');
};

const seedTestData = async () => {
  // This would seed the test database with consistent test data
  console.log('Seeding test database with sample data...');
};

const cleanupTestData = async () => {
  // This would clean up test data after tests complete
  console.log('Cleaning up test database...');
};

// MCP server utilities for testing
const startMockMCPServers = async () => {
  // This would start mock MCP servers for testing
  console.log('Starting mock MCP servers for testing...');
};

const stopMockMCPServers = async () => {
  // This would stop mock MCP servers after testing
  console.log('Stopping mock MCP servers...');
};

// Test helpers for real data scenarios
export const waitForMCPConnection = async (timeout = 5000) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      // Check if MCP servers are responsive
      const response = await fetch(`${TEST_MCP_CONFIG.servers.leadpulse.url}/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('MCP servers did not become available within timeout');
};

export const waitForDatabaseReady = async (timeout = 5000) => {
  // This would wait for test database to be ready
  return new Promise(resolve => setTimeout(resolve, 100));
};

// Data validation helpers
export const validateMCPResponse = (data: any) => {
  if (!data) {
    throw new Error('MCP response is null or undefined');
  }
  
  if (typeof data !== 'object') {
    throw new Error('MCP response is not an object');
  }
  
  // Add more specific validation based on expected data structure
  return true;
};

export const validateDatabaseData = (data: any) => {
  // Validate database query results
  if (!Array.isArray(data) && typeof data !== 'object') {
    throw new Error('Invalid database data format');
  }
  
  return true;
};

// Performance monitoring helpers
export const measureDatabaseQueryTime = async (queryFunction: () => Promise<any>) => {
  const start = performance.now();
  const result = await queryFunction();
  const end = performance.now();
  
  const duration = end - start;
  console.log(`Database query took ${duration.toFixed(2)}ms`);
  
  if (duration > INTEGRATION_PERFORMANCE_THRESHOLDS.DATABASE_QUERY) {
    console.warn(`Database query exceeded threshold: ${duration}ms > ${INTEGRATION_PERFORMANCE_THRESHOLDS.DATABASE_QUERY}ms`);
  }
  
  return { result, duration };
};

export const measureMCPRequestTime = async (requestFunction: () => Promise<any>) => {
  const start = performance.now();
  const result = await requestFunction();
  const end = performance.now();
  
  const duration = end - start;
  console.log(`MCP request took ${duration.toFixed(2)}ms`);
  
  if (duration > INTEGRATION_PERFORMANCE_THRESHOLDS.MCP_REQUEST) {
    console.warn(`MCP request exceeded threshold: ${duration}ms > ${INTEGRATION_PERFORMANCE_THRESHOLDS.MCP_REQUEST}ms`);
  }
  
  return { result, duration };
};

// Error simulation helpers for testing error handling
export const simulateMCPServerDown = () => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/mcp/')) {
      return Promise.reject(new Error('MCP server unavailable'));
    }
    return fetch(url);
  });
};

export const simulateDatabaseDown = () => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/')) {
      return Promise.reject(new Error('Database connection failed'));
    }
    return fetch(url);
  });
};

export const simulateSlowNetwork = (delay = 2000) => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      }, delay);
    });
  });
};

// African market specific test helpers
export const mockAfricanUserContext = () => {
  // Mock Nigerian user location and preferences
  Object.defineProperty(navigator, 'language', {
    value: 'en-NG',
    configurable: true
  });
  
  Object.defineProperty(navigator, 'languages', {
    value: ['en-NG', 'ha', 'yo', 'ig', 'en'],
    configurable: true
  });
  
  // Mock Nigerian timezone
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
    resolvedOptions: () => ({ timeZone: 'Africa/Lagos' })
  }));
  
  // Mock mobile-first context (high mobile usage in Africa)
  Object.defineProperty(window, 'innerWidth', {
    value: 375,
    configurable: true
  });
  
  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType: '3g',
      downlink: 1.2,
      rtt: 400,
      saveData: false
    },
    configurable: true
  });
};

export const mockAfricanNetworkConditions = (effectiveType: '2g' | '3g' | '4g' = '3g') => {
  const networkConfigs = {
    '2g': { downlink: 0.25, rtt: 800, saveData: true },
    '3g': { downlink: 1.5, rtt: 300, saveData: false },
    '4g': { downlink: 10, rtt: 100, saveData: false }
  };
  
  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType,
      ...networkConfigs[effectiveType]
    },
    configurable: true
  });
};

// Export all configuration for use in tests
export default {
  TEST_DATABASE_CONFIG,
  TEST_MCP_CONFIG,
  INTEGRATION_PERFORMANCE_THRESHOLDS,
  TEST_DATA_SEEDS,
  setupIntegrationTest,
  teardownIntegrationTest,
  waitForMCPConnection,
  waitForDatabaseReady,
  validateMCPResponse,
  validateDatabaseData,
  measureDatabaseQueryTime,
  measureMCPRequestTime,
  simulateMCPServerDown,
  simulateDatabaseDown,
  simulateSlowNetwork,
  mockAfricanUserContext,
  mockAfricanNetworkConditions
};