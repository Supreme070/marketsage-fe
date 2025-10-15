/**
 * Unified Messaging Service - Frontend Stub
 * ==========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class UnifiedMessagingService {
  constructor() {
    console.warn('⚠️  Using stub UnifiedMessagingService. Migrate to backend API.');
  }

  async send(channel: string, to: string, message: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async sendBatch(messages: any[]): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const unifiedMessagingService = new UnifiedMessagingService();
export default unifiedMessagingService;
