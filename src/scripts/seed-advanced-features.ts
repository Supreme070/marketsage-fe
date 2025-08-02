#!/usr/bin/env tsx

/**
 * Advanced Features Comprehensive Seeding Script
 * 
 * This script populates ALL the missing advanced tables to ensure no empty tables exist.
 * Categories:
 * 1. Integration & Provider Setup
 * 2. A/B Testing System
 * 3. Advanced AI & Analytics
 * 4. Enterprise Features
 * 5. Journey & Funnel Analytics
 * 6. Compliance & Security
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

// Database connection
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomEmail(): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.ng', 'business.co.za'];
  const name = Math.random().toString(36).substring(2, 8);
  return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * 1. INTEGRATION & PROVIDER SETUP
 */
async function seedProviders() {
  console.log('📧 Seeding Email Providers...');
  
  const organization = await prisma.organization.findFirst();
  if (!organization) throw new Error('No organization found');

  // Email Providers (upsert to handle existing)
  await prisma.emailProvider.upsert({
    where: { organizationId: organization.id },
    update: {
      providerType: 'postmark',
      name: 'Postmark Production',
      apiKey: 'postmark_api_key_encrypted',
      domain: 'marketsage.africa',
      fromEmail: 'noreply@marketsage.africa',
      fromName: 'MarketSage',
      replyToEmail: 'support@marketsage.africa',
      isActive: true,
      verificationStatus: 'verified',
      enableTracking: true,
      updatedAt: new Date()
    },
    create: {
      id: randomUUID(),
      organizationId: organization.id,
      providerType: 'postmark',
      name: 'Postmark Production',
      apiKey: 'postmark_api_key_encrypted',
      domain: 'marketsage.africa',
      fromEmail: 'noreply@marketsage.africa',
      fromName: 'MarketSage',
      replyToEmail: 'support@marketsage.africa',
      isActive: true,
      verificationStatus: 'verified',
      enableTracking: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Note: EmailProvider has @unique on organizationId, so only one per org
  // await prisma.emailProvider.create({ ... }) // Commented out second provider

  // SMS Providers
  console.log('📱 Seeding SMS Providers...');
  
  await prisma.sMSProvider.upsert({
    where: { organizationId: organization.id },
    update: {
      provider: 'africastalking',
      credentials: JSON.stringify({
        apiKey: 'at_api_key_encrypted',
        username: 'marketsage'
      }),
      senderId: 'MarketSage',
      isActive: true,
      verificationStatus: 'verified',
      updatedAt: new Date()
    },
    create: {
      id: randomUUID(),
      organizationId: organization.id,
      provider: 'africastalking',
      credentials: JSON.stringify({
        apiKey: 'at_api_key_encrypted',
        username: 'marketsage'
      }),
      senderId: 'MarketSage',
      isActive: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Note: SMSProvider has @unique on organizationId, so only one per org

  // WhatsApp Business Config
  console.log('💬 Seeding WhatsApp Business Config...');
  
  await prisma.whatsAppBusinessConfig.upsert({
    where: { organizationId: organization.id },
    update: {
      businessAccountId: 'whatsapp_business_account_id',
      phoneNumberId: 'whatsapp_phone_number_id',
      accessToken: 'whatsapp_access_token_encrypted',
      webhookUrl: 'https://api.marketsage.africa/webhooks/whatsapp',
      verifyToken: 'whatsapp_verify_token',
      phoneNumber: '+234901234567',
      displayName: 'MarketSage',
      isActive: true,
      verificationStatus: 'verified',
      updatedAt: new Date()
    },
    create: {
      id: randomUUID(),
      organizationId: organization.id,
      businessAccountId: 'whatsapp_business_account_id',
      phoneNumberId: 'whatsapp_phone_number_id',
      accessToken: 'whatsapp_access_token_encrypted',
      webhookUrl: 'https://api.marketsage.africa/webhooks/whatsapp',
      verifyToken: 'whatsapp_verify_token',
      phoneNumber: '+234901234567',
      displayName: 'MarketSage',
      isActive: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Email Domain Config
  console.log('🌐 Seeding Email Domain Config...');
  
  await prisma.emailDomainConfig.upsert({
    where: { organizationId: organization.id },
    update: {
      domain: 'marketsage.africa',
      spfVerified: true,
      dkimVerified: true,
      dmarcVerified: true,
      mxVerified: true,
      verificationStatus: 'verified',
      lastChecked: new Date(),
      updatedAt: new Date()
    },
    create: {
      id: randomUUID(),
      organizationId: organization.id,
      domain: 'marketsage.africa',
      spfVerified: true,
      dkimVerified: true,
      dmarcVerified: true,
      mxVerified: true,
      verificationStatus: 'verified',
      lastChecked: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log('✅ Provider seeding completed');
}

/**
 * 2. A/B TESTING SYSTEM
 */
async function seedABTesting() {
  console.log('🧪 Seeding A/B Testing System...');
  
  const campaigns = await prisma.emailCampaign.findMany({ take: 3 });
  const organization = await prisma.organization.findFirst();
  
  for (const campaign of campaigns) {
    // Create A/B Test
    const users = await prisma.user.findMany({ take: 1 });
    const abTest = await prisma.aBTest.create({
      data: {
        id: randomUUID(),
        name: `Subject Line Test - ${campaign.name}`,
        description: 'Testing different subject lines for optimal open rates',
        entityType: 'EMAIL_CAMPAIGN',
        entityId: campaign.id,
        status: Math.random() > 0.5 ? 'COMPLETED' : 'RUNNING',
        testType: 'MULTIVARIATE',
        testElements: JSON.stringify(['subject']),
        winnerMetric: 'OPEN_RATE',
        winnerThreshold: 0.95,
        distributionPercent: 0.5,
        winnerVariantId: null,
        startedAt: randomDate(new Date('2024-01-01'), new Date()),
        endedAt: Math.random() > 0.3 ? randomDate(new Date('2024-01-01'), new Date()) : null,
        createdById: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create variants
    const variants = [
      { name: 'Control', subject: campaign.subject },
      { name: 'Variant A', subject: `🚀 ${campaign.subject}` },
      { name: 'Variant B', subject: `${campaign.subject} - Limited Time!` }
    ];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const isWinner = i === 0; // Control wins for simplicity
      
      const abVariant = await prisma.aBTestVariant.create({
        data: {
          id: randomUUID(),
          testId: abTest.id,
          name: variant.name,
          description: i === 0 ? 'Control variant' : `Test variant ${String.fromCharCode(65 + i - 1)}`,
          content: JSON.stringify({ subject: variant.subject }),
          trafficPercent: 1.0 / variants.length,
          createdAt: new Date()
        }
      });

      // Create results for different metrics
      const metrics = ['OPEN_RATE', 'CLICK_RATE', 'CONVERSION_RATE'];
      for (const metric of metrics) {
        await prisma.aBTestResult.create({
          data: {
            id: randomUUID(),
            testId: abTest.id,
            variantId: abVariant.id,
            metric: metric as any,
            value: randomBetween(5, 35),
            sampleSize: randomBetween(800, 1200),
            recordedAt: new Date()
          }
        });
      }
    }
  }

  console.log('✅ A/B Testing seeding completed');
}

/**
 * 3. ADVANCED AI & ANALYTICS
 */
async function seedAdvancedAI() {
  console.log('🤖 Seeding Advanced AI Features...');
  
  const contacts = await prisma.contact.findMany({ take: 20 });
  const organization = await prisma.organization.findFirst();

  // Customer Profiles
  for (const contact of contacts) {
    await prisma.customerProfile.create({
      data: {
        id: randomUUID(),
        contactId: contact.id,
        organizationId: organization!.id,
        totalTransactions: randomBetween(0, 50),
        totalValue: randomBetween(0, 5000),
        firstTransactionDate: Math.random() > 0.3 ? randomDate(new Date('2023-01-01'), new Date()) : null,
        lastTransactionDate: Math.random() > 0.3 ? randomDate(new Date('2024-01-01'), new Date()) : null,
        averageOrderValue: randomBetween(50, 500),
        purchaseFrequency: randomBetween(1, 12),
        lifetimeValue: randomBetween(100, 10000),
        churnRisk: Math.random() * 100,
        engagementScore: randomBetween(0, 100),
        lastActivityDate: randomDate(new Date('2024-01-01'), new Date()),
        preferredChannel: ['EMAIL', 'SMS', 'WHATSAPP'][randomBetween(0, 2)],
        timezone: 'Africa/Lagos',
        language: 'en',
        tags: JSON.stringify(['high_value', 'engaged', 'mobile_user']),
        customFields: JSON.stringify({
          industry: 'Technology',
          companySize: 'Medium',
          budget: 'High'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Churn Predictions
    await prisma.churnPrediction.create({
      data: {
        id: randomUUID(),
        contactId: contact.id,
        organizationId: organization!.id,
        churnScore: Math.random() * 100,
        churnRisk: ['LOW', 'MEDIUM', 'HIGH'][randomBetween(0, 2)],
        factorsContributing: JSON.stringify([
          'Low email engagement',
          'Decreased purchase frequency',
          'Long time since last purchase'
        ]),
        recommendedActions: JSON.stringify([
          'Send re-engagement campaign',
          'Offer personalized discount',
          'Schedule customer call'
        ]),
        confidence: randomBetween(75, 95),
        predictionDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        modelVersion: '2.1.0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Behavioral Segments
    if (Math.random() > 0.7) {
      await prisma.behavioralSegment.create({
        data: {
          id: randomUUID(),
          contactId: contact.id,
          organizationId: organization!.id,
          segmentName: ['High Value', 'Frequent Buyer', 'At Risk', 'New Customer'][randomBetween(0, 3)],
          segmentType: 'BEHAVIORAL',
          criteria: JSON.stringify({
            purchaseFrequency: '>= 5',
            lifetimeValue: '>= 1000',
            lastActivity: '<= 30 days'
          }),
          confidence: randomBetween(80, 95),
          assignedAt: new Date(),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }

  console.log('✅ Advanced AI seeding completed');
}

/**
 * 4. ENTERPRISE FEATURES
 */
async function seedEnterpriseFeatures() {
  console.log('🏢 Seeding Enterprise Features...');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 5 });

  // Subscription Plans
  const subscriptionPlan = await prisma.subscriptionPlan.create({
    data: {
      id: randomUUID(),
      name: 'Enterprise Pro',
      description: 'Full-featured enterprise marketing automation',
      price: 499.99,
      currency: 'USD',
      interval: 'MONTHLY',
      features: JSON.stringify([
        'Unlimited contacts',
        'Advanced AI insights',
        'A/B testing',
        'Custom integrations',
        'Priority support'
      ]),
      limits: JSON.stringify({
        contacts: -1, // unlimited
        campaigns: -1,
        emailsPerMonth: 1000000,
        smsPerMonth: 100000
      }),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Subscription
  await prisma.subscription.create({
    data: {
      id: randomUUID(),
      organizationId: organization!.id,
      planId: subscriptionPlan.id,
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      autoRenew: true,
      paymentMethodId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Payment Methods
  await prisma.paymentMethod.create({
    data: {
      id: randomUUID(),
      organizationId: organization!.id,
      type: 'CREDIT_CARD',
      last4: '4567',
      expMonth: 12,
      expYear: 2025,
      brand: 'Visa',
      isDefault: true,
      paystackCustomerId: 'cus_' + randomUUID().substring(0, 8),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Admin Audit Logs
  for (let i = 0; i < 10; i++) {
    await prisma.adminAuditLog.create({
      data: {
        id: randomUUID(),
        userId: users[randomBetween(0, users.length - 1)].id,
        organizationId: organization!.id,
        action: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'][randomBetween(0, 4)],
        resource: ['USER', 'CAMPAIGN', 'CONTACT', 'ORGANIZATION'][randomBetween(0, 3)],
        resourceId: randomUUID(),
        details: JSON.stringify({
          changes: ['Updated email settings', 'Created new campaign', 'Deleted contact'],
          ip: '192.168.1.' + randomBetween(1, 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }),
        severity: ['LOW', 'MEDIUM', 'HIGH'][randomBetween(0, 2)],
        timestamp: randomDate(new Date('2024-01-01'), new Date()),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  console.log('✅ Enterprise features seeding completed');
}

/**
 * 5. CONVERSION FUNNELS & ANALYTICS
 */
async function seedAnalytics() {
  console.log('📊 Seeding Conversion Funnels & Analytics...');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 3 });

  // Conversion Funnels
  for (let i = 0; i < 3; i++) {
    const funnel = await prisma.conversionFunnel.create({
      data: {
        id: randomUUID(),
        name: ['Email Signup Funnel', 'Purchase Funnel', 'Trial Conversion Funnel'][i],
        description: `Tracking conversion through ${['email signup', 'purchase', 'trial'][i]} process`,
        steps: JSON.stringify([
          { name: 'Landing Page Visit', conversion: 100 },
          { name: 'Form View', conversion: 60 },
          { name: 'Form Submit', conversion: 25 },
          { name: 'Email Verification', conversion: 18 },
          { name: 'Purchase Complete', conversion: 12 }
        ]),
        goalValue: randomBetween(50, 500),
        isActive: true,
        metadata: JSON.stringify({
          source: 'website',
          campaign: 'summer_promotion',
          segment: 'new_visitors'
        }),
        organizationId: organization!.id,
        createdById: users[randomBetween(0, users.length - 1)].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Conversion Events for this funnel
    for (let j = 0; j < 50; j++) {
      await prisma.conversionEvent.create({
        data: {
          id: randomUUID(),
          funnelId: funnel.id,
          organizationId: organization!.id,
          eventType: ['page_view', 'form_submit', 'purchase', 'signup'][randomBetween(0, 3)],
          eventValue: Math.random() > 0.8 ? randomBetween(10, 200) : 0,
          userId: Math.random() > 0.5 ? users[randomBetween(0, users.length - 1)].id : null,
          sessionId: 'session_' + randomUUID().substring(0, 8),
          properties: JSON.stringify({
            page: '/landing',
            source: 'google',
            medium: 'cpc',
            campaign: 'summer_sale'
          }),
          timestamp: randomDate(new Date('2024-01-01'), new Date()),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }

  console.log('✅ Analytics seeding completed');
}

/**
 * Main execution function
 */
async function seedAdvancedFeatures() {
  console.log('🚀 Starting Advanced Features Comprehensive Seeding...');
  console.log(`📊 Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    await seedProviders();
    await seedABTesting();
    await seedAdvancedAI();
    await seedEnterpriseFeatures();
    await seedAnalytics();

    console.log('\n✅ Advanced Features Seeding Summary:');
    console.log('📧 Email/SMS/WhatsApp Providers: ✅ Configured');
    console.log('🧪 A/B Testing System: ✅ Active tests with variants');
    console.log('🤖 Advanced AI: ✅ Customer profiles and predictions');
    console.log('🏢 Enterprise Features: ✅ Subscriptions and audit logs');
    console.log('📊 Conversion Analytics: ✅ Funnels and events');
    console.log('\n🎉 All advanced features seeded successfully!');

  } catch (error) {
    console.error('❌ Error during advanced seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedAdvancedFeatures()
    .then(() => {
      console.log('\n🎯 Advanced seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Advanced seeding failed:', error.message);
      process.exit(1);
    });
}

export default seedAdvancedFeatures;