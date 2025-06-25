# 📊 LeadPulse Documentation

> **Enterprise-grade visitor intelligence and lead capture platform**

LeadPulse is a comprehensive solution for tracking, analyzing, and converting website visitors into qualified leads through real-time analytics, dynamic forms, and AI-powered insights.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 15+
- Redis/Valkey 6+
- Docker (recommended for development)

### Installation

1. **Clone and setup**
```bash
git clone https://github.com/your-org/marketsage.git
cd marketsage
npm install
```

2. **Environment configuration**
```bash
cp .env.example .env.local
# Edit .env.local with your database and API keys
```

3. **Database setup**
```bash
npx prisma migrate deploy
npx prisma db seed
```

4. **Start development server**
```bash
npm run dev
```

5. **Access LeadPulse**
- Dashboard: http://localhost:3000/dashboard/leadpulse
- API: http://localhost:3000/api/leadpulse
- Swagger Docs: http://localhost:3000/api-docs

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Features](#core-features)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Integration Guide](#integration-guide)
- [Testing Guide](#testing-guide)
- [Monitoring & Observability](#monitoring--observability)
- [Security & Compliance](#security--compliance)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

LeadPulse follows a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client SDKs   │───▶│   Next.js API   │───▶│   PostgreSQL    │
│ (Web/Mobile)    │    │    Routes       │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         └─────────────▶│   WebSocket     │    │   Redis Cache   │
                        │    Server       │    │   & Sessions    │
                        └─────────────────┘    └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   AI/ML Engine  │
                        │  (Intelligence) │
                        └─────────────────┘
```

### Key Components

- **Tracking Engine**: Real-time visitor behavior capture
- **Form Builder**: Dynamic form creation and management
- **Analytics Engine**: Comprehensive data analysis and reporting
- **AI Intelligence**: Machine learning insights and predictions
- **Integration Layer**: CRM connectors and external APIs
- **Security Framework**: GDPR compliance and data protection

## ⭐ Core Features

### 1. Visitor Intelligence
- **Real-time tracking** with browser fingerprinting
- **Engagement scoring** based on behavioral patterns
- **Multi-platform support** (Web, React Native, Mobile Apps)
- **Geographic analysis** with timezone awareness
- **Device and browser analytics**
- **Session management** with configurable timeouts

### 2. Dynamic Form Builder
- **12+ field types** with advanced validation
- **Conditional logic** and multi-step workflows
- **Custom styling** and branding options
- **Embed generation** for any website
- **Real-time analytics** and conversion tracking
- **Auto-responder** and notification system

### 3. Real-time Analytics
- **Live visitor feed** with WebSocket updates
- **Conversion funnel** analysis
- **Heatmap generation** and interaction tracking
- **Performance metrics** and KPI dashboards
- **Export capabilities** (CSV, PDF, API)

### 4. AI-Powered Insights
- **Predictive lead scoring** with ML models
- **Intent analysis** and behavior prediction
- **Churn risk assessment** 
- **Smart segmentation** and personalization
- **Automated recommendations** for optimization

### 5. Enterprise Integrations
- **CRM connectors** (Salesforce, HubSpot, Pipedrive)
- **Multi-channel alerting** (Email, Slack, Teams, SMS)
- **Webhook system** with retry logic and security
- **API-first architecture** for custom integrations

### 6. Security & Compliance
- **GDPR compliant** with consent management
- **Data encryption** (AES-256-GCM)
- **Audit logging** and security monitoring
- **Rate limiting** and DDoS protection
- **PII detection** and automatic masking

## 📚 API Documentation

### OpenAPI Specification
Complete API documentation is available in OpenAPI 3.0 format:
- **File**: `/docs/api/openapi.yaml`
- **Interactive Docs**: http://localhost:3000/api-docs
- **Postman Collection**: `/docs/api/LeadPulse.postman_collection.json`

### Core Endpoints

#### Visitor Tracking
```http
POST /api/leadpulse/visitors
GET  /api/leadpulse/visitors
GET  /api/leadpulse/analytics
```

#### Form Management
```http
POST /api/leadpulse/forms
GET  /api/leadpulse/forms
PUT  /api/leadpulse/forms/{id}
POST /api/leadpulse/forms/{id}/submit
```

#### CRM Integration
```http
GET  /api/leadpulse/integrations/crm
POST /api/leadpulse/integrations/crm
```

#### AI Intelligence
```http
POST /api/leadpulse/ai/intelligence
```

### Authentication
LeadPulse uses Next-Auth for session management:
- **Session cookies** for dashboard access
- **API keys** for service-to-service communication
- **Rate limiting** per user/IP

## 🚀 Deployment Guide

### Production Deployment

#### 1. Environment Setup
```bash
# Required environment variables
DATABASE_URL="postgresql://user:pass@host:5432/database"
REDIS_URL="redis://host:6379"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Optional integrations
OPENAI_API_KEY="sk-..."
SALESFORCE_CLIENT_ID="..."
HUBSPOT_API_KEY="..."
```

#### 2. Docker Deployment (Recommended)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: marketsage:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: marketsage
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: valkey/valkey:8-alpine
    volumes:
      - redis_data:/data
```

#### 3. Kubernetes Deployment
See `/docs/deployment/kubernetes/` for complete K8s manifests.

#### 4. Cloud Providers
- **Vercel**: Native Next.js deployment with edge functions
- **AWS**: ECS/EKS with RDS and ElastiCache
- **Google Cloud**: Cloud Run with Cloud SQL and Memorystore
- **Azure**: Container Apps with Azure Database and Redis

### Scaling Considerations

- **Database**: Read replicas for analytics queries
- **Redis**: Cluster mode for high availability
- **CDN**: Static assets and global distribution
- **Load Balancer**: Multiple app instances with session affinity

## 🔗 Integration Guide

### Website Integration

#### Basic JavaScript Tracking
```html
<!-- Add to your website's <head> -->
<script>
window.leadpulseConfig = {
  apiEndpoint: 'https://yourdomain.com/api/leadpulse',
  trackingId: 'your-tracking-id',
  debug: false
};
</script>
<script src="https://yourdomain.com/js/leadpulse-tracker.js" async></script>
```

#### React/Next.js Integration
```tsx
// components/LeadPulseTracker.tsx
'use client';
import { useEffect } from 'react';

export default function LeadPulseTracker() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/js/leadpulse-tracker.js';
    script.async = true;
    script.onload = () => {
      if (window.LeadPulseTracker) {
        new window.LeadPulseTracker({
          apiEndpoint: '/api/leadpulse',
          trackingId: process.env.NEXT_PUBLIC_LEADPULSE_ID
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
```

### Mobile App Integration

#### React Native
```typescript
import { LeadPulseReactNative } from './lib/leadpulse-mobile-sdk';

const tracker = new LeadPulseReactNative({
  apiEndpoint: 'https://yourdomain.com',
  appId: 'your-app-id'
});

// Initialize tracking
await tracker.initializeWithDeviceInfo();

// Track events
tracker.trackScreenView('Home');
tracker.trackEvent('button_click', { button: 'signup' });
```

#### iOS (Swift)
```swift
import LeadPulseSDK

LeadPulse.configure(
    apiEndpoint: "https://yourdomain.com",
    appId: "your-app-id"
)

LeadPulse.trackScreenView("HomeViewController")
```

#### Android (Kotlin)
```kotlin
import com.marketsage.leadpulse.LeadPulse

LeadPulse.configure(
    apiEndpoint = "https://yourdomain.com",
    appId = "your-app-id"
)

LeadPulse.trackScreenView("MainActivity")
```

### Form Embedding

#### Generated Embed Code
```html
<!-- Generated from LeadPulse dashboard -->
<div id="leadpulse-form-container"></div>
<script>
(function() {
  const formId = 'your-form-id';
  const script = document.createElement('script');
  script.src = `https://yourdomain.com/embed/form/${formId}.js`;
  document.head.appendChild(script);
})();
</script>
```

#### Custom Form Integration
```typescript
// POST to form submission endpoint
const response = await fetch('/api/leadpulse/forms/form-id/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    metadata: {
      visitorId: 'visitor-id',
      url: window.location.href
    }
  })
});
```

## 🧪 Testing Guide

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Manual Testing Checklist

#### Basic Functionality
- [ ] Visitor tracking on test website
- [ ] Form creation and submission
- [ ] Real-time dashboard updates
- [ ] Analytics data accuracy

#### Integration Testing
- [ ] CRM connector authentication
- [ ] Webhook delivery and retry
- [ ] Email/SMS notifications
- [ ] API rate limiting

#### Performance Testing
- [ ] High-volume visitor tracking
- [ ] Concurrent form submissions
- [ ] Dashboard responsiveness
- [ ] Database query performance

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run docs/testing/load-tests/visitor-tracking.yml
artillery run docs/testing/load-tests/form-submission.yml
```

## 📊 Monitoring & Observability

### Existing Infrastructure
Your monitoring stack is already configured with:

- **Grafana** (Port 3000) - Dashboards and visualization
- **Prometheus** (Port 9090) - Metrics collection
- **Loki** (Port 3100) - Log aggregation
- **AlertManager** (Port 9093) - Alert routing
- **Node Exporter** (Port 9100) - System metrics
- **cAdvisor** (Port 8080) - Container metrics
- **Redis Exporter** (Port 9121) - Redis metrics
- **Postgres Exporter** (Port 9187) - Database metrics

### LeadPulse Integration

#### Custom Metrics
Add LeadPulse-specific metrics to your Prometheus config:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'leadpulse-app'
    static_configs:
      - targets: ['marketsage-web:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
```

#### Grafana Dashboards
Import pre-built dashboards:
- **LeadPulse Overview**: `/docs/monitoring/grafana/leadpulse-overview.json`
- **Visitor Analytics**: `/docs/monitoring/grafana/visitor-analytics.json`
- **Form Performance**: `/docs/monitoring/grafana/form-performance.json`

#### Application Metrics
LeadPulse exposes these custom metrics:
```
# Visitor tracking
leadpulse_visitors_total
leadpulse_visitor_sessions_duration
leadpulse_visitor_engagement_score

# Form analytics  
leadpulse_forms_submissions_total
leadpulse_forms_conversion_rate
leadpulse_forms_completion_time

# API performance
leadpulse_api_requests_total
leadpulse_api_request_duration
leadpulse_api_errors_total

# Integration health
leadpulse_crm_sync_success_rate
leadpulse_webhook_delivery_rate
leadpulse_cache_hit_rate
```

#### Alerting Rules
Key alerts to configure:
```yaml
# alerts.yml
groups:
  - name: leadpulse
    rules:
      - alert: HighVisitorTrackingErrors
        expr: rate(leadpulse_api_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in visitor tracking"
          
      - alert: FormSubmissionFailures
        expr: rate(leadpulse_forms_submission_errors_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Form submissions failing"
          
      - alert: CRMSyncDown
        expr: leadpulse_crm_sync_success_rate < 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CRM synchronization degraded"
```

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/health

# Database health  
curl http://localhost:3000/api/health/database

# Redis health
curl http://localhost:3000/api/health/redis

# External integrations
curl http://localhost:3000/api/health/integrations
```

## 🔒 Security & Compliance

### GDPR Compliance
- **Consent Management**: Granular consent tracking
- **Data Subject Rights**: Access, rectification, erasure, portability
- **Data Retention**: Automated cleanup policies
- **Audit Logging**: Complete data processing history
- **Privacy by Design**: Built-in data protection

### Security Features
- **Input Validation**: XSS and SQL injection protection
- **Rate Limiting**: DDoS protection and abuse prevention
- **Data Encryption**: AES-256-GCM for sensitive data
- **Secure Headers**: HSTS, CSP, and security policies
- **Vulnerability Scanning**: Regular security assessments

### Compliance APIs
```typescript
// GDPR data access request
const data = await fetch('/api/leadpulse/gdpr/access', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' })
});

// Data erasure request
const result = await fetch('/api/leadpulse/gdpr/erasure', {
  method: 'POST', 
  body: JSON.stringify({ email: 'user@example.com' })
});
```

## 🔧 Troubleshooting

### Common Issues

#### Tracking Not Working
1. Check browser console for JavaScript errors
2. Verify API endpoint URLs are correct
3. Ensure CORS is properly configured
4. Check network tab for failed requests

#### Real-time Updates Missing
1. Verify WebSocket connection in browser
2. Check if Socket.IO is initialized
3. Ensure firewall allows WebSocket connections
4. Review server logs for connection errors

#### Form Submissions Failing
1. Validate form embed code implementation
2. Check form field validation rules
3. Verify API endpoints are accessible
4. Review server logs for processing errors

#### CRM Integration Issues
1. Verify API credentials are correct
2. Check rate limiting and quota usage
3. Review integration logs for sync errors
4. Test connection using test endpoints

### Debug Mode
Enable debug logging:
```javascript
// Client-side tracking
window.leadpulseConfig = {
  debug: true,
  // ... other config
};

// Server-side (environment variable)
DEBUG=leadpulse:* npm run dev
```

### Log Analysis
```bash
# View application logs
docker logs marketsage-web

# Search for specific patterns
docker logs marketsage-web | grep "ERROR"
docker logs marketsage-web | grep "leadpulse"

# Real-time log monitoring
docker logs -f marketsage-web
```

### Performance Diagnostics
```bash
# Database performance
npx prisma studio

# Redis performance
redis-cli --latency-history

# Application metrics
curl http://localhost:3000/api/metrics
```

## 📞 Support

### Documentation
- **API Reference**: `/docs/api/`
- **Integration Guides**: `/docs/integrations/`
- **Deployment Guides**: `/docs/deployment/`

### Community
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-org/marketsage/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/your-org/marketsage/discussions)

### Enterprise Support
- **Email**: support@marketsage.africa
- **Documentation**: Enterprise customers receive priority support
- **SLA**: 99.9% uptime guarantee with 24/7 monitoring

---

## 📄 License

LeadPulse is proprietary software. See [LICENSE](../LICENSE) for terms and conditions.

---

*Last updated: 2025-06-24*