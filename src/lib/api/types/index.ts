// Export all types for easy importing

// Common types
export * from './common';

// Auth types
export * from './auth';

// User types
export * from './users';

// Contact types
export * from './contacts';

// Campaign types
export * from './campaigns';

// AI types
export * from './ai';

// Communications types
export * from './communications';

// Notifications types
export * from './notifications';

// Subscriptions types
export * from './subscriptions';

// LeadPulse types
export * from './leadpulse';

// Re-export commonly used types with aliases for convenience
export type { ApiResponse as MarketSageApiResponse } from './common';
export type { User as MarketSageUser } from './auth';
export type { Campaign as MarketSageCampaign } from './campaigns';
export type { Contact as MarketSageContact } from './contacts';