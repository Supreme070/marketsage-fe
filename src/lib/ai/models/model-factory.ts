/**
 * Model Factory
 * Centralized model creation and management
 */

import { NeuralNetworkPredictor } from '../supreme-ai-engine';
import { TransformerModel } from './transformer';
import { AdvancedEnsemble } from './advanced-ensemble';
import { logger } from '@/lib/logger';
import { errorBoundary } from '../utils/error-boundary';

export type ModelType = 'neural_network' | 'transformer' | 'ensemble';

export interface ModelConfig {
  type: ModelType;
  params: any;
}

export class ModelFactory {
  static async createModel(config: ModelConfig): Promise<any> {
    try {
      switch (config.type) {
        case 'neural_network':
          return new NeuralNetworkPredictor(config.params);

        case 'transformer':
          return new TransformerModel(config.params);

        case 'ensemble':
          // Create an ensemble of models
          const models = await Promise.all(
            config.params.models.map((modelConfig: ModelConfig) =>
              this.createModel(modelConfig)
            )
          );
          return new AdvancedEnsemble(models, config.params.weights);

        default:
          throw new Error(`Unknown model type: ${config.type}`);
      }
    } catch (error) {
      throw errorBoundary.handleError(error, 'ModelFactory.createModel');
    }
  }

  static getDefaultConfig(type: ModelType): ModelConfig {
    switch (type) {
      case 'neural_network':
        return {
          type,
          params: {
            layers: [
              { size: 64, activation: 'relu' },
              { size: 32, activation: 'relu' },
              { size: 16, activation: 'relu' }
            ],
            learningRate: 0.001,
            batchSize: 32,
            l2Regularization: 0.01
          }
        };

      case 'transformer':
        return {
          type,
          params: {
            inputDim: 512,
            outputDim: 256,
            numHeads: 8,
            numLayers: 6,
            hiddenDim: 512,
            dropoutRate: 0.1,
            maxSeqLength: 1024
          }
        };

      case 'ensemble':
        return {
          type,
          params: {
            models: [
              this.getDefaultConfig('neural_network'),
              this.getDefaultConfig('transformer')
            ],
            weights: [0.5, 0.5]
          }
        };

      default:
        throw new Error(`Unknown model type: ${type}`);
    }
  }

  static async loadModel(path: string): Promise<any> {
    try {
      const modelData = await import(path);
      return this.createModel(modelData.config);
    } catch (error) {
      throw errorBoundary.handleError(error, 'ModelFactory.loadModel');
    }
  }

  static async saveModel(model: any, path: string): Promise<void> {
    try {
      const modelState = {
        config: model.getConfig(),
        weights: model.getWeights(),
        metadata: {
          version: '2.0.0',
          timestamp: new Date(),
          type: model.constructor.name
        }
      };

      await import('fs').then(fs => 
        fs.promises.writeFile(path, JSON.stringify(modelState, null, 2))
      );

      logger.info('Model saved successfully', { path });
    } catch (error) {
      throw errorBoundary.handleError(error, 'ModelFactory.saveModel');
    }
  }
} 