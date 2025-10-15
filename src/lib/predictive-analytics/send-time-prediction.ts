/**
 * Send Time Prediction - Frontend Stub
 * =====================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export async function predictOptimalSendTime(contactId: string, campaignId: string): Promise<any> {
  console.warn('⚠️  Using stub predictOptimalSendTime. Migrate to backend API.');
  throw new Error('Method not implemented - use backend API at /api/v2/ai/send-time-prediction');
}

export async function getSendTimePrediction(contactId: string, campaignId: string): Promise<any> {
  return predictOptimalSendTime(contactId, campaignId);
}
