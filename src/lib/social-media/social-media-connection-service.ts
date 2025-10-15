/**
 * Social Media Connection Service - Frontend Stub
 * ================================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate OAuth callback routes to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

interface ConnectionData {
  organizationId: string;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  expiresAt?: Date;
  scope: string[];
  metadata?: Record<string, any>;
}

/**
 * Social Media Connection Service
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class SocialMediaConnectionService {
  constructor() {
    console.warn('⚠️  Using stub SocialMediaConnectionService. Migrate to backend API.');
  }

  async storeConnection(data: ConnectionData): Promise<void> {
    throw new Error('Method not implemented - use backend API at /api/v2/social-media/connections');
  }

  async getConnection(organizationId: string, platform: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/social-media/connections');
  }

  async deleteConnection(organizationId: string, platform: string): Promise<void> {
    throw new Error('Method not implemented - use backend API at /api/v2/social-media/connections');
  }

  async refreshToken(organizationId: string, platform: string): Promise<void> {
    throw new Error('Method not implemented - use backend API at /api/v2/social-media/connections');
  }
}

export const socialMediaConnectionService = new SocialMediaConnectionService();
