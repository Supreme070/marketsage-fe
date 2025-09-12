/**
 * Logout Handler
 * ==============
 * 
 * Utility to handle logout properly by cleaning up both
 * NextAuth session and API client tokens
 */

import { signOut } from 'next-auth/react';

/**
 * Comprehensive logout that cleans up all authentication state
 */
export async function logout(redirectTo?: string): Promise<void> {
  try {
    // Sign out from NextAuth (this will clear the session)
    await signOut({ 
      redirect: true,
      callbackUrl: redirectTo || '/login'
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo || '/login';
    }
  }
}

/**
 * Server-side logout handler
 */
export async function serverLogout(userId?: string): Promise<void> {
  try {
    if (userId) {
      // Call backend to invalidate session
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'}/api/v2/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        console.warn('Backend logout failed, continuing with cleanup');
      }
    }
  } catch (error) {
    console.error('Server logout error:', error);
  }
}

export default logout;