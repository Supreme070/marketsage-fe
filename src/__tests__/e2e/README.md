# MarketSage E2E Test Suite

Comprehensive end-to-end tests to verify that MCP integration enhances MarketSage without breaking core functionality.

## 🎯 Test Coverage

### 1. **Authentication & Dashboard** (`auth-dashboard.test.ts`)
- User login and session management
- Dashboard navigation and data loading
- Real MCP data vs demo data verification
- Graceful MCP server unavailability handling
- Mobile responsiveness and accessibility

### 2. **Campaign Management** (`campaign-management.test.ts`)
- Email campaign creation, editing, and analytics
- SMS campaign setup and delivery tracking
- WhatsApp Business API integration
- Multi-channel campaign sequences
- A/B testing and optimization
- MCP-enhanced analytics and insights

### 3. **Contact Management** (`contact-management.test.ts`)
- Contact CRUD operations
- CSV import/export functionality
- MCP data enrichment and intelligence
- Smart segmentation with real data
- Customer journey mapping
- Predictive analytics (CLV, churn prediction)

### 4. **Workflow Automation** (`workflow-automation.test.ts`)
- Visual workflow builder
- Complex conditional logic
- Multi-channel automation sequences
- Error handling and retry mechanisms
- A/B testing workflows
- Performance analytics and optimization

### 5. **Analytics & LeadPulse** (`analytics-leadpulse.test.ts`)
- Real-time visitor tracking
- Behavior analytics and heatmaps
- Form conversion analytics
- Business intelligence dashboards
- Predictive analytics and forecasting
- Data export and reporting

### 6. **MCP Integration** (`mcp-integration.test.ts`)
- MCP server connectivity and health
- Real data integration vs fallback behavior
- Data synchronization and consistency
- Graceful degradation when servers unavailable
- Backward compatibility verification
- Error handling and user experience

### 7. **Performance & Cross-Browser** (`performance-cross-browser.test.ts`)
- Page load performance (Core Web Vitals)
- Large dataset handling
- Memory usage and stability
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsiveness
- Network condition handling
- Security and privacy compliance

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up environment variables
cp .env.example .env.test
```

### Quick Start
```bash
# Run all tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --test "auth-dashboard"

# Run in specific browser
npm run test:e2e -- --browser firefox

# Run with UI (headed mode)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

### Custom Test Runner
```bash
# Use the custom test runner
npx tsx src/__tests__/e2e/test-runner.ts

# With options
npx tsx src/__tests__/e2e/test-runner.ts --test "MCP integration" --browser chromium --headed
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device simulation
- Test isolation and parallel execution
- Custom timeouts and retries
- Comprehensive reporting

### Test Environment Setup
- Automated database seeding
- MCP server simulation
- User authentication setup
- Clean test isolation

## 📊 Test Data

### Database Seeding
The test suite includes comprehensive data seeding:

- **50 realistic contacts** with diverse profiles
- **15 campaigns** across email, SMS, and WhatsApp
- **10 workflows** with execution history
- **100 visitor sessions** for LeadPulse testing
- **MCP test data** for integration verification

### Fixtures
- `sample-contacts.csv` - Standard contact import testing
- `legacy-contacts.csv` - Backward compatibility testing

## 🎛️ Test Utilities

### `TestUtils` Class
Provides common test actions:
- User authentication
- Navigation helpers
- Loading state management
- MCP data verification
- Performance checking
- Mobile responsiveness testing

### `DatabaseSeeder` Class
Manages test data:
- Realistic data generation using Faker.js
- Foreign key relationship handling
- MCP integration data
- Clean setup and teardown

## 🏗️ Architecture

### Test Structure
```
src/__tests__/e2e/
├── auth-dashboard.test.ts          # Authentication & navigation
├── campaign-management.test.ts     # Multi-channel campaigns
├── contact-management.test.ts      # Customer intelligence
├── workflow-automation.test.ts     # Visual workflow builder
├── analytics-leadpulse.test.ts     # Visitor intelligence
├── mcp-integration.test.ts         # MCP server integration
├── performance-cross-browser.test.ts # Performance & compatibility
├── test-utils.ts                   # Common test utilities
├── database-seeder.ts              # Test data management
├── test-runner.ts                  # Custom test orchestration
├── global-setup.ts                 # Global test setup
├── global-teardown.ts              # Global cleanup
├── auth.setup.ts                   # Authentication setup
└── fixtures/                      # Test data files
    ├── sample-contacts.csv
    └── legacy-contacts.csv
```

### Key Testing Patterns

1. **Real vs Demo Data Verification**
   ```typescript
   await testUtils.verifyMCPDataLoaded();
   expect(value).not.toContain('Demo');
   ```

2. **Graceful Fallback Testing**
   ```typescript
   await page.route('**/mcp/**', route => route.abort());
   await testUtils.testMCPFallback();
   ```

3. **Performance Monitoring**
   ```typescript
   await testUtils.checkPagePerformance(3000); // Max 3s load time
   ```

4. **Cross-Browser Validation**
   ```typescript
   ['chromium', 'firefox', 'webkit'].forEach(browser => {
     test(`works in ${browser}`, async ({ page }) => {
       // Test core functionality
     });
   });
   ```

## 🔍 Debugging

### Debug Individual Tests
```bash
# Debug specific test with browser UI
npx playwright test auth-dashboard.test.ts --debug

# Run with trace viewer
npx playwright test --trace on

# Generate test report
npx playwright show-report
```

### Common Issues

1. **MCP Server Connection**
   - Ensure MCP servers are running
   - Check network connectivity
   - Verify authentication

2. **Database State**
   - Run `npm run db:reset` to clean state
   - Check database migrations
   - Verify test data seeding

3. **Application Startup**
   - Ensure port 3000 is available
   - Check environment variables
   - Verify build process

## 📈 Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npm run test:e2e -- --browser chromium
```

### Performance Monitoring
- Core Web Vitals tracking
- Memory usage monitoring
- API response time validation
- Resource loading optimization

## 🛡️ Security Testing

- Sensitive data exposure checking
- Authentication session management
- HTTPS and security headers validation
- Input sanitization verification

## 📝 Reporting

Tests generate comprehensive reports:
- HTML test results with screenshots
- JSON results for CI/CD integration
- JUnit XML for test result parsing
- Performance metrics and traces

## 🤝 Contributing

When adding new tests:

1. **Follow the existing patterns**
2. **Include real vs demo data verification**
3. **Test MCP integration and fallback**
4. **Add performance checks**
5. **Ensure cross-browser compatibility**
6. **Update this documentation**

## 📞 Support

For test-related issues:
1. Check the test logs and screenshots
2. Verify MCP server connectivity
3. Review database seeding output
4. Check Playwright trace files
5. Contact the development team

---

This E2E test suite ensures MarketSage's MCP integration enhances functionality without breaking existing features, providing confidence for production deployments.