import type { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db/prisma';
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
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    organizationName: string;
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
          // Find user with organization data
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email,
              isActive: true // Only allow active users
            },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              organizationId: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  isActive: true
                }
              }
            }
          });

          // User not found or organization inactive
          if (!user || !user.organization?.isActive) {
            console.warn('Authentication failed: User not found or organization inactive', { email: credentials.email });
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch) {
            // Record failed attempt for rate limiting
            authRateLimiter.recordFailedAttempt(identifier, '/api/auth/signin');
            console.warn('Authentication failed: Invalid password', { email: credentials.email });
            return null;
          }

          // Record successful attempt (clears rate limit)
          authRateLimiter.recordSuccessfulAttempt(identifier, '/api/auth/signin');

          // Return user with tenant context (handle migration case)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || 'default-org-migration',
            organizationName: user.organization?.name || 'Default Organization',
          };

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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}; 