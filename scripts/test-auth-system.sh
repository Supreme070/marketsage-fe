#!/bin/bash

# Complete Authentication System Test Script
# Tests both Next.js and NestJS authentication systems

echo "🧪 COMPREHENSIVE AUTHENTICATION SYSTEM TEST"
echo "============================================="

# Configuration
NEXTJS_PORT="3007"  # Default Next.js port (or 3000)
NESTJS_PORT="3006"  # NestJS backend port
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_code="${3:-200}"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    # Run the test command and capture both output and HTTP code
    local result=$(eval "$test_command" 2>/dev/null)
    local http_code=$(echo "$result" | tail -n1)
    local response_body=$(echo "$result" | head -n -1 2>/dev/null || echo "$result" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✅ $test_name")
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name (Expected: $expected_code, Got: $http_code)"
        echo "   Response: $response_body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("❌ $test_name - HTTP $http_code")
        return 1
    fi
}

# Helper function to extract token from response
extract_token() {
    local response="$1"
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

echo "Starting comprehensive authentication tests..."
echo ""

# ===============================================
# Phase 1: Service Health Checks
# ===============================================
echo -e "${BLUE}Phase 1: Service Health Checks${NC}"
echo "--------------------------------"

# Test Next.js health
run_test "Next.js Health Check" \
    "curl -s -w '%{http_code}' http://localhost:$NEXTJS_PORT/api/health"

# Test NestJS health  
run_test "NestJS Health Check" \
    "curl -s -w '%{http_code}' http://localhost:$NESTJS_PORT/api/v2/health"

# Test feature flags
run_test "Feature Flags Endpoint" \
    "curl -s -w '%{http_code}' http://localhost:$NEXTJS_PORT/api/feature-flags"

echo ""

# ===============================================
# Phase 2: NestJS Direct Authentication Tests
# ===============================================
echo -e "${BLUE}Phase 2: NestJS Direct Authentication${NC}"
echo "--------------------------------------"

# Test NestJS registration
NESTJS_REG_RESPONSE=$(curl -s -X POST http://localhost:$NESTJS_PORT/api/v2/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    -w '\n%{http_code}')

run_test "NestJS Registration" \
    "echo '$NESTJS_REG_RESPONSE'" \
    "201"

# Test NestJS login
NESTJS_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:$NESTJS_PORT/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    -w '\n%{http_code}')

run_test "NestJS Login" \
    "echo '$NESTJS_LOGIN_RESPONSE'" \
    "200"

# Extract token for profile test
NESTJS_TOKEN=$(extract_token "$NESTJS_LOGIN_RESPONSE")

if [ -n "$NESTJS_TOKEN" ]; then
    # Test NestJS profile with token
    run_test "NestJS Profile Access" \
        "curl -s -H 'Authorization: Bearer $NESTJS_TOKEN' http://localhost:$NESTJS_PORT/api/v2/auth/profile -w '%{http_code}'" \
        "200"
else
    echo -e "${YELLOW}⚠️  Skipping profile test - no token received${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ NestJS Profile Access - No token")
fi

# Test duplicate registration (should fail)
run_test "NestJS Duplicate Registration" \
    "curl -s -X POST http://localhost:$NESTJS_PORT/api/v2/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}' \
        -w '%{http_code}'" \
    "409"

echo ""

# ===============================================
# Phase 3: Next.js Proxy Tests
# ===============================================
echo -e "${BLUE}Phase 3: Next.js Proxy Tests${NC}"
echo "-----------------------------"

# Test if Next.js properly proxies to NestJS
run_test "Next.js to NestJS Proxy Health" \
    "curl -s -w '%{http_code}' http://localhost:$NEXTJS_PORT/api/v2/health"

# Test registration through proxy
PROXY_EMAIL="proxy-test-$(date +%s)@example.com"
run_test "Registration via Next.js Proxy" \
    "curl -s -X POST http://localhost:$NEXTJS_PORT/api/v2/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"name\":\"Proxy Test\",\"email\":\"$PROXY_EMAIL\",\"password\":\"password123\"}' \
        -w '%{http_code}'" \
    "201"

# Test login through proxy
PROXY_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:$NEXTJS_PORT/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PROXY_EMAIL\",\"password\":\"password123\"}" \
    -w '\n%{http_code}')

run_test "Login via Next.js Proxy" \
    "echo '$PROXY_LOGIN_RESPONSE'" \
    "200"

echo ""

# ===============================================
# Phase 4: Next.js Legacy Authentication Tests
# ===============================================
echo -e "${BLUE}Phase 4: Next.js Legacy Authentication${NC}"
echo "---------------------------------------"

# Test Next.js registration (original endpoint)
LEGACY_EMAIL="legacy-test-$(date +%s)@example.com"
run_test "Next.js Legacy Registration" \
    "curl -s -X POST http://localhost:$NEXTJS_PORT/api/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"name\":\"Legacy Test\",\"email\":\"$LEGACY_EMAIL\",\"password\":\"password123\"}' \
        -w '%{http_code}'" \
    "201"

# Test Next.js login (original endpoint)
run_test "Next.js Legacy Login" \
    "curl -s -X POST http://localhost:$NEXTJS_PORT/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$LEGACY_EMAIL\",\"password\":\"password123\"}' \
        -w '%{http_code}'" \
    "200"

echo ""

# ===============================================
# Phase 5: Error Handling Tests
# ===============================================
echo -e "${BLUE}Phase 5: Error Handling Tests${NC}"
echo "------------------------------"

# Test invalid login
run_test "Invalid Login Credentials" \
    "curl -s -X POST http://localhost:$NESTJS_PORT/api/v2/auth/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"nonexistent@example.com\",\"password\":\"wrongpassword\"}' \
        -w '%{http_code}'" \
    "401"

# Test malformed request
run_test "Malformed Registration Request" \
    "curl -s -X POST http://localhost:$NESTJS_PORT/api/v2/auth/register \
        -H 'Content-Type: application/json' \
        -d '{\"invalid\":\"data\"}' \
        -w '%{http_code}'" \
    "400"

# Test unauthorized profile access
run_test "Unauthorized Profile Access" \
    "curl -s http://localhost:$NESTJS_PORT/api/v2/auth/profile -w '%{http_code}'" \
    "401"

# Test invalid token
run_test "Invalid Token Profile Access" \
    "curl -s -H 'Authorization: Bearer invalid-token' http://localhost:$NESTJS_PORT/api/v2/auth/profile -w '%{http_code}'" \
    "401"

echo ""

# ===============================================
# Phase 6: Performance & Load Tests
# ===============================================
echo -e "${BLUE}Phase 6: Basic Performance Tests${NC}"
echo "--------------------------------"

# Quick load test - 10 concurrent health checks
echo "Running 10 concurrent health checks..."
LOAD_TEST_RESULTS=$(
    for i in {1..10}; do
        curl -s -w '%{http_code}\n' http://localhost:$NESTJS_PORT/api/v2/health -o /dev/null &
    done
    wait
)

SUCCESSFUL_REQUESTS=$(echo "$LOAD_TEST_RESULTS" | grep -c "200")
if [ "$SUCCESSFUL_REQUESTS" -eq 10 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Concurrent Health Checks (10/10 successful)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ Concurrent Health Checks")
else
    echo -e "${RED}❌ FAIL${NC} - Concurrent Health Checks ($SUCCESSFUL_REQUESTS/10 successful)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ Concurrent Health Checks")
fi

echo ""

# ===============================================
# Final Report
# ===============================================
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}           FINAL TEST REPORT${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Overall status
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    OVERALL_STATUS="PASS"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    OVERALL_STATUS="FAIL"
fi

echo ""
echo "Test Summary:"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "  Success Rate: $SUCCESS_RATE%"
echo ""

echo "Detailed Results:"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo "Service Status:"
echo "  - Next.js (Port $NEXTJS_PORT): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$NEXTJS_PORT/api/health 2>/dev/null || echo 'UNREACHABLE')"
echo "  - NestJS (Port $NESTJS_PORT): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$NESTJS_PORT/api/v2/health 2>/dev/null || echo 'UNREACHABLE')"

# Feature flag status
FEATURE_FLAG_STATUS=$(curl -s http://localhost:$NEXTJS_PORT/api/feature-flags 2>/dev/null | grep -o '"USE_NESTJS_AUTH":[^,}]*' | cut -d':' -f2 | tr -d ' "' || echo 'UNKNOWN')
echo "  - Feature Flag (USE_NESTJS_AUTH): $FEATURE_FLAG_STATUS"

echo ""

# Generate detailed report file
REPORT_FILE="/tmp/auth-system-test-report-$(date +%Y%m%d-%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
Authentication System Test Report
=================================
Date: $(date)
Test Duration: Comprehensive authentication flow test
Overall Status: $OVERALL_STATUS

Summary:
- Total Tests: $TOTAL_TESTS
- Passed: $TESTS_PASSED  
- Failed: $TESTS_FAILED
- Success Rate: $SUCCESS_RATE%

Service Configuration:
- Next.js Port: $NEXTJS_PORT
- NestJS Port: $NESTJS_PORT
- Test Email: $TEST_EMAIL
- Feature Flag: $FEATURE_FLAG_STATUS

Test Results:
$(printf "%s\n" "${TEST_RESULTS[@]}")

Recommendations:
$(if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ System is ready for production traffic"
    echo "✅ Both authentication systems are functioning correctly"
    echo "✅ Parallel authentication is working as expected"
else
    echo "⚠️  Review failed tests before production deployment"
    echo "⚠️  Check service logs for error details"
    echo "⚠️  Consider running rollback if critical issues exist"
fi)

Next Steps:
1. Review this report and any failed tests
2. Monitor application logs for errors
3. Test user registration/login flows manually
4. Set up continuous monitoring
$(if [ $TESTS_FAILED -gt 0 ]; then
    echo "5. Run: bash scripts/rollback-nestjs.sh (if issues are critical)"
fi)

Generated by: Authentication System Test Script
Report saved to: $REPORT_FILE
EOF

echo "📊 Detailed report saved to: $REPORT_FILE"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🚀 Authentication system is ready for production!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Please review failed tests before proceeding to production.${NC}"
    exit 1
fi