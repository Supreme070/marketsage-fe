#!/bin/bash

echo "🌱 Running all seed scripts for MarketSage with current container paths..."

# Run in Docker container using the current paths in the container
docker exec marketsage-web bash -c "cd /app && \
  echo '🔄 Seeding contacts...' && \
  npx tsx scripts/seedContacts.ts && \
  echo '🔄 Seeding notifications...' && \
  npx tsx scripts/seedNotifications.ts && \
  echo '🔄 Seeding journeys...' && \
  npx tsx scripts/seedJourneys.ts && \
  echo '🔄 Seeding user preferences...' && \
  npx tsx scripts/seedUserPreferences.ts && \
  echo '🔄 Seeding workflows...' && \
  npx tsx scripts/seedWorkflows.ts && \
  echo '🔄 Seeding SMS templates...' && \
  npx tsx scripts/seedSMSTemplates.ts && \
  echo '🔄 Seeding WhatsApp campaigns...' && \
  npx tsx scripts/seedWhatsAppCampaigns.ts && \
  echo '🔄 Seeding WhatsApp templates...' && \
  npx tsx scripts/seedWhatsAppTemplates.ts && \
  echo '🔄 Seeding email campaigns...' && \
  npx tsx scripts/seedEmailCampaigns.ts && \
  echo '🔄 Seeding SMS campaigns...' && \
  npx tsx scripts/seedSMSCampaigns.ts && \
  echo '🔄 Seeding segments...' && \
  node scripts/seedSegments.js && \
  echo '🔄 Seeding lists...' && \
  npx tsx scripts/seedLists.ts && \
  echo '✅ All seed scripts completed!'"

echo "🎉 Database seeding complete!" 