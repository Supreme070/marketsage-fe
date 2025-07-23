# MarketSage Complete Usage Guide

## Overview

This comprehensive guide covers everything you need to know about using MarketSage's BYOP (Bring Your Own Provider) functionality and platform-managed messaging. Whether you're a developer implementing integrations or a business user configuring providers, this guide provides step-by-step instructions for all use cases.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Provider Configuration](#provider-configuration)
3. [Messaging Models](#messaging-models)
4. [API Usage](#api-usage)
5. [UI Configuration](#ui-configuration)
6. [Testing & Validation](#testing--validation)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Quick Start

### For Business Users

#### 1. Access Settings
1. Log into your MarketSage dashboard
2. Navigate to **Settings** → **Messaging Configuration**
3. Choose your preferred messaging model

#### 2. Configure Providers (BYOP Mode)
1. Click **"Configure Providers"**
2. Add your provider credentials:
   - **SMS**: Twilio, Africa's Talking, or Termii
   - **Email**: SendGrid, Mailgun, Postmark, or SMTP
   - **WhatsApp**: WhatsApp Business API
3. Test each provider configuration
4. Switch to **Customer-Managed** mode

#### 3. Start Sending
1. Create campaigns in MarketSage
2. Messages will be sent through your configured providers
3. Monitor performance in the analytics dashboard

### For Developers

#### 1. Environment Setup
```bash
# Required environment variables
ENCRYPTION_KEY=your-32-character-encryption-key
DATABASE_URL=your-database-connection-string

# Platform default providers (optional)
SMS_PROVIDER=twilio|africastalking|termii
EMAIL_PROVIDER=sendgrid|mailgun|postmark
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Database Setup
```bash
npx prisma migrate deploy
npx prisma generate
```

#### 4. Test Integration
```bash
# Run provider integration tests
npm test src/__tests__/integration/provider-integrations.test.ts

# Run custom test script
npx tsx scripts/test-provider-integrations.ts
```

## Provider Configuration

### SMS Providers

#### Twilio Configuration
```typescript
// Via API
POST /api/sms/providers
{
  "providerType": "TWILIO",
  "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "authToken": "your_auth_token",
  "fromNumber": "+1234567890"
}

// Via UI
1. Go to Settings → SMS Providers
2. Click "Add Provider" → "Twilio"
3. Enter Account SID, Auth Token, and From Number
4. Click "Test Configuration"
5. Save if test passes
```

#### Africa's Talking Configuration
```typescript
// Via API
POST /api/sms/providers
{
  "providerType": "AFRICASTALKING",
  "apiKey": "your_api_key",
  "username": "your_username",
  "fromNumber": "YourSenderID"
}

// Via UI
1. Go to Settings → SMS Providers
2. Click "Add Provider" → "Africa's Talking"
3. Enter API Key, Username, and Sender ID
4. Click "Test Configuration"
5. Save if test passes
```

#### Termii Configuration
```typescript
// Via API
POST /api/sms/providers
{
  "providerType": "TERMII",
  "apiKey": "your_api_key",
  "senderId": "YourSenderID",
  "channel": "generic"
}

// Via UI
1. Go to Settings → SMS Providers
2. Click "Add Provider" → "Termii"
3. Enter API Key and Sender ID
4. Select Channel (generic/dnd/whatsapp)
5. Click "Test Configuration"
6. Save if test passes
```

### Email Providers

#### SendGrid Configuration
```typescript
// Via API
POST /api/email/providers
{
  "providerType": "sendgrid",
  "apiKey": "SG.your_api_key",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Your Company"
}

// Via UI
1. Go to Settings → Email Providers
2. Click "Add Provider" → "SendGrid"
3. Enter API Key and sender details
4. Click "Test Configuration"
5. Save if test passes
```

#### Mailgun Configuration
```typescript
// Via API
POST /api/email/providers
{
  "providerType": "mailgun",
  "apiKey": "your-mailgun-api-key",
  "domain": "yourdomain.com",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Your Company"
}

// Via UI
1. Go to Settings → Email Providers
2. Click "Add Provider" → "Mailgun"
3. Enter API Key, Domain, and sender details
4. Click "Test Configuration"
5. Save if test passes
```

#### Postmark Configuration
```typescript
// Via API
POST /api/email/providers
{
  "providerType": "postmark",
  "apiKey": "your-postmark-server-token",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Your Company"
}

// Via UI
1. Go to Settings → Email Providers
2. Click "Add Provider" → "Postmark"
3. Enter Server Token and sender details
4. Click "Test Configuration"
5. Save if test passes
```

#### SMTP Configuration
```typescript
// Via API
POST /api/email/providers
{
  "providerType": "smtp",
  "smtpHost": "smtp.yourdomain.com",
  "smtpPort": 587,
  "smtpUsername": "your_username",
  "smtpPassword": "your_password",
  "smtpSecure": false,
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Your Company"
}

// Via UI
1. Go to Settings → Email Providers
2. Click "Add Provider" → "SMTP"
3. Enter SMTP server details
4. Click "Test Configuration"
5. Save if test passes
```

### WhatsApp Configuration

#### WhatsApp Business API
```typescript
// Via API
POST /api/whatsapp/config
{
  "businessAccountId": "123456789012345",
  "phoneNumberId": "987654321098765",
  "accessToken": "your_permanent_access_token",
  "phoneNumber": "+1234567890",
  "displayName": "Your Business Name"
}

// Via UI
1. Go to Settings → WhatsApp Configuration
2. Enter Business Account ID and Phone Number ID
3. Enter Permanent Access Token
4. Add phone number and display name
5. Click "Test Configuration"
6. Save if test passes
```

## Messaging Models

### Customer-Managed Mode (BYOP)

#### Benefits
- Use your own provider accounts
- No per-message charges from MarketSage
- Direct billing relationship with providers
- Full control over provider configurations
- Better rates for high-volume senders

#### Requirements
- At least one provider configured per channel
- Valid API credentials for each provider
- Understanding of provider-specific limitations

#### Switching to Customer-Managed
```typescript
// Via API
PUT /api/messaging/model
{
  "messagingModel": "customer_managed",
  "notifyUsers": true,
  "reason": "Using own Twilio account for better rates"
}

// Via UI
1. Configure at least one provider
2. Go to Settings → Messaging Configuration
3. Click "Switch to Customer-Managed"
4. Provide reason (optional)
5. Confirm the switch
```

### Platform-Managed Mode

#### Benefits
- No provider setup required
- Instant messaging capability
- MarketSage handles provider relationships
- Automatic provider optimization
- Built-in redundancy and failover

#### Cost Structure
- Monthly platform fee: $99-$999
- Per-message credits: $0.02-$0.15
- Volume discounts available
- No setup or integration costs

#### Switching to Platform-Managed
```typescript
// Via API
PUT /api/messaging/model
{
  "messagingModel": "platform_managed",
  "notifyUsers": true,
  "reason": "Simplifying operations"
}

// Via UI
1. Go to Settings → Messaging Configuration
2. Click "Switch to Platform-Managed"
3. Provide reason (optional)
4. Confirm the switch
```

## API Usage

### Unified Messaging API

#### Send Single Message
```typescript
POST /api/messaging/send
{
  "to": "+2348012345678",
  "content": "Hello from MarketSage!",
  "channel": "sms",
  "organizationId": "your-org-id",
  "campaignId": "campaign-123",
  "metadata": {
    "customField": "customValue"
  }
}

// Response
{
  "success": true,
  "messageId": "msg_123456789",
  "provider": "twilio",
  "cost": 0.05,
  "credits": 1
}
```

#### Send Bulk Messages
```typescript
POST /api/messaging/bulk
{
  "messages": [
    {
      "to": "+2348012345678",
      "content": "Message 1",
      "channel": "sms",
      "organizationId": "your-org-id"
    },
    {
      "to": "user@example.com",
      "content": "<h1>Email Message</h1>",
      "channel": "email",
      "organizationId": "your-org-id"
    }
  ]
}

// Response
{
  "success": true,
  "results": [
    {
      "success": true,
      "messageId": "msg_123",
      "to": "+2348012345678"
    },
    {
      "success": true,
      "messageId": "msg_124",
      "to": "user@example.com"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

### Channel-Specific APIs

#### SMS API
```typescript
// Send SMS
POST /api/sms/send
{
  "to": "+2348012345678",
  "message": "Your OTP is 123456",
  "organizationId": "your-org-id"
}

// Get SMS balance (for platform-managed)
GET /api/sms/balance?organizationId=your-org-id

// Get SMS analytics
GET /api/sms/analytics?organizationId=your-org-id&period=30days
```

#### Email API
```typescript
// Send email
POST /api/email/send
{
  "to": "user@example.com",
  "from": "noreply@yourdomain.com",
  "subject": "Welcome to MarketSage",
  "html": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "text": "Welcome! Thank you for joining us.",
  "organizationId": "your-org-id"
}

// Send with attachments
POST /api/email/send
{
  "to": "user@example.com",
  "subject": "Document Attached",
  "html": "<p>Please find the document attached.</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content",
      "contentType": "application/pdf"
    }
  ],
  "organizationId": "your-org-id"
}
```

#### WhatsApp API
```typescript
// Send text message
POST /api/whatsapp/send
{
  "to": "+2348012345678",
  "message": "Hello from MarketSage!",
  "organizationId": "your-org-id"
}

// Send template message
POST /api/whatsapp/template
{
  "to": "+2348012345678",
  "template": {
    "name": "welcome_message",
    "language": "en",
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "John Doe"
          }
        ]
      }
    ]
  },
  "organizationId": "your-org-id"
}
```

## UI Configuration

### MessagingModelSwitcher Component

#### Integration
```typescript
import MessagingModelSwitcher from '@/components/messaging/MessagingModelSwitcher';

function SettingsPage() {
  return (
    <div>
      <h1>Messaging Settings</h1>
      <MessagingModelSwitcher />
    </div>
  );
}
```

#### Features
- **Real-time Configuration**: View current messaging model and providers
- **Seamless Switching**: Switch between customer-managed and platform-managed
- **Provider Testing**: Test all configured providers with sample messages
- **Usage Analytics**: View messaging usage and costs
- **Error Handling**: Comprehensive error messages and recovery suggestions

### Provider Configuration Forms

#### SMS Provider Form
```typescript
import SMSProviderForm from '@/components/messaging/SMSProviderForm';

<SMSProviderForm
  onSave={(provider) => console.log('Provider saved:', provider)}
  onTest={(provider) => console.log('Testing provider:', provider)}
  initialProvider={existingProvider}
/>
```

#### Email Provider Form
```typescript
import EmailProviderForm from '@/components/messaging/EmailProviderForm';

<EmailProviderForm
  onSave={(provider) => console.log('Provider saved:', provider)}
  onTest={(provider) => console.log('Testing provider:', provider)}
  initialProvider={existingProvider}
/>
```

## Testing & Validation

### Automated Testing

#### Run Test Suite
```bash
# Run all provider integration tests
npm test src/__tests__/integration/provider-integrations.test.ts

# Run specific provider tests
npm test -- --testNamePattern="SMS Provider"
npm test -- --testNamePattern="Email Provider"
npm test -- --testNamePattern="WhatsApp Provider"

# Run end-to-end tests
npm run test:e2e
```

#### Custom Test Script
```bash
# Run comprehensive provider testing
npx tsx scripts/test-provider-integrations.ts

# Test specific organization
npx tsx scripts/test-provider-integrations.ts --org=your-org-id

# Test specific channels
npx tsx scripts/test-provider-integrations.ts --channels=sms,email
```

### Manual Testing

#### Via API
```typescript
// Test messaging configuration
POST /api/messaging/model
{
  "action": "test-configuration",
  "testPhone": "+2348012345678",
  "testEmail": "test@example.com",
  "channels": ["sms", "email", "whatsapp"]
}
```

#### Via UI
1. Go to Settings → Messaging Configuration
2. Click "Test Configuration" tab
3. Enter test phone number and email
4. Click "Test All Configured Channels"
5. Review test results

### Provider-Specific Testing

#### SMS Testing
```typescript
// Test SMS provider
POST /api/sms/providers/{id}/test
{
  "phoneNumber": "+2348012345678",
  "message": "Test SMS from MarketSage"
}
```

#### Email Testing
```typescript
// Test email provider
POST /api/email/providers/{id}/test
{
  "to": "test@example.com",
  "subject": "Test Email",
  "message": "Test email from MarketSage"
}
```

#### WhatsApp Testing
```typescript
// Test WhatsApp configuration
PUT /api/whatsapp/config
{
  "action": "test",
  "phoneNumber": "+2348012345678",
  "message": "Test WhatsApp message from MarketSage"
}
```

## Monitoring & Analytics

### Real-time Monitoring

#### Provider Health
```typescript
// Get provider health status
GET /api/health/providers

// Response
{
  "sms": {
    "twilio": {
      "isHealthy": true,
      "circuitState": "CLOSED",
      "lastChecked": "2024-01-19T10:30:00Z"
    }
  },
  "email": {
    "sendgrid": {
      "isHealthy": true,
      "circuitState": "CLOSED",
      "lastChecked": "2024-01-19T10:30:00Z"
    }
  }
}
```

#### Usage Analytics
```typescript
// Get messaging usage
GET /api/messaging/usage?organizationId=your-org-id&period=30days

// Response
{
  "summary": {
    "sms": { "messages": 1500, "credits": 75 },
    "email": { "messages": 5000, "credits": 25 },
    "whatsapp": { "messages": 800, "credits": 40 }
  },
  "daily": [
    {
      "date": "2024-01-19",
      "sms": 50,
      "email": 200,
      "whatsapp": 30
    }
  ]
}
```

### Performance Metrics

#### Delivery Rates
```typescript
// Get delivery statistics
GET /api/analytics/delivery?organizationId=your-org-id&period=7days

// Response
{
  "sms": {
    "sent": 1000,
    "delivered": 985,
    "failed": 15,
    "deliveryRate": 98.5
  },
  "email": {
    "sent": 5000,
    "delivered": 4950,
    "bounced": 30,
    "opened": 2475,
    "clicked": 495,
    "deliveryRate": 99.0,
    "openRate": 50.0,
    "clickRate": 10.0
  }
}
```

#### Cost Analysis
```typescript
// Get cost breakdown
GET /api/analytics/costs?organizationId=your-org-id&period=30days

// Response
{
  "totalCost": 140.50,
  "breakdown": {
    "sms": 75.00,
    "email": 25.00,
    "whatsapp": 40.50
  },
  "comparison": {
    "previousPeriod": 125.00,
    "changePercent": 12.4
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Provider Authentication Failures

**Symptoms:**
- Error: "Invalid API credentials"
- HTTP 401/403 responses
- Messages failing to send

**Solutions:**
```typescript
// Verify credentials
1. Check API keys in provider dashboard
2. Ensure credentials aren't expired
3. Verify domain/phone number verification
4. Test credentials directly with provider API

// Update credentials
PUT /api/sms/providers/{id}
{
  "apiKey": "new_api_key",
  "authToken": "new_auth_token"
}
```

#### 2. Message Delivery Failures

**Symptoms:**
- Messages sent but not delivered
- High bounce rates
- Delivery timeouts

**Solutions:**
```typescript
// Check delivery status
GET /api/messaging/delivery/{messageId}

// Verify phone number/email format
const isValid = validatePhoneNumber("+2348012345678");
const isValidEmail = validateEmail("user@example.com");

// Check provider balance
GET /api/sms/balance?organizationId=your-org-id
```

#### 3. Rate Limiting

**Symptoms:**
- Error: "Rate limit exceeded"
- HTTP 429 responses
- Messages queued/delayed

**Solutions:**
```typescript
// Implement retry logic
const result = await messagingErrorHandler.executeWithRetry(
  () => sendMessage(options),
  'message-123',
  'twilio'
);

// Check rate limits
GET /api/providers/limits?provider=twilio
```

#### 4. Configuration Issues

**Symptoms:**
- Provider not found errors
- Configuration validation failures
- Inconsistent behavior

**Solutions:**
```typescript
// Clear provider cache
DELETE /api/cache/providers/{organizationId}

// Validate configuration
POST /api/providers/validate
{
  "providerType": "twilio",
  "config": {
    "accountSid": "AC...",
    "authToken": "your_token"
  }
}

// Reset circuit breaker
POST /api/providers/reset-circuit/{provider}
```

### Debugging Tools

#### Enable Debug Logging
```bash
# Set environment variable
DEBUG=marketsage:messaging:* npm start

# Or in code
process.env.DEBUG = 'marketsage:messaging:*';
```

#### Provider Health Check
```typescript
// Check all providers
GET /api/health/providers

// Check specific provider
GET /api/health/providers/sms/twilio/{organizationId}
```

#### Error Analysis
```typescript
// Get error logs
GET /api/logs/errors?organizationId=your-org-id&period=24hours

// Get circuit breaker status
GET /api/circuit-breaker/status
```

## Advanced Features

### Circuit Breaker Pattern

#### Configuration
```typescript
import { MessagingErrorHandler } from '@/lib/messaging/error-handler';

const errorHandler = new MessagingErrorHandler({
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000,
  fallbackEnabled: true
});
```

#### Usage
```typescript
// Execute with circuit breaker protection
const result = await errorHandler.executeWithRetry(
  () => provider.sendSMS(phone, message),
  'operation-id',
  'twilio'
);
```

### Provider Optimization

#### Automatic Provider Selection
```typescript
// Configure provider preferences
PUT /api/messaging/preferences
{
  "organizationId": "your-org-id",
  "preferences": {
    "sms": {
      "primary": "africastalking",
      "fallback": "twilio",
      "criteria": "cost"
    },
    "email": {
      "primary": "sendgrid",
      "fallback": "mailgun",
      "criteria": "deliverability"
    }
  }
}
```

#### Cost Optimization
```typescript
// Enable cost optimization
PUT /api/messaging/optimization
{
  "organizationId": "your-org-id",
  "enabled": true,
  "strategy": "cost_optimized", // or "performance_optimized"
  "thresholds": {
    "maxCostPerMessage": 0.05,
    "minDeliveryRate": 95.0
  }
}
```

### Webhook Integration

#### Setup Webhooks
```typescript
// Configure delivery webhooks
POST /api/webhooks/delivery
{
  "url": "https://yourapp.com/webhooks/delivery",
  "events": ["delivered", "failed", "bounced"],
  "secret": "webhook_secret"
}

// Handle webhook events
app.post('/webhooks/delivery', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'message.delivered':
      console.log('Message delivered:', event.messageId);
      break;
    case 'message.failed':
      console.log('Message failed:', event.messageId, event.error);
      break;
  }
  
  res.status(200).send('OK');
});
```

## Best Practices

### Security

#### 1. Credential Management
```typescript
// Use environment variables for sensitive data
const apiKey = process.env.TWILIO_API_KEY;

// Encrypt credentials in database
const encryptedKey = encrypt(apiKey);

// Rotate credentials regularly
await rotateProviderCredentials('twilio', organizationId);
```

#### 2. Access Control
```typescript
// Implement role-based access
const canConfigureProviders = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

// Audit configuration changes
await auditLog.create({
  action: 'PROVIDER_CONFIGURED',
  userId: user.id,
  details: { provider: 'twilio', organizationId }
});
```

### Performance

#### 1. Caching Strategy
```typescript
// Cache provider instances
const provider = await getProviderFromCache(organizationId, 'sms');

// Use connection pooling
const pool = createConnectionPool({
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000
});
```

#### 2. Batch Operations
```typescript
// Batch message sending
const messages = [/* array of messages */];
const batchSize = 100;

for (let i = 0; i < messages.length; i += batchSize) {
  const batch = messages.slice(i, i + batchSize);
  await Promise.all(batch.map(msg => sendMessage(msg)));
}
```

### Monitoring

#### 1. Key Metrics
```typescript
// Track essential metrics
const metrics = {
  deliveryRate: 98.5,
  averageLatency: 250, // ms
  errorRate: 1.5,
  costPerMessage: 0.045
};

// Set up alerts
if (metrics.deliveryRate < 95) {
  await sendAlert('Low delivery rate detected');
}
```

#### 2. Health Checks
```typescript
// Implement health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    providers: await checkProviderHealth(),
    database: await checkDatabaseHealth(),
    timestamp: new Date().toISOString()
  };
  
  res.json(health);
});
```

### Cost Optimization

#### 1. Provider Selection
```typescript
// Choose cheapest provider for bulk sending
const provider = await selectCostOptimalProvider('sms', messageCount, region);

// Use volume discounts
const discount = calculateVolumeDiscount(monthlyVolume);
```

#### 2. Usage Monitoring
```typescript
// Set spending limits
await setSpendingLimit(organizationId, {
  daily: 100,
  monthly: 2000,
  alertThreshold: 80 // Alert at 80% of limit
});

// Monitor usage in real-time
const usage = await getCurrentUsage(organizationId);
if (usage.percentage > 80) {
  await sendUsageAlert(organizationId, usage);
}
```

---

## Quick Reference

### Environment Variables
```bash
# Required
ENCRYPTION_KEY=your-32-char-key
DATABASE_URL=your-db-url

# Optional Platform Defaults
SMS_PROVIDER=twilio|africastalking|termii
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
AFRICASTALKING_API_KEY=...
TERMII_API_KEY=...

EMAIL_PROVIDER=sendgrid|mailgun|postmark
SENDGRID_API_KEY=SG...
MAILGUN_API_KEY=...
POSTMARK_API_KEY=...

WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### Common Commands
```bash
# Test providers
npx tsx scripts/test-provider-integrations.ts

# Build application
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Key API Endpoints
```
POST /api/messaging/send          # Send message
PUT  /api/messaging/model         # Switch messaging model
GET  /api/messaging/usage         # Get usage analytics
POST /api/sms/providers           # Configure SMS provider
POST /api/email/providers         # Configure email provider
POST /api/whatsapp/config         # Configure WhatsApp
```

---

**Support**: For additional help, check the troubleshooting section or contact MarketSage support.

**Updates**: This guide is regularly updated. Check the version number and last updated date.

---

**Last Updated**: 2024-01-19  
**Version**: 1.0.0  
**Guide Maintainer**: MarketSage Engineering Team