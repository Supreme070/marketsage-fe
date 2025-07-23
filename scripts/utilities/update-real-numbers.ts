#!/usr/bin/env tsx

/**
 * Update contacts with real phone numbers and create Marketsage contact
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRealNumbers() {
  console.log('📱 Updating contacts with real phone numbers...\n');

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

    // 1. Update Supreme's phone number
    console.log('👤 Updating Supreme contact...');
    const supremeContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Supreme', mode: 'insensitive' }
      }
    });

    if (supremeContact) {
      await prisma.contact.update({
        where: { id: supremeContact.id },
        data: {
          phone: '+2348061364696'
        }
      });
      console.log('✅ Supreme contact updated with +2348061364696');
    }

    // 2. Update Kola's phone number
    console.log('👤 Updating Kola contact...');
    const kolaContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Kola', mode: 'insensitive' }
      }
    });

    if (kolaContact) {
      await prisma.contact.update({
        where: { id: kolaContact.id },
        data: {
          phone: '+15127437322'  // Formatted without spaces and parentheses
        }
      });
      console.log('✅ Kola contact updated with +15127437322');
    }

    // 3. Create or update Marketsage contact
    console.log('👤 Creating/updating Marketsage contact...');
    let marketsageContact = await prisma.contact.findFirst({
      where: { 
        firstName: { contains: 'Marketsage', mode: 'insensitive' }
      }
    });

    if (!marketsageContact) {
      marketsageContact = await prisma.contact.create({
        data: {
          firstName: 'Marketsage',
          lastName: 'Team',
          email: 'info@marketsage.africa',
          phone: '+2348132685291',
          company: 'MarketSage',
          status: 'ACTIVE',
          createdById: adminUser.id
        }
      });
      console.log('✅ Marketsage contact created with +2348132685291');
    } else {
      await prisma.contact.update({
        where: { id: marketsageContact.id },
        data: {
          phone: '+2348132685291',
          email: 'info@marketsage.africa'
        }
      });
      console.log('✅ Marketsage contact updated with +2348132685291');
    }

    // Display updated contacts
    console.log('\n📊 Updated Contact Information:');
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Supreme', mode: 'insensitive' } },
          { firstName: { contains: 'Kola', mode: 'insensitive' } },
          { firstName: { contains: 'Marketsage', mode: 'insensitive' } }
        ]
      }
    });

    allContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
      console.log(`   📧 Email: ${contact.email}`);
      console.log(`   📱 Phone: ${contact.phone}`);
      console.log(`   🏢 Company: ${contact.company || 'Not set'}`);
      console.log('');
    });

    console.log('✅ All contacts updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating contacts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRealNumbers()
  .then(() => {
    console.log('\n🎉 Contact update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });