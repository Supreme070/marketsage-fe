# EMERGENCY ROLLBACK PLAN
## Navigation Restructuring Safety Plan

**Date:** December 2024  
**Purpose:** Comprehensive rollback procedure in case of issues  
**Execution Time:** < 5 minutes  

---

## 🚨 **WHEN TO EXECUTE ROLLBACK**

Execute this rollback immediately if any of the following occur:
- Application fails to build
- Critical navigation links are broken
- Pages return 404 errors
- API endpoints fail unexpectedly
- User-reported navigation issues
- Any functionality degradation

---

## 📋 **PRE-MIGRATION CHECKLIST (COMPLETED)**

### ✅ **Backup Files Created:**
- [x] Original sidebar navigation backed up to `/backup/navigation-backup.tsx`
- [x] URL mapping documents created for both sections
- [x] Current file structure documented
- [x] Rollback plan documented (this file)

### ✅ **Current State Verified:**
- [x] All existing LeadPulse URLs work correctly
- [x] All existing AI Intelligence URLs work correctly
- [x] Application builds successfully
- [x] No broken internal links

---

## ⚡ **EMERGENCY ROLLBACK PROCEDURE**

### **Step 1: Restore Sidebar Navigation (30 seconds)**
```bash
# Navigate to project directory
cd /Users/supreme/Desktop/marketsage

# Restore original sidebar
cp backup/navigation-backup.tsx src/components/dashboard/sidebar.tsx
```

### **Step 2: Move Files Back to Original Locations (2 minutes)**

#### **LeadPulse Files to Restore:**
```bash
# If these were moved, restore them:
# From: src/app/(dashboard)/leadpulse/analytics/funnels/page.tsx
# To:   src/app/(dashboard)/analytics/funnels/page.tsx

# From: src/app/(dashboard)/leadpulse/analytics/realtime/page.tsx  
# To:   src/app/(dashboard)/analytics/realtime/page.tsx

# From: src/app/(dashboard)/leadpulse/forms/conversions/page.tsx
# To:   src/app/(dashboard)/conversions/page.tsx

# From: src/app/(dashboard)/leadpulse/visitors/leads/page.tsx
# To:   src/app/(dashboard)/leadpulse/lead-management/page.tsx
```

#### **AI Intelligence Files to Restore:**
```bash
# If these were moved, restore them:
# From: src/app/(dashboard)/ai-intelligence/chat/page.tsx
# To:   src/app/(dashboard)/ai-chat/page.tsx

# From: src/app/(dashboard)/ai-intelligence/customers/behavior/page.tsx
# To:   src/app/(dashboard)/intelligence/page.tsx

# From: src/app/(dashboard)/ai-intelligence/operations/approvals/page.tsx
# To:   src/app/(dashboard)/approvals/page.tsx

# From: src/app/(dashboard)/ai-intelligence/operations/tasks/page.tsx
# To:   src/app/(dashboard)/tasks/page.tsx

# From: src/app/(dashboard)/ai-intelligence/customers/predictive/page.tsx
# To:   src/app/(dashboard)/dashboard/predictive-analytics/page.tsx

# From: src/app/(dashboard)/ai-intelligence/business/decisions/page.tsx
# To:   src/app/(dashboard)/dashboard/decision-support/page.tsx
```

### **Step 3: Remove Redirect Middleware (30 seconds)**
```bash
# Edit src/middleware.ts
# Remove any redirect rules that were added
# Restore to original state
```

### **Step 4: Remove New Hub Pages (30 seconds)**
```bash
# Delete any newly created hub pages:
rm -rf src/app/(dashboard)/leadpulse/visitors/
rm -rf src/app/(dashboard)/leadpulse/forms/
rm -rf src/app/(dashboard)/ai-intelligence/customers/
rm -rf src/app/(dashboard)/ai-intelligence/campaigns/
rm -rf src/app/(dashboard)/ai-intelligence/business/
rm -rf src/app/(dashboard)/ai-intelligence/operations/
```

### **Step 5: Test Application (1 minute)**
```bash
# Build application to ensure no errors
npm run build

# Or start development server
npm run dev
```

---

## 🔍 **POST-ROLLBACK VERIFICATION CHECKLIST**

After executing rollback, verify these items work:

### **Navigation Testing:**
- [ ] All sidebar navigation items clickable
- [ ] LeadPulse section loads correctly
- [ ] AI Intelligence section loads correctly
- [ ] Task Management section works
- [ ] All submenu items accessible

### **Critical Path Testing:**
- [ ] `/leadpulse` loads main dashboard
- [ ] `/analytics/funnels` displays funnel analytics
- [ ] `/analytics/realtime` shows real-time data
- [ ] `/conversions` loads conversion tracking
- [ ] `/ai-chat` opens AI chat interface
- [ ] `/intelligence` shows customer intelligence
- [ ] `/tasks` displays task management
- [ ] `/approvals` shows AI approvals

### **Build & Development:**
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No broken import statements
- [ ] Development server starts without errors

---

## 📋 **ORIGINAL FILE LOCATIONS REFERENCE**

### **LeadPulse Original Structure:**
```
src/app/(dashboard)/
├── leadpulse/
│   ├── page.tsx ✅ KEEP
│   ├── analytics/page.tsx ✅ KEEP  
│   ├── lead-management/page.tsx ✅ ORIGINAL LOCATION
│   └── setup/page.tsx ✅ KEEP
├── analytics/
│   ├── funnels/page.tsx ✅ ORIGINAL LOCATION
│   └── realtime/page.tsx ✅ ORIGINAL LOCATION
└── conversions/page.tsx ✅ ORIGINAL LOCATION
```

### **AI Intelligence Original Structure:**
```
src/app/(dashboard)/
├── ai-intelligence/
│   ├── page.tsx ✅ KEEP
│   ├── feedback/page.tsx ✅ ORIGINAL LOCATION
│   ├── model-training/page.tsx ✅ ORIGINAL LOCATION
│   └── performance-monitor/page.tsx ✅ ORIGINAL LOCATION
├── ai-chat/page.tsx ✅ ORIGINAL LOCATION
├── intelligence/page.tsx ✅ ORIGINAL LOCATION
├── approvals/page.tsx ✅ ORIGINAL LOCATION
├── tasks/page.tsx ✅ ORIGINAL LOCATION
└── dashboard/
    ├── predictive-analytics/page.tsx ✅ ORIGINAL LOCATION
    └── decision-support/page.tsx ✅ ORIGINAL LOCATION
```

---

## 🛠️ **ROLLBACK COMMANDS REFERENCE**

### **Quick Rollback Script:**
```bash
#!/bin/bash
echo "🚨 EXECUTING EMERGENCY ROLLBACK..."

# Restore sidebar
cp backup/navigation-backup.tsx src/components/dashboard/sidebar.tsx

# Test build
npm run build

echo "✅ ROLLBACK COMPLETE - Please test application functionality"
```

---

## ⚠️ **POST-ROLLBACK ACTIONS**

1. **Immediate Testing**: Test all critical navigation paths
2. **User Communication**: Notify users if any issues were experienced
3. **Issue Analysis**: Determine what caused the need for rollback
4. **Plan Revision**: Update migration plan to address identified issues
5. **Re-attempt**: Only proceed with fixes after thorough analysis

---

## 📞 **ESCALATION PROCEDURE**

If rollback doesn't resolve issues:
1. **Check Recent Commits**: Review git history for any other changes
2. **Database State**: Verify no database migrations ran during navigation changes
3. **API Endpoints**: Test all API endpoints still respond correctly
4. **Cache Clear**: Clear Next.js cache and restart development server
5. **Full Restore**: If needed, restore from earlier git commit

---

## 🔐 **ROLLBACK TESTING VERIFICATION**

After rollback, confirm these critical functions:
- [ ] User can log in successfully
- [ ] Dashboard loads with all sections
- [ ] Campaign creation works
- [ ] LeadPulse analytics display data
- [ ] AI chat responds correctly
- [ ] Task management functions
- [ ] All API endpoints respond
- [ ] No 404 or 500 errors
- [ ] Application builds successfully

---

**Status:** ✅ ROLLBACK PLAN READY - PROCEED WITH CONFIDENCE**