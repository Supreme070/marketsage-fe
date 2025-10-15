/**
 * Autonomous Lead Qualification Engine - Frontend Stub
 * ====================================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/intelligent-lead-qualification-engine.service.ts
 *
 * TODO: Migrate /api/ai/autonomous-lead-qualification route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Autonomous Lead Qualification Engine
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class AutonomousLeadQualificationEngine {
  constructor() {
    console.warn('⚠️  Using stub AutonomousLeadQualificationEngine. Migrate to backend API.');
  }

  async qualifyLead(
    qualificationRequest: any,
    organizationId: string,
    options: any
  ): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/lead-qualification');
  }
}

export const autonomousLeadQualificationEngine = new AutonomousLeadQualificationEngine();
