# Frontend AI Migration Status - MarketSage
**Date:** 2025-10-05
**Status:** MIGRATED TO BACKEND API
**Migration Type:** OpenAI moved from frontend to backend for security

---

## Migration Summary

The MarketSage AI system has been migrated from direct frontend OpenAI calls to secure backend API endpoints.

**Security Improvement:**
- ✅ OpenAI API key removed from frontend
- ✅ All AI requests now go through authenticated backend API
- ✅ Rate limiting enforced server-side
- ✅ Cost monitoring centralized in backend

---

## Files Created

### 1. AI Client (`src/lib/api/ai-client.ts`)
**Purpose:** Centralized client for backend AI API calls

**Capabilities:**
```typescript
import { aiClient } from '@/lib/api/ai-client';

// Set auth token (from session)
aiClient.setToken(session.accessToken);

// Chat with AI
await aiClient.chat(message, context, history);

// Supreme-v3 Q&A
await aiClient.askSupremeV3(message, context);

// Content analysis
await aiClient.analyzeSentiment(content, contentType, market);
await aiClient.scoreContent(content, contentType);
await aiClient.analyzeSubjectLine(subjectLine, market);

// Content generation
await aiClient.generateContent(contentType, prompt, tone, context);

// Admin stats
await aiClient.getAdminStats();
```

**Features:**
- ✅ TypeScript typed responses
- ✅ Error handling with specific error codes
- ✅ Correlation ID tracking
- ✅ Helper function for safe calls (`safeAICall()`)

---

## Files Modified

### 1. OpenAI Integration (`src/lib/ai/openai-integration.ts`)
**Status:** MIGRATED TO BACKEND API

**Before:**
```typescript
// ❌ OLD - Direct OpenAI API call
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${this.apiKey}` },
  // ... direct OpenAI call
});
```

**After:**
```typescript
// ✅ NEW - Backend API call
import { aiClient } from '@/lib/api/ai-client';

const response = await aiClient.chat(userMessage, context, conversationHistory);
```

**Changes:**
- Removed direct OpenAI API calls
- Now uses backend API via aiClient
- Requires auth token via `setToken(token)`
- Marked as `@deprecated` (use aiClient directly)

### 2. Supreme AI Brain (`src/lib/ai/supreme-ai-brain.ts`)
**Status:** UPDATED TO SUPPORT TOKEN

**Changes:**
```typescript
// ✅ Constructor now accepts auth token
constructor(authToken?: string) {
  this.openai = getAIInstance();

  // Set token for backend API calls
  if (authToken && this.openai.setToken) {
    this.openai.setToken(authToken);
  }
}
```

**Usage:**
```typescript
const brain = new SupremeAIBrain(session.accessToken);
await brain.think(input, context);
```

### 3. Multimodal Engine (`src/lib/ai/multimodal/multimodal-engine.ts`)
**Status:** ✅ MIGRATED TO BACKEND API

**All multimodal features now use backend:**
- Vision analysis (`/api/v2/ai/vision/analyze` - ✅ implemented)
- Audio transcription (`/api/v2/ai/audio/transcribe` - ✅ implemented)
- Document extraction (`/api/v2/ai/document/extract` - ✅ implemented)

**Changes:**
```typescript
// ✅ Constructor now accepts auth token
constructor(authToken?: string) {
  if (authToken) {
    this.setToken(authToken);
  }
}

// ✅ All methods now use backend API
await aiClient.analyzeVision(imageUrl, prompt, 'high');
await aiClient.transcribeAudio(base64Audio, language);
await aiClient.extractDocument(imageUrl);
await aiClient.chat(prompt); // For text analysis
```

**Removed:** Direct OpenAI client instantiation

---

## Environment Variables Updated

### `.env.local`
**Before:**
```env
OPENAI_API_KEY=your_openai_api_key_here  # ❌ Removed
OPENAI_MODEL=gpt-4o-mini                 # ❌ Removed
```

**After:**
```env
# OpenAI API key REMOVED - Now handled securely by backend
# AI requests now go through: NEXT_PUBLIC_BACKEND_URL/api/v2/ai/*
```

### `.env.example`
Updated with migration notice and instructions:
```
⚠️ IMPORTANT: OpenAI API key is NO LONGER used in frontend for security
AI features now handled by backend at: NEXT_PUBLIC_BACKEND_URL/api/v2/ai/*

DO NOT add OPENAI_API_KEY to frontend .env - it will be ignored
```

---

## Package Dependencies

### `package.json`
**OpenAI SDK:** Still installed
```json
{
  "dependencies": {
    "openai": "^4.104.0"  // ✅ Kept for multimodal-engine.ts
  }
}
```

**Why kept:**
- `multimodal-engine.ts` still needs it for vision/audio features
- Will be removed once backend implements multimodal endpoints
- NOT used for chat/content analysis (now backend API)

---

## Migration Checklist

### ✅ Completed
- [x] Created AI client for backend API calls
- [x] Updated OpenAIIntegration to use backend
- [x] Updated SupremeAIBrain to accept auth token
- [x] Removed OpenAI API key from `.env.local`
- [x] Updated `.env.example` with migration notice
- [x] Marked multimodal engine as pending migration
- [x] Added TypeScript types for all AI responses

### ⏳ Pending (Future)
- [x] Implement vision analysis in backend ✅
- [x] Implement audio transcription in backend ✅
- [x] Implement document extraction in backend ✅
- [x] Migrate multimodal-engine.ts to backend ✅
- [ ] Test multimodal endpoints with real data
- [ ] Remove OpenAI SDK from frontend package.json (after testing)
- [ ] Update all components to use aiClient directly (not OpenAIIntegration)

---

## Usage Guide for Developers

### Using AI in Components

**✅ Recommended Pattern:**
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { aiClient } from '@/lib/api/ai-client';
import { useEffect, useState } from 'react';

export function ChatComponent() {
  const { data: session } = useSession();
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (session?.accessToken) {
      aiClient.setToken(session.accessToken);
    }
  }, [session]);

  const handleChat = async (message: string) => {
    try {
      const result = await aiClient.chat(message);

      if (result.success && result.data) {
        setResponse(result.data.response);
      } else {
        console.error('AI Error:', result.error?.message);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    // ... component JSX
  );
}
```

**Error Handling:**
```typescript
import { safeAICall } from '@/lib/api/ai-client';

const analysis = await safeAICall(
  () => aiClient.analyzeSentiment(content, 'EMAIL_BODY', 'Nigeria'),
  null // fallback value
);

if (analysis) {
  // Use analysis
} else {
  // Handle error gracefully
}
```

---

## API Endpoints Reference

All AI features now available via backend:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/ai/chat` | POST | Real-time chat |
| `/api/v2/ai/supreme-v3/question` | POST | Advanced Q&A |
| `/api/v2/ai/content-analysis/sentiment` | POST | Sentiment analysis |
| `/api/v2/ai/content-analysis/score` | POST | Content scoring |
| `/api/v2/ai/content-analysis/subject-line` | POST | Subject line optimization |
| `/api/v2/ai/content-generation` | POST | Content generation |
| `/api/v2/ai/admin/stats` | GET | Usage statistics (admin) |

**Full documentation:** `/marketsage-backend/docs/AI_API_ENDPOINTS_GUIDE.md`

---

## Testing

### Test Migration
```bash
# 1. Ensure backend is running with real OpenAI key
cd marketsage-backend
cat .env | grep OPENAI_API_KEY  # Should show real key
npm run start:dev

# 2. Test frontend
cd marketsage-frontend
npm run dev

# 3. Login to app and test AI features
# 4. Verify AI responses are REAL (not "I apologize, but...")
# 5. Check backend logs show AI requests
```

### Verify Security
```bash
# Frontend should NOT have OpenAI key
cd marketsage-frontend
grep -r "OPENAI_API_KEY" .env.local  # Should show removal comment only
grep -r "sk-proj" . --exclude-dir=node_modules  # Should find nothing

# Backend should have OpenAI key
cd marketsage-backend
grep "OPENAI_API_KEY" .env  # Should show real key (not placeholder)
```

---

## Known Limitations

### 1. Multimodal Features Not Migrated
**Affected Features:**
- Image analysis / vision AI
- Audio transcription
- Document text extraction

**Current State:** Still use frontend OpenAI directly
**Workaround:** None - requires backend implementation
**Timeline:** Pending backend multimodal endpoints

### 2. Auth Token Required
**Impact:** Components must have access to session token
**Solution:** Use `useSession()` hook and set token:
```typescript
const { data: session } = useSession();
aiClient.setToken(session.accessToken);
```

### 3. FallbackAI Still Pattern-Based
**Impact:** If backend AI fails, FallbackAI provides pre-programmed responses
**Solution:** Ensure backend has valid OpenAI key and AI_FALLBACK_MODE=false

---

## Migration Benefits

### Security ✅
- API key never exposed to browser
- Rate limiting enforced server-side
- Input validation in backend
- Centralized security controls

### Cost Control ✅
- Token usage tracking in database
- Real-time cost monitoring
- Admin dashboard for usage stats
- Rate limits prevent abuse

### Scalability ✅
- Backend can scale AI independently
- Queue-based processing for heavy loads
- Caching strategies possible
- Better resource management

### Maintainability ✅
- Single source of truth (backend)
- Easier to update AI logic
- Centralized prompt management
- Better error handling and logging

---

## Rollback Plan

If migration causes issues:

1. **Revert OpenAIIntegration:**
   ```bash
   git checkout HEAD~1 -- src/lib/ai/openai-integration.ts
   ```

2. **Re-add API key to .env.local:**
   ```env
   OPENAI_API_KEY=sk-proj-your_api_key_here
   ```

3. **Restart frontend:**
   ```bash
   npm run dev
   ```

**Note:** This reverts to direct OpenAI calls (less secure)

---

## Support

**Issues?**
- Check backend is running: `http://localhost:3006/api/v2/health`
- Verify auth token is set: `aiClient.setToken(token)`
- Check backend logs for AI errors
- Review: `/marketsage-backend/docs/AI_API_ENDPOINTS_GUIDE.md`

**Questions?**
- Frontend integration: See this document
- Backend API: See `FRONTEND_INTEGRATION_GUIDE.md` in backend
- Security: See `AI_SECURITY_DOCUMENTATION.md` in backend

---

**Migration Status:** ✅ COMPLETE (including multimodal)
**Last Updated:** 2025-10-05
**Next Steps:** Test multimodal endpoints with real data
