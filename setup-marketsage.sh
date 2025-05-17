#!/bin/bash
set -e

echo "🚀 Starting MarketSage Automation Platform Setup..."

# Stop any existing containers
echo "🔄 Stopping existing containers..."
docker-compose down

# Build and start everything with production Dockerfile
echo "🏗️ Building and starting Docker services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for web service to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 20

# Check if services are running
echo "🔍 Checking service status..."
docker ps

# Clean existing data if needed
echo "🧹 Cleaning existing contacts..."
echo 'DELETE FROM "Contact";' > delete_contacts.sql
docker cp delete_contacts.sql marketsage-db:/tmp/
docker exec marketsage-db psql -U marketsage -d marketsage -f /tmp/delete_contacts.sql

# Seed African contacts
echo "🌍 Seeding African contacts..."
docker exec marketsage-web npx tsx /app/src/scripts/seedContacts.ts

# Seed lists
echo "📋 Seeding lists..."
docker exec marketsage-web npx tsx /app/src/scripts/seedLists.ts

# Seed segments
echo "🔍 Seeding segments..."
docker exec marketsage-web node /app/src/scripts/seedSegments.js

# Seed email campaigns
echo "📧 Seeding email campaigns..."
docker exec marketsage-web npx tsx /app/src/scripts/seedEmailCampaigns.ts

# Seed SMS templates and campaigns
echo "📱 Seeding SMS templates and campaigns..."
docker exec marketsage-web npx tsx /app/src/scripts/seedSMSTemplates.ts
docker exec marketsage-web npx tsx /app/src/scripts/seedSMSCampaigns.ts

# Seed WhatsApp templates and campaigns
echo "💬 Seeding WhatsApp templates and campaigns..."
docker exec marketsage-web npx tsx /app/src/scripts/seedWhatsAppTemplates.ts
docker exec marketsage-web npx tsx /app/src/scripts/seedWhatsAppCampaigns.ts

# Try to seed workflows (might need fixing)
echo "⚙️ Attempting to seed workflows..."
docker exec marketsage-web npx tsx /app/src/scripts/seedWorkflows.ts || echo "⚠️ Workflows seeding failed - may need fixing"

# Assign contacts to users
echo "👤 Assigning contacts..."
docker exec marketsage-web npx tsx /app/src/scripts/assignContactsDocker.ts

# Try to seed journeys (might need fixing)
echo "🛣️ Attempting to seed journeys..."
docker exec marketsage-web npx tsx /app/src/scripts/seedJourneys.ts || echo "⚠️ Journeys seeding failed - may need fixing"

# Seed user preferences
echo "⚙️ Seeding user preferences..."
docker exec marketsage-web npx tsx /app/src/scripts/seedUserPreferences.ts

echo "✅ Setup complete! Your MarketSage platform is ready at http://localhost:3030"
echo "📝 Login with email: admin@example.com and password: password123"
echo ""
echo "⚠️ Note: Workflow and Journey seeding may require additional fixes." 