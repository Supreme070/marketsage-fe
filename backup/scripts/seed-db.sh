#!/bin/bash
set -e

# Stop and remove all containers
echo "Stopping and removing containers..."
docker-compose down

# Start the database only
echo "Starting database..."
docker-compose up -d db

# Wait for database to be healthy
echo "Waiting for database to be healthy..."
until docker exec marketsage-db pg_isready -U marketsage; do
  echo "Database not ready yet..."
  sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running migrations..."
docker-compose run --rm -T web npx prisma migrate deploy

# Create a custom seed script that doesn't use ts-node
echo "Creating direct seed script..."
cat > direct-seed.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // Create default users
  const users = [
    {
      id: randomUUID(),
      email: 'supreme@marketsage.africa',
      password: 'MS_Super2025!',
      name: 'Supreme Admin',
      role: 'SUPER_ADMIN',
    },
    {
      id: randomUUID(),
      email: 'anita@marketsage.africa',
      password: 'MS_Admin2025!',
      name: 'Anita Manager',
      role: 'ADMIN',
    },
    {
      id: randomUUID(),
      email: 'kola@marketsage.africa',
      password: 'MS_ITAdmin2025!',
      name: 'Kola Techleads',
      role: 'IT_ADMIN',
    },
    {
      id: randomUUID(),
      email: 'user@marketsage.africa',
      password: 'MS_User2025!',
      name: 'Regular User',
      role: 'USER',
    },
  ];

  for (const user of users) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      // If not exists, create user
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password, // In development, no need to hash
          name: user.name,
          role: user.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created user: ${user.name} (${user.email})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
EOF

# Run our custom seed script
echo "Seeding database with default users..."
docker-compose run --rm -T web node direct-seed.js

# Seed contacts
echo "Seeding contacts..."
docker-compose run --rm -T web npx tsx src/scripts/seedContacts.ts

# Seed lists
echo "Seeding lists..."
docker-compose run --rm -T web npx tsx src/scripts/seedLists.ts

# Seed segments
echo "Seeding segments..."
docker-compose run --rm -T web node src/scripts/seedSegments.js

# Seed email campaigns
echo "Seeding email campaigns..."
docker-compose run --rm -T web npx tsx src/scripts/seedEmailCampaigns.ts

# Seed SMS templates
echo "Seeding SMS templates..."
docker-compose run --rm -T web npx tsx src/scripts/seedSMSTemplates.ts

# Seed SMS campaigns
echo "Seeding SMS campaigns..."
docker-compose run --rm -T web npx tsx src/scripts/seedSMSCampaigns.ts

# Seed WhatsApp templates
echo "Seeding WhatsApp templates..."
docker-compose run --rm -T web npx tsx src/scripts/seedWhatsAppTemplates.ts

# Seed WhatsApp campaigns
echo "Seeding WhatsApp campaigns..."
docker-compose run --rm -T web npx tsx src/scripts/seedWhatsAppCampaigns.ts

# Seed workflows
echo "Seeding workflows..."
docker-compose run --rm -T web npx tsx src/scripts/seedWorkflows.ts

# Assign contacts
echo "Assigning contacts..."
docker-compose run --rm -T web npx tsx src/scripts/assignContactsDocker.ts

# Seed journeys
echo "Seeding journeys..."
docker-compose run --rm -T web npx tsx src/scripts/seedJourneys.ts

# Start the web service
echo "Starting web service..."
docker-compose up -d web

echo "Done! Your database should now be seeded and the application running." 