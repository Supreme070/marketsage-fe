#!/usr/bin/env tsx

/**
 * Send real SMS messages using Twilio to all three contacts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function sendRealSMS() {
  console.log('📱 Sending REAL SMS messages via Twilio...\n');
  
  try {
    // Get admin user
    let adminUser = await prisma.user.findFirst({
      where: { email: 'admin@marketsage.africa' }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@marketsage.africa',
          name: 'Admin User',
          role: 'SUPER_ADMIN'
        }
      });
    }

    // Get all three contacts
    const contacts = [
      {
        name: 'Supreme',
        contact: await prisma.contact.findFirst({
          where: { firstName: { contains: 'Supreme', mode: 'insensitive' } }
        })
      },
      {
        name: 'Kola',
        contact: await prisma.contact.findFirst({
          where: { firstName: { contains: 'Kola', mode: 'insensitive' } }
        })
      },
      {
        name: 'Marketsage',
        contact: await prisma.contact.findFirst({
          where: { firstName: { contains: 'Marketsage', mode: 'insensitive' } }
        })
      }
    ].filter(item => item.contact !== null);

    console.log(`📱 Found ${contacts.length} contacts to send real SMS to:\n`);
    
    // Display contact info
    contacts.forEach(({ name, contact }) => {
      console.log(`👤 ${name}: ${contact?.firstName} ${contact?.lastName || ''}`);
      console.log(`   📧 Email: ${contact?.email}`);
      console.log(`   📱 Phone: ${contact?.phone}`);
      console.log('');
    });

    // Import SMS service
    const { smsService } = await import('../src/lib/sms-providers/sms-service');
    
    console.log('🚀 Starting real SMS delivery via Twilio...\n');
    
    const results = [];
    
    // Send SMS to each contact
    for (const { name, contact } of contacts) {
      if (!contact?.phone) {
        console.log(`❌ ${name}: No phone number found`);
        continue;
      }

      const message = `🎉 Hello ${contact.firstName}! This is a REAL SMS from MarketSage via Twilio. Your MarketSage account is active and ready! 🚀 Reply STOP to opt out.`;
      
      try {
        console.log(`📱 Sending SMS to ${name} (${contact.phone})...`);
        
        // Force Twilio provider
        const result = await smsService.sendSMS(contact.phone, message, undefined, 'twilio');
        results.push({ name, contact, result });
        
        if (result.success) {
          console.log(`✅ SUCCESS: SMS sent to ${name}`);
          console.log(`   📱 Phone: ${contact.phone}`);
          console.log(`   🆔 Message ID: ${result.messageId}`);
          console.log(`   📡 Provider: ${result.provider || 'Twilio'}`);
          
          // Save to SMS history
          await prisma.sMSHistory.create({
            data: {
              to: contact.phone,
              message,
              contactId: contact.id,
              userId: adminUser.id,
              status: 'SENT',
              messageId: result.messageId,
              metadata: JSON.stringify({
                realSMS: true,
                provider: 'twilio',
                contactName: name,
                timestamp: new Date().toISOString(),
                testRun: 'real-sms-delivery'
              })
            }
          });
          
        } else {
          console.log(`❌ FAILED: SMS to ${name}`);
          console.log(`   📱 Phone: ${contact.phone}`);
          console.log(`   ❌ Error: ${result.error?.message}`);
          console.log(`   📄 Code: ${result.error?.code || 'Unknown'}`);
        }
        
        console.log('');
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ EXCEPTION: Error sending SMS to ${name}: ${error}`);
        results.push({ name, contact, result: { success: false, error: { message: String(error) } } });
      }
    }

    // Final summary
    console.log('\n🎉 Real SMS Delivery Summary:\n');
    
    const successCount = results.filter(r => r.result.success).length;
    const failCount = results.filter(r => !r.result.success).length;
    
    console.log(`📊 Overall Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📱 Total: ${results.length}`);
    console.log(`   📈 Success Rate: ${results.length > 0 ? Math.round((successCount/results.length) * 100) : 0}%`);
    
    console.log('\n📱 Individual Results:');
    results.forEach(({ name, contact, result }) => {
      console.log(`   ${name} (${contact?.phone}): ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (!result.success) {
        console.log(`     Error: ${result.error?.message}`);
      }
    });
    
    if (successCount > 0) {
      console.log('\n🎯 Important Notes:');
      console.log('• This is a Twilio trial account - messages only go to verified numbers');
      console.log('• You should receive the SMS messages on your verified phone numbers');
      console.log('• Check your phone for the real MarketSage SMS messages!');
      console.log('• Messages include "Reply STOP to opt out" for compliance');
    }

    console.log('\n✅ Real SMS delivery test completed!');
    
  } catch (error) {
    console.error('❌ Error in real SMS delivery:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the real SMS test
sendRealSMS()
  .then(() => {
    console.log('\n🎉 Real SMS delivery completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Real SMS delivery failed:', error);
    process.exit(1);
  });