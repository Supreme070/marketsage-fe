/**
 * RAG (Retrieval-Augmented Generation) Engine
 * ==========================================
 * Enhanced with MarketSage platform expertise
 * Provides intelligent, context-aware responses about MarketSage features
 */

import { vectorStore, type Document } from './vector-store';
import { searchKnowledge } from './marketsage-knowledge-base';
import { logger } from '@/lib/logger';

let summarizer: any = null;

// Initialize summarization model with dynamic import
async function getSummarizer() {
  if (!summarizer) {
    try {
      // Dynamic import to prevent loading during build time
      const { pipeline } = await import('@xenova/transformers');
      summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    } catch (error) {
      logger.warn('Could not load transformers pipeline, using fallback', error);
      summarizer = null;
    }
  }
  return summarizer;
}

export interface RAGResult {
  answer: string;
  contextDocs: Document[];
  confidence: number;
}

export async function ragQuery(question: string, maxDocs = 4): Promise<RAGResult> {
  try {
    // Initialize vector store with MarketSage knowledge
    await vectorStore.initialize();
    
    // Search for relevant documents
    const contextDocs = await vectorStore.search(question, maxDocs);
    
    // If no relevant docs found, search knowledge base directly
    if (contextDocs.length === 0) {
      const knowledgeResults = searchKnowledge(question);
      if (knowledgeResults.length > 0) {
        const firstResult = knowledgeResults[0];
        return {
          answer: `Based on MarketSage documentation: ${firstResult.content.slice(0, 500)}...`,
          contextDocs: [{
            id: firstResult.id,
            text: firstResult.content,
            embedding: [],
            metadata: { source: 'knowledge-base', category: firstResult.category }
          }],
          confidence: 0.7
        };
      }
    }

    // Build context from retrieved documents
    const context = contextDocs
      .map(doc => doc.text)
      .join('\n\n');

    // Generate response based on context
    const answer = await generateAnswerFromContext(question, context);
    
    // Calculate confidence based on context relevance
    const confidence = calculateConfidence(question, contextDocs);

    return {
      answer,
      contextDocs,
      confidence
    };

  } catch (error) {
    logger.error('RAG query error:', error);
    return {
      answer: generateFallbackResponse(question),
      contextDocs: [],
      confidence: 0.3
    };
  }
}

async function generateAnswerFromContext(question: string, context: string): Promise<string> {
  try {
    // If context is very long, summarize it first
    if (context.length > 2000) {
      const model = await getSummarizer();
      
      if (model) {
        try {
          const summary = await model(context, { max_length: 500, min_length: 100 });
          context = summary[0].summary_text;
        } catch (error) {
          logger.warn('Summarization failed, truncating context instead', error);
          context = context.slice(0, 1500) + '...';
        }
      } else {
        // Fallback: simple truncation
        context = context.slice(0, 1500) + '...';
      }
    }

    // Generate answer based on the question type
    if (isLeadPulseQuestion(question)) {
      return generateLeadPulseAnswer(question, context);
    } else if (isSetupQuestion(question)) {
      return generateSetupAnswer(question, context);
    } else if (isTroubleshootingQuestion(question)) {
      return generateTroubleshootingAnswer(question, context);
    } else if (isFeaturesQuestion(question)) {
      return generateFeaturesAnswer(question, context);
    } else {
      return generateGeneralAnswer(question, context);
    }

  } catch (error) {
    logger.error('Answer generation error:', error);
    return generateFallbackResponse(question);
  }
}

function isSetupQuestion(question: string): boolean {
  const setupKeywords = ['setup', 'configure', 'install', 'connect', 'integrate', 'how to set up'];
  return setupKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

function isTroubleshootingQuestion(question: string): boolean {
  const troubleKeywords = ['problem', 'issue', 'error', 'not working', 'failed', 'trouble'];
  return troubleKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

function isFeaturesQuestion(question: string): boolean {
  const featureKeywords = ['what is', 'what does', 'features', 'capabilities', 'can I', 'does marketsage'];
  return featureKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

function isLeadPulseQuestion(question: string): boolean {
  const leadpulseKeywords = [
    'leadpulse', 'lead pulse', 'visitor tracking', 'visitor intelligence', 
    'live visitors', 'visitor map', 'visitor analytics', 'visitor behavior',
    'visitor insights', 'visitor dashboard', 'visitor journey', 'visitor data'
  ];
  return leadpulseKeywords.some(keyword => question.toLowerCase().includes(keyword));
}

function generateSetupAnswer(question: string, context: string): string {
  const steps = extractStepsFromContext(context);
  if (steps.length > 0) {
    return `Here's how to set this up in MarketSage:\n\n${steps.join('\n')}\n\nFor additional support, you can access the help section in your MarketSage dashboard or contact our support team.`;
  }
  
  return `To set this up in MarketSage, please refer to the configuration section in your dashboard. ${context.slice(0, 300)}... For detailed setup instructions, check Settings → Integrations or contact support for personalized assistance.`;
}

function generateTroubleshootingAnswer(question: string, context: string): string {
  const solutions = extractSolutionsFromContext(context);
  if (solutions.length > 0) {
    return `Here are the recommended solutions:\n\n${solutions.join('\n')}\n\nIf these steps don't resolve the issue, please check the system status page or contact MarketSage support with your specific error details.`;
  }
  
  return `For this issue, I recommend checking: 1) Your account settings and permissions, 2) Internet connectivity, 3) Browser cache and cookies. ${context.slice(0, 200)}... If the problem persists, please contact MarketSage support with specific error messages.`;
}

function generateFeaturesAnswer(question: string, context: string): string {
  return `MarketSage provides comprehensive capabilities for this. ${context.slice(0, 400)}...\n\nYou can access this feature through your MarketSage dashboard. For a complete walkthrough, check the AI Intelligence Center or use the in-app help system.`;
}

function generateLeadPulseAnswer(question: string, context: string): string {
  // Extract LeadPulse-specific features and capabilities from context
  const features = extractLeadPulseFeatures(context);
  const apiEndpoints = extractLeadPulseApiInfo(context);
  
  let answer = `LeadPulse is MarketSage's advanced visitor intelligence system powered by Supreme AI v3. `;
  
  if (question.toLowerCase().includes('dashboard') || question.toLowerCase().includes('interface')) {
    answer += `The LeadPulse Dashboard provides:\n\n• Live Visitor Map with real-time tracking\n• AI Intelligence insights with Supreme scoring\n• Journey visualization and conversion analysis\n• Advanced filtering and segmentation\n• Export capabilities and automated reporting\n\n`;
  } else if (question.toLowerCase().includes('ai') || question.toLowerCase().includes('intelligence')) {
    answer += `LeadPulse integrates with Supreme AI v3 for:\n\n• Automated business intelligence generation\n• Visitor behavior prediction (85% accuracy)\n• Conversion probability scoring\n• Smart segmentation and recommendations\n• Real-time anomaly detection\n\n`;
  } else if (question.toLowerCase().includes('api') || question.toLowerCase().includes('integration')) {
    answer += `LeadPulse API Integration:\n\n• /api/leadpulse/ai/intelligence - AI-powered insights\n• Real-time visitor behavior analysis\n• Performance predictions and forecasting\n• Funnel optimization recommendations\n• Smart segmentation and targeting\n\n`;
  } else if (question.toLowerCase().includes('setup') || question.toLowerCase().includes('install')) {
    answer += `LeadPulse Setup Process:\n\n1. Install tracking script on your website\n2. Configure visitor scoring parameters\n3. Set up geographic targeting rules\n4. Define conversion goals and events\n5. Create automation triggers\n6. Monitor dashboard for insights\n\n`;
  } else {
    answer += `${context.slice(0, 400)}...\n\n`;
  }
  
  answer += `Access LeadPulse through Dashboard → LeadPulse or chat with Supreme-AI for personalized assistance with visitor intelligence.`;
  
  return answer;
}

function generateGeneralAnswer(question: string, context: string): string {
  return `Based on MarketSage platform knowledge: ${context.slice(0, 500)}...\n\nFor more detailed information, you can explore the relevant section in your MarketSage dashboard or chat with Supreme-AI for personalized guidance.`;
}

function extractStepsFromContext(context: string): string[] {
  const lines = context.split('\n');
  const steps: string[] = [];
  
  for (const line of lines) {
    if (/^\d+\./.test(line.trim()) || line.includes('Step ')) {
      steps.push(`• ${line.trim()}`);
    }
  }
  
  return steps.slice(0, 10); // Limit to 10 steps
}

function extractSolutionsFromContext(context: string): string[] {
  const lines = context.split('\n');
  const solutions: string[] = [];
  
  for (const line of lines) {
    if (line.includes('- ') && (line.includes('Check') || line.includes('Verify') || line.includes('Review'))) {
      solutions.push(`• ${line.trim().replace('- ', '')}`);
    }
  }
  
  return solutions.slice(0, 8); // Limit to 8 solutions
}

function extractLeadPulseFeatures(context: string): string[] {
  const lines = context.split('\n');
  const features: string[] = [];
  
  for (const line of lines) {
    if (line.includes('- ') && (
      line.includes('tracking') || line.includes('analysis') || 
      line.includes('prediction') || line.includes('intelligence') ||
      line.includes('segmentation') || line.includes('optimization')
    )) {
      features.push(line.trim().replace('- ', ''));
    }
  }
  
  return features.slice(0, 10);
}

function extractLeadPulseApiInfo(context: string): string[] {
  const lines = context.split('\n');
  const apiInfo: string[] = [];
  
  for (const line of lines) {
    if (line.includes('/api/leadpulse') || line.includes('GET ') || line.includes('POST ')) {
      apiInfo.push(line.trim());
    }
  }
  
  return apiInfo.slice(0, 8);
}

function calculateConfidence(question: string, docs: Document[]): number {
  if (docs.length === 0) return 0.3;
  
  let confidence = 0.5; // Base confidence
  
  // Boost confidence for MarketSage knowledge docs
  const hasMarketSageKnowledge = docs.some(doc => 
    doc.metadata?.source === 'marketsage-knowledge'
  );
  if (hasMarketSageKnowledge) confidence += 0.3;
  
  // Extra boost for LeadPulse-specific knowledge
  const isLeadPulseQuery = isLeadPulseQuestion(question);
  const hasLeadPulseKnowledge = docs.some(doc => 
    doc.text.toLowerCase().includes('leadpulse') ||
    doc.metadata?.category === 'leadpulse'
  );
  if (isLeadPulseQuery && hasLeadPulseKnowledge) confidence += 0.2;
  
  // Boost for multiple relevant docs
  if (docs.length >= 3) confidence += 0.1;
  
  // Boost for recent docs
  const hasRecentDocs = docs.some(doc => 
    doc.metadata?.indexed && 
    new Date(doc.metadata.indexed) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  if (hasRecentDocs) confidence += 0.1;
  
  return Math.min(confidence, 0.95); // Cap at 95%
}

function generateFallbackResponse(question: string): string {
  if (isLeadPulseQuestion(question)) {
    return `I'd be happy to help you with LeadPulse! LeadPulse is MarketSage's advanced visitor intelligence system powered by Supreme AI v3. You can access LeadPulse through Dashboard → LeadPulse to view real-time visitor analytics, AI insights, and conversion predictions. For specific LeadPulse questions, try asking about features, setup, dashboard usage, or API integration.`;
  }
  
  if (question.toLowerCase().includes('marketsage')) {
    return `I'd be happy to help you with MarketSage! While I'm still processing your specific question, you can find comprehensive information in your MarketSage dashboard under the AI Intelligence Center, or you can access our help documentation. For immediate assistance, try rephrasing your question or contact our support team.`;
  }
  
  return `I'm here to help you with MarketSage! Could you please provide more specific details about what you're looking for? You can ask me about features, setup processes, troubleshooting, or best practices for using MarketSage effectively.`;
} 