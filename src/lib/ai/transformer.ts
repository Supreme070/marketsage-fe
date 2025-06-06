/**
 * Transformer Architecture
 * ======================
 * Modern attention mechanisms and transformer-based model architecture
 * for advanced sequence processing and feature interactions.
 */

import { logger } from '@/lib/logger';

export interface TransformerConfig {
  inputDim: number;
  hiddenDim: number;
  numHeads: number;
  numLayers: number;
  dropoutRate: number;
  maxSeqLength: number;
  vocabSize?: number; // For text inputs
}

export interface AttentionOutput {
  output: number[][];
  weights: number[][];
  coverage?: number[];
}

export class TransformerModel {
  private config: TransformerConfig;
  private weights: {
    queryWeight: number[][];
    keyWeight: number[][];
    valueWeight: number[][];
    outputWeight: number[][];
    layerNormParams: { gamma: number[]; beta: number[]; }[];
    ffnWeights: { w1: number[][]; w2: number[][]; }[];
  };
  
  constructor(config: TransformerConfig) {
    this.config = config;
    this.weights = this.initializeWeights();
    
    logger.info('Initialized transformer model', {
      config: {
        inputDim: config.inputDim,
        hiddenDim: config.hiddenDim,
        numHeads: config.numHeads,
        numLayers: config.numLayers
      }
    });
  }
  
  /**
   * Forward pass through transformer
   */
  async forward(
    input: number[][],
    mask?: boolean[][],
    cache?: Map<string, number[][]>
  ): Promise<{
    output: number[][];
    attentionMaps: AttentionOutput[];
  }> {
    try {
      let x = input;
      const attentionMaps: AttentionOutput[] = [];
      
      // Positional encoding
      x = this.addPositionalEncoding(x);
      
      // Process each transformer layer
      for (let layer = 0; layer < this.config.numLayers; layer++) {
        // Multi-head attention
        const attention = await this.multiHeadAttention(
          x,
          x,
          x,
          mask,
          cache ? `layer_${layer}` : undefined,
          cache
        );
        attentionMaps.push(attention);
        
        // Add & Norm
        x = this.layerNorm(
          this.residualAdd(x, attention.output),
          layer
        );
        
        // Feed-forward network
        const ffn = this.feedForward(x, layer);
        x = this.layerNorm(
          this.residualAdd(x, ffn),
          layer
        );
      }
      
      return {
        output: x,
        attentionMaps
      };
      
    } catch (error) {
      logger.error('Transformer forward pass failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Multi-head attention mechanism
   */
  private async multiHeadAttention(
    queries: number[][],
    keys: number[][],
    values: number[][],
    mask?: boolean[][],
    cacheKey?: string,
    cache?: Map<string, number[][]>
  ): Promise<AttentionOutput> {
    const headDim = Math.floor(this.config.hiddenDim / this.config.numHeads);
    const heads: AttentionOutput[] = [];
    
    // Process each attention head
    for (let h = 0; h < this.config.numHeads; h++) {
      // Linear projections
      const q = this.linearProject(queries, this.weights.queryWeight);
      const k = this.linearProject(keys, this.weights.keyWeight);
      const v = this.linearProject(values, this.weights.valueWeight);
      
      // Split into heads
      const qh = this.splitHead(q, h, headDim);
      const kh = this.splitHead(k, h, headDim);
      const vh = this.splitHead(v, h, headDim);
      
      // Scaled dot-product attention
      const head = await this.scaledDotProductAttention(
        qh,
        kh,
        vh,
        mask,
        Math.sqrt(headDim)
      );
      
      // Cache key/value projections if needed
      if (cache && cacheKey) {
        cache.set(`${cacheKey}_k_${h}`, kh);
        cache.set(`${cacheKey}_v_${h}`, vh);
      }
      
      heads.push(head);
    }
    
    // Concatenate and project heads
    const multiHead = this.concatenateHeads(heads);
    const output = this.linearProject(
      multiHead.output,
      this.weights.outputWeight
    );
    
    // Combine attention weights
    const weights = this.combineAttentionWeights(
      heads.map(h => h.weights)
    );
    
    return {
      output,
      weights,
      coverage: this.calculateAttentionCoverage(weights)
    };
  }
  
  /**
   * Scaled dot-product attention
   */
  private async scaledDotProductAttention(
    q: number[][],
    k: number[][],
    v: number[][],
    mask?: boolean[][],
    scale: number = 1.0
  ): Promise<AttentionOutput> {
    // Calculate attention scores
    const scores = this.matmul(q, this.transpose(k));
    
    // Scale scores
    const scaledScores = scores.map(row =>
      row.map(x => x / scale)
    );
    
    // Apply mask if provided
    if (mask) {
      for (let i = 0; i < scaledScores.length; i++) {
        for (let j = 0; j < scaledScores[i].length; j++) {
          if (!mask[i][j]) {
            scaledScores[i][j] = -Infinity;
          }
        }
      }
    }
    
    // Softmax
    const weights = this.softmax(scaledScores);
    
    // Apply attention weights
    const output = this.matmul(weights, v);
    
    return { output, weights };
  }
  
  /**
   * Feed-forward network
   */
  private feedForward(
    x: number[][],
    layer: number
  ): number[][] {
    const { w1, w2 } = this.weights.ffnWeights[layer];
    
    // First linear transformation
    const h1 = this.matmul(x, w1);
    
    // ReLU activation
    const h2 = h1.map(row =>
      row.map(x => Math.max(0, x))
    );
    
    // Second linear transformation
    return this.matmul(h2, w2);
  }
  
  /**
   * Layer normalization
   */
  private layerNorm(
    x: number[][],
    layer: number,
    epsilon: number = 1e-6
  ): number[][] {
    const { gamma, beta } = this.weights.layerNormParams[layer];
    
    return x.map(row => {
      // Calculate mean and variance
      const mean = row.reduce((a, b) => a + b, 0) / row.length;
      const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
      
      // Normalize and scale
      return row.map((value, i) => {
        const normalized = (value - mean) / Math.sqrt(variance + epsilon);
        return gamma[i] * normalized + beta[i];
      });
    });
  }
  
  /**
   * Add positional encoding
   */
  private addPositionalEncoding(x: number[][]): number[][] {
    const maxLen = x.length;
    const dim = x[0].length;
    
    return x.map((row, pos) =>
      row.map((value, i) => {
        if (i % 2 === 0) {
          return value + Math.sin(pos / (10000 ** (2 * i / dim)));
        } else {
          return value + Math.cos(pos / (10000 ** (2 * (i - 1) / dim)));
        }
      })
    );
  }
  
  /**
   * Initialize model weights
   */
  private initializeWeights(): TransformerModel['weights'] {
    const dim = this.config.hiddenDim;
    
    return {
      queryWeight: this.randomMatrix(dim, dim),
      keyWeight: this.randomMatrix(dim, dim),
      valueWeight: this.randomMatrix(dim, dim),
      outputWeight: this.randomMatrix(dim, dim),
      layerNormParams: Array(this.config.numLayers).fill(null).map(() => ({
        gamma: Array(dim).fill(1),
        beta: Array(dim).fill(0)
      })),
      ffnWeights: Array(this.config.numLayers).fill(null).map(() => ({
        w1: this.randomMatrix(dim, dim * 4),
        w2: this.randomMatrix(dim * 4, dim)
      }))
    };
  }
  
  /**
   * Matrix multiplication helper
   */
  private matmul(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }
  
  /**
   * Matrix transpose helper
   */
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, i) =>
      matrix.map(row => row[i])
    );
  }
  
  /**
   * Softmax helper
   */
  private softmax(matrix: number[][]): number[][] {
    return matrix.map(row => {
      const maxVal = Math.max(...row);
      const expSum = row
        .map(x => Math.exp(x - maxVal))
        .reduce((a, b) => a + b, 0);
      return row.map(x =>
        Math.exp(x - maxVal) / expSum
      );
    });
  }
  
  /**
   * Generate random matrix
   */
  private randomMatrix(rows: number, cols: number): number[][] {
    return Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() =>
        (Math.random() - 0.5) * 2 * Math.sqrt(6 / (rows + cols))
      )
    );
  }
  
  /**
   * Split tensor for multi-head attention
   */
  private splitHead(
    x: number[][],
    head: number,
    headDim: number
  ): number[][] {
    const start = head * headDim;
    const end = start + headDim;
    return x.map(row => row.slice(start, end));
  }
  
  /**
   * Concatenate attention heads
   */
  private concatenateHeads(heads: AttentionOutput[]): AttentionOutput {
    const output = heads[0].output.map(row =>
      heads.flatMap(h => h.output[heads.indexOf(h)])
    );
    
    const weights = this.combineAttentionWeights(
      heads.map(h => h.weights)
    );
    
    return { output, weights };
  }
  
  /**
   * Combine attention weights from multiple heads
   */
  private combineAttentionWeights(weights: number[][][]): number[][] {
    const numHeads = weights.length;
    const seqLen = weights[0].length;
    
    const combined: number[][] = Array(seqLen).fill(null)
      .map(() => Array(seqLen).fill(0));
    
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < seqLen; j++) {
        for (let h = 0; h < numHeads; h++) {
          combined[i][j] += weights[h][i][j] / numHeads;
        }
      }
    }
    
    return combined;
  }
  
  /**
   * Calculate attention coverage
   */
  private calculateAttentionCoverage(weights: number[][]): number[] {
    return weights.map(row =>
      1 - row.reduce((entropy, p) => {
        if (p > 0) {
          return entropy - p * Math.log2(p);
        }
        return entropy;
      }, 0) / Math.log2(row.length)
    );
  }
  
  /**
   * Residual connection
   */
  private residualAdd(x: number[][], residual: number[][]): number[][] {
    return x.map((row, i) =>
      row.map((value, j) => value + residual[i][j])
    );
  }
  
  /**
   * Get model configuration
   */
  getConfig(): TransformerConfig {
    return { ...this.config };
  }
  
  /**
   * Get attention weights for visualization
   */
  getAttentionWeights(): number[][] {
    return this.weights.queryWeight;
  }
  
  /**
   * Linear projection helper
   */
  private linearProject(x: number[][], weight: number[][]): number[][] {
    return this.matmul(x, weight);
  }
}

// Export factory function
export function createTransformer(config: TransformerConfig): TransformerModel {
  return new TransformerModel(config);
} 