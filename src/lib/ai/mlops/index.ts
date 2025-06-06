/**
 * MLOps System
 * Advanced ML model lifecycle management, monitoring, and automation
 */

import { ModelRegistry } from './model-registry';
import { AutoTrainer } from './auto-trainer';
import { PerformanceMonitor } from './performance-monitor';
import { BehavioralPredictor } from './behavioral-predictor';

export * from './model-registry';
export * from './auto-trainer';
export * from './performance-monitor';
export * from './behavioral-predictor';

// Re-export common types
export interface MLOpsConfig {
  versioning: {
    autoIncrementPatch: boolean;
    keepVersions: number;
    promotionThresholds: {
      staging: number;
      production: number;
    };
  };
  training: {
    frequency: 'hourly' | 'daily' | 'weekly';
    maxAttempts: number;
    criteria: {
      minAccuracy: number;
      maxLoss: number;
      minDataPoints: number;
      dataDriftThreshold: number;
    };
  };
  monitoring: {
    metricThresholds: {
      minAccuracy: number;
      maxLoss: number;
      maxLatency: number;
      minThroughput: number;
      maxDrift: number;
    };
    alertChannels: ('email' | 'slack' | 'webhook')[];
    cooldownPeriod: number;
  };
  behavioral: {
    featureExtraction: {
      lookbackPeriod: number; // Days of historical data to analyze
      minInteractions: number; // Minimum interactions required for prediction
    };
    prediction: {
      confidenceThreshold: number; // Minimum confidence score to return predictions
      segmentationThresholds: {
        highValue: number;
        mediumValue: number;
        highEngagement: number;
        lowEngagement: number;
        highRisk: number;
        lowRisk: number;
      };
    };
    monitoring: {
      driftThreshold: number; // Maximum allowed behavioral drift
      updateFrequency: 'hourly' | 'daily' | 'weekly';
    };
  };
}

// Factory function for creating MLOps system
export function createMLOpsSystem(config: MLOpsConfig) {
  const modelRegistry = new ModelRegistry({
    autoIncrementPatch: config.versioning.autoIncrementPatch,
    keepVersions: config.versioning.keepVersions,
    promotionThresholds: config.versioning.promotionThresholds
  });

  const performanceMonitor = new PerformanceMonitor();
  performanceMonitor.setAlertConfig('default', {
    metricThresholds: config.monitoring.metricThresholds,
    alertChannels: config.monitoring.alertChannels,
    cooldownPeriod: config.monitoring.cooldownPeriod
  });

  const autoTrainer = new AutoTrainer(modelRegistry, performanceMonitor);
  
  const behavioralPredictor = new BehavioralPredictor(modelRegistry, performanceMonitor);

  return {
    modelRegistry,
    autoTrainer,
    performanceMonitor,
    behavioralPredictor
  };
} 