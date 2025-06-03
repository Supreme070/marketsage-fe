/**
 * Supreme-AI AutoML Engine
 * ========================
 * Automated Machine Learning for optimal model selection and hyperparameter tuning
 * 
 * Features:
 * 🤖 Auto-hyperparameter tuning
 * 📊 Multiple algorithm comparison  
 * 🎯 Ensemble model creation
 * 📈 Performance tracking
 * 🔄 Auto-retraining triggers
 */

import { logger } from '@/lib/logger';

interface ModelConfig {
  algorithm: 'linear' | 'tree' | 'ensemble' | 'neural';
  hyperparams: Record<string, number>;
  performance: number;
  trainTime: number;
}

interface AutoMLResult {
  bestModel: ModelConfig;
  allModels: ModelConfig[];
  improvementPercent: number;
  confidence: number;
}

export class AutoMLEngine {
  private modelHistory: ModelConfig[] = [];
  private bestPerformance = 0;

  // Simplified Linear Regression
  private linearRegression(features: number[][], targets: number[], params: any) {
    const { learningRate = 0.01, iterations = 1000 } = params;
    
    const m = features.length;
    const n = features[0].length;
    const weights = Array(n).fill(0);
    let bias = 0;
    let totalLoss = 0;
    
    for (let iter = 0; iter < iterations; iter++) {
      const weightGradients = Array(n).fill(0);
      let biasGradient = 0;
      totalLoss = 0;
      
      for (let i = 0; i < m; i++) {
        const prediction = features[i].reduce((sum, feature, j) => sum + feature * weights[j], bias);
        const error = prediction - targets[i];
        totalLoss += error * error;
        
        for (let j = 0; j < n; j++) {
          weightGradients[j] += (2 / m) * error * features[i][j];
        }
        biasGradient += (2 / m) * error;
      }
      
      for (let j = 0; j < n; j++) {
        weights[j] -= learningRate * weightGradients[j];
      }
      bias -= learningRate * biasGradient;
    }
    
    return { weights, bias, loss: Math.sqrt(totalLoss / m) };
  }

  // Decision Tree (simplified)
  private decisionTree(features: number[][], targets: number[], params: any) {
    const { maxDepth = 5, minSamplesLeaf = 2 } = params;
    
    const buildTree = (indices: number[], depth: number): any => {
      if (depth >= maxDepth || indices.length <= minSamplesLeaf) {
        const avg = indices.reduce((sum, i) => sum + targets[i], 0) / indices.length;
        return { value: avg, isLeaf: true };
      }
      
      let bestSplit = { feature: 0, threshold: 0, gain: Number.NEGATIVE_INFINITY };
      
      for (let featureIdx = 0; featureIdx < features[0].length; featureIdx++) {
        const values = indices.map(i => features[i][featureIdx]).sort((a, b) => a - b);
        
        for (let i = 1; i < values.length; i++) {
          const threshold = (values[i] + values[i-1]) / 2;
          const leftIndices = indices.filter(idx => features[idx][featureIdx] <= threshold);
          const rightIndices = indices.filter(idx => features[idx][featureIdx] > threshold);
          
          if (leftIndices.length === 0 || rightIndices.length === 0) continue;
          
          const leftMean = leftIndices.reduce((sum, idx) => sum + targets[idx], 0) / leftIndices.length;
          const rightMean = rightIndices.reduce((sum, idx) => sum + targets[idx], 0) / rightIndices.length;
          
          const variance = indices.reduce((sum, idx) => {
            const target = targets[idx];
            const mean = target <= threshold ? leftMean : rightMean;
            return sum + (target - mean) ** 2;
          }, 0);
          
          const gain = -variance;
          if (gain > bestSplit.gain) {
            bestSplit = { feature: featureIdx, threshold, gain };
          }
        }
      }
      
      if (bestSplit.gain === Number.NEGATIVE_INFINITY) {
        const avg = indices.reduce((sum, i) => sum + targets[i], 0) / indices.length;
        return { value: avg, isLeaf: true };
      }
      
      const leftIndices = indices.filter(idx => features[idx][bestSplit.feature] <= bestSplit.threshold);
      const rightIndices = indices.filter(idx => features[idx][bestSplit.feature] > bestSplit.threshold);
      
      return {
        feature: bestSplit.feature,
        threshold: bestSplit.threshold,
        left: buildTree(leftIndices, depth + 1),
        right: buildTree(rightIndices, depth + 1),
        isLeaf: false
      };
    };
    
    const tree = buildTree(Array.from({ length: features.length }, (_, i) => i), 0);
    
    const predict = (feature: number[]): number => {
      let node = tree;
      while (!node.isLeaf) {
        node = feature[node.feature] <= node.threshold ? node.left : node.right;
      }
      return node.value;
    };
    
    const predictions = features.map(predict);
    const mse = targets.reduce((sum, target, i) => sum + (target - predictions[i]) ** 2, 0) / targets.length;
    
    return { tree, predict, loss: Math.sqrt(mse) };
  }

  // Random Forest (simplified ensemble)
  private randomForest(features: number[][], targets: number[], params: any) {
    const { nTrees = 10, maxDepth = 5 } = params;
    const trees: any[] = [];
    
    for (let i = 0; i < nTrees; i++) {
      // Bootstrap sampling
      const sampleIndices = Array.from({ length: features.length }, () => 
        Math.floor(Math.random() * features.length)
      );
      const sampleFeatures = sampleIndices.map(idx => features[idx]);
      const sampleTargets = sampleIndices.map(idx => targets[idx]);
      
      const tree = this.decisionTree(sampleFeatures, sampleTargets, { maxDepth });
      trees.push(tree);
    }
    
    const predict = (feature: number[]): number => {
      const predictions = trees.map(tree => tree.predict(feature));
      return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
    };
    
    const predictions = features.map(predict);
    const mse = targets.reduce((sum, target, i) => sum + (target - predictions[i]) ** 2, 0) / targets.length;
    
    return { trees, predict, loss: Math.sqrt(mse) };
  }

  // Neural Network (enhanced from previous)
  private neuralNetwork(features: number[][], targets: number[], params: any) {
    const { hiddenSize = 10, learningRate = 0.01, epochs = 500 } = params;
    const inputSize = features[0].length;
    
    // Initialize weights
    let weightsIH = Array.from({ length: inputSize }, () => 
      Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1)
    );
    let weightsHO = Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1);
    let biasH = Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1);
    let biasO = Math.random() * 2 - 1;
    
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    const sigmoidDerivative = (x: number) => x * (1 - x);
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < features.length; i++) {
        // Forward pass
        const hiddenInputs = Array.from({ length: hiddenSize }, (_, h) => 
          features[i].reduce((sum, input, j) => sum + input * weightsIH[j][h], biasH[h])
        );
        const hiddenOutputs = hiddenInputs.map(sigmoid);
        
        const finalInput = hiddenOutputs.reduce((sum, h, j) => sum + h * weightsHO[j], biasO);
        const finalOutput = sigmoid(finalInput);
        
        // Backward pass
        const outputError = targets[i] - finalOutput;
        const outputDelta = outputError * sigmoidDerivative(finalOutput);
        
        const hiddenErrors = weightsHO.map(w => outputDelta * w);
        const hiddenDeltas = hiddenOutputs.map((h, j) => hiddenErrors[j] * sigmoidDerivative(h));
        
        // Update weights
        weightsHO = weightsHO.map((w, j) => w + learningRate * outputDelta * hiddenOutputs[j]);
        biasO += learningRate * outputDelta;
        
        weightsIH = weightsIH.map((row, j) => 
          row.map((w, h) => w + learningRate * hiddenDeltas[h] * features[i][j])
        );
        biasH = biasH.map((b, h) => b + learningRate * hiddenDeltas[h]);
      }
    }
    
    const predict = (feature: number[]): number => {
      const hiddenInputs = Array.from({ length: hiddenSize }, (_, h) => 
        feature.reduce((sum, input, j) => sum + input * weightsIH[j][h], biasH[h])
      );
      const hiddenOutputs = hiddenInputs.map(sigmoid);
      const finalInput = hiddenOutputs.reduce((sum, h, j) => sum + h * weightsHO[j], biasO);
      return sigmoid(finalInput);
    };
    
    const predictions = features.map(predict);
    const mse = targets.reduce((sum, target, i) => sum + (target - predictions[i]) ** 2, 0) / targets.length;
    
    return { predict, loss: Math.sqrt(mse) };
  }

  async autoOptimize(features: number[][], targets: number[], task = 'regression'): Promise<AutoMLResult> {
    const startTime = Date.now();
    
    try {
      const algorithms = [
        { name: 'linear', fn: this.linearRegression.bind(this) },
        { name: 'tree', fn: this.decisionTree.bind(this) },
        { name: 'ensemble', fn: this.randomForest.bind(this) },
        { name: 'neural', fn: this.neuralNetwork.bind(this) }
      ];
      
      const hyperparamGrids = {
        linear: [
          { learningRate: 0.001, iterations: 500 },
          { learningRate: 0.01, iterations: 1000 },
          { learningRate: 0.1, iterations: 2000 }
        ],
        tree: [
          { maxDepth: 3, minSamplesLeaf: 5 },
          { maxDepth: 5, minSamplesLeaf: 2 },
          { maxDepth: 10, minSamplesLeaf: 1 }
        ],
        ensemble: [
          { nTrees: 5, maxDepth: 3 },
          { nTrees: 10, maxDepth: 5 },
          { nTrees: 20, maxDepth: 7 }
        ],
        neural: [
          { hiddenSize: 5, learningRate: 0.01, epochs: 300 },
          { hiddenSize: 10, learningRate: 0.05, epochs: 500 },
          { hiddenSize: 20, learningRate: 0.1, epochs: 800 }
        ]
      };
      
      const results: ModelConfig[] = [];
      
      for (const algorithm of algorithms) {
        const grid = hyperparamGrids[algorithm.name as keyof typeof hyperparamGrids];
        
        for (const params of grid) {
          const modelStart = Date.now();
          
          try {
            const model = algorithm.fn(features, targets, params);
            const performance = 1 / (1 + model.loss); // Convert loss to performance score
            const trainTime = Date.now() - modelStart;
            
            const config: ModelConfig = {
              algorithm: algorithm.name as any,
              hyperparams: params,
              performance,
              trainTime
            };
            
            results.push(config);
            
            logger.info(`AutoML model trained: ${algorithm.name}`, {
              params,
              performance,
              trainTime
            });
            
          } catch (error) {
            logger.warn(`AutoML model failed: ${algorithm.name}`, { params, error });
          }
        }
      }
      
      // Find best model
      const bestModel = results.reduce((best, current) => 
        current.performance > best.performance ? current : best
      );
      
      const improvementPercent = this.bestPerformance > 0 
        ? ((bestModel.performance - this.bestPerformance) / this.bestPerformance) * 100 
        : 0;
      
      this.bestPerformance = Math.max(this.bestPerformance, bestModel.performance);
      this.modelHistory.push(bestModel);
      
      // Calculate confidence based on performance consistency
      const topModels = results.sort((a, b) => b.performance - a.performance).slice(0, 3);
      const avgTopPerformance = topModels.reduce((sum, m) => sum + m.performance, 0) / topModels.length;
      const confidence = (avgTopPerformance / bestModel.performance) * 100;
      
      const totalTime = Date.now() - startTime;
      
      logger.info('AutoML optimization complete', {
        bestAlgorithm: bestModel.algorithm,
        bestPerformance: bestModel.performance,
        improvementPercent,
        totalTime,
        modelsEvaluated: results.length
      });
      
      return {
        bestModel,
        allModels: results.sort((a, b) => b.performance - a.performance),
        improvementPercent,
        confidence
      };
      
    } catch (error) {
      logger.error('AutoML optimization failed', error);
      throw error;
    }
  }

  // Get model performance history
  getModelHistory(): ModelConfig[] {
    return [...this.modelHistory];
  }

  // Check if model needs retraining based on performance drift
  shouldRetrain(currentPerformance: number, threshold = 0.05): boolean {
    if (this.bestPerformance === 0) return true;
    const drift = (this.bestPerformance - currentPerformance) / this.bestPerformance;
    return drift > threshold;
  }
}

// Export singleton AutoML engine
export const supremeAutoML = new AutoMLEngine(); 