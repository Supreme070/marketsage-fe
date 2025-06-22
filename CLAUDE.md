# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### 🐳 **RECOMMENDED: Docker Development (Primary Method)**
```bash
# Production-ready Docker setup (recommended)
docker compose -f docker-compose.prod.yml up -d --build
# Includes: PostgreSQL + Redis + Web app + Complete seeding
# Access app at: http://localhost:3030

# Development Docker setup  
docker compose -f backup/docker/docker-compose.yml up -d --build
# Includes: PostgreSQL + Web app + Development seeding

# Database-only Docker (for local npm development)
docker compose -f backup/docker/docker-compose.db-only.yml up -d
# Then run: npm run dev (connects to dockerized DB)

# Stop all Docker services
docker compose -f docker-compose.prod.yml down
# or
docker compose -f backup/docker/docker-compose.yml down
```

### 📦 Local Development (Alternative Method)
```bash
# Start development server (requires local PostgreSQL)
npm run dev              # Standard development server
npm run dev:turbo        # Development with Turbo mode enabled

# Development with database
npm run dev:with-db      # Start local DB + development server
npm run db:start         # Start local database only
```

### Build & Production
```bash
npm run build            # Build production bundle
npm run start            # Start production server
npm run lint             # Run Biome linter with auto-fix + TypeScript check
npm run format           # Format code with Biome
```

### Database Operations
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Create and apply new migration
npm run db:deploy        # Deploy migrations (production)
npm run db:seed          # Seed database with sample data
npm run db:init          # Initialize database (generate + init + seed)
npm run db:reset         # Reset database (warning: destructive)
```

### Testing
```bash
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Run specific test file
npm test -- __tests__/supreme-ai-v3.test.ts
npm test -- --testNamePattern="Supreme AI"
```

### Seeding Specific Data
```bash
npm run seed-contacts    # Seed contact data
npm run seed-lists       # Seed list data
npm run seed-email-campaigns  # Seed email campaigns
npm run seed-sms-campaigns    # Seed SMS campaigns
npm run seed-whatsapp-campaigns  # Seed WhatsApp campaigns
npm run seed-workflows   # Seed workflow data
npm run seed-all         # Seed all data types
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15+ with App Router, React 18+, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Prisma adapter
- **AI Integration**: OpenAI API with custom Supreme-AI engine
- **Email/SMS**: Multiple provider integrations
- **Deployment**: Docker support with multi-stage builds

### Database Architecture
The application uses a comprehensive Prisma schema with key models:

- **User Management**: User, Organization, UserRole (SUPER_ADMIN, ADMIN, IT_ADMIN, USER)
- **Contact Management**: Contact, List, Segment with advanced segmentation
- **Multi-Channel Campaigns**: EmailCampaign, SMSCampaign, WhatsAppCampaign
- **Workflow Automation**: Workflow, WorkflowNode, WorkflowExecution
- **AI Intelligence**: AI_ContentAnalysis, AI_CustomerSegment, AI_ChatHistory
- **LeadPulse Analytics**: LeadPulseVisitor, LeadPulseTouchpoint for visitor tracking
- **Conversion Tracking**: ConversionEvent, ConversionTracking, ConversionFunnel
- **Predictive Analytics**: PredictionModel, ChurnPrediction, LifetimeValuePrediction
- **Customer Journeys**: Journey, JourneyStage, ContactJourney
- **Task Management**: Task, TaskDependency, TaskComment
- **Billing**: Subscription, Transaction, PaymentMethod (Paystack integration)

### AI Engine Architecture
The application features a sophisticated AI system:

**Supreme-AI v3 Engine** (`src/lib/ai/supreme-ai-v3-engine.ts`):
- Meta orchestrator that routes requests to specialist sub-engines
- Handles questions, task execution, analysis, and predictions
- Integrates with OpenAI API for intelligent responses
- Supports automatic task detection and execution
- Culturally intelligent for African fintech markets

**Key AI Components**:
- **Memory Engine**: Long-term context and conversation history
- **RAG Engine**: Knowledge grounding from documentation
- **AutoML Engine**: Continuous learning for predictive tasks
- **Content Intelligence**: Sentiment analysis and content optimization
- **Behavioral Prediction**: Customer behavior and churn prediction

### Application Structure

**Route Organization**:
- `/app/(auth)/` - Authentication pages (login, register, signup)
- `/app/(dashboard)/` - Main application dashboard and features
- `/app/api/` - All API endpoints organized by feature
- `/app/solutions/` - Public marketing pages for different solutions

**Key Features**:
- **Email Marketing**: Visual editor, templates, A/B testing, automation
- **SMS & WhatsApp**: Campaign management with carrier optimization
- **Workflow Automation**: Visual workflow builder with drag-and-drop interface
- **LeadPulse Intelligence**: Real-time visitor tracking and behavioral analytics
- **AI-Powered Analytics**: Predictive insights and automated decision support
- **Customer Journey Mapping**: Track and optimize customer touchpoints
- **Advanced Segmentation**: Behavioral, demographic, and AI-driven segments
- **Multi-tenant Support**: Organization-based isolation with role-based access

**Component Architecture**:
- `src/components/ui/` - Reusable UI components (shadcn/ui)
- `src/components/dashboard/` - Dashboard-specific components
- `src/components/email-editor/` - Visual email template editor
- `src/components/workflow-editor/` - Visual workflow builder
- `src/components/leadpulse/` - Visitor tracking and analytics components
- `src/components/ai/` - AI-powered interface components

### Integration Patterns

**Database Access**:
- Use `prisma` client from `src/lib/db/prisma.ts`
- All database operations should include proper error handling
- Leverage Prisma's type safety for data operations

**AI Integration**:
- Primary entry point: `SupremeAIv3.process()` for all AI operations
- Task execution: Set `enableTaskExecution: true` for automated task creation
- Context awareness: AI maintains conversation history and user context

**Authentication**:
- Uses NextAuth.js with custom auth options in `src/lib/auth/auth-options.ts`
- Role-based access control with SUPER_ADMIN, ADMIN, IT_ADMIN, USER roles
- Protect routes with `AuthCheck` component or `getServerSession()`

**API Design**:
- RESTful endpoints under `/api/`
- Consistent error handling and response formats
- Input validation using Zod schemas where applicable

## Critical Security & Development Warnings

### ⚠️ **SECURITY ISSUES REQUIRING IMMEDIATE ATTENTION**
- **Authentication Bypass**: `src/lib/auth/auth-options.ts` always returns mock user - FIX BEFORE PRODUCTION
- **Hardcoded API Keys**: Remove from `docker-compose.prod.yml` lines 35, 50-51 before any commits
- **Environment File**: Never commit actual `.env` files with real API keys to version control
- **Missing Security Headers**: Add CSP, HSTS, and other security headers to middleware

### 🔧 **Architectural Complexity Warnings**
- **Supreme-AI Engine**: 2000+ line file with high complexity - consider N8N integration for workflow automation
- **Database Schema**: 1815-line Prisma schema may cause performance issues - add indexes for commonly queried fields
- **Over-Engineering**: Multiple AI providers without clear fallback strategy - simplify before scaling

## Development Guidelines

### Working with AI Features
- AI chat interface is at `/dashboard/ai-chat`
- Supreme-AI engine can execute tasks when `enableTaskExecution` is enabled
- AI responses include cultural intelligence for African fintech markets
- All AI interactions are logged for context building
- **Note**: Current AI task execution creates real database entries - use carefully in development

### Database Development
- Always create migrations for schema changes: `npm run db:migrate`
- Use descriptive migration names reflecting the changes
- Test migrations thoroughly before deployment
- Seed data is comprehensive - use `npm run seed-all` for full setup

### Testing Approach
- Jest configured for unit and integration testing
- Test files should be in `__tests__/` directories or use `.test.ts` suffix
- Mock external API calls and database operations in tests
- Maintain good test coverage especially for critical business logic

### Docker Development (Primary Approach)
**Production Setup**: `docker-compose.prod.yml` is the main Docker configuration
- **Full Stack**: PostgreSQL + Redis (Valkey) + Next.js app + Complete database seeding
- **Auto-seeding**: Automatically seeds users, contacts, campaigns, workflows, and AI data
- **Production-ready**: Uses Dockerfile.prod with optimized multi-stage builds
- **Default users created**: Supreme Admin, Anita Manager, Kola Techleads, Regular User
- **Health checks**: Built-in health monitoring for all services
- **Port**: Application runs on http://localhost:3030

**Development Setup**: `backup/docker/docker-compose.yml` for development
- **Development mode**: Uses development Dockerfile with hot-reloading
- **Simpler seeding**: Basic development data seeding
- **Rebuild support**: Includes rebuild profile for dependency updates

**Database-only Setup**: `backup/docker/docker-compose.db-only.yml`
- **Optimized PostgreSQL**: Tuned for development performance 
- **For hybrid development**: Use with `npm run dev` for local app development
- **Minimal resources**: Just PostgreSQL service with performance optimizations

### Code Quality
- Use TypeScript strictly - avoid `any` types
- Follow the existing code patterns and architecture
- Leverage Biome for consistent formatting and linting
- Document complex business logic and AI integrations

### African Fintech Considerations
- The application is optimized for Nigerian, Kenyan, South African, and Ghanaian markets
- Cultural intelligence is built into AI responses and automation
- Consider mobile-first design patterns and local payment preferences
- Compliance requirements vary by market - check regulatory considerations

### Performance Considerations
- Use Next.js App Router for optimal performance
- Implement proper loading states and error boundaries
- Optimize database queries with appropriate indexes
- Consider caching for frequently accessed data

## Common Workflows

### Quick Start (Recommended)
```bash
# 1. Start the complete environment with Docker
docker compose -f docker-compose.prod.yml up -d --build

# 2. Wait for seeding to complete (check logs)
docker compose -f docker-compose.prod.yml logs -f seed

# 3. Access the application
# http://localhost:3030
# Login with: supreme@marketsage.africa / MS_Super2025!
```

### Development Workflow
```bash
# Option A: Full Docker development
docker compose -f docker-compose.prod.yml up -d --build

# Option B: Hybrid development (Docker DB + local app)
docker compose -f backup/docker/docker-compose.db-only.yml up -d
npm run dev

# Option C: Local development (requires local PostgreSQL)
npm run dev:with-db
```

### Adding New Campaign Types
1. Extend Prisma schema with new campaign model
2. Run `npm run db:migrate` to create migration
3. Create API endpoints following existing patterns in `/app/api/`
4. Build UI components in appropriate dashboard section
5. Integrate with AI engine for intelligent automation
6. Add workflow support for campaign automation
7. Test with Docker: `docker compose -f docker-compose.prod.yml up -d --build`

### Implementing New AI Features
1. Extend Supreme-AI engine (`src/lib/ai/supreme-ai-v3-engine.ts`) with new task types
2. Add appropriate database models for AI data
3. Create API endpoints for AI interactions
4. Build frontend components for AI interfaces
5. Test with cultural intelligence considerations
6. Validate with Docker environment

### Setting Up New Markets
1. Add market intelligence data to AI engine
2. Update localization and cultural adaptation logic
3. Configure compliance requirements for the market
4. Test timing optimizations and cultural messaging
5. Document market-specific considerations

### Container Management
```bash
# View all running containers
docker ps

# Check specific service logs
docker compose -f docker-compose.prod.yml logs web
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml logs seed

# Restart specific service
docker compose -f docker-compose.prod.yml restart web

# Force rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Debugging Common Issues
```bash
# If seeding fails, check seed container logs
docker compose -f docker-compose.prod.yml logs seed

# If AI features fail, check environment variables
grep -r "OPENAI_API_KEY\|SUPREME_AI" .env* docker-compose*.yml

# If database connection fails
docker compose -f docker-compose.prod.yml exec db psql -U marketsage -d marketsage -c "\dt"

# If authentication fails, check auth bypass in development
grep -n "authorize" src/lib/auth/auth-options.ts
```

## Known Technical Debt & Future Improvements

### High Priority Fixes
1. **Authentication System**: Replace mock authentication with proper credential validation
2. **API Key Management**: Implement proper secret management instead of hardcoded values
3. **Database Performance**: Add compound indexes for frequently queried relationships
4. **Error Boundaries**: Implement consistent error handling across all API routes

### Architecture Improvement Opportunities
1. **N8N Integration**: Replace custom workflow engine with N8N for better maintainability
2. **Service Layer**: Extract business logic from API routes into service classes
3. **Bundle Optimization**: Move ML libraries to server-side to reduce client bundle size
4. **Microservices**: Consider splitting AI services into separate containers

### African Fintech Market Context
- **Mobile-First**: 90%+ mobile penetration requires optimal mobile performance
- **Cultural Intelligence**: AI responses are tuned for Nigerian, Kenyan, South African, and Ghanaian markets
- **Payment Integration**: Built-in support for M-Pesa, MTN Mobile Money, and local banking APIs
- **Regulatory Compliance**: Automated compliance checks for multiple African jurisdictions
- **Cross-Border**: Specialized automation for remittance and multi-currency operations

This architecture supports sophisticated fintech automation with cultural intelligence, making it particularly effective for African markets while maintaining scalability and developer productivity.