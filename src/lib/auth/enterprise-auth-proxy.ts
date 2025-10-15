/**
 * Enterprise Authentication Proxy
 * ================================
 * Secure proxy layer for enterprise authentication features
 *
 * This file replaces the insecure frontend implementation that had bcrypt operations.
 * All cryptographic operations are now handled server-side in the backend.
 *
 * Migration Date: October 11, 2025
 * Backend: /Users/supreme/Desktop/marketsage-backend/src/auth/auth.service.ts
 */

import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

interface MFASetupResponse {
  secret?: string;
  qrCode?: string;
  backupCodes: string[];
}

interface MFAVerifyResponse {
  valid: boolean;
  method?: string;
}

interface RiskAssessmentResponse {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

interface DeviceTrustResponse {
  success: boolean;
  message?: string;
}

interface RiskAssessmentContext {
  ip: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
  };
  deviceFingerprint?: string;
}

/**
 * Enterprise Authentication Proxy Class
 * All authentication operations are proxied to the backend API
 */
export class EnterpriseAuthProxy {
  /**
   * Setup MFA for a user
   * POST /auth/mfa/setup
   */
  async setupMFA(userId: string, method: 'totp' | 'sms' | 'email', token?: string): Promise<MFASetupResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId,
          method,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to setup MFA');
      }

      const data = await response.json();
      logger.info('MFA setup successful', { userId, method });

      return data;
    } catch (error) {
      logger.error('MFA setup failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        method,
      });
      throw error;
    }
  }

  /**
   * Verify MFA token
   * POST /auth/mfa/verify
   */
  async verifyMFA(userId: string, token: string, authToken?: string): Promise<MFAVerifyResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          userId,
          token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify MFA');
      }

      const data = await response.json();

      if (data.valid) {
        logger.info('MFA verification successful', { userId });
      } else {
        logger.warn('MFA verification failed', { userId });
      }

      return data;
    } catch (error) {
      logger.error('MFA verification error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Trust a device for 30 days
   * POST /auth/device/trust
   */
  async trustDevice(userId: string, deviceFingerprint: string, token?: string): Promise<DeviceTrustResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/device/trust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId,
          deviceFingerprint,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to trust device');
      }

      const data = await response.json();
      logger.info('Device trusted successfully', { userId, deviceFingerprint });

      return data;
    } catch (error) {
      logger.error('Trust device failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        deviceFingerprint,
      });
      throw error;
    }
  }

  /**
   * Get risk assessment for authentication attempt
   * POST /auth/risk-assessment
   */
  async getRiskAssessment(email: string, context: RiskAssessmentContext, token?: string): Promise<RiskAssessmentResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/risk-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          email,
          context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assess risk');
      }

      const data = await response.json();
      logger.debug('Risk assessment completed', { email, riskLevel: data.level, score: data.score });

      return data;
    } catch (error) {
      logger.error('Risk assessment failed', {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw error;
    }
  }

  /**
   * Generate device fingerprint (client-side only operation)
   * This is safe to do on the frontend as it doesn't involve cryptography
   */
  generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform,
    ];

    // Simple hash function for fingerprinting
    let hash = 0;
    const str = components.join('|');

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Get device information for context
   */
  getDeviceContext() {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      hash: this.generateDeviceFingerprint(),
    };
  }
}

// Export singleton instance
export const enterpriseAuthProxy = new EnterpriseAuthProxy();

// Export types for consumers
export type {
  MFASetupResponse,
  MFAVerifyResponse,
  RiskAssessmentResponse,
  DeviceTrustResponse,
  RiskAssessmentContext,
};
