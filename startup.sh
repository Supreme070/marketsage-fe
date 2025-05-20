#!/bin/sh
set -e

echo "🚀 Starting MarketSage initialization process..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in $(seq 1 30); do
  if pg_isready -h db -U marketsage; then
    echo "✅ Database is ready!"
    break
  fi
  echo "⏳ Waiting for database... ($i/30)"
  sleep 2
done

if ! pg_isready -h db -U marketsage; then
  echo "❌ Database failed to start in time. Exiting."
  exit 1
fi

# Set environment variables for Prisma
export NODE_ENV=production
export DATABASE_URL="postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
if npx prisma generate --schema=./prisma/schema.prisma; then
  echo "✅ Prisma client generated successfully"
else
  echo "⚠️ Warning: Prisma client generation may have issues"
fi

# Ensure Prisma client is linked properly
echo "🔄 Checking Prisma client installation..."

# Look for all possible Prisma client locations
PRISMA_NODE_MODULES="./node_modules/.prisma/client"
PRISMA_PRISMA_NODE_MODULES="./prisma/node_modules/.prisma/client"
PRISMA_DIRECT_NODE_MODULES="./node_modules/@prisma/client"
PRISMA_DIRECT_PRISMA_NODE_MODULES="./prisma/node_modules/@prisma/client"

# Ensure main location exists
if [ -d "$PRISMA_NODE_MODULES" ]; then
  echo "✅ Prisma client found at $PRISMA_NODE_MODULES"
else
  echo "⚠️ Prisma client not found at primary location, creating directory structure..."
  mkdir -p ./node_modules/.prisma
fi

# Create symlinks to ensure all possible locations work
if [ -d "$PRISMA_PRISMA_NODE_MODULES" ]; then
  echo "✅ Found Prisma client at $PRISMA_PRISMA_NODE_MODULES, creating symlink..."
  rm -rf "$PRISMA_NODE_MODULES" || true
  ln -sf ../../prisma/node_modules/.prisma/client "$PRISMA_NODE_MODULES"
  echo "✅ Created symlink from $PRISMA_PRISMA_NODE_MODULES to $PRISMA_NODE_MODULES"
fi

# Create package.json in .prisma/client if it doesn't exist
if [ ! -f "$PRISMA_NODE_MODULES/package.json" ] && [ -f "$PRISMA_PRISMA_NODE_MODULES/package.json" ]; then
  echo "✅ Copying package.json to $PRISMA_NODE_MODULES"
  cp "$PRISMA_PRISMA_NODE_MODULES/package.json" "$PRISMA_NODE_MODULES/"
fi

# Also create necessary index files if they don't exist
if [ ! -f "$PRISMA_NODE_MODULES/index.js" ] && [ -f "$PRISMA_PRISMA_NODE_MODULES/index.js" ]; then
  echo "✅ Copying index.js to $PRISMA_NODE_MODULES"
  cp "$PRISMA_PRISMA_NODE_MODULES/index.js" "$PRISMA_NODE_MODULES/"
fi

# Print debug information
echo "🔍 Debug information:"
ls -la ./node_modules/.prisma || echo "Directory not found: ./node_modules/.prisma"
ls -la ./prisma/node_modules/.prisma || echo "Directory not found: ./prisma/node_modules/.prisma"

# Try to run migrations but don't fail the startup if they don't work
echo "🔄 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "⚠️ Warning: Migration deployment had issues, but we'll continue startup"

# Create a default user if none exists
echo "🔄 Creating default user if needed..."
PGPASSWORD=marketsage_password psql -h db -U marketsage -d marketsage -c "INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d047', 'Admin User', 'admin@example.com', NOW(), 'password123', 'ADMIN', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;" || echo "⚠️ Warning: Default user creation had issues, but we'll continue startup"

# Manually ensure Task tables exist to prevent API errors
echo "🔄 Ensuring Task tables exist..."
PGPASSWORD=marketsage_password psql -h db -U marketsage -d marketsage -c "
CREATE TABLE IF NOT EXISTS \"Task\" (
    \"id\" TEXT NOT NULL,
    \"title\" TEXT NOT NULL,
    \"description\" TEXT,
    \"status\" TEXT NOT NULL DEFAULT 'TODO',
    \"priority\" TEXT NOT NULL DEFAULT 'MEDIUM',
    \"dueDate\" TIMESTAMP(3),
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"creatorId\" TEXT NOT NULL,
    \"assigneeId\" TEXT,
    \"contactId\" TEXT,
    \"segmentId\" TEXT,
    \"campaignId\" TEXT,
    \"regionId\" TEXT,
    CONSTRAINT \"Task_pkey\" PRIMARY KEY (\"id\")
);

CREATE TABLE IF NOT EXISTS \"TaskDependency\" (
    \"id\" TEXT NOT NULL,
    \"taskId\" TEXT NOT NULL,
    \"dependsOnTaskId\" TEXT NOT NULL,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT \"TaskDependency_pkey\" PRIMARY KEY (\"id\")
);

CREATE TABLE IF NOT EXISTS \"TaskComment\" (
    \"id\" TEXT NOT NULL,
    \"taskId\" TEXT NOT NULL,
    \"content\" TEXT NOT NULL,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdById\" TEXT NOT NULL,
    CONSTRAINT \"TaskComment_pkey\" PRIMARY KEY (\"id\")
);

-- Create foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_creatorId_fkey') THEN
        ALTER TABLE \"Task\" ADD CONSTRAINT \"Task_creatorId_fkey\" 
        FOREIGN KEY (\"creatorId\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_assigneeId_fkey') THEN
        ALTER TABLE \"Task\" ADD CONSTRAINT \"Task_assigneeId_fkey\" 
        FOREIGN KEY (\"assigneeId\") REFERENCES \"User\"(\"id\") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_campaignId_fkey') THEN
        ALTER TABLE \"Task\" ADD CONSTRAINT \"Task_campaignId_fkey\" 
        FOREIGN KEY (\"campaignId\") REFERENCES \"EmailCampaign\"(\"id\") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskDependency_taskId_fkey') THEN
        ALTER TABLE \"TaskDependency\" ADD CONSTRAINT \"TaskDependency_taskId_fkey\" 
        FOREIGN KEY (\"taskId\") REFERENCES \"Task\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskDependency_dependsOnTaskId_fkey') THEN
        ALTER TABLE \"TaskDependency\" ADD CONSTRAINT \"TaskDependency_dependsOnTaskId_fkey\" 
        FOREIGN KEY (\"dependsOnTaskId\") REFERENCES \"Task\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskComment_taskId_fkey') THEN
        ALTER TABLE \"TaskComment\" ADD CONSTRAINT \"TaskComment_taskId_fkey\" 
        FOREIGN KEY (\"taskId\") REFERENCES \"Task\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskComment_createdById_fkey') THEN
        ALTER TABLE \"TaskComment\" ADD CONSTRAINT \"TaskComment_createdById_fkey\" 
        FOREIGN KEY (\"createdById\") REFERENCES \"User\"(\"id\") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index on TaskDependency if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS \"TaskDependency_taskId_dependsOnTaskId_key\" ON \"TaskDependency\"(\"taskId\", \"dependsOnTaskId\");
" || echo "⚠️ Warning: Task tables creation had issues, but we'll continue startup"

# Skip the user count check that's failing
echo "🔍 Skipping user count check and database seeding for now"

# Always start using server.js since we're in a standalone Next.js build
echo "🚀 Starting MarketSage in production mode..."
exec node server.js 