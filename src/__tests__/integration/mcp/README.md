# MCP Integration Tests

This directory contains comprehensive integration tests for the MCP (Model Context Protocol) servers that test against real seeded data in a database environment.

## Overview

These integration tests are designed to:
- Test MCP server implementations with actual database data
- Validate data integrity and business logic rules
- Test performance under realistic conditions
- Ensure Docker environment compatibility
- Verify end-to-end functionality across multiple servers

## Test Structure

### Test Files

1. **`database-integration.test.ts`**
   - Tests real database operations and performance
   - Validates data seeding and integrity
   - Tests concurrent access and complex queries
   - Performance benchmarking against real data

2. **`mcp-servers-integration.test.ts`**
   - Tests actual MCP server implementations
   - Validates server responses with real data
   - Tests multi-server interactions
   - Performance and error handling validation

3. **`data-validation.test.ts`**
   - Validates business rules and data consistency
   - Tests data integrity across all MCP tables
   - Validates JSON field structures
   - Cross-table relationship verification

4. **`docker-environment.test.ts`**
   - Docker-specific functionality testing
   - Container resource and network validation
   - Docker database connection testing
   - Environment variable and volume persistence

### Supporting Files

- **`setup.ts`** - Main test database setup and utilities
- **`run-integration-tests.ts`** - Test runner with comprehensive reporting
- **`jest.integration.config.js`** - Jest configuration for integration tests
- **`test-env.ts`** - Environment variable configuration
- **`global-setup.ts`** - Global test environment preparation
- **`global-teardown.ts`** - Global cleanup after tests
- **`docker-setup.ts`** - Docker-specific setup utilities

## Prerequisites

### Database Setup

1. **Test Database**: The tests require a separate test database
   ```bash
   # For Docker environments
   TEST_DATABASE_URL="postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage_test?schema=public"
   
   # For local environments
   TEST_DATABASE_URL="postgresql://marketsage:marketsage_password@localhost:5432/marketsage_test?schema=public"
   ```

2. **Seeded Data**: Tests use data from the MCP seed scripts:
   - `src/scripts/seed-mcp-campaign-analytics.ts`
   - `src/scripts/seed-mcp-customer-predictions.ts`
   - `src/scripts/seed-mcp-visitor-sessions.ts`
   - `src/scripts/seed-mcp-monitoring-metrics.ts`

### Environment Variables

Required environment variables:
```bash
DATABASE_URL=                 # Main database URL
TEST_DATABASE_URL=           # Test database URL (optional, derived from DATABASE_URL)
NODE_ENV=test               # Set to test for integration tests
DOCKER_ENV=true            # Set to true if running in Docker
```

Optional variables:
```bash
REDIS_URL=                  # Redis connection (defaults to localhost:6379)
LOG_LEVEL=warn             # Logging level (default: warn for tests)
DATABASE_TIMEOUT=30000     # Database operation timeout
MCP_TIMEOUT=10000         # MCP operation timeout
```

## Running the Tests

### Option 1: Using the Test Runner (Recommended)

```bash
# Run all integration tests with comprehensive reporting
npm run test:integration

# Run with help to see options
npm run test:integration -- --help

# Skip pre-flight checks
npm run test:integration -- --skip-checks
```

### Option 2: Using Jest Directly

```bash
# Run all integration tests
npx jest --config src/__tests__/integration/mcp/jest.integration.config.js

# Run specific test file
npx jest database-integration.test.ts --config src/__tests__/integration/mcp/jest.integration.config.js

# Run with verbose output
npx jest --config src/__tests__/integration/mcp/jest.integration.config.js --verbose

# Run in Docker environment
DOCKER_ENV=true npx jest --config src/__tests__/integration/mcp/jest.integration.config.js
```

### Option 3: Individual Test Files

```bash
# Database integration tests
npx jest src/__tests__/integration/mcp/database-integration.test.ts

# MCP servers integration tests
npx jest src/__tests__/integration/mcp/mcp-servers-integration.test.ts

# Data validation tests
npx jest src/__tests__/integration/mcp/data-validation.test.ts

# Docker environment tests
npx jest src/__tests__/integration/mcp/docker-environment.test.ts
```

## Test Coverage

### Database Integration Tests
- ✅ Data seeding verification
- ✅ Performance benchmarking
- ✅ Concurrent access testing
- ✅ Complex query validation
- ✅ Transaction testing
- ✅ Multi-table joins

### MCP Server Integration Tests
- ✅ Campaign Analytics Server
- ✅ Customer Data Server
- ✅ LeadPulse Server
- ✅ Monitoring Server
- ✅ Multi-server interactions
- ✅ Error handling
- ✅ Performance benchmarks

### Data Validation Tests
- ✅ Campaign metrics business rules
- ✅ Customer prediction data integrity
- ✅ Visitor session validation
- ✅ Monitoring metrics validation
- ✅ JSON field structure validation
- ✅ Referential integrity

### Docker Environment Tests
- ✅ Container health checks
- ✅ Database connectivity in Docker
- ✅ Environment variable handling
- ✅ Volume persistence
- ✅ Resource limit testing
- ✅ Network connectivity

## Test Data

### Seeded Data Includes:

1. **Organizations & Users**
   - Test organizations with different plans
   - Admin and user accounts
   - Proper role-based access setup

2. **Contacts & Campaigns**
   - Sample contacts with realistic data
   - Email, SMS, and WhatsApp campaigns
   - Campaign performance metrics

3. **MCP-Specific Data**
   - Campaign analytics with A/B test results
   - Customer predictions with behavioral scores
   - Visitor sessions with events and behavior data
   - Monitoring metrics with time series data

### Data Characteristics:
- **Realistic volumes**: Hundreds to thousands of records
- **African market focus**: Nigerian/African customer patterns
- **Time-based data**: Historical data spanning months
- **Relationship integrity**: Proper foreign key relationships
- **Business logic compliance**: Data follows business rules

## Performance Targets

### Response Time Targets:
- **Simple queries**: < 1 second
- **Complex queries**: < 2 seconds
- **MCP server responses**: < 2 seconds
- **Docker operations**: < 3 seconds (50% allowance)

### Concurrency Targets:
- **Concurrent reads**: Up to 10 simultaneous operations
- **Concurrent writes**: Up to 5 simultaneous operations
- **Multi-server requests**: < 4 seconds total

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```
   Error: Cannot connect to test database
   ```
   - Verify `TEST_DATABASE_URL` is correct
   - Ensure database is running and accessible
   - Check network connectivity in Docker

2. **Seeding Failures**
   ```
   Error: MCP data seeding failed
   ```
   - Run database migrations: `npx prisma migrate deploy`
   - Check database permissions
   - Verify Prisma client is generated

3. **Docker Issues**
   ```
   Error: Docker environment not detected
   ```
   - Set `DOCKER_ENV=true` environment variable
   - Verify container network configuration
   - Check database hostname in Docker Compose

4. **Performance Issues**
   ```
   Tests timing out or running slowly
   ```
   - Increase timeout values in `jest.integration.config.js`
   - Check database performance and indexes
   - Verify container resource allocation

### Debug Mode

Enable verbose logging for debugging:
```bash
LOG_LEVEL=debug npm run test:integration
```

View detailed Jest output:
```bash
npx jest --config src/__tests__/integration/mcp/jest.integration.config.js --verbose --no-coverage
```

## Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/integration-tests.yml`:
```yaml
name: MCP Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: marketsage_password
          POSTGRES_USER: marketsage
          POSTGRES_DB: marketsage_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://marketsage:marketsage_password@localhost:5432/marketsage_test
          
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://marketsage:marketsage_password@localhost:5432/marketsage_test
          NODE_ENV: test
```

## Test Reports

### Generated Reports:
- **HTML Report**: `test-reports/integration/integration-test-report.html`
- **JUnit XML**: `test-reports/integration/junit.xml`
- **Coverage Report**: `coverage/integration/`

### Report Contents:
- Individual test results and timing
- Performance benchmarks and statistics
- Data validation summaries
- Environment configuration details
- Error details and stack traces

## Contributing

### Adding New Tests:

1. **Database Tests**: Add to `database-integration.test.ts`
2. **Server Tests**: Add to `mcp-servers-integration.test.ts`
3. **Validation Tests**: Add to `data-validation.test.ts`
4. **Docker Tests**: Add to `docker-environment.test.ts`

### Test Guidelines:
- Use realistic data volumes and patterns
- Include performance assertions
- Test both success and error scenarios
- Validate business logic and constraints
- Clean up test data properly
- Document test purpose and expectations

### Performance Considerations:
- Tests run sequentially to avoid database conflicts
- Use transactions where appropriate
- Clean up test data between tests
- Monitor resource usage in Docker environments

## Security Notes

- Tests use a separate test database
- Sensitive data is masked in logs
- No external service calls in test mode
- Test credentials are different from production
- Database cleanup ensures no data leakage