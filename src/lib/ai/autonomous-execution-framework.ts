/**
 * Autonomous Execution Framework - Frontend Stub
 * ===============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation exists in the backend at:
 * /src/ai/services/autonomous-execution-framework.service.ts
 *
 * TODO: Migrate /api/ai/autonomous route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * Autonomous Execution Framework
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class AutonomousExecutionFramework {
  constructor() {
    console.warn('⚠️  Using stub AutonomousExecutionFramework. Migrate to backend API.');
  }

  async registerAutonomousTask(taskData: any): Promise<string> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }

  async getAutonomousTasks(userId: string): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }

  async getTaskById(taskId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }

  async getPredictiveInsights(taskId?: string): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }

  getFrameworkStatus(): any {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }

  async cancelTask(taskId: string): Promise<boolean> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/autonomous-execution');
  }
}

export const autonomousExecutionFramework = new AutonomousExecutionFramework();
