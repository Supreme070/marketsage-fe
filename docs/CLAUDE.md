# claude.md - MarketSage Complete Project Guide

## 📘 **Project Overview**

**MarketSage** is a sophisticated marketing automation and intelligence platform specifically designed for the Nigerian and African market. It combines traditional marketing automation with advanced AI-powered analytics, visitor intelligence, and predictive capabilities to provide comprehensive customer engagement and business intelligence solutions.

### Purpose
- **Primary Mission**: Multi-channel marketing automation (Email, SMS, WhatsApp) tailored for African businesses
- **Unique Value**: Advanced AI intelligence with behavioral analytics, visitor tracking, and predictive capabilities
- **Market Focus**: Nigerian and African enterprises seeking sophisticated marketing automation with local market understanding

### Target Users
- Nigerian and African enterprises
- Marketing teams requiring multi-channel automation
- Businesses needing customer intelligence and predictive analytics
- Companies seeking GDPR-compliant marketing solutions

### Key Problems Solved
- Unified multi-channel marketing automation across Email, SMS, and WhatsApp
- Advanced visitor tracking and behavioral analytics (LeadPulse)
- Predictive customer intelligence (churn prediction, LTV, etc.)
- African market-specific integrations and compliance
- Real-time customer journey mapping and optimization

---

## 🧱 **Tech Stack**

### Frontend
- **Next.js 15+** with App Router for modern React development
- **TypeScript** for type safety and developer experience
- **Tailwind CSS** with custom design system and animations
- **shadcn/ui** components for consistent UI patterns
- **React Query** for state management and data fetching
- **Framer Motion** for animations and interactions

### Backend
- **Next.js API Routes** for serverless backend functionality
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js** for authentication and session management
- **Redis** for caching and session management
- **OpenTelemetry** for observability and monitoring

### AI & Intelligence
- **Custom ML Models** for predictive analytics and behavioral scoring
- **Natural Language Processing** for content analysis and sentiment detection
- **Real-time Analytics Engine** for visitor tracking and engagement measurement
- **Supreme-AI v3** - Multi-modal AI orchestration engine

### External Integrations
- **African SMS Providers**: AfricasTalking, Termii, Twilio
- **WhatsApp Business API** for enterprise messaging
- **Paystack** for payment processing and subscription management
- **Email Services** with domain verification and deliverability optimization

### DevOps & Monitoring
- **Docker** with multi-stage builds for containerization
- **Prometheus + Grafana + Loki + Tempo** for complete observability
- **GitHub Actions** for CI/CD automation
- **Enterprise-grade monitoring** with 15 specialized dashboards

---

## 🗂️ **File & Directory Structure**

```
marketsage/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication pages (login, register)
│   │   ├── (dashboard)/              # Main application interface
│   │   │   ├── ai-chat/              # AI chat interface
│   │   │   ├── ai-intelligence/      # AI insights dashboard
│   │   │   ├── analytics/            # Business intelligence
│   │   │   ├── campaigns/            # Campaign management
│   │   │   ├── contacts/             # Customer database
│   │   │   ├── conversions/          # Conversion tracking
│   │   │   ├── leadpulse/            # Visitor intelligence
│   │   │   ├── settings/             # System configuration
│   │   │   └── workflows/            # Automation builder
│   │   ├── api/                      # 130+ API endpoints
│   │   │   ├── ai/                   # AI and intelligence APIs
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── campaigns/            # Campaign management APIs
│   │   │   ├── contacts/             # Contact management
│   │   │   ├── email/                # Email automation
│   │   │   ├── leadpulse/            # Visitor tracking APIs
│   │   │   ├── sms/                  # SMS automation
│   │   │   ├── whatsapp/             # WhatsApp automation
│   │   │   └── workflows/            # Workflow engine APIs
│   │   ├── globals.css               # Global styles and Tailwind
│   │   ├── layout.tsx                # Root layout with providers
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # React components library
│   │   ├── ai/                       # AI-specific components
│   │   ├── auth/                     # Authentication components
│   │   ├── dashboard/                # Dashboard widgets
│   │   ├── email-editor/             # Visual email builder
│   │   ├── leadpulse/                # Visitor tracking components
│   │   ├── ui/                       # shadcn/ui base components
│   │   └── workflow-editor/          # Visual workflow builder
│   ├── lib/                          # Core business logic
│   │   ├── ai/                       # AI engines and models
│   │   ├── auth/                     # Authentication logic
│   │   ├── db/                       # Database utilities
│   │   ├── email-service.ts          # Email automation
│   │   ├── leadpulse/               # Visitor tracking logic
│   │   ├── sms-providers/           # SMS service integrations
│   │   ├── whatsapp-service.ts      # WhatsApp automation
│   │   └── workflow/                # Workflow execution engine
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # TypeScript type definitions
│   └── middleware.ts                 # Route protection and security
├── prisma/
│   ├── schema.prisma                 # Database schema definition
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Database seeding
├── public/                           # Static assets
├── docs/                             # Documentation
├── __tests__/                        # Test suites
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies and scripts
└── docker-compose.yml                # Development environment

marketsage-monitoring/               # Enterprise monitoring stack
├── docker-compose.yml               # Complete observability stack
├── grafana/dashboards/              # 15 specialized dashboards
├── config/                          # Monitoring configurations
├── services/                        # Custom monitoring services
│   ├── business-metrics-exporter/   # KPI tracking service
│   ├── synthetic-monitoring/        # Uptime monitoring
│   └── compliance-monitor/          # GDPR compliance tracking
├── scripts/                         # Automation and deployment
└── docs/                            # Monitoring documentation
```

### Special Configuration Files
- **`.env`**: Environment variables and secrets
- **`next.config.js`**: Next.js build configuration with AI/ML optimizations
- **`tailwind.config.ts`**: Custom design system with MarketSage branding
- **`tsconfig.json`**: TypeScript configuration with strict type checking
- **`prisma/schema.prisma`**: Complete database schema with AI features
- **`docker-compose.yml`**: Development environment setup
- **`instrumentation.ts`**: OpenTelemetry configuration

---

## 🔧 **Functions and Modules**

### Authentication & Security
- **`auth.ts`**: NextAuth.js configuration with role-based access
- **`security/`**: Comprehensive security utilities
  - `api-fortress.ts`: API protection and rate limiting
  - `auth-rate-limiter.ts`: Authentication protection
  - `input-validation.ts`: Request sanitization
  - `vulnerability-management.ts`: Security monitoring

### AI & Intelligence Engine
- **`ai/supreme-ai-v3-engine.ts`**: Core AI orchestration engine
- **`ai/predictive-analytics-engine.ts`**: Customer intelligence predictions
- **`ai/behavioral-predictor.ts`**: Customer behavior analysis
- **`ai/content-intelligence.ts`**: Content optimization AI
- **`ai/market-intelligence.ts`**: Market analysis and insights

### Marketing Automation
- **`email-service.ts`**: Multi-provider email automation
- **`sms-providers/`**: SMS service integrations
  - `africastalking-provider.ts`: African SMS provider
  - `twilio-provider.ts`: Global SMS provider
  - `sms-service.ts`: Unified SMS interface
- **`whatsapp-service.ts`**: WhatsApp Business API integration
- **`workflow/execution-engine.ts`**: Visual workflow automation

### LeadPulse Analytics
- **`leadpulse/visitor-tracking.ts`**: Anonymous visitor identification
- **`leadpulse/formBuilder.ts`**: Dynamic form creation
- **`leadpulse/dataProvider.ts`**: Real-time analytics data
- **`leadpulse/conversion-bridge.ts`**: Conversion tracking integration

### Customer Intelligence
- **`smart-segmentation.ts`**: AI-powered customer segmentation
- **`predictive-analytics/`**: Predictive model collection
  - `churn-prediction.ts`: Customer retention forecasting
  - `lifetime-value-prediction.ts`: Revenue predictions
  - `campaign-performance-prediction.ts`: Campaign optimization

### Data Management
- **`db/prisma.ts`**: Database connection and utilities
- **`cache/redis-client.ts`**: Caching and session management
- **`export/enterprise-export.ts`**: Data export capabilities

### Compliance & Monitoring
- **`compliance/gdpr-compliance.ts`**: Privacy regulation compliance
- **`audit/enterprise-audit-logger.ts`**: Comprehensive audit logging
- **`monitoring/performance-analytics.ts`**: Performance monitoring

---

## 🧠 **Business Logic and Features**

### 1. **Multi-Channel Marketing Automation**
**Location**: `/src/app/(dashboard)/campaigns/`, `/src/lib/`
**Purpose**: Unified campaign management across Email, SMS, and WhatsApp

**Key Components**:
- Visual workflow builder with drag-and-drop interface
- Multi-channel message templates with personalization
- Automated trigger system (time-based, event-based, behavioral)
- A/B testing for all channels with statistical significance
- Performance analytics with attribution modeling

**Dynamic Logic**:
- Intelligent channel selection based on customer preferences
- Send time optimization using ML predictions
- Content personalization using AI-generated insights
- Automatic language detection and localization

### 2. **LeadPulse - Visitor Intelligence Platform**
**Location**: `/src/app/(dashboard)/leadpulse/`, `/src/lib/leadpulse/`
**Purpose**: Advanced visitor tracking and behavioral analytics

**Key Components**:
- Anonymous visitor identification using fingerprinting
- Real-time visitor tracking with session recording
- Form builder with conditional logic and A/B testing
- Heatmap analytics with click and scroll tracking
- Customer journey visualization with funnel analysis

**Dynamic Logic**:
- GDPR-compliant consent management
- Behavioral scoring algorithm with engagement metrics
- Intent detection using ML-powered analysis
- Progressive profiling for visitor identification

### 3. **Supreme-AI v3 Intelligence Engine**
**Location**: `/src/lib/ai/supreme-ai-v3-engine.ts`, `/src/app/(dashboard)/ai-intelligence/`
**Purpose**: Multi-modal AI orchestration for business intelligence

**Key Components**:
- Natural language processing for customer insights
- Predictive analytics for churn, LTV, and campaign performance
- Automated content generation and optimization
- Strategic decision support with risk assessment
- Task automation with safety approval system

**Dynamic Logic**:
- Multi-agent coordination for complex tasks
- Real-time learning from user interactions
- Risk-based approval workflows for AI actions
- Performance monitoring and model drift detection

### 4. **Customer Intelligence & Segmentation**
**Location**: `/src/app/(dashboard)/contacts/`, `/src/lib/smart-segmentation.ts`
**Purpose**: Comprehensive customer database with AI-powered insights

**Key Components**:
- 360-degree customer profiles with predictive scores
- Dynamic segmentation based on behavior and predictions
- Contact enrichment using external data sources
- List management with automated updates
- Import/export with data validation and deduplication

**Dynamic Logic**:
- Automatic customer scoring using ML models
- Behavioral segmentation with real-time updates
- Churn prediction with proactive retention campaigns
- Lifetime value calculation for prioritization

### 5. **Conversion Tracking & Attribution**
**Location**: `/src/app/(dashboard)/conversions/`, `/src/lib/enhanced-conversions.ts`
**Purpose**: Multi-touch attribution and conversion optimization

**Key Components**:
- Funnel visualization with drop-off analysis
- Multi-touch attribution modeling
- Cross-device tracking and identity resolution
- Goal tracking with custom conversion events
- ROI calculation with campaign attribution

**Dynamic Logic**:
- Attribution model selection (first-touch, last-touch, data-driven)
- Cross-channel journey mapping
- Conversion probability scoring
- Revenue attribution across touchpoints

### 6. **Workflow Automation Engine**
**Location**: `/src/app/(dashboard)/workflows/`, `/src/lib/workflow/`
**Purpose**: Visual automation builder with complex logic support

**Key Components**:
- Node-based workflow editor with drag-and-drop
- Trigger system (time, event, score, behavior)
- Conditional logic with advanced branching
- Action execution across multiple channels
- Performance monitoring with execution analytics

**Dynamic Logic**:
- Workflow optimization recommendations
- Performance-based routing adjustments
- Error handling with retry mechanisms
- Rate limiting for compliance and performance

---

## 🌐 **API Design**

### RESTful API Architecture
**Base URL**: `/api/` with 130+ endpoints organized by feature

### Core API Modules

#### 1. **Authentication & User Management**
```
POST   /api/auth/register           # User registration
POST   /api/auth/login              # User authentication
GET    /api/auth/session            # Session validation
POST   /api/auth/logout             # Session termination
GET    /api/users/profile           # User profile data
PUT    /api/users/profile           # Profile updates
```

#### 2. **AI & Intelligence APIs**
```
POST   /api/ai/chat                 # AI chat interface
POST   /api/ai/analyze              # Data analysis requests
POST   /api/ai/predict              # Predictive analytics
GET    /api/ai/insights             # Business insights
POST   /api/ai/content/generate     # Content generation
POST   /api/ai/recommendations      # AI recommendations
```

#### 3. **Contact & Segmentation Management**
```
GET    /api/contacts                # List contacts with pagination
POST   /api/contacts                # Create new contact
PUT    /api/contacts/:id            # Update contact
DELETE /api/contacts/:id            # Delete contact
POST   /api/contacts/import         # Bulk import
GET    /api/segments                # List segments
POST   /api/segments/smart          # Create smart segment
```

#### 4. **Campaign Management**
```
GET    /api/campaigns               # List all campaigns
POST   /api/campaigns               # Create campaign
PUT    /api/campaigns/:id           # Update campaign
POST   /api/campaigns/:id/send      # Send campaign
GET    /api/campaigns/:id/analytics # Campaign performance
POST   /api/campaigns/ab-test       # A/B test creation
```

#### 5. **Multi-Channel Communication**
```
POST   /api/email/send              # Send email
GET    /api/email/templates         # List templates
POST   /api/sms/send               # Send SMS
GET    /api/sms/balance            # Check SMS balance
POST   /api/whatsapp/send          # Send WhatsApp message
GET    /api/whatsapp/templates     # List approved templates
```

#### 6. **LeadPulse Analytics**
```
POST   /api/leadpulse/track         # Track visitor event
GET    /api/leadpulse/visitors      # List visitors
GET    /api/leadpulse/sessions      # Session data
POST   /api/leadpulse/forms         # Create form
GET    /api/leadpulse/analytics     # Visitor analytics
GET    /api/leadpulse/heatmap       # Heatmap data
```

#### 7. **Workflow Automation**
```
GET    /api/workflows               # List workflows
POST   /api/workflows               # Create workflow
PUT    /api/workflows/:id           # Update workflow
POST   /api/workflows/:id/activate  # Activate workflow
GET    /api/workflows/:id/logs      # Execution logs
```

### Input/Output Patterns
- **Request Format**: JSON with TypeScript validation
- **Response Format**: Standardized with `success`, `data`, `error` structure
- **Pagination**: Cursor-based with `limit`, `offset`, `total`
- **Filtering**: Query parameters with operator support (`gt`, `lt`, `eq`, `contains`)

### Error Handling
- **HTTP Status Codes**: Standard RESTful responses
- **Error Objects**: Structured with `code`, `message`, `details`
- **Validation Errors**: Field-specific error messages
- **Rate Limiting**: 429 responses with retry headers

---

## 🛡️ **Security Practices**

### Environment & Secrets Management
- **`.env` files**: Secure credential storage for different environments
- **Docker secrets**: Production secret management
- **Encryption**: Field-level encryption for sensitive data
- **Key rotation**: Automated credential rotation procedures

### Authentication Mechanisms
- **NextAuth.js**: Secure session management with JWT tokens
- **Multi-factor authentication**: TOTP and email verification
- **Role-based access control**: Four-tier permission system
- **Session security**: Secure cookies with HttpOnly and SameSite

### Input Validation & Sanitization
- **Zod schemas**: Type-safe input validation
- **SQL injection prevention**: Parameterized queries via Prisma
- **XSS protection**: Content sanitization and CSP headers
- **CSRF protection**: Token-based request validation

### Rate Limiting & Abuse Protection
- **API rate limiting**: Per-user and per-IP restrictions
- **Authentication rate limiting**: Brute force protection
- **DDoS protection**: Request throttling and traffic analysis
- **Anomaly detection**: Unusual usage pattern identification

### GDPR Compliance
- **Consent management**: Granular privacy controls
- **Data retention**: Automated cleanup policies
- **Right to deletion**: Complete data removal capabilities
- **Audit logging**: Comprehensive access and modification tracking

---

## 🚀 **Deployment & CI/CD**

### Docker Configuration
**Development Environment**:
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS base
# Production image with security hardening
FROM node:18-alpine AS production
```

**Production Setup**:
- Standalone Next.js build for containerization
- Multi-stage builds for minimal image size
- Health checks and graceful shutdown
- Resource limits and monitoring

### CI/CD Pipeline (GitHub Actions)
**Main Workflow** (`.github/workflows/ci-cd.yml`):
1. **Validation Stage**: Configuration validation, security scanning
2. **Build Stage**: Docker image creation with caching
3. **Test Stage**: Unit tests, integration tests, security tests
4. **Deploy Stage**: Environment-specific deployments
5. **Monitoring Stage**: Health checks and performance validation

**Environment Management**:
- **Development**: Local Docker Compose setup
- **Staging**: Pre-production environment with full monitoring
- **Production**: Multi-region deployment with auto-scaling

### Monitoring & Observability Infrastructure
**Enterprise-Grade Stack**:
- **Prometheus**: Metrics collection from 13 targets
- **Grafana**: 15 specialized dashboards for monitoring
- **Loki**: Centralized log aggregation and analysis
- **Tempo**: Distributed tracing across services
- **Custom Services**: Business metrics, synthetic monitoring, compliance

**Health Monitoring**:
- Automated health checks every 30 seconds
- Performance monitoring with SLA tracking
- Business metrics monitoring (KPIs, conversion rates)
- Security event monitoring and alerting

### Environment Differences
- **Development**: Hot reloading, debug logging, mock providers
- **Staging**: Production-like with enhanced monitoring
- **Production**: Optimized builds, security hardening, auto-scaling

---

## 🏗️ **Monitoring Infrastructure**

### Observability Stack
**marketsage-monitoring/** contains enterprise-grade monitoring with:

#### Core Services (13 containers)
- **Grafana**: Central visualization with 15 specialized dashboards
- **Prometheus**: Metrics collection with 30-day retention
- **Loki**: Log aggregation with structured querying
- **Tempo**: Distributed tracing with multi-protocol support
- **Alertmanager**: Smart alert routing to Slack and email

#### Custom Business Services
- **Business Metrics Exporter**: Real-time KPI tracking (users, revenue, campaigns)
- **Synthetic Monitoring**: Uptime and user journey testing
- **Compliance Monitor**: GDPR and security framework compliance

#### Specialized Dashboards
1. **Business Overview**: Executive KPIs and revenue metrics
2. **System Overview**: Infrastructure health and performance
3. **SLO/SLI Tracking**: Service level monitoring with error budgets
4. **Performance Analysis**: Deep application performance insights
5. **Error Correlation**: Advanced error tracking and analysis
6. **Request Flow**: API and user journey visualization
7. **Distributed Tracing**: Tempo-based trace analysis
8. **Log Analysis**: Comprehensive log filtering and search

#### CI/CD & Automation
- **GitHub Actions**: Automated deployment and health checks
- **Makefile**: Development workflow automation
- **Health Scripts**: Automated monitoring and maintenance
- **Environment Management**: Dev/staging/production configurations

---

## 🤖 **AI/Claude Instructions**

### Code Generation Guidelines
1. **File Structure**: Always generate code file-by-file with clear filename headers
2. **Naming Conventions**: Follow established patterns:
   - Components: PascalCase (e.g., `CustomerIntelligenceDashboard.tsx`)
   - Files: kebab-case for utilities, camelCase for services
   - API routes: RESTful naming with proper HTTP methods
   - Database: snake_case for tables, camelCase for Prisma models

### Architecture Planning
1. **Always start with architecture overview** before implementation
2. **Use existing patterns**: Follow established service patterns in `/lib/`
3. **Security first**: Include authentication, validation, and error handling
4. **AI integration**: Consider how new features integrate with Supreme-AI v3

### Code Quality Standards
1. **TypeScript strict mode**: Full type safety with proper interfaces
2. **Error handling**: Comprehensive try-catch with proper error types
3. **Performance**: Consider caching, optimization, and scalability
4. **Testing**: Include unit tests for business logic
5. **Documentation**: JSDoc comments for complex functions

### Component Development
1. **shadcn/ui first**: Use existing UI components before creating new ones
2. **Responsive design**: Mobile-first approach with Tailwind CSS
3. **Accessibility**: WCAG 2.1 compliance with proper ARIA labels
4. **State management**: Use React Query for server state, useState for local

### API Development
1. **RESTful design**: Follow established endpoint patterns
2. **Input validation**: Use Zod schemas for type-safe validation
3. **Error responses**: Consistent error format across all endpoints
4. **Authentication**: Verify user permissions for all protected routes
5. **Rate limiting**: Apply appropriate limits for different endpoint types

### Database Changes
1. **Prisma migrations**: Always create migrations for schema changes
2. **Backup considerations**: Consider data migration impact
3. **Performance**: Add indexes for new query patterns
4. **Relations**: Maintain referential integrity

### AI/ML Integration
1. **Use existing AI infrastructure**: Leverage Supreme-AI v3 patterns
2. **Model versioning**: Consider model updates and backward compatibility
3. **Performance monitoring**: Track AI model performance and accuracy
4. **Safety checks**: Implement approval workflows for high-risk AI actions

### Security Requirements
1. **Input validation**: Sanitize all user inputs
2. **Authentication**: Verify user identity and permissions
3. **Audit logging**: Log security-relevant events
4. **Compliance**: Ensure GDPR compliance for new features

### Performance Optimization
1. **Database queries**: Optimize for minimal N+1 queries
2. **Caching**: Use Redis for frequently accessed data
3. **Bundle size**: Consider impact on client-side bundle
4. **Monitoring**: Include performance metrics for new features

### Testing Strategy
1. **Unit tests**: Business logic and utility functions
2. **Integration tests**: API endpoints and database operations
3. **E2E tests**: Critical user flows and AI interactions
4. **Performance tests**: Load testing for high-traffic features

### Deployment Considerations
1. **Environment variables**: Proper configuration management
2. **Feature flags**: Gradual rollout capabilities
3. **Monitoring**: Include metrics for new features
4. **Rollback plan**: Consider deployment reversal procedures

### When Modifying Existing Code
1. **Explain changes**: Clearly document why modifications are needed
2. **Backward compatibility**: Maintain existing API contracts when possible
3. **Migration path**: Provide clear upgrade instructions
4. **Testing**: Verify existing functionality still works

### Preferred Patterns
- **Clarity over cleverness**: Write readable, maintainable code
- **Modularity**: Break complex features into smaller, reusable components
- **Consistency**: Follow established patterns in the codebase
- **Documentation**: Comment complex business logic and AI integrations
- **Error boundaries**: Graceful failure handling with user-friendly messages

### African Market Considerations
- **Mobile-first design**: 90%+ mobile usage in target markets
- **Low-bandwidth optimization**: Minimize data usage and load times
- **Local integrations**: Prioritize African service providers
- **Cultural intelligence**: AI responses should understand local context
- **Multi-currency support**: Handle multiple African currencies
- **Compliance**: Respect local data protection regulations

This project represents a sophisticated fintech marketing automation platform with enterprise-grade AI capabilities, comprehensive observability, and strong security practices designed specifically for the African market.