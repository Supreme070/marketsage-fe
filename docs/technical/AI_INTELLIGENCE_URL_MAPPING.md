# AI Intelligence URL Mapping Document
## Navigation Restructuring - Phase 1A

**Date:** December 2024  
**Purpose:** Document all URL changes for AI Intelligence section consolidation  
**Status:** PREPARATION PHASE

---

## Current AI Intelligence Structure (BEFORE)

### Sidebar Navigation:
```
AI Intelligence
├── Overview (/ai-intelligence)
├── AI Chat (/ai-chat) ❌ INCONSISTENT PATH
├── Customer Intelligence (/intelligence) ❌ CONFUSING NAME
├── AI Approvals (/approvals) ❌ INCONSISTENT PATH  
├── AI Feedback (/ai-intelligence/feedback)
├── Model Training (/ai-intelligence/model-training)
├── Performance Monitor (/ai-intelligence/performance-monitor)
├── Predictive Analytics (/dashboard/predictive-analytics) ❌ WRONG SECTION
└── Decision Support (/dashboard/decision-support) ❌ WRONG SECTION

ALSO SCATTERED IN OTHER SECTIONS:
├── Task Management (/tasks) ❌ SHOULD BE WITH AI
└── AI Monitoring (/ai-monitoring) ❌ DUPLICATE OF PERFORMANCE MONITOR
```

### Issues Identified:
- ❌ Major path inconsistency: `/ai-intelligence/` vs `/dashboard/` vs standalone
- ❌ Confusing naming: "AI Intelligence" vs "Customer Intelligence"
- ❌ Critical AI features scattered across multiple top-level sections
- ❌ Duplicate functionality (Performance Monitor vs AI Monitoring)
- ❌ No logical grouping by business function

---

## New AI Intelligence Structure (AFTER)

### Proposed Sidebar Navigation:
```
AI Intelligence
├── AI Overview (/ai-intelligence)
├── Supreme Chat (/ai-intelligence/chat)
├── Customer Intelligence (/ai-intelligence/customers)
│   ├── Behavioral Analytics (/ai-intelligence/customers/behavior)
│   ├── Predictive Models (/ai-intelligence/customers/predictive) ✅ MOVED
│   └── Smart Segmentation (/ai-intelligence/customers/segments)
├── Campaign Intelligence (/ai-intelligence/campaigns)
│   ├── Performance Analytics (/ai-intelligence/campaigns/performance)
│   ├── Content Optimization (/ai-intelligence/campaigns/content)
│   └── A/B Test Intelligence (/ai-intelligence/campaigns/testing)
├── Business Intelligence (/ai-intelligence/business)
│   ├── Decision Support (/ai-intelligence/business/decisions) ✅ MOVED
│   ├── Market Analysis (/ai-intelligence/business/market)
│   └── Revenue Intelligence (/ai-intelligence/business/revenue)
└── AI Operations (/ai-intelligence/operations)
    ├── Task Management (/ai-intelligence/operations/tasks) ✅ CONSOLIDATED
    ├── Model Training (/ai-intelligence/operations/training)
    ├── Performance Monitor (/ai-intelligence/operations/monitor)
    └── Approvals & Delegation (/ai-intelligence/operations/approvals)
```

---

## Detailed URL Mapping

### 🔄 **Pages That Need Moving**

| Current URL | New URL | Action Required | Risk Level |
|-------------|---------|-----------------|------------|
| `/ai-chat` | `/ai-intelligence/chat` | Move page file | LOW |
| `/intelligence` | `/ai-intelligence/customers/behavior` | Move & rename | LOW |
| `/approvals` | `/ai-intelligence/operations/approvals` | Move page file | LOW |
| `/dashboard/predictive-analytics` | `/ai-intelligence/customers/predictive` | Move page file | LOW |
| `/dashboard/decision-support` | `/ai-intelligence/business/decisions` | Move page file | LOW |
| `/tasks` | `/ai-intelligence/operations/tasks` | Move page file | MEDIUM |
| `/ai-monitoring` | `/ai-intelligence/operations/monitor` | Consolidate with existing | LOW |

### ✅ **Pages That Stay In Place (with URL updates)**

| Current URL | New URL | Action Required |
|-------------|---------|-----------------|
| `/ai-intelligence` | `/ai-intelligence` | KEEP (Main dashboard) |
| `/ai-intelligence/feedback` | `/ai-intelligence/operations/feedback` | Move to Operations |
| `/ai-intelligence/model-training` | `/ai-intelligence/operations/training` | Rename for consistency |
| `/ai-intelligence/performance-monitor` | `/ai-intelligence/operations/monitor` | Consolidate monitoring |

### 🆕 **New Hub Pages To Create**

| New URL | Purpose | Content Source |
|---------|---------|----------------|
| `/ai-intelligence/customers` | Customer intelligence hub | Consolidate customer AI features |
| `/ai-intelligence/campaigns` | Campaign intelligence hub | AI campaign optimization features |
| `/ai-intelligence/business` | Business intelligence hub | Decision support and market analysis |
| `/ai-intelligence/operations` | AI operations hub | Technical AI management |

---

## File System Changes Required

### **Current File Structure:**
```
src/app/(dashboard)/
├── ai-intelligence/
│   ├── page.tsx ✅ KEEP (Main overview)
│   ├── feedback/page.tsx ❌ MOVE TO OPERATIONS
│   ├── model-training/page.tsx ❌ MOVE TO OPERATIONS
│   └── performance-monitor/page.tsx ❌ CONSOLIDATE
├── ai-chat/page.tsx ❌ MOVE TO AI-INTELLIGENCE
├── intelligence/page.tsx ❌ MOVE TO AI-INTELLIGENCE/CUSTOMERS
├── approvals/page.tsx ❌ MOVE TO AI-INTELLIGENCE/OPERATIONS
├── tasks/page.tsx ❌ MOVE TO AI-INTELLIGENCE/OPERATIONS
├── ai-monitoring/page.tsx ❌ CONSOLIDATE WITH PERFORMANCE
└── dashboard/
    ├── predictive-analytics/page.tsx ❌ MOVE TO AI-INTELLIGENCE
    └── decision-support/page.tsx ❌ MOVE TO AI-INTELLIGENCE
```

### **New File Structure:**
```
src/app/(dashboard)/ai-intelligence/
├── page.tsx ✅ KEEP (Main overview)
├── chat/page.tsx ✅ MOVE FROM /ai-chat
├── customers/
│   ├── page.tsx 🆕 CREATE (Hub page)
│   ├── behavior/page.tsx ✅ MOVE FROM /intelligence
│   ├── predictive/page.tsx ✅ MOVE FROM /dashboard/predictive-analytics
│   └── segments/page.tsx 🆕 CREATE OR REDIRECT
├── campaigns/
│   ├── page.tsx 🆕 CREATE (Hub page)
│   ├── performance/page.tsx 🆕 CREATE OR USE EXISTING
│   ├── content/page.tsx 🆕 CREATE OR USE EXISTING
│   └── testing/page.tsx 🆕 CREATE OR USE EXISTING
├── business/
│   ├── page.tsx 🆕 CREATE (Hub page)
│   ├── decisions/page.tsx ✅ MOVE FROM /dashboard/decision-support
│   ├── market/page.tsx 🆕 CREATE OR USE EXISTING
│   └── revenue/page.tsx 🆕 CREATE OR USE EXISTING
└── operations/
    ├── page.tsx 🆕 CREATE (Hub page)
    ├── tasks/page.tsx ✅ MOVE FROM /tasks
    ├── training/page.tsx ✅ MOVE FROM model-training
    ├── monitor/page.tsx ✅ CONSOLIDATE performance-monitor + ai-monitoring
    ├── approvals/page.tsx ✅ MOVE FROM /approvals
    └── feedback/page.tsx ✅ MOVE FROM /ai-intelligence/feedback
```

---

## Redirect Rules Required

### **For Backward Compatibility:**
```typescript
// In middleware.ts or redirect configuration
const aiIntelligenceRedirects = [
  { from: '/ai-chat', to: '/ai-intelligence/chat' },
  { from: '/intelligence', to: '/ai-intelligence/customers/behavior' },
  { from: '/approvals', to: '/ai-intelligence/operations/approvals' },
  { from: '/tasks', to: '/ai-intelligence/operations/tasks' },
  { from: '/ai-monitoring', to: '/ai-intelligence/operations/monitor' },
  { from: '/dashboard/predictive-analytics', to: '/ai-intelligence/customers/predictive' },
  { from: '/dashboard/decision-support', to: '/ai-intelligence/business/decisions' },
  { from: '/ai-intelligence/feedback', to: '/ai-intelligence/operations/feedback' },
  { from: '/ai-intelligence/model-training', to: '/ai-intelligence/operations/training' },
  { from: '/ai-intelligence/performance-monitor', to: '/ai-intelligence/operations/monitor' }
];
```

---

## Special Considerations

### **Task Management Integration:**
- **High Priority**: `/tasks` is a major section with its own navigation
- **Risk Assessment**: Moving this requires careful testing of task workflows
- **Mitigation**: Implement thorough redirects and test all task-related functionality

### **Dashboard Section Impact:**
- **URLs Moving OUT**: `/dashboard/predictive-analytics`, `/dashboard/decision-support`
- **Verification Needed**: Ensure no other features depend on these dashboard paths
- **Clean-up**: Remove dead links from dashboard navigation

### **API Endpoints:**
- **No API changes required**: All `/api/ai/*` endpoints remain unchanged
- **Frontend-only migration**: Only Next.js routing affected
- **External integrations**: No impact on webhooks or external system callbacks

---

## Components That Need Link Updates

### **Sidebar Navigation:**
- File: `src/components/dashboard/sidebar.tsx`
- Action: Complete restructure of AI Intelligence section

### **Dashboard Quick Links:**
- Search for links to `/ai-chat`, `/intelligence`, `/tasks`, `/approvals`
- Update any dashboard shortcuts or quick access buttons

### **Internal Navigation:**
- Search for hardcoded links to moved AI pages
- Update breadcrumb components in AI-related pages
- Review any cross-references between AI features

### **Campaign Integration:**
- Verify campaign pages that link to AI features
- Update AI insights buttons in campaign interfaces
- Check workflow automation that references AI tasks

---

## Permission & Role Considerations

### **Current Role-Based Access:**
- AI task execution requires ADMIN/IT_ADMIN roles
- AI chat and intelligence available to all users
- Model training restricted to technical roles

### **New Structure Impact:**
- **AI Operations section**: Should be restricted to technical roles
- **Customer/Campaign Intelligence**: Available to business users
- **Business Intelligence**: Executive and manager access
- **Need to verify**: Role-based visibility works with new URLs

---

## Rollback Plan

### **Emergency Rollback Steps:**
1. **Revert sidebar navigation** to original structure
2. **Move all files back** to original locations
3. **Remove redirect middleware**
4. **Restore dashboard section links**
5. **Verify task management functionality**
6. **Check AI operations work correctly**

### **Critical Rollback Files:**
- `src/components/dashboard/sidebar.tsx`
- All moved AI page files with original paths
- `middleware.ts`
- Any updated dashboard navigation components

---

## Testing Checklist

### **Before Migration:**
- [ ] All AI Intelligence URLs load correctly
- [ ] Task management system works properly
- [ ] AI chat responds correctly
- [ ] Predictive analytics display data
- [ ] Decision support tools function
- [ ] AI monitoring dashboards work
- [ ] Model training interfaces accessible
- [ ] Approval workflows function properly

### **After Migration:**
- [ ] All new AI Intelligence URLs load correctly
- [ ] All old URLs redirect properly
- [ ] Task management preserves all functionality
- [ ] AI operations section works end-to-end
- [ ] Cross-references between AI features work
- [ ] Role-based access control maintained
- [ ] No broken internal links
- [ ] Build completes successfully

---

## Success Criteria

### **Navigation Improvements:**
- ✅ All AI features under consistent `/ai-intelligence/` path
- ✅ Business-centric organization (customers, campaigns, business, operations)
- ✅ Clear separation: business users vs technical operations
- ✅ Eliminated duplicate functionality
- ✅ Reduced cognitive load with logical groupings

### **Technical Requirements:**
- ✅ No broken AI functionality
- ✅ All existing URLs work (via redirects)
- ✅ Task management system intact
- ✅ Role-based access preserved
- ✅ Successful application build
- ✅ API endpoints unaffected

---

**Status:** ✅ MAPPING COMPLETE - READY FOR IMPLEMENTATION