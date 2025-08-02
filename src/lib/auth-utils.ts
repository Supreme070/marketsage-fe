/**
 * Authentication Utilities
 * ========================
 * 
 * Utility functions to help with authentication, session management,
 * and token synchronization between NextAuth and the API client
 */

import type { Session } from 'next-auth';
import { apiClient } from './api-client';

/**
 * Synchronize API client token with NextAuth session
 */
export function syncApiClientToken(session: Session | null): void {
  if (session?.accessToken) {
    apiClient.setToken(session.accessToken);
  } else {
    apiClient.clearToken();
  }
}

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null, requiredRole: string | string[]): boolean {
  if (!session?.user?.role) return false;
  
  const userRole = session.user.role;
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return roles.includes(userRole);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN']);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return hasRole(session, 'SUPER_ADMIN');
}

/**
 * Get user's organization ID from session
 */
export function getOrganizationId(session: Session | null): string | null {
  return session?.organizationId || null;
}

/**
 * Create authorization headers for server-side requests
 */
export function createAuthHeaders(session: Session | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  if (session?.organizationId) {
    headers['x-tenant-id'] = session.organizationId;
  }

  return headers;
}

/**
 * Validate session and refresh if needed
 */
export async function validateAndRefreshSession(session: Session | null): Promise<boolean> {
  if (!session?.accessToken) {
    return false;
  }

  try {
    // Use the API client to verify token with backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'}/api/v2/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result.success && result.data?.valid;
    }

    return false;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
}

/**
 * Get user display name from session
 */
export function getUserDisplayName(session: Session | null): string {
  if (!session?.user) return 'Guest';
  
  return session.user.name || session.user.email || 'User';
}

/**
 * Get user avatar/image from session
 */
export function getUserAvatar(session: Session | null): string | null {
  return session?.user?.image || null;
}

/**
 * Check if session is expired (basic check)
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  // NextAuth handles token expiration internally
  // This is a placeholder for additional custom logic if needed
  return false;
}

/**
 * Extract user permissions from session (if implemented in backend)
 */
export function getUserPermissions(session: Session | null): string[] {
  // This would need to be implemented based on your permission system
  // For now, return basic permissions based on role
  
  if (!session?.user?.role) return [];
  
  const role = session.user.role;
  
  switch (role) {
    case 'SUPER_ADMIN':
      return ['*']; // All permissions
    case 'ADMIN':
      return ['users.read', 'users.create', 'users.update', 'campaigns.read', 'campaigns.create'];
    case 'IT_ADMIN':
      return ['system.read', 'system.update', 'api.read', 'database.read'];
    case 'USER':
    default:
      return ['profile.read', 'profile.update'];
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(session: Session | null, permission: string): boolean {
  const permissions = getUserPermissions(session);
  
  // Super admin has all permissions
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
}