/**
 * AI Features Test Script
 * 
 * This script tests the AI features implementation by:
 * 1. Setting up the required database tables
 * 2. Generating sample engagement data
 * 3. Testing the smart segmentation functionality
 * 4. Testing send time optimization
 * 
 * Run with: npx ts-node -r tsconfig-paths/register scripts/test-ai-features.ts
 */

import { initializeAIFeatures } from '../src/lib/ai-features-init';
import { recordEngagement, getEngagementStats, getBestSendTime } from '../src/lib/engagement-tracking';
import { generateSmartSegments, getContactsInSegment } from '../src/lib/smart-segmentation';
import prisma from '../src/lib/db/prisma';
import { ActivityType, EntityType, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runTests() {
  console.log('Starting AI features tests...');
  
  try {
    // Step 1: Initialize AI features
    console.log('\n1. Initializing AI features...');
    const initialized = await initializeAIFeatures();
    console.log(`   AI features initialized: ${initialized}`);
    
    if (!initialized) {
      throw new Error('Failed to initialize AI features');
    }
    
    // Step 2: Create test users and contacts if they don't exist
    console.log('\n2. Setting up test data...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.ADMIN,
          updatedAt: new Date(),
        }
      });
      console.log('   Created test user');
    } else {
      console.log('   Test user already exists');
    }
    
    // Create test contacts
    const testContactsData = [
      { email: 'active1@example.com', firstName: 'Active', lastName: 'User1' },
      { email: 'active2@example.com', firstName: 'Active', lastName: 'User2' },
      { email: 'inactive@example.com', firstName: 'Inactive', lastName: 'User' },
      { email: 'new@example.com', firstName: 'New', lastName: 'User' },
    ];
    
    const testContacts = [];
    for (const contactData of testContactsData) {
      let contact = await prisma.contact.findFirst({
        where: { email: contactData.email }
      });
      
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            id: uuidv4(),
            ...contactData,
            createdById: testUser.id,
            updatedAt: new Date(),
          }
        });
        console.log(`   Created contact: ${contactData.email}`);
      } else {
        console.log(`   Contact already exists: ${contactData.email}`);
      }
      
      testContacts.push(contact);
    }
    
    // Create test campaign if it doesn't exist
    let testCampaign = await prisma.emailCampaign.findFirst({
      where: { name: 'Test Campaign' }
    });
    
    if (!testCampaign) {
      testCampaign = await prisma.emailCampaign.create({
        data: {
          id: uuidv4(),
          name: 'Test Campaign',
          subject: 'Test Subject',
          from: 'test@example.com',
          content: 'Test content',
          createdById: testUser.id,
          updatedAt: new Date(),
        }
      });
      console.log('   Created test campaign');
    } else {
      console.log('   Test campaign already exists');
    }
    
    // Step 3: Generate engagement data
    console.log('\n3. Generating engagement data...');
    
    // Active user 1 - high engagement in mornings
    for (let i = 0; i < 5; i++) {
      await recordEngagement(
        testContacts[0].id,
        EntityType.EMAIL_CAMPAIGN,
        testCampaign.id,
        ActivityType.OPENED
      );
      await sleep(10);
      
      if (i < 3) {
        await recordEngagement(
          testContacts[0].id,
          EntityType.EMAIL_CAMPAIGN,
          testCampaign.id,
          ActivityType.CLICKED
        );
      }
      
      await sleep(10);
    }
    console.log('   Generated engagement for active user 1');
    
    // Active user 2 - high engagement in evenings
    for (let i = 0; i < 5; i++) {
      // Manipulate the time data for testing
      const now = new Date();
      const hourOfDay = 18; // 6 PM
      const dayOfWeek = (now.getDay() + 1) % 7; // Tomorrow
      
      await prisma.$executeRaw`
        INSERT INTO "EngagementTime" (
          "id", "contactId", "entityType", "entityId", "engagementType", 
          "dayOfWeek", "hourOfDay", "timestamp"
        )
        VALUES (
          gen_random_uuid(), 
          ${testContacts[1].id}, 
          ${EntityType.EMAIL_CAMPAIGN}, 
          ${testCampaign.id}, 
          ${ActivityType.OPENED}, 
          ${dayOfWeek}, 
          ${hourOfDay}, 
          NOW()
        )
      `;
      
      if (i < 3) {
        await prisma.$executeRaw`
          INSERT INTO "EngagementTime" (
            "id", "contactId", "entityType", "entityId", "engagementType", 
            "dayOfWeek", "hourOfDay", "timestamp"
          )
          VALUES (
            gen_random_uuid(), 
            ${testContacts[1].id}, 
            ${EntityType.EMAIL_CAMPAIGN}, 
            ${testCampaign.id}, 
            ${ActivityType.CLICKED}, 
            ${dayOfWeek}, 
            ${hourOfDay}, 
            NOW()
          )
        `;
      }
    }
    console.log('   Generated engagement for active user 2');
    
    // Step 4: Test engagement stats
    console.log('\n4. Testing engagement stats...');
    const stats = await getEngagementStats(
      EntityType.EMAIL_CAMPAIGN,
      testCampaign.id
    );
    
    console.log('   Engagement stats:');
    console.log(`   - Total activities: ${stats.totalActivities}`);
    console.log(`   - Open rate: ${stats.openRate?.toFixed(2)}`);
    console.log(`   - Click rate: ${stats.clickRate?.toFixed(2)}`);
    console.log('   - Engagement by hour:', stats.engagementByHour);
    console.log('   - Engagement by day:', stats.engagementByDay);
    
    // Step 5: Test send time optimization
    console.log('\n5. Testing send time optimization...');
    const bestTime1 = await getBestSendTime(testContacts[0].id);
    console.log(`   Best send time for active user 1: Day ${bestTime1?.dayOfWeek}, Hour ${bestTime1?.hourOfDay}, Confidence ${bestTime1?.confidence?.toFixed(2)}`);
    
    const bestTime2 = await getBestSendTime(testContacts[1].id);
    console.log(`   Best send time for active user 2: Day ${bestTime2?.dayOfWeek}, Hour ${bestTime2?.hourOfDay}, Confidence ${bestTime2?.confidence?.toFixed(2)}`);
    
    // Step 6: Test smart segmentation
    console.log('\n6. Testing smart segmentation...');
    const segments = await generateSmartSegments();
    console.log(`   Generated ${segments.length} smart segments:`);
    segments.forEach(segment => {
      console.log(`   - ${segment.name}: ${segment.description} (Score: ${segment.score}, Count: ${segment.estimatedCount})`);
    });
    
    if (segments.length > 0) {
      const segmentContacts = await getContactsInSegment(segments[0].id);
      console.log(`   Found ${segmentContacts.length} contacts in segment "${segments[0].name}"`);
    }
    
    console.log('\nAI features tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests(); 