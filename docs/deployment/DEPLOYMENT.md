# 🚀 LeadPulse Deployment Guide

This guide covers deployment strategies for LeadPulse in various environments, from development to enterprise production.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0+ (LTS recommended)
- **Database**: PostgreSQL 15+ or compatible
- **Cache**: Redis 6+ or Valkey 8+
- **Memory**: Minimum 2GB RAM (4GB+ recommended for production)
- **Storage**: 10GB+ available disk space
- **Network**: HTTPS required for production

### Dependencies
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0",
  "postgresql": ">=15.0",
  "redis": ">=6.0"
}
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Next.js App   │────│   PostgreSQL    │
│   (Nginx/ALB)   │    │   (Multiple)    │    │   (Primary)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         └──────────────│   Redis Cache   │    │ PostgreSQL Read │
                        │   (Cluster)     │    │   Replicas      │
                        └─────────────────┘    └─────────────────┘
```

## 🔧 Environment Configuration

### Environment Variables

#### Core Application
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/marketsage"
DATABASE_REPLICA_URL="postgresql://user:password@replica:5432/marketsage" # Optional

# Cache
REDIS_URL="redis://host:6379"
REDIS_CLUSTER_URLS="redis://node1:6379,redis://node2:6379,redis://node3:6379" # Optional

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://yourdomain.com"

# Security
ENCRYPTION_KEY="your-aes-256-encryption-key" # 32 bytes base64 encoded
JWT_SECRET="your-jwt-secret-key"

# Application
NODE_ENV="production"
PORT="3000"
NEXT_TELEMETRY_DISABLED="1"
```

#### LeadPulse Specific
```bash
# Tracking
LEADPULSE_TRACKING_DOMAIN="yourdomain.com"
LEADPULSE_CDN_URL="https://cdn.yourdomain.com" # Optional

# AI Features
OPENAI_API_KEY="sk-your-openai-key"
OPENAI_ORG_ID="org-your-organization-id" # Optional

# Integrations
SALESFORCE_CLIENT_ID="your-salesforce-client-id"
SALESFORCE_CLIENT_SECRET="your-salesforce-client-secret"
HUBSPOT_API_KEY="your-hubspot-api-key"

# Email/SMS
SENDGRID_API_KEY="SG.your-sendgrid-key"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id" # Optional
DATADOG_API_KEY="your-datadog-api-key" # Optional
```

#### File Storage (Choose one)
```bash
# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT="your-storage-account"
AZURE_STORAGE_KEY="your-storage-key"
AZURE_STORAGE_CONTAINER="your-container"
```

## 🐳 Docker Deployment

### Single Node Deployment

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    image: marketsage:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://marketsage:${DB_PASSWORD}@postgres:5432/marketsage
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    networks:
      - marketsage

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: marketsage
      POSTGRES_USER: marketsage
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--data-checksums"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/postgres-init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U marketsage -d marketsage"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - marketsage
    ports:
      - "5432:5432" # Remove in production

  redis:
    image: valkey/valkey:8-alpine
    command: >
      valkey-server
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    networks:
      - marketsage
    ports:
      - "6379:6379" # Remove in production

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./static:/var/www/static
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - marketsage

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  marketsage:
    driver: bridge
```

#### Dockerfile
```dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=tracking:10m rate=100r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Static files
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # LeadPulse tracking endpoints (higher rate limit)
        location /api/leadpulse/visitors {
            limit_req zone=tracking burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints (standard rate limit)
        location /api/ {
            limit_req zone=api burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Deployment Commands
```bash
# Create environment file
cp .env.example .env.production
# Edit .env.production with your values

# Build and start services
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Check service health
docker-compose ps
docker-compose logs app
```

## ☸️ Kubernetes Deployment

### Namespace and ConfigMap
```yaml
# namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: leadpulse
---
# configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: leadpulse-config
  namespace: leadpulse
data:
  NODE_ENV: "production"
  PORT: "3000"
  NEXT_TELEMETRY_DISABLED: "1"
  LEADPULSE_TRACKING_DOMAIN: "yourdomain.com"
```

### Secrets
```yaml
# secrets.yml
apiVersion: v1
kind: Secret
metadata:
  name: leadpulse-secrets
  namespace: leadpulse
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres:5432/marketsage"
  REDIS_URL: "redis://redis:6379"
  NEXTAUTH_SECRET: "your-super-secret-key"
  NEXTAUTH_URL: "https://yourdomain.com"
  OPENAI_API_KEY: "sk-your-openai-key"
```

### PostgreSQL Deployment
```yaml
# postgres.yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: leadpulse
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: marketsage
        - name: POSTGRES_USER
          value: marketsage
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - marketsage
            - -d
            - marketsage
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: leadpulse
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### Redis Deployment
```yaml
# redis.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: leadpulse
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: valkey/valkey:8-alpine
        args:
        - valkey-server
        - --appendonly
        - "yes"
        - --maxmemory
        - "512mb"
        - --maxmemory-policy
        - allkeys-lru
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "512Mi"
            cpu: "200m"
        livenessProbe:
          exec:
            command:
            - valkey-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: leadpulse
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: leadpulse
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### Application Deployment
```yaml
# app.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: leadpulse-app
  namespace: leadpulse
spec:
  replicas: 3
  selector:
    matchLabels:
      app: leadpulse-app
  template:
    metadata:
      labels:
        app: leadpulse-app
    spec:
      initContainers:
      - name: migration
        image: marketsage:latest
        command: ["npx", "prisma", "migrate", "deploy"]
        envFrom:
        - configMapRef:
            name: leadpulse-config
        - secretRef:
            name: leadpulse-secrets
      containers:
      - name: app
        image: marketsage:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: leadpulse-config
        - secretRef:
            name: leadpulse-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "200m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: leadpulse-app
  namespace: leadpulse
spec:
  selector:
    app: leadpulse-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress
```yaml
# ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: leadpulse-ingress
  namespace: leadpulse
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: leadpulse-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: leadpulse-app
            port:
              number: 80
```

## ☁️ Cloud Provider Deployments

### AWS (ECS + RDS + ElastiCache)

#### Task Definition
```json
{
  "family": "leadpulse-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "leadpulse-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/marketsage:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        },
        {
          "name": "REDIS_URL", 
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/leadpulse-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### CloudFormation Template
```yaml
# infrastructure.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'LeadPulse AWS Infrastructure'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
  DomainName:
    Type: String
    Default: yourdomain.com

Resources:
  # RDS PostgreSQL
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for LeadPulse database
      SubnetIds: !Ref SubnetIds

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: leadpulse-db
      DBInstanceClass: db.t3.medium
      Engine: postgres
      EngineVersion: '15.4'
      MasterUsername: marketsage
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 100
      StorageType: gp2
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      StorageEncrypted: true

  # ElastiCache Redis
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for LeadPulse cache
      SubnetIds: !Ref SubnetIds

  RedisCluster:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: leadpulse-redis
      Description: LeadPulse Redis cluster
      NumCacheClusters: 2
      Engine: redis
      CacheNodeType: cache.t3.micro
      SecurityGroupIds:
        - !Ref CacheSecurityGroup
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: leadpulse-cluster
      CapacityProviders:
        - FARGATE
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: leadpulse-alb
      Scheme: internet-facing
      Type: application
      Subnets: !Ref SubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup

  # Auto Scaling
  AutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService}'
      ScalableDimension: ecs:service:DesiredCount
      MinCapacity: 2
      MaxCapacity: 10

  AutoScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: leadpulse-scaling-policy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
```

### Google Cloud Platform (Cloud Run + Cloud SQL)

#### cloud-run.yml
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: leadpulse-app
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/vpc-access-connector: leadpulse-connector
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/leadpulse:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-url
              key: url
        resources:
          limits:
            cpu: 2000m
            memory: 4Gi
          requests:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        startupProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 30
```

#### Terraform Configuration
```hcl
# main.tf
provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "leadpulse_db" {
  name             = "leadpulse-db"
  database_version = "POSTGRES_15"
  region          = var.region

  settings {
    tier = "db-f1-micro"
    
    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }

  deletion_protection = true
}

# Memorystore Redis
resource "google_redis_instance" "leadpulse_cache" {
  name           = "leadpulse-cache"
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  region         = var.region
  
  authorized_network = google_compute_network.vpc.id
  redis_version      = "REDIS_6_X"
}

# Cloud Run Service
resource "google_cloud_run_service" "leadpulse_app" {
  name     = "leadpulse-app"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/leadpulse:latest"
        
        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.app_user.name}:${google_sql_user.app_user.password}@${google_sql_database_instance.leadpulse_db.private_ip_address}:5432/${google_sql_database.leadpulse.name}"
        }
        
        env {
          name  = "REDIS_URL"
          value = "redis://${google_redis_instance.leadpulse_cache.host}:6379"
        }

        resources {
          limits = {
            cpu    = "2000m"
            memory = "4Gi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

### Azure (Container Apps + PostgreSQL + Redis)

#### container-app.yml
```yaml
# container-app.yml
apiVersion: app.containers.azure.com/v1beta2
kind: ContainerApp
metadata:
  name: leadpulse-app
spec:
  environmentId: /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments/{environment}
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 3000
      traffic:
      - weight: 100
        latestRevision: true
    secrets:
    - name: database-url
      value: postgresql://user:pass@host:5432/db
    - name: redis-url
      value: redis://host:6379
  template:
    containers:
    - name: leadpulse-app
      image: your-registry.azurecr.io/leadpulse:latest
      env:
      - name: NODE_ENV
        value: production
      - name: DATABASE_URL
        secretRef: database-url
      - name: REDIS_URL
        secretRef: redis-url
      resources:
        cpu: 1.0
        memory: 2Gi
      probes:
      - type: Liveness
        httpGet:
          path: /api/health
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
    scale:
      minReplicas: 2
      maxReplicas: 10
      rules:
      - name: http-scaler
        http:
          metadata:
            concurrentRequests: 50
```

## 📊 Monitoring Integration

### Prometheus Metrics
Add to your existing Prometheus configuration:

```yaml
# prometheus.yml (add to scrape_configs)
scrape_configs:
  - job_name: 'leadpulse-app'
    static_configs:
      - targets: ['leadpulse-app:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s
```

### Application Metrics Endpoint
```typescript
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import promClient from 'prom-client';

// Create metrics registry
const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom LeadPulse metrics
const visitorCounter = new promClient.Counter({
  name: 'leadpulse_visitors_total',
  help: 'Total number of visitors tracked',
  labelNames: ['device', 'country'],
  registers: [register]
});

const formSubmissionCounter = new promClient.Counter({
  name: 'leadpulse_form_submissions_total', 
  help: 'Total number of form submissions',
  labelNames: ['form_id', 'form_name'],
  registers: [register]
});

const apiRequestDuration = new promClient.Histogram({
  name: 'leadpulse_api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}
```

### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      ai: 'unknown'
    }
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // Redis check
    await redis.ping();
    checks.services.redis = 'healthy';
  } catch (error) {
    checks.services.redis = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // AI service check (if configured)
    if (process.env.OPENAI_API_KEY) {
      // Quick API test
      checks.services.ai = 'healthy';
    } else {
      checks.services.ai = 'not_configured';
    }
  } catch (error) {
    checks.services.ai = 'unhealthy';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

## 🔐 Security Considerations

### SSL/TLS Configuration
- **Minimum TLS 1.2** for all connections
- **Perfect Forward Secrecy** with ECDHE ciphers
- **HSTS headers** for secure transport
- **Certificate pinning** for mobile apps

### Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp   # PostgreSQL (internal only)
ufw deny 6379/tcp   # Redis (internal only)
```

### Environment Secrets
- Use **secret management** systems (AWS Secrets Manager, Azure Key Vault, etc.)
- **Rotate secrets** regularly
- **Never commit** secrets to version control
- Use **least privilege** access policies

## 📈 Performance Optimization

### Database Optimization
```sql
-- Essential indexes for LeadPulse
CREATE INDEX CONCURRENTLY idx_leadpulse_visitors_fingerprint 
ON "LeadPulseVisitor" (fingerprint);

CREATE INDEX CONCURRENTLY idx_leadpulse_visitors_created_at 
ON "LeadPulseVisitor" (created_at DESC);

CREATE INDEX CONCURRENTLY idx_leadpulse_touchpoints_visitor_id 
ON "LeadPulseTouchpoint" (visitor_id, created_at DESC);

-- Partitioning for large tables
CREATE TABLE "LeadPulseTouchpoint_202501" 
PARTITION OF "LeadPulseTouchpoint" 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Redis Configuration
```conf
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
tcp-keepalive 300
timeout 0
```

### CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.yourdomain.com'],
  },
  async headers() {
    return [
      {
        source: '/js/leadpulse-tracker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## 🚨 Disaster Recovery

### Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Redis backup
redis-cli --rdb /backup/dump.rdb

# Application files backup
tar -czf app-backup-$(date +%Y%m%d).tar.gz /app/uploads
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
echo "Starting database backup..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Redis backup
echo "Starting Redis backup..."
redis-cli --rdb "$BACKUP_DIR/redis_backup_$DATE.rdb"

# Upload to cloud storage
echo "Uploading to cloud storage..."
aws s3 cp "$BACKUP_DIR/" s3://your-backup-bucket/leadpulse/ --recursive --exclude "*" --include "*$DATE*"

# Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed successfully"
```

### Recovery Procedures
```bash
# Database recovery
gunzip -c backup-20250624.sql.gz | psql $DATABASE_URL

# Redis recovery
cp backup-20250624.rdb /var/lib/redis/dump.rdb
systemctl restart redis

# Application recovery
tar -xzf app-backup-20250624.tar.gz -C /
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Load testing completed
- [ ] Security scan passed

### Deployment
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] CDN configuration updated
- [ ] DNS records updated
- [ ] SSL certificate validated

### Post-deployment
- [ ] Application monitoring active
- [ ] Performance metrics baseline
- [ ] Error tracking configured
- [ ] Backup verification
- [ ] Security headers validated
- [ ] API endpoints tested
- [ ] Real-time features working

---

## 📞 Support

For deployment assistance:
- **Documentation**: See `/docs/` directory
- **Issues**: GitHub Issues for bugs and questions
- **Enterprise**: Contact support@marketsage.africa

---

*Last updated: 2025-06-24*