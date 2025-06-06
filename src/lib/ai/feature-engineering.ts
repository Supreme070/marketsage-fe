/**
 * Advanced Feature Engineering System
 * ==================================
 * Automated feature creation and selection with statistical analysis
 * and domain-specific transformations.
 */

import { logger } from '@/lib/logger';

export interface FeatureConfig {
  name: string;
  type: 'numeric' | 'categorical' | 'temporal' | 'text';
  transformations?: string[];
  dependencies?: string[];
  customLogic?: (data: any) => any;
}

export interface FeatureStats {
  name: string;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  uniqueValues?: number;
  missingValues: number;
  correlation?: Record<string, number>;
}

export class FeatureEngineer {
  private features: Map<string, FeatureConfig> = new Map();
  private featureStats: Map<string, FeatureStats> = new Map();
  
  /**
   * Register a new feature for automated engineering
   */
  registerFeature(config: FeatureConfig): void {
    this.features.set(config.name, config);
    logger.info('Registered new feature', { feature: config.name });
  }
  
  /**
   * Generate features from raw data
   */
  async generateFeatures(rawData: any[]): Promise<any[]> {
    try {
      const engineeredData = await Promise.all(
        rawData.map(async (sample) => {
          const features = await this.processDataSample(sample);
          return { ...sample, ...features };
        })
      );
      
      // Update feature statistics
      this.updateFeatureStats(engineeredData);
      
      return engineeredData;
    } catch (error) {
      logger.error('Feature generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Process a single data sample
   */
  private async processDataSample(sample: any): Promise<Record<string, any>> {
    const features: Record<string, any> = {};
    
    for (const [name, config] of this.features) {
      try {
        // Apply transformations based on feature type
        const value = await this.applyTransformations(sample, config);
        features[name] = value;
        
      } catch (error) {
        logger.warn('Failed to generate feature', {
          feature: name,
          error: error instanceof Error ? error.message : String(error)
        });
        features[name] = null;
      }
    }
    
    return features;
  }
  
  /**
   * Apply transformations based on feature type and config
   */
  private async applyTransformations(sample: any, config: FeatureConfig): Promise<any> {
    let value = sample[config.name];
    
    // Apply type-specific transformations
    switch (config.type) {
      case 'numeric':
        value = await this.transformNumeric(value, config);
        break;
      case 'categorical':
        value = await this.transformCategorical(value, config);
        break;
      case 'temporal':
        value = await this.transformTemporal(value, config);
        break;
      case 'text':
        value = await this.transformText(value, config);
        break;
    }
    
    // Apply custom transformations
    if (config.customLogic) {
      value = config.customLogic(value);
    }
    
    return value;
  }
  
  /**
   * Transform numeric features
   */
  private async transformNumeric(value: any, config: FeatureConfig): Promise<number> {
    if (typeof value !== 'number') {
      value = parseFloat(value);
    }
    
    if (isNaN(value)) {
      throw new Error('Invalid numeric value');
    }
    
    const transforms = config.transformations || [];
    
    for (const transform of transforms) {
      switch (transform) {
        case 'log':
          value = Math.log(Math.abs(value) + 1);
          break;
        case 'square':
          value = value * value;
          break;
        case 'sqrt':
          value = Math.sqrt(Math.abs(value));
          break;
        case 'standardize':
          const stats = this.featureStats.get(config.name);
          if (stats?.mean !== undefined && stats?.std !== undefined) {
            value = (value - stats.mean) / stats.std;
          }
          break;
      }
    }
    
    return value;
  }
  
  /**
   * Transform categorical features
   */
  private async transformCategorical(value: any, config: FeatureConfig): Promise<any> {
    if (value === null || value === undefined) {
      return null;
    }
    
    const transforms = config.transformations || [];
    
    for (const transform of transforms) {
      switch (transform) {
        case 'oneHot':
          // Return one-hot encoded object
          return this.oneHotEncode(value.toString(), config.name);
        case 'label':
          // Return numeric label
          return this.labelEncode(value.toString(), config.name);
        case 'hash':
          // Return hashed value
          return this.hashEncode(value.toString());
      }
    }
    
    return value;
  }
  
  /**
   * Transform temporal features
   */
  private async transformTemporal(value: any, config: FeatureConfig): Promise<any> {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid temporal value');
    }
    
    const transforms = config.transformations || [];
    const features: Record<string, number> = {};
    
    for (const transform of transforms) {
      switch (transform) {
        case 'year':
          features[`${config.name}_year`] = date.getFullYear();
          break;
        case 'month':
          features[`${config.name}_month`] = date.getMonth() + 1;
          break;
        case 'dayOfWeek':
          features[`${config.name}_dayOfWeek`] = date.getDay();
          break;
        case 'hour':
          features[`${config.name}_hour`] = date.getHours();
          break;
        case 'timestamp':
          features[`${config.name}_timestamp`] = date.getTime();
          break;
      }
    }
    
    return Object.keys(features).length > 0 ? features : date.getTime();
  }
  
  /**
   * Transform text features
   */
  private async transformText(value: any, config: FeatureConfig): Promise<any> {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    const transforms = config.transformations || [];
    const features: Record<string, any> = {};
    
    for (const transform of transforms) {
      switch (transform) {
        case 'length':
          features[`${config.name}_length`] = value.length;
          break;
        case 'wordCount':
          features[`${config.name}_wordCount`] = value.split(/\s+/).length;
          break;
        case 'lowercase':
          value = value.toLowerCase();
          break;
        case 'tfidf':
          // Implement TF-IDF when needed
          break;
      }
    }
    
    return Object.keys(features).length > 0 ? features : value;
  }
  
  /**
   * Update feature statistics
   */
  private updateFeatureStats(data: any[]): void {
    for (const [name, config] of this.features) {
      const values = data.map(sample => sample[name]).filter(v => v !== null);
      
      const stats: FeatureStats = {
        name,
        missingValues: data.length - values.length
      };
      
      if (config.type === 'numeric') {
        stats.mean = this.calculateMean(values);
        stats.std = this.calculateStd(values, stats.mean);
        stats.min = Math.min(...values);
        stats.max = Math.max(...values);
      } else {
        stats.uniqueValues = new Set(values).size;
      }
      
      this.featureStats.set(name, stats);
    }
    
    // Calculate correlations for numeric features
    this.updateCorrelations(data);
  }
  
  /**
   * Calculate mean of numeric values
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStd(values: number[], mean: number): number {
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(this.calculateMean(squaredDiffs));
  }
  
  /**
   * Update feature correlations
   */
  private updateCorrelations(data: any[]): void {
    const numericFeatures = Array.from(this.features.entries())
      .filter(([_, config]) => config.type === 'numeric')
      .map(([name]) => name);
    
    for (const feature of numericFeatures) {
      const correlations: Record<string, number> = {};
      
      for (const otherFeature of numericFeatures) {
        if (feature !== otherFeature) {
          correlations[otherFeature] = this.calculateCorrelation(
            data.map(s => s[feature]),
            data.map(s => s[otherFeature])
          );
        }
      }
      
      const stats = this.featureStats.get(feature);
      if (stats) {
        stats.correlation = correlations;
        this.featureStats.set(feature, stats);
      }
    }
  }
  
  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);
    
    const diffX = x.map(val => val - meanX);
    const diffY = y.map(val => val - meanY);
    
    const sumXY = diffX.reduce((sum, val, i) => sum + val * diffY[i], 0);
    const sumX2 = diffX.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = diffY.reduce((sum, val) => sum + val * val, 0);
    
    return sumXY / Math.sqrt(sumX2 * sumY2);
  }
  
  /**
   * One-hot encode categorical value
   */
  private oneHotEncode(value: string, featureName: string): Record<string, number> {
    const encoded: Record<string, number> = {};
    encoded[`${featureName}_${value}`] = 1;
    return encoded;
  }
  
  /**
   * Label encode categorical value
   */
  private labelEncode(value: string, featureName: string): number {
    // Simple hash-based encoding
    return this.hashEncode(value);
  }
  
  /**
   * Hash encode string value
   */
  private hashEncode(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * Get feature statistics
   */
  getFeatureStats(): FeatureStats[] {
    return Array.from(this.featureStats.values());
  }
  
  /**
   * Get registered features
   */
  getFeatures(): FeatureConfig[] {
    return Array.from(this.features.values());
  }
}

// Export singleton instance
export const featureEngineer = new FeatureEngineer(); 