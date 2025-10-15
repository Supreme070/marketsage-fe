# MIGRATION PRIORITY MATRIX
**MarketSage - Week-by-Week Route Migration Plan**
**Generated:** 2025-10-03
**Task:** 4 of 94 (MASTER_MIGRATION_PLAN.md)
**Ref:** PRISMA_USAGE_REPORT.md, BACKEND_API_COVERAGE_REPORT.md

---

## EXECUTIVE SUMMARY

### Timeline Overview
📅 **Start Date**: Week 1 (Current)
📅 **End Date**: Week 11
⏱️ **Total Duration**: 11 weeks
👥 **Team Size**: 1-2 developers
🎯 **Success Criteria**: Zero Prisma imports in frontend

### Priority Levels
🔴 **CRITICAL**: Authentication, core user flows (must work)
🟠 **HIGH**: Revenue features, customer management (business-critical)
🟡 **MEDIUM**: Analytics, AI features (important but not blocking)
🟢 **LOW**: Admin tools, supporting features (nice-to-have)

### Current Status
✅ **Week 1 Complete**: Tasks 1-3 done (API-only mode, audits)
🔄 **Week 1 In Progress**: Task 4 (this document) + Task 5 (build endpoints)
⏳ **Week 2 Next**: Begin authentication migration

---

## MIGRATION DEPENDENCY CHART

```
Week 1: Foundation (Audit + Build)
   ↓
Week 2: Authentication ← CRITICAL (all other features depend on this)
   ↓
Week 3-5: High-Priority Features (parallel tracks)
   ├── LeadPulse (Week 3)
   ├── Contacts (Week 4)
   └── Campaigns (Week 5)
   ↓
Week 6-10: Medium-Priority Features (parallel tracks)
   ├── Admin (Week 6-7)
   ├── AI/ML (Week 8)
   └── Supporting modules (Week 9-10)
   ↓
Week 11: Cleanup & Launch
```

---

## WEEK-BY-WEEK BREAKDOWN

### WEEK 1: Foundation & Preparation ✅🔄
**Status**: Partially complete
**Risk Level**: 🟢 LOW

#### Completed Tasks ✅
- [x] Task 1: Enable API-only mode (IMMEDIATE SAFETY) - 30 minutes
- [x] Task 2: Audit all frontend routes - 16 hours
- [x] Task 3: Document backend API coverage - 8 hours

#### Current Task 🔄
- [ ] Task 4: Create migration priority matrix (this document) - 4 hours
- [ ] Task 5: Build missing backend endpoints - 24 hours
  - [ ] CRM integrations (8h)
  - [ ] Content analysis (4h)
  - [ ] Churn predictions (6h)
  - [ ] Action plans (6h)

**Total Week 1**: 52.5 hours
**Deliverables**:
- ✅ PRISMA_USAGE_REPORT.md
- ✅ BACKEND_API_COVERAGE_REPORT.md
- 🔄 MIGRATION_PRIORITY_MATRIX.md (this)
- ⏳ 4 new backend endpoints

**Exit Criteria**:
- All 4 missing endpoints deployed and tested
- Migration plan approved by stakeholders
- Team ready to start Week 2 (auth migration)

---

### WEEK 2: Authentication Migration 🔴 CRITICAL
**Priority**: CRITICAL
**Risk Level**: 🔴 HIGH (affects all user flows)
**Dependencies**: None (foundation for everything else)

#### Routes to Migrate (10 routes)
```
Frontend                        Backend                          Method
/api/auth/register        →    /api/v2/auth/register             POST
/api/auth/login           →    /api/v2/auth/login                POST
/api/auth/profile         →    /api/v2/auth/profile              GET
/api/auth/refresh         →    /api/v2/auth/refresh              POST
/api/auth/logout          →    /api/v2/auth/logout               POST
/api/auth/register/initial →   /api/v2/auth/register/initial     POST
/api/auth/register/verify →    /api/v2/auth/register/verify      POST
/api/auth/register/complete →  /api/v2/auth/register/complete    POST
/api/auth/forgot-password →    /api/v2/auth/forgot-password      POST
/api/auth/reset-password  →    /api/v2/auth/reset-password       POST
```

#### Implementation Plan
**Task 6**: Migrate /api/auth/* routes to backend proxy (24 hours)
- Hour 0-4: Update auth routes to use `proxyToNestJS()`
- Hour 4-8: Test login flow end-to-end
- Hour 8-12: Test registration flow (all 3 steps)
- Hour 12-16: Test password reset flow
- Hour 16-20: Test token refresh and logout
- Hour 20-24: Error handling and edge cases

**Task 7**: Test authentication flow end-to-end (4 hours)
- Hour 0-1: New user registration (all steps)
- Hour 1-2: Login with email/password
- Hour 2-3: Password reset flow
- Hour 3-4: Token refresh and session expiry

#### Testing Checklist
- [ ] User can register (initial → verify → complete)
- [ ] User can login with email/password
- [ ] User can view profile
- [ ] User can refresh token
- [ ] User can logout
- [ ] User can request password reset
- [ ] User can complete password reset
- [ ] Invalid credentials return proper errors
- [ ] Rate limiting works (3 attempts/hour for registration)
- [ ] JWT tokens are valid and secure

#### Rollback Plan
If critical issues:
1. Revert auth routes to direct Prisma access
2. Set `NEXT_PUBLIC_USE_API_ONLY=false`
3. Restart frontend
4. Investigate backend issues
5. Fix and redeploy

**Total Week 2**: 28 hours
**Success Metrics**: 100% of users can authenticate without issues

---

### WEEK 3: LeadPulse & CRM Integrations 🟠 HIGH
**Priority**: HIGH (revenue feature)
**Risk Level**: 🟡 MEDIUM
**Dependencies**: Authentication (Week 2)

#### Routes to Migrate (53 routes)
Main modules:
- `/api/leadpulse/*` (50 routes) - Visitor tracking, forms, insights
- `/api/leadpulse/integrations/crm/*` (3 routes) - **Prisma violation fix**

#### Implementation Plan
**Task 20**: Migrate /api/leadpulse/* routes to backend proxy (120 hours)

**Day 1-2** (16h): Core tracking
- Visitor tracking endpoints (POST /visitors, GET /visitors)
- Session tracking (POST /sessions, GET /sessions)
- Touchpoint tracking (POST /touchpoints)

**Day 3-4** (16h): Forms
- Form CRUD (POST, GET, PUT, DELETE /forms)
- Form submissions (POST /forms/submit, GET /submissions)

**Day 5-6** (16h): Insights
- Insights CRUD (POST, GET, DELETE /insights)
- AI insights generation (POST /insights/generate)

**Day 7-8** (16h): CRM Integrations **← PRISMA FIX**
- GET /users/:userId/crm-integrations
- PUT /users/:userId/crm-integrations
- DELETE /users/:userId/crm-integrations/:integrationId

**Day 9-10** (16h): Analytics & Heatmaps
- Heatmap data (GET /heatmap)
- Conversion funnels (GET /funnels)
- Behavioral analytics (GET /analytics)

**Day 11-12** (16h): Advanced Features
- Lead scoring (POST /lead-scoring)
- Intent detection (POST /intent-detection)
- Progressive profiling (POST /progressive-profile)

**Day 13-15** (24h): Testing & Optimization
- E2E testing with 1000+ visitors
- Performance testing (tracking pixel load time < 100ms)
- GDPR compliance verification

**Task 21**: Test LeadPulse visitor tracking after migration (8 hours)
- Test visitor identification
- Test form submissions
- Test CRM sync
- Test insights generation

**Total Week 3**: 128 hours (10+ days if 1 developer, 6 days if 2 developers)
**Success Metrics**: LeadPulse tracks 100% of visitors without data loss

---

### WEEK 4: Contacts & Segmentation 🟠 HIGH
**Priority**: HIGH (core CRM feature)
**Risk Level**: 🟡 MEDIUM
**Dependencies**: Authentication (Week 2)

#### Routes to Migrate (10 routes)
```
Frontend                      Backend                        Method
/api/contacts              → /api/v2/contacts                GET, POST
/api/contacts/:id          → /api/v2/contacts/:id           GET, PUT, DELETE
/api/contacts/import       → /api/v2/contacts/import        POST
/api/contacts/export       → /api/v2/contacts/export        GET
/api/segments              → /api/v2/segments               GET, POST
/api/segments/:id          → /api/v2/segments/:id           GET, PUT, DELETE
```

#### Implementation Plan
**Task 10**: Migrate /api/contacts/* routes to backend proxy (24 hours)
- Hour 0-8: Contact CRUD operations
- Hour 8-16: Bulk import/export functionality
- Hour 16-24: Segmentation logic

**Task 11**: Test contact management with 1000+ contacts (4 hours)
- Import 1000 contacts
- Verify all fields imported correctly
- Test segmentation rules
- Export and verify data integrity

**Total Week 4**: 28 hours
**Success Metrics**: Can manage 10k+ contacts without performance degradation

---

### WEEK 5: Campaign Management 🟠 HIGH
**Priority**: HIGH (revenue feature)
**Risk Level**: 🟡 MEDIUM
**Dependencies**: Contacts (Week 4), Authentication (Week 2)

#### Routes to Migrate (40 routes)
```
Frontend                          Backend                            Method
/api/campaigns                 → /api/v2/campaigns                  GET, POST
/api/campaigns/:id             → /api/v2/campaigns/:id             GET, PATCH, DELETE
/api/campaigns/:id/send        → /api/v2/campaigns/:id/send        POST
/api/campaigns/:id/analytics   → /api/v2/campaigns/:id/analytics   GET
/api/campaigns/email/*         → /api/v2/campaigns/email/*         Multiple
/api/campaigns/sms/*           → /api/v2/campaigns/sms/*           Multiple
/api/campaigns/whatsapp/*      → /api/v2/campaigns/whatsapp/*      Multiple
```

#### Implementation Plan
**Task 12**: Migrate /api/campaigns/email/* routes (16 hours)
**Task 13**: Migrate /api/campaigns/sms/* routes (16 hours)
**Task 14**: Migrate /api/campaigns/whatsapp/* routes (16 hours)
**Task 15**: Test all campaign types after migration (8 hours)

**Total Week 5**: 56 hours
**Success Metrics**: All campaigns send successfully with 99.5%+ delivery rate

---

### WEEK 6-7: Admin & Workflows 🟡 MEDIUM
**Priority**: MEDIUM (operational features)
**Risk Level**: 🟢 LOW
**Dependencies**: Authentication (Week 2)

#### Routes to Migrate (54 routes)
- `/api/admin/*` (49 routes)
- `/api/workflows/*` (5 routes)

#### Implementation Plan
**Task 24**: Migrate /api/admin/* routes (40 hours)
- Day 1-2: User management admin routes
- Day 3-4: Billing & subscription admin
- Day 5: Security & audit logs

**Task 16**: Migrate /api/workflows/* routes (24 hours)
**Task 17**: Test workflow execution (4 hours)

**Total Week 6-7**: 68 hours
**Success Metrics**: Admins can manage all aspects without issues

---

### WEEK 8: AI & ML Features 🟡 MEDIUM
**Priority**: MEDIUM (intelligence features)
**Risk Level**: 🟡 MEDIUM
**Dependencies**: Contacts (Week 4), Campaigns (Week 5)

#### Routes to Migrate (79 routes)
- `/api/ai/*` (71 routes)
- `/api/ai-features/*` (4 routes) - **Prisma violation fix**
- `/api/ml/*` (4 routes) - **Prisma violation fix**

#### Implementation Plan
**Day 1-2** (16h): Core AI endpoints
- AI chat (POST /ai/chat)
- AI analysis (POST /ai/analyze)
- AI predictions (POST /ai/predict)

**Day 3** (8h): Content Intelligence **← PRISMA FIX**
- Content analysis history (GET /ai/content-analysis)
- Sentiment analysis (POST /ai/sentiment)

**Day 4** (8h): Churn Prediction **← PRISMA FIX**
- Churn predictions (GET /ml/churn-predictions)
- Batch predictions (POST /ml/churn-predictions/batch)

**Day 5** (8h): Action Plans **← PRISMA FIX**
- Action plan updates (PUT /ai/action-plans/:id)
- Action plan queries (GET /ai/action-plans)

**Task 22**: Migrate /api/ai/* routes (40 hours)
**Total Week 8**: 48 hours
**Success Metrics**: All AI features work with <2s response time

---

### WEEK 9-10: Supporting Modules 🟢 LOW
**Priority**: LOW (supporting features)
**Risk Level**: 🟢 LOW
**Dependencies**: Various

#### Routes to Migrate (~50 routes)
- `/api/analytics/*` (16h)
- `/api/billing/*` (16h)
- `/api/messaging/*` (8h)
- `/api/integrations/*` (16h)
- `/api/webhooks/*` (8h)
- Other misc routes (16h)

**Task 18-19**: Migrate analytics routes (20 hours)
**Task 23**: Migrate billing routes (16 hours)
**Task 25**: Migrate remaining routes (44 hours)

**Total Week 9-10**: 80 hours
**Success Metrics**: All routes migrated, zero Prisma usage

---

### WEEK 11: Cleanup & Launch 🎯 CRITICAL
**Priority**: CRITICAL (production readiness)
**Risk Level**: 🔴 HIGH (final cleanup)
**Dependencies**: All migrations complete

#### Final Cleanup Tasks
**Task 26**: Run comprehensive E2E tests (16 hours)
- Full user journey testing
- Load testing (1000 concurrent users)
- Security testing (OWASP Top 10)

**Task 27**: Verify zero Prisma imports (2 hours)
```bash
grep -r "from '@/lib/db/prisma'" src/app/api/
# Expected output: nothing
```

**Task 28**: Uninstall Prisma from frontend (1 hour)
```bash
npm uninstall @prisma/client prisma
```

**Task 29**: Delete /prisma/ directory (1 hour)
```bash
rm -rf prisma/
```

**Task 30**: Delete /src/lib/db/prisma.ts (1 hour)
```bash
rm src/lib/db/prisma.ts
```

**Task 31**: Remove DATABASE_URL from .env.local (1 hour)
```bash
# Remove this line from .env.local:
# DATABASE_URL="postgresql://..."
```

**Task 32**: Remove NEXT_PUBLIC_USE_API_ONLY flag (1 hour)
```bash
# Remove this line from .env.local:
# NEXT_PUBLIC_USE_API_ONLY=true
```

**Task 33**: Run frontend build and verify no Prisma errors (4 hours)
```bash
npm run build
# Should complete without Prisma errors
```

**Task 34**: Full regression testing (16 hours)
- Test every major feature
- Verify data integrity
- Check performance metrics
- Security audit

**Task 35**: Document migration (8 hours)
- Create MIGRATION_COMPLETE.md
- Update CHANGELOG.md
- Document new proxy patterns

**Total Week 11**: 51 hours
**Success Metrics**: Zero Prisma, 100% test pass rate, production ready

---

## RISK ASSESSMENT MATRIX

| Phase | Risk Level | Impact if Failed | Mitigation Strategy |
|-------|-----------|-----------------|---------------------|
| Week 1: Foundation | 🟢 LOW | Delayed start | Already 90% complete |
| Week 2: Authentication | 🔴 HIGH | No user access | Keep old routes active, feature flag |
| Week 3: LeadPulse | 🟡 MEDIUM | Lost tracking data | Backup tracking to Redis |
| Week 4: Contacts | 🟡 MEDIUM | CRM data issues | Database backups before migration |
| Week 5: Campaigns | 🟡 MEDIUM | Failed sends | Queue retry mechanism |
| Week 6-7: Admin | 🟢 LOW | Admin inconvenience | Low user impact |
| Week 8: AI/ML | 🟡 MEDIUM | Degraded intelligence | Graceful fallbacks |
| Week 9-10: Supporting | 🟢 LOW | Minor features | Low priority |
| Week 11: Cleanup | 🔴 HIGH | Cannot launch | Thorough testing before deletion |

---

## TESTING CHECKPOINTS

### After Each Module Migration
1. **Smoke Test** (30 min): Basic functionality works
2. **Integration Test** (2 hours): Connects with other modules
3. **Performance Test** (1 hour): Response time < 500ms
4. **Security Test** (1 hour): Auth guards working

### After Each Week
1. **Weekly Review** (2 hours): Team meeting to review progress
2. **Stakeholder Demo** (1 hour): Show completed features
3. **Regression Test** (4 hours): Ensure nothing broke

### Before Production (Week 11)
1. **Full E2E Test** (16 hours): Complete user journeys
2. **Load Test** (4 hours): 1000 concurrent users
3. **Security Audit** (8 hours): Penetration testing
4. **Performance Audit** (4 hours): Optimize bottlenecks
5. **Data Integrity** (4 hours): Verify no data loss
6. **Rollback Test** (2 hours): Verify can revert if needed

---

## ROLLBACK PROCEDURES

### Per-Route Rollback (If specific route fails)
```typescript
// Option 1: Keep old route alongside new (recommended)
// frontend/src/app/api/auth/login/route.ts (old - keep temporarily)
export async function POST(request: NextRequest) {
  if (process.env.USE_NEW_AUTH === 'true') {
    return proxyToNestJS(request); // New way
  } else {
    // Old Prisma way (fallback)
  }
}

// Option 2: Quick revert via environment variable
NEXT_PUBLIC_USE_API_ONLY=false  # Revert to Prisma
```

### Module Rollback (If entire module fails)
1. Set feature flag to disable new routes
2. Re-enable old routes
3. Restart frontend
4. Investigate backend issues
5. Fix and redeploy

### Full Rollback (If critical production issues)
1. **STOP**: Halt all migrations
2. **REVERT**: Set `NEXT_PUBLIC_USE_API_ONLY=false`
3. **RESTART**: Restart frontend and backend
4. **INVESTIGATE**: Root cause analysis
5. **FIX**: Address issues in staging
6. **RESUME**: Restart migration after fixes

---

## SUCCESS METRICS

### Technical Metrics
- ✅ **Zero Prisma imports** in `/src/app/api/`
- ✅ **Zero DATABASE_URL** in frontend .env
- ✅ **100% routes proxied** to backend
- ✅ **No Prisma dependencies** in package.json

### Performance Metrics
- 🎯 **API response time**: < 500ms p95
- 🎯 **Proxy overhead**: < 50ms
- 🎯 **Database connections**: Frontend = 0
- 🎯 **Error rate**: < 0.1%

### Business Metrics
- 🎯 **Zero downtime** during migration
- 🎯 **Zero data loss**
- 🎯 **100% feature parity** (no regressions)
- 🎯 **User satisfaction**: No complaints about performance

---

## RESOURCE ALLOCATION

### Team Composition
- **1 Senior Developer** (full-time, 11 weeks)
  - OR
- **2 Mid-Level Developers** (full-time, 6 weeks)

### Time Allocation
| Week | Hours | Focus |
|------|-------|-------|
| Week 1 | 52.5h | Foundation (audits + build) |
| Week 2 | 28h | Authentication (critical) |
| Week 3 | 128h | LeadPulse (large module) |
| Week 4 | 28h | Contacts |
| Week 5 | 56h | Campaigns |
| Week 6-7 | 68h | Admin + Workflows |
| Week 8 | 48h | AI/ML |
| Week 9-10 | 80h | Supporting modules |
| Week 11 | 51h | Cleanup + Launch |
| **TOTAL** | **539.5h** | ~13.5 weeks @ 40h/week |

### Adjusted Timeline (Single Developer)
- **Original Plan**: 11 weeks
- **Actual Estimate**: 13.5 weeks (accounting for testing and unexpected issues)
- **With 2 Developers**: 7-8 weeks (parallel work on Weeks 3-10)

---

## COMMUNICATION PLAN

### Daily Standups (15 min)
- What was completed yesterday
- What's planned for today
- Any blockers or risks

### Weekly Reviews (2 hours)
- Demo completed migrations to stakeholders
- Review test results
- Adjust timeline if needed

### Milestone Reports
After each major phase:
1. **Week 1**: Foundation complete
2. **Week 2**: Authentication migrated ✅
3. **Week 5**: High-priority features migrated ✅
4. **Week 8**: AI features migrated ✅
5. **Week 11**: LAUNCH READY 🚀

---

## DEPENDENCIES & PREREQUISITES

### Before Starting Each Week
| Week | Prerequisites | Verification |
|------|--------------|--------------|
| 1 | None | — |
| 2 | Week 1 complete, 4 endpoints built | `curl http://localhost:3006/api/v2/health` |
| 3 | Week 2 complete, auth working | User can login |
| 4 | Week 2 complete | User can login |
| 5 | Week 4 complete, contacts ready | Contacts visible in UI |
| 6-7 | Week 2 complete | Admin can access admin panel |
| 8 | Week 4-5 complete, data available | AI has data to analyze |
| 9-10 | No hard dependencies | — |
| 11 | All migrations complete | `grep -r "prisma\\." src/app/api/` returns empty |

---

## PARALLEL WORK OPPORTUNITIES

If 2 developers are available, these can run in parallel:

### Week 3-5 (Parallel Track)
- **Developer 1**: LeadPulse migration (Week 3)
- **Developer 2**: Contacts migration (Week 4)
- **Both**: Campaigns migration (Week 5)

### Week 6-10 (Parallel Track)
- **Developer 1**: Admin routes (Week 6-7)
- **Developer 2**: AI/ML routes (Week 8)
- **Both**: Supporting modules (Week 9-10)

**Time Savings**: 4-5 weeks if using 2 developers

---

## CONCLUSION

### Migration Path Summary
✅ **Week 1**: Foundation (CURRENT)
🔜 **Week 2**: Authentication (NEXT)
📅 **Week 3-10**: Feature migrations (PHASED)
🚀 **Week 11**: Launch (CLEANUP)

### Key Success Factors
1. ✅ **Build 4 missing endpoints first** (Task 5, Week 1)
2. ✅ **Migrate auth before everything** (Week 2)
3. ✅ **Test thoroughly after each module**
4. ✅ **Keep rollback options available**
5. ✅ **Zero downtime for users**

### Next Steps
1. Complete Task 4 (this document) ✅
2. Begin Task 5 (build 4 endpoints) - 24 hours
3. Week 2 kickoff (auth migration)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Next Review**: Start of Week 2
**Owner**: MarketSage Engineering Team
**Status**: 📋 APPROVED FOR EXECUTION
