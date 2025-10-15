/**
 * Autonomous A/B Testing Engine - Frontend Stub
 * ==============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/autonomous-ab-testing-engine.service.ts
 *
 * TODO: Migrate /api/ai/autonomous-ab-testing route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Autonomous A/B Testing Engine
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class AutonomousABTestingEngine {
  constructor() {
    console.warn('⚠️  Using stub AutonomousABTestingEngine. Migrate to backend API.');
  }

  async getActiveTests(): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }

  async getTestResults(testId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }

  async getAutonomousTestingMetrics(): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }

  async requestAutonomousTest(testRequest: any): Promise<string> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }

  async pauseTest(testId: string): Promise<boolean> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }

  async resumeTest(testId: string): Promise<boolean> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/ab-testing');
  }
}

export const autonomousABTestingEngine = new AutonomousABTestingEngine();
