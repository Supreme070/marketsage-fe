# MarketSage Development Workflow

## Repository Structure Overview

MarketSage now operates as a distributed system with separate repositories:

```
marketsage-frontend/     # Next.js frontend application
├── src/app/            # Next.js 13+ app router
├── src/components/     # Reusable UI components
├── src/lib/           # Utility libraries and API proxy
└── package.json       # Frontend dependencies

marketsage-backend/     # NestJS API server
├── src/              # NestJS application code
├── prisma/           # Database schema and migrations
├── test/             # Backend tests
└── package.json      # Backend dependencies

marketsage-monitoring/  # Observability stack
├── prometheus/       # Metrics collection
├── grafana/         # Dashboards and visualization
└── docker-compose.yml
```

## Development Environment Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- PostgreSQL (if running locally)
- Redis (if running locally)

### Initial Setup

1. **Clone all repositories:**
```bash
git clone https://github.com/your-org/marketsage-frontend.git
git clone https://github.com/your-org/marketsage-backend.git
git clone https://github.com/your-org/marketsage-monitoring.git
```

2. **Backend setup:**
```bash
cd marketsage-backend
npm install
cp .env.example .env.local
# Configure your database URL and other environment variables
npm run db:migrate
npm run db:seed
npm run start:dev
```

3. **Frontend setup:**
```bash
cd marketsage-frontend
npm install
cp .env.example .env.local
# Configure NEXT_PUBLIC_BACKEND_URL=http://localhost:3006
npm run dev
```

4. **Monitoring setup (optional):**
```bash
cd marketsage-monitoring
docker-compose up -d
```

## Development Workflow

### Feature Development

1. **Create feature branch in both repos:**
```bash
# Frontend
cd marketsage-frontend
git checkout -b feature/user-dashboard-improvements

# Backend  
cd marketsage-backend
git checkout -b feature/user-dashboard-improvements
```

2. **Development process:**
- Start backend first: `npm run start:dev` (port 3006)
- Start frontend: `npm run dev` (port 3000)
- Access app at `http://localhost:3000`
- Admin portal at `http://admin.localhost:3000`

3. **API Development:**
- Backend changes: Modify NestJS controllers, services, DTOs
- Frontend changes: Update API calls to use existing proxy pattern
- No direct database access from frontend - all via API

### Testing Strategy

#### Backend Testing
```bash
cd marketsage-backend
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Coverage report
```

#### Frontend Testing
```bash
cd marketsage-frontend
npm run test           # Jest unit tests
npm run test:e2e       # Playwright E2E tests
npm run lint           # ESLint
npm run typecheck      # TypeScript checking
```

#### Integration Testing
```bash
# Start both services
cd marketsage-backend && npm run start:dev &
cd marketsage-frontend && npm run dev &

# Run cross-service integration tests
cd marketsage-frontend && npm run test:integration
```

### Database Changes

All database changes happen in the backend repository:

1. **Schema changes:**
```bash
cd marketsage-backend
# Edit prisma/schema.prisma
npm run db:migrate:dev
npm run db:generate
```

2. **Seed data:**
```bash
npm run db:seed
```

3. **Update frontend:**
Frontend automatically gets new data structure via API calls.

## Code Organization Standards

### Frontend Structure
```
src/
├── app/              # Next.js app router
│   ├── (admin)/      # Admin portal routes
│   ├── api/          # API proxy routes only
│   └── dashboard/    # Main app routes
├── components/       
│   ├── admin/        # Admin-specific components
│   ├── ui/           # Reusable UI components
│   └── forms/        # Form components
├── lib/
│   ├── api-proxy.ts  # Backend proxy utility
│   ├── auth/         # Authentication utilities
│   └── utils/        # General utilities
└── types/            # TypeScript definitions
```

### Backend Structure
```
src/
├── modules/          # Feature modules
│   ├── users/        # User management
│   ├── auth/         # Authentication
│   └── workflows/    # Business logic
├── common/           # Shared utilities
│   ├── guards/       # Auth guards
│   ├── pipes/        # Validation pipes
│   └── interceptors/ # Response interceptors
└── config/           # Configuration files
```

## API Integration Patterns

### Frontend API Calls
All API calls use the proxy pattern:

```typescript
// src/app/api/users/route.ts
import { proxyToBackend } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'users',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
```

### Backend API Endpoints
```typescript
// src/modules/users/users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get()
  async findAll(@Req() req: Request) {
    return this.usersService.findAll(req.user.organizationId);
  }
}
```

## Environment Configuration

### Development Environments
```bash
# Frontend (.env.local)
NEXT_PUBLIC_USE_API_ONLY=true
NEXT_PUBLIC_BACKEND_URL=http://localhost:3006
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret

# Backend (.env.local) 
NODE_ENV=development
PORT=3006
DATABASE_URL=postgresql://user:pass@localhost:5432/marketsage
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret
CORS_ORIGIN=http://localhost:3000,http://admin.localhost:3000
```

### Local Host Configuration
Add to `/etc/hosts` for subdomain testing:
```
127.0.0.1 admin.localhost
```

## Git Workflow

### Branch Naming Convention
```
feature/description          # New features
fix/bug-description         # Bug fixes  
refactor/component-name     # Code refactoring
docs/section-name          # Documentation updates
chore/task-description     # Maintenance tasks
```

### Commit Message Format
```
type(scope): description

Examples:
feat(users): add user profile editing
fix(auth): resolve login redirect issue
refactor(api): improve error handling
docs(readme): update setup instructions
```

### Pull Request Process

1. **Create PRs in both repositories:**
```bash
# Frontend PR
gh pr create --title "feat: user dashboard improvements" --body "- Added new dashboard widgets\n- Improved responsive design"

# Backend PR  
gh pr create --title "feat: user dashboard API enhancements" --body "- Added dashboard metrics endpoint\n- Optimized user data queries"
```

2. **Link related PRs:**
Include cross-references in PR descriptions:
```markdown
## Related PRs
- Frontend: marketsage-frontend#123
- Backend: marketsage-backend#456
```

3. **Testing checklist:**
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Debugging and Troubleshooting

### Common Issues

1. **CORS errors:**
   - Check `CORS_ORIGIN` in backend `.env`
   - Verify frontend URL matches CORS settings

2. **Authentication issues:**
   - Ensure `NEXTAUTH_SECRET` matches in both repos
   - Check JWT token validation in backend

3. **Database connection:**
   - Verify `DATABASE_URL` in backend
   - Run `npm run db:migrate` if schema changes

4. **Port conflicts:**
   - Frontend: 3000
   - Backend: 3006
   - Monitoring: 3001 (Grafana), 9090 (Prometheus)

### Debugging Tools

1. **Backend logs:**
```bash
cd marketsage-backend
npm run start:dev
# Logs include request/response details
```

2. **Frontend proxy debugging:**
```typescript
// Enabled in development by default
enableLogging: process.env.NODE_ENV === 'development'
```

3. **Database queries:**
```bash
cd marketsage-backend
npx prisma studio  # Visual database browser
```

## Performance Optimization

### Frontend Optimization
- API routes are lightweight proxies
- Use React Query for caching API responses
- Implement proper loading states
- Optimize bundle size with tree shaking

### Backend Optimization
- Database query optimization with Prisma
- Response caching with Redis
- Rate limiting and request throttling
- Connection pooling for database

## Security Considerations

### Frontend Security
- No direct database access
- All sensitive operations via API proxy
- CSRF protection enabled
- Content Security Policy configured

### Backend Security
- JWT token validation
- Role-based access control
- Input validation with class-validator
- Rate limiting on API endpoints

## Deployment Coordination

### Staging Deployment
1. Deploy backend first
2. Run database migrations
3. Deploy frontend
4. Run smoke tests

### Production Deployment
1. Create release branches in both repos
2. Deploy to staging environment
3. Run full test suite
4. Deploy backend with zero-downtime strategy
5. Deploy frontend
6. Monitor metrics and rollback if needed

## Monitoring and Observability

### Metrics Collection
- Backend: Prometheus metrics at `/metrics`
- Frontend: Client-side error tracking
- Database: Query performance monitoring

### Log Aggregation
```bash
# View logs across services
docker-compose logs -f marketsage-backend
docker-compose logs -f marketsage-frontend
```

### Health Checks
- Backend: `GET /api/v2/health`
- Frontend: `GET /api/health`
- Database: Connection pool status

## Team Collaboration

### Code Review Process
1. Self-review changes
2. Request review from team member
3. Address feedback
4. Merge after approval

### Communication
- Link related frontend/backend changes
- Document breaking changes
- Update team on deployment schedule
- Share debugging findings

This workflow ensures smooth development across the distributed MarketSage architecture while maintaining code quality and system reliability.