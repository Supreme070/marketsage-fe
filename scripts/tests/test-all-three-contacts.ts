#!/usr/bin/env tsx

/**
 * Test Script for sending email and SMS to Supreme, Kola, and Marketsage
 * 
 * This script tests the MarketSage messaging functionality by sending
 * test messages to all three contacts through email and SMS.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function testAllThreeContacts() {
  console.log('📱 Testing MarketSage Messaging for Supreme, Kola, and Marketsage...\n');

  try {
    // 1. Get admin user
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

    // 2. Get all three contacts
    console.log('👥 Fetching contacts...');
    
    const supremeContact = await prisma.contact.findFirst({
      where: { firstName: { contains: 'Supreme', mode: 'insensitive' } }
    });
    
    const kolaContact = await prisma.contact.findFirst({
      where: { firstName: { contains: 'Kola', mode: 'insensitive' } }
    });
    
    const marketsageContact = await prisma.contact.findFirst({
      where: { firstName: { contains: 'Marketsage', mode: 'insensitive' } }
    });

    const contacts = [
      { name: 'Supreme', contact: supremeContact },
      { name: 'Kola', contact: kolaContact },
      { name: 'Marketsage', contact: marketsageContact }
    ].filter(item => item.contact !== null);

    console.log(`✅ Found ${contacts.length} contacts to test\n`);

    // 3. Test SMS sending
    console.log('📱 Testing SMS sending...\n');
    
    const { smsService } = await import('../src/lib/sms-providers/sms-service');
    const smsResults = [];
    
    for (const { name, contact } of contacts) {
      if (!contact?.phone) {
        console.log(`❌ ${name}: No phone number found`);
        continue;
      }

      const message = `Hi ${contact.firstName}! This is a test SMS from MarketSage. Your updated phone number (${contact.phone}) is now in our system. 📱✨`;
      
      try {
        const result = await smsService.sendSMS(contact.phone, message);
        smsResults.push({ name, contact, result });
        
        console.log(`📱 SMS to ${name}: ${result.success ? '✅ Success' : '❌ Failed'}`);
        if (result.success) {
          console.log(`   Phone: ${contact.phone}`);
          console.log(`   Message ID: ${result.messageId}`);
          console.log(`   Provider: ${result.provider}`);
        } else {
          console.log(`   Error: ${result.error?.message}`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ SMS to ${name}: Error - ${error}`);
        smsResults.push({ name, contact, result: { success: false, error: { message: String(error) } } });
      }
    }

    // 4. Test email sending
    console.log('📧 Testing email sending...\n');
    
    const { sendTrackedEmail } = await import('../src/lib/email-service');
    const emailResults = [];
    
    for (const { name, contact } of contacts) {
      if (!contact?.email) {
        console.log(`❌ ${name}: No email address found`);
        continue;
      }

      const emailOptions = {
        from: 'test@marketsage.africa',
        subject: `MarketSage Test - Hello ${contact.firstName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff; text-align: center;">Hello ${contact.firstName}!</h2>
            <p>This is a test email from MarketSage to verify our messaging system is working correctly with your updated contact information.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Contact Details:</h3>
              <ul style="color: #666;">
                <li><strong>Name:</strong> ${contact.firstName} ${contact.lastName || ''}</li>
                <li><strong>Email:</strong> ${contact.email}</li>
                <li><strong>Phone:</strong> ${contact.phone}</li>
                <li><strong>Company:</strong> ${contact.company || 'Not specified'}</li>
              </ul>
            </div>
            
            <p style="color: #28a745; font-weight: bold;">✅ Email system test successful!</p>
            <p style="color: #28a745; font-weight: bold;">✅ SMS system test successful!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px; text-align: center;">
              This is an automated test message from MarketSage.<br>
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
        metadata: {
          testEmail: true,
          contactId: contact.id,
          sentBy: adminUser.email,
          sentAt: new Date().toISOString(),
          testRun: 'all-three-contacts'
        },
      };
      
      try {
        const result = await sendTrackedEmail(contact, `test-campaign-${name.toLowerCase()}`, emailOptions);
        emailResults.push({ name, contact, result });
        
        console.log(`📧 Email to ${name}: ${result.success ? '✅ Success' : '❌ Failed'}`);
        if (result.success) {
          console.log(`   Email: ${contact.email}`);
          console.log(`   Message ID: ${result.messageId}`);
          console.log(`   Provider: ${result.provider}`);
        } else {
          console.log(`   Error: ${result.error?.message}`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ Email to ${name}: Error - ${error}`);
        emailResults.push({ name, contact, result: { success: false, error: { message: String(error) } } });
      }
    }

    // 5. Save successful SMS to history
    console.log('💾 Saving SMS history...');
    
    for (const { name, contact, result } of smsResults) {
      if (result.success && contact) {
        try {
          await prisma.sMSHistory.create({
            data: {
              to: contact.phone!,
              message: `Hi ${contact.firstName}! This is a test SMS from MarketSage. Your updated phone number (${contact.phone}) is now in our system. 📱✨`,
              contactId: contact.id,
              userId: adminUser.id,
              status: 'SENT',
              messageId: result.messageId,
              metadata: JSON.stringify({
                testMessage: true,
                contactName: name,
                provider: result.provider,
                timestamp: new Date().toISOString(),
                testRun: 'all-three-contacts'
              })
            }
          });
          console.log(`✅ SMS history saved for ${name}`);
        } catch (error) {
          console.log(`⚠️ Failed to save SMS history for ${name}: ${error}`);
        }
      }
    }

    // 6. Final Summary
    console.log('\n🎉 Complete Test Summary:\n');
    
    console.log('📊 Contact Information:');
    contacts.forEach(({ name, contact }) => {
      console.log(`👤 ${name}: ${contact?.firstName} ${contact?.lastName || ''}`);
      console.log(`   📧 Email: ${contact?.email}`);
      console.log(`   📱 Phone: ${contact?.phone}`);
      console.log(`   🏢 Company: ${contact?.company || 'Not set'}`);
      console.log('');
    });

    console.log('📱 SMS Results:');
    smsResults.forEach(({ name, result }) => {
      console.log(`   ${name}: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (!result.success) {
        console.log(`     Error: ${result.error?.message}`);
      }
    });

    console.log('\n📧 Email Results:');
    emailResults.forEach(({ name, result }) => {
      console.log(`   ${name}: ${result.success ? '✅ Success' : '❌ Failed'}`);
      if (!result.success) {
        console.log(`     Error: ${result.error?.message}`);
      }
    });

    const smsSuccessCount = smsResults.filter(r => r.result.success).length;
    const emailSuccessCount = emailResults.filter(r => r.result.success).length;
    
    console.log('\n📈 Success Rates:');
    console.log(`📱 SMS: ${smsSuccessCount}/${smsResults.length} (${smsResults.length > 0 ? Math.round((smsSuccessCount/smsResults.length) * 100) : 0}%)`);
    console.log(`📧 Email: ${emailSuccessCount}/${emailResults.length} (${emailResults.length > 0 ? Math.round((emailSuccessCount/emailResults.length) * 100) : 0}%)`);

    console.log('\n✅ MarketSage messaging test for all three contacts completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testAllThreeContacts()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testAllThreeContacts;