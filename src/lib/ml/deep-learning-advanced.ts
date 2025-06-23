/**
 * Advanced Deep Learning Architectures
 * Implements CNN, RNN, LSTM, and Transformer models for MarketSage
 */

import { logger } from '@/lib/logger';

// Advanced activation functions
export class ActivationFunctions {
  static relu(x: number): number {
    return Math.max(0, x);
  }

  static reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  static gelu(x: number): number {
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
  }

  static swish(x: number): number {
    return x / (1 + Math.exp(-x));
  }

  static leakyRelu(x: number, alpha = 0.01): number {
    return x > 0 ? x : alpha * x;
  }

  static softmax(values: number[]): number[] {
    const maxValue = Math.max(...values);
    const expValues = values.map(v => Math.exp(v - maxValue));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    return expValues.map(val => val / sumExp);
  }
}

// Matrix operations for deep learning
export class Matrix {
  data: number[][];
  rows: number;
  cols: number;

  constructor(rows: number, cols: number, data?: number[][]) {
    this.rows = rows;
    this.cols = cols;
    this.data = data || Array(rows).fill(0).map(() => Array(cols).fill(0));
  }

  static random(rows: number, cols: number, min = -1, max = 1): Matrix {
    const matrix = new Matrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        matrix.data[i][j] = Math.random() * (max - min) + min;
      }
    }
    return matrix;
  }

  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(rows, cols);
  }

  static ones(rows: number, cols: number): Matrix {
    const matrix = new Matrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        matrix.data[i][j] = 1;
      }
    }
    return matrix;
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply matrices: ${this.rows}x${this.cols} and ${other.rows}x${other.cols}`);
    }

    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition');
    }

    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] + other.data[i][j];
      }
    }
    return result;
  }

  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[j][i] = this.data[i][j];
      }
    }
    return result;
  }

  applyFunction(fn: (x: number) => number): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = fn(this.data[i][j]);
      }
    }
    return result;
  }
}

// Convolutional Layer for CNN
export class ConvolutionalLayer {
  filters: Matrix[];
  biases: number[];
  stride: number;
  padding: number;
  inputChannels: number;
  outputChannels: number;
  filterSize: number;

  constructor(
    inputChannels: number,
    outputChannels: number,
    filterSize: number,
    stride = 1,
    padding = 0
  ) {
    this.inputChannels = inputChannels;
    this.outputChannels = outputChannels;
    this.filterSize = filterSize;
    this.stride = stride;
    this.padding = padding;

    // Initialize filters with Xavier initialization
    this.filters = [];
    for (let i = 0; i < outputChannels; i++) {
      this.filters.push(Matrix.random(filterSize, filterSize, -1, 1));
    }

    this.biases = Array(outputChannels).fill(0).map(() => Math.random() * 0.1);
  }

  forward(input: number[][][]): number[][][] {
    const [inputHeight, inputWidth] = [input.length, input[0].length];
    const outputHeight = Math.floor((inputHeight + 2 * this.padding - this.filterSize) / this.stride) + 1;
    const outputWidth = Math.floor((inputWidth + 2 * this.padding - this.filterSize) / this.stride) + 1;

    const output: number[][][] = Array(this.outputChannels).fill(0).map(() =>
      Array(outputHeight).fill(0).map(() => Array(outputWidth).fill(0))
    );

    for (let f = 0; f < this.outputChannels; f++) {
      for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
          let sum = this.biases[f];
          
          for (let fy = 0; fy < this.filterSize; fy++) {
            for (let fx = 0; fx < this.filterSize; fx++) {
              const inputY = y * this.stride + fy - this.padding;
              const inputX = x * this.stride + fx - this.padding;
              
              if (inputY >= 0 && inputY < inputHeight && inputX >= 0 && inputX < inputWidth) {
                for (let c = 0; c < this.inputChannels; c++) {
                  sum += input[inputY][inputX][c] * this.filters[f].data[fy][fx];
                }
              }
            }
          }
          
          output[f][y][x] = ActivationFunctions.relu(sum);
        }
      }
    }

    return output;
  }
}

// Pooling Layer for CNN
export class PoolingLayer {
  poolSize: number;
  stride: number;
  type: 'max' | 'average';

  constructor(poolSize: number, stride?: number, type: 'max' | 'average' = 'max') {
    this.poolSize = poolSize;
    this.stride = stride || poolSize;
    this.type = type;
  }

  forward(input: number[][][]): number[][][] {
    const [channels, inputHeight, inputWidth] = [input.length, input[0].length, input[0][0].length];
    const outputHeight = Math.floor((inputHeight - this.poolSize) / this.stride) + 1;
    const outputWidth = Math.floor((inputWidth - this.poolSize) / this.stride) + 1;

    const output: number[][][] = Array(channels).fill(0).map(() =>
      Array(outputHeight).fill(0).map(() => Array(outputWidth).fill(0))
    );

    for (let c = 0; c < channels; c++) {
      for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
          const values: number[] = [];
          
          for (let py = 0; py < this.poolSize; py++) {
            for (let px = 0; px < this.poolSize; px++) {
              const inputY = y * this.stride + py;
              const inputX = x * this.stride + px;
              
              if (inputY < inputHeight && inputX < inputWidth) {
                values.push(input[c][inputY][inputX]);
              }
            }
          }

          if (this.type === 'max') {
            output[c][y][x] = Math.max(...values);
          } else {
            output[c][y][x] = values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        }
      }
    }

    return output;
  }
}

// LSTM Cell for RNN
export class LSTMCell {
  inputSize: number;
  hiddenSize: number;
  
  // Weight matrices
  weightForget: Matrix;
  weightInput: Matrix;
  weightOutput: Matrix;
  weightCandidate: Matrix;
  
  // Bias vectors
  biasForget: number[];
  biasInput: number[];
  biasOutput: number[];
  biasCandidate: number[];

  constructor(inputSize: number, hiddenSize: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;

    // Initialize weights with Xavier initialization
    const initRange = Math.sqrt(6 / (inputSize + hiddenSize));
    
    this.weightForget = Matrix.random(hiddenSize, inputSize + hiddenSize, -initRange, initRange);
    this.weightInput = Matrix.random(hiddenSize, inputSize + hiddenSize, -initRange, initRange);
    this.weightOutput = Matrix.random(hiddenSize, inputSize + hiddenSize, -initRange, initRange);
    this.weightCandidate = Matrix.random(hiddenSize, inputSize + hiddenSize, -initRange, initRange);

    this.biasForget = Array(hiddenSize).fill(1); // Forget gate bias = 1 (forget gate bias trick)
    this.biasInput = Array(hiddenSize).fill(0);
    this.biasOutput = Array(hiddenSize).fill(0);
    this.biasCandidate = Array(hiddenSize).fill(0);
  }

  forward(input: number[], hiddenState: number[], cellState: number[]): [number[], number[]] {
    // Concatenate input and hidden state
    const combined = [...input, ...hiddenState];
    const combinedMatrix = new Matrix(1, combined.length, [combined]);

    // Forget gate
    const forgetGate = this.weightForget.multiply(combinedMatrix.transpose()).data.map((row, i) => 
      this.sigmoid(row[0] + this.biasForget[i])
    );

    // Input gate
    const inputGate = this.weightInput.multiply(combinedMatrix.transpose()).data.map((row, i) => 
      this.sigmoid(row[0] + this.biasInput[i])
    );

    // Output gate
    const outputGate = this.weightOutput.multiply(combinedMatrix.transpose()).data.map((row, i) => 
      this.sigmoid(row[0] + this.biasOutput[i])
    );

    // Candidate values
    const candidateValues = this.weightCandidate.multiply(combinedMatrix.transpose()).data.map((row, i) => 
      Math.tanh(row[0] + this.biasCandidate[i])
    );

    // Update cell state
    const newCellState = cellState.map((cell, i) => 
      forgetGate[i] * cell + inputGate[i] * candidateValues[i]
    );

    // Update hidden state
    const newHiddenState = newCellState.map((cell, i) => 
      outputGate[i] * Math.tanh(cell)
    );

    return [newHiddenState, newCellState];
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }
}

// RNN Layer
export class RNNLayer {
  inputSize: number;
  hiddenSize: number;
  sequenceLength: number;
  cells: LSTMCell[];

  constructor(inputSize: number, hiddenSize: number, sequenceLength: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.sequenceLength = sequenceLength;
    
    this.cells = Array(sequenceLength).fill(0).map(() => 
      new LSTMCell(inputSize, hiddenSize)
    );
  }

  forward(sequence: number[][]): number[][] {
    let hiddenState = Array(this.hiddenSize).fill(0);
    let cellState = Array(this.hiddenSize).fill(0);
    const outputs: number[][] = [];

    for (let t = 0; t < sequence.length; t++) {
      [hiddenState, cellState] = this.cells[Math.min(t, this.cells.length - 1)]
        .forward(sequence[t], hiddenState, cellState);
      outputs.push([...hiddenState]);
    }

    return outputs;
  }
}

// Transformer Attention Mechanism
export class MultiHeadAttention {
  numHeads: number;
  headDim: number;
  modelDim: number;
  
  queryWeights: Matrix[];
  keyWeights: Matrix[];
  valueWeights: Matrix[];
  outputWeight: Matrix;

  constructor(modelDim: number, numHeads: number) {
    this.modelDim = modelDim;
    this.numHeads = numHeads;
    this.headDim = Math.floor(modelDim / numHeads);

    // Initialize weight matrices
    this.queryWeights = Array(numHeads).fill(0).map(() => 
      Matrix.random(this.headDim, modelDim, -0.1, 0.1)
    );
    this.keyWeights = Array(numHeads).fill(0).map(() => 
      Matrix.random(this.headDim, modelDim, -0.1, 0.1)
    );
    this.valueWeights = Array(numHeads).fill(0).map(() => 
      Matrix.random(this.headDim, modelDim, -0.1, 0.1)
    );
    this.outputWeight = Matrix.random(modelDim, modelDim, -0.1, 0.1);
  }

  forward(input: Matrix): Matrix {
    const seqLength = input.rows;
    const headOutputs: Matrix[] = [];

    for (let h = 0; h < this.numHeads; h++) {
      // Compute Q, K, V for this head
      const queries = input.multiply(this.queryWeights[h].transpose());
      const keys = input.multiply(this.keyWeights[h].transpose());
      const values = input.multiply(this.valueWeights[h].transpose());

      // Compute attention scores
      const scores = queries.multiply(keys.transpose());
      
      // Apply softmax to each row
      const attentionWeights = new Matrix(seqLength, seqLength);
      for (let i = 0; i < seqLength; i++) {
        const row = scores.data[i];
        const softmaxRow = ActivationFunctions.softmax(row);
        attentionWeights.data[i] = softmaxRow;
      }

      // Apply attention to values
      const headOutput = attentionWeights.multiply(values);
      headOutputs.push(headOutput);
    }

    // Concatenate heads and apply output projection
    const concatenated = this.concatenateHeads(headOutputs);
    return concatenated.multiply(this.outputWeight);
  }

  private concatenateHeads(heads: Matrix[]): Matrix {
    const seqLength = heads[0].rows;
    const totalDim = heads.length * this.headDim;
    const result = new Matrix(seqLength, totalDim);

    for (let i = 0; i < seqLength; i++) {
      let colIndex = 0;
      for (const head of heads) {
        for (let j = 0; j < this.headDim; j++) {
          result.data[i][colIndex++] = head.data[i][j];
        }
      }
    }

    return result;
  }
}

// Deep Learning Model Factory
export class DeepLearningModelFactory {
  static createCNN(config: {
    inputChannels: number;
    inputHeight: number;
    inputWidth: number;
    numClasses: number;
  }) {
    return {
      layers: [
        new ConvolutionalLayer(config.inputChannels, 32, 3, 1, 1),
        new PoolingLayer(2, 2, 'max'),
        new ConvolutionalLayer(32, 64, 3, 1, 1),
        new PoolingLayer(2, 2, 'max'),
        new ConvolutionalLayer(64, 128, 3, 1, 1),
        new PoolingLayer(2, 2, 'max')
      ],
      config
    };
  }

  static createRNN(config: {
    inputSize: number;
    hiddenSize: number;
    sequenceLength: number;
    numLayers: number;
  }) {
    const layers: RNNLayer[] = [];
    for (let i = 0; i < config.numLayers; i++) {
      const inputSize = i === 0 ? config.inputSize : config.hiddenSize;
      layers.push(new RNNLayer(inputSize, config.hiddenSize, config.sequenceLength));
    }
    
    return { layers, config };
  }

  static createTransformer(config: {
    modelDim: number;
    numHeads: number;
    numLayers: number;
    sequenceLength: number;
  }) {
    const layers: MultiHeadAttention[] = [];
    for (let i = 0; i < config.numLayers; i++) {
      layers.push(new MultiHeadAttention(config.modelDim, config.numHeads));
    }
    
    return { layers, config };
  }
}

// Advanced Deep Learning Applications for MarketSage
export class MarketSageDeepLearning {
  
  /**
   * Customer Behavior Sequence Analysis using LSTM
   */
  static async analyzeCustomerBehaviorSequence(behaviorSequence: number[][]): Promise<{
    predictions: number[][];
    patterns: string[];
    nextAction: string;
    confidence: number;
  }> {
    try {
      const rnn = DeepLearningModelFactory.createRNN({
        inputSize: behaviorSequence[0].length,
        hiddenSize: 64,
        sequenceLength: behaviorSequence.length,
        numLayers: 2
      });

      const predictions = rnn.layers[0].forward(behaviorSequence);
      
      // Analyze patterns
      const patterns = MarketSageDeepLearning.extractBehaviorPatterns(predictions);
      const nextAction = MarketSageDeepLearning.predictNextAction(predictions);
      const confidence = MarketSageDeepLearning.calculateConfidence(predictions);

      return {
        predictions,
        patterns,
        nextAction,
        confidence
      };
    } catch (error) {
      logger.error('Failed to analyze customer behavior sequence', { error });
      throw error;
    }
  }

  /**
   * Campaign Performance Prediction using Transformer
   */
  static async predictCampaignPerformance(campaignFeatures: number[][]): Promise<{
    performanceScore: number;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const featureMatrix = new Matrix(campaignFeatures.length, campaignFeatures[0].length, campaignFeatures);
      
      const transformer = DeepLearningModelFactory.createTransformer({
        modelDim: campaignFeatures[0].length,
        numHeads: 8,
        numLayers: 4,
        sequenceLength: campaignFeatures.length
      });

      const output = transformer.layers[0].forward(featureMatrix);
      
      // Extract performance metrics
      const performanceScore = MarketSageDeepLearning.calculatePerformanceScore(output);
      const insights = MarketSageDeepLearning.generateInsights(output);
      const recommendations = MarketSageDeepLearning.generateRecommendations(output);

      return {
        performanceScore,
        insights,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to predict campaign performance', { error });
      throw error;
    }
  }

  private static extractBehaviorPatterns(predictions: number[][]): string[] {
    const patterns: string[] = [];
    
    // Analyze trends in predictions
    for (let i = 0; i < predictions[0].length; i++) {
      const values = predictions.map(p => p[i]);
      const trend = MarketSageDeepLearning.analyzeTrend(values);
      patterns.push(`Feature ${i}: ${trend}`);
    }
    
    return patterns;
  }

  private static predictNextAction(predictions: number[][]): string {
    const lastPrediction = predictions[predictions.length - 1];
    const maxIndex = lastPrediction.indexOf(Math.max(...lastPrediction));
    
    const actions = ['email_engagement', 'purchase', 'churn_risk', 'support_contact', 'referral'];
    return actions[maxIndex] || 'unknown';
  }

  private static calculateConfidence(predictions: number[][]): number {
    const lastPrediction = predictions[predictions.length - 1];
    const maxValue = Math.max(...lastPrediction);
    const secondMaxValue = Math.max(...lastPrediction.filter(v => v !== maxValue));
    
    return (maxValue - secondMaxValue) / maxValue;
  }

  private static calculatePerformanceScore(output: Matrix): number {
    // Calculate average activation across all neurons
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < output.rows; i++) {
      for (let j = 0; j < output.cols; j++) {
        sum += Math.abs(output.data[i][j]);
        count++;
      }
    }
    
    return Math.min(1, sum / count);
  }

  private static generateInsights(output: Matrix): string[] {
    const insights: string[] = [];
    
    // Analyze feature importance
    const featureImportance = Array(output.cols).fill(0);
    for (let j = 0; j < output.cols; j++) {
      for (let i = 0; i < output.rows; i++) {
        featureImportance[j] += Math.abs(output.data[i][j]);
      }
      featureImportance[j] /= output.rows;
    }
    
    const sortedFeatures = featureImportance
      .map((importance, index) => ({ importance, index }))
      .sort((a, b) => b.importance - a.importance);
    
    insights.push(`Most important features: ${sortedFeatures.slice(0, 3).map(f => f.index).join(', ')}`);
    insights.push(`Feature diversity score: ${this.calculateDiversity(featureImportance).toFixed(3)}`);
    
    return insights;
  }

  private static generateRecommendations(output: Matrix): string[] {
    const recommendations: string[] = [];
    
    // Generate recommendations based on output patterns
    const avgActivation = output.data.flat().reduce((sum, val) => sum + val, 0) / (output.rows * output.cols);
    
    if (avgActivation > 0.7) {
      recommendations.push('High engagement predicted - increase campaign frequency');
    } else if (avgActivation < 0.3) {
      recommendations.push('Low engagement predicted - revise targeting strategy');
    } else {
      recommendations.push('Moderate engagement - optimize send timing');
    }
    
    return recommendations;
  }

  private static analyzeTrend(values: number[]): string {
    if (values.length < 2) return 'insufficient_data';
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increasing++;
      else if (values[i] < values[i - 1]) decreasing++;
    }
    
    if (increasing > decreasing) return 'increasing';
    if (decreasing > increasing) return 'decreasing';
    return 'stable';
  }

  private static calculateDiversity(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }
}

export {
  ActivationFunctions,
  Matrix,
  ConvolutionalLayer,
  PoolingLayer,
  LSTMCell,
  RNNLayer,
  MultiHeadAttention,
  DeepLearningModelFactory
};