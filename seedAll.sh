#!/bin/bash

# Exit on error
set -e

echo "Starting database seeding process..."

# Wait for the database to be ready
echo "Waiting for database to be ready..."
npx prisma db push --accept-data-loss

echo "Seeding contacts..."
ts-node src/scripts/seedContacts.ts

echo "Seeding lists..."
ts-node src/scripts/seedLists.ts

echo "Seeding segments..."
node src/scripts/seedSegments.js

echo "Seeding email campaigns..."
ts-node src/scripts/seedEmailCampaigns.ts

echo "Seeding SMS templates..."
ts-node src/scripts/seedSMSTemplates.ts

echo "Seeding SMS campaigns..."
ts-node src/scripts/seedSMSCampaigns.ts

echo "Seeding WhatsApp templates..."
ts-node src/scripts/seedWhatsAppTemplates.ts

echo "Seeding WhatsApp campaigns..."
ts-node src/scripts/seedWhatsAppCampaigns.ts

echo "Seeding workflows..."
ts-node src/scripts/seedWorkflows.ts

echo "Assigning contacts to lists..."
ts-node src/scripts/assignContactsToLists.ts

echo "Seeding complete!" 