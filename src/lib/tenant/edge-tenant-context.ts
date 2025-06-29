/**
 * Edge Runtime Compatible Tenant Context
 * Simplified tenant context utilities for use in middleware (Edge Runtime)
 */

/**
 * Extract tenant ID from environment (used by database middleware)
 * This is safe for Edge Runtime as it doesn't use any Node.js specific APIs
 */
export function extractTenantIdFromEnvironment(): string | null {
  // This can be set by our middleware using process.env
  return process.env.CURRENT_TENANT_ID || null;
}

/**
 * Set tenant context in environment (used by middleware)
 * This is a temporary solution - can be enhanced with AsyncLocalStorage later
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

/**
 * Simple tenant ID validation (Edge Runtime safe)
 */
export function isValidTenantId(tenantId: string | null): boolean {
  if (!tenantId) return false;
  // Basic validation - should be a non-empty string
  return typeof tenantId === 'string' && tenantId.length > 0;
}