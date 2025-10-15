/**
 * Workflow Execution Engine - Frontend Stub
 * ==========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class WorkflowExecutionEngine {
  constructor() {
    console.warn('⚠️  Using stub WorkflowExecutionEngine. Migrate to backend API.');
  }

  async execute(workflowId: string, context: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async getExecutionStatus(executionId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const workflowExecutionEngine = new WorkflowExecutionEngine();
export default workflowExecutionEngine;
