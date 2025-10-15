#!/bin/bash

# MarketSage Production Startup Script with MCP Servers
# This script starts both the Next.js application and all MCP servers

set -e

echo "🚀 Starting MarketSage with MCP Servers..."

# Function to start MCP servers in background
start_mcp_servers() {
    echo "📡 Starting MCP Servers..."
    
    # Start all 5 MCP servers in background
    echo "Starting Customer Data MCP Server on port 3001..."
    node -e "
    import('./src/mcp/servers/customer-data-server.js').then(module => {
        const server = new module.CustomerDataMCPServer({ port: 3001, enabled: true });
        server.start().then(() => console.log('✅ Customer Data MCP Server started'));
    }).catch(console.error);
    " &
    
    echo "Starting Campaign Analytics MCP Server on port 3002..."
    node -e "
    import('./src/mcp/servers/campaign-analytics-server.js').then(module => {
        const server = new module.CampaignAnalyticsMCPServer({ port: 3002, enabled: true });
        server.start().then(() => console.log('✅ Campaign Analytics MCP Server started'));
    }).catch(console.error);
    " &
    
    echo "Starting LeadPulse MCP Server on port 3003..."
    node -e "
    import('./src/mcp/servers/leadpulse-server.js').then(module => {
        const server = new module.LeadPulseMCPServer({ port: 3003, enabled: true });
        server.start().then(() => console.log('✅ LeadPulse MCP Server started'));
    }).catch(console.error);
    " &
    
    echo "Starting External Services MCP Server on port 3004..."
    node -e "
    import('./src/mcp/servers/external-services-server.js').then(module => {
        const server = new module.ExternalServicesMCPServer({ port: 3004, enabled: true });
        server.start().then(() => console.log('✅ External Services MCP Server started'));
    }).catch(console.error);
    " &
    
    echo "Starting Monitoring MCP Server on port 3005..."
    node -e "
    import('./src/mcp/servers/monitoring-server.js').then(module => {
        const server = new module.MonitoringMCPServer({ port: 3005, enabled: true });
        server.start().then(() => console.log('✅ Monitoring MCP Server started'));
    }).catch(console.error);
    " &
    
    # Give MCP servers time to start
    echo "⏳ Waiting for MCP servers to initialize..."
    sleep 10
    
    # Health check MCP servers
    echo "🏥 Checking MCP server health..."
    for port in 3001 3002 3003 3004 3005; do
        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            echo "✅ MCP server on port $port is healthy"
        else
            echo "⚠️ MCP server on port $port may still be starting..."
        fi
    done
}

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    # Kill all background jobs
    jobs -p | xargs -r kill
    exit 0
}

# Set up cleanup trap
trap cleanup SIGTERM SIGINT

# Start MCP servers in background
start_mcp_servers

# Start the main Next.js application
echo "🌐 Starting Next.js application..."
exec npm run start