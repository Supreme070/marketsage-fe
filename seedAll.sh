#!/bin/bash
# Script to run all seed scripts for MarketSage
# Save as seed-all.sh in the scripts directory and run with:
# bash src/scripts/seed-all.sh

# Exit on error
set -e

echo "==== Starting MarketSage Database Seeding Process ===="

# Wait for the database to be ready (if needed)
echo "Waiting for database to be ready..."
npx prisma db push --accept-data-loss

# Create default user first (if available)
if [ -f "src/scripts/createDefaultUser.js" ]; then
  echo -e "\n==== Creating Default User ===="
  node src/scripts/createDefaultUser.js
fi

# Run seed scripts using the appropriate command based on file extension
# JavaScript files use node directly, TypeScript files use ts-node with flags

echo -e "\n==== Seeding Segments ===="
node src/scripts/seedSegments.js

echo -e "\n==== Seeding Lists ===="
# Choose the available script (TS or JS)
if [ -f "src/scripts/seedLists.ts" ]; then
  NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedLists.ts
else
  node src/scripts/seedListsJS.js
fi

echo -e "\n==== Seeding Contacts ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedContacts.ts

echo -e "\n==== Seeding Workflows ===="
node src/scripts/seedWorkflows.js

echo -e "\n==== Seeding WhatsApp Templates ===="
node src/scripts/seedWhatsAppTemplates.js

echo -e "\n==== Seeding SMS Templates ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedSMSTemplates.ts

echo -e "\n==== Seeding Email Campaigns ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedEmailCampaigns.ts

echo -e "\n==== Seeding SMS Campaigns ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedSMSCampaigns.ts

echo -e "\n==== Seeding WhatsApp Campaigns ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedWhatsAppCampaigns.ts

echo -e "\n==== Seeding Journeys ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedJourneys.ts

echo -e "\n==== Seeding Notifications ===="
# Choose the right file to use (TS or JS)
if [ -f "src/scripts/seedNotifications.ts" ]; then
  NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedNotifications.ts
else
  node src/scripts/seedNotifications.js
fi

echo -e "\n==== Seeding User Preferences ===="
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/seedUserPreferences.ts

# Optional: Assign contacts to current user if needed
if [ -f "src/scripts/assignContactsToCurrentUser.ts" ]; then
  echo -e "\n==== Assigning Contacts to Current User ===="
  NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm src/scripts/assignContactsToCurrentUser.ts
fi

echo -e "\n==== All Seed Scripts Completed Successfully ===="