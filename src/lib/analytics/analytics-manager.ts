/**
 * Analytics Manager - Frontend Stub
 * ==================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AnalyticsManager {
  constructor() {
    console.warn('⚠️  Using stub AnalyticsManager. Migrate to backend API.');
  }

  async track(event: string, properties: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async getMetrics(filters: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const analyticsManager = new AnalyticsManager();
export default analyticsManager;
