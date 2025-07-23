#!/usr/bin/env tsx

/**
 * Verify message delivery and check logs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMessageLogs() {
  console.log('📋 Verifying message delivery and checking logs...\n');

  try {
    // 1. Check SMS history
    console.log('📱 SMS History:');
    const smsHistory = await prisma.sMSHistory.findMany({
      where: {
        OR: [
          { to: '+2348012345678' },
          { to: '+2348098765432' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${smsHistory.length} SMS records:\n`);
    smsHistory.forEach((sms, index) => {
      console.log(`${index + 1}. SMS to ${sms.contact?.firstName || 'Unknown'}`);
      console.log(`   📱 Phone: ${sms.to}`);
      console.log(`   💬 Message: ${sms.message.substring(0, 50)}...`);
      console.log(`   📊 Status: ${sms.status}`);
      console.log(`   🆔 Message ID: ${sms.messageId}`);
      console.log(`   📅 Sent: ${sms.createdAt.toISOString()}`);
      
      if (sms.metadata) {
        try {
          const metadata = JSON.parse(sms.metadata);
          console.log(`   🏷️  Provider: ${metadata.provider || 'Unknown'}`);
          console.log(`   🧪 Test: ${metadata.testMessage ? 'Yes' : 'No'}`);
        } catch (e) {
          console.log(`   🏷️  Metadata: ${sms.metadata}`);
        }
      }
      console.log('');
    });

    // 2. Check email activities
    console.log('📧 Email Activities:');
    const emailActivities = await prisma.emailActivity.findMany({
      where: {
        contact: {
          OR: [
            { firstName: { contains: 'Kola', mode: 'insensitive' } },
            { firstName: { contains: 'Supreme', mode: 'insensitive' } }
          ]
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${emailActivities.length} email activity records:\n`);
    emailActivities.forEach((activity, index) => {
      console.log(`${index + 1}. Email to ${activity.contact?.firstName || 'Unknown'}`);
      console.log(`   📧 Email: ${activity.contact?.email}`);
      console.log(`   🎯 Type: ${activity.type}`);
      console.log(`   📅 Timestamp: ${activity.timestamp.toISOString()}`);
      
      if (activity.metadata) {
        try {
          const metadata = JSON.parse(activity.metadata);
          console.log(`   🏷️  Metadata: ${JSON.stringify(metadata, null, 2)}`);
        } catch (e) {
          console.log(`   🏷️  Metadata: ${activity.metadata}`);
        }
      }
      console.log('');
    });

    // 3. Check contacts
    console.log('👥 Contact Information:');
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Kola', mode: 'insensitive' } },
          { firstName: { contains: 'Supreme', mode: 'insensitive' } }
        ]
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
      console.log(`   📧 Email: ${contact.email}`);
      console.log(`   📱 Phone: ${contact.phone || 'Not set'}`);
      console.log(`   🏢 Company: ${contact.company || 'Not set'}`);
      console.log(`   📊 Status: ${contact.status}`);
      console.log(`   👤 Created by: ${contact.createdBy?.name || 'Unknown'}`);
      console.log(`   📅 Created: ${contact.createdAt.toISOString()}`);
      console.log(`   🔄 Updated: ${contact.updatedAt.toISOString()}`);
      console.log('');
    });

    // 4. Summary
    console.log('📊 Summary:');
    console.log(`✅ SMS messages sent: ${smsHistory.length}`);
    console.log(`✅ Email activities: ${emailActivities.length}`);
    console.log(`✅ Contacts verified: ${contacts.length}`);
    
    const successfulSMS = smsHistory.filter(sms => sms.status === 'SENT').length;
    const successfulEmails = emailActivities.filter(email => email.type === 'SENT').length;
    
    console.log(`📱 SMS success rate: ${successfulSMS}/${smsHistory.length} (${smsHistory.length > 0 ? Math.round((successfulSMS/smsHistory.length) * 100) : 0}%)`);
    console.log(`📧 Email success rate: ${successfulEmails}/${emailActivities.length} (${emailActivities.length > 0 ? Math.round((successfulEmails/emailActivities.length) * 100) : 0}%)`);

    console.log('\n✅ Message verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying messages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyMessageLogs()
  .then(() => {
    console.log('\n🎉 Message log verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });