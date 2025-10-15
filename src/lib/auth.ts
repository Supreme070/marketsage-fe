import { type NextAuthOptions, getServerSession, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import LinkedInProvider from "next-auth/providers/linkedin";

// Extend NextAuth types for our custom fields
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
    accessToken?: string;
    organizationId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    accessToken?: string;
    organizationId?: string;
  }
}

// Define UserRole enum to match backend schema
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  IT_ADMIN = "IT_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

// ============================================================================
// SECURITY: Validate Required Environment Variables
// ============================================================================
// Fail loudly if critical secrets are missing - no fallbacks allowed

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
  throw new Error(
    '\n' +
    '🔴 CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is missing or too short\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'NEXTAUTH_SECRET must be at least 32 characters long.\n' +
    '\n' +
    'Generate a secure secret:\n' +
    '  openssl rand -base64 32\n' +
    '\n' +
    'Then add to your .env.local file:\n' +
    '  NEXTAUTH_SECRET=<your-generated-secret>\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  );
}

if (!NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  throw new Error(
    '\n' +
    '🔴 CRITICAL SECURITY ERROR: NEXTAUTH_URL is required in production\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'NEXTAUTH_URL must be set to your application URL in production.\n' +
    '\n' +
    'Add to your .env.production file:\n' +
    '  NEXTAUTH_URL=https://app.marketsage.com\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  );
}

// Log startup confirmation (safe - no secrets logged)
console.log('✅ Auth configuration validated successfully');
console.log('   - NEXTAUTH_SECRET: Present and valid length');
console.log('   - NEXTAUTH_URL:', NEXTAUTH_URL || 'Not set (development mode)');

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: UserRole.USER,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          image: profile.picture?.data?.url,
          role: UserRole.USER,
        };
      },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0",
      profile(profile) {
        return {
          id: profile.data.id,
          email: profile.data.email,
          name: profile.data.name,
          image: profile.data.profile_image_url,
          role: UserRole.USER,
        };
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: UserRole.USER,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth: authorize function called with credentials:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('🔐 NextAuth: Missing credentials, returning null');
          return null;
        }

        try {
          // Use frontend proxy for authentication (standard pattern)
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';
          console.log('🔐 NextAuth: Attempting authentication via proxy:', `${apiUrl}/auth/login`);
          console.log('🔐 NextAuth: Credentials:', { email: credentials.email, passwordLength: credentials.password?.length });
          
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          
          console.log('🔐 NextAuth: Backend response status:', response.status);
          
          if (!response.ok) {
            console.warn('🔐 NextAuth: Authentication failed: Invalid credentials', { email: credentials.email });
            return null;
          }

          const result = await response.json();
          console.log('🔐 NextAuth: Backend response data:', JSON.stringify(result, null, 2));
          
          if (!result.success || !result.data?.user) {
            console.warn('🔐 NextAuth: Authentication failed: Invalid response from backend', { email: credentials.email, result });
            return null;
          }

          const user = result.data.user;
          const accessToken = result.data.token || result.token;
          
          console.log('🔐 NextAuth: Authentication successful, returning user:', user);
          
          // Store token in user object for use in callbacks
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image || null,
            accessToken: accessToken,
            organizationId: user.organizationId,
          };
        } catch (error) {
          console.error("🔐 NextAuth: Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'credentials') {
        // Handle OAuth providers - register/login user via backend API
        try {
          // Try to authenticate with backend using OAuth data
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'}/api/v2/auth/oauth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: account?.provider,
              providerId: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // Store backend user data and token
              user.id = result.data.user.id;
              user.role = result.data.user.role;
              user.accessToken = result.data.token;
              user.organizationId = result.data.user.organizationId;
              return true;
            }
          }
          
          // If backend call fails, still allow the login but with limited functionality
          user.role = user.role || UserRole.USER;
          return true;
        } catch (error) {
          console.error('OAuth backend authentication failed:', error);
          // Allow login to continue with limited functionality
          user.role = user.role || UserRole.USER;
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      console.log('🔐 JWT callback - user:', user);
      console.log('🔐 JWT callback - token:', token);
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.name = user.name;
        token.accessToken = user.accessToken;
        token.organizationId = user.organizationId;
        console.log('🔐 JWT callback - updated token:', token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 Session callback - token:', token);
      console.log('🔐 Session callback - session:', session);
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.accessToken = token.accessToken as string;
        session.organizationId = token.organizationId as string;
        console.log('🔐 Session callback - updated session:', session);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
