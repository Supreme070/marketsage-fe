/**
 * Autonomous Content Generator - Frontend Stub
 * =============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AutonomousContentGenerator {
  constructor() {
    console.warn('⚠️  Using stub AutonomousContentGenerator. Migrate to backend API.');
  }

  async generate(prompt: string, options?: any): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async generateSEOContent(topic: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const autonomousContentGenerator = new AutonomousContentGenerator();
export default autonomousContentGenerator;
