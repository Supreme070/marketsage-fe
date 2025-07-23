#!/bin/bash
# Emergency MCP Rollback Script
# Instantly disables all MCP functionality

echo "🚨 EMERGENCY MCP ROLLBACK INITIATED"
echo "Disabling all MCP functionality..."

# Disable MCP completely
echo "MCP_ENABLED=false" >> .env.rollback
echo "MCP_CUSTOMER_DATA_ENABLED=false" >> .env.rollback
echo "MCP_CAMPAIGN_ANALYTICS_ENABLED=false" >> .env.rollback
echo "MCP_LEADPULSE_ENABLED=false" >> .env.rollback
echo "MCP_EXTERNAL_SERVICES_ENABLED=false" >> .env.rollback
echo "MCP_MONITORING_ENABLED=false" >> .env.rollback

# Replace current .env
cp .env .env.before.rollback
cp .env.rollback .env

echo "✅ MCP ROLLBACK COMPLETE"
echo "All AI systems now using direct database access"
echo "Application restart recommended: npm run start"
