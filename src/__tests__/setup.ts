/**
 * Jest Test Setup for MarketSage MCP Tests
 * 
 * This file configures Jest for testing MCP servers with proper mocking
 * and database setup while ensuring real data connections are tested.
 */

import '@testing-library/jest-dom';

// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret-for-mcp-jwt-validation';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/marketsage_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock console.error to reduce noise in tests but keep warnings for debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning') ||
       args[0].includes('React') ||
       args[0].includes('jsdom'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test timeout for MCP tests (they can be slower due to database/Redis operations)
jest.setTimeout(30000);

// Performance monitoring for tests
global.performance = global.performance || {
  now: () => Date.now()
};

// Mock WebSocket for tests that don't need real-time connections
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
})) as any;

// Mock fetch for external API calls in tests
global.fetch = jest.fn();

// Setup test utilities
global.testUtils = {
  generateTestToken: (userId = 'test-user', organizationId = 'test-org') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        id: userId, 
        organizationId,
        jti: `session_${Date.now()}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      },
      process.env.NEXTAUTH_SECRET
    );
  },
  
  createMockRequest: (authToken?: string, meta?: any) => ({
    meta: {
      sessionToken: authToken,
      ...meta
    },
    headers: authToken ? { authorization: `Bearer ${authToken}` } : {},
    params: {}
  }),
  
  createMockAuthContext: (overrides?: any) => ({
    userId: 'test-user-123',
    organizationId: 'test-org-456',
    role: 'USER',
    permissions: ['read:own:contacts', 'write:own:contacts'],
    sessionId: 'test-session',
    ...overrides
  }),
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};

// Global types for test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        generateTestToken: (userId?: string, organizationId?: string) => string;
        createMockRequest: (authToken?: string, meta?: any) => any;
        createMockAuthContext: (overrides?: any) => any;
        delay: (ms: number) => Promise<void>;
      };
    }
  }
  
  var testUtils: {
    generateTestToken: (userId?: string, organizationId?: string) => string;
    createMockRequest: (authToken?: string, meta?: any) => any;
    createMockAuthContext: (overrides?: any) => any;
    delay: (ms: number) => Promise<void>;
  };
}