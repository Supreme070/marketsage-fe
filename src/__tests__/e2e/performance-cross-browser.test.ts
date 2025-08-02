import { test, expect, devices } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Performance and Cross-Browser E2E Tests
 * Tests application performance, mobile compatibility, and cross-browser functionality
 */

test.describe('Performance & Cross-Browser Tests', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
  });

  test.describe('Performance Tests', () => {
    test('dashboard loads within acceptable time limits', async ({ page }) => {
      await testUtils.login();
      
      // Measure dashboard load time
      const startTime = Date.now();
      await testUtils.navigateTo('dashboard');
      await testUtils.waitForLoadingComplete();
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      console.log(`Dashboard loaded in ${loadTime}ms`);
      
      // Check Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.name === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.name === 'first-input-delay') {
                vitals.fid = entry.duration;
              }
              if (entry.name === 'cumulative-layout-shift') {
                vitals.cls = entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Fallback if no entries after 5 seconds
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Verify acceptable Core Web Vitals
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if (vitals.fid) {
        expect(vitals.fid).toBeLessThan(100); // FID < 100ms
      }
      if (vitals.cls) {
        expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });

    test('large dataset handling performance', async ({ page }) => {
      await testUtils.login();
      await testUtils.navigateTo('contacts');
      
      // Load large contact list
      await page.selectOption('[data-testid="page-size"]', '500');
      
      const startTime = Date.now();
      await testUtils.waitForLoadingComplete();
      const loadTime = Date.now() - startTime;
      
      // Large dataset should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Test scroll performance
      const scrollStartTime = Date.now();
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);
      const scrollTime = Date.now() - scrollStartTime;
      
      // Scroll should be smooth (< 1 second)
      expect(scrollTime).toBeLessThan(1000);
      
      // Test search performance
      const searchStartTime = Date.now();
      await page.fill('[data-testid="contact-search"]', 'test');
      await page.keyboard.press('Enter');
      await testUtils.waitForLoadingComplete();
      const searchTime = Date.now() - searchStartTime;
      
      // Search should be fast (< 2 seconds)
      expect(searchTime).toBeLessThan(2000);
    });

    test('memory usage remains stable during long sessions', async ({ page }) => {
      await testUtils.login();
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Simulate long session with multiple page navigations
      const sections = ['dashboard', 'campaigns', 'contacts', 'workflows', 'analytics'];
      
      for (let i = 0; i < 3; i++) {
        for (const section of sections) {
          await testUtils.navigateTo(section);
          await testUtils.waitForLoadingComplete();
          await page.waitForTimeout(1000);
        }
      }
      
      // Check memory usage after navigation
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        
        // Memory increase should be reasonable (< 200%)
        expect(memoryIncrease).toBeLessThan(2.0);
        console.log(`Memory usage increased by ${(memoryIncrease * 100).toFixed(1)}%`);
      }
    });

    test('API response times are acceptable', async ({ page }) => {
      await testUtils.login();
      
      // Test various API endpoints
      const apiEndpoints = [
        '/api/dashboard/stats',
        '/api/contacts',
        '/api/campaigns',
        '/api/workflows',
        '/api/analytics/overview'
      ];
      
      for (const endpoint of apiEndpoints) {
        const startTime = Date.now();
        const response = await page.request.get(endpoint);
        const responseTime = Date.now() - startTime;
        
        // API responses should be fast (< 1 second)
        expect(responseTime).toBeLessThan(1000);
        expect(response.status()).toBe(200);
        
        console.log(`${endpoint}: ${responseTime}ms`);
      }
    });

    test('resource loading optimization', async ({ page }) => {
      await testUtils.login();
      
      // Check for efficient resource loading
      const resourceMetrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        const metrics = {
          totalResources: entries.length,
          largeResources: entries.filter(entry => entry.transferSize > 1000000).length, // > 1MB
          slowResources: entries.filter(entry => entry.duration > 2000).length, // > 2s
          totalTransferSize: entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
        };
        return metrics;
      });
      
      // Verify resource efficiency
      expect(resourceMetrics.largeResources).toBeLessThan(5); // < 5 large resources
      expect(resourceMetrics.slowResources).toBeLessThan(3); // < 3 slow resources
      expect(resourceMetrics.totalTransferSize).toBeLessThan(10000000); // < 10MB total
      
      console.log('Resource metrics:', resourceMetrics);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('mobile navigation works correctly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await testUtils.login();
      
      // Test mobile navigation menu
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-toggle"]');
      
      // Verify mobile menu opens
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      
      // Test navigation items
      const navItems = ['dashboard', 'campaigns', 'contacts', 'workflows'];
      for (const item of navItems) {
        await page.click(`[data-testid="mobile-nav-${item}"]`);
        await testUtils.waitForLoadingComplete();
        await expect(page.locator(`[data-testid="${item}-page"]`)).toBeVisible();
      }
    });

    test('mobile forms and inputs work correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await testUtils.login();
      
      // Test contact creation form on mobile
      await testUtils.navigateTo('contacts');
      await page.click('[data-testid="add-contact"]');
      
      // Verify form is mobile-friendly
      await expect(page.locator('[data-testid="contact-form"]')).toBeVisible();
      
      // Test input fields
      await page.fill('[data-testid="contact-email"]', 'mobile@test.com');
      await page.fill('[data-testid="contact-name"]', 'Mobile User');
      
      // Test mobile keyboard doesn't break layout
      await page.click('[data-testid="contact-phone"]');
      await page.fill('[data-testid="contact-phone"]', '+1234567890');
      
      // Save contact
      await page.click('[data-testid="save-contact"]');
      await testUtils.waitForLoadingComplete();
      
      // Verify success on mobile
      await expect(page.locator('text=mobile@test.com')).toBeVisible();
    });

    test('mobile dashboard widgets are responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await testUtils.login();
      
      // Verify dashboard widgets adapt to mobile
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      
      // Check widget stacking on mobile
      const widgets = page.locator('[data-testid="dashboard-widget"]');
      const widgetCount = await widgets.count();
      
      for (let i = 0; i < widgetCount; i++) {
        await expect(widgets.nth(i)).toBeVisible();
        
        // Verify widget is properly sized for mobile
        const boundingBox = await widgets.nth(i).boundingBox();
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    });

    test('touch interactions work correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await testUtils.login();
      
      // Test touch scrolling
      await testUtils.navigateTo('contacts');
      
      // Simulate touch scroll
      await page.touchscreen.tap(200, 300);
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      // Test swipe gestures on mobile cards
      const contactCard = page.locator('[data-testid="contact-card"]:first-child');
      if (await contactCard.isVisible()) {
        const cardBox = await contactCard.boundingBox();
        
        // Simulate swipe left
        await page.touchscreen.tap(cardBox.x + cardBox.width - 10, cardBox.y + cardBox.height / 2);
        await page.touchscreen.tap(cardBox.x + 10, cardBox.y + cardBox.height / 2);
        
        // Verify swipe actions appear
        await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`core functionality works in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
        
        await testUtils.login();
        
        // Test basic navigation
        await testUtils.navigateTo('dashboard');
        await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
        
        // Test campaign creation
        await testUtils.createTestCampaign('email', `${browserName} Test Campaign`);
        await expect(page.locator(`text=${browserName} Test Campaign`)).toBeVisible();
        
        // Test contact management
        await testUtils.createTestContact(`${browserName}@test.com`, `${browserName} User`);
        await expect(page.locator(`text=${browserName}@test.com`)).toBeVisible();
        
        // Test analytics loading
        await testUtils.navigateTo('analytics');
        await testUtils.waitForLoadingComplete();
        await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      });
    });

    test('CSS and styling consistency across browsers', async ({ page }) => {
      await testUtils.login();
      
      // Check key UI elements have consistent styling
      const elements = [
        '[data-testid="dashboard-header"]',
        '[data-testid="navigation"]',
        '[data-testid="main-content"]',
        '[data-testid="sidebar"]'
      ];
      
      for (const element of elements) {
        const locator = page.locator(element);
        await expect(locator).toBeVisible();
        
        // Check computed styles
        const styles = await locator.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            position: computed.position,
            visibility: computed.visibility,
            opacity: computed.opacity
          };
        });
        
        // Verify element is properly rendered
        expect(styles.display).not.toBe('none');
        expect(styles.visibility).toBe('visible');
        expect(Number.parseFloat(styles.opacity)).toBeGreaterThan(0);
      }
    });

    test('JavaScript features work across browsers', async ({ page }) => {
      await testUtils.login();
      
      // Test modern JavaScript features
      const jsFeatures = await page.evaluate(() => {
        const features = {
          async_await: typeof (async () => {}) === 'function',
          arrow_functions: typeof (() => {}) === 'function',
          promises: typeof Promise !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          websockets: typeof WebSocket !== 'undefined'
        };
        return features;
      });
      
      // Verify essential features are supported
      expect(jsFeatures.promises).toBe(true);
      expect(jsFeatures.fetch).toBe(true);
      expect(jsFeatures.localStorage).toBe(true);
      
      // Test interactive features
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-campaign"]');
      
      // Verify dynamic content loading works
      await expect(page.locator('[data-testid="campaign-form"]')).toBeVisible();
    });

    test('accessibility features work across browsers', async ({ page }) => {
      await testUtils.login();
      
      // Test keyboard navigation
      await testUtils.testKeyboardNavigation();
      
      // Check ARIA attributes
      const ariaElements = await page.$$('[aria-label], [aria-describedby], [role]');
      expect(ariaElements.length).toBeGreaterThan(10);
      
      // Test focus management
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Verify screen reader compatibility
      const landmarks = await page.$$('main, nav, aside, header, footer, [role="main"], [role="navigation"]');
      expect(landmarks.length).toBeGreaterThan(0);
    });
  });

  test.describe('Network Conditions', () => {
    test('application works with slow network', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay
        await route.continue();
      });
      
      await testUtils.login();
      
      // Verify loading states are shown
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for content to load
      await testUtils.waitForLoadingComplete();
      
      // Verify application still functions
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      
      // Test navigation with slow network
      await testUtils.navigateTo('campaigns');
      await testUtils.waitForLoadingComplete();
      await expect(page.locator('[data-testid="campaigns-page"]')).toBeVisible();
    });

    test('offline functionality works', async ({ page }) => {
      await testUtils.login();
      
      // Go offline
      await page.context().setOffline(true);
      
      // Try to navigate
      await page.click('[data-testid="nav-contacts"]');
      
      // Should show offline notice
      await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible();
      
      // Cached content should still be accessible
      await expect(page.locator('[data-testid="cached-content"]')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
      
      // Should sync when back online
      await page.reload();
      await testUtils.waitForLoadingComplete();
      await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
    });

    test('network error handling', async ({ page }) => {
      await testUtils.login();
      
      // Simulate network errors
      await page.route('**/api/**', route => route.abort());
      
      // Try to perform an action
      await testUtils.navigateTo('campaigns');
      await page.click('[data-testid="create-campaign"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Restore network and retry
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');
      
      // Should recover gracefully
      await testUtils.waitForLoadingComplete();
      await expect(page.locator('[data-testid="campaign-form"]')).toBeVisible();
    });
  });

  test.describe('Security and Privacy', () => {
    test('sensitive data is not exposed in client-side code', async ({ page }) => {
      await testUtils.login();
      
      // Check for exposed secrets in localStorage/sessionStorage
      const storageSecrets = await page.evaluate(() => {
        const localStorage = window.localStorage;
        const sessionStorage = window.sessionStorage;
        
        const sensitivePatterns = [
          /api[_-]?key/i,
          /secret/i,
          /password/i,
          /token/i,
          /private[_-]?key/i
        ];
        
        const exposedSecrets = [];
        
        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          
          sensitivePatterns.forEach(pattern => {
            if (pattern.test(key) || pattern.test(value)) {
              exposedSecrets.push({ storage: 'localStorage', key, value });
            }
          });
        }
        
        // Check sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          const value = sessionStorage.getItem(key);
          
          sensitivePatterns.forEach(pattern => {
            if (pattern.test(key) || pattern.test(value)) {
              exposedSecrets.push({ storage: 'sessionStorage', key, value });
            }
          });
        }
        
        return exposedSecrets;
      });
      
      // Should not expose sensitive data
      expect(storageSecrets).toHaveLength(0);
    });

    test('HTTPS and security headers are properly configured', async ({ page }) => {
      await testUtils.login();
      
      const response = await page.request.get('/dashboard');
      const headers = response.headers();
      
      // Check security headers
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-xss-protection']).toBeTruthy();
      
      // Check for HTTPS in production-like environment
      const url = page.url();
      if (url.includes('https://')) {
        expect(headers['strict-transport-security']).toBeTruthy();
      }
    });

    test('session management works correctly', async ({ page }) => {
      await testUtils.login();
      
      // Verify session is established
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // Test session timeout (simulate)
      await page.route('**/api/auth/session', route => 
        route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) })
      );
      
      // Try to access protected resource
      await page.reload();
      
      // Should redirect to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });
});