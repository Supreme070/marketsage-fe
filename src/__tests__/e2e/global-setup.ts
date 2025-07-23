import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global setup for MarketSage E2E tests
 * Prepares database, starts MCP servers, and sets up test data
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up MarketSage E2E test environment...');

  try {
    // 1. Reset and seed database with MCP test data
    console.log('📊 Setting up test database...');
    await execAsync('npm run db:reset');
    await execAsync('npm run db:migrate');
    await execAsync('npm run db:seed');
    await execAsync('npm run seed-mcp-all');

    // 2. Start MCP servers for testing
    console.log('🔗 Starting MCP servers...');
    await execAsync('npm run test:mcp');

    // 3. Create test user and authenticate
    console.log('👤 Creating test user...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login and create test account
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@marketsage.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    
    // Save authentication state
    await context.storageState({ path: 'src/__tests__/e2e/auth.json' });
    
    await browser.close();

    console.log('✅ E2E test environment ready!');
  } catch (error) {
    console.error('❌ Failed to setup E2E environment:', error);
    throw error;
  }
}

export default globalSetup;