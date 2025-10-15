/**
 * Admin Realtime Service - Frontend Stub
 * =======================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AdminRealtimeService {
  constructor() {
    console.warn('⚠️  Using stub AdminRealtimeService. Migrate to backend API.');
  }

  async connect(): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async disconnect(): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async emit(event: string, data: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const adminRealtimeService = new AdminRealtimeService();
export default adminRealtimeService;
