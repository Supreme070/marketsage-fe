/**
 * LeadPulse Authentication Middleware
 * 
 * Automatically processes authentication events to link visitors with authenticated users
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { leadPulseAuthIntegration } from './auth-integration';
import { logger } from '@/lib/logger';

export interface AuthEventContext {
  visitorFingerprint?: string;
  sessionId?: string;
  authMethod?: 'signin' | 'signup' | 'sso' | 'token_refresh';
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Middleware to process authentication events
 */
export async function processAuthenticationMiddleware(
  request: NextRequest,
  context: AuthEventContext = {}
): Promise<NextResponse> {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      // No authentication token, continue normally
      return NextResponse.next();
    }

    // Extract visitor fingerprint from cookies or headers
    const visitorFingerprint = context.visitorFingerprint || 
                              request.cookies.get('leadpulse_visitor_id')?.value ||
                              request.headers.get('x-leadpulse-visitor-id');

    if (!visitorFingerprint) {
      // No visitor fingerprint available, continue normally
      return NextResponse.next();
    }

    // Extract session ID
    const sessionId = context.sessionId || 
                     request.cookies.get('next-auth.session-token')?.value ||
                     'session_' + Date.now();

    // Determine authentication method from the request URL
    let authMethod: 'signin' | 'signup' | 'sso' | 'token_refresh' = 'signin';
    const pathname = request.nextUrl.pathname;
    
    if (pathname.includes('signup') || pathname.includes('register')) {
      authMethod = 'signup';
    } else if (pathname.includes('sso')) {
      authMethod = 'sso';
    } else if (pathname.includes('refresh')) {
      authMethod = 'token_refresh';
    }

    // Process authentication event asynchronously
    setTimeout(async () => {
      try {
        const result = await leadPulseAuthIntegration.processAuthenticationEvent(
          visitorFingerprint,
          sessionId,
          authMethod
        );

        logger.info('Authentication event processed via middleware', {
          visitorFingerprint,
          sessionId,
          authMethod,
          success: result.success,
          userId: token.sub
        });

      } catch (error) {
        logger.error('Failed to process authentication event in middleware', {
          error: error instanceof Error ? error.message : 'Unknown error',
          visitorFingerprint,
          sessionId,
          authMethod
        });
      }
    }, 0); // Process asynchronously to avoid blocking the request

    return NextResponse.next();

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pathname: request.nextUrl.pathname
    });

    // Don't block the request even if middleware fails
    return NextResponse.next();
  }
}

/**
 * Extract visitor fingerprint from request
 */
export function extractVisitorFingerprint(request: NextRequest): string | null {
  // Try multiple sources for visitor fingerprint
  const sources = [
    request.cookies.get('leadpulse_visitor_id')?.value,
    request.headers.get('x-leadpulse-visitor-id'),
    request.headers.get('x-visitor-fingerprint')
  ];

  return sources.find(source => source && source.length > 0) || null;
}

/**
 * Client-side authentication event handler
 */
export const clientAuthEventHandler = {
  /**
   * Process authentication event from client-side
   */
  async processAuthEvent(
    visitorFingerprint: string,
    authMethod: 'signin' | 'signup' | 'sso' | 'token_refresh' = 'signin'
  ): Promise<boolean> {
    try {
      const sessionId = 'session_' + Date.now();
      
      const response = await fetch('/api/v2/leadpulse/auth-integration?action=process-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorFingerprint,
          sessionId,
          authMethod
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Store authenticated visitor data in sessionStorage
          sessionStorage.setItem('leadpulse_authenticated_visitor', JSON.stringify(result.authenticatedVisitor));
          
          // Trigger custom event for other components
          window.dispatchEvent(new CustomEvent('leadpulse:authentication', {
            detail: { result }
          }));
          
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Client auth event handler error:', error);
      return false;
    }
  },

  /**
   * Track authenticated user action
   */
  async trackAction(
    visitorFingerprint: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/v2/leadpulse/auth-integration?action=track-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorFingerprint,
          action,
          metadata: {
            ...metadata,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      return result.success || false;

    } catch (error) {
      console.error('Track action error:', error);
      return false;
    }
  },

  /**
   * Get authenticated visitor data
   */
  async getAuthenticatedVisitor(visitorFingerprint: string): Promise<any> {
    try {
      // First check sessionStorage
      const cached = sessionStorage.getItem('leadpulse_authenticated_visitor');
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await fetch(`/api/v2/leadpulse/auth-integration?action=get-authenticated-visitor&visitorFingerprint=${visitorFingerprint}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.visitor) {
          // Cache in sessionStorage
          sessionStorage.setItem('leadpulse_authenticated_visitor', JSON.stringify(result.visitor));
          return result.visitor;
        }
      }

      return null;

    } catch (error) {
      console.error('Get authenticated visitor error:', error);
      return null;
    }
  }
};

/**
 * React hook for authentication integration
 */
export function useLeadPulseAuth() {
  const [authenticatedVisitor, setAuthenticatedVisitor] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Listen for authentication events
    const handleAuthEvent = (event: any) => {
      if (event.detail?.result?.authenticatedVisitor) {
        setAuthenticatedVisitor(event.detail.result.authenticatedVisitor);
      }
    };

    window.addEventListener('leadpulse:authentication', handleAuthEvent);
    
    return () => {
      window.removeEventListener('leadpulse:authentication', handleAuthEvent);
    };
  }, []);

  const processAuth = async (visitorFingerprint: string, authMethod?: 'signin' | 'signup' | 'sso' | 'token_refresh') => {
    setLoading(true);
    try {
      const success = await clientAuthEventHandler.processAuthEvent(visitorFingerprint, authMethod);
      return success;
    } finally {
      setLoading(false);
    }
  };

  const trackAction = async (visitorFingerprint: string, action: string, metadata?: Record<string, any>) => {
    return await clientAuthEventHandler.trackAction(visitorFingerprint, action, metadata);
  };

  const getAuthenticatedVisitor = async (visitorFingerprint: string) => {
    setLoading(true);
    try {
      const visitor = await clientAuthEventHandler.getAuthenticatedVisitor(visitorFingerprint);
      setAuthenticatedVisitor(visitor);
      return visitor;
    } finally {
      setLoading(false);
    }
  };

  return {
    authenticatedVisitor,
    loading,
    processAuth,
    trackAction,
    getAuthenticatedVisitor
  };
}

// Import React only if we're in a client environment
let React: any = null;
if (typeof window !== 'undefined') {
  React = require('react');
}