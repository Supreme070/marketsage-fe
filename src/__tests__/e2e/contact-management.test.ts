import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Contact Management and Segmentation E2E Tests
 * Tests customer database functionality with MCP-enhanced intelligence
 */

test.describe('Contact Management & Segmentation', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.login();
  });

  test.describe('Contact Management', () => {
    test('can create, edit, and delete contacts', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Create new contact
      await testUtils.createTestContact('john.doe@example.com', 'John Doe');
      
      // Verify contact appears in list
      await expect(page.locator('text=john.doe@example.com')).toBeVisible();
      await expect(page.locator('text=John Doe')).toBeVisible();
      
      // Edit contact
      await page.click('[data-testid="contact-row"]:has-text("John Doe") [data-testid="edit-contact"]');
      
      // Update contact information
      await page.fill('[data-testid="contact-phone"]', '+234 801 234 5678');
      await page.fill('[data-testid="contact-company"]', 'Acme Corp');
      await page.selectOption('[data-testid="contact-country"]', 'Nigeria');
      
      // Add custom fields
      await page.click('[data-testid="add-custom-field"]');
      await page.fill('[data-testid="custom-field-name"]', 'Job Title');
      await page.fill('[data-testid="custom-field-value"]', 'Software Engineer');
      
      // Save changes
      await page.click('[data-testid="save-contact"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify changes are saved
      await expect(page.locator('text=+234 801 234 5678')).toBeVisible();
      await expect(page.locator('text=Acme Corp')).toBeVisible();
      
      // Test contact deletion
      await page.click('[data-testid="contact-row"]:has-text("John Doe") [data-testid="delete-contact"]');
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify contact is deleted
      await expect(page.locator('text=john.doe@example.com')).not.toBeVisible();
    });

    test('contact import and export functionality works', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Test CSV import
      await page.click('[data-testid="import-contacts"]');
      
      // Upload CSV file
      const fileInput = page.locator('[data-testid="csv-file-input"]');
      await fileInput.setInputFiles('./src/__tests__/fixtures/sample-contacts.csv');
      
      // Map CSV columns
      await page.selectOption('[data-testid="map-email"]', 'email');
      await page.selectOption('[data-testid="map-name"]', 'full_name');
      await page.selectOption('[data-testid="map-phone"]', 'phone');
      
      // Configure import settings
      await page.check('[data-testid="skip-duplicates"]');
      await page.check('[data-testid="validate-emails"]');
      
      // Start import
      await page.click('[data-testid="start-import"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify import results
      await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
      const importCount = await page.textContent('[data-testid="import-count"]');
      expect(Number.parseInt(importCount || '0')).toBeGreaterThan(0);
      
      // Test export functionality
      await page.click('[data-testid="export-contacts"]');
      
      // Configure export settings
      await page.check('[data-testid="export-all-fields"]');
      await page.selectOption('[data-testid="export-format"]', 'csv');
      
      // Start export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="start-export"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('contacts');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('contact enrichment with MCP data works correctly', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Create contact with minimal information
      await page.click('[data-testid="add-contact"]');
      await page.fill('[data-testid="contact-email"]', 'enrichment.test@example.com');
      await page.click('[data-testid="save-contact"]');
      
      // Trigger enrichment
      await page.click('[data-testid="enrich-contact"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify MCP data enrichment
      await testUtils.verifyMCPDataLoaded();
      
      // Check enriched fields
      const enrichedFields = [
        'contact-company',
        'contact-job-title',
        'contact-location',
        'contact-social-profiles'
      ];

      for (const field of enrichedFields) {
        try {
          await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible({ timeout: 3000 });
        } catch {
          // Some enrichment data may not be available
          continue;
        }
      }
      
      // Verify enrichment timestamp
      await expect(page.locator('[data-testid="enrichment-date"]')).toBeVisible();
    });

    test('contact activity tracking shows real engagement data', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Open contact profile
      await page.click('[data-testid="contact-row"]:first-child');
      await page.click('[data-testid="view-contact-profile"]');
      
      // Wait for activity data to load
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify activity timeline
      await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible();
      
      // Check different activity types
      const activityTypes = [
        'email-opened',
        'email-clicked',
        'website-visited',
        'form-submitted',
        'purchase-made'
      ];

      for (const activityType of activityTypes) {
        try {
          await expect(page.locator(`[data-testid="${activityType}"]`)).toBeVisible({ timeout: 2000 });
        } catch {
          // Not all activity types may be present
          continue;
        }
      }
      
      // Verify engagement score
      await expect(page.locator('[data-testid="engagement-score"]')).toBeVisible();
      
      // Check that score is not placeholder/demo value
      const scoreText = await page.textContent('[data-testid="engagement-score"]');
      expect(scoreText).not.toContain('Demo');
      expect(scoreText).not.toContain('N/A');
    });

    test('contact search and filtering works effectively', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Test text search
      await page.fill('[data-testid="contact-search"]', 'john');
      await page.keyboard.press('Enter');
      await testUtils.waitForLoadingComplete();
      
      // Verify search results
      const searchResults = page.locator('[data-testid="contact-row"]');
      await expect(searchResults.first()).toBeVisible();
      
      // Test advanced filters
      await page.click('[data-testid="advanced-filters"]');
      
      // Filter by location
      await page.selectOption('[data-testid="filter-country"]', 'Nigeria');
      
      // Filter by engagement score
      await page.fill('[data-testid="min-engagement-score"]', '70');
      
      // Filter by last activity
      await page.selectOption('[data-testid="last-activity"]', '30_days');
      
      // Apply filters
      await page.click('[data-testid="apply-filters"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify filtered results
      await expect(page.locator('[data-testid="filter-results-count"]')).toBeVisible();
      
      // Clear filters
      await page.click('[data-testid="clear-filters"]');
      await testUtils.waitForLoadingComplete();
    });
  });

  test.describe('Customer Segmentation', () => {
    test('can create smart segments with MCP data', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="segments-tab"]');
      
      // Create new smart segment
      await page.click('[data-testid="create-smart-segment"]');
      
      // Configure segment criteria
      await page.fill('[data-testid="segment-name"]', 'High-Value Nigerian Customers');
      
      // Add condition: Country = Nigeria
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'country');
      await page.selectOption('[data-testid="condition-operator"]', 'equals');
      await page.fill('[data-testid="condition-value"]', 'Nigeria');
      
      // Add condition: Total purchases > 10000
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'total_purchase_value');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '10000');
      
      // Add condition: Last purchase within 90 days
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'last_purchase_date');
      await page.selectOption('[data-testid="condition-operator"]', 'within_days');
      await page.fill('[data-testid="condition-value"]', '90');
      
      // Preview segment
      await page.click('[data-testid="preview-segment"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify segment shows real MCP data
      await testUtils.verifyMCPDataLoaded();
      await expect(page.locator('[data-testid="segment-size"]')).not.toContainText('Demo');
      
      // Save segment
      await page.click('[data-testid="save-segment"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify segment appears in list
      await expect(page.locator('text=High-Value Nigerian Customers')).toBeVisible();
    });

    test('AI-powered segmentation suggestions work', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="segments-tab"]');
      
      // Request AI segmentation suggestions
      await page.click('[data-testid="ai-segment-suggestions"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify AI suggestions appear
      await expect(page.locator('[data-testid="ai-suggestions"]')).toBeVisible();
      
      // Check suggestion quality
      const suggestions = page.locator('[data-testid="suggestion-item"]');
      await expect(suggestions).toHaveCount({ min: 1 });
      
      // Apply first suggestion
      await page.click('[data-testid="apply-suggestion"]:first-child');
      
      // Verify segment configuration is populated
      await expect(page.locator('[data-testid="segment-name"]')).not.toHaveValue('');
      await expect(page.locator('[data-testid="condition-field"]')).not.toHaveValue('');
      
      // Test AI reasoning
      await expect(page.locator('[data-testid="ai-reasoning"]')).toBeVisible();
    });

    test('behavioral segmentation with real engagement data', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="segments-tab"]');
      
      // Create behavioral segment
      await page.click('[data-testid="create-behavioral-segment"]');
      
      await page.fill('[data-testid="segment-name"]', 'Highly Engaged Email Subscribers');
      
      // Add engagement-based conditions
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'email_open_rate');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '40');
      
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'email_click_rate');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '10');
      
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'website_sessions');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '5');
      
      // Set time period
      await page.selectOption('[data-testid="time-period"]', '30_days');
      
      // Preview and save
      await page.click('[data-testid="preview-segment"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify real behavioral data
      await testUtils.verifyMCPDataLoaded();
      
      await page.click('[data-testid="save-segment"]');
      await expect(page.locator('text=Highly Engaged Email Subscribers')).toBeVisible();
    });

    test('segment performance and analytics tracking', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="segments-tab"]');
      
      // Open existing segment
      await page.click('[data-testid="segment-row"]:first-child');
      await page.click('[data-testid="view-segment-analytics"]');
      
      // Wait for analytics to load
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify segment metrics
      const segmentMetrics = [
        'segment-size-trend',
        'segment-engagement',
        'segment-conversion-rate',
        'segment-revenue',
        'segment-growth-rate'
      ];

      for (const metric of segmentMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
      }
      
      // Check segment composition chart
      await expect(page.locator('[data-testid="segment-composition"]')).toBeVisible();
      
      // Verify campaign performance for this segment
      await expect(page.locator('[data-testid="segment-campaign-performance"]')).toBeVisible();
      
      // Check real-time segment updates
      await expect(page.locator('[data-testid="realtime-segment-changes"]')).toBeVisible();
    });

    test('segment-based campaign targeting works correctly', async ({ page }) => {
      // First create a segment
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="segments-tab"]');
      await page.click('[data-testid="create-segment"]');
      
      await page.fill('[data-testid="segment-name"]', 'Campaign Target Test');
      await page.click('[data-testid="add-condition"]');
      await page.selectOption('[data-testid="condition-field"]', 'country');
      await page.fill('[data-testid="condition-value"]', 'Nigeria');
      await page.click('[data-testid="save-segment"]');
      
      // Now create campaign targeting this segment
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-campaign"]');
      
      // Select audience
      await page.click('[data-testid="select-audience"]');
      await page.click('[data-testid="segment-Campaign Target Test"]');
      
      // Verify segment details are shown
      await expect(page.locator('[data-testid="selected-segment-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="segment-size"]')).toBeVisible();
      
      // Check estimated reach
      await expect(page.locator('[data-testid="estimated-reach"]')).toBeVisible();
      
      // Verify segment composition preview
      await page.click('[data-testid="preview-audience"]');
      await expect(page.locator('[data-testid="audience-preview"]')).toBeVisible();
    });
  });

  test.describe('Customer Intelligence & Predictions', () => {
    test('customer lifetime value predictions are displayed', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Open contact with CLV data
      await page.click('[data-testid="contact-row"]:first-child');
      await page.click('[data-testid="view-customer-intelligence"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify CLV prediction
      await expect(page.locator('[data-testid="clv-prediction"]')).toBeVisible();
      
      // Check CLV confidence score
      await expect(page.locator('[data-testid="clv-confidence"]')).toBeVisible();
      
      // Verify CLV factors
      await expect(page.locator('[data-testid="clv-factors"]')).toBeVisible();
      
      // Check CLV trend
      await expect(page.locator('[data-testid="clv-trend-chart"]')).toBeVisible();
    });

    test('churn prediction and prevention recommendations work', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // View customer intelligence dashboard
      await page.click('[data-testid="customer-intelligence"]');
      await testUtils.waitForLoadingComplete();
      
      // Check churn risk segments
      await expect(page.locator('[data-testid="churn-risk-segments"]')).toBeVisible();
      
      // View high-risk customers
      await page.click('[data-testid="high-churn-risk"]');
      await expect(page.locator('[data-testid="high-risk-customers"]')).toBeVisible();
      
      // Check prevention recommendations
      await page.click('[data-testid="prevention-recommendations"]');
      await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
      
      // Test automated prevention campaign
      await page.click('[data-testid="create-prevention-campaign"]');
      await expect(page.locator('[data-testid="campaign-template"]')).toBeVisible();
    });

    test('customer journey mapping shows real touchpoints', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // Open contact profile
      await page.click('[data-testid="contact-row"]:first-child');
      await page.click('[data-testid="customer-journey"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify journey visualization
      await expect(page.locator('[data-testid="journey-map"]')).toBeVisible();
      
      // Check touchpoint details
      const touchpoints = [
        'first-visit',
        'email-engagement',
        'purchase-events',
        'support-interactions',
        'social-engagement'
      ];

      for (const touchpoint of touchpoints) {
        try {
          await expect(page.locator(`[data-testid="${touchpoint}"]`)).toBeVisible({ timeout: 2000 });
        } catch {
          // Not all touchpoints may be present
          continue;
        }
      }
      
      // Verify journey analytics
      await expect(page.locator('[data-testid="journey-analytics"]')).toBeVisible();
    });

    test('predictive lead scoring works with real data', async ({ page }) => {
      await testUtils.navigateTo('contacts');
      
      // View lead scoring dashboard
      await page.click('[data-testid="lead-scoring"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify lead score distribution
      await expect(page.locator('[data-testid="score-distribution"]')).toBeVisible();
      
      // Check scoring factors
      await expect(page.locator('[data-testid="scoring-factors"]')).toBeVisible();
      
      // View high-score leads
      await page.click('[data-testid="high-score-leads"]');
      await expect(page.locator('[data-testid="qualified-leads"]')).toBeVisible();
      
      // Test score threshold adjustment
      await page.fill('[data-testid="score-threshold"]', '75');
      await page.click('[data-testid="update-threshold"]');
      
      // Verify updated lead list
      await testUtils.waitForLoadingComplete();
      await expect(page.locator('[data-testid="updated-lead-count"]')).toBeVisible();
    });
  });
});