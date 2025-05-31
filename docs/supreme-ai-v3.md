# Supreme-AI v3 Documentation
*The Complete Guide to MarketSage's Advanced AI Orchestrator*

---

## 🚀 **Overview**

Supreme-AI v3 is a meta-orchestrator that intelligently routes AI tasks to specialized engines, providing **ChatGPT-level intelligence** through:

- **🧠 Long-term Memory** - Contextual conversations and insights
- **📚 RAG Knowledge Base** - Grounded, factual responses  
- **🤖 AutoML Optimization** - Self-improving predictive models
- **📊 Advanced Analytics** - Content, customer, and market intelligence
- **⚡ Single API** - One endpoint for all AI capabilities

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Supreme-AI v3 (Meta Orchestrator)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Memory    │ │     RAG     │ │   AutoML    │
│   Engine    │ │   Engine    │ │   Engine    │
└─────────────┘ └─────────────┘ └─────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Supreme-AI v2   │
            │ (Analytics)     │
            └─────────────────┘
```

---

## 🎯 **Quick Start**

### **1. Basic Usage (TypeScript)**

```typescript
import { SupremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';

// Ask a question (uses Memory + RAG + Context)
const result = await SupremeAIv3.process({
  type: 'question',
  userId: 'user123',
  question: 'What are the latest fintech trends?'
});

console.log(result.data.answer);
```

### **2. React Hook Usage**

```typescript
import { useSupremeChat } from '@/hooks/useSupremeAI';

function ChatComponent() {
  const { ask, loading, messages, lastAnswer } = useSupremeChat('user123');
  
  const handleSubmit = async (question: string) => {
    await ask(question);
  };

  return (
    <div>
      {loading && <div>Supreme-AI is thinking...</div>}
      <div>{lastAnswer}</div>
    </div>
  );
}
```

### **3. API Route Usage**

```typescript
// Frontend
const response = await fetch('/api/ai/supreme-v3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'content',
    userId: 'user123',
    content: 'Amazing fintech innovation ahead!'
  })
});

const result = await response.json();
console.log(`Supreme Score: ${result.supremeScore}/100`);
```

---

## 📋 **API Reference**

### **Core Types**

```typescript
type SupremeAIv3Task = 
  | { type: 'question'; userId: string; question: string }
  | { type: 'predict'; userId: string; features: number[][]; targets: number[] }
  | { type: 'content'; userId: string; content: string }
  | { type: 'customer'; userId: string; customers: any[] }
  | { type: 'market'; userId: string; marketData: any }
  | { type: 'adaptive'; userId: string; data: any; context: string };

interface SupremeAIv3Response {
  success: boolean;
  timestamp: Date;
  taskType: string;
  data: any;
  confidence: number;
  supremeScore?: number;
  insights?: string[];
  recommendations?: string[];
  debug?: Record<string, any>;
}
```

### **Task Types**

#### **📝 Question (RAG + Memory)**
**Purpose:** Contextual Q&A with long-term memory and knowledge grounding

```typescript
await SupremeAIv3.process({
  type: 'question',
  userId: 'user123',
  question: 'How can I improve customer retention?'
});

// Returns:
{
  data: {
    answer: "Based on your customer data...",
    sources: [{ id: "doc1", text: "retention strategies..." }],
    memoryContext: "Previous discussions about churn..."
  },
  confidence: 88
}
```

#### **🔮 Predict (AutoML)**
**Purpose:** Optimize ML models for predictions

```typescript
await SupremeAIv3.process({
  type: 'predict',
  userId: 'user123',
  features: [[1,2,3], [4,5,6], [7,8,9]],
  targets: [0.2, 0.7, 0.9]
});

// Returns:
{
  data: {
    bestModel: { algorithm: 'ensemble', performance: 0.92 },
    allModels: [...],
    improvementPercent: 15
  },
  insights: ["Evaluated 12 model configurations", "Best algorithm: ensemble"]
}
```

#### **📊 Content (NLP Analysis)**
**Purpose:** Deep content analysis with Supreme scoring

```typescript
await SupremeAIv3.process({
  type: 'content',
  userId: 'user123',
  content: 'Revolutionary fintech platform launching soon!'
});

// Returns:
{
  data: {
    sentiment: 0.8,
    readability: 85,
    engagement: 76,
    keywords: ['fintech', 'platform', 'revolutionary']
  },
  supremeScore: 88
}
```

#### **👥 Customer (Intelligence)**
**Purpose:** Advanced customer segmentation and behavior analysis

```typescript
await SupremeAIv3.process({
  type: 'customer',
  userId: 'user123',
  customers: [
    { id: 'c1', transactionFrequency: 10, averageValue: 500 },
    { id: 'c2', transactionFrequency: 2, averageValue: 100 }
  ]
});

// Returns:
{
  data: {
    segments: [
      { customerId: 'c1', segment: 'VIP Champions', churnProbability: 15 },
      { customerId: 'c2', segment: 'At Risk', churnProbability: 85 }
    ],
    averageChurnRisk: 50
  }
}
```

#### **📈 Market (Trends)**
**Purpose:** Market intelligence and trend analysis

```typescript
await SupremeAIv3.process({
  type: 'market',
  userId: 'user123',
  marketData: {
    competitorActivity: 0.7,
    economicIndicators: 0.8,
    consumerSentiment: 0.6
  }
});

// Returns:
{
  data: {
    trendScore: 75,
    opportunityScore: 68,
    riskScore: 35,
    marketPhase: 'Growth'
  }
}
```

#### **🎯 Adaptive (Self-Learning)**
**Purpose:** Context-aware adaptive analysis

```typescript
await SupremeAIv3.process({
  type: 'adaptive',
  userId: 'user123',
  data: { revenue: [100, 150, 200] },
  context: 'revenue'
});

// Returns:
{
  data: {
    adaptiveLearning: true,
    modelVersion: '2.0',
    predictions: [...]
  }
}
```

---

## 🎣 **React Hooks Guide**

### **Main Hook: `useSupremeAI`**

```typescript
const {
  // State
  loading,
  result,
  error,
  history,
  
  // Actions
  ask,
  analyzeContent,
  predict,
  analyzeCustomers,
  analyzeMarket,
  adaptive,
  clear,
  retry
} = useSupremeAI({
  userId: 'user123',
  cacheResults: true,
  maxHistory: 10,
  autoRetry: true,
  retryDelay: 1000
});
```

### **Specialized Hooks**

#### **💬 Chat Hook**
```typescript
const { ask, loading, messages, lastAnswer, clear } = useSupremeChat('user123');

// messages format:
[
  {
    question: "What's our churn rate?",
    answer: "Based on analysis, your churn rate is 3.2%...",
    confidence: 89,
    timestamp: Date,
    sources: [...]
  }
]
```

#### **📝 Content Analysis Hook**
```typescript
const { analyze, loading, lastAnalysis, supremeScore } = useContentAnalysis('user123');

const analysis = await analyze('Your content here');
console.log(`Supreme Score: ${supremeScore}/100`);
```

#### **👥 Customer Intelligence Hook**
```typescript
const {
  analyze,
  segments,
  distribution,
  averageChurnRisk,
  totalLifetimeValue
} = useCustomerIntelligence('user123');
```

#### **🔮 Predictive Analytics Hook**
```typescript
const {
  predict,
  bestModel,
  allModels,
  improvementPercent,
  confidence
} = usePredictiveAnalytics('user123');
```

---

## 🛣️ **API Routes**

### **Endpoint: `/api/ai/supreme-v3`**

#### **Request Format**
```http
POST /api/ai/supreme-v3
Content-Type: application/json

{
  "type": "question",
  "userId": "user123", 
  "question": "What are the best fintech strategies?"
}
```

#### **Response Format**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "taskType": "question",
  "data": {
    "answer": "Based on market analysis...",
    "sources": [...],
    "memoryContext": "..."
  },
  "confidence": 88,
  "meta": {
    "processingTime": 1200,
    "version": "3.0",
    "requestId": "req_123456"
  }
}
```

#### **Rate Limiting**
- **20 requests per minute** per user
- HTTP 429 when exceeded
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### **Error Handling**
```json
{
  "success": false,
  "error": "Question is required for question tasks",
  "meta": {
    "processingTime": 50,
    "version": "3.0"
  }
}
```

---

## 🧪 **Testing**

### **Running Tests**
```bash
npm test supreme-ai-v3
npm test -- --coverage
```

### **Example Test**
```typescript
describe('Supreme-AI v3', () => {
  it('should process content analysis', async () => {
    const result = await SupremeAIv3.process({
      type: 'content',
      userId: 'test-user',
      content: 'Amazing fintech innovation!'
    });
    
    expect(result.success).toBe(true);
    expect(result.supremeScore).toBeGreaterThan(0);
  });
});
```

---

## 🚀 **Advanced Features**

### **Memory Management**

Supreme-AI v3 automatically manages long-term memory:

```typescript
// Memories are stored automatically for:
// - Important Q&A interactions (importance: 0.5)
// - High-scoring content analysis (importance: score/100)
// - Customer conversion events (importance: 0.9)

// Manual memory storage:
await supremeMemory.storeMemory({
  type: 'insight',
  userId: 'user123',
  content: 'Key insight about customer behavior',
  importance: 0.8,
  tags: ['customer', 'insight']
});
```

### **Caching & Performance**

```typescript
// Automatic caching (5 minutes TTL)
const { cacheHitRate } = useSupremeAIMetrics();

// Cache busting
const result = await fetch('/api/ai/supreme-v3', {
  headers: { 'Cache-Control': 'no-cache' }
});
```

### **Error Recovery**

```typescript
const { retry, error } = useSupremeAI({
  autoRetry: true,
  retryDelay: 1000
});

if (error) {
  console.log('Error:', error);
  await retry(); // Retry last failed request
}
```

---

## 📊 **Performance Monitoring**

### **Metrics Hook**
```typescript
const { 
  totalRequests,
  averageResponseTime,
  successRate,
  cacheHitRate 
} = useSupremeAIMetrics();
```

### **Logging & Analytics**
All requests are automatically logged with:
- Processing time
- Confidence scores
- Error details
- User patterns

---

## 🔧 **Configuration**

### **Environment Variables**
```env
# Memory Configuration
SUPREME_MEMORY_TTL=7d
SUPREME_MEMORY_MAX_SIZE=10000

# Cache Configuration  
SUPREME_CACHE_TTL=5m
SUPREME_CACHE_MAX_ENTRIES=1000

# Rate Limiting
SUPREME_RATE_LIMIT=20
SUPREME_RATE_WINDOW=60000

# Logging
LOG_LEVEL=info
```

### **Initialization**
```typescript
// Optional: Initialize memory engine early
import { supremeMemory } from '@/lib/ai/memory-engine';
await supremeMemory.initialize();
```

---

## 🔄 **Migration Guide**

### **From Basic AI to Supreme-AI v3**

**Before (Basic):**
```typescript
import { analyzeContent } from '@/lib/ai/basic-ai';
const result = await analyzeContent(content);
```

**After (Supreme-AI v3):**
```typescript
import { SupremeAIv3 } from '@/lib/ai/supreme-ai-v3-engine';
const result = await SupremeAIv3.process({
  type: 'content',
  userId: 'user123',
  content
});
// Now includes memory, context, and advanced analytics!
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Memory Initialization Failed**
```typescript
// Memory fails gracefully - AI still works
if (error.includes('Memory failed')) {
  // System continues without memory context
  console.log('Operating in stateless mode');
}
```

#### **Rate Limit Exceeded** 
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter}ms`);
}
```

#### **Cache Miss Performance**
```typescript
// Warm up cache for frequently used content
await SupremeAIv3.process({
  type: 'content',
  userId: 'system',
  content: 'Common content patterns...'
});
```

---

## 🛡️ **Security**

### **Input Validation**
- All inputs sanitized and validated
- Maximum content length: 10,000 characters
- Maximum question length: 1,000 characters

### **Rate Limiting**
- Per-user rate limiting prevents abuse
- Graceful degradation under load

### **Error Handling**
- Sensitive information never exposed
- Detailed logging for debugging
- Fail-safe fallbacks

---

## 🎯 **Best Practices**

### **Performance**
1. **Use caching** - Enable for repeated queries
2. **Batch requests** - Group similar tasks  
3. **Monitor metrics** - Track performance patterns

### **Memory Management**
1. **Set importance** - Higher for critical insights
2. **Use tags** - For easy retrieval
3. **Regular cleanup** - Automated consolidation

### **Error Handling**
1. **Enable auto-retry** - For transient failures
2. **Implement fallbacks** - Basic responses when AI fails
3. **Log comprehensively** - For debugging and improvement

---

## 📈 **Roadmap**

### **Current Version: 3.0**
- ✅ Meta-orchestrator architecture
- ✅ Long-term memory & context
- ✅ RAG knowledge retrieval  
- ✅ AutoML optimization
- ✅ React hooks integration
- ✅ Comprehensive testing

### **Planned Features**
- 🔄 **GPU Optimization** - Hardware acceleration
- 🎯 **Multi-modal AI** - Vision and voice capabilities  
- 🌐 **Real-time Streaming** - Live response streaming
- 🔗 **External Integrations** - OpenAI/Anthropic hybrid
- 📱 **Mobile SDK** - React Native support

---

## 🤝 **Contributing**

### **Development Setup**
```bash
git clone <repo>
cd marketsage
npm install
npm run dev
```

### **Testing**
```bash
npm test
npm run test:watch
npm run test:coverage
```

### **Code Style**
- TypeScript strict mode
- ESLint + Prettier
- Comprehensive JSDoc comments

---

## 📞 **Support**

- **📧 Issues**: GitHub Issues
- **💬 Discussions**: GitHub Discussions  
- **📖 Wiki**: Internal documentation
- **🔧 API Status**: `/api/ai/supreme-v3` (GET)

---

*Supreme-AI v3 - Bringing ChatGPT-level intelligence to MarketSage* 🚀 