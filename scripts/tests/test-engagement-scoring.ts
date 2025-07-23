/**
 * Test script for the enhanced engagement scoring engine
 */

import { engagementScoringEngine } from '../src/lib/leadpulse/engagement-scoring-engine';
import prisma from '../src/lib/db/prisma';
import { randomUUID } from 'crypto';

async function createTestVisitor() {
  const visitorId = randomUUID();
  
  // Create test visitor
  const visitor = await prisma.anonymousVisitor.create({
    data: {
      id: visitorId,
      fingerprint: `test_fp_${visitorId}`,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalVisits: 1,
      visitCount: 1,
      isActive: true,
      engagementScore: 0,
      score: 0,
      city: 'Lagos',
      country: 'Nigeria',
      region: 'Lagos State',
    }
  });
  
  // Create test touchpoints
  const touchpoints = [
    // First session - browsing
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/',
      type: 'PAGEVIEW',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      duration: 120,
      value: 1,
      score: 1,
      metadata: { pageTitle: 'Home', isReturn: false }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/features',
      type: 'PAGEVIEW',
      timestamp: new Date(Date.now() - 28 * 60 * 1000),
      duration: 180,
      value: 1,
      score: 1,
      metadata: { pageTitle: 'Features', scrollDepth: 75 }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/pricing',
      type: 'PAGEVIEW',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      duration: 240,
      value: 1,
      score: 1,
      metadata: { pageTitle: 'Pricing', scrollDepth: 100 }
    },
    
    // Second session - high intent
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/pricing',
      type: 'PAGEVIEW',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      duration: 60,
      value: 1,
      score: 1,
      metadata: { pageTitle: 'Pricing', isReturn: true }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/demo',
      type: 'CLICK',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      duration: 0,
      value: 1,
      score: 1,
      metadata: { isCTA: true, buttonText: 'Request Demo' }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/demo',
      type: 'FORM_VIEW',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      duration: 30,
      value: 1,
      score: 1,
      metadata: { formId: 'demo-form', formName: 'Demo Request' }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/demo',
      type: 'FORM_START',
      timestamp: new Date(Date.now() - 90 * 1000),
      duration: 45,
      value: 1,
      score: 1,
      metadata: { formId: 'demo-form', fieldsCompleted: 3 }
    },
    {
      id: randomUUID(),
      anonymousVisitorId: visitorId,
      url: '/demo',
      type: 'FORM_SUBMIT',
      timestamp: new Date(Date.now() - 30 * 1000),
      duration: 60,
      value: 1,
      score: 1,
      metadata: { formId: 'demo-form', conversionValue: 500 }
    }
  ];
  
  await prisma.leadPulseTouchpoint.createMany({
    data: touchpoints
  });
  
  return visitorId;
}

async function testEngagementScoring() {
  console.log('🧪 Testing Enhanced Engagement Scoring Engine\n');
  
  try {
    // Create test visitor with journey
    console.log('📝 Creating test visitor with touchpoints...');
    const visitorId = await createTestVisitor();
    console.log(`✅ Created visitor: ${visitorId}\n`);
    
    // Calculate engagement score
    console.log('🎯 Calculating engagement score...');
    const score = await engagementScoringEngine.calculateScore({
      visitorId,
      includeAnonymous: true,
      timeRange: 30,
      realTimeBoost: true
    });
    
    console.log('\n📊 Engagement Score Results:');
    console.log('─'.repeat(50));
    console.log(`Overall Score: ${score.score}/100 (${score.category})`);
    console.log(`Confidence: ${(score.confidence * 100).toFixed(0)}%`);
    
    console.log('\n📈 Score Breakdown:');
    console.log(`  • Behavioral: ${score.breakdown.behavioral}`);
    console.log(`  • Recency: ${score.breakdown.recency}`);
    console.log(`  • Frequency: ${score.breakdown.frequency}`);
    console.log(`  • Depth: ${score.breakdown.depth}`);
    console.log(`  • Velocity: ${score.breakdown.velocity}`);
    
    console.log('\n📋 Engagement Factors:');
    console.log(`  • Total Actions: ${score.factors.totalActions}`);
    console.log(`  • Quality Sessions: ${score.factors.qualitySessions}`);
    console.log(`  • Average Session Duration: ${Math.round(score.factors.averageSessionDuration)}s`);
    console.log(`  • Page Depth: ${score.factors.pageDepth} unique pages`);
    console.log(`  • Form Interactions: ${score.factors.formInteractions}`);
    console.log(`  • Content Engagement: ${score.factors.contentEngagement}`);
    console.log(`  • Channels: ${score.factors.channelEngagement.join(', ')}`);
    
    console.log('\n🚨 Behavioral Signals:');
    console.log(`  • Buying Intent: ${score.signals.buyingIntent ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Research Mode: ${score.signals.researchMode ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Price Aware: ${score.signals.priceAware ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Multi-Session: ${score.signals.multiSession ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Returning: ${score.signals.returning ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Engaged: ${score.signals.engaged ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n💡 Recommendations:');
    score.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    
    // Test batch scoring
    console.log('\n\n🔄 Testing batch scoring...');
    const scores = await engagementScoringEngine.batchCalculateScores([visitorId]);
    console.log(`✅ Batch scoring completed for ${scores.size} visitors`);
    
    // Update visitor score in database
    console.log('\n💾 Updating visitor score in database...');
    await engagementScoringEngine.updateVisitorScore(visitorId);
    
    const updatedVisitor = await prisma.anonymousVisitor.findUnique({
      where: { id: visitorId }
    });
    console.log(`✅ Visitor score updated: ${updatedVisitor?.engagementScore}`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.leadPulseTouchpoint.deleteMany({
      where: { anonymousVisitorId: visitorId }
    });
    await prisma.anonymousVisitor.delete({
      where: { id: visitorId }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n✨ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEngagementScoring()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });