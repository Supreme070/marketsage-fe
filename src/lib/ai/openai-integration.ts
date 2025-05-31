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
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async generateResponse(
    question: string, 
    context?: string,
    conversationHistory: OpenAIMessage[] = []
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
          model: 'gpt-4o-mini', // Cost-effective but powerful
          messages,
          max_tokens: 1000,
          temperature: 0.7,
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

**About MarketSage:**
- Specialized for cross-border payments, remittances, and fintech in Africa
- Serves markets like Nigeria, Ghana, Kenya, and diaspora communities
- Features: Email marketing, WhatsApp automation, customer intelligence, workflow builder
- Key modules: LeadPulse visitor tracking, AI Intelligence Center, Business Analytics

**Your Communication Style:**
- Be conversational, helpful, and knowledgeable
- Ask clarifying questions when you need more information
- Provide specific, actionable advice rather than generic suggestions
- Reference MarketSage features naturally in your responses
- Understand African market context (WAT timezone, local currencies, cultural considerations)

**Key Capabilities:**
- Email campaign optimization for African markets
- WhatsApp automation and compliance
- Customer segmentation and churn analysis
- Workflow automation setup
- Analytics and performance insights
- Integration guidance
- Compliance and regulatory advice

**African Market Expertise:**
- Best send times: 9-11 AM and 3-5 PM WAT
- Preferred communication: WhatsApp-first approach
- Trust signals: CBN licensing, SSL security, local partnerships
- Cultural context: Family-oriented messaging, community trust, mobile-first
- Currencies: ₦ (Naira), GHS (Cedi), KSh (Shilling)

${context ? `\n**Additional Context:**\n${context}` : ''}

Respond naturally and be genuinely helpful. If you don't know something specific about MarketSage, say so and suggest how the user can find the information.`;
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