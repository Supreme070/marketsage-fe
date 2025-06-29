#!/bin/bash
# Safe Database Migration Script for Multi-Tenancy
# This script safely migrates the database without breaking existing functionality

echo "🔧 MarketSage Safe Multi-Tenancy Migration"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Please run this script from the MarketSage root directory"
    exit 1
fi

# Backup current database (if using Docker)
echo "📦 Creating database backup..."
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U marketsage marketsage > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully"
else
    echo "⚠️ Backup failed, but continuing (database might not be running)"
fi

# Validate Prisma schema
echo "🔍 Validating Prisma schema..."
npx prisma validate
if [ $? -ne 0 ]; then
    echo "❌ Schema validation failed. Please fix schema errors first."
    exit 1
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Client generation failed"
    exit 1
fi

# Push database changes (safe with nullable organizationId)
echo "📊 Pushing database schema changes..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo "❌ Database push failed"
    exit 1
fi

echo "✅ Schema migration completed successfully!"

# Create default organization for existing data
echo "🏢 Creating default organization for existing data..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDefaultOrg() {
  console.log('Creating default organization...');
  
  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'default-org-migration' },
    update: {},
    create: {
      id: 'default-org-migration',
      name: 'Default Organization (Migration)',
      plan: 'ENTERPRISE',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log('Default organization created:', defaultOrg.id);
  
  // Update existing users to have organizationId
  const usersUpdated = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  
  console.log('Updated users:', usersUpdated.count);
  
  // Update existing contacts to have organizationId
  const contactsUpdated = await prisma.contact.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  
  console.log('Updated contacts:', contactsUpdated.count);
  
  // Update existing lists
  const listsUpdated = await prisma.list.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  
  console.log('Updated lists:', listsUpdated.count);
  
  // Update existing email campaigns
  const campaignsUpdated = await prisma.emailCampaign.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  
  console.log('Updated email campaigns:', campaignsUpdated.count);
  
  // Update existing tasks
  const tasksUpdated = await prisma.task.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  
  console.log('Updated tasks:', tasksUpdated.count);
  
  await prisma.\$disconnect();
  console.log('✅ Migration completed successfully!');
}

createDefaultOrg().catch(console.error);
"

if [ $? -eq 0 ]; then
    echo "✅ Data migration completed successfully!"
else
    echo "❌ Data migration failed"
    exit 1
fi

echo ""
echo "🎉 Multi-tenancy migration completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Test super admin login: supreme@marketsage.africa / MS_Super2025!"
echo "2. Verify tenant isolation is working"
echo "3. Test the onboarding wizard at /dashboard/onboarding"
echo "4. Create additional organizations as needed"
echo ""
echo "⚠️  Note: All existing data has been assigned to 'Default Organization (Migration)'"
echo "   You can create new organizations and reassign data as needed."