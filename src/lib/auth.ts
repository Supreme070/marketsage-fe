import { type NextAuthOptions, getServerSession, type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import LinkedInProvider from "next-auth/providers/linkedin";
// Temporarily comment out bcrypt
// import { compare } from "bcrypt";
import { randomUUID } from "crypto";

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
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// Define UserRole enum to match Prisma schema
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  IT_ADMIN = "IT_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// Development user accounts with correct passwords matching README
const DEV_USERS = [
  { 
    email: "supreme@marketsage.africa", 
    name: "Supreme Admin", 
    role: UserRole.SUPER_ADMIN,
    password: "MS_Super2025!"
  },
  { 
    email: "anita@marketsage.africa", 
    name: "Anita Manager", 
    role: UserRole.ADMIN,
    password: "MS_Admin2025!"
  },
  { 
    email: "kola@marketsage.africa", 
    name: "Kola Techleads", 
    role: UserRole.IT_ADMIN,
    password: "MS_ITAdmin2025!"
  },
  { 
    email: "user@marketsage.africa", 
    name: "Regular User", 
    role: UserRole.USER,
    password: "MS_User2025!"
  }
];

// Test development users with simple passwords
const TEST_USERS = [
  { email: "admin@marketsage.local", password: "password1234" },
  { email: "user@marketsage.local", password: "Password123" },
  { email: "testadmin@marketsage.local", password: "test1234" },
  { email: "test@marketsage.local", password: "password123" }
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0",
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
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
          // Check for development users with specific passwords (from README)
          const devUser = DEV_USERS.find(u => u.email === credentials.email);
          const testUser = TEST_USERS.find(u => u.email === credentials.email);
          
          // First check if it's a development user with matching password
          if (devUser && credentials.password === devUser.password) {
            try {
              // Check if user exists in the database
              let dbUser = await prisma.user.findUnique({
                where: { email: credentials.email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  image: true,
                  password: true
                }
              });
              
              // If not found in DB, create the user
              if (!dbUser) {
                const now = new Date();
                dbUser = await prisma.user.create({
                  data: {
                    id: randomUUID(),
                    email: devUser.email,
                    name: devUser.name,
                    role: devUser.role,
                    password: devUser.password, // Store the actual password
                    createdAt: now,
                    updatedAt: now
                  },
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    image: true,
                    password: true
                  }
                });
              }
              
              if (dbUser) {
                return {
                  id: dbUser.id,
                  email: dbUser.email,
                  name: dbUser.name || devUser.name,
                  role: dbUser.role,
                  image: dbUser.image,
                };
              }
            } catch (err) {
              console.error("Error with dev user:", err);
            }
              
            // Fallback: just return enough user data for auth to work
            return {
              id: "fallback-id-" + Math.random().toString(36).substring(2, 10),
              email: devUser.email,
              name: devUser.name,
              role: devUser.role,
            };
          }
          
          // Next check if it's a test user with matching password
          if (testUser && credentials.password === testUser.password) {
            try {
              // Check if user exists in the database
              const dbUser = await prisma.user.findUnique({
                where: { email: credentials.email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  image: true
                }
              });
              
              if (!dbUser) {
                return null;
              }
              
              return {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                image: dbUser.image,
              };
            } catch (err) {
              console.error("Error with test user:", err);
              return null;
            }
          }
        
          // Regular user login process
          try {
            const user = await prisma.user.findUnique({
              where: {
                email: credentials.email,
              },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                image: true,
                password: true
              }
            });
            
            if (!user || !user.password) {
              return null;
            }

            // For development, bypass bcrypt check and compare directly
            const isPasswordValid = credentials.password === user.password;
            
            if (!isPasswordValid) {
              return null;
            }

            // Update lastLogin timestamp
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
              select: { id: true } // Minimal selection
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
            };
          } catch (err) {
            console.error("Error with regular user login:", err);
            return null;
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
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
