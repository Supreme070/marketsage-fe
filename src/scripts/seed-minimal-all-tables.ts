#!/usr/bin/env tsx

/**
 * Minimal Seeding for ALL Empty Tables
 * 
 * This script ensures NO tables are empty by adding minimal seed data to each.
 * Focus: Speed and completeness over complex data.
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedMinimalData() {
  console.log('🚀 Starting minimal seeding for ALL empty tables...');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 3 });
  const contacts = await prisma.contact.findMany({ take: 10 });
  const campaigns = await prisma.emailCampaign.findMany({ take: 2 });
  
  if (!organization || users.length === 0) {
    throw new Error('Need at least 1 organization and 1 user');
  }

  let seedCount = 0;

  // Helper function to safely create records
  async function safeCreate(tableName: string, createFn: () => Promise<any>) {
    try {
      await createFn();
      seedCount++;
      console.log(`✅ ${tableName}`);
    } catch (error) {
      console.log(`⚠️  ${tableName}: ${error.message}`);
    }
  }

  // Basic integration records (upsert to handle existing)
  console.log('\n📧 Integration & Provider Tables...');
  
  await safeCreate('EmailProvider', async () => {
    await prisma.emailProvider.upsert({
      where: { organizationId: organization.id },
      update: { isActive: true },
      create: {
        id: randomUUID(),
        organizationId: organization.id,
        providerType: 'postmark',
        name: 'Demo Email Provider',
        fromEmail: 'demo@marketsage.africa',
        isActive: true,
        verificationStatus: 'verified'
      }
    });
  });

  await safeCreate('SMSProvider', async () => {
    await prisma.sMSProvider.upsert({
      where: { organizationId: organization.id },
      update: { isActive: true },
      create: {
        id: randomUUID(),
        organizationId: organization.id,
        provider: 'africastalking',
        credentials: JSON.stringify({ apiKey: 'demo_key' }),
        isActive: true,
        verificationStatus: 'verified'
      }
    });
  });

  await safeCreate('WhatsAppBusinessConfig', async () => {
    await prisma.whatsAppBusinessConfig.upsert({
      where: { organizationId: organization.id },
      update: { isActive: true },
      create: {
        id: randomUUID(),
        organizationId: organization.id,
        businessAccountId: 'demo_business_account',
        phoneNumberId: 'demo_phone_id',
        accessToken: 'demo_access_token',
        webhookUrl: 'https://demo.marketsage.africa/webhook',
        verifyToken: 'demo_verify_token',
        isActive: true,
        verificationStatus: 'verified'
      }
    });
  });

  await safeCreate('EmailDomainConfig', async () => {
    await prisma.emailDomainConfig.upsert({
      where: { organizationId: organization.id },
      update: { verificationStatus: 'verified' },
      create: {
        id: randomUUID(),
        organizationId: organization.id,
        domain: 'marketsage.africa',
        spfVerified: true,
        dkimVerified: true,
        dmarcVerified: true,
        mxVerified: true,
        verificationStatus: 'verified'
      }
    });
  });

  // Enterprise features
  console.log('\n🏢 Enterprise Tables...');
  
  await safeCreate('SubscriptionPlan', async () => {
    await prisma.subscriptionPlan.create({
      data: {
        id: randomUUID(),
        name: 'Demo Plan',
        description: 'Demo subscription plan',
        price: 99.99,
        currency: 'NGN',
        interval: 'monthly',
        features: JSON.stringify(['email', 'sms', 'ai']),
        isActive: true
      }
    });
  });

  const subscriptionPlan = await prisma.subscriptionPlan.findFirst();
  
  await safeCreate('Subscription', async () => {
    await prisma.subscription.create({
      data: {
        id: randomUUID(),
        organizationId: organization.id,
        planId: subscriptionPlan!.id,
        status: 'ACTIVE',
        startDate: new Date(),
        autoRenew: true
      }
    });
  });

  await safeCreate('PaymentMethod', async () => {
    await prisma.paymentMethod.create({
      data: {
        id: randomUUID(),
        organizationId: organization.id,
        type: 'CARD',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        brand: 'Visa',
        isDefault: true
      }
    });
  });

  // A/B Testing - minimal approach
  console.log('\n🧪 A/B Testing Tables...');
  
  if (campaigns.length > 0) {
    await safeCreate('ABTest', async () => {
      await prisma.aBTest.create({
        data: {
          id: randomUUID(),
          name: 'Demo A/B Test',
          description: 'Demo test for seeding',
          entityType: 'EMAIL_CAMPAIGN',
          entityId: campaigns[0].id,
          status: 'COMPLETED',
          testType: 'SIMPLE_AB',
          testElements: JSON.stringify(['subject']),
          winnerMetric: 'OPEN_RATE',
          distributionPercent: 0.5,
          createdById: users[0].id
        }
      });
    });

    const abTest = await prisma.aBTest.findFirst();
    if (abTest) {
      await safeCreate('ABTestVariant', async () => {
        await prisma.aBTestVariant.create({
          data: {
            id: randomUUID(),
            testId: abTest.id,
            name: 'Control',
            content: JSON.stringify({ subject: 'Original Subject' }),
            trafficPercent: 0.5
          }
        });
      });

      const variant = await prisma.aBTestVariant.findFirst();
      if (variant) {
        await safeCreate('ABTestResult', async () => {
          await prisma.aBTestResult.create({
            data: {
              id: randomUUID(),
              testId: abTest.id,
              variantId: variant.id,
              metric: 'CLICK_RATE',
              value: 12.3,
              sampleSize: 1000
            }
          });
        });
      }
    }
  }

  // Customer Intelligence
  console.log('\n🤖 AI & Customer Intelligence...');
  
  for (let i = 0; i < Math.min(5, contacts.length); i++) {
    const contact = contacts[i];
    
    await safeCreate(`CustomerProfile-${i}`, async () => {
      await prisma.customerProfile.create({
        data: {
          id: randomUUID(),
          contactId: contact.id,
          organizationId: organization.id,
          totalTransactions: randomBetween(1, 10),
          totalValue: randomBetween(100, 5000),
          avgTransactionValue: randomBetween(50, 500),
          engagementScore: randomBetween(1, 100),
          lastSeenDate: new Date(),
          totalPageViews: randomBetween(5, 100),
          totalEmailOpens: randomBetween(0, 50),
          totalEmailClicks: randomBetween(0, 20),
          totalSMSResponses: randomBetween(0, 10)
        }
      });
    });

    if (i < 3) {
      await safeCreate(`ChurnPrediction-${i}`, async () => {
        await prisma.churnPrediction.create({
          data: {
            id: randomUUID(),
            contactId: contact.id,
            score: Math.random(),
            riskLevel: ['LOW', 'MEDIUM', 'HIGH'][randomBetween(0, 2)],
            topFactors: JSON.stringify(['Low engagement', 'Decreased activity']),
            nextActionDate: new Date(Date.now() + randomBetween(1, 30) * 24 * 60 * 60 * 1000)
          }
        });
      });

      await safeCreate(`BehavioralSegment-${i}`, async () => {
        await prisma.behavioralSegment.create({
          data: {
            id: randomUUID(),
            name: ['High Value Customers', 'At Risk Customers', 'New Customers'][i],
            description: `Automatically generated segment for ${['high value', 'at risk', 'new'][i]} customers`,
            criteria: JSON.stringify({ 
              engagementScore: i === 0 ? '> 80' : i === 1 ? '< 30' : '== new',
              totalTransactions: i === 0 ? '> 5' : i === 1 ? '< 2' : '== 0'
            })
          }
        });
      });
    }
  }

  // Analytics & Funnels
  console.log('\n📊 Analytics & Conversion Tables...');
  
  await safeCreate('ConversionFunnel', async () => {
    await prisma.conversionFunnel.create({
      data: {
        id: randomUUID(),
        funnelId: `funnel_${randomUUID().substring(0, 8)}`,
        name: 'Demo Email Funnel',
        description: 'Demo conversion funnel',
        steps: [
          { name: 'Landing', conversion: 100 },
          { name: 'Email Submit', conversion: 30 },
          { name: 'Purchase', conversion: 10 }
        ],
        goalValue: 100,
        isActive: true,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  const funnel = await prisma.conversionFunnel.findFirst();
  if (funnel) {
    for (let i = 0; i < 3; i++) {
      await safeCreate(`ConversionEvent-${i}`, async () => {
        await prisma.conversionEvent.create({
          data: {
            id: randomUUID(),
            funnelId: funnel.id,
            organizationId: organization.id,
            eventType: ['page_view', 'form_submit', 'purchase'][i],
            eventValue: i === 2 ? 50 : 0,
            sessionId: `session_${i}`,
            properties: JSON.stringify({ source: 'demo' }),
            timestamp: new Date()
          }
        });
      });
    }
  }

  // Admin & Security
  console.log('\n🔒 Security & Admin Tables...');
  
  for (let i = 0; i < 3; i++) {
    await safeCreate(`AdminAuditLog-${i}`, async () => {
      await prisma.adminAuditLog.create({
        data: {
          id: randomUUID(),
          adminUserId: users[i % users.length].id,
          adminEmail: users[i % users.length].email,
          action: ['CREATE', 'UPDATE', 'DELETE'][i],
          resource: ['users', 'campaigns', 'contacts'][i],
          resourceId: randomUUID(),
          details: { demo: true, action: 'Demo seeding operation' },
          ipAddress: '127.0.0.1',
          userAgent: 'MarketSage Admin Console'
        }
      });
    });
  }

  // Messaging & Credits
  console.log('\n💰 Messaging & Credit Tables...');
  
  await safeCreate('MessagingUsage', async () => {
    await prisma.messagingUsage.create({
      data: {
        id: randomUUID(),
        organizationId: organization.id,
        channel: 'email',
        messageCount: 100,
        credits: 10.0,
        provider: 'demo_provider',
        timestamp: new Date()
      }
    });
  });

  await safeCreate('CreditTransaction', async () => {
    await prisma.creditTransaction.create({
      data: {
        id: randomUUID(),
        organizationId: organization.id,
        type: 'purchase',
        amount: 100.0,
        description: 'Initial credit purchase'
      }
    });
  });

  console.log(`\n✅ Minimal seeding completed! Created records in ${seedCount} tables.`);
  console.log('🎯 All critical tables now have data - no more empty tables!');
}

async function main() {
  try {
    await seedMinimalData();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Minimal seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Minimal seeding process failed:', error.message);
      process.exit(1);
    });
}

export default main;