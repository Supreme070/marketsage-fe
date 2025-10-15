#!/bin/bash

# MarketSage Comprehensive Functionality Audit Test Script
# This script performs end-to-end testing of all major features

echo "======================================"
echo "MarketSage Comprehensive Audit Test"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3006/api/v2"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_field="$5"

    ((TESTS_TOTAL++))
    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -X GET "$endpoint")
    else
        response=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" -d "$data")
    fi

    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        echo "  Response: $(echo $response | head -c 100)..."
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        echo "  Response: $response"
    fi
    echo ""
}

echo "1. INFRASTRUCTURE TESTS"
echo "========================"

# Test backend health
test_endpoint "Backend Health" "GET" "$BACKEND_URL/health" "" "status"

# Test database connection
test_endpoint "Database Connection" "POST" "$BACKEND_URL/auth/test-db" "" "userCount"

echo ""
echo "2. AUTHENTICATION TESTS"
echo "======================="

# Test registration
REGISTER_DATA='{
  "email": "audit.test@example.com",
  "password": "Test123!@#",
  "firstName": "Audit",
  "lastName": "Test",
  "businessName": "Test Business"
}'

test_endpoint "User Registration (Initial)" "POST" "$BACKEND_URL/auth/register/initial" "$REGISTER_DATA" "registrationId"

# Test login with non-existent user
LOGIN_DATA='{"email": "nonexistent@test.com", "password": "wrongpass"}'
test_endpoint "Login Fail (Invalid Creds)" "POST" "$BACKEND_URL/auth/login" "$LOGIN_DATA" "error"

echo ""
echo "3. EMAIL SERVICE TESTS"
echo "======================"

# Test email service endpoints
test_endpoint "Email Templates List" "GET" "$BACKEND_URL/email/templates" "" "success"

echo ""
echo "4. SMS SERVICE TESTS"
echo "===================="

# Test SMS providers
test_endpoint "SMS Providers Status" "GET" "$BACKEND_URL/sms/providers" "" "success"

echo ""
echo "5. WHATSAPP SERVICE TESTS"
echo "========================="

# Test WhatsApp integration
test_endpoint "WhatsApp Status" "GET" "$BACKEND_URL/whatsapp/status" "" "success"

echo ""
echo "6. CAMPAIGN MANAGEMENT TESTS"
echo "============================"

# Test campaigns endpoints
test_endpoint "List Campaigns" "GET" "$BACKEND_URL/campaigns" "" "success"

echo ""
echo "7. CONTACT MANAGEMENT TESTS"
echo "==========================="

# Test contacts endpoints
test_endpoint "List Contacts" "GET" "$BACKEND_URL/contacts" "" "success"

echo ""
echo "8. WORKFLOW AUTOMATION TESTS"
echo "============================"

# Test workflows
test_endpoint "List Workflows" "GET" "$BACKEND_URL/workflows" "" "success"

echo ""
echo "9. LEADPULSE TESTS"
echo "=================="

# Test LeadPulse tracking
test_endpoint "LeadPulse Analytics" "GET" "$BACKEND_URL/leadpulse/analytics" "" "success"

echo ""
echo "10. AI INTELLIGENCE TESTS"
echo "========================="

# Test AI endpoints
test_endpoint "AI Health Check" "GET" "$BACKEND_URL/ai/health" "" "status"

echo ""
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
SUCCESS_RATE=$(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc)
echo -e "Success Rate: ${SUCCESS_RATE}%"
echo "======================================"
