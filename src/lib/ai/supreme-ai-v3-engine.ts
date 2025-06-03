/**
 * Supreme-AI Engine v3.0 (Meta Orchestrator)
 * =========================================
 * One-stop façade that intelligently routes requests to the appropriate
 * specialist sub-engines (v2 core analytics, RAG QA, AutoML, Memory).
 *
 * Goals
 * 1️⃣  Single entry-point – simplifies the rest of the codebase.
 * 2️⃣  Context awareness – uses long-term memory before answering.
 * 3️⃣  Knowledge grounding – RAG for factual Q&A.
 * 4️⃣  Continuous learning – AutoML for predictive tasks.
 * 5️⃣  Extensibility – easy to plug in future vision / voice modules.
 */

import { SupremeAI } from '@/lib/ai/supreme-ai-engine';
import { supremeAutoML } from '@/lib/ai/automl-engine';
import { ragQuery } from '@/lib/ai/rag-engine';
import { supremeMemory } from '@/lib/ai/memory-engine';
import { getAIInstance } from '@/lib/ai/openai-integration';
import { logger } from '@/lib/logger';

// -----------------------------
// Request / Response Typings
// -----------------------------

export type SupremeAIv3Task =
  | { type: 'question'; userId: string; question: string }
  | { type: 'predict'; userId: string; features: number[][]; targets: number[] }
  | { type: 'content'; userId: string; content: string }
  | { type: 'customer'; userId: string; customers: any[] }
  | { type: 'market'; userId: string; marketData: any }
  | { type: 'adaptive'; userId: string; data: any; context: string };

export interface SupremeAIv3Response {
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

// -----------------------------
// Supreme-AI v3 Core
// -----------------------------

class SupremeAIV3Core {
  private async ensureMemoryReady() {
    // Initialize memory engine lazily (safe to call multiple times)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await supremeMemory.initialize().catch(() => {});
  }

  async process(task: SupremeAIv3Task): Promise<SupremeAIv3Response> {
    await this.ensureMemoryReady();

    switch (task.type) {
      case 'question':
        return this.handleQuestion(task);
      case 'predict':
        return this.handlePredict(task);
      case 'content':
        return this.handleContent(task);
      case 'customer':
        return this.handleCustomer(task);
      case 'market':
        return this.handleMarket(task);
      case 'adaptive':
        return this.handleAdaptive(task);
      default:
        throw new Error(`Unsupported task type ${(task as any).type}`);
    }
  }

  // 1. Contextual Question Answering
  private async handleQuestion(task: Extract<SupremeAIv3Task, { type: 'question' }>): Promise<SupremeAIv3Response> {
    try {
      const { userId, question } = task;

      // Fetch context from memory for conversation history
      const contextPack = await supremeMemory.getContextForResponse(userId, question);
      
      // Get AI instance (OpenAI if available, fallback otherwise)
      const aiInstance = getAIInstance();
      
      // Build conversation history from memory for context
      const conversationHistory = contextPack.relevantMemories
        ?.filter((m: any) => m.type === 'insight' && m.tags?.includes('qa'))
        ?.slice(-6) // Last 6 Q&As for context
        ?.flatMap((m: any) => {
          const content = m.content;
          const parts = content.split(' | A: ');
          if (parts.length === 2) {
            const questionPart = parts[0].replace('Q: ', '');
            const answerPart = parts[1];
            return [
              { role: 'user' as const, content: questionPart },
              { role: 'assistant' as const, content: answerPart }
            ];
          }
          return [];
        }) || [];

      // Add MarketSage platform context
      const marketSageContext = this.buildMarketSageContext(question);
      
      // Try RAG first for specific MarketSage documentation
      let ragContext = '';
      try {
        const ragResult = await ragQuery(question, 2);
        if (ragResult.confidence > 0.6) {
          ragContext = `\n\nRelevant MarketSage Documentation:\n${ragResult.contextDocs.map((doc: any) => doc.content || doc.title || 'No content').join('\n')}`;
        }
      } catch (error) {
        logger.warn('RAG query failed, proceeding without documentation context', error);
      }

      // Generate intelligent response using AI
      const fullContext = `${marketSageContext}${ragContext}${contextPack.contextSummary ? `\n\nUser History: ${contextPack.contextSummary}` : ''}`;
      
      const aiResponse = await aiInstance.generateResponse(
        question,
        fullContext,
        conversationHistory
      );

      // Store Q&A in memory for future context
      await supremeMemory.storeMemory({
        type: 'insight',
        userId,
        content: `Q: ${question} | A: ${aiResponse.answer}`,
        metadata: { 
          platform: 'marketsage',
          aiModel: process.env.OPENAI_API_KEY ? 'openai' : 'fallback',
          usage: aiResponse.usage 
        },
        importance: 0.8, // High importance for Q&A
        tags: ['qa', 'chat', 'marketsage-help']
      });

      return {
        success: true,
        timestamp: new Date(),
        taskType: 'question',
        data: {
          answer: aiResponse.answer,
          sources: ragContext ? ['MarketSage Documentation'] : [],
          memoryContext: contextPack.contextSummary,
          marketSageContext: marketSageContext,
          conversationHistory: conversationHistory.length
        },
        confidence: process.env.OPENAI_API_KEY ? 0.9 : 0.75, // Higher confidence with real AI
        debug: { 
          hasRAGContext: ragContext.length > 0,
          conversationLength: conversationHistory.length,
          aiModel: process.env.OPENAI_API_KEY ? 'openai' : 'fallback'
        }
      };
    } catch (error) {
      logger.error('Supreme-AI v3 question handler failed', error);
      
      // Fallback to basic helpful response
      return {
        success: true,
        timestamp: new Date(),
        taskType: 'question',
        data: {
          answer: "I'm experiencing some technical difficulties right now. Could you please try asking your question again, or visit our help documentation in the MarketSage dashboard?",
          sources: [],
          memoryContext: '',
          marketSageContext: ''
        },
        confidence: 0.3,
        debug: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Build MarketSage-specific context based on question
  private buildMarketSageContext(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    let baseContext = "You are Supreme-AI, an intelligent assistant for MarketSage - a comprehensive marketing automation platform designed for African fintech markets. You should be conversational, helpful, and provide specific actionable advice.";
    
    // Add relevant context based on question content
    if (lowerQuestion.includes('email') || lowerQuestion.includes('campaign')) {
      baseContext += " Focus on email marketing best practices for African markets, including timing optimization for WAT timezone, cultural considerations, mobile-first design, and fintech-specific messaging.";
    }
    
    if (lowerQuestion.includes('workflow') || lowerQuestion.includes('automation')) {
      baseContext += " Provide guidance on MarketSage's workflow automation features, including triggers, actions, conditions, and fintech-specific use cases like KYC reminders and transaction follow-ups.";
    }
    
    if (lowerQuestion.includes('customer') || lowerQuestion.includes('segment')) {
      baseContext += " Focus on customer intelligence, segmentation strategies for fintech users, churn prediction, and retention tactics specific to African markets.";
    }
    
    if (lowerQuestion.includes('analytics') || lowerQuestion.includes('performance') || lowerQuestion.includes('revenue')) {
      baseContext += " Provide insights on campaign performance, revenue attribution, conversion optimization, and key metrics for fintech businesses in African markets.";
    }
    
    return baseContext + " Be specific, actionable, and conversational. If you need more information to provide a better answer, ask clarifying questions.";
  }

  // 2. AutoML Prediction / Optimisation
  private async handlePredict(task: Extract<SupremeAIv3Task, { type: 'predict' }>): Promise<SupremeAIv3Response> {
    try {
      const { features, targets } = task;
      const result = await supremeAutoML.autoOptimize(features, targets);

      return {
        success: true,
        timestamp: new Date(),
        taskType: 'predict',
        data: result,
        confidence: result.bestModel.performance * 100,
        insights: [
          `Evaluated ${result.allModels.length} model configurations`,
          `Best algorithm: ${result.bestModel.algorithm}`
        ],
        recommendations: [
          result.improvementPercent > 5 ? 'Deploy new best model' : 'Existing model is sufficient',
          result.confidence > 80 ? 'High confidence – ready for production' : 'Consider more data or features'
        ]
      };
    } catch (error) {
      logger.error('Supreme-AI v3 predict handler failed', error);
      throw error;
    }
  }

  // 3. Content Intelligence (delegates to v2 engine)
  private async handleContent(task: Extract<SupremeAIv3Task, { type: 'content' }>): Promise<SupremeAIv3Response> {
    const { content, userId } = task;
    const analysis = await SupremeAI.analyzeContent(content);

    // Save memory (summary)
    await supremeMemory.storeMemory({
      type: 'insight',
      userId,
      content: `Content analysis summary: ${analysis.insights.join('; ')}`,
      metadata: { supremeScore: analysis.supremeScore },
      importance: analysis.supremeScore / 100,
      tags: ['content', 'analysis']
    });

    return {
      success: true,
      timestamp: new Date(),
      taskType: 'content',
      data: analysis.data,
      confidence: analysis.confidence,
      supremeScore: analysis.supremeScore,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }

  // 4. Customer Intelligence
  private async handleCustomer(task: Extract<SupremeAIv3Task, { type: 'customer' }>): Promise<SupremeAIv3Response> {
    const analysis = await SupremeAI.analyzeCustomerBehavior(task.customers);
    return {
      success: true,
      timestamp: new Date(),
      taskType: 'customer',
      data: analysis.data,
      confidence: analysis.confidence,
      supremeScore: analysis.supremeScore,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }

  // 5. Market Intelligence
  private async handleMarket(task: Extract<SupremeAIv3Task, { type: 'market' }>): Promise<SupremeAIv3Response> {
    const analysis = await SupremeAI.analyzeMarketTrends(task.marketData);
    return {
      success: true,
      timestamp: new Date(),
      taskType: 'market',
      data: analysis.data,
      confidence: analysis.confidence,
      supremeScore: analysis.supremeScore,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }

  // 6. Adaptive Analysis (delegated to v2 adaptive)
  private async handleAdaptive(task: Extract<SupremeAIv3Task, { type: 'adaptive' }>): Promise<SupremeAIv3Response> {
    const analysis = await SupremeAI.adaptiveAnalysis(task.data, task.context);
    return {
      success: true,
      timestamp: new Date(),
      taskType: 'adaptive',
      data: analysis.data,
      confidence: analysis.confidence,
      supremeScore: analysis.supremeScore,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }
}

// ----------------------------------------------------
// Export singleton for application-wide consumption
// ----------------------------------------------------

export const SupremeAIv3 = new SupremeAIV3Core(); 