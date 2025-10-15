/**
 * Batch Predictor - Frontend Stub
 * ================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class BatchPredictor {
  constructor() {
    console.warn('⚠️  Using stub BatchPredictor. Migrate to backend API.');
  }

  async predict(data: any[]): Promise<any[]> {
    throw new Error('Method not implemented - use backend API');
  }

  async batchPredict(batches: any[]): Promise<any[]> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const batchPredictor = new BatchPredictor();
