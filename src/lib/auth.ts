import { type NextAuthOptions, getServerSession, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import LinkedInProvider from "next-auth/providers/linkedin";
import { apiClient } from "@/lib/api-client";

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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
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
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use API client to authenticate with backend
          const response = await apiClient.login(credentials.email, credentials.password);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in user object for use in callbacks
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image || null,
              accessToken: token,
              organizationId: user.organizationId,
            };
          }
          
          return null;
        } catch (error) {
          console.error("Auth error:", error);
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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.name = user.name;
        token.accessToken = user.accessToken;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.accessToken = token.accessToken as string;
        session.organizationId = token.organizationId as string;
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
