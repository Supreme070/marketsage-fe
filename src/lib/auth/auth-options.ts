import type { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authRateLimiter } from '@/lib/security/auth-rate-limiter';

// Extend NextAuth types for our custom fields
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    organizationId: string;
    organizationName: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      organizationName: string;
    } & DefaultSession['user'];
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    organizationName: string;
    accessToken?: string;
  }
}

// Production-ready authentication configuration with tenant support
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Validate credentials are provided
        if (!credentials?.email || !credentials?.password) {
          console.warn('Authentication failed: Missing credentials');
          return null;
        }

        // Check authentication rate limiting
        const clientIP = req?.headers?.['x-forwarded-for'] || 
                        req?.headers?.['x-real-ip'] || 
                        'unknown';
        const identifier = `${clientIP}:${credentials.email}`;
        const rateLimitResult = authRateLimiter.check(identifier, '/api/auth/signin');
        
        if (!rateLimitResult.allowed) {
          console.warn(`Authentication rate limited for ${credentials.email} from ${clientIP}`);
          return null;
        }

        try {
          // Use frontend proxy for authentication
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2'}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            // Record failed attempt for rate limiting
            authRateLimiter.recordFailedAttempt(identifier, '/api/auth/signin');
            console.warn('Authentication failed: Invalid credentials', { email: credentials.email });
            return null;
          }

          const result = await response.json();
          
          if (!result.success || !result.data?.user) {
            authRateLimiter.recordFailedAttempt(identifier, '/api/auth/signin');
            console.warn('Authentication failed: Invalid response from backend', { email: credentials.email });
            return null;
          }

          const user = result.data.user;
          const accessToken = result.data.token || result.token;

          // Record successful attempt (clears rate limit)
          authRateLimiter.recordSuccessfulAttempt(identifier, '/api/auth/signin');

          // Return user with tenant context and access token
          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || 'default-org-migration',
            organizationName: user.organizationName || 'Default Organization',
            accessToken: accessToken,
          };
          
          console.log('Authorize callback - returning user:', userData);
          return userData;

        } catch (error) {
          console.error('Authentication error:', error);
          
          // SECURITY: No fallbacks allowed in any environment
          // All authentication must go through proper database validation
          
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user);
      console.log('JWT callback - token:', token);
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.accessToken = (user as any).accessToken;
        console.log('JWT callback - updated token:', token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      console.log('Session callback - session:', session);
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.accessToken = token.accessToken as string;
        console.log('Session callback - updated session:', session);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}; 