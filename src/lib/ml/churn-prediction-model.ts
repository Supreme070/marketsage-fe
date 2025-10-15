/**
 * Churn Prediction Model - Frontend Stub
 * ========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/churn-prediction-model.service.ts
 *
 * TODO: Migrate /api/ml/churn-prediction route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Get churn prediction model
 *
 * STUB FUNCTION - Does not contain real implementation.
 * Should make API call to backend.
 */
export async function getChurnPredictionModel() {
  console.warn('⚠️  Using stub getChurnPredictionModel. Migrate to backend API.');

  // TODO: Replace with backend API call
  throw new Error('Method not implemented - use backend API at /api/v2/ai/churn-prediction');
}

/**
 * Get CLV (Customer Lifetime Value) prediction model
 *
 * STUB FUNCTION - Does not contain real implementation.
 * Should make API call to backend.
 */
export async function getCLVPredictionModel() {
  console.warn('⚠️  Using stub getCLVPredictionModel. Migrate to backend API.');

  // TODO: Replace with backend API call
  throw new Error('Method not implemented - use backend API at /api/v2/ai/clv-prediction');
}

/**
 * Get customer lifetime value model (alias)
 */
export async function getCustomerLifetimeValueModel() {
  return getCLVPredictionModel();
}
