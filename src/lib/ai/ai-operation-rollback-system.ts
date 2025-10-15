/**
 * AI Operation Rollback System - Frontend Stub
 * =============================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class AiOperationRollbackSystem {
  constructor() {
    console.warn('⚠️  Using stub AiOperationRollbackSystem. Migrate to backend API.');
  }

  async rollback(operationId: string): Promise<void> {
    throw new Error('Method not implemented - use backend API');
  }

  async canRollback(operationId: string): Promise<boolean> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const aiOperationRollbackSystem = new AiOperationRollbackSystem();
export default aiOperationRollbackSystem;
