/**
 * Build Configuration and Environment Checks
 * ==========================================
 * Provides utilities to detect build-time vs runtime environments
 * and handle circular dependencies gracefully during builds
 */

export const isBuildTime = () => {
  return process.env.NODE_ENV === 'production' && 
    (process.env.NEXT_PHASE === 'phase-production-build' || 
     process.env.BUILDING === 'true' ||
     process.argv.includes('build'));
};

export const isStaticGeneration = () => {
  return typeof window === 'undefined' && isBuildTime();
};

/**
 * Creates a safe wrapper for API routes that may have circular dependencies
 * Returns a mock response during build time to prevent initialization issues
 */
export function createBuildSafeRoute<T>(
  routeHandler: T,
  mockResponse: any = { error: 'Route not available during build' }
): T {
  if (isStaticGeneration()) {
    // Return a mock function that throws during build
    return (() => {
      throw new Error('Route accessed during build time - this should not happen');
    }) as unknown as T;
  }
  
  return routeHandler;
}

/**
 * Creates a safe wrapper for modules that may have circular dependencies
 * Returns null during build time to prevent initialization issues
 */
export function createBuildSafeModule<T>(moduleFactory: () => T): T | null {
  if (isStaticGeneration()) {
    return null;
  }
  
  return moduleFactory();
}