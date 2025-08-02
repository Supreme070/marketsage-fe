import { BaseApiClient } from '../base/api-client';
import type {
  ChatDto,
  ChatResponse,
  ContentGenerationDto,
  ContentGenerationResponse,
  IntelligenceQueryDto,
  IntelligenceResponse,
  PredictiveAnalysisDto,
  PredictiveAnalysisResponse,
  TaskExecutionDto,
  TaskExecutionResponse,
  AISystemStatus,
  AIModelMetrics,
} from '../types/ai';
import type { ApiResponse } from '../types/common';

export class AIService extends BaseApiClient {
  /**
   * Send a chat message to AI
   */
  async chat(chatData: ChatDto): Promise<ChatResponse> {
    try {
      const response = await this.post<ApiResponse<ChatResponse>>('/ai/chat', chatData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stream chat responses (Server-Sent Events)
   */
  async streamChat(
    chatData: ChatDto,
    onMessage: (message: string) => void,
    onComplete?: (fullResponse: ChatResponse) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ ...chatData, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'message') {
                onMessage(parsed.content);
              } else if (parsed.type === 'complete' && onComplete) {
                onComplete(parsed.data);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        this.handleError(error);
      }
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(contentData: ContentGenerationDto): Promise<ContentGenerationResponse> {
    try {
      const response = await this.post<ApiResponse<ContentGenerationResponse>>(
        '/ai/content/generate',
        contentData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Optimize content for better performance
   */
  async optimizeContent(
    content: string,
    type: 'email' | 'sms' | 'social',
    targetMetrics?: string[]
  ): Promise<ContentGenerationResponse> {
    try {
      const response = await this.post<ApiResponse<ContentGenerationResponse>>(
        '/ai/content/optimize',
        {
          content,
          type,
          targetMetrics,
        }
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI intelligence insights
   */
  async getIntelligence(queryData: IntelligenceQueryDto): Promise<IntelligenceResponse> {
    try {
      const response = await this.post<ApiResponse<IntelligenceResponse>>(
        '/ai/intelligence/query',
        queryData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI-powered recommendations
   */
  async getRecommendations(
    context: {
      type: 'campaign' | 'content' | 'audience' | 'timing';
      data: Record<string, any>;
    }
  ): Promise<{
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      confidence: number;
      actionUrl?: string;
    }>;
  }> {
    try {
      const response = await this.post<ApiResponse<any>>(
        '/ai/intelligence/recommendations',
        context
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Run predictive analysis
   */
  async runPredictiveAnalysis(analysisData: PredictiveAnalysisDto): Promise<PredictiveAnalysisResponse> {
    try {
      const response = await this.post<ApiResponse<PredictiveAnalysisResponse>>(
        '/ai/predictive/analyze',
        analysisData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Predict campaign performance
   */
  async predictCampaignPerformance(
    campaignData: {
      type: string;
      subject?: string;
      content: string;
      targetAudience: {
        segmentIds?: string[];
        size: number;
      };
      sendTime?: Date;
    }
  ): Promise<{
    prediction: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
      unsubscribeRate: number;
    };
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }> {
    try {
      const response = await this.post<ApiResponse<any>>(
        '/ai/predictive/campaign-performance',
        campaignData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Execute AI task
   */
  async executeTask(taskData: TaskExecutionDto): Promise<TaskExecutionResponse> {
    try {
      const response = await this.post<ApiResponse<TaskExecutionResponse>>(
        '/ai/tasks/execute',
        taskData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get task execution status
   */
  async getTaskStatus(taskId: string): Promise<TaskExecutionResponse> {
    try {
      const response = await this.get<ApiResponse<TaskExecutionResponse>>(
        `/ai/tasks/${taskId}/status`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Cancel task execution
   */
  async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<ApiResponse<{ success: boolean; message: string }>>(
        `/ai/tasks/${taskId}/cancel`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI system status
   */
  async getSystemStatus(): Promise<AISystemStatus> {
    try {
      const response = await this.get<ApiResponse<AISystemStatus>>('/ai/system/status');
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI model metrics
   */
  async getModelMetrics(modelName?: string): Promise<AIModelMetrics[]> {
    try {
      const endpoint = modelName ? `/ai/system/models/${modelName}/metrics` : '/ai/system/models/metrics';
      const response = await this.get<ApiResponse<AIModelMetrics[]>>(endpoint);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Train AI model with new data
   */
  async trainModel(
    modelName: string,
    trainingData: {
      data: any[];
      validationSplit?: number;
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
    }
  ): Promise<{
    trainingId: string;
    status: 'started' | 'running' | 'completed' | 'failed';
    estimatedDuration?: number;
  }> {
    try {
      const response = await this.post<ApiResponse<any>>(
        `/ai/system/models/${modelName}/train`,
        trainingData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    scores: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }> {
    try {
      const response = await this.post<ApiResponse<any>>(
        '/ai/content/sentiment',
        { text }
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    totalRequests: number;
    tokensUsed: number;
    costEstimate: number;
    topFeatures: Array<{
      feature: string;
      usage: number;
    }>;
    timeSeriesData: Array<{
      timestamp: Date;
      requests: number;
      tokens: number;
    }>;
  }> {
    try {
      const response = await this.get<ApiResponse<any>>(
        `/ai/system/usage?period=${period}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get AI feature availability
   */
  async getFeatureAvailability(): Promise<{
    features: Array<{
      name: string;
      available: boolean;
      description: string;
      requiresPremium?: boolean;
    }>;
  }> {
    try {
      const response = await this.get<ApiResponse<any>>('/ai/system/features');
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }
}