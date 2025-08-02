import { test as setup, expect } from '@playwright/test';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Authentication setup for E2E tests
 * Creates test user and saves authentication state
 */

const authFile = 'src/__tests__/e2e/auth.json';

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication for E2E tests...');

  try {
    // Ensure clean database state
    await execAsync('npm run db:reset');
    await execAsync('npm run db:migrate');
    
    // Create test user via API or direct database insertion
    await execAsync(`
      npx tsx -e "
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        
        async function createTestUser() {
          const prisma = new PrismaClient();
          
          const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
          
          await prisma.user.upsert({
            where: { email: 'test@marketsage.com' },
            update: {},
            create: {
              email: 'test@marketsage.com',
              name: 'Test User',
              password: hashedPassword,
              role: 'ADMIN',
              emailVerified: new Date(),
              company: 'Test Company',
              industry: 'Technology'
            }
          });
          
          console.log('Test user created successfully');
          await prisma.\$disconnect();
        }
        
        createTestUser().catch(console.error);
      "
    `);

    // Navigate to login page
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('[data-testid="email"]', 'test@marketsage.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    
    // Save authenticated state
    await page.context().storageState({ path: authFile });
    
    console.log('✅ Authentication setup completed');
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  }
});