# Conversion Tracking System for MarketSage

This document provides an overview of the conversion tracking system in MarketSage, explaining how to track conversions and retrieve conversion data.

## Overview

The conversion tracking system is designed to track user activities that lead to conversions across email campaigns, SMS campaigns, WhatsApp campaigns, and other marketing efforts. It stores data in the Analytics model, which allows for aggregation and analysis by different time periods.

## Database Structure

The system uses the following tables:

- `Analytics`: Stores conversion metrics by entity type, entity ID, and time period
- `EmailActivity`, `SMSActivity`, etc.: Track specific user interactions with campaigns

Conversion data is stored as a JSON string in the `metrics` field of the Analytics table, which contains:
- Conversion counts by type
- Conversion values (if applicable)
- Metadata for analysis

## API Endpoints

### Track a Conversion

**Endpoint**: `POST /api/conversions/track`

**Request Body**:
```json
{
  "entityType": "EMAIL_CAMPAIGN",
  "entityId": "campaign_id_here",
  "conversionType": "email_open",
  "conversionValue": 0,
  "metadata": {
    "contactId": "contact_id_here",
    "url": "http://example.com/tracked"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Conversion tracked successfully"
}
```

### Retrieve Conversion Data

**Endpoint**: `GET /api/conversions`

**Query Parameters**:
- `entityType`: Filter by entity type (e.g., EMAIL_CAMPAIGN)
- `entityId`: Filter by specific entity ID
- `period`: DAILY, WEEKLY, MONTHLY, or YEARLY (default: DAILY)
- `startDate`: Filter data from this date
- `endDate`: Filter data to this date

**Response**:
```json
{
  "success": true,
  "data": [...],
  "aggregatedStats": {
    "totalConversions": {
      "count": 150,
      "value": 12000
    },
    "conversionsByType": {
      "email_open": {
        "count": 100,
        "value": 0
      },
      "email_click": {
        "count": 50,
        "value": 0
      },
      "purchase": {
        "count": 10,
        "value": 12000
      }
    }
  }
}
```

## Client-Side Integration

### Tracking Conversions

To track conversions in your components:

```typescript
import { trackConversion, ConversionTypes } from '@/lib/conversions';

// Track a conversion event
await trackConversion({
  entityType: 'EMAIL_CAMPAIGN',
  entityId: campaignId,
  conversionType: ConversionTypes.EMAIL_CLICK,
  conversionValue: 0, // Optional
  metadata: {
    contactId: 'user123',
    page: '/products/123'
  }
});
```

### Displaying Conversion Metrics

Use the ConversionMetrics component to display conversion data:

```tsx
import { ConversionMetrics } from '@/components/dashboard/ConversionMetrics';
import { EntityType } from '@prisma/client';

// Display conversion metrics for a specific campaign
<ConversionMetrics
  entityType={EntityType.EMAIL_CAMPAIGN}
  entityId="campaign_id_here"
  title="Email Campaign Performance"
  description="Track email conversion metrics"
  period="WEEKLY"
/>

// Or show aggregate metrics
<ConversionMetrics
  title="Overall Conversion Performance"
  description="Summary of all conversions"
  period="MONTHLY"
/>
```

### Predefined Conversion Types

The system includes predefined conversion types for common scenarios:

```typescript
import { ConversionTypes } from '@/lib/conversions';

// Available conversion types
ConversionTypes.LEAD_CAPTURE
ConversionTypes.SIGNUP
ConversionTypes.FORM_SUBMISSION
ConversionTypes.EMAIL_OPEN
ConversionTypes.EMAIL_CLICK
ConversionTypes.EMAIL_REPLY
ConversionTypes.SMS_DELIVERED
ConversionTypes.SMS_CLICK
ConversionTypes.SMS_REPLY
ConversionTypes.WHATSAPP_DELIVERED
ConversionTypes.WHATSAPP_READ
ConversionTypes.WHATSAPP_REPLY
ConversionTypes.PRODUCT_VIEW
ConversionTypes.ADD_TO_CART
ConversionTypes.CHECKOUT_START
ConversionTypes.PURCHASE
ConversionTypes.CUSTOM
```

## Email Campaign Tracking

Email opens and clicks are automatically tracked with a transparent pixel and link rewriting:

1. Add tracking pixel at the bottom of email HTML:
```html
<img src="https://yourdomain.com/api/email/campaigns/{campaignId}/track?cid={contactId}" width="1" height="1" />
```

2. Rewrite links in email to include tracking:
```html
<a href="https://yourdomain.com/api/email/campaigns/{campaignId}/track?cid={contactId}&type=click&url={encodedUrl}">Click here</a>
```

## Best Practices

1. **Use Consistent Entity Types**: Always use the predefined EntityType enum values.

2. **Track Meaningful Events**: Focus on important user actions that indicate progression through the funnel.

3. **Add Conversion Values**: For revenue-generating conversions, always include the monetary value.

4. **Include Metadata**: Add relevant metadata to conversions for deeper analysis.

5. **Analyze by Period**: Use different time periods (daily, weekly, monthly, yearly) to identify trends.

## Extending the System

To add new conversion types:

1. Update the `ConversionTypes` object in `src/lib/conversions.ts`
2. Implement tracking in the relevant components/pages
3. Update the ConversionMetrics component if needed to display the new type

## Troubleshooting

If conversions aren't being tracked:

1. Check browser console for errors
2. Verify API endpoint responses
3. Look at server logs for backend errors
4. Check that the Analytics table has the right database structure
5. Verify authentication is working correctly

For assistance, contact the MarketSage development team. 