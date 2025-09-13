# MarketSage API Client Library

A comprehensive TypeScript API client library for the MarketSage backend, designed specifically for Next.js applications with support for both client-side and server-side usage.

## Features

- **Centralized API Client**: Single point of access to all backend services
- **Full TypeScript Support**: Complete type definitions for all API requests and responses
- **Authentication Handling**: Automatic token management and session handling
- **Error Handling**: Comprehensive error boundaries and graceful error recovery
- **Retry Logic**: Intelligent retry mechanisms with exponential backoff
- **Caching**: Built-in response caching with configurable TTL
- **Loading States**: React components and hooks for loading states
- **React Hooks**: Custom hooks for easy API integration
- **Circuit Breaker**: Prevents cascading failures
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Server-Side Support**: Works seamlessly with Next.js SSR/SSG

## Installation

The library is already included in your project at `/src/lib/api/`. No additional installation required.

## Quick Start

### Basic Usage

```typescript
import { apiClient } from '@/lib/api';

// Get all users
const users = await apiClient.users.getUsers();

// Create a new campaign
const campaign = await apiClient.campaigns.createCampaign({
  name: 'My Campaign',
  type: 'EMAIL',
  content: {
    subject: 'Hello World',
    textContent: 'This is my email content',
  },
  targetAudience: {
    segmentIds: ['segment-id'],
  },
});
```

### Using React Hooks

```typescript
import { useUsers, useCreateUser } from '@/lib/api';

function UsersList() {
  const { data: users, loading, error, refetch } = useUsers();
  const createUser = useCreateUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Using Context Provider

```typescript
import { ApiProvider, useAuth } from '@/lib/api';

function App() {
  return (
    <ApiProvider>
      <Dashboard />
    </ApiProvider>
  );
}

function Dashboard() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

## API Services

### Authentication Service

```typescript
import { apiClient } from '@/lib/api';

// Login
const loginResponse = await apiClient.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Register
const registerResponse = await apiClient.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
});

// Get profile
const profile = await apiClient.auth.getProfile();

// Verify token
const tokenStatus = await apiClient.auth.verifyToken();
```

### Users Service

```typescript
// Get paginated users
const users = await apiClient.users.getUsers(1, 10, 'search query');

// Get user by ID
const user = await apiClient.users.getUserById('user-id');

// Create user
const newUser = await apiClient.users.createUser({
  email: 'new@example.com',
  password: 'password123',
  name: 'New User',
});

// Update user
const updatedUser = await apiClient.users.updateUser('user-id', {
  name: 'Updated Name',
});

// Get user statistics
const stats = await apiClient.users.getUserStats('user-id');
```

### Contacts Service

```typescript
// Get contacts with filtering
const contacts = await apiClient.contacts.getContacts({
  page: 1,
  limit: 20,
  search: 'john',
  tags: ['vip', 'customer'],
});

// Create contact
const contact = await apiClient.contacts.createContact({
  email: 'contact@example.com',
  firstName: 'John',
  lastName: 'Doe',
  tags: ['lead'],
});

// Bulk update contacts
const result = await apiClient.contacts.bulkUpdateContacts(
  ['contact-1', 'contact-2'],
  { tags: ['updated'] }
);

// Import contacts
const importResult = await apiClient.contacts.importContacts({
  file: csvFile,
  mappings: { 'Email': 'email', 'Name': 'firstName' },
});
```

### Campaigns Service

```typescript
// Get campaigns
const campaigns = await apiClient.campaigns.getCampaigns({
  page: 1,
  limit: 10,
  type: 'EMAIL',
  status: 'DRAFT',
});

// Create campaign
const campaign = await apiClient.campaigns.createCampaign({
  name: 'Newsletter Campaign',
  type: 'EMAIL',
  content: {
    subject: 'Monthly Newsletter',
    htmlContent: '<h1>Hello World</h1>',
  },
  targetAudience: {
    segmentIds: ['segment-1'],
  },
});

// Send campaign
await apiClient.campaigns.sendCampaign('campaign-id');

// Get analytics
const analytics = await apiClient.campaigns.getCampaignAnalytics('campaign-id');

// Test campaign
const testResult = await apiClient.campaigns.testCampaign('campaign-id', {
  recipientEmails: ['test@example.com'],
});
```

### AI Service

```typescript
// Chat with AI
const chatResponse = await apiClient.ai.chat({
  message: 'Generate a marketing email',
  context: { audience: 'tech professionals' },
});

// Generate content
const content = await apiClient.ai.generateContent({
  type: 'email',
  prompt: 'Create a welcome email',
  tone: 'friendly',
  targetAudience: 'new subscribers',
});

// Get AI intelligence
const intelligence = await apiClient.ai.getIntelligence({
  query: 'What are my best performing campaigns?',
  scope: 'campaigns',
});

// Predictive analysis
const prediction = await apiClient.ai.runPredictiveAnalysis({
  analysisType: 'campaign_performance',
  dataScope: { campaignIds: ['campaign-1'] },
});

// Stream chat (real-time)
await apiClient.ai.streamChat(
  { message: 'Tell me about my campaigns' },
  (message) => console.log('Streaming:', message),
  (complete) => console.log('Complete:', complete)
);
```

## React Hooks

### Data Fetching Hooks

```typescript
import {
  useUsers,
  useUser,
  useContacts,
  useContact,
  useCampaigns,
  useCampaign,
} from '@/lib/api';

// Paginated data
const { data, loading, error, pagination, nextPage } = useUsers();

// Single resource
const { data: user, loading, error, refetch } = useUser('user-id');

// Infinite loading
const { data, loadNextPage, hasNextPage } = useInfiniteApi(
  (page, limit) => apiClient.contacts.getContacts({ page, limit })
);
```

### Mutation Hooks

```typescript
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useLogin,
  useRegister,
} from '@/lib/api';

const createUser = useCreateUser({
  onSuccess: (user) => console.log('User created:', user),
  onError: (error) => console.error('Failed to create user:', error),
});

// Usage
await createUser.mutate({
  email: 'new@example.com',
  name: 'New User',
  password: 'password123',
});
```

## Error Handling

### Error Boundary

```typescript
import { ApiErrorBoundary } from '@/lib/api';

function App() {
  return (
    <ApiErrorBoundary
      fallback={(error, resetError) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>Try Again</button>
        </div>
      )}
    >
      <MyApiComponent />
    </ApiErrorBoundary>
  );
}
```

### Loading States

```typescript
import { LoadingState, LoadingSpinner, Skeleton } from '@/lib/api';

function MyComponent() {
  const { data, loading, error } = useUsers();

  return (
    <LoadingState
      loading={loading}
      error={error}
      loadingComponent={<LoadingSpinner text="Loading users..." />}
    >
      <UsersList users={data} />
    </LoadingState>
  );
}

// Skeleton loading
function UserCard() {
  return (
    <div className="p-4 border rounded">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
```

### Higher-Order Components

```typescript
import { withAuth, withRole, withErrorBoundary, withLoadingState } from '@/lib/api';

// Require authentication
const ProtectedComponent = withAuth(MyComponent);

// Require specific role
const AdminComponent = withRole(MyComponent, ['ADMIN', 'SUPER_ADMIN']);

// Add error boundary
const SafeComponent = withErrorBoundary(MyComponent);

// Add loading states
const LoadableComponent = withLoadingState(MyComponent);
```

## Configuration

### Custom Client Configuration

```typescript
import { MarketSageApiClient } from '@/lib/api';

const customClient = new MarketSageApiClient({
  baseUrl: 'https://api.custom.com',
  timeout: 15000,
  retries: 5,
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 500,
  },
  rateLimit: {
    enabled: true,
    maxTokens: 200,
    refillRate: 20,
  },
  circuitBreaker: {
    enabled: true,
    threshold: 10,
    timeout: 120000,
  },
});
```

## Architecture

The API client uses a proxy pattern to communicate with the backend:

```
Frontend (localhost:3000) 
    ↓ /api/v2/* requests
Next.js Proxy Route (/api/v2/[[...path]]/route.ts)
    ↓ forwards to
NestJS Backend (localhost:3006)
```

This architecture provides:
- **Consistent API patterns** across the application
- **Proper authentication handling** through the proxy
- **Middleware support** for logging, rate limiting, etc.
- **Gradual migration** from frontend to backend APIs
- **CORS handling** and request transformation

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v2
API_TOKEN=your-server-side-token
```

## Advanced Usage

### Batch Operations

```typescript
import { apiClient } from '@/lib/api';

const results = await apiClient.batch([
  { operation: () => apiClient.users.getUsers() },
  { operation: () => apiClient.campaigns.getCampaigns() },
  { operation: () => apiClient.contacts.getContacts() },
], {
  concurrency: 3,
  failFast: false,
});
```

### Custom Retry Logic

```typescript
import { RetryManager } from '@/lib/api';

const retryManager = new RetryManager({
  maxRetries: 5,
  baseDelay: 2000,
  retryCondition: (error) => error.statusCode >= 500,
});

const result = await retryManager.execute(() => 
  apiClient.users.getUsers()
);
```

### Cache Management

```typescript
import { globalCache, CacheKeyGenerator } from '@/lib/api';

// Custom cache key
const key = CacheKeyGenerator.forUser('user-123', 'campaigns');

// Manual cache management
globalCache.getCache('users').set(key, userData, 60000); // 1 minute TTL
const cached = globalCache.getCache('users').get(key);

// Clear specific cache
apiClient.clearCache('users');

// Cleanup expired entries
const removed = apiClient.cleanupCache();
```

### Server-Side Usage

```typescript
// pages/api/users.ts or app/api/users/route.ts
import { apiClient } from '@/lib/api';

export async function GET() {
  try {
    const users = await apiClient.users.getUsers();
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Type Safety

All API responses are fully typed:

```typescript
import type {
  User,
  Campaign,
  Contact,
  ApiResponse,
  PaginatedResponse,
} from '@/lib/api';

// Strongly typed responses
const users: PaginatedResponse<User> = await apiClient.users.getUsers();
const campaign: Campaign = await apiClient.campaigns.getCampaignById('id');

// Type-safe error handling
try {
  await apiClient.auth.login({ email: '', password: '' });
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log(error.code, error.statusCode, error.details);
  }
}
```

## Best Practices

1. **Use the Context Provider** at the root of your app for authentication
2. **Leverage React Hooks** for component-level API calls
3. **Implement Error Boundaries** to gracefully handle API failures
4. **Use Loading States** to improve user experience
5. **Cache Frequently Accessed Data** to reduce API calls
6. **Implement Proper Error Handling** for all API calls
7. **Use TypeScript** to catch errors at compile time
8. **Monitor API Usage** with the built-in status methods

## Troubleshooting

### Authentication Issues

```typescript
// Check authentication status
const { isAuthenticated, user, error } = useAuth();

// Refresh authentication
const { refreshAuth } = useAuth();
await refreshAuth();

// Manual token verification
const tokenStatus = await apiClient.auth.verifyToken();
```

### Network Issues

```typescript
// Check API client status
const status = await apiClient.getStatus();
console.log('API Health:', status.healthy);
console.log('Circuit Breaker:', status.circuitBreaker);
console.log('Rate Limit:', status.rateLimit);
```

### Cache Issues

```typescript
// Clear all caches
apiClient.clearCache();

// Clear specific namespace
apiClient.clearCache('users');

// Check cache statistics
const stats = globalCache.getGlobalStats();
console.log('Cache Stats:', stats);
```

## Support

For issues and questions:

1. Check the console for detailed error messages
2. Verify environment variables are set correctly
3. Ensure the backend API is running and accessible
4. Check network connectivity and CORS settings
5. Review the TypeScript errors for type mismatches

The library includes comprehensive error logging and detailed error messages to help with debugging.