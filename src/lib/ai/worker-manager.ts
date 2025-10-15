/**
 * AI Worker Manager - Frontend Stub
 * ==================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AIWorkerManager {
  constructor() {
    console.warn('⚠️  Using stub AIWorkerManager. Migrate to backend API.');
  }

  async assignTask(task: any): Promise<string> {
    throw new Error('Method not implemented - use backend API');
  }

  async getWorkerStatus(): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async getWorkerMetrics(): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const aiWorkerManager = new AIWorkerManager();
