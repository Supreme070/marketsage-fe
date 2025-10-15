/**
 * Persistent Memory Engine - Frontend Stub
 * =========================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class PersistentMemoryEngine {
  constructor() {
    console.warn('⚠️  Using stub PersistentMemoryEngine. Migrate to backend API.');
  }

  async store(key: string, value: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async retrieve(key: string): Promise<any> {
    throw new Error('Method not implemented - use backend API');
  }

  async remember(context: any): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const persistentMemoryEngine = new PersistentMemoryEngine();
export default persistentMemoryEngine;
