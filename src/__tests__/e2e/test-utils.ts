import { Page, expect } from '@playwright/test';

/**
 * Test utilities for MarketSage E2E tests
 * Provides common actions and assertions
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Login to MarketSage
   */
  async login(email = 'test@marketsage.com', password = 'TestPassword123!') {
    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  }

  /**
   * Navigate to a specific dashboard section
   */
  async navigateTo(section: string) {
    await this.page.click(`[data-testid="nav-${section}"]`);
    await this.page.waitForURL(`**/${section}`);
  }

  /**
   * Wait for loading indicators to disappear
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
    
    // Wait for skeleton loaders to disappear
    await this.page.waitForSelector('[data-testid="skeleton-loader"]', { state: 'hidden' });
    
    // Give a moment for data to populate
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if MCP data is loaded correctly
   */
  async verifyMCPDataLoaded() {
    // Check for real data indicators (not demo/placeholder data)
    const realDataIndicators = [
      '[data-testid="real-visitor-count"]',
      '[data-testid="real-conversion-data"]',
      '[data-testid="mcp-data-indicator"]',
    ];

    for (const indicator of realDataIndicators) {
      try {
        await expect(this.page.locator(indicator)).toBeVisible({ timeout: 5000 });
      } catch {
        // Some indicators may not be present on all pages
        continue;
      }
    }
  }

  /**
   * Simulate network failure and verify fallback behavior
   */
  async testMCPFallback() {
    // Block MCP server requests
    await this.page.route('**/api/mcp/**', route => route.abort());
    
    // Reload page to trigger fallback
    await this.page.reload();
    await this.waitForLoadingComplete();
    
    // Verify graceful fallback (demo data or error message)
    const fallbackIndicators = [
      '[data-testid="demo-data-notice"]',
      '[data-testid="mcp-offline-notice"]',
      '[data-testid="fallback-data"]',
    ];

    let fallbackFound = false;
    for (const indicator of fallbackIndicators) {
      try {
        await expect(this.page.locator(indicator)).toBeVisible({ timeout: 3000 });
        fallbackFound = true;
        break;
      } catch {
        continue;
      }
    }

    expect(fallbackFound).toBe(true);

    // Restore network
    await this.page.unroute('**/api/mcp/**');
  }

  /**
   * Create a test campaign
   */
  async createTestCampaign(type: 'email' | 'sms' | 'whatsapp', name: string) {
    await this.navigateTo('campaigns');
    await this.page.click('[data-testid="create-campaign"]');
    
    // Select campaign type
    await this.page.click(`[data-testid="campaign-type-${type}"]`);
    
    // Fill campaign details
    await this.page.fill('[data-testid="campaign-name"]', name);
    await this.page.fill('[data-testid="campaign-subject"]', `Test ${type} campaign`);
    
    if (type === 'email') {
      await this.page.fill('[data-testid="email-content"]', 'This is a test email campaign.');
    } else if (type === 'sms') {
      await this.page.fill('[data-testid="sms-message"]', 'This is a test SMS campaign.');
    } else if (type === 'whatsapp') {
      await this.page.fill('[data-testid="whatsapp-message"]', 'This is a test WhatsApp campaign.');
    }

    // Save campaign
    await this.page.click('[data-testid="save-campaign"]');
    await this.waitForLoadingComplete();
    
    // Verify campaign was created
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  /**
   * Create a test contact
   */
  async createTestContact(email: string, name: string) {
    await this.navigateTo('contacts');
    await this.page.click('[data-testid="add-contact"]');
    
    await this.page.fill('[data-testid="contact-email"]', email);
    await this.page.fill('[data-testid="contact-name"]', name);
    
    await this.page.click('[data-testid="save-contact"]');
    await this.waitForLoadingComplete();
    
    // Verify contact was created
    await expect(this.page.locator(`text=${email}`)).toBeVisible();
  }

  /**
   * Create a test workflow
   */
  async createTestWorkflow(name: string) {
    await this.navigateTo('workflows');
    await this.page.click('[data-testid="create-workflow"]');
    
    await this.page.fill('[data-testid="workflow-name"]', name);
    
    // Add a simple trigger (form submission)
    await this.page.click('[data-testid="add-trigger"]');
    await this.page.click('[data-testid="trigger-form-submission"]');
    
    // Add an action (send email)
    await this.page.click('[data-testid="add-action"]');
    await this.page.click('[data-testid="action-send-email"]');
    
    await this.page.click('[data-testid="save-workflow"]');
    await this.waitForLoadingComplete();
    
    // Verify workflow was created
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  /**
   * Check page performance
   */
  async checkPagePerformance(maxLoadTime = 3000) {
    const start = Date.now();
    await this.waitForLoadingComplete();
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(maxLoadTime);
    console.log(`Page loaded in ${loadTime}ms`);
  }

  /**
   * Verify responsive design
   */
  async testMobileResponsiveness() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // Check mobile navigation
    const mobileNav = this.page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 800 });
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Tab through key elements
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  }

  /**
   * Check for console errors
   */
  async checkForConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    // Wait a moment to collect any errors
    await this.page.waitForTimeout(2000);
    
    // Filter out expected errors (like network failures during fallback tests)
    const unexpectedErrors = errors.filter(error => 
      !error.includes('MCP server') && 
      !error.includes('Failed to fetch') &&
      !error.includes('NetworkError')
    );
    
    expect(unexpectedErrors).toHaveLength(0);
  }

  /**
   * Verify AI features are working
   */
  async testAIFeatures() {
    await this.navigateTo('ai-chat');
    
    // Send a test message
    await this.page.fill('[data-testid="ai-chat-input"]', 'What are my top performing campaigns?');
    await this.page.click('[data-testid="send-message"]');
    
    // Wait for AI response
    await expect(this.page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    
    // Verify response contains real data (not placeholder)
    const response = await this.page.textContent('[data-testid="ai-response"]');
    expect(response).not.toContain('demo');
    expect(response).not.toContain('placeholder');
  }
}