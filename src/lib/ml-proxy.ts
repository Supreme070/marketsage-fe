/**
 * ML & Predictive Analytics Proxy
 * ================================
 *
 * Thin API wrapper for ML/Predictive Analytics backend services.
 * All business logic now secured in backend.
 *
 * Phase 2 Migration Complete:
 * - 7 ML services migrated (6,035 lines)
 * - 16 secure API endpoints
 * - ZERO business logic in frontend
 * - All operations require authentication
 *
 * Backend Services:
 * - ChurnPredictionModelService (logistic regression)
 * - CLVModelService (multiple regression)
 * - ChurnAnalyticsService (RFM-based)
 * - CLVAnalyticsService (predictive)
 * - CampaignPredictionService (forecasting)
 * - SendTimeOptimizationService (temporal analysis)
 * - CustomerSegmentationService (autonomous v3.0)
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ChurnPrediction {
  contactId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  features: any;
  reasoningFactors: string[];
  predictedAt: Date;
  modelVersion: string;
}

export interface CLVPrediction {
  contactId: string;
  predictedCLV: number;
  confidenceInterval: { lower: number; upper: number };
  valueSegment: 'high' | 'medium' | 'low' | 'prospect';
  confidence: number;
  features: any;
  contributingFactors: string[];
  predictedAt: Date;
  modelVersion: string;
  timeHorizon: '12_months' | '24_months' | '36_months';
}

export interface ChurnAnalysisResult {
  contactId: string;
  churnScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topRiskFactors: string[];
  recommendations: string[];
  predictedChurnDate?: Date;
  confidence: number;
  rfmSegment: string;
}

export interface LTVAnalysisResult {
  contactId: string;
  predictedLTV: number;
  currentValue: number;
  potentialValue: number;
  confidence: number;
  valueDrivers: string[];
  recommendations: string[];
  timeframe: number;
  rfmScore: { recency: number; frequency: number; monetary: number };
}

export interface CampaignPrediction {
  campaignId: string;
  predictedMetrics: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
    revenue: number;
  };
  confidence: number;
  recommendations: string[];
  riskFactors: string[];
  optimalSendTime?: Date;
}

export interface SendTimePrediction {
  contactId: string;
  channelType: string;
  bestTimes: Array<{
    dayOfWeek: number;
    hourOfDay: number;
    probability: number;
  }>;
  worstTimes: Array<{
    dayOfWeek: number;
    hourOfDay: number;
    probability: number;
  }>;
  averageResponseTime: number;
  predictionId: string;
}

export interface SegmentationResult {
  contactId: string;
  segments: string[];
  primarySegment: string;
  confidence: number;
  features: any;
  segmentedAt: Date;
  reasoning: string[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  segmentType: 'value' | 'behavior' | 'lifecycle' | 'engagement' | 'risk' | 'custom';
  criteria: any;
  characteristics: string[];
  size: number;
  averageClv: number;
  churnRate: number;
  recommendedActions: string[];
}

export interface AutonomousSegmentDiscovery {
  discoveryId: string;
  organizationId: string;
  algorithm: string;
  clustersFound: number;
  clusteringFeatures: string[];
  silhouetteScore: number;
  discoveredPatterns: any[];
  suggestedSegments: any[];
  discoveredAt: Date;
  confidence: number;
}

export interface BatchSegmentationResult {
  processed: number;
  segmented: number;
  errors: number;
}

// ============================================
// ML MODEL ENDPOINTS (Direct ML Models)
// ============================================

/**
 * Predict churn using ML logistic regression model
 */
export async function predictChurnML(
  contactId: string,
  token: string
): Promise<ChurnPrediction> {
  const response = await fetch(`${BACKEND_URL}/ai/ml/churn/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId }),
  });

  if (!response.ok) {
    throw new Error(`Churn prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Predict CLV using ML multiple regression model
 */
export async function predictCLVML(
  contactId: string,
  timeHorizon: '12_months' | '24_months' | '36_months' = '24_months',
  token: string
): Promise<CLVPrediction> {
  const response = await fetch(`${BACKEND_URL}/ai/ml/clv/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId, timeHorizon }),
  });

  if (!response.ok) {
    throw new Error(`CLV prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// CHURN ANALYTICS ENDPOINTS (RFM-based)
// ============================================

/**
 * Predict contact churn using RFM analysis
 */
export async function predictContactChurn(
  contactId: string,
  token: string
): Promise<ChurnAnalysisResult> {
  const response = await fetch(`${BACKEND_URL}/ai/analytics/churn/predict-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId }),
  });

  if (!response.ok) {
    throw new Error(`Contact churn analysis failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Batch predict churn for multiple contacts
 */
export async function batchPredictChurn(
  segmentId: string | undefined,
  token: string
): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/ai/analytics/churn/batch-predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ segmentId }),
  });

  if (!response.ok) {
    throw new Error(`Batch churn prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// CLV ANALYTICS ENDPOINTS (Predictive)
// ============================================

/**
 * Predict contact lifetime value
 */
export async function predictContactLTV(
  contactId: string,
  timeframeMonths: number = 12,
  token: string
): Promise<LTVAnalysisResult> {
  const response = await fetch(`${BACKEND_URL}/ai/analytics/ltv/predict-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId, timeframeMonths }),
  });

  if (!response.ok) {
    throw new Error(`Contact LTV analysis failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Batch predict LTV for multiple contacts
 */
export async function batchPredictLTV(
  segmentId: string | undefined,
  timeframeMonths: number = 12,
  token: string
): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/ai/analytics/ltv/batch-predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ segmentId, timeframeMonths }),
  });

  if (!response.ok) {
    throw new Error(`Batch LTV prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// CAMPAIGN PREDICTION ENDPOINTS
// ============================================

/**
 * Predict campaign performance before sending
 */
export async function predictCampaignPerformance(
  campaignId: string,
  token: string
): Promise<CampaignPrediction> {
  const response = await fetch(`${BACKEND_URL}/ai/campaign/predict-performance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ campaignId }),
  });

  if (!response.ok) {
    throw new Error(`Campaign prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get campaign predictions (multiple campaigns)
 */
export async function getCampaignPredictions(
  campaignIds: string[] | undefined,
  token: string
): Promise<CampaignPrediction[]> {
  const params = campaignIds ? `?campaignIds=${campaignIds.join(',')}` : '';

  const response = await fetch(`${BACKEND_URL}/ai/campaign/predictions${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Get campaign predictions failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// SEND TIME OPTIMIZATION ENDPOINTS
// ============================================

/**
 * Predict optimal send time for a contact
 */
export async function predictSendTime(
  contactId: string,
  channelType: string = 'email',
  token: string
): Promise<SendTimePrediction> {
  const response = await fetch(`${BACKEND_URL}/ai/send-time/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId, channelType }),
  });

  if (!response.ok) {
    throw new Error(`Send time prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get optimal send time for an audience (list or segment)
 */
export async function getOptimalSendTimeForAudience(
  listId: string | undefined,
  segmentId: string | undefined,
  channelType: string = 'email',
  token: string
): Promise<any[]> {
  const response = await fetch(`${BACKEND_URL}/ai/send-time/optimal-audience`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ listId, segmentId, channelType }),
  });

  if (!response.ok) {
    throw new Error(`Optimal audience send time failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// CUSTOMER SEGMENTATION ENDPOINTS
// ============================================

/**
 * Segment a customer using ML algorithms
 */
export async function segmentCustomer(
  contactId: string,
  token: string
): Promise<SegmentationResult> {
  const response = await fetch(`${BACKEND_URL}/ai/segmentation/segment-customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId }),
  });

  if (!response.ok) {
    throw new Error(`Customer segmentation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new customer segment
 */
export async function createSegment(
  name: string,
  description: string,
  segmentType: 'value' | 'behavior' | 'lifecycle' | 'engagement' | 'risk' | 'custom',
  criteria: any,
  token: string
): Promise<CustomerSegment> {
  const response = await fetch(`${BACKEND_URL}/ai/segmentation/create-segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description, segmentType, criteria }),
  });

  if (!response.ok) {
    throw new Error(`Create segment failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Discover autonomous segments using ML clustering
 */
export async function discoverAutonomousSegments(
  algorithm: 'kmeans' | 'hierarchical' | 'dbscan' | 'gaussian_mixture' | 'neural_clustering' = 'kmeans',
  minCustomers: number = 50,
  token: string
): Promise<AutonomousSegmentDiscovery> {
  const response = await fetch(`${BACKEND_URL}/ai/segmentation/discover-autonomous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ algorithm, minCustomers }),
  });

  if (!response.ok) {
    throw new Error(`Autonomous segment discovery failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Run batch segmentation for all customers
 */
export async function runBatchSegmentation(
  token: string
): Promise<BatchSegmentationResult> {
  const response = await fetch(`${BACKEND_URL}/ai/segmentation/batch-segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Batch segmentation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get comprehensive customer analytics (churn + LTV + segmentation)
 */
export async function getCustomerAnalytics(
  contactId: string,
  token: string
): Promise<{
  churn: ChurnAnalysisResult;
  ltv: LTVAnalysisResult;
  segmentation: SegmentationResult;
}> {
  const [churn, ltv, segmentation] = await Promise.all([
    predictContactChurn(contactId, token),
    predictContactLTV(contactId, 12, token),
    segmentCustomer(contactId, token),
  ]);

  return { churn, ltv, segmentation };
}

/**
 * Get campaign readiness check (predictions + optimal send time)
 */
export async function getCampaignReadiness(
  campaignId: string,
  listId: string | undefined,
  token: string
): Promise<{
  prediction: CampaignPrediction;
  optimalSendTimes: any[];
}> {
  const [prediction, optimalSendTimes] = await Promise.all([
    predictCampaignPerformance(campaignId, token),
    getOptimalSendTimeForAudience(listId, undefined, 'email', token),
  ]);

  return { prediction, optimalSendTimes };
}

/**
 * Export all ML proxy functions
 */
export default {
  // ML Models
  predictChurnML,
  predictCLVML,

  // Churn Analytics
  predictContactChurn,
  batchPredictChurn,

  // CLV Analytics
  predictContactLTV,
  batchPredictLTV,

  // Campaign Prediction
  predictCampaignPerformance,
  getCampaignPredictions,

  // Send Time Optimization
  predictSendTime,
  getOptimalSendTimeForAudience,

  // Customer Segmentation
  segmentCustomer,
  createSegment,
  discoverAutonomousSegments,
  runBatchSegmentation,

  // Convenience Functions
  getCustomerAnalytics,
  getCampaignReadiness,
};
