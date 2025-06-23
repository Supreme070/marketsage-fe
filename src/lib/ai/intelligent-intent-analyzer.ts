/**
 * Intelligent Intent Analyzer
 * ===========================
 * Uses OpenAI-powered NLP to understand user intents from natural language
 * Handles any phrasing style and extracts structured data
 */

import { getAIInstance } from '@/lib/ai/openai-integration';
import { logger } from '@/lib/logger';

export interface IntelligentIntent {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FETCH' | 'ASSIGN' | 'ANALYZE' | 'UNKNOWN';
  entity: 'CONTACT' | 'WORKFLOW' | 'CAMPAIGN' | 'TASK' | 'SEGMENT' | 'TEMPLATE' | 'LIST' | 'INTEGRATION' | 'JOURNEY' | 'ABTEST' | 'DATA' | 'UNKNOWN';
  confidence: number;
  data: Record<string, any>;
  originalQuery: string;
  suggestedResponse?: string;
}

export interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface WorkflowData {
  name?: string;
  type?: string;
  market?: string;
  industry?: string;
  steps?: string[];
  objective?: string;
}

export interface CampaignData {
  name?: string;
  type?: 'email' | 'sms' | 'whatsapp';
  market?: string;
  audience?: string;
  content?: string;
  objective?: string;
}

export interface TaskData {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  type?: string;
}

export interface DataFetchRequest {
  source?: 'leadpulse' | 'analytics' | 'users' | 'campaigns';
  timeRange?: string;
  filters?: Record<string, any>;
  format?: 'summary' | 'detailed' | 'chart';
}

class IntelligentIntentAnalyzer {
  private aiInstance: any;

  constructor() {
    this.aiInstance = getAIInstance();
  }

  /**
   * Main method to analyze user intent from natural language
   */
  async analyzeIntent(userQuery: string): Promise<IntelligentIntent> {
    try {
      logger.info('Analyzing user intent', { query: userQuery.substring(0, 100) });

      // Use OpenAI to understand the intent
      const intentAnalysis = await this.performIntentAnalysis(userQuery);
      
      // Extract structured data based on detected intent
      const structuredData = await this.extractStructuredData(userQuery, intentAnalysis);

      const result: IntelligentIntent = {
        action: intentAnalysis.action as IntelligentIntent['action'],
        entity: intentAnalysis.entity as IntelligentIntent['entity'],
        confidence: intentAnalysis.confidence,
        data: structuredData,
        originalQuery: userQuery,
        suggestedResponse: intentAnalysis.suggestedResponse
      };

      logger.info('Intent analysis completed', {
        action: result.action,
        entity: result.entity,
        confidence: result.confidence,
        hasData: Object.keys(result.data).length > 0
      });

      return result;
    } catch (error) {
      logger.error('Intent analysis failed', { 
        error: error instanceof Error ? error.message : String(error),
        query: userQuery.substring(0, 100)
      });

      return {
        action: 'UNKNOWN',
        entity: 'UNKNOWN',
        confidence: 0,
        data: {},
        originalQuery: userQuery,
        suggestedResponse: 'I couldn\'t understand your request. Could you please rephrase it?'
      };
    }
  }

  /**
   * Use OpenAI to analyze the user's intent
   */
  private async performIntentAnalysis(userQuery: string): Promise<{
    action: string;
    entity: string;
    confidence: number;
    suggestedResponse?: string;
  }> {
    const analysisPrompt = `
You are an AI assistant for MarketSage, an African fintech marketing automation platform. 
Analyze the user's request and determine their intent.

User Query: "${userQuery}"

Please analyze this query and respond with a JSON object containing:
{
  "action": "CREATE|UPDATE|DELETE|FETCH|ASSIGN|ANALYZE",
  "entity": "CONTACT|WORKFLOW|CAMPAIGN|TASK|SEGMENT|TEMPLATE|LIST|INTEGRATION|JOURNEY|ABTEST|DATA",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your analysis",
  "suggestedResponse": "Appropriate response if action is unclear"
}

Action definitions:
- CREATE: User wants to create something new (contact, workflow, campaign, etc.)
- UPDATE: User wants to modify existing data
- DELETE: User wants to remove something
- FETCH: User wants to retrieve/view data (analytics, reports, etc.)
- ASSIGN: User wants to assign tasks or responsibilities
- ANALYZE: User wants analysis or insights

Entity definitions:
- CONTACT: Person/customer information
- WORKFLOW: Automated business processes
- CAMPAIGN: Marketing campaigns (email, SMS, WhatsApp)
- TASK: Work assignments or todos
- SEGMENT: Customer groups/audiences
- TEMPLATE: Reusable content templates
- DATA: Analytics, reports, or system data

Examples:
"create a contact named John" → {"action": "CREATE", "entity": "CONTACT", "confidence": 0.95}
"show me leadpulse data" → {"action": "FETCH", "entity": "DATA", "confidence": 0.9}
"assign task to team lead" → {"action": "ASSIGN", "entity": "TASK", "confidence": 0.9}
"build workflow for onboarding" → {"action": "CREATE", "entity": "WORKFLOW", "confidence": 0.95}

Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        analysisPrompt,
        'You are a precise intent analysis AI. Respond only with valid JSON.',
        [],
        {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.1, // Low temperature for consistent analysis
          maxTokens: 300
        }
      );

      // Parse the JSON response
      const analysis = JSON.parse(response.answer);
      
      return {
        action: analysis.action || 'UNKNOWN',
        entity: analysis.entity || 'UNKNOWN',
        confidence: analysis.confidence || 0,
        suggestedResponse: analysis.suggestedResponse
      };
    } catch (error) {
      logger.warn('Intent analysis parsing failed, using fallback', { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback to simple pattern matching
      return this.fallbackIntentAnalysis(userQuery);
    }
  }

  /**
   * Extract structured data based on the detected intent
   */
  private async extractStructuredData(userQuery: string, intent: any): Promise<Record<string, any>> {
    switch (intent.entity) {
      case 'CONTACT':
        return await this.extractContactData(userQuery);
      case 'WORKFLOW':
        return await this.extractWorkflowData(userQuery);
      case 'CAMPAIGN':
        return await this.extractCampaignData(userQuery);
      case 'TASK':
        return await this.extractTaskData(userQuery);
      case 'DATA':
        return await this.extractDataFetchRequest(userQuery);
      default:
        return await this.extractGenericData(userQuery);
    }
  }

  /**
   * Extract contact information from natural language
   */
  private async extractContactData(userQuery: string): Promise<ContactData> {
    const extractionPrompt = `
Extract contact information from this request: "${userQuery}"

Please extract any available contact details and respond with JSON:
{
  "name": "Full name if mentioned",
  "email": "Email address if mentioned", 
  "phone": "Phone number if mentioned",
  "company": "Company name if mentioned",
  "notes": "Any additional notes or context"
}

Examples:
"create contact Supreme Oyewumi, phone +234806..." → {"name": "Supreme Oyewumi", "phone": "+2348061364545"}
"add john@example.com to contacts" → {"email": "john@example.com"}

Only include fields that are explicitly mentioned. Use null for missing fields.
Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        extractionPrompt,
        'Extract contact data as JSON only.',
        [],
        { temperature: 0.1, maxTokens: 200 }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      logger.warn('Contact data extraction failed', { error: error instanceof Error ? error.message : String(error) });
      return this.fallbackContactExtraction(userQuery);
    }
  }

  /**
   * Extract workflow information from natural language
   */
  private async extractWorkflowData(userQuery: string): Promise<WorkflowData> {
    const extractionPrompt = `
Extract workflow information from this request: "${userQuery}"

Please extract workflow details and respond with JSON:
{
  "name": "Workflow name or title",
  "type": "onboarding|retention|nurturing|general",
  "market": "nigeria|kenya|ghana|south_africa|multi_market", 
  "industry": "fintech|banking|general",
  "objective": "Main goal of the workflow",
  "steps": ["List of workflow steps if mentioned"]
}

Examples:
"create Nigerian onboarding workflow" → {"type": "onboarding", "market": "nigeria"}
"build retention workflow for Ghana" → {"type": "retention", "market": "ghana"}

Only include fields that can be inferred. Use null for missing fields.
Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        extractionPrompt,
        'Extract workflow data as JSON only.',
        [],
        { temperature: 0.1, maxTokens: 300 }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      logger.warn('Workflow data extraction failed', { error: error instanceof Error ? error.message : String(error) });
      return { type: 'general', market: 'multi_market' };
    }
  }

  /**
   * Extract campaign information from natural language
   */
  private async extractCampaignData(userQuery: string): Promise<CampaignData> {
    const extractionPrompt = `
Extract campaign information from this request: "${userQuery}"

Please extract campaign details and respond with JSON:
{
  "name": "Campaign name or title",
  "type": "email|sms|whatsapp",
  "market": "nigeria|kenya|ghana|south_africa|multi_market",
  "audience": "Target audience description",
  "objective": "Campaign goal or purpose",
  "content": "Any content details mentioned"
}

Examples:
"build WhatsApp campaign for Kenyan diaspora" → {"type": "whatsapp", "market": "kenya", "audience": "diaspora"}
"create email campaign for new users" → {"type": "email", "audience": "new users"}

Only include fields that can be inferred. Use null for missing fields.
Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        extractionPrompt,
        'Extract campaign data as JSON only.',
        [],
        { temperature: 0.1, maxTokens: 300 }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      logger.warn('Campaign data extraction failed', { error: error instanceof Error ? error.message : String(error) });
      return { type: 'email', market: 'multi_market' };
    }
  }

  /**
   * Extract task information from natural language
   */
  private async extractTaskData(userQuery: string): Promise<TaskData> {
    const extractionPrompt = `
Extract task information from this request: "${userQuery}"

Please extract task details and respond with JSON:
{
  "title": "Task title or summary",
  "description": "Task description",
  "assignee": "Who should be assigned (role or name)",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "type": "optimization|review|creation|general",
  "dueDate": "Any deadline mentioned"
}

Examples:
"assign urgent task to marketing lead" → {"priority": "URGENT", "assignee": "marketing lead"}
"create review task for campaign" → {"type": "review", "title": "campaign review"}

Only include fields that can be inferred. Use null for missing fields.
Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        extractionPrompt,
        'Extract task data as JSON only.',
        [],
        { temperature: 0.1, maxTokens: 300 }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      logger.warn('Task data extraction failed', { error: error instanceof Error ? error.message : String(error) });
      return { priority: 'MEDIUM', type: 'general' };
    }
  }

  /**
   * Extract data fetch request information
   */
  private async extractDataFetchRequest(userQuery: string): Promise<DataFetchRequest> {
    const extractionPrompt = `
Extract data request information from this query: "${userQuery}"

Please extract data request details and respond with JSON:
{
  "source": "leadpulse|analytics|users|campaigns|contacts",
  "timeRange": "today|week|month|year|custom",
  "format": "summary|detailed|chart",
  "filters": {"any": "specific filters mentioned"}
}

Examples:
"show me leadpulse data" → {"source": "leadpulse", "format": "summary"}
"get analytics for last week" → {"source": "analytics", "timeRange": "week"}
"fetch user data from this month" → {"source": "users", "timeRange": "month"}

Only include fields that can be inferred. Use null for missing fields.
Respond with valid JSON only.`;

    try {
      const response = await this.aiInstance.generateResponse(
        extractionPrompt,
        'Extract data request as JSON only.',
        [],
        { temperature: 0.1, maxTokens: 200 }
      );

      return JSON.parse(response.answer);
    } catch (error) {
      logger.warn('Data fetch extraction failed', { error: error instanceof Error ? error.message : String(error) });
      return { source: 'analytics', format: 'summary' };
    }
  }

  /**
   * Extract generic data for unknown entities
   */
  private async extractGenericData(userQuery: string): Promise<Record<string, any>> {
    // Simple keyword extraction for fallback
    const data: Record<string, any> = {};
    
    const lowerQuery = userQuery.toLowerCase();
    
    // Extract common patterns
    if (lowerQuery.includes('urgent')) data.priority = 'URGENT';
    if (lowerQuery.includes('high priority')) data.priority = 'HIGH';
    if (lowerQuery.includes('nigeria')) data.market = 'nigeria';
    if (lowerQuery.includes('kenya')) data.market = 'kenya';
    if (lowerQuery.includes('ghana')) data.market = 'ghana';
    if (lowerQuery.includes('email')) data.type = 'email';
    if (lowerQuery.includes('whatsapp')) data.type = 'whatsapp';
    if (lowerQuery.includes('sms')) data.type = 'sms';

    return data;
  }

  /**
   * Fallback intent analysis using simple pattern matching
   */
  private fallbackIntentAnalysis(userQuery: string): {
    action: string;
    entity: string;
    confidence: number;
    suggestedResponse?: string;
  } {
    const lowerQuery = userQuery.toLowerCase();
    
    // Simple pattern matching
    if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('make') || lowerQuery.includes('build')) {
      if (lowerQuery.includes('contact')) return { action: 'CREATE', entity: 'CONTACT', confidence: 0.8 };
      if (lowerQuery.includes('workflow')) return { action: 'CREATE', entity: 'WORKFLOW', confidence: 0.8 };
      if (lowerQuery.includes('campaign')) return { action: 'CREATE', entity: 'CAMPAIGN', confidence: 0.8 };
      if (lowerQuery.includes('task')) return { action: 'CREATE', entity: 'TASK', confidence: 0.8 };
      return { action: 'CREATE', entity: 'UNKNOWN', confidence: 0.6 };
    }
    
    if (lowerQuery.includes('assign') || lowerQuery.includes('delegate')) {
      return { action: 'ASSIGN', entity: 'TASK', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('show') || lowerQuery.includes('get') || lowerQuery.includes('fetch') || lowerQuery.includes('data')) {
      return { action: 'FETCH', entity: 'DATA', confidence: 0.7 };
    }
    
    return { 
      action: 'UNKNOWN', 
      entity: 'UNKNOWN', 
      confidence: 0.3,
      suggestedResponse: 'I need more information to understand your request. Could you please be more specific?'
    };
  }

  /**
   * Fallback contact extraction using regex patterns
   */
  private fallbackContactExtraction(userQuery: string): ContactData {
    const data: ContactData = {};
    
    // Extract email
    const emailMatch = userQuery.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) data.email = emailMatch[0];
    
    // Extract phone number
    const phoneMatch = userQuery.match(/[\+]?[\d\s\-\(\)]{10,}/);
    if (phoneMatch) data.phone = phoneMatch[0].replace(/\s/g, '');
    
    // Extract name (simple heuristic)
    const nameMatch = userQuery.match(/(?:contact|named?|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (nameMatch) data.name = nameMatch[1];
    
    return data;
  }
}

// Export singleton instance
export const intelligentIntentAnalyzer = new IntelligentIntentAnalyzer();