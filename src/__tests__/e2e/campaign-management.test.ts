import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Campaign Management E2E Tests
 * Tests email, SMS, and WhatsApp campaign creation, editing, and execution
 * Verifies MCP data integration enhances campaign analytics
 */

test.describe('Campaign Management', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.login();
  });

  test.describe('Email Campaigns', () => {
    test('can create and send email campaign', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create email campaign
      await testUtils.createTestCampaign('email', 'Test Email Campaign');
      
      // Verify campaign appears in list
      await expect(page.locator('text=Test Email Campaign')).toBeVisible();
      
      // Edit campaign
      await page.click('[data-testid="edit-campaign"]');
      await expect(page.locator('[data-testid="email-editor"]')).toBeVisible();
      
      // Test visual email editor
      await page.click('[data-testid="add-text-block"]');
      await page.fill('[data-testid="text-content"]', 'Hello from MarketSage!');
      
      // Add personalization
      await page.click('[data-testid="add-personalization"]');
      await page.selectOption('[data-testid="merge-field"]', 'first_name');
      
      // Preview email
      await page.click('[data-testid="preview-email"]');
      await expect(page.locator('[data-testid="email-preview"]')).toBeVisible();
      
      // Save changes
      await page.click('[data-testid="save-campaign"]');
      await testUtils.waitForLoadingComplete();
      
      // Send test email
      await page.click('[data-testid="send-test"]');
      await page.fill('[data-testid="test-email"]', 'test@example.com');
      await page.click('[data-testid="confirm-send-test"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('email campaign analytics show real MCP data', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Click on existing campaign
      await page.click('[data-testid="campaign-row"]:first-child');
      await page.click('[data-testid="view-analytics"]');
      
      // Wait for analytics to load
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify analytics metrics
      const metrics = [
        'open-rate',
        'click-rate',
        'bounce-rate',
        'unsubscribe-rate',
        'conversion-rate'
      ];

      for (const metric of metrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        
        // Verify values are not demo/placeholder
        const value = await page.textContent(`[data-testid="${metric}"]`);
        expect(value).not.toContain('Demo');
        expect(value).not.toContain('N/A');
      }
      
      // Verify heat map shows real click data
      await expect(page.locator('[data-testid="email-heatmap"]')).toBeVisible();
      
      // Check for real-time updates
      await expect(page.locator('[data-testid="realtime-updates"]')).toBeVisible();
    });

    test('A/B testing works with real performance data', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-ab-test"]');
      
      // Set up A/B test
      await page.fill('[data-testid="campaign-name"]', 'A/B Test Campaign');
      
      // Version A
      await page.fill('[data-testid="subject-a"]', 'Subject Line A');
      await page.fill('[data-testid="content-a"]', 'Content for version A');
      
      // Version B
      await page.fill('[data-testid="subject-b"]', 'Subject Line B');
      await page.fill('[data-testid="content-b"]', 'Content for version B');
      
      // Configure test settings
      await page.selectOption('[data-testid="split-percentage"]', '50');
      await page.selectOption('[data-testid="winning-metric"]', 'open_rate');
      
      // Save and start test
      await page.click('[data-testid="start-ab-test"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify test is running
      await expect(page.locator('[data-testid="ab-test-status"]')).toContainText('Running');
      
      // Check performance comparison
      await expect(page.locator('[data-testid="version-a-performance"]')).toBeVisible();
      await expect(page.locator('[data-testid="version-b-performance"]')).toBeVisible();
    });
  });

  test.describe('SMS Campaigns', () => {
    test('can create and configure SMS campaign', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create SMS campaign
      await testUtils.createTestCampaign('sms', 'Test SMS Campaign');
      
      // Configure SMS settings
      await page.click('[data-testid="sms-settings"]');
      
      // Select SMS provider
      await page.selectOption('[data-testid="sms-provider"]', 'africastalking');
      
      // Set sender ID
      await page.fill('[data-testid="sender-id"]', 'MarketSage');
      
      // Configure message
      await page.fill('[data-testid="sms-message"]', 'Hello {{first_name}}, check out our latest offers!');
      
      // Verify character count
      const charCount = page.locator('[data-testid="character-count"]');
      await expect(charCount).toBeVisible();
      
      // Test personalization
      await page.click('[data-testid="add-merge-field"]');
      await page.selectOption('[data-testid="merge-field"]', 'first_name');
      
      // Save campaign
      await page.click('[data-testid="save-sms-campaign"]');
      await testUtils.waitForLoadingComplete();
      
      // Send test SMS
      await page.click('[data-testid="send-test-sms"]');
      await page.fill('[data-testid="test-phone"]', '+234 801 234 5678');
      await page.click('[data-testid="confirm-send-test"]');
      
      // Verify success
      await expect(page.locator('[data-testid="sms-sent-success"]')).toBeVisible();
    });

    test('SMS campaigns show delivery and engagement metrics', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Open SMS campaign analytics
      await page.click('[data-testid="sms-campaign-row"]:first-child');
      await page.click('[data-testid="view-sms-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      
      // Verify SMS-specific metrics
      const smsMetrics = [
        'delivery-rate',
        'response-rate', 
        'opt-out-rate',
        'click-through-rate'
      ];

      for (const metric of smsMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
      }
      
      // Check delivery status breakdown
      await expect(page.locator('[data-testid="delivery-status-chart"]')).toBeVisible();
      
      // Verify real-time delivery tracking
      await expect(page.locator('[data-testid="delivery-tracking"]')).toBeVisible();
    });

    test('SMS credit management and billing integration', async ({ page }) => {
      await testUtils.navigateTo('settings');
      await page.click('[data-testid="settings-sms"]');
      
      // Check SMS balance
      await expect(page.locator('[data-testid="sms-balance"]')).toBeVisible();
      
      // Test credit purchase
      await page.click('[data-testid="buy-credits"]');
      await expect(page.locator('[data-testid="credit-purchase-modal"]')).toBeVisible();
      
      // Select credit package
      await page.click('[data-testid="credit-package-1000"]');
      
      // Verify pricing calculation
      await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
      
      // Close modal (don't actually purchase in test)
      await page.click('[data-testid="close-modal"]');
      
      // Check usage analytics
      await page.click('[data-testid="sms-usage-analytics"]');
      await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
    });
  });

  test.describe('WhatsApp Campaigns', () => {
    test('can create WhatsApp campaign with approved templates', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create WhatsApp campaign
      await testUtils.createTestCampaign('whatsapp', 'Test WhatsApp Campaign');
      
      // Select approved template
      await page.click('[data-testid="select-whatsapp-template"]');
      await expect(page.locator('[data-testid="template-library"]')).toBeVisible();
      
      // Choose a template
      await page.click('[data-testid="template-item"]:first-child');
      
      // Configure template parameters
      await page.fill('[data-testid="template-param-1"]', 'Customer Name');
      await page.fill('[data-testid="template-param-2"]', 'Offer Details');
      
      // Preview WhatsApp message
      await page.click('[data-testid="preview-whatsapp"]');
      await expect(page.locator('[data-testid="whatsapp-preview"]')).toBeVisible();
      
      // Schedule campaign
      await page.click('[data-testid="schedule-campaign"]');
      await page.fill('[data-testid="send-date"]', '2024-12-31');
      await page.fill('[data-testid="send-time"]', '10:00');
      
      // Save campaign
      await page.click('[data-testid="save-whatsapp-campaign"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify scheduled status
      await expect(page.locator('[data-testid="campaign-status"]')).toContainText('Scheduled');
    });

    test('WhatsApp analytics show conversation and conversion data', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Open WhatsApp campaign analytics
      await page.click('[data-testid="whatsapp-campaign-row"]:first-child');
      await page.click('[data-testid="view-whatsapp-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      
      // Verify WhatsApp-specific metrics
      const whatsappMetrics = [
        'message-delivered',
        'message-read',
        'conversation-started',
        'conversation-conversion'
      ];

      for (const metric of whatsappMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
      }
      
      // Check conversation flow analytics
      await expect(page.locator('[data-testid="conversation-flow"]')).toBeVisible();
      
      // Verify media engagement tracking
      await expect(page.locator('[data-testid="media-engagement"]')).toBeVisible();
    });

    test('WhatsApp Business API integration and verification', async ({ page }) => {
      await testUtils.navigateTo('settings');
      await page.click('[data-testid="settings-whatsapp"]');
      
      // Check API connection status
      await expect(page.locator('[data-testid="whatsapp-connection-status"]')).toBeVisible();
      
      // Test API credentials
      await page.click('[data-testid="test-whatsapp-connection"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify connection test result
      await expect(page.locator('[data-testid="connection-test-result"]')).toBeVisible();
      
      // Check phone number verification
      await expect(page.locator('[data-testid="verified-phone-numbers"]')).toBeVisible();
      
      // View webhook configuration
      await page.click('[data-testid="webhook-settings"]');
      await expect(page.locator('[data-testid="webhook-url"]')).toBeVisible();
    });
  });

  test.describe('Cross-Channel Campaign Features', () => {
    test('can create multi-channel campaign sequence', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-sequence"]');
      
      // Set up campaign sequence
      await page.fill('[data-testid="sequence-name"]', 'Multi-Channel Welcome Series');
      
      // Add email step
      await page.click('[data-testid="add-email-step"]');
      await page.fill('[data-testid="email-delay"]', '0');
      await page.selectOption('[data-testid="email-template"]', 'welcome-email');
      
      // Add SMS follow-up
      await page.click('[data-testid="add-sms-step"]');
      await page.fill('[data-testid="sms-delay"]', '24');
      await page.selectOption('[data-testid="sms-template"]', 'welcome-sms');
      
      // Add WhatsApp step
      await page.click('[data-testid="add-whatsapp-step"]');
      await page.fill('[data-testid="whatsapp-delay"]', '72');
      await page.selectOption('[data-testid="whatsapp-template"]', 'welcome-whatsapp');
      
      // Configure sequence triggers
      await page.click('[data-testid="sequence-triggers"]');
      await page.check('[data-testid="trigger-signup"]');
      await page.check('[data-testid="trigger-purchase"]');
      
      // Save sequence
      await page.click('[data-testid="save-sequence"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify sequence is created
      await expect(page.locator('text=Multi-Channel Welcome Series')).toBeVisible();
    });

    test('campaign performance comparison across channels', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      await page.click('[data-testid="campaign-comparison"]');
      
      // Select campaigns to compare
      await page.check('[data-testid="compare-email-campaign"]');
      await page.check('[data-testid="compare-sms-campaign"]');
      await page.check('[data-testid="compare-whatsapp-campaign"]');
      
      // Generate comparison report
      await page.click('[data-testid="generate-comparison"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify comparison chart
      await expect(page.locator('[data-testid="channel-comparison-chart"]')).toBeVisible();
      
      // Check performance metrics table
      await expect(page.locator('[data-testid="performance-metrics-table"]')).toBeVisible();
      
      // Verify ROI comparison
      await expect(page.locator('[data-testid="roi-comparison"]')).toBeVisible();
    });

    test('campaign automation triggers work correctly', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create automated campaign
      await page.click('[data-testid="create-automation"]');
      await page.fill('[data-testid="automation-name"]', 'Cart Abandonment');
      
      // Set trigger
      await page.selectOption('[data-testid="trigger-type"]', 'cart_abandonment');
      await page.fill('[data-testid="trigger-delay"]', '60'); // 60 minutes
      
      // Configure conditions
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'cart_value');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '50');
      
      // Add campaign action
      await page.selectOption('[data-testid="action-type"]', 'send_email');
      await page.selectOption('[data-testid="email-template"]', 'cart-abandonment');
      
      // Enable automation
      await page.check('[data-testid="automation-enabled"]');
      await page.click('[data-testid="save-automation"]');
      
      // Verify automation is active
      await expect(page.locator('[data-testid="automation-status"]')).toContainText('Active');
    });

    test('campaign segmentation and targeting works with MCP data', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create targeted campaign
      await page.click('[data-testid="create-targeted-campaign"]');
      await page.fill('[data-testid="campaign-name"]', 'High-Value Customer Campaign');
      
      // Select audience segment
      await page.click('[data-testid="select-audience"]');
      await expect(page.locator('[data-testid="segment-library"]')).toBeVisible();
      
      // Choose high-value customers segment (based on MCP data)
      await page.click('[data-testid="segment-high-value"]');
      
      // Verify segment details show real MCP data
      await expect(page.locator('[data-testid="segment-size"]')).not.toContainText('Demo');
      await expect(page.locator('[data-testid="segment-metrics"]')).toBeVisible();
      
      // Add additional targeting criteria
      await page.click('[data-testid="add-criteria"]');
      await page.selectOption('[data-testid="criteria-field"]', 'last_purchase_date');
      await page.selectOption('[data-testid="criteria-operator"]', 'within_days');
      await page.fill('[data-testid="criteria-value"]', '30');
      
      // Preview audience
      await page.click('[data-testid="preview-audience"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify preview shows real customer data
      await expect(page.locator('[data-testid="audience-preview"]')).toBeVisible();
      await testUtils.verifyMCPDataLoaded();
    });
  });

  test.describe('Campaign Performance and Optimization', () => {
    test('AI-powered send time optimization works', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Create campaign with AI optimization
      await testUtils.createTestCampaign('email', 'AI Optimized Campaign');
      
      // Enable AI send time optimization
      await page.click('[data-testid="ai-optimization"]');
      await page.check('[data-testid="optimize-send-time"]');
      
      // Configure optimization parameters
      await page.selectOption('[data-testid="optimization-goal"]', 'open_rate');
      await page.selectOption('[data-testid="optimization-period"]', '7_days');
      
      // Verify AI recommendations appear
      await testUtils.waitForLoadingComplete();
      await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
      
      // Check recommended send times
      await expect(page.locator('[data-testid="recommended-times"]')).toBeVisible();
      
      // Apply AI recommendations
      await page.click('[data-testid="apply-recommendations"]');
      
      // Verify optimization is enabled
      await expect(page.locator('[data-testid="optimization-status"]')).toContainText('Enabled');
    });

    test('campaign performance alerts and notifications work', async ({ page }) => {
      await testUtils.navigateTo('campaigns');
      
      // Set up performance alerts
      await page.click('[data-testid="campaign-settings"]');
      await page.click('[data-testid="performance-alerts"]');
      
      // Configure low performance alert
      await page.check('[data-testid="alert-low-open-rate"]');
      await page.fill('[data-testid="open-rate-threshold"]', '10');
      
      // Configure high unsubscribe alert
      await page.check('[data-testid="alert-high-unsubscribe"]');
      await page.fill('[data-testid="unsubscribe-threshold"]', '5');
      
      // Set notification preferences
      await page.check('[data-testid="email-notifications"]');
      await page.check('[data-testid="dashboard-notifications"]');
      
      // Save alert settings
      await page.click('[data-testid="save-alert-settings"]');
      
      // Verify alerts are configured
      await expect(page.locator('[data-testid="alert-confirmation"]')).toBeVisible();
    });
  });
});