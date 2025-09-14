/**
 * Session utilities for Next.js App Router
 * Provides consistent session retrieval across the application
 */

import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken?: string;
  organizationId?: string;
}

/**
 * Get the current session using Next.js App Router compatible method
 * @returns Promise<SessionData | null>
 */
export async function getAppRouterSession(): Promise<SessionData | null> {
  try {
    const cookieStore = cookies();
    
    // Get NextAuth session token from cookies
    const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                        cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Decode the session token to get user info
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return null;
    }

    return {
      user: {
        id: token.sub || '',
        email: token.email || '',
        name: token.name || '',
        role: token.role || 'USER',
      },
      accessToken: token.accessToken as string,
      organizationId: token.organizationId as string,
    };
  } catch (error) {
    console.error('[Session Utils] Error retrieving session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAppRouterSession();
  return !!session?.user;
}

/**
 * Get the current user's access token
 * @returns Promise<string | null>
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getAppRouterSession();
  return session?.accessToken || null;
}

/**
 * Get the current user's role
 * @returns Promise<string | null>
 */
export async function getUserRole(): Promise<string | null> {
  const session = await getAppRouterSession();
  return session?.user?.role || null;
}

