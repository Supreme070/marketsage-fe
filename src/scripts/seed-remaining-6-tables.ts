#!/usr/bin/env tsx

/**
 * Seed the remaining 6 tables with correct schema compliance
 * 
 * Remaining tables:
 * 1. SMSHistory (correct schema)
 * 2. WhatsAppHistory (correct schema)
 * 3. Integration (needs organization relation)
 * 4. ContentAnalysis (correct schema)
 * 5. SubjectLineTest (correct schema)
 * 6. LeadPulseForm (needs FormField relations)
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

async function seedRemaining6Tables() {
  console.log('🎯 FIXING THE REMAINING 6 TABLES - SCHEMA CORRECTED!\n');
  
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
      console.log(`✅ ${tableName} - SEEDED SUCCESSFULLY!`);
    } catch (error) {
      console.log(`❌ ${tableName} - FAILED: ${error.message}`);
    }
  }

  console.log('1️⃣ SMSHistory - Fixed schema...');
  await seedTable('SMSHistory', async () => {
    await prisma.sMSHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        from: 'MarketSage',
        message: 'Your verification code is 123456. Valid for 10 minutes.',
        originalMessage: 'Your verification code is {{code}}. Valid for {{duration}}.',
        status: 'DELIVERED',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        messageId: 'sms_' + randomUUID().substring(0, 8),
        metadata: JSON.stringify({ campaignId: 'verification_001', provider: 'africastalking' })
      }
    });
  });

  console.log('2️⃣ WhatsAppHistory - Fixed schema...');
  await seedTable('WhatsAppHistory', async () => {
    await prisma.whatsAppHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        message: 'Thank you for contacting MarketSage support. We will get back to you shortly.',
        originalMessage: 'Thank you for contacting MarketSage support. We will get back to you shortly.',
        status: 'DELIVERED',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        messageId: 'wa_' + randomUUID().substring(0, 8),
        metadata: JSON.stringify({ ticketId: 'support_123', messageType: 'text' })
      }
    });
  });

  console.log('3️⃣ Integration - Connect to existing organization...');
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

  console.log('4️⃣ ContentAnalysis - Fixed schema with originalContent...');
  await seedTable('ContentAnalysis', async () => {
    await prisma.contentAnalysis.create({
      data: {
        id: randomUUID(),
        type: 'SENTIMENT',
        contentType: 'EMAIL_SUBJECT',
        originalContent: 'Unlock 50% Savings - Limited Time Offer!',
        result: JSON.stringify({
          sentiment: 'positive',
          score: 85.5,
          urgency: 'high',
          personalizedScore: 75,
          suggestions: ['Consider A/B testing without urgency language']
        }),
        userId: users[0].id
      }
    });
  });

  console.log('5️⃣ SubjectLineTest - Fixed schema with variants...');
  await seedTable('SubjectLineTest', async () => {
    if (emailCampaigns.length > 0) {
      await prisma.subjectLineTest.create({
        data: {
          id: randomUUID(),
          campaignId: emailCampaigns[0].id,
          originalSubject: 'Our Monthly Newsletter',
          variants: JSON.stringify([
            'Don\'t Miss This Month\'s Top Marketing Tips!',
            'Your Marketing Success Guide is Here 📈',
            'This Month: 5 Strategies That Actually Work'
          ]),
          status: 'COMPLETED',
          winnerVariantId: '0',
          startedAt: new Date('2024-01-15'),
          endedAt: new Date('2024-01-22'),
          createdById: users[0].id
        }
      });
    }
  });

  console.log('6️⃣ LeadPulseForm - Creating form and fields separately...');
  await seedTable('LeadPulseForm', async () => {
    const form = await prisma.leadPulseForm.create({
      data: {
        id: randomUUID(),
        name: 'Newsletter Signup',
        title: 'Subscribe to our Newsletter',
        description: 'Get the latest marketing insights delivered to your inbox',
        status: 'PUBLISHED',
        layout: 'SINGLE_COLUMN',
        theme: JSON.stringify({
          primaryColor: '#2563eb',
          fontFamily: 'Inter',
          backgroundColor: '#ffffff'
        }),
        settings: JSON.stringify({
          submitRedirect: '/thank-you',
          emailNotification: true,
          autoresponder: true
        }),
        submitButtonText: 'Subscribe Now',
        successMessage: 'Thanks for subscribing! Check your email for confirmation.',
        isTrackingEnabled: true,
        conversionGoal: 'newsletter_signup',
        organizationId: organization.id,
        createdById: users[0].id
      }
    });

    // Create form fields
    await prisma.leadPulseFormField.create({
      data: {
        id: randomUUID(),
        formId: form.id,
        type: 'EMAIL',
        name: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email',
        isRequired: true,
        isVisible: true,
        position: 1,
        validation: JSON.stringify({
          required: true,
          pattern: '^[^@]+@[^@]+\\.[^@]+$'
        })
      }
    });

    await prisma.leadPulseFormField.create({
      data: {
        id: randomUUID(),
        formId: form.id,
        type: 'TEXT',
        name: 'firstName',
        label: 'First Name',
        placeholder: 'Enter your first name',
        isRequired: false,
        isVisible: true,
        position: 2
      }
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 FINAL PUSH COMPLETE! Successfully seeded ${successCount}/6 remaining tables!`);
  
  if (successCount === 6) {
    console.log('🚀 🚀 🚀 100% SEEDING COVERAGE ACHIEVED! 🚀 🚀 🚀');
    console.log('🎯 ALL TABLES ARE NOW POPULATED!');
    console.log('🌍 MarketSage is FULLY READY for African market domination!');
  } else {
    console.log(`⚠️ ${6 - successCount} tables still need attention`);
  }
  
  console.log('='.repeat(60));
}

async function main() {
  try {
    await seedRemaining6Tables();
  } catch (error) {
    console.error('❌ Remaining tables seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Remaining 6 tables seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Remaining tables seeding failed:', error.message);
      process.exit(1);
    });
}

export default main;