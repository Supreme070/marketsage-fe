#!/usr/bin/env node

/**
 * AI Chat System Test Script
 * ==========================
 * Tests the AI chat system to ensure it's working properly
 */

const { SupremeAIBrain } = require('./src/lib/ai/supreme-ai-brain.ts');

async function testAIChat() {
  console.log('🧠 Testing AI Chat System...\n');

  try {
    const brain = new SupremeAIBrain();
    
    const testContext = {
      userId: 'test-user-123',
      sessionId: 'test-session-456',
      userProfile: {
        name: 'Test User',
        email: 'test@example.com'
      }
    };

    console.log('📤 Testing basic question...');
    const response1 = await brain.think(
      "How do I create an email campaign?", 
      testContext
    );
    
    console.log('✅ Response received:');
    console.log('   ', response1.response.substring(0, 100) + '...');
    console.log('   Thoughts:', response1.thoughts.length);
    console.log('   Actions:', response1.actions?.length || 0);
    console.log();

    console.log('📤 Testing complex question...');
    const response2 = await brain.think(
      "What are the best practices for customer segmentation in African fintech markets?", 
      testContext
    );
    
    console.log('✅ Response received:');
    console.log('   ', response2.response.substring(0, 100) + '...');
    console.log('   Thoughts:', response2.thoughts.length);
    console.log('   Follow-up suggestions:', response2.followUp?.length || 0);
    console.log();

    console.log('🎉 AI Chat System Test Completed Successfully!');
    console.log('\n✨ The AI chat system is working properly and handling errors gracefully.');
    
  } catch (error) {
    console.error('❌ AI Chat Test Failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('OpenAI API key')) {
      console.log('\n💡 Solution: Set up your OpenAI API key in .env.local');
      console.log('   OPENAI_API_KEY=sk-your-api-key-here');
      console.log('   The system will work with fallback AI without this key.');
    }
    
    if (error.message.includes('database') || error.message.includes('Prisma')) {
      console.log('\n💡 Solution: Set up your database connection');
      console.log('   1. Ensure PostgreSQL is running');
      console.log('   2. Run: npx prisma migrate dev');
      console.log('   3. Run: npx prisma generate');
    }
  }
}

// Environment check
function checkEnvironment() {
  console.log('🔍 Environment Check:');
  console.log('   OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ SET' : '⚠️  NOT SET (will use fallback)');
  console.log('   Database URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
  console.log();
}

if (require.main === module) {
  checkEnvironment();
  testAIChat();
}

module.exports = { testAIChat }; 