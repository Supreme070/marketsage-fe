# 📋 Multi-Tenant Messaging Implementation TODOs

## 🎯 Overview
Detailed task list for extending MarketSage's multi-tenant provider system to support Email and WhatsApp channels.

---

## Phase 1: Database Schema Extension (Week 1)

### 1.1 Create Email Provider Schema
- [ ] Design `EmailProvider` table structure
  ```sql
  -- Fields needed:
  - id (UUID)
  - organizationId (UUID, FK)
  - providerType (ENUM: MAILGUN, MAILJET, SENDGRID, SMTP)
  - name (VARCHAR)
  - apiKey (encrypted)
  - domain (VARCHAR)
  - fromEmail (VARCHAR)
  - fromName (VARCHAR)
  - trackingDomain (VARCHAR)
  - isActive (BOOLEAN)
  - brandingConfig (JSONB)
  - smtpConfig (JSONB) -- for custom SMTP
  - webhookSecret (VARCHAR)
  - createdAt, updatedAt
  ```
- [ ] Create Prisma migration for EmailProvider
- [ ] Add indexes for organizationId and isActive
- [ ] Create unique constraint on organizationId + name

### 1.2 Create WhatsApp Provider Schema
- [ ] Design `WhatsAppProvider` table structure
  ```sql
  -- Fields needed:
  - id (UUID)
  - organizationId (UUID, FK)
  - providerType (ENUM: AISENSY, INTERAKT, GUPSHUP, TWILIO)
  - name (VARCHAR)
  - phoneNumber (VARCHAR)
  - phoneNumberId (VARCHAR)
  - businessAccountId (VARCHAR)
  - accessToken (encrypted)
  - webhookVerifyToken (VARCHAR)
  - webhookUrl (VARCHAR)
  - isActive (BOOLEAN)
  - displayName (VARCHAR)
  - about (TEXT)
  - profilePictureUrl (VARCHAR)
  - businessCategory (VARCHAR)
  - createdAt, updatedAt
  ```
- [ ] Create Prisma migration for WhatsAppProvider
- [ ] Add indexes and constraints
- [ ] Create relationship with Organization

### 1.3 Create Messaging Usage Tracking
- [ ] Design `MessagingUsage` table
- [ ] Create `MessagingCredit` table for prepaid credits
- [ ] Create `MessagingInvoice` table for billing
- [ ] Add usage tracking indexes for performance

---

## Phase 2: Provider Service Implementation (Week 2-3)

### 2.1 Email Service Extension
- [ ] Create `/src/lib/email-providers/` directory structure
  ```
  email-providers/
  ├── base-provider.ts
  ├── mailgun-provider.ts
  ├── mailjet-provider.ts
  ├── sendgrid-provider.ts
  ├── smtp-provider.ts
  ├── email-service.ts (multi-tenant)
  └── types.ts
  ```

- [ ] Implement `BaseEmailProvider` interface
  ```typescript
  interface BaseEmailProvider {
    name: string;
    sendEmail(options: EmailOptions): Promise<EmailResult>;
    verifyDomain(domain: string): Promise<DomainVerification>;
    getStats(period: DateRange): Promise<EmailStats>;
    validateConfig(): boolean;
    setupWebhooks(url: string): Promise<void>;
  }
  ```

- [ ] Implement Mailgun provider with:
  - [ ] Domain verification automation
  - [ ] SPF/DKIM record generation
  - [ ] Webhook setup for events
  - [ ] Suppression list management
  - [ ] Template storage per organization

- [ ] Implement organization-specific email service
  ```typescript
  class MultiTenantEmailService {
    async getOrganizationProvider(organizationId: string): Promise<EmailProvider>
    async sendEmail(organizationId: string, options: EmailOptions): Promise<EmailResult>
    async updateProviderConfig(organizationId: string, config: EmailConfig): Promise<void>
    async testConfiguration(organizationId: string): Promise<TestResult>
  }
  ```

### 2.2 WhatsApp Service Extension
- [ ] Create `/src/lib/whatsapp-providers/` directory structure
  ```
  whatsapp-providers/
  ├── base-provider.ts
  ├── aisensy-provider.ts
  ├── interakt-provider.ts
  ├── gupshup-provider.ts
  ├── whatsapp-service.ts (multi-tenant)
  └── types.ts
  ```

- [ ] Implement `BaseWhatsAppProvider` interface
  ```typescript
  interface BaseWhatsAppProvider {
    name: string;
    sendMessage(options: WhatsAppMessage): Promise<WhatsAppResult>;
    sendTemplate(options: TemplateMessage): Promise<WhatsAppResult>;
    uploadMedia(file: Buffer, type: MediaType): Promise<MediaUpload>;
    getMessageStatus(messageId: string): Promise<MessageStatus>;
    setupWebhook(url: string, token: string): Promise<void>;
  }
  ```

- [ ] Implement AiSensy provider integration
- [ ] Create webhook handlers for message status
- [ ] Implement template management system
- [ ] Add media message support

### 2.3 Unified Messaging Service
- [ ] Create `/src/lib/messaging/unified-service.ts`
- [ ] Implement channel routing logic
- [ ] Add message queuing system
- [ ] Create delivery status tracking
- [ ] Implement retry mechanisms

---

## Phase 3: API Endpoints (Week 3-4)

### 3.1 Email Provider APIs
- [ ] `GET /api/email/providers` - List organization's email providers
- [ ] `POST /api/email/providers` - Create new email provider
- [ ] `PUT /api/email/providers/:id` - Update provider config
- [ ] `DELETE /api/email/providers/:id` - Remove provider
- [ ] `POST /api/email/providers/:id/test` - Test configuration
- [ ] `POST /api/email/providers/:id/verify-domain` - Verify sender domain
- [ ] `GET /api/email/providers/:id/stats` - Get provider statistics

### 3.2 WhatsApp Provider APIs
- [ ] `GET /api/whatsapp/providers` - List WhatsApp providers
- [ ] `POST /api/whatsapp/providers` - Create provider
- [ ] `PUT /api/whatsapp/providers/:id` - Update provider
- [ ] `DELETE /api/whatsapp/providers/:id` - Remove provider
- [ ] `POST /api/whatsapp/providers/:id/test` - Test configuration
- [ ] `GET /api/whatsapp/providers/:id/templates` - List templates
- [ ] `POST /api/whatsapp/providers/:id/templates` - Create template

### 3.3 Unified Messaging APIs
- [ ] `POST /api/messaging/send` - Send message (any channel)
- [ ] `GET /api/messaging/status/:messageId` - Get message status
- [ ] `GET /api/messaging/usage` - Get usage statistics
- [ ] `GET /api/messaging/credits` - Get credit balance
- [ ] `POST /api/messaging/credits/purchase` - Purchase credits

### 3.4 Webhook Endpoints
- [ ] `POST /api/webhooks/email/:providerId` - Email event webhooks
- [ ] `POST /api/webhooks/whatsapp/:providerId` - WhatsApp webhooks
- [ ] `POST /api/webhooks/sms/:providerId` - SMS delivery webhooks

---

## Phase 4: Frontend Implementation (Week 4-5)

### 4.1 Provider Management UI
- [ ] Create Email Provider Settings Page
  ```tsx
  /src/app/(dashboard)/settings/email/page.tsx
  Components needed:
  - EmailProviderList
  - EmailProviderForm
  - DomainVerification
  - EmailTestModal
  ```

- [ ] Create WhatsApp Provider Settings Page
  ```tsx
  /src/app/(dashboard)/settings/whatsapp/page.tsx
  Components needed:
  - WhatsAppProviderList
  - WhatsAppProviderForm
  - TemplateManager
  - WhatsAppTestModal
  ```

### 4.2 Messaging Dashboard
- [ ] Create unified messaging dashboard
- [ ] Add channel selection UI
- [ ] Implement message composer
- [ ] Add recipient management
- [ ] Create delivery status tracking UI

### 4.3 Usage & Billing UI
- [ ] Create usage analytics dashboard
- [ ] Add credit balance display
- [ ] Implement billing history
- [ ] Add credit purchase flow
- [ ] Create usage alerts configuration

---

## Phase 5: Testing & Security (Week 5-6)

### 5.1 Security Implementation
- [ ] Implement provider credential encryption
  ```typescript
  // Use AES-256-GCM encryption for API keys
  class CredentialEncryption {
    encrypt(plaintext: string): EncryptedData
    decrypt(encrypted: EncryptedData): string
  }
  ```

- [ ] Add rate limiting per organization
- [ ] Implement content filtering
- [ ] Add IP whitelisting option
- [ ] Create audit logging for all provider changes

### 5.2 Testing Suite
- [ ] Unit tests for each provider
- [ ] Integration tests for multi-tenant logic
- [ ] Load testing for message sending
- [ ] Webhook handling tests
- [ ] Error scenario testing

### 5.3 Monitoring & Alerts
- [ ] Set up provider health monitoring
- [ ] Create delivery rate alerts
- [ ] Implement cost threshold alerts
- [ ] Add usage anomaly detection
- [ ] Create provider failover system

---

## Phase 6: Advanced Features (Week 7-8)

### 6.1 Smart Routing
- [ ] Implement cost-based routing
- [ ] Add delivery rate-based routing
- [ ] Create geographic routing rules
- [ ] Implement time-based routing
- [ ] Add fallback provider logic

### 6.2 Template System
- [ ] Create template storage system
- [ ] Add template variables
- [ ] Implement template versioning
- [ ] Add A/B testing for templates
- [ ] Create template analytics

### 6.3 Automation Features
- [ ] Implement scheduled messaging
- [ ] Add triggered campaigns
- [ ] Create drip campaigns
- [ ] Implement personalization engine
- [ ] Add behavioral triggers

---

## Phase 7: Documentation & Training (Week 8)

### 7.1 Technical Documentation
- [ ] API documentation with examples
- [ ] Provider setup guides
- [ ] Webhook integration guide
- [ ] Security best practices
- [ ] Troubleshooting guide

### 7.2 User Documentation
- [ ] Getting started guide
- [ ] Provider configuration tutorials
- [ ] Video walkthroughs
- [ ] FAQs
- [ ] Best practices guide

### 7.3 Internal Documentation
- [ ] System architecture diagram
- [ ] Database schema documentation
- [ ] Deployment procedures
- [ ] Monitoring runbooks
- [ ] Support procedures

---

## 🚀 Quick Start Checklist

### Week 1: Foundation
- [ ] Set up development environment
- [ ] Create database migrations
- [ ] Sign up for provider accounts
- [ ] Get API credentials

### Week 2: Core Development
- [ ] Implement email providers
- [ ] Implement WhatsApp providers
- [ ] Create basic APIs
- [ ] Test provider connections

### Week 3: Integration
- [ ] Build unified service
- [ ] Create webhook handlers
- [ ] Implement usage tracking
- [ ] Add security measures

### Week 4: UI Development
- [ ] Create settings pages
- [ ] Build messaging interface
- [ ] Add monitoring dashboard
- [ ] Implement billing UI

### Week 5: Testing & Launch
- [ ] Complete testing suite
- [ ] Fix identified issues
- [ ] Deploy to staging
- [ ] Conduct user testing

### Week 6: Production
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Gather feedback
- [ ] Plan improvements

---

## 📊 Success Criteria

- ✅ All three channels (SMS, Email, WhatsApp) fully integrated
- ✅ Multi-tenant isolation working correctly
- ✅ Provider switching without code changes
- ✅ Usage tracking accurate to 99.9%
- ✅ Billing system calculating correctly
- ✅ All security measures implemented
- ✅ Documentation complete
- ✅ 99.9% uptime achieved

---

*Remember: Start with Email (easiest), then SMS improvements, finally WhatsApp (most complex)*

**Let's build Africa's best messaging platform! 🚀**