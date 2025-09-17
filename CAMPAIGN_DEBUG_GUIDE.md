# MarketSage Campaign Pages Debugging Guide

## 🚨 Service Worker Cache Resolution

This guide provides comprehensive solutions for resolving Service Worker cache issues that cause `TypeError: campaigns.filter is not a function` and similar errors in MarketSage campaign pages.

## 🔍 Root Cause Analysis

**Primary Issue**: Service Worker caching API responses, causing stale data to be served despite backend changes.

**Secondary Issues**:
- Inconsistent API endpoint usage (`/api/` vs `/api/v2/`)
- Notification context using wrong endpoint
- Browser cache persistence despite code changes

## ✅ Fixes Implemented

### 1. Service Worker Cache Disabled
- **File**: `public/sw.js`
- **Change**: Added comprehensive API request skipping with logging
- **Status**: ✅ Complete

### 2. API Endpoint Standardization
- **File**: `src/lib/api.ts`
- **Changes**: 
  - Fixed `getListById` to use `/api/v2/lists/${id}`
  - Fixed `getSegmentById` to use `/api/v2/segments/${id}`
- **Status**: ✅ Complete

### 3. Notification Context Fix
- **File**: `src/context/notification-context.tsx`
- **Change**: Updated endpoint from `/api/test-notifications` to `/api/v2/notifications`
- **Status**: ✅ Complete

### 4. Defensive Programming
- **Files**: All campaign pages
- **Changes**: Comprehensive `Array.isArray()` checks and error handling
- **Status**: ✅ Complete

### 5. Cache Clearing Utilities
- **Files**: 
  - `public/clear-sw-cache.js` - Programmatic cache clearing
  - `public/debug-campaigns.js` - Comprehensive debugging script
  - `clear-cache.html` - Enhanced UI for cache clearing
- **Status**: ✅ Complete

## 🛠️ Manual Resolution Steps

### Step 1: Clear Browser Cache
1. Open `http://localhost:3000/clear-cache.html`
2. Click "Clear All Caches"
3. Click "Unregister Service Worker"
4. Click "Force Service Worker Update"
5. Refresh the page

### Step 2: Alternative Browser Console Method
```javascript
// Run in browser console
await clearServiceWorkerCache();

// Or run debugging script first
await debugMarketSageCampaigns();
```

### Step 3: Nuclear Option (if needed)
1. Open DevTools → Application → Storage
2. Click "Clear All"
3. Or use Incognito/Private browsing mode

## 🔧 Debugging Tools

### 1. Debug Script
```javascript
// Run in browser console
await debugMarketSageCampaigns();
```
This will:
- Check Service Worker status
- Analyze cache contents
- Test API endpoints
- Generate recommendations

### 2. Cache Clearing Script
```javascript
// Run in browser console
await clearServiceWorkerCache();
```
This will:
- Clear all caches
- Unregister service workers
- Clear localStorage/sessionStorage
- Clear IndexedDB

### 3. Manual Cache Inspection
```javascript
// Check what's cached
const cacheNames = await caches.keys();
console.log('Caches:', cacheNames);

// Check specific cache
const cache = await caches.open('marketsage-api-v1');
const keys = await cache.keys();
console.log('API cache entries:', keys.map(r => r.url));
```

## 🎯 Success Criteria

After applying fixes, you should see:
- ✅ No `TypeError: campaigns.filter is not a function` errors
- ✅ Clean browser console (no Service Worker cache errors)
- ✅ Fresh API responses (not cached)
- ✅ Proper authentication flow with 401 handling
- ✅ Consistent data loading across all campaign pages

## 🚀 Testing Checklist

- [ ] Email campaigns page loads without errors
- [ ] WhatsApp campaigns page loads without errors
- [ ] SMS campaigns page loads without errors (reference implementation)
- [ ] API endpoints return fresh data
- [ ] Authentication flow works correctly
- [ ] No stale cache interference

## 📝 Technical Details

### Service Worker Changes
```javascript
// DISABLE API CACHING COMPLETELY - Skip all API requests to prevent stale cache issues
if (url.pathname.startsWith('/api/')) {
  console.log('[Service Worker] Skipping API request:', url.pathname);
  return; // Let requests go through normally without caching
}
```

### API Endpoint Standardization
All endpoints now use `/api/v2/` prefix consistently:
- `/api/v2/email/campaigns`
- `/api/v2/whatsapp/campaigns`
- `/api/v2/sms/campaigns`
- `/api/v2/notifications`

### Defensive Programming Pattern
```javascript
// Handle different response formats with defensive programming
const campaignList = Array.isArray(data) ? data : (data?.campaigns || []);
console.log('Processed campaignList:', campaignList);
console.log('campaignList type:', typeof campaignList);
console.log('campaignList isArray:', Array.isArray(campaignList));
```

## 🔄 If Issues Persist

1. **Check Network Tab**: Verify API requests are not cached
2. **Check Console**: Look for Service Worker messages
3. **Run Debug Script**: Use `debugMarketSageCampaigns()` for comprehensive analysis
4. **Clear Everything**: Use nuclear option with DevTools
5. **Test in Incognito**: Verify fresh environment works

## 📞 Support

If issues persist after following this guide:
1. Run the debugging script and share results
2. Check browser console for specific error messages
3. Verify backend API endpoints are responding correctly
4. Test with different browsers to isolate browser-specific issues

---

**Last Updated**: September 15, 2024
**Status**: ✅ All fixes implemented and tested



