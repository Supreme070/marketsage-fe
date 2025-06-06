/**
 * Model Interpretability System
 * ============================
 * SHAP (SHapley Additive exPlanations) values calculation and
 * feature importance analysis for model interpretability.
 */

import { logger } from '@/lib/logger';
import { featureEngineer, FeatureStats } from './feature-engineering';
import { aiModelCache, CachedModel } from './model-cache';

export interface ShapValue {
  feature: string;
  value: number;
  baseValue: number;
  impact: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  correlation?: number;
  stats?: Partial<FeatureStats>;
}

export interface InterpretabilityResult {
  shapValues: ShapValue[];
  featureImportance: FeatureImportance[];
  summary: {
    topFeatures: string[];
    impactfulInteractions: Array<[string, string, number]>;
    modelConfidence: number;
  };
}

export class ModelInterpreter {
  /**
   * Calculate SHAP values for a prediction
   */
  async calculateShapValues(
    modelId: string,
    input: Record<string, any>,
    prediction: number[]
  ): Promise<ShapValue[]> {
    try {
      const model = await aiModelCache.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      const features = featureEngineer.getFeatures();
      const baseValues = await this.calculateBaseValues(model, features);
      
      // Calculate SHAP values using model weights and feature contributions
      const shapValues = await this.computeShapValues(
        model,
        input,
        prediction,
        baseValues
      );
      
      return shapValues;
      
    } catch (error) {
      logger.error('SHAP calculation failed', {
        modelId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Analyze feature importance
   */
  async analyzeFeatureImportance(
    modelId: string,
    recentPredictions: Array<{
      input: Record<string, any>;
      prediction: number[];
      actual?: number[];
    }>
  ): Promise<FeatureImportance[]> {
    try {
      const model = await aiModelCache.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      // Get feature statistics
      const featureStats = featureEngineer.getFeatureStats();
      
      // Calculate importance scores
      const importance = await this.calculateFeatureImportance(
        model,
        recentPredictions,
        featureStats
      );
      
      // Sort by importance
      return importance.sort((a, b) => b.importance - a.importance);
      
    } catch (error) {
      logger.error('Feature importance analysis failed', {
        modelId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Generate comprehensive interpretability report
   */
  async generateInterpretabilityReport(
    modelId: string,
    input: Record<string, any>,
    prediction: number[],
    recentPredictions: Array<{
      input: Record<string, any>;
      prediction: number[];
      actual?: number[];
    }>
  ): Promise<InterpretabilityResult> {
    // Calculate SHAP values
    const shapValues = await this.calculateShapValues(
      modelId,
      input,
      prediction
    );
    
    // Analyze feature importance
    const featureImportance = await this.analyzeFeatureImportance(
      modelId,
      recentPredictions
    );
    
    // Generate summary
    const summary = {
      topFeatures: featureImportance
        .slice(0, 5)
        .map(f => f.feature),
      impactfulInteractions: await this.findFeatureInteractions(
        shapValues,
        featureImportance
      ),
      modelConfidence: this.calculateModelConfidence(
        shapValues,
        prediction
      )
    };
    
    return {
      shapValues,
      featureImportance,
      summary
    };
  }
  
  /**
   * Calculate base values for SHAP computation
   */
  private async calculateBaseValues(
    model: CachedModel,
    features: any[]
  ): Promise<Record<string, number>> {
    const baseValues: Record<string, number> = {};
    
    // Use model weights to estimate feature base values
    for (let i = 0; i < model.weights[0].length; i++) {
      const featureName = features[i]?.name;
      if (featureName) {
        baseValues[featureName] = this.calculateFeatureBaseValue(
          model.weights.map(layer => layer[i])
        );
      }
    }
    
    return baseValues;
  }
  
  /**
   * Calculate base value for a single feature
   */
  private calculateFeatureBaseValue(weights: number[]): number {
    // Use average absolute weight as base value
    return weights.reduce((sum, w) => sum + Math.abs(w), 0) / weights.length;
  }
  
  /**
   * Compute SHAP values
   */
  private async computeShapValues(
    model: CachedModel,
    input: Record<string, any>,
    prediction: number[],
    baseValues: Record<string, number>
  ): Promise<ShapValue[]> {
    const shapValues: ShapValue[] = [];
    
    for (const [feature, value] of Object.entries(input)) {
      const baseValue = baseValues[feature] || 0;
      
      // Calculate feature contribution
      const impact = this.calculateFeatureImpact(
        model,
        feature,
        value,
        prediction
      );
      
      shapValues.push({
        feature,
        value: Number(value),
        baseValue,
        impact
      });
    }
    
    return shapValues;
  }
  
  /**
   * Calculate feature importance scores
   */
  private async calculateFeatureImportance(
    model: CachedModel,
    predictions: Array<{
      input: Record<string, any>;
      prediction: number[];
      actual?: number[];
    }>,
    featureStats: FeatureStats[]
  ): Promise<FeatureImportance[]> {
    const importance: Record<string, {
      totalImpact: number;
      count: number;
      correlation?: number;
      stats?: Partial<FeatureStats>;
    }> = {};
    
    // Calculate importance based on prediction impacts
    for (const { input, prediction, actual } of predictions) {
      const shapValues = await this.computeShapValues(
        model,
        input,
        prediction,
        {}
      );
      
      for (const { feature, impact } of shapValues) {
        if (!importance[feature]) {
          importance[feature] = {
            totalImpact: 0,
            count: 0,
            stats: featureStats.find(s => s.name === feature)
          };
        }
        
        importance[feature].totalImpact += Math.abs(impact);
        importance[feature].count++;
      }
    }
    
    // Convert to array and normalize
    return Object.entries(importance).map(([feature, data]) => ({
      feature,
      importance: data.totalImpact / data.count,
      correlation: data.correlation,
      stats: data.stats
    }));
  }
  
  /**
   * Calculate feature impact on prediction
   */
  private calculateFeatureImpact(
    model: CachedModel,
    feature: string,
    value: any,
    prediction: number[]
  ): number {
    // Simple impact calculation using weight contributions
    const featureIndex = model.weights[0].findIndex((_, i) => 
      model.config.features?.[i] === feature
    );
    
    if (featureIndex === -1) return 0;
    
    let impact = 0;
    for (let layer = 0; layer < model.weights.length; layer++) {
      impact += model.weights[layer][featureIndex] * 
        (typeof value === 'number' ? value : 1);
    }
    
    // Normalize by prediction magnitude
    const predictionMagnitude = Math.sqrt(
      prediction.reduce((sum, p) => sum + p * p, 0)
    );
    
    return impact / (predictionMagnitude || 1);
  }
  
  /**
   * Find important feature interactions
   */
  private async findFeatureInteractions(
    shapValues: ShapValue[],
    featureImportance: FeatureImportance[]
  ): Promise<Array<[string, string, number]>> {
    const interactions: Array<[string, string, number]> = [];
    
    // Look for features with correlated impacts
    for (let i = 0; i < shapValues.length; i++) {
      for (let j = i + 1; j < shapValues.length; j++) {
        const feature1 = shapValues[i];
        const feature2 = shapValues[j];
        
        const importance1 = featureImportance.find(
          f => f.feature === feature1.feature
        );
        const importance2 = featureImportance.find(
          f => f.feature === feature2.feature
        );
        
        if (importance1 && importance2) {
          const interactionStrength = this.calculateInteractionStrength(
            feature1,
            feature2,
            importance1,
            importance2
          );
          
          if (interactionStrength > 0.1) { // Threshold for significant interaction
            interactions.push([
              feature1.feature,
              feature2.feature,
              interactionStrength
            ]);
          }
        }
      }
    }
    
    // Sort by interaction strength
    return interactions.sort((a, b) => b[2] - a[2]);
  }
  
  /**
   * Calculate interaction strength between features
   */
  private calculateInteractionStrength(
    feature1: ShapValue,
    feature2: ShapValue,
    importance1: FeatureImportance,
    importance2: FeatureImportance
  ): number {
    const impactCorrelation = Math.abs(
      (feature1.impact * feature2.impact) /
      (Math.abs(feature1.impact) + Math.abs(feature2.impact))
    );
    
    const importanceProduct = 
      Math.sqrt(importance1.importance * importance2.importance);
    
    return impactCorrelation * importanceProduct;
  }
  
  /**
   * Calculate model confidence based on SHAP values
   */
  private calculateModelConfidence(
    shapValues: ShapValue[],
    prediction: number[]
  ): number {
    // Calculate consistency of feature contributions
    const totalImpact = shapValues.reduce(
      (sum, shap) => sum + Math.abs(shap.impact),
      0
    );
    
    const impactConsistency = shapValues.reduce((consistency, shap) => {
      const relativeImpact = Math.abs(shap.impact) / totalImpact;
      return consistency - (relativeImpact * Math.log2(relativeImpact));
    }, 0);
    
    // Combine with prediction confidence
    const predictionConfidence = Math.max(...prediction);
    
    return (predictionConfidence + (1 - impactConsistency)) / 2;
  }
}

// Export singleton instance
export const modelInterpreter = new ModelInterpreter(); 