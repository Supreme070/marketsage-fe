# Frontend Prisma Removal Plan

## 🎯 **Strategy: Replace Direct DB Access with API Calls**

### **Files to Keep Prisma (Backend/Infrastructure):**

#### MCP Servers (5 files) - KEEP
- `/mcp/servers/campaign-analytics-server.ts`
- `/mcp/servers/customer-data-server.ts` 
- `/mcp/servers/leadpulse-server.ts`
- `/mcp/servers/external-services-server.ts`
- `/mcp/servers/monitoring-server.ts`

#### Scripts & Utilities (40+ files) - KEEP
- All `/scripts/*` files (seeding, migration, utilities)
- All `/__tests__/*` files (test setup and seeding)
- `/lib/prisma.ts` - Base Prisma client

### **Files to Remove Prisma (Frontend):**

#### High Priority Frontend Components (10 files)
- `/lib/auth/auth-options.ts` → Use `/api/v2/auth/*`
- `/lib/auth/enterprise-auth.ts` → Use `/api/v2/auth/*`
- `/components/auth/role-based-component.tsx` → Use API calls
- `/components/dashboard/ConversionMetrics.tsx` → Use `/api/v2/analytics/*`

#### Critical Frontend Lib Files (30+ files)
- `/lib/smart-segmentation.ts` → Use `/api/v2/segments/*`
- `/lib/ab-testing.ts` → Use `/api/v2/campaigns/ab-test/*`
- `/lib/engagement-tracking.ts` → Use `/api/v2/leadpulse/analytics/*`
- `/lib/enhanced-conversions.ts` → Use `/api/v2/conversions/*`
- `/lib/subscription-service.ts` → Use `/api/v2/subscriptions/*`

#### LeadPulse Frontend Files (15+ files)
- `/lib/leadpulse/formBuilder.ts` → Use `/api/v2/leadpulse/forms/*`
- `/lib/leadpulse/visitorTracking.ts` → Use `/api/v2/leadpulse/visitors/*`
- `/lib/leadpulse/conversion-bridge.ts` → Use `/api/v2/leadpulse/conversions/*`
- `/lib/leadpulse/attribution-service.ts` → Use `/api/v2/leadpulse/attribution/*`

#### Workflow & Campaign Files (20+ files)
- `/lib/workflow/execution-engine.ts` → Use `/api/v2/workflows/execute/*`
- `/lib/workflow/advanced-trigger-engine.ts` → Use `/api/v2/workflows/triggers/*`
- `/lib/sms-providers/sms-service.ts` → Use `/api/v2/sms/*`
- `/lib/messaging/unified-messaging-service.ts` → Use `/api/v2/messaging/*`

## 🔄 **Replacement Strategy:**

### Phase 1: Core Authentication & User Management
Replace direct Prisma calls in auth-related files with `/api/v2/auth/*` endpoints

### Phase 2: Campaign & Communication
Replace messaging, SMS, email, and campaign files with `/api/v2/campaigns/*`, `/api/v2/email/*`, `/api/v2/sms/*`

### Phase 3: LeadPulse & Analytics  
Replace visitor tracking and analytics with `/api/v2/leadpulse/*` endpoints

### Phase 4: Workflows & Advanced Features
Replace workflow execution and advanced features with `/api/v2/workflows/*`

## ✅ **Success Criteria:**
- Frontend components use only API calls
- No direct database imports in `/components/*` or frontend `/lib/*` files
- MCP servers and scripts retain Prisma access
- All functionality works through `/api/v2/*` endpoints