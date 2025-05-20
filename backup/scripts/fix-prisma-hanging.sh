#!/bin/bash

echo "=== MarketSage Platform Fix Script ==="
echo "This script will fix Prisma hanging issues and restore your development environment"

# Step 1: Stop any running docker containers
echo "Stopping any running containers..."
docker-compose down

# Step 2: Clean Prisma cache directories
echo "Cleaning Prisma cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client/node_modules
rm -rf node_modules/@prisma/engines

# Step 3: Create optimized .env file for local development
echo "Setting up optimized environment..."
cat > .env.optimized << EOL
DATABASE_URL=postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public&connection_limit=1
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=this-is-a-development-secret-key-replace-in-production
NODE_ENV=development
EOL

# Step 4: Restart database only
echo "Starting database only..."
docker-compose up -d db

# Step 5: Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Step 6: Test database connection
echo "Testing database connection..."
docker exec -i marketsage-db psql -U marketsage -c "SELECT 'Database connection successful';" || { echo "Database connection failed!"; exit 1; }

# Step 7: Clear node_modules and reinstall with greater memory allocation
echo "Would you like to reinstall node modules? This may take some time. (y/n)"
read -r REINSTALL

if [[ "$REINSTALL" == "y" ]]; then
  echo "Reinstalling node modules with increased memory allocation..."
  rm -rf node_modules
  NODE_OPTIONS="--max-old-space-size=4096" npm install
fi

# Step 8: Generate Prisma client with optimized settings and higher memory allocation
echo "Generating Prisma client with optimized settings..."
cp .env.optimized .env.local
NODE_OPTIONS="--max-old-space-size=4096" npx prisma generate

echo "Setup complete. Now run the application with: NODE_OPTIONS=\"--max-old-space-size=4096\" npm run dev" 