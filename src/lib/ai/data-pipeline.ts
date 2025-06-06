/**
 * AI Data Pipeline
 * ================
 * Centralized data management for ML model training and inference
 */

import { logger } from '@/lib/logger';

export interface TrainingDataset {
  id: string;
  name: string;
  features: number[][];
  targets: number[][];
  metadata: {
    featureNames: string[];
    targetNames: string[];
    dataSource: string;
    timestamp: Date;
    sampleCount: number;
    featureCount: number;
  };
}

export interface DataPreprocessingConfig {
  normalize: boolean;
  standardize: boolean;
  handleMissingValues: 'drop' | 'mean' | 'median' | 'forward_fill';
  featureSelection?: {
    method: 'variance' | 'correlation' | 'mutual_info';
    threshold: number;
  };
}

interface DatasetMetadataInput {
  name?: string;
  featureNames?: string[];
  targetNames?: string[];
  dataSource?: string;
}

export class AIDataPipeline {
  private datasets: Map<string, TrainingDataset> = new Map();
  
  /**
   * Load and preprocess training data
   */
  async loadDataset(
    data: { features: number[][], targets: number[][] },
    config: DataPreprocessingConfig,
    metadata: DatasetMetadataInput = {}
  ): Promise<TrainingDataset> {
    const id = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate input data
      this.validateDataFormat(data.features, data.targets);
      
      // Preprocess data
      const processedData = await this.preprocessData(data, config);
      
      // Create dataset
      const dataset: TrainingDataset = {
        id,
        name: metadata.name || `Dataset ${id}`,
        features: processedData.features,
        targets: processedData.targets,
        metadata: {
          featureNames: metadata.featureNames || this.generateFeatureNames(processedData.features[0].length),
          targetNames: metadata.targetNames || this.generateTargetNames(processedData.targets[0].length),
          dataSource: metadata.dataSource || 'unknown',
          timestamp: new Date(),
          sampleCount: processedData.features.length,
          featureCount: processedData.features[0].length,
        }
      };
      
      this.datasets.set(id, dataset);
      logger.info('Dataset loaded successfully', { id, sampleCount: dataset.metadata.sampleCount });
      
      return dataset;
    } catch (error) {
      logger.error('Failed to load dataset', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Get dataset by ID
   */
  getDataset(id: string): TrainingDataset | undefined {
    return this.datasets.get(id);
  }
  
  /**
   * Split dataset into train/validation/test sets
   */
  splitDataset(
    dataset: TrainingDataset,
    splits: { train: number; validation: number; test: number } = { train: 0.7, validation: 0.15, test: 0.15 }
  ): {
    train: { features: number[][], targets: number[][] };
    validation: { features: number[][], targets: number[][] };
    test: { features: number[][], targets: number[][] };
  } {
    const totalSamples = dataset.features.length;
    const trainEnd = Math.floor(totalSamples * splits.train);
    const validationEnd = trainEnd + Math.floor(totalSamples * splits.validation);
    
    // Shuffle data before splitting
    const shuffledData = this.shuffleDataset(dataset);
    
    return {
      train: {
        features: shuffledData.features.slice(0, trainEnd),
        targets: shuffledData.targets.slice(0, trainEnd)
      },
      validation: {
        features: shuffledData.features.slice(trainEnd, validationEnd),
        targets: shuffledData.targets.slice(trainEnd, validationEnd)
      },
      test: {
        features: shuffledData.features.slice(validationEnd),
        targets: shuffledData.targets.slice(validationEnd)
      }
    };
  }
  
  /**
   * Validate data format
   */
  private validateDataFormat(features: number[][], targets: number[][]): void {
    if (features.length !== targets.length) {
      throw new Error('Features and targets must have the same number of samples');
    }
    
    if (features.length === 0) {
      throw new Error('Dataset cannot be empty');
    }
    
    const featureLength = features[0].length;
    const targetLength = targets[0].length;
    
    // Check consistency
    for (let i = 0; i < features.length; i++) {
      if (features[i].length !== featureLength) {
        throw new Error(`Inconsistent feature dimensions at sample ${i}`);
      }
      if (targets[i].length !== targetLength) {
        throw new Error(`Inconsistent target dimensions at sample ${i}`);
      }
    }
  }
  
  /**
   * Preprocess data according to configuration
   */
  private async preprocessData(
    data: { features: number[][], targets: number[][] },
    config: DataPreprocessingConfig
  ): Promise<{ features: number[][], targets: number[][] }> {
    let { features, targets } = data;
    
    // Handle missing values
    if (config.handleMissingValues !== 'drop') {
      features = this.handleMissingValues(features, config.handleMissingValues);
    }
    
    // Normalize features
    if (config.normalize) {
      features = this.normalizeFeatures(features);
    }
    
    // Standardize features
    if (config.standardize) {
      features = this.standardizeFeatures(features);
    }
    
    // Feature selection
    if (config.featureSelection) {
      features = await this.selectFeatures(features, targets, config.featureSelection);
    }
    
    return { features, targets };
  }
  
  /**
   * Handle missing values in features
   */
  private handleMissingValues(features: number[][], method: 'mean' | 'median' | 'forward_fill'): number[][] {
    const result = features.map(row => [...row]);
    const numFeatures = features[0].length;
    
    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      const column = features.map(row => row[featureIdx]).filter(val => !isNaN(val) && val !== null);
      
      let fillValue: number;
      if (method === 'mean') {
        fillValue = column.reduce((sum, val) => sum + val, 0) / column.length;
      } else if (method === 'median') {
        const sorted = [...column].sort((a, b) => a - b);
        fillValue = sorted[Math.floor(sorted.length / 2)];
      } else {
        fillValue = column[0] || 0; // forward fill with first valid value
      }
      
      // Fill missing values
      for (let sampleIdx = 0; sampleIdx < result.length; sampleIdx++) {
        if (isNaN(result[sampleIdx][featureIdx]) || result[sampleIdx][featureIdx] === null) {
          result[sampleIdx][featureIdx] = fillValue;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Normalize features to [0, 1] range
   */
  private normalizeFeatures(features: number[][]): number[][] {
    const numFeatures = features[0].length;
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);
    
    // Find min/max for each feature
    features.forEach(row => {
      row.forEach((val, idx) => {
        mins[idx] = Math.min(mins[idx], val);
        maxs[idx] = Math.max(maxs[idx], val);
      });
    });
    
    // Normalize
    return features.map(row =>
      row.map((val, idx) => {
        const range = maxs[idx] - mins[idx];
        return range === 0 ? 0 : (val - mins[idx]) / range;
      })
    );
  }
  
  /**
   * Standardize features (z-score normalization)
   */
  private standardizeFeatures(features: number[][]): number[][] {
    const numFeatures = features[0].length;
    const means = new Array(numFeatures).fill(0);
    const stds = new Array(numFeatures).fill(0);
    
    // Calculate means
    features.forEach(row => {
      row.forEach((val, idx) => {
        means[idx] += val;
      });
    });
    means.forEach((_, idx) => {
      means[idx] /= features.length;
    });
    
    // Calculate standard deviations
    features.forEach(row => {
      row.forEach((val, idx) => {
        stds[idx] += Math.pow(val - means[idx], 2);
      });
    });
    stds.forEach((_, idx) => {
      stds[idx] = Math.sqrt(stds[idx] / features.length);
    });
    
    // Standardize
    return features.map(row =>
      row.map((val, idx) => {
        return stds[idx] === 0 ? 0 : (val - means[idx]) / stds[idx];
      })
    );
  }
  
  /**
   * Feature selection based on variance threshold
   */
  private async selectFeatures(
    features: number[][],
    targets: number[][],
    config: { method: string; threshold: number }
  ): Promise<number[][]> {
    if (config.method === 'variance') {
      return this.selectByVariance(features, config.threshold);
    }
    
    // For now, return original features for other methods
    return features;
  }
  
  /**
   * Select features by variance threshold
   */
  private selectByVariance(features: number[][], threshold: number): number[][] {
    const numFeatures = features[0].length;
    const variances = new Array(numFeatures).fill(0);
    
    // Calculate variances
    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      const column = features.map(row => row[featureIdx]);
      const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
      const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length;
      variances[featureIdx] = variance;
    }
    
    // Select features above threshold
    const selectedIndices = variances
      .map((variance, idx) => ({ variance, idx }))
      .filter(item => item.variance > threshold)
      .map(item => item.idx);
    
    return features.map(row => selectedIndices.map(idx => row[idx]));
  }
  
  /**
   * Shuffle dataset
   */
  private shuffleDataset(dataset: TrainingDataset): { features: number[][], targets: number[][] } {
    const indices = Array.from({ length: dataset.features.length }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return {
      features: indices.map(i => dataset.features[i]),
      targets: indices.map(i => dataset.targets[i])
    };
  }
  
  /**
   * Generate default feature names
   */
  private generateFeatureNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `feature_${i}`);
  }
  
  /**
   * Generate default target names
   */
  private generateTargetNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `target_${i}`);
  }
  
  /**
   * Get dataset statistics
   */
  getDatasetStats(id: string): {
    featureStats: Array<{ name: string; mean: number; std: number; min: number; max: number }>;
    targetStats: Array<{ name: string; mean: number; std: number; min: number; max: number }>;
  } | null {
    const dataset = this.datasets.get(id);
    if (!dataset) return null;
    
    const calculateStats = (data: number[][], names: string[]) => {
      return names.map((name, idx) => {
        const column = data.map(row => row[idx]);
        const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
        const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length;
        const std = Math.sqrt(variance);
        const min = Math.min(...column);
        const max = Math.max(...column);
        
        return { name, mean, std, min, max };
      });
    };
    
    return {
      featureStats: calculateStats(dataset.features, dataset.metadata.featureNames),
      targetStats: calculateStats(dataset.targets, dataset.metadata.targetNames)
    };
  }
}

export const aiDataPipeline = new AIDataPipeline(); 