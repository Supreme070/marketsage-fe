#!/bin/bash
set -e

echo "Starting everything from scratch..."

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Start everything up
echo "Starting Docker services..."
docker-compose up -d

# Wait for web service to be healthy
echo "Waiting for web service to be ready..."
sleep 15

# Copy our seed scripts
echo "Copying seed files to container..."
docker cp manual-seed.js marketsage-web:/app/manual-seed.js

# Run the main seed script for users, contacts and lists
echo "Running basic seed script..."
docker exec -it marketsage-web node /app/manual-seed.js

# Now run the other specialized seed scripts
echo "Running email campaigns seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedEmailCampaigns.ts || echo "Email campaigns seeding failed"

echo "Running SMS templates seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedSMSTemplates.ts || echo "SMS templates seeding failed"

echo "Running SMS campaigns seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedSMSCampaigns.ts || echo "SMS campaigns seeding failed"

echo "Running WhatsApp templates seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedWhatsAppTemplates.ts || echo "WhatsApp templates seeding failed"

echo "Running WhatsApp campaigns seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedWhatsAppCampaigns.ts || echo "WhatsApp campaigns seeding failed"

echo "Running workflows seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedWorkflows.ts || echo "Workflows seeding failed"

echo "Running segments seed..."
docker exec -it marketsage-web node src/scripts/seedSegments.js || echo "Segments seeding failed"

echo "Running user preferences seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedUserPreferences.ts || echo "User preferences seeding failed"

echo "Running journeys seed..."
docker exec -it marketsage-web npx tsx src/scripts/seedJourneys.ts || echo "Journeys seeding failed"

echo "Assigning contacts..."
docker exec -it marketsage-web npx tsx src/scripts/assignContactsDocker.ts || echo "Contact assignment failed"

echo "Seeding completed! Your database should now be fully populated with sample data." 