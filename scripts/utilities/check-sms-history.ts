#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSMSHistory() {
  try {
    const smsHistory = await prisma.sMSHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    console.log(`📱 Total SMS History Records: ${smsHistory.length}\n`);
    
    smsHistory.forEach((sms, index) => {
      console.log(`${index + 1}. SMS to ${sms.contact?.firstName || 'Unknown'}`);
      console.log(`   📱 Phone: ${sms.to}`);
      console.log(`   💬 Message: ${sms.message.substring(0, 80)}...`);
      console.log(`   📊 Status: ${sms.status}`);
      console.log(`   🆔 Message ID: ${sms.messageId}`);
      console.log(`   📅 Sent: ${sms.createdAt.toISOString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSMSHistory();