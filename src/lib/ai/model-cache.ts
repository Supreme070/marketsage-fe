/**
 * AI Model Caching System
 * ========================
 * High-performance caching for trained ML models with LRU eviction,
 * persistence, and memory management for faster inference.
 */

import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

export interface CachedModel {
  id: string;
  name: string;
  type: 'neural_network' | 'ensemble' | 'automl';
  weights: number[][];
  biases: number[][];
  config: any;
  metadata: {
    version: string;
    trainedAt: Date;
    accuracy: number;
    modelSize: number; // in bytes
    lastAccessed: Date;
    accessCount: number;
  };
}

export interface CacheStats {
  totalModels: number;
  memoryUsage: number; // in bytes
  hitRate: number;
  missRate: number;
  evictions: number;
}

export interface CacheConfig {
  maxMemoryMB: number;
  maxModels: number;
  persistToDisk: boolean;
  diskCachePath: string;
  ttlHours: number; // Time to live in hours
}

export class AIModelCache {
  private cache: Map<string, CachedModel> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryMB: 100, // 100MB default
      maxModels: 50,
      persistToDisk: true,
      diskCachePath: './cache/models',
      ttlHours: 24,
      ...config
    };
    
    this.initializeCache();
  }
  
  /**
   * Store a model in cache
   */
  async set(modelId: string, model: Omit<CachedModel, 'id' | 'metadata'>): Promise<void> {
    try {
      const modelSize = this.calculateModelSize(model);
      
      const cachedModel: CachedModel = {
        id: modelId,
        ...model,
        metadata: {
          version: '1.0.0',
          trainedAt: new Date(),
          accuracy: model.config.accuracy || 0,
          modelSize,
          lastAccessed: new Date(),
          accessCount: 0
        }
      };
      
      // Check if we need to evict models
      await this.ensureCapacity(modelSize);
      
      // Store in memory
      this.cache.set(modelId, cachedModel);
      this.updateAccessOrder(modelId);
      
      // Persist to disk if enabled
      if (this.config.persistToDisk) {
        await this.persistModel(cachedModel);
      }
      
      logger.info('Model cached successfully', { 
        modelId, 
        size: modelSize, 
        totalModels: this.cache.size 
      });
      
    } catch (error) {
      logger.error('Failed to cache model', { 
        modelId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Retrieve a model from cache
   */
  async get(modelId: string): Promise<CachedModel | null> {
    try {
      // Check memory cache first
      let model = this.cache.get(modelId);
      
      if (model) {
        // Check if model is expired
        if (this.isExpired(model)) {
          await this.remove(modelId);
          this.stats.misses++;
          return null;
        }
        
        // Update access metadata
        model.metadata.lastAccessed = new Date();
        model.metadata.accessCount++;
        this.updateAccessOrder(modelId);
        
        this.stats.hits++;
        return model;
      }
      
      // Try loading from disk if enabled
      if (this.config.persistToDisk) {
        model = await this.loadFromDisk(modelId);
        if (model && !this.isExpired(model)) {
          // Load back into memory
          await this.ensureCapacity(model.metadata.modelSize);
          this.cache.set(modelId, model);
          this.updateAccessOrder(modelId);
          
          this.stats.hits++;
          return model;
        }
      }
      
      this.stats.misses++;
      return null;
      
    } catch (error) {
      logger.error('Failed to retrieve model from cache', { 
        modelId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.stats.misses++;
      return null;
    }
  }
  
  /**
   * Check if model exists in cache
   */
  has(modelId: string): boolean {
    return this.cache.has(modelId);
  }
  
  /**
   * Remove model from cache
   */
  async remove(modelId: string): Promise<boolean> {
    try {
      const removed = this.cache.delete(modelId);
      this.accessOrder = this.accessOrder.filter(id => id !== modelId);
      
      // Remove from disk if exists
      if (this.config.persistToDisk) {
        await this.removeFromDisk(modelId);
      }
      
      if (removed) {
        logger.info('Model removed from cache', { modelId });
      }
      
      return removed;
    } catch (error) {
      logger.error('Failed to remove model from cache', { 
        modelId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const memoryUsage = Array.from(this.cache.values())
      .reduce((total, model) => total + model.metadata.modelSize, 0);
    
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalModels: this.cache.size,
      memoryUsage,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictions: this.stats.evictions
    };
  }
  
  /**
   * Initialize cache (create directories, load existing models)
   */
  private async initializeCache(): Promise<void> {
    try {
      if (this.config.persistToDisk) {
        await fs.mkdir(this.config.diskCachePath, { recursive: true });
      }
      
      logger.info('Model cache initialized', { 
        maxMemory: this.config.maxMemoryMB + 'MB',
        maxModels: this.config.maxModels,
        persistToDisk: this.config.persistToDisk
      });
    } catch (error) {
      logger.error('Failed to initialize model cache', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  /**
   * Calculate model size in bytes
   */
  private calculateModelSize(model: Omit<CachedModel, 'id' | 'metadata'>): number {
    // Rough estimation: each number is 8 bytes (64-bit float)
    const weightsSize = model.weights.reduce((total, layer) => total + layer.length * 8, 0);
    const biasesSize = model.biases.reduce((total, layer) => total + layer.length * 8, 0);
    const configSize = JSON.stringify(model.config).length * 2; // UTF-16
    
    return weightsSize + biasesSize + configSize;
  }
  
  /**
   * Ensure cache has capacity for new model
   */
  private async ensureCapacity(newModelSize: number): Promise<void> {
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;
    const currentMemory = Array.from(this.cache.values())
      .reduce((total, model) => total + model.metadata.modelSize, 0);
    
    // Check memory limit
    while (currentMemory + newModelSize > maxMemoryBytes && this.cache.size > 0) {
      await this.evictLRU();
    }
    
    // Check model count limit
    while (this.cache.size >= this.config.maxModels) {
      await this.evictLRU();
    }
  }
  
  /**
   * Evict least recently used model
   */
  private async evictLRU(): Promise<void> {
    if (this.accessOrder.length === 0) return;
    
    const lruModelId = this.accessOrder[0];
    await this.remove(lruModelId);
    this.stats.evictions++;
    
    logger.info('Evicted LRU model', { modelId: lruModelId });
  }
  
  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(modelId: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter(id => id !== modelId);
    // Add to end (most recently used)
    this.accessOrder.push(modelId);
  }
  
  /**
   * Check if model is expired
   */
  private isExpired(model: CachedModel): boolean {
    const ttlMs = this.config.ttlHours * 60 * 60 * 1000;
    const age = Date.now() - model.metadata.trainedAt.getTime();
    return age > ttlMs;
  }
  
  /**
   * Persist model to disk
   */
  private async persistModel(model: CachedModel): Promise<void> {
    try {
      const filePath = path.join(this.config.diskCachePath, `${model.id}.json`);
      const serialized = JSON.stringify(model, null, 2);
      await fs.writeFile(filePath, serialized, 'utf-8');
    } catch (error) {
      logger.error('Failed to persist model to disk', { 
        modelId: model.id, 
        error 
      });
    }
  }
  
  /**
   * Load model from disk
   */
  private async loadFromDisk(modelId: string): Promise<CachedModel | undefined> {
    try {
      const filePath = path.join(this.config.diskCachePath, `${modelId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const model = JSON.parse(data) as CachedModel;
      
      // Convert date strings back to Date objects
      model.metadata.trainedAt = new Date(model.metadata.trainedAt);
      model.metadata.lastAccessed = new Date(model.metadata.lastAccessed);
      
      return model;
    } catch (error) {
      // File doesn't exist or is corrupted
      return undefined;
    }
  }
  
  /**
   * Remove model from disk
   */
  private async removeFromDisk(modelId: string): Promise<void> {
    try {
      const filePath = path.join(this.config.diskCachePath, `${modelId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is fine
    }
  }
}

// Export singleton instance
export const aiModelCache = new AIModelCache({
  maxMemoryMB: 200, // 200MB for production
  maxModels: 100,
  persistToDisk: true,
  diskCachePath: './cache/ai-models',
  ttlHours: 168 // 1 week
}); 