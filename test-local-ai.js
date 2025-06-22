#!/usr/bin/env node

const axios = require('axios');

console.log('🧪 Testing MarketSage AI Setup...\n');

async function testLocalAI() {
  try {
    console.log('1️⃣ Testing LocalAI Health...');
    const healthResponse = await axios.get('http://localhost:8080/readyz', { timeout: 5000 });
    console.log('✅ LocalAI is healthy:', healthResponse.status);
  } catch (error) {
    console.log('❌ LocalAI health check failed:', error.message);
    return false;
  }

  try {
    console.log('\n2️⃣ Testing LocalAI Models...');
    const modelsResponse = await axios.get('http://localhost:8080/v1/models', { timeout: 5000 });
    console.log('✅ Available models:', modelsResponse.data.data?.length || 0);
    if (modelsResponse.data.data) {
      modelsResponse.data.data.forEach(model => {
        console.log(`   - ${model.id}`);
      });
    }
  } catch (error) {
    console.log('❌ LocalAI models check failed:', error.message);
  }

  try {
    console.log('\n3️⃣ Testing LocalAI Chat Completion...');
    const chatResponse = await axios.post('http://localhost:8080/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello! Are you working?' }],
      max_tokens: 50,
      temperature: 0.7
    }, { timeout: 10000 });
    
    console.log('✅ LocalAI chat response:', chatResponse.data.choices?.[0]?.message?.content || 'No response content');
  } catch (error) {
    console.log('❌ LocalAI chat test failed:', error.message);
  }

  return true;
}

async function testMarketSageAI() {
  try {
    console.log('\n4️⃣ Testing MarketSage Supreme-AI...');
    const supremeResponse = await axios.post('http://localhost:3030/api/ai/supreme-v3', {
      taskType: 'question',
      data: { question: 'Test AI functionality', context: 'system-test' },
      options: { priority: 'normal', timeout: 10000 }
    }, { timeout: 15000 });
    
    console.log('✅ Supreme-AI response received:', supremeResponse.data.success);
    console.log('   Confidence:', supremeResponse.data.confidence);
    console.log('   Processing time:', supremeResponse.data.processingTime + 'ms');
  } catch (error) {
    console.log('❌ Supreme-AI test failed:', error.message);
  }

  try {
    console.log('\n5️⃣ Testing AI Task Automation...');
    const taskResponse = await axios.post('http://localhost:3030/api/ai/tasks/suggest', {
      customerId: '574c1069-9130-4fdc-9e1c-a02994e4d111',
      analysisType: 'behavioral',
      options: { generateTasks: true, maxTasks: 3 }
    }, { timeout: 15000 });
    
    console.log('✅ Task automation response:', taskResponse.data.success);
    console.log('   Generated tasks:', taskResponse.data.tasks?.length || 0);
  } catch (error) {
    console.log('❌ Task automation test failed:', error.message);
  }

  try {
    console.log('\n6️⃣ Testing AI Workflow Enhancement...');
    const workflowResponse = await axios.post('http://localhost:3030/api/ai/workflows/enhance', {
      action: 'generate',
      workflowType: 'retention',
      customerSegment: 'high-value',
      objective: 'improve-engagement'
    }, { timeout: 15000 });
    
    console.log('✅ Workflow enhancement response:', workflowResponse.data.success);
    console.log('   Workflow generated:', !!workflowResponse.data.workflow);
  } catch (error) {
    console.log('❌ Workflow enhancement test failed:', error.message);
  }
}

async function main() {
  const localAIWorking = await testLocalAI();
  
  if (localAIWorking) {
    await testMarketSageAI();
  }
  
  console.log('\n🏁 AI Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   - If LocalAI is working: ✅ All AI features ready');
  console.log('   - If LocalAI failed: Add OPENAI_API_KEY to .env file');
  console.log('   - MarketSage AI works with both LocalAI and OpenAI fallback');
}

main().catch(console.error); 