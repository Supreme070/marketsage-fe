/**
 * Batch Prediction API
 * ====================
 * Efficiently process multiple predictions using vectorized operations,
 * worker pools, and smart batching strategies.
 */

import { logger } from '@/lib/logger';
import { aiModelCache, type CachedModel } from './model-cache';
import { aiWorkerManager } from './worker-manager';

export interface BatchPredictionRequest {
  modelId: string;
  inputs: number[][];
  options?: {
    batchSize?: number;
    priority?: 'low' | 'medium' | 'high';
    timeout?: number; // milliseconds
    includeConfidence?: boolean;
    includeIntermediateResults?: boolean;
  };
}

export interface BatchPredictionResult {
  predictions: number[][];
  confidence?: number[];
  processingTime: number;
  batchInfo: {
    totalSamples: number;
    batchesProcessed: number;
    avgBatchTime: number;
  };
  intermediateResults?: Array<{
    batchIndex: number;
    predictions: number[][];
    confidence?: number[];
    processingTime: number;
  }>;
}

export interface BatchPredictionStats {
  totalRequests: number;
  totalSamples: number;
  avgLatency: number;
  throughputPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
}

export class BatchPredictor {
  private stats = {
    totalRequests: 0,
    totalSamples: 0,
    totalLatency: 0,
    totalErrors: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  private processingQueue: Array<{
    request: BatchPredictionRequest;
    resolve: (result: BatchPredictionResult) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  
  private isProcessing = false;
  
  /**
   * Process batch predictions
   */
  async predict(request: BatchPredictionRequest): Promise<BatchPredictionResult> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.totalSamples += request.inputs.length;
    
    try {
      // Validate request
      this.validateRequest(request);
      
      // Get model from cache
      const model = await aiModelCache.get(request.modelId);
      if (!model) {
        this.stats.totalErrors++;
        this.stats.cacheMisses++;
        throw new Error(`Model ${request.modelId} not found in cache`);
      }
      
      this.stats.cacheHits++;
      
      // Process predictions
      const result = await this.processBatchPrediction(model, request);
      
      // Update stats
      const processingTime = Date.now() - startTime;
      this.stats.totalLatency += processingTime;
      
      logger.info('Batch prediction completed', {
        modelId: request.modelId,
        samples: request.inputs.length,
        processingTime,
        batches: result.batchInfo.batchesProcessed
      });
      
      return result;
      
    } catch (error) {
      this.stats.totalErrors++;
      logger.error('Batch prediction failed', {
        modelId: request.modelId,
        samples: request.inputs.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Process multiple batch requests concurrently
   */
  async predictMultiple(requests: BatchPredictionRequest[]): Promise<BatchPredictionResult[]> {
    logger.info('Processing multiple batch requests', { count: requests.length });
    
    const predictions = await Promise.allSettled(
      requests.map(request => this.predict(request))
    );
    
    const results: BatchPredictionResult[] = [];
    const errors: Error[] = [];
    
    predictions.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push(new Error(`Request ${index} failed: ${result.reason}`));
      }
    });
    
    if (errors.length > 0) {
      logger.warn('Some batch predictions failed', { 
        successCount: results.length,
        errorCount: errors.length
      });
    }
    
    return results;
  }
  
  /**
   * Stream predictions for large datasets
   */
  async *streamPredict(
    modelId: string, 
    inputs: number[][],
    options: { batchSize?: number; bufferSize?: number } = {}
  ): AsyncGenerator<BatchPredictionResult, void, unknown> {
    const batchSize = options.batchSize || 100;
    const bufferSize = options.bufferSize || 3; // Number of batches to process concurrently
    
    logger.info('Starting streaming prediction', {
      modelId,
      totalSamples: inputs.length,
      batchSize,
      bufferSize
    });
    
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batchInputs = inputs.slice(i, i + batchSize);
      
      const request: BatchPredictionRequest = {
        modelId,
        inputs: batchInputs,
        options: { batchSize: batchInputs.length }
      };
      
      yield await this.predict(request);
    }
  }
  
  /**
   * Get prediction statistics
   */
  getStats(): BatchPredictionStats {
    const totalRequests = this.stats.totalRequests;
    const totalCacheRequests = this.stats.cacheHits + this.stats.cacheMisses;
    
    return {
      totalRequests: totalRequests,
      totalSamples: this.stats.totalSamples,
      avgLatency: totalRequests > 0 ? this.stats.totalLatency / totalRequests : 0,
      throughputPerSecond: totalRequests > 0 ? 
        (this.stats.totalSamples / (this.stats.totalLatency / 1000)) : 0,
      errorRate: totalRequests > 0 ? this.stats.totalErrors / totalRequests : 0,
      cacheHitRate: totalCacheRequests > 0 ? 
        this.stats.cacheHits / totalCacheRequests : 0
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      totalSamples: 0,
      totalLatency: 0,
      totalErrors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  /**
   * Validate batch prediction request
   */
  private validateRequest(request: BatchPredictionRequest): void {
    if (!request.modelId) {
      throw new Error('Model ID is required');
    }
    
    if (!Array.isArray(request.inputs) || request.inputs.length === 0) {
      throw new Error('Inputs must be a non-empty array');
    }
    
    if (request.inputs.length > 10000) {
      throw new Error('Batch size too large (max 10,000 samples)');
    }
    
    // Validate input dimensions consistency
    const firstInputLength = request.inputs[0]?.length;
    if (!firstInputLength) {
      throw new Error('Invalid input format');
    }
    
    for (let i = 1; i < request.inputs.length; i++) {
      if (request.inputs[i].length !== firstInputLength) {
        throw new Error(`Inconsistent input dimensions at sample ${i}`);
      }
    }
  }
  
  /**
   * Process batch prediction with smart batching
   */
  private async processBatchPrediction(
    model: CachedModel,
    request: BatchPredictionRequest
  ): Promise<BatchPredictionResult> {
    const startTime = Date.now();
    const batchSize = request.options?.batchSize || this.calculateOptimalBatchSize(request.inputs.length);
    const includeConfidence = request.options?.includeConfidence || false;
    const includeIntermediateResults = request.options?.includeIntermediateResults || false;
    
    const allPredictions: number[][] = [];
    const allConfidence: number[] = [];
    const intermediateResults: BatchPredictionResult['intermediateResults'] = [];
    const batchTimes: number[] = [];
    
    // Process in batches
    for (let i = 0; i < request.inputs.length; i += batchSize) {
      const batchStartTime = Date.now();
      const batchInputs = request.inputs.slice(i, i + batchSize);
      
      // Use worker for computation
      const workerResult = await aiWorkerManager.submitTask(
        'predict',
        {
          inputs: batchInputs,
          weights: model.weights,
          biases: model.biases,
          activationTypes: this.extractActivationTypes(model.config)
        },
        request.options?.priority || 'medium'
      );
      
      if (!workerResult.success || !workerResult.result) {
        throw new Error(`Batch prediction failed: ${workerResult.error}`);
      }
      
      const batchPredictions = this.processBatchResults(workerResult.result, batchInputs.length);
      allPredictions.push(...batchPredictions.predictions);
      
      // Calculate confidence if requested
      if (includeConfidence) {
        const confidence = batchPredictions.predictions.map(pred => 
          this.calculateConfidence(pred)
        );
        allConfidence.push(...confidence);
      }
      
      const batchTime = Date.now() - batchStartTime;
      batchTimes.push(batchTime);
      
      // Store intermediate results if requested
      if (includeIntermediateResults) {
        intermediateResults.push({
          batchIndex: Math.floor(i / batchSize),
          predictions: batchPredictions.predictions,
          confidence: includeConfidence ? 
            batchPredictions.predictions.map(pred => this.calculateConfidence(pred)) : 
            undefined,
          processingTime: batchTime
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgBatchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
    
    return {
      predictions: allPredictions,
      confidence: includeConfidence ? allConfidence : undefined,
      processingTime: totalTime,
      batchInfo: {
        totalSamples: request.inputs.length,
        batchesProcessed: batchTimes.length,
        avgBatchTime
      },
      intermediateResults: includeIntermediateResults ? intermediateResults : undefined
    };
  }
  
  /**
   * Calculate optimal batch size based on input size and system resources
   */
  private calculateOptimalBatchSize(totalSamples: number): number {
    const workerStatus = aiWorkerManager.getStatus();
    const availableWorkers = workerStatus.availableWorkers;
    
    // Base batch size on available workers and total samples
    if (totalSamples <= 50) return totalSamples; // Small dataset, process all at once
    if (totalSamples <= 500) return Math.ceil(totalSamples / Math.max(1, availableWorkers));
    
    // For larger datasets, use fixed batch sizes
    if (totalSamples <= 2000) return 100;
    if (totalSamples <= 5000) return 250;
    return 500; // Maximum batch size
  }
  
  /**
   * Extract activation types from model config
   */
  private extractActivationTypes(config: any): string[] {
    if (config.layers && Array.isArray(config.layers)) {
      return config.layers.map((layer: any) => layer.activation || 'relu');
    }
    
    // Default to relu for all layers if config is missing
    return ['relu', 'relu', 'linear']; // Common 3-layer setup
  }
  
  /**
   * Process worker results into predictions
   */
  private processBatchResults(workerResult: any, batchSize: number): { predictions: number[][] } {
    if (Array.isArray(workerResult.prediction)) {
      // Single prediction result
      return { predictions: [workerResult.prediction] };
    }
    
    if (Array.isArray(workerResult) && workerResult.length === batchSize) {
      // Multiple prediction results
      return { predictions: workerResult };
    }
    
    // Fallback: assume single prediction
    return { predictions: [workerResult.prediction || []] };
  }
  
  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(prediction: number[]): number {
    if (prediction.length === 1) {
      // Regression: use inverse of uncertainty (simple heuristic)
      return Math.max(0, Math.min(1, 1 - Math.abs(prediction[0] - 0.5) * 2));
    }
    
    // Classification: use max probability
    const maxProb = Math.max(...prediction);
    const entropy = -prediction.reduce((sum, p) => {
      return p > 0 ? sum + p * Math.log2(p) : sum;
    }, 0);
    
    // Combine max probability with low entropy for confidence
    return maxProb * (1 - entropy / Math.log2(prediction.length));
  }
  
  /**
   * Benchmark prediction performance
   */
  async benchmark(
    modelId: string,
    sampleSizes: number[] = [1, 10, 50, 100, 500, 1000]
  ): Promise<Array<{
    sampleSize: number;
    avgLatency: number;
    throughput: number;
    memoryUsage: number;
  }>> {
    logger.info('Starting batch prediction benchmark', { modelId, sampleSizes });
    
    const results = [];
    
    for (const sampleSize of sampleSizes) {
      // Generate dummy data
      const inputs = Array.from({ length: sampleSize }, () => 
        Array.from({ length: 10 }, () => Math.random())
      );
      
      const trials = 5;
      const latencies: number[] = [];
      
      for (let trial = 0; trial < trials; trial++) {
        const startTime = Date.now();
        
        await this.predict({
          modelId,
          inputs,
          options: { includeConfidence: false }
        });
        
        latencies.push(Date.now() - startTime);
      }
      
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const throughput = sampleSize / (avgLatency / 1000); // samples per second
      
      results.push({
        sampleSize,
        avgLatency,
        throughput,
        memoryUsage: process.memoryUsage().heapUsed // rough estimate
      });
      
      logger.info('Benchmark completed for sample size', { 
        sampleSize, 
        avgLatency, 
        throughput: throughput.toFixed(2) + ' samples/sec'
      });
    }
    
    return results;
  }
}

// Export singleton instance
export const batchPredictor = new BatchPredictor(); 