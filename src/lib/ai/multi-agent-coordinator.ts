/**
 * Multi-Agent Coordinator - Frontend Stub
 * ========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class MultiAgentCoordinator {
  constructor() {
    console.warn('⚠️  Using stub MultiAgentCoordinator. Migrate to backend API.');
  }

  async coordinate(agents: any[]): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async assignTask(agentId: string, task: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async getAgentStatus(agentId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const multiAgentCoordinator = new MultiAgentCoordinator();
