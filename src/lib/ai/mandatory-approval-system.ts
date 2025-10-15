/**
 * Mandatory Approval System - Frontend Stub
 * ==========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/mandatory-approval-system.service.ts
 *
 * TODO: Migrate /api/ai/approval route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Mandatory Approval System
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class MandatoryApprovalSystem {
  constructor() {
    console.warn('⚠️  Using stub MandatoryApprovalSystem. Migrate to backend API.');
  }

  async createApprovalRequest(
    userId: string,
    role: string,
    organizationId: string,
    taskType: string,
    actionType: string,
    description: string,
    parameters: Record<string, any>,
    estimatedImpact: any,
    urgency: string
  ): Promise<string> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async getPendingApprovals(
    organizationId: string,
    userId: string,
    limit: number
  ): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async getTrustMetrics(userId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async getSystemStatus(organizationId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async getDeploymentConfiguration(organizationId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async processApprovalDecision(
    requestId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async executeApprovedAction(requestId: string, executionResult: any): Promise<void> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }

  async requiresApproval(
    userId: string,
    organizationId: string,
    actionType: string,
    parameters: Record<string, any>
  ): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/approval');
  }
}

export const mandatoryApprovalSystem = new MandatoryApprovalSystem();
