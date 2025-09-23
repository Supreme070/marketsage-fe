#!/bin/bash

# MarketSage Backend Endpoint Testing Script
# Tests all 150+ endpoints with real authentication and user data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKEND_URL="http://localhost:3006"
TEST_USER_EMAIL=""
TEST_USER_PASSWORD=""
TEST_ORG_ID=""
TIMEOUT=10000
CONCURRENT=5

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "MarketSage Backend Endpoint Testing Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --url URL           Backend URL (default: http://localhost:3006)"
    echo "  -e, --email EMAIL       Test user email (required)"
    echo "  -p, --password PASS     Test user password (required)"
    echo "  -o, --org-id ID         Organization ID (optional)"
    echo "  -t, --timeout MS        Request timeout in ms (default: 10000)"
    echo "  -c, --concurrent N      Concurrent requests (default: 5)"
    echo ""
    echo "Environment Variables:"
    echo "  NESTJS_BACKEND_URL      Backend URL"
    echo "  TEST_USER_EMAIL         Test user email"
    echo "  TEST_USER_PASSWORD      Test user password"
    echo "  TEST_ORG_ID             Organization ID"
    echo ""
    echo "Examples:"
    echo "  $0 -e admin@marketsage.com -p admin123"
    echo "  $0 --url http://localhost:3006 --email admin@marketsage.com --password admin123"
    echo "  TEST_USER_EMAIL=admin@marketsage.com TEST_USER_PASSWORD=admin123 $0"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -e|--email)
            TEST_USER_EMAIL="$2"
            shift 2
            ;;
        -p|--password)
            TEST_USER_PASSWORD="$2"
            shift 2
            ;;
        -o|--org-id)
            TEST_ORG_ID="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -c|--concurrent)
            CONCURRENT="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check for required environment variables or command line arguments
if [[ -z "$TEST_USER_EMAIL" ]]; then
    TEST_USER_EMAIL="${TEST_USER_EMAIL:-$TEST_USER_EMAIL}"
fi

if [[ -z "$TEST_USER_PASSWORD" ]]; then
    TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-$TEST_USER_PASSWORD}"
fi

# Use environment variables if command line args not provided
if [[ -z "$TEST_USER_EMAIL" ]]; then
    TEST_USER_EMAIL="${TEST_USER_EMAIL:-}"
fi

if [[ -z "$TEST_USER_PASSWORD" ]]; then
    TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-}"
fi

if [[ -z "$TEST_ORG_ID" ]]; then
    TEST_ORG_ID="${TEST_ORG_ID:-}"
fi

if [[ -z "$BACKEND_URL" ]]; then
    BACKEND_URL="${NESTJS_BACKEND_URL:-http://localhost:3006}"
fi

# Validate required parameters
if [[ -z "$TEST_USER_EMAIL" ]]; then
    print_error "Test user email is required"
    echo "Use -e/--email or set TEST_USER_EMAIL environment variable"
    exit 1
fi

if [[ -z "$TEST_USER_PASSWORD" ]]; then
    print_error "Test user password is required"
    echo "Use -p/--password or set TEST_USER_PASSWORD environment variable"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if test script exists
if [[ ! -f "test-endpoints.js" ]]; then
    print_error "test-endpoints.js not found in current directory"
    exit 1
fi

# Print configuration
print_status "Starting MarketSage Backend Endpoint Tests"
echo "=========================================="
echo "Backend URL: $BACKEND_URL"
echo "Test User: $TEST_USER_EMAIL"
echo "Organization ID: ${TEST_ORG_ID:-'Not specified'}"
echo "Timeout: ${TIMEOUT}ms"
echo "Concurrent Requests: $CONCURRENT"
echo "=========================================="
echo ""

# Check backend connectivity
print_status "Checking backend connectivity..."
if curl -s --connect-timeout 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
    print_success "Backend is reachable"
else
    print_warning "Backend health check failed, but continuing with tests..."
fi

# Set environment variables and run tests
export NESTJS_BACKEND_URL="$BACKEND_URL"
export TEST_USER_EMAIL="$TEST_USER_EMAIL"
export TEST_USER_PASSWORD="$TEST_USER_PASSWORD"
export TEST_ORG_ID="$TEST_ORG_ID"

# Run the test script
print_status "Running endpoint tests..."
echo ""

if node test-endpoints.js --url "$BACKEND_URL" --timeout "$TIMEOUT" --concurrent "$CONCURRENT"; then
    echo ""
    print_success "All tests completed successfully!"
    exit 0
else
    exit_code=$?
    echo ""
    case $exit_code in
        1)
            print_warning "Tests completed with minor issues (90-95% success rate)"
            ;;
        2)
            print_warning "Tests completed with several issues (80-90% success rate)"
            ;;
        3)
            print_error "Tests completed with major issues (<80% success rate)"
            ;;
        4)
            print_error "Test suite failed to run"
            ;;
        *)
            print_error "Tests completed with unknown exit code: $exit_code"
            ;;
    esac
    exit $exit_code
fi
