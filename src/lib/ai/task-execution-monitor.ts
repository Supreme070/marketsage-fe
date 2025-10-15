/**
 * UtaskUexecutionUmonitor - Frontend Stub
 * ==
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate corresponding API route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

/**
 * UtaskUexecutionUmonitor
 *
 * STUB - Does not contain real implementation.
 * All operations should make API calls to backend.
 */
class UtaskUexecutionUmonitor {
  constructor() {
    console.warn('⚠️  Using stub UtaskUexecutionUmonitor. Migrate to backend API.');
  }

  // Stub methods - actual implementation should be in backend
  async execute(...args: any[]): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const taskUexecutionUmonitor = new UtaskUexecutionUmonitor();
export default taskUexecutionUmonitor;
