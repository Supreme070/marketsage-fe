import type { FeatureFlags } from '@/shared/types';

/**
 * Feature flags configuration utility
 * Provides centralized feature flag management
 */

class FeatureFlagsManager {
  private flags: FeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): FeatureFlags {
    return {
      USE_NESTJS_AUTH: process.env.USE_NESTJS_AUTH === 'true',
      MCP_ENABLED: process.env.MCP_ENABLED === 'true',
      LEADPULSE_ENABLED: process.env.LEADPULSE_ENABLED !== 'false', // Default to true
    };
  }

  /**
   * Get all feature flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a specific feature flag is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }

  /**
   * Get NestJS backend URL if NestJS auth is enabled
   */
  getNestJSBackendURL(): string | null {
    if (!this.isEnabled('USE_NESTJS_AUTH')) {
      return null;
    }
    return process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
  }

  /**
   * Reload flags from environment (useful for dynamic updates)
   */
  reload(): void {
    this.flags = this.loadFlags();
  }

  /**
   * Get environment-specific defaults
   */
  getEnvironmentDefaults(): Partial<FeatureFlags> {
    const env = process.env.NODE_ENV;
    
    switch (env) {
      case 'production':
        return {
          USE_NESTJS_AUTH: false, // Conservative default for production
          MCP_ENABLED: true,
          LEADPULSE_ENABLED: true,
        };
      
      case 'staging':
        return {
          USE_NESTJS_AUTH: true, // Test in staging
          MCP_ENABLED: true,
          LEADPULSE_ENABLED: true,
        };
      
      default: // development
        return {
          USE_NESTJS_AUTH: false, // Gradual rollout in dev
          MCP_ENABLED: true,
          LEADPULSE_ENABLED: true,
        };
    }
  }

  /**
   * Log current feature flag status (for debugging)
   */
  debug(): void {
    console.log('🏁 Feature Flags Status:');
    Object.entries(this.flags).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });
    
    if (this.isEnabled('USE_NESTJS_AUTH')) {
      console.log(`  🔗 NestJS Backend: ${this.getNestJSBackendURL()}`);
    }
  }
}

// Singleton instance
const featureFlags = new FeatureFlagsManager();

export default featureFlags;

// Named exports for convenience
export const isFeatureEnabled = (flag: keyof FeatureFlags) => featureFlags.isEnabled(flag);
export const getAllFeatureFlags = () => featureFlags.getAll();
export const getNestJSBackendURL = () => featureFlags.getNestJSBackendURL();

// Environment check helpers
export const useNestJSAuth = () => featureFlags.isEnabled('USE_NESTJS_AUTH');
export const useMCP = () => featureFlags.isEnabled('MCP_ENABLED');
export const useLeadPulse = () => featureFlags.isEnabled('LEADPULSE_ENABLED');