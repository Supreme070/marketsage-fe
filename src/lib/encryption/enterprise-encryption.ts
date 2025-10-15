/**
 * Enterprise Encryption - Frontend Stub
 * ======================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

class EnterpriseEncryption {
  constructor() {
    console.warn('⚠️  Using stub EnterpriseEncryption. Migrate to backend API.');
  }

  async encrypt(data: string): Promise<string> {
    throw new Error('Method not implemented - use backend API');
  }

  async decrypt(encrypted: string): Promise<string> {
    throw new Error('Method not implemented - use backend API');
  }
}

export const enterpriseEncryption = new EnterpriseEncryption();
export default enterpriseEncryption;
