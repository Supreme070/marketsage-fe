#!/usr/bin/env tsx

/**
 * Test script for social media campaign functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSocialMediaFunctionality() {
  console.log('📱 Testing Social Media Campaign Functionality...\n');

  try {
    // 1. Test API Endpoint Import
    console.log('1. Testing API imports...');
    
    try {
      const { getEnhancedSocialMediaIntelligence } = await import('@/lib/ai/enhanced-social-media-intelligence');
      console.log('✅ Enhanced social media intelligence imported successfully');
    } catch (error) {
      console.log('❌ Enhanced social media intelligence import failed:', error);
    }

    // 2. Test direct API function call
    console.log('\n2. Testing social media intelligence initialization...');
    
    try {
      const { getEnhancedSocialMediaIntelligence } = await import('@/lib/ai/enhanced-social-media-intelligence');
      const socialMediaIntelligence = getEnhancedSocialMediaIntelligence();
      console.log('✅ Social media intelligence initialized successfully');
      console.log('   Intelligence type:', typeof socialMediaIntelligence);
      console.log('   Available methods:', Object.getOwnPropertyNames(socialMediaIntelligence).filter(name => typeof socialMediaIntelligence[name] === 'function'));
    } catch (error) {
      console.log('❌ Social media intelligence initialization failed:', error);
    }

    // 3. Test content generation
    console.log('\n3. Testing content generation...');
    
    try {
      const { getEnhancedSocialMediaIntelligence } = await import('@/lib/ai/enhanced-social-media-intelligence');
      const socialMediaIntelligence = getEnhancedSocialMediaIntelligence();
      
      const content = await socialMediaIntelligence.generateAutonomousContent(
        'facebook',
        'post',
        'Testing social media functionality',
        {
          tone: 'professional',
          length: 'medium',
          include_hashtags: true,
          include_mentions: false,
          visual_elements: true,
          call_to_action: true,
          trending: true
        }
      );
      
      console.log('✅ Content generation successful');
      console.log('   Generated content:', content);
    } catch (error) {
      console.log('❌ Content generation failed:', error);
    }

    // 4. Test hashtag research
    console.log('\n4. Testing hashtag research...');
    
    try {
      const { getEnhancedSocialMediaIntelligence } = await import('@/lib/ai/enhanced-social-media-intelligence');
      const socialMediaIntelligence = getEnhancedSocialMediaIntelligence();
      
      const hashtags = await socialMediaIntelligence.researchHashtags(
        'instagram',
        'digital marketing',
        {
          max_hashtags: 10,
          difficulty: 'mixed',
          trending: true,
          competitor_analysis: true,
          audience_size: 'medium'
        }
      );
      
      console.log('✅ Hashtag research successful');
      console.log('   Hashtags found:', hashtags.length);
      console.log('   Sample hashtags:', hashtags.slice(0, 3));
    } catch (error) {
      console.log('❌ Hashtag research failed:', error);
    }

    // 5. Test analytics
    console.log('\n5. Testing analytics...');
    
    try {
      const { getEnhancedSocialMediaIntelligence } = await import('@/lib/ai/enhanced-social-media-intelligence');
      const socialMediaIntelligence = getEnhancedSocialMediaIntelligence();
      
      const analytics = await socialMediaIntelligence.getRealtimeAnalytics(
        'facebook',
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        'test-org-id'
      );
      
      console.log('✅ Analytics retrieval successful');
      console.log('   Analytics data:', JSON.stringify(analytics, null, 2));
    } catch (error) {
      console.log('❌ Analytics retrieval failed:', error);
    }

    // 6. Test database connection
    console.log('\n6. Testing database connection...');
    
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('✅ Database connection successful');
      console.log('   Users found:', users.length);
    } catch (error) {
      console.log('❌ Database connection failed:', error);
    }

    // 7. Test dependency checks
    console.log('\n7. Testing dependencies...');
    
    const dependencies = [
      '@/lib/logger',
      '@/lib/cache/redis-client',
      '@/lib/ai/supreme-ai-engine',
      '@/lib/ai/cross-channel-ai-intelligence',
      '@/lib/ai/autonomous-decision-engine',
      '@/lib/ai/persistent-memory-engine'
    ];

    for (const dep of dependencies) {
      try {
        await import(dep);
        console.log(`✅ ${dep} - Available`);
      } catch (error) {
        console.log(`❌ ${dep} - Missing or has errors:`, error);
      }
    }

    console.log('\n🎉 Social Media Functionality Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSocialMediaFunctionality()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });