/**
 * Churn Prediction - Frontend Stub
 * =================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export async function predictChurn(contactId: string): Promise<any> {
  console.warn('⚠️  Using stub predictChurn. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/ai/churn-prediction');
}

export async function getChurnPrediction(contactId: string): Promise<any> {
  return predictChurn(contactId);
}
