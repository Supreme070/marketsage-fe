/**
 * Jest Configuration for MCP Integration Tests
 * 
 * Specialized configuration for running integration tests with real database
 * and Docker environment support.
 */

const path = require('path');

module.exports = {
  // Use the same display name for consistency
  displayName: 'MCP Integration Tests',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: path.resolve(__dirname, '../../../..'),

  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/integration/mcp/**/*.test.ts'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/integration/mcp/setup.ts'
  ],

  // Transform TypeScript files
  preset: 'ts-jest',
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client'
  },

  // Test timeout (increased for integration tests)
  testTimeout: 300000, // 5 minutes

  // Run tests in band (sequentially) for database consistency
  maxWorkers: 1,

  // Verbose output for integration tests
  verbose: true,

  // Collect coverage from integration test files
  collectCoverageFrom: [
    'src/mcp/**/*.ts',
    'src/lib/**/*.ts',
    'src/scripts/seed-mcp-*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],

  // Coverage thresholds (lower for integration tests focusing on functionality)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/integration',

  // Environment variables for tests
  setupFiles: ['<rootDir>/src/__tests__/integration/mcp/test-env.ts'],

  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/integration/mcp/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/integration/mcp/global-teardown.ts',

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-reports/integration',
        filename: 'integration-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'MCP Integration Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-reports/integration',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],

  // Cache configuration
  cache: false, // Disable cache for integration tests to ensure fresh runs

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Detect open handles (useful for database connections)
  detectOpenHandles: true,
  forceExit: true,

  // Silence console output during tests (can be disabled for debugging)
  silent: false,

  // Error on deprecated features
  errorOnDeprecated: true,

  // Fail fast on first error (can be disabled for comprehensive testing)
  bail: false,

  // Additional options for Docker environment
  ...(process.env.DOCKER_ENV === 'true' && {
    // Docker-specific timeouts
    testTimeout: 600000, // 10 minutes for Docker
    
    // Additional setup for Docker
    setupFilesAfterEnv: [
      '<rootDir>/src/__tests__/integration/mcp/setup.ts',
      '<rootDir>/src/__tests__/integration/mcp/docker-setup.ts'
    ]
  })
};