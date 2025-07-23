# BYOP (Bring Your Own Provider) Integration Guide

## Overview

MarketSage supports **BYOP (Bring Your Own Provider)** functionality, allowing organizations to use their own messaging providers while benefiting from MarketSage's unified messaging infrastructure. This guide covers implementation, integration, and usage of BYOP across SMS, Email, and WhatsApp channels.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Provider Support Matrix](#provider-support-matrix)
3. [Implementation Guide](#implementation-guide)
4. [API Integration](#api-integration)
5. [Security & Encryption](#security--encryption)
6. [Configuration Management](#configuration-management)
7. [Testing & Validation](#testing--validation)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Architecture Overview

### Dual-Mode Messaging System

MarketSage implements a dual-mode messaging architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Organization   │────│ Unified Messaging│────│   Providers     │
│   Application   │    │    Service       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌─────────────────┐      ┌─────────────────┐
                       │ Customer-Managed│      │ Platform-Managed│
                       │   (BYOP Mode)   │      │   (Credits)     │
                       └─────────────────┘      └─────────────────┘
```

### Key Components

1. **Unified Messaging Service** (`/src/lib/messaging/unified-messaging-service.ts`)
   - Routes messages based on organization configuration
   - Handles both customer-managed and platform-managed modes
   - Provides cost tracking and analytics

2. **Provider Services**
   - SMS Service (`/src/lib/sms-providers/sms-service.ts`)
   - Email Service (`/src/lib/email-providers/email-service.ts`)
   - WhatsApp Service (`/src/lib/whatsapp-service.ts`)

3. **Configuration Management**
   - Database schemas for provider credentials
   - Encryption/decryption utilities
   - Cache management for performance

## Provider Support Matrix

### SMS Providers

| Provider | BYOP Support | Platform Support | Configuration Required |
|----------|-------------|------------------|----------------------|
| **Twilio** | ✅ Full | ✅ Full | Account SID, Auth Token, From Number |
| **Africa's Talking** | ✅ Full | ✅ Full | API Key, Username, From Number |
| **Termii** | 🔄 Planned | ✅ Full | API Key, From Number |

### Email Providers

| Provider | BYOP Support | Platform Support | Configuration Required |
|----------|-------------|------------------|----------------------|
| **SendGrid** | ✅ Full | ✅ Full | API Key, From Email, From Name |
| **Mailgun** | ✅ Full | ✅ Full | API Key, Domain, From Email |
| **SMTP** | ✅ Full | ✅ Full | Host, Port, Username, Password |
| **Postmark** | 🔄 Planned | ❌ No | API Key, From Email |
| **AWS SES** | 🔄 Planned | ❌ No | Access Key, Secret Key, Region |

### WhatsApp Providers

| Provider | BYOP Support | Platform Support | Configuration Required |
|----------|-------------|------------------|----------------------|
| **WhatsApp Business API** | ✅ Full | ✅ Full | Access Token, Phone Number ID |
| **Twilio WhatsApp** | ✅ Platform Only | ✅ Full | Account SID, Auth Token |

## Implementation Guide

### 1. Database Schema

Provider configurations are stored with encrypted credentials:

```sql
-- SMS Providers
CREATE TABLE "SMSProvider" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerType" TEXT NOT NULL, -- TWILIO, AFRICASTALKING, TERMII
  "accountSid" TEXT,
  "authToken" TEXT, -- Encrypted
  "apiKey" TEXT, -- Encrypted
  "username" TEXT,
  "fromNumber" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

-- Email Providers  
CREATE TABLE "EmailProvider" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerType" TEXT NOT NULL, -- mailgun, sendgrid, smtp
  "apiKey" TEXT, -- Encrypted
  "domain" TEXT,
  "fromEmail" TEXT NOT NULL,
  "fromName" TEXT,
  "smtpHost" TEXT,
  "smtpPort" INTEGER,
  "smtpUsername" TEXT,
  "smtpPassword" TEXT, -- Encrypted
  "smtpSecure" BOOLEAN,
  "trackingDomain" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

-- WhatsApp Business Config
CREATE TABLE "WhatsAppBusinessConfig" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "businessAccountId" TEXT NOT NULL,
  "phoneNumberId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL, -- Encrypted
  "phoneNumber" TEXT,
  "displayName" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
  "webhookUrl" TEXT,
  "verifyToken" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);
```

### 2. Provider Implementation Pattern

All providers follow a consistent interface pattern:

```typescript
// Base Provider Interface
interface BaseProvider {
  name: string;
  isConfigured(): boolean;
  validateConfig(): boolean;
}

// SMS Provider Example
class TwilioSMSProvider implements SMSProvider {
  constructor(config: TwilioConfig) {
    this.config = config;
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    // Implementation
  }

  isConfigured(): boolean {
    return !!(this.config.accountSid && this.config.authToken);
  }
}
```

### 3. Organization Provider Resolution

Each service follows the same pattern for provider resolution:

```typescript
async sendMessage(organizationId: string, options: MessageOptions) {
  // 1. Try to get organization-specific provider
  const orgProvider = await this.getOrganizationProvider(organizationId);
  
  if (orgProvider) {
    // Use customer's provider (BYOP mode)
    return await orgProvider.send(options);
  }
  
  // 2. Fallback to platform default provider
  logger.info('Using platform default provider', { organizationId });
  return await this.platformProvider.send(options);
}
```

## API Integration

### 1. Provider Configuration APIs

#### SMS Provider Configuration

```typescript
// Create/Update SMS Provider
POST /api/sms/providers
{
  "providerType": "TWILIO",
  "accountSid": "AC...",
  "authToken": "your_auth_token",
  "fromNumber": "+1234567890"
}

// Test SMS Provider
POST /api/sms/providers/{id}/test
{
  "phoneNumber": "+2348012345678",
  "message": "Test message"
}
```

#### Email Provider Configuration

```typescript
// Create/Update Email Provider
POST /api/email/providers
{
  "providerType": "sendgrid",
  "apiKey": "SG.your_api_key",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Your Company"
}

// Test Email Provider
POST /api/email/providers/{id}/test
{
  "to": "test@example.com",
  "subject": "Test Email",
  "message": "Test message"
}
```

#### WhatsApp Business Configuration

```typescript
// Create/Update WhatsApp Config
POST /api/whatsapp/config
{
  "businessAccountId": "123456789",
  "phoneNumberId": "987654321",
  "accessToken": "your_access_token",
  "phoneNumber": "+1234567890",
  "displayName": "Your Business"
}

// Test WhatsApp Config
PUT /api/whatsapp/config
{
  "action": "test",
  "phoneNumber": "+2348012345678",
  "message": "Test WhatsApp message"
}
```

### 2. Unified Messaging API

Send messages through the unified service:

```typescript
POST /api/messaging/send
{
  "to": "recipient",
  "content": "message content",
  "channel": "sms|email|whatsapp",
  "organizationId": "org-id"
}
```

### 3. Messaging Model Management

```typescript
// Get current messaging configuration
GET /api/messaging/model

// Switch messaging model
PUT /api/messaging/model
{
  "messagingModel": "customer_managed|platform_managed",
  "notifyUsers": true,
  "reason": "Optional reason for switch"
}

// Test configuration
POST /api/messaging/model
{
  "action": "test-configuration",
  "testPhone": "+2348012345678",
  "testEmail": "test@example.com",
  "channels": ["sms", "email", "whatsapp"]
}
```

## Security & Encryption

### 1. Credential Encryption

All sensitive credentials are encrypted using AES-256-CBC:

```typescript
const encrypt = (text: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### 2. Environment Variables

Required environment variables:

```bash
# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Platform Default Providers
SMS_PROVIDER=twilio|africastalking|mock
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

AFRICASTALKING_API_KEY=your_at_api_key
AFRICASTALKING_USERNAME=your_at_username

EMAIL_PROVIDER=sendgrid|mailgun|smtp
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
```

### 3. Access Control

- Provider configurations are organization-scoped
- Only organization admins can configure providers
- API endpoints require authentication and organization membership
- Audit logging for all configuration changes

## Configuration Management

### 1. Provider Cache Management

```typescript
// Clear provider cache when configuration changes
emailService.clearOrganizationCache(organizationId);
smsService.clearOrganizationCache(organizationId);
whatsappService.clearOrganizationCache(organizationId);
```

### 2. Configuration Validation

```typescript
// Validate provider configuration before saving
const isValid = emailService.validateProviderConfig('sendgrid', {
  apiKey: 'your_api_key'
});

const isValid = smsService.validateProviderConfig('twilio', {
  accountSid: 'AC...',
  authToken: 'your_token',
  fromNumber: '+1234567890'
});
```

### 3. Health Monitoring

```typescript
// Check provider health
const health = await emailService.getProviderHealth(organizationId);
const stats = await emailService.getOrganizationStats(organizationId, {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')
});
```

## Testing & Validation

### 1. Automated Testing

Run the comprehensive test suite:

```bash
# Run provider integration tests
npm test src/__tests__/integration/provider-integrations.test.ts

# Run end-to-end tests
npm run test:e2e

# Run custom test script
npx tsx scripts/test-provider-integrations.ts
```

### 2. Manual Testing

Use the built-in test functionality:

```typescript
// Test SMS provider
const result = await smsService.testOrganizationSMS(
  organizationId,
  '+2348012345678'
);

// Test email provider
const result = await emailService.testOrganizationEmail(
  organizationId,
  'test@example.com',
  'Test Subject',
  'Test message'
);

// Test WhatsApp provider
const result = await whatsappService.testOrganizationWhatsApp(
  organizationId,
  '+2348012345678',
  'Test WhatsApp message'
);
```

### 3. UI Testing Interface

Use the MessagingModelSwitcher component for interactive testing:

```typescript
import MessagingModelSwitcher from '@/components/messaging/MessagingModelSwitcher';

// In your settings page
<MessagingModelSwitcher />
```

## Troubleshooting

### Common Issues

#### 1. Provider Not Found

```
Error: SMS provider not found for organization
```

**Solution**: Verify provider configuration and ensure `isActive: true`

#### 2. Encryption/Decryption Errors

```
Error: Decryption failed
```

**Solution**: Check `ENCRYPTION_KEY` environment variable

#### 3. API Authentication Failures

```
Error: Invalid API credentials
```

**Solution**: Verify provider API keys and test with provider's API directly

#### 4. Phone Number Format Issues

```
Error: Invalid phone number format
```

**Solution**: Use international format: `+[country_code][number]`

### Debug Mode

Enable debug logging:

```bash
DEBUG=marketsage:* npm start
```

### Health Checks

Monitor provider health:

```typescript
// Check all providers
GET /api/health/providers

// Check specific provider
GET /api/health/providers/{type}/{organizationId}
```

## Best Practices

### 1. Provider Configuration

- **Test before deploying**: Always test provider configurations in development
- **Use environment-specific keys**: Separate API keys for development/staging/production
- **Monitor usage**: Track provider usage and costs
- **Implement fallbacks**: Always have platform defaults configured

### 2. Security

- **Rotate encryption keys**: Regularly rotate encryption keys
- **Audit access**: Monitor who configures providers
- **Validate inputs**: Always validate and sanitize provider configurations
- **Use HTTPS**: Ensure all API calls use HTTPS

### 3. Performance

- **Cache provider instances**: Use provider caching for performance
- **Batch operations**: Use bulk sending for multiple messages
- **Monitor latency**: Track provider response times
- **Implement retries**: Add retry logic for failed requests

### 4. Monitoring

- **Track success rates**: Monitor message delivery success rates
- **Alert on failures**: Set up alerts for provider failures
- **Monitor costs**: Track messaging costs per channel
- **Log everything**: Comprehensive logging for troubleshooting

### 5. Cost Management

- **Set usage limits**: Implement daily/monthly usage limits
- **Monitor spending**: Track costs across all channels
- **Optimize routing**: Use cheapest providers when possible
- **Implement budgets**: Set budget alerts for organizations

## Examples

### Complete Integration Example

```typescript
// 1. Configure SMS Provider
const smsProvider = await fetch('/api/sms/providers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    providerType: 'TWILIO',
    accountSid: 'AC...',
    authToken: 'your_auth_token',
    fromNumber: '+1234567890'
  })
});

// 2. Test SMS Provider
const testResult = await fetch('/api/sms/providers/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2348012345678',
    message: 'Test message from MarketSage'
  })
});

// 3. Switch to Customer-Managed Mode
const switchResult = await fetch('/api/messaging/model', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messagingModel: 'customer_managed',
    notifyUsers: true,
    reason: 'Using own Twilio account for better rates'
  })
});

// 4. Send Message via Unified Service
const messageResult = await fetch('/api/messaging/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+2348012345678',
    content: 'Hello from MarketSage!',
    channel: 'sms',
    organizationId: 'your-org-id'
  })
});
```

## Support

For technical support with BYOP integration:

1. Check the troubleshooting section above
2. Review the test suite for examples
3. Use the debug mode for detailed logging
4. Contact support with specific error messages and configurations

---

**Last Updated**: 2024-01-19  
**Version**: 1.0.0  
**Maintainer**: MarketSage Engineering Team