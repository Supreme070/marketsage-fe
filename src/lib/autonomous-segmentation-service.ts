/**
 * Autonomous Segmentation Service
 * ==============================
 * 
 * Service layer for autonomous customer segmentation operations
 */

import { AutonomousCustomerSegmentationEngine } from '@/lib/ml/customer-segmentation-engine';
import { logger } from '@/lib/logger';

/**
 * Singleton instance of the autonomous segmentation engine
 */
let autonomousSegmentationEngine: AutonomousCustomerSegmentationEngine | null = null;

/**
 * Get or create the autonomous segmentation engine instance
 */
export function getAutonomousSegmentationEngine(): AutonomousCustomerSegmentationEngine {
  if (!autonomousSegmentationEngine) {
    autonomousSegmentationEngine = new AutonomousCustomerSegmentationEngine({
      enableRealTimeUpdates: true,
      enableSelfOptimization: true,
      enablePatternDiscovery: true,
      enableMicroSegmentation: true,
      minSegmentSize: 10,
      maxSegmentCount: 50,
      optimizationGoals: ['engagement', 'conversion', 'retention', 'revenue'],
      performanceThresholds: {
        minEngagementRate: 0.15,
        minConversionRate: 0.02,
        maxChurnRate: 0.05,
        minROI: 1.2
      },
      africanMarketOptimization: true,
      culturalAdaptation: true
    });

    logger.info('Autonomous segmentation engine initialized', {
      modelVersion: 'autonomous-segmentation-v3.0',
      features: [
        'real-time-updates',
        'self-optimization',
        'pattern-discovery',
        'micro-segmentation',
        'african-market-optimization'
      ]
    });
  }

  return autonomousSegmentationEngine;
}

/**
 * Autonomous segment discovery
 */
export async function discoverAutonomousSegments(
  organizationId: string,
  algorithm: 'kmeans' | 'hierarchical' | 'dbscan' | 'gaussian_mixture' | 'neural_clustering' = 'kmeans',
  minCustomers: number = 50
) {
  const engine = getAutonomousSegmentationEngine();
  return engine.discoverAutonomousSegments(organizationId, algorithm, minCustomers);
}

/**
 * Autonomous segment optimization
 */
export async function optimizeSegmentAutonomously(
  segmentId: string,
  organizationId: string,
  optimizationGoals: string[] = ['engagement', 'conversion', 'retention']
) {
  const engine = getAutonomousSegmentationEngine();
  return engine.optimizeSegmentAutonomously(segmentId, organizationId, optimizationGoals);
}

/**
 * Create micro-segments
 */
export async function createMicroSegments(
  parentSegmentId: string,
  organizationId: string,
  personalizationLevel: 'individual' | 'micro_group' | 'behavioral_twin' = 'micro_group'
) {
  const engine = getAutonomousSegmentationEngine();
  return engine.createMicroSegments(parentSegmentId, organizationId, personalizationLevel);
}

/**
 * Predict segment transitions
 */
export async function predictSegmentTransitions(
  customerId: string,
  organizationId: string,
  timeHorizon: number = 30
) {
  const engine = getAutonomousSegmentationEngine();
  return engine.predictSegmentTransitions(customerId, organizationId, timeHorizon);
}

/**
 * Export the engine for direct access when needed
 */
export { AutonomousCustomerSegmentationEngine } from '@/lib/ml/customer-segmentation-engine';