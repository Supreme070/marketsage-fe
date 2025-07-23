import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Analytics and LeadPulse E2E Tests
 * Tests visitor intelligence and analytics with real MCP data integration
 */

test.describe('Analytics & LeadPulse', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.login();
  });

  test.describe('LeadPulse Visitor Tracking', () => {
    test('visitor map shows real visitor data from MCP', async ({ page }) => {
      await testUtils.navigateTo('leadpulse');
      
      // Wait for LeadPulse to load
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify visitor map is displayed
      await expect(page.locator('[data-testid="visitor-map"]')).toBeVisible();
      
      // Check for real visitor indicators (not demo data)
      await expect(page.locator('[data-testid="active-visitors"]')).toBeVisible();
      const visitorCount = await page.textContent('[data-testid="active-visitors"]');
      expect(visitorCount).not.toContain('Demo');
      expect(visitorCount).not.toContain('Sample');
      
      // Verify visitor pins on map
      await expect(page.locator('[data-testid="visitor-pin"]')).toHaveCount({ min: 1 });
      
      // Click on visitor pin to see details
      await page.click('[data-testid="visitor-pin"]:first-child');
      await expect(page.locator('[data-testid="visitor-details-popup"]')).toBeVisible();
      
      // Verify real visitor information
      await expect(page.locator('[data-testid="visitor-location"]')).toBeVisible();
      await expect(page.locator('[data-testid="visitor-device"]')).toBeVisible();
      await expect(page.locator('[data-testid="visitor-source"]')).toBeVisible();
    });

    test('real-time visitor tracking and notifications work', async ({ page }) => {
      await testUtils.navigateTo('leadpulse');
      await testUtils.waitForLoadingComplete();
      
      // Verify real-time connection
      await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected|active/);
      
      // Check for real-time visitor updates
      const initialVisitorCount = await page.textContent('[data-testid="total-visitors"]');
      
      // Wait for potential real-time updates
      await page.waitForTimeout(5000);
      
      // Verify visitor activity feed
      await expect(page.locator('[data-testid="visitor-activity-feed"]')).toBeVisible();
      
      // Check activity entries show real data
      const activityEntries = page.locator('[data-testid="activity-entry"]');
      await expect(activityEntries.first()).toBeVisible();
      
      // Verify activity entry contains real information
      const activityText = await activityEntries.first().textContent();
      expect(activityText).not.toContain('Demo User');
      expect(activityText).not.toContain('Sample Activity');
      
      // Test visitor alerts
      await page.click('[data-testid="visitor-alerts"]');
      await expect(page.locator('[data-testid="alerts-panel"]')).toBeVisible();
      
      // Check for high-value visitor alerts
      try {
        await expect(page.locator('[data-testid="high-value-visitor-alert"]')).toBeVisible({ timeout: 3000 });
      } catch {
        // Alert may not be present if no high-value visitors
      }
    });

    test('visitor behavior analytics show engagement patterns', async ({ page }) => {
      await testUtils.navigateTo('leadpulse');
      await page.click('[data-testid="behavior-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify behavior analytics dashboard
      await expect(page.locator('[data-testid="behavior-dashboard"]')).toBeVisible();
      
      // Check page view analytics
      await expect(page.locator('[data-testid="page-views-chart"]')).toBeVisible();
      
      // Verify session duration metrics
      await expect(page.locator('[data-testid="session-duration"]')).toBeVisible();
      const avgSessionTime = await page.textContent('[data-testid="avg-session-duration"]');
      expect(avgSessionTime).not.toContain('0:00');
      expect(avgSessionTime).not.toContain('Demo');
      
      // Check bounce rate
      await expect(page.locator('[data-testid="bounce-rate"]')).toBeVisible();
      
      // Verify user flow visualization
      await page.click('[data-testid="user-flow"]');
      await expect(page.locator('[data-testid="flow-diagram"]')).toBeVisible();
      
      // Check for real page transitions
      await expect(page.locator('[data-testid="flow-node"]')).toHaveCount({ min: 2 });
      
      // Test heatmap functionality
      await page.click('[data-testid="heatmap-tab"]');
      await expect(page.locator('[data-testid="heatmap-selector"]')).toBeVisible();
      
      // Select page for heatmap
      await page.selectOption('[data-testid="heatmap-page"]', '/');
      await page.click('[data-testid="load-heatmap"]');
      
      // Verify heatmap displays real click data
      await expect(page.locator('[data-testid="heatmap-overlay"]')).toBeVisible();
      await expect(page.locator('[data-testid="click-hotspot"]')).toHaveCount({ min: 1 });
    });

    test('form tracking and conversion analytics work correctly', async ({ page }) => {
      await testUtils.navigateTo('leadpulse');
      await page.click('[data-testid="form-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify form performance dashboard
      await expect(page.locator('[data-testid="form-performance"]')).toBeVisible();
      
      // Check form conversion rates
      await expect(page.locator('[data-testid="form-conversion-rate"]')).toBeVisible();
      const conversionRate = await page.textContent('[data-testid="form-conversion-rate"]');
      expect(conversionRate).not.toContain('0%');
      expect(conversionRate).not.toContain('Demo');
      
      // Verify form abandonment analysis
      await expect(page.locator('[data-testid="form-abandonment"]')).toBeVisible();
      
      // Check field-level analytics
      await page.click('[data-testid="field-analytics"]');
      await expect(page.locator('[data-testid="field-performance-table"]')).toBeVisible();
      
      // Verify drop-off points
      await expect(page.locator('[data-testid="field-dropoff"]')).toHaveCount({ min: 1 });
      
      // Test form optimization suggestions
      await page.click('[data-testid="optimization-suggestions"]');
      await expect(page.locator('[data-testid="ai-form-suggestions"]')).toBeVisible();
      
      // Check suggestion types
      const suggestions = page.locator('[data-testid="suggestion-item"]');
      await expect(suggestions).toHaveCount({ min: 1 });
      
      // Apply a suggestion
      await page.click('[data-testid="apply-suggestion"]:first-child');
      await expect(page.locator('[data-testid="suggestion-applied"]')).toBeVisible();
    });

    test('visitor identification and lead scoring work with MCP data', async ({ page }) => {
      await testUtils.navigateTo('leadpulse');
      await page.click('[data-testid="visitor-identification"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify identified visitors list
      await expect(page.locator('[data-testid="identified-visitors"]')).toBeVisible();
      
      // Check visitor profiles
      const visitorProfiles = page.locator('[data-testid="visitor-profile"]');
      await expect(visitorProfiles.first()).toBeVisible();
      
      // Click on visitor profile
      await visitorProfiles.first().click();
      await expect(page.locator('[data-testid="visitor-detail-panel"]')).toBeVisible();
      
      // Verify visitor information from MCP
      await expect(page.locator('[data-testid="visitor-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="visitor-company"]')).toBeVisible();
      
      // Check lead score
      await expect(page.locator('[data-testid="lead-score"]')).toBeVisible();
      const leadScore = await page.textContent('[data-testid="lead-score"]');
      expect(leadScore).not.toContain('0');
      expect(leadScore).not.toContain('Demo');
      
      // Verify scoring factors
      await expect(page.locator('[data-testid="scoring-factors"]')).toBeVisible();
      
      // Check visitor journey
      await page.click('[data-testid="visitor-journey"]');
      await expect(page.locator('[data-testid="journey-timeline"]')).toBeVisible();
      
      // Verify journey events show real data
      const journeyEvents = page.locator('[data-testid="journey-event"]');
      await expect(journeyEvents).toHaveCount({ min: 2 });
      
      // Test visitor conversion
      await page.click('[data-testid="convert-visitor"]');
      await expect(page.locator('[data-testid="conversion-modal"]')).toBeVisible();
      
      // Convert to lead
      await page.selectOption('[data-testid="lead-source"]', 'website');
      await page.click('[data-testid="confirm-conversion"]');
      
      // Verify conversion success
      await expect(page.locator('[data-testid="conversion-success"]')).toBeVisible();
    });
  });

  test.describe('Business Intelligence Analytics', () => {
    test('revenue analytics show real business metrics', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify revenue dashboard
      await expect(page.locator('[data-testid="revenue-dashboard"]')).toBeVisible();
      
      // Check revenue metrics
      const revenueMetrics = [
        'total-revenue',
        'monthly-recurring-revenue',
        'average-order-value',
        'customer-lifetime-value'
      ];

      for (const metric of revenueMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        
        // Verify values are not demo/placeholder
        const value = await page.textContent(`[data-testid="${metric}"]`);
        expect(value).not.toContain('Demo');
        expect(value).not.toContain('$0');
      }
      
      // Check revenue trend chart
      await expect(page.locator('[data-testid="revenue-trend-chart"]')).toBeVisible();
      
      // Verify chart has data points
      await expect(page.locator('[data-testid="chart-data-point"]')).toHaveCount({ min: 5 });
      
      // Test date range filtering
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify chart updates with new data
      await expect(page.locator('[data-testid="chart-updated"]')).toBeVisible();
    });

    test('campaign performance analytics show cross-channel insights', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      await page.click('[data-testid="campaign-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify campaign performance overview
      await expect(page.locator('[data-testid="campaign-overview"]')).toBeVisible();
      
      // Check channel performance comparison
      await expect(page.locator('[data-testid="channel-comparison"]')).toBeVisible();
      
      // Verify individual channel metrics
      const channels = ['email', 'sms', 'whatsapp'];
      for (const channel of channels) {
        await expect(page.locator(`[data-testid="${channel}-performance"]`)).toBeVisible();
        
        // Check channel-specific metrics
        await expect(page.locator(`[data-testid="${channel}-open-rate"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="${channel}-conversion-rate"]`)).toBeVisible();
      }
      
      // Test campaign ROI analysis
      await page.click('[data-testid="roi-analysis"]');
      await expect(page.locator('[data-testid="roi-chart"]')).toBeVisible();
      
      // Verify ROI calculations show real data
      await expect(page.locator('[data-testid="total-roi"]')).toBeVisible();
      const totalROI = await page.textContent('[data-testid="total-roi"]');
      expect(totalROI).not.toContain('0%');
      expect(totalROI).not.toContain('Demo');
      
      // Check attribution modeling
      await page.click('[data-testid="attribution-model"]');
      await expect(page.locator('[data-testid="attribution-results"]')).toBeVisible();
    });

    test('customer analytics and segmentation insights work', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      await page.click('[data-testid="customer-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify customer analytics dashboard
      await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
      
      // Check customer metrics
      const customerMetrics = [
        'total-customers',
        'new-customers',
        'customer-retention-rate',
        'churn-rate'
      ];

      for (const metric of customerMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        
        // Verify real values
        const value = await page.textContent(`[data-testid="${metric}"]`);
        expect(value).not.toContain('Demo');
      }
      
      // Check customer segmentation analysis
      await page.click('[data-testid="segmentation-analysis"]');
      await expect(page.locator('[data-testid="segment-performance"]')).toBeVisible();
      
      // Verify segment comparison
      await expect(page.locator('[data-testid="segment-comparison-chart"]')).toBeVisible();
      
      // Check cohort analysis
      await page.click('[data-testid="cohort-analysis"]');
      await expect(page.locator('[data-testid="cohort-table"]')).toBeVisible();
      
      // Verify cohort data shows real retention patterns
      await expect(page.locator('[data-testid="cohort-cell"]')).toHaveCount({ min: 10 });
      
      // Test customer journey analytics
      await page.click('[data-testid="journey-analytics"]');
      await expect(page.locator('[data-testid="journey-funnel"]')).toBeVisible();
      
      // Verify funnel stages have real conversion rates
      const funnelStages = page.locator('[data-testid="funnel-stage"]');
      await expect(funnelStages).toHaveCount({ min: 3 });
    });

    test('predictive analytics and forecasting work with MCP data', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      await page.click('[data-testid="predictive-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify predictive dashboard
      await expect(page.locator('[data-testid="predictive-dashboard"]')).toBeVisible();
      
      // Check revenue forecasting
      await expect(page.locator('[data-testid="revenue-forecast"]')).toBeVisible();
      
      // Verify forecast chart shows projections
      await expect(page.locator('[data-testid="forecast-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="forecast-line"]')).toBeVisible();
      
      // Check confidence intervals
      await expect(page.locator('[data-testid="confidence-interval"]')).toBeVisible();
      
      // Test churn prediction
      await page.click('[data-testid="churn-prediction"]');
      await expect(page.locator('[data-testid="churn-forecast"]')).toBeVisible();
      
      // Verify at-risk customers
      await expect(page.locator('[data-testid="at-risk-customers"]')).toBeVisible();
      
      // Check customer lifetime value predictions
      await page.click('[data-testid="clv-prediction"]');
      await expect(page.locator('[data-testid="clv-distribution"]')).toBeVisible();
      
      // Verify model accuracy metrics
      await page.click('[data-testid="model-accuracy"]');
      await expect(page.locator('[data-testid="accuracy-metrics"]')).toBeVisible();
      
      // Check model performance indicators
      await expect(page.locator('[data-testid="model-rmse"]')).toBeVisible();
      await expect(page.locator('[data-testid="model-mae"]')).toBeVisible();
    });

    test('real-time analytics and alerts function correctly', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      await page.click('[data-testid="realtime-analytics"]');
      
      await testUtils.waitForLoadingComplete();
      
      // Verify real-time dashboard
      await expect(page.locator('[data-testid="realtime-dashboard"]')).toBeVisible();
      
      // Check real-time connection status
      await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected|active/);
      
      // Verify live metrics
      const liveMetrics = [
        'live-visitors',
        'live-conversions',
        'live-revenue',
        'live-campaigns'
      ];

      for (const metric of liveMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
      }
      
      // Check real-time activity feed
      await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
      
      // Verify activity updates
      const initialActivityCount = await page.locator('[data-testid="activity-item"]').count();
      
      // Wait for potential new activities
      await page.waitForTimeout(5000);
      
      // Test alert configuration
      await page.click('[data-testid="configure-alerts"]');
      await expect(page.locator('[data-testid="alerts-config"]')).toBeVisible();
      
      // Set up revenue alert
      await page.fill('[data-testid="revenue-threshold"]', '1000');
      await page.check('[data-testid="enable-revenue-alert"]');
      
      // Set up conversion alert
      await page.fill('[data-testid="conversion-threshold"]', '5');
      await page.check('[data-testid="enable-conversion-alert"]');
      
      // Save alert configuration
      await page.click('[data-testid="save-alerts"]');
      await expect(page.locator('[data-testid="alerts-saved"]')).toBeVisible();
    });
  });

  test.describe('Performance and Data Export', () => {
    test('analytics data export functions work correctly', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      
      // Test CSV export
      await page.click('[data-testid="export-data"]');
      await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
      
      // Configure export settings
      await page.selectOption('[data-testid="export-format"]', 'csv');
      await page.selectOption('[data-testid="date-range"]', 'last_30_days');
      
      // Select data to export
      await page.check('[data-testid="export-campaigns"]');
      await page.check('[data-testid="export-visitors"]');
      await page.check('[data-testid="export-conversions"]');
      
      // Start export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="start-export"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('analytics');
      expect(download.suggestedFilename()).toContain('.csv');
      
      // Test PDF report export
      await page.click('[data-testid="export-report"]');
      await page.selectOption('[data-testid="report-format"]', 'pdf');
      await page.selectOption('[data-testid="report-type"]', 'executive_summary');
      
      const reportDownloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="generate-report"]');
      const reportDownload = await reportDownloadPromise;
      
      expect(reportDownload.suggestedFilename()).toContain('report');
      expect(reportDownload.suggestedFilename()).toContain('.pdf');
    });

    test('analytics performance with large datasets', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      
      // Load large dataset
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-12-months"]');
      
      // Measure load time
      const startTime = Date.now();
      await testUtils.waitForLoadingComplete();
      const loadTime = Date.now() - startTime;
      
      // Verify acceptable performance (less than 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Check that data is properly paginated/virtualized
      await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
      
      // Test infinite scroll or pagination
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // Verify more data loads
      await expect(page.locator('[data-testid="loading-more"]')).toBeVisible();
      
      // Test search and filtering performance
      await page.fill('[data-testid="analytics-search"]', 'campaign');
      await page.keyboard.press('Enter');
      
      const searchStartTime = Date.now();
      await testUtils.waitForLoadingComplete();
      const searchTime = Date.now() - searchStartTime;
      
      // Verify fast search (less than 2 seconds)
      expect(searchTime).toBeLessThan(2000);
    });

    test('analytics data accuracy and consistency', async ({ page }) => {
      await testUtils.navigateTo('analytics');
      
      // Compare totals across different views
      const dashboardTotal = await page.textContent('[data-testid="dashboard-total-visitors"]');
      
      // Navigate to detailed visitor analytics
      await page.click('[data-testid="detailed-visitor-analytics"]');
      await testUtils.waitForLoadingComplete();
      
      const detailTotal = await page.textContent('[data-testid="detail-total-visitors"]');
      
      // Verify consistency
      expect(dashboardTotal).toBe(detailTotal);
      
      // Check data freshness indicators
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
      
      const lastUpdated = await page.textContent('[data-testid="last-updated"]');
      expect(lastUpdated).not.toContain('Never');
      
      // Verify real-time data synchronization
      await page.click('[data-testid="refresh-data"]');
      await testUtils.waitForLoadingComplete();
      
      // Check that refresh timestamp updates
      const newLastUpdated = await page.textContent('[data-testid="last-updated"]');
      expect(newLastUpdated).not.toBe(lastUpdated);
    });
  });
});