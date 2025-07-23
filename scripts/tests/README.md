# Supreme AI v3 MCP Integration Tests

This directory contains comprehensive tests to verify that the Supreme AI v3 engine is properly integrated with real MCP (Model Context Protocol) data connections rather than using mock data.

## Test Files

### 1. `supreme-ai-mcp-integration.test.ts`
Complete Jest test suite that validates:
- MCP data connection verification
- Real customer data usage in segmentation
- Campaign optimization with actual analytics
- AI decision-making based on database metrics
- Error handling and fallback scenarios
- Comprehensive logging verification

### 2. `test-supreme-ai-mcp.ts`
Test runner script that executes the Jest test suite with proper configuration and colored output.

### 3. `verify-ai-real-data.ts`
Quick verification script that can be run independently to check:
- MCP database connections
- AI context building with real data
- Segmentation using actual customer data
- Campaign optimization with real metrics
- Real-time analysis capabilities

## Running the Tests

### Full Test Suite (Recommended)
```bash
npm run test:ai-mcp
```

### Quick Verification
```bash
npm run verify:ai-real-data
```

### Manual Execution
```bash
# Full test suite
npx tsx scripts/tests/test-supreme-ai-mcp.ts

# Quick verification
npx tsx scripts/tests/verify-ai-real-data.ts

# Jest only
npx jest src/__tests__/ai/supreme-ai-mcp-integration.test.ts --verbose
```

## What These Tests Verify

### ✅ Real Data Integration
- AI engine connects to actual PostgreSQL database
- Customer data is fetched from real database tables
- Campaign analytics use actual performance metrics
- Segmentation decisions based on real customer behavior

### ✅ MCP Protocol Usage
- MCP client properly handles database fallbacks
- AI integration uses MCP-enhanced context
- Real-time data flows through MCP architecture
- Proper error handling when MCP is unavailable

### ✅ Decision Quality
- AI recommendations based on actual metrics
- Segmentation uses real customer engagement scores
- Campaign optimization considers actual performance data
- Context-aware responses using platform data

### ✅ Data Sources Verified
- **Customer Data**: Real contacts, segments, and predictions
- **Campaign Analytics**: Actual campaign performance metrics
- **Visitor Behavior**: Real LeadPulse tracking data
- **Monitoring Data**: System metrics and KPIs

## Test Output Examples

### Successful Integration
```
✅ MCP Customer Search Result: 5 real customers found
✅ Segmentation using MCP_CUSTOMER_DATA source
✅ Campaign optimization with MCP_CAMPAIGN_ANALYTICS
✅ AI decisions based on actual database metrics
```

### Error Scenarios
```
⚠️ MCP unavailable, using database fallback
✅ Graceful fallback to direct database access
✅ Error handling maintains AI functionality
```

## Environment Setup

### Required Environment Variables
```bash
NODE_ENV=test
MCP_ENABLED=true
DATABASE_URL=postgresql://user:pass@localhost:5432/marketsage_test
```

### Database Requirements
- PostgreSQL database with MarketSage schema
- Test data for contacts, segments, and campaigns
- Proper permissions for test user

## Test Data Management

The tests automatically:
1. **Setup**: Create test organization, users, contacts, and segments
2. **Execute**: Run AI operations with real data
3. **Verify**: Check data sources and decision quality
4. **Cleanup**: Remove test data after completion

## Interpreting Results

### Key Metrics to Watch
- **Confidence Scores**: Should be > 0.7 with real data
- **Supreme Scores**: Should be > 80 with MCP integration
- **Data Sources**: Should show "MCP_CUSTOMER_DATA" or "MCP_CAMPAIGN_ANALYTICS"
- **Fallback Usage**: Should be minimal when MCP is enabled

### Success Indicators
- All tests pass with green checkmarks
- Real data is logged in test output
- AI provides specific, data-driven insights
- No placeholder or mock responses

### Failure Indicators
- Tests fail with red X marks
- Generic or placeholder responses
- No real data in logged output
- High fallback usage without MCP errors

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database URL and connectivity
   npm run db:migrate
   ```

2. **No Test Data Found**
   ```bash
   # Seed test database
   npm run db:seed
   ```

3. **MCP Integration Errors**
   ```bash
   # Check MCP configuration
   grep -r "MCP_ENABLED" .env*
   ```

### Debug Mode
Add `DEBUG=true` environment variable for detailed logging:
```bash
DEBUG=true npm run verify:ai-real-data
```

## Integration with CI/CD

These tests can be integrated into GitHub Actions:
```yaml
- name: Test AI MCP Integration
  run: npm run test:ai-mcp
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    MCP_ENABLED: true
```

## Next Steps

After successful test completion:
1. ✅ Verify AI is using real data for decisions
2. ✅ Confirm MCP integration is working properly
3. ✅ Monitor AI performance with real metrics
4. ✅ Deploy with confidence in data-driven AI

---

**Note**: These tests demonstrate that the Supreme AI v3 engine has moved beyond mock data to use real, live database connections for intelligent decision-making.