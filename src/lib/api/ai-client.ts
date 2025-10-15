/**
 * AI Client - Backend API Integration
 * Replaces direct OpenAI calls with backend API requests
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp?: string;
  };
  message: string;
}

export interface ChatResponse {
  response: string;
  tokens: number;
  model: string;
  correlationId: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SupremeV3Response {
  answer: string;
  confidence: number;
  processingTime: number;
  source: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  taskExecution?: any;
}

export interface SentimentAnalysisResponse {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  confidence: number;
  emotionalTone: string[];
  keyPhrases: string[];
  culturalRelevance?: {
    market: string;
    score: number;
    feedback: string[];
  };
}

export interface ContentScoreResponse {
  overallScore: number;
  clarity: number;
  engagement: number;
  professionalism: number;
  callToAction: number;
  personalization: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface SubjectLineAnalysisResponse {
  score: number;
  predictedOpenRate: number;
  length: {
    characters: number;
    words: number;
    optimal: boolean;
    feedback: string;
  };
  urgency: number;
  personalization: number;
  clarity: number;
  suggestions: string[];
  emojis?: {
    count: number;
    appropriate: boolean;
    feedback: string;
  };
}

export interface ContentGenerationResponse {
  content: string;
  wordCount: number;
  tone: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class AIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = BACKEND_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    method: string = 'POST',
    body?: any,
  ): Promise<AIResponse<T>> {
    if (!this.token) {
      throw new Error('Authentication token not set. Please login first.');
    }

    const correlationId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await fetch(`${this.baseURL}/api/v2/ai${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before retrying.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to use AI features.');
        }

        throw new Error(data.error?.message || data.message || `API request failed: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while calling the AI service.');
    }
  }

  /**
   * Chat with AI
   */
  async chat(
    message: string,
    context?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<AIResponse<ChatResponse>> {
    return this.request<ChatResponse>('/chat', 'POST', {
      message,
      context,
      conversationHistory,
    });
  }

  /**
   * Supreme-v3 Advanced Question Answering
   */
  async askSupremeV3(
    message: string,
    context?: any,
    enableTaskExecution: boolean = false,
  ): Promise<AIResponse<SupremeV3Response>> {
    return this.request<SupremeV3Response>('/supreme-v3/question', 'POST', {
      message,
      context,
      enableTaskExecution,
    });
  }

  /**
   * Sentiment Analysis
   */
  async analyzeSentiment(
    content: string,
    contentType: string,
    market?: string,
  ): Promise<AIResponse<SentimentAnalysisResponse>> {
    return this.request<SentimentAnalysisResponse>('/content-analysis/sentiment', 'POST', {
      content,
      contentType,
      market,
    });
  }

  /**
   * Content Quality Scoring
   */
  async scoreContent(
    content: string,
    contentType: string,
  ): Promise<AIResponse<ContentScoreResponse>> {
    return this.request<ContentScoreResponse>('/content-analysis/score', 'POST', {
      content,
      contentType,
    });
  }

  /**
   * Subject Line Analysis
   */
  async analyzeSubjectLine(
    subjectLine: string,
    market?: string,
  ): Promise<AIResponse<SubjectLineAnalysisResponse>> {
    return this.request<SubjectLineAnalysisResponse>('/content-analysis/subject-line', 'POST', {
      subjectLine,
      market,
    });
  }

  /**
   * Content Generation
   */
  async generateContent(
    contentType: string,
    prompt: string,
    tone?: string,
    context?: any,
  ): Promise<AIResponse<ContentGenerationResponse>> {
    return this.request<ContentGenerationResponse>('/content-generation', 'POST', {
      contentType,
      prompt,
      tone,
      context,
    });
  }

  /**
   * Admin Stats (requires admin role)
   */
  async getAdminStats(): Promise<AIResponse<any>> {
    return this.request('/admin/stats', 'GET');
  }

  // ===============================
  // MULTIMODAL AI METHODS
  // ===============================

  /**
   * Analyze image using GPT-4 Vision
   */
  async analyzeVision(
    imageUrl: string,
    prompt: string,
    detail?: 'low' | 'high' | 'auto',
  ): Promise<AIResponse<any>> {
    return this.request('/vision/analyze', 'POST', {
      imageUrl,
      prompt,
      detail,
    });
  }

  /**
   * Transcribe audio using Whisper
   */
  async transcribeAudio(
    audioData: string, // base64 encoded audio
    language?: string,
  ): Promise<AIResponse<any>> {
    return this.request('/audio/transcribe', 'POST', {
      audioData,
      language,
    });
  }

  /**
   * Extract text from document using Vision
   */
  async extractDocument(imageUrl: string): Promise<AIResponse<any>> {
    return this.request('/document/extract', 'POST', {
      imageUrl,
    });
  }
}

// Export singleton instance
export const aiClient = new AIClient();

/**
 * Helper function for safe AI calls with error handling
 */
export async function safeAICall<T>(
  operation: () => Promise<AIResponse<T>>,
  fallbackValue?: T,
): Promise<T | null> {
  try {
    const result = await operation();

    if (result.success && result.data) {
      return result.data;
    }

    console.error('AI operation failed:', result.error?.message || result.message);
    return fallbackValue || null;
  } catch (error) {
    console.error('AI call error:', error);
    return fallbackValue || null;
  }
}
