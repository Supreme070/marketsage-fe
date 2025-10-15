/**
 * Realtime Decision Engine - Frontend Stub
 * =========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class RealtimeDecisionEngine {
  constructor() {
    console.warn('⚠️  Using stub RealtimeDecisionEngine. Migrate to backend API.');
  }

  async makeDecision(context: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async evaluateRealtime(data: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const realtimeDecisionEngine = new RealtimeDecisionEngine();
export default realtimeDecisionEngine;
