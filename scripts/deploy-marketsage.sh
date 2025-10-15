#!/bin/bash

echo "🚀 Starting MarketSage Automation Platform deployment..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Clean up any dangling volumes if needed
echo "🧹 Cleaning up dangling volumes..."
docker volume prune -f 

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Give some time for the containers to start up
echo "⏳ Waiting for containers to start up..."
sleep 30

# Check if containers are running
echo "🔍 Checking container status..."
docker ps

# Follow logs from the web container
echo "📋 Following logs from the web container..."
echo "Press Ctrl+C to stop viewing logs"
docker logs -f marketsage-web

echo "✅ MarketSage Automation Platform deployment completed!"
echo "🌐 Access the platform at http://localhost:3030" 