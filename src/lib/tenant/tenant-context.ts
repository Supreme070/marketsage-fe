/**
 * Tenant Context Management
 * Provides utilities for managing tenant context across the application
 */

import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Get the current tenant ID from various sources
 * Priority: 1. Headers, 2. Session, 3. Environment
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    // Method 1: Try to get from request headers (set by middleware)
    try {
      const headersList = headers();
      const tenantId = headersList.get('x-tenant-id');
      if (tenantId) {
        return tenantId;
      }
    } catch (error) {
      // Headers might not be available in all contexts
    }

    // Method 2: Try to get from session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.organizationId) {
        return session.user.organizationId;
      }
    } catch (error) {
      // Session might not be available in all contexts
    }

    // Method 3: Development fallback
    if (process.env.NODE_ENV === 'development') {
      return process.env.DEV_TENANT_ID || 'dev-org-1';
    }

    return null;
  } catch (error) {
    console.warn('Could not determine tenant context:', error);
    return null;
  }
}

/**
 * Validate that a user has access to a specific tenant
 */
export async function validateTenantAccess(tenantId: string): Promise<boolean> {
  try {
    const currentTenantId = await getCurrentTenantId();
    return currentTenantId === tenantId;
  } catch (error) {
    console.error('Tenant access validation failed:', error);
    return false;
  }
}

/**
 * Get tenant context for API routes
 * Returns both tenant ID and validation status
 */
export async function getTenantContext(): Promise<{
  tenantId: string | null;
  isValid: boolean;
  source: 'headers' | 'session' | 'development' | 'none';
}> {
  // Try headers first (most reliable for API routes)
  try {
    const headersList = headers();
    const tenantId = headersList.get('x-tenant-id');
    if (tenantId) {
      return { tenantId, isValid: true, source: 'headers' };
    }
  } catch (error) {
    // Headers not available
  }

  // Try session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.organizationId) {
      return { 
        tenantId: session.user.organizationId, 
        isValid: true, 
        source: 'session' 
      };
    }
  } catch (error) {
    // Session not available
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    const devTenantId = process.env.DEV_TENANT_ID || 'dev-org-1';
    return { 
      tenantId: devTenantId, 
      isValid: true, 
      source: 'development' 
    };
  }

  return { tenantId: null, isValid: false, source: 'none' };
}

/**
 * Middleware helper to extract tenant ID from request
 * Used in database middleware where Next.js headers() is not available
 */
export function extractTenantIdFromEnvironment(): string | null {
  // This can be set by our middleware using process.env
  return process.env.CURRENT_TENANT_ID || null;
}

/**
 * Set tenant context in environment (used by middleware)
 * This is a temporary solution - can be enhanced with AsyncLocalStorage
 */
export function setTenantContext(tenantId: string): void {
  process.env.CURRENT_TENANT_ID = tenantId;
}

/**
 * Clear tenant context
 */
export function clearTenantContext(): void {
  delete process.env.CURRENT_TENANT_ID;
}