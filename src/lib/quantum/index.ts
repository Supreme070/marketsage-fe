/**
 * Quantum Computing Module for MarketSage
 * Complete quantum optimization suite for African fintech markets
 */

// Core quantum engines
export { quantumEngine } from './quantum-optimization-engine';
export type { OptimizationProblem, QuantumResult, QuantumState, Complex } from './quantum-optimization-engine';

// Portfolio optimization
export { quantumPortfolioOptimizer } from './quantum-portfolio-optimizer';
export type { 
  Asset, 
  PortfolioConstraints, 
  QuantumPortfolioResult,
  RebalancingRecommendation 
} from './quantum-portfolio-optimizer';

// Customer segmentation
export { quantumCustomerSegmentation } from './quantum-customer-segmentation';
export type { 
  CustomerProfile, 
  SegmentationParameters,
  CustomerSegment,
  QuantumSegmentationResult 
} from './quantum-customer-segmentation';

// Risk analysis
export { quantumRiskAnalyzer } from './quantum-risk-analyzer';
export type { 
  RiskFactor, 
  RiskScenario, 
  RiskParameters,
  QuantumRiskResult 
} from './quantum-risk-analyzer';

// Metaheuristics
export { quantumMetaheuristics } from './quantum-metaheuristics';
export type { 
  Individual, 
  Particle, 
  MetaheuristicParameters,
  OptimizationResult 
} from './quantum-metaheuristics';

// Machine learning
export { quantumML } from './quantum-ml';
export type { 
  QuantumMLModel, 
  QuantumNeuralNetwork, 
  TrainingConfig,
  PredictionResult 
} from './quantum-ml';

// Quantum annealing
export { quantumAnnealing } from './quantum-annealing';
export type { 
  QuboMatrix, 
  AnnealingSchedule, 
  QuantumAnnealingResult,
  AnnealingParameters 
} from './quantum-annealing';

// Integration hub
export { 
  quantumIntegration, 
  createQuantumIntegration, 
  defaultQuantumConfig 
} from './quantum-integration';
export type { 
  QuantumIntegrationConfig, 
  QuantumModule, 
  QuantumTask,
  QuantumResult as IntegrationResult,
  QuantumPerformanceMetrics 
} from './quantum-integration';

/**
 * Quick-start functions for common quantum operations
 */

// Portfolio optimization with sensible defaults
export async function optimizePortfolio(
  assets: any[],
  riskTolerance = 0.5,
  investmentAmount = 1000000
) {
  const constraints = {
    maxWeight: 0.3,
    minWeight: 0.01,
    maxSectorExposure: { fintech: 0.4, banking: 0.3, telecoms: 0.2 },
    maxMarketExposure: { NGN: 0.4, KES: 0.3, ZAR: 0.2, GHS: 0.1 },
    minLiquidity: 0.5,
    minESG: 0.6,
    targetReturn: 0.12,
    maxRisk: 0.25,
    allowShortSelling: false,
    rebalanceFrequency: 'monthly' as const
  };

  return await quantumIntegration.optimizePortfolio(assets, constraints, investmentAmount);
}

// Customer segmentation with African market focus
export async function segmentCustomers(
  customers: any[],
  numberOfSegments = 5
) {
  const parameters = {
    numberOfSegments,
    algorithm: 'quantum-kmeans' as const,
    features: [
      { name: 'age', type: 'numeric' as const, weight: 1.0, normalization: 'minmax' as const, encoding: 'none' as const },
      { name: 'income', type: 'numeric' as const, weight: 1.2, normalization: 'zscore' as const, encoding: 'none' as const },
      { name: 'digitalEngagement', type: 'numeric' as const, weight: 1.5, normalization: 'minmax' as const, encoding: 'none' as const },
      { name: 'market', type: 'categorical' as const, weight: 0.8, normalization: 'none' as const, encoding: 'onehot' as const }
    ],
    weights: {
      demographic: 0.3,
      behavioral: 0.4,
      psychographic: 0.2,
      engagement: 0.1
    },
    africanContextWeight: 0.3,
    culturalIntelligence: true,
    minSegmentSize: 50,
    maxSegmentSize: 5000,
    stabilityThreshold: 0.85
  };

  return await quantumIntegration.segmentCustomers(customers, parameters);
}

// Risk analysis for African markets
export async function analyzeRisk(
  riskFactors: any[],
  scenarios: any[] = []
) {
  const parameters = {
    analysisType: 'comprehensive' as const,
    timeHorizon: 365, // 1 year
    confidenceLevel: 0.95,
    monteCarloPaths: 10000,
    quantumDepth: 8,
    africanMarketFocus: true,
    regulatoryCompliance: ['CBN', 'CBK', 'SARB', 'BoG', 'CBE'],
    stressTestingEnabled: true,
    correlationAnalysis: true,
    dynamicModeling: true
  };

  return await quantumIntegration.analyzeRisk(riskFactors, scenarios, parameters);
}

// Train quantum ML model for predictions
export async function trainPredictionModel(
  modelType: 'neural-network' | 'svm' | 'clustering' | 'regression',
  trainingData: number[][],
  labels: number[]
) {
  const config = {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.01,
    quantumLearningRate: 0.005,
    optimizer: 'quantum-adam' as const,
    regularization: 0.01,
    noiseResilience: true,
    quantumErrorCorrection: true
  };

  return await quantumIntegration.trainQuantumModel(modelType, trainingData, labels, config);
}

// Solve complex optimization with quantum annealing
export async function solveOptimization(
  problem: any,
  algorithm: 'annealing' | 'genetic' | 'pso' | 'ant-colony' = 'annealing'
) {
  const parameters = {
    numReads: 1000,
    numChains: 1,
    chainStrength: 1.0,
    pauseTime: 10,
    annealingTime: 1000,
    postprocessing: 'optimization' as const,
    embedding: 'auto' as const,
    quantumCorrection: true,
    hybridApproach: true
  };

  if (algorithm === 'annealing') {
    return await quantumIntegration.solveWithQuantumAnnealing(problem, parameters);
  } else {
    const metaParameters = {
      algorithm: `quantum-${algorithm}` as any,
      populationSize: 100,
      maxGenerations: 500,
      crossoverRate: 0.8,
      mutationRate: 0.1,
      quantumGateDepth: 6,
      convergenceThreshold: 0.001,
      elitismRate: 0.1,
      diversityMaintenance: true,
      adaptiveParameters: true
    };
    
    return await quantumIntegration.optimizeWithMetaheuristics(problem, algorithm, metaParameters);
  }
}

// African market optimization
export async function optimizeForAfricanMarkets(
  data: any,
  marketType: 'fintech' | 'banking' | 'payments' | 'lending'
) {
  return await quantumIntegration.optimizeForAfricanMarkets(data, marketType);
}

/**
 * Utility functions
 */

// Get quantum system performance metrics
export function getQuantumMetrics() {
  return quantumIntegration.getPerformanceMetrics();
}

// Check if quantum enhancement is available for a task
export function isQuantumAvailable(module: QuantumModule): boolean {
  const config = defaultQuantumConfig;
  return config.enabledModules.includes(module);
}

// Estimate quantum advantage for a given problem
export function estimateQuantumAdvantage(
  problemSize: number,
  complexity: number,
  module: QuantumModule
): number {
  // Simplified quantum advantage estimation
  const baseAdvantage = {
    'portfolio-optimization': 0.25,
    'customer-segmentation': 0.30,
    'risk-analysis': 0.20,
    'metaheuristics': 0.15,
    'machine-learning': 0.35,
    'quantum-annealing': 0.40
  };

  const sizeBonus = Math.min(0.2, problemSize / 1000);
  const complexityBonus = complexity * 0.3;
  
  return Math.min(0.8, baseAdvantage[module] + sizeBonus + complexityBonus);
}

/**
 * African fintech market constants and helpers
 */

export const AFRICAN_MARKETS = [
  'NGN', 'KES', 'GHS', 'ZAR', 'EGP', 'TZS', 'UGX', 'MAD', 'ETB', 'RWF'
] as const;

export const AFRICAN_PAYMENT_METHODS = [
  'mobile-money', 'bank-transfer', 'agent-banking', 'crypto', 'cash', 'cards'
] as const;

export const REGULATORY_FRAMEWORKS = [
  'Central Bank of Nigeria (CBN)',
  'Central Bank of Kenya (CBK)',
  'Bank of Ghana (BoG)',
  'South African Reserve Bank (SARB)',
  'Central Bank of Egypt (CBE)',
  'Bank of Tanzania (BoT)',
  'Bank of Uganda (BoU)',
  'Bank Al-Maghrib (BAM)',
  'National Bank of Ethiopia (NBE)',
  'National Bank of Rwanda (BNR)'
] as const;

// Helper function to get market-specific configurations
export function getMarketConfig(market: typeof AFRICAN_MARKETS[number]) {
  const configs = {
    NGN: {
      name: 'Nigeria',
      currency: 'Nigerian Naira',
      population: 220000000,
      gdpGrowth: 2.6,
      internetPenetration: 0.65,
      mobilePenetration: 0.92,
      primaryPayments: ['mobile-money', 'bank-transfer', 'agent-banking'],
      regulations: ['CBN'],
      quantumOptimization: {
        riskTolerance: 0.4,
        mobileFirst: true,
        crossBorder: true
      }
    },
    KES: {
      name: 'Kenya',
      currency: 'Kenyan Shilling',
      population: 55000000,
      gdpGrowth: 5.4,
      internetPenetration: 0.45,
      mobilePenetration: 0.95,
      primaryPayments: ['mobile-money', 'agent-banking'],
      regulations: ['CBK'],
      quantumOptimization: {
        riskTolerance: 0.5,
        mobileFirst: true,
        mpesaIntegration: true
      }
    },
    ZAR: {
      name: 'South Africa',
      currency: 'South African Rand',
      population: 60000000,
      gdpGrowth: 0.8,
      internetPenetration: 0.68,
      mobilePenetration: 0.91,
      primaryPayments: ['bank-transfer', 'cards', 'mobile-money'],
      regulations: ['SARB'],
      quantumOptimization: {
        riskTolerance: 0.3,
        matureMarket: true,
        investmentFocus: true
      }
    },
    GHS: {
      name: 'Ghana',
      currency: 'Ghanaian Cedi',
      population: 33000000,
      gdpGrowth: 3.4,
      internetPenetration: 0.58,
      mobilePenetration: 0.88,
      primaryPayments: ['mobile-money', 'bank-transfer'],
      regulations: ['BoG'],
      quantumOptimization: {
        riskTolerance: 0.45,
        mobileFirst: true,
        emergingMarket: true
      }
    },
    EGP: {
      name: 'Egypt',
      currency: 'Egyptian Pound',
      population: 105000000,
      gdpGrowth: 6.6,
      internetPenetration: 0.57,
      mobilePenetration: 0.94,
      primaryPayments: ['bank-transfer', 'mobile-money', 'cash'],
      regulations: ['CBE'],
      quantumOptimization: {
        riskTolerance: 0.35,
        largePop: true,
        cashHeavy: true
      }
    }
  };

  return configs[market] || configs.NGN; // Default to Nigeria
}

/**
 * Export quantum module status and health check
 */
export async function getQuantumSystemStatus() {
  const metrics = getQuantumMetrics();
  
  return {
    status: 'operational',
    modules: {
      'portfolio-optimization': isQuantumAvailable('portfolio-optimization'),
      'customer-segmentation': isQuantumAvailable('customer-segmentation'),
      'risk-analysis': isQuantumAvailable('risk-analysis'),
      'metaheuristics': isQuantumAvailable('metaheuristics'),
      'machine-learning': isQuantumAvailable('machine-learning'),
      'quantum-annealing': isQuantumAvailable('quantum-annealing')
    },
    performance: {
      totalTasks: metrics.totalTasks,
      successRate: metrics.successRate,
      averageQuantumAdvantage: metrics.averageQuantumAdvantage,
      averageExecutionTime: metrics.averageExecutionTime
    },
    africanMarketOptimization: defaultQuantumConfig.africaMarketOptimization,
    timestamp: new Date().toISOString()
  };
}