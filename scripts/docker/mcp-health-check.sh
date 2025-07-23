#!/bin/bash

# MarketSage MCP Health Check Script for Docker
# Monitors MCP server health and data integrity

set -e

# Configuration
CONTAINER_NAME="marketsage-web"
DB_CONTAINER="marketsage-db"
REDIS_CONTAINER="marketsage-valkey"
LOG_FILE="/tmp/mcp-health.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Check Docker containers
check_containers() {
    log "Checking Docker containers..."
    
    containers=("$CONTAINER_NAME" "$DB_CONTAINER" "$REDIS_CONTAINER")
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-health-check")
            log "✅ ${container} is running (Health: ${health})"
        else
            error "❌ ${container} is not running"
            return 1
        fi
    done
    
    return 0
}

# Check MCP database tables
check_mcp_tables() {
    log "Checking MCP database tables..."
    
    tables=(
        "MCPCampaignMetrics"
        "MCPCustomerPredictions"
        "MCPVisitorSessions" 
        "MCPMonitoringMetrics"
    )
    
    for table in "${tables[@]}"; do
        count=$(docker exec $DB_CONTAINER psql -U marketsage -d marketsage -t -c "SELECT COUNT(*) FROM \"${table}\";" 2>/dev/null | tr -d ' ' || echo "0")
        
        if [ "$count" -gt 0 ]; then
            log "✅ ${table}: ${count} records"
        else
            warn "⚠️ ${table}: No records found"
        fi
    done
    
    return 0
}

# Check Redis/Valkey status
check_redis() {
    log "Checking Redis/Valkey status..."
    
    if docker exec $REDIS_CONTAINER valkey-cli ping | grep -q "PONG"; then
        
        # Get Redis info
        memory_usage=$(docker exec $REDIS_CONTAINER valkey-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        connected_clients=$(docker exec $REDIS_CONTAINER valkey-cli info clients | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
        
        log "✅ Redis is healthy - Memory: ${memory_usage}, Clients: ${connected_clients}"
        return 0
    else
        error "❌ Redis connection failed"
        return 1
    fi
}

# Check application health endpoints
check_app_health() {
    log "Checking application health endpoints..."
    
    # Wait for application to be ready
    for i in {1..30}; do
        if curl -s -f http://localhost:3030/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Test health endpoint
    if curl -s -f http://localhost:3030/api/health >/dev/null 2>&1; then
        log "✅ Application health endpoint responding"
    else
        error "❌ Application health endpoint not responding"
        return 1
    fi
    
    return 0
}

# Monitor resource usage
monitor_resources() {
    log "Monitoring resource usage..."
    
    # Get container stats
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -E "(marketsage-web|marketsage-db|marketsage-valkey)" | while read line; do
        log "📊 ${line}"
    done
    
    return 0
}

# Check environment variables
check_environment() {
    log "Checking critical environment variables..."
    
    critical_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "NODE_ENV"
        "NEXTAUTH_SECRET"
    )
    
    for var in "${critical_vars[@]}"; do
        if docker exec $CONTAINER_NAME printenv "$var" >/dev/null 2>&1; then
            log "✅ ${var} is configured"
        else
            error "❌ ${var} is missing"
        fi
    done
    
    return 0
}

# Main health check function
main() {
    log "🔍 Starting MCP Docker Health Check..."
    
    local checks_passed=0
    local checks_failed=0
    
    checks=(
        "check_containers:Container Status"
        "check_environment:Environment Variables"
        "check_redis:Redis/Valkey Status"
        "check_mcp_tables:MCP Database Tables"
        "check_app_health:Application Health"
        "monitor_resources:Resource Usage"
    )
    
    for check_info in "${checks[@]}"; do
        IFS=':' read -r check_func check_name <<< "$check_info"
        
        log "🧪 ${check_name}..."
        
        if $check_func; then
            checks_passed=$((checks_passed + 1))
            log "✅ ${check_name} - OK"
        else
            checks_failed=$((checks_failed + 1))
            error "❌ ${check_name} - FAILED"
        fi
        
        echo ""
    done
    
    log "Health Check Summary:"
    log "✅ Passed: ${checks_passed}"
    
    if [ $checks_failed -gt 0 ]; then
        error "❌ Failed: ${checks_failed}"
        log "Check log file: ${LOG_FILE}"
        return 1
    else
        log "🎉 All health checks passed!"
        return 0
    fi
}

# Handle continuous monitoring mode
if [ "$1" = "--monitor" ]; then
    log "Starting continuous monitoring mode (press Ctrl+C to stop)..."
    
    while true; do
        main
        log "Waiting 60 seconds before next check..."
        sleep 60
        echo ""
    done
else
    main
fi