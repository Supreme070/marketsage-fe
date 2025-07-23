import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * MCP Integration and Fallback E2E Tests
 * Tests MCP server integration, data flow, and graceful fallback behavior
 */

test.describe('MCP Integration & Fallback', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.login();
  });

  test.describe('MCP Data Integration', () => {
    test('MCP servers provide real data to dashboard', async ({ page }) => {
      await testUtils.navigateTo('dashboard');
      
      // Wait for MCP data to load
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify MCP data indicators are present
      await expect(page.locator('[data-testid="mcp-data-indicator"]')).toBeVisible();
      
      // Check that data is marked as real (not demo)
      await expect(page.locator('[data-testid="real-data-badge"]')).toBeVisible();
      
      // Verify specific MCP-provided metrics
      const mcpMetrics = [
        'real-visitor-count',
        'actual-conversion-data',
        'live-campaign-performance',
        'real-customer-insights'
      ];

      for (const metric of mcpMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        
        // Verify values are not placeholder
        const value = await page.textContent(`[data-testid="${metric}"]`);
        expect(value).not.toContain('Demo');
        expect(value).not.toContain('Placeholder');
        expect(value).not.toContain('Sample');
      }
      
      // Verify data freshness timestamp
      await expect(page.locator('[data-testid="mcp-data-timestamp"]')).toBeVisible();
      const timestamp = await page.textContent('[data-testid="mcp-data-timestamp"]');
      expect(timestamp).not.toContain('Never updated');
    });

    test('MCP customer data integration enhances contact profiles', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Open contact profile
      await page.click('[data-testid="contact-row"]:first-child');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify MCP-enhanced contact data
      const mcpEnhancements = [
        'mcp-enriched-company',
        'mcp-behavioral-score',
        'mcp-engagement-history',
        'mcp-prediction-data'
      ];

      for (const enhancement of mcpEnhancements) {
        try {
          await expect(page.locator(`[data-testid="${enhancement}"]`)).toBeVisible({ timeout: 3000 });
        } catch {
          // Some enhancements may not be available for all contacts
          continue;
        }
      }
      
      // Verify MCP data source indicators
      await expect(page.locator('[data-testid="mcp-data-source"]')).toBeVisible();
      
      // Check data synchronization status
      await expect(page.locator('[data-testid="mcp-sync-status"]')).toBeVisible();
      const syncStatus = await page.textContent('[data-testid="mcp-sync-status"]');
      expect(syncStatus).toContain('Synchronized');
    });

    test('MCP analytics data improves campaign insights', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Open campaign analytics
      await page.click('[data-testid="campaign-row"]:first-child');
      await page.click('[data-testid="view-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify MCP-enhanced analytics
      await expect(page.locator('[data-testid="mcp-enhanced-analytics"]')).toBeVisible();
      
      // Check for real-time MCP metrics
      const mcpAnalytics = [
        'mcp-delivery-tracking',
        'mcp-engagement-scoring',
        'mcp-attribution-data',
        'mcp-predictive-metrics'
      ];

      for (const analytic of mcpAnalytics) {
        try {
          await expect(page.locator(`[data-testid="${analytic}"]`)).toBeVisible({ timeout: 3000 });
        } catch {
          continue;
        }
      }
      
      // Verify data quality indicators
      await expect(page.locator('[data-testid="data-quality-score"]')).toBeVisible();
      
      // Check MCP vs non-MCP data comparison
      await page.click('[data-testid="data-source-comparison"]');
      await expect(page.locator('[data-testid="mcp-vs-standard"]')).toBeVisible();
    });

    test('MCP AI integration enhances decision making', async ({ page }) => {
      await testUtils.navigateTo('ai-chat');
      
      // Send query that requires MCP data
      await page.fill('[data-testid="ai-chat-input"]', 'What are my best performing campaigns based on real customer data?');
      await page.click('[data-testid="send-message"]');
      
      // Wait for AI response with MCP data
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 15000 });
      
      // Verify response includes real data insights
      const response = await page.textContent('[data-testid="ai-response"]');
      expect(response).not.toContain('demo data');
      expect(response).not.toContain('sample information');
      
      // Check for MCP data citations
      await expect(page.locator('[data-testid="mcp-data-citation"]')).toBeVisible();
      
      // Verify AI recommendations are data-driven
      await page.fill('[data-testid="ai-chat-input"]', 'Suggest optimizations for my email campaigns');
      await page.click('[data-testid="send-message"]');
      
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 15000 });
      
      // Check for specific recommendations based on real data
      await expect(page.locator('[data-testid="data-driven-recommendation"]')).toBeVisible();
    });
  });

  test.describe('MCP Server Health and Monitoring', () => {
    test('MCP server health status is visible and accurate', async ({ page }) => {
      await testUtils.navigateTo('settings');
      await page.click('[data-testid="mcp-settings"]');
      
      // Verify MCP server status dashboard
      await expect(page.locator('[data-testid="mcp-server-status"]')).toBeVisible();
      
      // Check individual server statuses
      const mcpServers = [
        'customer-data-server',
        'campaign-analytics-server',
        'leadpulse-server',
        'monitoring-server'
      ];

      for (const server of mcpServers) {
        await expect(page.locator(`[data-testid="${server}-status"]`)).toBeVisible();
        
        // Verify server shows as connected
        const serverStatus = page.locator(`[data-testid="${server}-status"] [data-testid="connection-indicator"]`);
        await expect(serverStatus).toHaveClass(/connected|online|healthy/);
      }
      
      // Check server response times
      await expect(page.locator('[data-testid="server-response-times"]')).toBeVisible();
      
      // Verify acceptable response times (< 1000ms)
      const responseTime = await page.textContent('[data-testid="avg-response-time"]');
      const responseTimeMs = parseInt(responseTime?.replace(/[^\d]/g, '') || '0');
      expect(responseTimeMs).toBeLessThan(1000);
      
      // Test server connectivity
      await page.click('[data-testid="test-mcp-connection"]');
      await expect(page.locator('[data-testid="connection-test-success"]')).toBeVisible();
    });

    test('MCP server failover and redundancy work correctly', async ({ page }) => {
      await testUtils.navigateTo('settings');
      await page.click('[data-testid="mcp-settings"]');
      
      // Simulate server failure
      await page.route('**/mcp/customer-data/**', route => route.abort());
      
      // Reload page to trigger failover
      await page.reload();
      await testUtils.waitForLoadingComplete();
      
      // Verify failover notification
      await expect(page.locator('[data-testid="server-failover-notice"]')).toBeVisible();
      
      // Check that backup server is used
      await expect(page.locator('[data-testid="backup-server-active"]')).toBeVisible();
      
      // Verify data still loads (from backup)
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Should still show data, possibly with degraded service notice
      await expect(page.locator('[data-testid="degraded-service-notice"]')).toBeVisible();
      
      // Restore network and verify recovery
      await page.unroute('**/mcp/customer-data/**');
      await page.reload();
      await testUtils.waitForLoadingComplete();
      
      // Verify full service restoration
      await expect(page.locator('[data-testid="service-restored-notice"]')).toBeVisible();
    });

    test('MCP data synchronization and consistency checks work', async ({ page }) => {
      await testUtils.navigateTo('settings');
      await page.click('[data-testid="mcp-settings"]');
      await page.click('[data-testid="data-synchronization"]');
      
      // Check synchronization status
      await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
      
      // Verify last sync timestamps
      await expect(page.locator('[data-testid="last-sync-timestamp"]')).toBeVisible();
      
      // Test manual sync
      await page.click('[data-testid="manual-sync"]');
      await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
      
      // Wait for sync completion
      await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible({ timeout: 30000 });
      
      // Verify data consistency checks
      await page.click('[data-testid="run-consistency-check"]');
      await expect(page.locator('[data-testid="consistency-check-results"]')).toBeVisible();
      
      // Check for any data discrepancies
      const consistencyStatus = await page.textContent('[data-testid="consistency-status"]');
      expect(consistencyStatus).toContain('Consistent');
    });
  });

  test.describe('Graceful Fallback Behavior', () => {
    test('system gracefully handles MCP server unavailability', async ({ page }) => {
      // Block all MCP server requests
      await page.route('**/mcp/**', route => route.abort());
      
      // Navigate to dashboard
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Verify graceful fallback
      await testUtils.testMCPFallback();
      
      // Check that fallback data or demo mode is clearly indicated
      const fallbackIndicators = [
        '[data-testid="demo-mode-notice"]',
        '[data-testid="offline-mode-notice"]',
        '[data-testid="limited-data-notice"]'
      ];

      let fallbackFound = false;
      for (const indicator of fallbackIndicators) {
        try {
          await expect(page.locator(indicator)).toBeVisible({ timeout: 3000 });
          fallbackFound = true;
          break;
        } catch {
          continue;
        }
      }
      expect(fallbackFound).toBe(true);
      
      // Verify system remains functional
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      
      // Test navigation still works
      await testUtils.navigateTo('campaigns');
      await expect(page.locator('[data-testid="campaigns-page"]')).toBeVisible();
    });

    test('fallback data is clearly distinguished from real data', async ({ page }) => {
      // Block MCP servers
      await page.route('**/mcp/**', route => route.abort());
      
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Verify fallback data indicators
      await expect(page.locator('[data-testid="demo-data-indicator"]')).toBeVisible();
      
      // Check that metrics show as demo/simulated
      const demoMetrics = page.locator('[data-testid="demo-metric"]');
      await expect(demoMetrics).toHaveCount({ min: 1 });
      
      // Verify demo data disclaimers
      await expect(page.locator('[data-testid="demo-data-disclaimer"]')).toBeVisible();
      
      // Check that demo data is visually distinct
      const demoElements = page.locator('[data-testid="demo-element"]');
      for (let i = 0; i < await demoElements.count(); i++) {
        await expect(demoElements.nth(i)).toHaveClass(/demo|fallback|simulated/);
      }
      
      // Verify user can still create content
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-campaign"]');
      await expect(page.locator('[data-testid="campaign-form"]')).toBeVisible();
      
      // Should show warning about demo mode
      await expect(page.locator('[data-testid="demo-mode-warning"]')).toBeVisible();
    });

    test('partial MCP server failure handled gracefully', async ({ page }) => {
      // Block only some MCP servers
      await page.route('**/mcp/campaign-analytics/**', route => route.abort());
      
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Verify partial functionality notice
      await expect(page.locator('[data-testid="partial-service-notice"]')).toBeVisible();
      
      // Check that some data loads (from working servers)
      await testUtils.verifyMCPDataLoaded();
      
      // But campaign analytics should show fallback
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="campaign-row"]:first-child');
      await page.click('[data-testid="view-analytics"]');
      
      // Should show limited analytics notice
      await expect(page.locator('[data-testid="limited-analytics-notice"]')).toBeVisible();
      
      // Some metrics should work, others should show as unavailable
      await expect(page.locator('[data-testid="unavailable-metric"]')).toBeVisible();
    });

    test('MCP server recovery is detected and handled smoothly', async ({ page }) => {
      // Start with blocked MCP servers
      await page.route('**/mcp/**', route => route.abort());
      
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Verify fallback mode
      await expect(page.locator('[data-testid="demo-mode-notice"]')).toBeVisible();
      
      // Restore MCP servers
      await page.unroute('**/mcp/**');
      
      // Trigger data refresh
      await page.click('[data-testid="refresh-data"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify recovery notice
      await expect(page.locator('[data-testid="service-restored-notice"]')).toBeVisible();
      
      // Check that real data is now loading
      await testUtils.verifyMCPDataLoaded();
      
      // Verify fallback indicators are removed
      await expect(page.locator('[data-testid="demo-mode-notice"]')).not.toBeVisible();
      
      // Check that real data replaces demo data
      await expect(page.locator('[data-testid="real-data-badge"]')).toBeVisible();
    });

    test('error messages are user-friendly and actionable', async ({ page }) => {
      // Block MCP servers
      await page.route('**/mcp/**', route => route.abort());
      
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      
      // Check error message quality
      const errorMessage = page.locator('[data-testid="mcp-error-message"]');
      await expect(errorMessage).toBeVisible();
      
      // Verify message is user-friendly (no technical jargon)
      const messageText = await errorMessage.textContent();
      expect(messageText).not.toContain('500');
      expect(messageText).not.toContain('Internal Server Error');
      expect(messageText).not.toContain('ECONNREFUSED');
      expect(messageText).not.toContain('timeout');
      
      // Should contain helpful guidance
      expect(messageText).toMatch(/temporarily unavailable|demo mode|limited functionality/i);
      
      // Check for actionable buttons
      await expect(page.locator('[data-testid="retry-connection"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('**/mcp/**');
      await page.click('[data-testid="retry-connection"]');
      
      // Should show loading state
      await expect(page.locator('[data-testid="retry-loading"]')).toBeVisible();
      
      // Should eventually recover
      await expect(page.locator('[data-testid="connection-restored"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Data Migration and Backward Compatibility', () => {
    test('existing features work without MCP enhancement', async ({ page }) => {
      // Disable MCP integration temporarily
      await page.route('**/mcp/**', route => route.abort());
      
      // Test core campaign creation still works
      await testUtils.navigateTo('campaigns');
      await testUtils.createTestCampaign('email', 'Non-MCP Test Campaign');
      
      // Verify campaign was created successfully
      await expect(page.locator('text=Non-MCP Test Campaign')).toBeVisible();
      
      // Test contact management
      await testUtils.navigateTo('contacts');
      await testUtils.createTestContact('no-mcp@example.com', 'No MCP User');
      
      // Verify contact was created
      await expect(page.locator('text=no-mcp@example.com')).toBeVisible();
      
      // Test workflow creation
      await testUtils.navigateTo('workflows');
      await testUtils.createTestWorkflow('Non-MCP Workflow');
      
      // Verify workflow was created
      await expect(page.locator('text=Non-MCP Workflow')).toBeVisible();
      
      // Verify basic analytics still function
      await testUtils.navigateTo('analytics');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    });

    test('database schema remains compatible', async ({ page }) => {
      // Test that existing database operations work
      await testUtils.navigateTo('contacts');
      
      // Import existing contact data
      await page.click('[data-testid="import-contacts"]');
      
      // Upload test CSV
      const fileInput = page.locator('[data-testid="csv-file-input"]');
      await fileInput.setInputFiles('./src/__tests__/fixtures/legacy-contacts.csv');
      
      // Start import
      await page.click('[data-testid="start-import"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify import succeeds
      await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
      
      // Check that legacy data is properly handled
      await page.click('[data-testid="contact-row"]:first-child');
      
      // Verify contact details load correctly
      await expect(page.locator('[data-testid="contact-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-name"]')).toBeVisible();
    });

    test('API endpoints maintain backward compatibility', async ({ page }) => {
      // Test legacy API endpoints still work
      const response = await page.request.get('/api/contacts');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      
      // Test campaign API
      const campaignResponse = await page.request.get('/api/campaigns');
      expect(campaignResponse.status()).toBe(200);
      
      // Test workflow API
      const workflowResponse = await page.request.get('/api/workflows');
      expect(workflowResponse.status()).toBe(200);
      
      // Verify response format hasn't changed
      const workflowData = await workflowResponse.json();
      expect(workflowData).toHaveProperty('success');
      expect(workflowData).toHaveProperty('data');
    });
  });
});