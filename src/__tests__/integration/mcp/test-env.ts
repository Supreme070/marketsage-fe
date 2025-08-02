/**
 * Test Environment Configuration
 * 
 * Sets up environment variables and configuration for integration tests.
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';

// Configure test database URL if not already set
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  // Create test database URL from main database URL
  const mainDbUrl = process.env.DATABASE_URL;
  
  if (mainDbUrl.includes('/marketsage?')) {
    process.env.TEST_DATABASE_URL = mainDbUrl.replace('/marketsage?', '/marketsage_test?');
  } else if (mainDbUrl.includes('/marketsage')) {
    process.env.TEST_DATABASE_URL = mainDbUrl.replace('/marketsage', '/marketsage_test');
  } else {
    // Fallback to default test database
    process.env.TEST_DATABASE_URL = "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage_test?schema=public";
  }
}

// Set other test-specific configurations
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key-for-integration-tests';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Disable external services in test environment
process.env.DISABLE_EXTERNAL_SERVICES = 'true';
process.env.DISABLE_EMAIL_SENDING = 'true';
process.env.DISABLE_SMS_SENDING = 'true';
process.env.DISABLE_WHATSAPP_SENDING = 'true';

// Set test-specific timeouts
process.env.DATABASE_TIMEOUT = '30000';
process.env.MCP_TIMEOUT = '10000';

// Configure logging for tests
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';

// Docker environment detection
if (process.env.DATABASE_URL?.includes('marketsage-db') || process.env.DOCKER_ENV === 'true') {
  process.env.IS_DOCKER_ENV = 'true';
  console.log('🐳 Docker environment detected for integration tests');
} else {
  process.env.IS_DOCKER_ENV = 'false';
  console.log('💻 Local environment detected for integration tests');
}

// Test database configuration summary
console.log('🔧 Test Environment Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@') || 'Not set'}`);
console.log(`  TEST_DATABASE_URL: ${process.env.TEST_DATABASE_URL?.replace(/\/\/.*@/, '//***:***@') || 'Not set'}`);
console.log(`  DOCKER_ENV: ${process.env.IS_DOCKER_ENV}`);
console.log('');