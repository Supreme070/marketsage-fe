'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, MarketSageApiClient, type ApiClientConfig } from '../client';
import { ApiErrorBoundary } from '../components/ErrorBoundary';
import type { User } from '../types/auth';

interface ApiContextValue {
  client: MarketSageApiClient;
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

interface ApiProviderProps {
  children: React.ReactNode;
  config?: ApiClientConfig;
  enableErrorBoundary?: boolean;
}

export function ApiProvider({
  children,
  config,
  enableErrorBoundary = true,
}: ApiProviderProps) {
  const [client] = useState(() => {
    if (config) {
      return new MarketSageApiClient(config);
    }
    return apiClient;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const isAuth = await client.auth.isAuthenticated();
        setIsAuthenticated(isAuth);

        if (isAuth) {
          // Get user profile
          const profileResponse = await client.auth.getProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          }
        }
      } catch (err) {
        console.warn('Failed to initialize authentication:', err);
        setError(err as Error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [client]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.auth.login({ email, password });
      
      if (response.success && response.user && response.token) {
        setIsAuthenticated(true);
        setUser(response.user);
        
        // Store token if needed (for client-side usage)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.token);
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err as Error);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await client.auth.logout();
      
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear stored token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const isAuth = await client.auth.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const profileResponse = await client.auth.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err as Error);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: ApiContextValue = {
    client,
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    refreshAuth,
  };

  const providerContent = (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );

  if (enableErrorBoundary) {
    return (
      <ApiErrorBoundary
        onError={(error, errorInfo) => {
          console.error('API Provider Error:', error);
          console.error('Error Info:', errorInfo);
        }}
        fallback={(error) => (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Application Error
              </h2>
              <p className="text-gray-600 mb-4">
                Something went wrong with the API connection. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        )}
      >
        {providerContent}
      </ApiErrorBoundary>
    );
  }

  return providerContent;
}

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  
  return context;
}

// Custom hooks for specific functionality
export function useAuth() {
  const { isAuthenticated, user, loading, error, login, logout, refreshAuth } = useApi();
  
  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    refreshAuth,
  };
}

export function useApiClient() {
  const { client } = useApi();
  return client;
}

// Higher-order component for requiring authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        if (redirectTo) {
          window.location.href = redirectTo;
        } else if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }, [isAuthenticated, loading]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Higher-order component for role-based access
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[]
) {
  return function RoleProtectedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}