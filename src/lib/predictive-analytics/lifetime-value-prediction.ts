/**
 * Lifetime Value Prediction - Frontend Stub
 * ==========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export async function predictLifetimeValue(contactId: string): Promise<any> {
  console.warn('⚠️  Using stub predictLifetimeValue. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/ai/clv-prediction');
}

export async function getCLVPrediction(contactId: string): Promise<any> {
  return predictLifetimeValue(contactId);
}
