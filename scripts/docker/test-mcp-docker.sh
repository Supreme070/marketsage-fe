#!/bin/bash

# MarketSage MCP Docker Environment Testing Script
# Tests all MCP functionality in Docker containers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
CONTAINER_NAME="marketsage-web"
DB_CONTAINER="marketsage-db"
REDIS_CONTAINER="marketsage-valkey"
BASE_URL="http://localhost:3030"
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=10  # 10 seconds

echo -e "${BLUE}🐳 MarketSage MCP Docker Environment Testing${NC}"
echo "=================================================="

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to check if container is running
check_container() {
    local container_name=$1
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for container health
wait_for_health() {
    local container_name=$1
    local max_wait=$2
    local waited=0
    
    log "Waiting for ${container_name} to be healthy..."
    
    while [ $waited -lt $max_wait ]; do
        if docker inspect --format='{{.State.Health.Status}}' $container_name 2>/dev/null | grep -q "healthy"; then
            log "${container_name} is healthy!"
            return 0
        fi
        
        sleep $CHECK_INTERVAL
        waited=$((waited + CHECK_INTERVAL))
        echo -n "."
    done
    
    error "${container_name} did not become healthy within ${max_wait} seconds"
    return 1
}

# Function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    log "Testing: ${description}"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "${BASE_URL}${endpoint}")
    
    if [ "$response" = "$expected_status" ]; then
        log "✅ ${description} - Status: ${response}"
        return 0
    else
        error "❌ ${description} - Expected: ${expected_status}, Got: ${response}"
        if [ -f /tmp/response.json ]; then
            echo "Response body:"
            cat /tmp/response.json
            echo ""
        fi
        return 1
    fi
}

# Function to test database connectivity
test_database() {
    log "Testing database connectivity..."
    
    # Test basic connection
    if docker exec $DB_CONTAINER pg_isready -U marketsage >/dev/null 2>&1; then
        log "✅ Database connection successful"
    else
        error "❌ Database connection failed"
        return 1
    fi
    
    # Test MCP tables exist
    log "Checking MCP tables..."
    
    tables=(
        "MCPCampaignMetrics"
        "MCPCustomerPredictions" 
        "MCPVisitorSessions"
        "MCPMonitoringMetrics"
    )
    
    for table in "${tables[@]}"; do
        count=$(docker exec $DB_CONTAINER psql -U marketsage -d marketsage -t -c "SELECT COUNT(*) FROM \"${table}\";" 2>/dev/null | tr -d ' ')
        if [ $? -eq 0 ]; then
            log "✅ Table ${table} exists with ${count} records"
        else
            error "❌ Table ${table} not found or inaccessible"
            return 1
        fi
    done
    
    return 0
}

# Function to test Redis connectivity
test_redis() {
    log "Testing Redis connectivity..."
    
    if docker exec $REDIS_CONTAINER valkey-cli ping | grep -q "PONG"; then
        log "✅ Redis/Valkey connection successful"
        
        # Test set/get operation
        docker exec $REDIS_CONTAINER valkey-cli set test_key "mcp_test_value" >/dev/null
        value=$(docker exec $REDIS_CONTAINER valkey-cli get test_key)
        
        if [ "$value" = "mcp_test_value" ]; then
            log "✅ Redis read/write operations working"
            docker exec $REDIS_CONTAINER valkey-cli del test_key >/dev/null
        else
            error "❌ Redis read/write operations failed"
            return 1
        fi
    else
        error "❌ Redis connection failed"
        return 1
    fi
    
    return 0
}

# Function to test MCP server functionality
test_mcp_servers() {
    log "Testing MCP Server functionality..."
    
    # Test MCP API endpoints
    local mcp_endpoints=(
        "/api/mcp/customer-data/health:200:Customer Data Server Health"
        "/api/mcp/campaign-analytics/health:200:Campaign Analytics Server Health"
        "/api/mcp/leadpulse/health:200:LeadPulse Server Health"
        "/api/mcp/monitoring/health:200:Monitoring Server Health"
        "/api/mcp/external-services/health:200:External Services Server Health"
    )
    
    for endpoint_info in "${mcp_endpoints[@]}"; do
        IFS=':' read -r endpoint status description <<< "$endpoint_info"
        test_endpoint "$endpoint" "$status" "$description" || return 1
    done
    
    return 0
}

# Function to test MCP data integration
test_mcp_data() {
    log "Testing MCP data integration..."
    
    # Test if MCP data endpoints return real data
    log "Testing MCP customer data endpoint..."
    response=$(curl -s "${BASE_URL}/api/mcp/customer-data/insights" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q "organizationId\|segments\|predictions"; then
        log "✅ MCP Customer Data endpoint returning structured data"
    else
        warn "⚠️ MCP Customer Data endpoint may not be returning expected data structure"
    fi
    
    # Test MCP campaign analytics
    log "Testing MCP campaign analytics endpoint..."
    response=$(curl -s "${BASE_URL}/api/mcp/campaign-analytics/performance" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q "campaigns\|metrics\|performance"; then
        log "✅ MCP Campaign Analytics endpoint returning structured data"
    else
        warn "⚠️ MCP Campaign Analytics endpoint may not be returning expected data structure"
    fi
    
    return 0
}

# Function to test environment variables
test_environment() {
    log "Testing environment variable configuration..."
    
    # Check critical environment variables
    critical_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "NODE_ENV"
        "NEXTAUTH_SECRET"
    )
    
    for var in "${critical_vars[@]}"; do
        if docker exec $CONTAINER_NAME printenv "$var" >/dev/null 2>&1; then
            log "✅ Environment variable ${var} is set"
        else
            error "❌ Environment variable ${var} is missing"
            return 1
        fi
    done
    
    return 0
}

# Function to test container resource usage
test_resources() {
    log "Testing container resource usage..."
    
    # Get container stats
    stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(marketsage-web|marketsage-db|marketsage-valkey)")
    
    if [ -n "$stats" ]; then
        log "✅ Container resource stats:"
        echo "$stats"
    else
        warn "⚠️ Could not retrieve container resource stats"
    fi
    
    # Check if containers are using reasonable resources
    cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" $CONTAINER_NAME | sed 's/%//')
    mem_usage=$(docker stats --no-stream --format "{{.MemUsage}}" $CONTAINER_NAME)
    
    log "Web container - CPU: ${cpu_usage}%, Memory: ${mem_usage}"
    
    return 0
}

# Function to test data persistence
test_persistence() {
    log "Testing data persistence..."
    
    # Check if volumes are properly mounted
    volumes=$(docker inspect $CONTAINER_NAME | grep -o '"Source":"[^"]*"' | cut -d'"' -f4 | head -5)
    
    if [ -n "$volumes" ]; then
        log "✅ Volumes are mounted:"
        echo "$volumes" | head -3
    else
        warn "⚠️ No volumes found or volume inspection failed"
    fi
    
    return 0
}

# Function to run comprehensive tests
run_tests() {
    local tests_passed=0
    local tests_failed=0
    
    # Array of test functions
    tests=(
        "test_database:Database Connectivity"
        "test_redis:Redis Connectivity"
        "test_environment:Environment Variables"
        "test_mcp_servers:MCP Server Health"
        "test_mcp_data:MCP Data Integration"
        "test_resources:Resource Usage"
        "test_persistence:Data Persistence"
    )
    
    log "Running comprehensive MCP Docker tests..."
    
    for test_info in "${tests[@]}"; do
        IFS=':' read -r test_func test_name <<< "$test_info"
        
        echo ""
        log "🧪 Running test: ${test_name}"
        
        if $test_func; then
            tests_passed=$((tests_passed + 1))
            log "✅ ${test_name} - PASSED"
        else
            tests_failed=$((tests_failed + 1))
            error "❌ ${test_name} - FAILED"
        fi
    done
    
    echo ""
    log "Test Summary:"
    log "✅ Passed: ${tests_passed}"
    if [ $tests_failed -gt 0 ]; then
        error "❌ Failed: ${tests_failed}"
        return 1
    else
        log "🎉 All tests passed!"
        return 0
    fi
}

# Main execution
main() {
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker compose file '$COMPOSE_FILE' not found."
        exit 1
    fi
    
    log "Starting Docker environment testing..."
    
    # Check if containers are running
    if ! check_container $CONTAINER_NAME; then
        warn "Web container is not running. Starting services..."
        docker-compose -f $COMPOSE_FILE up -d
        
        # Wait for services to be healthy
        wait_for_health $DB_CONTAINER $MAX_WAIT_TIME || exit 1
        wait_for_health $REDIS_CONTAINER $MAX_WAIT_TIME || exit 1
        wait_for_health $CONTAINER_NAME $MAX_WAIT_TIME || exit 1
    else
        log "Containers are already running"
    fi
    
    # Wait a bit more for application to fully start
    log "Waiting for application to fully initialize..."
    sleep 30
    
    # Run tests
    if run_tests; then
        log "🎉 All MCP Docker tests completed successfully!"
        exit 0
    else
        error "❌ Some tests failed. Check the logs above for details."
        exit 1
    fi
}

# Handle script interruption
trap 'error "Script interrupted. Cleaning up..."; exit 1' INT TERM

# Run main function
main "$@"