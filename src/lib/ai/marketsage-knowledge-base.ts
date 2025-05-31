/**
 * MarketSage Knowledge Base
 * ========================
 * Comprehensive knowledge base for Supreme-AI to become a MarketSage expert
 * This data will be indexed into the RAG system for contextual help
 */

export interface MarketSageKnowledge {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: number; // 1-10, higher = more important
}

export const MARKETSAGE_KNOWLEDGE_BASE: MarketSageKnowledge[] = [
  // PLATFORM OVERVIEW
  {
    id: 'platform-overview',
    category: 'overview',
    title: 'MarketSage Platform Overview',
    content: `MarketSage is a comprehensive marketing automation platform designed specifically for the Nigerian and African market. It combines AI-powered intelligence with multi-channel marketing capabilities to help fintech companies, especially those in cross-border payments and remittances, convert visitors into verified customers.

Key Value Propositions:
- Real-time visitor intelligence and intent tracking
- AI-powered conversion prediction (78% accuracy)
- Multi-channel automation (Email, SMS, WhatsApp)
- African market-specific optimizations
- Fintech compliance and security features
- Revenue attribution and analytics

Target Market: Fintech companies, cross-border payment providers, remittance services, and African enterprises looking to improve their marketing ROI.`,
    tags: ['overview', 'platform', 'introduction', 'value-proposition'],
    priority: 10
  },

  // CORE MODULES
  {
    id: 'ai-intelligence-center',
    category: 'modules',
    title: 'AI Intelligence Center',
    content: `The AI Intelligence Center is MarketSage's most advanced feature, powered by Supreme-AI v3. It provides:

Features:
- Real-time AI performance monitoring
- Content intelligence analysis with Supreme scoring
- Customer segmentation and behavior analysis
- Predictive analytics with AutoML
- Interactive chat with Supreme-AI
- Memory-powered contextual responses

How to Use:
1. Navigate to Dashboard → AI Intelligence
2. View Overview tab for real-time metrics
3. Use Content Intelligence to analyze marketing materials
4. Check Customer Intelligence for segmentation insights
5. Chat with Supreme-AI for personalized help
6. Access AI Tools for content generation

Best Practices:
- Review AI insights daily for optimization opportunities
- Use the chat feature to ask specific questions about your data
- Monitor Supreme scores to improve content performance`,
    tags: ['ai', 'intelligence', 'analytics', 'supreme-ai', 'features'],
    priority: 9
  },

  {
    id: 'leadpulse-intelligence',
    category: 'modules',
    title: 'LeadPulse Intelligence',
    content: `LeadPulse is MarketSage's visitor intelligence system that tracks anonymous website visitors and predicts their conversion likelihood.

Features:
- Real-time visitor tracking
- Intent scoring (0-100)
- Geographic identification
- Behavioral pattern analysis
- High-intent visitor alerts
- Conversion prediction

How to Set Up:
1. Install LeadPulse tracking code on your website
2. Configure geographic targeting rules
3. Set up intent scoring parameters
4. Create automated workflows for high-intent visitors
5. Monitor visitor dashboard for insights

Use Cases:
- Identify visitors from target markets (Nigerian diaspora)
- Trigger personalized campaigns for high-intent visitors
- Optimize website content based on visitor behavior
- Improve conversion rates through behavioral insights`,
    tags: ['leadpulse', 'visitor-tracking', 'intelligence', 'conversion', 'setup'],
    priority: 8
  },

  {
    id: 'email-campaigns',
    category: 'modules',
    title: 'Email Campaign Management',
    content: `MarketSage's email system provides advanced automation and personalization for email marketing campaigns.

Features:
- Visual email template editor
- Automated drip campaigns
- Segmentation and personalization
- A/B testing capabilities
- Performance analytics
- Nigerian market optimizations

How to Create Email Campaigns:
1. Go to Email → Campaigns
2. Choose template or create from scratch
3. Set up audience segmentation
4. Configure automation triggers
5. Schedule or send immediately
6. Monitor performance metrics

Best Practices for African Markets:
- Use local languages (English, Hausa, Yoruba, Igbo)
- Optimize send times for African time zones
- Include mobile-friendly designs
- Use cultural context in messaging
- Focus on trust and security messaging`,
    tags: ['email', 'campaigns', 'automation', 'personalization', 'african-market'],
    priority: 7
  },

  {
    id: 'whatsapp-integration',
    category: 'modules',
    title: 'WhatsApp Business Integration',
    content: `WhatsApp is the highest-performing channel in African markets. MarketSage provides native WhatsApp Business API integration.

Features:
- WhatsApp Business API integration
- Automated conversation flows
- Template message management
- Rich media support (images, documents)
- Compliance with WhatsApp policies
- Performance analytics

Setup Process:
1. Connect WhatsApp Business API account
2. Verify business profile
3. Create message templates
4. Set up automated workflows
5. Configure customer support escalation
6. Test message delivery

Best Practices:
- Use approved message templates
- Respect opt-in requirements
- Provide value in every message
- Use rich media for engagement
- Set up quick reply options
- Monitor delivery rates`,
    tags: ['whatsapp', 'messaging', 'automation', 'africa', 'api', 'setup'],
    priority: 8
  },

  {
    id: 'workflow-automation',
    category: 'modules',
    title: 'Workflow Automation',
    content: `MarketSage's visual workflow editor allows you to create complex marketing automations without coding.

Features:
- Drag-and-drop workflow builder
- Multi-channel orchestration
- Behavioral triggers
- Time-based automation
- Conditional logic
- Performance tracking

Common Workflow Types:
1. Welcome sequences for new signups
2. Abandoned cart recovery
3. Lead nurturing campaigns
4. Customer onboarding flows
5. Re-engagement campaigns
6. Win-back sequences

How to Build Workflows:
1. Navigate to Workflows → Create New
2. Choose trigger (sign-up, page visit, etc.)
3. Add actions (send email, SMS, WhatsApp)
4. Set conditions and delays
5. Test workflow logic
6. Activate and monitor performance

Fintech-Specific Workflows:
- KYC reminder sequences
- Transfer completion follow-ups
- Security verification flows
- Compliance documentation requests`,
    tags: ['workflows', 'automation', 'visual-editor', 'triggers', 'fintech'],
    priority: 7
  },

  // CUSTOMER MANAGEMENT
  {
    id: 'contact-management',
    category: 'contacts',
    title: 'Contact Management System',
    content: `MarketSage's contact management system is optimized for African markets with region-specific fields and data handling.

Features:
- African phone number formats
- Geographic data (states, countries)
- Custom field management
- Segmentation capabilities
- Import/export functionality
- GDPR compliance

African Market Optimizations:
- Support for Nigerian phone formats (+234)
- State/region data for Nigeria, Ghana, Kenya
- Multi-language preference tracking
- Diaspora location tracking
- Family remittance patterns
- Payment behavior history

Contact Segmentation:
1. Geographic (by country, state, city)
2. Behavioral (engagement level, purchase history)
3. Demographic (age, income, occupation)
4. Intent-based (high, medium, low)
5. Channel preference (WhatsApp, SMS, Email)
6. Customer lifecycle stage

Best Practices:
- Keep contact data clean and updated
- Use progressive profiling to collect data gradually
- Respect privacy and consent preferences
- Segment contacts for targeted messaging
- Track engagement across all channels`,
    tags: ['contacts', 'management', 'african-market', 'segmentation', 'data'],
    priority: 6
  },

  // ANALYTICS & REPORTING
  {
    id: 'business-analytics',
    category: 'analytics',
    title: 'Business Analytics Dashboard',
    content: `MarketSage provides comprehensive analytics to track marketing performance and business metrics.

Key Metrics:
- Revenue attribution across channels
- Customer acquisition costs (CAC)
- Lifetime value (LTV) predictions
- Conversion rates by channel
- Engagement metrics
- Geographic performance

Dashboard Features:
- Real-time data updates
- Customizable date ranges
- Export capabilities
- Automated reports
- Performance comparisons
- Trend analysis

Reports Available:
1. Campaign Performance Reports
2. Channel Attribution Analysis
3. Customer Journey Analytics
4. Revenue Intelligence Reports
5. Geographic Performance Analysis
6. Engagement Trend Reports

How to Use Analytics:
1. Set up conversion tracking
2. Define key performance indicators
3. Create custom dashboards
4. Schedule automated reports
5. Analyze trends and patterns
6. Make data-driven optimizations`,
    tags: ['analytics', 'reporting', 'metrics', 'performance', 'data-driven'],
    priority: 6
  },

  // INTEGRATIONS
  {
    id: 'api-integrations',
    category: 'integrations',
    title: 'API and Integrations',
    content: `MarketSage offers extensive integration capabilities to connect with your existing tools and systems.

Available Integrations:
- CRM systems (HubSpot, Salesforce)
- E-commerce platforms (Shopify, WooCommerce)
- Payment processors (Flutterwave, Paystack)
- Analytics tools (Google Analytics, Facebook Pixel)
- Support systems (Zendesk, Intercom)
- Communication tools (Slack, Teams)

API Capabilities:
- RESTful API architecture
- Webhook support for real-time events
- Rate limiting and security
- Comprehensive documentation
- SDKs for popular languages

How to Set Up Integrations:
1. Go to Settings → Integrations
2. Select the service to connect
3. Follow authentication process
4. Configure sync settings
5. Test the connection
6. Monitor data flow

Custom Integration Support:
- API-first architecture
- Custom webhook endpoints
- White-label solutions
- Enterprise SSO
- Custom data mapping`,
    tags: ['api', 'integrations', 'webhooks', 'crm', 'ecommerce', 'payments'],
    priority: 5
  },

  // TROUBLESHOOTING
  {
    id: 'common-issues',
    category: 'troubleshooting',
    title: 'Common Issues and Solutions',
    content: `Here are solutions to common issues users encounter with MarketSage:

Email Delivery Issues:
- Check domain authentication (SPF, DKIM)
- Verify sender reputation
- Review content for spam triggers
- Check blacklist status
- Contact support for whitelist assistance

WhatsApp Setup Problems:
- Ensure WhatsApp Business API approval
- Verify business profile completion
- Check message template approval status
- Confirm webhook configuration
- Test with approved templates only

Integration Failures:
- Verify API credentials
- Check rate limiting status
- Review webhook endpoint accessibility
- Confirm data format requirements
- Test with minimal data first

Performance Issues:
- Clear browser cache
- Check internet connection
- Verify account limits
- Review system status page
- Contact support if persistent

Data Sync Problems:
- Check field mapping configuration
- Verify data format compatibility
- Review sync frequency settings
- Monitor error logs
- Restart failed sync processes`,
    tags: ['troubleshooting', 'issues', 'solutions', 'support', 'debugging'],
    priority: 4
  },

  // BEST PRACTICES
  {
    id: 'african-market-best-practices',
    category: 'best-practices',
    title: 'African Market Best Practices',
    content: `MarketSage is optimized for African markets. Here are best practices for success:

Cultural Considerations:
- Use respectful, family-oriented messaging
- Include trust and security emphasis
- Reference local currencies and contexts
- Use appropriate greetings and language
- Respect religious and cultural events

Channel Preferences:
- WhatsApp: Primary communication channel
- SMS: High open rates, use for urgent messages
- Email: Professional communications
- Voice calls: Personal touch for high-value customers

Timing Optimization:
- Nigeria: 10 AM - 2 PM, 6 PM - 9 PM (WAT)
- Ghana: Similar to Nigeria, adjust for GMT
- Kenya: 9 AM - 1 PM, 5 PM - 8 PM (EAT)
- South Africa: 9 AM - 5 PM (SAST)

Payment Behavior:
- Mobile money preference
- Trust-building required
- Family decision involvement
- Security concerns paramount
- Small initial transactions preferred

Compliance Requirements:
- Data residency in Africa
- Local regulatory compliance
- Privacy policy alignment
- Consent management
- Cross-border data handling`,
    tags: ['best-practices', 'african-market', 'cultural', 'timing', 'compliance'],
    priority: 8
  },

  // GETTING STARTED
  {
    id: 'getting-started-guide',
    category: 'getting-started',
    title: 'Complete Getting Started Guide',
    content: `Welcome to MarketSage! Here's your complete setup guide:

Step 1: Account Setup (Day 1)
- Complete profile information
- Verify email and phone
- Set up team members and roles
- Configure basic settings
- Review compliance requirements

Step 2: Platform Configuration (Week 1)
- Install LeadPulse tracking code
- Connect email sending domain
- Set up WhatsApp Business API
- Import existing contacts
- Create basic segments

Step 3: First Campaign (Week 2)
- Design welcome email template
- Create WhatsApp message templates
- Set up basic automation workflow
- Test with small audience
- Monitor initial performance

Step 4: Advanced Features (Month 1)
- Implement AI Intelligence features
- Set up advanced segmentation
- Create complex workflows
- Configure analytics tracking
- Optimize based on data

Step 5: Scale and Optimize (Ongoing)
- Analyze performance metrics
- A/B test campaigns
- Expand to new segments
- Integrate additional tools
- Leverage AI recommendations

Success Milestones:
- Week 1: Platform fully configured
- Month 1: First automated campaigns running
- Month 3: 2x improvement in conversion rates
- Month 6: 4x marketing ROI achieved`,
    tags: ['getting-started', 'setup', 'onboarding', 'guide', 'milestones'],
    priority: 9
  }
];

// Helper functions for knowledge base operations
export function getKnowledgeByCategory(category: string): MarketSageKnowledge[] {
  return MARKETSAGE_KNOWLEDGE_BASE.filter(item => item.category === category);
}

export function searchKnowledge(query: string): MarketSageKnowledge[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return MARKETSAGE_KNOWLEDGE_BASE
    .filter(item => {
      const searchText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    })
    .sort((a, b) => b.priority - a.priority);
}

export function getHighPriorityKnowledge(): MarketSageKnowledge[] {
  return MARKETSAGE_KNOWLEDGE_BASE
    .filter(item => item.priority >= 8)
    .sort((a, b) => b.priority - a.priority);
}

export function getAllKnowledgeForRAG(): string[] {
  return MARKETSAGE_KNOWLEDGE_BASE.map(item => 
    `${item.title}\n\n${item.content}\n\nTags: ${item.tags.join(', ')}`
  );
} 