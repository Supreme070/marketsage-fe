# MarketSage - Security Hardening Plan (Phase 2)

**Date**: 2025-10-04
**Status**: IN PROGRESS
**Scope**: Week 7-8 Security Hardening Tasks (Tasks 36-48)
**Codebase**: Frontend (marketsage-frontend)

---

## ⚠️ IMPORTANT: Scope Clarification

**This is the FRONTEND repository.**

**Tasks Breakdown by Scope:**
- ✅ **Frontend Tasks (Can Implement)**: 4 tasks
- 📋 **Backend Tasks (Requirements Only)**: 6 tasks
- 🏗️ **Infrastructure Tasks (Requirements Only)**: 3 tasks

---

## WEEK 7: CORE SECURITY (Tasks 36-41)

### Task 36: Install helmet.js Security Headers in Backend
**Scope**: 🔴 BACKEND-ONLY
**Status**: ❌ CANNOT IMPLEMENT (backend repository required)
**Estimated Time**: 2 hours
**Priority**: HIGH

**Requirements for Backend Team:**

```typescript
// backend/src/main.ts (NestJS)
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

**Verification**:
```bash
curl -I https://api.marketsage.com/health
# Should return security headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: default-src 'self'
```

---

### Task 37: Strengthen Password Requirements
**Scope**: 🔴 BACKEND-ONLY (with frontend validation)
**Status**: ⏳ PARTIAL (frontend can add client-side validation)
**Estimated Time**: 4 hours
**Priority**: HIGH

**Backend Requirements** (marketsage-backend):

```typescript
// backend/src/auth/dto/register.dto.ts
import { IsString, IsEmail, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number, and special character' }
  )
  password: string;
}
```

**Frontend Implementation** (can be done):

```typescript
// src/lib/validators/password-validator.ts
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Minimum length
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Calculate strength
  let strength: PasswordValidationResult['strength'] = 'weak';
  if (errors.length === 0) {
    if (password.length >= 16) strength = 'very-strong';
    else if (password.length >= 14) strength = 'strong';
    else strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}
```

**Action**: ✅ CREATE frontend password validator (Task 37a)

---

### Task 38: Add Account Lockout Mechanism
**Scope**: 🔴 BACKEND-ONLY
**Status**: ❌ CANNOT IMPLEMENT (backend repository required)
**Estimated Time**: 8 hours
**Priority**: CRITICAL

**Requirements for Backend Team:**

```typescript
// backend/src/auth/guards/account-lockout.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AccountLockoutGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email;

    if (!email) return true;

    const lockoutKey = `auth:lockout:${email}`;
    const attemptsKey = `auth:attempts:${email}`;

    // Check if account is locked
    const lockedUntil = await this.redis.get(lockoutKey);
    if (lockedUntil) {
      const unlockTime = new Date(lockedUntil);
      if (unlockTime > new Date()) {
        throw new HttpException({
          statusCode: 429,
          message: 'Account temporarily locked due to too many failed login attempts',
          retryAfter: Math.ceil((unlockTime.getTime() - Date.now()) / 1000),
          lockedUntil: unlockTime.toISOString()
        }, HttpStatus.TOO_MANY_REQUESTS);
      } else {
        // Lock expired, clean up
        await this.redis.del(lockoutKey);
        await this.redis.del(attemptsKey);
      }
    }

    return true;
  }
}

// In auth.service.ts
async recordFailedLogin(email: string): Promise<void> {
  const attemptsKey = `auth:attempts:${email}`;
  const lockoutKey = `auth:lockout:${email}`;

  // Increment attempts
  const attempts = await this.redis.incr(attemptsKey);
  await this.redis.expire(attemptsKey, 1800); // 30 minutes

  // Lock account after 5 failed attempts
  if (attempts >= 5) {
    const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await this.redis.set(lockoutKey, lockoutUntil.toISOString(), 1800);

    // Send email notification
    await this.emailService.sendAccountLockedEmail(email, lockoutUntil);

    // Log security event
    await this.auditService.logSecurityEvent({
      type: 'ACCOUNT_LOCKED',
      email,
      attempts,
      lockedUntil: lockoutUntil,
      ip: request.ip
    });
  }
}

async recordSuccessfulLogin(email: string): Promise<void> {
  // Clear failed attempts on successful login
  await this.redis.del(`auth:attempts:${email}`);
  await this.redis.del(`auth:lockout:${email}`);
}
```

**Frontend Impact**:
- Display lockout error messages
- Show countdown timer for unlock
- Add "Unlock Account" link (sends email)

**Action**: 📋 DOCUMENT backend requirements

---

### Task 39: Remove Fallback JWT Secrets - Fail Loudly
**Scope**: ✅ FRONTEND (can implement)
**Status**: ⏳ IN PROGRESS
**Estimated Time**: 2 hours
**Priority**: CRITICAL

**Current Issue** (frontend):
```typescript
// src/lib/auth.ts line 43
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,  // ❌ No fallback, but no validation
```

**Required Fix**:
```typescript
// src/lib/auth.ts
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

// Fail loudly if secrets missing
if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
  throw new Error(
    '🔴 CRITICAL: NEXTAUTH_SECRET is missing or too short. ' +
    'Must be at least 32 characters. Generate with: openssl rand -base64 32'
  );
}

if (!NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  throw new Error(
    '🔴 CRITICAL: NEXTAUTH_URL is required in production. ' +
    'Set to your application URL (e.g., https://app.marketsage.com)'
  );
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  // ...
```

**Action**: ✅ IMPLEMENT this change (Task 39)

---

### Task 40: Audit All Backend API Endpoints for Auth Guards
**Scope**: 🔴 BACKEND-ONLY
**Status**: ❌ CANNOT IMPLEMENT (backend repository required)
**Estimated Time**: 8 hours
**Priority**: CRITICAL

**Audit Checklist for Backend Team:**

```bash
# 1. Find all controllers
find backend/src -name "*.controller.ts" | wc -l

# 2. Check for @UseGuards(JwtAuthGuard) on all endpoints
grep -r "@UseGuards" backend/src --include="*.controller.ts"

# 3. Verify public endpoints are explicitly marked
grep -r "@Public()" backend/src --include="*.controller.ts"

# 4. Check for role-based guards
grep -r "@Roles" backend/src --include="*.controller.ts"
```

**Required Patterns**:
```typescript
// ✅ CORRECT: Protected endpoint
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Get('users')
async getUsers() { }

// ✅ CORRECT: Public endpoint (explicitly marked)
@Public()
@Post('auth/login')
async login() { }

// ❌ WRONG: No guard (vulnerable)
@Get('users')
async getUsers() { } // Anyone can access!
```

**Expected Result**:
- All endpoints have @UseGuards(JwtAuthGuard) OR @Public()
- Sensitive endpoints have @Roles() decorator
- No unprotected endpoints exist

**Action**: 📋 DOCUMENT backend audit requirements

---

### Task 41: Set Up Error Monitoring (Sentry)
**Scope**: 🔴 BACKEND + FRONTEND
**Status**: ⏳ PARTIAL (frontend can implement)
**Estimated Time**: 2 hours (frontend), 2 hours (backend)
**Priority**: HIGH

**Frontend Implementation** (can be done):

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Don't send sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from errors
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },

    // Ignore known errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
}
```

**Backend Requirements**:
```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
```

**Action**: ✅ IMPLEMENT frontend Sentry (Task 41a)

---

## WEEK 8: INFRASTRUCTURE & MONITORING (Tasks 42-48)

### Task 42: Configure Monitoring Dashboards (Grafana/Prometheus)
**Scope**: 🏗️ INFRASTRUCTURE
**Status**: ❌ CANNOT IMPLEMENT (requires backend + infrastructure)
**Estimated Time**: 4 hours
**Priority**: HIGH

**Requirements**:

1. **Prometheus Metrics Endpoint** (Backend):
```typescript
// backend/src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    return register.metrics();
  }
}
```

2. **Grafana Dashboard Configuration**:
```yaml
# docker-compose.yml (marketsage-monitoring)
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3001:3000"
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
```

**Metrics to Monitor**:
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query performance
- Authentication success/failure rate
- Rate limit hits
- Memory usage
- CPU usage

**Action**: 📋 DOCUMENT monitoring requirements

---

### Task 43: Set Up Staging Environment
**Scope**: 🏗️ INFRASTRUCTURE
**Status**: ❌ CANNOT IMPLEMENT (requires infrastructure)
**Estimated Time**: 8 hours
**Priority**: HIGH

**Requirements**:

1. **Environment Setup**:
```bash
# Create staging environment
# - staging.marketsage.com (frontend)
# - api-staging.marketsage.com (backend)
# - db-staging (PostgreSQL)
# - redis-staging (Redis)
```

2. **CI/CD Configuration**:
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          # Deploy frontend to Vercel/Netlify staging
          # Deploy backend to staging server
```

3. **Environment Variables**:
```bash
# Staging .env
NODE_ENV=staging
NEXT_PUBLIC_API_URL=https://api-staging.marketsage.com
DATABASE_URL=postgresql://staging_db...
```

**Action**: 📋 DOCUMENT staging requirements

---

### Task 44: Configure Automated Database Backups
**Scope**: 🏗️ INFRASTRUCTURE
**Status**: ❌ CANNOT IMPLEMENT (requires infrastructure)
**Estimated Time**: 4 hours
**Priority**: CRITICAL

**Requirements**:

```bash
# PostgreSQL backup script
#!/bin/bash
# /scripts/backup-database.sh

BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE="marketsage"
BACKUP_FILE="$BACKUP_DIR/${DATABASE}_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump -h localhost -U postgres $DATABASE | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://marketsage-backups/postgresql/

# Keep only last 30 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "ERROR: Backup failed"
  exit 1
fi
```

**Cron Configuration**:
```bash
# Run backups daily at 2 AM
0 2 * * * /scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

**Backup Strategy**:
- **Daily backups**: Retained for 30 days
- **Weekly backups**: Retained for 3 months
- **Monthly backups**: Retained for 1 year
- **Offsite storage**: AWS S3 with encryption
- **Backup verification**: Monthly restore tests

**Action**: 📋 DOCUMENT backup requirements

---

### Task 45: Create .env.example Files
**Scope**: ✅ FRONTEND (can implement)
**Status**: ⏳ READY TO IMPLEMENT
**Estimated Time**: 1 hour
**Priority**: MEDIUM

**Action**: ✅ CREATE .env.example for frontend (Task 45)

---

### Task 46: Fix Frontend Build Warnings
**Scope**: ✅ FRONTEND (can implement)
**Status**: ⏳ READY TO IMPLEMENT
**Estimated Time**: 2 hours
**Priority**: MEDIUM

**Current Warnings**:
```
./src/app/(dashboard)/campaigns/[id]/ab-tests/page.tsx
Attempted import error: 'WinnerCriteria' is not exported from '@/lib/api/hooks/useUnifiedCampaigns'

./src/app/(dashboard)/campaigns/[id]/workflows/page.tsx
Attempted import error: 'TriggerType', 'ActionType' not exported
```

**Action**: ✅ FIX missing type exports (Task 46)

---

### Task 47: Create Deployment Checklist Document
**Scope**: ✅ FRONTEND (can implement)
**Status**: ⏳ READY TO IMPLEMENT
**Estimated Time**: 2 hours
**Priority**: HIGH

**Action**: ✅ CREATE comprehensive deployment checklist (Task 47)

---

### Task 48: Security Audit Complete - Penetration Testing
**Scope**: ✅ FRONTEND (can run npm audit)
**Status**: ⏳ READY TO RUN
**Estimated Time**: 8 hours
**Priority**: HIGH

**Tests to Run**:
1. `npm audit` - Dependency vulnerability scan
2. OWASP ZAP - Web application security testing
3. Manual security review
4. Authentication testing
5. Authorization bypass testing
6. XSS testing
7. CSRF testing
8. SQL injection testing (backend)

**Action**: ✅ RUN security audit (Task 48)

---

## Summary: What Can Be Done in Frontend

### ✅ Implementable Tasks (4 tasks)
| Task | Description | Time | Priority |
|------|-------------|------|----------|
| 39 | Remove fallback JWT secrets | 2h | CRITICAL |
| 45 | Create .env.example | 1h | MEDIUM |
| 46 | Fix build warnings | 2h | MEDIUM |
| 47 | Create deployment checklist | 2h | HIGH |

### ⏳ Partial Implementation (2 tasks)
| Task | Frontend Part | Backend Part |
|------|---------------|--------------|
| 37 | Password validator (client-side) | Password validation (server-side) |
| 41 | Sentry frontend setup | Sentry backend setup |

### 📋 Backend/Infrastructure Only (7 tasks)
| Task | Scope | Action |
|------|-------|--------|
| 36 | Backend | Document helmet.js requirements |
| 38 | Backend | Document lockout requirements |
| 40 | Backend | Document endpoint audit |
| 42 | Infrastructure | Document monitoring setup |
| 43 | Infrastructure | Document staging setup |
| 44 | Infrastructure | Document backup strategy |
| 48 | Audit | Run npm audit, document findings |

---

## Next Steps

**Immediate Actions** (can be done now):
1. ✅ Task 39: Remove JWT fallback secrets
2. ✅ Task 45: Create .env.example
3. ✅ Task 46: Fix build warnings
4. ✅ Task 47: Create deployment checklist
5. ✅ Task 37a: Create password validator
6. ✅ Task 41a: Set up Sentry frontend
7. ✅ Task 48: Run npm audit

**Backend Team Actions Required**:
- Review and implement Tasks 36, 38, 40
- Set up Sentry backend (Task 41)

**DevOps Team Actions Required**:
- Configure monitoring (Task 42)
- Set up staging (Task 43)
- Configure backups (Task 44)

---

*This is a comprehensive plan. Proceeding with implementable frontend tasks...*
