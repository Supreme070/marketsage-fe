# MarketSage Deployment Configuration

## Repository Structure

### Frontend Repository (marketsage-frontend)
```
Domain: app.marketsage.com
Admin Domain: admin.marketsage.com
Type: Next.js Application
Database Access: None (API-only)
```

### Backend Repository (marketsage-backend)
```
Domain: api.marketsage.com
Type: NestJS API Server
Port: 3006
Database Access: Direct (PostgreSQL, Redis)
```

### Monitoring Repository (marketsage-monitoring)
```
Domain: monitoring.marketsage.com
Type: Observability Stack
Services: Prometheus, Grafana, Loki, Tempo
```

## Environment Configuration

### Frontend (.env.production)
```env
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.marketsage.com
NEXT_PUBLIC_ADMIN_URL=https://admin.marketsage.com

# Backend Integration
NEXT_PUBLIC_USE_API_ONLY=true
NEXT_PUBLIC_BACKEND_URL=https://api.marketsage.com

# Authentication
NEXTAUTH_URL=https://app.marketsage.com
NEXTAUTH_SECRET=your-production-nextauth-secret

# Admin Configuration
ADMIN_STAFF_EMAILS=admin@marketsage.africa,support@marketsage.africa
ADMIN_STAFF_DOMAINS=marketsage.africa
```

### Backend (.env.production)
```env
# Core Configuration
NODE_ENV=production
PORT=3006

# Database
DATABASE_URL=your-production-postgresql-url
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379

# JWT & Security
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret

# CORS Configuration
CORS_ORIGIN=https://app.marketsage.com,https://admin.marketsage.com

# Monitoring
PROMETHEUS_METRICS_ENABLED=true
GRAFANA_DASHBOARD_URL=https://monitoring.marketsage.com
```

## Deployment Scripts

### Frontend Deployment (Railway/Vercel)
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "never"

[[services]]
name = "marketsage-frontend"

[services.domains]
main = "app.marketsage.com"
admin = "admin.marketsage.com"
```

### Backend Deployment (Railway/AWS)
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/api/v2/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"

[[services]]
name = "marketsage-backend"

[services.domains]
main = "api.marketsage.com"

[services.volumes]
data = "/app/data"
```

## DNS Configuration

### Cloudflare DNS Settings
```
A    app.marketsage.com         -> Frontend IP
A    admin.marketsage.com       -> Frontend IP  
A    api.marketsage.com         -> Backend IP
A    monitoring.marketsage.com  -> Monitoring IP

CNAME www.marketsage.com        -> app.marketsage.com
```

## Load Balancer Configuration

### Frontend Load Balancer
```nginx
upstream frontend {
    server frontend-1:3000;
    server frontend-2:3000;
}

server {
    listen 443 ssl;
    server_name app.marketsage.com admin.marketsage.com;
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Backend Load Balancer
```nginx
upstream backend {
    server backend-1:3006;
    server backend-2:3006;
}

server {
    listen 443 ssl;
    server_name api.marketsage.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Configuration

### PostgreSQL (Managed Service)
```yaml
Provider: Railway PostgreSQL / AWS RDS
Version: PostgreSQL 15+
Connection Pool: 20 connections
SSL: Required
Backup: Daily automated backups
```

### Redis (Managed Service)
```yaml
Provider: Railway Redis / AWS ElastiCache
Version: Redis 7+
Memory: 2GB minimum
Persistence: AOF enabled
Clustering: Single instance (dev), Cluster (prod)
```

## Monitoring Setup

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'frontend'
    static_configs:
      - targets: ['app.marketsage.com:3000']
    metrics_path: '/metrics'
    
  - job_name: 'backend'
    static_configs:
      - targets: ['api.marketsage.com:3006']
    metrics_path: '/api/v2/metrics'
```

### Grafana Dashboards
```yaml
Dashboards:
  - MarketSage Frontend Metrics
  - MarketSage Backend API Performance
  - Database Performance
  - System Resource Usage
  - Business KPI Dashboard
```

## Security Configuration

### SSL/TLS
```yaml
Provider: Cloudflare SSL / Let's Encrypt
Type: Full (strict)
HSTS: Enabled
Certificate Transparency: Enabled
```

### API Security
```yaml
Rate Limiting: 1000 req/min per IP
CORS: Strict origin validation
JWT: RS256 algorithm
Session: Secure, HttpOnly, SameSite
```

## Backup Strategy

### Database Backups
```yaml
Frequency: Daily at 2 AM UTC
Retention: 30 days
Encryption: AES-256
Storage: S3 / Cloud Storage
```

### Application Backups
```yaml
Code: Git repositories (GitHub)
Configuration: Infrastructure as Code
Logs: 7-day retention in monitoring stack
```

## Disaster Recovery

### Recovery Time Objectives (RTO)
```yaml
Frontend: 5 minutes (multiple instances)
Backend API: 10 minutes (auto-scaling)
Database: 30 minutes (managed service)
Full System: 1 hour maximum
```

### Recovery Point Objectives (RPO)
```yaml
Database: 1 hour (continuous replication)
Application State: 5 minutes (session storage)
Files/Assets: 24 hours (daily backups)
```