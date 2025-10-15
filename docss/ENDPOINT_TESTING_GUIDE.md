# MarketSage Backend Endpoint Testing Guide

## Overview

This guide provides comprehensive instructions for testing all 150+ MarketSage backend endpoints using real authentication and user data. The testing suite ensures end-to-end validation of the entire API ecosystem.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MarketSage Backend** running on the specified URL
3. **Valid user credentials** with appropriate permissions
4. **Network access** to the backend server

## Quick Start

### 1. Using the Shell Script (Recommended)

```bash
# Make the script executable (if not already done)
chmod +x run-endpoint-tests.sh

# Run tests with real credentials
./run-endpoint-tests.sh -e admin@marketsage.com -p admin123

# Or with custom backend URL
./run-endpoint-tests.sh -u http://localhost:3006 -e admin@marketsage.com -p admin123
```

### 2. Using Node.js Directly

```bash
# Set environment variables
export TEST_USER_EMAIL="admin@marketsage.com"
export TEST_USER_PASSWORD="admin123"
export NESTJS_BACKEND_URL="http://localhost:3006"

# Run the test script
node test-endpoints.js
```

### 3. Using Environment Variables

Create a `.env` file in the project root:

```bash
# Backend Configuration
NESTJS_BACKEND_URL=http://localhost:3006

# Test User Credentials
TEST_USER_EMAIL=admin@marketsage.com
TEST_USER_PASSWORD=admin123
TEST_ORG_ID=1
```

Then run:
```bash
node test-endpoints.js
```

## Command Line Options

### Shell Script Options

```bash
./run-endpoint-tests.sh [options]

Options:
  -h, --help              Show help message
  -u, --url URL           Backend URL (default: http://localhost:3006)
  -e, --email EMAIL       Test user email (required)
  -p, --password PASS     Test user password (required)
  -o, --org-id ID         Organization ID (optional)
  -t, --timeout MS        Request timeout in ms (default: 10000)
  -c, --concurrent N      Concurrent requests (default: 5)
```

### Node.js Script Options

```bash
node test-endpoints.js [options]

Options:
  --help, -h              Show help message
  --url <url>             Set backend URL
  --timeout <ms>          Set request timeout
  --concurrent <n>        Set concurrent requests
```

## Test Categories

The test suite covers all major API categories:

### Core & Authentication (6 endpoints)
- Health check
- User authentication (login, register, refresh, logout)
- Current user info

### User Management (5 endpoints)
- CRUD operations for users
- User listing and pagination

### Organization Management (5 endpoints)
- CRUD operations for organizations
- Organization listing

### Campaign Management (7 endpoints)
- Campaign CRUD operations
- Campaign sending and analytics
- Campaign performance tracking

### Contact Management (7 endpoints)
- Contact CRUD operations
- Contact import/export
- Contact segmentation

### Email Module (6 endpoints)
- Email campaign management
- Email template management
- Email provider configuration

### SMS Module (6 endpoints)
- SMS campaign management
- SMS template management
- SMS provider configuration

### WhatsApp Module (4 endpoints)
- WhatsApp campaign management
- WhatsApp template management

### AI Intelligence Module (16 endpoints)
- AI intelligence operations
- Autonomous segmentation
- Customer journey optimization
- Predictive analytics
- Content generation
- Supreme AI v3
- Autonomous A/B testing
- AI feedback collection

### Analytics Module (9 endpoints)
- Query analytics
- Predictive analytics
- Organization analytics
- Campaign analytics
- User analytics
- Revenue analytics
- Performance analytics
- Engagement analytics

### Admin Module (9 endpoints)
- Admin dashboard
- User administration
- Organization administration
- System administration
- Log management
- Maintenance operations
- Backup management
- Security management

### Additional Modules (12 endpoints)
- Billing management
- Dashboard operations
- Message handling
- Notification management
- Settings management
- Support operations
- Workflow management
- LeadPulse integration
- Audit logging
- Incident management
- Security operations
- Tracing operations

## Expected Results

### Success Criteria

- **95%+ Success Rate**: All endpoints working properly
- **90-95% Success Rate**: Most endpoints working, minor issues to fix
- **80-90% Success Rate**: Several endpoints need attention
- **<80% Success Rate**: Major issues with backend endpoints

### Response Time Expectations

- **Health Check**: < 100ms
- **Authentication**: < 500ms
- **CRUD Operations**: < 1000ms
- **Analytics Queries**: < 2000ms
- **AI Operations**: < 5000ms

## Troubleshooting

### Common Issues

#### 1. Authentication Failed
```
❌ Authentication failed: Invalid credentials
```

**Solutions:**
- Verify user credentials are correct
- Ensure user account is active
- Check if user has necessary permissions
- Verify backend is running and accessible

#### 2. Connection Timeout
```
💥 GET /health - ERROR: Request timeout
```

**Solutions:**
- Check backend server is running
- Verify network connectivity
- Increase timeout value: `--timeout 30000`
- Check firewall settings

#### 3. 401 Unauthorized
```
❌ GET /users - 401 (1200ms)
```

**Solutions:**
- Verify JWT token is valid
- Check token expiration
- Ensure user has required permissions
- Re-authenticate if token expired

#### 4. 404 Not Found
```
❌ GET /nonexistent - 404 (800ms)
```

**Solutions:**
- Verify endpoint path is correct
- Check if endpoint is implemented in backend
- Ensure API version is correct
- Check backend routing configuration

#### 5. 500 Internal Server Error
```
❌ POST /campaigns - 500 (1500ms)
```

**Solutions:**
- Check backend logs for detailed error
- Verify database connectivity
- Check required environment variables
- Ensure all dependencies are installed

### Debug Mode

Enable verbose logging by setting environment variable:

```bash
export DEBUG=true
node test-endpoints.js
```

## Postman Collection

### Import Collection

1. Open Postman
2. Click "Import" button
3. Select `marketsage-api-collection.json`
4. Set environment variables:
   - `NESTJS_BACKEND_URL`: Your backend URL
   - `TEST_USER_EMAIL`: Your test user email
   - `TEST_USER_PASSWORD`: Your test user password
   - `TEST_ORG_ID`: Your organization ID (optional)

### Using the Collection

1. **First, authenticate**: Run the "Login" request to get a JWT token
2. **Set the token**: Copy the `accessToken` from the response and set it as `JWT_TOKEN` in your environment
3. **Run tests**: Execute individual requests or use the collection runner

### Collection Runner

1. Click on the collection name
2. Click "Run collection"
3. Select all requests or specific ones
4. Set iterations and delay
5. Click "Run MarketSage API"

## Continuous Integration

### GitHub Actions Example

```yaml
name: API Endpoint Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-endpoints:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Start backend
      run: |
        cd ../marketsage-backend
        npm install
        npm run start:dev &
        sleep 30
        
    - name: Run endpoint tests
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        NESTJS_BACKEND_URL: http://localhost:3006
      run: node test-endpoints.js
```

## Security Considerations

### Credential Management

- **Never commit credentials** to version control
- **Use environment variables** for sensitive data
- **Rotate test credentials** regularly
- **Use dedicated test accounts** with limited permissions

### Test Data

- **Use realistic test data** that mirrors production
- **Clean up test data** after tests complete
- **Avoid using production data** in tests
- **Implement data isolation** between test runs

## Performance Testing

### Load Testing

For performance validation, run tests with higher concurrency:

```bash
# Test with 20 concurrent requests
./run-endpoint-tests.sh -c 20 -e admin@marketsage.com -p admin123

# Test with longer timeout for slow operations
./run-endpoint-tests.sh -t 30000 -e admin@marketsage.com -p admin123
```

### Monitoring

Monitor these metrics during testing:

- **Response Times**: Should be within expected ranges
- **Error Rates**: Should be minimal (< 5%)
- **Memory Usage**: Backend should handle load gracefully
- **Database Performance**: Queries should be optimized

## Reporting

### Test Reports

The test suite generates detailed reports including:

- **Overall Success Rate**: Percentage of passing tests
- **Category Breakdown**: Success rates by API category
- **Response Time Analysis**: Average, min, max response times
- **Error Details**: Specific failures with status codes
- **Performance Metrics**: Throughput and latency data

### Integration with Monitoring

Results can be integrated with monitoring systems:

```bash
# Output results to file for processing
node test-endpoints.js > test-results.json 2>&1

# Send results to monitoring service
curl -X POST https://monitoring.example.com/api/test-results \
  -H "Content-Type: application/json" \
  -d @test-results.json
```

## Best Practices

### Testing Strategy

1. **Run tests regularly** (daily in CI/CD)
2. **Test before deployments** to catch regressions
3. **Monitor trends** over time for performance degradation
4. **Test with realistic data** volumes and patterns
5. **Validate error handling** and edge cases

### Maintenance

1. **Update test data** regularly to reflect schema changes
2. **Add new endpoints** as they are implemented
3. **Review and update** success criteria as system evolves
4. **Monitor and optimize** test execution time
5. **Keep documentation** current with API changes

## Support

For issues or questions:

1. **Check the troubleshooting section** above
2. **Review backend logs** for detailed error information
3. **Verify environment setup** and dependencies
4. **Test with minimal configuration** to isolate issues
5. **Contact the development team** with specific error details

---

**Note**: This testing suite is designed to provide comprehensive validation of the MarketSage backend API. Regular execution ensures system reliability and helps identify issues before they impact users.
