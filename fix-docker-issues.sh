#!/bin/bash

echo "🔧 Fixing MarketSage Docker Issues..."

# Stop all containers
echo "📋 Stopping containers..."
docker compose -f docker-compose.prod.yml down

# Remove old containers and volumes to ensure clean restart
echo "🧹 Cleaning up old containers and volumes..."
docker container prune -f
docker volume prune -f

# Remove specific containers if they exist
docker rm -f marketsage-web marketsage-db marketsage-valkey marketsage-seed 2>/dev/null || true

# Rebuild containers with no cache
echo "🔨 Rebuilding containers..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start containers in correct order
echo "🚀 Starting containers..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check container status
echo "📊 Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check Redis connection from web container
echo "🔍 Testing Redis connection from web container..."
docker exec marketsage-web nc -z marketsage-valkey 6379 && echo "✅ Redis connection: OK" || echo "❌ Redis connection: FAILED"

# Check database connection
echo "🔍 Testing database connection..."
docker exec marketsage-web nc -z marketsage-db 5432 && echo "✅ Database connection: OK" || echo "❌ Database connection: FAILED"

# Show recent web app logs
echo "📋 Recent web app logs:"
docker logs marketsage-web --tail 10

echo "✅ Fix script completed! Check the logs above for any remaining issues."
echo "🌐 App should be available at: http://localhost:3030"