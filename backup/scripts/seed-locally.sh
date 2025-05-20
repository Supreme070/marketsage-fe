#!/bin/bash

echo "🌱 Running all seed scripts for MarketSage locally..."

# Set environment variables for local execution
export DATABASE_URL="postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public"

# Execute each seed script in sequence
echo "🔄 Seeding contacts..."
npx tsx src/scripts/seedContacts.ts

echo "🔄 Seeding notifications..."
npx tsx src/scripts/seedNotifications.ts

echo "🔄 Seeding journeys..."
npx tsx src/scripts/seedJourneys.ts

echo "🔄 Seeding user preferences..."
npx tsx src/scripts/seedUserPreferences.ts

echo "🔄 Seeding workflows..."
npx tsx src/scripts/seedWorkflows.ts

echo "🔄 Seeding SMS templates..."
npx tsx src/scripts/seedSMSTemplates.ts

echo "🔄 Seeding WhatsApp campaigns..."
npx tsx src/scripts/seedWhatsAppCampaigns.ts

echo "🔄 Seeding WhatsApp templates..."
npx tsx src/scripts/seedWhatsAppTemplates.ts

echo "🔄 Seeding email campaigns..."
npx tsx src/scripts/seedEmailCampaigns.ts

echo "🔄 Seeding SMS campaigns..."
npx tsx src/scripts/seedSMSCampaigns.ts

echo "🔄 Seeding segments..."
node src/scripts/seedSegments.js

echo "🔄 Seeding lists..."
npx tsx src/scripts/seedLists.ts

echo "✅ All seed scripts completed!"
echo "🎉 Database seeding complete!" 