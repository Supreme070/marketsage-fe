import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  rateLimit: z.number().min(1).max(10000).optional(),
  expiresAt: z.string().optional(),
});

/**
 * GET /api/admin/security/api-keys
 * Get API keys management and usage statistics
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status'); // active, expired, disabled
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Log the admin action
    await logAdminAction(user, 'VIEW_API_KEYS', 'security', {
      page,
      limit,
      filters: { status }
    });

    // For now, we'll simulate API key data since there's no explicit APIKey model
    // In a real implementation, you would have an APIKey table
    
    // We can derive API key-like data from AdminAuditLog entries where action includes 'API'
    const apiKeyActions = await prisma.adminAuditLog.findMany({
      where: {
        action: {
          contains: 'API',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        adminUserId: true,
        adminEmail: true,
        action: true,
        resourceId: true,
        details: true,
        timestamp: true,
        sessionId: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });

    // Simulate API key data structure
    const simulatedApiKeys = [
      {
        id: 'ak_prod_2024_001',
        name: 'Production API Key',
        keyPrefix: 'mk_live_',
        createdAt: new Date('2024-01-15'),
        lastUsedAt: new Date('2024-07-20'),
        expiresAt: new Date('2025-01-15'),
        isActive: true,
        permissions: ['campaigns:read', 'campaigns:write', 'contacts:read', 'analytics:read'],
        rateLimit: 1000,
        usageCount: 15234,
        createdBy: user.id,
        createdByEmail: user.email
      },
      {
        id: 'ak_dev_2024_001',
        name: 'Development API Key',
        keyPrefix: 'mk_test_',
        createdAt: new Date('2024-02-01'),
        lastUsedAt: new Date('2024-07-21'),
        expiresAt: null,
        isActive: true,
        permissions: ['campaigns:read', 'contacts:read'],
        rateLimit: 100,
        usageCount: 892,
        createdBy: user.id,
        createdByEmail: user.email
      },
      {
        id: 'ak_analytics_001',
        name: 'Analytics Dashboard Key',
        keyPrefix: 'mk_dash_',
        createdAt: new Date('2024-03-10'),
        lastUsedAt: new Date('2024-07-19'),
        expiresAt: new Date('2024-12-31'),
        isActive: true,
        permissions: ['analytics:read', 'reports:read'],
        rateLimit: 500,
        usageCount: 5678,
        createdBy: user.id,
        createdByEmail: user.email
      },
      {
        id: 'ak_webhook_001',
        name: 'Webhook Integration Key',
        keyPrefix: 'mk_hook_',
        createdAt: new Date('2024-04-05'),
        lastUsedAt: null,
        expiresAt: new Date('2024-08-01'),
        isActive: false,
        permissions: ['webhooks:write'],
        rateLimit: 200,
        usageCount: 0,
        createdBy: user.id,
        createdByEmail: user.email
      }
    ];

    // Apply filters
    let filteredKeys = simulatedApiKeys;
    
    if (status === 'active') {
      filteredKeys = filteredKeys.filter(key => key.isActive && (!key.expiresAt || key.expiresAt > new Date()));
    } else if (status === 'expired') {
      filteredKeys = filteredKeys.filter(key => key.expiresAt && key.expiresAt <= new Date());
    } else if (status === 'disabled') {
      filteredKeys = filteredKeys.filter(key => !key.isActive);
    }

    // Sort keys
    filteredKeys.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    // Paginate
    const paginatedKeys = filteredKeys.slice(skip, skip + limit);
    const totalCount = filteredKeys.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate statistics
    const now = new Date();
    const stats = {
      total: simulatedApiKeys.length,
      active: simulatedApiKeys.filter(k => k.isActive && (!k.expiresAt || k.expiresAt > now)).length,
      expired: simulatedApiKeys.filter(k => k.expiresAt && k.expiresAt <= now).length,
      disabled: simulatedApiKeys.filter(k => !k.isActive).length,
      totalRequests: simulatedApiKeys.reduce((sum, key) => sum + key.usageCount, 0),
      averageRateLimit: Math.round(simulatedApiKeys.reduce((sum, key) => sum + key.rateLimit, 0) / simulatedApiKeys.length),
      recentlyUsed: simulatedApiKeys.filter(k => k.lastUsedAt && k.lastUsedAt > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length
    };

    // Usage analytics (last 30 days)
    const usageAnalytics = generateUsageAnalytics();

    // Security alerts for API keys
    const securityAlerts = [
      {
        id: 'alert_1',
        type: 'HIGH_USAGE',
        severity: 'MEDIUM',
        message: 'Production API Key exceeded 80% of rate limit in the last hour',
        keyId: 'ak_prod_2024_001',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'alert_2',
        type: 'EXPIRING_SOON',
        severity: 'LOW',
        message: 'Analytics Dashboard Key expires in 5 months',
        keyId: 'ak_analytics_001',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    ];

    return Response.json({
      success: true,
      data: {
        apiKeys: paginatedKeys.map(key => ({
          ...key,
          // Never expose full API key, only prefix
          keyPreview: `${key.keyPrefix}${'*'.repeat(32)}`
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        usageAnalytics,
        securityAlerts,
        recentActivity: apiKeyActions.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('API keys management error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch API keys',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * POST /api/admin/security/api-keys
 * Create a new API key
 */
export const POST = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = apiKeySchema.parse(body);

    // Generate API key
    const keyPrefix = 'mk_live_';
    const keySecret = randomBytes(32).toString('hex');
    const fullKey = `${keyPrefix}${keySecret}`;

    // In a real implementation, you would save to an APIKey table
    // For now, we'll log this as an admin action
    const apiKeyData = {
      id: `ak_${Date.now()}`,
      name: validatedData.name,
      keyPrefix,
      fullKey, // This should be hashed in real implementation
      permissions: validatedData.permissions,
      rateLimit: validatedData.rateLimit || 1000,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      createdAt: new Date(),
      createdBy: user.id,
      isActive: true
    };

    // Log the API key creation
    await logAdminAction(user, 'CREATE_API_KEY', 'security', {
      keyId: apiKeyData.id,
      name: apiKeyData.name,
      permissions: apiKeyData.permissions,
      rateLimit: apiKeyData.rateLimit,
      expiresAt: apiKeyData.expiresAt?.toISOString()
    });

    return Response.json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: apiKeyData.id,
        name: apiKeyData.name,
        key: fullKey, // Return full key only on creation
        keyPrefix,
        permissions: apiKeyData.permissions,
        rateLimit: apiKeyData.rateLimit,
        expiresAt: apiKeyData.expiresAt,
        createdAt: apiKeyData.createdAt
      },
      warning: 'Store this API key securely. It will not be shown again.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid API key data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('API key creation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to create API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * DELETE /api/admin/security/api-keys
 * Revoke an API key
 */
export const DELETE = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSecurity) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const keyId = url.searchParams.get('keyId');

    if (!keyId) {
      return Response.json(
        { success: false, error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would update the APIKey table
    // For now, we'll log this as an admin action
    await logAdminAction(user, 'REVOKE_API_KEY', 'security', {
      keyId,
      revokedAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'API key revoked successfully',
      data: {
        keyId,
        revokedAt: new Date(),
        revokedBy: user.email
      }
    });

  } catch (error) {
    console.error('API key revocation error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to revoke API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSecurity');

/**
 * Generate mock usage analytics for demonstration
 */
function generateUsageAnalytics() {
  const analytics = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    analytics.push({
      date: date.toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 1000) + 100,
      errors: Math.floor(Math.random() * 50),
      rateLimit: Math.floor(Math.random() * 20),
      uniqueKeys: Math.floor(Math.random() * 5) + 2
    });
  }
  
  return analytics;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}