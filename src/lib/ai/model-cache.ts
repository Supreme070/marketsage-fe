/**
 * AI Model Cache - Frontend Stub
 * ===============================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AIModelCache {
  constructor() {
    console.warn('⚠️  Using stub AIModelCache. Migrate to backend API.');
  }

  async get(key: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async invalidate(key: string): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const aiModelCache = new AIModelCache();
