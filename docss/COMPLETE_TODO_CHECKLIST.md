# ✅ MARKETSAGE COMPLETE TODO CHECKLIST

**Created:** October 3, 2025
**Based on:** Comprehensive Platform Audit + Security Architecture Review
**Total Tasks:** 200+
**Estimated Timeline:** 14 weeks (MVP) to 24 weeks (Full Launch)

---

## 📋 HOW TO USE THIS CHECKLIST

1. **Choose your launch strategy** (Soft Launch / MVP / Full Launch)
2. **Start with CRITICAL tasks** - These block production deployment
3. **Track progress** by checking off completed items
4. **Update weekly** during sprint planning
5. **Reference the master report** for detailed implementation guides

---

## 🔴 CRITICAL PRIORITY - WEEK 1-2 (BLOCKING PRODUCTION)

### 🚨 DAY 1 (TODAY) - IMMEDIATE ACTIONS

#### Security Emergency Fixes (5 minutes - 4 hours)

- [ ] **Enable API-Only Mode** 🚨 **DO THIS FIRST** (5 minutes)
  - [ ] Add `NEXT_PUBLIC_USE_API_ONLY=true` to `/frontend/.env.local`
  - [ ] Restart frontend dev server
  - [ ] Test that direct Prisma access throws errors
  - [ ] Document change in changelog
  - **Why:** Blocks frontend from directly accessing database (CRITICAL SECURITY FLAW)
  - **Files:** `/frontend/.env.local`
  - **Test:** Visit `/api/contacts` - should see error about API-only mode

- [ ] **Install helmet.js Security Headers** (2 hours)
  - [ ] `cd marketsage-backend && npm install helmet`
  - [ ] Import helmet in `/backend/src/main.ts`
  - [ ] Add `app.use(helmet());` before other middleware
  - [ ] Test security headers with: `curl -I http://localhost:3006`
  - [ ] Verify headers: X-Frame-Options, X-Content-Type-Options, etc.
  - **Why:** Protects against XSS, clickjacking, MIME sniffing
  - **Files:** `/backend/src/main.ts`, `/backend/package.json`

- [ ] **Create .env.example Files** (1 hour)
  - [ ] Create `/frontend/.env.example` with all required vars
  - [ ] Create `/backend/.env.example` with all required vars
  - [ ] Document each variable with comments
  - [ ] Add to version control
  - **Why:** Team members need to know required environment setup
  - **Files:** `.env.example` (both frontend and backend)

#### Project Setup

- [ ] **Choose Launch Strategy** (30 minutes)
  - [ ] Review options: Soft Launch (8 weeks) / MVP (14 weeks) / Full (24 weeks)
  - [ ] Consider: Budget, timeline, team size, market urgency
  - [ ] Document decision with rationale
  - [ ] Share with stakeholders
  - **Recommendation:** MVP Launch (14 weeks) - best balance

- [ ] **Set Up Project Management** (1 hour)
  - [ ] Choose tool: Jira / Linear / GitHub Projects / Trello
  - [ ] Create project board
  - [ ] Import tasks from this checklist
  - [ ] Assign team members
  - [ ] Set sprint cadence (recommended: 2-week sprints)

---

### DAY 2 - Security Hardening Continued

#### Password & Authentication Security (6 hours)

- [ ] **Strengthen Password Requirements** (4 hours)
  - [ ] Open `/backend/src/auth/dto/register.dto.ts`
  - [ ] Update password validation regex to:
    ```typescript
    @Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
      { message: 'Password must be 12+ characters with uppercase, lowercase, number, and special character' }
    )
    password: string;
    ```
  - [ ] Update frontend validation to match
  - [ ] Test registration with weak passwords (should fail)
  - [ ] Test registration with strong passwords (should succeed)
  - [ ] Update password reset flow with same rules
  - **Why:** Current 8-char minimum is vulnerable to brute force
  - **Files:** `/backend/src/auth/dto/register.dto.ts`

- [ ] **Fix Frontend Build Warnings** (2 hours)
  - [ ] Open `/frontend/src/lib/api/hooks/useUnifiedCampaigns.ts`
  - [ ] Export `WinnerCriteria` type/interface
  - [ ] Export `VariantType` type/interface
  - [ ] Run `npm run build` in frontend
  - [ ] Verify no warnings about missing exports
  - **Why:** Build warnings indicate potential runtime errors
  - **Files:** `/frontend/src/lib/api/hooks/useUnifiedCampaigns.ts`

#### Monitoring & Observability (2 hours)

- [ ] **Set Up Error Monitoring** (2 hours)
  - [ ] Choose tool: Sentry / Rollbar / Bugsnag
  - [ ] Create account and get DSN
  - [ ] Install SDK: `npm install @sentry/node @sentry/nextjs`
  - [ ] Configure in `/backend/src/main.ts`
  - [ ] Configure in `/frontend/next.config.js`
  - [ ] Test by triggering an error
  - [ ] Verify error appears in dashboard
  - **Why:** Need to catch production errors immediately
  - **Files:** `main.ts`, `next.config.js`, `instrumentation.ts`

---

### DAY 3-4 - Account Security & Database

#### Account Lockout Mechanism (8 hours)

- [ ] **Update Prisma Schema** (1 hour)
  - [ ] Open `/backend/prisma/schema.prisma`
  - [ ] Add to User model:
    ```prisma
    failedLoginAttempts Int @default(0)
    lockedUntil DateTime?
    lastLoginAttempt DateTime?
    ```
  - [ ] Run `npx prisma migrate dev --name add-account-lockout`
  - [ ] Run `npx prisma generate`
  - **Files:** `/backend/prisma/schema.prisma`

- [ ] **Implement Lockout Logic** (5 hours)
  - [ ] Open `/backend/src/auth/auth.service.ts`
  - [ ] Add lockout check at start of `login()` method
  - [ ] If `lockedUntil > now`, throw `UnauthorizedException`
  - [ ] On failed login:
    - Increment `failedLoginAttempts`
    - If attempts >= 5, set `lockedUntil` to 30 minutes from now
  - [ ] On successful login:
    - Reset `failedLoginAttempts` to 0
    - Clear `lockedUntil`
  - [ ] Add logging for lockout events
  - **Files:** `/backend/src/auth/auth.service.ts`

- [ ] **Test Lockout Mechanism** (2 hours)
  - [ ] Attempt 4 failed logins (should still allow)
  - [ ] Attempt 5th failed login (should lock account)
  - [ ] Try logging in while locked (should fail with clear message)
  - [ ] Wait 30 minutes OR manually clear `lockedUntil` in DB
  - [ ] Login successfully (should work and reset counter)
  - [ ] Document behavior in `/docs/SECURITY.md`

#### Database Audit (4 hours)

- [ ] **Identify Routes Using Prisma** (4 hours)
  - [ ] Run: `cd /Users/supreme/Desktop/marketsage-frontend`
  - [ ] Run: `grep -r "await prisma\." src/app/api --include="*.ts" > prisma-usage.txt`
  - [ ] Review output file - should find 50+ files
  - [ ] Categorize by priority:
    - **Critical:** Auth, billing, user management
    - **High:** Campaigns, contacts, workflows
    - **Medium:** Analytics, LeadPulse
    - **Low:** Admin utilities
  - [ ] Create migration plan spreadsheet
  - [ ] Estimate effort per route (1-4 hours each)
  - **Output:** `prisma-usage.txt`, migration plan spreadsheet

---

### DAY 5 - Secrets & Infrastructure

#### Remove Security Fallbacks (2 hours)

- [ ] **Remove Fallback JWT Secret** (2 hours)
  - [ ] Open `/backend/src/auth/strategies/jwt.strategy.ts`
  - [ ] Find constructor
  - [ ] Replace fallback logic with:
    ```typescript
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('FATAL: JWT_SECRET environment variable is required');
    }
    ```
  - [ ] Test with missing JWT_SECRET (should crash on startup)
  - [ ] Verify JWT_SECRET exists in all environments
  - [ ] Update deployment checklist to verify JWT_SECRET
  - **Why:** Fallback secrets are predictable and insecure
  - **Files:** `/backend/src/auth/strategies/jwt.strategy.ts`

#### Monitoring Dashboards (4 hours)

- [ ] **Configure Monitoring Dashboards** (4 hours)
  - [ ] Set up Grafana/Prometheus (or use existing stack)
  - [ ] Create dashboard: "Production Health"
    - API response times (p50, p95, p99)
    - Error rates
    - Database connection pool
    - Redis cache hit rate
  - [ ] Create dashboard: "Business Metrics"
    - Active users
    - Campaigns sent (email, SMS, WhatsApp)
    - Revenue (daily, weekly, monthly)
  - [ ] Set up alerts:
    - Error rate > 1%
    - API p95 > 1000ms
    - Database connections > 80%
  - [ ] Test alerts by triggering thresholds
  - **Tools:** Grafana, Prometheus

---

### WEEK 2 - Security Completion

#### API Security Audit (8 hours)

- [ ] **Audit All API Endpoints for Auth** (8 hours)
  - [ ] List all controllers in `/backend/src/`
  - [ ] For each controller:
    - [ ] Verify `@UseGuards(JwtAuthGuard)` on protected routes
    - [ ] Check permission decorators (if using RBAC)
    - [ ] Verify input validation with DTOs
    - [ ] Check rate limiting decorators
  - [ ] Test unauthorized access to each endpoint
  - [ ] Document any endpoints intentionally public
  - [ ] Fix missing guards
  - **Files:** All `*.controller.ts` in `/backend/src/`

#### Environment Setup (8 hours)

- [ ] **Set Up Staging Environment** (8 hours)
  - [ ] Provision infrastructure (AWS/GCP/Azure/DigitalOcean)
  - [ ] Set up staging database (PostgreSQL)
  - [ ] Set up staging Redis
  - [ ] Configure environment variables
  - [ ] Deploy backend to staging
  - [ ] Deploy frontend to staging
  - [ ] Test full authentication flow
  - [ ] Test SMS sending (use test numbers)
  - [ ] Verify monitoring works
  - **Infrastructure:** Cloud provider dashboard

#### Database & Deployment (6 hours)

- [ ] **Database Backup Automation** (4 hours)
  - [ ] Configure automated PostgreSQL backups
  - [ ] Set retention: 7 daily, 4 weekly, 12 monthly
  - [ ] Test backup creation
  - [ ] Test backup restoration to separate DB
  - [ ] Document recovery procedures in `/docs/RECOVERY.md`
  - [ ] Set up alerts for failed backups
  - **Infrastructure:** Database provider

- [ ] **Create Deployment Checklist** (2 hours)
  - [ ] Create `/docs/DEPLOYMENT.md`
  - [ ] Document pre-deployment steps:
    - [ ] Run tests
    - [ ] Build succeeds
    - [ ] Database migrations reviewed
    - [ ] Environment variables verified
  - [ ] Document deployment steps for each environment
  - [ ] Document rollback procedures
  - [ ] Document success criteria
  - [ ] Get team approval
  - **Output:** `/docs/DEPLOYMENT.md`

---

## 🟠 HIGH PRIORITY - WEEK 3-8 (REVENUE BLOCKERS)

### WEEK 3-4: Email Provider Infrastructure

#### Dependencies & Setup (30 minutes)

- [ ] **Install Email Dependencies** (30 minutes)
  - [ ] `cd marketsage-backend`
  - [ ] `npm install nodemailer @aws-sdk/client-ses handlebars bull @nestjs/bull`
  - [ ] `npm install --save-dev @types/nodemailer`
  - [ ] Verify installation with `npm list`
  - **Files:** `/backend/package.json`

#### SMTP Provider (1 day)

- [ ] **Create SMTP Provider Class** (8 hours)
  - [ ] Create `/backend/src/email/providers/smtp-provider.ts`
  - [ ] Implement interface: `send(email: EmailData): Promise<SendResult>`
  - [ ] Use nodemailer for SMTP connection
  - [ ] Add retry logic (3 attempts with exponential backoff)
  - [ ] Handle errors: connection refused, auth failed, timeout
  - [ ] Add logging for all operations
  - [ ] Write unit tests
  - **Files:** `/backend/src/email/providers/smtp-provider.ts`

- [ ] **Test SMTP with Zoho** (2 hours)
  - [ ] Use existing credentials from .env
  - [ ] Send test email to your address
  - [ ] Verify delivery
  - [ ] Test error cases (wrong password, invalid recipient)
  - [ ] Monitor logs for issues

#### AWS SES Provider (1 day)

- [ ] **Create SES Provider Class** (8 hours)
  - [ ] Create `/backend/src/email/providers/ses-provider.ts`
  - [ ] Implement same interface as SMTP provider
  - [ ] Use AWS SDK v3 for SES
  - [ ] Handle SES-specific errors (throttling, bounce)
  - [ ] Add configuration for regions
  - [ ] Write unit tests
  - **Files:** `/backend/src/email/providers/ses-provider.ts`

- [ ] **Test SES (Optional)** (2 hours)
  - [ ] Set up AWS account (if using SES)
  - [ ] Request SES sandbox exit (production)
  - [ ] Add AWS credentials to .env
  - [ ] Send test email
  - [ ] Verify delivery

#### Provider Management (1 day)

- [ ] **Build Email Provider Manager** (8 hours)
  - [ ] Create `/backend/src/email/providers/email-provider-manager.ts`
  - [ ] Implement provider selection logic:
    - Primary provider (SMTP or SES)
    - Fallback to secondary if primary fails
  - [ ] Track provider health and success rates
  - [ ] Add provider rotation for load balancing
  - [ ] Write tests for failover scenarios
  - **Files:** `/backend/src/email/providers/email-provider-manager.ts`

#### Configuration (2 hours)

- [ ] **Add Provider Configuration to Environment** (2 hours)
  - [ ] Document SMTP variables in `.env.example`:
    ```
    EMAIL_PRIMARY_PROVIDER=smtp  # or 'ses'
    SMTP_HOST=smtp.yourdomain.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=<username>
    SMTP_PASS=<password>
    ```
  - [ ] Document SES variables (optional):
    ```
    AWS_ACCESS_KEY_ID=<key>
    AWS_SECRET_ACCESS_KEY=<secret>
    AWS_REGION=us-east-1
    ```
  - [ ] Add to production environment
  - [ ] Test configuration loading
  - **Files:** `.env.example`, production `.env`

---

### WEEK 5: Template Rendering Engine

#### Handlebars Setup (2 days)

- [ ] **Build Template Renderer Service** (16 hours)
  - [ ] Create `/backend/src/email/template-renderer.service.ts`
  - [ ] Initialize Handlebars
  - [ ] Register custom helpers:
    - `formatCurrency(amount, currency)` - Nigerian Naira formatting
    - `formatDate(date, format)` - Local date formatting
    - `formatPhone(number)` - Nigerian number formatting
    - `uppercase(text)`, `lowercase(text)`
  - [ ] Implement `render(template, data)` method
  - [ ] Implement `renderCampaign(campaign, contact)` method
  - [ ] Handle missing variables gracefully
  - [ ] Escape HTML in user data
  - [ ] Write comprehensive tests
  - **Files:** `/backend/src/email/template-renderer.service.ts`

- [ ] **Test Personalization** (4 hours)
  - [ ] Create test template with:
    ```
    Hello {{firstName}} {{lastName}},
    Your balance: {{formatCurrency balance "NGN"}}
    ```
  - [ ] Test with complete contact data
  - [ ] Test with missing fields
  - [ ] Test with special characters
  - [ ] Test with very long content
  - [ ] Verify all variables render correctly

#### Unsubscribe System (4 hours)

- [ ] **Generate Unsubscribe Links** (2 hours)
  - [ ] Create method: `generateUnsubscribeUrl(contactId, campaignId)`
  - [ ] Generate secure token (JWT or HMAC)
  - [ ] Include token in template data
  - [ ] Add unsubscribe URL to all email templates
  - **Files:** `/backend/src/email/template-renderer.service.ts`

- [ ] **Create Unsubscribe Endpoint** (2 hours)
  - [ ] Create `/backend/src/email/unsubscribe.controller.ts`
  - [ ] Add route: `GET /email/unsubscribe/:token`
  - [ ] Verify token
  - [ ] Update contact: `emailSubscribed = false`
  - [ ] Log unsubscribe in database
  - [ ] Return confirmation page
  - [ ] Test with various tokens
  - **Files:** `/backend/src/email/unsubscribe.controller.ts`

#### Integration Testing (1 day)

- [ ] **Test with Real Campaign Templates** (8 hours)
  - [ ] Load existing templates from database
  - [ ] Test rendering for each template type:
    - Welcome emails
    - Campaign emails
    - Transactional emails
  - [ ] Verify personalization works
  - [ ] Check all edge cases:
    - Missing contact data
    - Very long names
    - Special characters in names
    - Multiple languages
  - [ ] Fix any rendering issues
  - [ ] Document template guidelines

---

### WEEK 6: Email Queue Implementation

#### Queue Setup (1 day)

- [ ] **Set Up BullMQ Email Queue** (8 hours)
  - [ ] Install if not already: `npm install bull @nestjs/bull`
  - [ ] Create `/backend/src/email/email.queue.ts`
  - [ ] Configure queue with Redis connection
  - [ ] Set job options:
    ```typescript
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
    ```
  - [ ] Add queue to EmailModule
  - [ ] Test queue connection
  - **Files:** `/backend/src/email/email.queue.ts`, `email.module.ts`

#### Email Processor (2 days)

- [ ] **Create Email Processor** (16 hours)
  - [ ] Create `/backend/src/email/email.processor.ts`
  - [ ] Decorate class with `@Processor('email-sending')`
  - [ ] Implement `@Process('send-email')` method
  - [ ] Process logic:
    1. Get campaign and contact from database
    2. Render personalized template
    3. Select email provider
    4. Send email
    5. Track in database (EmailActivity)
    6. Handle errors and retry
  - [ ] Add logging for each step
  - [ ] Write tests for:
    - Successful send
    - Provider failure (should retry)
    - Permanent failure (should log)
  - **Files:** `/backend/src/email/email.processor.ts`

#### Update Email Service (1 day)

- [ ] **Update sendCampaign Method** (8 hours)
  - [ ] Open `/backend/src/email/email.service.ts`
  - [ ] Replace direct sending with queue:
    ```typescript
    for (const recipient of recipients) {
      await this.emailQueue.add('send-email', {
        campaignId: campaign.id,
        recipientId: recipient.id,
        email: recipient.email
      });
    }
    ```
  - [ ] Update campaign status to 'SENDING'
  - [ ] Return queue status instead of send results
  - [ ] Add method to check campaign progress
  - [ ] Write tests
  - **Files:** `/backend/src/email/email.service.ts`

#### Load Testing (1 day)

- [ ] **Test Queue with 1000 Emails** (8 hours)
  - [ ] Create test campaign with 1000 recipients
  - [ ] Start campaign send
  - [ ] Monitor queue processing:
    - Number of jobs pending
    - Jobs completed
    - Jobs failed
    - Processing rate (emails/minute)
  - [ ] Verify all emails sent
  - [ ] Check error logs for issues
  - [ ] Optimize if processing too slow
  - **Tools:** Bull Board dashboard, logs

---

### WEEK 7: Email Webhook Handlers

#### Webhook Controller (1 day)

- [ ] **Create Webhook Controller** (8 hours)
  - [ ] Create `/backend/src/email/webhooks.controller.ts`
  - [ ] Add SES webhook endpoint: `POST /webhooks/email/ses`
  - [ ] Add SMTP webhook endpoint: `POST /webhooks/email/smtp`
  - [ ] Verify webhook signatures (SES SNS signature)
  - [ ] Route to appropriate handler
  - [ ] Return 200 OK to acknowledge receipt
  - [ ] Write tests
  - **Files:** `/backend/src/email/webhooks.controller.ts`

#### Bounce & Complaint Handling (1 day)

- [ ] **Handle Bounces and Complaints** (8 hours)
  - [ ] Create `/backend/src/email/webhook-handler.service.ts`
  - [ ] Parse bounce notifications:
    - Hard bounce (permanent)
    - Soft bounce (temporary)
  - [ ] Update contact status:
    - Hard bounce → `emailBounced = true`, `emailSubscribed = false`
    - Soft bounce → log but keep subscribed
  - [ ] Handle complaints (spam reports):
    - Update contact → `emailSubscribed = false`
    - Add to suppression list
  - [ ] Track in EmailActivity table
  - [ ] Write tests for each event type
  - **Files:** `/backend/src/email/webhook-handler.service.ts`

#### Engagement Tracking (1 day)

- [ ] **Track Opens and Clicks** (8 hours)
  - [ ] Add tracking pixel to email templates:
    ```html
    <img src="{{trackingPixelUrl}}" width="1" height="1" />
    ```
  - [ ] Create tracking pixel endpoint: `GET /email/track/:campaignId/:contactId`
  - [ ] Log open event in EmailActivity
  - [ ] Create click tracking:
    - Replace links with tracking URLs
    - Create redirect endpoint: `GET /email/click/:linkId`
    - Log click event
    - Redirect to original URL
  - [ ] Update campaign analytics
  - [ ] Test tracking
  - **Files:** `tracking.service.ts`, `tracking.controller.ts`

#### Webhook Testing (1 day)

- [ ] **Test Webhook Integrations** (8 hours)
  - [ ] Send test emails
  - [ ] Trigger bounces:
    - Send to invalid@example.com (bounce)
    - Send to complaint@simulator.amazonses.com (complaint)
  - [ ] Verify webhook received
  - [ ] Check database updates
  - [ ] Test tracking pixel (open email)
  - [ ] Test click tracking (click link)
  - [ ] Fix any issues
  - **Tools:** Email testing services, logs

---

### WEEK 8: Email Testing & Deployment

#### Comprehensive Testing (2 days)

- [ ] **Write Email Tests** (16 hours)
  - [ ] Unit tests:
    - [ ] SMTP provider send
    - [ ] SES provider send
    - [ ] Template renderer
    - [ ] Unsubscribe logic
  - [ ] Integration tests:
    - [ ] Full campaign send flow
    - [ ] Queue processing
    - [ ] Webhook handling
  - [ ] E2E tests:
    - [ ] User creates campaign
    - [ ] Campaign sends to contacts
    - [ ] User views analytics
  - [ ] Achieve > 80% code coverage
  - **Files:** `*.spec.ts` throughout email module

#### Load Testing (1 day)

- [ ] **Load Test with 10k Emails** (8 hours)
  - [ ] Create test campaign with 10,000 recipients
  - [ ] Start campaign
  - [ ] Monitor system:
    - CPU usage
    - Memory usage
    - Database connections
    - Queue depth
    - Email send rate
  - [ ] Identify bottlenecks
  - [ ] Optimize:
    - Increase queue concurrency
    - Add database indexes
    - Optimize queries
  - [ ] Retest until acceptable performance
  - **Goal:** > 100 emails/minute

#### Deliverability Testing (1 day)

- [ ] **Monitor Email Deliverability** (8 hours)
  - [ ] Send test emails to multiple providers:
    - Gmail
    - Outlook
    - Yahoo
    - ProtonMail
  - [ ] Check spam scores (use mail-tester.com)
  - [ ] Verify emails land in inbox (not spam)
  - [ ] Test with different content:
    - Plain text
    - HTML with images
    - Links
  - [ ] Fix deliverability issues:
    - Set up SPF record
    - Set up DKIM
    - Set up DMARC
  - [ ] Retest until > 95% inbox rate
  - **Tools:** mail-tester.com, GlockApps

#### Documentation (1 day)

- [ ] **Create Email Documentation** (8 hours)
  - [ ] Create `/docs/EMAIL_SETUP.md`
  - [ ] Document:
    - Provider configuration (SMTP, SES)
    - How to create campaigns
    - Template syntax and helpers
    - Webhook setup
    - Troubleshooting common issues
  - [ ] Add code examples
  - [ ] Create video walkthrough (optional)
  - [ ] Review with team
  - **Output:** `/docs/EMAIL_SETUP.md`

---

### WEEK 9: Paystack Payment Integration

#### Paystack Account Setup (30 minutes)

- [ ] **Configure Paystack Credentials** (30 minutes)
  - [ ] Get Paystack secret key from dashboard
  - [ ] Get Paystack public key
  - [ ] Add to `/backend/.env`:
    ```
    PAYSTACK_SECRET_KEY=sk_test_...
    PAYSTACK_PUBLIC_KEY=pk_test_...
    ```
  - [ ] Add to `.env.example`
  - [ ] Test API connection
  - **Files:** `.env`, `.env.example`

#### Initialize Payment (1 day)

- [ ] **Implement Real initializePayment** (8 hours)
  - [ ] Open `/backend/src/billing/paystack.service.ts`
  - [ ] Replace mock implementation:
    ```typescript
    async initializePayment(params: InitializePaymentDto) {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: params.email,
          amount: params.amount * 100, // Convert to kobo
          plan: params.planCode,
          metadata: { userId: params.userId, planId: params.planId },
          callback_url: `${process.env.FRONTEND_URL}/billing/verify`,
        },
        { headers: { Authorization: `Bearer ${this.secretKey}` }}
      );
      return response.data.data;
    }
    ```
  - [ ] Add error handling
  - [ ] Add logging
  - [ ] Write tests
  - **Files:** `/backend/src/billing/paystack.service.ts`

#### Verify Payment (1 day)

- [ ] **Implement Real verifyPayment** (8 hours)
  - [ ] Add verification method:
    ```typescript
    async verifyPayment(reference: string) {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${this.secretKey}` }}
      );

      if (response.data.data.status !== 'success') {
        throw new PaymentException('Payment verification failed');
      }

      return response.data.data;
    }
    ```
  - [ ] Update subscription in database
  - [ ] Create payment record
  - [ ] Send confirmation email
  - [ ] Write tests
  - **Files:** `/backend/src/billing/paystack.service.ts`

#### Customer Management (1 day)

- [ ] **Implement Create Customer** (8 hours)
  - [ ] Add method to create customer on Paystack:
    ```typescript
    async createCustomer(user: User) {
      const response = await axios.post(
        'https://api.paystack.co/customer',
        {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        { headers: { Authorization: `Bearer ${this.secretKey}` }}
      );
      return response.data.data;
    }
    ```
  - [ ] Store customer code in database
  - [ ] Handle duplicate customers
  - [ ] Write tests
  - **Files:** `/backend/src/billing/paystack.service.ts`

#### Integration Testing (1 day)

- [ ] **Test Complete Payment Flow** (8 hours)
  - [ ] Initialize test payment
  - [ ] Visit payment URL
  - [ ] Complete payment with test card:
    ```
    Card: 4084 0840 8408 4081
    Expiry: Any future date
    CVV: 408
    ```
  - [ ] Verify callback received
  - [ ] Check subscription updated in database
  - [ ] Check payment record created
  - [ ] Test failure cases (declined card, etc.)
  - **Tools:** Paystack test dashboard

---

### WEEK 10: Payment Webhook Handler

#### Webhook Endpoint (1 day)

- [ ] **Create Paystack Webhook Controller** (8 hours)
  - [ ] Create `/backend/src/billing/webhook.controller.ts`
  - [ ] Add POST endpoint `/webhooks/paystack`
  - [ ] Verify webhook signature:
    ```typescript
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      throw new UnauthorizedException('Invalid signature');
    }
    ```
  - [ ] Route to webhook handler service
  - [ ] Return 200 OK
  - [ ] Write tests
  - **Files:** `/backend/src/billing/webhook.controller.ts`

#### Success Handler (1 day)

- [ ] **Handle charge.success Event** (8 hours)
  - [ ] Create `/backend/src/billing/webhook-handler.service.ts`
  - [ ] Implement handler for `charge.success`:
    ```typescript
    async handleChargeSuccess(data: any) {
      // Update subscription status to ACTIVE
      await this.prisma.subscription.update({
        where: { userId: data.metadata.userId },
        data: {
          status: 'ACTIVE',
          paystackCustomerId: data.customer.customer_code,
          currentPeriodEnd: new Date(data.subscription?.next_payment_date)
        }
      });

      // Create payment record
      await this.prisma.payment.create({
        data: {
          userId: data.metadata.userId,
          amount: data.amount / 100,
          currency: 'NGN',
          status: 'SUCCESS',
          provider: 'paystack',
          reference: data.reference
        }
      });

      // Send confirmation email
      await this.emailService.sendPaymentConfirmation(data.metadata.userId);
    }
    ```
  - [ ] Add logging
  - [ ] Write tests
  - **Files:** `/backend/src/billing/webhook-handler.service.ts`

#### Failure Handler (1 day)

- [ ] **Handle payment_failed Event** (8 hours)
  - [ ] Implement handler for `invoice.payment_failed`:
    ```typescript
    async handlePaymentFailed(data: any) {
      // Update subscription to PAST_DUE
      await this.prisma.subscription.update({
        where: { userId: data.metadata.userId },
        data: { status: 'PAST_DUE' }
      });

      // Create failed payment record
      await this.prisma.payment.create({
        data: {
          userId: data.metadata.userId,
          amount: data.amount / 100,
          status: 'FAILED',
          provider: 'paystack',
          reference: data.reference
        }
      });

      // Send notification email
      await this.emailService.sendPaymentFailedNotification(data.metadata.userId);
    }
    ```
  - [ ] Add retry logic (3 attempts)
  - [ ] Write tests
  - **Files:** `/backend/src/billing/webhook-handler.service.ts`

#### Subscription Events (1 day)

- [ ] **Handle Subscription Events** (8 hours)
  - [ ] Handle `subscription.create`
  - [ ] Handle `subscription.disable`
  - [ ] Handle `subscription.not_renew`
  - [ ] Update database for each event
  - [ ] Send appropriate notification emails
  - [ ] Write tests for all events
  - **Files:** `/backend/src/billing/webhook-handler.service.ts`

#### Webhook Testing (1 day)

- [ ] **Test All Webhook Events** (8 hours)
  - [ ] Use Paystack test events
  - [ ] Trigger each webhook type
  - [ ] Verify handler called
  - [ ] Check database updates
  - [ ] Verify notification emails sent
  - [ ] Test invalid signatures (should reject)
  - [ ] Monitor logs for errors
  - **Tools:** Paystack dashboard, logs

---

### WEEK 11: Subscription Management

#### Subscription Service (2 days)

- [ ] **Build Subscription Manager** (16 hours)
  - [ ] Create `/backend/src/billing/subscription-manager.service.ts`
  - [ ] Implement `createSubscription(userId, planId, authCode)`
  - [ ] Implement `cancelSubscription(userId)`
  - [ ] Implement `upgradeSubscription(userId, newPlanId)`
  - [ ] Implement `downgradeSubscription(userId, newPlanId)`
  - [ ] Implement `checkSubscriptionStatus(userId): boolean`
  - [ ] Handle prorated charges for upgrades
  - [ ] Add comprehensive logging
  - [ ] Write tests for all methods
  - **Files:** `/backend/src/billing/subscription-manager.service.ts`

#### Subscription Guard (1 day)

- [ ] **Create Subscription Check Middleware** (8 hours)
  - [ ] Create `/backend/src/billing/subscription.guard.ts`
  - [ ] Implement `canActivate()` method:
    ```typescript
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const userId = request.user.id;

      const isActive = await this.subscriptionManager.checkSubscriptionStatus(userId);

      if (!isActive) {
        throw new ForbiddenException('Subscription required');
      }

      return true;
    }
    ```
  - [ ] Add to protected routes
  - [ ] Test with expired subscription
  - [ ] Test with active subscription
  - **Files:** `/backend/src/billing/subscription.guard.ts`

#### Frontend Payment UI (2 days)

- [ ] **Create Payment History Page** (16 hours)
  - [ ] Create `/frontend/src/app/(dashboard)/billing/payments/page.tsx`
  - [ ] List all payments (table format)
  - [ ] Show: Date, Amount, Status, Invoice
  - [ ] Add filters: Date range, Status
  - [ ] Add search by reference
  - [ ] Add pagination
  - [ ] Add "Download Invoice" button
  - [ ] Test with sample data
  - **Files:** Payment history components

#### End-to-End Testing (1 day)

- [ ] **Test Complete Subscription Lifecycle** (8 hours)
  - [ ] New user signup
  - [ ] Select plan
  - [ ] Initialize payment
  - [ ] Complete payment with test card
  - [ ] Verify subscription active
  - [ ] Access premium features
  - [ ] Upgrade to higher plan
  - [ ] Verify prorated charge
  - [ ] Cancel subscription
  - [ ] Verify access until period end
  - [ ] Document any issues found
  - **Test:** Full user journey

---

### WEEK 12: WhatsApp Queue & Rate Limiting

#### Queue Infrastructure (1 day)

- [ ] **Set Up WhatsApp Queue** (8 hours)
  - [ ] Add WhatsApp queue to BullMQ
  - [ ] Configure in `/backend/src/whatsapp/whatsapp.module.ts`
  - [ ] Set concurrency to 80 (Meta's limit)
  - [ ] Add queue monitoring
  - [ ] Test queue connection
  - **Files:** `/backend/src/whatsapp/whatsapp.module.ts`

#### WhatsApp Processor (2 days)

- [ ] **Create WhatsApp Message Processor** (16 hours)
  - [ ] Create `/backend/src/whatsapp/whatsapp.processor.ts`
  - [ ] Implement `@Process('send-message')`:
    ```typescript
    @Process({ name: 'send-message', concurrency: 80 })
    async handleMessageSending(job: Job) {
      // Rate limiting
      await this.rateLimit();

      // Send message
      const result = await this.whatsappService.sendTemplateMessage({
        to: job.data.phoneNumber,
        templateName: job.data.templateName,
        components: this.buildComponents(job.data.variables)
      });

      // Track in database
      await this.prisma.whatsappActivity.create({
        data: {
          campaignId: job.data.campaignId,
          contactId: job.data.recipientId,
          type: 'SENT',
          messageId: result.messages[0].id,
          status: 'SENT'
        }
      });
    }
    ```
  - [ ] Implement rate limiting (80 msg/sec)
  - [ ] Add retry logic for rate limit errors (429)
  - [ ] Write tests
  - **Files:** `/backend/src/whatsapp/whatsapp.processor.ts`

#### Update WhatsApp Service (1 day)

- [ ] **Update sendCampaign to Use Queue** (8 hours)
  - [ ] Open `/backend/src/whatsapp/whatsapp.service.ts`
  - [ ] Replace direct sending with queue:
    ```typescript
    async sendCampaign(campaignId: string) {
      const campaign = await this.getCampaign(campaignId);
      const recipients = await this.getRecipients(campaign);

      for (const recipient of recipients) {
        await this.whatsappQueue.add('send-message', {
          campaignId: campaign.id,
          recipientId: recipient.id,
          phoneNumber: recipient.phone,
          templateName: campaign.templateName,
          variables: {
            firstName: recipient.firstName,
            // ... other variables
          }
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          delay: Math.floor(Math.random() * 1000) // Spread over time
        });
      }

      return { queued: recipients.length };
    }
    ```
  - [ ] Update campaign status tracking
  - [ ] Write tests
  - **Files:** `/backend/src/whatsapp/whatsapp.service.ts`

#### Load Testing (1 day)

- [ ] **Test with 1000 WhatsApp Messages** (8 hours)
  - [ ] Create test campaign with 1000 recipients
  - [ ] Use test phone numbers
  - [ ] Start campaign
  - [ ] Monitor:
    - Queue depth
    - Processing rate (should be ~80/sec)
    - Success rate
    - Error rate
  - [ ] Verify no 429 rate limit errors
  - [ ] Check all messages sent successfully
  - **Tools:** Bull Board, WhatsApp Business dashboard

---

### WEEK 13: WhatsApp Media Support

#### Media Manager Service (2 days)

- [ ] **Build WhatsApp Media Manager** (16 hours)
  - [ ] Create `/backend/src/whatsapp/media-manager.service.ts`
  - [ ] Implement `uploadMedia(filePath, mimeType)`:
    ```typescript
    async uploadMedia(filePath: string, mimeType: string): Promise<string> {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('type', mimeType);
      formData.append('messaging_product', 'whatsapp');

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/media`,
        formData,
        { headers: { Authorization: `Bearer ${this.accessToken}` }}
      );

      return response.data.id; // Media ID
    }
    ```
  - [ ] Implement `sendMediaMessage(to, mediaId, caption)`:
    ```typescript
    async sendMediaMessage(params: SendMediaMessageDto) {
      const payload = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: params.mediaType, // 'image', 'video', 'document'
        [params.mediaType]: {
          id: params.mediaId,
          caption: params.caption
        }
      };

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${this.accessToken}` }}
      );

      return response.data;
    }
    ```
  - [ ] Support image, video, document types
  - [ ] Handle file size limits
  - [ ] Add error handling
  - [ ] Write tests
  - **Files:** `/backend/src/whatsapp/media-manager.service.ts`

#### Caption Support (1 day)

- [ ] **Add Caption to Media Messages** (8 hours)
  - [ ] Update media message payload to include caption
  - [ ] Test caption length limits (max 1024 chars)
  - [ ] Handle caption formatting (no markdown support)
  - [ ] Add caption to campaign templates
  - [ ] Test with various caption lengths
  - **Files:** `/backend/src/whatsapp/media-manager.service.ts`

#### Media Testing (1 day)

- [ ] **Test Media Sending** (8 hours)
  - [ ] Upload test images (PNG, JPG)
  - [ ] Upload test videos (MP4)
  - [ ] Upload test documents (PDF)
  - [ ] Send media messages with captions
  - [ ] Verify delivery on WhatsApp
  - [ ] Test file size limits:
    - Image: 5MB max
    - Video: 16MB max
    - Document: 100MB max
  - [ ] Handle oversized files gracefully
  - **Test:** Various media types

---

### WEEK 14: WhatsApp Templates & Scheduling

#### Template Sync (1 day)

- [ ] **Implement WhatsApp Template Sync** (8 hours)
  - [ ] Create `/backend/src/whatsapp/template-sync.service.ts`
  - [ ] Fetch templates from Meta API:
    ```typescript
    async syncTemplates(): Promise<void> {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}/message_templates`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          params: { limit: 1000 }
        }
      );

      const templates = response.data.data;

      for (const template of templates) {
        await this.prisma.whatsappTemplate.upsert({
          where: { name: template.name },
          create: {
            name: template.name,
            language: template.language,
            status: template.status,
            category: template.category,
            components: JSON.stringify(template.components)
          },
          update: {
            status: template.status,
            components: JSON.stringify(template.components)
          }
        });
      }
    }
    ```
  - [ ] Run sync daily via cron
  - [ ] Add manual sync endpoint
  - [ ] Write tests
  - **Files:** `/backend/src/whatsapp/template-sync.service.ts`

#### Scheduler Service (1 day)

- [ ] **Build WhatsApp Campaign Scheduler** (8 hours)
  - [ ] Create `/backend/src/whatsapp/whatsapp-scheduler.service.ts`
  - [ ] Add cron job to run every 5 minutes:
    ```typescript
    @Cron('*/5 * * * *')
    async processScheduledCampaigns() {
      const now = new Date();

      const scheduled = await this.prisma.whatsappCampaign.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledFor: { lte: now }
        }
      });

      for (const campaign of scheduled) {
        await this.whatsappService.sendCampaign(campaign.id);
      }
    }
    ```
  - [ ] Test with scheduled campaign
  - [ ] Verify campaign starts at scheduled time
  - **Files:** `/backend/src/whatsapp/whatsapp-scheduler.service.ts`

#### Template Variables (1 day)

- [ ] **Implement Template Variable Injection** (8 hours)
  - [ ] Build template components from variables:
    ```typescript
    private buildTemplateComponents(variables: Record<string, string>) {
      return [{
        type: 'body',
        parameters: Object.values(variables).map(value => ({
          type: 'text',
          text: value
        }))
      }];
    }
    ```
  - [ ] Handle header parameters (images, videos)
  - [ ] Handle button parameters (dynamic URLs)
  - [ ] Test with various template types
  - [ ] Validate variable count matches template
  - **Files:** `/backend/src/whatsapp/whatsapp.processor.ts`

#### Comprehensive Testing (2 days)

- [ ] **Test All WhatsApp Features** (16 hours)
  - [ ] Text-only campaigns
  - [ ] Media campaigns (images, videos)
  - [ ] Template variables
  - [ ] Scheduled campaigns
  - [ ] Rate limiting (send 1000+ messages)
  - [ ] Error handling (invalid numbers, etc.)
  - [ ] Queue monitoring
  - [ ] Analytics tracking
  - [ ] Fix any issues found
  - [ ] Document known limitations
  - **Output:** Test report

---

## 🟡 MEDIUM PRIORITY - WEEK 15-20 (FEATURE GAPS)

### WEEK 15-16: Frontend Database Access Migration - High-Traffic Routes

#### Authentication Routes (3 days)

- [ ] **Migrate /api/auth/* Routes** (24 hours)
  - [ ] List all auth routes using Prisma
  - [ ] For each route:
    - [ ] Create backend proxy version
    - [ ] Test authentication flow
    - [ ] Update frontend to use proxy
    - [ ] Remove Prisma usage
  - [ ] Routes to migrate:
    - `/api/auth/login`
    - `/api/auth/register`
    - `/api/auth/logout`
    - `/api/auth/session`
    - `/api/auth/verify-email`
  - [ ] Test complete auth flow
  - **Files:** `/frontend/src/app/api/auth/`

#### User Profile Routes (2 days)

- [ ] **Migrate /api/users/* Routes** (16 hours)
  - [ ] Migrate user profile routes:
    - `/api/users/profile` (GET, PUT)
    - `/api/users/settings` (GET, PUT)
    - `/api/users/avatar` (POST)
  - [ ] Create backend proxy for each
  - [ ] Test profile updates
  - [ ] Test avatar upload
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/users/`

#### Contact Routes (3 days)

- [ ] **Migrate /api/contacts/* Routes** (24 hours)
  - [ ] Migrate contact CRUD routes:
    - `/api/contacts` (GET, POST)
    - `/api/contacts/[id]` (GET, PUT, DELETE)
    - `/api/contacts/import` (POST)
    - `/api/contacts/export` (GET)
  - [ ] Create backend proxies
  - [ ] Test all CRUD operations
  - [ ] Test bulk import (1000+ contacts)
  - [ ] Test export formats (CSV, Excel)
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/contacts/`

---

### WEEK 17-18: Campaign Routes Migration

#### Email Campaign Routes (4 days)

- [ ] **Migrate /api/campaigns/email/* Routes** (32 hours)
  - [ ] Migrate routes:
    - `/api/campaigns/email` (GET, POST)
    - `/api/campaigns/email/[id]` (GET, PUT, DELETE)
    - `/api/campaigns/email/[id]/send` (POST)
    - `/api/campaigns/email/[id]/analytics` (GET)
    - `/api/campaigns/email/templates` (GET, POST)
  - [ ] Create backend proxies
  - [ ] Test campaign creation
  - [ ] Test campaign sending
  - [ ] Test analytics retrieval
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/campaigns/email/`

#### SMS Campaign Routes (3 days)

- [ ] **Migrate /api/campaigns/sms/* Routes** (24 hours)
  - [ ] Migrate routes:
    - `/api/campaigns/sms` (GET, POST)
    - `/api/campaigns/sms/[id]` (GET, PUT, DELETE)
    - `/api/campaigns/sms/[id]/send` (POST)
    - `/api/campaigns/sms/[id]/analytics` (GET)
  - [ ] Create backend proxies
  - [ ] Test SMS sending
  - [ ] Test cost tracking
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/campaigns/sms/`

#### WhatsApp Routes (3 days)

- [ ] **Migrate /api/whatsapp/* Routes** (24 hours)
  - [ ] Migrate routes:
    - `/api/whatsapp/campaigns` (GET, POST)
    - `/api/whatsapp/campaigns/[id]` (GET, PUT, DELETE)
    - `/api/whatsapp/campaigns/[id]/send` (POST)
    - `/api/whatsapp/templates` (GET)
    - `/api/whatsapp/templates/sync` (POST)
  - [ ] Create backend proxies
  - [ ] Test WhatsApp sending
  - [ ] Test template sync
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/whatsapp/`

---

### WEEK 19: Workflow & Analytics Routes

#### Workflow Routes (3 days)

- [ ] **Migrate /api/workflows/* Routes** (24 hours)
  - [ ] Migrate routes:
    - `/api/workflows` (GET, POST)
    - `/api/workflows/[id]` (GET, PUT, DELETE)
    - `/api/workflows/[id]/activate` (POST)
    - `/api/workflows/[id]/deactivate` (POST)
    - `/api/workflows/[id]/logs` (GET)
    - `/api/workflows/[id]/analytics` (GET)
  - [ ] Create backend proxies
  - [ ] Test workflow execution
  - [ ] Test logs retrieval
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/workflows/`

#### Analytics Routes (2 days)

- [ ] **Migrate /api/analytics/* Routes** (16 hours)
  - [ ] Migrate routes:
    - `/api/analytics/dashboard` (GET)
    - `/api/analytics/campaigns` (GET)
    - `/api/analytics/contacts` (GET)
    - `/api/analytics/revenue` (GET)
  - [ ] Create backend proxies
  - [ ] Test data fetching
  - [ ] Verify performance
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/analytics/`

---

### WEEK 20: LeadPulse, AI & Cleanup

#### LeadPulse Routes (3 days)

- [ ] **Migrate /api/leadpulse/* Routes** (24 hours)
  - [ ] Migrate routes:
    - `/api/leadpulse/track` (POST)
    - `/api/leadpulse/visitors` (GET)
    - `/api/leadpulse/sessions` (GET)
    - `/api/leadpulse/forms` (GET, POST)
    - `/api/leadpulse/analytics` (GET)
  - [ ] Create backend proxies
  - [ ] Test visitor tracking
  - [ ] Test form submissions
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/leadpulse/`

#### AI Routes (2 days)

- [ ] **Migrate /api/ai/* Routes** (16 hours)
  - [ ] Migrate routes:
    - `/api/ai/chat` (POST)
    - `/api/ai/analyze` (POST)
    - `/api/ai/predict` (POST)
    - `/api/ai/insights` (GET)
  - [ ] Create backend proxies
  - [ ] Test AI features
  - [ ] Remove Prisma usage
  - **Files:** `/frontend/src/app/api/ai/`

#### Final Cleanup (1 day)

- [ ] **Remove Prisma from Frontend** (8 hours)
  - [ ] Verify ALL routes migrated (check prisma-usage.txt)
  - [ ] Run: `npm uninstall @prisma/client prisma`
  - [ ] Delete `/frontend/prisma/` directory
  - [ ] Remove `DATABASE_URL` from `.env.local`
  - [ ] Remove prisma import from `/frontend/src/lib/db/prisma.ts`
  - [ ] Run build to verify no errors
  - [ ] Test full application
  - [ ] Update documentation
  - **Files:** `package.json`, `.env.local`, prisma directory

---

### WEEK 21: LeadPulse Session Replay

- [ ] **Implement Session Recording** (1 week / 40 hours)
  - [ ] Install rrweb: `npm install rrweb`
  - [ ] Create recording component
  - [ ] Capture user interactions:
    - Mouse movements
    - Clicks
    - Scrolls
    - Form inputs (sanitized)
    - Page navigation
  - [ ] Store sessions in database (compressed)
  - [ ] Create playback UI component
  - [ ] Add privacy controls:
    - Mask sensitive inputs (passwords, credit cards)
    - Option to disable recording
    - GDPR consent
  - [ ] Test playback accuracy
  - [ ] Optimize storage (compress recordings)
  - **Files:** `/backend/src/leadpulse/session-replay.service.ts`, frontend components

---

### WEEK 22: LeadPulse Heatmaps

- [ ] **Build Heatmap Overlay** (1 week / 40 hours)
  - [ ] Collect click data with coordinates
  - [ ] Collect scroll depth data
  - [ ] Collect time-on-page data
  - [ ] Aggregate data for heatmap generation
  - [ ] Create heatmap visualization:
    - Click heatmap (where users click)
    - Scroll heatmap (how far users scroll)
    - Attention heatmap (where users spend time)
  - [ ] Overlay heatmap on page screenshots
  - [ ] Add to LeadPulse dashboard
  - [ ] Test with various page layouts
  - [ ] Optimize for performance
  - **Files:** Heatmap service, visualization components

---

### WEEK 23: LeadPulse Attribution System

- [ ] **Complete Multi-Touch Attribution** (1 week / 40 hours)
  - [ ] Implement attribution models:
    - First-touch (first interaction gets credit)
    - Last-touch (last interaction gets credit)
    - Linear (equal credit to all)
    - Time-decay (recent gets more credit)
    - Position-based (first and last get most)
    - Data-driven (ML-based, optional)
  - [ ] Track customer journey touchpoints
  - [ ] Calculate attribution weights
  - [ ] Create attribution reporting UI
  - [ ] Test with sample journeys
  - [ ] Validate attribution calculations
  - **Files:** `/backend/src/leadpulse/attribution.service.ts`, reporting components

---

### WEEK 24-25: Conversion Tracking Module

#### Tracking Pixel (1 week)

- [ ] **Build Conversion Pixel System** (40 hours)
  - [ ] Generate unique tracking pixels per user
  - [ ] Create pixel endpoint: `GET /track/pixel/:userId`
  - [ ] Implement event tracking:
    - Page views
    - Button clicks
    - Form submissions
    - Custom events
  - [ ] Store conversion data in database
  - [ ] Add pixel to website instructions
  - [ ] Test cross-domain tracking
  - [ ] Test with various browsers
  - **Files:** Conversion tracking service

#### Goal Management (1 week)

- [ ] **Create Goal Management System** (40 hours)
  - [ ] Define conversion goal types:
    - Purchase
    - Sign-up
    - Download
    - Contact form
    - Custom event
  - [ ] Create goal configuration UI
  - [ ] Track goal completions
  - [ ] Calculate conversion rates
  - [ ] Build goal analytics dashboard
  - [ ] Test goal tracking accuracy
  - **Files:** Goals controller, analytics components

---

### WEEK 26: Conversion Funnel Analytics

- [ ] **Build Funnel Visualization** (1 week / 40 hours)
  - [ ] Create funnel builder UI:
    - Define funnel steps
    - Set step order
    - Configure time windows
  - [ ] Track users through funnel steps
  - [ ] Calculate drop-off rates
  - [ ] Identify drop-off points
  - [ ] Provide optimization suggestions
  - [ ] Visualize funnel with charts
  - [ ] Test with sample funnels
  - **Files:** Funnel analytics service, visualization components

---

### WEEK 27-28: API Documentation Portal

#### OpenAPI Specification (1 week)

- [ ] **Generate Swagger/OpenAPI Spec** (40 hours)
  - [ ] Install: `npm install @nestjs/swagger`
  - [ ] Annotate all controllers:
    - `@ApiTags()` for grouping
    - `@ApiOperation()` for descriptions
    - `@ApiResponse()` for response types
    - `@ApiParam()` for parameters
    - `@ApiBody()` for request bodies
  - [ ] Generate spec: `/api/docs/json`
  - [ ] Review spec for completeness
  - [ ] Add authentication to spec
  - [ ] Add examples to spec
  - **Files:** All controllers

#### Developer Portal (1 week)

- [ ] **Build API Documentation UI** (40 hours)
  - [ ] Create documentation portal page
  - [ ] Integrate Swagger UI
  - [ ] Add interactive API explorer
  - [ ] Provide code examples:
    - cURL
    - JavaScript
    - Python
    - PHP
  - [ ] Add authentication guide
  - [ ] Add rate limiting info
  - [ ] Add webhook documentation
  - [ ] Test API calls from portal
  - **Files:** Frontend docs portal

---

### WEEK 29: API Key Management

- [ ] **Create API Key System** (1 week / 40 hours)
  - [ ] Generate secure API keys
  - [ ] Store keys securely (hashed)
  - [ ] Create API key management UI:
    - Generate new key
    - Revoke key
    - View usage stats
  - [ ] Implement API key authentication
  - [ ] Rate limit per API key
  - [ ] Track API usage:
    - Requests per endpoint
    - Requests per day
    - Bandwidth used
  - [ ] Create usage analytics dashboard
  - [ ] Test API key auth
  - **Files:** API keys controller, auth guard

---

### MONTH 5: Social Media Inbox (4 weeks)

#### Comment Management (2 weeks)

- [ ] **Build Social Comment Inbox** (80 hours)
  - [ ] Fetch comments from platforms:
    - Facebook posts
    - Instagram posts
    - Twitter mentions
    - LinkedIn posts
  - [ ] Aggregate comments in unified inbox
  - [ ] Create inbox UI:
    - List comments
    - Filter by platform/sentiment
    - Sort by date/engagement
  - [ ] Implement reply functionality
  - [ ] Mark comments as resolved
  - [ ] Add sentiment indicators
  - [ ] Add assignment to team members
  - [ ] Test with real accounts
  - **Files:** Social inbox service, inbox components

#### DM Management (2 weeks)

- [ ] **Build Social DM Inbox** (80 hours)
  - [ ] Fetch DMs from platforms:
    - Facebook Messenger
    - Instagram Direct
    - Twitter DMs
  - [ ] Create DM conversation threads
  - [ ] Build chat-style UI
  - [ ] Implement send reply functionality
  - [ ] Add typing indicators
  - [ ] Mark conversations as resolved
  - [ ] Support media in DMs
  - [ ] Test with real conversations
  - **Files:** DM service, chat components

---

### MONTH 6: Social Media Analytics & Sentiment (4 weeks)

#### Real Analytics (2 weeks)

- [ ] **Implement Platform Analytics APIs** (80 hours)
  - [ ] Replace mock analytics with real API calls
  - [ ] Fetch Facebook Insights:
    - Post reach
    - Engagement rate
    - Follower growth
  - [ ] Fetch Instagram Insights:
    - Impressions
    - Reach
    - Profile visits
  - [ ] Fetch Twitter Analytics:
    - Tweet impressions
    - Engagement rate
    - Follower count
  - [ ] Fetch LinkedIn Analytics:
    - Post views
    - Engagement
    - Demographics
  - [ ] Build analytics dashboard
  - [ ] Cache analytics data (update daily)
  - [ ] Test with real accounts
  - **Files:** Social analytics service, dashboard components

#### Sentiment Analysis (2 weeks)

- [ ] **Add Sentiment Analysis** (80 hours)
  - [ ] Integrate sentiment analysis API or library
  - [ ] Analyze comment sentiment:
    - Positive
    - Neutral
    - Negative
  - [ ] Track brand sentiment over time
  - [ ] Create sentiment dashboard:
    - Overall sentiment score
    - Sentiment trends
    - Most positive/negative posts
  - [ ] Set up alerts for negative sentiment spikes
  - [ ] Test accuracy with sample data
  - **Files:** Sentiment analysis service, dashboard

---

### WEEK 30: Campaign Analytics Visualization

- [ ] **Add Chart Libraries** (1 week / 40 hours)
  - [ ] Choose library: recharts / Chart.js / Victory
  - [ ] Install: `npm install recharts`
  - [ ] Create chart components:
    - Line charts (trends over time)
    - Bar charts (comparisons)
    - Pie charts (breakdowns)
    - Area charts (stacked metrics)
  - [ ] Build analytics dashboard:
    - Campaign performance charts
    - Channel comparison
    - Engagement trends
    - Revenue charts
  - [ ] Make charts interactive:
    - Tooltips
    - Click to drill down
    - Date range filters
  - [ ] Test with real data
  - [ ] Optimize for performance
  - **Files:** Analytics chart components

---

### WEEK 31: Custom Report Builder

- [ ] **Build Report Builder** (1 week / 40 hours)
  - [ ] Create drag-and-drop report builder:
    - Choose metrics
    - Choose dimensions
    - Choose date range
    - Choose visualizations
  - [ ] Save custom reports
  - [ ] Schedule automated reports:
    - Daily
    - Weekly
    - Monthly
  - [ ] Email reports to stakeholders
  - [ ] Export reports:
    - PDF
    - Excel
    - CSV
  - [ ] Create report templates:
    - Executive summary
    - Campaign performance
    - Channel analysis
  - [ ] Test report generation
  - **Files:** Report builder components, scheduler service

---

## 🟢 LOW PRIORITY - MONTH 7+ (ENHANCEMENTS)

### AI Model Training (2-3 months)

- [ ] **Collect Training Data** (2 weeks)
  - [ ] Export historical campaign data
  - [ ] Export customer behavior data
  - [ ] Export churn data
  - [ ] Label data for supervised learning
  - [ ] Split into train/validation/test sets
  - [ ] Store in ML-friendly format

- [ ] **Train Churn Prediction Model** (4 weeks)
  - [ ] Choose ML framework (TensorFlow/PyTorch/scikit-learn)
  - [ ] Feature engineering:
    - Engagement metrics
    - Purchase frequency
    - Customer lifetime
    - Support tickets
  - [ ] Train model
  - [ ] Tune hyperparameters
  - [ ] Validate accuracy (> 70% precision)
  - [ ] Deploy model
  - [ ] A/B test against rule-based system

- [ ] **Train LTV Prediction Model** (4 weeks)
  - [ ] Feature engineering for LTV
  - [ ] Train regression model
  - [ ] Validate predictions
  - [ ] Deploy model
  - [ ] A/B test accuracy

### 2FA/MFA Authentication (1-2 weeks)

- [ ] **Implement TOTP (Authenticator App)** (1 week)
  - [ ] Install: `npm install speakeasy qrcode`
  - [ ] Generate TOTP secret on user setup
  - [ ] Create QR code for scanning
  - [ ] Verify TOTP code on login
  - [ ] Generate backup codes (10 codes)
  - [ ] Add 2FA settings page
  - [ ] Test with Google Authenticator, Authy

- [ ] **SMS-Based 2FA** (1 week)
  - [ ] Send verification code via SMS
  - [ ] Verify code on login
  - [ ] Add phone verification flow
  - [ ] Implement account recovery via SMS
  - [ ] Test with real phone numbers

### Integrations Marketplace (3-4 months)

- [ ] **Build Marketplace UI** (1 month)
  - [ ] Create marketplace page
  - [ ] List available integrations
  - [ ] Install/uninstall integrations
  - [ ] Integration configuration UI
  - [ ] Search and filter integrations
  - [ ] Integration categories

- [ ] **Add Popular Integrations** (2 months)
  - [ ] Salesforce CRM
  - [ ] HubSpot CRM
  - [ ] Zapier webhook
  - [ ] Google Analytics
  - [ ] Slack notifications
  - [ ] Shopify e-commerce
  - [ ] WooCommerce
  - [ ] Calendar integrations (Google, Outlook)

### Internationalization (2-3 months)

- [ ] **Implement i18n** (1 month)
  - [ ] Install: `npm install next-i18next i18next`
  - [ ] Extract all UI strings
  - [ ] Create translation files
  - [ ] Add language switcher
  - [ ] Test language switching

- [ ] **Add African Languages** (2 months)
  - [ ] French translation (West Africa)
  - [ ] Portuguese translation (Angola, Mozambique)
  - [ ] Swahili translation (East Africa)
  - [ ] Arabic translation (North Africa)
  - [ ] Hire native translators
  - [ ] Review translations for accuracy

### Mobile Apps (6+ months)

- [ ] **React Native Setup** (1 month)
  - [ ] Initialize React Native project
  - [ ] Set up navigation
  - [ ] Configure authentication
  - [ ] Style guide and components

- [ ] **iOS App** (3 months)
  - [ ] Build all features for iOS
  - [ ] iOS-specific design polish
  - [ ] Test on various iPhone models
  - [ ] Apple Developer account setup
  - [ ] App Store submission
  - [ ] Review and launch

- [ ] **Android App** (3 months)
  - [ ] Build all features for Android
  - [ ] Android-specific design
  - [ ] Test on various devices
  - [ ] Google Play Developer account
  - [ ] Play Store submission
  - [ ] Review and launch

---

## 📊 TRACKING YOUR PROGRESS

### Weekly Review Checklist

Every Friday, review progress:

- [ ] Count tasks completed this week
- [ ] Identify blockers
- [ ] Update sprint board
- [ ] Demo completed features
- [ ] Plan next week's sprint

### Monthly Milestones

**End of Month 1 (Week 4):**
- [ ] Security hardening complete
- [ ] Email provider infrastructure built
- [ ] Template rendering working
- [ ] ~25% of critical tasks done

**End of Month 2 (Week 8):**
- [ ] Email campaigns fully functional
- [ ] Payments integrated
- [ ] WhatsApp rate limiting done
- [ ] ~60% of critical tasks done

**End of Month 3 (Week 12):**
- [ ] All critical blockers resolved
- [ ] Frontend DB access migrated
- [ ] Staging environment stable
- [ ] ~85% ready for MVP launch

**End of Month 4 (Week 14):**
- [ ] MVP LAUNCH 🚀
- [ ] All critical features working
- [ ] First 100 paying customers
- [ ] Revenue flowing

---

## 🎯 LAUNCH READINESS CHECKLIST

Before launching to production, verify:

### Security ✅
- [ ] API-only mode enabled (`NEXT_PUBLIC_USE_API_ONLY=true`)
- [ ] helmet.js installed and configured
- [ ] Strong password requirements (12+ chars)
- [ ] Account lockout after 5 failed attempts
- [ ] No fallback JWT secrets
- [ ] All API endpoints have auth guards
- [ ] CSRF protection enabled
- [ ] Database backups automated
- [ ] Security monitoring active

### Core Features ✅
- [ ] Email campaigns sending successfully
- [ ] SMS campaigns working
- [ ] WhatsApp campaigns with rate limiting
- [ ] Payment processing (Paystack) working
- [ ] Subscription billing automated
- [ ] Webhooks handling payments
- [ ] Contacts management working
- [ ] Workflow automation executing

### Infrastructure ✅
- [ ] Staging environment deployed
- [ ] Production environment ready
- [ ] Database migrations tested
- [ ] Redis cache working
- [ ] Monitoring dashboards live
- [ ] Error tracking configured (Sentry)
- [ ] Logs aggregation working
- [ ] Alerts configured

### Testing ✅
- [ ] Unit tests passing (> 70% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing complete (10k users)
- [ ] Security scan clean (no critical vulns)
- [ ] Performance benchmarks met

### Documentation ✅
- [ ] Deployment guide written
- [ ] API documentation published
- [ ] User guides created
- [ ] Admin documentation ready
- [ ] Troubleshooting guide available

### Business ✅
- [ ] Pricing plans defined
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Support email configured
- [ ] Marketing materials ready
- [ ] Launch announcement prepared

---

## 💡 TIPS FOR SUCCESS

### Managing This Checklist

1. **Import to Project Management Tool**
   - Copy tasks to Jira/Linear/GitHub Projects
   - Assign to team members
   - Set due dates

2. **Daily Standups**
   - What did you complete yesterday?
   - What are you working on today?
   - Any blockers?

3. **Weekly Sprint Planning**
   - Review this checklist
   - Choose tasks for upcoming sprint
   - Estimate effort
   - Assign tasks

4. **Track Velocity**
   - Count story points/tasks completed per week
   - Adjust estimates based on actual velocity
   - Re-forecast launch date if needed

### Common Pitfalls to Avoid

❌ **Don't:**
- Skip security tasks (they're critical!)
- Work on low-priority features before critical ones
- Deploy without testing
- Ignore failing tests
- Skip code reviews

✅ **Do:**
- Follow the priority order
- Test thoroughly before marking complete
- Ask for help when blocked
- Document as you go
- Celebrate small wins

---

## 📞 GETTING HELP

### If You Get Blocked

1. **Check the master report** - Detailed implementation guides
2. **Review the audit reports** - Technical details
3. **Search documentation** - Most issues covered
4. **Ask team members** - Collaborate on solutions
5. **Consult Claude** - I can provide more specific guidance

### Updating This Checklist

As you progress:
- [ ] Check off completed tasks
- [ ] Add new tasks discovered during implementation
- [ ] Remove tasks that become irrelevant
- [ ] Adjust time estimates based on actual effort
- [ ] Keep priority levels updated

---

**Good luck with your MarketSage launch! 🚀**

**Remember:** Focus on the critical tasks first. A working MVP with limited features is better than a perfect product that never launches.

**Questions?** Reference the `PRODUCTION_READINESS_MASTER_REPORT.md` for detailed implementation guides.

---

*This checklist covers 200+ tasks across 31 weeks of development. Print it, share it with your team, and start checking off tasks!*
