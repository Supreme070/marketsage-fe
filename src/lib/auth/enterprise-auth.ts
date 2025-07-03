/**
 * Enterprise Authentication System
 * ===============================
 * Advanced authentication with MFA, device trust, and zero-trust architecture
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email' | 'hardware_token')[];
  backupCodes: string[];
  lastUsed?: Date;
}

interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  hash: string;
}

interface AuthContext {
  ip: string;
  userAgent: string;
  deviceFingerprint?: DeviceFingerprint;
  location?: {
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  riskScore: number;
}

interface AuthResult {
  success: boolean;
  user?: any;
  requiresMFA: boolean;
  mfaMethods?: string[];
  deviceTrusted: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sessionToken?: string;
  expiresAt?: Date;
  message?: string;
}

export class EnterpriseAuth {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes
  private readonly sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
  private readonly deviceTrustDuration = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Advanced authentication with context analysis
   */
  async authenticate(
    email: string, 
    password: string, 
    context: AuthContext,
    mfaToken?: string
  ): Promise<AuthResult> {
    try {
      // Input validation
      if (!email || !password) {
        return this.failureResult('Missing credentials', 'critical');
      }

      if (!this.isValidEmail(email)) {
        return this.failureResult('Invalid email format', 'medium');
      }

      // Check for account lockout
      const lockoutStatus = await this.checkAccountLockout(email);
      if (lockoutStatus.locked) {
        await this.logSecurityEvent('ACCOUNT_LOCKED', email, context);
        return this.failureResult(`Account locked until ${lockoutStatus.lockedUntil}`, 'high');
      }

      // Risk assessment
      const riskAssessment = await this.assessRisk(email, context);
      if (riskAssessment.score > 80) {
        await this.logSecurityEvent('HIGH_RISK_LOGIN', email, context);
        return this.failureResult('Login blocked due to high risk', 'critical');
      }

      // Find user with security data
      const user = await this.findUserSecure(email);
      if (!user) {
        await this.recordFailedAttempt(email, context);
        return this.failureResult('Invalid credentials', 'medium');
      }

      // Password verification with timing attack protection
      const passwordValid = await this.verifyPasswordSecure(password, user.password);
      if (!passwordValid) {
        await this.recordFailedAttempt(email, context);
        return this.failureResult('Invalid credentials', 'medium');
      }

      // Check MFA requirements
      const mfaRequired = await this.requiresMFA(user, context);
      if (mfaRequired && !mfaToken) {
        return {
          success: false,
          requiresMFA: true,
          mfaMethods: user.mfaConfig?.methods || ['totp'],
          deviceTrusted: false,
          riskLevel: riskAssessment.level,
          message: 'MFA required'
        };
      }

      // Verify MFA if provided
      if (mfaToken) {
        const mfaValid = await this.verifyMFA(user, mfaToken);
        if (!mfaValid) {
          await this.recordFailedAttempt(email, context);
          return this.failureResult('Invalid MFA token', 'medium');
        }
      }

      // Device trust evaluation
      const deviceTrusted = await this.evaluateDeviceTrust(user.id, context);

      // Generate secure session
      const session = await this.createSecureSession(user, context, deviceTrusted);

      // Log successful authentication
      await this.logSecurityEvent('LOGIN_SUCCESS', email, context);
      await this.clearFailedAttempts(email);

      return {
        success: true,
        user: this.sanitizeUser(user),
        requiresMFA: false,
        deviceTrusted,
        riskLevel: riskAssessment.level,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        message: 'Authentication successful'
      };

    } catch (error) {
      logger.error('Enterprise authentication error', { 
        error: error instanceof Error ? error.message : String(error),
        email,
        context 
      });
      
      return this.failureResult('Authentication system error', 'critical');
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<{
    secret?: string;
    qrCode?: string;
    backupCodes: string[];
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let secret: string | undefined;
    let qrCode: string | undefined;
    const backupCodes = this.generateBackupCodes();

    if (method === 'totp') {
      secret = authenticator.generateSecret();
      qrCode = authenticator.keyuri(user.email, 'MarketSage', secret);
    }

    // Update user MFA config
    const mfaConfig: MFAConfig = {
      enabled: true,
      methods: [method],
      backupCodes: await Promise.all(
        backupCodes.map(code => bcrypt.hash(code, 12))
      )
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret ? await bcrypt.hash(secret, 12) : null,
        mfaConfig: mfaConfig as any
      }
    });

    logger.info('MFA setup completed', { userId, method });

    return { secret, qrCode, backupCodes };
  }

  /**
   * Risk assessment based on context
   */
  private async assessRisk(email: string, context: AuthContext): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  }> {
    let riskScore = 0;
    const factors: string[] = [];

    // IP reputation check
    if (await this.isHighRiskIP(context.ip)) {
      riskScore += 30;
      factors.push('high_risk_ip');
    }

    // Geolocation analysis
    const userLocations = await this.getUserLocations(email);
    if (context.location && !this.isKnownLocation(context.location, userLocations)) {
      riskScore += 25;
      factors.push('unknown_location');
    }

    // Device fingerprint analysis
    if (context.deviceFingerprint) {
      const isKnownDevice = await this.isKnownDevice(email, context.deviceFingerprint);
      if (!isKnownDevice) {
        riskScore += 20;
        factors.push('unknown_device');
      }
    }

    // Time-based patterns
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
      factors.push('unusual_time');
    }

    // Recent failed attempts
    const recentFailures = await this.getRecentFailedAttempts(email);
    if (recentFailures > 3) {
      riskScore += 20;
      factors.push('recent_failures');
    }

    let level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 70) level = 'critical';
    else if (riskScore >= 50) level = 'high';
    else if (riskScore >= 30) level = 'medium';
    else level = 'low';

    return { score: riskScore, level, factors };
  }

  /**
   * Password verification with timing attack protection
   */
  private async verifyPasswordSecure(password: string, hashedPassword: string): Promise<boolean> {
    // Always perform bcrypt comparison to prevent timing attacks
    const startTime = Date.now();
    
    try {
      const result = await bcrypt.compare(password, hashedPassword);
      
      // Ensure minimum processing time to prevent timing attacks
      const minTime = 100; // 100ms minimum
      const elapsed = Date.now() - startTime;
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
      }
      
      return result;
    } catch (error) {
      // Still wait minimum time even on error
      const elapsed = Date.now() - startTime;
      const minTime = 100;
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
      }
      
      return false;
    }
  }

  /**
   * MFA verification
   */
  private async verifyMFA(user: any, token: string): Promise<boolean> {
    if (!user.mfaSecret || !user.mfaConfig?.enabled) {
      return false;
    }

    // Verify TOTP token
    if (user.mfaConfig.methods.includes('totp')) {
      const secret = await bcrypt.compare(token, user.mfaSecret) ? user.mfaSecret : null;
      if (secret && authenticator.verify({ token, secret })) {
        return true;
      }
    }

    // Check backup codes
    if (user.mfaConfig.backupCodes) {
      for (const hashedCode of user.mfaConfig.backupCodes) {
        if (await bcrypt.compare(token, hashedCode)) {
          // Remove used backup code
          await this.removeUsedBackupCode(user.id, hashedCode);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Create secure session with device binding
   */
  private async createSecureSession(user: any, context: AuthContext, deviceTrusted: boolean) {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.sessionDuration);

    // Create session in database
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: await bcrypt.hash(token, 12),
        expiresAt,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint?.hash,
        trusted: deviceTrusted,
        lastActivity: new Date()
      }
    });

    return { token: `${sessionId}:${token}`, expiresAt };
  }

  /**
   * Helper methods
   */
  private failureResult(message: string, riskLevel: 'low' | 'medium' | 'high' | 'critical'): AuthResult {
    return {
      success: false,
      requiresMFA: false,
      deviceTrusted: false,
      riskLevel,
      message
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private async findUserSecure(email: string) {
    return await prisma.user.findUnique({
      where: { email, isActive: true },
      include: {
        organization: {
          select: { id: true, name: true, isActive: true }
        }
      }
    });
  }

  private sanitizeUser(user: any) {
    const { password, mfaSecret, ...sanitized } = user;
    return sanitized;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }

  private async checkAccountLockout(email: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
    // Implementation for account lockout check
    const attempts = await this.getFailedAttempts(email);
    if (attempts.count >= this.maxLoginAttempts) {
      const lockedUntil = new Date(attempts.lastAttempt.getTime() + this.lockoutDuration);
      if (new Date() < lockedUntil) {
        return { locked: true, lockedUntil };
      }
    }
    return { locked: false };
  }

  private async getFailedAttempts(email: string): Promise<{ count: number; lastAttempt: Date }> {
    // Implementation to get failed attempts from database/cache
    return { count: 0, lastAttempt: new Date() };
  }

  private async recordFailedAttempt(email: string, context: AuthContext): Promise<void> {
    await this.logSecurityEvent('LOGIN_FAILURE', email, context);
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    // Clear failed attempts from database/cache
  }

  private async requiresMFA(user: any, context: AuthContext): Promise<boolean> {
    if (!user.mfaConfig?.enabled) return false;
    
    // Skip MFA for trusted devices in low-risk contexts
    const deviceTrusted = await this.evaluateDeviceTrust(user.id, context);
    const riskAssessment = await this.assessRisk(user.email, context);
    
    return !deviceTrusted || riskAssessment.level !== 'low';
  }

  private async evaluateDeviceTrust(userId: string, context: AuthContext): Promise<boolean> {
    if (!context.deviceFingerprint) return false;
    
    // Check if device was recently trusted
    const trustedDevice = await prisma.trustedDevice.findFirst({
      where: {
        userId,
        fingerprint: context.deviceFingerprint.hash,
        expiresAt: { gt: new Date() }
      }
    });
    
    return !!trustedDevice;
  }

  private async logSecurityEvent(type: string, email: string, context: AuthContext): Promise<void> {
    logger.info('Security event', {
      type,
      email,
      ip: context.ip,
      userAgent: context.userAgent,
      riskScore: context.riskScore,
      timestamp: new Date()
    });
  }

  private async isHighRiskIP(ip: string): Promise<boolean> {
    // Implement IP reputation check
    return false;
  }

  private async getUserLocations(email: string): Promise<any[]> {
    // Get historical user locations
    return [];
  }

  private isKnownLocation(location: any, knownLocations: any[]): boolean {
    // Check if location is within acceptable range of known locations
    return true;
  }

  private async isKnownDevice(email: string, fingerprint: DeviceFingerprint): Promise<boolean> {
    // Check if device fingerprint is known
    return false;
  }

  private async getRecentFailedAttempts(email: string): Promise<number> {
    // Get count of recent failed attempts
    return 0;
  }

  private async removeUsedBackupCode(userId: string, hashedCode: string): Promise<void> {
    // Remove used backup code from database
  }
}

export const enterpriseAuth = new EnterpriseAuth();