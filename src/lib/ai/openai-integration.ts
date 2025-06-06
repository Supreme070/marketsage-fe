/**
 * OpenAI Integration for MarketSage
 * ================================
 * Real GPT-level intelligence for Supreme-AI chat system
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  answer: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIIntegration {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateResponse(
    question: string, 
    context?: string,
    conversationHistory: OpenAIMessage[] = [],
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<OpenAIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: question }
    ];

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4',
          messages,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        answer: data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.',
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context?: string): string {
    return `You are Supreme-AI, the intelligent assistant for MarketSage - a comprehensive marketing automation platform designed specifically for African fintech markets.

**Core Capabilities:**
- Deep understanding of African fintech markets
- Advanced behavioral prediction and analysis
- Dynamic problem-solving and creative thinking
- Contextual awareness and memory retention
- Continuous learning and adaptation

**Communication Style:**
- Professional yet approachable
- Clear and concise explanations
- Proactive problem identification
- Data-driven insights
- Culturally aware and sensitive

**Domain Expertise:**
- African fintech landscape
- Marketing automation
- Customer behavior analysis
- Regulatory compliance
- Market trends and patterns

**Problem-Solving Approach:**
1. Analyze context and historical data
2. Generate multiple solution paths
3. Evaluate feasibility and impact
4. Recommend optimal approach
5. Plan follow-up actions

${context ? `\n**Current Context:**\n${context}` : ''}

Remember to:
- Think through problems systematically
- Consider multiple perspectives
- Provide actionable recommendations
- Maintain context awareness
- Learn from interactions`;
  }

  async analyzeIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: string[];
  }> {
    const response = await this.generateResponse(
      text,
      'Analyze the intent and entities in this text. Return a JSON object with intent, confidence, and entities.',
      [],
      { temperature: 0.3 }
    );

    try {
      const analysis = JSON.parse(response.answer);
      return {
        intent: analysis.intent || 'unknown',
        confidence: analysis.confidence || 0.5,
        entities: analysis.entities || []
      };
    } catch {
      return {
        intent: 'unknown',
        confidence: 0.5,
        entities: []
      };
    }
  }

  async generateCreativeSolutions(
    problem: string,
    constraints: string[]
  ): Promise<string[]> {
    const response = await this.generateResponse(
      `Generate creative solutions for this problem: ${problem}\nConstraints: ${constraints.join(', ')}`,
      'You are a creative problem solver. Think outside the box while respecting the constraints.',
      [],
      { temperature: 0.9 }
    );

    try {
      return response.answer.split('\n').filter(line => line.trim());
    } catch {
      return ['No solutions generated'];
    }
  }

  async evaluateApproach(
    approach: string,
    criteria: string[]
  ): Promise<{
    score: number;
    feedback: string[];
  }> {
    const response = await this.generateResponse(
      `Evaluate this approach: ${approach}\nCriteria: ${criteria.join(', ')}`,
      'You are an expert evaluator. Provide a detailed assessment.',
      [],
      { temperature: 0.3 }
    );

    try {
      const evaluation = JSON.parse(response.answer);
      return {
        score: evaluation.score || 0.5,
        feedback: evaluation.feedback || []
      };
    } catch {
      return {
        score: 0.5,
        feedback: ['Evaluation failed']
      };
    }
  }
}

// Fallback for when OpenAI is not available
export class FallbackAI {
  async generateResponse(question: string, context?: string): Promise<OpenAIResponse> {
    const lowerQuestion = question.toLowerCase();
    
    // Intelligent fallback responses
    if (lowerQuestion.includes('email') && lowerQuestion.includes('improve')) {
      return {
        answer: `To improve your email campaigns, I'd need to understand your current metrics better. What's your current open rate and which markets are you targeting?

**Quick wins for African fintech emails:**
• **Timing**: Send between 9-11 AM or 3-5 PM WAT
• **Subject lines**: Include recipient's name and clear benefits
• **Trust signals**: Mention CBN licensing or security features
• **Mobile optimization**: 85% of users read on mobile

In MarketSage, check Email → Campaigns → Analytics for your current performance, then we can optimize from there.

What specific challenge are you facing with your email campaigns?`
      };
    }

    if (lowerQuestion.includes('workflow') || lowerQuestion.includes('automation')) {
      return {
        answer: `I'd be happy to help you set up workflows! What type of automation are you looking to create?

**Common fintech workflows:**
• Welcome series for new signups
• KYC completion reminders
• Transaction encouragement flows
• Re-engagement campaigns

**In MarketSage:**
1. Go to Dashboard → Workflows → Create New
2. Choose your trigger (signup, action, time-based)
3. Design your multi-channel sequence
4. Test before going live

Start with the "Fintech Onboarding" template - it's pre-built for African markets.

What's your main goal with this workflow?`
      };
    }

    if (lowerQuestion.includes('customer') || lowerQuestion.includes('segment')) {
      return {
        answer: `Customer segmentation is crucial for fintech success! Let me help you understand your audience better.

**Tell me:**
• Are you analyzing existing customers or creating new segments?
• What's your goal - reduce churn, increase transactions, or improve targeting?

**Effective segments for African fintech:**
🏆 **VIP Champions** - Regular users, high transaction volume
🌱 **Growth Potential** - Active but could transact more
⚠️ **At-Risk** - Declining activity, need intervention
👶 **New Users** - Need onboarding and first transaction

Check AI Intelligence → Customer Intelligence in MarketSage to see automated segments with churn predictions.

Which segment interests you most?`
      };
    }

    // Generic helpful response
    return {
      answer: `I'd be happy to help you with that! To give you the most relevant advice, could you tell me more about:

• What specific aspect of MarketSage you're working with?
• What challenge you're trying to solve?
• Your main goal right now?

I can help with:
🔧 **Setup & Configuration** - Integrations, workflows, automation
📧 **Campaign Optimization** - Email, WhatsApp, SMS performance
📊 **Analytics & Insights** - Customer behavior, revenue tracking
🎯 **Strategy** - Segmentation, retention, growth

What would be most helpful for you?`
    };
  }
}

// Export the appropriate AI instance
export const getAIInstance = () => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIIntegration();
  }
  return new FallbackAI();
}; 