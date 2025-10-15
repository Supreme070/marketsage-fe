/**
 * Customer Lifetime Value Model - Frontend Stub
 * ==============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/customer-lifetime-value-model.service.ts
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Get CLV (Customer Lifetime Value) prediction model
 *
 * STUB FUNCTION - Does not contain real implementation.
 * Should make API call to backend.
 */
export async function getCLVPredictionModel() {
  console.warn('⚠️  Using stub getCLVPredictionModel. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/ai/clv-prediction');
}

/**
 * Get customer lifetime value model (alias)
 */
export async function getCustomerLifetimeValueModel() {
  return getCLVPredictionModel();
}

/**
 * Predict customer lifetime value
 */
export async function predictCLV(customerData: any): Promise<any> {
  console.warn('⚠️  Using stub predictCLV. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/ai/clv-prediction');
}
