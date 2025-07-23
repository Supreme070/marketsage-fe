#!/usr/bin/env tsx

/**
 * Test Script for sending email and SMS to Kola and Supreme
 * 
 * This script tests the MarketSage messaging functionality by sending
 * test messages to both contacts through email and SMS.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function testKolaSupremeMessages() {
  console.log('📱 Testing MarketSage Messaging for Kola and Supreme...\n');

  try {
    // 1. Get or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'admin@marketsage.africa' }
    });
    
    if (!testUser) {
      console.log('⚠️  No admin user found, creating one...');
      testUser = await prisma.user.create({
        data: {
          email: 'admin@marketsage.africa',
          name: 'Admin User',
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ Admin user created:', testUser.id);
    }

    // 2. Create or update Kola contact
    console.log('👤 Setting up Kola contact...');
    
    let kolaContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Kola', mode: 'insensitive' }
      }
    });

    if (!kolaContact) {
      kolaContact = await prisma.contact.create({
        data: {
          firstName: 'Kola',
          lastName: 'Adebayo',
          email: 'kola@example.com',
          phone: '+2348012345678',
          company: 'Test Company',
          status: 'ACTIVE',
          createdById: testUser.id
        }
      });
      console.log('✅ Kola contact created:', kolaContact.id);
    } else {
      console.log('✅ Kola contact found:', kolaContact.id);
    }

    // 3. Create or update Supreme contact
    console.log('👤 Setting up Supreme contact...');
    
    let supremeContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Supreme', mode: 'insensitive' }
      }
    });

    if (!supremeContact) {
      supremeContact = await prisma.contact.create({
        data: {
          firstName: 'Supreme',
          lastName: 'Admin',
          email: 'supreme@example.com',
          phone: '+2348098765432',
          company: 'MarketSage',
          status: 'ACTIVE',
          createdById: testUser.id
        }
      });
      console.log('✅ Supreme contact created:', supremeContact.id);
    } else {
      console.log('✅ Supreme contact found:', supremeContact.id);
    }

    // 4. Test SMS sending
    console.log('\n📱 Testing SMS sending...');
    
    const { smsService } = await import('../src/lib/sms-providers/sms-service');
    
    // Send SMS to Kola
    const kolaMessage = `Hi ${kolaContact.firstName}! This is a test SMS from MarketSage. Your account is active and ready to use. 📱`;
    const kolaSMSResult = await smsService.sendSMS(kolaContact.phone!, kolaMessage);
    
    console.log(`SMS to Kola: ${kolaSMSResult.success ? '✅ Success' : '❌ Failed'}`);
    if (kolaSMSResult.success) {
      console.log(`  Message ID: ${kolaSMSResult.messageId}`);
      console.log(`  Provider: ${kolaSMSResult.provider}`);
    } else {
      console.log(`  Error: ${kolaSMSResult.error?.message}`);
    }

    // Send SMS to Supreme
    const supremeMessage = `Hi ${supremeContact.firstName}! This is a test SMS from MarketSage. System test successful! 🚀`;
    const supremeSMSResult = await smsService.sendSMS(supremeContact.phone!, supremeMessage);
    
    console.log(`SMS to Supreme: ${supremeSMSResult.success ? '✅ Success' : '❌ Failed'}`);
    if (supremeSMSResult.success) {
      console.log(`  Message ID: ${supremeSMSResult.messageId}`);
      console.log(`  Provider: ${supremeSMSResult.provider}`);
    } else {
      console.log(`  Error: ${supremeSMSResult.error?.message}`);
    }

    // 5. Test email sending
    console.log('\n📧 Testing email sending...');
    
    const { sendTrackedEmail } = await import('../src/lib/email-service');
    
    // Send email to Kola
    const kolaEmailOptions = {
      from: 'test@marketsage.africa',
      subject: 'Test Email from MarketSage',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Hello ${kolaContact.firstName}!</h2>
          <p>This is a test email from MarketSage to verify our email system is working correctly.</p>
          <p>Your contact details:</p>
          <ul>
            <li><strong>Name:</strong> ${kolaContact.firstName} ${kolaContact.lastName}</li>
            <li><strong>Email:</strong> ${kolaContact.email}</li>
            <li><strong>Phone:</strong> ${kolaContact.phone}</li>
            <li><strong>Company:</strong> ${kolaContact.company}</li>
          </ul>
          <p>Best regards,<br>MarketSage Team</p>
        </div>
      `,
      metadata: {
        testEmail: true,
        contactId: kolaContact.id,
        sentBy: testUser.email,
        sentAt: new Date().toISOString(),
      },
    };
    
    const kolaEmailResult = await sendTrackedEmail(kolaContact, 'test-campaign-kola', kolaEmailOptions);
    
    console.log(`Email to Kola: ${kolaEmailResult.success ? '✅ Success' : '❌ Failed'}`);
    if (kolaEmailResult.success) {
      console.log(`  Message ID: ${kolaEmailResult.messageId}`);
      console.log(`  Provider: ${kolaEmailResult.provider}`);
    } else {
      console.log(`  Error: ${kolaEmailResult.error?.message}`);
    }

    // Send email to Supreme
    const supremeEmailOptions = {
      from: 'test@marketsage.africa',
      subject: 'Test Email from MarketSage',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Hello ${supremeContact.firstName}!</h2>
          <p>This is a test email from MarketSage to verify our email system is working correctly.</p>
          <p>Your contact details:</p>
          <ul>
            <li><strong>Name:</strong> ${supremeContact.firstName} ${supremeContact.lastName}</li>
            <li><strong>Email:</strong> ${supremeContact.email}</li>
            <li><strong>Phone:</strong> ${supremeContact.phone}</li>
            <li><strong>Company:</strong> ${supremeContact.company}</li>
          </ul>
          <p>System test completed successfully! 🚀</p>
          <p>Best regards,<br>MarketSage Team</p>
        </div>
      `,
      metadata: {
        testEmail: true,
        contactId: supremeContact.id,
        sentBy: testUser.email,
        sentAt: new Date().toISOString(),
      },
    };
    
    const supremeEmailResult = await sendTrackedEmail(supremeContact, 'test-campaign-supreme', supremeEmailOptions);
    
    console.log(`Email to Supreme: ${supremeEmailResult.success ? '✅ Success' : '❌ Failed'}`);
    if (supremeEmailResult.success) {
      console.log(`  Message ID: ${supremeEmailResult.messageId}`);
      console.log(`  Provider: ${supremeEmailResult.provider}`);
    } else {
      console.log(`  Error: ${supremeEmailResult.error?.message}`);
    }

    // 6. Save message history
    console.log('\n💾 Saving message history...');
    
    if (kolaSMSResult.success) {
      await prisma.sMSHistory.create({
        data: {
          to: kolaContact.phone!,
          message: kolaMessage,
          contactId: kolaContact.id,
          userId: testUser.id,
          status: 'SENT',
          messageId: kolaSMSResult.messageId,
          metadata: JSON.stringify({
            testMessage: true,
            provider: kolaSMSResult.provider,
            timestamp: new Date().toISOString()
          })
        }
      });
    }

    if (supremeSMSResult.success) {
      await prisma.sMSHistory.create({
        data: {
          to: supremeContact.phone!,
          message: supremeMessage,
          contactId: supremeContact.id,
          userId: testUser.id,
          status: 'SENT',
          messageId: supremeSMSResult.messageId,
          metadata: JSON.stringify({
            testMessage: true,
            provider: supremeSMSResult.provider,
            timestamp: new Date().toISOString()
          })
        }
      });
    }

    console.log('✅ Message history saved');

    // 7. Summary
    console.log('\n🎉 Test Summary:');
    console.log(`📱 SMS to Kola: ${kolaSMSResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`📱 SMS to Supreme: ${supremeSMSResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`📧 Email to Kola: ${kolaEmailResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`📧 Email to Supreme: ${supremeEmailResult.success ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n📊 Contact Information:');
    console.log(`👤 Kola: ${kolaContact.firstName} ${kolaContact.lastName}`);
    console.log(`   📧 Email: ${kolaContact.email}`);
    console.log(`   📱 Phone: ${kolaContact.phone}`);
    console.log(`   🏢 Company: ${kolaContact.company}`);
    
    console.log(`👤 Supreme: ${supremeContact.firstName} ${supremeContact.lastName}`);
    console.log(`   📧 Email: ${supremeContact.email}`);
    console.log(`   📱 Phone: ${supremeContact.phone}`);
    console.log(`   🏢 Company: ${supremeContact.company}`);

    console.log('\n✅ MarketSage messaging test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testKolaSupremeMessages()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testKolaSupremeMessages;