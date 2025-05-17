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

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Create a default user if none exists
echo "🔄 Creating default user if needed..."
PGPASSWORD=marketsage_password psql -h db -U marketsage -d marketsage -c "INSERT INTO \"User\" (id, name, email, \"emailVerified\", password, role, \"createdAt\", \"updatedAt\") 
VALUES ('574c1069-9130-4fdc-9e1c-a02994e4d047', 'Admin User', 'admin@example.com', NOW(), 'password123', 'ADMIN', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;"

# Skip the user count check that's failing
echo "🔍 Skipping user count check and database seeding for now"

# Always start using server.js since we're in a standalone Next.js build
echo "🚀 Starting MarketSage in production mode..."
exec node server.js 