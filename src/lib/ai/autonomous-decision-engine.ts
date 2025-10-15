/**
 * Autonomous Decision Engine - Frontend Stub
 * ===========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AutonomousDecisionEngine {
  constructor() {
    console.warn('⚠️  Using stub AutonomousDecisionEngine. Migrate to backend API.');
  }

  async decide(context: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async evaluateOptions(options: any[]): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const autonomousDecisionEngine = new AutonomousDecisionEngine();
export default autonomousDecisionEngine;
