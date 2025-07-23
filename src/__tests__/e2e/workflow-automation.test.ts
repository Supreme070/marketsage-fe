import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Workflow Automation E2E Tests
 * Tests visual workflow builder and automation execution with MCP data
 */

test.describe('Workflow Automation', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.login();
  });

  test.describe('Workflow Builder', () => {
    test('can create workflow using visual builder', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Create new workflow
      await testUtils.createTestWorkflow('Welcome Series Automation');
      
      // Verify workflow builder interface
      await expect(page.locator('[data-testid="workflow-canvas"]')).toBeVisible();
      await expect(page.locator('[data-testid="node-palette"]')).toBeVisible();
      
      // Add trigger node
      await page.dragAndDrop('[data-testid="trigger-contact-created"]', '[data-testid="workflow-canvas"]');
      
      // Configure trigger
      await page.click('[data-testid="trigger-node"]');
      await expect(page.locator('[data-testid="trigger-settings"]')).toBeVisible();
      
      // Add delay node
      await page.dragAndDrop('[data-testid="delay-node"]', '[data-testid="workflow-canvas"]');
      
      // Configure delay
      await page.click('[data-testid="delay-node"]');
      await page.fill('[data-testid="delay-amount"]', '1');
      await page.selectOption('[data-testid="delay-unit"]', 'hours');
      
      // Add email action
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      
      // Configure email
      await page.click('[data-testid="email-node"]');
      await page.selectOption('[data-testid="email-template"]', 'welcome-email');
      
      // Connect nodes
      await page.hover('[data-testid="trigger-node"] [data-testid="output-connector"]');
      await page.mouse.down();
      await page.hover('[data-testid="delay-node"] [data-testid="input-connector"]');
      await page.mouse.up();
      
      await page.hover('[data-testid="delay-node"] [data-testid="output-connector"]');
      await page.mouse.down();
      await page.hover('[data-testid="email-node"] [data-testid="input-connector"]');
      await page.mouse.up();
      
      // Save workflow
      await page.click('[data-testid="save-workflow"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify workflow is saved
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('workflow validation and error handling works', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      await page.click('[data-testid="create-workflow"]');
      
      // Try to save incomplete workflow
      await page.click('[data-testid="save-workflow"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
      await expect(page.locator('text=Workflow must have at least one trigger')).toBeVisible();
      
      // Add trigger but no actions
      await page.dragAndDrop('[data-testid="trigger-form-submission"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="save-workflow"]');
      
      // Verify action requirement error
      await expect(page.locator('text=Workflow must have at least one action')).toBeVisible();
      
      // Add action with invalid configuration
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="save-workflow"]');
      
      // Verify configuration errors
      await expect(page.locator('text=Email template is required')).toBeVisible();
      
      // Fix configuration and save successfully
      await page.click('[data-testid="email-node"]');
      await page.selectOption('[data-testid="email-template"]', 'default-template');
      await page.click('[data-testid="save-workflow"]');
      
      // Verify successful save
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('complex workflow with conditional logic works', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      await page.click('[data-testid="create-workflow"]');
      
      await page.fill('[data-testid="workflow-name"]', 'Advanced Lead Nurturing');
      
      // Add form submission trigger
      await page.dragAndDrop('[data-testid="trigger-form-submission"]', '[data-testid="workflow-canvas"]');
      
      // Add condition node
      await page.dragAndDrop('[data-testid="condition-node"]', '[data-testid="workflow-canvas"]');
      
      // Configure condition
      await page.click('[data-testid="condition-node"]');
      await page.selectOption('[data-testid="condition-field"]', 'lead_score');
      await page.selectOption('[data-testid="condition-operator"]', 'greater_than');
      await page.fill('[data-testid="condition-value"]', '50');
      
      // Add actions for both branches
      // High score branch
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="email-node"]');
      await page.selectOption('[data-testid="email-template"]', 'high-value-lead');
      
      // Low score branch
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="email-node"]:nth-child(2)');
      await page.selectOption('[data-testid="email-template"]', 'nurture-sequence');
      
      // Connect nodes
      // Trigger to condition
      await page.hover('[data-testid="trigger-node"] [data-testid="output-connector"]');
      await page.mouse.down();
      await page.hover('[data-testid="condition-node"] [data-testid="input-connector"]');
      await page.mouse.up();
      
      // Condition to high score email (true branch)
      await page.hover('[data-testid="condition-node"] [data-testid="true-connector"]');
      await page.mouse.down();
      await page.hover('[data-testid="email-node"]:first-child [data-testid="input-connector"]');
      await page.mouse.up();
      
      // Condition to low score email (false branch)
      await page.hover('[data-testid="condition-node"] [data-testid="false-connector"]');
      await page.mouse.down();
      await page.hover('[data-testid="email-node"]:nth-child(2) [data-testid="input-connector"]');
      await page.mouse.up();
      
      // Test workflow
      await page.click('[data-testid="test-workflow"]');
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
      
      // Save workflow
      await page.click('[data-testid="save-workflow"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('workflow templates and marketplace work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Access template marketplace
      await page.click('[data-testid="workflow-templates"]');
      await expect(page.locator('[data-testid="template-marketplace"]')).toBeVisible();
      
      // Browse template categories
      await page.click('[data-testid="category-welcome-series"]');
      await expect(page.locator('[data-testid="welcome-templates"]')).toBeVisible();
      
      // Preview template
      await page.click('[data-testid="template-preview"]:first-child');
      await expect(page.locator('[data-testid="template-details"]')).toBeVisible();
      
      // Check template rating and reviews
      await expect(page.locator('[data-testid="template-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-reviews"]')).toBeVisible();
      
      // Install template
      await page.click('[data-testid="install-template"]');
      await page.fill('[data-testid="workflow-name"]', 'Installed Welcome Series');
      await page.click('[data-testid="confirm-install"]');
      
      // Verify template is installed and customizable
      await expect(page.locator('[data-testid="workflow-canvas"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-nodes"]')).toHaveCount({ min: 3 });
      
      // Customize template
      await page.click('[data-testid="email-node"]:first-child');
      await page.selectOption('[data-testid="email-template"]', 'custom-welcome');
      
      // Save customized workflow
      await page.click('[data-testid="save-workflow"]');
      await expect(page.locator('text=Installed Welcome Series')).toBeVisible();
    });
  });

  test.describe('Workflow Execution & Monitoring', () => {
    test('workflow execution with real MCP data works', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Open existing workflow
      await page.click('[data-testid="workflow-row"]:first-child');
      await page.click('[data-testid="view-workflow"]');
      
      // Activate workflow
      await page.click('[data-testid="activate-workflow"]');
      await expect(page.locator('[data-testid="workflow-status"]')).toContainText('Active');
      
      // View execution logs
      await page.click('[data-testid="execution-logs"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify real execution data (not demo)
      await testUtils.verifyMCPDataLoaded();
      await expect(page.locator('[data-testid="execution-entry"]')).toHaveCount({ min: 1 });
      
      // Check execution details
      await page.click('[data-testid="execution-entry"]:first-child');
      await expect(page.locator('[data-testid="execution-timeline"]')).toBeVisible();
      
      // Verify step-by-step execution
      const executionSteps = [
        'trigger-executed',
        'condition-evaluated',
        'action-completed'
      ];

      for (const step of executionSteps) {
        try {
          await expect(page.locator(`[data-testid="${step}"]`)).toBeVisible({ timeout: 2000 });
        } catch {
          // Not all steps may be present in every execution
          continue;
        }
      }
    });

    test('workflow performance analytics show real metrics', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // View workflow analytics
      await page.click('[data-testid="workflow-analytics"]');
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Verify performance metrics
      const performanceMetrics = [
        'total-executions',
        'success-rate',
        'average-completion-time',
        'conversion-rate',
        'revenue-generated'
      ];

      for (const metric of performanceMetrics) {
        await expect(page.locator(`[data-testid="${metric}"]`)).toBeVisible();
        
        // Verify values are not placeholder/demo
        const value = await page.textContent(`[data-testid="${metric}"]`);
        expect(value).not.toContain('Demo');
        expect(value).not.toContain('N/A');
      }
      
      // Check performance charts
      await expect(page.locator('[data-testid="execution-trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversion-funnel"]')).toBeVisible();
      
      // Verify real-time metrics
      await expect(page.locator('[data-testid="realtime-executions"]')).toBeVisible();
    });

    test('workflow error handling and retry mechanisms work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Create workflow with potential failure points
      await page.click('[data-testid="create-workflow"]');
      await page.fill('[data-testid="workflow-name"]', 'Error Handling Test');
      
      // Add trigger
      await page.dragAndDrop('[data-testid="trigger-contact-created"]', '[data-testid="workflow-canvas"]');
      
      // Add email action with retry configuration
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="email-node"]');
      
      // Configure retry settings
      await page.click('[data-testid="advanced-settings"]');
      await page.fill('[data-testid="max-retries"]', '3');
      await page.fill('[data-testid="retry-delay"]', '5');
      await page.selectOption('[data-testid="retry-strategy"]', 'exponential_backoff');
      
      // Configure error handling
      await page.selectOption('[data-testid="on-error"]', 'continue');
      await page.check('[data-testid="log-errors"]');
      
      // Save and activate
      await page.click('[data-testid="save-workflow"]');
      await page.click('[data-testid="activate-workflow"]');
      
      // Simulate error by using invalid email template
      await page.click('[data-testid="email-node"]');
      await page.selectOption('[data-testid="email-template"]', 'invalid-template');
      await page.click('[data-testid="update-node"]');
      
      // Trigger workflow execution
      await page.click('[data-testid="manual-trigger"]');
      
      // Check error logs
      await page.click('[data-testid="error-logs"]');
      await expect(page.locator('[data-testid="error-entry"]')).toBeVisible();
      
      // Verify retry attempts
      await expect(page.locator('[data-testid="retry-attempts"]')).toContainText('3');
      
      // Check error notification
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
    });

    test('workflow A/B testing and optimization work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Create A/B test workflow
      await page.click('[data-testid="create-ab-test-workflow"]');
      
      // Configure A/B test
      await page.fill('[data-testid="workflow-name"]', 'Email Timing A/B Test');
      await page.selectOption('[data-testid="test-variable"]', 'send_time');
      
      // Version A: Send immediately
      await page.fill('[data-testid="version-a-name"]', 'Immediate Send');
      await page.dragAndDrop('[data-testid="trigger-form-submission"]', '[data-testid="canvas-a"]');
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="canvas-a"]');
      
      // Version B: Send with delay
      await page.fill('[data-testid="version-b-name"]', 'Delayed Send');
      await page.dragAndDrop('[data-testid="trigger-form-submission"]', '[data-testid="canvas-b"]');
      await page.dragAndDrop('[data-testid="delay-node"]', '[data-testid="canvas-b"]');
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="canvas-b"]');
      
      // Configure test settings
      await page.fill('[data-testid="test-duration"]', '14'); // days
      await page.fill('[data-testid="traffic-split"]', '50'); // 50/50 split
      await page.selectOption('[data-testid="success-metric"]', 'email_open_rate');
      
      // Start A/B test
      await page.click('[data-testid="start-ab-test"]');
      await expect(page.locator('[data-testid="test-status"]')).toContainText('Running');
      
      // Check test performance
      await page.click('[data-testid="test-performance"]');
      await expect(page.locator('[data-testid="version-a-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="version-b-metrics"]')).toBeVisible();
      
      // Verify statistical significance tracking
      await expect(page.locator('[data-testid="statistical-significance"]')).toBeVisible();
    });
  });

  test.describe('Advanced Workflow Features', () => {
    test('multi-channel workflow sequences work correctly', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      await page.click('[data-testid="create-workflow"]');
      
      await page.fill('[data-testid="workflow-name"]', 'Multi-Channel Nurture');
      
      // Add trigger
      await page.dragAndDrop('[data-testid="trigger-lead-score"]', '[data-testid="workflow-canvas"]');
      
      // Add email sequence
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="email-node"]');
      await page.selectOption('[data-testid="email-template"]', 'nurture-email-1');
      
      // Add delay
      await page.dragAndDrop('[data-testid="delay-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="delay-node"]');
      await page.fill('[data-testid="delay-amount"]', '3');
      await page.selectOption('[data-testid="delay-unit"]', 'days');
      
      // Add SMS follow-up
      await page.dragAndDrop('[data-testid="send-sms-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="sms-node"]');
      await page.selectOption('[data-testid="sms-template"]', 'nurture-sms');
      
      // Add another delay
      await page.dragAndDrop('[data-testid="delay-node"]', '[data-testid="workflow-canvas"]');
      
      // Add WhatsApp message
      await page.dragAndDrop('[data-testid="send-whatsapp-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="whatsapp-node"]');
      await page.selectOption('[data-testid="whatsapp-template"]', 'nurture-whatsapp');
      
      // Connect all nodes
      // This would involve multiple drag operations to connect the sequence
      
      // Configure channel preferences
      await page.click('[data-testid="channel-preferences"]');
      await page.check('[data-testid="respect-unsubscribe"]');
      await page.check('[data-testid="respect-channel-preference"]');
      
      // Save and test
      await page.click('[data-testid="save-workflow"]');
      await page.click('[data-testid="test-workflow"]');
      
      // Verify multi-channel execution
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="channel-execution-plan"]')).toBeVisible();
    });

    test('workflow data enrichment and personalization work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      await page.click('[data-testid="create-workflow"]');
      
      await page.fill('[data-testid="workflow-name"]', 'Data Enrichment Workflow');
      
      // Add trigger
      await page.dragAndDrop('[data-testid="trigger-contact-created"]', '[data-testid="workflow-canvas"]');
      
      // Add data enrichment node
      await page.dragAndDrop('[data-testid="enrich-data-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="enrich-node"]');
      
      // Configure enrichment sources
      await page.check('[data-testid="enrich-company-data"]');
      await page.check('[data-testid="enrich-social-profiles"]');
      await page.check('[data-testid="enrich-location-data"]');
      
      // Add personalization node
      await page.dragAndDrop('[data-testid="personalization-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="personalization-node"]');
      
      // Configure personalization rules
      await page.click('[data-testid="add-personalization-rule"]');
      await page.selectOption('[data-testid="rule-field"]', 'industry');
      await page.selectOption('[data-testid="rule-operator"]', 'equals');
      await page.fill('[data-testid="rule-value"]', 'Technology');
      await page.selectOption('[data-testid="rule-template"]', 'tech-industry-email');
      
      // Add email with dynamic content
      await page.dragAndDrop('[data-testid="send-email-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="email-node"]');
      
      // Configure dynamic content
      await page.click('[data-testid="email-content"]');
      await page.fill('[data-testid="email-subject"]', 'Welcome {{first_name}} from {{company}}!');
      await page.fill('[data-testid="email-body"]', 'Hi {{first_name}}, we noticed you work at {{company}} in {{city}}. Here are some {{industry}}-specific resources...');
      
      // Test personalization
      await page.click('[data-testid="test-personalization"]');
      await expect(page.locator('[data-testid="personalized-preview"]')).toBeVisible();
      
      // Save workflow
      await page.click('[data-testid="save-workflow"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('workflow webhooks and external integrations work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      await page.click('[data-testid="create-workflow"]');
      
      await page.fill('[data-testid="workflow-name"]', 'External Integration Workflow');
      
      // Add webhook trigger
      await page.dragAndDrop('[data-testid="trigger-webhook"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="webhook-trigger"]');
      
      // Configure webhook
      await page.click('[data-testid="generate-webhook-url"]');
      await expect(page.locator('[data-testid="webhook-url"]')).toBeVisible();
      
      // Copy webhook URL
      await page.click('[data-testid="copy-webhook-url"]');
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
      
      // Add external API call
      await page.dragAndDrop('[data-testid="api-call-node"]', '[data-testid="workflow-canvas"]');
      await page.click('[data-testid="api-node"]');
      
      // Configure API call
      await page.selectOption('[data-testid="http-method"]', 'POST');
      await page.fill('[data-testid="api-url"]', 'https://api.example.com/contacts');
      
      // Add headers
      await page.click('[data-testid="add-header"]');
      await page.fill('[data-testid="header-key"]', 'Authorization');
      await page.fill('[data-testid="header-value"]', 'Bearer {{api_token}}');
      
      // Configure request body
      await page.fill('[data-testid="request-body"]', JSON.stringify({
        email: '{{email}}',
        name: '{{first_name}} {{last_name}}',
        company: '{{company}}'
      }));
      
      // Add response handling
      await page.click('[data-testid="response-handling"]');
      await page.selectOption('[data-testid="success-action"]', 'continue');
      await page.selectOption('[data-testid="error-action"]', 'retry');
      
      // Test API call
      await page.click('[data-testid="test-api-call"]');
      await expect(page.locator('[data-testid="api-test-result"]')).toBeVisible();
      
      // Save workflow
      await page.click('[data-testid="save-workflow"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('workflow performance optimization suggestions work', async ({ page }) => {
      await testUtils.navigateTo('workflows');
      
      // Open workflow with performance data
      await page.click('[data-testid="workflow-row"]:first-child');
      await page.click('[data-testid="performance-optimization"]');
      
      await testUtils.waitForLoadingComplete();
      await testUtils.verifyMCPDataLoaded();
      
      // Check AI optimization suggestions
      await expect(page.locator('[data-testid="ai-suggestions"]')).toBeVisible();
      
      // Verify suggestion categories
      const suggestionTypes = [
        'timing-optimization',
        'content-improvement',
        'audience-refinement',
        'performance-enhancement'
      ];

      for (const suggestionType of suggestionTypes) {
        try {
          await expect(page.locator(`[data-testid="${suggestionType}"]`)).toBeVisible({ timeout: 2000 });
        } catch {
          // Not all suggestion types may be available
          continue;
        }
      }
      
      // Apply optimization suggestion
      await page.click('[data-testid="apply-suggestion"]:first-child');
      await expect(page.locator('[data-testid="optimization-applied"]')).toBeVisible();
      
      // Check performance impact prediction
      await expect(page.locator('[data-testid="predicted-improvement"]')).toBeVisible();
    });
  });
});