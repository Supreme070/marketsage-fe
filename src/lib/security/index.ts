/**
 * Security Module Index
 * Exports all security-related utilities, types, and functions
 */

// Security types and interfaces
export * from './security-types';

// Security utilities and threat detection
export * from './security-utils';

// Security event logging
export * from './security-event-logger';

// Re-export commonly used functions for convenience
export {
  getIPLocation,
  detectThreats,
  calculateSecurityScore,
  isIPBlocked,
  getSecurityTrends
} from './security-utils';

export {
  securityEventLogger,
  logFailedLogin,
  logSuccessfulLogin,
  logRateLimitExceeded,
  logSuspiciousActivity,
  logSQLInjectionAttempt,
  logXSSAttempt,
  logUnauthorizedAccess,
  logDataBreachAttempt,
  logAPIAbuse
} from './security-event-logger';