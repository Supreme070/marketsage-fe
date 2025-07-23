import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  userEmail?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(entry: AuditLogEntry) {
  try {
    // Get request headers for IP and user agent
    const headersList = headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Create audit log entry
    await prisma.leadPulseAuditLog.create({
      data: {
        ...entry,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - we don't want audit logging failures to break the main operation
  }
}

/**
 * Log a data change with before/after values
 */
export async function logDataChange(
  userId: string,
  userEmail: string,
  resource: string,
  resourceId: string,
  before: any,
  after: any,
  metadata?: Record<string, any>
) {
  await logAdminAction({
    action: "UPDATE",
    resource,
    resourceId,
    userId,
    userEmail,
    changes: { before, after },
    metadata,
  });
}

/**
 * Log a system configuration change
 */
export async function logSystemChange(
  userId: string,
  userEmail: string,
  configType: string,
  configId: string,
  changes: any,
  metadata?: Record<string, any>
) {
  await logAdminAction({
    action: "CONFIG_CHANGE",
    resource: "system",
    resourceId: `${configType}:${configId}`,
    userId,
    userEmail,
    changes,
    metadata,
  });
}

/**
 * Log a permission change
 */
export async function logPermissionChange(
  adminId: string,
  adminEmail: string,
  targetUserId: string,
  targetUserEmail: string,
  oldRole: string,
  newRole: string,
  metadata?: Record<string, any>
) {
  await logAdminAction({
    action: "PERMISSION_CHANGE",
    resource: "user",
    resourceId: targetUserId,
    userId: adminId,
    userEmail: adminEmail,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    metadata: {
      ...metadata,
      targetUserEmail,
    },
  });
}

/**
 * Log an access event (login/logout)
 */
export async function logAccessEvent(
  userId: string,
  userEmail: string,
  action: "LOGIN" | "LOGOUT",
  metadata?: Record<string, any>
) {
  await logAdminAction({
    action,
    resource: "session",
    resourceId: userId,
    userId,
    userEmail,
    metadata,
  });
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  userId?: string,
  userEmail?: string
) {
  await logAdminAction({
    action: "SECURITY_EVENT",
    resource: "security",
    resourceId: eventType,
    userId,
    userEmail,
    metadata: details,
  });
}

/**
 * Helper to create a middleware for automatic audit logging
 */
export function withAuditLogging<T extends (...args: any[]) => Promise<any>>(
  action: string,
  resource: string,
  getResourceId: (args: Parameters<T>) => string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let success = false;
    let error: any = null;

    try {
      const result = await handler(...args);
      success = true;
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      // Log the action
      try {
        const resourceId = getResourceId(args);
        await logAdminAction({
          action,
          resource,
          resourceId,
          metadata: {
            duration: Date.now() - startTime,
            success,
            error: error?.message,
          },
        });
      } catch (logError) {
        console.error("Failed to log audit event:", logError);
      }
    }
  }) as T;
}