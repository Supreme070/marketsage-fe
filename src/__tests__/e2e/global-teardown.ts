import type { FullConfig } from '@playwright/test';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Global teardown for MarketSage E2E tests
 * Cleans up test data and stops services
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up MarketSage E2E test environment...');

  try {
    // 1. Stop MCP servers
    console.log('🔗 Stopping MCP servers...');
    await execAsync('pkill -f "mcp-server" || true');

    // 2. Clean up test database
    console.log('📊 Cleaning up test database...');
    await execAsync('npm run db:reset');

    // 3. Remove authentication files
    console.log('🗑️ Removing test authentication...');
    await execAsync('rm -f src/__tests__/e2e/auth.json');

    console.log('✅ E2E test environment cleaned up!');
  } catch (error) {
    console.error('❌ Failed to cleanup E2E environment:', error);
    // Don't throw error in teardown to avoid hiding test failures
  }
}

export default globalTeardown;