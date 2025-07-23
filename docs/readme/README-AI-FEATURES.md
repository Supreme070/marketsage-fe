# MarketSage AI Features

This document describes the AI-powered features available in MarketSage and how to use them.

## Overview

MarketSage provides intelligent marketing automation features that don't require external AI APIs:

1. **Engagement Tracking** - Track user interactions with emails, SMS, and WhatsApp messages
2. **Smart Segmentation** - Create intelligent audience segments based on behavior patterns
3. **Send Time Optimization** - Determine the best time to send messages to each contact
4. **Content Generation** - Generate content from templates with basic NLP capabilities

## Setup

The AI features require specific database tables to be created. You can initialize these by:

1. Making an API call to `/api/ai-features/init` (requires admin privileges), or
2. Importing and calling the initialization function directly:

```typescript
import { initializeAIFeatures } from '@/lib/ai-features-init';

// Initialize AI features (returns a Promise<boolean>)
await initializeAIFeatures();
```

## Engagement Tracking

Track user engagement with your marketing content:

```typescript
import { recordEngagement } from '@/lib/engagement-tracking';
import { ActivityType, EntityType } from '@prisma/client';

// Record an open event
await recordEngagement(
  'contact-id',
  EntityType.EMAIL_CAMPAIGN,
  'campaign-id',
  ActivityType.OPENED,
  { userAgent: '...' } // Optional metadata
);
```

### Client-side Tracking

For client-side engagement tracking:

1. **Email Opens**: Add a tracking pixel to emails
   ```typescript
   import { addTrackingPixel } from '@/lib/trackingUtils';
   
   const emailWithPixel = addTrackingPixel(htmlContent, contactId, campaignId);
   ```

2. **Link Clicks**: Add tracking to email links
   ```typescript
   import { addLinkTracking } from '@/lib/trackingUtils';
   
   const emailWithTracking = addLinkTracking(htmlContent, contactId, campaignId);
   ```

## Smart Segmentation

Create intelligent audience segments:

```typescript
import { generateSmartSegments, getContactsInSegment } from '@/lib/smart-segmentation';

// Get segment suggestions
const segments = await generateSmartSegments();

// Get contacts in a segment
const contacts = await getContactsInSegment(segmentId, limit, offset);
```

## Send Time Optimization

Determine the best time to send messages:

```typescript
import { getBestSendTime } from '@/lib/engagement-tracking';

// Get the optimal send time for a contact
const bestTime = await getBestSendTime(contactId);
// Returns: { dayOfWeek: 2, hourOfDay: 10, confidence: 0.8 }
```

## API Endpoints

The following API endpoints are available:

1. **Initialize AI Features**: `GET /api/ai-features/init`
   - Requires admin privileges
   - Sets up required database tables

2. **Track Engagement**: `POST /api/engagements/track`
   - Request body:
     ```json
     {
       "contactId": "cuid123",
       "entityType": "EMAIL_CAMPAIGN",
       "entityId": "cuid456",
       "activityType": "OPENED",
       "metadata": {
         "userAgent": "Mozilla/5.0..."
       }
     }
     ```

3. **Get Smart Segments**: `GET /api/segments/smart`
   - Optional query parameters:
     - `minEngagementScore`: Minimum engagement score (0-1)
     - `maxInactivityDays`: Maximum days of inactivity

4. **Get Contacts in Segment**: `POST /api/segments/smart`
   - Request body:
     ```json
     {
       "segmentId": "cuid123",
       "limit": 100,
       "offset": 0
     }
     ```

5. **Tracking Pixel**: `GET /api/pixel.gif`
   - Query parameters:
     - `cid`: Contact ID
     - `eid`: Entity ID
     - `type`: Entity type (default: EMAIL_CAMPAIGN)
     - `t`: Timestamp (for cache busting)

6. **Click Tracking**: `GET /api/redirect`
   - Query parameters:
     - `url`: Target URL (encoded)
     - `cid`: Contact ID
     - `eid`: Entity ID
     - `type`: Entity type (default: EMAIL_CAMPAIGN)
     - `meta`: Additional metadata (optional, JSON encoded)

## Testing

A test script is available at `scripts/test-ai-features.ts` to verify the AI features are working correctly. Run it with:

```bash
npx ts-node -r tsconfig-paths/register scripts/test-ai-features.ts
``` 