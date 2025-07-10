import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSMSCampaigns() {
  console.log('📱 Testing SMS Campaign Functionality...\n');
  
  try {
    // Check for existing SMS campaigns
    const campaigns = await prisma.sMSCampaign.findMany({
      take: 5,
      include: {
        createdBy: true,
        template: true,
        activities: true
      }
    });
    
    console.log('📋 SMS Campaign Database Status:');
    console.log('Total campaigns:', campaigns.length);
    
    if (campaigns.length > 0) {
      console.log('\n📈 Recent SMS Campaigns:');
      campaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.name}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   From: ${campaign.from}`);
        console.log(`   Created: ${campaign.createdAt.toISOString()}`);
        console.log(`   Activities: ${campaign.activities.length}`);
        console.log('');
      });
    }
    
    // Get a test user for the campaign
    let testUser = await prisma.user.findFirst();
    
    if (!testUser) {
      console.log('⚠️  No test user found, creating one...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@marketsage.com',
          name: 'Test User',
          role: 'ADMIN'
        }
      });
      console.log('✅ Test user created:', testUser.id);
    }
    
    // Test creating an SMS campaign
    console.log('📤 Testing SMS Campaign Creation...');
    
    const testCampaign = await prisma.sMSCampaign.create({
      data: {
        name: 'Test SMS Campaign - ' + new Date().toISOString(),
        content: 'Hello {{firstName}}, this is a test SMS from MarketSage! 📱',
        from: '+19282555219',
        status: 'DRAFT',
        createdById: testUser.id
      }
    });
    
    console.log('✅ Test SMS campaign created successfully!');
    console.log('Campaign ID:', testCampaign.id);
    console.log('Campaign Name:', testCampaign.name);
    console.log('Status:', testCampaign.status);
    
    // Test campaign update
    const updatedCampaign = await prisma.sMSCampaign.update({
      where: { id: testCampaign.id },
      data: { status: 'SCHEDULED' }
    });
    
    console.log('✅ Campaign updated to SCHEDULED');
    
    // Clean up test campaign
    await prisma.sMSCampaign.delete({
      where: { id: testCampaign.id }
    });
    
    console.log('🧹 Test campaign cleaned up');
    
    // Test SMS templates
    console.log('\n📝 Testing SMS Templates...');
    
    const templates = await prisma.sMSTemplate.findMany({
      take: 3
    });
    
    console.log('Available SMS templates:', templates.length);
    
    if (templates.length > 0) {
      console.log('\n📋 Recent SMS Templates:');
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Content: ${template.content.substring(0, 50)}...`);
        console.log(`   Created: ${template.createdAt.toISOString()}`);
        console.log('');
      });
    }
    
    console.log('✅ SMS Campaign functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing SMS campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSMSCampaigns();