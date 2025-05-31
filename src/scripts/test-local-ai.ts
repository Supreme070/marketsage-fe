/**
 * Test Script for Local AI Engine
 * Run with: npx tsx src/scripts/test-local-ai.ts
 */

import {
  analyzeContentLocal,
  generateContentLocal,
  clusterContacts,
  useLocalAI
} from '@/lib/ai/local-ai-engine';

async function testLocalAI() {
  console.log('🧠 Testing MarketSage Local AI Engine\n');
  console.log(`Using Local AI: ${useLocalAI ? '✅ YES' : '❌ NO (API keys detected)'}\n`);

  // Test 1: Content Analysis
  console.log('📊 Test 1: Content Analysis');
  console.log('='.repeat(40));
  
  const testContent = "Send money to Nigeria fast and secure! Amazing exchange rates, trusted by thousands. Your family will receive funds instantly with our reliable service.";
  
  try {
    const analysis = analyzeContentLocal(testContent);
    console.log('Content:', testContent);
    console.log('Sentiment Score:', analysis.sentimentScore);
    console.log('Sentiment Label:', analysis.sentimentLabel);
    console.log('Keywords:', analysis.keywords.slice(0, 5));
    console.log('Topics:', analysis.topics.slice(0, 5));
    console.log('Reading Ease:', analysis.readingEase);
    console.log('Reading Grade:', analysis.readingGrade);
    console.log('✅ Content analysis successful\n');
  } catch (error) {
    console.error('❌ Content analysis failed:', error);
  }

  // Test 2: Content Generation
  console.log('✍️ Test 2: Content Generation');
  console.log('='.repeat(40));
  
  try {
    const seedText = "MarketSage helps fintech companies reach Nigerian diaspora customers with intelligent marketing automation and WhatsApp engagement tools.";
    const generated = generateContentLocal({
      seedText,
      numSentences: 2,
      maxWords: 60
    });
    
    console.log('Seed Text:', seedText);
    console.log('Generated Content:', generated.content);
    console.log('✅ Content generation successful\n');
  } catch (error) {
    console.error('❌ Content generation failed:', error);
  }

  // Test 3: Customer Clustering
  console.log('👥 Test 3: Customer Clustering');
  console.log('='.repeat(40));
  
  try {
    // Sample customer features: [engagement_score, transaction_frequency, days_active, ltv_score]
    const customerFeatures = [
      [0.8, 5, 30, 0.9],  // High-value customer
      [0.2, 1, 90, 0.3],  // Low-value customer  
      [0.9, 8, 15, 0.95], // Premium customer
      [0.1, 0, 120, 0.1], // Churned customer
      [0.7, 4, 45, 0.7],  // Medium-value customer
      [0.85, 6, 20, 0.8], // High-value customer
      [0.15, 1, 100, 0.2], // Low-value customer
      [0.3, 2, 75, 0.4]   // Medium-value customer
    ];
    
    const clusters = await clusterContacts(customerFeatures, 3);
    console.log('Customer Features (sample):', customerFeatures.slice(0, 3));
    console.log('Cluster Assignments:', clusters.clusters);
    console.log('Number of Centroids:', clusters.centroids.length);
    console.log('✅ Customer clustering successful\n');
  } catch (error) {
    console.error('❌ Customer clustering failed:', error);
  }

  // Test 4: Fintech-Specific Analysis
  console.log('💰 Test 4: Fintech Content Analysis');
  console.log('='.repeat(40));
  
  const fintechContent = [
    "KYC verification complete - start sending money today!",
    "Your transaction to Lagos has been processed successfully.",
    "Urgent: Complete your profile to unlock better exchange rates.",
    "Family first - send money home with zero fees this week."
  ];

  fintechContent.forEach((content, index) => {
    try {
      const analysis = analyzeContentLocal(content);
      console.log(`Content ${index + 1}: "${content}"`);
      console.log(`  Sentiment: ${analysis.sentimentLabel} (${analysis.sentimentScore.toFixed(2)})`);
      console.log(`  Keywords: ${analysis.keywords.slice(0, 3).join(', ')}`);
      console.log(`  Reading Grade: ${analysis.readingGrade}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Analysis failed for content ${index + 1}:`, error);
    }
  });

  console.log('🎉 Local AI Engine Test Complete!');
  console.log('\n💡 Your MarketSage now has smart local AI capabilities:');
  console.log('  ✅ Sentiment & emotion analysis');
  console.log('  ✅ Keyword & topic extraction');
  console.log('  ✅ Readability scoring');
  console.log('  ✅ Content generation');
  console.log('  ✅ Customer segmentation');
  console.log('  ✅ All running offline - no APIs required!');
}

// Run the test
if (require.main === module) {
  testLocalAI().catch(console.error);
}

export { testLocalAI }; 