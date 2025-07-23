#!/usr/bin/env npx tsx

/**
 * Test Script for Supreme AI v3 MCP Integration
 * 
 * This script runs comprehensive tests to verify that the Supreme AI v3 engine
 * is properly using real MCP data connections instead of mock data.
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🤖 Supreme AI v3 MCP Integration Test Suite\n'));
console.log(chalk.yellow('This test verifies that AI decisions are based on real database metrics.\n'));

try {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.MCP_ENABLED = 'true';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketsage_test';
  
  console.log(chalk.green('📋 Test Configuration:'));
  console.log(`   - MCP Enabled: ${process.env.MCP_ENABLED}`);
  console.log(`   - Environment: ${process.env.NODE_ENV}`);
  console.log(`   - Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}\n`);
  
  // Run the tests with detailed output
  console.log(chalk.cyan('🧪 Running integration tests...\n'));
  
  execSync('npx jest src/__tests__/ai/supreme-ai-mcp-integration.test.ts --verbose --no-coverage', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log(chalk.green.bold('\n✅ All tests completed successfully!'));
  console.log(chalk.green('\nThe Supreme AI v3 engine is properly integrated with real MCP data connections.'));
  
} catch (error) {
  console.error(chalk.red.bold('\n❌ Test suite failed!'));
  console.error(chalk.red('Some tests did not pass. Please review the output above.'));
  process.exit(1);
}