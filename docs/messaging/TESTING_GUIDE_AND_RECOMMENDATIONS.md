# 📱 MarketSage SMS & WhatsApp Testing Guide

## Executive Summary

This guide provides comprehensive instructions for testing SMS and WhatsApp functionality in MarketSage, along with recommendations for production setup based on the African market requirements.

---

## 🚀 Quick Start Testing

### Prerequisites
1. Node.js and npm/yarn installed
2. Database (PostgreSQL) running
3. `.env` file configured with basic settings

### Running Tests

#### SMS Testing
```bash
# Basic SMS test using existing script
npx tsx scripts/test-provider-integrations.ts

# Comprehensive SMS test with all providers
npx tsx scripts/test-sms-comprehensive.ts

# Test with specific phone number
npx tsx scripts/test-sms-comprehensive.ts --phone +2347012345678
```

#### WhatsApp Testing
```bash
# Comprehensive WhatsApp test
npx tsx scripts/test-whatsapp-comprehensive.ts

# Test with specific phone number
npx tsx scripts/test-whatsapp-comprehensive.ts --phone +2348012345678
```

---

## 📱 SMS Configuration & Testing

### Current Status
Based on your `.env` file, you have **Twilio configured** as the SMS provider:
- ✅ Account SID: Configured
- ✅ Auth Token: Configured
- ✅ Phone Number: +19282555219 (US number)
- ✅ Provider: Set to 'twilio'

### SMS Provider Options

#### 1. **Twilio** (Currently Configured)
**Pros:**
- Global coverage including Africa
- Excellent API documentation
- High reliability
- Good deliverability

**Cons:**
- More expensive for African markets ($0.045-0.08/SMS)
- US phone number may have lower deliverability in Nigeria
- Requires local number for better performance

**Recommendations:**
- Purchase a Nigerian virtual number for better local deliverability
- Consider as backup provider due to higher costs

#### 2. **Africa's Talking** (Recommended for African Markets)
**Pros:**
- Best pricing for African markets ($0.02/SMS)
- Local presence and understanding
- Excellent African coverage
- Supports USSD and airtime
- Reseller program available

**Cons:**
- Limited coverage outside Africa
- Less documentation than Twilio

**Setup:**
```env
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_FROM=YourBrandName
SMS_PROVIDER=africastalking
```

#### 3. **Termii** (Best for Nigeria Focus)
**Pros:**
- Lowest cost for Nigerian market ($0.015/SMS)
- Nigerian company with local expertise
- DND compliance built-in
- Good API uptime

**Cons:**
- Nigeria-only focus
- Newer platform with less features

**Setup:**
```env
TERMII_API_KEY=your-api-key
TERMII_SENDER_ID=YourBrand
SMS_PROVIDER=termii
```

### SMS Testing Checklist

- [x] Basic message sending
- [x] Phone number validation (multiple formats)
- [x] Provider fallback mechanism
- [x] Organization-specific providers
- [x] Bulk sending capabilities
- [x] Error handling
- [x] Mock mode for development

### Production SMS Recommendations

1. **Multi-Provider Strategy**:
   ```
   Primary: Africa's Talking (African markets)
   Secondary: Twilio (International/backup)
   Tertiary: Termii (Nigeria-specific campaigns)
   ```

2. **Sender ID Configuration**:
   - Register alphanumeric sender IDs with operators
   - Use consistent branding across providers
   - Have fallback numeric sender IDs

3. **Cost Optimization**:
   - Route based on destination (Termii for Nigeria, Africa's Talking for other African countries)
   - Implement credit management system
   - Monitor delivery rates per provider

---

## 💬 WhatsApp Configuration & Testing

### Current Status
Based on your `.env` file:
- ❌ WHATSAPP_ACCESS_TOKEN: Not configured
- ❌ WHATSAPP_PHONE_NUMBER_ID: Not configured
- ✅ Code implementation: Complete with fallback to mock mode

### WhatsApp Business API Options

#### Option 1: Direct Meta Integration (Complex)
**Requirements:**
- Business verification with Meta
- WhatsApp Business Account
- Phone number verification
- API access approval (can take weeks)

**Process:**
1. Create Meta Business Account
2. Apply for WhatsApp Business API access
3. Verify business documents
4. Get phone number approved
5. Generate permanent access token

#### Option 2: Business Solution Provider (Recommended)
**Best BSPs for African Market:**

##### **AiSensy** (Highly Recommended)
- Zero setup fees
- White-label reseller program
- $15-50/month + $0.015/conversation
- Quick approval (24-48 hours)
- Good African presence

##### **Interakt**
- User-friendly interface
- $20-60/month + $0.018/conversation
- Good automation features
- Indian company with African clients

##### **Gupshup**
- Enterprise-focused
- $100+/month + $0.020/conversation
- Advanced features
- Requires minimum volume

### WhatsApp Testing Checklist

- [x] Text message sending
- [x] Phone number validation (African countries)
- [x] Template messages
- [x] Media messages (image, document, video, audio)
- [x] Interactive messages (buttons, lists)
- [x] Location messages
- [x] Organization-specific configuration
- [x] Error handling and mock mode

### Production WhatsApp Recommendations

1. **Start with BSP** (AiSensy):
   - Faster setup (2-3 days vs 2-3 weeks)
   - Lower initial investment
   - Technical support included
   - Compliance handled by BSP

2. **Implementation Path**:
   ```
   Week 1: Sign up for AiSensy reseller account
   Week 2: Configure API integration
   Week 3: Create message templates
   Week 4: Go live with campaigns
   ```

3. **Message Templates**:
   - Create templates for common use cases
   - Get pre-approval for promotional content
   - Use variables for personalization
   - Follow WhatsApp guidelines strictly

---

## 🧪 Testing Best Practices

### 1. Development Testing
```bash
# Use mock providers in development
SMS_PROVIDER=mock
NODE_ENV=development

# Test with local numbers
npx tsx scripts/test-sms-comprehensive.ts --phone +2348012345678
```

### 2. Staging Testing
```bash
# Use real providers with test credits
SMS_PROVIDER=twilio
NODE_ENV=staging

# Test with team members' real numbers
npx tsx scripts/test-provider-integrations.ts
```

### 3. Production Testing
- Use dedicated test numbers
- Monitor delivery rates
- Set up alerts for failures
- Regular health checks

---

## 💰 Cost Analysis & Budgeting

### SMS Costs (per 1000 messages)
| Provider | Nigeria | Kenya | Ghana | International |
|----------|---------|-------|-------|---------------|
| Termii | $15 | N/A | N/A | N/A |
| Africa's Talking | $20 | $25 | $25 | $45 |
| Twilio | $45 | $50 | $50 | $45-80 |

### WhatsApp Costs (per 1000 conversations)
| Provider | Setup | Monthly | Per Conversation |
|----------|-------|---------|------------------|
| Direct Meta | $0 | $0 | $0.005-0.10 |
| AiSensy | $0 | $15-50 | $0.015 |
| Interakt | $0 | $20-60 | $0.018 |

### Budget Recommendations
For a startup sending 50,000 messages/month:
- SMS: $1,000-2,500/month (depending on provider mix)
- WhatsApp: $750-1,500/month (much better engagement)
- Total: $1,750-4,000/month

---

## 🚦 Implementation Roadmap

### Phase 1: SMS Enhancement (Week 1-2)
1. Sign up for Africa's Talking account
2. Configure multi-provider routing
3. Implement cost optimization logic
4. Test with real African numbers
5. Set up monitoring dashboards

### Phase 2: WhatsApp Integration (Week 3-4)
1. Sign up for AiSensy reseller account
2. Complete business verification
3. Configure API integration
4. Create initial message templates
5. Test all message types

### Phase 3: Production Rollout (Week 5-6)
1. Migrate existing campaigns
2. Train team on new features
3. Set up customer onboarding
4. Monitor performance metrics
5. Optimize based on results

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
1. **Delivery Rates**
   - SMS: Target >95%
   - WhatsApp: Target >99%

2. **Response Times**
   - API latency <200ms
   - Message delivery <5 seconds

3. **Cost Efficiency**
   - Cost per delivered message
   - Provider performance comparison
   - ROI per channel

4. **Engagement Metrics**
   - Open rates (WhatsApp >80%)
   - Click rates
   - Conversion rates

### Monitoring Tools
```typescript
// Add to your monitoring dashboard
const metrics = {
  sms: {
    sent: 10000,
    delivered: 9750,
    failed: 250,
    deliveryRate: 97.5,
    avgCost: 0.025
  },
  whatsapp: {
    sent: 5000,
    delivered: 4950,
    read: 4200,
    replied: 850,
    readRate: 84.8,
    avgCost: 0.018
  }
};
```

---

## 🛡️ Compliance & Best Practices

### SMS Compliance
1. **DND Registry**
   - Check Nigerian DND list before sending
   - Respect opt-out requests immediately
   - Maintain suppression lists

2. **Message Content**
   - Include sender identification
   - Add opt-out instructions
   - Avoid spam trigger words

3. **Timing**
   - Send between 8 AM - 8 PM local time
   - Respect weekends and holidays
   - Implement rate limiting

### WhatsApp Compliance
1. **Template Approval**
   - Follow Meta's guidelines strictly
   - Avoid promotional content in utility templates
   - Get templates pre-approved

2. **User Consent**
   - Obtain explicit opt-in
   - Provide clear value proposition
   - Make opt-out easy

3. **Message Frequency**
   - Limit to 1-2 messages per day
   - Use message tags appropriately
   - Respect 24-hour window rules

---

## 🆘 Troubleshooting Guide

### Common SMS Issues
1. **Low Delivery Rates**
   - Check sender ID registration
   - Verify number formatting
   - Review message content for spam

2. **High Costs**
   - Implement provider routing
   - Use bulk sending APIs
   - Negotiate volume discounts

### Common WhatsApp Issues
1. **Template Rejection**
   - Remove promotional language
   - Add clear utility value
   - Use proper variable formatting

2. **API Errors**
   - Verify access token validity
   - Check phone number verification
   - Ensure proper number formatting

---

## 📚 Resources & Support

### Documentation
- [Twilio Docs](https://www.twilio.com/docs/sms)
- [Africa's Talking Docs](https://developers.africastalking.com)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [AiSensy Integration](https://docs.aisensy.com)

### Support Contacts
- Africa's Talking: support@africastalking.com
- Termii: support@termii.com
- AiSensy: partners@aisensy.com

### Community
- Join SMS/WhatsApp developer forums
- Attend African tech meetups
- Follow provider blogs for updates

---

## ✅ Final Recommendations

### Immediate Actions (This Week)
1. **Test current Twilio setup** with Nigerian numbers
2. **Sign up for Africa's Talking** trial account
3. **Apply for AiSensy** reseller program
4. **Run comprehensive tests** with both scripts

### Short Term (Next Month)
1. **Implement multi-provider** SMS routing
2. **Complete WhatsApp** business verification
3. **Create message templates** for common use cases
4. **Set up monitoring** dashboards

### Long Term (3-6 Months)
1. **Optimize costs** with smart routing
2. **Build customer** self-service portal
3. **Add more channels** (USSD, Voice)
4. **Expand to more** African countries

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintained by**: MarketSage Engineering Team