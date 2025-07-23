/**
 * Multi-Tenant Social Media Connection Service
 * ============================================
 * 
 * Handles OAuth connections for each client to their own social media accounts
 * No shared credentials - each organization connects their own accounts
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { encryptField, decryptField } from '@/lib/encryption/field-encryption';

export interface SocialMediaConnection {
  id: string;
  organizationId: string;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
  isActive: boolean;
  lastSync?: Date;
  metadata: any;
}

export class SocialMediaConnectionService {
  
  /**
   * Get all social media connections for an organization
   */
  async getOrganizationConnections(organizationId: string): Promise<SocialMediaConnection[]> {
    try {
      const connections = await prisma.socialMediaAccount.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      return connections.map(conn => ({
        id: conn.id,
        organizationId: conn.organizationId,
        userId: conn.userId,
        platform: conn.platform,
        accountId: conn.accountId,
        accountName: conn.accountName || '',
        accessToken: decryptField(conn.accessToken),
        refreshToken: conn.refreshToken ? decryptField(conn.refreshToken) : undefined,
        expiresAt: conn.expiresAt,
        scope: conn.scope as string[],
        isActive: conn.isActive,
        lastSync: conn.lastSync,
        metadata: conn.metadata as any
      }));
    } catch (error) {
      logger.error('Failed to get organization connections', { error, organizationId });
      throw error;
    }
  }

  /**
   * Check if organization has specific platform connected
   */
  async isPlatformConnected(organizationId: string, platform: string): Promise<boolean> {
    const connection = await prisma.socialMediaAccount.findFirst({
      where: {
        organizationId,
        platform,
        isActive: true,
        expiresAt: {
          gt: new Date() // Token not expired
        }
      }
    });

    return !!connection;
  }

  /**
   * Get platform connection for organization
   */
  async getPlatformConnection(organizationId: string, platform: string): Promise<SocialMediaConnection | null> {
    try {
      const connection = await prisma.socialMediaAccount.findFirst({
        where: {
          organizationId,
          platform,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!connection) return null;

      return {
        id: connection.id,
        organizationId: connection.organizationId,
        userId: connection.userId,
        platform: connection.platform,
        accountId: connection.accountId,
        accountName: connection.accountName || '',
        accessToken: decryptField(connection.accessToken),
        refreshToken: connection.refreshToken ? decryptField(connection.refreshToken) : undefined,
        expiresAt: connection.expiresAt,
        scope: connection.scope as string[],
        isActive: connection.isActive,
        lastSync: connection.lastSync,
        metadata: connection.metadata as any
      };
    } catch (error) {
      logger.error('Failed to get platform connection', { error, organizationId, platform });
      return null;
    }
  }

  /**
   * Store OAuth connection after successful authentication
   */
  async storeConnection(data: {
    organizationId: string;
    userId: string;
    platform: string;
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope: string[];
    metadata?: any;
  }): Promise<SocialMediaConnection> {
    try {
      // Deactivate existing connections for same platform
      await prisma.socialMediaAccount.updateMany({
        where: {
          organizationId: data.organizationId,
          platform: data.platform
        },
        data: { isActive: false }
      });

      // Create new connection
      const connection = await prisma.socialMediaAccount.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          platform: data.platform,
          accountId: data.accountId,
          accountName: data.accountName,
          accessToken: encryptField(data.accessToken),
          refreshToken: data.refreshToken ? encryptField(data.refreshToken) : null,
          expiresAt: data.expiresAt,
          scope: data.scope,
          isActive: true,
          lastSync: new Date(),
          metadata: data.metadata || {}
        }
      });

      logger.info('Social media connection stored', {
        organizationId: data.organizationId,
        platform: data.platform,
        accountId: data.accountId
      });

      return {
        id: connection.id,
        organizationId: connection.organizationId,
        userId: connection.userId,
        platform: connection.platform,
        accountId: connection.accountId,
        accountName: connection.accountName || '',
        accessToken: data.accessToken, // Return unencrypted for immediate use
        refreshToken: data.refreshToken,
        expiresAt: connection.expiresAt,
        scope: connection.scope as string[],
        isActive: connection.isActive,
        lastSync: connection.lastSync,
        metadata: connection.metadata as any
      };
    } catch (error) {
      logger.error('Failed to store social media connection', { error, data });
      throw error;
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(connectionId: string): Promise<boolean> {
    try {
      const connection = await prisma.socialMediaAccount.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.refreshToken) {
        return false;
      }

      const refreshToken = decryptField(connection.refreshToken);
      
      // Platform-specific token refresh logic
      const newTokens = await this.performTokenRefresh(connection.platform, refreshToken);
      
      if (newTokens) {
        await prisma.socialMediaAccount.update({
          where: { id: connectionId },
          data: {
            accessToken: encryptField(newTokens.accessToken),
            refreshToken: newTokens.refreshToken ? encryptField(newTokens.refreshToken) : connection.refreshToken,
            expiresAt: newTokens.expiresAt,
            lastSync: new Date()
          }
        });

        logger.info('Access token refreshed', { connectionId, platform: connection.platform });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to refresh token', { error, connectionId });
      return false;
    }
  }

  /**
   * Remove connection
   */
  async removeConnection(organizationId: string, platform: string): Promise<boolean> {
    try {
      await prisma.socialMediaAccount.updateMany({
        where: {
          organizationId,
          platform
        },
        data: { isActive: false }
      });

      logger.info('Social media connection removed', { organizationId, platform });
      return true;
    } catch (error) {
      logger.error('Failed to remove connection', { error, organizationId, platform });
      return false;
    }
  }

  /**
   * Get connection statistics for organization
   */
  async getConnectionStats(organizationId: string) {
    try {
      const connections = await prisma.socialMediaAccount.groupBy({
        by: ['platform'],
        where: {
          organizationId,
          isActive: true
        },
        _count: {
          platform: true
        }
      });

      const stats = {
        totalConnections: connections.length,
        platforms: connections.reduce((acc, conn) => {
          acc[conn.platform] = conn._count.platform;
          return acc;
        }, {} as Record<string, number>),
        connectedPlatforms: connections.map(c => c.platform)
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get connection stats', { error, organizationId });
      throw error;
    }
  }

  /**
   * Platform-specific token refresh implementation
   */
  private async performTokenRefresh(platform: string, refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null> {
    switch (platform) {
      case 'facebook':
      case 'instagram':
        return this.refreshFacebookToken(refreshToken);
      case 'twitter':
        return this.refreshTwitterToken(refreshToken);
      case 'linkedin':
        return this.refreshLinkedInToken(refreshToken);
      case 'google':
      case 'youtube':
        return this.refreshGoogleToken(refreshToken);
      default:
        logger.warn('Token refresh not implemented for platform', { platform });
        return null;
    }
  }

  private async refreshFacebookToken(refreshToken: string) {
    // Facebook token refresh implementation
    // This would make actual API calls to Facebook
    return null; // Placeholder
  }

  private async refreshTwitterToken(refreshToken: string) {
    // Twitter token refresh implementation
    return null; // Placeholder
  }

  private async refreshLinkedInToken(refreshToken: string) {
    // LinkedIn token refresh implementation
    return null; // Placeholder
  }

  private async refreshGoogleToken(refreshToken: string) {
    // Google token refresh implementation
    return null; // Placeholder
  }
}

export const socialMediaConnectionService = new SocialMediaConnectionService();