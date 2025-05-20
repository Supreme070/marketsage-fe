#!/bin/bash

echo "Starting MarketSage with optimized settings..."

# Use optimized docker-compose file for database
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Test database connection
echo "Testing database connection..."
docker exec -i marketsage-db psql -U marketsage -c "SELECT 'Database connection successful';"
if [ $? -ne 0 ]; then
  echo "Database connection failed!"
  exit 1
fi

# Use the optimized environment variables
cp -f .env.optimized .env.local

# Run Next.js with increased memory allocation
echo "Starting Next.js application locally with increased memory..."
NODE_OPTIONS="--max-old-space-size=4096" npm run dev 