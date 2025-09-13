/**
 * MarketSage API Client Library
 * 
 * A comprehensive TypeScript API client for the MarketSage backend
 * Built for Next.js with support for both client-side and server-side usage
 * 
 * Features:
 * - Centralized API client with authentication
 * - TypeScript types for all requests/responses
 * - Retry logic and timeout handling
 * - Caching and performance optimization
 * - Error boundaries and loading states
 * - React hooks for easy integration
 * - Role-based access control
 * - Circuit breaker and rate limiting
 * 
 * @version 1.0.0
 */

// Main API client
export { MarketSageApiClient, apiClient } from './client';
export type { ApiClientConfig } from './client';

// Base client and error handling
export { BaseApiClient, ApiClientError } from './base/api-client';
export type { ApiResponse, RequestConfig, RetryConfig } from './base/api-client';

// Service classes
export { AuthService } from './services/auth.service';
export { UsersService } from './services/users.service';
export { ContactsService } from './services/contacts.service';
export { CampaignsService } from './services/campaigns.service';
export { AIService } from './services/ai.service';
export { CommunicationsService } from './services/communications.service';
export { NotificationsService } from './services/notifications.service';
export { SubscriptionsService } from './services/subscriptions.service';
export { WorkflowsService } from './services/workflows.service';

// TypeScript types
export * from './types';

// Utility classes
export {
  RetryManager,
  CircuitBreaker,
  RateLimiter,
  DEFAULT_RETRY_OPTIONS,
} from './utils/retry';

export {
  ApiCache,
  CacheManager,
  CacheKeyGenerator,
  globalCache,
  DEFAULT_CACHE_OPTIONS,
} from './utils/cache';

// React hooks
export * from './hooks';

// React components
export { ApiErrorBoundary, withErrorBoundary, useErrorHandler } from './components/ErrorBoundary';
export {
  LoadingSpinner,
  LoadingState,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  withLoadingState,
} from './components/LoadingSpinner';

// Context and providers
export {
  ApiProvider,
  useApi,
  useAuth,
  useApiClient,
  withAuth,
  withRole,
} from './context/ApiProvider';

// Convenience exports for common patterns
export const MarketSageAPI = {
  // Main client instance
  client: apiClient,
  
  // Quick access to services
  auth: apiClient.auth,
  users: apiClient.users,
  contacts: apiClient.contacts,
  campaigns: apiClient.campaigns,
  ai: apiClient.ai,
  communications: apiClient.communications,
  notifications: apiClient.notifications,
  subscriptions: apiClient.subscriptions,
  workflows: apiClient.workflows,
  
  // Utility methods
  clearCache: () => apiClient.clearCache(),
  getStatus: () => apiClient.getStatus(),
  
  // Configuration
  configure: (config: Partial<ApiClientConfig>) => apiClient.updateConfig(config),
};

// Default export for easy importing
export default MarketSageAPI;

/**
 * Usage Examples:
 * 
 * // Basic usage with default client
 * import { apiClient } from '@/lib/api';
 * const users = await apiClient.users.getUsers();
 * 
 * // Using React hooks
 * import { useUsers, useCreateUser } from '@/lib/api';
 * const { data: users, loading, error } = useUsers();
 * const createUser = useCreateUser();
 * 
 * // Using the context provider
 * import { ApiProvider, useAuth } from '@/lib/api';
 * function App() {
 *   return (
 *     <ApiProvider>
 *       <MyComponent />
 *     </ApiProvider>
 *   );
 * }
 * 
 * // Custom client configuration
 * import { MarketSageApiClient } from '@/lib/api';
 * const customClient = new MarketSageApiClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 10000,
 *   retries: 5,
 * });
 * 
 * // Error boundary usage
 * import { ApiErrorBoundary } from '@/lib/api';
 * <ApiErrorBoundary>
 *   <MyApiComponent />
 * </ApiErrorBoundary>
 * 
 * // Loading states
 * import { LoadingState } from '@/lib/api';
 * <LoadingState loading={loading} error={error}>
 *   <MyData data={data} />
 * </LoadingState>
 */