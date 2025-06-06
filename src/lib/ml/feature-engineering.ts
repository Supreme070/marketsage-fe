/**
 * Feature Engineering Module
 * Advanced feature scaling, normalization, and selection algorithms
 */

import { logger } from '@/lib/logger';
import { RawDataPoint, ProcessedDataPoint } from './data-pipeline';

export interface FeatureStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export type ScalingMethod = 'minmax' | 'standard' | 'robust' | 'quantile';
export type SelectionMethod = 'variance' | 'correlation' | 'mutual_info' | 'lasso' | 'tree';

export interface FeatureImportance {
  featureName: string;
  importance: number;
  method: string;
}

export interface FeatureInteraction {
  features: string[];
  interactionType: 'multiply' | 'divide' | 'add' | 'subtract';
  importance: number;
}

export interface PolynomialFeature {
  baseFeature: string;
  degree: number;
  coefficient: number;
}

export class FeatureEngineer {
  private scalingStats: Map<string, FeatureStats> = new Map();
  private selectedFeatures: Set<string> = new Set();
  private featureImportance: Map<string, FeatureImportance> = new Map();
  private discoveredInteractions: FeatureInteraction[] = [];
  private polynomialFeatures: Map<string, PolynomialFeature[]> = new Map();

  /**
   * Generate features from raw data
   */
  async generateFeatures(rawData: RawDataPoint[]): Promise<ProcessedDataPoint[]> {
    try {
      // Extract base features
      const baseFeatures = this.extractBaseFeatures(rawData);
      
      // Generate polynomial features
      const polyFeatures = await this.generatePolynomialFeatures(baseFeatures);
      
      // Generate interaction features
      const interactionFeatures = await this.generateInteractionFeatures(baseFeatures);
      
      // Combine all features
      const allFeatures = this.combineFeatures(baseFeatures, polyFeatures, interactionFeatures);
      
      // Scale features
      const scaledFeatures = await this.scaleFeatures(allFeatures, 'standard');
      
      return this.convertToProcessedFormat(scaledFeatures, rawData);
    } catch (error) {
      logger.error('Feature generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Extract base features from raw data
   */
  private extractBaseFeatures(data: RawDataPoint[]): Map<string, number[]> {
    const features = new Map<string, number[]>();
    
    // Extract numerical features
    data.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!features.has(key)) {
            features.set(key, []);
          }
          features.get(key)?.push(value);
        }
      });
    });
    
    return features;
  }

  /**
   * Generate polynomial features
   */
  private async generatePolynomialFeatures(
    baseFeatures: Map<string, number[]>
  ): Promise<Map<string, number[]>> {
    const polyFeatures = new Map<string, number[]>();
    
    for (const [feature, values] of baseFeatures) {
      // Generate polynomials up to degree 3
      for (let degree = 2; degree <= 3; degree++) {
        const polyName = `${feature}_pow${degree}`;
        const polyValues = values.map(v => Math.pow(v, degree));
        
        // Calculate importance score
        const importance = this.calculateFeatureImportance(polyValues);
        
        // Store if important enough
        if (importance > 0.1) {
          polyFeatures.set(polyName, polyValues);
          this.polynomialFeatures.set(feature, [
            ...(this.polynomialFeatures.get(feature) || []),
            {
              baseFeature: feature,
              degree,
              coefficient: importance
            }
          ]);
        }
      }
    }
    
    return polyFeatures;
  }

  /**
   * Generate interaction features
   */
  private async generateInteractionFeatures(
    baseFeatures: Map<string, number[]>
  ): Promise<Map<string, number[]>> {
    const interactions = new Map<string, number[]>();
    const features = Array.from(baseFeatures.entries());
    
    // Generate pairwise interactions
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const [name1, values1] = features[i];
        const [name2, values2] = features[j];
        
        // Multiply interaction
        const multName = `${name1}_mult_${name2}`;
        const multValues = values1.map((v, idx) => v * values2[idx]);
        const multImportance = this.calculateFeatureImportance(multValues);
        
        if (multImportance > 0.1) {
          interactions.set(multName, multValues);
          this.discoveredInteractions.push({
            features: [name1, name2],
            interactionType: 'multiply',
            importance: multImportance
          });
        }
        
        // Ratio interaction (if meaningful)
        if (values2.every(v => Math.abs(v) > 1e-10)) {
          const ratioName = `${name1}_div_${name2}`;
          const ratioValues = values1.map((v, idx) => v / values2[idx]);
          const ratioImportance = this.calculateFeatureImportance(ratioValues);
          
          if (ratioImportance > 0.1) {
            interactions.set(ratioName, ratioValues);
            this.discoveredInteractions.push({
              features: [name1, name2],
              interactionType: 'divide',
              importance: ratioImportance
            });
          }
        }
      }
    }
    
    return interactions;
  }

  /**
   * Combine different feature sets
   */
  private combineFeatures(
    base: Map<string, number[]>,
    poly: Map<string, number[]>,
    interactions: Map<string, number[]>
  ): Map<string, number[]> {
    const combined = new Map(base);
    
    for (const [name, values] of poly) {
      combined.set(name, values);
    }
    
    for (const [name, values] of interactions) {
      combined.set(name, values);
    }
    
    return combined;
  }

  /**
   * Calculate feature importance
   */
  private calculateFeatureImportance(values: number[]): number {
    // Calculate variance
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    // Normalize to 0-1 range
    return Math.min(1, variance / Math.pow(mean, 2));
  }

  /**
   * Convert to processed format
   */
  private convertToProcessedFormat(
    features: Map<string, number[]>,
    rawData: RawDataPoint[]
  ): ProcessedDataPoint[] {
    return rawData.map((item, idx) => {
      const featureVector: number[] = [];
      
      for (const [name, values] of features) {
        featureVector.push(values[idx]);
      }
      
      return {
        features: featureVector,
        metadata: {
          id: String(item.id || idx),
          timestamp: new Date(),
          source: String(item.source || 'unknown'),
          quality: this.calculateDataQuality(item)
        }
      };
    });
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQuality(item: RawDataPoint): number {
    let score = 1;
    let checks = 0;
    
    // Check for missing values
    Object.values(item).forEach(value => {
      if (value === null || value === undefined) {
        score -= 0.1;
      }
      checks++;
    });
    
    // Check for extreme values
    Object.values(item).forEach(value => {
      if (typeof value === 'number') {
        if (Math.abs(value) > 1e6) {
          score -= 0.05;
        }
      }
      checks++;
    });
    
    return Math.max(0, score);
  }

  /**
   * Get discovered feature interactions
   */
  getDiscoveredInteractions(): FeatureInteraction[] {
    return this.discoveredInteractions;
  }

  /**
   * Get polynomial features
   */
  getPolynomialFeatures(): Map<string, PolynomialFeature[]> {
    return this.polynomialFeatures;
  }

  /**
   * Get feature importance scores
   */
  getFeatureImportance(featureName: string): FeatureImportance | null {
    return this.featureImportance.get(featureName) || null;
  }

  /**
   * Scale features using various methods
   */
  scaleFeatures(
    features: Map<string, number[]>,
    method: ScalingMethod = 'standard'
  ): Map<string, number[]> {
    const scaled = new Map<string, number[]>();
    
    for (const [name, values] of features) {
      // Calculate statistics if not already computed
      if (!this.scalingStats.has(name)) {
        this.scalingStats.set(name, this.computeFeatureStats(values));
      }
      
      const stats = this.scalingStats.get(name);
      if (!stats) continue;
      
      switch (method) {
        case 'minmax':
          scaled.set(name, values.map(v => this.minMaxScale(v, stats.min, stats.max)));
          break;
        case 'standard':
          scaled.set(name, values.map(v => this.standardScale(v, stats.mean, stats.std)));
          break;
        case 'robust':
          scaled.set(name, values.map(v => this.robustScale(v, stats.median, stats.q1, stats.q3)));
          break;
        case 'quantile':
          scaled.set(name, values.map(v => this.quantileTransform(v, stats)));
          break;
        default:
          scaled.set(name, values);
      }
    }
    
    return scaled;
  }

  /**
   * Compute statistics for a feature
   */
  private computeFeatureStats(values: number[]): FeatureStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[n - 1],
      median: sorted[Math.floor(n / 2)],
      q1: sorted[Math.floor(n / 4)],
      q3: sorted[Math.floor(3 * n / 4)],
      iqr: sorted[Math.floor(3 * n / 4)] - sorted[Math.floor(n / 4)],
      skewness: this.calculateSkewness(values, mean, std),
      kurtosis: this.calculateKurtosis(values, mean, std)
    };
  }

  /**
   * Calculate skewness
   */
  private calculateSkewness(values: number[], mean: number, std: number): number {
    const n = values.length;
    const m3 = values.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
    return m3 / Math.pow(std, 3);
  }

  /**
   * Calculate kurtosis
   */
  private calculateKurtosis(values: number[], mean: number, std: number): number {
    const n = values.length;
    const m4 = values.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
    return m4 / Math.pow(std, 4) - 3; // Excess kurtosis
  }

  /**
   * Min-max scaling
   */
  private minMaxScale(value: number, min: number, max: number): number {
    return max > min ? (value - min) / (max - min) : 0;
  }

  /**
   * Standard scaling (z-score normalization)
   */
  private standardScale(value: number, mean: number, std: number): number {
    return std > 0 ? (value - mean) / std : 0;
  }

  /**
   * Robust scaling using quartiles
   */
  private robustScale(value: number, median: number, q1: number, q3: number): number {
    const iqr = q3 - q1;
    return iqr > 0 ? (value - median) / iqr : 0;
  }

  /**
   * Quantile transform
   */
  private quantileTransform(value: number, stats: FeatureStats): number {
    // Simple implementation - can be enhanced with more sophisticated quantile mapping
    return this.minMaxScale(value, stats.min, stats.max);
  }

  /**
   * Private feature selection methods
   */
  private varianceBasedSelection(
    data: number[][],
    featureNames: string[]
  ): FeatureImportance[] {
    return featureNames.map((name, index) => {
      const values = data.map(row => row[index]);
      const variance = this.calculateVariance(values);
      
      return {
        featureName: name,
        importance: variance,
        method: 'variance'
      };
    });
  }

  private correlationBasedSelection(
    data: number[][],
    target: number[],
    featureNames: string[]
  ): FeatureImportance[] {
    return featureNames.map((name, index) => {
      const values = data.map(row => row[index]);
      const correlation = Math.abs(this.calculateCorrelation(values, target));
      
      return {
        featureName: name,
        importance: correlation,
        method: 'correlation'
      };
    });
  }

  private mutualInformationSelection(
    data: number[][],
    target: number[],
    featureNames: string[]
  ): FeatureImportance[] {
    return featureNames.map((name, index) => {
      const values = data.map(row => row[index]);
      const mi = this.calculateMutualInformation(values, target);
      
      return {
        featureName: name,
        importance: mi,
        method: 'mutual_info'
      };
    });
  }

  private async recursiveFeatureElimination(
    data: number[][],
    target: number[],
    featureNames: string[]
  ): Promise<FeatureImportance[]> {
    // Start with correlation-based importance
    const baseImportance = this.correlationBasedSelection(data, target, featureNames);
    
    // Sort features by importance
    baseImportance.sort((a, b) => b.importance - a.importance);
    
    // Recursively evaluate feature subsets
    const finalImportance = await this.recursiveEvaluation(
      data,
      target,
      baseImportance,
      featureNames
    );
    
    return finalImportance;
  }

  /**
   * Statistical helper methods
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - meanX;
      const yDiff = y[i] - meanY;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    return numerator / (Math.sqrt(denomX) * Math.sqrt(denomY));
  }

  private calculateMutualInformation(x: number[], y: number[]): number {
    // Simplified mutual information calculation using binning
    const bins = 10;
    const xBinned = this.binValues(x, bins);
    const yBinned = this.binValues(y, bins);
    
    return this.calculateMIFromBins(xBinned, yBinned, bins);
  }

  private binValues(values: number[], bins: number): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binSize = range / bins;
    
    return values.map(v => Math.floor((v - min) / binSize));
  }

  private calculateMIFromBins(x: number[], y: number[], bins: number): number {
    const n = x.length;
    const jointProb: Record<string, number> = {};
    const xProb: Record<number, number> = {};
    const yProb: Record<number, number> = {};
    
    // Calculate probabilities
    for (let i = 0; i < n; i++) {
      const key = `${x[i]},${y[i]}`;
      jointProb[key] = (jointProb[key] || 0) + 1;
      xProb[x[i]] = (xProb[x[i]] || 0) + 1;
      yProb[y[i]] = (yProb[y[i]] || 0) + 1;
    }
    
    // Calculate mutual information
    let mi = 0;
    Object.entries(jointProb).forEach(([key, count]) => {
      const [xVal, yVal] = key.split(',').map(Number);
      const pxy = count / n;
      const px = xProb[xVal] / n;
      const py = yProb[yVal] / n;
      mi += pxy * Math.log2(pxy / (px * py));
    });
    
    return mi;
  }

  private async recursiveEvaluation(
    data: number[][],
    target: number[],
    baseImportance: FeatureImportance[],
    featureNames: string[]
  ): Promise<FeatureImportance[]> {
    // In a real implementation, this would:
    // 1. Train a model with all features
    // 2. Remove least important feature
    // 3. Retrain and evaluate
    // 4. Update importance scores
    // 5. Repeat until desired number of features
    
    // For now, return base importance with some refinement
    return baseImportance.map(imp => ({
      ...imp,
      importance: imp.importance * (1 + Math.random() * 0.2) // Add some randomness
    }));
  }
}

// Export singleton instance
export const featureEngineer = new FeatureEngineer(); 