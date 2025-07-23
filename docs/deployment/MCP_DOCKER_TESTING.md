# MCP Docker Environment Testing Guide

This document provides comprehensive testing procedures for MarketSage MCP (Model Context Protocol) functionality in Docker containers.

## Overview

The MarketSage MCP implementation includes 5 servers that provide real-time data access for AI agents:
- **Customer Data Server**: Contact intelligence and segmentation
- **Campaign Analytics Server**: Performance metrics and A/B testing
- **LeadPulse Server**: Visitor tracking and behavioral analytics
- **External Services Server**: SMS/Email/WhatsApp integrations
- **Monitoring Server**: Business metrics and system health

## Prerequisites

- Docker and Docker Compose installed
- MarketSage codebase with MCP implementation
- Environment variables configured
- Sufficient system resources (4GB RAM minimum)

## Quick Testing

### 1. Start Docker Environment

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 2. Run MCP Tests

```bash
# Comprehensive MCP Docker testing
./scripts/docker/test-mcp-docker.sh

# Continuous health monitoring
./scripts/docker/mcp-health-check.sh --monitor
```

### 3. Verify MCP Data

```bash
# Check MCP tables in database
docker exec marketsage-db psql -U marketsage -d marketsage -c "
SELECT 
  'MCPCampaignMetrics' as table_name, COUNT(*) as records 
FROM \"MCPCampaignMetrics\"
UNION ALL
SELECT 
  'MCPCustomerPredictions', COUNT(*) 
FROM \"MCPCustomerPredictions\"
UNION ALL
SELECT 
  'MCPVisitorSessions', COUNT(*) 
FROM \"MCPVisitorSessions\"
UNION ALL
SELECT 
  'MCPMonitoringMetrics', COUNT(*) 
FROM \"MCPMonitoringMetrics\";"
```

## Detailed Testing Procedures

### Container Health Verification

```bash
# Check all container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check container health
docker inspect --format='{{.State.Health.Status}}' marketsage-web
docker inspect --format='{{.State.Health.Status}}' marketsage-db
docker inspect --format='{{.State.Health.Status}}' marketsage-valkey
```

### Database Connectivity Testing

```bash
# Test PostgreSQL connection
docker exec marketsage-db pg_isready -U marketsage

# Test database queries
docker exec marketsage-db psql -U marketsage -d marketsage -c "SELECT NOW();"

# Check MCP schema
docker exec marketsage-db psql -U marketsage -d marketsage -c "
\dt \"MCP*\"
"
```

### Redis/Valkey Testing

```bash
# Test Redis connection
docker exec marketsage-valkey valkey-cli ping

# Test Redis operations
docker exec marketsage-valkey valkey-cli set test_key "test_value"
docker exec marketsage-valkey valkey-cli get test_key
docker exec marketsage-valkey valkey-cli del test_key

# Monitor Redis stats
docker exec marketsage-valkey valkey-cli info
```

### Application Health Testing

```bash
# Test main health endpoint
curl -f http://localhost:3030/api/health

# Test MCP server health endpoints
curl -f http://localhost:3030/api/mcp/customer-data/health
curl -f http://localhost:3030/api/mcp/campaign-analytics/health  
curl -f http://localhost:3030/api/mcp/leadpulse/health
curl -f http://localhost:3030/api/mcp/monitoring/health
curl -f http://localhost:3030/api/mcp/external-services/health
```

### Resource Monitoring

```bash
# Monitor container resources
docker stats marketsage-web marketsage-db marketsage-valkey

# Check container logs
docker logs marketsage-web --tail 50
docker logs marketsage-db --tail 20
docker logs marketsage-valkey --tail 20
```

## MCP Data Validation

### Campaign Analytics Data

```bash
# Check campaign metrics data
docker exec marketsage-db psql -U marketsage -d marketsage -c "
SELECT 
  organizationId,
  COUNT(*) as metrics_count,
  AVG((metrics->>'openRate')::numeric) as avg_open_rate,
  AVG((metrics->>'clickRate')::numeric) as avg_click_rate
FROM \"MCPCampaignMetrics\"
GROUP BY organizationId
LIMIT 5;"
```

### Customer Predictions Data

```bash
# Check customer predictions
docker exec marketsage-db psql -U marketsage -d marketsage -c "
SELECT 
  organizationId,
  COUNT(*) as predictions_count,
  AVG((predictions->>'churnProbability')::numeric) as avg_churn_prob,
  AVG((predictions->>'lifetimeValue')::numeric) as avg_ltv
FROM \"MCPCustomerPredictions\"
GROUP BY organizationId
LIMIT 5;"
```

### Visitor Sessions Data

```bash
# Check visitor sessions
docker exec marketsage-db psql -U marketsage -d marketsage -c "
SELECT 
  organizationId,
  COUNT(*) as sessions_count,
  AVG(\"intentScore\") as avg_intent_score,
  AVG(\"sessionDuration\") as avg_duration
FROM \"MCPVisitorSessions\"
GROUP BY organizationId
LIMIT 5;"
```

### Monitoring Metrics Data

```bash
# Check monitoring metrics
docker exec marketsage-db psql -U marketsage -d marketsage -c "
SELECT 
  organizationId,
  COUNT(*) as metrics_count,
  MAX(timestamp) as latest_metric
FROM \"MCPMonitoringMetrics\"
GROUP BY organizationId
LIMIT 5;"
```

## Performance Testing

### Load Testing

```bash
# Simple load test for MCP endpoints
for i in {1..10}; do
  curl -s http://localhost:3030/api/mcp/customer-data/health &
done
wait

# Monitor response times
time curl http://localhost:3030/api/mcp/leadpulse/visitors
```

### Concurrent Access Testing

```bash
# Test concurrent database access
for i in {1..5}; do
  docker exec marketsage-db psql -U marketsage -d marketsage -c "SELECT COUNT(*) FROM \"MCPVisitorSessions\";" &
done
wait
```

## Troubleshooting

### Common Issues

1. **Container Won't Start**
   ```bash
   # Check logs
   docker logs marketsage-web
   
   # Check port conflicts
   netstat -tulpn | grep :3030
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker exec marketsage-db pg_isready -U marketsage
   
   # Check environment variables
   docker exec marketsage-web printenv | grep DATABASE_URL
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   docker exec marketsage-valkey valkey-cli ping
   
   # Check Redis configuration
   docker exec marketsage-valkey valkey-cli config get "*"
   ```

4. **MCP Data Missing**
   ```bash
   # Re-run MCP seeding
   docker exec marketsage-web npx tsx /app/src/scripts/seed-mcp-campaign-analytics.ts
   docker exec marketsage-web npx tsx /app/src/scripts/seed-mcp-customer-predictions.ts
   docker exec marketsage-web npx tsx /app/src/scripts/seed-mcp-visitor-sessions.ts
   docker exec marketsage-web npx tsx /app/src/scripts/seed-mcp-monitoring-metrics.ts
   ```

### Performance Issues

1. **Slow Response Times**
   ```bash
   # Check container resources
   docker stats marketsage-web
   
   # Check database performance
   docker exec marketsage-db psql -U marketsage -d marketsage -c "
   SELECT query, calls, total_time, total_time/calls as avg_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;"
   ```

2. **Memory Issues**
   ```bash
   # Restart containers if needed
   docker restart marketsage-web marketsage-valkey
   
   # Check memory usage
   docker exec marketsage-web cat /proc/meminfo
   ```

## Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
DATABASE_URL=postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage?schema=public
REDIS_URL=redis://marketsage-valkey:6379
NODE_ENV=production
NEXTAUTH_SECRET=your-nextauth-secret-here
JWT_SECRET=your-jwt-secret-here

# AI Configuration
OPENAI_API_KEY=your-openai-key
SUPREME_AI_MODE=enabled

# Email Configuration (if testing email services)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Volume Mounts

Ensure these volumes are properly mounted:
- `./scripts:/app/scripts`
- `./prisma:/app/prisma`
- `./src:/app/src`
- `postgres-data:/var/lib/postgresql/data`
- `redis_data:/data`

## Automated Testing

### CI/CD Pipeline Testing

```yaml
# Example GitHub Actions workflow
test-mcp-docker:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Run MCP Docker Tests
      run: |
        docker-compose -f docker-compose.prod.yml up -d
        sleep 60
        ./scripts/docker/test-mcp-docker.sh
        docker-compose -f docker-compose.prod.yml down
```

### Continuous Monitoring

```bash
# Set up continuous monitoring
nohup ./scripts/docker/mcp-health-check.sh --monitor > mcp-monitor.log 2>&1 &

# Check monitoring logs
tail -f mcp-monitor.log
```

## Success Criteria

A successful MCP Docker deployment should show:

✅ All containers running and healthy  
✅ Database accessible with MCP tables populated  
✅ Redis/Valkey responding to ping  
✅ All MCP health endpoints returning 200  
✅ Real data in all 4 MCP tables  
✅ Response times < 2 seconds for most operations  
✅ No critical errors in container logs  
✅ Environment variables properly configured  
✅ Volumes mounted and persistent  

## Support

For issues with MCP Docker testing:

1. Check container logs: `docker logs marketsage-web`
2. Verify environment variables: `docker exec marketsage-web printenv`
3. Test database connectivity: `docker exec marketsage-db pg_isready -U marketsage`
4. Run health check: `./scripts/docker/mcp-health-check.sh`
5. Review troubleshooting section above

This testing framework ensures that MarketSage MCP functionality works reliably in containerized environments for production deployment.