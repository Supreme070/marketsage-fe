/**
 * Model Registry
 * Handles model versioning, metadata tracking, and lifecycle management
 */

import { logger } from '@/lib/logger';
import { errorBoundary } from '../utils/error-boundary';
import { NeuralNetworkPredictor, NetworkConfig } from '../supreme-ai-engine';
import { createHash } from 'crypto';

interface ModelVersion {
  version: string;
  modelId: string;
  config: NetworkConfig;
  weights: number[][];
  metrics: {
    accuracy: number;
    loss: number;
    f1Score: number;
  };
  metadata: {
    createdAt: Date;
    trainedBy: string;
    framework: string;
    tags: string[];
    description: string;
  };
  status: 'experimental' | 'staging' | 'production' | 'archived';
}

interface VersioningConfig {
  autoIncrementPatch: boolean;
  keepVersions: number;
  promotionThresholds: {
    staging: number;
    production: number;
  };
}

export class ModelRegistry {
  private versions: Map<string, ModelVersion[]> = new Map();
  private config: VersioningConfig;

  constructor(config: VersioningConfig) {
    this.config = config;
  }

  async registerModel(
    model: NeuralNetworkPredictor,
    modelId: string,
    metadata: Partial<ModelVersion['metadata']>
  ): Promise<string> {
    try {
      const version = this.generateVersion(modelId);
      const modelVersion: ModelVersion = {
        version,
        modelId,
        config: model.getConfig(),
        weights: model.getWeights(),
        metrics: await this.evaluateModel(model),
        metadata: {
          createdAt: new Date(),
          trainedBy: 'system',
          framework: 'supreme-ai',
          tags: [],
          description: '',
          ...metadata
        },
        status: 'experimental'
      };

      // Store version
      if (!this.versions.has(modelId)) {
        this.versions.set(modelId, []);
      }
      this.versions.get(modelId)!.push(modelVersion);

      // Cleanup old versions
      this.cleanupVersions(modelId);

      logger.info('Model version registered', {
        modelId,
        version,
        status: modelVersion.status
      });

      return version;
    } catch (error) {
      throw errorBoundary.handleError(error, 'ModelRegistry.registerModel');
    }
  }

  async promoteVersion(
    modelId: string,
    version: string,
    targetStatus: ModelVersion['status']
  ): Promise<void> {
    try {
      const modelVersion = this.getVersion(modelId, version);
      if (!modelVersion) {
        throw new Error(`Version ${version} not found for model ${modelId}`);
      }

      // Verify promotion criteria
      if (targetStatus === 'staging' || targetStatus === 'production') {
        const threshold = this.config.promotionThresholds[targetStatus];
        if (modelVersion.metrics.accuracy < threshold) {
          throw new Error(
            `Model accuracy ${modelVersion.metrics.accuracy} below ${targetStatus} threshold ${threshold}`
          );
        }
      }

      // Update status
      modelVersion.status = targetStatus;

      logger.info('Model version promoted', {
        modelId,
        version,
        status: targetStatus
      });
    } catch (error) {
      throw errorBoundary.handleError(error, 'ModelRegistry.promoteVersion');
    }
  }

  getVersion(modelId: string, version: string): ModelVersion | undefined {
    return this.versions.get(modelId)?.find(v => v.version === version);
  }

  getLatestVersion(
    modelId: string,
    status?: ModelVersion['status']
  ): ModelVersion | undefined {
    const versions = this.versions.get(modelId) || [];
    return versions
      .filter(v => !status || v.status === status)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())[0];
  }

  private generateVersion(modelId: string): string {
    const versions = this.versions.get(modelId) || [];
    if (versions.length === 0) {
      return '1.0.0';
    }

    const latest = versions[versions.length - 1].version;
    const [major, minor, patch] = latest.split('.').map(Number);

    if (this.config.autoIncrementPatch) {
      return `${major}.${minor}.${patch + 1}`;
    }
    return `${major}.${minor + 1}.0`;
  }

  private async evaluateModel(model: NeuralNetworkPredictor): Promise<ModelVersion['metrics']> {
    // Placeholder for actual evaluation logic
    return {
      accuracy: 0.95,
      loss: 0.05,
      f1Score: 0.94
    };
  }

  private cleanupVersions(modelId: string): void {
    const versions = this.versions.get(modelId) || [];
    if (versions.length > this.config.keepVersions) {
      // Keep production versions and most recent ones
      const toKeep = versions
        .filter(v => v.status === 'production')
        .concat(
          versions
            .filter(v => v.status !== 'production')
            .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
            .slice(0, this.config.keepVersions)
        );

      this.versions.set(modelId, toKeep);
    }
  }
} 