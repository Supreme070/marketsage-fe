/**
 * Task Automation Engine - Frontend Stub
 * =======================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class TaskAutomationEngine {
  constructor() {
    console.warn('⚠️  Using stub TaskAutomationEngine. Migrate to backend API.');
  }

  async automate(task: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async scheduleAutomation(schedule: any): Promise<string> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const taskAutomationEngine = new TaskAutomationEngine();
export default taskAutomationEngine;
