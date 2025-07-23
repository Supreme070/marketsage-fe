# LeadPulse URL Mapping Document
## Navigation Restructuring - Phase 1A

**Date:** December 2024  
**Purpose:** Document all URL changes for LeadPulse section consolidation  
**Status:** PREPARATION PHASE

---

## Current LeadPulse Structure (BEFORE)

### Sidebar Navigation:
```
LeadPulse
├── Main Dashboard (/leadpulse)
├── Analytics (/leadpulse/analytics)
├── Funnel Analytics (/analytics/funnels) ❌ INCONSISTENT PATH
├── Real-Time Analytics (/analytics/realtime) ❌ INCONSISTENT PATH
├── Lead Management (/leadpulse/lead-management)
├── Setup (/leadpulse/setup)
└── Conversion Tracking (/conversions) ❌ INCONSISTENT PATH
```

### Issues Identified:
- ❌ Path inconsistency: `/leadpulse/` vs `/analytics/` vs `/conversions`
- ❌ Related features scattered across different sections
- ❌ Cognitive overload with 7 top-level items

---

## New LeadPulse Structure (AFTER)

### Proposed Sidebar Navigation:
```
LeadPulse
├── Overview Dashboard (/leadpulse)
├── Visitor Intelligence (/leadpulse/visitors)
│   ├── Live Visitor Tracking (/leadpulse/visitors/live)
│   ├── Behavioral Scoring (/leadpulse/visitors/scoring)
│   ├── Customer Journeys (/leadpulse/visitors/journeys)
│   └── Lead Management (/leadpulse/visitors/leads)
├── Analytics Hub (/leadpulse/analytics)
│   ├── Traffic Analytics (/leadpulse/analytics/traffic)
│   ├── Conversion Funnels (/leadpulse/analytics/funnels) ✅ MOVED
│   ├── Real-time Analytics (/leadpulse/analytics/realtime) ✅ MOVED
│   └── Heatmap Analysis (/leadpulse/analytics/heatmaps)
├── Forms & Conversions (/leadpulse/forms)
│   ├── Form Builder (/leadpulse/forms/builder)
│   ├── Form Analytics (/leadpulse/forms/analytics)
│   ├── Conversion Tracking (/leadpulse/forms/conversions) ✅ MOVED
│   └── A/B Testing (/leadpulse/forms/testing)
└── Setup & Integration (/leadpulse/setup)
```

---

## Detailed URL Mapping

### 🔄 **Pages That Need Moving**

| Current URL | New URL | Action Required | Risk Level |
|-------------|---------|-----------------|------------|
| `/analytics/funnels` | `/leadpulse/analytics/funnels` | Move page file | LOW |
| `/analytics/realtime` | `/leadpulse/analytics/realtime` | Move page file | LOW |
| `/conversions` | `/leadpulse/forms/conversions` | Move page file | LOW |
| `/leadpulse/lead-management` | `/leadpulse/visitors/leads` | Move page file | LOW |

### ✅ **Pages That Stay In Place**

| Current URL | Status | Notes |
|-------------|--------|-------|
| `/leadpulse` | KEEP | Main dashboard stays as root |
| `/leadpulse/analytics` | KEEP | Already correctly placed |
| `/leadpulse/setup` | KEEP | Already correctly placed |

### 🆕 **New Hub Pages To Create**

| New URL | Purpose | Content Source |
|---------|---------|----------------|
| `/leadpulse/visitors` | Visitor intelligence hub | Consolidate visitor-related features |
| `/leadpulse/forms` | Forms and conversions hub | Consolidate form-related features |

---

## File System Changes Required

### **Current File Structure:**
```
src/app/(dashboard)/
├── analytics/
│   ├── funnels/page.tsx ❌ MOVE TO LEADPULSE
│   └── realtime/page.tsx ❌ MOVE TO LEADPULSE
├── conversions/page.tsx ❌ MOVE TO LEADPULSE
├── leadpulse/
│   ├── page.tsx ✅ KEEP
│   ├── analytics/page.tsx ✅ KEEP
│   ├── lead-management/page.tsx ❌ REORGANIZE
│   └── setup/page.tsx ✅ KEEP
```

### **New File Structure:**
```
src/app/(dashboard)/leadpulse/
├── page.tsx ✅ KEEP (Main dashboard)
├── visitors/
│   ├── page.tsx 🆕 CREATE (Hub page)
│   ├── live/page.tsx 🆕 CREATE OR REDIRECT
│   ├── scoring/page.tsx 🆕 CREATE OR REDIRECT  
│   ├── journeys/page.tsx 🆕 CREATE OR REDIRECT
│   └── leads/page.tsx ✅ MOVE FROM lead-management
├── analytics/
│   ├── page.tsx ✅ KEEP (Current analytics)
│   ├── traffic/page.tsx 🆕 CREATE OR USE EXISTING
│   ├── funnels/page.tsx ✅ MOVE FROM /analytics/funnels
│   ├── realtime/page.tsx ✅ MOVE FROM /analytics/realtime
│   └── heatmaps/page.tsx 🆕 CREATE OR USE EXISTING
├── forms/
│   ├── page.tsx 🆕 CREATE (Hub page)
│   ├── builder/page.tsx 🆕 CREATE OR REDIRECT
│   ├── analytics/page.tsx 🆕 CREATE OR USE EXISTING
│   ├── conversions/page.tsx ✅ MOVE FROM /conversions
│   └── testing/page.tsx 🆕 CREATE OR REDIRECT
└── setup/page.tsx ✅ KEEP
```

---

## Redirect Rules Required

### **For Backward Compatibility:**
```typescript
// In middleware.ts or redirect configuration
const leadPulseRedirects = [
  { from: '/analytics/funnels', to: '/leadpulse/analytics/funnels' },
  { from: '/analytics/realtime', to: '/leadpulse/analytics/realtime' },
  { from: '/conversions', to: '/leadpulse/forms/conversions' },
  { from: '/leadpulse/lead-management', to: '/leadpulse/visitors/leads' }
];
```

---

## Components That Need Link Updates

### **Sidebar Navigation:**
- File: `src/components/dashboard/sidebar.tsx`
- Action: Update LeadPulse submenu structure

### **Internal Navigation Links:**
- Search for hardcoded links to `/analytics/funnels`
- Search for hardcoded links to `/analytics/realtime` 
- Search for hardcoded links to `/conversions`
- Search for hardcoded links to `/leadpulse/lead-management`

### **Breadcrumb Components:**
- Update any breadcrumb navigation in affected pages
- Ensure proper parent-child relationship display

---

## Rollback Plan

### **Emergency Rollback Steps:**
1. **Revert sidebar navigation** to original structure
2. **Move files back** to original locations
3. **Remove redirect middleware** 
4. **Restore original internal links**

### **Rollback Files to Backup:**
- `src/components/dashboard/sidebar.tsx` (current version)
- Any moved page files with their original paths
- `middleware.ts` (current version)

---

## Testing Checklist

### **Before Migration:**
- [ ] All current LeadPulse URLs load correctly
- [ ] All navigation links work properly
- [ ] All API endpoints respond correctly
- [ ] Build completes successfully

### **After Migration:**
- [ ] All new LeadPulse URLs load correctly
- [ ] All old URLs redirect properly
- [ ] Navigation flows work end-to-end
- [ ] No broken internal links
- [ ] Build completes successfully

---

## Success Criteria

### **Navigation Improvements:**
- ✅ All LeadPulse features under consistent `/leadpulse/` path
- ✅ Logical grouping of related features
- ✅ Reduced cognitive load (5 main categories vs 7 scattered items)
- ✅ Better feature discoverability

### **Technical Requirements:**
- ✅ No broken functionality
- ✅ All existing URLs work (via redirects)
- ✅ Clean, maintainable code structure
- ✅ Successful application build

---

**Status:** ✅ MAPPING COMPLETE - READY FOR IMPLEMENTATION