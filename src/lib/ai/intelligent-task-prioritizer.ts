/**
 * Intelligent Task Prioritizer - Frontend Stub
 * =============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class IntelligentTaskPrioritizer {
  constructor() {
    console.warn('⚠️  Using stub IntelligentTaskPrioritizer. Migrate to backend API.');
  }

  async prioritize(tasks: any[]): Promise<any[]> {
    throw new Error('Method not implemented - use backend API');
  }

  async calculatePriority(task: any): Promise<number> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const intelligentTaskPrioritizer = new IntelligentTaskPrioritizer();
export default intelligentTaskPrioritizer;
