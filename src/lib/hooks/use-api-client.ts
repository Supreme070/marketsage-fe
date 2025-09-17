/**
 * Session-aware API Client Hook
 * =============================
 * 
 * React hook that provides an API client instance that automatically
 * uses the current NextAuth session token for authenticated requests
 */

import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api/client';

export function useApiClient() {
  const { data: session, status } = useSession();

  // Create a memoized API client instance
  const client = useMemo(() => {
    return apiClient;
  }, []);

  // Update the token whenever the session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      client.setToken(session.accessToken);
    } else if (status === 'unauthenticated') {
      client.clearToken();
    }
  }, [session, status, client]);

  return {
    client,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session,
  };
}

export default useApiClient;