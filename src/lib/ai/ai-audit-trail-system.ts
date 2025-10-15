/**
 * AI Audit Trail System - Frontend Stub
 * ======================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AiAuditTrailSystem {
  constructor() {
    console.warn('⚠️  Using stub AiAuditTrailSystem. Migrate to backend API.');
  }

  async logAction(action: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async getAuditTrail(filters: any): Promise<any[]> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const aiAuditTrailSystem = new AiAuditTrailSystem();
export default aiAuditTrailSystem;
