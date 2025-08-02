/**
 * Database Access Mode Controller
 * ===============================
 * 
 * Controls whether frontend uses direct database access or API-only mode
 * Enables gradual migration to microservices architecture
 */

// Environment-based feature flag for database access mode
const USE_API_ONLY_MODE = process.env.NEXT_PUBLIC_USE_API_ONLY === 'true' || false;

export const DATABASE_MODE = {
  API_ONLY: USE_API_ONLY_MODE,
  DIRECT_DB: !USE_API_ONLY_MODE,
} as const;

export type DatabaseMode = typeof DATABASE_MODE;

/**
 * Determines if the application should use API-only database access
 * Returns true when in microservices mode, false for direct database access
 */
export function useApiOnlyMode(): boolean {
  return DATABASE_MODE.API_ONLY;
}

/**
 * Determines if the application should use direct database access
 * Returns true for legacy mode, false when fully migrated to API-only
 */
export function useDirectDatabaseMode(): boolean {
  return DATABASE_MODE.DIRECT_DB;
}

/**
 * Conditional execution based on database access mode
 * Executes apiOnlyCallback when in API-only mode, directDbCallback otherwise
 */
export async function withDatabaseMode<T>(
  apiOnlyCallback: () => Promise<T>,
  directDbCallback: () => Promise<T>
): Promise<T> {
  if (useApiOnlyMode()) {
    return apiOnlyCallback();
  } else {
    return directDbCallback();
  }
}

/**
 * Log database access mode for debugging
 */
export function logDatabaseMode() {
  console.log(`[DATABASE MODE] Current mode: ${useApiOnlyMode() ? 'API-Only' : 'Direct Database'}`);
}

// Export constants for use in components
export const MIGRATION_FLAGS = {
  USE_API_ONLY_MODE,
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006',
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
} as const;