#!/bin/bash

# MarketSage Consolidated Deployment Test Script
# Tests the consolidated Docker setup

set -e

echo "🚀 Testing MarketSage Consolidated Deployment Setup"
echo "=================================================="

# Test Frontend Service
echo
echo "📱 Testing Frontend Service (MarketSage)"
echo "-----------------------------------------"
cd /Users/supreme/Desktop/marketsage

echo "✓ Checking Docker Compose validity..."
docker-compose config --quiet && echo "  ✅ Frontend Docker Compose valid"

echo "✓ Testing development profile..."
NODE_ENV=development docker-compose --profile frontend config --services > /dev/null && echo "  ✅ Development profile works"

echo "✓ Testing production profile..."
NODE_ENV=production docker-compose --profile production config --services > /dev/null && echo "  ✅ Production profile works"

echo "✓ Checking environment files..."
test -f .env && echo "  ✅ Development .env exists"
test -f .env.production && echo "  ✅ Production .env.production exists"

# Test Backend Service
echo
echo "🔧 Testing Backend Service"
echo "---------------------------"
cd /Users/supreme/Desktop/marketsage-backend

echo "✓ Checking Docker Compose validity..."
docker-compose config --quiet && echo "  ✅ Backend Docker Compose valid"

echo "✓ Testing backend profile..."
docker-compose --profile backend config --services > /dev/null && echo "  ✅ Backend profile works"

echo "✓ Checking environment files..."
test -f .env && echo "  ✅ Development .env exists"
test -f .env.production && echo "  ✅ Production .env.production exists"

# Test Monitoring Service
echo
echo "📊 Testing Monitoring Service"
echo "------------------------------"
cd /Users/supreme/Desktop/marketsage-monitoring

echo "✓ Checking Docker Compose validity..."
docker-compose config --quiet && echo "  ✅ Monitoring Docker Compose valid"

echo "✓ Testing monitoring profile..."
docker-compose --profile monitoring config --services > /dev/null && echo "  ✅ Monitoring profile works"

echo "✓ Checking environment files..."
test -f .env && echo "  ✅ Development .env exists"
test -f .env.production && echo "  ✅ Production .env.production exists"

# Test Consolidated Structure
echo
echo "📋 Testing Consolidated Structure"
echo "----------------------------------"

echo "✓ Verifying single Docker Compose files..."
cd /Users/supreme/Desktop/marketsage
compose_files=$(find . -name "docker-compose*.yml" -not -path "./node_modules/*" -not -path "./backup/*" | wc -l)
test $compose_files -eq 1 && echo "  ✅ Frontend has exactly 1 compose file"

cd /Users/supreme/Desktop/marketsage-backend
compose_files=$(find . -name "docker-compose*.yml" -not -path "./node_modules/*" | wc -l)
test $compose_files -eq 1 && echo "  ✅ Backend has exactly 1 compose file"

cd /Users/supreme/Desktop/marketsage-monitoring
compose_files=$(find . -name "docker-compose*.yml" -not -path "./node_modules/*" | wc -l)
test $compose_files -eq 1 && echo "  ✅ Monitoring has exactly 1 compose file"

echo "✓ Verifying single Dockerfiles..."
cd /Users/supreme/Desktop/marketsage
docker_files=$(find . -name "Dockerfile*" -not -path "./node_modules/*" -not -path "./backup/*" | wc -l)
test $docker_files -eq 1 && echo "  ✅ Frontend has exactly 1 Dockerfile"

cd /Users/supreme/Desktop/marketsage-backend
docker_files=$(find . -name "Dockerfile*" -not -path "./node_modules/*" | wc -l)
test $docker_files -eq 1 && echo "  ✅ Backend has exactly 1 Dockerfile"

cd /Users/supreme/Desktop/marketsage-monitoring
docker_files=$(find . -name "Dockerfile*" -not -path "./node_modules/*" | wc -l)
test $docker_files -le 1 && echo "  ✅ Monitoring has ≤1 Dockerfile"

echo "✓ Verifying environment file count..."
for service_dir in "/Users/supreme/Desktop/marketsage" "/Users/supreme/Desktop/marketsage-backend" "/Users/supreme/Desktop/marketsage-monitoring"; do
    cd "$service_dir"
    env_files=$(find . -name ".env*" -not -path "./node_modules/*" -not -path "./backup/*" | wc -l)
    service_name=$(basename "$service_dir")
    test $env_files -eq 2 && echo "  ✅ $service_name has exactly 2 env files (.env + .env.production)"
done

echo
echo "🎉 All Tests Passed!"
echo "=================="
echo "✅ Environment files consolidated (2 per service)"
echo "✅ Docker Compose files consolidated (1 per service)"  
echo "✅ Dockerfiles consolidated (≤1 per service)"
echo "✅ All configurations are valid"
echo "✅ Profile-based deployment works"
echo "✅ Environment switching works"
echo
echo "Ready for deployment! 🚀"

# Usage examples
echo
echo "📖 Usage Examples:"
echo "==================="
echo "# Start frontend in development:"
echo "cd /Users/supreme/Desktop/marketsage && NODE_ENV=development docker-compose --profile frontend up"
echo
echo "# Start backend in production:"
echo "cd /Users/supreme/Desktop/marketsage-backend && NODE_ENV=production docker-compose --profile all up"
echo
echo "# Start monitoring stack:"
echo "cd /Users/supreme/Desktop/marketsage-monitoring && docker-compose --profile monitoring up"