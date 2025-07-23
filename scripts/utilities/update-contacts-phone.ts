#!/usr/bin/env tsx

/**
 * Update contacts with phone numbers for SMS testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateContactsWithPhones() {
  console.log('📱 Updating contacts with phone numbers...\n');

  try {
    // Update Kola contact
    const kolaContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Kola', mode: 'insensitive' }
      }
    });

    if (kolaContact) {
      await prisma.contact.update({
        where: { id: kolaContact.id },
        data: {
          phone: '+2348012345678',
          company: 'Test Company'
        }
      });
      console.log('✅ Kola contact updated with phone number');
    }

    // Update Supreme contact
    const supremeContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Supreme', mode: 'insensitive' }
      }
    });

    if (supremeContact) {
      await prisma.contact.update({
        where: { id: supremeContact.id },
        data: {
          phone: '+2348098765432',
          company: 'MarketSage'
        }
      });
      console.log('✅ Supreme contact updated with phone number');
    }

    console.log('\n📱 Now testing SMS sending...');
    
    const { smsService } = await import('../src/lib/sms-providers/sms-service');
    
    // Test SMS to Kola
    if (kolaContact) {
      const kolaMessage = `Hi ${kolaContact.firstName}! This is a test SMS from MarketSage. Your account is active and ready to use. 📱`;
      const kolaSMSResult = await smsService.sendSMS('+2348012345678', kolaMessage);
      
      console.log(`SMS to Kola: ${kolaSMSResult.success ? '✅ Success' : '❌ Failed'}`);
      if (kolaSMSResult.success) {
        console.log(`  Message ID: ${kolaSMSResult.messageId}`);
        console.log(`  Provider: ${kolaSMSResult.provider}`);
      } else {
        console.log(`  Error: ${kolaSMSResult.error?.message}`);
      }
    }

    // Test SMS to Supreme
    if (supremeContact) {
      const supremeMessage = `Hi ${supremeContact.firstName}! This is a test SMS from MarketSage. System test successful! 🚀`;
      const supremeSMSResult = await smsService.sendSMS('+2348098765432', supremeMessage);
      
      console.log(`SMS to Supreme: ${supremeSMSResult.success ? '✅ Success' : '❌ Failed'}`);
      if (supremeSMSResult.success) {
        console.log(`  Message ID: ${supremeSMSResult.messageId}`);
        console.log(`  Provider: ${supremeSMSResult.provider}`);
      } else {
        console.log(`  Error: ${supremeSMSResult.error?.message}`);
      }
    }

    console.log('\n✅ Phone number update and SMS test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateContactsWithPhones()
  .then(() => {
    console.log('\n🎉 Contact update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });