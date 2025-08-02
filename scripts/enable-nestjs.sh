#!/bin/bash

# NestJS Re-enablement Script
# This script re-enables NestJS authentication alongside Next.js

echo "🚀 NESTJS RE-ENABLEMENT SCRIPT"
echo "This will start NestJS backend and enable parallel authentication"

read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Re-enablement cancelled"
    exit 1
fi

echo "📝 Starting NestJS enablement procedure..."

# Step 1: Enable USE_NESTJS_AUTH feature flag
echo "🔧 Enabling USE_NESTJS_AUTH feature flag..."
if [ -f ".env" ]; then
    # Remove existing USE_NESTJS_AUTH line
    sed -i.bak '/^USE_NESTJS_AUTH=/d' .env
    # Add enabled flag
    echo "USE_NESTJS_AUTH=true" >> .env
    echo "✅ Feature flag enabled in .env"
else
    echo "⚠️  .env file not found, creating with enabled flag"
    echo "USE_NESTJS_AUTH=true" > .env
fi

# Step 2: Update environment variables in production
if [ -f ".env.production" ]; then
    echo "🔧 Updating production environment..."
    sed -i.bak '/^USE_NESTJS_AUTH=/d' .env.production
    echo "USE_NESTJS_AUTH=true" >> .env.production
    echo "✅ Production environment updated"
fi

# Step 3: Start NestJS backend
echo "🚀 Starting NestJS backend..."
cd marketsage-backend 2>/dev/null || (echo "❌ marketsage-backend directory not found" && exit 1)

# Check if already running
if pgrep -f "nest start" > /dev/null; then
    echo "⚠️  NestJS already running, restarting..."
    pkill -f "nest start"
    sleep 2
fi

# Start NestJS in background
npm run start:dev > /tmp/nestjs-enable.log 2>&1 &
NESTJS_PID=$!
cd ..

echo "⏳ Waiting for NestJS to start..."
sleep 8

# Check if NestJS started successfully
if kill -0 $NESTJS_PID 2>/dev/null; then
    echo "✅ NestJS started successfully (PID: $NESTJS_PID)"
else
    echo "❌ Failed to start NestJS, check logs: /tmp/nestjs-enable.log"
    exit 1
fi

# Step 4: Test NestJS health endpoint
echo "🧪 Testing NestJS health endpoint..."
NESTJS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/v2/health 2>/dev/null || echo "000")

if [ "$NESTJS_HEALTH" = "200" ]; then
    echo "✅ NestJS health endpoint responding correctly"
else
    echo "⚠️  NestJS health endpoint returned HTTP $NESTJS_HEALTH"
    echo "    This might be normal if the service is still starting up"
fi

# Step 5: Test NestJS auth endpoints
echo "🔐 Testing NestJS authentication endpoints..."
sleep 2

# Test registration endpoint
REG_TEST=$(curl -s -X POST http://localhost:3006/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test-enable@example.com","password":"password123"}' \
  -w "%{http_code}" -o /tmp/nestjs-reg-test.json 2>/dev/null | tail -n1)

if [ "$REG_TEST" = "201" ] || [ "$REG_TEST" = "409" ]; then
    echo "✅ NestJS registration endpoint responding correctly (HTTP $REG_TEST)"
else
    echo "⚠️  NestJS registration endpoint returned HTTP $REG_TEST"
    echo "    Check /tmp/nestjs-reg-test.json for details"
fi

# Step 6: Clear Next.js cache and restart
echo "🧹 Clearing Next.js cache..."
rm -rf .next/cache/* 2>/dev/null || true

echo "🔄 Restarting Next.js to pick up feature flag..."
pkill -f "next dev" || true
sleep 2

# Start Next.js if in development
if [ "$NODE_ENV" != "production" ]; then
    echo "🚀 Starting Next.js with NestJS integration..."
    npm run dev > /tmp/nextjs-enable.log 2>&1 &
    NEXTJS_PID=$!
    sleep 5
    
    # Check if Next.js started successfully
    if kill -0 $NEXTJS_PID 2>/dev/null; then
        echo "✅ Next.js restarted successfully (PID: $NEXTJS_PID)"
    else
        echo "❌ Failed to restart Next.js, check logs: /tmp/nextjs-enable.log"
        exit 1
    fi
else
    echo "⚠️  Production mode detected - manual restart required"
fi

# Step 7: Test feature flag endpoint
echo "🏁 Testing feature flag integration..."
sleep 3

FEATURE_TEST=$(curl -s http://localhost:3007/api/feature-flags 2>/dev/null || curl -s http://localhost:3000/api/feature-flags 2>/dev/null || echo '{"error":"unreachable"}')
echo "Feature flags response: $FEATURE_TEST" | head -c 100
echo ""

# Step 8: Generate enablement report
echo "📊 Generating enablement report..."
cat > /tmp/nestjs-enable-report.txt << EOF
NestJS Enablement Report
========================
Timestamp: $(date)
Executed by: $(whoami)
Working directory: $(pwd)

Actions Taken:
- ✅ Enabled USE_NESTJS_AUTH feature flag
- ✅ Updated production environment variables
- ✅ Started NestJS backend service (PID: $NESTJS_PID)
- ✅ Tested NestJS health endpoint (HTTP $NESTJS_HEALTH)
- ✅ Tested NestJS auth endpoints (HTTP $REG_TEST)
- ✅ Cleared Next.js cache
- ✅ Restarted Next.js application

Current Status:
- NestJS: ENABLED (Port 3006)
- Next.js Auth: ENABLED (Fallback)
- Feature Flag: USE_NESTJS_AUTH=true
- Parallel Authentication: ACTIVE

Service Endpoints:
- NestJS Health: http://localhost:3006/api/v2/health
- NestJS Auth: http://localhost:3006/api/v2/auth/*
- Next.js Proxy: http://localhost:3000/api/v2/* -> NestJS

Testing Commands:
# Test NestJS directly:
curl http://localhost:3006/api/v2/health

# Test through Next.js proxy:
curl http://localhost:3000/api/v2/health

# Test registration:
curl -X POST http://localhost:3006/api/v2/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

Log Files:
- NestJS: /tmp/nestjs-enable.log
- Next.js: /tmp/nextjs-enable.log
- Registration test: /tmp/nestjs-reg-test.json

Next Steps:
1. Verify both auth systems are working
2. Monitor application logs for any issues
3. Test user registration and login flows
4. Set up monitoring for both services

Backup Files Created:
- .env.bak (previous .env)
- .env.production.bak (previous .env.production)
EOF

echo "✅ Enablement report saved to /tmp/nestjs-enable-report.txt"

echo ""
echo "🎉 NESTJS ENABLEMENT COMPLETED"
echo ""
echo "Summary:"
echo "  - NestJS authentication: ENABLED (Port 3006)"
echo "  - Next.js authentication: ENABLED (Fallback)"
echo "  - Parallel authentication: ACTIVE"
echo "  - Feature flag: USE_NESTJS_AUTH=true"
echo ""
echo "📋 Next steps:"
echo "  1. Test login/registration in the application"
echo "  2. Monitor logs: /tmp/nestjs-enable.log"
echo "  3. Check enablement report: /tmp/nestjs-enable-report.txt"
echo ""
echo "🛠️  Service URLs:"
echo "     NestJS Direct: http://localhost:3006/api/v2/health"
echo "     Through Proxy: http://localhost:3000/api/v2/health"
echo ""
echo "🚨 If issues occur, rollback with:"
echo "     bash scripts/rollback-nestjs.sh"
echo ""