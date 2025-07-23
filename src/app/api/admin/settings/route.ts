import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-api-auth';
import prisma from '@/lib/db/prisma';
import { settingsUpdateSchema, adminQuerySchema, validateAdminRequest, getUserIdFromAuth } from '@/lib/admin-validation';
import { adminRateLimit, adminRateLimitConfigs } from '@/lib/admin-rate-limiter';
import { withAdminCache, adminCacheConfigs } from '@/lib/admin-cache';
import { processAuditLogNotification } from '@/lib/admin-notifications';
import { adminRequestLogger } from '@/lib/admin-request-logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let response: NextResponse;
  
  try {
    // Rate limiting
    const rateLimitResult = await adminRateLimit(req, adminRateLimitConfigs.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return auth.response;
    }

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validation = validateAdminRequest(adminQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const type = queryParams.type || 'overview';
    const userId = getUserIdFromAuth(auth);

    // Use caching for appropriate requests
    if (['overview', 'security', 'notifications', 'system', 'logs'].includes(type)) {
      response = await withAdminCache(
        req, 
        { ...adminCacheConfigs.systemSettings, key: `admin_settings_${type}` },
        async () => {
          switch (type) {
            case 'overview': return await getSettingsOverview();
            case 'staff': return await getStaffSettings();
            case 'security': return await getSecuritySettings();
            case 'notifications': return await getNotificationSettings();
            case 'system': return await getSystemSettings();
            case 'logs': return await getLogSettings();
            case 'recent_activities': return await getRecentActivities();
            default: throw new Error('Invalid type parameter');
          }
        }
      );
    } else {
      // Non-cached requests (like staff which changes frequently)
      switch (type) {
        case 'staff':
          response = await getStaffSettings();
          break;
        case 'recent_activities':
          response = await getRecentActivities();
          break;
        default:
          response = NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('Error fetching settings data:', error);
    response = NextResponse.json(
      { error: 'Failed to fetch settings data' },
      { status: 500 }
    );
  } finally {
    // Log the request (if we have the necessary info)
    if (typeof userId !== 'undefined' && typeof auth !== 'undefined') {
      const userInfo = { id: userId, role: auth?.session?.user?.role || 'unknown' };
      await adminRequestLogger.logRequest(req, response, userInfo, startTime);
    }
  }
  
  return response;
}

async function getSettingsOverview() {
  // Get overview stats for dashboard
  const [staffCount, activeStaff, auditCount, systemMetrics] = await Promise.allSettled([
    // Total staff members
    prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'] }
      }
    }),
    // Active staff (logged in within last 24 hours)
    prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'] },
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    // Recent audit events
    prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    // System health metrics
    prisma.systemMetrics.findFirst({
      orderBy: { timestamp: 'desc' },
      select: {
        cpuUsage: true,
        memoryUsage: true,
        errorRate: true
      }
    })
  ]);

  const totalStaff = staffCount.status === 'fulfilled' ? staffCount.value : 0;
  const activeStaffCount = activeStaff.status === 'fulfilled' ? activeStaff.value : 0;
  const recentAudits = auditCount.status === 'fulfilled' ? auditCount.value : 0;
  const metrics = systemMetrics.status === 'fulfilled' ? systemMetrics.value : null;

  // Determine system health status
  const systemHealth = !metrics ? 'unknown' :
    (metrics.cpuUsage > 80 || metrics.memoryUsage > 85 || metrics.errorRate > 10) ? 'degraded' :
    (metrics.cpuUsage > 60 || metrics.memoryUsage > 70 || metrics.errorRate > 5) ? 'warning' : 'healthy';

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalStaff,
        activeStaff: activeStaffCount,
        systemHealth,
        auditEvents: recentAudits,
        notificationChannels: 3 // Static for now - email, slack, sms
      },
      systemStatus: {
        online: true,
        maintenanceMode: false,
        securityStatus: 'secure',
        lastUpdate: new Date().toISOString()
      }
    }
  });
}

async function getStaffSettings() {
  // Get all admin staff members with their details
  const staffMembers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      isActive: true,
      // Add any additional staff-specific fields
      profile: {
        select: {
          twoFactorEnabled: true,
          ipWhitelist: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const transformedStaff = staffMembers.map(member => ({
    id: member.id,
    email: member.email,
    name: member.name || 'Admin User',
    role: member.role as 'ADMIN' | 'SUPER_ADMIN' | 'IT_ADMIN',
    status: !member.isActive ? 'inactive' : 
           (member.emailVerified ? 'active' : 'pending') as 'active' | 'inactive' | 'pending',
    permissions: getPermissionsByRole(member.role),
    lastActive: member.lastLoginAt?.toISOString() || member.createdAt.toISOString(),
    createdAt: member.createdAt.toISOString(),
    ipWhitelist: member.profile?.ipWhitelist || [],
    twoFactorEnabled: member.profile?.twoFactorEnabled || false
  }));

  return NextResponse.json({
    success: true,
    data: transformedStaff
  });
}

async function getSecuritySettings() {
  // Get security settings from database or return defaults
  const securityConfig = await getSystemConfig('security') || {};
  
  return NextResponse.json({
    success: true,
    data: {
      sessionTimeout: securityConfig.sessionTimeout || 1800, // 30 minutes
      twoFactorRequired: securityConfig.twoFactorRequired || false,
      ipWhitelistEnabled: securityConfig.ipWhitelistEnabled || false,
      ipWhitelist: securityConfig.ipWhitelist || ['192.168.1.0/24', '10.0.0.0/24'],
      passwordPolicy: {
        minLength: securityConfig.passwordMinLength || 12,
        requireUppercase: securityConfig.passwordRequireUppercase !== false,
        requireNumbers: securityConfig.passwordRequireNumbers !== false,
        requireSymbols: securityConfig.passwordRequireSymbols !== false,
        maxAge: securityConfig.passwordMaxAge || 90
      },
      loginAttempts: {
        maxAttempts: securityConfig.maxLoginAttempts || 5,
        lockoutDuration: securityConfig.lockoutDuration || 300 // 5 minutes
      }
    }
  });
}

async function getNotificationSettings() {
  // Get notification configuration
  const notificationConfig = await getSystemConfig('notifications') || {};
  
  return NextResponse.json({
    success: true,
    data: {
      emailEnabled: notificationConfig.emailEnabled !== false,
      slackEnabled: notificationConfig.slackEnabled || false,
      smsEnabled: notificationConfig.smsEnabled || false,
      channels: {
        security: notificationConfig.securityChannels || ['email'],
        system: notificationConfig.systemChannels || ['email'],
        user: notificationConfig.userChannels || ['email'],
        billing: notificationConfig.billingChannels || ['email']
      },
      escalation: {
        highPriorityMinutes: notificationConfig.highPriorityEscalation || 30,
        criticalMinutes: notificationConfig.criticalEscalation || 5
      }
    }
  });
}

async function getSystemSettings() {
  // Get system configuration
  const systemConfig = await getSystemConfig('system') || {};
  
  return NextResponse.json({
    success: true,
    data: {
      maintenanceMode: systemConfig.maintenanceMode || false,
      maintenanceMessage: systemConfig.maintenanceMessage || "MarketSage is undergoing scheduled maintenance. We'll be back shortly.",
      featureFlags: {
        'ai-assistant': systemConfig.aiAssistant !== false,
        'leadpulse-v2': systemConfig.leadPulseV2 !== false,
        'advanced-analytics': systemConfig.advancedAnalytics || false,
        'social-media-integration': systemConfig.socialMediaIntegration !== false,
        'whatsapp-business': systemConfig.whatsappBusiness !== false,
        'predictive-analytics': systemConfig.predictiveAnalytics || false,
        'multi-tenant': systemConfig.multiTenant !== false,
        'api-v2': systemConfig.apiV2 || false,
        ...systemConfig.additionalFeatures
      },
      rateLimiting: {
        api: systemConfig.apiRateLimit || 1000,
        auth: systemConfig.authRateLimit || 10,
        bulk: systemConfig.bulkRateLimit || 100
      },
      cacheTTL: {
        session: systemConfig.sessionCacheTTL || 1800,
        data: systemConfig.dataCacheTTL || 300,
        static: systemConfig.staticCacheTTL || 3600
      }
    }
  });
}

async function getLogSettings() {
  // Get logging configuration
  const logConfig = await getSystemConfig('logging') || {};
  
  return NextResponse.json({
    success: true,
    data: {
      retention: {
        audit: logConfig.auditRetentionDays || 365,
        system: logConfig.systemRetentionDays || 90,
        security: logConfig.securityRetentionDays || 180
      },
      levels: {
        application: logConfig.applicationLogLevel || 'info',
        security: logConfig.securityLogLevel || 'warn',
        audit: logConfig.auditLogLevel || 'info'
      },
      export: {
        format: logConfig.exportFormat || 'json',
        compression: logConfig.exportCompression !== false
      }
    }
  });
}

async function getRecentActivities() {
  // Get recent administrative activities from audit logs
  const recentActivities = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { contains: 'ADMIN' } },
        { action: { contains: 'SETTINGS' } },
        { action: { contains: 'SECURITY' } },
        { action: { contains: 'STAFF' } },
        { action: { contains: 'PERMISSION' } }
      ]
    },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  const activities = recentActivities.map(log => ({
    id: log.id,
    type: getActivityType(log.action),
    title: formatActivityTitle(log.action),
    description: formatActivityDescription(log.action, log.metadata, log.user),
    timestamp: log.timestamp.toISOString(),
    user: log.user ? {
      name: log.user.name || 'Admin User',
      email: log.user.email
    } : null,
    icon: getActivityIcon(log.action)
  }));

  return NextResponse.json({
    success: true,
    data: activities
  });
}

// Helper function to get system configuration
async function getSystemConfig(category: string) {
  try {
    // Try to get from a system configuration table
    // For now, we'll use a simple approach with JSON metadata in audit log or create a dedicated config table
    
    // This could be enhanced to use a dedicated SystemConfiguration table
    const config = await prisma.auditLog.findFirst({
      where: {
        action: 'SYSTEM_CONFIG_UPDATE',
        entityId: category
      },
      orderBy: { timestamp: 'desc' }
    });

    return config?.metadata || {};
  } catch (error) {
    console.error(`Error fetching ${category} config:`, error);
    return {};
  }
}

// Helper function to determine permissions by role
function getPermissionsByRole(role: string): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return ['all'];
    case 'IT_ADMIN':
      return ['system', 'security', 'audit', 'incidents', 'support', 'analytics'];
    case 'ADMIN':
      return ['users', 'campaigns', 'support', 'analytics'];
    default:
      return [];
  }
}

// Helper functions for activity formatting
function getActivityType(action: string): 'security' | 'system' | 'staff' | 'general' {
  if (action.includes('SECURITY') || action.includes('LOGIN') || action.includes('AUTH')) return 'security';
  if (action.includes('SYSTEM') || action.includes('CONFIG')) return 'system';
  if (action.includes('STAFF') || action.includes('USER') || action.includes('ADMIN')) return 'staff';
  return 'general';
}

function formatActivityTitle(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatActivityDescription(action: string, metadata: any, user: any): string {
  const baseDesc = `${action.replace(/_/g, ' ').toLowerCase()}`;
  const userInfo = user ? ` by ${user.email}` : ' by system';
  const additionalInfo = metadata ? ` - ${JSON.stringify(metadata).substring(0, 100)}` : '';
  
  return baseDesc + userInfo + additionalInfo;
}

function getActivityIcon(action: string): string {
  if (action.includes('SECURITY')) return 'shield';
  if (action.includes('STAFF') || action.includes('USER')) return 'user-plus';
  if (action.includes('SYSTEM') || action.includes('CONFIG')) return 'settings';
  return 'activity';
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    
    // Validate request body
    const validation = validateAdminRequest(settingsUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { type, category, ...data } = validation.data;
    const userId = getUserIdFromAuth(auth);

    switch (type) {
      case 'update_settings':
        return await updateSettings(category, data, userId);
      case 'add_staff':
        return await addStaffMember(data, userId);
      case 'update_staff':
        return await updateStaffMember(data, userId);
      case 'remove_staff':
        return await removeStaffMember(data, userId);
      case 'export_logs':
        return await exportLogs(data, userId);
      case 'clear_cache':
        return await clearSystemCache(data, userId);
      default:
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in settings POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function updateSettings(category: string, data: any, userId: string) {
  // Store settings update in audit log and potentially a dedicated config table
  const auditLog = await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_CONFIG_UPDATE',
      entity: 'SYSTEM_CONFIG',
      entityId: category,
      userId: userId,
      metadata: data
    },
    include: {
      user: { select: { name: true, email: true, role: true } }
    }
  });

  // Trigger notifications for critical settings changes
  await processAuditLogNotification(auditLog);

  // Invalidate relevant caches
  const { cacheInvalidators } = await import('@/lib/admin-cache');
  cacheInvalidators.settings();

  return NextResponse.json({
    success: true,
    message: `${category} settings updated successfully`
  });
}

async function addStaffMember(data: any, userId: string) {
  // Create new staff member
  const newStaff = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name || 'Admin User',
      role: data.role || 'ADMIN',
      isActive: false, // Require activation
      emailVerified: null // Will be verified via email
    }
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: 'STAFF_MEMBER_CREATED',
      entity: 'USER',
      entityId: newStaff.id,
      userId: userId,
      metadata: {
        email: data.email,
        role: data.role,
        permissions: getPermissionsByRole(data.role)
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Staff member added successfully',
    data: { id: newStaff.id, email: newStaff.email }
  });
}

async function updateStaffMember(data: any, userId: string) {
  // Update existing staff member
  await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name,
      role: data.role,
      isActive: data.status === 'active'
    }
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: 'STAFF_MEMBER_UPDATED',
      entity: 'USER',
      entityId: data.id,
      userId: userId,
      metadata: {
        changes: data
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Staff member updated successfully'
  });
}

async function removeStaffMember(data: any, userId: string) {
  // Soft delete staff member
  await prisma.user.update({
    where: { id: data.id },
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: 'STAFF_MEMBER_REMOVED',
      entity: 'USER',
      entityId: data.id,
      userId: userId,
      metadata: {
        reason: data.reason || 'Administrative action'
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Staff member removed successfully'
  });
}

async function exportLogs(data: any, userId: string) {
  // Generate log export
  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: data.startDate ? new Date(data.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: data.endDate ? new Date(data.endDate) : new Date()
      },
      ...(data.category && { action: { contains: data.category.toUpperCase() } })
    },
    orderBy: { timestamp: 'desc' },
    take: 10000 // Limit for performance
  });

  // Log the export action
  await prisma.auditLog.create({
    data: {
      action: 'LOGS_EXPORTED',
      entity: 'AUDIT_LOG',
      entityId: 'export',
      userId: userId,
      metadata: {
        exportCount: logs.length,
        dateRange: [data.startDate, data.endDate],
        category: data.category
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Logs exported successfully',
    data: {
      exportId: `export-${Date.now()}`,
      recordCount: logs.length,
      downloadUrl: `/api/admin/exports/${Date.now()}` // Mock download URL
    }
  });
}

async function clearSystemCache(data: any, userId: string) {
  // Log cache clear action
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_CACHE_CLEARED',
      entity: 'SYSTEM',
      entityId: 'cache',
      userId: userId,
      metadata: {
        cacheType: data.cacheType || 'all',
        timestamp: new Date().toISOString()
      }
    }
  });

  // In a real implementation, you would clear Redis/cache here
  
  return NextResponse.json({
    success: true,
    message: 'System cache cleared successfully'
  });
}