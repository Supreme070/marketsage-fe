# Redis Setup for MarketSage

## Current Configuration

MarketSage now has environment-aware Redis configuration:

### Local Development (npm run dev)
- **Redis Client**: Connects to `localhost:6379`
- **IORedis Client**: Connects to `localhost:6379`
- **No Docker required**: Just run Redis locally

### Docker Environment
- **Redis Client**: Connects to `marketsage-valkey:6379`
- **IORedis Client**: Connects to `marketsage-valkey:6379`
- **Docker Compose**: Uses Redis service

## Quick Start

### For Local Development (Your Current Setup)

1. **Install Redis locally**:
   ```bash
   # macOS
   brew install redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Windows
   # Download from https://redis.io/download
   ```

2. **Start Redis**:
   ```bash
   redis-server
   ```

3. **Run MarketSage**:
   ```bash
   npm run dev
   ```

### For Docker Environment

1. **Set environment variable**:
   ```bash
   export DOCKER_ENV=true
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up
   ```

## Environment Variables

Create a `.env.local` file for local development:

```bash
# For local development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# For Docker (automatically detected)
DOCKER_ENV=true
REDIS_URL=redis://marketsage-valkey:6379
```

## Troubleshooting

### Redis Connection Errors
- **Local**: Ensure Redis is running on localhost:6379
- **Docker**: Ensure Redis service is running in Docker Compose

### App Freezing
- ✅ **Fixed**: Reduced Redis clients from 3 to 2
- ✅ **Fixed**: Added proper error handling
- ✅ **Fixed**: Environment-aware configuration

## Status
- ✅ Disabled redis-pool.ts (was causing duplicate connections)
- ✅ Configured redis-client.ts for environment detection
- ✅ Configured redis.ts for environment detection
- ✅ Updated all imports to use correct clients
- ✅ Added graceful fallback when Redis is unavailable