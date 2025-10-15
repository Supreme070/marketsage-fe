# MarketSage Rollback Procedures

## Emergency Response Overview

### Rollback Decision Matrix
| Severity | Response Time | Action Required |
|----------|---------------|-----------------|
| 🔴 Critical (P0) | < 5 minutes | Immediate rollback |
| 🟠 High (P1) | < 15 minutes | Evaluate then rollback |
| 🟡 Medium (P2) | < 30 minutes | Fix forward or rollback |
| 🟢 Low (P3) | < 2 hours | Fix forward preferred |

### Rollback Triggers
- **Critical**: System down, data corruption, security breach
- **High**: >5% error rate, >10s response times, auth failures
- **Medium**: Feature breakage, performance degradation
- **Low**: UI issues, minor functionality problems

## Frontend Rollback Procedures

### Next.js Application Rollback

#### Immediate Rollback (< 2 minutes)
```bash
# 1. Route traffic to previous deployment
# Via load balancer or CDN
curl -X POST https://api.railway.app/rollback \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -d '{"service": "marketsage-frontend", "deployment": "previous"}'

# 2. Verify rollback success
curl -I https://app.marketsage.com/api/health
curl -I https://admin.marketsage.com/api/health
```

#### Manual Rollback Process
```bash
# 1. Identify last known good deployment
git log --oneline -10
# Example: abc123f - Last stable release

# 2. Create rollback branch
git checkout abc123f
git checkout -b rollback/frontend-$(date +%Y%m%d-%H%M)

# 3. Deploy previous version
npm run build
npm run deploy:production

# 4. Verify deployment
npm run test:smoke
```

#### Frontend Rollback Verification
- [ ] Main app (app.marketsage.com) loads successfully
- [ ] Admin portal (admin.marketsage.com) accessible
- [ ] Authentication flow working
- [ ] API proxy connections established
- [ ] Critical user paths functional
- [ ] No console errors on key pages

### Frontend-Specific Issues

#### API Proxy Failures
```bash
# Check backend connectivity
curl https://api.marketsage.com/api/v2/health

# Rollback API proxy configuration
git checkout HEAD~1 -- src/lib/api-proxy.ts
npm run build && deploy
```

#### Admin Subdomain Issues
```bash
# Test subdomain routing
curl -H "Host: admin.marketsage.com" https://app.marketsage.com/

# Rollback middleware changes
git checkout HEAD~1 -- src/middleware.ts
npm run build && deploy
```

## Backend Rollback Procedures

### NestJS API Rollback

#### Database-Safe Rollback
```bash
# 1. Check if rollback requires database changes
npx prisma migrate diff \
  --from-url $DATABASE_URL \
  --to-schema-datamodel prisma/schema.prisma

# 2. If no DB changes needed - simple rollback
git checkout $(git log --format="%H" -n 2 | tail -1)
npm run build
npm run deploy:production

# 3. If DB changes needed - create migration
npx prisma migrate deploy --preview-feature
```

#### Critical Backend Rollback (< 5 minutes)
```bash
# 1. Emergency traffic stop
# Route all traffic to maintenance page
curl -X POST $LOAD_BALANCER_API/maintenance-mode

# 2. Rollback application
git checkout $LAST_KNOWN_GOOD_COMMIT
npm run build
npm run start:prod

# 3. Health check
curl https://api.marketsage.com/api/v2/health

# 4. Restore traffic
curl -X DELETE $LOAD_BALANCER_API/maintenance-mode
```

#### Backend Rollback Verification
- [ ] API health endpoint returns 200
- [ ] Database connections working
- [ ] Redis connections established
- [ ] Authentication endpoints responding
- [ ] Core CRUD operations functional
- [ ] Prometheus metrics collection active

### Database Rollback Procedures

#### Schema Rollback
```bash
# 1. Backup current database state
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M).sql

# 2. Identify migration to rollback to
npx prisma migrate status

# 3. Rollback specific migrations
npx prisma migrate resolve --rolled-back "20231201_add_user_table"

# 4. Apply schema changes
npx prisma db push
```

#### Data Corruption Recovery
```bash
# 1. Stop all write operations
# Set database to read-only mode

# 2. Restore from backup
pg_restore -d $DATABASE_URL backup_latest.sql

# 3. Verify data integrity
npm run db:verify

# 4. Resume operations
# Remove read-only mode
```

## Service-Specific Rollback Plans

### Authentication Service Rollback

#### JWT Token Issues
```bash
# 1. Verify token validation endpoint
curl -X POST https://api.marketsage.com/api/v2/auth/verify-token \
  -H "Authorization: Bearer $TEST_TOKEN"

# 2. Rollback auth module
git checkout HEAD~1 -- src/modules/auth/
npm run build && pm2 restart marketsage-backend

# 3. Clear invalid sessions
redis-cli FLUSHDB
```

#### Session Management Rollback
```bash
# 1. Check session storage
redis-cli KEYS "sess:*" | wc -l

# 2. Rollback session configuration
git checkout HEAD~1 -- src/config/session.config.ts
npm run build && pm2 restart marketsage-backend
```

### Admin Portal Rollback

#### Admin Authentication Issues
```bash
# 1. Check admin middleware
curl -H "Host: admin.marketsage.com" \
     -H "Cookie: next-auth.session-token=$ADMIN_TOKEN" \
     https://app.marketsage.com/admin/dashboard

# 2. Rollback admin middleware
git checkout HEAD~1 -- src/middleware.ts
npm run build && deploy

# 3. Verify admin access
npm run test:admin:smoke
```

#### Admin Component Failures
```bash
# 1. Rollback admin components
git checkout HEAD~1 -- src/components/admin/
git checkout HEAD~1 -- src/app/\(admin\)/
npm run build && deploy

# 2. Test admin functionality
npm run test:e2e:admin
```

## Monitoring and Database Rollback

### Prometheus/Grafana Rollback
```bash
# 1. Rollback monitoring stack
cd marketsage-monitoring
git checkout HEAD~1
docker-compose down && docker-compose up -d

# 2. Verify metrics collection
curl http://localhost:9090/api/v1/query?query=up
```

### Database Connection Pool Rollback
```bash
# 1. Reset connection pool configuration
git checkout HEAD~1 -- src/config/database.config.ts
npm run build && pm2 restart marketsage-backend

# 2. Monitor connection health
curl https://api.marketsage.com/api/v2/health/db
```

## Cross-Service Coordination

### Full System Rollback
When multiple services need rollback:

```bash
# 1. Coordinate rollback sequence
echo "Starting coordinated rollback..."

# 2. Backend first (maintain API compatibility)
cd marketsage-backend
git checkout $BACKEND_ROLLBACK_COMMIT
npm run build && pm2 restart marketsage-backend

# 3. Frontend second
cd marketsage-frontend  
git checkout $FRONTEND_ROLLBACK_COMMIT
npm run build && deploy

# 4. Monitor system health
./scripts/health-check-all-services.sh
```

### Partial Rollback Strategy
```bash
# Rollback only affected components
# Example: Admin portal issues
git checkout HEAD~1 -- src/app/\(admin\)/
git checkout HEAD~1 -- src/components/admin/
# Keep main app unchanged
npm run build && deploy
```

## Communication Protocol

### Rollback Communication Template
```
🚨 ROLLBACK INITIATED

Time: [timestamp]
Severity: [P0/P1/P2/P3]
Affected Services: [frontend/backend/database/monitoring]
Reason: [brief description]
ETA: [estimated completion time]

Actions Taken:
- [ ] Traffic routed to previous version
- [ ] Database backup completed
- [ ] Service rollback initiated
- [ ] Health checks passing

Next Steps:
- Monitor system stability for 30 minutes
- Investigate root cause
- Plan fix or alternative approach

Contact: [on-call engineer]
```

### Stakeholder Notifications
- **P0/P1**: Immediate Slack alert + SMS to on-call
- **P2**: Slack notification to team
- **P3**: Standard team communication

## Rollback Testing

### Pre-Production Rollback Tests
```bash
# Monthly rollback drill
npm run test:rollback:frontend
npm run test:rollback:backend
npm run test:rollback:database
npm run test:rollback:full-system
```

### Rollback Success Criteria
- [ ] All services return to green status
- [ ] Error rates below baseline
- [ ] Response times within SLA
- [ ] No data loss detected
- [ ] User-facing functionality restored

## Post-Rollback Procedures

### Immediate Actions (0-30 minutes)
- [ ] Verify all systems operational
- [ ] Monitor error rates and performance
- [ ] Communicate status to stakeholders
- [ ] Document rollback decision and actions

### Short-term Actions (1-24 hours)
- [ ] Conduct rollback post-mortem
- [ ] Identify root cause of original issue
- [ ] Create plan for fix or alternative approach
- [ ] Update rollback procedures if needed

### Long-term Actions (1-7 days)
- [ ] Implement permanent fix
- [ ] Update testing procedures to prevent recurrence
- [ ] Review and improve rollback automation
- [ ] Share learnings with team

## Emergency Contacts

### Rollback Authorization
- **P0 Rollbacks**: Any on-call engineer
- **P1 Rollbacks**: Team lead approval preferred
- **P2/P3 Rollbacks**: Standard approval process

### On-Call Schedule
```
Primary: [Engineer Name] - [Phone] - [Slack]
Secondary: [Engineer Name] - [Phone] - [Slack]
Escalation: [Team Lead] - [Phone] - [Slack]
```

---

## Rollback Playbook Quick Reference

### Critical System Down (P0)
1. Route traffic to maintenance page (30 seconds)
2. Rollback to last known good state (2 minutes)
3. Verify health endpoints (1 minute)
4. Restore traffic (30 seconds)
5. Monitor for 30 minutes

### Performance Issues (P1)
1. Identify affected service (1 minute)
2. Check if rollback needed vs fix-forward (5 minutes)
3. Execute rollback if decided (5 minutes)
4. Monitor performance metrics (15 minutes)

### Feature Issues (P2)
1. Assess user impact (5 minutes)
2. Decide rollback vs disable feature (10 minutes)
3. Execute chosen approach (10 minutes)
4. Communicate to users if needed (5 minutes)

Remember: **Better to rollback quickly than to fix forward slowly when users are impacted.**