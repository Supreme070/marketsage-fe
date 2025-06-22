/**
 * Federated Learning & Privacy-Preserving ML Module
 * Implements secure, distributed machine learning capabilities
 */

import { logger } from '@/lib/logger';
import { errorBoundary } from './utils/error-boundary';
import { NeuralNetworkPredictor, type NetworkConfig } from './supreme-ai-engine';
import { createHash } from 'crypto';

// Types for federated learning
interface FederatedModelUpdate {
  modelId: string;
  tenantId: string;
  weights: number[][];
  epoch: number;
  metrics: {
    loss: number;
    accuracy: number;
    timestamp: Date;
  };
  signature: string;
}

interface TenantConfig {
  id: string;
  publicKey: string;
  privacyLevel: 'high' | 'medium' | 'low';
  dataCategories: string[];
  contributionWeight: number;
}

interface PrivacyConfig {
  epsilon: number; // Differential privacy parameter
  clipNorm: number; // Gradient clipping threshold
  noiseSigma: number; // Noise scale for differential privacy
  secureSalt: string;
}

class DifferentialPrivacy {
  private config: PrivacyConfig;

  constructor(config: PrivacyConfig) {
    this.config = config;
  }

  addNoise(value: number): number {
    // Laplace mechanism for differential privacy
    const scale = this.config.noiseSigma;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
  }

  clipGradients(gradients: number[][]): number[][] {
    const norm = Math.sqrt(
      gradients.reduce((sum, layer) => 
        sum + layer.reduce((layerSum, grad) => 
          layerSum + grad * grad, 0), 0)
    );

    if (norm > this.config.clipNorm) {
      const scale = this.config.clipNorm / norm;
      return gradients.map(layer => 
        layer.map(grad => grad * scale)
      );
    }
    return gradients;
  }

  anonymize(data: any): any {
    // Simple anonymization using hashing
    const hash = createHash('sha256');
    hash.update(this.config.secureSalt + JSON.stringify(data));
    return hash.digest('hex');
  }
}

class SecureAggregation {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  // Secure aggregation of model updates
  aggregateUpdates(updates: FederatedModelUpdate[]): number[][] {
    try {
      if (updates.length === 0) return [];

      // Verify signatures
      updates = updates.filter(update => this.verifySignature(update));

      // Weight the contributions
      const weightedUpdates = updates.map(update => ({
        weights: update.weights,
        weight: this.calculateContributionWeight(update)
      }));

      // Aggregate weights
      const totalWeight = weightedUpdates.reduce((sum, u) => sum + u.weight, 0);
      const aggregatedWeights = weightedUpdates[0].weights.map((layer, i) => 
        layer.map((_, j) => 
          weightedUpdates.reduce((sum, u) => 
            sum + (u.weights[i][j] * u.weight), 0) / totalWeight
        )
      );

      return aggregatedWeights;
    } catch (error) {
      throw errorBoundary.handleError(error, 'SecureAggregation.aggregateUpdates');
    }
  }

  private verifySignature(update: FederatedModelUpdate): boolean {
    // Implement signature verification
    const hash = createHash('sha256');
    hash.update(JSON.stringify({
      modelId: update.modelId,
      tenantId: update.tenantId,
      epoch: update.epoch,
      metrics: update.metrics
    }) + this.secretKey);
    return hash.digest('hex') === update.signature;
  }

  private calculateContributionWeight(update: FederatedModelUpdate): number {
    // Weight based on metrics and contribution history
    const accuracyWeight = update.metrics.accuracy;
    const timeWeight = Math.exp(-((Date.now() - update.metrics.timestamp.getTime()) / (24 * 60 * 60 * 1000)));
    return accuracyWeight * timeWeight;
  }
}

export class FederatedLearningManager {
  private model: NeuralNetworkPredictor;
  private tenants: Map<string, TenantConfig>;
  private privacyEngine: DifferentialPrivacy;
  private aggregator: SecureAggregation;
  private roundInProgress = false;
  private currentRound = 0;
  private updateBuffer: FederatedModelUpdate[] = [];

  constructor(
    baseModel: NetworkConfig,
    privacyConfig: PrivacyConfig,
    secretKey: string
  ) {
    this.model = new NeuralNetworkPredictor(baseModel);
    this.tenants = new Map();
    this.privacyEngine = new DifferentialPrivacy(privacyConfig);
    this.aggregator = new SecureAggregation(secretKey);
  }

  registerTenant(config: TenantConfig): void {
    try {
      this.tenants.set(config.id, config);
      logger.info('Tenant registered for federated learning', {
        tenantId: config.id,
        privacyLevel: config.privacyLevel
      });
    } catch (error) {
      throw errorBoundary.handleError(error, 'FederatedLearningManager.registerTenant');
    }
  }

  async submitUpdate(update: FederatedModelUpdate): Promise<void> {
    try {
      const tenant = this.tenants.get(update.tenantId);
      if (!tenant) {
        throw new Error(`Unauthorized tenant: ${update.tenantId}`);
      }

      // Apply privacy-preserving techniques
      const privacyEnhancedUpdate = this.applyPrivacyMeasures(update, tenant);
      
      this.updateBuffer.push(privacyEnhancedUpdate);
      
      logger.info('Received federated update', {
        tenantId: update.tenantId,
        epoch: update.epoch,
        accuracy: update.metrics.accuracy
      });

      // Trigger aggregation if enough updates
      if (this.updateBuffer.length >= this.tenants.size * 0.75) {
        await this.performAggregation();
      }
    } catch (error) {
      throw errorBoundary.handleError(error, 'FederatedLearningManager.submitUpdate');
    }
  }

  private applyPrivacyMeasures(
    update: FederatedModelUpdate,
    tenant: TenantConfig
  ): FederatedModelUpdate {
    // Apply privacy measures based on tenant's privacy level
    const privacyMultiplier = 
      tenant.privacyLevel === 'high' ? 2.0 :
      tenant.privacyLevel === 'medium' ? 1.5 : 1.0;

    // Clip gradients
    const clippedWeights = this.privacyEngine.clipGradients(update.weights);

    // Add noise based on privacy level
    const noisyWeights = clippedWeights.map(layer =>
      layer.map(weight => 
        this.privacyEngine.addNoise(weight * privacyMultiplier)
      )
    );

    // Anonymize metadata
    const anonymizedMetrics = {
      ...update.metrics,
      timestamp: new Date(
        Math.floor(update.metrics.timestamp.getTime() / (60 * 1000)) * 60 * 1000
      )
    };

    return {
      ...update,
      weights: noisyWeights,
      metrics: anonymizedMetrics
    };
  }

  private async performAggregation(): Promise<void> {
    if (this.roundInProgress) return;

    try {
      this.roundInProgress = true;
      this.currentRound++;

      // Aggregate updates securely
      const aggregatedWeights = this.aggregator.aggregateUpdates(this.updateBuffer);

      // Update global model
      this.model.setWeights(aggregatedWeights);

      // Clear buffer
      this.updateBuffer = [];

      logger.info('Federated learning round completed', {
        round: this.currentRound,
        participatingTenants: this.updateBuffer.length,
        timestamp: new Date()
      });

      this.roundInProgress = false;
    } catch (error) {
      this.roundInProgress = false;
      throw errorBoundary.handleError(error, 'FederatedLearningManager.performAggregation');
    }
  }

  getGlobalModel(): NeuralNetworkPredictor {
    return this.model;
  }

  getModelUpdateForTenant(tenantId: string): Partial<NetworkConfig> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Unauthorized tenant: ${tenantId}`);
    }

    // Return only allowed model components based on tenant's configuration
    return {
      layers: this.model.getConfig().layers.filter(layer =>
        tenant.dataCategories.some(cat => layer.activation.includes(cat))
      )
    };
  }
}

// Export privacy-preserving ML types and classes
export {
  type FederatedModelUpdate,
  type TenantConfig,
  type PrivacyConfig,
  DifferentialPrivacy,
  SecureAggregation
}; 