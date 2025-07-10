#!/usr/bin/env ts-node

const { PrismaClient } = require('@prisma/client');
const { leadPulseAttributionService } = require('../src/lib/leadpulse/attribution-service');

const prisma = new PrismaClient();

async function testAttribution() {
  console.log('📊 Testing LeadPulse Attribution System...\n');

  try {
    // 1. Create a test attribution configuration
    console.log('1. Creating test attribution configuration...');
    const configId = await leadPulseAttributionService.createAttributionConfig({
      name: 'Simple Test Config',
      description: 'Test configuration for attribution testing',
      viewThroughWindow: 1,
      clickThroughWindow: 30,
      attributionModel: 'LINEAR',
      conversionEvents: ['form_submit', 'download'],
      conversionValue: { 'form_submit': 25, 'download': 10 },
      channels: {
        weights: { 'email': 1.0, 'social': 0.8, 'search': 1.2 },
        aliases: {},
        hierarchies: {}
      },
      touchpointTypes: ['PAGEVIEW', 'CLICK', 'FORM_SUBMIT'],
      isActive: true,
      isDefault: false,
      crossDevice: false,
      crossDomain: false,
      deduplicationWindow: 24,
      duplicateHandling: 'LAST_TOUCH'
    }, 'test-user');
    
    console.log(`✅ Configuration created with ID: ${configId}`);

    // 2. Create a test visitor
    console.log('\n2. Creating test visitor...');
    const testVisitorId = 'test-visitor-simple-' + Date.now();
    await prisma.leadPulseVisitor.create({
      data: {
        id: testVisitorId,
        fingerprint: 'test-fingerprint-' + Date.now(),
        userAgent: 'Test Agent',
        country: 'Nigeria',
        city: 'Lagos',
        isActive: true,
        engagementScore: 0
      }
    });
    console.log(`✅ Visitor created with ID: ${testVisitorId}`);

    // 3. Create test touchpoints
    console.log('\n3. Creating test touchpoints...');
    const touchpoint1 = await prisma.leadPulseTouchpoint.create({
      data: {
        visitorId: testVisitorId,
        type: 'PAGEVIEW',
        url: '/home',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: JSON.stringify({ utm_source: 'email', utm_medium: 'email' })
      }
    });

    const touchpoint2 = await prisma.leadPulseTouchpoint.create({
      data: {
        visitorId: testVisitorId,
        type: 'CLICK',
        url: '/product',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        metadata: JSON.stringify({ utm_source: 'social', utm_medium: 'social' })
      }
    });

    console.log(`✅ Created ${2} touchpoints`);

    // 4. Test attribution calculation
    console.log('\n4. Testing attribution calculation...');
    const conversion = {
      conversionId: 'conv-test-' + Date.now(),
      conversionType: 'form_submit',
      conversionValue: 25,
      conversionTime: new Date(),
      visitorId: testVisitorId
    };

    const attributionResult = await leadPulseAttributionService.calculateAttribution(
      conversion,
      configId
    );

    console.log('✅ Attribution calculated successfully!');
    console.log('   Attribution Result:');
    console.log(`   - Model: ${attributionResult.attributionModel}`);
    console.log(`   - Touchpoints: ${attributionResult.touchpointsCount}`);
    console.log(`   - Total Credit: ${attributionResult.totalCredit}`);
    console.log(`   - Journey Duration: ${attributionResult.journeyDuration} minutes`);
    console.log(`   - Channel Breakdown:`, attributionResult.channelBreakdown);

    // 5. Test different attribution models
    console.log('\n5. Testing different attribution models...');
    
    const models = ['FIRST_TOUCH', 'LAST_TOUCH', 'TIME_DECAY'];
    for (const model of models) {
      const modelConfigId = await leadPulseAttributionService.createAttributionConfig({
        name: `${model} Test Config`,
        viewThroughWindow: 1,
        clickThroughWindow: 30,
        attributionModel: model as any,
        conversionEvents: ['form_submit'],
        conversionValue: { 'form_submit': 25 },
        channels: { weights: {}, aliases: {}, hierarchies: {} },
        touchpointTypes: ['PAGEVIEW', 'CLICK'],
        isActive: true,
        isDefault: false,
        crossDevice: false,
        crossDomain: false,
        deduplicationWindow: 24,
        duplicateHandling: 'LAST_TOUCH'
      }, 'test-user');

      const modelConversion = {
        conversionId: `conv-${model.toLowerCase()}-${Date.now()}`,
        conversionType: 'form_submit',
        conversionValue: 25,
        conversionTime: new Date(),
        visitorId: testVisitorId
      };

      const modelResult = await leadPulseAttributionService.calculateAttribution(
        modelConversion,
        modelConfigId
      );

      console.log(`   ${model}: ${modelResult.touchpointsCount} touchpoints, Total: ${modelResult.totalCredit}`);
    }

    // 6. Cleanup
    console.log('\n6. Cleaning up test data...');
    
    // Delete attribution touchpoints
    await prisma.leadPulseAttributionTouchpoint.deleteMany({
      where: {
        attribution: {
          visitorId: testVisitorId
        }
      }
    });

    // Delete attributions
    await prisma.leadPulseAttribution.deleteMany({
      where: { visitorId: testVisitorId }
    });

    // Delete touchpoints
    await prisma.leadPulseTouchpoint.deleteMany({
      where: { visitorId: testVisitorId }
    });

    // Delete test configs
    await prisma.leadPulseAttributionConfig.deleteMany({
      where: {
        name: {
          contains: 'Test Config'
        }
      }
    });

    // Delete visitor
    await prisma.leadPulseVisitor.deleteMany({
      where: { id: testVisitorId }
    });

    console.log('✅ Cleanup complete');

    console.log('\n🎉 All tests passed! LeadPulse Attribution System is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testAttribution().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}