# MarketSage New Architecture Overview

## 🏗️ Architecture Transformation: Monolith to Microservices

### Current State (Monolithic)
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Frontend (React)                   │   │
│  │  • Pages (App Router)                               │   │
│  │  • Components                                       │   │
│  │  • Admin Portal                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 API Routes (/api/*)                  │   │
│  │  • Authentication  • Campaigns  • AI Chat           │   │
│  │  • Email/SMS/WA   • LeadPulse  • Workflows        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Direct Database Access                  │   │
│  │                  (Prisma ORM)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   (Single DB)    │
                    └──────────────────┘
```

### Target State (Microservices)
```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Repository                         │
│                  (marketsage-frontend)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js Pure Frontend                   │   │
│  │  • Main App (app.marketsage.com)                   │   │
│  │  • Admin Portal (admin.marketsage.com)             │   │
│  │  • Components & UI                                  │   │
│  │  • NO Database Access                               │   │
│  │  • NO Business Logic                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ API Calls Only                    │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           API Gateway (Next.js Proxy)                │   │
│  │  • /api/v2/* → NestJS Backend                      │   │
│  │  • /api/* → Legacy (temporary)                     │   │
│  │  • Rate Limiting                                    │   │
│  │  • CORS Management                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Repository                          │
│                 (marketsage-backend)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NestJS API Server                       │   │
│  │                 (Port 3006)                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │    Auth      │  │   Campaigns  │  │    AI    │  │   │
│  │  │   Module     │  │    Module    │  │  Module  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │   Email/     │  │  LeadPulse   │  │ Workflow │  │   │
│  │  │   SMS/WA     │  │   Module     │  │  Module  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │  ┌─────────────────────────────────────────────────┐│   │
│  │  │          Shared Services Layer                   ││   │
│  │  │  • Database (Prisma)  • Redis    • Monitoring   ││   │
│  │  │  • Queue (Bull)       • Storage  • Logging      ││   │
│  │  └─────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────┬──────────────┬──────────────┐
        │ PostgreSQL   │    Redis     │  S3 Storage  │
        │  (Shared)    │   (Cache)    │   (Files)    │
        └──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Monitoring Repository                       │
│                (marketsage-monitoring)                      │
│  • Prometheus (Metrics)      • Grafana (Dashboards)        │
│  • Loki (Logs)              • Tempo (Traces)              │
│  • Alertmanager             • Business Metrics             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Detailed Component Breakdown

### 1. Frontend Application (marketsage-frontend)
```
marketsage-frontend/
├── app/                        # Next.js App Router
│   ├── (marketing)/           # Public pages
│   ├── (dashboard)/           # Main app UI
│   ├── (auth)/               # Auth pages
│   └── admin/                # Admin subdomain
├── components/                # Shared components
├── lib/                      # Frontend utilities
│   ├── api-client.ts        # API communication
│   ├── auth-client.ts       # Auth helpers
│   └── utils/               # UI utilities
├── middleware.ts             # Subdomain routing
└── next.config.js           # Build configuration
```

**Key Characteristics:**
- ✅ Pure frontend - NO database connections
- ✅ All data via API calls to backend
- ✅ Subdomain routing for admin portal
- ✅ Static generation where possible
- ✅ Client-side state management

### 2. Backend API (marketsage-backend)
```
marketsage-backend/
├── src/
│   ├── auth/                 # Authentication module
│   ├── campaigns/           # Campaign management
│   ├── contacts/            # Contact management
│   ├── ai/                  # AI services
│   ├── messaging/           # Email/SMS/WhatsApp
│   ├── leadpulse/          # Visitor tracking
│   ├── workflows/          # Automation engine
│   ├── admin/              # Admin APIs
│   ├── shared/             # Shared services
│   └── common/             # Common utilities
├── prisma/                 # Database schema
└── test/                   # Test suites
```

**Key Characteristics:**
- ✅ Single source of truth for business logic
- ✅ All database access happens here
- ✅ Modular architecture with NestJS
- ✅ Independent deployment
- ✅ Horizontal scalability

### 3. Communication Flow
```
User Request Flow:
─────────────────

1. Browser → app.marketsage.com
2. Next.js Frontend serves UI
3. UI makes API call → /api/v2/campaigns
4. Next.js proxy forwards → NestJS:3006/api/v2/campaigns
5. NestJS processes request
6. NestJS queries PostgreSQL/Redis
7. Response flows back through proxy
8. UI updates with data

Admin Request Flow:
──────────────────

1. Browser → admin.marketsage.com
2. Next.js middleware detects subdomain
3. Serves admin-specific UI
4. Enhanced auth check via API
5. Admin API calls → /api/v2/admin/*
6. Same backend, different permissions
```

## 🔒 Security Architecture

### API Gateway Layer (Next.js)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  
  // Subdomain routing
  if (hostname?.startsWith('admin.')) {
    return NextResponse.rewrite(
      new URL(`/admin${request.nextUrl.pathname}`, request.url)
    )
  }
  
  // API proxy with security headers
  if (request.nextUrl.pathname.startsWith('/api/v2')) {
    const headers = new Headers(request.headers)
    headers.set('X-Forwarded-For', request.ip || 'unknown')
    headers.set('X-Request-ID', crypto.randomUUID())
    
    return NextResponse.rewrite(
      new URL(`http://localhost:3006${request.nextUrl.pathname}`, request.url),
      { headers }
    )
  }
}
```

### Backend Security (NestJS)
```typescript
// Security stack in NestJS
@Module({
  imports: [
    // Authentication
    AuthModule,
    
    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    
    // CORS
    CorsModule,
    
    // Helmet for security headers
    HelmetModule,
  ],
})
export class AppModule {}
```

## 🚀 Deployment Architecture

### Development Environment
```yaml
# Local development setup
Frontend:    http://localhost:3000
Backend:     http://localhost:3006
Admin:       http://admin.localhost:3000
Monitoring:  http://localhost:3002 (Grafana)

# Docker networks
- marketsage_default (frontend + backend)
- monitoring (observability stack)
```

### Production Environment
```yaml
# Production deployment
Frontend:
  - Vercel/Railway (app.marketsage.com)
  - Edge functions for API proxy
  - Global CDN distribution

Backend:
  - Railway/AWS ECS (api.marketsage.com)
  - Auto-scaling groups
  - Load balancer with health checks

Database:
  - Managed PostgreSQL (Railway/AWS RDS)
  - Read replicas for scaling
  - Automated backups

Cache:
  - Redis cluster (Railway/AWS ElastiCache)
  - Session storage
  - API response caching
```

## 📈 Monitoring & Observability

### Metrics Collection
```
Frontend Metrics → Next.js → Prometheus
                    ↓
Backend Metrics → NestJS → Prometheus
                    ↓
                 Grafana
                    ↓
            Unified Dashboards
```

### Key Dashboards
1. **Business Overview**: KPIs, revenue, users
2. **System Health**: CPU, memory, errors
3. **API Performance**: Latency, throughput
4. **User Journey**: Conversion funnels
5. **Microservices Map**: Service dependencies

## 🔄 Migration Strategy

### Phase 1: Backend Separation (Current)
- ✅ Create NestJS backend
- ✅ Implement core APIs
- ✅ Proxy configuration
- ✅ Parallel testing
- 🔄 Gradual traffic migration

### Phase 2: Database Separation
- Logical schemas per domain
- Event sourcing for sync
- Read/write splitting
- Service-specific views

### Phase 3: Full Microservices
- Independent services
- Service mesh (Istio)
- Distributed tracing
- Circuit breakers

## 💡 Benefits of New Architecture

### 1. **Scalability**
- Frontend and backend scale independently
- Horizontal scaling for high load
- CDN distribution for global reach

### 2. **Development Velocity**
- Teams work independently
- Clear API contracts
- Faster deployments
- Better testing

### 3. **Security**
- No direct DB access from frontend
- API-level authentication
- Rate limiting at gateway
- Audit logging

### 4. **Maintainability**
- Clear separation of concerns
- Modular codebase
- Easier debugging
- Better monitoring

### 5. **Performance**
- Optimized frontend bundles
- API response caching
- Database connection pooling
- Background job processing

## 🎯 Next Steps

1. **Complete Phase 1 Migration**
   - Migrate remaining endpoints
   - Implement caching layer
   - Add distributed tracing

2. **Repository Separation**
   - Create separate Git repos
   - Set up CI/CD pipelines
   - Document workflows

3. **Enhanced Monitoring**
   - Service mesh observability
   - Business metrics tracking
   - SLA monitoring

4. **Production Readiness**
   - Load testing
   - Disaster recovery
   - Documentation
   - Team training