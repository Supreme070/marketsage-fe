/**
 * Advanced Ensemble Learning
 * Combines multiple models for improved predictions
 */

import { logger } from '@/lib/logger';
import { errorBoundary } from '../utils/error-boundary';

export class AdvancedEnsemble {
  private models: any[];
  private weights: number[];
  private diversity: number = 0;

  constructor(models: any[], weights?: number[]) {
    this.models = models;
    this.weights = weights || Array(models.length).fill(1 / models.length);
    this.validateWeights();
  }

  private validateWeights(): void {
    if (this.weights.length !== this.models.length) {
      throw new Error('Number of weights must match number of models');
    }

    const sum = this.weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 1e-6) {
      throw new Error('Weights must sum to 1');
    }
  }

  async predict(input: any): Promise<any> {
    try {
      // Get predictions from all models
      const predictions = await Promise.all(
        this.models.map(model => model.predict(input))
      );

      // Calculate weighted average
      if (Array.isArray(predictions[0])) {
        // Handle array outputs (e.g., multi-class)
        const outputLength = predictions[0].length;
        const result = new Array(outputLength).fill(0);

        for (let i = 0; i < this.models.length; i++) {
          for (let j = 0; j < outputLength; j++) {
            result[j] += predictions[i][j] * this.weights[i];
          }
        }

        return result;
      } else {
        // Handle scalar outputs
        return predictions.reduce(
          (sum, pred, i) => sum + pred * this.weights[i],
          0
        );
      }
    } catch (error) {
      throw errorBoundary.handleError(error, 'AdvancedEnsemble.predict');
    }
  }

  async train(inputs: any[], targets: any[]): Promise<void> {
    try {
      // Train each model independently
      await Promise.all(
        this.models.map(model => model.train(inputs, targets))
      );

      // Update ensemble weights based on validation performance
      await this.optimizeWeights(inputs, targets);

      // Calculate diversity metric
      this.diversity = await this.calculateDiversity(inputs);

      logger.info('Ensemble training completed', {
        numModels: this.models.length,
        diversity: this.diversity
      });
    } catch (error) {
      throw errorBoundary.handleError(error, 'AdvancedEnsemble.train');
    }
  }

  private async optimizeWeights(inputs: any[], targets: any[]): Promise<void> {
    // Get validation predictions from each model
    const modelPredictions = await Promise.all(
      this.models.map(model => 
        Promise.all(inputs.map(input => model.predict(input)))
      )
    );

    // Calculate error for each model
    const errors = modelPredictions.map(predictions =>
      predictions.reduce((sum, pred, i) => {
        const error = Array.isArray(pred) 
          ? pred.reduce((e, p, j) => e + Math.pow(p - targets[i][j], 2), 0)
          : Math.pow(pred - targets[i], 2);
        return sum + error;
      }, 0) / predictions.length
    );

    // Update weights inversely proportional to errors
    const inverseErrors = errors.map(e => 1 / (e + 1e-6));
    const totalInverseError = inverseErrors.reduce((a, b) => a + b, 0);
    this.weights = inverseErrors.map(e => e / totalInverseError);
  }

  private async calculateDiversity(inputs: any[]): Promise<number> {
    // Get predictions from all models
    const predictions = await Promise.all(
      this.models.map(model => 
        Promise.all(inputs.map(input => model.predict(input)))
      )
    );

    // Calculate average disagreement between models
    let totalDisagreement = 0;
    let pairs = 0;

    for (let i = 0; i < this.models.length; i++) {
      for (let j = i + 1; j < this.models.length; j++) {
        let disagreement = 0;
        for (let k = 0; k < inputs.length; k++) {
          if (Array.isArray(predictions[i][k])) {
            // Handle array outputs
            disagreement += predictions[i][k].reduce(
              (sum: number, val: number, idx: number) =>
                sum + Math.pow(val - predictions[j][k][idx], 2),
              0
            );
          } else {
            // Handle scalar outputs
            disagreement += Math.pow(
              predictions[i][k] - predictions[j][k],
              2
            );
          }
        }
        totalDisagreement += disagreement / inputs.length;
        pairs++;
      }
    }

    return totalDisagreement / pairs;
  }

  getWeights(): number[] {
    return this.weights;
  }

  getDiversity(): number {
    return this.diversity;
  }

  getConfig(): any {
    return {
      type: 'ensemble',
      numModels: this.models.length,
      weights: this.weights,
      modelConfigs: this.models.map(model => model.getConfig())
    };
  }
} 