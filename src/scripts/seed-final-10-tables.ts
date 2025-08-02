#!/usr/bin/env tsx

/**
 * Final 10 Tables Seeding - Achieve 100% Coverage
 * 
 * Target Tables:
 * 1. SMSHistory
 * 2. WhatsAppHistory  
 * 3. Integration
 * 4. ConversionEvent
 * 5. ContentAnalysis
 * 6. SubjectLineTest
 * 7. Subscription
 * 8. UserActivity
 * 9. LeadPulseForm
 * 10. LeadPulseFormSubmission
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

async function seedFinal10Tables() {
  console.log('🎯 FINAL PUSH: Seeding the last 10 empty tables for 100% coverage!\n');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 5 });
  const contacts = await prisma.contact.findMany({ take: 10 });
  const emailCampaigns = await prisma.emailCampaign.findMany({ take: 3 });
  
  if (!organization || users.length === 0) {
    throw new Error('Need at least 1 organization and 1 user');
  }

  let successCount = 0;

  async function seedTable(tableName: string, createFn: () => Promise<any>) {
    try {
      await createFn();
      successCount++;
      console.log(`✅ ${tableName} - SEEDED!`);
    } catch (error) {
      console.log(`❌ ${tableName} - FAILED: ${error.message}`);
    }
  }

  console.log('1️⃣ SMSHistory - Communication tracking...');
  await seedTable('SMSHistory', async () => {
    await prisma.sMSHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        from: 'MarketSage',
        message: 'Your verification code is 123456. Valid for 10 minutes.',
        originalMessage: 'Your verification code is {{code}}. Valid for {{duration}}.',
        status: 'delivered',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        cost: 0.02,
        metadata: JSON.stringify({ campaignId: 'verification_001' })
      }
    });
  });

  console.log('2️⃣ WhatsAppHistory - WhatsApp message tracking...');
  await seedTable('WhatsAppHistory', async () => {
    await prisma.whatsAppHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        from: '+234800123456',
        message: 'Thank you for contacting MarketSage support. We will get back to you shortly.',
        content: JSON.stringify({
          type: 'text',
          text: 'Thank you for contacting MarketSage support. We will get back to you shortly.'
        }),
        status: 'delivered',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        metadata: JSON.stringify({ ticketId: 'support_123' })
      }
    });
  });

  console.log('3️⃣ Integration - CRM and third-party connections...');
  await seedTable('Integration', async () => {
    await prisma.integration.create({
      data: {
        id: randomUUID(),
        name: 'Salesforce CRM',
        type: 'CRM',
        provider: 'salesforce',
        status: 'ACTIVE',
        config: JSON.stringify({
          apiUrl: 'https://api.salesforce.com',
          syncFrequency: 'hourly'
        }),
        credentials: JSON.stringify({
          apiKey: 'encrypted_salesforce_key',
          domain: 'marketsage.salesforce.com'
        }),
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  console.log('4️⃣ ConversionEvent - Analytics event tracking...');
  await seedTable('ConversionEvent', async () => {
    await prisma.conversionEvent.create({
      data: {
        id: randomUUID(),
        name: 'Email Signup',
        description: 'User signs up for email newsletter',
        eventType: 'email_signup',
        category: 'CONSIDERATION',
        valueType: 'COUNT',
        isSystem: true,
        createdById: users[0].id
      }
    });
  });

  console.log('5️⃣ ContentAnalysis - AI content insights...');
  await seedTable('ContentAnalysis', async () => {
    await prisma.contentAnalysis.create({
      data: {
        id: randomUUID(),
        type: 'email_subject',
        contentType: 'email_subject',
        content: 'Unlock 50% Savings - Limited Time Offer!',
        analysis: JSON.stringify({
          sentiment: 'positive',
          urgency: 'high',
          personalizedScore: 75,
          suggestions: ['Consider A/B testing without urgency language']
        }),
        score: 85.5,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  console.log('6️⃣ SubjectLineTest - Email optimization...');
  await seedTable('SubjectLineTest', async () => {
    if (emailCampaigns.length > 0) {
      await prisma.subjectLineTest.create({
        data: {
          id: randomUUID(),
          campaignId: emailCampaigns[0].id,
          originalSubject: 'Our Monthly Newsletter',
          generatedSubjects: JSON.stringify([
            'Don\'t Miss This Month\'s Top Marketing Tips!',
            'Your Marketing Success Guide is Here 📈',
            'This Month: 5 Strategies That Actually Work'
          ]),
          bestPerformingSubject: 'Don\'t Miss This Month\'s Top Marketing Tips!',
          improvementPercentage: 23.5,
          organizationId: organization.id,
          createdById: users[0].id
        }
      });
    }
  });

  console.log('7️⃣ Subscription - Enterprise billing...');
  await seedTable('Subscription', async () => {
    const subscriptionPlan = await prisma.subscriptionPlan.findFirst();
    if (subscriptionPlan) {
      await prisma.subscription.create({
        data: {
          id: randomUUID(),
          organizationId: organization.id,
          planId: subscriptionPlan.id,
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          paystackCustomerId: 'cus_' + randomUUID().substring(0, 8)
        }
      });
    }
  });

  console.log('8️⃣ UserActivity - User behavior tracking...');
  await seedTable('UserActivity', async () => {
    await prisma.userActivity.create({
      data: {
        id: randomUUID(),
        userId: users[0].id,
        type: 'PAGE_VIEW',
        channel: 'WEB',
        metadata: JSON.stringify({
          page: '/dashboard',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        }),
        sentiment: 'positive'
      }
    });
  });

  console.log('9️⃣ LeadPulseForm - Lead capture forms...');
  await seedTable('LeadPulseForm', async () => {
    await prisma.leadPulseForm.create({
      data: {
        id: randomUUID(),
        title: 'Newsletter Signup',
        name: 'Newsletter Signup',
        description: 'Simple newsletter subscription form',
        fields: JSON.stringify([
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'firstName', type: 'text', required: false, label: 'First Name' }
        ]),
        settings: JSON.stringify({
          submitRedirect: '/thank-you',
          emailNotification: true
        }),
        isActive: true,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  console.log('🔟 LeadPulseFormSubmission - Form submissions...');
  await seedTable('LeadPulseFormSubmission', async () => {
    const form = await prisma.leadPulseForm.findFirst();
    if (form) {
      await prisma.leadPulseFormSubmission.create({
        data: {
          id: randomUUID(),
          formId: form.id,
          data: JSON.stringify({
            email: 'subscriber@example.com',
            firstName: 'John'
          }),
          ipAddress: '192.168.1.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          organizationId: organization.id
        }
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 MISSION ACCOMPLISHED! Successfully seeded ${successCount}/10 tables!`);
  
  if (successCount === 10) {
    console.log('🚀 100% SEEDING COVERAGE ACHIEVED!');
    console.log('🎯 MarketSage database is now COMPLETELY populated!');
    console.log('🌍 Ready for African market domination!');
  } else {
    console.log(`⚠️ ${10 - successCount} tables still need attention`);
  }
  
  console.log('='.repeat(60));
}

async function main() {
  try {
    await seedFinal10Tables();
  } catch (error) {
    console.error('❌ Final seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Final 10 tables seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Final seeding failed:', error.message);
      process.exit(1);
    });
}

export default main;