// Export all shared types
export * from './auth';
export * from './api';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type Timestamp = Date | string;

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Feature flag types
export interface FeatureFlags {
  USE_NESTJS_AUTH: boolean;
  MCP_ENABLED: boolean;
  LEADPULSE_ENABLED: boolean;
  [key: string]: boolean;
}