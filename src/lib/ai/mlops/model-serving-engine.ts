/**
 * Model Serving Engine
 * ===================
 * Real-time model serving infrastructure for deployed ML models
 * Provides REST endpoints for model inference with load balancing and monitoring
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { modelRegistry } from './model-registry';
import { performanceMonitor } from './performance-monitor';

export interface ModelEndpoint {
  id: string;
  modelId: string;
  modelVersion: string;
  environment: 'development' | 'staging' | 'production';
  path: string;
  method: 'POST' | 'GET';
  status: 'active' | 'inactive' | 'maintenance';
  healthCheckPath: string;
  createdAt: Date;
  lastRequestAt?: Date;
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  loadBalancing: {
    strategy: 'round-robin' | 'least-connections' | 'weighted';
    weights?: Record<string, number>;
  };
}

export interface InferenceRequest {
  modelId: string;
  modelVersion?: string; // Uses latest production if not specified
  input: any;
  metadata?: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    features?: Record<string, any>;
  };
  options?: {
    timeout?: number;
    retries?: number;
    explainPrediction?: boolean;
  };
}

export interface InferenceResponse {
  requestId: string;
  modelId: string;
  modelVersion: string;
  prediction: any;
  confidence?: number;
  explanation?: {
    featureImportance: Record<string, number>;
    reasoning: string;
    factors: Array<{
      feature: string;
      value: any;
      impact: number;
      description: string;
    }>;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    modelPerformance: {
      accuracy: number;
      latency: number;
      version: string;
    };
  };
  warnings?: string[];
}

export interface ModelInstance {
  id: string;
  modelId: string;
  modelVersion: string;
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'warming-up';
  lastHealthCheck: Date;
  activeConnections: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  performanceMetrics: {
    requestsPerSecond: number;
    averageLatency: number;
    errorRate: number;
  };
}

class ModelServingEngine {
  private endpoints = new Map<string, ModelEndpoint>();
  private instances = new Map<string, ModelInstance[]>();
  private loadBalancers = new Map<string, any>();
  
  constructor() {
    this.initializeDefaultEndpoints();
    this.startHealthMonitoring();
    this.startPerformanceTracking();
  }

  /**
   * Initialize default model serving endpoints
   */
  private initializeDefaultEndpoints(): void {
    const defaultEndpoints: Partial<ModelEndpoint>[] = [
      {
        modelId: 'churn-prediction',
        path: '/api/ml/predict/churn',
        method: 'POST',
        environment: 'production',
        healthCheckPath: '/api/ml/health/churn',
        loadBalancing: { strategy: 'round-robin' }
      },
      {
        modelId: 'ltv-prediction',
        path: '/api/ml/predict/ltv',
        method: 'POST',
        environment: 'production',
        healthCheckPath: '/api/ml/health/ltv',
        loadBalancing: { strategy: 'weighted', weights: { primary: 0.7, secondary: 0.3 } }
      },
      {
        modelId: 'behavioral-segmentation',
        path: '/api/ml/predict/segment',
        method: 'POST',
        environment: 'production',
        healthCheckPath: '/api/ml/health/segment',
        loadBalancing: { strategy: 'least-connections' }
      },
      {
        modelId: 'content-intelligence',
        path: '/api/ml/analyze/content',
        method: 'POST',
        environment: 'production',
        healthCheckPath: '/api/ml/health/content',
        loadBalancing: { strategy: 'round-robin' }
      }
    ];

    defaultEndpoints.forEach(endpoint => {
      const fullEndpoint: ModelEndpoint = {
        id: `${endpoint.modelId}_${endpoint.environment}`,
        modelVersion: 'latest',
        status: 'active',
        createdAt: new Date(),
        requestCount: 0,
        errorCount: 0,
        averageLatency: 0,
        ...endpoint
      } as ModelEndpoint;

      this.endpoints.set(fullEndpoint.id, fullEndpoint);
    });

    logger.info('Model serving endpoints initialized', {
      endpointsCount: this.endpoints.size,
      endpoints: Array.from(this.endpoints.keys())
    });
  }

  /**
   * Process inference request
   */
  async processInference(request: InferenceRequest): Promise<InferenceResponse> {
    const tracer = trace.getTracer('model-serving');
    
    return tracer.startActiveSpan('model-inference', async (span) => {
      const startTime = Date.now();
      const requestId = request.metadata?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        span.setAttributes({
          'inference.request.id': requestId,
          'inference.model.id': request.modelId,
          'inference.model.version': request.modelVersion || 'latest',
          'inference.user.id': request.metadata?.userId || 'anonymous'
        });

        logger.info('Processing model inference request', {
          requestId,
          modelId: request.modelId,
          modelVersion: request.modelVersion || 'latest',
          userId: request.metadata?.userId
        });

        // Get model version to use
        const modelVersion = await this.resolveModelVersion(request.modelId, request.modelVersion);
        if (!modelVersion) {
          throw new Error(`Model not found or no production version available: ${request.modelId}`);
        }

        // Get healthy model instance
        const instance = await this.selectModelInstance(request.modelId, modelVersion);
        if (!instance) {
          throw new Error(`No healthy model instances available for ${request.modelId}@${modelVersion}`);
        }

        // Update endpoint metrics
        const endpoint = this.getEndpointForModel(request.modelId);
        if (endpoint) {
          endpoint.requestCount++;
          endpoint.lastRequestAt = new Date();
        }

        // Process the actual inference
        const prediction = await this.executeInference(instance, request);
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;

        // Update performance metrics
        if (endpoint) {
          endpoint.averageLatency = (endpoint.averageLatency + processingTime) / 2;
        }

        // Record performance metrics
        await performanceMonitor.recordPrediction(
          request.modelId,
          modelVersion,
          processingTime,
          true // success
        );

        // Generate explanation if requested
        let explanation = undefined;
        if (request.options?.explainPrediction) {
          explanation = await this.generatePredictionExplanation(request, prediction);
        }

        const response: InferenceResponse = {
          requestId,
          modelId: request.modelId,
          modelVersion,
          prediction,
          confidence: this.calculateConfidence(prediction),
          explanation,
          metadata: {
            processingTime,
            timestamp: new Date(),
            modelPerformance: {
              accuracy: instance.performanceMetrics.errorRate > 0 ? 
                (1 - instance.performanceMetrics.errorRate) * 100 : 95,
              latency: processingTime,
              version: modelVersion
            }
          },
          warnings: this.generateWarnings(request, prediction, instance)
        };

        span.setAttributes({
          'inference.response.processing_time': processingTime,
          'inference.response.confidence': response.confidence || 0,
          'inference.response.success': true
        });

        logger.info('Model inference completed successfully', {
          requestId,
          modelId: request.modelId,
          processingTime,
          confidence: response.confidence
        });

        return response;

      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        // Update error metrics
        const endpoint = this.getEndpointForModel(request.modelId);
        if (endpoint) {
          endpoint.errorCount++;
        }

        // Record failed prediction
        await performanceMonitor.recordPrediction(
          request.modelId,
          request.modelVersion || 'latest',
          processingTime,
          false // failed
        );

        span.setStatus({ code: 2, message: String(error) });
        span.setAttributes({
          'inference.response.error': true,
          'inference.response.processing_time': processingTime
        });

        logger.error('Model inference failed', {
          requestId,
          modelId: request.modelId,
          error: error instanceof Error ? error.message : String(error),
          processingTime
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Resolve model version to use for inference
   */
  private async resolveModelVersion(modelId: string, requestedVersion?: string): Promise<string | null> {
    if (requestedVersion && requestedVersion !== 'latest') {
      // Use specific version if requested
      const version = await modelRegistry.getModelVersion(modelId, requestedVersion);
      return version ? requestedVersion : null;
    }

    // Get latest production version
    const productionVersion = await modelRegistry.getCurrentProductionVersion(modelId);
    return productionVersion?.version || null;
  }

  /**
   * Select best model instance for inference
   */
  private async selectModelInstance(modelId: string, modelVersion: string): Promise<ModelInstance | null> {
    const instances = this.instances.get(`${modelId}@${modelVersion}`) || [];
    const healthyInstances = instances.filter(instance => instance.status === 'healthy');

    if (healthyInstances.length === 0) {
      return null;
    }

    // Get endpoint for load balancing strategy
    const endpoint = this.getEndpointForModel(modelId);
    const strategy = endpoint?.loadBalancing.strategy || 'round-robin';

    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(healthyInstances);
      case 'least-connections':
        return this.selectLeastConnections(healthyInstances);
      case 'weighted':
        return this.selectWeighted(healthyInstances, endpoint?.loadBalancing.weights || {});
      default:
        return healthyInstances[0];
    }
  }

  /**
   * Load balancing strategies
   */
  private selectRoundRobin(instances: ModelInstance[]): ModelInstance {
    // Simple round-robin implementation
    const index = Date.now() % instances.length;
    return instances[index];
  }

  private selectLeastConnections(instances: ModelInstance[]): ModelInstance {
    return instances.reduce((least, current) => 
      current.activeConnections < least.activeConnections ? current : least
    );
  }

  private selectWeighted(instances: ModelInstance[], weights: Record<string, number>): ModelInstance {
    // Simple weighted selection (would be more sophisticated in production)
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < instances.length; i++) {
      const instanceWeight = weights[instances[i].id] || 1;
      currentWeight += instanceWeight;
      if (random <= currentWeight) {
        return instances[i];
      }
    }
    
    return instances[0];
  }

  /**
   * Execute inference on selected instance
   */
  private async executeInference(instance: ModelInstance, request: InferenceRequest): Promise<any> {
    // Simulate different model types and their inference logic
    switch (request.modelId) {
      case 'churn-prediction':
        return this.executeChurnPrediction(request.input);
      
      case 'ltv-prediction':
        return this.executeLTVPrediction(request.input);
      
      case 'behavioral-segmentation':
        return this.executeBehavioralSegmentation(request.input);
      
      case 'content-intelligence':
        return this.executeContentAnalysis(request.input);
      
      default:
        return this.executeGenericPrediction(request.input);
    }
  }

  /**
   * Model-specific inference implementations
   */
  private async executeChurnPrediction(input: any): Promise<any> {
    // Simulate churn prediction
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const churnProbability = Math.random();
    const riskLevel = churnProbability > 0.7 ? 'high' : churnProbability > 0.3 ? 'medium' : 'low';
    
    return {
      churnProbability: Math.round(churnProbability * 100) / 100,
      riskLevel,
      recommendedActions: this.getChurnRecommendations(riskLevel),
      timeToChurn: Math.round(30 + Math.random() * 60) // days
    };
  }

  private async executeLTVPrediction(input: any): Promise<any> {
    // Simulate LTV prediction
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    
    const ltv = 50 + Math.random() * 500; // $50-$550
    const confidence = 0.7 + Math.random() * 0.3;
    
    return {
      predictedLTV: Math.round(ltv * 100) / 100,
      currency: 'USD',
      timeframe: '12_months',
      confidence: Math.round(confidence * 100) / 100,
      segments: ['high_value', 'engaged_user'],
      factors: [
        { name: 'engagement_score', impact: 0.4, value: 8.5 },
        { name: 'purchase_frequency', impact: 0.3, value: 2.1 },
        { name: 'average_order_value', impact: 0.3, value: 45.2 }
      ]
    };
  }

  private async executeBehavioralSegmentation(input: any): Promise<any> {
    // Simulate behavioral segmentation
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));
    
    const segments = ['power_user', 'casual_user', 'dormant_user', 'new_user'];
    const primarySegment = segments[Math.floor(Math.random() * segments.length)];
    
    return {
      primarySegment,
      confidence: 0.8 + Math.random() * 0.2,
      alternativeSegments: segments.filter(s => s !== primarySegment).slice(0, 2),
      behavioralPatterns: [
        'high_engagement_weekdays',
        'mobile_preferred',
        'feature_explorer'
      ],
      recommendations: this.getSegmentRecommendations(primarySegment)
    };
  }

  private async executeContentAnalysis(input: any): Promise<any> {
    // Simulate content intelligence analysis
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    return {
      sentiment: {
        overall: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
        confidence: 0.7 + Math.random() * 0.3,
        scores: {
          positive: Math.random(),
          neutral: Math.random(),
          negative: Math.random()
        }
      },
      topics: [
        { name: 'product_feedback', relevance: 0.8 },
        { name: 'customer_service', relevance: 0.6 },
        { name: 'pricing', relevance: 0.4 }
      ],
      intent: {
        primary: 'information_seeking',
        confidence: 0.85,
        alternatives: ['complaint', 'compliment']
      },
      urgency: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
    };
  }

  private async executeGenericPrediction(input: any): Promise<any> {
    // Generic prediction for unknown models
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      prediction: Math.random(),
      confidence: 0.6 + Math.random() * 0.4,
      category: 'unknown',
      timestamp: new Date()
    };
  }

  /**
   * Generate prediction explanation
   */
  private async generatePredictionExplanation(request: InferenceRequest, prediction: any): Promise<any> {
    // Simulate AI explanation generation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      featureImportance: {
        'engagement_score': 0.35,
        'purchase_history': 0.25,
        'demographics': 0.20,
        'behavioral_patterns': 0.20
      },
      reasoning: `Based on the input features, the model identified key patterns that led to this prediction. The most influential factors were engagement score and purchase history.`,
      factors: [
        {
          feature: 'engagement_score',
          value: 8.5,
          impact: 0.35,
          description: 'High engagement score indicates active user behavior'
        },
        {
          feature: 'purchase_history',
          value: 2.1,
          impact: 0.25,
          description: 'Purchase frequency suggests strong customer commitment'
        }
      ]
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(prediction: any): number {
    if (typeof prediction === 'object' && prediction.confidence) {
      return prediction.confidence;
    }
    
    // Default confidence calculation
    return 0.7 + Math.random() * 0.3;
  }

  /**
   * Generate warnings for prediction
   */
  private generateWarnings(request: InferenceRequest, prediction: any, instance: ModelInstance): string[] {
    const warnings: string[] = [];
    
    // Check model performance
    if (instance.performanceMetrics.errorRate > 0.1) {
      warnings.push('Model instance has elevated error rate');
    }
    
    // Check latency
    if (instance.performanceMetrics.averageLatency > 1000) {
      warnings.push('Model instance experiencing high latency');
    }
    
    // Check prediction confidence
    const confidence = this.calculateConfidence(prediction);
    if (confidence < 0.5) {
      warnings.push('Low confidence prediction - consider manual review');
    }
    
    return warnings;
  }

  /**
   * Helper methods for recommendations
   */
  private getChurnRecommendations(riskLevel: string): string[] {
    switch (riskLevel) {
      case 'high':
        return ['Immediate engagement campaign', 'Personal outreach', 'Special retention offer'];
      case 'medium':
        return ['Targeted email campaign', 'Feature education', 'Usage analytics review'];
      case 'low':
        return ['Continue regular engagement', 'Monitor usage patterns'];
      default:
        return ['Monitor customer health'];
    }
  }

  private getSegmentRecommendations(segment: string): string[] {
    switch (segment) {
      case 'power_user':
        return ['Advanced feature access', 'Beta program invitation', 'Referral program'];
      case 'casual_user':
        return ['Usage tips', 'Feature highlights', 'Engagement campaigns'];
      case 'dormant_user':
        return ['Re-engagement campaign', 'Value demonstration', 'Feedback collection'];
      case 'new_user':
        return ['Onboarding sequence', 'Tutorial completion', 'Early value delivery'];
      default:
        return ['Personalized experience'];
    }
  }

  /**
   * Utility methods
   */
  private getEndpointForModel(modelId: string): ModelEndpoint | undefined {
    return Array.from(this.endpoints.values()).find(endpoint => endpoint.modelId === modelId);
  }

  /**
   * Health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        logger.error('Health monitoring failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 30000); // Check every 30 seconds

    logger.info('Model serving health monitoring started');
  }

  private async performHealthChecks(): Promise<void> {
    for (const [key, instances] of this.instances.entries()) {
      for (const instance of instances) {
        try {
          // Simulate health check
          const healthy = Math.random() > 0.1; // 90% uptime simulation
          instance.status = healthy ? 'healthy' : 'unhealthy';
          instance.lastHealthCheck = new Date();
          
          if (!healthy) {
            logger.warn('Model instance unhealthy', {
              instanceId: instance.id,
              modelKey: key
            });
          }
        } catch (error) {
          instance.status = 'unhealthy';
          logger.error('Health check failed', {
            instanceId: instance.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }

  /**
   * Performance tracking
   */
  private startPerformanceTracking(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute

    logger.info('Model serving performance tracking started');
  }

  private updatePerformanceMetrics(): void {
    for (const endpoint of this.endpoints.values()) {
      // Calculate requests per minute
      const requestsPerMinute = Math.max(0, endpoint.requestCount / 60);
      
      // Calculate error rate
      const errorRate = endpoint.requestCount > 0 ? 
        endpoint.errorCount / endpoint.requestCount : 0;
      
      logger.info('Endpoint performance metrics', {
        endpointId: endpoint.id,
        modelId: endpoint.modelId,
        requestsPerMinute,
        errorRate,
        averageLatency: endpoint.averageLatency
      });
    }
  }

  /**
   * Public API methods
   */
  async getEndpointStatus(endpointId: string): Promise<ModelEndpoint | null> {
    return this.endpoints.get(endpointId) || null;
  }

  async getAllEndpoints(): Promise<ModelEndpoint[]> {
    return Array.from(this.endpoints.values());
  }

  async getInstanceHealth(modelId: string, modelVersion: string): Promise<ModelInstance[]> {
    return this.instances.get(`${modelId}@${modelVersion}`) || [];
  }
}

// Export singleton instance
export const modelServingEngine = new ModelServingEngine();

// Convenience functions
export async function processModelInference(request: InferenceRequest): Promise<InferenceResponse> {
  return modelServingEngine.processInference(request);
}

export async function getServingStatus(): Promise<{
  endpoints: ModelEndpoint[];
  totalRequests: number;
  totalErrors: number;
  averageLatency: number;
}> {
  const endpoints = await modelServingEngine.getAllEndpoints();
  
  const totalRequests = endpoints.reduce((sum, ep) => sum + ep.requestCount, 0);
  const totalErrors = endpoints.reduce((sum, ep) => sum + ep.errorCount, 0);
  const averageLatency = endpoints.length > 0 ? 
    endpoints.reduce((sum, ep) => sum + ep.averageLatency, 0) / endpoints.length : 0;

  return {
    endpoints,
    totalRequests,
    totalErrors,
    averageLatency
  };
}