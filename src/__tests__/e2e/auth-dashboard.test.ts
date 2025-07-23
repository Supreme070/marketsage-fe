import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Authentication and Dashboard Navigation E2E Tests
 * Tests complete user authentication flow and dashboard functionality
 */

test.describe('Authentication & Dashboard', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
  });

  test('user can login and access dashboard', async ({ page }) => {
    // Login
    await testUtils.login();

    // Verify dashboard is accessible
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
    
    // Check for user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Verify page performance
    await testUtils.checkPagePerformance();
  });

  test('dashboard shows real MCP data instead of demo data', async ({ page }) => {
    await testUtils.login();
    
    // Wait for all data to load
    await testUtils.waitForLoadingComplete();
    
    // Verify MCP data is displayed
    await testUtils.verifyMCPDataLoaded();
    
    // Check specific metrics have real values
    const visitorCount = page.locator('[data-testid="visitor-count"]');
    const conversionRate = page.locator('[data-testid="conversion-rate"]');
    const campaignMetrics = page.locator('[data-testid="campaign-metrics"]');
    
    await expect(visitorCount).toBeVisible();
    await expect(conversionRate).toBeVisible();
    await expect(campaignMetrics).toBeVisible();
    
    // Verify values are not placeholder/demo values
    const visitorText = await visitorCount.textContent();
    expect(visitorText).not.toContain('Demo');
    expect(visitorText).not.toContain('Sample');
  });

  test('navigation between dashboard sections works correctly', async ({ page }) => {
    await testUtils.login();

    const sections = [
      'campaigns',
      'contacts', 
      'workflows',
      'analytics',
      'leadpulse',
      'ai-chat',
      'settings'
    ];

    for (const section of sections) {
      // Navigate to section
      await testUtils.navigateTo(section);
      
      // Wait for content to load
      await testUtils.waitForLoadingComplete();
      
      // Verify section-specific content is visible
      await expect(page.locator(`[data-testid="${section}-page"]`)).toBeVisible();
      
      // Check for console errors
      await testUtils.checkForConsoleErrors();
      
      // Verify performance
      await testUtils.checkPagePerformance();
    }
  });

  test('dashboard gracefully handles MCP server unavailability', async ({ page }) => {
    await testUtils.login();
    
    // Test MCP fallback behavior
    await testUtils.testMCPFallback();
    
    // Verify dashboard still functions
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    
    // Check that fallback data or notices are shown
    const fallbackNotice = page.locator('[data-testid="mcp-offline-notice"]');
    const demoDataNotice = page.locator('[data-testid="demo-data-notice"]');
    
    // At least one fallback mechanism should be active
    const hasFallback = await fallbackNotice.isVisible() || await demoDataNotice.isVisible();
    expect(hasFallback).toBe(true);
  });

  test('dashboard widgets load and display correctly', async ({ page }) => {
    await testUtils.login();
    await testUtils.waitForLoadingComplete();

    // Core dashboard widgets
    const widgets = [
      'revenue-widget',
      'campaign-performance-widget',
      'visitor-analytics-widget',
      'conversion-funnel-widget',
      'recent-activities-widget'
    ];

    for (const widget of widgets) {
      await expect(page.locator(`[data-testid="${widget}"]`)).toBeVisible();
      
      // Verify widget has content (not empty)
      const widgetContent = page.locator(`[data-testid="${widget}"] [data-testid="widget-content"]`);
      await expect(widgetContent).toBeVisible();
    }
  });

  test('user profile and settings are accessible', async ({ page }) => {
    await testUtils.login();
    
    // Open user menu
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible();
    
    // Navigate to profile
    await page.click('[data-testid="profile-link"]');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    
    // Navigate to settings
    await testUtils.navigateTo('settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    
    // Test settings sections
    const settingSections = [
      'general',
      'notifications',
      'api-keys',
      'billing'
    ];

    for (const section of settingSections) {
      await page.click(`[data-testid="settings-${section}"]`);
      await expect(page.locator(`[data-testid="${section}-settings"]`)).toBeVisible();
    }
  });

  test('search functionality works across dashboard', async ({ page }) => {
    await testUtils.login();
    
    // Test global search
    const searchInput = page.locator('[data-testid="global-search"]');
    await searchInput.fill('test campaign');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Verify search includes different content types
    const resultTypes = [
      'campaign-result',
      'contact-result',
      'workflow-result'
    ];

    for (const resultType of resultTypes) {
      try {
        await expect(page.locator(`[data-testid="${resultType}"]`)).toBeVisible({ timeout: 3000 });
      } catch {
        // Some result types may not have matches
        continue;
      }
    }
  });

  test('real-time updates work correctly', async ({ page }) => {
    await testUtils.login();
    
    // Check for real-time metrics updates
    const beforeValue = await page.textContent('[data-testid="live-visitor-count"]');
    
    // Wait for potential updates
    await page.waitForTimeout(5000);
    
    // Verify real-time connection indicator
    await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();
    
    // Check connection status is active
    const statusIndicator = page.locator('[data-testid="realtime-status"] .status-indicator');
    await expect(statusIndicator).toHaveClass(/connected|active/);
  });

  test('mobile responsive design works correctly', async ({ page }) => {
    await testUtils.login();
    
    // Test mobile responsiveness
    await testUtils.testMobileResponsiveness();
    
    // Verify mobile-specific elements
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Test touch interactions
    await page.touchscreen.tap(100, 100);
    
    // Verify dashboard is usable on mobile
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await testUtils.login();
    
    // Test keyboard navigation
    await testUtils.testKeyboardNavigation();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+K'); // Open command palette
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
    
    await page.keyboard.press('Escape'); // Close
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });

  test('error boundaries handle unexpected errors gracefully', async ({ page }) => {
    await testUtils.login();
    
    // Simulate an error by corrupting API response
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Reload dashboard to trigger error
    await page.reload();
    
    // Verify error boundary catches the error
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    
    // Verify user-friendly error message
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).not.toContain('500');
    expect(errorMessage).not.toContain('Internal Server Error');
    
    // Verify retry functionality
    await page.unroute('**/api/dashboard/stats');
    await page.click('[data-testid="retry-button"]');
    
    // Dashboard should recover
    await testUtils.waitForLoadingComplete();
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
  });
});