#!/bin/bash
# Script to run all seed scripts for MarketSage
# Updated to match Docker Compose seeding configuration
# Run with: bash seedAll.sh

# Exit on error
set -e

echo "🚀 Starting MarketSage database initialization and seeding..."

# Wait for database to be ready (60 seconds like Docker)
echo "⏱️ Waiting 60 seconds for database to be ready..."
sleep 60

echo "🔍 Checking database schema..."
PGPASSWORD=marketsage_password psql -h localhost -U marketsage -d marketsage -c "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole');"

echo "📋 Checking migration status..."
migration_status=$(npx prisma migrate status || echo 'Migration conflicts detected')

if echo "$migration_status" | grep -q 'Database schema is up to date'; then
  echo '✅ Migrations are already up to date' 
else
  echo '🔄 Resolving migration conflicts...' 
  echo '🗑️ Clearing migration history due to conflicts...'
  PGPASSWORD=marketsage_password psql -h localhost -U marketsage -d marketsage -c "DELETE FROM _prisma_migrations;"
  
  echo '📥 Pushing current schema to database...'
  npx prisma db push --accept-data-loss
  
  echo '✅ Schema synchronized successfully'
fi

echo '👤 Creating admin user if not exists...'
PGPASSWORD=marketsage_password psql -h localhost -U marketsage -d marketsage -c "INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d047', 'Admin User', 'admin@example.com', NOW(), 'password123', 'ADMIN', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;"

echo '👤 Creating development users if not exist...'
PGPASSWORD=marketsage_password psql -h localhost -U marketsage -d marketsage -c "
INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d111', 'Supreme Admin', 'supreme@marketsage.africa', NOW(), 'MS_Super2025!', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d222', 'Anita Manager', 'anita@marketsage.africa', NOW(), 'MS_Admin2025!', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d333', 'Kola Techleads', 'kola@marketsage.africa', NOW(), 'MS_ITAdmin2025!', 'IT_ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d444', 'Regular User', 'user@marketsage.africa', NOW(), 'MS_User2025!', 'USER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;"

echo '🌱 Running seed scripts...'

echo '👀 Checking script directories...'
ls -la ./src/scripts/

echo '📊 Seeding contacts (preserving existing contacts)...'
SKIP_CONTACT_DELETE=true npx tsx ./src/scripts/seedContacts.ts

echo '📋 Seeding lists...'
npx tsx ./src/scripts/seedLists.ts

echo '🔖 Seeding segments...'
node ./src/scripts/seedSegments.js

echo '📧 Seeding email campaigns...'
npx tsx ./src/scripts/seedEmailCampaigns.ts

echo '📱 Seeding SMS templates...'
npx tsx ./src/scripts/seedSMSTemplates.ts

echo '📱 Seeding SMS campaigns...'
npx tsx ./src/scripts/seedSMSCampaigns.ts

echo '💬 Seeding WhatsApp templates...'
node ./src/scripts/seedWhatsAppTemplates.js

echo '💬 Seeding WhatsApp campaigns...'
npx tsx ./src/scripts/seedWhatsAppCampaigns.ts

echo '🔄 Seeding workflows...'
node ./src/scripts/seedWorkflows.js

echo '🛤️ Seeding journeys...'
npx tsx ./src/scripts/seedJourneys.ts

echo '🔔 Seeding notifications...'
npx tsx ./src/scripts/seedNotifications.ts

echo '⚙️ Seeding user preferences...'
npx tsx ./src/scripts/seedUserPreferences.ts

echo '📋 Seeding task management...'
npx tsx ./src/scripts/seedTaskManagement.ts

echo '🔗 Assigning contacts to current user...'
npx tsx ./src/scripts/assignContactsToCurrentUser.ts

echo '✅ Database seeded successfully!'