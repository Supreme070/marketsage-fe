# MarketSage Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Database Seeding Strategy](#database-seeding-strategy)
4. [Deployment Commands](#deployment-commands)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM available
- 20GB free disk space
- Access to the MarketSage repositories

## Understanding the Architecture

MarketSage uses a **monolithic Next.js frontend** with **integrated backend services** and **MCP (Model Context Protocol) servers**:

### Services Overview
- **Web Application**: Next.js app with integrated API routes (Port 3030)
- **Database**: PostgreSQL 15 (Port 5432) 
- **Cache**: Valkey/Redis (Port 6379)
- **MCP Servers**: 5 specialized context servers (Ports 3001-3005)
- **Seed Container**: Temporary container that populates database then stops

### Service Dependencies
```
PostgreSQL + Valkey → Seed Container → Web Application
```

The seed container is **critical** - it:
1. Runs database migrations
2. Creates admin users
3. Populates initial data
4. **Stops automatically** (this is normal behavior)
5. Web app starts only after seed completes successfully

## Database Seeding Strategy

Your existing `docker-compose.prod.yml` implements a **perfect seeding strategy**:

### How It Works
1. **Seed Container Configuration**:
   ```yaml
   seed:
     restart: "no"  # Key: Never restart after completion
     depends_on:
       marketsage-db:
         condition: service_healthy
   ```

2. **Web App Dependency**:
   ```yaml
   web:
     depends_on:
       seed:
         condition: service_completed_successfully  # Waits for seed to finish
   ```

### Seed Process (1-2 minutes)
The seed container runs multiple scripts with timeouts:
- **Prisma Schema Push**: `npx prisma db push --accept-data-loss --force-reset`
- **Admin User Creation**: Direct SQL inserts with bcrypt passwords
- **Data Population**: Multiple seed scripts (contacts, campaigns, workflows, etc.)
- **Graceful Exit**: Container stops with exit code 0

### Important Behavior
- **Seed container shows "Exited (0)"** - This is **NORMAL** and **EXPECTED**
- If seed fails, web app won't start (fail-fast principle)
- Each script has timeout protection to prevent hanging

## Deployment Commands

### Standard Deployment Workflow

```bash
# Navigate to MarketSage directory
cd /path/to/marketsage

# 1. Clean shutdown and cleanup
docker compose -f docker-compose.prod.yml down
docker system prune -af --volumes

# 2. Deploy everything
docker compose -f docker-compose.prod.yml up -d
```

That's it! The dependency chain handles the rest automatically.

### Advanced Deployment Options

```bash
# Build images without starting (useful for CI/CD)
docker compose -f docker-compose.prod.yml build

# Start specific services only
docker compose -f docker-compose.prod.yml up -d marketsage-db marketsage-valkey

# View logs while deploying
docker compose -f docker-compose.prod.yml up --no-detach

# Scale specific services (if supported)
docker compose -f docker-compose.prod.yml up -d --scale web=2
```

### Quick Restart (without data loss)

```bash
# Restart just the application (keeps data)
docker compose -f docker-compose.prod.yml restart web

# Restart everything (keeps data)
docker compose -f docker-compose.prod.yml restart
```


## Verification

### 1. Check Container Status

```bash
# View all containers
docker compose -f docker-compose.prod.yml ps

# Expected output:
# marketsage-db        Up      5432/tcp    # PostgreSQL database
# marketsage-valkey    Up      6379/tcp    # Redis/Valkey cache  
# marketsage-web       Up      3030/tcp    # Next.js application with MCP servers
# marketsage-seed      Exited (0)          # Seed container - STOPPED (this is normal!)
```

### 2. Verify Seed Container Logs

```bash
# Check seed container logs
docker logs marketsage-seed

# Should show successful completion:
# 🚀 Starting MarketSage database seeding...
# 🔄 Generating Prisma client...
# 📥 Pushing database schema...
# 👤 Creating admin users...
# 🌱 Running seed scripts...
# 📊 Seeding contacts (preserving existing contacts)...
# 📋 Seeding lists...
# 🔖 Seeding segments...
# 📧 Seeding email campaigns...
# ... (more seed scripts)
# ✅ Database seeded successfully!
```

**Important**: If seed shows "Exited (0)" - this is **NORMAL** and **EXPECTED** behavior.

### 3. Test Application

```bash
# Test application health
curl http://localhost:3030/api/health

# Test if MCP servers are running
curl http://localhost:3001/health  # Customer Data MCP
curl http://localhost:3002/health  # Campaign Analytics MCP
curl http://localhost:3003/health  # LeadPulse MCP
curl http://localhost:3004/health  # External Services MCP
curl http://localhost:3005/health  # Monitoring MCP

# Access the application
open http://localhost:3030
```

### 4. Default Login Credentials

Based on your existing seed data:
- **Email**: `admin@example.com` or `supreme@marketsage.africa`  
- **Password**: Check the bcrypt hashes in docker-compose.prod.yml seed command
- **Role**: ADMIN or SUPER_ADMIN

## Troubleshooting

### Seed Container Issues

#### Container Shows "Exited (0)"
This is **NORMAL** and **EXPECTED**! The seed container should stop after completion.

#### Seed Container Failed
```bash
# Check seed container logs
docker logs marketsage-seed --tail 100

# Check exit code
docker inspect marketsage-seed --format='{{.State.ExitCode}}'
# Exit code 0 = success, anything else = failure

# If seed failed, check what went wrong
docker logs marketsage-seed | grep -E "(ERROR|FAILED|❌)"
```

#### Web App Won't Start
If web app doesn't start, it's usually because seed failed:
```bash
# Check web app logs
docker compose -f docker-compose.prod.yml logs web

# Manually run seed container to see errors
docker compose -f docker-compose.prod.yml up seed --no-detach
```

### Database Issues

#### Database Connection Failed
```bash
# Test database connection
docker exec -it marketsage-db psql -U marketsage -d marketsage -c "SELECT 1"

# Check database logs
docker compose -f docker-compose.prod.yml logs marketsage-db
```

#### Need to Re-seed Database
```bash
# Your standard cleanup process
docker compose -f docker-compose.prod.yml down
docker system prune -af --volumes

# Deploy again
docker compose -f docker-compose.prod.yml up -d
```

### Service Issues

#### Port Already in Use
```bash
# Check what's using the ports
lsof -i :3030  # Web app
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis/Valkey

# Kill processes if needed
sudo kill -9 <PID>
```

#### Container Won't Start
```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check service status
docker compose -f docker-compose.prod.yml ps

# Force recreate containers
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f web

# Seed container (after it stops)
docker logs marketsage-seed

# Follow logs in real-time during deployment
docker compose -f docker-compose.prod.yml up --no-detach
```

## Monitoring

### Built-in Monitoring

Your setup includes monitoring dashboards accessible at:
- **Grafana**: http://localhost:3001 (if configured)
- **Prometheus**: http://localhost:9090 (if configured)

### Health Checks

```bash
# Application health
curl http://localhost:3030/api/health

# MCP Servers health
for port in {3001..3005}; do
  echo "Testing MCP server on port $port"
  curl -s http://localhost:$port/health || echo "Port $port not responding"
done

# Database health
docker exec marketsage-db pg_isready -U marketsage
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
docker volume inspect marketsage_postgres-data
```

## Summary

### Your Deployment Workflow (Industry Standard)

```bash
# 1. Clean shutdown and cleanup
docker compose -f docker-compose.prod.yml down
docker system prune -af --volumes

# 2. Deploy everything
docker compose -f docker-compose.prod.yml up -d

# 3. Verify seed completed successfully
docker logs marketsage-seed

# 4. Access application
open http://localhost:3030
```

### Key Points

1. **Seed container showing "Exited (0)" is normal** - it's designed to run once and stop
2. **Use `docker-compose.prod.yml`** - this is the industry standard approach
3. **Your workflow is already optimal** - clean, simple, and reliable
4. **Dependencies are automatic** - Docker Compose handles the startup order
5. **MCP servers run within the web container** - no separate containers needed

This approach follows Docker Compose best practices and is used by most production deployments.