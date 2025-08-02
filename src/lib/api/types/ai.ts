// AI related types based on backend DTOs

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatDto {
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface ContentGenerationDto {
  type: 'email' | 'sms' | 'social' | 'blog' | 'ad_copy';
  prompt: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'persuasive';
  length?: 'short' | 'medium' | 'long';
  targetAudience?: string;
  brandVoice?: string;
  customInstructions?: string;
}

export interface ContentGenerationResponse {
  generatedContent: string;
  alternatives?: string[];
  metadata: {
    wordCount: number;
    readabilityScore?: number;
    sentimentScore?: number;
    keywords?: string[];
  };
  suggestions?: string[];
}

export interface IntelligenceQueryDto {
  query: string;
  scope?: 'campaigns' | 'contacts' | 'analytics' | 'general';
  filters?: Record<string, any>;
  includeRecommendations?: boolean;
}

export interface IntelligenceResponse {
  answer: string;
  sources?: Array<{
    type: string;
    id: string;
    title: string;
    relevance: number;
  }>;
  recommendations?: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionUrl?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface PredictiveAnalysisDto {
  analysisType: 'campaign_performance' | 'churn_prediction' | 'lead_scoring' | 'send_time_optimization';
  dataScope: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    campaignIds?: string[];
    segmentIds?: string[];
  };
  parameters?: Record<string, any>;
}

export interface PredictiveAnalysisResponse {
  analysisType: string;
  predictions: Array<{
    id: string;
    prediction: any;
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }>;
  summary: {
    totalPredictions: number;
    averageConfidence: number;
    topFactors: string[];
  };
  recommendations: Array<{
    action: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  generatedAt: Date;
}

export interface TaskExecutionDto {
  taskType: 'campaign_creation' | 'segment_update' | 'report_generation' | 'data_analysis';
  parameters: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
  scheduledFor?: Date;
  requiresApproval?: boolean;
}

export interface TaskExecutionResponse {
  taskId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'pending_approval';
  result?: any;
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
  estimatedCompletion?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AISystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'online' | 'offline' | 'degraded';
    responseTime?: number;
    lastChecked: Date;
  }>;
  models: Array<{
    name: string;
    version: string;
    status: 'loaded' | 'loading' | 'failed';
    accuracy?: number;
    lastUpdated: Date;
  }>;
  usage: {
    requestsToday: number;
    tokensUsed: number;
    remainingQuota: number;
  };
}

export interface AIModelMetrics {
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDate: Date;
  lastEvaluated: Date;
  performanceTrend: Array<{
    date: Date;
    accuracy: number;
    volume: number;
  }>;
}