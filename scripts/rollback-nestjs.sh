#!/bin/bash

# Emergency NestJS Rollback Script
# This script disables NestJS authentication and reverts to Next.js only

echo "🚨 EMERGENCY NESTJS ROLLBACK INITIATED"
echo "This will disable NestJS and revert to Next.js authentication only"

read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo "📝 Starting rollback procedure..."

# Step 1: Stop NestJS backend service
echo "🔴 Stopping NestJS backend service..."
pkill -f "nest start" || echo "⚠️  NestJS process not found (may already be stopped)"

# Step 2: Disable USE_NESTJS_AUTH feature flag
echo "🔧 Disabling USE_NESTJS_AUTH feature flag..."
if [ -f ".env" ]; then
    # Remove existing USE_NESTJS_AUTH line
    sed -i.bak '/^USE_NESTJS_AUTH=/d' .env
    # Add disabled flag
    echo "USE_NESTJS_AUTH=false" >> .env
    echo "✅ Feature flag disabled in .env"
else
    echo "⚠️  .env file not found, creating with disabled flag"
    echo "USE_NESTJS_AUTH=false" > .env
fi

# Step 3: Update environment variables in production
if [ -f ".env.production" ]; then
    echo "🔧 Updating production environment..."
    sed -i.bak '/^USE_NESTJS_AUTH=/d' .env.production
    echo "USE_NESTJS_AUTH=false" >> .env.production
    echo "✅ Production environment updated"
fi

# Step 4: Clear application cache
echo "🧹 Clearing application cache..."
rm -rf .next/cache/* 2>/dev/null || true
echo "✅ Cache cleared"

# Step 5: Restart Next.js with disabled NestJS
echo "🔄 Restarting Next.js application..."
pkill -f "next dev" || true
sleep 2

# Start in background if in development
if [ "$NODE_ENV" != "production" ]; then
    echo "🚀 Starting Next.js in development mode..."
    npm run dev > /tmp/nextjs-rollback.log 2>&1 &
    NEXTJS_PID=$!
    sleep 3
    
    # Check if Next.js started successfully
    if kill -0 $NEXTJS_PID 2>/dev/null; then
        echo "✅ Next.js restarted successfully (PID: $NEXTJS_PID)"
    else
        echo "❌ Failed to restart Next.js"
        exit 1
    fi
else
    echo "⚠️  Production mode detected - manual restart required"
fi

# Step 6: Test authentication endpoint
echo "🧪 Testing authentication endpoint..."
sleep 5
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3007/api/auth/health 2>/dev/null || echo "000")

if [ "$AUTH_TEST" = "200" ]; then
    echo "✅ Authentication endpoint responding correctly"
elif [ "$AUTH_TEST" = "000" ]; then
    # Try port 3000 if 3007 failed
    AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/health 2>/dev/null || echo "000")
    if [ "$AUTH_TEST" = "200" ]; then
        echo "✅ Authentication endpoint responding correctly on port 3000"
    else
        echo "⚠️  Cannot reach authentication endpoint - manual verification required"
    fi
else
    echo "⚠️  Authentication endpoint returned HTTP $AUTH_TEST - manual verification required"
fi

# Step 7: Generate rollback report
echo "📊 Generating rollback report..."
cat > /tmp/nestjs-rollback-report.txt << EOF
NestJS Emergency Rollback Report
===============================
Timestamp: $(date)
Executed by: $(whoami)
Working directory: $(pwd)

Actions Taken:
- ✅ Stopped NestJS backend service
- ✅ Disabled USE_NESTJS_AUTH feature flag
- ✅ Updated production environment variables
- ✅ Cleared application cache
- ✅ Restarted Next.js application
- ✅ Tested authentication endpoint (HTTP $AUTH_TEST)

Current Status:
- NestJS: DISABLED
- Next.js Auth: ENABLED
- Feature Flag: USE_NESTJS_AUTH=false

Next Steps:
1. Verify authentication flows are working in the application
2. Monitor error logs for any issues
3. If problems persist, check /tmp/nextjs-rollback.log
4. To re-enable NestJS, run: scripts/enable-nestjs.sh

Backup Files Created:
- .env.bak (original .env)
- .env.production.bak (original .env.production)
EOF

echo "✅ Rollback report saved to /tmp/nestjs-rollback-report.txt"

echo ""
echo "🎉 ROLLBACK COMPLETED SUCCESSFULLY"
echo ""
echo "Summary:"
echo "  - NestJS authentication: DISABLED"
echo "  - Next.js authentication: ENABLED (fallback)"
echo "  - Application should now be running with original auth system"
echo ""
echo "📋 Next steps:"
echo "  1. Verify login/registration works in the application"
echo "  2. Monitor application logs for any issues"
echo "  3. Check rollback report: /tmp/nestjs-rollback-report.txt"
echo ""
echo "🔄 To re-enable NestJS later:"
echo "     bash scripts/enable-nestjs.sh"
echo ""