#!/usr/bin/env tsx

/**
 * Seed the FINAL 2 tables - 100% COVERAGE!
 * 
 * Fixed Issues:
 * - Integration: use createdBy instead of createdById
 * - LeadPulseForm: use createdBy instead of organizationId
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

async function seedFinal2Tables() {
  console.log('🎯 FINAL 2 TABLES - ACHIEVING 100% COVERAGE!\n');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 5 });
  
  if (!organization || users.length === 0) {
    throw new Error('Need at least 1 organization and 1 user');
  }

  let successCount = 0;

  async function seedTable(tableName: string, createFn: () => Promise<any>) {
    try {
      await createFn();
      successCount++;
      console.log(`✅ ${tableName} - FINALLY SEEDED! 🎉`);
    } catch (error) {
      console.log(`❌ ${tableName} - FAILED: ${error.message}`);
    }
  }

  console.log('1️⃣ Integration - Fixed: use createdBy field...');
  await seedTable('Integration', async () => {
    await prisma.integration.create({
      data: {
        id: randomUUID(),
        name: 'Salesforce CRM Integration',
        type: 'CRM',
        description: 'Sync contacts and leads with Salesforce CRM',
        credentials: JSON.stringify({
          apiKey: 'encrypted_salesforce_key',
          domain: 'marketsage.salesforce.com',
          username: 'admin@marketsage.africa'
        }),
        status: 'ACTIVE',
        lastSyncedAt: new Date(),
        organizationId: organization.id,
        createdBy: users[0].id  // Fixed: use createdBy instead of createdById
      }
    });
  });

  console.log('2️⃣ LeadPulseForm - Fixed: use createdBy field...');
  await seedTable('LeadPulseForm', async () => {
    const form = await prisma.leadPulseForm.create({
      data: {
        id: randomUUID(),
        name: 'Newsletter Signup Form',
        title: 'Subscribe to MarketSage Newsletter',
        description: 'Get the latest African marketing insights delivered to your inbox',
        status: 'PUBLISHED',
        layout: 'SINGLE_COLUMN',
        theme: {
          primaryColor: '#2563eb',
          fontFamily: 'Inter',
          backgroundColor: '#ffffff',
          borderRadius: '8px'
        },
        settings: {
          submitRedirect: '/thank-you',
          emailNotification: true,
          autoresponder: true,
          enableRecaptcha: false
        },
        submitButtonText: 'Subscribe Now',
        successMessage: 'Thanks for subscribing! Check your email for confirmation.',
        errorMessage: 'Something went wrong. Please try again.',
        redirectUrl: '/newsletter-thank-you',
        isTrackingEnabled: true,
        conversionGoal: 'newsletter_signup',
        isPublished: true,
        publishedAt: new Date(),
        embedCode: '<iframe src="https://marketsage.africa/forms/newsletter" width="400" height="300"></iframe>',
        publicUrl: 'https://marketsage.africa/forms/newsletter',
        createdBy: users[0].id  // Fixed: use createdBy instead of organizationId
      }
    });

    // Create the form fields
    await prisma.leadPulseFormField.create({
      data: {
        id: randomUUID(),
        formId: form.id,
        type: 'EMAIL',
        name: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        isRequired: true,
        isVisible: true,
        position: 1,
        validation: {
          required: true,
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          message: 'Please enter a valid email address'
        }
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
        position: 2,
        validation: {
          minLength: 2,
          maxLength: 50
        }
      }
    });

    await prisma.leadPulseFormField.create({
      data: {
        id: randomUUID(),
        formId: form.id,
        type: 'SELECT',
        name: 'interest',
        label: 'Primary Interest',
        placeholder: 'Select your interest',
        isRequired: false,
        isVisible: true,
        position: 3,
        options: [
          { value: 'email_marketing', label: 'Email Marketing' },
          { value: 'sms_marketing', label: 'SMS Marketing' },
          { value: 'whatsapp_marketing', label: 'WhatsApp Marketing' },
          { value: 'ai_insights', label: 'AI Marketing Insights' },
          { value: 'automation', label: 'Marketing Automation' }
        ]
      }
    });

    console.log(`   ✅ Created form with ${3} fields`);
  });

  console.log('\n' + '🎉'.repeat(20));
  console.log('🎯 FINAL RESULTS:');
  console.log('🎉'.repeat(20));
  
  if (successCount === 2) {
    console.log('🚀 🚀 🚀 100% COVERAGE ACHIEVED! 🚀 🚀 🚀');
    console.log('🎉 ALL TABLES ARE NOW POPULATED!');
    console.log('🌍 MarketSage is COMPLETELY READY!');
    console.log('💼 African market domination: UNLOCKED!');
    console.log('📊 Database transformation: COMPLETE!');
    console.log('🎯 Mission: ACCOMPLISHED!');
  } else {
    console.log(`⚠️ ${2 - successCount} tables still need attention`);
  }
  
  console.log('🎉'.repeat(20));
}

async function main() {
  try {
    await seedFinal2Tables();
  } catch (error) {
    console.error('❌ Final 2 tables seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 FINAL 2 TABLES SEEDING COMPLETED!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Final seeding failed:', error.message);
      process.exit(1);
    });
}

export default main;