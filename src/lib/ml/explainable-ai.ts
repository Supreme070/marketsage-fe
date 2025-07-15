/**
 * Explainable AI Module for MarketSage
 * Implements SHAP-like feature importance, LIME, and model interpretability
 */

import { logger } from '@/lib/logger';

// Feature importance types
export interface FeatureImportance {
  feature: string;
  importance: number;
  type: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface ExplanationResult {
  prediction: number;
  confidence: number;
  baseValue: number;
  featureImportances: FeatureImportance[];
  globalImportance: FeatureImportance[];
  explanationMethod: string;
  insights: string[];
  visualizationData: any;
}

// Shapley Value Calculator (SHAP-like implementation)
export class ShapleyExplainer {
  private model: (features: number[]) => number;
  private baseline: number[];
  private featureNames: string[];
  private coalitionCache: Map<string, number> = new Map();

  constructor(
    model: (features: number[]) => number,
    baseline: number[],
    featureNames: string[]
  ) {
    this.model = model;
    this.baseline = baseline;
    this.featureNames = featureNames;
  }

  /**
   * Calculate SHAP values for a given instance
   */
  explain(instance: number[], maxSamples = 1000): ExplanationResult {
    try {
      const shapValues = this.calculateShapValues(instance, maxSamples);
      const prediction = this.model(instance);
      const baseValue = this.model(this.baseline);
      
      // Convert to feature importance format
      const featureImportances: FeatureImportance[] = shapValues.map((value, index) => ({
        feature: this.featureNames[index] || `feature_${index}`,
        importance: Math.abs(value),
        type: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral',
        confidence: this.calculateConfidence(value, shapValues)
      }));

      // Sort by importance
      featureImportances.sort((a, b) => b.importance - a.importance);

      // Generate insights
      const insights = this.generateShapInsights(shapValues, featureImportances, prediction, baseValue);

      // Create visualization data
      const visualizationData = this.createVisualizationData(shapValues, featureImportances, instance);

      return {
        prediction,
        confidence: 0.85,
        baseValue,
        featureImportances,
        globalImportance: [], // Will be populated if global analysis is run
        explanationMethod: 'SHAP (Shapley Additive Explanations)',
        insights,
        visualizationData
      };
    } catch (error) {
      logger.error('SHAP explanation failed', { error });
      throw error;
    }
  }

  /**
   * Calculate global feature importance across multiple instances
   */
  explainGlobal(instances: number[][], maxSamples = 500): FeatureImportance[] {
    const globalShapValues = Array(this.featureNames.length).fill(0);
    const shapMatrix: number[][] = [];

    for (const instance of instances) {
      const shapValues = this.calculateShapValues(instance, maxSamples);
      shapMatrix.push(shapValues);
      
      // Accumulate absolute SHAP values
      for (let i = 0; i < shapValues.length; i++) {
        globalShapValues[i] += Math.abs(shapValues[i]);
      }
    }

    // Average and normalize
    const totalInstances = instances.length;
    const globalImportance: FeatureImportance[] = globalShapValues.map((value, index) => {
      const avgImportance = value / totalInstances;
      const variance = this.calculateVariance(shapMatrix.map(row => row[index]));
      
      return {
        feature: this.featureNames[index] || `feature_${index}`,
        importance: avgImportance,
        type: 'neutral', // Global importance doesn't have direction
        confidence: 1 / (1 + variance) // Higher variance = lower confidence
      };
    });

    return globalImportance.sort((a, b) => b.importance - a.importance);
  }

  private calculateShapValues(instance: number[], maxSamples: number): number[] {
    const numFeatures = instance.length;
    const shapValues = Array(numFeatures).fill(0);

    // Sample coalitions efficiently
    for (let sample = 0; sample < maxSamples; sample++) {
      const coalition = this.sampleCoalition(numFeatures);
      
      for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
        // Coalition without feature
        const coalitionWithout = coalition.filter(idx => idx !== featureIndex);
        // Coalition with feature
        const coalitionWith = [...coalitionWithout, featureIndex];

        const valueWithout = this.evaluateCoalition(coalitionWithout, instance);
        const valueWith = this.evaluateCoalition(coalitionWith, instance);

        // Marginal contribution
        const marginalContribution = valueWith - valueWithout;
        shapValues[featureIndex] += marginalContribution;
      }
    }

    // Average over samples
    return shapValues.map(value => value / maxSamples);
  }

  private sampleCoalition(numFeatures: number): number[] {
    const coalition: number[] = [];
    for (let i = 0; i < numFeatures; i++) {
      if (Math.random() > 0.5) {
        coalition.push(i);
      }
    }
    return coalition;
  }

  private evaluateCoalition(coalition: number[], instance: number[]): number {
    const coalitionKey = coalition.sort().join(',');
    
    if (this.coalitionCache.has(coalitionKey)) {
      return this.coalitionCache.get(coalitionKey)!;
    }

    // Create coalition instance
    const coalitionInstance = [...this.baseline];
    for (const featureIndex of coalition) {
      coalitionInstance[featureIndex] = instance[featureIndex];
    }

    const value = this.model(coalitionInstance);
    this.coalitionCache.set(coalitionKey, value);
    
    return value;
  }

  private calculateConfidence(value: number, allValues: number[]): number {
    const variance = this.calculateVariance(allValues);
    const normalizedValue = Math.abs(value) / (Math.abs(value) + variance + 1e-8);
    return Math.min(1, normalizedValue);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private generateShapInsights(shapValues: number[], featureImportances: FeatureImportance[], prediction: number, baseValue: number): string[] {
    const insights: string[] = [];

    // Overall prediction insight
    const change = prediction - baseValue;
    insights.push(`Prediction ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(3)} from baseline`);

    // Top contributing features
    const topPositive = featureImportances.filter(f => f.type === 'positive').slice(0, 3);
    const topNegative = featureImportances.filter(f => f.type === 'negative').slice(0, 3);

    if (topPositive.length > 0) {
      insights.push(`Top positive contributors: ${topPositive.map(f => f.feature).join(', ')}`);
    }

    if (topNegative.length > 0) {
      insights.push(`Top negative contributors: ${topNegative.map(f => f.feature).join(', ')}`);
    }

    // Feature interaction insights
    const interactionStrength = this.calculateInteractionStrength(shapValues);
    if (interactionStrength > 0.1) {
      insights.push('Strong feature interactions detected - consider non-linear relationships');
    }

    return insights;
  }

  private calculateInteractionStrength(shapValues: number[]): number {
    // Simplified interaction strength calculation
    const variance = this.calculateVariance(shapValues);
    const meanAbsValue = shapValues.reduce((sum, val) => sum + Math.abs(val), 0) / shapValues.length;
    return variance / (meanAbsValue + 1e-8);
  }

  private createVisualizationData(shapValues: number[], featureImportances: FeatureImportance[], instance: number[]): any {
    return {
      waterfallData: this.createWaterfallData(shapValues),
      barChartData: this.createBarChartData(featureImportances),
      forceplotData: this.createForceplotData(shapValues, instance),
      summaryPlotData: this.createSummaryPlotData(featureImportances)
    };
  }

  private createWaterfallData(shapValues: number[]): any {
    let cumulativeValue = this.model(this.baseline);
    const waterfallData = [{ name: 'Baseline', value: cumulativeValue }];

    for (let i = 0; i < shapValues.length; i++) {
      cumulativeValue += shapValues[i];
      waterfallData.push({
        name: this.featureNames[i] || `feature_${i}`,
        value: shapValues[i],
        cumulative: cumulativeValue
      });
    }

    return waterfallData;
  }

  private createBarChartData(featureImportances: FeatureImportance[]): any {
    return featureImportances.map(fi => ({
      feature: fi.feature,
      importance: fi.importance,
      type: fi.type
    }));
  }

  private createForceplotData(shapValues: number[], instance: number[]): any {
    return shapValues.map((value, index) => ({
      feature: this.featureNames[index] || `feature_${index}`,
      shapValue: value,
      featureValue: instance[index],
      type: value > 0 ? 'positive' : 'negative'
    }));
  }

  private createSummaryPlotData(featureImportances: FeatureImportance[]): any {
    return {
      features: featureImportances.map(fi => fi.feature),
      importances: featureImportances.map(fi => fi.importance),
      types: featureImportances.map(fi => fi.type)
    };
  }
}

// LIME (Local Interpretable Model-agnostic Explanations) implementation
export class LimeExplainer {
  private model: (features: number[]) => number;
  private featureNames: string[];
  private samplingStrategy: 'gaussian' | 'uniform' = 'gaussian';

  constructor(
    model: (features: number[]) => number,
    featureNames: string[],
    samplingStrategy: 'gaussian' | 'uniform' = 'gaussian'
  ) {
    this.model = model;
    this.featureNames = featureNames;
    this.samplingStrategy = samplingStrategy;
  }

  /**
   * Explain prediction using LIME methodology
   */
  explain(instance: number[], numSamples = 1000): ExplanationResult {
    try {
      // Generate neighborhood samples
      const samples = this.generateNeighborhood(instance, numSamples);
      
      // Get predictions for all samples
      const predictions = samples.map(sample => this.model(sample));
      
      // Calculate distances (weights)
      const distances = samples.map(sample => this.calculateDistance(instance, sample));
      const weights = distances.map(dist => this.kernelFunction(dist));
      
      // Fit local linear model
      const localModel = this.fitLocalLinearModel(samples, predictions, weights);
      
      // Extract feature importance
      const featureImportances: FeatureImportance[] = localModel.coefficients.map((coef, index) => ({
        feature: this.featureNames[index] || `feature_${index}`,
        importance: Math.abs(coef),
        type: coef > 0 ? 'positive' : coef < 0 ? 'negative' : 'neutral',
        confidence: this.calculateCoefficientConfidence(coef, localModel.standardErrors[index])
      }));

      featureImportances.sort((a, b) => b.importance - a.importance);

      // Generate insights
      const insights = this.generateLimeInsights(localModel, featureImportances, instance);

      // Create visualization data
      const visualizationData = this.createLimeVisualizationData(localModel, featureImportances, instance);

      return {
        prediction: this.model(instance),
        confidence: localModel.r2,
        baseValue: localModel.intercept,
        featureImportances,
        globalImportance: [],
        explanationMethod: 'LIME (Local Interpretable Model-agnostic Explanations)',
        insights,
        visualizationData
      };
    } catch (error) {
      logger.error('LIME explanation failed', { error });
      throw error;
    }
  }

  private generateNeighborhood(instance: number[], numSamples: number): number[][] {
    const samples: number[][] = [];
    
    for (let i = 0; i < numSamples; i++) {
      const sample = [...instance];
      
      for (let j = 0; j < instance.length; j++) {
        if (this.samplingStrategy === 'gaussian') {
          // Gaussian perturbation
          const noise = this.gaussianRandom() * 0.1; // 10% noise
          sample[j] += noise * Math.abs(instance[j]);
        } else {
          // Uniform perturbation
          const noise = (Math.random() - 0.5) * 0.2; // ±10% noise
          sample[j] += noise * Math.abs(instance[j]);
        }
      }
      
      samples.push(sample);
    }
    
    return samples;
  }

  private gaussianRandom(): number {
    // Box-Muller transformation for Gaussian random numbers
    let u1 = Math.random();
    const u2 = Math.random();
    
    u1 = Math.max(1e-8, u1); // Avoid log(0)
    
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private calculateDistance(instance1: number[], instance2: number[]): number {
    let sumSquaredDiffs = 0;
    
    for (let i = 0; i < instance1.length; i++) {
      const diff = instance1[i] - instance2[i];
      sumSquaredDiffs += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiffs);
  }

  private kernelFunction(distance: number, bandwidth = 1.0): number {
    // Exponential kernel
    return Math.exp(-distance * distance / (bandwidth * bandwidth));
  }

  private fitLocalLinearModel(samples: number[][], predictions: number[], weights: number[]): {
    coefficients: number[];
    intercept: number;
    r2: number;
    standardErrors: number[];
  } {
    const n = samples.length;
    const p = samples[0].length;
    
    // Create design matrix with intercept column
    const X = samples.map(sample => [1, ...sample]);
    
    // Weighted least squares: (X'WX)^-1 X'Wy
    const XtW = this.multiplyMatrixTransposeWithDiagonal(X, weights);
    const XtWX = this.multiplyMatrices(XtW, X);
    const XtWy = this.multiplyMatrixVector(XtW, predictions);
    
    // Solve normal equations
    const coefficientsWithIntercept = this.solveLinearSystem(XtWX, XtWy);
    
    const intercept = coefficientsWithIntercept[0];
    const coefficients = coefficientsWithIntercept.slice(1);
    
    // Calculate R²
    const predictions_hat = samples.map(sample => {
      return intercept + sample.reduce((sum, val, idx) => sum + val * coefficients[idx], 0);
    });
    
    const r2 = this.calculateR2(predictions, predictions_hat, weights);
    
    // Calculate standard errors (simplified)
    const standardErrors = coefficients.map((_, idx) => Math.sqrt(1 / (n + 1))); // Placeholder
    
    return { coefficients, intercept, r2, standardErrors };
  }

  private multiplyMatrixTransposeWithDiagonal(matrix: number[][], diagonal: number[]): number[][] {
    const rows = matrix[0].length;
    const cols = matrix.length;
    const result: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[i][j] = matrix[j][i] * diagonal[j];
      }
    }
    
    return result;
  }

  private multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    
    const result: number[][] = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));
    
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    
    return result;
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
    );
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    // Gaussian elimination with partial pivoting
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[i][i]) < 1e-10) continue; // Skip if pivot is too small
        
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const solution = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      if (Math.abs(augmented[i][i]) > 1e-10) {
        solution[i] /= augmented[i][i];
      }
    }
    
    return solution;
  }

  private calculateR2(actual: number[], predicted: number[], weights: number[]): number {
    const weightedMean = actual.reduce((sum, val, idx) => sum + val * weights[idx], 0) /
                         weights.reduce((sum, w) => sum + w, 0);
    
    let ssTot = 0;
    let ssRes = 0;
    
    for (let i = 0; i < actual.length; i++) {
      ssTot += weights[i] * Math.pow(actual[i] - weightedMean, 2);
      ssRes += weights[i] * Math.pow(actual[i] - predicted[i], 2);
    }
    
    return 1 - (ssRes / ssTot);
  }

  private calculateCoefficientConfidence(coefficient: number, standardError: number): number {
    const tStat = Math.abs(coefficient / (standardError + 1e-8));
    return Math.min(1, tStat / 2); // Simplified confidence calculation
  }

  private generateLimeInsights(localModel: any, featureImportances: FeatureImportance[], instance: number[]): string[] {
    const insights: string[] = [];

    insights.push(`Local linear model R² = ${localModel.r2.toFixed(3)} - ${localModel.r2 > 0.8 ? 'excellent' : localModel.r2 > 0.6 ? 'good' : 'fair'} local approximation`);

    const topFeatures = featureImportances.slice(0, 3);
    insights.push(`Top local drivers: ${topFeatures.map(f => `${f.feature} (${f.type})`).join(', ')}`);

    const totalImportance = featureImportances.reduce((sum, f) => sum + f.importance, 0);
    const topImportanceRatio = topFeatures.reduce((sum, f) => sum + f.importance, 0) / totalImportance;
    
    if (topImportanceRatio > 0.7) {
      insights.push('Prediction driven by few key features - model shows clear local patterns');
    } else {
      insights.push('Prediction influenced by many features - complex local relationships');
    }

    return insights;
  }

  private createLimeVisualizationData(localModel: any, featureImportances: FeatureImportance[], instance: number[]): any {
    return {
      coefficientsPlot: {
        features: this.featureNames,
        coefficients: localModel.coefficients,
        standardErrors: localModel.standardErrors
      },
      importanceBars: featureImportances.map(fi => ({
        feature: fi.feature,
        importance: fi.importance,
        type: fi.type,
        confidence: fi.confidence
      })),
      localFit: {
        r2: localModel.r2,
        intercept: localModel.intercept,
        numFeatures: this.featureNames.length
      }
    };
  }
}

// Permutation-based feature importance
export class PermutationImportance {
  private model: (features: number[]) => number;
  private featureNames: string[];

  constructor(model: (features: number[]) => number, featureNames: string[]) {
    this.model = model;
    this.featureNames = featureNames;
  }

  /**
   * Calculate permutation importance for all features
   */
  explain(testData: number[][], testTargets: number[]): FeatureImportance[] {
    const baselineScore = this.calculateScore(testData, testTargets);
    const importances: FeatureImportance[] = [];

    for (let featureIndex = 0; featureIndex < this.featureNames.length; featureIndex++) {
      // Permute feature values
      const permutedData = this.permuteFeature(testData, featureIndex);
      const permutedScore = this.calculateScore(permutedData, testTargets);
      
      // Importance is the decrease in performance
      const importance = baselineScore - permutedScore;
      
      importances.push({
        feature: this.featureNames[featureIndex],
        importance: Math.abs(importance),
        type: importance > 0 ? 'positive' : 'negative',
        confidence: this.calculatePermutationConfidence(importance, baselineScore)
      });
    }

    return importances.sort((a, b) => b.importance - a.importance);
  }

  private permuteFeature(data: number[][], featureIndex: number): number[][] {
    const permutedData = data.map(row => [...row]);
    const featureValues = data.map(row => row[featureIndex]);
    
    // Fisher-Yates shuffle
    for (let i = featureValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [featureValues[i], featureValues[j]] = [featureValues[j], featureValues[i]];
    }
    
    // Assign shuffled values
    for (let i = 0; i < permutedData.length; i++) {
      permutedData[i][featureIndex] = featureValues[i];
    }
    
    return permutedData;
  }

  private calculateScore(data: number[][], targets: number[]): number {
    const predictions = data.map(row => this.model(row));
    
    // Calculate Mean Squared Error
    const mse = predictions.reduce((sum, pred, idx) => {
      return sum + Math.pow(pred - targets[idx], 2);
    }, 0) / predictions.length;
    
    return -mse; // Negative MSE (higher is better)
  }

  private calculatePermutationConfidence(importance: number, baselineScore: number): number {
    return Math.min(1, Math.abs(importance) / Math.abs(baselineScore));
  }
}

// Integrated Gradients for neural network interpretability
export class IntegratedGradients {
  private model: (features: number[]) => number;
  private featureNames: string[];
  private baseline: number[];

  constructor(
    model: (features: number[]) => number,
    featureNames: string[],
    baseline?: number[]
  ) {
    this.model = model;
    this.featureNames = featureNames;
    this.baseline = baseline || Array(featureNames.length).fill(0);
  }

  /**
   * Calculate integrated gradients
   */
  explain(instance: number[], steps = 50): ExplanationResult {
    const gradients = this.calculateIntegratedGradients(instance, steps);
    const prediction = this.model(instance);
    const baseValue = this.model(this.baseline);

    const featureImportances: FeatureImportance[] = gradients.map((grad, index) => ({
      feature: this.featureNames[index] || `feature_${index}`,
      importance: Math.abs(grad),
      type: grad > 0 ? 'positive' : grad < 0 ? 'negative' : 'neutral',
      confidence: this.calculateGradientConfidence(grad, gradients)
    }));

    featureImportances.sort((a, b) => b.importance - a.importance);

    const insights = this.generateGradientInsights(gradients, featureImportances, prediction, baseValue);
    const visualizationData = this.createGradientVisualizationData(gradients, featureImportances, instance);

    return {
      prediction,
      confidence: 0.8,
      baseValue,
      featureImportances,
      globalImportance: [],
      explanationMethod: 'Integrated Gradients',
      insights,
      visualizationData
    };
  }

  private calculateIntegratedGradients(instance: number[], steps: number): number[] {
    const integratedGrads = Array(instance.length).fill(0);

    for (let step = 0; step <= steps; step++) {
      const alpha = step / steps;
      const interpolated = this.baseline.map((base, idx) => 
        base + alpha * (instance[idx] - base)
      );

      const gradients = this.computeGradients(interpolated);
      
      for (let i = 0; i < integratedGrads.length; i++) {
        integratedGrads[i] += gradients[i];
      }
    }

    // Scale by step size and input difference
    return integratedGrads.map((grad, idx) => 
      (grad / steps) * (instance[idx] - this.baseline[idx])
    );
  }

  private computeGradients(instance: number[]): number[] {
    const epsilon = 1e-7;
    const gradients = Array(instance.length).fill(0);

    for (let i = 0; i < instance.length; i++) {
      const instancePlus = [...instance];
      const instanceMinus = [...instance];
      
      instancePlus[i] += epsilon;
      instanceMinus[i] -= epsilon;

      const outputPlus = this.model(instancePlus);
      const outputMinus = this.model(instanceMinus);

      gradients[i] = (outputPlus - outputMinus) / (2 * epsilon);
    }

    return gradients;
  }

  private calculateGradientConfidence(gradient: number, allGradients: number[]): number {
    const maxGradient = Math.max(...allGradients.map(Math.abs));
    return Math.abs(gradient) / (maxGradient + 1e-8);
  }

  private generateGradientInsights(gradients: number[], featureImportances: FeatureImportance[], prediction: number, baseValue: number): string[] {
    const insights: string[] = [];

    const totalGradient = gradients.reduce((sum, grad) => sum + Math.abs(grad), 0);
    insights.push(`Total gradient magnitude: ${totalGradient.toFixed(4)}`);

    const positiveGradients = gradients.filter(g => g > 0).length;
    const negativeGradients = gradients.filter(g => g < 0).length;
    
    insights.push(`Feature directions: ${positiveGradients} positive, ${negativeGradients} negative`);

    const topFeature = featureImportances[0];
    insights.push(`Strongest gradient: ${topFeature.feature} (${topFeature.type} contribution)`);

    return insights;
  }

  private createGradientVisualizationData(gradients: number[], featureImportances: FeatureImportance[], instance: number[]): any {
    return {
      gradientBars: featureImportances.map((fi, idx) => ({
        feature: fi.feature,
        gradient: gradients[idx],
        featureValue: instance[idx],
        importance: fi.importance
      })),
      gradientFlow: gradients.map((grad, idx) => ({
        feature: this.featureNames[idx],
        gradient: grad,
        step: idx
      }))
    };
  }
}

// MarketSage Explainable AI Applications
export class MarketSageExplainableAI {
  
  /**
   * Comprehensive model explanation using multiple methods
   */
  static async explainPrediction(
    model: (features: number[]) => number,
    instance: number[],
    featureNames: string[],
    baseline?: number[]
  ): Promise<{
    shap: ExplanationResult;
    lime: ExplanationResult;
    integratedGradients: ExplanationResult;
    consensus: ExplanationResult;
    recommendations: string[];
  }> {
    try {
      // SHAP explanation
      const shapExplainer = new ShapleyExplainer(model, baseline || Array(instance.length).fill(0), featureNames);
      const shapResult = shapExplainer.explain(instance);

      // LIME explanation
      const limeExplainer = new LimeExplainer(model, featureNames);
      const limeResult = limeExplainer.explain(instance);

      // Integrated Gradients explanation
      const igExplainer = new IntegratedGradients(model, featureNames, baseline);
      const igResult = igExplainer.explain(instance);

      // Create consensus explanation
      const consensusResult = this.createConsensusExplanation([shapResult, limeResult, igResult]);

      // Generate recommendations
      const recommendations = this.generateExplanationRecommendations(consensusResult, shapResult, limeResult, igResult);

      return {
        shap: shapResult,
        lime: limeResult,
        integratedGradients: igResult,
        consensus: consensusResult,
        recommendations
      };
    } catch (error) {
      logger.error('Comprehensive explanation failed', { error });
      throw error;
    }
  }

  /**
   * Customer churn explanation for MarketSage
   */
  static async explainChurnPrediction(
    customerFeatures: number[],
    churnModel: (features: number[]) => number
  ): Promise<ExplanationResult & { churnRiskFactors: string[]; retentionStrategies: string[] }> {
    const featureNames = [
      'engagement_score', 'days_since_last_login', 'transaction_frequency',
      'support_tickets', 'feature_usage', 'payment_issues', 'campaign_response',
      'account_age', 'transaction_value', 'mobile_app_usage'
    ];

    const baseline = [0.5, 30, 1, 0, 0.3, 0, 0.2, 180, 100, 0.4]; // Average customer profile

    const explanation = await this.explainPrediction(churnModel, customerFeatures, featureNames, baseline);
    const consensusResult = explanation.consensus;

    // Extract churn-specific insights
    const churnRiskFactors = this.extractChurnRiskFactors(consensusResult.featureImportances);
    const retentionStrategies = this.generateRetentionStrategies(churnRiskFactors, customerFeatures, featureNames);

    return {
      ...consensusResult,
      churnRiskFactors,
      retentionStrategies
    };
  }

  /**
   * Campaign performance explanation
   */
  static async explainCampaignPerformance(
    campaignFeatures: number[],
    performanceModel: (features: number[]) => number
  ): Promise<ExplanationResult & { optimizationTips: string[]; audienceInsights: string[] }> {
    const featureNames = [
      'send_time_hour', 'day_of_week', 'subject_length', 'personalization_level',
      'content_type', 'audience_size', 'previous_engagement', 'seasonal_factor',
      'market_segment', 'channel_preference'
    ];

    const shapExplainer = new ShapleyExplainer(performanceModel, Array(campaignFeatures.length).fill(0.5), featureNames);
    const explanation = shapExplainer.explain(campaignFeatures);

    // Generate campaign-specific insights
    const optimizationTips = this.generateCampaignOptimizationTips(explanation.featureImportances, campaignFeatures, featureNames);
    const audienceInsights = this.generateAudienceInsights(explanation.featureImportances, campaignFeatures, featureNames);

    return {
      ...explanation,
      optimizationTips,
      audienceInsights
    };
  }

  private static createConsensusExplanation(explanations: ExplanationResult[]): ExplanationResult {
    // Average the feature importances across methods
    const allFeatures = explanations[0].featureImportances.map(fi => fi.feature);
    const consensusImportances: FeatureImportance[] = [];

    for (const feature of allFeatures) {
      const featureExplanations = explanations.map(exp => 
        exp.featureImportances.find(fi => fi.feature === feature)
      ).filter(Boolean) as FeatureImportance[];

      if (featureExplanations.length > 0) {
        const avgImportance = featureExplanations.reduce((sum, fi) => sum + fi.importance, 0) / featureExplanations.length;
        const avgConfidence = featureExplanations.reduce((sum, fi) => sum + fi.confidence, 0) / featureExplanations.length;
        
        // Determine consensus type
        const positiveCount = featureExplanations.filter(fi => fi.type === 'positive').length;
        const negativeCount = featureExplanations.filter(fi => fi.type === 'negative').length;
        const consensusType = positiveCount > negativeCount ? 'positive' : 
                             negativeCount > positiveCount ? 'negative' : 'neutral';

        consensusImportances.push({
          feature,
          importance: avgImportance,
          type: consensusType,
          confidence: avgConfidence
        });
      }
    }

    consensusImportances.sort((a, b) => b.importance - a.importance);

    return {
      prediction: explanations[0].prediction,
      confidence: explanations.reduce((sum, exp) => sum + exp.confidence, 0) / explanations.length,
      baseValue: explanations[0].baseValue,
      featureImportances: consensusImportances,
      globalImportance: [],
      explanationMethod: 'Consensus (SHAP + LIME + Integrated Gradients)',
      insights: ['Consensus explanation combining multiple interpretation methods', 
                'Higher reliability through method agreement'],
      visualizationData: explanations[0].visualizationData
    };
  }

  private static generateExplanationRecommendations(
    consensus: ExplanationResult,
    shap: ExplanationResult,
    lime: ExplanationResult,
    ig: ExplanationResult
  ): string[] {
    const recommendations: string[] = [];

    // Method agreement analysis
    const topFeatures = consensus.featureImportances.slice(0, 5);
    const shapTop = shap.featureImportances.slice(0, 5).map(fi => fi.feature);
    const limeTop = lime.featureImportances.slice(0, 5).map(fi => fi.feature);
    
    const agreement = topFeatures.filter(fi => 
      shapTop.includes(fi.feature) && limeTop.includes(fi.feature)
    ).length;

    if (agreement >= 3) {
      recommendations.push('High method agreement - explanation is highly reliable');
    } else if (agreement >= 2) {
      recommendations.push('Moderate method agreement - explanation is reasonably reliable');
    } else {
      recommendations.push('Low method agreement - consider additional validation');
    }

    // Confidence-based recommendations
    const avgConfidence = consensus.confidence;
    if (avgConfidence > 0.8) {
      recommendations.push('High confidence explanation - safe to use for decision making');
    } else if (avgConfidence > 0.6) {
      recommendations.push('Moderate confidence - consider additional context');
    } else {
      recommendations.push('Low confidence - use explanation with caution');
    }

    return recommendations;
  }

  private static extractChurnRiskFactors(featureImportances: FeatureImportance[]): string[] {
    const riskFactors: string[] = [];
    const topNegativeFeatures = featureImportances.filter(fi => fi.type === 'negative').slice(0, 3);

    for (const feature of topNegativeFeatures) {
      switch (feature.feature) {
        case 'engagement_score':
          riskFactors.push('Low engagement with platform features');
          break;
        case 'days_since_last_login':
          riskFactors.push('Extended period of inactivity');
          break;
        case 'transaction_frequency':
          riskFactors.push('Declining transaction activity');
          break;
        case 'support_tickets':
          riskFactors.push('Multiple unresolved support issues');
          break;
        case 'campaign_response':
          riskFactors.push('Poor response to marketing campaigns');
          break;
        default:
          riskFactors.push(`Issues with ${feature.feature.replace('_', ' ')}`);
      }
    }

    return riskFactors;
  }

  private static generateRetentionStrategies(riskFactors: string[], features: number[], featureNames: string[]): string[] {
    const strategies: string[] = [];

    // Map risk factors to strategies
    if (riskFactors.some(rf => rf.includes('engagement'))) {
      strategies.push('Implement personalized engagement campaigns');
      strategies.push('Provide feature tutorials and onboarding');
    }

    if (riskFactors.some(rf => rf.includes('inactivity'))) {
      strategies.push('Send re-engagement email sequences');
      strategies.push('Offer limited-time incentives to return');
    }

    if (riskFactors.some(rf => rf.includes('transaction'))) {
      strategies.push('Analyze transaction barriers and simplify process');
      strategies.push('Offer promotional rates or discounts');
    }

    if (riskFactors.some(rf => rf.includes('support'))) {
      strategies.push('Proactive customer success outreach');
      strategies.push('Priority support queue assignment');
    }

    return strategies;
  }

  private static generateCampaignOptimizationTips(featureImportances: FeatureImportance[], features: number[], featureNames: string[]): string[] {
    const tips: string[] = [];
    const topFeatures = featureImportances.slice(0, 5);

    for (const feature of topFeatures) {
      const featureIndex = featureNames.indexOf(feature.feature);
      const value = features[featureIndex];

      switch (feature.feature) {
        case 'send_time_hour':
          if (feature.type === 'positive') {
            tips.push(`Optimal send time detected - continue sending at ${Math.round(value)}:00`);
          } else {
            tips.push('Consider adjusting send time - current timing may be suboptimal');
          }
          break;
        case 'subject_length':
          if (value > 50) {
            tips.push('Subject line may be too long - consider shortening for better engagement');
          } else if (value < 20) {
            tips.push('Subject line may be too short - consider adding more context');
          }
          break;
        case 'personalization_level':
          if (feature.type === 'positive' && value < 0.7) {
            tips.push('Increase personalization - higher customization improves performance');
          }
          break;
        case 'audience_size':
          if (feature.type === 'negative' && value > 10000) {
            tips.push('Consider segmenting large audience for better targeting');
          }
          break;
      }
    }

    return tips;
  }

  private static generateAudienceInsights(featureImportances: FeatureImportance[], features: number[], featureNames: string[]): string[] {
    const insights: string[] = [];
    
    const engagementIndex = featureNames.indexOf('previous_engagement');
    const segmentIndex = featureNames.indexOf('market_segment');
    const channelIndex = featureNames.indexOf('channel_preference');

    if (engagementIndex >= 0) {
      const engagement = features[engagementIndex];
      if (engagement > 0.7) {
        insights.push('High-engagement audience - excellent for upselling campaigns');
      } else if (engagement < 0.3) {
        insights.push('Low-engagement audience - focus on re-activation strategies');
      }
    }

    if (segmentIndex >= 0) {
      const segment = Math.round(features[segmentIndex]);
      insights.push(`Target segment ${segment} - tailor messaging accordingly`);
    }

    if (channelIndex >= 0) {
      const channel = features[channelIndex];
      if (channel > 0.7) {
        insights.push('Audience prefers digital channels - leverage mobile and web');
      } else {
        insights.push('Audience may prefer traditional channels - consider mixed approach');
      }
    }

    return insights;
  }
}

// Classes are already exported individually above