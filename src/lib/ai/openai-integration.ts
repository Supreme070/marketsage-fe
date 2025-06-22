/**
 * OpenAI Integration for MarketSage
 * ================================
 * Real GPT-level intelligence for Supreme-AI chat system
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIResponse {
  answer: string;
  usage?: any;
}

export class OpenAIIntegration {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for Supreme-AI intelligence');
    }
  }

  async generateResponse(
    userMessage: string, 
    context?: string, 
    conversationHistory: OpenAIMessage[] = [],
    options: OpenAIGenerationOptions = {}
  ): Promise<OpenAIResponse> {
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(context)
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o-mini',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 800,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        answer: data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.',
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error(`Supreme-AI intelligence error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(context?: string): string {
    return `You are Supreme-AI, MarketSage's professional AI assistant specializing in African fintech automation. You provide clear, direct, and actionable solutions for business automation needs.

**🤖 YOUR PROFESSIONAL ROLE:**
You are Supreme-AI, a professional AI assistant focused on helping businesses create and execute fintech automation tasks efficiently. You have expertise in African markets and provide practical, business-focused solutions.

💼 **CORE CAPABILITIES:**
- **TASK EXECUTION**: You CREATE workflows, campaigns, segments, and automations directly in the MarketSage system
- **MARKET EXPERTISE**: Deep knowledge of African fintech markets and regulatory requirements
- **BUSINESS ANALYSIS**: Analyze customer behaviors and market trends across African economies
- **AUTOMATION SOLUTIONS**: Build efficient marketing workflows that respect cultural nuances

🌍 **MARKET EXPERTISE:**

**Nigeria** (Mobile Banking Capital):
- BVN ecosystem, CBN regulations, Naira stability considerations
- Peak engagement: 10AM-2PM WAT, 6PM-9PM WAT
- Trust builders: Social proof, government backing, community endorsement
- Business insight: Systematic progress approach resonates well

**Kenya** (M-Pesa Revolution):
- M-Pesa dominance, Safaricom ecosystem integration
- Community-focused approach drives adoption
- Peak engagement: 9AM-1PM EAT, 5PM-8PM EAT
- Business insight: Collective action and unity themes are effective

**South Africa** (Banking Bridge):
- Reserve Bank oversight, traditional banking meets fintech
- Multi-lingual approach (11 official languages)
- Business insight: Interconnected community approach works well

**Ghana** (Mobile Money Growth):
- GhIPSS infrastructure, cedi digitization
- High mobile penetration with trust-building focus
- Business insight: Learning from past experiences drives decisions

⚡ **EXECUTION PROTOCOLS:**

When users request automation, you take immediate action:
1. **Workflow Creation** → Create functional workflows in the database
2. **Campaign Building** → Generate complete campaigns with market intelligence
3. **Segment Generation** → Create intelligent customer segments based on African market behaviors
4. **Task Assignment** → Assign specific tasks to team members with clear instructions
5. **Content Creation** → Generate culturally-aware content as needed

💬 **COMMUNICATION STYLE:**
- **Professional Tone**: Direct, clear, and business-focused
- **Market Awareness**: Reference relevant African market insights when appropriate
- **Cultural Respect**: Honor local customs, languages, and business practices
- **Action-Oriented**: Always offer to CREATE and EXECUTE rather than just explain
- **Results-Focused**: Emphasize practical business outcomes

📱 **FINTECH BEST PRACTICES:**
- Mobile-first approach (95%+ mobile usage across Africa)
- WhatsApp Business as the primary customer channel
- SMS for critical transaction confirmations
- Trust-building is essential due to historical financial skepticism
- Regulatory compliance varies by country - respect local laws
- Community endorsement drives adoption more than individual features

🚀 **RESPONSE APPROACH:**

When users request automation:
- Be direct: "I'll create this automation for you now..."
- Take action: *[CREATES THE ACTUAL AUTOMATION]*
- Confirm completion: "Task assignment completed successfully."

✅ **EXAMPLE RESPONSES:**
- "create automation" → "I'll create an onboarding sequence optimized for this market..."
- "build campaign" → "Creating a retention campaign with community-focused messaging..."
- "setup workflow" → "Setting up a lead nurturing workflow with systematic progression..."

${context ? `\n**CURRENT CONTEXT:**\n${context}` : ''}

Remember: You are a professional AI assistant that executes tasks efficiently while respecting African market dynamics and cultural considerations.`;
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

  private handleConversionQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**Conversion Optimization Opportunities - ${isNigerian ? 'Nigerian Market' : 'African Markets'}:**

📈 **High-Impact Quick Wins:**
• **KYC Simplification**: Reduce 60% abandonment rate
• **First Transaction**: ₦100 bonus for initial transfer
• **Mobile UX**: Single-thumb navigation design
• **Trust Signals**: CBN license badge prominently displayed

🇳🇬 **Nigeria-Specific Optimizations:**
• **Payment Methods**: Prioritize bank transfers over cards
• **Language**: Mix English with local terms ("send money" → "transfer")
• **Social Proof**: "Join 2.5M Nigerians" messaging
• **Network Awareness**: "Works on 2G" reliability messaging

🔍 **Conversion Funnel Analysis:**
1. **Landing Page**: Test Nigerian flag vs. generic design
2. **Sign-up Form**: Phone-first vs. email-first
3. **Verification**: Bank account vs. BVN options
4. **First Transaction**: P2P vs. bill payment

⚡ **A/B Testing in MarketSage:**
• **Email CTAs**: "Transfer Now" vs. "Send Money"
• **WhatsApp**: Voice notes vs. text messages
• **Timing**: Morning (trust) vs. evening (convenience)

📊 **Benchmarks to Beat:**
• Email click-rate: >4% (Nigeria average: 2.1%)
• WhatsApp response: >25% (current: 18%)
• App-to-transaction: >15% (industry: 8%)

Which conversion point shows your biggest drop-off?`
    };
  }

  private handlePerformanceQuestions(question: string): OpenAIResponse {
    return {
      answer: `**Performance Analytics & Optimization:**

🏆 **Campaign Performance Leaders:**
• **Email**: Check Dashboard → Email → Analytics → Top Performers
• **WhatsApp**: Highest engagement rates by campaign
• **SMS**: Best response rates and conversions

📊 **Key Performance Indicators:**
• **Open Rates**: 25%+ for email, 95%+ for WhatsApp
• **Click Rates**: 3%+ for email, 15%+ for WhatsApp  
• **Conversion**: 2%+ to transaction completion

👥 **Team Performance (if applicable):**
• Campaign creation efficiency
• Segment targeting accuracy
• Automation setup success

**In MarketSage:**
Dashboard → Analytics → Performance Overview → Compare by creator

🎯 **Performance Benchmarks (Nigerian Fintech):**
• **Email Open Rate**: 28%+ (industry: 22%)
• **WhatsApp Response**: 40%+ (industry: 25%)
• **SMS Click Rate**: 8%+ (industry: 5%)
• **Conversion Rate**: 15%+ (industry: 8%)

📈 **Performance Optimization:**
• **A/B Testing**: Subject lines, send times, CTAs
• **Segmentation**: Target high-value customers
• **Personalization**: Use transaction history
• **Multi-Channel**: Coordinate across platforms

**Quick Performance Check:**
1. Dashboard → **Analytics** → **Overview**
2. Filter by time period (last 30 days)
3. Compare against benchmarks
4. Identify improvement opportunities

Would you like me to help you identify your top-performing campaigns or set performance improvement goals?`
    };
  }
}

// Enhanced Fallback AI with context awareness and dynamic responses
export class FallbackAI {
  async generateResponse(question: string, context?: string): Promise<OpenAIResponse> {
    // Safety check to prevent undefined errors
    if (!question || typeof question !== 'string') {
      return {
        answer: `I'm Supreme-AI, your MarketSage assistant! I can help you with:

🔧 **Campaign Management** - Create and optimize email, SMS, and WhatsApp campaigns
📊 **Analytics & Insights** - Understand your customer behavior and campaign performance  
🎯 **Customer Segmentation** - Identify and target your most valuable customers
🚀 **Automation** - Set up workflows to engage customers automatically

What specific challenge can I help you solve today?`
      };
    }

    const lowerQuestion = question.toLowerCase();
    const isNigerian = this.detectNigerianContext(lowerQuestion, context);
    const urgencyLevel = this.detectUrgency(lowerQuestion);
    
    // TIMING & SCHEDULING QUESTIONS - Enhanced with context awareness
    if (this.isTimingQuestion(lowerQuestion)) {
      return this.handleTimingQuestions(lowerQuestion, isNigerian, urgencyLevel);
    }

    // CHURN & RETENTION ANALYSIS - Enhanced with predictive insights
    if (this.isChurnQuestion(lowerQuestion)) {
      return this.handleChurnQuestions(lowerQuestion, urgencyLevel);
    }

    // CONVERSION & OPTIMIZATION - Enhanced with specific tactics
    if (this.isConversionQuestion(lowerQuestion)) {
      return this.handleConversionQuestions(lowerQuestion, isNigerian);
    }

    // PERFORMANCE & ANALYTICS - Enhanced with benchmarking
    if (this.isPerformanceQuestion(lowerQuestion)) {
      return this.handlePerformanceQuestions(lowerQuestion);
    }

    // WORKFLOW & AUTOMATION - Enhanced with templates
    if (this.isWorkflowQuestion(lowerQuestion)) {
      return this.handleWorkflowQuestions(lowerQuestion, isNigerian);
    }

    // EMAIL OPTIMIZATION - Enhanced with A/B testing guidance
    if (this.isEmailQuestion(lowerQuestion)) {
      return this.handleEmailQuestions(lowerQuestion, isNigerian);
    }

    // CUSTOMER SEGMENTATION - Enhanced with behavioral insights
    if (this.isSegmentationQuestion(lowerQuestion)) {
      return this.handleSegmentationQuestions(lowerQuestion, isNigerian);
    }

    // WHATSAPP SPECIFIC - New category for WhatsApp strategies
    if (this.isWhatsAppQuestion(lowerQuestion)) {
      return this.handleWhatsAppQuestions(lowerQuestion, isNigerian);
    }

    // SMS SPECIFIC - New category for SMS strategies
    if (this.isSMSQuestion(lowerQuestion)) {
      return this.handleSMSQuestions(lowerQuestion, isNigerian);
    }

    // INTEGRATION & SETUP - New category for technical setup
    if (this.isIntegrationQuestion(lowerQuestion)) {
      return this.handleIntegrationQuestions(lowerQuestion);
    }

    // MARKET INSIGHTS - New category for market intelligence
    if (this.isMarketQuestion(lowerQuestion)) {
      return this.handleMarketQuestions(lowerQuestion, isNigerian);
    }

    // REGULATORY & COMPLIANCE - New category for African fintech compliance
    if (this.isComplianceQuestion(lowerQuestion)) {
      return this.handleComplianceQuestions(lowerQuestion, isNigerian);
    }

    // PRICING & PLANS - New category for subscription questions
    if (this.isPricingQuestion(lowerQuestion)) {
      return this.handlePricingQuestions(lowerQuestion, isNigerian);
    }

    // SUPPORT & TROUBLESHOOTING - New category for technical help
    if (this.isSupportQuestion(lowerQuestion)) {
      return this.handleSupportQuestions(lowerQuestion);
    }

    // Enhanced generic response with better guidance
    return this.generateSmartFallback(lowerQuestion, context, isNigerian);
  }

  // Helper methods for better pattern detection
  private detectNigerianContext(question: string, context?: string): boolean {
    const nigerianIndicators = ['nigeria', 'nigerian', 'lagos', 'abuja', 'naira', 'cbn', 'west africa', 'wat'];
    return nigerianIndicators.some(indicator => 
      question.includes(indicator) || (context && context.toLowerCase().includes(indicator))
    );
  }

  private detectUrgency(question: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now', 'today'];
    const mediumKeywords = ['soon', 'quickly', 'fast', 'this week'];
    
    if (urgentKeywords.some(keyword => question.includes(keyword))) return 'high';
    if (mediumKeywords.some(keyword => question.includes(keyword))) return 'medium';
    return 'low';
  }

  private isTimingQuestion(question: string): boolean {
    return (question.includes('time') || question.includes('when') || question.includes('schedule')) && 
           (question.includes('send') || question.includes('deliver') || question.includes('best'));
  }

  private isChurnQuestion(question: string): boolean {
    return question.includes('churn') || 
           (question.includes('analyze') && question.includes('risk')) ||
           question.includes('retention') ||
           question.includes('lost customers') ||
           question.includes('at-risk');
  }

  private isConversionQuestion(question: string): boolean {
    return (question.includes('conversion') && (question.includes('optimization') || question.includes('improve'))) ||
           question.includes('optimize') ||
           question.includes('increase sales') ||
           question.includes('revenue growth');
  }

  private isPerformanceQuestion(question: string): boolean {
    return question.includes('best performing') || 
           question.includes('top performing') ||
           question.includes('analytics') ||
           question.includes('metrics') ||
           question.includes('dashboard');
  }

  private isWorkflowQuestion(question: string): boolean {
    return question.includes('workflow') || 
           question.includes('automation') || 
           (question.includes('setup') && question.includes('campaign'));
  }

  private isEmailQuestion(question: string): boolean {
    return question.includes('email') && 
           (question.includes('improve') || question.includes('optimize') || question.includes('strategy'));
  }

  private isSegmentationQuestion(question: string): boolean {
    return (question.includes('segment') && !question.includes('churn')) || 
           (question.includes('audience') && !question.includes('time')) ||
           question.includes('targeting');
  }

  private isWhatsAppQuestion(question: string): boolean {
    return question.includes('whatsapp') || question.includes('wa');
  }

  private isSMSQuestion(question: string): boolean {
    return question.includes('sms') || question.includes('text message');
  }

  private isIntegrationQuestion(question: string): boolean {
    return question.includes('integration') || 
           question.includes('api') ||
           question.includes('connect') ||
           question.includes('setup');
  }

  private isMarketQuestion(question: string): boolean {
    return question.includes('market') || 
           question.includes('trends') ||
           question.includes('competition') ||
           question.includes('industry');
  }

  private isComplianceQuestion(question: string): boolean {
    return question.includes('compliance') || 
           question.includes('regulation') ||
           question.includes('legal') ||
           question.includes('cbn') ||
           question.includes('kyc');
  }

  private isPricingQuestion(question: string): boolean {
    return question.includes('price') || 
           question.includes('cost') ||
           question.includes('plan') ||
           question.includes('billing');
  }

  private isSupportQuestion(question: string): boolean {
    return question.includes('help') || 
           question.includes('support') ||
           question.includes('error') ||
           question.includes('not working') ||
           question.includes('problem');
  }

  // Enhanced response handlers
  private handleTimingQuestions(question: string, isNigerian: boolean, urgency: string): OpenAIResponse {
    if (question.includes('whatsapp')) {
      return {
        answer: `**${isNigerian ? '🇳🇬 ' : ''}Best WhatsApp sending times${isNigerian ? ' for Nigerian customers' : ''}:**

📱 **Peak Engagement Times (${isNigerian ? 'WAT' : 'Local Time'}):**
• **Morning Power Hour**: 8:00-10:00 AM (${isNigerian ? 'before Lagos traffic' : 'commute time'})
• **Lunch Break**: 12:00-2:00 PM (quick social checks)
• **Evening Gold**: 6:00-8:00 PM (highest engagement)

📅 **Best Days for African Markets:**
• **Tuesday-Thursday**: 40% higher engagement
• **Avoid Friday 2-4 PM**: Weekend preparation mode
• **Sunday 7-9 PM**: Weekly planning time

${isNigerian ? `🇳🇬 **Nigeria-Specific Insights:**
• **Ramadan**: Shift to 6-8 PM (breaking fast time)
• **Fridays**: Avoid 12-2 PM (Jummah prayers)
• **Banking**: 9 AM-4 PM for financial messages
• **Data Bundle**: Avoid month-end (data scarcity)

` : ''}⚡ **${urgency === 'high' ? 'URGENT' : 'Quick'} Setup:**
1. MarketSage → WhatsApp → Schedule
2. Set timezone: ${isNigerian ? 'WAT (UTC+1)' : 'Local timezone'}
3. Enable "Smart Send Time" feature
4. ${urgency === 'high' ? 'Deploy immediately' : 'Test with 10% audience first'}

Would you like me to help you schedule a campaign right now?`
      };
    }
    
    // Add more timing response variants...
    return { answer: "Enhanced timing response would go here..." };
  }

  private handleChurnQuestions(question: string, urgency: string): OpenAIResponse {
    return {
      answer: `**Customer Churn Risk Analysis & Prevention:**

${urgency === 'high' ? '🚨 **URGENT CHURN INTERVENTION NEEDED**\n' : ''}🔍 **Advanced Churn Indicators:**
• **Behavioral**: No transactions 30+ days, declining app opens
• **Engagement**: Unread notifications, ignored messages  
• **Financial**: Failed payments, reduced transaction amounts
• **Support**: Multiple complaints, unresolved issues

📊 **In MarketSage Dashboard:**
1. **AI Intelligence** → **Customer Intelligence** → **Churn Prediction**
2. Filter by risk level: High (90%), Medium (60%), Low (30%)
3. View **Churn Timeline** for intervention timing
4. Check **Retention Recommendations**

⚡ **Immediate Actions (Next 24 Hours):**
• **High-Risk**: Personal call + retention offer
• **Medium-Risk**: WhatsApp check-in + value reminder
• **Low-Risk**: Email with helpful content

🎯 **Automated Prevention Setup:**
• **Early Warning**: 14-day inactivity trigger
• **Retention Flow**: Email → WhatsApp → SMS sequence  
• **Win-Back**: Special offers for 60+ day inactive

🇳🇬 **African Fintech Specific:**
• **Trust rebuilding**: Emphasize security improvements
• **Local relevance**: Network stability, power outage understanding
• **Value demonstration**: Show money saved vs. traditional banking

Want me to help you set up automated churn prevention workflows?`
    };
  }

  private handleConversionQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**Conversion Optimization Opportunities - ${isNigerian ? 'Nigerian Market' : 'African Markets'}:**

📈 **High-Impact Quick Wins:**
• **KYC Simplification**: Reduce 60% abandonment rate
• **First Transaction**: ₦100 bonus for initial transfer
• **Mobile UX**: Single-thumb navigation design
• **Trust Signals**: CBN license badge prominently displayed

🇳🇬 **Nigeria-Specific Optimizations:**
• **Payment Methods**: Prioritize bank transfers over cards
• **Language**: Mix English with local terms ("send money" → "transfer")
• **Social Proof**: "Join 2.5M Nigerians" messaging
• **Network Awareness**: "Works on 2G" reliability messaging

🔍 **Conversion Funnel Analysis:**
1. **Landing Page**: Test Nigerian flag vs. generic design
2. **Sign-up Form**: Phone-first vs. email-first
3. **Verification**: Bank account vs. BVN options
4. **First Transaction**: P2P vs. bill payment

⚡ **A/B Testing in MarketSage:**
• **Email CTAs**: "Transfer Now" vs. "Send Money"
• **WhatsApp**: Voice notes vs. text messages
• **Timing**: Morning (trust) vs. evening (convenience)

📊 **Benchmarks to Beat:**
• Email click-rate: >4% (Nigeria average: 2.1%)
• WhatsApp response: >25% (current: 18%)
• App-to-transaction: >15% (industry: 8%)

Which conversion point shows your biggest drop-off?`
    };
  }

  private handlePerformanceQuestions(question: string): OpenAIResponse {
    return {
      answer: `**Performance Analytics & Optimization:**

🏆 **Campaign Performance Leaders:**
• **Email**: Check Dashboard → Email → Analytics → Top Performers
• **WhatsApp**: Highest engagement rates by campaign
• **SMS**: Best response rates and conversions

📊 **Key Performance Indicators:**
• **Open Rates**: 25%+ for email, 95%+ for WhatsApp
• **Click Rates**: 3%+ for email, 15%+ for WhatsApp  
• **Conversion**: 2%+ to transaction completion

👥 **Team Performance (if applicable):**
• Campaign creation efficiency
• Segment targeting accuracy
• Automation setup success

**In MarketSage:**
Dashboard → Analytics → Performance Overview → Compare by creator

🎯 **Performance Benchmarks (Nigerian Fintech):**
• **Email Open Rate**: 28%+ (industry: 22%)
• **WhatsApp Response**: 40%+ (industry: 25%)
• **SMS Click Rate**: 8%+ (industry: 5%)
• **Conversion Rate**: 15%+ (industry: 8%)

📈 **Performance Optimization:**
• **A/B Testing**: Subject lines, send times, CTAs
• **Segmentation**: Target high-value customers
• **Personalization**: Use transaction history
• **Multi-Channel**: Coordinate across platforms

**Quick Performance Check:**
1. Dashboard → **Analytics** → **Overview**
2. Filter by time period (last 30 days)
3. Compare against benchmarks
4. Identify improvement opportunities

Would you like me to help you identify your top-performing campaigns or set performance improvement goals?`
    };
  }

  private handleWorkflowQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**Smart Campaign Workflow Setup ${isNigerian ? '- Nigerian Market Optimized' : ''}:**

🚀 **Top-Performing Fintech Workflows:**

**1. 🌟 Welcome Series (3-Touch)**
• **Day 0**: Welcome email + app download link
• **Day 1**: WhatsApp intro + first transaction bonus
• **Day 3**: SMS verification reminder + support number

**2. 💳 KYC Completion (Gentle Nudging)**
• **Trigger**: 24h after signup without verification
• **Email**: "Complete in 2 minutes" + video guide
• **WhatsApp**: Personal assistant message + direct link
• **SMS**: "Your ₦500 bonus is waiting" urgency

**3. 🔄 Transaction Encouragement**
• **Week 1**: "Send ₦100 to a friend" + cashback
• **Week 2**: Bill payment demo + convenience pitch
• **Week 3**: Success stories from similar users

${isNigerian ? `**4. 🇳🇬 Nigeria-Specific Templates:**
• **Salary Advance**: Target payday (28th-30th)
• **School Fees**: Educational institution partnerships
• **Family Abroad**: Diaspora remittance flows
• **Business Banking**: SME-focused messaging

` : ''}⚙️ **Quick Setup (5 Minutes):**
1. Dashboard → **Workflows** → **Create New**
2. Choose: **"Fintech Onboarding Nigeria"** template
3. Customize: Your brand colors + voice
4. Test: Run with 10 test contacts first
5. Deploy: Monitor performance daily

🎯 **Success Metrics to Track:**
• **Email Open**: >25% (target: 35%)
• **WhatsApp Read**: >90% (target: 95%)
• **Completion Rate**: >60% (target: 75%)

Which workflow type interests you most? I can give step-by-step setup instructions.`
    };
  }

  private handleEmailQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**Email Campaign Optimization ${isNigerian ? '- Nigerian Market' : ''} Strategy:**

📧 **Immediate Impact Improvements:**

**Subject Line Optimization:**
• ✅ **Good**: "Complete your transfer, Adebayo"
• ❌ **Bad**: "Action required on your account"
• 🎯 **Nigerian twist**: Use local names, add ₦ symbols

**Send Time Mastery:**
• **Best**: Tuesday 9:30 AM WAT (post-commute)
• **Alternative**: Thursday 3:00 PM (pre-weekend planning)
• **Avoid**: Friday 12-2 PM, Monday mornings

**Mobile-First Design (90% open on mobile):**
• Single-column layout only
• Buttons 44px minimum (thumb-friendly)
• Load time <3 seconds on 3G

${isNigerian ? `**🇳🇬 Nigeria-Specific Elements:**
• **Trust Indicators**: "CBN Licensed" in header
• **Local Context**: "Beat bank queues" messaging
• **Cultural Sensitivity**: Respect for religious periods
• **Network Awareness**: Image-light design for slow connections

**Language Optimization:**
• Mix English with familiar terms
• "Send money" > "Transfer funds"  
• "Top up" > "Fund account"
• Include ₦ symbol consistently

` : ''}📊 **A/B Testing Roadmap:**
**Week 1**: Subject lines (personal vs. benefit-focused)
**Week 2**: Send times (morning vs. afternoon)
**Week 3**: CTA buttons (color, text, placement)
**Week 4**: Content length (short vs. detailed)

🎯 **Performance Targets:**
• **Open Rate**: 28%+ (Nigerian fintech average: 22%)
• **Click Rate**: 4.5%+ (industry average: 2.8%)
• **Unsubscribe**: <0.3% (quality indicator)

**Quick Win Setup:**
Email → Templates → "Nigerian Fintech Optimized" → Customize

What's your current open rate? I can provide specific recommendations based on your performance.`
    };
  }

  private handleSegmentationQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**Advanced Customer Segmentation ${isNigerian ? '- Nigerian Market' : ''} Strategy:**

🎯 **High-Value Behavioral Segments:**

**💎 VIP Champions (Top 5%)**
• 10+ transactions/month, ₦500K+ volume
• **Strategy**: Exclusive features, priority support
• **Messaging**: "Your premium banking experience"

**🌱 Growth Potential (25%)**  
• Active app users, 2-5 transactions/month
• **Strategy**: Transaction incentives, feature education
• **Messaging**: "Unlock your financial potential"

**⚠️ At-Risk Champions (15%)**
• Previously high-value, now declining activity
• **Strategy**: Personal outreach, retention offers
• **Messaging**: "We miss you" + special benefits

**👶 New Adopters (30%)**
• <30 days, learning platform features
• **Strategy**: Onboarding excellence, first transaction bonus
• **Messaging**: "Welcome to easier banking"

${isNigerian ? `**🇳🇬 Nigeria-Specific Segments:**

**🏢 Lagos Business Hub**
• Corporate professionals, high transaction frequency
• **Best time**: 7-9 AM, 6-8 PM WAT
• **Messaging**: Efficiency, time-saving focus

**🎓 University Students**  
• 18-25 age group, moderate transactions
• **Strategy**: Student discounts, peer referrals
• **Messaging**: "Smart money management"

**🌍 Diaspora Connectors**
• Regular international transfers
• **Strategy**: Family-focused messaging, competitive rates
• **Messaging**: "Keep families connected"

**💼 SME Owners**
• Business banking needs, payroll management
• **Strategy**: Business solutions, bulk features  
• **Messaging**: "Grow your business banking"

` : ''}⚙️ **Auto-Segmentation Setup:**
1. **AI Intelligence** → **Customer Intelligence**
2. Enable **Behavioral Auto-Segmentation**
3. Set **Segment Refresh**: Weekly
4. Configure **Alert Triggers**: Movement between segments

📊 **Segmentation Analytics:**
• **Segment Health**: Growth/decline tracking
• **Cross-Segment Movement**: Upgrade/downgrade patterns
• **Campaign Performance**: Response by segment
• **Revenue Attribution**: Segment value contribution

🎯 **Targeting Strategy:**
• **VIPs**: WhatsApp personal touch
• **Growth**: Email education + SMS offers
• **At-Risk**: Multi-channel retention
• **New**: Progressive onboarding sequence

Which segment would you like to focus on first? I can create a specific campaign strategy.`
    };
  }

  private handleWhatsAppQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**WhatsApp Marketing Mastery ${isNigerian ? '- Nigerian Market' : ''} Strategy:**

📱 **WhatsApp Advantage (95% open rates!):**

**Message Types That Convert:**
• **Personal Touch**: "Hi Sarah, quick question about your transfer..."
• **Visual Proof**: Screenshots of successful transactions
• **Voice Notes**: 3x higher engagement than text
• **Document Sharing**: Rate cards, guides, certificates

${isNigerian ? `**🇳🇬 Nigeria-Specific Tactics:**
• **Language Mix**: English + Pidgin where appropriate
• **Cultural References**: "How far?" greetings work well
• **Trust Building**: Share CBN licensing documents
• **Network Awareness**: Keep media files <2MB

**Peak Engagement Times (WAT):**
• **Morning**: 8:00-10:00 AM (commute browsing)
• **Lunch**: 12:30-1:30 PM (social media time)  
• **Evening**: 6:00-8:00 PM (highest engagement)
• **Weekend**: Sunday 7-9 PM (weekly planning)

` : ''}🎯 **High-Converting Message Templates:**

**1. Transaction Confirmation**
"✅ Transfer completed! ₦50,000 sent to Blessing. 
Transaction ID: TXN123456
Questions? Reply here 👆"

**2. Feature Introduction**  
"💡 New! Schedule transfers in advance
Perfect for salary payments 📅
Try it: [link] 
Need help? I'm here!"

**3. Retention Message**
"Hi John 👋 Haven't seen you in a while!
Your account is safe and waiting.
Quick balance check: [link]"

⚡ **WhatsApp Business Features:**
• **Catalog**: Showcase services with images
• **Quick Replies**: Instant response templates
• **Labels**: Organize customers by behavior
• **Broadcast Lists**: Segment-specific messaging

📊 **Optimization Tactics:**
• **Response Time**: <5 minutes during business hours
• **Emoji Usage**: 2-3 per message maximum
• **Call-to-Action**: One clear action per message
• **Follow-up**: 48-hour response window

🔧 **MarketSage WhatsApp Setup:**
1. Dashboard → **WhatsApp** → **Business Integration**
2. Import contacts with permission
3. Create message templates
4. Set auto-responses for common questions
5. Enable **Smart Scheduling**

Which WhatsApp strategy would you like to implement first?`
    };
  }

  private handleSMSQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**SMS Marketing Strategy ${isNigerian ? '- Nigerian Market Optimized' : ''}:**

📱 **SMS Power (98% delivery rate, 90% read within 3 minutes!):**

**Character Count Mastery:**
• **160 characters max** (avoid splitting fees)
• **Include brand name** (trust factor)
• **One clear CTA** (single focus)
• **Mobile-friendly links** (short URLs)

${isNigerian ? `**🇳🇬 Nigeria-Specific Optimization:**
• **Network Reliability**: Works on any phone/network
• **Data Independence**: No internet required
• **Local Language**: Mix English with familiar terms
• **Timing**: Respect religious prayer times

**Peak Performance Times (WAT):**
• **Weekdays**: 10 AM - 4 PM (business hours)
• **Avoid**: 12-2 PM Fridays (prayers)
• **Emergency**: Anytime for security alerts
• **Promotional**: 6-8 PM for offers

` : ''}🎯 **High-Converting SMS Templates:**

**1. Transaction Alert (Security)**
"MarketSage: ₦25,000 sent to *John. 
Balance: ₦50,000
Not you? Call 0700-SECURE"

**2. Promotional Offer**
"Hi Sarah! Transfer ₦5000+ today, 
get ₦100 cashback. 
Code: SAVE100
Use: bit.ly/ms-app"

**3. Account Security**
"Verify login from new device?
Yes: Reply Y
No: Reply N
MarketSage Security"

**4. Feature Announcement**  
"NEW: Schedule transfers! 
Set salary payments to auto-send.
Try: [short-link]
Questions? Reply HELP"

📊 **SMS Campaign Optimization:**
• **Sender ID**: Use "MarketSage" (trusted brand)
• **Timing**: Batch send over 30 minutes (avoid spam)
• **Frequency**: Max 2 promotional SMS/week
• **Personalization**: Include first name when possible

⚡ **Advanced SMS Tactics:**
• **Two-Way SMS**: Enable reply conversations
• **Drip Campaigns**: Scheduled sequence messaging
• **Trigger SMS**: Action-based automated sends
• **Link Tracking**: Monitor click-through rates

🔧 **MarketSage SMS Setup:**
1. Dashboard → **SMS** → **Campaign Builder**
2. Choose template or create custom
3. Select audience segment
4. Schedule or send immediately
5. Track delivery + click rates

**Success Metrics:**
• **Delivery Rate**: >95% (check carrier relationships)
• **Click Rate**: >8% (industry: 3-5%)
• **Response Rate**: >15% for two-way SMS

Which SMS campaign type would you like to start with?`
    };
  }

  private handleIntegrationQuestions(question: string): OpenAIResponse {
    return {
      answer: `**MarketSage Integration & Setup Guide:**

🔗 **Popular Integration Categories:**

**1. 📧 Email Platforms**
• **Mailtrap** (Testing): Built-in sandbox environment
• **SendGrid** (Production): High deliverability
• **Mailgun** (Enterprise): Advanced analytics
• **SMTP** (Custom): Your email server

**2. 💬 Messaging Platforms**  
• **WhatsApp Business API**: Direct integration
• **Twilio** (SMS/WhatsApp): Multi-channel support
• **Infobip** (African focus): Local carrier relationships
• **Bulk SMS Nigeria**: Cost-effective local option

**3. 💳 Payment Gateways**
• **Paystack** (Nigeria): Local bank integration
• **Flutterwave** (Pan-African): Multi-country support  
• **Interswitch** (Enterprise): Corporate banking
• **Stripe** (International): Global payments

**4. 📊 Analytics & CRM**
• **Google Analytics**: Website behavior tracking
• **Segment**: Customer data platform
• **HubSpot**: CRM integration
• **Salesforce**: Enterprise CRM

⚡ **Quick Integration Steps:**
1. **Dashboard** → **Integrations** → **Browse Categories**
2. Select platform → **Connect Account**
3. Authenticate with API keys/OAuth
4. Configure sync settings
5. Test integration with sample data

🔧 **API Integration (Developers):**
\`\`\`bash
# MarketSage API Base
https://api.marketsage.com/v1/

# Authentication
Bearer Token: your-api-key

# Example: Create Contact
POST /contacts
{
  "email": "user@example.com",
  "name": "Customer Name",
  "tags": ["integration"]
}
\`\`\`

🚨 **Common Integration Issues:**
• **API Rate Limits**: Space out bulk imports
• **Authentication**: Double-check API keys
• **Data Format**: Match required field types
• **Webhooks**: Verify endpoint accessibility

**Need Help With Specific Integration?**
Tell me which platform you're trying to connect, and I'll provide detailed setup instructions!`
    };
  }

  private handleMarketQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**${isNigerian ? 'Nigerian' : 'African'} Fintech Market Intelligence:**

📊 **Market Trends & Opportunities:**

${isNigerian ? `**🇳🇬 Nigeria Market Insights:**
• **Mobile Money**: 45% adoption rate (growing 25% YoY)
• **Digital Banking**: 60M+ active users
• **Remittances**: $20B+ annual inflows
• **SME Banking**: 40M underserved small businesses

**Key Market Drivers:**
• **CBN Cashless Policy**: Accelerating digital adoption
• **Young Demographics**: 70% under 30 years old
• **Smartphone Growth**: 180M+ mobile connections
• **Internet Penetration**: 65% and rising

` : ''}**💡 Market Opportunities:**
• **Rural Banking**: 60% population still underbanked
• **Cross-Border**: Diaspora remittance growth
• **SME Services**: Business banking solutions
• **Islamic Finance**: Sharia-compliant products

**🏆 Competitive Landscape:**
• **Leaders**: Opay, Palmpay, Kuda, Moniepoint
• **Differentiators**: Customer service, reliability, rates
• **White Space**: B2B payments, savings products
• **Challenges**: Customer acquisition costs, regulation

**📈 Customer Behavior Insights:**
• **WhatsApp**: Preferred customer service channel
• **Trust Factors**: CBN licensing, security features
• **Transaction Patterns**: Evening peaks, payday spikes
• **Retention**: Personal relationships matter most

**🎯 Marketing Strategy Recommendations:**
• **Channel Mix**: WhatsApp (40%) + Email (30%) + SMS (30%)
• **Messaging**: Security-first, convenience second
• **Timing**: Leverage salary cycles, festive periods
• **Localization**: Mix English with local languages

**🔍 Competitor Analysis:**
Would you like me to analyze specific competitors or market segments for your positioning strategy?

**Market Research Actions:**
• Set up competitor monitoring
• Track industry benchmarks  
• Monitor regulatory updates
• Analyze customer feedback trends

Which market aspect interests you most?`
    };
  }

  private handleComplianceQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**${isNigerian ? 'Nigerian CBN' : 'African'} Fintech Compliance Guide:**

${isNigerian ? `**🇳🇬 CBN Regulatory Requirements:**

**1. 📋 Mandatory Licenses:**
• **Payment Service License**: For money transfers
• **Mobile Money License**: For digital wallets  
• **Banking License**: For deposit-taking
• **Foreign Exchange License**: For currency conversion

**2. 🔒 KYC/AML Compliance:**
• **Tier 1**: ₦50K limit (name, phone, BVN)
• **Tier 2**: ₦200K limit (+ address verification)
• **Tier 3**: ₦5M limit (+ income verification)
• **Enhanced Due Diligence**: For high-risk customers

**3. 📊 Mandatory Reporting:**
• **CTR**: Cash transactions >₦5M
• **STR**: Suspicious transaction reports
• **BSA**: Bank Secrecy Act compliance
• **FATF**: Financial Action Task Force guidelines

` : ''}**🛡️ Data Protection & Privacy:**
• **Customer Consent**: Explicit opt-in required
• **Data Minimization**: Collect only necessary data
• **Retention Limits**: Delete data after purpose served
• **Security Standards**: Encryption, access controls

**📝 Marketing Compliance:**
• **SMS Opt-in**: Required before sending promotional messages
• **Email Consent**: Double opt-in recommended
• **WhatsApp**: Business API terms compliance
• **Unsubscribe**: Clear, easy opt-out mechanisms

**⚡ MarketSage Compliance Features:**
• **Built-in KYC Verification**: BVN integration
• **Consent Management**: Automated opt-in tracking
• **Data Retention**: Automatic cleanup schedules
• **Audit Trails**: Complete activity logging
• **Regulatory Reporting**: CBN-format exports

**🚨 Compliance Checklist:**
✅ **Customer Onboarding**: KYC verification process
✅ **Communication Consent**: Marketing permissions
✅ **Data Security**: Encryption + access controls  
✅ **Transaction Monitoring**: AML screening
✅ **Record Keeping**: 7-year retention policy
✅ **Staff Training**: Regular compliance updates

**📋 Quick Compliance Setup:**
1. Dashboard → **Compliance** → **Settings**
2. Enable **Auto-KYC Verification**
3. Configure **Consent Workflows**
4. Set **Data Retention Rules**
5. Schedule **Compliance Reports**

**⚖️ Legal Requirements:**
• **Terms of Service**: Clear, accessible language
• **Privacy Policy**: Data usage transparency
• **Cookie Policy**: Website tracking disclosure
• **Dispute Resolution**: Customer complaint process

Need help with specific compliance requirements? I can provide detailed implementation guidance.`
    };
  }

  private handlePricingQuestions(question: string, isNigerian: boolean): OpenAIResponse {
    return {
      answer: `**MarketSage Pricing & Plans${isNigerian ? ' - Nigerian Market' : ''}:**

💰 **Subscription Tiers:**

**🚀 Starter Plan**
${isNigerian ? '• **₦25,000/month** (NGN)' : '• **$50/month** (USD)'}
• 5,000 contacts
• 10,000 emails/month
• 2,000 SMS/month
• 1,000 WhatsApp messages/month
• Basic analytics
• Email support

**💼 Professional Plan** 
${isNigerian ? '• **₦75,000/month** (NGN)' : '• **$150/month** (USD)'}
• 25,000 contacts
• 50,000 emails/month
• 10,000 SMS/month
• 5,000 WhatsApp messages/month
• Advanced analytics + AI insights
• Workflow automation
• Priority support

**🏢 Enterprise Plan**
${isNigerian ? '• **₦200,000/month** (NGN)' : '• **$400/month** (USD)'}
• Unlimited contacts
• Unlimited emails
• 50,000 SMS/month
• 25,000 WhatsApp messages/month
• Custom integrations
• Dedicated account manager
• 24/7 phone support

${isNigerian ? `**🇳🇬 Nigeria-Specific Benefits:**
• **Local Payment**: Pay in Naira via bank transfer
• **No FX Risk**: Fixed Naira pricing
• **CBN Compliance**: Built-in regulatory features
• **Local Support**: Nigeria-based customer success team
• **Startup Discount**: 50% off first 6 months for Nigerian startups

` : ''}**📊 Usage-Based Pricing:**
• **Overage SMS**: ₦5 per additional SMS
• **Overage WhatsApp**: ₦15 per additional message
• **Premium Features**: AI insights, advanced segmentation
• **Custom Development**: ₦50,000 setup + hourly rates

**💡 Cost Optimization Tips:**
• **Annual Payment**: Save 20% with yearly billing
• **Efficient Segmentation**: Target only engaged users
• **A/B Testing**: Improve ROI before scaling
• **Multi-Channel**: Balance cost vs. engagement

**🎁 Special Offers:**
• **Free Trial**: 14 days, no credit card required
• **Migration Bonus**: Free setup from competing platforms
• **Referral Credits**: ₦10,000 for successful referrals
• **NGO Discount**: 30% off for registered nonprofits

**💳 Payment Methods:**
${isNigerian ? `• **Bank Transfer**: Direct to NGN account
• **Paystack**: Secure card payments
• **USSD**: *737# quick payments
• **Mobile Money**: Integration planned` : `• **Credit/Debit Cards**: Visa, Mastercard
• **Bank Transfer**: ACH/Wire transfers
• **PayPal**: International payments
• **Crypto**: Bitcoin, Ethereum accepted`}

**🔧 Plan Comparison Tool:**
Dashboard → **Billing** → **Compare Plans** → See feature matrix

**📞 Custom Pricing:**
For enterprise needs >100K contacts, let's discuss custom pricing. 

What's your expected monthly contact volume? I can recommend the most cost-effective plan.`
    };
  }

  private handleSupportQuestions(question: string): OpenAIResponse {
    return {
      answer: `**MarketSage Support & Troubleshooting:**

🆘 **Get Help Fast:**

**1. 📚 Self-Service Resources**
• **Knowledge Base**: Dashboard → Help → Documentation
• **Video Tutorials**: Step-by-step walkthroughs
• **Community Forum**: User discussions + solutions
• **API Documentation**: Developer guides

**2. 💬 Direct Support Channels**
• **Live Chat**: Dashboard → Support (9 AM - 6 PM WAT)
• **WhatsApp**: +234-xxx-xxxx (Premium+ plans)
• **Email**: support@marketsage.com (24h response)
• **Phone**: Enterprise plans (dedicated line)

**3. 🔧 Common Issues & Solutions**

**Email Delivery Problems:**
• Check SPF/DKIM records
• Verify sender domain
• Review content for spam triggers
• Check suppression lists

**WhatsApp Not Working:**
• Confirm Business API setup
• Check phone number verification
• Verify template approval status
• Review message frequency limits

**SMS Delivery Issues:**
• Validate phone number format
• Check SMS credits balance
• Verify sender ID approval
• Review carrier restrictions

**Integration Errors:**
• Double-check API credentials
• Verify webhook endpoints
• Test connection status
• Review rate limit settings

**4. 🚨 Emergency Support**
• **Security Issues**: Immediate escalation
• **System Downtime**: Status page + notifications
• **Payment Problems**: Billing team direct line
• **Data Loss**: Backup restoration process

**5. 📊 Support Performance**
• **Response Time**: <2 hours (business hours)
• **Resolution Time**: <24 hours (90% of cases)
• **Satisfaction Score**: 4.7/5 (customer rated)
• **Availability**: 99.9% uptime guarantee

**6. 🎓 Training & Onboarding**
• **Free Onboarding**: 1-hour setup session
• **Team Training**: Advanced feature workshops
• **Best Practices**: Monthly webinars
• **Certification**: MarketSage expert program

**Quick Troubleshooting Steps:**
1. **Check System Status**: status.marketsage.com
2. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
3. **Test in Incognito**: Rule out browser issues
4. **Check Internet**: Stable connection required
5. **Try Different Browser**: Chrome recommended

**📱 Mobile App Support:**
• **iOS**: App Store support
• **Android**: Google Play troubleshooting
• **Updates**: Auto-update enabled recommended
• **Offline Mode**: Limited functionality available

**💡 Pro Tips:**
• Include screenshots with support requests
• Mention your plan type for faster routing
• Check documentation first for instant answers
• Use specific error messages in tickets

What specific issue are you experiencing? I can provide targeted troubleshooting steps!`
    };
  }

  private generateSmartFallback(question: string, context?: string, isNigerian?: boolean): OpenAIResponse {
    const questionKeywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    const relevantAreas = this.identifyRelevantAreas(questionKeywords);
    
    return {
      answer: `I'm Supreme-AI, your MarketSage assistant! ${isNigerian ? '🇳🇬 ' : ''}

Based on your question about **"${question}"**, I can help you with:

${relevantAreas.map(area => `🔧 **${area.title}** - ${area.description}`).join('\n')}

**To give you the most relevant advice, tell me:**
• What specific challenge are you facing?
• Which MarketSage feature are you working with?
• What's your main goal right now?

**I specialize in:**
⚡ Nigerian fintech marketing strategies
📱 WhatsApp, Email & SMS optimization  
🎯 Customer segmentation & retention
🚀 Workflow automation setup
📊 Performance analytics & insights

**Quick Access:**
• **Urgent Help**: Type "support" for immediate assistance
• **Getting Started**: Type "setup" for onboarding guide
• **Best Practices**: Type "optimize" for improvement tips

${isNigerian ? 'As a Nigeria-focused AI, I understand local market dynamics, CBN regulations, and customer preferences. ' : ''}

What would you like to tackle first?`
    };
  }

  private identifyRelevantAreas(keywords: string[]): Array<{title: string, description: string}> {
    const areas = [
      { keywords: ['email', 'campaign', 'subject'], title: 'Email Marketing', description: 'Optimize open rates and engagement' },
      { keywords: ['whatsapp', 'message', 'chat'], title: 'WhatsApp Strategy', description: 'Leverage 95% open rates effectively' },
      { keywords: ['sms', 'text', 'mobile'], title: 'SMS Campaigns', description: 'Reliable messaging that works everywhere' },
      { keywords: ['customer', 'segment', 'audience'], title: 'Customer Intelligence', description: 'Smart segmentation and targeting' },
      { keywords: ['workflow', 'automation', 'sequence'], title: 'Marketing Automation', description: 'Set up conversion workflows' },
      { keywords: ['analytics', 'performance', 'metrics'], title: 'Performance Analytics', description: 'Track and optimize campaign results' },
      { keywords: ['churn', 'retention', 'lost'], title: 'Customer Retention', description: 'Prevent churn and increase loyalty' },
      { keywords: ['conversion', 'optimize', 'improve'], title: 'Conversion Optimization', description: 'Increase sales and engagement' }
    ];

    return areas.filter(area => 
      area.keywords.some(keyword => keywords.includes(keyword))
    ).slice(0, 3);
  }
}

// Import LocalAI integration
import { LocalAIIntegration } from './localai-integration';

// Export the appropriate AI instance based on configuration
export const getAIInstance = () => {
  // PRIORITY 1: Check for OpenAI-only mode
  if (process.env.USE_OPENAI_ONLY === 'true') {
    if (process.env.OPENAI_API_KEY) {
      console.log('🌐 Using OpenAI (OpenAI-only mode enabled)');
      return new OpenAIIntegration();
    } else {
      console.error('❌ OpenAI-only mode enabled but no API key found!');
      throw new Error('OpenAI API key required when USE_OPENAI_ONLY=true');
    }
  }

  // PRIORITY 2: Check for Supreme-AI disabled mode
  if (process.env.SUPREME_AI_MODE === 'disabled') {
    if (process.env.OPENAI_API_KEY) {
      console.log('🌐 Using OpenAI (Supreme-AI disabled)');
      return new OpenAIIntegration();
    } else {
      console.log('🔧 Using Fallback AI (Supreme-AI disabled, no OpenAI key)');
      return new FallbackAI();
    }
  }

  // PRIORITY 3: Check explicit AI_PROVIDER setting
  const aiProvider = process.env.AI_PROVIDER?.toLowerCase() || 'auto';
  
  switch (aiProvider) {
    case 'localai':
      console.log('🏠 Using LocalAI for AI processing');
      return new LocalAIIntegration();
    
    case 'openai':
      if (process.env.OPENAI_API_KEY) {
        console.log('🌐 Using OpenAI for AI processing');
        return new OpenAIIntegration();
      } else {
        console.warn('OpenAI provider selected but no API key found, falling back to FallbackAI');
        return new FallbackAI();
      }
    
    case 'fallback':
      console.log('🔧 Using Fallback AI for AI processing');
      return new FallbackAI();
    
    default: // 'auto' - intelligent selection
      // Priority: OpenAI -> LocalAI -> Fallback (OpenAI first for better performance)
      if (process.env.OPENAI_API_KEY) {
        console.log('🌐 Auto-selected OpenAI for AI processing');
        return new OpenAIIntegration();
      } else if (process.env.LOCALAI_API_BASE_URL || process.env.ENABLE_LOCALAI === 'true') {
        console.log('🏠 Auto-selected LocalAI for AI processing');
        return new LocalAIIntegration();
      } else {
        console.log('🔧 Auto-selected Fallback AI for AI processing');
        return new FallbackAI();
      }
  }
}; 