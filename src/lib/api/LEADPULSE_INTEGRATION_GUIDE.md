# LeadPulse API Integration Guide

## Overview

This guide covers the integration of LeadPulse functionality with the new NestJS backend API, including API key authentication and domain whitelisting for public endpoints.

## 🔐 Security Architecture

### Authentication Methods

1. **JWT Authentication** - For authenticated user operations
2. **API Key + Domain Whitelisting** - For public endpoints (form submissions, visitor tracking)

### Public Endpoints (API Key Required)
- `POST /api/v2/leadpulse/forms/submit` - Form submissions
- `POST /api/v2/leadpulse/visitors` - Visitor creation
- `POST /api/v2/leadpulse/touchpoints` - Touchpoint tracking

### Protected Endpoints (JWT Required)
- `GET /api/v2/leadpulse/forms` - Form management
- `POST /api/v2/leadpulse/forms` - Form creation
- `GET /api/v2/leadpulse/insights` - AI insights
- `GET /api/v2/leadpulse/submissions` - Submission management

## 🚀 Frontend Integration

### 1. Using the LeadPulse Service

```typescript
import { useLeadPulse } from '@/hooks/useLeadPulse';

function MyComponent() {
  const {
    createForm,
    submitForm,
    createVisitor,
    createTouchpoint,
    getInsights,
    configurePublicAccess,
    clearPublicAccess
  } = useLeadPulse({
    apiKey: 'ms_your_api_key_here',
    domain: 'https://yourdomain.com'
  });

  // Your component logic
}
```

### 2. Form Submission Example

```typescript
import { LeadPulseFormSubmission } from '@/components/leadpulse/LeadPulseFormSubmission';

function ContactForm() {
  return (
    <LeadPulseFormSubmission
      formId="your-form-id"
      apiKey="ms_your_api_key_here"
      domain="https://yourdomain.com"
      onSuccess={(submission) => {
        console.log('Form submitted:', submission);
      }}
      onError={(error) => {
        console.error('Submission failed:', error);
      }}
    />
  );
}
```

### 3. Visitor Tracking Example

```typescript
import { LeadPulseVisitorTracking } from '@/components/leadpulse/LeadPulseVisitorTracking';

function TrackingComponent() {
  return (
    <LeadPulseVisitorTracking
      apiKey="ms_your_api_key_here"
      domain="https://yourdomain.com"
      onVisitorCreated={(visitor) => {
        console.log('Visitor created:', visitor);
      }}
      onTouchpointCreated={(touchpoint) => {
        console.log('Touchpoint created:', touchpoint);
      }}
    />
  );
}
```

## 📡 API Endpoints

### Form Management

#### Create Form
```http
POST /api/v2/leadpulse/forms
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Contact Form",
  "description": "Main contact form",
  "status": "PUBLISHED",
  "layout": "SINGLE_COLUMN",
  "fields": [
    {
      "type": "TEXT",
      "label": "Name",
      "required": true,
      "width": "FULL",
      "order": 1
    }
  ]
}
```

#### Submit Form (Public)
```http
POST /api/v2/leadpulse/forms/submit
Authorization: Bearer <api_key>
Origin: https://yourdomain.com
Content-Type: application/json

{
  "formId": "form-id",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "context": {
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "summer2024"
  }
}
```

### Visitor Management

#### Create Visitor (Public)
```http
POST /api/v2/leadpulse/visitors
Authorization: Bearer <api_key>
Origin: https://yourdomain.com
Content-Type: application/json

{
  "fingerprint": "unique-visitor-fingerprint",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "country": "US",
  "city": "San Francisco"
}
```

#### Create Touchpoint (Public)
```http
POST /api/v2/leadpulse/touchpoints
Authorization: Bearer <api_key>
Origin: https://yourdomain.com
Content-Type: application/json

{
  "visitorId": "visitor-id",
  "type": "PAGEVIEW",
  "url": "https://example.com/page",
  "metadata": {
    "title": "Page Title",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Insights Management

#### Get Insights
```http
GET /api/v2/leadpulse/insights
Authorization: Bearer <jwt_token>
Content-Type: application/json

Query Parameters:
- type: BEHAVIOR | PREDICTION | OPPORTUNITY | TREND
- importance: LOW | MEDIUM | HIGH
- limit: number
- page: number
```

#### Generate Insight
```http
POST /api/v2/leadpulse/insights/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "trigger": "visitor_spike",
  "data": {
    "increase": 150,
    "source": "social_media"
  }
}
```

## 🔑 API Key Management

### Create API Key
```http
POST /api/v2/auth/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "description": "For production website",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### List API Keys
```http
GET /api/v2/auth/api-keys
Authorization: Bearer <jwt_token>
```

### Update API Key
```http
PATCH /api/v2/auth/api-keys/{keyId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true
}
```

### Delete API Key
```http
DELETE /api/v2/auth/api-keys/{keyId}
Authorization: Bearer <jwt_token>
```

## 🛡️ Security Best Practices

### API Key Security
1. **Store API keys securely** - Never expose them in client-side code
2. **Use environment variables** - Store keys in server-side environment variables
3. **Rotate keys regularly** - Implement key rotation policies
4. **Monitor usage** - Track API key usage and set up alerts

### Domain Whitelisting
1. **Use exact domains** - Specify exact domains for production
2. **Wildcard subdomains** - Use `*.yourdomain.com` for subdomains
3. **Development domains** - Include localhost and staging domains
4. **HTTPS only** - Use HTTPS domains in production

### Request Headers
```http
Authorization: Bearer ms_your_api_key_here
Origin: https://yourdomain.com
Content-Type: application/json
User-Agent: YourApp/1.0
```

## 📊 Data Types

### Form Field Types
- `TEXT` - Single line text input
- `EMAIL` - Email input with validation
- `PHONE` - Phone number input
- `NUMBER` - Numeric input
- `TEXTAREA` - Multi-line text input
- `SELECT` - Dropdown selection
- `CHECKBOX` - Checkbox input
- `RADIO` - Radio button selection
- `DATE` - Date picker

### Touchpoint Types
- `PAGEVIEW` - Page view tracking
- `CLICK` - Click tracking
- `FORM_VIEW` - Form view tracking
- `FORM_START` - Form start tracking
- `FORM_SUBMIT` - Form submission tracking
- `CONVERSION` - Conversion tracking

### Insight Types
- `BEHAVIOR` - Behavioral insights
- `PREDICTION` - Predictive insights
- `OPPORTUNITY` - Opportunity insights
- `TREND` - Trend analysis

## 🧪 Testing

### Test Page
Visit `/leadpulse/test` to access the integration test page that verifies:
- API key authentication
- Form submission
- Visitor tracking
- Touchpoint creation
- Error handling

### Manual Testing
```bash
# Test visitor creation
curl -X POST http://localhost:3006/api/v2/leadpulse/visitors \
  -H "Authorization: Bearer ms_your_api_key" \
  -H "Origin: http://localhost" \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "test-fingerprint", "ipAddress": "127.0.0.1"}'

# Test touchpoint creation
curl -X POST http://localhost:3006/api/v2/leadpulse/touchpoints \
  -H "Authorization: Bearer ms_your_api_key" \
  -H "Origin: http://localhost" \
  -H "Content-Type: application/json" \
  -d '{"visitorId": "visitor-id", "type": "PAGEVIEW", "url": "https://example.com"}'
```

## 🚨 Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
**Causes:**
- Invalid API key
- Missing API key
- Non-whitelisted domain

#### 400 Bad Request
```json
{
  "message": "Form not found or not published",
  "error": "Bad Request",
  "statusCode": 400
}
```
**Causes:**
- Invalid form ID
- Form not published
- Missing required fields

#### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```
**Causes:**
- Database connection issues
- Server-side processing errors

### Error Handling in Frontend
```typescript
try {
  const submission = await submitForm(data);
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
  } else if (error.status === 400) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```

## 📈 Performance Considerations

### Caching
- API responses are cached for 5 minutes by default
- Use `skipCache: true` for real-time data
- Clear cache when data changes

### Rate Limiting
- 100 requests per minute per API key
- Circuit breaker activates after 5 failures
- Retry logic with exponential backoff

### Optimization Tips
1. **Batch requests** - Use the batch API for multiple operations
2. **Lazy loading** - Load components only when needed
3. **Debouncing** - Debounce rapid API calls
4. **Connection pooling** - Reuse HTTP connections

## 🔄 Migration from Old API

### Before (Frontend Routes)
```typescript
// Old way - direct fetch to frontend API
const response = await fetch('/api/leadpulse/forms/submit', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### After (Backend Service)
```typescript
// New way - using LeadPulse service
const submission = await apiClient.leadpulse.submitForm(data);
```

### Migration Checklist
- [ ] Update API calls to use new service
- [ ] Configure API key authentication
- [ ] Update domain whitelisting
- [ ] Test all endpoints
- [ ] Update error handling
- [ ] Remove old frontend API routes

## 📚 Additional Resources

- [API Client Documentation](../api/README.md)
- [Security Implementation Guide](../../backend/API_KEY_SECURITY_IMPLEMENTATION.md)
- [LeadPulse Cleanup Summary](../../frontend/LEADPULSE_CLEANUP.md)
- [Test Page](../../app/(dashboard)/leadpulse/test/page.tsx)

## 🆘 Support

For issues or questions:
1. Check the test page for integration verification
2. Review error logs in the browser console
3. Verify API key and domain configuration
4. Test endpoints manually with curl commands
5. Check backend logs for server-side errors
